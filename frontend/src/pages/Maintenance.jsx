import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { 
  Wrench, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Upload,
  X,
  User,
  Activity,
  FileText,
  UserCheck,
  RefreshCw,
  Sliders
} from 'lucide-react';

const Maintenance = () => {
  const { user } = useAuth();
  
  // Lists states
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState('board');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Form states - Submit Request
  const [reqForm, setReqForm] = useState({ asset_id: '', issue_description: '', priority: 'Medium' });
  const [photoFile, setPhotoFile] = useState(null);

  // Form states - Action (Approve / Resolve)
  const [actionForm, setActionForm] = useState({
    status: 'Approved',
    technician_assigned: '',
    notes: ''
  });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqsRes, assetsRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/assets')
      ]);

      if (reqsRes.data.success) {
        setRequests(reqsRes.data.requests);
      }
      if (assetsRes.data.success) {
        // Employees can only request maintenance on assets, managers can see all
        setAssets(assetsRes.data.assets);
      }
    } catch (error) {
      console.error('Error fetching maintenance data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Submit Request
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!reqForm.asset_id || !reqForm.issue_description) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('asset_id', reqForm.asset_id);
      formData.append('issue_description', reqForm.issue_description);
      formData.append('priority', reqForm.priority);
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await api.post('/maintenance', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        showFeedback('success', 'Maintenance request raised successfully!');
        setReqForm({ asset_id: '', issue_description: '', priority: 'Medium' });
        setPhotoFile(null);
        setCreateOpen(false);
        fetchData();
      }
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  // Open Resolve/Action Modal
  const openAction = (req) => {
    setSelectedRequest(req);
    setActionForm({
      status: req.status === 'Pending' ? 'Approved' : 'In Progress',
      technician_assigned: req.technician_assigned || '',
      notes: ''
    });
    setActionOpen(true);
  };

  // Submit Action (Approve / Progress / Resolve)
  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      const res = await api.put(`/maintenance/${selectedRequest.id}`, {
        status: actionForm.status,
        technician_assigned: actionForm.technician_assigned,
        notes: actionForm.notes
      });

      if (res.data.success) {
        showFeedback('success', `Maintenance request updated to ${actionForm.status} successfully.`);
        setActionOpen(false);
        setSelectedRequest(null);
        fetchData();
      }
    } catch (error) {
      showFeedback('error', error.response?.data?.message || 'Failed to update request.');
    }
  };

  const getPriorityBadge = (p) => {
    const mapping = {
      'Low': 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
      'Medium': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      'High': 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      'Critical': 'bg-red-500/10 text-red-400 border border-red-500/20 border-l-4'
    };
    return mapping[p] || 'bg-slate-500/10 text-slate-300';
  };

  const getStatusBadge = (s) => {
    const mapping = {
      'Pending': 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      'Approved': 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      'Rejected': 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      'In Progress': 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      'Resolved': 'bg-green-500/10 text-green-400 border border-green-500/20'
    };
    return mapping[s] || 'bg-slate-500/10 text-slate-300';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Maintenance Management
          </h1>
          <p className="text-slate-400 mt-1">Submit equipment repair tickets and track status workflows from pending to resolved.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="btn-primary flex items-center gap-1.5 text-xs py-2.5"
          >
            <Plus className="w-4 h-4" />
            Raise Request
          </button>
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

      {/* Requests Kanban Board (Screen 7) */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-200">Maintenance Workflow Board</h2>
          <span className="text-xs text-slate-500 font-semibold font-mono">Drag/click columns to manage transitions</span>
        </div>

        {requests.length === 0 ? (
          <div className="glass-card py-16 text-center text-slate-500 text-xs rounded-2xl border border-slate-800">
            No maintenance requests logged in the system. Everything is operating normally.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
            
            {/* COLUMN 1: PENDING */}
            <div className="space-y-4 min-w-[200px]">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Pending</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-yellow-400/10 text-yellow-400">
                  {requests.filter(r => r.status === 'Pending').length}
                </span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {requests.filter(r => r.status === 'Pending').map(req => (
                  <div 
                    key={req.id} 
                    onClick={() => openAction(req)}
                    className="p-4 bg-slate-900/20 hover:bg-slate-900/60 border border-slate-900 hover:border-slate-800 rounded-xl cursor-pointer transition-all space-y-3 group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[10px] text-purple-400 font-bold bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">{req.asset_tag}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${getPriorityBadge(req.priority)}`}>{req.priority}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200 group-hover:text-purple-400 transition-colors">{req.asset_name}</p>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{req.issue_description}</p>
                    </div>
                    <div className="text-[9px] text-slate-600 border-t border-slate-900/60 pt-2 flex justify-between">
                      <span>By: {req.reported_by_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 2: APPROVED */}
            <div className="space-y-4 min-w-[200px]">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Approved</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-400/10 text-purple-400">
                  {requests.filter(r => r.status === 'Approved' && !r.technician_assigned).length}
                </span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {requests.filter(r => r.status === 'Approved' && !r.technician_assigned).map(req => (
                  <div 
                    key={req.id} 
                    onClick={() => openAction(req)}
                    className="p-4 bg-slate-900/20 hover:bg-slate-900/60 border border-slate-900 hover:border-slate-800 rounded-xl cursor-pointer transition-all space-y-3 group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[10px] text-purple-400 font-bold bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">{req.asset_tag}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${getPriorityBadge(req.priority)}`}>{req.priority}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200 group-hover:text-purple-400 transition-colors">{req.asset_name}</p>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{req.issue_description}</p>
                    </div>
                    <div className="text-[9px] text-slate-600 border-t border-slate-900/60 pt-2">
                      <span>No Tech Assigned</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 3: TECH ASSIGNED */}
            <div className="space-y-4 min-w-[200px]">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Tech Assigned</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-400/10 text-indigo-400">
                  {requests.filter(r => r.status === 'Approved' && r.technician_assigned).length}
                </span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {requests.filter(r => r.status === 'Approved' && r.technician_assigned).map(req => (
                  <div 
                    key={req.id} 
                    onClick={() => openAction(req)}
                    className="p-4 bg-slate-900/20 hover:bg-slate-900/60 border border-slate-900 hover:border-slate-800 rounded-xl cursor-pointer transition-all space-y-3 group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[10px] text-purple-400 font-bold bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">{req.asset_tag}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${getPriorityBadge(req.priority)}`}>{req.priority}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200 group-hover:text-purple-400 transition-colors">{req.asset_name}</p>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{req.issue_description}</p>
                    </div>
                    <div className="text-[9px] text-indigo-300 border-t border-slate-900/60 pt-2 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span className="truncate">{req.technician_assigned}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 4: IN PROGRESS */}
            <div className="space-y-4 min-w-[200px]">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">In Progress</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-400/10 text-blue-400">
                  {requests.filter(r => r.status === 'In Progress').length}
                </span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {requests.filter(r => r.status === 'In Progress').map(req => (
                  <div 
                    key={req.id} 
                    onClick={() => openAction(req)}
                    className="p-4 bg-slate-900/20 hover:bg-slate-900/60 border border-slate-900 hover:border-slate-800 rounded-xl cursor-pointer transition-all space-y-3 group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[10px] text-purple-400 font-bold bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">{req.asset_tag}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${getPriorityBadge(req.priority)}`}>{req.priority}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200 group-hover:text-purple-400 transition-colors">{req.asset_name}</p>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{req.issue_description}</p>
                    </div>
                    <div className="text-[9px] text-blue-300 border-t border-slate-900/60 pt-2 flex items-center gap-1">
                      <User className="w-3 h-3 text-blue-400" />
                      <span className="truncate">{req.technician_assigned}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 5: RESOLVED / CLOSED */}
            <div className="space-y-4 min-w-[200px]">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Resolved</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-green-400/10 text-green-400">
                  {requests.filter(r => r.status === 'Resolved' || r.status === 'Rejected').length}
                </span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {requests.filter(r => r.status === 'Resolved' || r.status === 'Rejected').map(req => (
                  <div 
                    key={req.id} 
                    className="p-4 bg-slate-900/20 border border-slate-900 rounded-xl space-y-3 opacity-60"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[10px] text-slate-500 font-bold bg-slate-500/5 px-2 py-0.5 rounded border border-slate-500/10">{req.asset_tag}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-950/20 text-green-400 border border-green-950/30`}>{req.status}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-300">{req.asset_name}</p>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{req.issue_description}</p>
                    </div>
                    <div className="text-[9px] text-slate-500 border-t border-slate-900/60 pt-2 flex items-center justify-between">
                      <span className="truncate">Tech: {req.technician_assigned || 'None'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 3. MODAL: CREATE REQUEST */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative z-10 animate-scale-up">
            
            <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-500" />
                Raise Repair Ticket
              </h2>
              <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Asset / Equipment</label>
                <select
                  required
                  value={reqForm.asset_id}
                  onChange={(e) => setReqForm({ ...reqForm, asset_id: e.target.value })}
                  className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets
                    .filter(a => a.status !== 'Retired' && a.status !== 'Disposed')
                    .map(a => (
                      <option key={a.id} value={a.id}>{a.asset_tag} - {a.name} ({a.status})</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                <select
                  value={reqForm.priority}
                  onChange={(e) => setReqForm({ ...reqForm, priority: e.target.value })}
                  className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Issue Description</label>
                <textarea
                  required
                  rows="4"
                  value={reqForm.issue_description}
                  onChange={(e) => setReqForm({ ...reqForm, issue_description: e.target.value })}
                  placeholder="Clearly describe the mechanical or technical issue with this device..."
                  className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                />
              </div>

              {/* Photo upload */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Attach Defect Image</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900/30 transition-all">
                    <div className="flex flex-col items-center justify-center pt-2 pb-3">
                      <Upload className="w-5 h-5 text-slate-500 mb-1" />
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {photoFile ? photoFile.name : 'Choose file (optional)'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhotoFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="btn-secondary py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary py-2 text-xs px-6"
                >
                  {loading ? 'Submitting...' : 'Raise Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: MANAGE TICKET WORKFLOW (Admin/Manager only) */}
      {actionOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setActionOpen(false)} />
          <div className="glass-card w-full max-w-sm rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative z-10 animate-scale-up">
            
            <div className="px-6 py-4 border-b border-slate-900 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                Manage Repair State
              </h2>
              <button onClick={() => setActionOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="p-6 space-y-4">
              
              <div className="text-xs space-y-2 border-b border-slate-900 pb-3">
                <p>Asset: <strong>{selectedRequest.asset_name} ({selectedRequest.asset_tag})</strong></p>
                <p>Issue: <span className="text-slate-400">{selectedRequest.issue_description}</span></p>
                <p>Current State: <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(selectedRequest.status)}`}>{selectedRequest.status}</span></p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Transition Target State</label>
                <select
                  value={actionForm.status}
                  onChange={(e) => setActionForm({ ...actionForm, status: e.target.value })}
                  className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                >
                  {selectedRequest.status === 'Pending' && (
                    <>
                      <option value="Approved">Approved (Start Repair)</option>
                      <option value="Rejected">Rejected</option>
                    </>
                  )}
                  {selectedRequest.status === 'Approved' && (
                    <>
                      <option value="In Progress">In Progress (Technician Working)</option>
                      <option value="Resolved">Resolved (Repair Finished)</option>
                    </>
                  )}
                  {selectedRequest.status === 'In Progress' && (
                    <option value="Resolved">Resolved (Repair Finished)</option>
                  )}
                </select>
              </div>

              {(actionForm.status === 'Approved' || selectedRequest.status === 'Pending') && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Assign Technician</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar (Hardware Tech)"
                    value={actionForm.technician_assigned}
                    onChange={(e) => setActionForm({ ...actionForm, technician_assigned: e.target.value })}
                    className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status Audit Notes</label>
                <textarea
                  placeholder="Record resolution details or status remarks..."
                  rows="3"
                  value={actionForm.notes}
                  onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
                  className="w-full glass-input px-3.5 py-2 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setActionOpen(false)}
                  className="btn-secondary py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 text-xs px-6"
                >
                  Confirm State Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Maintenance;
