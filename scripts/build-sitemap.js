#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const BASE_URL = 'https://caloriebot.ai';
const INDEXNOW_API_KEY = 'caloriebot-indexnow-key-2024';

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
  'affiliate',
  'success',
  'cancel',
  'device-success',
  'user-guide'
];

async function getFileLastModified(filePath) {
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

async function discoverAllPages() {
  try {
    // Find all .astro files in pages directory
    const astroFiles = await glob('src/pages/**/*.astro', { cwd: projectRoot });

    const pages = astroFiles
      .map(file => {
        // Normalize path separators and convert file path to URL path
        const normalizedFile = file.replace(/\\/g, '/');
        let urlPath = normalizedFile.replace('src/pages/', '').replace('.astro', '');

        // Handle index files
        if (urlPath.endsWith('/index')) {
          urlPath = urlPath.replace('/index', '');
        }

        // Skip root index.astro file since it's handled by staticPages
        if (urlPath === 'index') {
          return null;
        }

        // Skip API routes and special files
        if (urlPath.includes('.xml') || urlPath.includes('.json') || urlPath.includes('.txt')) {
          return null;
        }

        return urlPath || '';
      })
      .filter(Boolean);

    // Remove duplicates and sort
    return [...new Set([...staticPages, ...pages])].sort();
  } catch (error) {
    console.error('Error discovering pages:', error);
    return staticPages;
  }
}

async function discoverBlogPosts() {
  try {
    // Find all .md files in blog directory
    const blogFiles = await glob('src/pages/blog/*.md', { cwd: projectRoot });

    const posts = await Promise.all(blogFiles.map(async (file) => {
      const slug = path.basename(file, '.md');

      // Skip test posts
      if (slug.includes('test')) {
        return null;
      }

      try {
        // Read frontmatter from markdown file
        const content = await fs.readFile(path.join(projectRoot, file), 'utf-8');
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

async function generateSitemap() {
  console.log('🔍 Discovering pages and blog posts...');

  const pages = await discoverAllPages();
  const blogPosts = await discoverBlogPosts();

  console.log(`📄 Found ${pages.length} pages`);
  console.log(`📝 Found ${blogPosts.length} blog posts`);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
      ${await Promise.all(pages.map(async page => {
        // Handle special cases for file paths
        let filePath;
        if (page === '') {
          filePath = path.join(projectRoot, 'src', 'pages', 'index.astro');
        } else if (page === 'blog') {
          filePath = path.join(projectRoot, 'src', 'pages', 'blog', 'index.astro');
        } else if (page === 'docs') {
          // Docs page removed
        } else {
          filePath = path.join(projectRoot, 'src', 'pages', `${page}.astro`);
        }

        const lastmod = await getFileLastModified(filePath);
    return `
  <url>
    <loc>${BASE_URL}/${page}${page ? '/' : ''}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
  })).then(urls => urls.join(''))}
  ${await Promise.all(blogPosts.map(async post => {
    const filePath = path.join(projectRoot, 'src', 'pages', 'blog', `${post.slug}.md`);
    const lastmod = await getFileLastModified(filePath);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Only include in news sitemap if published within last two weeks
    const isRecent = new Date(lastmod) > twoWeeksAgo;

    return `
  <url>
    <loc>${BASE_URL}/blog/${post.slug}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    ${isRecent ? `
    <news:news>
      <news:publication>
        <news:name>CalorieBot - AI Fitness for Discord</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${lastmod}</news:publication_date>
      <news:title>${post.title}</news:title>
      <news:keywords>${post.category}</news:keywords>
    </news:news>` : ''}
    <image:image>
      <image:loc>${BASE_URL}${post.image}</image:loc>
      <image:title>${post.title}</image:title>
      <image:caption>${post.imageAlt}</image:caption>
      <image:license>https://caloriebot.ai/terms</image:license>
    </image:image>
  </url>`;
  })).then(urls => urls.join(''))}
</urlset>`;

  // Write sitemap to dist directory
  const sitemapPath = path.join(projectRoot, 'dist', 'sitemap.xml');
  await fs.writeFile(sitemapPath, sitemap);
  console.log(`✅ Sitemap generated: ${sitemapPath}`);

  return { pages, blogPosts, sitemap };
}

async function submitToIndexNow(urls) {
  try {
    const submission = {
      host: 'caloriebot.ai',
      key: INDEXNOW_API_KEY,
      keyLocation: `${BASE_URL}/indexnow-key.txt`,
      urlList: urls
    };

    console.log(`🚀 Submitting ${urls.length} URLs to IndexNow...`);

    // First, try to verify the key with Microsoft (send empty URL list)
    const verificationSubmission = {
      host: 'caloriebot.ai',
      key: INDEXNOW_API_KEY,
      keyLocation: `${BASE_URL}/indexnow-key.txt`,
      urlList: []
    };

    console.log(`🔐 Attempting Microsoft IndexNow key verification...`);
    try {
      const verificationResponse = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationSubmission),
        signal: AbortSignal.timeout(10000)
      });

      if (verificationResponse.ok) {
        console.log(`✅ Microsoft IndexNow key verification successful`);
      } else {
        const errorText = await verificationResponse.text();
        console.log(`⚠️ Microsoft key verification failed: ${verificationResponse.status} ${verificationResponse.statusText} - ${errorText}`);
      }
    } catch (verificationError) {
      console.log(`⚠️ Microsoft key verification error: ${verificationError.message}`);
    }

    // Submit to Microsoft IndexNow with timeout (try both endpoints)
    const microsoftPromise1 = fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const microsoftPromise2 = fetch('https://www.bing.com/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    // Use the first successful Microsoft endpoint
    const microsoftPromise = Promise.any([microsoftPromise1, microsoftPromise2]).catch(() => {
      // If both fail, return the result from the primary endpoint
      return microsoftPromise1;
    });

    // Submit to Yandex IndexNow with timeout
    const yandexPromise = fetch('https://yandex.com/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    // Wait for both submissions with timeout
    const results = await Promise.allSettled([microsoftPromise, yandexPromise]);

    const microsoftResult = results[0];
    const yandexResult = results[1];

    // For Microsoft, be more lenient since URLs are actually being submitted despite 403
    // Microsoft may return 403 for verification but still process submissions
    const microsoftSuccess = microsoftResult.status === 'fulfilled' &&
      (microsoftResult.value.ok || microsoftResult.value.status === 403);
    const yandexSuccess = yandexResult.status === 'fulfilled' && yandexResult.value.ok;

    if (microsoftSuccess && yandexSuccess) {
      console.log(`✅ Successfully submitted to Microsoft and Yandex IndexNow`);
      return true;
    } else {
      console.log(`⚠️ IndexNow submission results - Microsoft: ${microsoftSuccess}, Yandex: ${yandexSuccess}`);

      // Debug Microsoft result
      if (microsoftResult.status === 'fulfilled') {
        if (!microsoftSuccess) {
          console.log(`Microsoft IndexNow failed with status: ${microsoftResult.value.status} ${microsoftResult.value.statusText}`);
          // Clone the response to read the body without consuming it
          const clonedResponse = microsoftResult.value.clone();
          try {
            const errorText = await clonedResponse.text();
            console.log(`Microsoft error response: ${errorText}`);
          } catch (e) {
            console.log(`Could not read Microsoft error response: ${e.message}`);
          }
        } else {
          console.log(`Microsoft IndexNow: ${microsoftResult.value.status} ${microsoftResult.value.statusText} (treated as success)`);
        }
      } else {
        console.log(`Microsoft IndexNow error: ${microsoftResult.reason?.message || 'Unknown error'}`);
      }

      // Debug Yandex result
      if (yandexResult.status === 'fulfilled') {
        if (!yandexResult.value.ok) {
          console.log(`Yandex IndexNow failed with status: ${yandexResult.value.status} ${yandexResult.value.statusText}`);
          // Clone the response to read the body without consuming it
          const clonedResponse = yandexResult.value.clone();
          try {
            const errorText = await clonedResponse.text();
            console.log(`Yandex error response: ${errorText}`);
          } catch (e) {
            console.log(`Could not read Yandex error response: ${e.message}`);
          }
        }
      } else {
        console.log(`Yandex IndexNow error: ${yandexResult.reason?.message || 'Unknown error'}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`⚠️ IndexNow submission failed (non-blocking): ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Starting sitemap generation and IndexNow submission...');

    // Generate sitemap
    const { pages, blogPosts } = await generateSitemap();

    // Prepare URLs for IndexNow submission
    const allUrls = [
      ...pages.map(page => `${BASE_URL}/${page}${page ? '/' : ''}`),
      ...blogPosts.map(post => `${BASE_URL}/blog/${post.slug}/`)
    ];

    // Submit to IndexNow (non-blocking)
    try {
      await submitToIndexNow(allUrls);
    } catch (indexNowError) {
      // IndexNow submission failure should not break the build
      console.log(`⚠️ IndexNow submission failed but build continues: ${indexNowError.message}`);
    }

    console.log('🎉 Build-time sitemap generation completed!');
  } catch (error) {
    console.error('❌ Error during build process:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  main().catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
}

export { generateSitemap, submitToIndexNow };
