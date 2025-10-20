import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [
    tailwind(),
    mdx(),
  ],
  adapter: netlify(),
  output: 'static', // Static site generation for best performance
  site: 'https://caloriebot.ai',
  trailingSlash: 'always',
  outDir: './dist',
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
  markdown: {
    shikiConfig: {
      theme: 'dracula',
      wrap: true
    }
  }
});