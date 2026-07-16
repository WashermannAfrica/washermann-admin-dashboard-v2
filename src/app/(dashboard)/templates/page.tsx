'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Mail, MessageSquare, Bell, Smartphone, MonitorSmartphone, RotateCcw, Save, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import type { ApiResponse } from '@/types';
import type { NotificationTemplate, NotificationChannel } from '@/types/ops';

const CHANNELS: { key: NotificationChannel | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: null },
  { key: 'email', label: 'Email', icon: <Mail size={13} /> },
  { key: 'sms', label: 'SMS', icon: <MessageSquare size={13} /> },
  { key: 'push', label: 'Push', icon: <Bell size={13} /> },
  { key: 'in_app', label: 'In-app', icon: <MonitorSmartphone size={13} /> },
  { key: 'whatsapp', label: 'WhatsApp', icon: <Smartphone size={13} /> },
];
const channelIcon = (c: NotificationChannel) => CHANNELS.find((x) => x.key === c)?.icon ?? null;
const prettyKey = (k: string) => k.split('.').map((p) => p.replace(/_/g, ' ')).join(' · ');

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState<NotificationChannel | 'all'>('all');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', body: '', htmlBody: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [confirmSync, setConfirmSync] = useState(false);
  const [note, setNote] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<ApiResponse<NotificationTemplate[]>>('/admin/notification-templates')
      .then((res) => setTemplates(Array.isArray(res.data.data) ? res.data.data : []))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const selected = templates.find((t) => t.id === selectedId) ?? null;

  function select(t: NotificationTemplate) {
    setSelectedId(t.id);
    setNote('');
    setForm({ name: t.name ?? '', subject: t.subject ?? '', body: t.body ?? '', htmlBody: t.htmlBody ?? '', isActive: t.isActive });
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setNote('');
    try {
      const { data } = await api.patch<ApiResponse<NotificationTemplate>>(`/admin/notification-templates/${selected.id}`, {
        name: form.name,
        subject: form.subject || null,
        body: form.body,
        htmlBody: selected.channel === 'email' ? form.htmlBody || null : undefined,
        isActive: form.isActive,
      });
      setTemplates((prev) => prev.map((t) => (t.id === selected.id ? data.data : t)));
      setNote('Saved.');
    } catch (err) { setError(apiErr(err)); } finally { setSaving(false); }
  }

  async function resetToDefault() {
    if (!selected) return;
    setResetting(true);
    try {
      const { data } = await api.post<ApiResponse<NotificationTemplate>>(`/admin/notification-templates/${selected.id}/reset`, {});
      setTemplates((prev) => prev.map((t) => (t.id === selected.id ? data.data : t)));
      select(data.data);
      setNote('Reset to brand default.');
    } catch (err) { setError(apiErr(err)); } finally { setResetting(false); }
  }

  async function syncAll() {
    setSyncing(true);
    setConfirmSync(false);
    try {
      await api.post('/admin/notification-templates/sync-defaults', {});
      load();
      setSelectedId(null);
      setNote('All templates synced to brand defaults.');
    } catch (err) { setError(apiErr(err)); } finally { setSyncing(false); }
  }

  // group filtered templates by key
  const groups = useMemo(() => {
    const needle = search.toLowerCase();
    const filtered = templates.filter(
      (t) => (channel === 'all' || t.channel === channel) && (!needle || t.key.toLowerCase().includes(needle) || t.name.toLowerCase().includes(needle)),
    );
    const map = new Map<string, NotificationTemplate[]>();
    for (const t of filtered) (map.get(t.key) ?? map.set(t.key, []).get(t.key)!).push(t);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [templates, search, channel]);

  const emailCount = templates.filter((t) => t.channel === 'email').length;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Notification templates</h1>
          <p className="mt-1 text-sm text-body">{templates.length} templates · {emailCount} email. Edit content and preview branding.</p>
        </div>
        <Button variant="outline" loading={syncing} onClick={() => setConfirmSync(true)}><RefreshCw size={14} /> Sync brand defaults</Button>
      </div>

      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}
      {note && <p className="rounded-xl bg-success-bg px-4 py-2 text-sm text-success">{note}</p>}

      {loading ? (
        <div className="flex justify-center py-20 text-primary"><Spinner size="lg" /></div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
          {/* list */}
          <div className="space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates" className="h-9 w-full rounded-full border border-line bg-white pl-9 pr-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CHANNELS.map((c) => (
                <button key={c.key} onClick={() => setChannel(c.key)} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${channel === c.key ? 'bg-forest text-white' : 'bg-section text-body hover:text-ink'}`}>{c.icon}{c.label}</button>
              ))}
            </div>
            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
              {groups.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-faint">No templates match.</p>
              ) : groups.map(([key, items]) => (
                <div key={key}>
                  <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-faint">{prettyKey(key)}</p>
                  <div className="space-y-1">
                    {items.map((t) => (
                      <button key={t.id} onClick={() => select(t)} className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${selectedId === t.id ? 'border-primary bg-mint-soft' : 'border-line hover:bg-section'}`}>
                        <span className="flex items-center gap-2 text-sm text-ink">{channelIcon(t.channel)}<span className="capitalize">{t.channel.replace('_', '-')}</span></span>
                        {!t.isActive && <Badge variant="neutral">off</Badge>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* editor */}
          {!selected ? (
            <div className="rounded-3xl border border-line"><EmptyState icon={<Mail size={22} />} title="Select a template" description="Pick a template from the list to view and edit its content." /></div>
          ) : (
            <div className="space-y-4 rounded-3xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="flex items-center gap-2 font-semibold text-ink">{channelIcon(selected.channel)} {prettyKey(selected.key)}</p>
                  <p className="text-xs text-faint">{selected.key} · {selected.channel}</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-body">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-primary" /> Active
                </label>
              </div>

              <Input label="Template name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {selected.channel !== 'sms' && selected.channel !== 'in_app' && (
                <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              )}
              <Textarea label={selected.channel === 'email' ? 'Plain-text body (fallback)' : 'Body'} rows={selected.channel === 'email' ? 3 : 6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />

              {selected.channel === 'email' && (
                <div className="grid gap-3 lg:grid-cols-2">
                  <Textarea label="HTML body" rows={16} className="font-mono text-xs" value={form.htmlBody} onChange={(e) => setForm({ ...form, htmlBody: e.target.value })} />
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-ink">Live preview</p>
                    <iframe title="preview" srcDoc={form.htmlBody} className="h-[22rem] w-full rounded-xl border border-line bg-section" />
                  </div>
                </div>
              )}

              {selected.variables?.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-faint">Available variables (insert as <code className="text-body">{'{{name}}'}</code>)</p>
                  <div className="flex flex-wrap gap-1.5">{selected.variables.map((v) => <Chip key={v}>{v}</Chip>)}</div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 border-t border-line pt-4">
                <Button loading={saving} onClick={save}><Save size={14} /> Save changes</Button>
                <Button variant="outline" loading={resetting} onClick={resetToDefault}><RotateCcw size={14} /> Reset to brand default</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmSync}
        onClose={() => setConfirmSync(false)}
        onConfirm={syncAll}
        icon={<RefreshCw size={20} />}
        title="Sync all templates to brand defaults?"
        body="This re-applies the latest in-code content and Washermann branding to every template, overwriting any manual edits. Use this to roll out the current brand."
        confirmLabel={syncing ? 'Syncing…' : 'Sync all'}
      />
    </div>
  );
}
