import express from 'express';
import {
  createDept,
  getDepts,
  updateDept,
  createCat,
  getCats,
  updateCat,
  listEmployees,
  promoteEmployee,
  toggleEmployeeStatus,
  assignEmployeeDept
} from '../controllers/orgController.js';
import protect, { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Department endpoints
router.post('/departments', authorize('admin'), createDept);
router.get('/departments', getDepts);
router.put('/departments/:id', authorize('admin'), updateDept);

// Asset Category endpoints
router.post('/categories', authorize('admin'), createCat);
router.get('/categories', getCats);
router.put('/categories/:id', authorize('admin'), updateCat);

// Employee Directory endpoints
router.get('/employees', listEmployees);
router.patch('/employees/:id/role', authorize('admin'), promoteEmployee);
router.patch('/employees/:id/status', authorize('admin'), toggleEmployeeStatus);
router.patch('/employees/:id/department', authorize('admin'), assignEmployeeDept);

export default router;
