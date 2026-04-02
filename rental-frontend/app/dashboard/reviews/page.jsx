'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare } from 'lucide-react';
import useAuthStore from '../../../hooks/useAuthStore';
import { reviewsAPI } from '../../../services/api';

export default function ReviewsPage() {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        // Fallback for missing backend endpoint logic
        const { data } = await reviewsAPI.getMyReviews?.() || { data: { reviews: [] }};
        setReviews(data.reviews || []);
      } catch (err) {
        console.error('Failed to load reviews', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchReviews();
  }, [user]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">My Reviews</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your property reviews and feedback</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Star size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="font-display text-xl font-bold text-gray-700 mb-2">No reviews yet</h3>
          <p className="text-gray-400">Reviews from your {user?.role === 'owner' ? 'properties' : 'stays'} will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, i) => (
            <motion.div key={review.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{review.property?.title || 'Property Review'}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} size={14} className={idx < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-600 text-sm">{review.comment}</p>
              {review.owner_response && (
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare size={12} className="text-brand-500" />
                    <span className="text-xs font-bold text-gray-700">Owner Response</span>
                  </div>
                  <p className="text-sm text-gray-600">{review.owner_response}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
