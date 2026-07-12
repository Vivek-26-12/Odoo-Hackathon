import express from 'express';
import {
  addResource,
  listResources,
  editResource,
  bookResource,
  listResourceBookings,
  listUserBookings,
  cancelBooking,
  updateBookingTime
} from '../controllers/resourceController.js';
import protect, { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Resource administration
router.post('/', authorize('admin', 'asset_manager'), addResource);
router.get('/', listResources);
router.put('/:id', authorize('admin', 'asset_manager'), editResource);

// Booking operations
router.post('/book', bookResource);
router.get('/bookings', listUserBookings);
router.get('/:resource_id/bookings', listResourceBookings);
router.post('/bookings/:id/cancel', cancelBooking);
router.put('/bookings/:id/reschedule', updateBookingTime);

export default router;
