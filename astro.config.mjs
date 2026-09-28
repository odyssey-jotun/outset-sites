// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import rehypeSlug from 'rehype-slug';
import rehypeExternalLinks from 'rehype-external-links';

export const SITE = 'https://outsetsites.com';

export default defineConfig({
  site: SITE,
  // Fully static output. No server, no adapter, no runtime to patch. The
  // only server code is worker/index.ts, and it handles /api/* alone.
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    preact({ compat: true }),
    sitemap({ filter: (page) => !page.includes('/404') }),
  ],
  vite: { plugins: [tailwindcss()] },

  // Two faces, served from our own origin: Bricolage Grotesque carries the
  // headlines and Inter carries everything else. Astro downloads the files at
  // build time and emits the @font-face rules inline, so the browser never
  // waits on fonts.googleapis.com before painting. Real weights only.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Bricolage Grotesque',
      cssVariable: '--font-bricolage',
      weights: [500, 700, 800],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['Helvetica Neue', 'Arial', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: [400, 500, 600, 700],
      styles: ['normal', 'italic'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['Helvetica Neue', 'Arial', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    },
  ],

  image: { responsiveStyles: true },
  build: { format: 'directory' },
  markdown: {
    // Every heading gets an id, so the contents nav and deep links work.
    rehypePlugins: [
      rehypeSlug,
      // Off-site links open in a new tab so the reader keeps their place.
      [rehypeExternalLinks, {
        target: '_blank',
        rel: ['noopener', 'noreferrer'],
        protocols: ['http', 'https'],
      }],
    ],
    shikiConfig: { theme: 'github-light', wrap: true },
  },
});
