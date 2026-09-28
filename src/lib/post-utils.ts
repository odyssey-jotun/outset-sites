/**
 * Pure helpers for blog data. Structurally typed and free of `astro:content`
 * imports so they can be unit tested without the Astro runtime.
 */

export interface PostLike {
  id: string;
  data: { category: string; tags: string[]; pubDate: Date };
}

/** Human-readable names for the category slugs used in frontmatter. */
export const CATEGORY_LABELS: Record<string, string> = {
  'blogging-guides': 'Blogging Guides',
  'web-design': 'Web Design',
  general: 'General',
};

export const categoryLabel = (slug: string): string =>
  CATEGORY_LABELS[slug] ?? slug.replace(/-/g, ' ');

/** Human-readable names for tags, where the slug alone reads badly. */
export const TAG_LABELS: Record<string, string> = {
  'blog-for-a-small-business': 'Blog for a Small Business',
  blogging: 'Blogging',
  'blogging-guides': 'Blogging Guides',
  'plumber-blog': 'Plumber Blog',
  'small-business-web-design': 'Small Business Web Design',
};

/** Turn a tag slug into a display label. */
export const tagLabel = (slug: string): string =>
  TAG_LABELS[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Reading time in minutes, at 225 words per minute. */
export const readingTime = (body: string): number =>
  Math.max(1, Math.round((body ?? '').trim().split(/\s+/).filter(Boolean).length / 225));

/**
 * Posts related to `post`, scored by shared tags (weighted) then category.
 * Ties break toward the more recent post.
 */
export function relatedPosts<T extends PostLike>(post: T, all: T[], limit = 3): T[] {
  const tags = new Set(post.data.tags);
  return all
    .filter((p) => p.id !== post.id)
    .map((p) => ({
      post: p,
      score:
        p.data.tags.filter((t) => tags.has(t)).length * 2 +
        (p.data.category === post.data.category ? 1 : 0),
    }))
    .filter((x) => x.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.post.data.pubDate.getTime() - a.post.data.pubDate.getTime()
    )
    .slice(0, limit)
    .map((x) => x.post);
}

/** Format a date for display, in the site's single locale. */
export const formatDate = (d: Date): string =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
