import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

/**
 * Hook for fetching leave requests
 */
export const useLeaves = (options = {}) => {
  return useQuery({
    queryKey: ['leaves'],
    queryFn: async () => {
      const { data } = await api.get('/leaves');
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook for fetching sick leaves
 */
export const useSickLeaves = (options = {}) => {
  return useQuery({
    queryKey: ['sickLeaves'],
    queryFn: async () => {
      const { data } = await api.get('/sick-leaves');
      return data;
    },
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook for creating a leave request
 */
export const useCreateLeave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/leaves', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leaves']);
    },
  });
};

/**
 * Hook for updating leave status (admin)
 */
export const useUpdateLeaveStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch(`/leaves/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leaves']);
    },
  });
};

/**
 * Hook for deleting a leave request
 */
export const useDeleteLeave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/leaves/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leaves']);
    },
  });
};
