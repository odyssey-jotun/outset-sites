/**
 * Google Analytics measurement IDs. The WordPress site ran none, so this
 * starts empty and the snippet in Analytics.astro stays inert. Add an ID
 * here when a property exists; nothing else needs to change.
 */
export const GA_MEASUREMENT_IDS: readonly string[] = [];

/** Only this hostname is measured, so previews never pollute the numbers. */
export const ANALYTICS_HOST = 'outsetsites.com';
