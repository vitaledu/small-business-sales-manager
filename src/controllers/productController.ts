import { Request, Response } from 'express';
import { ProductRepository } from '@/repositories/productRepository';
import { validateRequest, CreateProductSchema } from '@/utils/validator';

export class ProductController {
  static async list(req: Request, res: Response) {
    try {
      const { type, status } = req.query;
      const products = await ProductRepository.findAll(status as any, type as string);

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro ao listar produtos',
      });
    }
  }

  static async getWarehouse(req: Request, res: Response) {
    try {
      const warehouse = await ProductRepository.getWarehouse();
      const totalValue = warehouse.reduce((sum, item) => sum + item.totalInventoryValue, 0);

      res.json({
        success: true,
        data: {
          products: warehouse,
          totalInventoryValue: totalValue,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro ao obter estoque',
      });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validation = validateRequest(CreateProductSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: validation.errors,
        });
      }

      const product = await ProductRepository.create(validation.data);

      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: 'CREATE_ERROR',
        message: error.message || 'Erro ao criar produto',
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await ProductRepository.findById(parseInt(id));

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Produto não encontrado',
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro ao buscar produto',
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await ProductRepository.update(parseInt(id), req.body);

      res.json({
        success: true,
        data: product,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: 'UPDATE_ERROR',
        message: error.message || 'Erro ao atualizar produto',
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ProductRepository.delete(parseInt(id));

      res.json({
        success: true,
        message: 'Produto marcado como inativo',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'DELETE_ERROR',
        message: 'Erro ao deletar produto',
      });
    }
  }
}
