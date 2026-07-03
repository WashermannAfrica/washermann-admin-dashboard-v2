export type BlogPostStatus = 'draft' | 'in_review' | 'published' | 'archived';

export interface BlogPublishedSnapshot {
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  bodyHtml: string;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  readingTimeMins: number;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  bodyHtml: string;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  readingTimeMins: number;
  status: BlogPostStatus;
  authorUserId: string;
  authorName?: string;
  author?: { name: string; avatarUrl: string | null };
  submittedAt: string | null;
  submittedBy: string | null;
  reviewedBy: string | null;
  reviewNote: string | null;
  publishedSnapshot: BlogPublishedSnapshot | null;
  publishedAt: string | null;
  firstPublishedAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}
