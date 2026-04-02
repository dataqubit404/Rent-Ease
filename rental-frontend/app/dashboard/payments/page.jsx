'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, TrendingUp, CheckCircle, Clock, XCircle, Download, RefreshCw, X, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentsAPI, bookingsAPI } from '../../../services/api';
import useAuthStore from '../../../hooks/useAuthStore';
import { formatCurrency, formatDate } from '../../../utils/rentCalc';

const STATUS_CONFIG = {
  completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending:   { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { color: 'bg-blue-100 text-blue-700', icon: RefreshCw },
  failed:    { color: 'bg-red-100 text-red-600', icon: XCircle },
  refunded:  { color: 'bg-gray-100 text-gray-600', icon: RefreshCw },
};

// ── Razorpay Integration ───────────────────────────────────────────────────
function RazorpayButton({ bookingId, paymentId, amount, installmentNumber, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      // 1. Create Order on Backend
      const orderPayload = { booking_id: bookingId };
      if (paymentId) orderPayload.payment_id = paymentId;
      const { data: orderData } = await paymentsAPI.createOrder(orderPayload);

      // 2. Configure Razorpay Options
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'RentEase',
        description: installmentNumber
          ? `Rent Installment #${installmentNumber} — ${orderData.property_title}`
          : `Payment for ${orderData.property_title}`,
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            // 3. Verify Payment on Backend
            await paymentsAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: bookingId
            });
            toast.success(installmentNumber
              ? `Installment #${installmentNumber} paid successfully!`
              : 'Payment successful! Booking confirmed.'
            );
            onSuccess();
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: orderData.user_name,
          email: orderData.user_email,
          contact: orderData.user_contact,
        },
        theme: { color: '#6172f0' },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to initialize payment');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-brand-50 rounded-xl p-6 text-center">
        {installmentNumber && (
          <p className="text-brand-500 text-xs font-semibold mb-1">INSTALLMENT #{installmentNumber}</p>
        )}
        <p className="text-gray-600 font-medium mb-1">Amount to pay</p>
        <p className="font-bold text-brand-600 text-3xl">{formatCurrency(amount)}</p>
        {installmentNumber && (
          <p className="text-gray-400 text-xs mt-1">Monthly rent payment</p>
        )}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
        <button onClick={handlePay} disabled={loading}
          className="btn-primary flex-1 disabled:opacity-60 py-3">
          {loading ? 'Initializing...' : 'Pay with Razorpay'}
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Secured by Razorpay · 256-bit Encryption
      </div>
    </div>
  );
}

// ── Main Payment Page ─────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [dueInstallments, setDueInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null); // { bookingId, paymentId, amount, installmentNumber }
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const isOwner = user?.role === 'owner';

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filterStatus) params.status = filterStatus;
      const [payRes] = await Promise.all([paymentsAPI.getAll(params)]);
      setPayments(payRes.data.payments);
      setTotal(payRes.data.pagination.total);

      if (isOwner) {
        const earnRes = await paymentsAPI.getEarnings();
        setEarnings(earnRes.data.earnings);
      } else {
        // Fetch pending bookings (first-time payments)
        const bookRes = await bookingsAPI.getAll({ status: 'pending', limit: 10 });
        const unpaid = bookRes.data.bookings.filter(b => {
          const payments = b.payments || [];
          return payments.length === 0 || !payments.some(p => p.status === 'completed');
        });
        setPendingBookings(unpaid);

        // Fetch all payments to find due installments
        const allPayRes = await paymentsAPI.getAll({ status: 'pending', limit: 20 });
        const installments = allPayRes.data.payments.filter(p => p.installment_number && p.installment_number > 0);
        setDueInstallments(installments);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filterStatus, page]);

  const handlePaySuccess = () => {
    setPayModal(null);
    fetchData();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">{isOwner ? 'Earnings' : 'Payments'}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{isOwner ? 'Track your rental income' : 'View payment history and pay pending bookings'}</p>
      </div>

      {isOwner && earnings && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Earnings', value: formatCurrency(earnings.total), icon: TrendingUp, gradient: 'from-brand-500 to-brand-700' },
            { label: 'This Month', value: formatCurrency(earnings.monthly), icon: CreditCard, gradient: 'from-emerald-500 to-teal-600' },
            { label: 'Completed Bookings', value: earnings.total_completed_bookings, icon: CheckCircle, gradient: 'from-violet-500 to-purple-600' },
            { label: 'This Month Bookings', value: earnings.monthly_bookings, icon: TrendingUp, gradient: 'from-orange-400 to-red-500' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-float transition-all">
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow`}>
                  <s.icon size={16} className="text-white" />
                </div>
              </div>
              <p className="font-display text-2xl font-bold text-gray-900">{s.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pending first-time payments (new bookings) */}
      {!isOwner && pendingBookings.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock size={17} className="text-yellow-500" />
            Awaiting Payment ({pendingBookings.length})
          </h2>
          <div className="space-y-3">
            {pendingBookings.map(booking => {
              const pendingPayment = (booking.payments || []).find(p => p.status === 'pending');
              const payAmount = pendingPayment ? pendingPayment.amount : booking.total_amount;
              const isMonthly = booking.payment_plan === 'monthly';
              return (
                <div key={booking.id} className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {booking.property?.images?.[0]
                      ? <img src={booking.property.images[0]} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-yellow-101" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{booking.property?.title}</p>
                    <p className="text-xs text-gray-500">{formatDate(booking.start_date)} → {formatDate(booking.end_date)}</p>
                    {isMonthly && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 font-medium mt-1 inline-block">
                        Monthly Plan · 1st installment
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-800 text-sm">{formatCurrency(payAmount)}</p>
                    {isMonthly && (
                      <p className="text-[10px] text-gray-400">Total: {formatCurrency(booking.total_amount)}</p>
                    )}
                    <button
                      onClick={() => setPayModal({
                        bookingId: booking.id,
                        paymentId: pendingPayment?.id,
                        amount: payAmount,
                        installmentNumber: isMonthly ? 1 : null
                      })}
                      className="btn-primary text-xs px-3 py-1.5 mt-1">
                      Pay Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Due rent installments */}
      {!isOwner && dueInstallments.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CalendarDays size={17} className="text-violet-500" />
            Rent Due ({dueInstallments.length})
          </h2>
          <div className="space-y-3">
            {dueInstallments.map(payment => {
              const isOverdue = payment.due_date && new Date(payment.due_date) < new Date();
              return (
                <div key={payment.id}
                  className={`${isOverdue ? 'bg-red-50 border-red-200' : 'bg-violet-50 border-violet-200'} border rounded-2xl p-4 flex items-center gap-4`}>
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {payment.booking?.property?.images?.[0]
                      ? <img src={payment.booking.property.images[0]} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-violet-100" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{payment.booking?.property?.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 font-medium">
                        Installment #{payment.installment_number}
                      </span>
                      {payment.due_date && (
                        <span className={`text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                          {isOverdue ? 'Overdue · ' : 'Due: '}{formatDate(payment.due_date)}
                        </span>
                      )}
                    </div>
                    {payment.billing_period_start && payment.billing_period_end && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Period: {formatDate(payment.billing_period_start)} → {formatDate(payment.billing_period_end)}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-800 text-sm">{formatCurrency(payment.amount)}</p>
                    <button
                      onClick={() => setPayModal({
                        bookingId: payment.booking_id || payment.booking?.id,
                        paymentId: payment.id,
                        amount: payment.amount,
                        installmentNumber: payment.installment_number
                      })}
                      className={`text-xs px-3 py-1.5 mt-1 rounded-lg font-semibold ${isOverdue ? 'bg-red-500 text-white hover:bg-red-600' : 'btn-primary'}`}>
                      {isOverdue ? 'Pay Overdue' : 'Pay Rent'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Payment History</h2>
          <div className="flex gap-2">
            {['', 'completed', 'pending', 'failed', 'refunded'].map(s => (
              <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === s ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500">No payment records found</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {payments.map((payment, i) => {
                const sc = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
                const StatusIcon = sc.icon;
                return (
                  <motion.div key={payment.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sc.color}`}>
                      <StatusIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">
                        {payment.booking?.property?.title || 'Property Booking'}
                      </p>
                      <div className="flex gap-3 mt-0.5 items-center">
                        <p className="text-xs text-gray-400">{payment.paid_at ? formatDate(payment.paid_at) : formatDate(payment.createdAt)}</p>
                        {payment.installment_number && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 font-medium">
                            #{payment.installment_number}
                          </span>
                        )}
                        {payment.billing_period_start && payment.billing_period_end && (
                          <p className="text-[10px] text-gray-300">
                            {formatDate(payment.billing_period_start)} → {formatDate(payment.billing_period_end)}
                          </p>
                        )}
                        {payment.transaction_id && (
                          <p className="text-xs text-gray-400 font-mono truncate max-w-[140px]">#{payment.transaction_id.slice(-8)}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                      <span className={`status-badge ${sc.color} mt-1 text-[10px]`}>
                        {payment.status}
                      </span>
                    </div>
                    <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                      <Download size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
            {total > 10 && (
              <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
                {Array.from({ length: Math.min(Math.ceil(total / 10), 6) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${page === p ? 'bg-brand-gradient text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {payModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPayModal(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-float">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="font-display text-xl font-bold text-gray-900">
                    {payModal.installmentNumber ? 'Pay Rent' : 'Secure Payment'}
                  </h2>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {payModal.installmentNumber
                      ? `Monthly installment #${payModal.installmentNumber}`
                      : 'Checkout via Razorpay'
                    }
                  </p>
                </div>
                <button onClick={() => setPayModal(null)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <X size={16} />
                </button>
              </div>
              
              <RazorpayButton
                bookingId={payModal.bookingId}
                paymentId={payModal.paymentId}
                amount={payModal.amount}
                installmentNumber={payModal.installmentNumber}
                onSuccess={handlePaySuccess}
                onClose={() => setPayModal(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
