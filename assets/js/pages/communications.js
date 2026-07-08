import { initStore, getCommunications, getDonors, addCommunication } from '../store.js';
import { formatDate, formatRelativeTime, initials, avatarClass, statusBadgeClass, openModal, closeModal, bindModalClose } from '../utils.js';
import { initLayout } from '../layout.js';

async function init() {
  await initStore();
  initLayout({ showSearch: false, showTheme: true });
  bindModalClose();

  populateDonorSelect();
  renderTimeline();

  document.getElementById('openAddNote')?.addEventListener('click', () => {
    document.getElementById('commForm').reset();
    openModal('commModal');
  });
  document.getElementById('commForm')?.addEventListener('submit', saveNote);
}

function populateDonorSelect() {
  const sel = document.getElementById('commDonor');
  if (!sel) return;
  sel.innerHTML = getDonors().map((d) => `<option value="${d.id}">${d.name}</option>`).join('');
}

function renderTimeline() {
  const container = document.getElementById('communications-list');
  if (!container) return;

  const donors = getDonors();
  const items = getCommunications();

  container.innerHTML = items.length ? items.map((c, i) => {
    const donor = donors.find((d) => d.id === c.donorId);
    const when = c.date.includes('T') ? formatRelativeTime(c.date) : formatDate(c.date);
    return `
      <article class="timeline-item card-glass p-6 rounded-[28px] shadow-xl border border-slate-200/80">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-4">
            <div class="avatar ${avatarClass(i)}">${initials(donor?.name || c.staff)}</div>
            <div>
              <p class="font-semibold">${c.type}</p>
              <p class="text-slate-500">${donor?.name || c.staff} · ${when}</p>
            </div>
          </div>
          <span class="badge ${statusBadgeClass(c.status)}">${c.status}</span>
        </div>
        <p class="text-slate-600">${c.content}</p>
      </article>`;
  }).join('') : `<div class="empty-state card-glass p-10 text-center text-slate-500 rounded-[28px]">No communications yet. Add your first note.</div>`;
}

function saveNote(e) {
  e.preventDefault();
  addCommunication({
    type: document.getElementById('commType').value,
    donorId: document.getElementById('commDonor').value,
    staff: document.getElementById('commStaff').value.trim(),
    status: document.getElementById('commStatus').value,
    content: document.getElementById('commContent').value.trim(),
  });
  closeModal('commModal');
  renderTimeline();
}

init();
