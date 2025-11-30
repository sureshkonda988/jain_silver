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

// Rate history for smoothing (keep last 10 rates for averaging)
let rateHistory = [];
const MAX_HISTORY_SIZE = 10;

// Track last update attempt to prevent too frequent updates
let lastUpdateAttempt = 0;
let lastSuccessfulUpdate = 0;
const MIN_UPDATE_INTERVAL = 1000; // Update at most once per second

// Rate smoothing: Only update if change is significant (prevents rapid fluctuations)
// Increased to ₹0.50/gram to prevent small market fluctuations from causing visual noise
const RATE_CHANGE_THRESHOLD = 0.50;

// Calculate smoothed rate using exponential moving average
const calculateSmoothedRate = (newRate) => {
  // Add new rate to history
  rateHistory.push({
    rate: newRate,
    timestamp: Date.now()
  });
  
  // Keep only recent rates (last 10)
  if (rateHistory.length > MAX_HISTORY_SIZE) {
    rateHistory.shift();
  }
  
  // Remove rates older than 30 seconds
  const thirtySecondsAgo = Date.now() - 30000;
  rateHistory = rateHistory.filter(r => r.timestamp > thirtySecondsAgo);
  
  if (rateHistory.length === 0) {
    return newRate;
  }
  
  // Calculate weighted average (more recent = higher weight)
  let totalWeight = 0;
  let weightedSum = 0;
  
  rateHistory.forEach((item, index) => {
    const weight = index + 1; // More recent rates have higher weight
    weightedSum += item.rate * weight;
    totalWeight += weight;
  });
  
  const smoothedRate = weightedSum / totalWeight;
  return Math.round(smoothedRate * 100) / 100;
};

// Update rates from endpoints (non-blocking)
const updateRatesFromEndpoints = async () => {
  const now = Date.now();
  
  // Prevent too frequent updates (max once per second)
  const timeSinceLastAttempt = now - lastUpdateAttempt;
  const timeSinceLastSuccess = now - lastSuccessfulUpdate;
  
  if (timeSinceLastAttempt < MIN_UPDATE_INTERVAL && timeSinceLastSuccess < 3000) {
    return; // Skip if updated recently AND last success was recent
  }
  
  lastUpdateAttempt = now;
  
  console.log(`📡 Fetching rates from endpoints... (last attempt: ${timeSinceLastAttempt}ms ago)`);
  
  try {
    const { fetchSilverRatesFromMultipleSources } = require('../utils/multiSourceRateFetcher');
    
    // Fetch with timeout
    const liveRate = await Promise.race([
      fetchSilverRatesFromMultipleSources(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000)
      )
    ]);

    if (liveRate && liveRate.ratePerGram && liveRate.ratePerGram > 0) {
      const oldRate = cachedBaseRate.ratePerGram;
      
      // Apply smoothing to reduce rapid fluctuations
      const smoothedRate = calculateSmoothedRate(liveRate.ratePerGram);
      const rateChange = Math.abs(smoothedRate - oldRate);
      
      // Log raw vs smoothed rate
      console.log(`📊 Raw: ₹${liveRate.ratePerGram.toFixed(2)}/g → Smoothed: ₹${smoothedRate.toFixed(2)}/g (change: ₹${rateChange.toFixed(2)})`);
      
      // Only update if change is significant OR if cache is stale (older than 10 seconds)
      const cacheAge = Date.now() - cachedBaseRate.lastUpdated.getTime();
      const isStale = cacheAge > 10000;
      const isInitial = oldRate === 169.0 && cachedBaseRate.source === 'cache';
      
      if (rateChange >= RATE_CHANGE_THRESHOLD || isStale || isInitial) {
        cachedBaseRate = {
          ratePerGram: smoothedRate,
          ratePerKg: Math.round(smoothedRate * 1000),
          source: liveRate.source || 'live',
          lastUpdated: new Date(),
          usdInrRate: liveRate.usdInrRate || 89.25
        };
        
        // Log updates with change indicator
        const changeIndicator = smoothedRate > oldRate ? '↑' : (smoothedRate < oldRate ? '↓' : '≈');
        console.log(`✅ Rate updated: ₹${oldRate.toFixed(2)} → ₹${smoothedRate.toFixed(2)}/gram ${changeIndicator}`);
        
        // Mark successful update
        lastSuccessfulUpdate = Date.now();
        
        // Update MongoDB with smoothed rate
        try {
          const smoothedLiveRate = { 
            ...liveRate, 
            ratePerGram: smoothedRate, 
            ratePerKg: Math.round(smoothedRate * 1000) 
          };
          await updateMongoDBRates(smoothedLiveRate);
        } catch (mongoError) {
          console.error('❌ MongoDB update failed:', mongoError.message);
        }
      } else {
        console.log(`⏭️ Stable rate: ₹${oldRate.toFixed(2)}/gram (change ${rateChange.toFixed(2)} < threshold ${RATE_CHANGE_THRESHOLD})`);
        // Still mark as successful even if we didn't update (rate is stable)
        lastSuccessfulUpdate = Date.now();
      }
    } else {
      console.warn('⚠️ Invalid rate received:', liveRate);
    }
  } catch (error) {
    console.error('❌ Rate fetch failed:', error.message);
  }
};

// Update MongoDB rates
const updateMongoDBRates = async (liveRate) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      try {
        await mongoose.connect(process.env.MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ MongoDB connected for rate update');
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
            manualAdjustment: manualAdjustment,
            source: 'rbgoldspot'
          },
          { upsert: true, new: true }
        );
        updatedCount++;
      } catch (err) {
        console.error(`❌ Failed to update ${rateDef.name}:`, err.message);
      }
    });
    
    await Promise.all(updatePromises);
    
    if (updatedCount > 0) {
      console.log(`✅ MongoDB: Updated ${updatedCount} rates (base: ₹${baseRatePerGram.toFixed(2)}/gram)`);
    }
  } catch (error) {
    console.error('❌ MongoDB rate update error:', error.message);
  }
};

// Get all silver rates - First tries MongoDB, then live API
router.get('/', async (req, res) => {
  try {
    // Auth check (optional)
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const jwt = require('jsonwebtoken');
        jwt.verify(token, process.env.JWT_SECRET || 'jain_silver_secret_key_2024_change_in_production');
      }
    } catch (authError) {
      // Continue without auth
    }
    
    // Trigger background update (non-blocking)
    updateRatesFromEndpoints().catch(() => {});
    
    // ALWAYS try to get rates from MongoDB first (primary source)
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        const mongoRates = await SilverRate.find({ location: 'Andhra Pradesh' })
          .sort({ name: 1 })
          .lean();
        
        if (mongoRates && mongoRates.length > 0) {
          // Always use MongoDB rates if available (they're updated every second)
          const latestRate = mongoRates.reduce((latest, rate) => {
            return rate.lastUpdated > latest.lastUpdated ? rate : latest;
          }, mongoRates[0]);
          
          const mongoAge = Date.now() - new Date(latestRate.lastUpdated).getTime();
          
          // Log the age for debugging, but always serve from MongoDB
          console.log(`📦 Serving ${mongoRates.length} rates from MongoDB (${Math.round(mongoAge/1000)}s old, latest: ${latestRate.name} = ₹${latestRate.ratePerGram}/gram)`);
          
          // Add USD rate to all rates if available
          const ratesWithUSD = mongoRates.map(rate => ({
            ...rate,
            usdInrRate: cachedBaseRate.usdInrRate || 89.25
          }));
          
          // Set headers to prevent caching
          res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          });
          
          return res.json(ratesWithUSD);
        } else {
          console.warn('⚠️ No rates found in MongoDB, falling back to cache');
        }
      } else {
        console.warn('⚠️ MongoDB not connected, falling back to cache');
      }
    } catch (mongoErr) {
      console.error('❌ MongoDB read failed:', mongoErr.message);
      console.warn('⚠️ Falling back to cache');
    }
    
    // Fallback: Calculate rates from cache
    const baseRatePerGram = cachedBaseRate.ratePerGram;
    const currentTime = new Date();
    
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
    
    const allRates = rateDefinitions.map(rateDef => {
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
      }
      
      const totalRate = Math.round(ratePerGram * weightInGrams * 100) / 100;
      const id = Buffer.from(rateDef.name).toString('base64').substring(0, 24);
      
      return {
        _id: id,
        name: rateDef.name,
        type: rateDef.type,
        weight: rateDef.weight,
        purity: rateDef.purity,
        ratePerGram: ratePerGram,
        rate: totalRate,
        lastUpdated: currentTime,
        usdInrRate: cachedBaseRate.usdInrRate,
        source: cachedBaseRate.source,
        location: 'Andhra Pradesh',
        unit: 'INR',
        manualAdjustment: manualAdjustment
      };
    });
    
    console.log(`📦 Serving ${allRates.length} rates from cache (base: ₹${baseRatePerGram.toFixed(2)}/gram)`);
    
    // Set headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    return res.json(allRates);
    
  } catch (error) {
    console.error('Get rates error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch rates', message: error.message });
  }
});

// Update silver rate (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rate, manualAdjustment } = req.body;

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

// Force rate update (admin only)
router.post('/force-update', auth, async (req, res) => {
  try {
    lastUpdateAttempt = 0;
    rateHistory = []; // Clear history for fresh start
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

// Initialize rates - loads from MongoDB
router.post('/initialize', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      const lastRate = await SilverRate.findOne({ location: 'Andhra Pradesh' }).sort({ lastUpdated: -1 });
      if (lastRate && lastRate.ratePerGram) {
        cachedBaseRate = {
          ratePerGram: lastRate.ratePerGram,
          ratePerKg: lastRate.ratePerGram * 1000,
          source: 'mongodb',
          lastUpdated: lastRate.lastUpdated || new Date(),
          usdInrRate: 89.25
        };
        // Pre-populate rate history with MongoDB rate
        rateHistory = [{ rate: lastRate.ratePerGram, timestamp: Date.now() }];
        console.log(`✅ Loaded rate from MongoDB: ₹${lastRate.ratePerGram}/gram`);
      }
    }
    
    // Trigger update
    updateRatesFromEndpoints().catch(() => {});
    
    res.json({ 
      message: 'Rate system initialized.',
      currentRate: cachedBaseRate.ratePerGram,
      source: cachedBaseRate.source
    });
  } catch (error) {
    console.error('Initialize rates error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Adjust base rate (admin only) - for quick +/- adjustments
router.post('/adjust', auth, async (req, res) => {
  try {
    const { adjustment } = req.body; // e.g., +100 or -100 (in rupees per kg)
    
    if (typeof adjustment !== 'number') {
      return res.status(400).json({ message: 'Adjustment must be a number (rupees per kg)' });
    }
    
    const adjustmentPerGram = adjustment / 1000;
    const oldRate = cachedBaseRate.ratePerGram;
    const newRate = Math.max(0, oldRate + adjustmentPerGram);
    
    cachedBaseRate = {
      ...cachedBaseRate,
      ratePerGram: Math.round(newRate * 100) / 100,
      ratePerKg: Math.round(newRate * 1000),
      lastUpdated: new Date(),
      source: 'admin-adjusted'
    };
    
    // Update MongoDB with adjusted rate
    await updateMongoDBRates(cachedBaseRate);
    
    console.log(`🔧 Admin adjusted rate: ₹${oldRate.toFixed(2)} → ₹${cachedBaseRate.ratePerGram.toFixed(2)}/gram (${adjustment > 0 ? '+' : ''}${adjustment}/kg)`);
    
    res.json({
      message: 'Rate adjusted successfully',
      oldRate: oldRate,
      newRate: cachedBaseRate.ratePerGram,
      adjustment: adjustment
    });
  } catch (error) {
    console.error('Adjust rate error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
module.exports.manualAdjustments = manualAdjustments;
module.exports.updateRatesFromEndpoints = updateRatesFromEndpoints;
module.exports.getCachedBaseRate = () => cachedBaseRate;
module.exports.setCachedBaseRate = (rate) => { cachedBaseRate = rate; };
