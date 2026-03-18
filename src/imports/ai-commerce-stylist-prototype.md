You are building a desktop-first prototype web app: AI Commerce Stylist.
Purpose: demonstrate an AI-powered conversational shopping assistant that creates bundled apparel recommendations from user intent and supports add-to-cart inside chat with a checkout handoff.

Project constraints (must follow):

This is a prototype: use mock data and simulated AI. No real LLM calls.

Platform: desktop-first (1440px). Mobile responsiveness is optional.

UI: use shadcn/ui only. Do NOT use MUI anywhere.

No authentication, no Supabase, no persistence.

Routing (react-router):

/ Homepage (hero + CTA “Shop with AI”)

/shop AI Chat experience (main flow)

/checkout Checkout handoff confirmation

Build these pages and components:

Homepage (/)

Hero headline: “Shop smarter with your personal AI stylist”

Primary CTA button → navigates to /shop

Secondary link: “Browse products” (can be non-functional)

Shop Page (/shop) — Chat-First UI

Chat layout with message bubbles and input

Start state: AI greeting + example prompt hint

User can type: “Ski weekend outfit under $500”

The app runs a mock intent parser and asks 2 minimal clarification questions using quick-select chips:

Size (S/M/L)

Style (Sporty / Classic / Premium)

After clarifications, show an AI message with a Bundle Recommendation (3–6 items):

Jacket, base layer, pants, gloves, beanie (use mock catalog)

Each item must show: image (placeholder), name, price, rating, and 1-line rationale

Bundle summary shows: total price and “saved $X” (simulated)

Provide per-item actions: Replace / Remove (simple behavior is fine)

Provide primary CTA: “Add full bundle to cart — $XXX”

On click: show inline confirmation and a button “Proceed to checkout” → /checkout

Checkout Page (/checkout)

Confirmation summary showing items + total

Message: “This is a prototype checkout handoff”

Button: “Back to shop” → /shop

Data and logic requirements:

Create src/data/catalog.ts with 12–20 apparel items (name, category, price, rating, image placeholder URL, tags like warm/layering/waterproof).

Create simple logic in src/lib/ai.ts:

Parse intent keywords (ski/weekend/budget)

Select a bundle that fits budget

Generate short rationales using deterministic rules (e.g., “waterproof + insulation”).

No network calls.

Deliverable:

A fully working prototype app with the routes above, consistent shadcn/ui styling, and the complete demo flow: intent → clarify → bundle → refine → add-to-cart → checkout.

Build everything end-to-end now: routes, pages, components, mock data, and minimal styling.