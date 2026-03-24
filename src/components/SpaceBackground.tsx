import { useEffect, useRef } from 'react';

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const stars: { x: number; y: number; r: number; speed: number; opacity: number }[] = [];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create stars
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.3 + 0.05,
        opacity: Math.random() * 0.8 + 0.2,
      });
    }

    let time = 0;
    function draw() {
      time += 0.01;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      // Stars
      for (const star of stars) {
        star.y += star.speed;
        if (star.y > canvas!.height) {
          star.y = 0;
          star.x = Math.random() * canvas!.width;
        }
        const twinkle = 0.5 + 0.5 * Math.sin(time * 2 + star.x);
        ctx!.beginPath();
        ctx!.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(180, 200, 255, ${star.opacity * twinkle})`;
        ctx!.fill();
      }

      // Glowing Earth in bottom-right
      const ex = canvas!.width - 80;
      const ey = canvas!.height - 60;
      const er = 50;

      // Outer glow
      const glow = ctx!.createRadialGradient(ex, ey, er * 0.5, ex, ey, er * 2.5);
      glow.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
      glow.addColorStop(0.5, 'rgba(34, 197, 94, 0.06)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx!.fillStyle = glow;
      ctx!.fillRect(ex - er * 3, ey - er * 3, er * 6, er * 6);

      // Earth body
      const earthGrad = ctx!.createRadialGradient(ex - 10, ey - 10, er * 0.1, ex, ey, er);
      earthGrad.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
      earthGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.35)');
      earthGrad.addColorStop(1, 'rgba(30, 64, 175, 0.15)');
      ctx!.beginPath();
      ctx!.arc(ex, ey, er, 0, Math.PI * 2);
      ctx!.fillStyle = earthGrad;
      ctx!.fill();

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
}
