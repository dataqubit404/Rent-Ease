module.exports = (sequelize, DataTypes) => {
  const MaintenanceRequest = sequelize.define('MaintenanceRequest', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    property_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    assigned_to: {
      type: DataTypes.UUID,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    issue: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'pest', 'other'),
      defaultValue: 'other'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'resolved', 'closed', 'rejected'),
      defaultValue: 'pending'
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    resolution_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'maintenance_requests',
    timestamps: true
  });

  return MaintenanceRequest;
};
