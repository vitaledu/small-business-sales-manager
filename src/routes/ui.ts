import { Router } from 'express';
import { ViewController } from '@/controllers/viewController';

const router = Router();

// Dashboard / Home
router.get('/', ViewController.dashboard);

// Produtos
router.get('/produtos', ViewController.produtos);

// Clientes
router.get('/clientes', ViewController.clientes);

// Venda Nova
router.get('/vendas/nova', ViewController.vendaNova);

// Relatórios
router.get('/relatorios', ViewController.relatorios);

// Devoluções
router.get('/devolucoes', ViewController.devolucoes);

export default router;
