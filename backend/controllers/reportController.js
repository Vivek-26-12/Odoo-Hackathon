import {
  getDashboardKPIStats,
  getUtilizationStats,
  getMaintenanceStats,
  getDeptAllocationStats,
  getBookingHeatmapStats
} from '../models/reportModel.js';

// Get dashboard operational stats
export const getDashboard = async (req, res, next) => {
  try {
    const stats = await getDashboardKPIStats();
    res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

// Get detailed reports & analytics
export const getReports = async (req, res, next) => {
  try {
    // Only Admin, Asset Manager and Department Head can access full reports
    const allowedRoles = ['admin', 'asset_manager', 'dept_head'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not have permission to view analytics reports.'
      });
    }

    const utilization = await getUtilizationStats();
    const maintenance = await getMaintenanceStats();
    const departments = await getDeptAllocationStats();
    const bookingsHeatmap = await getBookingHeatmapStats();

    res.status(200).json({
      success: true,
      data: {
        utilization,
        maintenance,
        departments,
        bookingsHeatmap
      }
    });
  } catch (error) {
    next(error);
  }
};
