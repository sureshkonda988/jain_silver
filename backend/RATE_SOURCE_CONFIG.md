# Rate Source Configuration Guide

## How to Change Rate Endpoint

The app currently fetches silver rates from external sources. You can configure which source to use.

### Option 1: Use Environment Variable (Recommended)

Set the `RATE_SOURCE` environment variable in your `.env` file or Vercel environment:

```env
RATE_SOURCE=RB_GOLDSPOT    # Use only RB Goldspot
RATE_SOURCE=VERCEL         # Use only Vercel endpoint
RATE_SOURCE=CUSTOM         # Use custom endpoint (also set CUSTOM_RATE_URL)
RATE_SOURCE=MULTI          # Try all enabled sources (default)
```

For custom endpoint:
```env
RATE_SOURCE=CUSTOM
CUSTOM_RATE_URL=https://your-api-endpoint.com/silver-rate
```

### Option 2: Edit Configuration File

Edit `backend/config/rateSource.js`:

```javascript
// Change ACTIVE_RATE_SOURCE to one of:
// 'RB_GOLDSPOT' - Use only RB Goldspot
// 'VERCEL' - Use only Vercel
// 'CUSTOM' - Use custom endpoint
// 'MULTI' - Try all enabled sources (fallback)

const ACTIVE_RATE_SOURCE = 'CUSTOM'; // Change this

// For custom endpoint, also update:
const RATE_SOURCES = {
  CUSTOM: {
    name: 'Custom',
    url: 'https://your-api-endpoint.com/silver-rate', // Your endpoint URL
    enabled: true, // Set to true
    priority: 1, // Lower = higher priority
  },
};
```

### Available Rate Sources

1. **RB Goldspot** (`RB_GOLDSPOT`)
   - URL: `https://bcast.rbgoldspot.com:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/rbgold`
   - Format: Tab-separated values
   - Currently enabled by default

2. **Vercel** (`VERCEL`)
   - URL: `https://jainsilverpp1.vercel.app/prices/stream`
   - Format: Server-Sent Events (SSE) JSON
   - Currently enabled by default

3. **Custom** (`CUSTOM`)
   - URL: Configure via `CUSTOM_RATE_URL` environment variable
   - Format: JSON (supports multiple formats)
   - Currently disabled by default

### Custom Endpoint Format

Your custom endpoint should return one of these formats:

**Format 1:**
```json
{
  "ratePerGram": 168.39,
  "rate": 168390,
  "usdInrRate": 89.25
}
```

**Format 2:**
```json
{
  "rate": 168.39,
  "usdRate": 89.25
}
```

**Format 3:**
```json
{
  "price": 168.39
}
```

**Format 4:**
```json
{
  "data": {
    "ratePerGram": 168.39
  }
}
```

The fetcher will automatically detect the format and extract the rate.

### Testing

After changing the configuration:

1. Restart the backend server
2. Check the logs for messages like:
   - `✅ Fetched live rate: ₹168.39/gram (source: your-source)`
3. Verify rates are updating correctly in the app

### Troubleshooting

- **No rates updating**: Check that the endpoint URL is correct and accessible
- **Wrong rate format**: Ensure your endpoint returns one of the supported formats
- **Timeout errors**: Increase timeout in `multiSourceRateFetcher.js` if your endpoint is slow
- **CORS errors**: Ensure your endpoint allows requests from your backend

### Example: Using Your Own API

1. Create a `.env` file in the `backend` directory:
   ```env
   RATE_SOURCE=CUSTOM
   CUSTOM_RATE_URL=https://api.yourdomain.com/silver/rate
   ```

2. Restart the server:
   ```bash
   npm start
   ```

3. The server will now fetch rates from your custom endpoint.

