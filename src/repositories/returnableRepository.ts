import prisma from '@/db/client';
import { config } from '@/config';

export class ReturnableRepository {
  static async getOutstanding(customerId?: number) {
    return prisma.returnableLedger.findMany({
      where: {
        ...(customerId && { customerId }),
        quantityPending: { gt: 0 },
      },
      include: {
        customer: true,
        product: true,
      },
    });
  }

  static async recordReturn(customerId: number, productId: number, quantityReturned: number) {
    const ledger = await prisma.returnableLedger.findUnique({
      where: {
        customerId_productId: { customerId, productId },
      },
    });

    if (!ledger) {
      throw new Error('Nenhuma garrafa registrada para este cliente e produto');
    }

    if (quantityReturned > ledger.quantityPending) {
      throw new Error('Quantidade retornada não pode exceder a quantidade pendente');
    }

    const newPending = ledger.quantityPending - quantityReturned;
    const depositRefunded = quantityReturned * config.returnableDepositValue;

    const updated = await prisma.returnableLedger.update({
      where: { id: ledger.id },
      data: {
        quantityReturned: ledger.quantityReturned + quantityReturned,
        quantityPending: newPending,
        depositValueTotal: newPending * config.returnableDepositValue,
      },
    });

    // Update customer outstanding deposit
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        outstandingReturnableDepo: {
          decrement: depositRefunded,
        },
      },
    });

    // Record in audit log
    await prisma.auditLog.create({
      data: {
        action: 'RETURN',
        entityType: 'RETURNABLE_LEDGER',
        entityId: ledger.id,
        details: JSON.stringify({
          customerId,
          productId,
          quantityReturned,
          depositRefunded,
        }),
      },
    });

    return updated;
  }

  static async recordSale(customerId: number, productId: number, quantity: number) {
    const existingLedger = await prisma.returnableLedger.findUnique({
      where: {
        customerId_productId: { customerId, productId },
      },
    });

    const totalDeposit = quantity * config.returnableDepositValue;

    if (existingLedger) {
      // Update existing ledger
      const updated = await prisma.returnableLedger.update({
        where: { id: existingLedger.id },
        data: {
          quantityOut: { increment: quantity },
          quantityPending: { increment: quantity },
          depositValueTotal: {
            increment: totalDeposit,
          },
        },
      });

      // Update customer deposit
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          outstandingReturnableDepo: {
            increment: totalDeposit,
          },
        },
      });

      return updated;
    } else {
      // Create new ledger
      const newLedger = await prisma.returnableLedger.create({
        data: {
          customerId,
          productId,
          quantityOut: quantity,
          quantityReturned: 0,
          quantityPending: quantity,
          depositValueTotal: totalDeposit,
        },
      });

      // Update customer deposit
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          outstandingReturnableDepo: {
            increment: totalDeposit,
          },
        },
      });

      return newLedger;
    }
  }
}
