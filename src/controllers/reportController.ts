import { Request, Response } from 'express';
import { ReturnableRepository } from '@/repositories/returnableRepository';
import { ReportRepository } from '@/repositories/reportRepository';

const parseLocalDate = (value: string, endOfDay: boolean = false): Date => {
  const [year, month, day] = value.split('-').map(Number);
  if (endOfDay) return new Date(year, month - 1, day, 23, 59, 59, 999);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

export class ReportController {
  static async getProfitReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'startDate e endDate são obrigatórios',
        });
      }

      const report = await ReportRepository.getProfitByDateRange(
        parseLocalDate(startDate as string, false),
        parseLocalDate(endDate as string, true)
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro ao gerar relatório de lucro',
      });
    }
  }

  static async getBestSellers(req: Request, res: Response) {
    try {
      const { startDate, endDate, limit = '10' } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'startDate e endDate são obrigatórios',
        });
      }

      const data = await ReportRepository.getBestSellers(
        parseLocalDate(startDate as string, false),
        parseLocalDate(endDate as string, true),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro ao gerar relatório de melhores vendas',
      });
    }
  }

  static async getInventoryValuation(req: Request, res: Response) {
    try {
      const data = await ReportRepository.getInventoryValuation();

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro ao gerar relatório de estoque',
      });
    }
  }

  static async getOutstandingReturnables(req: Request, res: Response) {
    try {
      const { customerId } = req.query;
      const data = await ReturnableRepository.getOutstanding(customerId ? parseInt(customerId as string) : undefined);

      const totalDeposit = data.reduce((sum, item) => sum + item.depositValueTotal, 0);

      res.json({
        success: true,
        data,
        summary: {
          totalOutstandingItems: data.length,
          totalOutstandingDepositValue: totalDeposit,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro ao gerar relatório de garrafas pendentes',
      });
    }
  }
}
