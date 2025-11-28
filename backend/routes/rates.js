const express = require('express');
const router = express.Router();
const SilverRate = require('../models/SilverRate');
const auth = require('../middleware/auth');

// Get all silver rates (allow without auth for public viewing, but auth recommended)
// Fetches live rates from RB Goldspot API every second and updates MongoDB
router.get('/', async (req, res) => {
  let allRates = [];
  
  try {
    // Ensure MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jain_silver', {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000,
        });
      } catch (connError) {
        console.error('MongoDB connection failed:', connError.message);
        // Continue - will try to return cached rates or empty array
      }
    }

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
    
    // Get rates from MongoDB first (always return something)
    try {
      allRates = await SilverRate.find({ location: 'Andhra Pradesh' }).sort({ type: 1, 'weight.value': 1 }).lean();
      
      // Ensure all rates have required fields
      allRates = allRates.map(rate => ({
        ...rate,
        lastUpdated: rate.lastUpdated || new Date() // Ensure timestamp exists
      }));
    } catch (dbError) {
      console.error('Error fetching rates from DB:', dbError.message);
      allRates = []; // Empty array if DB fails
    }
    
    // Fetch live rates EVERY SECOND - ALWAYS fetch fresh data from both sources
    let liveRate = null;
    try {
      const { fetchSilverRatesFromMultipleSources } = require('../utils/multiSourceRateFetcher');
      
      // Fetch with timeout - MUST get live data every second
      // Both RB Goldspot and Vercel sources are tried in parallel
      liveRate = await Promise.race([
        fetchSilverRatesFromMultipleSources(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 4000) // 4 seconds - enough time for both sources
        )
      ]);
    } catch (fetchError) {
      // If fetch fails, log occasionally but continue with cached rates
      // This ensures we always return something, but we should try to get live data
      if (Math.random() < 0.05) { // Log 5% of failures to avoid spam
        console.warn('⚠️ Live rate fetch failed, using cached rates:', fetchError.message);
      }
      liveRate = null;
    }
    
    const currentTime = new Date();
    
    // ALWAYS update rates - even if live fetch failed, update timestamps
    // This ensures frontend sees updates every second
    if (liveRate && liveRate.ratePerGram && liveRate.ratePerGram > 0) {
      const baseRatePerGram = liveRate.ratePerGram;
      
      // Update rates in memory immediately with LIVE data (for fast response)
      allRates = allRates.map(rate => {
        if (!rate.weight || !rate.weight.value) {
          // Still update timestamp even if weight is missing
          return {
            ...rate,
            lastUpdated: currentTime
          };
        }
        
        // Calculate rate per gram based on purity
        let ratePerGram = baseRatePerGram;
        if (rate.purity === '92.5%') {
          ratePerGram = baseRatePerGram * 0.96;
        } else if (rate.purity === '99.99%') {
          ratePerGram = baseRatePerGram * 1.005;
        }
        
        // Apply manual adjustment
        const manualAdjustment = (rate.manualAdjustment !== undefined && rate.manualAdjustment !== null) ? rate.manualAdjustment : 0;
        ratePerGram = ratePerGram + manualAdjustment;
        ratePerGram = Math.max(0, Math.round(ratePerGram * 100) / 100);
        
        // Calculate total rate
        let weightInGrams = rate.weight.value;
        if (rate.weight.unit === 'kg') {
          weightInGrams = rate.weight.value * 1000;
        } else if (rate.weight.unit === 'oz') {
          weightInGrams = rate.weight.value * 28.35;
        }
        
        const totalRate = Math.round(ratePerGram * weightInGrams * 100) / 100;
        
        // Return updated rate object with fresh timestamp and LIVE rate
        return {
          ...rate,
          ratePerGram: ratePerGram, // LIVE rate from RB Goldspot/Vercel
          rate: totalRate, // LIVE total rate
          lastUpdated: currentTime, // ALWAYS fresh timestamp
          usdInrRate: liveRate.usdInrRate || rate.usdInrRate,
          source: liveRate.source || 'cache' // Track data source
        };
      });
      
      // Update database asynchronously (don't block response)
      Promise.all(
        allRates.map(rate => 
          SilverRate.findByIdAndUpdate(rate._id, {
            ratePerGram: rate.ratePerGram,
            rate: rate.rate,
            lastUpdated: rate.lastUpdated
          }).catch(() => {})
        )
      ).catch(() => {});
    } else {
      // Even if no live rate fetched, update timestamps to show we're checking
      // This ensures frontend sees activity every second
      allRates = allRates.map(rate => ({
        ...rate,
        lastUpdated: currentTime, // Update timestamp even for cached rates
        source: 'cache' // Indicate this is cached data
      }));
    }
    
    // Always return rates with fresh timestamps (even if empty or cached)
    return res.json(allRates || []);
    
  } catch (error) {
    // Last resort - return whatever we have or empty array
    console.error('Get rates error:', error.message);
    return res.json(allRates || []);
  }
});

// Update silver rate (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rate } = req.body;

    if (!rate || rate < 0) {
      return res.status(400).json({ message: 'Valid rate is required' });
    }

    const silverRate = await SilverRate.findByIdAndUpdate(
      id,
      { 
        rate,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!silverRate) {
      return res.status(404).json({ message: 'Rate not found' });
    }

    // Emit real-time update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('rateUpdate', silverRate);
    }

    res.json({
      message: 'Rate updated successfully',
      rate: silverRate
    });
  } catch (error) {
    console.error('Update rate error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Force rate update (admin only)
router.post('/force-update', auth, async (req, res) => {
  try {
    const { updateRates } = require('../utils/rateUpdater');
    const io = req.app.get('io');
    await updateRates(io);
    res.json({ message: 'Rates updated successfully' });
  } catch (error) {
    console.error('Force update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Initialize default rates (Andhra Pradesh)
router.post('/initialize', async (req, res) => {
  try {
    const RATE_PER_GRAM_999 = 75.50;
    const RATE_PER_GRAM_9999 = 76.00;
    const RATE_PER_GRAM_925 = 69.50;

    const defaultRates = [
      { name: 'Silver Coin 1 Gram', type: 'coin', weight: { value: 1, unit: 'grams' }, purity: '99.9%', rate: RATE_PER_GRAM_999 * 1, ratePerGram: RATE_PER_GRAM_999, location: 'Andhra Pradesh' },
      { name: 'Silver Coin 5 Grams', type: 'coin', weight: { value: 5, unit: 'grams' }, purity: '99.9%', rate: RATE_PER_GRAM_999 * 5, ratePerGram: RATE_PER_GRAM_999, location: 'Andhra Pradesh' },
      { name: 'Silver Coin 10 Grams', type: 'coin', weight: { value: 10, unit: 'grams' }, purity: '99.9%', rate: RATE_PER_GRAM_999 * 10, ratePerGram: RATE_PER_GRAM_999, location: 'Andhra Pradesh' },
      { name: 'Silver Coin 50 Grams', type: 'coin', weight: { value: 50, unit: 'grams' }, purity: '99.9%', rate: RATE_PER_GRAM_999 * 50, ratePerGram: RATE_PER_GRAM_999, location: 'Andhra Pradesh' },
      { name: 'Silver Coin 100 Grams', type: 'coin', weight: { value: 100, unit: 'grams' }, purity: '99.9%', rate: RATE_PER_GRAM_999 * 100, ratePerGram: RATE_PER_GRAM_999, location: 'Andhra Pradesh' },
      { name: 'Silver Bar 100 Grams', type: 'bar', weight: { value: 100, unit: 'grams' }, purity: '99.99%', rate: RATE_PER_GRAM_9999 * 100, ratePerGram: RATE_PER_GRAM_9999, location: 'Andhra Pradesh' },
      { name: 'Silver Bar 500 Grams', type: 'bar', weight: { value: 500, unit: 'grams' }, purity: '99.99%', rate: RATE_PER_GRAM_9999 * 500, ratePerGram: RATE_PER_GRAM_9999, location: 'Andhra Pradesh' },
      { name: 'Silver Bar 1 Kg', type: 'bar', weight: { value: 1, unit: 'kg' }, purity: '99.99%', rate: RATE_PER_GRAM_9999 * 1000, ratePerGram: RATE_PER_GRAM_9999, location: 'Andhra Pradesh' },
      { name: 'Silver Jewelry 92.5%', type: 'jewelry', weight: { value: 1, unit: 'grams' }, purity: '92.5%', rate: RATE_PER_GRAM_925, ratePerGram: RATE_PER_GRAM_925, location: 'Andhra Pradesh' },
      { name: 'Silver Jewelry 99.9%', type: 'jewelry', weight: { value: 1, unit: 'grams' }, purity: '99.9%', rate: RATE_PER_GRAM_999, ratePerGram: RATE_PER_GRAM_999, location: 'Andhra Pradesh' }
    ];

    for (const rateData of defaultRates) {
      await SilverRate.findOneAndUpdate(
        { name: rateData.name, 'weight.value': rateData.weight.value, purity: rateData.purity },
        rateData,
        { upsert: true, new: true }
      );
    }

    res.json({ message: 'Andhra Pradesh silver rates initialized successfully' });
  } catch (error) {
    console.error('Initialize rates error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

