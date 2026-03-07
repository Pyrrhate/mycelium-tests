import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, SkipForward, RotateCcw } from 'lucide-react';
import { generateCardStats } from '../data/cardEngine';
import { computeDamage, SEVE_REGEN_PER_TURN, MAX_SEVE, INITIAL_SEVE, cardMaxHp } from '../data/battleEngine';
import { PARASITE_DE_CENDRES, ORACLE_ADVICE_LOSS, REWARD_CARD_NAME, REWARD_TITLE } from '../data/parasiteBoss';
import { saveMatchResult } from '../services/myceliumSave';

const NARRATIVE_INTRO = 'Une ombre grise s\'étend sur vos racines... Le Parasite de Cendre tente de décomposer votre essence avant l\'heure.';

/**
 * Substrat de Duel — combat au tour par tour contre le Parasite de Cendre.
 * Barres Sève Vitale, phase Pioche/Action/Attaque/Fin de tour simplifiée (1 carte maîtresse vs 1 boss).
 */
export default function BattleSubstrate({ onBack, userId, profile, onVictory }) {
  const cardProfile = profile ? {
    poleAverages: profile.constellation_data?.poleAverages ?? Array(7).fill(0),
    totem: profile.totem ?? null,
    elementPrimordial: profile.element_primordial ?? null,
    xpSeve: profile.xp_seve ?? 0,
    initiateName: profile.initiate_name ?? 'Initié',
  } : null;

  const masterStats = cardProfile ? generateCardStats(cardProfile) : null;
  const parasite = PARASITE_DE_CENDRES;

  const [phase, setPhase] = useState('intro');
  const [playerHp, setPlayerHp] = useState(() =>
    masterStats ? cardMaxHp(masterStats.defense) : 80
  );
  const [parasiteHp, setParasiteHp] = useState(parasite.maxHp);
  const [playerSeve, setPlayerSeve] = useState(INITIAL_SEVE);
  const [turnCount, setTurnCount] = useState(0);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const hasSavedVictory = useRef(false);

  const playerMaxHp = masterStats ? cardMaxHp(masterStats.defense) : 80;
  const playerElement = masterStats?.element ?? 'Sève';
  const playerAttack = masterStats?.attack ?? 25;
  const playerDefense = masterStats?.defense ?? 20;

  const handleStart = useCallback(() => {
    setPhase('player_turn');
    setMessage('Votre tour. Attaquez ou passez.');
  }, []);

  const handleAttack = useCallback(() => {
    if (phase !== 'player_turn' || !masterStats) return;
    const dmg = computeDamage(playerAttack, parasite.defense, playerElement, parasite.element);
    setParasiteHp((h) => Math.max(0, h - dmg));
    setMessage(`Vous infligez ${dmg} dégâts au Parasite.`);
    setPhase('after_attack');
  }, [phase, masterStats, playerAttack, playerElement]);

  const handleEndTurn = useCallback(() => {
    if (phase === 'after_attack' || phase === 'player_turn') {
      setTurnCount((t) => t + 1);
      setPlayerSeve((s) => Math.min(MAX_SEVE, s + SEVE_REGEN_PER_TURN));
      setPhase('enemy_turn');
      setMessage('Le Parasite attaque...');
      setTimeout(() => {
        const dmg = computeDamage(parasite.attack, playerDefense, parasite.element, playerElement);
        setPlayerHp((h) => Math.max(0, h - dmg));
        setMessage(`Le Parasite vous inflige ${dmg} dégâts.`);
        setTimeout(() => {
          setPhase('player_turn');
          setMessage('Votre tour.');
        }, 1200);
      }, 800);
    }
  }, [phase, parasite.attack, playerDefense, playerElement]);

  useEffect(() => {
    if (phase === 'intro' || phase === 'victory' || phase === 'defeat') return;
    if (parasiteHp <= 0) {
      setPhase('victory');
      setMessage('');
    }
  }, [parasiteHp, phase]);

  useEffect(() => {
    if (phase === 'intro' || phase === 'victory' || phase === 'defeat') return;
    if (playerHp <= 0) {
      setPhase('defeat');
      setMessage('');
    }
  }, [playerHp, phase]);

  useEffect(() => {
    if (phase !== 'victory' || saving || hasSavedVictory.current || !userId) return;
    hasSavedVictory.current = true;
    (async () => {
      setSaving(true);
      await saveMatchResult(userId, {
        opponent_type: 'parasite',
        opponent_id: parasite.id,
        result: 'win',
        player_hp_final: playerHp,
        opponent_hp_final: 0,
        turns_played: turnCount,
      });
      setSaving(false);
      if (onVictory) onVictory();
    })();
  }, [phase, userId]);

  return (
    <div className="fixed inset-0 bg-[#070B0A] flex flex-col overflow-hidden">
      {/* Barres de Sève Vitale */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-4">
          <div className="w-48">
            <p className="text-xs text-[#F1F1E6]/70 mb-1">Votre Sève</p>
            <div className="h-3 rounded-full bg-[#0d1211] border border-[var(--accent)]/30 overflow-hidden">
              <motion.div
                className="h-full bg-[var(--accent)]/90 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <p className="text-[10px] text-[#F1F1E6]/60 mt-0.5">{playerHp} / {playerMaxHp}</p>
          </div>
          <div className="text-sm text-[var(--accent)] font-mono">
            {playerSeve} Sève
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-[#F1F1E6]/50">Tour {turnCount}</p>
          {message && <p className="text-sm text-[#F1F1E6]/90 mt-1">{message}</p>}
        </div>
        <div className="w-48 text-right">
          <p className="text-xs text-[#F1F1E6]/70 mb-1">Parasite</p>
          <div className="h-3 rounded-full bg-[#0d1211] border border-red-900/50 overflow-hidden">
            <motion.div
              className="h-full bg-red-600/90 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(parasiteHp / parasite.maxHp) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="text-[10px] text-[#F1F1E6]/60 mt-0.5">{parasiteHp} / {parasite.maxHp}</p>
        </div>
      </div>

      {/* Tapis — zone centrale */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-8"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(34,139,34,0.08) 0%, transparent 70%), #070B0A',
        }}
      >
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-lg text-center space-y-6"
            >
              <p className="text-[#F1F1E6]/80 font-serif text-lg leading-relaxed">{NARRATIVE_INTRO}</p>
              <button
                type="button"
                onClick={handleStart}
                className="px-8 py-4 rounded-xl font-medium bg-[var(--accent)]/20 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/30 transition"
              >
                Commencer le duel
              </button>
            </motion.div>
          )}

          {(phase === 'player_turn' || phase === 'after_attack') && (
            <motion.div
              key="battle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="flex items-center gap-12">
                <div className="rounded-2xl border-2 border-[var(--accent)]/40 bg-white/5 px-6 py-4 backdrop-blur-xl">
                  <p className="text-xs uppercase text-[var(--accent)]/80">Votre carte</p>
                  <p className="font-serif text-lg font-bold text-[#F1F1E6]">{masterStats?.initiateName ?? 'Initié'}</p>
                  <p className="text-sm text-[#F1F1E6]/70">ATQ {playerAttack} · DEF {playerDefense} · {playerElement}</p>
                </div>
                <div className="rounded-2xl border-2 border-red-900/50 bg-red-950/20 px-6 py-4 backdrop-blur-xl">
                  <p className="text-xs uppercase text-red-400/80">Parasite de Cendre</p>
                  <p className="font-serif text-lg font-bold text-red-200">Ombre grise</p>
                  <p className="text-sm text-red-300/70">ATQ {parasite.attack} · DEF {parasite.defense} · Feu</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleAttack}
                  disabled={phase !== 'player_turn'}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-red-500/20 border border-red-500/50 text-red-300 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Swords className="w-5 h-5" />
                  Attaquer
                </button>
                <button
                  type="button"
                  onClick={handleEndTurn}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-[var(--accent)]/20 border border-[var(--accent)]/50 accent-color hover:bg-[var(--accent)]/30 transition"
                >
                  <SkipForward className="w-5 h-5" />
                  Fin de tour
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'enemy_turn' && (
            <motion.div
              key="enemy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="text-[#F1F1E6]/80">Le Parasite prépare son attaque...</p>
            </motion.div>
          )}

          {phase === 'victory' && (
            <motion.div
              key="victory"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md text-center space-y-6"
            >
              <p className="font-serif text-2xl font-bold text-emerald-400">Victoire</p>
              <p className="text-[#F1F1E6]/90">Vous avez repoussé le Parasite de Cendre.</p>
              <p className="text-[var(--accent)] text-sm">+50 PS · +20 XP</p>
              <p className="text-[#F1F1E6]/70 text-sm">Carte débloquée : <strong>{REWARD_CARD_NAME}</strong></p>
              <p className="text-[#D4AF37]/90 text-sm">Titre : {REWARD_TITLE}</p>
              {saving && <p className="text-xs text-[#F1F1E6]/50">Sauvegarde...</p>}
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 rounded-xl font-medium bg-[var(--accent)]/20 border border-[var(--accent)] accent-color"
              >
                Retour au Hub
              </button>
            </motion.div>
          )}

          {phase === 'defeat' && (
            <motion.div
              key="defeat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md text-center space-y-6"
            >
              <p className="font-serif text-2xl font-bold text-red-400">Défaite</p>
              <p className="text-[#F1F1E6]/90">Votre sève a été momentanément rongée. Pas de perte de PS.</p>
              <p className="text-[#D4AF37]/90 italic text-sm">&ldquo;{ORACLE_ADVICE_LOSS}&rdquo;</p>
              <button
                type="button"
                onClick={() => {
                  setPhase('intro');
                  setPlayerHp(playerMaxHp);
                  setParasiteHp(parasite.maxHp);
                  setPlayerSeve(INITIAL_SEVE);
                  setTurnCount(0);
                  setMessage('');
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-white/10 border border-white/20 text-[#F1F1E6]"
              >
                <RotateCcw className="w-5 h-5" />
                Rejouer
              </button>
              <button type="button" onClick={onBack} className="block mx-auto text-sm text-[var(--accent)]/80 hover:accent-color">
                Retour au Hub
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
