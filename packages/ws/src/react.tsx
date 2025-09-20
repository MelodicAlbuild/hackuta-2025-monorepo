"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { WSClient, WsMessage } from "./client";

export type WSContextType = {
  readyState: 'CONNECTING' | 'OPEN' | 'CLOSED';
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  on: (prefix: string, handler: (msg: WsMessage) => void) => void;
  off: (prefix: string, handler: (msg: WsMessage) => void) => void;
  sendText: (channel: string, text: string) => void;
};

const WSContext = createContext<WSContextType | null>(null);

export function useWS() {
  const ctx = useContext(WSContext);
  if (!ctx) throw new Error('useWS must be used within WSProvider');
  return ctx;
}

export function WSProvider({ children }: { children: React.ReactNode }) {
  const [readyState, setReadyState] = useState<'CONNECTING'|'OPEN'|'CLOSED'>('CONNECTING');
  const baseUrl = useMemo(() => process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8090', []);
  const clientRef = useRef<WSClient | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  if (!clientRef.current) clientRef.current = new WSClient(baseUrl);

  useEffect(() => {
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
    return () => {
      client.close();
    };
  }, [baseUrl]);

  const subscribe = useCallback((ch: string) => clientRef.current!.subscribe(ch), []);
  const unsubscribe = useCallback((ch: string) => clientRef.current!.unsubscribe(ch), []);
  const on = useCallback((p: string, h: (m: WsMessage)=>void) => clientRef.current!.on(p,h), []);
  const off = useCallback((p: string, h: (m: WsMessage)=>void) => clientRef.current!.off(p,h), []);
  const sendText = useCallback((ch: string, text: string) => {
    clientRef.current!.send('broadcast', { channel: ch, event: 'new_message', data: { type: 'text', content: { text } } });
  }, []);

  const value = useMemo(() => ({ readyState, subscribe, unsubscribe, on, off, sendText }), [readyState, subscribe, unsubscribe, on, off, sendText]);
  return <WSContext.Provider value={value}>{children}</WSContext.Provider>;
}
