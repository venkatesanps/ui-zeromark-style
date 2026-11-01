/*!
 * zeromark-fx.js: the signature layer of the zeromark style. No dependencies.
 *
 *   ZeromarkFX.field(canvas, options)  confetti of short bars that settles into YOUR data
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

  return { field: field, countUp: countUp, reveal: reveal, init: init };
});
