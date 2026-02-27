/**
 * Calculation utilities for profit, costs, and inventory
 */

export class CalculationService {
  /**
   * Calculate profit for a sale
   */
  static calculateSaleProfit(items: Array<{ quantity: number; priceUnit: number; costUnit: number }>, discount: number = 0): number {
    let revenue = 0;
    let costs = 0;

    items.forEach((item) => {
      revenue += item.quantity * item.priceUnit;
      costs += item.quantity * item.costUnit;
    });

    return revenue - costs - discount;
  }

  /**
   * Calculate profit by period
   */
  static calculatePeriodProfit(
    sales: Array<{ items: Array<{ quantity: number; priceUnit: number; costUnit: number }>; discountValue: number }>,
    productionCosts: number = 0
  ): { totalRevenue: number; totalCosts: number; totalDiscount: number; netProfit: number } {
    let totalRevenue = 0;
    let totalCosts = 0;
    let totalDiscount = 0;

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        totalRevenue += item.quantity * item.priceUnit;
        totalCosts += item.quantity * item.costUnit;
      });
      totalDiscount += sale.discountValue;
    });

    return {
      totalRevenue,
      totalCosts,
      totalDiscount,
      netProfit: totalRevenue - totalCosts - totalDiscount - productionCosts,
    };
  }

  /**
   * Calculate cost per unit for production batch
   */
  static calculateBatchCostPerUnit(totalCost: number, quantity: number): number {
    if (quantity <= 0) return 0;
    return Number((totalCost / quantity).toFixed(2));
  }

  /**
   * Calculate margin percentage
   */
  static calculateMargin(revenue: number, cost: number): number {
    if (revenue === 0) return 0;
    return Number(((revenue - cost) / revenue * 100).toFixed(2));
  }

  /**
   * Format currency BRL
   */
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}
