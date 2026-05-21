/**
 * Halftone backdrop driven by GitHub activity.
 *
 * Procedural halftone dots over an animated noise field, with dot radius
 * modulated by the 26-week contribution grid sampled as a texture. Drives a
 * single fullscreen quad, runs in a RAF loop. Respects prefers-reduced-motion
 * by rendering a single frame and stopping.
 *
 * KNOBS — tweak these to taste:
 */
export const DEFAULTS = {
  /** Cell size in pixels (smaller = denser dots) */
  gridSize: 14,
  /** Max dot radius as fraction of the cell (0..0.5) */
  baseRadius: 0.32,
  /** Min radius even when activity is 0 — keeps texture present */
  minRadius: 0.08,
  /** Animation speed for the noise field (0 = static) */
  noiseSpeed: 0.04,
  /** How strongly the contribution grid pulls the dot size up */
  activityGain: 0.55,
  /** Overall mix of shader over background (0 = invisible, 1 = solid) */
  opacity: 0.22,
  /** Dot color (RGB triplet, 0..1) — defaults to the forest accent */
  tint: [0.122, 0.302, 0.247] as [number, number, number],
  /** Background tint (RGB triplet, 0..1) — defaults to off-white */
  background: [0.98, 0.98, 0.969] as [number, number, number],
};

export type HalftoneOptions = Partial<typeof DEFAULTS> & {
  /** Contribution grid (rows = days, cols = weeks). Values are raw daily commit counts. */
  grid: number[][];
  /** Aggregate activity, normalized 0..1. Scales the whole field. */
  activity: number;
};

/* eslint-disable */
const VERTEX = /* glsl */ `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform vec2  uResolution;
uniform float uTime;
uniform float uActivity;    // 0..1 normalized aggregate
uniform float uGridSize;    // px
uniform float uBaseRadius;  // 0..0.5
uniform float uMinRadius;
uniform float uActivityGain;
uniform float uOpacity;
uniform vec3  uTint;
uniform vec3  uBackground;
uniform sampler2D uGrid;    // contribution heatmap (cols x rows)
uniform vec2  uGridDims;    // (cols, rows)

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  vec2 px = vUv * uResolution;
  vec2 cellOrigin = uGridSize * floor(px / uGridSize);
  vec2 cellCenter = cellOrigin + uGridSize * 0.5;
  vec2 cellUv = (px - cellCenter) / uGridSize;        // -0.5..0.5

  // Sample the contribution grid in normalized canvas space.
  // The grid is cols x rows; we wrap so the pattern tiles when content is tall.
  vec2 gridSample = vec2(
    fract(cellCenter.x / uResolution.x),
    fract(cellCenter.y / uResolution.x * (uResolution.x / uResolution.y))
  );
  float contribution = texture2D(uGrid, gridSample).r;

  // Procedural noise layered over contribution.
  vec2 fieldUv = cellCenter / uResolution;
  float n = noise(fieldUv * 4.0 + vec2(uTime * 0.5, uTime * 0.3));
  n = mix(0.3, 1.0, n);

  // Final intensity drives the dot radius.
  float intensity = clamp(
    n * 0.55 + contribution * 0.85 + uActivity * uActivityGain,
    0.0, 1.0
  );

  float r = mix(uMinRadius, uBaseRadius, intensity);
  float d = length(cellUv);
  float dotMask = 1.0 - smoothstep(r - 0.01, r + 0.01, d);

  vec3 color = mix(uBackground, uTint, dotMask * uOpacity);
  gl_FragColor = vec4(color, 1.0);
}
`;
/* eslint-enable */

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("could not create shader");
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`shader compile failed: ${log}`);
  }
  return sh;
}

function makeProgram(gl: WebGLRenderingContext): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const prog = gl.createProgram();
  if (!prog) throw new Error("could not create program");
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`program link failed: ${gl.getProgramInfoLog(prog)}`);
  }
  return prog;
}

function makeGridTexture(gl: WebGLRenderingContext, grid: number[][]): { tex: WebGLTexture; dims: [number, number] } {
  const rows = grid.length;
  const cols = Math.max(...grid.map((r) => r.length), 1);
  // Find max for normalization, clamp lower bound so a flat grid still renders.
  let max = 0;
  for (const row of grid) for (const v of row) if (v > max) max = v;
  max = Math.max(max, 1);
  const data = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = grid[r]?.[c] ?? 0;
      data[r * cols + c] = Math.round((v / max) * 255);
    }
  }
  const tex = gl.createTexture();
  if (!tex) throw new Error("could not create texture");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, cols, rows, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  return { tex, dims: [cols, rows] };
}

export function mountHalftone(canvas: HTMLCanvasElement, options: HalftoneOptions): () => void {
  const opts = { ...DEFAULTS, ...options };
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) {
    console.warn("[halftone] WebGL not available, skipping backdrop");
    return () => {};
  }

  const program = makeProgram(gl);
  gl.useProgram(program);

  // Fullscreen quad.
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {
    uResolution: gl.getUniformLocation(program, "uResolution"),
    uTime: gl.getUniformLocation(program, "uTime"),
    uActivity: gl.getUniformLocation(program, "uActivity"),
    uGridSize: gl.getUniformLocation(program, "uGridSize"),
    uBaseRadius: gl.getUniformLocation(program, "uBaseRadius"),
    uMinRadius: gl.getUniformLocation(program, "uMinRadius"),
    uActivityGain: gl.getUniformLocation(program, "uActivityGain"),
    uOpacity: gl.getUniformLocation(program, "uOpacity"),
    uTint: gl.getUniformLocation(program, "uTint"),
    uBackground: gl.getUniformLocation(program, "uBackground"),
    uGrid: gl.getUniformLocation(program, "uGrid"),
    uGridDims: gl.getUniformLocation(program, "uGridDims"),
  };

  const { tex: gridTex, dims: gridDims } = makeGridTexture(gl, opts.grid);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, gridTex);
  if (uniforms.uGrid) gl.uniform1i(uniforms.uGrid, 0);
  if (uniforms.uGridDims) gl.uniform2f(uniforms.uGridDims, gridDims[0], gridDims[1]);
  if (uniforms.uActivity) gl.uniform1f(uniforms.uActivity, opts.activity);
  if (uniforms.uGridSize) gl.uniform1f(uniforms.uGridSize, opts.gridSize);
  if (uniforms.uBaseRadius) gl.uniform1f(uniforms.uBaseRadius, opts.baseRadius);
  if (uniforms.uMinRadius) gl.uniform1f(uniforms.uMinRadius, opts.minRadius);
  if (uniforms.uActivityGain) gl.uniform1f(uniforms.uActivityGain, opts.activityGain);
  if (uniforms.uOpacity) gl.uniform1f(uniforms.uOpacity, opts.opacity);
  if (uniforms.uTint) gl.uniform3f(uniforms.uTint, opts.tint[0], opts.tint[1], opts.tint[2]);
  if (uniforms.uBackground) gl.uniform3f(uniforms.uBackground, opts.background[0], opts.background[1], opts.background[2]);

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(window.innerWidth * dpr));
    const h = Math.max(1, Math.floor(window.innerHeight * dpr));
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    gl!.viewport(0, 0, w, h);
    if (uniforms.uResolution) gl!.uniform2f(uniforms.uResolution, w, h);
  }
  resize();

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let running = true;
  const start = performance.now();

  function frame(now: number) {
    if (!running) return;
    const t = (now - start) / 1000;
    if (uniforms.uTime) gl!.uniform1f(uniforms.uTime, opts.noiseSpeed * t);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    if (!reduced) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  const ro = new ResizeObserver(resize);
  ro.observe(document.documentElement);
  window.addEventListener("resize", resize, { passive: true });

  return () => {
    running = false;
    ro.disconnect();
    window.removeEventListener("resize", resize);
    gl.deleteProgram(program);
    gl.deleteTexture(gridTex);
    gl.deleteBuffer(buf);
  };
}
