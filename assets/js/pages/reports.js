import { initStore } from '../store.js';
import { apiGet, renderError } from '../api.js';
import { formatCurrency } from '../utils.js';
import { initLayout } from '../layout.js';
import { initCharts } from '../charts.js';

const HEATMAP_ORDER = [2, 3, 4, 5, 6]; // Mon..Fri, MySQL DAYOFWEEK numbering
const HEATMAP_SHADES = ['bg-slate-100', 'bg-slate-200', 'bg-slate-300', 'bg-slate-400', 'bg-slate-500'];

async function init() {
  await initStore();
  initLayout({ showSearch: false });
  initCharts();

  try {
    const report = await apiGet('api/reports.php');
    renderCampaignStats(report);
    renderTrendChart(report.donationTrend);
    renderDonorPieChart(report.donorRankBreakdown);
    renderPaymentBreakdown(report.paymentBreakdown);
    renderHeatmap(report.weekdayActivity);
  } catch (err) {
    console.error('Reports load failed:', err);
    renderError(document.getElementById('payment-breakdown'), 'Could not load report data.');
  }

  document.getElementById('exportReport')?.addEventListener('click', () => window.print());
}

function renderCampaignStats(report) {
  document.getElementById('report-top')?.replaceChildren(document.createTextNode(formatCurrency(report.topCampaign?.amount_raised || 0)));
  document.getElementById('report-avg')?.replaceChildren(document.createTextNode(formatCurrency(report.avgRaised || 0)));
  document.getElementById('report-conversion')?.replaceChildren(document.createTextNode((report.conversionPct || 0) + '%'));
}

function renderTrendChart(trend = []) {
  if (typeof Chart === 'undefined') return;
  const chart = Chart.getChart('reportsLineChart');
  if (!chart || !trend.length) return;
  chart.data.labels = trend.map((t) => t.month);
  chart.data.datasets[0].data = trend.map((t) => Number(t.total));
  chart.update();
}

// Real donor distribution by rank (Bronze/Silver/Gold/Platinum) — replaces
// the old hardcoded Individual/Corporate/Foundation demo categories, which
// have no corresponding column in the donors table.
function renderDonorPieChart(breakdown = []) {
  if (typeof Chart === 'undefined') return;
  const chart = Chart.getChart('donorPieChart');
  if (!chart || !breakdown.length) return;
  chart.data.labels = breakdown.map((b) => b.donor_rank);
  chart.data.datasets[0].data = breakdown.map((b) => Number(b.count));
  chart.update();
}

function renderPaymentBreakdown(methods = []) {
  const container = document.getElementById('payment-breakdown');
  if (!container) return;

  const total = methods.reduce((s, m) => s + Number(m.count), 0) || 1;
  const colors = { Card: 'bg-sky-500', 'Bank Transfer': 'bg-emerald-500', PayPal: 'bg-violet-500', Check: 'bg-amber-500' };
  container.innerHTML = methods.length ? methods.map((m) => {
    const pct = Math.round((Number(m.count) / total) * 100);
    const color = colors[m.payment_method] || 'bg-slate-400';
    return `
      <div class="flex items-center justify-between text-sm text-slate-600"><span>${m.payment_method}</span><span>${pct}%</span></div>
      <div class="rounded-full bg-slate-200 h-3 overflow-hidden"><div class="h-full rounded-full ${color}" style="width:${pct}%"></div></div>`;
  }).join('') : '<p class="text-slate-500">No donations recorded yet.</p>';
}

function renderHeatmap(weekday = []) {
  const byDow = Object.fromEntries(weekday.map((w) => [Number(w.dow), w]));

  fillHeatmapRow('activity-heatmap-count', HEATMAP_ORDER.map((dow) => Number(byDow[dow]?.count || 0)));
  fillHeatmapRow('activity-heatmap-revenue', HEATMAP_ORDER.map((dow) => Number(byDow[dow]?.total || 0)));
}

function fillHeatmapRow(containerId, values) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const max = Math.max(...values, 1);
  container.querySelectorAll('[data-weekday]').forEach((cell, i) => {
    const intensity = Math.min(HEATMAP_SHADES.length - 1, Math.floor((values[i] / max) * (HEATMAP_SHADES.length - 1)));
    HEATMAP_SHADES.forEach((shade) => cell.classList.remove(shade));
    cell.classList.add(values[i] > 0 ? HEATMAP_SHADES[intensity] : HEATMAP_SHADES[0]);
  });
}

init();
