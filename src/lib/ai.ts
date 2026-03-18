import { catalog, type CatalogItem, type Category, type StyleTag } from '../data/catalog';

// ── Shared types ──────────────────────────────────────────────────────────────
export interface IntentData {
  activity: string;
  location: string;
  month: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  gender?: string;
  size: string;
  budget: number;
  // Extended fields from new adventure flow
  description?: string;
  season?: string;
  terrain?: string[];
  pantsSize?: string;
  shoeSize?: string;
}

export function seasonToMonth(season: string): string {
  switch (season) {
    case 'Spring': return 'March';
    case 'Summer': return 'June';
    case 'Fall': return 'October';
    case 'Winter': return 'January';
    default: return 'January';
  }
}

export interface BundleItem {
  catalogItem: CatalogItem;
  rationale: string;
}

export interface Bundle {
  items: BundleItem[];
  totalPrice: number;
  originalPrice: number;
  savings: number;
}

export interface ParsedIntent {
  budget: number;
  keywords: string[];
  isSkiIntent: boolean;
}

// ── Skill → Style mapping ─────────────────────────────────────────────────────
export function skillToStyle(skill: string): string {
  if (skill === 'Advanced') return 'Premium';
  if (skill === 'Intermediate') return 'Sporty';
  return 'Classic'; // Beginner default
}

// ── Skill → initial slider position (0–100) ───────────────────────────────────
export function skillToSliderDefault(skill: string): number {
  if (skill === 'Advanced') return 75;
  if (skill === 'Intermediate') return 30;
  return 50; // Beginner → Classic → mid-range
}

// ── Inference message (smart, implicit) ───────────────────────────────────────
export function getInferenceMessage(data: Partial<IntentData>): string {
  const { activity = '', location = '', month = '', skillLevel = '' } = data;
  const combined = `${activity} ${location} ${month}`.toLowerCase();
  const isAlpine = /whistler|alps|rockies|sierra|aspen|vail|tignes|chamonix|mountain|alpine/i.test(location);
  const isWinter = /january|february|december|november|winter/i.test(month);
  const isSki = /ski|snowboard|snow/.test(activity.toLowerCase());
  const isBeginner = skillLevel === 'Beginner';

  if (isSki && isAlpine && isWinter)
    return `Cold alpine conditions detected — prioritising warmth and insulation${isBeginner ? ' for a comfortable first experience' : ''}.`;
  if (isSki && isWinter)
    return 'Cold conditions detected — waterproofing and warmth are prioritised.';
  if (isSki || isAlpine)
    return 'Mountain terrain detected — recommending layered, weather-resistant pieces.';
  if (isWinter || /winter|cold|freeze/.test(combined))
    return 'Winter conditions detected — warmth and protection are prioritised.';
  return 'Outdoor activity detected — recommending versatile, weather-ready pieces.';
}

// ── PDP explanation ───────────────────────────────────────────────────────────
export function getPDPExplanation(item: CatalogItem, data: Partial<IntentData>): string {
  const { location = '', activity = '', skillLevel = 'Intermediate' } = data;
  const isAlpine = /whistler|alps|rockies|mountain|alpine/i.test(location);
  const isWinter = /ski|snow|winter/.test(activity.toLowerCase());
  const conditionsCtx = isAlpine ? 'cold alpine conditions' : isWinter ? 'winter conditions' : 'outdoor conditions';
  const skillCtx =
    skillLevel === 'Beginner' ? 'beginner comfort' :
    skillLevel === 'Advanced' ? 'advanced performance' :
    'all-round versatility';
  return `Selected for ${conditionsCtx} and ${skillCtx}.`;
}

// ── Alternatives for PDP replace flow ────────────────────────────────────────
export interface Alternative {
  item: CatalogItem;
  tradeoff: string;
  tradeoffType: 'warmer' | 'lighter' | 'affordable' | 'premium' | 'neutral';
}

export function getAlternatives(item: CatalogItem, bundle: Bundle): Alternative[] {
  const currentIds = bundle.items.map((i) => i.catalogItem.id);
  const candidates = catalog.filter(
    (c) => c.category === item.category && c.id !== item.id && !currentIds.includes(c.id)
  );

  return candidates.slice(0, 4).map((candidate) => {
    if (candidate.price < item.price * 0.88) {
      return { item: candidate, tradeoff: 'More affordable', tradeoffType: 'affordable' };
    }
    if (candidate.price > item.price * 1.12) {
      return { item: candidate, tradeoff: 'More premium', tradeoffType: 'premium' };
    }
    const hasMoreWarmth =
      (candidate.tags.includes('down-fill') || candidate.tags.includes('insulation')) &&
      !item.tags.includes('down-fill');
    if (hasMoreWarmth) return { item: candidate, tradeoff: 'Warmer', tradeoffType: 'warmer' };
    const isLighter = candidate.tags.includes('lightweight') && !item.tags.includes('lightweight');
    if (isLighter) return { item: candidate, tradeoff: 'Lighter', tradeoffType: 'lighter' };
    if (candidate.style === 'premium' && item.style !== 'premium')
      return { item: candidate, tradeoff: 'More premium', tradeoffType: 'premium' };
    return { item: candidate, tradeoff: 'Different style', tradeoffType: 'neutral' };
  });
}

// ── Budget priority adjustment ────────────────────────────────────────────────
function combineVibeAndBudget(vibe: number, budget: number): string {
  const combined = (vibe / 100) * 0.6 + (budget / 100) * 0.4;
  if (combined < 0.35) return 'Sporty';
  if (combined > 0.65) return 'Premium';
  return 'Classic';
}

export function adjustBundle(
  currentBundle: Bundle,
  vibePriority: number,
  budgetPriority: number,
  preferences: { budget: number; size: string },
  changedSlider: 'vibe' | 'budget' = 'budget'
): { bundle: Bundle; message: string } {
  const effectiveStyle = combineVibeAndBudget(vibePriority, budgetPriority);
  const newBundle = generateBundle({ budget: preferences.budget, size: preferences.size, style: effectiveStyle });

  if (changedSlider === 'vibe') {
    if (vibePriority < 33) return { bundle: newBundle, message: 'Performance-first mode — technical pieces prioritised.' };
    if (vibePriority > 67) return { bundle: newBundle, message: 'Refined selection — elevated materials and a polished aesthetic.' };
    return { bundle: newBundle, message: 'Balanced vibe — pieces that perform and look great.' };
  }

  // Budget slider feedback — specific, item-level when possible
  const oldJacket = currentBundle.items.find((i) => i.catalogItem.category === 'jacket');
  const newJacket = newBundle.items.find((i) => i.catalogItem.category === 'jacket');
  const jacketChanged = newJacket?.catalogItem.id !== oldJacket?.catalogItem.id;

  if (jacketChanged && newJacket && oldJacket) {
    if (newJacket.catalogItem.price > oldJacket.catalogItem.price) {
      return { bundle: newBundle, message: `We invested more in the jacket — it's versatile across skill levels.` };
    }
    return { bundle: newBundle, message: `Accessories dialled back to keep costs down — warmth essentials preserved.` };
  }

  const totalDiff = newBundle.totalPrice - currentBundle.totalPrice;
  if (totalDiff > 20) return { bundle: newBundle, message: 'Prioritised quality on key warmth items.' };
  if (totalDiff < -20) return { bundle: newBundle, message: 'Optimised for best value — essentials protected.' };
  return { bundle: newBundle, message: 'Bundle adjusted for your preferences.' };
}

// Backward-compatible wrapper
export function adjustBundleForPriority(
  currentBundle: Bundle,
  priority: number,
  preferences: { budget: number; size: string }
): { bundle: Bundle; message: string } {
  return adjustBundle(currentBundle, 50, priority, preferences, 'budget');
}

// ── Weather context ───────────────────────────────────────────────────────────
export function getWeatherContext(month: string, location: string): { icon: string; label: string } {
  const isAlpine = /whistler|alps|rockies|sierra|mountain|alpine|vail|aspen|tignes|chamonix/i.test(location);
  const isWinter = /january|february|december|november/i.test(month);
  const isSummer = /june|july|august/i.test(month);
  if (isAlpine && isWinter) return { icon: '❄️', label: `${location} • ${month} conditions` };
  if (isWinter) return { icon: '🌨️', label: `${location} • ${month} conditions` };
  if (isAlpine) return { icon: '🏔️', label: `${location} • ${month} conditions` };
  if (isSummer) return { icon: '☀️', label: `${location} • ${month} conditions` };
  return { icon: '🌤️', label: `${location} • ${month} conditions` };
}

// ── "Why This Works" summary ──────────────────────────────────────────────────
export function getWhyThisWorksSummary(intentData: IntentData, style: string, bundle: Bundle): string {
  const { activity, location, month, skillLevel } = intentData;
  const isAlpine = /whistler|alps|rockies|sierra|mountain|alpine|vail|aspen|tignes|chamonix/i.test(location);
  const isWinter = /january|february|december|november|winter/i.test(month);

  const conditions =
    isAlpine && isWinter ? `cold alpine conditions in ${location}` :
    isAlpine ? `mountain conditions in ${location}` :
    isWinter ? `winter conditions near ${location}` :
    `${month} conditions in ${location}`;

  const priorities =
    style === 'Premium' ? 'premium performance and material quality' :
    style === 'Sporty' ? 'technical performance and weight savings' :
    'warmth, comfort, and all-round durability';

  const activityNoun =
    /ski/i.test(activity) ? 'skier' :
    /snowboard/i.test(activity) ? 'snowboarder' :
    'adventurer';

  const subject = `a ${skillLevel.toLowerCase()} ${activityNoun}`;

  const jacket = bundle.items.find((i) => i.catalogItem.category === 'jacket');
  let confidenceNote = '';
  if (jacket && skillLevel === 'Beginner') {
    confidenceNote = ` The ${jacket.catalogItem.name} is a smart long-term investment — ready for conditions beyond this trip.`;
  } else if (style === 'Premium') {
    confidenceNote = ` Every piece was selected for durability and sustained performance in demanding conditions.`;
  } else if (style === 'Sporty') {
    confidenceNote = ` Weight and mobility were key criteria — nothing unnecessary included.`;
  } else {
    confidenceNote = ` Every item is compatible — no gaps in warmth or coverage.`;
  }

  return `Built for ${conditions}, this setup prioritises ${priorities} for ${subject}.${confidenceNote}`;
}

// ── Intent parsing ──────────────────────────────────────────────────────────
export function parseIntent(text: string): ParsedIntent {
  const lower = text.toLowerCase();
  const budgetMatch = text.match(/\$(\d+)/);
  const budget = budgetMatch ? parseInt(budgetMatch[1]) : 500;

  const keywords = lower.split(/\s+/).filter(Boolean);
  const isSkiIntent = /ski|snowboard|snow|slope|mountain|winter|powder|resort/.test(lower);

  return { budget, keywords, isSkiIntent };
}

// ── Rationale generation (deterministic) ────────────────────────────────────
export function generateRationale(item: CatalogItem): string {
  const t = item.tags;

  if (item.category === 'jacket') {
    if (t.includes('down-fill')) return 'Premium down fill delivers superior warmth-to-weight ratio on the mountain.';
    if (t.includes('waterproof') && t.includes('insulation')) return 'Waterproof shell + thermal insulation keeps you warm and dry through all conditions.';
    return 'Wind-resistant outer layer with sealed seams blocks the harshest slope conditions.';
  }
  if (item.category === 'base_layer') {
    if (t.includes('merino-wool')) return 'Natural merino wool regulates temperature and prevents odour during full-day runs.';
    return 'Moisture-wicking tech pulls sweat away so you stay dry and comfortable all day.';
  }
  if (item.category === 'pants') {
    if (t.includes('bib')) return 'Bib cut eliminates the gap between jacket and pants — no snow sneaks in.';
    if (t.includes('lightweight')) return 'Lightweight race-fit construction maximises mobility without sacrificing warmth.';
    return 'Waterproof outer shell stands up to wet snow and wind on groomed runs.';
  }
  if (item.category === 'gloves') {
    if (t.includes('down-fill')) return 'Down-filled insulation and a waterproof shell keep hands warm all day long.';
    return 'Insulated grip keeps hands warm through full-day sessions with touchscreen-compatible fingertips.';
  }
  if (item.category === 'beanie') {
    if (t.includes('merino-wool')) return 'Slim merino construction pairs seamlessly under a helmet without adding bulk.';
    return 'Stretch-fit design sits snug under any helmet and reflects light on low-visibility days.';
  }
  if (item.category === 'goggles') {
    if (t.includes('magnetic-lens')) return 'Magnetic lens swap lets you switch tints in seconds as light conditions change.';
    return 'Anti-fog UV lenses provide wide-field visibility in flat light and bright sun.';
  }
  if (item.category === 'boots') {
    return 'Waterproof insulated boot with aggressive grip — built for lift-to-lodge days.';
  }
  if (item.category === 'socks') {
    return 'Merino cushioned sock prevents boot bite and keeps feet at the right temperature.';
  }
  return 'A well-matched piece for your ski weekend kit.';
}

// ── Bundle generation ────────────────────────────────────────────────────────
function stylePriority(item: CatalogItem, targetStyle: string): number {
  const ts = targetStyle.toLowerCase() as StyleTag;
  if (item.style === ts) return 0;
  if (item.style === 'all') return 1;
  if (item.style === 'classic') return 2; // classic is a safe universal fallback
  return 3;
}

function pickItem(
  category: Category,
  targetStyle: string,
  exclude: string[] = []
): CatalogItem | undefined {
  return catalog
    .filter((item) => item.category === category && !exclude.includes(item.id))
    .sort((a, b) => {
      const pDiff = stylePriority(a, targetStyle) - stylePriority(b, targetStyle);
      if (pDiff !== 0) return pDiff;
      // For premium style prefer more expensive; for others prefer cheaper
      return targetStyle.toLowerCase() === 'premium'
        ? b.price - a.price
        : a.price - b.price;
    })[0];
}

export function generateBundle(preferences: {
  budget: number;
  size: string;
  style: string;
}): Bundle {
  const { budget, style } = preferences;

  const REQUIRED: Category[] = ['jacket', 'base_layer', 'pants', 'gloves', 'beanie'];
  const OPTIONAL: Category[] = ['goggles', 'socks'];

  const selectedItems: BundleItem[] = [];
  const usedIds: string[] = [];
  let runningTotal = 0;

  // Pick required items
  for (const category of REQUIRED) {
    const item = pickItem(category, style, usedIds);
    if (item) {
      selectedItems.push({ catalogItem: item, rationale: generateRationale(item) });
      usedIds.push(item.id);
      runningTotal += item.price;
    }
  }

  // Add optional items only if budget allows
  for (const category of OPTIONAL) {
    const item = pickItem(category, style, usedIds);
    if (item && runningTotal + item.price <= budget) {
      selectedItems.push({ catalogItem: item, rationale: generateRationale(item) });
      usedIds.push(item.id);
      runningTotal += item.price;
    }
  }

  const totalPrice = selectedItems.reduce((s, i) => s + i.catalogItem.price, 0);
  const originalPrice = selectedItems.reduce((s, i) => s + i.catalogItem.originalPrice, 0);

  return {
    items: selectedItems,
    totalPrice,
    originalPrice,
    savings: originalPrice - totalPrice,
  };
}

// ── Replace item helper ───────────────────────────────────────────────────────
export function getReplacement(
  category: Category,
  targetStyle: string,
  exclude: string[]
): CatalogItem | undefined {
  return pickItem(category, targetStyle, exclude);
}

// ── Bundle summary line ───────────────────────────────────────────────────────
export function getBundleSummary(style: string, intentText: string, budget: number): string {
  const isSnow = /ski|snow|slope|powder|mountain|winter/.test(intentText.toLowerCase());
  const context = isSnow ? 'on the mountain' : 'outdoors';
  if (style === 'Sporty') {
    return `Technical, performance-focused picks ${context} — all under your $${budget} budget.`;
  }
  if (style === 'Premium') {
    return `Top-tier materials and construction built to perform in every condition — under $${budget}.`;
  }
  return `Timeless, well-proven picks that balance warmth, durability, and value — under $${budget}.`;
}