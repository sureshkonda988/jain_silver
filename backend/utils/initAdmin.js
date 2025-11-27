const User = require('../models/User');

const initAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@jainsilver.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await User.findOne({ role: 'admin', email: adminEmail });
    
    if (!existingAdmin) {
      const admin = new User({
        name: 'Admin',
        email: adminEmail,
        phone: '9999999999',
        password: adminPassword,
        role: 'admin',
        status: 'approved',
        isVerified: true
      });

      await admin.save();
      console.log('Admin user created successfully');
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
};

module.exports = initAdmin;

