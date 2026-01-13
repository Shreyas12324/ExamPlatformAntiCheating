import { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { logCheatingEvent } from '../services/api';

const CAPTURE_INTERVAL = 3000; // 3 seconds

export default function WebcamFeed({ interviewId, onAlert }) {
  const webcamRef = useRef(null);
  const [isActive, setIsActive] = useState(true);
  const [isMirrored, setIsMirrored] = useState(true);
  const [detectionStatus, setDetectionStatus] = useState('normal'); // normal, warning, critical
  const [lastCheck, setLastCheck] = useState(null);
  const [captureCount, setCaptureCount] = useState(0);
  const [error, setError] = useState('');

  const captureAndSend = useCallback(async () => {
    if (!webcamRef.current || !interviewId) return;

    try {
      // Capture screenshot
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        console.warn('Failed to capture screenshot');
        return;
      }

      // Extract base64 data (remove data:image/jpeg;base64, prefix)
      const base64Data = imageSrc.split(',')[1];

      // Send to backend
      const response = await logCheatingEvent({
        interview_id: interviewId,
        frame_data: base64Data,
        timestamp: new Date().toISOString(),
      });

      // Update status based on detection
      const severity = response.detection_result?.severity || 'low';

      if (severity === 'critical') {
        setDetectionStatus('critical');
      } else if (severity === 'high' || severity === 'medium') {
        setDetectionStatus('warning');
      } else {
        setDetectionStatus('normal');
      }

      // Update last check time
      setLastCheck(new Date().toLocaleTimeString());
      setCaptureCount(prev => prev + 1);

      // Notify parent if critical event was logged (mobile/multiple faces)
      if (response.event_logged && onAlert) {
        console.log('🔔 WebcamFeed: Critical event detected, calling onAlert');
        console.log('📦 Response data:', response);

        // Determine event type from detection result
        const detectionResult = response.detection_result || {};
        let eventType = 'UNKNOWN';

        if (detectionResult.mobile_detected) {
          eventType = 'MOBILE_DEVICE_DETECTED';
        } else if (detectionResult.num_faces > 1) {
          eventType = 'MULTIPLE_FACES';
        }

        console.log(`🎯 Event Type determined: ${eventType}`);

        onAlert({
          severity,
          message: detectionResult.message || 'Detection event',
          score: detectionResult.cheating_score || 0,
          event_type: eventType,
          issues: detectionResult.issues,
          detection_result: detectionResult,
        });
      }

      // Reset status indicator after 2 seconds for non-critical events
      if (severity !== 'critical') {
        setTimeout(() => setDetectionStatus('normal'), 2000);
      }
    } catch (err) {
      console.error('Cheating detection error:', err);
      setError('Detection temporarily unavailable');
      setTimeout(() => setError(''), 3000);
    }
  }, [interviewId]); // Remove onAlert from dependencies to prevent infinite loop

  // Auto-capture interval
  useEffect(() => {
    if (!isActive || !interviewId) return;

    // Call immediately on mount
    captureAndSend();

    // Then set interval
    const interval = setInterval(captureAndSend, CAPTURE_INTERVAL);

    return () => clearInterval(interval);
  }, [isActive, interviewId, captureAndSend]);

  const handleUserMediaError = error => {
    console.error('Webcam error:', error);
    setError('Unable to access webcam. Please check permissions.');
  };

  const getStatusColor = () => {
    switch (detectionStatus) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getStatusText = () => {
    switch (detectionStatus) {
      case 'critical':
        return 'Critical Alert';
      case 'warning':
        return 'Warning';
      default:
        return 'Normal';
    }
  };

  return (
    <div className="relative">
      {/* Webcam Container */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        {isActive ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: 640,
              height: 480,
              facingMode: 'user',
            }}
            onUserMediaError={handleUserMediaError}
            mirrored={isMirrored}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-64 flex items-center justify-center bg-gray-800 text-white">
            <div className="text-center">
              <p className="text-lg mb-2">Webcam Paused</p>
              <p className="text-sm text-gray-400">Monitoring disabled</p>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="absolute top-3 left-3 flex items-center space-x-2 bg-black bg-opacity-60 px-3 py-2 rounded-lg">
          <div
            className={`w-3 h-3 rounded-full ${getStatusColor()} ${detectionStatus !== 'normal' ? 'animate-pulse' : ''}`}
          ></div>
          <span className="text-white text-sm font-medium">
            {getStatusText()}
          </span>
        </div>

        {/* Recording Indicator */}
        {isActive && (
          <div className="absolute top-3 right-3 flex items-center space-x-2 bg-red-600 bg-opacity-90 px-3 py-2 rounded-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-medium">MONITORING</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute bottom-3 left-3 right-3 bg-red-600 bg-opacity-90 px-3 py-2 rounded-lg">
            <p className="text-white text-sm text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
