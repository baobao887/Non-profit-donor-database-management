import { apiGet } from '../store.js';
import { formatCurrency, formatDate, initials, avatarClass, statusBadgeClass, renderError } from '../utils.js';
import { initLayout } from '../layout.js';
import { initCharts, updateDashboardCharts } from '../charts.js';

async function init() {
  initLayout({ showSearch: true });
  initCharts();

  try {
    const stats = await apiGet('api/dashboard.php');
    renderStats(stats);
    renderRecentDonations(stats.recentDonations);
    renderTopDonors(stats.topDonors);
    renderCampaignProgress(stats.campaignsNeedingAttention);

    const trend = await apiGet('api/donations.php', { action: 'trend' });
    updateDashboardCharts(trend);

    const breakdown = await apiGet('api/donations.php', { action: 'breakdown' });
    renderDonationPieChart(breakdown);
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

  // Mini progress on the Campaigns KPI card: the share of campaigns that are
  // live. Real data only (activeCampaigns / campaignCount) — no fabricated deltas.
  const totalCampaigns = Number(stats.campaignCount) || 0;
  const liveCampaigns = Number(stats.activeCampaigns) || 0;
  const livePct = totalCampaigns ? Math.round((liveCampaigns / totalCampaigns) * 100) : 0;
  const campaignsBar = document.getElementById('stat-campaigns-bar');
  if (campaignsBar) campaignsBar.style.width = livePct + '%';
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
    <div class="donor-card flex items-center justify-between p-4">
      <div class="flex items-center gap-3">
        <div class="avatar ${avatarClass(i)}">${initials(name)}</div>
        <div>
          <p class="font-semibold">${escapeHtml(name)}</p>
          <p class="text-ink-500 text-sm">${escapeHtml(d.donor_rank)} donor</p>
        </div>
      </div>
      <p class="font-semibold">${formatCurrency(d.total_donated)}</p>
    </div>`;
  }).join('') : '<p class="text-ink-500">No donors yet.</p>';
}

function renderCampaignProgress(campaigns = []) {
  const container = document.getElementById('campaign-progress-list');
  if (!container) return;
  container.innerHTML = campaigns.length ? campaigns.map((c) => {
    const goal = Number(c.goal_amount) || 1;
    const raised = Number(c.amount_raised) || 0;
    const pct = Math.min(100, Math.round((raised / goal) * 100));
    const needsAttention = pct < 70;
    const barColor = needsAttention ? 'bg-warning-500' : 'bg-brand-600';
    return `
      <div class="progress-summary">
        <div><p class="font-semibold">${escapeHtml(c.campaign_name)}</p><p class="text-ink-500 text-sm">${formatCurrency(raised)} raised of ${formatCurrency(goal)}</p></div>
        <span class="badge ${needsAttention ? 'bg-warning-100 text-warning-700' : 'bg-success-100 text-success-700'}">${needsAttention ? 'Needs attention' : 'On track'}</span>
      </div>
      <div class="flex items-center gap-3"><div class="h-3 flex-1 rounded-full bg-ink-200 overflow-hidden"><div class="h-full rounded-full ${barColor}" style="width:${pct}%"></div></div><span class="text-sm font-semibold text-ink-600">${pct}%</span></div>`;
  }).join('') : '<p class="text-ink-500">No live campaign alerts right now.</p>';
}

// Real per-campaign donation split — replaces the old hardcoded
// Recurring/One-time/Corporate/Events demo categories, which had no
// corresponding column in the donations table. Rendered as a sorted horizontal
// bar (see charts.js `pieChart`): sort by amount descending, then cap to the
// top 5 + an honest "Other" total so the compact bar stays readable and the
// chart never has to cycle colours across many campaigns.
function renderDonationPieChart(breakdown = []) {
  if (typeof Chart === 'undefined') return;
  const chart = Chart.getChart('pieChart');
  if (!chart) return;

  const rows = breakdown
    .filter((b) => Number(b.total) > 0)
    .map((b) => ({ name: b.campaign_name, total: Number(b.total) }))
    .sort((a, b) => b.total - a.total);

  let display = rows;
  if (rows.length > 6) {
    const other = rows.slice(5).reduce((sum, r) => sum + r.total, 0);
    display = [...rows.slice(0, 5), { name: 'Other', total: other }];
  }

  chart.data.labels = display.map((r) => r.name);
  chart.data.datasets[0].data = display.map((r) => r.total);
  chart.update();
}

function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}" class="empty-state px-6 py-8 text-center">${msg}</td></tr>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

init();