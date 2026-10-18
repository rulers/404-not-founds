export type SmokePoint = { x: number; y: number };
export type SmokePuff = {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  spin: number;
  opacity: number;
  tint: number;
};
export type SmokeWorld = {
  height: number;
  time: number;
  cols: number;
  rows: number;
  field: Float32Array;
  pixels: Uint8Array;
  puffs: SmokePuff[];
};
export function smokeArrival(time: number) {
  const t = Math.max(0, Math.min(1, (time - 1.8) / 3.4));
  return t * t * (3 - 2 * t);
}
export function smokeRandom(seed = 504) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export function createSmoke(height: number, mobile = false): SmokeWorld {
  const random = smokeRandom(),
    cols = 64,
    rows = Math.max(12, Math.ceil((height / 1000) * cols));
  const puffs = Array.from({ length: mobile ? 38 : 56 }, (_, i) => {
    // Central layers veil the known, fixed glyph; outer layers fill the viewport.
    const x = i < 24 ? 550 + (random() - 0.5) * 570 : random() * 1200 - 100,
      y =
        i < 24
          ? height * 0.49 + (random() - 0.5) * Math.min(600, height * 0.8)
          : random() * height;
    return {
      x,
      y,
      homeX: x,
      homeY: y,
      vx: 0,
      vy: 0,
      radius: 240 + random() * 190,
      angle: random() * Math.PI * 2,
      spin: (random() > 0.5 ? 1 : -1) * (0.025 + random() * 0.045),
      opacity: 0.34 + random() * 0.32,
      tint: 0.5 + random() * 0.5,
    };
  });
  return {
    height,
    time: 0,
    cols,
    rows,
    field: new Float32Array(cols * rows * 3),
    pixels: new Uint8Array(cols * rows * 4),
    puffs,
  };
}
export function smokeAt(
  s: SmokeWorld,
  p: SmokePoint,
): [number, number, number] {
  const x = Math.max(
      0,
      Math.min(s.cols - 1, Math.floor((p.x / 1000) * s.cols)),
    ),
    y = Math.max(
      0,
      Math.min(s.rows - 1, Math.floor((p.y / s.height) * s.rows)),
    ),
    i = (y * s.cols + x) * 3;
  return [s.field[i], s.field[i + 1], s.field[i + 2]];
}
export function blowSmoke(
  s: SmokeWorld,
  from: SmokePoint,
  to: SmokePoint,
  strength = 1,
) {
  const dx = to.x - from.x,
    dy = to.y - from.y,
    length = dx * dx + dy * dy,
    radius = 145;
  for (let row = 0; row < s.rows; row++)
    for (let col = 0; col < s.cols; col++) {
      const x = ((col + 0.5) / s.cols) * 1000,
        y = ((row + 0.5) / s.rows) * s.height;
      const t = length
        ? Math.max(
            0,
            Math.min(1, ((x - from.x) * dx + (y - from.y) * dy) / length),
          )
        : 0;
      const rx = x - from.x - dx * t,
        ry = y - from.y - dy * t,
        d = Math.hypot(rx, ry),
        weight = Math.exp((-d * d) / (radius * radius * 0.5)) * strength;
      if (weight < 0.005) continue;
      const i = (row * s.cols + col) * 3;
      s.field[i] = Math.max(
        -120,
        Math.min(120, s.field[i] + (dx * 0.5 + rx * 0.6) * weight),
      );
      s.field[i + 1] = Math.max(
        -120,
        Math.min(120, s.field[i + 1] + (dy * 0.5 + ry * 0.6) * weight),
      );
      s.field[i + 2] = Math.min(1, s.field[i + 2] + weight * 0.85);
    }
}
export function stepSmoke(s: SmokeWorld, elapsed: number, reduced = false) {
  const duration = Math.max(0, elapsed);
  const dt = Math.min(1 / 30, duration);
  s.time += duration;
  let energy = 0;
  for (let i = 0; i < s.field.length; i += 3) {
    s.field[i] *= Math.exp(-1.3 * duration);
    s.field[i + 1] *= Math.exp(-1.3 * duration);
    s.field[i + 2] *= Math.exp(-0.75 * duration);
    if (s.field[i + 2] < 0.002) s.field[i + 2] = 0;
    energy = Math.max(energy, s.field[i + 2]);
  }
  for (const p of s.puffs) {
    const [fx, fy] = smokeAt(s, p);
    if (!reduced) {
      p.vx += (fx * 1.1 + (p.homeX - p.x) * 1.4) * dt;
      p.vy += (fy * 1.1 + (p.homeY - p.y) * 1.4) * dt;
      p.vx *= Math.exp(-2 * dt);
      p.vy *= Math.exp(-2 * dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.spin * duration;
    }
  }
  for (let i = 0, j = 0; i < s.field.length; i += 3, j += 4) {
    s.pixels[j] = Math.round(128 + s.field[i]);
    s.pixels[j + 1] = Math.round(128 + s.field[i + 1]);
    s.pixels[j + 2] = Math.round(s.field[i + 2] * 255);
    s.pixels[j + 3] = 255;
  }
  return energy;
}
// Original, seeded value noise. No image, shader or noise implementation is copied.
export function smokeTexture(size = 256): Uint8ClampedArray {
  const random = smokeRandom(859),
    noise = Float32Array.from({ length: 64 * 64 }, () => random());
  const smooth = (t: number) => t * t * (3 - 2 * t),
    mix = (a: number, b: number, t: number) => a + (b - a) * t;
  function sample(x: number, y: number) {
    const ix = Math.floor(x),
      iy = Math.floor(y),
      fx = smooth(x - ix),
      fy = smooth(y - iy);
    const at = (a: number, b: number) =>
      noise[(((b % 64) + 64) % 64) * 64 + (((a % 64) + 64) % 64)];
    return mix(
      mix(at(ix, iy), at(ix + 1, iy), fx),
      mix(at(ix, iy + 1), at(ix + 1, iy + 1), fx),
      fy,
    );
  }
  const rgba = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = x / size,
        v = y / size;
      let n = 0,
        scale = 3,
        weight = 0.58;
      for (let octave = 0; octave < 5; octave++) {
        n += sample(u * scale + octave * 9, v * scale + octave * 5) * weight;
        scale *= 2.1;
        weight *= 0.48;
      }
      const edge = Math.max(0, 1 - Math.hypot((u - 0.5) * 2, (v - 0.5) * 2)),
        density = Math.pow(edge, 1.45) * Math.max(0, (n - 0.18) * 1.8),
        i = (y * size + x) * 4;
      rgba[i] = 105 + n * 60;
      rgba[i + 1] = 129 + n * 58;
      rgba[i + 2] = 127 + n * 56;
      rgba[i + 3] = Math.min(255, density * 255);
    }
  return rgba;
}
