import { initStore, getCampaigns, addCampaign, getDonationTrend } from '../store.js';
import { formatCurrency, statusBadgeClass, openModal, closeModal, bindModalClose } from '../utils.js';
import { initLayout } from '../layout.js';
import { initCharts } from '../charts.js';

let allCampaigns = [];

async function init() {
  await initStore();
  initLayout({ showSearch: false });
  initCharts();
  bindModalClose();

  allCampaigns = await getCampaigns();
  renderCards();
  renderInsights();
  renderTrendChart();

  document.getElementById('openAddCampaign')?.addEventListener('click', () => {
    document.getElementById('campaignForm').reset();
    openModal('campaignModal');
  });
  document.getElementById('campaignForm')?.addEventListener('submit', saveCampaign);
}

const CAMPAIGN_STATUS_COLORS = Object.freeze({
  Live: '#4CAF50',
  Planning: '#9CA3AF',
  Paused: '#F59E0B',
});

function campaignProgressColor(status) {
  return CAMPAIGN_STATUS_COLORS[status] || CAMPAIGN_STATUS_COLORS.Planning;
}

function renderCards() {
  const grid = document.getElementById('campaigns-grid');
  if (!grid) return;

  grid.innerHTML = allCampaigns.length ? allCampaigns.map((c, i) => {
    const goal = Number(c.goal_amount) || 1;
    const raised = Number(c.amount_raised) || 0;
    const pct = Math.min(100, Math.round((raised / goal) * 100));
    const banner = c.image_url
      ? `<div class="campaign-banner bg-cover bg-center h-44" style="background-image:url('${c.image_url}')" loading="lazy"></div>`
      : '';
    const cardBg = i === 0 ? 'bg-gradient-to-br from-white via-slate-50 to-slate-100' : 'bg-white';
    const progressColor = campaignProgressColor(c.status);
    return `
      <article class="campaign-card ${cardBg} shadow-xl rounded-[28px] border border-slate-200/80 overflow-hidden" style="--campaign-progress-color: ${progressColor}; --campaign-progress-value: ${pct};">
        ${banner}
        <div class="p-6">
          <div class="flex items-start justify-between gap-3 mb-4">
            <span class="badge ${statusBadgeClass(c.status)}">${c.status}</span>
            <div class="progress-ring"><span>${pct}%</span></div>
          </div>
          <div class="flex items-center justify-between gap-3"><h3 class="text-xl font-semibold mb-3">${escapeHtml(c.campaign_name)}</h3><a href="campaign-detail.php?id=${c.campaign_id}" class="text-sky-600 text-sm font-semibold">View</a></div>
          <p class="text-slate-500 mb-5">${escapeHtml(c.description || '')}</p>
          <div class="flex items-center justify-between text-sm text-slate-600 mb-5">
            <span>Goal ${formatCurrency(goal)}</span>
            <span>Raised ${formatCurrency(raised)}</span>
          </div>
          <div class="campaign-progress-track h-3 rounded-full overflow-hidden mb-5">
            <div class="campaign-progress-bar h-full rounded-full" style="width:${pct}%"></div>
          </div>
        </div>
      </article>`;
  }).join('') : '<p class="text-slate-500">No campaigns yet.</p>';
}

function renderInsights() {
  const live = allCampaigns.filter((c) => c.status === 'Live').length;
  const onTarget = allCampaigns.filter((c) => (Number(c.amount_raised) / Number(c.goal_amount || 1)) >= 0.5).length;
  const pctOnTarget = allCampaigns.length ? Math.round((onTarget / allCampaigns.length) * 100) : 0;
  const upcoming = allCampaigns.filter((c) => c.status === 'Planning').length;

  document.getElementById('insight-live')?.replaceChildren(document.createTextNode(String(live)));
  document.getElementById('insight-target')?.replaceChildren(document.createTextNode(pctOnTarget + '%'));
  document.getElementById('insight-upcoming')?.replaceChildren(document.createTextNode(String(upcoming)));
}

// Real month-by-month "amount raised" trend across all campaigns (replaces
// the old hardcoded Week 1-4 demo numbers).
async function renderTrendChart() {
  if (typeof Chart === 'undefined') return;
  const trend = await getDonationTrend(6);
  const chart = Chart.getChart('campaignLineChart');
  if (!chart || !trend.length) return;
  chart.data.labels = trend.map((t) => t.month);
  chart.data.datasets[0].data = trend.map((t) => Number(t.total));
  chart.update();
}

async function saveCampaign(e) {
  e.preventDefault();
  try {
    await addCampaign({
      campaign_name: document.getElementById('campaignName').value.trim(),
      description: document.getElementById('campaignDesc').value.trim(),
      goal_amount: Number(document.getElementById('campaignGoal').value),
    });
    closeModal('campaignModal');
    allCampaigns = await getCampaigns();
    renderCards();
    renderInsights();
  } catch (err) {
    alert(err.message || 'Could not create campaign.');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

init();
