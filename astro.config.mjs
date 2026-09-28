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

  // Lato is the one face on the site, served from our own origin. Astro
  // downloads the files at build time and emits the @font-face rules inline,
  // so the browser never waits on fonts.googleapis.com before painting.
  // Lato only exists at 100/300/400/700/900; the old theme asked for 500 and
  // 600 and got them synthesised. 400 and 700 are the real ones.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Lato',
      cssVariable: '--font-lato',
      weights: [400, 700],
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
