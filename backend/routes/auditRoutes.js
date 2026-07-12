import express from 'express';
import {
  startAuditCycle,
  listAuditCycles,
  getAuditDetails,
  logVerification,
  discrepancyReport,
  closeCycle
} from '../controllers/auditController.js';
import protect, { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Schedule & close audits (managers only)
router.post('/', authorize('admin', 'asset_manager'), startAuditCycle);
router.post('/:id/close', authorize('admin', 'asset_manager'), closeCycle);

// General listings & verification submissions
router.get('/', listAuditCycles);
router.get('/:id', getAuditDetails);
router.post('/:id/verify/:asset_id', logVerification);
router.get('/:id/discrepancies', discrepancyReport);

export default router;
