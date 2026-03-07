import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const SPORE_COUNT = 40;
const getRandom = (min, max) => min + Math.random() * (max - min);

export default function ParticleBackground({ intensity = 0.5 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let spores = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (spores.length === 0) {
        spores = Array.from({ length: SPORE_COUNT }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: getRandom(1, 3),
          vx: getRandom(-0.2, 0.2),
          vy: getRandom(-0.3, 0.1),
          opacity: getRandom(0.2, 0.6),
        }));
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const speed = 0.5 + intensity * 1.5;
      spores.forEach((s) => {
        s.x += s.vx * speed;
        s.y += s.vy * speed;
        if (s.x < 0 || s.x > canvas.width) s.vx *= -1;
        if (s.y < 0 || s.y > canvas.height) s.vy *= -1;
        s.x = (s.x + canvas.width) % canvas.width;
        s.y = (s.y + canvas.height) % canvas.height;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${s.opacity * 0.6})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [intensity]);

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      style={{ background: 'transparent' }}
    />
  );
}
