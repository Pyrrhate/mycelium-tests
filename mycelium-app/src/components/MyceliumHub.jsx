import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Sparkles,
  Network,
  BookOpen,
  User,
  LogOut,
  Activity,
  Droplets,
} from 'lucide-react';
import { PawPrint } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { save49Result, updateProfile, getMaison } from '../services/myceliumSave';
import { TOTEMS } from '../data/totemData';
import { ToastContainer } from './Toast';
import Test49Racines from './Test49Racines';
import QuestionnaireTotem from './QuestionnaireTotem';
import VueReseau from './VueReseau';
import VueEveilQuotidien from './VueEveilQuotidien';
import ConstellationCard from './ConstellationCard';
import AvatarExplicationsCard from './AvatarExplicationsCard';

/**
 * Mycélium Hub — Dashboard principal
 * Sidebar verre, section Profil (Avatar Totem + Grade de Sève), Pouls de la Forêt (stats mondiales).
 */
export default function MyceliumHub({ session, onLogout }) {
  const [toasts, setToasts] = useState([]);
  const [pulse, setPulse] = useState(null);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | '49racines' | 'totem' | 'reseau' | 'eveil'
  const [lastResult, setLastResult] = useState(() => {
    try {
      const s = localStorage.getItem('mycelium_last_result');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [totem, setTotem] = useState(() => {
    try {
      const name = localStorage.getItem('mycelium_totem');
      return name || null;
    } catch {
      return null;
    }
  });

  const addToast = (msg, variant = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message: msg, variant, duration: 4000 }]);
  };
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    if (!supabase) return;
    const fetchPulse = async () => {
      try {
        const { data } = await supabase.from('forest_stats').select('qm_score').limit(200);
        if (data && data.length > 0) {
          const avg = data.reduce((s, r) => s + (Number(r.qm_score) || 0), 0) / data.length;
          setPulse({ moyenneQM: Math.round(avg), count: data.length });
        } else {
          setPulse({ moyenneQM: 0, count: 0 });
        }
      } catch {
        setPulse({ moyenneQM: 0, count: 0 });
      }
    };
    fetchPulse();
  }, []);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    if (onLogout) onLogout();
    addToast('Vous avez quitté le Réseau.');
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { id: '49racines', icon: BookOpen, label: 'Les 49 Racines' },
    { id: 'totem', icon: PawPrint, label: 'Mon Totem' },
    { id: 'reseau', icon: Network, label: 'Le Réseau' },
    { id: 'eveil', icon: Activity, label: 'Éveil Quotidien' },
  ];

  return (
    <div className="min-h-screen bg-[#070B0A] text-[#F1F1E6] flex">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Sidebar verre */}
      <aside
        className="w-20 flex-shrink-0 flex flex-col items-center py-6 border-r border-[#D4AF37]/20 backdrop-blur-xl"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        }}
      >
        <Sparkles className="w-8 h-8 text-[#D4AF37] mb-8" />
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition mb-2 ${
              activeView === item.id
                ? 'text-[#D4AF37] bg-[#D4AF37]/15'
                : 'text-[#F1F1E6]/70 hover:text-[#D4AF37] hover:bg-white/5'
            }`}
            title={item.label}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] max-w-full truncate">{item.label}</span>
          </button>
        ))}
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-[#F1F1E6]/50 hover:text-red-400 hover:bg-red-500/10 transition"
            title="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px]">Sortir</span>
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 overflow-auto p-6">
        {activeView === '49racines' && (
          <Test49Racines
            onBack={() => setActiveView('dashboard')}
            onComplete={async (result) => {
              setLastResult(result);
              try {
                if (result) localStorage.setItem('mycelium_last_result', JSON.stringify(result));
              } catch (_) {}
              const uid = session?.user?.id;
              if (uid && result) {
                await save49Result(result, uid);
                await updateProfile(uid, {
                  initiate_name: result.userName || undefined,
                  maison: result.hybrid?.profileKey ? getMaison(result.hybrid.profileKey) : undefined,
                });
              }
            }}
          />
        )}
        {activeView === 'totem' && (
          <QuestionnaireTotem
            onBack={() => setActiveView('dashboard')}
            poleAverages={lastResult?.poleAverages}
            userId={session?.user?.id}
            savedTotemName={totem}
            onComplete={(t) => {
              setTotem(t?.name ?? null);
            }}
          />
        )}
        {activeView === 'reseau' && (
          <VueReseau pulse={pulse} onBack={() => setActiveView('dashboard')} />
        )}
        {activeView === 'eveil' && (
          <VueEveilQuotidien onBack={() => setActiveView('dashboard')} />
        )}
        {activeView === 'dashboard' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-2xl font-bold text-[#D4AF37]"
          >
            Mycélium Hub
          </motion.h1>

          {/* Constellation + Avatar (si un résultat 49 Racines existe) */}
          {lastResult && (
            <>
              <ConstellationCard result={lastResult} />
              <AvatarExplicationsCard result={lastResult} />
            </>
          )}

          {/* Carte Profil — Avatar Totem + Grade de Sève */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-[#D4AF37]/30 bg-white/5 backdrop-blur-xl p-6"
            style={{ boxShadow: '0 0 30px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            <h2 className="font-serif text-lg font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Votre identité
            </h2>
            <div className="flex flex-wrap items-center gap-6">
              <div
                className="w-24 h-24 rounded-2xl border border-[#D4AF37]/40 flex items-center justify-center bg-[#0d1211] text-4xl"
                style={{ boxShadow: '0 0 20px rgba(212,175,55,0.15)' }}
              >
                {totem ? (
                  <span title={totem}>
                    {TOTEMS.find((t) => t.name === totem)?.emoji ?? '✨'}
                  </span>
                ) : (
                  <Droplets className="w-10 h-10 text-[#D4AF37]/70" />
                )}
              </div>
              <div>
                <p className="text-[#F1F1E6] font-medium">
                  {session?.user?.user_metadata?.display_name || session?.user?.email || 'Initié'}
                </p>
                <p className="text-[#F1F1E6]/60 text-sm mt-1">{session?.user?.email}</p>
                {totem && (
                  <p className="mt-2 inline-block px-3 py-1 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-medium">
                    Totem : {totem}
                  </p>
                )}
                <p className="mt-2 inline-block px-3 py-1 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-medium">
                  Grade de Sève : Germe
                </p>
              </div>
            </div>
          </motion.section>

          {/* Pouls de la Forêt */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-[#D4AF37]/30 bg-white/5 backdrop-blur-xl p-6"
            style={{ boxShadow: '0 0 30px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            <h2 className="font-serif text-lg font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Le Réseau — Pouls de la Forêt
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl bg-[#0d1211]/80 border border-[#D4AF37]/20 p-4">
                <p className="text-[#F1F1E6]/60 text-xs uppercase tracking-wider">Moyenne QM</p>
                <p className="text-2xl font-bold text-[#D4AF37] mt-1">
                  {pulse ? pulse.moyenneQM : '—'}
                </p>
              </div>
              <div className="rounded-xl bg-[#0d1211]/80 border border-[#D4AF37]/20 p-4">
                <p className="text-[#F1F1E6]/60 text-xs uppercase tracking-wider">Passages</p>
                <p className="text-2xl font-bold text-[#F1F1E6] mt-1">
                  {pulse ? pulse.count : '—'}
                </p>
              </div>
              <div className="rounded-xl bg-[#0d1211]/80 border border-emerald-500/20 p-4">
                <p className="text-[#F1F1E6]/60 text-xs uppercase tracking-wider">Hyphes actives</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">—</p>
              </div>
              <div className="rounded-xl bg-[#0d1211]/80 border border-sky-500/20 p-4">
                <p className="text-[#F1F1E6]/60 text-xs uppercase tracking-wider">Sève en flux</p>
                <p className="text-2xl font-bold text-sky-400 mt-1">—</p>
              </div>
            </div>
          </motion.section>

          {/* Carte d'accès rapide */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-[#D4AF37]/30 bg-white/5 backdrop-blur-xl p-6"
            style={{ boxShadow: '0 0 30px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          >
            <h2 className="font-serif text-lg font-bold text-[#D4AF37] mb-4">Prochaines étapes</h2>
            <p className="text-[#F1F1E6]/80 text-sm">
              {lastResult
                ? 'Explorez Le Réseau et l\'Éveil Quotidien, ou refaites le test des 49 Racines pour mettre à jour votre Constellation.'
                : 'Passez le test des 49 Racines pour révéler votre profil hybride et votre Constellation.'}
            </p>
          </motion.section>
        </div>
        )}
      </main>
    </div>
  );
}
