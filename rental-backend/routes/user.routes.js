const router = require('express').Router();
const { getAllUsers, getUserById, updateProfile, updateUser, deleteUser, getUserStats } = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', authorize('admin'), getAllUsers);
router.get('/stats', authorize('admin'), getUserStats);
router.put('/profile', updateProfile);
router.get('/:id', getUserById);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
