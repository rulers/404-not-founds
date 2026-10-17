import type { Liquid } from "./liquid404";
export type LiquidRenderer = { draw: (s: Liquid) => void; dispose: () => void };
const vertex = `attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
const fragment = `precision highp float;
uniform vec2 resolution;uniform float height;uniform int count;uniform vec3 drops[64];
void main(){vec2 p=vec2(gl_FragCoord.x/resolution.x*1000.,(1.-gl_FragCoord.y/resolution.y)*height);float f=0.;vec2 grad=vec2(0.);
for(int i=0;i<64;i++){if(i>=count)break;vec2 d=p-drops[i].xy;float r=drops[i].z;float v=exp(-dot(d,d)/(r*r));f+=v;grad+=-2.*d/(r*r)*v;}
float mask=smoothstep(.49,.55,f);if(mask<.005){gl_FragColor=vec4(0.);return;}
vec3 normal=normalize(vec3(-grad*45./(1.+f*f),.8));vec3 light=normalize(vec3(-.5,-.7,.8));float diffuse=max(0.,dot(normal,light));float spec=pow(max(0.,dot(reflect(-light,normal),vec3(0.,0.,1.))),28.);float rim=pow(1.-normal.z,2.);
vec3 color=mix(vec3(.025,.055,.39),vec3(.16,.28,.86),diffuse);color+=vec3(.65,.85,1.)*spec*.8+vec3(.22,.45,.9)*rim*.28;gl_FragColor=vec4(color,mask);}`;
export function createWebGLLiquid(
  canvas: HTMLCanvasElement,
): LiquidRenderer | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw Error("shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      throw Error("compile");
    }
    return shader;
  };
  let vs: WebGLShader | null = null,
    fs: WebGLShader | null = null,
    program: WebGLProgram | null = null,
    buffer: WebGLBuffer | null = null;
  try {
    vs = compile(gl.VERTEX_SHADER, vertex);
    fs = compile(gl.FRAGMENT_SHADER, fragment);
    program = gl.createProgram();
    if (!program) throw Error("program");
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error("link");
    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program, "resolution"),
      height = gl.getUniformLocation(program, "height"),
      count = gl.getUniformLocation(program, "count"),
      drops = gl.getUniformLocation(program, "drops[0]"),
      values = new Float32Array(64 * 3);
    return {
      draw(s) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(program);
        gl.uniform2f(resolution, canvas.width, canvas.height);
        gl.uniform1f(height, s.height);
        gl.uniform1i(count, s.drops.length);
        s.drops.forEach((p, i) => {
          values[i * 3] = p.x;
          values[i * 3 + 1] = p.y;
          values[i * 3 + 2] = p.r;
        });
        gl.uniform3fv(drops, values);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
      dispose() {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      },
    };
  } catch {
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return null;
  }
}
// Same movable mass, rasterized at low resolution when WebGL is unavailable.
export function createCanvasLiquid(
  canvas: HTMLCanvasElement,
): LiquidRenderer | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const field = document.createElement("canvas"),
    f = field.getContext("2d", { willReadFrequently: true });
  if (!f) return null;
  return {
    draw(s) {
      field.width = 280;
      field.height = Math.min(600, Math.round(s.height * 0.28));
      const sx = field.width / 1000,
        sy = field.height / s.height;
      f.clearRect(0, 0, field.width, field.height);
      f.filter = "blur(4px)";
      f.fillStyle = "rgba(0,0,255,.75)";
      for (const p of s.drops) {
        f.beginPath();
        f.ellipse(
          p.x * sx,
          p.y * sy,
          p.r * sx * 1.3,
          p.r * sy * 1.3,
          0,
          0,
          Math.PI * 2,
        );
        f.fill();
      }
      f.filter = "none";
      const image = f.getImageData(0, 0, field.width, field.height);
      for (let i = 0; i < image.data.length; i += 4) {
        const a = image.data[i + 3];
        image.data[i] = 24;
        image.data[i + 1] = 45 + Math.round(a * 0.1);
        image.data[i + 2] = 175;
        image.data[i + 3] = Math.max(0, Math.min(255, (a - 90) * 8));
      }
      f.putImageData(image, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(field, 0, 0, canvas.width, canvas.height);
    },
    dispose() {
      field.width = 0;
    },
  };
}
