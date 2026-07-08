import { initStore, getDonations, getDonors, addDonation, getCampaigns } from '../store.js';
import { formatCurrency, formatDate, statusBadgeClass, openModal, closeModal, bindModalClose, exportCsv } from '../utils.js';
import { initLayout } from '../layout.js';
import { initCharts } from '../charts.js';

async function init() {
  await initStore();
  initLayout({ showSearch: false, showTheme: true });
  initCharts();
  bindModalClose();

  populateDonorSelect();
  populateCampaignSelect();
  updateStats();
  renderTable();

  document.getElementById('openAddDonation')?.addEventListener('click', () => {
    document.getElementById('donationForm').reset();
    document.getElementById('donationDate').value = new Date().toISOString().slice(0, 10);
    openModal('donationModal');
  });
  document.getElementById('donationForm')?.addEventListener('submit', saveDonation);
  document.getElementById('exportDonations')?.addEventListener('click', exportDonations);
  document.getElementById('filterStatus')?.addEventListener('change', renderTable);
}

function populateDonorSelect() {
  const sel = document.getElementById('donationDonor');
  if (!sel) return;
  sel.innerHTML = getDonors().map((d) => `<option value="${d.id}">${d.name}</option>`).join('');
}

function populateCampaignSelect() {
  const sel = document.getElementById('donationCampaign');
  if (!sel) return;
  sel.innerHTML = getCampaigns().map((c) => `<option value="${c.name}">${c.name}</option>`).join('');
}

function updateStats() {
  const donations = getDonations().filter((d) => d.status !== 'Refund');
  const total = donations.reduce((s, d) => s + d.amount, 0);
  const avg = donations.length ? Math.round(total / donations.length) : 0;
  const refunds = getDonations().filter((d) => d.status === 'Refund').length;
  const refundRate = donations.length ? ((refunds / getDonations().length) * 100).toFixed(1) : '0';

  document.getElementById('stat-revenue')?.replaceChildren(document.createTextNode(formatCurrency(total)));
  document.getElementById('stat-avg')?.replaceChildren(document.createTextNode(formatCurrency(avg)));
  document.getElementById('stat-refund')?.replaceChildren(document.createTextNode(refundRate + '%'));
}

function renderTable() {
  const tbody = document.getElementById('donations-table-body');
  if (!tbody) return;

  const statusFilter = document.getElementById('filterStatus')?.value || 'all';
  const donors = getDonors();
  let donations = getDonations();
  if (statusFilter !== 'all') donations = donations.filter((d) => d.status === statusFilter);

  tbody.innerHTML = donations.length ? donations.map((d) => {
    const donor = donors.find((x) => x.id === d.donorId);
    const methodIcon = d.method === 'Visa' ? 'fa-brands fa-cc-visa text-sky-600' : d.method === 'PayPal' ? 'fa-brands fa-cc-paypal text-slate-700' : 'fa-solid fa-credit-card text-indigo-600';
    return `<tr class="table-row">
      <td class="px-6 py-4"><p class="font-semibold">#${d.id}</p><p class="text-slate-400 text-sm">${d.campaign}</p></td>
      <td class="py-4">${donor?.name || 'Unknown'}</td>
      <td class="py-4">${formatDate(d.date)}</td>
      <td class="py-4 font-semibold">${formatCurrency(d.amount)}</td>
      <td class="py-4"><span class="inline-flex items-center gap-2 text-slate-600"><i class="${methodIcon}"></i> ${d.method}</span></td>
      <td class="py-4"><span class="badge ${statusBadgeClass(d.status)}">${d.status}</span></td>
      <td class="py-4 pr-6"><button type="button" class="btn-primary-outline btn-sm" data-receipt="${d.id}">Receipt</button></td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" class="empty-state px-6 py-10 text-center text-slate-500">No donations found.</td></tr>`;

  tbody.querySelectorAll('[data-receipt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const d = getDonations().find((x) => x.id === btn.dataset.receipt);
      if (d) alert(`Receipt #${d.id}\nAmount: ${formatCurrency(d.amount)}\nDate: ${formatDate(d.date)}\nCampaign: ${d.campaign}`);
    });
  });
}

function saveDonation(e) {
  e.preventDefault();
  addDonation({
    donorId: document.getElementById('donationDonor').value,
    campaign: document.getElementById('donationCampaign').value,
    amount: Number(document.getElementById('donationAmount').value),
    date: document.getElementById('donationDate').value,
    method: document.getElementById('donationMethod').value,
    status: document.getElementById('donationStatus').value,
  });
  closeModal('donationModal');
  updateStats();
  renderTable();
}

function exportDonations() {
  const donors = getDonors();
  exportCsv('donations.csv', getDonations(), [
    { label: 'ID', value: (d) => d.id },
    { label: 'Donor', value: (d) => donors.find((x) => x.id === d.donorId)?.name || '' },
    { label: 'Campaign', value: (d) => d.campaign },
    { label: 'Amount', value: (d) => d.amount },
    { label: 'Date', value: (d) => d.date },
    { label: 'Status', value: (d) => d.status },
  ]);
}

init();
