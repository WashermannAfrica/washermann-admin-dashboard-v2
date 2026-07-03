'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Newspaper, Plus, Eye, Clock } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { Section } from '@/components/ui/Section';
import { Chip } from '@/components/ui/Chip';
import { Spinner } from '@/components/ui/Spinner';
import { cn, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import type { Paginated } from '@/types';
import type { BlogPost, BlogPostStatus } from '@/types/blog';

const FILTERS: { label: string; value: BlogPostStatus | null }[] = [
  { label: 'All', value: null },
  { label: 'Drafts', value: 'draft' },
  { label: 'In review', value: 'in_review' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
];

function statusChip(status: BlogPostStatus) {
  switch (status) {
    case 'published': return <Chip tone="success">Published</Chip>;
    case 'in_review': return <Chip tone="warn">In review</Chip>;
    case 'archived':  return <Chip tone="neutral">Archived</Chip>;
    default:          return <Chip tone="neutral">Draft</Chip>;
  }
}

export default function BlogListPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filter, setFilter] = useState<BlogPostStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const qs = filter ? `?status=${filter}&limit=100` : '?limit=100';
    api
      .get<Paginated<BlogPost>>(`/admin/blog${qs}`)
      .then((res) => setPosts(res.data.data))
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(load, [load]);

  async function newPost() {
    setCreating(true);
    setError('');
    try {
      const res = await api.post<{ data: BlogPost }>('/admin/blog', { title: 'Untitled post' });
      router.push(`/blog/${res.data.data.id}`);
    } catch (err) {
      setError(apiErr(err));
      setCreating(false);
    }
  }

  const inReview = posts.filter((p) => p.status === 'in_review').length;
  const published = posts.filter((p) => p.status === 'published').length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageKpi icon={<Newspaper size={16} />} iconClass="bg-forest text-white" label="Blog posts" value={String(posts.length)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Published" value={String(published)} />
        <StatBlock label="Awaiting review" value={String(inReview)} />
      </div>

      <Section>
        <div className="flex flex-wrap items-center gap-2 pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setFilter(f.value)}
              className={cn(
                'h-9 rounded-full border px-4 text-[13px] transition-colors',
                filter === f.value
                  ? 'border-primary bg-mint-soft font-semibold text-forest'
                  : 'border-line bg-white text-body hover:bg-section',
              )}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={newPost}
            disabled={creating}
            className="ml-auto flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            <Plus size={14} /> {creating ? 'Creating…' : 'New post'}
          </button>
        </div>

        {error && <p className="mb-3 rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>
        ) : posts.length === 0 ? (
          <p className="py-12 text-center text-sm text-faint">
            No posts {filter ? `with status "${filter.replace('_', ' ')}"` : 'yet'} — write the first one.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {posts.map((p) => (
              <Link key={p.id} href={`/blog/${p.id}`} className="flex items-center gap-4 px-1 py-3.5 transition-colors hover:bg-section/60">
                {p.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverImageUrl} alt="" className="h-12 w-20 shrink-0 rounded-lg border border-line object-cover" />
                ) : (
                  <span className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg border border-line bg-section text-faint">
                    <Newspaper size={16} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{p.title}</p>
                  <p className="mt-0.5 flex items-center gap-3 text-xs text-faint">
                    <span>{p.authorName ?? '—'}</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(p.updatedAt)}</span>
                    {p.firstPublishedAt && (
                      <span className="flex items-center gap-1"><Eye size={11} /> {p.viewCount} views</span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {p.status === 'published' && p.publishedSnapshot && p.publishedSnapshot.title !== p.title && (
                    <Chip tone="warn">Unpublished edits</Chip>
                  )}
                  {statusChip(p.status)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
