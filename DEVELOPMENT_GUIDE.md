# Guia de Desenvolvimento

---

## Arquitetura

Aplicação server-rendered sem SPA. Cada rota devolve HTML completo gerado pelo EJS.

```
Browser → Express Router → Controller → Repository → Prisma → SQLite
                 ↓
           EJS Template → HTML → Browser
```

### Camadas

| Camada | Localização | Responsabilidade |
|--------|-------------|-----------------|
| Routes | `src/routes/crud.ts` | Mapeia URL + método HTTP para método do controller |
| Controllers | `src/controllers/` | Lê request, chama repositories, renderiza template |
| Repositories | `src/repositories/` | Queries ao banco via Prisma |
| Templates | `src/views/` | HTML com EJS (recarregam do disco a cada request) |
| Estilos | `src/public/css/custom.css` | CSS global da aplicação |

> Não há camada de services. Lógica de negócio fica nos controllers ou, quando reutilizada, nos repositories.

---

## Padrão de Renderização

Todos os controllers usam `renderLayout` para compor o HTML final:

```typescript
// 1. Renderiza apenas o módulo (sem layout)
const body = await renderLayout(res, 'modules/products-list', { products });

// 2. Injeta no layout principal (sidebar, CSS, etc.)
res.render('layout/main', { title: 'Produtos', body });
```

`renderLayout` é uma função local em cada controller que chama `ejs.renderFile` diretamente, passando os dados como variáveis locais para o template.

---

## Estoque

O estoque de um produto **não é um campo** — é sempre calculado como a soma de todas as `InventoryMovement` para aquele produto:

```typescript
// Estoque de um produto
const result = await prisma.inventoryMovement.aggregate({
  where: { productId },
  _sum: { quantity: true },
});
const stock = result._sum.quantity ?? 0;
```

- Valores **positivos** = entradas (compras recebidas, lotes finalizados)
- Valores **negativos** = saídas (vendas, estornos de compra)

Helpers em `productRepository.ts`:
- `getStock(productId)` — estoque de um produto
- `getStockMap(productIds[])` — estoque de vários produtos em uma única query (groupBy)

---

## Custo Médio Ponderado

Calculado **antes** de gravar a movimentação de entrada, para que o próprio movimento não infle o denominador:

```typescript
const currentStock = await ProductRepository.getStock(productId);
const currentCost  = product.costUnit;

const newCost = currentStock <= 0
  ? unitCost
  : (currentStock * currentCost + quantity * unitCost) / (currentStock + quantity);

await prisma.product.update({ where: { id: productId }, data: { costUnit: newCost } });
// só depois: criar InventoryMovement de entrada
```

---

## Fluxos com Estado

### Compra (PurchaseOrder)

```
DRAFT ──→ RECEIVED
  │           │
  ↓           ↓
cancelar    estornar (parcial ou total)
(hard delete)   └─→ CANCELLED (quando 100% estornado)
```

O estorno é rastreado por movimentos OUT com `referenceType = 'PURCHASE_REVERSAL'` e `referenceId = 'PURCHASE_${id}_REVERSAL'`. Sempre que uma nova reversão é solicitada, `getReversedQuantities` soma o que já foi estornado para validar o novo pedido.

### Lote de Produção (ProductionBatch)

```
OPEN ──→ COMPLETED
```

### Venda (SaleOrder)

```
COMPLETED ──→ CANCELLED
```

O cancelamento pergunta se o produto foi devolvido. Se sim, gera um movimento IN de cancelamento (`reason: 'CANCELAMENTO'`). Se não, apenas marca a venda como CANCELLED sem alterar estoque.

---

## Passar Dados para Modais (JSON seguro)

Nunca coloque JSON diretamente em atributos `onclick` — nomes de produtos com aspas quebram o HTML.

**Padrão correto (template EJS):**
```html
<button
  data-id="<%= purchase.id %>"
  data-items="<%= encodeURIComponent(JSON.stringify(items)) %>"
  onclick="openModal(this)">
  Estornar
</button>
```

**Leitura no JS:**
```javascript
function openModal(btn) {
  const id    = btn.dataset.id;
  const items = JSON.parse(decodeURIComponent(btn.dataset.items));
}
```

---

## Datas — UTC vs. Hora Local

`new Date("2025-02-28")` é interpretado como **meia-noite UTC**. No Brasil (UTC-3) isso vira 21h do dia anterior em hora local, causando perda de registros nos filtros de data.

**Sempre parse datas de query string como hora local:**

```typescript
function parseLocalDate(dateStr: string, endOfDay = false): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (endOfDay) return new Date(y, m - 1, d, 23, 59, 59, 999);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function toLocalDateStr(d: Date): string {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```

Não use `.toISOString().slice(0,10)` para formatar datas — retorna a data em UTC, que pode ser um dia anterior.

---

## Adicionar uma Nova Funcionalidade

### Exemplo: Ajuste Manual de Estoque

**1. Adicionar rota** em `src/routes/crud.ts`:
```typescript
router.post('/produtos/:id/ajustar', CrudController.productsAdjustStock);
```

**2. Adicionar método no controller** (`src/controllers/crudController.ts`):
```typescript
static async productsAdjustStock(req: Request, res: Response) {
  const id       = parseInt(req.params.id);
  const quantity = parseInt(req.body.quantity);  // positivo ou negativo
  const reason   = req.body.reason || 'AJUSTE';

  await prisma.inventoryMovement.create({
    data: { productId: id, type: quantity > 0 ? 'IN' : 'OUT', quantity, reason: 'AJUSTE' },
  });

  res.redirect('/produtos');
}
```

**3. Adicionar botão/form no template EJS** correspondente.

> Não é necessário schema migration para novos campos opcionais em SQLite — use `npm run db:push` para sincronizar qualquer mudança no `prisma/schema.prisma`.

---

## Adicionando Campo ao Banco

1. Edite `prisma/schema.prisma`
2. Execute `npm run db:push`
3. Atualize os `select`/`create`/`update` no repository correspondente
4. Atualize o template EJS para exibir/editar o novo campo

---

## Scripts

```bash
npm run dev            # ts-node — sem hot reload para .ts
npm run build          # Compila para dist/
npm start              # Roda dist/server.js
npm run db:push        # Sincroniza schema (sem migration file)
npm run db:reset       # Apaga e recria o banco ⚠️
npm run prisma:seed    # Popula com dados de exemplo
npm test               # Jest
npm run lint           # ESLint
```

---

## Convenções

- **Sem hot reload:** alterações em `.ts` exigem `Ctrl+C` + `npm run dev`. Templates `.ejs` recarregam automaticamente.
- **Sem services:** lógica vai no controller (se única) ou no repository (se reutilizada por múltiplos controllers).
- **Sem API REST:** todas as respostas são HTML. Formulários usam `method="POST"` com `action`.
- **Confirmações destrutivas:** sempre um modal com campo de texto "CONFIRMAR" ou checkbox — nunca `confirm()` do browser.
- **Erros:** catch no controller renderiza `layout/main` com um `<div class="alert alert-error">`, nunca JSON de erro.
