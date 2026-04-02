'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Home, Edit, Trash2, Eye, ToggleLeft, ToggleRight, MapPin, Star, Bed, Bath, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { propertiesAPI } from '../../../services/api';
import { formatCurrency } from '../../../utils/rentCalc';

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data } = await propertiesAPI.getMyProperties({ limit: 50 });
      setProperties(data.properties);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleToggleAvailability = async (property) => {
    try {
      await propertiesAPI.update(property.id, { is_available: !property.is_available });
      toast.success(`Property marked as ${!property.is_available ? 'available' : 'unavailable'}`);
      fetchProperties();
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    try {
      await propertiesAPI.delete(id);
      toast.success('Property deleted');
      setDeleteId(null);
      fetchProperties();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">My Properties</h1>
          <p className="text-gray-500 text-sm mt-0.5">{properties.length} listing{properties.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/properties/new" className="btn-primary text-sm">
          <Plus size={16} /> Add Property
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
          <Home size={56} className="mx-auto text-gray-200 mb-5" />
          <h3 className="font-display text-xl font-bold text-gray-700 mb-2">No properties yet</h3>
          <p className="text-gray-400 mb-6">Start earning by listing your first property</p>
          <Link href="/dashboard/properties/new" className="btn-primary">
            <Plus size={16} /> List First Property
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-float transition-all group">
              {/* Image */}
              <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Home size={36} className="text-gray-300" /></div>
                )}
                {/* Status badges */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${p.is_approved ? 'bg-green-500 text-white' : 'bg-yellow-400 text-white'}`}>
                    {p.is_approved ? '✓ Approved' : '⏳ Pending'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${p.is_available ? 'bg-brand-500 text-white' : 'bg-gray-500 text-white'}`}>
                    {p.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{p.title}</h3>
                <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-2">
                  <MapPin size={12} />
                  <span className="line-clamp-1">{p.city || p.location}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-400 text-xs mb-3">
                  <span className="flex items-center gap-1"><Bed size={12} /> {p.bedrooms} bed</span>
                  <span className="flex items-center gap-1"><Bath size={12} /> {p.bathrooms} bath</span>
                  {p.avg_rating > 0 && <span className="flex items-center gap-1"><Star size={12} className="text-gold-400" /> {parseFloat(p.avg_rating).toFixed(1)}</span>}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-brand-600">{formatCurrency(p.price_per_night)}<span className="text-gray-400 font-normal text-xs">/night</span></span>
                  <button onClick={() => handleToggleAvailability(p)}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${p.is_available ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}>
                    {p.is_available ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {p.is_available ? 'Live' : 'Hidden'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <Link href={`/properties/${p.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors">
                    <Eye size={13} /> Preview
                  </Link>
                  <Link href={`/dashboard/properties/${p.id}/edit`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-50 text-brand-600 text-xs font-medium hover:bg-brand-100 transition-colors">
                    <Edit size={13} /> Edit
                  </Link>
                  <button onClick={() => setDeleteId(p.id)} className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-float text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="font-display text-lg font-bold text-gray-900 mb-2">Delete Property?</h3>
              <p className="text-gray-500 text-sm mb-6">This action cannot be undone. All associated bookings will be affected.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
