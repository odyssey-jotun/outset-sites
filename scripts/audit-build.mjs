/**
 * Static audit of every built page. Catches the failure modes a spot check
 * misses: images pointing at paths that do not exist, internal links to
 * routes that were never generated, in-page anchors with no target,
 * component tags that leaked into the output as text, page-builder debris,
 * and pages with no usable title or description.
 *
 *   npm run build && npm run audit
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(import.meta.dirname, '../dist');

async function walk(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const routeExists = (href) => {
  const clean = href.split(/[?#]/)[0];
  if (existsSync(path.join(DIST, clean))) return true;
  if (existsSync(path.join(DIST, clean, 'index.html'))) return true;
  if (existsSync(path.join(DIST, `${clean.replace(/\/$/, '')}.html`))) return true;
  return false;
};

/** The article body, bounded by its wrapper's real closing tag. */
function proseBody(html) {
  const open = /<div[^>]*class="[^"]*prose-outset[^"]*"[^>]*>/.exec(html);
  if (!open) return null;
  const start = open.index + open[0].length;
  const tag = /<(\/?)div\b[^>]*>/g;
  tag.lastIndex = start;
  let depth = 1;
  let m;
  while ((m = tag.exec(html)) !== null) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(start, m.index);
  }
  return html.slice(start);
}

// Google's guidance on links names this kind of filler as what to avoid.
const GENERIC_ANCHORS = new Set([
  'click here', 'here', 'this', 'this page', 'this post', 'this article',
  'read more', 'learn more', 'more', 'link', 'this link', 'check it out',
  'read this', 'find out more', 'see more', 'click', 'go here', 'website',
  'page', 'article', 'details', 'our website', 'last post', 'previous post',
  'next post', 'last article', 'previous article',
]);

const stripTags = (s) => s.replace(/<[^>]+>/g, '');
const anchorText = (s) =>
  stripTags(s).replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, ' ').trim();
const anchorKey = (s) => anchorText(s).toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
const isInternalHref = (href) => href.startsWith('/') && !href.startsWith('//');

// A selector that compiles to :where() matches nothing. It is the quietest
// possible CSS failure: no error, no warning, the rule simply never applies.
const cssFiles = (await readdir(path.join(DIST, '_astro')).catch(() => []))
  .filter((f) => f.endsWith('.css'));
const emptyWhere = [];
for (const name of cssFiles) {
  const css = await readFile(path.join(DIST, '_astro', name), 'utf8');
  const hits = css.match(/:where\(\s*\)/g);
  if (hits) emptyWhere.push(`${name}: ${hits.length} empty :where() selector(s)`);
}

const files = await walk(DIST);
if (files.length < 5) {
  // A run that audits nothing passes nothing. The site has more pages than
  // this, so an empty dist/ means the build failed before the audit ran.
  console.error(`Only ${files.length} built page(s) found in dist/. Run npm run build first.`);
  process.exit(1);
}
const problems = {
  emptyWhere, brokenImg: [], brokenLink: [], brokenAnchor: [], dupImg: [], heroDup: [],
  deadCTA: [], literalMd: [], dupHeading: [], hardToc: [], tocChrome: [], leakedJsx: [],
  debris: [], noTitle: [], longTitle: [], noDesc: [], emptyAlt: [], genericAnchor: [],
  urlAnchor: [], longAnchor: [], emptyAnchor: [],
};

const imageIdentity = (src) =>
  String(src).split('/').pop().replace(/\.[a-z0-9]+$/i, '')
    .replace(/-\d{2,5}x\d{2,5}$/i, '').replace(/\.[A-Za-z0-9_-]{8}$/, '').toLowerCase();

for (const file of files) {
  const rel = '/' + path.relative(DIST, file).replace(/index\.html$/, '');
  const html = await readFile(file, 'utf8');

  for (const m of html.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    const src = m[1];
    if (src.startsWith('data:') || src.startsWith('//') || /^https?:\/\//.test(src)) continue;
    if (!existsSync(path.join(DIST, src.split(/[?#]/)[0]))) problems.brokenImg.push(`${rel}  ->  ${src}`);
  }

  // Every image carries an alt attribute. Empty is allowed only where the
  // image is decorative and the surrounding text already names it.
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    // Astro prints an empty alt as a bare attribute, so `alt` alone counts.
    if (!/\salt(?:=|\s|>|$)/.test(m[0])) problems.emptyAlt.push(`${rel}  ->  ${(/src="([^"]+)"/.exec(m[0]) || [])[1]}`);
  }

  for (const m of html.matchAll(/<a[^>]+href="(\/[^"]*)"/g)) {
    const href = m[1];
    if (href.startsWith('//') || href.startsWith('/#')) continue;
    if (!routeExists(href)) problems.brokenLink.push(`${rel}  ->  ${href}`);
  }

  const prose = proseBody(html);
  if (prose) {
    const seenSrc = new Map();
    for (const m of prose.matchAll(/<img[^>]+src="(\/_astro\/[^"]+)"/g)) {
      seenSrc.set(m[1], (seenSrc.get(m[1]) ?? 0) + 1);
    }
    for (const [src, n] of seenSrc) {
      if (n > 1) problems.dupImg.push(`${rel}  ->  ${src.split('/').pop()} x${n}`);
    }
    const proseStart = html.indexOf('prose-outset');
    const heroMatch = /<img[^>]+src="(\/_astro\/[^"]+)"/.exec(html.slice(0, proseStart));
    const firstBody = /<img[^>]+src="(\/_astro\/[^"]+)"/.exec(prose);
    if (heroMatch && firstBody && imageIdentity(heroMatch[1]) === imageIdentity(firstBody[1])) {
      problems.heroDup.push(`${rel}  ->  ${imageIdentity(heroMatch[1])}`);
    }

    // Solicitations for a comment thread the rebuilt site does not have.
    if (/\b(?:leave|drop|share|post|let us know)\b[^.!?<]{0,80}\b(?:in the comments|comments section|comments below)\b/i.test(prose)) {
      problems.deadCTA.push(`${rel}  ->  comments`);
    }

    // Markdown that reached the browser as text.
    for (const m of prose.matchAll(/>[^<>]*?(?<![#\w])(#{2,6}\s+\w[^<>]{0,40})/g)) {
      problems.literalMd.push(`${rel}  ->  ${m[1].slice(0, 40)}`);
    }

    // A section that converted twice repeats both its heading and its body.
    const sections = [...prose.matchAll(/<h([2-3])[^>]*>([\s\S]*?)<\/h\1>([\s\S]*?)(?=<h[2-3][^>]*>|$)/g)]
      .map((m) => ({
        heading: stripTags(m[2]).replace(/\s+/g, ' ').trim().toLowerCase(),
        body: stripTags(m[3]).replace(/\s+/g, ' ').trim().slice(0, 400).toLowerCase(),
      }))
      .filter((x) => x.heading);
    const sectionSeen = new Set();
    for (const { heading, body } of sections) {
      const id = `${heading}::${body}`;
      if (sectionSeen.has(id)) problems.dupHeading.push(`${rel}  ->  ${heading.slice(0, 40)}`);
      sectionSeen.add(id);
    }
    // The same paragraph twice in a row is the WordPress guide's failure mode.
    const paras = [...prose.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => stripTags(m[1]).replace(/\s+/g, ' ').trim());
    for (let i = 1; i < paras.length; i++) {
      if (paras[i].length > 60 && paras[i] === paras[i - 1]) problems.dupHeading.push(`${rel}  ->  paragraph "${paras[i].slice(0, 40)}"`);
    }

    if (/<(?:h[2-6]|p|strong)[^>]*>\s*Table of Contents\s*<\/(?:h[2-6]|p|strong)>/i.test(prose)) problems.hardToc.push(rel);
    if (/Back to (?:Table of )?Contents/i.test(prose)) problems.tocChrome.push(rel);

    // Anchor text in the article body.
    for (const m of prose.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
      const hrefMatch = /href="([^"]*)"/.exec(m[1]);
      if (!hrefMatch) continue;
      const href = hrefMatch[1].trim();
      if (!href || /^(mailto:|tel:|javascript:)/i.test(href)) continue;
      const text = anchorText(m[2]);
      const key = anchorKey(m[2]);
      const internal = isInternalHref(href);
      const where = `${rel}  ->  ${href}`;
      if (!text) {
        const alt = /<img[^>]+alt="([^"]*)"/.exec(m[2]);
        if (internal && !(alt && alt[1].trim())) problems.emptyAnchor.push(where);
        continue;
      }
      if (GENERIC_ANCHORS.has(key)) problems.genericAnchor.push(`${where}  "${text.slice(0, 40)}"`);
      if (!internal) continue;
      if (/^(https?:\/\/|www\.)/i.test(text) || /^\/[a-z0-9][a-z0-9\-/]*\/?$/i.test(text)) {
        problems.urlAnchor.push(`${where}  "${text.slice(0, 40)}"`);
      }
      if (text.length > 100) problems.longAnchor.push(`${where}  ${text.length} chars`);
    }
  }

  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    if (m[1] && !ids.has(m[1])) problems.brokenAnchor.push(`${rel}  ->  #${m[1]}`);
  }

  for (const name of ['Figure', 'Video', 'Cite', 'RefNum', 'Button']) {
    if (html.includes(`&lt;${name}`)) problems.leakedJsx.push(`${rel}  ->  ${name}`);
  }

  for (const [label, re] of [
    ['divi shortcode', /\[\/?et_pb_/],
    ['forminator', /forminator/i],
    ['own wp-content path', new RegExp('(?<!//[\\w.-]{1,60})/wp-content/')],
    ['wp footnote anchor', /_ftn(?:ref)?\d/],
    ['PUA glyph', /[-]/],
    ['unescaped entity', /&#8\d{3};/],
  ]) {
    if (re.test(html)) problems.debris.push(`${rel}  ->  ${label}`);
  }

  const titleTag = /<title>([^<]{1,})<\/title>/.exec(html);
  if (!titleTag || titleTag[1].length < 5) problems.noTitle.push(rel);
  else {
    const shown = titleTag[1].replace(/&[a-z]+;/g, 'x').length;
    if (shown > 62) problems.longTitle.push(`${rel}  ->  ${shown} chars`);
  }
  if (!/<meta name="description" content="[^"]{40,}"/.test(html)) problems.noDesc.push(rel);
}

console.log(`Audited ${files.length} pages\n`);
let total = 0;
for (const [key, label] of [
  ['emptyWhere', 'CSS rules with an empty :where(), which match nothing'],
  ['brokenImg', 'Images pointing at a path that does not exist'],
  ['emptyAlt', 'Images with no alt attribute at all'],
  ['brokenLink', 'Internal links to routes that were not generated'],
  ['brokenAnchor', 'In-page anchors with no matching element'],
  ['dupImg', 'Same image repeated inside one article body'],
  ['heroDup', 'Hero image reprinted as the first picture in the body'],
  ['deadCTA', 'Calls to action whose destination no longer exists'],
  ['literalMd', 'Markdown that reached the browser as visible text'],
  ['dupHeading', 'The same section or paragraph rendered twice on one page'],
  ['hardToc', 'A contents list typed into the article body'],
  ['tocChrome', 'Old-theme contents back-links duplicating the built-in nav'],
  ['leakedJsx', 'Component tags that rendered as text'],
  ['debris', 'Page-builder debris left in the output'],
  ['noTitle', 'Pages with no usable <title>'],
  ['longTitle', 'Titles longer than a search result will display'],
  ['noDesc', 'Pages with no usable meta description'],
  ['genericAnchor', 'Links whose text does not say where they go'],
  ['urlAnchor', 'Internal links showing the address as the link text'],
  ['longAnchor', 'Internal links wrapping a whole sentence'],
  ['emptyAnchor', 'Internal links with no text and no image alt'],
]) {
  const list = [...new Set(problems[key])];
  total += list.length;
  console.log(`${list.length === 0 ? 'ok  ' : 'FAIL'}  ${label}: ${list.length}`);
  for (const item of list.slice(0, 12)) console.log(`        ${item}`);
  if (list.length > 12) console.log(`        … and ${list.length - 12} more`);
}
console.log(total === 0 ? '\nNo problems found.' : `\n${total} problem(s) found.`);
process.exit(total === 0 ? 0 : 1);
