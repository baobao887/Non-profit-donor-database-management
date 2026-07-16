import { initStore, getCommunications, getDonors, addCommunication, updateCommunication, deleteCommunication } from '../store.js';
import { formatDate, formatRelativeTime, initials, avatarClass, statusBadgeClass, openModal, closeModal, bindModalClose } from '../utils.js';
import { initLayout } from '../layout.js';

let currentPage = 1;
let currentItems = [];
let totalItems = 0;
let pageLimit = 20;

async function init() {
  await initStore();
  initLayout({ showSearch: false });
  bindModalClose();

  const donors = await getDonors();
  populateDonorSelect(donors);
  await renderTimeline(1);

  document.getElementById('openAddNote')?.addEventListener('click', () => openAddModal());
  document.getElementById('commForm')?.addEventListener('submit', saveNote);
  document.getElementById('commPrevPage')?.addEventListener('click', () => renderTimeline(currentPage - 1));
  document.getElementById('commNextPage')?.addEventListener('click', () => renderTimeline(currentPage + 1));
}

function populateDonorSelect(donors) {
  const sel = document.getElementById('commDonor');
  if (!sel) return;
  sel.innerHTML = donors.map((d) => `<option value="${d.donor_id}">${escapeHtml(`${d.first_name} ${d.last_name}`)}</option>`).join('');
}

async function renderTimeline(page) {
  const container = document.getElementById('communications-list');
  if (!container) return;

  const data = await getCommunications(Math.max(1, page));
  currentItems = data.communications;
  totalItems = data.total;
  pageLimit = data.limit;
  currentPage = data.page;

  container.innerHTML = currentItems.length ? currentItems.map((c, i) => {
    const donorName = `${c.first_name} ${c.last_name}`;
    const staffName = c.staff_first_name ? `${c.staff_first_name} ${c.staff_last_name}` : 'Unassigned';
    const when = formatRelativeTime(c.created_at) || formatDate(c.created_at);
    return `
      <article class="timeline-item card-glass p-6 rounded-[28px] shadow-xl border border-slate-200/80">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-4">
            <div class="avatar ${avatarClass(i)}">${initials(donorName)}</div>
            <div>
              <p class="font-semibold">${escapeHtml(c.type)}</p>
              <p class="text-slate-500">${escapeHtml(donorName)} · ${escapeHtml(staffName)} · ${when}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="badge ${statusBadgeClass(c.status)}">${c.status}</span>
            <button type="button" class="btn-primary-outline btn-sm" data-edit="${c.communication_id}">Edit</button>
            <button type="button" class="btn-danger-outline btn-sm" data-delete="${c.communication_id}">Delete</button>
          </div>
        </div>
        <p class="text-slate-600">${escapeHtml(c.content)}</p>
      </article>`;
  }).join('') : `<div class="empty-state card-glass p-10 text-center text-slate-500 rounded-[28px]">No communications yet. Add your first note.</div>`;

  container.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openEditModal(btn.dataset.edit)));
  container.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => removeNote(btn.dataset.delete)));

  renderPagination();
}

function renderPagination() {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageLimit));
  document.getElementById('commPageInfo')?.replaceChildren(document.createTextNode(`Page ${currentPage} of ${totalPages} · ${totalItems} total`));
  document.getElementById('commPrevPage')?.toggleAttribute('disabled', currentPage <= 1);
  document.getElementById('commNextPage')?.toggleAttribute('disabled', currentPage >= totalPages);
}

function openAddModal() {
  document.getElementById('commModalTitle').textContent = 'New communication';
  document.getElementById('commForm').reset();
  document.getElementById('commId').value = '';
  document.getElementById('commDonor').disabled = false;
  document.getElementById('commStatusField').hidden = true;
  openModal('commModal');
}

function openEditModal(id) {
  const c = currentItems.find((x) => String(x.communication_id) === String(id));
  if (!c) return;
  document.getElementById('commModalTitle').textContent = 'Edit communication';
  document.getElementById('commId').value = c.communication_id;
  document.getElementById('commType').value = c.type;
  document.getElementById('commDonor').value = c.donor_id;
  document.getElementById('commDonor').disabled = true;
  document.getElementById('commStatus').value = c.status;
  document.getElementById('commStatusField').hidden = false;
  document.getElementById('commContent').value = c.content;
  openModal('commModal');
}

async function removeNote(id) {
  if (!confirm('Delete this communication note? This cannot be undone.')) return;
  try {
    await deleteCommunication(id);
    const nextPage = currentItems.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
    await renderTimeline(nextPage);
  } catch (err) {
    alert(err.message || 'Could not delete communication.');
  }
}

async function saveNote(e) {
  e.preventDefault();
  const id = document.getElementById('commId').value;
  const content = document.getElementById('commContent').value.trim();

  try {
    if (id) {
      await updateCommunication(id, {
        type: document.getElementById('commType').value,
        content,
        status: document.getElementById('commStatus').value,
      });
    } else {
      await addCommunication({
        type: document.getElementById('commType').value,
        donor_id: document.getElementById('commDonor').value,
        content,
      });
    }
    closeModal('commModal');
    await renderTimeline(id ? currentPage : 1);
  } catch (err) {
    alert(err.message || 'Could not save communication.');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

init();
