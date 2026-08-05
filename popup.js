const enabled = document.querySelector("#enabled");
const gainInput = document.querySelector("#gain");
const valueOutput = document.querySelector("#value");
const warning = document.querySelector("#warning");
const status = document.querySelector("#status");
const tabName = document.querySelector("#tab-name");
const presetButtons = [...document.querySelectorAll("[data-gain]")];

let activeTabId;
let updateTimer;
let isReady = false;

function setBusy(busy) {
  document.body.classList.toggle("busy", busy);
}

function setStatus(message = "", isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function paintLevel(percent) {
  const safePercent = Math.min(600, Math.max(100, Number(percent) || 100));
  gainInput.value = String(safePercent);
  valueOutput.value = `${safePercent}%`;
  gainInput.style.setProperty("--fill", `${((safePercent - 100) / 500) * 100}%`);
  warning.hidden = safePercent <= 200;

  presetButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.gain) * 100 === safePercent);
  });
}

async function send(type, extra = {}) {
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
  setStatus();
  try {
    if (enabled.checked) {
      const response = await send("START_CAPTURE", { gain: Number(gainInput.value) / 100 });
      paintLevel(Math.round(response.gain * 100));
      setStatus("This tab's audio is being boosted.");
    } else {
      await send("STOP_CAPTURE");
      setStatus("Volume boost is off.");
    }
  } catch (error) {
    enabled.checked = !enabled.checked;
    setStatus(error.message, true);
  } finally {
    setBusy(false);
  }
}

function scheduleGainUpdate() {
  paintLevel(gainInput.value);
  chrome.storage.local.set({ lastGain: Number(gainInput.value) / 100 });
  clearTimeout(updateTimer);

  if (!enabled.checked) {
    setStatus("Turn on the switch to apply this level.");
    return;
  }

  updateTimer = setTimeout(async () => {
    try {
      await send("SET_GAIN", { gain: Number(gainInput.value) / 100 });
      setStatus("Volume level updated.");
    } catch (error) {
      setStatus(error.message, true);
    }
  }, 70);
}

enabled.addEventListener("change", toggleCapture);
gainInput.addEventListener("input", scheduleGainUpdate);

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    gainInput.value = String(Number(button.dataset.gain) * 100);
    scheduleGainUpdate();
  });
});

async function initialize() {
  setBusy(true);
  paintLevel(100);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active tab was found.");

    activeTabId = tab.id;
    tabName.textContent = tab.title || "Active tab";

    const [state, saved] = await Promise.all([
      send("GET_STATE"),
      chrome.storage.local.get({ lastGain: 1 }),
    ]);
    enabled.checked = state.active;
    paintLevel(Math.round((state.active ? state.gain : saved.lastGain) * 100));
    if (state.active) setStatus("This tab's audio is being boosted.");
    isReady = true;
  } catch (error) {
    setStatus(error.message, true);
    enabled.disabled = true;
    gainInput.disabled = true;
  } finally {
    setBusy(false);
  }
}

initialize();
