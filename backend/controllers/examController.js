const Test = require('../models/testModel');
const Question = require('../models/questionModel');
const UserProgress = require('../models/userProgressModel');

// Create a new test (Admin only)
exports.createTest = async (req, res) => {
	try {
		const { title, description, duration, totalMarks, passingMarks, startTime, endTime, instructions, allowedAttempts } = req.body;

		const newTest = new Test({
			title,
			description,
			duration,
			totalMarks,
			passingMarks,
			startTime,
			endTime,
			instructions,
			allowedAttempts,
			createdBy: req.user.userId,
		});

		const savedTest = await newTest.save();
		res.status(201).json({
			success: true,
			message: 'Test created successfully',
			test: savedTest,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, message: 'Failed to create test', error: error.message });
	}
};

// Get all active tests
exports.getAllTests = async (req, res) => {
	try {
		const tests = await Test.find({ isActive: true }).select('-__v');
		res.status(200).json({
			success: true,
			tests,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, message: 'Failed to fetch tests', error: error.message });
	}
};

// Get test details by ID
exports.getTestById = async (req, res) => {
	try {
		const { testId } = req.params;
		const test = await Test.findById(testId);

		if (!test) {
			return res.status(404).json({ success: false, message: 'Test not found' });
		}

		res.status(200).json({
			success: true,
			test,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, message: 'Failed to fetch test', error: error.message });
	}
};

// Get questions for a test (without correct answers)
exports.getTestQuestions = async (req, res) => {
	try {
		const { testId } = req.params;

		// Check if test exists
		const test = await Test.findById(testId);
		if (!test) {
			return res.status(404).json({ success: false, message: 'Test not found' });
		}

		// Get questions without correct answers
		const questions = await Question.find({ testId }).select('-correctAnswer -__v').sort({ questionNumber: 1 });

		res.status(200).json({
			success: true,
			questions,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, message: 'Failed to fetch questions', error: error.message });
	}
};

// Add questions to a test (Admin only)
exports.addQuestions = async (req, res) => {
	try {
		const { testId, questions } = req.body;

		// Validate test exists
		const test = await Test.findById(testId);
		if (!test) {
			return res.status(404).json({ success: false, message: 'Test not found' });
		}

		// Create questions
		const questionDocs = questions.map((q, index) => ({
			testId,
			questionText: q.questionText,
			options: q.options,
			correctAnswer: q.correctAnswer,
			marks: q.marks || 1,
			questionNumber: q.questionNumber || index + 1,
		}));

		const savedQuestions = await Question.insertMany(questionDocs);

		res.status(201).json({
			success: true,
			message: 'Questions added successfully',
			questions: savedQuestions,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, message: 'Failed to add questions', error: error.message });
	}
};

// Start a test (creates UserProgress record)
exports.startTest = async (req, res) => {
	try {
		const { testId } = req.body;
		const userId = req.user.userId;

		// Check if test exists and is active
		const test = await Test.findById(testId);
		if (!test || !test.isActive) {
			return res.status(404).json({ success: false, message: 'Test not found or inactive' });
		}

		// Check if user has already attempted the test
		const existingAttempts = await UserProgress.countDocuments({ userId, testId });
		if (existingAttempts >= test.allowedAttempts) {
			return res.status(400).json({ success: false, message: 'Maximum attempts reached' });
		}

		// Check for in-progress attempts
		const inProgressAttempt = await UserProgress.findOne({ userId, testId, status: 'in-progress' });
		if (inProgressAttempt) {
			return res.status(200).json({
				success: true,
				message: 'Resuming existing attempt',
				progress: inProgressAttempt,
			});
		}

		// Create new progress record
		const newProgress = new UserProgress({
			userId,
			testId,
			attemptNumber: existingAttempts + 1,
			timeRemaining: test.duration * 60, // Convert to seconds
		});

		const savedProgress = await newProgress.save();

		res.status(201).json({
			success: true,
			message: 'Test started successfully',
			progress: savedProgress,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, message: 'Failed to start test', error: error.message });
	}
};

// Save answer for a question
exports.saveAnswer = async (req, res) => {
	try {
		const { progressId, questionId, selectedAnswer } = req.body;
		const userId = req.user.userId;

		// Find progress record
		const progress = await UserProgress.findOne({ _id: progressId, userId });
		if (!progress) {
			return res.status(404).json({ success: false, message: 'Progress not found' });
		}

		if (progress.status !== 'in-progress') {
			return res.status(400).json({ success: false, message: 'Test already submitted' });
		}

		// Update or add answer
		const answerIndex = progress.answers.findIndex(
			(a) => a.questionId.toString() === questionId
		);

		if (answerIndex > -1) {
			progress.answers[answerIndex].selectedAnswer = selectedAnswer;
		} else {
			progress.answers.push({
				questionId,
				selectedAnswer,
			});
		}

		await progress.save();

		res.status(200).json({
			success: true,
			message: 'Answer saved successfully',
			progress,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, message: 'Failed to save answer', error: error.message });
	}
};

// Submit test
exports.submitTest = async (req, res) => {
	try {
		const { progressId } = req.body;
		const userId = req.user.userId;

		// Find progress record
		const progress = await UserProgress.findOne({ _id: progressId, userId });
		if (!progress) {
			return res.status(404).json({ success: false, message: 'Progress not found' });
		}

		if (progress.status !== 'in-progress') {
			return res.status(400).json({ success: false, message: 'Test already submitted' });
		}

		// Get all questions with correct answers
		const questions = await Question.find({ testId: progress.testId }).select('+correctAnswer');
		const test = await Test.findById(progress.testId);

		// Calculate score
		let totalScore = 0;
		progress.answers.forEach((answer) => {
			const question = questions.find((q) => q._id.toString() === answer.questionId.toString());
			if (question && question.correctAnswer === answer.selectedAnswer) {
				answer.isCorrect = true;
				answer.marksObtained = question.marks;
				totalScore += question.marks;
			} else {
				answer.isCorrect = false;
				answer.marksObtained = 0;
			}
		});

		progress.totalScore = totalScore;
		progress.isPassed = totalScore >= test.passingMarks;
		progress.status = 'submitted';
		progress.submittedAt = new Date();

		await progress.save();

		res.status(200).json({
			success: true,
			message: 'Test submitted successfully',
			progress,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, message: 'Failed to submit test', error: error.message });
	}
};

// Get user's progress for a test
exports.getUserProgress = async (req, res) => {
	try {
		const { progressId } = req.params;
		const userId = req.user.userId;

		const progress = await UserProgress.findOne({ _id: progressId, userId })
			.populate('testId', 'title duration totalMarks passingMarks')
			.populate('answers.questionId', 'questionText options');

		if (!progress) {
			return res.status(404).json({ success: false, message: 'Progress not found' });
		}

		res.status(200).json({
			success: true,
			progress,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, message: 'Failed to fetch progress', error: error.message });
	}
};

// Update time remaining (auto-save)
exports.updateTimeRemaining = async (req, res) => {
	try {
		const { progressId, timeRemaining } = req.body;
		const userId = req.user.userId;

		const progress = await UserProgress.findOne({ _id: progressId, userId });
		if (!progress) {
			return res.status(404).json({ success: false, message: 'Progress not found' });
		}

		progress.timeRemaining = timeRemaining;
		await progress.save();

		res.status(200).json({
			success: true,
			message: 'Time updated',
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, message: 'Failed to update time', error: error.message });
	}
};
