import { motion } from 'framer-motion';
import { Droplets, BookOpen } from 'lucide-react';
import { MYCELIUM_49 } from '../data/mycelium49';

/**
 * Explications sur l'avatar et le profil — affiché sur le tableau de bord quand un résultat existe.
 */
export default function AvatarExplicationsCard({ result }) {
  if (!result?.hybrid) return null;

  const { hybrid } = result;
  const key1Name = MYCELIUM_49.keys.find((k) => k.id === hybrid.key1)?.name || hybrid.key1;
  const key2Name = MYCELIUM_49.keys.find((k) => k.id === hybrid.key2)?.name || hybrid.key2;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-[#D4AF37]/30 bg-white/5 backdrop-blur-xl p-6"
      style={{ boxShadow: '0 0 30px rgba(212,175,55,0.08)' }}
    >
      <h2 className="font-serif text-lg font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
        <Droplets className="w-5 h-5" />
        Votre Avatar & Identité
      </h2>
      <div className="flex flex-wrap items-start gap-6">
        <div
          className="w-28 h-28 rounded-2xl border border-[#D4AF37]/40 flex items-center justify-center bg-[#0d1211] flex-shrink-0"
          style={{ boxShadow: '0 0 24px rgba(212,175,55,0.2)' }}
        >
          <Droplets className="w-14 h-14 text-[#D4AF37]/80" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#F1F1E6] font-medium mb-1">
            Votre profil hybride — <span className="text-[#D4AF37]">{hybrid.name}</span>
          </p>
          <p className="text-[#F1F1E6]/80 text-sm mb-3">
            Il est issu de la rencontre de <strong className="text-[#D4AF37]/90">{key1Name}</strong> et de <strong className="text-[#D4AF37]/90">{key2Name}</strong>. 
            Ce double pôle forme votre « identité mycélienne » : la façon dont vous ancrez, créez et vous reliez au monde.
          </p>
          <p className="text-[#F1F1E6]/70 text-sm">
            L’avatar totem (animal) sera révélé après le rituel du questionnaire Totem. Il incarnera visuellement cette identité et brillera de la couleur de votre élément dominant.
          </p>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-[#D4AF37]/20">
        <p className="text-[#D4AF37]/90 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" />
          Les 7 clés
        </p>
        <p className="text-[#F1F1E6]/75 text-sm">
          Chaque clé (Spore, Ancrage, Expansion, Lyse, Fructification, Absorption, Dormance) représente un pôle de votre dynamique intérieure. 
          Votre radar reflète l’équilibre entre ces pôles ; votre profil hybride en synthétise les deux plus actifs.
        </p>
      </div>
    </motion.section>
  );
}
