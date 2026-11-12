const express = require('express');
const router = express.Router();
const { createInvoice, getInvoices, getInvoice } = require('../controllers/billingController');
const { protect } = require('../middleware/auth');

router.route('/').post(protect, createInvoice).get(protect, getInvoices);
router.route('/:id').get(protect, getInvoice);

module.exports = router;
