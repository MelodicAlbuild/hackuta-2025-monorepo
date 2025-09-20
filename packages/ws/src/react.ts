"use client";
import * as React from 'react';
import { WSClient, WsMessage } from './client';

export type WSContextType = {
  readyState: 'CONNECTING' | 'OPEN' | 'CLOSED';
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  on: (prefix: string, handler: (msg: WsMessage) => void) => void;
  off: (prefix: string, handler: (msg: WsMessage) => void) => void;
  send: (type: string, payload: object) => void;
  sendText: (channel: string, text: string) => void;
};

const WSContext = React.createContext<WSContextType | null>(null);
export function useWS() {
  const ctx = React.useContext(WSContext);
  if (!ctx) throw new Error('useWS must be used within WSProvider');
  return ctx;
}

export function WSProvider({ children, baseUrl }: { children: React.ReactNode; baseUrl: string }) {
  const [readyState, setReadyState] = React.useState<'CONNECTING' | 'OPEN' | 'CLOSED'>('CONNECTING');
  const clientRef = React.useRef<WSClient | null>(null);
  const socketRef = React.useRef<WebSocket | null>(null);
  if (!clientRef.current) clientRef.current = new WSClient(baseUrl);

  React.useEffect(() => {
    const client = clientRef.current!;
    client.connect().then(() => {
      const sock = (client as any).socket as WebSocket | null;
      socketRef.current = sock;
      if (!sock) {
        setReadyState('CLOSED');
        return;
      }
      setReadyState(sock.readyState === WebSocket.OPEN ? 'OPEN' : 'CONNECTING');
      sock.onopen = () => setReadyState('OPEN');
      sock.onclose = () => setReadyState('CLOSED');
    });
    client.onAuthChangeReconnect();
    return () => { client.close(); };
  }, [baseUrl]);

  const subscribe = React.useCallback((ch: string) => clientRef.current!.subscribe(ch), []);
  const unsubscribe = React.useCallback((ch: string) => clientRef.current!.unsubscribe(ch), []);
  const on = React.useCallback((p: string, h: (m: WsMessage)=>void) => clientRef.current!.on(p,h), []);
  const off = React.useCallback((p: string, h: (m: WsMessage)=>void) => clientRef.current!.off(p,h), []);
  const send = React.useCallback((type: string, payload: object) => clientRef.current!.send(type, payload), []);
  const sendText = React.useCallback((ch: string, text: string) => {
    clientRef.current!.send('broadcast', { channel: ch, event: 'new_message', data: { type: 'text', content: { text } } });
  }, []);

  const value = React.useMemo(() => ({ readyState, subscribe, unsubscribe, on, off, send, sendText }), [readyState, subscribe, unsubscribe, on, off, send, sendText]);
  return React.createElement(WSContext.Provider, { value }, children);
}
