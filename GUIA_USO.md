# Guia de Uso — Sistema de Gestão Sacolé & Bebidas

Acesse o sistema em **http://localhost:3000** após iniciar com `npm run dev`.

---

## Navegação

A barra lateral à esquerda divide o sistema em seções:

| Seção | Páginas |
|-------|---------|
| **Vendas** | Dashboard · Nova Venda · Lista de Vendas |
| **Estoque** | Compras · Lotes de Produção · Devoluções |
| **Cadastros** | Produtos · Clientes |
| **Análise** | Relatórios |
| **Sistema** | Movimentações · Configurações |

---

## Fluxo do Dia a Dia

### Receber mercadoria comprada

1. Vá em **Compras → + Nova Compra**
2. Informe fornecedor e adicione os itens (produto + quantidade + custo unitário)
3. Salve — a compra fica com status **RASCUNHO**
4. Na lista de compras, clique **Receber** para confirmar o recebimento
5. O estoque é atualizado e o custo médio dos produtos é recalculado automaticamente

> Se a compra ainda estiver em rascunho, use **Cancelar** para excluí-la.
> Se já foi recebida mas precisa devolver itens ao fornecedor, use **Estornar Recebimento** (parcial ou total).

---

### Produzir sacolé

1. Vá em **Lotes → + Novo Lote**
2. Informe descrição, data, produto, quantidade produzida e custo total do lote
3. Salve — o lote fica **ABERTO**
4. Clique **Finalizar** para dar entrada no estoque
5. O custo médio do produto é atualizado com o custo por unidade do lote

---

### Registrar uma venda

1. Vá em **Vendas → + Nova Venda**
2. Selecione o cliente
3. Adicione os produtos:
   - O estoque disponível de cada produto é exibido ao selecioná-lo
   - Não é possível vender quantidade acima do estoque (um balão avisa o limite)
   - Produtos retornáveis têm a opção de cobrar depósito por item (marcado por padrão)
4. Configure pagamento: Dinheiro, PIX, Débito ou Crédito
   - Para cartão: informe a taxa em % ou R$ fixo
5. Aplique desconto se necessário (em R$ ou %)
6. Clique **Confirmar Venda**

#### Desfazer uma venda

Na lista de vendas, clique **↩ Desfazer** na venda desejada.
Um modal pergunta se o produto foi devolvido:
- **Sim, devolveu** → cancela o faturamento E restaura o estoque
- **Não devolveu** → cancela apenas o faturamento (estoque permanece baixado)

---

### Controlar garrafas retornáveis

1. Vá em **Devoluções**
2. A lista mostra todos os clientes com garrafas pendentes e o valor do depósito em aberto
3. Clique **Registrar Devolução**, informe o cliente e a quantidade devolvida
4. O saldo de retornáveis do cliente é atualizado

---

## Módulos em Detalhe

### Produtos

- **Cadastrar:** nome, tipo (Sacolé / Bebida / Outros), origem (Produzido / Comprado), preço de venda, custo unitário, valor do depósito retornável, descrição
- **Ciclo de vida:** Ativo → Inativar → Reativar (ou Deletar se não tiver movimentações)
- O custo unitário é atualizado automaticamente pelo sistema via custo médio ponderado a cada compra recebida ou lote finalizado — não precisa editar manualmente

### Clientes

- Cadastro com nome, tipo (PF / PJ), telefone, logradouro e bairro
- Exibe saldo de retornáveis pendentes no cabeçalho do cliente

### Movimentações de Estoque

Página de auditoria completa de todas as entradas e saídas.

**Filtros disponíveis:**
- Período (data inicial e data final)
- Tipo: Entrada / Saída / Todos
- Motivo: Venda, Compra, Produção, Cancelamento, Estorno Compra, Ajuste

**Filtros rápidos:** Hoje · Ontem · Esta Semana · Este Mês · Tudo

Os cards de resumo (total de registros, entradas, saídas) sempre refletem o período completo, independente da página atual. A tabela mostra 50 registros por página.

---

## Configurações

Acesse em **Sistema → Configurações**.

### Exportar Backup (Excel)

Selecione as categorias desejadas e clique **Baixar Excel**.
Cada categoria vira uma aba separada no arquivo `.xlsx`:
- Produtos
- Clientes
- Vendas e itens de venda
- Compras e itens de compra
- Lotes de produção
- Movimentações de estoque

### Importar Dados

Importa **Produtos** e **Clientes** de um `.xlsx` no mesmo formato do backup.
Registros com nomes já existentes são ignorados (sem duplicação).
Vendas, compras e lotes não são reimportados.

### Zerar Dados

Remove permanentemente os dados selecionados.

**Ordem recomendada para zerar tudo:**
1. Vendas
2. Compras
3. Lotes
4. Movimentos restantes
5. Clientes
6. Produtos

O sistema bloqueia zeramentos inválidos (ex: não permite zerar Clientes se ainda houver Vendas vinculadas).

> Faça um backup antes de zerar. A confirmação exige digitar `CONFIRMAR` no campo de texto.

---

## Backup Manual do Banco de Dados

O banco de dados fica em `prisma/dev.db`. Para backup manual:

```powershell
# Fazer backup
Copy-Item prisma\dev.db prisma\dev.db.bak

# Restaurar
Copy-Item prisma\dev.db.bak prisma\dev.db
```

---

## Solução de Problemas

| Problema | Solução |
|----------|---------|
| Página não carrega / erro 500 | Verifique o terminal do Node; reinicie com `npm run dev` |
| Porta 3000 em uso | Feche outros terminais; ou altere `PORT` no `.env` |
| Estoque errado | Consulte **Movimentações** para ver toda a trilha de auditoria |
| Precisa resetar tudo | Use a tela de **Configurações → Zerar** (ou `npm run db:reset` ⚠️ apaga tudo) |
| Alteração no código não surtiu efeito | Reinicie o servidor (Ctrl+C → `npm run dev`) — templates `.ejs` recarregam automaticamente, mas arquivos `.ts` exigem reinício |
