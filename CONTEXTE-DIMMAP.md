# DIMMAP — Contexte projet pour Claude

## Vue d'ensemble

**DIMMAP** (Dimensionnement Solaire PV) est une application web progressive (PWA) de dimensionnement d'installations solaires photovoltaiques destinee au marche africain. Elle permet a un utilisateur de saisir ses appareils electriques, sa localisation, et d'obtenir un dimensionnement complet (panneaux, batteries, regulateur, onduleur) avec estimation des couts en FCFA.

- **URL de production** : deploye sur GitHub Pages depuis la branche `master`
- **Repo** : `nhpixels226-code/DIMMAP`
- **Langue** : interface 100% francais, **reponses et raisonnement en francais**
- **Monnaie** : FCFA (Franc CFA)
- **Catalogue materiel** : base sur Felicity Solar / ASEC TECH-BF (Burkina Faso)

---

## Architecture technique

### Stack
- **Vanilla HTML/CSS/JS** — aucun framework, aucun build tool
- **PWA** avec service worker (strategie network-first, fallback cache)
- **Single-page** : 1 fichier HTML, navigation par stepper JS
- **Responsive** : design mobile-first, cadre "phone" sur desktop (max-width 480px)

### Structure des fichiers

```
app/
├── index.html          (469 lignes — HTML principal, 6 ecrans)
├── css/style.css       (1701 lignes — styles + dark mode complet)
├── js/
│   ├── data.js         (184 lignes — catalogues: appareils, pays, panneaux, batteries, prix)
│   ├── engine.js       (413 lignes — moteur de calcul, formules F1-F24, regles R1-R8)
│   └── app.js          (2048 lignes — UI, navigation, state, rendu, dark mode, etc.)
├── sw.js               (31 lignes — service worker)
├── manifest.json       (manifeste PWA)
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

### Cache busting
Les URLs des assets incluent un parametre `?v=N` (actuellement `v=41`). A chaque modification de CSS ou JS :
1. Bumper le `?v=` dans `index.html` (link CSS + 3 script tags)
2. Bumper le `CACHE_NAME` et les URLs dans `sw.js`

---

## Navigation — Stepper 6 ecrans

| Step | ID         | Nom         | Contenu |
|------|-----------|-------------|---------|
| 0    | screen-0  | Accueil     | Type installation (off-grid/hybride), nom projet, catalogue |
| 1    | screen-1  | Appareils   | Liste appareils, ajout via modal catalogue, energie/puissance |
| 2    | screen-2  | Site        | Pays/ville, HSP, zone climatique, tension systeme, autonomie |
| 3    | screen-3  | Equipement  | Regulateur, panneau, batterie, onduleur — recommandations auto |
| 4    | screen-4  | Resultats   | Bilan complet du dimensionnement, formules expert |
| 5    | screen-5  | Couts       | Devis detaille en FCFA, export PDF/BOM |

### Navigation
- **Bottom nav** : boutons Retour/Suivant (fixes en bas)
- **Step indicator** : barre en haut, clic pour ouvrir le **drawer lateral gauche**
- **Drawer** : liste les 6 etapes + toggle dark mode en bas
- **Validation** : step 1 → au moins 1 appareil, step 2 → ville selectionnee
- **Mode verrouillage** : mode Standard/Expert se verrouille apres l'ecran 0

---

## State global

```javascript
let state = {
  step: 0,                    // ecran actif (0-5)
  maxStepReached: 0,          // progression max (empeche de sauter des etapes)
  mode: 'simple',             // 'simple' ou 'expert'
  installationType: 'offgrid', // 'offgrid' ou 'hybrid'
  appliances: [],             // [{name, power, qty, hours, kStart}]
  country: null,
  city: null,
  hsp: 4.5,                  // heures solaires de pointe
  zone: 'savane',            // zone climatique
  vSystem: 24,               // tension systeme (12/24/48V)
  autonomyDays: 2,
  cutoffHours: 4,            // pour hybride
  regulatorType: 'mppt',     // 'mppt' ou 'pwm'
  batteryType: 'lfp',        // plomb/agm/gel/lfp/nmc
  inverterType: 'onduleur',
  results: null,             // resultat Engine.compute()
  costs: null,               // resultat du calcul des couts
};
```

Le state est persiste en `localStorage` (cle `dimmap_state`).

---

## Moteur de calcul (engine.js)

Objet `Engine` avec des methodes pures :

| Formule | Methode | Description |
|---------|---------|-------------|
| F1 | `energyPerAppliance()` | Energie par appareil (Wh/j) |
| F2 | `totalDailyEnergy()` | Consommation totale (Wh/j) |
| F3 | `simultaneousPower()` | Puissance simultanee (W) |
| F4 | `peakPower()` | Puissance de pointe/demarrage (W) |
| F5 | `correctedEnergy()` | Energie corrigee avec pertes |
| F6 | `requiredPeakPower()` | Puissance crete necessaire (Wc) |
| F7 | `totalPanels()` | Nombre de panneaux |
| F8 | `panelsInSeries()` | Panneaux en serie |
| F9 | `stringsInParallel()` | Chaines en parallele |
| F10 | `installedPower()` | Puissance installee reelle (Wc) |
| F11 | `requiredBatteryCapacity()` | Capacite batterie (Ah) |
| F12-F14 | `batteriesInSeries/Parallel/total()` | Config batteries |
| F15 | `usableStoredEnergy()` | Energie stockee utile (kWh) |
| F16 | `regulatorCurrentPWM/MPPT()` | Courant regulateur |
| F17-F18 | `inverterContinuousPower/PeakPower()` | Onduleur |
| F19 | `dailyProduction()` | Production journaliere (kWh/j) |
| F20 | `coverageRatio()` | Ratio de couverture |
| F21 | `realAutonomy()` | Autonomie reelle (jours) |
| F22-F24 | `totalCost/costPerWc/lcoe()` | Couts et LCOE |

Methode principale : `Engine.compute(input)` → retourne un objet `r` avec tous les resultats.

---

## Donnees de reference (data.js)

- **APPLIANCES** : 22 appareils dans 8 categories (Eclairage, Froid, Ventilation, Multimedia, Informatique, Eau, Cuisine, Divers)
- **COUNTRIES** : actuellement Burkina Faso avec 10 villes, chacune avec HSP pire mois et HSP moyen
- **CLIMATE_ZONES** : sahel, cotier, forestier, savane — chacun avec un facteur kLoss
- **BATTERY_PRESETS** : plomb, AGM, gel, LFP, NMC — DoD, efficacite, cycles, duree de vie
- **Catalogues equipement** : PANEL_MODELS (100-600 Wc), INVERTER_MODELS, REGULATOR_MODELS, BATTERY variants — tous avec prix FCFA
- **DEFAULT_COSTS** : prix par defaut pour le devis

---

## CSS — Theming et dark mode

### Variables CSS (extrait principal)
```css
:root {
  --bg: #f5f6fa;
  --surface: #ffffff;
  --text: #1a1d23;
  --primary: #1565C0;
  --warn: #E65100;
  /* ... */
}
```

### Dark mode
Double implementation :
1. `@media (prefers-color-scheme: dark)` garde par `:root:not([data-theme="light"])` — suit le systeme
2. `:root[data-theme="dark"]` — toggle manuel via le drawer

Toggle : `toggleTheme()` dans app.js, persiste en `localStorage` (cle `dimmap_theme`, valeurs `light`/`dark`/absent=auto).

### Responsive desktop
```css
@media (min-width: 520px) {
  /* body gris, .app en cadre "phone" avec border-radius et ombre */
}
```

---

## Fonctionnalites UI notables

- **Drawer lateral** : ouverture par clic sur le step indicator, swipe possible, overlay semi-transparent
- **Modal catalogue appareils** : chips de categories filtrables, liste scrollable
- **Confirmation suppression** : premier clic → bouton arme rouge "Supprimer ?", deuxieme clic → supprime, timeout 3s reset
- **Scroll indicator** : fleche animee en bas quand le contenu deborde, disparait au scroll
- **Toast notifications** : messages temporaires en bas de l'ecran
- **Mode Expert** : affiche les formules detaillees sur l'ecran Resultats, parametres avances sur Site/Equipement
- **Export PDF/BOM** : generation de devis et liste de materiel
- **Historique projets** : sauvegarde/restauration de configurations

---

## Conventions de code

- **Pas de framework** : tout est en vanilla JS avec manipulation DOM directe
- **Pas de modules** : scripts charges dans l'ordre via `<script>` tags (data → engine → app)
- **Fonctions globales** : `onclick="nomFonction()"` dans le HTML
- **Pas de commentaires superflus** : le code parle de lui-meme
- **Nommage** : camelCase pour JS, kebab-case pour les classes CSS
- **Pas de point-virgule obligatoire** : style avec point-virgule
- **HTML inline styles** : quelques-uns restent dans `renderAppliances()` (a nettoyer)

---

## UX/UI — Ameliorations restantes

Liste a traiter incrementalement :

1. Feedback visuel/haptique sur les chips (type installation, tension, regulateur)
2. Validation du formulaire appareil personnalise
3. Animations de transition entre ecrans (slide gauche/droite)
4. Icones dans les etapes du drawer
5. Etats vides illustres (images quand pas de donnees)
6. Accessibilite clavier des modals (Escape pour fermer, piege focus)
7. Skeleton/loader pendant les calculs
8. Nettoyage CSS inline → classes CSS propres

---

## Instructions pour Claude

- **Langue** : toujours repondre en francais
- **Fichiers a modifier** : principalement `app.js`, `style.css`, `index.html`
- **Apres chaque modif CSS/JS** : bumper `?v=N` dans `index.html` et `sw.js`
- **Tester** : verifier le rendu mobile (375x812) et desktop (> 520px)
- **Dark mode** : toute nouvelle UI doit avoir ses styles dark mode
- **Prix** : toujours en FCFA, pas d'euros/dollars
- **Pas de dependances** : pas de npm, pas de framework, tout reste vanilla
