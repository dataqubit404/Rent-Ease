const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Payment, Booking, Property, User } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('../services/notification.service');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');

let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  logger.warn('Razorpay API keys missing from .env. Payment features will be disabled.');
}

// ── Helper: Create next monthly installment ─────────────────────────────────
const createNextInstallment = async (booking, currentPayment) => {
  try {
    const nextNumber = (currentPayment.installment_number || 0) + 1;
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);

    // Calculate next billing period
    const nextPeriodStart = new Date(currentPayment.billing_period_end);
    if (nextPeriodStart >= endDate) {
      logger.info(`Booking ${booking.id}: All installments completed (${currentPayment.installment_number} months)`);
      return null; // No more installments needed
    }

    const nextPeriodEnd = new Date(nextPeriodStart);
    nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
    const billingEnd = nextPeriodEnd > endDate ? endDate : nextPeriodEnd;

    // Due date is the rent_due_day of the next period month
    const dueDay = booking.rent_due_day || startDate.getDate();
    const dueDate = new Date(nextPeriodStart.getFullYear(), nextPeriodStart.getMonth(), Math.min(dueDay, 28));

    const nextPayment = await Payment.create({
      booking_id: booking.id,
      amount: booking.billing_cycle_amount,
      currency: 'INR',
      status: 'pending',
      payment_method: 'razorpay',
      installment_number: nextNumber,
      due_date: dueDate.toISOString().split('T')[0],
      billing_period_start: nextPeriodStart.toISOString().split('T')[0],
      billing_period_end: billingEnd.toISOString().split('T')[0],
      metadata: {
        payment_plan: 'monthly',
        is_auto_generated: true,
      }
    });

    logger.info(`Created installment #${nextNumber} for booking ${booking.id}, due ${nextPayment.due_date}`);
    return nextPayment;
  } catch (error) {
    logger.error('Failed to create next installment:', error);
    return null;
  }
};

// POST /api/payments/create-order — Create Razorpay Order
const createOrder = async (req, res, next) => {
  try {
    const { booking_id, payment_id } = req.body;

    const booking = await Booking.findByPk(booking_id, {
      include: [{ model: Payment, as: 'payments' }, { model: Property, as: 'property' }]
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // For monthly plans, find the next pending installment
    let paymentRecord;
    if (booking.payment_plan === 'monthly') {
      if (payment_id) {
        paymentRecord = (booking.payments || []).find(p => p.id === payment_id && p.status === 'pending');
      }
      if (!paymentRecord) {
        // Find first pending installment (ordered by installment_number)
        paymentRecord = (booking.payments || [])
          .filter(p => p.status === 'pending')
          .sort((a, b) => (a.installment_number || 0) - (b.installment_number || 0))[0];
      }
    } else {
      // Full payment plan
      const isAlreadyPaid = (booking.payments || []).some(p => p.status === 'completed');
      if (isAlreadyPaid) {
        return res.status(400).json({ error: 'Payment already completed' });
      }
      paymentRecord = (booking.payments || []).find(p => p.status === 'pending' || p.status === 'processing');
    }

    if (!paymentRecord) {
      return res.status(400).json({ error: 'No pending payment found for this booking' });
    }

    const amountInPaise = Math.round(Number(paymentRecord.amount) * 100);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `booking_${booking_id.slice(-8)}_inst${paymentRecord.installment_number || 0}`,
      notes: {
        booking_id: booking.id,
        user_id: req.user.id,
        property_id: booking.property_id,
        installment_number: paymentRecord.installment_number || null,
      },
    });

    // Update payment record with order ID
    await paymentRecord.update({ razorpay_order_id: order.id, status: 'processing' });

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      booking_id,
      payment_id: paymentRecord.id,
      installment_number: paymentRecord.installment_number,
      user_name: req.user.name,
      user_email: req.user.email,
      user_contact: req.user.phone || '',
      property_title: booking.property?.title || 'Property Booking',
    });
  } catch (error) {
    logger.error('Create Razorpay order error:', error);
    next(error);
  }
};

// POST /api/payments/verify — Verify Razorpay Payment Signature
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed: Invalid signature' });
    }

    // Find the specific payment by order ID
    const payment = await Payment.findOne({ where: { razorpay_order_id } });
    if (!payment) return res.status(404).json({ error: 'Payment record not found' });

    await payment.update({
      status: 'completed',
      razorpay_payment_id,
      razorpay_signature,
      transaction_id: razorpay_payment_id,
      paid_at: new Date(),
    });

    const booking = await Booking.findByPk(booking_id || payment.booking_id, {
      include: [{ model: Property, as: 'property' }, { model: Payment, as: 'payments' }]
    });

    // For monthly plans: create the next installment and keep booking confirmed
    if (booking.payment_plan === 'monthly') {
      // First payment confirms the booking
      if (booking.status === 'pending') {
        await booking.update({ status: 'confirmed', confirmed_at: new Date() });
      }
      // Create next month's installment automatically
      await createNextInstallment(booking, payment);
    } else {
      // Full payment: confirm booking
      await booking.update({ status: 'confirmed', confirmed_at: new Date() });
    }

    // Notify owner
    try {
      const property = await Property.findByPk(booking.property_id);
      const installmentLabel = payment.installment_number
        ? ` (Installment #${payment.installment_number})`
        : '';
      await notificationService.create(
        property.owner_id,
        'Payment Received',
        `Payment of ₹${payment.amount}${installmentLabel} received for "${property.title}"`,
        'payment_received', payment.id, 'payment'
      );
      await notificationService.create(
        booking.user_id,
        booking.status === 'confirmed' ? 'Booking Confirmed' : 'Rent Payment Received',
        payment.installment_number
          ? `Installment #${payment.installment_number} of ₹${payment.amount} for "${property.title}" received.`
          : `Your booking for "${property.title}" is confirmed. Payment of ₹${payment.amount} received.`,
        'booking_confirmed', booking.id, 'booking'
      );
    } catch (notifErr) {
      logger.error('Payment notification error:', notifErr);
    }

    emailService.sendPaymentReceipt(req.user, booking, payment).catch(err =>
      logger.error('Payment receipt email failed:', err)
    );

    res.json({ message: 'Payment verified and booking confirmed', payment, booking });
  } catch (error) {
    logger.error('Verify Razorpay payment error:', error);
    next(error);
  }
};

// POST /api/payments/razorpay-webhook — Razorpay webhook
const razorpayWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-razorpay-signature'];
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      if (signature !== expectedSig) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured') {
      const rpPayment = payload.payment.entity;
      const orderId = rpPayment.order_id;
      const payment = await Payment.findOne({ where: { razorpay_order_id: orderId } });
      if (payment && payment.status !== 'completed') {
        await payment.update({
          status: 'completed',
          razorpay_payment_id: rpPayment.id,
          transaction_id: rpPayment.id,
          paid_at: new Date(),
        });

        const booking = await Booking.findByPk(payment.booking_id);
        if (booking) {
          if (booking.payment_plan === 'monthly') {
            if (booking.status === 'pending') {
              await booking.update({ status: 'confirmed', confirmed_at: new Date() });
            }
            await createNextInstallment(booking, payment);
          } else {
            await Booking.update(
              { status: 'confirmed', confirmed_at: new Date() },
              { where: { id: payment.booking_id } }
            );
          }
        }
      }
    } else if (event === 'payment.failed') {
      const rpPayment = payload.payment.entity;
      const orderId = rpPayment.order_id;
      const payment = await Payment.findOne({ where: { razorpay_order_id: orderId } });
      if (payment) {
        await payment.update({
          status: 'failed',
          failure_reason: rpPayment.error_description || 'Payment failed',
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};

// POST /api/payments/:id/refund — Admin or owner initiates refund
const refundPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [{ model: Booking, as: 'booking' }]
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status !== 'completed') {
      return res.status(400).json({ error: 'Payment cannot be refunded' });
    }

    if (!payment.razorpay_payment_id) {
      return res.status(400).json({ error: 'No Razorpay payment ID found for refund' });
    }

    const refund = await razorpay.payments.refund(payment.razorpay_payment_id, {
      amount: Math.round(Number(payment.amount) * 100),
      notes: { reason: req.body.reason || 'Refund requested' },
    });

    await payment.update({
      status: 'refunded',
      refund_amount: refund.amount / 100,
      refunded_at: new Date(),
    });
    await Booking.update({ status: 'cancelled' }, { where: { id: payment.booking_id } });

    res.json({ message: 'Refund initiated successfully', refund_id: refund.id });
  } catch (error) {
    logger.error('Refund error:', error);
    next(error);
  }
};

// GET /api/payments — Get payment history
const getPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;

    let bookingWhere = {};
    if (req.user.role === 'tenant') {
      bookingWhere.user_id = req.user.id;
    } else if (req.user.role === 'owner') {
      const properties = await Property.findAll({ where: { owner_id: req.user.id }, attributes: ['id'] });
      bookingWhere.property_id = { [Op.in]: properties.map(p => p.id) };
    }

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [{
        model: Booking, as: 'booking',
        where: bookingWhere,
        include: [
          { model: Property, as: 'property', attributes: ['id', 'title', 'images'] },
          { model: User, as: 'tenant', attributes: ['id', 'name', 'email'] }
        ]
      }],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      payments: rows,
      pagination: { total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/earnings — Owner earnings summary
const getOwnerEarnings = async (req, res, next) => {
  try {
    const properties = await Property.findAll({ where: { owner_id: req.user.id }, attributes: ['id'] });
    const propertyIds = properties.map(p => p.id);

    const bookings = await Booking.findAll({
      where: { property_id: { [Op.in]: propertyIds }, status: { [Op.in]: ['confirmed', 'completed'] } },
      include: [{ model: Payment, as: 'payments', where: { status: 'completed' }, required: false }]
    });

    const completedBookings = bookings.filter(b => b.payments && b.payments.length > 0);
    const sumPayments = (payments) => (payments || []).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    
    const totalEarnings = completedBookings.reduce((sum, b) => sum + sumPayments(b.payments), 0);
    const thisMonth = new Date();
    const monthlyBookings = completedBookings.filter(b => {
      const d = new Date(b.createdAt);
      return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
    });
    const monthlyEarnings = monthlyBookings.reduce((sum, b) => sum + sumPayments(b.payments), 0);

    res.json({
      earnings: {
        total: Math.round(totalEarnings * 100) / 100,
        monthly: Math.round(monthlyEarnings * 100) / 100,
        total_completed_bookings: completedBookings.length,
        monthly_bookings: monthlyBookings.length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder, verifyPayment, razorpayWebhook,
  refundPayment, getPayments, getOwnerEarnings
};
