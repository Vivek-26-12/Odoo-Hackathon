import express from 'express';
import {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  logout
} from '../controllers/authController.js';
import protect from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public & rate-limited endpoints
router.post('/register', authRateLimiter, register);
router.post('/verify-email', authRateLimiter, verifyEmail);
router.post('/login', authRateLimiter, login);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);

// Protected endpoints
router.get('/me', protect, getMe);
router.post('/logout', logout);

export default router;
