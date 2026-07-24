/**
 * DonorTrack — Tailwind design tokens
 *
 * The single source of truth for the visual system. Colors, radius, shadow and
 * type are declared here; component classes (.card, .btn-*, .badge, .input-glass,
 * .table-row, .modal-panel, …) live in assets/css/tailwind.css and compose these
 * tokens. Never introduce one-off arbitrary values in the views/JS — reach for a
 * token here instead.
 *
 * Build (Tailwind v3 standalone CLI — no Node required, see README):
 *   tools/tailwindcss.exe -i assets/css/tailwind.css -o assets/css/app.css --watch
 *   tools/tailwindcss.exe -i assets/css/tailwind.css -o assets/css/app.css --minify
 */
module.exports = {
  // Scan every PHP view AND the JS files that render rows/cards from template
  // strings — the class names live inside those template literals too.
  content: ['./**/*.php', './assets/js/**/*.js'],

  // Insurance for the status/rank badge colors that utils.js selects by lookup.
  // They already appear as literal strings there (so JIT finds them), but these
  // carry meaning, so we guarantee they survive a purge.
  safelist: [
    { pattern: /^(bg|text)-(emerald|amber|sky|slate|violet|rose)-(100|700|800)$/ },
  ],

  theme: {
    extend: {
      colors: {
        // Brand — deep navy. Reads as institutional trust + financial
        // credibility. 600 = primary action (buttons, active nav, links);
        // 700 = hover (visibly darker). 50/100 = tinted backgrounds (active
        // nav pill, selected rows, info callouts); 300–500 = borders, icons,
        // secondary accents.
        brand: {
          50: '#EDF2FB', 100: '#D6E2F5', 200: '#AFC7EA', 300: '#7EA0D6',
          400: '#4E76BE', 500: '#2F569C', 600: '#234B84', 700: '#1A3A66',
          800: '#152F50', 900: '#0F2039',
        },
        // Accent — warm brass/gold, the classic navy pairing (value,
        // philanthropy, quiet prestige). FOR: chart series & data-viz variety,
        // optional decorative highlights. NOT FOR: semantic meaning — that is
        // reserved for success/warning/danger/info — and NOT for small text on
        // light surfaces; use accent-700 (6.4:1 on white) if a gold text tone
        // is ever needed.
        accent: {
          50: '#FAF5EA', 100: '#F3E6C8', 200: '#E7CE95', 300: '#D9B45F',
          400: '#C99F3B', 500: '#B4882A', 600: '#977020', 700: '#795A1B',
        },
        // Neutrals — warm gray "ink" (never pure #000). Kept warm on purpose:
        // warm cream + cool navy is a deliberate institutional-yet-human
        // pairing, and it keeps the warm-tinted elevation scale coherent.
        ink: {
          50: '#FAF9F7', 100: '#F2F0EC', 200: '#E5E2DC', 300: '#D2CEC6',
          400: '#A8A29A', 500: '#78726A', 600: '#5C564E', 700: '#44403A',
          800: '#2E2A25', 900: '#211E1A',
        },
        // Semantic — meaning only, never decorative.
        success: { 50: '#ECFDF3', 100: '#D1FADF', 500: '#12B76A', 600: '#039855', 700: '#027A48' },
        warning: { 50: '#FFFAEB', 100: '#FEF0C7', 500: '#F79009', 600: '#DC6803', 700: '#B54708' },
        danger:  { 50: '#FEF3F2', 100: '#FEE4E2', 500: '#F04438', 600: '#D92D20', 700: '#B42318' },
        // Info — sky-cyan, shifted off azure so it never collides with the
        // navy brand. Was hue ~214 (≈ navy's 215); now ~197 with a ~2.4×
        // lightness gap. Meaning only: "informational status", never a brand
        // action.
        info:    { 50: '#ECFAFF', 100: '#CDEFFB', 500: '#1AA3DB', 600: '#0079AC', 700: '#0A5E82' },
        // Surfaces — warm off-whites, never pure white. Kept warm to pair
        // with navy (see ink note above).
        canvas: '#F6F4F0',
        surface: { DEFAULT: '#FDFCFA', 2: '#F2F0EC' },
      },

      // Named radii used by components. Defaults (rounded-lg/2xl/full …) are kept.
      borderRadius: {
        control: '10px',  // buttons, inputs
        card: '16px',     // cards, tiles
        panel: '20px',    // modals, large panels
      },

      letterSpacing: {
        eyebrow: '0.08em',
      },

      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },

    // Elevation is REPLACED (not extended): one restrained, warm-tinted scale so
    // existing shadow-sm/xl/2xl markup is softened globally without per-page edits.
    boxShadow: {
      none: 'none',
      xs: '0 1px 2px rgba(33,30,26,0.05)',
      sm: '0 1px 2px rgba(33,30,26,0.04), 0 1px 3px rgba(33,30,26,0.06)',
      DEFAULT: '0 1px 2px rgba(33,30,26,0.04), 0 1px 3px rgba(33,30,26,0.06)',
      card: '0 1px 2px rgba(33,30,26,0.04), 0 1px 3px rgba(33,30,26,0.06)',
      md: '0 2px 4px rgba(33,30,26,0.04), 0 4px 12px rgba(33,30,26,0.07)',
      lg: '0 8px 24px rgba(33,30,26,0.10)',
      xl: '0 12px 32px rgba(33,30,26,0.12)',
      '2xl': '0 20px 48px rgba(33,30,26,0.16)',
      pop: '0 8px 24px rgba(33,30,26,0.12)',
      modal: '0 20px 48px rgba(33,30,26,0.18)',
      inner: 'inset 0 1px 2px rgba(33,30,26,0.06)',
    },
  },

  plugins: [],
};
