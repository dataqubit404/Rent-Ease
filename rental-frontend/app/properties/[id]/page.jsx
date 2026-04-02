'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Bed, Bath, Users, Wifi, Car, Wind, ChefHat, ArrowLeft, ChevronLeft, ChevronRight, Calendar, Shield, CreditCard, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { propertiesAPI, bookingsAPI, paymentsAPI } from '../../../services/api';
import { calculateRentClient, formatCurrency } from '../../../utils/rentCalc';
import useAuthStore from '../../../hooks/useAuthStore';

const AMENITY_ICONS = { wifi: Wifi, parking: Car, ac: Wind, kitchen: ChefHat };

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [booking, setBooking] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState('full'); // 'full' or 'monthly'
  const [rentDueDay, setRentDueDay] = useState(1);
  const [rentBreakdown, setRentBreakdown] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    propertiesAPI.getById(id).then(({ data }) => {
      setProperty(data.property);
      setLoading(false);
    }).catch(() => { toast.error('Property not found'); router.push('/properties'); });
  }, [id]);

  useEffect(() => {
    if (startDate && endDate && property) {
      const price = property.listing_type === 'long_term' ? property.monthly_rent : property.price_per_night;
      const breakdown = calculateRentClient(startDate, endDate, price, property.listing_type);
      setRentBreakdown(breakdown);
    } else {
      setRentBreakdown(null);
    }
  }, [startDate, endDate, property]);

  const handleBook = async () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (!startDate || !endDate) { toast.error('Please select dates'); return; }
    
    setBooking(true);
    try {
      const bookingPayload = { 
        property_id: id, 
        start_date: startDate, 
        end_date: endDate, 
        guests,
        payment_plan: property.listing_type === 'long_term' ? paymentPlan : 'full'
      };
      if (property.listing_type === 'long_term' && paymentPlan === 'monthly') {
        bookingPayload.rent_due_day = rentDueDay;
      }
      const { data } = await bookingsAPI.create(bookingPayload);
      setCreatedBookingId(data.booking.id);
      setShowPaymentModal(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setPaying(true);
    try {
      // 1. Create Order on Backend
      const { data: orderData } = await paymentsAPI.createOrder({ booking_id: createdBookingId });

      // 2. Razorpay Options
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'RentEase',
        description: `Booking for ${property.title}`,
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            await paymentsAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: createdBookingId
            });
            toast.success('Payment successful! Booking confirmed.');
            setShowPaymentModal(false);
            router.push(`/dashboard/bookings/${createdBookingId}`);
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#6172f0' },
        modal: {
          ondismiss: function() { setPaying(false); }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to initialize payment');
      setPaying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-20 page-container py-10">
        <div className="skeleton h-96 rounded-2xl mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="skeleton h-8 rounded w-3/4" />
            <div className="skeleton h-4 rounded w-1/2" />
            <div className="skeleton h-32 rounded" />
          </div>
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    </div>
  );
  if (!property) return null;

  const images = property.images?.length ? property.images : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80'];
  const isLongTerm = property.listing_type === 'long_term';

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-16">
        {/* Image Gallery */}
        <div className="relative h-[55vh] bg-gray-900 overflow-hidden">
          <img src={images[imgIndex]} alt={property.title} className="w-full h-full object-cover opacity-90" />
          {images.length > 1 && (
            <>
              <button onClick={() => setImgIndex((imgIndex - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 glass w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setImgIndex((imgIndex + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 glass w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all">
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <button onClick={() => router.back()} className="absolute top-4 left-4 glass w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/20">
            <ArrowLeft size={18} />
          </button>
        </div>

        <div className="page-container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: Details */}
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin size={16} />
                    <span>{property.location}{property.city && `, ${property.city}`}</span>
                  </div>
                </div>
                {property.avg_rating > 0 && (
                  <div className="flex items-center gap-2 bg-brand-50 px-4 py-2 rounded-xl">
                    <Star size={18} className="fill-gold-400 text-gold-400" />
                    <span className="font-bold text-gray-800 text-lg">{parseFloat(property.avg_rating).toFixed(1)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 py-4 border-y border-gray-100 mb-6">
                {[
                  { icon: Bed, label: `${property.bedrooms} Bedrooms` },
                  { icon: Bath, label: `${property.bathrooms} Bathrooms` },
                  { icon: Users, label: `Up to ${property.max_guests} guests` },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-gray-600">
                    <item.icon size={15} className="text-brand-600" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
                <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg capitalize">{property.property_type}</span>
              </div>

              <div className="mb-8">
                <h2 className="font-display text-xl font-bold text-gray-800 mb-3">About this place</h2>
                <p className="text-gray-600 leading-relaxed">{property.description}</p>
              </div>

              {property.amenities?.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-display text-xl font-bold text-gray-800 mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {property.amenities.map((amenity, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
                        <Shield size={16} className="text-brand-600" />
                        <span className="text-sm text-gray-700 capitalize">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Booking Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-6 shadow-float border border-gray-100">
                  <div className="mb-5">
                    <span className="font-display text-2xl font-bold text-brand-600">
                      {isLongTerm ? formatCurrency(property.monthly_rent) : formatCurrency(property.price_per_night)}
                    </span>
                    <span className="text-gray-500"> {isLongTerm ? '/ month' : '/ night'}</span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 mb-1 block uppercase tracking-wider">Dates</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field text-sm" />
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field text-sm" />
                      </div>
                    </div>
                  </div>

                  {isLongTerm && (
                    <div className="mb-6 space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Payment Plan</label>
                        <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                          {['full', 'monthly'].map(p => (
                            <button key={p} onClick={() => setPaymentPlan(p)}
                              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${paymentPlan === p ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                              {p === 'full' ? 'Pay Full' : 'Pay Monthly'}
                            </button>
                          ))}
                        </div>
                      </div>
                      {paymentPlan === 'monthly' && (
                        <div>
                          <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Rent Due Day</label>
                          <select value={rentDueDay} onChange={e => setRentDueDay(parseInt(e.target.value))}
                            className="input-field text-sm w-full">
                            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                              <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of every month</option>
                            ))}
                          </select>
                          <p className="text-[10px] text-gray-400 mt-1">Day of month when rent is due</p>
                        </div>
                      )}
                    </div>
                  )}

                  {rentBreakdown && (
                    <div className="bg-brand-50 rounded-2xl p-4 mb-6 text-sm space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>{isLongTerm ? `${rentBreakdown.totalMonths} months` : `${rentBreakdown.totalNights} nights`}</span>
                        <span>{formatCurrency(rentBreakdown.baseAmount)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Tax & Service</span>
                        <span>{formatCurrency(rentBreakdown.serviceFee + rentBreakdown.taxAmount)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-800 pt-2 border-t border-brand-100">
                        <span>Total</span>
                        <span className="text-brand-600">{formatCurrency(rentBreakdown.totalAmount)}</span>
                      </div>
                      {isLongTerm && paymentPlan === 'monthly' && (
                        <p className="text-[10px] text-brand-600 font-bold mt-2 bg-white px-2 py-1 rounded-lg inline-block">
                          Pay Now: {formatCurrency(rentBreakdown.monthlyCycleAmount)} (1st Month)
                        </p>
                      )}
                    </div>
                  )}

                  <button onClick={handleBook} disabled={booking || !property.is_available}
                    className="btn-primary w-full py-4 text-base font-bold rounded-2xl shadow-brand">
                    {booking ? 'Reserving...' : 'Reserve Now'}
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl relative">
              <button onClick={() => { setShowPaymentModal(false); router.push('/dashboard/bookings'); }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-brand-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-brand-600">
                  <CheckCircle size={32} />
                </div>
                <h2 className="font-display text-2xl font-bold text-gray-900">Booking Requested!</h2>
                <p className="text-gray-500 text-sm mt-1">Please complete the payment to confirm your stay.</p>
              </div>

              <div className="bg-brand-50 rounded-2xl p-6 mb-8 text-center ring-1 ring-brand-100">
                <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-1">
                  {isLongTerm && paymentPlan === 'monthly' ? '1st Month Rent' : 'Due Now'}
                </p>
                <p className="text-3xl font-black text-brand-600">
                  {isLongTerm && paymentPlan === 'monthly' 
                    ? formatCurrency(rentBreakdown?.monthlyCycleAmount)
                    : formatCurrency(rentBreakdown?.totalAmount)}
                </p>
                {isLongTerm && paymentPlan === 'monthly' && (
                  <p className="text-xs text-gray-500 mt-2">Total for lease: {formatCurrency(rentBreakdown?.totalAmount)} · Due on the {rentDueDay}{rentDueDay === 1 ? 'st' : rentDueDay === 2 ? 'nd' : rentDueDay === 3 ? 'rd' : 'th'} each month</p>
                )}
              </div>

              <div className="space-y-3">
                <button onClick={handleRazorpayPayment} disabled={paying} 
                  className="btn-primary w-full py-4 flex items-center justify-center gap-2 font-bold rounded-2xl shadow-brand">
                  {paying ? 'Processing...' : <><CreditCard size={18} /> Pay with Razorpay</>}
                </button>
                <button onClick={() => { setShowPaymentModal(false); router.push('/dashboard/bookings'); }}
                  className="btn-ghost w-full py-3 text-sm font-semibold text-gray-400">Pay Later</button>
              </div>
              
              <p className="text-[10px] text-center text-gray-400 mt-6 uppercase tracking-widest font-bold">
                100% Secured Payment · Razorpay
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
