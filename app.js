(function () {
  const state = {
    currentTest: null,
    currentQuestion: 0,
    view: 'selector',
    totalQuestions: 7,
    chaosBoost: 0,
    chaosRunning: false,
    chaosTimer: null,
    chaosWall: null,
    activePopups: 0,
    popupTotal: 0,
    popupMax: 0
  };

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

  const GIF_BANK = {
    musk: [
      'https://media.giphy.com/media/l0K4kWJir91VEoa1W/giphy.gif',
      'https://media.giphy.com/media/3o7aCTfyhYawdOXcFW/giphy.gif',
      'https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif',
      'https://media.giphy.com/media/l0MYC0LajbaPoEADu/giphy.gif',
      'https://media.giphy.com/media/26BRQTezZrKak4BeE/giphy.gif'
    ],
    trump: [
      'https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif',
      'https://media.giphy.com/media/3o6Zt8MgUuvSbkZYWc/giphy.gif',
      'https://media.giphy.com/media/26BRQTezZrKak4BeE/giphy.gif',
      'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
      'https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif'
    ],
    bdw: [
      'https://media.giphy.com/media/l0HlQ7LRalQWvJY5G/giphy.gif',
      'https://media.giphy.com/media/3o7aD4vR3l5hF1xJZC/giphy.gif',
      'https://media.giphy.com/media/26BRrSvJUa0crqw4E/giphy.gif',
      'https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif',
      'https://media.giphy.com/media/3o6Zt6D9yBfGd9dV1m/giphy.gif'
    ],
    putin: [
      'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',  // neige
      'https://media.giphy.com/media/l0MYu5n9M3sGZ6yUQ/giphy.gif',  // militaire
      'https://media.giphy.com/media/l0MYrQf2Zl9s4Y8nS/giphy.gif',  // surveillance
      'https://media.giphy.com/media/3o7aD4kZK8u1o0YJ2A/giphy.gif',
      'https://media.giphy.com/media/l0MYC0LajbaPoEADu/giphy.gif',
      'https://media.giphy.com/media/3o6Zt6D9yBfGd9dV1m/giphy.gif',
      'https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif',
      'https://media.giphy.com/media/26BRQTezZrKak4BeE/giphy.gif',
      'https://media.giphy.com/media/3o7aCTfyhYawdOXcFW/giphy.gif',
      'https://media.giphy.com/media/3o6Zt8MgUuvSbkZYWc/giphy.gif'
    ]
  };

  function pickGif(testId, salt = 0) {
    const bank = GIF_BANK[testId] || [];
    if (!bank.length) return null;
    const i = Math.abs(((Date.now() / 7) | 0) + salt) % bank.length;
    return bank[i];
  }

  function spawnIntrusivePopup(testId, qIndex) {
    // limite globale de popups visibles et totales par \"run\"
    if (state.activePopups >= 7) return;
    if (state.popupMax && state.popupTotal >= state.popupMax) return;

    const gif = pickGif(testId, qIndex);
    if (!gif) return;
    const popup = document.createElement('div');
    popup.className = `intrusive-popup popup-${testId}`;
    const title = testId === 'trump' ? 'FAKE NEWS' : testId === 'musk' ? 'X NOTIF' : testId === 'bdw' ? 'CONFÉDÉRALISME' : 'PROTOCOLE';
    const caption = testId === 'trump' ? 'ERREUR DE PENSÉE : correction en cours.' : testId === 'musk' ? 'Votre profil est recalibré.' : testId === 'bdw' ? 'Cohésion : non conforme.' : 'Conformité requise.';
    popup.innerHTML = `
      <div class="intrusive-popup-header">
        <span>${title}</span>
        <span>${String(qIndex).padStart(2, '0')}/07</span>
      </div>
      <div class="intrusive-popup-body">
        <img alt="meme" src="${gif}" />
        <div class="intrusive-popup-caption">${caption}</div>
      </div>
    `;
    const maxX = Math.max(8, window.innerWidth - 360);
    const maxY = Math.max(8, window.innerHeight - 280);
    popup.style.left = (Math.random() * maxX) + 'px';
    popup.style.top = (Math.random() * maxY) + 'px';
    document.body.appendChild(popup);
    state.activePopups++;
    state.popupTotal++;

    // rendre le popup déplaçable (drag via header)
    const header = popup.querySelector('.intrusive-popup-header');
    if (header) {
      header.style.cursor = 'move';
      let dragging = false;
      let startX = 0;
      let startY = 0;
      let baseLeft = 0;
      let baseTop = 0;
      const onMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        popup.style.left = Math.min(Math.max(0, baseLeft + dx), window.innerWidth - popup.offsetWidth) + 'px';
        popup.style.top = Math.min(Math.max(0, baseTop + dy), window.innerHeight - popup.offsetHeight) + 'px';
      };
      const onUp = () => {
        dragging = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      header.addEventListener('mousedown', (e) => {
        e.preventDefault();
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = popup.getBoundingClientRect();
        baseLeft = rect.left;
        baseTop = rect.top;
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      });
    }

    const ttl = 2200 + Math.random() * 1600;
    setTimeout(() => {
      if (popup.parentNode) popup.remove();
      state.activePopups = Math.max(0, state.activePopups - 1);
    }, ttl);
  }

  function startChaosWall(testId, qIndex) {
    stopChaosWall();
    const wall = document.createElement('div');
    wall.className = 'chaos-gif-wall';
    const g1 = pickGif(testId, qIndex + 1);
    const g2 = pickGif(testId, qIndex + 2);
    const g3 = pickGif(testId, qIndex + 3);
    const g4 = pickGif(testId, qIndex + 4);
    const label = testId === 'trump' ? 'FAKE NEWS!' : testId === 'musk' ? 'ERREUR DE PENSÉE' : testId === 'bdw' ? 'CONFÉDÉRALISME' : 'SURVEILLANCE';
    wall.innerHTML = `
      <img alt="gif" src="${g1 || g2 || ''}" />
      <img alt="gif" src="${g2 || g1 || ''}" />
      <img alt="gif" src="${g3 || g1 || ''}" />
      <img alt="gif" src="${g4 || g2 || ''}" />
      <div class="chaos-label">${label}</div>
    `;
    document.body.appendChild(wall);
    state.chaosWall = wall;
  }

  function stopChaosWall() {
    if (state.chaosWall) {
      state.chaosWall.remove();
      state.chaosWall = null;
    }
  }

  function startChaos(testId, qIndex) {
    stopChaos();
    state.chaosRunning = true;
    // on choisit un nombre de popups total aléatoire (3 à 7)
    state.popupTotal = 0;
    state.popupMax = 3 + Math.floor(Math.random() * 5);
    startChaosWall(testId, qIndex);
    // fréquence plus lente (≈ 1,5–2 s), légèrement impactée par le chaosBoost
    const baseEvery = Math.max(1400, 2000 - state.chaosBoost * 120);
    state.chaosTimer = setInterval(() => {
      if (!state.chaosRunning) return;
      spawnIntrusivePopup(testId, qIndex);
      if (state.popupMax && state.popupTotal >= state.popupMax) {
        clearInterval(state.chaosTimer);
        state.chaosTimer = null;
      }
    }, baseEvery);
  }

  function stopChaos() {
    state.chaosRunning = false;
    if (state.chaosTimer) {
      clearInterval(state.chaosTimer);
      state.chaosTimer = null;
    }
    stopChaosWall();
    const oldModal = $('#intrusive-modal');
    if (oldModal) oldModal.remove();
  }

  function burstConfettiGold() {
    const root = document.createElement('div');
    root.className = 'confetti';
    const count = 80 + state.chaosBoost * 20;
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
    const existing = $('#intrusive-modal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'intrusive-modal';
    modal.className = 'fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4';
    modal.innerHTML = `
      <div class="bg-black/90 border-4 border-amber-400 rounded-2xl p-6 max-w-lg w-full text-center">
        <h3 class="text-2xl font-black text-amber-400 mb-4">TO THE MOON</h3>
        <img class="w-full rounded-xl mb-4" style="height:260px; object-fit:cover" alt="doge" src="https://media.giphy.com/media/5ndklThG9vUUdTmgMn/giphy.gif" />
        <p class="text-white/90 font-bold">TO THE MOON! MUCH WINNING! VERY TRUMP!</p>
        <button id="btn-close-doge" class="mt-5 px-6 py-3 rounded-xl bg-amber-500 text-black font-black">OK</button>
      </div>
    `;
    document.body.appendChild(modal);
    $('#btn-close-doge', modal).onclick = () => modal.remove();
  }

  function showFinalPopup(testId) {
    const existing = $('#intrusive-modal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'intrusive-modal';
    modal.className = 'fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4';
    const title =
      testId === 'trump' ? 'DIAGNOSTIC FINAL' :
      testId === 'musk' ? 'IDENTIFICATION : ALPHA' :
      testId === 'bdw' ? 'AVERTISSEMENT IMPÉRIAL' :
      'PROTOCOLE : CLÔTURE';
    const msg =
      testId === 'trump' ? 'Le système confirme une compatibilité totale. Merci de votre coopération.' :
      testId === 'musk' ? 'Votre profil converge. Aucune divergence tolérée.' :
      testId === 'bdw' ? 'La cohésion est validée. Le reste du pays est secondaire.' :
      'La session est enregistrée. Aucune issue n’a jamais existé.';
    modal.innerHTML = `
      <div class="bg-black/90 border border-white/20 rounded-2xl p-6 max-w-lg w-full text-center">
        <h3 class="text-xl font-black text-white mb-3">${title}</h3>
        <p class="text-white/80">${msg}</p>
        <button id="btn-final-ok" class="mt-5 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold border border-white/20">OK</button>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
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
    const nav = $('#global-nav');
    if (name === 'selector') {
      selector.classList.remove('hidden');
      test.classList.add('hidden');
      nav.classList.add('opacity-0', 'pointer-events-none');
    } else {
      selector.classList.add('hidden');
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
    $('#question-label').className = 'text-sm uppercase tracking-wider mb-4 ' + (level === 1 && (state.currentTest === 'musk' || state.currentTest === 'trump') ? 'text-gray-600' : 'text-white/70');
    $('#question-text').textContent = q.text;
    $('#question-text').className = 'text-2xl md:text-4xl font-bold text-center mb-12 max-w-3xl leading-tight ' + (state.currentTest === 'trump' && qIndex === 7 ? 'text-5xl' : '') + (level === 1 && (state.currentTest === 'musk' || state.currentTest === 'trump') ? ' text-gray-900' : ' text-white');
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
      content.innerHTML = '<div class="bg-black/80 rounded-2xl p-8 max-w-lg border-2 border-amber-500/50"><h2 class="text-2xl font-bold text-amber-400 mb-4">Mars Citizen</h2><p class="text-white/90 mb-6">' + test.resultText + '</p><p class="text-amber-400/80 text-sm">Alpha-Musk • Niveau Orbite</p></div>';
    } else if (state.currentTest === 'bdw') {
      document.body.className = 'min-h-screen overflow-x-hidden antialiased bg-amber-900/30';
      content.innerHTML = '<div class="bg-black/90 rounded-2xl p-8 max-w-lg border-2 border-amber-500"><h2 class="text-3xl font-bold text-amber-400 mb-4">AVE BARTIMUS ! VOUS ÊTES L\'EMPEREUR.</h2><p class="text-amber-100 mb-6">' + test.resultText + '</p><button id="btn-dissolve" class="mt-4 px-6 py-3 rounded bg-red-800 text-white font-bold">Dissoudre le pays</button></div>';
      $('#effects-layer').innerHTML = '<div class="rain-container"><div class="absolute inset-0 opacity-20" style="background: url(\'data:image/svg+xml,&lt;svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 20 20\'&gt;&lt;text y=15 font-size=14 fill=%23fdda24&gt;🍟&lt;/text&gt;&lt;/svg\') repeat;"></div></div>';
      $('#btn-dissolve').onclick = () => { try { window.close(); } catch (_) { alert('Fermez l\'onglet vous-même. L\'Empire vous observe.'); } };
    } else if (state.currentTest === 'trump') {
      content.innerHTML = '<div class="gold-pulse bg-black/80 rounded-2xl p-8 max-w-lg border-4 border-amber-400"><h2 class="text-3xl font-bold text-amber-400 mb-4">' + test.resultTitle + '</h2><p class="text-white/90 mb-4">' + test.resultText + '</p><p class="text-4xl font-black text-amber-400 my-6">' + (test.resultBadge || '') + '</p><button id="btn-share-winner" class="px-6 py-3 rounded bg-amber-500 text-black font-black">PARTAGER MON SCORE DE GAGNANT</button></div>';
      document.body.classList.add('cursor-maga');
      const share = $('#btn-share-winner');
      if (share) share.onclick = () => showDogeMeme();
    } else if (state.currentTest === 'putin') {
      document.body.className = 'min-h-screen overflow-x-hidden antialiased bg-black';
      content.innerHTML = '<div class="bg-black border border-red-900/80 rounded p-8 max-w-lg"><h2 class="text-xl font-mono text-red-700 mb-4">IDENTITÉ CONFIRMÉE : VLADIMIR V. POUTINE.</h2><p class="text-red-200/90 mb-6">' + test.resultText + '</p><button id="btn-stay-power" class="px-6 py-3 rounded border border-red-800 text-red-600 font-mono">RESTER AU POUVOIR</button></div>';
      $('#btn-stay-power').onclick = () => {
        state.currentQuestion = 1;
        $('#result-stage').classList.add('hidden');
        $('#test-stage').classList.remove('hidden');
        $('#effects-layer').innerHTML = '';
        setQuestion(1);
      };
    }

    // Le gros chaos (4 grands GIFs + popups intrusifs) arrive APRÈS la popup finale.
    stopChaos();
    const finalModal = showFinalPopup(state.currentTest);
    const ok = $('#btn-final-ok', finalModal);
    if (ok) {
      ok.onclick = () => {
        finalModal.remove();
        state.chaosBoost = Math.max(state.chaosBoost || 0, 1);
        startChaos(state.currentTest, 7);
      };
    }

    $('#btn-redo').onclick = redoTest;
    $('#btn-back-to-selector').onclick = () => {
      stopChaos();
      stopAmbient();
      showView('selector');
      updateTabTitle(null, 0);
      document.body.className = 'min-h-screen overflow-x-hidden antialiased';
      document.body.classList.remove('cursor-maga', 'cursor-laurel', 'cursor-glaive');
    };
  }

  function redoTest() {
    // Le bouton \"Recommencer\" ne vous laisse pas partir : il augmente le chaos.
    state.chaosBoost = Math.min(6, (state.chaosBoost || 0) + 1);
    state.currentQuestion = 1;
    $('#result-stage').classList.add('hidden');
    $('#test-stage').classList.remove('hidden');
    $('#effects-layer').innerHTML = '';
    setQuestion(1);
  }

  function startTest(testId) {
    state.currentTest = testId;
    state.chaosBoost = 0;
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

  function init() {
    $('#view-selector').querySelectorAll('[data-test]').forEach(btn => {
      btn.addEventListener('click', () => startTest(btn.dataset.test));
    });

    $('#btn-back').addEventListener('click', () => {
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

    $$('.nav-test').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.nav === state.currentTest) return;
        startTest(btn.dataset.nav);
      });
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
