export type Drop = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  tx: number;
  ty: number;
  grip: number;
  offsetX: number;
  offsetY: number;
};
export type Bond = { a: number; b: number; length: number };
export type Liquid = {
  drops: Drop[];
  bonds: Bond[];
  height: number;
  holding: boolean;
  pointer: { x: number; y: number };
  idle: number;
  formed: boolean;
  split: number;
  merged: number;
};
const glyphs = [
  "1010,1010,1111,0010,0010,0010,0010",
  "1111,1001,1001,1001,1001,1001,1111",
  "1010,1010,1111,0010,0010,0010,0010",
];
export function createLiquid(height = 700): Liquid {
  const targets: { x: number; y: number }[] = [];
  const size = Math.min(50, height / 9),
    startX = (1000 - size * 14) / 2,
    startY = (height - size * 7) / 2;
  glyphs.forEach((glyph, digit) =>
    glyph.split(",").forEach((row, y) =>
      [...row].forEach((bit, x) => {
        if (bit === "1")
          targets.push({
            x: startX + (digit * 5 + x + 0.5) * size,
            y: startY + (y + 0.5) * size,
          });
      }),
    ),
  );
  const centers = [
    [0.24, 0.31],
    [0.64, 0.23],
    [0.78, 0.64],
    [0.4, 0.66],
    [0.17, 0.79],
  ];
  const drops = targets.map((target, i) => {
    const group = i % 5,
      rank = Math.floor(i / 5),
      angle = rank * 2.39996 + group * 1.37,
      radius = rank ? Math.sqrt(rank) * (15 + group * 1.6) : 0;
    return {
      x: centers[group][0] * 1000 + Math.cos(angle) * radius,
      y: centers[group][1] * height + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      r: size * 0.56,
      tx: target.x,
      ty: target.y,
      grip: 0,
      offsetX: 0,
      offsetY: 0,
    };
  });
  const liquid: Liquid = {
    drops,
    bonds: [],
    height,
    holding: false,
    pointer: { x: 0, y: 0 },
    idle: 0,
    formed: false,
    split: 0,
    merged: 0,
  };
  for (let a = 0; a < drops.length; a++)
    for (let b = a + 1; b < drops.length; b++) {
      const d = Math.hypot(drops[a].x - drops[b].x, drops[a].y - drops[b].y);
      if (d < drops[a].r * 2.5)
        liquid.bonds.push({ a, b, length: Math.max(d, drops[a].r * 1.3) });
    }
  return liquid;
}
export function grabLiquid(s: Liquid, x: number, y: number): boolean {
  const near = s.drops.reduce(
    (best, p, i) =>
      Math.hypot(p.x - x, p.y - y) <
      Math.hypot(s.drops[best].x - x, s.drops[best].y - y)
        ? i
        : best,
    0,
  );
  if (
    Math.hypot(s.drops[near].x - x, s.drops[near].y - y) >
    s.drops[near].r * 2
  )
    return false;
  s.holding = true;
  s.idle = 0;
  s.formed = false;
  s.pointer = { x, y };
  const center = s.drops[near];
  for (const p of s.drops) {
    const d = Math.hypot(p.x - center.x, p.y - center.y);
    p.grip = d < 30 ? Math.max(0.25, 1 - d / 40) : 0;
    p.offsetX = p.x - x;
    p.offsetY = p.y - y;
  }
  return true;
}
export function releaseLiquid(s: Liquid, cancel = false) {
  s.holding = false;
  for (const p of s.drops) {
    if (cancel) {
      p.vx *= 0.2;
      p.vy *= 0.2;
    }
    p.grip = 0;
  }
  s.idle = 0;
}
export function liquidGroups(s: Liquid): number {
  const roots = s.drops.map((_, i) => i);
  const root = (i: number): number =>
    roots[i] === i ? i : (roots[i] = root(roots[i]));
  for (const b of s.bonds) roots[root(b.a)] = root(b.b);
  return new Set(roots.map((_, i) => root(i))).size;
}
export function stepLiquid(
  s: Liquid,
  elapsed: number,
  reduced = false,
): number {
  const dt = Math.min(1 / 30, Math.max(0, elapsed));
  if (!s.holding) s.idle += dt;
  const gather = !s.holding && s.idle > 6;
  const initialGroups = liquidGroups(s);
  // Actual material links tear under strain; droplets are the same mass as the body.
  s.bonds = s.bonds.filter(
    (b) =>
      Math.hypot(
        s.drops[b.a].x - s.drops[b.b].x,
        s.drops[b.a].y - s.drops[b.b].y,
      ) <
      (s.drops[b.a].r + s.drops[b.b].r) * 1.65,
  );
  const tornGroups = liquidGroups(s);
  if (tornGroups > initialGroups) s.split += tornGroups - initialGroups;
  const linked = new Set(s.bonds.map((b) => `${b.a}:${b.b}`));
  for (let a = 0; a < s.drops.length; a++)
    for (let b = a + 1; b < s.drops.length; b++) {
      const p = s.drops[a],
        q = s.drops[b],
        dx = q.x - p.x,
        dy = q.y - p.y,
        d = Math.max(0.01, Math.hypot(dx, dy)),
        radius = p.r + q.r,
        minimum = radius * 0.68;
      if (d < radius * 1.2 && !linked.has(`${a}:${b}`) && !gather) {
        s.bonds.push({ a, b, length: Math.max(minimum, d) });
        linked.add(`${a}:${b}`);
      }
      if (d < minimum) {
        const force = (minimum - d) * 32;
        p.vx -= (dx / d) * force * dt;
        p.vy -= (dy / d) * force * dt;
        q.vx += (dx / d) * force * dt;
        q.vy += (dy / d) * force * dt;
      }
    }
  if (!gather)
    for (const b of s.bonds) {
      const p = s.drops[b.a],
        q = s.drops[b.b],
        dx = q.x - p.x,
        dy = q.y - p.y,
        d = Math.max(0.01, Math.hypot(dx, dy)),
        force = (d - b.length) * 12;
      const fx = (dx / d) * force * dt,
        fy = (dy / d) * force * dt;
      p.vx += fx;
      p.vy += fy;
      q.vx -= fx;
      q.vy -= fy;
    }
  let energy = 0,
    error = 0;
  for (const p of s.drops) {
    if (s.holding && p.grip) {
      p.vx += (s.pointer.x + p.offsetX - p.x) * p.grip * 180 * dt;
      p.vy += (s.pointer.y + p.offsetY - p.y) * p.grip * 180 * dt;
    }
    if (gather) {
      p.vx += (p.tx - p.x) * 5 * dt;
      p.vy += (p.ty - p.y) * 5 * dt;
    }
    const damping = Math.exp(
      -(s.holding ? 5 : gather ? 6 : reduced ? 5 : 2.5) * dt,
    );
    p.vx = Math.max(-1600, Math.min(1600, p.vx * damping));
    p.vy = Math.max(-1600, Math.min(1600, p.vy * damping));
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const pad = p.r * 1.3;
    if (p.x < pad || p.x > 1000 - pad) {
      p.x = Math.max(pad, Math.min(1000 - pad, p.x));
      p.vx *= -0.3;
    }
    if (p.y < pad || p.y > s.height - pad) {
      p.y = Math.max(pad, Math.min(s.height - pad, p.y));
      p.vy *= -0.3;
    }
    energy += p.vx * p.vx + p.vy * p.vy;
    error += Math.hypot(p.x - p.tx, p.y - p.ty);
  }
  const groups = liquidGroups(s);
  if (groups < tornGroups) s.merged += tornGroups - groups;
  s.formed = gather && error / s.drops.length < 8;
  return energy;
}
