import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  site: 'https://caloriebot.ai',  // Set the production site URL
  server: {
    host: '0.0.0.0',  // Allow external connections
  }
});