import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Plus, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';

// ── Constants ──────────────────────────────────────────────────────────────────
const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

const TERRAIN_OPTIONS = [
  'Rocky', 'Steep', 'Flat',
  'Ocean', 'River', 'Lake',
  'Sandy', 'Indoors', 'Vertical',
  'Rapids',
];

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Expert'] as const;

const SECTIONS = ["Men's", "Women's", 'Unisex'];

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const PANTS_SIZES = ['26', '28', '30', '32', '34', '36', '38', '40', '42'];

// Shoe size conversion table (industry standard men's sizing)
type SizeSystem = 'US' | 'EU' | 'UK';

interface ShoeRow {
  US: string;
  EU: string;
  UK: string;
}

const SHOE_SIZE_TABLE: ShoeRow[] = [
  { US: '6',    EU: '38.5', UK: '5.5' },
  { US: '6.5',  EU: '39',   UK: '6' },
  { US: '7',    EU: '40',   UK: '6.5' },
  { US: '7.5',  EU: '40.5', UK: '7' },
  { US: '8',    EU: '41',   UK: '7.5' },
  { US: '8.5',  EU: '42',   UK: '8' },
  { US: '9',    EU: '42.5', UK: '8.5' },
  { US: '9.5',  EU: '43',   UK: '9' },
  { US: '10',   EU: '44',   UK: '9.5' },
  { US: '10.5', EU: '44.5', UK: '10' },
  { US: '11',   EU: '45',   UK: '10.5' },
  { US: '11.5', EU: '45.5', UK: '11' },
  { US: '12',   EU: '46',   UK: '11.5' },
  { US: '13',   EU: '47.5', UK: '12.5' },
  { US: '14',   EU: '48.5', UK: '13.5' },
];

// ── Types ──────────────────────────────────────────────────────────────────────
export interface AdventureFormData {
  initialInput: string;
  description: string;
  location: string;
  season: string;
  terrain: string[];
  experienceLevel: 'Beginner' | 'Intermediate' | 'Expert';
  section: string;
  shirtSize: string;
  pantsSize: string;
  shoeSize: string; // always stored as US
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AdventureFormData) => void;
  initialInput: string;
}

// ── Chip button ──────────────────────────────────────────────────────────────
function Chip({
  label,
  selected,
  onClick,
  wide,
  showCheck,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  wide?: boolean;
  showCheck?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 rounded-lg border text-sm transition-all duration-150 ${
        wide ? 'min-w-[8rem]' : ''
      } ${
        selected
          ? 'border-foreground bg-foreground/5 text-foreground'
          : 'border-border bg-background hover:border-foreground/30'
      }`}
      style={{ fontWeight: selected ? 500 : 400 }}
    >
      {label}
      {showCheck && selected && (
        <Check className="absolute top-2 right-2 size-3.5 text-foreground" />
      )}
    </button>
  );
}

// ── Select dropdown ─────────────────────────────────────────────────────────
function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none px-3 py-2.5 pr-9 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer ${
          !value ? 'text-muted-foreground' : 'text-foreground'
        }`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// ── Step 1: Plan Your Adventure ──────────────────────────────────────────────
function Step1({
  description,
  setDescription,
  location,
  setLocation,
  season,
  setSeason,
  terrain,
  setTerrain,
  experienceLevel,
  setExperienceLevel,
}: {
  description: string;
  setDescription: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  season: string;
  setSeason: (v: string) => void;
  terrain: string[];
  setTerrain: (v: string[]) => void;
  experienceLevel: string;
  setExperienceLevel: (v: 'Beginner' | 'Intermediate' | 'Expert') => void;
}) {
  const toggleTerrain = (t: string) => {
    setTerrain(
      terrain.includes(t) ? terrain.filter((x) => x !== t) : [...terrain, t]
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Description */}
      <div>
        <label className="text-sm mb-2 block" style={{ fontWeight: 500 }}>
          Describe your adventure
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., I want to go backpacking in Olympic National Park in October"
          className="w-full h-24 px-3 py-2.5 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Location */}
      <div>
        <label className="text-sm mb-2 block" style={{ fontWeight: 500 }}>
          Where are you going?
        </label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Start typing a location..."
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Season */}
      <div>
        <label className="text-sm mb-2 block" style={{ fontWeight: 500 }}>
          When are you going?
        </label>
        <div className="flex gap-2">
          {SEASONS.map((s) => (
            <Chip
              key={s}
              label={s}
              selected={season === s}
              onClick={() => setSeason(s)}
              wide
            />
          ))}
        </div>
      </div>

      {/* Terrain */}
      <div>
        <label className="text-sm mb-2 block" style={{ fontWeight: 500 }}>
          What's the terrain like at your destination?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {TERRAIN_OPTIONS.map((t) => (
            <Chip
              key={t}
              label={t}
              selected={terrain.includes(t)}
              onClick={() => toggleTerrain(t)}
              showCheck
            />
          ))}
          <button className="px-4 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-1.5">
            <Plus className="size-3.5" />
            Add New
          </button>
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <label className="text-sm mb-2 block" style={{ fontWeight: 500 }}>
          What's your experience level?
        </label>
        <div className="flex gap-2">
          {EXPERIENCE_LEVELS.map((l) => (
            <Chip
              key={l}
              label={l}
              selected={experienceLevel === l}
              onClick={() => setExperienceLevel(l)}
              wide
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Your Preferences ──────────────────────────────────────────────────
function Step2({
  section,
  setSection,
  shirtSize,
  setShirtSize,
  pantsSize,
  setPantsSize,
  shoeSize,
  setShoeSize,
}: {
  section: string;
  setSection: (v: string) => void;
  shirtSize: string;
  setShirtSize: (v: string) => void;
  pantsSize: string;
  setPantsSize: (v: string) => void;
  shoeSize: string;
  setShoeSize: (v: string) => void;
}) {
  const [sizeSystem, setSizeSystem] = useState<SizeSystem>('US');

  // Convert selected shoe size between systems for display in dropdown
  const shoeOptions = SHOE_SIZE_TABLE.map((row) => ({
    usValue: row.US,
    label: row[sizeSystem],
  }));

  // Show the equivalent in other systems when a size is selected
  const selectedRow = shoeSize
    ? SHOE_SIZE_TABLE.find((r) => r.US === shoeSize)
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Section */}
      <div>
        <label className="text-sm mb-2 block" style={{ fontWeight: 500 }}>
          Which section would you like to shop?
        </label>
        <div className="grid grid-cols-3 gap-3">
          {SECTIONS.map((s) => (
            <Chip
              key={s}
              label={s}
              selected={section === s}
              onClick={() => setSection(s)}
            />
          ))}
        </div>
      </div>

      {/* Shirt Size */}
      <div>
        <label className="text-sm mb-2 block" style={{ fontWeight: 500 }}>
          Shirt Size
        </label>
        <div className="flex gap-2">
          {SHIRT_SIZES.map((s) => (
            <Chip
              key={s}
              label={s}
              selected={shirtSize === s}
              onClick={() => setShirtSize(s)}
            />
          ))}
        </div>
      </div>

      {/* Pants Size */}
      <div>
        <label className="text-sm mb-2 block" style={{ fontWeight: 500 }}>
          Pants Size (Waist)
        </label>
        <SelectField
          value={pantsSize}
          onChange={setPantsSize}
          placeholder="Select waist size"
          options={PANTS_SIZES.map((s) => ({ value: s, label: s }))}
        />
      </div>

      {/* Shoe Size */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm" style={{ fontWeight: 500 }}>
            Shoe Size
          </label>
          {/* System toggle */}
          <div className="flex rounded-md border border-border overflow-hidden">
            {(['US', 'EU', 'UK'] as SizeSystem[]).map((sys) => (
              <button
                key={sys}
                onClick={() => setSizeSystem(sys)}
                className={`px-2.5 py-1 text-xs transition-colors ${
                  sizeSystem === sys
                    ? 'bg-foreground text-background'
                    : 'bg-background text-muted-foreground hover:bg-accent'
                }`}
                style={{ fontWeight: sizeSystem === sys ? 600 : 400 }}
              >
                {sys}
              </button>
            ))}
          </div>
        </div>
        <SelectField
          value={shoeSize}
          onChange={setShoeSize}
          placeholder={`Select ${sizeSystem} size`}
          options={shoeOptions.map((o) => ({ value: o.usValue, label: o.label }))}
        />
        {/* Conversion helper */}
        {selectedRow && (
          <p className="text-xs text-muted-foreground mt-1.5">
            US {selectedRow.US} = EU {selectedRow.EU} = UK {selectedRow.UK}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main Modal ──────────────────────────────────────────────────────────────
export function AdventureModal({ open, onClose, onSubmit, initialInput }: Props) {
  const [step, setStep] = useState(1);

  // Step 1
  const [description, setDescription] = useState(initialInput);
  const [location, setLocation] = useState('');
  const [season, setSeason] = useState('');
  const [terrain, setTerrain] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<'Beginner' | 'Intermediate' | 'Expert' | ''>('');

  // Step 2
  const [section, setSection] = useState('');
  const [shirtSize, setShirtSize] = useState('');
  const [pantsSize, setPantsSize] = useState('');
  const [shoeSize, setShoeSize] = useState('');

  const step1Complete = !!(location && season && experienceLevel);
  const step2Complete = !!(section && shirtSize);

  const handleContinue = () => {
    if (step === 1 && step1Complete) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  const handleGenerate = () => {
    if (!step2Complete || !experienceLevel) return;
    onSubmit({
      initialInput,
      description,
      location,
      season,
      terrain,
      experienceLevel,
      section,
      shirtSize,
      pantsSize,
      shoeSize,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle
            className="text-3xl tracking-tight"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400 }}
          >
            {step === 1 ? 'Plan Your Adventure' : 'Your Preferences'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Tell us about your outdoor plans'
              : 'Help us find the perfect fit for you'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex gap-2 mt-2">
          <div className="flex-1">
            <div className="h-1 rounded-full bg-foreground" />
            <p className="text-xs text-muted-foreground mt-1">Step 1</p>
          </div>
          <div className="flex-1">
            <div
              className={`h-1 rounded-full transition-colors ${
                step >= 2 ? 'bg-foreground' : 'bg-muted'
              }`}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">Step 2</p>
          </div>
        </div>

        <div className="border-t border-border my-2" />

        {/* Step content */}
        {step === 1 ? (
          <Step1
            description={description}
            setDescription={setDescription}
            location={location}
            setLocation={setLocation}
            season={season}
            setSeason={setSeason}
            terrain={terrain}
            setTerrain={setTerrain}
            experienceLevel={experienceLevel}
            setExperienceLevel={setExperienceLevel}
          />
        ) : (
          <Step2
            section={section}
            setSection={setSection}
            shirtSize={shirtSize}
            setShirtSize={setShirtSize}
            pantsSize={pantsSize}
            setPantsSize={setPantsSize}
            shoeSize={shoeSize}
            setShoeSize={setShoeSize}
          />
        )}

        {/* Footer actions */}
        <div className="flex gap-3 mt-4">
          {step === 1 ? (
            <button
              onClick={handleContinue}
              disabled={!step1Complete}
              className={`w-full py-3.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all ${
                step1Complete
                  ? 'bg-foreground text-background hover:opacity-90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              style={{ fontWeight: 500 }}
            >
              Continue <ChevronRight className="size-4" />
            </button>
          ) : (
            <>
              <button
                onClick={handleBack}
                className="px-6 py-3.5 rounded-lg text-sm border border-border hover:bg-accent transition-colors flex items-center gap-2"
                style={{ fontWeight: 500 }}
              >
                <ChevronLeft className="size-4" /> Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={!step2Complete}
                className={`flex-1 py-3.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all ${
                  step2Complete
                    ? 'bg-foreground text-background hover:opacity-90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
                style={{ fontWeight: 500 }}
              >
                Generate My Adventure <ChevronRight className="size-4" />
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
