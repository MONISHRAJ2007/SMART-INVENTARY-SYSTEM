const mongoose = require('mongoose');

const procurementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    recommendedQuantity: {
      type: Number,
      required: true,
    },
    reorderDate: {
      type: Date,
      required: true,
    },
    estimatedCost: {
      type: Number,
      required: true,
    },
    expectedStockDurationDays: {
      type: Number,
      default: 30,
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'Ordered', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Procurement', procurementSchema);
