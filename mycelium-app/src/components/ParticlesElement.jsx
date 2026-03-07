/**
 * Effets de particules selon l'élément en cours (Élément Primordial).
 * Bulles (Eau), étincelles (Feu), feuilles (Bois), etc.
 */
const COUNT = 12;

function Particle({ style, className, delay }) {
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        left: `${5 + Math.random() * 90}%`,
        bottom: '-10%',
        animationDelay: `${delay}s`,
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}

export default function ParticlesElement({ elementKey, color = '#D4AF37' }) {
  const hex = (color || '#D4AF37').replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const rgb = `${r}, ${g}, ${b}`;

  if (elementKey === 'EAU_EXPANSION') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {Array.from({ length: COUNT }).map((_, i) => (
          <Particle
            key={i}
            delay={i * 0.8}
            className="rounded-full animate-[particle-bubble_4s_ease-in_out_infinite]"
            style={{
              width: 8 + i * 1.2,
              height: 8 + i * 1.2,
              background: `radial-gradient(circle at 30% 30%, rgba(${rgb}, 0.5), rgba(${rgb}, 0.1))`,
              border: `1px solid rgba(${rgb}, 0.3)`,
            }}
          />
        ))}
      </div>
    );
  }

  if (elementKey === 'FEU_LYSE') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {Array.from({ length: COUNT }).map((_, i) => (
          <Particle
            key={i}
            delay={i * 0.25}
            className="animate-[particle-spark_1.5s_ease-out_infinite]"
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(${rgb}, 0.9), transparent)`,
              boxShadow: `0 0 6px rgba(${rgb}, 0.8)`,
            }}
          />
        ))}
      </div>
    );
  }

  if (elementKey === 'BOIS_FRUCTIFICATION') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {Array.from({ length: COUNT }).map((_, i) => (
          <Particle
            key={i}
            delay={i * 0.6}
            className="animate-[particle-drift_5s_ease-in-out_infinite]"
            style={{
              width: 6,
              height: 10,
              background: `linear-gradient(135deg, rgba(${rgb}, 0.6), rgba(${rgb}, 0.2))`,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              transform: `rotate(${i * 30}deg)`,
            }}
          />
        ))}
      </div>
    );
  }

  if (elementKey === 'AIR_SPORE') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {Array.from({ length: COUNT }).map((_, i) => (
          <Particle
            key={i}
            delay={i * 0.5}
            className="animate-[particle-float-up_6s_ease-in-out_infinite]"
            style={{
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: `rgba(${rgb}, 0.5)`,
            }}
          />
        ))}
      </div>
    );
  }

  if (elementKey === 'TERRE_ANCRAGE') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {Array.from({ length: COUNT }).map((_, i) => (
          <Particle
            key={i}
            delay={i * 0.7}
            className="animate-[particle-float-up_8s_linear_infinite]"
            style={{
              width: 4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              borderRadius: '30%',
              background: `rgba(${rgb}, 0.35)`,
            }}
          />
        ))}
      </div>
    );
  }

  if (elementKey === 'METAL_ABSORPTION') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {Array.from({ length: COUNT }).map((_, i) => (
          <Particle
            key={i}
            delay={i * 0.4}
            className="animate-[particle-shimmer_3s_ease-in-out_infinite]"
            style={{
              width: 2,
              height: 2,
              borderRadius: '50%',
              background: `rgba(${rgb}, 0.7)`,
              boxShadow: `0 0 8px rgba(${rgb}, 0.5)`,
            }}
          />
        ))}
      </div>
    );
  }

  if (elementKey === 'ETHER_DORMANCE') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {Array.from({ length: COUNT }).map((_, i) => (
          <Particle
            key={i}
            delay={i * 1.2}
            className="animate-[particle-mist_6s_ease-in-out_infinite]"
            style={{
              width: 40 + (i % 5) * 12,
              height: 40 + (i % 5) * 12,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(${rgb}, 0.15), transparent)`,
            }}
          />
        ))}
      </div>
    );
  }

  return null;
}
