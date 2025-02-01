/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        discord: '#5865F2',
        primary: '#7289DA',
        secondary: '#2C2F33',
        dark: '#23272A'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ]
}