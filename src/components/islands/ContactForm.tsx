import { useState } from 'preact/hooks';
import { validateContact, MESSAGE_MAX, type ContactValues } from '../../lib/contact-validation';
import { BUTTON_BASE, BUTTON_VARIANTS, BUTTON_DISABLED } from '../../lib/button-styles';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const EMPTY: ContactValues = { name: '', email: '', phone: '', message: '' };

/**
 * The contact form on the blue band at the foot of the homepage. It posts
 * to the Worker at /api/contact; the fields and their validation mirror
 * the old Forminator form, minus its 180-character message limit.
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
      <div class="rounded-[10px] bg-paper p-7 text-ink shadow-[var(--shadow-md)]" role="status">
        <h3 class="text-xl font-bold">Message sent</h3>
        <p class="mt-2 text-ink-soft">
          Thanks for reaching out. One of us will get back to you within 48 hours.
        </p>
      </div>
    );
  }

  // White text on the blue band, with an underline rather than a box, the
  // way the old form drew its fields.
  const field =
    'w-full border-0 border-b border-brand-100/70 bg-transparent px-0 py-2.5 text-white ' +
    'placeholder:text-brand-100 focus:border-white focus:outline-none';
  const label = 'block text-sm font-bold text-white';

  return (
    <form onSubmit={onSubmit} novalidate class="space-y-6">
      <div class="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label for="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autocomplete="off" value={company} onInput={(e) => setCompany((e.target as HTMLInputElement).value)} />
      </div>
      {([
        { k: 'name', label: 'Name *', type: 'text', autocomplete: 'name' },
        { k: 'email', label: 'Email Address *', type: 'email', autocomplete: 'email' },
        { k: 'phone', label: 'Phone Number (optional)', type: 'tel', autocomplete: 'tel' },
      ] as const).map((f) => (
        <div key={f.k}>
          <label for={f.k} class={label}>{f.label}</label>
          <input
            id={f.k}
            name={f.k}
            type={f.type}
            autocomplete={f.autocomplete}
            value={values[f.k]}
            onInput={set(f.k)}
            aria-invalid={errors[f.k] ? 'true' : undefined}
            aria-describedby={errors[f.k] ? `${f.k}-error` : undefined}
            class={`${field} ${errors[f.k] ? 'border-amber-200' : ''}`}
          />
          {errors[f.k] && (
            <p id={`${f.k}-error`} class="mt-1.5 text-sm font-bold text-amber-100">{errors[f.k]}</p>
          )}
        </div>
      ))}

      <div>
        <div class="flex items-baseline justify-between">
          <label for="message" class={label}>Message *</label>
          <span class="text-xs text-brand-100" aria-hidden="true">{values.message.length} / {MESSAGE_MAX.toLocaleString('en-US')}</span>
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
          class={`mt-2 w-full rounded-[6px] border border-brand-100/70 bg-transparent px-3 py-2.5 text-white placeholder:text-brand-100 focus:border-white focus:outline-none ${errors.message ? 'border-amber-200' : ''}`}
        />
        {errors.message && (
          <p id="message-error" class="mt-1.5 text-sm font-bold text-amber-100">{errors.message}</p>
        )}
      </div>

      {status === 'error' && (
        <p role="alert" class="rounded-[6px] bg-paper px-4 py-3 text-sm text-ink">
          That did not send. Please try again in a moment.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        class={`${BUTTON_BASE} ${BUTTON_VARIANTS.primary} ${BUTTON_DISABLED} px-8 py-3`}
      >
        {status === 'sending' ? 'Sending…' : 'Submit'}
      </button>
    </form>
  );
}
