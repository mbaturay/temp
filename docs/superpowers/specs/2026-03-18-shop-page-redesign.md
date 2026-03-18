# Shop Page Redesign — Spec

## Summary
Redesign the Shop results page from a floating-controls + drawer-chat layout to a traditional e-commerce layout with: inline AI chat bar, left sidebar filters with sliders, video hero with floating essentials, and a restructured product grid.

## Layout (top → bottom)

### 1. Video Hero with Floating Essentials
- Full-width video background (reuse existing `ski.mp4`)
- Right side: 3-4 stacked mini product cards ("essentials") floating over the video
  - Each shows: product name, price, brand, "Add to Cart" and "Quick View" buttons
  - These are the top-scored items from the bundle, giving a preview before scrolling

### 2. "Your Adventure" Bar (replaces AI drawer)
- Dark full-width bar, always visible (sticky below header)
- Left: "Your Adventure" title + trip context pills (activity · location · season · skill)
- Center: Chat input — "Not seeing what you need? Tell us more..."
  - Submitting triggers the same keyword-based AI engine from AIAssistantDrawer
  - Responses appear as a toast/inline message, bundle updates in real-time
- Right: "Start Over" button

### 3. "Edit Your Adventure Profile" (collapsible)
- Shows trip context as text, chevron to expand
- When expanded: shows the adventure details (activity, location, season, skill level)
- Collapsed by default

### 4. Bundle Summary Banner
- "Recommended Gear" heading + "Curated for your {activity} adventure"
- Right side: "Adventure Bundle Total: $X" with original price crossed out
- Savings callout: "Save $X (Y% off) when you purchase all recommended items"

### 5. Main Content Area (sidebar + grid)

#### Left Sidebar — "Refine Your Bundle"
- **Style ↔ Performance slider** (existing)
- **Budget ↔ Premium slider** (existing)
- **Category checkboxes**: derived from bundle items' categories
- **Price Range**: Min/Max number inputs
- **Brand checkboxes**: derived from bundle items' brands
- **Product Type checkboxes**: derived from catalog categories
- **Bundle Status**: "In my bundle", "Essential items", "Optional upgrades"

#### Product Grid (right of sidebar)
- 3-column grid (2 on tablet, 1 on mobile)
- Cards show: image, product name, star rating, price, weight, "Add to Cart" button
- Weight field: use a static mapping since catalog doesn't have weight data
- Cards animate on filter changes

## Files Changed

| File | Change |
|------|--------|
| `src/app/pages/Shop.tsx` | Major rewrite of `ResultsPage` component |
| `src/app/components/shop/AIAssistantDrawer.tsx` | Remove (replaced by inline bar) |
| `src/app/components/chat/BundleRecommendation.tsx` | Refactor into new grid card design |
| `src/data/catalog.ts` | Add `weight` field to CatalogItem |

## What stays the same
- `shop-session-context.tsx` — session state management unchanged
- `src/lib/ai.ts` — bundle generation, adjustBundle, all AI logic unchanged
- `ProductDetailPanel.tsx` — PDP sheet stays as-is
- Cart context — unchanged
- Onboarding + building views — unchanged, only results view changes
