import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.saleOrder.deleteMany();
  await prisma.returnableLedger.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.productionBatch.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();

  // Create Products
  const sacoleMorango = await prisma.product.create({
    data: {
      name: 'Sacolé Morango',
      type: 'SACOLÉ',
      isReturnable: false,
      costUnit: 0.20,
      priceUnit: 1.00,
      description: 'Sacolé artesanal sabor morango',
      status: 'ATIVO',
    },
  });

  const sacoleAbacaxi = await prisma.product.create({
    data: {
      name: 'Sacolé Abacaxi',
      type: 'SACOLÉ',
      isReturnable: false,
      costUnit: 0.18,
      priceUnit: 0.90,
      description: 'Sacolé artesanal sabor abacaxi',
      status: 'ATIVO',
    },
  });

  const cocaColaDois = await prisma.product.create({
    data: {
      name: 'Coca-Cola 2L',
      type: 'BEBIDA',
      isReturnable: true,
      costUnit: 8.00,
      priceUnit: 12.00,
      description: 'Garrafa retornável de 2L',
      status: 'ATIVO',
    },
  });

  const guaranaDois = await prisma.product.create({
    data: {
      name: 'Guaraná 2L',
      type: 'BEBIDA',
      isReturnable: true,
      costUnit: 6.00,
      priceUnit: 10.00,
      description: 'Garrafa retornável de 2L',
      status: 'ATIVO',
    },
  });

  // Create Customers
  const joaoSilva = await prisma.customer.create({
    data: {
      name: 'João da Silva',
      type: 'PF',
      phone: '11987654321',
      address: 'Rua A, 123',
      neighborhood: 'Centro',
      status: 'ATIVO',
    },
  });

  const mariaOliveira = await prisma.customer.create({
    data: {
      name: 'Maria Oliveira',
      type: 'PF',
      phone: '11987654322',
      address: 'Rua B, 456',
      neighborhood: 'Vila Nova',
      status: 'ATIVO',
    },
  });

  const lojaCentral = await prisma.customer.create({
    data: {
      name: 'Loja Central',
      type: 'REVENDEDOR',
      phone: '1133334444',
      address: 'Av. Principal, 999',
      neighborhood: 'Centro',
      status: 'ATIVO',
    },
  });

  // Create Production Batch
  const batch1 = await prisma.productionBatch.create({
    data: {
      description: 'Sacolé Morango - Lote 001',
      date: new Date('2024-02-24'),
      totalCostBrl: 20.0,
      quantityProduced: 100,
      costPerUnit: 0.20,
      status: 'COMPLETED',
      ingredients: JSON.stringify([
        { name: 'Leite Integral', cost: 10.00 },
        { name: 'Açúcar', cost: 5.00 },
        { name: 'Corante Morango', cost: 2.00 },
        { name: 'Embalagem', cost: 3.00 },
      ]),
    },
  });

  // Add inventory for sacolé from batch
  await prisma.inventoryMovement.create({
    data: {
      productId: sacoleMorango.id,
      type: 'IN',
      quantity: 100,
      reason: 'PRODUÇÃO',
      referenceType: 'BATCH',
      referenceId: batch1.id.toString(),
    },
  });

  // Create Purchase Orders
  const purchase1 = await prisma.purchaseOrder.create({
    data: {
      supplierName: 'Bebidas Brasil LTDA',
      date: new Date('2024-02-20'),
      totalCostBrl: 80.0,
      status: 'RECEIVED',
      items: {
        create: [
          {
            productId: cocaColaDois.id,
            quantity: 10,
            costUnitBrl: 8.0,
            subtotalBrl: 80.0,
          },
        ],
      },
    },
    include: { items: true },
  });

  // Add inventory for coca
  await prisma.inventoryMovement.create({
    data: {
      productId: cocaColaDois.id,
      type: 'IN',
      quantity: 10,
      reason: 'COMPRA',
      referenceType: 'PURCHASE',
      referenceId: purchase1.id.toString(),
    },
  });

  // Create Sales
  const sale1 = await prisma.saleOrder.create({
    data: {
      customerId: joaoSilva.id,
      date: new Date('2024-02-25T14:30:00'),
      totalBrl: 16.40,
      discountPct: 0,
      discountValue: 0,
      finalTotalBrl: 16.40,
      paymentMethod: 'PIX',
      returnableDepositCharged: 5.0,
      status: 'FINALIZADA',
      items: {
        create: [
          {
            productId: sacoleMorango.id,
            quantity: 5,
            priceUnitBrl: 1.00,
            discountPct: 0,
            subtotalBrl: 5.00,
          },
          {
            productId: cocaColaDois.id,
            quantity: 1,
            priceUnitBrl: 12.00,
            discountPct: 0,
            subtotalBrl: 12.00,
          },
        ],
      },
      payments: {
        create: [
          {
            method: 'PIX',
            amountBrl: 16.40,
            status: 'DONE',
          },
        ],
      },
    },
  });

  // Update inventory for sale
  await prisma.inventoryMovement.create({
    data: {
      productId: sacoleMorango.id,
      type: 'OUT',
      quantity: 5,
      reason: 'VENDA',
      referenceType: 'SALE',
      referenceId: sale1.id.toString(),
    },
  });

  await prisma.inventoryMovement.create({
    data: {
      productId: cocaColaDois.id,
      type: 'OUT',
      quantity: 1,
      reason: 'VENDA',
      referenceType: 'SALE',
      referenceId: sale1.id.toString(),
    },
  });

  // Create Returnable Ledger entry
  await prisma.returnableLedger.create({
    data: {
      customerId: joaoSilva.id,
      productId: cocaColaDois.id,
      quantityOut: 1,
      quantityReturned: 0,
      quantityPending: 1,
      depositValueTotal: 5.0,
    },
  });

  // Update customer outstanding deposit
  await prisma.customer.update({
    where: { id: joaoSilva.id },
    data: {
      outstandingReturnableDepo: 5.0,
    },
  });

  // Create Audit Log entry
  await prisma.auditLog.create({
    data: {
      action: 'SALE',
      entityType: 'SALE_ORDER',
      entityId: sale1.id,
      details: JSON.stringify({
        customerId: joaoSilva.id,
        total: 16.40,
        paymentMethod: 'PIX',
      }),
    },
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log('📊 Dados criados:');
  console.log(`   - ${4} Produtos (2 sacolés, 2 bebidas)}`);
  console.log(`   - ${3} Clientes`);
  console.log(`   - ${1} Lote de produção`);
  console.log(`   - ${1} Compra`);
  console.log(`   - ${1} Venda com devolução de garrafa pendente`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
