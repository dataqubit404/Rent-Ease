'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, AlertCircle, XCircle, Home, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingsAPI } from '../../../services/api';
import { formatDate, formatCurrency } from '../../../utils/rentCalc';

const STATUS_CONFIG = {
  pending:   { color: 'bg-yellow-100 text-yellow-700',  icon: Clock,        label: 'Pending' },
  confirmed: { color: 'bg-green-100 text-green-700',    icon: CheckCircle,  label: 'Confirmed' },
  cancelled: { color: 'bg-red-100 text-red-600',        icon: XCircle,      label: 'Cancelled' },
  completed: { color: 'bg-blue-100 text-blue-700',      icon: CheckCircle,  label: 'Completed' },
  rejected:  { color: 'bg-gray-100 text-gray-600',      icon: AlertCircle,  label: 'Rejected' },
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filter) params.status = filter;
      const { data } = await bookingsAPI.getAll(params);
      setBookings(data.bookings);
      setTotal(data.pagination.total);
    } catch { toast.error('Failed to load bookings'); }
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [filter, page]);

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await bookingsAPI.updateStatus(bookingId, { status });
      toast.success(`Booking ${status}`);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total bookings</p>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[{ value: '', label: 'All' }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))].map(f => (
          <button key={f.value} onClick={() => { setFilter(f.value); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.value ? 'bg-brand-gradient text-white shadow-brand' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'}`}
          >{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Calendar size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">No bookings found</h3>
          <p className="text-gray-400 text-sm">Try a different filter or browse properties</p>
          <Link href="/properties" className="btn-primary text-sm mt-4 inline-flex">Explore Properties</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking, i) => {
            const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
            const StatusIcon = sc.icon;
            return (
              <motion.div key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-float transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {booking.property?.images?.[0]
                      ? <img src={booking.property.images[0]} alt="" className="w-full h-full object-cover" />
                      : <Home size={24} className="m-5 text-gray-300" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <Link href={`/dashboard/bookings/${booking.id}`}
                        className="font-semibold text-gray-800 hover:text-brand-600 transition-colors truncate">
                        {booking.property?.title || 'Property'}
                      </Link>
                      <span className={`status-badge ${sc.color} shrink-0`}>
                        <StatusIcon size={11} />
                        {sc.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar size={13} />
                        {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
                        <span className="text-gray-400">({booking.total_nights} nights)</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      <p className="font-bold text-brand-600">{formatCurrency(booking.total_amount)}</p>
                      <div className="flex gap-2">
                        {booking.status === 'pending' && (
                          <button onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors font-medium">
                            Cancel
                          </button>
                        )}
                        <Link href={`/dashboard/bookings/${booking.id}`}
                          className="text-xs px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors font-medium">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 10 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: Math.min(Math.ceil(total / 10), 6) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-xl font-medium text-sm transition-all ${page === p ? 'bg-brand-gradient text-white shadow-brand' : 'bg-white text-gray-600 border border-gray-200'}`}
            >{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
