import { initStore, getDonors, addDonor, updateDonor, deleteDonor } from '../store.js';
import { formatCurrency, formatDate, initials, avatarClass, levelBadgeClass, statusBadgeClass, exportCsv, openModal, closeModal, bindModalClose } from '../utils.js';
import { initLayout } from '../layout.js';

const PAGE_SIZE = 10;
let allDonors = [];
let filtered = [];
let page = 1;
let isAdmin = false;

async function init() {
  await initStore();
  const user = await initLayout({ showSearch: false });
  isAdmin = user?.role === 'Admin';
  bindModalClose();

  const params = new URLSearchParams(location.search);
  const q = params.get('q') || '';
  if (q) document.getElementById('donorSearch').value = q;

  document.getElementById('donorSearch')?.addEventListener('input', applyFilters);
  document.getElementById('filterLevel')?.addEventListener('change', applyFilters);
  document.getElementById('filterStatus')?.addEventListener('change', applyFilters);
  document.getElementById('resetFilters')?.addEventListener('click', resetFilters);
  document.getElementById('applyFilters')?.addEventListener('click', applyFilters);
  document.getElementById('openAddDonor')?.addEventListener('click', () => openAddModal());
  document.getElementById('exportCsv')?.addEventListener('click', exportDonors);
  document.getElementById('prevPage')?.addEventListener('click', () => { page--; render(); });
  document.getElementById('nextPage')?.addEventListener('click', () => { page++; render(); });

  document.getElementById('donorForm')?.addEventListener('submit', saveDonor);

  allDonors = await getDonors();
  applyFilters();
  renderSummary();
}

function fullName(d) {
  return `${d.first_name} ${d.last_name}`;
}

function getFilters() {
  return {
    q: document.getElementById('donorSearch')?.value.trim().toLowerCase() || '',
    level: document.getElementById('filterLevel')?.value || '',
    status: document.getElementById('filterStatus')?.value || '',
  };
}

function applyFilters() {
  const { q, level, status } = getFilters();
  filtered = allDonors.filter((d) => {
    const matchQ = !q || [fullName(d), d.email, d.phone, d.notes].some((f) => (f || '').toLowerCase().includes(q));
    const matchLevel = !level || level === 'all' || d.donor_rank === level;
    const matchStatus = !status || status === 'all' || d.status === status;
    return matchQ && matchLevel && matchStatus;
  });
  page = 1;
  render();
}

function resetFilters() {
  document.getElementById('donorSearch').value = '';
  document.getElementById('filterLevel').value = 'all';
  document.getElementById('filterStatus').value = 'all';
  applyFilters();
}

function renderSummary() {
  const silver = allDonors.filter((d) => d.donor_rank === 'Silver').length;
  const gold = allDonors.filter((d) => d.donor_rank === 'Gold').length;
  const lifetime = allDonors.reduce((s, d) => s + Number(d.total_donated), 0);
  document.getElementById('summary-silver')?.replaceChildren(document.createTextNode(String(silver)));
  document.getElementById('summary-gold')?.replaceChildren(document.createTextNode(String(gold)));
  document.getElementById('summary-lifetime')?.replaceChildren(document.createTextNode(formatCurrency(lifetime)));
}

function render() {
  const tbody = document.getElementById('donors-table-body');
  if (!tbody) return;

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  page = Math.min(Math.max(1, page), totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);

  tbody.innerHTML = slice.length ? slice.map((d, i) => `
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
          ${isAdmin ? `<button type="button" class="btn-danger-outline btn-sm" data-delete="${d.donor_id}">Delete</button>` : ''}
        </div>
      </td>
    </tr>`).join('') : `<tr><td colspan="8" class="empty-state px-6 py-10 text-center text-slate-500">No donors match your filters.</td></tr>`;

  document.getElementById('pageInfo')?.replaceChildren(document.createTextNode(`Page ${page} of ${totalPages}`));
  document.getElementById('showingInfo')?.replaceChildren(document.createTextNode(`Showing ${total ? start + 1 : 0}–${Math.min(start + PAGE_SIZE, total)} of ${total}`));

  tbody.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openEditModal(btn.dataset.edit)));
  tbody.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', async () => {
    if (!confirm('Delete this donor?')) return;
    try {
      await deleteDonor(btn.dataset.delete);
      allDonors = await getDonors();
      applyFilters();
      renderSummary();
    } catch (err) {
      alert(err.message || 'Could not delete donor.');
    }
  }));
}

function openAddModal() {
  document.getElementById('donorModalTitle').textContent = 'Add donor';
  document.getElementById('donorForm').reset();
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
  const d = allDonors.find((x) => String(x.donor_id) === String(id));
  if (!d) return;
  document.getElementById('donorModalTitle').textContent = 'Edit donor';
  document.getElementById('donorId').value = d.donor_id;
  document.getElementById('donorName').value = fullName(d);
  document.getElementById('donorEmail').value = d.email || '';
  document.getElementById('donorPhone').value = d.phone || '';
  document.getElementById('donorRole').value = d.notes || '';
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
  const id = document.getElementById('donorId').value;
  const [firstName, ...rest] = document.getElementById('donorName').value.trim().split(/\s+/);
  const data = {
    first_name: firstName || '',
    last_name: rest.join(' ') || firstName || '',
    email: document.getElementById('donorEmail').value.trim(),
    phone: document.getElementById('donorPhone').value.trim(),
    notes: document.getElementById('donorRole').value.trim(),
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
    allDonors = await getDonors();
    applyFilters();
    renderSummary();
  } catch (err) {
    alert(err.message || 'Could not save donor.');
  }
}

function exportDonors() {
  exportCsv('donors.csv', filtered.length ? filtered : allDonors, [
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
