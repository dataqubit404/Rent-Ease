const { sequelize } = require('../models');

const cleanup = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    // Get all indexes for users table
    const [results] = await sequelize.query('SHOW INDEX FROM users');
    
    // Filter for email indexes (excluding the one we want to keep, or just all redundant ones)
    // Sequelize often adds 'email', 'email_2', 'users_email_unique', etc.
    const emailIndexes = results
      .filter(idx => idx.Column_name === 'email' && !idx.Key_name.includes('PRIMARY'))
      .map(idx => idx.Key_name);

    console.log(`Found ${emailIndexes.length} indexes on email column:`, emailIndexes);

    if (emailIndexes.length > 1) {
      // Keep only one, or drop all and let the model re-create it once we re-enable alter (safely)
      // Actually, safest is to drop all redundant ones
      for (let i = 1; i < emailIndexes.length; i++) {
        const indexName = emailIndexes[i];
        console.log(`Dropping redundant index: ${indexName}...`);
        try {
          await sequelize.query(`ALTER TABLE users DROP INDEX \`${indexName}\``);
        } catch (err) {
          console.error(`Failed to drop ${indexName}:`, err.message);
        }
      }
    } else {
      console.log('No redundant indexes found.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
};

cleanup();
