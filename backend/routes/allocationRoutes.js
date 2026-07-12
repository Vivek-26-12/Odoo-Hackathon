import express from 'express';
import {
  allocateAsset,
  requestTransfer,
  listTransfers,
  resolveTransferRequest,
  checkInAsset,
  listOverdue
} from '../controllers/allocationController.js';
import protect, { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Allocate asset (admin and asset_manager only)
router.post('/', authorize('admin', 'asset_manager'), allocateAsset);

// Return asset (admin and asset_manager only)
router.post('/:asset_id/return', authorize('admin', 'asset_manager'), checkInAsset);

// Overdue returns (admin and asset_manager only)
router.get('/overdue', authorize('admin', 'asset_manager'), listOverdue);

// Transfer requests (accessible by any employee to request, or managers to view/resolve)
router.post('/transfer-request', requestTransfer);
router.get('/transfers', listTransfers);
router.patch('/transfers/:id/resolve', resolveTransferRequest);

export default router;
