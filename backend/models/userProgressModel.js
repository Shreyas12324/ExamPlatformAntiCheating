const mongoose = require('mongoose');

const userProgressSchema = mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		testId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Test',
			required: true,
		},
		answers: [
			{
				questionId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'Question',
				},
				selectedAnswer: {
					type: String, // A, B, C, D
				},
				isCorrect: {
					type: Boolean,
				},
				marksObtained: {
					type: Number,
					default: 0,
				},
			},
		],
		startedAt: {
			type: Date,
			default: Date.now,
		},
		submittedAt: {
			type: Date,
		},
		status: {
			type: String,
			enum: ['in-progress', 'submitted', 'auto-submitted'],
			default: 'in-progress',
		},
		totalScore: {
			type: Number,
			default: 0,
		},
		isPassed: {
			type: Boolean,
		},
		attemptNumber: {
			type: Number,
			default: 1,
		},
		timeRemaining: {
			type: Number, // in seconds
		},
	},
	{
		timestamps: true,
	}
);

// Compound index to ensure unique user-test-attempt combination
userProgressSchema.index({ userId: 1, testId: 1, attemptNumber: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);
