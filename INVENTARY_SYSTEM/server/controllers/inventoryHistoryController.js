const InventoryHistory = require('../models/InventoryHistory');
const { generateExcelReport } = require('../utils/excelGenerator');

// @desc    Get paginated Inventory History audit log with search & filters
// @route   GET /api/inventory-history
// @access  Private
exports.getInventoryHistory = async (req, res, next) => {
  try {
    const {
      product,
      shelf,
      action,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    let query = {};

    if (product) query.product = product;
    if (shelf) query.shelf = shelf;
    if (action) query.action = action;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const total = await InventoryHistory.countDocuments(query);

    const history = await InventoryHistory.find(query)
      .populate('product', 'name barcode unitWeight')
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: history.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: history,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export Inventory History audit trail to Excel
// @route   GET /api/inventory-history/export
// @access  Private
exports.exportInventoryHistory = async (req, res, next) => {
  try {
    const { product, shelf, action } = req.query;
    let query = {};
    if (product) query.product = product;
    if (shelf) query.shelf = shelf;
    if (action) query.action = action;

    const history = await InventoryHistory.find(query)
      .populate('product', 'name barcode')
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    const result = await generateExcelReport('Inventory_History', { history });

    res.status(200).json({
      success: true,
      downloadUrl: result.filePath,
      filename: result.filename,
    });
  } catch (err) {
    next(err);
  }
};
