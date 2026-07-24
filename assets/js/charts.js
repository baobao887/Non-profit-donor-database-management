import { formatCurrency } from './utils.js';

// Navy design-system chart palette. Single-series lines use BRAND navy; the
// categorical ring is a navy-anchored, well-separated order for doughnut
// slices — identity is reinforced by the legend + tooltip, never colour
// alone. These are decorative data-viz hues, NOT the semantic
// success/warning/danger/info tokens (those stay reserved for status).
const BRAND = '#234B84';                        // brand-600
const BRAND_FILL = 'rgba(35, 75, 132, 0.14)';
const SLICE_GAP = '#FDFCFA';                    // surface — 2px divider between slices
const AXIS_INK = '#78726A';                     // ink-500 — ticks & legend text
const GRIDLINE = 'rgba(210, 206, 198, 0.55)';   // warm ink-300 hairline
const CATEGORICAL = ['#234B84', '#B4882A', '#2E8B7F', '#C6603D', '#8E5A93', '#5E8C6A'];

export function initCharts() {
  if (typeof Chart === 'undefined') return;

  Chart.defaults.animation = false;
  Chart.defaults.interaction = { mode: 'nearest', intersect: false };
  Chart.defaults.plugins.tooltip.enabled = true;
  Chart.defaults.plugins.legend.labels.color = AXIS_INK;

  // Every chart starts empty — each page script fetches live data from its
  // API endpoint immediately after initCharts() and fills these in via
  // Chart.getChart(id).update(). No demo/placeholder numbers are shown.
  const configs = {
    lineChart: {
      type: 'line',
      data: {
        labels: [],
        datasets: [{ label: 'Donations', data: [], borderColor: BRAND, backgroundColor: BRAND_FILL, fill: true, tension: 0.45, pointRadius: 0, borderWidth: 3 }],
      },
      options: chartLineOptions(),
    },
    // Contribution mix by campaign. Rendered as a sorted horizontal BAR (not a
    // pie): one navy hue, so it never has to cycle a categorical palette across
    // many campaigns, and magnitudes are easy to compare. Canvas id kept as
    // `pieChart` to preserve the existing hook; dashboard.js sorts + caps the rows.
    pieChart: {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{ label: 'Raised', data: [], backgroundColor: BRAND, borderRadius: 4, borderSkipped: false, maxBarThickness: 26 }],
      },
      options: chartBarOptions(),
    },
    campaignLineChart: {
      type: 'line',
      data: {
        labels: [],
        datasets: [{ label: 'Raised', data: [], borderColor: BRAND, backgroundColor: BRAND_FILL, fill: true, tension: 0.4, pointRadius: 2 }],
      },
      options: chartLineOptions(),
    },
    donationsLineChart: {
      type: 'line',
      data: {
        labels: [],
        datasets: [{ label: 'Revenue', data: [], borderColor: BRAND, backgroundColor: BRAND_FILL, fill: true, tension: 0.4, pointRadius: 3 }],
      },
      options: chartLineOptions(),
    },
    paymentMethodsChart: {
      type: 'doughnut',
      data: {
        labels: [],
        // Six navy-anchored categorical hues for the six payment methods
        // (Cash, GCash, Card, Bank Transfer, PayPal, Check) so no slice
        // falls back to gray.
        datasets: [{ data: [], backgroundColor: CATEGORICAL, borderColor: SLICE_GAP, borderWidth: 2 }],
      },
      options: chartDoughnutOptions(),
    },
    reportsLineChart: {
      type: 'line',
      data: {
        labels: [],
        datasets: [{ label: 'Donations', data: [], borderColor: BRAND, backgroundColor: BRAND_FILL, fill: true, tension: 0.35, pointRadius: 0 }],
      },
      options: chartLineOptions(),
    },
    donorPieChart: {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{ data: [], backgroundColor: CATEGORICAL, borderColor: SLICE_GAP, borderWidth: 2 }],
      },
      options: chartDoughnutOptions(),
    },
    // Giving-by-gender: Male / Female / Prefer not to say / Not specified.
    genderChart: {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{ data: [], backgroundColor: CATEGORICAL, borderColor: SLICE_GAP, borderWidth: 2 }],
      },
      options: chartDoughnutOptions(),
    },
  };

  Object.entries(configs).forEach(([id, config]) => {
    const ctx = document.getElementById(id);
    if (ctx) new Chart(ctx, config);
  });
}

function chartLineOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => formatCurrency(context.parsed.y) } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: AXIS_INK } },
      y: {
        grid: { color: GRIDLINE },
        ticks: { color: AXIS_INK, callback: (value) => formatCurrency(value) },
      },
    },
  };
}

// Horizontal bar (indexAxis 'y'): single navy series, categories down the y
// axis, currency along x. Used by the dashboard contribution-mix chart.
function chartBarOptions() {
  return {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => formatCurrency(context.parsed.x) } },
    },
    scales: {
      x: {
        grid: { color: GRIDLINE },
        ticks: { color: AXIS_INK, callback: (value) => formatCurrency(value) },
      },
      y: { grid: { display: false }, ticks: { color: AXIS_INK } },
    },
  };
}

function chartDoughnutOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { position: 'bottom', labels: { color: AXIS_INK } } },
  };
}

export function updateDashboardCharts(trend) {
  if (typeof Chart === 'undefined') return;
  const line = Chart.getChart('lineChart');
  if (!line) return;

  // trend rows come from api/donations.php?action=trend as
  // [{ month: 'YYYY-MM', total }]. Always plot the last 6 months and
  // zero-fill the empty ones - otherwise a dataset where all donations
  // land in a single month renders as one invisible point.
  const byMonth = {};
  (trend || []).forEach((t) => { byMonth[t.month] = Number(t.total); });

  const labels = [];
  const data = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    labels.push(d.toLocaleString('en-US', { month: 'short' }));
    data.push(byMonth[key] || 0);
  }

  line.data.labels = labels;
  line.data.datasets[0].data = data;
  line.update();
}
