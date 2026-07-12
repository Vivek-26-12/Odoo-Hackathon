import express from 'express';
import {
  raiseRequest,
  listRequests,
  getRequestDetails,
  updateRequest
} from '../controllers/maintenanceController.js';
import protect, { authorize } from '../middleware/authMiddleware.js';
import upload, { uploadImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Submission & general listing
router.post('/', upload.single('photo'), uploadImage, raiseRequest);
router.get('/', listRequests);
router.get('/:id', getRequestDetails);

// Status updates (managers only)
router.put('/:id', authorize('admin', 'asset_manager'), updateRequest);

export default router;
