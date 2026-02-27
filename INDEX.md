# 📋 ÍNDICE COMPLETO - Sistema de Gestão Sacolé & Bebidas

Este documento é um guia de navegação para toda documentação, especificação e código do projeto.

---

## 📖 Documentação Principal

### 1. [README.md](./README.md) ⭐ **COMECE AQUI**
- **O quê é**: Overview do projeto, quick start, tech stack
- **Quando usar**: Primeiro acesso, instalação, entender a visão geral
- **Seções**:
  - Características principais
  - Pré-requisitos e instalação (3 minutos)
  - Como iniciar o servidor
  - URLs principais
  - Endpoints da API
  - Troubleshooting

**Próximo passo**: Siga o "Quick Start" no README.

---

### 2. [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) 🔧
- **O quê é**: Guia prático de desenvolvimento
- **Quando usar**: Após setup inicial, ao adicionar features
- **Seções**:
  - Estrutura de camadas (Controllers → Services → Repositories)
  - Fluxo de requisição
  - Como adicionar novo endpoint (step-by-step)
  - Boas práticas
  - Exemplos curl
  - Configurar Prisma

**Próximo passo**: Após rodar o servidor, leia isso para adicionar sua primeira feature.

---

## 📊 Especificação Completa (neste prompt)

A especificação incluída acima covers:

1. **[PRD (Product Requirements Document)]** - Seção [1]
   - User personas (Viviane)
   - Jobs-to-be-done
   - Scope in/out
   - Constraints & assumptions
   - Success criteria
   - Business rules (profit calc, returnable bottles logic)

2. **[Features & User Stories]** - Seção [2]
   - 17 user stories com acceptance criteria
   - Cobertura completa: inventory, customers, sales, production, returnables, reports, audit

3. **[Data Model]** - Seção [3]
   - ER diagram (ASCII)
   - Tabelas com descrição de campos e tipos
   - Relacionamentos
   - Índices para performance
   - Constraints de negócio

4. **[Technical Architecture]** - Seção [4]
   - Stack: Node.js + Express + Prisma + SQLite
   - Folder structure
   - Architecture diagram
   - Design patterns (Repository, Service)
   - Data flow example (Sale entry)
   - Security basics

5. **[API Specification]** - Seção [5]
   - REST endpoints completos
   - Exemplos request/response JSON
   - Validations rules
   - Error handling
   - Covers: Products, Customers, Sales, Batches, Returnables, Reports

6. **[UI/UX Spec]** - Seção [6]
   - Screen hierarchy
   - Wireframe descriptions (Dashboard, Nova Venda, Clientes, Relatórios, etc.)
   - Key interactions
   - Responsive considerations

7. **[Development Plan]** - Seção [7]
   - Milestones (MVW, Core, Returnables, UX, Testing, Launch)
   - Time estimates per milestone (14-22 horas cada)
   - Total: ~88 horas (2-3 weeks full-time)
   - Testing plan
   - Future enhancements roadmap

8. **[Starter Codebase]** - Seção [8]
   - Production-ready starter code gerado em `/src`
   - Prisma schema with all tables
   - Example data seed script
   - Repositories, Services, Controllers implementados
   - Express routes configuradas
   - HTML/EJS templates para UI
   - .env configuration

---

## 💾 Codebase Structure (no VS Code)

```
c:\Users\Eduardo\Documents\Projeto Venda Sacole Viviane\
│
├── README.md                          👗 Comece aqui!
├── DEVELOPMENT_GUIDE.md               🔧 Guia de desenvolvimento
├── Este_Arquivo_INDICE.md             📍 Você está aqui
│
├── package.json                       📦 Dependências
├── tsconfig.json                      ⚙️ TypeScript config
├── jest.config.js                     🧪 Test config
├── .env                               🔐 Env variables (gitignored)
├── .env.example                       📝 Template .env
├── .gitignore
│
├── prisma/
│   ├── schema.prisma                  🗄️ Data model (Tabelas)
│   ├── seed.ts                        🌱 Dados de exemplo
│   └── dev.db                         💾 SQLite database
│
├── src/
│   ├── server.ts                      🚀 Entry point (inicia aqui)
│   ├── app.ts                         ⚙️ Express app setup
│   ├── config.ts                      🔧 Configurações
│   │
│   ├── types/
│   │   └── index.ts                   📝 TypeScript interfaces
│   │
│   ├── routes/                        🛣️ URL mappings
│   │   ├── index.ts                   (agregador)
│   │   ├── products.ts
│   │   ├── customers.ts
│   │   ├── sales.ts
│   │   └── reports.ts
│   │
│   ├── controllers/                   🎮 HTTP request handlers
│   │   ├── productController.ts
│   │   ├── customerController.ts
│   │   ├── saleController.ts
│   │   └── reportController.ts
│   │
│   ├── services/                      ⚡ Business logic
│   │   └── saleService.ts
│   │
│   ├── repositories/                  🔍 Data access (queries)
│   │   ├── productRepository.ts
│   │   ├── customerRepository.ts
│   │   ├── saleRepository.ts
│   │   ├── returnableRepository.ts
│   │   ├── reportRepository.ts
│   │   └── auditRepository.ts
│   │
│   ├── middleware/
│   │   ├── errorHandler.ts            🚨 Error handling
│   │   └── logger.ts                  📝 HTTP logging
│   │
│   ├── utils/
│   │   ├── validator.ts               ✅ Zod schemas/validation
│   │   ├── calculation.ts             🧮 Profit, COGS math
│   │   └── dateHelper.ts              📅 Date utilities
│   │
│   ├── db/
│   │   └── client.ts                  🔌 Prisma singleton
│   │
│   ├── views/                         🎨 EJS HTML templates
│   │   ├── layout/
│   │   │   ├── header.ejs
│   │   │   └── footer.ejs
│   │   ├── dashboard.ejs
│   │   ├── products/list.ejs
│   │   ├── customers/list.ejs
│   │   ├── sales/new.ejs
│   │   └── reports/index.ejs
│   │
│   └── public/
│       ├── css/
│       │   ├── pico.min.css           (Pico CSS framework)
│       │   └── custom.css
│       └── js/
│           └── app.js                 🟨 Client-side helpers
│
└── tests/                             🧪 Test files (vazio, ready for you)
```

### 📁 Diretórios Importantes

| Diretório | Propósito | Quando editar |
|-----------|-----------|--------------|
| `/src` | Código TypeScript principal | Sempre que adicionar features |
| `/src/types` | Interfaces TypeScript | Novas entities ou tipos |
| `/src/repositories` | Queries ao banco | Novos dados/relationships |
| `/src/services` | Lógica de negócio | Cálculos, regras complexas |
| `/src/controllers` | Handlers HTTP | Novos endpoints |
| `/src/routes` | Mapeamento URLs | Registrar novas rotas |
| `/src/views` | Templates HTML/EJS | UI/forms |
| `/prisma/schema.prisma` | Data model | Novas tabelas |
| `/.env` | Variáveis de ambiente | Mudar config local |

---

## 🚀 Próximos Passos (In Order)

### 1️⃣ Setup Inicial (30 minutos)
```bash
# No terminal VS Code (Ctrl + `)
cd c:\Users\Eduardo\Documents\Projeto Venda Sacole Viviane

npm install
npm run prisma:generate
npm run db:push
npm run prisma:seed
npm run dev
```
✅ Abra browser em http://localhost:3000

### 2️⃣ Explorar o Código (30 minutos)
- Leia `README.md` completamente
- Abra `/src/server.ts` (entry point)
- Rastreie um e.g., GET /api/products:
  - Routes → Controller → Repository → DB

### 3️⃣ Testar a API (15 minutos)
```bash
# Terminal ou Postman/Insomnia

# Criar cliente
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","type":"PF","phone":"11999999999"}'

# Listar produtos
curl http://localhost:3000/api/products

# Criar venda
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{"customerId":1,"items":[{"productId":1,"quantity":2,"priceUnitBrl":1.00}],"paymentMethod":"PIX"}'
```

### 4️⃣ Implementar UI Interativa (2+ horas)
- Editar `/src/views/sales/new.ejs`
- Adicionar JavaScript para calcular totais
- Conectar formulários aos endpoints

### 5️⃣ Criar Novo Endpoint (Siga DEVELOPMENT_GUIDE.md)
Exemplo: "Ajuste de Estoque"
1. Define tipo
2. Create Zod schema
3. Add repository method
4. Create controller method
5. Add route
6. Test com curl

---

## 🔄 Workflow Day-to-Day

```
1. Start server
   npm run dev

2. Edit files in src/
   (Server hot-reloads)

3. Test changes
   curl / Browser / Postman

4. Check logs in terminal
   (Logger middleware prints requests)

5. Commit to git
   git add . && git commit -m "feat: description"
```

---

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

Test files go in `/tests` directory.

---

## 🎯 Key Business Rules (Don't Forget!)

✅ **Inventory Tracking**
- Every sale → InventoryMovement record
- Quantity cannot go negative
- Types: IN, OUT, ADJUST

✅ **Returnable Bottles Logic**
- On sale: increment ReturnableLedger, add deposit to customer balance
- On return: decrement ledger, refund deposit
- Formula: `quantityPending = quantityOut - quantityReturned`
- Deposit = quantityPending × R$ 5.00

✅ **Profit Calculation**
- Revenue = Qty × SalePrice
- COGS = Qty × CostPrice
- Profit = Revenue - COGS - Discount
- Production costs allocated to batches

✅ **Production Batches**
- Total cost / Quantity = Cost per unit
- Immutable after "COMPLETED"
- Automatically adds to inventory when completed

---

## 📞 Support & Questions

### Common Issues

**"Port already in use"**
→ Change PORT in .env to 3001

**"Cannot connect to database"**
→ Run: `npm run db:push`

**"Module not found"**
→ Run: `npm install` and `npm run prisma:generate`

**"Transaction conflicts"**
→ Check Prisma docs for transaction syntax

### Debug Mode

```bash
# Start with inspector
node --inspect -r ts-node/register src/server.ts

# Visit chrome://inspect
# Click "inspect"
# Set breakpoints
```

---

## 📚 External Resources

- **Prisma Docs**: https://www.prisma.io/docs/
- **Express.js**: https://expressjs.com/
- **TypeScript**: https://www.typescriptlang.org/
- **Zod Validation**: https://zod.dev/
- **Pico CSS**: https://picocss.com/

---

## ✅ Your First Task

1. ✅ Read README.md
2. ✅ Run `npm install && npm run db:push && npm run prisma:seed`
3. ✅ Start with `npm run dev`
4. ✅ Open http://localhost:3000 in browser
5. ✅ Test API: `curl http://localhost:3000/api/products`
6. ✅ Explore code: Open `/src/routes/products.ts` to understand the flow
7. ✅ Comment here with questions!

---

**Status**: 🟢 Pronto para desenvolvimento  
**Last updated**: 26 de Fevereiro de 2024  
**Next milestone**: Complete MVP UI (selling + returns) in Sprint 1  

Happy coding! 🚀
