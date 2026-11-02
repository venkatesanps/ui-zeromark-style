# Stack recipes: where the tokens go

Values come from `assets/tokens.json` (light shown; dark is in the same file). Copy the assets you need
into the project first, e.g. `cp -r <skill>/assets ./static/zeromark`.

Fonts are the same everywhere:
```html
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
```
Behind a corporate proxy, self-host: `npm i @fontsource/space-grotesk @fontsource/ibm-plex-mono` and import
`@fontsource/space-grotesk/{400,500,700}.css` and `@fontsource/ibm-plex-mono/{400,500}.css`, or download the
woff2 files and add `@font-face` rules.

---

## Plain HTML / server templates (Jinja, Thymeleaf, ERB, Razor, PHP, JSP)
1. In the base layout `<head>`: the fonts, then `<link rel="stylesheet" href="/static/zeromark/zeromark.css">`
   **after** existing stylesheets.
2. `<body class="zm-adopt">`. Bare `table`, `button`, `input`, `select`, `h1–h3`, `.card/.panel/.widget`
   restyle automatically.
3. Upgrade the pieces adopt mode can't infer: KPI tiles → `zm-kpi` markup, filters → `zm-chip`, statuses →
   `zm-pill--*`, the primary action → `zm-btn--primary`, numeric cells → `class="num"`.
4. If old CSS still wins (e.g. `table { background: #fff }` with higher specificity), neutralise that rule
   in the old file or add a scoped override. Don't use `!important` sprays.
5. Dark mode: `<html data-zm-theme="auto">` (follow OS) or toggle `"dark"` / `"light"` from your existing switch.
6. Signature layer: `<script src="/static/zeromark/zeromark-fx.js"></script>` at the end of `<body>`, then
   `ZeromarkFX.field(document.querySelector('.zm-field'), { stacks or columns or cells, colLabels, legend, clear: headlineEl })`
   and `ZeromarkFX.init()`. In React/Vue/Svelte, call these in a mount effect (`useEffect`, `onMounted`, `onMount`) on
   the canvas ref, and call `ZeromarkFX.reveal(containerEl)` again after data loads, so new rows animate in.
7. Story mode: no canvas needed (`stage()` creates a fixed one). Mark sections up as `.zm-scene` / `.zm-scene--pin` and call
   `ZeromarkFX.stage({ groups, scenes })` after the data is available. In SPAs, call it once per page mount, call
   `.refresh()` on the returned handle after layout changes (data loaded, fonts loaded), and remove the
   `canvas.zm-stage` element on unmount.

KPI markup:
```html
<div class="zm-kpi">
  <div class="zm-kpi-label">Active users</div>
  <div class="zm-kpi-value">12,480<small>/day</small></div>
  <div class="zm-kpi-foot"><span class="zm-delta up">+4.2%</span> vs last week</div>
</div>
```

## Bootstrap 5
Sass (preferred):
```scss
$primary: #f0472c; $danger: #c2341d; $success: #2f6f4f; $warning: #c9a063; $info: #4a76a8;
$body-bg: #faf7f0; $body-color: #44403c; $headings-color: #1c1917; $border-color: #e7e0d3;
$font-family-sans-serif: "Space Grotesk", "Segoe UI", system-ui, sans-serif;
$font-family-monospace: "IBM Plex Mono", ui-monospace, monospace;
$headings-font-weight: 700; $border-radius: 7px; $border-radius-lg: 14px; $card-border-radius: 14px;
$card-bg: #fffdf8; $card-cap-bg: transparent; $box-shadow: none; $btn-font-weight: 500;
$table-bg: #fffdf8; $table-hover-bg: #f3efe6; $table-border-color: rgba(231,224,211,.55);
$input-bg: #fffdf8; $input-border-color: #e7e0d3; $input-focus-border-color: #f0472c;
$input-focus-box-shadow: 0 0 0 3px rgba(240,71,44,.12);
@import "bootstrap/scss/bootstrap";
.table thead th { font: 500 11px var(--zm-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--zm-muted); }
.btn-primary { border-radius: 999px; font-weight: 700; }
```
CDN-only Bootstrap: load `zeromark.css` after it, put `zm-adopt` on body (adopt targets `.card`, `.btn-primary`), and set
`:root { --bs-body-bg: var(--zm-paper); --bs-body-color: var(--zm-soft); --bs-border-color: var(--zm-border); --bs-body-font-family: var(--zm-font); --bs-primary: #f0472c; --bs-primary-rgb: 240,71,44; --bs-link-color: var(--zm-flame-dark); }`
plus `.btn-primary { --bs-btn-bg: var(--zm-flame); --bs-btn-border-color: var(--zm-flame); --bs-btn-hover-bg: var(--zm-flame-dark); --bs-btn-hover-border-color: var(--zm-flame-dark); }`.

## Tailwind
- v3: `presets: [require('./static/zeromark/tailwind.preset.js')]` and import `zeromark.css` in the global CSS.
  Then use `bg-zm-paper`, `bg-zm-card border border-zm-border rounded-zm-lg`, `font-zm-mono text-[11px] uppercase tracking-zm-label text-zm-muted`, etc.
- v4: use the `@theme inline` block from the preset's header comment.
- Replace `shadow-*` on cards with `border border-zm-border`; replace the brand/primary colour utilities with `zm-flame`.
- If the codebase repeats long class strings, add `@layer components { .card { @apply ... } }` rather than editing 200 files by hand.

## shadcn/ui (Radix + Tailwind CSS variables)
In `globals.css` (HSL format; newer shadcn uses oklch, so convert with the same hues if needed):
```css
:root {
  --background: 42 50% 96%; --foreground: 24 10% 10%;
  --card: 43 100% 99%; --card-foreground: 24 10% 10%;
  --popover: 43 100% 99%; --popover-foreground: 24 10% 10%;
  --primary: 8 87% 56%; --primary-foreground: 0 0% 100%;
  --secondary: 42 35% 93%; --secondary-foreground: 24 10% 10%;
  --muted: 42 35% 93%; --muted-foreground: 25 6% 42%;
  --accent: 42 35% 93%; --accent-foreground: 24 10% 10%;
  --destructive: 8 74% 44%; --destructive-foreground: 0 0% 100%;
  --border: 39 29% 87%; --input: 39 29% 87%; --ring: 8 87% 56%;
  --radius: 0.875rem;
  --chart-1: 8 87% 56%; --chart-2: 150 41% 31%; --chart-3: 212 39% 47%; --chart-4: 36 49% 59%; --chart-5: 271 47% 65%;
}
.dark {
  --background: 30 10% 8%; --foreground: 40 40% 94%; --card: 30 11% 11%; --card-foreground: 40 40% 94%;
  --popover: 30 11% 11%; --popover-foreground: 40 40% 94%; --primary: 9 100% 62%; --primary-foreground: 0 0% 100%;
  --secondary: 20 9% 14%; --secondary-foreground: 40 40% 94%; --muted: 20 9% 14%; --muted-foreground: 33 10% 60%;
  --accent: 20 9% 14%; --accent-foreground: 40 40% 94%; --destructive: 10 100% 73%; --border: 30 12% 20%; --input: 30 12% 20%; --ring: 9 100% 62%;
}
body { font-family: "Space Grotesk", system-ui, sans-serif; }
```
Then: `Card` should drop `shadow-sm`; `TableHead` gets `font-mono text-[11px] uppercase tracking-[.08em]`; `Badge` variants map to `zm-pill--*` colours.

## React with CSS-in-JS (styled-components, Emotion, vanilla-extract, Stitches)
`import zm from './zeromark/tokens.json'` and put `zm.light` / `zm.dark` into the `ThemeProvider`. Or simply
import `zeromark.css` once and reference `var(--zm-*)` in styles, which keeps dark mode free.

## MUI (Material UI v5/v6)
```js
import { createTheme } from '@mui/material/styles';
const t = { paper:'#faf7f0', card:'#fffdf8', sunken:'#f3efe6', border:'#e7e0d3', ink:'#1c1917', soft:'#44403c', muted:'#716a65', flame:'#f0472c', flameDark:'#d13a22' };
export const theme = createTheme({
  palette: { mode: 'light', primary: { main: t.flame, dark: t.flameDark, contrastText: '#fff' },
    success: { main: '#2f6f4f' }, warning: { main: '#c9a063' }, error: { main: '#c2341d' }, info: { main: '#4a76a8' },
    background: { default: t.paper, paper: t.card }, text: { primary: t.ink, secondary: t.muted }, divider: t.border },
  typography: { fontFamily: '"Space Grotesk", system-ui, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.03em' }, h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700 }, h4: { fontWeight: 700 }, h5: { fontWeight: 700 }, h6: { fontWeight: 700 },
    overline: { fontFamily: '"IBM Plex Mono", monospace', letterSpacing: '0.12em', fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 500 } },
  shape: { borderRadius: 7 },
  components: {
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiCard: { defaultProps: { variant: 'outlined' }, styleOverrides: { root: { borderRadius: 14, borderColor: t.border } } },
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { containedPrimary: { borderRadius: 999, fontWeight: 700 } } },
    MuiTableCell: { styleOverrides: { head: { fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.muted, fontWeight: 500 }, root: { borderColor: 'rgba(231,224,211,.55)' } } },
    MuiChip: { styleOverrides: { root: { fontFamily: '"IBM Plex Mono", monospace', borderRadius: 7 } } },
    MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: t.card, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: t.flame } }, notchedOutline: { borderColor: t.border } } },
  },
});
```
MUI X DataGrid: `sx={{ border: 1, borderColor: 'divider', borderRadius: '14px', '& .MuiDataGrid-columnHeaderTitle': { fontFamily: 'IBM Plex Mono', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em' } }}`.
MUI X Charts: pass `colors={['#f0472c','#2f6f4f','#4a76a8','#c9a063','#a77bd0','#57534e']}`.

## Ant Design v5
```jsx
<ConfigProvider theme={{
  token: { colorPrimary: '#f0472c', colorSuccess: '#2f6f4f', colorWarning: '#c9a063', colorError: '#c2341d', colorInfo: '#4a76a8',
    colorBgLayout: '#faf7f0', colorBgContainer: '#fffdf8', colorBgElevated: '#fffdf8', colorBorder: '#e7e0d3', colorBorderSecondary: '#efe9dd',
    colorText: '#1c1917', colorTextSecondary: '#716a65', fontFamily: '"Space Grotesk", system-ui, sans-serif', fontFamilyCode: '"IBM Plex Mono", monospace',
    borderRadius: 7, borderRadiusLG: 14, boxShadow: 'none', boxShadowSecondary: '0 12px 32px -16px rgba(28,25,23,.25)' },
  components: {
    Table: { headerBg: '#fffdf8', headerColor: '#716a65', rowHoverBg: '#f3efe6', borderColor: 'rgba(231,224,211,.55)' },
    Button: { primaryShadow: 'none', fontWeight: 500 }, Card: { headerFontSize: 15 }, Layout: { headerBg: '#faf7f0', siderBg: '#faf7f0', bodyBg: '#faf7f0' },
  } }}>
```
Plus `.ant-table-thead th { font-family: var(--zm-mono) !important; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }` (AntD sets the font inline, so `!important` is justified here).
Dark: `algorithm: theme.darkAlgorithm` with the dark token values.

## Chakra UI
v2: `extendTheme({ colors: { brand: { 500: '#f0472c', 600: '#d13a22' } }, fonts: { heading: 'Space Grotesk, sans-serif', body: 'Space Grotesk, sans-serif', mono: 'IBM Plex Mono, monospace' }, radii: { md: '7px', lg: '10px', xl: '14px' }, styles: { global: { body: { bg: '#faf7f0', color: '#44403c' } } }, components: { Button: { defaultProps: { colorScheme: 'brand' } } } })`.
v3: `createSystem(defaultConfig, { theme: { tokens: { colors: ..., fonts: ... } } })` with the same values.

## Vue / Nuxt / Vuetify
Plain Vue: import `zeromark.css` in `main.js`. Vuetify 3:
```js
createVuetify({ theme: { defaultTheme: 'zeromark', themes: { zeromark: { dark: false, colors: {
  background: '#faf7f0', surface: '#fffdf8', 'surface-variant': '#f3efe6', primary: '#f0472c', secondary: '#4a76a8',
  error: '#c2341d', success: '#2f6f4f', warning: '#c9a063', info: '#4a76a8', 'on-background': '#1c1917', 'on-surface': '#1c1917' } } } },
  defaults: { VCard: { variant: 'outlined', rounded: 'lg' }, VBtn: { variant: 'flat' } } })
```
Then set `$body-font-family` (Sass) or `.v-application { font-family: var(--zm-font) }`.

## Angular / Angular Material
Import `zeromark.css` in `angular.json` → `styles` (after the Material theme). For Material 3 (v18+), override the system tokens:
```css
:root { --mat-sys-primary: #f0472c; --mat-sys-on-primary: #fff; --mat-sys-surface: #fffdf8; --mat-sys-background: #faf7f0;
  --mat-sys-on-surface: #1c1917; --mat-sys-outline: #e7e0d3; --mat-sys-outline-variant: #e7e0d3; --mat-sys-error: #c2341d;
  --mat-sys-body-large-font: "Space Grotesk"; --mat-sys-label-small-font: "IBM Plex Mono"; }
```
For Material 2 themes, define a custom palette around #f0472c with `mat.m2-define-palette`. Header cells: `.mat-mdc-header-cell { font: 500 11px var(--zm-mono); text-transform: uppercase; letter-spacing: .08em; }`.

## Svelte / SvelteKit, Solid, Lit, htmx, Alpine
Import `zeromark.css` globally (`+layout.svelte`, the app entry, or the base template) and use the `zm-*` classes.
For Lit/shadow DOM, CSS variables pierce the shadow root but classes don't: use `var(--zm-*)` inside component styles.

## Streamlit
`.streamlit/config.toml`:
```toml
[theme]
base = "light"
primaryColor = "#f0472c"
backgroundColor = "#faf7f0"
secondaryBackgroundColor = "#f3efe6"
textColor = "#1c1917"
font = "sans serif"
```
Fonts and mono labels: `st.markdown('<style>@import url(<fonts url>); html, body, [class*="css"] { font-family: "Space Grotesk", sans-serif; } [data-testid="stMetricLabel"] { font-family: "IBM Plex Mono"; text-transform: uppercase; letter-spacing: .12em; font-size: 11px; } [data-testid="stMetricValue"] { font-family: "IBM Plex Mono"; }</style>', unsafe_allow_html=True)`.
Charts: use the Plotly template below, or Altair `alt.themes.register('zeromark', lambda: {'config': <ZeromarkCharts.vega() values>})`.

## Plotly Dash (Python)
Put `zeromark.css` in the app's `assets/` folder (auto-loaded), wrap the layout in `html.Div(className="zm-adopt zm-page")`,
and register a Plotly template:
```python
import plotly.io as pio, plotly.graph_objects as go
MONO, SANS = "IBM Plex Mono, monospace", "Space Grotesk, sans-serif"
ax = dict(gridcolor="#ece6da", zerolinecolor="#e7e0d3", linecolor="#e7e0d3", tickfont=dict(family=MONO, size=11, color="#716a65"))
pio.templates["zeromark"] = go.layout.Template(layout=dict(
    paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)", colorway=["#f0472c","#2f6f4f","#4a76a8","#c9a063","#a77bd0","#57534e"],
    font=dict(family=SANS, color="#44403c"), title=dict(font=dict(family=SANS, size=15, color="#1c1917"), x=0),
    xaxis=ax, yaxis=ax, legend=dict(orientation="h", y=1.12, x=0, font=dict(family=MONO, size=11)),
    hoverlabel=dict(bgcolor="#fffdf8", bordercolor="#e7e0d3", font=dict(family=MONO, color="#1c1917"))))
pio.templates.default = "zeromark"
```

## matplotlib / seaborn (static reports, notebooks)
```python
import matplotlib as mpl
mpl.rcParams.update({
  "figure.facecolor": "#faf7f0", "axes.facecolor": "#faf7f0", "savefig.facecolor": "#faf7f0",
  "axes.edgecolor": "#e7e0d3", "axes.labelcolor": "#716a65", "axes.titlecolor": "#1c1917", "axes.titleweight": "bold",
  "axes.titlelocation": "left", "axes.spines.top": False, "axes.spines.right": False, "axes.grid": True,
  "grid.color": "#ece6da", "grid.linewidth": 0.8, "xtick.color": "#716a65", "ytick.color": "#716a65",
  "text.color": "#44403c", "font.family": ["Space Grotesk", "DejaVu Sans"], "legend.frameon": False,
  "axes.prop_cycle": mpl.cycler(color=["#f0472c","#2f6f4f","#4a76a8","#c9a063","#a77bd0","#57534e"]),
})
```
(Fonts must be installed locally for matplotlib to use them.)

## R / ggplot2 and Shiny
ggplot: `theme_minimal(base_family = "Space Grotesk") + theme(plot.background = element_rect(fill = "#faf7f0", colour = NA), panel.grid = element_line(colour = "#ece6da"), axis.text = element_text(colour = "#716a65", family = "IBM Plex Mono"), plot.title = element_text(face = "bold", colour = "#1c1917"))` + `scale_colour_manual(values = c("#f0472c","#2f6f4f","#4a76a8","#c9a063","#a77bd0","#57534e"))`.
Shiny: `bslib::bs_theme(bg = "#faf7f0", fg = "#1c1917", primary = "#f0472c", base_font = font_google("Space Grotesk"), code_font = font_google("IBM Plex Mono"))`, then include `zeromark.css`.

## Chart libraries (JS)
`<script src="/static/zeromark/zeromark-charts.js"></script>` (or `import ZeromarkCharts from './zeromark/zeromark-charts.js'`), then:

| Library | Call |
|---|---|
| Chart.js 3/4 | `ZeromarkCharts.chartjs(Chart)` once, before creating charts. Unset dataset colours get the series palette. |
| ECharts | `echarts.registerTheme('zeromark', ZeromarkCharts.echarts()); echarts.init(el, 'zeromark')` |
| Plotly.js | `Plotly.newPlot(el, data, ZeromarkCharts.plotly(yourLayout))` |
| Highcharts | `Highcharts.setOptions(ZeromarkCharts.highcharts())` |
| ApexCharts | `new ApexCharts(el, { ...ZeromarkCharts.apex(), ...options })` (deep-merge if options set `chart`) |
| Vega / Vega-Lite / Altair | `spec.config = ZeromarkCharts.vega()` |
| Recharts | `const z = ZeromarkCharts.tokens()`; `<CartesianGrid stroke={z.grid} vertical={false}/>`, `<XAxis tick={{fontFamily: z.mono, fontSize: 11, fill: z.muted}} axisLine={{stroke: z.border}} tickLine={false}/>`, series `stroke/fill={z.series[i]}`, `<Bar radius={[4,4,0,0]}/>`, `<Tooltip contentStyle={{background: z.card, border: '1px solid ' + z.border, borderRadius: 10, fontFamily: z.mono}}/>` |
| Nivo | `theme={{ text: { fontFamily: z.mono, fill: z.muted }, grid: { line: { stroke: z.grid } } }}` and `colors={z.series}` |
| D3 | `d3.scaleOrdinal(z.series)`; axis text `font-family: var(--zm-mono)`; remove the domain line on the y axis |
| AG Grid | Theme params: `backgroundColor: '#fffdf8', headerBackgroundColor: '#fffdf8', borderColor: '#e7e0d3', foregroundColor: '#1c1917', accentColor: '#f0472c', fontFamily: 'Space Grotesk', headerFontFamily: 'IBM Plex Mono', headerFontSize: 11, rowHoverColor: '#f3efe6', wrapperBorderRadius: 14` (v32+ `themeQuartz.withParams`) |

Pass `'dark'` (or `'auto'`) as the last argument of any ZeromarkCharts call for dark charts, and re-render on theme toggle.

## BI tools
- **Power BI**: View → Themes → Browse for themes, with this JSON:
  `{"name":"zeromark","dataColors":["#f0472c","#2f6f4f","#4a76a8","#c9a063","#a77bd0","#57534e"],"background":"#fffdf8","foreground":"#1c1917","tableAccent":"#f0472c","good":"#2f6f4f","neutral":"#c9a063","bad":"#c2341d"}`.
  Set the page background to #faf7f0 and fonts to Segoe UI (Power BI can't load web fonts).
- **Tableau**: add the series palette to `Preferences.tps` as a regular palette; set worksheet shading to #faf7f0.
- **Grafana**: theming is limited. Set panel colour overrides to the series palette, use the light theme, and
  set thresholds to sage/ochre/#c2341d. A full restyle needs a custom build. Say so instead of hacking CSS.
- **Looker Studio**: Theme and layout → Customise: background #faf7f0, primary #f0472c, chart palette as above.
