const express = require('express');
const router = express.Router();
const {
  processShelfWeight,
  getShelfStatus,
  reportShelfMismatch,
  resolveShelfMismatch,
  scanShelfImage,
} = require('../controllers/shelfController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/weight', processShelfWeight);
router.get('/', protect, getShelfStatus);
router.post('/mismatch', reportShelfMismatch);
router.post('/mismatch/resolve', resolveShelfMismatch);
router.post('/scan', upload.single('image'), scanShelfImage);

module.exports = router;


