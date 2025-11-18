import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { useExamStore, useCheatingStore } from '../store';
import { useToast } from './Toast';
import Timer from './Timer';
import QuestionNavigator from './QuestionNavigator';
import WebcamMonitor from './WebcamMonitor';

export default function ExamInterface() {
	const { testId } = useParams();
	const navigate = useNavigate();
	const { addToast } = useToast();
	
	const {
		currentTest,
		questions,
		progress,
		currentQuestionIndex,
		answers,
		fetchTestDetails,
		startTest,
		saveAnswer,
		submitTest,
		setCurrentQuestionIndex,
		resetExam,
	} = useExamStore();

	const { logEvent, tabSwitchCount, reset: resetCheating } = useCheatingStore();

	const [loading, setLoading] = useState(true);
	const [showInstructions, setShowInstructions] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const init = async () => {
			await fetchTestDetails(testId);
			setLoading(false);
		};
		init();

		return () => {
			resetExam();
			resetCheating();
		};
	}, [testId]);

	// Tab switch detection
	useEffect(() => {
		if (!progress || showInstructions) return;

		const handleVisibilityChange = () => {
			if (document.hidden) {
				logEvent('tab-switch', 'medium', 'User switched tab or minimized window', currentQuestionIndex + 1);
				addToast(
					'⚠️ Warning: Tab switching detected! This behavior is being monitored and logged.',
					'warning',
					6000
				);
			}
		};

		const handleBlur = () => {
			logEvent('window-blur', 'low', 'Window lost focus', currentQuestionIndex + 1);
			addToast(
				'🔔 Focus Lost: Please keep this window in focus during the exam.',
				'info',
				4000
			);
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('blur', handleBlur);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('blur', handleBlur);
		};
	}, [progress, showInstructions, currentQuestionIndex, addToast]);

	const handleStartTest = async () => {
		try {
			await startTest(testId);
			setShowInstructions(false);
			addToast('✅ Test started! Stay focused and avoid suspicious behavior.', 'success', 5000);
		} catch (error) {
			alert('Failed to start test. Please try again.');
		}
	};

	const handleAnswerSelect = (option) => {
		const currentQuestion = questions[currentQuestionIndex];
		saveAnswer(currentQuestion._id, option);
	};

	const handleNext = () => {
		if (currentQuestionIndex < questions.length - 1) {
			setCurrentQuestionIndex(currentQuestionIndex + 1);
		}
	};

	const handlePrev = () => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex(currentQuestionIndex - 1);
		}
	};

	const handleSubmit = async () => {
		const confirmed = window.confirm('Are you sure you want to submit the test? This action cannot be undone.');
		if (!confirmed) return;

		setIsSubmitting(true);
		try {
			const result = await submitTest();
			addToast(
				`🎉 Test submitted successfully! Your score: ${result.totalScore}/${currentTest.totalMarks}`,
				'success',
				8000
			);
			setTimeout(() => navigate('/dashboard'), 2000);
		} catch (error) {
			addToast('❌ Failed to submit test. Please try again.', 'error', 5000);
			setIsSubmitting(false);
		}
	};

	const handleTimeUp = async () => {
		addToast('⏰ Time is up! Your test is being auto-submitted...', 'warning', 5000);
		try {
			await submitTest();
			navigate('/dashboard');
		} catch (error) {
			console.error('Auto-submit failed:', error);
			addToast('❌ Auto-submit failed. Please contact support.', 'error', 8000);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (!currentTest || questions.length === 0) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-gray-800 mb-4">Test not found</h2>
					<button
						onClick={() => navigate('/dashboard')}
						className="bg-blue-600 text-white px-6 py-2 rounded-lg"
					>
						Back to Dashboard
					</button>
				</div>
			</div>
		);
	}

	if (showInstructions) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
				<div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
					<h1 className="text-3xl font-bold text-gray-800 mb-4">{currentTest.title}</h1>
					<p className="text-gray-600 mb-6">{currentTest.description}</p>

					<div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
						<h2 className="text-xl font-bold text-blue-800 mb-3">Instructions:</h2>
						<ul className="space-y-2 text-gray-700">
							<li>• Duration: {currentTest.duration} minutes</li>
							<li>• Total Questions: {questions.length}</li>
							<li>• Total Marks: {currentTest.totalMarks}</li>
							<li>• Passing Marks: {currentTest.passingMarks}</li>
							<li>• Your webcam will be monitored during the test</li>
							<li>• Do not switch tabs or minimize the window</li>
							<li>• Multiple people in frame will be flagged as cheating</li>
							<li>• Your progress will be auto-saved</li>
						</ul>
						{currentTest.instructions && (
							<div className="mt-4 pt-4 border-t border-blue-200">
								<p className="text-gray-700">{currentTest.instructions}</p>
							</div>
						)}
					</div>

					<div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
						<p className="text-yellow-800 font-semibold">⚠️ Anti-Cheating Measures Active</p>
						<p className="text-sm text-yellow-700 mt-1">
							This exam uses AI-powered monitoring. Please ensure you are alone and facing the camera.
						</p>
					</div>

					<button
						onClick={handleStartTest}
						className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition text-lg"
					>
						I Understand - Start Test
					</button>
				</div>
			</div>
		);
	}

	const currentQuestion = questions[currentQuestionIndex];
	const selectedAnswer = answers[currentQuestion._id];
	const answeredCount = Object.keys(answers).length;

	return (
		<div className="min-h-screen bg-gray-100 flex">
			{/* Left Sidebar - Question Navigator */}
			<div className="w-64 bg-white shadow-lg p-4 overflow-y-auto">
				<QuestionNavigator
					questions={questions}
					answers={answers}
					currentIndex={currentQuestionIndex}
					onNavigate={setCurrentQuestionIndex}
				/>
			</div>

			{/* Main Content */}
			<div className="flex-1 flex flex-col">
				{/* Header */}
				<header className="bg-white shadow-md p-4">
					<div className="flex justify-between items-center">
						<div>
							<h1 className="text-2xl font-bold text-gray-800">{currentTest.title}</h1>
							<p className="text-sm text-gray-600">
								Question {currentQuestionIndex + 1} of {questions.length}
							</p>
						</div>
						<div className="flex items-center gap-4">
							{tabSwitchCount > 0 && (
								<div className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-semibold">
									⚠️ Tab Switches: {tabSwitchCount}
								</div>
							)}
							<Timer
								initialTime={progress?.timeRemaining}
								onTimeUp={handleTimeUp}
							/>
						</div>
					</div>
				</header>

				{/* Question Area */}
				<main className="flex-1 p-6 overflow-y-auto">
					<div className="max-w-4xl mx-auto">
						<div className="bg-white rounded-lg shadow-md p-8">
							<div className="mb-6">
								<h2 className="text-xl font-bold text-gray-800 mb-4">
									Q{currentQuestion.questionNumber}. {currentQuestion.questionText}
								</h2>
								<p className="text-sm text-gray-600">Marks: {currentQuestion.marks}</p>
							</div>

							<div className="space-y-3">
								{currentQuestion.options.map((option) => (
									<button
										key={option.optionIndex}
										onClick={() => handleAnswerSelect(option.optionIndex)}
										className={`w-full text-left p-4 rounded-lg border-2 transition ${
											selectedAnswer === option.optionIndex
												? 'border-blue-600 bg-blue-50'
												: 'border-gray-300 hover:border-blue-400'
										}`}
									>
										<span className="font-bold text-gray-700 mr-3">{option.optionIndex}.</span>
										<span className="text-gray-800">{option.optionText}</span>
									</button>
								))}
							</div>
						</div>

						{/* Navigation Buttons */}
						<div className="flex justify-between items-center mt-6">
							<button
								onClick={handlePrev}
								disabled={currentQuestionIndex === 0}
								className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
							>
								← Previous
							</button>

							<div className="text-gray-700 font-semibold">
								Answered: {answeredCount}/{questions.length}
							</div>

							{currentQuestionIndex === questions.length - 1 ? (
								<button
									onClick={handleSubmit}
									disabled={isSubmitting}
									className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition disabled:opacity-50"
								>
									{isSubmitting ? 'Submitting...' : 'Submit Test'}
								</button>
							) : (
								<button
									onClick={handleNext}
									className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
								>
									Next →
								</button>
							)}
						</div>
					</div>
				</main>
			</div>

			{/* Right Sidebar - Webcam Monitor */}
			<div className="w-80 bg-white shadow-lg p-4">
				<WebcamMonitor questionNumber={currentQuestionIndex + 1} />
			</div>
		</div>
	);
}
