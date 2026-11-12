const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    shelf: {
      type: String,
      enum: ['Shelf A', 'Shelf B'],
      required: true,
      unique: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    shelfCapacityGrams: {
      type: Number,
      default: 10000, // 10 kg capacity
    },
    actualShelfWeight: {
      type: Number,
      default: 0, // in grams
    },
    expectedShelfWeight: {
      type: Number,
      default: 0, // DB stock * unit weight
    },
    actualStock: {
      type: Number,
      default: 0, // Math.floor(actualShelfWeight / unitWeight)
    },
    expectedStock: {
      type: Number,
      default: 0, // from Product DB
    },
    weightDifference: {
      type: Number,
      default: 0, // Math.abs(expectedShelfWeight - actualShelfWeight)
    },
    toleranceGrams: {
      type: Number,
      default: 50, // default tolerance threshold
    },
    discrepancyStatus: {
      type: String,
      enum: ['Verified', 'Discrepancy'],
      default: 'Verified',
    },
    filledPercentage: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['OK', 'Low Stock', 'Empty', 'Offline', 'Mismatch'],
      default: 'OK',
    },
    hasMismatch: {
      type: Boolean,
      default: false,
    },
    mismatches: [
      {
        slot: { type: String },
        detectedItem: { type: String },
        expectedItem: { type: String },
        rightfulShelf: { type: String },
        confidence: { type: Number, default: 0.95 },
        action: { type: String },
        detectedAt: { type: Date, default: Date.now },
      },
    ],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    deviceId: {
      type: String,
      default: 'ESP32_01',
    },
    batteryLevel: {
      type: Number,
      default: 100,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inventory', inventorySchema);
