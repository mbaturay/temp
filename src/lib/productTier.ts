import { catalog as defaultCatalog, type CatalogItem } from '../data/catalog';

export type ProductTier = 'value' | 'standard' | 'premium';

// ── Tag-based tier bump ────────────────────────────────────────────────────────
const BUMP_TAGS = [
  'premium',
  'pro',
  'gore-tex',
  'goretex',
  'merino',
  'insulated',
  'technical',
];

const TIER_ORDER: ProductTier[] = ['value', 'standard', 'premium'];

function bumpTier(tier: ProductTier): ProductTier {
  const idx = TIER_ORDER.indexOf(tier);
  return TIER_ORDER[Math.min(idx + 1, TIER_ORDER.length - 1)];
}

function shouldBump(tags: string[]): boolean {
  const lower = tags.map((t) => t.toLowerCase());
  return BUMP_TAGS.some((bt) => lower.some((t) => t.includes(bt)));
}

// ── Category normalization ─────────────────────────────────────────────────────
const CATEGORY_SYNONYMS: Record<string, string> = {
  bibs: 'pants',
  bib: 'pants',
  'base-layer': 'base_layer',
  baselayer: 'base_layer',
  goggle: 'goggles',
  boot: 'boots',
  sock: 'socks',
  glove: 'gloves',
  hat: 'beanie',
  cap: 'beanie',
  mitten: 'gloves',
  mittens: 'gloves',
};

function normalizeCategory(cat: string): string {
  const key = cat.toLowerCase().trim().replace(/[\s-]+/g, '-');
  return CATEGORY_SYNONYMS[key] ?? key.replace(/-/g, '_');
}

// ── Threshold computation ──────────────────────────────────────────────────────
interface Thresholds {
  /** Price at or below → value */
  valueCeil: number;
  /** Price at or above → premium */
  premiumFloor: number;
}

function computeThresholds(prices: number[]): Thresholds {
  const sorted = [...prices].sort((a, b) => a - b);
  const n = sorted.length;

  if (n === 1) {
    // Single item: treat as standard (middle)
    return { valueCeil: sorted[0] - 1, premiumFloor: sorted[0] + 1 };
  }
  if (n === 2) {
    // Two items: cheaper = value, pricier = premium
    return { valueCeil: sorted[0], premiumFloor: sorted[1] };
  }

  // Tercile boundaries: bottom third / top third
  const t1 = sorted[Math.floor(n / 3)];
  const t2 = sorted[Math.ceil((2 * n) / 3) - 1];
  // If all prices are equal, spread evenly so everything is standard
  if (t1 === t2) {
    return { valueCeil: t1 - 1, premiumFloor: t1 + 1 };
  }
  return { valueCeil: t1, premiumFloor: t2 };
}

const MIN_CATEGORY_SIZE = 3;

let _cache: { catalog: CatalogItem[]; byCategory: Map<string, Thresholds>; overall: Thresholds } | null = null;

function getThresholds(cat: string, fullCatalog: CatalogItem[]): Thresholds {
  // Use cached result if catalog reference is the same
  if (_cache && _cache.catalog === fullCatalog) {
    return _cache.byCategory.get(cat) ?? _cache.overall;
  }

  // Build per-category price lists
  const priceByCat = new Map<string, number[]>();
  for (const item of fullCatalog) {
    const normCat = normalizeCategory(item.category);
    const arr = priceByCat.get(normCat) ?? [];
    arr.push(item.price);
    priceByCat.set(normCat, arr);
  }

  const allPrices = fullCatalog.map((i) => i.price);
  const overall = computeThresholds(allPrices);

  const byCategory = new Map<string, Thresholds>();
  for (const [catKey, prices] of priceByCat) {
    byCategory.set(
      catKey,
      prices.length >= MIN_CATEGORY_SIZE ? computeThresholds(prices) : overall,
    );
  }

  _cache = { catalog: fullCatalog, byCategory, overall };
  return byCategory.get(cat) ?? overall;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Compute the tier for a product using category-relative price thresholds.
 *
 * @param product  - The product to classify
 * @param catalog  - Full catalog array (defaults to the imported catalog)
 */
export function getProductTier(
  product: CatalogItem,
  catalog: CatalogItem[] = defaultCatalog,
): ProductTier {
  const normCat = normalizeCategory(product.category);
  const thresholds = getThresholds(normCat, catalog);

  // Price-based tier within category
  let tier: ProductTier;
  if (product.price <= thresholds.valueCeil) {
    tier = 'value';
  } else if (product.price >= thresholds.premiumFloor) {
    tier = 'premium';
  } else {
    tier = 'standard';
  }

  // Tag-based upward bump (never downward)
  if (shouldBump(product.tags)) {
    tier = bumpTier(tier);
  }

  return tier;
}

/** Tailwind text-color class for a given tier. */
export function getTierColorClass(tier: ProductTier): string {
  const map: Record<ProductTier, string> = {
    value: 'text-slate-500',
    standard: 'text-sky-600',
    premium: 'text-amber-600',
  };
  return map[tier];
}
