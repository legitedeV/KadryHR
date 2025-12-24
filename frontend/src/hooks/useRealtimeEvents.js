import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook for subscribing to realtime Server-Sent Events (SSE)
 * Automatically invalidates React Query caches when events are received
 */
export const useRealtimeEvents = (token) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const eventSourceRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      return;
    }

    // Create EventSource connection
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const url = `${baseUrl}/api/realtime/events`;

    console.log('[SSE] Connecting to realtime events:', url);

    const eventSource = new EventSource(url, {
      withCredentials: true,
    });

    eventSourceRef.current = eventSource;

    // Connection opened
    eventSource.onopen = () => {
      console.log('[SSE] Connected to realtime events');
      setIsConnected(true);
    };

    // Handle incoming messages
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE] Received event:', data);

        setLastEvent(data);

        // Handle different event types
        switch (data.type) {
          case 'connected':
            console.log('[SSE] Connection confirmed for user:', data.userId);
            break;

          case 'notification':
            // Invalidate notifications cache
            queryClient.invalidateQueries(['notifications']);
            break;

          case 'message':
            // Invalidate conversations and messages cache
            queryClient.invalidateQueries(['conversations']);
            if (data.data?.conversationId) {
              queryClient.invalidateQueries(['messages', data.data.conversationId]);
            }
            break;

          case 'task':
            // Invalidate tasks cache (if tasks module exists)
            queryClient.invalidateQueries(['tasks']);
            break;

          case 'leave':
            // Invalidate leaves cache
            queryClient.invalidateQueries(['leaves']);
            break;

          case 'schedule':
            // Invalidate schedule cache
            queryClient.invalidateQueries(['schedule']);
            break;

          default:
            console.log('[SSE] Unknown event type:', data.type);
        }
      } catch (err) {
        console.error('[SSE] Error parsing event data:', err);
      }
    };

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      setIsConnected(false);

      // EventSource will automatically try to reconnect
      // Close and cleanup will happen in the cleanup function
    };

    // Cleanup on unmount
    return () => {
      console.log('[SSE] Disconnecting from realtime events');
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [token, queryClient]);

  return {
    isConnected,
    lastEvent,
  };
};

export default useRealtimeEvents;
