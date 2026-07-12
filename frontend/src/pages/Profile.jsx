import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { User, Mail, ShieldAlert, ShieldCheck, Key, Calendar } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 w-full relative flex-grow">
      {/* Background glow circle */}
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-64 h-64 bg-indigo-600/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Profile Credentials
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review your account variables and security status.
        </p>
      </div>

      <div className="glass-card rounded-xl border border-slate-800/80 p-6 md:p-8 space-y-6">
        {/* Header avatar / details */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-800/80">
          <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-500/25">
            <User className="w-10 h-10" />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-white">{user.full_name}</h2>
            <p className="text-sm text-slate-400 mt-0.5">{user.email}</p>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-wide mt-2">
              <ShieldCheck className="w-3 h-3" />
              Verified User
            </div>
          </div>
        </div>

        {/* Profile Details List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Full Name
            </span>
            <p className="text-sm font-medium text-slate-200 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/50">
              {user.full_name}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email Address
            </span>
            <p className="text-sm font-medium text-slate-200 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/50">
              {user.email}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              Account ID Reference
            </span>
            <p className="text-sm font-medium text-slate-200 font-mono bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/50">
              USR-0000{user.id}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Registration Date
            </span>
            <p className="text-sm font-medium text-slate-200 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/50">
              {new Date(user.created_at).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="p-4 bg-purple-950/20 border border-purple-900/30 rounded-lg flex gap-3 text-xs text-purple-300">
          <ShieldAlert className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <p className="font-bold mb-1">Stateful Session Managed via JWT Token</p>
            <p>Your authentication tokens are stored locally on this machine and verified with an encrypted hash key on the Aiven server. Please make sure to log out if you are accessing from a shared computer.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
