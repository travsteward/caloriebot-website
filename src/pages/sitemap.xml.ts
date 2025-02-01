import type { APIRoute } from 'astro';

const pages = [
  '',
  'pricing',
  'for-admins',
  'for-creators',
  'for-coaches',
  'monetize',
  'terms',
  'privacy',
  'blog'
];

const blogPosts = [
  'build-engaged-fitness-community-discord',
  'ai-photo-calorie-tracking-future',
  'monetizing-fitness-community-guide'
];

const baseUrl = 'https://caloriebot.net'; // Replace with your actual domain

export const GET: APIRoute = async () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${pages.map(page => `
        <url>
          <loc>${baseUrl}/${page}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
          <priority>${page === '' ? '1.0' : '0.8'}</priority>
        </url>
      `).join('')}
      ${blogPosts.map(post => `
        <url>
          <loc>${baseUrl}/blog/${post}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>monthly</changefreq>
          <priority>0.7</priority>
        </url>
      `).join('')}
    </urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};