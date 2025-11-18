const Joi = require('joi');

exports.signupSchema = Joi.object({
	email: Joi.string()
		.min(6)
		.max(60)
		.required()
		.email({
			tlds: { allow: ['com', 'net'] },
		}),
	password: Joi.string()
		.required(),
	type: Joi.string()
		.valid('candidate', 'intern', 'developer', 'admin')
		.required(),
});
exports.signinSchema = Joi.object({
	email: Joi.string()
		.min(6)
		.max(60)
		.required()
		.email({
			tlds: { allow: ['com', 'net'] },
		}),
	password: Joi.string()
		.required()
});

exports.acceptCodeSchema = Joi.object({
	email: Joi.string()
		.min(6)
		.max(60)
		.required()
		.email({
			tlds: { allow: ['com', 'net'] },
		}),
	providedCode: Joi.number().required(),
});

exports.changePasswordSchema = Joi.object({
	newPassword: Joi.string()
		.required(),
	oldPassword: Joi.string()
		.required()
});

exports.acceptFPCodeSchema = Joi.object({
	email: Joi.string()
		.min(6)
		.max(60)
		.required()
		.email({
			tlds: { allow: ['com', 'net'] },
		}),
	providedCode: Joi.number().required(),
	newPassword: Joi.string()
		.required()
});

exports.createPostSchema = Joi.object({
	title: Joi.string().min(3).max(60).required(),
	description: Joi.string().min(3).max(600).required(),
	userId: Joi.string().required(),
});

// Add internship schema
exports.internshipSchema = Joi.object({
	role: Joi.string().required(),
	company: Joi.string().required(),
	location: Joi.string().required(),
	duration: Joi.string().required(),
	type: Joi.string().required(),
	skills: Joi.array().items(Joi.string()),
	stipend: Joi.number(),
	expectedSalary: Joi.number(),
	eligibility: Joi.string(),
	openings: Joi.number(),
	jobDescription: Joi.string(),
	applyLink: Joi.string().uri(),
});

// Add application schema validation
exports.applySchema = Joi.object({
	internshipId: Joi.string().required(),
	userId: Joi.string().optional(), // optional since we use token
});
