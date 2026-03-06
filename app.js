(function () {
  const state = {
    currentTest: null,
    currentQuestion: 0,
    view: 'selector',
    totalQuestions: 7
  };

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

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

    const q = test.questions[qIndex - 1];
    const level = getCrescendoLevel(qIndex - 1);
    applyTheme(state.currentTest, level);

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

    const optionAvoid = (level === 2 && state.currentTest === 'musk') || (state.currentTest === 'bdw' && level >= 2) || (state.currentTest === 'trump' && level >= 3);
    const optionFlee = (state.currentTest === 'trump' && qIndex >= 5);

    labels.forEach((text, i) => {
      const isCorrect = i === correctIndex;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.index = i;
      btn.dataset.correct = isCorrect ? '1' : '0';
      const isMuskQ7 = state.currentTest === 'musk' && qIndex === 7;
      btn.textContent = isMuskQ7 ? 'JE SUIS ELON' : text;
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
      btn.addEventListener('mouseenter', (e) => {
        if (!optionAvoid && !optionFlee) return;
        if (isCorrect) return;
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        if (state.currentTest === 'bdw' && i === 0 && level >= 3) {
          avoidX = 0;
          avoidY = 50;
        } else {
          avoidX = (dx > 0 ? 1 : -1) * 30;
          avoidY = (dy > 0 ? 1 : -1) * 20;
        }
        btn.style.transform = `translate(${avoidX}px, ${avoidY}px)`;
      });
      btn.addEventListener('mousemove', (e) => {
        if (!optionAvoid && !optionFlee || isCorrect) return;
        if (state.currentTest === 'bdw' && i === 0 && level >= 3) {
          avoidX = 0;
          avoidY = 60;
        } else {
          const rect = btn.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          avoidX = (e.clientX - cx) > 0 ? 35 : -35;
          avoidY = (e.clientY - cy) > 0 ? 25 : -25;
        }
        btn.style.transform = `translate(${avoidX}px, ${avoidY}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (state.currentTest === 'musk' && level === 3 && !isCorrect) {
          showErrorPopup('Erreur : Pensée de PNJ détectée. Optimisation requise.', true);
          screenShake();
          return;
        }
        if (state.currentTest === 'bdw' && qIndex >= 5 && i === 1) {
          showErrorPopup('Erreur : Transfert budgétaire vers le Sud détecté. Accès refusé.');
          return;
        }
        if (state.currentTest === 'putin' && level >= 3 && !isCorrect) {
          btn.textContent = i === 0 ? 'Ordre' : 'Silence';
          setTimeout(() => advanceQuestion(), 200);
          return;
        }
        if (state.currentTest === 'trump' && !isCorrect && level >= 2) {
          container.classList.add('wrong-flash');
          setTimeout(() => container.classList.remove('wrong-flash'), 500);
          const wrong = document.createElement('div');
          wrong.className = 'fixed inset-0 flex items-center justify-center z-30 pointer-events-none';
          wrong.innerHTML = '<span class="text-6xl font-black text-red-600">WRONG!</span>';
          document.body.appendChild(wrong);
          setTimeout(() => wrong.remove(), 400);
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
      skip.onclick = () => { screenShake(); advanceQuestion(); };
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
      content.innerHTML = '<div class="gold-pulse bg-black/80 rounded-2xl p-8 max-w-lg border-4 border-amber-400"><h2 class="text-3xl font-bold text-amber-400 mb-4">' + test.resultTitle + '</h2><p class="text-white/90 mb-4">' + test.resultText + '</p><p class="text-4xl font-black text-amber-400 my-6">' + (test.resultBadge || '') + '</p><button class="px-6 py-3 rounded bg-amber-500 text-black font-bold">Dire au monde entier que j\'ai gagné</button></div>';
      document.body.classList.add('cursor-maga');
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

    $('#btn-redo').onclick = redoTest;
    $('#btn-back-to-selector').onclick = () => { showView('selector'); document.body.className = 'min-h-screen overflow-x-hidden antialiased'; document.body.classList.remove('cursor-maga','cursor-laurel','cursor-glaive'); };
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
        showView('selector');
        document.body.className = 'min-h-screen overflow-x-hidden antialiased';
        document.body.classList.remove('cursor-maga', 'cursor-laurel', 'cursor-glaive');
        return;
      }
      if (state.currentQuestion > 1) {
        state.currentQuestion--;
        setQuestion(state.currentQuestion);
      } else {
        showView('selector');
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
