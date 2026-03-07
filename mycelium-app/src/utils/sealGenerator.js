/**
 * Génère un Sceau du Mois (SVG) à partir des 2 clés dominantes de la Résonance.
 */
const KEY_SHAPES = {
  spore: { points: 6, rotate: 0 },
  ancrage: { points: 4, rotate: 45 },
  expansion: { points: 8, rotate: 22.5 },
  lyse: { points: 5, rotate: 0 },
  fructification: { points: 7, rotate: 0 },
  absorption: { points: 6, rotate: 30 },
  dormance: { points: 12, rotate: 0 },
};

/** Retourne un identifiant de sceau (pour stockage) et le SVG en string */
export function generateSeal(dominantKey1, dominantKey2, size = 120) {
  const k1 = dominantKey1 || 'spore';
  const k2 = dominantKey2 || 'ancrage';
  const s1 = KEY_SHAPES[k1] || KEY_SHAPES.spore;
  const s2 = KEY_SHAPES[k2] || KEY_SHAPES.ancrage;
  const sealId = [k1, k2].sort().join('_');
  const cx = size / 2;
  const cy = size / 2;
  const r1 = size * 0.4;
  const r2 = size * 0.25;
  const n = Math.max(s1.points, s2.points);
  const rot = (s1.rotate + s2.rotate) / 2;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const starPoints = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const angle = toRad((i * 180) / n + rot);
    starPoints.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  const poly = starPoints.join(' ');

  const innerN = Math.min(s1.points, s2.points) || 3;
  const innerPoints = [];
  for (let i = 0; i < innerN; i++) {
    const angle = toRad((i * 360) / innerN + rot);
    innerPoints.push(`${cx + r2 * Math.cos(angle)},${cy + r2 * Math.sin(angle)}`);
  }
  const innerPoly = innerPoints.join(' ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="seal-grad-${sealId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#D4AF37;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B7355;stop-opacity:0.9" />
    </linearGradient>
  </defs>
  <polygon points="${poly}" fill="none" stroke="url(#seal-grad-${sealId})" stroke-width="2" transform="translate(${cx},${cy}) rotate(${rot}) translate(${-cx},${-cy})"/>
  <polygon points="${innerPoly}" fill="rgba(212,175,55,0.15)" stroke="#D4AF37" stroke-width="1" transform="translate(${cx},${cy}) rotate(${-rot}) translate(${-cx},${-cy})"/>
  <circle cx="${cx}" cy="${cy}" r="4" fill="#D4AF37"/>
</svg>`;

  return { sealId, svg };
}
