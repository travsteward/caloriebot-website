import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';

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
  {
    slug: 'build-engaged-fitness-community-discord',
    image: '/blog/community-building.svg',
    title: 'How to Build an Engaged Fitness Community on Discord',
    imageAlt: 'Building a Discord fitness community illustration',
    category: 'Community Building'
  },
  {
    slug: 'ai-photo-calorie-tracking-future',
    image: '/blog/ai-tracking.svg',
    title: 'The Future of AI Photo Calorie Tracking',
    imageAlt: 'AI-powered food recognition illustration',
    category: 'Technology'
  },
  {
    slug: 'monetizing-fitness-community-guide',
    image: '/blog/monetization.svg',
    title: 'Complete Guide to Monetizing Your Fitness Community',
    imageAlt: 'Fitness community monetization strategies illustration',
    category: 'Business'
  }
];

const baseUrl = 'https://caloriebot.ai';
const siteName = 'CalorieBot - AI Fitness for Discord';

async function getFileLastModified(filePath: string): Promise<string> {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtime.toISOString();
  } catch (error) {
    console.error(`Error getting last modified date for ${filePath}:`, error);
    return new Date().toISOString();
  }
}

export const GET: APIRoute = async () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
            xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
      ${await Promise.all(pages.map(async page => {
        const filePath = path.join(process.cwd(), 'src', 'pages', page ? `${page}.astro` : 'index.astro');
        const lastmod = await getFileLastModified(filePath);
        return `
          <url>
            <loc>${baseUrl}/${page}${page ? '/' : ''}</loc>
            <lastmod>${lastmod}</lastmod>
            <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
            <priority>${page === '' ? '1.0' : '0.8'}</priority>
          </url>
        `;
      })).then(urls => urls.join(''))}
      ${await Promise.all(blogPosts.map(async post => {
        const filePath = path.join(process.cwd(), 'src', 'pages', 'blog', `${post.slug}.md`);
        const lastmod = await getFileLastModified(filePath);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        // Only include in news sitemap if published within last two weeks
        const isRecent = new Date(lastmod) > twoWeeksAgo;

        return `
          <url>
            <loc>${baseUrl}/blog/${post.slug}/</loc>
            <lastmod>${lastmod}</lastmod>
            <changefreq>monthly</changefreq>
            <priority>0.7</priority>
            ${isRecent ? `
            <news:news>
              <news:publication>
                <news:name>${siteName}</news:name>
                <news:language>en</news:language>
              </news:publication>
              <news:publication_date>${lastmod}</news:publication_date>
              <news:title>${post.title}</news:title>
              <news:keywords>${post.category}</news:keywords>
            </news:news>` : ''}
            <image:image>
              <image:loc>${baseUrl}${post.image}</image:loc>
              <image:title>${post.title}</image:title>
              <image:caption>${post.imageAlt}</image:caption>
              <image:license>https://caloriebot.ai/terms</image:license>
            </image:image>
          </url>
        `;
      })).then(urls => urls.join(''))}
    </urlset>`;

  // Calculate ETag based on content
  const etag = Buffer.from(sitemap).toString('base64').substring(0, 27);

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      'ETag': `"${etag}"`,
      'Last-Modified': new Date().toUTCString()
    }
  });
};