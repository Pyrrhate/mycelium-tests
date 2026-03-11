import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Chart from 'chart.js/auto';
import { MYCELIUM_49 } from '../../data/mycelium49';

export default function ConstellationRadar({ poleAverages, accentColor = '#D4AF37' }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!poleAverages || poleAverages.length !== 7 || !canvasRef.current) return;

    const labels = MYCELIUM_49.keys.map((k) => k.name);
    const values = poleAverages.map((v) => Number(v) + 2);

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: 'Sève',
            data: values,
            borderColor: accentColor,
            backgroundColor: `${accentColor}20`,
            borderWidth: 2,
            pointBackgroundColor: accentColor,
            pointBorderColor: '#070B0A',
            pointHoverBackgroundColor: accentColor,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0,
            max: 4,
            pointLabels: { color: '#F1F1E6', font: { size: 10 } },
            grid: { color: 'rgba(241,241,230,0.12)' },
            angleLines: { color: 'rgba(241,241,230,0.08)' },
          },
        },
        plugins: { legend: { display: false } },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [poleAverages, accentColor]);

  if (!poleAverages || poleAverages.length !== 7) {
    return (
      <p className="text-[#F1F1E6]/50 text-sm italic py-8 text-center">
        Constellation non partagée.
      </p>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
      style={{
        boxShadow: '0 0 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <h2 className="text-xs uppercase tracking-widest text-[#D4AF37]/80 font-mono mb-4">
        Constellation
      </h2>
      <div className="w-full max-w-xs mx-auto h-56 relative">
        <canvas ref={canvasRef} />
      </div>
    </motion.section>
  );
}
