#!/usr/bin/env node
// Capture a reference site's visual language: screenshots + computed design tokens.
// Usage: node extract-design.js <url-or-file> <out-dir>
// Output: <out-dir>/desktop.png, mobile.png, sections/*.png, tokens.json
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const [, , target, outDir = 'reference'] = process.argv;
  if (!target) {
    console.error('Usage: node extract-design.js <url-or-file> <out-dir>');
    process.exit(1);
  }
  const url = /^https?:|^file:/.test(target) ? target : 'file://' + path.resolve(target);
  fs.mkdirSync(path.join(outDir, 'sections'), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  // Client-side redirects can destroy the context mid-script; settle and retry.
  const settle = () => page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await settle();
  // Scroll through so lazy / scroll-triggered content renders.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
      });
      break;
    } catch (e) {
      if (!/context was destroyed|navigation/i.test(e.message)) throw e;
      await settle();
    }
  }
  console.log('Captured', page.url());
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, 'desktop.png'), fullPage: true });

  // One screenshot per top-level section so details stay legible.
  const sections = await page.$$('header, section, footer, main > div');
  let i = 0;
  for (const s of sections.slice(0, 20)) {
    const box = await s.boundingBox();
    if (!box || box.height < 80) continue;
    await s.screenshot({ path: path.join(outDir, 'sections', `${String(i++).padStart(2, '0')}.png`) }).catch(() => {});
  }

  const tokens = await page.evaluate(() => {
    const tally = (m, k, w = 1) => k && m.set(k, (m.get(k) || 0) + w);
    const top = (m, n = 15) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([v, c]) => ({ v, c }));
    const colors = new Map(), bgs = new Map(), fonts = new Map(), sizes = new Map(),
      weights = new Map(), radii = new Map(), shadows = new Map(), gradients = new Map(),
      borders = new Map(), tracking = new Map(), transitions = new Map(), filters = new Map();
    const els = [...document.querySelectorAll('body *')].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    for (const e of els) {
      const s = getComputedStyle(e);
      const hasText = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      const area = Math.min(e.getBoundingClientRect().width * e.getBoundingClientRect().height, 1e6) / 1e4;
      if (hasText) {
        tally(colors, s.color);
        tally(fonts, s.fontFamily.split(',')[0].replace(/["']/g, '').trim());
        tally(sizes, s.fontSize);
        tally(weights, s.fontWeight);
        if (s.letterSpacing !== 'normal') tally(tracking, `${s.fontSize} / ${s.letterSpacing}`);
      }
      if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') tally(bgs, s.backgroundColor, area);
      if (s.backgroundImage.includes('gradient')) tally(gradients, s.backgroundImage.slice(0, 300));
      if (s.borderRadius !== '0px') tally(radii, s.borderRadius);
      if (s.boxShadow !== 'none') tally(shadows, s.boxShadow);
      if (s.borderTopWidth !== '0px' && s.borderTopStyle !== 'none') tally(borders, `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`);
      if (s.transitionDuration !== '0s') tally(transitions, `${s.transitionProperty} ${s.transitionDuration} ${s.transitionTimingFunction}`);
      const bf = s.backdropFilter || s.webkitBackdropFilter;
      if (bf && bf !== 'none') tally(filters, 'backdrop: ' + bf);
      if (s.filter !== 'none') tally(filters, s.filter);
    }
    const headings = [...document.querySelectorAll('h1,h2,h3')].slice(0, 12).map((h) => {
      const s = getComputedStyle(h);
      return { tag: h.tagName, text: h.textContent.trim().slice(0, 80), size: s.fontSize, weight: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing, font: s.fontFamily };
    });
    const buttons = [...document.querySelectorAll('button, a[class*="btn"], a[class*="button"], [role="button"]')].slice(0, 8).map((b) => {
      const s = getComputedStyle(b);
      return { text: b.textContent.trim().slice(0, 40), bg: s.backgroundColor, bgImage: s.backgroundImage.slice(0, 160), color: s.color, radius: s.borderRadius, padding: s.padding, border: s.border, shadow: s.boxShadow, size: s.fontSize, weight: s.fontWeight };
    });
    const cssVars = {};
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText === ':root' || rule.selectorText === 'html') {
            for (const p of rule.style) if (p.startsWith('--')) cssVars[p] = rule.style.getPropertyValue(p).trim();
          }
        }
      } catch (_) { /* cross-origin sheet */ }
    }
    const keyframes = [];
    for (const sheet of document.styleSheets) {
      try { for (const r of sheet.cssRules) if (r.type === 7) keyframes.push(r.cssText.slice(0, 300)); } catch (_) {}
    }
    return {
      title: document.title,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      maxContentWidths: top(new Map(els.map((e) => [getComputedStyle(e).maxWidth, 1]).filter(([v]) => v !== 'none')), 8),
      textColors: top(colors), backgrounds: top(bgs), gradients: top(gradients, 10),
      fonts: top(fonts, 6), fontSizes: top(sizes, 12), fontWeights: top(weights, 6), letterSpacing: top(tracking, 8),
      radii: top(radii, 8), shadows: top(shadows, 8), borders: top(borders, 8),
      transitions: top(transitions, 8), filters: top(filters, 6),
      headings, buttons, cssVars, keyframes: keyframes.slice(0, 15),
      fontLinks: [...document.querySelectorAll('link[href*="font"]')].map((l) => l.href),
      libraries: [...document.scripts].map((s) => s.src).filter((s) => /gsap|three|lenis|framer|motion|lottie|spline|aos|swiper/i.test(s)),
      canvasCount: document.querySelectorAll('canvas').length,
      videoCount: document.querySelectorAll('video').length,
    };
  });
  fs.writeFileSync(path.join(outDir, 'tokens.json'), JSON.stringify(tokens, null, 2));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'mobile.png'), fullPage: true });
  await browser.close();
  console.log(`Saved screenshots and tokens.json to ${outDir} (${i} sections)`);
})();
