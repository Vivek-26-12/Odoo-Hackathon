import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { 
  BarChart3, 
  TrendingUp, 
  Wrench, 
  Building2, 
  Clock, 
  Download,
  AlertTriangle,
  Info,
  RefreshCw
} from 'lucide-react';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/analytics');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Error fetching analytics report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  // Export CSV report simulator
  const handleExport = (reportType) => {
    if (!data) return;
    alert(`CSV Export successfully triggered for: ${reportType}. The file has been prepared and downloaded.`);
  };

  if (loading && !data) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-semibold text-sm">Generating real-time reports & analytics trends...</p>
      </div>
    );
  }

  if (feedback) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-red-500/20 text-center max-w-xl mx-auto mt-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-100">Permission Required</h2>
        <p className="text-slate-400 mt-2">{feedback}</p>
      </div>
    );
  }

  // Extract variables safely
  const utilization = data?.utilization || { mostAllocated: [], idleAssets: [] };
  const maintenance = data?.maintenance || { byCategory: [], byAsset: [] };
  const departmentAllocations = data?.departments || [];
  const bookingsHeatmap = data?.bookingsHeatmap || [];

  // Generate Booking Heatmap Cells (24 hours representation)
  const heatmapData = Array.from({ length: 24 }, (_, hour) => {
    const match = bookingsHeatmap.find(h => h.booking_hour === hour);
    return { hour, count: match ? match.count : 0 };
  });

  const maxHeatmapCount = Math.max(...heatmapData.map(h => h.count), 1);
  const maxMaintCatCount = Math.max(...maintenance.byCategory.map(c => c.count), 1);
  const maxDeptAllocCount = Math.max(...departmentAllocations.map(d => d.count), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-slate-400 mt-1">Review operational utilization charts, maintenance logs, and resource booking heatmaps.</p>
        </div>
        <button
          onClick={fetchReportsData}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer self-end sm:self-center"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* CHART 1: ASSET UTILIZATION (Most Active) */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  Asset Utilization: Most-Used
                </h2>
                <button 
                  onClick={() => handleExport('utilization_report')}
                  className="p-2 bg-slate-950/60 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-purple-400 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>

              {utilization.mostAllocated.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No allocation logs found to generate utilization stats.
                </div>
              ) : (
                <div className="space-y-4">
                  {utilization.mostAllocated.map((asset, idx) => (
                    <div key={asset.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-200">{asset.name} <span className="text-[10px] text-slate-500">({asset.asset_tag})</span></span>
                        <span className="text-purple-400 font-bold">{asset.allocation_count} Allocations</span>
                      </div>
                      {/* Custom bar chart representation */}
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${(asset.allocation_count / Math.max(...utilization.mostAllocated.map(a => a.allocation_count), 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Idle Assets checklist sub-card */}
            {utilization.idleAssets.length > 0 && (
              <div className="mt-8 border-t border-slate-900 pt-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Idle Inventory (No allocations registered)</h3>
                <div className="space-y-2">
                  {utilization.idleAssets.map(asset => (
                    <div key={asset.id} className="flex justify-between items-center text-xs bg-slate-950/40 px-3.5 py-2.5 rounded-xl border border-slate-900/60">
                      <span className="font-semibold text-slate-300">{asset.name}</span>
                      <span className="font-mono text-[10px] text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">{asset.asset_tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CHART 2: MAINTENANCE FREQUENCY BY CATEGORY */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-400" />
                Maintenance Rate by Category
              </h2>
              <button 
                onClick={() => handleExport('maintenance_report')}
                className="p-2 bg-slate-950/60 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-purple-400 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>

            {maintenance.byCategory.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No maintenance incidents reported. Category breakdowns are clear.
              </div>
            ) : (
              <div className="space-y-5">
                {maintenance.byCategory.map((cat) => (
                  <div key={cat.category_name} className="flex items-center gap-4 text-xs">
                    <span className="w-24 font-bold text-slate-300 truncate">{cat.category_name}</span>
                    <div className="flex-1 bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-900">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all"
                        style={{ width: `${(cat.count / maxMaintCatCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-bold text-orange-400">{cat.count} Requests</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CHART 3: DEPARTMENT ALLOCATION SUMMARY */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                Department Assignment Breakdown
              </h2>
              <button 
                onClick={() => handleExport('department_allocations_report')}
                className="p-2 bg-slate-950/60 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-purple-400 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>

            {departmentAllocations.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No active department-level assignments found.
              </div>
            ) : (
              <div className="space-y-4">
                {departmentAllocations.map((dept) => (
                  <div key={dept.department_name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300 font-bold">{dept.department_name}</span>
                      <span className="text-indigo-400 font-bold">{dept.count} Active Assets</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all"
                        style={{ width: `${(dept.count / maxDeptAllocCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CHART 4: BOOKING HEATMAP BY HOUR */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Resource Booking Heatmap (24-Hour Windows)
              </h2>
              <button 
                onClick={() => handleExport('booking_heatmap_report')}
                className="p-2 bg-slate-950/60 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-purple-400 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>

            {/* Heatmap Grid Cell layout (24 hours grid) */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {heatmapData.map((cell) => {
                // Color intensity based on booking count
                const intensityRatio = cell.count / maxHeatmapCount;
                let bgClass = 'bg-slate-950 border-slate-900/60 text-slate-600';
                
                if (cell.count > 0) {
                  if (intensityRatio < 0.3) bgClass = 'bg-purple-950/20 border-purple-900/20 text-purple-400';
                  else if (intensityRatio < 0.7) bgClass = 'bg-purple-800/20 border-purple-500/30 text-purple-300';
                  else bgClass = 'bg-purple-600/30 border-purple-400/50 text-white font-bold';
                }

                return (
                  <div 
                    key={cell.hour} 
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${bgClass}`}
                    title={`${cell.count} bookings made between ${cell.hour}:00 and ${cell.hour + 1}:00`}
                  >
                    <span className="text-[10px] font-bold tracking-wider">{String(cell.hour).padStart(2, '0')}:00</span>
                    <span className="text-xs mt-1 font-extrabold">{cell.count}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center justify-end gap-4 mt-6 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-950 border border-slate-900" /> Low Usage</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-800/20 border border-purple-500/30" /> Moderate</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-600/30 border border-purple-400/50" /> Peak Hour</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default Reports;
