import { initStore, apiGet } from '../store.js';
import { formatCurrency, exportCsv, renderError } from '../utils.js';
import { initLayout } from '../layout.js';
import { initCharts } from '../charts.js';

const HEATMAP_ORDER = [2, 3, 4, 5, 6]; // Mon..Fri, MySQL DAYOFWEEK numbering
const HEATMAP_SHADES = ['bg-slate-100', 'bg-slate-200', 'bg-slate-300', 'bg-slate-400', 'bg-slate-500'];

let lastReport = null;

async function init() {
  await initStore();
  initLayout({ showSearch: false });
  initCharts();

  try {
    const report = await apiGet('api/reports.php');
    lastReport = report;
    renderCampaignStats(report);
    renderTrendChart(report.donationTrend);
    renderDonorPieChart(report.donorRankBreakdown);
    renderPaymentBreakdown(report.paymentBreakdown);
    renderHeatmap(report.weekdayActivity);
    renderGenderChart(report.genderBreakdown);
    renderLocationBreakdown(report.cityBreakdown);
    renderAgeBreakdown(report.ageBreakdown);
  } catch (err) {
    console.error('Reports load failed:', err);
    renderError(document.getElementById('payment-breakdown'), 'Could not load report data.');
  }

  document.getElementById('printReport')?.addEventListener('click', () => window.print());
  document.getElementById('exportCsvReport')?.addEventListener('click', exportReportCsv);
}

function exportReportCsv() {
  const trend = lastReport?.donationTrend || [];
  if (!trend.length) {
    alert('No report data to export yet.');
    return;
  }
  exportCsv('revenue-report.csv', trend, [
    { label: 'Month', value: (t) => t.month },
    { label: 'Revenue (PHP)', value: (t) => formatCurrency(t.total) },
  ]);
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
  const colors = { Cash: 'bg-teal-500', GCash: 'bg-blue-600', Card: 'bg-sky-500', 'Bank Transfer': 'bg-emerald-500', PayPal: 'bg-violet-500', Check: 'bg-amber-500' };
  container.innerHTML = methods.length ? methods.map((m) => {
    const pct = Math.round((Number(m.count) / total) * 100);
    const color = colors[m.payment_method] || 'bg-slate-400';
    return `
      <div class="flex items-center justify-between text-sm text-slate-600"><span>${m.payment_method}</span><span>${pct}%</span></div>
      <div class="rounded-full bg-slate-200 h-3 overflow-hidden"><div class="h-full rounded-full ${color}" style="width:${pct}%"></div></div>`;
  }).join('') : '<p class="text-slate-500">No donations recorded yet.</p>';
}

// Giving by gender — doughnut of total donations received per gender.
// NULL genders arrive from the API already grouped as "Not specified".
function renderGenderChart(breakdown = []) {
  if (typeof Chart === 'undefined') return;
  const chart = Chart.getChart('genderChart');
  if (!chart || !breakdown.length) return;
  chart.data.labels = breakdown.map((b) => b.gender);
  chart.data.datasets[0].data = breakdown.map((b) => Number(b.total));
  chart.update();
}

// Top donor cities by total giving — horizontal bars sized against the
// highest-giving city, mirroring the "Payment channels" visual pattern.
function renderLocationBreakdown(cities = []) {
  const container = document.getElementById('location-breakdown');
  if (!container) return;
  const max = Math.max(...cities.map((c) => Number(c.total)), 1);
  container.innerHTML = cities.length ? cities.map((c) => {
    const pct = Math.round((Number(c.total) / max) * 100);
    return `
      <div class="flex items-center justify-between text-sm text-slate-600"><span>${escapeHtml(c.city)}</span><span>${formatCurrency(c.total)} · ${c.count}</span></div>
      <div class="rounded-full bg-slate-200 h-3 overflow-hidden"><div class="h-full rounded-full bg-sky-500" style="width:${pct}%"></div></div>`;
  }).join('') : '<p class="text-slate-500">No location data yet.</p>';
}

const AGE_ORDER = ['18-30', '31-45', '46-60', '60+'];

// Giving by age bracket — bars in fixed age order (donors with no birthdate
// are excluded server-side, so brackets may not sum to the overall total).
function renderAgeBreakdown(brackets = []) {
  const container = document.getElementById('age-breakdown');
  if (!container) return;
  const byBracket = Object.fromEntries(brackets.map((b) => [b.bracket, b]));
  const rows = AGE_ORDER.map((label) => ({
    label,
    total: Number(byBracket[label]?.total || 0),
    count: Number(byBracket[label]?.count || 0),
  }));
  const max = Math.max(...rows.map((r) => r.total), 1);
  container.innerHTML = rows.some((r) => r.total > 0) ? rows.map((r) => {
    const pct = Math.round((r.total / max) * 100);
    return `
      <div class="flex items-center justify-between text-sm text-slate-600"><span>${r.label}</span><span>${formatCurrency(r.total)} · ${r.count}</span></div>
      <div class="rounded-full bg-slate-200 h-3 overflow-hidden"><div class="h-full rounded-full bg-violet-500" style="width:${pct}%"></div></div>`;
  }).join('') : '<p class="text-slate-500">No birthdate data yet.</p>';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
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
