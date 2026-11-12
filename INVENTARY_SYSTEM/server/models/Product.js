const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
    },
    barcode: {
      type: String,
      required: [true, 'Please add a barcode'],
      unique: true,
      trim: true,
    },
    image: {
      type: String,
      default: 'default-product.png',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    unitWeight: {
      type: Number,
      required: [true, 'Please add unit weight in grams'],
      min: [1, 'Unit weight must be at least 1 gram'],
    },
    calibration: {
      unitWeight: { type: Number, default: 0 },
      tolerance: { type: Number, default: 10 }, // in grams, e.g. ±10g
      calibratedOn: { type: Date, default: Date.now },
      calibratedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: {
        type: String,
        enum: ['Success', 'Failed', 'Pending'],
        default: 'Pending',
      },
    },
    shelfNumber: {
      type: String,
      enum: ['Shelf A', 'Shelf B', 'Unassigned'],
      default: 'Unassigned',
    },
    costPrice: {
      type: Number,
      required: [true, 'Please add cost price'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Please add selling price'],
    },
    gst: {
      type: Number,
      default: 18, // GST percentage
    },
    stock: {
      type: Number,
      default: 0,
    },
    minStock: {
      type: Number,
      default: 5,
    },
    expiryDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock'],
      default: 'In Stock',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-update stock status based on stock and minStock
productSchema.pre('save', function (next) {
  if (this.stock <= 0) {
    this.status = 'Out of Stock';
  } else if (this.stock <= this.minStock) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
