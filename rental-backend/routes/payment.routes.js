const paymentRouter = require('express').Router();
const express = require('express');
const { body } = require('express-validator');
const { createOrder, verifyPayment, razorpayWebhook, refundPayment, getPayments, getOwnerEarnings } = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// Public webhook route
paymentRouter.post('/webhook', express.json(), razorpayWebhook);

// Protected routes
paymentRouter.use(authenticate);

paymentRouter.get('/', getPayments);
paymentRouter.get('/earnings', authorize('owner'), getOwnerEarnings);

paymentRouter.post('/create-order', authorize('tenant'), [
  body('booking_id').isUUID(),
  validate
], createOrder);

paymentRouter.post('/verify', authorize('tenant'), [
  body('razorpay_order_id').notEmpty(),
  body('razorpay_payment_id').notEmpty(),
  body('razorpay_signature').notEmpty(),
  body('booking_id').isUUID(),
  validate
], verifyPayment);

paymentRouter.post('/:id/refund', authorize('admin', 'owner'), refundPayment);

module.exports = paymentRouter;
