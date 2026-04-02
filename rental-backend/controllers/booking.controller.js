const { Booking, Property, User, Payment, Notification } = require('../models');
const { Op } = require('sequelize');
const { calculateRent, datesOverlap } = require('../utils/rentCalculator');
const emailService = require('../services/email.service');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

// ─── Conflict Validation (Core Logic) ─────────────────────────────────────────
const checkBookingConflict = async (property_id, start_date, end_date, exclude_booking_id = null) => {
  const where = {
    property_id,
    status: { [Op.in]: ['pending', 'confirmed'] },
    [Op.and]: [
      { start_date: { [Op.lt]: end_date } },
      { end_date: { [Op.gt]: start_date } }
    ]
  };
  if (exclude_booking_id) where.id = { [Op.ne]: exclude_booking_id };

  const conflict = await Booking.findOne({ where });
  return conflict;
};

// POST /api/bookings
const createBooking = async (req, res, next) => {
  try {
    const { property_id, start_date, end_date, guests, special_requests, payment_plan = 'full', rent_due_day } = req.body;

    // Validate dates
    const start = new Date(start_date);
    const end = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({ error: 'Start date cannot be in the past' });
    }
    if (end <= start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Get property
    const property = await Property.findByPk(property_id);
    if (!property) return res.status(404).json({ error: 'Property not found' });
    if (!property.is_available || !property.is_approved) {
      return res.status(400).json({ error: 'Property is not available for booking' });
    }

    // Prevent owner from booking own property
    if (property.owner_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot book your own property' });
    }

    // ⚡ Check booking conflict
    const conflict = await checkBookingConflict(property_id, start_date, end_date);
    if (conflict) {
      return res.status(409).json({
        error: 'Property is already booked for the selected dates',
        conflicting_dates: { start_date: conflict.start_date, end_date: conflict.end_date }
      });
    }

    // Calculate rent
    const isLongTerm = property.listing_type === 'long_term';
    const price = isLongTerm ? property.monthly_rent : property.price_per_night;
    const rentDetails = calculateRent(start_date, end_date, price, property.listing_type);

    // Determine rent due day (only for monthly plans)
    const effectiveDueDay = (isLongTerm && payment_plan === 'monthly')
      ? Math.min(rent_due_day || start.getDate(), 28)
      : null;

    // Determine initial payment amount
    const initialPaymentAmount = (isLongTerm && payment_plan === 'monthly') 
      ? rentDetails.monthlyCycleAmount 
      : rentDetails.totalAmount;

    // Create booking
    const booking = await Booking.create({
      user_id: req.user.id,
      property_id,
      start_date,
      end_date,
      total_nights: rentDetails.totalNights,
      total_amount: rentDetails.totalAmount,
      billing_cycle_amount: isLongTerm ? rentDetails.monthlyCycleAmount : null,
      payment_plan: isLongTerm ? payment_plan : 'full',
      rent_due_day: effectiveDueDay,
      guests: guests || 1,
      special_requests,
      status: 'pending'
    });

    // Create pending payment record
    const isMonthly = isLongTerm && payment_plan === 'monthly';

    // Calculate first billing period and due date for monthly
    let paymentData = {
      booking_id: booking.id,
      amount: initialPaymentAmount,
      status: 'pending',
      payment_method: 'razorpay',
      metadata: { 
        rent_breakdown: rentDetails,
        payment_plan: payment_plan,
        is_initial_cycle: isMonthly
      }
    };

    if (isMonthly) {
      // First billing period: start_date to start_date + 1 month
      const periodEnd = new Date(start);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      const billingEnd = periodEnd > end ? end : periodEnd;

      // Due date: the rent_due_day of the start month (or immediately if booking starts after due day)
      const dueDate = new Date(start);

      paymentData.installment_number = 1;
      paymentData.due_date = dueDate.toISOString().split('T')[0];
      paymentData.billing_period_start = start_date;
      paymentData.billing_period_end = billingEnd.toISOString().split('T')[0];
    }

    await Payment.create(paymentData);

    // Notify owner
    const owner = await User.findByPk(property.owner_id);
    await notificationService.create(
      owner.id,
      'New Booking Request',
      `${req.user.name} has requested to book "${property.title}"`,
      'booking_pending',
      booking.id,
      'booking'
    );

    emailService.sendBookingConfirmation(req.user, booking, property, rentDetails)
      .catch(err => logger.error('Booking email failed:', err));

    const fullBooking = await Booking.findByPk(booking.id, {
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title', 'images', 'location', 'price_per_night'] },
        { model: User, as: 'tenant', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking: fullBooking,
      rent_breakdown: rentDetails
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings — Tenant sees own, Owner sees property bookings, Admin sees all
const getBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;

    if (req.user.role === 'tenant') {
      where.user_id = req.user.id;
    } else if (req.user.role === 'owner') {
      // Get owner's property IDs
      const properties = await Property.findAll({
        where: { owner_id: req.user.id },
        attributes: ['id']
      });
      where.property_id = { [Op.in]: properties.map(p => p.id) };
    }
    // Admin sees all

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title', 'images', 'location', 'price_per_night', 'owner_id'] },
        { model: User, as: 'tenant', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Payment, as: 'payments', attributes: ['id', 'status', 'amount', 'paid_at'] }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      bookings: rows,
      pagination: { total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/:id
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Property, as: 'property', include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email', 'phone'] }] },
        { model: User, as: 'tenant', attributes: ['id', 'name', 'email', 'avatar', 'phone'] },
        { model: Payment, as: 'payments' }
      ]
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Authorization check
    const isOwner = booking.property?.owner_id === req.user.id;
    const isTenant = booking.user_id === req.user.id;
    if (req.user.role !== 'admin' && !isOwner && !isTenant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ booking });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/bookings/:id/status — Owner confirms/rejects, Tenant cancels
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, cancellation_reason } = req.body;
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Property, as: 'property' }]
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.property?.owner_id === req.user.id;
    const isTenant = booking.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Role-based status transitions
    const allowedTransitions = {
      owner: { pending: ['confirmed', 'rejected'] },
      tenant: { pending: ['cancelled'], confirmed: ['cancelled'] },
      admin: { pending: ['confirmed', 'cancelled', 'rejected'], confirmed: ['cancelled', 'completed'] }
    };

    const allowed = allowedTransitions[req.user.role]?.[booking.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Cannot transition from ${booking.status} to ${status}` });
    }
    if (!isOwner && !isTenant && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updates = { status };
    if (status === 'cancelled') {
      updates.cancelled_at = new Date();
      updates.cancellation_reason = cancellation_reason;
    }
    if (status === 'confirmed') {
      updates.confirmed_at = new Date();
    }

    await booking.update(updates);

    // Notify tenant
    const notifTypes = {
      confirmed: 'booking_confirmed',
      cancelled: 'booking_cancelled',
      rejected: 'booking_cancelled'
    };
    if (notifTypes[status]) {
      await notificationService.create(
        booking.user_id,
        `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        `Your booking for "${booking.property?.title}" has been ${status}`,
        notifTypes[status], booking.id, 'booking'
      );
    }

    res.json({ message: `Booking ${status} successfully`, booking });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/calendar/:property_id — For booking calendar UI
const getPropertyBookingCalendar = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const startOfMonth = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 2, 0);

    const bookings = await Booking.findAll({
      where: {
        property_id: req.params.property_id,
        status: { [Op.in]: ['pending', 'confirmed'] },
        start_date: { [Op.lte]: endOfMonth },
        end_date: { [Op.gte]: startOfMonth }
      },
      attributes: ['start_date', 'end_date', 'status']
    });

    res.json({ booked_periods: bookings });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking, getBookings, getBookingById,
  updateBookingStatus, getPropertyBookingCalendar, checkBookingConflict
};
