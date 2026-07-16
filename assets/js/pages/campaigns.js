import { initStore, getCampaigns, addCampaign, updateCampaign, deleteCampaign, getDonationTrend } from '../store.js';
import { formatCurrency, formatDate, statusBadgeClass, openModal, closeModal, bindModalClose } from '../utils.js';
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

  document.getElementById('openAddCampaign')?.addEventListener('click', () => openAddModal());
  document.getElementById('campaignForm')?.addEventListener('submit', saveCampaign);
}

const CAMPAIGN_STATUS_COLORS = Object.freeze({
  Live: '#4CAF50',
  Planning: '#9CA3AF',
  Paused: '#F59E0B',
  Completed: '#2563EB',
  Archived: '#94A3B8',
});

function campaignProgressColor(status) {
  return CAMPAIGN_STATUS_COLORS[status] || CAMPAIGN_STATUS_COLORS.Planning;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// A campaign is expired when it's still marked Live but its end date has
// already passed - the system flags this, it does not auto-archive it;
// an admin decides whether to extend, complete, or archive it.
function isExpired(c) {
  return c.status === 'Live' && c.end_date && c.end_date < todayISO();
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
    const expiredBadge = isExpired(c) ? '<span class="badge bg-rose-100 text-rose-700">Expired</span>' : '';
    return `
      <article class="campaign-card ${cardBg} shadow-xl rounded-[28px] border border-slate-200/80 overflow-hidden" style="--campaign-progress-color: ${progressColor}; --campaign-progress-value: ${pct};">
        ${banner}
        <div class="p-6">
          <div class="flex items-start justify-between gap-3 mb-4">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="badge ${statusBadgeClass(c.status)}">${c.status}</span>
              ${expiredBadge}
            </div>
            <div class="progress-ring"><span>${pct}%</span></div>
          </div>
          <div class="flex items-center justify-between gap-3"><h3 class="text-xl font-semibold mb-3">${escapeHtml(c.campaign_name)}</h3><a href="campaign-detail.php?id=${c.campaign_id}" class="text-sky-600 text-sm font-semibold">View</a></div>
          <p class="text-slate-500 mb-5">${escapeHtml(c.description || '')}</p>
          <div class="flex items-center justify-between text-sm text-slate-600 mb-3">
            <span>Goal ${formatCurrency(goal)}</span>
            <span>Raised ${formatCurrency(raised)}</span>
          </div>
          <div class="campaign-progress-track h-3 rounded-full overflow-hidden mb-5">
            <div class="campaign-progress-bar h-full rounded-full" style="width:${pct}%"></div>
          </div>
          <div class="flex items-center justify-between text-xs text-slate-500 mb-5">
            <span>${c.start_date ? formatDate(c.start_date) : 'No start date'}</span>
            <span>${c.end_date ? formatDate(c.end_date) : 'No end date'}</span>
          </div>
          <div class="flex gap-2">
            <button type="button" class="btn-primary-outline btn-sm" data-edit="${c.campaign_id}">Edit</button>
            <button type="button" class="btn-danger-outline btn-sm" data-delete="${c.campaign_id}">Delete</button>
          </div>
        </div>
      </article>`;
  }).join('') : '<p class="text-slate-500">No campaigns yet.</p>';

  grid.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openEditModal(btn.dataset.edit)));
  grid.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => removeCampaign(btn.dataset.delete)));
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

function openAddModal() {
  document.getElementById('campaignModalTitle').textContent = 'New campaign';
  document.getElementById('campaignForm').reset();
  document.getElementById('campaignId').value = '';
  openModal('campaignModal');
}

function openEditModal(id) {
  const c = allCampaigns.find((x) => String(x.campaign_id) === String(id));
  if (!c) return;
  document.getElementById('campaignModalTitle').textContent = 'Edit campaign';
  document.getElementById('campaignId').value = c.campaign_id;
  document.getElementById('campaignName').value = c.campaign_name;
  document.getElementById('campaignDesc').value = c.description || '';
  document.getElementById('campaignGoal').value = c.goal_amount;
  document.getElementById('campaignStatus').value = c.status;
  document.getElementById('campaignStartDate').value = c.start_date || '';
  document.getElementById('campaignEndDate').value = c.end_date || '';
  openModal('campaignModal');
}

async function removeCampaign(id) {
  if (!confirm('Delete this campaign? This archives it and preserves its donation history.')) return;
  try {
    await deleteCampaign(id);
    allCampaigns = await getCampaigns();
    renderCards();
    renderInsights();
  } catch (err) {
    alert(err.message || 'Could not delete campaign.');
  }
}

async function saveCampaign(e) {
  e.preventDefault();

  const id = document.getElementById('campaignId').value;
  const name = document.getElementById('campaignName').value.trim();
  const goal = Number(document.getElementById('campaignGoal').value);
  const startDate = document.getElementById('campaignStartDate').value;
  const endDate = document.getElementById('campaignEndDate').value;

  if (!name) {
    alert('Campaign name is required.');
    return;
  }
  if (!(goal > 0)) {
    alert('Goal amount must be greater than 0.');
    return;
  }
  if (!startDate || !endDate) {
    alert('Start date and end date are required.');
    return;
  }
  if (endDate < startDate) {
    alert('End date cannot be before start date.');
    return;
  }

  const data = {
    campaign_name: name,
    description: document.getElementById('campaignDesc').value.trim(),
    goal_amount: goal,
    start_date: startDate,
    end_date: endDate,
    status: document.getElementById('campaignStatus').value,
  };

  try {
    if (id) await updateCampaign(id, data);
    else await addCampaign(data);
    closeModal('campaignModal');
    allCampaigns = await getCampaigns();
    renderCards();
    renderInsights();
  } catch (err) {
    alert(err.message || 'Could not save campaign.');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

init();
