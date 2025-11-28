const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SilverRate = require('../models/SilverRate');

// In-memory store for manual adjustments (per rate type)
// Format: { "Silver Coin 1 Gram": { manualAdjustment: 0, ... }, ... }
// Exported so admin.js can access it
let manualAdjustments = {};

// Cache for live base rate (updated in background)
let cachedBaseRate = {
  ratePerGram: 169.0, // Default fallback rate
  ratePerKg: 169000,
  source: 'cache',
  lastUpdated: new Date(),
  usdInrRate: 89.25
};

// Background rate updater - updates cache every second
let backgroundUpdateInterval = null;

// Start background rate updater
const startBackgroundRateUpdater = () => {
  if (backgroundUpdateInterval) {
    return; // Already running
  }

  console.log('🔄 Starting background rate updater...');
  
  // Update immediately
  updateRatesInBackground();
  
  // Then update every second
  backgroundUpdateInterval = setInterval(() => {
    updateRatesInBackground();
  }, 1000);
};

// Update rates in background (non-blocking)
const updateRatesInBackground = async () => {
  try {
    const { fetchSilverRatesFromMultipleSources } = require('../utils/multiSourceRateFetcher');
    
    // Fetch with timeout for background updates
    const liveRate = await Promise.race([
      fetchSilverRatesFromMultipleSources(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Background timeout')), 8000) // 8s for background
      )
    ]);

    if (liveRate && liveRate.ratePerGram && liveRate.ratePerGram > 0) {
      const oldRate = cachedBaseRate.ratePerGram;
      cachedBaseRate = {
        ratePerGram: liveRate.ratePerGram,
        ratePerKg: liveRate.ratePerKg || (liveRate.ratePerGram * 1000),
        source: liveRate.source || 'live',
        lastUpdated: new Date(),
        usdInrRate: liveRate.usdInrRate || 89.25
      };
      
      // Log update
      if (Math.abs(oldRate - liveRate.ratePerGram) > 0.01) {
        console.log(`✅ Rate updated: ₹${oldRate.toFixed(2)} → ₹${liveRate.ratePerGram.toFixed(2)}/gram (${liveRate.source || 'live'})`);
      }
      
      // Update MongoDB in background (don't block)
      updateMongoDBRates(liveRate).catch((err) => {
        console.error('❌ MongoDB update failed:', err.message);
      });
    } else {
      console.warn('⚠️ Invalid rate received in background update:', liveRate);
    }
  } catch (error) {
    // Log errors more frequently to debug
    if (Math.random() < 0.1) { // Log 10% of failures
      console.warn('⚠️ Background rate update failed:', error.message);
    }
  }
};

// Update MongoDB rates (async, non-blocking)
const updateMongoDBRates = async (liveRate) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ MongoDB not connected, skipping rate update');
      return; // Skip if not connected
    }

    const baseRatePerGram = liveRate.ratePerGram;
    const rateDefinitions = [
      { name: 'Silver Coin 1 Gram', type: 'coin', weight: { value: 1, unit: 'grams' }, purity: '99.9%' },
      { name: 'Silver Coin 5 Grams', type: 'coin', weight: { value: 5, unit: 'grams' }, purity: '99.9%' },
      { name: 'Silver Coin 10 Grams', type: 'coin', weight: { value: 10, unit: 'grams' }, purity: '99.9%' },
      { name: 'Silver Coin 50 Grams', type: 'coin', weight: { value: 50, unit: 'grams' }, purity: '99.9%' },
      { name: 'Silver Coin 100 Grams', type: 'coin', weight: { value: 100, unit: 'grams' }, purity: '99.9%' },
      { name: 'Silver Bar 100 Grams', type: 'bar', weight: { value: 100, unit: 'grams' }, purity: '99.99%' },
      { name: 'Silver Bar 500 Grams', type: 'bar', weight: { value: 500, unit: 'grams' }, purity: '99.99%' },
      { name: 'Silver Bar 1 Kg', type: 'bar', weight: { value: 1, unit: 'kg' }, purity: '99.99%' },
      { name: 'Silver Jewelry 92.5%', type: 'jewelry', weight: { value: 1, unit: 'grams' }, purity: '92.5%' },
      { name: 'Silver Jewelry 99.9%', type: 'jewelry', weight: { value: 1, unit: 'grams' }, purity: '99.9%' }
    ];

    let updatedCount = 0;
    for (const rateDef of rateDefinitions) {
      try {
        let ratePerGram = baseRatePerGram;
        if (rateDef.purity === '92.5%') {
          ratePerGram = baseRatePerGram * 0.96;
        } else if (rateDef.purity === '99.99%') {
          ratePerGram = baseRatePerGram * 1.005;
        }

        const manualAdjustment = manualAdjustments[rateDef.name]?.manualAdjustment || 0;
        ratePerGram = ratePerGram + manualAdjustment;
        ratePerGram = Math.max(0, Math.round(ratePerGram * 100) / 100);

        let weightInGrams = rateDef.weight.value;
        if (rateDef.weight.unit === 'kg') {
          weightInGrams = rateDef.weight.value * 1000;
        } else if (rateDef.weight.unit === 'oz') {
          weightInGrams = rateDef.weight.value * 28.35;
        }

        const totalRate = Math.round(ratePerGram * weightInGrams * 100) / 100;

        await SilverRate.findOneAndUpdate(
          { name: rateDef.name, location: 'Andhra Pradesh' },
          {
            name: rateDef.name,
            type: rateDef.type,
            weight: rateDef.weight,
            purity: rateDef.purity,
            ratePerGram: ratePerGram,
            rate: totalRate,
            lastUpdated: new Date(),
            location: 'Andhra Pradesh',
            unit: 'INR',
            manualAdjustment: manualAdjustment
          },
          { upsert: true, new: true }
        );
        updatedCount++;
      } catch (err) {
        console.error(`❌ Failed to update ${rateDef.name}:`, err.message);
      }
    }
    
    if (updatedCount > 0 && Math.random() < 0.1) { // Log 10% of successful updates
      console.log(`✅ Updated ${updatedCount} rates in MongoDB`);
    }
  } catch (error) {
    console.error('❌ MongoDB rate update error:', error.message);
  }
};

// Get all silver rates - FAST response using cache, updates in background
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
    
    // Start background updater if not already running
    // On Vercel (serverless), this might restart on each request, which is fine
    if (!backgroundUpdateInterval) {
      startBackgroundRateUpdater();
    }
    
    // Check if cache is stale (older than 2 seconds) and trigger update
    const cacheAge = Date.now() - cachedBaseRate.lastUpdated.getTime();
    if (cacheAge > 2000) {
      // Cache is stale, trigger update (non-blocking)
      updateRatesInBackground().catch(() => {});
    }
    
    // Use cached rate for FAST response (always returns immediately)
    const baseRatePerGram = cachedBaseRate.ratePerGram;
    const currentTime = new Date();
    
    // Define all rate types - calculate on-the-fly from cached rate
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
    
    // Calculate all rates on-the-fly from cached rate (FAST - no API calls)
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
      
      // Return calculated rate object with cached data (always fast)
      return {
        _id: id,
        name: rateDef.name,
        type: rateDef.type,
        weight: rateDef.weight,
        purity: rateDef.purity,
        ratePerGram: ratePerGram, // Rate calculated from cached base rate
        rate: totalRate, // Total rate
        lastUpdated: currentTime, // ALWAYS current time (shows live updates)
        usdInrRate: cachedBaseRate.usdInrRate,
        source: cachedBaseRate.source, // Shows if from cache or live
        location: 'Andhra Pradesh',
        unit: 'INR',
        manualAdjustment: manualAdjustment // Include manual adjustment for reference
      };
    });
    
    // Return rates immediately (FAST - no waiting for API calls)
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

// Force rate update (admin only) - triggers immediate background update
router.post('/force-update', auth, async (req, res) => {
  try {
    updateRatesInBackground();
    res.json({ message: 'Background rate update triggered. Rates will update shortly.' });
  } catch (error) {
    console.error('Force update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Initialize default rates - loads from MongoDB or creates defaults
router.post('/initialize', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      // Try to load last known rate from MongoDB
      const lastRate = await SilverRate.findOne({ location: 'Andhra Pradesh' }).sort({ lastUpdated: -1 });
      if (lastRate && lastRate.ratePerGram) {
        cachedBaseRate = {
          ratePerGram: lastRate.ratePerGram,
          ratePerKg: lastRate.ratePerGram * 1000,
          source: 'mongodb',
          lastUpdated: lastRate.lastUpdated || new Date(),
          usdInrRate: 89.25
        };
        console.log(`✅ Loaded cached rate from MongoDB: ₹${lastRate.ratePerGram}/gram`);
      } else {
        console.log('⚠️ No rates found in MongoDB, using default cache');
      }
    } else {
      console.warn('⚠️ MongoDB not connected, using default cache');
    }
    
    // Start background updater
    startBackgroundRateUpdater();
    
    res.json({ 
      message: 'Rate system initialized. Background updater started.',
      currentRate: cachedBaseRate.ratePerGram,
      source: cachedBaseRate.source
    });
  } catch (error) {
    console.error('Initialize rates error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export manualAdjustments so admin.js can modify them
module.exports = router;
module.exports.manualAdjustments = manualAdjustments;
module.exports.startBackgroundRateUpdater = startBackgroundRateUpdater;
