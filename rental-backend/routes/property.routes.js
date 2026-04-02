const router = require('express').Router();
const { body } = require('express-validator');
const {
  getAllProperties, getPropertyById, createProperty, updateProperty,
  deleteProperty, getOwnerProperties, approveProperty, checkAvailability,
  adminGetAllProperties
} = require('../controllers/property.controller');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// Public routes
router.get('/', optionalAuth, getAllProperties);
router.get('/admin/all', authenticate, authorize('admin'), adminGetAllProperties);
router.get('/owner/mine', authenticate, authorize('owner', 'admin'), getOwnerProperties);
router.get('/:id', optionalAuth, getPropertyById);
router.get('/:id/availability', checkAvailability);

// Protected routes
router.post('/', authenticate, authorize('owner', 'admin'), [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').notEmpty().withMessage('Description required'),
  body('listing_type').optional().isIn(['short_term', 'long_term']),
  body('price_per_night').custom((value, { req }) => {
    if (req.body.listing_type === 'short_term' && (!value || value <= 0)) {
      throw new Error('Valid price per night is required for short-term listings');
    }
    return true;
  }),
  body('monthly_rent').custom((value, { req }) => {
    if (req.body.listing_type === 'long_term' && (!value || value <= 0)) {
      throw new Error('Valid monthly rent is required for long-term listings');
    }
    return true;
  }),
  body('location').notEmpty().withMessage('Location required'),
  validate
], createProperty);

router.put('/:id', authenticate, authorize('owner', 'admin'), updateProperty);
router.delete('/:id', authenticate, authorize('owner', 'admin'), deleteProperty);
router.patch('/:id/approve', authenticate, authorize('admin'), approveProperty);

module.exports = router;
