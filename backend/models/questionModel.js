const mongoose = require('mongoose');

const questionSchema = mongoose.Schema(
	{
		testId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Test',
			required: true,
		},
		questionText: {
			type: String,
			required: [true, 'Question text is required!'],
			trim: true,
		},
		options: [
			{
				optionText: {
					type: String,
					required: true,
				},
				optionIndex: {
					type: String, // A, B, C, D
					required: true,
				},
			},
		],
		correctAnswer: {
			type: String, // A, B, C, D
			required: true,
			select: false, // Don't send to frontend
		},
		marks: {
			type: Number,
			default: 1,
		},
		questionNumber: {
			type: Number,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('Question', questionSchema);
