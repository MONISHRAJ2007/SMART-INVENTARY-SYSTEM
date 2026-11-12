const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add contact person name'],
    },
    company: {
      type: String,
      required: [true, 'Please add company name'],
    },
    email: {
      type: String,
      required: [true, 'Please add email'],
    },
    phone: {
      type: String,
      required: [true, 'Please add phone number'],
    },
    address: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);
