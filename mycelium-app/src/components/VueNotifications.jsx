import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';

/** Notifications type "mise à jour" (comme GitHub). En production, à charger depuis Supabase ou API. */
const DEFAULT_NOTIFICATIONS = [
  {
    id: '1',
    type: 'release',
    title: 'L\'Observatoire de la Constellation',
    body: 'Nouveau module : Ciel de Sève, Lecture Astrale et recommandations alchimiques. Téléchargez votre Carte du Ciel.',
    date: new Date().toISOString(),
    read: false,
  },
  {
    id: '2',
    type: 'release',
    title: 'Parcours d\'initiation unifié',
    body: 'Les questionnaires 49 Racines, Totem, Résonance, Élément et Matrice sont regroupés dans un seul onglet avec un stepper.',
    date: new Date().toISOString(),
    read: false,
  },
  {
    id: '3',
    type: 'feature',
    title: 'Journal de Sève — CRUD complet',
    body: 'Créez, modifiez et supprimez vos notes. Choisissez votre émotion du moment parmi 7 états.',
    date: new Date().toISOString(),
    read: false,
  },
  {
    id: '4',
    type: 'feature',
    title: 'Carte Maîtresse débloquée',
    body: 'Une fois les 49 Racines complétées, votre Carte Maîtresse (L\'Inné) est disponible dans Mon Deck.',
    date: new Date().toISOString(),
    read: false,
  },
];

/**
 * Onglet Notifications — mises à jour majeures et annonces (style GitHub).
 */
export default function VueNotifications({ onBack }) {
  const notifications = DEFAULT_NOTIFICATIONS;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-serif text-2xl font-bold accent-color flex items-center gap-2">
        <Bell className="w-7 h-7" />
        Notifications
      </h1>
      <p className="text-[#F1F1E6]/60 text-sm">
        Mises à jour majeures et annonces du Réseau.
      </p>

      <ul className="space-y-3">
        {notifications.map((n) => (
          <motion.li
            key={n.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl hover:bg-white/[0.07] transition"
          >
            <p className="font-medium text-[#F1F1E6]">{n.title}</p>
            <p className="text-[#F1F1E6]/70 text-sm mt-1">{n.body}</p>
            <p className="text-[#F1F1E6]/40 text-xs mt-2">
              {new Date(n.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </motion.li>
        ))}
      </ul>

      {onBack && (
        <button type="button" onClick={onBack} className="text-[var(--accent)]/80 text-sm hover:accent-color">
          ← Retour au tableau de bord
        </button>
      )}
    </motion.div>
  );
}
