'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSubmitted(true);
      toast.success('Reset link sent if account exists!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-2">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-brand-900/5 p-8 border border-gray-100"
      >
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 text-brand-600 font-bold text-2xl font-display">
            <Home size={24} /> RentEase
          </Link>
        </div>

        {!submitted ? (
          <>
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
            <p className="text-gray-500 mb-8 leading-relaxed">
              No problem! Just enter your email and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Email address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-12 py-3.5"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-base font-semibold shadow-lg shadow-brand-500/20 disabled:opacity-70 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending link...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">Send Reset Link <Send size={18} /></span>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail size={32} />
            </div>
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-3">Check your inbox</h1>
            <p className="text-gray-500 mb-8 leading-relaxed">
              We've sent a password reset link to <strong>{email}</strong>. Please check your spam folder if you don't see it.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-brand-600 font-semibold hover:text-brand-700 transition-colors"
            >
              Didn't receive it? Try again
            </button>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-gray-100 flex justify-center">
          <Link href="/auth/login" className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 transition-colors font-medium">
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
