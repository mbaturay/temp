Context: Layout Refinement Only (Do Not Change Logic or Features)

Continue working from the current prototype.
Do not modify business logic, AI behavior, product rules, or interactions.
This task is layout, hierarchy, and spatial refinement only.

Core Layout Goal

Rebalance the page so that products are always visible when tuning controls affect them.

Currently, tuning controls (sliders, summaries) consume too much vertical space and push the product grid below the fold.
This breaks the cause → effect relationship when products update dynamically.

Primary Layout Changes (High Priority)
1️⃣ Promote Products to the First Fold

Ensure the product grid appears within the first visible viewport on desktop.

Products should be the visual anchor of the page.

All tuning controls must support the products, not compete with them.

2️⃣ Introduce a Compact Sticky “Tuning Rail”

Move all continuous tuning controls into a single compact sticky rail positioned above the product grid.

The tuning rail should:

Remain visible while scrolling the product grid

Have a maximum height of ~96–120px

Contain:

Overall Vibe slider (compact)

Budget Priority slider (compact)

Design guidance:

Remove helper paragraphs

Use concise labels only

Use tooltips or hover states for explanations

Reduce vertical padding aggressively

3️⃣ Collapse “Why This Outfit Works” by Default

Show only:

Section title

One-line summary

Expand on click/tap

This section should not push products below the fold.

Secondary Layout Adjustments
4️⃣ Reposition Context Chips

Move context chips (e.g., Beginner · Men · Size XL · Under $700 · 7 items):

Place them directly above the product grid

Style them as product metadata, not setup controls

5️⃣ Add Visual Feedback for Dynamic Updates

When tuning controls update products:

Apply a subtle visual cue to affected product cards:

brief fade

shimmer

or “Updated” micro-badge

This should be minimal and non-distracting.

6️⃣ Reduce Vertical Density of Controls

Compress slider height

Reduce spacing between labels and controls

Remove redundant instructional copy

Controls should feel like professional tuning, not onboarding.

Design Constraints

Do NOT add new features

Do NOT remove existing controls

Do NOT change interaction behavior

Do NOT introduce new navigation patterns

This is a layout and hierarchy pass only.

Success Criteria

The layout is successful if:

Products are visible when sliders are adjusted

The page feels product-first, not control-first

Dynamic updates are immediately perceivable

The experience feels calmer and more confident

Apply these refinements across the bundle page and any related screens that share the same control/product relationship.