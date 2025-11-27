# How to View User Documents (Admin Feature)

## Overview
Admins can now view all documents uploaded by registered users, including Aadhar cards (front & back) and PAN cards.

## How to Access

### Step 1: Login as Admin
1. Open the app
2. Tap "Admin Login"
3. Enter admin credentials:
   - Email: `admin@jainsilver.com`
   - Password: `admin123`

### Step 2: Navigate to User List
- You'll see the Admin Dashboard with two tabs:
  - **Pending Users**: Users waiting for approval
  - **All Users**: Complete list of all registered users

### Step 3: View Documents
1. Find the user you want to review
2. Tap the **"View Documents"** button on their card
3. You'll be taken to the User Documents screen showing:
   - User's personal information
   - Aadhar Card (Front & Back)
   - PAN Card
   - Document numbers (Aadhar & PAN)

## What You'll See

### User Documents Screen Shows:
- **Personal Information**:
  - Name
  - Email
  - Phone
  - Account Status

- **Aadhar Card**:
  - Front image
  - Back image
  - Aadhar number

- **PAN Card**:
  - PAN card image
  - PAN number

## Features

### Document Viewing
- Documents are displayed as images
- You can scroll to view all documents
- Images are loaded from the server's uploads directory

### Approval Workflow
1. View user documents
2. Review all uploaded documents
3. Go back to dashboard
4. Approve or reject the user based on document verification

## Technical Details

### Backend API
- **Endpoint**: `GET /api/admin/user/:userId`
- **Authentication**: Requires admin JWT token
- **Returns**: Complete user object with documents

### Document Storage
- Documents are stored in: `backend/uploads/documents/`
- Files are served via: `http://your-backend-url/uploads/documents/filename`
- Supported formats: Images (JPEG, PNG) and PDFs

### Mobile App
- **Screen**: `UserDocumentsScreen.js`
- **Navigation**: Accessible from Admin Dashboard
- **Image Loading**: Uses React Native Image component

## Troubleshooting

### Documents Not Loading
1. **Check Backend URL**: 
   - Update `mobile-app/screens/UserDocumentsScreen.js` line 40
   - Ensure it matches your backend IP address

2. **Check File Permissions**:
   - Ensure `backend/uploads/documents/` directory exists
   - Verify files are uploaded correctly

3. **Check Network**:
   - Ensure mobile device and backend are on same network
   - Check backend server is running

### Images Not Displaying
- Verify document filenames in database match actual files
- Check backend `/uploads` route is working
- Test URL directly in browser: `http://your-backend:5000/uploads/documents/filename.jpg`

## Security Notes

- Only admins can view user documents
- Documents are protected by JWT authentication
- Document URLs require valid admin token
- Consider adding additional security in production (e.g., signed URLs, expiration)

## Future Enhancements

Possible improvements:
- Download documents
- Zoom/pan for images
- Document verification status
- Comments/notes on documents
- Document approval/rejection from document view

