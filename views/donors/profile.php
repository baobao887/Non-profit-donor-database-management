<?php
require_once __DIR__ . '/../../config/paths.php';
require_once CONFIG_PATH . 'constants.php';
require_once CONFIG_PATH . 'database.php';
require_once INCLUDES_PATH . 'auth.php';

$pageTitle = 'DonorTrack | Donor Profile';
$currentPage = 'donors.php';
$assetPath = ASSET_URL;

if (!checkSession()) {
    header('Location: ' . appUrl('login.php'));
    exit;
}
?>
<?php include INCLUDES_PATH . 'header.php'; ?>
<div class="min-h-screen flex">
    <?php include INCLUDES_PATH . 'sidebar.php'; ?>
    <main class="flex-1 px-6 py-6">
      <a class="text-sky-600 text-sm" href="<?php echo ROOT_PATH; ?>donors.php"><i class="fa-solid fa-arrow-left mr-2"></i>All donors</a>
      <header id="profileHeader" class="card-glass mt-5 p-6 rounded-[28px]"></header>
      <section id="profileStats" class="grid gap-5 sm:grid-cols-3 mt-6"></section>
      <section class="grid xl:grid-cols-2 gap-6 mt-6">
        <article class="card-glass p-6 rounded-[28px]">
          <h2 class="text-xl font-semibold mb-5">Donation history</h2>
          <div id="donationHistory" class="space-y-3"></div>
        </article>
        <article class="card-glass p-6 rounded-[28px]">
          <h2 class="text-xl font-semibold mb-5">Communication history</h2>
          <div id="communicationHistory" class="space-y-3"></div>
        </article>
      </section>
    </main>
  </div>
  <script type="module" src="<?php echo ASSET_URL; ?>js/pages/donor-profile.js"></script>
<?php include INCLUDES_PATH . 'footer.php'; ?>