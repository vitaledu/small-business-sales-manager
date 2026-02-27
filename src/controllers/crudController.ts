import { Request, Response } from 'express';
import * as ejs from 'ejs';
import * as path from 'path';
import { ProductRepository } from '@/repositories/productRepository';
import { CustomerRepository } from '@/repositories/customerRepository';
import { PurchaseRepository } from '@/repositories/purchaseRepository';
import { ProductionBatchRepository } from '@/repositories/productionBatchRepository';
import { SaleRepository } from '@/repositories/saleRepository';
import { ReturnableRepository } from '@/repositories/returnableRepository';
import { ReportRepository } from '@/repositories/reportRepository';
import { config } from '@/config';

const renderLayout = async (res: Response, view: string, data: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    const viewPath = path.join(process.cwd(), 'src', 'views', `${view}.ejs`);
    ejs.renderFile(viewPath, data, {}, (err: any, html: string) => {
      if (err) reject(err);
      else resolve(html);
    });
  });
};

// ========== DASHBOARD ==========
export class CrudController {
  static async dashboard(req: Request, res: Response) {
    try {
      const warehouse = await ProductRepository.getWarehouse();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const sales = await SaleRepository.findByDateRange(today, tomorrow);
      const customers = await CustomerRepository.findAll('ATIVO');
      
      let dailyRevenue = 0, dailyCost = 0;
      sales.forEach(sale => {
        sale.items.forEach(item => {
          dailyRevenue += item.quantity * item.priceUnitBrl;
          dailyCost += item.quantity * item.product.costUnit;
        });
      });
      
      const dailyProfit = dailyRevenue - dailyCost;
      
      const body = await renderLayout(res, 'dashboard', {
        dailyRevenue: isNaN(dailyRevenue) ? 0 : dailyRevenue,
        dailyCost: isNaN(dailyCost) ? 0 : dailyCost,
        dailyProfit: isNaN(dailyProfit) ? 0 : dailyProfit,
        lowStockCount: warehouse.filter(p => p.currentStock < 10).length,
        outstandingReturnables: customers.filter(c => c.outstandingReturnableDepo > 0).length
      });
      
      res.render('layout/main', { title: 'Dashboard', body });
    } catch (error: any) {
      console.error('Dashboard Error:', error);
      const body = `<div class="alert alert-error">Erro: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Dashboard', body });
    }
  }

  // ========== PRODUCTS ==========
  static async productsList(req: Request, res: Response) {
    try {
      const products = await ProductRepository.getWarehouse();
      const body = await renderLayout(res, 'modules/products-list', { products });
      res.render('layout/main', { title: 'Produtos', body });
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Produtos', body });
    }
  }

  static async productsNewForm(req: Request, res: Response) {
    try {
      const body = await renderLayout(res, 'modules/product-form', { product: null });
      res.render('layout/main', { title: 'Novo Produto', body });
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Novo Produto', body });
    }
  }

  static async productsCreate(req: Request, res: Response) {
    try {
      const { name, type, costUnit, priceUnit, isReturnable, depositValue } = req.body;

      if (!name || !type || !costUnit || !priceUnit) {
        return res.status(400).render('layout/main', {
          title: 'Novo Produto',
          body: '<div class="alert alert-error">Preencha todos os campos obrigatórios</div>'
        });
      }

      const returnable = isReturnable === 'on';
      await ProductRepository.create({
        name,
        type,
        costUnit: parseFloat(costUnit),
        priceUnit: parseFloat(priceUnit),
        isReturnable: returnable,
        depositValue: returnable ? parseFloat(depositValue || '5') : 0,
        description: req.body.description || ''
      });

      res.redirect('/produtos');
    } catch (error: any) {
      res.status(400).render('layout/main', {
        title: 'Novo Produto',
        body: `<div class="alert alert-error">Erro: ${error.message}</div>`
      });
    }
  }

  static async productsEditForm(req: Request, res: Response) {
    try {
      const product = await ProductRepository.findById(parseInt(req.params.id));
      if (!product) {
        return res.status(404).render('layout/main', {
          title: 'Editar Produto',
          body: '<div class="alert alert-error">Produto não encontrado</div>'
        });
      }

      const body = await renderLayout(res, 'modules/product-form', { product });
      res.render('layout/main', { title: 'Editar Produto', body });
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Editar Produto', body });
    }
  }

  static async productsUpdate(req: Request, res: Response) {
    try {
      const returnable = req.body.isReturnable === 'on';
      await ProductRepository.update(parseInt(req.params.id), {
        name: req.body.name,
        type: req.body.type,
        costUnit: parseFloat(req.body.costUnit),
        priceUnit: parseFloat(req.body.priceUnit),
        isReturnable: returnable,
        depositValue: returnable ? parseFloat(req.body.depositValue || '5') : 0,
      });

      res.redirect('/produtos');
    } catch (error: any) {
      res.status(400).render('layout/main', {
        title: 'Editar Produto',
        body: `<div class="alert alert-error">Erro: ${error.message}</div>`
      });
    }
  }

  static async productsInactivate(req: Request, res: Response) {
    try {
      await ProductRepository.update(parseInt(req.params.id), { status: 'INATIVO' });
      res.redirect('/produtos');
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro ao inativar produto: ${error.message}</div>`;
      res.status(400).render('layout/main', { title: 'Produtos', body });
    }
  }

  static async productsReactivate(req: Request, res: Response) {
    try {
      await ProductRepository.update(parseInt(req.params.id), { status: 'ATIVO' });
      res.redirect('/produtos');
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro ao reativar produto: ${error.message}</div>`;
      res.status(400).render('layout/main', { title: 'Produtos', body });
    }
  }

  static async productsDelete(req: Request, res: Response) {
    try {
      await ProductRepository.hardDelete(parseInt(req.params.id));
      res.redirect('/produtos');
    } catch (error: any) {
      const body = `<div class="alert alert-error">Não foi possível deletar: ${error.message}</div>`;
      res.status(400).render('layout/main', { title: 'Produtos', body });
    }
  }

  // ========== CUSTOMERS ==========
  static async customersList(req: Request, res: Response) {
    try {
      const customers = await CustomerRepository.findAll();
      const body = await renderLayout(res, 'modules/customers-list', { customers });
      res.render('layout/main', { title: 'Clientes', body });
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Clientes', body });
    }
  }

  static async customersNewForm(req: Request, res: Response) {
    try {
      const body = await renderLayout(res, 'modules/customer-form', { customer: null });
      res.render('layout/main', { title: 'Novo Cliente', body });
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Novo Cliente', body });
    }
  }

  static async customersCreate(req: Request, res: Response) {
    try {
      const { name, type, phone, address, neighborhood } = req.body;
      
      if (!name || !type) {
        return res.status(400).render('layout/main', {
          title: 'Novo Cliente',
          body: '<div class="alert alert-error">Nome e tipo são obrigatórios</div>'
        });
      }

      await CustomerRepository.create({
        name,
        type,
        phone: phone || null,
        address: address || null,
        neighborhood: neighborhood || null
      });

      res.redirect('/clientes');
    } catch (error: any) {
      res.status(400).render('layout/main', {
        title: 'Novo Cliente',
        body: `<div class="alert alert-error">Erro: ${error.message}</div>`
      });
    }
  }

  static async customersEditForm(req: Request, res: Response) {
    try {
      const customer = await CustomerRepository.findById(parseInt(req.params.id));
      if (!customer) {
        return res.status(404).render('layout/main', {
          title: 'Editar Cliente',
          body: '<div class="alert alert-error">Cliente não encontrado</div>'
        });
      }

      const body = await renderLayout(res, 'modules/customer-form', { customer });
      res.render('layout/main', { title: 'Editar Cliente', body });
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Editar Cliente', body });
    }
  }

  static async customersUpdate(req: Request, res: Response) {
    try {
      await CustomerRepository.update(parseInt(req.params.id), {
        name: req.body.name,
        type: req.body.type,
        phone: req.body.phone || null,
        address: req.body.address || null,
        neighborhood: req.body.neighborhood || null
      });

      res.redirect('/clientes');
    } catch (error: any) {
      res.status(400).render('layout/main', {
        title: 'Editar Cliente',
        body: `<div class="alert alert-error">Erro: ${error.message}</div>`
      });
    }
  }

  static async customersDelete(req: Request, res: Response) {
    try {
      // Soft delete by marking as inactive
      await CustomerRepository.update(parseInt(req.params.id), { status: 'INATIVO' });
      res.redirect('/clientes');
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro ao remover cliente: ${error.message}</div>`;
      res.status(400).render('layout/main', { title: 'Clientes', body });
    }
  }

  // ========== PURCHASES ==========
  static async purchasesList(req: Request, res: Response) {
    try {
      const purchases = await PurchaseRepository.findAll();
      const body = await renderLayout(res, 'modules/purchases-list', { purchases });
      res.render('layout/main', { title: 'Compras', body });
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Compras', body });
    }
  }

  static async purchasesNewForm(req: Request, res: Response) {
    try {
      const products = await ProductRepository.findAll('ATIVO');
      const body = await renderLayout(res, 'modules/purchase-form', { purchase: null, products });
      res.render('layout/main', { title: 'Nova Compra', body });
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Nova Compra', body });
    }
  }

  static async purchasesCreate(req: Request, res: Response) {
    try {
      const { supplierName, date } = req.body;
      // Normalize to arrays — Express sends a string when only 1 row is submitted
      const productIds: string[] = [].concat(req.body.productIds).filter(Boolean);
      const quantities: string[] = [].concat(req.body.quantities);
      const costs: string[]      = [].concat(req.body.costs);

      if (productIds.length === 0) {
        const products = await ProductRepository.findAll('ATIVO');
        const body = await renderLayout(res, 'modules/purchase-form', { products, purchase: null, errorMsg: 'Adicione ao menos um item' });
        return res.status(400).render('layout/main', { title: 'Nova Compra', body });
      }

      const items = productIds.map((pid: string, idx: number) => ({
        productId: parseInt(pid),
        quantity: parseFloat(quantities[idx]),
        costUnitBrl: parseFloat(costs[idx])
      }));

      const totalCostBrl = items.reduce((sum: number, item: any) => sum + (item.quantity * item.costUnitBrl), 0);

      await PurchaseRepository.create({
        supplierName: supplierName || 'Genérica',
        date,
        totalCostBrl,
        items
      });

      res.redirect('/compras');
    } catch (error: any) {
      res.status(400).render('layout/main', {
        title: 'Nova Compra',
        body: `<div class="alert alert-error">Erro: ${error.message}</div>`
      });
    }
  }

  static async purchasesFinalize(req: Request, res: Response) {
    try {
      await PurchaseRepository.finalizePurchase(parseInt(req.params.id));
      res.redirect('/compras');
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro ao finalizar compra: ${error.message}</div>`;
      res.status(400).render('layout/main', { title: 'Compras', body });
    }
  }

  static async purchasesDelete(req: Request, res: Response) {
    try {
      await PurchaseRepository.delete(parseInt(req.params.id));
      res.redirect('/compras');
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro ao deletar compra: ${error.message}</div>`;
      res.status(400).render('layout/main', { title: 'Compras', body });
    }
  }

  // ========== PRODUCTION BATCHES ==========
  static async batchesList(req: Request, res: Response) {
    try {
      const batches = await ProductionBatchRepository.findAll();
      const products = await ProductRepository.findAll('ATIVO');
      const body = await renderLayout(res, 'modules/batches-list', { batches, products });
      res.render('layout/main', { title: 'Lotes de Produção', body });
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Lotes de Produção', body });
    }
  }

  static async batchesNewForm(req: Request, res: Response) {
    try {
      const body = await renderLayout(res, 'modules/batch-form', { batch: null });
      res.render('layout/main', { title: 'Novo Lote', body });
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Novo Lote', body });
    }
  }

  static async batchesCreate(req: Request, res: Response) {
    try {
      const { description, date, totalCostBrl, quantityProduced } = req.body;
      
      if (!description || !date || !totalCostBrl || !quantityProduced) {
        return res.status(400).render('layout/main', {
          title: 'Novo Lote',
          body: '<div class="alert alert-error">Preencha todos os campos obrigatórios</div>'
        });
      }

      await ProductionBatchRepository.create({
        description,
        date,
        totalCostBrl: parseFloat(totalCostBrl),
        quantityProduced: parseInt(quantityProduced)
      });

      res.redirect('/lotes');
    } catch (error: any) {
      res.status(400).render('layout/main', {
        title: 'Novo Lote',
        body: `<div class="alert alert-error">Erro: ${error.message}</div>`
      });
    }
  }

  static async batchesComplete(req: Request, res: Response) {
    try {
      const { productId } = req.body;
      if (!productId) {
        const body = `<div class="alert alert-error">Selecione o produto para carregar o lote</div>`;
        return res.status(400).render('layout/main', { title: 'Lotes', body });
      }
      await ProductionBatchRepository.completeBatch(parseInt(req.params.id), parseInt(productId));
      res.redirect('/lotes');
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro ao finalizar lote: ${error.message}</div>`;
      res.status(400).render('layout/main', { title: 'Lotes', body });
    }
  }

  static async batchesDelete(req: Request, res: Response) {
    try {
      await ProductionBatchRepository.delete(parseInt(req.params.id));
      res.redirect('/lotes');
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro ao deletar lote: ${error.message}</div>`;
      res.status(400).render('layout/main', { title: 'Lotes', body });
    }
  }

  // ========== SALES ==========
  static async salesList(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      let dateStart: Date;
      let dateEnd: Date;

      if (startDate && endDate) {
        dateStart = new Date(startDate as string);
        dateEnd = new Date(endDate as string);
        dateEnd.setHours(23, 59, 59, 999);
      } else {
        const today = new Date();
        dateStart = new Date(today);
        dateStart.setHours(0, 0, 0, 0);
        dateEnd = new Date(today);
        dateEnd.setHours(23, 59, 59, 999);
      }

      const sales = await SaleRepository.findByDateRange(dateStart, dateEnd);
      const body = await renderLayout(res, 'modules/sales-list', {
        sales,
        startDate: dateStart.toISOString().split('T')[0],
        endDate: dateEnd.toISOString().split('T')[0]
      });
      res.render('layout/main', { title: 'Vendas', body });
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Vendas', body });
    }
  }

  static async salesNew(req: Request, res: Response) {
    try {
      const customers = await CustomerRepository.findAll('ATIVO');
      const products = await ProductRepository.findAll('ATIVO');
      const success = req.query.success === 'true';
      const body = await renderLayout(res, 'modules/sale-form', {
        customers,
        products,
        success,
        depositValue: config.returnableDepositValue
      });
      res.render('layout/main', { title: 'Nova Venda', body });
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Nova Venda', body });
    }
  }

  static async salesCreate(req: Request, res: Response) {
    try {
      const { customerId, paymentMethod, discount, cardFeeRate, cardFeeType } = req.body;
      // Normalize to arrays — Express sends a string when only 1 row is submitted
      const productIds: string[]     = [].concat(req.body.productIds).filter(Boolean);
      const quantities: string[]     = [].concat(req.body.quantities);
      const prices: string[]         = [].concat(req.body.prices);
      const depositEnabled: string[] = [].concat(req.body.depositEnabled || []).map((v: any) => String(v));

      if (!customerId || productIds.length === 0) {
        return res.status(400).render('layout/main', {
          title: 'Nova Venda',
          body: '<div class="alert alert-error">Cliente e ao menos um produto são obrigatórios</div>'
        });
      }

      const items = productIds.map((pid: string, idx: number) => ({
        productId: parseInt(pid),
        quantity: parseInt(quantities[idx]),
        priceUnitBrl: parseFloat(prices[idx]),
        discountPct: 0,
        subtotalBrl: parseInt(quantities[idx]) * parseFloat(prices[idx])
      }));

      const totalBrl      = items.reduce((sum: number, item: any) => sum + item.subtotalBrl, 0);
      const discountPct   = parseFloat(discount || '0');
      const discountValue = (totalBrl * discountPct) / 100;
      const afterDiscount = totalBrl - discountValue;

      // Card fee — supports percentage (PCT) or fixed BRL amount (BRL)
      const isCard     = (paymentMethod || 'DINHEIRO') === 'CARTÃO';
      const feeType    = cardFeeType || 'PCT';
      const feeRate    = isCard ? parseFloat(cardFeeRate || '0') : 0;
      const cardFeeValue = isCard
        ? (feeType === 'PCT' ? (afterDiscount * feeRate) / 100 : feeRate)
        : 0;

      // Returnable deposit — only for items where the user explicitly enabled it
      let returnableDepositCharged = 0;
      for (let i = 0; i < productIds.length; i++) {
        if (depositEnabled[i] === '1') {
          const product = await ProductRepository.findById(parseInt(productIds[i]));
          if (product && product.isReturnable) {
            const depVal = product.depositValue ?? config.returnableDepositValue;
            returnableDepositCharged += parseInt(quantities[i]) * depVal;
          }
        }
      }

      const finalTotalBrl = afterDiscount + cardFeeValue + returnableDepositCharged;

      await SaleRepository.create({
        customerId: parseInt(customerId),
        items,
        totalBrl,
        discountPct,
        discountValue,
        finalTotalBrl,
        paymentMethod: paymentMethod || 'DINHEIRO',
        returnableDepositCharged,
        payments: [{
          method: paymentMethod || 'DINHEIRO',
          amountBrl: finalTotalBrl
        }]
      });

      // Record returnable bottle movement only for items with deposit enabled
      for (let i = 0; i < productIds.length; i++) {
        if (depositEnabled[i] === '1') {
          const product = await ProductRepository.findById(parseInt(productIds[i]));
          if (product && product.isReturnable) {
            await ReturnableRepository.recordSale(
              parseInt(customerId),
              parseInt(productIds[i]),
              parseInt(quantities[i])
            );
          }
        }
      }

      res.redirect('/vendas/nova?success=true');
    } catch (error: any) {
      res.status(400).render('layout/main', {
        title: 'Nova Venda',
        body: `<div class="alert alert-error">Erro: ${error.message}</div>`
      });
    }
  }

  // ========== RETURNABLES ==========
  static async returnablesList(req: Request, res: Response) {
    try {
      const outstanding = await ReturnableRepository.getOutstanding();
      const body = await renderLayout(res, 'modules/returnables-list', { outstanding });
      res.render('layout/main', { title: 'Devoluções', body });
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Devoluções', body });
    }
  }

  static async returnableRegister(req: Request, res: Response) {
    try {
      const { customerId, productId, quantityReturned } = req.body;

      if (!customerId || !productId || !quantityReturned) {
        const outstanding = await ReturnableRepository.getOutstanding();
        const body = await renderLayout(res, 'modules/returnables-list', {
          outstanding,
          errorMsg: 'Preencha todos os campos para registrar a devolução'
        });
        return res.status(400).render('layout/main', { title: 'Devoluções', body });
      }

      await ReturnableRepository.recordReturn(
        parseInt(customerId),
        parseInt(productId),
        parseFloat(quantityReturned)
      );

      res.redirect('/devolucoes');
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro ao registrar devolução: ${error.message}</div>`;
      res.status(400).render('layout/main', { title: 'Devoluções', body });
    }
  }

  // ========== REPORTS ==========
  static async reports(req: Request, res: Response) {
    try {
      // Get date range from query parameters
      const { startDate, endDate } = req.query;
      
      let dateStart: Date;
      let dateEnd: Date;
      
      if (startDate && endDate) {
        // Parse provided dates
        dateStart = new Date(startDate as string);
        dateEnd = new Date(endDate as string);
        // Ensure end date includes the entire day
        dateEnd.setHours(23, 59, 59, 999);
      } else {
        // Default to today
        const today = new Date();
        dateStart = new Date(today);
        dateStart.setHours(0, 0, 0, 0);
        dateEnd = new Date(today);
        dateEnd.setHours(23, 59, 59, 999);
      }
      
      const profit = await ReportRepository.getProfitByDateRange(dateStart, dateEnd);
      const bestSellers = await ReportRepository.getBestSellers(dateStart, dateEnd, 10);
      
      const body = await renderLayout(res, 'modules/reports', { 
        profit, 
        bestSellers,
        startDate: dateStart.toISOString().split('T')[0],
        endDate: dateEnd.toISOString().split('T')[0]
      });
      res.render('layout/main', { title: 'Relatórios', body });
    } catch (error: any) {
      const body = `<div class="alert alert-error">Erro: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Relatórios', body });
    }
  }
}
