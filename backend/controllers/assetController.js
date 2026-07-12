import {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  logAssetHistory,
  getAssetHistoryLog
} from '../models/assetModel.js';
import { getCategoryById } from '../models/orgModel.js';

export const registerAsset = async (req, res, next) => {
  try {
    const {
      name,
      category_id,
      serial_number,
      acquisition_date,
      acquisition_cost,
      condition_status,
      location,
      photo_url,
      is_shared,
      custom_fields
    } = req.body;

    let parsedCustomFields = custom_fields;
    if (typeof custom_fields === 'string') {
      try {
        parsedCustomFields = JSON.parse(custom_fields);
      } catch (err) {
        parsedCustomFields = null;
      }
    }

    // Validate required fields
    if (!name || !category_id || !serial_number || !acquisition_date || !acquisition_cost || !location) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    // Validate category existence
    const category = await getCategoryById(category_id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Asset Category not found.' });
    }

    try {
      const { assetId, assetTag } = await createAsset({
        name,
        category_id,
        serial_number,
        acquisition_date,
        acquisition_cost,
        condition_status,
        location,
        photo_url,
        is_shared,
        custom_fields: parsedCustomFields
      });

      // Log asset activity history
      await logAssetHistory(
        assetId,
        req.user.id,
        'Registration',
        `Asset registered with tag ${assetTag} by ${req.user.full_name}.`
      );

      res.status(201).json({
        success: true,
        message: 'Asset registered successfully.',
        asset: { id: assetId, asset_tag: assetTag }
      });
    } catch (dbError) {
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'An asset with this serial number already exists.' });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

export const listAssets = async (req, res, next) => {
  try {
    const { search, category_id, status, location, is_shared, department_id } = req.query;

    const assets = await getAssets({
      search,
      category_id,
      status,
      location,
      is_shared,
      department_id
    });

    res.status(200).json({ success: true, assets });
  } catch (error) {
    next(error);
  }
};

export const getAssetDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const asset = await getAssetById(id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    res.status(200).json({ success: true, asset });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const asset = await getAssetById(id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const history = await getAssetHistoryLog(id);
    res.status(200).json({ success: true, history });
  } catch (error) {
    next(error);
  }
};

export const editAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      category_id,
      serial_number,
      acquisition_date,
      acquisition_cost,
      condition_status,
      location,
      photo_url,
      is_shared,
      custom_fields
    } = req.body;

    let parsedCustomFields = custom_fields;
    if (typeof custom_fields === 'string') {
      try {
        parsedCustomFields = JSON.parse(custom_fields);
      } catch (err) {
        parsedCustomFields = null;
      }
    }

    if (!name || !category_id || !serial_number || !acquisition_date || !acquisition_cost || !location) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    const asset = await getAssetById(id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const category = await getCategoryById(category_id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Asset Category not found.' });
    }

    try {
      const updated = await updateAsset(id, {
        name,
        category_id,
        serial_number,
        acquisition_date,
        acquisition_cost,
        condition_status,
        location,
        photo_url,
        is_shared,
        custom_fields: parsedCustomFields,
        status: asset.status // Lock status: direct mutations from PUT body are ignored
      });

      if (updated) {
        // Log update details
        const details = `Asset details updated by ${req.user.full_name}.`;
        await logAssetHistory(id, req.user.id, 'Update', details);
      }

      res.status(200).json({
        success: true,
        message: 'Asset updated successfully.'
      });
    } catch (dbError) {
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'An asset with this serial number already exists.' });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};
