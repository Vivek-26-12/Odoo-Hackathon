import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { 
  ClipboardCheck, 
  Plus, 
  User, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Clock,
  Check,
  X,
  RefreshCw,
  FolderLock
} from 'lucide-react';

const Audits = () => {
  const { user } = useAuth();
  
  // Lists states
  const [cycles, setCycles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Scoped audit checklist states
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [scopedAssets, setScopedAssets] = useState([]);
  const [discrepancies, setDiscrepancies] = useState([]);

  // UI states
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  
  // Form states - Schedule Cycle
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    department_id: '',
    location: '',
    start_date: '',
    end_date: '',
    auditor_ids: []
  });

  // Form states - Verify Item Checkoff
  const [targetAsset, setTargetAsset] = useState(null);
  const [verifyForm, setVerifyForm] = useState({
    verification_status: 'Verified',
    notes: ''
  });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cyclesRes, deptRes, empRes] = await Promise.all([
        api.get('/audits'),
        api.get('/org/departments'),
        api.get('/org/employees')
      ]);

      if (cyclesRes.data.success) setCycles(cyclesRes.data.cycles);
      if (deptRes.data.success) setDepartments(deptRes.data.departments);
      if (empRes.data.success) setEmployees(empRes.data.employees);
    } catch (error) {
      console.error('Error fetching audit data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCycleChecklist = async (cycleId) => {
    if (!cycleId) return;
    try {
      const [detailsRes, discRes] = await Promise.all([
        api.get(`/audits/${cycleId}`),
        api.get(`/audits/${cycleId}/discrepancies`)
      ]);

      if (detailsRes.data.success) {
        setSelectedCycle(detailsRes.data.cycle);
        setScopedAssets(detailsRes.data.assets);
      }
      if (discRes.data.success) {
        setDiscrepancies(discRes.data.discrepancies);
      }
    } catch (error) {
      console.error('Error loading checklist details:', error.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle cycle click to drill down checklist
  const handleCycleSelect = (cycle) => {
    fetchCycleChecklist(cycle.id);
    setActiveTab('checklist');
  };

  // Submit Schedule Audit
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleForm.name || scheduleForm.auditor_ids.length === 0) return;

    try {
      const res = await api.post('/audits', scheduleForm);
      if (res.data.success) {
        showFeedback('success', res.data.message);
        setScheduleForm({
          name: '',
          department_id: '',
          location: '',
          start_date: '',
          end_date: '',
          auditor_ids: []
        });
        setScheduleOpen(false);
        fetchData();
      }
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Failed to schedule audit.');
    }
  };

  // Handle Auditor Select checkbox toggles
  const handleAuditorCheckboxChange = (empId) => {
    const ids = [...scheduleForm.auditor_ids];
    if (ids.includes(empId)) {
      setScheduleForm({ ...scheduleForm, auditor_ids: ids.filter(id => id !== empId) });
    } else {
      setScheduleForm({ ...scheduleForm, auditor_ids: [...ids, empId] });
    }
  };

  // Open Verify Check-off modal
  const openVerifyCheck = (asset) => {
    setTargetAsset(asset);
    setVerifyForm({
      verification_status: asset.verification_status !== 'Pending' ? asset.verification_status : 'Verified',
      notes: asset.notes || ''
    });
    setVerifyOpen(true);
  };

  // Submit Verification Check-off
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedCycle || !targetAsset) return;

    try {
      const res = await api.post(`/audits/${selectedCycle.id}/verify/${targetAsset.asset_id}`, verifyForm);
      if (res.data.success) {
        showFeedback('success', 'Verification logged successfully.');
        setVerifyOpen(false);
        setTargetAsset(null);
        fetchCycleChecklist(selectedCycle.id);
      }
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Failed to submit verification check-off.');
    }
  };

  // Close Audit Cycle (Complete)
  const handleCloseCycle = async () => {
    if (!selectedCycle) return;
    if (!window.confirm(`Are you sure you want to close and lock the audit cycle "${selectedCycle.name}"? This action will freeze records and update inventory states.`)) return;

    try {
      const res = await api.post(`/audits/${selectedCycle.id}/close`);
      if (res.data.success) {
        showFeedback('success', 'Audit cycle successfully closed! Inventory synchronized.');
        fetchData();
        fetchCycleChecklist(selectedCycle.id);
      }
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Failed to close cycle.');
    }
  };

  const getVerificationBadge = (v) => {
    const mapping = {
      'Pending': 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      'Verified': 'bg-green-500/10 text-green-400 border border-green-500/20',
      'Missing': 'bg-red-500/10 text-red-400 border border-red-500/20',
      'Damaged': 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
    };
    return mapping[v] || 'bg-slate-500/10 text-slate-300';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Asset Audits
          </h1>
          <p className="text-slate-400 mt-1">Schedule structured verification campaigns, check off scoped equipment, and export discrepancy logs.</p>
        </div>

        <div className="flex gap-2">
          {(user?.role === 'admin' || user?.role === 'asset_manager') && (
            <button
              onClick={() => setScheduleOpen(true)}
              className="btn-primary flex items-center gap-1.5 text-xs py-2.5"
            >
              <Plus className="w-4 h-4" />
              Schedule Audit
            </button>
          )}
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          feedback.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Tab switchers */}
      <div className="flex border-b border-slate-900 pb-px">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'list' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          Audit Campaigns
        </button>
        {selectedCycle && (
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'checklist' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Checklist: {selectedCycle.name}
          </button>
        )}
      </div>

      {/* TAB A: CAMPAIGNS LIST */}
      {activeTab === 'list' && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-slate-200 mb-6">Audit Cycles</h2>
          {cycles.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No audit campaigns scheduled. Use "Schedule Audit" to launch verification processes.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Campaign Name</th>
                    <th className="py-3 px-4 font-bold">Scope</th>
                    <th className="py-3 px-4 font-bold">Date Range</th>
                    <th className="py-3 px-4 font-bold">Creator</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right font-bold">Checklist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40">
                  {cycles.map((cyc) => (
                    <tr key={cyc.id} className="hover:bg-slate-900/10">
                      <td className="py-4 px-4 font-semibold text-slate-100">{cyc.name}</td>
                      <td className="py-4 px-4 text-slate-300">
                        {cyc.department_name ? (
                          <span className="inline-flex items-center gap-1 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                            Dept: {cyc.department_name}
                          </span>
                        ) : cyc.location ? (
                          <span className="inline-flex items-center gap-1 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                            Location: {cyc.location}
                          </span>
                        ) : (
                          <span className="text-slate-500">Global System-wide</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        {new Date(cyc.start_date).toLocaleDateString()} - {new Date(cyc.end_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-slate-400">{cyc.creator_name}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          cyc.status === 'Active' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                        }`}>
                          {cyc.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleCycleSelect(cyc)}
                          className="text-xs text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                        >
                          Open Checklist &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB B: ACTIVE CHECKLIST DRILL DOWN */}
      {activeTab === 'checklist' && selectedCycle && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Scoped checklist table (2 columns) */}
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-900 pb-4 mb-6 gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-200">Scoped Campaign Checklist</h2>
                <p className="text-[10px] text-purple-400 font-bold capitalize mt-0.5">Campaign Name: {selectedCycle.name}</p>
              </div>

              {selectedCycle.status === 'Active' && (user?.role === 'admin' || user?.role === 'asset_manager') && (
                <button
                  onClick={handleCloseCycle}
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer shadow-lg shadow-red-600/10"
                >
                  <FolderLock className="w-4 h-4" />
                  Close & Lock Audit
                </button>
              )}
            </div>

            {scopedAssets.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No assets scoped for this campaign.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4 font-bold">Asset</th>
                      <th className="py-3 px-4 font-bold">Registered Location</th>
                      <th className="py-3 px-4 font-bold">Audit Status</th>
                      <th className="py-3 px-4 font-bold text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/40">
                    {scopedAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-900/10">
                        <td className="py-4 px-4 font-bold">
                          <span>{asset.asset_name}</span>
                          <span className="block font-mono text-[10px] text-purple-400 mt-0.5">{asset.asset_tag}</span>
                        </td>
                        <td className="py-4 px-4 text-slate-400">{asset.registered_location}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${getVerificationBadge(asset.verification_status)}`}>
                            {asset.verification_status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {selectedCycle.status === 'Active' ? (
                            <button
                              onClick={() => openVerifyCheck(asset)}
                              className="text-xs text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                            >
                              Verify Check-Off
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-600">Locked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Discrepancy Widget (1 column) */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 h-fit">
            <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5 mb-6">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Discrepancy Report Log
            </h2>

            {discrepancies.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No discrepancies flagged in verification checks.
              </div>
            ) : (
              <div className="space-y-3">
                {discrepancies.map((disc) => (
                  <div key={disc.id} className="p-3.5 bg-red-950/10 border border-red-500/10 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">{disc.asset_name} ({disc.asset_tag})</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        disc.verification_status === 'Missing' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      }`}>
                        {disc.verification_status}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed font-semibold">Notes: {disc.notes || 'None logged.'}</p>
                    <p className="text-[10px] text-slate-500">Auditor: {disc.auditor_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 4. MODAL: SCHEDULE AUDIT CYCLE */}
      {scheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setScheduleOpen(false)} />
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative z-10 animate-scale-up max-h-[90vh] overflow-y-auto">
            
            <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-purple-500" />
                Schedule Audit Cycle
              </h2>
              <button onClick={() => setScheduleOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Electronics Verification"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                  className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Scope Department (Optional)</label>
                <select
                  value={scheduleForm.department_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, department_id: e.target.value })}
                  className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                >
                  <option value="">-- All Departments --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Scope Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore Office"
                  value={scheduleForm.location}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                  className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.start_date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, start_date: e.target.value })}
                    className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.end_date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, end_date: e.target.value })}
                    className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Multiselect auditors */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Assign Auditors</label>
                <div className="max-h-32 overflow-y-auto bg-slate-950/40 p-3 rounded-lg border border-slate-900 space-y-2">
                  {employees.map((emp) => (
                    <label key={emp.id} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scheduleForm.auditor_ids.includes(emp.id)}
                        onChange={() => handleAuditorCheckboxChange(emp.id)}
                        className="rounded border-slate-800 text-purple-600 focus:ring-purple-500 bg-slate-900 h-4 w-4"
                      />
                      {emp.full_name} ({emp.role})
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setScheduleOpen(false)}
                  className="btn-secondary py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 text-xs px-6"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: VERIFY ITEM CHECKOFF */}
      {verifyOpen && targetAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setVerifyOpen(false)} />
          <div className="glass-card w-full max-w-sm rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative z-10 animate-scale-up">
            
            <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-purple-500" />
                Auditor Check-Off
              </h2>
              <button onClick={() => setVerifyOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="p-6 space-y-4">
              <div className="text-xs space-y-1.5 border-b border-slate-900 pb-3">
                <p>Asset: <strong>{targetAsset.asset_name}</strong></p>
                <p className="font-mono text-purple-400 text-[10px]">{targetAsset.asset_tag}</p>
                <p>Serial: <span className="text-slate-400">{targetAsset.serial_number}</span></p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Audit Check Status</label>
                <select
                  value={verifyForm.verification_status}
                  onChange={(e) => setVerifyForm({ ...verifyForm, verification_status: e.target.value })}
                  className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                >
                  <option value="Verified">Verified (Present & Good)</option>
                  <option value="Missing">Missing (Not found / Lost)</option>
                  <option value="Damaged">Damaged (Present but broken)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Verification Audit Notes</label>
                <textarea
                  placeholder="Record description of physical state, location verified, etc."
                  rows="3"
                  value={verifyForm.notes}
                  onChange={(e) => setVerifyForm({ ...verifyForm, notes: e.target.value })}
                  className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setVerifyOpen(false)}
                  className="btn-secondary py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 text-xs px-6"
                >
                  Save Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Audits;
