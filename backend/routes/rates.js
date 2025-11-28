const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SilverRate = require('../models/SilverRate');

// In-memory store for manual adjustments (per rate type)
let manualAdjustments = {};

// Cache for live base rate (updated on every request)
let cachedBaseRate = {
  ratePerGram: 169.0, // Default fallback rate
  ratePerKg: 169000,
  source: 'cache',
  lastUpdated: new Date(),
  usdInrRate: 89.25
};

// Track last update attempt to prevent too frequent updates
let lastUpdateAttempt = 0;
let lastSuccessfulUpdate = 0;
const MIN_UPDATE_INTERVAL = 1000; // Update at most once per second

// Update rates from endpoints (non-blocking)
const updateRatesFromEndpoints = async () => {
  const now = Date.now();
  
  // Prevent too frequent updates (max once per second)
  // But allow update if last successful update was more than 2 seconds ago
  const timeSinceLastAttempt = now - lastUpdateAttempt;
  const timeSinceLastSuccess = now - lastSuccessfulUpdate;
  
  if (timeSinceLastAttempt < MIN_UPDATE_INTERVAL && timeSinceLastSuccess < 2000) {
    return; // Skip if updated recently AND last success was recent
  }
  
  lastUpdateAttempt = now;
  
  console.log(`📡 Fetching rates from endpoints... (last attempt: ${timeSinceLastAttempt}ms ago, last success: ${timeSinceLastSuccess}ms ago)`);
  
  try {
    const { fetchSilverRatesFromMultipleSources } = require('../utils/multiSourceRateFetcher');
    
    // Fetch with timeout
    const liveRate = await Promise.race([
      fetchSilverRatesFromMultipleSources(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 8 seconds')), 8000) // 8s timeout
      )
    ]);

    console.log('📊 Fetch result:', liveRate ? {
      ratePerGram: liveRate.ratePerGram,
      source: liveRate.source,
      hasRatePerGram: !!liveRate.ratePerGram
    } : 'null');

    if (liveRate && liveRate.ratePerGram && liveRate.ratePerGram > 0) {
      const oldRate = cachedBaseRate.ratePerGram;
      cachedBaseRate = {
        ratePerGram: liveRate.ratePerGram,
        ratePerKg: liveRate.ratePerKg || (liveRate.ratePerGram * 1000),
        source: liveRate.source || 'live',
        lastUpdated: new Date(),
        usdInrRate: liveRate.usdInrRate || 89.25
      };
      
      // Always log updates
      console.log(`✅ Rate updated: ₹${oldRate.toFixed(2)} → ₹${liveRate.ratePerGram.toFixed(2)}/gram (${liveRate.source || 'live'})`);
      
      // Mark successful update
      lastSuccessfulUpdate = Date.now();
      
      // Update MongoDB immediately (await to ensure it completes)
      try {
        await updateMongoDBRates(liveRate);
      } catch (mongoError) {
        console.error('❌ MongoDB update failed:', mongoError.message);
      }
    } else {
      console.warn('⚠️ Invalid rate received:', liveRate);
    }
  } catch (error) {
    // Always log errors to debug
    console.error('❌ Rate fetch failed:', error.message);
    if (error.stack) {
      console.error('  Stack:', error.stack.substring(0, 500));
    }
  }
};

// Update MongoDB rates (synchronous to ensure updates)
const updateMongoDBRates = async (liveRate) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // Try to connect if not connected
      try {
        await mongoose.connect(process.env.MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 3000,
        });
      } catch (connError) {
        console.warn('⚠️ MongoDB connection failed:', connError.message);
        return;
      }
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
    const updatePromises = rateDefinitions.map(async (rateDef) => {
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
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    if (updatedCount > 0) {
      console.log(`✅ Updated ${updatedCount} rates in MongoDB (₹${baseRatePerGram.toFixed(2)}/gram)`);
    }
  } catch (error) {
    console.error('❌ MongoDB rate update error:', error.message);
  }
};

// Get all silver rates - ALWAYS tries to update, returns cache immediately
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
    
    // ALWAYS try to update rates (non-blocking, returns cache immediately)
    // This ensures rates update every second on Vercel (serverless)
    // Don't await - return cache immediately, update happens in background
    const updatePromise = updateRatesFromEndpoints();
    updatePromise.catch((err) => {
      console.error('❌ Update failed in GET handler:', err.message);
    });
    
    // Log cache status
    const cacheAge = Date.now() - cachedBaseRate.lastUpdated.getTime();
    if (cacheAge > 5000) {
      console.warn(`⚠️ Cache is stale: ${Math.round(cacheAge / 1000)}s old`);
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

// Force rate update (admin only) - triggers immediate update
router.post('/force-update', auth, async (req, res) => {
  try {
    // Reset last update attempt to force immediate update
    lastUpdateAttempt = 0;
    await updateRatesFromEndpoints();
    res.json({ 
      message: 'Rate update triggered successfully.',
      currentRate: cachedBaseRate.ratePerGram,
      source: cachedBaseRate.source
    });
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
    
    // Trigger immediate update
    updateRatesFromEndpoints().catch(() => {});
    
    res.json({ 
      message: 'Rate system initialized. Updates will happen on every request.',
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
