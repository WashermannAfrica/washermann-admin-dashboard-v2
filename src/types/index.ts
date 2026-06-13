// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  status: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: AdminUser;
  };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  roles: string[];
  status: 'active' | 'pending' | 'suspended' | 'deactivated';
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsers {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface UserWallet {
  id: string;
  userId: string;
  balance: number;
  isActive: boolean;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  amount: number;
  type: 'credit' | 'debit';
  source: string;
  reference: string | null;
  description: string | null;
  createdAt: string;
}

export interface PaginatedLedger {
  data: LedgerEntry[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ─── Overview Stats ───────────────────────────────────────────────────────────

export interface OverviewStats {
  users: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
    newThisWeek: number;
  };
  companies: {
    total: number;
    active: number;
    pendingActivation: number;
    awaitingApproval: number;
  };
  washPoints: {
    inCirculation: number;
    userHeld: number;
    companyHeld: number;
  };
  vault: {
    id: string;
    name: string;
    totalPoints: number;
    usedPoints: number;
    remainingPoints: number;
    usagePercent: number;
    status: string;
  } | null;
  recentUsers: User[];
}

// ─── Companies ───────────────────────────────────────────────────────────────

export interface Tier {
  id: string;
  name: string;
  pointsPerCycle: number;
  duration: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  spendingCapPerCycle: number;
  isActive: boolean;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  ownerEmail: string;
  activationStatus: 'pending' | 'active' | 'awaiting_approval';
  status: 'active' | 'inactive';
  phone: string | null;
  industry: string | null;
  address: string | null;
  website: string | null;
  numberOfWorkers: number | null;
  description: string | null;
  tiers: Tier[];
  createdAt: string;
  updatedAt: string;
}

export interface CompanyWallet {
  id: string;
  companyId: string;
  wpBalance: number;
  status: 'active' | 'frozen';
}

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  status: 'active' | 'pending' | 'suspended' | 'deactivated';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── API response wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
