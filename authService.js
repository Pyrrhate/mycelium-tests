/**
 * Mycélium - Temple de l'Initiation (Auth)
 * Gestion de la session Supabase Auth et redirection vers l'Espace de Sève.
 */
window.authService = (function () {
  function getClient() {
    return window.supabaseClient;
  }

  /**
   * Retourne la session courante (ou null).
   * Équivalent "useSession" : à appeler au chargement et via onAuthChange.
   */
  function getSession() {
    var client = getClient();
    if (!client || !client.auth) return Promise.resolve(null);
    return client.auth.getSession().then(function (res) {
      return res.data && res.data.session ? res.data.session : null;
    });
  }

  /**
   * Inscription Email / Clé de Conscience (mot de passe).
   * Libellé : "Prêter Serment (S'Inscrire)"
   */
  function signUp(email, password, metadata) {
    var client = getClient();
    if (!client || !client.auth) return Promise.reject(new Error('Supabase non disponible'));
    return client.auth.signUp({
      email: email,
      password: password,
      options: metadata ? { data: metadata } : undefined
    });
  }

  /**
   * Connexion. Libellé : "Entrer dans le Réseau"
   */
  function signIn(email, password) {
    var client = getClient();
    if (!client || !client.auth) return Promise.reject(new Error('Supabase non disponible'));
    return client.auth.signInWithPassword({ email: email, password: password });
  }

  /**
   * Déconnexion
   */
  function signOut() {
    var client = getClient();
    if (!client || !client.auth) return Promise.resolve();
    return client.auth.signOut();
  }

  /**
   * Abonnement aux changements d'auth (session persistée).
   * callback(session) avec session null si déconnecté.
   */
  function onAuthChange(callback) {
    var client = getClient();
    if (!client || !client.auth) {
      if (callback) callback(null);
      return function () {};
    }
    var sub = client.auth.onAuthStateChange(function (event, session) {
      if (callback) callback(session);
    });
    return function () {
      if (sub && sub.data && sub.data.subscription) sub.data.subscription.unsubscribe();
    };
  }

  /**
   * Récupère l'utilisateur courant (depuis la session).
   */
  function getUser() {
    var client = getClient();
    if (!client || !client.auth) return Promise.resolve(null);
    return client.auth.getUser().then(function (res) {
      return res.data && res.data.user ? res.data.user : null;
    });
  }

  return {
    getSession: getSession,
    getUser: getUser,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    onAuthChange: onAuthChange
  };
})();
