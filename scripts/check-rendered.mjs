/**
 * Rendered-page checks. The static audit reads HTML; this drives a real
 * browser, which is the only way to catch things the markup looks fine for:
 * images that fail to decode, horizontal overflow on a phone, runtime
 * errors, and a stretched link that swallows the page.
 *
 *   npm run preview            # in another terminal
 *   npm run check:rendered     # or BASE=https://… npm run check:rendered
 */
import { chromium, devices } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:4321';

const ROUTES = [
  '/', '/blog/', '/portfolio/', '/category/blogging-guides/', '/tag/blogging/',
  '/why-every-small-business-needs-a-blog/', '/small-business-guide-to-wordpress-blog-posts/',
  '/no-such-page/',
];

const VIEWPORTS = [
  ['desktop', { viewport: { width: 1440, height: 1000 } }],
  ['tablet', { viewport: { width: 834, height: 1112 } }],
  ['mobile', { ...devices['iPhone 14 Pro'] }],
];

const failures = [];
const browser = await chromium.launch();
console.log(`Rendered checks against ${BASE}\n`);

for (const [label, options] of VIEWPORTS) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', (e) => runtimeErrors.push(String(e).slice(0, 100)));
  let failedRequests = [];
  page.on('response', (r) => {
    if (r.status() >= 400 && /\.(webp|png|jpe?g|gif|svg|avif|mp4)$/i.test(new URL(r.url()).pathname)) {
      failedRequests.push(`${r.status()} ${new URL(r.url()).pathname}`);
    }
  });
  page.on('requestfailed', (r) => {
    if (r.resourceType() === 'image') failedRequests.push(`failed ${new URL(r.url()).pathname}`);
  });

  let clean = 0;
  for (const route of ROUTES) {
    failedRequests = [];
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(async () => {
      await Promise.all(
        [...document.images].map((img) =>
          img.complete ? null : new Promise((resolve) => {
            const done = () => resolve(undefined);
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
            setTimeout(done, 10000);
          })
        )
      );
    });

    const result = await page.evaluate(() => {
      const rogue = [];
      for (const a of document.querySelectorAll('a')) {
        if (getComputedStyle(a, '::after').position !== 'absolute') continue;
        let node = a.parentElement;
        let anchorBox = null;
        while (node && node !== document.body) {
          if (getComputedStyle(node).position !== 'static') { anchorBox = node.getBoundingClientRect(); break; }
          node = node.parentElement;
        }
        const height = anchorBox ? anchorBox.height : document.documentElement.scrollHeight;
        if (!anchorBox || height > 1000) rogue.push(`${a.getAttribute('href')} overlay ${Math.round(height)}px`);
      }
      const broken = [...document.images]
        .filter((i) => i.complete && i.naturalWidth === 0 && !i.loading)
        .map((i) => i.currentSrc || i.src);
      return {
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        broken,
        rogue,
        title: document.title,
      };
    });

    const issues = [];
    if (result.overflow) issues.push(`horizontal overflow ${result.scrollWidth}px in ${result.clientWidth}px`);
    if (result.broken.length) issues.push(`broken images: ${result.broken.join(', ')}`);
    if (result.rogue.length) issues.push(`stretched links covering the page: ${result.rogue.join('; ')}`);
    if (failedRequests.length) issues.push(`failed requests: ${failedRequests.join(', ')}`);
    if (runtimeErrors.length) issues.push(`runtime errors: ${runtimeErrors.splice(0).join('; ')}`);
    if (issues.length) failures.push(`[${label}] ${route}\n    ${issues.join('\n    ')}`);
    else clean++;
  }
  console.log(`${label}: ${clean}/${ROUTES.length} routes clean`);
  await context.close();
}
await browser.close();

if (failures.length) {
  console.log('\n' + failures.join('\n\n'));
  process.exit(1);
}
console.log('\nNo rendered problems found.');
