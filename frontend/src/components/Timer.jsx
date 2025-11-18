import React, { useEffect, useState } from 'react';
import { useExamStore } from '../store';

export default function Timer({ initialTime, onTimeUp }) {
	const [timeRemaining, setTimeRemaining] = useState(initialTime);
	const { updateTimeRemaining } = useExamStore();

	useEffect(() => {
		setTimeRemaining(initialTime);
	}, [initialTime]);

	useEffect(() => {
		if (timeRemaining <= 0) {
			onTimeUp();
			return;
		}

		const interval = setInterval(() => {
			setTimeRemaining((prev) => {
				const newTime = prev - 1;
				
				// Auto-save time every 10 seconds
				if (newTime % 10 === 0) {
					updateTimeRemaining(newTime);
				}
				
				return newTime;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [timeRemaining]);

	const formatTime = (seconds) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
		}
		return `${minutes}:${String(secs).padStart(2, '0')}`;
	};

	const isLowTime = timeRemaining < 300; // Less than 5 minutes
	const isCriticalTime = timeRemaining < 60; // Less than 1 minute

	return (
		<div
			className={`px-6 py-3 rounded-lg font-bold text-lg ${
				isCriticalTime
					? 'bg-red-600 text-white animate-pulse'
					: isLowTime
					? 'bg-yellow-500 text-white'
					: 'bg-green-600 text-white'
			}`}
		>
			⏱️ {formatTime(timeRemaining)}
		</div>
	);
}
