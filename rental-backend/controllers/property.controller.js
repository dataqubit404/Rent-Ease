const { Property, User, Booking, Review } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const logger = require('../utils/logger');

// GET /api/properties — Public search with filters
const getAllProperties = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 12, search, city, property_type, listing_type,
      min_price, max_price, bedrooms, min_rating, is_available
    } = req.query;
    const offset = (page - 1) * limit;
    const where = { is_approved: true };

    if (is_available !== undefined) where.is_available = is_available === 'true';
    if (city) where.city = { [Op.like]: `%${city}%` };
    if (property_type) where.property_type = property_type;
    if (listing_type) where.listing_type = listing_type;
    if (bedrooms) where.bedrooms = { [Op.gte]: parseInt(bedrooms) };
    if (min_price || max_price) {
      const priceField = listing_type === 'long_term' ? 'monthly_rent' : 'price_per_night';
      where[priceField] = {};
      if (min_price) where[priceField][Op.gte] = parseFloat(min_price);
      if (max_price) where[priceField][Op.lte] = parseFloat(max_price);
    }
    if (min_rating) where.avg_rating = { [Op.gte]: parseFloat(min_rating) };
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Property.findAndCountAll({
      where,
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'avatar', 'email'] }],
      limit: parseInt(limit),
      offset,
      order: [['avg_rating', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({
      properties: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/properties/:id
const getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'avatar', 'email', 'phone'] },
        {
          model: Review, as: 'reviews',
          include: [{ model: User, as: 'reviewer', attributes: ['id', 'name', 'avatar'] }],
          order: [['createdAt', 'DESC']],
          limit: 10
        }
      ]
    });
    if (!property) return res.status(404).json({ error: 'Property not found' });
    res.json({ property });
  } catch (error) {
    next(error);
  }
};

// POST /api/properties — Owner only
const createProperty = async (req, res, next) => {
  try {
    const {
      title, description, price_per_night, monthly_rent, listing_type,
      location, city, state, country, latitude, longitude, property_type,
      bedrooms, bathrooms, max_guests, amenities, images, rules
    } = req.body;

    // 🛠️ Sanitize: Convert empty strings to null for DECIMAL columns
    const sanitizedPrice = price_per_night === '' ? null : price_per_night;
    const sanitizedRent = monthly_rent === '' ? null : monthly_rent;

    const property = await Property.create({
      owner_id: req.user.id,
      title, description, 
      price_per_night: sanitizedPrice, 
      monthly_rent: sanitizedRent,
      listing_type: listing_type || 'short_term',
      location, city, state,
      country, latitude, longitude, property_type, bedrooms,
      bathrooms, max_guests,
      amenities: amenities || [],
      images: images || [],
      rules,
      is_approved: false // Requires admin approval
    });

    res.status(201).json({ message: 'Property created successfully', property });
  } catch (error) {
    next(error);
  }
};

// PUT /api/properties/:id — Owner or Admin
const updateProperty = async (req, res, next) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    if (req.user.role !== 'admin' && property.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this property' });
    }

    const updates = { ...req.body };
    delete updates.owner_id; // Prevent owner change
    delete updates.avg_rating;
    delete updates.total_reviews;

    await property.update(updates);
    res.json({ message: 'Property updated successfully', property });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/properties/:id — Owner or Admin
const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    if (req.user.role !== 'admin' && property.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await property.destroy();
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/properties/owner/mine — Owner's own listings
const getOwnerProperties = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Property.findAndCountAll({
      where: { owner_id: req.user.id },
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      properties: rows,
      pagination: { total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/properties/:id/approve — Admin only
const approveProperty = async (req, res, next) => {
  try {
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    await property.update({ is_approved: req.body.is_approved });
    res.json({ message: `Property ${req.body.is_approved ? 'approved' : 'rejected'}`, property });
  } catch (error) {
    next(error);
  }
};

// GET /api/properties/:id/availability — Check available dates
const checkAvailability = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const property = await Property.findByPk(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    const bookings = await Booking.findAll({
      where: {
        property_id: req.params.id,
        status: { [Op.in]: ['confirmed', 'pending'] },
        ...(start_date && end_date && {
          [Op.and]: [
            { start_date: { [Op.lt]: end_date } },
            { end_date: { [Op.gt]: start_date } }
          ]
        })
      },
      attributes: ['start_date', 'end_date', 'status']
    });

    const isAvailable = bookings.length === 0;
    res.json({ is_available: isAvailable, booked_periods: bookings });
  } catch (error) {
    next(error);
  }
};

// GET /api/properties/admin/all — Admin sees all (including unapproved)
const adminGetAllProperties = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, is_approved } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (is_approved !== undefined) where.is_approved = is_approved === 'true';

    const { count, rows } = await Property.findAndCountAll({
      where,
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      properties: rows,
      pagination: { total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProperties, getPropertyById, createProperty, updateProperty,
  deleteProperty, getOwnerProperties, approveProperty, checkAvailability,
  adminGetAllProperties
};
