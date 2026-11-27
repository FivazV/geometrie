# L'application « Maths » — le laboratoire de classe

Petite application installable (un grand F sur l'écran du téléphone), ouverte par QR code, sans compte. L'enseignant y
dépose des animations pour ses élèves et regarde comment ils s'en servent. C'est un **laboratoire** : on essaie vite,
on garde ce qui marche.

- En ligne : https://fivazv.github.io/geometrie/ (GitHub Pages, dépôt public `FivazV/geometrie`, dossier `docs/`).
- Ce projet est **à part de Déclic** : autre dépôt, autre fenêtre. Ce qu'on y apprend d'utile pour Déclic (l'accès par
  QR code, les réflexes des élèves) se note dans le projet Déclic, à la demande — pas l'inverse.

## Règles

- Tout en **français**, y compris les phrases entre deux actions. L'enseignant n'est pas développeur : expliquer simplement.
- Le dépôt est **public** : aucun nom d'élève, aucune production d'élève, aucune donnée de classe, aucun secret.
- Les animations sont les fichiers de l'enseignant : **jamais modifiées à la source**. Le script en fait une copie adaptée.
- Le nom d'un fichier publié (`fichier`) ne change plus une fois en ligne : des téléphones l'ont en mémoire.
- Aucun appel vers l'extérieur depuis le téléphone des élèves (les polices sont copiées dans le site).

## Ajouter une animation

1. Une ligne dans la liste `animations` de sa rubrique, dans `construire.mjs` (une rubrique peut avoir son propre
   `dossier` si ses fichiers ne sont pas dans celui de la tuile). Changer `VERSION`.
2. Construire — l'outil d'images vient du projet Déclic :
   `SHARP="C:/Users/Enseignant/Documents/Claude_Projets/Declic_Back_Office/declic-app/node_modules/sharp" node construire.mjs`
3. Vérifier dans Chrome, à la largeur d'un téléphone, avec et sans connexion :
   `PLAYWRIGHT="…/declic-app/node_modules/@playwright/test" CHROMIUM_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" node verifier.mjs`
   puis regarder une ou deux images dans `captures/`.
4. `git add` des chemins précis, commit, `git pull --rebase`, push. Une à deux minutes plus tard, vérifier que la page
   répond en ligne. Les élèves n'ont rien à mettre à jour : la nouvelle version arrive à l'ouverture suivante.

Les sources lues sont recopiées dans `sources/` : la construction marche même quand le disque externe est débranché.

## État au 26.11.2026

Deux tuiles. ESPACE (bleue), treize animations : quatre constructions au compas, deux explications sur les angles
(triangles, quadrilatères), sept corrections de remédiation. Laissés de côté : « Calculs d'angles ES94 » et l'évaluation
(trop lourde). GRANDEURS ET MESURES (verte, `grandeurs.html`), deux animations. La première : « Périmètre et aire : les notions
initiales » (27.11), écrite par Claude d'après le document de l'enseignant `E:/Ecole/Maths_F/GM_Notions_Initiales.docx`
et enregistrée à côté de lui (`GM_Notions_Initiales.html`) : c'est ce fichier qu'on retouche, puis on reconstruit.
Ces notions peuvent encore changer. Chaque tuile a sa `couleur` (liste `COULEURS` dans `construire.mjs`).

Si on retouche une animation pendant que E: est débranché (on modifie alors la copie de `sources/`), il faut recopier
ce fichier vers E: dès son retour et AVANT de construire : sinon la construction reprend l'ancienne version de E:.

Deuxième animation de GRANDEURS ET MESURES (rubrique « Le triangle », 27.11) : « Triangle – aire et périmètre »,
`E:/Ecole/Maths_F/GM_Triangle.html`, écrite par Claude et validée par l'enseignant. Elle montre le périmètre, puis
l'aire comme dh × dv divisé par 2 (triangle rectangle = moitié du rectangle), renommée base × hauteur sur 2, puis la
même formule pour le triangle quelconque et celui dont la hauteur tombe à l'extérieur. L'enseignant veut les
divisions écrites en **vraie fraction** (barre horizontale), jamais « / 2 ».

**Prévu** (demande de l'enseignant, 27.11) : une animation par surface connue, toujours avec l'approche
« distance horizontale × distance verticale » (des rangées de dh empilées sur dv). Elle sert ensuite à faire comprendre
pourquoi on divise par 2 pour le triangle, pourquoi on prend une base moyenne pour le trapèze, etc.
Le QR code et la feuille à projeter sont dans `qr/`.
