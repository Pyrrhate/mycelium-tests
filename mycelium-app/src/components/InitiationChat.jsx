import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Send, Loader2, Sparkles, Moon, 
  Wind, Mountain, Droplet, Flame, TreePine, Gem, Stars
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { updateProfile } from '../services/myceliumSave';

const ELEMENT_ICONS = {
  air: Wind,
  terre: Mountain,
  eau: Droplet,
  feu: Flame,
  bois: TreePine,
  metal: Gem,
  ether: Stars,
};

const ELEMENT_COLORS = {
  air: '#A78BFA',
  terre: '#D97706',
  eau: '#3B82F6',
  feu: '#EF4444',
  bois: '#22C55E',
  metal: '#94A3B8',
  ether: '#D4AF37',
};

const ELEMENT_NAMES = {
  air: 'Le Souffle',
  terre: 'Le Socle',
  eau: "L'Onde",
  feu: 'La Forge',
  bois: "L'Éclosion",
  metal: 'Le Prisme',
  ether: 'Le Vide',
};

/** Première question affichée sans appel API — Claude n'est appelé qu'après la première réponse de l'utilisateur. */
const WELCOME_FIRST_QUESTION =
  'Bienvenue, voyageur. Avant de vous révéler les secrets du Grimoire, dites-moi : quand le vent souffle fort, cherchez-vous un abri ou ouvrez-vous les bras ?';

function ChatBubble({ message, isGuardian }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isGuardian ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`max-w-[80%] p-4 rounded-2xl ${
          isGuardian
            ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#F1F1E6]'
            : 'bg-white/10 border border-white/20 text-[#F1F1E6]/90'
        }`}
      >
        {isGuardian && (
          <p className="text-xs text-[#D4AF37]/70 mb-2 flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            Gardien du Grimoire
          </p>
        )}
        <p className="leading-relaxed whitespace-pre-wrap">{message}</p>
      </div>
    </motion.div>
  );
}

function ResultsReveal({ scores, totem, totemDescription, onContinue }) {
  const [showRadar, setShowRadar] = useState(false);
  const [showTotem, setShowTotem] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowRadar(true), 500);
    const t2 = setTimeout(() => setShowTotem(true), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const sortedElements = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 text-center py-8"
    >
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-serif text-3xl text-[#D4AF37]"
      >
        Votre Âme est Révélée
      </motion.h2>

      <AnimatePresence>
        {showRadar && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            <p className="text-[#F1F1E6]/60 text-sm mb-4">Vos Éléments Dominants</p>
            <div className="space-y-3">
              {sortedElements.map(([element, score], idx) => {
                const Icon = ELEMENT_ICONS[element];
                const color = ELEMENT_COLORS[element];
                const name = ELEMENT_NAMES[element];
                const width = Math.max(10, ((score + 2) / 4) * 100);

                return (
                  <motion.div
                    key={element}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.2 }}
                    className="flex items-center gap-3"
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#F1F1E6]/80">{name}</span>
                        <span style={{ color }}>{score.toFixed(1)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{ delay: idx * 0.2 + 0.3, duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{ background: color }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTotem && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-6"
          >
            <div 
              className="inline-block p-8 rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)',
                border: '2px solid rgba(212,175,55,0.4)',
                boxShadow: '0 0 60px rgba(212,175,55,0.2)',
              }}
            >
              <p className="text-xs text-[#D4AF37]/70 uppercase tracking-wider mb-3">
                Votre Archétype Gardien
              </p>
              <h3 className="font-serif text-4xl text-[#D4AF37] mb-3">
                {totem}
              </h3>
              <p className="text-[#F1F1E6]/70 italic max-w-sm mx-auto">
                {totemDescription}
              </p>
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={onContinue}
              className="mt-8 px-8 py-4 rounded-2xl font-medium text-lg transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0.15) 100%)',
                border: '1px solid rgba(212,175,55,0.5)',
                color: '#D4AF37',
              }}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Entrer dans le Grimoire
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function InitiationChat({ userId, onComplete }) {
  const [chatHistory, setChatHistory] = useState([
    { role: 'guardian', content: WELCOME_FIRST_QUESTION },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setError(null);

    const newHistory = [...chatHistory, { role: 'user', content: userMessage }];
    setChatHistory(newHistory);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('initiation-oracle', {
        body: { chat_history: newHistory },
      });

      if (error) throw new Error(data?.error || error.message);

      if (data?.error) {
        setError(data.error);
        return;
      }
      if (data?.status === 'asking') {
        setChatHistory([...newHistory, { role: 'guardian', content: data.reply }]);
      } else if (data?.status === 'complete') {
        setChatHistory([...newHistory, { role: 'guardian', content: data.reply }]);
        
        setTimeout(() => {
          setResult({
            scores: data.scores,
            totem: data.totem,
            totemDescription: data.totem_description,
          });
        }, 1500);

        if (userId) {
          await saveInitiationResult(userId, data);
        }
      }
    } catch (err) {
      console.error('Send message error:', err);
      setError(err?.message || 'Le Grimoire semble perturbé. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveInitiationResult = async (userId, data) => {
    try {
      await updateProfile(userId, {
        test_mycelium_completed: true,
        initiation_step: 2,
        totem_animal: data.totem,
        constellation_data: {
          poleAverages: [
            data.scores.ether || 0,
            data.scores.terre || 0,
            data.scores.eau || 0,
            data.scores.feu || 0,
            data.scores.bois || 0,
            data.scores.metal || 0,
            data.scores.air || 0,
          ],
          hybrid: { name: `${data.totem} de ${ELEMENT_NAMES[getDominantElement(data.scores)]}` },
          scores_anima: data.scores,
        },
      });
    } catch (err) {
      console.error('Save result error:', err);
    }
  };

  const getDominantElement = (scores) => {
    return Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  };

  const handleContinue = () => {
    if (onComplete) {
      onComplete(result);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (result) {
    return (
      <div className="min-h-[600px] flex items-center justify-center p-6">
        <ResultsReveal 
          scores={result.scores}
          totem={result.totem}
          totemDescription={result.totemDescription}
          onContinue={handleContinue}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3"
        >
          <BookOpen className="w-8 h-8 text-[#D4AF37]" />
          <h1 className="font-serif text-3xl text-[#D4AF37]">
            Initiation au Grimoire
          </h1>
        </motion.div>
        <p className="text-[#F1F1E6]/50 text-sm mt-2">
          Le Gardien va révéler votre profil alchimique à travers quelques questions.
        </p>
      </div>

      <div 
        className="flex-1 overflow-y-auto rounded-2xl p-4 space-y-4 mb-4"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(212,175,55,0.2)',
        }}
      >
        {chatHistory.map((msg, idx) => (
          <ChatBubble
            key={idx}
            message={msg.content}
            isGuardian={msg.role === 'guardian'}
          />
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 text-[#D4AF37]/70"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Le Grimoire médite...</span>
          </motion.div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div 
        className="flex items-center gap-3 p-3 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Partagez votre réponse avec le Grimoire..."
          disabled={isLoading}
          rows={2}
          className="flex-1 bg-transparent text-[#F1F1E6] placeholder-[#F1F1E6]/30 resize-none focus:outline-none disabled:opacity-50"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={sendMessage}
          disabled={!userInput.trim() || isLoading}
          className="p-3 rounded-xl transition-all disabled:opacity-40"
          style={{
            background: userInput.trim() ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${userInput.trim() ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`,
          }}
        >
          <Send className={`w-5 h-5 ${userInput.trim() ? 'text-[#D4AF37]' : 'text-[#F1F1E6]/40'}`} />
        </motion.button>
      </div>
    </div>
  );
}
