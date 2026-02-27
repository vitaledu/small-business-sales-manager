import { Router } from 'express';
import { ProductController } from '@/controllers/productController';

const router = Router();

router.get('/', ProductController.list);
router.get('/warehouse', ProductController.getWarehouse);
router.post('/', ProductController.create);
router.get('/:id', ProductController.getById);
router.put('/:id', ProductController.update);
router.delete('/:id', ProductController.delete);

export default router;
