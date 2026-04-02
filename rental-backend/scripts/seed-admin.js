require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize, User } = require('../models');
const logger = require('../utils/logger');

const ADMIN_EMAIL = 'admin@rentease.com';
const ADMIN_PASSWORD = 'Admin@1234';
const ADMIN_NAME = 'Platform Admin';

async function seedAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync to ensure tables exist
    await sequelize.sync();

    const existing = await User.findOne({ where: { email: ADMIN_EMAIL } });
    if (existing) {
      console.log(`⚠️  Admin user already exists: ${ADMIN_EMAIL}`);
      if (existing.role !== 'admin') {
        await existing.update({ role: 'admin' });
        console.log('   → Role updated to admin');
      }
    } else {
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        is_active: true,
        is_verified: true,
      });
      console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
    }

    console.log('\n───────────────────────────────────');
    console.log('  Admin Login Credentials');
    console.log('───────────────────────────────────');
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log('───────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seedAdmin();
