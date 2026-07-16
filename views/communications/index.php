<?php
require_once __DIR__ . '/../../config/paths.php';
require_once CONFIG_PATH . 'constants.php';
require_once CONFIG_PATH . 'database.php';
require_once INCLUDES_PATH . 'auth.php';

$pageTitle = 'DonorTrack | Communications';
$currentPage = 'communications.php';
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
      <header class="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p class="text-sm text-slate-500">Communications / Timeline</p>
          <h2 class="text-3xl font-semibold tracking-tight">Donor conversations</h2>
        </div>
        <button type="button" id="openAddNote" class="btn-primary px-5 py-3 rounded-2xl bg-sky-600 text-white">New note</button>
      </header>
      <section id="communications-list" class="space-y-6"></section>
      <div class="flex items-center justify-between mt-6 text-sm text-slate-500">
        <span id="commPageInfo"></span>
        <div class="flex gap-2">
          <button type="button" id="commPrevPage" class="btn-primary-outline btn-sm">Previous</button>
          <button type="button" id="commNextPage" class="btn-primary-outline btn-sm">Next</button>
        </div>
      </div>
    </main>
  </div>
  <div id="commModal" class="modal">
    <div class="modal-backdrop" data-close-modal="commModal"></div>
    <div class="modal-panel" role="dialog">
      <h3 id="commModalTitle" class="text-xl font-semibold mb-5">New communication</h3>
      <form id="commForm">
        <input type="hidden" id="commId" value="" />
        <div class="form-field"><label for="commType">Type</label>
          <select id="commType" class="input-glass"><option>Email outreach</option><option>Call logged</option><option>Meeting note</option></select>
        </div>
        <div class="form-field"><label for="commDonor">Donor</label><select id="commDonor" class="input-glass" required></select></div>
        <div class="form-field" id="commStatusField" hidden><label for="commStatus">Status</label>
          <select id="commStatus" class="input-glass"><option>Draft</option><option>Sent</option><option>In review</option><option>Pending</option></select>
        </div>
        <div class="form-field"><label for="commContent">Notes</label><textarea id="commContent" class="input-glass" rows="4" required></textarea></div>
        <div class="flex gap-3 mt-6">
          <button type="submit" class="btn-primary flex-1 py-3 rounded-2xl">Save</button>
          <button type="button" data-close-modal="commModal" class="btn-secondary flex-1 py-3 rounded-2xl">Cancel</button>
        </div>
      </form>
    </div>
  </div>
  <script type="module" src="<?php echo ASSET_URL; ?>js/pages/communications.js"></script>
<?php include INCLUDES_PATH . 'footer.php'; ?>