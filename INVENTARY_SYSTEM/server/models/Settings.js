const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    minimumStockThreshold: {
      type: Number,
      default: 5,
    },
    weightToleranceGrams: {
      type: Number,
      default: 50,
    },
    currency: {
      type: String,
      default: 'INR (₹)',
    },
    defaultGstPercentage: {
      type: Number,
      default: 18,
    },
    companyName: {
      type: String,
      default: 'Smart MSME Mart',
    },
    companyAddress: {
      type: String,
      default: '123 SaaS Tower, Tech Park, India',
    },
    companyPhone: {
      type: String,
      default: '+91 98765 43210',
    },
    companyEmail: {
      type: String,
      default: 'support@smartmsme.com',
    },
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' },
    themeMode: { type: String, enum: ['light', 'dark'], default: 'light' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
