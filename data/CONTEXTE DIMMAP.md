# DIMMAP — Journal de suivi du projet

**Dimensionnement d'Installations Solaires — Manuel d'Application Photovoltaique**

---

## Identite du projet

| Element | Detail |
|---------|--------|
| Nom | DIMMAP |
| Objectif | Application mobile Android de dimensionnement d'installations solaires photovoltaiques |
| Marche cible | Afrique de l'Ouest et Centrale (zone FCFA) |
| Utilisateurs | Particuliers (mode simplifie) + techniciens/installateurs (mode expert) |
| Types d'installation | Off-grid autonome + Hybride solaire/reseau |

---

## Historique des travaux

### Phase 1 — Analyse de la feuille Excel source (13 aout 2026)

**Objectif :** Comprendre et evaluer les formules de la feuille de dimensionnement existante.

**Travail realise :**
- Lecture et extraction du fichier `RESSOURCES/FEUILLE DE DIMENSIONNEMENT SOLAIRE.xlsx` (87 lignes, 1 feuille, 47 formules)
- Decomposition de chaque formule : formule Excel brute, equivalent mathematique, variables, signification physique
- Analyse critique de la pertinence de chaque calcul pour le contexte africain

**Faiblesses identifiees dans la feuille :**
1. **Onduleur sous-dimensionne** — aucune prise en compte du courant de demarrage des moteurs (refrigerateur, pompe). La marge de 25% est insuffisante face a des pics de 3x a 7x la puissance nominale
2. **Pertes sous-estimees** — le coefficient K_pertes (0.85) est trop optimiste pour le climat africain. En Sahel (poussiere, Harmattan, chaleur), un K de 0.70 est plus realiste
3. **Pas de distinction PWM/MPPT** — le type de regulateur change radicalement le calcul du nombre de panneaux en serie et le dimensionnement du courant. La feuille utilise une formule PWM meme quand elle budgetise un MPPT
4. **Irradiation fixe (4.5 kWh/m2/j)** — valeur correcte au Sahel mais optimiste en zone cotiere humide (Douala, Abidjan : 3.0-3.4)
5. **Rendement regulateur absent** — la formule de correction des pertes oublie le rendement du regulateur (5 a 15% de pertes supplementaires)
6. **Indicateur de cout non standard** — le "cout par kWh journalier" n'est pas un indicateur reconnu. Le LCOE est l'indicateur de reference

**Livrable :** `RESSOURCES/Analyse_Calculs_Dimensionnement_Solaire.pdf`

---

### Phase 2 — Decisions de conception (13 aout 2026)

**Objectif :** Definir les choix fonctionnels et techniques qui guident la creation de l'application.

**Decisions validees :**

| Axe | Decision retenue | Justification |
|-----|-----------------|---------------|
| Cible utilisateur | Double mode : simplifie + expert | Couvre particuliers et professionnels |
| Plateforme | Application mobile Android | Le smartphone est l'outil principal sur le terrain en Afrique |
| Perimetre | Off-grid + hybride reseau | Couvre ~80% du marche africain |
| Couts | Prix editables par l'utilisateur | Les prix varient enormement entre pays et regions |
| Regulateur | Choix explicite PWM / MPPT | Impact majeur sur les formules de dimensionnement |
| Irradiation | Base de donnees integree par pays/ville (offline) | Fonctionnement sans internet sur le terrain |
| Demarrage | Coefficient automatique par type d'appareil | Evite le sous-dimensionnement de l'onduleur |
| Batteries | Presets par technologie (5 types) | Plomb ouvert, AGM, Gel, LFP, NMC avec DoD/rendement/duree de vie adaptes |
| Pertes climat | Profil climatique par zone geographique | Sahel (K=0.70), Cotier (0.75), Forestier (0.78), Savane (0.75) |
| LCOE | Calcul basique sur 25 ans | Permet la comparaison avec le tarif reseau |
| Exports | PDF synthese + BOM + schema cablage + historique | Livrables professionnels |
| Appareils | Bibliotheque predefinie par categorie | 22 appareils courants avec puissance et coefficient de demarrage |
| Framework Android | A definir apres validation du prototype | On valide d'abord la logique avec un prototype web |

**Livrable :** `RESSOURCES/DIMMAP_Specifications_Fonctionnelles.pdf` (12 sections, 24 formules, 8 regles de validation)

---

### Phase 3 — Prototype web fonctionnel (14 aout 2026)

**Objectif :** Construire un prototype fonctionnel dans le navigateur pour valider les calculs, le flux utilisateur et le rendu avant de passer a l'app Android.

**Travail realise :**

Structure du projet creee dans `app/` :
```
app/
  index.html          → Structure HTML, 6 ecrans, modal d'ajout d'appareils
  css/style.css       → Design mobile-first (max 480px), theme bleu/orange
  js/data.js          → Bases de donnees : 22 appareils, 15 pays, 50+ villes, 4 zones climat, 5 presets batteries, prix par defaut
  js/engine.js        → Moteur de calcul : 24 formules (F1-F24), 8 regles de validation (R1-R8), calcul des couts
  js/app.js           → Logique UI : navigation par etapes, gestion de l'etat, rendu dynamique, export PDF
```

**Ecrans implementes :**
1. **Accueil** — Choix off-grid/hybride, nom du projet
2. **Bilan energetique** — Ajout d'appareils depuis la bibliotheque ou personnalise, calcul en temps reel de la consommation (Wh/j) et de la puissance simultanee (W)
3. **Parametres du site** — Selection pays/ville avec irradiation et zone climatique automatiques, tension systeme (12/24/48V), autonomie ou duree de coupure
4. **Equipements** — Choix PWM/MPPT, parametres panneau, choix technologie batterie avec presets
5. **Resultats** — Synthese complete : panneaux (nombre, serie, parallele, Wc), batteries (nombre, capacite, energie utile), regulateur, onduleur (continu + pointe), ratio de couverture, avertissements
6. **Couts** — 14 postes detailles, marges (MO 15%, transport 3%, imprevus 5%), total, LCOE, equivalent EUR

**Formules corrigees par rapport a la feuille Excel :**
- F4 (nouveau) : puissance de pointe avec coefficient de demarrage par appareil
- F5 : ajout du rendement regulateur (n_reg) manquant
- F6 : K_pertes variable par zone climatique (0.70-0.78 au lieu de 0.85 fixe)
- F8 : logique differente selon PWM ou MPPT
- F16 : deux formules distinctes pour le courant regulateur (PWM vs MPPT cote batterie)
- F18 (nouveau) : puissance de pointe de l'onduleur
- F24 : LCOE remplace le "cout par kWh journalier"

**Test de validation :**
Scenario : 6 appareils (LED, TV, frigo, ventilateurs, PC, pompe) a Douala (cotier, HSP 3.0) en LFP :
- Consommation : 3 760 Wh/j
- Resultat : 8 panneaux x 300Wc = 2 400 Wc, 6 batteries LFP, regulateur MPPT 118.8A, onduleur 1 238W continu / 2 739W pointe
- Cout total : 3 499 350 FCFA (~5 335 EUR), LCOE 71 FCFA/kWh
- Avertissement R5 declenche (pompe a eau = fort appel de courant)
- Tous les calculs verifies et coherents

**Statut :** Prototype fonctionnel. Pret pour tests utilisateur.

---

## Prochaines etapes prevues

### Phase 4 — Ameliorations du prototype (a planifier)
- [ ] Ameliorer le design visuel (icones, animations, couleurs)
- [ ] Ajouter la sauvegarde locale des projets (LocalStorage)
- [ ] Generer le schema de cablage automatique (SVG)
- [ ] Rendre les prix editables directement dans l'ecran couts
- [ ] Ajouter la generation du BOM (liste de materiel)
- [ ] Tester le mode hybride reseau
- [ ] Tester le mode expert (rendements editables)
- [ ] Ajouter des appareils supplementaires a la bibliotheque

### Phase 5 — Conversion en application Android (a planifier)
- [ ] Choisir le framework (Flutter, React Native, ou Kotlin natif)
- [ ] Adapter le prototype web en application native
- [ ] Integrer la base SQLite pour l'historique des projets
- [ ] Implementer le partage (WhatsApp, email, Bluetooth)
- [ ] Generer l'APK installable
- [ ] Tests sur differents appareils Android

### Phase 6 — Deploiement (a planifier)
- [ ] Tests terrain avec des installateurs
- [ ] Publication sur le Google Play Store
- [ ] Version anglaise (V2)

---

## Arborescence du projet

```
H:\DIMMAP\
  .claude/
    launch.json              → Configuration du serveur local de dev
  app/                       → Prototype web
    index.html
    css/style.css
    js/data.js
    js/engine.js
    js/app.js
  data/
    CONTEXTE DIMMAP.md       → Ce fichier (suivi du projet)
  RESSOURCES/
    FEUILLE DE DIMENSIONNEMENT SOLAIRE.xlsx   → Fichier source original
    Analyse_Calculs_Dimensionnement_Solaire.pdf → Analyse des formules
    DIMMAP_Specifications_Fonctionnelles.pdf    → Cahier des specs v1.0
```

---

## Notes techniques

**Pour lancer le prototype :**
1. Ouvrir directement `app/index.html` dans un navigateur, ou
2. Lancer un serveur local : `cd H:\DIMMAP\app && python -m http.server 8090` puis ouvrir `http://localhost:8090`

**Devise :** Les prix sont en FCFA (1 EUR = 655,957 FCFA).

**Sources des donnees d'irradiation :** Valeurs HSP (pire mois) issues de NASA POWER / PVGIS, verifiees par croisement. Les valeurs sont conservatives (pire mois de l'annee) pour garantir le fonctionnement du systeme toute l'annee.
