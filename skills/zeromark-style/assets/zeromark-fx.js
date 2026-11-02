/*!
 * zeromark-fx.js: the signature layer of the zeromark style. No dependencies.
 *
 *   ZeromarkFX.stage(options)          STORY MODE: one fixed stage behind the page; the same particles
 *                                       morph scatter → columns → map → stack → … as you scroll (rewinds)
 *   ZeromarkFX.field(canvas, options)  compact mode: confetti that settles into YOUR data
 *                                       (a unit-bar chart or a status grid), on load or on scroll
 *   ZeromarkFX.countUp(root)           [data-zm-count="48210"] numbers tick up when revealed
 *   ZeromarkFX.reveal(root)            .zm-reveal / .zm-table--animate / .zm-strip / .zm-chain animate in
 *   ZeromarkFX.init()                  countUp + reveal for the whole document
 *
 * Everything respects prefers-reduced-motion (renders the settled state, no animation)
 * and reads colours from the CSS variables, so dark mode just works.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ZeromarkFX = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  if (typeof document !== 'undefined') document.documentElement.classList.add('zm-fx');
  var reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var css = function (name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  };
  var series = function () {
    return ['--zm-s1', '--zm-s2', '--zm-s3', '--zm-s4', '--zm-s5', '--zm-s6'].map(function (n, i) {
      return css(n, ['#f0472c', '#2f6f4f', '#4a76a8', '#c9a063', '#a77bd0', '#57534e'][i]);
    });
  };
  var ease = function (p) { return p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p); };

  /* ------------------------------------------------------------------ *
   * field(canvas, options)
   *
   * options:
   *   columns:   [18, 21, 20, ...]       → unit-bar chart: each value becomes a stack of short bars
 *   stacks:    [[18, 22, 9], ...]      → stacked unit bars, one colour per series (e.g. per region)
   *   cells:     [{row, col, color}]      → status grid (like a roster / uptime strip)
   *   rows/cols: grid size for `cells`    (inferred if omitted)
   *   colLabels: ['Mon', ...]            drawn under the settled chart
   *   rowLabels: ['checkout', ...]       drawn left of a settled grid
 *   legend:    ['EU', 'US', ...]       series names, drawn above the settled chart
   *   colors:    array of colours          (default: series palette; for columns, one colour per column or cycling)
   *   area:      {x, y, w, h}            where the data settles, as fractions of the canvas (default right half)
 *   areaMobile: same, used below 760px wide (default: bottom band)
   *   clear:     element                 keep confetti sparse around this element (e.g. the headline)
   *   density:   bars per 10,000 px²      (default 7)
   *   trigger:   'load' | 'scroll'       (default 'load': scatter for 700ms, then settle over 1.6s)
   *   scrollEl:  element whose scroll progress drives 'scroll' mode (default: canvas.parentElement)
   * ------------------------------------------------------------------ */
  function field(canvas, o) {
    o = o || {};
    var ctx = canvas.getContext('2d');
    var W, H, dpr, bars, targets, labels, start = null, raf = 0, progress = 0, seed;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    function buildTargets() {
      var mobile = W < 760;
      // phones: data settles in a band at the bottom (the masthead CSS reserves ~260px for it)
      var areaOpt = mobile ? (o.areaMobile || function (w, h) { return { x: .06, y: (h - 230) / h, w: .88, h: 170 / h }; }) : o.area;
      if (typeof areaOpt === 'function') areaOpt = areaOpt(W, H);
      var A = Object.assign(mobile ? {} : { x: .52, y: .14, w: .44, h: .72 }, areaOpt || {});
      var ax = A.x * W, ay = A.y * H, aw = A.w * W, ah = A.h * H;
      var pal = o.colors || series();
      var t = [];
      labels = { cols: [], rows: [], legend: [] };
      if (o.legend) o.legend.forEach(function (txt, k) { labels.legend.push({ x: ax + k * 0, y: ay - 14, text: txt, color: pal[k % pal.length] }); });
      if (o.stacks) {
        // stacked unit bars: stacks = [[a, b, c], ...] one array per column, one value per series
        var totals = o.stacks.map(function (st) { return st.reduce(function (x, y) { return x + y; }, 0); });
        var smax = Math.max.apply(null, totals), sn = o.stacks.length;
        var sColW = aw / sn, sUnitsMax = Math.max(4, Math.round(ah / 11)), sUnitH = ah / sUnitsMax;
        o.stacks.forEach(function (st, c) {
          var u = 0;
          st.forEach(function (v, k) {
            var units = Math.round(v / smax * sUnitsMax);
            for (var i = 0; i < units; i++, u++) {
              t.push({ x: ax + (c + .5) * sColW, y: ay + ah - (u + .5) * sUnitH, len: sColW * .62, th: Math.max(3, sUnitH * .58), color: pal[k % pal.length] });
            }
          });
          if (o.colLabels) labels.cols.push({ x: ax + (c + .5) * sColW, y: ay + ah + 16, text: o.colLabels[c] });
        });
      } else if (o.columns) {
        var max = Math.max.apply(null, o.columns), n = o.columns.length;
        var colW = aw / n, unitsMax = Math.max(4, Math.round(ah / 11));
        var unitH = ah / unitsMax;
        o.columns.forEach(function (v, c) {
          var units = Math.max(1, Math.round(v / max * unitsMax));
          var color = pal[c % pal.length];
          if (o.colors && o.colors.length === 1) color = o.colors[0];
          for (var u = 0; u < units; u++) {
            t.push({ x: ax + (c + .5) * colW, y: ay + ah - (u + .5) * unitH, len: colW * .62, th: Math.max(3, unitH * .58), color: color });
          }
          if (o.colLabels) labels.cols.push({ x: ax + (c + .5) * colW, y: ay + ah + 16, text: o.colLabels[c] });
        });
      } else if (o.cells) {
        var rows = o.rows || 1 + Math.max.apply(null, o.cells.map(function (c) { return c.row; }));
        var cols = o.cols || 1 + Math.max.apply(null, o.cells.map(function (c) { return c.col; }));
        var lw = o.rowLabels ? Math.min(120, aw * .22) : 0;
        var cw = (aw - lw) / cols, rh = ah / rows;
        o.cells.forEach(function (c) {
          t.push({ x: ax + lw + (c.col + .5) * cw, y: ay + (c.row + .5) * rh, len: cw * .78, th: Math.min(rh * .5, 14), color: c.color || pal[c.row % pal.length] });
        });
        (o.rowLabels || []).forEach(function (txt, r) { labels.rows.push({ x: ax, y: ay + (r + .5) * rh, text: txt }); });
        (o.colLabels || []).forEach(function (txt, c) { labels.cols.push({ x: ax + lw + (c + .5) * cw, y: ay - 12, text: txt }); });
      }
      return t;
    }

    function layout() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      if (!W || !H) return;
      canvas.width = W * dpr; canvas.height = H * dpr;
      seed = 11;
      targets = buildTargets();
      // shuffle targets so bars fly in from everywhere
      for (var i = targets.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var tmp = targets[i]; targets[i] = targets[j]; targets[j] = tmp; }
      var cr = null;
      if (o.clear) {
        var a = canvas.getBoundingClientRect(), b = o.clear.getBoundingClientRect();
        cr = { cx: b.left - a.left + b.width / 2, cy: b.top - a.top + b.height / 2, rx: b.width * .62 + 30, ry: b.height * .62 + 24 };
      }
      var pal = series();
      var n = Math.max(targets.length, Math.round(W * H / 10000 * (o.density || 7)));
      bars = []; var guard = 0;
      while (bars.length < n && guard++ < n * 8) {
        var x = rnd() * W, y = rnd() * H, keep = 1;
        if (cr) { var e = Math.pow((x - cr.cx) / cr.rx, 2) + Math.pow((y - cr.cy) / cr.ry, 2); keep = e > 1 ? 1 : .04 + .4 * e * e; }
        if (rnd() > keep) continue;
        var tg = bars.length < targets.length ? targets[bars.length] : null;
        bars.push({ x: x, y: y, a: (rnd() - .5) * 1.4, len: 9 + rnd() * 22, th: 3.5 + rnd() * 2.5,
          alpha: .45 + rnd() * .45, color: tg ? tg.color : pal[Math.floor(rnd() * pal.length)], t: tg, delay: rnd() * .3, ph: rnd() * 6.28 });
      }
    }

    function draw(now) {
      raf = 0;
      if (!W) return;
      var p = progress;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var drift = reduce ? 0 : 1;
      for (var i = 0; i < bars.length; i++) {
        var b = bars[i], q, x, y, a, len, th, wob = drift * Math.sin(now / 1500 + b.ph) * 2.5;
        if (b.t) {
          q = ease((p - b.delay) / .7);
          x = b.x + (b.t.x - b.x) * q + wob * (1 - q);
          y = b.y + (b.t.y - b.y) * q + wob * .6 * (1 - q);
          a = b.a * (1 - q); len = b.len + (b.t.len - b.len) * q; th = b.th + (b.t.th - b.th) * q;
          ctx.globalAlpha = b.alpha + (.95 - b.alpha) * q;
        } else {
          q = ease((p - b.delay * .5) / .55);
          if (q >= 1) continue;
          x = b.x + wob; y = b.y + wob * .6 - q * 30; a = b.a; len = b.len; th = b.th;
          ctx.globalAlpha = b.alpha * (1 - q) * .9;
        }
        ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = b.color;
        var r = Math.min(th / 2, 3.5) * q;
        if (r > .5 && ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-len / 2, -th / 2, len, th, r); ctx.fill(); }
        else ctx.fillRect(-len / 2, -th / 2, len, th);
        ctx.restore();
      }
      var lab = ease((p - .78) / .2);
      if (lab > 0) {
        ctx.globalAlpha = lab;
        ctx.font = '400 11px ' + css('--zm-mono', 'monospace');
        ctx.fillStyle = css('--zm-muted', '#716a65');
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        labels.cols.forEach(function (l) { ctx.fillText(l.text, l.x, l.y); });
        ctx.textAlign = 'left'; ctx.fillStyle = css('--zm-ink', '#1c1917');
        labels.rows.forEach(function (l) { ctx.fillText(l.text, l.x, l.y); });
        var lx = labels.legend.length ? (o.cells ? 0 : 0) : 0;
        labels.legend.forEach(function (l, k) {
          var x0 = (labels.legend[0].x) + lx;
          ctx.fillStyle = l.color; ctx.fillRect(x0, l.y - 5, 10, 10);
          ctx.fillStyle = css('--zm-muted', '#716a65'); ctx.fillText(l.text, x0 + 15, l.y);
          lx += 15 + ctx.measureText(l.text).width + 18;
        });
      }
      ctx.globalAlpha = 1;
      if (!reduce && (o.trigger === 'scroll' ? p < 1 : true)) raf = requestAnimationFrame(tick);
    }

    function tick(now) {
      if (o.trigger !== 'scroll') {
        if (start === null) start = now;
        var t = (now - start) / 1000;
        progress = reduce ? 1 : Math.min(1, Math.max(0, (t - .7) / 1.6));
        if (progress >= 1 && !reduce) { draw(now); cancelAnimationFrame(raf); raf = 0; return; }
      }
      draw(now);
    }

    function onScroll() {
      var el = o.scrollEl || canvas.parentElement, r = el.getBoundingClientRect();
      var span = Math.max(1, el.offsetHeight - innerHeight * .4);
      progress = Math.max(0, Math.min(1, (innerHeight * .35 - r.top) / span));
      if (!raf) raf = requestAnimationFrame(draw);
    }

    layout();
    if (reduce) progress = 1;
    if (o.trigger === 'scroll') { addEventListener('scroll', onScroll, { passive: true }); onScroll(); }
    else raf = requestAnimationFrame(tick);
    var rt;
    var relayout = function () { clearTimeout(rt); rt = setTimeout(function () { layout(); if (!raf) raf = requestAnimationFrame(draw); }, 120); };
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(relayout).observe(canvas); else addEventListener('resize', relayout);
    // re-read colours when the theme attribute changes
    if (typeof MutationObserver !== 'undefined') new MutationObserver(relayout).observe(document.documentElement, { attributes: true, attributeFilter: ['data-zm-theme'] });
    return { replay: function () { start = null; progress = 0; if (!raf) raf = requestAnimationFrame(tick); } };
  }

  /* ------------------------------------------------------------------ */
  function fmt(n, el) {
    var dec = +(el.getAttribute('data-zm-decimals') || 0);
    return n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function runCount(el) {
    var to = parseFloat(el.getAttribute('data-zm-count')), from = parseFloat(el.getAttribute('data-zm-from') || '0');
    if (isNaN(to)) return;
    if (reduce) { el.textContent = fmt(to, el); return; }
    var t0 = performance.now(), dur = +(el.getAttribute('data-zm-duration') || 1300);
    (function step(t) {
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e, el);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  var io = null;
  function observer() {
    if (io || typeof IntersectionObserver === 'undefined') return io;
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('is-in');
        if (el.hasAttribute('data-zm-count')) runCount(el);
        el.querySelectorAll && el.querySelectorAll('[data-zm-count]').forEach(runCount);
        io.unobserve(el);
      });
    }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
    return io;
  }

  function reveal(root) {
    root = root || document;
    // index children so CSS can stagger with var(--zm-i)
    root.querySelectorAll('.zm-table--animate tbody tr').forEach(function (tr, i) { tr.style.setProperty('--zm-i', i); });
    root.querySelectorAll('.zm-strip').forEach(function (s) { s.querySelectorAll('.zm-cell').forEach(function (c, i) { c.style.setProperty('--zm-i', i); }); });
    root.querySelectorAll('.zm-chain').forEach(function (s) { [].forEach.call(s.children, function (c, i) { c.style.setProperty('--zm-i', i); }); });
    root.querySelectorAll('.zm-reveal-group').forEach(function (g) { [].forEach.call(g.children, function (c, i) { c.style.setProperty('--zm-i', i); c.classList.add('zm-reveal'); }); });
    var obs = observer();
    var els = root.querySelectorAll('.zm-reveal, .zm-table--animate, .zm-strip, .zm-chain, [data-zm-count]');
    els.forEach(function (el) {
      if (reduce || !obs) { el.classList.add('is-in'); if (el.hasAttribute('data-zm-count')) runCount(el); }
      else obs.observe(el);
    });
  }

  function countUp(root) { reveal(root); }
  function init() { reveal(document); }

  /* ==================================================================== *
   * STORY MODE: stage(options)
   *
   * One fixed canvas behind the whole page. The SAME particles (one per data item,
   * or one per N items) persist across sections and morph from layout to layout
   * as you scroll. It is scrubbed, not timed: scrolling up rewinds.
   *
   *   ZeromarkFX.stage({
   *     groups: [{ key: 'inventory-sync', label: 'inventory', count: 512 }, ...],  // colour = series order or .color
   *     max: 1400,                       // particle cap (phones get ~45%); counts are scaled to fit
   *     scenes: [                        // one per section, in page order
   *       { el: heroEl,    layout: 'scatter' },
   *       { el: sortedEl,  layout: 'columns', labels: true },
   *       { el: mappedEl,  layout: 'map', edges: [['checkout', 'inventory-sync'], ...] },
   *       { el: triageEl,  layout: 'stack', from: 1, to: 0.04 },   // shrinks while the section is pinned
   *       { el: contentEl, layout: 'hidden' },
   *     ],
   *   })
   *
   * Layouts: scatter | columns | bars | map | stack | rows | hidden
   *   common scene options: clear (element or false; default: the scene's .zm-scene-copy),
   *                         region {x, y, w, h} as viewport fractions, regionMobile (below 760px)
   *   columns/bars: labels (bool)      map: nodes {key: [fx, fy]}, edges [[keyA, keyB]]
   *   stack: x (0..1), from/to (fraction of particles visible at start/end of the pinned hold)
   *   rows:  one row per group (a horizontal strip), labels (bool)
   *   grid:  rows = groups, cols = N slots; cells {groupKey: [colIndex, ...]}, per (particles per cell),
   *          rowLabels (bool), colLabels [...], shade [colIndex] (e.g. closed days), accentCols [colIndex]
   *   columns/map: unit (string appended to counts, e.g. 'h')
   *
   * Pair with sections marked up as .zm-scene (add .zm-scene--pin to hold the copy in place
   * while particles morph) and counters marked data-zm-scrub="1184 0".
   * ==================================================================== */
  function stage(o) {
    o = o || {};
    var canvas = o.canvas;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'zm-stage';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(canvas, document.body.firstChild);
    }
    document.documentElement.classList.add('zm-story');
    var ctx = canvas.getContext('2d');
    var W, H, dpr, P = [], G = [], scenes = [], anchors = [], cache = {}, raf = 0, seed = 7;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var lerp = function (a, b, t) { return a + (b - a) * t; };

    function build() {
      var pal = series();
      var mobile = innerWidth < 760;
      var max = Math.round((o.max || 1400) * (mobile ? .45 : 1));
      var total = o.groups.reduce(function (s, g) { return s + g.count; }, 0);
      var scale = Math.min(1, max / total);
      G = o.groups.map(function (g, i) {
        return { key: g.key, label: g.label || g.key, count: g.count, n: Math.max(1, Math.round(g.count * scale)), color: g.color || pal[i % pal.length], i: i };
      });
      seed = 7; P = [];
      G.forEach(function (g) {
        for (var k = 0; k < g.n; k++) P.push({ g: g.i, k: k, rx: rnd(), ry: rnd(), ra: rnd() - .5, rl: rnd(), rt: rnd(), d: rnd(), rank: 0, color: g.color });
      });
      // random rank for stack slots so colours mix
      var order = P.map(function (_, i) { return i; });
      for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t; }
      order.forEach(function (pi, r) { P[pi].rank = r; });
      scenes = (o.scenes || []).map(function (s) {
        var copy = s.clear === false ? null : (s.clear || (s.el && s.el.querySelector('.zm-scene-copy')));
        return Object.assign({}, s, { clearEl: copy });
      });
    }

    function measure() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      // morph window per scene: starts when the section's top reaches 60% of the viewport,
      // ends after ~35% of its pinned length (or when its top reaches the top for unpinned sections)
      anchors = scenes.map(function (s, i) {
        if (!s.el || i === 0) return { s0: -1e9, s1: -1e9, top: 0, len: 1 };
        var r = s.el.getBoundingClientRect(), top = r.top + scrollY, h = s.el.offsetHeight;
        var pin = Math.max(0, h - H);
        // pinned: morph while the section arrives and during the first third of its hold.
        // unpinned (ordinary content): finish the morph before the content reaches mid-screen.
        return pin ? { s0: top - H * .6, s1: top + pin * .35, top: top, len: pin }
                   : { s0: top - H, s1: top - H * .4, top: top, len: 1 };
      });
      cache = {};
    }

    /* ---------- layouts: return per-particle targets {x, y, a, l, t, al} ---------- */
    // phones: formations sit in the lower ~40% so they don't run under the (taller) copy; override with regionMobile
    function region(s, def) {
      var R = W < 760 ? Object.assign({ x: .04, y: .56, w: .92, h: .36 }, s.regionMobile || {})
                      : Object.assign({}, def, s.region || {});
      return { x: R.x * W, y: R.y * H, w: R.w * W, h: R.h * H };
    }

    function Lscatter() {
      return P.map(function (p) {
        return { x: p.rx * W, y: p.ry * H, a: p.ra * 1.4, l: 9 + p.rl * 22, t: 3.5 + p.rt * 2.5, al: .45 + p.rl * .45 };
      });
    }
    function Lhidden() {
      return P.map(function (p) { return { x: p.rx * W, y: p.ry * H - H * .45, a: p.ra * 1.4, l: 9 + p.rl * 22, t: 4, al: 0 }; });
    }
    function Lcolumns(s, bars) {
      var R = region(s, bars ? { x: .14, y: .5, w: .72, h: .36 } : { x: .05, y: .08, w: .9, h: .84 });
      var K = G.length, slot = R.w / K, cw = slot * (bars ? .5 : .62), rowH = bars ? 6 : 7;
      var nmax = Math.max.apply(null, G.map(function (g) { return g.n; }));
      var per = Math.max(1, Math.ceil(nmax / Math.floor(R.h / rowH)));
      var len = cw / per - 3;
      var out = P.map(function (p) {
        var g = G[p.g], cx = R.x + (g.i + .5) * slot, col = p.k % per, row = Math.floor(p.k / per);
        return { x: cx - cw / 2 + (col + .5) * (cw / per) + (bars ? 0 : (p.rx - .5) * 3), y: R.y + R.h - (row + .5) * rowH,
          a: bars ? 0 : (p.ra) * .08, l: Math.max(4, len - (bars ? 0 : p.rl * 3)), t: bars ? 4 : 4.2, al: .9 };
      });
      out.overlay = function (al) {
        if (!s.labels) return;
        label(al, function () {
          G.forEach(function (g) {
            var cx = R.x + (g.i + .5) * slot;
            ctx.textAlign = 'center';
            ctx.fillStyle = css('--zm-ink', '#1c1917'); ctx.fillText(fit(g.label.toUpperCase(), slot - 4), cx, R.y + R.h + 18);
            ctx.fillStyle = css('--zm-muted', '#716a65'); ctx.fillText(g.count.toLocaleString() + (s.unit ? ' ' + s.unit : ''), cx, R.y + R.h + 34);
          });
        });
      };
      return out;
    }
    function Lrows(s) {
      var R = region(s, { x: .1, y: .52, w: .8, h: .34 });
      var K = G.length, rh = R.h / K, lw = s.labels ? Math.min(140, R.w * .2) : 0;
      var nmax = Math.max.apply(null, G.map(function (g) { return g.n; }));
      var lines = Math.max(1, Math.floor((rh * .7) / 6)), per = Math.ceil(nmax / lines), cell = (R.w - lw) / per;
      var out = P.map(function (p) {
        var g = G[p.g], c = Math.floor(p.k / lines), ln = p.k % lines;
        return { x: R.x + lw + (c + .5) * cell, y: R.y + g.i * rh + rh * .15 + (ln + .5) * 6, a: 0, l: Math.max(3, cell - 2), t: 4, al: .9 };
      });
      out.overlay = function (al) {
        if (!s.labels) return;
        label(al, function () {
          ctx.textAlign = 'left';
          G.forEach(function (g) { ctx.fillStyle = css('--zm-ink', '#1c1917'); ctx.fillText(g.label, R.x, R.y + (g.i + .5) * rh); });
        });
      };
      return out;
    }
    function Lgrid(s) {
      // rows = groups, columns = s.cols slots (e.g. days). s.cells[groupKey] = list of column indexes;
      // particle k of a group goes to cell cells[floor(k / per)], packed as a small block of `per` bars.
      var R = region(s, { x: .08, y: .44, w: .84, h: .46 });
      var K = G.length, cols = s.cols || 7, per = s.per || 1;
      var lw = s.rowLabels ? Math.min(110, R.w * .16) : 0;
      var cw = (R.w - lw) / cols, rh = R.h / K;
      var subC = per > 3 ? 2 : 1, subR = Math.ceil(per / subC);
      var bh = Math.max(2, Math.min(5, (rh * .72) / subR - 1.2)), bl = Math.max(4, (cw * .78) / subC - 2);
      var out = P.map(function (p) {
        var g = G[p.g], list = (s.cells && s.cells[g.key]) || [], ci = Math.floor(p.k / per), sub = p.k % per;
        if (ci >= list.length) return { x: p.rx * W, y: -40, a: p.ra, l: 8, t: 4, al: 0 };
        var cx = R.x + lw + (list[ci] + .5) * cw, cy = R.y + (g.i + .5) * rh;
        var sx = (sub % subC - (subC - 1) / 2) * (bl + 2), sy = (Math.floor(sub / subC) - (subR - 1) / 2) * (bh + 1.2);
        return { x: cx + sx, y: cy + sy, a: 0, l: bl, t: bh, al: .95 };
      });
      out.under = function (al) {
        if (!s.shade) return;
        ctx.save(); ctx.globalAlpha = al * .5; ctx.fillStyle = css('--zm-sunken', '#f3efe6');
        s.shade.forEach(function (c) { ctx.fillRect(R.x + lw + c * cw + cw * .08, R.y - 4, cw * .84, R.h + 8); });
        ctx.restore();
      };
      out.overlay = function (al) {
        label(al, function () {
          ctx.textAlign = 'left'; ctx.fillStyle = css('--zm-ink', '#1c1917');
          if (s.rowLabels) G.forEach(function (g) { ctx.fillText(fit(g.label, lw - 8), R.x, R.y + (g.i + .5) * rh); });
          ctx.textAlign = 'center';
          (s.colLabels || []).forEach(function (t, c) {
            ctx.fillStyle = (s.accentCols || []).indexOf(c) >= 0 ? css('--zm-flame-dark', '#d13a22') : css('--zm-muted', '#716a65');
            ctx.fillText(fit(String(t), cw), R.x + lw + (c + .5) * cw, R.y - 14);
          });
        });
      };
      return out;
    }
    function fit(text, maxW) {
      if (ctx.measureText(text).width <= maxW) return text;
      var t = text; while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
      return t.length > 1 ? t + '…' : text.charAt(0);
    }
    function Lmap(s) {
      var R = region(s, { x: .08, y: .52, w: .84, h: .36 });
      var K = G.length, pos = {};
      var nmax = Math.max.apply(null, G.map(function (g) { return g.n; }));
      var rmax = Math.min(R.w / K * .42, R.h * .5);
      G.forEach(function (g, i) {
        var given = s.nodes && s.nodes[g.key];
        var rad = rmax * Math.sqrt(g.n / nmax), inX = R.x + rmax, inW = R.w - 2 * rmax;   // keep whole clusters on screen
        pos[g.key] = given ? [given[0] * W, given[1] * H]
          : [inX + (K === 1 ? .5 : i / (K - 1)) * inW, R.y + R.h * (i % 2 ? .78 : .28) + (i === Math.floor(K / 2) ? -R.h * .1 : 0) + (rad < rmax * .5 ? 0 : 0)];
      });
      var out = P.map(function (p) {
        var g = G[p.g], c = pos[g.key], rad = rmax * Math.sqrt(g.n / nmax);
        var ang = p.k * 2.39996, rr = rad * Math.sqrt((p.k + .5) / g.n);   // sunflower packing
        return { x: c[0] + Math.cos(ang) * rr, y: c[1] + Math.sin(ang) * rr * .85, a: p.ra * .6, l: 7 + p.rl * 8, t: 3.6, al: .85 };
      });
      out.overlay = function (al) {
        label(al, function () {
          ctx.save();
          ctx.strokeStyle = css('--zm-soft', '#44403c'); ctx.lineWidth = 2; ctx.setLineDash([7, 6]); ctx.globalAlpha = al * .75;
          (s.edges || []).forEach(function (e) {
            var a = pos[e[0]], b = pos[e[1]]; if (!a || !b) return;
            ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
          });
          ctx.restore();
          G.forEach(function (g) {
            var c = pos[g.key], rad = rmax * Math.sqrt(g.n / nmax);
            ctx.textAlign = 'center';
            ctx.fillStyle = css('--zm-ink', '#1c1917'); ctx.fillText(fit(g.label.toUpperCase(), R.w / K + 10), c[0], c[1] + rad + 18);
            ctx.font = '500 15px ' + css('--zm-mono', 'monospace'); ctx.fillText(g.count.toLocaleString(), c[0], c[1] + rad + 36);
            ctx.font = '500 11px ' + css('--zm-mono', 'monospace');
          });
        });
      };
      out.under = function (al) {   // edges under the particles
        ctx.save(); ctx.globalAlpha = al * .35; ctx.strokeStyle = css('--zm-soft', '#44403c'); ctx.lineWidth = 2; ctx.setLineDash([7, 6]);
        (s.edges || []).forEach(function (e) { var a = pos[e[0]], b = pos[e[1]]; if (a && b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } });
        ctx.restore();
      };
      return out;
    }
    function Lstack(s, hold) {
      var vis = lerp(s.from == null ? 1 : s.from, s.to == null ? (s.from == null ? 1 : s.from) : s.to, ease(hold));
      var N = P.length, startN = Math.round(N * (s.from == null ? 1 : s.from));
      var Rh = H * (s.height || .62), rowH = 6.5, rows = Math.floor(Rh / rowH);
      var per = Math.max(2, Math.min(14, Math.ceil(startN / rows))), len = 14, gap = 4;
      var x0 = (s.x == null ? .5 : s.x) * W - per * (len + gap) / 2, yb = H * (s.bottom || .92);
      var visN = Math.round(N * vis);
      return P.map(function (p) {
        if (p.rank >= visN) return { x: p.rx * W, y: -40 - p.ry * H * .3, a: p.ra, l: 10, t: 4, al: 0 };
        var col = p.rank % per, row = Math.floor(p.rank / per);
        return { x: x0 + col * (len + gap) + len / 2, y: yb - row * rowH, a: (p.ra) * .06, l: len, t: 4.2, al: .95 };
      });
    }

    function layoutFor(i, hold) {
      var s = scenes[i];
      if (!s) return Lhidden();
      if (s.layout === 'stack') return Lstack(s, hold);       // depends on hold progress: not cached
      if (cache[i]) return cache[i];
      var L = s.layout === 'columns' ? Lcolumns(s) : s.layout === 'bars' ? Lcolumns(s, true) : s.layout === 'map' ? Lmap(s)
        : s.layout === 'rows' ? Lrows(s) : s.layout === 'grid' ? Lgrid(s) : s.layout === 'hidden' ? Lhidden() : Lscatter();
      return (cache[i] = L);
    }

    function label(al, fn) {
      if (al <= .01) return;
      ctx.save(); ctx.globalAlpha = al; ctx.font = '500 11px ' + css('--zm-mono', 'monospace'); ctx.textBaseline = 'middle';
      fn(); ctx.restore();
    }

    function clearZones(i) {
      var s = scenes[i]; if (!s || !s.clearEl) return null;
      var r = s.clearEl.getBoundingClientRect();
      if (r.bottom < 0 || r.top > H) return null;
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, rx: r.width / 2 + 36, ry: r.height / 2 + 28 };
    }

    function frame() {
      raf = 0;
      var y = scrollY, from = 0, to = 0, t = 0;
      for (var i = 1; i < scenes.length; i++) {
        var A = anchors[i];
        if (y >= A.s0) {
          if (y < A.s1) { from = i - 1; to = i; t = clamp((y - A.s0) / Math.max(1, A.s1 - A.s0)); }
          else { from = to = i; t = 1; }
        }
      }
      if (reduce) t = t < .5 ? 0 : 1;
      var holdTo = clamp((y - anchors[to].s1) / Math.max(1, anchors[to].top + anchors[to].len - anchors[to].s1));
      var holdFrom = from === to ? holdTo : 1;
      var LA = layoutFor(from, holdFrom), LB = layoutFor(to, holdTo);
      var zones = [clearZones(from), from !== to ? clearZones(to) : null].filter(Boolean);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // fade the stage out once the last scene's hold is over (footer, trailing content)
      var last = anchors[anchors.length - 1], exit = scenes.length > 1 ? clamp((y - (last.top + last.len - H * .15)) / (H * .25)) : 0;
      var fadeAll = 1 - exit;
      if (fadeAll <= .01) { scrub(); return; }
      var same = from === to;
      if (LA.under) LA.under((same ? 1 : 1 - t) * fadeAll); if (!same && LB.under) LB.under(t * fadeAll);
      for (var k = 0; k < P.length; k++) {
        var p = P[k], a = LA[k], b = LB[k];
        var q = from === to ? 1 : ease(clamp((t - p.d * .35) / .65));
        var x = lerp(a.x, b.x, q), yy = lerp(a.y, b.y, q), al = lerp(a.al, b.al, q);
        if (al <= .01 || yy < -30 || yy > H + 30) continue;
        for (var z = 0; z < zones.length; z++) {
          var Z = zones[z], e = Math.pow((x - Z.cx) / Z.rx, 2) + Math.pow((yy - Z.cy) / Z.ry, 2);
          if (e < 1) al *= .1 + .9 * e * e;
        }
        var th = lerp(a.t, b.t, q), len = lerp(a.l, b.l, q);
        ctx.globalAlpha = al * fadeAll; ctx.fillStyle = p.color;
        ctx.save(); ctx.translate(x, yy); ctx.rotate(lerp(a.a, b.a, q));
        ctx.fillRect(-len / 2, -th / 2, len, th);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (LA.overlay) LA.overlay((same ? 1 : 1 - ease(clamp(t * 2.5))) * fadeAll);
      if (!same && LB.overlay) LB.overlay(ease(clamp((t - .6) / .4)) * fadeAll);
      scrub();
    }

    function scrub() {
      document.querySelectorAll('[data-zm-scrub]').forEach(function (el) {
        var v = el.getAttribute('data-zm-scrub').split(/[\s,→>-]+/).map(parseFloat);
        var sec = el.closest('.zm-scene') || el, r = sec.getBoundingClientRect();
        var span = Math.max(H * .5, sec.offsetHeight - H);
        var pr = clamp((-r.top + H * .15) / (span * .8));
        var dec = +(el.getAttribute('data-zm-decimals') || 0);
        el.textContent = lerp(v[0], v[1], ease(pr)).toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
      });
    }

    var req = function () { if (!raf) raf = requestAnimationFrame(frame); };
    function reset() { build(); measure(); req(); }
    reset();
    addEventListener('scroll', req, { passive: true });
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(reset, 120); });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(function () { measure(); req(); }, 120); }).observe(document.body);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); req(); });
    if (typeof MutationObserver !== 'undefined') new MutationObserver(function () { cache = {}; build(); req(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-zm-theme'] });
    return { refresh: function () { measure(); req(); }, canvas: canvas };
  }

  return { field: field, stage: stage, countUp: countUp, reveal: reveal, init: init };
});
