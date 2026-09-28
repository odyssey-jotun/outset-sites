/**
 * Widths to request for a responsive image, never exceeding the source.
 *
 * Astro will happily generate a 1200px variant from a 400px original, which
 * is just a blurry upscale served at four times the bytes. Every image on
 * this site is 800px or narrower, so the requested set has to be clamped to
 * what the file can actually deliver.
 */
export function responsiveWidths(intrinsicWidth: number, requested: number[]): number[] {
  if (!intrinsicWidth || intrinsicWidth <= 0) return [...requested].sort((a, b) => a - b);
  const usable = requested.filter((w) => w < intrinsicWidth);
  usable.push(intrinsicWidth);
  return [...new Set(usable)].sort((a, b) => a - b);
}
