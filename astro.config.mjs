import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions'; // Keep this line
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  adapter: netlify(), // Keep this line
  site: 'https://caloriebot.ai',
});