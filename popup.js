const enabled = document.querySelector("#enabled");
const gainInput = document.querySelector("#gain");
const valueOutput = document.querySelector("#value");
const volumeTag = document.querySelector("#volume-tag");
const dbBadge = document.querySelector("#db-badge");
const warning = document.querySelector("#warning");
const status = document.querySelector("#status");
const statusDot = document.querySelector("#status-dot");
const tabName = document.querySelector("#tab-name");
const resetBtn = document.querySelector("#reset-btn");
const antiClippingToggle = document.querySelector("#anti-clipping");
const presetButtons = [...document.querySelectorAll(".preset-btn")];
const profileCards = [...document.querySelectorAll(".profile-card")];
const langButtons = [...document.querySelectorAll(".lang-btn")];

const TRANSLATIONS = {
  en: {
    brandTitle: "VOLUME BOOSTER",
    searchingTab: "Searching active tab...",
    masterSwitchTitle: "Turn volume boost on or off",
    volumeLevel: "VOLUME LEVEL",
    standardLevel: "Standard Level",
    balancedBoost: "Balanced Boost",
    highPower: "High Power",
    maxBoost: "Maximum Boost",
    profilesTitle: "SOUND PROFILES",
    profilesHint: "Speaker & Device Tuning",
    profSpeakerName: "Speaker",
    profSpeakerDesc: "Anti-Crackling & Clear",
    profHeadphoneName: "Headphones",
    profHeadphoneDesc: "Rich & Deep Bass",
    profVocalName: "Vocal & Dialogue",
    profVocalDesc: "Clear Speech",
    profBassName: "Bass & Punch",
    profBassDesc: "Full Low-End",
    antiTitle: "Smart Anti-Crackling",
    antiTagActive: "ACTIVE",
    antiTagOff: "OFF",
    antiDesc: "Filters speaker blowout & harsh distortion",
    antiSwitchTitle: "Turn anti-crackling protection on or off",
    warningText: "High volume can damage your speakers or hearing. Increase gradually.",
    statusReady: "Ready",
    statusBoosting: "Tab audio is being boosted",
    statusOff: "Volume boost is off",
    statusTurnOn: "Turn on the switch to apply",
    statusGainUpdated: "Volume level updated",
    statusProfileUpdated: "Sound profile updated",
    statusAntiOn: "Anti-crackling enabled",
    statusAntiOff: "Anti-crackling disabled",
    statusProcessing: "Processing...",
    statusError: "No active tab found.",
    resetBtn: "Reset",
    resetTitle: "Reset to standard 100%",
    previewTab: "YouTube - Live Music Stream",
    presetsLabel: "Quick Presets",
  },
  tr: {
    brandTitle: "SES ARTIRICI",
    searchingTab: "Aktif sekme aranıyor...",
    masterSwitchTitle: "Ses artırmayı aç veya kapat",
    volumeLevel: "SES SEVİYESİ",
    standardLevel: "Standart Seviye",
    balancedBoost: "Dengeli Güç",
    highPower: "Yüksek Kuvvet",
    maxBoost: "Maksimum Güç",
    profilesTitle: "SES PROFİLİ",
    profilesHint: "Hoparlör & Cihaz Optimizasyonu",
    profSpeakerName: "Hoparlör",
    profSpeakerDesc: "Anti-Cızırtı & Net",
    profHeadphoneName: "Kulaklık",
    profHeadphoneDesc: "Zengin & Derin Bas",
    profVocalName: "Dizi & Vokal",
    profVocalDesc: "Net Diyaloglar",
    profBassName: "Bas & Güç",
    profBassDesc: "Dolgun Vuruşlar",
    antiTitle: "Akıllı Cızırtı Önleyici",
    antiTagActive: "AKTİF",
    antiTagOff: "KAPALI",
    antiDesc: "Hoparlör patlamasını ve aşırı distorsiyonu filtreler",
    antiSwitchTitle: "Cızırtı korumasını aç veya kapat",
    warningText: "Yüksek ses seviyesi hoparlörleri veya işitmenizi zorlayabilir. Kademeli artırınız.",
    statusReady: "Hazır",
    statusBoosting: "Sekme sesi güçlendiriliyor",
    statusOff: "Güçlendirme kapalı",
    statusTurnOn: "Uygulamak için anahtarı açın",
    statusGainUpdated: "Ses seviyesi güncellendi",
    statusProfileUpdated: "Ses profili güncellendi",
    statusAntiOn: "Cızırtı önleyici açıldı",
    statusAntiOff: "Cızırtı önleyici kapatıldı",
    statusProcessing: "İşleniyor...",
    statusError: "Aktif sekme bulunamadı.",
    resetBtn: "Sıfırla",
    resetTitle: "Standart %100 seviyesine sıfırla",
    previewTab: "YouTube - Canlı Müzik Yayını",
    presetsLabel: "Hızlı Önayarlar",
  },
};

let activeTabId;
let updateTimer;
let isReady = false;
let currentProfile = "speaker";
let currentAntiClipping = true;
let currentLang = "en";
let lastStatusKey = "statusReady";
let lastCustomMessage = "";

function t(key) {
  return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS.en[key] || key;
}

function setLanguage(lang) {
  currentLang = (lang === "tr" || lang === "en") ? lang : "en";
  document.documentElement.lang = currentLang;

  // Update text nodes
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (t(key)) el.textContent = t(key);
  });

  // Update titles
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.dataset.i18nTitle;
    if (t(key)) el.setAttribute("title", t(key));
  });

  // Update aria-labels
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.dataset.i18nAria;
    if (t(key)) el.setAttribute("aria-label", t(key));
  });

  // Update language buttons active state
  langButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });

  // Refresh dynamic states in current language
  updateVolumeTag(Number(gainInput.value) || 100);
  updateAntiClippingTag();

  if (lastCustomMessage) {
    status.textContent = lastCustomMessage;
  } else {
    status.textContent = t(lastStatusKey);
  }

  if (window.chrome?.storage?.local) {
    chrome.storage.local.set({ lang: currentLang });
  }
}

function setBusy(busy) {
  document.body.classList.toggle("busy", busy);
}

function setStatusKey(key, isError = false) {
  lastStatusKey = key;
  lastCustomMessage = "";
  status.textContent = t(key);
  status.classList.toggle("error", isError);
  statusDot.classList.toggle("error", isError);
}

function setCustomStatus(message, isError = false) {
  lastCustomMessage = message;
  status.textContent = message;
  status.classList.toggle("error", isError);
  statusDot.classList.toggle("error", isError);
}

function calculateDb(gainFactor) {
  if (gainFactor <= 1) return "0.0 dB";
  const db = 20 * Math.log10(gainFactor);
  return `+${db.toFixed(1)} dB`;
}

function updateVolumeTag(percent) {
  volumeTag.classList.remove("warning-level", "danger-level");
  if (percent <= 100) {
    volumeTag.textContent = t("standardLevel");
  } else if (percent <= 200) {
    volumeTag.textContent = t("balancedBoost");
  } else if (percent <= 350) {
    volumeTag.textContent = t("highPower");
    volumeTag.classList.add("warning-level");
  } else {
    volumeTag.textContent = t("maxBoost");
    volumeTag.classList.add("danger-level");
  }
}

function updateAntiClippingTag() {
  const tag = document.querySelector(".anti-tag");
  if (!tag) return;
  tag.textContent = currentAntiClipping ? t("antiTagActive") : t("antiTagOff");
  tag.style.background = currentAntiClipping ? "rgba(0, 229, 163, 0.2)" : "rgba(120, 130, 140, 0.2)";
  tag.style.color = currentAntiClipping ? "var(--accent-green)" : "var(--text-muted)";
}

function paintLevel(percent) {
  const safePercent = Math.min(600, Math.max(100, Math.round(Number(percent) || 100)));
  const gainFactor = safePercent / 100;

  gainInput.value = String(safePercent);
  valueOutput.value = `${safePercent}%`;
  dbBadge.textContent = calculateDb(gainFactor);

  const fillPercent = ((safePercent - 100) / 500) * 100;
  gainInput.style.setProperty("--fill", `${fillPercent}%`);

  updateVolumeTag(safePercent);
  warning.hidden = safePercent <= 250;

  presetButtons.forEach((button) => {
    const btnGain = Math.round(Number(button.dataset.gain) * 100);
    button.classList.toggle("active", btnGain === safePercent);
  });
}

function setBoostingState(isBoosting) {
  document.body.classList.toggle("boosting", isBoosting);
  enabled.checked = isBoosting;
}

function selectProfile(profile) {
  currentProfile = profile;
  profileCards.forEach((card) => {
    const isCurrent = card.dataset.profile === profile;
    card.classList.toggle("active", isCurrent);
    card.setAttribute("aria-checked", isCurrent ? "true" : "false");
  });
  if (window.chrome?.storage?.local) {
    chrome.storage.local.set({ lastProfile: profile });
  }
}

function setAntiClippingState(active) {
  currentAntiClipping = active;
  antiClippingToggle.checked = active;
  updateAntiClippingTag();
  if (window.chrome?.storage?.local) {
    chrome.storage.local.set({ lastAntiClipping: active });
  }
}

async function send(type, extra = {}) {
  if (!window.chrome?.runtime?.sendMessage) {
    return { ok: true, active: enabled.checked, gain: Number(gainInput.value) / 100 };
  }

  const response = await chrome.runtime.sendMessage({
    target: "background",
    type,
    tabId: activeTabId,
    ...extra,
  });

  if (!response?.ok) throw new Error(response?.error || "The operation could not be completed.");
  return response;
}

async function toggleCapture() {
  if (!isReady) return;

  setBusy(true);
  setStatusKey("statusProcessing");
  try {
    if (enabled.checked) {
      const response = await send("START_CAPTURE", {
        gain: Number(gainInput.value) / 100,
        profile: currentProfile,
        antiClipping: currentAntiClipping,
      });
      paintLevel(Math.round(response.gain * 100));
      setBoostingState(true);
      setStatusKey("statusBoosting");
    } else {
      await send("STOP_CAPTURE");
      setBoostingState(false);
      setStatusKey("statusOff");
    }
  } catch (error) {
    enabled.checked = !enabled.checked;
    setBoostingState(enabled.checked);
    setCustomStatus(error.message, true);
  } finally {
    setBusy(false);
  }
}

function scheduleGainUpdate() {
  paintLevel(gainInput.value);
  const gainVal = Number(gainInput.value) / 100;
  if (window.chrome?.storage?.local) {
    chrome.storage.local.set({ lastGain: gainVal });
  }
  clearTimeout(updateTimer);

  if (!enabled.checked) {
    setStatusKey("statusTurnOn");
    return;
  }

  updateTimer = setTimeout(async () => {
    try {
      await send("SET_GAIN", { gain: gainVal });
      setStatusKey("statusGainUpdated");
    } catch (error) {
      setCustomStatus(error.message, true);
    }
  }, 60);
}

async function changeProfile(newProfile) {
  selectProfile(newProfile);
  if (!enabled.checked) return;

  try {
    await send("SET_PROFILE", { profile: newProfile });
    setStatusKey("statusProfileUpdated");
  } catch (error) {
    setCustomStatus(error.message, true);
  }
}

async function toggleAntiClipping() {
  const newState = antiClippingToggle.checked;
  setAntiClippingState(newState);
  if (!enabled.checked) return;

  try {
    await send("SET_ANTI_CLIPPING", { antiClipping: newState });
    setStatusKey(newState ? "statusAntiOn" : "statusAntiOff");
  } catch (error) {
    setCustomStatus(error.message, true);
  }
}

// EVENT LISTENERS
enabled.addEventListener("change", toggleCapture);
gainInput.addEventListener("input", scheduleGainUpdate);

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    gainInput.value = String(Math.round(Number(button.dataset.gain) * 100));
    scheduleGainUpdate();
  });
});

profileCards.forEach((card) => {
  card.addEventListener("click", () => {
    changeProfile(card.dataset.profile);
  });
});

langButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setLanguage(btn.dataset.lang);
  });
});

antiClippingToggle.addEventListener("change", toggleAntiClipping);

resetBtn.addEventListener("click", () => {
  gainInput.value = "100";
  scheduleGainUpdate();
});

// INITIALIZATION
async function initialize() {
  setBusy(true);

  // Read saved settings
  let saved = {
    lang: "en",
    lastGain: 1,
    lastProfile: "speaker",
    lastAntiClipping: true,
  };

  if (window.chrome?.storage?.local) {
    saved = await chrome.storage.local.get(saved);
  }

  setLanguage(saved.lang || "en");
  paintLevel(100);

  // If running standalone / preview in browser outside extension
  if (!window.chrome?.tabs?.query) {
    tabName.textContent = t("previewTab");
    paintLevel(200);
    setBoostingState(true);
    selectProfile("speaker");
    setAntiClippingState(true);
    setStatusKey("statusBoosting");
    isReady = true;
    setBusy(false);
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error(t("statusError"));

    activeTabId = tab.id;
    tabName.textContent = tab.title || t("searchingTab");

    const state = await send("GET_STATE");

    const activeGain = state.active ? state.gain : saved.lastGain;
    const activeProfile = state.active ? (state.profile || "speaker") : saved.lastProfile;
    const activeAntiClipping = state.active ? (state.antiClipping ?? true) : saved.lastAntiClipping;

    selectProfile(activeProfile);
    setAntiClippingState(activeAntiClipping);
    paintLevel(Math.round(activeGain * 100));
    setBoostingState(state.active);

    if (state.active) {
      setStatusKey("statusBoosting");
    } else {
      setStatusKey("statusReady");
    }

    isReady = true;
  } catch (error) {
    setCustomStatus(error.message, true);
    enabled.disabled = true;
    gainInput.disabled = true;
  } finally {
    setBusy(false);
  }
}

initialize();
