/**
 * Tailwind preset for the zeromark style (Tailwind v3).
 *   // tailwind.config.js
 *   module.exports = { presets: [require('./zeromark/tailwind.preset.js')], ... }
 *
 * Colours reference the CSS variables in zeromark.css, so include that file too (it provides
 * light/dark switching). Use e.g. bg-zm-paper text-zm-ink border-zm-border font-zm-mono.
 *
 * Tailwind v4 (CSS-first): skip this file and add to your main CSS:
 *   @import "./zeromark/zeromark.css";
 *   @theme inline {
 *     --color-zm-paper: var(--zm-paper); --color-zm-card: var(--zm-card); --color-zm-sunken: var(--zm-sunken);
 *     --color-zm-border: var(--zm-border); --color-zm-ink: var(--zm-ink); --color-zm-soft: var(--zm-soft);
 *     --color-zm-muted: var(--zm-muted); --color-zm-flame: var(--zm-flame); --color-zm-flame-dark: var(--zm-flame-dark);
 *     --font-zm: var(--zm-font); --font-zm-mono: var(--zm-mono);
 *     --radius-zm-sm: 7px; --radius-zm-md: 10px; --radius-zm-lg: 14px;
 *   }
 */
const v = (name) => `var(--zm-${name})`;

module.exports = {
  theme: {
    extend: {
      colors: {
        zm: {
          paper: v('paper'), card: v('card'), sunken: v('sunken'), border: v('border'),
          ink: v('ink'), soft: v('soft'), muted: v('muted'), faint: v('faint'),
          flame: v('flame'), 'flame-dark': v('flame-dark'), 'flame-fill': v('flame-fill'), 'on-flame': v('on-flame'),
          s1: v('s1'), s2: v('s2'), s3: v('s3'), s4: v('s4'), s5: v('s5'), s6: v('s6'),
          ok: v('ok'), 'ok-bg': v('ok-bg'), warn: v('warn'), 'warn-bg': v('warn-bg'),
          bad: v('bad'), 'bad-bg': v('bad-bg'), info: v('info'), 'info-bg': v('info-bg'),
        },
      },
      fontFamily: {
        zm: ['"Space Grotesk"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        'zm-mono': ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: { 'zm-xs': '4px', 'zm-sm': '7px', 'zm-md': '10px', 'zm-lg': '14px' },
      letterSpacing: { 'zm-display': '-0.03em', 'zm-label': '0.12em' },
      boxShadow: {
        'zm-cta': 'inset 0 1px 0 rgba(255,255,255,.35), 0 10px 22px -12px rgba(240,71,44,.8)',
        'zm-pop': '0 1px 0 rgba(28,25,23,.04), 0 12px 32px -16px rgba(28,25,23,.25)',
      },
      transitionTimingFunction: { zm: 'cubic-bezier(.2,.7,.2,1)' },
    },
  },
};
