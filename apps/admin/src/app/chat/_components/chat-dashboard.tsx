'use client';

import { useEffect, useState, useRef } from 'react';
import { createSupabaseBrowserClient } from '@repo/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useWS } from '@repo/ws';
import type { WsMessage } from '@repo/ws';

export function ChatDashboard() {
  const supabase = createSupabaseBrowserClient();
  const { subscribe, on, off, sendText, send } = useWS();
  const activeThreadRef = useRef<string | null>(null);

  const [threads, setThreads] = useState<
    {
      id: string;
      last_message_at: string;
      last_message_preview?: string | null;
    }[]
  >([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    { text: string; senderId?: string; ts?: string }[]
  >([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: th } = await supabase
        .from('chat_threads')
        .select('id, last_message_at, last_message_preview')
        .order('last_message_at', { ascending: false })
        .limit(50);
      setThreads(th || []);
    };
    load();
  }, [supabase]);

  useEffect(() => {
    if (!activeThread) return;
    activeThreadRef.current = activeThread;
    const ch = `chat.${activeThread}`;
    subscribe(ch);

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('created_at, content, sender_id')
        .eq('thread_id', activeThread)
        .order('created_at', { ascending: true })
        .limit(100);
      if (data) {
        type Row = { created_at: string; content: unknown; sender_id: string };
        const cleaned = (data as Row[]).map((m) => {
          const content = (m.content as { text?: string }) || {};
          return {
            text: content.text ?? JSON.stringify(m.content),
            senderId: m.sender_id,
            ts: m.created_at,
          };
        });
        setMessages(cleaned);
      }
    };
    fetchMessages();

    const handler = (msg: WsMessage) => {
      const evt = msg as {
        event?: string;
        data?: unknown;
        sender?: { id?: string };
        timestamp?: string;
      };
      if (
        evt.event === 'new_message' &&
        evt.data &&
        typeof evt.data === 'object'
      ) {
        const d = evt.data as { type?: string; content?: { text?: string } };
        if (d.type === 'text' && d.content && typeof d.content === 'object') {
          const contentObj = d.content as { text?: string };
          if (!contentObj.text) return;
          setMessages((prev) => [
            ...prev,
            {
              text: contentObj.text!,
              senderId: evt.sender?.id,
              ts: evt.timestamp,
            },
          ]);
        }
      }
    };
    on(ch, handler);
    return () => {
      off(ch, handler);
    };
  }, [activeThread, supabase, subscribe, on, off]);

  const onSend = () => {
    if (!activeThread || !draft.trim()) return;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('chat_messages').insert({
        thread_id: activeThread,
        sender_id: user.id,
        type: 'text',
        content: { text: draft.trim() },
      });
      await supabase
        .from('chat_threads')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: draft.trim(),
        })
        .eq('id', activeThread);
      sendText(`chat.${activeThread}`, draft.trim());
    })();
    setDraft('');
  };

  const requestSuperAdmin = async () => {
    if (!activeThread) return;
    const reason = window.prompt('Describe the issue (optional):') || '';
    await supabase.rpc('escalate_chat', { thread_id: activeThread, reason });
    const { data: supers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'super-admin');
    const title = 'Chat Escalation Requested';
    const message = `Thread ${activeThread} has been escalated.${reason ? ` Reason: ${reason}` : ''}`;
    const createdAt = new Date().toISOString();
    supers?.forEach((u) => {
      send('broadcast', {
        channel: `user.${u.id}`,
        event: 'notification',
        data: {
          id: Math.floor(Date.now() / 1000),
          created_at: createdAt,
          title,
          message,
          target_user_id: u.id,
        },
      });
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="border rounded p-3">
        <h2 className="font-semibold mb-2">Open chats</h2>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {threads.map((t) => (
            <div
              key={t.id}
              className={`p-2 border rounded cursor-pointer ${activeThread === t.id ? 'bg-accent' : ''}`}
              onClick={() => {
                setActiveThread(t.id);
                setOpen(true);
              }}
            >
              <div className="text-xs text-muted-foreground">
                {new Date(t.last_message_at).toLocaleString()}
              </div>
              <div className="font-medium">{t.id}</div>
              <div className="text-sm truncate">
                {t.last_message_preview || ''}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="md:col-span-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thread {activeThread}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto border p-3 rounded">
              {messages.map((m, i) => (
                <div key={i} className="text-sm">
                  <span className="font-semibold mr-2">
                    {m.senderId?.slice(0, 6) ?? 'admin'}:
                  </span>
                  <span>{m.text}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a reply..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSend();
                }}
              />
              <Button onClick={onSend}>Send</Button>
              <Button variant="secondary" onClick={requestSuperAdmin}>
                Request Super Admin
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
