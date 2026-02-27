import { z, ZodError } from 'zod';

// Product Schemas
export const CreateProductSchema = z.object({
  name: z.string().min(1).max(100, 'Nome deve ter até 100 caracteres'),
  type: z.enum(['SACOLÉ', 'DRINK'], { errorMap: () => ({ message: 'Tipo deve ser SACOLÉ ou DRINK' }) }),
  isReturnable: z.boolean().optional().default(false),
  costUnit: z.number().min(0, 'Custo unitário não pode ser negativo'),
  priceUnit: z.number().min(0, 'Preço unitário não pode ser negativo'),
  description: z.string().optional(),
});

// Customer Schemas
export const CreateCustomerSchema = z.object({
  name: z.string().min(1).max(100, 'Nome é obrigatório'),
  type: z.enum(['PF', 'REVENDEDOR']),
  phone: z.string().optional(),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
});

// Sale Schemas
export const CreateSaleSchema = z.object({
  customerId: z.number().int().positive('ID do cliente inválido'),
  items: z.array(
    z.object({
      productId: z.number().int().positive('ID do produto inválido'),
      quantity: z.number().positive('Quantidade deve ser maior que zero'),
      priceUnitBrl: z.number().positive('Preço unitário deve ser maior que zero'),
      discountPct: z.number().min(0).max(100).optional().default(0),
    })
  ).min(1, 'Venda deve ter pelo menos um item'),
  paymentMethod: z.enum(['DINHEIRO', 'PIX', 'CARTÃO'], { errorMap: () => ({ message: 'Método de pagamento inválido' }) }),
  discountValue: z.number().min(0).optional().default(0),
});

// Production Batch Schema
export const CreateBatchSchema = z.object({
  description: z.string().min(1).max(255),
  date: z.string().datetime().or(z.date()),
  totalCostBrl: z.number().positive('Custo total deve ser positivo'),
  quantityProduced: z.number().int().positive('Quantidade deve ser um número inteiro positivo'),
  ingredients: z.array(
    z.object({
      name: z.string(),
      cost: z.number().min(0),
    })
  ).optional(),
});

// Returnable Return Schema
export const ReturnBottlesSchema = z.object({
  customerId: z.number().int().positive(),
  productId: z.number().int().positive(),
  quantityReturned: z.number().positive('Quantidade deve ser maior que zero'),
  date: z.string().datetime().or(z.date()).optional(),
});

export function validateRequest<T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Erro de validação desconhecido' } };
  }
}
