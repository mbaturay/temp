import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, useInView } from 'motion/react';
import { ArrowRight, Mountain, Zap, Layers, SlidersHorizontal, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import { AdventureModal, type AdventureFormData } from '../components/shop/AdventureModal';
import { seasonToMonth, type IntentData } from '../../lib/ai';
import adventureVideo from '../../video/adventure.mp4';

const ACTIVITIES = [
  { label: 'Hike', prefill: 'I want to go hiking' },
  { label: 'Kayak', prefill: 'I want to go kayaking' },
  { label: 'Climb', prefill: 'I want to go climbing' },
  { label: 'Ski', prefill: 'I want to go skiing' },
  { label: 'Camp', prefill: 'I want to go camping' },
  { label: 'Snowboard', prefill: 'I want to go snowboarding' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Describe your adventure',
    description: 'Tell us where you\'re headed, the season, terrain, and your experience level. A weekend summit or a week-long trek — we handle both.',
    icon: Zap,
  },
  {
    step: '02',
    title: 'Get a curated bundle',
    description: 'Our AI assembles a complete gear package — jacket, layers, pants, boots, accessories — all matched to your specific conditions.',
    icon: Layers,
  },
  {
    step: '03',
    title: 'Fine-tune with sliders',
    description: 'Dial between style and performance, budget and premium. Every adjustment instantly recalculates your entire kit in real time.',
    icon: SlidersHorizontal,
  },
  {
    step: '04',
    title: 'Swap anything, keep the fit',
    description: 'Don\'t love a pick? Swap individual items and the bundle stays coherent. Every piece is chosen to work together.',
    icon: RefreshCw,
  },
];

const DIFFERENTIATORS = [
  {
    title: 'Bundles, not products',
    description: 'Traditional stores show you 10,000 items and hope for the best. We build one complete kit that actually works together.',
  },
  {
    title: 'Context-aware recommendations',
    description: 'Skiing in Colorado in March is different from April in Japan. Your gear should reflect that — ours does.',
  },
  {
    title: 'Real-time customization',
    description: 'Two sliders control your entire experience. Style vs. performance. Budget vs. premium. The bundle adapts instantly.',
  },
];

// ── Animated section wrapper ─────────────────────────────────────────────────
function FadeInSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, []);

  const handleActivityClick = (activity: typeof ACTIVITIES[number]) => {
    setSelectedActivity(activity.label);
    setInputValue(activity.prefill);
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    setModalOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handleModalSubmit = (data: AdventureFormData) => {
    setModalOpen(false);

    const sectionToGender = (s: string) => {
      if (s === "Men's") return 'Men';
      if (s === "Women's") return 'Women';
      return undefined;
    };

    const skillMap: Record<string, IntentData['skillLevel']> = {
      Beginner: 'Beginner',
      Intermediate: 'Intermediate',
      Expert: 'Advanced',
    };

    const intentData: IntentData = {
      activity: selectedActivity || inputValue,
      location: data.location,
      month: seasonToMonth(data.season),
      skillLevel: skillMap[data.experienceLevel] || 'Intermediate',
      gender: sectionToGender(data.section),
      size: data.shirtSize,
      budget: 700,
      description: data.description,
      season: data.season,
      terrain: data.terrain,
      pantsSize: data.pantsSize,
      shoeSize: data.shoeSize,
    };

    navigate('/shop', { state: { intentData } });
  };

  return (
    <div className="flex flex-col">
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Video Hero
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover scale-105"
          src={adventureVideo}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

        <div className="relative z-10 w-full max-w-3xl mx-auto px-8 text-center flex flex-col items-center gap-8 mt-8">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <Mountain className="size-4 text-amber-400" />
            <span
              className="text-amber-400/90 text-xs tracking-[0.2em] uppercase"
              style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}
            >
              AI-Powered Gear Curation
            </span>
          </motion.div>

          {/* Hero headline */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-white text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400 }}
          >
            Gear that knows
            <br />
            <span className="italic text-amber-300" style={{ fontWeight: 300 }}>
              where you're going
            </span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-white/60 text-lg max-w-lg leading-relaxed"
            style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
          >
            Tell us your adventure. We'll build a personalized kit —
            matched to your terrain, season, and skill level.
          </motion.p>

          {/* Activity pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {ACTIVITIES.map((a) => (
              <button
                key={a.label}
                onClick={() => handleActivityClick(a)}
                className={`px-5 py-2 rounded-full border text-sm transition-all duration-200 ${
                  selectedActivity === a.label
                    ? 'bg-white text-black border-white scale-105'
                    : 'bg-white/5 text-white/80 border-white/20 hover:bg-white/15 hover:border-white/40'
                }`}
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: selectedActivity === a.label ? 500 : 400,
                }}
              >
                {a.label}
              </button>
            ))}
          </motion.div>

          {/* Chat-style input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="w-full flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-full px-6 py-3.5 shadow-2xl shadow-black/20 ring-1 ring-white/20"
          >
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your next adventure..."
              className="flex-1 bg-transparent text-black placeholder:text-neutral-400 focus:outline-none text-base"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            />
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                inputValue.trim()
                  ? 'bg-black text-white hover:bg-neutral-800 scale-100 hover:scale-105'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <ArrowRight className="size-4" />
            </button>
          </motion.div>

          {/* Micro-copy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-white/30 text-xs tracking-wide"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Personalized bundles in seconds — no account needed
          </motion.p>
        </div>

        {/* Bottom edge — hard cut, no fade */}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — The Problem / New Era
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <FadeInSection>
            <p
              className="text-amber-600 text-xs tracking-[0.2em] uppercase mb-6"
              style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}
            >
              A new way to shop
            </p>
          </FadeInSection>
          <FadeInSection delay={0.1}>
            <h2
              className="text-4xl md:text-5xl leading-[1.15] tracking-tight mb-8"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400 }}
            >
              Shopping for gear shouldn't feel like{' '}
              <span className="italic text-muted-foreground">homework</span>
            </h2>
          </FadeInSection>
          <FadeInSection delay={0.2}>
            <p
              className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto"
              style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
            >
              Endless filters. Thousands of products. No idea what works together.
              We built Adventure Outfitters to fix that — one conversation,
              one complete kit, ready for your specific trip.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — How It Works (numbered steps)
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-8 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-5xl mx-auto">
          <FadeInSection>
            <p
              className="text-amber-600 text-xs tracking-[0.2em] uppercase mb-4 text-center"
              style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}
            >
              How it works
            </p>
            <h2
              className="text-3xl md:text-4xl tracking-tight text-center mb-20"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400 }}
            >
              From idea to gear in four steps
            </h2>
          </FadeInSection>

          <div className="grid md:grid-cols-2 gap-x-16 gap-y-14">
            {HOW_IT_WORKS.map((item, i) => (
              <FadeInSection key={item.step} delay={i * 0.1}>
                <div className="flex gap-5">
                  <div className="shrink-0 size-12 rounded-xl bg-foreground/5 border border-border flex items-center justify-center">
                    <item.icon className="size-5 text-foreground/70" />
                  </div>
                  <div>
                    <span
                      className="text-amber-600/60 text-xs tracking-wider block mb-1"
                      style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}
                    >
                      STEP {item.step}
                    </span>
                    <h3
                      className="text-lg mb-2"
                      style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="text-muted-foreground text-sm leading-relaxed"
                      style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — What Makes Us Different
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-8">
        <div className="max-w-5xl mx-auto">
          <FadeInSection>
            <p
              className="text-amber-600 text-xs tracking-[0.2em] uppercase mb-4 text-center"
              style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}
            >
              Why Adventure Outfitters
            </p>
            <h2
              className="text-3xl md:text-4xl tracking-tight text-center mb-20"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400 }}
            >
              Built different, on purpose
            </h2>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-10">
            {DIFFERENTIATORS.map((item, i) => (
              <FadeInSection key={item.title} delay={i * 0.1}>
                <div className="relative pt-8">
                  <div className="absolute top-0 left-0 w-10 h-px bg-amber-500/60" />
                  <h3
                    className="text-lg mb-3"
                    style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-muted-foreground text-sm leading-relaxed"
                    style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
                  >
                    {item.description}
                  </p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — CTA Banner
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-8 bg-foreground text-background">
        <div className="max-w-3xl mx-auto text-center">
          <FadeInSection>
            <h2
              className="text-3xl md:text-4xl tracking-tight text-background mb-5"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400 }}
            >
              Ready for your next adventure?
            </h2>
            <p
              className="text-background/50 text-base mb-10 max-w-lg mx-auto"
              style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
            >
              Skip the guesswork. Describe your trip and let our AI handle the gear.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-background text-foreground rounded-full text-sm hover:opacity-90 transition-opacity"
              style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500 }}
            >
              Start Planning
              <ArrowRight className="size-4" />
            </button>
          </FadeInSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6 — Trust bar
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-12 px-8 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-x-14 gap-y-4">
          {[
            { icon: Truck, text: 'Free shipping over $150' },
            { icon: RefreshCw, text: '30-day hassle-free returns' },
            { icon: ShieldCheck, text: 'Secure checkout' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5 text-muted-foreground">
              <Icon className="size-4" />
              <span
                className="text-sm"
                style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 400 }}
              >
                {text}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════════════════════════════════ */}
      <footer className="py-16 px-8 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-16">
            {/* Brand column */}
            <div className="md:col-span-1">
              <span
                className="text-lg block mb-3"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
              >
                Adventure Outfitters
              </span>
              <p
                className="text-muted-foreground text-sm leading-relaxed"
                style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
              >
                AI-curated outdoor gear for every adventure, every season.
              </p>
            </div>

            {/* Link columns */}
            {[
              {
                heading: 'Shop',
                links: ['All Gear', 'Jackets', 'Layering', 'Pants', 'Footwear', 'Accessories'],
              },
              {
                heading: 'Company',
                links: ['About Us', 'How It Works', 'Sustainability', 'Careers'],
              },
              {
                heading: 'Support',
                links: ['Help Center', 'Shipping & Returns', 'Size Guide', 'Contact Us'],
              },
            ].map((col) => (
              <div key={col.heading}>
                <h4
                  className="text-sm mb-4"
                  style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}
                >
                  {col.heading}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p
              className="text-xs text-muted-foreground"
              style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
            >
              &copy; {new Date().getFullYear()} Adventure Outfitters. All rights reserved.
            </p>
            <div className="flex gap-6">
              {['Privacy Policy', 'Terms of Service', 'Cookie Settings'].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Adventure Planning Modal ── */}
      <AdventureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialInput={inputValue}
      />
    </div>
  );
}
