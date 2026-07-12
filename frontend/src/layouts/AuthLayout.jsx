import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-950">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex flex-col items-center gap-2 group">
            <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300">
              <span className="text-xl font-black text-purple-400 font-mono tracking-wider">AF</span>
            </div>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">
              AssetFlow
            </span>
          </Link>
        </div>

        {/* Auth Page Content Container (Glass Card) */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl border border-slate-800/80">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
