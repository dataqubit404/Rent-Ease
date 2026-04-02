module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    booking_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR'
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    payment_method: {
      type: DataTypes.ENUM('razorpay', 'card', 'upi', 'bank_transfer', 'stripe'),
      defaultValue: 'razorpay'
    },
    // Razorpay fields
    razorpay_order_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    razorpay_payment_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    razorpay_signature: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    // Legacy Stripe fields (kept for backward compat)
    stripe_payment_intent_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    stripe_charge_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    transaction_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refund_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failure_reason: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    installment_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    billing_period_start: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    billing_period_end: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    tableName: 'payments',
    timestamps: true
  });

  return Payment;
};
