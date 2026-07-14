import { apiGet, renderError } from '../api.js';
import { formatCurrency, formatDate, initials, avatarClass, statusBadgeClass } from '../utils.js';
import { initLayout } from '../layout.js';
import { initCharts, updateDashboardCharts } from '../charts.js';

async function init() {
  initLayout({ showSearch: true, showTheme: true });
  initCharts();

  try {
    const stats = await apiGet('api/dashboard.php');
    renderStats(stats);
    renderRecentDonations(stats.recentDonations);
    renderTopDonors(stats.topDonors);
    renderCampaignProgress(stats.campaignsNeedingAttention);
    updateDashboardCharts(mapDonationsForChart(stats.recentDonations));
  } catch (err) {
    console.error('Dashboard load failed:', err);
    renderError(document.getElementById('recent-donations-body')?.closest('table')?.parentElement,
      'Could not load dashboard data.');
  }
}

function renderStats(stats) {
  document.getElementById('stat-donors')?.replaceChildren(document.createTextNode(Number(stats.totalDonors).toLocaleString()));
  document.getElementById('stat-donations')?.replaceChildren(document.createTextNode(formatCurrency(stats.totalDonations)));
  document.getElementById('stat-campaigns')?.replaceChildren(document.createTextNode(String(stats.campaignCount)));
  document.getElementById('stat-active-campaigns')?.replaceChildren(document.createTextNode(String(stats.activeCampaigns)));
  document.getElementById('stat-active-campaigns-display')?.replaceChildren(document.createTextNode(String(stats.activeCampaigns)));
}

function renderRecentDonations(donations = []) {
  const tbody = document.getElementById('recent-donations-body');
  if (!tbody) return;
  tbody.innerHTML = donations.length ? donations.map((d) => `
    <tr class="table-row">
      <td class="px-6 py-4">${escapeHtml(d.first_name)} ${escapeHtml(d.last_name)}</td>
      <td class="py-4">${escapeHtml(d.campaign_name)}</td>
      <td class="py-4 font-semibold">${formatCurrency(d.amount)}</td>
      <td class="py-4">${formatDate(d.donation_date)}</td>
      <td class="py-4 pr-6"><span class="badge ${statusBadgeClass(d.payment_status)}">${escapeHtml(d.payment_status)}</span></td>
    </tr>`).join('') : emptyRow(5, 'No donations yet');
}

function renderTopDonors(donors = []) {
  const container = document.getElementById('top-donors-list');
  if (!container) return;
  container.innerHTML = donors.length ? donors.map((d, i) => {
    const name = `${d.first_name} ${d.last_name}`;
    return `
    <div class="donor-card flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
      <div class="flex items-center gap-3">
        <div class="avatar ${avatarClass(i)}">${initials(name)}</div>
        <div>
          <p class="font-semibold">${escapeHtml(name)}</p>
          <p class="text-slate-500 text-sm">${escapeHtml(d.donor_rank)} donor</p>
        </div>
      </div>
      <p class="font-semibold">${formatCurrency(d.total_donated)}</p>
    </div>`;
  }).join('') : '<p class="text-slate-500">No donors yet.</p>';
}

function renderCampaignProgress(campaigns = []) {
  const container = document.getElementById('campaign-progress-list');
  if (!container) return;
  container.innerHTML = campaigns.length ? campaigns.map((c) => {
    const goal = Number(c.goal_amount) || 1;
    const raised = Number(c.amount_raised) || 0;
    const pct = Math.min(100, Math.round((raised / goal) * 100));
    const needsAttention = pct < 70;
    const color = needsAttention ? 'from-amber-400 to-orange-500' : 'from-sky-500 to-indigo-600';
    return `
      <div class="progress-summary">
        <div><p class="font-semibold">${escapeHtml(c.campaign_name)}</p><p class="text-slate-500 text-sm">${formatCurrency(raised)} raised of ${formatCurrency(goal)}</p></div>
        <span class="badge ${needsAttention ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}">${needsAttention ? 'Needs attention' : 'On track'}</span>
      </div>
      <div class="flex items-center gap-3"><div class="h-3 flex-1 rounded-full bg-slate-200 overflow-hidden"><div class="h-full rounded-full bg-gradient-to-r ${color}" style="width:${pct}%"></div></div><span class="text-sm font-semibold text-slate-600">${pct}%</span></div>`;
  }).join('') : '<p class="text-slate-500">No live campaign alerts right now.</p>';
}

// charts.js expects [{ date, amount, status }] — map the API's donation_date/payment_status fields
function mapDonationsForChart(donations = []) {
  return donations.map((d) => ({
    date: d.donation_date,
    amount: Number(d.amount),
    status: d.payment_status,
  }));
}

function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}" class="empty-state px-6 py-8 text-center text-slate-500">${msg}</td></tr>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

init();