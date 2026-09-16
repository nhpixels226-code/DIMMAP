# DIMMAP — Plan d'implémentation UX

> Patterns @designmotionhq retenus pour la PWA DIMMAP, organisés en sprints progressifs.

---

## Sprint 1 : Fondations — Design System

Poser les bases CSS sur lesquelles tout le reste s'appuie.

- [ ] **Design Tokens complets** — Définir `--radius-sm/md/lg`, `--spacing-xs/sm/md/lg/xl`, `--shadow-1/2/3`, `--transition-fast/normal/slow`, `--font-size-xs/sm/md/lg/xl`. Remplacer toutes les valeurs en dur.
- [ ] **Form Field States** — Système CSS cohérent pour les 6 états de chaque input (default, focus, filled, error, disabled, read-only). Border-color + label animé + message d'erreur contextuel.
- [ ] **Border Radius unifié** — Éléments internes (chips, inputs) = `--radius-sm` (8px), cartes = `--radius-md` (12px), modales/sheets = `--radius-lg` (16px en haut).
- [ ] **Shadow Elevation 3 niveaux** — `--shadow-1` (cartes), `--shadow-2` (drawer, bottom sheet), `--shadow-3` (modal, toast). Adaptation dark mode (ombres → bordures subtiles).
- [ ] **Grid System** — Mettre en place une grille CSS simple mais structurée (CSS Grid ou flexbox avec tokens d'espacement) pour aligner les composants de chaque écran de manière cohérente, même sur un layout mobile single-column.
- [ ] **Icon Design Rules** — Définir un système d'icônes cohérent : épaisseur de trait uniforme, taille optique standardisée, style unique (outline ou filled, pas les deux). Appliquer sur les étapes du drawer, les catégories d'appareils et les boutons d'action.

---

## Sprint 2 : Feedback & Motion

Donner du "life" à l'interface.

- [ ] **Animation Timing standardisé** — Micro-interactions (chips, boutons) : 150ms `ease-out`. Transitions layout (step, drawer) : 300ms `cubic-bezier(0.4, 0, 0.2, 1)`. Modales/sheets : 350ms entrée / 250ms sortie.
- [ ] **Transitions entre écrans** — Slide gauche (avancer) / droite (reculer) entre les 6 steps. Durée 300ms, easing material.
- [ ] **Toggle & Chips animation** — Toggle dark mode : transition fluide 200ms. Chips installation/tension/régulateur : scale 0.95→1.0 + changement de couleur progressif au tap.
- [ ] **Card Press feedback** — `:active` sur les cartes appareils : `transform: scale(0.97)`, transition 100ms. Feedback tactile immédiat.
- [ ] **Skeleton Loading** — Écran Résultats (step 4) : blocs skeleton gris animés pendant 300-500ms avant de révéler les chiffres avec fade-in.
- [ ] **Gradient Design** — Introduire des dégradés subtils et stratégiques : fond de header, boutons CTA, indicateur de progression du stepper. Direction cohérente, couleurs adjacentes sur le cercle chromatique, jamais criard.

---

## Sprint 3 : Composants

Améliorer les composants clés.

- [ ] **Bottom Sheet catalogue** — Convertir le modal catalogue appareils en bottom sheet qui slide depuis le bas. Handle de drag en haut, fermeture par swipe down. Zone pouce naturelle.
- [ ] **Empty States illustrés** — Écran 1 vide : illustration SVG (panneau solaire + "Ajoutez votre premier appareil") + bouton CTA. Historique vide : même logique.
- [ ] **Undo UX** — Remplacer le double-clic suppression par : suppression directe + toast "Appareil supprimé" avec bouton "Annuler" pendant 5s.
- [ ] **Toast améliorés** — Empilage propre, durée adaptée (court 2s / long 4s), bouton annuler sur les actions destructives.
- [ ] **Input Masking & suffixes** — Suffixes visuels inline (W, h/j, pcs). Formatage grands nombres (1 500 W). `inputmode="numeric"` sur mobile.
- [ ] **Golden Ratio** — Appliquer le ratio 1.618 aux proportions des cartes de résultat, à la répartition contenu/espace dans les écrans, et au dimensionnement des éléments visuels clés (hero illustration, boutons CTA vs contenu).

---

## Sprint 4 : Polish

Finitions et cohérence.

- [ ] **Validation Timing** — Valider au `blur` ou après pause 500ms, jamais pendant la saisie. Erreur sous le champ avec fade-in, pas en alert.
- [ ] **Espacement Proximity Rule** — Groupes liés (pays + ville + HSP) visuellement proches. Groupes différents séparés par `--spacing-xl`. Tokens appliqués partout.
- [ ] **Visual Hierarchy résultats** — Chiffre principal (nb panneaux, capacité batterie) en gros + bold. Détails (formules, sous-calculs) en petit + gris. L'essentiel visible en < 2s.
- [ ] **White Space** — Audit de l'espace blanc sur chaque écran. Ajouter de la respiration entre les sections, surtout sur les écrans denses (Résultats, Coûts).
- [ ] **Color Accessibility** — Audit contrastes light + dark mode. Minimum 4.5:1 texte, 3:1 éléments UI. Vérifier `--warn` et `--primary` sur toutes les surfaces.
- [ ] **Dark Mode affiné** — Réduire luminosité des surfaces plutôt qu'inverser. Ombres → bordures subtiles en dark. Couleurs d'accent légèrement éclaircies.

---

## Bonus V2 — Nice-to-have

- [ ] **Optimistic UI** — Feedback instantané sur sauvegarde localStorage et export PDF.
- [ ] **Filter Chips améliorés** — Compteur par chip ("Éclairage (4)"), animation au tap, état sélectionné renforcé.
- [ ] **Presets numériques** — Chips rapides pour les champs récurrents (heures : 4h / 8h / 12h / 24h) au lieu de saisie manuelle.
- [ ] **Scroll-Driven Animations** — Écran Résultats : cartes animées au scroll (fade-in + slide-up), CSS pur.
- [ ] **Microcopy contextuel** — "Suivant" → "Choisir le site". Placeholders guides ("Ex: 65 W").
- [ ] **Focus States** — Outline visible, piège de focus dans modales/sheets, `Escape` pour fermer.
- [ ] **Serial Position** — Total FCFA en haut ET en bas du devis (step 5).

---

*26 patterns retenus sur 75+ · Source : @designmotionhq × contexte DIMMAP*
