'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, MapPin, DollarSign, Image, ArrowLeft, Check, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { propertiesAPI } from '../../../../services/api';

const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'studio', 'condo', 'penthouse', 'flat'];
const AMENITY_OPTIONS = ['WiFi', 'Parking', 'AC', 'Kitchen', 'Pool', 'Gym', 'TV', 'Washing Machine', 'Balcony', 'Security', 'Garden', 'Elevator'];

const STEPS = [
  { id: 1, label: 'Basics', icon: Home },
  { id: 2, label: 'Location', icon: MapPin },
  { id: 3, label: 'Details', icon: DollarSign },
  { id: 4, label: 'Media (Optional)', icon: Image },
];

const defaultForm = {
  title: '', description: '', property_type: 'apartment', listing_type: 'short_term',
  price_per_night: '', monthly_rent: '', location: '', city: '', state: '', country: 'India',
  bedrooms: 1, bathrooms: 1, max_guests: 2,
  amenities: [], images: [], rules: '',
};

export default function PropertyFormPage() {
  const router = useRouter();
  const params = useParams();
  const isEdit = !!params?.id && params.id !== 'new';
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (isEdit) {
      propertiesAPI.getById(params.id).then(({ data }) => {
        const p = data.property;
        setForm({
          title: p.title, description: p.description, property_type: p.property_type,
          listing_type: p.listing_type || 'short_term',
          price_per_night: p.price_per_night || '', 
          monthly_rent: p.monthly_rent || '',
          location: p.location, city: p.city || '',
          state: p.state || '', country: p.country || 'India',
          bedrooms: p.bedrooms, bathrooms: p.bathrooms, max_guests: p.max_guests,
          amenities: p.amenities || [], images: p.images || [], rules: p.rules || '',
        });
      }).catch(() => { toast.error('Property not found'); router.push('/dashboard/properties'); });
    }
  }, [isEdit]);

  const toggleAmenity = (a) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }));
  };

  const addImage = () => {
    if (!imageUrl.trim()) return;
    setForm(f => ({ ...f, images: [...f.images, imageUrl.trim()] }));
    setImageUrl('');
  };

  const removeImage = (i) => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));

  const handleSubmit = async () => {
    const isPriceValid = form.listing_type === 'long_term' ? form.monthly_rent : form.price_per_night;
    if (!form.title || !form.description || !isPriceValid || !form.location) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      // 🛠️ Sanitize: Convert empty price strings to null for the DB
      const sanitizedForm = {
        ...form,
        price_per_night: form.price_per_night === '' ? null : form.price_per_night,
        monthly_rent: form.monthly_rent === '' ? null : form.monthly_rent,
      };

      if (isEdit) {
        await propertiesAPI.update(params.id, sanitizedForm);
        toast.success('Property updated!');
      } else {
        await propertiesAPI.create(sanitizedForm);
        toast.success('Property listed successfully!');
      }
      router.push('/dashboard/properties');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save property');
    }
    setLoading(false);
  };

  const canNext = () => {
    if (step === 1) return form.title.length >= 5 && form.description.length >= 10 && form.property_type;
    if (step === 2) return form.location.length >= 3 && form.city.length >= 2;
    if (step === 3) {
      if (form.listing_type === 'long_term') return form.monthly_rent > 0;
      return form.price_per_night > 0;
    }
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">{isEdit ? 'Edit Property' : 'List New Property'}</h1>
          <p className="text-gray-500 text-sm">Step {step} of {STEPS.length}</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <button onClick={() => step > s.id && setStep(s.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${step === s.id ? 'bg-brand-gradient text-white shadow-brand' : step > s.id ? 'bg-brand-50 text-brand-600 cursor-pointer' : 'bg-gray-100 text-gray-400'}`}>
              {step > s.id ? <Check size={14} /> : <s.icon size={14} />}
              <span className="text-xs font-medium hidden sm:block">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${step > s.id ? 'bg-brand-300' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Form Body */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>

          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-800 text-lg mb-4">Basic Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Cozy 2BHK near Metro Station" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {PROPERTY_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, property_type: t })}
                      className={`py-2.5 rounded-xl text-sm font-medium capitalize transition-all border ${form.property_type === t ? 'bg-brand-gradient text-white border-transparent shadow-brand' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your property: atmosphere, nearby landmarks, what makes it special..." rows={5}
                  className="input-field resize-none" />
                <p className="text-xs text-gray-400 mt-1">{form.description.length} characters (min 10)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">House Rules</label>
                <textarea value={form.rules} onChange={e => setForm({ ...form, rules: e.target.value })}
                  placeholder="No smoking, no pets, check-in after 2 PM..." rows={2} className="input-field resize-none" />
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-800 text-lg mb-4">Location Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Address *</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. 42, Linking Road, Bandra West" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                  <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="Mumbai" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                  <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
                    placeholder="Maharashtra" className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}
                  placeholder="India" className="input-field" />
              </div>
            </div>
          )}

          {/* Step 3: Details & Price */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-800 text-lg mb-4">Property Details & Pricing</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Bedrooms', key: 'bedrooms', min: 0, max: 20 },
                  { label: 'Bathrooms', key: 'bathrooms', min: 1, max: 10 },
                  { label: 'Max Guests', key: 'max_guests', min: 1, max: 20 },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button type="button" onClick={() => setForm(f => ({ ...f, [field.key]: Math.max(field.min, f[field.key] - 1) }))}
                        className="px-3 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-lg transition-colors">−</button>
                      <span className="flex-1 text-center font-semibold text-gray-800">{form[field.key]}</span>
                      <button type="button" onClick={() => setForm(f => ({ ...f, [field.key]: Math.min(field.max, f[field.key] + 1) }))}
                        className="px-3 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-lg transition-colors">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Listing Type</label>
                <div className="flex gap-4 p-1 bg-gray-100 rounded-2xl mb-6">
                  {['short_term', 'long_term'].map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, listing_type: t })}
                      className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${form.listing_type === t ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      {t === 'short_term' ? 'Daily/Nightly' : 'Monthly Rent (Flat)'}
                    </button>
                  ))}
                </div>
              </div>

              {form.listing_type === 'short_term' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price per Night (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                    <input type="number" value={form.price_per_night} onChange={e => setForm({ ...form, price_per_night: e.target.value })}
                      placeholder="2500" min="0" className="input-field pl-8" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Rent (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                    <input type="number" value={form.monthly_rent} onChange={e => setForm({ ...form, monthly_rent: e.target.value })}
                      placeholder="25000" min="0" className="input-field pl-8" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
                <div className="grid grid-cols-3 gap-2">
                  {AMENITY_OPTIONS.map(a => (
                    <button key={a} type="button" onClick={() => toggleAmenity(a)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium transition-all border flex items-center gap-1.5 ${form.amenities.includes(a) ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {form.amenities.includes(a) && <Check size={11} className="text-brand-600" />}
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Images */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-800 text-lg mb-4">Property Images (Optional)</h2>
              <p className="text-sm text-gray-500">Add image URLs from Unsplash, Cloudinary, or your hosting service.</p>
              <div className="flex gap-2">
                <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..." className="input-field flex-1"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())} />
                <button onClick={addImage} type="button" className="btn-primary px-4 shrink-0">
                  <Plus size={16} />
                </button>
              </div>
              {form.images.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
                  <Image size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400 text-sm">No images added yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative group aspect-video rounded-xl overflow-hidden bg-gray-100">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => removeImage(i)} className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                      {i === 0 && <span className="absolute top-2 left-2 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Cover</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button onClick={() => step > 1 ? setStep(step - 1) : router.back()}
          className="btn-ghost px-6">
          {step > 1 ? '← Back' : '← Cancel'}
        </button>
        {step < STEPS.length ? (
          <button onClick={() => setStep(step + 1)} disabled={!canNext()}
            className="btn-primary px-8 disabled:opacity-50">
            Continue →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary px-8 disabled:opacity-60">
            {loading ? 'Saving...' : isEdit ? 'Update Property' : 'Submit Listing'}
          </button>
        )}
      </div>
    </div>
  );
}
