// Backend operational types (areas, reps, referrals, sales-rep) for admin wiring.

export type AreaLocation = {
  id: string;
  areaId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
};

export type Area = {
  id: string;
  name: string;
  state: string;
  lga: string | null;
  description: string | null;
  adjacentAreaIds: string[];
  transportFeeWP: number;
  targetUsers: number;
  isActive: boolean;
  deactivationReason: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  locations?: AreaLocation[];
  repsCount?: number;
  vendorsCount?: number;
}

export type AreaDetail = Area & {
  stats: {
    reps: number;
    activeReps: number;
    vendors: number;
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    revenueWP: number;
    revenueNaira: number;
  };
  recentOrders: Order[];
};

export type AreaRep = {
  id: string; name: string; phone: string | null;
  rating: number; ratingCount: number; status: string; isAvailable: boolean;
  pickups: number; deliveries: number;
};
export type AreaVendor = {
  id: string; name: string; phone: string | null;
  rating: number; ratingCount: number; status: string; isAvailable: boolean;
  orders: number; delivered: number;
};
export type AreaOrderRow = {
  id: string; reference: string; customerName: string;
  totalWP: number; status: string; createdAt: string;
};

export type RepUser = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
}

export type Rep = {
  id: string;
  userId: string;
  areaIds: string[];
  phone: string | null;
  status: 'active' | 'inactive' | 'suspended';
  isAvailable: boolean;
  assignmentPriority: number;
  rating: number;
  ratingCount: number;
  flaggedForReview: boolean;
  flaggedAt: string | null;
  notes: string | null;
  user?: RepUser;
  createdAt: string;
}

// ─── Referrals ────────────────────────────────────────────────────────────────
export type ReferrerType = 'sales_rep' | 'rep' | 'customer' | 'vendor';
export type ReferredType = 'customer' | 'vendor';
export type ReferralStatus = 'pending' | 'available' | 'paid' | 'rejected';

export type Referral = {
  id: string;
  code: string;
  referrerUserId: string;
  referrerType: ReferrerType;
  referredUserId: string;
  referredType: ReferredType;
  status: ReferralStatus;
  rewardCurrency: 'cash' | 'wp';
  rewardAmount: number | null;
  rewardValue: number | null;
  createdAt: string;
  unlockedAt: string | null;
  paidAt: string | null;
  referrerName?: string | null;
  referredName?: string | null;
  referredEmail?: string | null;
}

export type SalesRepDetail = {
  user: { id: string; fullName: string; email: string | null; phone: string | null } | null;
  profile: {
    status: string;
    assessmentPassed: boolean;
    bestScorePct: number;
    passedAt: string | null;
    upgradedToRepAt: string | null;
    createdAt: string;
    bank: { bankCode: string | null; accountNumber: string | null; accountName: string | null };
  };
  referral: {
    code: string | null;
    counts: { pending: number; available: number; paid: number };
    payout: { pending: number; available: number; paid: number };
    referrals: Referral[];
  };
  payouts: SalesRepPayout[];
};

export type RewardRule = {
  id: string;
  referrerType: ReferrerType;
  referredType: ReferredType;
  kind: 'fixed' | 'percent';
  value: number;
  vendorApprovalBonus: number | null;
  active: boolean;
}

// ─── Sales rep ────────────────────────────────────────────────────────────────
export type SalesRepApplicationStatus = 'new' | 'reviewing' | 'accepted' | 'rejected';

export type SalesRepApplication = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  areaOfLagos: string;
  address: string;
  hasSalesExperience: boolean;
  whyJoin: string | null;
  status: SalesRepApplicationStatus;
  reviewedAt: string | null;
  rejectionReason: string | null;
  userId: string | null;
  createdAt: string;
}

export type SalesRep = {
  id: string;
  userId: string;
  applicationId: string | null;
  status: 'onboarding' | 'active' | 'suspended';
  assessmentPassed: boolean;
  bestScorePct: number;
  passedAt: string | null;
  upgradedToRepAt: string | null;
  bankCode: string | null;
  accountNumber: string | null;
  accountName: string | null;
  createdAt: string;
  user?: { fullName: string; email: string | null; phone: string | null } | null;
}

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type SalesRepPayout = {
  id: string;
  salesRepUserId: string;
  salesRepName?: string | null;
  salesRepEmail?: string | null;
  amountNaira: number;
  referralIds: string[];
  status: PayoutStatus;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  approvedAt: string | null;
  completedAt: string | null;
  failureReason: string | null;
  reference: string | null;
  createdAt: string;
}

export type SalesRepAdminSummary = {
  applications: { total: number; byStatus: Record<string, number> };
  salesReps: { total: number; byStatus: Record<string, number> };
  payouts: {
    total: number;
    byStatus: Record<string, number>;
    outstandingNaira: number;
    paidNaira: number;
  };
}

// ─── Dashboard / orders / companies / staff / payouts ──────────────────────────
export type AdminOverview = {
  users: { total: number; active: number; pending: number; suspended: number; newThisWeek: number };
  companies: { total: number; active: number; pendingActivation: number; awaitingApproval: number };
  washPoints: { inCirculation: number; userHeld: number; companyHeld: number };
  vault: unknown | null;
  recentUsers: Array<{ id: string; fullName: string; email: string | null; phone: string | null; roles: string[]; status: string; createdAt: string }>;
};

export type Order = {
  id: string;
  reference: string;
  customerId: string;
  companyId: string | null;
  repId: string | null;
  vendorId: string | null;
  areaId: string | null;
  flow: string;
  serviceType: string;
  status: string;
  totalWP: number;
  nairaEquivalentSnapshot: number | null;
  vendorShareWP: number;
  repShareWP: number;
  platformShareWP: number;
  scheduledPickupAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type Company = {
  id: string;
  name: string;
  ownerEmail: string;
  activationStatus: string;
  status: string;
  phone: string | null;
  industry: string | null;
  address: string | null;
  website: string | null;
  numberOfWorkers: number | null;
  description: string | null;
  createdAt: string;
};

export type Vendor = {
  id: string;
  userId: string;
  businessName: string | null;
  phone: string | null;
  areaIds: string[];
  verificationStatus: 'pending_review' | 'verified' | 'rejected' | 'suspended';
  rejectionReason: string | null;
  isAvailable: boolean;
  rating: number;
  ratingCount: number;
  logoUrl: string | null;
  verifiedAt: string | null;
  createdAt: string;
  user?: { id: string; fullName: string; email: string | null; phone: string | null };
  // Enriched aggregates (list endpoint)
  orderCount?: number;
  earnedWp?: number;
  balanceWp?: number;
};

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'whatsapp';
export type NotificationTemplate = {
  id: string;
  key: string;
  channel: NotificationChannel;
  name: string;
  subject: string | null;
  body: string;
  htmlBody: string | null;
  variables: string[];
  isActive: boolean;
  emailStyle: Record<string, unknown> | null;
  updatedBy: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type VendorWallet = {
  id: string;
  vendorId: string;
  balance: number;
  totalEarned: number;
  status: string;
};

export type CatalogueCategory = {
  id: string;
  name: string;
  description: string | null;
  svgIcon: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type CatalogueItem = {
  id: string;
  categoryId: string;
  subCategoryId: string | null;
  name: string;
  slug: string;
  svgIcon: string | null;
  isEveryday: boolean;
  isActive: boolean;
  isAvailable: boolean;
  priceNgn: number | null;
  priceWp: number | null;
};

export type VendorDocument = {
  id: string;
  vendorId: string;
  documentType: string;
  fileUrl: string;
  originalName: string | null;
  createdAt: string;
};

export type PriceItemStatus = 'pending' | 'approved' | 'rejected';
export type VendorPricingItem = {
  itemId: string;
  priceNaira: number;
  garmentType: string;
  status?: PriceItemStatus;
  rejectionReason?: string | null;
  decidedAt?: string | null;
};

export type VendorPricingProposal = {
  id: string;
  vendorId: string;
  items: VendorPricingItem[];
  effectiveFrom: string | null;
  proposedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
};

export type StaffMember = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  status: string;
  createdAt: string;
};

export type VendorPayout = {
  id: string;
  vendorId: string;
  amountWP: number;
  nairaAmount: number;
  status: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  approvedAt: string | null;
  completedAt: string | null;
  failureReason: string | null;
  createdAt: string;
};
