import { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Sparkles, BookOpen, Activity, Swords, Users, Shield, Leaf } from 'lucide-react';

/**
 * La Clairière d'Accueil — Page d'accueil avant connexion.
 * Hero, 3 piliers, Pouls de la Forêt, Sceaux Saisonniers, Footer.
 * Si l'utilisateur est connecté, ne pas afficher (géré par App).
 */
export default function LandingPage({ onSignup, onLogin }) {
  const [stats, setStats] = useState({ inities: 1247, seals: 89, spores: 3420 });
  const heroRef = useRef(null);
  const inViewHero = useInView(heroRef, { once: true });

  useEffect(() => {
    const t = setInterval(() => {
      setStats((s) => ({
        inities: s.inities + Math.floor(Math.random() * 3),
        seals: s.seals + (Math.random() > 0.7 ? 1 : 0),
        spores: s.spores + Math.floor(Math.random() * 5),
      }));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#070B0A] text-[#F1F1E6] overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 md:px-8 bg-[#070B0A]/80 backdrop-blur-xl border-b border-white/5">
        <span className="font-serif text-xl font-bold accent-color flex items-center gap-2">
          <Leaf className="w-6 h-6" />
          Mycélium
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLogin}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[#F1F1E6]/80 hover:text-[#F1F1E6] hover:bg-white/5 transition"
          >
            Retrouver sa Racine
          </button>
          <button
            type="button"
            onClick={onSignup}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[var(--accent)]/25 border border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)]/35 transition"
          >
            Commencer l&apos;Initiation
          </button>
        </div>
      </header>

      {/* Hero — L'Appel de la Forêt */}
      <section
        ref={heroRef}
        className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 pt-24 pb-16"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-emerald-400/30"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 0.6, 0], y: [-20, -200] }}
              transition={{ duration: 3 + Math.random() * 2, delay: i * 0.2, repeat: Infinity }}
              style={{ left: `${Math.random() * 100}%`, top: '100%' }}
            />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inViewHero ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative z-10 text-center max-w-3xl mx-auto"
        >
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-[#F1F1E6] mb-4 leading-tight">
            Découvrez la géométrie sacrée de votre esprit.
          </h1>
          <p className="text-lg md:text-xl text-[#F1F1E6]/80 mb-10 leading-relaxed">
            Mycélium est bien plus qu&apos;un test de personnalité. C&apos;est un écosystème alchimique de développement personnel, de collection et de connexion.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onSignup}
              className="px-8 py-4 rounded-2xl font-medium bg-emerald-500/30 border-2 border-emerald-500/60 text-emerald-200 hover:bg-emerald-500/40 transition shadow-[0_0_30px_rgba(52,211,153,0.2)]"
            >
              Commencer l&apos;Initiation
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onLogin}
              className="px-8 py-4 rounded-2xl font-medium bg-white/5 border-2 border-[var(--accent)]/50 text-[var(--accent)] hover:bg-white/10 transition"
            >
              Retrouver sa Racine
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Les 3 Piliers */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              icon: BookOpen,
              title: "Connaissance de Soi (L'Inné)",
              text: "Explorez vos 49 Racines, votre Totem et vos 7 Intelligences à travers des protocoles psychométriques profonds.",
            },
            {
              icon: Activity,
              title: "Croissance Quotidienne (L'Acquis)",
              text: "Un journal alchimique et des quêtes quotidiennes pour transformer vos découvertes en actions concrètes dans le monde réel.",
            },
            {
              icon: Swords,
              title: 'Le Jeu des Résonances (Le TCG)',
              text: "Collectionnez les facettes de votre essence. Affrontez les ombres ou fusionnez avec d'autres initiés dans notre jeu de cartes tactique.",
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 hover:border-[var(--accent)]/30 transition"
                style={{ boxShadow: '0 0 40px rgba(212,175,55,0.06)' }}
              >
                <Icon className="w-10 h-10 text-[var(--accent)] mb-4" />
                <h3 className="font-serif text-xl font-bold text-[#F1F1E6] mb-2">{item.title}</h3>
                <p className="text-[#F1F1E6]/75 text-sm leading-relaxed">{item.text}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Le Pouls de la Forêt */}
      <section className="py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl p-8 text-center"
          style={{ boxShadow: '0 0 60px rgba(52,211,153,0.15)' }}
        >
          <h2 className="font-serif text-2xl font-bold text-emerald-200 mb-6 flex items-center justify-center gap-2">
            <Sparkles className="w-7 h-7" />
            Le Pouls de la Forêt
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-emerald-300 font-mono">{stats.inities}</p>
              <p className="text-[#F1F1E6]/70 text-sm mt-1">Initiés ont rejoint le maillage</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-emerald-300 font-mono">{stats.seals}</p>
              <p className="text-[#F1F1E6]/70 text-sm mt-1">Sceaux de Maîtrise forgés ce mois</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-emerald-300 font-mono">{stats.spores}</p>
              <p className="text-[#F1F1E6]/70 text-sm mt-1">Spores de savoir échangées</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Teaser — Cycles et Saisons */}
      <section className="py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl p-8 text-center"
        >
          <h2 className="font-serif text-xl font-bold text-amber-200/90 mb-4">Les Cycles et Saisons</h2>
          <p className="text-[#F1F1E6]/80 text-sm leading-relaxed mb-4">
            La forêt change. À chaque nouvelle saison, des Sceaux Éphémères apparaissent. Saurez-vous les forger avant qu&apos;ils ne retournent à la terre ?
          </p>
          <span className="inline-block text-4xl opacity-60" title="Sceau éphémère">◇</span>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-serif text-lg accent-color">Mycélium</span>
          <div className="flex items-center gap-6 text-sm text-[#F1F1E6]/60">
            <a href="#privacy" className="hover:text-[var(--accent)] transition flex items-center gap-1">
              <Shield className="w-4 h-4" /> Vie privée
            </a>
            <a href="#data" className="hover:text-[var(--accent)] transition">Protection des données</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
