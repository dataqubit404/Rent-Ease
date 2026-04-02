const { Notification } = require('../models');
const { Op } = require('sequelize');

// GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, is_read } = req.query;
    const offset = (page - 1) * limit;
    const where = { user_id: req.user.id };
    if (is_read !== undefined) where.is_read = is_read === 'true';

    const { count, rows } = await Notification.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    const unreadCount = await Notification.count({ where: { user_id: req.user.id, is_read: false } });

    res.json({
      notifications: rows,
      unread_count: unreadCount,
      pagination: { total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    await notif.update({ is_read: true });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.user.id, is_read: false } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res, next) => {
  try {
    await Notification.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
