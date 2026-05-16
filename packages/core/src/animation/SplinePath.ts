export interface PathPoint {
  lat: number;
  lng: number;
  altitude: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Normalize longitude difference to [-180, 180] to take shortest arc
function lngDiff(from: number, to: number): number {
  let d = to - from;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

export function buildSpiralPath(
  start: PathPoint,
  end: PathPoint,
  steps: number,
  turns: number,
  easing: (t: number) => number
): PathPoint[] {
  const points: PathPoint[] = [];
  const dLng = lngDiff(start.lng, end.lng);
  const dLat = end.lat - start.lat;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const et = easing(t);

    // Exponential altitude drop
    const altitude = start.altitude * Math.pow(end.altitude / start.altitude, et);

    // Spiral offset decreases as t increases (tight at end)
    const angle = turns * 2 * Math.PI * et;
    const spiralRadius = (1 - et) * Math.min(Math.abs(dLng), Math.abs(dLat), 30) * 0.15;

    const lng = start.lng + dLng * et + spiralRadius * Math.cos(angle);
    const lat = start.lat + dLat * et + spiralRadius * Math.sin(angle);

    points.push({ lat, lng, altitude });
  }

  return points;
}

export function buildDirectPath(
  start: PathPoint,
  end: PathPoint,
  steps: number,
  easing: (t: number) => number
): PathPoint[] {
  const points: PathPoint[] = [];
  const dLng = lngDiff(start.lng, end.lng);
  const dLat = end.lat - start.lat;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const et = easing(t);

    // Arc: altitude peaks in the middle then descends
    const altPeak = Math.max(start.altitude, end.altitude) * 1.2;
    const altT = Math.sin(Math.PI * et);
    const altitude = lerp(lerp(start.altitude, altPeak, altT), end.altitude, et);

    points.push({
      lat: start.lat + dLat * et,
      lng: start.lng + dLng * et,
      altitude,
    });
  }

  return points;
}
