const { Notification } = require('../models');
const logger = require('../utils/logger');

/**
 * Create an in-app notification
 */
const create = async (user_id, title, message, type = 'general', reference_id = null, reference_type = null, metadata = {}) => {
  try {
    const notification = await Notification.create({
      user_id,
      title,
      message,
      type,
      reference_id,
      reference_type,
      metadata
    });
    return notification;
  } catch (error) {
    logger.error('Failed to create notification:', error);
    return null;
  }
};

/**
 * Mark multiple notifications as read
 */
const markRead = async (user_id, ids = []) => {
  const where = { user_id };
  if (ids.length) where.id = ids;
  await Notification.update({ is_read: true }, { where });
};

/**
 * Get unread count for a user
 */
const getUnreadCount = async (user_id) => {
  return Notification.count({ where: { user_id, is_read: false } });
};

module.exports = { create, markRead, getUnreadCount };
