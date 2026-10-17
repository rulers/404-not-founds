export type LiquidPoint = {
  x: number;
  y: number;
  restX: number;
  restY: number;
  vx: number;
  vy: number;
  group?: number;
  grip?: number;
};
export type LiquidInput = {
  x: number;
  y: number;
  active: boolean;
  dragging: boolean;
  anchorX: number;
  anchorY: number;
};
const four = [
  [100, 80],
  [164, 80],
  [164, 236],
  [250, 236],
  [250, 80],
  [314, 80],
  [314, 420],
  [250, 420],
  [250, 300],
  [100, 300],
];
function polygon(points: number[][]) {
  return points.flatMap(([x, y], i) => {
    const next = points[(i + 1) % points.length],
      steps = Math.ceil(Math.hypot(next[0] - x, next[1] - y) / 38);
    return Array.from({ length: steps }, (_, j) => ({
      x: x + ((next[0] - x) * j) / steps,
      y: y + ((next[1] - y) * j) / steps,
    }));
  });
}
function oval(rx: number, ry: number) {
  return Array.from({ length: 44 }, (_, i) => {
    const t = (i / 44) * Math.PI * 2;
    return { x: 510 + Math.cos(t) * rx, y: 250 + Math.sin(t) * ry };
  });
}
export function createLiquid(): LiquidPoint[][] {
  return [
    polygon(four),
    oval(103, 174),
    oval(43, 111).reverse(),
    polygon(four.map(([x, y]) => [x + 600, y])),
  ].map((loop, index) =>
    loop.map((p) => ({
      ...p,
      restX: p.x,
      restY: p.y,
      vx: 0,
      vy: 0,
      group: index === 0 ? 0 : index === 3 ? 2 : 1,
    })),
  );
}
export function liquidPath(loops: LiquidPoint[][]): string {
  return loops
    .map(
      (loop) =>
        loop
          .map((p, i) => {
            const next = loop[(i + 1) % loop.length],
              prev = loop[(i + loop.length - 1) % loop.length];
            const n = (v: number) => v.toFixed(2);
            return `${i === 0 ? `M${n((prev.x + p.x) / 2)} ${n((prev.y + p.y) / 2)}` : ""}Q${n(p.x)} ${n(p.y)} ${n((p.x + next.x) / 2)} ${n((p.y + next.y) / 2)}`;
          })
          .join("") + "Z",
    )
    .join(" ");
}
export function stepLiquid(
  loops: LiquidPoint[][],
  input: LiquidInput,
  elapsed: number,
  time: number,
  reduced = false,
): number {
  const dt = Math.max(0, Math.min(elapsed, 1 / 30));
  let energy = 0;
  for (const loop of loops)
    for (const p of loop) {
      let tx = p.restX,
        ty = p.restY;
      if (!reduced) {
        tx += Math.sin(time * 0.75 + p.restY * 0.018 + p.restX * 0.008) * 2.4;
        ty += Math.cos(time * 0.65 + p.restX * 0.015) * 2.8;
      }
      if (input.dragging) {
        const group = input.anchorX < 365 ? 0 : input.anchorX < 665 ? 1 : 2;
        const weight =
          p.grip ??
          (p.group === group
            ? Math.exp(
                -(
                  (p.restX - input.anchorX) ** 2 +
                  (p.restY - input.anchorY) ** 2
                ) /
                  (2 * 130 ** 2),
              )
            : 0);
        const dx = Math.max(-360, Math.min(360, input.x - input.anchorX)),
          dy = Math.max(-280, Math.min(280, input.y - input.anchorY));
        const stretch = Math.min(1, 350 / Math.max(1, Math.hypot(dx, dy)));
        tx += dx * stretch * weight;
        ty += dy * stretch * weight;
      } else if (input.active) {
        const dx = p.restX - input.x,
          dy = p.restY - input.y,
          distance = Math.hypot(dx, dy);
        if (distance < 145 && distance > 0) {
          const weight = (1 - distance / 145) ** 2 * (reduced ? 7 : 24);
          tx += (dx / distance) * weight;
          ty += (dy / distance) * weight;
        }
      }
      p.vx += (tx - p.x) * (reduced ? 48 : 30) * dt;
      p.vy += (ty - p.y) * (reduced ? 48 : 30) * dt;
      const damping = Math.exp(-(reduced ? 17 : 7.5) * dt);
      p.vx *= damping;
      p.vy *= damping;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      energy = Math.max(
        energy,
        Math.abs(p.x - tx) +
          Math.abs(p.y - ty) +
          Math.abs(p.vx) +
          Math.abs(p.vy),
      );
    }
  return energy;
}
export function pulseLiquid(
  loops: LiquidPoint[][],
  x = 510,
  y = 250,
  dx = 0,
  dy = -1,
) {
  for (const loop of loops)
    for (const p of loop) {
      const weight = Math.exp(
        -((p.restX - x) ** 2 + (p.restY - y) ** 2) / (2 * 190 ** 2),
      );
      p.vx += dx * 210 * weight;
      p.vy += dy * 210 * weight;
    }
}

// 変形中の表面をつかみ直しても、指に近い同じ数字だけを保持する。
export function grabLiquid(loops: LiquidPoint[][], x: number, y: number) {
  let nearest = loops[0][0],
    distance = Infinity;
  for (const loop of loops)
    for (const p of loop) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < distance) {
        nearest = p;
        distance = d;
      }
    }
  for (const loop of loops)
    for (const p of loop)
      p.grip =
        p.group === nearest.group
          ? 0.45 +
            0.55 * Math.exp(-((p.x - x) ** 2 + (p.y - y) ** 2) / (2 * 130 ** 2))
          : 0;
}
export function flingLiquid(loops: LiquidPoint[][], vx: number, vy: number) {
  for (const loop of loops)
    for (const p of loop) {
      p.vx += Math.max(-900, Math.min(900, vx)) * (p.grip ?? 0) * 0.65;
      p.vy += Math.max(-900, Math.min(900, vy)) * (p.grip ?? 0) * 0.65;
    }
}
