import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FolderPlus, 
  Users, 
  Tag, 
  Briefcase,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';

const OrganizationSetup = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('departments');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // States for Tab A - Departments
  const [departments, setDepartments] = useState([]);
  const [deptForm, setDeptForm] = useState({ name: '', head_id: '', parent_id: '', status: 'active' });
  const [editingDeptId, setEditingDeptId] = useState(null);

  // States for Tab B - Categories
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ name: '', fields: [] });
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [editingCatId, setEditingCatId] = useState(null);

  // States for Tab C - Employees
  const [employees, setEmployees] = useState([]);

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptsRes, catsRes, empRes] = await Promise.all([
        api.get('/org/departments'),
        api.get('/org/categories'),
        api.get('/org/employees')
      ]);

      if (deptsRes.data.success) setDepartments(deptsRes.data.departments);
      if (catsRes.data.success) setCategories(catsRes.data.categories);
      if (empRes.data.success) setEmployees(empRes.data.employees);
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Error fetching master setup data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // --- TAB A: DEPARTMENTS CRUD handlers ---
  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    if (!deptForm.name) return;

    try {
      if (editingDeptId) {
        const res = await api.put(`/org/departments/${editingDeptId}`, deptForm);
        if (res.data.success) {
          showFeedback('success', 'Department updated successfully.');
          setEditingDeptId(null);
        }
      } else {
        const res = await api.post('/org/departments', deptForm);
        if (res.data.success) {
          showFeedback('success', 'Department created successfully.');
        }
      }
      setDeptForm({ name: '', head_id: '', parent_id: '', status: 'active' });
      fetchData();
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Failed to save department.');
    }
  };

  const handleEditDept = (dept) => {
    setEditingDeptId(dept.id);
    setDeptForm({
      name: dept.name,
      head_id: dept.head_id || '',
      parent_id: dept.parent_id || '',
      status: dept.status
    });
  };

  // --- TAB B: CATEGORIES CRUD handlers ---
  const addCategoryField = () => {
    if (!newFieldName.trim()) return;
    const updatedFields = [...categoryForm.fields, { name: newFieldName.trim().toLowerCase().replace(/\s+/g, '_'), label: newFieldName.trim(), type: newFieldType }];
    setCategoryForm({ ...categoryForm, fields: updatedFields });
    setNewFieldName('');
  };

  const removeCategoryField = (index) => {
    const updatedFields = categoryForm.fields.filter((_, i) => i !== index);
    setCategoryForm({ ...categoryForm, fields: updatedFields });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) return;

    try {
      if (editingCatId) {
        const res = await api.put(`/org/categories/${editingCatId}`, categoryForm);
        if (res.data.success) {
          showFeedback('success', 'Category updated successfully.');
          setEditingCatId(null);
        }
      } else {
        const res = await api.post('/org/categories', categoryForm);
        if (res.data.success) {
          showFeedback('success', 'Category created successfully.');
        }
      }
      setCategoryForm({ name: '', fields: [] });
      fetchData();
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Failed to save category.');
    }
  };

  const handleEditCategory = (cat) => {
    setEditingCatId(cat.id);
    setCategoryForm({
      name: cat.name,
      fields: cat.fields || []
    });
  };

  // --- TAB C: EMPLOYEES promotional handlers ---
  const handleRoleChange = async (empId, role) => {
    try {
      const res = await api.patch(`/org/employees/${empId}/role`, { role });
      if (res.data.success) {
        showFeedback('success', 'Employee role updated successfully.');
        fetchData();
      }
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Failed to update employee role.');
    }
  };

  const handleStatusChange = async (empId, status) => {
    try {
      const res = await api.patch(`/org/employees/${empId}/status`, { status });
      if (res.data.success) {
        showFeedback('success', 'Employee status updated successfully.');
        fetchData();
      }
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Failed to update employee status.');
    }
  };

  const handleDeptAssign = async (empId, deptId) => {
    try {
      const res = await api.patch(`/org/employees/${empId}/department`, { department_id: deptId });
      if (res.data.success) {
        showFeedback('success', 'Employee department assigned successfully.');
        fetchData();
      }
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Failed to update department assignment.');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="glass-card p-8 rounded-2xl border border-red-500/20 text-center max-w-xl mx-auto mt-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-100">Access Denied</h2>
        <p className="text-slate-400 mt-2">Only system administrators are authorized to access Organization Setup.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Organization Setup
          </h1>
          <p className="text-slate-400 mt-1">Configure departments, dynamic asset attributes, and manage user directories.</p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          feedback.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-900 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'departments'
              ? 'border-purple-500 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Departments
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'categories'
              ? 'border-purple-500 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          Asset Categories
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'employees'
              ? 'border-purple-500 text-purple-400 bg-purple-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Employee Directory
        </button>
      </div>

      {/* TAB A: DEPARTMENTS PANEL */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Department Form (Create/Edit) */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-6">
              {editingDeptId ? <Edit className="w-5 h-5 text-purple-500" /> : <Plus className="w-5 h-5 text-purple-500" />}
              {editingDeptId ? 'Edit Department' : 'Create Department'}
            </h2>
            <form onSubmit={handleDeptSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Department Name</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. engineering, HR, sales"
                  className="w-full glass-input px-4 py-2.5 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Department Head</label>
                <select
                  value={deptForm.head_id}
                  onChange={(e) => setDeptForm({ ...deptForm, head_id: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 rounded-lg text-sm"
                >
                  <option value="">-- No Head Assigned --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Parent Department</label>
                <select
                  value={deptForm.parent_id}
                  onChange={(e) => setDeptForm({ ...deptForm, parent_id: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 rounded-lg text-sm"
                >
                  <option value="">-- None (Top Level) --</option>
                  {departments
                    .filter(d => d.id !== editingDeptId) // Prevent self-referencing
                    .map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                <select
                  value={deptForm.status}
                  onChange={(e) => setDeptForm({ ...deptForm, status: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 rounded-lg text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1 py-2">
                  {editingDeptId ? 'Update' : 'Create'}
                </button>
                {editingDeptId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDeptId(null);
                      setDeptForm({ name: '', head_id: '', parent_id: '', status: 'active' });
                    }}
                    className="btn-secondary py-2"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Department List */}
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-slate-200 mb-6">Active Departments</h2>
            {departments.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                No departments registered yet. Use the form to add one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-400 uppercase text-xs tracking-wider">
                      <th className="py-3 px-4 font-bold">Name</th>
                      <th className="py-3 px-4 font-bold">Department Head</th>
                      <th className="py-3 px-4 font-bold">Parent Department</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/40">
                    {departments.map((dept) => (
                      <tr key={dept.id} className="hover:bg-slate-900/10">
                        <td className="py-4 px-4 font-semibold text-slate-100">{dept.name}</td>
                        <td className="py-4 px-4 text-slate-300">{dept.head_name || <span className="text-slate-600">Unassigned</span>}</td>
                        <td className="py-4 px-4 text-slate-400">{dept.parent_name || <span className="text-slate-600">None</span>}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            dept.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {dept.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleEditDept(dept)}
                            className="p-1 hover:bg-slate-800 hover:text-purple-400 text-slate-400 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB B: CATEGORIES PANEL */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Category Form */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-6">
              {editingCatId ? <Edit className="w-5 h-5 text-purple-500" /> : <FolderPlus className="w-5 h-5 text-purple-500" />}
              {editingCatId ? 'Edit Category' : 'Create Category'}
            </h2>
            <form onSubmit={handleCategorySubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category Name</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Electronics, Vehicles, Furniture"
                  className="w-full glass-input px-4 py-2.5 rounded-lg text-sm"
                />
              </div>

              {/* Dynamic Attribute Fields Builder */}
              <div className="space-y-3 border-t border-slate-900 pt-4">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Dynamic Fields Attributes</span>
                
                {/* Fields list */}
                {categoryForm.fields.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                    {categoryForm.fields.map((field, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-900/60 px-3 py-1.5 rounded-md text-xs border border-slate-800">
                        <div>
                          <span className="font-bold text-slate-200">{field.label}</span> 
                          <span className="text-slate-500 ml-1.5">({field.type})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCategoryField(idx)}
                          className="text-slate-500 hover:text-red-400 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fields adder */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Field Name (e.g. Warranty Period)"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    className="flex-1 glass-input px-3 py-1.5 rounded-lg text-xs"
                  />
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value)}
                    className="glass-input px-2 py-1.5 rounded-lg text-xs"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                  </select>
                  <button
                    type="button"
                    onClick={addCategoryField}
                    className="p-2 bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1 py-2">
                  {editingCatId ? 'Update' : 'Create'}
                </button>
                {editingCatId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCatId(null);
                      setCategoryForm({ name: '', fields: [] });
                    }}
                    className="btn-secondary py-2"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Categories List */}
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-slate-200 mb-6">Asset Categories</h2>
            {categories.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                No categories defined. Create one to begin asset registrations.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-4 rounded-xl bg-slate-900/30 border border-slate-900 flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-100">{cat.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {cat.fields && cat.fields.length > 0 
                          ? `Dynamic fields: ${cat.fields.map(f => f.label).join(', ')}` 
                          : 'No dynamic attributes.'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEditCategory(cat)}
                      className="p-1.5 hover:bg-slate-800 hover:text-purple-400 text-slate-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB C: EMPLOYEE DIRECTORY */}
      {activeTab === 'employees' && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-slate-200 mb-6">Employee Management</h2>
          {employees.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No employees registered in the system.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-400 uppercase text-xs tracking-wider">
                    <th className="py-3 px-4 font-bold">Employee Name</th>
                    <th className="py-3 px-4 font-bold">Email</th>
                    <th className="py-3 px-4 font-bold">Department</th>
                    <th className="py-3 px-4 font-bold">System Role</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-center">Verify Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-900/10">
                      <td className="py-4 px-4 font-bold text-slate-200">{emp.full_name}</td>
                      <td className="py-4 px-4 text-slate-400">{emp.email}</td>
                      <td className="py-4 px-4">
                        <select
                          value={emp.department_id || ''}
                          onChange={(e) => handleDeptAssign(emp.id, e.target.value)}
                          className="glass-input text-xs px-2.5 py-1.5 rounded-lg bg-transparent"
                        >
                          <option value="">-- No Department --</option>
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={emp.role}
                          onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                          className="glass-input text-xs px-2.5 py-1.5 rounded-lg bg-transparent"
                        >
                          <option value="employee">Employee</option>
                          <option value="dept_head">Department Head</option>
                          <option value="asset_manager">Asset Manager</option>
                          <option value="admin">System Admin</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={emp.status}
                          onChange={(e) => handleStatusChange(emp.id, e.target.value)}
                          className={`glass-input text-xs px-2.5 py-1.5 rounded-lg bg-transparent font-semibold ${
                            emp.status === 'active' ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          <option value="active" className="text-green-400 font-semibold">Active</option>
                          <option value="inactive" className="text-red-400 font-semibold">Inactive</option>
                        </select>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          emp.is_verified ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {emp.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default OrganizationSetup;
