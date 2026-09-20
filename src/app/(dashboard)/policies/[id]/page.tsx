'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Pencil, Eye, UploadCloud, Settings2, CheckCircle2, Clock, FileUp,
} from 'lucide-react';
import { Section, Panel } from '@/components/ui/Section';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Input, Textarea } from '@/components/ui/Input';
import { TagInput } from '@/components/ui/TagInput';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import type { ApiResponse } from '@/types';
import type { Policy, PolicyVersion, PolicyVersionStatus } from '@/types/policy';

type PolicyDetail = Policy & { versions: PolicyVersion[] };

const today = () => new Date().toISOString().slice(0, 10);

function statusChip(s: PolicyVersionStatus) {
  if (s === 'published') return <Chip tone="success">Published (live)</Chip>;
  if (s === 'archived') return <Chip tone="neutral">Archived</Chip>;
  return <Chip tone="warn">Draft</Chip>;
}

export default function PolicyDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<PolicyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNumber, setEditingNumber] = useState<number | null>(null); // null = new
  const [markdown, setMarkdown] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(today());
  const [changeSummary, setChangeSummary] = useState('');
  const [requiresReconsent, setRequiresReconsent] = useState(false);
  const [saving, setSaving] = useState(false);

  // meta
  const [metaOpen, setMetaOpen] = useState(false);
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mAudiences, setMAudiences] = useState<string[]>([]);
  const [mActive, setMActive] = useState(true);

  // preview + publish
  const [preview, setPreview] = useState<PolicyVersion | null>(null);
  const [publishing, setPublishing] = useState<PolicyVersion | null>(null);
  const [busy, setBusy] = useState(false);

  // docx upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    api
      .get<ApiResponse<PolicyDetail>>(`/admin/policies/${id}`)
      .then((res) => setData(res.data.data))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  function openNewVersion() {
    const latest = data?.versions[0];
    setEditingNumber(null);
    setMarkdown(latest?.contentMarkdown ?? ''); // start from the latest as a base
    setEffectiveDate(today());
    setChangeSummary('');
    setRequiresReconsent(false);
    setError('');
    setEditorOpen(true);
  }

  function openNewVersionFrom(v: PolicyVersion) {
    // Edit a published/archived version's content — saving creates a NEW version.
    setEditingNumber(null);
    setMarkdown(v.contentMarkdown);
    setEffectiveDate(today());
    setChangeSummary('');
    setRequiresReconsent(false);
    setError('');
    setEditorOpen(true);
  }

  function openEditDraft(v: PolicyVersion) {
    setEditingNumber(v.versionNumber);
    setMarkdown(v.contentMarkdown);
    setEffectiveDate(v.effectiveDate?.slice(0, 10) ?? today());
    setChangeSummary(v.changeSummary ?? '');
    setRequiresReconsent(v.requiresReconsent);
    setError('');
    setEditorOpen(true);
  }

  async function saveVersion() {
    setSaving(true);
    setError('');
    try {
      const body = { contentMarkdown: markdown, effectiveDate, changeSummary: changeSummary || undefined, requiresReconsent };
      if (editingNumber == null) {
        await api.post(`/admin/policies/${id}/versions`, body);
      } else {
        await api.patch(`/admin/policies/${id}/versions/${editingNumber}`, body);
      }
      setEditorOpen(false);
      setLoading(true);
      load();
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setSaving(false);
    }
  }

  async function uploadDocx(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (!/\.docx$/i.test(file.name)) {
      setError('Only .docx files are supported');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      await api.post(`/admin/policies/${id}/versions/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLoading(true);
      load();
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setUploading(false);
    }
  }

  function openMeta() {
    if (!data) return;
    setMTitle(data.title);
    setMDesc(data.description ?? '');
    setMAudiences(data.audiences ?? []);
    setMActive(data.isActive);
    setMetaOpen(true);
  }

  async function saveMeta() {
    setBusy(true);
    setError('');
    try {
      await api.patch(`/admin/policies/${id}`, {
        title: mTitle, description: mDesc, audiences: mAudiences, isActive: mActive,
      });
      setMetaOpen(false);
      setLoading(true);
      load();
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setBusy(false);
    }
  }

  async function doPublish() {
    if (!publishing) return;
    setBusy(true);
    try {
      await api.post(`/admin/policies/${id}/versions/${publishing.versionNumber}/publish`);
      setPublishing(null);
      setLoading(true);
      load();
    } catch (err) {
      setError(apiErr(err));
      setPublishing(null);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="flex justify-center py-24 text-primary"><Spinner size="lg" /></div>;
  if (error && !data) return <p className="py-12 text-center text-sm text-danger">{error}</p>;
  if (!data) return null;

  const liveNumber = data.versions.find((v) => v.status === 'published')?.versionNumber ?? null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button onClick={() => router.push('/policies')} className="flex items-center gap-1.5 text-sm text-body hover:text-ink">
        <ArrowLeft size={15} /> All policies
      </button>

      <Section>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-ink">{data.title}</h1>
            <p className="mt-1 flex items-center gap-2 text-xs text-faint">
              <span className="font-mono">/legal/{data.key}</span>
              {liveNumber ? <Chip tone="success">v{liveNumber} live</Chip> : <Chip tone="neutral">Nothing published</Chip>}
              {!data.isActive && <Chip tone="neutral">Hidden</Chip>}
            </p>
            {data.description && <p className="mt-2 text-sm text-body">{data.description}</p>}
            {data.audiences?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.audiences.map((a) => <Chip key={a} tone="info">{a}</Chip>)}
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" onClick={openMeta}><Settings2 size={14} /> Settings</Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <FileUp size={14} /> {uploading ? 'Uploading…' : 'Upload .docx'}
            </Button>
            <input ref={fileRef} type="file" accept=".docx" className="hidden" onChange={uploadDocx} />
            <Button onClick={openNewVersion}><Plus size={14} /> New version</Button>
          </div>
        </div>
      </Section>

      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}

      <Section>
        <p className="pb-3 text-sm font-semibold text-ink">Version history</p>
        {data.versions.length === 0 ? (
          <p className="py-10 text-center text-sm text-faint">No versions yet — create the first, then publish it.</p>
        ) : (
          <div className="space-y-2">
            {data.versions.map((v) => (
              <Panel key={v.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold text-ink">
                      Version {v.versionNumber} {statusChip(v.status)}
                      {v.requiresReconsent && <Chip tone="warn">Re-consent</Chip>}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-faint">
                      <span className="flex items-center gap-1"><Clock size={11} /> Effective {v.effectiveDate?.slice(0, 10)}</span>
                      <span>Updated {formatDate(v.updatedAt)}</span>
                      {v.publishedAt && <span className="flex items-center gap-1"><CheckCircle2 size={11} /> Published {formatDate(v.publishedAt)}</span>}
                      {(v.acceptanceCount ?? 0) > 0 && <span>{v.acceptanceCount} accepted</span>}
                    </p>
                    {v.changeSummary && <p className="mt-1.5 text-sm text-body">{v.changeSummary}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" onClick={() => setPreview(v)}><Eye size={14} /> Preview</Button>
                    {v.status === 'draft' ? (
                      <>
                        <Button variant="outline" onClick={() => openEditDraft(v)}><Pencil size={14} /> Edit</Button>
                        <Button onClick={() => setPublishing(v)}><UploadCloud size={14} /> Publish</Button>
                      </>
                    ) : (
                      <Button variant="outline" onClick={() => openNewVersionFrom(v)}><Pencil size={14} /> Edit</Button>
                    )}
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </Section>

      {/* ─── Editor (right slide-in) ─── */}
      <Drawer
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingNumber == null ? 'New version' : `Edit draft v${editingNumber}`}
        widthClass="max-w-3xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={saveVersion} disabled={saving || !markdown.trim() || !effectiveDate}>
              {saving ? 'Saving…' : editingNumber == null ? 'Save draft' : 'Save changes'}
            </Button>
          </>
        }
      >
        <div className="flex h-full flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Effective date" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
            <label className="flex items-end gap-2 pb-2 text-sm text-body">
              <input type="checkbox" checked={requiresReconsent} onChange={(e) => setRequiresReconsent(e.target.checked)} className="h-4 w-4 rounded border-line" />
              Require existing users to re-accept
            </label>
          </div>
          <Input label="Change summary (optional)" value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} placeholder="What changed vs the previous version" />
          <div className="flex flex-1 flex-col">
            <label className="mb-1.5 block text-sm font-medium text-ink">Policy content</label>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder={'Write or paste the full policy here.\n\nUse a blank line between paragraphs. Optional formatting: "# Heading", "## Sub-heading", "- bullet", "**bold**", "[link](https://…)".'}
              className="min-h-[58vh] flex-1 w-full resize-y rounded-xl border border-line bg-white p-4 text-[14px] leading-relaxed text-ink outline-none focus:border-primary"
            />
            <p className="mt-2 text-xs text-faint">Plain text works as-is. Markdown formatting is rendered to a safe web page on save — use <b>Preview</b> to check it before publishing.</p>
          </div>
          {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}
        </div>
      </Drawer>

      {/* ─── Settings ─── */}
      <Modal open={metaOpen} onClose={() => setMetaOpen(false)} title="Policy settings">
        <div className="space-y-4">
          <Input label="Title" value={mTitle} onChange={(e) => setMTitle(e.target.value)} required />
          <Textarea label="Short description" value={mDesc} onChange={(e) => setMDesc(e.target.value)} rows={2} />
          <TagInput label="Audiences" value={mAudiences} onChange={setMAudiences} placeholder="customer, vendor, rep…" />
          <label className="flex items-center gap-2 text-sm text-body">
            <input type="checkbox" checked={mActive} onChange={(e) => setMActive(e.target.checked)} className="h-4 w-4 rounded border-line" />
            Visible on the website
          </label>
          <p className="text-xs text-faint">The URL key <span className="font-mono">/{data.key}</span> cannot be changed here — it keeps existing consent links valid.</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setMetaOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={saveMeta} disabled={busy || !mTitle}>{busy ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </Modal>

      {/* ─── Preview ─── */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview ? `${data.title} — v${preview.versionNumber} preview` : ''}>
        <div
          className="policy-preview max-h-[70vh] overflow-y-auto rounded-xl border border-line bg-white px-5 py-4 text-sm leading-relaxed text-body [&_a]:text-primary [&_a]:underline [&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-ink [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3 [&_strong]:text-ink [&_table]:my-3 [&_table]:w-full [&_td]:border [&_td]:border-line [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-line [&_th]:bg-section [&_th]:px-2 [&_th]:py-1"
          dangerouslySetInnerHTML={{ __html: preview?.contentHtml ?? '' }}
        />
      </Modal>

      <ConfirmModal
        open={!!publishing}
        onClose={() => setPublishing(null)}
        onConfirm={doPublish}
        icon={<UploadCloud size={20} />}
        title={`Publish v${publishing?.versionNumber}?`}
        body={
          liveNumber
            ? `This makes v${publishing?.versionNumber} the live version at /legal/${data.key} and archives v${liveNumber}. Published versions are locked and cannot be edited.`
            : `This makes v${publishing?.versionNumber} the live version at /legal/${data.key}. Published versions are locked and cannot be edited.`
        }
        confirmLabel={busy ? 'Publishing…' : 'Publish'}
      />
    </div>
  );
}
