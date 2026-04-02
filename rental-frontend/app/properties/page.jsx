'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, ChevronDown, MapPin } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PropertyCard from '../../components/property/PropertyCard';
import { PropertyCardSkeleton } from '../../components/ui/Skeletons';
import { propertiesAPI } from '../../services/api';

const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'studio', 'condo', 'penthouse'];
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Jaipur'];

export default function PropertiesPage() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    city: searchParams.get('city') || '',
    property_type: searchParams.get('property_type') || '',
    min_price: '',
    max_price: '',
    bedrooms: '',
    min_rating: '',
  });

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')) };
      const { data } = await propertiesAPI.getAll(params);
      setProperties(data.properties);
      setTotal(data.pagination.total);
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const clearFilters = () => {
    setFilters({ search: '', city: '', property_type: '', min_price: '', max_price: '', bedrooms: '', min_rating: '' });
    setPage(1);
  };
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-surface-2">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-20">
        <div className="page-container py-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-xl">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search properties..."
                className="input-field pl-10 pr-4"
                onKeyDown={e => e.key === 'Enter' && fetchProperties()}
              />
            </div>

            {/* City quick select */}
            <div className="relative">
              <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filters.city}
                onChange={e => setFilters({ ...filters, city: e.target.value })}
                className="input-field pl-10 pr-8 w-40 appearance-none cursor-pointer"
              >
                <option value="">All Cities</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all ${showFilters || activeFilterCount ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && <span className="bg-white/25 text-white text-xs px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
            </button>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Property Type</label>
                    <select value={filters.property_type}
                      onChange={e => setFilters({ ...filters, property_type: e.target.value })}
                      className="input-field text-sm py-2 capitalize">
                      <option value="">Any Type</option>
                      {PROPERTY_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Min Price (₹/night)</label>
                    <input type="number" value={filters.min_price}
                      onChange={e => setFilters({ ...filters, min_price: e.target.value })}
                      placeholder="0" className="input-field text-sm py-2" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Max Price (₹/night)</label>
                    <input type="number" value={filters.max_price}
                      onChange={e => setFilters({ ...filters, max_price: e.target.value })}
                      placeholder="No limit" className="input-field text-sm py-2" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Min Bedrooms</label>
                    <select value={filters.bedrooms}
                      onChange={e => setFilters({ ...filters, bedrooms: e.target.value })}
                      className="input-field text-sm py-2">
                      <option value="">Any</option>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Min Rating</label>
                    <select value={filters.min_rating}
                      onChange={e => setFilters({ ...filters, min_rating: e.target.value })}
                      className="input-field text-sm py-2">
                      <option value="">Any</option>
                      {[3, 3.5, 4, 4.5].map(r => <option key={r} value={r}>{r}★+</option>)}
                    </select>
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 mt-3 font-medium">
                    <X size={14} /> Clear all filters
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results */}
      <div className="page-container py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 text-sm">
            {loading ? 'Loading...' : <><span className="font-semibold text-gray-900">{total}</span> properties found</>}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="font-display text-2xl font-bold text-gray-800 mb-2">No properties found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search filters</p>
            <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map((p, i) => <PropertyCard key={p.id} property={p} index={i} />)}
            </div>

            {/* Pagination */}
            {total > 12 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: Math.min(Math.ceil(total / 12), 8) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-xl font-medium text-sm transition-all ${page === p ? 'bg-brand-gradient text-white shadow-brand' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'}`}
                  >{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
