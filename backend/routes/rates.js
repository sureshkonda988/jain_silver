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
    
    // Fetch live rates from jainsilverpp1.vercel.app/prices/stream
    let liveRate = null;
    try {
      const { fetchSilverRatesFromMultipleSources } = require('../utils/multiSourceRateFetcher');
      liveRate = await fetchSilverRatesFromMultipleSources();
      
      if (liveRate && liveRate.ratePerGram && liveRate.ratePerGram > 0) {
        console.log(`✅ Fetched live rate: ₹${liveRate.ratePerGram}/gram from ${liveRate.source}`);
        
        // Update all rates in MongoDB with live data
        const rates = await SilverRate.find({ location: 'Andhra Pradesh' });
        const baseRatePerGram = liveRate.ratePerGram;
        
        for (const rate of rates) {
          if (!rate.weight || !rate.weight.value) continue;
          
          // Calculate rate per gram based on purity
          let ratePerGram = baseRatePerGram;
          if (rate.purity === '92.5%') {
            ratePerGram = baseRatePerGram * 0.96;
          } else if (rate.purity === '99.99%') {
            ratePerGram = baseRatePerGram * 1.005;
          }
          
          rate.ratePerGram = Math.round(ratePerGram * 100) / 100;
          
          // Calculate total rate based on weight
          let weightInGrams = rate.weight.value;
          if (rate.weight.unit === 'kg') {
            weightInGrams = rate.weight.value * 1000;
          } else if (rate.weight.unit === 'oz') {
            weightInGrams = rate.weight.value * 28.35;
          }
          
          rate.rate = Math.round(rate.ratePerGram * weightInGrams * 100) / 100;
          rate.lastUpdated = new Date();
          await rate.save();
        }
      } else {
        console.warn('⚠️ Failed to fetch live rate, using cached rates');
      }
    } catch (rateFetchError) {
      console.error('⚠️ Error fetching live rates:', rateFetchError.message);
      // Continue with cached rates from MongoDB
    }
    
    // Return updated rates from MongoDB
    const rates = await SilverRate.find({ location: 'Andhra Pradesh' }).sort({ type: 1, 'weight.value': 1 });
    
    // Add USD rate if available
    if (liveRate && liveRate.usdInrRate) {
      rates.forEach(rate => {
        rate._doc = rate._doc || rate.toObject();
        rate._doc.usdInrRate = liveRate.usdInrRate;
      });
    }
    
    res.json(rates);
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

