export type EasingName = 'easeInOutCubic' | 'easeOutQuart' | 'linear' | 'globeFlight';

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function linear(t: number): number {
  return t;
}

// Slow start, fast middle, gentle landing
function globeFlight(t: number): number {
  if (t < 0.2) return easeInOutCubic(t * 5) * 0.1;
  if (t < 0.8) return 0.1 + easeInOutCubic((t - 0.2) * 1.667) * 0.8;
  return 0.9 + easeInOutCubic((t - 0.8) * 5) * 0.1;
}

export const EASINGS: Record<EasingName, (t: number) => number> = {
  easeInOutCubic,
  easeOutQuart,
  linear,
  globeFlight,
};

export function getEasing(name: EasingName): (t: number) => number {
  return EASINGS[name] ?? easeInOutCubic;
}
