import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const response = await loginUser(data.email, data.password);
      if (response.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login submit error:', error.message);
      
      // If user is unverified, backend responds with 403 status code and warning message
      // We will extract and pass email along in route state to Verify page
      if (error.message.includes('not verified')) {
        navigate('/verify-email', { state: { email: data.email, autoSent: true } });
      } else {
        setErrorMsg(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-center text-slate-200 mb-6 font-mono">
        AssetFlow - login
      </h2>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-lg flex items-start gap-2 text-sm text-red-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Input */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              disabled={loading}
              placeholder="name@company.com"
              className={`glass-input w-full pl-10 pr-4 py-2.5 rounded-lg text-xs ${
                errors.email ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/25' : ''
              }`}
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Enter a valid email address'
                }
              })}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              disabled={loading}
              placeholder="••••••••"
              className={`glass-input w-full pl-10 pr-10 py-2.5 rounded-lg text-xs ${
                errors.password ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/25' : ''
              }`}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />
            <button
              type="button"
              tabIndex="-1"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="text-right mt-1.5">
            <Link
              to="/forgot-password"
              className="text-xs text-slate-400 hover:text-slate-300 font-medium transition-colors"
            >
              Forgot password
            </Link>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-2 py-2 text-xs"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* New Here Box Container */}
      <div className="mt-8 pt-6 border-t border-slate-900 space-y-4">
        <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl text-center space-y-2">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">New here?</p>
          <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
            Sign up creates an employee account.<br />
            admin roles assigned later.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-block w-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 py-2 rounded-lg text-xs font-semibold transition-all"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
