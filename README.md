# Outset Sites

The marketing site and blog for [outsetsites.com](https://outsetsites.com/), rebuilt from
WordPress/Divi onto Astro.

## Why this stack

The site is a brochure plus a blog. The priorities are fast pages, correct metadata and
frictionless writing, not application machinery.

| Layer | Choice | Why |
|---|---|---|
| Framework | Astro 7 | Static HTML, zero JavaScript by default |
| Islands | Preact (`compat` on) | About 4 KB for the contact form and the phone menu |
| Content | MDX + content collections | Typed, validated at build time |
| Styling | Tailwind v4 | CSS-first tokens in `src/styles/global.css` |
| Forms | Cloudflare Worker + SendGrid | The only server-side code in the repo |
| Hosting | Cloudflare Workers (static assets) | Nothing to patch |

## Getting started

```bash
npm install
npm run dev        # http://localhost:4321
```

| Script | Does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serve the built site locally |
| `npm run qa` | Type check, build, unit tests, then the page audit. Run before every push. |
| `npm run check:rendered` | Playwright checks against a running preview |

## Writing a blog post

Posts are MDX files in `src/content/blog/`. The filename is the URL.

```mdx
---
title: "Why Every Small Business Needs A Blog"     # 10 to 60 characters
description: "Four reasons a blog about…"           # 70 to 160 characters
pubDate: 2026-01-14
category: blogging-guides                           # see src/content.config.ts
tags: ["blogging", "small-business-web-design"]
heroImage: "why-arent-you-blogging.jpg"             # file in src/assets/blog/
heroAlt: "Sign that says Why Aren't You Blogging"
---

Write in Markdown. A sentence with a source.<Cite n="1" />

<Figure src="plumber.jpg" alt="A plumber checking under a sink for a leak" float="left" />

<Video id="vc3uGc6TSH0" title="How to use internal linking for SEO" />

## References

<RefNum n="1" /> Author. "Title." *Publication*, date, URL.
```

These rules are enforced at build time. A title over 60 characters or a missing description
fails the build with a readable error rather than shipping a page that quietly ranks badly.

## Deploying

Pushing `main` runs `.github/workflows/deploy.yml`: type check, build, tests, audit, then a
deploy to Cloudflare Workers once the repository has `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` as secrets. Until those exist, every push is verified and nothing is
published. The contact form additionally needs `SENDGRID_API_KEY` and `CONTACT_TO_EMAIL`
set as Worker secrets (`wrangler secret put …`).

`public/_redirects` keeps every old WordPress URL working: feeds, the empty categories, the
Divi project placeholders and the admin paths.

See `CLAUDE.md` for the house rules on content.
