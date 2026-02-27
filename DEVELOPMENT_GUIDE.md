# 🛠️ Guia de Desenvolvimento

## Estrutura de Camadas

### 1. **Controllers** (`src/controllers/`)
Recebem requests HTTP, validam input, chamam services.

```typescript
// productController.ts
static async list(req: Request, res: Response) {
  const products = await ProductRepository.findAll();
  res.json({ success: true, data: products });
}
```

### 2. **Services** (`src/services/`)
Contêm lógica de negócio complexa.

```typescript
// saleService.ts
static async createSale(request: ICreateSaleRequest) {
  // Validar cliente existe
  // Validar estoque
  // Calcular totais
  // Atualizar inventory
  // Retornar venda criada
}
```

### 3. **Repositories** (`src/repositories/`)
Fazem queries ao banco de dados via Prisma.

```typescript
// ProductRepository.ts
static async findAll(): Promise<IProduct[]> {
  return prisma.product.findMany();
}
```

### 4. **Routes** (`src/routes/`)
Mapeiam URLs para controllers.

```typescript
// products.ts
router.get('/', ProductController.list);
router.post('/', ProductController.create);
```

## Fluxo de uma Requisição

```
Browser GET http://localhost:3000/produtos
  ↓
Router matches /produtos → ProductController.list()
  ↓
ProductController.list() calls ProductRepository.findAll()
  ↓
ProductRepository queries database via Prisma
  ↓
Prisma returns Product[]
  ↓
Controller renders EJS template or returns JSON
  ↓
Browser receives response
```

## Para Adicionar Novo Endpoint

### Exemplo: Criar "Ajuste de Estoque"

#### 1. Defina o tipo (`types/index.ts`)
```typescript
export interface IAdjustInventory {
  productId: number;
  quantity: number;
  reason: string;
}
```

#### 2. Crie o schema Zod (`utils/validator.ts`)
```typescript
export const AdjustInventorySchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number(),
  reason: z.string(),
});
```

#### 3. Adicione método ao Repository
```typescript
// repositories/inventoryRepository.ts
static async adjustStock(productId: number, quantity: number, reason: string) {
  return prisma.inventoryMovement.create({
    data: { productId, type: 'ADJUST', quantity, reason },
  });
}
```

#### 4. Crie o Controller
```typescript
// controllers/inventoryController.ts
static async adjust(req: Request, res: Response) {
  const validation = validateRequest(AdjustInventorySchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, details: validation.errors });
  }
  
  const result = await InventoryRepository.adjustStock(
    validation.data.productId,
    validation.data.quantity,
    validation.data.reason
  );
  
  res.json({ success: true, data: result });
}
```

#### 5. Adicione a Rota
```typescript
// routes/inventory.ts
router.post('/adjust', InventoryController.adjust);
```

#### 6. Registre a rota no index (`routes/index.ts`)
```typescript
router.use('/api/inventory', inventoryRouter);
```

Pronto! POST `/api/inventory/adjust` está operacional.

## Boas Práticas

✅ **DO:**
- Use `async/await` em vez de callbacks
- Validar sempre com Zod
- Usar tipos TypeScript
- Criar transações para múltiplas operações
- Log erros
- Separar lógica em services

❌ **DON'T:**
- Fazer queries direto no controller
- Ignorar erros
- Usar `any` em TypeScript
- SQL strings (use Prisma)
- Operações bloqueantes

## Testando com curl

```bash
# Listar produtos
curl http://localhost:3000/api/products

# Criar venda
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{"customerId":1,"items":[{"productId":1,"quantity":2,"priceUnitBrl":5.00}],"paymentMethod":"PIX"}'

# Ajustar estoque
curl -X POST http://localhost:3000/api/inventory/adjust \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":-5,"reason":"PERDA"}'
```

## Schema Prisma

Para adicionar nova tabela:

1. Edite `prisma/schema.prisma`
2. Execute: `npm run prisma:migrate`
3. Nomeie a migration (ex: "add_expenses_table")

```prisma
model Expense {
  id    Int     @id @default(autoincrement())
  amount Float
  description String
  createdAt DateTime @default(now())
}
```

## Compilar e Rodar em Produção

```bash
# Build TypeScript
npm run build

# Start server
npm start
```

JavaScript compilado fica em `dist/` e pode ser deployado.

---

Perguntas? Revise o README e a especificação completa.
