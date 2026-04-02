'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Eye, EyeOff, Home, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../../services/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // If no token, redirect to forgot password
  if (!token) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h1>
        <p className="text-gray-500 mb-8">The link you followed is invalid or has expired.</p>
        <Link href="/auth/forgot-password" title="Go back to forgot password page" className="btn-primary">
          Request a new link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password: form.password });
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed. link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">All set!</h1>
        <p className="text-gray-600 mb-8 max-w-sm mx-auto">
          Your password has been reset successfully. You’ll be redirected to login in a few seconds.
        </p>
        <Link href="/auth/login" title="Redirect to login page" className="btn-primary w-full flex items-center justify-center gap-2">
          Sign In Now <ArrowRight size={18} />
        </Link>
      </motion.div>
    );
  }

  return (
    <>
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Set New Password</h1>
      <p className="text-gray-500 mb-8">Choose a strong password to secure your account.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 text-left">New Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Min 8 characters"
              className="input-field pl-12 pr-12 py-3.5"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              title={showPass ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 text-left">Confirm New Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Repeat your new password"
              className="input-field pl-12 py-3.5"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4 text-base font-semibold shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all disabled:opacity-70"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Updating...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">Reset Password <ArrowRight size={18} /></span>
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-2 text-center">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-brand-900/5 p-8 border border-gray-100"
      >
        <div className="flex justify-center mb-8">
          <Link href="/" title="Go back to homepage" className="flex items-center gap-2 text-brand-600 font-bold text-2xl font-display">
            <Home size={24} /> RentEase
          </Link>
        </div>

        <Suspense fallback={<div className="animate-pulse text-gray-500 font-medium">Loading form...</div>}>
          <ResetPasswordForm />
        </Suspense>

        <div className="mt-8 pt-8 border-t border-gray-100 flex justify-center items-center gap-4 text-sm text-gray-500">
          <Link href="/auth/login" title="Navigate to login page" className="hover:text-brand-600 transition-colors font-medium">Sign In</Link>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <Link href="/auth/register" title="Navigate to register page" className="hover:text-brand-600 transition-colors font-medium">Create Account</Link>
        </div>
      </motion.div>
    </div>
  );
}
