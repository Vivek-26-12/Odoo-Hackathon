import pool from '../config/db.js';

// Get counts for dashboard KPI cards
export const getDashboardKPIStats = async () => {
  // Query 1: Assets Available
  const [availRows] = await pool.query("SELECT COUNT(*) AS count FROM assets WHERE status = 'Available'");
  
  // Query 2: Assets Allocated
  const [allocRows] = await pool.query("SELECT COUNT(*) AS count FROM assets WHERE status = 'Allocated'");
  
  // Query 3: Maintenance Today (requests created today or active in progress)
  const [maintRows] = await pool.query(`
    SELECT COUNT(*) AS count FROM maintenance_requests 
    WHERE DATE(created_at) = CURDATE() OR status = 'In Progress'
  `);
  
  // Query 4: Active Bookings (ongoing right now)
  const [bookingRows] = await pool.query(`
    SELECT COUNT(*) AS count FROM bookings 
    WHERE NOW() BETWEEN start_time AND end_time AND status != 'Cancelled'
  `);
  
  // Query 5: Pending Transfers
  const [transferRows] = await pool.query("SELECT COUNT(*) AS count FROM transfer_requests WHERE status = 'Pending'");
  
  // Query 6: Upcoming Returns (due in the next 7 days)
  const [upcomingRows] = await pool.query(`
    SELECT COUNT(*) AS count FROM asset_allocations 
    WHERE status = 'Active' 
      AND expected_return_date >= CURDATE() 
      AND expected_return_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
  `);

  // Query 7: Overdue Returns (past due date)
  const [overdueRows] = await pool.query(`
    SELECT COUNT(*) AS count FROM asset_allocations 
    WHERE status = 'Active' 
      AND expected_return_date < CURDATE()
  `);

  return {
    assetsAvailable: availRows[0].count,
    assetsAllocated: allocRows[0].count,
    maintenanceToday: maintRows[0].count,
    activeBookings: bookingRows[0].count,
    pendingTransfers: transferRows[0].count,
    upcomingReturns: upcomingRows[0].count,
    overdueReturns: overdueRows[0].count
  };
};

// Get asset utilization trends (most allocated and idle assets)
export const getUtilizationStats = async () => {
  const mostAllocatedQuery = `
    SELECT a.id, a.name, a.asset_tag, c.name AS category_name, COUNT(al.id) AS allocation_count 
    FROM assets a 
    JOIN categories c ON a.category_id = c.id
    JOIN asset_allocations al ON a.id = al.asset_id 
    GROUP BY a.id 
    ORDER BY allocation_count DESC 
    LIMIT 5
  `;
  const [mostAllocated] = await pool.query(mostAllocatedQuery);

  const idleAssetsQuery = `
    SELECT a.id, a.name, a.asset_tag, c.name AS category_name, a.status 
    FROM assets a 
    JOIN categories c ON a.category_id = c.id
    LEFT JOIN asset_allocations al ON a.id = al.asset_id 
    WHERE al.id IS NULL AND a.status = 'Available' 
    LIMIT 5
  `;
  const [idleAssets] = await pool.query(idleAssetsQuery);

  return { mostAllocated, idleAssets };
};

// Get maintenance frequency statistics by category and asset
export const getMaintenanceStats = async () => {
  const categoryFreqQuery = `
    SELECT c.name AS category_name, COUNT(mr.id) AS count
    FROM categories c
    JOIN assets a ON c.id = a.category_id
    JOIN maintenance_requests mr ON a.id = mr.asset_id
    GROUP BY c.id
    ORDER BY count DESC
  `;
  const [byCategory] = await pool.query(categoryFreqQuery);

  const assetFreqQuery = `
    SELECT a.name, a.asset_tag, COUNT(mr.id) AS count
    FROM assets a
    JOIN maintenance_requests mr ON a.id = mr.asset_id
    GROUP BY a.id
    ORDER BY count DESC
    LIMIT 5
  `;
  const [byAsset] = await pool.query(assetFreqQuery);

  return { byCategory, byAsset };
};

// Get department-wise allocation summary
export const getDeptAllocationStats = async () => {
  const query = `
    SELECT d.name AS department_name, COUNT(al.id) AS count
    FROM departments d
    JOIN asset_allocations al ON d.id = al.department_id
    WHERE al.status = 'Active'
    GROUP BY d.id
    ORDER BY count DESC
  `;
  const [rows] = await pool.query(query);
  return rows;
};

// Get booking heatmap by hour of the day
export const getBookingHeatmapStats = async () => {
  const query = `
    SELECT HOUR(start_time) AS booking_hour, COUNT(*) AS count
    FROM bookings
    WHERE status != 'Cancelled'
    GROUP BY booking_hour
    ORDER BY booking_hour ASC
  `;
  const [rows] = await pool.query(query);
  return rows;
};
