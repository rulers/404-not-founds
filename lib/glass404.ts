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

export function advanceShard(shard: Shard, elapsed: number) {
  const dt = Math.min(1 / 30, Math.max(0, elapsed));
  shard.vx *= Math.exp(-0.65 * dt);
  shard.vy += 490 * dt;
  shard.x += shard.vx * dt;
  shard.y += shard.vy * dt;
  shard.angle += shard.spin * dt;
  shard.spin *= Math.exp(-0.3 * dt);
}

export type GlassCell = Shard & {
  intact: boolean;
  age: number;
  damage: number;
  neighbors: number[];
  home: Point;
};
export function makePane(height: number, random = Math.random): GlassCell[] {
  const cols = 12,
    rows = Math.ceil(height / 85),
    cells: GlassCell[] = [];
  const vertices = Array.from({ length: rows + 1 }, (_, row) =>
    Array.from({ length: cols + 1 }, (_, col) => ({
      x: (col * 1000) / cols + (col && col < cols ? (random() - 0.5) * 45 : 0),
      y:
        (row * height) / rows + (row && row < rows ? (random() - 0.5) * 45 : 0),
    })),
  );
  const edges = new Map<string, number>();
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++) {
      const a = vertices[row][col],
        b = vertices[row][col + 1],
        c = vertices[row + 1][col],
        d = vertices[row + 1][col + 1];
      for (const points of [
        [a, b, c],
        [b, d, c],
      ]) {
        const x = points.reduce((n, p) => n + p.x, 0) / 3,
          y = points.reduce((n, p) => n + p.y, 0) / 3;
        const cell: GlassCell = {
          points,
          x,
          y,
          home: { x, y },
          vx: 0,
          vy: 0,
          angle: 0,
          spin: 0,
          intact: true,
          age: 0,
          damage: 0,
          neighbors: [],
        };
        const index = cells.length;
        cells.push(cell);
        for (let i = 0; i < 3; i++) {
          const ends = [points[i], points[(i + 1) % 3]]
            .map((p) => `${p.x},${p.y}`)
            .sort()
            .join("|");
          const other = edges.get(ends);
          if (other !== undefined) {
            cell.neighbors.push(other);
            cells[other].neighbors.push(index);
          } else edges.set(ends, index);
        }
      }
    }
  return cells;
}
export function scorePane(cells: GlassCell[], from: Point, to: Point) {
  const dx = to.x - from.x,
    dy = to.y - from.y,
    length = dx * dx + dy * dy;
  for (const cell of cells) {
    if (!cell.intact) continue;
    const t = length
      ? Math.max(
          0,
          Math.min(
            1,
            ((cell.home.x - from.x) * dx + (cell.home.y - from.y) * dy) /
              length,
          ),
        )
      : 0;
    const distance = Math.hypot(
      cell.home.x - from.x - t * dx,
      cell.home.y - from.y - t * dy,
    );
    if (distance < 65)
      cell.damage = Math.min(0.95, cell.damage + (1 - distance / 65) * 0.32);
  }
}
export function strikePane(
  cells: GlassCell[],
  point: Point,
  power: number,
  random = Math.random,
): GlassCell[] {
  const radius = 115 + power * 110,
    broken: GlassCell[] = [];
  const detach = (cell: GlassCell) => {
    cell.intact = false;
    cell.age = 0;
    cell.vx = (cell.home.x - point.x) * 3 + (random() - 0.5) * 160;
    cell.vy = (cell.home.y - point.y) * 1.8 - 120 - random() * 130;
    cell.spin = (random() - 0.5) * 9;
    broken.push(cell);
  };
  for (const cell of cells) {
    const d = Math.hypot(cell.home.x - point.x, cell.home.y - point.y);
    if (cell.intact && d < radius) {
      cell.damage += (1 - d / radius) * (0.82 + power * 1.8);
      if (cell.damage >= 1) detach(cell);
    }
  }
  // A weakened joint can tear when its neighbors lose their support.
  for (let pass = 0; pass < 3; pass++)
    for (const cell of cells)
      if (
        cell.intact &&
        cell.damage > 0.42 &&
        cell.neighbors.filter((i) => !cells[i].intact).length >= 2
      )
        detach(cell);
  if (cells.filter((c) => c.intact).length < cells.length * 0.38)
    for (const cell of cells) if (cell.intact) detach(cell);
  return broken;
}
