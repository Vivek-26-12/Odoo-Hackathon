import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { 
  ArrowLeftRight, 
  User, 
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock,
  Check,
  X,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

const Allocations = () => {
  const { user } = useAuth();
  
  // Lists
  const [availableAssets, setAvailableAssets] = useState([]);
  const [allocatedAssets, setAllocatedAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [overdueList, setOverdueList] = useState([]);
  
  const [activeTab, setActiveTab] = useState('allocate');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form states - Allocate
  const [allocForm, setAllocForm] = useState({
    asset_id: '',
    allocated_to_type: 'employee',
    employee_id: '',
    department_id: '',
    expected_return_date: ''
  });
  const [conflictData, setConflictData] = useState(null);

  // Form states - Return
  const [returnForm, setReturnForm] = useState({
    asset_id: '',
    return_condition: 'Good',
    checkin_notes: ''
  });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsRes, empRes, deptRes, transRes] = await Promise.all([
        api.get('/assets'),
        api.get('/org/employees'),
        api.get('/org/departments'),
        api.get('/allocations/transfers')
      ]);

      if (assetsRes.data.success) {
        const allAssets = assetsRes.data.assets;
        setAvailableAssets(allAssets.filter(a => a.status === 'Available'));
        setAllocatedAssets(allAssets.filter(a => a.status === 'Allocated'));
      }
      if (empRes.data.success) setEmployees(empRes.data.employees);
      if (deptRes.data.success) setDepartments(deptRes.data.departments);
      if (transRes.data.success) setTransfers(transRes.data.transfers);

      // Fetch overdue returns if manager
      if (user?.role === 'admin' || user?.role === 'asset_manager') {
        const overdueRes = await api.get('/allocations/overdue');
        if (overdueRes.data.success) {
          setOverdueList(overdueRes.data.overdue);
        }
      }

    } catch (error) {
      console.error('Error fetching allocation page data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Submit allocation
  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    setConflictData(null);
    if (!allocForm.asset_id) return;

    try {
      const payload = {
        asset_id: allocForm.asset_id,
        allocated_to_type: allocForm.allocated_to_type,
        expected_return_date: allocForm.expected_return_date || null
      };

      if (allocForm.allocated_to_type === 'employee') {
        payload.employee_id = allocForm.employee_id;
      } else {
        payload.department_id = allocForm.department_id;
      }

      const res = await api.post('/allocations', payload);
      if (res.data.success) {
        showFeedback('success', 'Asset allocated successfully!');
        setAllocForm({
          asset_id: '',
          allocated_to_type: 'employee',
          employee_id: '',
          department_id: '',
          expected_return_date: ''
        });
        fetchData();
      }
    } catch (error) {
      if (error.response && error.response.status === 409 && error.response.data.conflict) {
        // Blocked double-allocation conflict!
        setConflictData({
          asset_id: allocForm.asset_id,
          message: error.response.data.message,
          currently_held_by: error.response.data.currently_held_by,
          holder_id: error.response.data.holder_id,
          holder_type: error.response.data.holder_type
        });
      } else {
        showFeedback('error', error.response?.data?.message || 'Failed to allocate asset.');
      }
    }
  };

  // Trigger transfer request on allocation block
  const handleInitiateTransfer = async () => {
    if (!conflictData) return;
    try {
      const payload = {
        asset_id: conflictData.asset_id,
        to_employee_id: allocForm.allocated_to_type === 'employee' ? allocForm.employee_id : user.id
      };

      if (allocForm.allocated_to_type !== 'employee') {
        showFeedback('error', 'Transfer requests can only be initiated between employees. Department allocations must be returned first.');
        return;
      }

      const res = await api.post('/allocations/transfer-request', payload);
      if (res.data.success) {
        showFeedback('success', 'Double-allocation resolved! Transfer request created successfully.');
        setConflictData(null);
        setAllocForm({
          asset_id: '',
          allocated_to_type: 'employee',
          employee_id: '',
          department_id: '',
          expected_return_date: ''
        });
        fetchData();
      }
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Failed to create transfer request.');
    }
  };

  // Submit Return Check-in
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnForm.asset_id) return;

    try {
      const res = await api.post(`/allocations/${returnForm.asset_id}/return`, {
        return_condition: returnForm.return_condition,
        checkin_notes: returnForm.checkin_notes
      });

      if (res.data.success) {
        showFeedback('success', 'Asset check-in registered successfully. Reverted to Available.');
        setReturnForm({
          asset_id: '',
          return_condition: 'Good',
          checkin_notes: ''
        });
        fetchData();
      }
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Failed to return asset.');
    }
  };

  // Approve/Reject Transfer
  const handleResolveTransfer = async (transferId, action) => {
    try {
      const res = await api.patch(`/allocations/transfers/${transferId}/resolve`, { action });
      if (res.data.success) {
        showFeedback('success', `Transfer request successfully ${action}d.`);
        fetchData();
      }
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Failed to resolve transfer request.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Asset Allocations & Transfers
          </h1>
          <p className="text-slate-400 mt-1">Assign equipment, request transfers, check in returned items, and track overdues.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-slide-in ${
          feedback.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-900 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('allocate')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'allocate' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          Allocate Asset
        </button>
        <button
          onClick={() => setActiveTab('return')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'return' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          Register Return
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'transfers' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          Transfer Requests
          {transfers.filter(t => t.status === 'Pending').length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-purple-500 text-[10px] text-white font-bold">
              {transfers.filter(t => t.status === 'Pending').length}
            </span>
          )}
        </button>
        {(user?.role === 'admin' || user?.role === 'asset_manager') && (
          <button
            onClick={() => setActiveTab('overdue')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overdue' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Overdue Returns
            {overdueList.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-red-500 text-[10px] text-white font-bold">
                {overdueList.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* TAB 1: ALLOCATE ASSET */}
      {activeTab === 'allocate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Allocation Form (Admin/Asset Manager only) */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-slate-200 mb-6">Assign Asset</h2>
            
            {user?.role !== 'admin' && user?.role !== 'asset_manager' ? (
              <div className="p-4 bg-slate-950/40 border border-slate-900 text-slate-500 text-xs rounded-xl leading-relaxed">
                Only Administrators and Asset Managers can assign or check out physical assets directly to employees/departments.
              </div>
            ) : (
              <form onSubmit={handleAllocateSubmit} className="space-y-4">
                
                {/* Conflict Alert Box */}
                {conflictData && (
                  <div className="p-4 bg-red-950/30 border border-red-500/20 text-red-400 text-xs rounded-xl space-y-3 animate-fade-in">
                    <p className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                      <AlertTriangle className="w-4 h-4" />
                      Already Allocated to {conflictData.currently_held_by}
                    </p>
                    <p className="leading-relaxed font-semibold">
                      Double-allocation is blocked - request a Transfer request instead.
                    </p>
                    {conflictData.holder_type === 'employee' && (
                      <button
                        type="button"
                        onClick={handleInitiateTransfer}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Request Transfer from {conflictData.currently_held_by}
                      </button>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Asset</label>
                  <select
                    required
                    value={allocForm.asset_id}
                    onChange={(e) => {
                      setAllocForm({ ...allocForm, asset_id: e.target.value });
                      setConflictData(null);
                    }}
                    className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                  >
                    <option value="">-- Choose Available Asset --</option>
                    {availableAssets.map(a => (
                      <option key={a.id} value={a.id}>{a.asset_tag} - {a.name} ({a.location})</option>
                    ))}
                    {conflictData && (
                      // Keep selected conflicting asset in list so UI doesn't break
                      assets.filter(a => a.id === parseInt(conflictData.asset_id, 10)).map(a => (
                        <option key={a.id} value={a.id}>{a.asset_tag} - {a.name} (Conflicting)</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Allocation Holder Target</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="holder"
                        checked={allocForm.allocated_to_type === 'employee'}
                        onChange={() => setAllocForm({ ...allocForm, allocated_to_type: 'employee' })}
                        className="text-purple-600 focus:ring-purple-500 h-4 w-4 bg-slate-900 border-slate-800"
                      />
                      Employee
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="holder"
                        checked={allocForm.allocated_to_type === 'department'}
                        onChange={() => setAllocForm({ ...allocForm, allocated_to_type: 'department' })}
                        className="text-purple-600 focus:ring-purple-500 h-4 w-4 bg-slate-900 border-slate-800"
                      />
                      Department
                    </label>
                  </div>
                </div>

                {allocForm.allocated_to_type === 'employee' ? (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Employee</label>
                    <select
                      required
                      value={allocForm.employee_id}
                      onChange={(e) => setAllocForm({ ...allocForm, employee_id: e.target.value })}
                      className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                    >
                      <option value="">-- Choose Employee --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.email})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Department</label>
                    <select
                      required
                      value={allocForm.department_id}
                      onChange={(e) => setAllocForm({ ...allocForm, department_id: e.target.value })}
                      className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                    >
                      <option value="">-- Choose Department --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Expected Return Date (Optional)</label>
                  <input
                    type="date"
                    value={allocForm.expected_return_date}
                    onChange={(e) => setAllocForm({ ...allocForm, expected_return_date: e.target.value })}
                    className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-2.5 text-xs mt-4">
                  Allocate Asset
                </button>
              </form>
            )}
          </div>

          {/* Active Allocations List */}
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800">
            <h2 className="text-lg font-bold text-slate-200 mb-6">Current Assignments</h2>
            {allocatedAssets.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No active asset assignments.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold">Asset</th>
                      <th className="py-3 px-4 font-bold">Target</th>
                      <th className="py-3 px-4 font-bold">Holder Name</th>
                      <th className="py-3 px-4 font-bold">Expected Return</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/40">
                    {allocatedAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-900/10">
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-200">{asset.name}</span>
                          <span className="block font-mono text-[10px] text-purple-400 mt-0.5">{asset.asset_tag}</span>
                        </td>
                        <td className="py-4 px-4 capitalize">
                          {asset.current_holder_name ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                              <User className="w-3 h-3" />
                              Employee
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                              <Building2 className="w-3 h-3" />
                              Department
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-300 font-bold">{asset.current_holder_name || asset.current_dept_name}</td>
                        <td className="py-4 px-4 text-slate-400">
                          {asset.expected_return_date ? new Date(asset.expected_return_date).toLocaleDateString() : 'Continuous'}
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

      {/* TAB 2: REGISTER RETURN */}
      {activeTab === 'return' && (
        <div className="max-w-xl mx-auto glass-card p-6 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-slate-200 mb-6">Asset Check-In Return</h2>
          
          {user?.role !== 'admin' && user?.role !== 'asset_manager' ? (
            <div className="p-4 bg-slate-950/40 border border-slate-900 text-slate-500 text-xs rounded-xl">
              Only Administrators and Asset Managers can register returns and write condition check-in reports.
            </div>
          ) : (
            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Assigned Asset</label>
                <select
                  required
                  value={returnForm.asset_id}
                  onChange={(e) => setReturnForm({ ...returnForm, asset_id: e.target.value })}
                  className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                >
                  <option value="">-- Choose Asset to Check In --</option>
                  {allocatedAssets.map(a => (
                    <option key={a.id} value={a.id}>{a.asset_tag} - {a.name} (Held by: {a.current_holder_name || a.current_dept_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Returned Condition</label>
                <select
                  value={returnForm.return_condition}
                  onChange={(e) => setReturnForm({ ...returnForm, return_condition: e.target.value })}
                  className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Check-In Notes</label>
                <textarea
                  value={returnForm.checkin_notes}
                  onChange={(e) => setReturnForm({ ...returnForm, checkin_notes: e.target.value })}
                  placeholder="Record condition notes, missing components, accessories checked, etc."
                  rows="4"
                  className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                />
              </div>

              <button type="submit" className="btn-primary w-full py-2.5 text-xs mt-4">
                Register Return Check-In
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: TRANSFER REQUESTS */}
      {activeTab === 'transfers' && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-slate-200 mb-6">Equipment Transfer Log</h2>
          {transfers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No transfer requests raised in the system.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Asset</th>
                    <th className="py-3 px-4 font-bold">From Holder</th>
                    <th className="py-3 px-4 font-bold">To Recipient</th>
                    <th className="py-3 px-4 font-bold">Requested By</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40">
                  {transfers.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-900/10">
                      <td className="py-4 px-4 font-bold">
                        <span>{tr.asset_name}</span>
                        <span className="block font-mono text-[10px] text-purple-400 mt-0.5">{tr.asset_tag}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-300">{tr.from_employee_name}</td>
                      <td className="py-4 px-4 text-slate-300 font-bold">{tr.to_employee_name}</td>
                      <td className="py-4 px-4 text-slate-400">{tr.requested_by_name}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          tr.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                          tr.status === 'Approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {tr.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {tr.status === 'Pending' ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleResolveTransfer(tr.id, 'approve')}
                              className="p-1 hover:bg-green-950/40 text-slate-400 hover:text-green-400 rounded-lg transition-colors cursor-pointer"
                              title="Approve & Re-allocate"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleResolveTransfer(tr.id, 'reject')}
                              className="p-1 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                              title="Reject Transfer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: OVERDUE RETURNS */}
      {activeTab === 'overdue' && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-slate-200">Overdue Return Alerts</h2>
          </div>
          {overdueList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Excellent! No allocations are currently overdue.
            </div>
          ) : (
            <div className="overflow-x-auto animate-pulse-slow">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Asset</th>
                    <th className="py-3 px-4 font-bold">Holder</th>
                    <th className="py-3 px-4 font-bold">Expected Return Date</th>
                    <th className="py-3 px-4 font-bold text-red-400">Days Past Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40">
                  {overdueList.map((al) => {
                    const daysPast = Math.floor((new Date() - new Date(al.expected_return_date)) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={al.id} className="hover:bg-red-950/5">
                        <td className="py-4 px-4 font-bold">
                          <span>{al.asset_name}</span>
                          <span className="block font-mono text-[10px] text-purple-400 mt-0.5">{al.asset_tag}</span>
                        </td>
                        <td className="py-4 px-4 text-slate-300 font-semibold">{al.employee_name || al.department_name}</td>
                        <td className="py-4 px-4 text-slate-400 font-semibold">{new Date(al.expected_return_date).toLocaleDateString()}</td>
                        <td className="py-4 px-4 text-red-400 font-bold">{daysPast} days overdue</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Allocations;
