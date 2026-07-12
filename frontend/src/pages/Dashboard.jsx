import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  ShieldCheck, 
  Database, 
  Server, 
  Cpu, 
  ExternalLink,
  LogOut,
  MailCheck
} from 'lucide-react';

const Dashboard = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full relative flex-grow">
      {/* Background glow circle */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            User Workspace
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview of your secure authentication state and credentials.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-900/30 rounded-lg text-sm font-semibold transition-all cursor-pointer md:w-auto w-full"
        >
          <LogOut className="w-4 h-4" />
          Log Out Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Greeting Card */}
        <div className="glass-card rounded-xl p-6 border border-slate-800/80 lg:col-span-2 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-white">
            <Cpu className="w-40 h-40" />
          </div>

          <div className="z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-semibold text-emerald-400 mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              Authenticated Session Secure
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              Welcome back, {user.full_name}!
            </h2>
            <p className="text-sm text-slate-400 max-w-lg leading-relaxed mb-6">
              Your account has been fully verified and registered in the database. You now have access to the protected routes and components in the Odoo Hackathon Starter Workspace.
            </p>
          </div>

          <div className="border-t border-slate-800/80 pt-4 flex flex-wrap gap-4 items-center justify-between z-10">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Joined on: {new Date(user.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
            </div>
            <Link 
              to="/profile" 
              className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors"
            >
              Configure Profile
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* User Quick Info */}
        <div className="glass-card rounded-xl p-6 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-300 mb-4 pb-2 border-b border-slate-800/80">
              Account Attributes
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-800/80 rounded-lg text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">User Reference ID</p>
                  <p className="text-sm text-slate-200 font-mono mt-0.5">USR-0000{user.id}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-800/80 rounded-lg text-slate-400">
                  <MailCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Verification State</p>
                  <p className="text-sm text-emerald-400 font-semibold mt-0.5">Email Verified & Active</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
            Token encryption: HS256 JWT
          </div>
        </div>

        {/* System Architecture panel */}
        <div className="glass-card rounded-xl p-6 border border-slate-800/80 lg:col-span-3">
          <h3 className="text-base font-bold text-slate-300 mb-4">
            Security & Stack Audit
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            {/* Database */}
            <div className="p-4 bg-slate-900/40 rounded-lg border border-slate-800/50 flex gap-3">
              <Database className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-200">Database</h4>
                <p className="text-xs text-slate-400 mt-1">Aiven Managed Cloud MySQL (SSL enabled). Parameters verified, user indexes built.</p>
              </div>
            </div>

            {/* Server */}
            <div className="p-4 bg-slate-900/40 rounded-lg border border-slate-800/50 flex gap-3">
              <Server className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-200">Express API Router</h4>
                <p className="text-xs text-slate-400 mt-1">Restricted by rate-limiters, protected with Helmet headers, CORS parameters, and JWT middleware.</p>
              </div>
            </div>

            {/* Password Security */}
            <div className="p-4 bg-slate-900/40 rounded-lg border border-slate-800/50 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-200">Encryption Layer</h4>
                <p className="text-xs text-slate-400 mt-1">Password hashes generated with bcryptjs using a work factor of 10. Plain text records are never created.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
