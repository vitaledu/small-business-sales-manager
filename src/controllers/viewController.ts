import { Request, Response } from 'express';
import * as ejs from 'ejs';
import * as path from 'path';
import { ProductRepository } from '@/repositories/productRepository';
import { CustomerRepository } from '@/repositories/customerRepository';
import { SaleRepository } from '@/repositories/saleRepository';
import { ReturnableRepository } from '@/repositories/returnableRepository';
import { ReportRepository } from '@/repositories/reportRepository';

// Helper to render a partial template to a string
const renderPartial = async (view: string, data: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    const viewPath = path.join(process.cwd(), 'src', 'views', `${view}.ejs`);
    ejs.renderFile(viewPath, data, {}, (err, html) => {
      if (err) reject(err);
      else resolve(html);
    });
  });
};

export class ViewController {
  static async dashboard(req: Request, res: Response) {
    try {
      const warehouse = await ProductRepository.getWarehouse();
      const customers = await CustomerRepository.findAll('ATIVO');
      
      // Get today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const sales = await SaleRepository.findByDateRange(today, tomorrow);
      
      let dailyRevenue = 0;
      let dailyCost = 0;
      
      sales.forEach(sale => {
        sale.items.forEach(item => {
          dailyRevenue += item.quantity * item.priceUnitBrl;
          dailyCost += item.quantity * item.product.costUnit;
        });
      });
      
      const dailyProfit = dailyRevenue - dailyCost;
      
      const body = await renderPartial('dashboard', {
        products: warehouse,
        customers,
        sales,
        dailyRevenue,
        dailyCost,
        dailyProfit,
        lowStockCount: warehouse.filter(p => p.currentStock < 10).length,
        outstandingReturnables: customers.filter(c => c.outstandingReturnableDepo > 0).length
      });
      
      res.render('layout/main', { title: 'Dashboard', body });
    } catch (error: any) {
      const body = `<div class="card alert alert-error">Erro ao carregar dashboard: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Dashboard', body });
    }
  }

  static async produtos(req: Request, res: Response) {
    try {
      const warehouse = await ProductRepository.getWarehouse();
      
      const body = await renderPartial('products/list', { products: warehouse });
      res.render('layout/main', { title: 'Produtos', body });
    } catch (error: any) {
      const body = `<div class="card alert alert-error">Erro ao carregar produtos: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Produtos', body });
    }
  }

  static async clientes(req: Request, res: Response) {
    try {
      const customers = await CustomerRepository.findAll();
      const returnables = await ReturnableRepository.getOutstanding();
      
      const body = await renderPartial('customers/list', { customers, returnables });
      res.render('layout/main', { title: 'Clientes', body });
    } catch (error: any) {
      const body = `<div class="card alert alert-error">Erro ao carregar clientes: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Clientes', body });
    }
  }

  static async vendaNova(req: Request, res: Response) {
    try {
      const customers = await CustomerRepository.findAll('ATIVO');
      const products = await ProductRepository.findAll('ATIVO');
      
      const body = await renderPartial('sales/new', { customers, products });
      res.render('layout/main', { title: 'Nova Venda', body });
    } catch (error: any) {
      const body = `<div class="card alert alert-error">Erro ao carregar formulário de venda: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Nova Venda', body });
    }
  }

  static async relatorios(req: Request, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const profit = await ReportRepository.getProfitByDateRange(today, tomorrow);
      const bestSellers = await ReportRepository.getBestSellers(today, tomorrow, 10);
      const inventory = await ReportRepository.getInventoryValuation();
      
      const body = await renderPartial('reports/index', { profit, bestSellers, inventory });
      res.render('layout/main', { title: 'Relatórios', body });
    } catch (error: any) {
      const body = `<div class="card alert alert-error">Erro ao carregar relatórios: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Relatórios', body });
    }
  }

  static async devolucoes(req: Request, res: Response) {
    try {
      const outstanding = await ReturnableRepository.getOutstanding();
      const totalDeposit = outstanding.reduce((sum, item) => sum + item.depositValueTotal, 0);
      
      const body = await renderPartial('returnables/index', { outstanding, totalDeposit });
      res.render('layout/main', { title: 'Devoluções', body });
    } catch (error: any) {
      const body = `<div class="card alert alert-error">Erro ao carregar devoluções: ${error.message}</div>`;
      res.status(500).render('layout/main', { title: 'Devoluções', body });
    }
  }
}
