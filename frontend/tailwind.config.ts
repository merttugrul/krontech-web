import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

/**
 * Krontech design tokens. Paletteki her renk ayrıca 50-950 arası shade'e sahip
 * olacak — sadece `kron.navy` gibi tekil değer değil (tint/shade ihtiyaçları
 * için). Böylece "hover koyu mavi, active daha koyu" gibi mikro-etkileşimleri
 * ekstra config'siz yazabiliriz.
 *
 * Değerler:
 *   kron.navy   #0a1628 — hero arka planı
 *   kron.blue   #1e3a8a — button, başlık
 *   kron.accent #2563eb — highlight, CTA
 *   kron.light  #3b82f6 — link, hover
 *   kron.gray   #f8fafc — section arka planı
 *   kron.dark   #0f172a — footer
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    // Standart sm/md/lg/xl + 2xl. PLAN.md standart Tailwind breakpoint'leri
    // istediği için custom eklemiyoruz.
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '3rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px', // marketing hero'lar için biraz daha geniş
      },
    },
    extend: {
      colors: {
        kron: {
          // Named aliases — component'lerde bu adlarla kullanılır
          navy: '#0a1628',
          blue: '#1e3a8a',
          accent: '#2563eb',
          light: '#3b82f6',
          gray: '#f8fafc',
          dark: '#0f172a',

          // Scale — tint/shade için; Tailwind'in standart 50-950 şeması
          50: '#f0f7ff',
          100: '#e0eefe',
          200: '#badcfe',
          300: '#7cc0fd',
          400: '#3b82f6', // kron.light
          500: '#2563eb', // kron.accent
          600: '#1e3a8a', // kron.blue
          700: '#1e2e6b',
          800: '#172152',
          900: '#0a1628', // kron.navy
          950: '#0f172a', // kron.dark
        },
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      fontSize: {
        // Hero başlık için biraz fazla büyük bir boyut ekleyelim.
        // PLAN.md standart `text-5xl` yetiyor diyor ama marketing hero'larda
        // ekstra boyut ihtiyacı doğabiliyor.
        'display-sm': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        'display-md': ['3rem', { lineHeight: '3.25rem', letterSpacing: '-0.02em' }],
        'display-lg': ['3.75rem', { lineHeight: '4rem', letterSpacing: '-0.025em' }],
        'display-xl': ['4.5rem', { lineHeight: '4.75rem', letterSpacing: '-0.025em' }],
      },
      letterSpacing: {
        tighter: '-0.03em',
      },
      boxShadow: {
        // Kurumsal kart gölgeleri — `ring-1 ring-black/5` pattern'inden daha
        // yumuşak; Krontech site stiline yakın.
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.08)',
        'card-hover':
          '0 4px 6px -1px rgb(15 23 42 / 0.1), 0 2px 4px -2px rgb(15 23 42 / 0.08)',
        hero: '0 25px 50px -12px rgb(10 22 40 / 0.35)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      backgroundImage: {
        // Hero arka planı gradient — koyu lacivertten saf karaya geçiş.
        'kron-hero':
          'linear-gradient(135deg, #0a1628 0%, #0f172a 60%, #020617 100%)',
        // Başlık highlight efekti için `underline` yerine alt-çubuk gradient.
        // `.hl` utility'si bunun üstüne oturuyor (globals.css @layer components).
        'kron-accent-bar':
          'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 400ms ease-out both',
      },
    },
  },
  plugins: [typography],
};

export default config;
