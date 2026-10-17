// 輪郭を共有し、静止SVG・Canvas・サムネイルで同じ404を保つ。
export const GLASS_PATH =
  "M100 70H160V235H250V70H310V430H250V295H100Z M470 70H550Q610 70 610 130V370Q610 430 550 430H470Q410 430 410 370V130Q410 70 470 70Z M480 130V370H540V130Z M710 70H770V235H860V70H920V430H860V295H710Z";
export type Point = { x: number; y: number };
export type Crack = { points: Point[]; branches: Point[][] };
export type Shard = {
  points: Point[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
};

export function makeCracks(origin: Point, random = Math.random): Crack[] {
  return Array.from({ length: 9 }, (_, ray) => {
    const angle = (ray * Math.PI * 2) / 9 + random() * 0.45;
    let point = origin;
    const points = [origin];
    const branches: Point[][] = [];
    for (let i = 1; i <= 5; i++) {
      const next = {
        x:
          point.x +
          Math.cos(angle + (random() - 0.5) * 0.7) * (18 + random() * 28),
        y:
          point.y +
          Math.sin(angle + (random() - 0.5) * 0.7) * (18 + random() * 28),
      };
      points.push(next);
      if (i % 2 === 0)
        branches.push([
          point,
          {
            x: point.x + Math.cos(angle + 0.8) * 28,
            y: point.y + Math.sin(angle + 0.8) * 28,
          },
        ]);
      point = next;
    }
    return { points, branches };
  });
}

export function makeShards(
  contains: (x: number, y: number) => boolean,
  impact: Point,
  random = Math.random,
): Shard[] {
  const shards: Shard[] = [];
  const size = 38;
  for (let y = 60; y < 440; y += size)
    for (let x = 90; x < 930; x += size) {
      const skew = (random() - 0.5) * 16;
      const a = { x, y },
        b = { x: x + size, y: y + skew },
        c = { x, y: y + size },
        d = { x: x + size, y: y + size };
      for (const points of [
        [a, b, c],
        [b, d, c],
      ]) {
        const cx = points.reduce((sum, p) => sum + p.x, 0) / 3;
        const cy = points.reduce((sum, p) => sum + p.y, 0) / 3;
        if (!contains(cx, cy)) continue;
        shards.push({
          points,
          x: cx,
          y: cy,
          vx: (cx - impact.x) * 0.55 + (random() - 0.5) * 230,
          vy: -120 - random() * 220,
          angle: 0,
          spin: (random() - 0.5) * 5,
        });
      }
    }
  return shards;
}

export function advanceShard(shard: Shard, elapsed: number) {
  const dt = Math.min(1 / 30, Math.max(0, elapsed));
  shard.vx *= Math.exp(-0.65 * dt);
  shard.vy += 490 * dt;
  shard.x += shard.vx * dt;
  shard.y += shard.vy * dt;
  shard.angle += shard.spin * dt;
  shard.spin *= Math.exp(-0.3 * dt);
}
