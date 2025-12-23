import React from 'react';

const ConversationList = ({ conversations, selectedConversation, onSelectConversation, currentUserId }) => {
  const getOtherParticipant = (conversation) => {
    return conversation.participants?.find(p => p._id !== currentUserId);
  };

  const getUnreadCount = (conversation) => {
    // This would need to be calculated based on messages
    return 0;
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 86400000) { // Less than 24 hours
      return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) { // Less than 7 days
      return d.toLocaleDateString('pl-PL', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Wiadomości
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
            <p>Brak konwersacji</p>
            <p className="text-sm mt-2">Rozpocznij nową rozmowę</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {conversations.map((conversation) => {
              const otherUser = getOtherParticipant(conversation);
              const unreadCount = getUnreadCount(conversation);
              const isSelected = selectedConversation?._id === conversation._id;

              return (
                <button
                  key={conversation._id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                    isSelected ? 'bg-slate-100 dark:bg-slate-700' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {otherUser?.avatarUrl ? (
                        <img
                          src={otherUser.avatarUrl}
                          alt={otherUser.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: 'var(--theme-primary)' }}
                        >
                          {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {otherUser?.name || 'Nieznany użytkownik'}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-2">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                          {conversation.lastMessage?.content || 'Brak wiadomości'}
                        </p>
                        {unreadCount > 0 && (
                          <span 
                            className="flex-shrink-0 ml-2 px-2 py-0.5 text-xs font-medium text-white rounded-full"
                            style={{ backgroundColor: 'var(--theme-primary)' }}
                          >
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
