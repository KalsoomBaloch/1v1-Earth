import { useEffect, useRef } from 'react';

// Simple crewmate-like silhouette shape
function drawCrewmate(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = opacity;
  
  // Body
  ctx.beginPath();
  ctx.ellipse(0, size * 0.2, size * 0.4, size * 0.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 245, 255, 0.15)';
  ctx.fill();
  
  // Visor
  ctx.beginPath();
  ctx.ellipse(size * 0.15, -size * 0.05, size * 0.2, size * 0.25, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 200, 255, 0.25)';
  ctx.fill();
  
  // Backpack
  ctx.beginPath();
  ctx.ellipse(-size * 0.45, size * 0.15, size * 0.12, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 245, 255, 0.12)';
  ctx.fill();
  
  // Legs
  ctx.beginPath();
  ctx.ellipse(-size * 0.15, size * 0.65, size * 0.13, size * 0.15, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 245, 255, 0.12)';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.15, size * 0.65, size * 0.13, size * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

interface Star {
  x: number; y: number; r: number; speed: number; opacity: number; layer: number;
}

interface Crewmate {
  x: number; y: number; size: number; speed: number; opacity: number; wobble: number;
}

interface Nebula {
  x: number; y: number; rx: number; ry: number; hue: number; opacity: number; speed: number;
}

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const stars: Star[] = [];
    const crewmates: Crewmate[] = [];
    const nebulae: Nebula[] = [];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Stars with parallax layers
    for (let i = 0; i < 300; i++) {
      const layer = Math.random() < 0.3 ? 0 : Math.random() < 0.6 ? 1 : 2;
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: layer === 0 ? Math.random() * 0.8 + 0.3 : layer === 1 ? Math.random() * 1.2 + 0.5 : Math.random() * 2 + 0.8,
        speed: layer === 0 ? 0.05 : layer === 1 ? 0.15 : 0.3,
        opacity: Math.random() * 0.8 + 0.2,
        layer,
      });
    }

    // Crewmate silhouettes
    for (let i = 0; i < 4; i++) {
      crewmates.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 15 + Math.random() * 10,
        speed: 0.2 + Math.random() * 0.3,
        opacity: 0.08 + Math.random() * 0.1,
        wobble: Math.random() * Math.PI * 2,
      });
    }

    // Nebula clouds
    for (let i = 0; i < 3; i++) {
      nebulae.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        rx: 150 + Math.random() * 200,
        ry: 100 + Math.random() * 150,
        hue: 185 + Math.random() * 30,
        opacity: 0.02 + Math.random() * 0.03,
        speed: 0.1 + Math.random() * 0.1,
      });
    }

    let time = 0;
    function draw() {
      time += 0.008;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      // Nebula clouds
      for (const neb of nebulae) {
        neb.x += neb.speed * 0.3;
        neb.y += Math.sin(time + neb.x * 0.01) * 0.2;
        if (neb.x - neb.rx > canvas!.width) neb.x = -neb.rx;
        
        const grad = ctx!.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, neb.rx);
        const pulse = 0.7 + 0.3 * Math.sin(time * 0.5 + neb.hue);
        grad.addColorStop(0, `hsla(${neb.hue}, 100%, 50%, ${neb.opacity * pulse})`);
        grad.addColorStop(0.5, `hsla(${neb.hue + 10}, 80%, 40%, ${neb.opacity * 0.5 * pulse})`);
        grad.addColorStop(1, 'transparent');
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.ellipse(neb.x, neb.y, neb.rx, neb.ry, 0, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Stars with twinkle
      for (const star of stars) {
        star.y += star.speed;
        if (star.y > canvas!.height) {
          star.y = 0;
          star.x = Math.random() * canvas!.width;
        }
        const twinkle = 0.4 + 0.6 * Math.sin(time * 3 + star.x * 0.5 + star.y * 0.3);
        ctx!.beginPath();
        ctx!.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        
        // Cyan-tinted stars
        const hue = star.layer === 2 ? 185 : 210;
        const lightness = star.layer === 2 ? 80 : 90;
        ctx!.fillStyle = `hsla(${hue}, 60%, ${lightness}%, ${star.opacity * twinkle})`;
        ctx!.fill();
        
        // Glow on bigger stars
        if (star.r > 1.5) {
          const glow = ctx!.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r * 4);
          glow.addColorStop(0, `hsla(185, 100%, 70%, ${0.15 * twinkle})`);
          glow.addColorStop(1, 'transparent');
          ctx!.fillStyle = glow;
          ctx!.fillRect(star.x - star.r * 4, star.y - star.r * 4, star.r * 8, star.r * 8);
        }
      }

      // Crewmate silhouettes
      for (const cm of crewmates) {
        cm.x += cm.speed;
        cm.wobble += 0.02;
        const wobbleY = Math.sin(cm.wobble) * 8;
        if (cm.x > canvas!.width + 50) {
          cm.x = -50;
          cm.y = Math.random() * canvas!.height;
        }
        drawCrewmate(ctx!, cm.x, cm.y + wobbleY, cm.size, cm.opacity);
      }

      // Glowing Earth in bottom-right
      const ex = canvas!.width - 80;
      const ey = canvas!.height - 60;
      const er = 55;

      // Outer glow - cyan
      const glow = ctx!.createRadialGradient(ex, ey, er * 0.3, ex, ey, er * 3);
      glow.addColorStop(0, 'rgba(0, 245, 255, 0.12)');
      glow.addColorStop(0.4, 'rgba(0, 128, 255, 0.06)');
      glow.addColorStop(1, 'transparent');
      ctx!.fillStyle = glow;
      ctx!.fillRect(ex - er * 3, ey - er * 3, er * 6, er * 6);

      // Earth body with cyan tint
      const earthGrad = ctx!.createRadialGradient(ex - 10, ey - 10, er * 0.1, ex, ey, er);
      earthGrad.addColorStop(0, 'rgba(0, 245, 255, 0.3)');
      earthGrad.addColorStop(0.5, 'rgba(0, 128, 255, 0.25)');
      earthGrad.addColorStop(1, 'rgba(0, 40, 100, 0.1)');
      ctx!.beginPath();
      ctx!.arc(ex, ey, er, 0, Math.PI * 2);
      ctx!.fillStyle = earthGrad;
      ctx!.fill();

      // Atmosphere ring
      ctx!.beginPath();
      ctx!.arc(ex, ey, er + 3, 0, Math.PI * 2);
      ctx!.strokeStyle = `rgba(0, 245, 255, ${0.1 + 0.05 * Math.sin(time * 2)})`;
      ctx!.lineWidth = 2;
      ctx!.stroke();

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
      style={{ background: '#050810' }}
    />
  );
}
