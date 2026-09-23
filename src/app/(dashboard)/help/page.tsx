'use client';

import { useMemo, useState } from 'react';
import {
  Search, ChevronRight, ChevronLeft, CalendarClock, PackageSearch, CreditCard,
  Shirt, WashingMachine, ShieldCheck, Building2, Wrench, MessageCircle, MapPin,
  ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, SelectField } from '@/components/ui/Input';
import { HelpFooter } from '@/components/layout/HelpFooter';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

interface Article {
  title: string;
  path?: string;     // where to do it, e.g. 'Operations › Orders' (optional)
  summary: string;
  steps: string[];
  tips?: string[];
}
interface Topic {
  icon: React.ReactNode;
  title: string;
  desc: string;
  articles: Article[];
}

const TOPICS: Topic[] = [
  {
    icon: <CalendarClock size={16} />,
    title: 'Scheduling pickups',
    desc: 'Booking, rescheduling, managing pickup and delivery times.',
    articles: [
      {
        title: 'How to book a pickup',
        path: 'Customer app › New order',
        summary: 'Create an order and choose when the rep collects the laundry.',
        steps: [
          'The customer opens the app and starts a new order, choosing the service (Wash & Fold, Wash & Iron, or a bundle).',
          'They add items or a bag, then enter the pickup address — the map pin sets the coordinates used to match an area and price transport.',
          'They pick a pickup date and time window and review the total (items + transport).',
          'They confirm payment (wallet, gift card, card, or a shared sponsor link). The order then starts matching a rep.',
        ],
        tips: ['As an admin you can see every booked order under Orders, including its scheduled pickup time and status.'],
      },
      {
        title: 'Reschedule or cancel a pickup',
        path: 'Customer app / Orders',
        summary: 'Change or cancel an order before the rep has collected the clothes.',
        steps: [
          'A customer can reschedule or cancel from the order while it is still before pickup (up to the point the rep collects).',
          'Cancelling a paid order refunds the WashPoints to the wallet and releases the escrow; an unpaid draft is simply dropped.',
          'From the admin, open the order under Orders to see its current status and history if a customer asks for help.',
        ],
        tips: ['Once a rep has collected the clothes, the order can no longer be cancelled by the customer — use Disputes if there is an issue.'],
      },
      {
        title: 'Set recurring pickup times',
        path: 'Customer app › Schedule',
        summary: 'Let a customer repeat a pickup on a regular cadence.',
        steps: [
          'When booking, the customer chooses a recurring option (e.g. weekly) and the preferred day and time window.',
          'Each cycle generates a fresh order at the chosen time, matched and priced like any other.',
          'They can pause or stop the recurring schedule at any time from their schedule settings.',
        ],
      },
      {
        title: 'Pickup windows explained',
        path: 'Operations › Orders',
        summary: 'What the pickup/delivery time windows mean and how the SLA is set.',
        steps: [
          'A pickup window is the time range the rep aims to arrive within, not an exact minute.',
          'The delivery deadline is derived from the scheduled pickup plus the configured turnaround time.',
          'On-time performance against these windows feeds the rep scoring used for matching.',
        ],
        tips: ['The turnaround hours are a platform setting under Settings.'],
      },
    ],
  },
  {
    icon: <PackageSearch size={16} />,
    title: 'Orders and tracking',
    desc: 'Following order progress, delays, confirmations, and delivery updates.',
    articles: [
      {
        title: 'Track an order in real time',
        path: 'Operations › Orders',
        summary: 'Find any order and follow its live status and history.',
        steps: [
          'Open Orders from the sidebar and search by order reference or customer, or filter by Status / Area / Service.',
          'Click a row to open the order — you\'ll see the items, pricing snapshot, the assigned rep and vendor, and the full status history.',
          'The status updates as the rep and vendor progress the job; the customer sees the same journey in their app.',
        ],
      },
      {
        title: 'Understanding order statuses',
        path: 'Operations › Orders',
        summary: 'What each stage means, in order.',
        steps: [
          'Pending payment — a draft that has not been paid yet; nothing is charged and no one is assigned.',
          'Paid → Broadcasting rep → Rep assigned → Broadcasting vendor → Vendor assigned — payment is escrowed and the order is being matched.',
          'Scheduled → Picked up → With vendor → In progress → Ready for delivery → Rep collected → Out for delivery → Delivered — the fulfilment journey.',
          'Completed — confirmed by the customer (or auto-confirmed); escrow is released and everyone is paid.',
          'Delivery failed / Abandoned / Cancelled / Disputed — exception states handled from Compliance or Disputes.',
        ],
      },
      {
        title: 'What to do about a delayed order',
        path: 'Operations › Orders',
        summary: 'Spot a stuck order and move it forward.',
        steps: [
          'Open the order and check the status history for the last step and its timestamp, and whether a rep/vendor is assigned.',
          'If it is stuck broadcasting with no acceptance, it will escalate for manual assignment — assign a rep or vendor from the order/assignment tools.',
          'Compare the delivery deadline to now to judge urgency, and reach the assigned rep or vendor via Live Support if needed.',
        ],
      },
      {
        title: 'Confirming delivery',
        path: 'Operations › Orders',
        summary: 'How an order is completed and escrow released.',
        steps: [
          'After the rep marks the order Delivered, the customer confirms receipt in their app to complete it.',
          'If the customer does not confirm, the order auto-completes after the configured window so funds are never stuck.',
          'On completion, escrow is released to the vendor and rep and the four receipts are generated.',
        ],
      },
    ],
  },
  {
    icon: <CreditCard size={16} />,
    title: 'Payments and benefits',
    desc: 'Using company credits, wallet balances, coupons, and payment methods.',
    articles: [
      {
        title: 'How WashPoints work',
        path: 'Washer-points',
        summary: 'WashPoints are the in-app currency used to pay for orders.',
        steps: [
          'Customers buy WashPoints (top-up) at the spend conversion rate, and orders are charged in WashPoints held in escrow until delivery.',
          'Vendors and reps earn WashPoints, converted to Naira at the payout rate when they cash out.',
          'As an admin, set both rates under Washer-points / Settings, and use the floating calculator to convert WP ⇄ ₦ anywhere.',
        ],
        tips: ['Every ₦ figure in the app has a WashPoints equivalent and vice-versa.'],
      },
      {
        title: 'Apply a coupon or gift card',
        path: 'Customer app › Checkout',
        summary: 'Reduce or cover an order total with a code.',
        steps: [
          'At checkout the customer enters a gift-card code to top up their wallet before paying.',
          'Any promotion applied to a bundle is reflected in that bundle\'s price.',
          'From the admin, gift cards are managed with the wallet/vault tools; a redeemed card credits the customer\'s wallet.',
        ],
      },
      {
        title: 'Company credit and benefits',
        path: 'People & Partners › Companies',
        summary: 'How company-funded laundry works for employees.',
        steps: [
          'A company funds a wallet; employees draw on the company benefit when they place orders.',
          'Open Companies to manage a company, its wallet, and its employees.',
          'Benefit usage is visible per company for reporting.',
        ],
      },
      {
        title: 'Top up a wallet',
        path: 'Customer app › Wallet',
        summary: 'Add WashPoints to a wallet via Paystack.',
        steps: [
          'The customer chooses an amount and pays via the Paystack checkout; the WashPoints land in their wallet on success.',
          'A separate per-order card link or sponsor link can also fund a specific order without a wallet top-up first.',
          'From the admin you can see top-up transactions in the financial records.',
        ],
      },
    ],
  },
  {
    icon: <Shirt size={16} />,
    title: 'Laundry care',
    desc: 'Wash preferences, delicate items, missing clothing, and damage reports.',
    articles: [
      {
        title: 'Set wash preferences',
        path: 'Customer app › Order items',
        summary: 'Per-item handling instructions carried to the vendor.',
        steps: [
          'When adding items, the customer can flag dry cleaning (on eligible items only) or stain removal, and add a note per item.',
          'These are handling instructions passed to the vendor — dry cleaning and stain removal carry no extra charge.',
          'The catalogue controls which items are dry-clean eligible (Catalogue).',
        ],
      },
      {
        title: 'Report a missing item',
        path: 'Operations › Disputes',
        summary: 'Raise and resolve a missing-garment claim.',
        steps: [
          'The customer reports the missing item against the order within the claim window.',
          'It becomes a dispute — open Disputes to review the order, garment log and evidence.',
          'Resolve it; any compensation is handled via a refund (Financials) or a vendor deduction (Compliance).',
        ],
      },
      {
        title: 'Report damage',
        path: 'Operations › Disputes',
        summary: 'Handle a damaged-garment claim with the liability rules.',
        steps: [
          'The customer submits a damage claim with photos against the order.',
          'Review it under Disputes; garment liability is capped per item and per order per the vendor agreement.',
          'If upheld, compensate the customer and, where the vendor is at fault, raise an earnings deduction with notice.',
        ],
      },
      {
        title: 'Handling delicates',
        path: 'Customer app › Order items',
        summary: 'Make sure delicate garments get the right treatment.',
        steps: [
          'The customer flags delicate items using the per-item note and, where relevant, the dry-clean option.',
          'The instruction is shown to the assigned vendor with the order.',
          'For high-value delicates, encourage customers to note them clearly so the vendor handles them appropriately.',
        ],
      },
    ],
  },
  {
    icon: <WashingMachine size={16} />,
    title: 'Washerman services',
    desc: 'Working with assigned washermen, ratings, availability, and support.',
    articles: [
      {
        title: 'How washermen are assigned',
        path: 'Operations › Orders',
        summary: 'Automatic matching vs. the customer choosing a vendor.',
        steps: [
          'In automatic allocation, after a rep accepts, the order is broadcast to scored vendors in the area who accept it.',
          'In Choose-Washerman, the customer picked a specific vendor at checkout and the order is pinned directly to them.',
          'If no vendor accepts, the order escalates for manual assignment.',
        ],
      },
      {
        title: 'Rate your washerman',
        path: 'Customer app › After delivery',
        summary: 'Ratings feed vendor scoring and quality control.',
        steps: [
          'After completion the customer rates the vendor (and rep).',
          'Ratings roll up into the vendor\'s 30-day average, visible on the vendor in Washerman.',
          'Low ratings can trigger review and affect future matching.',
        ],
      },
      {
        title: 'Washerman availability',
        path: 'People & Partners › Washerman',
        summary: 'Availability controls whether a vendor receives orders.',
        steps: [
          'A vendor toggles their availability; only available, verified vendors are matched.',
          'Open Washerman to see each vendor\'s availability and verification status.',
          'A suspended vendor is not matched regardless of availability.',
        ],
      },
      {
        title: 'Request a different washerman',
        path: 'Operations › Orders / Disputes',
        summary: 'Reassign an order to another vendor when needed.',
        steps: [
          'If a customer needs a different vendor before work starts, reassign the order to another vendor from the order/assignment tools.',
          'If the issue is quality or conduct, log it — repeated issues feed vendor review and possible suspension.',
          'For a dispute after the fact, handle it under Disputes.',
        ],
      },
    ],
  },
  {
    icon: <ShieldCheck size={16} />,
    title: 'Account and security',
    desc: 'Passwords, notifications, profile settings, and account access.',
    articles: [
      {
        title: 'Change your password',
        path: 'Profile / Settings',
        summary: 'Update your admin account password.',
        steps: [
          'Open your profile/account settings from the top-right menu.',
          'Enter your current password and your new password, then save.',
          'If you\'re locked out, use the password-reset link on the sign-in page to receive a reset code.',
        ],
      },
      {
        title: 'Manage active sessions',
        path: 'Profile / Settings',
        summary: 'Keep your account access under control.',
        steps: [
          'Sessions use short-lived tokens that refresh automatically while you work.',
          'Sign out from the top-right menu to end your session on this device.',
          'If you suspect unauthorised access, change your password — that invalidates existing access.',
        ],
      },
      {
        title: 'Update notification preferences',
        path: 'System › Settings',
        summary: 'Control which notifications go out and how they read.',
        steps: [
          'Notification wording is managed centrally under Templates (email, SMS, push, in-app).',
          'Edit a template to change its content, or use Sync brand defaults to refresh them all.',
          'Per-user delivery preferences are handled in account settings.',
        ],
      },
      {
        title: 'Two-factor authentication',
        path: 'Profile / Settings',
        summary: 'Add a second step to protect sensitive admin actions.',
        steps: [
          'Where enabled, turn on two-factor from your account security settings and follow the prompts.',
          'Keep your recovery method up to date so you don\'t get locked out.',
          'Encourage all staff with money- or data-affecting roles to enable it.',
        ],
      },
    ],
  },
  {
    icon: <Building2 size={16} />,
    title: 'Companies and employee benefits',
    desc: 'Team budgets, benefit usage, employee access, and reporting controls.',
    articles: [
      {
        title: 'Set up employee benefits',
        path: 'People & Partners › Companies',
        summary: 'Onboard a company and enable laundry benefits for its staff.',
        steps: [
          'Open Companies and create or open the company.',
          'Fund the company wallet and configure how employees draw on the benefit.',
          'Invite or add employees so they can place company-funded orders.',
        ],
      },
      {
        title: 'Manage team budgets',
        path: 'People & Partners › Companies',
        summary: 'Control how much the company spends on benefits.',
        steps: [
          'Top up the company wallet to set the available budget.',
          'Employee orders draw down the wallet; monitor the balance on the company page.',
          'Top up again as needed to keep benefits active.',
        ],
      },
      {
        title: 'Add or remove employees',
        path: 'People & Partners › Companies',
        summary: 'Manage who can use the company benefit.',
        steps: [
          'Open the company and go to its employees.',
          'Add an employee to grant benefit access, or remove one to revoke it.',
          'Removed employees keep their personal wallet but lose the company benefit.',
        ],
      },
      {
        title: 'Benefit usage reports',
        path: 'People & Partners › Companies',
        summary: 'See how the benefit is being used.',
        steps: [
          'Open the company to view its wallet activity and employee usage.',
          'Use the financial records for a fuller picture of spend over time.',
        ],
      },
    ],
  },
  {
    icon: <Wrench size={16} />,
    title: 'Platform and operations',
    desc: 'Vendor management, payouts, disputes, audits, and operational tools.',
    articles: [
      {
        title: 'Process vendor and rep payouts',
        path: 'Financials',
        summary: 'Review, hold, and release earnings payouts.',
        steps: [
          'Open Financials to see payout requests and balances.',
          'Use Hold to pause a payout under investigation (with a reason) — it auto-releases after the withholding window if nothing is proven.',
          'Use Release to send a payout once it\'s cleared.',
        ],
        tips: ['Vendors are paid their own approved price per garment; reps earn their commission plus transport (capped at the estimate).'],
      },
      {
        title: 'Resolve a dispute',
        path: 'Operations › Disputes',
        summary: 'Work a case from claim to resolution.',
        steps: [
          'Open Disputes and select the case to see its timeline and evidence.',
          'Decide the outcome, communicating with the parties as needed.',
          'Apply any refund (Financials) or vendor deduction (Compliance) that the resolution requires.',
        ],
      },
      {
        title: 'Run compliance actions',
        path: 'Operations › Compliance',
        summary: 'Deductions, suspensions, and abandoned-order disposals in one place.',
        steps: [
          'Deductions — raise a substantiated claim against a vendor (search them by name); they get a response window before it applies.',
          'Suspensions — issue a notice or an immediate suspension for a vendor or rep, then enforce, withdraw, or decide a review.',
          'Abandoned — record the disposal outcome for laundry a customer never collected.',
        ],
        tips: ['Vendor and rep fields are name-search autocompletes — no need to paste a UUID.'],
      },
      {
        title: 'Review the audit log',
        path: 'System › Audit Log',
        summary: 'Trace who changed what, and when.',
        steps: [
          'Open Audit Log to see money- and record-affecting actions across the platform.',
          'Filter or search to trace a specific change or the person who made it.',
          'Use it to investigate discrepancies and confirm sensitive actions.',
        ],
      },
    ],
  },
];

export default function HelpPage() {
  const { user } = useAuthStore();
  const firstName = (user?.fullName ?? 'there').split(' ')[0];

  const [contactOpen, setContactOpen] = useState(false);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return TOPICS;
    return TOPICS
      .map((t) => {
        const topicHit = t.title.toLowerCase().includes(query) || t.desc.toLowerCase().includes(query);
        const articles = t.articles.filter(
          (a) => a.title.toLowerCase().includes(query) || a.summary.toLowerCase().includes(query),
        );
        if (topicHit) return t;
        if (articles.length) return { ...t, articles };
        return null;
      })
      .filter((t): t is Topic => t !== null);
  }, [q]);

  function openTopic(t: Topic) { setTopic(t); setArticle(null); setFeedback(null); }
  function closeTopic() { setTopic(null); setArticle(null); setFeedback(null); }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Heading */}
      <div className="pt-4 text-center">
        <h1 className="text-3xl font-bold text-ink">{firstName}, how can we help?</h1>
        <p className="mt-2 text-[13px] text-body">Step-by-step guides for running the Washermann admin.</p>
        <div className="relative mx-auto mt-5 w-72">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search help topics…"
            className="h-9 w-full rounded-full border border-line bg-white pl-10 pr-4 text-[13px] placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Topics grid */}
      <div className="mt-8 rounded-3xl bg-section p-5">
        <h2 className="px-1 pb-4 text-sm font-bold text-ink">
          {q.trim() ? `Results for “${q.trim()}”` : 'Explore all topics'}
        </h2>
        {filtered.length === 0 ? (
          <p className="px-1 pb-2 text-[13px] text-faint">No topics match your search. Try a different term or contact support.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <button key={t.title} onClick={() => openTopic(t)} className="rounded-2xl bg-white p-5 text-left transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-soft text-forest">{t.icon}</span>
                  <ChevronRight size={15} className="text-faint" />
                </div>
                <p className="mt-6 text-sm font-bold text-ink">{t.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-faint">{t.desc}</p>
                <p className="mt-3 text-[11px] font-medium text-forest">{t.articles.length} guide{t.articles.length === 1 ? '' : 's'}</p>
              </button>
            ))}
            {/* Still need help — dark green card */}
            <button onClick={() => setContactOpen(true)} className="rounded-2xl bg-forest p-5 text-left text-white transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-primary"><MessageCircle size={16} /></span>
                <ChevronRight size={15} className="text-white/60" />
              </div>
              <p className="mt-6 text-sm font-bold">Still need help?</p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/70">
                Chat with support, contact your washerman, or reach us directly on WhatsApp.
              </p>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <HelpFooter />

      {/* Topic / article modal */}
      <Modal open={!!topic} onClose={closeTopic} title={topic?.title ?? ''} wide>
        {topic && !article && (
          <div className="space-y-2">
            <p className="mb-3 text-[13px] text-body">{topic.desc}</p>
            {topic.articles.map((a) => (
              <button
                key={a.title}
                onClick={() => { setArticle(a); setFeedback(null); }}
                className="flex w-full items-center justify-between rounded-2xl border border-line px-4 py-3.5 text-left transition-colors hover:bg-section"
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-ink">{a.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-faint">{a.summary}</span>
                </span>
                <ChevronRight size={15} className="shrink-0 text-faint" />
              </button>
            ))}
          </div>
        )}
        {topic && article && (
          <div>
            <button onClick={() => setArticle(null)} className="mb-4 flex items-center gap-1 text-[13px] font-medium text-forest">
              <ChevronLeft size={15} /> Back to {topic.title}
            </button>

            {article.path && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-soft px-3 py-1 text-[11px] font-medium text-forest">
                <MapPin size={11} /> {article.path}
              </span>
            )}
            <h3 className="mt-3 text-lg font-bold text-ink">{article.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-body">{article.summary}</p>

            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-faint">Steps</p>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-body">
              {article.steps.map((s, idx) => <li key={idx}>{s}</li>)}
            </ol>

            {article.tips && article.tips.length > 0 && (
              <div className="mt-5 rounded-2xl bg-section p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-faint">Good to know</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-body">
                  {article.tips.map((t, idx) => <li key={idx}>{t}</li>)}
                </ul>
              </div>
            )}

            {/* Feedback */}
            <div className="mt-6 flex items-center gap-4 border-t border-line pt-5">
              <p className="text-[13px] text-body">Was this guide helpful?</p>
              {(['yes', 'no'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFeedback(v)}
                  className={cn(
                    'flex h-9 items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-colors',
                    feedback === v ? 'border-primary bg-mint-soft text-forest' : 'border-line bg-white text-body hover:bg-section',
                  )}
                >
                  {v === 'yes' ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />} {v === 'yes' ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
            {feedback === 'yes' && <p className="mt-3 text-xs text-success">Thanks for your feedback! 🎉</p>}
            {feedback === 'no' && (
              <p className="mt-3 text-xs text-faint">
                Sorry to hear that — tell us what was missing via{' '}
                <button onClick={() => { closeTopic(); setContactOpen(true); }} className="font-semibold text-forest underline underline-offset-2">Contact Support</button>.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Contact Support */}
      <Modal open={contactOpen} onClose={() => setContactOpen(false)} title="Contact Support">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setContactOpen(false); }}>
          <SelectField label="Topic" required defaultValue="">
            <option value="" disabled>Select a topic</option>
            {TOPICS.map((t) => <option key={t.title}>{t.title}</option>)}
          </SelectField>
          <Input label="Subject" required placeholder="Briefly describe the issue" />
          <Textarea label="Message" required placeholder="Give us as much detail as you can" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setContactOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Send Message</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
