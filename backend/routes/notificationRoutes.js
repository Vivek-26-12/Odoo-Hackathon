import express from 'express';
import {
  listNotifications,
  readNotification,
  readAllNotifications,
  listActivityLogs
} from '../controllers/notificationController.js';
import protect, { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', listNotifications);
router.patch('/:id/read', readNotification);
router.patch('/read-all', readAllNotifications);
router.get('/logs', authorize('admin', 'asset_manager', 'dept_head'), listActivityLogs);

export default router;
