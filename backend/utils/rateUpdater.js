const SilverRate = require('../models/SilverRate');
const { fetchSilverRatesFromMultipleSources } = require('./multiSourceRateFetcher');

const UPDATE_INTERVAL = 1000; // Update rates every second (1000ms = 1 second)

// Fetch live rates from multiple endpoints and update all silver rates
// Tries both RB Goldspot and Vercel endpoints every second
const updateRates = async (io) => {
  try {
    const rates = await SilverRate.find({ location: 'Andhra Pradesh' });
    
    if (rates.length === 0) {
      // Silently return if no rates exist yet (they will be initialized on server start)
      return;
    }
    
    const now = Date.now();
    
    // Fetch fresh rate every second from multiple sources (RB Goldspot + Vercel) - NO FALLBACK
    const liveRate = await fetchSilverRatesFromMultipleSources();
    
    // Only proceed if we got a valid rate from endpoint - NO FALLBACK
    if (!liveRate || !liveRate.ratePerGram || liveRate.ratePerGram <= 0) {
      // Skip update if endpoint failed - don't use fallback
      if (now % 10000 < 1000) {
        console.warn('⚠️ Failed to fetch rate from endpoint, skipping update (no fallback)');
      }
      return; // Exit early, don't update rates
    }
    
    const baseRatePerGram = liveRate.ratePerGram;
    
    // Log every fetch to verify it's working (can reduce later)
    console.log(`✅ Fetched live rate: ₹${liveRate.ratePerGram}/gram (₹${liveRate.ratePerKg}/kg, source: ${liveRate.source})`);
    
    // Update all rates based on the live rate from endpoint
    for (const rate of rates) {
      // Validate rate has required fields
      if (!rate.weight || !rate.weight.value) {
        console.warn(`Skipping rate update for ${rate.name || rate._id} - missing required fields`);
        continue;
      }

      // Calculate rate per gram based on purity
      let ratePerGram = baseRatePerGram;
      
      // Adjust for different purity levels
      if (rate.purity === '92.5%') {
        // Sterling silver (92.5%) is typically 3-5% less than pure silver
        ratePerGram = baseRatePerGram * 0.96;
      } else if (rate.purity === '99.99%') {
        // 99.99% is slightly higher than 99.9%
        ratePerGram = baseRatePerGram * 1.005;
      }
      // 99.9% uses base rate as-is
      
      rate.ratePerGram = Math.round(ratePerGram * 100) / 100;
      
      // Calculate total rate based on weight
      let weightInGrams = rate.weight.value;
      if (rate.weight.unit === 'kg') {
        weightInGrams = rate.weight.value * 1000;
      } else if (rate.weight.unit === 'oz') {
        weightInGrams = rate.weight.value * 28.35; // 1 oz = 28.35 grams
      }
      
      rate.rate = Math.round(rate.ratePerGram * weightInGrams * 100) / 100;
      rate.lastUpdated = new Date();
      await rate.save();

      // Emit update via Socket.io
      if (io) {
        const rateData = {
          _id: rate._id,
          name: rate.name,
          rate: rate.rate,
          ratePerGram: rate.ratePerGram,
          weight: rate.weight,
          purity: rate.purity,
          type: rate.type,
          location: rate.location,
          lastUpdated: rate.lastUpdated,
          usdInrRate: liveRate.usdInrRate || 89.25 // Include USD rate in update
        };
        io.emit('rateUpdate', rateData);
        // Also emit USD rate update separately
        io.emit('usdRateUpdate', { usdInrRate: liveRate.usdInrRate || 89.25 });
        console.log(`📡 Emitted Socket.IO update: ${rate.name} - ₹${rate.ratePerGram}/gram`);
      }
    }

    // Log every update to verify it's working
    console.log(`✅ Updated ${rates.length} rates (Base: ₹${baseRatePerGram}/gram from ${liveRate.source})`);
  } catch (error) {
    console.error('❌ Error updating rates:', error.message || error);
  }
};

// Start rate updater (updates every second)
const startRateUpdater = (io) => {
  // Initial update
  updateRates(io);
  
  // Update every second as requested
  setInterval(() => {
    updateRates(io);
  }, UPDATE_INTERVAL);
};

module.exports = { startRateUpdater, updateRates };

