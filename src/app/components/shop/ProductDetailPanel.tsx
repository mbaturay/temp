import { useState } from 'react';
import { Star, ChevronLeft, Play, RefreshCw } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import type { BundleItem, Bundle, Alternative, IntentData } from '../../../lib/ai';
import { type CatalogItem } from '../../../data/catalog';
import { getAlternatives, getPDPExplanation } from '../../../lib/ai';
import { ProductIcon } from './ProductIcon';
import { getProductTier } from '../../../lib/productTier';
import { getProductImageSrc, parseProductName } from '../../lib/productImage';
import { ImageWithFallback } from '../figma/ImageWithFallback';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const CATEGORY_LABELS: Record<string, string> = {
  jacket: 'Jacket', base_layer: 'Base Layer', pants: 'Pants',
  gloves: 'Gloves', beanie: 'Beanie', goggles: 'Goggles', boots: 'Boots', socks: 'Socks',
};

const TRADEOFF_COLORS: Record<string, string> = {
  warmer: 'bg-orange-50 text-orange-700 border-orange-200',
  lighter: 'bg-sky-50 text-sky-700 border-sky-200',
  affordable: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  premium: 'bg-purple-50 text-purple-700 border-purple-200',
  neutral: 'bg-muted text-muted-foreground border-border',
};

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={`size-3.5 ${n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground/60">({count} reviews)</span>
    </div>
  );
}

// ── Alternatives view ─────────────────────────────────────────────────────────
function AlternativesView({
  alternatives,
  currentItem,
  onReplace,
  onBack,
}: {
  alternatives: Alternative[];
  currentItem: CatalogItem;
  onReplace: (item: CatalogItem) => void;
  onBack: () => void;
}) {
  if (alternatives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
        <p className="text-muted-foreground text-sm">No alternatives available in this category.</p>
        <button onClick={onBack} className="mt-4 text-sm text-foreground underline underline-offset-2">
          Back to product
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="size-4" />
        Back to product
      </button>

      <h3 className="mb-1">Alternatives</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Swapping{' '}
        <span style={{ fontWeight: 500 }}>{parseProductName(currentItem.name).displayName}</span>
        {' '}— choose a replacement below.
      </p>

      <div className="flex flex-col gap-3">
        {alternatives.map((alt) => {
          const altImageSrc = getProductImageSrc(alt.item);
          const { displayName: altDisplayName } = parseProductName(alt.item.name);
          return (
          <div
            key={alt.item.id}
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-foreground/30 transition-all group"
          >
            {/* Thumbnail */}
            <div className="size-16 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
              {altImageSrc ? (
                <ImageWithFallback src={altImageSrc} alt={altDisplayName} className="w-full h-full object-cover" />
              ) : (
                <ProductIcon category={alt.item.category} name={alt.item.name} tier={getProductTier(alt.item)} size={32} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-md border ${TRADEOFF_COLORS[alt.tradeoffType]}`} style={{ fontWeight: 500 }}>
                  {alt.tradeoff}
                </span>
              </div>
              <p className="text-sm truncate" style={{ fontWeight: 500 }}>{altDisplayName}</p>
              <p className="text-xs text-muted-foreground">{alt.item.brand}</p>
            </div>

            {/* Price + action */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span style={{ fontWeight: 700 }}>${alt.item.price}</span>
              <button
                onClick={() => onReplace(alt.item)}
                className="text-xs px-3 py-1 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
                style={{ fontWeight: 500 }}
              >
                Select
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  bundleItem: BundleItem | null;
  bundle: Bundle;
  intentData: Partial<IntentData>;
  defaultSize: string;
  onClose: () => void;
  onReplace: (newItem: CatalogItem, oldItemId: string) => void;
}

export function ProductDetailPanel({ open, bundleItem, bundle, intentData, defaultSize, onClose, onReplace }: Props) {
  const [selectedSize, setSelectedSize] = useState(defaultSize || 'M');
  const [showAlternatives, setShowAlternatives] = useState(false);

  if (!bundleItem) return null;

  const item = bundleItem.catalogItem;
  const productImageSrc = getProductImageSrc(item);
  const { displayName } = parseProductName(item.name);
  const aiExplanation = getPDPExplanation(item, intentData);
  const alternatives = getAlternatives(item, bundle);

  const handleReplace = (newItem: CatalogItem) => {
    onReplace(newItem, item.id);
    setShowAlternatives(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      setShowAlternatives(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="overflow-y-auto flex flex-col gap-0 p-0">
        <div className="flex flex-col flex-1 p-6">
          <SheetHeader className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                {CATEGORY_LABELS[item.category]}
              </Badge>
            </div>
            <SheetTitle className="text-left leading-snug">{displayName}</SheetTitle>
          </SheetHeader>

          {showAlternatives ? (
            <AlternativesView
              alternatives={alternatives}
              currentItem={item}
              onReplace={handleReplace}
              onBack={() => setShowAlternatives(false)}
            />
          ) : (
            <>
              {/* ── Product image ── */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted mb-5 flex items-center justify-center">
                {productImageSrc ? (
                  <ImageWithFallback src={productImageSrc} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <ProductIcon category={item.category} name={item.name} tier={getProductTier(item)} size={112} />
                )}
              </div>

              {/* ── Brand + rating ── */}
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{item.brand}</p>
              <StarRating rating={item.rating} count={item.ratingCount} />

              {/* ── Price ── */}
              <div className="flex items-baseline gap-2 mt-3 mb-5">
                <span className="text-2xl" style={{ fontWeight: 700 }}>${item.price}</span>
                <span className="text-sm text-muted-foreground line-through">${item.originalPrice}</span>
                <span className="text-sm text-emerald-600 ml-1">Save ${item.originalPrice - item.price}</span>
              </div>

              <Separator className="mb-5" />

              {/* ── AI explanation ── */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/60 mb-5">
                <span className="text-xs mt-0.5 text-muted-foreground">✦</span>
                <p className="text-sm text-muted-foreground italic">{aiExplanation}</p>
              </div>

              {/* ── Size selector ── */}
              <div className="mb-5">
                <p className="text-sm mb-3" style={{ fontWeight: 500 }}>Size</p>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`w-11 h-10 rounded-lg border text-sm transition-all ${
                        selectedSize === s
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border hover:border-foreground/50'
                      }`}
                      style={{ fontWeight: selectedSize === s ? 500 : 400 }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Video placeholder ── */}
              <div className="relative rounded-xl overflow-hidden bg-muted mb-6 aspect-video flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="size-10 rounded-full bg-background/80 flex items-center justify-center">
                    <Play className="size-5 ml-0.5" />
                  </div>
                  <p className="text-xs">Product video preview (coming soon)</p>
                </div>
              </div>

              {/* ── Rationale ── */}
              <p className="text-sm text-muted-foreground italic leading-relaxed mb-6">
                {bundleItem.rationale}
              </p>

              {/* ── Actions ── */}
              <div className="flex flex-col gap-2 mt-auto">
                <Button
                  className="w-full gap-2"
                  onClick={() => setShowAlternatives(true)}
                >
                  <RefreshCw className="size-4" />
                  Replace in bundle
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAlternatives(true)}
                >
                  View similar options
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}