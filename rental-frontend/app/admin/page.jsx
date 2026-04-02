'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users, Home, Calendar, CreditCard, BarChart2, CheckCircle,
  XCircle, Clock, Shield, LogOut, Search, ChevronRight, Eye,
  TrendingUp, AlertCircle, IndianRupee, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usersAPI, propertiesAPI, bookingsAPI, adminAPI } from '../../services/api';
import useAuthStore from '../../hooks/useAuthStore';
import { formatCurrency, formatDate } from '../../utils/rentCalc';

const NAV_ITEMS = [
  { id: 'overview', icon: BarChart2, label: 'Overview' },
  { id: 'users', icon: Users, label: 'Users' },
  { id: 'properties', icon: Home, label: 'Properties' },
  { id: 'bookings', icon: Calendar, label: 'Bookings' },
  { id: 'payments', icon: CreditCard, label: 'Payments' },
];

// ── Sub-views ─────────────────────────────────────────────────────────────────

function Overview({ stats }) {
  if (!stats) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" style={{ background: 'rgba(255,255,255,0.1)' }} />)}</div>;
  const cards = [
    { label: 'Total Users', value: stats.users.total, sub: `${stats.users.tenants} tenants · ${stats.users.owners} owners · ${stats.users.admins} admins`, icon: Users, color: 'from-brand-500 to-brand-700' },
    { label: 'Total Properties', value: stats.properties.total, sub: `${stats.properties.pending} pending approval`, icon: Home, color: 'from-violet-500 to-purple-700' },
    { label: 'Total Bookings', value: stats.bookings.total, sub: `${stats.bookings.confirmed} confirmed · ${stats.bookings.pending} pending`, icon: Calendar, color: 'from-emerald-500 to-teal-600' },
    { label: 'Platform Revenue', value: formatCurrency(stats.revenue?.total || 0), sub: `${formatCurrency(stats.revenue?.monthly || 0)} this month`, icon: TrendingUp, color: 'from-orange-400 to-red-500' },
  ];
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-white mb-5">Platform Overview</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5">
            <div className="flex justify-between items-start mb-3">
              <p className="text-white/70 text-sm font-medium">{c.label}</p>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                <c.icon size={16} className="text-white" />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-white mb-0.5">{c.value}</p>
            <p className="text-white/50 text-xs">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      {stats.properties.pending > 0 && (
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-yellow-400 shrink-0" />
          <div className="flex-1">
            <p className="text-yellow-200 font-medium text-sm">{stats.properties.pending} properties awaiting approval</p>
            <p className="text-yellow-300/50 text-xs">Switch to Properties tab to review</p>
          </div>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    usersAPI.getAll({ search, role: roleFilter, limit: 20 }).then(({ data }) => {
      setUsers(data.users);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [search, roleFilter]);

  const toggleActive = async (user) => {
    try {
      await usersAPI.update(user.id, { is_active: !user.is_active });
      toast.success(`User ${!user.is_active ? 'activated' : 'deactivated'}`);
      setUsers(u => u.map(x => x.id === user.id ? { ...x, is_active: !x.is_active } : x));
    } catch { toast.error('Update failed'); }
  };

  const ROLE_COLORS = { admin: 'bg-red-100 text-red-700', owner: 'bg-violet-100 text-violet-700', tenant: 'bg-brand-100 text-brand-700' };

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
            className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-white/40 outline-none focus:border-white/40 text-sm" />
        </div>
        {['', 'tenant', 'owner', 'admin'].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${roleFilter === r ? 'bg-white text-gray-800' : 'bg-white/10 text-white/70 hover:bg-white/15'}`}>
            {r || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }} />)}</div>
      ) : (
        <div className="space-y-2">
          {users.map((user, i) => (
            <motion.div key={user.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 bg-white/8 border border-white/10 rounded-xl p-3.5 hover:bg-white/12 transition-all">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{user.name}</p>
                <p className="text-white/50 text-xs truncate">{user.email}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ROLE_COLORS[user.role]}`}>{user.role}</span>
              <button onClick={() => toggleActive(user)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${user.is_active ? 'bg-green-400/20 text-green-400 hover:bg-red-400/20 hover:text-red-400' : 'bg-red-400/20 text-red-400 hover:bg-green-400/20 hover:text-green-400'}`}>
                {user.is_active ? <CheckCircle size={15} /> : <XCircle size={15} />}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertiesTab() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = { limit: 20 };
      if (filter !== '') params.is_approved = filter;
      const { data } = await propertiesAPI.getAdminAll(params);
      setProperties(data.properties);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchProperties(); }, [filter]);

  const handleApprove = async (id, approve) => {
    try {
      await propertiesAPI.approve(id, approve);
      toast.success(`Property ${approve ? 'approved' : 'rejected'}`);
      fetchProperties();
    } catch { toast.error('Action failed'); }
  };

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {[{ v: '', l: 'All' }, { v: 'false', l: '⏳ Pending' }, { v: 'true', l: '✓ Approved' }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${filter === f.v ? 'bg-white text-gray-800' : 'bg-white/10 text-white/70 hover:bg-white/15'}`}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }} />)}</div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <Home size={36} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/50 text-sm">No properties found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {properties.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 bg-white/8 border border-white/10 rounded-xl p-3.5">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 shrink-0">
                {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : <Home size={20} className="m-3 text-white/30" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{p.title}</p>
                <p className="text-white/50 text-xs">
                  {p.city} · {p.listing_type === 'long_term' ? `${formatCurrency(p.monthly_rent)}/mo` : `${formatCurrency(p.price_per_night)}/night`} · by {p.owner?.name}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {!p.is_approved && (
                  <>
                    <button onClick={() => handleApprove(p.id, true)}
                      className="px-2.5 py-1.5 rounded-lg bg-green-400/20 text-green-300 text-xs font-medium hover:bg-green-400/30 transition-colors flex items-center gap-1">
                      <CheckCircle size={12} /> Approve
                    </button>
                    <button onClick={() => handleApprove(p.id, false)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-400/20 text-red-300 text-xs font-medium hover:bg-red-400/30 transition-colors flex items-center gap-1">
                      <XCircle size={12} /> Reject
                    </button>
                  </>
                )}
                {p.is_approved && (
                  <span className="px-2.5 py-1.5 rounded-lg bg-green-400/15 text-green-300 text-xs font-medium flex items-center gap-1">
                    <CheckCircle size={12} /> Live
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function BookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const STATUS_COLORS = {
    pending: 'text-yellow-300', confirmed: 'text-green-300',
    cancelled: 'text-red-300', completed: 'text-blue-300', rejected: 'text-gray-400',
  };

  useEffect(() => {
    setLoading(true);
    const params = { limit: 20 };
    if (statusFilter) params.status = statusFilter;
    bookingsAPI.getAll(params).then(({ data }) => { setBookings(data.bookings); setLoading(false); }).catch(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {['', 'pending', 'confirmed', 'cancelled', 'completed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${statusFilter === s ? 'bg-white text-gray-800' : 'bg-white/10 text-white/70 hover:bg-white/15'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }} />)}</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar size={36} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/50 text-sm">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 bg-white/8 border border-white/10 rounded-xl p-3.5">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{b.property?.title || 'Property'}</p>
                <p className="text-white/50 text-xs">{b.tenant?.name} · {formatDate(b.start_date)} → {formatDate(b.end_date)}</p>
              </div>
              <span className={`text-xs font-semibold capitalize ${STATUS_COLORS[b.status] || 'text-white/60'}`}>{b.status}</span>
              {b.payment_plan === 'monthly' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-400/20 text-violet-300 font-medium">Monthly</span>
              )}
              <span className="text-white font-bold text-sm">{formatCurrency(b.total_amount)}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const STATUS_ICONS = {
    completed: { color: 'bg-green-400/20 text-green-300', icon: CheckCircle },
    pending: { color: 'bg-yellow-400/20 text-yellow-300', icon: Clock },
    processing: { color: 'bg-blue-400/20 text-blue-300', icon: RefreshCw },
    failed: { color: 'bg-red-400/20 text-red-300', icon: XCircle },
    refunded: { color: 'bg-gray-400/20 text-gray-300', icon: RefreshCw },
  };

  useEffect(() => {
    setLoading(true);
    const params = { limit: 20 };
    if (statusFilter) params.status = statusFilter;
    adminAPI.getPayments(params).then(({ data }) => {
      setPayments(data.payments);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {['', 'completed', 'pending', 'processing', 'failed', 'refunded'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${statusFilter === s ? 'bg-white text-gray-800' : 'bg-white/10 text-white/70 hover:bg-white/15'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }} />)}</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard size={36} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/50 text-sm">No payments found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((p, i) => {
            const sc = STATUS_ICONS[p.status] || STATUS_ICONS.pending;
            const StatusIcon = sc.icon;
            return (
              <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 bg-white/8 border border-white/10 rounded-xl p-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${sc.color}`}>
                  <StatusIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{p.booking?.property?.title || 'Property'}</p>
                  <div className="flex gap-2 items-center">
                    <p className="text-white/50 text-xs">{p.booking?.tenant?.name}</p>
                    {p.installment_number && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-400/15 text-violet-300">
                        Installment #{p.installment_number}
                      </span>
                    )}
                    {p.due_date && <p className="text-white/40 text-xs">Due: {formatDate(p.due_date)}</p>}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${sc.color}`}>{p.status}</span>
                <span className="text-white font-bold text-sm">{formatCurrency(p.amount)}</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Admin Shell ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, isAuthenticated, isLoading, logout, init } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);

  useEffect(() => { init(); }, []);
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || user?.role !== 'admin') { router.push('/auth/login'); }
    }
  }, [isLoading, isAuthenticated, user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      adminAPI.getStats().then(({ data }) => {
        setStats(data.stats);
      }).catch(() => {});
    }
  }, [user]);

  if (isLoading || !user) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white/5 border-r border-white/10 flex flex-col fixed top-0 bottom-0 left-0 z-40">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-brand">
            <Shield size={15} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm font-display">RentEase</p>
            <p className="text-white/40 text-[10px]">Admin Panel</p>
          </div>
        </div>

        <div className="px-3 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/8">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-sm">{user.name?.[0]}</div>
            <div>
              <p className="text-white text-xs font-semibold truncate">{user.name}</p>
              <p className="text-red-400 text-[10px]">Administrator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all ${activeTab === item.id ? 'bg-white/15 text-white' : 'text-white/50 hover:bg-white/8 hover:text-white/80'}`}>
              <item.icon size={16} />
              {item.label}
              {activeTab === item.id && <ChevronRight size={13} className="ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button onClick={() => { logout(); router.push('/'); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-400/10 transition-all">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-56 p-8">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === 'overview' && <Overview stats={stats} />}
          {activeTab === 'users' && (
            <div>
              <h2 className="font-display text-xl font-bold text-white mb-5">User Management</h2>
              <UsersTab />
            </div>
          )}
          {activeTab === 'properties' && (
            <div>
              <h2 className="font-display text-xl font-bold text-white mb-5">Property Management</h2>
              <PropertiesTab />
            </div>
          )}
          {activeTab === 'bookings' && (
            <div>
              <h2 className="font-display text-xl font-bold text-white mb-5">Booking Management</h2>
              <BookingsTab />
            </div>
          )}
          {activeTab === 'payments' && (
            <div>
              <h2 className="font-display text-xl font-bold text-white mb-5">Payment Management</h2>
              <PaymentsTab />
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
