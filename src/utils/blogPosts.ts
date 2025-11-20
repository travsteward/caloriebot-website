// Utility to get all blog posts for related posts functionality

export interface BlogPost {
  title: string;
  slug: string;
  description: string;
  publishedDate: string;
  author: string;
  authorImage: string;
  coverImage: string;
  coverImageAlt: string;
  tags: string[];
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const allPosts = await import.meta.glob('../pages/blog/*.md', { eager: true });
  
  return Object.entries(allPosts).map(([path, post]: [string, any]) => {
    const slug = path.replace('../pages/blog/', '').replace('.md', '');
    const frontmatter = post.frontmatter || {};

    return {
      title: frontmatter.title || 'Untitled',
      slug: slug,
      description: frontmatter.description || '',
      publishedDate: frontmatter.publishedDate || '2024-01-01',
      author: frontmatter.author || 'Travis',
      authorImage: frontmatter.authorImage || '/avatars/metatrav.png',
      coverImage: frontmatter.coverImage || '/blog/covers/thriving_community.png',
      coverImageAlt: frontmatter.coverImageAlt || frontmatter.title || '',
      tags: frontmatter.tags || []
    };
  });
}

export function getRelatedPosts(currentSlug: string, allPosts: BlogPost[], limit: number = 3): BlogPost[] {
  const currentPost = allPosts.find(p => p.slug === currentSlug);
  if (!currentPost) return [];

  // Score posts by tag overlap and recency
  const scored = allPosts
    .filter(p => p.slug !== currentSlug)
    .map(post => {
      const tagOverlap = post.tags.filter(tag => currentPost.tags.includes(tag)).length;
      const daysSincePublished = Math.floor(
        (Date.now() - new Date(`${post.publishedDate}T12:00:00Z`).getTime()) / (1000 * 60 * 60 * 24)
      );
      const recencyScore = Math.max(0, 30 - daysSincePublished) / 30; // Favor posts from last 30 days
      
      return {
        post,
        score: tagOverlap * 2 + recencyScore
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.post);

  return scored;
}

