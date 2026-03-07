import { useRef, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { POLES } from '../data';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const GOLD = 'rgba(212, 175, 55, 0.9)';
const GOLD_GLOW = 'rgba(212, 175, 55, 0.4)';
const RED = 'rgba(230, 57, 70, 0.9)';
const RED_GLOW = 'rgba(230, 57, 70, 0.4)';
const BLUE = 'rgba(69, 123, 157, 0.9)';
const BLUE_GLOW = 'rgba(69, 123, 157, 0.4)';

function colorForScore(score) {
  if (score >= -0.5 && score <= 0.5) return { border: GOLD, bg: GOLD_GLOW };
  if (score > 0) return { border: RED, bg: RED_GLOW };
  return { border: BLUE, bg: BLUE_GLOW };
}

export default function RadarChart({ scores, onPointClick }) {
  const chartRef = useRef(null);

  const chartData = useMemo(() => {
    const values = scores.map((s) => s + 2);
    const borderColors = scores.map((s) => colorForScore(s).border);
    const bgColors = scores.map((s) => colorForScore(s).bg);

    return {
      labels: POLES.map((p) => p.creature),
      datasets: [
        {
          label: 'Équilibre',
          data: values,
          borderColor: borderColors,
          backgroundColor: 'rgba(212, 175, 55, 0.08)',
          borderWidth: 2,
          pointBackgroundColor: borderColors,
          pointBorderColor: '#F1F1E6',
          pointBorderWidth: 1,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [scores]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.1,
      animation: {
        duration: 1200,
      },
      scales: {
        r: {
          min: 0,
          max: 4,
          ticks: {
            stepSize: 1,
            display: false,
          },
          pointLabels: {
            font: { family: 'var(--font-serif)', size: 11 },
            color: '#F1F1E6',
          },
          grid: {
            color: 'rgba(241, 241, 230, 0.12)',
          },
          angleLines: {
            color: 'rgba(241, 241, 230, 0.08)',
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const raw = scores[ctx.dataIndex];
              const pole = POLES[ctx.dataIndex];
              return [`${pole.creature} : ${raw === 0 ? 'Équilibre' : raw > 0 ? `Excès (+${raw})` : `Vide (${raw})`}`];
            },
          },
          backgroundColor: 'rgba(18, 26, 23, 0.95)',
          titleFont: { family: 'var(--font-serif)' },
          bodyFont: { family: 'var(--font-sans)' },
        },
      },
      onClick: (evt, elements) => {
        if (elements.length && onPointClick) onPointClick(elements[0].index);
      },
    }),
    [scores, onPointClick]
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <Radar ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
