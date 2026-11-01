#!/usr/bin/env node
/*
 * snap.js: screenshot a page and run the zeromark QA checks.
 *
 *   node snap.js <url-or-file> <out-prefix> [--widths 1440,390] [--theme light|dark] [--wait 800] [--full]
 *
 * Writes <out-prefix>-<width>.png (viewport, or full page with --full) and prints JSON:
 *   consoleErrors      JS errors / console.error during load
 *   overflowX          px of horizontal page scroll per width (should be 0)
 *   contrastFailures   text below WCAG AA (4.5:1, or 3:1 for large text), with selector and colours
 *   fonts              whether Space Grotesk / IBM Plex Mono actually loaded
 *
 * Needs Playwright: `npm i -D playwright && npx playwright install chromium` (or a global install).
 * Set CHROMIUM_PATH to use an existing Chrome/Chromium binary.
 */
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) {
  try { ({ chromium } = require('playwright-core')); } catch (__) {
    console.error('Playwright not found. Install it with:\n  npm i -D playwright && npx playwright install chromium\n' +
      'or take screenshots manually and compare them by eye.');
    process.exit(2);
  }
}
const path = require('path');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : d; };
const VALUED = ['--widths', '--theme', '--wait'];
const [target, out = 'snap'] = args.filter((a, i) => !a.startsWith('--') && !VALUED.includes(args[i - 1]));
if (!target) { console.error('Usage: node snap.js <url-or-file> <out-prefix> [--widths 1440,390] [--theme dark] [--full]'); process.exit(1); }
const url = /^(https?|file):/.test(target) ? target : 'file://' + path.resolve(target);
const widths = String(opt('widths', '1440,390')).split(',').map(Number);
const theme = opt('theme', 'light');
const wait = +opt('wait', 800);
const full = !!opt('full', false);

(async () => {
  const launch = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] } : {};
  const browser = await chromium.launch(launch);
  const report = { url, theme, shots: [], consoleErrors: [], overflowX: {}, contrastFailures: [], fonts: {} };
  for (const w of widths) {
    const page = await browser.newPage({ viewport: { width: w, height: w < 600 ? 844 : 900 }, colorScheme: theme === 'dark' ? 'dark' : 'light' });
    page.on('pageerror', e => report.consoleErrors.push(`[${w}] ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') report.consoleErrors.push(`[${w}] ${m.text()}`); });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => report.consoleErrors.push(`[${w}] goto: ${e.message}`));
    if (theme === 'dark') await page.evaluate(() => document.documentElement.setAttribute('data-zm-theme', 'dark'));
    // trigger lazy/reveal content
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } scrollTo(0, 0); }).catch(() => {});
    await page.waitForTimeout(wait);
    const file = `${out}-${w}${theme === 'dark' ? '-dark' : ''}.png`;
    await page.screenshot({ path: file, fullPage: full });
    report.shots.push(file);
    const r = await page.evaluate(() => {
      const parse = c => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : [0, 0, 0, 0]; };
      const lum = ([r, g, b]) => { const f = v => (v /= 255) <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
      const bgOf = el => { for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c.length < 4 ? true : c[3] > .9) { if (getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)') return c; } } return [255, 255, 255]; };
      const sel = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '');
      const fails = []; const seen = new Set();
      for (const el of document.querySelectorAll('body *')) {
        if (!([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))) continue;
        const s = getComputedStyle(el); const rect = el.getBoundingClientRect();
        if (s.visibility === 'hidden' || +s.opacity < .1 || rect.width === 0) continue;
        if (el.closest('[aria-hidden="true"], svg, canvas')) continue;
        const fg = parse(s.color); if (fg[3] !== undefined && fg[3] < .1) continue;
        const bg = bgOf(el);
        const a = lum(fg), b = lum(bg); const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
        const size = parseFloat(s.fontSize), bold = +s.fontWeight >= 700;
        const need = (size >= 24 || (bold && size >= 18.66)) ? 3 : 4.5;
        if (ratio < need) { const key = sel(el) + s.color; if (seen.has(key)) continue; seen.add(key);
          fails.push({ el: sel(el), text: el.textContent.trim().slice(0, 40), ratio: +ratio.toFixed(2), need, color: s.color, bg: `rgb(${bg.slice(0, 3).join(', ')})` }); }
      }
      return {
        overflowX: document.documentElement.scrollWidth - innerWidth,
        fails: fails.slice(0, 25),
        fonts: { 'Space Grotesk': document.fonts.check('16px "Space Grotesk"'), 'IBM Plex Mono': document.fonts.check('16px "IBM Plex Mono"') },
      };
    });
    report.overflowX[w] = r.overflowX;
    r.fails.forEach(f => report.contrastFailures.push({ width: w, ...f }));
    report.fonts = r.fonts;
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
})();
