import { Request, Response } from 'express';
import { SaleService } from '@/services/saleService';
import { SaleRepository } from '@/repositories/saleRepository';
import { validateRequest, CreateSaleSchema } from '@/utils/validator';

export class SaleController {
  static async create(req: Request, res: Response) {
    try {
      const validation = validateRequest(CreateSaleSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: validation.errors,
        });
      }

      const sale = await SaleService.createSale(validation.data);

      res.status(201).json({
        success: true,
        data: sale,
        message: 'Venda registrada com sucesso',
      });
    } catch (error: any) {
      const status = error.message?.includes('Estoque insuficiente') ? 409 : 400;
      res.status(status).json({
        success: false,
        error: error.message?.includes('insuficiente') ? 'INSUFFICIENT_STOCK' : 'CREATE_ERROR',
        message: error.message,
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const sale = await SaleRepository.findById(parseInt(id));

      if (!sale) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Venda não encontrada',
        });
      }

      res.json({
        success: true,
        data: sale,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro ao buscar venda',
      });
    }
  }

  static async listByDateRange(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'startDate e endDate são obrigatórios',
        });
      }

      const sales = await SaleRepository.findByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({
        success: true,
        data: sales,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro ao listar vendas',
      });
    }
  }

  static async listByCustomer(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      const sales = await SaleRepository.findByCustomer(parseInt(customerId));

      res.json({
        success: true,
        data: sales,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro ao listar vendas do cliente',
      });
    }
  }
}
