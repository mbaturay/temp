import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Sparkles } from 'lucide-react';
import skiVideo from '../../video/ski.mp4';
import { BundleRecommendation } from '../components/chat/BundleRecommendation';
import { IntentBuilder } from '../components/shop/IntentBuilder';
import { ProductDetailPanel } from '../components/shop/ProductDetailPanel';
import { AIAssistantDrawer } from '../components/shop/AIAssistantDrawer';
import { Slider } from '../components/ui/slider';
import {
  generateBundle,
  adjustBundle,
  skillToStyle,
  skillToSliderDefault,
  generateRationale,
  type IntentData,
  type Bundle,
  type BundleItem,
} from '../../lib/ai';
import { catalog, type CatalogItem } from '../../data/catalog';
import { useCart } from '../lib/cart-context';
import { useShopSession } from '../lib/shop-session-context';

// ── Shop video hero ──────────────────────────────────────────────────────────
function ShopVideoHero() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, []);

  return (
    <div className="fixed inset-0 top-14 z-[5] bg-black overflow-hidden">
      <video
        ref={ref}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        src={skiVideo}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

// ── Building screen ───────────────────────────────────────────────────────────
function BuildingScreen({ intentData }: { intentData: IntentData }) {
  return (
    <div className="min-h-screen pt-14 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-6 text-center"
      >
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="size-3 rounded-full bg-foreground"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
        <div>
          <motion.p
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500, fontSize: '1.25rem' }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            Building your bundle
          </motion.p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Finding the best {intentData.skillLevel.toLowerCase()} picks for{' '}
            <span className="text-foreground">
              {intentData.activity} in {intentData.location}
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Trait filter definitions ──────────────────────────────────────────────────
const TRAIT_FILTERS = [
  { key: 'all', label: 'All Gear', tags: [] },
  { key: 'warmth', label: 'Warmth', tags: ['warm', 'insulation', 'down-fill', 'merino-wool'] },
  { key: 'waterproof', label: 'Waterproof', tags: ['waterproof'] },
  { key: 'lightweight', label: 'Lightweight', tags: ['lightweight', 'stretch'] },
  { key: 'durability', label: 'Durability', tags: ['durable', 'wind-resistant'] },
] as const;

type TraitKey = (typeof TRAIT_FILTERS)[number]['key'];

// ── Results page ──────────────────────────────────────────────────────────────
function ResultsPage({
  initialBundle,
  intentData,
  cartAdded,
  cartItemIds,
  onAddToCart,
  onProceedToCheckout,
  onStartOver,
  onRestoreToCart,
}: {
  initialBundle: Bundle;
  intentData: IntentData;
  cartAdded: boolean;
  cartItemIds: Set<string>;
  onAddToCart: (items: BundleItem[], total: number, savings: number) => void;
  onProceedToCheckout: () => void;
  onStartOver: () => void;
  onRestoreToCart: (item: BundleItem) => void;
}) {
  const [currentBundle, setCurrentBundle] = useState<Bundle>(initialBundle);
  const [bundleUpdateCount, setBundleUpdateCount] = useState(0);
  const [pdpItem, setPdpItem] = useState<BundleItem | null>(null);
  const [pdpOpen, setPdpOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  // ── Sliders ──
  const defaultSlider = skillToSliderDefault(intentData.skillLevel);
  const [stylePriority, setStylePriority] = useState(defaultSlider);
  const [budgetPriority, setBudgetPriority] = useState(defaultSlider);
  const [sliderFeedback, setSliderFeedback] = useState<string | null>(null);

  // ── Trait filter ──
  const [activeTrait, setActiveTrait] = useState<TraitKey>('all');

  const filteredBundle: Bundle = (() => {
    if (activeTrait === 'all') return currentBundle;
    const filter = TRAIT_FILTERS.find((f) => f.key === activeTrait);
    if (!filter) return currentBundle;
    const matched = currentBundle.items.filter((i) =>
      i.catalogItem.tags.some((t) => filter.tags.includes(t))
    );
    if (matched.length === 0) return currentBundle; // fallback to all if nothing matches
    return { ...currentBundle, items: matched };
  })();

  const style = skillToStyle(intentData.skillLevel);

  const recalculate = (items: BundleItem[]): Bundle => ({
    items,
    totalPrice: items.reduce((s, i) => s + i.catalogItem.price, 0),
    originalPrice: items.reduce((s, i) => s + i.catalogItem.originalPrice, 0),
    savings: items.reduce((s, i) => s + (i.catalogItem.originalPrice - i.catalogItem.price), 0),
  });

  // ── Slider handlers ──
  const applySliderChange = (
    newStyle: number,
    newBudget: number,
    changedSlider: 'vibe' | 'budget'
  ) => {
    if (cartAdded) return;
    const { bundle: newBundle, message } = adjustBundle(
      currentBundle,
      newStyle,
      newBudget,
      { budget: intentData.budget, size: intentData.size },
      changedSlider
    );
    setCurrentBundle(newBundle);
    setSliderFeedback(message);
    setBundleUpdateCount((c) => c + 1);
  };

  const handleStyleChange = ([v]: number[]) => {
    setStylePriority(v);
    applySliderChange(v, budgetPriority, 'vibe');
  };

  const handleBudgetChange = ([v]: number[]) => {
    setBudgetPriority(v);
    applySliderChange(stylePriority, v, 'budget');
  };

  const handleProductClick = (item: BundleItem) => {
    setPdpItem(item);
    setPdpOpen(true);
  };

  const handleReplaceFromPDP = (newItem: CatalogItem, oldItemId: string) => {
    const newItems = currentBundle.items.map((i) =>
      i.catalogItem.id === oldItemId
        ? { catalogItem: newItem, rationale: generateRationale(newItem) }
        : i
    );
    const newBundle = recalculate(newItems);
    setCurrentBundle(newBundle);
    setBundleUpdateCount((c) => c + 1);
    setPdpOpen(false);
  };

  const handleBundleChangeFromAI = (newBundle: Bundle) => {
    setCurrentBundle(newBundle);
    setBundleUpdateCount((c) => c + 1);
  };

  const handleHighlightCard = (itemId: string | null) => {
    setHighlightedItemId(itemId);
    if (itemId) setTimeout(() => setHighlightedItemId(null), 1500);
  };

  // Build context tags for the summary bar
  const contextTags = [
    intentData.activity,
    intentData.location ? `in ${intentData.location}` : '',
    intentData.season || intentData.month,
    intentData.skillLevel,
  ]
    .filter(Boolean)
    .join(' \u2022 ');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative z-[6] min-h-screen pt-14"
    >
      {/* ── Fixed video background ── */}
      <ShopVideoHero />

      {/* ── Summary bar — sticky under header ── */}
      <div className="sticky top-14 z-30 bg-foreground text-background px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2
              className="text-background text-sm"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
            >
              Your Adventure
            </h2>
            <span className="text-background/30">|</span>
            <p className="text-background/60 text-sm">{contextTags}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAiDrawerOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-background text-sm hover:bg-white/20 transition-colors"
            >
              <Sparkles className="size-3.5" />
              AI Assistant
            </button>
            <button
              onClick={onStartOver}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-background text-sm hover:bg-white/20 transition-colors"
            >
              <RotateCcw className="size-3.5" />
              Start Over
            </button>
          </div>
        </div>
      </div>

      {/* ── Spacer so controls sit over the video area ── */}
      <div className="h-[50vh]" />

      {/* ── Floating controls panel ── */}
      <div className="sticky top-[6rem] z-20 px-6 pb-2 pt-2">
        <div className="max-w-4xl mx-auto rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-5">
          {/* Sliders row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
            {/* Style ↔ Performance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/80" style={{ fontWeight: 500 }}>
                  Style
                </span>
                <span className="text-xs text-white/40">
                  Performance
                </span>
              </div>
              <Slider
                value={[stylePriority]}
                onValueChange={handleStyleChange}
                min={0}
                max={100}
                step={1}
                disabled={cartAdded}
              />
            </div>
            {/* Budget ↔ Premium */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/80" style={{ fontWeight: 500 }}>
                  Budget
                </span>
                <span className="text-xs text-white/40">
                  Premium
                </span>
              </div>
              <Slider
                value={[budgetPriority]}
                onValueChange={handleBudgetChange}
                min={0}
                max={100}
                step={1}
                disabled={cartAdded}
              />
            </div>
          </div>

          {/* AI feedback */}
          <AnimatePresence mode="wait">
            {sliderFeedback && (
              <motion.p
                key={sliderFeedback}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="mt-3 text-xs text-white/50 italic"
              >
                {sliderFeedback}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="border-t border-white/10 my-4" />

          {/* Trait filters */}
          <div className="flex flex-wrap gap-2">
            {TRAIT_FILTERS.map((f) => {
              const active = activeTrait === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveTrait(f.key)}
                  className={`px-4 py-1.5 rounded-full text-xs transition-all duration-150 ${
                    active
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                  style={{ fontWeight: active ? 600 : 400 }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Recommended Gear ── */}
      <div className="relative z-10 bg-background/60 backdrop-blur-xl rounded-t-3xl max-w-5xl mx-auto px-6 py-10 -mt-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h1 style={{ fontFamily: "'Fraunces', Georgia, serif" }}>Recommended Gear</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Curated for your {intentData.activity.toLowerCase()} adventure
            </p>
          </div>
          <p className="text-lg" style={{ fontWeight: 600 }}>
            Total: ${currentBundle.totalPrice.toFixed(2)}
          </p>
        </div>

        <BundleRecommendation
          initialBundle={filteredBundle}
          preferredStyle={style}
          cartAdded={cartAdded}
          isUpdate={bundleUpdateCount > 0}
          cartItemIds={cartItemIds}
          onAddToCart={(items, total, savings) =>
            onAddToCart(items, total, savings)
          }
          onProceedToCheckout={onProceedToCheckout}
          onProductClick={handleProductClick}
          onRestoreToCart={onRestoreToCart}
        />
      </div>

      {/* PDP Sheet */}
      <ProductDetailPanel
        open={pdpOpen}
        bundleItem={pdpItem}
        bundle={currentBundle}
        intentData={intentData}
        defaultSize={intentData.size}
        onClose={() => setPdpOpen(false)}
        onReplace={handleReplaceFromPDP}
      />

      {/* AI Assistant Drawer */}
      <AIAssistantDrawer
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        bundle={currentBundle}
        intentData={intentData}
        onBundleChange={handleBundleChangeFromAI}
        onHighlightCard={handleHighlightCard}
      />
    </motion.div>
  );
}

// ── Shop root ─────────────────────────────────────────────────────────────────
export default function Shop() {
  const navigate = useNavigate();
  const location = useLocation();
  const cart = useCart();
  const session = useShopSession();
  const { view, intentData, bundle, cartAdded } = session;

  // Keep session bundle in sync with cart — handles swaps on cart page & slider drift
  useEffect(() => {
    if (!cartAdded || !bundle || cart.items.length === 0) return;

    const bundleIds = new Set(bundle.items.map((i) => i.catalogItem.id));

    // If every cart item is already in the bundle, nothing to sync
    const allCartInBundle = cart.items.every((ci) => bundleIds.has(ci.id));
    if (allCartInBundle) return;

    // Rebuild: keep original bundle items (for ghost display) + add any new cart items
    const newCartItems: BundleItem[] = cart.items
      .filter((ci) => !bundleIds.has(ci.id))
      .map((ci) => {
        const catalogItem = catalog.find((c) => c.id === ci.id);
        if (!catalogItem) return null;
        return { catalogItem, rationale: ci.rationale } as BundleItem;
      })
      .filter((i): i is BundleItem => i !== null);

    // Replace mismatched bundle items with cart versions, keep removed ones for ghost
    const syncedItems: BundleItem[] = [
      // Original items that are still in cart OR were removed (for ghost)
      ...bundle.items,
      // New items from cart swaps that weren't in the original bundle
      ...newCartItems,
    ];

    // Deduplicate by category — if cart swapped jacket A→A2, keep A (ghost) and add A2
    session.setBundle({
      items: syncedItems,
      totalPrice: syncedItems.reduce((s, i) => s + i.catalogItem.price, 0),
      originalPrice: syncedItems.reduce((s, i) => s + i.catalogItem.originalPrice, 0),
      savings: syncedItems.reduce((s, i) => s + (i.catalogItem.originalPrice - i.catalogItem.price), 0),
    });
  }, [cartAdded, cart.items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Accept intent data from Home page navigation
  useEffect(() => {
    const navState = location.state as { intentData?: IntentData } | null;
    if (navState?.intentData) {
      handleComplete(navState.intentData);
      // Clear navigation state to prevent re-triggering on refresh
      window.history.replaceState({}, '');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleComplete = (data: IntentData) => {
    session.setIntentData(data);
    session.setView('building');
    setTimeout(() => {
      const style = skillToStyle(data.skillLevel);
      const newBundle = generateBundle({ budget: data.budget, size: data.size, style });
      session.setBundle(newBundle);
      session.setView('results');
    }, 1800);
  };

  const handleAddToCart = (items: BundleItem[], _total: number, _savings: number) => {
    session.setCartAdded(true);

    // Snapshot the current bundle into session so navigating back shows the same items
    session.setBundle({
      items,
      totalPrice: items.reduce((s, i) => s + i.catalogItem.price, 0),
      originalPrice: items.reduce((s, i) => s + i.catalogItem.originalPrice, 0),
      savings: items.reduce((s, i) => s + (i.catalogItem.originalPrice - i.catalogItem.price), 0),
    });

    // Push into shared cart context so the header badge updates
    cart.addItems(
      items.map((i) => ({
        id: i.catalogItem.id,
        name: i.catalogItem.name,
        brand: i.catalogItem.brand,
        price: i.catalogItem.price,
        originalPrice: i.catalogItem.originalPrice,
        image: i.catalogItem.image,
        category: i.catalogItem.category,
        rationale: i.rationale,
        quantity: 1,
      }))
    );
  };

  const cartItemIds = new Set(cart.items.map((i) => i.id));

  const handleRestoreToCart = (item: BundleItem) => {
    cart.addItems([{
      id: item.catalogItem.id,
      name: item.catalogItem.name,
      brand: item.catalogItem.brand,
      price: item.catalogItem.price,
      originalPrice: item.catalogItem.originalPrice,
      image: item.catalogItem.image,
      category: item.catalogItem.category,
      rationale: item.rationale,
      quantity: 1,
    }]);
  };

  const handleProceedToCheckout = () => {
    navigate('/checkout');
  };

  const handleStartOver = () => {
    session.resetSession();
    cart.clearCart();
    navigate('/');
  };

  return (
    <AnimatePresence mode="wait">
      {view === 'onboarding' && (
        <motion.div
          key="onboarding"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <IntentBuilder onSubmit={handleComplete} />
        </motion.div>
      )}
      {view === 'building' && (
        <motion.div
          key="building"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <BuildingScreen intentData={intentData!} />
        </motion.div>
      )}
      {view === 'results' && (
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            mass: 0.8,
          }}
        >
          <ResultsPage
            initialBundle={bundle!}
            intentData={intentData!}
            cartAdded={cartAdded}
            cartItemIds={cartItemIds}
            onAddToCart={handleAddToCart}
            onProceedToCheckout={handleProceedToCheckout}
            onStartOver={handleStartOver}
            onRestoreToCart={handleRestoreToCart}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
