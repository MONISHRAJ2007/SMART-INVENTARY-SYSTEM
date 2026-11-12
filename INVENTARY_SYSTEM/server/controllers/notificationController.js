const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');

// @desc    Get all notifications with filtering, priority counts & search
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const { priority, status, search, page = 1, limit = 20 } = req.query;

    let query = {};

    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const total = await Notification.countDocuments(query);

    const notifications = await Notification.find(query)
      .populate('product', 'name image barcode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate priority unread counts for top navbar Gmail-style bell badge
    const unreadCounts = {
      total: await Notification.countDocuments({ status: 'unread' }),
      critical: await Notification.countDocuments({ status: 'unread', priority: 'critical' }),
      high: await Notification.countDocuments({ status: 'unread', priority: 'high' }),
      medium: await Notification.countDocuments({ status: 'unread', priority: 'medium' }),
      low: await Notification.countDocuments({ status: 'unread', priority: 'low' }),
    };

    res.status(200).json({
      success: true,
      unreadCounts,
      count: notifications.length,
      total,
      pages: Math.ceil(total / limit),
      data: notifications,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { status: 'read', readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    try {
      getIO().emit('notification:read', { id: req.params.id });
    } catch (e) {}

    res.status(200).json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { status: 'unread' },
      { status: 'read', readAt: new Date() }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    await notification.deleteOne();
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
};
