/** The one hostname that is the real, public site. */
export const PRODUCTION_HOST = 'outsetsites.com';

/**
 * Whether a request arrived at the live site rather than a preview.
 *
 * Derived from the hostname rather than a configured variable on purpose: a
 * variable has to be remembered on every new environment, and forgetting it
 * makes a preview look like production. A hostname cannot be forgotten.
 */
export function isProductionHost(hostname: string): boolean {
  if (!hostname) return false;
  const host = hostname.split(':')[0].toLowerCase();
  return host === PRODUCTION_HOST || host === `www.${PRODUCTION_HOST}`;
}
