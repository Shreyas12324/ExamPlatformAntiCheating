import { useState, useRef, useCallback } from 'react';

export function useWebcam() {
  const webcamRef = useRef(null);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState(null);

  const captureFrame = useCallback(() => {
    if (!webcamRef.current || !isActive) {
      return null;
    }

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setError('Failed to capture frame');
        return null;
      }

      setError(null);
      return imageSrc;
    } catch (err) {
      console.error('Webcam capture error:', err);
      setError(err.message);
      return null;
    }
  }, [isActive]);

  const toggleActive = useCallback(() => {
    setIsActive(prev => !prev);
  }, []);

  return {
    webcamRef,
    isActive,
    error,
    captureFrame,
    toggleActive,
  };
}

export default useWebcam;
