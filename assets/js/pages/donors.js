import { initStore, getDonors, getDonorSummary, getDonorsForExport, addDonor, updateDonor, deleteDonor } from '../store.js';
import { formatCurrency, formatDate, initials, avatarClass, levelBadgeClass, statusBadgeClass, exportCsv, openModal, closeModal, bindModalClose, showFormError, hideFormError } from '../utils.js';
import { initLayout } from '../layout.js';

const PAGE_SIZE = 25;
let currentDonors = [];
let page = 1;
let totalDonors = 0;
let isAdmin = false;
let loading = false;

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

async function init() {
  await initStore();
  const user = await initLayout({ showSearch: false });
  isAdmin = user?.role === 'Admin';
  bindModalClose();

  const params = new URLSearchParams(location.search);
  const q = params.get('q') || '';
  if (q) document.getElementById('donorSearch').value = q;

  // Search box and filter dropdowns now trigger a fresh server request (true
  // server-side pagination) instead of filtering a bulk-loaded client array.
  // The search input is debounced so it doesn't fire a request per keystroke.
  document.getElementById('donorSearch')?.addEventListener('input', debounce(() => loadPage(1), 300));
  document.getElementById('filterLevel')?.addEventListener('change', () => loadPage(1));
  document.getElementById('filterStatus')?.addEventListener('change', () => loadPage(1));
  document.getElementById('resetFilters')?.addEventListener('click', resetFilters);
  document.getElementById('openAddDonor')?.addEventListener('click', () => openAddModal());
  document.getElementById('exportCsv')?.addEventListener('click', exportDonors);
  document.getElementById('prevPage')?.addEventListener('click', () => loadPage(page - 1));
  document.getElementById('nextPage')?.addEventListener('click', () => loadPage(page + 1));

  document.getElementById('donorForm')?.addEventListener('submit', saveDonor);

  await Promise.all([loadPage(1), renderSummary()]);
}

function fullName(d) {
  return `${d.first_name} ${d.last_name}`;
}

function getFilters() {
  return {
    search: document.getElementById('donorSearch')?.value.trim() || '',
    status: document.getElementById('filterStatus')?.value || '',
    rank: document.getElementById('filterLevel')?.value || '',
  };
}

async function loadPage(p) {
  if (loading) return;
  loading = true;
  page = Math.max(1, p);
  showLoading();

  const { search, status, rank } = getFilters();
  let result = await getDonors({ page, limit: PAGE_SIZE, search, status, rank });

  // If the requested page fell past the end (e.g. after archiving the last
  // row on a page), snap back to the real last page and refetch.
  const totalPages = Math.max(1, Math.ceil((result.total || 0) / PAGE_SIZE));
  if (page > totalPages) {
    page = totalPages;
    result = await getDonors({ page, limit: PAGE_SIZE, search, status, rank });
  }

  currentDonors = result.donors;
  totalDonors = result.total;
  page = result.page;
  loading = false;
  render();
}

function resetFilters() {
  document.getElementById('donorSearch').value = '';
  document.getElementById('filterLevel').value = 'all';
  document.getElementById('filterStatus').value = 'all';
  loadPage(1);
}

async function renderSummary() {
  const { silver, gold, lifetime } = await getDonorSummary();
  document.getElementById('summary-silver')?.replaceChildren(document.createTextNode(String(silver)));
  document.getElementById('summary-gold')?.replaceChildren(document.createTextNode(String(gold)));
  document.getElementById('summary-lifetime')?.replaceChildren(document.createTextNode(formatCurrency(lifetime)));
}

function showLoading() {
  const tbody = document.getElementById('donors-table-body');
  if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-10 text-center text-slate-400">Loading donors…</td></tr>';
  document.getElementById('showingInfo')?.replaceChildren(document.createTextNode('Loading…'));
}

function render() {
  const tbody = document.getElementById('donors-table-body');
  if (!tbody) return;

  const totalPages = Math.max(1, Math.ceil(totalDonors / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;

  tbody.innerHTML = currentDonors.length ? currentDonors.map((d, i) => `
    <tr class="table-row">
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="avatar ${avatarClass(i)}">${initials(fullName(d))}</div>
          <div><p class="font-semibold">${escapeHtml(fullName(d))}</p><p class="text-slate-400 text-sm">${escapeHtml(d.notes || '')}</p></div>
        </div>
      </td>
      <td class="py-4">${escapeHtml(d.email || '')}</td>
      <td class="py-4">${escapeHtml(d.phone || '')}</td>
      <td class="py-4"><span class="badge ${levelBadgeClass(d.donor_rank)}">${d.donor_rank}</span></td>
      <td class="py-4 font-semibold">${formatCurrency(d.total_donated)}</td>
      <td class="py-4">${formatDate(d.updated_at)}</td>
      <td class="py-4"><span class="badge ${statusBadgeClass(d.status)}">${d.status}</span></td>
      <td class="py-4 pr-6">
        <div class="flex gap-2">
          <a class="btn-primary-outline btn-sm" href="donor-profile.php?id=${d.donor_id}">View</a>
          <button type="button" class="btn-primary-outline btn-sm" data-edit="${d.donor_id}">Edit</button>
          ${isAdmin ? `<button type="button" class="btn-danger-outline btn-sm" data-delete="${d.donor_id}">Archive</button>` : ''}
        </div>
      </td>
    </tr>`).join('') : `<tr><td colspan="8" class="empty-state px-6 py-10 text-center text-slate-500">No donors match your filters.</td></tr>`;

  document.getElementById('pageInfo')?.replaceChildren(document.createTextNode(`Page ${page} of ${totalPages}`));
  document.getElementById('showingInfo')?.replaceChildren(document.createTextNode(`Showing ${totalDonors ? start + 1 : 0}–${Math.min(start + PAGE_SIZE, totalDonors)} of ${totalDonors}`));
  document.getElementById('prevPage')?.toggleAttribute('disabled', page <= 1);
  document.getElementById('nextPage')?.toggleAttribute('disabled', page >= totalPages);

  tbody.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openEditModal(btn.dataset.edit)));
  tbody.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', async () => {
    if (!confirm('Archive this donor? Their record and donation history will be preserved but hidden from the active directory.')) return;
    try {
      await deleteDonor(btn.dataset.delete);
      await Promise.all([loadPage(page), renderSummary()]);
    } catch (err) {
      alert(err.message || 'Could not archive donor.');
    }
  }));
}

function openAddModal() {
  document.getElementById('donorModalTitle').textContent = 'Add donor';
  document.getElementById('donorForm').reset();
  hideFormError('donorForm');
  document.getElementById('donorId').value = '';
  // No level or status control when creating - a donor with zero
  // donations is Bronze by definition, and Donor::create() always
  // inserts status Active; neither is a real choice to offer.
  document.getElementById('donorLevelField').hidden = true;
  document.getElementById('donorLevelHint').hidden = false;
  document.getElementById('donorStatusField').hidden = true;
  document.getElementById('donorStatusHint').hidden = false;
  document.getElementById('donorRegisteredField').hidden = true;
  openModal('donorModal');
}

function openEditModal(id) {
  const d = currentDonors.find((x) => String(x.donor_id) === String(id));
  if (!d) return;
  document.getElementById('donorModalTitle').textContent = 'Edit donor';
  hideFormError('donorForm');
  document.getElementById('donorId').value = d.donor_id;
  document.getElementById('donorFirstName').value = d.first_name || '';
  document.getElementById('donorLastName').value = d.last_name || '';
  document.getElementById('donorEmail').value = d.email || '';
  document.getElementById('donorPhone').value = d.phone || '';
  document.getElementById('donorRole').value = d.notes || '';
  document.getElementById('donorGender').value = d.gender || '';
  document.getElementById('donorBirthdate').value = d.birthdate || '';
  document.getElementById('donorCity').value = d.city || '';
  document.getElementById('donorProvince').value = d.province || '';
  document.getElementById('donorStatus').value = d.status;
  // Level is shown as a read-only badge - it's derived from donation
  // totals server-side and would be overwritten on the donor's next gift.
  document.getElementById('donorLevelField').hidden = false;
  document.getElementById('donorLevelHint').hidden = true;
  const badge = document.getElementById('donorLevelBadge');
  badge.className = `badge ${levelBadgeClass(d.donor_rank)}`;
  badge.textContent = d.donor_rank;
  document.getElementById('donorStatusField').hidden = false;
  document.getElementById('donorStatusHint').hidden = true;
  document.getElementById('donorRegisteredField').hidden = false;
  document.getElementById('donorRegistered').textContent = d.created_at ? formatDate(d.created_at) : '—';
  openModal('donorModal');
}

async function saveDonor(e) {
  e.preventDefault();
  hideFormError('donorForm');
  const id = document.getElementById('donorId').value;
  const data = {
    first_name: document.getElementById('donorFirstName').value.trim(),
    last_name: document.getElementById('donorLastName').value.trim(),
    email: document.getElementById('donorEmail').value.trim(),
    phone: document.getElementById('donorPhone').value.trim(),
    notes: document.getElementById('donorRole').value.trim(),
    // Optional demographic fields (aggregate analytics only) — sent on both
    // create and update; empty values are stored as NULL server-side.
    gender: document.getElementById('donorGender').value,
    birthdate: document.getElementById('donorBirthdate').value,
    city: document.getElementById('donorCity').value.trim(),
    province: document.getElementById('donorProvince').value.trim(),
  };
  try {
    if (id) {
      // Status is edit-only: Donor::create() hardcodes Active, so the
      // create payload doesn't send one.
      data.status = document.getElementById('donorStatus').value;
      await updateDonor(id, data);
    }
    else await addDonor(data);
    closeModal('donorModal');
    await Promise.all([loadPage(id ? page : 1), renderSummary()]);
  } catch (err) {
    showFormError('donorForm', err.message || 'Could not save donor.');
  }
}

// Exports the full filtered result set (every donor matching the current
// search/filters, not just the visible page) via a dedicated server endpoint.
async function exportDonors() {
  const { search, status, rank } = getFilters();
  let rows;
  try {
    rows = await getDonorsForExport({ search, status, rank });
  } catch {
    alert('Could not export donors. Please try again.');
    return;
  }
  if (!rows.length) {
    alert('No donors to export for the current filters.');
    return;
  }
  exportCsv('donors.csv', rows, [
    { label: 'Name', value: (d) => fullName(d) },
    { label: 'Email', value: (d) => d.email || '' },
    { label: 'Phone', value: (d) => d.phone || '' },
    { label: 'Level', value: (d) => d.donor_rank },
    { label: 'Lifetime (PHP)', value: (d) => formatCurrency(d.total_donated) },
    { label: 'Status', value: (d) => d.status },
  ]);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

init();
