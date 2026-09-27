import React, { useEffect, useRef } from 'react';

export const VortexBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let angle = 0;
    const rings = 42;

    const render = () => {
      ctx.fillStyle = '#090807';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height * 0.38;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Draw hyperbolic curves radiating outward like QRONOS
      for (let i = 0; i < rings; i++) {
        const radius = Math.pow(i / rings, 1.8) * Math.max(width, height) * 0.85;
        const alpha = Math.sin((i / rings) * Math.PI) * 0.16 + 0.02;

        ctx.beginPath();
        ctx.strokeStyle = i % 3 === 0 
          ? `rgba(217, 119, 6, ${alpha * 0.9})` // Warm bronze
          : `rgba(214, 207, 197, ${alpha * 0.6})`; // Muted sand

        ctx.lineWidth = i % 4 === 0 ? 1.2 : 0.6;

        // Hyperbolic curved oval with slight twist
        const twist = Math.sin(angle * 0.5 + i * 0.08) * 0.25;
        const stretchX = 1.35 + Math.sin(angle * 0.2 + i * 0.05) * 0.1;
        const stretchY = 0.55 + Math.cos(angle * 0.2 + i * 0.05) * 0.05;

        ctx.ellipse(0, 0, radius * stretchX, radius * stretchY, twist + (i * 0.02), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw subtle connecting rays
      const rays = 24;
      for (let j = 0; j < rays; j++) {
        const theta = (j / rays) * Math.PI * 2 + angle * 0.1;
        const r1 = 30;
        const r2 = Math.max(width, height) * 0.7;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(184, 174, 159, 0.035)`;
        ctx.lineWidth = 0.5;

        // Curved bezier rays
        const cpX = Math.cos(theta + 0.35) * (r2 * 0.4);
        const cpY = Math.sin(theta + 0.35) * (r2 * 0.2);

        ctx.moveTo(Math.cos(theta) * r1, Math.sin(theta) * r1);
        ctx.quadraticCurveTo(cpX, cpY, Math.cos(theta) * r2, Math.sin(theta) * r2 * 0.6);
        ctx.stroke();
      }

      ctx.restore();

      // Ambient warm radial spotlight
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 10,
        centerX, centerY, width * 0.6
      );
      gradient.addColorStop(0, 'rgba(217, 119, 6, 0.08)');
      gradient.addColorStop(0.35, 'rgba(23, 21, 19, 0.4)');
      gradient.addColorStop(1, 'rgba(9, 8, 7, 0.95)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      angle += 0.003;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
