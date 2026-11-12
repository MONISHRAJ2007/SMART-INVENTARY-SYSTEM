const Procurement = require('../models/Procurement');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

// @desc    Get all procurement recommendations
// @route   GET /api/procurement
// @access  Private
exports.getProcurements = async (req, res, next) => {
  try {
    let procurements = await Procurement.find()
      .populate('product')
      .populate('supplier')
      .sort({ createdAt: -1 });

    // Auto-generate recommendations if none exist or stock is low
    const lowStockProducts = await Product.find({ stock: { $lte: 10 } }).populate('supplier');

    for (const p of lowStockProducts) {
      const exists = await Procurement.findOne({
        product: p._id,
        status: { $in: ['Pending', 'Ordered'] },
      });

      if (!exists && p.supplier) {
        const reorderQty = Math.max(20, (p.minStock || 5) * 3);
        const estimatedCost = reorderQty * p.costPrice;
        const reorderDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now

        await Procurement.create({
          product: p._id,
          supplier: p.supplier._id,
          recommendedQuantity: reorderQty,
          reorderDate,
          estimatedCost,
          expectedStockDurationDays: 30,
          priority: p.stock === 0 ? 'High' : 'Medium',
          status: 'Pending',
        });
      }
    }

    procurements = await Procurement.find()
      .populate('product')
      .populate('supplier')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: procurements.length, data: procurements });
  } catch (err) {
    next(err);
  }
};

// @desc    Update procurement status (Approve/Order/Complete)
// @route   PUT /api/procurement/:id
// @access  Private (Admin, Store Manager)
exports.updateProcurementStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const procurement = await Procurement.findById(req.params.id);

    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Procurement record not found' });
    }

    procurement.status = status;
    await procurement.save();

    // If completed, add stock to product
    if (status === 'Completed') {
      const product = await Product.findById(procurement.product);
      if (product) {
        product.stock += procurement.recommendedQuantity;
        await product.save();
      }
    }

    res.status(200).json({ success: true, data: procurement });
  } catch (err) {
    next(err);
  }
};
