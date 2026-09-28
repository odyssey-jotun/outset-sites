/**
 * Rewrites a finished build to live under a sub-path, for the GitHub Pages
 * preview at https://odyssey-jotun.github.io/outset-sites/.
 *
 * Every link in the source is written against the real site root, which is
 * what the live site needs. Rather than thread a base path through every
 * component for the sake of a preview, this pass prefixes the root-relative
 * URLs in the built HTML, CSS and JS after the fact, and marks every page
 * noindex so the preview never competes with outsetsites.com in search.
 *
 *   npm run build && node scripts/build-preview.mjs /outset-sites
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve(import.meta.dirname, '../dist');
const BASE = (process.argv[2] ?? '').replace(/\/$/, '');
if (!BASE.startsWith('/')) {
  console.error('Usage: node scripts/build-preview.mjs /sub-path');
  process.exit(1);
}

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else out.push(full);
  }
  return out;
}

const prefixed = (url) => (url.startsWith(`${BASE}/`) ? url : `${BASE}${url}`);
let touched = 0;

for (const file of await walk(DIST)) {
  const ext = path.extname(file);
  if (!['.html', '.css', '.js', '.xml', '.txt'].includes(ext)) continue;
  let text = await readFile(file, 'utf8');
  const before = text;

  if (ext === '.html') {
    // href="/x", src="/x", srcset="/x …", data-src="/x". Protocol-relative
    // "//" and already-prefixed paths are left alone.
    text = text.replace(/\b(href|src|srcset|data-src|poster)="\/(?!\/)/g, (_, a) => `${a}="${BASE}/`);
    // Later candidates in a srcset list.
    text = text.replace(/,\s*\/(?=_astro\/)/g, `, ${BASE}/`);
    // Root-relative URLs inside island props, which hydrate the phone menu.
    text = text.replace(/(&quot;href&quot;:\[0,&quot;)\/(?!\/)/g, `$1${BASE}/`);
    // Inline style backgrounds.
    text = text.replace(/url\(\/(?!\/)/g, `url(${BASE}/`);
    // The preview is not the site.
    if (!/name="robots"/.test(text)) {
      text = text.replace('</head>', '<meta name="robots" content="noindex, nofollow" />\n</head>');
    }
  } else if (ext === '.css') {
    text = text.replace(/url\(\/(?!\/)/g, `url(${BASE}/`);
  } else if (ext === '.js') {
    text = text.replace(/(["'`])\/api\//g, `$1${BASE}/api/`);
  } else if (ext === '.txt' && path.basename(file) === 'robots.txt') {
    text = 'User-agent: *\nDisallow: /\n';
  }

  if (text !== before) {
    await writeFile(file, text);
    touched++;
  }
}
// GitHub Pages serves a 404.html at the root for unknown routes.
console.log(`Prefixed ${touched} files with ${BASE}`);
