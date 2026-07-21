<?php
require_once __DIR__ . '/../../config/paths.php';
require_once CONFIG_PATH . 'constants.php';
require_once CONFIG_PATH . 'database.php';
require_once INCLUDES_PATH . 'auth.php';

$pageTitle = 'DonorTrack | Donors';
$currentPage = 'donors.php';
$assetPath = ASSET_URL;

if (!checkSession()) {
    header('Location: ' . ROOT_PATH . 'login.php');
    exit;
}
?>
<?php
include INCLUDES_PATH . 'header.php';
?>
<div class="min-h-screen flex">
    <?php include INCLUDES_PATH . 'sidebar.php'; ?>
    <main class="flex-1 px-6 py-6">
      <header class="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p class="text-sm text-slate-500">Donors / Directory</p>
          <h2 class="text-3xl font-semibold tracking-tight">All donors</h2>
        </div>
        <div class="flex items-center gap-3">
          <button type="button" id="exportCsv" class="btn-secondary inline-flex items-center gap-2 px-4 py-3 rounded-2xl"><i class="fa-solid fa-download"></i> Export CSV</button>
          <button type="button" id="openAddDonor" class="btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-sky-600 text-white"><i class="fa-solid fa-plus"></i> Add Donor</button>
        </div>
      </header>
      <section class="grid lg:grid-cols-[1fr_320px] gap-6 mb-8">
        <div class="space-y-6">
          <div class="card-glass p-6">
            <h3 class="text-xl font-semibold mb-4">Find a supporter</h3>
            <div class="relative">
              <i class="fa-solid fa-search text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"></i>
              <input type="search" id="donorSearch" placeholder="Search by name, email, phone..." class="w-full rounded-3xl border border-slate-200 bg-white/90 pl-12 pr-4 py-4 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition" />
            </div>
          </div>
          <div class="card-glass p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold">Refine donor data</h3>
              <button type="button" id="resetFilters" class="text-sky-600 hover:text-sky-700">Reset</button>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <select id="filterLevel" class="input-glass" aria-label="Donor level">
                <option value="all">All levels</option>
                <option value="Bronze">Bronze</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
              <select id="filterStatus" class="input-glass" aria-label="Donor status">
                <option value="all">All statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
        <div class="card-glass p-6">
          <h3 class="text-xl font-semibold mb-5">Donor performance</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between rounded-3xl bg-slate-50 p-4">
              <div><p class="text-slate-500 text-sm">Silver donors</p><p class="text-xl font-semibold" id="summary-silver">—</p></div>
            </div>
            <div class="flex items-center justify-between rounded-3xl bg-slate-50 p-4">
              <div><p class="text-slate-500 text-sm">Gold donors</p><p class="text-xl font-semibold" id="summary-gold">—</p></div>
            </div>
            <div class="rounded-3xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 p-4 text-white shadow-xl">
              <p class="text-sm opacity-90">Lifetime donations</p>
              <p class="text-3xl font-semibold" id="summary-lifetime">—</p>
            </div>
          </div>
        </div>
      </section>
      <section class="card-glass p-6 overflow-hidden mb-8">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div><h3 class="text-xl font-semibold">Donor directory</h3><p class="text-slate-500">Live data — add, edit, search, and export.</p></div>
          <span id="showingInfo" class="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 text-sm text-slate-600">Showing —</span>
        </div>
        <div class="overflow-x-auto table-scroll">
          <table class="min-w-full text-left border-separate border-spacing-y-3">
            <thead class="text-slate-500 text-sm uppercase tracking-[0.18em]">
              <tr>
                <th class="pb-3 pl-6">Donor</th><th class="pb-3">Email</th><th class="pb-3">Phone</th><th class="pb-3">Level</th>
                <th class="pb-3">Lifetime</th><th class="pb-3">Last updated</th><th class="pb-3">Status</th><th class="pb-3 pr-6">Actions</th>
              </tr>
            </thead>
            <tbody id="donors-table-body"></tbody>
          </table>
        </div>
        <div class="mt-6 flex items-center justify-between text-slate-600 text-sm">
          <span id="pageInfo">Page 1 of 1</span>
          <div class="inline-flex gap-2">
            <button type="button" id="prevPage" class="btn-secondary px-4 py-2 rounded-3xl">Previous</button>
            <button type="button" id="nextPage" class="btn-secondary px-4 py-2 rounded-3xl">Next</button>
          </div>
        </div>
      </section>
    </main>
  </div>
  <div id="donorModal" class="modal">
    <div class="modal-backdrop" data-close-modal="donorModal"></div>
    <div class="modal-panel" role="dialog" aria-labelledby="donorModalTitle">
      <h3 id="donorModalTitle" class="text-xl font-semibold mb-5">Add donor</h3>
      <form id="donorForm">
        <input type="hidden" id="donorId" />
        <div id="donorFormError" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 hidden">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-circle-exclamation"></i>
            <span id="donorFormErrorText"></span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-field"><label for="donorFirstName">First name</label><input id="donorFirstName" class="input-glass" required /></div>
          <div class="form-field"><label for="donorLastName">Last name</label><input id="donorLastName" class="input-glass" required /></div>
        </div>
        <div class="form-field"><label for="donorEmail">Email</label><input id="donorEmail" type="email" class="input-glass" required /></div>
        <div class="form-field"><label for="donorPhone">Phone</label><input id="donorPhone" class="input-glass" />
          <p class="text-xs text-slate-500 mt-1">At least 7 digits, e.g. 0917 123 4567</p>
        </div>
        <div class="form-field"><label for="donorRole">Tag / note</label><input id="donorRole" class="input-glass" placeholder="Major Donor" /></div>
        <!-- Optional demographic fields, collected for aggregate analytics only
             (data minimization) — never required to record a donation. -->
        <div class="grid grid-cols-2 gap-4">
          <div class="form-field"><label for="donorGender">Gender</label>
            <select id="donorGender" class="input-glass">
              <option value="">—</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div class="form-field"><label for="donorBirthdate">Birthdate</label><input id="donorBirthdate" type="date" class="input-glass" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-field"><label for="donorCity">City</label><input id="donorCity" class="input-glass" placeholder="Cebu City" /></div>
          <div class="form-field"><label for="donorProvince">Province</label><input id="donorProvince" class="input-glass" placeholder="Cebu" /></div>
        </div>
        <p class="text-xs text-slate-400 mb-2">Optional — used only for aggregate reporting. Donors may leave these blank.</p>
        <div class="grid grid-cols-2 gap-4">
          <div class="form-field" id="donorLevelField" hidden>
            <label>Level</label>
            <div class="py-2"><span id="donorLevelBadge" class="badge"></span></div>
            <p class="text-xs text-slate-400">Automatically set by total donations.</p>
          </div>
          <div class="form-field" id="donorStatusField" hidden><label for="donorStatus">Status</label>
            <select id="donorStatus" class="input-glass"><option>Active</option><option>Inactive</option><option>Archived</option></select>
          </div>
        </div>
        <div class="form-field" id="donorRegisteredField" hidden>
          <label>Registered</label>
          <p id="donorRegistered" class="py-2 text-slate-600"></p>
        </div>
        <p id="donorLevelHint" class="text-xs text-slate-400 mb-4" hidden>New donors start at Bronze and rank up automatically based on total donations.</p>
        <p id="donorStatusHint" class="text-xs text-slate-400 mb-4" hidden>New donors are added as Active.</p>
        <div class="flex gap-3 mt-6">
          <button type="submit" class="btn-primary flex-1 py-3 rounded-2xl">Save</button>
          <button type="button" data-close-modal="donorModal" class="btn-secondary flex-1 py-3 rounded-2xl">Cancel</button>
        </div>
      </form>
    </div>
  </div>
  <script type="module" src="<?php echo ASSET_URL; ?>js/pages/donors.js"></script>
<?php include INCLUDES_PATH . 'footer.php'; ?>