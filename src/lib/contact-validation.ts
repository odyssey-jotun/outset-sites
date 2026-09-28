export interface ContactValues {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export type ContactErrors = Partial<Record<keyof ContactValues, string>>;

/** Deliberately permissive: enough structure to catch a typo, not to reject
 *  a valid address. Anything stricter rejects real people. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The old Forminator form capped the message at 180 characters. That was
 *  too tight for anyone describing their business; this one allows a page. */
export const MESSAGE_MAX = 2000;

/**
 * Validate the contact form. Pure, so both the browser island and the Worker
 * apply the same rules.
 */
export function validateContact(v: ContactValues): ContactErrors {
  const e: ContactErrors = {};
  const name = (v.name ?? '').trim();
  const email = (v.email ?? '').trim();
  const message = (v.message ?? '').trim();

  if (name.length < 2) e.name = 'Please tell us your name.';
  if (!email) e.email = 'We need an email address to reply to.';
  else if (!EMAIL.test(email)) e.email = 'That email address does not look right.';
  if (message.length < 10) e.message = 'Please add a little more detail, at least 10 characters.';
  else if (message.length > MESSAGE_MAX) e.message = `That message is too long. Please keep it under ${MESSAGE_MAX.toLocaleString('en-US')} characters.`;

  return e;
}
