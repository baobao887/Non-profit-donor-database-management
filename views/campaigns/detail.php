<?php
require_once __DIR__ . '/../../config/paths.php';
require_once CONFIG_PATH . 'constants.php';
require_once CONFIG_PATH . 'database.php';
require_once INCLUDES_PATH . 'auth.php';

$pageTitle = 'DonorTrack | Campaign Details';
$currentPage = 'campaigns.php';
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
      <a href="<?php echo ROOT_PATH; ?>campaigns.php" class="text-sky-600 text-sm"><i class="fa-solid fa-arrow-left mr-2"></i>Campaigns</a>
      <section id="campaignOverview" class="card-glass mt-5 p-7 rounded-[28px]"></section>
      <section class="grid xl:grid-cols-2 gap-6 mt-6">
        <article class="card-glass p-6 rounded-[28px]">
          <h2 class="text-xl font-semibold mb-5">Donation timeline</h2>
          <div id="campaignDonations" class="space-y-3"></div>
        </article>
        <article class="card-glass p-6 rounded-[28px]">
          <h2 class="text-xl font-semibold mb-5">Recent donors</h2>
          <div id="campaignDonors" class="space-y-3"></div>
        </article>
      </section>
    </main>
  </div>
  <script type="module" src="<?php echo ASSET_URL; ?>js/pages/campaign-detail.js"></script>
<?php include INCLUDES_PATH . 'footer.php'; ?>