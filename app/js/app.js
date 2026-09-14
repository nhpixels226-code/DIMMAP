// ─── DIMMAP — Logique UI et navigation ───

// ═══ STATE ═══
let state = {
  step: 0,
  maxStepReached: 0,
  mode: 'simple',
  installationType: 'offgrid',
  appliances: [],
  country: null,
  city: null,
  hsp: 4.5,
  zone: 'savane',
  vSystem: 24,
  autonomyDays: 2,
  cutoffHours: 4,
  regulatorType: 'mppt',
  batteryType: 'lfp',
  inverterType: 'onduleur',
  results: null,
  costs: null,
};

// ═══ NAVIGATION ═══
function validateStep(step) {
  clearStepError();
  if (step === 1 && state.appliances.length === 0) {
    showStepError('Ajoutez au moins un appareil electrique avant de continuer.');
    return false;
  }
  if (step === 2 && !state.city) {
    showStepError('Selectionnez un pays et une ville pour continuer.');
    return false;
  }
  return true;
}

function showStepError(msg) {
  let el = document.getElementById('stepError');
  if (!el) {
    el = document.createElement('div');
    el.id = 'stepError';
    el.className = 'alert alert-error';
    el.style.margin = '0 16px 8px';
    document.querySelector('.bottom-nav').before(el);
  }
  el.innerHTML = '<span class="alert-icon">&#9888;</span><div>' + msg + '</div>';
  el.style.display = 'flex';
  setTimeout(() => { if (el) el.style.display = 'none'; }, 4000);
}

function clearStepError() {
  const el = document.getElementById('stepError');
  if (el) el.style.display = 'none';
}

function goToStep(n) {
  if (n < 0 || n > 5) return;
  if (n > state.maxStepReached + 1) return;
  if (n === 3) generateAllRecommendations();
  if (n === 4) runCalculation();
  if (n === 5) runCostCalculation();

  if (n > 0 && !state.modeLocked) {
    state.modeLocked = true;
    document.getElementById('modeToggle').style.display = 'none';
  }
  if (n === 0) {
    state.modeLocked = false;
    document.getElementById('modeToggle').style.display = '';
  }

  state.step = n;
  if (n > state.maxStepReached) state.maxStepReached = n;
  document.querySelectorAll('.screen').forEach((el, i) => {
    el.classList.toggle('active', i === n);
  });
  document.querySelectorAll('.step-dot').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i === n) el.classList.add('active');
    else if (i < n) el.classList.add('done');
  });
  const activeDot = document.querySelector('.step-dot.active');
  if (activeDot) activeDot.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

  updateNavButtons();
  window.scrollTo(0, 0);
}

function nextStep() {
  if (!validateStep(state.step)) return;
  goToStep(state.step + 1);
}
function prevStep() { goToStep(state.step - 1); }

function updateNavButtons() {
  const prev = document.getElementById('btnPrev');
  const next = document.getElementById('btnNext');
  prev.style.display = state.step === 0 ? 'none' : '';
  if (state.step === 5) {
    next.textContent = 'Exporter PDF';
    next.onclick = exportPDF;
  } else {
    next.textContent = 'Suivant';
    next.onclick = nextStep;
  }
}

// Stepper click
document.querySelectorAll('.step-dot').forEach(el => {
  el.addEventListener('click', () => goToStep(parseInt(el.dataset.step)));
});

// ═══ MODE STANDARD / EXPERT ═══
function setMode(mode) {
  if (state.modeLocked) return;
  state.mode = mode;
  document.body.classList.toggle('expert-mode', mode === 'expert');
  document.getElementById('btnSimple').classList.toggle('active', mode === 'simple');
  document.getElementById('btnExpert').classList.toggle('active', mode === 'expert');
}

// ═══ INSTALLATION TYPE ═══
function selectInstallType(type) {
  state.installationType = type;
  document.querySelectorAll('.install-card').forEach(el => {
    el.classList.toggle('selected', el.dataset.type === type);
  });
  document.getElementById('autonomyGroup').style.display = type === 'offgrid' ? '' : 'none';
  document.getElementById('cutoffGroup').style.display = type === 'hybrid' ? '' : 'none';

  const regCard = document.getElementById('regulatorCard');
  const invCard = document.getElementById('inverterCard');
  const invTitle = document.getElementById('inverterCardTitle');
  const invChips = invCard ? invCard.querySelector('.chip-group') : null;

  const chipConv = invCard ? invCard.querySelector('[data-inv="convertisseur"]') : null;
  const chipSinus = invCard ? invCard.querySelector('[data-inv="onduleur_sinus"]') : null;
  const chipHybride = invCard ? invCard.querySelector('[data-inv="onduleur"]') : null;

  if (type === 'offgrid') {
    if (regCard) regCard.style.display = '';
    if (invTitle) invTitle.textContent = 'Onduleur / Convertisseur';
    if (invChips) invChips.style.display = '';
    if (chipConv) chipConv.style.display = '';
    if (chipSinus) chipSinus.style.display = '';
    if (chipHybride) chipHybride.style.display = 'none';
    selectInverterType('convertisseur');
  } else {
    if (regCard) regCard.style.display = 'none';
    if (invTitle) invTitle.textContent = 'Onduleur hybride';
    if (invChips) invChips.style.display = 'none';
    if (chipConv) chipConv.style.display = 'none';
    if (chipSinus) chipSinus.style.display = 'none';
    if (chipHybride) chipHybride.style.display = '';
    selectInverterType('onduleur');
  }
  saveState();
}

// ═══ APPLIANCES ═══
function openAddModal() {
  document.getElementById('addModal').classList.add('show');
  renderCatTabs();
  renderPresets('Tous');
}
function closeAddModal() {
  document.getElementById('addModal').classList.remove('show');
}

function renderCatTabs() {
  const cats = ['Tous', ...new Set(APPLIANCES.map(a => a.cat))];
  const container = document.getElementById('catTabs');
  container.innerHTML = cats.map((c, i) =>
    `<button class="cat-tab ${i === 0 ? 'active' : ''}" onclick="filterCat('${c}', this)">${c}</button>`
  ).join('');
}

function filterCat(cat, btn) {
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderPresets(cat);
}

function renderPresets(cat) {
  const list = cat === 'Tous' ? APPLIANCES : APPLIANCES.filter(a => a.cat === cat);
  document.getElementById('presetList').innerHTML = list.map(a =>
    `<div class="preset-item" onclick="addPresetAppliance('${a.id}')">
       <div>
         <div class="preset-name">${a.name}</div>
         <div class="preset-power">${a.pDefault} W | ${a.hDefault} h/j</div>
       </div>
       <div style="color:var(--primary); font-size:20px;">+</div>
     </div>`
  ).join('');
}

function addPresetAppliance(id) {
  const preset = APPLIANCES.find(a => a.id === id);
  if (!preset) return;
  const existing = state.appliances.find(a => a.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    state.appliances.push({
      id: preset.id,
      name: preset.name,
      power: preset.pDefault,
      qty: 1,
      hours: preset.hDefault,
      kStart: preset.kStart,
    });
  }
  renderAppliances();
  closeAddModal();
  highlightLastAppliance();
  saveState();
}

function highlightLastAppliance() {
  requestAnimationFrame(() => {
    const items = document.querySelectorAll('.appliance-item');
    const last = items[items.length - 1];
    if (!last) return;
    last.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    last.classList.add('flash');
    setTimeout(() => last.classList.remove('flash'), 800);
  });
}

function addCustomAppliance() {
  const name = document.getElementById('customAppName').value.trim();
  const power = parseFloat(document.getElementById('customAppPower').value);
  const qty = parseInt(document.getElementById('customAppQty').value) || 1;
  const hours = parseFloat(document.getElementById('customAppHours').value);
  if (!name || !power || !hours) return;

  const kStart = parseFloat(document.getElementById('customAppMotor').value) || 1.0;
  state.appliances.push({
    id: 'custom_' + Date.now(),
    name, power, qty, hours, kStart,
  });
  renderAppliances();
  closeAddModal();
  document.getElementById('customAppName').value = '';
  document.getElementById('customAppPower').value = '';
  document.getElementById('customAppQty').value = '1';
  document.getElementById('customAppHours').value = '';
  document.getElementById('customAppMotor').value = '1.0';
  highlightLastAppliance();
  saveState();
}

function removeAppliance(idx, btn) {
  if (btn && !btn.dataset.confirmed) {
    btn.dataset.confirmed = 'true';
    btn.innerHTML = '&#10003;';
    btn.style.background = 'var(--warn)';
    btn.style.color = 'white';
    btn.title = 'Confirmer la suppression';
    setTimeout(() => {
      if (btn.dataset.confirmed) {
        delete btn.dataset.confirmed;
        btn.innerHTML = '&times;';
        btn.style.background = '';
        btn.style.color = '';
      }
    }, 2500);
    return;
  }
  state.appliances.splice(idx, 1);
  renderAppliances();
  saveState();
}

function updateAppliance(idx, field, value) {
  state.appliances[idx][field] = parseFloat(value) || 0;
  renderAppliances();
  saveState();
}

function renderAppliances() {
  const container = document.getElementById('applianceList');
  if (state.appliances.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:var(--text-sec); padding:20px; font-size:13px;">Aucun appareil ajoute.<br>Appuyez sur le bouton ci-dessous pour commencer.</p>';
  } else {
    container.innerHTML = state.appliances.map((a, i) => {
      const energy = Engine.energyPerAppliance(a.power, a.qty, a.hours);
      return `<div class="appliance-item">
        <div class="appliance-info">
          <div class="appliance-name">${a.name}</div>
          <div class="appliance-detail">
            <input type="number" value="${a.power}" min="1" style="width:55px;padding:2px 4px;font-size:11px;border:1px solid var(--border);border-radius:3px;text-align:center;" onchange="updateAppliance(${i},'power',this.value)"> W
            &times;
            <input type="number" value="${a.qty}" min="1" style="width:35px;padding:2px 4px;font-size:11px;border:1px solid var(--border);border-radius:3px;text-align:center;" onchange="updateAppliance(${i},'qty',this.value)">
            &times;
            <input type="number" value="${a.hours}" min="0.1" max="24" step="0.5" style="width:45px;padding:2px 4px;font-size:11px;border:1px solid var(--border);border-radius:3px;text-align:center;" onchange="updateAppliance(${i},'hours',this.value)"> h
          </div>
        </div>
        <div class="appliance-energy">
          <div class="value">${formatNum(energy)}</div>
          <div class="unit">Wh/j</div>
        </div>
        <button class="btn-remove" onclick="removeAppliance(${i}, this)">&times;</button>
      </div>`;
    }).join('');
  }

  // Totals
  const totalE = Engine.totalDailyEnergy(state.appliances);
  const totalP = Engine.simultaneousPower(state.appliances);
  document.getElementById('totalEnergy').textContent = formatNum(totalE) + ' Wh/j';
  document.getElementById('totalPower').textContent = formatNum(totalP) + ' W';

  const rec = VOLTAGE_RECOMMENDATIONS.find(v => totalP <= v.maxPower);
  if (rec && rec.voltage !== state.vSystem) {
    selectVoltage(rec.voltage);
    document.getElementById('voltageHint').textContent = `Auto: ${rec.voltage}V recommande pour ${formatNum(totalP)} W`;
  }
}

// ═══ SITE PARAMETERS ═══
function populateCountries() {
  const sel = document.getElementById('selCountry');
  COUNTRIES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = c.name;
    sel.appendChild(opt);
  });
  if (COUNTRIES.length === 1) {
    sel.value = COUNTRIES[0].name;
    sel.parentElement.style.display = 'none';
    onCountryChange();
  }
}

function onCountryChange() {
  const countryName = document.getElementById('selCountry').value;
  const country = COUNTRIES.find(c => c.name === countryName);
  state.country = country;
  const selCity = document.getElementById('selCity');
  selCity.innerHTML = '<option value="">-- Choisir une ville --</option>';
  if (country) {
    country.cities.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.textContent = c.name;
      selCity.appendChild(opt);
    });
  }
  state.city = null;
  updateSiteDisplay();
}

function onCityChange() {
  const cityName = document.getElementById('selCity').value;
  if (state.country) {
    state.city = state.country.cities.find(c => c.name === cityName) || null;
  }
  if (state.city) {
    state.hsp = state.city.hspWorst;
    state.zone = state.city.zone;
  }
  updateSiteDisplay();
  saveState();
}

function updateSiteDisplay() {
  if (state.city) {
    document.getElementById('dispHSP').textContent = state.city.hspWorst.toFixed(1);
    const zoneInfo = CLIMATE_ZONES[state.city.zone];
    document.getElementById('dispZone').textContent = zoneInfo.label;
    document.getElementById('dispZoneDetail').textContent = 'K=' + zoneInfo.kLoss + ' | ' + zoneInfo.detail;
  } else {
    document.getElementById('dispHSP').textContent = '—';
    document.getElementById('dispZone').textContent = '—';
    document.getElementById('dispZoneDetail').textContent = '';
  }
}

function updateAutonomyLabel() {
  const v = document.getElementById('autonomySlider').value;
  state.autonomyDays = parseInt(v);
  document.getElementById('autonomyLabel').textContent = v + ' jour' + (v > 1 ? 's' : '');
}

function updateCutoffLabel() {
  const v = document.getElementById('cutoffSlider').value;
  state.cutoffHours = parseInt(v);
  document.getElementById('cutoffLabel').textContent = v + ' h/j';
}

// ═══ VOLTAGE ═══
function selectVoltage(v) {
  state.vSystem = v;
  document.querySelectorAll('#voltageChips .chip').forEach(el => {
    el.classList.toggle('selected', parseInt(el.dataset.v) === v);
  });
  saveState();
}

// ═══ REGULATOR ═══
function selectRegulator(type) {
  state.regulatorType = type;
  document.querySelectorAll('[data-reg]').forEach(el => {
    el.classList.toggle('selected', el.dataset.reg === type);
  });
  const hints = {
    pwm: 'PWM : moins cher, mais le panneau doit avoir une tension proche du systeme',
    mppt: 'MPPT recommande : meilleur rendement, adapte la tension automatiquement',
  };
  document.getElementById('regHint').textContent = hints[type];
  if (state.step === 3) {
    generatePanelRecommendations();
    generateRegulatorRecommendation();
  }
  saveState();
}

// ═══ BATTERY ═══
function onBatteryTypeChange() {
  const type = document.getElementById('batteryType').value;
  state.batteryType = type;
  const preset = BATTERY_PRESETS[type];
  document.getElementById('batteryDoD').value = Math.round(preset.dod * 100);
  document.getElementById('batteryEff').value = Math.round(preset.efficiency * 100);
  document.getElementById('batteryLife').value = preset.lifeYears;
  if (state.step === 3) generateBatteryRecommendations();
  saveState();
}

// ═══ RECOMMANDATIONS EQUIPEMENT ═══
let panelRecos = [];
let batteryRecos = [];

function generateAllRecommendations() {
  generatePanelRecommendations();
  generateBatteryRecommendations();
  generateRegulatorRecommendation();
  generateInverterRecommendation();
}

function generateRegulatorRecommendation() {
  const container = document.getElementById('regulatorReco');
  if (!container) return;
  if (state.appliances.length === 0 || !state.city) {
    container.innerHTML = '<div class="form-hint">Ajoutez des appareils et selectionnez une ville pour voir la recommandation.</div>';
    return;
  }

  const dailyEnergy = Engine.totalDailyEnergy(state.appliances);
  const effBatt = (BATTERY_PRESETS[state.batteryType] || BATTERY_PRESETS.plomb).efficiency;
  const corrected = Engine.correctedEnergy(dailyEnergy, 0.90, effBatt);
  const hsp = state.hsp;
  const kLoss = CLIMATE_ZONES[state.zone]?.kLoss || 0.75;
  const peakPower = Engine.peakPower(state.appliances);
  const requiredPc = Engine.requiredPeakPower(corrected, hsp, kLoss);

  const panelPower = parseFloat(document.getElementById('panelPower').value) || 300;
  const panelVmp = parseFloat(document.getElementById('panelVmp').value) || 32.4;
  const panelImp = parseFloat(document.getElementById('panelImp').value) || 9.26;
  const panelVoc = parseFloat(document.getElementById('panelVoc').value) || 39.7;
  const panelsInSeries = Engine.panelsInSeries(state.vSystem, panelVmp);
  const stringsInParallel = Engine.stringsInParallel(requiredPc, panelPower, panelsInSeries);
  const totalPanels = Engine.totalPanels(panelsInSeries, stringsInParallel);
  const installedPc = Engine.installedPower(totalPanels, panelPower);

  const type = state.regulatorType || 'mppt';
  let current, models, best, qtyNeeded;

  if (type === 'mppt') {
    current = Engine.regulatorCurrentMPPT(installedPc, 0.95, state.vSystem);
    models = REGULATOR_MODELS;
    best = models.find(m => m.current >= current) || models[models.length - 1];
    qtyNeeded = best.current >= current ? 1 : Math.ceil(current / best.current);
    const maxVpv = Engine.maxInputVoltageMPPT(panelsInSeries, panelVoc);

    container.innerHTML = `<div class="reco-card selected" style="cursor:default;">
      <div class="reco-badge auto">Recommande</div>
      <div class="reco-title">${qtyNeeded > 1 ? qtyNeeded + 'x ' : ''}${best.label}</div>
      <div class="reco-row"><span>Courant min. calcule</span><span class="val">${formatNum(current, 1)} A</span></div>
      <div class="reco-row"><span>Tension entree max PV</span><span class="val">${formatNum(maxVpv, 0)} V</span></div>
      <div class="reco-row"><span>Prix</span><span class="val">${formatPrice(best.price * qtyNeeded)} FCFA</span></div>
    </div>`;
  } else {
    current = Engine.regulatorCurrentPWM(stringsInParallel, panelImp);
    models = REGULATOR_PWM_MODELS;
    best = models.find(m => m.current >= current) || models[models.length - 1];
    qtyNeeded = best.current >= current ? 1 : Math.ceil(current / best.current);

    container.innerHTML = `<div class="reco-card selected" style="cursor:default;">
      <div class="reco-badge auto">Recommande</div>
      <div class="reco-title">${qtyNeeded > 1 ? qtyNeeded + 'x ' : ''}${best.label}</div>
      <div class="reco-row"><span>Courant min. calcule</span><span class="val">${formatNum(current, 1)} A</span></div>
      <div class="reco-row"><span>Prix</span><span class="val">${formatPrice(best.price * qtyNeeded)} FCFA</span></div>
    </div>`;
  }
}

function generatePanelRecommendations() {
  const container = document.getElementById('panelRecos');
  if (state.appliances.length === 0 || !state.city) {
    container.innerHTML = '<div class="form-hint">Ajoutez des appareils et selectionnez une ville pour voir les recommandations.</div>';
    panelRecos = [];
    return;
  }

  const dailyEnergy = Engine.totalDailyEnergy(state.appliances);
  const preset = BATTERY_PRESETS[state.batteryType];
  const effBatt = preset.efficiency;
  const corrected = Engine.correctedEnergy(dailyEnergy, 0.90, effBatt);
  const kLoss = CLIMATE_ZONES[state.zone]?.kLoss || 0.75;
  const requiredPc = Engine.requiredPeakPower(corrected, state.hsp, kLoss);

  const results = [];
  for (const model of PANEL_MODELS) {
    if (state.regulatorType === 'pwm') {
      const vCharge = state.vSystem * 1.2;
      if (model.vmp > vCharge * 1.5 || model.vmp < state.vSystem * 0.8) continue;
    }
    const nPanels = Engine.totalPanels(requiredPc, model.power);
    const pSeries = Engine.panelsInSeries(state.vSystem, model.vmp, state.regulatorType);
    const strings = Engine.stringsInParallel(nPanels, pSeries);
    const total = pSeries * strings;
    const installed = total * model.power;
    const dailyProd = Engine.dailyProduction(installed, state.hsp, kLoss);
    const ratio = Engine.coverageRatio(dailyProd, dailyEnergy);
    const unitPrice = model.price || DEFAULT_COSTS.panel.price;
    const cost = total * unitPrice;

    results.push({ model, totalPanels: total, panelsInSeries: pSeries, stringsInParallel: strings, installedPc: installed, ratio, cost });
  }

  results.sort((a, b) => a.totalPanels - b.totalPanels);
  panelRecos = results.slice(0, 3);

  const labels = [
    { text: 'Recommande', cls: 'optimal' },
    { text: 'Compact', cls: 'compact' },
    { text: 'Economique', cls: 'eco' },
  ];
  if (panelRecos.length > 0 && panelRecos[0].totalPanels > panelRecos[panelRecos.length - 1].totalPanels) {
    labels[0] = { text: 'Compact', cls: 'compact' };
    labels[panelRecos.length - 1] = { text: 'Economique', cls: 'eco' };
  }

  container.innerHTML = panelRecos.map((r, i) => {
    const badge = i < labels.length ? labels[i] : labels[0];
    const sel = i === 0 ? ' selected' : '';
    return `<div class="reco-card${sel}" onclick="selectPanelOption(${i})">
      <div class="reco-badge ${badge.cls}">${badge.text}</div>
      <div class="reco-title">${r.model.label} — ${r.totalPanels} panneaux</div>
      <div class="reco-row"><span>${r.panelsInSeries}S x ${r.stringsInParallel}P</span><span class="val">${formatNum(r.installedPc, 0)} Wc</span></div>
      <div class="reco-row"><span>Ratio couverture</span><span class="val">${formatNum(r.ratio, 2)}x</span></div>
      <div class="reco-row"><span>Cout panneaux</span><span class="val">${formatPrice(r.cost)} FCFA</span></div>
    </div>`;
  }).join('');

  if (panelRecos.length > 0) selectPanelOption(0);
}

function selectPanelOption(idx) {
  const r = panelRecos[idx];
  if (!r) return;
  document.querySelectorAll('#panelRecos .reco-card').forEach((el, i) => {
    el.classList.toggle('selected', i === idx);
  });
  document.getElementById('panelPower').value = r.model.power;
  document.getElementById('panelVmp').value = r.model.vmp;
  document.getElementById('panelImp').value = r.model.imp;
  document.getElementById('panelVoc').value = r.model.voc;
  generateRegulatorRecommendation();
}

function generateBatteryRecommendations() {
  const container = document.getElementById('batteryRecos');
  if (state.appliances.length === 0 || !state.city) {
    container.innerHTML = '<div class="form-hint">Ajoutez des appareils et selectionnez une ville pour voir les recommandations.</div>';
    batteryRecos = [];
    return;
  }

  const dailyEnergy = Engine.totalDailyEnergy(state.appliances);
  const preset = BATTERY_PRESETS[state.batteryType];
  let requiredCap;
  if (state.installationType === 'hybrid') {
    requiredCap = Engine.requiredBatteryCapacityHybrid(dailyEnergy, state.cutoffHours, state.vSystem, preset.dod, preset.efficiency);
  } else {
    requiredCap = Engine.requiredBatteryCapacity(dailyEnergy, state.autonomyDays, state.vSystem, preset.dod, preset.efficiency);
  }

  let battModels;
  if (state.batteryType === 'plomb' && typeof BATTERY_VV !== 'undefined') {
    battModels = BATTERY_VV.map(b => ({ label: b.label, capacity: b.capacity, voltage: b.voltage, catalogPrice: b.price }));
  } else if (['agm', 'gel'].includes(state.batteryType) && typeof BATTERY_GEL !== 'undefined') {
    battModels = BATTERY_GEL.map(b => ({ label: b.label, capacity: b.capacity, voltage: b.voltage, catalogPrice: b.price }));
  } else if (['lfp', 'nmc'].includes(state.batteryType) && typeof BATTERY_LITHIUM !== 'undefined') {
    battModels = BATTERY_LITHIUM.filter(b => b.voltage <= state.vSystem).map(b => ({ label: b.label, capacity: b.capacity, voltage: b.voltage, catalogPrice: b.price }));
    if (battModels.length === 0) battModels = BATTERY_LITHIUM.map(b => ({ label: b.label, capacity: b.capacity, voltage: b.voltage, catalogPrice: b.price }));
  } else {
    const battKey = 'battery_' + state.batteryType;
    const unitPrice = DEFAULT_COSTS[battKey]?.price || DEFAULT_COSTS.battery_plomb.price;
    battModels = BATTERY_CAPACITIES.map(b => ({ ...b, catalogPrice: unitPrice }));
  }

  const results = [];
  for (const model of battModels) {
    const bSeries = Engine.batteriesInSeries(state.vSystem, model.voltage);
    const bParallel = Engine.batteriesInParallel(requiredCap, model.capacity);
    const total = Engine.totalBatteries(bSeries, bParallel);
    const installedCap = Engine.installedBatteryCapacity(bParallel, model.capacity);
    const usable = Engine.usableStoredEnergy(installedCap, state.vSystem, preset.dod);
    const autonomy = Engine.realAutonomy(usable, dailyEnergy);
    const cost = total * model.catalogPrice;

    results.push({ model, batteriesInSeries: bSeries, batteriesInParallel: bParallel, totalBatteries: total, installedCap, usableEnergy: usable, autonomy, cost });
  }

  results.sort((a, b) => a.totalBatteries - b.totalBatteries);
  batteryRecos = results;

  const labels = [
    { text: 'Recommande', cls: 'optimal' },
    { text: 'Standard', cls: 'compact' },
    { text: 'Confort', cls: 'eco' },
  ];

  container.innerHTML = batteryRecos.map((r, i) => {
    const badge = i < labels.length ? labels[i] : labels[0];
    const sel = i === 0 ? ' selected' : '';
    return `<div class="reco-card${sel}" onclick="selectBatteryOption(${i})">
      <div class="reco-badge ${badge.cls}">${badge.text}</div>
      <div class="reco-title">${r.model.label} — ${r.totalBatteries} batteries</div>
      <div class="reco-row"><span>${r.batteriesInSeries}S x ${r.batteriesInParallel}P</span><span class="val">${formatNum(r.installedCap, 0)} Ah</span></div>
      <div class="reco-row"><span>Energie utile</span><span class="val">${formatNum(r.usableEnergy, 1)} kWh</span></div>
      <div class="reco-row"><span>Autonomie</span><span class="val">${formatNum(r.autonomy, 1)} jours</span></div>
      <div class="reco-row"><span>Cout batteries</span><span class="val">${formatPrice(r.cost)} FCFA</span></div>
    </div>`;
  }).join('');

  if (batteryRecos.length > 0) selectBatteryOption(0);
}

function selectBatteryOption(idx) {
  const r = batteryRecos[idx];
  if (!r) return;
  document.querySelectorAll('#batteryRecos .reco-card').forEach((el, i) => {
    el.classList.toggle('selected', i === idx);
  });
  document.getElementById('batteryCapacity').value = r.model.capacity;
  document.getElementById('batteryVoltage').value = r.model.voltage;
  const preset = BATTERY_PRESETS[state.batteryType];
  document.getElementById('batteryDoD').value = Math.round(preset.dod * 100);
  document.getElementById('batteryEff').value = Math.round(preset.efficiency * 100);
  document.getElementById('batteryLife').value = preset.lifeYears;
}

function selectInverterType(type) {
  state.inverterType = type;
  document.getElementById('inverterType').value = type;
  document.querySelectorAll('[data-inv]').forEach(el => {
    el.classList.toggle('selected', el.dataset.inv === type);
  });
  const hint = document.getElementById('invTypeHint');
  if (type === 'onduleur') {
    hint.textContent = 'Onduleur hybride : gere solaire + reseau/groupe, avec regulateur integre';
  } else if (type === 'onduleur_sinus') {
    hint.textContent = 'Onduleur pur sinus : signal sinusoidal propre, adapte aux grandes installations';
  } else {
    hint.textContent = 'Convertisseur DC/AC : pour les petites installations (jusqu\'a 3 kW)';
  }
  generateInverterRecommendation();
}

function generateInverterRecommendation() {
  const container = document.getElementById('inverterReco');
  if (!container) return;
  if (state.appliances.length === 0) {
    container.innerHTML = '<div class="form-hint">Ajoutez des appareils pour voir la recommandation.</div>';
    return;
  }

  const type = state.inverterType || 'onduleur';
  const peakPower = Engine.peakPower(state.appliances);
  const inverterPeak = Engine.inverterPeakPower(peakPower);
  const continuousPower = Engine.inverterContinuousPower(Engine.simultaneousPower(state.appliances));

  if (type === 'onduleur' || type === 'onduleur_sinus') {
    const catalog = type === 'onduleur_sinus' ? INVERTER_SINUS_MODELS : INVERTER_MODELS;
    const candidates = catalog.filter(m => m.power >= continuousPower)
      .sort((a, b) => a.power - b.power);
    const best = candidates[0] || catalog[catalog.length - 1];

    document.getElementById('inverterModelPrice').value = best.price;
    const titleLabel = type === 'onduleur' ? 'Onduleur hybride' : 'Onduleur pur sinus';

    container.innerHTML = `<div class="reco-card selected" style="cursor:default;">
      <div class="reco-badge auto">Recommande</div>
      <div class="reco-title">${titleLabel} ${best.label} — Felicity Solar</div>
      <div class="reco-row"><span>Puissance continue</span><span class="val">${formatNum(continuousPower, 0)} W requis</span></div>
      <div class="reco-row"><span>Puissance pointe</span><span class="val">${formatNum(inverterPeak, 0)} W</span></div>
      <div class="reco-row"><span>Tension</span><span class="val">${best.voltage}V</span></div>
      <div class="reco-row"><span>Prix</span><span class="val">${formatPrice(best.price)} FCFA</span></div>
    </div>`;
  } else {
    const candidates = CONVERTER_MODELS.filter(m => m.power >= continuousPower)
      .sort((a, b) => a.power - b.power);
    const best = candidates[0] || CONVERTER_MODELS[CONVERTER_MODELS.length - 1];

    document.getElementById('inverterModelPrice').value = best.price;

    container.innerHTML = `<div class="reco-card selected" style="cursor:default;">
      <div class="reco-badge auto">Recommande</div>
      <div class="reco-title">Convertisseur ${best.label} — Sako</div>
      <div class="reco-row"><span>Puissance continue</span><span class="val">${formatNum(continuousPower, 0)} W requis</span></div>
      <div class="reco-row"><span>Puissance pointe</span><span class="val">${formatNum(inverterPeak, 0)} W</span></div>
      <div class="reco-row"><span>DC 12V → AC 220V</span><span class="val"></span></div>
      <div class="reco-row"><span>Prix</span><span class="val">${formatPrice(best.price)} FCFA</span></div>
    </div>`;
  }
}

// ═══ CATALOGUE EQUIPEMENTS ═══
const CATALOG_TABS = [
  { id: 'panels',       label: 'Panneaux' },
  { id: 'inverters',    label: 'Onduleurs' },
  { id: 'converters',   label: 'Convertisseurs' },
  { id: 'regulators',   label: 'Regulateurs' },
  { id: 'batteries',    label: 'Batteries' },
];
let catalogActiveTab = 'panels';

function openCatalog() {
  renderCatalogTabs();
  renderCatalogContent();
  document.getElementById('catalogModal').classList.add('show');
}

function closeCatalog() {
  document.getElementById('catalogModal').classList.remove('show');
}

function renderCatalogTabs() {
  const container = document.getElementById('catalogTabs');
  container.innerHTML = CATALOG_TABS.map(t =>
    `<button class="cat-tab${t.id === catalogActiveTab ? ' active' : ''}" onclick="switchCatalogTab('${t.id}')">${t.label}</button>`
  ).join('');
}

function switchCatalogTab(tabId) {
  catalogActiveTab = tabId;
  renderCatalogTabs();
  renderCatalogContent();
}

function renderCatalogContent() {
  const container = document.getElementById('catalogContent');
  let html = '';

  if (catalogActiveTab === 'panels') {
    html = `<div class="catalog-grid">`;
    for (const p of PANEL_MODELS) {
      html += `<div class="catalog-item">
        <div class="catalog-item-name">${p.label}</div>
        <div class="catalog-item-specs">Vmp: ${p.vmp}V · Imp: ${p.imp}A · Voc: ${p.voc}V</div>
        <div class="catalog-item-price">${formatPrice(p.price)} F</div>
      </div>`;
    }
    html += `</div>`;
  }

  else if (catalogActiveTab === 'inverters') {
    html = `<div class="catalog-section-title">Onduleurs hybrides — Felicity Solar</div><div class="catalog-grid">`;
    for (const inv of INVERTER_MODELS) {
      html += `<div class="catalog-item">
        <div class="catalog-item-name">${inv.label}</div>
        <div class="catalog-item-specs">${inv.voltage}V · ${formatNum(inv.power, 0)} W</div>
        <div class="catalog-item-price">${formatPrice(inv.price)} F</div>
      </div>`;
    }
    html += `</div>`;
    html += `<div class="catalog-section-title" style="margin-top:16px;">Onduleurs pur sinus</div><div class="catalog-grid">`;
    for (const inv of INVERTER_SINUS_MODELS) {
      html += `<div class="catalog-item">
        <div class="catalog-item-name">${inv.label}</div>
        <div class="catalog-item-specs">${inv.voltage}V · ${formatNum(inv.power, 0)} W</div>
        <div class="catalog-item-price">${formatPrice(inv.price)} F</div>
      </div>`;
    }
    html += `</div>`;
  }

  else if (catalogActiveTab === 'converters') {
    html = `<div class="catalog-section-title">Convertisseurs DC/AC — Sako</div><div class="catalog-grid">`;
    for (const c of CONVERTER_MODELS) {
      html += `<div class="catalog-item">
        <div class="catalog-item-name">${c.label}</div>
        <div class="catalog-item-specs">DC 12V → AC 220V</div>
        <div class="catalog-item-price">${formatPrice(c.price)} F</div>
      </div>`;
    }
    html += `</div>`;
  }

  else if (catalogActiveTab === 'regulators') {
    html = `<div class="catalog-section-title">MPPT — Felicity Solar</div><div class="catalog-grid">`;
    for (const reg of REGULATOR_MODELS) {
      html += `<div class="catalog-item">
        <div class="catalog-item-name">${reg.label}</div>
        <div class="catalog-item-specs">Courant max: ${reg.current}A</div>
        <div class="catalog-item-price">${formatPrice(reg.price)} F</div>
      </div>`;
    }
    html += `</div>`;
    html += `<div class="catalog-section-title mt-8">PWM — Raggie</div><div class="catalog-grid">`;
    for (const reg of REGULATOR_PWM_MODELS) {
      html += `<div class="catalog-item">
        <div class="catalog-item-name">${reg.label}</div>
        <div class="catalog-item-specs">Courant max: ${reg.current}A</div>
        <div class="catalog-item-price">${formatPrice(reg.price)} F</div>
      </div>`;
    }
    html += `</div>`;
  }

  else if (catalogActiveTab === 'batteries') {
    html = `<div class="catalog-section-title">Batteries VV generique</div><div class="catalog-grid">`;
    for (const b of BATTERY_VV) {
      html += `<div class="catalog-item">
        <div class="catalog-item-name">${b.label}</div>
        <div class="catalog-item-specs">${b.capacity} Ah · ${b.voltage}V</div>
        <div class="catalog-item-price">${formatPrice(b.price)} F</div>
      </div>`;
    }
    html += `</div>`;
    html += `<div class="catalog-section-title mt-8">Batteries Gel</div><div class="catalog-grid">`;
    for (const b of BATTERY_GEL) {
      html += `<div class="catalog-item">
        <div class="catalog-item-name">${b.label}</div>
        <div class="catalog-item-specs">${b.capacity} Ah · ${b.voltage}V</div>
        <div class="catalog-item-price">${formatPrice(b.price)} F</div>
      </div>`;
    }
    html += `</div>`;
    html += `<div class="catalog-section-title mt-8">Batteries Lithium</div><div class="catalog-grid">`;
    for (const b of BATTERY_LITHIUM) {
      html += `<div class="catalog-item">
        <div class="catalog-item-name">${b.label}</div>
        <div class="catalog-item-specs">${b.capacity} Ah · ${b.voltage}V · ${b.kwh} kWh</div>
        <div class="catalog-item-price">${formatPrice(b.price)} F</div>
      </div>`;
    }
    html += `</div>`;
  }

  container.innerHTML = html;
}

// ═══ CALCULATION ═══
function getInput() {
  const preset = BATTERY_PRESETS[state.batteryType];
  const isExpert = state.mode === 'expert';
  const customHSP = isExpert ? parseFloat(document.getElementById('customHSP').value) : NaN;

  const battPreset = isExpert ? {
    ...preset,
    dod: parseFloat(document.getElementById('batteryDoD').value) / 100 || preset.dod,
    efficiency: parseFloat(document.getElementById('batteryEff').value) / 100 || preset.efficiency,
    lifeYears: parseFloat(document.getElementById('batteryLife').value) || preset.lifeYears,
  } : preset;

  const panelPower = parseFloat(document.getElementById('panelPower').value) || 300;
  const batteryCapacity = parseFloat(document.getElementById('batteryCapacity').value) || 200;

  const panelModel = PANEL_MODELS.find(p => p.power === panelPower);
  const catalogPanelPrice = panelModel ? panelModel.price : undefined;

  let catalogBatteryPrice;
  if (state.batteryType === 'plomb' && typeof BATTERY_VV !== 'undefined') {
    const vvMatch = BATTERY_VV.find(b => b.capacity === batteryCapacity);
    catalogBatteryPrice = vvMatch ? vvMatch.price : undefined;
  } else if (['agm', 'gel'].includes(state.batteryType) && typeof BATTERY_GEL !== 'undefined') {
    const gelMatch = BATTERY_GEL.find(b => b.capacity === batteryCapacity);
    catalogBatteryPrice = gelMatch ? gelMatch.price : undefined;
  } else if (typeof BATTERY_LITHIUM !== 'undefined') {
    const liMatch = BATTERY_LITHIUM.find(b => b.capacity === batteryCapacity && b.voltage === state.vSystem);
    if (!liMatch) {
      const liAny = BATTERY_LITHIUM.find(b => b.capacity === batteryCapacity);
      catalogBatteryPrice = liAny ? liAny.price : undefined;
    } else {
      catalogBatteryPrice = liMatch.price;
    }
  }

  return {
    appliances: state.appliances,
    installationType: state.installationType,
    hsp: isNaN(customHSP) ? state.hsp : customHSP,
    kLossZone: (isExpert && document.getElementById('customKLoss').value) ? parseFloat(document.getElementById('customKLoss').value) : (CLIMATE_ZONES[state.zone]?.kLoss || 0.75),
    vSystem: state.vSystem,
    autonomyDays: state.autonomyDays,
    cutoffHours: state.cutoffHours,
    regulatorType: state.regulatorType,
    inverterType: state.inverterType || 'onduleur',
    panelPower: panelPower,
    panelVmp: parseFloat(document.getElementById('panelVmp').value) || 36,
    panelImp: parseFloat(document.getElementById('panelImp').value) || 8.33,
    panelVoc: parseFloat(document.getElementById('panelVoc').value) || 44,
    batteryPreset: battPreset,
    batteryType: state.batteryType,
    batteryCapacity: batteryCapacity,
    batteryVoltage: parseFloat(document.getElementById('batteryVoltage').value) || 12,
    effInverter: isExpert ? parseFloat(document.getElementById('effInverter').value) || 0.90 : 0.90,
    effCable: isExpert ? parseFloat(document.getElementById('effCable').value) : 0.95,
    effRegulator: isExpert ? parseFloat(document.getElementById('effRegulator').value) : undefined,
    marginRegulator: isExpert ? parseFloat(document.getElementById('marginRegulator').value) || 1.25 : 1.25,
    marginInverter: isExpert ? parseFloat(document.getElementById('marginInverter').value) || 1.25 : 1.25,
    moPercent: isExpert ? (parseFloat(document.getElementById('moPercent').value) / 100) : undefined,
    transportPercent: isExpert ? (parseFloat(document.getElementById('transportPercent').value) / 100) : undefined,
    contingencyPercent: isExpert ? (parseFloat(document.getElementById('contingencyPercent').value) / 100) : undefined,
    catalogPanelPrice,
    catalogBatteryPrice,
    catalogInverterPrice: parseFloat(document.getElementById('inverterModelPrice').value) || undefined,
    systemLifeYears: isExpert ? (parseFloat(document.getElementById('systemLifeYears').value) || 20) : 20,
    inverterLifeYears: isExpert ? (parseFloat(document.getElementById('inverterLifeYears').value) || 10) : 10,
    regulatorLifeYears: isExpert ? (parseFloat(document.getElementById('regulatorLifeYears').value) || 15) : 15,
  };
}

function runCalculation() {
  if (state.appliances.length === 0) {
    state.results = null;
    document.getElementById('warningsContainer').innerHTML =
      '<div class="alert alert-error"><span class="alert-icon">&#9888;</span><div>Aucun appareil saisi. Retournez a l\'etape 2 pour ajouter vos appareils.</div></div>';
    document.getElementById('resultsSummary').innerHTML = '';
    document.getElementById('resultsPanels').innerHTML = '';
    document.getElementById('resultsBatteries').innerHTML = '';
    document.getElementById('resultsRegInv').innerHTML = '';
    document.getElementById('resultsProdBar').innerHTML = '';
    return;
  }
  const input = getInput();
  state.results = Engine.compute(input);
  state.costs = null;
  renderResults(state.results, input);
}

function renderResults(r, input) {
  // Warnings
  const wc = document.getElementById('warningsContainer');
  wc.innerHTML = r.warnings.map(w =>
    `<div class="alert alert-${w.severity === 'error' ? 'error' : 'warning'}">
       <span class="alert-icon">${w.severity === 'error' ? '&#9888;' : '&#9432;'}</span>
       <div><b>${w.code}</b> — ${w.msg}</div>
     </div>`
  ).join('');

  // Summary grid
  document.getElementById('resultsSummary').innerHTML = `
    <div class="result-card highlight">
      <div class="r-value">${formatNum(r.dailyEnergyKwh, 2)}</div>
      <div class="r-unit">kWh/j</div>
      <div class="r-label">Consommation</div>
    </div>
    <div class="result-card highlight">
      <div class="r-value">${formatNum(r.dailyProduction, 2)}</div>
      <div class="r-unit">kWh/j</div>
      <div class="r-label">Production</div>
    </div>
    <div class="result-card">
      <div class="r-value">${r.totalPanels}</div>
      <div class="r-unit">x ${input.panelPower} Wc</div>
      <div class="r-label">Panneaux</div>
    </div>
    <div class="result-card">
      <div class="r-value">${r.totalBatteries}</div>
      <div class="r-unit">x ${input.batteryCapacity} Ah</div>
      <div class="r-label">Batteries</div>
    </div>
  `;

  // Panels detail
  document.getElementById('resultsPanels').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;">
      <div>Puissance crete necessaire</div><div class="text-right fw-700">${formatNum(r.requiredPc, 0)} Wc</div>
      <div>Nombre de panneaux</div><div class="text-right fw-700">${r.totalPanels}</div>
      <div>En serie</div><div class="text-right">${r.panelsInSeries}</div>
      <div>Chaines en parallele</div><div class="text-right">${r.stringsInParallel}</div>
      <div>Puissance installee</div><div class="text-right fw-700 color-primary">${formatNum(r.installedPc, 0)} Wc (${formatNum(r.installedPcKw, 2)} kWc)</div>
    </div>`;

  // Batteries detail
  document.getElementById('resultsBatteries').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;">
      <div>Capacite necessaire</div><div class="text-right fw-700">${formatNum(r.requiredBatteryCap, 0)} Ah</div>
      <div>En serie</div><div class="text-right">${r.batteriesInSeries}</div>
      <div>En parallele</div><div class="text-right">${r.batteriesInParallel}</div>
      <div>Nombre total</div><div class="text-right fw-700">${r.totalBatteries}</div>
      <div>Capacite installee</div><div class="text-right">${formatNum(r.installedBatteryCap, 0)} Ah</div>
      <div>Energie utile</div><div class="text-right fw-700 color-primary">${formatNum(r.usableEnergy, 1)} kWh</div>
      <div>Autonomie reelle</div><div class="text-right">${formatNum(r.realAutonomy, 1)} jours</div>
    </div>`;

  // Regulator & Inverter
  const regStandard = [10, 20, 30, 40, 50, 60, 80, 100];
  const regMax = regStandard[regStandard.length - 1];
  const regCount = Math.ceil(r.regulatorCurrent / regMax);
  const regUnit = regStandard.find(a => a >= r.regulatorCurrent / regCount) || regMax;
  const regLabel = regCount > 1
    ? `${regCount}x ${input.regulatorType.toUpperCase()} ${regUnit}A / ${input.vSystem}V`
    : `${input.regulatorType.toUpperCase()} ${regUnit}A / ${input.vSystem}V`;

  const invStandard = [500, 1000, 1500, 2000, 3000, 5000, 8000, 10000];
  const invMax = invStandard[invStandard.length - 1];
  const invCount = Math.ceil(r.inverterPeak / invMax);
  const invUnit = invStandard.find(w => w >= r.inverterPeak / invCount) || invMax;
  const invLabel = invCount > 1
    ? `${invCount}x ${invUnit} W / ${input.vSystem}V`
    : `${invUnit} W / ${input.vSystem}V`;

  const isOffgrid = input.installationType === 'offgrid';
  const invType = input.inverterType || 'onduleur';
  const invTypeLabel = invType === 'onduleur' ? 'Onduleur hybride' : invType === 'onduleur_sinus' ? 'Onduleur pur sinus' : 'Convertisseur';
  const regInvTitleEl = document.getElementById('resultsRegInvTitle');
  if (regInvTitleEl) regInvTitleEl.textContent = isOffgrid ? (invType === 'onduleur_sinus' ? 'Regulateur & Onduleur' : 'Regulateur & Convertisseur') : 'Onduleur hybride';
  const regSection = isOffgrid ? `
      <div>Type regulateur</div><div class="text-right fw-700">${input.regulatorType.toUpperCase()}</div>
      <div>Courant min. calcule</div><div class="text-right">${formatNum(r.regulatorCurrent, 1)} A</div>
      <div>Regulateur recommande</div><div class="text-right fw-700 color-primary">${regLabel}</div>
      ${r.maxInputVoltage ? `<div>Tension entree max PV</div><div class="text-right">${formatNum(r.maxInputVoltage, 0)} V</div>` : ''}
      <div style="border-top:1px solid var(--border);padding-top:6px;">` : '<div>';

  document.getElementById('resultsRegInv').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;">
      ${regSection}Puissance continue</div><div class="text-right fw-700" ${isOffgrid ? 'style="border-top:1px solid var(--border);padding-top:6px;"' : ''}>${formatNum(r.inverterContinuous, 0)} W</div>
      <div>Puissance pointe (demarrage)</div><div class="text-right fw-700 color-warn">${formatNum(r.inverterPeak, 0)} W</div>
      <div>${invTypeLabel} recommande</div><div class="text-right fw-700 color-primary">${invLabel}</div>
    </div>`;

  // Production bar
  const ratio = r.coverageRatio;
  const barClass = ratio >= 1.3 ? 'good' : ratio >= 1.0 ? 'ok' : 'bad';
  const barWidth = Math.min(ratio / 2 * 100, 100);
  document.getElementById('resultsProdBar').innerHTML = `
    <div class="prod-bar-wrap">
      <div class="prod-bar-labels">
        <span>Consommation: ${formatNum(r.dailyEnergyKwh, 2)} kWh/j</span>
        <span>Production: ${formatNum(r.dailyProduction, 2)} kWh/j</span>
      </div>
      <div class="prod-bar">
        <div class="prod-bar-fill ${barClass}" style="width:${barWidth}%"></div>
      </div>
      <div style="text-align:center; margin-top:6px; font-size:13px;">
        Ratio de couverture : <b style="color: var(--${barClass === 'good' ? 'success' : barClass === 'ok' ? 'accent' : 'warn'});">${formatNum(ratio, 2)}x</b>
        ${ratio >= 1.3 ? ' — Bon' : ratio >= 1.0 ? ' — Juste' : ' — Insuffisant'}
      </div>
    </div>`;

  renderFormulas(r, input);
}

function renderFormulas(r, input) {
  const container = document.getElementById('formulasDisplay');
  if (!container) return;

  const effInv = input.effInverter || 0.90;
  const effBatt = input.batteryPreset.efficiency;
  const hsp = input.hsp;
  const kLoss = input.kLossZone;
  const dod = input.batteryPreset.dod;
  const vSys = input.vSystem;
  const mReg = input.marginRegulator || 1.25;
  const mInv = input.marginInverter || 1.25;
  const isOffgrid = input.installationType === 'offgrid';

  let regFormula = '';
  if (isOffgrid) {
    if (input.regulatorType === 'mppt') {
      regFormula = `<div class="formula-block">
        <div class="formula-label">F16b — Courant regulateur MPPT</div>
        <div class="formula-eq">I = (Pc_inst × η_reg / V_sys) × marge</div>
        <div class="formula-val">I = (${formatNum(r.installedPc,0)} × ${effBatt.toFixed(2)} / ${vSys}) × ${mReg} = <b>${formatNum(r.regulatorCurrent,1)} A</b></div>
      </div>`;
    } else {
      regFormula = `<div class="formula-block">
        <div class="formula-label">F16a — Courant regulateur PWM</div>
        <div class="formula-eq">I = N_parallele × Imp × marge</div>
        <div class="formula-val">I = ${r.stringsInParallel} × ${input.panelImp} × ${mReg} = <b>${formatNum(r.regulatorCurrent,1)} A</b></div>
      </div>`;
    }
  }

  const battFormula = isOffgrid
    ? `<div class="formula-block">
        <div class="formula-label">F11 — Capacite batterie (off-grid)</div>
        <div class="formula-eq">C = (E_tot × Jours_auto) / (V_sys × DoD × η_batt)</div>
        <div class="formula-val">C = (${formatNum(r.dailyEnergy,0)} × ${input.autonomyDays}) / (${vSys} × ${dod} × ${effBatt.toFixed(2)}) = <b>${formatNum(r.requiredBatteryCap,0)} Ah</b></div>
      </div>`
    : `<div class="formula-block">
        <div class="formula-label">F11b — Capacite batterie (hybride)</div>
        <div class="formula-eq">C = (E_tot × H_coupure / 24) / (V_sys × DoD × η_batt)</div>
        <div class="formula-val">C = (${formatNum(r.dailyEnergy,0)} × ${input.cutoffHours || 4} / 24) / (${vSys} × ${dod} × ${effBatt.toFixed(2)}) = <b>${formatNum(r.requiredBatteryCap,0)} Ah</b></div>
      </div>`;

  container.innerHTML = `
    <div class="formulas-grid">
      <div class="formula-block">
        <div class="formula-label">F5 — Energie corrigee</div>
        <div class="formula-eq">E_corr = E_tot / (η_ond × η_batt)</div>
        <div class="formula-val">E_corr = ${formatNum(r.dailyEnergy,0)} / (${effInv} × ${effBatt.toFixed(2)}) = <b>${formatNum(r.correctedEnergy,0)} Wh/j</b></div>
      </div>
      <div class="formula-block">
        <div class="formula-label">F6 — Puissance crete necessaire</div>
        <div class="formula-eq">Pc = E_corr / (HSP × kLoss)</div>
        <div class="formula-val">Pc = ${formatNum(r.correctedEnergy,0)} / (${hsp} × ${kLoss}) = <b>${formatNum(r.requiredPc,0)} Wc</b></div>
      </div>
      ${battFormula}
      ${regFormula}
      <div class="formula-block">
        <div class="formula-label">F17 — Puissance onduleur continu</div>
        <div class="formula-eq">P_ond = P_simultanee × marge</div>
        <div class="formula-val">P_ond = ${formatNum(r.simultaneousPower,0)} × ${mInv} = <b>${formatNum(r.inverterContinuous,0)} W</b></div>
      </div>
      <div class="formula-block">
        <div class="formula-label">F19 — Production journaliere</div>
        <div class="formula-eq">Prod = (Pc_inst × HSP × kLoss) / 1000</div>
        <div class="formula-val">Prod = (${formatNum(r.installedPc,0)} × ${hsp} × ${kLoss}) / 1000 = <b>${formatNum(r.dailyProduction,2)} kWh/j</b></div>
      </div>
      <div class="formula-block">
        <div class="formula-label">F24 — LCOE (cout vie entiere)</div>
        <div class="formula-eq">LCOE = Cout_vie_entiere / (Prod_j × 365 × Duree_vie_systeme)</div>
        <div class="formula-val">Calcule a l'etape Couts — inclut les remplacements batteries et onduleur sur la duree de vie du systeme (defaut 25 ans)</div>
      </div>
    </div>`;
}

// ═══ COSTS ═══
function runCostCalculation() {
  if (!state.results) runCalculation();
  if (!state.results) return;
  const input = getInput();
  state.costs = Engine.computeCosts(state.results, input, state.customPrices || {}, state.customQty);
  renderCosts(state.costs);
}

const ACCESSORY_KEYS = ['mounting','cable_dc','cable_ac','mc4','protection_dc','protection_ac','grounding','battery_cables','battery_cabinet','misc'];

function renderCosts(c) {
  const table = document.getElementById('costTable');
  let html = `<thead><tr>
    <th>Poste</th><th>Qte</th><th>Prix unit. (FCFA)</th><th>Total</th>
  </tr></thead><tbody>`;

  c.items.forEach((it, i) => {
    const isAccessory = ACCESSORY_KEYS.includes(it.key);
    const qtyCell = isAccessory
      ? `<input type="number" class="qty-input" value="${it.qty}" min="0" step="1" onchange="onQtyChange(${i}, this.value)">`
      : `${it.qty}`;
    const refLine = it.ref ? `<div style="font-size:11px;color:var(--text-sec);font-weight:400;">${it.ref}${it.specs ? ' · ' + it.specs : ''}</div>` : '';
    html += `<tr>
      <td>${it.label}${refLine}</td>
      <td>${qtyCell}</td>
      <td><input type="number" class="price-input" value="${it.price}" min="0" step="1000" data-idx="${i}" onchange="onPriceChange(${i}, this.value)"></td>
      <td class="row-total">${formatPrice(it.total)}</td>
    </tr>`;
  });

  html += `<tr class="subtotal-row">
    <td colspan="3">Sous-total materiel</td>
    <td class="row-total">${formatPrice(c.subtotal)}</td>
  </tr>`;
  html += `<tr><td>Main d'oeuvre (${Math.round(c.moPercent*100)}%)</td><td></td><td></td><td class="row-total">${formatPrice(c.mo)}</td></tr>`;
  html += `<tr><td>Transport (${Math.round(c.transportPercent*100)}%)</td><td></td><td></td><td class="row-total">${formatPrice(c.transport)}</td></tr>`;
  html += `<tr><td>Imprevus (${Math.round(c.contingencyPercent*100)}%)</td><td></td><td></td><td class="row-total">${formatPrice(c.contingency)}</td></tr>`;
  html += `<tr class="grand-total">
    <td colspan="3">COUT TOTAL</td>
    <td class="row-total">${formatPrice(c.total)}</td>
  </tr>`;
  html += '</tbody>';
  table.innerHTML = html;

  // Projection duree de vie
  let projHtml = `<div class="card mt-8">
    <div class="card-title">Projection sur ${c.systemLifeYears} ans</div>
    <div style="font-size:13px;display:grid;grid-template-columns:1fr auto;gap:4px 12px;">
      <div>Investissement initial</div><div style="text-align:right;font-weight:600">${formatPrice(c.total)}</div>
      <div>Remplacement batteries (${c.battReplacements}× en ${c.battLifeYears} ans)</div><div style="text-align:right">${formatPrice(c.battReplacementCost)}</div>
      <div>Remplacement onduleur (${c.invReplacements}× en ${c.inverterLifeYears} ans)</div><div style="text-align:right">${formatPrice(c.invReplacementCost)}</div>`;
  if (c.regReplacements > 0) {
    projHtml += `<div>Remplacement regulateur (${c.regReplacements}× en ${c.regulatorLifeYears} ans)</div><div style="text-align:right">${formatPrice(c.regReplacementCost)}</div>`;
  }
  projHtml += `<div style="border-top:2px solid var(--primary);padding-top:6px;font-weight:700;color:var(--primary);">Cout total sur ${c.systemLifeYears} ans</div>
      <div style="text-align:right;border-top:2px solid var(--primary);padding-top:6px;font-weight:700;color:var(--primary);">${formatPrice(c.lifetimeCost)}</div>
    </div>
  </div>`;
  document.getElementById('costProjection').innerHTML = projHtml;

  const dailyEnergy = state.results ? state.results.dailyEnergy : 0;
  const gridPriceKwh = 95;
  const dailySaving = (dailyEnergy / 1000) * gridPriceKwh;
  const paybackYears = dailySaving > 0 ? c.total / (dailySaving * 365) : 0;

  document.getElementById('costIndicators').innerHTML = `
    <div class="result-card">
      <div class="r-value">${formatPrice(c.total)}</div>
      <div class="r-unit">FCFA</div>
      <div class="r-label">Investissement initial</div>
    </div>
    <div class="result-card">
      <div class="r-value">${formatPrice(c.lifetimeCost)}</div>
      <div class="r-unit">FCFA</div>
      <div class="r-label">Cout sur ${c.systemLifeYears} ans</div>
    </div>
    <div class="result-card highlight">
      <div class="r-value">${formatNum(c.lcoe, 0)}</div>
      <div class="r-unit">FCFA/kWh</div>
      <div class="r-label">LCOE (${c.systemLifeYears} ans)</div>
    </div>
    <div class="result-card">
      <div class="r-value">${paybackYears > 0 ? formatNum(paybackYears, 1) : '—'}</div>
      <div class="r-unit">annees</div>
      <div class="r-label">Retour sur investissement</div>
    </div>
  `;
}

function onPriceChange(idx, value) {
  if (!state.costs) return;
  const newPrice = Math.max(0, parseInt(value) || 0);
  const customPrices = state.customPrices || {};
  const item = state.costs.items[idx];
  customPrices[item.key] = { ...DEFAULT_COSTS[item.key], price: newPrice };
  state.customPrices = customPrices;
  const input = getInput();
  state.costs = Engine.computeCosts(state.results, input, customPrices, state.customQty);
  renderCosts(state.costs);
}

function onQtyChange(idx, value) {
  if (!state.costs) return;
  const newQty = Math.max(0, parseInt(value) || 0);
  const customQty = state.customQty || {};
  const item = state.costs.items[idx];
  customQty[item.key] = newQty;
  state.customQty = customQty;
  const input = getInput();
  state.costs = Engine.computeCosts(state.results, input, state.customPrices || {}, customQty);
  renderCosts(state.costs);
}

// ═══ EXPORT PDF ═══
function printPage(htmlContent) {
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(htmlContent);
    w.document.close();
    setTimeout(() => w.print(), 500);
    return;
  }
  const titleMatch = htmlContent.match(/<title>([^<]*)<\/title>/);
  const pdfTitle = titleMatch ? titleMatch[1] : 'DIMMAP';
  const originalTitle = document.title;
  const originalBody = document.body.innerHTML;
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const styleMatch = htmlContent.match(/<style>([\s\S]*?)<\/style>/);
  document.title = pdfTitle;
  document.body.innerHTML = (styleMatch ? '<style>' + styleMatch[1] + '</style>' : '') + (bodyMatch ? bodyMatch[1] : htmlContent);
  window.print();
  document.title = originalTitle;
  document.body.innerHTML = originalBody;
}

function exportPDF() {
  if (!state.results || !state.costs) return;
  printPage(generatePrintHTML());
}

function exportBOM() {
  if (!state.results || !state.costs) return;
  const c = state.costs;
  const r = state.results;
  const input = getInput();
  const projectName = document.getElementById('projectName').value || 'Projet sans nom';
  const cityName = state.city ? `${state.city.name}, ${state.country.name}` : '';
  const isOffgrid = input.installationType === 'offgrid';
  const mainItems = c.items.filter(it => !ACCESSORY_KEYS.includes(it.key));
  const accItems = c.items.filter(it => ACCESSORY_KEYS.includes(it.key) && it.qty > 0 && it.price > 0);

  let bomHTML = mainItems.map(it =>
    `<tr><td>${it.ref || it.label}</td><td>${it.specs || ''}</td><td style="text-align:center">${it.qty}</td><td style="text-align:right">${formatPrice(it.price)}</td><td style="text-align:right;font-weight:600">${formatPrice(it.total)}</td></tr>`
  ).join('');
  if (accItems.length > 0) {
    bomHTML += accItems.map(it =>
      `<tr><td>${it.label}</td><td></td><td style="text-align:center">${it.qty}</td><td style="text-align:right">${formatPrice(it.price)}</td><td style="text-align:right">${formatPrice(it.total)}</td></tr>`
    ).join('');
  }
  const matTotal = c.items.reduce((s, it) => s + it.total, 0);

  const configInfo = `${r.totalPanels} panneaux (${r.panelsInSeries}S×${r.stringsInParallel}P) · ${r.totalBatteries} batteries (${r.batteriesInSeries}S×${r.batteriesInParallel}P) · ${input.vSystem}V`;

  const printContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BOM - ${projectName}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;max-width:750px;margin:0 auto;padding:20px;}
    h1{font-size:18px;color:#1565C0;margin:0 0 2px;}
    h2{font-size:13px;color:#1565C0;margin:16px 0 6px;border-bottom:2px solid #E3F2FD;padding-bottom:3px;}
    .meta{color:#666;font-size:11px;margin-bottom:12px;}
    .config{background:#E3F2FD;padding:8px 12px;border-radius:4px;font-size:11px;color:#1565C0;margin-bottom:12px;}
    table{width:100%;border-collapse:collapse;margin:6px 0;font-size:11px;}
    th{background:#1565C0;color:#fff;padding:5px 8px;text-align:left;font-size:10px;}
    td{padding:4px 8px;border-bottom:1px solid #e0e0e0;}
    .total-row td{border-top:2px solid #1565C0;font-weight:700;font-size:12px;color:#1565C0;}
    .note{font-size:10px;color:#666;margin-top:12px;font-style:italic;}
    @media print{body{padding:0;} @page{margin:12mm;}}
  </style></head><body>
  <h1>DIMMAP — Liste de materiel (BOM)</h1>
  <div class="meta">${projectName}${cityName ? ' | ' + cityName : ''} | ${isOffgrid ? 'Off-grid' : 'Hybride'} | ${new Date().toLocaleDateString('fr-FR')}</div>
  <div class="config">${configInfo}</div>

  <h2>Equipements</h2>
  <table><thead><tr><th>Designation</th><th>Specifications</th><th style="text-align:center">Qte</th><th style="text-align:right">Prix unit.</th><th style="text-align:right">Total</th></tr></thead><tbody>
  ${bomHTML}
  <tr class="total-row"><td colspan="4">TOTAL MATERIEL</td><td style="text-align:right">${formatPrice(matTotal)}</td></tr>
  </tbody></table>

  <div class="note">Prix en FCFA — Ce document est une liste de materiel a titre indicatif. Verifiez les disponibilites et prix aupres de votre fournisseur.</div>
  <div style="margin-top:20px;border-top:1px solid #e0e0e0;padding-top:6px;font-size:10px;color:#999;">
    Genere par DIMMAP — Dimensionnement Solaire PV | ${new Date().toLocaleDateString('fr-FR')}
  </div>
  </body></html>`;

  printPage(printContent);
}

function generatePrintHTML() {
  const r = state.results;
  const c = state.costs;
  const input = getInput();
  const isOffgrid = input.installationType === 'offgrid';
  const invLabel2 = input.inverterType === 'onduleur' ? 'Onduleur hybride' : input.inverterType === 'onduleur_sinus' ? 'Onduleur pur sinus' : 'Convertisseur';
  const projectName = document.getElementById('projectName').value || 'Projet sans nom';
  const cityName = state.city ? `${state.city.name}, ${state.country.name}` : 'Non precise';

  let itemsHTML = c.items.map(it =>
    `<tr><td>${it.label}</td><td>${it.qty}</td><td style="text-align:right">${formatPrice(it.price)}</td><td style="text-align:right;font-weight:600">${formatPrice(it.total)}</td></tr>`
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>DIMMAP - ${projectName}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;max-width:700px;margin:0 auto;padding:20px;}
    h1{font-size:20px;color:#1565C0;margin:0 0 4px;}
    h2{font-size:14px;color:#1565C0;margin:20px 0 8px;border-bottom:2px solid #E3F2FD;padding-bottom:4px;}
    .meta{color:#666;font-size:11px;margin-bottom:16px;}
    table{width:100%;border-collapse:collapse;margin:8px 0;font-size:11px;}
    th{background:#1565C0;color:#fff;padding:5px 8px;text-align:left;font-size:10px;}
    td{padding:4px 8px;border-bottom:1px solid #e0e0e0;}
    .total-row td{border-top:2px solid #1565C0;font-weight:700;font-size:13px;color:#1565C0;}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;}
    .grid div:nth-child(even){text-align:right;font-weight:600;}
    .warn{background:#FEF3C7;border:1px solid #F59E0B;padding:6px 10px;border-radius:4px;margin:4px 0;font-size:11px;color:#92400E;}
    .err{background:#FEE2E2;border:1px solid #FCA5A5;padding:6px 10px;border-radius:4px;margin:4px 0;font-size:11px;color:#991B1B;}
    @media print{body{padding:0;} @page{margin:15mm;}}
  </style></head><body>
  <h1>DIMMAP — Fiche de dimensionnement</h1>
  <div class="meta">${projectName} | ${cityName} | ${state.installationType === 'offgrid' ? 'Off-grid' : 'Hybride'} | ${new Date().toLocaleDateString('fr-FR')}</div>

  ${r.warnings.length > 0 ? r.warnings.map(w => `<div class="${w.severity === 'error' ? 'err' : 'warn'}">${w.code} — ${w.msg}</div>`).join('') : ''}

  <h2>Bilan energetique</h2>
  <table><thead><tr><th>Appareil</th><th>Puissance</th><th>Qte</th><th>Heures/j</th><th style="text-align:right">Energie</th></tr></thead><tbody>
  ${state.appliances.map(a => `<tr><td>${a.name}</td><td>${a.power} W</td><td>${a.qty}</td><td>${a.hours} h</td><td style="text-align:right">${formatNum(a.power*a.qty*a.hours)} Wh/j</td></tr>`).join('')}
  <tr class="total-row"><td colspan="4">TOTAL</td><td style="text-align:right">${formatNum(r.dailyEnergy)} Wh/j (${formatNum(r.dailyEnergyKwh,2)} kWh/j)</td></tr>
  </tbody></table>

  <h2>Panneaux solaires</h2>
  <div class="grid">
    <div>Puissance crete necessaire</div><div>${formatNum(r.requiredPc,0)} Wc</div>
    <div>Nombre de panneaux</div><div>${r.totalPanels} x ${input.panelPower} Wc</div>
    <div>Configuration</div><div>${r.panelsInSeries} serie x ${r.stringsInParallel} parallele</div>
    <div>Puissance installee</div><div>${formatNum(r.installedPc,0)} Wc</div>
  </div>

  <h2>Batteries</h2>
  <div class="grid">
    <div>Technologie</div><div>${input.batteryPreset.label}</div>
    <div>Capacite necessaire</div><div>${formatNum(r.requiredBatteryCap,0)} Ah</div>
    <div>Nombre total</div><div>${r.totalBatteries} (${r.batteriesInSeries}S x ${r.batteriesInParallel}P)</div>
    <div>Capacite installee</div><div>${formatNum(r.installedBatteryCap,0)} Ah</div>
    <div>Energie utile</div><div>${formatNum(r.usableEnergy,1)} kWh</div>
    <div>Autonomie reelle</div><div>${formatNum(r.realAutonomy,1)} jours</div>
  </div>

  <h2>${!isOffgrid ? 'Onduleur hybride' : (input.inverterType === 'onduleur_sinus' ? 'Regulateur & Onduleur' : 'Regulateur & Convertisseur')}</h2>
  <div class="grid">
    ${isOffgrid ? `<div>Regulateur ${input.regulatorType.toUpperCase()}</div><div>${formatNum(r.regulatorCurrent,1)} A min.</div>` : ''}
    <div>${invLabel2} continu</div><div>${formatNum(r.inverterContinuous,0)} W</div>
    <div>${invLabel2} pointe</div><div>${formatNum(r.inverterPeak,0)} W</div>
  </div>

  <h2>Production</h2>
  <div class="grid">
    <div>Production journaliere</div><div>${formatNum(r.dailyProduction,2)} kWh/j</div>
    <div>Ratio de couverture</div><div>${formatNum(r.coverageRatio,2)}x</div>
  </div>

  <h2>Budget estimatif (FCFA)</h2>
  <table><thead><tr><th>Poste</th><th>Qte</th><th style="text-align:right">Prix unit.</th><th style="text-align:right">Total</th></tr></thead><tbody>
  ${itemsHTML}
  <tr><td colspan="3" style="border-top:1px solid #1565C0;font-weight:600">Sous-total materiel</td><td style="text-align:right;border-top:1px solid #1565C0;font-weight:600">${formatPrice(c.subtotal)}</td></tr>
  <tr><td colspan="3">Main d'oeuvre (${Math.round(c.moPercent*100)}%)</td><td style="text-align:right">${formatPrice(c.mo)}</td></tr>
  <tr><td colspan="3">Transport (${Math.round(c.transportPercent*100)}%)</td><td style="text-align:right">${formatPrice(c.transport)}</td></tr>
  <tr><td colspan="3">Imprevus (${Math.round(c.contingencyPercent*100)}%)</td><td style="text-align:right">${formatPrice(c.contingency)}</td></tr>
  <tr class="total-row"><td colspan="3">COUT TOTAL</td><td style="text-align:right">${formatPrice(c.total)}</td></tr>
  </tbody></table>
  <h2>Projection sur ${c.systemLifeYears} ans</h2>
  <div class="grid">
    <div>Investissement initial</div><div>${formatPrice(c.total)}</div>
    <div>Remplacement batteries (${c.battReplacements}x tous les ${c.battLifeYears} ans)</div><div>${formatPrice(c.battReplacementCost)}</div>
    <div>Remplacement onduleur (${c.invReplacements}x tous les ${c.inverterLifeYears} ans)</div><div>${formatPrice(c.invReplacementCost)}</div>
    ${c.regReplacements > 0 ? `<div>Remplacement regulateur (${c.regReplacements}x tous les ${c.regulatorLifeYears} ans)</div><div>${formatPrice(c.regReplacementCost)}</div>` : ''}
    <div style="font-weight:700;color:#1565C0;">Cout total sur ${c.systemLifeYears} ans</div><div style="font-weight:700;color:#1565C0;">${formatPrice(c.lifetimeCost)}</div>
  </div>
  <div class="grid" style="margin-top:8px;">
    <div>Cout par Wc</div><div>${formatNum(c.costPerWc,0)} FCFA/Wc</div>
    <div>LCOE (${c.systemLifeYears} ans)</div><div>${formatNum(c.lcoe,0)} FCFA/kWh</div>
    <div>Retour sur investissement</div><div>${(() => { const ds = (r.dailyEnergy/1000)*95; return ds > 0 ? formatNum(c.total/(ds*365),1)+' ans' : '—'; })()}</div>
  </div>

  <div style="margin-top:30px;border-top:1px solid #e0e0e0;padding-top:8px;font-size:10px;color:#999;">
    Genere par DIMMAP — Dimensionnement Solaire PV | ${new Date().toLocaleDateString('fr-FR')}
  </div>
  </body></html>`;
}

// ═══ SAUVEGARDE LOCALE ═══
function saveState() {
  try {
    const toSave = {
      installationType: state.installationType,
      appliances: state.appliances,
      countryName: state.country?.name || null,
      cityName: state.city?.name || null,
      vSystem: state.vSystem,
      autonomyDays: state.autonomyDays,
      cutoffHours: state.cutoffHours,
      regulatorType: state.regulatorType,
      batteryType: state.batteryType,
      mode: state.mode,
      projectName: document.getElementById('projectName').value,
      panelPower: document.getElementById('panelPower').value,
      panelVmp: document.getElementById('panelVmp').value,
      batteryCapacity: document.getElementById('batteryCapacity').value,
      batteryVoltage: document.getElementById('batteryVoltage').value,
      inverterType: state.inverterType || 'onduleur',
    };
    localStorage.setItem('dimmap_project', JSON.stringify(toSave));
  } catch (e) {}
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('dimmap_project'));
    if (!saved || !saved.appliances) return false;

    state.installationType = saved.installationType || 'offgrid';
    selectInstallType(state.installationType);

    state.appliances = saved.appliances;
    renderAppliances();

    if (saved.countryName) {
      document.getElementById('selCountry').value = saved.countryName;
      onCountryChange();
      if (saved.cityName) {
        document.getElementById('selCity').value = saved.cityName;
        onCityChange();
      }
    }

    if (saved.vSystem) selectVoltage(saved.vSystem);
    if (saved.autonomyDays) {
      state.autonomyDays = saved.autonomyDays;
      document.getElementById('autonomySlider').value = saved.autonomyDays;
      updateAutonomyLabel();
    }
    if (saved.cutoffHours) {
      state.cutoffHours = saved.cutoffHours;
      document.getElementById('cutoffSlider').value = saved.cutoffHours;
      updateCutoffLabel();
    }
    if (saved.regulatorType) selectRegulator(saved.regulatorType);
    if (saved.batteryType) {
      document.getElementById('batteryType').value = saved.batteryType;
      onBatteryTypeChange();
    }
    if (saved.mode) setMode(saved.mode);
    if (saved.projectName) document.getElementById('projectName').value = saved.projectName;
    if (saved.panelPower) document.getElementById('panelPower').value = saved.panelPower;
    if (saved.panelVmp) document.getElementById('panelVmp').value = saved.panelVmp;
    if (saved.batteryCapacity) document.getElementById('batteryCapacity').value = saved.batteryCapacity;
    if (saved.batteryVoltage) document.getElementById('batteryVoltage').value = saved.batteryVoltage;
    if (saved.inverterType) selectInverterType(saved.inverterType);

    return true;
  } catch (e) {
    return false;
  }
}

function clearSavedProject() {
  localStorage.removeItem('dimmap_project');
}

// ═══ GESTION DE PROJET ═══
function resetProject() {
  state.appliances = [];
  state.results = null;
  state.costs = null;
  state.customPrices = {};
  state.city = null;
  state.maxStepReached = 0;
  state.installationType = 'offgrid';
  state.vSystem = 24;
  state.autonomyDays = 2;
  state.cutoffHours = 4;
  state.regulatorType = 'mppt';
  state.batteryType = 'lfp';

  document.getElementById('projectName').value = '';
  document.getElementById('selCity').value = '';
  document.getElementById('panelPower').value = '300';
  document.getElementById('panelVmp').value = '32.4';
  document.getElementById('batteryCapacity').value = '200';
  document.getElementById('batteryVoltage').value = '12';
  document.getElementById('autonomySlider').value = '2';
  document.getElementById('cutoffSlider').value = '4';
  document.getElementById('dispHSP').textContent = '—';
  document.getElementById('dispZone').textContent = '—';
  document.getElementById('dispZoneDetail').textContent = '';
  document.getElementById('inverterType').value = 'onduleur';
  document.getElementById('inverterModelPrice').value = '0';
  state.inverterType = 'onduleur';

  selectInstallType('offgrid');
  selectVoltage(24);
  selectRegulator('mppt');
  onBatteryTypeChange();
  renderAppliances();
  updateAutonomyLabel();
  updateCutoffLabel();
  updateSiteDisplay();

  document.getElementById('costTable').innerHTML = '';
  document.getElementById('costIndicators').innerHTML = '';
  document.getElementById('resultsSummary').innerHTML = '';
  document.getElementById('resultsPanels').innerHTML = '';
  document.getElementById('resultsBatteries').innerHTML = '';
  document.getElementById('resultsRegInv').innerHTML = '';
  document.getElementById('resultsProdBar').innerHTML = '';
  document.getElementById('warningsContainer').innerHTML = '';
  document.getElementById('panelRecos').innerHTML = '';
  document.getElementById('batteryRecos').innerHTML = '';
  document.getElementById('inverterReco').innerHTML = '';

  localStorage.removeItem('dimmap_project');
  goToStep(0);
}

function closeProject() {
  if (!state.results) return;
  if (!state.costs) {
    const input = getInput();
    state.costs = Engine.computeCosts(state.results, input, state.customPrices || {}, state.customQty);
  }
  saveState();
  const name = document.getElementById('projectName').value || 'Projet sans nom';
  const totalE = Engine.totalDailyEnergy(state.appliances);
  const project = {
    id: Date.now(),
    name: name,
    date: new Date().toLocaleDateString('fr-FR'),
    city: state.city?.name || '—',
    type: state.installationType,
    appliances: state.appliances.length,
    energy: Math.round(totalE),
    panels: state.results.totalPanels,
    panelWc: state.results.installedPc,
    batteries: state.results.totalBatteries,
    batteryType: state.batteryType,
    vSystem: state.vSystem,
    cost: state.costs.total,
    lcoe: state.costs.lcoe,
    battLifeYears: state.costs.battLifeYears,
    systemLifeYears: state.costs.systemLifeYears,
    lifetimeCost: state.costs.lifetimeCost,
    battReplacements: state.costs.battReplacements,
    invReplacements: state.costs.invReplacements,
    regReplacements: state.costs.regReplacements,
    costPerWc: state.costs.costPerWc,
    costData: {
      items: state.costs.items.map(it => ({ label: it.label, qty: it.qty, price: it.price, total: it.total })),
      subtotal: state.costs.subtotal,
      mo: state.costs.mo,
      moPercent: state.costs.moPercent,
      transport: state.costs.transport,
      transportPercent: state.costs.transportPercent,
      contingency: state.costs.contingency,
      contingencyPercent: state.costs.contingencyPercent,
    },
    appliancesList: state.appliances.map(a => ({ name: a.name, power: a.power, qty: a.qty, hours: a.hours })),
    resultsData: {
      dailyEnergyKwh: state.results.dailyEnergyKwh,
      dailyProduction: state.results.dailyProduction,
      requiredPc: state.results.requiredPc,
      installedPc: state.results.installedPc,
      panelsInSeries: state.results.panelsInSeries,
      stringsInParallel: state.results.stringsInParallel,
      requiredBatteryCap: state.results.requiredBatteryCap,
      installedBatteryCap: state.results.installedBatteryCap,
      batteriesInSeries: state.results.batteriesInSeries,
      batteriesInParallel: state.results.batteriesInParallel,
      usableEnergy: state.results.usableEnergy,
      realAutonomy: state.results.realAutonomy,
      regulatorCurrent: state.results.regulatorCurrent,
      inverterContinuous: state.results.inverterContinuous,
      inverterPeak: state.results.inverterPeak,
      coverageRatio: state.results.coverageRatio,
    },
    savedState: JSON.parse(localStorage.getItem('dimmap_project')),
  };
  const history = getProjectHistory();
  history.unshift(project);
  if (history.length > 30) history.pop();
  localStorage.setItem('dimmap_history', JSON.stringify(history));
  resetProject();
  renderProjectHistory();
}

// ═══ HISTORIQUE DES PROJETS ═══
function getProjectHistory() {
  try {
    return JSON.parse(localStorage.getItem('dimmap_history')) || [];
  } catch (e) { return []; }
}

function openHistory() {
  renderProjectHistory();
  document.getElementById('historyModal').classList.add('show');
}

function closeHistory() {
  document.getElementById('historyModal').classList.remove('show');
}

function viewHistoryProject(id) {
  const history = getProjectHistory();
  const p = history.find(h => h.id === id);
  if (!p) return;

  const battLabel = (p.batteryType && BATTERY_PRESETS[p.batteryType]?.label) || p.batteryType || '—';
  const typeLabel = p.type === 'offgrid' ? 'Off-grid' : 'Hybride';
  const r = p.resultsData;

  let html = `<div style="padding:4px 0;">`;
  html += `<div style="text-align:center;margin-bottom:16px;">
    <div style="font-size:18px;font-weight:800;color:var(--text);">${p.name}</div>
    <div style="font-size:12px;color:var(--text-sec);margin-top:2px;">${p.city} · ${typeLabel} · ${p.date}</div>
  </div>`;

  // Synthese
  html += `<div class="result-grid">
    <div class="result-card highlight">
      <div class="r-value">${r ? formatNum(r.dailyEnergyKwh, 2) : formatNum(p.energy/1000, 2)}</div>
      <div class="r-unit">kWh/j</div><div class="r-label">Consommation</div>
    </div>
    <div class="result-card highlight">
      <div class="r-value">${r ? formatNum(r.dailyProduction, 2) : '—'}</div>
      <div class="r-unit">kWh/j</div><div class="r-label">Production</div>
    </div>
    <div class="result-card">
      <div class="r-value">${p.panels}</div>
      <div class="r-unit">panneaux</div><div class="r-label">Panneaux</div>
    </div>
    <div class="result-card">
      <div class="r-value">${p.batteries}</div>
      <div class="r-unit">${battLabel}</div><div class="r-label">Batteries</div>
    </div>
  </div>`;

  // Resultats detailles
  if (r) {
    html += `<div class="section-title">Resultats</div>
    <div class="card" style="margin-bottom:12px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;">
        <div>Tension systeme</div><div class="text-right fw-700">${p.vSystem ? p.vSystem + 'V' : '—'}</div>
        <div>Puissance installee</div><div class="text-right fw-700 color-primary">${formatNum(r.installedPc, 0)} Wc</div>
        <div>Config. panneaux</div><div class="text-right">${r.panelsInSeries}S x ${r.stringsInParallel}P</div>
        <div>Capacite batteries</div><div class="text-right fw-700">${formatNum(r.installedBatteryCap, 0)} Ah</div>
        <div>Config. batteries</div><div class="text-right">${r.batteriesInSeries}S x ${r.batteriesInParallel}P</div>
        <div>Energie utile</div><div class="text-right fw-700 color-primary">${formatNum(r.usableEnergy, 1)} kWh</div>
        <div>Autonomie reelle</div><div class="text-right">${formatNum(r.realAutonomy, 1)} jours</div>
        <div>Regulateur</div><div class="text-right fw-700">${formatNum(r.regulatorCurrent, 1)} A</div>
        <div>Onduleur continu</div><div class="text-right">${formatNum(r.inverterContinuous, 0)} W</div>
        <div>Onduleur pointe</div><div class="text-right color-warn fw-700">${formatNum(r.inverterPeak, 0)} W</div>
        <div>Ratio couverture</div><div class="text-right fw-700">${formatNum(r.coverageRatio, 2)}x</div>
      </div>
    </div>`;
  }

  // Couts detailles
  const cd = p.costData;
  if (cd && cd.items) {
    html += `<div class="section-title">Couts detailles</div>
    <div class="card" style="margin-bottom:12px;overflow-x:auto;">
      <table class="cost-table"><thead><tr>
        <th>Poste</th><th>Qte</th><th>Prix unit.</th><th>Total</th>
      </tr></thead><tbody>`;
    cd.items.forEach(it => {
      html += `<tr><td>${it.label}</td><td>${it.qty}</td><td class="text-right">${formatPrice(it.price)}</td><td class="row-total">${formatPrice(it.total)}</td></tr>`;
    });
    html += `<tr class="subtotal-row"><td colspan="3">Sous-total materiel</td><td class="row-total">${formatPrice(cd.subtotal)}</td></tr>`;
    html += `<tr><td colspan="3">Main d'oeuvre (${Math.round(cd.moPercent*100)}%)</td><td class="row-total">${formatPrice(cd.mo)}</td></tr>`;
    html += `<tr><td colspan="3">Transport (${Math.round(cd.transportPercent*100)}%)</td><td class="row-total">${formatPrice(cd.transport)}</td></tr>`;
    html += `<tr><td colspan="3">Imprevus (${Math.round(cd.contingencyPercent*100)}%)</td><td class="row-total">${formatPrice(cd.contingency)}</td></tr>`;
    html += `<tr class="grand-total"><td colspan="3">COUT TOTAL</td><td class="row-total">${formatPrice(p.cost)}</td></tr>`;
    html += `</tbody></table></div>`;
  }

  // Indicateurs
  html += `<div class="result-grid">
    <div class="result-card">
      <div class="r-value">${formatPrice(p.cost)}</div>
      <div class="r-unit">FCFA</div><div class="r-label">Investissement initial</div>
    </div>
    <div class="result-card">
      <div class="r-value">${p.lifetimeCost ? formatPrice(p.lifetimeCost) : formatPrice(p.cost)}</div>
      <div class="r-unit">FCFA</div><div class="r-label">Cout sur ${p.systemLifeYears || 20} ans</div>
    </div>
    <div class="result-card highlight">
      <div class="r-value">${p.lcoe ? formatNum(p.lcoe, 0) : '—'}</div>
      <div class="r-unit">FCFA/kWh</div><div class="r-label">LCOE (${p.systemLifeYears || 20} ans)</div>
    </div>
    <div class="result-card">
      <div class="r-value">${(() => { const ds = (p.energy/1000)*95; return ds > 0 ? formatNum(p.cost/(ds*365),1) : '—'; })()}</div>
      <div class="r-unit">annees</div><div class="r-label">Retour invest.</div>
    </div>
  </div>`;

  // Bouton PDF
  html += `<button class="btn btn-primary mt-16" style="width:100%;" onclick="exportHistoryPDF(${p.id})">Telecharger le PDF</button>`;

  html += `</div>`;

  document.getElementById('historyDetailContent').innerHTML = html;
  document.getElementById('historyDetailModal').classList.add('show');
}

function closeHistoryDetail() {
  document.getElementById('historyDetailModal').classList.remove('show');
}

function exportHistoryPDF(id) {
  const history = getProjectHistory();
  const p = history.find(h => h.id === id);
  if (!p) return;

  const battLabel = (p.batteryType && BATTERY_PRESETS[p.batteryType]?.label) || p.batteryType || '—';
  const typeLabel = p.type === 'offgrid' ? 'Off-grid' : 'Hybride';
  const r = p.resultsData;
  const cd = p.costData;

  let appHTML = '';
  if (p.appliancesList) {
    appHTML = p.appliancesList.map(a =>
      `<tr><td>${a.name}</td><td>${a.power} W</td><td>${a.qty}</td><td>${a.hours} h</td><td style="text-align:right">${formatNum(a.power*a.qty*a.hours)} Wh/j</td></tr>`
    ).join('');
  }

  let costHTML = '';
  if (cd && cd.items) {
    costHTML = cd.items.map(it =>
      `<tr><td>${it.label}</td><td>${it.qty}</td><td style="text-align:right">${formatPrice(it.price)}</td><td style="text-align:right;font-weight:600">${formatPrice(it.total)}</td></tr>`
    ).join('');
  }

  const printContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>DIMMAP - ${p.name}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;max-width:700px;margin:0 auto;padding:20px;}
    h1{font-size:20px;color:#1565C0;margin:0 0 4px;}
    h2{font-size:14px;color:#1565C0;margin:20px 0 8px;border-bottom:2px solid #E3F2FD;padding-bottom:4px;}
    .meta{color:#666;font-size:11px;margin-bottom:16px;}
    table{width:100%;border-collapse:collapse;margin:8px 0;font-size:11px;}
    th{background:#1565C0;color:#fff;padding:5px 8px;text-align:left;font-size:10px;}
    td{padding:4px 8px;border-bottom:1px solid #e0e0e0;}
    .total-row td{border-top:2px solid #1565C0;font-weight:700;font-size:13px;color:#1565C0;}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;}
    .grid div:nth-child(even){text-align:right;font-weight:600;}
    @media print{body{padding:0;} @page{margin:15mm;}}
  </style></head><body>
  <h1>DIMMAP — Fiche de dimensionnement</h1>
  <div class="meta">${p.name} | ${p.city} | ${typeLabel} | ${p.date}</div>

  ${p.appliancesList ? `<h2>Bilan energetique</h2>
  <table><thead><tr><th>Appareil</th><th>Puissance</th><th>Qte</th><th>Heures/j</th><th style="text-align:right">Energie</th></tr></thead><tbody>
  ${appHTML}
  <tr class="total-row"><td colspan="4">TOTAL</td><td style="text-align:right">${formatNum(p.energy)} Wh/j</td></tr>
  </tbody></table>` : ''}

  ${r ? `<h2>Panneaux solaires</h2>
  <div class="grid">
    <div>Puissance installee</div><div>${formatNum(r.installedPc,0)} Wc</div>
    <div>Nombre de panneaux</div><div>${p.panels}</div>
    <div>Configuration</div><div>${r.panelsInSeries}S x ${r.stringsInParallel}P</div>
  </div>

  <h2>Batteries</h2>
  <div class="grid">
    <div>Technologie</div><div>${battLabel}</div>
    <div>Nombre total</div><div>${p.batteries} (${r.batteriesInSeries}S x ${r.batteriesInParallel}P)</div>
    <div>Capacite installee</div><div>${formatNum(r.installedBatteryCap,0)} Ah</div>
    <div>Energie utile</div><div>${formatNum(r.usableEnergy,1)} kWh</div>
    <div>Autonomie reelle</div><div>${formatNum(r.realAutonomy,1)} jours</div>
  </div>

  <h2>Regulateur & Onduleur</h2>
  <div class="grid">
    <div>Regulateur</div><div>${formatNum(r.regulatorCurrent,1)} A min.</div>
    <div>Onduleur continu</div><div>${formatNum(r.inverterContinuous,0)} W</div>
    <div>Onduleur pointe</div><div>${formatNum(r.inverterPeak,0)} W</div>
    <div>Ratio couverture</div><div>${formatNum(r.coverageRatio,2)}x</div>
  </div>` : ''}

  ${cd ? `<h2>Budget estimatif (FCFA)</h2>
  <table><thead><tr><th>Poste</th><th>Qte</th><th style="text-align:right">Prix unit.</th><th style="text-align:right">Total</th></tr></thead><tbody>
  ${costHTML}
  <tr><td colspan="3" style="border-top:1px solid #1565C0;font-weight:600">Sous-total materiel</td><td style="text-align:right;border-top:1px solid #1565C0;font-weight:600">${formatPrice(cd.subtotal)}</td></tr>
  <tr><td colspan="3">Main d'oeuvre (${Math.round(cd.moPercent*100)}%)</td><td style="text-align:right">${formatPrice(cd.mo)}</td></tr>
  <tr><td colspan="3">Transport (${Math.round(cd.transportPercent*100)}%)</td><td style="text-align:right">${formatPrice(cd.transport)}</td></tr>
  <tr><td colspan="3">Imprevus (${Math.round(cd.contingencyPercent*100)}%)</td><td style="text-align:right">${formatPrice(cd.contingency)}</td></tr>
  <tr class="total-row"><td colspan="3">COUT TOTAL</td><td style="text-align:right">${formatPrice(p.cost)}</td></tr>
  </tbody></table>
  <div class="grid" style="margin-top:8px;">
    <div>Cout par Wc</div><div>${p.costPerWc ? formatNum(p.costPerWc,0) : '—'} FCFA/Wc</div>
    <div>Cout sur ${p.systemLifeYears || 20} ans</div><div>${p.lifetimeCost ? formatPrice(p.lifetimeCost) : formatPrice(p.cost)}</div>
    <div>LCOE (${p.systemLifeYears || 20} ans)</div><div>${p.lcoe ? formatNum(p.lcoe,0) : '—'} FCFA/kWh</div>
    <div>Retour sur investissement</div><div>${(() => { const ds = (p.energy/1000)*95; return ds > 0 ? formatNum(p.cost/(ds*365),1)+' ans' : '—'; })()}</div>
  </div>` : ''}

  <div style="margin-top:30px;border-top:1px solid #e0e0e0;padding-top:8px;font-size:10px;color:#999;">
    Genere par DIMMAP — Dimensionnement Solaire PV | ${p.date}
  </div>
  </body></html>`;

  printPage(printContent);
}

function deleteFromHistory(id) {
  if (!confirm('Supprimer ce projet de l\'historique ? Cette action est irreversible.')) return;
  const history = getProjectHistory().filter(p => p.id !== id);
  localStorage.setItem('dimmap_history', JSON.stringify(history));
  renderProjectHistory();
}

function renderProjectHistory() {
  const container = document.getElementById('historyList');
  if (!container) return;
  const history = getProjectHistory();
  if (history.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--text-ter);padding:30px 0;">Aucun projet cloture</div>';
    return;
  }
  container.innerHTML = history.map(p => `<div class="history-item">
    <div class="history-info" onclick="viewHistoryProject(${p.id})">
      <div class="history-name">${p.name}</div>
      <div class="history-detail">${p.city} · ${p.type}${p.vSystem ? ' · ' + p.vSystem + 'V' : ''} · ${p.appliances} app.</div>
      <div class="history-detail">${formatNum(p.energy)} Wh/j · ${p.panels} pan. · ${p.batteries} batt.</div>
      <div class="history-meta">${p.date} · ${formatPrice(p.cost)} FCFA</div>
    </div>
    <button class="btn-hist-del" onclick="deleteFromHistory(${p.id})">X</button>
  </div>`).join('');

  const countEl = document.getElementById('historyCount');
  if (countEl) countEl.textContent = history.length;
}

// ═══ UTILS ═══
function formatNum(n, decimals) {
  if (n === undefined || n === null || isNaN(n)) return '—';
  if (decimals === undefined) {
    return n >= 10 ? Math.round(n).toLocaleString('fr-FR') : n.toFixed(1);
  }
  if (decimals === 0) return Math.round(n).toLocaleString('fr-FR');
  return n.toFixed(decimals).replace('.', ',');
}

function formatPrice(n) {
  if (n === undefined || n === null || isNaN(n)) return '—';
  return Math.round(n).toLocaleString('fr-FR');
}

// ═══ INIT ═══
function init() {
  populateCountries();
  renderAppliances();
  onBatteryTypeChange();
  updateNavButtons();
  selectInstallType(state.installationType);
  renderProjectHistory();
}

init();
