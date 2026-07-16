import { initials, openModal, closeModal } from './utils.js';

const NAV_ITEMS = [
  { href: 'dashboard.php', icon: 'fa-chart-line', label: 'Dashboard' },
  { href: 'donors.php', icon: 'fa-user-group', label: 'Donors' },
  { href: 'campaigns.php', icon: 'fa-bullhorn', label: 'Campaigns', roles: ['Admin'] },
  { href: 'donations.php', icon: 'fa-hand-holding-dollar', label: 'Donations' },
  { href: 'communications.php', icon: 'fa-comments', label: 'Communications' },
  { href: 'staff.php', icon: 'fa-users-gear', label: 'Staff', roles: ['Admin'] },
  { href: 'reports.php', icon: 'fa-chart-pie', label: 'Reports', roles: ['Admin'] },
];

function currentPage() {
  const page = document.body.dataset.page || location.pathname.split('/').pop() || 'dashboard.php';
  // Handle /index.php and /dashboard.php
  if (page === 'index.php') return 'dashboard.php';
  return page;
}

function navLink(item, active) {
  const cls = active
    ? 'nav-link group rounded-3xl px-4 py-3 bg-sky-50 shadow-sm border border-sky-100 text-sky-600'
    : 'nav-link group rounded-3xl px-4 py-3 text-slate-600 hover:bg-slate-100';
  return `<a href="${item.href}" class="${cls}" ${active ? 'aria-current="page"' : ''}>
    <i class="fa-solid ${item.icon} mr-3"></i> ${item.label}
  </a>`;
}

// Sidebar links are filtered by role here, but this is UX only - every
// page/API this points to independently enforces its own access control
// server-side (requireRole()/requireApiRole()), so this filtering can
// never be the only thing standing between a role and a restricted page.
export function renderSidebar(role) {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  const page = currentPage();
  const items = NAV_ITEMS.filter((item) => !item.roles || !role || item.roles.includes(role));
  nav.innerHTML = items.map((item) => navLink(item, item.href === page)).join('');

  const btn = document.getElementById('mobileMenuBtn');
  const overlay = document.getElementById('sidebarOverlay');
  const closeBtn = document.getElementById('sidebarCloseBtn');

  function openSidebar() {
    document.body.classList.add('sidebar-open');
    overlay?.setAttribute('aria-hidden', 'false');
  }
  function closeSidebar() {
    document.body.classList.remove('sidebar-open');
    overlay?.setAttribute('aria-hidden', 'true');
  }

  btn?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);
  nav.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 900) closeSidebar();
    });
  });
}

export function renderTopBar(options = {}) {
  const root = document.getElementById('topbar-root');
  if (!root) return;

  const { showSearch = true } = options;
  root.innerHTML = `
    <div class="topbar-actions flex flex-wrap items-center gap-3 justify-end">
      ${showSearch ? `
      <div class="search-box flex items-center gap-3 rounded-3xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
        <i class="fa-solid fa-magnifying-glass text-slate-400"></i>
        <input type="search" id="globalSearch" placeholder="Search donors, campaigns..." class="border-0 bg-transparent outline-none text-sm text-slate-700 w-48 md:w-64" />
      </div>` : ''}
      <div class="relative">
        <button type="button" id="notificationButton" class="icon-button" aria-label="Notifications" aria-expanded="false"><i class="fa-regular fa-bell"></i></button>
        <div id="notificationMenu" class="notification-menu" hidden><p class="font-semibold px-4 py-3 border-b">Notifications</p><p class="px-4 py-3 text-sm text-slate-500">No new notifications</p></div>
      </div>
      <div class="relative profile-pill-wrap">
        <button type="button" id="profileButton" class="profile-pill inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm border border-slate-200" aria-haspopup="true" aria-expanded="false">
          <div class="avatar h-9 w-9 text-sm" id="profileAvatar"></div>
          <span class="text-sm font-medium" id="profileName">…</span>
          <i class="fa-solid fa-chevron-down text-slate-400"></i>
        </button>
        <div id="profileMenu" class="profile-menu" role="menu">
          <div class="profile-menu-header">
            <p class="profile-menu-name" id="profileMenuName">…</p>
            <p class="profile-menu-role" id="profileMenuRole">&nbsp;</p>
          </div>
          <button type="button" id="changePasswordItem" class="profile-menu-item" role="menuitem"><i class="fa-solid fa-key"></i> Change password</button>
          <a href="logout.php" class="profile-menu-logout" role="menuitem"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</a>
        </div>
      </div>
    </div>`;

 document.getElementById('globalSearch')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const q = e.target.value.trim();
    if (q) {
      location.href = `donors.php?q=${encodeURIComponent(q)}`;
    }
  }
});
  document.getElementById('notificationButton')?.addEventListener('click', (e) => {
    const menu = document.getElementById('notificationMenu');
    const open = menu.hasAttribute('hidden');
    closeProfileMenu();
    menu.toggleAttribute('hidden', !open);
    e.currentTarget.setAttribute('aria-expanded', String(open));
  });

  document.getElementById('profileButton')?.addEventListener('click', (e) => {
    const open = !document.getElementById('profileMenu')?.classList.contains('open');
    document.getElementById('notificationMenu')?.setAttribute('hidden', '');
    document.getElementById('notificationButton')?.setAttribute('aria-expanded', 'false');
    toggleProfileMenu(open);
    e.stopPropagation();
  });

  document.getElementById('changePasswordItem')?.addEventListener('click', openChangePasswordModal);

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-pill-wrap')) closeProfileMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProfileMenu();
  });
}

// The change-password modal is injected from here (not the PHP views)
// because the profile menu exists on every page - this keeps the feature
// available everywhere without touching each view. Close handlers are
// bound directly since page scripts run bindModalClose() before this
// modal exists in the DOM.
function ensureChangePasswordModal() {
  if (document.getElementById('changePasswordModal')) return;

  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div id="changePasswordModal" class="modal">
      <div class="modal-backdrop" data-close-modal="changePasswordModal"></div>
      <div class="modal-panel" role="dialog">
        <h3 class="text-xl font-semibold mb-5">Change password</h3>
        <form id="changePasswordForm">
          <div class="form-field"><label for="currentPassword">Current password</label><input id="currentPassword" type="password" class="input-glass" autocomplete="current-password" required /></div>
          <div class="form-field"><label for="newPassword">New password</label><input id="newPassword" type="password" class="input-glass" minlength="8" autocomplete="new-password" required /></div>
          <div class="form-field"><label for="confirmNewPassword">Confirm new password</label><input id="confirmNewPassword" type="password" class="input-glass" minlength="8" autocomplete="new-password" required /></div>
          <p id="changePasswordMessage" class="text-sm mb-2" hidden></p>
          <div class="flex gap-3 mt-6">
            <button type="submit" class="btn-primary flex-1 py-3 rounded-2xl">Update password</button>
            <button type="button" data-close-modal="changePasswordModal" class="btn-secondary flex-1 py-3 rounded-2xl">Cancel</button>
          </div>
        </form>
      </div>
    </div>`;
  document.body.append(wrap.firstElementChild);

  document.querySelectorAll('#changePasswordModal [data-close-modal]').forEach((el) => {
    el.addEventListener('click', () => closeModal('changePasswordModal'));
  });
  document.getElementById('changePasswordForm').addEventListener('submit', submitChangePassword);
}

function setChangePasswordMessage(text, isSuccess = false) {
  const el = document.getElementById('changePasswordMessage');
  if (!el) return;
  el.hidden = !text;
  el.textContent = text || '';
  el.classList.toggle('text-emerald-600', isSuccess);
  el.classList.toggle('text-rose-600', !isSuccess);
}

function openChangePasswordModal() {
  ensureChangePasswordModal();
  document.getElementById('changePasswordForm').reset();
  setChangePasswordMessage(null);
  closeProfileMenu();
  openModal('changePasswordModal');
}

async function submitChangePassword(e) {
  e.preventDefault();
  const current = document.getElementById('currentPassword').value;
  const next = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmNewPassword').value;

  if (next !== confirm) {
    setChangePasswordMessage('New password and confirmation do not match.');
    return;
  }
  if (next.length < 8) {
    setChangePasswordMessage('New password must be at least 8 characters.');
    return;
  }

  try {
    const res = await fetch('api/account.php?action=change-password', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: current, new_password: next, confirm_password: confirm }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not change password');

    setChangePasswordMessage('Password updated successfully.', true);
    setTimeout(() => closeModal('changePasswordModal'), 1200);
  } catch (err) {
    setChangePasswordMessage(err.message || 'Could not change password.');
  }
}

function toggleProfileMenu(open) {
  document.getElementById('profileMenu')?.classList.toggle('open', open);
  document.getElementById('profileButton')?.setAttribute('aria-expanded', String(open));
}

function closeProfileMenu() {
  toggleProfileMenu(false);
}

// Fetches the logged-in user (name/role) from the PHP session via the same
// endpoint store.js uses elsewhere. Kept self-contained here so layout.js
// works correctly even on pages (like dashboard.js) that don't call
// store.js's initStore().
async function fetchCurrentUser() {
  try {
    const res = await fetch('api/check-session.php');
    if (!res.ok) return null;
    const data = await res.json();
    return data.authenticated ? data.user : null;
  } catch (error) {
    console.error('Error loading current user:', error);
    return null;
  }
}

function renderProfile(user) {
  if (!user) return;
  const name = `${user.first_name} ${user.last_name}`.trim();
  document.getElementById('profileAvatar')?.replaceChildren(document.createTextNode(initials(name)));
  document.getElementById('profileName')?.replaceChildren(document.createTextNode(name));
  document.getElementById('profileMenuName')?.replaceChildren(document.createTextNode(name));
  document.getElementById('profileMenuRole')?.replaceChildren(document.createTextNode(user.role || ''));
}

/**
 * Initializes the sidebar and topbar, and returns the current user (with
 * role) so page scripts can make their own role-based decisions - e.g.
 * hiding a Delete button that only Admins are allowed to use. This is a
 * UX convenience only; the real enforcement is server-side.
 */
export async function initLayout(options = {}) {
  const user = await fetchCurrentUser();
  renderSidebar(user?.role);
  if (document.getElementById('topbar-root')) {
    renderTopBar(options);
    renderProfile(user);
  }
  return user;
}
