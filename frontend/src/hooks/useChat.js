import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

/**
 * Hook for fetching conversations
 */
export const useConversations = (options = {}) => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/chat/conversations');
      return data.conversations || [];
    },
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000,
    refetchInterval: 30000, // Refetch every 30 seconds
    ...options,
  });
};

/**
 * Hook for fetching messages in a conversation
 */
export const useMessages = (conversationId, options = {}) => {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data } = await api.get(`/chat/conversations/${conversationId}/messages`);
      return data.messages || [];
    },
    enabled: !!conversationId,
    staleTime: 10 * 1000, // 10 seconds
    ...options,
  });
};

/**
 * Hook for sending a message
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content }) => {
      const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, { content });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['messages', variables.conversationId]);
      queryClient.invalidateQueries(['conversations']);
    },
  });
};

/**
 * Hook for creating a conversation
 */
export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participantIds) => {
      const { data } = await api.post('/chat/conversations', { participantIds });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations']);
    },
  });
};

/**
 * Hook for marking messages as read
 */
export const useMarkMessagesAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId) => {
      await api.post(`/chat/conversations/${conversationId}/read`);
    },
    onSuccess: (data, conversationId) => {
      queryClient.invalidateQueries(['messages', conversationId]);
      queryClient.invalidateQueries(['conversations']);
    },
  });
};
