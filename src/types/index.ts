// Product Types
export interface IProduct {
  id: number;
  name: string;
  type: 'SACOLÉ' | 'DRINK';
  origin?: string;
  isReturnable: boolean;
  depositValue?: number;
  costUnit: number;
  priceUnit: number;
  description?: string;
  status: 'ATIVO' | 'INATIVO';
  createdAt: Date;
}

// Customer Types
export interface ICustomer {
  id: number;
  name: string;
  type: 'PF' | 'REVENDEDOR';
  phone?: string;
  address?: string;
  neighborhood?: string;
  status: 'ATIVO' | 'INATIVO';
  outstandingBalance: number;
  outstandingReturnableDepo: number;
  createdAt: Date;
}

// Sale Types
export interface ISaleItem {
  productId: number;
  quantity: number;
  priceUnitBrl: number;
  discountPct?: number;
}

export interface ICreateSaleRequest {
  customerId: number;
  items: ISaleItem[];
  paymentMethod: 'DINHEIRO' | 'PIX' | 'CARTÃO';
  discountValue?: number;
}

export interface ISaleOrder {
  id: number;
  customerId: number;
  date: Date;
  totalBrl: number;
  discountPct: number;
  discountValue: number;
  finalTotalBrl: number;
  paymentMethod: string;
  returnableDepositCharged: number;
  status: 'DRAFT' | 'FINALIZADA';
  items: ISaleItemDetail[];
  payments: IPayment[];
}

export interface ISaleItemDetail extends ISaleItem {
  id: number;
  saleOrderId: number;
  subtotalBrl: number;
  productName?: string;
}

export interface IPayment {
  id: number;
  method: string;
  amountBrl: number;
  status: 'PENDING' | 'DONE';
  transactionId?: string;
}

// Production Batch Types
export interface IProductionBatch {
  id: number;
  description: string;
  date: Date;
  totalCostBrl: number;
  quantityProduced: number;
  costPerUnit?: number;
  status: 'DRAFT' | 'COMPLETED';
  ingredients?: IIngredient[];
}

export interface IIngredient {
  name: string;
  cost: number;
}

// Returnable Types
export interface IReturnableLedger {
  id: number;
  customerId: number;
  productId: number;
  quantityOut: number;
  quantityReturned: number;
  quantityPending: number;
  depositValueTotal: number;
}

// Report Types
export interface IProfitReport {
  period: {
    start: string;
    end: string;
  };
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  marginPct: number;
  transactionsCount: number;
}

export interface IBestSellerItem {
  productId: number;
  productName: string;
  qtySold: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  marginPct: number;
}

// Inventory Types
export interface IInventoryItem {
  productId: number;
  productName: string;
  qtyOnHand: number;
  costUnit: number;
  totalValue: number;
}

// Error Response
export interface IErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: Record<string, string>;
}

// Success Response
export interface ISuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export type IApiResponse<T> = ISuccessResponse<T> | IErrorResponse;
