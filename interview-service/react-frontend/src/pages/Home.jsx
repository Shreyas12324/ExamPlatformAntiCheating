import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { startInterview } from '../services/api';

const ROLES = ['SDE', 'Sales', 'Retail Associate', 'HR'];
const PERSONAS = ['Efficient', 'Confused', 'Chatty', 'Edge-case'];

const ROLE_DESCRIPTIONS = {
  SDE: 'Software engineering questions focusing on technical skills, data structures, and problem-solving',
  Sales: 'Sales scenarios and techniques, customer relationship management',
  'Retail Associate':
    'Customer service focus, handling difficult situations, product knowledge',
  HR: 'HR policies, people management, conflict resolution, and employee relations',
};

const PERSONA_DESCRIPTIONS = {
  Efficient: 'Brief, direct responses - get straight to the point',
  Confused: 'More guidance and explanations - patient and supportive',
  Chatty: 'Friendly but keeps you on track - professional redirection',
  'Edge-case': 'Handles unusual responses gracefully - sets boundaries',
};

export default function Home() {
  const navigate = useNavigate();
  const { setInterviewData } = useInterview();

  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('SDE');
  const [audioMode, setAudioMode] = useState('text'); // 'text' or 'voice'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Persona is always 'Adaptive' for auto-detection
  const persona = 'Adaptive';

  const handleStartInterview = async () => {
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await startInterview({
        role,
        persona,
        user_name: userName.trim(),
      });

      // Store interview data in context
      // Combine greeting and first question into one message for better voice flow
      const combinedMessage = `${response.greeting_message}\n\n${response.first_question}`;

      setInterviewData({
        interviewId: response.interview_id,
        role,
        persona,
        userName: userName.trim(),
        audioMode,
        messages: [
          {
            role: 'assistant',
            content: combinedMessage,
            timestamp: new Date().toISOString(),
          },
        ],
      });

      // Navigate to interview page
      navigate('/interview');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to start interview. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Interview Practice Partner
          </h1>
          <p className="mt-2 text-gray-600">
            Practice interviews with AI feedback and real-time monitoring
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Setup Your Interview
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            {/* Name Input */}
            <div>
              <label
                htmlFor="userName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Name
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Role Selection */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Role
              </label>
              <select
                id="role"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-600">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </div>

            {/* Voice Mode Selection */}
            <div>
              <label
                htmlFor="audioMode"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Voice Mode
              </label>
              <select
                id="audioMode"
                value={audioMode}
                onChange={e => setAudioMode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="text">Text Only</option>
                <option value="voice">Voice Enabled</option>
              </select>
              <p className="mt-2 text-sm text-gray-600">
                {audioMode === 'voice'
                  ? 'Agent responses will be spoken automatically. You can use microphone to answer.'
                  : 'Text-based interview. You can enable voice mode during interview.'}
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">What to Expect</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 5-7 questions tailored to your selected role</li>
                <li>
                  • AI agent will automatically adapt to your communication
                  style
                </li>
                <li>• AI will ask follow-up questions based on your answers</li>
                <li>
                  • Webcam monitoring for security (similar to HackerRank/Mettl)
                </li>
                <li>
                  • Comprehensive feedback at the end with scores and
                  recommendations
                </li>
              </ul>
            </div>

            {/* Warning Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-900 mb-2">Important</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Webcam access is required for monitoring</li>
                <li>• Ensure good lighting and a quiet environment</li>
                <li>• Stay in frame and avoid looking away frequently</li>
                <li>• No mobile phones or additional screens visible</li>
              </ul>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartInterview}
              disabled={loading || !userName.trim()}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                loading || !userName.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Starting Interview...
                </span>
              ) : (
                'Start Interview'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
