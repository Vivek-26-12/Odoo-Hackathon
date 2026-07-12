import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  getEmployees,
  updateEmployeeRole,
  updateEmployeeStatus,
  updateEmployeeDepartment
} from '../models/orgModel.js';
import { findUserById } from '../models/userModel.js';

// --- DEPARTMENTS CONTROLLERS ---

export const createDept = async (req, res, next) => {
  try {
    const { name, head_id, parent_id, status } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Department name is required.' });
    }

    // Verify head_id exists if provided
    if (head_id) {
      const headUser = await findUserById(head_id);
      if (!headUser) {
        return res.status(404).json({ success: false, message: 'Assigned Department Head employee not found.' });
      }
    }

    // Verify parent_id exists if provided
    if (parent_id) {
      const parentDept = await getDepartmentById(parent_id);
      if (!parentDept) {
        return res.status(404).json({ success: false, message: 'Parent department not found.' });
      }
    }

    // Create department
    try {
      const insertId = await createDepartment({ name, head_id, parent_id, status });
      
      // If we assigned a department head, let's promote their role to 'dept_head' automatically
      if (head_id) {
        await updateEmployeeRole(head_id, 'dept_head');
      }

      res.status(201).json({
        success: true,
        message: 'Department created successfully.',
        departmentId: insertId
      });
    } catch (dbError) {
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'A department with this name already exists.' });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

export const getDepts = async (req, res, next) => {
  try {
    const departments = await getDepartments();
    res.status(200).json({ success: true, departments });
  } catch (error) {
    next(error);
  }
};

export const updateDept = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, head_id, parent_id, status } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Department name is required.' });
    }

    // Check if department exists
    const existingDept = await getDepartmentById(id);
    if (!existingDept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    // Prevent circular reference: parent department cannot be itself
    if (parent_id && parseInt(parent_id, 10) === parseInt(id, 10)) {
      return res.status(400).json({ success: false, message: 'A department cannot be its own parent.' });
    }

    // Verify head_id exists if provided
    if (head_id) {
      const headUser = await findUserById(head_id);
      if (!headUser) {
        return res.status(404).json({ success: false, message: 'Assigned Department Head employee not found.' });
      }
    }

    // Verify parent_id exists if provided
    if (parent_id) {
      const parentDept = await getDepartmentById(parent_id);
      if (!parentDept) {
        return res.status(404).json({ success: false, message: 'Parent department not found.' });
      }
    }

    try {
      await updateDepartment(id, { name, head_id, parent_id, status });

      // If we assigned a department head, let's promote their role to 'dept_head' automatically
      if (head_id) {
        await updateEmployeeRole(head_id, 'dept_head');
      }

      res.status(200).json({
        success: true,
        message: 'Department updated successfully.'
      });
    } catch (dbError) {
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'A department with this name already exists.' });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

// --- CATEGORIES CONTROLLERS ---

export const createCat = async (req, res, next) => {
  try {
    const { name, fields } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    try {
      const insertId = await createCategory({ name, fields });
      res.status(201).json({
        success: true,
        message: 'Asset category created successfully.',
        categoryId: insertId
      });
    } catch (dbError) {
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'A category with this name already exists.' });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

export const getCats = async (req, res, next) => {
  try {
    const categories = await getCategories();
    res.status(200).json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

export const updateCat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, fields } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const existingCat = await getCategoryById(id);
    if (!existingCat) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    try {
      await updateCategory(id, { name, fields });
      res.status(200).json({
        success: true,
        message: 'Asset category updated successfully.'
      });
    } catch (dbError) {
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'A category with this name already exists.' });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

// --- EMPLOYEE DIRECTORY & PROMOTION CONTROLLERS ---

export const listEmployees = async (req, res, next) => {
  try {
    const employees = await getEmployees();
    res.status(200).json({ success: true, employees });
  } catch (error) {
    next(error);
  }
};

export const promoteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'asset_manager', 'dept_head', 'employee'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid role.' });
    }

    const employee = await findUserById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // Admin cannot demote themselves to ensure there's always an admin
    if (parseInt(id, 10) === req.user.id && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'You cannot change your own admin role.' });
    }

    await updateEmployeeRole(id, role);
    res.status(200).json({
      success: true,
      message: `Employee role successfully updated to ${role}.`
    });
  } catch (error) {
    next(error);
  }
};

export const toggleEmployeeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || (status !== 'active' && status !== 'inactive')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid status (active/inactive).' });
    }

    const employee = await findUserById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // Admin cannot deactivate themselves
    if (parseInt(id, 10) === req.user.id && status === 'inactive') {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account.' });
    }

    await updateEmployeeStatus(id, status);
    res.status(200).json({
      success: true,
      message: `Employee status successfully updated to ${status}.`
    });
  } catch (error) {
    next(error);
  }
};

export const assignEmployeeDept = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { department_id } = req.body;

    const employee = await findUserById(id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    if (department_id) {
      const dept = await getDepartmentById(department_id);
      if (!dept) {
        return res.status(404).json({ success: false, message: 'Department not found.' });
      }
    }

    await updateEmployeeDepartment(id, department_id);
    res.status(200).json({
      success: true,
      message: 'Employee department assignment updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};
