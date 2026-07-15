
<?php include INCLUDES_PATH . 'header.php'; ?>
<main class="min-h-screen grid lg:grid-cols-2">
    <!-- Left Section -->
    <section class="hidden lg:flex bg-gradient-to-br from-sky-600 to-indigo-800 text-white p-16 flex-col justify-between">
      <div class="flex items-center gap-3">
        <span class="w-12 h-12 rounded-3xl bg-white/15 flex items-center justify-center text-xl font-semibold">D</span>
        <span class="text-xl font-semibold">DonorTrack</span>
      </div>
      <div>
        <p class="uppercase tracking-[0.3em] text-sm opacity-75">Fundraising, focused</p>
        <h1 class="text-5xl font-semibold mt-4 leading-tight">Every donor story, clearly connected.</h1>
        <p class="mt-6 max-w-lg text-sky-100">A thoughtful workspace for the people building stronger communities.</p>
      </div>
      <p class="text-sm text-sky-100">© 2026 DonorTrack</p>
    </section>

    <!-- Right Section -->
    <section class="flex items-center justify-center p-6">
      <div class="w-full max-w-md">
        <div class="lg:hidden flex items-center gap-3 mb-10 text-sky-700">
          <span class="w-11 h-11 rounded-3xl bg-sky-600 text-white flex items-center justify-center font-semibold">D</span>
          <b>DonorTrack</b>
        </div>
        
        <p class="text-slate-500">Welcome back</p>
        <h1 class="text-3xl font-semibold mt-1">Sign in to your workspace</h1>

        <!-- Error Message -->
        <div id="errorMessage" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 hidden">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-circle-exclamation"></i>
            <span id="errorText"></span>
          </div>
        </div>

        <!-- Login Form -->
        <form id="loginForm" class="mt-8 space-y-5">
          <div class="form-field">
            <label for="email">Work email</label>
            <input type="email" id="email" class="input-glass" required />
          </div>
          <div class="form-field">
            <label for="password">Password</label>
            <div class="relative">
              <input type="password" id="password" class="input-glass pr-12" required />
              <button type="button" id="togglePassword" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </div>
          <button type="submit" class="w-full btn-primary py-3 rounded-2xl">Sign in</button>
        </form>
      </div>
    </section>
</main>

<script type="module" src="<?php echo ASSET_URL; ?>js/pages/login.js"></script>
<?php include INCLUDES_PATH . 'footer.php'; ?>
