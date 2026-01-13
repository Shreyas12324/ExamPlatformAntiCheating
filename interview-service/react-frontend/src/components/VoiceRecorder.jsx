import { useState, useEffect, useRef } from 'react';

// Check for Speech Recognition API support
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

export default function VoiceRecorder({ onTranscript, isEnabled = true }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState('');
  const [isSupportedBrowser, setIsSupportedBrowser] = useState(true);

  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!isSpeechRecognitionSupported) {
      setIsSupportedBrowser(false);
      setError(
        'Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.'
      );
      return;
    }

    // Initialize Speech Recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognition.onresult = event => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + ' ';
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        setTranscript(prev => prev + finalText);
      }
      setInterimTranscript(interimText);
    };

    recognition.onerror = event => {
      console.error('Speech recognition error:', event.error);

      let errorMessage = 'Voice recognition error';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not accessible. Check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied.';
          break;
        case 'network':
          errorMessage = 'Network error. Check your connection.';
          break;
        default:
          errorMessage = `Error: ${event.error}`;
      }

      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || !isEnabled) return;

    try {
      setTranscript('');
      setInterimTranscript('');
      setError('');
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setError('Failed to start microphone. Please try again.');
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();

      // Send final transcript to parent
      if (transcript.trim() && onTranscript) {
        onTranscript(transcript.trim());
      }
    } catch (err) {
      console.error('Failed to stop recognition:', err);
    }
  };

  const handleClear = () => {
    setTranscript('');
    setInterimTranscript('');
    setError('');
  };

  const handleUseTranscript = () => {
    if (transcript.trim() && onTranscript) {
      onTranscript(transcript.trim());
      handleClear();
    }
  };

  if (!isSupportedBrowser) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-medium text-yellow-900">
              Voice Input Not Available
            </p>
            <p className="text-sm text-yellow-800 mt-1">
              Speech recognition is not supported in your browser. Please use
              text input or switch to Chrome/Edge/Safari.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Voice Input Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">Voice Input</span>
          </div>

          {isListening && (
            <div className="flex items-center space-x-2 text-red-600">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Listening...</span>
            </div>
          )}
        </div>

        {/* Transcript Display */}
        {(transcript || interimTranscript) && (
          <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[80px] max-h-[200px] overflow-y-auto">
            <p className="text-gray-800">
              {transcript}
              {interimTranscript && (
                <span className="text-gray-400 italic">
                  {interimTranscript}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex space-x-2">
          {!isListening ? (
            <button
              onClick={startListening}
              disabled={!isEnabled}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-medium text-white transition-colors"
            >
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-medium text-white transition-colors"
            >
              ⏹️ Stop Recording
            </button>
          )}

          {transcript && !isListening && (
            <>
              <button
                onClick={handleUseTranscript}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-medium text-white transition-colors"
                title="Use this transcript"
              >
                ✓
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium text-gray-700 transition-colors"
                title="Clear transcript"
              >
                🗑️
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          {isListening
            ? 'Speak clearly into your microphone'
            : 'Click "Start Recording" to use voice input (optional)'}
        </div>
      </div>

      {/* Browser Compatibility Info */}
      <div className="text-xs text-gray-500 text-center">
        💡 Voice input works best in Chrome, Edge, and Safari
      </div>
    </div>
  );
}
