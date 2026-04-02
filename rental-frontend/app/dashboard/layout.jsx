'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Home, Calendar, CreditCard, Wrench, Star, Bell, LogOut, ChevronRight, User } from 'lucide-react';
import useAuthStore from '../../hooks/useAuthStore';

const TENANT_NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/bookings', icon: Calendar, label: 'My Bookings' },
  { href: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
  { href: '/dashboard/maintenance', icon: Wrench, label: 'Maintenance' },
  { href: '/dashboard/reviews', icon: Star, label: 'My Reviews' },
  { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
];

const OWNER_NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/properties', icon: Home, label: 'My Properties' },
  { href: '/dashboard/bookings', icon: Calendar, label: 'Bookings' },
  { href: '/dashboard/payments', icon: CreditCard, label: 'Earnings' },
  { href: '/dashboard/maintenance', icon: Wrench, label: 'Maintenance' },
  { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
];

export default function DashboardLayout({ children }) {
  const { user, isAuthenticated, isLoading, logout, init } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { init(); }, []);
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth/login');
  }, [isLoading, isAuthenticated]);

  if (isLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const navItems = user.role === 'owner' ? OWNER_NAV : TENANT_NAV;

  return (
    <div className="flex min-h-screen bg-surface-2">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed top-0 bottom-0 left-0 z-40">
        <Link href="/" className="flex items-center gap-2.5 px-6 py-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-brand">
            <Home size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-gray-900">RentEase</span>
        </Link>

        {/* User info */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-50">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center text-white font-bold shadow-brand">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-gray-800 text-sm truncate">{user.name}</p>
              <p className="text-xs text-brand-600 font-medium capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-3">Menu</p>
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-gradient text-white shadow-brand'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon size={17} />
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">
            <User size={17} /> Profile
          </Link>
          <button onClick={() => { logout(); router.push('/'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={17} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
