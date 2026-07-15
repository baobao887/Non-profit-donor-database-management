import { initStore, getCampaignById } from '../store.js';
import { formatCurrency, formatDate, statusBadgeClass } from '../utils.js';
import { initLayout } from '../layout.js';

async function init() {
  await initStore();
  initLayout({ showSearch: false });

  const requestedId = new URLSearchParams(location.search).get('id');
  const c = requestedId ? await getCampaignById(requestedId) : null;
  if (!c) {
    location.href = 'campaigns.php';
    return;
  }

  const goal = Number(c.goal_amount) || 1;
  const raised = Number(c.amount_raised) || 0;
  const pct = Math.min(100, Math.round((raised / goal) * 100));
  const gifts = (c.donations || []).slice(0, 8);
  const byId = (x) => document.getElementById(x);

  byId('campaignOverview').innerHTML = `<div class="flex flex-wrap justify-between gap-5"><div><p class="text-sm text-slate-500">Campaign overview</p><h1 class="text-3xl font-semibold mt-1">${escapeHtml(c.campaign_name)}</h1><p class="text-slate-500 mt-3 max-w-xl">${escapeHtml(c.description || '')}</p></div><span class="badge ${statusBadgeClass(c.status)} h-fit">${c.status}</span></div><div class="mt-7"><div class="flex justify-between"><span class="font-semibold">${formatCurrency(raised)} raised</span><span class="text-slate-500">${pct}% of ${formatCurrency(goal)}</span></div><div class="h-3 rounded-full bg-slate-200 overflow-hidden mt-3"><div class="h-full bg-sky-600" style="width:${pct}%"></div></div></div>`;

  byId('campaignDonations').innerHTML = gifts.length
    ? gifts.map((g) => `<div class="rounded-2xl bg-slate-50 p-4 flex justify-between"><span>${formatDate(g.donation_date)}</span><b>${formatCurrency(g.amount)}</b></div>`).join('')
    : '<p class="text-slate-500">No donation timeline yet.</p>';

  byId('campaignDonors').innerHTML = gifts.length
    ? gifts.map((g) => `<div class="rounded-2xl bg-slate-50 p-4 flex justify-between"><span>${escapeHtml(`${g.first_name} ${g.last_name}`)}</span><span class="text-slate-500">${g.payment_method}</span></div>`).join('')
    : '<p class="text-slate-500">No donors yet.</p>';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

init();
