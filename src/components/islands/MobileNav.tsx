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
        class="-mr-2 inline-flex h-11 w-11 items-center justify-center text-slate-500"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          {open
            ? <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" />
            : <><path d="M3 6h18" stroke-linecap="round" /><path d="M3 12h18" stroke-linecap="round" /><path d="M3 18h18" stroke-linecap="round" /></>}
        </svg>
      </button>

      {open && (
        <div
          id="mobile-menu"
          class="fixed inset-x-0 bottom-0 top-[var(--header-h,80px)] z-50 overflow-y-auto border-t border-hairline bg-paper"
        >
          <nav class="container-page py-4" aria-label="Mobile">
            <ul class="divide-y divide-hairline">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    class="block py-4 text-lg font-bold text-slate-500 no-underline hover:text-brand-600"
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
