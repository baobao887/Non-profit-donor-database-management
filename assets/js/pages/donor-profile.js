import { initStore, getDonor, getDonationsByDonor, getCommunicationsByDonor } from '../store.js';
import { formatCurrency, formatDate, initials, levelBadgeClass, statusBadgeClass } from '../utils.js';
import { initLayout } from '../layout.js';

async function init() {
  await initStore();
  initLayout({ showSearch: false });

  const requestedId = new URLSearchParams(location.search).get('id');
  const d = requestedId ? await getDonor(requestedId) : null;
  if (!d) {
    location.href = 'donors.php';
    return;
  }

  const [gifts, notes] = await Promise.all([
    getDonationsByDonor(d.donor_id),
    getCommunicationsByDonor(d.donor_id),
  ]);
  const favorite = [...gifts].sort((a, b) => b.amount - a.amount)[0]?.campaign_name || '—';
  const byId = (x) => document.getElementById(x);
  const fullName = `${d.first_name} ${d.last_name}`;

  byId('profileHeader').innerHTML = `<div class="flex items-center gap-4"><div class="avatar avatar-blue text-lg">${initials(fullName)}</div><div><p class="text-sm text-slate-500">Donor profile</p><h1 class="text-3xl font-semibold">${escapeHtml(fullName)}</h1><p class="text-slate-500 mt-1">${escapeHtml(d.email || '')} · ${escapeHtml(d.phone || '')}</p></div><span class="ml-auto badge ${levelBadgeClass(d.donor_rank)}">${d.donor_rank}</span></div>`;

  byId('profileStats').innerHTML = [
    ['Lifetime donations', formatCurrency(d.total_donated)],
    ['Number of donations', gifts.length],
    ['Favorite campaign', escapeHtml(favorite)],
  ].map(([a, b]) => `<article class="card-glass p-5 rounded-[28px]"><p class="text-slate-500 text-sm">${a}</p><p class="text-xl font-semibold mt-2">${b}</p></article>`).join('');

  byId('donationHistory').innerHTML = gifts.length
    ? gifts.map((g) => `<div class="flex justify-between rounded-2xl bg-slate-50 p-4"><span><b>${escapeHtml(g.campaign_name)}</b><br><small class="text-slate-500">${formatDate(g.donation_date)} · ${g.payment_method}</small></span><b>${formatCurrency(g.amount)}</b></div>`).join('')
    : '<p class="text-slate-500">No donations recorded.</p>';

  byId('communicationHistory').innerHTML = notes.length
    ? notes.map((n) => `<div class="rounded-2xl bg-slate-50 p-4"><div class="flex justify-between"><b>${escapeHtml(n.type)}</b><span class="badge ${statusBadgeClass(n.status)}">${n.status}</span></div><p class="text-sm text-slate-600 mt-2">${escapeHtml(n.content)}</p><small class="text-slate-500">${formatDate(n.created_at)} · ${escapeHtml(n.staff_first_name ? `${n.staff_first_name} ${n.staff_last_name}` : 'Unassigned')}</small></div>`).join('')
    : '<p class="text-slate-500">No communication recorded.</p>';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

init();
