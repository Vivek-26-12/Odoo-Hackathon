import {
  createAllocation,
  getActiveAllocationForAsset,
  createTransferRequest,
  getTransferRequestById,
  getTransferRequests,
  approveTransfer,
  rejectTransfer,
  returnAsset,
  getOverdueAllocations
} from '../models/allocationModel.js';
import { getAssetById } from '../models/assetModel.js';
import { findUserById } from '../models/userModel.js';
import { getDepartmentById } from '../models/orgModel.js';

// Allocate an asset
export const allocateAsset = async (req, res, next) => {
  try {
    const { asset_id, allocated_to_type, employee_id, department_id, expected_return_date } = req.body;

    if (!asset_id || !allocated_to_type) {
      return res.status(400).json({ success: false, message: 'Asset ID and allocation type are required.' });
    }

    if (allocated_to_type !== 'employee' && allocated_to_type !== 'department') {
      return res.status(400).json({ success: false, message: 'Invalid allocation target type.' });
    }

    if (allocated_to_type === 'employee' && !employee_id) {
      return res.status(400).json({ success: false, message: 'Employee ID is required for employee allocation.' });
    }

    if (allocated_to_type === 'department' && !department_id) {
      return res.status(400).json({ success: false, message: 'Department ID is required for department allocation.' });
    }

    // Verify asset exists
    const asset = await getAssetById(asset_id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    // Check if already allocated / not available
    if (asset.status !== 'Available') {
      const activeAlloc = await getActiveAllocationForAsset(asset_id);
      let heldBy = 'Unknown';
      let holderId = null;
      let holderType = 'unknown';

      if (activeAlloc) {
        if (activeAlloc.allocated_to_type === 'employee') {
          heldBy = activeAlloc.employee_name || 'Employee';
          holderId = activeAlloc.employee_id;
          holderType = 'employee';
        } else {
          heldBy = activeAlloc.department_name || 'Department';
          holderId = activeAlloc.department_id;
          holderType = 'department';
        }
      }

      return res.status(409).json({
        success: false,
        conflict: true,
        message: `Asset is already allocated: currently held by ${heldBy}.`,
        currently_held_by: heldBy,
        holder_id: holderId,
        holder_type: holderType,
        asset_status: asset.status
      });
    }

    // Verify employee or department exists
    if (allocated_to_type === 'employee') {
      const employee = await findUserById(employee_id);
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found.' });
      }
    } else {
      const dept = await getDepartmentById(department_id);
      if (!dept) {
        return res.status(404).json({ success: false, message: 'Department not found.' });
      }
    }

    // Call database allocation
    const insertId = await createAllocation({
      asset_id,
      allocated_to_type,
      employee_id,
      department_id,
      allocated_by: req.user.id,
      expected_return_date
    });

    res.status(201).json({
      success: true,
      message: 'Asset allocated successfully.',
      allocationId: insertId
    });
  } catch (error) {
    next(error);
  }
};

// Request an asset transfer
export const requestTransfer = async (req, res, next) => {
  try {
    const { asset_id, to_employee_id } = req.body;

    if (!asset_id || !to_employee_id) {
      return res.status(400).json({ success: false, message: 'Asset ID and target employee ID are required.' });
    }

    // Verify asset exists
    const asset = await getAssetById(asset_id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    // Verify asset has an active employee allocation
    const activeAlloc = await getActiveAllocationForAsset(asset_id);
    if (!activeAlloc || activeAlloc.allocated_to_type !== 'employee') {
      return res.status(400).json({
        success: false,
        message: 'This asset is not currently allocated to any employee. Please allocate it directly instead.'
      });
    }

    // Verify target employee exists
    const targetEmployee = await findUserById(to_employee_id);
    if (!targetEmployee) {
      return res.status(404).json({ success: false, message: 'Target employee not found.' });
    }

    // Cannot transfer to yourself
    if (activeAlloc.employee_id === parseInt(to_employee_id, 10)) {
      return res.status(400).json({ success: false, message: 'Asset is already allocated to the target employee.' });
    }

    const transferId = await createTransferRequest({
      asset_id,
      from_employee_id: activeAlloc.employee_id,
      to_employee_id,
      requested_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Transfer request created successfully.',
      transferId
    });
  } catch (error) {
    next(error);
  }
};

// List transfer requests
export const listTransfers = async (req, res, next) => {
  try {
    const transfers = await getTransferRequests(req.user.id, req.user.role, req.user.department_id);
    res.status(200).json({ success: true, transfers });
  } catch (error) {
    next(error);
  }
};

// Resolve transfer request (Approve/Reject)
export const resolveTransferRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!action || (action !== 'approve' && action !== 'reject')) {
      return res.status(400).json({ success: false, message: 'Action must be either "approve" or "reject".' });
    }

    // Verify transfer request exists
    const transfer = await getTransferRequestById(id);
    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Transfer request not found.' });
    }

    if (transfer.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'This transfer request is already resolved.' });
    }

    // Check authorization:
    // Admin & Asset Manager can resolve anything.
    // Department Head can resolve if transfer originates from or goes to an employee in their department.
    let isAuthorized = false;
    if (req.user.role === 'admin' || req.user.role === 'asset_manager') {
      isAuthorized = true;
    } else if (req.user.role === 'dept_head') {
      // Check if Dept Head matches sender or receiver's department
      if (
        (transfer.from_dept_id && transfer.from_dept_id === req.user.department_id) ||
        (transfer.to_dept_id && transfer.to_dept_id === req.user.department_id)
      ) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You are not authorized to approve/reject this transfer request.'
      });
    }

    if (action === 'approve') {
      await approveTransfer(id, req.user.id);
      res.status(200).json({ success: true, message: 'Transfer request approved and asset successfully re-allocated.' });
    } else {
      await rejectTransfer(id, req.user.id);
      res.status(200).json({ success: true, message: 'Transfer request rejected successfully.' });
    }
  } catch (error) {
    next(error);
  }
};

// Return an asset (Check-in)
export const checkInAsset = async (req, res, next) => {
  try {
    const { asset_id } = req.params;
    const { return_condition, checkin_notes } = req.body;

    const asset = await getAssetById(asset_id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    if (asset.status !== 'Allocated' && asset.status !== 'Reserved' && asset.status !== 'Under Maintenance') {
      return res.status(400).json({ success: false, message: 'Only allocated, reserved, or maintenance assets can be returned.' });
    }

    await returnAsset(asset_id, req.user.id, { return_condition, checkin_notes });

    res.status(200).json({
      success: true,
      message: 'Asset return registered successfully and is now Available.'
    });
  } catch (error) {
    next(error);
  }
};

// List overdue allocations
export const listOverdue = async (req, res, next) => {
  try {
    const overdue = await getOverdueAllocations();
    res.status(200).json({ success: true, overdue });
  } catch (error) {
    next(error);
  }
};
