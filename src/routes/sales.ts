import { Router } from 'express';
import { SaleController } from '@/controllers/saleController';

const router = Router();

router.post('/', SaleController.create);
router.get('/detail/:id', SaleController.getById);
router.get('/date-range', SaleController.listByDateRange);
router.get('/customer/:customerId', SaleController.listByCustomer);

export default router;
