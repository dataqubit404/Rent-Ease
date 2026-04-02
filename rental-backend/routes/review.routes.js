const reviewRouter = require('express').Router();
const { body } = require('express-validator');
const { createReview, getPropertyReviews, getMyReviews, updateReview, deleteReview, ownerResponse } = require('../controllers/review.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

reviewRouter.get('/property/:property_id', getPropertyReviews);
reviewRouter.use(authenticate);
reviewRouter.get('/me', getMyReviews);
reviewRouter.post('/', authorize('tenant'), [
  body('property_id').isUUID(),
  body('booking_id').isUUID(),
  body('rating').isInt({ min: 1, max: 5 }),
  validate
], createReview);
reviewRouter.put('/:id', updateReview);
reviewRouter.delete('/:id', deleteReview);
reviewRouter.post('/:id/owner-response', authorize('owner'), ownerResponse);

module.exports = reviewRouter;
