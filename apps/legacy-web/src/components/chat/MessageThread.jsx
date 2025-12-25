import React, { useEffect, useRef } from 'react';

const MessageThread = ({ messages, currentUserId, loading }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Dziś';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Wczoraj';
    } else {
      return d.toLocaleDateString('pl-PL', { 
        day: 'numeric', 
        month: 'long', 
        year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
      });
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2"
               style={{ borderColor: 'var(--theme-primary)' }}></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ładowanie wiadomości...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-slate-500 dark:text-slate-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p>Brak wiadomości</p>
          <p className="text-sm mt-2">Wyślij pierwszą wiadomość</p>
        </div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {Object.entries(groupedMessages).map(([date, msgs]) => (
        <div key={date}>
          <div className="flex items-center justify-center my-4">
            <div className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-400">
              {formatDate(msgs[0].createdAt)}
            </div>
          </div>
          
          {msgs.map((message, index) => {
            const isOwn = message.sender._id === currentUserId;
            const showAvatar = index === 0 || msgs[index - 1].sender._id !== message.sender._id;

            return (
              <div
                key={message._id}
                className={`flex items-end gap-2 mb-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!isOwn && (
                  <div className="flex-shrink-0 w-8 h-8">
                    {showAvatar && (
                      message.sender.avatarUrl ? (
                        <img
                          src={message.sender.avatarUrl}
                          alt={message.sender.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                          style={{ backgroundColor: 'var(--theme-primary)' }}
                        >
                          {message.sender.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )
                    )}
                  </div>
                )}

                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  {!isOwn && showAvatar && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 px-3">
                      {message.sender.name}
                    </span>
                  )}
                  
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                    }`}
                    style={isOwn ? {
                      background: `linear-gradient(to bottom right, var(--theme-primary), var(--theme-secondary))`
                    } : {}}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                  
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 px-3">
                    {formatTime(message.createdAt)}
                  </span>
                </div>

                {isOwn && <div className="w-8" />}
              </div>
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageThread;
