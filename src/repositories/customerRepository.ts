import prisma from '@/db/client';
import { ICustomer } from '@/types';

export class CustomerRepository {
  static async findAll(status?: 'ATIVO' | 'INATIVO', search?: string): Promise<ICustomer[]> {
    return prisma.customer.findMany({
      where: {
        ...(status && { status }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
          ],
        }),
      },
      orderBy: { name: 'asc' },
    }) as Promise<ICustomer[]>;
  }

  static async findById(id: number): Promise<ICustomer | null> {
    return prisma.customer.findUnique({
      where: { id },
    }) as Promise<ICustomer | null>;
  }

  static async findByIdWithReturnables(id: number) {
    const customer = await this.findById(id);
    if (!customer) return null;

    const returnables = await prisma.returnableLedger.findMany({
      where: { customerId: id },
      include: { product: true },
    });

    return {
      ...customer,
      returnables,
    };
  }

  static async create(data: {
    name: string;
    type: string;
    phone?: string;
    address?: string;
    neighborhood?: string;
  }): Promise<ICustomer> {
    return prisma.customer.create({
      data: {
        ...data,
        status: 'ATIVO',
      },
    }) as Promise<ICustomer>;
  }

  static async update(id: number, data: Partial<Omit<ICustomer, 'id' | 'createdAt'>>): Promise<ICustomer> {
    return prisma.customer.update({
      where: { id },
      data,
    }) as Promise<ICustomer>;
  }

  static async updateOutstandingDeposit(id: number, amount: number): Promise<ICustomer> {
    const customer = await this.findById(id);
    if (!customer) throw new Error('Cliente não encontrado');

    return this.update(id, {
      outstandingReturnableDepo: Math.max(0, customer.outstandingReturnableDepo + amount),
    });
  }

  static async getContacts() {
    return prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        phone: true,
      },
    });
  }
}
