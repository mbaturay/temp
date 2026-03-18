import { useState, useMemo } from 'react';
import { ArrowRight, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { getInferenceMessage, type IntentData } from '../../../lib/ai';

// ── Constants ─────────────────────────────────────────────────────────────────
const ACTIVITIES = ['skiing', 'snowboarding', 'hiking', 'mountain biking', 'snowshoeing', 'winter running', 'backcountry skiing'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SKILL_LEVELS: IntentData['skillLevel'][] = ['Beginner', 'Intermediate', 'Advanced'];
const GENDER_OPTIONS = ['Women', 'Men'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const BUDGET_OPTIONS = [200, 300, 500, 700, 1000];

// ── Inline field primitives ───────────────────────────────────────────────────
function InlineSelect({
  value, onChange, options, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border-0 border-b-2 bg-transparent focus:outline-none cursor-pointer px-1 pb-0.5 transition-all duration-150
        ${value ? 'border-foreground text-foreground' : 'border-muted-foreground/40 text-muted-foreground'}`}
      style={{ fontWeight: value ? 600 : 400, fontSize: 'inherit', minWidth: '7rem' }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function InlineInput({
  value, onChange, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`border-0 border-b-2 bg-transparent focus:outline-none px-1 pb-0.5 w-28 transition-all duration-150
        ${value ? 'border-foreground text-foreground' : 'border-muted-foreground/40 placeholder:text-muted-foreground'}`}
      style={{ fontWeight: value ? 600 : 400, fontSize: 'inherit' }}
    />
  );
}

// ── Toggle button ─────────────────────────────────────────────────────────────
function ToggleBtn({
  label, selected, onClick, wide,
}: {
  label: string; selected: boolean; onClick: () => void; wide?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border text-sm transition-all duration-150 ${wide ? 'min-w-[5.5rem]' : ''}
        ${selected
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-card hover:border-foreground/50 hover:bg-accent'
        }`}
      style={{ fontWeight: selected ? 500 : 400 }}
    >
      {label}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  onSubmit: (data: IntentData) => void;
}

export function IntentBuilder({ onSubmit }: Props) {
  const [activity, setActivity] = useState('');
  const [location, setLocation] = useState('');
  const [month, setMonth] = useState('');
  const [skillLevel, setSkillLevel] = useState<IntentData['skillLevel'] | ''>('');
  const [gender, setGender] = useState('');
  const [size, setSize] = useState('');
  const [budget, setBudget] = useState(500);

  // Live inference preview — only once all 4 core fields are filled
  const inferenceMsg = useMemo(() => {
    if (activity && location && month && skillLevel) {
      return getInferenceMessage({ activity, location, month, skillLevel });
    }
    return null;
  }, [activity, location, month, skillLevel]);

  const isComplete = !!(activity && location && month && skillLevel && size);

  const handleSubmit = () => {
    if (!isComplete) return;
    onSubmit({ activity, location, month, skillLevel: skillLevel as IntentData['skillLevel'], gender, size, budget });
  };

  return (
    <div className="min-h-screen pt-14 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        {/* Page title */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">AI-guided shopping</p>
          <h1>Tell us about your trip</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Fill in the details below and we'll build a personalised bundle.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8">
          {/* ── Fill-in-the-blank sentence ── */}
          <div className="mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-5">Your trip</p>
            <div className="text-xl leading-[2.8] text-foreground">
              I want to go{' '}
              <InlineSelect value={activity} onChange={setActivity} options={ACTIVITIES} placeholder="choose activity" />
              {' '}in{' '}
              <InlineInput value={location} onChange={setLocation} placeholder="location" />
              {' '}around{' '}
              <InlineSelect value={month} onChange={setMonth} options={MONTHS} placeholder="month" />
              {' '}and I consider myself a{' '}
              <InlineSelect
                value={skillLevel}
                onChange={(v) => setSkillLevel(v as IntentData['skillLevel'])}
                options={SKILL_LEVELS}
                placeholder="skill level"
              />
              .
            </div>
          </div>

          {/* ── Live inference preview ── */}
          {inferenceMsg && (
            <div className="flex items-start gap-2 mt-4 mb-2 px-3 py-2.5 rounded-lg bg-muted/60 text-sm text-muted-foreground">
              <Info className="size-3.5 mt-0.5 shrink-0" />
              <span className="italic">{inferenceMsg}</span>
            </div>
          )}

          <div className="my-6 border-t border-border" />

          {/* ── Gender ── */}
          <div className="mb-6">
            <p className="text-sm mb-3" style={{ fontWeight: 500 }}>Shopping for</p>
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((g) => (
                <ToggleBtn key={g} label={g} selected={gender === g} onClick={() => setGender(g)} wide />
              ))}
            </div>
          </div>

          {/* ── Size ── */}
          <div className="mb-6">
            <p className="text-sm mb-3" style={{ fontWeight: 500 }}>My size</p>
            <div className="flex gap-2">
              {SIZES.map((s) => (
                <ToggleBtn key={s} label={s} selected={size === s} onClick={() => setSize(s)} />
              ))}
            </div>
          </div>

          {/* ── Budget ── */}
          <div>
            <p className="text-sm mb-3" style={{ fontWeight: 500 }}>Budget</p>
            <div className="flex flex-wrap gap-2">
              {BUDGET_OPTIONS.map((b) => (
                <ToggleBtn
                  key={b}
                  label={b >= 1000 ? '$1,000+' : `$${b}`}
                  selected={budget === b}
                  onClick={() => setBudget(b)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Example hint ── */}
        <p className="mt-3 text-xs text-muted-foreground italic text-center">
          e.g. "I want to go skiing in Whistler around January and I consider myself a beginner."
        </p>

        {/* ── CTA ── */}
        <div className="mt-6">
          <Button
            size="lg"
            className="w-full gap-2 h-12"
            disabled={!isComplete}
            onClick={handleSubmit}
          >
            Build my bundle
            <ArrowRight className="size-4" />
          </Button>
          {!isComplete && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Complete all fields to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
