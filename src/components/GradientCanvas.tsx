"use client";

import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

vec3 c1 = vec3(0.45, 0.75, 0.92); // blue
vec3 c2 = vec3(0.60, 0.50, 0.95); // purple
vec3 c3 = vec3(0.85, 0.82, 0.78); // warm white

float wave(vec2 p, float speed, float freq) {
  return sin(p.x * freq + u_time * speed) * cos(p.y * freq * 0.8 + u_time * speed * 0.6) * 0.5 + 0.5;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv.y = 1.0 - uv.y;

  float w1 = wave(uv, 0.25, 2.2);
  float w2 = wave(uv + vec2(0.3, 0.5), 0.18, 1.6);
  float w3 = wave(uv - vec2(0.2, 0.1), 0.20, 3.0);

  vec3 color = mix(c1, c2, w1);
  color = mix(color, c3, w2 * 0.55);
  color = mix(color, c1, w3 * 0.25);

  gl_FragColor = vec4(color, 1.0);
}
`;

export default function GradientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    // Compile shaders
    function compile(type: number, src: string) {
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, src);
      gl!.compileShader(shader);
      return shader;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    gl.useProgram(program);

    // Fullscreen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const pos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_resolution");

    // Resize handler
    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener("resize", resize);

    // Animate
    let raf: number;
    let start: number | null = null;

    function draw(ts: number) {
      if (!start) start = ts;
      const t = (ts - start) / 1000;
      gl!.uniform1f(uTime, t);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[-1]"
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #73bfeb 0%, #9980f2 50%, #d9d4c5 100%)",
      }}
    />
  );
}
