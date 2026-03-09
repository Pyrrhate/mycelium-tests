# Supabase : table profiles et narrative_roots (Racines Narratives)

La table `public.profiles` n’existe pas encore dans ton projet. Il faut d’abord la créer, puis la colonne **Racines Narratives** sera disponible.

## Dans le SQL Editor de Supabase

1. Ouvre ton projet sur [supabase.com](https://supabase.com) → **SQL Editor**.
2. Ouvre le fichier **`supabase-migrations-profiles-complet.sql`** à la racine du projet, copie tout son contenu, colle-le dans l’éditeur SQL.
3. Clique sur **Run**.

Ce script :

- Crée la table `public.profiles` (liée à `auth.users`)
- Active RLS et les politiques (lecture/écriture propre profil + lecture profils publics)
- Ajoute toutes les colonnes utilisées par l’app (XP, PS, totem, initiation, Constellation, Résonance, Matrice d’Intelligence, onboarding, Sceaux, **narrative_roots**)
- Ajoute le trigger pour créer une ligne `profiles` à chaque nouvel utilisateur

Aucune autre étape n’est nécessaire : après exécution, le bouton « Enregistrer » dans Mon profil / Racines Narratives mettra bien à jour la base.
