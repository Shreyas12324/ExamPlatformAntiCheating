import { useState, useEffect } from 'react';
import VoiceRecorder from './VoiceRecorder';

export default function ChatInput({
  onSend,
  disabled = false,
  showVoiceInput = true,
  initialMode = 'text',
}) {
  const [message, setMessage] = useState('');
  const [showVoice, setShowVoice] = useState(initialMode === 'voice');

  // Update when initialMode changes
  useEffect(() => {
    setShowVoice(initialMode === 'voice');
  }, [initialMode]);

  const handleSend = () => {
    if (!message.trim() || disabled) return;

    onSend(message.trim());
    setMessage('');
    setShowVoice(false);
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceTranscript = transcript => {
    setMessage(transcript);
    setShowVoice(false);
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* Voice Input Toggle */}
      {showVoiceInput && (
        <div className="mb-3">
          <button
            onClick={() => setShowVoice(!showVoice)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            disabled={disabled}
          >
            {showVoice ? 'Switch to Text Input' : 'Use Voice Input'}
          </button>
        </div>
      )}

      {/* Voice Recorder */}
      {showVoice && showVoiceInput && (
        <div className="mb-3">
          <VoiceRecorder
            onTranscript={handleVoiceTranscript}
            isEnabled={!disabled}
          />
        </div>
      )}

      {/* Text Input */}
      <div className="flex space-x-2">
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            disabled
              ? 'Please wait...'
              : 'Type your answer here... (Shift+Enter for new line)'
          }
          disabled={disabled}
          rows={3}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className={`px-6 py-2 rounded-lg font-semibold text-white transition-colors self-end ${
            disabled || !message.trim()
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {disabled ? (
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            'Send'
          )}
        </button>
      </div>

      {/* Helper Text */}
      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
        <span>Press Enter to send • Shift+Enter for new line</span>
        {message.length > 0 && (
          <span className={message.length > 500 ? 'text-yellow-600' : ''}>
            {message.length} characters
          </span>
        )}
      </div>
    </div>
  );
}
