export default function Header({
  userName,
  role,
  persona,
  onEndInterview,
  loading,
}) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left - Brand */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">
            Interview Practice Partner
          </h1>
          <div className="hidden md:flex items-center space-x-2 text-sm">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
              {role}
            </span>
            {persona !== 'Adaptive' && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                {persona}
              </span>
            )}
          </div>
        </div>

        {/* Right - User & Actions */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-700">{userName}</p>
          </div>

          {/* End Interview Button */}
          <button
            onClick={onEndInterview}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ending...' : 'End Interview'}
          </button>
        </div>
      </div>

      {/* Mobile Role/Persona */}
      <div className="md:hidden px-4 pb-3 flex items-center space-x-2">
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
          {role}
        </span>
        {persona !== 'Adaptive' && (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
            {persona}
          </span>
        )}
      </div>
    </header>
  );
}
