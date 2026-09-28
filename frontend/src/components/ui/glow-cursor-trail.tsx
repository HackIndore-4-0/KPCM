"use client";

import React, { useEffect, useRef, useCallback } from "react";

const TRAIL_LENGTH = 8;
const EASE = 0.12;
const DOT_SIZE = 24;
const TRAIL_DOT_SIZE = 10;

interface TrailPoint {
  x: number;
  y: number;
  opacity: number;
}

export function GlowCursorTrail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement[]>([]);
  const positions = useRef<TrailPoint[]>(
    Array.from({ length: TRAIL_LENGTH + 1 }, () => ({ x: -200, y: -200, opacity: 0 }))
  );
  const mouse = useRef({ x: -200, y: -200 });
  const rafRef = useRef<number>(0);
  const mountedRef = useRef(true);

  const animate = useCallback(() => {
    if (!mountedRef.current) return;

    const pos = positions.current;
    // Main cursor follows mouse with easing
    pos[0].x += (mouse.current.x - pos[0].x) * EASE;
    pos[0].y += (mouse.current.y - pos[0].y) * EASE;
    pos[0].opacity = 1;

    // Trail points follow each other
    for (let i = 1; i <= TRAIL_LENGTH; i++) {
      pos[i].x += (pos[i - 1].x - pos[i].x) * EASE;
      pos[i].y += (pos[i - 1].y - pos[i].y) * EASE;
      pos[i].opacity = 1 - i / (TRAIL_LENGTH + 1);
    }

    // Apply positions to DOM elements
    const dots = dotsRef.current;
    if (dots[0]) {
      dots[0].style.transform = `translate(${pos[0].x - DOT_SIZE / 2}px, ${pos[0].y - DOT_SIZE / 2}px)`;
    }
    for (let i = 1; i <= TRAIL_LENGTH; i++) {
      const d = dots[i];
      if (d) {
        const size = TRAIL_DOT_SIZE * (1 - i / (TRAIL_LENGTH + 1));
        d.style.transform = `translate(${pos[i].x - size / 2}px, ${pos[i].y - size / 2}px)`;
        d.style.opacity = String(pos[i].opacity * 0.6);
        d.style.width = `${size}px`;
        d.style.height = `${size}px`;
      }
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;
    // Disable on prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    mountedRef.current = true;

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    window.addEventListener("mousemove", onMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    // Hide native cursor site-wide
    document.documentElement.style.cursor = "none";

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      document.documentElement.style.cursor = "";
    };
  }, [animate]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
    >
      {/* Main glowing cursor dot */}
      <div
        ref={(el) => {
          if (el) dotsRef.current[0] = el;
        }}
        style={{
          position: "fixed",
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,240,255,0.9) 0%, rgba(0,240,255,0.3) 50%, transparent 100%)",
          boxShadow: "0 0 12px 4px rgba(0,240,255,0.5), 0 0 30px 10px rgba(0,240,255,0.15)",
          willChange: "transform",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      {/* Trail dots */}
      {Array.from({ length: TRAIL_LENGTH }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) dotsRef.current[i + 1] = el;
          }}
          style={{
            position: "fixed",
            width: TRAIL_DOT_SIZE,
            height: TRAIL_DOT_SIZE,
            borderRadius: "50%",
            background: i % 2 === 0
              ? "radial-gradient(circle, rgba(0,240,255,0.8), transparent)"
              : "radial-gradient(circle, rgba(176,38,255,0.6), transparent)",
            willChange: "transform, opacity, width, height",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      ))}
    </div>
  );
}
