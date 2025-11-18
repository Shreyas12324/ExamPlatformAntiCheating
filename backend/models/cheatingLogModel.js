const mongoose = require('mongoose');

const cheatingLogSchema = mongoose.Schema(
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
		progressId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'UserProgress',
			required: true,
		},
		eventType: {
			type: String,
			enum: ['tab-switch', 'window-blur', 'face-detection', 'mobile-detection', 'multiple-faces', 'no-face', 'gaze-away', 'other'],
			required: true,
		},
		severity: {
			type: String,
			enum: ['low', 'medium', 'high', 'critical'],
			default: 'low',
		},
		cheatingScore: {
			type: Number, // 0-100
			default: 0,
		},
		mlResponse: {
			type: mongoose.Schema.Types.Mixed, // Store full ML response
		},
		description: {
			type: String,
		},
		questionNumber: {
			type: Number,
		},
		imageUrl: {
			type: String, // Store webcam capture path
		},
		timestamp: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('CheatingLog', cheatingLogSchema);
