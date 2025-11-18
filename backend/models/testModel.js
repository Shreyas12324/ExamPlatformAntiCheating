const mongoose = require('mongoose');

const testSchema = mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, 'Test title is required!'],
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		duration: {
			type: Number, // in minutes
			required: [true, 'Test duration is required!'],
		},
		totalMarks: {
			type: Number,
			required: true,
		},
		passingMarks: {
			type: Number,
			required: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		startTime: {
			type: Date,
		},
		endTime: {
			type: Date,
		},
		instructions: {
			type: String,
		},
		allowedAttempts: {
			type: Number,
			default: 1,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('Test', testSchema);
