---
name: zeromark-style
description: Restyle an existing dashboard, admin panel, report or web app, or build a new one, in the "zeromark" visual style. That style is warm cream paper, near-black ink, one vermilion accent, Space Grotesk with IBM Plex Mono for numbers and labels, hairline cards and keycap chips. Works with any stack (plain HTML/CSS, Tailwind, React, Vue, Angular, Svelte, Bootstrap, MUI, Ant Design, Chakra, shadcn, Streamlit, Dash, Grafana) and any chart library (Chart.js, ECharts, Plotly, Highcharts, Apex, Recharts, D3, Vega, matplotlib). It changes styling only and preserves behaviour. Use when the user says "zeromark style", "make this dashboard look like zeromark", or "apply our house style".
---

# zeromark style

Restyle UI into the zeromark visual language **without changing what it does**. Everything you
need ships next to this file:

| File | What it is |
|---|---|
| `assets/zeromark.css` | Tokens (CSS variables, light + dark), components (`zm-*`), and **adopt mode** (`.zm-adopt` restyles bare HTML) |
| `assets/tokens.json` | The same tokens as data, for theme objects in JS, Python, and so on |
| `assets/zeromark-charts.js` | Chart themes: Chart.js, ECharts, Plotly, Highcharts, ApexCharts, Vega, plus raw tokens |
| `assets/zeromark-fx.js` | **The signature layer**: a confetti field that settles into the page's own data, count-ups, reveals, row-form, strips, chains |
| `assets/tailwind.preset.js` | Tailwind v3 preset; the v4 `@theme` snippet is in its header comment |
| `reference/style-guide.md` | **Read first.** The rules: palette roles, type, density, components, do and don't |
| `reference/stack-recipes.md` | Exactly where the tokens go for each framework, component library and chart library |
| `scripts/snap.js` | Screenshots plus QA: contrast failures, horizontal overflow, console errors, font loading |

Paths are relative to this skill's base directory (shown when the skill loads). Copy assets
**into the target project** (e.g. `static/zeromark/`). Never link to this skill's folder from product code.

## Workflow

### 1. Detect the stack (don't ask if you can look)
```bash
ls; cat package.json 2>/dev/null | head -60
ls tailwind.config.* postcss.config.* angular.json vite.config.* next.config.* 2>/dev/null
grep -rIl --include=*.{html,js,jsx,ts,tsx,vue,svelte,py,R} -E "chart\.js|echarts|plotly|highcharts|apexcharts|recharts|d3|vega|matplotlib|streamlit|dash" . 2>/dev/null | grep -v node_modules | head
grep -rIoh -E "@mui|antd|@chakra-ui|bootstrap|bulma|shadcn|@radix-ui|vuetify|primereact|@angular/material" --include=package.json . 2>/dev/null | sort -u
```
Note: the styling entry point (global CSS, theme file, layout template), the component library,
the chart library, and whether the app has a dark mode already.

### 2. Baseline
Run `node <skill>/scripts/snap.js <url-or-file> design-qa/before --full` for each distinct page or
state you will touch. For a dev-server app, start it first (use the project's run script). If
Playwright isn't available, say so and ask for screenshots, or proceed and verify by reading the code carefully.
Read the screenshots. Then list the page's components: nav, filters, KPI tiles, tables, charts, forms,
tabs, modals, toasts, empty/loading/error states.

### 3. Install the tokens at the stack's theme layer, once
Follow `reference/stack-recipes.md` for this stack. Order of preference:
1. **The stack's own theme system** (MUI `createTheme`, AntD `ConfigProvider`, Bootstrap Sass/CSS vars,
   Tailwind preset, Vuetify theme, shadcn CSS vars, Streamlit `config.toml`, and so on), fed from `tokens.json` values.
2. **`zeromark.css`** loaded globally, after the existing CSS, plus fonts.
3. For plain HTML with no framework: `zeromark.css` plus `class="zm-adopt"` on `<body>` gets ~80% with zero
   markup changes. Then add `zm-*` classes for KPI tiles, chips, pills and cards to finish the job.

Then theme the charts with `zeromark-charts.js` (or the equivalent values in Python/R; see the recipes).

### 4. Choose the level: expressive (default) or quiet
A palette swap alone looks like "a beige theme", not zeromark. **Default to expressive** and apply the
signature layer (section 8 of `reference/style-guide.md`) on top of the component mapping. Use **quiet**
(component mapping only) only when the user asks, or for dense operator screens viewed all day
(trading blotters, log viewers, admin CRUD).

Expressive, at minimum:
1. **Masthead.** A `zm-masthead` with a `zm-statement` headline built from the dashboard's own top numbers
   ("48,210 requests a minute. *3 incidents need eyes.*"; the second line in flame says what needs attention),
   a short `zm-lede`, the page's existing controls, and a `zm-field` canvas whose confetti **settles into a real
   series from the page** (`ZeromarkFX.field(canvas, { stacks | columns | cells, colLabels, legend, clear })`).
2. **Numbered sections.** `zm-section` → `zm-kicker` "01 · Traffic" + `zm-section-title` with a flame half-sentence that
   states the takeaway, derived from the data shown.
3. **Motion that carries meaning.** `data-zm-count` on KPI values, `zm-reveal-group` on KPI and card rows,
   `zm-table--animate` on tables, and `ZeromarkFX.init()` once at the end.
4. **Mono figures.** One `zm-figure` per section at most, e.g. in a doughnut centre or a closing "0 pages unanswered".
5. Where the data exists, render it as a signature component: per-entity-per-day status → `zm-strip`; a sequence or
   pipeline → `zm-chain`; quick filters → `zm-keys` of `zm-chip`.

**Never invent numbers or claims.** Every headline, takeaway and figure must come from data already on the page or
its API. If the takeaway isn't derivable, use a neutral title without the flame half.

### 5. Map components
Use the mapping table in `reference/style-guide.md`. Rules that matter most:
- **Numbers are mono** (IBM Plex Mono, tabular). KPI values, table numerics, axis ticks, timestamps.
- **Labels are mono, uppercase and tracked** (11px, +0.12em, muted): table headers, KPI labels, field labels.
- **One accent.** Flame is for the primary action, the selected state, one highlighted series, and focus rings. Everything else
  stays neutral. Status colours (ok/warn/bad/info) appear only where the data means it.
- **Hairlines, not shadows.** Cards are `card` bg with 1px `border` and 14px radius. No drop shadows except popovers.
- **Density inside cards, drama around them.** Cards stay compact (16px gaps, 20px padding, 14px table text). The
  editorial scale lives in the masthead, the section titles and the figures.

### 6. Hard constraints
- **Behaviour-preserving diffs.** Don't touch data fetching, event handlers, routes, IDs, `name`/`for` attributes,
  `data-testid`/test selectors, ARIA semantics, or feature flags. Only add classes; don't remove ones scripts rely on.
- Keep both themes working if the app had dark mode (`data-zm-theme="dark"`, or map the app's toggle onto it).
- Respect `prefers-reduced-motion`; no layout shift from webfont swap (`display=swap` is fine).
- If fonts can't load from Google (corporate network), self-host the woff2 files or accept the system fallback. Say which.
- Do not use zeromark's logo, name or copy. This is a visual style, not their brand.

### 7. Verify
Run `snap.js` again to `design-qa/after` (both themes if relevant). Then:
- Compare before and after screenshots: every component should be restyled, nothing missing or broken.
- Ask yourself: "would someone who's seen zeromark.io recognise this?" If the answer is "it's just beige", the
  signature layer is missing or too timid. Go back to step 4. (Use `--wait 3000` so the field has settled.)
- `contrastFailures` must be empty, or each one explained (decorative text only).
- `overflowX` must be 0 at 390px; `consoleErrors` must be no worse than before.
- Run the project's tests and linters if they exist.
Fix and repeat. Usually that takes two rounds.

### 8. Report
List the files changed, the theme entry point, components restyled, anything left unstyled (and why), and the
before/after screenshot paths. Add `design-qa/` to `.gitignore` unless the user wants the screenshots kept.

## When the user wants a *new* page
Build with `zeromark.css` components directly, using `reference/style-guide.md`. For a marketing-style page,
use the editorial layout (centred column, `zm-kicker`, `zm-display`, `zm-hero`, `zm-rings`). For a dashboard, use the grid layout.
