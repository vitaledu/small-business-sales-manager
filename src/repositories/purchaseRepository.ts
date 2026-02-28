import prisma from '@/db/client';

export class PurchaseRepository {
  static async findAll(status?: string) {
    return prisma.purchaseOrder.findMany({
      where: status ? { status } : undefined,
      include: {
        items: {
          include: { product: true }
        }
      },
      orderBy: { date: 'desc' }
    });
  }

  static async findById(id: number) {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true }
        }
      }
    });
  }

  static async create(data: any) {
    return prisma.purchaseOrder.create({
      data: {
        supplierName: data.supplierName,
        date: new Date(data.date),
        totalCostBrl: data.totalCostBrl,
        status: data.status || 'DRAFT',
        items: {
          create: data.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            costUnitBrl: item.costUnitBrl,
            subtotalBrl: item.quantity * item.costUnitBrl
          }))
        }
      },
      include: {
        items: {
          include: { product: true }
        }
      }
    });
  }

  static async update(id: number, data: any) {
    return prisma.purchaseOrder.update({
      where: { id },
      data: {
        supplierName: data.supplierName,
        date: data.date ? new Date(data.date) : undefined,
        totalCostBrl: data.totalCostBrl,
        status: data.status
      },
      include: {
        items: {
          include: { product: true }
        }
      }
    });
  }

  static async finalizePurchase(id: number) {
    const purchase = await this.findById(id);
    if (!purchase) throw new Error('Compra não encontrada');

    for (const item of purchase.items) {
      // Get current stock BEFORE this purchase to calculate weighted average
      const stockResult = await prisma.inventoryMovement.aggregate({
        where: { productId: item.productId },
        _sum: { quantity: true }
      });
      const currentStock = Math.max(0, stockResult._sum.quantity || 0);

      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { costUnit: true }
      });
      const currentCost = product?.costUnit || 0;

      // Custo médio ponderado: (estoque_atual * custo_atual + qtd_nova * custo_novo) / total
      const newAvgCost = currentStock > 0
        ? (currentStock * currentCost + item.quantity * item.costUnitBrl) / (currentStock + item.quantity)
        : item.costUnitBrl;

      await prisma.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: 'IN',
          quantity: item.quantity,
          reason: 'COMPRA',
          referenceId: `PURCHASE_${id}`,
          referenceType: 'PURCHASE'
        }
      });

      await prisma.product.update({
        where: { id: item.productId },
        data: { costUnit: newAvgCost }
      });
    }

    return this.update(id, { status: 'RECEIVED' });
  }

  /**
   * Returns a map of productId → total quantity already reversed for a given purchase.
   * Reads OUT movements with referenceId = PURCHASE_<id>_REVERSAL.
   */
  static async getReversedQuantities(purchaseId: number): Promise<Record<number, number>> {
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        referenceId: `PURCHASE_${purchaseId}_REVERSAL`,
        type: 'OUT'
      }
    });
    const map: Record<number, number> = {};
    for (const m of movements) {
      map[m.productId] = (map[m.productId] || 0) + Math.abs(m.quantity);
    }
    return map;
  }

  /**
   * Cancels a DRAFT purchase (never received — no inventory changes).
   * Hard-deletes the record.
   */
  static async cancelDraft(id: number) {
    const purchase = await this.findById(id);
    if (!purchase) throw new Error('Compra não encontrada');
    if (purchase.status !== 'DRAFT') throw new Error('Apenas compras pendentes (não recebidas) podem ser canceladas');

    await prisma.purchaseItem.deleteMany({ where: { purchaseOrderId: id } });
    return prisma.purchaseOrder.delete({ where: { id } });
  }

  /**
   * Reverses (partially or fully) a received purchase.
   * - Validates against already-reversed quantities so you can't exceed the original amount.
   * - Creates OUT inventory movements for audit trail.
   * - Full reversal (all items fully returned) → status becomes CANCELLED.
   * - Partial reversal → status stays RECEIVED; movements are the audit record.
   * - Does NOT update product costUnit (cost is unchanged by returns).
   */
  static async reverseReceiving(id: number, reversals: Array<{ productId: number; quantity: number }>) {
    const purchase = await this.findById(id);
    if (!purchase) throw new Error('Compra não encontrada');
    if (purchase.status !== 'RECEIVED') throw new Error('Apenas compras já recebidas podem ser estornadas');

    const filtered = reversals.filter(r => r.quantity > 0);
    if (filtered.length === 0) throw new Error('Informe ao menos uma quantidade para estornar');

    // How much has already been reversed for this purchase
    const alreadyReversed = await this.getReversedQuantities(id);

    // Validate: new reversal + already reversed must not exceed original quantity
    for (const reversal of filtered) {
      const original = purchase.items.find(i => i.productId === reversal.productId);
      if (!original) throw new Error('Item não encontrado na compra');
      const prevReversed = alreadyReversed[reversal.productId] || 0;
      const maxReversible = original.quantity - prevReversed;
      if (reversal.quantity > maxReversible) {
        const name = (original as any).product?.name || `produto ${reversal.productId}`;
        throw new Error(
          `Quantidade a estornar (${reversal.quantity}) excede o disponível para estorno (${maxReversible}) em "${name}"`
        );
      }
    }

    // Create OUT inventory movements
    for (const reversal of filtered) {
      await prisma.inventoryMovement.create({
        data: {
          productId: reversal.productId,
          type: 'OUT',
          quantity: -reversal.quantity,
          reason: 'ESTORNO_COMPRA',
          referenceType: 'PURCHASE_REVERSAL',
          referenceId: `PURCHASE_${id}_REVERSAL`,
        }
      });
    }

    // Check if ALL items are now fully reversed (including previous partial reversals)
    const isTotalReversal = purchase.items.every(item => {
      const prev = alreadyReversed[item.productId] || 0;
      const current = filtered.find(r => r.productId === item.productId)?.quantity || 0;
      return (prev + current) >= item.quantity;
    });

    if (isTotalReversal) {
      return this.update(id, { status: 'CANCELLED' });
    }

    return purchase;
  }

  static async delete(id: number) {
    return prisma.purchaseOrder.delete({
      where: { id }
    });
  }
}
