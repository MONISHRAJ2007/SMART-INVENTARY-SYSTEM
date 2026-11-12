const mongoose = require('mongoose');

const inventoryHistorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    shelf: {
      type: String,
      enum: ['Shelf A', 'Shelf B', 'Unassigned'],
      default: 'Unassigned',
    },
    previousWeight: {
      type: Number,
      default: 0,
    },
    currentWeight: {
      type: Number,
      default: 0,
    },
    previousStock: {
      type: Number,
      default: 0,
    },
    currentStock: {
      type: Number,
      default: 0,
    },
    action: {
      type: String,
      enum: [
        'Billing',
        'Restock',
        'Calibration',
        'Manual Adjustment',
        'Inventory Verification',
        'ESP32 Update',
        'Product Mismatch Alert',
        'Mismatch Resolved',
      ],
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryHistory', inventoryHistorySchema);
