/**
 * One place for what a button looks like.
 *
 * Buttons appear both as links (Button.astro) and as the submit inside the
 * contact form island, so the shape cannot be a single component. What must
 * not diverge is the decision underneath: the blue is the primary action,
 * navy the secondary, an outline the quiet alternative, and `inverse` is for
 * a dark band where the blue would sink.
 */
export const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold ' +
  'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ' +
  'no-underline active:translate-y-px';

export const BUTTON_SIZES = {
  md: 'px-5 py-2.5 text-[0.98rem]',
  lg: 'px-7 py-3.5 text-lg',
} as const;

export const BUTTON_VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-[var(--shadow-md)] hover:bg-brand-700 hover:shadow-[var(--shadow-glow)]',
  secondary:
    'bg-navy text-white shadow-[var(--shadow-sm)] hover:bg-navy-soft hover:shadow-[var(--shadow-md)]',
  ghost: 'border border-hairline-strong bg-paper text-ink hover:border-brand-400 hover:text-brand-700',
  inverse: 'bg-paper text-navy shadow-[var(--shadow-md)] hover:bg-brand-50',
} as const;

/** Submit buttons spend time disabled while a request is in flight. */
export const BUTTON_DISABLED = 'disabled:cursor-not-allowed disabled:opacity-60';

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;
