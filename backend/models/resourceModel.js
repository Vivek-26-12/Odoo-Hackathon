import pool from '../config/db.js';

// --- RESOURCE CRUD ---

export const createResource = async ({ name, type, description, status }) => {
  const query = `
    INSERT INTO resources (name, type, description, status)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await pool.query(query, [
    name.trim(),
    type,
    description ? description.trim() : null,
    status || 'Active'
  ]);
  return result.insertId;
};

export const getResources = async () => {
  const query = 'SELECT * FROM resources ORDER BY name ASC';
  const [rows] = await pool.query(query);
  return rows;
};

export const getResourceById = async (id) => {
  const query = 'SELECT * FROM resources WHERE id = ? LIMIT 1';
  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
};

export const updateResource = async (id, { name, type, description, status }) => {
  const query = `
    UPDATE resources 
    SET name = ?, type = ?, description = ?, status = ?
    WHERE id = ?
  `;
  const [result] = await pool.query(query, [
    name.trim(),
    type,
    description ? description.trim() : null,
    status,
    id
  ]);
  return result.affectedRows > 0;
};

// --- BOOKINGS FUNCTIONS ---

// Create booking with overlap verification
export const createBooking = async ({
  resource_id,
  booked_by,
  booked_for_type,
  department_id,
  start_time,
  end_time
}) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Verify resource exists and is active
    const [resources] = await connection.query('SELECT status FROM resources WHERE id = ? FOR UPDATE', [resource_id]);
    if (resources.length === 0) {
      throw new Error('Resource not found.');
    }
    if (resources[0].status !== 'Active') {
      throw new Error('Resource is currently inactive.');
    }

    // 2. Overlap validation check
    const overlapQuery = `
      SELECT id FROM bookings 
      WHERE resource_id = ? 
        AND start_time < ? 
        AND end_time > ? 
        AND status != 'Cancelled'
      LIMIT 1
      FOR UPDATE
    `;
    const [overlaps] = await connection.query(overlapQuery, [resource_id, end_time, start_time]);
    
    if (overlaps.length > 0) {
      throw new Error('Overlap conflict: The resource is already booked during this time slot.');
    }

    // 3. Insert booking
    const insertQuery = `
      INSERT INTO bookings (resource_id, booked_by, booked_for_type, department_id, start_time, end_time, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Upcoming')
    `;
    const [result] = await connection.query(insertQuery, [
      resource_id,
      booked_by,
      booked_for_type,
      department_id || null,
      start_time,
      end_time
    ]);

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Get bookings for a resource (with optional date filtering for calendar view)
export const getBookingsForResource = async (resource_id, { start_date, end_date } = {}) => {
  let query = `
    SELECT b.*, 
           u.full_name AS booked_by_name,
           u.email AS booked_by_email,
           d.name AS department_name
    FROM bookings b
    LEFT JOIN users u ON b.booked_by = u.id
    LEFT JOIN departments d ON b.department_id = d.id
    WHERE b.resource_id = ?
  `;
  const params = [resource_id];

  if (start_date) {
    query += ' AND b.start_time >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND b.end_time <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY b.start_time ASC';
  const [rows] = await pool.query(query, params);
  return rows;
};

// Get all bookings (for list views)
export const getAllBookings = async (userId, userRole, userDeptId) => {
  let query = `
    SELECT b.*, 
           r.name AS resource_name,
           r.type AS resource_type,
           u.full_name AS booked_by_name,
           d.name AS department_name
    FROM bookings b
    LEFT JOIN resources r ON b.resource_id = r.id
    LEFT JOIN users u ON b.booked_by = u.id
    LEFT JOIN departments d ON b.department_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (userRole === 'employee') {
    query += ' AND b.booked_by = ?';
    params.push(userId);
  } else if (userRole === 'dept_head') {
    query += ' AND (b.booked_by = ? OR b.department_id = ?)';
    params.push(userId, userDeptId);
  } // Admins and Asset Managers can see all

  query += ' ORDER BY b.start_time DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

export const getBookingById = async (id) => {
  const query = `
    SELECT b.*, r.name AS resource_name, r.status AS resource_status
    FROM bookings b
    LEFT JOIN resources r ON b.resource_id = r.id
    WHERE b.id = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
};

// Update booking status (e.g. Cancel booking)
export const updateBookingStatus = async (id, status) => {
  const query = 'UPDATE bookings SET status = ? WHERE id = ?';
  const [result] = await pool.query(query, [status, id]);
  return result.affectedRows > 0;
};

// Reschedule booking with overlap check
export const rescheduleBooking = async (id, { start_time, end_time }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch current booking details
    const [bookings] = await connection.query('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [id]);
    if (bookings.length === 0) {
      throw new Error('Booking not found.');
    }
    const booking = bookings[0];
    if (booking.status === 'Cancelled' || booking.status === 'Completed') {
      throw new Error(`Cannot reschedule a booking that is already ${booking.status}.`);
    }

    // 2. Overlap validation check excluding this booking
    const overlapQuery = `
      SELECT id FROM bookings 
      WHERE resource_id = ? 
        AND id != ?
        AND start_time < ? 
        AND end_time > ? 
        AND status != 'Cancelled'
      LIMIT 1
      FOR UPDATE
    `;
    const [overlaps] = await connection.query(overlapQuery, [booking.resource_id, id, end_time, start_time]);
    
    if (overlaps.length > 0) {
      throw new Error('Overlap conflict: The resource is already booked during this time slot.');
    }

    // 3. Update times
    const updateQuery = 'UPDATE bookings SET start_time = ?, end_time = ? WHERE id = ?';
    await connection.query(updateQuery, [start_time, end_time, id]);

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
