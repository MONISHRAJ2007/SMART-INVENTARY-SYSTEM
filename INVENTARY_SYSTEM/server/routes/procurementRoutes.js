const express = require('express');
const router = express.Router();
const { getProcurements, updateProcurementStatus } = require('../controllers/procurementController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getProcurements);
router.put('/:id', protect, authorize('Admin', 'Store Manager'), updateProcurementStatus);

module.exports = router;
