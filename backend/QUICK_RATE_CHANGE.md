# Quick Guide: Change Rate Endpoint

## Current Setup
The app is currently fetching rates from:
- **Primary**: `bcast.rbgoldspot.com` (RB Goldspot)
- **Fallback**: `jainsilverpp1.vercel.app` (Vercel)

## Quick Change Options

### Option 1: Use Only Vercel (Disable RB Goldspot)
Edit `backend/config/rateSource.js`:
```javascript
const ACTIVE_RATE_SOURCE = 'VERCEL'; // Change from 'MULTI' to 'VERCEL'
```

Or set environment variable:
```env
RATE_SOURCE=VERCEL
```

### Option 2: Use Only RB Goldspot (Disable Vercel)
Edit `backend/config/rateSource.js`:
```javascript
const ACTIVE_RATE_SOURCE = 'RB_GOLDSPOT'; // Change from 'MULTI' to 'RB_GOLDSPOT'
```

Or set environment variable:
```env
RATE_SOURCE=RB_GOLDSPOT
```

### Option 3: Use Your Own Custom Endpoint

1. **Create/Edit `.env` file** in `backend` directory:
```env
RATE_SOURCE=CUSTOM
CUSTOM_RATE_URL=https://your-api.com/silver-rate
```

2. **Edit `backend/config/rateSource.js`**:
```javascript
CUSTOM: {
  name: 'Custom',
  url: process.env.CUSTOM_RATE_URL || 'https://your-api.com/silver-rate',
  enabled: true, // Change to true
  priority: 1, // Set to 1 to use first
},
```

3. **Restart the server**

### Option 4: Disable a Source

To disable RB Goldspot, edit `backend/config/rateSource.js`:
```javascript
RB_GOLDSPOT: {
  enabled: false, // Change to false
  ...
},
```

To disable Vercel:
```javascript
VERCEL: {
  enabled: false, // Change to false
  ...
},
```

## After Making Changes

1. **Restart the backend server**
2. **Check logs** for:
   - `✅ Fetched live rate: ₹168.39/gram (source: your-source)`
3. **Verify** rates are updating in the app

## Need Help?

See `backend/RATE_SOURCE_CONFIG.md` for detailed documentation.

