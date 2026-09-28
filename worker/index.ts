/**
 * The only server-side code in the project.
 *
 * Static assets are served directly from Cloudflare's edge without invoking
 * this Worker; `run_worker_first` in wrangler.jsonc limits it to /api/*.
 */
import { validateContact, type ContactValues } from '../src/lib/contact-validation';
import { buildNotification, buildAutoReply } from '../src/lib/contact-emails';
import { isProductionHost } from '../src/lib/canonical-host';

interface Env {
  ASSETS: Fetcher;
  /** SendGrid API key with mail.send permission. A Worker secret. */
  SENDGRID_API_KEY?: string;
  /** Where enquiries land. A Worker secret. */
  CONTACT_TO_EMAIL?: string;
  /** Verified sender in SendGrid. Falls back to the site's own address. */
  CONTACT_FROM_EMAIL?: string;
}

const SENDGRID = 'https://api.sendgrid.com/v3';

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/** One SendGrid send. */
async function sendMail(
  key: string,
  to: string,
  from: { email: string; name: string },
  replyTo: { email: string; name?: string },
  mail: { subject: string; html: string; text: string }
): Promise<Response> {
  return fetch(`${SENDGRID}/mail/send`, {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from,
      reply_to: replyTo,
      subject: mail.subject,
      // SendGrid requires plain text before HTML when both are present.
      content: [
        { type: 'text/plain', value: mail.text },
        { type: 'text/html', value: mail.html },
      ],
    }),
  });
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  // Derived from the host, not from configuration: a new preview environment
  // cannot forget to identify itself.
  const stage = isProductionHost(new URL(request.url).hostname) ? undefined : 'PREVIEW';
  let values: ContactValues & { company?: string };
  try {
    values = (await request.json()) as ContactValues & { company?: string };
  } catch {
    return json({ error: 'Malformed request.' }, 400);
  }

  // Honeypot. A real person never fills a field they cannot see, so anything
  // in it is a bot. Answer as though it worked; telling a bot it failed only
  // teaches it to try again.
  if (values.company) return json({ ok: true }, 200);

  const errors = validateContact(values);
  if (Object.keys(errors).length > 0) return json({ errors }, 422);

  if (!env.SENDGRID_API_KEY || !env.CONTACT_TO_EMAIL) {
    console.error('Contact form not configured: set SENDGRID_API_KEY and CONTACT_TO_EMAIL.');
    return json({ error: 'Contact form is not configured.' }, 500);
  }

  const from = { email: env.CONTACT_FROM_EMAIL || 'website@outsetsites.com', name: 'Outset Sites' };

  // The enquiry reaching Outset is the part that matters, so it goes first
  // and its failure is the only one the sender is told about.
  const notified = await sendMail(
    env.SENDGRID_API_KEY,
    env.CONTACT_TO_EMAIL,
    from,
    { email: values.email, name: values.name },
    buildNotification(values, stage)
  );
  if (!notified.ok) {
    console.error('SendGrid rejected the notification', notified.status, await notified.text());
    return json({ error: 'Could not send the message.' }, 502);
  }

  // The confirmation is a courtesy. If it fails the enquiry is still safely
  // delivered, so it is logged and swallowed rather than shown to the sender.
  try {
    const replied = await sendMail(
      env.SENDGRID_API_KEY,
      values.email,
      from,
      { email: env.CONTACT_TO_EMAIL },
      buildAutoReply(values, stage)
    );
    if (!replied.ok) console.error('Auto-reply rejected', replied.status, await replied.text());
  } catch (err) {
    console.error('Auto-reply threw', err);
  }

  return json({ ok: true }, 200);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
      return handleContact(request, env);
    }
    // Static assets never reach here: run_worker_first in wrangler.jsonc
    // limits this Worker to /api/*.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
