import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import ConversationList from '../components/chat/ConversationList';
import MessageThread from '../components/chat/MessageThread';
import MessageInput from '../components/chat/MessageInput';
import Alert from '../components/Alert';

const Chat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [error, setError] = useState(null);
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  const { socket, isConnected, emit, on, off } = useSocket(token);

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/chat/conversations');
      return data.conversations || [];
    }
  });

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation?._id],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const { data } = await api.get(`/chat/conversations/${selectedConversation._id}/messages`);
      return data.messages || [];
    },
    enabled: !!selectedConversation
  });

  // Fetch users for new chat
  const { data: usersData } = useQuery({
    queryKey: ['chat-users'],
    queryFn: async () => {
      const { data } = await api.get('/chat/users');
      return data.users || [];
    },
    enabled: showNewChat
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }) => {
      const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, { content });
      return data.message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedConversation?._id]);
      queryClient.invalidateQueries(['conversations']);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się wysłać wiadomości');
    }
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (participantId) => {
      const { data } = await api.post('/chat/conversations', { participantId });
      return data.conversation;
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries(['conversations']);
      setSelectedConversation(conversation);
      setShowNewChat(false);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nie udało się utworzyć konwersacji');
    }
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId) => {
      await api.put(`/chat/conversations/${conversationId}/read`);
    }
  });

  // Socket.IO event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = ({ message, conversationId }) => {
      if (selectedConversation?._id === conversationId) {
        queryClient.invalidateQueries(['messages', conversationId]);
        markAsReadMutation.mutate(conversationId);
      }
      queryClient.invalidateQueries(['conversations']);
    };

    const handleConversationUpdated = () => {
      queryClient.invalidateQueries(['conversations']);
    };

    on('new_message', handleNewMessage);
    on('conversation_updated', handleConversationUpdated);

    return () => {
      off('new_message', handleNewMessage);
      off('conversation_updated', handleConversationUpdated);
    };
  }, [socket, isConnected, selectedConversation, queryClient]);

  // Join conversation room when selected
  useEffect(() => {
    if (socket && isConnected && selectedConversation) {
      emit('join_conversation', selectedConversation._id);
      markAsReadMutation.mutate(selectedConversation._id);

      return () => {
        emit('leave_conversation', selectedConversation._id);
      };
    }
  }, [socket, isConnected, selectedConversation]);

  const handleSendMessage = (content) => {
    if (selectedConversation) {
      sendMessageMutation.mutate({
        conversationId: selectedConversation._id,
        content
      });
    }
  };

  const handleSelectUser = (userId) => {
    createConversationMutation.mutate(userId);
  };

  const getOtherParticipant = (conversation) => {
    return conversation?.participants?.find(p => p._id !== user?.id);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex animate-fade-in">
      {/* Conversations List */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Wiadomości
          </h2>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            style={{ color: 'var(--theme-primary)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {showNewChat ? (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <button
                onClick={() => setShowNewChat(false)}
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Powrót
              </button>
            </div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
              Wybierz użytkownika
            </h3>
            <div className="space-y-2">
              {usersData?.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleSelectUser(user._id)}
                  className="w-full p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: 'var(--theme-primary)' }}
                    >
                      {user.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ConversationList
            conversations={conversationsData || []}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
            currentUserId={user?.id}
          />
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center gap-3">
                {getOtherParticipant(selectedConversation)?.avatarUrl ? (
                  <img
                    src={getOtherParticipant(selectedConversation).avatarUrl}
                    alt={getOtherParticipant(selectedConversation).name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: 'var(--theme-primary)' }}
                  >
                    {getOtherParticipant(selectedConversation)?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {getOtherParticipant(selectedConversation)?.name || 'Nieznany użytkownik'}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isConnected ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <MessageThread
              messages={messagesData || []}
              currentUserId={user?.id}
              loading={messagesLoading}
            />

            {/* Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              disabled={sendMessageMutation.isLoading}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-500 dark:text-slate-400">
              <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg font-medium">Wybierz konwersację</p>
              <p className="text-sm mt-2">lub rozpocznij nową rozmowę</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert type="error" message={error} onClose={() => setError(null)} />
        </div>
      )}
    </div>
  );
};

export default Chat;
