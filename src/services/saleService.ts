import { ProductRepository } from '@/repositories/productRepository';
import { SaleRepository } from '@/repositories/saleRepository';
import { ReturnableRepository } from '@/repositories/returnableRepository';
import { ICreateSaleRequest } from '@/types';

export class SaleService {
  static async createSale(request: ICreateSaleRequest) {
    // Validate customer exists
    const { CustomerRepository } = await import('@/repositories/customerRepository');
    const customer = await CustomerRepository.findById(request.customerId);
    if (!customer) {
      throw new Error('Cliente não encontrado');
    }

   // Validate products and stock
    let totalBrl = 0;
    let totalDeposit = 0;
    const itemsWithProduct = [];

    for (const item of request.items) {
      const product = await ProductRepository.findById(item.productId);
      if (!product) {
        throw new Error(`Produto ${item.productId} não encontrado`);
      }

      // Check inventory (simplified - use repository method)
      const warehouse = await ProductRepository.getWarehouse();
      const stock = warehouse.find((w) => w.id === item.productId);
      if (!stock || stock.currentStock < item.quantity) {
        throw new Error(`Estoque insuficiente para ${product.name}. Disponível: ${stock?.currentStock || 0}`);
      }

      const subtotal = item.quantity * item.priceUnitBrl;
      const discount = subtotal * (item.discountPct || 0) / 100;
      const itemTotal = subtotal - discount;
      totalBrl += itemTotal;

      if (product.isReturnable) {
        totalDeposit += item.quantity * 5.0; // Hardcoded for now, use config later
      }

      itemsWithProduct.push({
        ...item,
        product,
        discount,
      });
    }

    // Calculate final totals
    const discountTotal = request.discountValue || 0;
    const finalTotal = totalBrl - discountTotal;

    // Create sale transaction
    const sale = await SaleRepository.create({
      customerId: request.customerId,
      totalBrl,
      discountPct: 0,
      discountValue: discountTotal,
      finalTotalBrl: finalTotal,
      paymentMethod: request.paymentMethod,
      returnableDepositCharged: totalDeposit,
      items: request.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        priceUnitBrl: item.priceUnitBrl,
        discountPct: item.discountPct || 0,
        subtotalBrl: item.quantity * item.priceUnitBrl * (1 - (item.discountPct || 0) / 100),
      })),
      payments: [
        {
          method: request.paymentMethod,
          amountBrl: finalTotal,
        },
      ],
    });

    // Record inventory changes
    for (const item of request.items) {
      await SaleRepository.recordInventoryChange(item.productId, item.quantity, 'VENDA', sale.id);

      // Record returnable if applicable
      const product = itemsWithProduct.find((ip) => ip.product.id === item.productId)?.product;
      if (product?.isReturnable) {
        await ReturnableRepository.recordSale(request.customerId, item.productId, item.quantity);
      }
    }

    // Record audit log
    const { AuditRepository } = await import('@/repositories/auditRepository');
    await AuditRepository.log('SALE', 'SALE_ORDER', sale.id, {
      customerId: request.customerId,
      total: finalTotal,
      paymentMethod: request.paymentMethod,
      itemCount: request.items.length,
    });

    return sale;
  }
}
