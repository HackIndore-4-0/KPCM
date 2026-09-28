"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Zoom factor for the visual pattern.
const ZOOM_FACTOR = 0.3;

// Base wave amplitude in domain warping.
const BASE_WAVE_AMPLITUDE = 0.2;

// Additional factor for random amplitude variations.
// waveAmp = BASE_WAVE_AMPLITUDE + RANDOM_WAVE_FACTOR * noise2D(...)
const RANDOM_WAVE_FACTOR = 0.15;

// Frequency multiplier for wave domain warp.
const WAVE_FREQUENCY = 4.0;

// Time speed factor (overall speed of animation).
const TIME_FACTOR = 0.25;

// Swirl strength near the center.
const BASE_SWIRL_STRENGTH = 1.2;

// Finer swirl timing factor.
const SWIRL_TIME_MULT = 5.0;

// Additional swirl effect modulated by noise.
const NOISE_SWIRL_FACTOR = 0.2;

// Number of fractal noise octaves in fbm (must be integer).
const FBM_OCTAVES = 10;

// 20-step palette of blues.
// If the darkest color is used, alpha=0 => total transparency in darkest areas.
const seaColors = [
  [0.0, 0.02, 0.05],
  [0.0, 0.04, 0.08],
  [0.0, 0.06, 0.12],
  [0.0, 0.08, 0.18],
  [0.0, 0.1, 0.24],
  [0.0, 0.14, 0.32],
  [0.0, 0.2, 0.4],
  [0.0, 0.24, 0.48],
  [0.0, 0.3, 0.55],
  [0.05, 0.35, 0.6],
  [0.08, 0.4, 0.65],
  [0.1, 0.45, 0.7],
  [0.15, 0.5, 0.75],
  [0.2, 0.58, 0.8],
  [0.25, 0.65, 0.85],
  [0.3, 0.72, 0.9],
  [0.4, 0.78, 0.92],
  [0.5, 0.85, 0.95],
  [0.7, 0.9, 0.97],
  [0.85, 0.95, 1.0]
];

////////////////////////////////////////////////////////////////////////////////
// DYNAMIC FRAGMENT SHADER BUILDER
////////////////////////////////////////////////////////////////////////////////

function buildFragmentShader(): string {
  // Force integer for the for-loop.
  const fbmOctavesInt = Math.floor(FBM_OCTAVES);

  // Convert seaColors array to GLSL array of vec3.
  const colorArraySrc = seaColors.map((c) => `vec3(${c[0]}, ${c[1]}, ${c[2]})`).join(",\n  ");

  return `#version 300 es

precision highp float;
out vec4 outColor;

uniform vec2 uResolution;
uniform float uTime;

#define NUM_COLORS 20

// 20-step palette of blues.
vec3 seaColors[NUM_COLORS] = vec3[](
  ${colorArraySrc}
);

// ----------------------------------------------------------
// Perlin-like noise
// ----------------------------------------------------------
vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float noise2D(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
  );

  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  i = mod(i, 289.0);
  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0)) +
    i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
    0.5 - vec3(
      dot(x0, x0),
      dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)
    ),
    0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.792843 - 0.853734 * (a0 * a0 + h * h);

  vec3 g;
  g.x  = a0.x  * x0.x + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;

  return 130.0 * dot(m, g);
}

// ----------------------------------------------------------
// Fractional Brownian Motion
// ----------------------------------------------------------
float fbm(vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  float freq = 1.0;
  for (int i = 0; i < ${fbmOctavesInt}; i++) {
    value += amplitude * noise2D(st * freq);
    freq *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  // Normalize coords to [-1,1]
  vec2 uv = (gl_FragCoord.xy / uResolution.xy) * 2.0 - 1.0;
  uv.x *= uResolution.x / uResolution.y;

  // Zoom in so pattern is bigger and less obviously repeated
  uv *= float(${ZOOM_FACTOR});

  // Time factor for wave domain warp
  float t = uTime * float(${TIME_FACTOR});

  // Random amplitude that changes over time
  float waveAmp = float(${BASE_WAVE_AMPLITUDE}) + float(${RANDOM_WAVE_FACTOR})
                  * noise2D(vec2(t, 27.7));

  // Sine-based domain warp
  float waveX = waveAmp * sin(uv.y * float(${WAVE_FREQUENCY}) + t);
  float waveY = waveAmp * sin(uv.x * float(${WAVE_FREQUENCY}) - t);
  uv.x += waveX;
  uv.y += waveY;

  // Additional swirl near center
  float r = length(uv);
  float angle = atan(uv.y, uv.x);
  float swirlStrength = float(${BASE_SWIRL_STRENGTH})
                        * (1.0 - smoothstep(0.0, 1.0, r));

  angle += swirlStrength * sin(uTime + r * float(${SWIRL_TIME_MULT}));
  uv = vec2(cos(angle), sin(angle)) * r;

  // Evaluate fractal noise
  float n = fbm(uv);

  // Additional swirl effect modulated by noise
  float swirlEffect = float(${NOISE_SWIRL_FACTOR})
                      * sin(t + n * 3.0);
  n += swirlEffect;

  // Convert noise to [0..1]
  float noiseVal = 0.5 * (n + 1.0);

  // Discrete palette sampling
  float idx = clamp(noiseVal, 0.0, 1.0) * float(NUM_COLORS - 1);
  int iLow = int(floor(idx));
  int iHigh = int(min(float(iLow + 1), float(NUM_COLORS - 1)));
  float f = fract(idx);

  vec3 colLow = seaColors[iLow];
  vec3 colHigh = seaColors[iHigh];
  vec3 color = mix(colLow, colHigh, f);

  // If it's the darkest color, set alpha=0 => total transparency
  if (iLow == 0 && iHigh == 0) {
    outColor = vec4(color, 0.0);
  } else {
    outColor = vec4(color, 1.0);
  }
}
`;
}

interface BlueMeshyBackgroundProps {
  className?: string;
}

export function BlueMeshyBackground({ className }: BlueMeshyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2");
    if (!gl) return;

    // --- Vertex shader (simple fullscreen quad) ---
    const vsSource = `#version 300 es
      in vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const fsSource = buildFragmentShader();

    function compileShader(type: number, source: string): WebGLShader | null {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error(gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // Fullscreen quad
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uTime = gl.getUniformLocation(program, "uTime");

    let raf = 0;
    let startTime = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className
      )}
    />
  );
}
