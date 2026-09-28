import { describe, it, expect } from 'vitest';
import { categoryLabel, tagLabel, readingTime, relatedPosts, formatDate } from '../src/lib/post-utils';

const post = (id: string, tags: string[], category = 'blogging-guides', date = '2026-01-01') => ({
  id,
  data: { category, tags, pubDate: new Date(date) },
});

describe('labels', () => {
  it('maps known category slugs', () => {
    expect(categoryLabel('blogging-guides')).toBe('Blogging Guides');
  });
  it('falls back to the slug with spaces for an unknown category', () => {
    expect(categoryLabel('odd-slug')).toBe('odd slug');
  });
  it('maps known tag slugs, including the odd capitalisation the old site used', () => {
    expect(tagLabel('blog-for-a-small-business')).toBe('Blog for a Small Business');
  });
  it('title-cases an unknown tag', () => {
    expect(tagLabel('local-seo')).toBe('Local Seo');
  });
});

describe('readingTime', () => {
  it('never reports under one minute', () => {
    expect(readingTime('a few words')).toBe(1);
  });
  it('rounds at 225 words per minute', () => {
    expect(readingTime(Array(900).fill('word').join(' '))).toBe(4);
  });
});

describe('relatedPosts', () => {
  const a = post('a', ['blogging', 'seo']);
  const b = post('b', ['blogging'], 'blogging-guides', '2026-02-01');
  const c = post('c', ['seo', 'blogging'], 'web-design', '2026-01-15');
  const d = post('d', [], 'general');
  it('excludes the post itself', () => {
    expect(relatedPosts(a, [a, b, c, d]).map((p) => p.id)).not.toContain('a');
  });
  it('ranks shared tags above a shared category alone', () => {
    expect(relatedPosts(a, [a, b, c, d]).map((p) => p.id)).toEqual(['c', 'b']);
  });
  it('drops posts with nothing in common', () => {
    expect(relatedPosts(a, [a, b, c, d]).map((p) => p.id)).not.toContain('d');
  });
  it('respects the limit', () => {
    expect(relatedPosts(a, [a, b, c, d], 1)).toHaveLength(1);
  });
});

describe('formatDate', () => {
  it('formats in the site locale without timezone drift', () => {
    expect(formatDate(new Date('2026-04-26'))).toBe('Apr 26, 2026');
  });
});
