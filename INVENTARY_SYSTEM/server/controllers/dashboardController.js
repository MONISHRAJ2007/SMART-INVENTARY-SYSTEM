const Billing = require('../models/Billing');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const Inventory = require('../models/Inventory');

// @desc    Get complete SaaS Dashboard metrics & charts data
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardMetrics = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Today's Billing
    const todayBills = await Billing.find({ createdAt: { $gte: todayStart } });
    const todaySales = todayBills.length;
    const todayRevenue = todayBills.reduce((acc, curr) => acc + curr.grandTotal, 0);

    // 2. Inventory Stats
    const products = await Product.find().populate('category', 'name');
    const totalProducts = products.length;
    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;
    const currentInventoryValue = products.reduce(
      (acc, curr) => acc + curr.stock * curr.sellingPrice,
      0
    );

    // 3. Recent Billing (Last 5)
    const recentBilling = await Billing.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // 4. Recent Alerts (Last 5)
    const recentAlerts = await Notification.find({ status: 'unread' })
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. 7-Day Sales & Revenue Trend
    const salesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));

      const bills = await Billing.find({ createdAt: { $gte: start, $lte: end } });
      const rev = bills.reduce((acc, curr) => acc + curr.grandTotal, 0);

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      salesTrend.push({
        day: dayNames[start.getDay()],
        date: start.toISOString().split('T')[0],
        sales: bills.length,
        revenue: rev,
      });
    }

    // 6. Stock Distribution by Category (Pie Chart Data)
    const categoryMap = {};
    products.forEach((p) => {
      const catName = p.category ? p.category.name : 'Uncategorized';
      categoryMap[catName] = (categoryMap[catName] || 0) + p.stock;
    });
    const stockDistribution = Object.keys(categoryMap).map((key) => ({
      name: key,
      value: categoryMap[key],
    }));

    // 7. Top Selling Products
    const topProducts = products
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 5)
      .map((p) => ({
        name: p.name,
        stock: p.stock,
        value: p.stock * p.sellingPrice,
      }));

    // 8. Real-time Shelf Status
    const shelfStatus = await Inventory.find().populate('product', 'name unitWeight stock');
    const { getEsp32OnlineStatus } = require('./shelfController');

    res.status(200).json({
      success: true,
      esp32Online: getEsp32OnlineStatus(),
      metrics: {
        todaySales,
        todayRevenue,
        currentInventoryValue,
        totalProducts,
        lowStockCount,
        outOfStockCount,
      },
      charts: {
        salesTrend,
        stockDistribution,
        topProducts,
      },
      recentBilling,
      recentAlerts,
      shelfStatus,
    });
  } catch (err) {
    next(err);
  }
};
