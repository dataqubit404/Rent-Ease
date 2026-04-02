module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
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
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    total_nights: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'rejected'),
      defaultValue: 'pending'
    },
    payment_plan: {
      type: DataTypes.ENUM('full', 'monthly'),
      defaultValue: 'full'
    },
    billing_cycle_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    guests: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    special_requests: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rent_due_day: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 28 }
    }
  }, {
    tableName: 'bookings',
    timestamps: true
  });

  return Booking;
};
