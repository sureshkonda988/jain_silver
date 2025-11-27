# How to Update Store Information

To update store information (phone number, address, timings, social media, bank details), edit the file:

**`backend/routes/store.js`**

## Fields to Update:

1. **Welcome Message**: Update `welcomeMessage` in `defaultStoreInfo` object
2. **Address**: Update `address` field
3. **Phone Number**: Update `phoneNumber` field
4. **Store Timings**: Update the `storeTimings` array with your actual timings
5. **Social Media**:
   - `instagram`: Your Instagram profile/page URL
   - `facebook`: Your Facebook page URL
   - `youtube`: Your YouTube channel URL
6. **Bank Details**: Update the `bankDetails` array with your actual bank account information

## Example:

```javascript
const defaultStoreInfo = {
  welcomeMessage: 'Your custom welcome message here',
  address: 'Your complete store address here',
  phoneNumber: '+91-9876543210', // Your actual phone number
  storeTimings: [
    { day: 'Monday', openTime: '09:00 AM', closeTime: '08:00 PM', isClosed: false },
    { day: 'Tuesday', openTime: '09:00 AM', closeTime: '08:00 PM', isClosed: false },
    // ... update all days
    { day: 'Sunday', openTime: '10:00 AM', closeTime: '06:00 PM', isClosed: false },
  ],
  instagram: 'https://www.instagram.com/your_instagram_handle',
  facebook: 'https://www.facebook.com/your_facebook_page',
  youtube: 'https://www.youtube.com/@your_youtube_channel',
  bankDetails: [
    {
      bankName: 'Your Bank Name',
      accountNumber: '123456789012',
      ifscCode: 'BANK0001234',
      accountHolderName: 'Jain Silver',
      branch: 'Your Branch Name',
    },
    // Add more bank accounts if needed
  ],
};
```

## After Updating:

1. **For Local Development**: Restart your backend server
2. **For Production (Vercel)**: 
   - Commit and push changes to your Git repository
   - Vercel will automatically redeploy with the new information
   - Or manually trigger a redeploy from Vercel dashboard

## Notes:

- All fields are optional - the app will handle missing fields gracefully
- You can add multiple bank accounts by adding more objects to the `bankDetails` array
- Store timings support `isClosed: true` for closed days
- Social media URLs should be full URLs (starting with https://)

