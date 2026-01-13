// Voice service for Speech-to-Text and Text-to-Speech utilities

/**
 * Check if Speech Recognition is supported
 */
export const isSTTSupported = () => {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
};

/**
 * Check if Speech Synthesis is supported
 */
export const isTTSSupported = () => {
  return !!window.speechSynthesis;
};

/**
 * Create and configure a speech recognition instance
 * @returns {SpeechRecognition|null} Recognition instance or null if not supported
 */
export const createRecognition = () => {
  if (!isSTTSupported()) {
    console.warn('Speech Recognition is not supported in this browser');
    return null;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  // Default configuration
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  return recognition;
};

/**
 * Start speech-to-text recognition
 * @param {Object} callbacks - Event callbacks
 * @param {Function} callbacks.onResult - Called when speech is recognized
 * @param {Function} callbacks.onError - Called on error
 * @param {Function} callbacks.onEnd - Called when recognition ends
 * @returns {SpeechRecognition|null} Recognition instance or null if not supported
 */
export const startSTT = ({ onResult, onError, onEnd } = {}) => {
  const recognition = createRecognition();

  if (!recognition) {
    if (onError) {
      onError({
        error: 'not-supported',
        message: 'Speech Recognition not supported',
      });
    }
    return null;
  }

  // Attach event handlers
  if (onResult) {
    recognition.onresult = event => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      onResult({
        interim: interimTranscript.trim(),
        final: finalTranscript.trim(),
        isFinal: !!finalTranscript,
      });
    };
  }

  if (onError) {
    recognition.onerror = event => {
      onError({
        error: event.error,
        message: getErrorMessage(event.error),
      });
    };
  }

  if (onEnd) {
    recognition.onend = onEnd;
  }

  try {
    recognition.start();
    return recognition;
  } catch (err) {
    console.error('Failed to start recognition:', err);
    if (onError) {
      onError({ error: 'start-failed', message: err.message });
    }
    return null;
  }
};

/**
 * Stop speech-to-text recognition
 * @param {SpeechRecognition} recognition - Recognition instance to stop
 */
export const stopSTT = recognition => {
  if (!recognition) return;

  try {
    recognition.stop();
  } catch (err) {
    console.error('Failed to stop recognition:', err);
  }
};

/**
 * Speak text using Text-to-Speech
 * @param {string} text - Text to speak
 * @param {Object} options - Speech options
 * @param {number} options.rate - Speech rate (0.1 to 10, default 1)
 * @param {number} options.pitch - Speech pitch (0 to 2, default 1)
 * @param {number} options.volume - Speech volume (0 to 1, default 1)
 * @param {Function} options.onStart - Called when speech starts
 * @param {Function} options.onEnd - Called when speech ends
 * @param {Function} options.onError - Called on error
 * @returns {SpeechSynthesisUtterance|null} Utterance instance or null if not supported
 */
export const speakText = (text, options = {}) => {
  if (!isTTSSupported()) {
    console.warn('Speech Synthesis is not supported in this browser');
    if (options.onError) {
      options.onError({
        error: 'not-supported',
        message: 'Speech Synthesis not supported',
      });
    }
    return null;
  }

  if (!text || typeof text !== 'string') {
    console.warn('Invalid text provided to speakText');
    return null;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(text);

  // Configure options
  utterance.rate = options.rate || 1.0;
  utterance.pitch = options.pitch || 1.0;
  utterance.volume = options.volume || 1.0;
  utterance.lang = options.lang || 'en-US';

  // Attach event handlers
  if (options.onStart) {
    utterance.onstart = options.onStart;
  }

  if (options.onEnd) {
    utterance.onend = options.onEnd;
  }

  if (options.onError) {
    utterance.onerror = event => {
      options.onError({
        error: event.error,
        message: `Speech synthesis error: ${event.error}`,
      });
    };
  }

  // Speak
  try {
    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (err) {
    console.error('Failed to speak text:', err);
    if (options.onError) {
      options.onError({ error: 'speak-failed', message: err.message });
    }
    return null;
  }
};

/**
 * Stop current speech synthesis
 */
export const stopSpeaking = () => {
  if (isTTSSupported()) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Get available voices
 * @returns {Promise<SpeechSynthesisVoice[]>} Array of available voices
 */
export const getVoices = () => {
  return new Promise(resolve => {
    if (!isTTSSupported()) {
      resolve([]);
      return;
    }

    let voices = window.speechSynthesis.getVoices();

    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // Voices may not be loaded immediately
    window.speechSynthesis.onvoiceschanged = () => {
      voices = window.speechSynthesis.getVoices();
      resolve(voices);
    };
  });
};

/**
 * Get user-friendly error message
 * @param {string} errorCode - Error code from Speech Recognition
 * @returns {string} User-friendly error message
 */
const getErrorMessage = errorCode => {
  const errorMessages = {
    'no-speech': 'No speech was detected. Please try again.',
    aborted: 'Speech recognition was aborted.',
    'audio-capture':
      'No microphone was found. Ensure that a microphone is connected.',
    network: 'Network error occurred. Please check your internet connection.',
    'not-allowed':
      'Microphone permission was denied. Please allow microphone access.',
    'service-not-allowed': 'Speech recognition service is not allowed.',
    'bad-grammar': 'Speech recognition grammar error.',
    'language-not-supported': 'Language is not supported.',
  };

  return errorMessages[errorCode] || `Speech recognition error: ${errorCode}`;
};

export default {
  isSTTSupported,
  isTTSSupported,
  createRecognition,
  startSTT,
  stopSTT,
  speakText,
  stopSpeaking,
  getVoices,
};
