const router = require('express').Router();
const { body } = require('express-validator');
const { createRequest, getRequests, getRequestById, updateStatus, deleteRequest } = require('../controllers/maintenance.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

router.use(authenticate);
router.get('/', getRequests);
router.post('/', authorize('tenant'), [
  body('property_id').isUUID(),
  body('title').notEmpty().withMessage('Title required'),
  body('issue').notEmpty().withMessage('Issue description required'),
  body('category').optional().isIn(['plumbing','electrical','hvac','appliance','structural','pest','other']),
  body('priority').optional().isIn(['low','medium','high','urgent']),
  validate
], createRequest);
router.get('/:id', getRequestById);
router.patch('/:id/status', authenticate, [
  body('status').isIn(['pending', 'in_progress', 'resolved', 'closed', 'rejected']),
  validate
], updateStatus);
router.delete('/:id', deleteRequest);

module.exports = router;
