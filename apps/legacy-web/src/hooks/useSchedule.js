import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

/**
 * Hook for fetching schedule data
 */
export const useSchedule = (year, month, options = {}) => {
  return useQuery({
    queryKey: ['schedule', year, month],
    queryFn: async () => {
      const { data } = await api.get(`/schedules/v2/${year}/${month}`);
      return data;
    },
    enabled: !!year && !!month,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

/**
 * Hook for fetching shift templates
 */
export const useShiftTemplates = (options = {}) => {
  return useQuery({
    queryKey: ['shiftTemplates'],
    queryFn: async () => {
      const { data } = await api.get('/shift-templates');
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

/**
 * Hook for creating/updating schedule shifts
 */
export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ year, month, shifts }) => {
      const { data } = await api.post(`/schedules/v2/${year}/${month}`, { shifts });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['schedule', variables.year, variables.month]);
    },
  });
};

/**
 * Hook for fetching availability data
 */
export const useAvailability = (options = {}) => {
  return useQuery({
    queryKey: ['availability'],
    queryFn: async () => {
      const { data } = await api.get('/availability');
      return data;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook for creating availability
 */
export const useCreateAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/availability', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['availability']);
    },
  });
};
