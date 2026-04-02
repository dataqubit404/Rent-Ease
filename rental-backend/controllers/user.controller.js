const { User, Property, Booking, Review } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// GET /api/users — Admin only
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, is_active } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (role) where.role = role;
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password', 'reset_token', 'reset_token_expires'] }
    });

    res.json({
      users: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'reset_token', 'reset_token_expires'] }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/profile — Update own profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByPk(req.user.id);
    await user.update({ name, phone, avatar });
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id — Admin update user
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, role, is_active, phone } = req.body;
    await user.update({ name, role, is_active, phone });
    res.json({ message: 'User updated', user });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id — Admin only
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }
    await user.update({ is_active: false });
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/stats — Admin dashboard stats
const getUserStats = async (req, res, next) => {
  try {
    const [total, tenants, owners, active] = await Promise.all([
      User.count(),
      User.count({ where: { role: 'tenant' } }),
      User.count({ where: { role: 'owner' } }),
      User.count({ where: { is_active: true } })
    ]);

    res.json({ stats: { total, tenants, owners, active, inactive: total - active } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateProfile, updateUser, deleteUser, getUserStats };
