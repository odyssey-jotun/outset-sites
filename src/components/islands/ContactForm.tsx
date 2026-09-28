import { useState } from 'preact/hooks';
import { validateContact, MESSAGE_MAX, type ContactValues } from '../../lib/contact-validation';
import { BUTTON_BASE, BUTTON_VARIANTS, BUTTON_DISABLED } from '../../lib/button-styles';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const EMPTY: ContactValues = { name: '', email: '', phone: '', message: '' };

/**
 * The contact form, on a white card at the foot of the homepage. It posts to
 * the Worker at /api/contact; the fields and their validation mirror the
 * old Forminator form, minus its 180-character message limit.
 */
export default function ContactForm() {
  const [values, setValues] = useState<ContactValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactValues, string>>>({});
  const [status, setStatus] = useState<Status>('idle');
  // Honeypot. Hidden from people, filled in by bots; the Worker drops
  // anything that arrives with it set.
  const [company, setCompany] = useState('');

  const set = (k: keyof ContactValues) => (e: Event) =>
    setValues((v) => ({ ...v, [k]: (e.target as HTMLInputElement).value }));

  async function onSubmit(e: Event) {
    e.preventDefault();
    const found = validateContact(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, company }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('sent');
      setValues(EMPTY);
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div class="rounded-2xl bg-brand-50 p-7 text-ink" role="status">
        <h3 class="font-display text-xl font-bold">Message sent</h3>
        <p class="mt-2 text-ink-soft">
          Thanks for reaching out. One of us will get back to you within 48 hours.
        </p>
      </div>
    );
  }

  const field =
    'mt-1.5 w-full rounded-xl border border-hairline-strong bg-paper px-4 py-3 text-ink ' +
    'placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100';
  const label = 'block text-sm font-semibold text-ink';

  return (
    <form onSubmit={onSubmit} novalidate class="space-y-5">
      <div class="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label for="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autocomplete="off" value={company} onInput={(e) => setCompany((e.target as HTMLInputElement).value)} />
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        {([
          { k: 'name', label: 'Name', type: 'text', autocomplete: 'name' },
          { k: 'email', label: 'Email address', type: 'email', autocomplete: 'email' },
        ] as const).map((f) => (
          <div key={f.k}>
            <label for={f.k} class={label}>{f.label} <span class="text-brand-600">*</span></label>
            <input
              id={f.k}
              name={f.k}
              type={f.type}
              autocomplete={f.autocomplete}
              value={values[f.k]}
              onInput={set(f.k)}
              aria-invalid={errors[f.k] ? 'true' : undefined}
              aria-describedby={errors[f.k] ? `${f.k}-error` : undefined}
              class={`${field} ${errors[f.k] ? 'border-red-500' : ''}`}
            />
            {errors[f.k] && (
              <p id={`${f.k}-error`} class="mt-1.5 text-sm font-medium text-red-700">{errors[f.k]}</p>
            )}
          </div>
        ))}
      </div>

      <div>
        <label for="phone" class={label}>Phone number <span class="font-normal text-muted">(optional)</span></label>
        <input id="phone" name="phone" type="tel" autocomplete="tel" value={values.phone} onInput={set('phone')} class={field} />
      </div>

      <div>
        <div class="flex items-baseline justify-between">
          <label for="message" class={label}>Message <span class="text-brand-600">*</span></label>
          <span class="text-xs text-muted" aria-hidden="true">{values.message.length} / {MESSAGE_MAX.toLocaleString('en-US')}</span>
        </div>
        <textarea
          id="message"
          name="message"
          rows={5}
          maxLength={MESSAGE_MAX}
          placeholder="How can we help?"
          value={values.message}
          onInput={set('message')}
          aria-invalid={errors.message ? 'true' : undefined}
          aria-describedby={errors.message ? 'message-error' : undefined}
          class={`${field} ${errors.message ? 'border-red-500' : ''}`}
        />
        {errors.message && (
          <p id="message-error" class="mt-1.5 text-sm font-medium text-red-700">{errors.message}</p>
        )}
      </div>

      {status === 'error' && (
        <p role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          That did not send. Please try again in a moment.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        class={`${BUTTON_BASE} ${BUTTON_VARIANTS.primary} ${BUTTON_DISABLED} w-full px-8 py-3.5 text-lg sm:w-auto`}
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
