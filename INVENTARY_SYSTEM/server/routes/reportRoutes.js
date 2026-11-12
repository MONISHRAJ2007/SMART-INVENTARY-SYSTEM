const express = require('express');
const router = express.Router();
const { createReport, getReports, downloadReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.post('/generate', protect, createReport);
router.get('/', protect, getReports);
router.get('/download/:filename', protect, downloadReport);

module.exports = router;
