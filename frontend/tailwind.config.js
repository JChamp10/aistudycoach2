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
          50:  '#f1fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#58CC02',
          600: '#58A700',
          700: '#468700',
          800: '#356600',
          900: '#14532d',
        },
        surface: {
          DEFAULT: '#f9fafa',
          card:    '#ffffff',
          border:  '#e5e5e5',
          muted:   '#f3f4f6',
        },
        duo: {
          blue: '#1CB0F6',
          blueShadow: '#1899D6',
          yellow: '#FFC800',
          yellowShadow: '#D4A400',
          red: '#FF4B4B',
          redShadow: '#D80000',
          gray: '#E5E5E5',
          grayShadow: '#CECECE'
        },
        ink: {
          DEFAULT: '#374151',
          light:   '#4b5563',
          muted:   '#777777',
          faint:   '#afafaf',
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
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,107,26,0.15), transparent)',
        'warm-glow': 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,180,100,0.2), transparent)',
      },
    },
  },
  plugins: [],
};
