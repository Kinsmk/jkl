# Moto Rush 3D

Jeu de conduite urbaine en 3D, original et jouable dans un navigateur moderne sur PC, Android et iPhone. Cette première version est un prototype indépendant : elle ne reprend pas les personnages, la carte, les marques ni les ressources d'un autre jeu.

## Jouer

Ouvre `index.html` via un petit serveur web local, ou active GitHub Pages sur la branche publiée. La scène utilise Three.js depuis un CDN : une connexion Internet est nécessaire.

- **PC** : ZQSD ou flèches pour conduire, `Maj` pour le turbo, `Espace` pour freiner.
- **Mobile** : boutons tactiles à l'écran ; fais glisser sur la scène pour ajuster le regard.
- **Codes** : ouvre le panneau Codes pour enregistrer tes propres codes de bonus sur l'appareil. Codes inclus : `TURBO`, `REPARER`, `COULEUR`.

## Ce qui est inclus

- Scène 3D avec réseau routier et quartiers générés automatiquement.
- Bâtiments, lampadaires, circulation automobile, moto et pilote modélisés en formes 3D.
- Commandes clavier et tactiles, caméra à la troisième personne, vitesse et bonus.
- Codes personnalisables sauvegardés localement dans le navigateur.
- Interface responsive pensée pour ordinateur et téléphone.

## Lancer en local

Avec Python installé, depuis le dossier du projet :

```bash
python -m http.server 8000
```

Puis visite `http://localhost:8000`.

## Périmètre

C'est un point de départ jouable, pas un jeu complet de la taille d'un grand monde ouvert commercial. Le pilote est un modèle procédural stylisé, pas un humain photoréaliste. Les missions, sauvegardes de progression, modèles humains détaillés, sons, multijoueur, éditeur complet de ville et publication sur les boutiques mobiles restent des étapes possibles. Une page web responsive fonctionne sur mobile, mais une application installable/iOS/Android demanderait ensuite un empaquetage et des tests propres aux plateformes.
