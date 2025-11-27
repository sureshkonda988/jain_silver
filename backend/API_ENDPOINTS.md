# API Endpoints Documentation

## Base URL
- **Production**: `https://jain-silver.vercel.app/api`
- **Local**: `http://localhost:3000/api`

## Authentication Endpoints (`/api/auth`)

### GET `/api/auth`
Get authentication statistics and available endpoints.

**Response:**
```json
{
  "message": "Auth API",
  "statistics": {
    "totalUsers": 0,
    "verifiedUsers": 0,
    "approvedUsers": 0,
    "pendingUsers": 0,
    "adminUsers": 0
  },
  "endpoints": { ... }
}
```

### GET `/api/auth/register`
Returns 405 Method Not Allowed with instructions (registration requires POST).

### POST `/api/auth/register`
Register a new user with document uploads.

**Content-Type**: `multipart/form-data`

**Body:**
- `name` (string, required)
- `email` (string, required, valid email)
- `phone` (string, required, 10-digit Indian phone number)
- `password` (string, required, min 6 characters)
- `aadharNumber` (string, required)
- `panNumber` (string, required)
- `aadharFront` (file, required, max 5MB, JPEG/PNG/PDF)
- `aadharBack` (file, required, max 5MB, JPEG/PNG/PDF)
- `panImage` (file, required, max 5MB, JPEG/PNG/PDF)

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": "...",
  "otp": "123456"
}
```

### POST `/api/auth/verify-otp`
Verify OTP sent during registration.

**Body:**
- `userId` (string, required)
- `otp` (string, required)

### POST `/api/auth/resend-otp`
Resend OTP to user's phone number.

**Body:**
- `userId` (string, required)

### POST `/api/auth/signin`
User sign in.

**Body:**
- `email` (string, required)
- `password` (string, required)

### POST `/api/auth/admin/signin`
Admin sign in.

**Body:**
- `email` (string, required)
- `password` (string, required)

### POST `/api/auth/forgot-password`
Request password reset OTP.

**Body:**
- `email` (string, required)

### POST `/api/auth/verify-reset-otp`
Verify password reset OTP.

**Body:**
- `email` (string, required)
- `otp` (string, required)

### POST `/api/auth/reset-password`
Reset password with verified OTP.

**Body:**
- `email` (string, required)
- `otp` (string, required)
- `newPassword` (string, required, min 6 characters)

---

## Users Endpoints (`/api/users`)

### GET `/api/users`
Get all users with pagination (public, no auth required).

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `approved`, `rejected`)
- `limit` (optional, default: 10): Number of results per page
- `page` (optional, default: 1): Page number

**Response:**
```json
{
  "message": "Users API",
  "data": [...],
  "pagination": { ... },
  "statistics": { ... }
}
```

### GET `/api/users/profile`
Get current user profile (requires authentication).

**Headers:**
- `Authorization: Bearer <token>`

### PUT `/api/users/profile`
Update current user profile (requires authentication).

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
- `name` (string, optional)
- `phone` (string, optional)

---

## Admin Endpoints (`/api/admin`)

All admin endpoints require authentication and admin role.

**Headers:**
- `Authorization: Bearer <token>`

### GET `/api/admin`
Get admin dashboard statistics.

### GET `/api/admin/pending-users`
Get all pending users awaiting approval.

### GET `/api/admin/users`
Get all users (optionally filtered by status).

**Query Parameters:**
- `status` (optional): Filter by status

### GET `/api/admin/user/:userId`
Get detailed user information with documents.

### PUT `/api/admin/approve-user/:userId`
Approve a pending user.

### PUT `/api/admin/reject-user/:userId`
Reject a pending user.

**Body:**
- `reason` (string, optional)

---

## Rates Endpoints (`/api/rates`)

### GET `/api/rates`
Get all silver rates (public, no auth required).

**Note:** Fetches live rates from external source and updates MongoDB.

**Response:**
Array of rate objects with:
- `name` (string)
- `type` (string: `coin`, `bar`, `jewelry`)
- `weight` (object: `{ value, unit }`)
- `purity` (string: `92.5%`, `99.9%`, `99.99%`)
- `rate` (number): Total rate for the weight
- `ratePerGram` (number): Rate per gram
- `location` (string, default: `Andhra Pradesh`)
- `lastUpdated` (date)

### PUT `/api/rates/:id`
Update a specific rate (requires authentication).

**Body:**
- `rate` (number, required)

### POST `/api/rates/force-update`
Force update all rates from live source (requires authentication).

### POST `/api/rates/initialize`
Initialize default rates in database (public endpoint).

---

## Store Endpoints (`/api/store`)

### GET `/api/store`
Get store information (public, no auth required).

### GET `/api/store/info`
Alias for GET `/api/store` (public, no auth required).

### PUT `/api/store/info`
Update store information (requires authentication and admin role).

**Body:**
- Store information object

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Validation error",
  "errors": [...]
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized",
  "error": "Token required or invalid"
}
```

### 403 Forbidden
```json
{
  "message": "Forbidden",
  "error": "Admin access required"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 405 Method Not Allowed
```json
{
  "message": "Method not allowed",
  "error": "Endpoint requires POST method, not GET"
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error",
  "error": "Error message"
}
```

### 503 Service Unavailable
```json
{
  "message": "Database connection unavailable",
  "error": "Service temporarily unavailable"
}
```

---

## Notes

1. **File Uploads**: Registration endpoint accepts `multipart/form-data` with file uploads (max 5MB per file, 3 files total).

2. **Authentication**: Most endpoints require JWT token in `Authorization` header: `Bearer <token>`

3. **Admin Access**: Admin endpoints require both authentication and admin role.

4. **MongoDB**: All data is stored in MongoDB. If MongoDB is not connected, endpoints return default/empty data or 503 errors.

5. **S3 Storage**: User documents are stored in AWS S3 and served via CloudFront CDN.

6. **Live Rates**: Rates endpoint fetches live data from external sources. No fallback to cached data.

