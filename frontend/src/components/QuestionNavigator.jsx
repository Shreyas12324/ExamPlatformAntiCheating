import React from 'react';

export default function QuestionNavigator({ questions, answers, currentIndex, onNavigate }) {
	return (
		<div>
			<h3 className="text-lg font-bold text-gray-800 mb-4">Questions</h3>
			<div className="grid grid-cols-5 gap-2">
				{questions.map((question, index) => {
					const isAnswered = answers[question._id] !== undefined;
					const isCurrent = index === currentIndex;

					return (
						<button
							key={question._id}
							onClick={() => onNavigate(index)}
							className={`w-10 h-10 rounded-lg font-bold text-sm transition ${
								isCurrent
									? 'bg-blue-600 text-white ring-2 ring-blue-400'
									: isAnswered
									? 'bg-green-500 text-white hover:bg-green-600'
									: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
							}`}
						>
							{index + 1}
						</button>
					);
				})}
			</div>

			<div className="mt-6 space-y-2 text-sm">
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 bg-green-500 rounded"></div>
					<span>Answered</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 bg-gray-200 rounded"></div>
					<span>Not Answered</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 bg-blue-600 rounded ring-2 ring-blue-400"></div>
					<span>Current</span>
				</div>
			</div>
		</div>
	);
}
