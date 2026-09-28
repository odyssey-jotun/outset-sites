# Working in this repository

## Who you are working with

Marc Gray co-owns Outset Web Design with Joe Green and writes its content. He knows his subject, small business marketing and blogging, and does not need to know Astro, git or Cloudflare.

- Explain in his terms, not the stack's. "The post is live at outsetsites.com/why-every-small-business-needs-a-blog" rather than "the build succeeded and the Worker deployed."
- Never show him a stack trace and ask what he wants to do. Read it, work out what it means, tell him in a sentence, and say what you propose.
- He cannot verify your work by reading the code. He can only look at the site. Check things yourself before telling him they are done, and be plain when you have not checked something.
- Ask before anything you cannot undo: deleting a post, changing a published URL, changing settings that affect the live site.

If a request is ambiguous, ask a short question in plain language rather than guessing.

## What this project is

Outset's own marketing site and blog, rebuilt from WordPress/Divi onto Astro. There is no database, no CMS and no admin dashboard. Every post is a file in this repository, which is why the site is fast and has nothing to keep patched.

| | |
|---|---|
| Framework | Astro, static output |
| Interactive bits | Preact islands: contact form and the phone menu |
| Content | MDX in `src/content/blog/` |
| Styling | Tailwind v4, tokens in `src/styles/global.css` |
| Server code | `worker/index.ts`, only `/api/contact` |
| Hosting | Cloudflare Workers, static assets served from the edge |

The site was cloned from outsetsites.com on 2026-09-28: homepage, showcase, blog and five posts. The three "test project" placeholders from the old Divi portfolio were not carried over; `/project/*` redirects to the showcase.

## Publishing

Pushing `main` is what publishes. GitHub runs the full gate (type check, build, tests, then the audit of every page) and deploys only if everything passes. The deploy step waits until the repository has the two Cloudflare secrets named in `.env.example`; until then every push is verified and nothing goes out.

The normal flow for a new post:

1. Write it in `src/content/blog/<slug>.mdx`, `draft: true` while it is in progress.
2. Show him a preview: `npm run dev`, then the local URL for that post.
3. When he is happy, run `npm run qa` and fix anything it reports.
4. Set `draft: false`, commit, push to `main`.
5. Confirm the page actually loads at its real URL and tell him the address.

## Conventions a post has to follow

These are settled house rules, carried over from Marc's other sites. Each one is here because it was got wrong once and he had to say so.

| | |
|---|---|
| Contact links | `/#contact`, the form on the homepage. `CONTACT_HREF` in `src/lib/site.ts` is the one place it is written. |
| Buttons | `Button.astro`. Slate is the primary action, blue the secondary, `inverse` on a blue band. |
| Links to other posts | Descriptive anchor text that says where the link goes. Never "click here", "this post" or "my guide to". The audit fails the build on generic anchors. |
| Citations | `<Cite n="1" />` in the sentence, `<RefNum n="1" />` at the start of the reference entry under a `## References` heading. |
| Images | `<Figure src="file.jpg" alt="…" />`, bare filename in `src/assets/blog/`. `float="left"` or `"right"` wraps text beside a square illustration. |
| Video | `<Video id="youtubeId" title="…" />`. Never a raw iframe. |
| Tables | Write markdown tables. `[...slug].astro` maps `table` to `Table.astro`, so a literal `<Table>` fails the build. |
| Headings | Carry the keyword. A heading that reads well and searches for nothing is half a heading. Do not type a contents list; the layout builds one from the headings when a post has five or more sections. |
| Structure | The phenomenon first, the plug at the end. |
| Bold | None inside a sentence in anything drafted for him. He bolds a whole line at most. |
| Antithesis | Never, in anything drafted for him: "It wasn't X, it was Y", "Not X, but Y". |
| Em dashes | None, anywhere, in anything written for or as Marc. Use a comma, a full stop or a colon. |

His existing five posts keep his own bolding and phrasing; the rules above are for new drafts.

## The frontmatter contract

The build fails rather than publishing when these are wrong. That is deliberate.

| Field | Rule |
|---|---|
| `title` | 10 to 60 characters. Google truncates past about 60. |
| `description` | 70 to 160 characters. This is the grey text under the search result. |
| `pubDate` | A date. |
| `updatedDate` | Optional. Add it for a meaningful revision. |
| `category` | One of `blogging-guides`, `web-design`, `general` (see `src/content.config.ts`). |
| `tags` | Slugs. Labels for the awkward ones live in `TAG_LABELS` in `src/lib/post-utils.ts`. |
| `heroImage` | A bare filename in `src/assets/blog/`. `heroAlt` is required with it. |
| `draft` | `true` keeps it off the site entirely. |

If a title is too long, shorten the title. Never widen the limit to make a build pass.

## Things that will bite

- The filename is the URL. `why-every-small-business-needs-a-blog.mdx` publishes at `/why-every-small-business-needs-a-blog/`. Renaming it later breaks every shared link and search result. If he wants a different URL after publishing, say what it costs and add a redirect.
- Images go in `src/assets/blog/`. At least 800px wide for anything in the column; the site shrinks images but never stretches them.
- Every image needs real alt text. "Screenshot" is not alt text.
- `public/_redirects` keeps the old WordPress URLs working. Add freely, remove nothing without a reason.
- The homepage FAQ is one list in `src/pages/index.astro` that feeds both the accordion and the FAQPage structured data. Edit the list, not the markup.
- The contact form only sends once `SENDGRID_API_KEY` and `CONTACT_TO_EMAIL` are set as Worker secrets. Until then it returns a "not configured" error, which the form shows as "That did not send."

## Do not

- Commit secrets. `.env` is ignored; keep it that way. API keys live as Cloudflare Worker secrets, never in the repository.
- Deploy by hand with `wrangler deploy`. That bypasses the tests and the audit. Push instead.
- Force-push or rewrite history on `main`.
- Edit `dist/`. It is generated.
- Loosen a check to make something pass. If the audit fires, it has found something.
- Copy anything from the old WordPress export or its theme. The HTML it produced was broken in places (a duplicated section with a table nested inside a list item, Divi shortcodes rendered as text, an invisible white-on-white section). Everything here was rewritten by hand.

## Read what exists before building it

- Brand colours are design tokens in `src/styles/global.css`: blue `--color-brand-*`, slate `--color-slate-*`, the off-white `--color-surface`. Use them.
- The button system is `src/components/ui/Button.astro` with `src/lib/button-styles.ts`.
- The typeface is Lato, self-hosted through the `fonts` block in `astro.config.mjs`. Real weights only: 400 and 700.
- Line icons are in `Icon.astro`. The illustrated icons on the homepage are PNGs in `src/assets/brand/`.

Look for the thing before making another one.

## Verifying your work

```bash
npm run dev            # local preview at http://localhost:4321
npm run qa             # type check, build, tests, audit. Run before pushing.
npm run check:rendered # drives a real browser against npm run preview
```

`npm run audit` checks every built page for broken images and links, dead anchors, duplicated paragraphs, leaked component tags, WordPress debris, and pages with no title or description. It prints "No problems found." or names the file and the problem.

## Where things are

```
src/content/blog/         posts, one .mdx per post
src/assets/blog/          post images, referenced by bare filename
src/assets/brand/         homepage photographs, headshots, illustrated icons, logo
src/assets/showcase/      portfolio stills; the hover videos are in public/showcase/
src/lib/showcase.ts       the portfolio list
src/lib/site.ts           the business facts every page shares
src/components/ui/        Button, Figure, Video, FAQ, Cite, RefNum, Table, PostGrid…
src/components/islands/   ContactForm, MobileNav
src/styles/global.css     design tokens
worker/index.ts           the only server code
scripts/audit-build.mjs   the audit
public/_redirects         old WordPress URLs and where they now point
```
