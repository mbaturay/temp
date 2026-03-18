import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Sparkles, ChevronDown, ShoppingCart, Star, RefreshCw, X } from 'lucide-react';
import skiVideo from '../../video/ski.mp4';
import { IntentBuilder } from '../components/shop/IntentBuilder';
import { ProductDetailPanel } from '../components/shop/ProductDetailPanel';
import { AdventureChatBar } from '../components/shop/AdventureChatBar';
import { FilterSidebar, type FilterState } from '../components/shop/FilterSidebar';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { getProductImageSrc, parseProductName } from '../lib/productImage';
import {
  generateBundle,
  adjustBundle,
  skillToStyle,
  skillToSliderDefault,
  generateRationale,
  getReplacement,
  type IntentData,
  type Bundle,
  type BundleItem,
} from '../../lib/ai';
import { catalog, type CatalogItem } from '../../data/catalog';
import { useCart } from '../lib/cart-context';
import { useShopSession } from '../lib/shop-session-context';

// ── Shop video hero ──────────────────────────────────────────────────────────
function ShopVideoHero({ bundle }: { bundle: Bundle }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, []);

  // Top 3 items as "essentials" floating on the right
  const essentials = bundle.items.slice(0, 3);

  return (
    <div className="relative w-full h-[50vh] min-h-[360px] overflow-hidden bg-black">
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
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/40" />

      {/* Floating essentials on right */}
      <div className="absolute right-6 top-6 bottom-6 flex flex-col justify-center gap-3 w-[200px]">
        {essentials.map((item, i) => {
          const { base } = parseProductName(item.catalogItem.name);
          const imgSrc = getProductImageSrc(item.catalogItem);
          return (
            <motion.div
              key={item.catalogItem.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-white/20"
            >
              <p className="text-[11px] font-medium text-black truncate">{base}</p>
              <p className="text-[10px] text-neutral-500">${item.catalogItem.price} · {item.catalogItem.brand}</p>
              <div className="flex gap-1.5 mt-1.5">
                <button className="text-[9px] px-2 py-0.5 bg-black text-white rounded font-medium">Add to Cart</button>
                <button className="text-[9px] px-2 py-0.5 border border-neutral-300 rounded text-neutral-600">Quick View</button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

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

// ── Star rating ──────────────────────────────────────────────────────────────
function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`size-3 ${
              n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

// ── Product card ─────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  jacket: 'Jacket',
  base_layer: 'Base Layer',
  pants: 'Pants',
  gloves: 'Gloves',
  beanie: 'Beanie',
  goggles: 'Goggles',
  boots: 'Boots',
  socks: 'Socks',
};

function ProductCard({
  item,
  onAddToCart,
  onProductClick,
}: {
  item: BundleItem;
  onAddToCart: (item: BundleItem) => void;
  onProductClick: (item: BundleItem) => void;
}) {
  const { base } = parseProductName(item.catalogItem.name);
  const imgSrc = getProductImageSrc(item.catalogItem);
  const cat = item.catalogItem;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="bg-background border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onProductClick(item)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <ImageWithFallback
          src={imgSrc}
          alt={cat.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span
          className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider bg-foreground/80 text-background px-2 py-0.5 rounded"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {CATEGORY_LABELS[cat.category] || cat.category}
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-0.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {cat.brand}
        </p>
        <p className="font-medium text-sm mb-2 leading-snug" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {base}
        </p>
        <StarRating rating={cat.rating} count={cat.ratingCount} />

        <div className="flex items-baseline justify-between mt-3">
          <div>
            <span className="text-xs text-muted-foreground">Price</span>
            <p className="font-semibold">${cat.price.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground">Weight</span>
            <p className="font-medium text-sm">{cat.weight} lbs</p>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          <ShoppingCart className="size-3.5" />
          Add to Cart
        </button>
      </div>
    </motion.div>
  );
}

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
  onAddSingleItem,
}: {
  initialBundle: Bundle;
  intentData: IntentData;
  cartAdded: boolean;
  cartItemIds: Set<string>;
  onAddToCart: (items: BundleItem[], total: number, savings: number) => void;
  onProceedToCheckout: () => void;
  onStartOver: () => void;
  onRestoreToCart: (item: BundleItem) => void;
  onAddSingleItem: (item: BundleItem) => void;
}) {
  const [currentBundle, setCurrentBundle] = useState<Bundle>(initialBundle);
  const [bundleUpdateCount, setBundleUpdateCount] = useState(0);
  const [pdpItem, setPdpItem] = useState<BundleItem | null>(null);
  const [pdpOpen, setPdpOpen] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);

  // ── Sliders ──
  const defaultSlider = skillToSliderDefault(intentData.skillLevel);
  const [stylePriority, setStylePriority] = useState(defaultSlider);
  const [budgetPriority, setBudgetPriority] = useState(defaultSlider);

  // ── Filters ──
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: { min: 0, max: 1000 },
    brands: [],
    productTypes: [],
    bundleStatus: [],
  });

  // ── Filter logic ──
  const filteredItems = currentBundle.items.filter((item) => {
    const cat = item.catalogItem;
    if (filters.categories.length > 0 && !filters.categories.includes(cat.category)) return false;
    if (cat.price < filters.priceRange.min || cat.price > filters.priceRange.max) return false;
    if (filters.brands.length > 0 && !filters.brands.includes(cat.brand)) return false;
    return true;
  });

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
    const { bundle: newBundle } = adjustBundle(
      currentBundle,
      newStyle,
      newBudget,
      { budget: intentData.budget, size: intentData.size },
      changedSlider
    );
    setCurrentBundle(newBundle);
    setBundleUpdateCount((c) => c + 1);
  };

  const handleStyleChange = (v: number[]) => {
    setStylePriority(v[0]);
    applySliderChange(v[0], budgetPriority, 'vibe');
  };

  const handleBudgetChange = (v: number[]) => {
    setBudgetPriority(v[0]);
    applySliderChange(stylePriority, v[0], 'budget');
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

  const handleAddSingleItem = (item: BundleItem) => {
    onAddSingleItem(item);
  };

  const savingsPercent = currentBundle.originalPrice > 0
    ? Math.round((currentBundle.savings / currentBundle.originalPrice) * 100)
    : 0;

  const contextTags = [
    intentData.activity,
    intentData.location ? intentData.location : '',
    intentData.season || intentData.month,
    intentData.skillLevel,
  ].filter(Boolean).join(' \u2022 ');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative z-[6] min-h-screen pt-14"
    >
      {/* ── Video hero with essentials ── */}
      <ShopVideoHero bundle={currentBundle} />

      {/* ── Adventure Chat Bar (sticky) ── */}
      <AdventureChatBar
        intentData={intentData}
        bundle={currentBundle}
        onBundleChange={handleBundleChangeFromAI}
        onStartOver={onStartOver}
      />

      {/* ── Edit Adventure Profile (collapsible) ── */}
      <div className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setProfileExpanded(!profileExpanded)}
            className="w-full flex items-center justify-between px-6 py-3 text-sm hover:bg-accent/50 transition-colors"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold">Edit Your Adventure Profile</span>
              <span className="text-muted-foreground">{contextTags}</span>
            </div>
            <ChevronDown className={`size-4 text-muted-foreground transition-transform ${profileExpanded ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {profileExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Activity</span>
                    <p className="font-medium">{intentData.activity}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Location</span>
                    <p className="font-medium">{intentData.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Season</span>
                    <p className="font-medium">{intentData.season || intentData.month}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Skill Level</span>
                    <p className="font-medium">{intentData.skillLevel}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bundle Summary Banner ── */}
      <div className="bg-background border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl md:text-3xl"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
            >
              Recommended Gear
            </h1>
            <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Curated for your {intentData.activity.toLowerCase()} adventure
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right border border-border rounded-lg px-4 py-2">
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Outfit', sans-serif" }}>Adventure Bundle Total</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">${currentBundle.totalPrice.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground line-through">${currentBundle.originalPrice.toFixed(2)}</span>
              </div>
            </div>
            {currentBundle.savings > 0 && (
              <div className="border border-border rounded-lg px-4 py-2 text-sm max-w-[200px]" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Save ${currentBundle.savings.toFixed(2)} ({savingsPercent}% off) when you purchase all recommended items
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content: sidebar + grid ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="hidden lg:block">
            <FilterSidebar
              bundle={currentBundle}
              filters={filters}
              onFiltersChange={setFilters}
              stylePriority={stylePriority}
              budgetPriority={budgetPriority}
              onStyleChange={handleStyleChange}
              onBudgetChange={handleBudgetChange}
              cartAdded={cartAdded}
            />
          </div>

          {/* Product grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => (
                  <ProductCard
                    key={item.catalogItem.id}
                    item={item}
                    onAddToCart={handleAddSingleItem}
                    onProductClick={handleProductClick}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
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

  // Keep session bundle in sync with cart
  useEffect(() => {
    if (!cartAdded || !bundle || cart.items.length === 0) return;
    const bundleIds = new Set(bundle.items.map((i) => i.catalogItem.id));
    const allCartInBundle = cart.items.every((ci) => bundleIds.has(ci.id));
    if (allCartInBundle) return;

    const newCartItems: BundleItem[] = cart.items
      .filter((ci) => !bundleIds.has(ci.id))
      .map((ci) => {
        const catalogItem = catalog.find((c) => c.id === ci.id);
        if (!catalogItem) return null;
        return { catalogItem, rationale: ci.rationale } as BundleItem;
      })
      .filter((i): i is BundleItem => i !== null);

    const syncedItems: BundleItem[] = [...bundle.items, ...newCartItems];
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
    session.setBundle({
      items,
      totalPrice: items.reduce((s, i) => s + i.catalogItem.price, 0),
      originalPrice: items.reduce((s, i) => s + i.catalogItem.originalPrice, 0),
      savings: items.reduce((s, i) => s + (i.catalogItem.originalPrice - i.catalogItem.price), 0),
    });

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

  const handleAddSingleItem = (item: BundleItem) => {
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
            onAddSingleItem={handleAddSingleItem}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
