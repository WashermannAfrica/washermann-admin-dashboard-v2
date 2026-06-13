/* ─────────────────────────────────────────────────────────────────────────────
   Mock data matching the Figma design screens (names, amounts, dates).
   Replace with real API calls as backend endpoints are wired in.
   ──────────────────────────────────────────────────────────────────────────── */

export type OrderStatus = 'Delivered' | 'Pending' | 'Rejected' | 'Ongoing' | 'Overdue';

export interface Order {
  trackingId: string;
  name: string;
  company: string;
  amount: string;
  date: string;
  status: OrderStatus;
  area: string;
  items: { service: string; qty: number; points: number }[];
  washerman: string;
  rep: string;
  address: string;
  phone: string;
  [key: string]: unknown;
}

const NAMES = [
  'Arlene McCoy', 'Esther Howard', 'Savannah Nguyen', 'Floyd Miles', 'Marvin McKinney',
  'Jenny Wilson', 'Kathryn Murphy', 'Jacob Jones', 'Courtney Henry', 'Theresa Webb',
  'Cameron Williamson', 'Brooklyn Simmons', 'Leslie Alexander', 'Guy Hawkins', 'Robert Fox',
  'Annette Black', 'Dianne Russell', 'Devon Lane', 'Eleanor Pena', 'Wade Warren',
];
const COMPANIES = ['Dishutar', 'Torpedo', 'Sushi shop', 'GreenVita', 'Shunka', 'CleanFresh Ltd', 'SparkleWash', 'WashKing', 'Crystal Co', 'Bubbles NG'];
const AREAS_N = ['Lekki Phase 1', 'Yaba', 'Surulere', 'Ikeja GRA', 'Victoria Island', 'Gbagada', 'Ajah', 'Magodo'];
const STATUSES: OrderStatus[] = ['Delivered', 'Delivered', 'Pending', 'Rejected', 'Delivered', 'Ongoing', 'Overdue'];

export const ORDERS: Order[] = Array.from({ length: 48 }, (_, i) => {
  const n = i + 1;
  return {
    trackingId: `ORD-2025-${String(n).padStart(3, '0')}`,
    name: NAMES[i % NAMES.length],
    company: COMPANIES[i % COMPANIES.length],
    amount: `-${(i % 5) * 35 + 50} pts`,
    date: `${(i % 28) + 1} May 2026`,
    status: STATUSES[i % STATUSES.length],
    area: AREAS_N[i % AREAS_N.length],
    items: [
      { service: 'Wash & Fold', qty: (i % 3) + 1, points: 50 },
      { service: 'Ironing', qty: (i % 2) + 1, points: 30 },
    ],
    washerman: NAMES[(i + 7) % NAMES.length],
    rep: NAMES[(i + 3) % NAMES.length],
    address: `${12 + i} Admiralty Way, ${AREAS_N[i % AREAS_N.length]}, Lagos`,
    phone: `+234 80${(10000000 + i * 13579).toString().slice(0, 8)}`,
  };
});

export interface Company {
  id: string;
  name: string;
  email: string;
  employees: number;
  teams: number;
  walletWp: string;
  tier: 'Basic' | 'Plus' | 'Premium';
  status: 'Active' | 'Pending' | 'Suspended';
  date: string;
  [key: string]: unknown;
}

export const COMPANIES_DATA: Company[] = COMPANIES.map((c, i) => ({
  id: `CMP-${100 + i}`,
  name: c,
  email: `ops@${c.toLowerCase().replace(/\s+/g, '')}.com`,
  employees: 12 + i * 7,
  teams: 2 + (i % 5),
  walletWp: `${(45_000 + i * 12_500).toLocaleString()} WP`,
  tier: (['Basic', 'Plus', 'Premium'] as const)[i % 3],
  status: (['Active', 'Active', 'Pending', 'Active', 'Suspended'] as const)[i % 5],
  date: `${(i % 27) + 1} May 2026`,
}));

export interface Area {
  id: string;
  name: string;
  city: string;
  reps: number;
  washermen: number;
  activeOrders: number;
  status: 'Active' | 'Inactive';
  [key: string]: unknown;
}

export const AREAS: Area[] = AREAS_N.map((a, i) => ({
  id: `AR-${10 + i}`,
  name: a,
  city: 'Lagos',
  reps: 2 + (i % 4),
  washermen: 4 + (i % 6),
  activeOrders: 6 + i * 3,
  status: i === 5 ? 'Inactive' : 'Active',
}));

export interface Rep {
  id: string;
  name: string;
  email: string;
  phone: string;
  area: string;
  ordersHandled: number;
  bonusWp: string;
  status: 'Active' | 'Pending' | 'Suspended';
  date: string;
  [key: string]: unknown;
}

export const REPS: Rep[] = Array.from({ length: 18 }, (_, i) => ({
  id: `REP-${200 + i}`,
  name: NAMES[(i + 5) % NAMES.length],
  email: `${NAMES[(i + 5) % NAMES.length].toLowerCase().replace(/\s+/g, '.')}@washermann.com`,
  phone: `+234 81${(20000000 + i * 24681).toString().slice(0, 8)}`,
  area: AREAS_N[i % AREAS_N.length],
  ordersHandled: 14 + i * 6,
  bonusWp: `${(2_500 + i * 850).toLocaleString()} WP`,
  status: (['Active', 'Active', 'Pending', 'Active', 'Suspended'] as const)[i % 5],
  date: `${(i % 27) + 1} May 2026`,
}));

export interface Washerman {
  id: string;
  name: string;
  email: string;
  phone: string;
  area: string;
  workers: number;
  rating: number;
  completedOrders: number;
  earningsWp: string;
  pendingPayout: string;
  kyc: 'Verified' | 'Pending' | 'Rejected';
  status: 'Active' | 'Pending' | 'Suspended';
  date: string;
  [key: string]: unknown;
}

export const WASHERMEN: Washerman[] = Array.from({ length: 16 }, (_, i) => ({
  id: `WSH-${300 + i}`,
  name: NAMES[(i + 9) % NAMES.length],
  email: `${NAMES[(i + 9) % NAMES.length].toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
  phone: `+234 70${(30000000 + i * 86420).toString().slice(0, 8)}`,
  area: AREAS_N[i % AREAS_N.length],
  workers: 1 + (i % 5),
  rating: 3.6 + (i % 14) / 10,
  completedOrders: 22 + i * 9,
  earningsWp: `${(18_000 + i * 4_200).toLocaleString()} WP`,
  pendingPayout: `₦${(45_000 + i * 11_700).toLocaleString()}`,
  kyc: (['Verified', 'Verified', 'Pending', 'Verified', 'Rejected'] as const)[i % 5],
  status: (['Active', 'Active', 'Pending', 'Active', 'Suspended'] as const)[i % 5],
  date: `${(i % 27) + 1} May 2026`,
}));

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletWp: string;
  orders: number;
  type: 'Individual' | 'Employee' | 'Team member';
  status: 'Active' | 'Pending' | 'Suspended';
  date: string;
  [key: string]: unknown;
}

export const USERS: PlatformUser[] = Array.from({ length: 30 }, (_, i) => ({
  id: `USR-${400 + i}`,
  name: NAMES[i % NAMES.length],
  email: `${NAMES[i % NAMES.length].toLowerCase().replace(/\s+/g, '.')}@mail.com`,
  phone: `+234 90${(40000000 + i * 11111).toString().slice(0, 8)}`,
  walletWp: `${(900 + i * 320).toLocaleString()} WP`,
  orders: 1 + (i % 19),
  type: (['Individual', 'Employee', 'Team member'] as const)[i % 3],
  status: (['Active', 'Active', 'Pending', 'Active', 'Suspended'] as const)[i % 5],
  date: `${(i % 27) + 1} May 2026`,
}));

export interface Dispute {
  id: string;
  orderId: string;
  raisedBy: string;
  against: string;
  category: string;
  amount: string;
  status: 'Open' | 'In Review' | 'Resolved' | 'Escalated';
  date: string;
  description: string;
  [key: string]: unknown;
}

export const DISPUTES: Dispute[] = Array.from({ length: 14 }, (_, i) => ({
  id: `DSP-${500 + i}`,
  orderId: ORDERS[i * 2].trackingId,
  raisedBy: NAMES[i % NAMES.length],
  against: NAMES[(i + 9) % NAMES.length],
  category: ['Damaged item', 'Late delivery', 'Missing item', 'Wrong order', 'Billing issue'][i % 5],
  amount: `${(i % 4) * 40 + 60} pts`,
  status: (['Open', 'In Review', 'Resolved', 'Escalated'] as const)[i % 4],
  date: `${(i % 27) + 1} May 2026`,
  description:
    'Customer reports that two shirts came back with stains that were not present at pickup. Requesting a refund of the order points and re-wash of the affected items.',
}));

export interface Txn {
  type: 'Credits' | 'Escrow' | 'Payout' | 'Refund';
  from: string;
  amount: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
  [key: string]: unknown;
}

export const TRANSACTIONS: Txn[] = Array.from({ length: 26 }, (_, i) => {
  const type = (['Credits', 'Escrow', 'Payout', 'Credits', 'Refund'] as const)[i % 5];
  const sign = type === 'Payout' || type === 'Refund' ? '-' : '+';
  return {
    type,
    from: [NAMES[i % NAMES.length], 'CleanFresh Ltd', NAMES[(i + 4) % NAMES.length], 'SparkleWash', 'WashKing'][i % 5],
    amount: `${sign}₦${((i % 7) * 85_000 + 15_500).toLocaleString()}`,
    date: `${(i % 27) + 1} May 2026`,
    status: (['Completed', 'Completed', 'Pending', 'Completed', 'Failed'] as const)[i % 5],
  };
});

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Staff' | 'Dispute Resolver' | 'Finance';
  status: 'Active' | 'Pending';
  date: string;
  lastActive: string;
  [key: string]: unknown;
}

export const ADMINS: Admin[] = Array.from({ length: 12 }, (_, i) => ({
  id: `ADM-${600 + i}`,
  name: NAMES[i % NAMES.length],
  email: `${NAMES[i % NAMES.length].toLowerCase().replace(/\s+/g, '.')}@washermann.com`,
  role: (['Super Admin', 'Staff', 'Dispute Resolver', 'Finance'] as const)[i % 4],
  status: i === 2 ? 'Pending' : 'Active',
  date: `${(i % 27) + 1} May 2026`,
  lastActive: `${(i % 11) + 1}h ago`,
}));

export interface Coupon {
  code: string;
  discount: string;
  usage: string;
  maxUses: number;
  expires: string;
  status: 'Active' | 'Expired';
  [key: string]: unknown;
}

export const COUPONS: Coupon[] = [
  { code: 'WELCOME10', discount: '10% off', usage: '142 / 500', maxUses: 500, expires: '30 Jun 2026', status: 'Active' },
  { code: 'CLEAN25', discount: '25% off', usage: '89 / 200', maxUses: 200, expires: '15 Jun 2026', status: 'Active' },
  { code: 'FIRSTWASH', discount: '500 WP', usage: '311 / 1000', maxUses: 1000, expires: '31 Dec 2026', status: 'Active' },
  { code: 'XMAS24', discount: '15% off', usage: '450 / 450', maxUses: 450, expires: '5 Jan 2026', status: 'Expired' },
  { code: 'CORP5', discount: '5% off', usage: '38 / 300', maxUses: 300, expires: '30 Sep 2026', status: 'Active' },
];

export interface GiftCard {
  code: string;
  valueWp: string;
  buyer: string;
  recipient: string;
  status: 'Redeemed' | 'Active' | 'Expired';
  date: string;
  [key: string]: unknown;
}

export const GIFT_CARDS: GiftCard[] = Array.from({ length: 10 }, (_, i) => ({
  code: `GC-${7000 + i * 137}`,
  valueWp: `${((i % 4) + 1) * 1000} WP`,
  buyer: NAMES[i % NAMES.length],
  recipient: NAMES[(i + 6) % NAMES.length],
  status: (['Active', 'Redeemed', 'Active', 'Expired'] as const)[i % 4],
  date: `${(i % 27) + 1} May 2026`,
}));

export interface VaultItem {
  name: string;
  target: string;
  saved: string;
  members: number;
  matures: string;
  status: 'Active' | 'Matured';
  [key: string]: unknown;
}

export const VAULTS: VaultItem[] = [
  { name: 'Q1 2026 Vault', target: '₦2,000,000', saved: '₦1,450,000', members: 86, matures: '31 Mar 2026', status: 'Matured' },
  { name: 'Q2 2026 Vault', target: '₦2,500,000', saved: '₦980,000', members: 64, matures: '30 Jun 2026', status: 'Active' },
  { name: 'Detergent Fund', target: '₦600,000', saved: '₦455,000', members: 23, matures: '31 Jul 2026', status: 'Active' },
];

export interface Tier {
  name: string;
  monthlyWp: string;
  perks: string;
  companies: number;
  price: string;
  [key: string]: unknown;
}

export const TIERS: Tier[] = [
  { name: 'Basic', monthlyWp: '5,000 WP', perks: 'Standard pickup, 48h turnaround', companies: 14, price: '₦50,000/mo' },
  { name: 'Plus', monthlyWp: '15,000 WP', perks: 'Priority pickup, 24h turnaround', companies: 9, price: '₦135,000/mo' },
  { name: 'Premium', monthlyWp: '40,000 WP', perks: 'Same-day, dedicated rep, ironing included', companies: 4, price: '₦320,000/mo' },
];

export interface Service {
  name: string;
  unit: string;
  points: number;
  active: boolean;
  [key: string]: unknown;
}

export const SERVICES: Service[] = [
  { name: 'Wash & Fold', unit: 'per kg', points: 50, active: true },
  { name: 'Wash & Iron', unit: 'per kg', points: 80, active: true },
  { name: 'Ironing only', unit: 'per item', points: 30, active: true },
  { name: 'Dry Cleaning', unit: 'per item', points: 120, active: true },
  { name: 'Duvet / Bedding', unit: 'per item', points: 200, active: true },
  { name: 'Sneaker Cleaning', unit: 'per pair', points: 150, active: false },
];

export interface ActivityEntry {
  actor: string;
  action: string;
  target: string;
  time: string;
  [key: string]: unknown;
}

export const ACTIVITY_LOG: ActivityEntry[] = [
  { actor: 'Arlene McCoy', action: 'Approved payout', target: '₦171,700 to 12 vendors', time: '2h ago' },
  { actor: 'Esther Howard', action: 'Resolved dispute', target: 'DSP-503', time: '4h ago' },
  { actor: 'Floyd Miles', action: 'Invited admin', target: 'savannah.nguyen@washermann.com', time: '6h ago' },
  { actor: 'Arlene McCoy', action: 'Updated pricing', target: 'Wash & Iron 75 → 80 pts', time: '9h ago' },
  { actor: 'Marvin McKinney', action: 'Deactivated area', target: 'Gbagada', time: '1d ago' },
  { actor: 'Jenny Wilson', action: 'Verified KYC', target: 'WSH-307', time: '1d ago' },
  { actor: 'Esther Howard', action: 'Ran integrity scan', target: 'Full Scan — no issues', time: '2d ago' },
  { actor: 'Arlene McCoy', action: 'Created coupon', target: 'CORP5', time: '3d ago' },
];

/* Chart series used across dashboard / financials. */
export const ORDERS_PER_MONTH = [420, 510, 480, 560, 610, 590, 640, 720, 680, 760, 830, 910];
export const DISPUTES_SERIES = {
  credits: [520, 560, 540, 600, 640, 620, 660, 700, 690, 740, 790, 850],
  payouts: [380, 420, 410, 450, 470, 460, 500, 530, 520, 560, 600, 640],
  escrows: [180, 210, 200, 230, 250, 240, 270, 290, 280, 310, 330, 360],
};
