const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  calibrateProductWeight,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router
  .route('/')
  .get(protect, getProducts)
  .post(protect, authorize('Admin', 'Store Manager'), upload.single('image'), createProduct);

router
  .route('/:id')
  .get(protect, getProduct)
  .put(protect, authorize('Admin', 'Store Manager'), upload.single('image'), updateProduct)
  .delete(protect, authorize('Admin'), deleteProduct);

router.post('/:id/calibrate', protect, authorize('Admin', 'Store Manager'), calibrateProductWeight);

module.exports = router;
