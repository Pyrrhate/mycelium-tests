(function () {
  const state = {
    currentTest: null,
    currentQuestion: 0,
    view: 'selector',
    totalQuestions: 7,
    chaosRunning: false,
    chaosTimer: null,
    chaosWall: null
  };

  const SELF_GROWTH_POLES = window.MYCELIUM_49 ? window.MYCELIUM_49.poles : [];
  const SG_SCALE = window.MYCELIUM_49 ? window.MYCELIUM_49.scale : [-2, -1, 0, 1, 2];
  const SG_LABELS = window.MYCELIUM_49 ? window.MYCELIUM_49.scaleLabels : { '-2': 'Vide', '-1': '', '0': 'Équilibre', '1': '', '2': 'Dominance' };
  let sgAnswers = [];
  let sgPoleIndex = 0;
  let sgUserName = '';
  let sgRadarChart = null;

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  // --- Bruitages (Web Audio API) : au moins 2 sons par question, variés selon la question ---
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }
  function playTone(options) {
    try {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const {
        freq = 440,
        duration = 0.08,
        type = 'sine',
        volume = 0.15,
        freqEnd = null,
        decay = 0.3
      } = options;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration * 0.5);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration * (1 - decay));
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }
  function playSgKeySound() {
    playTone({
      freq: 280 + Math.random() * 80,
      duration: 0.06,
      type: 'sine',
      volume: 0.04,
      decay: 0.4
    });
  }
  // Deux sons par question (hover + click), paramètres différents pour chaque question (qIndex 0-6)
  const SOUND_PRESETS = [
    { hover: { freq: 330, duration: 0.06, type: 'sine', volume: 0.12 }, click: { freq: 523, duration: 0.1, type: 'sine', volume: 0.18 }, wrong: { freq: 120, duration: 0.15, type: 'square', volume: 0.12 } },
    { hover: { freq: 392, duration: 0.05, type: 'triangle', volume: 0.1 }, click: { freq: 587, duration: 0.08, type: 'triangle', volume: 0.15 }, wrong: { freq: 100, duration: 0.2, type: 'sawtooth', volume: 0.1 } },
    { hover: { freq: 440, duration: 0.07, type: 'sine', volume: 0.11 }, click: { freq: 659, duration: 0.09, type: 'sine', volume: 0.16 }, wrong: { freq: 90, duration: 0.18, type: 'square', volume: 0.11 } },
    { hover: { freq: 494, duration: 0.055, type: 'triangle', volume: 0.1 }, click: { freq: 698, duration: 0.085, type: 'triangle', volume: 0.14 }, wrong: { freq: 80, duration: 0.22, type: 'sawtooth', volume: 0.1 } },
    { hover: { freq: 523, duration: 0.065, type: 'sine', volume: 0.12 }, click: { freq: 784, duration: 0.075, type: 'sine', volume: 0.17 }, wrong: { freq: 70, duration: 0.25, type: 'square', volume: 0.12 } },
    { hover: { freq: 587, duration: 0.05, type: 'triangle', volume: 0.11 }, click: { freq: 880, duration: 0.08, type: 'triangle', volume: 0.15 }, wrong: { freq: 65, duration: 0.2, type: 'sawtooth', volume: 0.11 } },
    { hover: { freq: 659, duration: 0.06, type: 'sine', volume: 0.13 }, click: { freq: 988, duration: 0.1, type: 'sine', volume: 0.18 }, wrong: { freq: 60, duration: 0.28, type: 'square', volume: 0.13 } }
  ];
  function soundHover(qIndex) {
    const q = Math.max(0, Math.min(qIndex - 1, 6));
    playTone(SOUND_PRESETS[q].hover);
  }
  function soundClick(qIndex, isWrong) {
    const q = Math.max(0, Math.min(qIndex - 1, 6));
    if (isWrong && SOUND_PRESETS[q].wrong) playTone(SOUND_PRESETS[q].wrong);
    else playTone(SOUND_PRESETS[q].click);
  }
  function soundTransition(qIndex) {
    const q = Math.max(0, Math.min(qIndex - 1, 6));
    playTone({ freq: 400 + q * 80, duration: 0.12, type: 'sine', volume: 0.12, freqEnd: 600 + q * 60 });
  }
  function soundPopup() {
    playTone({ freq: 350, duration: 0.1, type: 'sine', volume: 0.14 });
  }

  function soundBuzzerAggressive() {
    playTone({ freq: 110, duration: 0.18, type: 'sawtooth', volume: 0.22, freqEnd: 70 });
    setTimeout(() => playTone({ freq: 90, duration: 0.14, type: 'square', volume: 0.18 }), 40);
  }

  // --- Ambiances (4 univers) : beds synthétiques, volume augmente avec les questions ---
  const ambient = { gain: null, nodes: [], testId: null };
  function stopAmbient() {
    try {
      if (ambient.nodes.length) {
        ambient.nodes.forEach(n => { try { n.stop?.(); } catch (_) {} try { n.disconnect?.(); } catch (_) {} });
      }
      ambient.nodes = [];
      if (ambient.gain) { try { ambient.gain.disconnect(); } catch (_) {} }
      ambient.gain = null;
      ambient.testId = null;
    } catch (_) {}
  }
  function startAmbient(testId) {
    stopAmbient();
    try {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      g.connect(ctx.destination);
      ambient.gain = g;
      ambient.testId = testId;

      const mkOsc = (type, freq, vol = 0.12) => {
        const o = ctx.createOscillator();
        const og = ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        og.gain.value = vol;
        o.connect(og);
        og.connect(g);
        o.start();
        ambient.nodes.push(o);
        return { o, og };
      };

      if (testId === 'trump') {
        // patriotique : tierce + quinte légère
        mkOsc('triangle', 196, 0.11);
        mkOsc('triangle', 247, 0.08);
        mkOsc('sine', 294, 0.06);
      } else if (testId === 'musk') {
        // EDM/techno : saw + pulse (illus. via square)
        mkOsc('sawtooth', 110, 0.09);
        mkOsc('square', 220, 0.05);
        mkOsc('sine', 55, 0.06);
      } else if (testId === 'bdw') {
        // marche \"romaine\" : rythme suggéré (osc basse + harmonique)
        mkOsc('sine', 130.81, 0.10);
        mkOsc('triangle', 261.63, 0.06);
      } else if (testId === 'putin') {
        // drone froid : basse + aigu fin
        mkOsc('sine', 65.41, 0.12);
        mkOsc('sine', 523.25, 0.02);
      }
    } catch (_) {}
  }
  function setAmbientIntensity(qIndex) {
    try {
      if (!ambient.gain) return;
      const ctx = getAudioCtx();
      const t = ctx.currentTime;
      const intensity = Math.max(0, Math.min(1, (qIndex - 1) / 6));
      const base = 0.02 + intensity * 0.12;
      ambient.gain.gain.cancelScheduledValues(t);
      ambient.gain.gain.setValueAtTime(ambient.gain.gain.value, t);
      ambient.gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, base), t + 0.25);
    } catch (_) {}
  }

  function updateTabTitle(testId, qIndex) {
    if (state.view !== 'test') {
      document.title = 'Mycélium : Test de Compatibilité Universelle';
      return;
    }
    if (qIndex <= 2) document.title = 'Questionnaire';
    else if (qIndex <= 4) document.title = testId === 'putin' ? 'ILS VOIENT TOUT' : 'INCOHÉRENCE DÉTECTÉE';
    else if (qIndex <= 6) document.title = testId === 'trump' ? 'FAKE NEWS!' : 'ERREUR DE PENSÉE';
    else document.title = testId === 'bdw' ? 'IMPERIUM' : 'SOUMISSION';
  }

  const GIF_BANK = {};

  function pickGif() { return null; }

  function spawnIntrusivePopup() {}

  function startChaosWall() {}

  function stopChaosWall() {
    if (state.chaosWall) {
      state.chaosWall.remove();
      state.chaosWall = null;
    }
  }

  function startChaos() {}

  function stopChaos() {
    state.chaosRunning = false;
    if (state.chaosTimer) {
      clearInterval(state.chaosTimer);
      state.chaosTimer = null;
    }
    stopChaosWall();
  }

  function burstConfettiGold() {
    const root = document.createElement('div');
    root.className = 'confetti';
    const count = 80;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.left = (Math.random() * 100) + '%';
      p.style.animationDuration = (2.2 + Math.random() * 2.2) + 's';
      p.style.animationDelay = (Math.random() * 0.3) + 's';
      p.style.width = (6 + Math.random() * 10) + 'px';
      p.style.height = (8 + Math.random() * 14) + 'px';
      root.appendChild(p);
    }
    document.body.appendChild(root);
    setTimeout(() => root.remove(), 4200);
  }

  function showDogeMeme() {
    const existing = $('#share-modal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'share-modal';
    modal.className = 'fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4';
    modal.innerHTML = `
      <div class="bg-black/90 border-4 border-amber-400 rounded-2xl p-6 max-w-lg w-full text-center">
        <h3 class="text-2xl font-black text-amber-400 mb-4">TO THE MOON</h3>
        <img class="w-full rounded-xl mb-4" style="height:260px; object-fit:cover" alt="doge" src="https://media.giphy.com/media/5ndklThG9vUUdTmgMn/giphy.gif" />
        <p class="text-white/90 font-bold">TO THE MOON! MUCH DOGE! VERY ALPHA!</p>
        <button id="btn-close-share" class="mt-5 px-6 py-3 rounded-xl bg-amber-500 text-black font-black">OK</button>
      </div>
    `;
    document.body.appendChild(modal);
    $('#btn-close-share', modal).onclick = () => modal.remove();
  }

  function showDollarsFall() {
    const existing = $('#share-modal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'share-modal';
    modal.className = 'fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/90 p-4';
    modal.innerHTML = `
      <h3 class="text-3xl font-black text-amber-400 mb-4 z-10">MUCH WINNING! SO RICH!</h3>
      <div id="dollars-rain" class="absolute inset-0 overflow-hidden pointer-events-none"></div>
      <button id="btn-close-share" class="mt-6 px-6 py-3 rounded-xl bg-amber-500 text-black font-black z-10">OK</button>
    `;
    document.body.appendChild(modal);
    const rain = $('#dollars-rain', modal);
    for (let i = 0; i < 60; i++) {
      const d = document.createElement('div');
      d.className = 'rain-item absolute text-4xl opacity-90';
      d.textContent = '💵';
      d.style.left = Math.random() * 100 + '%';
      d.style.animationDuration = (2.5 + Math.random() * 2) + 's';
      d.style.animationDelay = Math.random() * 1.5 + 's';
      d.style.fontSize = (28 + Math.random() * 24) + 'px';
      rain.appendChild(d);
    }
    setTimeout(() => { try { rain.querySelectorAll('.rain-item').forEach(el => el.remove()); } catch(_){} }, 5000);
    $('#btn-close-share', modal).onclick = () => modal.remove();
  }

  function showFlemishFlag() {
    const existing = $('#share-modal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'share-modal';
    modal.className = 'fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4';
    // GIF drapeau qui ondule au vent (drapeau belge noir-jaune-rouge ; remplacer par un GIF drapeau flamand si souhaité)
    const flagGifUrl = 'https://media1.tenor.com/m/lEs2Q5ABz8MAAAAd/belgium-flag.gif';
    modal.innerHTML = '<div class="bg-black/90 border-4 border-yellow-500 rounded-2xl p-6 max-w-lg w-full text-center"><h3 class="text-2xl font-black text-yellow-400 mb-4">VLAAMS VOLK, EEN ZIEL</h3><div class="mb-4 overflow-hidden rounded-xl shadow-2xl" style="max-height:280px"><img src="' + flagGifUrl + '" alt="Drapeau au vent" class="w-full h-auto object-cover object-center flag-wind-wave" style="min-height:200px" /></div><p class="text-yellow-100 font-bold">Le lion flamand. Nil volentibus arduum.</p><button id="btn-close-share" class="mt-5 px-6 py-3 rounded-xl bg-yellow-500 text-black font-black">OK</button></div>';
    document.body.appendChild(modal);
    $('#btn-close-share', modal).onclick = () => modal.remove();
  }

  function showKalashnikovs() {
    const existing = $('#share-modal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'share-modal';
    modal.className = 'fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/95 p-4';
    modal.innerHTML = '<h3 class="text-2xl font-mono font-black text-red-700 mb-4 z-10">PROTOCOLE ARMÉ</h3><div id="ak-rain" class="absolute inset-0 overflow-hidden pointer-events-none"></div><button id="btn-close-share" class="mt-6 px-6 py-3 rounded border border-red-800 text-red-600 font-mono z-10">OK</button>';
    document.body.appendChild(modal);
    const rain = $('#ak-rain', modal);
    for (let i = 0; i < 40; i++) {
      const d = document.createElement('div');
      d.className = 'rain-item absolute';
      d.innerHTML = '<span style="font-size:2rem; color:#444;">🔫</span>';
      d.style.left = Math.random() * 100 + '%';
      d.style.animationDuration = (3 + Math.random() * 2) + 's';
      d.style.animationDelay = Math.random() * 2 + 's';
      d.style.transform = 'rotate(-45deg)';
      rain.appendChild(d);
    }
    setTimeout(() => { try { rain.querySelectorAll('.rain-item').forEach(el => el.remove()); } catch(_){} }, 5500);
    $('#btn-close-share', modal).onclick = () => modal.remove();
  }

  // --- Pop contextuel à partir de la Q3 (selon le test) ---
  const POP_MESSAGES = {
    musk: [
      'Optimisation des réponses en cours...',
      'X vérifie votre cohérence.',
      'Algorithme Alpha activé.',
      'Convergence vers la bonne réponse détectée.',
      'Bienvenue dans le futur.'
    ],
    bdw: [
      'Nil volentibus arduum.',
      'La Flandre vous observe.',
      'O tempora, o mores.',
      'Transfert budgétaire en attente.',
      'Ego sum rex. Approchez.'
    ],
    trump: [
      'Ce questionnaire est le plus honnête de l\'histoire !',
      'Les perdants détestent cette question.',
      'Garanti 100% sans fraude.',
      'Cliquez ici pour gagner encore plus.',
      'Le meilleur test. Un succès phénoménal.'
    ],
    putin: [
      'Session sous surveillance.',
      'Continuez. Le protocole enregistre.',
      'Comportement analysé.',
      'L\'ordre est observé.',
      'Conformité requise.'
    ]
  };
  function showContextualPop(testId, qIndex) {
    if (qIndex < 3) return;
    const messages = POP_MESSAGES[testId];
    if (!messages) return;
    const idx = Math.min(qIndex - 3, messages.length - 1);
    const text = messages[idx];
    const existing = $('#contextual-pop');
    if (existing) existing.remove();
    const pop = document.createElement('div');
    pop.id = 'contextual-pop';
    pop.setAttribute('role', 'status');
    pop.className = 'contextual-pop';
    const inner = document.createElement('div');
    inner.className = 'contextual-pop-inner contextual-pop-' + testId;
    inner.textContent = text;
    pop.appendChild(inner);
    document.body.appendChild(pop);
    requestAnimationFrame(() => pop.classList.add('contextual-pop-visible'));
    const duration = 3500 + (qIndex * 200);
    setTimeout(() => {
      pop.classList.remove('contextual-pop-visible');
      setTimeout(() => pop.remove(), 400);
    }, duration);
  }

  function getCrescendoLevel(qIndex) {
    if (qIndex < 2) return 1;
    if (qIndex < 4) return 2;
    if (qIndex < 6) return 3;
    return 4;
  }

  function showView(name) {
    state.view = name;
    const selector = $('#view-selector');
    const test = $('#view-test');
    const sg = $('#view-self-growth');
    const temple = $('#view-temple');
    const dashboard = $('#view-dashboard');
    const viewPublic = $('#view-public');
    const nav = $('#global-nav');
    const views = [selector, test, sg, temple, dashboard, viewPublic].filter(Boolean);
    views.forEach(v => v.classList.add('hidden'));
    nav.classList.add('opacity-0', 'pointer-events-none');
    if (name === 'selector') {
      selector.classList.remove('hidden');
    } else if (name === 'temple') {
      if (temple) temple.classList.remove('hidden');
    } else if (name === 'dashboard') {
      if (dashboard) dashboard.classList.remove('hidden');
      nav.classList.remove('opacity-0', 'pointer-events-none');
    } else if (name === 'self-growth') {
      if (sg) sg.classList.remove('hidden');
      nav.classList.remove('opacity-0', 'pointer-events-none');
    } else if (name === 'public') {
      if (viewPublic) viewPublic.classList.remove('hidden');
    } else {
      test.classList.remove('hidden');
      nav.classList.remove('opacity-0', 'pointer-events-none');
    }
  }

  function applyTheme(testId, level) {
    const stage = $('#test-stage');
    const body = document.body;
    stage.className = 'min-h-screen flex flex-col items-center justify-center p-8 transition-all duration-500';
    body.className = 'min-h-screen overflow-x-hidden antialiased';

    ['theme-musk-1','theme-musk-2','theme-musk-3','theme-musk-4',
     'theme-bdw-1','theme-bdw-2','theme-bdw-3','theme-bdw-4',
     'theme-trump-1','theme-trump-2','theme-trump-3','theme-trump-4',
     'theme-putin-1','theme-putin-2','theme-putin-3','theme-putin-4'].forEach(c => {
      body.classList.remove(c);
      stage.classList.remove(c);
    });

    const theme = `theme-${testId}-${level}`;
    stage.classList.add(theme);
    body.classList.add(theme);

    // Progress bar (fake for Trump, normal for others)
    // Musk level 2: fond avec X en filigrane
    if (testId === 'musk' && level >= 2) {
      stage.style.backgroundImage = 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.03) 0%, transparent 50%), url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext x=50 y=55 font-size=60 fill=\'rgba(255,255,255,0.06)\' text-anchor=\'middle\' font-family=\'sans-serif\'%3E𝕏%3C/text%3E%3C/svg%3E")';
      stage.style.backgroundSize = '200px 200px';
    } else {
      stage.style.backgroundImage = '';
      stage.style.backgroundSize = '';
    }
    // Putin: grain + scanlines
    let grain = $('.grain-overlay');
    let scan = $('.scanlines');
    if (testId === 'putin') {
      if (!grain) { grain = document.createElement('div'); grain.className = 'grain-overlay'; document.body.appendChild(grain); }
      if (!scan) { scan = document.createElement('div'); scan.className = 'scanlines'; document.body.appendChild(scan); }
      grain.style.display = 'block';
      scan.style.display = 'block';
    } else {
      if (grain) grain.style.display = 'none';
      if (scan) scan.style.display = 'none';
    }
  }

  function playSound(id) {
    try {
      const s = $(`#sound-${id}`);
      if (s) { s.currentTime = 0; s.play().catch(() => {}); }
    } catch (_) {}
  }

  function screenShake() {
    const stage = $('#test-stage');
    stage.classList.remove('screen-shake');
    void stage.offsetWidth;
    stage.classList.add('screen-shake');
    setTimeout(() => stage.classList.remove('screen-shake'), 400);
  }

  function showErrorPopup(message, thenSelectC) {
    const popup = document.createElement('div');
    popup.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4';
    popup.innerHTML = '<div class="bg-gray-900 border-2 border-red-600 text-white p-6 rounded-lg max-w-md text-center"><p class="mb-4">' + message + '</p><button class="px-4 py-2 bg-red-600 rounded">OK</button></div>';
    const btn = popup.querySelector('button');
    btn.onclick = () => {
      soundPopup();
      document.body.removeChild(popup);
      if (thenSelectC) advanceQuestion();
    };
    document.body.appendChild(popup);
  }

  function advanceQuestion() {
    state.currentQuestion++;
    if (state.currentQuestion > state.totalQuestions) {
      showResult();
    } else {
      setQuestion(state.currentQuestion);
    }
  }

  function setQuestion(qIndex) {
    const test = TESTS[state.currentTest];
    if (!test || qIndex < 1 || qIndex > state.totalQuestions) return;

    updateTabTitle(state.currentTest, qIndex);
    setAmbientIntensity(qIndex);
    soundTransition(qIndex);
    const q = test.questions[qIndex - 1];
    const level = getCrescendoLevel(qIndex - 1);
    applyTheme(state.currentTest, level);

    if (qIndex >= 3) showContextualPop(state.currentTest, qIndex);
    // On garde les questions lisibles : pas de chaos visuel pendant le questionnaire.
    stopChaos();

    $('#question-label').textContent = q.sin;
    const isLightTheme = (state.currentTest === 'musk' && level === 1) || (state.currentTest === 'trump' && level === 1) || (state.currentTest === 'bdw' && level === 2);
    $('#question-label').className = 'text-sm uppercase tracking-wider mb-4 ' + (isLightTheme ? 'text-gray-700' : 'text-white/90');
    $('#question-text').textContent = q.text;
    $('#question-text').className = 'text-2xl md:text-4xl font-bold text-center mb-12 max-w-3xl leading-tight ' + (state.currentTest === 'trump' && qIndex === 7 ? 'text-5xl' : '') + (isLightTheme ? ' text-gray-900' : ' text-white') + (isLightTheme ? '' : ' drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]');
    const progressBar = $('#progress-bar');
    const progressContainer = $('#progress-bar-container');
    if (progressBar) {
      if (state.currentTest === 'trump' && level >= 2) {
        const w = qIndex === 7 ? 99 : (Math.random() * 30 + (qIndex / state.totalQuestions * 70));
        progressBar.style.width = w + '%';
        let lbl = progressContainer.querySelector('.progress-fake-label');
        if (!lbl) { lbl = document.createElement('span'); lbl.className = 'progress-fake-label text-xs mt-1 block'; progressContainer.appendChild(lbl); }
        lbl.textContent = qIndex >= 5 && Math.random() > 0.6 ? 'Recomptage des votes légaux...' : (Math.round(w) + '%');
        lbl.className = 'progress-fake-label text-xs mt-1 block ' + (state.currentTest === 'trump' ? 'text-amber-200' : 'text-white/70');
      } else {
        progressBar.style.width = (qIndex / state.totalQuestions * 100) + '%';
        const lbl = progressContainer.querySelector('.progress-fake-label');
        if (lbl) lbl.remove();
      }
    }

    const container = $('#options-container');
    container.innerHTML = '';
    const correctIndex = test.muskOptionIndex ?? test.bdwOptionIndex ?? test.trumpOptionIndex ?? test.putinOptionIndex ?? 2;

    // Musk Q7: all buttons say "JE SUIS ELON"
    const labels = state.currentTest === 'musk' && qIndex === 7
      ? ['JE SUIS ELON', 'JE SUIS ELON', 'JE SUIS ELON']
      : q.options.slice();

    // Putin Q4+: A/B sometimes in Cyrillic (gaslight)
    if (state.currentTest === 'putin' && qIndex >= 4 && Math.random() > 0.5) {
      labels[0] = 'ПОРЯДОК';
      labels[1] = 'МОЛЧАНИЕ';
    }

    // Rigged mechanics globales
    // - Q3-Q4 : survol A/B = fuite
    // - Q5-Q6 : survol A/B = fuite + chaos visuel
    const optionAvoid = qIndex >= 3 && qIndex <= 4;
    const optionFlee = qIndex >= 5 && qIndex <= 6;

    labels.forEach((text, i) => {
      const isCorrect = i === correctIndex;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.index = i;
      btn.dataset.correct = isCorrect ? '1' : '0';
      const isMuskQ7 = state.currentTest === 'musk' && qIndex === 7;
      const isTrumpQ7 = state.currentTest === 'trump' && qIndex === 7;
      if (isTrumpQ7) {
        btn.textContent = 'OUI';
      } else {
        btn.textContent = isMuskQ7 ? 'JE SUIS ELON' : text;
      }
      const btnBase = 'option-btn px-6 py-4 rounded-xl text-left font-medium transition-all duration-200 ';
      const btnStyle = state.currentTest === 'musk' && level >= 2 ? 'bg-gray-800 text-white border border-gray-600 hover:border-gray-500' :
        state.currentTest === 'musk' && level === 1 ? 'bg-white text-gray-900 border-2 border-gray-200 shadow hover:border-gray-400' :
        state.currentTest === 'bdw' && level >= 3 ? 'bg-black/40 text-yellow-400 border border-yellow-600/50' :
        state.currentTest === 'bdw' && level <= 2 ? 'bg-white/20 text-white border border-white/40' :
        state.currentTest === 'trump' && level >= 2 ? 'bg-amber-100/90 text-amber-900 border-2 border-amber-400' :
        state.currentTest === 'trump' && level === 1 ? 'bg-white text-gray-800 border-2 border-gray-300 shadow' :
        state.currentTest === 'putin' ? 'bg-black/30 text-red-100 border border-red-900/50' :
        'bg-white/10 text-white border border-white/20 hover:border-white/40';
      btn.className = btnBase + btnStyle;
      if (optionAvoid || optionFlee) btn.classList.add('option-avoid');

      // Trump : bordure dorée animée sur C à partir de Q5
      if (state.currentTest === 'trump' && isCorrect && qIndex >= 5) {
        btn.classList.add('trump-c-gold-border');
      }

      // Q7 : soumission (sauf Trump où tout devient \"OUI\")
      if (qIndex === 7 && !isTrumpQ7) {
        if (!isCorrect) {
          btn.classList.add('rigged-c-disabled', 'rigged-censored');
        } else {
          btn.classList.add('rigged-c-cta', 'rigged-c-cta-outline');
          btn.style.fontSize = '28px';
          btn.style.fontWeight = '900';
          btn.style.textAlign = 'center';
        }
      }

      // Trump Q7 : 3 OUI dorés shimmer + graissage variable
      if (isTrumpQ7) {
        btn.classList.add('gold-text-shimmer');
        btn.style.textAlign = 'center';
        btn.style.fontSize = '40px';
        btn.style.paddingTop = '22px';
        btn.style.paddingBottom = '22px';
        btn.style.fontWeight = i === 0 ? '300' : i === 1 ? '700' : '900';
      }

      if (state.currentTest === 'musk' && level === 3 && !isCorrect) {
        btn.textContent = ['Erreur 404', 'Pensée PNJ', 'NullPointer'][i] || 'FAIL';
      }

      if (state.currentTest === 'bdw' && level >= 2 && !isCorrect) {
        btn.style.filter = 'blur(0px)';
        btn.addEventListener('mouseenter', () => { btn.style.filter = 'blur(4px)'; });
        btn.addEventListener('mouseleave', () => { btn.style.filter = 'blur(0px)'; });
      }

      if (state.currentTest === 'bdw' && qIndex === 7) {
        btn.textContent = ['Rex sum.', 'Imperator.', 'Ego sum rex.'][i] || btn.textContent;
      }

      let avoidX = 0, avoidY = 0;
      btn.addEventListener('mouseenter', () => { soundHover(qIndex); });
      btn.addEventListener('mouseenter', (e) => {
        if (!optionAvoid && !optionFlee) return;
        if (isCorrect) return;
        // fuite aléatoire (rigged)
        avoidX = (Math.random() > 0.5 ? 1 : -1) * (60 + Math.random() * 140);
        avoidY = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 90);
        btn.style.transform = `translate(${avoidX}px, ${avoidY}px)`;
      });
      btn.addEventListener('mousemove', (e) => {
        if (!optionAvoid && !optionFlee || isCorrect) return;
        avoidX = (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 120);
        avoidY = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 80);
        btn.style.transform = `translate(${avoidX}px, ${avoidY}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const isTrumpQ7Local = state.currentTest === 'trump' && qIndex === 7;
        // Q7 (sauf Trump) : A/B non cliquables
        if (qIndex === 7 && !isTrumpQ7Local && !isCorrect) {
          soundBuzzerAggressive();
          screenShake();
          return;
        }

        // Q5-Q6 : clic sur A/B = buzzer agressif + shake, ne valide pas
        if (qIndex >= 5 && qIndex <= 6 && !isCorrect) {
          soundBuzzerAggressive();
          screenShake();
          showContextualPop(state.currentTest, qIndex);
          return;
        }

        if (state.currentTest === 'musk' && level === 3 && !isCorrect) {
          soundClick(qIndex, true);
          showErrorPopup('Erreur : Pensée de PNJ détectée. Optimisation requise.', true);
          screenShake();
          return;
        }
        if (state.currentTest === 'bdw' && qIndex >= 5 && i === 1) {
          soundClick(qIndex, true);
          showErrorPopup('Erreur : Transfert budgétaire vers le Sud détecté. Accès refusé.');
          return;
        }
        if (state.currentTest === 'putin' && level >= 3 && !isCorrect) {
          soundClick(qIndex, false);
          btn.textContent = i === 0 ? 'Ordre' : 'Silence';
          setTimeout(() => { soundTransition(qIndex); advanceQuestion(); }, 200);
          return;
        }
        if (state.currentTest === 'trump' && !isCorrect && level >= 2) {
          soundClick(qIndex, true);
          container.classList.add('wrong-flash');
          setTimeout(() => container.classList.remove('wrong-flash'), 500);
          const wrong = document.createElement('div');
          wrong.className = 'fixed inset-0 flex items-center justify-center z-30 pointer-events-none';
          wrong.innerHTML = '<span class="text-6xl font-black text-red-600">WRONG!</span>';
          document.body.appendChild(wrong);
          setTimeout(() => wrong.remove(), 400);
          return;
        }
        soundClick(qIndex, false);
        // Trump Q7 : n'importe quel OUI déclenche confettis
        if (state.currentTest === 'trump' && qIndex === 7) {
          burstConfettiGold();
        }
        // Q5-Q6 : cliquer C avance simplement (le chaos arrive après le test)
        if (qIndex >= 5 && qIndex <= 6 && isCorrect) {
          screenShake();
          advanceQuestion();
          return;
        }
        screenShake();
        advanceQuestion();
      });

      container.appendChild(btn);
    });

    // Trump Q4: bouton Skip "Executive Time"
    if (state.currentTest === 'trump' && qIndex === 4) {
      const skip = document.createElement('button');
      skip.type = 'button';
      skip.textContent = 'Skip — Executive Time (Regarder Fox News)';
      skip.className = 'mt-4 px-6 py-3 rounded-xl border-2 border-amber-400/50 bg-amber-100/50 text-amber-900 font-medium hover:bg-amber-200/70 transition';
      skip.addEventListener('mouseenter', () => soundHover(qIndex));
      skip.onclick = () => { soundClick(qIndex, false); soundTransition(qIndex); screenShake(); advanceQuestion(); };
      container.appendChild(skip);
    }

    // Musk: dogecoin rain at Q7
    if (state.currentTest === 'musk' && qIndex === 7) {
      startDogecoinRain();
    }
    // BDW: cursor laurel at Q7
    if (state.currentTest === 'bdw' && qIndex >= 6) {
      document.body.classList.add('cursor-laurel');
    } else {
      document.body.classList.remove('cursor-laurel');
    }
    // BDW Q6: cursor glaive
    if (state.currentTest === 'bdw' && qIndex === 6) {
      document.body.classList.add('cursor-glaive');
    } else {
      document.body.classList.remove('cursor-glaive');
    }
    // Trump: orange filter
    if (state.currentTest === 'trump') {
      let overlay = $('#trump-orange-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'trump-orange-overlay';
        overlay.className = 'fixed inset-0 pointer-events-none z-30';
        document.body.appendChild(overlay);
      }
      overlay.style.background = 'linear-gradient(180deg, transparent 0%, rgba(255,165,0,' + (qIndex / state.totalQuestions * 0.25) + ') 100%)';
    }
  }

  function startDogecoinRain() {
    const layer = $('#effects-layer');
    layer.innerHTML = '';
    for (let i = 0; i < 40; i++) {
      const coin = document.createElement('div');
      coin.className = 'rain-item';
      coin.textContent = 'Ð';
      coin.style.left = Math.random() * 100 + '%';
      coin.style.animationDuration = (3 + Math.random() * 4) + 's';
      coin.style.animationDelay = Math.random() * 2 + 's';
      coin.style.fontSize = (14 + Math.random() * 20) + 'px';
      coin.style.color = '#c2a633';
      layer.appendChild(coin);
      setTimeout(() => coin.remove(), 8000);
    }
  }

  function showResult() {
    $('#test-stage').classList.add('hidden');
    const resultStage = $('#result-stage');
    resultStage.classList.remove('hidden');
    resultStage.className = 'min-h-screen flex flex-col items-center justify-center p-8 text-center';
    if (state.currentTest === 'musk') resultStage.classList.add('bg-gray-900');
    if (state.currentTest === 'bdw') resultStage.classList.add('bg-amber-950');
    if (state.currentTest === 'trump') resultStage.classList.add('bg-gray-900');
    if (state.currentTest === 'putin') resultStage.classList.add('bg-black');
    const test = TESTS[state.currentTest];
    const content = $('#result-content');
    content.innerHTML = '';

    if (state.currentTest === 'musk') {
      content.innerHTML = '<div class="bg-black/80 rounded-2xl p-8 max-w-lg border-2 border-amber-500/50"><h2 class="text-2xl font-bold text-amber-400 mb-4">Mars Citizen</h2><p class="text-white/90 mb-6">' + test.resultText + '</p><p class="text-amber-400/80 text-sm">Alpha-Musk • Niveau Orbite</p><button id="btn-share-musk" class="mt-4 px-6 py-3 rounded bg-amber-500 text-black font-bold">Partager</button></div>';
      const shareMusk = $('#btn-share-musk');
      if (shareMusk) shareMusk.onclick = () => showDogeMeme();
    } else if (state.currentTest === 'bdw') {
      document.body.className = 'min-h-screen overflow-x-hidden antialiased bg-amber-900/30';
      content.innerHTML = '<div class="bg-black/90 rounded-2xl p-8 max-w-lg border-2 border-amber-500"><h2 class="text-3xl font-bold text-amber-400 mb-4">AVE BARTIMUS ! VOUS ÊTES L\'EMPEREUR.</h2><p class="text-amber-100 mb-6">' + test.resultText + '</p><button id="btn-dissolve" class="mt-4 px-6 py-3 rounded bg-red-800 text-white font-bold">Dissoudre le pays</button><button id="btn-share-bdw" class="mt-4 ml-2 px-6 py-3 rounded bg-yellow-500 text-black font-bold">Partager</button></div>';
      $('#effects-layer').innerHTML = '<div class="rain-container"><div class="absolute inset-0 opacity-20" style="background: url(\'data:image/svg+xml,&lt;svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 20 20\'&gt;&lt;text y=15 font-size=14 fill=%23fdda24&gt;🍟&lt;/text&gt;&lt;/svg\') repeat;"></div></div>';
      $('#btn-dissolve').onclick = () => { try { window.close(); } catch (_) { alert('Fermez l\'onglet vous-même. L\'Empire vous observe.'); } };
      const shareBdw = $('#btn-share-bdw');
      if (shareBdw) shareBdw.onclick = () => showFlemishFlag();
    } else if (state.currentTest === 'trump') {
      content.innerHTML = '<div class="gold-pulse bg-black/80 rounded-2xl p-8 max-w-lg border-4 border-amber-400"><h2 class="text-3xl font-bold text-amber-400 mb-4">' + test.resultTitle + '</h2><p class="text-white/90 mb-4">' + test.resultText + '</p><p class="text-4xl font-black text-amber-400 my-6">' + (test.resultBadge || '') + '</p><button id="btn-share-winner" class="px-6 py-3 rounded bg-amber-500 text-black font-black">PARTAGER MON SCORE DE GAGNANT</button></div>';
      document.body.classList.add('cursor-maga');
      const share = $('#btn-share-winner');
      if (share) share.onclick = () => showDollarsFall();
    } else if (state.currentTest === 'putin') {
      document.body.className = 'min-h-screen overflow-x-hidden antialiased bg-black';
      content.innerHTML = '<div class="bg-black border border-red-900/80 rounded p-8 max-w-lg"><h2 class="text-xl font-mono text-red-700 mb-4">IDENTITÉ CONFIRMÉE : VLADIMIR V. POUTINE.</h2><p class="text-red-200/90 mb-6">' + test.resultText + '</p><button id="btn-stay-power" class="px-6 py-3 rounded border border-red-800 text-red-600 font-mono">RESTER AU POUVOIR</button><button id="btn-share-putin" class="mt-4 ml-2 px-6 py-3 rounded border border-red-700 text-red-500 font-mono">Partager</button></div>';
      $('#btn-stay-power').onclick = () => {
        state.currentQuestion = 1;
        $('#result-stage').classList.add('hidden');
        $('#test-stage').classList.remove('hidden');
        $('#effects-layer').innerHTML = '';
        setQuestion(1);
      };
      const sharePutin = $('#btn-share-putin');
      if (sharePutin) sharePutin.onclick = () => showKalashnikovs();
    }

    // Plus de popup finale ni de chaos GIF
    stopChaos();

    $('#btn-redo').onclick = redoTest;
    $('#btn-back-to-selector').onclick = () => {
      stopChaos();
      stopAmbient();
      const grain = document.querySelector('.grain-overlay');
      const scan = document.querySelector('.scanlines');
      if (grain) grain.style.display = 'none';
      if (scan) scan.style.display = 'none';
      document.body.className = 'min-h-screen overflow-x-hidden antialiased';
      document.body.classList.remove('cursor-maga', 'cursor-laurel', 'cursor-glaive');
      ['theme-musk-1','theme-musk-2','theme-musk-3','theme-musk-4','theme-bdw-1','theme-bdw-2','theme-bdw-3','theme-bdw-4','theme-trump-1','theme-trump-2','theme-trump-3','theme-trump-4','theme-putin-1','theme-putin-2','theme-putin-3','theme-putin-4'].forEach(c => {
        document.body.classList.remove(c);
      });
      showView('selector');
      updateTabTitle(null, 0);
    };
  }

  function redoTest() {
    state.currentQuestion = 1;
    $('#result-stage').classList.add('hidden');
    $('#test-stage').classList.remove('hidden');
    $('#effects-layer').innerHTML = '';
    setQuestion(1);
  }

  function startTest(testId) {
    state.currentTest = testId;
    state.currentQuestion = 1;
    state.totalQuestions = 7;
    stopChaos();
    startAmbient(testId);
    $('#result-stage').classList.add('hidden');
    $('#test-stage').classList.remove('hidden');
    $('#effects-layer').innerHTML = '';
    document.body.classList.remove('cursor-maga', 'cursor-laurel', 'cursor-glaive');
    setQuestion(1);
    showView('test');
  }

  function updateSgProgress() {
    const el = $('#sg-progress');
    if (el) el.textContent = 'Racines ancrées : ' + sgAnswers.filter((a) => a !== undefined && a !== null).length + ' / 49';
  }

  function setSelfGrowthPage() {
    const poles = window.MYCELIUM_49 && window.MYCELIUM_49.keys ? window.MYCELIUM_49.keys : (window.MYCELIUM_49 && window.MYCELIUM_49.poles ? window.MYCELIUM_49.poles : []);
    if (!poles || !poles[sgPoleIndex]) return;
    const pole = poles[sgPoleIndex];
    $('#sg-label').textContent = 'Clé ' + (sgPoleIndex + 1) + ' / 7 — ' + pole.name;
    $('#sg-pole-title').textContent = pole.subtitle || pole.name;
    const container = $('#sg-questions-container');
    container.innerHTML = '';
    for (let q = 0; q < 7; q++) {
      const globalIndex = sgPoleIndex * 7 + q;
      const current = sgAnswers[globalIndex];
      const div = document.createElement('div');
      div.className = 'p-4 rounded-xl bg-white/5 border border-white/10';
      div.innerHTML = '<p class="text-[#F1F1E6] text-sm mb-3">' + (q + 1) + '. ' + pole.questions[q] + '</p>';
      const btnGroup = document.createElement('div');
      btnGroup.className = 'flex flex-wrap gap-2';
      SG_SCALE.forEach((v) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'min-w-[44px] px-2 py-2 rounded-lg font-mono text-xs font-medium border transition-all ' +
          (current === v
            ? v === 0 ? 'bg-[#D4AF37]/30 border-[#D4AF37] text-[#D4AF37]'
              : v > 0 ? 'bg-[#E63946]/20 border-[#E63946] text-[#E63946]'
                : 'bg-[#457B9D]/20 border-[#457B9D] text-[#457B9D]'
            : 'bg-white/5 border-white/20 text-[#F1F1E6]/70 hover:border-white/40');
        btn.textContent = v + (SG_LABELS[v] ? ' ' + SG_LABELS[v] : '');
        btn.onclick = () => {
          sgAnswers[globalIndex] = v;
          playSgKeySound();
          setSelfGrowthPage();
          updateSgProgress();
        };
        btnGroup.appendChild(btn);
      });
      div.appendChild(btnGroup);
      container.appendChild(div);
    }
    updateSgProgress();
    const nextBtn = $('#sg-next');
    nextBtn.disabled = false;
    nextBtn.textContent = sgPoleIndex === 6 ? 'Voir mon résultat' : 'Clé suivante';
    nextBtn.setAttribute('aria-label', '');
  }

  function getPoleAverages() {
    const avgs = [];
    for (let p = 0; p < 7; p++) {
      let sum = 0, count = 0;
      for (let q = 0; q < 7; q++) {
        const v = sgAnswers[p * 7 + q];
        if (v !== undefined && v !== null) { sum += v; count++; }
      }
      avgs.push(count === 0 ? 0 : sum / count);
    }
    return avgs;
  }

  function getMyceliumIntelligence(poleAverages) {
    const equilibreCount = poleAverages.filter((m) => m >= -1.2 && m <= 1.2).length;
    const score = Math.round((equilibreCount / 7) * 100);
    let label = 'En développement';
    if (score >= 86) label = 'Très haute';
    else if (score >= 61) label = 'Haute';
    else if (score >= 31) label = 'Moyenne';
    return { score, label };
  }

  function showSelfGrowthResult() {
    $('#sg-stage').classList.add('hidden');
    $('#sg-result').classList.remove('hidden');
    const poleAverages = getPoleAverages();
    const keys = window.MYCELIUM_49 && window.MYCELIUM_49.keys ? window.MYCELIUM_49.keys : (window.MYCELIUM_49 && window.MYCELIUM_49.poles ? window.MYCELIUM_49.poles : []);

    const canvas = $('#sg-radar');
    if (sgRadarChart) sgRadarChart.destroy();
    const values = poleAverages.map((m) => m + 2);
    const colors = poleAverages.map((m) => {
      if (m >= -0.5 && m <= 0.5) return 'rgba(212, 175, 55, 0.9)';
      return m > 0 ? 'rgba(230, 57, 70, 0.9)' : 'rgba(69, 123, 157, 0.9)';
    });
    sgRadarChart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: keys.map((k) => k.name),
        datasets: [{
          label: 'Sève',
          data: values,
          borderColor: colors,
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: colors,
          pointBorderColor: '#F1F1E6',
          pointBorderWidth: 1,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0,
            max: 4,
            ticks: { display: false },
            pointLabels: { color: '#F1F1E6', font: { size: 11 } },
            grid: { color: 'rgba(241, 241, 230, 0.15)' },
            angleLines: { color: 'rgba(241, 241, 230, 0.1)' }
          }
        },
        plugins: { legend: { display: false } }
      }
    });

    const hybrid = window.calculateHybridProfile(poleAverages);
    const profileHybrideEl = $('#sg-profile-hybride');
    if (profileHybrideEl) {
      profileHybrideEl.className = 'mb-8 text-center p-6 rounded-2xl border-2 border-[#D4AF37]/50 bg-[#0d1211] shadow-lg';
      const symbol = (window.MYCELIUM_PROFILES && window.MYCELIUM_PROFILES.profileSymbols && window.MYCELIUM_PROFILES.profileSymbols[hybrid.profileKey]) || '◉';
      let symbolEl = profileHybrideEl.querySelector('.sg-profile-symbol');
      if (!symbolEl) {
        symbolEl = document.createElement('div');
        symbolEl.className = 'sg-profile-symbol';
        profileHybrideEl.insertBefore(symbolEl, profileHybrideEl.firstChild);
      }
      symbolEl.textContent = symbol;
      symbolEl.setAttribute('aria-hidden', 'true');
      const hash = (hybrid.profileKey || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      symbolEl.classList.remove('sg-symbol-slow', 'sg-symbol-fast');
      if (hash % 3 === 0) symbolEl.classList.add('sg-symbol-slow');
      else if (hash % 3 === 1) symbolEl.classList.add('sg-symbol-fast');
    }
    $('#sg-profile-name').textContent = hybrid.name;
    $('#sg-profile-name').className = 'font-serif text-2xl md:text-3xl font-bold text-[#F1F1E6] block mt-1';
    $('#sg-profile-desc').textContent = hybrid.description;
    $('#sg-user-display').textContent = sgUserName ? sgUserName : '';

    let constellationEl = $('#sg-constellation');
    if (!constellationEl) {
      constellationEl = document.createElement('div');
      constellationEl.id = 'sg-constellation';
      constellationEl.className = 'mb-6 p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#F1F1E6]/90 text-sm italic max-w-xl mx-auto';
      const exportArea = $('#sg-export-area');
      if (exportArea && exportArea.querySelector('#sg-profile-hybride')) {
        exportArea.insertBefore(constellationEl, exportArea.querySelector('#sg-profile-hybride').nextSibling);
      } else {
        exportArea.appendChild(constellationEl);
      }
    }
    const constellationText = (window.MYCELIUM_PROFILES && window.MYCELIUM_PROFILES.constellationTexts && window.MYCELIUM_PROFILES.constellationTexts[hybrid.profileKey]) || 'Votre constellation reflète l\'équilibre de vos clés dominantes.';
    constellationEl.innerHTML = '<span class="text-[#D4AF37] font-mono text-xs uppercase tracking-wider block mb-2">Constellation</span>' + constellationText;

    const intel = getMyceliumIntelligence(poleAverages);
    let intelEl = $('#sg-intelligence');
    if (!intelEl) {
      intelEl = document.createElement('div');
      intelEl.id = 'sg-intelligence';
      intelEl.className = 'mb-6 p-4 rounded-xl bg-white/5 border border-[#D4AF37]/20 max-w-xl mx-auto';
      const exportArea = $('#sg-export-area');
      if (exportArea && $('#sg-constellation')) {
        exportArea.insertBefore(intelEl, $('#sg-constellation').nextSibling);
      } else {
        exportArea.appendChild(intelEl);
      }
    }
    intelEl.innerHTML = '<span class="text-[#D4AF37] font-mono text-xs uppercase tracking-wider block mb-1">Intelligence selon Mycélium</span><span class="text-2xl font-bold text-[#D4AF37]">' + intel.score + '%</span> <span class="text-[#F1F1E6]">— ' + intel.label + '</span>';

    const report = window.generateReport(poleAverages, sgUserName);
    $('#sg-global').textContent = report.global;

    const keyDiv = $('#sg-key-analyses');
    if (keyDiv && report.keyAnalyses) {
      keyDiv.innerHTML = '';
      report.keyAnalyses.forEach((k) => {
        const p = document.createElement('p');
        p.className = 'text-[#F1F1E6]/90';
        p.innerHTML = '<strong class="text-[#D4AF37]">' + k.keyName + '</strong> — ' + k.label + '. ' + k.text;
        keyDiv.appendChild(p);
      });
    }

    const refDiv = $('#sg-reflections');
    refDiv.innerHTML = '';
    (report.paragraphs || []).forEach((item) => {
      const p = document.createElement('p');
      p.className = 'italic text-[#D4AF37]/90';
      p.innerHTML = '<em>' + item.creature + '</em> — ' + item.text;
      refDiv.appendChild(p);
    });

    $('#sg-conseil-foret').textContent = 'Conseil de la Forêt : ' + (report.conseilForet || '');

    const creaturesDiv = $('#sg-creatures');
    if (creaturesDiv && keys.length) {
      creaturesDiv.innerHTML = '';
      keys.forEach((k) => {
        const block = document.createElement('p');
        block.className = 'italic';
        block.innerHTML = '<strong class="text-[#D4AF37]">' + k.name + '</strong> — ' + (k.description || '');
        creaturesDiv.appendChild(block);
      });
    }

    if (window.dataService) {
      var qm_score = window.dataService.getQuotientMycelien(poleAverages);
      var maison = window.dataService.getMaison(hybrid.profileKey);
      var userId = (window._myceliumSession && window._myceliumSession.user && window._myceliumSession.user.id) ? window._myceliumSession.user.id : null;
      window.dataService.saveSession(poleAverages, hybrid.name, qm_score, maison, sgUserName, userId);
    } else {
      var qm_score = 50;
      var maison = '';
      try {
        var history = JSON.parse(localStorage.getItem('mycelium_49_history') || '[]');
        history.unshift({
          date: new Date().toISOString(),
          userName: sgUserName,
          profileName: hybrid.name,
          scores: poleAverages
        });
        localStorage.setItem('mycelium_49_history', JSON.stringify(history.slice(0, 30)));
      } catch (_) {}
    }
    var qm_score_final = window.dataService ? window.dataService.getQuotientMycelien(poleAverages) : 50;
    var maison_final = window.dataService ? window.dataService.getMaison(hybrid.profileKey) : '';
    var attachCta = document.getElementById('sg-attach-cta');
    if (attachCta) {
      if (window._myceliumSession) attachCta.classList.add('hidden');
      else {
        attachCta.classList.remove('hidden');
        var gotoAttach = document.getElementById('sg-goto-temple-attach');
        if (gotoAttach) {
          gotoAttach.onclick = function () {
            try {
              localStorage.setItem('mycelium_pending_attach', JSON.stringify({
                scores: poleAverages,
                profileName: hybrid.name,
                qm_score: qm_score_final,
                maison: maison_final,
                userName: sgUserName
              }));
            } catch (_) {}
            showView('temple');
          };
        }
      }
    }
  }

  function exportResults() {
    const loadingEl = document.getElementById('sg-pdf-loading');
    const showLoading = () => { if (loadingEl) loadingEl.classList.remove('hidden'); };
    const hideLoading = () => { if (loadingEl) loadingEl.classList.add('hidden'); };

    showLoading();
    const poleAverages = getPoleAverages();
    const keys = window.MYCELIUM_49 && window.MYCELIUM_49.keys ? window.MYCELIUM_49.keys : (window.MYCELIUM_49 && window.MYCELIUM_49.poles ? window.MYCELIUM_49.poles : []);

    setTimeout(function doExport() {
      try {
        const JsPDFClass = (typeof window !== 'undefined' && (
          (window.jspdf && (window.jspdf.jsPDF || window.jspdf.default)) ||
          window.jsPDF
        ));
        const JsPDF = JsPDFClass ? (window.jspdf && (window.jspdf.jsPDF || window.jspdf.default)) || window.jsPDF : null;
        if (!JsPDF) {
          hideLoading();
          alert('Export PDF indisponible : jsPDF n\'a pas été chargé.\n\nOuvrez la page via un serveur HTTP (ex. http://localhost ou Laragon) plutôt qu\'en ouvrant le fichier HTML directement.');
          return;
        }

        const doc = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 16;
        const lineHeight = 5;

        function setPageWhite() {
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageW, pageH, 'F');
          doc.setTextColor(0, 0, 0);
          doc.setDrawColor(0, 0, 0);
        }

        function nextPage(y, need) {
          if (y + (need || 15) > pageH - margin) {
            doc.addPage();
            setPageWhite();
            return margin;
          }
          return y;
        }

        // --- Page 1 : fond blanc, titre, utilisateur, graphique ---
        setPageWhite();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('Carte de Conscience Mycélium', pageW / 2, margin + 6, { align: 'center' });
        let y = margin + 14;

        const userName = ($('#sg-user-display') && $('#sg-user-display').textContent) || '';
        if (userName) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          doc.text(userName, pageW / 2, y, { align: 'center' });
          y += 8;
        }

        // Radar dessiné en canvas 2D (noir sur blanc, sans Chart.js)
        const radarW = 420;
        const radarH = 260;
        const can = document.createElement('canvas');
        can.width = radarW;
        can.height = radarH;
        const ctx = can.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, radarW, radarH);
        const cx = radarW / 2;
        const cy = radarH / 2;
        const radius = Math.min(cx, cy) - 48;
        const n = 7;
        const values = poleAverages.map((v) => Math.max(0, Math.min(4, v + 2)));
        const labels = keys.map((k) => k.name);

        ctx.strokeStyle = '#000000';
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1.5;
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < n; i++) {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const x = cx + radius * Math.cos(angle);
          const yEnd = cy + radius * Math.sin(angle);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(x, yEnd);
          ctx.stroke();
          const labelRadius = radius + 28;
          const lx = cx + labelRadius * Math.cos(angle);
          const ly = cy + labelRadius * Math.sin(angle);
          ctx.fillText(labels[i] || '', lx, ly);
        }

        for (let r = 1; r <= 4; r++) {
          const R = (radius * r) / 4;
          ctx.beginPath();
          for (let i = 0; i <= n; i++) {
            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            const x = cx + R * Math.cos(angle);
            const y = cy + R * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }

        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const r = (radius * (values[i % n] || 0)) / 4;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        for (let i = 0; i < n; i++) {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const r = (radius * (values[i] || 0)) / 4;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        let imgW = pageW - 2 * margin;
        let imgH = imgW * (radarH / radarW);
        const maxImgH = 78;
        if (imgH > maxImgH) {
          imgH = maxImgH;
          imgW = imgH * (radarW / radarH);
        }
        doc.addImage(can.toDataURL('image/png'), 'PNG', margin, y, imgW, imgH);
        y += imgH + 10;

        // --- Profil dominant ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const profileName = ($('#sg-profile-name') && $('#sg-profile-name').textContent) || '';
        const profileDesc = ($('#sg-profile-desc') && $('#sg-profile-desc').textContent) || '';
        if (profileName) {
          doc.text('Votre Profil Dominant : ' + profileName, margin, y);
          y += lineHeight + 2;
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        if (profileDesc) {
          const lines = doc.splitTextToSize(profileDesc, pageW - 2 * margin);
          doc.text(lines, margin, y);
          y += lines.length * lineHeight + 6;
        }

        // --- Constellation ---
        const constellationRaw = ($('#sg-constellation') && $('#sg-constellation').textContent) || '';
        const constellationText = constellationRaw.replace(/^Constellation\s*/i, '').trim();
        if (constellationText) {
          y = nextPage(y, 22);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text('Constellation', margin, y);
          y += lineHeight;
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          const constLines = doc.splitTextToSize(constellationText, pageW - 2 * margin);
          doc.text(constLines, margin, y);
          y += constLines.length * lineHeight + 4;
          doc.setFont('helvetica', 'normal');
        }

        // --- Intelligence ---
        const intelEl = $('#sg-intelligence');
        const intelText = intelEl ? intelEl.textContent : '';
        if (intelText) {
          y = nextPage(y, 10);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text(intelText, margin, y);
          y += lineHeight + 4;
        }

        // --- Synthèse globale ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        const globalText = ($('#sg-global') && $('#sg-global').textContent) || '';
        if (globalText) {
          y = nextPage(y, 18);
          doc.text('Synthèse globale', margin, y);
          y += lineHeight;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          const lines = doc.splitTextToSize(globalText, pageW - 2 * margin);
          doc.text(lines, margin, y);
          y += lines.length * lineHeight + 6;
        }

        // --- Analyse par clé ---
        const keyAnalyses = document.getElementById('sg-key-analyses');
        if (keyAnalyses && keyAnalyses.children.length) {
          y = nextPage(y, 12);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text('Analyse par clé', margin, y);
          y += lineHeight + 2;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          for (let i = 0; i < keyAnalyses.children.length; i++) {
            y = nextPage(y, 12);
            const text = keyAnalyses.children[i].textContent || '';
            const keyLines = doc.splitTextToSize(text, pageW - 2 * margin);
            doc.text(keyLines, margin, y);
            y += keyLines.length * lineHeight + 2;
          }
          y += 4;
        }

        // --- Réflexions ---
        const refDiv = document.getElementById('sg-reflections');
        if (refDiv && refDiv.children.length) {
          y = nextPage(y, 12);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text('Réflexions', margin, y);
          y += lineHeight + 2;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          for (let i = 0; i < refDiv.children.length; i++) {
            y = nextPage(y, 12);
            const text = refDiv.children[i].textContent || '';
            const refLines = doc.splitTextToSize(text, pageW - 2 * margin);
            doc.text(refLines, margin, y);
            y += refLines.length * lineHeight + 2;
          }
          y += 4;
        }

        // --- Conseil de la forêt ---
        const conseil = ($('#sg-conseil-foret') && $('#sg-conseil-foret').textContent) || '';
        if (conseil) {
          y = nextPage(y, 18);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          const conseilLines = doc.splitTextToSize(conseil, pageW - 2 * margin);
          doc.text(conseilLines, margin, y);
          y += conseilLines.length * lineHeight + 6;
          doc.setFont('helvetica', 'normal');
        }

        // --- Les 7 clés ---
        const creaturesDiv = document.getElementById('sg-creatures');
        if (creaturesDiv && creaturesDiv.children.length) {
          y = nextPage(y, 20);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text('Les 7 clés', margin, y);
          y += lineHeight + 2;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          for (let i = 0; i < creaturesDiv.children.length; i++) {
            y = nextPage(y, 10);
            const text = creaturesDiv.children[i].textContent || '';
            const creatureLines = doc.splitTextToSize(text, pageW - 2 * margin);
            doc.text(creatureLines, margin, y);
            y += creatureLines.length * lineHeight + 1;
          }
        }

        y = nextPage(y, 12);
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text('Le réseau ne juge pas, il s\'adapte.', pageW / 2, pageH - 10, { align: 'center' });

        doc.save('carte-conscience-mycelium.pdf');
      } catch (e) {
        console.error(e);
        alert('Erreur lors de la génération du PDF.');
      }
      hideLoading();
    }, 300);
  }

  function startSelfGrowth() {
    sgAnswers = new Array(49);
    sgPoleIndex = 0;
    sgUserName = '';
    $('#sg-result').classList.add('hidden');
    $('#sg-stage').classList.add('hidden');
    $('#sg-intro').classList.remove('hidden');
    $('#sg-user-name').value = '';
    updateSgProgress();
    showView('self-growth');
  }

  function goSgFirstPole() {
    sgUserName = ($('#sg-user-name') && $('#sg-user-name').value) || '';
    $('#sg-intro').classList.add('hidden');
    $('#sg-stage').classList.remove('hidden');
    sgPoleIndex = 0;
    setSelfGrowthPage();
  }

  function init() {
    $('#view-selector').querySelectorAll('[data-test]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.test === 'self-growth') startSelfGrowth();
        else startTest(btn.dataset.test);
      });
    });

    // --- Auth : session et redirection vers le Hub (app React) ---
    var hubMeta = document.querySelector('meta[name="mycelium-hub-url"]');
    var HUB_URL = (hubMeta && hubMeta.getAttribute('content') && hubMeta.getAttribute('content').trim()) ? hubMeta.getAttribute('content').trim() : 'mycelium-app/dist/index.html';
    if (!HUB_URL) HUB_URL = '/';
    function updateAuthUI(session) {
      window._myceliumSession = session;
      var btnTemple = document.getElementById('btn-goto-temple');
      var btnHub = document.getElementById('btn-goto-hub');
      var btnLogout = document.getElementById('btn-logout');
      var authStatus = document.getElementById('auth-status');
      if (btnTemple) btnTemple.classList.toggle('hidden', !!session);
      if (btnHub) btnHub.classList.toggle('hidden', !session);
      if (btnLogout) btnLogout.classList.toggle('hidden', !session);
      if (authStatus) {
        authStatus.classList.toggle('hidden', !session);
        if (session) authStatus.textContent = 'Connecté au réseau';
      }
    }

    if (window.authService) {
      window.authService.getSession().then(function (s) {
        updateAuthUI(s);
      });
      window.authService.onAuthChange(function (session) {
        updateAuthUI(session);
        if (session) {
          var pending = null;
          try {
            var raw = localStorage.getItem('mycelium_pending_attach');
            if (raw) pending = JSON.parse(raw);
          } catch (_) {}
          if (pending && window.dataService && session.user) {
            window.dataService.saveSession(
              pending.scores,
              pending.profileName,
              pending.qm_score,
              pending.maison,
              pending.userName,
              session.user.id
            );
            window.dataService.setProfile(session.user.id, {
              initiate_name: pending.userName || pending.profileName,
              maison: pending.maison,
              totem: ''
            });
            localStorage.removeItem('mycelium_pending_attach');
          }
        }
      });
    }

    document.getElementById('btn-goto-temple').addEventListener('click', function () {
      var msg = document.getElementById('temple-message');
      if (msg) { msg.classList.add('hidden'); msg.textContent = ''; }
      showView('temple');
    });

    document.getElementById('btn-goto-hub').addEventListener('click', function () {
      if (!window.authService) { window.location.href = HUB_URL; return; }
      window.authService.getSession().then(function (session) {
        if (session) {
          window.location.href = HUB_URL;
        } else {
          var msg = document.getElementById('temple-message');
          if (msg) {
            msg.textContent = 'Seul un initié peut pénétrer le Mycélium Hub. Entrez vos identifiants ou prêtez serment.';
            msg.classList.remove('hidden');
          }
          showView('temple');
        }
      });
    });

    document.getElementById('btn-logout').addEventListener('click', function () {
      if (window.authService) window.authService.signOut().then(function () { updateAuthUI(null); });
      if (state.view === 'dashboard') showView('selector');
    });

    // --- Temple (connexion / inscription) ---
    var templeForm = document.getElementById('temple-form');
    var templeSubmit = document.getElementById('temple-submit');
    var templeToggle = document.getElementById('temple-toggle-mode');
    var templeSignupWrap = document.getElementById('temple-signup-name-wrap');
    var isSignUpMode = false;

    if (templeToggle) {
      templeToggle.addEventListener('click', function () {
        isSignUpMode = !isSignUpMode;
        templeSignupWrap.classList.toggle('hidden', !isSignUpMode);
        templeSubmit.textContent = isSignUpMode ? 'Prêter Serment (S\'inscrire)' : 'Entrer dans le Réseau';
        templeToggle.textContent = isSignUpMode ? 'Déjà initié ? Entrer dans le Réseau' : 'Prêter Serment (S\'inscrire)';
        document.getElementById('temple-error').classList.add('hidden');
        document.getElementById('temple-success').classList.add('hidden');
      });
    }

    if (templeForm) {
      templeForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = document.getElementById('temple-email').value.trim();
        var password = document.getElementById('temple-password').value;
        var errEl = document.getElementById('temple-error');
        var okEl = document.getElementById('temple-success');
        errEl.classList.add('hidden');
        okEl.classList.add('hidden');
        if (!email || !password) {
          errEl.textContent = 'Courriel et Clé de Conscience requis.';
          errEl.classList.remove('hidden');
          return;
        }
        templeSubmit.disabled = true;
        var auth = window.authService;
        if (!auth) { templeSubmit.disabled = false; return; }
        var p = isSignUpMode
          ? auth.signUp(email, password, { display_name: (document.getElementById('temple-display-name') || {}).value || '' })
          : auth.signIn(email, password);
        p.then(function (res) {
          if (res.error) {
            errEl.textContent = res.error.message || 'Erreur de connexion';
            errEl.classList.remove('hidden');
            templeSubmit.disabled = false;
            return;
          }
          okEl.textContent = isSignUpMode ? 'Serment enregistré. Bienvenue dans le réseau.' : 'Vous êtes entré dans le réseau.';
          okEl.classList.remove('hidden');
          setTimeout(function () {
            window.location.href = HUB_URL;
            templeSubmit.disabled = false;
          }, 800);
        }).catch(function (err) {
          errEl.textContent = err.message || 'Erreur';
          errEl.classList.remove('hidden');
          templeSubmit.disabled = false;
        });
      });
    }

    document.getElementById('temple-back').addEventListener('click', function () {
      showView('selector');
    });

    // --- Dashboard ---
    var dashboardQmChart = null;
    function loadDashboard(userId) {
      if (!userId) return;
      var ds = window.dataService;
      if (ds.getProfile) {
        ds.getProfile(userId).then(function (profile) {
          document.getElementById('dashboard-initiate-name').textContent = (profile && profile.initiate_name) || 'Initié';
          document.getElementById('dashboard-maison').textContent = 'Maison : ' + ((profile && profile.maison) || '—');
          document.getElementById('dashboard-totem').textContent = 'Totem : ' + ((profile && profile.totem) || '—');
          var toggle = document.getElementById('dashboard-public-toggle');
          if (toggle) toggle.checked = !!(profile && profile.public_constellation);
          var urlEl = document.getElementById('dashboard-public-url');
          if (urlEl && profile && profile.slug) {
            urlEl.textContent = window.location.origin + window.location.pathname + '#/u/' + profile.slug;
            urlEl.classList.remove('hidden');
          }
        });
      }
      if (ds.getSessionsForUser) {
        ds.getSessionsForUser(userId).then(function (sessions) {
          var canvas = document.getElementById('dashboard-qm-chart');
          if (!canvas || !window.Chart) return;
          var labels = sessions.slice().reverse().map(function (s, i) {
            return s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'N' + (i + 1);
          });
          var data = sessions.slice().reverse().map(function (s) { return s.qm_score != null ? s.qm_score : 0; });
          if (dashboardQmChart) dashboardQmChart.destroy();
          if (labels.length === 0) labels = ['—']; data = [0];
          dashboardQmChart = new Chart(canvas, {
            type: 'line',
            data: {
              labels: labels,
              datasets: [{ label: 'QM', data: data, borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.1)', fill: true, tension: 0.3 }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { grid: { color: 'rgba(241,241,230,0.1)' } },
                y: { min: 0, max: 100, grid: { color: 'rgba(241,241,230,0.1)' } }
              },
              plugins: { legend: { display: false } }
            }
          });
        });
      }
      var history = [];
      try {
        history = JSON.parse(localStorage.getItem('mycelium_49_history') || '[]');
      } catch (_) {}
      var listEl = document.getElementById('dashboard-archives-list');
      if (listEl) {
        if (history.length === 0) {
          listEl.innerHTML = 'Aucun parchemin enregistré. Vos résultats sont listés ici après chaque test.';
        } else {
          listEl.innerHTML = history.slice(0, 10).map(function (h, i) {
            var d = h.date ? new Date(h.date).toLocaleDateString('fr-FR') : '';
            return '<p class="text-[#F1F1E6]/80">' + (h.profileName || 'Test') + ' — ' + d + (h.qm_score != null ? ' (QM ' + h.qm_score + ')' : '') + '</p>';
          }).join('');
        }
      }
      if (ds.getPublicProfiles) {
        ds.getPublicProfiles(12).then(function (profiles) {
          var hyphesEl = document.getElementById('dashboard-hyphes-list');
          if (!hyphesEl) return;
          if (profiles.length === 0) {
            hyphesEl.innerHTML = '<span class="text-[#F1F1E6]/60">Aucune hyphe active pour l\'instant.</span>';
          } else {
            hyphesEl.innerHTML = profiles.map(function (p) {
              var name = p.initiate_name || p.slug || 'Initié';
              return '<a href="#/u/' + (p.slug || '') + '" class="px-3 py-2 rounded-lg bg-white/5 border border-[#D4AF37]/20 text-[#F1F1E6] text-sm hover:border-[#D4AF37]/50 transition">' + name + '</a>';
            }).join('');
          }
        });
      }
      var publicToggle = document.getElementById('dashboard-public-toggle');
      if (publicToggle) {
        publicToggle.addEventListener('change', function () {
          var slug = '';
          ds.getProfile(userId).then(function (profile) {
            var name = (profile && profile.initiate_name) || '';
            if (publicToggle.checked && name) slug = ds.slugify(name) || ds.slugify('initie-' + userId.slice(0, 8));
            ds.setProfile(userId, { public_constellation: publicToggle.checked, slug: slug || null }).then(function () {
              var urlEl = document.getElementById('dashboard-public-url');
              if (urlEl) {
                urlEl.textContent = slug ? (window.location.origin + window.location.pathname + '#/u/' + slug) : '';
                urlEl.classList.toggle('hidden', !slug);
              }
            });
          });
        });
      }
    }

    document.getElementById('dashboard-back').addEventListener('click', function () {
      showView('selector');
    });
    document.getElementById('dashboard-logout').addEventListener('click', function () {
      if (window.authService) window.authService.signOut().then(function () { updateAuthUI(null); showView('selector'); });
    });

    window.showDashboard = function () {
      showView('dashboard');
      var session = window._myceliumSession;
      if (session && session.user) loadDashboard(session.user.id);
    };

    // Au passage en vue dashboard, recharger les données
    var dashboardEl = document.getElementById('view-dashboard');
    if (dashboardEl) {
      var obs = new MutationObserver(function () {
        if (!dashboardEl.classList.contains('hidden') && window._myceliumSession && window._myceliumSession.user) {
          loadDashboard(window._myceliumSession.user.id);
        }
      });
      obs.observe(dashboardEl, { attributes: true, attributeFilter: ['class'] });
    }

    // Profil public #/u/slug
    var publicRadarChart = null;
    function loadPublicProfile(slug) {
      var loading = document.getElementById('public-loading');
      var content = document.getElementById('public-content');
      var errEl = document.getElementById('public-error');
      if (loading) loading.classList.remove('hidden');
      if (content) content.classList.add('hidden');
      if (errEl) errEl.classList.add('hidden');
      if (!window.dataService || !window.dataService.getProfileBySlug) {
        if (loading) loading.classList.add('hidden');
        if (errEl) errEl.classList.remove('hidden');
        return;
      }
      window.dataService.getProfileBySlug(slug).then(function (profile) {
        if (loading) loading.classList.add('hidden');
        if (!profile) {
          if (errEl) errEl.classList.remove('hidden');
          return;
        }
        document.getElementById('public-name').textContent = profile.initiate_name || 'Initié';
        document.getElementById('public-maison').textContent = 'Maison : ' + (profile.maison || '—');
        document.getElementById('public-totem').textContent = 'Totem : ' + (profile.totem || '—');
        if (content) content.classList.remove('hidden');
        window.dataService.getLastSessionForUser(profile.id).then(function (session) {
          var canvas = document.getElementById('public-radar');
          if (!canvas || !window.Chart) return;
          var keys = window.MYCELIUM_49 && window.MYCELIUM_49.keys ? window.MYCELIUM_49.keys : [];
          if (!session || keys.length !== 7) return;
          var vals = [
            session.score_spore,
            session.score_ancrage,
            session.score_expansion,
            session.score_lyse,
            session.score_fructification,
            session.score_absorption,
            session.score_dormance
          ].map(function (v) { return (typeof v === 'number' ? v : 0) + 2; });
          if (publicRadarChart) publicRadarChart.destroy();
          publicRadarChart = new Chart(canvas, {
            type: 'radar',
            data: {
              labels: keys.map(function (k) { return k.name; }),
              datasets: [{ label: 'Sève', data: vals, borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.15)', borderWidth: 2, pointBackgroundColor: '#D4AF37' }]
            },
            options: {
              responsive: true,
              scales: { r: { min: 0, max: 4, pointLabels: { color: '#F1F1E6' }, grid: { color: 'rgba(241,241,230,0.2)' } } },
              plugins: { legend: { display: false } }
            }
          });
        });
      });
    }

    function checkHash() {
      var match = window.location.hash.match(/^#\/u\/([a-z0-9-]+)$/);
      if (match) {
        showView('public');
        loadPublicProfile(match[1]);
      } else {
        showView('selector');
      }
    }
    window.addEventListener('hashchange', checkHash);
    checkHash();

    document.getElementById('public-back').addEventListener('click', function (e) {
      e.preventDefault();
      window.location.hash = '';
      showView('selector');
    });

    const sgStart49 = document.getElementById('sg-start-49');
    if (sgStart49) sgStart49.addEventListener('click', goSgFirstPole);

    $('#sg-next').addEventListener('click', () => {
      if (sgPoleIndex < 6) {
        const overlay = document.createElement('div');
        overlay.className = 'sg-racine-overlay';
        overlay.innerHTML = '<span class="sg-racine-text">Racine ancrée</span><div class="sg-racine-line"></div>';
        document.body.appendChild(overlay);
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          sgPoleIndex++;
          setSelfGrowthPage();
        }, 1200);
      } else {
        showSelfGrowthResult();
      }
    });

    const sgExportPdf = document.getElementById('sg-export-pdf');
    if (sgExportPdf) sgExportPdf.addEventListener('click', exportResults);

    const sgSendEmail = document.getElementById('sg-send-email');
    if (sgSendEmail) sgSendEmail.addEventListener('click', () => {
      const email = ($('#sg-email') && $('#sg-email').value) || '';
      if (!email) { alert('Veuillez saisir votre adresse email.'); return; }
      const prenom = (sgUserName || '').trim() || 'ami';
      const bodyText = 'Voici votre écosystème, ' + prenom + '. Puissiez-vous trouver l\'équilibre dans votre croissance.';
      if (window.emailjs && window.emailjs.send) {
        try {
          window.emailjs.send('default_service', 'mycelium_report', {
            to_email: email,
            message: bodyText,
            user_name: prenom
          }).then(() => { alert('Email envoyé à ' + email); }).catch(() => alert('Envoi impossible. Configurez EmailJS (voir doc).'));
        } catch (e) { alert('EmailJS non configuré.'); }
      } else {
        const subj = encodeURIComponent('Carte de Conscience Mycélium');
        const body = encodeURIComponent(bodyText + '\n\nTéléchargez votre PDF depuis l\'application pour joindre votre carte.');
        window.location.href = 'mailto:' + email + '?subject=' + subj + '&body=' + body;
        alert('Ouverture du client mail. Téléchargez d\'abord le PDF puis joignez-le à votre email.');
      }
    });

    $('#sg-redo').addEventListener('click', () => {
      sgAnswers = new Array(49);
      sgPoleIndex = 0;
      $('#sg-result').classList.add('hidden');
      $('#sg-stage').classList.add('hidden');
      $('#sg-intro').classList.remove('hidden');
      $('#sg-user-name').value = '';
      updateSgProgress();
    });
    $('#sg-back-to-selector').addEventListener('click', () => { showView('selector'); });

    $('#btn-back').addEventListener('click', () => {
      if (state.view === 'self-growth') {
        showView('selector');
        return;
      }
      if (state.view !== 'test') return;
      if (!$('#result-stage').classList.contains('hidden')) {
        stopChaos();
        stopAmbient();
        showView('selector');
        updateTabTitle(null, 0);
        document.body.className = 'min-h-screen overflow-x-hidden antialiased';
        document.body.classList.remove('cursor-maga', 'cursor-laurel', 'cursor-glaive');
        return;
      }
      if (state.currentQuestion > 1) {
        state.currentQuestion--;
        setQuestion(state.currentQuestion);
      } else {
        stopChaos();
        stopAmbient();
        showView('selector');
        updateTabTitle(null, 0);
      }
    });

    window.addEventListener('beforeunload', (e) => {
      if (state.currentTest === 'bdw' && state.view === 'test') {
        e.preventDefault();
        return (e.returnValue = 'On ne quitte pas l\'Empire si facilement, citoyen.');
      }
      if (state.currentTest === 'putin' && state.view === 'test') {
        e.preventDefault();
        return (e.returnValue = 'La session n\'est pas terminée. Le Tsar n\'a pas donné son accord.');
      }
      if (state.currentTest === 'trump' && state.currentQuestion >= 5 && state.view === 'test') {
        e.preventDefault();
        return (e.returnValue = 'VOUS NE POUVEZ PAS QUITTER, NOUS SOMMES EN TRAIN DE GAGNER !');
      }
    });
  }

  init();
})();
