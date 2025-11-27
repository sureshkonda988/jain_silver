/**
 * Rate Source Configuration
 * Configure where to fetch silver rates from
 */

// Available rate sources
const RATE_SOURCES = {
  // Option 1: RB Goldspot (fallback)
  RB_GOLDSPOT: {
    name: 'RB Goldspot',
    url: 'https://bcast.rbgoldspot.com:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/rbgold',
    enabled: true,
    priority: 2, // Fallback if Vercel fails
  },
  
  // Option 2: Vercel endpoint (Primary source for live rates)
  VERCEL: {
    name: 'Vercel',
    url: 'https://jainsilverpp1.vercel.app/prices/stream',
    enabled: true,
    priority: 1, // Highest priority - use this as primary source
  },
  
  // Option 3: Custom endpoint (add your own)
  CUSTOM: {
    name: 'Custom',
    url: process.env.CUSTOM_RATE_URL || '', // Set via environment variable
    enabled: false, // Set to true and provide URL to enable
    priority: 3,
  },
};

// Active rate source configuration
// Change this to use a different source
// Options: 'RB_GOLDSPOT', 'VERCEL', 'CUSTOM', or 'MULTI'
// 'MULTI' will try all enabled sources in priority order (recommended for reliability)
// Set via RATE_SOURCE environment variable or change default below
// Default to MULTI to use both Vercel stream and RB Goldspot for maximum reliability
const ACTIVE_RATE_SOURCE = process.env.RATE_SOURCE || 'MULTI';

// If MULTI, it will try all enabled sources in priority order
// If a specific source name, it will only use that source

module.exports = {
  RATE_SOURCES,
  ACTIVE_RATE_SOURCE,
};

