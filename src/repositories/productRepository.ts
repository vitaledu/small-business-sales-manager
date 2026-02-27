import prisma from '@/db/client';
import { IProduct } from '@/types';

export class ProductRepository {
  static async findAll(status?: 'ATIVO' | 'INATIVO', type?: string): Promise<IProduct[]> {
    return prisma.product.findMany({
      where: {
        ...(status && { status }),
        ...(type && { type }),
      },
      orderBy: { name: 'asc' },
    }) as Promise<IProduct[]>;
  }

  static async findById(id: number): Promise<IProduct | null> {
    return prisma.product.findUnique({
      where: { id },
    }) as Promise<IProduct | null>;
  }

  static async create(data: {
    name: string;
    type: string;
    isReturnable?: boolean;
    depositValue?: number;
    costUnit: number;
    priceUnit: number;
    description?: string;
  }): Promise<IProduct> {
    return prisma.product.create({
      data: {
        ...data,
        isReturnable: data.isReturnable ?? false,
      },
    }) as Promise<IProduct>;
  }

  static async update(id: number, data: Partial<Omit<IProduct, 'id' | 'createdAt'>>): Promise<IProduct> {
    return prisma.product.update({
      where: { id },
      data,
    }) as Promise<IProduct>;
  }

  static async delete(id: number): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { status: 'INATIVO' },
    });
  }

  static async hardDelete(id: number): Promise<void> {
    // Check if product has any sale or purchase items — refuse if so
    const saleCount = await prisma.saleItem.count({ where: { productId: id } });
    if (saleCount > 0) {
      throw new Error('Este produto possui vendas registradas e não pode ser deletado. Mantenha-o inativo.');
    }
    const purchaseCount = await prisma.purchaseItem.count({ where: { productId: id } });
    if (purchaseCount > 0) {
      throw new Error('Este produto possui compras registradas e não pode ser deletado. Mantenha-o inativo.');
    }

    // Safe to delete — remove auxiliary records first, then the product
    await prisma.$transaction([
      prisma.returnableLedger.deleteMany({ where: { productId: id } }),
      prisma.inventoryMovement.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);
  }

  static async getWarehouse() {
    // Get total quantity per product from inventory movements
    const movements = await prisma.inventoryMovement.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
    });

    const products = await this.findAll();
    return products.map((product) => {
      const movement = movements.find((m) => m.productId === product.id);
      const qty = movement?._sum.quantity || 0;
      return {
        ...product,
        currentStock: qty,
        totalInventoryValue: qty * product.costUnit,
      };
    });
  }
}
