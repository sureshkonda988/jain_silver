const SilverRate = require('../models/SilverRate');
const { fetchSilverRatesFromMultipleSources } = require('./multiSourceRateFetcher');

const UPDATE_INTERVAL = 1000; // Update rates every second (1000ms = 1 second)

// Track last successful update time
let lastSuccessfulUpdate = 0;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 5;

// Fetch live rates from multiple endpoints and update all silver rates
// Tries both RB Goldspot and Vercel endpoints every second
const updateRates = async (io) => {
  const startTime = Date.now();
  try {
    const rates = await SilverRate.find({ location: 'Andhra Pradesh' });
    
    if (rates.length === 0) {
      // Silently return if no rates exist yet (they will be initialized on server start)
      return;
    }
    
    // Fetch fresh rate every second from multiple sources (RB Goldspot + Vercel) - NO FALLBACK
    // Use Promise.race with timeout to ensure we don't wait too long
    const fetchPromise = fetchSilverRatesFromMultipleSources();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Rate fetch timeout after 8 seconds')), 8000)
    );
    
    const liveRate = await Promise.race([fetchPromise, timeoutPromise]);
    
    // Only proceed if we got a valid rate from endpoint - NO FALLBACK
    if (!liveRate || !liveRate.ratePerGram || liveRate.ratePerGram <= 0 || isNaN(liveRate.ratePerGram)) {
      consecutiveFailures++;
      // Log warning every 5 failures to avoid spam
      if (consecutiveFailures % 5 === 0) {
        console.warn(`⚠️ Failed to fetch rate from endpoint (${consecutiveFailures} consecutive failures)`);
      }
      return; // Exit early, don't update rates
    }
    
    // Reset failure counter on success
    consecutiveFailures = 0;
    lastSuccessfulUpdate = Date.now();
    
    const baseRatePerGram = liveRate.ratePerGram;
    
    // Log every successful fetch (with timestamp for accuracy)
    const fetchTime = Date.now() - startTime;
    console.log(`✅ [${new Date().toISOString()}] Fetched live rate: ₹${baseRatePerGram.toFixed(2)}/gram (₹${liveRate.ratePerKg}/kg, source: ${liveRate.source}, fetch time: ${fetchTime}ms)`);
    
    // Update all rates based on the live rate from endpoint
    const updatePromises = rates.map(async (rate) => {
      try {
        // Validate rate has required fields
        if (!rate.weight || !rate.weight.value) {
          console.warn(`Skipping rate update for ${rate.name || rate._id} - missing required fields`);
          return;
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
        
        // Apply manual per-gram adjustment set by admin (can be negative)
        const manualAdj = (typeof rate.manualAdjustment === 'number') ? rate.manualAdjustment : 0;
        rate.ratePerGram = Math.round((ratePerGram + manualAdj) * 100) / 100;
        
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
            usdInrRate: liveRate.usdInrRate || 89.25, // Include USD rate in update
            gold999Rate: liveRate.gold999Rate || null,
            silverMini999Rate: liveRate.silverMini999Rate || null
          };
          io.emit('rateUpdate', rateData);
          // Also emit USD rate update separately
          io.emit('usdRateUpdate', { usdInrRate: liveRate.usdInrRate || 89.25 });
        }
      } catch (rateError) {
        console.error(`❌ Error updating rate ${rate.name || rate._id}:`, rateError.message);
      }
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);

    // Log every update to verify it's working
    const totalTime = Date.now() - startTime;
    console.log(`✅ Updated ${rates.length} rates (Base: ₹${baseRatePerGram.toFixed(2)}/gram from ${liveRate.source}, total time: ${totalTime}ms)`);
  } catch (error) {
    consecutiveFailures++;
    const errorTime = Date.now() - startTime;
    console.error(`❌ Error updating rates (${errorTime}ms):`, error.message || error);
    
    // If we've had too many consecutive failures, log a warning
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error(`⚠️ WARNING: ${consecutiveFailures} consecutive rate update failures. Last success: ${lastSuccessfulUpdate ? new Date(lastSuccessfulUpdate).toISOString() : 'never'}`);
    }
  }
};

// Start rate updater (updates every second)
const startRateUpdater = (io) => {
  console.log(`🚀 Starting rate updater - will update every ${UPDATE_INTERVAL}ms (${1000/UPDATE_INTERVAL} times per second)`);
  
  // Initial update (don't await to avoid blocking)
  updateRates(io).catch(err => {
    console.error('❌ Initial rate update failed:', err.message);
  });
  
  // Update every second as requested
  // Use setInterval but ensure we don't stack updates if one takes longer than 1 second
  let isUpdating = false;
  setInterval(() => {
    // Skip if previous update is still running (prevents stacking)
    if (isUpdating) {
      console.warn('⚠️ Previous rate update still running, skipping this cycle');
      return;
    }
    
    isUpdating = true;
    updateRates(io)
      .finally(() => {
        isUpdating = false;
      })
      .catch(err => {
        console.error('❌ Rate update error:', err.message);
        isUpdating = false;
      });
  }, UPDATE_INTERVAL);
};

module.exports = { startRateUpdater, updateRates };

