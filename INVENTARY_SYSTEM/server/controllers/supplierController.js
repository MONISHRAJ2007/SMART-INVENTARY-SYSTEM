const Supplier = require('../models/Supplier');

exports.getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find().sort({ company: 1 });
    res.status(200).json({ success: true, count: suppliers.length, data: suppliers });
  } catch (err) {
    next(err);
  }
};

exports.createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    await supplier.deleteOne();
    res.status(200).json({ success: true, message: 'Supplier deleted' });
  } catch (err) {
    next(err);
  }
};
