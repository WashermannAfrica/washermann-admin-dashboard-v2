'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ScrollText, Plus, FileText, Clock } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { Section } from '@/components/ui/Section';
import { Chip } from '@/components/ui/Chip';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { TagInput } from '@/components/ui/TagInput';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import type { ApiResponse } from '@/types';
import type { Policy } from '@/types/policy';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function PoliciesListPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [key, setKey] = useState('');
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [audiences, setAudiences] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<ApiResponse<Policy[]>>('/admin/policies')
      .then((res) => setPolicies(res.data.data))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  function openCreate() {
    setTitle(''); setKey(''); setKeyTouched(false); setDescription(''); setAudiences([]);
    setError(''); setCreateOpen(true);
  }

  async function create() {
    setSaving(true);
    setError('');
    try {
      const res = await api.post<ApiResponse<Policy>>('/admin/policies', {
        key: key || slugify(title),
        title,
        description: description || undefined,
        audiences,
      });
      setCreateOpen(false);
      router.push(`/policies/${res.data.data.id}`);
    } catch (err) {
      setError(apiErr(err));
      setSaving(false);
    }
  }

  const published = policies.filter((p) => p.currentVersionId).length;
  const drafts = policies.length - published;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageKpi icon={<ScrollText size={16} />} iconClass="bg-forest text-white" label="Legal Policies" value={String(policies.length)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Published" value={String(published)} />
        <StatBlock label="No published version" value={String(drafts)} />
      </div>

      <Section>
        <div className="flex items-center justify-between pb-3">
          <p className="text-sm text-faint">Upload, create and version the policies shown on the website and in the signup consent links.</p>
          <button
            onClick={openCreate}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark"
          >
            <Plus size={14} /> New policy
          </button>
        </div>

        {error && !createOpen && <p className="mb-3 rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>
        ) : policies.length === 0 ? (
          <p className="py-12 text-center text-sm text-faint">No policies yet — create the first, or upload a document.</p>
        ) : (
          <div className="divide-y divide-line">
            {policies.map((p) => (
              <Link key={p.id} href={`/policies/${p.id}`} className="flex items-center gap-4 px-1 py-3.5 transition-colors hover:bg-section/60">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-section text-faint">
                  <FileText size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{p.title}</p>
                  <p className="mt-0.5 flex items-center gap-3 text-xs text-faint">
                    <span className="font-mono">/{p.key}</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(p.updatedAt)}</span>
                    <span>{p.versionCount ?? 0} version{(p.versionCount ?? 0) === 1 ? '' : 's'}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {p.audiences?.slice(0, 3).map((a) => <Chip key={a} tone="info">{a}</Chip>)}
                  {p.currentVersionId
                    ? <Chip tone="success">Published</Chip>
                    : <Chip tone="neutral">Unpublished</Chip>}
                  {!p.isActive && <Chip tone="neutral">Hidden</Chip>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New policy">
        <div className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!keyTouched) setKey(slugify(e.target.value));
            }}
            placeholder="e.g. Privacy Policy"
            required
          />
          <div>
            <Input
              label="URL key (slug)"
              value={key}
              onChange={(e) => { setKeyTouched(true); setKey(slugify(e.target.value)); }}
              placeholder="privacy-policy"
              required
            />
            <p className="mt-1 text-xs text-faint">Public URL: <span className="font-mono">/legal/{key || 'your-slug'}</span> — do not change it once links point at it.</p>
          </div>
          <Textarea
            label="Short description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <TagInput
            label="Audiences (which portals must accept it)"
            value={audiences}
            onChange={setAudiences}
            placeholder="customer, vendor, rep, company…"
          />
          {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={create} disabled={saving || !title || !key}>
              {saving ? 'Creating…' : 'Create policy'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
