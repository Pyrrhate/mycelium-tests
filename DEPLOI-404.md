# Corriger la 404 après connexion (déploiement web)

Si après connexion vous obtenez **404 NOT_FOUND** au lieu du Mycélium Hub, c’est que l’URL de redirection ne correspond pas à votre déploiement.

## Comportement automatique

- **En local** (localhost / 127.0.0.1) : redirection vers `mycelium-app/dist/index.html` (pensez à faire `npm run build` dans `mycelium-app`).
- **En production** (ex. mycelium.gcanva.art) : redirection vers **`/`** par défaut pour éviter la 404.

Votre hébergeur doit donc **servir l’app React à la racine** (ex. build de `mycelium-app` avec sortie à la racine du site). Si la racine pointe encore vers la page d’accueil vanilla, configurez le build pour que la SPA React soit à `/`.

## Configuration manuelle (optionnel)

Dans **index.html** (page d’accueil), vous pouvez forcer l’URL du Hub :

```html
<meta name="mycelium-hub-url" content="" />
```

- **Hub à la racine** (recommandé en prod) : `content="/"` (ou laissez vide sur un domaine distant, c’est le défaut).
- **Hub dans un sous-dossier** : par ex. `content="/app/"` si votre build est exposé dans `/app/`.

## Migration Supabase V6

Pour activer les profils publics, l’XP et les étapes d’initiation, exécutez **supabase-migrations-v6.sql** dans l’éditeur SQL de votre projet Supabase (après avoir exécuté supabase-migrations.sql).

---

## Configurer Supabase sur mycelium-app.gcanva.art

Si l’app affiche « Supabase n’est pas configuré », il faut donner l’URL et la clé anon au build ou au chargement.

### Option 1 : Variables d’environnement au build (recommandé)

Sur votre plateforme (Cloudflare Pages, Vercel, Netlify…), ajoutez :

- `VITE_SUPABASE_URL` = `https://votre-projet.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = votre clé anon (publique)

Puis refaites un build et un déploiement. Les valeurs sont prises en compte au build.

### Option 2 : Fichier de config au chargement (sans rebuild)

1. Dans le projet **mycelium-app**, copiez `public/supabase-config.example.js` en `public/supabase-config.js`.
2. Éditez `public/supabase-config.js` et remplacez par l’URL et la clé de votre projet Supabase :
   ```js
   window.__MYCELIUM_SUPABASE__ = {
     url: 'https://VOTRE-PROJET.supabase.co',
     anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   };
   ```
3. Lancez `npm run build` dans mycelium-app. Le fichier est copié dans `dist/` (à la racine du site déployé).
4. Déployez le contenu de `dist/` sur mycelium-app.gcanva.art.

Le fichier `supabase-config.js` est ignoré par Git pour ne pas commiter la clé. Utilisez l’option 1 si votre hébergeur permet de définir des variables d’environnement au build.
