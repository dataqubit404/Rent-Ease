require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize, User } = require('../models');
const logger = require('../utils/logger');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@rentease.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Platform Admin';

async function seedAdmin() {
  try {
    // Only authenticate if not already connected
    try {
      await sequelize.authenticate();
    } catch (e) {
      // If already connected or sync handled elsewhere, ignore
    }

    const email = process.env.ADMIN_EMAIL || 'admin@rentease.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@1234';
    const name = process.env.ADMIN_NAME || 'Platform Admin';

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      if (existing.role !== 'admin') {
        await existing.update({ role: 'admin' });
        logger.info(`Admin role verified for: ${email}`);
      }
    } else {
      await User.create({
        name,
        email,
        password,
        role: 'admin',
        is_active: true,
        is_verified: true,
      });
      logger.info(`✅ Initial Admin user created: ${email}`);
    }
    return true;
  } catch (error) {
    logger.error('❌ Admin seed failed:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  seedAdmin().then(() => process.exit());
}

module.exports = seedAdmin;
