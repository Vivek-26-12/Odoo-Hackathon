import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { 
  History, 
  Search, 
  AlertTriangle, 
  RefreshCw,
  User,
  Shield,
  Activity
} from 'lucide-react';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/logs');
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Error fetching system logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getRoleBadge = (role) => {
    const mapping = {
      admin: 'bg-red-500/10 text-red-400 border border-red-500/20',
      asset_manager: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      dept_head: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      employee: 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
    };
    return mapping[role] || 'bg-slate-500/10 text-slate-300';
  };

  // Filter logs by search query
  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (log.user_name && log.user_name.toLowerCase().includes(query)) ||
      (log.action && log.action.toLowerCase().includes(query)) ||
      (log.details && log.details.toLowerCase().includes(query)) ||
      (log.user_role && log.user_role.toLowerCase().includes(query))
    );
  });

  if (feedback) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-red-500/20 text-center max-w-xl mx-auto mt-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-100">Permission Required</h2>
        <p className="text-slate-400 mt-2">{feedback}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            System Activity Audit Trail
          </h1>
          <p className="text-slate-400 mt-1">Review system-wide actions, state modifications, audit closures, and operational updates.</p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Refresh Logs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Searching Bar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-500 ml-2" />
        <input
          type="text"
          placeholder="Search by action, user name, role, details..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-0 outline-none text-xs text-slate-300 py-1.5 focus:ring-0"
        />
      </div>

      {/* Logs Table */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800">
        {loading && logs.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Fetching system audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No audit logs found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-900 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 font-bold">Timestamp</th>
                  <th className="py-3 px-4 font-bold">User Name</th>
                  <th className="py-3 px-4 font-bold">System Role</th>
                  <th className="py-3 px-4 font-bold">Action</th>
                  <th className="py-3 px-4 font-bold">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/10">
                    <td className="py-4 px-4 text-slate-400 font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-200">
                      {log.user_name || <span className="text-slate-600">System Agent</span>}
                    </td>
                    <td className="py-4 px-4">
                      {log.user_role ? (
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold capitalize ${getRoleBadge(log.user_role)}`}>
                          {log.user_role.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10 font-bold">
                        <Activity className="w-3 h-3" />
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-300 font-semibold max-w-sm truncate" title={log.details}>
                      {log.details || <span className="text-slate-600">None</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ActivityLogs;
