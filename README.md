# Chez Gus — Site web

Site vitrine de la friterie **Chez Gus** (37 Avenue Paul Pastur, 7350 Thulin / Hensies, Belgique).

Site statique en **HTML / CSS / JavaScript** (sans build, sans framework). Démo en ligne : https://chezgusdemo.netlify.app

## Pages
- `index.html` — accueil (hero, atouts, aperçu carte, galerie, avis, infos & contact)
- `carte.html` — la carte complète (catégories + prix)
- `nouveautes.html` — les nouveautés (nouveaux burgers)

## Fichiers
- `styles.css` — tout le style du site
- `script.js` — animations et interactions (galerie, lightbox, menu)
- `assets/logo.png` — le logo
- `_headers` — réglages de cache pour Netlify

## Comment modifier
Tout se modifie directement dans les fichiers `.html` (texte, prix, plats) et `styles.css` (couleurs, style).

- **Ajouter un plat à la carte** : dans `carte.html`, cherche `<!-- Pour ajouter un plat` et copie une ligne.
- **Ajouter une nouveauté** : dans `nouveautes.html`, cherche `<!-- Pour ajouter une nouveauté` et copie un bloc.

## Mise en ligne
Le site se déploie sur **Netlify** (dossier à publier : la racine de ce dépôt).
