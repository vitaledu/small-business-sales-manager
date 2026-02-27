import { Request, Response } from 'express';
import { CustomerRepository } from '@/repositories/customerRepository';
import { ReturnableRepository } from '@/repositories/returnableRepository';
import { validateRequest, CreateCustomerSchema, ReturnBottlesSchema } from '@/utils/validator';

export class CustomerController {
  static async list(req: Request, res: Response) {
    try {
      const { search, status } = req.query;
      const customers = await CustomerRepository.findAll(status as any, search as string);

      res.json({
        success: true,
        data: customers,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro ao listar clientes',
      });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const validation = validateRequest(CreateCustomerSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: validation.errors,
        });
      }

      const customer = await CustomerRepository.create(validation.data);

      res.status(201).json({
        success: true,
        data: customer,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: 'CREATE_ERROR',
        message: error.message || 'Erro ao criar cliente',
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const customer = await CustomerRepository.findByIdWithReturnables(parseInt(id));

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Cliente não encontrado',
        });
      }

      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro ao buscar cliente',
      });
    }
  }

  static async returnBottles(req: Request, res: Response) {
    try {
      const validation = validateRequest(ReturnBottlesSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: validation.errors,
        });
      }

      const result = await ReturnableRepository.recordReturn(
        validation.data.customerId,
        validation.data.productId,
        validation.data.quantityReturned
      );

      res.json({
        success: true,
        data: result,
        message: 'Garrafas devolvidas com sucesso',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: 'RETURN_ERROR',
        message: error.message,
      });
    }
  }
}
