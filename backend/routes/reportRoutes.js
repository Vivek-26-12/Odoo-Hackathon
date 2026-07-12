import express from 'express';
import { getDashboard, getReports } from '../controllers/reportController.js';
import protect, { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/analytics', authorize('admin', 'asset_manager', 'dept_head'), getReports);

export default router;
