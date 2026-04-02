const { Review, User, Property, Booking } = require('../models');
const { Op } = require('sequelize');

// POST /api/reviews
const createReview = async (req, res, next) => {
  try {
    const { property_id, booking_id, rating, comment, cleanliness_rating, communication_rating, location_rating, value_rating } = req.body;

    // Verify user has a completed booking for this property
    const booking = await Booking.findOne({
      where: {
        id: booking_id,
        user_id: req.user.id,
        property_id,
        status: 'completed'
      }
    });
    if (!booking) {
      return res.status(403).json({ error: 'You can only review properties you have stayed at' });
    }

    // Check if already reviewed
    const existing = await Review.findOne({ where: { user_id: req.user.id, booking_id } });
    if (existing) return res.status(409).json({ error: 'You have already reviewed this booking' });

    const review = await Review.create({
      user_id: req.user.id,
      property_id,
      booking_id,
      rating,
      comment,
      cleanliness_rating,
      communication_rating,
      location_rating,
      value_rating
    });

    // Recalculate property avg rating
    await updatePropertyRating(property_id);

    const fullReview = await Review.findByPk(review.id, {
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'name', 'avatar'] }]
    });

    res.status(201).json({ message: 'Review submitted', review: fullReview });
  } catch (error) {
    next(error);
  }
};

// GET /api/reviews/property/:property_id
const getPropertyReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Review.findAndCountAll({
      where: { property_id: req.params.property_id, is_approved: true },
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'name', 'avatar'] }],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    const avgRating = rows.length
      ? (rows.reduce((sum, r) => sum + r.rating, 0) / rows.length).toFixed(1)
      : 0;

    res.json({ reviews: rows, avg_rating: parseFloat(avgRating), pagination: { total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    next(error);
  }
};

// GET /api/reviews/me
const getMyReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (req.user.role === 'tenant') {
      where.user_id = req.user.id;
    } else if (req.user.role === 'owner') {
      const properties = await Property.findAll({ where: { owner_id: req.user.id }, attributes: ['id'] });
      where.property_id = { [Op.in]: properties.map(p => p.id) };
    }

    const { count, rows } = await Review.findAndCountAll({
      where,
      include: [
        { model: Property, as: 'property', attributes: ['title', 'location', 'id'] },
        { model: User, as: 'reviewer', attributes: ['name', 'avatar'] }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({ reviews: rows, pagination: { total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/reviews/:id — Update own review
const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const { rating, comment } = req.body;
    await review.update({ rating, comment });
    await updatePropertyRating(review.property_id);
    res.json({ message: 'Review updated', review });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/reviews/:id
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const propId = review.property_id;
    await review.destroy();
    await updatePropertyRating(propId);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

// POST /api/reviews/:id/owner-response — Owner responds
const ownerResponse = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id, {
      include: [{ model: Property, as: 'property' }]
    });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.property?.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the property owner can respond' });
    }
    await review.update({ owner_response: req.body.response });
    res.json({ message: 'Response added', review });
  } catch (error) {
    next(error);
  }
};

// Helper: recalculate avg rating for a property
const updatePropertyRating = async (property_id) => {
  const reviews = await Review.findAll({ where: { property_id, is_approved: true }, attributes: ['rating'] });
  const avg = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  await Property.update(
    { avg_rating: Math.round(avg * 10) / 10, total_reviews: reviews.length },
    { where: { id: property_id } }
  );
};

module.exports = { createReview, getPropertyReviews, getMyReviews, updateReview, deleteReview, ownerResponse };
