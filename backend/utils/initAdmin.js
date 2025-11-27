const User = require('../models/User');

const initAdmin = async () => {
  try {
    // Default admin credentials - stored in MongoDB
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@jainsilver.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    // Check if admin exists by email or by role
    let existingAdmin = await User.findOne({ 
      $or: [
        { role: 'admin', email: adminEmail },
        { role: 'admin' }
      ]
    });
    
    if (!existingAdmin) {
      // Create new admin user
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
      console.log('✅ Admin user created successfully in MongoDB');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      console.log('⚠️  Please change the password after first login!');
    } else {
      // Update existing admin password if it's the default
      if (existingAdmin.email === adminEmail) {
        // Check if password needs to be updated
        const isPasswordValid = await existingAdmin.comparePassword(adminPassword);
        if (!isPasswordValid) {
          // Update password to default if it doesn't match
          existingAdmin.password = adminPassword;
          await existingAdmin.save();
          console.log('✅ Admin password updated to default');
        }
      }
      console.log('✅ Admin user already exists in MongoDB');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.name}`);
    }
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    throw error;
  }
};

module.exports = initAdmin;

