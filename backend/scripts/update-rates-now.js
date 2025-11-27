const mongoose = require('mongoose');
require('dotenv').config();

const SilverRate = require('../models/SilverRate');
const { fetchSilverRatesFromRBGoldspot } = require('../utils/rbgoldspotRateFetcher');

async function updateRatesNow() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jain_silver', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Fetch live rate
    console.log('📡 Fetching live rate from RB Goldspot...');
    const liveRate = await fetchSilverRatesFromRBGoldspot();
    console.log(`✅ Fetched rate: ₹${liveRate.ratePerGram}/gram (₹${liveRate.ratePerKg}/kg)`);

    // Get all rates
    const rates = await SilverRate.find({ location: 'Andhra Pradesh' });
    console.log(`📊 Found ${rates.length} rates to update`);

    if (rates.length === 0) {
      console.log('⚠️ No rates found. Please initialize rates first.');
      process.exit(1);
    }

    const baseRatePerGram = liveRate.ratePerGram;

    // Update all rates
    let updated = 0;
    for (const rate of rates) {
      if (!rate.weight || !rate.weight.value) {
        console.warn(`Skipping ${rate.name} - missing weight`);
        continue;
      }

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
      updated++;
      console.log(`✅ Updated ${rate.name}: ₹${rate.ratePerGram}/gram (Total: ₹${rate.rate})`);
    }

    console.log(`\n🎉 Successfully updated ${updated} rates!`);
    console.log(`Base rate: ₹${baseRatePerGram}/gram`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateRatesNow();

