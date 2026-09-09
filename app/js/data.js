// ─── DIMMAP — Bases de donnees de reference ───

const APPLIANCES = [
  // Eclairage
  { id: 'led_bulb',     cat: 'Eclairage',    name: 'Ampoule LED',          pMin: 7,   pMax: 15,   pDefault: 10,  kStart: 1.0, hDefault: 5 },
  { id: 'led_tube',     cat: 'Eclairage',    name: 'Tube neon LED',        pMin: 18,  pMax: 36,   pDefault: 20,  kStart: 1.0, hDefault: 6 },
  { id: 'spot_led',     cat: 'Eclairage',    name: 'Spot LED',             pMin: 3,   pMax: 12,   pDefault: 5,   kStart: 1.0, hDefault: 4 },
  // Froid
  { id: 'fridge',       cat: 'Froid',        name: 'Refrigerateur',        pMin: 80,  pMax: 200,  pDefault: 150, kStart: 5.0, hDefault: 8 },
  { id: 'freezer',      cat: 'Froid',        name: 'Congelateur',          pMin: 100, pMax: 300,  pDefault: 200, kStart: 5.0, hDefault: 8 },
  // Ventilation / Climatisation
  { id: 'fan_ceiling',  cat: 'Ventilation',  name: 'Ventilateur plafond',  pMin: 50,  pMax: 80,   pDefault: 70,  kStart: 1.5, hDefault: 8 },
  { id: 'fan_stand',    cat: 'Ventilation',  name: 'Ventilateur sur pied', pMin: 40,  pMax: 75,   pDefault: 60,  kStart: 1.5, hDefault: 8 },
  { id: 'ac_split',     cat: 'Ventilation',  name: 'Climatiseur split',    pMin: 900, pMax: 2500, pDefault: 1200,kStart: 3.5, hDefault: 6 },
  // Multimedia
  { id: 'tv_led',       cat: 'Multimedia',   name: 'Television LED',       pMin: 40,  pMax: 120,  pDefault: 80,  kStart: 1.0, hDefault: 5 },
  { id: 'decoder',      cat: 'Multimedia',   name: 'Decodeur TV',          pMin: 15,  pMax: 30,   pDefault: 20,  kStart: 1.0, hDefault: 5 },
  { id: 'radio',        cat: 'Multimedia',   name: 'Radio / Enceinte',     pMin: 5,   pMax: 30,   pDefault: 15,  kStart: 1.0, hDefault: 4 },
  // Informatique
  { id: 'laptop',       cat: 'Informatique', name: 'Ordinateur portable',  pMin: 40,  pMax: 80,   pDefault: 60,  kStart: 1.0, hDefault: 4 },
  { id: 'desktop',      cat: 'Informatique', name: 'Ordinateur bureau',    pMin: 150, pMax: 350,  pDefault: 200, kStart: 1.0, hDefault: 4 },
  { id: 'router',       cat: 'Informatique', name: 'Routeur WiFi',         pMin: 10,  pMax: 20,   pDefault: 12,  kStart: 1.0, hDefault: 24 },
  { id: 'printer',      cat: 'Informatique', name: 'Imprimante',           pMin: 30,  pMax: 80,   pDefault: 50,  kStart: 1.5, hDefault: 0.5 },
  // Eau
  { id: 'pump_surface', cat: 'Eau',          name: 'Pompe de surface',     pMin: 370, pMax: 750,  pDefault: 500, kStart: 4.0, hDefault: 2 },
  { id: 'pump_submers', cat: 'Eau',          name: 'Pompe immergee',       pMin: 500, pMax: 1500, pDefault: 750, kStart: 3.0, hDefault: 3 },
  // Cuisine
  { id: 'blender',      cat: 'Cuisine',      name: 'Mixeur / blender',     pMin: 300, pMax: 600,  pDefault: 400, kStart: 2.0, hDefault: 0.3 },
  { id: 'microwave',    cat: 'Cuisine',      name: 'Micro-ondes',          pMin: 700, pMax: 1200, pDefault: 900, kStart: 1.0, hDefault: 0.3 },
  // Divers
  { id: 'phone_charger',cat: 'Divers',       name: 'Chargeur telephone',   pMin: 5,   pMax: 25,   pDefault: 10,  kStart: 1.0, hDefault: 3 },
  { id: 'iron',         cat: 'Divers',       name: 'Fer a repasser',       pMin: 1000,pMax: 2200, pDefault: 1500,kStart: 1.0, hDefault: 0.5 },
  { id: 'washing',      cat: 'Divers',       name: 'Machine a laver',      pMin: 300, pMax: 500,  pDefault: 400, kStart: 3.0, hDefault: 1 },
  { id: 'security_cam', cat: 'Divers',       name: 'Camera de securite',   pMin: 5,   pMax: 15,   pDefault: 10,  kStart: 1.0, hDefault: 24 },
];

const COUNTRIES = [
  {
    name: 'Burkina Faso',
    cities: [
      { name: 'Ouagadougou',   hspWorst: 5.3, hspAvg: 5.8, zone: 'sahel' },
      { name: 'Bobo-Dioulasso',hspWorst: 4.8, hspAvg: 5.5, zone: 'savane' },
      { name: 'Koudougou',     hspWorst: 5.2, hspAvg: 5.7, zone: 'sahel' },
      { name: 'Ouahigouya',    hspWorst: 5.4, hspAvg: 6.0, zone: 'sahel' },
      { name: 'Kaya',          hspWorst: 5.3, hspAvg: 5.9, zone: 'sahel' },
      { name: 'Banfora',       hspWorst: 4.7, hspAvg: 5.4, zone: 'savane' },
      { name: 'Dedougou',      hspWorst: 5.1, hspAvg: 5.7, zone: 'savane' },
      { name: 'Fada N\'Gourma',hspWorst: 5.2, hspAvg: 5.8, zone: 'sahel' },
      { name: 'Tenkodogo',     hspWorst: 5.1, hspAvg: 5.7, zone: 'savane' },
      { name: 'Dori',          hspWorst: 5.6, hspAvg: 6.2, zone: 'sahel' },
    ]
  },
];

const CLIMATE_ZONES = {
  sahel:     { label: 'Sahel',          kLoss: 0.70, detail: 'Temp -12%, Poussiere -15%, Divers -3%' },
  cotier:    { label: 'Cotier humide',  kLoss: 0.75, detail: 'Temp -10%, Humidite -8%, Divers -7%' },
  forestier: { label: 'Forestier',      kLoss: 0.78, detail: 'Temp -8%, Ombrage -7%, Divers -7%' },
  savane:    { label: 'Savane',         kLoss: 0.75, detail: 'Temp -10%, Poussiere -10%, Divers -5%' },
};

const BATTERY_PRESETS = {
  plomb:     { label: 'VV generique', dod: 0.50, efficiency: 0.82, lifeYears: 2,   cycles: 1000,  maxParallel: 3, costFactor: 1.0 },
  agm:      { label: 'Plomb AGM',    dod: 0.50, efficiency: 0.85, lifeYears: 3,   cycles: 1250,  maxParallel: 4, costFactor: 1.3 },
  gel:      { label: 'Plomb Gel',     dod: 0.50, efficiency: 0.85, lifeYears: 5,   cycles: 1500,  maxParallel: 4, costFactor: 1.5 },
  lfp:      { label: 'Lithium LFP',  dod: 0.80, efficiency: 0.95, lifeYears: 10,  cycles: 4500,  maxParallel: 8, costFactor: 2.5 },
  nmc:      { label: 'Lithium NMC',  dod: 0.85, efficiency: 0.95, lifeYears: 8,   cycles: 3000,  maxParallel: 6, costFactor: 2.8 },
};

const DEFAULT_COSTS = {
  panel:           { label: 'Panneaux solaires',              unit: 'panneau',  price: 55000 },
  battery_plomb:   { label: 'Batteries (VV generique)',       unit: 'batterie', price: 75000 },
  battery_agm:     { label: 'Batteries (AGM)',                unit: 'batterie', price: 90000 },
  battery_gel:     { label: 'Batteries (Gel)',                 unit: 'batterie', price: 135000 },
  battery_lfp:     { label: 'Batteries (LFP)',                unit: 'batterie', price: 215000 },
  battery_nmc:     { label: 'Batteries (NMC)',                unit: 'batterie', price: 250000 },
  inverter:        { label: 'Onduleur',                       unit: 'unite',    price: 200000 },
  regulator_pwm:   { label: 'Regulateur PWM',                 unit: 'unite',    price: 30000 },
  regulator_mppt:  { label: 'Regulateur MPPT',                unit: 'unite',    price: 90000 },
  mounting:        { label: 'Structure de fixation',          unit: 'panneau',  price: 0 },
  cable_dc:        { label: 'Cables solaires DC',             unit: 'metre',    price: 0 },
  cable_ac:        { label: 'Cables AC + distribution',       unit: 'metre',    price: 0 },
  mc4:             { label: 'Connecteurs MC4',                unit: 'paire',    price: 0 },
  protection_dc:   { label: 'Coffret protection DC',          unit: 'unite',    price: 0 },
  protection_ac:   { label: 'Coffret protection AC',          unit: 'unite',    price: 0 },
  grounding:       { label: 'Mise a la terre',                unit: 'ensemble', price: 0 },
  battery_cables:  { label: 'Cables batteries + cosses',      unit: 'ensemble', price: 0 },
  battery_cabinet: { label: 'Coffret batteries',              unit: 'unite',    price: 0 },
  misc:            { label: 'Petit materiel',                 unit: 'lot',      price: 0 },
};

// ─── Catalogue Felicity Solar (ASEC TECH-BF, Burkina Faso) ───

const PANEL_MODELS = [
  { label: '100 Wc',  power: 100, vmp: 18.0, imp: 5.56, voc: 22.0, price: 27500 },
  { label: '150 Wc',  power: 150, vmp: 18.4, imp: 8.15, voc: 22.8, price: 30000 },
  { label: '250 Wc',  power: 250, vmp: 30.5, imp: 8.20, voc: 37.5, price: 49000 },
  { label: '285 Wc',  power: 285, vmp: 31.4, imp: 9.08, voc: 38.2, price: 50000 },
  { label: '320 Wc',  power: 320, vmp: 33.2, imp: 9.64, voc: 40.1, price: 55000 },
  { label: '350 Wc',  power: 350, vmp: 34.5, imp: 10.14, voc: 41.8, price: 55000 },
  { label: '450 Wc',  power: 450, vmp: 41.2, imp: 10.92, voc: 49.5, price: 57000 },
  { label: '550 Wc',  power: 550, vmp: 41.7, imp: 13.19, voc: 49.9, price: 62500 },
  { label: '585 Wc',  power: 585, vmp: 42.5, imp: 13.76, voc: 51.2, price: 65000 },
  { label: '600 Wc',  power: 600, vmp: 43.0, imp: 13.95, voc: 51.8, price: 70000 },
];

const INVERTER_MODELS = [
  { label: '1 kVA',   power: 1000,  voltage: 12, price: 100000 },
  { label: '3 kVA',   power: 3000,  voltage: 24, price: 175000 },
  { label: '4 kVA',   power: 4000,  voltage: 24, price: 200000 },
  { label: '6 kVA',   power: 6000,  voltage: 48, price: 250000 },
  { label: '8 kVA',   power: 8000,  voltage: 48, price: 360000 },
  { label: '12 kVA',  power: 12000, voltage: 48, price: 450000 },
  { label: '20 kVA Triphase', power: 20000, voltage: 48, price: 1450000 },
];

const INVERTER_SINUS_MODELS = [
  { label: '1 kVA',   power: 1000,  voltage: 12, price: 100000 },
  { label: '3 kVA',   power: 3000,  voltage: 24, price: 175000 },
  { label: '4 kVA',   power: 4000,  voltage: 24, price: 200000 },
  { label: '6 kVA',   power: 6000,  voltage: 48, price: 250000 },
  { label: '8 kVA',   power: 8000,  voltage: 48, price: 360000 },
  { label: '12 kVA',  power: 12000, voltage: 48, price: 450000 },
  { label: '20 kVA Triphase', power: 20000, voltage: 48, price: 1450000 },
];

const CONVERTER_MODELS = [
  { label: '500 W',  power: 500,  price: 17000 },
  { label: '1000 W', power: 1000, price: 35000 },
  { label: '1500 W', power: 1500, price: 47500 },
  { label: '2000 W', power: 2000, price: 75000 },
  { label: '3000 W', power: 3000, price: 90000 },
];

const REGULATOR_MODELS = [
  { label: '30A MPPT',  current: 30,  price: 40000 },
  { label: '45A MPPT',  current: 45,  price: 50000 },
  { label: '60A MPPT',  current: 60,  price: 90000 },
  { label: '100A MPPT', current: 100, price: 160000 },
  { label: '120A MPPT', current: 120, price: 180000 },
];

const REGULATOR_PWM_MODELS = [
  { label: '20A PWM',  current: 20,  price: 12500 },
  { label: '30A PWM',  current: 30,  price: 16000 },
  { label: '50A PWM',  current: 50,  price: 19000 },
];

const BATTERY_VV = [
  { label: '285 Ah VV 12V', capacity: 285, voltage: 12, price: 25000 },
  { label: '300 Ah VV 12V', capacity: 300, voltage: 12, price: 30000 },
  { label: '355 Ah VV 12V', capacity: 355, voltage: 12, price: 35000 },
  { label: '500 Ah VV 12V', capacity: 500, voltage: 12, price: 60000 },
  { label: '800 Ah VV 12V', capacity: 800, voltage: 12, price: 75000 },
];

const BATTERY_GEL = [
  { label: '100 Ah Gel 12V', capacity: 100, voltage: 12, price: 75000 },
  { label: '150 Ah Gel 12V', capacity: 150, voltage: 12, price: 110000 },
  { label: '200 Ah Gel 12V', capacity: 200, voltage: 12, price: 135000 },
];

const BATTERY_LITHIUM = [
  { label: '2.5 kWh 200Ah 12V',  kwh: 2.5,  capacity: 200, voltage: 12, price: 215000 },
  { label: '5 kWh 200Ah 24V',    kwh: 5,    capacity: 200, voltage: 24, price: 425000 },
  { label: '5 kWh 200Ah 48V',    kwh: 5,    capacity: 200, voltage: 48, price: 450000 },
  { label: '7.5 kWh 300Ah 24V',  kwh: 7.5,  capacity: 300, voltage: 24, price: 600000 },
  { label: '10 kWh 200Ah 48V',   kwh: 10,   capacity: 200, voltage: 48, price: 800000 },
  { label: '15 kWh 300Ah 48V',   kwh: 15,   capacity: 300, voltage: 48, price: 1000000 },
  { label: '17.5 kWh 350Ah 48V', kwh: 17.5, capacity: 350, voltage: 48, price: 1200000 },
  { label: '25 kWh 500Ah 48V',   kwh: 25,   capacity: 500, voltage: 48, price: 1800000 },
];

const BATTERY_CAPACITIES = [
  { label: '100 Ah / 12V', capacity: 100, voltage: 12 },
  { label: '150 Ah / 12V', capacity: 150, voltage: 12 },
  { label: '200 Ah / 12V', capacity: 200, voltage: 12 },
];

const VOLTAGE_RECOMMENDATIONS = [
  { maxPower: 500,  voltage: 12 },
  { maxPower: 2000, voltage: 24 },
  { maxPower: Infinity, voltage: 48 },
];
