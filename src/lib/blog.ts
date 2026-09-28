import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

export {
  CATEGORY_LABELS, categoryLabel, tagLabel, readingTime, relatedPosts, formatDate,
} from './post-utils';

/** Published posts, newest first. Drafts are excluded from production builds. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true
  );
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/** Every category slug that has at least one published post. */
export const getCategories = (posts: Post[]): string[] =>
  [...new Set(posts.map((p) => p.data.category))].sort();

/** Every tag slug that has at least one published post. */
export const getTags = (posts: Post[]): string[] =>
  [...new Set(posts.flatMap((p) => p.data.tags))].sort();
