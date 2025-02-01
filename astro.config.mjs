import { defineConfig } from 'astro/config';
import { netlify } from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [
    tailwind(),
    mdx()
  ],
  adapter: netlify({
    imageCDN: true
  }),
  site: 'https://caloriebot.ai',
  markdown: {
    shikiConfig: {
      theme: 'dracula',
      wrap: true
    }
  }
});