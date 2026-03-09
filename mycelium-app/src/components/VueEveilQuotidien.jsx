import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, Sparkles, Calendar } from 'lucide-react';
import { getQuestForDay } from '../data/dailyQuests';
import { getOrCreateDailyLog, getTodayDailyLog, completeDailyQuest, getDailyLogsForCalendar } from '../services/myceliumSave';
import { SEALS_MASTERY } from '../data/sealsMastery';

const KEY_COLORS = {
  spore: '#A78BFA',
  ancrage: '#D97706',
  expansion: '#3B82F6',
  lyse: '#EF4444',
  fructification: '#22C55E',
  absorption: '#94A3B8',
  dormance: '#D4AF37',
};

/**
 * Éveil Quotidien — 30 Missions de Sève, quête du jour (priorité clé faible), calendrier des jours complétés.
 */
export default function VueEveilQuotidien({ onBack, userId, poleAverages, onQuestComplete }) {
  const [dailyLog, setDailyLog] = useState(null);
  const [loading, setLoading] = useState(!!userId);
  const [completing, setCompleting] = useState(false);
  const [calendarLogs, setCalendarLogs] = useState([]);
  const [particles, setParticles] = useState(false);
  const [unlockedSealModal, setUnlockedSealModal] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    (async () => {
      const quest = getQuestForDay(poleAverages);
      let log = await getTodayDailyLog(userId);
      if (!log && quest) {
        log = await getOrCreateDailyLog(userId, quest);
      }
      setDailyLog(log);
      setLoading(false);
    })();
  }, [userId, poleAverages]);

  useEffect(() => {
    if (!userId) return;
    const now = new Date();
    getDailyLogsForCalendar(userId, now.getFullYear(), now.getMonth() + 1).then(setCalendarLogs);
  }, [userId, dailyLog?.is_quest_completed]);

  const handleMissionAccomplie = async () => {
    if (!userId || dailyLog?.is_quest_completed || completing) return;
    setCompleting(true);
    setParticles(true);
    const result = await completeDailyQuest(userId);
    const updated = result?.log ?? result;
    setDailyLog(updated);
    if (result?.newlyUnlockedSeal) setUnlockedSealModal(result.newlyUnlockedSeal);
    onQuestComplete?.();
    setTimeout(() => setParticles(false), 1500);
    setCompleting(false);
  };

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const byDate = {};
  calendarLogs.forEach((l) => {
    byDate[l.log_date] = l;
  });

  if (loading && !dailyLog) {
    return (
      <div className="max-w-xl mx-auto py-8 text-center text-[#F1F1E6]/70">
        Chargement de la quête…
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto space-y-6"
    >
      <h1 className="font-serif text-2xl font-bold accent-color flex items-center gap-2">
        <Activity className="w-7 h-7" />
        Éveil Quotidien
      </h1>
      <p className="text-[#F1F1E6]/70 text-sm">
        Une mission de sève par jour. Priorité à votre clé la plus faible. +50 XP et +20 PS à la validation.
      </p>

      {/* Quête du jour — encadré bioluminescent */}
      <section
        className={`rounded-2xl border backdrop-blur-xl p-6 transition-all duration-500 ${particles ? 'ring-2 ring-emerald-400/50' : ''}`}
        style={{
          borderColor: dailyLog?.element_key ? `${KEY_COLORS[dailyLog.element_key] || '#D4AF37'}40` : 'rgba(212,175,55,0.3)',
          background: dailyLog?.element_key ? `${KEY_COLORS[dailyLog.element_key] || '#D4AF37'}08` : 'rgba(255,255,255,0.05)',
          boxShadow: dailyLog?.element_key ? `0 0 40px ${KEY_COLORS[dailyLog.element_key] || '#D4AF37'}20` : '0 0 30px rgba(212,175,55,0.08)',
        }}
      >
        <p className="text-[var(--accent)]/80 text-xs uppercase tracking-wider mb-2">Mission du jour</p>
        {dailyLog ? (
          <>
            <p className="text-[#F1F1E6] font-serif font-semibold text-lg mb-1">
              {SEALS_MASTERY[dailyLog.element_key]?.element || dailyLog.element_key} — {dailyLog.task_text}
            </p>
            {dailyLog.is_quest_completed ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm mt-4">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>Mission accomplie. +50 XP, +20 PS. Revenez demain.</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleMissionAccomplie}
                disabled={completing}
                className="mt-4 px-5 py-2.5 rounded-xl font-medium bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/35 transition flex items-center gap-2 disabled:opacity-60"
              >
                <CheckCircle className="w-4 h-4" />
                {completing ? 'Enregistrement…' : 'Mission accomplie (+50 XP, +20 PS)'}
              </button>
            )}
          </>
        ) : (
          <p className="text-[#F1F1E6]/60 text-sm">Aucune quête aujourd&apos;hui. Rechargez la page ou revenez demain.</p>
        )}
      </section>

      {/* Calendrier du mois */}
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <h2 className="font-serif text-lg font-bold accent-color mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Ce mois
        </h2>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((d) => (
            <span key={d} className="text-[#F1F1E6]/50 text-xs py-1">{d}</span>
          ))}
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const log = byDate[dateStr];
            const isToday = day === today.getDate();
            return (
              <div
                key={day}
                className={`min-h-8 flex items-center justify-center rounded-lg text-sm ${
                  isToday ? 'ring-1 ring-[var(--accent)]' : ''
                } ${log?.is_quest_completed ? 'bg-white/10' : ''}`}
                title={log?.is_quest_completed ? `${log.element_key} complété` : ''}
              >
                {log?.is_quest_completed ? (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: KEY_COLORS[log.element_key] || '#D4AF37' }}
                  />
                ) : (
                  <span className="text-[#F1F1E6]/70">{day}</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal déblocage Sceau de Maîtrise */}
      {unlockedSealModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setUnlockedSealModal(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl border-2 p-8 max-w-md text-center backdrop-blur-xl"
            style={{
              borderColor: SEALS_MASTERY[unlockedSealModal]?.color || '#D4AF37',
              background: `linear-gradient(135deg, ${SEALS_MASTERY[unlockedSealModal]?.color || '#D4AF37'}20, transparent)`,
            }}
          >
            <p className="font-serif text-2xl font-bold text-[#F1F1E6] mb-2">
              Sceau de Maîtrise débloqué
            </p>
            <p className="text-[#F1F1E6]/90 mb-4">
              Vous avez maîtrisé {SEALS_MASTERY[unlockedSealModal]?.element || unlockedSealModal}. Le Sceau de {SEALS_MASTERY[unlockedSealModal]?.name || unlockedSealModal} est désormais vôtre.
            </p>
            <button
              type="button"
              onClick={() => setUnlockedSealModal(null)}
              className="px-6 py-2 rounded-xl font-medium bg-white/10 border border-white/30 text-[#F1F1E6]"
            >
              Magnifique
            </button>
          </motion.div>
        </motion.div>
      )}

      {onBack && (
        <button type="button" onClick={onBack} className="text-[var(--accent)]/80 text-sm hover:accent-color">
          ← Retour au tableau de bord
        </button>
      )}
    </motion.div>
  );
}
