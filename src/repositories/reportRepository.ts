import prisma from '@/db/client';
import { ProductRepository } from './productRepository';
import { CalculationService } from '@/utils/calculation';

export class ReportRepository {
  static async getProfitByDateRange(startDate: Date, endDate: Date) {
    const sales = await prisma.saleOrder.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'FINALIZADA',
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    let totalRevenue = 0;
    let totalCosts = 0;
    let totalDiscount = 0;

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        totalRevenue += item.quantity * item.priceUnitBrl;
        totalCosts += item.quantity * item.product.costUnit;
      });
      totalDiscount += sale.discountValue;
    });

    return {
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      totalRevenue,
      totalCosts,
      totalDiscount,
      netProfit: totalRevenue - totalCosts - totalDiscount,
      marginPct: CalculationService.calculateMargin(totalRevenue, totalCosts),
      transactionsCount: sales.length,
    };
  }

  static async getBestSellers(startDate: Date, endDate: Date, limit: number = 10) {
    const sales = await prisma.saleOrder.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        status: 'FINALIZADA',
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    const productStats: Record<
      number,
      {
        productId: number;
        productName: string;
        qtySold: number;
        totalRevenue: number;
        totalCost: number;
      }
    > = {};

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            productId: item.productId,
            productName: item.product.name,
            qtySold: 0,
            totalRevenue: 0,
            totalCost: 0,
          };
        }
        productStats[item.productId].qtySold += item.quantity;
        productStats[item.productId].totalRevenue += item.quantity * item.priceUnitBrl;
        productStats[item.productId].totalCost += item.quantity * item.product.costUnit;
      });
    });

    return Object.values(productStats)
      .map((stat) => ({
        ...stat,
        profit: stat.totalRevenue - stat.totalCost,
        marginPct: CalculationService.calculateMargin(stat.totalRevenue, stat.totalCost),
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, limit);
  }

  static async getInventoryValuation() {
    const warehouse = await ProductRepository.getWarehouse();
    const totalValue = warehouse.reduce((sum, item) => sum + item.totalInventoryValue, 0);

    return {
      timestamp: new Date().toISOString(),
      products: warehouse,
      totalInventoryValue: totalValue,
    };
  }
}
