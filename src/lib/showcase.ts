/**
 * The portfolio. Each entry pairs a still with the scrolling capture that
 * plays on hover, both taken from the old site's Showcase page. The names
 * are read off the screenshots; the WordPress site never labelled them.
 *
 * Order is the old page's order: newest work first.
 */
export interface ShowcaseItem {
  /** Bare filename in src/assets/showcase/. */
  image: string;
  /** Path under public/ for the hover capture. */
  video: string;
  name: string;
  /** What the site is, for the caption and the alt text. */
  kind: string;
}

export const SHOWCASE: ShowcaseItem[] = [
  { image: 'outsetsites8.png', video: '/showcase/outsetsites8.mp4', name: 'Amelia Loken', kind: 'Author site for a fantasy novelist' },
  { image: 'outsetsites7.png', video: '/showcase/outsetsites7.mp4', name: 'Anne Scott Needlepoint', kind: 'Online shop for a needlepoint designer' },
  { image: 'outsetsites6.png', video: '/showcase/outsetsites6.mp4', name: 'Creative Tools for Managing Depression', kind: 'Guide site for teens' },
  { image: 'outsetsites5.png', video: '/showcase/outsetsites5.mp4', name: 'Teen Fitness', kind: 'Bodyweight training programme' },
  { image: 'outsetsites4.png', video: '/showcase/outsetsites4.mp4', name: 'Florida Sea Turtle Conservation', kind: 'Conservation campaign site' },
  { image: 'outsetsites3.png', video: '/showcase/outsetsites3.mp4', name: 'Playbook Success', kind: 'Waitlist site for young entrepreneurs' },
  { image: 'outsetsites2.png', video: '/showcase/outsetsites2.mp4', name: 'Anxiety on the Spectrum', kind: 'Free guide on autism and anxiety' },
  { image: 'outsetsites1.png', video: '/showcase/outsetsites1.mp4', name: 'Mindful Dwellings', kind: 'Interior design quiz and guide' },
];
