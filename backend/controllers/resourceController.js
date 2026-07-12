import {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  createBooking,
  getBookingsForResource,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  rescheduleBooking
} from '../models/resourceModel.js';
import { getDepartmentById } from '../models/orgModel.js';

// Add a new resource (Admin/Asset Manager)
export const addResource = async (req, res, next) => {
  try {
    const { name, type, description, status } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Resource name and type are required.' });
    }

    const validTypes = ['room', 'vehicle', 'equipment'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid resource type.' });
    }

    const insertId = await createResource({ name, type, description, status });
    res.status(201).json({
      success: true,
      message: 'Resource created successfully.',
      resourceId: insertId
    });
  } catch (error) {
    next(error);
  }
};

// List all resources
export const listResources = async (req, res, next) => {
  try {
    const resources = await getResources();
    res.status(200).json({ success: true, resources });
  } catch (error) {
    next(error);
  }
};

// Edit a resource
export const editResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, description, status } = req.body;

    if (!name || !type || !status) {
      return res.status(400).json({ success: false, message: 'Name, type, and status are required.' });
    }

    const existing = await getResourceById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    await updateResource(id, { name, type, description, status });
    res.status(200).json({ success: true, message: 'Resource updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// Create a booking
export const bookResource = async (req, res, next) => {
  try {
    const { resource_id, start_time, end_time, booked_for_type, department_id } = req.body;

    if (!resource_id || !start_time || !end_time || !booked_for_type) {
      return res.status(400).json({ success: false, message: 'All booking fields are required.' });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);
    const now = new Date();

    if (start < now) {
      return res.status(400).json({ success: false, message: 'Booking start time cannot be in the past.' });
    }

    if (start >= end) {
      return res.status(400).json({ success: false, message: 'Booking end time must be after the start time.' });
    }

    // Department-level booking authorization
    if (booked_for_type === 'department') {
      if (!department_id) {
        return res.status(400).json({ success: false, message: 'Department ID is required for department booking.' });
      }

      // Check if user is department head or admin
      if (req.user.role !== 'admin' && req.user.role !== 'asset_manager') {
        if (req.user.role !== 'dept_head' || req.user.department_id !== parseInt(department_id, 10)) {
          return res.status(403).json({
            success: false,
            message: 'Only Department Heads can book resources on behalf of their department.'
          });
        }
      }

      const department = await getDepartmentById(department_id);
      if (!department) {
        return res.status(404).json({ success: false, message: 'Department not found.' });
      }
    }

    try {
      const bookingId = await createBooking({
        resource_id,
        booked_by: req.user.id,
        booked_for_type,
        department_id: booked_for_type === 'department' ? department_id : null,
        start_time,
        end_time
      });

      res.status(201).json({
        success: true,
        message: 'Resource booked successfully.',
        bookingId
      });
    } catch (bookingError) {
      res.status(409).json({ success: false, message: bookingError.message });
    }
  } catch (error) {
    next(error);
  }
};

// List bookings for calendar view
export const listResourceBookings = async (req, res, next) => {
  try {
    const { resource_id } = req.params;
    const { start_date, end_date } = req.query;

    const bookings = await getBookingsForResource(resource_id, { start_date, end_date });
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
};

// List user bookings (list view)
export const listUserBookings = async (req, res, next) => {
  try {
    const bookings = await getAllBookings(req.user.id, req.user.role, req.user.department_id);
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
};

// Cancel booking
export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await getBookingById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled.' });
    }

    // Check authorization:
    // Admin, Asset Manager can cancel any booking.
    // Employee can cancel their own booking.
    // Dept Head can cancel bookings made by their department.
    let isAuthorized = false;
    if (req.user.role === 'admin' || req.user.role === 'asset_manager') {
      isAuthorized = true;
    } else if (booking.booked_by === req.user.id) {
      isAuthorized = true;
    } else if (req.user.role === 'dept_head' && booking.department_id === req.user.department_id) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not have permission to cancel this booking.'
      });
    }

    await updateBookingStatus(id, 'Cancelled');
    res.status(200).json({ success: true, message: 'Booking cancelled successfully.' });
  } catch (error) {
    next(error);
  }
};

// Reschedule booking
export const updateBookingTime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { start_time, end_time } = req.body;

    if (!start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'Start time and end time are required.' });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);
    const now = new Date();

    if (start < now) {
      return res.status(400).json({ success: false, message: 'Rescheduled start time cannot be in the past.' });
    }

    if (start >= end) {
      return res.status(400).json({ success: false, message: 'End time must be after the start time.' });
    }

    const booking = await getBookingById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Check authorization (same as cancellation)
    let isAuthorized = false;
    if (req.user.role === 'admin' || req.user.role === 'asset_manager') {
      isAuthorized = true;
    } else if (booking.booked_by === req.user.id) {
      isAuthorized = true;
    } else if (req.user.role === 'dept_head' && booking.department_id === req.user.department_id) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not have permission to reschedule this booking.'
      });
    }

    try {
      await rescheduleBooking(id, { start_time, end_time });
      res.status(200).json({ success: true, message: 'Booking rescheduled successfully.' });
    } catch (bookingError) {
      res.status(409).json({ success: false, message: bookingError.message });
    }
  } catch (error) {
    next(error);
  }
};
