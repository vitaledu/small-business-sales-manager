# Sistema de Gestão — Sacolé & Bebidas

Aplicação web local para gerenciar produção, estoque, compras e vendas de sacolé e bebidas, com rastreamento de garrafas retornáveis.

**Stack:** Node.js · TypeScript · Express · Prisma ORM · SQLite · EJS

---

## Instalação e Inicialização

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar o banco de dados

```bash
npm run db:push
```

### 3. Popular com dados de exemplo (opcional)

```bash
npm run prisma:seed
```

### 4. Iniciar o servidor

```bash
npm run dev
```

Acesse **http://localhost:3000**

---

## Funcionalidades

### Produtos

- Cadastro com nome, tipo (Sacolé / Bebida / Outros), origem (Produzido / Comprado), preço, custo e descrição
- Campo de valor de depósito retornável por produto (usado automaticamente nas vendas)
- Ciclo de vida: **Ativo → Inativo → Ativo** (inativar / reativar) ou **Deletar** (só produtos sem movimentações)
- Custo médio ponderado atualizado automaticamente a cada compra recebida ou lote finalizado

### Clientes

- Cadastro com nome, tipo (PF / PJ), telefone, logradouro e bairro
- Histórico de retornáveis por cliente

### Compras

- Criação em rascunho (DRAFT) com fornecedor e itens
- **Receber:** finaliza a compra, dá entrada no estoque e atualiza custo médio ponderado dos produtos
- **Cancelar:** exclui a compra enquanto ainda em DRAFT (sem movimentações geradas)
- **Estornar Recebimento:** devolve estoque de forma parcial ou total, com controle de quantidade já estornada por item; marca a compra como CANCELADA quando 100% estornada

### Lotes de Produção

- Registro de lotes com custo total e quantidade produzida
- Calcula custo por unidade automaticamente
- Finalizar: dá entrada no estoque e atualiza custo médio ponderado do produto

### Vendas

- Seleção de cliente e múltiplos itens
- Validação de estoque em tempo real: não permite quantidade acima do disponível; exibe balão indicando o estoque atual ao tentar exceder
- Depósito retornável opcional por item (usa o valor de depósito configurado no produto)
- Métodos de pagamento: Dinheiro, PIX, Débito, Crédito (com taxa em % ou R$ fixo)
- **Desfazer venda:** modal pergunta se o produto foi devolvido — se sim, restaura o estoque; se não, apenas cancela o faturamento

### Devoluções de Retornáveis

- Registro de devoluções de garrafas por cliente
- Atualiza o saldo de retornáveis pendentes

### Relatórios

- Visão geral de vendas, lucro, produtos mais vendidos e estoque atual

### Movimentações de Estoque

- Histórico completo de todas as entradas e saídas de estoque
- Filtros por período (data inicial / data final), tipo (Entrada / Saída) e motivo (Venda, Compra, Produção, Cancelamento, Estorno Compra, Ajuste)
- Filtros rápidos: Hoje, Ontem, Esta Semana, Este Mês, Tudo
- Paginação com 50 registros por página
- Cards de resumo do período (total, entradas, saídas) independentes da página atual
- Busca local por produto, motivo ou referência

### Configurações

- **Exportar Backup:** gera arquivo `.xlsx` com as categorias selecionadas (Produtos, Clientes, Vendas, Compras, Lotes, Movimentações). Cada categoria vira uma aba separada.
- **Importar Dados:** importa Produtos e Clientes de um `.xlsx` no mesmo formato do backup; registros com nomes já existentes são ignorados automaticamente
- **Zerar Dados:** remove permanentemente as categorias selecionadas, com modal de confirmação exigindo digitação de `CONFIRMAR`; valida dependências (ex: não zera Clientes enquanto houver Vendas)

---

## Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Dashboard |
| GET | `/produtos` | Lista de produtos |
| GET | `/produtos/novo` | Formulário de novo produto |
| POST | `/produtos` | Criar produto |
| GET | `/produtos/:id/editar` | Formulário de edição |
| POST | `/produtos/:id/editar` | Salvar edição |
| POST | `/produtos/:id/inativar` | Inativar produto |
| POST | `/produtos/:id/reativar` | Reativar produto |
| POST | `/produtos/:id/deletar` | Deletar produto |
| GET | `/clientes` | Lista de clientes |
| GET | `/clientes/novo` | Novo cliente |
| POST | `/clientes` | Criar cliente |
| GET | `/clientes/:id/editar` | Editar cliente |
| POST | `/clientes/:id/editar` | Salvar edição |
| POST | `/clientes/:id/deletar` | Deletar cliente |
| GET | `/compras` | Lista de compras |
| GET | `/compras/nova` | Nova compra |
| POST | `/compras/nova` | Criar compra |
| POST | `/compras/:id/finalizar` | Receber compra |
| POST | `/compras/:id/cancelar` | Cancelar DRAFT |
| POST | `/compras/:id/estornar` | Estornar recebimento |
| POST | `/compras/:id/deletar` | Deletar compra |
| GET | `/lotes` | Lista de lotes |
| GET | `/lotes/novo` | Novo lote |
| POST | `/lotes/novo` | Criar lote |
| POST | `/lotes/:id/finalizar` | Finalizar lote |
| POST | `/lotes/:id/deletar` | Deletar lote |
| GET | `/vendas` | Lista de vendas |
| GET | `/vendas/nova` | Nova venda |
| POST | `/vendas` | Criar venda |
| POST | `/vendas/:id/cancelar` | Desfazer venda |
| GET | `/devolucoes` | Devoluções de retornáveis |
| POST | `/devolucoes/registrar` | Registrar devolução |
| GET | `/relatorios` | Relatórios |
| GET | `/movimentacoes` | Movimentações de estoque |
| GET | `/configuracoes` | Configurações |
| POST | `/configuracoes/exportar` | Download do backup Excel |
| POST | `/configuracoes/importar` | Importar Excel |
| POST | `/configuracoes/zerar` | Zerar dados |

---

## Estrutura do Projeto

```
src/
├── controllers/
│   ├── crudController.ts       # Dashboard, produtos, clientes, compras, lotes, vendas, devoluções, relatórios
│   └── settingsController.ts   # Movimentações, configurações, backup, importação, zeramento
├── repositories/
│   ├── productRepository.ts    # Acesso a produtos e cálculo de estoque
│   ├── purchaseRepository.ts   # Compras, cancelamento, estorno
│   └── ...
├── routes/
│   └── crud.ts                 # Todas as rotas da aplicação
├── views/
│   ├── layout/
│   │   └── main.ejs            # Layout base com sidebar
│   └── modules/
│       ├── dashboard.ejs
│       ├── products-list.ejs / product-form.ejs
│       ├── customers-list.ejs / customer-form.ejs
│       ├── purchases-list.ejs / purchase-form.ejs
│       ├── batches-list.ejs / batch-form.ejs
│       ├── sales-list.ejs / sale-form.ejs
│       ├── returnables-list.ejs
│       ├── reports.ejs
│       ├── movimentacoes-list.ejs
│       └── settings.ejs
├── public/
│   └── css/custom.css
├── db/client.ts
└── server.ts

prisma/
├── schema.prisma
└── dev.db
```

---

## Banco de Dados

Arquivo SQLite em `prisma/dev.db`.

### Modelos principais

| Modelo | Descrição |
|--------|-----------|
| `Product` | Produtos com custo médio ponderado, origem, depósito |
| `Customer` | Clientes com saldo de retornáveis |
| `PurchaseOrder` / `PurchaseItem` | Compras (DRAFT / RECEIVED / CANCELLED) |
| `ProductionBatch` | Lotes de produção (OPEN / COMPLETED) |
| `SaleOrder` / `SaleItem` | Vendas (COMPLETED / CANCELLED) |
| `InventoryMovement` | Todas as movimentações de estoque (raiz da verdade do estoque) |
| `ReturnableLedger` | Saldo de garrafas retornáveis por cliente |

O estoque de cada produto é calculado como a **soma de todas as `InventoryMovement`** (valores positivos = entrada, negativos = saída).

---

## Scripts

```bash
npm run dev          # Inicia servidor em modo desenvolvimento (ts-node)
npm run build        # Compila TypeScript para dist/
npm start            # Inicia versão compilada
npm run db:push      # Cria/atualiza banco de dados
npm run db:reset     # Apaga e recria o banco (perde todos os dados)
npm run prisma:seed  # Popula com dados de exemplo
npm test             # Executa testes (Jest)
```

---

## Observações Técnicas

- **Sem hot reload:** alterações em arquivos `.ts` exigem reiniciar o servidor. Templates `.ejs` recarregam automaticamente a cada requisição.
- **UTC vs. hora local:** datas são sempre parseadas como meia-noite local (`new Date(y, m-1, d)`) para evitar o deslocamento de fuso UTC-3 que afeta `new Date("YYYY-MM-DD")`.
- **Custo médio ponderado:** calculado antes de gravar a movimentação de entrada — `(estoqueAtual × custoAtual + qtdNova × custoNovo) / (estoqueAtual + qtdNova)`.
- **JSON em atributos HTML:** dados passados para modais usam `encodeURIComponent(JSON.stringify(...))` para evitar quebra por aspas em nomes de produtos.

---

Desenvolvido para Viviane. Última atualização: fevereiro de 2026.
