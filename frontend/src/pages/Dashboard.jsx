import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { 
  Boxes, 
  ArrowLeftRight, 
  Wrench, 
  Calendar, 
  Clock, 
  AlertTriangle,
  PlusCircle,
  FilePlus,
  CalendarDays,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    assetsAvailable: 0,
    assetsAllocated: 0,
    maintenanceToday: 0,
    activeBookings: 0,
    pendingTransfers: 0,
    upcomingReturns: 0,
    overdueReturns: 0
  });

  const [overdueAlerts, setOverdueAlerts] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.get('/reports/dashboard');
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      // If Admin or Asset Manager, pull the list of overdue items to highlight on dashboard
      if (user?.role === 'admin' || user?.role === 'asset_manager') {
        const overdueRes = await api.get('/allocations/overdue');
        if (overdueRes.data.success) {
          setOverdueAlerts(overdueRes.data.overdue);
        }
      }

      // Fetch recent logs
      try {
        const logsRes = await api.get('/notifications/logs');
        if (logsRes.data.success) {
          setRecentLogs(logsRes.data.logs.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching logs for dashboard:', err.message);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Greeting and summary */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Operational Workspace Dashboard
        </h1>
        <p className="text-slate-400 mt-1">Hello, {user.full_name}. Here is a real-time operational snapshot of the organization's assets and resources.</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Available */}
        <div className="glass-card p-5 rounded-2xl border border-slate-900 flex flex-col justify-between hover:border-slate-800 transition-all">
          <div className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Available Assets</div>
          <div className="text-3xl font-black text-white mt-4">{stats.assetsAvailable}</div>
          <div className="text-[10px] text-green-400 font-semibold mt-1">Ready to Allocate</div>
        </div>

        {/* Assigned */}
        <div className="glass-card p-5 rounded-2xl border border-slate-900 flex flex-col justify-between hover:border-slate-800 transition-all">
          <div className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Assigned Assets</div>
          <div className="text-3xl font-black text-white mt-4">{stats.assetsAllocated}</div>
          <div className="text-[10px] text-blue-400 font-semibold mt-1">Currently Checked Out</div>
        </div>

        {/* Bookings */}
        <div className="glass-card p-5 rounded-2xl border border-slate-900 flex flex-col justify-between hover:border-slate-800 transition-all">
          <div className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Active Bookings</div>
          <div className="text-3xl font-black text-white mt-4">{stats.activeBookings}</div>
          <div className="text-[10px] text-purple-400 font-semibold mt-1">Rooms & Cars in use</div>
        </div>

        {/* Maintenance */}
        <div className="glass-card p-5 rounded-2xl border border-slate-900 flex flex-col justify-between hover:border-slate-800 transition-all">
          <div className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Maintenance Today</div>
          <div className="text-3xl font-black text-white mt-4">{stats.maintenanceToday}</div>
          <div className="text-[10px] text-orange-400 font-semibold mt-1">Repairs in progress</div>
        </div>

        {/* Transfers */}
        <div className="glass-card p-5 rounded-2xl border border-slate-900 flex flex-col justify-between hover:border-slate-800 transition-all">
          <div className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">Pending Transfers</div>
          <div className="text-3xl font-black text-white mt-4">{stats.pendingTransfers}</div>
          <div className="text-[10px] text-indigo-400 font-semibold mt-1">Awaiting approval</div>
        </div>

        {/* Overdue (Highlighted separately) */}
        <div className={`glass-card p-5 rounded-2xl flex flex-col justify-between hover:scale-102 transition-all ${
          stats.overdueReturns > 0 ? 'bg-red-950/20 border-red-500/20 text-red-300' : 'border-slate-900 text-slate-400'
        }`}>
          <div className="text-[10px] font-bold uppercase tracking-wider">Overdue Returns</div>
          <div className="text-3xl font-black mt-4">{stats.overdueReturns}</div>
          <div className={`text-[10px] font-semibold mt-1 ${stats.overdueReturns > 0 ? 'text-red-400 animate-pulse' : 'text-slate-500'}`}>
            {stats.overdueReturns > 0 ? 'Urgent Return Needed' : 'No overdue items'}
          </div>
        </div>

      </div>

      {/* Main Grid: Quick Actions + Overdue Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions (1 column) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900">Quick Operations</h2>
          
          <div className="grid grid-cols-1 gap-3">
            
            <Link 
              to="/assets" 
              className="flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-900 rounded-xl group transition-all"
            >
              <div className="flex items-center gap-3">
                <PlusCircle className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-xs font-bold text-slate-200">Register Inventory Asset</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Add computers, vehicle plates, furniture</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link 
              to="/bookings" 
              className="flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-900 rounded-xl group transition-all"
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-indigo-400" />
                <div>
                  <p className="text-xs font-bold text-slate-200">Book Shared Resource</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Schedule meeting rooms, cars, accessories</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link 
              to="/maintenance" 
              className="flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900 border border-slate-900 rounded-xl group transition-all"
            >
              <div className="flex items-center gap-3">
                <Wrench className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-xs font-bold text-slate-200">Raise Repair Request</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Report broken screens, mechanical bugs</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
            </Link>

          </div>
        </div>

        {/* Alerts / Overdue returning list panel (2 columns) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800/80">
          <div className="flex justify-between items-center pb-2 border-b border-slate-900 mb-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4.5 h-4.5 text-red-500" />
              Overdue Returns Alerts
            </h2>
            {overdueAlerts.length > 0 && (
              <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded font-bold">
                Action Required
              </span>
            )}
          </div>

          {overdueAlerts.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <p className="font-semibold text-slate-400">All equipment allocations are up to date.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {overdueAlerts.map((al) => {
                const days = Math.floor((new Date() - new Date(al.expected_return_date)) / (1000 * 60 * 60 * 24));
                return (
                  <div key={al.id} className="p-3 bg-red-950/10 border border-red-500/10 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{al.asset_name} ({al.asset_tag})</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Holder: <strong>{al.employee_name || al.department_name}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-400">{days} days past due</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">Due: {new Date(al.expected_return_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Recent Activity (Screen 2) */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800/80">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-4.5 h-4.5 text-purple-400" />
          Recent Activity
        </h2>
        
        <div className="space-y-3">
          {(recentLogs.length > 0 ? recentLogs : [
            { id: 1, action: 'Allocation', details: 'Laptop AF-0014 allocated to John since 10 days', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2) },
            { id: 2, action: 'Booking', details: 'Room R8 - booking confirmed - 2:00 to 3:00 PM', created_at: new Date(Date.now() - 1000 * 60 * 60 * 4) },
            { id: 3, action: 'Maintenance', details: 'Projector AF-0021 - maintenance resolved', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24) }
          ]).map((log) => (
            <div key={log.id} className="p-3 bg-slate-950/40 border border-slate-900/60 rounded-xl flex justify-between items-center text-xs animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {log.action || 'Log'}
                </span>
                <span className="font-semibold text-slate-300">{log.details}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
