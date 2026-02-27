import { Router } from 'express';
import { CustomerController } from '@/controllers/customerController';

const router = Router();

router.get('/', CustomerController.list);
router.post('/', CustomerController.create);
router.get('/:id', CustomerController.getById);
router.post('/:id/return-bottles', CustomerController.returnBottles);

export default router;
