'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle, XCircle, MapPin, Calendar as CalendarIcon, User, CreditCard } from 'lucide-react';
import useAuthStore from '../../../../hooks/useAuthStore';
import { bookingsAPI, paymentsAPI } from '../../../../services/api';
import toast from 'react-hot-toast';

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    bookingsAPI.getById(id)
      .then(({ data }) => { setBooking(data.booking); setLoading(false); })
      .catch((err) => { toast.error('Failed to load booking'); router.push('/dashboard/bookings'); });
  }, [id, router]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(true);
    try {
      await bookingsAPI.updateStatus(id, { status: 'cancelled', cancellation_reason: 'User requested cancellation' });
      toast.success('Booking cancelled successfully');
      const { data } = await bookingsAPI.getById(id);
      setBooking(data.booking);
    } catch (err) {
      toast.error('Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const handleMockPayment = async (e) => {
    e.preventDefault();
    if (!/^\d{16}$/.test(cardNumber)) return toast.error('Please enter a valid 16-digit card number');
    setPaying(true);
    try {
      await paymentsAPI.mockPayment({ booking_id: id, card_number: cardNumber });
      toast.success('Payment successful! Booking confirmed.');
      setShowPaymentModal(false);
      const { data } = await bookingsAPI.getById(id);
      setBooking(data.booking);
    } catch(err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-10 w-32 rounded-xl mb-6" />
      <div className="skeleton h-48 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );

  if (!booking) return null;

  const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
    completed: 'bg-blue-100 text-blue-700',
    rejected: 'bg-gray-100 text-gray-600',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-3">
              Booking Details
              <span className={`text-[10px] px-3 py-1.5 rounded-full font-bold tracking-widest uppercase ${STATUS_COLORS[booking.status]}`}>
                {booking.status}
              </span>
            </h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
              ID: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{booking.id.split('-')[0]}</span>
            </p>
          </div>
        </div>
        
        {(user?.role === 'tenant' && (booking.status === 'pending' || booking.status === 'confirmed')) && (
          <button onClick={handleCancel} disabled={cancelling} className="btn-secondary text-red-600 hover:bg-red-50 hover:border-red-100 text-sm px-4 h-10">
            {cancelling ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 font-display flex items-center gap-2">
              <MapPin size={18} className="text-brand-500" /> Property Information
            </h2>
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="w-full sm:w-40 h-32 rounded-xl overflow-hidden shadow-inner bg-gray-100 shrink-0">
                <img src={booking.property?.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=400'} 
                  alt={booking.property?.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="font-semibold text-lg text-gray-900 object-cover">{booking.property?.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{booking.property?.location}</p>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-brand-50 rounded-xl p-3">
                    <span className="block text-[10px] uppercase font-bold text-brand-600 mb-1">Check-in</span>
                    <span className="font-semibold text-gray-900">{new Date(booking.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="bg-brand-50 rounded-xl p-3">
                    <span className="block text-[10px] uppercase font-bold text-brand-600 mb-1">Check-out</span>
                    <span className="font-semibold text-gray-900">{new Date(booking.end_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 font-display flex items-center gap-2">
              <User size={18} className="text-brand-500" /> {user?.role === 'owner' ? 'Guest Information' : 'Host Information'}
            </h2>
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-brand-gradient text-white flex items-center justify-center font-bold text-lg shadow-brand shrink-0">
                {(user?.role === 'owner' ? booking.tenant?.name?.[0] : booking.property?.owner?.name?.[0])?.toUpperCase() || '-'}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">{user?.role === 'owner' ? booking.tenant?.name : booking.property?.owner?.name}</p>
                <p className="text-sm text-gray-500">{user?.role === 'owner' ? booking.tenant?.email : booking.property?.owner?.email}</p>
              </div>
            </div>
          </div>
          
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 font-display flex items-center gap-2">
              <CreditCard size={18} className="text-brand-500" /> Payment Summary
            </h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rate ({booking.total_nights} nights)</span>
                <span className="font-medium text-gray-900">₹{(Number(booking.property?.price_per_night) * booking.total_nights).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Service Fee</span>
                <span className="font-medium text-gray-900">₹{(Number(booking.property?.price_per_night) * booking.total_nights * 0.12).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Taxes & GST</span>
                <span className="font-medium text-gray-900">₹{(Number(booking.property?.price_per_night) * booking.total_nights * 0.18).toLocaleString()}</span>
              </div>
              
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total Amount</span>
                <span className="font-display font-bold text-xl text-brand-600">₹{Number(booking.total_amount).toLocaleString()}</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
              booking.payment?.status === 'completed' ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'
            }`}>
              <div className="flex items-center gap-3">
                {booking.payment?.status === 'completed' ? (
                  <CheckCircle size={20} className="text-green-600 shrink-0" />
                ) : (
                  <Clock size={20} className="text-yellow-600 shrink-0" />
                )}
                <div>
                  <p className={`text-sm font-bold ${booking.payment?.status === 'completed' ? 'text-green-800' : 'text-yellow-800'}`}>
                    {booking.payment?.status === 'completed' ? 'Payment Completed' : 'Payment Pending'}
                  </p>
                  <p className={`text-xs ${booking.payment?.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {booking.payment?.status === 'completed' ? `Paid on ${new Date(booking.payment.paid_at).toLocaleDateString()}` : 'Awaiting payment from guest'}
                  </p>
                </div>
              </div>

              {user?.role === 'tenant' && booking.status !== 'cancelled' && booking.payment?.status !== 'completed' && (
                <button onClick={() => setShowPaymentModal(true)} className="btn-primary py-2 px-4 shadow-sm text-sm shrink-0 whitespace-nowrap">
                  Pay Now
                </button>
              )}
            </div>
            
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-float">
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
              <p className="text-gray-500 text-sm mb-6">Enter a 16-digit mock card number to securely finalize your reservation.</p>
              
              <div className="bg-brand-50 rounded-xl p-4 mb-6 flex justify-between items-center">
                <span className="font-medium text-brand-800">Total Due</span>
                <span className="font-bold text-xl text-brand-600">₹{Number(booking.total_amount).toLocaleString()}</span>
              </div>

              <form onSubmit={handleMockPayment}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number (16 Digits)</label>
                <input type="text" maxLength={16} required value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, ''))}
                  className="input-field mb-6 text-lg tracking-widest font-mono" placeholder="1234 5678 9012 3456" />
                
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowPaymentModal(false)}
                    className="btn-secondary flex-1 py-3">Cancel</button>
                  <button type="submit" disabled={paying} className="btn-primary flex-1 py-3 disabled:opacity-50">
                    {paying ? 'Processing...' : `Pay ₹${Number(booking.total_amount).toLocaleString()}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
