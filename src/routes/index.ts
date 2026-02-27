import { Router } from 'express';
import crudRouter from './crud';
import productsRouter from './products';
import customersRouter from './customers';
import salesRouter from './sales';
import reportsRouter from './reports';

const router = Router();

// CRUD Routes (UI) - must be registered BEFORE API routes
router.use(crudRouter);

// API Routes
router.use('/api/products', productsRouter);
router.use('/api/customers', customersRouter);
router.use('/api/sales', salesRouter);
router.use('/api/reports', reportsRouter);

// Health check
router.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
