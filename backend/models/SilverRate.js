const mongoose = require('mongoose');

const silverRateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['coin', 'bar', 'jewelry']
  },
  weight: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true,
      enum: ['grams', 'kg', 'oz']
    }
  },
  purity: {
    type: String,
    required: true,
    enum: ['92.5%', '99.9%', '99.99%']
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  ratePerGram: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    type: String,
    default: 'Andhra Pradesh',
    required: true
  },
  unit: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD']
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
silverRateSchema.index({ name: 1, purity: 1 });
silverRateSchema.index({ location: 1, type: 1 });

module.exports = mongoose.model('SilverRate', silverRateSchema);

