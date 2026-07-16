<?php
require_once __DIR__ . '/../../config/paths.php';
require_once CONFIG_PATH . 'constants.php';
require_once CONFIG_PATH . 'database.php';
require_once INCLUDES_PATH . 'auth.php';

$pageTitle = 'DonorTrack | Staff';
$currentPage = 'staff.php';
$assetPath = ASSET_URL;

if (!checkSession()) {
    header('Location: ' . ROOT_PATH . 'login.php');
    exit;
}
?>
<?php include INCLUDES_PATH . 'header.php'; ?>
<div class="min-h-screen flex">
    <?php include INCLUDES_PATH . 'sidebar.php'; ?>
    <main class="flex-1 px-6 py-6">
      <header class="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <p class="text-sm text-slate-500">Organization / Staff</p>
          <h1 class="text-3xl font-semibold">Staff directory</h1>
        </div>
        <button id="openStaffModal" class="btn-primary px-5 py-3 rounded-2xl">Add staff member</button>
      </header>
      <section id="staffGrid" class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"></section>
    </main>
  </div>
  <div id="staffModal" class="modal">
    <div class="modal-backdrop" data-close-modal="staffModal"></div>
    <div class="modal-panel">
      <h2 id="staffTitle" class="text-xl font-semibold mb-5">Add staff member</h2>
      <form id="staffForm">
        <input id="staffId" type="hidden">
        <div class="form-field"><label>Name</label><input id="staffName" class="input-glass" required></div>
        <div class="form-field"><label>Email</label><input id="staffEmail" type="email" class="input-glass" required></div>
        <div class="form-field"><label>Role</label><input id="staffRole" class="input-glass" required></div>
        <div class="flex gap-3 mt-6">
          <button class="btn-primary flex-1 py-3 rounded-2xl">Save</button>
          <button type="button" class="btn-secondary flex-1 py-3 rounded-2xl" data-close-modal="staffModal">Cancel</button>
        </div>
      </form>
    </div>
  </div>
  <div id="tempPasswordModal" class="modal">
    <div class="modal-backdrop" data-close-modal="tempPasswordModal"></div>
    <div class="modal-panel">
      <h2 class="text-xl font-semibold mb-2">Staff member created</h2>
      <p class="text-slate-500 mb-5">Share this temporary password with <b id="tempPasswordEmail"></b> so they can sign in. It is shown only this once and cannot be retrieved later.</p>
      <div class="flex items-center gap-3 mb-6">
        <code id="tempPasswordValue" class="flex-1 px-4 py-3 rounded-2xl bg-slate-100 text-lg font-semibold tracking-wide select-all"></code>
        <button type="button" id="copyTempPassword" class="btn-secondary px-4 py-3 rounded-2xl">Copy</button>
      </div>
      <button type="button" class="btn-primary w-full py-3 rounded-2xl" data-close-modal="tempPasswordModal">Done</button>
    </div>
  </div>
  <script type="module" src="<?php echo ASSET_URL; ?>js/pages/staff.js"></script>
<?php include INCLUDES_PATH . 'footer.php'; ?>
