import React from 'react';
import { Shield, Key, Mail, RefreshCw, Cpu, CheckCircle, Boxes, Calendar, Wrench, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link as RouterLink } from 'react-router-dom';

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      title: 'Structured Asset Lifecycle',
      desc: 'Track equipment through Available, Allocated, Reserved, Maintenance, Lost, Retired, and Disposed states.',
      icon: Boxes,
      color: 'text-purple-400 bg-purple-500/10'
    },
    {
      title: 'Resource Booking Calendars',
      desc: 'Book shared office spaces, vehicles, and limited resources with transactional overlap validations.',
      icon: Calendar,
      color: 'text-indigo-400 bg-indigo-500/10'
    },
    {
      title: 'Maintenance Approvals',
      desc: 'Route equipment repair tickets through a workflow containing approvals, technician logs, and resolution releases.',
      icon: Wrench,
      color: 'text-orange-400 bg-orange-500/10'
    },
    {
      title: 'Periodic Audit Campaigns',
      desc: 'Schedule audit cycles, assign auditors, verify inventory on-site, and auto-flag discrepancies.',
      icon: ClipboardCheck,
      color: 'text-emerald-400 bg-emerald-500/10'
    }
  ];

  return (
    <div className="flex-grow flex flex-col justify-center py-12 px-4 relative overflow-hidden bg-slate-950">
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto z-10 w-full text-center mt-12 mb-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-950/50 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300 mb-6">
          <Cpu className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
          AssetFlow ERP Platform
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
          <span className="block bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Simplify & Digitize
          </span>
          <span className="block mt-2 bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
            Your Organization's Physical Assets
          </span>
        </h1>

        {/* Description */}
        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Centralized resource booking, dynamic category schemas, role-based workflows, and chronological audit histories. Hardened for high-concurrency conflict validations.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <RouterLink to="/dashboard" className="btn-primary w-full sm:w-auto px-8 py-3.5 text-base">
              Go to Dashboard
            </RouterLink>
          ) : (
            <>
              <RouterLink to="/register" className="btn-primary w-full sm:w-auto px-8 py-3.5 text-base">
                Get Started (Employee Signup)
              </RouterLink>
              <RouterLink to="/login" className="btn-secondary w-full sm:w-auto px-8 py-3.5 text-base">
                Sign In
              </RouterLink>
            </>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-16 z-10">
        <h2 className="text-xl font-bold text-center text-slate-300 mb-8 tracking-wider uppercase">
          Key ERP Management Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx} 
                className="glass-card glass-card-hover p-6 rounded-xl border border-slate-800/60 flex gap-4 items-start"
              >
                <div className={`p-3 rounded-lg ${feat.color} shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-1">{feat.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
