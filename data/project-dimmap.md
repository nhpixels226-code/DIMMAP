---
name: project-dimmap
description: "DIMMAP - application de dimensionnement solaire PV pour l'Afrique, prototype web complet avec 24 formules, catalogue Felicity Solar, modes off-grid/hybride, export PDF"
metadata: 
  node_type: memory
  type: project
  modified: 2026-08-31T21:29:13.967Z
  originSessionId: 3ffb2e7b-d243-4a2a-bc77-20a838510586
---

## Identite du projet

DIMMAP = Dimensionnement d'Installations Solaires Manuel d'Application Photovoltaique.

**Objectif:** Application mobile Android pour dimensionner des installations solaires off-grid et hybrides, ciblee sur le marche africain (FCFA, climat tropical/sahelien). Le prototype web sert de validation avant le portage mobile.

**Ressources:**
- Prototype web: `H:\DIMMAP\app\` (index.html + js/ + css/)
- Specs fonctionnelles: `H:\DIMMAP\RESSOURCES\DIMMAP_Specifications_Fonctionnelles.pdf`
- Feuille Excel source: `H:\DIMMAP\RESSOURCES\FEUILLE DE DIMENSIONNEMENT SOLAIRE.xlsx`

---

## Architecture du prototype web

### Fichiers (5 fichiers)
| Fichier | Role |
|---------|------|
| `app/index.html` | Structure HTML complete, 6 ecrans + modales (catalogue, historique, ajout appareil) |
| `app/css/style.css` | Styles complets, responsive mobile-first |
| `app/js/data.js` | Donnees de reference : appareils, villes, zones climatiques, catalogues equipements, presets batteries, couts par defaut |
| `app/js/engine.js` | Moteur de calcul : 24 formules (F1-F24), 8 regles de validation (R1-R8), calcul des couts |
| `app/js/app.js` | Logique UI : navigation, state, recommandations, rendu resultats, export PDF, sauvegarde localStorage |

### Cache busting
Les fichiers JS et CSS sont charges avec un query string `?v=28`. **Incrementer ce numero a chaque modification** pour forcer le rafraichissement navigateur.

### Stepper de navigation (6 ecrans)
0. **Accueil** — Type d'installation (off-grid/hybride), nom du projet, acces catalogue et historique
1. **Appareils** — Bilan energetique, ajout depuis bibliotheque ou personnalise
2. **Site** — Pays, ville (HSP + zone climatique auto), autonomie/coupure
3. **Equipement** — Recommandations panneaux, batteries, regulateur, onduleur
4. **Resultats** — Dimensionnement complet, formules (mode Expert), alertes
5. **Couts** — Budget detaille avec prix editables, LCOE, ROI, export PDF

---

## Fonctionnalites implementees

### Modes Simple / Expert
- **Simple** : masque les parametres techniques, recommandations auto
- **Expert** : affiche les formules de calcul (F1-F24), rend editables les parametres suivants :
  - HSP personnalise, coefficient de pertes (kLoss)
  - Rendement onduleur, cable, regulateur
  - Marges regulateur et onduleur
  - % main d'oeuvre, transport, imprevus
  - **Parametres batterie** : DoD (%), Efficacite (%), Duree de vie (ans) — editables via les champs `batteryDoD`, `batteryEff`, `batteryLife`

### Off-grid vs Hybride
| Aspect | Off-grid | Hybride |
|--------|----------|---------|
| Regulateur | Visible (carte `regulatorCard`) | Masque |
| Onduleur | Choix entre Convertisseur DC/AC et Onduleur pur sinus | Onduleur hybride uniquement (chips masques) |
| Autonomie | Slider jours (autonomyDays) | Slider heures de coupure (cutoffHours) |
| Budget | Inclut le regulateur | Exclut le regulateur (~180k FCFA economises) |
| Formule batterie | F11: `C = (E × Jours) / (V × DoD × η)` | F11b: `C = (E × H_coupure / 24) / (V × DoD × η)` |

### 3 types d'onduleur/convertisseur
| Type | Variable `inverterType` | Usage | Catalogue |
|------|------------------------|-------|-----------|
| Convertisseur DC/AC | `convertisseur` | Petites installations off-grid (≤3kW) | `CONVERTER_MODELS` (Sako) |
| Onduleur pur sinus | `onduleur_sinus` | Grandes installations off-grid | `INVERTER_SINUS_MODELS` (memes specs/prix que hybrides pour l'instant — **A METTRE A JOUR avec vrais modeles**) |
| Onduleur hybride | `onduleur` | Systemes hybrides, regulateur integre | `INVERTER_MODELS` (Felicity Solar) |

### Presets batteries
| Cle | Label | DoD | Efficacite | Duree vie | Cycles | Max parallele |
|-----|-------|-----|-----------|-----------|--------|---------------|
| `plomb` | VV generique | 50% | 82% | 2 ans | 1000 | 3 |
| `agm` | Plomb AGM | 50% | 85% | 3 ans | 1250 | 4 |
| `gel` | Plomb Gel | 50% | 85% | 5 ans | 1500 | 4 |
| `lfp` | Lithium LFP | 80% | 95% | 10 ans | 4500 | 8 |
| `nmc` | Lithium NMC | 85% | 95% | 8 ans | 3000 | 6 |

Quand l'utilisateur change la technologie batterie (`onBatteryTypeChange()`), les champs DoD/Eff/Life sont mis a jour depuis les presets. En mode Expert, l'utilisateur peut ensuite les modifier manuellement.

### Catalogue equipements
Bouton "Catalogue equipements" (sans "Felicity Solar" dans le titre du bouton). La modale garde le titre "Catalogue Felicity Solar" a l'interieur.
5 onglets : Panneaux, Onduleurs (hybrides + pur sinus), Convertisseurs, Regulateurs (MPPT + PWM), Batteries (VV + Gel + Lithium).

### Donnees geographiques
Pays unique pour l'instant : **Burkina Faso** (10 villes avec HSP pire mois + moyen + zone climatique).
4 zones climatiques : Sahel (kLoss=0.70), Cotier (0.75), Forestier (0.78), Savane (0.75).

### Moteur de calcul (engine.js)
24 formules F1-F24 couvrant : energie, puissance crete, panneaux (serie/parallele), batteries (capacite, serie/parallele, energie utile), regulateur (PWM/MPPT), onduleur (continu/pointe), production, couverture, autonomie, couts (total, par Wc, LCOE).
8 regles de validation R1-R8 (marge production, batteries parallele, PWM/Vmp, tension MPPT, pointe, autonomie, systeme 12V, HSP faible).

### Export PDF
Utilise `window.print()` dans une nouvelle fenetre avec HTML genere (`generatePrintHTML()`). Inclut le bilan energetique, dimensionnement, budget complet avec tous les postes.

### Sauvegarde locale
- `saveState()` : sauvegarde l'etat dans `localStorage` (type installation, appareils, ville, tensions, type batterie, type onduleur, etc.)
- `loadState()` : restaure l'etat au chargement
- Historique des projets : sauvegarde/restauration multiple

### Fonctions utilitaires importantes
- `formatPrice(n)` : formate en prix FCFA avec separateur milliers, gere `NaN` → '—'
- `formatNum(n, decimals)` : formatage numerique
- `getInput()` : construit l'objet `input` pour le moteur, integre les parametres Expert (DoD/Eff/Life custom)
- `selectInstallType(type)` : gere la visibilite regulateur/onduleur selon off-grid/hybride

---

## Bugs corriges (historique)

1. **Regulateur "— A" et "NaN FCFA"** : `state.city.hsp` → `state.hsp`, ajout de `kLoss` dans `requiredPeakPower()`
2. **Regulateur dans budget hybride** : ajout condition `isOffgrid` dans `computeCosts()` pour exclure le regulateur
3. **Label "Onduleur" ecrase** : ajout `if (!it.label)` avant assignation dans la boucle `items.forEach`
4. **formatPrice NaN** : ajout guard `if (n === undefined || n === null || isNaN(n)) return '—'`
5. **Cache ancien JS** : increment systematique de `?v=` sur les balises `<script>` et `<link>`

---

## Travail en cours et a faire

### Mode Expert — Ameliorations
- [x] **#1** : Parametres batterie (DoD, Efficacite, Duree vie) editables en mode Expert — FAIT
- [ ] **#2** : Calculer et afficher le LCOE avec les vraies valeurs dans les formules (actuellement affiche "Calcule a l'etape Couts avec la duree de vie batterie" en placeholder)
- [ ] **#3** : Ajouter les formules manquantes dans l'affichage Expert (panneaux en serie, ratio de couverture, autonomie reelle, etc.)

### Catalogue
- [ ] Remplacer les prix/specs des `INVERTER_SINUS_MODELS` par de vrais modeles d'onduleurs pur sinus (actuellement identiques aux hybrides)

### Fonctionnalites futures (specs)
- [ ] BOM (Bill of Materials) exportable
- [ ] Schema de cablage
- [ ] Historique projets avance
- [ ] Portage Android (framework pas encore decide)
- [ ] Ajout d'autres pays africains (actuellement uniquement Burkina Faso)

---

## Conventions de code

- **State global** : objet `state` dans app.js contient tout l'etat de l'application
- **Nommage catalogues** : `PANEL_MODELS`, `INVERTER_MODELS`, `INVERTER_SINUS_MODELS`, `CONVERTER_MODELS`, `REGULATOR_MODELS`, `REGULATOR_PWM_MODELS`, `BATTERY_VV`, `BATTERY_GEL`, `BATTERY_LITHIUM`
- **IDs HTML importants** : `regulatorCard`, `inverterCard`, `inverterCardTitle`, `resultsRegInvTitle`, `batteryDoD`, `batteryEff`, `batteryLife`, `formulasDisplay`
- **Chips selection** : attributs `data-inv`, `data-reg`, `data-type` pour les chips de selection
- **Section Expert-only** : classe CSS `expert-only` pour masquer/afficher en mode Expert
- **Prix** : tous en FCFA, accessoires a 0 FCFA par defaut (editables par l'utilisateur dans l'ecran Couts)
