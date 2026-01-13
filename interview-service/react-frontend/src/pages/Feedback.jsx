import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';

export default function Feedback() {
  const navigate = useNavigate();
  const { interviewData, resetInterview } = useInterview();

  // Redirect if no feedback available
  useEffect(() => {
    if (!interviewData?.feedback) {
      navigate('/');
    }
  }, [interviewData, navigate]);

  const handleStartNew = () => {
    resetInterview();
    navigate('/');
  };

  if (!interviewData?.feedback) {
    return null; // Will redirect
  }

  const { feedback, cheating_summary } = interviewData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Interview Feedback
          </h1>
          <p className="mt-2 text-gray-600">
            Your performance review and recommendations
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Technical Score */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Technical</h3>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {feedback.technical_score}
                <span className="text-2xl text-gray-400">/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(feedback.technical_score / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Communication Score */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Communication
              </h3>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">
                {feedback.communication_score}
                <span className="text-2xl text-gray-400">/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(feedback.communication_score / 10) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Confidence Score */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Confidence
              </h3>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-orange-600 mb-2">
                {feedback.confidence_score}
                <span className="text-2xl text-gray-400">/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(feedback.confidence_score / 10) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Overall Summary
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {feedback.overall_summary}
          </p>
        </div>

        {/* Strengths and Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Strengths
            </h3>
            <ul className="space-y-2">
              {feedback.strengths?.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Areas for Improvement
            </h3>
            <ul className="space-y-2">
              {feedback.weaknesses?.map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-500 mr-2 mt-1">•</span>
                  <span className="text-gray-700">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Recommendations
          </h3>
          <ul className="space-y-3">
            {feedback.recommendations?.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 text-sm font-semibold">
                  {index + 1}
                </span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Monitoring Summary - Removed as per requirements */}
        {false && (feedback.cheating_summary || cheating_summary) && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Monitoring Summary
            </h3>

            {(() => {
              const summary = feedback.cheating_summary || cheating_summary;
              const probability = summary.overall_cheating_probability || 0;

              return (
                <>
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-700">
                        {summary.total_events || 0}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Total Events
                      </div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {summary.critical_events || 0}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Critical</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {summary.looking_away_count || 0}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Looking Away
                      </div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {summary.multiple_faces_count || 0}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Multiple Faces
                      </div>
                    </div>
                  </div>

                  {/* Probability Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Cheating Probability
                      </span>
                      <span
                        className={`text-lg font-bold ${
                          probability >= 70
                            ? 'text-red-600'
                            : probability >= 40
                              ? 'text-yellow-600'
                              : 'text-green-600'
                        }`}
                      >
                        {probability}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          probability >= 70
                            ? 'bg-red-600'
                            : probability >= 40
                              ? 'bg-yellow-600'
                              : 'bg-green-600'
                        }`}
                        style={{ width: `${probability}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Status Message */}
                  <div
                    className={`mt-4 p-3 rounded-lg ${
                      probability >= 70
                        ? 'bg-red-50 text-red-800'
                        : probability >= 40
                          ? 'bg-yellow-50 text-yellow-800'
                          : 'bg-green-50 text-green-800'
                    }`}
                  >
                    <p className="text-sm">
                      {probability >= 70
                        ? '⚠️ High probability of cheating detected. Review recommended.'
                        : probability >= 40
                          ? '⚡ Moderate violations detected. Please maintain proper posture and focus.'
                          : '✓ Good monitoring behavior. Keep it up!'}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleStartNew}
            className="flex-1 py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors"
          >
            Start New Interview
          </button>

          <button
            onClick={() => window.print()}
            className="flex-1 py-4 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold text-lg transition-colors"
          >
            Print Feedback
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Thank you for using Interview Practice Partner!</p>
          <p className="mt-1">
            Keep practicing to improve your interview skills.
          </p>
        </div>
      </main>
    </div>
  );
}
