import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const VerifyEmail = () => {
  const { verifyEmailOtp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm();

  // Populate email from router state if navigating from register
  useEffect(() => {
    if (location.state && location.state.email) {
      setValue('email', location.state.email);
    }
  }, [location.state, setValue]);

  const onSubmit = async (data) => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const response = await verifyEmailOtp(data.email, data.otp);
      if (response.success) {
        setSuccessMsg(response.message || 'Email verified successfully!');
        // Redirect to Login page after short delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Verify OTP submit error:', error.message);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-center text-white mb-4">
        Verify Your Email
      </h2>

      {/* Info notice if OTP sent automatically */}
      {!successMsg && !errorMsg && (
        <div className="mb-5 p-3 bg-brand-950/40 border border-brand-500/20 rounded-lg text-xs text-brand-300 text-center leading-relaxed">
          We have sent a 6-digit OTP verification code. Please check your spam folder if it doesn't appear in your inbox.
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div className="mb-4 p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-lg flex flex-col items-center text-center gap-2 text-sm text-emerald-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
          <span className="font-semibold text-emerald-300">Verification Successful!</span>
          <span>{successMsg}</span>
          <span className="text-xs text-slate-400 mt-1">Redirecting you to Login in a moment...</span>
          <Link to="/login" className="btn-primary py-1.5 px-4 text-xs mt-2 w-full">
            Log In Now
          </Link>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-lg flex items-start gap-2 text-sm text-red-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!successMsg && (
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

          {/* OTP Code Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              6-Digit OTP Code
            </label>
            <input
              type="text"
              disabled={loading}
              maxLength="6"
              placeholder="123456"
              className={`glass-input w-full px-4 py-3 rounded-lg text-lg text-center font-mono tracking-[0.5em] focus:tracking-[0.5em] ${
                errors.otp ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/25' : ''
              }`}
              {...register('otp', {
                required: 'Verification OTP is required',
                minLength: {
                  value: 6,
                  message: 'OTP code must be 6 digits'
                },
                pattern: {
                  value: /^[0-9]+$/,
                  message: 'OTP must contain only digits'
                }
              })}
            />
            {errors.otp && (
              <p className="mt-1.5 text-xs text-red-400 font-medium flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.otp.message}
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
                Verifying account...
              </>
            ) : (
              'Verify Account'
            )}
          </button>
        </form>
      )}

      {/* Back to Login link */}
      {!successMsg && (
        <p className="mt-6 text-center text-sm text-slate-400">
          Already verified?{' '}
          <Link
            to="/login"
            className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
          >
            Sign in here
          </Link>
        </p>
      )}
    </div>
  );
};

export default VerifyEmail;
