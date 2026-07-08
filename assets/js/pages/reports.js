import { initStore, getDonations, getDonors, getCampaigns } from '../store.js';
import { formatCurrency } from '../utils.js';
import { initLayout } from '../layout.js';
import { initCharts } from '../charts.js';

async function init() {
  await initStore();
  initLayout({ showSearch: false, showTheme: true });
  initCharts();
  renderCampaignStats();
  renderPaymentBreakdown();

  document.getElementById('exportReport')?.addEventListener('click', () => window.print());
}

function renderCampaignStats() {
  const campaigns = getCampaigns();
  const top = [...campaigns].sort((a, b) => b.raised - a.raised)[0];
  const avg = campaigns.length ? Math.round(campaigns.reduce((s, c) => s + c.raised, 0) / campaigns.length) : 0;
  const totalGoal = campaigns.reduce((s, c) => s + c.goal, 0);
  const totalRaised = campaigns.reduce((s, c) => s + c.raised, 0);
  const conversion = totalGoal ? Math.round((totalRaised / totalGoal) * 100) : 0;

  document.getElementById('report-top')?.replaceChildren(document.createTextNode(formatCurrency(top?.raised || 0)));
  document.getElementById('report-avg')?.replaceChildren(document.createTextNode(formatCurrency(avg)));
  document.getElementById('report-conversion')?.replaceChildren(document.createTextNode(conversion + '%'));
}

function renderPaymentBreakdown() {
  const donations = getDonations();
  const counts = {};
  donations.forEach((d) => {
    const key = d.method === 'Visa' || d.method === 'Card' ? 'Card' : d.method;
    counts[key] = (counts[key] || 0) + 1;
  });
  const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1;
  const container = document.getElementById('payment-breakdown');
  if (!container) return;

  const colors = { Card: 'bg-sky-500', 'Bank transfer': 'bg-emerald-500', Bank: 'bg-emerald-500', PayPal: 'bg-violet-500' };
  container.innerHTML = Object.entries(counts).map(([method, count]) => {
    const pct = Math.round((count / total) * 100);
    const color = colors[method] || 'bg-slate-400';
    return `
      <div class="flex items-center justify-between text-sm text-slate-600"><span>${method}</span><span>${pct}%</span></div>
      <div class="rounded-full bg-slate-200 h-3 overflow-hidden"><div class="h-full rounded-full ${color}" style="width:${pct}%"></div></div>`;
  }).join('');
}


init();
