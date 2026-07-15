import { initStore, getDonations, getDonors, addDonation, getCampaigns, getPaymentMethodBreakdown, getWeekdayRevenue } from '../store.js';
import { formatCurrency, formatDate, statusBadgeClass, openModal, closeModal, bindModalClose, exportCsv } from '../utils.js';
import { initLayout } from '../layout.js';
import { initCharts } from '../charts.js';

let allDonors = [];
let allCampaigns = [];
let allDonations = [];

async function init() {
  await initStore();
  initLayout({ showSearch: false });
  initCharts();
  bindModalClose();

  [allDonors, allCampaigns, allDonations] = await Promise.all([getDonors(), getCampaigns(), getDonations()]);

  populateDonorSelect();
  populateCampaignSelect();
  updateStats();
  renderTable();
  renderCharts();

  document.getElementById('openAddDonation')?.addEventListener('click', () => {
    document.getElementById('donationForm').reset();
    document.getElementById('donationDate').value = new Date().toISOString().slice(0, 10);
    openModal('donationModal');
  });
  document.getElementById('donationForm')?.addEventListener('submit', saveDonation);
  document.getElementById('exportDonations')?.addEventListener('click', exportDonations);
  document.getElementById('filterStatus')?.addEventListener('change', renderTable);
}

function donorName(id) {
  const d = allDonors.find((x) => String(x.donor_id) === String(id));
  return d ? `${d.first_name} ${d.last_name}` : 'Unknown';
}

function campaignName(id) {
  const c = allCampaigns.find((x) => String(x.campaign_id) === String(id));
  return c ? c.campaign_name : 'Unknown';
}

function populateDonorSelect() {
  const sel = document.getElementById('donationDonor');
  if (!sel) return;
  sel.innerHTML = allDonors.map((d) => `<option value="${d.donor_id}">${escapeHtml(`${d.first_name} ${d.last_name}`)}</option>`).join('');
}

function populateCampaignSelect() {
  const sel = document.getElementById('donationCampaign');
  if (!sel) return;
  sel.innerHTML = allCampaigns.map((c) => `<option value="${c.campaign_id}">${escapeHtml(c.campaign_name)}</option>`).join('');
}

function updateStats() {
  const succeeded = allDonations.filter((d) => d.payment_status === 'Succeeded');
  const total = succeeded.reduce((s, d) => s + Number(d.amount), 0);
  const avg = succeeded.length ? Math.round(total / succeeded.length) : 0;
  const refunds = allDonations.filter((d) => d.payment_status === 'Refunded').length;
  const refundRate = allDonations.length ? ((refunds / allDonations.length) * 100).toFixed(1) : '0';

  document.getElementById('stat-revenue')?.replaceChildren(document.createTextNode(formatCurrency(total)));
  document.getElementById('stat-avg')?.replaceChildren(document.createTextNode(formatCurrency(avg)));
  document.getElementById('stat-refund')?.replaceChildren(document.createTextNode(refundRate + '%'));
}

function renderTable() {
  const tbody = document.getElementById('donations-table-body');
  if (!tbody) return;

  const statusFilter = document.getElementById('filterStatus')?.value || 'all';
  const donations = statusFilter !== 'all' ? allDonations.filter((d) => d.payment_status === statusFilter) : allDonations;

  tbody.innerHTML = donations.length ? donations.map((d) => {
    const methodIcon = d.payment_method === 'Card' ? 'fa-solid fa-credit-card text-sky-600'
      : d.payment_method === 'PayPal' ? 'fa-brands fa-cc-paypal text-slate-700'
      : 'fa-solid fa-building-columns text-indigo-600';
    return `<tr class="table-row">
      <td class="px-6 py-4"><p class="font-semibold">#${d.donation_id}</p><p class="text-slate-400 text-sm">${escapeHtml(campaignName(d.campaign_id))}</p></td>
      <td class="py-4">${escapeHtml(donorName(d.donor_id))}</td>
      <td class="py-4">${formatDate(d.donation_date)}</td>
      <td class="py-4 font-semibold">${formatCurrency(d.amount)}</td>
      <td class="py-4"><span class="inline-flex items-center gap-2 text-slate-600"><i class="${methodIcon}"></i> ${d.payment_method}</span></td>
      <td class="py-4"><span class="badge ${statusBadgeClass(d.payment_status)}">${d.payment_status}</span></td>
      <td class="py-4 pr-6"><button type="button" class="btn-primary-outline btn-sm" data-receipt="${d.donation_id}">Receipt</button></td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" class="empty-state px-6 py-10 text-center text-slate-500">No donations found.</td></tr>`;

  tbody.querySelectorAll('[data-receipt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const d = allDonations.find((x) => String(x.donation_id) === btn.dataset.receipt);
      if (d) alert(`Receipt #${d.donation_id}\nAmount: ${formatCurrency(d.amount)}\nDate: ${formatDate(d.donation_date)}\nCampaign: ${campaignName(d.campaign_id)}`);
    });
  });
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Real per-weekday revenue and per-method counts (replaces hardcoded demo chart data).
async function renderCharts() {
  if (typeof Chart === 'undefined') return;

  const [weekday, methods] = await Promise.all([getWeekdayRevenue(), getPaymentMethodBreakdown()]);

  const revenueChart = Chart.getChart('donationsLineChart');
  if (revenueChart && weekday.length) {
    // MySQL DAYOFWEEK: 1=Sunday..7=Saturday. Rotate so the chart reads Mon-Sun.
    const byDow = Object.fromEntries(weekday.map((w) => [Number(w.dow), Number(w.total)]));
    const order = [2, 3, 4, 5, 6, 7, 1];
    revenueChart.data.labels = order.map((dow) => WEEKDAY_LABELS[dow - 1]);
    revenueChart.data.datasets[0].data = order.map((dow) => byDow[dow] || 0);
    revenueChart.update();
  }

  const methodsChart = Chart.getChart('paymentMethodsChart');
  if (methodsChart && methods.length) {
    methodsChart.data.labels = methods.map((m) => m.payment_method);
    methodsChart.data.datasets[0].data = methods.map((m) => Number(m.count));
    methodsChart.update();
  }
}

async function saveDonation(e) {
  e.preventDefault();
  try {
    await addDonation({
      donor_id: document.getElementById('donationDonor').value,
      campaign_id: document.getElementById('donationCampaign').value,
      amount: Number(document.getElementById('donationAmount').value),
      donation_date: document.getElementById('donationDate').value,
      payment_method: document.getElementById('donationMethod').value,
    });
    closeModal('donationModal');
    allDonations = await getDonations();
    updateStats();
    renderTable();
    renderCharts();
  } catch (err) {
    alert(err.message || 'Could not save donation.');
  }
}

function exportDonations() {
  exportCsv('donations.csv', allDonations, [
    { label: 'ID', value: (d) => d.donation_id },
    { label: 'Donor', value: (d) => donorName(d.donor_id) },
    { label: 'Campaign', value: (d) => campaignName(d.campaign_id) },
    { label: 'Amount (PHP)', value: (d) => formatCurrency(d.amount) },
    { label: 'Date', value: (d) => d.donation_date },
    { label: 'Status', value: (d) => d.payment_status },
  ]);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

init();
