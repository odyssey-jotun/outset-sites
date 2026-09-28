import { useState, useEffect } from 'preact/hooks';
import type { NavLink } from '../../lib/nav';

interface Props { nav: NavLink[] }

/**
 * Hydrated only below the desktop breakpoint (client:media), so this code is
 * never downloaded or run on a desktop viewport.
 */
export default function MobileNav({ nav }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div class="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-surface text-ink"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          {open
            ? <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" />
            : <><path d="M4 7h16" stroke-linecap="round" /><path d="M4 12h16" stroke-linecap="round" /><path d="M4 17h16" stroke-linecap="round" /></>}
        </svg>
      </button>

      {open && (
        <div
          id="mobile-menu"
          class="fixed inset-x-0 bottom-0 top-[var(--header-h,76px)] z-50 overflow-y-auto bg-paper"
        >
          <nav class="container-page py-6" aria-label="Mobile">
            <ul class="flex flex-col gap-2">
              {nav.map((item, i) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    class={
                      i === nav.length - 1
                        ? 'mt-4 flex items-center justify-center rounded-full bg-brand-600 px-5 py-3.5 text-lg font-semibold text-white no-underline'
                        : 'flex items-center justify-between rounded-2xl bg-surface px-5 py-4 font-display text-2xl font-bold text-ink no-underline'
                    }
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
