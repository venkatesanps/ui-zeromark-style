/*!
 * zeromark-charts.js: chart themes in the zeromark style for common libraries.
 * Works as a <script> (window.ZeromarkCharts) or a module (require / import).
 *
 *   ZeromarkCharts.chartjs(Chart)              // Chart.js 3/4: sets global defaults
 *   echarts.registerTheme('zeromark', ZeromarkCharts.echarts())   // then echarts.init(el, 'zeromark')
 *   Plotly.newPlot(el, data, ZeromarkCharts.plotly({title: '...'}))
 *   Highcharts.setOptions(ZeromarkCharts.highcharts())
 *   ApexCharts: new ApexCharts(el, {...ZeromarkCharts.apex(), ...yourOptions})
 *   Recharts / Nivo / Victory / D3: use ZeromarkCharts.tokens() for colors, fonts, grid
 *   Vega-Lite: spec.config = ZeromarkCharts.vega()
 *
 * Pass 'dark' as the last argument for the dark theme, or 'auto' to read <html data-zm-theme>
 * and prefers-color-scheme.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ZeromarkCharts = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var SANS = '"Space Grotesk", "Segoe UI", system-ui, sans-serif';
  var MONO = '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace';
  var T = {
    light: { paper: '#faf7f0', card: '#fffdf8', border: '#e7e0d3', grid: '#ece6da', ink: '#1c1917', soft: '#44403c', muted: '#716a65',
      flame: '#f0472c', series: ['#f0472c', '#2f6f4f', '#4a76a8', '#c9a063', '#a77bd0', '#57534e'],
      sequential: ['#fdf0ea', '#f9c9b8', '#f49a80', '#f0472c', '#b8301a'], diverging: ['#2f6f4f', '#8fb59d', '#efe9dd', '#f49a80', '#d13a22'] },
    dark: { paper: '#171513', card: '#1f1c19', border: '#3a342e', grid: '#2c2824', ink: '#f6f2ea', soft: '#d6cfc4', muted: '#a39a8f',
      flame: '#ff5a3c', series: ['#ff5a3c', '#5fae84', '#7aa3d4', '#d9b276', '#b993e0', '#a8a29e'],
      sequential: ['#3a2420', '#6e3324', '#a8432c', '#ff5a3c', '#ff9c86'], diverging: ['#5fae84', '#3d6b52', '#3a342e', '#a8432c', '#ff7a60'] }
  };
  function mode(m) {
    if (m === 'dark' || m === 'light') return m;
    if (typeof document !== 'undefined') {
      var a = document.documentElement.getAttribute('data-zm-theme');
      if (a === 'dark') return 'dark';
      if (a === 'auto' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  }
  function tokens(m) { var t = T[mode(m)]; return Object.assign({ sans: SANS, mono: MONO, mode: mode(m) }, t); }

  /* Chart.js 3/4 */
  function chartjs(Chart, m) {
    var t = tokens(m), d = Chart.defaults;
    d.color = t.muted; d.borderColor = t.grid; d.font.family = MONO; d.font.size = 11;
    d.plugins.legend.labels.usePointStyle = true; d.plugins.legend.labels.pointStyle = 'rectRounded';
    d.plugins.legend.labels.boxWidth = 10; d.plugins.legend.labels.boxHeight = 10; d.plugins.legend.labels.color = t.soft;
    d.plugins.legend.align = 'start';
    var tt = d.plugins.tooltip;
    tt.backgroundColor = t.card; tt.titleColor = t.ink; tt.bodyColor = t.soft; tt.borderColor = t.border; tt.borderWidth = 1;
    tt.padding = 10; tt.cornerRadius = 10; tt.titleFont = { family: SANS, weight: '700', size: 13 }; tt.bodyFont = { family: MONO, size: 12 };
    tt.boxPadding = 4; tt.usePointStyle = true;
    d.elements.line.borderWidth = 2; d.elements.line.tension = 0.3;
    d.elements.point.radius = 0; d.elements.point.hoverRadius = 4;
    d.elements.bar.borderRadius = 4; d.elements.bar.borderSkipped = 'start';
    d.elements.arc.borderColor = t.card; d.elements.arc.borderWidth = 2;
    if (d.scale) { d.scale.grid = Object.assign({}, d.scale.grid, { color: t.grid, drawTicks: false }); d.scale.border = Object.assign({}, d.scale.border, { display: false }); d.scale.ticks = Object.assign({}, d.scale.ticks, { padding: 8 }); }
    // palette: datasets without colors get series colors in order
    var plugin = { id: 'zeromarkPalette', beforeUpdate: function (chart) {
      (chart.data.datasets || []).forEach(function (ds, i) {
        var c = t.series[i % t.series.length], type = ds.type || chart.config.type;
        if (type === 'pie' || type === 'doughnut' || type === 'polarArea') {
          if (!ds.backgroundColor) ds.backgroundColor = (ds.data || []).map(function (_, j) { return t.series[j % t.series.length]; });
        } else {
          if (!ds.borderColor) ds.borderColor = c;
          if (!ds.backgroundColor) ds.backgroundColor = (type === 'line' && ds.fill) ? c + '1f' : c;
        }
      });
    } };
    if (Chart.register) Chart.register(plugin);
    return t;
  }

  /* Apache ECharts: registerTheme('zeromark', ZeromarkCharts.echarts()) */
  function echarts(m) {
    var t = tokens(m);
    var axis = { axisLine: { show: true, lineStyle: { color: t.border } }, axisTick: { show: false },
      axisLabel: { color: t.muted, fontFamily: MONO, fontSize: 11 }, splitLine: { lineStyle: { color: t.grid } },
      nameTextStyle: { color: t.muted, fontFamily: MONO } };
    return {
      color: t.series, backgroundColor: 'transparent',
      textStyle: { fontFamily: SANS, color: t.soft },
      title: { textStyle: { color: t.ink, fontFamily: SANS, fontWeight: 700, fontSize: 15 }, subtextStyle: { color: t.muted, fontFamily: MONO } },
      legend: { icon: 'roundRect', itemWidth: 10, itemHeight: 10, textStyle: { color: t.soft, fontFamily: MONO, fontSize: 11 } },
      tooltip: { backgroundColor: t.card, borderColor: t.border, borderWidth: 1, padding: 10, textStyle: { color: t.ink, fontFamily: MONO, fontSize: 12 },
        extraCssText: 'border-radius:10px;box-shadow:0 12px 32px -16px rgba(28,25,23,.25);' },
      grid: { left: 8, right: 8, top: 36, bottom: 8, containLabel: true },
      categoryAxis: Object.assign({}, axis, { splitLine: { show: false } }), valueAxis: Object.assign({}, axis, { axisLine: { show: false } }),
      timeAxis: axis, logAxis: axis,
      line: { smooth: 0.3, symbol: 'circle', symbolSize: 4, showSymbol: false, lineStyle: { width: 2 } },
      bar: { itemStyle: { borderRadius: [4, 4, 0, 0] }, barMaxWidth: 28 },
      pie: { itemStyle: { borderColor: t.card, borderWidth: 2 } },
      visualMap: { inRange: { color: t.sequential }, textStyle: { color: t.muted, fontFamily: MONO } }
    };
  }

  /* Plotly: layout object to merge into your layout */
  function plotly(extra, m) {
    var t = tokens(m);
    var ax = { gridcolor: t.grid, zerolinecolor: t.border, linecolor: t.border, tickfont: { family: MONO, size: 11, color: t.muted }, title: { font: { family: MONO, size: 11, color: t.muted } } };
    var base = {
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', colorway: t.series,
      font: { family: SANS, color: t.soft, size: 13 },
      title: { font: { family: SANS, size: 15, color: t.ink }, x: 0, xanchor: 'left' },
      xaxis: ax, yaxis: Object.assign({}, ax, { linecolor: 'rgba(0,0,0,0)' }),
      legend: { orientation: 'h', x: 0, y: 1.12, font: { family: MONO, size: 11, color: t.soft } },
      hoverlabel: { bgcolor: t.card, bordercolor: t.border, font: { family: MONO, color: t.ink } },
      margin: { l: 48, r: 16, t: 48, b: 40 },
      colorscale: { sequential: t.sequential.map(function (c, i, a) { return [i / (a.length - 1), c]; }) }
    };
    // merge one level deep so {title: {text: 'x'}} keeps the themed font and alignment
    Object.keys(extra || {}).forEach(function (k) {
      var v = extra[k];
      base[k] = (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') ? Object.assign({}, base[k], v) : v;
    });
    return base;
  }

  /* Highcharts: Highcharts.setOptions(ZeromarkCharts.highcharts()) */
  function highcharts(m) {
    var t = tokens(m);
    var axis = { gridLineColor: t.grid, lineColor: t.border, tickColor: t.border, labels: { style: { color: t.muted, fontFamily: MONO, fontSize: '11px' } }, title: { style: { color: t.muted, fontFamily: MONO } } };
    return {
      colors: t.series,
      chart: { backgroundColor: 'transparent', style: { fontFamily: SANS } },
      title: { align: 'left', style: { color: t.ink, fontWeight: '700', fontSize: '15px' } },
      subtitle: { align: 'left', style: { color: t.muted, fontFamily: MONO } },
      xAxis: axis, yAxis: Object.assign({}, axis, { lineWidth: 0 }),
      legend: { align: 'left', itemStyle: { color: t.soft, fontFamily: MONO, fontWeight: '400', fontSize: '11px' }, symbolRadius: 3 },
      tooltip: { backgroundColor: t.card, borderColor: t.border, borderRadius: 10, shadow: false, style: { color: t.ink, fontFamily: MONO } },
      plotOptions: { series: { borderRadius: 4, marker: { enabled: false } }, pie: { borderColor: t.card } },
      credits: { enabled: false }
    };
  }

  /* ApexCharts: spread into options */
  function apex(m) {
    var t = tokens(m);
    return {
      colors: t.series,
      chart: { fontFamily: SANS, foreColor: t.muted, toolbar: { show: false }, background: 'transparent' },
      grid: { borderColor: t.grid, strokeDashArray: 0 },
      stroke: { width: 2, curve: 'smooth' },
      dataLabels: { enabled: false },
      legend: { fontFamily: MONO, fontSize: '11px', labels: { colors: t.soft }, markers: { radius: 3 } },
      tooltip: { theme: t.mode },
      xaxis: { labels: { style: { fontFamily: MONO, fontSize: '11px' } }, axisBorder: { color: t.border }, axisTicks: { show: false } },
      yaxis: { labels: { style: { fontFamily: MONO, fontSize: '11px' } } },
      plotOptions: { bar: { borderRadius: 4 } }
    };
  }

  /* Vega / Vega-Lite: spec.config = ZeromarkCharts.vega() */
  function vega(m) {
    var t = tokens(m);
    return {
      background: 'transparent', font: SANS,
      range: { category: t.series, ramp: t.sequential, diverging: t.diverging },
      axis: { domainColor: t.border, gridColor: t.grid, tickColor: t.border, labelColor: t.muted, labelFont: MONO, labelFontSize: 11, titleColor: t.muted, titleFont: MONO, titleFontWeight: 500 },
      legend: { labelColor: t.soft, labelFont: MONO, titleColor: t.muted, titleFont: MONO, symbolType: 'square' },
      title: { color: t.ink, font: SANS, fontSize: 15, anchor: 'start' },
      view: { stroke: 'transparent' },
      bar: { cornerRadiusEnd: 4 }, line: { strokeWidth: 2 }
    };
  }

  return { tokens: tokens, chartjs: chartjs, echarts: echarts, plotly: plotly, highcharts: highcharts, apex: apex, vega: vega, SANS: SANS, MONO: MONO };
});
