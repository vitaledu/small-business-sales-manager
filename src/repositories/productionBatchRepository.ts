import prisma from '@/db/client';

export class ProductionBatchRepository {
  static async findAll(status?: string) {
    return prisma.productionBatch.findMany({
      where: status ? { status } : undefined,
      orderBy: { date: 'desc' }
    });
  }

  static async findById(id: number) {
    return prisma.productionBatch.findUnique({
      where: { id }
    });
  }

  static async create(data: any) {
    const costPerUnit = data.totalCostBrl / data.quantityProduced;
    
    return prisma.productionBatch.create({
      data: {
        description: data.description,
        date: new Date(data.date),
        totalCostBrl: data.totalCostBrl,
        quantityProduced: data.quantityProduced,
        costPerUnit,
        status: 'DRAFT',
        ingredients: data.ingredients ? JSON.stringify(data.ingredients) : null
      }
    });
  }

  static async update(id: number, data: any) {
    const costPerUnit = data.totalCostBrl && data.quantityProduced 
      ? data.totalCostBrl / data.quantityProduced 
      : undefined;

    return prisma.productionBatch.update({
      where: { id },
      data: {
        description: data.description,
        date: data.date ? new Date(data.date) : undefined,
        totalCostBrl: data.totalCostBrl,
        quantityProduced: data.quantityProduced,
        costPerUnit,
        status: data.status,
        ingredients: data.ingredients ? JSON.stringify(data.ingredients) : undefined
      }
    });
  }

  static async completeBatch(id: number, productId: number) {
    const batch = await this.findById(id);
    if (!batch) throw new Error('Lote não encontrado');

    // Get current stock BEFORE this batch to calculate weighted average
    const stockResult = await prisma.inventoryMovement.aggregate({
      where: { productId },
      _sum: { quantity: true }
    });
    const currentStock = Math.max(0, stockResult._sum.quantity || 0);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { costUnit: true }
    });
    const currentCost = product?.costUnit || 0;
    const batchCostPerUnit = batch.costPerUnit || 0;

    // Custo médio ponderado: (estoque_atual * custo_atual + qtd_lote * custo_lote) / total
    const newAvgCost = currentStock > 0
      ? (currentStock * currentCost + batch.quantityProduced * batchCostPerUnit) / (currentStock + batch.quantityProduced)
      : batchCostPerUnit;

    // Registra entrada no estoque
    await prisma.inventoryMovement.create({
      data: {
        productId,
        type: 'IN',
        quantity: batch.quantityProduced,
        reason: 'PRODUÇÃO',
        referenceId: `BATCH_${id}`,
        referenceType: 'BATCH'
      }
    });

    // Atualiza custo do produto com média ponderada
    await prisma.product.update({
      where: { id: productId },
      data: { costUnit: newAvgCost }
    });

    return this.update(id, { status: 'COMPLETED' });
  }

  static async delete(id: number) {
    // Se o lote foi concluído, remove também a movimentação de estoque gerada por ele
    await prisma.inventoryMovement.deleteMany({
      where: { referenceId: `BATCH_${id}`, referenceType: 'BATCH' }
    });

    return prisma.productionBatch.delete({
      where: { id }
    });
  }
}
