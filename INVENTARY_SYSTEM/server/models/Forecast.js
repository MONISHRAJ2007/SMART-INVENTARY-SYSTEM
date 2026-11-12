const mongoose = require('mongoose');

const forecastSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    period: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Seasonal'],
      default: 'Weekly',
    },
    predictedDemandUnits: {
      type: Number,
      required: true,
    },
    confidenceScore: {
      type: Number, // percentage, e.g. 94.5
      default: 90,
    },
    seasonalFactor: {
      type: String,
      default: 'Normal Demand',
    },
    reorderRecommendation: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Forecast', forecastSchema);
