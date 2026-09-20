export type PolicyVersionStatus = 'draft' | 'published' | 'archived';

export interface Policy {
  id: string;
  key: string;
  title: string;
  description: string | null;
  audiences: string[];
  currentVersionId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** present on the admin list endpoint */
  versionCount?: number;
}

export interface PolicyVersion {
  id: string;
  policyId: string;
  versionNumber: number;
  status: PolicyVersionStatus;
  contentMarkdown: string;
  contentHtml: string;
  contentHash: string;
  changeSummary: string | null;
  effectiveDate: string;
  requiresReconsent: boolean;
  sourceFormat: string;
  publishedAt: string | null;
  publishedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  /** present on the admin policy-detail endpoint */
  acceptanceCount?: number;
}
