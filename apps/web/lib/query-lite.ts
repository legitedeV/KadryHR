import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type QueryKey = readonly unknown[];

function serializeKey(queryKey: QueryKey) {
  return JSON.stringify(queryKey);
}

type Listener = () => void;

export class QueryClient {
  private cache = new Map<string, unknown>();
  private listeners = new Map<string, Set<Listener>>();

  getQueryData<T>(queryKey: QueryKey): T | undefined {
    return this.cache.get(serializeKey(queryKey)) as T | undefined;
  }

  setQueryData<T>(queryKey: QueryKey, data: T) {
    const key = serializeKey(queryKey);
    this.cache.set(key, data);
    this.listeners.get(key)?.forEach((listener) => listener());
  }

  async fetchQuery<T>({ queryKey, queryFn }: { queryKey: QueryKey; queryFn: () => Promise<T>; }) {
    const data = await queryFn();
    this.setQueryData(queryKey, data);
    return data;
  }

  invalidateQueries({ queryKey }: { queryKey: QueryKey }) {
    const key = serializeKey(queryKey);
    this.listeners.get(key)?.forEach((listener) => listener());
  }

  subscribe(queryKey: QueryKey, listener: Listener) {
    const key = serializeKey(queryKey);
    const listeners = this.listeners.get(key) ?? new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(key, listeners);

    return () => {
      const current = this.listeners.get(key);
      if (current) {
        current.delete(listener);
        if (current.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }
}

const QueryClientContext = createContext<QueryClient | null>(null);

export function QueryClientProvider({ client, children }: { client: QueryClient; children: React.ReactNode; }) {
  return <QueryClientContext.Provider value={client}>{children}</QueryClientContext.Provider>;
}

export function useQueryClient() {
  const client = useContext(QueryClientContext);
  if (!client) {
    throw new Error("useQueryClient must be used within a QueryClientProvider");
  }
  return client;
}

export function useQuery<TData, TError = unknown>({ queryKey, queryFn, enabled = true, initialData, }: {
  queryKey: QueryKey;
  queryFn: () => Promise<TData>;
  enabled?: boolean;
  initialData?: TData;
}) {
  const client = useQueryClient();
  const stableKey = useMemo(() => serializeKey(queryKey), [queryKey]);
  const [state, setState] = useState<{ data?: TData; error?: TError; isPending: boolean; isFetching: boolean; }>(() => {
    const cached = client.getQueryData<TData>(queryKey) ?? initialData;
    return {
      data: cached,
      error: undefined,
      isPending: !cached,
      isFetching: false,
    };
  });

  useEffect(() => {
    if (!enabled) return;
    let isMounted = true;

    const fetchData = async () => {
      setState((prev) => ({ ...prev, isFetching: true, isPending: !prev.data }));
      try {
        const data = await client.fetchQuery({ queryKey, queryFn });
        if (isMounted) {
          setState({ data, error: undefined, isPending: false, isFetching: false });
        }
      } catch (error) {
        if (isMounted) {
          setState((prev) => ({ ...prev, error: error as TError, isPending: false, isFetching: false }));
        }
      }
    };

    fetchData();
    const unsubscribe = client.subscribe(queryKey, fetchData);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [client, stableKey, enabled, queryFn, queryKey]);

  return {
    data: state.data,
    error: state.error,
    isPending: state.isPending,
    isFetching: state.isFetching,
    refetch: () => client.invalidateQueries({ queryKey }),
  };
}

type MutationStatus = "idle" | "pending" | "success" | "error";

export function useMutation<TData, TError = unknown, TVariables = void, TContext = unknown>({
  mutationFn,
  onMutate,
  onError,
  onSuccess,
  onSettled,
}: {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
  onError?: (error: TError, variables: TVariables, context?: TContext) => void | Promise<void>;
  onSuccess?: (data: TData, variables: TVariables, context?: TContext) => void | Promise<void>;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context?: TContext) => void | Promise<void>;
}) {
  const [status, setStatus] = useState<MutationStatus>("idle");
  const [error, setError] = useState<TError | null>(null);
  const [data, setData] = useState<TData | undefined>(undefined);

  const mutateAsync = async (variables: TVariables) => {
    setStatus("pending");
    setError(null);
    let context: TContext | undefined;
    try {
      context = await onMutate?.(variables);
      const response = await mutationFn(variables);
      setData(response);
      setStatus("success");
      await onSuccess?.(response, variables, context);
      await onSettled?.(response, null, variables, context);
      return response;
    } catch (err) {
      setStatus("error");
      setError(err as TError);
      await onError?.(err as TError, variables, context);
      await onSettled?.(undefined, err as TError, variables, context);
      throw err;
    }
  };

  return {
    mutate: (variables: TVariables) => {
      mutateAsync(variables).catch(() => undefined);
    },
    mutateAsync,
    status,
    error,
    data,
    isPending: status === "pending",
    isSuccess: status === "success",
  };
}
