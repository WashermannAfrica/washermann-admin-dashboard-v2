'use client';

import { useCallback, useEffect, useState } from 'react';
import { GraduationCap, ClipboardList, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { PageKpi, StatBlock } from '@/components/ui/PageKpi';
import { Section, Panel } from '@/components/ui/Section';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs } from '@/components/ui/Tabs';
import { api } from '@/lib/api';
import { apiErr } from '@/lib/apiError';
import type { ApiResponse } from '@/types';

// ─── Types (mirror the API entities) ─────────────────────────────────────────
interface TutorialStep {
  id: string;
  orderIndex: number;
  title: string;
  body: string;
  active: boolean;
}
interface AssessmentQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  active: boolean;
}

const TABS = ['Tutorial steps', 'Assessment questions'] as const;

export default function RepOnboardingPage() {
  const [tab, setTab] = useState<string>(TABS[0]);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<ApiResponse<TutorialStep[]>>('/sales-rep/admin/tutorial-steps'),
      api.get<ApiResponse<AssessmentQuestion[]>>('/sales-rep/admin/questions'),
    ])
      .then(([s, q]) => {
        setSteps([...(s.data.data ?? [])].sort((a, b) => a.orderIndex - b.orderIndex));
        setQuestions(q.data.data ?? []);
        setError('');
      })
      .catch((err) => setError(apiErr(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageKpi
        icon={<GraduationCap size={16} />}
        iconClass="bg-forest text-white"
        label="Sales-rep onboarding"
        value={`${steps.length} steps · ${questions.length} questions`}
      />
      <p className="-mt-3 text-sm text-body">
        The tutorial and assessment every sales rep completes before their referral code is issued.
        Changes here appear in the rep portal immediately. Only <strong>active</strong> items are shown to reps;
        the assessment passes at ≥ 70%.
      </p>

      <Tabs tabs={[...TABS]} active={tab} onChange={setTab} />

      {error && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16 text-primary"><Spinner size="lg" /></div>
      ) : tab === TABS[0] ? (
        <TutorialTab steps={steps} reload={load} onError={setError} />
      ) : (
        <AssessmentTab questions={questions} reload={load} onError={setError} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tutorial steps
// ═══════════════════════════════════════════════════════════════════════════
function TutorialTab({
  steps,
  reload,
  onError,
}: {
  steps: TutorialStep[];
  reload: () => void;
  onError: (m: string) => void;
}) {
  const blank = { orderIndex: '', title: '', body: '', active: true };
  const [modal, setModal] = useState<{ open: boolean; edit?: TutorialStep }>({ open: false });
  const [form, setForm] = useState<{ orderIndex: string; title: string; body: string; active: boolean }>(blank);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmDel, setConfirmDel] = useState<TutorialStep | null>(null);

  function open(edit?: TutorialStep) {
    setFormError('');
    setForm(
      edit
        ? { orderIndex: String(edit.orderIndex), title: edit.title, body: edit.body, active: edit.active }
        : { ...blank, orderIndex: String(steps.length + 1) },
    );
    setModal({ open: true, edit });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const body = {
        orderIndex: form.orderIndex === '' ? undefined : Number(form.orderIndex),
        title: form.title.trim(),
        body: form.body.trim(),
        active: form.active,
      };
      if (modal.edit) await api.patch(`/sales-rep/admin/tutorial-steps/${modal.edit.id}`, body);
      else await api.post('/sales-rep/admin/tutorial-steps', body);
      setModal({ open: false });
      reload();
    } catch (err) {
      setFormError(apiErr(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(s: TutorialStep) {
    try {
      await api.patch(`/sales-rep/admin/tutorial-steps/${s.id}`, { active: !s.active });
      reload();
    } catch (err) {
      onError(apiErr(err));
    }
  }

  async function remove() {
    if (!confirmDel) return;
    try {
      await api.delete(`/sales-rep/admin/tutorial-steps/${confirmDel.id}`);
      setConfirmDel(null);
      reload();
    } catch (err) {
      onError(apiErr(err));
      setConfirmDel(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Total steps" value={String(steps.length)} hint={`${steps.filter((s) => s.active).length} active`} />
        <StatBlock label="Shown to reps" value={String(steps.filter((s) => s.active).length)} hint="active only" />
      </div>

      <Button onClick={() => open()}><Plus size={15} /> Add step</Button>

      {steps.length === 0 ? (
        <p className="py-12 text-center text-sm text-faint">No tutorial steps yet. Add the first step reps will see.</p>
      ) : (
        <div className="space-y-3">
          {steps.map((s) => (
            <Section key={s.id}>
              <Panel>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-section text-xs font-bold text-body">
                      {s.orderIndex}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-bold ${s.active ? 'text-ink' : 'text-faint line-through'}`}>{s.title}</h3>
                        {!s.active && <Badge variant="neutral">Hidden</Badge>}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-body">{s.body}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <ToggleSwitch on={s.active} onClick={() => toggle(s)} />
                    <Button size="sm" variant="ghost" onClick={() => open(s)}><Pencil size={13} /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDel(s)}><Trash2 size={13} className="text-danger" /></Button>
                  </div>
                </div>
              </Panel>
            </Section>
          ))}
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.edit ? 'Edit tutorial step' : 'Add tutorial step'}>
        <form className="space-y-4" onSubmit={save}>
          <Input label="Order" type="number" min={0} required value={form.orderIndex} onChange={(e) => setForm((f) => ({ ...f, orderIndex: e.target.value }))} />
          <Input label="Title" required placeholder="e.g. How you earn" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Textarea label="Body" required rows={5} placeholder="What the rep should read at this step." value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
          <label className="flex items-center gap-3 text-sm text-ink">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4 rounded border-line accent-[#13C490]" />
            Active (shown to reps)
          </label>
          {formError && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{formError}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal({ open: false })}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDelete
        open={!!confirmDel}
        label={confirmDel ? `tutorial step “${confirmDel.title}”` : ''}
        onCancel={() => setConfirmDel(null)}
        onConfirm={remove}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Assessment questions
// ═══════════════════════════════════════════════════════════════════════════
function AssessmentTab({
  questions,
  reload,
  onError,
}: {
  questions: AssessmentQuestion[];
  reload: () => void;
  onError: (m: string) => void;
}) {
  const blank = { prompt: '', options: ['', ''], correctIndex: 0, active: true };
  const [modal, setModal] = useState<{ open: boolean; edit?: AssessmentQuestion }>({ open: false });
  const [form, setForm] = useState<{ prompt: string; options: string[]; correctIndex: number; active: boolean }>(blank);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmDel, setConfirmDel] = useState<AssessmentQuestion | null>(null);

  function open(edit?: AssessmentQuestion) {
    setFormError('');
    setForm(
      edit
        ? { prompt: edit.prompt, options: [...edit.options], correctIndex: edit.correctIndex, active: edit.active }
        : { ...blank, options: ['', ''] },
    );
    setModal({ open: true, edit });
  }

  function setOption(i: number, val: string) {
    setForm((f) => ({ ...f, options: f.options.map((o, idx) => (idx === i ? val : o)) }));
  }
  function addOption() {
    setForm((f) => ({ ...f, options: [...f.options, ''] }));
  }
  function removeOption(i: number) {
    setForm((f) => {
      if (f.options.length <= 2) return f; // keep at least 2
      const options = f.options.filter((_, idx) => idx !== i);
      // keep correctIndex valid after removal
      let correctIndex = f.correctIndex;
      if (i === f.correctIndex) correctIndex = 0;
      else if (i < f.correctIndex) correctIndex = f.correctIndex - 1;
      return { ...f, options, correctIndex };
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const options = form.options.map((o) => o.trim());
    if (options.some((o) => !o)) {
      setFormError('Every option needs text (or remove the empty ones).');
      return;
    }
    if (options.length < 2) {
      setFormError('Add at least two options.');
      return;
    }
    setSaving(true);
    try {
      const body = { prompt: form.prompt.trim(), options, correctIndex: form.correctIndex, active: form.active };
      if (modal.edit) await api.patch(`/sales-rep/admin/questions/${modal.edit.id}`, body);
      else await api.post('/sales-rep/admin/questions', body);
      setModal({ open: false });
      reload();
    } catch (err) {
      setFormError(apiErr(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(q: AssessmentQuestion) {
    try {
      await api.patch(`/sales-rep/admin/questions/${q.id}`, { active: !q.active });
      reload();
    } catch (err) {
      onError(apiErr(err));
    }
  }

  async function remove() {
    if (!confirmDel) return;
    try {
      await api.delete(`/sales-rep/admin/questions/${confirmDel.id}`);
      setConfirmDel(null);
      reload();
    } catch (err) {
      onError(apiErr(err));
      setConfirmDel(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatBlock label="Total questions" value={String(questions.length)} hint={`${questions.filter((q) => q.active).length} active`} />
        <StatBlock label="In the pool" value={String(questions.filter((q) => q.active).length)} hint="active only" />
      </div>

      <Button onClick={() => open()}><Plus size={15} /> Add question</Button>

      {questions.length === 0 ? (
        <p className="py-12 text-center text-sm text-faint">No questions yet. Add the first assessment question.</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q, qi) => (
            <Section key={q.id}>
              <Panel>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold ${q.active ? 'text-ink' : 'text-faint line-through'}`}>
                        {qi + 1}. {q.prompt}
                      </h3>
                      {!q.active && <Badge variant="neutral">Hidden</Badge>}
                    </div>
                    <ul className="mt-2 space-y-1">
                      {q.options.map((o, i) => (
                        <li key={i} className={`flex items-center gap-2 text-sm ${i === q.correctIndex ? 'font-semibold text-forest' : 'text-body'}`}>
                          {i === q.correctIndex ? <Check size={14} className="shrink-0" /> : <span className="w-[14px] shrink-0" />}
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <ToggleSwitch on={q.active} onClick={() => toggle(q)} />
                    <Button size="sm" variant="ghost" onClick={() => open(q)}><Pencil size={13} /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDel(q)}><Trash2 size={13} className="text-danger" /></Button>
                  </div>
                </div>
              </Panel>
            </Section>
          ))}
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.edit ? 'Edit question' : 'Add question'}>
        <form className="space-y-4" onSubmit={save}>
          <Textarea label="Question" required rows={2} placeholder="e.g. When does a customer referral become payable?" value={form.prompt} onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))} />

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">Options <span className="font-normal text-faint">(select the correct one)</span></p>
            {form.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={form.correctIndex === i}
                  onChange={() => setForm((f) => ({ ...f, correctIndex: i }))}
                  className="h-4 w-4 accent-[#13C490]"
                  title="Mark as correct answer"
                />
                <input
                  type="text"
                  required
                  placeholder={`Option ${i + 1}`}
                  value={o}
                  onChange={(e) => setOption(i, e.target.value)}
                  className="h-10 flex-1 rounded-full border border-line bg-section px-4 text-sm text-ink outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={form.options.length <= 2}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-faint hover:bg-section hover:text-danger disabled:opacity-30"
                  title="Remove option"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addOption} className="text-sm font-medium text-primary hover:underline">+ Add option</button>
          </div>

          <label className="flex items-center gap-3 text-sm text-ink">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4 rounded border-line accent-[#13C490]" />
            Active (in the question pool)
          </label>
          {formError && <p className="rounded-xl bg-danger-bg px-4 py-2 text-sm text-danger">{formError}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal({ open: false })}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDelete
        open={!!confirmDel}
        label={confirmDel ? 'this question' : ''}
        onCancel={() => setConfirmDel(null)}
        onConfirm={remove}
      />
    </div>
  );
}

// ─── Shared bits ─────────────────────────────────────────────────────────────
function ToggleSwitch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={on ? 'Active — click to hide' : 'Hidden — click to activate'}
      className={`h-5 w-9 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-line'}`}
    >
      <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );
}

function ConfirmDelete({
  open,
  label,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  label: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title="Delete?">
      <p className="text-sm text-body">
        This permanently deletes {label}. This cannot be undone.
      </p>
      <div className="mt-5 flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="button" variant="danger" className="flex-1" onClick={onConfirm}>Delete</Button>
      </div>
    </Modal>
  );
}
