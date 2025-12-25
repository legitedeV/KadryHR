import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

/**
 * Hook for fetching employees list with caching
 */
export const useEmployees = (options = {}) => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await api.get('/employees');
      return data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

/**
 * Hook for fetching a single employee
 */
export const useEmployee = (id, options = {}) => {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const { data } = await api.get(`/employees/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook for creating an employee
 */
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/employees', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
    },
  });
};

/**
 * Hook for updating an employee
 */
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put(`/employees/${id}`, payload);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['employees']);
      queryClient.invalidateQueries(['employee', variables.id]);
    },
  });
};

/**
 * Hook for deleting an employee
 */
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/employees/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
    },
  });
};
