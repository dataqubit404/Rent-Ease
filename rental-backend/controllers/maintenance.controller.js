const { MaintenanceRequest, User, Property } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

// POST /api/maintenance
const createRequest = async (req, res, next) => {
  try {
    const { property_id, title, issue, category, priority, images } = req.body;

    const property = await Property.findByPk(property_id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    const request = await MaintenanceRequest.create({
      user_id: req.user.id,
      property_id,
      title,
      issue,
      category: category || 'other',
      priority: priority || 'medium',
      images: images || [],
      status: 'pending'
    });

    // Notify owner
    await notificationService.create(
      property.owner_id,
      'New Maintenance Request',
      `${req.user.name} submitted a maintenance request: "${title}" for property "${property.title}"`,
      'maintenance_update', request.id, 'maintenance'
    );

    res.status(201).json({ message: 'Maintenance request submitted', request });
  } catch (error) {
    next(error);
  }
};

// GET /api/maintenance
const getRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, category, priority } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    if (req.user.role === 'tenant') {
      where.user_id = req.user.id;
    } else if (req.user.role === 'owner') {
      const properties = await Property.findAll({ where: { owner_id: req.user.id }, attributes: ['id'] });
      where.property_id = { [Op.in]: properties.map(p => p.id) };
    }

    const { count, rows } = await MaintenanceRequest.findAndCountAll({
      where,
      include: [
        { model: Property, as: 'property', attributes: ['id', 'title', 'location'] },
        { model: User, as: 'tenant', attributes: ['id', 'name', 'email', 'avatar'] }
      ],
      limit: parseInt(limit),
      offset,
      order: [
        ['priority', 'DESC'], // Simplified sort to avoid crash
        ['createdAt', 'DESC']
      ]
    });

    res.json({
      requests: rows,
      pagination: { total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/maintenance/:id
const getRequestById = async (req, res, next) => {
  try {
    const request = await MaintenanceRequest.findByPk(req.params.id, {
      include: [
        { model: Property, as: 'property' },
        { model: User, as: 'tenant', attributes: ['id', 'name', 'email', 'phone'] }
      ]
    });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json({ request });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/maintenance/:id/status — Handle update flow
const updateStatus = async (req, res, next) => {
  try {
    const { status, resolution_notes, scheduled_at } = req.body;
    const request = await MaintenanceRequest.findByPk(req.params.id, {
      include: [{ model: Property, as: 'property' }]
    });
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const isOwner = request.property?.owner_id === req.user.id;
    const isTenant = request.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    // 1. Authorized role check
    if (!isAdmin && !isOwner && !isTenant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // 2. Owner role actions: pending -> in_progress -> resolved
    if (isOwner && !isAdmin) {
      if (!['in_progress', 'resolved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Owners can only set status to In Progress, Resolved, or Rejected' });
      }
      if (request.status === 'closed') {
        return res.status(400).json({ error: 'Ticket is already closed' });
      }
    }

    // 3. Tenant role actions: resolved -> closed (confirmation) or -> in_progress (reopen)
    if (isTenant && !isOwner && !isAdmin) {
      if (status === 'closed') {
        if (request.status !== 'resolved') {
          return res.status(400).json({ error: 'Wait for owner to mark it resolved before closing' });
        }
      } else if (status === 'in_progress') {
        if (request.status !== 'resolved') {
          return res.status(400).json({ error: 'Can only reopen if marked as resolved' });
        }
      } else {
        return res.status(400).json({ error: 'Tenants can only Close or Reopen a resolved request' });
      }
    }

    const updates = { status };
    if (resolution_notes) updates.resolution_notes = resolution_notes;
    if (scheduled_at) updates.scheduled_at = scheduled_at;
    if (status === 'resolved') updates.resolved_at = new Date();

    await request.update(updates);

    // Notify appropriate party
    const targetUserId = isOwner || isAdmin ? request.user_id : request.property.owner_id;
    const statusMessages = {
      in_progress: 'Maintenance request is now in progress',
      resolved: 'Owner says the issue is resolved. Please confirm.',
      closed: 'Tenant confirmed the issue as solved.',
      rejected: 'Maintenance request was rejected'
    };

    if (statusMessages[status]) {
      await notificationService.create(
        targetUserId,
        'Maintenance Update',
        statusMessages[status],
        'maintenance_update', request.id, 'maintenance'
      );
    }

    res.json({ message: 'Status updated', request });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/maintenance/:id
const deleteRequest = async (req, res, next) => {
  try {
    const request = await MaintenanceRequest.findByPk(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await request.destroy();
    res.json({ message: 'Request deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRequest, getRequests, getRequestById, updateStatus, deleteRequest };
