import { initStore, getStaff, addStaff, updateStaff, deleteStaff } from '../store.js';
import { initials, avatarClass, statusBadgeClass, openModal, closeModal, bindModalClose, showFormError, hideFormError } from '../utils.js';
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
  document.getElementById('copyTempPassword').onclick = copyTempPassword;
}

async function copyTempPassword(e) {
  const pw = document.getElementById('tempPasswordValue').textContent;
  try {
    await navigator.clipboard.writeText(pw);
    e.target.textContent = 'Copied!';
    setTimeout(() => { e.target.textContent = 'Copy'; }, 1500);
  } catch {
    // Clipboard API unavailable - the password stays selectable in the box.
  }
}

function showTempPassword(email, password) {
  document.getElementById('tempPasswordEmail').textContent = email;
  document.getElementById('tempPasswordValue').textContent = password;
  openModal('tempPasswordModal');
}

function render() {
  document.getElementById('staffGrid').innerHTML = allStaff.length ? allStaff.map((s, i) => {
    const name = `${s.first_name} ${s.last_name}`;
    return `<article class="card-glass p-6 shadow-xl rounded-[28px]">
      <div class="flex items-center justify-between">
        <div class="avatar ${avatarClass(i)}">${initials(name)}</div>
        <div class="flex items-center gap-2">
          <span class="badge ${statusBadgeClass(s.status)}">${s.status}</span>
          <span class="badge bg-sky-100 text-sky-700">${s.role}</span>
        </div>
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
  byId('staffFirstName').value = s.first_name || '';
  byId('staffLastName').value = s.last_name || '';
  byId('staffEmail').value = s.email || '';
  // Existing staff keep their stored role; new members default to Staff (the
  // dropdown's first option) so the select never renders blank.
  byId('staffRole').value = s.role || 'Staff';
  // Status is edit-only: User::create() always inserts Active, so there is no
  // real choice to offer on the add form.
  byId('staffStatus').value = s.status || 'Active';
  byId('staffStatusField').hidden = !id;
  byId('staffStatusHint').hidden = !!id;
  hideFormError('staffForm');
  openModal('staffModal');
}

async function save(e) {
  e.preventDefault();
  hideFormError('staffForm');
  const byId = (x) => document.getElementById(x);
  const data = {
    first_name: byId('staffFirstName').value.trim(),
    last_name: byId('staffLastName').value.trim(),
    email: byId('staffEmail').value.trim(),
    // A <select> can only yield one of its predefined option values, so
    // there's no stray whitespace to trim.
    role: byId('staffRole').value,
  };
  try {
    let tempPassword = null;
    if (byId('staffId').value) {
      data.status = byId('staffStatus').value;
      await updateStaff(byId('staffId').value, data);
    } else {
      const created = await addStaff(data);
      tempPassword = created.temp_password;
    }
    closeModal('staffModal');
    allStaff = await getStaff();
    render();
    if (tempPassword) showTempPassword(data.email, tempPassword);
  } catch (err) {
    showFormError('staffForm', err.message || 'Could not save staff member.');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

init();
