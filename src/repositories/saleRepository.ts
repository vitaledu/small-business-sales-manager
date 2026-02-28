import prisma from '@/db/client';
import { ISaleOrder } from '@/types';

export class SaleRepository {
  static async create(data: {
    customerId: number;
    totalBrl: number;
    discountPct: number;
    discountValue: number;
    finalTotalBrl: number;
    paymentMethod: string;
    returnableDepositCharged?: number;
    items: Array<{
      productId: number;
      quantity: number;
      priceUnitBrl: number;
      discountPct: number;
      subtotalBrl: number;
    }>;
    payments: Array<{
      method: string;
      amountBrl: number;
    }>;
  }) {
    const sale = await prisma.saleOrder.create({
      data: {
        customerId: data.customerId,
        totalBrl: data.totalBrl,
        discountPct: data.discountPct,
        discountValue: data.discountValue,
        finalTotalBrl: data.finalTotalBrl,
        paymentMethod: data.paymentMethod,
        returnableDepositCharged: data.returnableDepositCharged || 0,
        status: 'FINALIZADA',
        items: {
          create: data.items,
        },
        payments: {
          create: data.payments.map((p) => ({
            ...p,
            status: 'DONE',
          })),
        },
      },
      include: {
        items: true,
        payments: true,
      },
    });

    return sale;
  }

  static async findById(id: number) {
    return prisma.saleOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
        payments: true,
        customer: true,
      },
    });
  }

  static async findByDateRange(startDate: Date, endDate: Date) {
    return prisma.saleOrder.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        status: { in: ['FINALIZADA', 'CANCELADA'] },
      },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  static async findByCustomer(customerId: number) {
    return prisma.saleOrder.findMany({
      where: { customerId, status: 'FINALIZADA' },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  static async recordInventoryChange(productId: number, quantity: number, reason: string, saleId: number) {
    return prisma.inventoryMovement.create({
      data: {
        productId,
        type: 'OUT',
        quantity: -quantity,
        reason,
        referenceType: 'SALE',
        referenceId: saleId.toString(),
      },
    });
  }

  static async restoreInventory(productId: number, quantity: number, saleId: number) {
    return prisma.inventoryMovement.create({
      data: {
        productId,
        type: 'IN',
        quantity: quantity,
        reason: 'CANCELAMENTO',
        referenceType: 'SALE',
        referenceId: saleId.toString(),
      },
    });
  }

  static async cancel(id: number) {
    return prisma.saleOrder.update({
      where: { id },
      data: { status: 'CANCELADA' },
    });
  }
}
