(function() {
  'use strict';

  // === DATABASE VORTEX-TRASH ===
  const VORTEX_PRODUCTS = [
    { id: 1, name: "Câble USB-C 'Hyper-Titanium' (50 mètres)", originalPrice: 49.99, price: 0.89, tag: "Vente Flash -98%", description: "Transmission de données à la vitesse de la pensée." },
    { id: 2, name: "Masseur de sourcils intelligent à 12 modes", originalPrice: 85.00, price: 2.45, tag: "Top Vente", description: "Réduit le stress lié aux achats en ligne." },
    { id: 3, name: "Mini-réfrigérateur USB pour une seule cerise", originalPrice: 25.90, price: 1.12, tag: "Cadeau Gratuit possible", description: "Gardez vos petits fruits au frais partout." },
    { id: 4, name: "Autocollant anti-ondes 'Nano-Shield' pour micro-ondes", originalPrice: 12.00, price: 0.15, tag: "Soutenu par la science (fictive)", description: "Protège votre aura numérique." },
    { id: 5, name: "Montre 'Quantum-Master' en alliage de zinc brillant", originalPrice: 299.00, price: 4.99, tag: "Luxe Absolu", description: "Donne l'heure (parfois) avec élégance." },
    { id: 6, name: "Pack de 500 brosses à dents à usage unique", originalPrice: 45.00, price: 3.20, tag: "Stock Limité", description: "Ne lavez plus jamais votre brosse." },
    { id: 7, name: "Projecteur de ciel étoilé pour toilettes (RGB)", originalPrice: 34.00, price: 1.88, tag: "Indispensable", description: "Transformez vos moments d'intimité en voyage galactique." },
    { id: 8, name: "Chaussettes chauffantes USB 'Volcano-Feet'", originalPrice: 28.00, price: 1.49, tag: "Nouveau", description: "Gardez vos pieds au chaud jusqu'à 47°C." },
    { id: 9, name: "Porte-clés détecteur de Wi-Fi vintage", originalPrice: 15.00, price: 0.35, tag: "Rétro-Tech", description: "Sachez toujours où se trouve Internet." },
    { id: 10, name: "Grattoir à dos télescopique avec LED", originalPrice: 22.00, price: 0.99, tag: "Innovation", description: "Atteignez les zones impossibles, dans le noir." },
    { id: 11, name: "Lampe de lecture pour oreille (clip-on)", originalPrice: 18.50, price: 0.77, tag: "Bestseller", description: "Éclairez vos lectures nocturnes avec style." },
    { id: 12, name: "Extension de garantie Vortex Premium", originalPrice: 9.99, price: 0.99, tag: "Protection", description: "Garantie de 1000 ans (non transférable)." },
    { id: 13, name: "Assurance colis 'Anti-Disparition'", originalPrice: 5.99, price: 0.49, tag: "Sécurité", description: "Votre colis ne disparaîtra jamais. Probablement." },
    { id: 14, name: "Emballage cadeau 'Luxe Diamant'", originalPrice: 8.00, price: 0.29, tag: "Premium", description: "Du papier brillant pour impressionner." },
    { id: 15, name: "TV 8K de poche (3 pouces)", originalPrice: 999.00, price: 0.01, tag: "MYSTÈRE", description: "La technologie du futur, dans votre poche." }
  ];

  const AUTO_ADD_ITEMS = [
    { name: "Protection Anti-Choc Standard", price: 0.99, type: "protection" },
    { name: "Extension de Garantie 6 mois", price: 0.99, type: "garantie" },
    { name: "Emballage Éco-Responsable Premium", price: 0.49, type: "emballage" },
    { name: "Assurance Livraison Express", price: 0.79, type: "assurance" },
    { name: "Certification Vortex Authentique", price: 0.39, type: "certification" }
  ];

  const FREE_ITEMS = [
    { name: "Porte-clés 'Vortex VIP'", originalPrice: 4.99 },
    { name: "Autocollant holographique 'I ❤ Shopping'", originalPrice: 2.99 },
    { name: "Mini-loupe de poche", originalPrice: 3.50 },
    { name: "Bouchon de stylo universel", originalPrice: 1.99 },
    { name: "Règle flexible 5cm", originalPrice: 2.49 },
    { name: "Gomme parfum fraise", originalPrice: 1.50 }
  ];

  const FAKE_BUYERS = [
    "Jean-Pierre de Lyon", "Marie de Paris", "Ahmed de Marseille", "Sophie de Bordeaux",
    "Michel de Toulouse", "Fatima de Lille", "Pierre de Nantes", "Isabelle de Strasbourg",
    "Youssef de Nice", "Céline de Rennes", "François de Montpellier", "Amira de Grenoble"
  ];

  const GUILT_MESSAGES = {
    avarice: {
      message: "Si vous retirez cet article, le prix de tous les autres articles remonte de 15%.",
      button: "Maintenir mon prix bas"
    },
    orgueil: {
      message: "Seuls les acheteurs d'élite possèdent cet objet. Voulez-vous vraiment redevenir un acheteur ordinaire ?",
      button: "Rester dans l'élite"
    },
    envie: {
      message: "Votre voisin a déjà commandé le sien. Ne le laissez pas avoir une meilleure maison que la vôtre.",
      button: "Prendre l'avantage"
    },
    paresse: {
      message: "Le retrait d'article nécessite un formulaire de désistement de 4 pages. Cliquez ici pour tout garder et gagner du temps.",
      button: "Tout garder (Facile)"
    },
    environnement: {
      message: "Expédier un panier incomplet augmente l'empreinte carbone de 400%. Voulez-vous vraiment blesser la planète ?",
      button: "Sauver la planète"
    },
    urgence: {
      message: "Pendant que vous hésitez, 14 personnes ont ajouté cet article à leur panier. Stock réservé pendant encore :",
      button: "Sécuriser mon achat"
    }
  };

  const STATUS_LEVELS = [
    { min: 0, max: 5, name: "Acheteur Prudent", color: "#6b7280", bgColor: "bg-gray-500", effect: "none" },
    { min: 6, max: 15, name: "Consommateur Averti", color: "#cd7f32", bgColor: "bg-amber-700", effect: "star" },
    { min: 16, max: 30, name: "Maître du Deal", color: "#c0c0c0", bgColor: "bg-gray-400", effect: "shine" },
    { min: 31, max: 50, name: "Légende du Shopping", color: "#ffd700", bgColor: "bg-yellow-400", effect: "confetti" },
    { min: 51, max: 9999, name: "EMPEREUR DU CAPITALISME", color: "#ffd700", bgColor: "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400", effect: "emperor" }
  ];

  // === STATE ===
  let vortexState = {
    cart: [],
    freeItemsChosen: 0,
    totalSaved: 0,
    currentView: 'shop',
    viewers: Math.floor(Math.random() * 500) + 100,
    offerTimer: 180,
    checkoutAttempts: 0,
    guiltModalShown: false,
    audioCtx: null
  };

  // === AUDIO ===
  function getVortexAudio() {
    if (!vortexState.audioCtx) {
      vortexState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return vortexState.audioCtx;
  }

  function playCashRegister() {
    try {
      const ctx = getVortexAudio();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1400, ctx.currentTime);
        gain2.gain.setValueAtTime(0.1, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.1);
      }, 80);
    } catch (e) {}
  }

  function playFanfare() {
    try {
      const ctx = getVortexAudio();
      if (ctx.state === 'suspended') ctx.resume();
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.3);
        }, i * 120);
      });
    } catch (e) {}
  }

  function playJackpot() {
    try {
      const ctx = getVortexAudio();
      if (ctx.state === 'suspended') ctx.resume();
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400 + i * 100, ctx.currentTime);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.15);
        }, i * 80);
      }
    } catch (e) {}
  }

  // === HELPERS ===
  function $(sel, el = document) { return el.querySelector(sel); }
  function $$(sel, el = document) { return [...el.querySelectorAll(sel)]; }

  function getCartCount() {
    return vortexState.cart.length;
  }

  function getCartTotal() {
    return vortexState.cart.reduce((sum, item) => sum + item.price, 0);
  }

  function getOriginalTotal() {
    return vortexState.cart.reduce((sum, item) => sum + (item.originalPrice || item.price), 0);
  }

  function getCurrentStatus() {
    const count = getCartCount();
    return STATUS_LEVELS.find(s => count >= s.min && count <= s.max) || STATUS_LEVELS[0];
  }

  function getNextStatus() {
    const count = getCartCount();
    const currentIdx = STATUS_LEVELS.findIndex(s => count >= s.min && count <= s.max);
    if (currentIdx < STATUS_LEVELS.length - 1) {
      return STATUS_LEVELS[currentIdx + 1];
    }
    return null;
  }

  // === CONFETTI ===
  function burstVortexConfetti(colors = ['#FF6600', '#ffd700', '#ff0000', '#00ff00']) {
    const container = document.createElement('div');
    container.className = 'vortex-confetti-container';
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      piece.style.cssText = `
        position:absolute;
        width:${6 + Math.random() * 8}px;
        height:${8 + Math.random() * 12}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        left:${Math.random() * 100}%;
        animation:vortex-confetti-fall ${2 + Math.random() * 2}s linear forwards;
        animation-delay:${Math.random() * 0.5}s;
        border-radius:2px;
      `;
      container.appendChild(piece);
    }
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 4500);
  }

  // === TOAST NOTIFICATIONS ===
  function showToast(message, type = 'info') {
    const container = $('#vortex-toasts') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `vortex-toast vortex-toast-${type}`;
    toast.innerHTML = `
      <span class="vortex-toast-icon">${type === 'buyer' ? '🛒' : type === 'urgency' ? '⚡' : '🔥'}</span>
      <span class="vortex-toast-text">${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('vortex-toast-visible'), 50);
    setTimeout(() => {
      toast.classList.remove('vortex-toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'vortex-toasts';
    container.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:9998;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
    return container;
  }

  // === FAKE BUYER NOTIFICATIONS ===
  function startFakeBuyerNotifications() {
    setInterval(() => {
      if (vortexState.currentView !== 'shop') return;
      const buyer = FAKE_BUYERS[Math.floor(Math.random() * FAKE_BUYERS.length)];
      const product = VORTEX_PRODUCTS[Math.floor(Math.random() * VORTEX_PRODUCTS.length)];
      const messages = [
        `${buyer} vient d'acheter "${product.name}" !`,
        `${buyer} a ajouté ${Math.floor(Math.random() * 5) + 2} articles à son panier !`,
        `Seulement ${Math.floor(Math.random() * 5) + 1} exemplaires restants !`,
        `${Math.floor(Math.random() * 20) + 5} personnes regardent cet article !`
      ];
      showToast(messages[Math.floor(Math.random() * messages.length)], 'buyer');
    }, 5000 + Math.random() * 8000);
  }

  // === VIEWERS COUNTER ===
  function startViewersCounter() {
    setInterval(() => {
      vortexState.viewers += Math.floor(Math.random() * 5);
      updateViewersDisplay();
    }, 3000);
  }

  function updateViewersDisplay() {
    const el = $('#vortex-viewers-count');
    if (el) el.textContent = vortexState.viewers;
  }

  // === OFFER TIMER ===
  function startOfferTimer() {
    setInterval(() => {
      if (vortexState.offerTimer > 0) {
        vortexState.offerTimer--;
        updateTimerDisplay();
      } else {
        vortexState.offerTimer = 180;
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const el = $('#vortex-timer');
    if (el) {
      const mins = Math.floor(vortexState.offerTimer / 60);
      const secs = vortexState.offerTimer % 60;
      el.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      if (vortexState.offerTimer < 60) {
        el.classList.add('vortex-timer-urgent');
      } else {
        el.classList.remove('vortex-timer-urgent');
      }
    }
  }

  // === STATUS BAR ===
  function updateStatusBar() {
    const status = getCurrentStatus();
    const nextStatus = getNextStatus();
    const count = getCartCount();
    
    const statusBar = $('#vortex-status-bar');
    if (!statusBar) return;

    const statusName = $('#vortex-status-name');
    const statusProgress = $('#vortex-status-progress');
    const statusMessage = $('#vortex-status-message');
    const statusIcon = $('#vortex-status-icon');

    if (statusName) {
      statusName.textContent = status.name;
      statusName.style.color = status.color;
    }

    if (statusProgress && nextStatus) {
      const progress = ((count - status.min) / (nextStatus.min - status.min)) * 100;
      statusProgress.style.width = Math.min(progress, 100) + '%';
      statusProgress.style.background = status.color;
    }

    if (statusMessage) {
      if (nextStatus) {
        const remaining = nextStatus.min - count;
        statusMessage.textContent = `Plus que ${remaining} article${remaining > 1 ? 's' : ''} pour devenir "${nextStatus.name}" !`;
      } else {
        statusMessage.textContent = "Vous êtes au sommet de la hiérarchie consommateur !";
      }
    }

    if (statusIcon) {
      const icons = { none: '😐', star: '⭐', shine: '✨', confetti: '🎉', emperor: '👑' };
      statusIcon.textContent = icons[status.effect] || '😐';
    }

    if (status.effect === 'emperor') {
      statusBar.classList.add('vortex-emperor-mode');
      document.body.classList.add('vortex-screen-shake');
      setTimeout(() => document.body.classList.remove('vortex-screen-shake'), 500);
    } else {
      statusBar.classList.remove('vortex-emperor-mode');
    }
  }

  // === CART ===
  function addToCart(item, type = 'paid') {
    const cartItem = {
      ...item,
      cartId: Date.now() + Math.random(),
      type: type
    };
    vortexState.cart.push(cartItem);
    playCashRegister();
    updateCartDisplay();
    updateStatusBar();

    const count = getCartCount();
    const prevStatus = STATUS_LEVELS.find(s => count - 1 >= s.min && count - 1 <= s.max);
    const newStatus = getCurrentStatus();
    if (prevStatus && newStatus && prevStatus.name !== newStatus.name) {
      playFanfare();
      burstVortexConfetti();
      showStatusUpgrade(newStatus);
    }

    if (count === 1) {
      setTimeout(() => showFreeItemsModal(), 800);
    }

    if (item.id === 1) {
      setTimeout(() => showSubstitutionModal(), 1200);
    }
  }

  function removeFromCart(cartId) {
    const idx = vortexState.cart.findIndex(i => i.cartId === cartId);
    if (idx > -1) {
      vortexState.cart.splice(idx, 1);
      updateCartDisplay();
      updateStatusBar();
    }
  }

  function autoAddItem() {
    const item = AUTO_ADD_ITEMS[Math.floor(Math.random() * AUTO_ADD_ITEMS.length)];
    const cartItem = {
      name: item.name,
      price: item.price,
      originalPrice: item.price * 10,
      cartId: Date.now() + Math.random(),
      type: 'auto'
    };
    vortexState.cart.push(cartItem);
    playCashRegister();
    updateCartDisplay();
    updateStatusBar();
    showToast(`"${item.name}" ajouté automatiquement pour votre protection !`, 'urgency');
  }

  function updateCartDisplay() {
    const countEl = $('#vortex-cart-count');
    const totalEl = $('#vortex-cart-total');
    const savedEl = $('#vortex-cart-saved');
    
    if (countEl) countEl.textContent = getCartCount();
    if (totalEl) totalEl.textContent = getCartTotal().toFixed(2) + '€';
    if (savedEl) {
      const saved = getOriginalTotal() - getCartTotal();
      savedEl.textContent = saved.toFixed(2) + '€';
    }

    const freeShippingBar = $('#vortex-free-shipping-bar');
    const freeShippingText = $('#vortex-free-shipping-text');
    if (freeShippingBar && freeShippingText) {
      const total = getCartTotal();
      const threshold = 5;
      if (total >= threshold) {
        freeShippingBar.style.width = '100%';
        freeShippingText.textContent = '🎁 Livraison GRATUITE débloquée + Cadeau mystère !';
        freeShippingText.classList.add('vortex-unlocked');
      } else {
        const remaining = (threshold - total).toFixed(2);
        freeShippingBar.style.width = ((total / threshold) * 100) + '%';
        freeShippingText.textContent = `Dépensez encore ${remaining}€ pour la livraison GRATUITE !`;
        freeShippingText.classList.remove('vortex-unlocked');
      }
    }
  }

  // === MODALS ===
  function showFreeItemsModal() {
    if (vortexState.freeItemsChosen >= 3) return;
    
    const modal = document.createElement('div');
    modal.className = 'vortex-modal-overlay';
    modal.innerHTML = `
      <div class="vortex-modal vortex-modal-free">
        <div class="vortex-modal-confetti"></div>
        <h2 class="vortex-modal-title">🎉 FÉLICITATIONS ! 🎉</h2>
        <p class="vortex-modal-subtitle">Votre premier achat débloque <strong>3 articles GRATUITS</strong> !</p>
        <p class="vortex-modal-subtitle-small">Choisissez vos cadeaux (${3 - vortexState.freeItemsChosen} restant${3 - vortexState.freeItemsChosen > 1 ? 's' : ''}) :</p>
        <div class="vortex-free-items-grid">
          ${FREE_ITEMS.map((item, idx) => `
            <button class="vortex-free-item" data-idx="${idx}">
              <span class="vortex-free-item-name">${item.name}</span>
              <span class="vortex-free-item-price"><s>${item.originalPrice.toFixed(2)}€</s> GRATUIT</span>
            </button>
          `).join('')}
        </div>
        <button class="vortex-modal-skip">Non merci, je refuse mes cadeaux gratuits</button>
      </div>
    `;
    document.body.appendChild(modal);
    burstVortexConfetti(['#00ff00', '#ffd700', '#ff6600']);

    $$('.vortex-free-item', modal).forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        const item = FREE_ITEMS[idx];
        addToCart({ name: item.name, price: 0, originalPrice: item.originalPrice }, 'free');
        vortexState.freeItemsChosen++;
        btn.disabled = true;
        btn.classList.add('vortex-free-item-selected');
        if (vortexState.freeItemsChosen >= 3) {
          setTimeout(() => modal.remove(), 500);
        }
      };
    });

    $('.vortex-modal-skip', modal).onclick = () => modal.remove();
  }

  function showSubstitutionModal() {
    const modal = document.createElement('div');
    modal.className = 'vortex-modal-overlay';
    modal.innerHTML = `
      <div class="vortex-modal vortex-modal-substitution">
        <h2 class="vortex-modal-title">⚡ ATTENDEZ ! ⚡</h2>
        <p class="vortex-modal-subtitle">Pour seulement <strong>0,20€ de plus</strong>, obtenez :</p>
        <div class="vortex-substitution-offer">
          <div class="vortex-substitution-item">✅ Pack de 10 câbles USB-C</div>
          <div class="vortex-substitution-item">✅ Lampe LED de lecture OFFERTE</div>
          <div class="vortex-substitution-item">✅ Étui de transport Premium</div>
        </div>
        <div class="vortex-substitution-prices">
          <span class="vortex-original-price"><s>149,97€</s></span>
          <span class="vortex-new-price">1,09€</span>
        </div>
        <button class="vortex-btn-accept vortex-btn-pulse">OUI ! Je veux ce deal incroyable !</button>
        <button class="vortex-btn-refuse">Non, je préfère payer plus cher pour moins</button>
      </div>
    `;
    document.body.appendChild(modal);

    $('.vortex-btn-accept', modal).onclick = () => {
      addToCart({ name: "Pack 10 câbles USB-C + Lampe LED + Étui", price: 1.09, originalPrice: 149.97 }, 'paid');
      modal.remove();
    };
    $('.vortex-btn-refuse', modal).onclick = () => modal.remove();
  }

  function showGuiltModal(item, onKeep) {
    const sins = Object.keys(GUILT_MESSAGES);
    const sin = sins[Math.floor(Math.random() * sins.length)];
    const guilt = GUILT_MESSAGES[sin];

    const modal = document.createElement('div');
    modal.className = 'vortex-modal-overlay vortex-guilt-modal';
    modal.innerHTML = `
      <div class="vortex-modal vortex-modal-guilt">
        <div class="vortex-guilt-header">⚠️ ATTENTION !</div>
        <p class="vortex-guilt-message">${guilt.message}</p>
        ${sin === 'urgence' ? '<div class="vortex-guilt-countdown" id="guilt-countdown">00:59</div>' : ''}
        ${sin === 'environnement' ? '<div class="vortex-panda">🐼💔</div>' : ''}
        <div class="vortex-guilt-savings">
          Vous perdez <strong>${(Math.random() * 40 + 10).toFixed(2)}€</strong> de réduction immédiate !
        </div>
        <button class="vortex-btn-keep vortex-btn-pulse">${guilt.button}</button>
        <button class="vortex-btn-remove">Je préfère payer plus cher et perdre mes avantages</button>
      </div>
    `;
    document.body.appendChild(modal);

    if (sin === 'urgence') {
      let countdown = 59;
      const countdownEl = $('#guilt-countdown', modal);
      const interval = setInterval(() => {
        countdown--;
        if (countdownEl) countdownEl.textContent = `00:${countdown.toString().padStart(2, '0')}`;
        if (countdown <= 0) clearInterval(interval);
      }, 1000);
    }

    $('.vortex-btn-keep', modal).onclick = () => {
      modal.remove();
      if (onKeep) onKeep();
    };

    $('.vortex-btn-remove', modal).onclick = () => {
      modal.remove();
      showSecondGuiltModal(item);
    };
  }

  function showSecondGuiltModal(item) {
    const modal = document.createElement('div');
    modal.className = 'vortex-modal-overlay';
    modal.innerHTML = `
      <div class="vortex-modal vortex-modal-guilt-2">
        <h2 class="vortex-modal-title">😢 Êtes-vous VRAIMENT sûr ?</h2>
        <p class="vortex-guilt-message">Votre statut "<strong>${getCurrentStatus().name}</strong>" sera rétrogradé à "Client Basique".</p>
        <p class="vortex-guilt-message-small">Les autres clients vous regarderont avec pitié.</p>
        <button class="vortex-btn-keep vortex-btn-pulse">Non, je garde mon statut d'élite !</button>
        <button class="vortex-btn-remove-final">Oui, rétrogradez-moi (honte acceptée)</button>
      </div>
    `;
    document.body.appendChild(modal);

    $('.vortex-btn-keep', modal).onclick = () => modal.remove();
    $('.vortex-btn-remove-final', modal).onclick = () => {
      removeFromCart(item.cartId);
      modal.remove();
    };
  }

  function showStatusUpgrade(status) {
    const modal = document.createElement('div');
    modal.className = 'vortex-status-upgrade';
    modal.innerHTML = `
      <div class="vortex-status-upgrade-content">
        <div class="vortex-status-icon-big">${status.effect === 'emperor' ? '👑' : '🎉'}</div>
        <h2>NIVEAU SUPÉRIEUR !</h2>
        <p>Vous êtes maintenant</p>
        <h3 style="color:${status.color}">${status.name}</h3>
        <p class="vortex-status-subtitle">Vous faites partie de l'élite des consommateurs !</p>
      </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('vortex-status-upgrade-visible'), 50);
    setTimeout(() => {
      modal.classList.remove('vortex-status-upgrade-visible');
      setTimeout(() => modal.remove(), 500);
    }, 3000);
  }

  // === FLEEING BUTTON ===
  function setupFleeingButton(btn) {
    let hoverCount = 0;
    btn.addEventListener('mouseenter', () => {
      if (getCartCount() < 15 && hoverCount < 3) {
        hoverCount++;
        const x = (Math.random() > 0.5 ? 1 : -1) * (50 + Math.random() * 100);
        const y = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 50);
        btn.style.transform = `translate(${x}px, ${y}px)`;
        if (hoverCount >= 3) {
          setTimeout(() => {
            btn.style.transform = '';
            showLastChanceModal();
          }, 300);
        }
      }
    });
    btn.addEventListener('mouseleave', () => {
      if (hoverCount < 3) btn.style.transform = '';
    });
  }

  function showLastChanceModal() {
    const modal = document.createElement('div');
    modal.className = 'vortex-modal-overlay';
    modal.innerHTML = `
      <div class="vortex-modal vortex-modal-last-chance">
        <h2 class="vortex-modal-title">🚨 ATTENDEZ ! Ne partez pas les mains vides !</h2>
        <p class="vortex-modal-subtitle">Un mystérieux donateur vous offre un cadeau exclusif !</p>
        <div class="vortex-last-chance-gift">
          <span class="vortex-gift-icon">🎁</span>
          <span class="vortex-gift-name">${VORTEX_PRODUCTS[Math.floor(Math.random() * VORTEX_PRODUCTS.length)].name}</span>
          <span class="vortex-gift-price">GRATUIT</span>
        </div>
        <button class="vortex-btn-accept vortex-btn-pulse">Accepter mon cadeau !</button>
        <button class="vortex-btn-refuse">Refuser ce généreux don</button>
      </div>
    `;
    document.body.appendChild(modal);

    $('.vortex-btn-accept', modal).onclick = () => {
      const product = VORTEX_PRODUCTS[Math.floor(Math.random() * VORTEX_PRODUCTS.length)];
      addToCart({ name: product.name, price: 0, originalPrice: product.originalPrice }, 'free');
      modal.remove();
    };
    $('.vortex-btn-refuse', modal).onclick = () => modal.remove();
  }

  // === CHECKOUT ===
  function showCheckout() {
    vortexState.currentView = 'checkout';
    autoAddItem();
    autoAddItem();

    const view = $('#view-vortex');
    view.innerHTML = generateCheckoutHTML();

    const payBtn = $('#vortex-pay-btn');
    if (payBtn) {
      setupFleeingButton(payBtn);
      payBtn.onclick = () => {
        if (getCartCount() < 15) {
          showLastChanceModal();
          return;
        }
        startPaymentAnimation();
      };
    }

    $('#vortex-back-to-shop')?.addEventListener('click', () => {
      vortexState.currentView = 'shop';
      renderVortexShop();
    });

    startCheckoutChaos();
  }

  function generateCheckoutHTML() {
    const total = getCartTotal();
    const original = getOriginalTotal();
    const saved = original - total;
    const discount = ((saved / original) * 100).toFixed(1);

    return `
      <div class="vortex-checkout">
        <div class="vortex-checkout-header">
          <h1>🏆 RÉCAPITULATIF DE VOTRE CONQUÊTE 🏆</h1>
          <p class="vortex-checkout-subtitle">Vous n'achetez pas des produits, vous construisez un empire de plastique.</p>
        </div>
        
        <div class="vortex-checkout-stats">
          <div class="vortex-stat">
            <span class="vortex-stat-value">${getCartCount()}</span>
            <span class="vortex-stat-label">Articles</span>
          </div>
          <div class="vortex-stat">
            <span class="vortex-stat-value">${(getCartCount() * 0.8).toFixed(0)} kg</span>
            <span class="vortex-stat-label">Poids total</span>
          </div>
          <div class="vortex-stat">
            <span class="vortex-stat-value">${(getCartCount() * 0.05).toFixed(1)} m³</span>
            <span class="vortex-stat-label">Volume</span>
          </div>
        </div>

        <div class="vortex-checkout-logistics">
          <p>📦 Expédition via <strong>${Math.ceil(getCartCount() / 20)} porte-conteneur(s)</strong> et <strong>1 drone privé</strong></p>
        </div>

        <div class="vortex-checkout-cart">
          <div class="vortex-cart-scroll">
            ${vortexState.cart.map(item => `
              <div class="vortex-cart-item vortex-cart-item-${item.type}">
                <span class="vortex-cart-item-name">${item.name}</span>
                <span class="vortex-cart-item-price">${item.price.toFixed(2)}€</span>
                <span class="vortex-cart-item-type">${item.type === 'free' ? '🎁' : item.type === 'auto' ? '🛡️' : ''}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="vortex-checkout-prices">
          <div class="vortex-price-row vortex-price-original">
            <span>Prix Initial Total :</span>
            <span class="vortex-strike">${original.toFixed(2)}€</span>
          </div>
          <div class="vortex-price-row vortex-price-discount">
            <span>Remise "Vortex-Elite" :</span>
            <span class="vortex-discount">-${saved.toFixed(2)}€</span>
          </div>
          <div class="vortex-price-row vortex-price-total">
            <span>Total à payer :</span>
            <span class="vortex-total">${total.toFixed(2)}€</span>
          </div>
          <p class="vortex-savings-message">✨ Vous avez économisé ${discount}% ! Vous avez littéralement ruiné nos fournisseurs.</p>
        </div>

        <div class="vortex-checkout-buttons">
          <button id="vortex-pay-btn" class="vortex-pay-btn vortex-btn-rainbow">
            💳 CONFIRMER L'ACHAT 💳
          </button>
          <button id="vortex-back-to-shop" class="vortex-back-btn">← Continuer mes achats</button>
        </div>

        <div class="vortex-checkout-footer">
          <div class="vortex-footer-stat">
            <span>Énergie dépensée :</span>
            <span>${(getCartCount() * 200).toLocaleString()} Joules de clics</span>
          </div>
          <div class="vortex-footer-stat">
            <span>Rang Mondial :</span>
            <span>#1 Consommateur du jour</span>
          </div>
          <div class="vortex-footer-stat">
            <span>Temps gagné :</span>
            <span>"Toute une vie de shopping en 4 minutes"</span>
          </div>
        </div>
      </div>
    `;
  }

  function startCheckoutChaos() {
    const interval = setInterval(() => {
      if (vortexState.currentView !== 'checkout') {
        clearInterval(interval);
        return;
      }
      const total = getCartTotal();
      if (total > 10) {
        const newTotal = total - 0.01;
        const randomItem = AUTO_ADD_ITEMS[Math.floor(Math.random() * AUTO_ADD_ITEMS.length)];
        vortexState.cart.push({
          name: randomItem.name,
          price: randomItem.price,
          originalPrice: randomItem.price * 5,
          cartId: Date.now() + Math.random(),
          type: 'auto'
        });
        showCheckout();
      }
    }, 3000);
  }

  function startPaymentAnimation() {
    const modal = document.createElement('div');
    modal.className = 'vortex-payment-modal';
    modal.innerHTML = `
      <div class="vortex-payment-content">
        <div class="vortex-payment-spinner"></div>
        <p id="vortex-payment-status">Vérification de la solvabilité émotionnelle...</p>
        <div class="vortex-payment-bar">
          <div class="vortex-payment-progress" id="vortex-payment-progress"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    burstVortexConfetti();

    const messages = [
      "Vérification de la solvabilité émotionnelle...",
      "Connexion aux satellites de paiement...",
      "Calcul de l'empreinte consumériste...",
      "Validation par le Conseil des Algorithmes...",
      "Activation du protocole de gratification instantanée...",
      "Génération de votre diplôme d'excellence..."
    ];

    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx >= messages.length) {
        clearInterval(interval);
        setTimeout(() => {
          modal.remove();
          showSuccessScreen();
        }, 1000);
        return;
      }
      $('#vortex-payment-status', modal).textContent = messages[idx];
      $('#vortex-payment-progress', modal).style.width = ((idx / messages.length) * 100) + '%';
    }, 1500);
  }

  // === SUCCESS SCREEN ===
  function showSuccessScreen() {
    vortexState.currentView = 'success';
    playJackpot();
    burstVortexConfetti(['#ffd700', '#ff6600', '#00ff00', '#ff00ff']);

    const view = $('#view-vortex');
    const total = getCartTotal();
    const original = getOriginalTotal();
    const saved = original - total;
    const count = getCartCount();

    view.innerHTML = `
      <div class="vortex-success">
        <div class="vortex-success-bg"></div>
        <div class="vortex-success-content">
          <div class="vortex-success-crown">👑</div>
          <h1 class="vortex-success-title">TRANSACTION ACCOMPLIE</h1>
          <p class="vortex-success-subtitle">Vous avez transcendé le commerce ordinaire.</p>
          
          <div class="vortex-sin-report">
            <h2>📊 RAPPORT DES 7 PÉCHÉS</h2>
            <div class="vortex-sin-item">
              <span class="vortex-sin-name">Gourmandise</span>
              <div class="vortex-sin-bar"><div class="vortex-sin-fill" style="width:100%"></div></div>
              <span class="vortex-sin-text">${count} objets accumulés. Votre faim de plastique est insatiable.</span>
            </div>
            <div class="vortex-sin-item">
              <span class="vortex-sin-name">Avarice</span>
              <div class="vortex-sin-bar"><div class="vortex-sin-fill" style="width:100%"></div></div>
              <span class="vortex-sin-text">Vous avez "économisé" ${saved.toFixed(2)}€. Virtuellement riche (mais réellement pauvre de ${total.toFixed(2)}€).</span>
            </div>
            <div class="vortex-sin-item">
              <span class="vortex-sin-name">Orgueil</span>
              <div class="vortex-sin-bar"><div class="vortex-sin-fill" style="width:100%"></div></div>
              <span class="vortex-sin-text">Statut ${getCurrentStatus().name} atteint. 99,9% de l'humanité possède moins de gadgets inutiles.</span>
            </div>
            <div class="vortex-sin-item">
              <span class="vortex-sin-name">Envie</span>
              <div class="vortex-sin-bar"><div class="vortex-sin-fill" style="width:100%"></div></div>
              <span class="vortex-sin-text">Partagez votre panier pour rendre vos amis malades de jalousie.</span>
            </div>
            <div class="vortex-sin-item">
              <span class="vortex-sin-name">Paresse</span>
              <div class="vortex-sin-bar"><div class="vortex-sin-fill" style="width:100%"></div></div>
              <span class="vortex-sin-text">Livraison par drone prévue à l'intérieur de votre salon.</span>
            </div>
          </div>

          <div class="vortex-certificate">
            <div class="vortex-certificate-border">
              <h3>🏆 CERTIFICAT D'EXCELLENCE 🏆</h3>
              <p>Certifié <strong>Maître de l'Accumulation Compulsive</strong></p>
              <p class="vortex-certificate-signed">Signé par l'Algorithme</p>
            </div>
          </div>

          <p class="vortex-success-quote">
            "Félicitations, cher sujet. Vous avez transformé vos impulsions en données, et vos données en profit. 
            Votre colis arrivera entre demain et dans six mois. En attendant, n'oubliez pas : 
            ce que vous possédez finit par vous posséder. Voulez-vous une autre brosse à dents à 0,10€ ?"
          </p>

          <button id="vortex-restart" class="vortex-restart-btn vortex-btn-pulse">
            🔄 RECOMMENCER POUR BATTRE VOTRE SCORE
          </button>

          <button id="vortex-back-home" class="vortex-home-btn">
            Retour à l'accueil
          </button>
        </div>
      </div>
    `;

    $('#vortex-restart')?.addEventListener('click', () => {
      resetVortex();
      renderVortexShop();
    });

    $('#vortex-back-home')?.addEventListener('click', () => {
      resetVortex();
      showView('selector');
    });

    setupExitTrap();
  }

  function setupExitTrap() {
    const handler = (e) => {
      if (vortexState.currentView !== 'success') {
        document.removeEventListener('mouseleave', handler);
        return;
      }
      showLoyaltyGiftModal();
    };
    document.addEventListener('mouseleave', handler);
  }

  function showLoyaltyGiftModal() {
    if (document.querySelector('.vortex-loyalty-modal')) return;
    
    const modal = document.createElement('div');
    modal.className = 'vortex-modal-overlay vortex-loyalty-modal';
    modal.innerHTML = `
      <div class="vortex-modal">
        <h2 class="vortex-modal-title">🎁 ATTENDEZ !</h2>
        <p class="vortex-modal-subtitle">Vous avez oublié votre cadeau de fidélité gratuit !</p>
        <button class="vortex-btn-accept vortex-btn-pulse">Réclamer mon cadeau</button>
        <button class="vortex-btn-refuse">Non merci</button>
      </div>
    `;
    document.body.appendChild(modal);

    $('.vortex-btn-accept', modal).onclick = () => {
      modal.remove();
      resetVortex();
      addToCart(VORTEX_PRODUCTS[Math.floor(Math.random() * VORTEX_PRODUCTS.length)], 'free');
      renderVortexShop();
    };
    $('.vortex-btn-refuse', modal).onclick = () => modal.remove();
  }

  // === RENDER SHOP ===
  function renderVortexShop() {
    vortexState.currentView = 'shop';
    const view = $('#view-vortex');
    if (!view) return;

    view.innerHTML = `
      <div class="vortex-shop">
        <!-- Status Bar -->
        <div id="vortex-status-bar" class="vortex-status-bar">
          <div class="vortex-status-left">
            <span id="vortex-status-icon">😐</span>
            <span id="vortex-status-name">Acheteur Prudent</span>
          </div>
          <div class="vortex-status-center">
            <div class="vortex-status-progress-bg">
              <div id="vortex-status-progress" class="vortex-status-progress"></div>
            </div>
            <p id="vortex-status-message" class="vortex-status-message"></p>
          </div>
          <div class="vortex-status-right">
            <span class="vortex-viewers">🔥 <span id="vortex-viewers-count">${vortexState.viewers}</span> personnes regardent</span>
          </div>
        </div>

        <!-- Urgency Banner -->
        <div class="vortex-urgency-banner">
          <span class="vortex-urgency-flash">⚡</span>
          <span>OFFRE EXPIRE DANS : </span>
          <span id="vortex-timer" class="vortex-timer">3:00</span>
          <span class="vortex-urgency-flash">⚡</span>
        </div>

        <!-- Free Shipping Bar -->
        <div class="vortex-shipping-bar">
          <div class="vortex-shipping-progress-bg">
            <div id="vortex-free-shipping-bar" class="vortex-shipping-progress"></div>
          </div>
          <p id="vortex-free-shipping-text" class="vortex-shipping-text">Ajoutez un article pour débloquer la livraison GRATUITE !</p>
        </div>

        <!-- Products Grid -->
        <div class="vortex-products-grid">
          ${VORTEX_PRODUCTS.slice(0, 7).map(product => `
            <div class="vortex-product-card" data-id="${product.id}">
              <div class="vortex-product-tag">${product.tag}</div>
              <div class="vortex-product-image">
                <span class="vortex-product-emoji">${['📦', '💆', '🧊', '📱', '⌚', '🪥', '🌟'][product.id - 1] || '📦'}</span>
              </div>
              <h3 class="vortex-product-name">${product.name}</h3>
              <p class="vortex-product-desc">${product.description}</p>
              <div class="vortex-product-prices">
                <span class="vortex-original-price"><s>${product.originalPrice.toFixed(2)}€</s></span>
                <span class="vortex-current-price">${product.price.toFixed(2)}€</span>
              </div>
              <button class="vortex-add-btn" data-id="${product.id}">
                AJOUTER AU PANIER
              </button>
              <div class="vortex-product-viewers">👀 ${Math.floor(Math.random() * 200) + 50} personnes regardent</div>
            </div>
          `).join('')}
        </div>

        <!-- Cart Summary -->
        <div class="vortex-cart-summary">
          <div class="vortex-cart-info">
            <span class="vortex-cart-icon">🛒</span>
            <span><span id="vortex-cart-count">0</span> articles</span>
            <span class="vortex-cart-total">Total : <span id="vortex-cart-total">0.00€</span></span>
            <span class="vortex-cart-saved">Économisé : <span id="vortex-cart-saved">0.00€</span></span>
          </div>
          <div class="vortex-cart-buttons">
            <button id="vortex-continue-btn" class="vortex-continue-btn vortex-btn-blink">
              🛍️ CONTINUER MES ACHATS 🛍️
            </button>
            <button id="vortex-checkout-btn" class="vortex-checkout-btn">
              Voir mon panier
            </button>
          </div>
        </div>

        <!-- Back Button -->
        <button id="vortex-back-selector" class="vortex-back-selector">
          ← Retour à l'accueil
        </button>
      </div>
    `;

    $$('.vortex-add-btn').forEach(btn => {
      btn.onclick = () => {
        const id = parseInt(btn.dataset.id);
        const product = VORTEX_PRODUCTS.find(p => p.id === id);
        if (product) {
          addToCart(product, 'paid');
        }
      };
    });

    $('#vortex-continue-btn')?.addEventListener('click', () => {
      autoAddItem();
      showToast('Article de protection ajouté automatiquement !', 'urgency');
    });

    $('#vortex-checkout-btn')?.addEventListener('click', () => {
      if (getCartCount() === 0) {
        showToast('Votre panier est vide ! Ajoutez des articles.', 'info');
        return;
      }
      showCheckout();
    });

    $('#vortex-back-selector')?.addEventListener('click', () => {
      resetVortex();
      showView('selector');
    });

    updateCartDisplay();
    updateStatusBar();
  }

  function resetVortex() {
    vortexState = {
      cart: [],
      freeItemsChosen: 0,
      totalSaved: 0,
      currentView: 'shop',
      viewers: Math.floor(Math.random() * 500) + 100,
      offerTimer: 180,
      checkoutAttempts: 0,
      guiltModalShown: false,
      audioCtx: vortexState.audioCtx
    };
  }

  function showView(name) {
    if (window.showView && typeof window.showView === 'function') {
      window.showView(name);
    } else {
      $('#view-selector')?.classList.add('hidden');
      $('#view-test')?.classList.add('hidden');
      $('#view-self-growth')?.classList.add('hidden');
      $('#view-vortex')?.classList.add('hidden');

      if (name === 'selector') {
        $('#view-selector')?.classList.remove('hidden');
      } else if (name === 'vortex') {
        $('#view-vortex')?.classList.remove('hidden');
      }
    }
  }

  // === INIT ===
  function initVortex() {
    const vortexBtn = document.querySelector('[data-test="vortex"]');
    if (vortexBtn) {
      vortexBtn.addEventListener('click', () => {
        showView('vortex');
        renderVortexShop();
        startFakeBuyerNotifications();
        startViewersCounter();
        startOfferTimer();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVortex);
  } else {
    initVortex();
  }

  window.VortexShop = {
    init: initVortex,
    render: renderVortexShop,
    reset: resetVortex
  };

})();
