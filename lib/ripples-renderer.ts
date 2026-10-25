import { surfaceAt, type RippleState } from "./ripples404";

function random(seed: number) {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}
const four =
  "M64 0 Q67 -3 73 -3 L96 -3 Q102 -3 101 4 L87 82 L109 82 L105 107 L82 107 L76 139 L47 139 L53 107 L-9 107 L-5 82 Z M28 82 L58 82 L67 33 Z";
const zero =
  "M54 -4 C96 -4 111 23 103 69 C95 116 76 143 36 143 C-4 143 -16 113 -8 70 C0 25 17 -4 54 -4 Z M49 24 C33 24 26 40 20 70 C14 102 18 115 37 115 C55 115 66 99 72 69 C78 40 74 24 49 24 Z";

export function createRippleRenderer() {
  const digits = [new Path2D(four), new Path2D(zero), new Path2D(four)];
  const leaf = new Path2D(
    "M-36 0 C-19 -18 -4 -25 17 -10 Q28 -5 36 0 Q19 4 10 15 C-6 22 -24 14 -36 0Z",
  );
  // Fixed irregular shapes, advected and deformed by the shared wind. No image background.
  const patches = Array.from({ length: 420 }, (_, i) => ({
    x: random(i + 1),
    y: random(i + 501),
    length: 0.014 + random(i + 1001) * 0.105,
    depth: 0.003 + random(i + 1501) * 0.012,
    light: random(i + 2001),
    phase: random(i + 2501) * Math.PI * 2,
  }));
  function paint(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    state: RippleState,
    reduced: boolean,
  ) {
    const force = Math.min(1, Math.hypot(state.wind.x, state.wind.y));
    const motion = reduced ? 0 : state.phase;
    const water = ctx.createLinearGradient(0, 0, width * 0.35, height);
    water.addColorStop(0, "#8bbcbf");
    water.addColorStop(0.42, "#568f9a");
    water.addColorStop(1, "#286171");
    ctx.fillStyle = water;
    ctx.fillRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(
      width * 0.94,
      height * 0.08,
      0,
      width * 0.82,
      height * 0.12,
      width * 0.85,
    );
    glow.addColorStop(0, "#f6e8ba88");
    glow.addColorStop(0.4, "#bad9c12b");
    glow.addColorStop(1, "#bbdacf00");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    const direction = Math.atan2(state.wind.y, state.wind.x);
    // Perspective keeps the surface broad and quiet; wind turns the small wavelets.
    const angle =
      Math.atan2(Math.sin(direction) * 0.45, Math.cos(direction)) * 0.35;
    for (let i = 0; i < patches.length; i++) {
      const p = patches[i];
      const travel = reduced ? 0 : motion * 0.003;
      const x =
        ((((p.x + Math.cos(direction) * travel) % 1.12) + 1.12) % 1.12) *
          width -
        width * 0.06;
      const y =
        ((((p.y + Math.sin(direction) * travel) % 1.08) + 1.08) % 1.08) *
          height -
        height * 0.04;
      const sample = surfaceAt(state, p.x, p.y, reduced);
      const length = p.length * width * (0.6 + p.y * 0.5);
      const depth = p.depth * height * (0.5 + p.y * 0.7);
      const shift = Math.sin(motion * 0.65 + p.phase);
      ctx.save();
      ctx.translate(x, y + sample.height * 0.5);
      ctx.rotate(angle + shift * 0.025);
      ctx.beginPath();
      ctx.moveTo(-length / 2, 0);
      ctx.bezierCurveTo(
        -length * 0.2,
        -depth,
        length * 0.03,
        depth * 0.55,
        length / 2,
        -depth * 0.3,
      );
      ctx.bezierCurveTo(
        length * 0.21,
        depth * 0.5,
        -length * 0.02,
        depth * 1.1,
        -length / 2,
        0,
      );
      ctx.fillStyle =
        p.light > 0.5
          ? `rgba(191,224,220,${0.055 + p.light * 0.07 + force * 0.025})`
          : `rgba(16,76,93,${0.035 + p.light * 0.13})`;
      ctx.fill();
      // Broken warm reflections cluster toward the light, with no flashing particles.
      const corridor = Math.abs(p.x - (0.94 - p.y * 0.22));
      if (p.light > 0.64 && corridor < 0.22) {
        ctx.beginPath();
        ctx.moveTo(-length * 0.32, 0);
        ctx.bezierCurveTo(
          -length * 0.12,
          -depth * 0.5,
          length * 0.12,
          depth * 0.3,
          length * 0.3,
          -depth * 0.2,
        );
        ctx.strokeStyle = `rgba(255,239,190,${
          (0.1 + (1 - corridor / 0.22) * 0.24) * (0.85 + shift * 0.15)
        })`;
        ctx.lineWidth = Math.max(0.7, depth * 0.11);
        ctx.stroke();
      }
      ctx.restore();
    }
    const groupWidth = Math.min(
      width * (width < 650 ? 0.79 : 0.57),
      760,
      height * 1.35,
    );
    const scale = groupWidth / 350;
    const centerY = height * 0.47;
    digits.forEach((path, i) => {
      const x = width * 0.5 + (i - 1) * scale * 124;
      const sample = surfaceAt(state, 0.33 + i * 0.17, 0.47, reduced);
      const y = centerY + (i - 1) * scale * 11 + sample.height;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(0.09 + sample.tilt);
      ctx.scale(scale, scale);
      ctx.transform(1, 0, -0.22, 0.82, 0, 0);
      ctx.translate(-47, -70);
      // Thin waterline rings, interrupted rather than concentric target circles.
      ctx.save();
      ctx.translate(47, 132);
      ctx.scale(1, 0.18);
      ctx.strokeStyle = "#d6e6d34d";
      ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.ellipse(
          0,
          0,
          62 + k * 8 + sample.height,
          35 + k * 3,
          0,
          0.2 + k,
          1.8 + k,
        );
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = "#174b5c44";
      ctx.save();
      ctx.translate(2, 12);
      ctx.fill(path, "evenodd");
      ctx.restore();
      // A shallow extruded edge, with its shadow touching the water.
      ctx.fillStyle = "#a4b8af";
      for (let z = 8; z > 0; z -= 2) {
        ctx.save();
        ctx.translate(0, z);
        ctx.fill(path, "evenodd");
        ctx.restore();
      }
      const face = ctx.createLinearGradient(0, 0, 65, 145);
      face.addColorStop(0, "#fff7e3");
      face.addColorStop(0.58, "#f0e8d3");
      face.addColorStop(1, "#dbdfcb");
      ctx.fillStyle = face;
      ctx.fill(path, "evenodd");
      ctx.strokeStyle = "#fff8dfb3";
      ctx.lineWidth = 1.2;
      ctx.stroke(path);
      ctx.restore();
      // Small drifting fragments below each letter suggest a broken reflection.
      for (let k = 0; k < 7; k++) {
        const sway = Math.sin(motion + k * 1.7 + i) * (2 + force * 3);
        ctx.fillStyle = `rgba(236,229,194,${0.12 - k * 0.013})`;
        ctx.beginPath();
        ctx.ellipse(
          x + sway - k * 1.5,
          y + scale * (66 + k * 5),
          scale * (23 - k * 1.8),
          scale * 1.1,
          0.09,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    });
    const ls = Math.max(0.32, Math.min(0.85, groupWidth / 850));
    const sample = surfaceAt(state, state.leaf.x, state.leaf.y, reduced);
    ctx.save();
    ctx.translate(
      state.leaf.x * width,
      state.leaf.y * height + sample.height * 0.45,
    );
    ctx.rotate((reduced ? -0.4 : state.leaf.angle) + sample.tilt);
    ctx.scale(ls, ls * 0.76);
    ctx.save();
    ctx.translate(1, 6);
    ctx.fillStyle = "#123f5166";
    ctx.fill(leaf);
    ctx.restore();
    ctx.strokeStyle = "#cde1cd66";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 4, 45, 20, 0, 0.2, 2.7);
    ctx.stroke();
    const autumn = ctx.createLinearGradient(-20, -18, 12, 18);
    autumn.addColorStop(0, "#e5d275");
    autumn.addColorStop(0.5, "#c4bd62");
    autumn.addColorStop(1, "#9b8745");
    ctx.fillStyle = autumn;
    ctx.fill(leaf);
    ctx.strokeStyle = "#dcd094";
    ctx.lineWidth = 0.8;
    ctx.stroke(leaf);
    ctx.strokeStyle = "#7c733fa6";
    ctx.beginPath();
    ctx.moveTo(-45, -2);
    ctx.quadraticCurveTo(-12, 4, 34, 0);
    for (let j = -22; j <= 16; j += 10) {
      ctx.moveTo(j, 1);
      ctx.lineTo(j + 7, -10);
      ctx.moveTo(j, 1);
      ctx.lineTo(j + 9, 10);
    }
    ctx.stroke();
    ctx.restore();
    // Artwork-only veils protect shared navigation without changing gallery CSS.
    const veil = ctx.createLinearGradient(0, 0, 0, height);
    veil.addColorStop(0, "#123e50c9");
    veil.addColorStop(Math.min(0.14, 72 / height), "#123e50b3");
    veil.addColorStop(Math.min(0.24, 150 / height), "#17465400");
    veil.addColorStop(Math.max(0.7, 1 - 150 / height), "#123e5000");
    veil.addColorStop(1, "#123746d9");
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, width, height);
  }
  return { paint };
}
