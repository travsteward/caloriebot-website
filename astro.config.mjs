import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    tailwind(),
    starlight({
      title: 'CalorieBot Documentation',
      description: 'Documentation for CalorieBot - AI-powered calorie tracking and fitness community management for Discord',
      defaultLocale: 'en',
      locales: {
        en: {
          label: 'English',
        },
      },
      customCss: ['./src/styles/docs.css'],
      social: {
        github: 'https://github.com/caloriebot',
        discord: 'https://discord.gg/caloriebot',
      },
      head: [
        {
          tag: 'meta',
          attrs: {
            name: 'robots',
            content: 'noindex, nofollow'
          }
        },
        {
          tag: 'meta',
          attrs: {
            name: 'googlebot',
            content: 'noindex, nofollow'
          }
        },
        {
          tag: 'link',
          attrs: {
            rel: 'icon',
            href: '/favicon.ico',
          },
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/caloriebot/docs/edit/main',
      },
      lastUpdated: true,
      pagination: true,
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', link: '/getting-started/installation' },
            { label: 'Configuration', link: '/getting-started/configuration' },
            { label: 'Inviting Members', link: '/getting-started/inviting-members' },
          ],
        },
        {
          label: 'Features',
          items: [
            { label: 'Photo Tracking', link: '/features/photo-tracking' },
            { label: 'Natural Language', link: '/features/natural-language' },
            { label: 'Workouts', link: '/features/workouts' },
            { label: 'Challenges', link: '/features/challenges' },
          ],
        },
        {
          label: 'Commands',
          items: [
            { label: 'Nutrition Commands', link: '/commands#nutrition-commands' },
            { label: 'Workout Commands', link: '/commands#workout-commands' },
            { label: 'Challenge Commands', link: '/commands#challenge-commands' },
          ],
        },
        {
          label: 'FAQ',
          items: [
            { label: 'General Questions', link: '/faq#general-questions' },
            { label: 'Technical Questions', link: '/faq#technical-questions' },
            { label: 'Feature Questions', link: '/faq#feature-questions' },
          ],
        },
      ],
    }),
    mdx(),
  ],
  adapter: netlify(),
  site: 'https://caloriebot.ai',
  trailingSlash: 'always',
  outDir: './dist',
  markdown: {
    shikiConfig: {
      theme: 'dracula',
      wrap: true
    }
  }
});