const NAV_ITEMS = [
  { href: '/dashboard.php', icon: 'fa-chart-line', label: 'Dashboard' },
  { href: '/donors.php', icon: 'fa-user-group', label: 'Donors' },
  { href: '/campaigns.php', icon: 'fa-bullhorn', label: 'Campaigns' },
  { href: '/donations.php', icon: 'fa-hand-holding-dollar', label: 'Donations' },
  { href: '/communications.php', icon: 'fa-comments', label: 'Communications' },
  { href: '/staff.php', icon: 'fa-users-gear', label: 'Staff' },
  { href: '/reports.php', icon: 'fa-chart-pie', label: 'Reports' },
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

export function renderSidebar() {
  const root = document.getElementById('sidebar-root');
  if (!root) return;

  const page = currentPage();
  const links = NAV_ITEMS.map((item) => navLink(item, item.href === page)).join('');

  root.innerHTML = `
    <button type="button" id="mobileMenuBtn" class="mobile-menu-btn" aria-label="Open menu">
      <i class="fa-solid fa-bars"></i>
    </button>
    <div id="sidebarOverlay" class="sidebar-overlay" aria-hidden="true"></div>
    <aside id="sidebarPanel" class="sidebar-panel bg-white/90 shadow-2xl backdrop-blur-2xl border border-slate-200/70">
      <div class="sidebar-top flex items-center justify-between px-6 py-6">
        <div class="brand-logo flex items-center gap-3">
          <div class="w-12 h-12 rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-xl">D</div>
          <div>
            <h1 class="text-xl font-semibold tracking-tight">DonorTrack</h1>
            <p class="text-sm text-slate-500">Donor Management</p>
          </div>
        </div>
        <button type="button" id="sidebarCloseBtn" class="sidebar-close-btn" aria-label="Close menu">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <nav class="mt-2 px-4 space-y-1">${links}</nav>
    </aside>`;

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
  root.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 900) closeSidebar();
    });
  });
}

export function renderTopBar(options = {}) {
  const root = document.getElementById('topbar-root');
  if (!root) return;

  const { showSearch = true, showTheme = true } = options;
  root.innerHTML = `
    <div class="topbar-actions flex flex-wrap items-center gap-3 justify-end">
      ${showSearch ? `
      <div class="search-box flex items-center gap-3 rounded-3xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
        <i class="fa-solid fa-magnifying-glass text-slate-400"></i>
        <input type="search" id="globalSearch" placeholder="Search donors, campaigns..." class="border-0 bg-transparent outline-none text-sm text-slate-700 w-48 md:w-64" />
      </div>` : ''}
      ${showTheme ? `<button type="button" class="icon-button theme-toggle" aria-label="Toggle theme"><i class="fa-solid fa-moon"></i></button>` : ''}
      <div class="relative">
        <button type="button" id="notificationButton" class="icon-button" aria-label="Notifications" aria-expanded="false"><i class="fa-regular fa-bell"></i></button>
        <div id="notificationMenu" class="notification-menu" hidden><p class="font-semibold px-4 py-3 border-b">Notifications</p><a href="donations.html">2 pending donations need review</a><a href="campaigns.html">Summer School Drive ends soon</a></div>
      </div>
      <button type="button" class="profile-pill inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm border border-slate-200">
        <img src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=64&q=80" alt="" class="h-9 w-9 rounded-full object-cover" loading="lazy" width="36" height="36" />
        <span class="text-sm font-medium">Avery</span>
        <i class="fa-solid fa-chevron-down text-slate-400"></i>
      </button>
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
    menu.toggleAttribute('hidden', !open);
    e.currentTarget.setAttribute('aria-expanded', String(open));
  });
}

export function initTheme() {
  // Theme is stored in system preferences only, no localStorage persistence
  // Check if system prefers dark mode
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) document.body.classList.add('theme-dark');

  document.querySelectorAll('.theme-toggle').forEach((toggle) => {
    if (toggle.dataset.bound) return;
    toggle.dataset.bound = '1';
    const icon = toggle.querySelector('i');
    if (document.body.classList.contains('theme-dark')) {
      icon?.classList.replace('fa-moon', 'fa-sun');
      const label = toggle.querySelector('span');
      if (label) label.textContent = 'Light mode';
    }
    toggle.addEventListener('click', () => {
      document.body.classList.toggle('theme-dark');
      const dark = document.body.classList.contains('theme-dark');
      document.querySelectorAll('.theme-toggle i').forEach((ic) => {
        ic.classList.toggle('fa-moon', !dark);
        ic.classList.toggle('fa-sun', dark);
      });
      document.querySelectorAll('.theme-toggle span').forEach((label) => {
        label.textContent = dark ? 'Light mode' : 'Dark mode';
      });
    });
  });
}

export function initLayout(options = {}) {
  renderSidebar();
  if (document.getElementById('topbar-root')) {
    renderTopBar(options);
  }
  initTheme();
}
