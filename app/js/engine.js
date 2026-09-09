// ─── DIMMAP — Moteur de calcul (Formules F1-F24 + Regles R1-R8) ───

const Engine = {

  // ── F1: Energie journaliere par appareil (Wh/j) ──
  energyPerAppliance(power, quantity, hoursPerDay) {
    return power * quantity * hoursPerDay;
  },

  // ── F2: Consommation journaliere totale (Wh/j) ──
  totalDailyEnergy(appliances) {
    return appliances.reduce((sum, a) => sum + this.energyPerAppliance(a.power, a.qty, a.hours), 0);
  },

  // ── F3: Puissance simultanee (W) ──
  simultaneousPower(appliances) {
    return appliances.reduce((sum, a) => sum + a.power * a.qty, 0);
  },

  // ── F4: Puissance de pointe / demarrage (W) ──
  peakPower(appliances) {
    const pSim = this.simultaneousPower(appliances);
    let maxSurge = 0;
    for (const a of appliances) {
      const surge = a.power * a.qty * (a.kStart - 1);
      if (surge > maxSurge) maxSurge = surge;
    }
    return pSim + maxSurge;
  },

  // ── F5: Energie corrigee avec pertes systeme (Wh/j) ──
  correctedEnergy(eTotale, effInverter, effBattery) {
    return eTotale / (effInverter * effBattery);
  },

  // ── F6: Puissance crete necessaire (Wc) ──
  requiredPeakPower(eCorrected, hsp, kLossZone) {
    return eCorrected / (hsp * kLossZone);
  },

  // ── F7: Nombre total de panneaux ──
  totalPanels(requiredPc, panelPower) {
    return Math.ceil(requiredPc / panelPower);
  },

  // ── F8: Panneaux en serie ──
  panelsInSeries(vSystem, vmpPanel, regulatorType) {
    if (regulatorType === 'mppt') {
      return Math.ceil(vSystem / vmpPanel);
    }
    // PWM: Vmp doit etre proche de V_charge
    const vCharge = vSystem * 1.2;
    return Math.round(vCharge / vmpPanel) || 1;
  },

  // ── F9: Chaines en parallele ──
  stringsInParallel(totalPanels, panelsInSeries) {
    return Math.ceil(totalPanels / panelsInSeries);
  },

  // ── F10: Puissance installee reelle (Wc) ──
  installedPower(totalPanels, panelPower) {
    return totalPanels * panelPower;
  },

  // ── F11: Capacite batterie necessaire (Ah) ──
  requiredBatteryCapacity(eTotale, autonomyDays, vSystem, dod, effBattery) {
    return (eTotale * autonomyDays) / (vSystem * dod * effBattery);
  },

  // ── F11b: Capacite batterie hybride (Ah) ──
  requiredBatteryCapacityHybrid(eTotale, cutoffHours, vSystem, dod, effBattery) {
    return (eTotale * cutoffHours / 24) / (vSystem * dod * effBattery);
  },

  // ── F12: Batteries en serie ──
  batteriesInSeries(vSystem, vBattery) {
    return Math.ceil(vSystem / vBattery);
  },

  // ── F13: Batteries en parallele ──
  batteriesInParallel(requiredCap, unitCap) {
    return Math.ceil(requiredCap / unitCap);
  },

  // ── F14: Nombre total de batteries ──
  totalBatteries(bSeries, bParallel) {
    return bSeries * bParallel;
  },

  // ── F14b: Capacite installee (Ah) ──
  installedBatteryCapacity(bParallel, unitCap) {
    return bParallel * unitCap;
  },

  // ── F15: Energie stockee utile (kWh) ──
  usableStoredEnergy(installedCap, vSystem, dod) {
    return (installedCap * vSystem * dod) / 1000;
  },

  // ── F16a: Courant regulateur PWM (A) ──
  regulatorCurrentPWM(stringsParallel, impPanel, margin) {
    return stringsParallel * impPanel * (margin || 1.25);
  },

  // ── F16b: Courant regulateur MPPT cote batterie (A) ──
  regulatorCurrentMPPT(installedPc, effMPPT, vSystem, margin) {
    return (installedPc * effMPPT / vSystem) * (margin || 1.25);
  },

  // ── F16c: Tension d'entree max MPPT (V) ──
  maxInputVoltageMPPT(panelsInSeries, vocPanel) {
    return panelsInSeries * vocPanel;
  },

  // ── F17: Puissance continue onduleur (W) ──
  inverterContinuousPower(simultaneousPower, margin) {
    return simultaneousPower * (margin || 1.25);
  },

  // ── F18: Puissance de pointe onduleur (W) ──
  inverterPeakPower(peakPower, margin) {
    return peakPower * (margin || 1.10);
  },

  // ── F19: Production journaliere estimee (kWh/j) ──
  dailyProduction(installedPc, hsp, kLossZone) {
    return (installedPc * hsp * kLossZone) / 1000;
  },

  // ── F20: Ratio de couverture ──
  coverageRatio(dailyProd, dailyConsumption) {
    return dailyProd / (dailyConsumption / 1000);
  },

  // ── F21: Autonomie reelle (jours) ──
  realAutonomy(usableEnergy, dailyConsumption) {
    return usableEnergy / (dailyConsumption / 1000);
  },

  // ── F22: Cout total ──
  totalCost(subtotal, moPercent, transportPercent, contingencyPercent) {
    return subtotal * (1 + moPercent + transportPercent + contingencyPercent);
  },

  // ── F23: Cout par Wc (FCFA/Wc) ──
  costPerWc(totalCost, installedPc) {
    return totalCost / installedPc;
  },

  // ── F24: LCOE (FCFA/kWh) ──
  lcoe(totalCost, dailyProdKwh, systemLifeYears) {
    return totalCost / (dailyProdKwh * 365 * systemLifeYears);
  },

  // ═══════════════════════════════════════════
  // DIMENSIONNEMENT COMPLET
  // ═══════════════════════════════════════════
  compute(input) {
    const r = {};

    // Bilan energetique
    r.dailyEnergy = this.totalDailyEnergy(input.appliances);             // Wh/j
    r.dailyEnergyKwh = r.dailyEnergy / 1000;                            // kWh/j
    r.simultaneousPower = this.simultaneousPower(input.appliances);       // W
    r.peakPower = this.peakPower(input.appliances);                      // W

    // Rendements
    const effInv = input.effInverter || 0.90;
    const effBatt = input.batteryPreset.efficiency;
    const effCable = input.effCable || 0.95;
    const effReg = input.regulatorType === 'mppt' ? (input.effRegulator || 0.95) : (input.effRegulator || 0.90);

    // Energie corrigee
    r.correctedEnergy = this.correctedEnergy(r.dailyEnergy, effInv, effBatt);

    // Site
    const hsp = input.hsp;
    const kLoss = input.kLossZone;

    // Panneaux
    r.requiredPc = this.requiredPeakPower(r.correctedEnergy, hsp, kLoss);
    r.totalPanels = this.totalPanels(r.requiredPc, input.panelPower);
    r.panelsInSeries = this.panelsInSeries(input.vSystem, input.panelVmp, input.regulatorType);
    r.stringsInParallel = this.stringsInParallel(r.totalPanels, r.panelsInSeries);
    r.totalPanels = r.panelsInSeries * r.stringsInParallel; // recalcul apres arrondi
    r.installedPc = this.installedPower(r.totalPanels, input.panelPower);
    r.installedPcKw = r.installedPc / 1000;

    // Batteries
    if (input.installationType === 'hybrid') {
      r.requiredBatteryCap = this.requiredBatteryCapacityHybrid(
        r.dailyEnergy, input.cutoffHours || 4, input.vSystem,
        input.batteryPreset.dod, effBatt);
    } else {
      r.requiredBatteryCap = this.requiredBatteryCapacity(
        r.dailyEnergy, input.autonomyDays, input.vSystem,
        input.batteryPreset.dod, effBatt);
    }
    r.batteriesInSeries = this.batteriesInSeries(input.vSystem, input.batteryVoltage);
    r.batteriesInParallel = this.batteriesInParallel(r.requiredBatteryCap, input.batteryCapacity);
    r.totalBatteries = this.totalBatteries(r.batteriesInSeries, r.batteriesInParallel);
    r.installedBatteryCap = this.installedBatteryCapacity(r.batteriesInParallel, input.batteryCapacity);
    r.usableEnergy = this.usableStoredEnergy(r.installedBatteryCap, input.vSystem, input.batteryPreset.dod);

    // Regulateur
    const marginReg = input.marginRegulator || 1.25;
    const marginInv = input.marginInverter || 1.25;
    if (input.regulatorType === 'mppt') {
      r.regulatorCurrent = this.regulatorCurrentMPPT(r.installedPc, effReg, input.vSystem, marginReg);
      r.maxInputVoltage = this.maxInputVoltageMPPT(r.panelsInSeries, input.panelVoc || input.panelVmp * 1.22);
    } else {
      r.regulatorCurrent = this.regulatorCurrentPWM(r.stringsInParallel, input.panelImp, marginReg);
      r.maxInputVoltage = null;
    }

    // Onduleur
    r.inverterContinuous = this.inverterContinuousPower(r.simultaneousPower, marginInv);
    r.inverterPeak = this.inverterPeakPower(r.peakPower);

    // Synthese
    r.dailyProduction = this.dailyProduction(r.installedPc, hsp, kLoss);
    r.coverageRatio = this.coverageRatio(r.dailyProduction, r.dailyEnergy);
    r.realAutonomy = this.realAutonomy(r.usableEnergy, r.dailyEnergy);

    // Validations
    r.warnings = this.validate(r, input);

    return r;
  },

  // ═══════════════════════════════════════════
  // REGLES DE VALIDATION R1-R8
  // ═══════════════════════════════════════════
  validate(r, input) {
    const w = [];

    // R1: Marge de production faible (ratio < 1.35)
    if (r.coverageRatio < 1.35) {
      w.push({ severity: 'warning', code: 'R1',
        msg: `Marge de production faible (${(r.coverageRatio * 100 - 100).toFixed(0)}% d'excedent). En conditions reelles (poussiere, vieillissement), la production pourrait ne pas suffire. Envisagez un panneau supplementaire.` });
    }

    // R2: Trop de batteries en parallele
    if (r.batteriesInParallel > input.batteryPreset.maxParallel) {
      w.push({ severity: 'warning', code: 'R2',
        msg: `Trop de batteries en parallele (${r.batteriesInParallel} > ${input.batteryPreset.maxParallel} max pour ${input.batteryPreset.label}). Risque de desequilibre. Envisagez des batteries de plus grande capacite.` });
    }

    // R3: PWM + Vmp trop eleve
    if (input.regulatorType === 'pwm') {
      const vCharge = input.vSystem * 1.2;
      if (input.panelVmp > vCharge * 1.3) {
        w.push({ severity: 'warning', code: 'R3',
          msg: `La tension du panneau (${input.panelVmp}V) est trop elevee pour un regulateur PWM sur un systeme ${input.vSystem}V. Perte de rendement importante. Passez en MPPT ou choisissez un panneau adapte.` });
      }
    }

    // R4: Tension entree MPPT trop elevee
    if (input.regulatorType === 'mppt' && r.maxInputVoltage > 150) {
      w.push({ severity: 'warning', code: 'R4',
        msg: `La tension en circuit ouvert (${r.maxInputVoltage.toFixed(0)}V) depasse la limite courante des regulateurs MPPT (150V). Verifiez les specifications de votre regulateur.` });
    }

    // R5: Pointe > 2x continu
    if (r.peakPower > 2 * r.simultaneousPower) {
      w.push({ severity: 'warning', code: 'R5',
        msg: `Le courant de demarrage (${r.peakPower.toFixed(0)}W) depasse le double de la puissance continue. Verifiez que l'onduleur supporte cette pointe.` });
    }

    // R6: Autonomie reelle insuffisante
    const targetAutonomy = input.installationType === 'hybrid'
      ? (input.cutoffHours || 4) / 24
      : input.autonomyDays;
    if (r.realAutonomy < targetAutonomy * 0.9) {
      w.push({ severity: 'error', code: 'R6',
        msg: 'La capacite batterie installee est insuffisante pour l\'autonomie demandee.' });
    }

    // R7: Systeme 12V avec grosse puissance
    if (input.vSystem === 12 && r.installedPc > 3000) {
      w.push({ severity: 'error', code: 'R7',
        msg: 'Puissance trop elevee pour un systeme 12V. Les courants seront excessifs. Passez en 24V ou 48V.' });
    }

    // R8: HSP tres faible
    if (input.hsp < 3.0) {
      w.push({ severity: 'warning', code: 'R8',
        msg: 'Irradiation tres faible. Le dimensionnement sera surdimensionne. Verifiez les donnees du site.' });
    }

    return w;
  },

  // ═══════════════════════════════════════════
  // CALCUL DES COUTS
  // ═══════════════════════════════════════════
  computeCosts(results, input, customPrices, customQty) {
    const prices = { ...DEFAULT_COSTS, ...customPrices };
    const cq = customQty || {};
    const battKey = 'battery_' + input.batteryType;
    const regKey = 'regulator_' + input.regulatorType;

    const panelPrice = input.catalogPanelPrice || prices.panel.price;
    const batteryPrice = input.catalogBatteryPrice || (prices[battKey] || prices.battery_plomb).price;

    let inverterPrice = input.catalogInverterPrice || prices.inverter.price;
    if (!input.catalogInverterPrice) {
      const invCatalog = input.inverterType === 'onduleur_sinus' && typeof INVERTER_SINUS_MODELS !== 'undefined'
        ? INVERTER_SINUS_MODELS
        : input.inverterType === 'convertisseur' && typeof CONVERTER_MODELS !== 'undefined'
        ? CONVERTER_MODELS
        : typeof INVERTER_MODELS !== 'undefined' ? INVERTER_MODELS : [];
      const invMatch = invCatalog.filter(m => m.power >= results.inverterPeak)
        .sort((a, b) => a.power - b.power)[0];
      if (invMatch) inverterPrice = invMatch.price;
    }

    let regulatorPrice = (prices[regKey] || prices.regulator_mppt).price;
    if (input.regulatorType === 'mppt' && typeof REGULATOR_MODELS !== 'undefined') {
      const regMatch = REGULATOR_MODELS.find(m => m.current >= results.regulatorCurrent);
      if (regMatch) regulatorPrice = regMatch.price;
    } else if (input.regulatorType === 'pwm' && typeof REGULATOR_PWM_MODELS !== 'undefined') {
      const pwmMatch = REGULATOR_PWM_MODELS.find(m => m.current >= results.regulatorCurrent);
      if (pwmMatch) regulatorPrice = pwmMatch.price;
    }

    const isOffgrid = input.installationType === 'offgrid';

    const items = [
      { key: 'panel',          qty: results.totalPanels,                        price: panelPrice },
      { key: battKey,          qty: results.totalBatteries,                     price: batteryPrice },
      { key: 'inverter',       qty: 1,                                          price: inverterPrice, label: input.inverterType === 'onduleur' ? 'Onduleur hybride' : input.inverterType === 'onduleur_sinus' ? 'Onduleur pur sinus' : 'Convertisseur DC/AC' },
      ...(isOffgrid ? [{ key: regKey, qty: 1, price: regulatorPrice }] : []),
      { key: 'mounting',       qty: cq.mounting       ?? results.totalPanels,   price: prices.mounting.price },
      { key: 'cable_dc',       qty: cq.cable_dc       ?? (input.cableDcLength || 30), price: prices.cable_dc.price },
      { key: 'cable_ac',       qty: cq.cable_ac       ?? (input.cableAcLength || 20), price: prices.cable_ac.price },
      { key: 'mc4',            qty: cq.mc4            ?? results.totalPanels * 2,      price: prices.mc4.price },
      { key: 'protection_dc',  qty: cq.protection_dc  ?? 1,                    price: prices.protection_dc.price },
      { key: 'protection_ac',  qty: cq.protection_ac  ?? 1,                    price: prices.protection_ac.price },
      { key: 'grounding',      qty: cq.grounding      ?? 1,                    price: prices.grounding.price },
      { key: 'battery_cables', qty: cq.battery_cables ?? 1,                    price: prices.battery_cables.price },
      { key: 'battery_cabinet',qty: cq.battery_cabinet?? 1,                    price: prices.battery_cabinet.price },
      { key: 'misc',           qty: cq.misc           ?? 1,                    price: prices.misc.price },
    ];

    items.forEach(it => {
      if (!it.label) it.label = (prices[it.key] || DEFAULT_COSTS[it.key] || { label: it.key }).label;
      it.total = it.qty * it.price;
    });

    const subtotal = items.reduce((s, it) => s + it.total, 0);
    const moPercent = input.moPercent ?? 0.15;
    const transportPercent = input.transportPercent ?? 0.03;
    const contingencyPercent = input.contingencyPercent ?? 0.05;

    const mo = subtotal * moPercent;
    const transport = subtotal * transportPercent;
    const contingency = subtotal * contingencyPercent;
    const total = subtotal + mo + transport + contingency;

    const costPerWc = this.costPerWc(total, results.installedPc);
    const battLifeYears = input.batteryPreset?.lifeYears
      || (BATTERY_PRESETS[input.batteryType] || BATTERY_PRESETS.plomb).lifeYears;

    const systemLifeYears = input.systemLifeYears || 25;
    const inverterLifeYears = input.inverterLifeYears || 10;
    const regulatorLifeYears = input.regulatorLifeYears || 15;

    const battReplacements = Math.max(0, Math.ceil(systemLifeYears / battLifeYears) - 1);
    const invReplacements = Math.max(0, Math.ceil(systemLifeYears / inverterLifeYears) - 1);
    const regReplacements = isOffgrid ? Math.max(0, Math.ceil(systemLifeYears / regulatorLifeYears) - 1) : 0;

    const battReplacementCost = battReplacements * results.totalBatteries * batteryPrice;
    const invReplacementCost = invReplacements * inverterPrice;
    const regReplacementCost = regReplacements * regulatorPrice;
    const replacementSubtotal = battReplacementCost + invReplacementCost + regReplacementCost;
    const replacementWithMargins = replacementSubtotal * (1 + moPercent + transportPercent + contingencyPercent);
    const lifetimeCost = total + replacementWithMargins;

    const lcoe = this.lcoe(lifetimeCost, results.dailyProduction, systemLifeYears);

    return {
      items, subtotal, mo, transport, contingency, total,
      moPercent, transportPercent, contingencyPercent,
      costPerWc, lcoe, battLifeYears, systemLifeYears,
      inverterLifeYears, regulatorLifeYears,
      battReplacements, invReplacements, regReplacements,
      battReplacementCost, invReplacementCost, regReplacementCost,
      replacementSubtotal, replacementWithMargins, lifetimeCost,
    };
  },
};
