/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff8f0',
          100: '#ffecd6',
          200: '#ffd4a8',
          300: '#ffb570',
          400: '#ff8c3a',
          500: '#ff6b1a',
          600: '#e85500',
          700: '#c44400',
          800: '#9e3600',
          900: '#7a2a00',
        },
        surface: {
          DEFAULT: '#fdf8f3',
          card:    '#fffcf9',
          border:  '#e8ddd0',
          muted:   '#f5ede3',
        },
        warm: {
          50:  '#fdf8f3',
          100: '#f7ede0',
          200: '#eedcc8',
          300: '#e0c4a0',
          400: '#c9a478',
          500: '#b08050',
          600: '#8f6030',
          700: '#6e4520',
          800: '#4d2e12',
          900: '#2e1a08',
        },
        ink: {
          DEFAULT: '#2d1f0e',
          light:   '#5c4030',
          muted:   '#8b6f5a',
          faint:   '#b8a090',
        },
      },
      fontFamily: {
        sans:    ['Syne', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'float':      'float 3s ease-in-out infinite',
        'flicker':    'flicker 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        float:   { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' } },
        flicker: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
      },
      backgroundImage: {
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,107,26,0.15), transparent)',
        'warm-glow': 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,180,100,0.2), transparent)',
      },
    },
  },
  plugins: [],
};
