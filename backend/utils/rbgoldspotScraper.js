const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetches live silver rates from rbgoldspot.com
 * Note: Silver Rate is per 1 Kg according to the website
 * Reference: https://www.rbgoldspot.com/
 */
const fetchSilverRatesFromRBGold = async () => {
  try {
    console.log('🌐 Fetching silver rates from rbgoldspot.com...');
    
    const response = await axios.get('https://www.rbgoldspot.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 15000,
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);
    
    // The website shows "Silver Rate is per 1 Kg"
    // Rates are displayed in elements with IDs like: lvLiveRates_ltSell_0, lvLiveRates_ltSell_1, etc.
    let silverRatePerKg = null;
    
    // Method 1: Look for specific rate elements by ID (most reliable)
    // The website displays rates in spans with IDs like "lvLiveRates_ltSell_X"
    const silverRates = [];
    
    for (let i = 0; i < 10; i++) {
      const sellElement = $(`#lvLiveRates_ltSell_${i}`);
      const productElement = $(`#lvLiveRates_ltProductName_${i}`);
      
      if (sellElement.length > 0 && productElement.length > 0) {
        const sellText = sellElement.text().trim();
        const productText = productElement.text().trim();
        
        // Check if this is a Silver product
        if (productText.toLowerCase().includes('silver')) {
          // Extract the rate value (remove ₹, INR, commas, spaces, icons)
          const rateMatch = sellText.match(/([0-9]{1,3}(?:[,\s]?[0-9]{2,3})*)/);
          if (rateMatch) {
            let rate = parseFloat(rateMatch[1].replace(/[,\s]/g, ''));
            
            // Check if this is for 1 kg specifically
            if (productText.toLowerCase().includes('1 kg') || productText.toLowerCase().includes('1kg') || 
                (!productText.match(/\d+\s*kgs?/i) && rate >= 50000 && rate <= 100000)) {
              silverRatePerKg = rate;
              console.log(`✅ Found 1 kg silver rate: ₹${silverRatePerKg}/kg`);
              break;
            }
            
            // Extract weight from product name
            const weightMatch = productText.match(/(\d+(?:\.\d+)?)\s*kgs?/i);
            if (weightMatch) {
              const weight = parseFloat(weightMatch[1]);
              if (weight > 0 && weight <= 100) {
                // Calculate per kg rate
                const perKgRate = rate / weight;
                // Silver per kg should be between 50,000 and 100,000 (reasonable range)
                if (perKgRate >= 50000 && perKgRate <= 100000) {
                  silverRates.push({
                    weight: weight,
                    totalRate: rate,
                    perKgRate: Math.round(perKgRate),
                    productText: productText
                  });
                  console.log(`📊 Found silver: ${productText} = ₹${rate} (₹${Math.round(perKgRate)}/kg)`);
                }
              }
            } else {
              // No weight specified - if rate is in per-kg range, use it
              if (rate >= 50000 && rate <= 100000) {
                silverRates.push({
                  weight: 1,
                  totalRate: rate,
                  perKgRate: rate,
                  productText: productText
                });
                console.log(`📊 Found silver (no weight): ${productText} = ₹${rate}/kg`);
              }
            }
          }
        }
      }
    }
    
    // If we found multiple rates, use the one closest to 1 kg, or average them
    if (!silverRatePerKg && silverRates.length > 0) {
      // Prefer 1 kg rate if available
      const oneKgRate = silverRates.find(r => r.weight === 1);
      if (oneKgRate) {
        silverRatePerKg = oneKgRate.perKgRate;
        console.log(`✅ Using 1 kg rate: ₹${silverRatePerKg}/kg`);
      } else {
        // Use the rate with smallest weight (closest to 1 kg)
        silverRates.sort((a, b) => a.weight - b.weight);
        const closestRate = silverRates[0];
        silverRatePerKg = closestRate.perKgRate;
        console.log(`✅ Using rate from ${closestRate.weight} kg product: ₹${silverRatePerKg}/kg`);
      }
    }
    
    // Method 2: If not found, look for "Silver 999" products and extract rates
    if (!silverRatePerKg) {
      $('span[id*="lvLiveRates_ltProductName"]').each((i, elem) => {
        const productText = $(elem).text().trim();
        if (productText.toLowerCase().includes('silver 999') || productText.toLowerCase().includes('silver')) {
          // Find the corresponding sell price element
          const productId = $(elem).attr('id');
          const indexMatch = productId.match(/_(\d+)$/);
          if (indexMatch) {
            const index = indexMatch[1];
            const sellElement = $(`#lvLiveRates_ltSell_${index}`);
            if (sellElement.length > 0) {
              const sellText = sellElement.text().trim();
              const rateMatch = sellText.match(/([0-9]{1,3}(?:[,\s]?[0-9]{2,3})*)/);
              if (rateMatch) {
                let rate = parseFloat(rateMatch[1].replace(/[,\s]/g, ''));
                
                // Try to extract weight from product name
                const weightMatch = productText.match(/(\d+(?:\.\d+)?)\s*kgs?/i);
                if (weightMatch) {
                  const weight = parseFloat(weightMatch[1]);
                  if (weight > 0) {
                    const perKgRate = rate / weight;
                    if (perKgRate >= 50000 && perKgRate <= 100000) {
                      silverRatePerKg = Math.round(perKgRate);
                      return false; // Break loop
                    }
                  }
                }
                
                // If rate is in reasonable per kg range, use it
                if (rate >= 50000 && rate <= 100000) {
                  silverRatePerKg = rate;
                  return false; // Break loop
                }
              }
            }
          }
        }
      });
    }
    
    // Method 3: Fallback - search in all text for silver rates
    if (!silverRatePerKg) {
      const pageText = $('body').text();
      const patterns = [
        /silver[^0-9]*₹?\s*([0-9]{1,3}(?:[,\s][0-9]{2,3})*\.?[0-9]*)/i,
        /([0-9]{1,3}(?:[,\s][0-9]{2,3})*\.?[0-9]*)\s*(?:per\s*)?(?:1\s*)?kg[^0-9]*silver/i,
      ];
      
      for (const pattern of patterns) {
        const matches = pageText.match(pattern);
        if (matches && matches[1]) {
          const rateStr = matches[1].replace(/[,\s]/g, '');
          const rate = parseFloat(rateStr);
          if (rate && rate >= 50000 && rate <= 100000) {
            silverRatePerKg = rate;
            break;
          }
        }
      }
    }
    
    // Fallback: Use a reasonable market rate if scraping fails
    if (!silverRatePerKg || silverRatePerKg <= 0) {
      console.warn('⚠️ Could not scrape silver rate from rbgoldspot.com, using fallback rate');
      // Default fallback: ~₹75,500 per kg (₹75.50 per gram) - typical market rate
      silverRatePerKg = 75500;
    }
    
    // Convert per kg to per gram
    const ratePerGram = silverRatePerKg / 1000;
    
    return {
      ratePerKg: Math.round(silverRatePerKg),
      ratePerGram: Math.round(ratePerGram * 100) / 100,
      source: silverRatePerKg === 75500 ? 'fallback' : 'rbgoldspot.com',
      timestamp: new Date(),
      url: 'https://www.rbgoldspot.com/'
    };
  } catch (error) {
    console.error('❌ Error fetching rates from rbgoldspot.com:', error.message);
    
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

module.exports = { fetchSilverRatesFromRBGold };

