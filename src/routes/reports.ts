import { Router } from 'express';
import { ReportController } from '@/controllers/reportController';

const router = Router();

router.get('/profit', ReportController.getProfitReport);
router.get('/best-sellers', ReportController.getBestSellers);
router.get('/inventory', ReportController.getInventoryValuation);
router.get('/returnables/outstanding', ReportController.getOutstandingReturnables);

export default router;
