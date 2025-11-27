const axios = require('axios');
const { RATE_SOURCES, ACTIVE_RATE_SOURCE } = require('../config/rateSource');

/**
 * Fetches live silver rates from configured endpoints
 * Can use a single source or multiple sources (fallback)
 * Configure in backend/config/rateSource.js or via RATE_SOURCE environment variable
 */

// Fetch from RB Goldspot (tab-separated format)
const fetchFromRBGoldspot = async () => {
  try {
    const response = await axios.get('https://bcast.rbgoldspot.com:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/rbgold', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/plain, text/html, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 5000, // 5 second timeout
      maxRedirects: 5,
      responseType: 'text'
    });

    // Parse tab-separated format
    const lines = response.data.split('\n');
    let ratePerKg = null;
    let ratePerGram = null;
    let silver999Data = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Split by tabs or multiple spaces
      const parts = trimmedLine.split(/\s{2,}|\t/).filter(p => p.trim());
      
      if (parts.length >= 6) {
        const id = parts[0].trim();
        const name = parts[1].trim();
        const bid = parts[2].trim();
        const ask = parts[3].trim();

        // Look for Silver 999 (ID: 2966 or name contains "Silver 999")
        if ((id === '2966' || name.toLowerCase().includes('silver 999')) && 
            !name.toLowerCase().includes('mini')) {
          silver999Data = { id, name, bid, ask };
          
          // Use "ask" price (4th column, per kg)
          if (ask && ask !== '-' && ask !== '') {
            ratePerKg = parseFloat(ask);
            if (!isNaN(ratePerKg) && ratePerKg > 0) {
              ratePerGram = ratePerKg / 1000;
              break;
            }
          }
          // If ask not available, try bid
          if (!ratePerGram && bid && bid !== '-' && bid !== '') {
            ratePerKg = parseFloat(bid);
            if (!isNaN(ratePerKg) && ratePerKg > 0) {
              ratePerGram = ratePerKg / 1000;
              break;
            }
          }
        }
      }
    }

    // Try to extract USD-INR rate from the same response
    let usdInrRate = null;
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      const parts = trimmedLine.split(/\s{2,}|\t/).filter(p => p.trim());
      if (parts.length >= 6) {
        const name = parts[1].trim().toLowerCase();
        if (name.includes('usd-inr') || name.includes('usdinr')) {
          const ask = parts[3].trim();
          if (ask && ask !== '-') {
            usdInrRate = parseFloat(ask);
            break;
          }
        }
      }
    }

    if (ratePerGram && ratePerGram > 0 && !isNaN(ratePerGram)) {
      return {
        ratePerKg: Math.round(ratePerKg),
        ratePerGram: Math.round(ratePerGram * 100) / 100,
        source: 'bcast.rbgoldspot.com',
        timestamp: new Date(),
        rawData: silver999Data,
        usdInrRate: usdInrRate || 89.25 // Default if not found
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Fetch from Vercel (SSE format)
const fetchFromVercel = async () => {
  try {
    const response = await axios.get('https://jainsilverpp1.vercel.app/prices/stream', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/event-stream',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 5000, // 5 second timeout
      maxRedirects: 5,
      responseType: 'text'
    });

    // Parse SSE format - extract the last complete data line
    const lines = response.data.split('\n');
    let lastDataLine = null;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('data: ')) {
        const jsonStr = line.substring(6);
        try {
          JSON.parse(jsonStr);
          lastDataLine = jsonStr;
          break;
        } catch (e) {
          continue;
        }
      }
    }

    if (!lastDataLine) {
      return null;
    }

    const rateData = JSON.parse(lastDataLine);
    let ratePerKg = null;
    let ratePerGram = null;

    if (rateData.prices && Array.isArray(rateData.prices)) {
      let silver999 = rateData.prices.find(
        item => item.name && item.name.toLowerCase() === 'silver 999'
      );
      
      if (!silver999) {
        silver999 = rateData.prices.find(
          item => item.name && item.name.toLowerCase().includes('silver 999')
        );
      }
      
      if (silver999) {
        if (silver999.ask && silver999.ask !== '-' && silver999.ask !== '') {
          ratePerKg = parseFloat(silver999.ask);
          if (!isNaN(ratePerKg) && ratePerKg > 0) {
            ratePerGram = ratePerKg / 1000;
          }
        }
        if (!ratePerGram && silver999.bid && silver999.bid !== '-' && silver999.bid !== '') {
          ratePerKg = parseFloat(silver999.bid);
          if (!isNaN(ratePerKg) && ratePerKg > 0) {
            ratePerGram = ratePerKg / 1000;
          }
        }
      }
    }

    // Try to extract USD-INR rate from Vercel response
    let usdInrRate = null;
    if (rateData.prices && Array.isArray(rateData.prices)) {
      const usdInr = rateData.prices.find(
        item => item.name && (item.name.toLowerCase().includes('usd-inr') || item.name.toLowerCase().includes('usdinr'))
      );
      if (usdInr && usdInr.ask && usdInr.ask !== '-') {
        usdInrRate = parseFloat(usdInr.ask);
      }
    }

    if (ratePerGram && ratePerGram > 0 && !isNaN(ratePerGram)) {
      return {
        ratePerKg: Math.round(ratePerKg),
        ratePerGram: Math.round(ratePerGram * 100) / 100,
        source: 'jainsilverpp1.vercel.app',
        timestamp: new Date(),
        rawData: rateData,
        usdInrRate: usdInrRate || 89.25 // Default if not found
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Fetch from custom endpoint (configurable)
const fetchFromCustom = async (url) => {
  try {
    if (!url || !url.trim()) {
      return null;
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 5000,
      maxRedirects: 5,
    });

    // Try to parse as JSON first
    let rateData;
    if (typeof response.data === 'string') {
      try {
        rateData = JSON.parse(response.data);
      } catch (e) {
        // If not JSON, try to extract rate from text
        const match = response.data.match(/[\d.]+/g);
        if (match && match.length > 0) {
          const rate = parseFloat(match[0]);
          if (!isNaN(rate) && rate > 0) {
            return {
              ratePerKg: rate > 1000 ? rate : rate * 1000,
              ratePerGram: rate > 1000 ? rate / 1000 : rate,
              source: 'custom',
              timestamp: new Date(),
              usdInrRate: 89.25,
            };
          }
        }
        return null;
      }
    } else {
      rateData = response.data;
    }

    // Try common JSON formats
    let ratePerKg = null;
    let ratePerGram = null;

    // Format 1: { rate: 168.39, ratePerGram: 168.39, ... }
    if (rateData.ratePerGram) {
      ratePerGram = parseFloat(rateData.ratePerGram);
      ratePerKg = ratePerGram * 1000;
    } else if (rateData.rate) {
      const rate = parseFloat(rateData.rate);
      ratePerGram = rate > 1000 ? rate / 1000 : rate;
      ratePerKg = rate > 1000 ? rate : rate * 1000;
    } else if (rateData.price) {
      const price = parseFloat(rateData.price);
      ratePerGram = price > 1000 ? price / 1000 : price;
      ratePerKg = price > 1000 ? price : price * 1000;
    } else if (rateData.data && rateData.data.ratePerGram) {
      ratePerGram = parseFloat(rateData.data.ratePerGram);
      ratePerKg = ratePerGram * 1000;
    }

    if (ratePerGram && ratePerGram > 0 && !isNaN(ratePerGram)) {
      return {
        ratePerKg: Math.round(ratePerKg),
        ratePerGram: Math.round(ratePerGram * 100) / 100,
        source: 'custom',
        timestamp: new Date(),
        usdInrRate: rateData.usdInrRate || rateData.usdRate || 89.25,
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching from custom endpoint:', error.message);
    return null;
  }
};

/**
 * Fetches silver rates based on configuration
 * Supports: single source, multiple sources (fallback), or custom endpoint
 */
const fetchSilverRatesFromMultipleSources = async () => {
  // If using a specific single source
  if (ACTIVE_RATE_SOURCE === 'RB_GOLDSPOT') {
    return await fetchFromRBGoldspot();
  }
  
  if (ACTIVE_RATE_SOURCE === 'VERCEL') {
    return await fetchFromVercel();
  }
  
  if (ACTIVE_RATE_SOURCE === 'CUSTOM') {
    const customSource = RATE_SOURCES.CUSTOM;
    if (!customSource.enabled || !customSource.url) {
      console.warn('⚠️ Custom rate source not configured. Set CUSTOM_RATE_URL environment variable.');
      return null;
    }
    return await fetchFromCustom(customSource.url);
  }

  // MULTI mode: Try all enabled sources in priority order
  const enabledSources = Object.values(RATE_SOURCES)
    .filter(source => source.enabled)
    .sort((a, b) => a.priority - b.priority);

  if (enabledSources.length === 0) {
    console.warn('⚠️ No rate sources enabled');
    return null;
  }

  // Try sources in parallel for faster response
  const promises = enabledSources.map(source => {
    if (source.name === 'RB Goldspot') {
      return fetchFromRBGoldspot();
    } else if (source.name === 'Vercel') {
      return fetchFromVercel();
    } else if (source.name === 'Custom' && source.url) {
      return fetchFromCustom(source.url);
    }
    return Promise.resolve(null);
  });

  const results = await Promise.allSettled(promises);

  // Return first successful result
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
  }

  // All sources failed
  console.warn('⚠️ All rate sources failed to fetch rates');
  return null;
};

module.exports = { fetchSilverRatesFromMultipleSources };

