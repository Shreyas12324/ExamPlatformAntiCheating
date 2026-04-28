import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useCheatingStore } from '../store';
import { useToast } from './Toast';

export default function WebcamMonitor({ questionNumber }) {
	const webcamRef = useRef(null);
	const [isActive, setIsActive] = useState(false);
	const [lastCaptureTime, setLastCaptureTime] = useState(Date.now());
	const [status, setStatus] = useState('Initializing...');
	const [cheatingAlert, setCheatingAlert] = useState(null);
	
	const { checkWebcamImage, setWebcamActive } = useCheatingStore();
	const { addToast } = useToast();

	const captureAndCheck = useCallback(async () => {
		if (!webcamRef.current || !isActive) return;

		try {
			const imageSrc = webcamRef.current.getScreenshot();
			if (!imageSrc) return;

			// Convert base64 to blob
			const response = await fetch(imageSrc);
			const blob = await response.blob();

			setStatus('Analyzing...');
			
			// Send to backend for ML analysis
			const result = await checkWebcamImage(blob, questionNumber);
			
			if (result) {
				const baseStatus = `Score: ${result.cheatingScore}/100`;
				setStatus(result.mobile_detected ? `${baseStatus} | 📱 Phone detected` : baseStatus);
				
				// Only show toast for mobile detection and multiple faces
				const details = result.details || {};
				const numFaces = details.num_faces || 0;
				const isMobile = result.mobile_detected || details.mobile_detected;
				const isMultipleFaces = numFaces > 1;
				
				// Show toast only for critical events (mobile or multiple faces)
				if (isMobile || isMultipleFaces) {
					setCheatingAlert(result);
					setTimeout(() => setCheatingAlert(null), 5000);
					
					let message;
					if (isMobile) {
						message = '🚨 CRITICAL ALERT: Mobile phone detected in frame!';
					} else if (isMultipleFaces) {
						message = `🚨 CRITICAL ALERT: Multiple people detected (${numFaces} faces)!`;
					}
					
					addToast(message, 'critical', 1000);
				}
				// Other events (no face, looking away, etc.) are logged but no toast shown
			} else {
				setStatus('Monitoring...');
			}
			
			setLastCaptureTime(Date.now());
		} catch (error) {
			console.error('Webcam capture error:', error);
			setStatus('Error');
			addToast('❌ Webcam monitoring error. Please ensure camera is working.', 'error', 4000);
		}
	}, [isActive, questionNumber, addToast]);

	// Capture periodically (every 3 seconds)
	useEffect(() => {
		if (!isActive) return;

		const interval = setInterval(() => {
			captureAndCheck();
		}, 3000);

		return () => clearInterval(interval);
	}, [isActive, captureAndCheck]);

	// Capture on question change
	useEffect(() => {
		if (isActive) {
			captureAndCheck();
		}
	}, [questionNumber]);

	const handleWebcamLoad = () => {
		setIsActive(true);
		setWebcamActive(true);
		setStatus('Monitoring...');
		addToast('✅ Webcam monitoring activated. Please stay visible and centered.', 'success', 4000);
	};

	const handleWebcamError = (error) => {
		console.error('Webcam error:', error);
		setStatus('Webcam Error');
		setIsActive(false);
		addToast('❌ Camera access denied. Please allow camera permission to continue.', 'error', 6000);
	};

	return (
		<div>
			<h3 className="text-lg font-bold text-gray-800 mb-3">Webcam Monitor</h3>
			
			<div className="relative">
				<Webcam
					ref={webcamRef}
					audio={false}
					screenshotFormat="image/jpeg"
					className="w-full rounded-lg"
					videoConstraints={{
						width: 320,
						height: 240,
						facingMode: 'user',
					}}
					onUserMedia={handleWebcamLoad}
					onUserMediaError={handleWebcamError}
				/>
				
				{isActive && (
					<div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
						● LIVE
					</div>
				)}
			</div>

			<div className="mt-3 text-sm">
				<div className="flex justify-between items-center mb-2">
					<span className="text-gray-600">Status:</span>
					<span className={`font-semibold ${isActive ? 'text-green-600' : 'text-red-600'}`}>
						{status}
					</span>
				</div>
			</div>

			{cheatingAlert && (
				<div className={`mt-3 p-3 rounded-lg ${
					cheatingAlert.severity === 'critical' 
						? 'bg-red-100 border border-red-400 text-red-800' 
						: 'bg-yellow-100 border border-yellow-400 text-yellow-800'
				}`}>
					<p className="font-bold text-sm">⚠️ Alert</p>
					<p className="text-xs mt-1">{cheatingAlert.message}</p>
				</div>
			)}

			<div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
				<p className="text-xs text-blue-800 font-semibold mb-2">Instructions:</p>
				<ul className="text-xs text-blue-700 space-y-1">
					<li>• Keep your face visible</li>
					<li>• Stay centered in frame</li>
					<li>• Look at the screen</li>
					<li>• No other person in frame</li>
				</ul>
			</div>
		</div>
	);
}
