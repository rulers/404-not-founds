export type Vector = { x: number; y: number };
export type RippleState = {
  time: number;
  phase: number;
  wind: Vector;
  user: Vector;
  leaf: Vector & { vx: number; vy: number; angle: number };
};
export const clamp = (n: number, a: number, b: number) =>
  Math.min(b, Math.max(a, n));
export function createRipples(): RippleState {
  return {
    time: 0,
    phase: 0,
    wind: { x: 0.035, y: 0.012 },
    user: { x: 0, y: 0 },
    leaf: { x: 0.74, y: 0.67, vx: 0, vy: 0, angle: -0.4 },
  };
}
/** CSS coordinates; a slow deliberate drag still makes a small breeze. */
export function dragWind(
  dx: number,
  dy: number,
  milliseconds: number,
  shortSide: number,
): Vector {
  const distance = Math.hypot(dx, dy);
  if (!distance || milliseconds <= 0) return { x: 0, y: 0 };
  const speed = distance / (milliseconds / 1000) / Math.max(200, shortSide);
  const force = Math.min(
    1,
    0.06 + 0.94 * Math.pow(clamp(speed / 1.15, 0, 1), 0.65),
  );
  return { x: (dx / distance) * force, y: (dy / distance) * force };
}
export function leafBounds(width: number, height: number) {
  const margin = Math.min(width, height) * 0.065;
  return {
    left: margin / width,
    right: 1 - margin / width,
    top: Math.max(margin, Math.min(105, height * 0.24)) / height,
    bottom: 1 - Math.max(margin, Math.min(125, height * 0.25)) / height,
  };
}
/** Only outward movement is attenuated; inward wind always releases the leaf. */
export function edgeVelocity(
  position: number,
  velocity: number,
  low: number,
  high: number,
) {
  const distance = velocity > 0 ? high - position : position - low;
  const t = clamp(distance / 0.13, 0, 1);
  return velocity * t * (2 - t);
}
export function updateRipples(
  state: RippleState,
  seconds: number,
  target: Vector | null,
  width: number,
  height: number,
  reduced = false,
) {
  const dt = clamp(seconds, 0, 0.05);
  state.time += dt;
  const follow = 1 - Math.exp(-dt / (target ? 0.24 : 1.45));
  state.user.x += ((target?.x ?? 0) - state.user.x) * follow;
  state.user.y += ((target?.y ?? 0) - state.user.y) * follow;
  const natural = state.time * 0.085;
  state.wind.x = state.user.x + 0.035 * Math.cos(natural);
  state.wind.y = state.user.y + 0.022 * Math.sin(natural * 0.7 + 0.5);
  if (reduced) return;
  const strength = Math.min(1, Math.hypot(state.wind.x, state.wind.y));
  state.phase += dt * (0.24 + strength * 1.1);
  const leaf = state.leaf;
  const inertia = 1 - Math.exp(-dt / 0.85);
  const short = Math.min(width, height);
  leaf.vx += (((state.wind.x * short) / width) * 0.055 - leaf.vx) * inertia;
  leaf.vy += (((state.wind.y * short) / height) * 0.055 - leaf.vy) * inertia;
  const bounds = leafBounds(width, height);
  leaf.x = clamp(
    leaf.x + edgeVelocity(leaf.x, leaf.vx, bounds.left, bounds.right) * dt,
    bounds.left,
    bounds.right,
  );
  leaf.y = clamp(
    leaf.y + edgeVelocity(leaf.y, leaf.vy, bounds.top, bounds.bottom) * dt,
    bounds.top,
    bounds.bottom,
  );
  const heading = Math.atan2(state.wind.y, state.wind.x) - 0.45;
  const difference = Math.atan2(
    Math.sin(heading - leaf.angle),
    Math.cos(heading - leaf.angle),
  );
  leaf.angle += difference * (1 - Math.exp(-dt * 0.22));
}
/** Shared surface height and slope for letters, contact light, and the leaf. */
export function surfaceAt(
  state: RippleState,
  x: number,
  y: number,
  reduced = false,
) {
  if (reduced) return { height: 0, tilt: 0 };
  const force = Math.min(1, Math.hypot(state.wind.x, state.wind.y));
  const p = x * 7 + y * 11 - state.phase;
  return {
    height:
      (Math.sin(p) * 0.65 + Math.sin(p * 1.43 + 2.3) * 0.35) *
      (1.2 + force * 3.5),
    tilt: Math.cos(p * 0.83) * (0.005 + force * 0.024),
  };
}
