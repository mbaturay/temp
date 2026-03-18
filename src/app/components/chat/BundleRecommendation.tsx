import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, RefreshCw, X, ShoppingBag, Check, ArrowRight, Tag, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import type { Bundle, BundleItem } from '../../../lib/ai';
import { catalog } from '../../../data/catalog';
import { generateRationale, getReplacement } from '../../../lib/ai';
import { ProductIcon } from '../shop/ProductIcon';
import { getProductTier } from '../../../lib/productTier';
import { getProductImageSrc, parseProductName } from '../../lib/productImage';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface Props {
  initialBundle: Bundle;
  preferredStyle: string;
  cartAdded: boolean;
  isUpdate?: boolean;
  /** IDs of items currently in the cart — used to ghost removed items */
  cartItemIds?: Set<string>;
  onAddToCart: (items: BundleItem[], total: number, savings: number) => void;
  onProceedToCheckout: () => void;
  onProductClick?: (item: BundleItem) => void;
  /** Called when user clicks "Restore" on a ghosted item */
  onRestoreToCart?: (item: BundleItem) => void;
}

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
      <span className="text-xs text-muted-foreground/50">({count})</span>
    </div>
  );
}

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

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 28,
      mass: 0.8,
    },
  },
};

export function BundleRecommendation({
  initialBundle,
  preferredStyle,
  cartAdded,
  isUpdate,
  cartItemIds,
  onAddToCart,
  onProceedToCheckout,
  onProductClick,
  onRestoreToCart,
}: Props) {
  const [bundle, setBundle] = useState<Bundle>(initialBundle);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [showUpdateBadge, setShowUpdateBadge] = useState(false);

  // Sync bundle when parent passes a new one (slider / PDP replace)
  useEffect(() => {
    setBundle(initialBundle);
  }, [initialBundle]);

  // Flash "Updated" micro-badge when bundle changes after initial render
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isUpdate) {
      setShowUpdateBadge(true);
      const t = setTimeout(() => setShowUpdateBadge(false), 900);
      return () => clearTimeout(t);
    }
  }, [initialBundle]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentIds = bundle.items.map((i) => i.catalogItem.id);

  const recalculate = (items: BundleItem[]): Bundle => ({
    items,
    totalPrice: items.reduce((s, i) => s + i.catalogItem.price, 0),
    originalPrice: items.reduce((s, i) => s + i.catalogItem.originalPrice, 0),
    savings: items.reduce((s, i) => s + (i.catalogItem.originalPrice - i.catalogItem.price), 0),
  });

  const handleReplace = (itemId: string) => {
    const item = bundle.items.find((i) => i.catalogItem.id === itemId);
    if (!item) return;
    setReplacingId(itemId);
    setTimeout(() => {
      const replacement = getReplacement(item.catalogItem.category, preferredStyle, currentIds);
      if (replacement) {
        const newItems = bundle.items.map((i) =>
          i.catalogItem.id === itemId
            ? { catalogItem: replacement, rationale: generateRationale(replacement) }
            : i
        );
        setBundle(recalculate(newItems));
      }
      setReplacingId(null);
    }, 500);
  };

  const handleRemove = (itemId: string) => {
    setBundle(recalculate(bundle.items.filter((i) => i.catalogItem.id !== itemId)));
  };

  const canReplace = (item: BundleItem) =>
    catalog.some((c) => c.category === item.catalogItem.category && !currentIds.includes(c.id));

  return (
    <div className="w-full">
      {/* ── Product grid ── */}
      <motion.div
        className="grid grid-cols-2 gap-5 lg:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        <AnimatePresence mode="popLayout">
          {bundle.items.map((item) => {
            const imageSrc = getProductImageSrc(item.catalogItem);
            const { displayName } = parseProductName(item.catalogItem.name);
            const isRemovedFromCart = cartAdded && cartItemIds != null && cartItemIds.size > 0 && !cartItemIds.has(item.catalogItem.id);
            return (
            <motion.div
              key={item.catalogItem.id}
              layout
              variants={cardVariants}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              whileHover={isRemovedFromCart ? {} : { scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`group relative flex flex-col rounded-2xl border overflow-hidden ${
                isRemovedFromCart
                  ? 'border-dashed border-border/60 bg-card/50'
                  : `border-border bg-card hover:shadow-lg hover:shadow-black/5 ${
                      replacingId === item.catalogItem.id ? 'opacity-30' : 'opacity-100'
                    }`
              }`}
            >
              {/* Product image — always visible, even when ghosted */}
              <div
                className={`relative aspect-square overflow-hidden bg-muted ${isRemovedFromCart ? '' : 'cursor-pointer'}`}
                onClick={() => !isRemovedFromCart && onProductClick?.(item)}
              >
                {imageSrc ? (
                  <ImageWithFallback
                    src={imageSrc}
                    alt={displayName}
                    className={`w-full h-full object-cover transition-transform duration-300 ease-out ${isRemovedFromCart ? 'grayscale opacity-60' : 'group-hover:scale-105'}`}
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center transition-transform duration-300 ease-out ${isRemovedFromCart ? 'grayscale opacity-60' : 'group-hover:scale-105'}`}>
                    <ProductIcon
                      category={item.catalogItem.category}
                      name={item.catalogItem.name}
                      tier={getProductTier(item.catalogItem)}
                      size={64}
                    />
                  </div>
                )}
                {/* Category tag */}
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-foreground text-xs px-2 py-1 rounded-md" style={{ fontWeight: 500 }}>
                  {CATEGORY_LABELS[item.catalogItem.category]}
                </span>
                {/* Updated micro-badge */}
                {showUpdateBadge && !isRemovedFromCart && (
                  <span className="absolute top-3 right-3 text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded-full leading-none" style={{ fontWeight: 500 }}>
                    Updated
                  </span>
                )}
              </div>

              {/* Ghost overlay — covers only the info area below the image */}
              {isRemovedFromCart ? (
                <div className="relative flex flex-col items-center justify-center gap-3 p-6 flex-1">
                  <p className="text-sm text-muted-foreground" style={{ fontWeight: 500 }}>
                    Removed from cart
                  </p>
                  <button
                    onClick={() => onRestoreToCart?.(item)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-foreground text-background text-sm hover:bg-foreground/90 transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    <RotateCcw className="size-3.5" />
                    Restore
                  </button>
                </div>
              ) : (
              /* Product info */
              <div className="flex flex-col gap-2 p-4 flex-1">
                <div
                  className="cursor-pointer"
                  onClick={() => onProductClick?.(item)}
                >
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                    {item.catalogItem.brand}
                  </p>
                  <p className="leading-snug" style={{ fontWeight: 500 }}>
                    {displayName}
                  </p>
                </div>

                {/* Price + rating row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg" style={{ fontWeight: 700 }}>
                      ${item.catalogItem.price}
                    </span>
                    <span className="text-xs text-muted-foreground line-through">
                      ${item.catalogItem.originalPrice}
                    </span>
                  </div>
                  <StarRating rating={item.catalogItem.rating} count={item.catalogItem.ratingCount} />
                </div>

                {/* AI rationale */}
                <p className="text-xs text-muted-foreground italic leading-relaxed flex-1 border-l-2 border-muted pl-2">
                  {item.rationale}
                </p>

                {/* Item actions */}
                <div className="flex gap-3 pt-2 border-t border-border">
                  <button
                    onClick={() => handleReplace(item.catalogItem.id)}
                    disabled={!canReplace(item) || !!replacingId || cartAdded}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  >
                    <RefreshCw className="size-3" />
                    Swap
                  </button>
                  <button
                    onClick={() => handleRemove(item.catalogItem.id)}
                    disabled={bundle.items.length <= 1 || !!replacingId || cartAdded}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  >
                    <X className="size-3" />
                    Remove
                  </button>
                </div>
              </div>
              )}
            </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* ── Cart summary ── */}
      {(() => {
        // When cart is active, only count items still in the cart
        const activeItems = cartAdded && cartItemIds && cartItemIds.size > 0
          ? bundle.items.filter((i) => cartItemIds.has(i.catalogItem.id))
          : bundle.items;
        const displayTotal = activeItems.reduce((s, i) => s + i.catalogItem.price, 0);
        const displayOriginal = activeItems.reduce((s, i) => s + i.catalogItem.originalPrice, 0);
        const displaySavings = displayOriginal - displayTotal;
        return (
      <div className="mt-8 rounded-2xl glass-subtle p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Tag className="size-4" />
            <span>{activeItems.length} items in bundle</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground line-through">${displayOriginal}</span>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
              Save ${displaySavings}
            </Badge>
            <span style={{ fontWeight: 700 }} className="text-2xl">
              ${displayTotal}
            </span>
          </div>
        </div>

        <Separator className="mb-5" />

        {!cartAdded ? (
          <>
            {/* ── Confidence signals ── */}
            <div className="flex flex-col gap-1.5 mb-5">
              {[
                'Everything in this bundle works together.',
                'No critical items missing.',
                'Optimised for your trip and experience level.',
              ].map((line) => (
                <div key={line} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="size-3 text-emerald-500 shrink-0" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
            <motion.div
              animate={{ scale: [1, 1.015, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Button
                size="lg"
                className="w-full gap-2 h-12"
                onClick={() => onAddToCart(bundle.items, displayTotal, displaySavings)}
              >
                <ShoppingBag className="size-4" />
                Add full bundle to cart — ${displayTotal}
              </Button>
            </motion.div>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 justify-center text-emerald-600 py-1">
              <Check className="size-4" />
              <span style={{ fontWeight: 500 }}>
                Your outfit is ready. Everything works together.
              </span>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2 h-12"
              onClick={onProceedToCheckout}
            >
              Proceed to checkout
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
        );
      })()}
    </div>
  );
}
