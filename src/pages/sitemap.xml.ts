import type { APIRoute } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

// Static pages that should always be included
const staticPages = [
  '',
  'pricing',
  'for-admins',
  'for-creators',
  'for-coaches',
  'monetize',
  'terms',
  'privacy',
  'user-guide',
  'blog',
  'enterprise',
  'affiliate',
  'success',
  'cancel',
  'device-success',
  'stripe-success',
  'social-test',
  'features',
  'getting-started',
  'commands',
  'faq',
  'docs'
];

// Blog post metadata cache
const blogPostsCache = new Map();

const baseUrl = 'https://caloriebot.ai';
const siteName = 'CalorieBot - AI Fitness for Discord';

async function getFileLastModified(filePath: string): Promise<string> {
  try {
    if (filePath.endsWith('blog.astro')) {
      filePath = filePath.replace('blog.astro', 'blog/index.astro');
    }

    const stats = await fs.stat(filePath);
    return stats.mtime.toISOString();
  } catch (error) {
    console.error(`Error getting last modified date for ${filePath}:`, error);
    return new Date().toISOString();
  }
}

async function discoverAllPages(): Promise<string[]> {
  try {
    // Find all .astro files in pages directory
    const astroFiles = await glob('src/pages/**/*.astro', { cwd: process.cwd() });

    const pages = astroFiles
      .map(file => {
        // Normalize path separators and convert file path to URL path
        const normalizedFile = file.replace(/\\/g, '/');
        let urlPath = normalizedFile.replace('src/pages/', '').replace('.astro', '');

        // Handle index files
        if (urlPath.endsWith('/index')) {
          urlPath = urlPath.replace('/index', '');
        }

        // Skip API routes and special files
        if (urlPath.includes('.xml') || urlPath.includes('.json') || urlPath.includes('.txt')) {
          return null;
        }

        return urlPath || '';
      })
      .filter(Boolean) as string[];

    // Remove duplicates and sort
    return [...new Set([...staticPages, ...pages])].sort();
  } catch (error) {
    console.error('Error discovering pages:', error);
    return staticPages;
  }
}

async function discoverBlogPosts(): Promise<any[]> {
  try {
    // Find all .md files in blog directory
    const blogFiles = await glob('src/pages/blog/*.md', { cwd: process.cwd() });

    const posts = await Promise.all(blogFiles.map(async (file) => {
      const slug = path.basename(file, '.md');

      // Skip test posts
      if (slug.includes('test')) {
        return null;
      }

      try {
        // Read frontmatter from markdown file
        const content = await fs.readFile(path.join(process.cwd(), file), 'utf-8');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          const titleMatch = frontmatter.match(/title:\s*["']?([^"'\n]+)["']?/);
          const imageMatch = frontmatter.match(/image:\s*["']?([^"'\n]+)["']?/);
          const categoryMatch = frontmatter.match(/category:\s*["']?([^"'\n]+)["']?/);

          return {
            slug,
            title: titleMatch ? titleMatch[1] : slug.replace(/-/g, ' '),
            image: imageMatch ? imageMatch[1] : '/blog/default.svg',
            imageAlt: titleMatch ? titleMatch[1] : slug.replace(/-/g, ' '),
            category: categoryMatch ? categoryMatch[1] : 'General'
          };
        }
      } catch (error) {
        console.error(`Error reading blog post ${file}:`, error);
      }

      // Fallback metadata
      return {
        slug,
        title: slug.replace(/-/g, ' '),
        image: '/blog/default.svg',
        imageAlt: slug.replace(/-/g, ' '),
        category: 'General'
      };
    }));

    return posts.filter(Boolean);
  } catch (error) {
    console.error('Error discovering blog posts:', error);
    return [];
  }
}

export const GET: APIRoute = async () => {
  // Discover all pages and blog posts dynamically
  const pages = await discoverAllPages();
  const blogPosts = await discoverBlogPosts();

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
            xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
      ${await Promise.all(pages.map(async page => {
        // Handle special cases for file paths
        let filePath;
        if (page === '') {
          filePath = path.join(process.cwd(), 'src', 'pages', 'index.astro');
        } else if (page === 'blog') {
          filePath = path.join(process.cwd(), 'src', 'pages', 'blog', 'index.astro');
        } else if (page === 'docs') {
          filePath = path.join(process.cwd(), 'src', 'pages', 'docs', 'index.astro');
        } else {
          filePath = path.join(process.cwd(), 'src', 'pages', `${page}.astro`);
        }

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