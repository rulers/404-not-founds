export type Point = { x: number; y: number };
export type FlightPlan = {
  curves: readonly (readonly Point[])[];
  duration: number;
  angle: number;
  power: number;
};
export const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));
export function aimFromDrag(dx: number, dy: number, reach: number) {
  const distance = Math.hypot(dx, dy);
  return {
    valid: distance >= 14,
    angle: Math.atan2(dy, dx),
    power: clamp(distance / Math.max(60, reach), 0.12, 1),
  };
}
export function flightLayout(width: number, height: number) {
  const size = Math.min(180, width * 0.34, height * 0.25);
  const margin = size * 0.55 + 12;
  return {
    home: { x: width * 0.5, y: height * 0.57 },
    size,
    bounds: {
      left: margin,
      right: width - margin,
      top: Math.min(100, height * 0.2) + size * 0.4,
      bottom: height - Math.min(100, height * 0.18) - size * 0.4,
    },
  };
}
export function createFlight(
  width: number,
  height: number,
  angle: number,
  strength: number,
): FlightPlan {
  const power = clamp(strength, 0.12, 1);
  const { home, bounds } = flightLayout(width, height);
  const d = { x: Math.cos(angle), y: Math.sin(angle) };
  function candidate(side: number) {
    const point = (a: number, b: number): Point => ({
      x: d.x * a - d.y * b * side * 0.65,
      y: d.y * a + d.x * b * side * 0.65,
    });
    const curves = [
      [point(0, 0), point(0.45, 0), point(1, 0.2), point(1, 0.65)],
      [point(1, 0.65), point(1, 1.15), point(-0.4, 1), point(-0.4, 0.55)],
      [point(-0.4, 0.55), point(-0.4, 0.15), point(-0.12, 0), point(0, 0)],
    ];
    let radius = Math.min(width * 0.65, height * 0.6);
    for (const p of curves.flat()) {
      if (p.x > 0) radius = Math.min(radius, (bounds.right - home.x) / p.x);
      if (p.x < 0) radius = Math.min(radius, (bounds.left - home.x) / p.x);
      if (p.y > 0) radius = Math.min(radius, (bounds.bottom - home.y) / p.y);
      if (p.y < 0) radius = Math.min(radius, (bounds.top - home.y) / p.y);
    }
    return { curves, radius: Math.max(1, radius) };
  }
  const a = candidate(1),
    b = candidate(-1);
  const best = a.radius >= b.radius ? a : b;
  const radius = best.radius * (0.28 + 0.72 * power);
  return {
    curves: best.curves.map((c) =>
      c.map((p) => ({ x: p.x * radius, y: p.y * radius })),
    ),
    duration: 6200 + 1400 * power,
    angle,
    power,
  };
}
export function sampleFlight(plan: FlightPlan, elapsed: number) {
  const u = clamp(elapsed / plan.duration, 0, 1);
  const progress = 1 - Math.pow(1 - u, 1.35);
  const index = progress < 0.38 ? 0 : progress < 0.72 ? 1 : 2;
  const t =
    index === 0
      ? progress / 0.38
      : index === 1
        ? (progress - 0.38) / 0.34
        : (progress - 0.72) / 0.28;
  const [a, b, c, d] = plan.curves[index];
  const q = 1 - t;
  const coordinate = (key: "x" | "y") =>
    q * q * q * a[key] +
    3 * q * q * t * b[key] +
    3 * q * t * t * c[key] +
    t * t * t * d[key];
  const vx =
    3 * q * q * (b.x - a.x) + 6 * q * t * (c.x - b.x) + 3 * t * t * (d.x - c.x);
  const vy =
    3 * q * q * (b.y - a.y) + 6 * q * t * (c.y - b.y) + 3 * t * t * (d.y - c.y);
  return {
    x: coordinate("x"),
    y: coordinate("y"),
    angle: Math.atan2(vy, vx),
    scale: 1 - 0.42 * Math.sin(Math.PI * progress),
    progress,
    done: u >= 1,
  };
}
