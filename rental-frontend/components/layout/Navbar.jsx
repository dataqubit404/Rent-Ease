'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Bell, Menu, X, ChevronDown, LogOut, User, Settings, LayoutDashboard } from 'lucide-react';
import useAuthStore from '../../hooks/useAuthStore';
import { notificationsAPI } from '../../services/api';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const isHero = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      notificationsAPI.getAll({ limit: 5 }).then(({ data }) => {
        setUnreadCount(data.unread_count);
        setNotifications(data.notifications);
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const dashboardLink = user?.role === 'admin' ? '/admin' : '/dashboard';
  const navLinks = [
    { href: '/properties', label: 'Explore' },
    ...(user?.role === 'owner' ? [{ href: '/dashboard/properties', label: 'My Properties' }] : []),
  ];

  const navBg = isHero
    ? scrolled ? 'glass-dark border-b border-white/10' : 'bg-transparent'
    : 'bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm';
  const textColor = isHero && !scrolled ? 'text-white' : 'text-gray-800';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="page-container">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-shadow">
              <Home size={18} className="text-white" />
            </div>
            <span className={`font-display font-bold text-xl tracking-tight ${textColor}`}>
              Rent<span className="gradient-text">Ease</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10 ${
                  pathname === link.href ? 'bg-white/15 font-semibold' : ''
                } ${textColor}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className={`relative p-2.5 rounded-xl transition-all hover:bg-white/10 ${textColor}`}
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        className="absolute right-0 top-12 w-80 glass-light rounded-2xl shadow-float overflow-hidden z-50"
                      >
                        <div className="p-4 border-b border-gray-100">
                          <p className="font-semibold text-gray-800">Notifications</p>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="text-center text-gray-400 py-8 text-sm">No notifications</p>
                          ) : notifications.map(n => (
                            <div key={n.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-brand-50' : ''}`}>
                              <p className="text-sm font-medium text-gray-800">{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            </div>
                          ))}
                        </div>
                        <Link href="/dashboard/notifications" className="block p-3 text-center text-sm text-brand-600 font-medium hover:bg-gray-50 transition-colors">
                          View all notifications
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/10 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center text-white font-semibold text-sm shadow-brand">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <span className={`text-sm font-medium hidden lg:block ${textColor}`}>{user?.name?.split(' ')[0]}</span>
                    <ChevronDown size={14} className={`${textColor} transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        className="absolute right-0 top-12 w-52 glass-light rounded-2xl shadow-float overflow-hidden z-50"
                      >
                        <div className="p-4 border-b border-gray-100">
                          <p className="font-semibold text-gray-800 text-sm">{user?.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5 capitalize">{user?.role}</p>
                        </div>
                        {[
                          { icon: LayoutDashboard, label: 'Dashboard', href: dashboardLink },
                          { icon: User, label: 'Profile', href: '/profile' },
                          { icon: Settings, label: 'Settings', href: '/settings' },
                        ].map(item => (
                          <Link key={item.href} href={item.href}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-brand-600 transition-colors"
                            onClick={() => setProfileOpen(false)}
                          >
                            <item.icon size={15} />
                            {item.label}
                          </Link>
                        ))}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
                        >
                          <LogOut size={15} />
                          Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className={`px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/10 ${textColor}`}>
                  Sign in
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm px-5 py-2.5">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className={`md:hidden p-2 rounded-lg ${textColor}`}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-dark border-t border-white/10"
          >
            <div className="page-container py-4 flex flex-col gap-2">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-xl text-white/90 font-medium hover:bg-white/10 transition-colors"
                >{link.label}</Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link href={dashboardLink} onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-white/90 font-medium hover:bg-white/10 transition-colors"
                  >Dashboard</Link>
                  <button onClick={handleLogout} className="px-4 py-3 rounded-xl text-red-300 font-medium text-left hover:bg-white/10 transition-colors">
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-xl border border-white/20 text-white text-sm font-medium"
                  >Sign in</Link>
                  <Link href="/auth/register" onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-medium shadow-brand"
                  >Get Started</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
