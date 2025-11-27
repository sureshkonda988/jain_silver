const axios = require('axios');

/**
 * Fetches live silver rates from RB Goldspot endpoint
 * Endpoint: https://bcast.rbgoldspot.com:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/rbgold
 * Format: Tab-separated values: ID, Name, Bid, Ask, High, Low, Status
 */
const fetchSilverRatesFromRBGoldspot = async () => {
  try {
    const response = await axios.get('https://bcast.rbgoldspot.com:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/rbgold', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/plain, text/html, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000,
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
        const high = parts[4].trim();
        const low = parts[5].trim();
        const status = parts[6]?.trim() || '';

        // Look for Silver 999 (ID: 2966 or name contains "Silver 999")
        if ((id === '2966' || name.toLowerCase().includes('silver 999')) && 
            !name.toLowerCase().includes('mini')) {
          silver999Data = { id, name, bid, ask, high, low, status };
          
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

    // Log for debugging
    if (silver999Data) {
      console.log(`📊 Found Silver 999: ID=${silver999Data.id}, ask=${silver999Data.ask}, bid=${silver999Data.bid}, name=${silver999Data.name}`);
    } else {
      console.warn('⚠️ Silver 999 not found in response');
      console.warn('Sample response:', response.data.substring(0, 500));
    }

    // NO FALLBACK - Only return if we successfully parsed the rate
    if (!ratePerGram || ratePerGram <= 0 || isNaN(ratePerGram)) {
      console.warn('⚠️ Could not parse rate from RB Goldspot endpoint');
      // Return null to indicate failure - NO FALLBACK
      return null;
    }
    
    // Ensure ratePerKg is set
    if (!ratePerKg) {
      ratePerKg = ratePerGram * 1000;
    }
    
    console.log(`✅ Successfully parsed rate: ₹${ratePerGram}/gram (₹${ratePerKg}/kg)`);
    
    return {
      ratePerKg: Math.round(ratePerKg),
      ratePerGram: Math.round(ratePerGram * 100) / 100,
      source: 'bcast.rbgoldspot.com',
      timestamp: new Date(),
      url: 'https://bcast.rbgoldspot.com:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/rbgold',
      rawData: silver999Data
    };
  } catch (error) {
    console.error('❌ Error fetching rates from RB Goldspot endpoint:', error.message);
    
    // Return null on error - NO FALLBACK
    return null;
  }
};

module.exports = { fetchSilverRatesFromRBGoldspot };

