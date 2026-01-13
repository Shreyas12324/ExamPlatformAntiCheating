import VoicePlayer from './VoicePlayer';

export default function ChatBubble({ message, variant = 'user' }) {
  if (!message || !message.content) {
    return null;
  }

  const isUser = variant === 'user';
  const isAgent = variant === 'agent';
  const isSystem = variant === 'system';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[75%] rounded-lg p-4 shadow-sm ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-none'
            : isAgent
              ? 'bg-gray-100 text-gray-800 rounded-bl-none'
              : 'bg-yellow-50 text-yellow-900 border border-yellow-200'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold">
              {isUser ? 'You' : isAgent ? 'Agent' : 'System'}
            </span>
          </div>

          {/* Voice player for agent messages */}
          {isAgent && message.content && message.autoPlay !== undefined && (
            <VoicePlayer text={message.content} autoPlay={message.autoPlay} />
          )}
        </div>

        {/* Content */}
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </div>

        {/* Timestamp */}
        {message.timestamp && (
          <div
            className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        )}

        {/* Follow-up indicator */}
        {message.isFollowup && (
          <div className="mt-2 text-xs text-gray-500 italic">
            Follow-up question
          </div>
        )}
      </div>
    </div>
  );
}
