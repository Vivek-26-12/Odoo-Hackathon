import express from 'express';
import {
  registerAsset,
  listAssets,
  getAssetDetails,
  getHistory,
  editAsset
} from '../controllers/assetController.js';
import protect, { authorize } from '../middleware/authMiddleware.js';
import upload, { uploadImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Modify access is restricted to admin and asset_manager
router.post('/', authorize('admin', 'asset_manager'), upload.single('photo'), uploadImage, registerAsset);
router.get('/', listAssets);
router.get('/:id', getAssetDetails);
router.get('/:id/history', getHistory);
router.put('/:id', authorize('admin', 'asset_manager'), upload.single('photo'), uploadImage, editAsset);

export default router;
