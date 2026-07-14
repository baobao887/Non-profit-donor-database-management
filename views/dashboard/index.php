<?php
require_once '../../config/paths.php';
require_once CONFIG_PATH . 'constants.php';
require_once CONFIG_PATH . 'database.php';
require_once INCLUDES_PATH . 'auth.php';

// Set page variables for layout
$pageTitle = 'DonorTrack | Dashboard';
$currentPage = 'dashboard.php';
$assetPath = ASSET_URL;

// Check authentication
if (!checkSession()) {
    header('Location: ' . ROOT_PATH . 'login.php');
    exit;
}
?>
<?php
$pageTitle = 'DonorTrack | Dashboard';
include INCLUDES_PATH . 'header.php';
?>
<div class="min-h-screen flex">
    <?php include INCLUDES_PATH . 'sidebar.php'; ?>
    <main class="flex-1 px-6 py-6">
      <?php include INCLUDES_PATH . 'navbar.php'; ?>
      <section aria-label="Key performance indicators" class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 mb-6">
          <article class="metric-card p-6 rounded-[28px] bg-white shadow-xl border border-slate-200/70">
            <div class="flex items-center justify-between mb-5">
              <div class="icon-chip bg-sky-100 text-sky-700"><i class="fa-solid fa-user-group"></i></div>
            </div>
            <p class="text-sm uppercase tracking-[0.24em] text-slate-500 mb-2">Total Donors</p>
            <h2 class="text-3xl font-semibold" id="stat-donors">—</h2>
          </article>
          <article class="metric-card p-6 rounded-[28px] bg-white shadow-xl border border-slate-200/70">
            <div class="flex items-center justify-between mb-5">
              <div class="icon-chip bg-emerald-100 text-emerald-700"><i class="fa-solid fa-hand-holding-dollar"></i></div>
            </div>
            <p class="text-sm uppercase tracking-[0.24em] text-slate-500 mb-2">Total Donations</p>
            <h2 class="text-3xl font-semibold" id="stat-donations">—</h2>
          </article>
          <article class="metric-card p-6 rounded-[28px] bg-white shadow-xl border border-slate-200/70">
            <div class="flex items-center justify-between mb-5">
              <div class="icon-chip bg-violet-100 text-violet-700"><i class="fa-solid fa-flag"></i></div>
              <span class="text-sm text-slate-500"><span id="stat-active-campaigns">—</span> live</span>
            </div>
            <p class="text-sm uppercase tracking-[0.24em] text-slate-500 mb-2">Campaigns</p>
            <h2 class="text-3xl font-semibold" id="stat-campaigns">—</h2>
          </article>
          <article class="metric-card p-6 rounded-[28px] bg-white shadow-xl border border-slate-200/70">
            <div class="flex items-center justify-between mb-5">
              <div class="icon-chip bg-amber-100 text-amber-700"><i class="fa-solid fa-chart-line"></i></div>
            </div>
            <p class="text-sm uppercase tracking-[0.24em] text-slate-500 mb-2">Live campaigns</p>
            <h2 class="text-3xl font-semibold" id="stat-active-campaigns-display">—</h2>
          </article>
      </section>
      <section aria-label="Dashboard charts" class="grid gap-6 xl:grid-cols-[1.5fr_1fr] mb-8">
        <div class="card-glass p-6 shadow-xl rounded-[28px]">
          <div class="flex items-center justify-between mb-5">
            <div><p class="text-sm uppercase tracking-[0.24em] text-slate-500">Activity</p><h3 class="text-xl font-semibold">Donation trend</h3></div>
          </div>
          <canvas id="lineChart" class="chart-canvas" height="190"></canvas>
        </div>
        <div class="card-glass p-6 shadow-xl rounded-[28px]">
          <div class="mb-5"><p class="text-sm uppercase tracking-[0.24em] text-slate-500">Donor sources</p><h3 class="text-xl font-semibold">Contribution mix</h3></div>
          <canvas id="pieChart" class="chart-canvas-compact" height="170"></canvas>
        </div>
      </section>
      <section aria-label="Recent activity" class="grid gap-6 xl:grid-cols-[1.45fr_0.75fr] mb-8">
        <div class="card-glass p-6 shadow-xl rounded-[28px] overflow-hidden">
          <div class="flex items-center justify-between mb-5"><div><p class="text-sm uppercase tracking-[0.24em] text-slate-500">Recent activity</p><h3 class="text-xl font-semibold">Latest donations</h3></div><a href="<?php echo ROOT_PATH; ?>donations.php" class="text-sm font-semibold text-sky-600">View all</a></div>
          <div class="overflow-x-auto table-scroll max-h-80 overflow-y-auto">
            <table class="min-w-full text-left border-separate border-spacing-y-3">
              <thead class="text-slate-500 text-sm uppercase tracking-[0.18em]">
                <tr><th class="pb-3 pl-6">Donor</th><th class="pb-3">Campaign</th><th class="pb-3">Amount</th><th class="pb-3">Date</th><th class="pb-3 pr-6">Status</th></tr>
              </thead>
              <tbody id="recent-donations-body"></tbody>
            </table>
          </div>
        </div>
        <div class="card-glass p-6 shadow-xl rounded-[28px]">
          <h3 class="text-xl font-semibold mb-5">Top donors</h3>
          <div class="space-y-4" id="top-donors-list"></div>
        </div>
      </section>
      <section aria-label="Campaign alerts" class="card-glass p-6 shadow-xl rounded-[28px] mb-8">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-5"><div><p class="text-sm uppercase tracking-[0.24em] text-slate-500">Campaign alerts</p><h3 class="text-xl font-semibold">Live campaigns requiring attention</h3></div><a href="<?php echo ROOT_PATH; ?>campaigns.php" class="text-sm font-semibold text-sky-600">Manage campaigns</a></div>
        <div class="grid gap-5 xl:grid-cols-2" id="campaign-progress-list"></div>
      </section>
    </main>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script type="module" src="<?php echo ASSET_URL; ?>js/pages/dashboard.js"></script>
<?php include INCLUDES_PATH . 'footer.php'; ?>
