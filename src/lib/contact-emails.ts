import type { ContactValues } from './contact-validation';
import { LEGAL_NAME } from './site';

/**
 * The two emails a contact form submission produces: the notification that
 * reaches Outset, and the confirmation that goes back to the enquirer.
 *
 * Both are pure functions so their markup can be tested without sending
 * anything. Email clients ignore stylesheets and strip <style> blocks, so
 * everything is inline and table-based.
 */

const SITE = 'https://outsetsites.com';
const INK = '#1F2A36';
const MUTED = '#566678';
const HAIRLINE = '#DDE3E8';
const BRAND = '#386D9A';
const PAPER = '#FFFFFF';
const GROUND = '#EDEDEA';
const SANS = "Lato, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export const escapeHtml = (s: string): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const withBreaks = (s: string): string => escapeHtml(s).replace(/\r?\n/g, '<br>');

/** "Jordan Reid" -> "Jordan". A greeting uses the name someone is called. */
const firstName = (name: string): string => String(name ?? '').trim().split(/\s+/)[0] || 'there';

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Anything sent from a preview says so, in the subject and in the body.
 * Someone testing the form should never wonder whether the message they are
 * looking at came from a real enquirer.
 */
const label = (env?: string) => (env ? `[${env}] ` : '');

const banner = (env?: string) =>
  env
    ? `<div style="background:#FDF3E3;border:1px solid #E8C88F;border-radius:6px;padding:10px 14px;margin:0 0 20px;font:700 13px ${SANS};color:#7A4E08;">` +
      `This came from the ${escapeHtml(env.toLowerCase())} site, not the live one. It is a test.` +
      '</div>'
    : '';

const shell = (body: string) =>
  `<div style="background:${GROUND};padding:28px 16px;font-family:${SANS};">` +
  `<div style="max-width:560px;margin:0 auto;background:${PAPER};border:1px solid ${HAIRLINE};border-radius:10px;padding:28px;">${body}</div>` +
  `<p style="max-width:560px;margin:16px auto 0;font:400 12px ${SANS};color:${MUTED};text-align:center;">${escapeHtml(LEGAL_NAME)} &middot; <a href="${SITE}/" style="color:${MUTED};">outsetsites.com</a></p>` +
  '</div>';

/** The internal notification: every field visible without scrolling. */
export function buildNotification(v: ContactValues, env?: string): BuiltEmail {
  const row = (k: string, value: string) => `
    <tr>
      <td style="padding:5px 12px 5px 0;font:700 13px ${SANS};color:${MUTED};white-space:nowrap;vertical-align:top;">${k}</td>
      <td style="padding:5px 0;font:400 15px ${SANS};color:${INK};">${value}</td>
    </tr>`;
  const html = shell(
    banner(env) +
    `<h1 style="margin:0 0 4px;font:400 22px ${SANS};color:${INK};">New enquiry from the website</h1>` +
    `<p style="margin:0 0 18px;font:400 14px ${SANS};color:${MUTED};">Reply to this email and it goes straight back to them.</p>` +
    `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">` +
    row('Name', escapeHtml(v.name)) +
    row('Email', `<a href="mailto:${escapeHtml(v.email)}" style="color:${BRAND};">${escapeHtml(v.email)}</a>`) +
    row('Phone', v.phone?.trim() ? escapeHtml(v.phone) : `<span style="color:${MUTED};">not given</span>`) +
    '</table>' +
    `<div style="margin-top:18px;padding:14px 16px;background:${GROUND};border-radius:8px;font:400 15px/1.55 ${SANS};color:${INK};">${withBreaks(v.message)}</div>`
  );
  const text =
    `${env ? `[${env}] THIS IS A TEST FROM THE ${env} SITE.\n\n` : ''}` +
    `New enquiry from the website\n\nName: ${v.name}\nEmail: ${v.email}\nPhone: ${v.phone?.trim() || 'not given'}\n\n${v.message}\n`;
  return { subject: `${label(env)}Website enquiry from ${v.name.trim()}`, html, text };
}

/** The courtesy reply to the enquirer, matching the promise on the page. */
export function buildAutoReply(v: ContactValues, env?: string): BuiltEmail {
  const name = firstName(v.name);
  const html = shell(
    banner(env) +
    `<h1 style="margin:0 0 12px;font:400 22px ${SANS};color:${INK};">Thanks, ${escapeHtml(name)}. We got your message.</h1>` +
    `<p style="margin:0 0 12px;font:400 15px/1.6 ${SANS};color:${INK};">One of us will get back to you within 48 hours. No high-pressure sales, just an open, honest look at what your business needs.</p>` +
    `<p style="margin:0 0 6px;font:700 13px ${SANS};color:${MUTED};">What you sent</p>` +
    `<div style="padding:14px 16px;background:${GROUND};border-radius:8px;font:400 15px/1.55 ${SANS};color:${INK};">${withBreaks(v.message)}</div>` +
    `<p style="margin:18px 0 0;font:400 15px/1.6 ${SANS};color:${INK};">Joe and Marc<br><span style="color:${MUTED};">${escapeHtml(LEGAL_NAME)}</span></p>`
  );
  const text =
    `${env ? `[${env}] THIS IS A TEST FROM THE ${env} SITE.\n\n` : ''}` +
    `Thanks, ${name}. We got your message.\n\nOne of us will get back to you within 48 hours.\n\nWhat you sent:\n${v.message}\n\nJoe and Marc\n${LEGAL_NAME}\n`;
  return { subject: `${label(env)}We got your message`, html, text };
}
