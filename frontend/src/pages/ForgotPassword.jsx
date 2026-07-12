import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, AlertCircle, Loader2, KeyRound } from 'lucide-react';

const ForgotPassword = () => {
  const { forgotPasswordOtp } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const response = await forgotPasswordOtp(data.email);
      if (response.success) {
        // Redirect to Reset Password and pass email to be prefilled
        navigate('/reset-password', { state: { email: data.email } });
      }
    } catch (error) {
      console.error('Forgot password submit error:', error.message);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-center mb-2 text-brand-400">
        <KeyRound className="w-10 h-10" />
      </div>
      <h2 className="text-xl font-bold text-center text-white mb-2">
        Recover Password
      </h2>
      <p className="text-center text-xs text-slate-400 mb-6 leading-relaxed">
        Enter your verified email address and we will send you a 6-digit OTP code to reset your password.
      </p>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-lg flex items-start gap-2 text-sm text-red-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder="you@example.com"
              className={`glass-input w-full pl-10 pr-4 py-2.5 rounded-lg text-sm ${
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

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending recovery email...
            </>
          ) : (
            'Send Recovery OTP'
          )}
        </button>
      </form>

      {/* Back to Login link */}
      <p className="mt-6 text-center text-sm text-slate-400">
        Remembered your password?{' '}
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

export default ForgotPassword;
