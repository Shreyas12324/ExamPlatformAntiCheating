const express = require('express');
const router = express.Router();
const multer = require('multer');
const cheatingController = require('../controllers/cheatingController');
const { identifier } = require('../middlewares/identification');

// Configure multer for memory storage
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Log cheating events
router.post('/log', identifier, cheatingController.logCheatingEvent);

// Process webcam image
router.post('/check-webcam', identifier, upload.single('image'), cheatingController.checkWebcamImage);

// Get logs
router.get('/logs/:progressId', identifier, cheatingController.getCheatingLogs);

// Admin routes
router.get('/admin/logs/:testId', identifier, cheatingController.getAllCheatingLogs);
router.get('/admin/stats/:testId', identifier, cheatingController.getCheatingStats);

module.exports = router;
