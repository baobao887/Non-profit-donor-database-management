<?php
require_once __DIR__ . '/../../config/paths.php';
require_once CONFIG_PATH . 'constants.php';
require_once CONFIG_PATH . 'database.php';
require_once INCLUDES_PATH . 'auth.php';

$pageTitle = 'DonorTrack | Donations';
$currentPage = 'donations.php';
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
          <p class="text-sm text-slate-500">Donations / Transactions</p>
          <h2 class="text-3xl font-semibold tracking-tight">Donation history</h2>
        </div>
        <div class="flex items-center gap-3">
          <button type="button" id="exportDonations" class="btn-secondary px-4 py-3 rounded-2xl">Export page</button>
          <button type="button" id="openAddDonation" class="btn-primary px-5 py-3 rounded-2xl bg-sky-600 text-white">Log donation</button>
        </div>
      </header>
      <section class="grid lg:grid-cols-3 gap-6 mb-8">
        <div class="card-glass p-6 shadow-xl rounded-[28px]">
          <p class="text-slate-500 uppercase text-xs tracking-[0.24em] mb-2">Revenue</p>
          <p class="text-3xl font-semibold" id="stat-revenue">—</p>
          <p class="text-sm text-slate-500 mt-2">Total recorded donations</p>
        </div>
        <div class="card-glass p-6 shadow-xl rounded-[28px]">
          <p class="text-slate-500 uppercase text-xs tracking-[0.24em] mb-2">Average gift</p>
          <p class="text-3xl font-semibold" id="stat-avg">—</p>
        </div>
        <div class="card-glass p-6 shadow-xl rounded-[28px]">
          <p class="text-slate-500 uppercase text-xs tracking-[0.24em] mb-2">Refund rate</p>
          <p class="text-3xl font-semibold" id="stat-refund">—</p>
        </div>
      </section>
      <section class="card-glass p-6 overflow-hidden mb-8">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div><h3 class="text-xl font-semibold">Transaction feed</h3><p class="text-slate-500">Filter and audit donations.</p></div>
          <div class="flex flex-wrap items-center gap-3">
            <div class="relative">
              <i class="fa-solid fa-search text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"></i>
              <input type="search" id="donationSearch" placeholder="Search by donor or campaign..." class="input-glass w-64 pl-11" aria-label="Search by donor or campaign" />
            </div>
            <select id="filterStatus" class="input-glass w-auto min-w-[160px]" aria-label="Filter by status">
              <option value="all">All statuses</option>
              <option value="Succeeded">Succeeded</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
        </div>
        <div class="overflow-x-auto table-scroll">
          <table class="min-w-full text-left border-separate border-spacing-y-3">
            <thead class="text-slate-500 text-sm uppercase tracking-[0.18em]">
              <tr><th class="pb-3 pl-6">Donation</th><th class="pb-3">Donor</th><th class="pb-3">Date</th><th class="pb-3">Amount</th><th class="pb-3">Method</th><th class="pb-3">Status</th><th class="pb-3 pr-6">Actions</th></tr>
            </thead>
            <tbody id="donations-table-body"></tbody>
          </table>
        </div>
        <div class="mt-6 flex items-center justify-between text-slate-600 text-sm">
          <span id="donationShowingInfo">Showing —</span>
          <div class="inline-flex gap-2">
            <button type="button" id="donationPrevPage" class="btn-secondary px-4 py-2 rounded-3xl">Previous</button>
            <button type="button" id="donationNextPage" class="btn-secondary px-4 py-2 rounded-3xl">Next</button>
          </div>
        </div>
      </section>
      <section class="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div class="card-glass p-6 shadow-xl rounded-[28px]">
          <h3 class="text-xl font-semibold mb-5">Weekly donation pace</h3>
          <canvas id="donationsLineChart" class="chart-canvas" height="200"></canvas>
        </div>
        <div class="card-glass p-6 shadow-xl rounded-[28px]">
          <h3 class="text-xl font-semibold mb-5">Payment sources</h3>
          <canvas id="paymentMethodsChart" class="chart-canvas-compact" height="170"></canvas>
        </div>
      </section>
    </main>
  </div>
  <div id="donationModal" class="modal">
    <div class="modal-backdrop" data-close-modal="donationModal"></div>
    <div class="modal-panel" role="dialog">
      <h3 class="text-xl font-semibold mb-5">Log donation</h3>
      <form id="donationForm">
        <div id="donationFormError" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 hidden">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-circle-exclamation"></i>
            <span id="donationFormErrorText"></span>
          </div>
        </div>
        <div class="form-field"><label for="donationDonor">Donor</label><select id="donationDonor" class="input-glass" required></select></div>
        <div class="form-field"><label for="donationCampaign">Campaign</label><select id="donationCampaign" class="input-glass" required></select></div>
        <div class="form-field"><label for="donationAmount">Amount (₱)</label><input id="donationAmount" type="number" min="1" step="0.01" class="input-glass" required /></div>
        <div class="form-field"><label for="donationDate">Date</label><input id="donationDate" type="date" class="input-glass" required /></div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-field"><label for="donationMethod">Method</label>
            <select id="donationMethod" class="input-glass"><option>Cash</option><option>GCash</option><option>Card</option><option>Bank Transfer</option><option>PayPal</option><option>Check</option></select>
          </div>
          <div class="form-field"><label for="donationStatus">Status</label>
            <select id="donationStatus" class="input-glass"><option>Succeeded</option><option>Pending</option><option>Processing</option></select>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button type="submit" class="btn-primary flex-1 py-3 rounded-2xl">Save</button>
          <button type="button" data-close-modal="donationModal" class="btn-secondary flex-1 py-3 rounded-2xl">Cancel</button>
        </div>
      </form>
    </div>
  </div>
  <div id="donationEditModal" class="modal">
    <div class="modal-backdrop" data-close-modal="donationEditModal"></div>
    <div class="modal-panel" role="dialog">
      <h3 class="text-xl font-semibold mb-1">Edit donation</h3>
      <p id="editDonationContext" class="text-slate-500 text-sm mb-5"></p>
      <form id="donationEditForm">
        <input type="hidden" id="editDonationId" />
        <div id="donationEditFormError" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 hidden">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-circle-exclamation"></i>
            <span id="donationEditFormErrorText"></span>
          </div>
        </div>
        <div class="form-field"><label for="editDonationAmount">Amount (₱)</label><input id="editDonationAmount" type="number" min="1" step="0.01" class="input-glass" required /></div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-field"><label for="editDonationMethod">Method</label>
            <select id="editDonationMethod" class="input-glass"><option>Cash</option><option>GCash</option><option>Card</option><option>Bank Transfer</option><option>PayPal</option><option>Check</option></select>
          </div>
          <div class="form-field"><label for="editDonationStatus">Status</label>
            <select id="editDonationStatus" class="input-glass"><option>Succeeded</option><option>Pending</option><option>Processing</option><option>Failed</option><option>Refunded</option></select>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button type="submit" class="btn-primary flex-1 py-3 rounded-2xl">Save</button>
          <button type="button" data-close-modal="donationEditModal" class="btn-secondary flex-1 py-3 rounded-2xl">Cancel</button>
        </div>
      </form>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script type="module" src="<?php echo ASSET_URL; ?>js/pages/donations.js"></script>
<?php include INCLUDES_PATH . 'footer.php'; ?>