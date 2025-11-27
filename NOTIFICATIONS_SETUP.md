# Admin Notifications Setup

## Overview
Admin receives notifications (WhatsApp + Mobile Push) when a new user registers.

## WhatsApp Notification Setup

### Step 1: Get Twilio Account
1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token
3. Enable WhatsApp Sandbox (for testing) or get WhatsApp Business API access

### Step 2: Configure Environment Variables
Add to `backend/.env`:
```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Step 3: Test WhatsApp
1. For testing, use Twilio Sandbox:
   - Send "join [your-keyword]" to +1 415 523 8886
   - You'll receive messages on that number

2. For production:
   - Get WhatsApp Business API access
   - Update `TWILIO_WHATSAPP_FROM` with your business number

### Admin Phone Number
- Currently set to: **9492664870**
- Update in `backend/utils/notifications.js` if needed

## Mobile Push Notifications

### Current Implementation
- Logs notifications to console
- Ready for FCM (Firebase Cloud Messaging) integration

### To Enable Push Notifications:
1. Set up Firebase project
2. Install `@react-native-firebase/messaging`
3. Get FCM token from admin device
4. Store token in user document
5. Update `sendPushNotification` function

## Notification Flow

1. **User Registers** → Backend receives registration
2. **Admin Notified**:
   - WhatsApp message sent to 9492664870
   - Push notification logged (ready for FCM)
3. **Message Content**:
   ```
   🔔 New User Registration
   
   Name: [User Name]
   Email: [Email]
   Phone: [Phone]
   Status: Pending Approval
   
   Please review documents and approve.
   ```

## Testing

### Without Twilio (Demo Mode)
- Notifications are logged to console
- Check backend terminal for notification messages
- Format: `📱 WhatsApp Message (Demo): [message]`

### With Twilio
- Install dependencies: `npm install` in backend
- Configure `.env` with Twilio credentials
- Restart backend server
- Test by registering a new user

## Troubleshooting

### WhatsApp Not Working
- Check Twilio credentials in `.env`
- Verify phone number format: `whatsapp:+91[number]`
- Check Twilio console for errors
- Ensure WhatsApp Sandbox is activated (for testing)

### Push Notifications Not Working
- Currently in demo mode (console logs)
- Integrate FCM for actual push notifications
- See Firebase documentation for setup

## Production Notes

- Remove demo OTP from API responses
- Use production Twilio account
- Set up proper FCM for push notifications
- Consider rate limiting for notifications
- Add notification preferences for admin

