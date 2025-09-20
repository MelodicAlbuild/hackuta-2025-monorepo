'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChatMessage, AdminUpdate, WebSocketContextType } from './types';

// Initialize the Supabase client (replace with your actual client setup)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Create the context with a null default value
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Custom hook to use the WebSocket context
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Define the provider's props
interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [readyState, setReadyState] = useState<
    'CONNECTING' | 'OPEN' | 'CLOSED'
  >('CONNECTING');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [adminUpdates, setAdminUpdates] = useState<AdminUpdate[]>([]);

  const ws = useRef<WebSocket | null>(null);
  const subscriptions = useRef<Set<string>>(new Set());
  const listeners = useRef<Map<string, Set<(msg: unknown) => void>>>(new Map());

  const sendMessage = useCallback((type: string, payload: object) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  useEffect(() => {
    const connect = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.error('WebSocket: No Supabase session found.');
        setReadyState('CLOSED');
        return;
      }

      // Establish connection
      const wsBase = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8090';
      const socket = new WebSocket(`${wsBase}?token=${session.access_token}`);
      ws.current = socket;

      socket.onopen = async () => {
        console.log('WebSocket Connected');
        setReadyState('OPEN');
        // Auto-subscribe to user notifications channel
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (userId) {
          const notifChannel = `user.${userId}`;
          subscriptions.current.add(notifChannel);
          sendMessage('subscribe', { channel: notifChannel });
        }
        // Re-subscribe to any channels if connection was lost and re-established
        subscriptions.current.forEach((channel) => {
          sendMessage('subscribe', { channel });
        });
      };

      socket.onclose = () => {
        console.log('WebSocket Disconnected');
        setReadyState('CLOSED');
      };

      socket.onerror = (err) => {
        console.error('WebSocket Error:', err);
        socket.close(); // This will trigger onclose
      };

      // This is the central message router
      socket.onmessage = (event: MessageEvent) => {
        const message = JSON.parse(event.data);
        const { channel, data } = message;

        console.log('Received message:', message);

        // Route message based on its event type or channel
        if (channel?.startsWith('chat.')) {
          setChatMessages((prev) => [...prev, data as ChatMessage]);
        } else if (channel?.startsWith('admin.')) {
          setAdminUpdates((prev) => [data as AdminUpdate, ...prev]);
        } else if (channel) {
          // Notify any listeners registered for this channel prefix
          listeners.current.forEach((handlers, prefix) => {
            if (channel.startsWith(prefix)) {
              handlers.forEach((h) => h(message));
            }
          });
        } else {
          console.warn('Unhandled message:', message);
        }
      };
    };

    connect();

    // Cleanup on component unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [sendMessage]);

  // Specific function for subscribing
  const subscribe = useCallback(
    (channel: string) => {
      if (!subscriptions.current.has(channel)) {
        sendMessage('subscribe', { channel });
        subscriptions.current.add(channel);
      }
    },
    [sendMessage],
  );

  // Specific function for unsubscribing
  const unsubscribe = useCallback(
    (channel: string) => {
      if (subscriptions.current.has(channel)) {
        sendMessage('unsubscribe', { channel });
        subscriptions.current.delete(channel);
      }
    },
    [sendMessage],
  );

  const onChannelMessage = useCallback((prefix: string, handler: (message: unknown) => void) => {
    if (!listeners.current.has(prefix)) listeners.current.set(prefix, new Set());
    listeners.current.get(prefix)!.add(handler);
  }, []);

  const offChannelMessage = useCallback((prefix: string, handler: (message: unknown) => void) => {
    listeners.current.get(prefix)?.delete(handler);
  }, []);

  // Specific function for sending text messages
  const sendTextMessage = useCallback(
    (channel: string, text: string, replyToMessageId?: string) => {
      sendMessage('broadcast', {
        channel,
        event: 'new_message',
        data: {
          type: 'text',
          content: { text },
          replyToMessageId,
        },
      });
    },
    [sendMessage],
  );

  // Specific function for sending image messages
  const sendImageMessage = useCallback(
    (channel: string, url: string, caption?: string) => {
      sendMessage('broadcast', {
        channel,
        event: 'new_message',
        data: {
          type: 'image',
          content: { url, caption },
        },
      });
    },
    [sendMessage],
  );

  // Specific function for sending reactions
  const sendReaction = useCallback(
    (channel: string, emoji: string, reactsToMessageId: string) => {
      sendMessage('broadcast', {
        channel,
        event: 'new_message',
        data: {
          type: 'reaction',
          content: { emoji, reactsToMessageId },
        },
      });
    },
    [sendMessage],
  );

  // The value provided to consuming components
  const value: WebSocketContextType = {
    readyState,
    chatMessages,
    adminUpdates,
    subscribe,
    unsubscribe,
    onChannelMessage,
    offChannelMessage,
    sendTextMessage,
    sendImageMessage,
    sendReaction,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
