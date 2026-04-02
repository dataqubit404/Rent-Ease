'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Trash2, Calendar, CreditCard, Wrench, Star, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationsAPI } from '../../../services/api';
import { formatDate } from '../../../utils/rentCalc';

const TYPE_CONFIG = {
  booking_confirmed:  { icon: Calendar,    color: 'bg-green-100 text-green-600' },
  booking_cancelled:  { icon: Calendar,    color: 'bg-red-100 text-red-500' },
  booking_pending:    { icon: Calendar,    color: 'bg-yellow-100 text-yellow-600' },
  payment_received:   { icon: CreditCard,  color: 'bg-emerald-100 text-emerald-600' },
  payment_failed:     { icon: CreditCard,  color: 'bg-red-100 text-red-500' },
  maintenance_update: { icon: Wrench,      color: 'bg-orange-100 text-orange-600' },
  review_received:    { icon: Star,        color: 'bg-violet-100 text-violet-600' },
  general:            { icon: Info,        color: 'bg-brand-100 text-brand-600' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await notificationsAPI.getAll({ limit: 50 });
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(n => n.map(x => ({ ...x, is_read: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch {}
  };

  const deleteNotif = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(n => n.filter(x => x.id !== id));
    } catch {}
  };

  const markRead = async (id) => {
    await notificationsAPI.markRead(id);
    setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            Notifications
            {unreadCount > 0 && <span className="bg-brand-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{unreadCount}</span>}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{notifications.length} total notifications</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-ghost text-sm flex items-center gap-1.5">
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <Bell size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">No notifications yet</p>
          <p className="text-gray-400 text-sm mt-1">You'll see booking updates, payments, and more here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
            const Icon = tc.icon;
            return (
              <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${n.is_read ? 'bg-white border-gray-100 hover:bg-gray-50' : 'bg-brand-50 border-brand-100 hover:bg-brand-100/50'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tc.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1.5">{formatDate(n.createdAt)}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                  className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400 transition-all shrink-0">
                  <Trash2 size={14} />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
