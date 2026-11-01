# zeromark style guide

Measured from zeromark.io on 2026-11-01 (raw capture: `captured-tokens.json`), then extended for
dashboards. The dark theme is derived; the original is light-only.

## 1. What the style is
Warm, editorial and calm. It reads like printed paper that happens to be interactive. Its impact
comes from **restraint**: one accent colour, two typefaces, hairline borders, generous space and
numbers set in monospace. If a screen looks busy, remove something before adding anything.

## 2. Palette roles (light / dark)

| Role | Token | Light | Dark | Use |
|---|---|---|---|---|
| Page | `--zm-paper` | #faf7f0 | #171513 | App background |
| Surface | `--zm-card` | #fffdf8 | #1f1c19 | Cards, inputs, table bodies, popovers |
| Sunken | `--zm-sunken` | #f3efe6 | #262220 | Hover rows, wells, tab tracks, skeletons |
| Hairline | `--zm-border` | #e7e0d3 | #3a342e | All 1px borders |
| Ink | `--zm-ink` | #1c1917 | #f6f2ea | Headings, values, primary text in tables |
| Body | `--zm-soft` | #44403c | #d6cfc4 | Paragraphs |
| Muted | `--zm-muted` | #716a65 | #a39a8f | Labels, captions, axis ticks (4.5:1 on paper) |
| Faint | `--zm-faint` | #a8a29e | #6f675f | Placeholders and decoration only. **Never** informative text |
| Accent | `--zm-flame` | #f0472c | #ff5a3c | Primary button fill, selected state, focus ring, highlight series, large accent text |
| Accent text | `--zm-flame-dark` | #d13a22 | #ff7a60 | Accent text under 24px (links, kickers) |
| Accent fill | `--zm-flame-fill` | #d63c22 | #ff5a3c | Fill **behind text** (primary button, brand mark). Text on it = `--zm-on-flame` (white / near-black in dark) for AA. zeromark.io itself uses #f0472c with white, which is 3.7:1 and fails AA. |

**Series (categorical, in this order):** flame #f0472c, sage #2f6f4f, steel #4a76a8, ochre #c9a063,
lavender #a77bd0, stone #57534e. With more than six series, group the tail into "Other". Don't cycle.
**Sequential:** #fdf0ea → #f9c9b8 → #f49a80 → #f0472c → #b8301a. **Diverging:** sage ↔ #efe9dd ↔ flame.
**Status** (text / tint / border): ok #2f6f4f / #eef3ec / #a8b9a6, warn #8a6528 / #f7efe0 / #d9c08f,
bad #c2341d / #fdf0ea / #eaa898, info #35597f / #eef1f4 / #aebdcc.

When a chart highlights one series against others, make the highlight flame and the rest stone or muted.

## 3. Typography

| Use | Font | Size / weight / tracking |
|---|---|---|
| Landing hero | Space Grotesk | 40–62px / 700 / -0.03em / lh 1.04 |
| Page title (dashboard) | Space Grotesk | 28–40px / 700 / -0.03em |
| Section title | Space Grotesk | 20–24px / 700 / -0.02em |
| Card title | Space Grotesk | 15px / 700 / -0.01em |
| Body | Space Grotesk | 15px (dash) – 19px (landing) / 400 / lh 1.6–1.7 |
| Label / table header / kicker | IBM Plex Mono | 11–12px / 500 / uppercase / +0.08–0.14em |
| KPI value | IBM Plex Mono | 28–40px / 400 / -0.02em / tabular |
| Narrative number | IBM Plex Mono | 56–110px / 400, with a muted unit word at 0.32em |
| Data in tables, ticks, timestamps | IBM Plex Mono | 12–14px / 400 / tabular |

Headings never go below 700 or above 700. Mono never goes bold beyond 500.

## 4. Shape, depth, motion
- Radii: 14px for cards, KPI tiles and tables; 10px for wells, popovers and day-cards; 7px for buttons, inputs and chips; pills fully round.
- Depth comes from a 1px hairline plus a surface-colour step. Shadows only on popovers and menus (`--zm-shadow-pop`)
  and the primary CTA glow (`--zm-shadow-cta`).
- Keycap chips have a 2px darker bottom border. That is the signature detail for filters and shortcuts.
- Motion: 140ms ease for hover. Entrances use `zm-rise` (14px up and fade, 600ms, staggered 60ms) and
  `zm-pop`. Nothing loops except the skeleton shimmer and a scroll cue. Honour reduced motion.
- Optional texture: `zm-rings` (faint concentric rings) behind a hero or empty state. Use it once per page at most.

## 5. Component mapping (existing UI → zeromark)

| You find | Make it |
|---|---|
| Top navbar / header | `zm-topbar`: blurred paper, hairline bottom; brand = flame square + bold wordmark; links `zm-nav` |
| Sidebar | `zm-sidebar`: paper bg, hairline right; group labels `zm-label`; active link = card bg + hairline ring |
| Page header | Kicker (`zm-kicker`, optional) + `zm-h1` + muted one-line description; actions right-aligned |
| KPI / stat cards | `zm-kpi`: mono uppercase label, mono value, `zm-delta up/down/flat` pill, muted comparison text |
| Generic panel / widget / card | `zm-card` with `zm-card-head` (title left, actions/legend right) |
| Data table / grid | `zm-table` in `zm-card--flush` + `zm-table-wrap`; numeric columns `.num`; status cells use `zm-pill--*` |
| Filter bar / quick filters | Row of `zm-chip` (toggle with `aria-pressed`); date range and select as `zm-select` |
| Tabs / view switch | `zm-tabs` segmented control |
| Primary action | `zm-btn--primary` (flame pill). **One per view.** |
| Secondary / tertiary | `zm-btn` / `zm-btn--ghost`; destructive `zm-btn--danger` |
| Tags / categories | `zm-chip--{red,green,blue,lav,ochre}`, or a `zm-dot` + text in the series colour |
| Status badge | `zm-pill--ok/warn/bad/info` |
| Progress / utilisation | `zm-bar` with flame fill (or a status colour at thresholds) |
| Alerts / banners | `zm-alert--*` |
| Empty state | `zm-empty`, optionally with a `zm-display` "0" and a unit word ("0 open incidents") |
| Loading | `zm-skeleton` blocks matching the final layout |
| Modal / popover / menu | `card` bg, hairline, 14px radius, `--zm-shadow-pop`; title `zm-h2` |
| Form | `zm-field` (mono label) + `zm-input` / `zm-select` / `zm-textarea`; focus = flame border + wash ring |
| Charts | Theme via `zeromark-charts.js`: mono ticks, hairline grid, no chart border, legend top-left, rounded bars |

## 6. Dashboard layout
- Max width 1280–1440px, page padding 24px (16px on phones), gaps 16px, card padding 20px.
- Order: page header → KPI row (`zm-grid` with `--zm-min: 200px`) → primary chart (span 8) + secondary (span 4)
  → table. Use `zm-grid-12` spans; everything stacks under 900px.
- Tables scroll horizontally inside their card on phones; the page itself never scrolls sideways.

## 7. Do and don't
- Do keep the background paper-coloured and use the card colour only for surfaces that hold content.
- Do put units and comparison text in muted mono next to numbers ("42 ms", "vs last week").
- Don't introduce new colours, gradients or glassmorphism. Don't use bold mono. Don't use flame for errors (use `--zm-bad`).
- Don't centre dashboard content. The centred single column is for landing pages only.
- Don't use zeromark's logo, name, illustrations or copy.
