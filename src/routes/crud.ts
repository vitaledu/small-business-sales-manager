import { Router } from 'express';
import { CrudController } from '@/controllers/crudController';

const router = Router();

// ========== DASHBOARD ==========
router.get('/', CrudController.dashboard);
router.get('/dashboard', CrudController.dashboard);

// ========== PRODUCTS ==========
router.get('/produtos', CrudController.productsList);
router.get('/produtos/novo', CrudController.productsNewForm);
router.post('/produtos', CrudController.productsCreate);
router.get('/produtos/:id/editar', CrudController.productsEditForm);
router.post('/produtos/:id/editar', CrudController.productsUpdate);
router.post('/produtos/:id/inativar', CrudController.productsInactivate);
router.post('/produtos/:id/reativar', CrudController.productsReactivate);
router.post('/produtos/:id/deletar', CrudController.productsDelete);

// ========== CUSTOMERS ==========
router.get('/clientes', CrudController.customersList);
router.get('/clientes/novo', CrudController.customersNewForm);
router.post('/clientes', CrudController.customersCreate);
router.get('/clientes/:id/editar', CrudController.customersEditForm);
router.post('/clientes/:id/editar', CrudController.customersUpdate);
router.post('/clientes/:id/deletar', CrudController.customersDelete);

// ========== PURCHASES ==========
router.get('/compras', CrudController.purchasesList);
router.get('/compras/nova', CrudController.purchasesNewForm);
router.post('/compras/nova', CrudController.purchasesCreate);
router.post('/compras/:id/finalizar', CrudController.purchasesFinalize);
router.post('/compras/:id/deletar', CrudController.purchasesDelete);

// ========== PRODUCTION BATCHES ==========
router.get('/lotes', CrudController.batchesList);
router.get('/lotes/novo', CrudController.batchesNewForm);
router.post('/lotes/novo', CrudController.batchesCreate);
router.post('/lotes/:id/finalizar', CrudController.batchesComplete);
router.post('/lotes/:id/deletar', CrudController.batchesDelete);

// ========== SALES ==========
router.get('/vendas', CrudController.salesList);
router.get('/vendas/nova', CrudController.salesNew);
router.post('/vendas', CrudController.salesCreate);

// ========== RETURNABLES ==========
router.get('/devolucoes', CrudController.returnablesList);
router.post('/devolucoes/registrar', CrudController.returnableRegister);

// ========== REPORTS ==========
router.get('/relatorios', CrudController.reports);

export default router;
