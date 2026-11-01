---
name: ui-from-reference
description: Build a polished landing page or app UI in the visual style of a reference website (e.g. "make it look like zeromark.io", "UI like linear.app"). Captures the reference's screenshots and design tokens, writes a style brief, then builds original UI with that look and verifies it against the reference side by side. Use when the user points at a site whose design they admire and wants something similar.
---

# UI from reference

Goal: capture the **visual language** of a reference site (palette, type, spacing, depth,
motion, layout rhythm) and apply it to **the user's own content and product**. Never copy the
reference's copy, logo, brand name, illustrations, or images: the result must be an original
design that clearly belongs to the user.

## 1. Capture the reference

```bash
node <skill>/scripts/extract-design.js <url> design-ref/<name>
```

This writes `desktop.png`, `mobile.png`, `sections/NN.png` and `tokens.json` (computed colors,
fonts, type scale, radii, shadows, gradients, borders, transitions, backdrop filters, CSS
variables, keyframes, motion libraries in use, canvas/video counts).

- If the host is blocked (DNS failure or proxy 403), tell the user the domain must be added to
  the environment's allowed network domains, **or** ask for screenshots. Work from screenshots
  plus the user's description. Never invent what a site you can't see looks like.
- Look at **every** screenshot with the Read tool. Tokens tell you the values; screenshots tell
  you the composition.

## 2. Write the style brief

Write `design-ref/<name>/BRIEF.md` before you write any code. Cover:

| Area | Capture |
|---|---|
| Mood | 3 adjectives, plus what makes it feel premium or "insane" (be specific) |
| Palette | bg / surface / elevated / border / text / muted / accent(s) as hex; dark or light first |
| Type | display + body + mono families (pick the closest Google Font if the original is proprietary), scale, weights, tracking on display sizes, line heights |
| Layout | max width, grid, section padding, hero composition, density |
| Surfaces | radii, borders (often 1px hairlines with low alpha), shadows, glass/blur, noise/grain |
| Signature effects | gradients, glows, spotlight cursors, grid/dot backgrounds, marquee logos, bento grids, animated borders, 3D/canvas |
| Motion | entrance (fade/translate/blur), scroll reveals, hover states, durations and easing |
| Components | nav, buttons (primary/secondary), cards, badges/pills, inputs, footer |

Rank the effects by how much they contribute to the look. Build the top 3 first.

## 3. Build

- Default stack: a single `index.html` with inline CSS and vanilla JS. Use the project's own stack
  if it has one (React/Tailwind etc.).
- Put every token in CSS custom properties on `:root`. Components only reference tokens.
- Techniques that usually create the "wow" (use only the ones the brief calls for):
  - Display headline: large (clamp 48–96px), tight tracking (-0.02 to -0.04em), line-height ~1.05,
    sometimes a gradient text fill (`background-clip:text`).
  - Depth on dark: surfaces 2–4% lighter than bg, 1px borders at `rgba(255,255,255,.06–.12)`,
    an inner top highlight (`inset 0 1px 0 rgba(255,255,255,.06)`).
  - Ambient glow: blurred radial gradients behind the hero; a masked grid or dot pattern that fades
    at the edges (`mask-image: radial-gradient(...)`).
  - Grain: an SVG `feTurbulence` noise overlay at 3–6% opacity.
  - Animated border: a conic-gradient pseudo-element rotating behind a 1px-inset card.
  - Cursor spotlight on cards: set `--x/--y` on pointermove and use them in a radial-gradient background.
  - Scroll reveals: IntersectionObserver that adds a class (opacity 0→1, translateY 12px→0,
    blur 6px→0, 600ms `cubic-bezier(.2,.7,.2,1)`), staggered.
  - Infinite logo marquee with edge fade masks; bento feature grid; product UI mock built in HTML/CSS
    rather than as a flat image.
- Respect `prefers-reduced-motion`. The layout must work at 390px wide with no horizontal scroll.
- Load scripts only from pinned CDN versions (e.g. `gsap@3.12.5`), and only if CSS can't do the job.

## 4. Verify against the reference

1. Screenshot your build with the same script:
   `node <skill>/scripts/extract-design.js index.html design-ref/build`
2. Read the reference and build screenshots side by side (desktop and mobile). List the
   differences in palette, type scale, spacing, depth and effects, fix the biggest ones, and
   repeat until it holds up. Usually that takes 2–3 rounds.
3. Check contrast (body text ≥ 4.5:1) and look at the mobile screenshot specifically.

## 5. Report

Tell the user which signature traits you reproduced, which you adapted or skipped and why, and
where the brief and screenshots live.

## Turning a captured style into a reusable skill

`<skill>` above means this skill's base directory (shown when the skill loads). To make a new house
style reusable across projects, copy the `zeromark-style` skill folder in this plugin, rename it, and
replace its `assets/` tokens and `reference/style-guide.md` with values from your `BRIEF.md` and
`tokens.json`. Keep the workflow and the `snap.js` QA step as they are.
