<?php
/**
 * Sidebar Component
 * Container for sidebar - rendered by JavaScript
 */
?>
<button type="button" id="mobileMenuBtn" class="mobile-menu-btn" aria-label="Open menu">
  <i class="fa-solid fa-bars"></i>
</button>
<div id="sidebarOverlay" class="sidebar-overlay" aria-hidden="true"></div>
<aside id="sidebarPanel" class="sidebar-panel">
  <div class="sidebar-top flex items-center justify-between px-6 py-6">
    <div class="brand-logo flex items-center gap-3">
      <img src="<?php echo ASSET_URL; ?>images/logo.png" alt="DonorTrack" class="w-12 h-12 object-contain" />
      <div>
        <h1 class="text-xl font-semibold tracking-tight">DonorTrack</h1>
        <p class="text-sm text-ink-500">Donor Management</p>
      </div>
    </div>
    <button type="button" id="sidebarCloseBtn" class="sidebar-close-btn" aria-label="Close menu">
      <i class="fa-solid fa-xmark"></i>
    </button>
  </div>
  <nav class="mt-2 px-4 space-y-1" id="sidebar-nav"></nav>
</aside>
