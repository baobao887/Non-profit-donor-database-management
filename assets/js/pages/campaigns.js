import { initStore, getCampaigns, addCampaign } from '../store.js';
import { formatCurrency, statusBadgeClass, openModal, closeModal, bindModalClose } from '../utils.js';
import { initLayout } from '../layout.js';
import { initCharts } from '../charts.js';

async function init() {
  await initStore();
  initLayout({ showSearch: false, showTheme: true });
  initCharts();
  bindModalClose();

  renderCards();
  renderInsights();

  document.getElementById('openAddCampaign')?.addEventListener('click', () => {
    document.getElementById('campaignForm').reset();
    openModal('campaignModal');
  });
  document.getElementById('campaignForm')?.addEventListener('submit', saveCampaign);
}

function campaignStatusRingClass(status) {
  if (status === 'Paused') return 'progress-ring-danger';
  if (status === 'Planning') return 'progress-ring-secondary';
  return '';
}

function renderCards() {
  const grid = document.getElementById('campaigns-grid');
  if (!grid) return;

  const campaigns = getCampaigns();
  grid.innerHTML = campaigns.map((c, i) => {
    const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
    const banner = c.image
      ? `<div class="campaign-banner bg-cover bg-center h-44" style="background-image:url('${c.image}')" loading="lazy"></div>`
      : '';
    const cardBg = i === 0 ? 'bg-gradient-to-br from-white via-slate-50 to-slate-100' : 'bg-white';
    const barColor = c.status === 'Paused' ? 'from-amber-500 to-orange-500' : c.status === 'Planning' ? 'from-emerald-500 to-cyan-500' : 'from-sky-500 to-indigo-600';
    return `
      <article class="campaign-card ${cardBg} shadow-xl rounded-[28px] border border-slate-200/80 overflow-hidden">
        ${banner}
        <div class="p-6">
          <div class="flex items-start justify-between gap-3 mb-4">
            <span class="badge ${statusBadgeClass(c.status)}">${c.status}</span>
            <div class="progress-ring ${campaignStatusRingClass(c.status)}" style="background:conic-gradient(var(--primary,#2563EB) ${pct}%, rgba(226,232,240,0.8) 0)"><span>${pct}%</span></div>
          </div>
          <h3 class="text-xl font-semibold mb-3">${c.name}</h3>
          <p class="text-slate-500 mb-5">${c.description}</p>
          <div class="flex items-center justify-between text-sm text-slate-600 mb-5">
            <span>Goal ${formatCurrency(c.goal)}</span>
            <span>Raised ${formatCurrency(c.raised)}</span>
          </div>
          <div class="h-3 rounded-full bg-slate-200 overflow-hidden mb-5">
            <div class="h-full rounded-full bg-gradient-to-r ${barColor}" style="width:${pct}%"></div>
          </div>
        </div>
      </article>`;
  }).join('');
}

function renderInsights() {
  const campaigns = getCampaigns();
  const live = campaigns.filter((c) => c.status === 'Live').length;
  const onTarget = campaigns.filter((c) => (c.raised / c.goal) >= 0.5).length;
  const pctOnTarget = campaigns.length ? Math.round((onTarget / campaigns.length) * 100) : 0;
  const upcoming = campaigns.filter((c) => c.status === 'Planning').length;

  document.getElementById('insight-live')?.replaceChildren(document.createTextNode(String(live)));
  document.getElementById('insight-target')?.replaceChildren(document.createTextNode(pctOnTarget + '%'));
  document.getElementById('insight-upcoming')?.replaceChildren(document.createTextNode(String(upcoming)));
}

function saveCampaign(e) {
  e.preventDefault();
  addCampaign({
    name: document.getElementById('campaignName').value.trim(),
    description: document.getElementById('campaignDesc').value.trim(),
    goal: Number(document.getElementById('campaignGoal').value),
    status: document.getElementById('campaignStatus').value,
    image: null,
  });
  closeModal('campaignModal');
  renderCards();
  renderInsights();
}

init();
