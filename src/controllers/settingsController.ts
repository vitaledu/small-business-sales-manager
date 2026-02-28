import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import * as ejs from 'ejs';
import * as path from 'path';
import prisma from '@/db/client';

const renderLayout = async (res: Response, view: string, data: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    const viewPath = path.join(process.cwd(), 'src', 'views', `${view}.ejs`);
    ejs.renderFile(viewPath, data, {}, (err: any, html: string) => {
      if (err) reject(err);
      else resolve(html);
    });
  });
};

// ─── helpers ───────────────────────────────────────────────────────────────

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('pt-BR');
}

function fmtNum(n: number | null | undefined): number {
  return Number((n || 0).toFixed(2));
}

// ─── EXPORT ────────────────────────────────────────────────────────────────

async function buildProdutosSheet() {
  const rows = await prisma.product.findMany({ orderBy: { name: 'asc' } });
  return rows.map(p => ({
    ID: p.id,
    Nome: p.name,
    Tipo: p.type,
    Origem: p.origin,
    Retornavel: p.isReturnable ? 'Sim' : 'Não',
    'Deposito_R$': fmtNum(p.depositValue),
    'Custo_R$': fmtNum(p.costUnit),
    'Preco_R$': fmtNum(p.priceUnit),
    Descricao: p.description || '',
    Status: p.status,
    Criado_Em: fmtDate(p.createdAt),
  }));
}

async function buildClientesSheet() {
  const rows = await prisma.customer.findMany({ orderBy: { name: 'asc' } });
  return rows.map(c => ({
    ID: c.id,
    Nome: c.name,
    Tipo: c.type,
    Telefone: c.phone || '',
    Logradouro: c.address || '',
    Bairro: c.neighborhood || '',
    Status: c.status,
    Criado_Em: fmtDate(c.createdAt),
  }));
}

async function buildVendasSheet() {
  const rows = await prisma.saleOrder.findMany({
    include: { customer: true },
    orderBy: { date: 'desc' },
  });
  return rows.map(v => ({
    ID: v.id,
    Data: fmtDate(v.date),
    Cliente: v.customer?.name || '',
    Pagamento: v.paymentMethod,
    'Total_R$': fmtNum(v.totalBrl),
    'Desconto_R$': fmtNum(v.discountValue),
    'Total_Final_R$': fmtNum(v.finalTotalBrl),
    'Deposito_Retornavel_R$': fmtNum(v.returnableDepositCharged),
    Status: v.status,
  }));
}

async function buildItensVendaSheet() {
  const rows = await prisma.saleItem.findMany({
    include: { product: true },
    orderBy: { saleOrderId: 'desc' },
  });
  return rows.map(i => ({
    Venda_ID: i.saleOrderId,
    Produto: i.product?.name || '',
    Quantidade: i.quantity,
    'Preco_Unit_R$': fmtNum(i.priceUnitBrl),
    'Subtotal_R$': fmtNum(i.subtotalBrl),
  }));
}

async function buildComprasSheet() {
  const rows = await prisma.purchaseOrder.findMany({ orderBy: { date: 'desc' } });
  return rows.map(c => ({
    ID: c.id,
    Data: fmtDate(c.date),
    Fornecedor: c.supplierName || '',
    'Total_R$': fmtNum(c.totalCostBrl),
    Status: c.status,
  }));
}

async function buildItensCompraSheet() {
  const rows = await prisma.purchaseItem.findMany({
    include: { product: true },
    orderBy: { purchaseOrderId: 'desc' },
  });
  return rows.map(i => ({
    Compra_ID: i.purchaseOrderId,
    Produto: i.product?.name || '',
    Quantidade: i.quantity,
    'Custo_Unit_R$': fmtNum(i.costUnitBrl),
    'Subtotal_R$': fmtNum(i.subtotalBrl),
  }));
}

async function buildLotesSheet() {
  const rows = await prisma.productionBatch.findMany({ orderBy: { date: 'desc' } });
  return rows.map(b => ({
    ID: b.id,
    Data: fmtDate(b.date),
    Descricao: b.description,
    Qtd_Produzida: b.quantityProduced,
    'Custo_Total_R$': fmtNum(b.totalCostBrl),
    'Custo_Unit_R$': fmtNum(b.costPerUnit),
    Status: b.status,
  }));
}

async function buildMovimentosSheet() {
  const rows = await prisma.inventoryMovement.findMany({
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(m => ({
    ID: m.id,
    Data: fmtDate(m.createdAt),
    Produto: m.product?.name || '',
    Tipo: m.type,
    Quantidade: m.quantity,
    Motivo: m.reason || '',
    Referencia: m.referenceId || '',
    Tipo_Ref: m.referenceType || '',
  }));
}

// ─── CONTROLLER ────────────────────────────────────────────────────────────

export class SettingsController {

  static async settingsPage(req: Request, res: Response) {
    try {
      // Quick summary counts for the page
      const counts = {
        produtos:    await prisma.product.count(),
        clientes:    await prisma.customer.count(),
        vendas:      await prisma.saleOrder.count(),
        compras:     await prisma.purchaseOrder.count(),
        lotes:       await prisma.productionBatch.count(),
        movimentos:  await prisma.inventoryMovement.count(),
      };
      const body = await renderLayout(res, 'modules/settings', { counts });
      res.render('layout/main', { title: 'Configurações', body });
    } catch (error: any) {
      res.status(500).render('layout/main', {
        title: 'Configurações',
        body: `<div class="alert alert-error">Erro: ${error.message}</div>`,
      });
    }
  }

  // POST /configuracoes/exportar
  // body: categories[] (produtos, clientes, vendas, compras, lotes, movimentos)
  static async exportData(req: Request, res: Response) {
    try {
      const cats: string[] = [].concat(req.body.categories || []);
      if (cats.length === 0) {
        return res.status(400).send('Selecione ao menos uma categoria para exportar.');
      }

      const wb = XLSX.utils.book_new();

      if (cats.includes('produtos')) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(await buildProdutosSheet()), 'Produtos');
      }
      if (cats.includes('clientes')) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(await buildClientesSheet()), 'Clientes');
      }
      if (cats.includes('vendas')) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(await buildVendasSheet()), 'Vendas');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(await buildItensVendaSheet()), 'Itens_Venda');
      }
      if (cats.includes('compras')) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(await buildComprasSheet()), 'Compras');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(await buildItensCompraSheet()), 'Itens_Compra');
      }
      if (cats.includes('lotes')) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(await buildLotesSheet()), 'Lotes');
      }
      if (cats.includes('movimentos')) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(await buildMovimentosSheet()), 'Movimentos_Estoque');
      }

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const dateStr = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="backup_${dateStr}.xlsx"`);
      res.send(buf);
    } catch (error: any) {
      res.status(500).send(`Erro ao exportar: ${error.message}`);
    }
  }

  // POST /configuracoes/importar
  // multipart: file (xlsx), body: importMode (skip | overwrite)
  static async importData(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).render('layout/main', {
          title: 'Configurações',
          body: '<div class="alert alert-error">Nenhum arquivo enviado.</div>',
        });
      }

      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const results: string[] = [];

      // ── Import Products ──────────────────────────────────────────────
      if (wb.SheetNames.includes('Produtos')) {
        const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets['Produtos']);
        let inserted = 0, skipped = 0;
        for (const r of rows) {
          const name = String(r['Nome'] || '').trim();
          if (!name) continue;
          const exists = await prisma.product.findFirst({ where: { name } });
          if (exists) { skipped++; continue; }
          await prisma.product.create({
            data: {
              name,
              type:         String(r['Tipo'] || 'SACOLÉ'),
              origin:       String(r['Origem'] || 'PRODUZIDO'),
              isReturnable: String(r['Retornavel'] || '').toLowerCase() === 'sim',
              depositValue: Number(r['Deposito_R$'] || 5),
              costUnit:     Number(r['Custo_R$'] || 0),
              priceUnit:    Number(r['Preco_R$'] || 0),
              description:  String(r['Descricao'] || '') || undefined,
              status:       String(r['Status'] || 'ATIVO'),
            },
          });
          inserted++;
        }
        results.push(`Produtos: ${inserted} importados, ${skipped} ignorados (já existiam)`);
      }

      // ── Import Customers ─────────────────────────────────────────────
      if (wb.SheetNames.includes('Clientes')) {
        const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets['Clientes']);
        let inserted = 0, skipped = 0;
        for (const r of rows) {
          const name = String(r['Nome'] || '').trim();
          if (!name) continue;
          const exists = await prisma.customer.findFirst({ where: { name } });
          if (exists) { skipped++; continue; }
          await prisma.customer.create({
            data: {
              name,
              type:         String(r['Tipo'] || 'PF'),
              phone:        String(r['Telefone'] || '') || undefined,
              address:      String(r['Logradouro'] || '') || undefined,
              neighborhood: String(r['Bairro'] || '') || undefined,
              status:       String(r['Status'] || 'ATIVO'),
            },
          });
          inserted++;
        }
        results.push(`Clientes: ${inserted} importados, ${skipped} ignorados (já existiam)`);
      }

      if (results.length === 0) {
        results.push('Nenhuma aba reconhecida (Produtos / Clientes) encontrada no arquivo.');
      }

      const body = `
        <div class="page-header"><h1>Importação Concluída</h1></div>
        <div class="form-card">
          ${results.map(r => `<div class="alert alert-success" style="margin-bottom:8px;">${r}</div>`).join('')}
          <div style="margin-top:24px;">
            <a href="/configuracoes" class="btn btn-secondary">← Voltar</a>
          </div>
        </div>`;
      res.render('layout/main', { title: 'Importação', body });
    } catch (error: any) {
      res.status(500).render('layout/main', {
        title: 'Configurações',
        body: `<div class="alert alert-error">Erro ao importar: ${error.message}</div>`,
      });
    }
  }

  // POST /configuracoes/zerar
  // body: categories[], confirm
  static async resetData(req: Request, res: Response) {
    try {
      const confirm: string = req.body.confirm || '';
      if (confirm !== 'CONFIRMAR') {
        return res.status(400).render('layout/main', {
          title: 'Configurações',
          body: '<div class="alert alert-error">Confirmação inválida. Digite CONFIRMAR para prosseguir.</div>',
        });
      }

      const cats: string[] = [].concat(req.body.categories || []);
      if (cats.length === 0) {
        return res.status(400).render('layout/main', {
          title: 'Configurações',
          body: '<div class="alert alert-error">Selecione ao menos uma categoria para zerar.</div>',
        });
      }

      const deleted: string[] = [];

      // Order matters — delete dependents before parents

      if (cats.includes('vendas')) {
        // SaleItems and Payments cascade from SaleOrder
        const count = await prisma.saleOrder.count();
        await prisma.returnableLedger.deleteMany({});
        await prisma.saleOrder.deleteMany({});
        await prisma.inventoryMovement.deleteMany({ where: { referenceType: 'SALE' } });
        deleted.push(`Vendas: ${count} registro(s) removido(s)`);
      }

      if (cats.includes('compras')) {
        const count = await prisma.purchaseOrder.count();
        await prisma.purchaseOrder.deleteMany({});
        await prisma.inventoryMovement.deleteMany({
          where: { referenceType: { in: ['PURCHASE', 'PURCHASE_REVERSAL'] } },
        });
        deleted.push(`Compras: ${count} registro(s) removido(s)`);
      }

      if (cats.includes('lotes')) {
        const count = await prisma.productionBatch.count();
        await prisma.productionBatch.deleteMany({});
        await prisma.inventoryMovement.deleteMany({ where: { referenceType: 'BATCH' } });
        deleted.push(`Lotes: ${count} registro(s) removido(s)`);
      }

      if (cats.includes('movimentos')) {
        const count = await prisma.inventoryMovement.count();
        await prisma.inventoryMovement.deleteMany({});
        deleted.push(`Movimentos de estoque: ${count} registro(s) removido(s)`);
      }

      if (cats.includes('clientes')) {
        const remaining = await prisma.saleOrder.count();
        if (remaining > 0) {
          deleted.push('Clientes: NÃO zerado — ainda existem vendas vinculadas. Zere as Vendas primeiro.');
        } else {
          await prisma.returnableLedger.deleteMany({});
          const count = await prisma.customer.count();
          await prisma.customer.deleteMany({});
          deleted.push(`Clientes: ${count} registro(s) removido(s)`);
        }
      }

      if (cats.includes('produtos')) {
        const saleItems     = await prisma.saleItem.count();
        const purchaseItems = await prisma.purchaseItem.count();
        if (saleItems > 0 || purchaseItems > 0) {
          deleted.push('Produtos: NÃO zerado — ainda existem vendas/compras vinculadas. Zere Vendas e Compras primeiro.');
        } else {
          await prisma.inventoryMovement.deleteMany({});
          await prisma.returnableLedger.deleteMany({});
          const count = await prisma.product.count();
          await prisma.product.deleteMany({});
          deleted.push(`Produtos: ${count} registro(s) removido(s)`);
        }
      }

      const body = `
        <div class="page-header"><h1>Zeramento Concluído</h1></div>
        <div class="form-card">
          ${deleted.map(r => `<div class="alert ${r.includes('NÃO') ? 'alert-warning' : 'alert-success'}" style="margin-bottom:8px;">${r}</div>`).join('')}
          <div style="margin-top:24px;">
            <a href="/configuracoes" class="btn btn-secondary">← Voltar</a>
          </div>
        </div>`;
      res.render('layout/main', { title: 'Zeramento', body });
    } catch (error: any) {
      res.status(500).render('layout/main', {
        title: 'Configurações',
        body: `<div class="alert alert-error">Erro ao zerar: ${error.message}</div>`,
      });
    }
  }
}
