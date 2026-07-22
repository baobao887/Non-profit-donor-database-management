<?php
require_once __DIR__ . '/../../config/paths.php';
require_once CONFIG_PATH . 'constants.php';
require_once CONFIG_PATH . 'database.php';
require_once INCLUDES_PATH . 'auth.php';

$pageTitle = 'DonorTrack | Reports';
$currentPage = 'reports.php';
$assetPath = ASSET_URL;

if (!checkSession()) {
    header('Location: ' . appUrl('login.php'));
    exit;
}

// Defense in depth: this view is directly reachable under views/, so it must
// enforce the same role its root router does - the router check alone is
// bypassed by requesting this file's path directly.
requireRole(ROLE_ADMIN);
?>
<?php include INCLUDES_PATH . 'header.php'; ?>
<div class="min-h-screen flex">
    <?php include INCLUDES_PATH . 'sidebar.php'; ?>
    <main class="flex-1 px-6 py-6">
      <header class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <p class="text-sm text-slate-500">Reports / Analytics</p>
          <h2 class="text-3xl font-semibold tracking-tight">Impact analytics</h2>
        </div>
        <div class="flex gap-3">
          <button type="button" id="exportCsvReport" class="btn-secondary px-4 py-3 rounded-2xl">Export CSV</button>
          <button type="button" id="printReport" class="btn-secondary px-4 py-3 rounded-2xl">Print</button>
        </div>
      </header>
      <section class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] mb-8">
        <div class="card-glass p-6 shadow-xl rounded-[28px]">
          <h3 class="text-xl font-semibold mb-5">Revenue performance</h3>
          <canvas id="reportsLineChart" class="chart-canvas" height="190"></canvas>
        </div>
        <div class="grid gap-6">
          <div class="card-glass p-6 shadow-xl rounded-[28px]">
            <h3 class="text-xl font-semibold mb-4">Donor distribution</h3>
            <canvas id="donorPieChart" class="chart-canvas-compact" height="170"></canvas>
          </div>
          <div class="card-glass p-6 shadow-xl rounded-[28px]">
            <h3 class="text-xl font-semibold mb-4">Payment channels</h3>
            <div class="space-y-4" id="payment-breakdown"></div>
          </div>
        </div>
      </section>
      <section class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div class="card-glass p-6 shadow-xl rounded-[28px]">
          <h3 class="text-xl font-semibold mb-5">Campaign results</h3>
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="rounded-3xl bg-slate-50 p-4"><p class="text-slate-500 text-sm">Top campaign</p><p class="text-3xl font-semibold" id="report-top">—</p></div>
            <div class="rounded-3xl bg-slate-50 p-4"><p class="text-slate-500 text-sm">Avg. raised</p><p class="text-3xl font-semibold" id="report-avg">—</p></div>
            <div class="rounded-3xl bg-slate-50 p-4"><p class="text-slate-500 text-sm">Goal progress</p><p class="text-3xl font-semibold" id="report-conversion">—</p></div>
          </div>
        </div>
        <div class="card-glass p-6 shadow-xl rounded-[28px]">
          <h3 class="text-xl font-semibold mb-5">Donation activity by weekday</h3>
          <div class="grid grid-cols-5 gap-2 text-[11px] text-slate-500 mb-4">
            <span class="text-center">Mon</span><span class="text-center">Tue</span><span class="text-center">Wed</span><span class="text-center">Thu</span><span class="text-center">Fri</span>
          </div>
          <div class="grid grid-cols-5 gap-2 mb-2" id="activity-heatmap-count" title="Donations logged">
            <div class="h-14 rounded-3xl bg-slate-100" data-weekday="Mon"></div><div class="h-14 rounded-3xl bg-slate-100" data-weekday="Tue"></div><div class="h-14 rounded-3xl bg-slate-100" data-weekday="Wed"></div><div class="h-14 rounded-3xl bg-slate-100" data-weekday="Thu"></div><div class="h-14 rounded-3xl bg-slate-100" data-weekday="Fri"></div>
          </div>
          <div class="grid grid-cols-5 gap-2" id="activity-heatmap-revenue" title="Revenue raised">
            <div class="h-14 rounded-3xl bg-slate-100" data-weekday="Mon"></div><div class="h-14 rounded-3xl bg-slate-100" data-weekday="Tue"></div><div class="h-14 rounded-3xl bg-slate-100" data-weekday="Wed"></div><div class="h-14 rounded-3xl bg-slate-100" data-weekday="Thu"></div><div class="h-14 rounded-3xl bg-slate-100" data-weekday="Fri"></div>
          </div>
        </div>
      </section>
      <!-- Donor demographics: who gives more, by gender / location / age.
           Aggregate figures only; donors with no value are shown as "Not specified". -->
      <section class="grid gap-6 mt-8 xl:grid-cols-3">
        <div class="card-glass p-6 shadow-xl rounded-[28px]">
          <h3 class="text-xl font-semibold mb-1">Giving by gender</h3>
          <p class="text-slate-500 text-sm mb-4">Total donations received per donor gender.</p>
          <canvas id="genderChart" class="chart-canvas-compact" height="180"></canvas>
        </div>
        <div class="card-glass p-6 shadow-xl rounded-[28px]">
          <h3 class="text-xl font-semibold mb-1">Top locations</h3>
          <p class="text-slate-500 text-sm mb-4">Highest-giving donor cities.</p>
          <div class="space-y-4" id="location-breakdown"></div>
        </div>
        <div class="card-glass p-6 shadow-xl rounded-[28px]">
          <h3 class="text-xl font-semibold mb-1">Giving by age group</h3>
          <p class="text-slate-500 text-sm mb-4">Total donations received per donor age bracket.</p>
          <div class="space-y-4" id="age-breakdown"></div>
        </div>
      </section>
    </main>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script type="module" src="<?php echo ASSET_URL; ?>js/pages/reports.js"></script>
<?php include INCLUDES_PATH . 'footer.php'; ?>