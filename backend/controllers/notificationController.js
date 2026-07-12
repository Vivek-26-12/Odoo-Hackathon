import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getSystemLogs
} from '../models/notificationModel.js';

// Get notifications for logged-in user
export const listNotifications = async (req, res, next) => {
  try {
    const notifications = await getUserNotifications(req.user.id);
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

// Mark single notification as read
export const readNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const success = await markAsRead(id, req.user.id);
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'Notification not found or unauthorized.' });
    }

    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const readAllNotifications = async (req, res, next) => {
  try {
    await markAllAsRead(req.user.id);
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

// Get system activity logs (Admin / Asset Manager / Department Head)
export const listActivityLogs = async (req, res, next) => {
  try {
    const allowedRoles = ['admin', 'asset_manager', 'dept_head'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not have permission to view activity logs.'
      });
    }

    const logs = await getSystemLogs();
    res.status(200).json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};
