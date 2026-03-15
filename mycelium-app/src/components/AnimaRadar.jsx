import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Chart from 'chart.js/auto';

const ANIMA_ELEMENTS = [
  { key: 'air', name: 'Air', fullName: 'Le Souffle', color: '#A78BFA', icon: '💨' },
  { key: 'terre', name: 'Terre', fullName: 'Le Socle', color: '#D97706', icon: '🌍' },
  { key: 'eau', name: 'Eau', fullName: "L'Onde", color: '#3B82F6', icon: '💧' },
  { key: 'feu', name: 'Feu', fullName: 'La Forge', color: '#EF4444', icon: '🔥' },
  { key: 'bois', name: 'Bois', fullName: "L'Éclosion", color: '#22C55E', icon: '🌳' },
  { key: 'metal', name: 'Métal', fullName: 'Le Prisme', color: '#94A3B8', icon: '⚔️' },
  { key: 'ether', name: 'Éther', fullName: 'Le Vide', color: '#D4AF37', icon: '✨' },
];

export default function AnimaRadar({ scores, accentColor = '#D4AF37', showLegend = false }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const hasValidScores = scores && typeof scores === 'object' && Object.keys(scores).length > 0;

  useEffect(() => {
    if (!hasValidScores || !canvasRef.current) return;

    const labels = ANIMA_ELEMENTS.map((e) => e.name);
    const values = ANIMA_ELEMENTS.map((e) => {
      const score = scores[e.key] ?? 0;
      return score + 2;
    });

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: 'Éléments',
            data: values,
            borderColor: accentColor,
            backgroundColor: `${accentColor}20`,
            borderWidth: 2,
            pointBackgroundColor: ANIMA_ELEMENTS.map((e) => e.color),
            pointBorderColor: '#070B0A',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: ANIMA_ELEMENTS.map((e) => e.color),
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
            ticks: { display: false, stepSize: 1 },
            pointLabels: { 
              color: '#F1F1E6', 
              font: { size: 11, weight: '500' },
              callback: (value, index) => `${ANIMA_ELEMENTS[index].icon} ${value}`,
            },
            grid: { 
              color: 'rgba(241,241,230,0.1)',
              circular: true,
            },
            angleLines: { 
              color: 'rgba(241,241,230,0.08)',
            },
          },
        },
        plugins: { 
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => {
                const idx = items[0].dataIndex;
                return ANIMA_ELEMENTS[idx].fullName;
              },
              label: (item) => {
                const actualScore = item.raw - 2;
                return `Score: ${actualScore.toFixed(1)}`;
              },
            },
            backgroundColor: 'rgba(7,11,10,0.9)',
            borderColor: accentColor,
            borderWidth: 1,
          },
        },
        interaction: {
          intersect: false,
          mode: 'point',
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [scores, accentColor, hasValidScores]);

  if (!hasValidScores) {
    return (
      <p className="text-[#F1F1E6]/50 text-sm italic py-8 text-center">
        Profil Anima non encore révélé.
      </p>
    );
  }

  const sortedElements = ANIMA_ELEMENTS
    .map((e) => ({ ...e, score: scores[e.key] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  const dominantElement = sortedElements[0];

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs uppercase tracking-widest text-[#D4AF37]/80 font-mono">
          Profil Anima
        </h2>
        <div 
          className="flex items-center gap-2 px-3 py-1 rounded-full text-sm"
          style={{ 
            background: `${dominantElement.color}20`,
            border: `1px solid ${dominantElement.color}40`,
          }}
        >
          <span>{dominantElement.icon}</span>
          <span style={{ color: dominantElement.color }}>{dominantElement.fullName}</span>
        </div>
      </div>

      <div className="w-full max-w-xs mx-auto h-56 relative">
        <canvas ref={canvasRef} />
      </div>

      {showLegend && (
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/10">
          {sortedElements.slice(0, 4).map((element) => (
            <div 
              key={element.key}
              className="flex items-center gap-2 text-xs"
            >
              <span 
                className="w-3 h-3 rounded-full"
                style={{ background: element.color }}
              />
              <span className="text-[#F1F1E6]/70">{element.name}</span>
              <span 
                className="ml-auto font-mono"
                style={{ color: element.color }}
              >
                {element.score.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

export { ANIMA_ELEMENTS };
