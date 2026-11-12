const mongoose = require('mongoose');
const Product = require('../models/Product');
const InventoryHistory = require('../models/InventoryHistory');
const { getIO } = require('../config/socket');

// @desc    Get all products (with search & filters & pagination)
// @route   GET /api/products
// @access  Private
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, supplier, shelf, status, page = 1, limit = 10 } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = category;
    if (supplier) query.supplier = supplier;
    if (shelf) query.shelfNumber = shelf;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('supplier', 'name company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single product by ID or Barcode
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res, next) => {
  try {
    let product = null;

    // Check by MongoDB ObjectId if valid format
    if (mongoose.isValidObjectId(req.params.id)) {
      product = await Product.findById(req.params.id)
        .populate('category', 'name')
        .populate('supplier', 'name company');
    }

    // Otherwise or if not found by ID, look up by exact barcode or case-insensitive match
    if (!product) {
      product = await Product.findOne({ barcode: req.params.id })
        .populate('category', 'name')
        .populate('supplier', 'name company');
    }

    // If still not found, check if barcode or name matches
    if (!product) {
      product = await Product.findOne({
        $or: [
          { barcode: { $regex: `^${req.params.id}$`, $options: 'i' } },
          { name: { $regex: `^${req.params.id}$`, $options: 'i' } },
        ],
      })
        .populate('category', 'name')
        .populate('supplier', 'name company');
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin, Store Manager)
exports.createProduct = async (req, res, next) => {
  try {
    if (req.file) {
      req.body.image = `/uploads/${req.file.filename}`;
    }

    const product = await Product.create(req.body);

    // Create history entry
    await InventoryHistory.create({
      product: product._id,
      shelf: product.shelfNumber,
      previousWeight: 0,
      currentWeight: product.stock * product.unitWeight,
      previousStock: 0,
      currentStock: product.stock,
      action: 'Restock',
      reason: 'Initial Product Creation',
      user: req.user ? req.user.id : null,
    });

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin, Store Manager)
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const prevStock = product.stock;
    const prevWeight = product.stock * product.unitWeight;

    if (req.file) {
      req.body.image = `/uploads/${req.file.filename}`;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (req.body.stock !== undefined && req.body.stock !== prevStock) {
      await InventoryHistory.create({
        product: product._id,
        shelf: product.shelfNumber,
        previousWeight: prevWeight,
        currentWeight: product.stock * product.unitWeight,
        previousStock: prevStock,
        currentStock: product.stock,
        action: 'Manual Adjustment',
        reason: 'Product Details Updated',
        user: req.user ? req.user.id : null,
      });
    }

    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await product.deleteOne();
    res.status(200).json({ success: true, message: 'Product removed' });
  } catch (err) {
    next(err);
  }
};

// @desc    Calibrate Product Unit Weight
// @route   POST /api/products/:id/calibrate
// @access  Private (Admin)
exports.calibrateProductWeight = async (req, res, next) => {
  try {
    const { measuredWeight, tolerance } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.unitWeight = measuredWeight;
    product.calibration = {
      unitWeight: measuredWeight,
      tolerance: tolerance || 10,
      calibratedOn: new Date(),
      calibratedBy: req.user.id,
      status: 'Success',
    };

    await product.save();

    await InventoryHistory.create({
      product: product._id,
      shelf: product.shelfNumber,
      previousWeight: product.stock * product.unitWeight,
      currentWeight: product.stock * measuredWeight,
      previousStock: product.stock,
      currentStock: product.stock,
      action: 'Calibration',
      reason: `Calibrated Unit Weight to ${measuredWeight}g (±${tolerance || 10}g)`,
      user: req.user.id,
    });

    try {
      getIO().emit('calibration:update', {
        productId: product._id,
        unitWeight: measuredWeight,
        calibration: product.calibration,
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Product unit weight successfully calibrated!',
      data: product,
    });
  } catch (err) {
    next(err);
  }
};
