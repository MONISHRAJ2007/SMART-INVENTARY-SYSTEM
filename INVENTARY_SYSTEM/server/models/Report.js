const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    filename: String,
    filePath: String,
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    statsSummary: {
      totalSales: Number,
      totalRevenue: Number,
      totalOrders: Number,
      lowStockCount: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
