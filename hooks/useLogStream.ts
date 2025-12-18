/**
 * useLogStream - SSE-based real-time log streaming for RunnerPanel
 *
 * Features:
 * - Server-Sent Events for real-time log updates
 * - Automatic reconnection on disconnect
 * - Status tracking (connected/disconnected)
 * - Initial log catch-up on connect
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export interface LogEntry {
  entry: string;
  isError: boolean;
  timestamp: number;
}

interface UseLogStreamOptions {
  projectId: string | null;
  enabled: boolean;
  onStatusChange?: (status: string) => void;
}

interface UseLogStreamReturn {
  logs: string[];
  connected: boolean;
  status: string;
  clearLogs: () => void;
}

export function useLogStream({
  projectId,
  enabled,
  onStatusChange
}: UseLogStreamOptions): UseLogStreamReturn {
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string>('stopped');
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    if (!projectId || !enabled) {
      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setConnected(false);
      return;
    }

    // Create SSE connection
    const connect = () => {
      const es = new EventSource(`/api/runner/${projectId}/logs/stream`);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnected(true);
        console.log('[LogStream] Connected');
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'init':
              // Initial catch-up logs
              setLogs(data.logs || []);
              if (data.status) {
                setStatus(data.status);
                onStatusChange?.(data.status);
              }
              break;

            case 'log':
              // New log entry
              setLogs(prev => [...prev, data.entry]);
              break;

            case 'status':
              // Status change
              setStatus(data.status);
              onStatusChange?.(data.status);

              // If stopped, close connection
              if (data.status === 'stopped') {
                es.close();
                setConnected(false);
              }
              break;
          }
        } catch (err) {
          console.error('[LogStream] Failed to parse message:', err);
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();

        // Try to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (enabled && projectId) {
            console.log('[LogStream] Reconnecting...');
            connect();
          }
        }, 3000);
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setConnected(false);
    };
  }, [projectId, enabled, onStatusChange]);

  return {
    logs,
    connected,
    status,
    clearLogs
  };
}

export default useLogStream;
