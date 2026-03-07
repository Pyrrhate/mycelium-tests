# Mycélium - The Self-Growth Network

Application web interactive (SPA) : **test de personnalité poétique** basé sur 7 pôles représentés par des créatures hybrides. Test honnête et analytique.

## Lancer l’appli

```bash
cd mycelium-self-growth
npm install
npm run dev
```

Puis ouvrir l’URL affichée (souvent `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Fonctionnalités

- **Accueil** : présentation sobre, bouton « Commencer le test ».
- **7 questions** : une par écran, échelle -2 (Vide) à +2 (Dominance), avec 0 = Équilibre.
- **Effets** : particules type spores en arrière-plan (plus actives vers les extrêmes), son cristallin à l’équilibre (0), titre de question qui change de couleur selon la réponse, transitions type « respiration ».
- **Résultats** : graphique radar (Chart.js) avec couleurs dynamiques (or à 0, rouge excès, bleu vide), interprétation textuelle, synthèse selon le profil.
- **Glossaire** : clic sur un sommet du radar pour afficher la description poétique de la créature.
- **Exporter mon Mycélium** : capture de la zone résultats en PNG (html2canvas).
- **Méditer sur ce résultat** : affichage épuré (graphique + créature au clic) et lecture d’une ambiance sonore en boucle si le fichier est présent (voir ci‑dessous).

## Son d’ambiance (optionnel)

En mode « Méditer sur ce résultat », l’app tente de jouer `/forest.mp3` en boucle. Pour l’activer :

- Ajouter un fichier `forest.mp3` dans le dossier **`public/`** du projet.

Sans ce fichier, le mode méditation fonctionne quand même, sans son.

## Stack

- React 19, Vite 7
- Tailwind CSS v4 (thème : Abyssal, Obsidian, Mycélium Gold, Amber Fire, Ether Blue, Bone)
- Framer Motion (animations)
- Chart.js + react-chartjs-2 (radar)
- Lucide React (icônes)
- html2canvas (export PNG)

## Charte visuelle

- **Fond** : #070B0A (Abyssal Green), dégradé radial qui suit la souris.
- **Surfaces** : verre dépoli (backdrop-blur, bordure légère).
- **Équilibre** : #D4AF37 (Mycélium Gold).
- **Excès** : #E63946 (Amber Fire).
- **Vide** : #457B9D (Ether Blue).
- **Texte** : #F1F1E6 (Bone White).
- **Typo** : Playfair Display / Cinzel (titres), Inter (corps), JetBrains Mono (scores).
- **Grain** : filtre de grain léger sur toute l’app (effet pellicule).
