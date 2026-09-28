import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Blog posts. The schema is deliberately strict: a post that would ship a
 * bad <title> or meta description fails the build instead of quietly
 * ranking badly. If a title is too long, shorten the title. Never widen the
 * limit to make a build pass.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().min(10).max(60),
    description: z.string().min(70).max(160),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(['blogging-guides', 'web-design', 'general']),
    tags: z.array(z.string()).default([]),
    /** Bare filename of an image in src/assets/blog/. */
    heroImage: z.string().optional(),
    /** Alt text for the hero, required whenever there is one. */
    heroAlt: z.string().optional(),
    /** Who wrote it, as shown on the page. */
    author: z.string().default('Marc Gray'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
