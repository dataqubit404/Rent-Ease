'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, CreditCard, Home, Wrench, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { bookingsAPI, paymentsAPI, propertiesAPI, maintenanceAPI } from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';
import { formatCurrency, formatDate } from '../../utils/rentCalc';

const StatCard = ({ label, value, icon: Icon, color, sub, delay }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-float transition-all">
    <div className="flex items-start justify-between mb-4">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="font-display text-3xl font-bold text-gray-900 mb-1">{value}</p>
    {sub && <p className="text-xs text-gray-400">{sub}</p>}
  </motion.div>
);

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { color: 'bg-red-100 text-red-600', icon: AlertCircle },
  completed: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return; // Wait for auth hydration
    const fetchData = async () => {
      setLoading(true);
      try {
        const bookingRes = await bookingsAPI.getAll({ limit: 5 }).catch(() => ({ data: { bookings: [], pagination: { total: 0 } } }));
        setBookings(bookingRes.data.bookings || []);

        if (user?.role === 'owner') {
          const [earningsRes, propertiesRes] = await Promise.allSettled([
            paymentsAPI.getEarnings(),
            propertiesAPI.getMyProperties({ limit: 1 })
          ]);
          setStats({
            earnings: earningsRes.status === 'fulfilled' ? earningsRes.value.data.earnings : { total: 0, monthly: 0 },
            totalProperties: propertiesRes.status === 'fulfilled' ? propertiesRes.value.data.pagination.total : 0,
            totalBookings: bookingRes.data.pagination?.total || 0,
          });
        } else {
          setStats({ totalBookings: bookingRes.data.pagination?.total || 0 });
        }
      } catch (err) {
        console.error('Dashboard state failed to load', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const isOwner = user?.role === 'owner';
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">{greeting}, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your {isOwner ? 'properties' : 'rentals'}</p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {(isOwner ? [
            { label: 'Total Earnings', value: formatCurrency(stats?.earnings?.total || 0), icon: TrendingUp, color: 'bg-brand-gradient', sub: 'All time', delay: 0 },
            { label: 'This Month', value: formatCurrency(stats?.earnings?.monthly || 0), icon: CreditCard, color: 'bg-gradient-to-br from-emerald-400 to-teal-500', sub: 'Revenue', delay: 0.1 },
            { label: 'Properties', value: stats?.totalProperties || 0, icon: Home, color: 'bg-gradient-to-br from-violet-500 to-purple-600', sub: 'Listed', delay: 0.2 },
            { label: 'Bookings', value: stats?.totalBookings || 0, icon: Calendar, color: 'bg-gradient-to-br from-orange-400 to-red-500', sub: 'Total received', delay: 0.3 },
          ] : [
            { label: 'Total Bookings', value: stats?.totalBookings || 0, icon: Calendar, color: 'bg-brand-gradient', sub: 'All time', delay: 0 },
            { label: 'Active Bookings', value: bookings.filter(b => b.status === 'confirmed').length, icon: CheckCircle, color: 'bg-gradient-to-br from-emerald-400 to-teal-500', sub: 'Confirmed', delay: 0.1 },
            { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, icon: Clock, color: 'bg-gradient-to-br from-yellow-400 to-orange-500', sub: 'Awaiting confirmation', delay: 0.2 },
            { label: 'Maintenance', value: 0, icon: Wrench, color: 'bg-gradient-to-br from-slate-500 to-gray-600', sub: 'Open requests', delay: 0.3 },
          ]).map(s => <StatCard key={s.label} {...s} />)}
        </div>
      )}

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Recent Bookings</h2>
          <Link href="/dashboard/bookings" className="text-sm text-brand-600 font-medium hover:text-brand-700">View all →</Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No bookings yet</p>
            <Link href="/properties" className="btn-primary text-sm mt-4 inline-flex">Browse Properties</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bookings.map(booking => {
              const sc = statusConfig[booking.status] || statusConfig.pending;
              const StatusIcon = sc.icon;
              return (
                <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {booking.property?.images?.[0]
                      ? <img src={booking.property.images[0]} alt="" className="w-full h-full object-cover" />
                      : <Home size={20} className="m-3 text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{booking.property?.title}</p>
                    <p className="text-xs text-gray-400">{formatDate(booking.start_date)} – {formatDate(booking.end_date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-800 text-sm">₹{Number(booking.total_amount).toLocaleString()}</p>
                    <span className={`status-badge ${sc.color} mt-1`}>
                      <StatusIcon size={10} />
                      {booking.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions for owner */}
      {isOwner && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard/properties/new"
            className="flex items-center gap-4 p-5 bg-brand-gradient rounded-2xl text-white hover:shadow-brand-lg transition-all group">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Home size={22} />
            </div>
            <div>
              <p className="font-semibold">List a New Property</p>
              <p className="text-white/70 text-sm">Start earning from your property</p>
            </div>
          </Link>
          <Link href="/dashboard/maintenance"
            className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-float transition-all group">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <Wrench size={22} className="text-orange-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Maintenance Requests</p>
              <p className="text-gray-500 text-sm">Review open issues</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
