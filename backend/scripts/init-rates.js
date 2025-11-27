const mongoose = require('mongoose');
const SilverRate = require('../models/SilverRate');
require('dotenv').config();

// Andhra Pradesh Silver Rates (per gram)
const RATE_PER_GRAM_999 = 75.50; // 99.9% purity
const RATE_PER_GRAM_9999 = 76.00; // 99.99% purity
const RATE_PER_GRAM_925 = 69.50; // 92.5% purity

const defaultRates = [
  // Silver Coins (99.9% purity)
  { 
    name: 'Silver Coin 1 Gram', 
    type: 'coin', 
    weight: { value: 1, unit: 'grams' }, 
    purity: '99.9%', 
    rate: RATE_PER_GRAM_999 * 1,
    ratePerGram: RATE_PER_GRAM_999,
    location: 'Andhra Pradesh'
  },
  { 
    name: 'Silver Coin 5 Grams', 
    type: 'coin', 
    weight: { value: 5, unit: 'grams' }, 
    purity: '99.9%', 
    rate: RATE_PER_GRAM_999 * 5,
    ratePerGram: RATE_PER_GRAM_999,
    location: 'Andhra Pradesh'
  },
  { 
    name: 'Silver Coin 10 Grams', 
    type: 'coin', 
    weight: { value: 10, unit: 'grams' }, 
    purity: '99.9%', 
    rate: RATE_PER_GRAM_999 * 10,
    ratePerGram: RATE_PER_GRAM_999,
    location: 'Andhra Pradesh'
  },
  { 
    name: 'Silver Coin 50 Grams', 
    type: 'coin', 
    weight: { value: 50, unit: 'grams' }, 
    purity: '99.9%', 
    rate: RATE_PER_GRAM_999 * 50,
    ratePerGram: RATE_PER_GRAM_999,
    location: 'Andhra Pradesh'
  },
  { 
    name: 'Silver Coin 100 Grams', 
    type: 'coin', 
    weight: { value: 100, unit: 'grams' }, 
    purity: '99.9%', 
    rate: RATE_PER_GRAM_999 * 100,
    ratePerGram: RATE_PER_GRAM_999,
    location: 'Andhra Pradesh'
  },
  
  // Silver Bars (99.99% purity)
  { 
    name: 'Silver Bar 100 Grams', 
    type: 'bar', 
    weight: { value: 100, unit: 'grams' }, 
    purity: '99.99%', 
    rate: RATE_PER_GRAM_9999 * 100,
    ratePerGram: RATE_PER_GRAM_9999,
    location: 'Andhra Pradesh'
  },
  { 
    name: 'Silver Bar 500 Grams', 
    type: 'bar', 
    weight: { value: 500, unit: 'grams' }, 
    purity: '99.99%', 
    rate: RATE_PER_GRAM_9999 * 500,
    ratePerGram: RATE_PER_GRAM_9999,
    location: 'Andhra Pradesh'
  },
  { 
    name: 'Silver Bar 1 Kg', 
    type: 'bar', 
    weight: { value: 1, unit: 'kg' }, 
    purity: '99.99%', 
    rate: RATE_PER_GRAM_9999 * 1000,
    ratePerGram: RATE_PER_GRAM_9999,
    location: 'Andhra Pradesh'
  },
  
  // Silver Jewelry
  { 
    name: 'Silver Jewelry 92.5%', 
    type: 'jewelry', 
    weight: { value: 1, unit: 'grams' }, 
    purity: '92.5%', 
    rate: RATE_PER_GRAM_925,
    ratePerGram: RATE_PER_GRAM_925,
    location: 'Andhra Pradesh'
  },
  { 
    name: 'Silver Jewelry 99.9%', 
    type: 'jewelry', 
    weight: { value: 1, unit: 'grams' }, 
    purity: '99.9%', 
    rate: RATE_PER_GRAM_999,
    ratePerGram: RATE_PER_GRAM_999,
    location: 'Andhra Pradesh'
  }
];

async function initializeRates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jain_silver', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    for (const rateData of defaultRates) {
      const rate = await SilverRate.findOneAndUpdate(
        { name: rateData.name, 'weight.value': rateData.weight.value, purity: rateData.purity },
        rateData,
        { upsert: true, new: true }
      );
      console.log(`Initialized: ${rateData.name} (${rateData.weight.value} ${rateData.weight.unit}) - ${rateData.purity} - ₹${rateData.rate.toFixed(2)}`);
    }

    console.log('All rates initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing rates:', error);
    process.exit(1);
  }
}

initializeRates();

