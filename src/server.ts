import { createApp } from '@/app';
import { config } from '@/config';

const app = createApp();
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🚀 Sistema de Gestão - Sacolé & Bebidas               ║
║  ─────────────────────────────────────────────────────    ║
║  Servidor rodando em: http://localhost:${PORT}           ║
║  Ambiente: ${config.nodeEnv.toUpperCase()}                                    ║
║  Moeda: ${config.currency}                                        ║
║  Depósito Garrafa: R$ ${config.returnableDepositValue.toFixed(2)}                   ║
╚════════════════════════════════════════════════════════════╝
  `);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
