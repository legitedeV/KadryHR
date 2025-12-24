import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

/**
 * Hook for fetching time tracking entries
 */
export const useTimeTracking = (options = {}) => {
  return useQuery({
    queryKey: ['timeTracking'],
    queryFn: async () => {
      const { data } = await api.get('/time-tracking');
      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute - time tracking should be relatively fresh
    cacheTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook for fetching active session
 */
export const useActiveSession = (options = {}) => {
  return useQuery({
    queryKey: ['activeSession'],
    queryFn: async () => {
      const { data } = await api.get('/time-tracking/active');
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30000,
    ...options,
  });
};

/**
 * Hook for starting a time tracking session
 */
export const useStartSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/time-tracking/start', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['timeTracking']);
      queryClient.invalidateQueries(['activeSession']);
    },
  });
};

/**
 * Hook for stopping a time tracking session
 */
export const useStopSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId) => {
      const { data } = await api.post(`/time-tracking/${sessionId}/stop`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['timeTracking']);
      queryClient.invalidateQueries(['activeSession']);
    },
  });
};
