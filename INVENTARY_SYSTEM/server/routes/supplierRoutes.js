const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(protect, getSuppliers).post(protect, authorize('Admin', 'Store Manager'), createSupplier);
router.route('/:id').put(protect, authorize('Admin', 'Store Manager'), updateSupplier).delete(protect, authorize('Admin'), deleteSupplier);

module.exports = router;
