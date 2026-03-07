/**
 * Carte Neuronale — visualisation des 7 intelligences en filaments de mycélium.
 * Nodes sur un cercle, connexions dont l'épaisseur/opacité dépend des scores.
 */
import { useMemo } from 'react';
import { INTELLIGENCE_POLES } from '../data/intelligenceMatrix';

const W = 400;
const H = 320;
const CX = W / 2;
const CY = H / 2;
const R = 120;

export default function CarteNeuronale({ scores }) {
  const normalized = useMemo(() => {
    if (!scores || scores.length !== 7) return [];
    return scores.map((s) => Math.max(0, Math.min(4, (s ?? 0) + 2)));
  }, [scores]);

  const nodes = useMemo(() => {
    return INTELLIGENCE_POLES.map((p, i) => {
      const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
      return {
        id: p.id,
        label: p.name.replace(/Intelligence /, ''),
        x: CX + R * Math.cos(angle),
        y: CY + R * Math.sin(angle),
        value: normalized[i] ?? 0,
      };
    });
  }, [normalized]);

  const links = useMemo(() => {
    const result = [];
    for (let i = 0; i < 7; i++) {
      const j = (i + 1) % 7;
      const vi = normalized[i] ?? 0;
      const vj = normalized[j] ?? 0;
      const strength = (vi + vj) / 8;
      result.push({ i, j, strength });
    }
    for (let i = 0; i < 7; i++) {
      const j = (i + 3) % 7;
      if (i < j) {
        const vi = normalized[i] ?? 0;
        const vj = normalized[j] ?? 0;
        const strength = (vi + vj) / 10;
        result.push({ i, j, strength });
      }
    }
    return result;
  }, [normalized]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md mx-auto" style={{ overflow: 'visible' }}>
      <defs>
        <filter id="glow-neuronal">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="filament-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <g stroke="url(#filament-grad)" strokeLinecap="round">
        {links.map(({ i, j, strength }, idx) => {
          const a = nodes[i];
          const b = nodes[j];
          if (!a || !b) return null;
          const width = 0.5 + strength * 3;
          const opacity = 0.2 + strength * 0.6;
          return (
            <line key={idx} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={width} opacity={opacity} />
          );
        })}
      </g>
      {nodes.map((node) => {
        const r = 14 + node.value * 4;
        const glow = node.value * 0.15 + 0.1;
        return (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={r + 4} fill="#D4AF37" opacity={glow} filter="url(#glow-neuronal)" />
            <circle cx={node.x} cy={node.y} r={r} fill="#0d1211" stroke="#D4AF37" strokeWidth={1 + node.value * 0.3} opacity={0.9} />
            <text x={node.x} y={node.y + 4} textAnchor="middle" fill="#F1F1E6" fontSize="9" className="font-mono">
              {node.label.split(' ')[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
