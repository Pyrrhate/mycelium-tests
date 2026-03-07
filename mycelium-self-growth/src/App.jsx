import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import ParticleBackground from './components/ParticleBackground';
import WelcomeScreen from './components/WelcomeScreen';
import QuestionScreen from './components/QuestionScreen';
import ResultsScreen from './components/ResultsScreen';
import { POLES } from './data';
import './App.css';

// Son d'ambiance forêt (optionnel : placer un fichier forest.mp3 dans public/)
const AMBIENT_URL = '/forest.mp3';

function App() {
  const [view, setView] = useState('home');
  const [answers, setAnswers] = useState(() => Array(POLES.length).fill(null));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [meditateMode, setMeditateMode] = useState(false);
  const cursorRef = useRef(null);
  const spotRef = useRef(null);
  const ambientRef = useRef(null);

  const setAnswer = useCallback((index, value) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const goNext = useCallback(() => {
    if (currentQuestion < POLES.length - 1) {
      setCurrentQuestion((q) => q + 1);
    } else {
      setView('results');
    }
  }, [currentQuestion]);

  const particleIntensity = view === 'question' && typeof answers[currentQuestion] === 'number'
    ? Math.abs(answers[currentQuestion]) / 2
    : 0.3;

  // Curseur personnalisé (suit la souris)
  useEffect(() => {
    const onMove = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
      if (spotRef.current) {
        spotRef.current.style.left = `${e.clientX}px`;
        spotRef.current.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Dégradé radial qui suit la souris (lampe torche)
  const [spot, setSpot] = useState({ x: '50%', y: '50%' });
  useEffect(() => {
    const onMove = (e) => {
      setSpot({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const scores = answers.map((a) => (a === null ? 0 : a));

  // Lecture du son d'ambiance en mode méditation
  useEffect(() => {
    if (!meditateMode || view !== 'results') return;
    try {
      const audio = new Audio(AMBIENT_URL);
      ambientRef.current = audio;
      audio.loop = true;
      audio.volume = 0.25;
      audio.play().catch(() => {});
    } catch (_) {}
    return () => {
      if (ambientRef.current) {
        ambientRef.current.pause();
        ambientRef.current = null;
      }
    };
  }, [meditateMode, view]);

  return (
    <div
      className="min-h-screen relative grain"
      style={{
        background: `radial-gradient(600px circle at ${spot.x}px ${spot.y}px, rgba(18, 26, 23, 0.4), transparent 70%), #070B0A`,
        transition: 'background 0.3s ease-out',
      }}
    >
      <ParticleBackground intensity={particleIntensity} />

      {/* Curseur personnalisé (desktop) */}
      <div
        ref={cursorRef}
        className="cursor-dot hidden md:block"
        aria-hidden
        style={{ left: 0, top: 0 }}
      />
      <div
        ref={spotRef}
        className="cursor-trail hidden md:block"
        aria-hidden
        style={{ left: 0, top: 0 }}
      />

      <AnimatePresence mode="wait">
        {view === 'home' && (
          <WelcomeScreen key="home" onStart={() => setView('question')} />
        )}
        {view === 'question' && (
          <QuestionScreen
            key={`q-${currentQuestion}`}
            index={currentQuestion}
            answer={answers[currentQuestion]}
            onAnswer={(v) => setAnswer(currentQuestion, v)}
            onNext={goNext}
          />
        )}
        {view === 'results' && (
          <ResultsScreen
            key="results"
            scores={scores}
            onRestart={() => {
              setAnswers(Array(POLES.length).fill(null));
              setCurrentQuestion(0);
              setView('question');
            }}
            onMeditate={() => setMeditateMode(true)}
            isMeditateMode={meditateMode}
            onExitMeditate={() => setMeditateMode(false)}
          />
        )}
      </AnimatePresence>

      {/* Retour à l'accueil Mycélium (quand l'app est ouverte depuis l'index) */}
      <a
        href="../index.html"
        className="fixed bottom-4 left-4 z-50 px-4 py-2 rounded-lg bg-black/60 hover:bg-black/80 text-white text-sm font-medium backdrop-blur transition-opacity"
      >
        ← Retour à l'accueil
      </a>
    </div>
  );
}

export default App;
