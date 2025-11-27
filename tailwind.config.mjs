/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        discord: '#5865F2',
        primary: {
          DEFAULT: '#5865F2',
          hover: '#4752C4',
        },
        // Modern Zinc-based dark theme
        dark: {
          DEFAULT: '#09090B', // Main background
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B', // Secondary background
          950: '#09090B',
        },
        // Aliases for existing classes to maintain compatibility but improve look
        secondary: '#18181B', // Zinc 900 instead of #2C2F33

        brand: {
          orange: '#F97316',
          blue: '#3B82F6',
          purple: '#8B5CF6',
          green: '#10B981',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-mesh': 'radial-gradient(at 40% 20%, hsla(255,100%,58%,0.1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(340,100%,76%,0.1) 0px, transparent 50%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ]
}