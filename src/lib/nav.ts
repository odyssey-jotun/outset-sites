import { CONTACT_HREF } from './site';

export interface NavLink { label: string; href: string }

/** Mirrors the existing site's four-item menu. */
export const NAV: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Showcase', href: '/portfolio/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'Contact', href: CONTACT_HREF },
];
