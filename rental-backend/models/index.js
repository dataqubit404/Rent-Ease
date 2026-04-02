const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];
const logger = require('../utils/logger');

logger.info(`Starting DB connection for environment: ${env}`);
if (dbConfig.url) {
  const obfuscatedUrl = dbConfig.url.replace(/:([^@]+)@/, ':****@');
  logger.info(`Connecting via URL: ${obfuscatedUrl}`);
} else {
  logger.info(`Connecting via separate vars: ${dbConfig.host}:${dbConfig.port} DB: ${dbConfig.database}`);
}

let sequelize;
if (dbConfig.url) {
  sequelize = new Sequelize(dbConfig.url, {
    dialect: dbConfig.dialect || 'mysql',
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions
  });
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect || 'mysql',
      logging: dbConfig.logging,
      pool: dbConfig.pool,
      dialectOptions: dbConfig.dialectOptions
    }
  );
}

// Import Models
const User = require('./user.model')(sequelize, Sequelize.DataTypes);
const Property = require('./property.model')(sequelize, Sequelize.DataTypes);
const Booking = require('./booking.model')(sequelize, Sequelize.DataTypes);
const Payment = require('./payment.model')(sequelize, Sequelize.DataTypes);
const MaintenanceRequest = require('./maintenance.model')(sequelize, Sequelize.DataTypes);
const Review = require('./review.model')(sequelize, Sequelize.DataTypes);
const Notification = require('./notification.model')(sequelize, Sequelize.DataTypes);

// ─── Associations ─────────────────────────────────────────────────────────────

// User → Properties (Owner)
User.hasMany(Property, { foreignKey: 'owner_id', as: 'properties' });
Property.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// User → Bookings (Tenant)
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'tenant' });

// Property → Bookings
Property.hasMany(Booking, { foreignKey: 'property_id', as: 'bookings' });
Booking.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// Booking → Payments
Booking.hasMany(Payment, { foreignKey: 'booking_id', as: 'payments' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// User → Maintenance Requests
User.hasMany(MaintenanceRequest, { foreignKey: 'user_id', as: 'maintenanceRequests' });
MaintenanceRequest.belongsTo(User, { foreignKey: 'user_id', as: 'tenant' });

// Property → Maintenance Requests
Property.hasMany(MaintenanceRequest, { foreignKey: 'property_id', as: 'maintenanceRequests' });
MaintenanceRequest.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// User → Reviews
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'reviewer' });

// Property → Reviews
Property.hasMany(Review, { foreignKey: 'property_id', as: 'reviews' });
Review.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// User → Notifications
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Property,
  Booking,
  Payment,
  MaintenanceRequest,
  Review,
  Notification
};
