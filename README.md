# 📦 Sistema de Gestão - Sacolé & Bebidas v2.0

**Refactoring Completo - Produção Pronto**

Aplicação Node.js + TypeScript para gerenciar produção, estoque e vendas de sacolé e bebidas com rastreamento de garrafas retornáveis.

## 🚀 Características Principais

- ✅ **Gerenciamento de Produtos**: Sacolé e bebidas com custos e preços
- ✅ **Controle de Estoque**: Rastreamento em tempo real de entradas e saídas
- ✅ **Produção de Lotes**: Calcular custo por unidade de sacolé
- ✅ **Gestão de Clientes**: Pessoas físicas e revendedores
- ✅ **Registro de Vendas**: POS simples com múltiplos métodos de pagamento
- ✅ **Garrafas Retornáveis**: Rastreamento de depósitos e devoluções
- ✅ **Relatórios**: Lucro, melhores vendas, inventário, devoluções pendentes
- ✅ **Histórico/Auditoria**: Log de todas as operações
- ✅ **Interface em Português**: 100% localizado

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: SQLite + Prisma ORM
- **Validation**: Zod
- **Frontend**: Server-rendered EJS + Pico CSS
- **Testing**: Jest

## 📋 Pré-requisitos

- Node.js 18+ (download em https://nodejs.org/)
- npm 8+ (vem com Node.js)
- Windows/Mac/Linux
- VS Code (recomendado)

## ⚡ Quick Start

### 1. Clone ou Prepare o Projeto

```bash
cd "c:\Users\Eduardo\Documents\Projeto Venda Sacole Viviane"
```

### 2. Instale Dependências

```bash
npm install
```

Isso instalará todas as dependências listadas em `package.json`:
- Express, Prisma, Zod, TypeScript, etc.

### 3. Configure o Banco de Dados

#### a) Gere o cliente Prisma
```bash
npm run prisma:generate
```

#### b) Crie o banco de dados e aplique migrations
```bash
npm run db:push
```

#### c) Populate com dados de exemplo (seed)
```bash
npm run prisma:seed
```

Isso criará:
- 4 produtosde exemplo (sacolés e bebidas)
- 3 clientes de teste
- 1 lote de produção
- 1 compra
- 1 venda com garrafa retornável pendente

### 4. Inicie o Servidor

```bash
npm run dev
```

Você verá:
```
╔════════════════════════════════════════════════════════════╗
║  🚀 Sistema de Gestão - Sacolé & Bebidas               ║
║  ─────────────────────────────────────────────────────    ║
║  Servidor rodando em: http://localhost:3000           ║
║  Ambiente: DEVELOPMENT                                    ║
║  Moeda: BRL                                        ║
║  Depósito Garrafa: R$ 5.00                   ║
╚════════════════════════════════════════════════════════════╝
```

### 5. Acesse a Aplicação

Abra seu navegador em: **http://localhost:3000**

## 📱 URLs Principais

| Rota | Descrição |
|------|-----------|
| `GET /` | Dashboard |
| `GET /produtos` | Lista de produtos |
| `GET /clientes` | Lista de clientes |
| `GET /vendas/nova` | Nova venda |
| `GET /relatorios` | Relatórios |
| `GET /devolucoes` | Devoluções de garrafas |
| `GET /api/health` | Status da API |

## 🔌 API Endpoints (REST)

### Produtos
```bash
GET    /api/products              # Listar todos
POST   /api/products              # Criar novo
GET    /api/products/:id          # Detalhe
PUT    /api/products/:id          # Atualizar
DELETE /api/products/:id          # Deletar (marcar inativo)
GET    /api/products/warehouse    # Estoque completo
```

### Clientes
```bash
GET    /api/customers             # Listar
POST   /api/customers             # Criar
GET    /api/customers/:id         # Detalhe com retornáveis
POST   /api/customers/:id/return-bottles  # Registrar devolução
```

### Vendas
```bash
POST   /api/sales                 # Criar venda
GET    /api/sales/detail/:id      # Detalhe da venda
GET    /api/sales/date-range?startDate=&endDate=  # Por período
GET    /api/sales/customer/:customerId # Por cliente
```

### Relatórios
```bash
GET    /api/reports/profit?startDate=&endDate=    # Lucro
GET    /api/reports/best-sellers?startDate=&endDate=&limit=10
GET    /api/reports/inventory                     # Estoque
GET    /api/reports/returnables/outstanding       # Garrafas pendentes
```

### Exemplo de Requisição (curl)

```bash
# Criar novo cliente
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Silva",
    "type": "PF",
    "phone": "11987654321",
    "neighborhood": "Centro"
  }'

# Criar venda
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "items": [
      {
        "productId": 1,
        "quantity": 5,
        "priceUnitBrl": 1.00
      }
    ],
    "paymentMethod": "PIX"
  }'

# Consultar lucro do dia
curl "http://localhost:3000/api/reports/profit?startDate=2024-02-26&endDate=2024-02-26"
```

## 🗄️ Banco de Dados

O banco de dados SQLite é armazenado em:
```
prisma/dev.db
```

### Tabelas Principais

- **Product**: Produtos (sacolé, bebidas)
- **Customer**: Clientes
- **SaleOrder**: Vendas
- **SaleItem**: Itens de cada venda
- **ProductionBatch**: Lotes de produção
- **InventoryMovement**: Histórico de entradas/saídas
- **ReturnableLedger**: Rastreamento de garrafas
- **AuditLog**: Log de operações

### Reset do Banco (Limpar e Recriar)

```bash
npm run db:reset
```

⚠️ Isso **deletará todos os dados** e recriará com dados de exemplo.

## 🔧 Configuração

Crie um arquivo `.env` na raiz do projeto (copie `.env.example`):

```bash
cp .env.example .env
```

Edite conforme necessário:

```env
# Database
DATABASE_URL="file:./dev.db"

# Server
NODE_ENV="development"
PORT=3000

# Business
RETURNABLE_DEPOSIT_VALUE=5.00  # Depósito por garrafa em BRL
CURRENCY="BRL"
TIMEZONE="America/Sao_Paulo"

# Segurança opcional
SYSTEM_PIN=""                  # Deixar vazio para sem PIN
```

## 📝 Estrutura do Projeto

```
src/
├── types/              # TypeScript interfaces
├── controllers/        # Route handlers (HTTP logic)
├── services/          # Business logic
├── repositories/      # Data access layer
├── middleware/        # Express middleware
├── routes/            # API routes
├── views/            # EJS templates (UI)
├── public/           # Static assets (CSS, JS)
├── utils/            # Helper functions
├── db/               # Prisma client
├── app.ts            # Express setup
└── server.ts         # Entry point

prisma/
├── schema.prisma     # Data model
├── seed.ts          # Example data
└── dev.db           # SQLite database

package.json          # Dependencies
tsconfig.json         # TypeScript config
jest.config.js        # Test config
.env                  # Ambiente variables
README.md             # Este arquivo
```

## 🧪 Testes

### Executar Testes
```bash
npm test
```

### Testes em Watch Mode (re-executa ao salvar)
```bash
npm run test:watch
```

## 🏗️ Build para Produção

```bash
npm run build
```

Isso compila TypeScript para JavaScript em `dist/`.

Para iniciar a versão compilada:
```bash
npm start
```

## 📚 Desenvolvimento

### Hot Reload
Quando você edita arquivos `.ts`, o servidor reinicia automaticamente com `npm run dev`.

### Debug
Para debug, use:
```bash
node --inspect -r ts-node/register src/server.ts
```
E abra `chrome://inspect` no Chrome.

## 🐛 Troubleshooting

### Error: "Cannot find module 'prisma'"
```bash
npm install @prisma/client prisma
```

### Error: "Port 3000 already in use"
Mude a porta em `.env`:
```env
PORT=3001
```

### Banco de dados corrompido
Delete o arquivo `prisma/dev.db` e recrie:
```bash
npm run db:reset
```

### Módulos TypeScript não encontrados
```bash
npm run prisma:generate
```

## 📖 Próximos Passos

1. **Implementar UI interativa** (adicionar mais HTML/JavaScript)
2. **Adicionar autenticação** (PIN simples ou login)
3. **Criar mobile app** (React Native ou Flutter)
4. **Integração de pagamento** (PIX, Gateway)
5. **Backup automático** (S3, Google Drive)
6. **Dashboard gráfico** (Charts.js, D3)
7. **Funcionalidades avançadas** (Crediário, despesas, metas)

## 📞 Suporte & Roadmap

### Versão 1.0 (MVP - Atual)
- ✅ Produtos, Clientes, Vendas
- ✅ Estoque, Lotes, Garrafas
- ✅ Relatórios básicos
- ✅ API REST

### Versão 1.5 (Planejado)
- [ ] UI mais polida (dashboard gráfico)
- [ ] Formulários completos e validações
- [ ] Backup automático
- [ ] Relatórios em PDF

### Versão 2.0 (Futuro)
- [ ] Multi-usuário com permissões
- [ ] Aplicativo mobile (leitura de QR)
- [ ] Integração com redes sociais
- [ ] IA para previsão de demanda

## 📄 Licença

MIT - Use livremente!

## 👩‍💻 Desenvolvedor

Desenvolvido com ❤️ para Viviane.

---

**Dúvidas?** Revise a [Especificação Completa](./SPEC.md) (não incluída aqui, mas referenciada no PRD).

**Última atualização**: 26 de Fevereiro de 2024  
**Status**: 🟢 Pronto para desenvolvimento
