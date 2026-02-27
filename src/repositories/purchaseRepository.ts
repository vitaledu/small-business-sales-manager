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

    // Update inventory for all items
    for (const item of purchase.items) {
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

      // Update product cost if needed (use incoming cost)
      await prisma.product.update({
        where: { id: item.productId },
        data: { costUnit: item.costUnitBrl }
      });
    }

    // Mark purchase as received
    return this.update(id, { status: 'RECEIVED' });
  }

  static async delete(id: number) {
    return prisma.purchaseOrder.delete({
      where: { id }
    });
  }
}
