const Billing = require('../models/Billing');
const Product = require('../models/Product');
const InventoryHistory = require('../models/InventoryHistory');
const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');

// @desc    Create new invoice / bill
// @route   POST /api/billing
// @access  Private
exports.createInvoice = async (req, res, next) => {
  try {
    const {
      items,
      subtotal,
      totalGst,
      discountPercentage,
      discountAmount,
      grandTotal,
      paymentMethod,
      customerName,
      customerPhone,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart cannot be empty' });
    }

    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

    const billing = await Billing.create({
      invoiceNumber,
      items,
      subtotal,
      totalGst,
      discountPercentage,
      discountAmount,
      grandTotal,
      paymentMethod: paymentMethod || 'UPI / QR',
      customerName: customerName || 'Walk-in Customer',
      customerPhone,
      createdBy: req.user ? req.user.id : null,
    });

    // Update Product stocks & log InventoryHistory
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (product) {
        const prevStock = product.stock;
        const prevWeight = product.stock * product.unitWeight;

        product.stock = Math.max(0, product.stock - item.quantity);
        await product.save();

        const currentWeight = product.stock * product.unitWeight;

        // Log audit trail
        await InventoryHistory.create({
          product: product._id,
          shelf: product.shelfNumber,
          previousWeight: prevWeight,
          currentWeight: currentWeight,
          previousStock: prevStock,
          currentStock: product.stock,
          action: 'Billing',
          reason: `Invoice ${invoiceNumber} (-${item.quantity} units)`,
          user: req.user ? req.user.id : null,
          remarks: `Sold via Barcode Billing`,
        });

        // Trigger low stock or out of stock alert if threshold crossed
        if (product.stock <= product.minStock) {
          const priority = product.stock === 0 ? 'high' : 'medium';
          const title = product.stock === 0 ? 'Out of Stock Alert' : 'Low Stock Warning';
          const message = `Product '${product.name}' is now at ${product.stock} units (Min: ${product.minStock}).`;

          const notif = await Notification.create({
            type: product.stock === 0 ? 'out_of_stock' : 'low_stock',
            title,
            message,
            priority,
            product: product._id,
            shelf: product.shelfNumber,
          });

          try {
            getIO().emit('notification:new', notif);
          } catch (e) {}
        }
      }
    }

    // Real-time broadcasts
    try {
      const io = getIO();
      io.emit('billing:new', billing);
      io.emit('dashboard:update');
      io.emit('inventory:history');
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: billing,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all invoices / bills
// @route   GET /api/billing
// @access  Private
exports.getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const total = await Billing.countDocuments();
    const invoices = await Billing.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      pages: Math.ceil(total / limit),
      data: invoices,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single invoice
// @route   GET /api/billing/:id
// @access  Private
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Billing.findById(req.params.id).populate('createdBy', 'name');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};
