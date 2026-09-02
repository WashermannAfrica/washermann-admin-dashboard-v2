'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Headset, Send, ArrowLeft, Search as SearchIcon, CheckCheck } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { Tabs } from '@/components/ui/Tabs';
import { Chip, statusTone } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { useAuthStore } from '@/store/auth.store';
import { formatDateTime } from '@/lib/utils';
import type { ApiResponse, Paginated } from '@/types';
import type { SupportConversation, SupportMessage } from '@/types/ops';

const TABS = ['Open', 'Pending', 'Closed', 'All'];
const socketOrigin = () => (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/api\/v\d+\/?$/, '');

export default function SupportPage() {
  const [convos, setConvos] = useState<SupportConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Open');
  const [search, setSearch] = useState('');

  const [activeId, setActiveId] = useState<string | null>(null);
  const [active, setActive] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  const loadInbox = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ limit: '50' });
    if (tab !== 'All') p.set('status', tab.toLowerCase());
    if (search) p.set('search', search);
    api
      .get<Paginated<SupportConversation>>(`/support/conversations?${p.toString()}`)
      .then((res) => setConvos(res.data.data))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, [tab, search]);

  useEffect(loadInbox, [loadInbox]);

  // ── Socket: live inbox + thread updates ────────────────────────────────────
  useEffect(() => {
    const origin = socketOrigin();
    if (!origin) return;
    const token = useAuthStore.getState().accessToken;
    const socket = io(`${origin}/support`, { transports: ['websocket'], auth: { token } });
    socketRef.current = socket;

    socket.on('message:new', ({ conversationId, message }: { conversationId: string; message: SupportMessage }) => {
      if (conversationId === activeIdRef.current) {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      }
      loadInbox();
    });
    socket.on('conversation:updated', () => loadInbox());

    return () => { socket.disconnect(); socketRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function openThread(id: string) {
    setActiveId(id);
    setThreadLoading(true);
    setMessages([]);
    socketRef.current?.emit('conversation:open', { conversationId: id });
    api
      .get<ApiResponse<{ conversation: SupportConversation; messages: SupportMessage[] }>>(`/support/conversations/${id}`)
      .then((res) => { setActive(res.data.data.conversation); setMessages(res.data.data.messages); })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setThreadLoading(false));
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;
    setSending(true);
    try {
      const res = await api.post<ApiResponse<SupportMessage>>(`/support/conversations/${activeId}/messages`, { body: draft.trim() });
      setMessages((prev) => (prev.some((m) => m.id === res.data.data.id) ? prev : [...prev, res.data.data]));
      setDraft('');
      loadInbox();
    } catch (err) { setError(apiErr(err)); } finally { setSending(false); }
  }

  async function setStatus(status: 'open' | 'pending' | 'closed') {
    if (!activeId) return;
    try {
      await api.patch(`/support/conversations/${activeId}`, { status, assignToMe: true });
      openThread(activeId);
      loadInbox();
    } catch (err) { setError(apiErr(err)); }
  }

  const name = (c?: SupportConversation | null) => c?.user?.fullName || 'Unknown user';

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-deep text-white"><Headset size={16} /></span>
        <div><h1 className="text-lg font-bold text-ink">Live Support</h1><p className="text-xs text-faint">Chat with customers, washermen and reps</p></div>
      </div>

      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* Inbox */}
        <Section className={active ? 'hidden lg:block' : ''}>
          <div className="space-y-3">
            <div className="relative">
              <SearchIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people"
                className="h-9 w-full rounded-full border border-line bg-white pl-9 pr-3 text-[13px] placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <Tabs tabs={TABS} active={tab} onChange={setTab} />
            <div className="max-h-[62vh] divide-y divide-line overflow-y-auto rounded-2xl bg-white">
              {loading ? (
                <div className="flex justify-center py-12 text-primary"><Spinner /></div>
              ) : convos.length === 0 ? (
                <p className="py-12 text-center text-sm text-faint">No conversations.</p>
              ) : convos.map((c) => (
                <button key={c.id} onClick={() => openThread(c.id)}
                  className={`flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-section ${activeId === c.id ? 'bg-section' : ''}`}>
                  <Avatar name={name(c)} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-ink">{name(c)}</span>
                      {c.unreadForAgent > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white">{c.unreadForAgent}</span>}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5">
                      <span className="rounded bg-section px-1.5 py-0.5 text-[10px] uppercase text-faint">{c.userRole}</span>
                      <span className="truncate text-xs text-faint">{c.lastMessagePreview ?? 'No messages yet'}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Thread */}
        <Section className={!active ? 'hidden lg:block' : ''}>
          {!active ? (
            <div className="flex h-[70vh] flex-col items-center justify-center text-center text-faint">
              <Headset size={32} className="mb-2 opacity-40" />
              <p className="text-sm">Select a conversation to reply</p>
            </div>
          ) : (
            <div className="flex h-[70vh] flex-col">
              {/* header */}
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2.5">
                  <button onClick={() => { setActive(null); setActiveId(null); }} className="lg:hidden"><ArrowLeft size={18} /></button>
                  <Avatar name={name(active)} size={34} />
                  <div>
                    <p className="text-sm font-bold text-ink">{name(active)}</p>
                    <p className="text-xs text-faint">{active.user?.email ?? active.user?.phone ?? active.userRole}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Chip tone={statusTone(active.status)}>{active.status}</Chip>
                  {active.status !== 'closed'
                    ? <Button size="sm" variant="outline" onClick={() => setStatus('closed')}>Close</Button>
                    : <Button size="sm" variant="outline" onClick={() => setStatus('open')}>Reopen</Button>}
                </div>
              </div>

              {/* messages */}
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto py-4">
                {threadLoading ? (
                  <div className="flex justify-center py-12 text-primary"><Spinner /></div>
                ) : messages.map((m) => {
                  const mine = m.senderType === 'agent';
                  const system = m.senderType === 'system';
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-[13px] ${system ? 'bg-section text-body' : mine ? 'bg-primary text-white' : 'bg-section text-ink'}`}>
                        {!mine && !system && m.senderName && <p className="mb-0.5 text-[11px] font-semibold text-faint">{m.senderName}</p>}
                        <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                        {m.attachments?.map((u, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <a key={i} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" className="mt-1.5 max-h-40 rounded-lg" /></a>
                        ))}
                        <p className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-faint'}`}>{formatDateTime(m.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* composer */}
              <form onSubmit={send} className="flex items-center gap-2 border-t border-line pt-3">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a reply…"
                  className="h-11 flex-1 rounded-full border border-line bg-white px-4 text-sm placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button type="submit" disabled={sending || !draft.trim()}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-dark disabled:opacity-40">
                  {sending ? <CheckCheck size={18} /> : <Send size={18} />}
                </button>
              </form>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
