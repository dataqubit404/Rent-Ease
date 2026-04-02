// booking.routes.js
const bookingRouter = require('express').Router();
const { body } = require('express-validator');
const { createBooking, getBookings, getBookingById, updateBookingStatus, getPropertyBookingCalendar } = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

bookingRouter.use(authenticate);
bookingRouter.get('/', getBookings);
bookingRouter.post('/', authorize('tenant'), [
  body('property_id').isUUID().withMessage('Valid property ID required'),
  body('start_date').isDate().withMessage('Valid start date required'),
  body('end_date').isDate().withMessage('Valid end date required'),
  body('guests').optional().isInt({ min: 1 }),
  validate
], createBooking);
bookingRouter.get('/calendar/:property_id', getPropertyBookingCalendar);
bookingRouter.get('/:id', getBookingById);
bookingRouter.patch('/:id/status', [
  body('status').isIn(['confirmed', 'cancelled', 'rejected', 'completed']),
  validate
], updateBookingStatus);

module.exports = bookingRouter;
