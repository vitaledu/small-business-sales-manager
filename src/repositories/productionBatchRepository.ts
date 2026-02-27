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

    // Record inventory movement
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

    // Mark batch as completed
    return this.update(id, { status: 'COMPLETED' });
  }

  static async delete(id: number) {
    return prisma.productionBatch.delete({
      where: { id }
    });
  }
}
