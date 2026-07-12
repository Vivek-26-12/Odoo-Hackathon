import {
  createAuditCycle,
  getAuditCyclesList,
  getAuditCycleDetails,
  getAuditCycleAssets,
  verifyAsset,
  getAuditDiscrepancies,
  closeAuditCycle
} from '../models/auditModel.js';

// Create audit cycle
export const startAuditCycle = async (req, res, next) => {
  try {
    const { name, department_id, location, start_date, end_date, auditor_ids } = req.body;

    if (!name || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Cycle name, start date, and end date are required.' });
    }

    if (!auditor_ids || !Array.isArray(auditor_ids) || auditor_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please assign at least one auditor to the cycle.' });
    }

    // Only Admin and Asset Managers can schedule audits
    if (req.user.role !== 'admin' && req.user.role !== 'asset_manager') {
      return res.status(403).json({ success: false, message: 'Access forbidden: Only managers can create audit cycles.' });
    }

    const { cycleId, scopedAssetsCount } = await createAuditCycle({
      name,
      department_id,
      location,
      start_date,
      end_date,
      created_by: req.user.id,
      auditor_ids
    });

    res.status(201).json({
      success: true,
      message: `Audit cycle "${name}" created successfully. Scoped ${scopedAssetsCount} assets for auditing.`,
      cycleId,
      scopedAssetsCount
    });
  } catch (error) {
    next(error);
  }
};

// List audit cycles
export const listAuditCycles = async (req, res, next) => {
  try {
    const cycles = await getAuditCyclesList(req.user.id, req.user.role);
    res.status(200).json({ success: true, cycles });
  } catch (error) {
    next(error);
  }
};

// Get details of a single cycle, including scoped assets
export const getAuditDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cycle = await getAuditCycleDetails(id);
    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Audit cycle not found.' });
    }

    const assets = await getAuditCycleAssets(id);
    res.status(200).json({ success: true, cycle, assets });
  } catch (error) {
    next(error);
  }
};

// Log verification check-off
export const logVerification = async (req, res, next) => {
  try {
    const { id, asset_id } = req.params; // cycle id, asset id
    const { verification_status, notes } = req.body;

    if (!verification_status) {
      return res.status(400).json({ success: false, message: 'Verification status is required.' });
    }

    const validStatuses = ['Verified', 'Missing', 'Damaged'];
    if (!validStatuses.includes(verification_status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status.' });
    }

    // Verify audit cycle exists and is active
    const cycle = await getAuditCycleDetails(id);
    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Audit cycle not found.' });
    }

    if (cycle.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'This audit cycle is closed and locked.' });
    }

    // Verify auditor is assigned to the cycle (or is Admin/Asset Manager)
    let isAssigned = false;
    if (req.user.role === 'admin' || req.user.role === 'asset_manager') {
      isAssigned = true;
    } else {
      isAssigned = cycle.auditors.some(a => a.id === req.user.id);
    }

    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You are not an assigned auditor for this cycle.'
      });
    }

    const updated = await verifyAsset(id, asset_id, req.user.id, { verification_status, notes });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Asset not found in this audit cycle scope.' });
    }

    res.status(200).json({ success: true, message: 'Asset verification logged successfully.' });
  } catch (error) {
    next(error);
  }
};

// Get discrepancy report
export const discrepancyReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cycle = await getAuditCycleDetails(id);
    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Audit cycle not found.' });
    }

    const discrepancies = await getAuditDiscrepancies(id);
    res.status(200).json({ success: true, discrepancies });
  } catch (error) {
    next(error);
  }
};

// Close audit cycle
export const closeCycle = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Only Admin and Asset Manager can close audits
    if (req.user.role !== 'admin' && req.user.role !== 'asset_manager') {
      return res.status(403).json({ success: false, message: 'Access forbidden: Only managers can close audit cycles.' });
    }

    try {
      await closeAuditCycle(id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Audit cycle closed successfully. Affected asset statuses have been updated.'
      });
    } catch (closeError) {
      res.status(400).json({ success: false, message: closeError.message });
    }
  } catch (error) {
    next(error);
  }
};
