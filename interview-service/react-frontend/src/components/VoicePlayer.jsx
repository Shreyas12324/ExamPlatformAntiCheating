import { useState, useEffect, useRef, useCallback } from 'react';

export default function VoicePlayer({ text, autoPlay = false }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const hasAutoPlayedRef = useRef(false);

  useEffect(() => {
    // Check if speech synthesis is supported
    if (!window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    // Cleanup on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = useCallback(() => {
    if (!window.speechSynthesis || !text) return;

    console.log('🔊 VoicePlayer: Speaking text:', text.substring(0, 50));

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Configure voice settings
    utterance.rate = 1.0; // Normal speed
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Full volume

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = event => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    // Speak
    window.speechSynthesis.speak(utterance);
  }, [text]);

  useEffect(() => {
    // Auto-play if enabled (only once per message)
    console.log('🎵 VoicePlayer useEffect:', {
      autoPlay,
      hasText: !!text,
      hasAutoPlayed: hasAutoPlayedRef.current,
    });

    if (autoPlay && text && !hasAutoPlayedRef.current) {
      console.log('✅ VoicePlayer: Triggering auto-play');
      hasAutoPlayedRef.current = true;
      
      // Check if there's already ongoing speech (from previous message)
      // If so, wait for it to finish before starting this one
      const checkAndPlay = () => {
        if (window.speechSynthesis.speaking) {
          console.log('⏳ VoicePlayer: Waiting for previous speech to finish...');
          // Check again in 200ms
          setTimeout(checkAndPlay, 200);
        } else {
          console.log('▶️ VoicePlayer: Starting speech');
          setTimeout(() => speakText(), 100);
        }
      };
      
      checkAndPlay();
    }
  }, [autoPlay, text, speakText]);

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  if (!isSupported) {
    return null; // Don't show if not supported
  }

  return (
    <button
      onClick={isSpeaking ? stopSpeaking : speakText}
      disabled={!text}
      className={`p-2 rounded-full transition-colors ${
        isSpeaking
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isSpeaking ? 'Stop speaking' : 'Play audio'}
    >
      {isSpeaking ? (
        <svg
          className="w-4 h-4 animate-pulse"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}
