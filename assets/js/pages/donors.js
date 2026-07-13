import { initStore, getDonors, addDonor, updateDonor, deleteDonor } from '../store.js';
import { formatCurrency, formatDate, initials, avatarClass, levelBadgeClass, statusBadgeClass, exportCsv, openModal, closeModal, bindModalClose } from '../utils.js';
import { initLayout } from '../layout.js';

const PAGE_SIZE = 10;
let filtered = [];
let page = 1;

async function init() {
  await initStore();
  initLayout({ showSearch: false, showTheme: true });
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
  applyFilters();
  renderSummary();
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
  filtered = getDonors().filter((d) => {
    const matchQ = !q || [d.name, d.email, d.phone, d.role].some((f) => f.toLowerCase().includes(q));
    const matchLevel = !level || level === 'all' || d.level === level;
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
  const donors = getDonors();
  const silver = donors.filter((d) => d.level === 'Silver').length;
  const gold = donors.filter((d) => d.level === 'Gold').length;
  const lifetime = donors.reduce((s, d) => s + d.lifetime, 0);
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
          <div class="avatar ${avatarClass(i)}">${initials(d.name)}</div>
          <div><p class="font-semibold">${d.name}</p><p class="text-slate-400 text-sm">${d.role}</p></div>
        </div>
      </td>
      <td class="py-4">${d.email}</td>
      <td class="py-4">${d.phone}</td>
      <td class="py-4"><span class="badge ${levelBadgeClass(d.level)}">${d.level}</span></td>
      <td class="py-4 font-semibold">${formatCurrency(d.lifetime)}</td>
      <td class="py-4">${formatDate(d.lastDonation)}</td>
      <td class="py-4"><span class="badge ${statusBadgeClass(d.status)}">${d.status}</span></td>
      <td class="py-4 pr-6">
        <div class="flex gap-2">
          <a class="btn-primary-outline btn-sm" href="donor-profile.html?id=${d.id}">View</a>
          <button type="button" class="btn-primary-outline btn-sm" data-edit="${d.id}">Edit</button>
          <button type="button" class="btn-danger-outline btn-sm" data-delete="${d.id}">Delete</button>
        </div>
      </td>
    </tr>`).join('') : `<tr><td colspan="8" class="empty-state px-6 py-10 text-center text-slate-500">No donors match your filters.</td></tr>`;

  document.getElementById('pageInfo')?.replaceChildren(document.createTextNode(`Page ${page} of ${totalPages}`));
  document.getElementById('showingInfo')?.replaceChildren(document.createTextNode(`Showing ${total ? start + 1 : 0}–${Math.min(start + PAGE_SIZE, total)} of ${total}`));

  tbody.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openEditModal(btn.dataset.edit)));
  tbody.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => {
    if (confirm('Delete this donor?')) { deleteDonor(btn.dataset.delete); applyFilters(); renderSummary(); }
  }));
}

function openAddModal() {
  document.getElementById('donorModalTitle').textContent = 'Add donor';
  document.getElementById('donorForm').reset();
  document.getElementById('donorId').value = '';
  openModal('donorModal');
}

function openEditModal(id) {
  const d = getDonors().find((x) => x.id === id);
  if (!d) return;
  document.getElementById('donorModalTitle').textContent = 'Edit donor';
  document.getElementById('donorId').value = d.id;
  document.getElementById('donorName').value = d.name;
  document.getElementById('donorEmail').value = d.email;
  document.getElementById('donorPhone').value = d.phone;
  document.getElementById('donorLevel').value = d.level;
  document.getElementById('donorRole').value = d.role;
  document.getElementById('donorStatus').value = d.status;
  openModal('donorModal');
}

function saveDonor(e) {
  e.preventDefault();
  const id = document.getElementById('donorId').value;
  const data = {
    name: document.getElementById('donorName').value.trim(),
    email: document.getElementById('donorEmail').value.trim(),
    phone: document.getElementById('donorPhone').value.trim(),
    level: document.getElementById('donorLevel').value,
    role: document.getElementById('donorRole').value.trim(),
    status: document.getElementById('donorStatus').value,
  };
  if (id) updateDonor(id, data);
  else addDonor(data);
  closeModal('donorModal');
  applyFilters();
  renderSummary();
}

function exportDonors() {
  exportCsv('donors.csv', filtered.length ? filtered : getDonors(), [
    { label: 'Name', value: (d) => d.name },
    { label: 'Email', value: (d) => d.email },
    { label: 'Phone', value: (d) => d.phone },
    { label: 'Level', value: (d) => d.level },
    { label: 'Lifetime', value: (d) => d.lifetime },
    { label: 'Status', value: (d) => d.status },
  ]);
}

init();
