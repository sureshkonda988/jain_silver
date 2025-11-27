const axios = require('axios');

// Admin phone number for WhatsApp notifications
const ADMIN_PHONE = '9492664870';

/**
 * Send WhatsApp notification to admin using Twilio API
 * Note: Requires Twilio account and credentials
 */
const sendWhatsAppNotification = async (message) => {
  try {
    // Using Twilio WhatsApp API
    // You need to set these in .env:
    // TWILIO_ACCOUNT_SID=your_account_sid
    // TWILIO_AUTH_TOKEN=your_auth_token
    // TWILIO_WHATSAPP_FROM=whatsapp:+14155238886 (Twilio sandbox number)
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
    const toNumber = `whatsapp:+91${ADMIN_PHONE}`;

    if (!accountSid || !authToken) {
      console.log('⚠️ Twilio credentials not configured. WhatsApp notification skipped.');
      console.log(`📱 WhatsApp Message (Demo): ${message}`);
      return;
    }

    let twilio;
    try {
      twilio = require('twilio');
    } catch (error) {
      console.error('⚠️ Twilio module not found. Install with: npm install twilio');
      console.log(`📱 WhatsApp Message (Demo): ${message}`);
      return;
    }

    const client = twilio(accountSid, authToken);

    await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: message
    });

    console.log(`✅ WhatsApp notification sent to admin: ${ADMIN_PHONE}`);
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error.message);
    console.log(`📱 WhatsApp Message (Demo): ${message}`);
  }
};

/**
 * Send push notification to admin devices
 * This would integrate with FCM (Firebase Cloud Messaging) or similar
 */
const sendPushNotification = async (title, body, data = {}) => {
  try {
    // For now, we'll log it. In production, integrate with FCM
    console.log(`📲 Push Notification to Admin:`);
    console.log(`   Title: ${title}`);
    console.log(`   Body: ${body}`);
    console.log(`   Data:`, data);
    
    // TODO: Integrate with FCM or Expo Push Notifications
    // Example with FCM:
    // const admin = await User.findOne({ role: 'admin' });
    // if (admin && admin.fcmToken) {
    //   await sendFCMNotification(admin.fcmToken, title, body, data);
    // }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

/**
 * Notify admin about new user registration
 */
const notifyAdminNewRegistration = async (userData) => {
  const message = `🔔 New User Registration\n\n` +
    `Name: ${userData.name}\n` +
    `Email: ${userData.email}\n` +
    `Phone: ${userData.phone}\n` +
    `Status: Pending Approval\n\n` +
    `Please review documents and approve.`;

  // Send WhatsApp notification
  await sendWhatsAppNotification(message);

  // Send push notification
  await sendPushNotification(
    'New User Registration',
    `${userData.name} has registered and is pending approval`,
    {
      type: 'new_registration',
      userId: userData._id.toString(),
      userName: userData.name
    }
  );
};

module.exports = {
  sendWhatsAppNotification,
  sendPushNotification,
  notifyAdminNewRegistration
};

