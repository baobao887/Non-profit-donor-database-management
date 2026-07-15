import { initStore, getCommunications, getDonors, addCommunication } from '../store.js';
import { formatDate, formatRelativeTime, initials, avatarClass, statusBadgeClass, openModal, closeModal, bindModalClose } from '../utils.js';
import { initLayout } from '../layout.js';

async function init() {
  await initStore();
  initLayout({ showSearch: false });
  bindModalClose();

  const donors = await getDonors();
  populateDonorSelect(donors);
  await renderTimeline();

  document.getElementById('openAddNote')?.addEventListener('click', () => {
    document.getElementById('commForm').reset();
    openModal('commModal');
  });
  document.getElementById('commForm')?.addEventListener('submit', saveNote);
}

function populateDonorSelect(donors) {
  const sel = document.getElementById('commDonor');
  if (!sel) return;
  sel.innerHTML = donors.map((d) => `<option value="${d.donor_id}">${escapeHtml(`${d.first_name} ${d.last_name}`)}</option>`).join('');
}

async function renderTimeline() {
  const container = document.getElementById('communications-list');
  if (!container) return;

  const items = await getCommunications();

  container.innerHTML = items.length ? items.map((c, i) => {
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
          <span class="badge ${statusBadgeClass(c.status)}">${c.status}</span>
        </div>
        <p class="text-slate-600">${escapeHtml(c.content)}</p>
      </article>`;
  }).join('') : `<div class="empty-state card-glass p-10 text-center text-slate-500 rounded-[28px]">No communications yet. Add your first note.</div>`;
}

async function saveNote(e) {
  e.preventDefault();
  try {
    await addCommunication({
      type: document.getElementById('commType').value,
      donor_id: document.getElementById('commDonor').value,
      content: document.getElementById('commContent').value.trim(),
    });
    closeModal('commModal');
    await renderTimeline();
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
