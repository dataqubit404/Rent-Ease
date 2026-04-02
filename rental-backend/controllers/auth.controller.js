const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const emailService = require('../services/email.service');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const allowedRoles = ['tenant', 'owner'];
    const userRole = allowedRoles.includes(role) ? role : 'tenant';

    const user = await User.create({ name, email, password, role: userRole, phone });
    const token = generateToken(user);

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(user).catch(err =>
      logger.error('Welcome email failed:', err)
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated. Contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await user.update({ last_login: new Date() });
    const token = generateToken(user);

    res.json({ message: 'Login successful', token, user });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    // Always return success to prevent user enumeration
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.update({ reset_token: resetToken, reset_token_expires: resetTokenExpires });

    emailService.sendPasswordResetEmail(user, resetToken).catch(err =>
      logger.error('Password reset email failed:', err)
    );

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      where: {
        reset_token: token,
      }
    });

    if (!user || !user.reset_token_expires || new Date() > user.reset_token_expires) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    await user.update({ password, reset_token: null, reset_token_expires: null });

    res.json({ message: 'Password reset successful. Please login.' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    await user.update({ password: newPassword });
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword, changePassword };
