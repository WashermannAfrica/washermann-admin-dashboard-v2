'use client';

import { useState } from 'react';
import {
  Search, ChevronRight, ChevronLeft, CalendarClock, PackageSearch, CreditCard,
  Shirt, WashingMachine, ShieldCheck, Building2, Wrench, MessageCircle,
  ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, SelectField } from '@/components/ui/Input';
import { HelpFooter } from '@/components/layout/HelpFooter';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

interface Topic {
  icon: React.ReactNode;
  title: string;
  desc: string;
  articles: string[];
}

const TOPICS: Topic[] = [
  { icon: <CalendarClock size={16} />, title: 'Scheduling pickups', desc: 'Booking, rescheduling, managing pickup and delivery times.', articles: ['How to book a pickup', 'Reschedule or cancel a pickup', 'Set recurring pickup times', 'Pickup windows explained'] },
  { icon: <PackageSearch size={16} />, title: 'Orders and tracking', desc: 'Following order progress, delays, confirmations, and delivery updates.', articles: ['Track an order in real time', 'Understanding order statuses', 'What to do about a delayed order', 'Confirming delivery'] },
  { icon: <CreditCard size={16} />, title: 'Payments and benefits', desc: 'Using company credits, wallet balances, coupons, and payment methods.', articles: ['How WashPoints work', 'Apply a coupon code', 'Company credit and benefits', 'Top up your wallet'] },
  { icon: <Shirt size={16} />, title: 'Laundry care', desc: 'Wash preferences, delicate items, missing clothing, and damage reports.', articles: ['Set wash preferences', 'Report a missing item', 'Report damage', 'Handling delicates'] },
  { icon: <WashingMachine size={16} />, title: 'Washerman services', desc: 'Working with assigned washermen, ratings, availability, and support.', articles: ['How washermen are assigned', 'Rate your washerman', 'Washerman availability', 'Request a different washerman'] },
  { icon: <ShieldCheck size={16} />, title: 'Account and security', desc: 'Passwords, notifications, profile settings, and account access.', articles: ['Change your password', 'Manage active sessions', 'Update notification preferences', 'Two-factor authentication'] },
  { icon: <Building2 size={16} />, title: 'Companies and employee benefits', desc: 'Team budgets, benefit usage, employee access, and reporting controls.', articles: ['Set up employee benefits', 'Manage team budgets', 'Add or remove employees', 'Benefit usage reports'] },
  { icon: <Wrench size={16} />, title: 'Platform and operations', desc: 'Vendor management, payouts, disputes, audits, and operational tools.', articles: ['Process vendor payouts', 'Resolve a dispute', 'Run an integrity scan', 'Operational best practices'] },
];

export default function HelpPage() {
  const { user } = useAuthStore();
  const firstName = (user?.fullName ?? 'Chiamaka').split(' ')[0];

  const [contactOpen, setContactOpen] = useState(false);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [article, setArticle] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

  function openTopic(t: Topic) { setTopic(t); setArticle(null); setFeedback(null); }
  function closeTopic() { setTopic(null); setArticle(null); setFeedback(null); }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Heading */}
      <div className="pt-4 text-center">
        <h1 className="text-3xl font-bold text-ink">{firstName}, How can we help?</h1>
        <p className="mt-2 text-[13px] text-body">Find answers, support, and guidance whenever you need it.</p>
        <div className="relative mx-auto mt-5 w-72">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
          <input
            placeholder="Search help topics…"
            className="h-9 w-full rounded-full border border-line bg-white pl-10 pr-4 text-[13px] placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Topics grid */}
      <div className="mt-8 rounded-3xl bg-section p-5">
        <h2 className="px-1 pb-4 text-sm font-bold text-ink">Explore all topics</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((t) => (
            <button key={t.title} onClick={() => openTopic(t)} className="rounded-2xl bg-white p-5 text-left transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-soft text-forest">{t.icon}</span>
                <ChevronRight size={15} className="text-faint" />
              </div>
              <p className="mt-6 text-sm font-bold text-ink">{t.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-faint">{t.desc}</p>
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
                key={a}
                onClick={() => { setArticle(a); setFeedback(null); }}
                className="flex w-full items-center justify-between rounded-2xl border border-line px-4 py-3.5 text-left transition-colors hover:bg-section"
              >
                <span className="text-[13px] font-medium text-ink">{a}</span>
                <ChevronRight size={15} className="text-faint" />
              </button>
            ))}
          </div>
        )}
        {topic && article && (
          <div>
            <button onClick={() => setArticle(null)} className="mb-4 flex items-center gap-1 text-[13px] font-medium text-forest">
              <ChevronLeft size={15} /> Back to {topic.title}
            </button>
            <h3 className="text-lg font-bold text-ink">{article}</h3>
            <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-body">
              <p>Follow the steps below to {article.toLowerCase()}. This guide walks you through everything you need from the admin dashboard.</p>
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>Open the relevant section from the left sidebar.</li>
                <li>Use the search and filters to find the record you need.</li>
                <li>Click the action button and confirm the change.</li>
                <li>You&apos;ll see a confirmation once it&apos;s done.</li>
              </ol>
              <p>If anything looks off, you can always reach the support team directly.</p>
            </div>

            {/* Feedback */}
            <div className="mt-6 flex items-center gap-4 border-t border-line pt-5">
              <p className="text-[13px] text-body">Was this article helpful?</p>
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

      {/* Contact Support — matches Contact Support.png */}
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
