'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, Home, Building2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../../hooks/useAuthStore';

const ROLE_OPTIONS = [
  { value: 'tenant', icon: User, title: 'Tenant', desc: 'I want to find & book properties' },
  { value: 'owner', icon: Building2, title: 'Property Owner', desc: 'I want to list & manage properties' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'tenant' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    console.info('DEBUG: Starting registration process...');
    console.info('DEBUG: Payload:', { ...form, password: '****' });
    try {
      const data = await register(form);
      console.info('DEBUG: Registration Success:', data);
      toast.success(`Account created! Welcome, ${data.user.name.split(' ')[0]}!`);
      router.push('/dashboard');
    } catch (err) {
      console.error('DEBUG: Registration Error Details:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status
      });
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-2 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-brand-600 font-bold text-xl font-display mb-6">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand">
              <Home size={18} className="text-white" />
            </div>
            RentEase
          </Link>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
          <p className="text-gray-500">Join thousands of happy renters and owners</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Role selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              {ROLE_OPTIONS.map(role => 
              
              (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: role.value })}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    form.role === role.value
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-brand-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                    form.role === role.value ? 'bg-brand-gradient' : 'bg-gray-100'
                  }`}>
                    <role.icon size={16} className={form.role === role.value ? 'text-white' : 'text-gray-500'} />
                  </div>
                  <p className={`font-semibold text-sm ${form.role === role.value ? 'text-brand-700' : 'text-gray-700'}`}>{role.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{role.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" required value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="John Doe" className="input-field pl-10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210" className="input-field pl-10" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" required value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com" className="input-field pl-10" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPass ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 8 characters" className="input-field pl-10 pr-11" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password && (
                <div className="flex gap-1 mt-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                      form.password.length > i * 3 ? (form.password.length >= 12 ? 'bg-emerald-400' : 'bg-brand-400') : 'bg-gray-200'
                    }`} />
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3.5 text-base mt-2 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">Create Account <ArrowRight size={16} /></span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 mt-5 text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-600 font-semibold hover:text-brand-700">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
