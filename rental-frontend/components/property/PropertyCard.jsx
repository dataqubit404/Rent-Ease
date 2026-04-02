'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Star, Bed, Bath, Heart, Users } from 'lucide-react';
import { useState } from 'react';

const statusColors = {
  true: 'bg-emerald-100 text-emerald-700',
  false: 'bg-red-100 text-red-600',
};

export default function PropertyCard({ property, index = 0 }) {
  const [wishlisted, setWishlisted] = useState(false);
  const image = property.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-float transition-all duration-400 border border-gray-100 card-hover"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={image}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center transition-all duration-200 hover:scale-110"
        >
          <Heart size={16} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-white'} />
        </button>

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <span className="glass text-white text-xs font-semibold px-2.5 py-1 rounded-lg capitalize">
            {property.property_type}
          </span>
        </div>

        {/* Availability */}
        <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${statusColors[property.is_available]}`}>
            {property.is_available ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      {/* Content */}
      <Link href={`/properties/${property.id}`} className="block p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 text-base line-clamp-1 group-hover:text-brand-600 transition-colors">
            {property.title}
          </h3>
          {property.avg_rating > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Star size={13} className="fill-gold-400 text-gold-400" />
              <span className="text-sm font-semibold text-gray-700">{parseFloat(property.avg_rating).toFixed(1)}</span>
              {property.total_reviews > 0 && (
                <span className="text-xs text-gray-400">({property.total_reviews})</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-3">
          <MapPin size={13} />
          <span className="line-clamp-1">{property.city || property.location}</span>
        </div>

        <div className="flex items-center gap-3 text-gray-500 text-xs mb-4">
          <div className="flex items-center gap-1">
            <Bed size={13} />
            <span>{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath size={13} />
            <span>{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={13} />
            <span>Up to {property.max_guests}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-brand-600 font-bold text-lg">₹{Number(property.price_per_night).toLocaleString('en-IN')}</span>
            <span className="text-gray-400 text-sm"> / night</span>
          </div>
          <div className="flex items-center gap-1.5">
            {property.owner?.avatar ? (
              <img src={property.owner.avatar} className="w-7 h-7 rounded-full object-cover" alt={property.owner.name} />
            ) : (
              <div className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold">
                {property.owner?.name?.[0]?.toUpperCase() || 'O'}
              </div>
            )}
            <span className="text-xs text-gray-500">{property.owner?.name?.split(' ')[0]}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
