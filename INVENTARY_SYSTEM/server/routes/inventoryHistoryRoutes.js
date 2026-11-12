const express = require('express');
const router = express.Router();
const { getInventoryHistory, exportInventoryHistory } = require('../controllers/inventoryHistoryController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getInventoryHistory);
router.get('/export', protect, exportInventoryHistory);

module.exports = router;
