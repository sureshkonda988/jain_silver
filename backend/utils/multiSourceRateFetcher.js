const axios = require('axios');
const { RATE_SOURCES, ACTIVE_RATE_SOURCE } = require('../config/rateSource');

/**
 * Fetches live silver rates from configured endpoints
 * Can use a single source or multiple sources (fallback)
 * Configure in backend/config/rateSource.js or via RATE_SOURCE environment variable
 */

// Fetch from RB Goldspot (tab-separated format)
// Format: ID	Name	Bid	Ask	High	Low	Status
// Example: 2966	Silver 999 	-	166685	168779	165330	InStock
const fetchFromRBGoldspot = async () => {
  try {
    // Always fetch fresh data - no caching
    const response = await axios.get('https://bcast.rbgoldspot.com:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/rbgold', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/plain, text/html, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      timeout: 5000, // 5 seconds - enough time for reliable fetch
      maxRedirects: 5,
      responseType: 'text',
      params: { 
        _t: Date.now(), // Cache busting - ensures fresh data every second
        _r: Math.random() // Additional cache busting
      },
      validateStatus: function (status) {
        return status >= 200 && status < 300; // Accept only 2xx responses
      }
    });

    console.log('✅ Received response from RB Goldspot');
    console.log('Response preview:', response.data?.substring(0, 300) || 'No data');

    // Parse tab-separated format
    // Format from API: ID	Name	Bid	Ask	High	Low	Status
    // Example: 2966	Silver 999 	-	169399	170256	167100	InStock
    const lines = response.data.split('\n');
    let ratePerKg = null;
    let ratePerGram = null;
    let silver999Data = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Split by tabs (exact format: ID	Name	Bid	Ask	High	Low	Status)
      // Example: 2966	Silver 999 	-	168889	170256	167100	InStock
      const parts = trimmedLine.split(/\t/);
      
      if (parts.length >= 6) {
        const id = parts[0].trim();
        const name = parts[1].trim();
        const bid = parts[2].trim();
        const ask = parts[3].trim();
        const high = parts[4].trim();
        const low = parts[5].trim();

        // Look for Silver 999 (ID: 2966) - exact match
        // Exclude "Silver Mini 999" (ID: 2987)
        if (id === '2966' && !name.toLowerCase().includes('mini')) {
          silver999Data = { id, name, bid, ask, high, low };
          
          // Priority: Ask > High > Bid (Ask is selling price, most relevant)
          // Format: Ask price is per kg, convert to per gram
          if (ask && ask !== '-' && ask !== '' && ask !== '0' && !isNaN(parseFloat(ask))) {
            ratePerKg = parseFloat(ask);
            if (ratePerKg > 0) {
              ratePerGram = ratePerKg / 1000;
              break; // Found rate, exit loop
            }
          }
          // Try High price if Ask not available
          if (!ratePerGram && high && high !== '-' && high !== '' && high !== '0' && !isNaN(parseFloat(high))) {
            ratePerKg = parseFloat(high);
            if (ratePerKg > 0) {
              ratePerGram = ratePerKg / 1000;
              break;
            }
          }
          // Try Bid price as last resort
          if (!ratePerGram && bid && bid !== '-' && bid !== '' && bid !== '0' && !isNaN(parseFloat(bid))) {
            ratePerKg = parseFloat(bid);
            if (ratePerKg > 0) {
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
      const result = {
        ratePerKg: Math.round(ratePerKg),
        ratePerGram: Math.round(ratePerGram * 100) / 100,
        source: 'bcast.rbgoldspot.com',
        timestamp: new Date(),
        rawData: silver999Data,
        usdInrRate: usdInrRate || 89.25 // Default if not found
      };
      console.log(`✅ Successfully extracted rate from RB Goldspot: ₹${result.ratePerGram}/gram (₹${result.ratePerKg}/kg)`);
      return result;
    }
    
    console.warn('⚠️ Could not extract valid rate from RB Goldspot response');
    console.warn('  Parsed lines:', lines.length);
    console.warn('  Silver 999 data:', silver999Data);
    return null;
  } catch (error) {
    console.error('❌ Error fetching from RB Goldspot:', error.message);
    if (error.response) {
      console.error('  Response status:', error.response.status);
      console.error('  Response data:', error.response.data?.substring(0, 500));
    }
    if (error.code) {
      console.error('  Error code:', error.code);
    }
    return null;
  }
};

// Fetch from Vercel (SSE format) - Secondary source for live rates
const fetchFromVercel = async () => {
  try {
    // Always fetch fresh data - no caching
    const response = await axios.get('https://jainsilverpp1.vercel.app/prices/stream', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/event-stream, application/json, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      timeout: 5000, // 5 seconds - enough time for reliable fetch
      maxRedirects: 5,
      responseType: 'text',
      params: {
        _t: Date.now(), // Cache busting - ensures fresh data every second
        _r: Math.random() // Additional cache busting
      },
      validateStatus: function (status) {
        return status >= 200 && status < 300; // Accept only 2xx responses
      }
    });

    console.log('✅ Received response from stream endpoint');
    console.log('Response length:', response.data?.length || 0);
    console.log('Response preview:', response.data?.substring(0, 200) || 'No data');

    // Try to parse as JSON first (in case it's not SSE format)
    let rateData = null;
    try {
      rateData = JSON.parse(response.data);
      console.log('✅ Parsed as JSON');
    } catch (jsonError) {
      // If not JSON, parse as SSE format - extract the last complete data line
      console.log('⚠️ Not JSON, trying SSE format...');
      const lines = response.data.split('\n');
      let lastDataLine = null;
      
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) continue;
        
        if (line.startsWith('data: ')) {
          const jsonStr = line.substring(6);
          try {
            rateData = JSON.parse(jsonStr);
            console.log('✅ Parsed SSE data line');
            break;
          } catch (e) {
            continue;
          }
        } else if (line.startsWith('{') && line.endsWith('}')) {
          // Try parsing as direct JSON line
          try {
            rateData = JSON.parse(line);
            console.log('✅ Parsed direct JSON line');
            break;
          } catch (e) {
            continue;
          }
        }
      }
    }

    if (!rateData) {
      console.warn('⚠️ No valid data found in Vercel stream response');
      console.warn('Response data:', response.data?.substring(0, 500));
      return null;
    }

    console.log('📊 Rate data structure:', {
      hasPrices: !!rateData.prices,
      pricesLength: rateData.prices?.length || 0,
      hasRatePerGram: !!rateData.ratePerGram,
      hasRate: !!rateData.rate,
      keys: Object.keys(rateData)
    });

    let ratePerKg = null;
    let ratePerGram = null;

    // Handle different response formats
    if (rateData.prices && Array.isArray(rateData.prices)) {
      // Format: { prices: [...] }
      console.log('📋 Found prices array with', rateData.prices.length, 'items');
      
      // Log all price items for debugging
      rateData.prices.forEach((item, index) => {
        if (item.name && item.name.toLowerCase().includes('silver')) {
          console.log(`  [${index}] ${item.name}: ask=${item.ask}, bid=${item.bid}, price=${item.price}`);
        }
      });
      
      let silver999 = rateData.prices.find(
        item => item.name && item.name.toLowerCase() === 'silver 999'
      );
      
      if (!silver999) {
        silver999 = rateData.prices.find(
          item => item.name && item.name.toLowerCase().includes('silver 999')
        );
      }
      
      if (!silver999) {
        // Try to find any silver item
        silver999 = rateData.prices.find(
          item => item.name && item.name.toLowerCase().includes('silver')
        );
      }
      
      if (silver999) {
        console.log('✅ Found silver item:', silver999.name);
        if (silver999.ask && silver999.ask !== '-' && silver999.ask !== '') {
          ratePerKg = parseFloat(silver999.ask);
          if (!isNaN(ratePerKg) && ratePerKg > 0) {
            ratePerGram = ratePerKg / 1000;
            console.log(`✅ Using ask price: ₹${ratePerKg}/kg = ₹${ratePerGram}/gram`);
          }
        }
        if (!ratePerGram && silver999.bid && silver999.bid !== '-' && silver999.bid !== '') {
          ratePerKg = parseFloat(silver999.bid);
          if (!isNaN(ratePerKg) && ratePerKg > 0) {
            ratePerGram = ratePerKg / 1000;
            console.log(`✅ Using bid price: ₹${ratePerKg}/kg = ₹${ratePerGram}/gram`);
          }
        }
        // Try price field
        if (!ratePerGram && silver999.price) {
          const price = parseFloat(silver999.price);
          if (!isNaN(price) && price > 0) {
            ratePerKg = price > 1000 ? price : price * 1000;
            ratePerGram = price > 1000 ? price / 1000 : price;
            console.log(`✅ Using price field: ₹${ratePerKg}/kg = ₹${ratePerGram}/gram`);
          }
        }
        // Try ratePerGram field directly
        if (!ratePerGram && silver999.ratePerGram) {
          ratePerGram = parseFloat(silver999.ratePerGram);
          ratePerKg = ratePerGram * 1000;
          console.log(`✅ Using ratePerGram field: ₹${ratePerGram}/gram`);
        }
      } else {
        console.warn('⚠️ No silver item found in prices array');
      }
    } else if (rateData.ratePerGram) {
      // Direct format: { ratePerGram: 168.39, ... }
      console.log('✅ Found ratePerGram directly:', rateData.ratePerGram);
      ratePerGram = parseFloat(rateData.ratePerGram);
      ratePerKg = ratePerGram * 1000;
    } else if (rateData.rate) {
      // Format: { rate: 168390, ... }
      console.log('✅ Found rate field:', rateData.rate);
      const rate = parseFloat(rateData.rate);
      ratePerGram = rate > 1000 ? rate / 1000 : rate;
      ratePerKg = rate > 1000 ? rate : rate * 1000;
    } else {
      console.warn('⚠️ Unknown rate data format:', Object.keys(rateData));
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
    } else if (rateData.usdInrRate || rateData.usdRate) {
      usdInrRate = parseFloat(rateData.usdInrRate || rateData.usdRate);
    }

    if (ratePerGram && ratePerGram > 0 && !isNaN(ratePerGram)) {
      const result = {
        ratePerKg: Math.round(ratePerKg),
        ratePerGram: Math.round(ratePerGram * 100) / 100,
        source: 'jainsilverpp1.vercel.app',
        timestamp: new Date(),
        rawData: rateData,
        usdInrRate: usdInrRate || 89.25 // Default if not found
      };
      console.log(`✅ Successfully extracted rate: ₹${result.ratePerGram}/gram (₹${result.ratePerKg}/kg)`);
      return result;
    }
    
    console.warn('⚠️ Could not extract valid rate from Vercel response');
    console.warn('  ratePerGram:', ratePerGram, 'ratePerKg:', ratePerKg);
    console.warn('  Full rateData:', JSON.stringify(rateData, null, 2).substring(0, 1000));
    return null;
  } catch (error) {
    console.error('❌ Error fetching from Vercel stream:', error.message);
    if (error.response) {
      console.error('  Response status:', error.response.status);
      console.error('  Response data:', error.response.data?.substring(0, 500));
    }
    if (error.code) {
      console.error('  Error code:', error.code);
    }
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

  // MULTI mode: Try all enabled sources in parallel for fastest response
  const enabledSources = Object.values(RATE_SOURCES)
    .filter(source => source.enabled)
    .sort((a, b) => a.priority - b.priority);

  if (enabledSources.length === 0) {
    console.warn('⚠️ No rate sources enabled');
    return null;
  }

  // Try sources in parallel - return first successful result (fastest)
  // Use Promise.race to get the fastest successful response
  const fetchPromises = enabledSources.map(async (source) => {
    try {
      let result = null;
      if (source.name === 'RB Goldspot') {
        result = await fetchFromRBGoldspot();
      } else if (source.name === 'Vercel') {
        result = await fetchFromVercel();
      } else if (source.name === 'Custom' && source.url) {
        result = await fetchFromCustom(source.url);
      }
      
      if (result && result.ratePerGram && result.ratePerGram > 0) {
        return { source: source.name, result, priority: source.priority };
      }
      return null;
    } catch (error) {
      // Silently fail - will try other sources
      return null;
    }
  });

  // Race all promises - get first successful result
  // This ensures we get the fastest response from either RB Goldspot or Vercel
  const racePromises = fetchPromises.map(async (promise, index) => {
    try {
      const result = await promise;
      if (result && result.result && result.result.ratePerGram > 0) {
        return result;
      }
      // Wait a bit longer if this source hasn't responded yet
      await new Promise(resolve => setTimeout(resolve, 100));
      return null;
    } catch (error) {
      return null;
    }
  });

  // Get first successful result
  const results = await Promise.allSettled(racePromises);
  const successfulResults = results
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value)
    .sort((a, b) => a.priority - b.priority); // Sort by priority (RB Goldspot first)

  if (successfulResults.length > 0) {
    const bestResult = successfulResults[0];
    return bestResult.result;
  }

  // If parallel failed, try sequential as fallback (RB Goldspot first, then Vercel)
  for (const source of enabledSources) {
    try {
      let result = null;
      if (source.name === 'RB Goldspot') {
        result = await fetchFromRBGoldspot();
      } else if (source.name === 'Vercel') {
        result = await fetchFromVercel();
      } else if (source.name === 'Custom' && source.url) {
        result = await fetchFromCustom(source.url);
      }
      
      if (result && result.ratePerGram && result.ratePerGram > 0) {
        return result;
      }
    } catch (error) {
      // Continue to next source
    }
  }

  // All sources failed
  return null;
};

module.exports = { fetchSilverRatesFromMultipleSources };


