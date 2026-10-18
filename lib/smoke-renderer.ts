import { smokeArrival, type SmokeWorld } from "./smoke404";
export type SmokeRenderer = {
  draw: (world: SmokeWorld) => void;
  dispose: () => void;
};
const vertex = `attribute vec2 position;attribute vec2 uv;attribute vec2 material;uniform float height;varying vec2 vUV;varying vec2 vWorld;varying vec2 vMaterial;void main(){vUV=uv;vWorld=vec2(position.x/1000.,position.y/height);vMaterial=material;gl_Position=vec4(position.x/500.-1.,1.-position.y/height*2.,0.,1.);}`;
const fragment = `precision mediump float;uniform sampler2D smoke;uniform sampler2D wind;uniform sampler2D turbulence;uniform float arrival;varying vec2 vUV;varying vec2 vWorld;varying vec2 vMaterial;void main(){vec3 flow=texture2D(wind,clamp(vWorld,0.,1.)).rgb;vec2 shift=(flow.rg-.502)*.24;vec4 cloud=texture2D(smoke,vUV-shift);vec2 turbulenceUV=vec2(.15)+vWorld*.7-(flow.rg-.502)*.025;float grain=clamp((texture2D(turbulence,turbulenceUV).r*255.-105.)/60.,0.,1.);float ragged=smoothstep(.4,.65,grain);float clearing=clamp(flow.b*(.55+ragged*1.3),0.,.96);float curl=texture2D(smoke,vUV+shift*2.).a;vec3 color=cloud.rgb*vMaterial.y*(.48+curl*.65);float alpha=cloud.a*vMaterial.x*arrival*(1.-clearing);gl_FragColor=vec4(color,alpha);}`;
export function createSmokeGL(
  canvas: HTMLCanvasElement,
  image: HTMLCanvasElement,
  sourcePixels: Uint8ClampedArray,
): SmokeRenderer | null {
  let gl: WebGLRenderingContext | null;
  try {
    gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }
  if (!gl) return null;
  const g = gl;
  const shaders: WebGLShader[] = [],
    textures: WebGLTexture[] = [];
  let program: WebGLProgram | null = null,
    buffer: WebGLBuffer | null = null;
  function dispose() {
    for (const t of textures) g.deleteTexture(t);
    for (const s of shaders) g.deleteShader(s);
    g.deleteBuffer(buffer);
    g.deleteProgram(program);
  }
  try {
    const compile = (type: number, source: string) => {
      const s = g.createShader(type);
      if (!s) throw Error("shader");
      shaders.push(s);
      g.shaderSource(s, source);
      g.compileShader(s);
      if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw Error("compile");
      return s;
    };
    program = g.createProgram();
    if (!program) throw Error("program");
    g.attachShader(program, compile(g.VERTEX_SHADER, vertex));
    g.attachShader(program, compile(g.FRAGMENT_SHADER, fragment));
    g.linkProgram(program);
    if (!g.getProgramParameter(program, g.LINK_STATUS)) throw Error("link");
    g.useProgram(program);
    buffer = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, buffer);
    for (const [name, size, offset] of [
      ["position", 2, 0],
      ["uv", 2, 8],
      ["material", 2, 16],
    ] as const) {
      const index = g.getAttribLocation(program, name);
      g.enableVertexAttribArray(index);
      g.vertexAttribPointer(index, size, g.FLOAT, false, 24, offset);
    }
    for (let i = 0; i < 3; i++) {
      const t = g.createTexture();
      if (!t) throw Error("texture");
      textures.push(t);
      g.activeTexture(g.TEXTURE0 + i);
      g.bindTexture(g.TEXTURE_2D, t);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    }
    g.activeTexture(g.TEXTURE0);
    g.bindTexture(g.TEXTURE_2D, textures[0]);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, image);
    // Keep density noise opaque: Canvas premultiplication quantizes RGB in
    // translucent wisps and would make the shared flow boundary look blocky.
    const noisePixels = new Uint8Array(sourcePixels);
    for (let i = 3; i < noisePixels.length; i += 4) noisePixels[i] = 255;
    g.activeTexture(g.TEXTURE2);
    g.bindTexture(g.TEXTURE_2D, textures[2]);
    g.texImage2D(
      g.TEXTURE_2D,
      0,
      g.RGBA,
      image.width,
      image.height,
      0,
      g.RGBA,
      g.UNSIGNED_BYTE,
      noisePixels,
    );
    g.uniform1i(g.getUniformLocation(program, "turbulence"), 2);
    g.uniform1i(g.getUniformLocation(program, "smoke"), 0);
    g.uniform1i(g.getUniformLocation(program, "wind"), 1);
    const height = g.getUniformLocation(program, "height"),
      arrival = g.getUniformLocation(program, "arrival");
    g.enable(g.BLEND);
    g.blendFuncSeparate(
      g.SRC_ALPHA,
      g.ONE_MINUS_SRC_ALPHA,
      g.ONE,
      g.ONE_MINUS_SRC_ALPHA,
    );
    const vertices = new Float32Array(56 * 6 * 6),
      corners = [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ];
    return {
      draw(world) {
        let offset = 0;
        for (const p of world.puffs) {
          const c = Math.cos(p.angle),
            s = Math.sin(p.angle);
          for (const [x, y] of corners) {
            vertices[offset++] = p.x + (x * c - y * s) * p.radius;
            vertices[offset++] = p.y + (x * s + y * c) * p.radius;
            vertices[offset++] = (x + 1) / 2;
            vertices[offset++] = (y + 1) / 2;
            vertices[offset++] = p.opacity;
            vertices[offset++] = p.tint;
          }
        }
        g.viewport(0, 0, canvas.width, canvas.height);
        g.clearColor(0, 0, 0, 0);
        g.clear(g.COLOR_BUFFER_BIT);
        g.useProgram(program);
        g.uniform1f(height, world.height);
        g.uniform1f(arrival, smokeArrival(world.time));
        g.activeTexture(g.TEXTURE1);
        g.bindTexture(g.TEXTURE_2D, textures[1]);
        g.texImage2D(
          g.TEXTURE_2D,
          0,
          g.RGBA,
          world.cols,
          world.rows,
          0,
          g.RGBA,
          g.UNSIGNED_BYTE,
          world.pixels,
        );
        g.bindBuffer(g.ARRAY_BUFFER, buffer);
        g.bufferData(
          g.ARRAY_BUFFER,
          vertices.subarray(0, offset),
          g.DYNAMIC_DRAW,
        );
        g.drawArrays(g.TRIANGLES, 0, world.puffs.length * 6);
      },
      dispose,
    };
  } catch {
    dispose();
    return null;
  }
}
export function createSmokeCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLCanvasElement,
): SmokeRenderer | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const mask = document.createElement("canvas"),
    m = mask.getContext("2d");
  if (!m) return null;
  return {
    draw(world) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(canvas.width / 1000, canvas.height / world.height);
      for (const p of world.puffs) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.opacity * smokeArrival(world.time);
        ctx.drawImage(image, -p.radius, -p.radius, p.radius * 2, p.radius * 2);
        ctx.restore();
      }
      ctx.restore();
      if (mask.width !== world.cols || mask.height !== world.rows) {
        mask.width = world.cols;
        mask.height = world.rows;
      }
      const pixels = m.createImageData(world.cols, world.rows);
      for (let i = 0; i < pixels.data.length; i += 4)
        pixels.data[i + 3] = Math.min(255, world.pixels[i + 2] * 2);
      m.putImageData(pixels, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    },
    dispose() {
      mask.width = 0;
    },
  };
}
