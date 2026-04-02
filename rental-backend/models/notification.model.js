module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM(
        'booking_confirmed', 'booking_cancelled', 'booking_pending',
        'payment_received', 'payment_failed', 'payment_refunded',
        'maintenance_update', 'review_received', 'general'
      ),
      defaultValue: 'general'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reference_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    tableName: 'notifications',
    timestamps: true
  });

  return Notification;
};
