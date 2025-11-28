const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// In-memory store for manual adjustments (per rate type)
// Format: { "Silver Coin 1 Gram": { manualAdjustment: 0, ... }, ... }
// Exported so admin.js can access it
let manualAdjustments = {};

// Get all silver rates - NO MongoDB, fetch directly from endpoints and calculate on-the-fly
router.get('/', async (req, res) => {
  try {
    // Try to get user from auth if token is provided, but don't require it
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const jwt = require('jsonwebtoken');
        jwt.verify(token, process.env.JWT_SECRET || 'jain_silver_secret_key_2024_change_in_production');
      }
    } catch (authError) {
      // No valid token - continue without auth
    }
    
    // Fetch live rates EVERY SECOND - ONLY return LIVE rates from endpoints
    let liveRate = null;
    let fetchError = null;
    try {
      const { fetchSilverRatesFromMultipleSources } = require('../utils/multiSourceRateFetcher');
      
      console.log('📡 Starting live rate fetch from endpoints...');
      
      // Fetch with timeout - MUST get live data every second
      // Both RB Goldspot and Vercel sources are tried in parallel
      liveRate = await Promise.race([
        fetchSilverRatesFromMultipleSources(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout after 15 seconds')), 15000) // 15 seconds - enough time for both sources
        )
      ]);
      
      // Log successful fetch
      if (liveRate && liveRate.ratePerGram) {
        console.log(`✅ Successfully fetched live rate: ₹${liveRate.ratePerGram}/gram from ${liveRate.source || 'unknown'}`);
      } else {
        console.warn('⚠️ Fetch returned but rate is invalid:', liveRate);
      }
    } catch (error) {
      // Live fetch failed - log detailed error
      fetchError = error;
      console.error('❌ Live rate fetch failed:', error.message);
      console.error('  Error stack:', error.stack?.substring(0, 500));
      if (error.code) {
        console.error('  Error code:', error.code);
      }
    }
    
    // ONLY proceed if we have a valid live rate
    if (!liveRate || !liveRate.ratePerGram || liveRate.ratePerGram <= 0) {
      const errorDetails = {
        liveRate: liveRate ? {
          ratePerGram: liveRate.ratePerGram,
          source: liveRate.source,
          hasRatePerGram: !!liveRate.ratePerGram,
          ratePerKg: liveRate.ratePerKg
        } : 'null',
        error: fetchError?.message || 'Invalid rate received',
        timestamp: new Date().toISOString()
      };
      console.warn('⚠️ Invalid live rate received:', errorDetails);
      
      // Return error details in response for debugging
      return res.status(503).json({ 
        error: 'Live rate fetch failed',
        message: fetchError?.message || 'Invalid rate received',
        details: 'Unable to fetch rates from RB Goldspot or Vercel endpoints. Please try again.',
        debug: errorDetails,
        timestamp: new Date().toISOString()
      });
    }
    
    const currentTime = new Date();
    const baseRatePerGram = liveRate.ratePerGram; // Base rate for 99.9% purity
    
    // Define all rate types - calculate on-the-fly from live rate
    const rateDefinitions = [
      // Silver Coins (99.9% purity)
      { name: 'Silver Coin 1 Gram', type: 'coin', weight: { value: 1, unit: 'grams' }, purity: '99.9%' },
      { name: 'Silver Coin 5 Grams', type: 'coin', weight: { value: 5, unit: 'grams' }, purity: '99.9%' },
      { name: 'Silver Coin 10 Grams', type: 'coin', weight: { value: 10, unit: 'grams' }, purity: '99.9%' },
      { name: 'Silver Coin 50 Grams', type: 'coin', weight: { value: 50, unit: 'grams' }, purity: '99.9%' },
      { name: 'Silver Coin 100 Grams', type: 'coin', weight: { value: 100, unit: 'grams' }, purity: '99.9%' },
      
      // Silver Bars (99.99% purity)
      { name: 'Silver Bar 100 Grams', type: 'bar', weight: { value: 100, unit: 'grams' }, purity: '99.99%' },
      { name: 'Silver Bar 500 Grams', type: 'bar', weight: { value: 500, unit: 'grams' }, purity: '99.99%' },
      { name: 'Silver Bar 1 Kg', type: 'bar', weight: { value: 1, unit: 'kg' }, purity: '99.99%' },
      
      // Silver Jewelry
      { name: 'Silver Jewelry 92.5%', type: 'jewelry', weight: { value: 1, unit: 'grams' }, purity: '92.5%' },
      { name: 'Silver Jewelry 99.9%', type: 'jewelry', weight: { value: 1, unit: 'grams' }, purity: '99.9%' }
    ];
    
    // Calculate all rates on-the-fly from live rate
    const allRates = rateDefinitions.map(rateDef => {
      // Calculate rate per gram based on purity
      let ratePerGram = baseRatePerGram;
      if (rateDef.purity === '92.5%') {
        ratePerGram = baseRatePerGram * 0.96;
      } else if (rateDef.purity === '99.99%') {
        ratePerGram = baseRatePerGram * 1.005;
      }
      
      // Apply manual adjustment (if exists)
      const manualAdjustment = manualAdjustments[rateDef.name]?.manualAdjustment || 0;
      ratePerGram = ratePerGram + manualAdjustment;
      ratePerGram = Math.max(0, Math.round(ratePerGram * 100) / 100);
      
      // Calculate total rate
      let weightInGrams = rateDef.weight.value;
      if (rateDef.weight.unit === 'kg') {
        weightInGrams = rateDef.weight.value * 1000;
      } else if (rateDef.weight.unit === 'oz') {
        weightInGrams = rateDef.weight.value * 28.35;
      }
      
      const totalRate = Math.round(ratePerGram * weightInGrams * 100) / 100;
      
      // Generate a consistent ID based on name
      const id = Buffer.from(rateDef.name).toString('base64').substring(0, 24);
      
      // Return calculated rate object with LIVE data
      return {
        _id: id,
        name: rateDef.name,
        type: rateDef.type,
        weight: rateDef.weight,
        purity: rateDef.purity,
        ratePerGram: ratePerGram, // LIVE rate calculated from endpoint
        rate: totalRate, // LIVE total rate
        lastUpdated: currentTime, // ALWAYS fresh timestamp
        usdInrRate: liveRate.usdInrRate || 89.25,
        source: liveRate.source || 'live', // Track data source
        location: 'Andhra Pradesh',
        unit: 'INR',
        manualAdjustment: manualAdjustment // Include manual adjustment for reference
      };
    });
    
    // Return ONLY live rates calculated from endpoints
    return res.json(allRates || []);
    
  } catch (error) {
    // Last resort - return empty array
    console.error('Get rates error:', error.message);
    return res.json([]);
  }
});

// Update silver rate (admin only) - stores manual adjustment in memory
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rate, manualAdjustment } = req.body;

    // Find rate by ID (decode from base64)
    const rateDefinitions = [
      { name: 'Silver Coin 1 Gram' },
      { name: 'Silver Coin 5 Grams' },
      { name: 'Silver Coin 10 Grams' },
      { name: 'Silver Coin 50 Grams' },
      { name: 'Silver Coin 100 Grams' },
      { name: 'Silver Bar 100 Grams' },
      { name: 'Silver Bar 500 Grams' },
      { name: 'Silver Bar 1 Kg' },
      { name: 'Silver Jewelry 92.5%' },
      { name: 'Silver Jewelry 99.9%' }
    ];
    
    const rateDef = rateDefinitions.find(r => {
      const rateId = Buffer.from(r.name).toString('base64').substring(0, 24);
      return rateId === id;
    });
    
    if (!rateDef) {
      return res.status(404).json({ message: 'Rate not found' });
    }

    // Store manual adjustment in memory
    if (manualAdjustment !== undefined) {
      if (!manualAdjustments[rateDef.name]) {
        manualAdjustments[rateDef.name] = {};
      }
      manualAdjustments[rateDef.name].manualAdjustment = manualAdjustment;
    }

    res.json({
      message: 'Rate adjustment updated successfully',
      rate: {
        name: rateDef.name,
        manualAdjustment: manualAdjustments[rateDef.name]?.manualAdjustment || 0
      }
    });
  } catch (error) {
    console.error('Update rate error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Force rate update (admin only) - no-op since we fetch live every time
router.post('/force-update', auth, async (req, res) => {
  try {
    res.json({ message: 'Rates are fetched live from endpoints every second. No update needed.' });
  } catch (error) {
    console.error('Force update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Initialize default rates - no-op since we calculate on-the-fly
router.post('/initialize', async (req, res) => {
  try {
    res.json({ message: 'Rates are calculated live from endpoints. No initialization needed.' });
  } catch (error) {
    console.error('Initialize rates error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export manualAdjustments so admin.js can modify them
module.exports = router;
module.exports.manualAdjustments = manualAdjustments;
