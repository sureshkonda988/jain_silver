# Admin Workflow - View Documents & Approve Users

## Complete Admin Workflow

### Step 1: Admin Login
1. Open the app
2. Tap **"Admin Login"**
3. Enter credentials:
   - Email: `admin@jainsilver.com`
   - Password: `admin123`

### Step 2: View Registered Users
After login, you'll see the **Admin Dashboard** with:
- **Pending Users** tab: Shows users waiting for approval
- **All Users** tab: Shows complete list of all users

### Step 3: View User Documents
1. Find the user you want to review in the list
2. Tap **"View Documents"** button on their card
3. You'll see:
   - User's personal information (Name, Email, Phone, Status)
   - **Aadhar Card Front** image
   - **Aadhar Card Back** image
   - **Aadhar Number**
   - **PAN Card** image
   - **PAN Number**

### Step 4: Approve or Reject
While viewing documents:
- **Approve User**: Tap the green **"Approve User"** button
  - Confirmation dialog will appear
  - User status changes to "approved"
  - User can now login to the app
  
- **Reject User**: Tap the red **"Reject User"** button
  - Enter rejection reason
  - User status changes to "rejected"

### Step 5: Return to Dashboard
- Tap **"Back to Dashboard"** to return
- Approved/rejected users will update in the list

## Demo OTP Feature

### For User Registration:
1. User registers with documents
2. After registration, an alert shows: **"Demo OTP: 123456"**
3. User is taken to OTP verification screen
4. OTP is **automatically filled** and displayed in a blue card
5. User can verify immediately

### OTP Display:
- **Registration**: OTP shown in alert and passed to verification screen
- **Verification Screen**: OTP displayed in a highlighted blue card
- **Resend OTP**: New OTP shown in alert and auto-filled

### Important Notes:
- OTP is shown for **demo/testing purposes only**
- In production, remove OTP from API responses
- OTP is also logged in backend console

## User Registration Flow

1. **User Registration**:
   - Fill registration form
   - Upload Aadhar (front & back)
   - Upload PAN card
   - Submit registration

2. **OTP Verification**:
   - Demo OTP is shown automatically
   - User verifies OTP
   - Account status: **Pending** (waiting for admin approval)

3. **Admin Approval**:
   - Admin views documents
   - Admin approves user
   - User can now login

## Features

### Document Viewing
- ✅ View all uploaded documents
- ✅ See document numbers (Aadhar & PAN)
- ✅ Images load from backend server
- ✅ Scroll to view all documents

### Approval Actions
- ✅ Approve directly from document view
- ✅ Reject with reason
- ✅ Status updates immediately
- ✅ Auto-return to dashboard after approval

### Demo OTP
- ✅ OTP shown in registration alert
- ✅ OTP displayed on verification screen
- ✅ OTP auto-filled in input field
- ✅ Resend shows new OTP

## Technical Details

### Backend Endpoints Used:
- `GET /api/admin/pending-users` - Get pending users
- `GET /api/admin/users` - Get all users
- `GET /api/admin/user/:userId` - Get user with documents
- `PUT /api/admin/approve-user/:userId` - Approve user
- `PUT /api/admin/reject-user/:userId` - Reject user

### Document URLs:
- Format: `http://your-backend:5000/uploads/documents/filename`
- Served via Express static middleware
- Protected by admin authentication

## Security Notes

- Only admins can view documents
- Documents require JWT authentication
- Approval/rejection requires admin role
- OTP shown only in development (remove in production)

