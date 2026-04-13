/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          300: 'var(--brand-300)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
          800: 'var(--brand-800)',
          900: 'var(--brand-900)',
        },
        surface: {
          DEFAULT: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card:    'var(--bg-card)',
          border:  'var(--border-primary)',
          muted:   'var(--bg-muted)',
          elevated: 'var(--bg-elevated)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          light: 'var(--text-light)',
          faint: 'var(--text-faint)',
        },
        duo: {
          blue: '#e58b2a',
          blueShadow: '#bb6515',
          yellow: '#f4b940',
          yellowShadow: '#c88816',
          red: '#FF4B4B',
          redShadow: '#D80000',
          gray: '#ead7b9',
          grayShadow: '#cdb18d'
        },
        ink: {
          DEFAULT: 'var(--text-primary)',
          light:   'var(--text-secondary)',
          muted:   'var(--text-muted)',
          faint:   'var(--text-faint)',
        },
      },
      fontFamily: {
        sans:    ['Nunito', 'system-ui', 'sans-serif'],
        display: ['Nunito', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'bounce-pop': 'bouncePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        bouncePop:{ '0%': { transform: 'scale(0.8)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } }
      },
      backgroundImage: {
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(220,123,30,0.22), transparent)',
        'warm-glow': 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,205,124,0.25), transparent)',
      },
    },
  },
  plugins: [],
};
