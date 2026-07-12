import {
  createMaintenanceRequest,
  getMaintenanceRequests,
  getMaintenanceRequestById,
  getMaintenanceUpdates,
  updateMaintenanceStatus
} from '../models/maintenanceModel.js';
import { getAssetById } from '../models/assetModel.js';

// Raise maintenance request
export const raiseRequest = async (req, res, next) => {
  try {
    const { asset_id, issue_description, priority, photo_url } = req.body;

    if (!asset_id || !issue_description) {
      return res.status(400).json({ success: false, message: 'Asset ID and issue description are required.' });
    }

    const asset = await getAssetById(asset_id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    try {
      const requestId = await createMaintenanceRequest({
        asset_id,
        reported_by: req.user.id,
        issue_description,
        priority,
        photo_url
      });

      res.status(201).json({
        success: true,
        message: 'Maintenance request submitted successfully.',
        requestId
      });
    } catch (requestError) {
      res.status(400).json({ success: false, message: requestError.message });
    }
  } catch (error) {
    next(error);
  }
};

// List maintenance requests
export const listRequests = async (req, res, next) => {
  try {
    const requests = await getMaintenanceRequests(req.user.id, req.user.role, req.user.department_id);
    res.status(200).json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

// Get details of a single request
export const getRequestDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await getMaintenanceRequestById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Maintenance request not found.' });
    }

    // Check authorization:
    // Admin, Asset Manager can see all.
    // Employee can see if they reported it.
    // Department Head can see if reporter belongs to their department.
    let isAuthorized = false;
    if (req.user.role === 'admin' || req.user.role === 'asset_manager') {
      isAuthorized = true;
    } else if (request.reported_by === req.user.id) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not have permission to view this request.'
      });
    }

    const updates = await getMaintenanceUpdates(id);
    res.status(200).json({ success: true, request, updates });
  } catch (error) {
    next(error);
  }
};

// Update request status (Approve, Reject, Progress, Resolve)
export const updateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, technician_assigned, notes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status field is required.' });
    }

    const validStatuses = ['Approved', 'Rejected', 'Technician Assigned', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update.' });
    }

    // Only Admin and Asset Manager can approve/manage maintenance
    if (req.user.role !== 'admin' && req.user.role !== 'asset_manager') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Only Administrators and Asset Managers can update maintenance status.'
      });
    }

    try {
      await updateMaintenanceStatus(id, req.user.id, {
        status,
        technician_assigned,
        notes
      });

      res.status(200).json({
        success: true,
        message: `Maintenance request status updated to ${status} successfully.`
      });
    } catch (statusError) {
      res.status(400).json({ success: false, message: statusError.message });
    }
  } catch (error) {
    next(error);
  }
};
