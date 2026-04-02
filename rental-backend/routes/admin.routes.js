const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { User, Property, Booking, Payment } = require('../models');
const { Op } = require('sequelize');

router.use(authenticate);
router.use(authorize('admin'));

// GET /api/admin/stats — Full platform statistics
router.get('/stats', async (req, res, next) => {
  try {
    // User stats
    const [totalUsers, tenants, owners, admins, activeUsers] = await Promise.all([
      User.count(),
      User.count({ where: { role: 'tenant' } }),
      User.count({ where: { role: 'owner' } }),
      User.count({ where: { role: 'admin' } }),
      User.count({ where: { is_active: true } }),
    ]);

    // Property stats
    const [totalProperties, approvedProperties, pendingProperties] = await Promise.all([
      Property.count(),
      Property.count({ where: { is_approved: true } }),
      Property.count({ where: { is_approved: false } }),
    ]);

    // Booking stats
    const [totalBookings, confirmedBookings, pendingBookings, cancelledBookings, completedBookings] = await Promise.all([
      Booking.count(),
      Booking.count({ where: { status: 'confirmed' } }),
      Booking.count({ where: { status: 'pending' } }),
      Booking.count({ where: { status: 'cancelled' } }),
      Booking.count({ where: { status: 'completed' } }),
    ]);

    // Revenue stats
    const completedPayments = await Payment.findAll({
      where: { status: 'completed' },
      attributes: ['amount'],
    });
    const totalRevenue = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    // This month's revenue
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyPayments = await Payment.findAll({
      where: {
        status: 'completed',
        paid_at: { [Op.gte]: startOfMonth },
      },
      attributes: ['amount'],
    });
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    res.json({
      stats: {
        users: { total: totalUsers, tenants, owners, admins, active: activeUsers },
        properties: { total: totalProperties, approved: approvedProperties, pending: pendingProperties },
        bookings: { total: totalBookings, confirmed: confirmedBookings, pending: pendingBookings, cancelled: cancelledBookings, completed: completedBookings },
        revenue: { total: Math.round(totalRevenue * 100) / 100, monthly: Math.round(monthlyRevenue * 100) / 100 },
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/payments — All payments on the platform
router.get('/payments', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [{
        model: Booking, as: 'booking',
        include: [
          { model: Property, as: 'property', attributes: ['id', 'title', 'images'] },
          { model: User, as: 'tenant', attributes: ['id', 'name', 'email'] },
        ]
      }],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      payments: rows,
      pagination: { total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
