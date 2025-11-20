import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [
    tailwind(),
    mdx(),
  ],
  output: 'static', // Static site generation for best performance
  site: 'https://caloriebot.ai',
  trailingSlash: 'always',
  outDir: './dist',
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    },
    domains: ['caloriebot.ai'],
    remotePatterns: [{ protocol: 'https' }],
  },
  build: {
    inlineStylesheets: 'never', // Disable inline stylesheets to prevent caching issues
  },
  compressHTML: false, // Disable HTML compression to ensure fresh content
  markdown: {
    shikiConfig: {
      theme: 'dracula',
      wrap: true
    }
  }
});