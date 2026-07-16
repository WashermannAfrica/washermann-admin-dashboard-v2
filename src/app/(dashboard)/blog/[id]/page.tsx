'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Archive, ArchiveRestore, Check, CloudUpload, ExternalLink,
  ImagePlus, Send, Trash2, X,
} from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { RichTextEditor } from '@/components/blog/RichTextEditor';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import { useAuthStore } from '@/store/auth.store';
import type { BlogPost } from '@/types/blog';

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL ?? 'http://localhost:3003';
const AUTOSAVE_MS = 2500;

type Draft = {
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  bodyHtml: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
};

function toDraft(p: BlogPost): Draft {
  return {
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt ?? '',
    coverImageUrl: p.coverImageUrl,
    bodyHtml: p.bodyHtml ?? '',
    tags: p.tags ?? [],
    seoTitle: p.seoTitle ?? '',
    seoDescription: p.seoDescription ?? '',
  };
}

export default function BlogEditorPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const me = useAuthStore((s) => s.user);

  const [post, setPost] = useState<BlogPost | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [changesNote, setChangesNote] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef<Draft | null>(null);
  const dirtyRef = useRef(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<{ data: BlogPost }>(`/admin/blog/${id}`)
      .then((res) => {
        setPost(res.data.data);
        setDraft(toDraft(res.data.data));
        setDirty(false);
      })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);
  useEffect(() => { draftRef.current = draft; }, [draft]);
  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);

  const editable = post?.status === 'draft' || post?.status === 'published';
  const canReview =
    post?.status === 'in_review' &&
    !!me &&
    me.id !== post.authorUserId &&
    me.id !== post.submittedBy;

  function patch(update: Partial<Draft>) {
    setDraft((d) => (d ? { ...d, ...update } : d));
    setDirty(true);
  }

  const save = useCallback(async (): Promise<boolean> => {
    const d = draftRef.current;
    if (!d || !dirtyRef.current) return true;
    setSaving(true);
    setError('');
    try {
      const res = await api.patch<{ data: BlogPost }>(`/admin/blog/${id}`, {
        title: d.title,
        excerpt: d.excerpt,
        coverImageUrl: d.coverImageUrl ?? '',
        bodyHtml: d.bodyHtml,
        tags: d.tags,
        seoTitle: d.seoTitle,
        seoDescription: d.seoDescription,
        ...(d.slug !== undefined ? { slug: d.slug } : {}),
      });
      setPost(res.data.data);
      // keep local slug in sync (server may have uniquified it)
      setDraft((cur) => (cur ? { ...cur, slug: res.data.data.slug } : cur));
      setDirty(false);
      setSavedAt(new Date());
      return true;
    } catch (err) {
      setError(apiErr(err));
      return false;
    } finally {
      setSaving(false);
    }
  }, [id]);

  // Autosave: debounce after the last edit
  useEffect(() => {
    if (!dirty || !editable) return;
    const t = setTimeout(() => void save(), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [dirty, draft, editable, save]);

  async function act(action: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      const ok = await save(); // flush pending edits first
      if (!ok) return;
      await action();
      load();
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setBusy(false);
    }
  }

  const submit = () => act(() => api.post(`/admin/blog/${id}/submit`));
  const approve = () => act(() => api.post(`/admin/blog/${id}/approve`));
  const archive = () => act(() => api.post(`/admin/blog/${id}/archive`));
  const unarchive = () => act(() => api.post(`/admin/blog/${id}/unarchive`));

  const requestChanges = () =>
    act(async () => {
      await api.post(`/admin/blog/${id}/request-changes`, { note: changesNote.trim() });
      setChangesOpen(false);
      setChangesNote('');
    });

  async function removePost() {
    setBusy(true);
    try {
      await api.delete(`/admin/blog/${id}`);
      router.push('/blog');
    } catch (err) {
      setError(apiErr(err));
      setBusy(false);
      setDeleteOpen(false);
    }
  }

  async function openPreview() {
    try {
      const ok = await save();
      if (!ok) return;
      const res = await api.post<{ data: { token: string } }>(`/admin/blog/${id}/preview-token`);
      window.open(`${LANDING_URL}/blog/preview/${id}?token=${res.data.data.token}`, '_blank');
    } catch (err) {
      setError(apiErr(err));
    }
  }

  async function uploadCover(file: File) {
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await api.post<{ data: { url: string } }>('/upload/blog-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      patch({ coverImageUrl: res.data.data.url });
    } catch (err) {
      setError(apiErr(err));
    }
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t || !draft) return;
    if (!draft.tags.includes(t)) patch({ tags: [...draft.tags, t] });
    setTagInput('');
  }

  if (loading) return <div className="flex justify-center py-24 text-primary"><Spinner size="lg" /></div>;
  if (!post || !draft) return <p className="py-12 text-center text-sm text-danger">{error || 'Post not found.'}</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/blog')} className="flex items-center gap-1.5 text-sm text-body hover:text-ink">
          <ArrowLeft size={16} /> All posts
        </button>
        <span className="text-xs text-faint">
          {saving ? 'Saving…' : dirty ? 'Unsaved changes' : savedAt ? `Saved ${savedAt.toLocaleTimeString()}` : ''}
        </span>
      </div>

      {/* Status banners */}
      {post.status === 'in_review' && !canReview && (
        <p className="rounded-xl bg-warn-bg px-4 py-2.5 text-sm text-warn">
          In review — another admin has to approve it. Editing is locked until they respond.
        </p>
      )}
      {post.status === 'in_review' && canReview && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warn-bg px-4 py-3">
          <p className="text-sm font-semibold text-warn">Awaiting your review — read it, then decide.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setChangesOpen(true)} disabled={busy}>
              <X size={14} /> Request changes
            </Button>
            <Button size="sm" loading={busy} onClick={approve}>
              <Check size={14} /> Approve & publish
            </Button>
          </div>
        </div>
      )}
      {post.status === 'draft' && post.reviewNote && (
        <p className="rounded-xl bg-danger-bg px-4 py-2.5 text-sm text-danger">
          <strong>Changes requested:</strong> {post.reviewNote}
        </p>
      )}
      {post.status === 'published' && (
        <p className="rounded-xl bg-mint-soft px-4 py-2.5 text-sm text-forest">
          Live on the blog{dirty || post.publishedSnapshot?.title !== post.title || post.publishedSnapshot?.bodyHtml !== post.bodyHtml
            ? ' — your edits stay private until re-approved.'
            : '. Edits here will need re-approval before readers see them.'}
        </p>
      )}
      {post.status === 'archived' && (
        <p className="rounded-xl bg-section px-4 py-2.5 text-sm text-body">Archived — hidden from the public site.</p>
      )}
      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}

      <Section>
        <div className="space-y-4">
          <input
            value={draft.title}
            onChange={(e) => patch({ title: e.target.value })}
            disabled={!editable}
            placeholder="Post title"
            className="w-full border-0 bg-transparent text-2xl font-bold text-ink placeholder:text-faint focus:outline-none disabled:opacity-70"
          />

          <div className="flex items-center gap-2 text-xs text-faint">
            <span className="shrink-0">/blog/</span>
            <input
              value={draft.slug}
              onChange={(e) => patch({ slug: e.target.value })}
              disabled={!editable || !!post.firstPublishedAt}
              title={post.firstPublishedAt ? 'Slug is locked after first publish' : 'URL slug'}
              className="w-full max-w-xs rounded-md border border-line bg-white px-2 py-1 font-mono text-xs text-body focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-section disabled:opacity-70"
            />
            {post.firstPublishedAt && <span className="shrink-0">🔒 locked</span>}
          </div>

          {/* Cover */}
          {draft.coverImageUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={draft.coverImageUrl} alt="Cover" className="max-h-64 w-full rounded-2xl border border-line object-cover" />
              {editable && (
                <button
                  onClick={() => patch({ coverImageUrl: null })}
                  className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                  title="Remove cover"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ) : (
            editable && (
              <button
                onClick={() => coverInputRef.current?.click()}
                className="flex h-28 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-sm text-faint transition-colors hover:border-primary hover:text-forest"
              >
                <ImagePlus size={16} /> Add cover image
              </button>
            )
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadCover(f);
              e.target.value = '';
            }}
          />

          <Textarea
            label="Excerpt"
            placeholder="One or two sentences shown on cards and search results"
            value={draft.excerpt}
            onChange={(e) => patch({ excerpt: e.target.value })}
            disabled={!editable}
          />

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Body</label>
            <RichTextEditor value={draft.bodyHtml} onChange={(html) => patch({ bodyHtml: html })} disabled={!editable} />
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Tags</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {draft.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2.5 py-1 text-xs font-medium text-forest">
                  {t}
                  {editable && (
                    <button onClick={() => patch({ tags: draft.tags.filter((x) => x !== t) })} className="text-forest/60 hover:text-forest">
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
              {editable && (
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
                  }}
                  onBlur={addTag}
                  placeholder="Add tag ⏎"
                  className="h-7 w-28 rounded-full border border-line bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}
            </div>
          </div>

          {/* SEO */}
          <details className="rounded-xl border border-line px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-ink">SEO overrides (optional)</summary>
            <div className="mt-3 space-y-3">
              <Input
                label="SEO title"
                placeholder={draft.title}
                value={draft.seoTitle}
                onChange={(e) => patch({ seoTitle: e.target.value })}
                disabled={!editable}
              />
              <Textarea
                label="SEO description"
                placeholder={draft.excerpt || 'Defaults to the excerpt'}
                value={draft.seoDescription}
                onChange={(e) => patch({ seoDescription: e.target.value })}
                disabled={!editable}
              />
            </div>
          </details>
        </div>
      </Section>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 pb-10">
        {post.status === 'draft' && (
          <Button loading={busy} onClick={submit}>
            <Send size={15} /> Submit for review
          </Button>
        )}
        {post.status === 'published' && (
          <a
            href={`${LANDING_URL}/blog/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 items-center gap-1.5 rounded-full bg-forest px-4 text-[13px] font-semibold text-white hover:bg-forest/90"
          >
            <ExternalLink size={14} /> View live
          </a>
        )}
        <Button variant="outline" onClick={openPreview}>
          <CloudUpload size={15} /> Preview
        </Button>
        <span className="flex-1" />
        {post.status === 'archived' ? (
          <Button variant="soft" loading={busy} onClick={unarchive}>
            <ArchiveRestore size={15} /> Unarchive
          </Button>
        ) : post.firstPublishedAt ? (
          <Button variant="outline" loading={busy} onClick={archive}>
            <Archive size={15} /> Archive
          </Button>
        ) : (
          <Button variant="outline" loading={busy} onClick={() => setDeleteOpen(true)}>
            <Trash2 size={15} /> Delete draft
          </Button>
        )}
      </div>

      {/* Delete-draft confirm */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete this draft?">
        <div className="space-y-4">
          <p className="text-sm text-body">
            <strong>&ldquo;{draft.title || 'Untitled post'}&rdquo;</strong> will be permanently deleted. It was never
            published, so nothing changes on the public site — but the draft cannot be recovered.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>Keep draft</Button>
            <Button variant="danger" className="flex-1" loading={busy} onClick={removePost}>Delete permanently</Button>
          </div>
        </div>
      </Modal>

      {/* Request-changes modal */}
      <Modal open={changesOpen} onClose={() => setChangesOpen(false)} title="Request changes">
        <div className="space-y-4">
          <Textarea
            label="What should the author fix?"
            required
            placeholder="e.g. The intro is too long — get to the point in two sentences."
            value={changesNote}
            onChange={(e) => setChangesNote(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setChangesOpen(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" loading={busy} disabled={changesNote.trim().length < 3} onClick={requestChanges}>
              Send back to author
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
