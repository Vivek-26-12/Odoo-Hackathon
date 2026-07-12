import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldQuestion } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex-grow flex flex-col justify-center items-center py-16 px-4 bg-slate-950 text-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="glass-card max-w-md w-full p-8 rounded-2xl border border-slate-800/80 z-10 shadow-2xl">
        <div className="flex justify-center text-purple-400 mb-4 animate-bounce">
          <ShieldQuestion className="w-16 h-16" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
          404
        </h1>
        <h2 className="text-lg font-bold text-slate-200 mb-4">
          Page Not Found
        </h2>
        
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          The page you are looking for does not exist, has been moved, or you might not have permission to view it.
        </p>

        <Link to="/" className="btn-primary inline-block w-full">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
