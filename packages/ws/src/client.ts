import { createSupabaseBrowserClient } from "@repo/supabase/client";

export type WsMessage = { channel: string; event?: string; data?: unknown;[k: string]: unknown };

export class WSClient {
  private socket: WebSocket | null = null;
  private supabase = createSupabaseBrowserClient();
  private listeners = new Map<string, Set<(msg: WsMessage) => void>>();
  private pendingSubs = new Set<string>();

  constructor(private baseUrl: string) { }

  async connect() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) return; // caller may retry on auth change
    this.socket = new WebSocket(`${this.baseUrl}?token=${session.access_token}`);
    this.socket.onopen = () => {
      // flush pending subscriptions
      this.pendingSubs.forEach((ch) => this.send('subscribe', { channel: ch }));
    };
    this.socket.onmessage = (evt) => {
      const msg = JSON.parse(evt.data) as WsMessage;
      const ch = (msg && msg.channel) || '';
      this.listeners.forEach((handlers, prefix) => {
        if (ch.startsWith(prefix)) handlers.forEach((h) => h(msg));
      });
    };
  }

  close() { this.socket?.close(); }

  async onAuthChangeReconnect() {
    this.supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        this.close();
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this.close();
        await this.connect();
        // re-subscribe
        this.pendingSubs.forEach((ch) => this.send('subscribe', { channel: ch }));
      }
    });
  }

  send(type: string, payload: object) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    }
  }

  subscribe(channel: string) {
    this.pendingSubs.add(channel);
    this.send('subscribe', { channel });
  }

  unsubscribe(channel: string) {
    this.pendingSubs.delete(channel);
    this.send('unsubscribe', { channel });
  }

  on(prefix: string, handler: (msg: WsMessage) => void) {
    if (!this.listeners.has(prefix)) this.listeners.set(prefix, new Set());
    this.listeners.get(prefix)!.add(handler);
  }

  off(prefix: string, handler: (msg: WsMessage) => void) {
    this.listeners.get(prefix)?.delete(handler);
  }
}
