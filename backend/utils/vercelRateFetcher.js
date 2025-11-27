const axios = require('axios');

/**
 * Fetches live silver rates from Vercel endpoint
 * Endpoint: https://jainsilverpp1.vercel.app/prices/stream
 */
const fetchSilverRatesFromVercel = async () => {
  try {
    // The endpoint returns Server-Sent Events (SSE) format
    const response = await axios.get('https://jainsilverpp1.vercel.app/prices/stream', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/event-stream',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
      maxRedirects: 5,
      responseType: 'text' // Get raw text to parse SSE format
    });

    // Parse SSE format - extract the last complete data line
    const lines = response.data.split('\n');
    let lastDataLine = null;
    
    // Find the last complete data line (may have multiple data: lines in SSE stream)
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('data: ')) {
        const jsonStr = line.substring(6); // Remove 'data: ' prefix
        // Try to parse to ensure it's valid JSON
        try {
          JSON.parse(jsonStr);
          lastDataLine = jsonStr;
          break;
        } catch (e) {
          // Not valid JSON, continue searching
          continue;
        }
      }
    }

    if (!lastDataLine) {
      throw new Error('No valid data found in SSE response');
    }

    // Parse JSON from the data line
    const rateData = JSON.parse(lastDataLine);
    
    // Extract Silver 999 rate from prices array
    // Format: {"prices": [{"id":"2966","name":"Silver 999","ask":"161495",...}], ...}
    let ratePerKg = null;
    let ratePerGram = null;

    if (rateData.prices && Array.isArray(rateData.prices)) {
      // Try to find Silver 999 (exact match first, then partial)
      let silver999 = rateData.prices.find(
        item => item.name && item.name.toLowerCase() === 'silver 999'
      );
      
      // If exact match not found, try partial match
      if (!silver999) {
        silver999 = rateData.prices.find(
          item => item.name && item.name.toLowerCase().includes('silver 999')
        );
      }
      
      // Try "Silver Mini 999" if "Silver 999" not found
      if (!silver999) {
        silver999 = rateData.prices.find(
          item => item.name && (item.name.toLowerCase().includes('silver mini 999') || item.name.toLowerCase().includes('silver 999'))
        );
      }
      
      if (silver999) {
        // Try "ask" price first (per kg)
        if (silver999.ask && silver999.ask !== '-' && silver999.ask !== '') {
          ratePerKg = parseFloat(silver999.ask);
          if (!isNaN(ratePerKg) && ratePerKg > 0) {
            ratePerGram = ratePerKg / 1000;
          }
        }
        // If ask not available, try bid
        if (!ratePerGram && silver999.bid && silver999.bid !== '-' && silver999.bid !== '') {
          ratePerKg = parseFloat(silver999.bid);
          if (!isNaN(ratePerKg) && ratePerKg > 0) {
            ratePerGram = ratePerKg / 1000;
          }
        }
      }
      
      // Log for debugging
      if (silver999) {
        console.log(`📊 Found Silver 999: ask=${silver999.ask}, bid=${silver999.bid}, name=${silver999.name}`);
      } else {
        console.warn('⚠️ Silver 999 not found in prices array. Available items:', 
          rateData.prices.map(p => p.name).join(', '));
      }
    }

    // Fallback: Use a reasonable market rate if parsing fails
    if (!ratePerGram || ratePerGram <= 0 || isNaN(ratePerGram)) {
      console.warn('⚠️ Could not parse rate from Vercel endpoint, using fallback rate');
      console.warn('Response data sample:', JSON.stringify(rateData, null, 2).substring(0, 500));
      // Default fallback: ~₹75.50 per gram - typical market rate
      ratePerGram = 75.50;
      ratePerKg = 75500;
    } else {
      // Ensure ratePerKg is set
      if (!ratePerKg) {
        ratePerKg = ratePerGram * 1000;
      }
      console.log(`✅ Successfully parsed rate: ₹${ratePerGram}/gram (₹${ratePerKg}/kg)`);
    }
    
    return {
      ratePerKg: Math.round(ratePerKg),
      ratePerGram: Math.round(ratePerGram * 100) / 100,
      source: 'jainsilverpp1.vercel.app',
      timestamp: new Date(),
      url: 'https://jainsilverpp1.vercel.app/prices/stream',
      rawData: rateData
    };
  } catch (error) {
    console.error('❌ Error fetching rates from Vercel endpoint:', error.message);
    
    // Return fallback rate on error
    return {
      ratePerKg: 75500,
      ratePerGram: 75.50,
      source: 'fallback',
      timestamp: new Date(),
      error: error.message
    };
  }
};

module.exports = { fetchSilverRatesFromVercel };

