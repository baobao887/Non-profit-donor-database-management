import { initStore, getStaff, addStaff, updateStaff, deleteStaff } from '../store.js';
import { initials, avatarClass, openModal, closeModal, bindModalClose } from '../utils.js';
import { initLayout } from '../layout.js';

let allStaff = [];

async function init() {
  await initStore();
  initLayout({ showSearch: false });
  bindModalClose();

  allStaff = await getStaff();
  render();

  document.getElementById('openStaffModal').onclick = () => edit();
  document.getElementById('staffForm').onsubmit = save;
}

function render() {
  document.getElementById('staffGrid').innerHTML = allStaff.length ? allStaff.map((s, i) => {
    const name = `${s.first_name} ${s.last_name}`;
    return `<article class="card-glass p-6 shadow-xl rounded-[28px]">
      <div class="flex items-center justify-between">
        <div class="avatar ${avatarClass(i)}">${initials(name)}</div>
        <span class="badge bg-sky-100 text-sky-700">${s.role}</span>
      </div>
      <h2 class="text-xl font-semibold mt-5">${escapeHtml(name)}</h2>
      <p class="text-slate-500 mt-1">${escapeHtml(s.email)}</p>
      <div class="flex gap-2 mt-5">
        <button class="btn-primary-outline btn-sm" data-edit="${s.user_id}">Edit</button>
        <button class="btn-danger-outline btn-sm" data-remove="${s.user_id}">Remove</button>
      </div>
    </article>`;
  }).join('') : '<p class="text-slate-500">No staff members yet.</p>';

  document.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => edit(b.dataset.edit));
  document.querySelectorAll('[data-remove]').forEach((b) => b.onclick = async () => {
    if (!confirm('Remove this staff member?')) return;
    try {
      await deleteStaff(b.dataset.remove);
      allStaff = await getStaff();
      render();
    } catch (err) {
      alert(err.message || 'Could not remove staff member.');
    }
  });
}

function edit(id) {
  const s = allStaff.find((x) => String(x.user_id) === String(id)) || {};
  const byId = (x) => document.getElementById(x);
  byId('staffTitle').textContent = id ? 'Edit staff member' : 'Add staff member';
  byId('staffId').value = s.user_id || '';
  byId('staffName').value = s.user_id ? `${s.first_name} ${s.last_name}` : '';
  byId('staffEmail').value = s.email || '';
  byId('staffRole').value = s.role || '';
  openModal('staffModal');
}

async function save(e) {
  e.preventDefault();
  const byId = (x) => document.getElementById(x);
  const data = {
    name: byId('staffName').value.trim(),
    email: byId('staffEmail').value.trim(),
    role: byId('staffRole').value.trim(),
  };
  try {
    if (byId('staffId').value) await updateStaff(byId('staffId').value, data);
    else await addStaff(data);
    closeModal('staffModal');
    allStaff = await getStaff();
    render();
  } catch (err) {
    alert(err.message || 'Could not save staff member.');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

init();
