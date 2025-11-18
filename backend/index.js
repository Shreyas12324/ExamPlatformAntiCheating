const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');

// Import routers
const authRouter = require('./routers/authRouter');
const examRouter = require('./routers/examRouter');
const cheatingRouter = require('./routers/cheatingRouter');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors({
	origin: process.env.CLIENT_URL || 'http://localhost:5173',
	credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection
mongoose
	.connect(process.env.MONGO_URI)
	.then(() => {
		console.log('Database connected successfully!');
	})
	.catch((err) => {
		console.log('Database connection failed!', err);
	});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/exam', examRouter);
app.use('/api/cheating', cheatingRouter);

// Health check
app.get('/api/health', (req, res) => {
	res.status(200).json({ 
		success: true, 
		message: 'Anti-Cheating Exam Platform API is running',
		timestamp: new Date().toISOString()
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
	console.log(`Server is listening on port ${PORT}`);
});
