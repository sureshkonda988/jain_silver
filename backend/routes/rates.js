const express = require('express');
const router = express.Router();
const SilverRate = require('../models/SilverRate');
const auth = require('../middleware/auth');

// Get all silver rates (allow without auth for public viewing, but auth recommended)
// Fetches live rates from jainsilverpp1.vercel.app/prices/stream and updates MongoDB
router.get('/', async (req, res) => {
  try {
    // Ensure MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // Try to connect
      try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jain_silver', {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000,
        });
      } catch (connError) {
        console.error('MongoDB connection failed:', connError);
        return res.status(503).json({ 
          message: 'Database connection unavailable', 
          error: 'Service temporarily unavailable' 
        });
      }
    }

    // Try to get user from auth if token is provided, but don't require it
    let user = null;
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jain_silver_secret_key_2024_change_in_production');
        // User is authenticated, but we'll still return rates
        user = decoded;
      }
    } catch (authError) {
      // No valid token, but we'll still return rates for public viewing
    }
    
    // Fetch live rates - NO FALLBACK, must get live data
    let liveRate = null;
    let ratesUpdated = false;
    try {
      console.log('🔄 Fetching live rates from RB Goldspot...');
      const { fetchSilverRatesFromMultipleSources } = require('../utils/multiSourceRateFetcher');
      
      // Fetch live rates with timeout handling
      try {
        liveRate = await Promise.race([
          fetchSilverRatesFromMultipleSources(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('RB Goldspot API timeout')), 10000)
          )
        ]);
      } catch (timeoutError) {
        // Timeout occurred - continue with null liveRate and use cached rates
        console.warn('⚠️ Rate fetch timeout, will use cached rates');
        liveRate = null;
      }
      
      if (!liveRate || !liveRate.ratePerGram || liveRate.ratePerGram <= 0) {
        console.warn('⚠️ Failed to fetch live rate, will use cached rates if available');
        // Don't return error immediately - try to return cached rates below
      } else {
        console.log(`✅ Fetched live rate: ₹${liveRate.ratePerGram}/gram (₹${liveRate.ratePerKg}/kg) from ${liveRate.source}`);
      }
      
      // Get rates from MongoDB (need full documents for manualAdjustment)
      const allRates = await SilverRate.find({ location: 'Andhra Pradesh' }).sort({ type: 1, 'weight.value': 1 });
      
      // If we have a live rate, update all rates
      if (liveRate && liveRate.ratePerGram && liveRate.ratePerGram > 0) {
        const baseRatePerGram = liveRate.ratePerGram;
        let updatedCount = 0;
        
        // Batch update operations for better performance
        const updatePromises = [];
        
        for (const rate of allRates) {
          if (!rate.weight || !rate.weight.value) continue;
          
          // Calculate rate per gram based on purity
          let ratePerGram = baseRatePerGram;
          if (rate.purity === '92.5%') {
            ratePerGram = baseRatePerGram * 0.96;
          } else if (rate.purity === '99.99%') {
            ratePerGram = baseRatePerGram * 1.005;
          }
          
          // Apply manual adjustment if exists (can be negative for decrease)
          const manualAdjustment = (rate.manualAdjustment !== undefined && rate.manualAdjustment !== null) ? rate.manualAdjustment : 0;
          ratePerGram = ratePerGram + manualAdjustment;
          ratePerGram = Math.max(0, Math.round(ratePerGram * 100) / 100); // Ensure non-negative
          
          // Always update to ensure live rates (update in memory immediately for response)
          // Calculate total rate based on weight
          let weightInGrams = rate.weight.value;
          if (rate.weight.unit === 'kg') {
            weightInGrams = rate.weight.value * 1000;
          } else if (rate.weight.unit === 'oz') {
            weightInGrams = rate.weight.value * 28.35;
          }
          
          const totalRate = Math.round(ratePerGram * weightInGrams * 100) / 100;
          
          // Update in memory immediately for response (don't wait for DB)
          rate.ratePerGram = ratePerGram;
          rate.rate = totalRate;
          rate.lastUpdated = new Date();
          
          // Also update in database (async, don't block response)
          updatePromises.push(
            SilverRate.findByIdAndUpdate(rate._id, {
              ratePerGram: ratePerGram,
              rate: totalRate,
              lastUpdated: new Date()
            })
          );
          
          updatedCount++;
        }
        
        // Execute all updates in parallel (don't await - return immediately with updated in-memory rates)
        if (updatePromises.length > 0) {
          Promise.all(updatePromises).then(() => {
            console.log(`✅ Updated ${updatedCount} rates in database with live data`);
          }).catch(err => {
            console.error('❌ Error updating rates in database:', err.message);
          });
        }
        
        ratesUpdated = updatedCount > 0;
      } else {
        console.warn('⚠️ No live rate available, using existing rates from database');
      }
      
      // Convert rates to plain objects for response
      const ratesToReturn = allRates.map(rate => {
        const rateObj = rate.toObject ? rate.toObject() : rate;
        // Ensure manualAdjustment is included
        if (rate.manualAdjustment !== undefined) {
          rateObj.manualAdjustment = rate.manualAdjustment;
        }
        return rateObj;
      });
      
      // Add USD rate if available
      if (liveRate && liveRate.usdInrRate) {
        ratesToReturn.forEach(rate => {
          rate.usdInrRate = liveRate.usdInrRate;
        });
      }
      
      // Add metadata about live rate fetch
      if (liveRate) {
        console.log(`📤 Returning ${ratesToReturn.length} rates (live rate: ₹${liveRate.ratePerGram}/gram from ${liveRate.source})`);
      } else {
        console.log(`📤 Returning ${ratesToReturn.length} rates from cache (live fetch failed)`);
      }
      
      return res.json(ratesToReturn);
    } catch (rateFetchError) {
      console.error('❌ Error fetching live rates:', rateFetchError.message);
      console.error('  Stack:', rateFetchError.stack);
      
      // Return cached rates if available (fallback for network issues)
      try {
        const cachedRates = await SilverRate.find({ location: 'Andhra Pradesh' }).sort({ type: 1, 'weight.value': 1 }).lean();
        if (cachedRates && cachedRates.length > 0) {
          console.warn('⚠️ Using cached rates due to live fetch error');
          return res.json(cachedRates);
        }
      } catch (cacheError) {
        console.error('❌ Error fetching cached rates:', cacheError.message);
      }
      
      // If no cached rates, return error
      return res.status(503).json({ 
        message: 'Live rate service error', 
        error: rateFetchError.message || 'Unable to fetch live rates. Please try again.',
        retryAfter: 2
      });
    }
  } catch (error) {
    console.error('Get rates error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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

