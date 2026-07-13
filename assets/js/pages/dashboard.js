import { initStore, getDonors, getDonations, getCampaigns, getStats } from '../store.js';
import { formatCurrency, formatDate, initials, avatarClass, statusBadgeClass } from '../utils.js';
import { initLayout } from '../layout.js';
import { initCharts, updateDashboardCharts } from '../charts.js';

async function init() {
  await initStore();
  initLayout({ showSearch: true, showTheme: true });
  initCharts();

  const stats = getStats();
  document.getElementById('stat-donors')?.replaceChildren(document.createTextNode(stats.totalDonors.toLocaleString()));
  document.getElementById('stat-donations')?.replaceChildren(document.createTextNode(formatCurrency(stats.totalDonations)));
  document.getElementById('stat-campaigns')?.replaceChildren(document.createTextNode(String(stats.campaignCount)));
  document.getElementById('stat-active-campaigns')?.replaceChildren(document.createTextNode(String(stats.activeCampaigns)));
  document.getElementById('stat-active-campaigns-display')?.replaceChildren(document.createTextNode(String(stats.activeCampaigns)));
  renderRecentDonations();
  renderTopDonors();
  renderCampaignProgress();
  updateDashboardCharts(getDonations());
}

function renderRecentDonations() {
  const tbody = document.getElementById('recent-donations-body');
  if (!tbody) return;
  const donations = getDonations().slice(0, 5);
  const donors = getDonors();
  tbody.innerHTML = donations.map((d) => {
    const donor = donors.find((x) => x.id === d.donorId);
    return `<tr class="table-row">
      <td class="px-6 py-4">${donor?.name || 'Unknown'}</td>
      <td class="py-4">${d.campaign}</td>
      <td class="py-4 font-semibold">${formatCurrency(d.amount)}</td>
      <td class="py-4">${formatDate(d.date)}</td>
      <td class="py-4 pr-6"><span class="badge ${statusBadgeClass(d.status)}">${d.status}</span></td>
    </tr>`;
  }).join('') || emptyRow(5, 'No donations yet');
}

function renderTopDonors() {
  const container = document.getElementById('top-donors-list');
  if (!container) return;
  const donors = [...getDonors()].sort((a, b) => b.lifetime - a.lifetime).slice(0, 3);
  container.innerHTML = donors.map((d, i) => `
    <div class="donor-card flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
      <div class="flex items-center gap-3">
        <div class="avatar ${avatarClass(i)}">${initials(d.name)}</div>
        <div>
          <p class="font-semibold">${d.name}</p>
          <p class="text-slate-500 text-sm">${d.role}</p>
        </div>
      </div>
      <p class="font-semibold">${formatCurrency(d.lifetime)}</p>
    </div>`).join('');
}

function renderCampaignProgress() {
  const container = document.getElementById('campaign-progress-list');
  if (!container) return;
  const campaigns = getCampaigns().filter((c) => c.status === 'Live').slice(0, 2);
  container.innerHTML = campaigns.map((c) => {
    const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
    const needsAttention = pct < 70;
    const color = needsAttention ? 'from-amber-400 to-orange-500' : 'from-sky-500 to-indigo-600';
    return `
      <div class="progress-summary">
        <div><p class="font-semibold">${c.name}</p><p class="text-slate-500 text-sm">${formatCurrency(c.raised)} raised of ${formatCurrency(c.goal)}</p></div>
        <span class="badge ${needsAttention ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}">${needsAttention ? 'Needs attention' : 'On track'}</span>
      </div>
      <div class="flex items-center gap-3"><div class="h-3 flex-1 rounded-full bg-slate-200 overflow-hidden"><div class="h-full rounded-full bg-gradient-to-r ${color}" style="width:${pct}%"></div></div><span class="text-sm font-semibold text-slate-600">${pct}%</span></div>`;
  }).join('') || '<p class="text-slate-500">No live campaign alerts right now.</p>';
}

function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}" class="empty-state px-6 py-8 text-center text-slate-500">${msg}</td></tr>`;
}

init();
