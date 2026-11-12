const Report = require('../models/Report');
const Billing = require('../models/Billing');
const Product = require('../models/Product');
const InventoryHistory = require('../models/InventoryHistory');
const { generateExcelReport } = require('../utils/excelGenerator');
const path = require('path');
const fs = require('fs');

// @desc    Generate Excel Report
// @route   POST /api/reports/generate
// @access  Private
exports.createReport = async (req, res, next) => {
  try {
    const { type = 'Daily' } = req.body;

    const billings = await Billing.find().sort({ createdAt: -1 });
    const products = await Product.find().populate('category supplier');
    const history = await InventoryHistory.find().populate('product user').sort({ createdAt: -1 });

    const totalSales = billings.length;
    const totalRevenue = billings.reduce((acc, curr) => acc + curr.grandTotal, 0);

    const reportResult = await generateExcelReport(type, {
      billings,
      products,
      history,
    });

    const reportDoc = await Report.create({
      type,
      title: `${type} Sales & Inventory Report`,
      filename: reportResult.filename,
      filePath: reportResult.filePath,
      generatedBy: req.user ? req.user.id : null,
      statsSummary: {
        totalSales,
        totalRevenue,
        totalOrders: totalSales,
        lowStockCount: products.filter((p) => p.stock <= p.minStock).length,
      },
    });

    res.status(201).json({
      success: true,
      message: `${type} Excel Report generated successfully`,
      data: reportDoc,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all generated reports
// @route   GET /api/reports
// @access  Private
exports.getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('generatedBy', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (err) {
    next(err);
  }
};

// @desc    Download Excel report file
// @route   GET /api/reports/download/:filename
// @access  Private
exports.downloadReport = async (req, res, next) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/reports', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Report file not found' });
    }

    res.download(filePath, filename);
  } catch (err) {
    next(err);
  }
};
