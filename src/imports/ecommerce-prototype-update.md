Context: Prototype Expansion (Do Not Restart)

Continue working from the existing prototype.
Do not reset, redesign from scratch, or remove existing screens unless explicitly instructed.
This is an expansion and refinement of intelligence, flow, and ecommerce depth.

Product Framing (Locked)

This is not a chatbot shopping experience.
It is an AI-guided ecommerce flow where brief conversational input is used only to capture intent and constraints.

After onboarding, the experience becomes a structured ecommerce flow (bundles, product cards, PDPs, refinements).

Use Placeholders Everywhere

Product images: gray boxes or generic apparel silhouettes

Video: static thumbnail with “Video preview (placeholder)”

Products: mock names, mock prices, mock ratings

No real data, no real assets required

Speed and clarity are more important than realism.

1️⃣ Update Onboarding — Intent Template (High Priority)

Replace any generic free-text chat input with a guided intent sentence builder.

UI pattern:
A single card or panel with fill-in-the-blank structure:

I want to do [ activity ]
in [ location ]
around [ time / month ]
and I consider myself [ skill level ]

Example (shown as helper text):

“I want to go skiing in Whistler around January and I consider myself a beginner.”

Inputs should be:

Activity (text or suggestions)

Location (text)

Time (month / season)

Skill level (Beginner / Intermediate / Advanced)

Include Gender (Respectful, Neutral)

Add a selector:

Shopping for

Women

Men

Unisex

Prefer not to say

This should influence product selection logic, not tone or messaging.

2️⃣ Smart Inference (Implicit, Not Visible UI)

The system should implicitly infer:

Weather from location + time

Performance needs from activity + skill level

Add subtle helper copy such as:

“Cold alpine conditions detected — prioritizing warmth and insulation.”

Do NOT show raw reasoning or rules.

3️⃣ Bundle Recommendation Page (Core Experience)

Promote the bundle page as the hero ecommerce screen.

Layout:

Product bundle displayed as a grid or stacked cards

Each product card shows:

Placeholder image

Name

Price

Rating

One-line AI rationale (e.g. “Chosen for warmth and durability in cold conditions”)

Include a bundle summary:

Total price

“Saved $X” (placeholder)

4️⃣ Budget Slider (Smart, Dynamic)

Add a budget slider at the top of the bundle page.

Label:

Budget Priority
← Better value        Higher quality →

When the slider moves:

Higher budget → upgrade quality of key items (e.g. jacket first)

Lower budget → downgrade accessories first (e.g. gloves, beanie)

Core warmth/safety items should not be removed for beginners

Add subtle system feedback like:

“Upgraded jacket for long-term versatility.”

5️⃣ Product Detail Page (PDP)

Add a Product Detail Page reachable by clicking any product in the bundle.

PDP should include:

Larger placeholder image

Product name, price, rating

Size selector

Short AI explanation:

“Selected for cold alpine conditions and beginner comfort.”

Placeholder video thumbnail:

“Product video preview (coming soon)”

Primary CTA:

Replace in bundle

Secondary:

View similar options

6️⃣ Replace-in-Bundle Flow

When “Replace in bundle” is clicked:

Show 3–4 alternative products (placeholders)

Each alternative labeled with a clear tradeoff:

Warmer

Lighter

More affordable

More premium

Keep the user inside the bundle context — no catalog browsing.

7️⃣ Add-to-Cart + Checkout Handoff

Keep existing add-to-cart behavior, but ensure:

The CTA is tied to the bundle, not individual items

Confirmation reinforces confidence:

“Your outfit is ready. Everything works together.”

Checkout remains a simulated handoff screen.

Design & Tone Guidance

AI should feel smart but quiet

Prefer short explanatory copy over conversation

This should feel like shopping with expert guidance, not chatting

Deliverable

Update existing screens and add new ones as needed to support:

Intent template onboarding

Smarter inference

Bundle-first ecommerce flow

PDP + replace-in-bundle

Budget-aware intelligence

Use placeholders for all assets.
Focus on flow, hierarchy, and decision support.