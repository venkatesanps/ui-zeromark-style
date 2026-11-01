# ui-zeromark-style

A Claude Code plugin that restyles **any dashboard or web UI, in any stack**, into the zeromark visual
style: warm cream paper, near-black ink, one vermilion accent, Space Grotesk headings with IBM Plex Mono
for numbers and labels, hairline cards and keycap chips. It keeps behaviour intact, adds the signature
layer (a confetti field that settles into your dashboard's own data, statement headlines, mono figures and
numbered sections), then proves it with before/after screenshots and automated contrast and overflow checks.
Ask for the *quiet* level if you only want the palette and components.

| Before | After (light) | After (dark) |
|---|---|---|
| ![before](docs/before.png) | ![after](docs/after.png) | ![after dark](docs/after-dark.png) |

Source: [`examples/dashboard-before.html`](examples/dashboard-before.html) → [`examples/dashboard-after.html`](examples/dashboard-after.html).
Same IDs, same handlers, same data.

## What's inside

| Path | What it does |
|---|---|
| `skills/zeromark-style/` | **The skill.** Workflow, style guide, per-stack recipes, assets and QA script |
| `skills/zeromark-style/assets/zeromark.css` | Drop-in stylesheet: tokens (light/dark/auto), `zm-*` components, and **adopt mode** (`<body class="zm-adopt">` restyles bare HTML) |
| `skills/zeromark-style/assets/zeromark-fx.js` | **Signature layer**: confetti field that settles into your own data, count-ups, reveals, status strips, timelines |
| `skills/zeromark-style/assets/zeromark-charts.js` | Chart themes: Chart.js, ECharts, Plotly, Highcharts, ApexCharts, Vega; raw tokens for Recharts/D3/Nivo |
| `skills/zeromark-style/assets/tailwind.preset.js` | Tailwind v3 preset (v4 `@theme` snippet in the header) |
| `skills/zeromark-style/assets/tokens.json` | All tokens as data, for Python, R, BI tools, CSS-in-JS |
| `skills/zeromark-style/reference/stack-recipes.md` | Exact setup for HTML/templates, Bootstrap, Tailwind, shadcn, MUI, Ant Design, Chakra, Vuetify, Angular Material, Svelte, Streamlit, Dash, matplotlib, ggplot/Shiny, AG Grid, Power BI, Tableau, Looker Studio, Grafana |
| `skills/zeromark-style/scripts/snap.js` | Screenshots plus a QA report: WCAG contrast failures, horizontal overflow, console errors, font loading |
| `agents/zeromark-restyler.md` | Subagent that runs the whole restyle in its own context. Run one per dashboard to restyle several in parallel |
| `skills/ui-from-reference/` | Generic version: capture **any** reference site's design tokens and screenshots to build or define a new style |

## Install

### Option A: as a plugin (recommended)
In Claude Code, in any work repo:
```
/plugin marketplace add venkatesanps/ui-zeromark-style
/plugin install zeromark-style@ui-zeromark-style
```
Updates: `/plugin marketplace update ui-zeromark-style`.
To make it available to everyone on a repo automatically, commit this to the repo's `.claude/settings.json`:
```json
{
  "extraKnownMarketplaces": {
    "ui-zeromark-style": { "source": { "source": "github", "repo": "venkatesanps/ui-zeromark-style" } }
  },
  "enabledPlugins": { "zeromark-style@ui-zeromark-style": true }
}
```

### Option B: copy the folders into your repo (no plugin commands needed)
Use this if `/plugin` commands or marketplaces aren't allowed at work. A plugin is just a folder of files,
and Claude Code picks up skills and agents from your repo's `.claude/` folder automatically.

**1. Download the code.** Either:
- ZIP: <https://github.com/venkatesanps/ui-zeromark-style/archive/refs/heads/main.zip>, then unzip it (the folder is `ui-zeromark-style-main`)
- git: `git clone https://github.com/venkatesanps/ui-zeromark-style`

If GitHub downloads are blocked at work, download it elsewhere and bring it in however you normally move files.

**2. Copy two folders into your repo.** From your repo's root, with `<downloaded>` being the folder from step 1:

Mac / Linux / Git Bash
```bash
mkdir -p .claude/skills .claude/agents
cp -r <downloaded>/skills/zeromark-style .claude/skills/
cp <downloaded>/agents/zeromark-restyler.md .claude/agents/
```

Windows PowerShell
```powershell
New-Item -ItemType Directory -Force .claude\skills, .claude\agents | Out-Null
Copy-Item -Recurse <downloaded>\skills\zeromark-style .claude\skills\
Copy-Item <downloaded>\agents\zeromark-restyler.md .claude\agents\
```

Your repo then looks like:
```
your-repo/
  .claude/
    skills/zeromark-style/        SKILL.md, assets/, reference/, scripts/
    agents/zeromark-restyler.md
```

**3. Use it.** Start a new Claude Code session in that repo (skills load at startup) and ask in plain words, e.g.
"apply the zeromark style to `dashboards/sales.html`", or type `/zeromark-style`.

Optional:
- **Share with your team:** commit the `.claude/` folder, and everyone who uses Claude Code on the repo gets the skill.
- **Use it in every repo on your machine:** copy into `~/.claude/skills/` and `~/.claude/agents/` instead
  (Windows: `%USERPROFILE%\.claude\skills\` and `%USERPROFILE%\.claude\agents\`).
- **Capture other sites' styles too:** also copy `skills/ui-from-reference`.

**Updating:** there's no update command with this method. Download again and copy the folder over the old one.

### Option C: no Claude at all
The style files work on their own. Copy these from `skills/zeromark-style/assets/` into your project
(e.g. `static/zeromark/`) and link them by hand:
```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="static/zeromark/zeromark.css">
<body class="zm-adopt"> ... </body>
<script src="static/zeromark/zeromark-charts.js"></script>   <!-- if you use Chart.js, ECharts, Plotly and similar -->
<script src="static/zeromark/zeromark-fx.js"></script>       <!-- confetti masthead, count-ups, animations -->
```
[`examples/dashboard-after.html`](examples/dashboard-after.html) is a working template to copy from, and
`skills/zeromark-style/reference/stack-recipes.md` gives the setup for each framework (Tailwind uses
`tailwind.preset.js`; Python, R and BI tools use the values in `tokens.json`).

## Use

Ask in plain words:
- "Apply the zeromark style to `reports/sales.html`"
- "Restyle this React dashboard in zeromark style, light and dark"
- "Use the zeromark-restyler agent on each dashboard under `dashboards/`, in parallel"
- "Theme our Streamlit app and its Plotly charts in zeromark style"

Or call it directly: `/zeromark-style:zeromark-style <target>`.

The skill detects the stack, snapshots the current UI, installs the tokens at the stack's own theme layer, maps
each component (KPI tiles, tables, filters, charts, forms, states), and verifies with `snap.js`.

### Screenshot QA needs Playwright
```bash
npm i -D playwright && npx playwright install chromium     # once per machine/project
node <skill>/scripts/snap.js http://localhost:3000/dashboard design-qa/after --full --widths 1440,390
```
Behind a proxy, or with Chrome already installed, set `CHROMIUM_PATH=/path/to/chrome`. Playwright is optional. Without
Playwright the skill still works, but you check the result by eye.

### Corporate networks
Google Fonts blocked? `npm i @fontsource/space-grotesk @fontsource/ibm-plex-mono`, or self-host the woff2 files.
The CSS falls back to system fonts cleanly.

## Notes
- The light palette and type were measured from zeromark.io; the dark theme is derived.
- One deliberate deviation: the button fill is `#d63c22` instead of `#f0472c`, so white text passes WCAG AA (4.6:1 vs 3.7:1).
- This is a visual *style*. Don't use zeromark's name, logo, illustrations or copy in your products.

MIT licence.
