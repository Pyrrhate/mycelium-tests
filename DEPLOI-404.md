# Corriger la 404 après connexion (déploiement web)

Si après connexion vous obtenez **404 NOT_FOUND** au lieu du Mycélium Hub, c’est que l’URL de redirection ne correspond pas à votre déploiement.

## Solution

Dans **index.html** (page d’accueil), éditez la balise :

```html
<meta name="mycelium-hub-url" content="" />
```

- **Si le Hub React est servi à la racine** (ex. Vercel/Netlify qui build `mycelium-app` et servent à `/`) :
  ```html
  <meta name="mycelium-hub-url" content="/" />
  ```

- **Si tout le repo est servi** (ex. Laragon, `mycelium-tests/` à la racine) : laissez `content=""` pour utiliser `mycelium-app/dist/index.html`. Pensez à **builder** l’app React avant déploiement :
  ```bash
  cd mycelium-app && npm run build
  ```
  et à déployer le dossier `mycelium-app/dist/` (ou à avoir une étape de build qui le génère sur le serveur).

## Migration Supabase V6

Pour activer les profils publics, l’XP et les étapes d’initiation, exécutez **supabase-migrations-v6.sql** dans l’éditeur SQL de votre projet Supabase (après avoir exécuté supabase-migrations.sql).
