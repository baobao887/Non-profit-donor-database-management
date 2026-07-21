import { initStore, getDonations, getDonationStats, getDonorOptions, addDonation, updateDonation, getCampaigns, getPaymentMethodBreakdown, getWeekdayRevenue } from '../store.js';
import { formatCurrency, formatDate, statusBadgeClass, openModal, closeModal, bindModalClose, exportCsv, showFormError, hideFormError } from '../utils.js';
import { initLayout } from '../layout.js';
import { initCharts } from '../charts.js';

const PAGE_SIZE = 25;
let donorOptions = [];
let allCampaigns = [];
let currentDonations = [];
let page = 1;
let totalDonations = 0;
let loading = false;

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

async function init() {
  await initStore();
  initLayout({ showSearch: false });
  initCharts();
  bindModalClose();

  // Donor dropdown loads from the lightweight id+name endpoint; campaigns stay
  // client-side (an org has few of them). The donations list itself is fetched
  // one page at a time with server-side search/filter/pagination.
  [donorOptions, allCampaigns] = await Promise.all([getDonorOptions(), getCampaigns()]);

  populateDonorSelect();
  populateCampaignSelect();
  await Promise.all([loadPage(1), updateStats()]);
  renderCharts();

  document.getElementById('openAddDonation')?.addEventListener('click', () => {
    document.getElementById('donationForm').reset();
    document.getElementById('donationDate').value = new Date().toISOString().slice(0, 10);
    hideFormError('donationForm');
    openModal('donationModal');
  });
  document.getElementById('donationForm')?.addEventListener('submit', saveDonation);
  document.getElementById('donationEditForm')?.addEventListener('submit', saveDonationEdit);
  document.getElementById('exportDonations')?.addEventListener('click', exportDonations);
  document.getElementById('filterStatus')?.addEventListener('change', () => loadPage(1));
  document.getElementById('donationSearch')?.addEventListener('input', debounce(() => loadPage(1), 300));
  document.getElementById('donationPrevPage')?.addEventListener('click', () => loadPage(page - 1));
  document.getElementById('donationNextPage')?.addEventListener('click', () => loadPage(page + 1));
}

// The paginated list rows carry donor + campaign names from the API join, so
// these read straight off the row rather than looking up a bulk client array.
function donorName(d) {
  return d.first_name ? `${d.first_name} ${d.last_name}` : 'Unknown';
}

function campaignName(d) {
  return d.campaign_name || 'Unknown';
}

function populateDonorSelect() {
  const sel = document.getElementById('donationDonor');
  if (!sel) return;
  sel.innerHTML = donorOptions.map((d) => `<option value="${d.donor_id}">${escapeHtml(`${d.first_name} ${d.last_name}`)}</option>`).join('');
}

function populateCampaignSelect() {
  const sel = document.getElementById('donationCampaign');
  if (!sel) return;
  sel.innerHTML = allCampaigns.map((c) => `<option value="${c.campaign_id}">${escapeHtml(c.campaign_name)}</option>`).join('');
}

async function updateStats() {
  const { revenue, average, refundRate } = await getDonationStats();
  document.getElementById('stat-revenue')?.replaceChildren(document.createTextNode(formatCurrency(revenue)));
  document.getElementById('stat-avg')?.replaceChildren(document.createTextNode(formatCurrency(average)));
  document.getElementById('stat-refund')?.replaceChildren(document.createTextNode(refundRate + '%'));
}

function getFilters() {
  return {
    search: document.getElementById('donationSearch')?.value.trim() || '',
    status: document.getElementById('filterStatus')?.value || '',
  };
}

async function loadPage(p) {
  if (loading) return;
  loading = true;
  page = Math.max(1, p);
  showLoading();

  const { search, status } = getFilters();
  let result = await getDonations({ page, limit: PAGE_SIZE, search, status });

  const totalPages = Math.max(1, Math.ceil((result.total || 0) / PAGE_SIZE));
  if (page > totalPages) {
    page = totalPages;
    result = await getDonations({ page, limit: PAGE_SIZE, search, status });
  }

  currentDonations = result.donations;
  totalDonations = result.total;
  page = result.page;
  loading = false;
  renderTable();
}

function showLoading() {
  const tbody = document.getElementById('donations-table-body');
  if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-10 text-center text-slate-400">Loading donations…</td></tr>';
  document.getElementById('donationShowingInfo')?.replaceChildren(document.createTextNode('Loading…'));
}

function renderTable() {
  const tbody = document.getElementById('donations-table-body');
  if (!tbody) return;

  const q = document.getElementById('donationSearch')?.value.trim() || '';
  const statusFilter = document.getElementById('filterStatus')?.value || 'all';

  tbody.innerHTML = currentDonations.length ? currentDonations.map((d) => {
    const methodIcon = METHOD_ICONS[d.payment_method] || 'fa-solid fa-building-columns text-indigo-600';
    return `<tr class="table-row">
      <td class="px-6 py-4"><p class="font-semibold">#${d.donation_id}</p><p class="text-slate-400 text-sm">${escapeHtml(campaignName(d))}</p></td>
      <td class="py-4">${escapeHtml(donorName(d))}</td>
      <td class="py-4">${formatDate(d.donation_date)}</td>
      <td class="py-4 font-semibold">${formatCurrency(d.amount)}</td>
      <td class="py-4"><span class="inline-flex items-center gap-2 text-slate-600"><i class="${methodIcon}"></i> ${d.payment_method}</span></td>
      <td class="py-4"><span class="badge ${statusBadgeClass(d.payment_status)}">${d.payment_status}</span></td>
      <td class="py-4 pr-6"><div class="flex gap-2"><button type="button" class="btn-primary-outline btn-sm" data-edit-donation="${d.donation_id}">Edit</button><button type="button" class="btn-primary-outline btn-sm" data-receipt="${d.donation_id}">Receipt</button></div></td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" class="empty-state px-6 py-10 text-center text-slate-500">${q || statusFilter !== 'all' ? 'No donations match your search.' : 'No donations found.'}</td></tr>`;

  const totalPages = Math.max(1, Math.ceil(totalDonations / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  document.getElementById('donationShowingInfo')?.replaceChildren(document.createTextNode(
    `Showing ${totalDonations ? start + 1 : 0}–${Math.min(start + PAGE_SIZE, totalDonations)} of ${totalDonations} · Page ${page} of ${totalPages}`));
  document.getElementById('donationPrevPage')?.toggleAttribute('disabled', page <= 1);
  document.getElementById('donationNextPage')?.toggleAttribute('disabled', page >= totalPages);

  tbody.querySelectorAll('[data-receipt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const d = currentDonations.find((x) => String(x.donation_id) === btn.dataset.receipt);
      if (d) alert(`Receipt #${d.donation_id}\nAmount: ${formatCurrency(d.amount)}\nDate: ${formatDate(d.donation_date)}\nCampaign: ${campaignName(d)}`);
    });
  });
  tbody.querySelectorAll('[data-edit-donation]').forEach((btn) => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.editDonation));
  });
}

function openEditModal(id) {
  const d = currentDonations.find((x) => String(x.donation_id) === String(id));
  if (!d) return;
  hideFormError('donationEditForm');
  document.getElementById('editDonationId').value = d.donation_id;
  document.getElementById('editDonationContext').textContent =
    `#${d.donation_id} · ${donorName(d)} → ${campaignName(d)} · ${formatDate(d.donation_date)}`;
  document.getElementById('editDonationAmount').value = d.amount;
  document.getElementById('editDonationMethod').value = d.payment_method;
  document.getElementById('editDonationStatus').value = d.payment_status;
  openModal('donationEditModal');
}

// Status changes recompute donor totals and campaign amount_raised
// server-side (Donation::update runs both inside a transaction), so a
// Pending gift marked Succeeded is immediately reflected everywhere.
async function saveDonationEdit(e) {
  e.preventDefault();
  hideFormError('donationEditForm');
  const id = document.getElementById('editDonationId').value;
  const amount = Number(document.getElementById('editDonationAmount').value);
  if (!(amount > 0)) {
    showFormError('donationEditForm', 'Amount must be greater than 0.');
    return;
  }
  try {
    await updateDonation(id, {
      amount,
      payment_method: document.getElementById('editDonationMethod').value,
      payment_status: document.getElementById('editDonationStatus').value,
    });
    closeModal('donationEditModal');
    await Promise.all([loadPage(page), updateStats()]);
    renderCharts();
  } catch (err) {
    showFormError('donationEditForm', err.message || 'Could not update donation.');
  }
}

// Bank Transfer and Check intentionally fall through to the bank-building
// default icon, matching the pre-Cash/GCash rendering.
const METHOD_ICONS = {
  Cash: 'fa-solid fa-money-bill-wave text-emerald-600',
  GCash: 'fa-solid fa-mobile-screen-button text-blue-600',
  Card: 'fa-solid fa-credit-card text-sky-600',
  PayPal: 'fa-brands fa-cc-paypal text-slate-700',
};

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
  hideFormError('donationForm');
  try {
    await addDonation({
      donor_id: document.getElementById('donationDonor').value,
      campaign_id: document.getElementById('donationCampaign').value,
      amount: Number(document.getElementById('donationAmount').value),
      donation_date: document.getElementById('donationDate').value,
      payment_method: document.getElementById('donationMethod').value,
      payment_status: document.getElementById('donationStatus').value,
    });
    closeModal('donationModal');
    await Promise.all([loadPage(1), updateStats()]);
    renderCharts();
  } catch (err) {
    showFormError('donationForm', err.message || 'Could not save donation.');
  }
}

// Exports the current page of the filtered feed. The list is now server-side
// paginated, so this reflects exactly what's on screen; the button is labeled
// accordingly in the view.
function exportDonations() {
  exportCsv('donations.csv', currentDonations, [
    { label: 'ID', value: (d) => d.donation_id },
    { label: 'Donor', value: (d) => donorName(d) },
    { label: 'Campaign', value: (d) => campaignName(d) },
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
