import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { Sparkles, Feather, Brain, Target, Shield, Lock, Leaf, ChevronDown } from 'lucide-react';

function SporeParticle({ index }) {
  const randomX = Math.random() * 100;
  const randomDelay = Math.random() * 5;
  const randomDuration = 4 + Math.random() * 4;
  const randomSize = 2 + Math.random() * 4;

  return (
    <motion.div
      className="absolute rounded-full bg-[#D4AF37]/40"
      style={{
        left: `${randomX}%`,
        bottom: '-10px',
        width: randomSize,
        height: randomSize,
        filter: 'blur(1px)',
      }}
      animate={{
        y: [0, -window.innerHeight - 100],
        opacity: [0, 0.8, 0.6, 0],
        x: [0, Math.sin(index) * 30, Math.cos(index) * 20, 0],
      }}
      transition={{
        duration: randomDuration,
        delay: randomDelay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  );
}

function GlowingOrb({ mouseX, mouseY }) {
  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  return (
    <motion.div
      className="pointer-events-none fixed w-[600px] h-[600px] rounded-full opacity-30"
      style={{
        x,
        y,
        background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 40%, transparent 70%)',
        transform: 'translate(-50%, -50%)',
        filter: 'blur(40px)',
      }}
    />
  );
}

function PillarCard({ icon: Icon, title, description, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="relative group"
    >
      <div
        className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 h-full transition-all duration-300 group-hover:border-[#D4AF37]/30 group-hover:bg-white/[0.07]"
        style={{ boxShadow: '0 0 60px rgba(212,175,55,0.05), inset 0 1px 0 rgba(255,255,255,0.05)' }}
      >
        <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mb-6 group-hover:bg-[#D4AF37]/15 transition-colors">
          <Icon className="w-7 h-7 text-[#D4AF37]" />
        </div>
        <h3 className="font-serif text-xl font-bold text-[#F1F1E6] mb-3">{title}</h3>
        <p className="text-[#F1F1E6]/70 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

export default function LandingPage({ onSignup, onLogin }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const securityRef = useRef(null);
  const securityInView = useInView(securityRef, { once: true, margin: '-100px' });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' });
  };

  const pillars = [
    {
      icon: Feather,
      title: "L'Écho du Jour",
      description: "Déposez vos pensées sans filtre. Le Mycélium accueille vos ombres et vos lumières dans un sanctuaire numérique apaisant.",
    },
    {
      icon: Brain,
      title: "L'Intelligence Organique",
      description: "Notre IA partenaire analyse la sève de vos mots. Elle identifie votre élément dominant (Feu, Eau, Terre...) et vous offre des citations et des réflexions sur-mesure.",
    },
    {
      icon: Target,
      title: "La Croissance Réelle",
      description: "Ne restez pas immobile. L'application transforme vos émotions en quêtes quotidiennes concrètes pour vous aider à retrouver l'équilibre dans le monde physique.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070B0A] text-[#F1F1E6] overflow-x-hidden">
      {/* Orbe lumineux qui suit la souris */}
      <GlowingOrb mouseX={mouseX} mouseY={mouseY} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Leaf className="w-6 h-6 text-[#D4AF37]" />
            <span className="font-serif text-xl font-bold text-[#D4AF37]">Mycélium</span>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onLogin}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#F1F1E6]/70 hover:text-[#F1F1E6] hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
          >
            Connexion
          </motion.button>
        </div>
      </header>

      {/* HERO — L'Appel de la Forêt */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden"
      >
        {/* Particules de spores */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(25)].map((_, i) => (
            <SporeParticle key={i} index={i} />
          ))}
        </div>

        {/* Gradient de fond */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#070B0A] to-transparent pointer-events-none" />

        {/* Contenu Hero */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={heroInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-sm mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Journal Intime Alchimique
          </motion.div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#F1F1E6] mb-6 leading-[1.1]">
            Le miroir bienveillant
            <br />
            <span className="text-[#D4AF37]">de votre esprit.</span>
          </h1>

          <p className="text-lg md:text-xl text-[#F1F1E6]/70 mb-12 leading-relaxed max-w-2xl mx-auto">
            Mycélium n'est pas un simple journal. C'est un écosystème organique propulsé par l'IA qui écoute vos pensées, relie vos émotions et vous guide à travers les <strong className="text-[#F1F1E6]/90">7 Clés de la sagesse alchimique</strong>.
          </p>

          {/* CTA Principal avec pulsation */}
          <motion.button
            onClick={onSignup}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="relative px-10 py-5 rounded-2xl font-medium text-lg transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.15) 100%)',
              border: '2px solid rgba(212,175,55,0.5)',
              color: '#D4AF37',
              boxShadow: '0 0 40px rgba(212,175,55,0.3)',
            }}
          >
            {/* Animation de pulsation */}
            <motion.span
              className="absolute inset-0 rounded-2xl"
              style={{ border: '2px solid rgba(212,175,55,0.4)' }}
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="relative flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Entrer dans la Clairière
            </span>
          </motion.button>
        </motion.div>

        {/* Indicateur de scroll */}
        <motion.button
          onClick={scrollToContent}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#F1F1E6]/40 hover:text-[#D4AF37] transition-colors"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown className="w-8 h-8" />
          </motion.div>
        </motion.button>
      </section>

      {/* LES 3 PILIERS — Comment ça marche ? */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#F1F1E6] mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-[#F1F1E6]/60 max-w-xl mx-auto">
              Trois piliers pour accompagner votre voyage intérieur
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {pillars.map((pillar, index) => (
              <PillarCard
                key={pillar.title}
                icon={pillar.icon}
                title={pillar.title}
                description={pillar.description}
                delay={index * 0.15}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION CONFIANCE ET SÉCURITÉ */}
      <section ref={securityRef} className="py-24 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={securityInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto"
        >
          <div
            className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 md:p-12"
            style={{ boxShadow: '0 0 80px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#F1F1E6]">
                Un sanctuaire pour vos pensées.
              </h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-400/70 flex-shrink-0 mt-1" />
                <p className="text-[#F1F1E6]/90 leading-relaxed">
                  <strong>Vos données sont privées entre vous et l'IA, mais stockées sur nos serveurs de manière standard.</strong>
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <p className="text-[#F1F1E6]/70 text-sm leading-relaxed">
                  Nous utilisons la technologie de <strong className="text-[#F1F1E6]/90">Supabase</strong> avec un cryptage de base (RLS) pour isoler vos écrits. L'IA lit vos mots de manière éphémère pour vous guider, mais <strong className="text-[#F1F1E6]/90">ne s'entraîne jamais sur votre vie intime</strong>.
                </p>
              </div>

              <p className="text-[#F1F1E6]/50 text-xs text-center">
                Votre journal vous appartient. Toujours.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#F1F1E6] mb-6">
            Prêt à écouter ce que votre esprit a à dire ?
          </h2>
          <motion.button
            onClick={onSignup}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 rounded-2xl font-medium bg-[#D4AF37]/20 border-2 border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/30 transition"
            style={{ boxShadow: '0 0 30px rgba(212,175,55,0.2)' }}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Commencer gratuitement
            </span>
          </motion.button>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-[#D4AF37]/70" />
            <span className="font-serif text-lg text-[#D4AF37]/70">Mycélium</span>
          </div>
          
          <div className="flex items-center gap-8 text-sm text-[#F1F1E6]/50">
            <a href="#mentions" className="hover:text-[#D4AF37] transition">
              Mentions légales
            </a>
            <a href="#philosophie" className="hover:text-[#D4AF37] transition">
              Philosophie
            </a>
          </div>

          <p className="text-xs text-[#F1F1E6]/30">
            © 2026 Mycélium. Le réseau qui écoute.
          </p>
        </div>
      </footer>
    </div>
  );
}
