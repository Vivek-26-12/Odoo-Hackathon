import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, Lock, User, AlertCircle, Loader2, ShieldCheck, Check } from 'lucide-react';

const Register = () => {
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  // Watch password field to compute strength indicator dynamically
  const password = watch('password', '');

  // Calculate password strength rating (0 to 4)
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return Math.min(score, 4); // Clamp to max 4 bars
  };

  const strengthScore = getPasswordStrength(password);
  const strengthLabels = ['Too short', 'Weak', 'Fair', 'Strong', 'Excellent'];
  const strengthColors = [
    'bg-slate-800',
    'bg-rose-500',
    'bg-amber-500',
    'bg-indigo-500',
    'bg-emerald-500'
  ];

  const onSubmit = async (data) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const response = await registerUser(data.name, data.email, data.password, data.confirmPassword);
      if (response.success) {
        // Redirect to Email Verification page, pass the email so it is prefilled
        navigate('/verify-email', { state: { email: data.email } });
      }
    } catch (error) {
      console.error('Registration submit error:', error.message);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-center text-white mb-6">
        Create Account
      </h2>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-lg flex items-start gap-2 text-sm text-red-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              disabled={loading}
              placeholder="John Doe"
              className={`glass-input w-full pl-10 pr-4 py-2 rounded-lg text-sm ${
                errors.name ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/25' : ''
              }`}
              {...register('name', {
                required: 'Full name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters long'
                }
              })}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-xs text-red-400 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email Address Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              disabled={loading}
              placeholder="john@example.com"
              className={`glass-input w-full pl-10 pr-4 py-2 rounded-lg text-sm ${
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
            <p className="mt-1 text-xs text-red-400 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              disabled={loading}
              placeholder="••••••••"
              className={`glass-input w-full pl-10 pr-4 py-2 rounded-lg text-sm ${
                errors.password ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/25' : ''
              }`}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters long'
                }
              })}
            />
          </div>

          {/* Password strength UI */}
          {password && (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                <span>Strength</span>
                <span className={strengthScore > 1 ? 'text-indigo-400' : 'text-slate-400'}>
                  {strengthLabels[strengthScore]}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      step <= strengthScore ? strengthColors[strengthScore] : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {errors.password && (
            <p className="mt-1 text-xs text-red-400 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              disabled={loading}
              placeholder="••••••••"
              className={`glass-input w-full pl-10 pr-4 py-2 rounded-lg text-sm ${
                errors.confirmPassword ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/25' : ''
              }`}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) => val === watch('password') || 'Passwords do not match'
              })}
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-400 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Registering...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Redirect Link */}
      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
        >
          Sign in here
        </Link>
      </p>
    </div>
  );
};

export default Register;
