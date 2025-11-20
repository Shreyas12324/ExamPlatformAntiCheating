const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { identifier } = require('../middlewares/identification');

// Test management
router.post('/create', identifier, examController.createTest); // Admin only
router.post('/agent-test', identifier, examController.generateAgentTest); // User-facing
router.get('/all', identifier, examController.getAllTests);
router.get('/:testId', identifier, examController.getTestById);
router.get('/:testId/questions', identifier, examController.getTestQuestions);
router.post('/add-questions', identifier, examController.addQuestions); // Admin only

// Test attempt
router.post('/start', identifier, examController.startTest);
router.post('/save-answer', identifier, examController.saveAnswer);
router.post('/submit', identifier, examController.submitTest);
router.get('/progress/:progressId', identifier, examController.getUserProgress);
router.post('/update-time', identifier, examController.updateTimeRemaining);

module.exports = router;
