'use client';

import { useEffect, useRef, useState } from 'react';
import { useWS } from '@repo/ws';
import type { WsMessage } from '@repo/ws';
import { createSupabaseBrowserClient } from '@repo/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function ChatWidget() {
  const { subscribe, sendText, on } = useWS();
  const supabase = createSupabaseBrowserClient();
  const [open, setOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  type ChatItem = { id?: string; text: string; senderId?: string; ts?: string };
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const tId = user.id; // one thread per user
      setThreadId(tId);
      // ensure thread exists
      await supabase
        .from('chat_threads')
        .upsert({ id: tId, created_by: user.id })
        .select();
      subscribe(`chat.${tId}`);

      // Load last 50 messages from Supabase
      const { data } = await supabase
        .from('chat_messages')
        .select('created_at, content, sender_id')
        .eq('thread_id', tId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (data) {
        type Row = { created_at: string; content: unknown; sender_id: string };
        const cleaned: ChatItem[] = (data as Row[]).map((m) => {
          const content = (m.content as { text?: string }) || {};
          return {
            text: content.text ?? JSON.stringify(m.content),
            senderId: m.sender_id,
            ts: m.created_at,
          };
        });
        setMessages(cleaned);
      }

      // Listen for live messages on this channel
      on(`chat.${tId}`, (msg: WsMessage) => {
        try {
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
            const d = evt.data as {
              type?: string;
              content?: { text?: string };
            };
            if (
              d.type === 'text' &&
              d.content &&
              typeof d.content === 'object'
            ) {
              const contentObj = d.content as { text?: string };
              if (!contentObj.text) return;
              const text = contentObj.text || '';
              setMessages((prev: ChatItem[]) => [
                ...prev,
                { text, senderId: evt.sender?.id, ts: evt.timestamp },
              ]);
            }
          }
        } catch {}
      });
    };
    init();
  }, [subscribe, on, supabase]);

  const send = () => {
    (async () => {
      if (!threadId) return;
      const val = inputRef.current?.value?.trim();
      if (!val) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('chat_messages').insert({
        thread_id: threadId,
        sender_id: user.id,
        type: 'text',
        content: { text: val },
      });
      await supabase
        .from('chat_threads')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: val,
        })
        .eq('id', threadId);
      sendText(`chat.${threadId}`, val);
      if (inputRef.current) inputRef.current.value = '';
    })();
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 rounded-full shadow-lg"
      >
        Chat with an admin
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chat with an admin</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 max-h-80 overflow-y-auto border p-3 rounded">
            {messages.map((m, i) => (
              <div key={i} className="text-sm">
                <span className="font-semibold mr-2">
                  {m.senderId?.slice(0, 6) ?? 'you'}:
                </span>
                <span>{m.text}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Type your message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
            />
            <Button onClick={send}>Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
