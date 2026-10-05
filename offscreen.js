const sessions = new Map();

let softClipCurve = null;
function getSoftClipCurve() {
  if (softClipCurve) return softClipCurve;
  const samples = 16384;
  softClipCurve = new Float32Array(samples);
  const k = 1.3;
  const norm = Math.tanh(k);
  for (let i = 0; i < samples; ++i) {
    const x = (i * 2) / (samples - 1) - 1; // range: [-1, 1]
    softClipCurve[i] = (Math.tanh(k * x) / norm) * 0.98;
  }
  return softClipCurve;
}

function serializeSession(tabId) {
  const session = sessions.get(tabId);
  return {
    ok: true,
    active: Boolean(session),
    gain: session?.gain ?? 1,
    profile: session?.profile ?? "speaker",
    antiClipping: session?.antiClipping ?? true,
  };
}

function updateAudioProcessing(session) {
  const {
    audioContext,
    highpassFilter,
    eqFilter,
    highShelfFilter,
    gainNode,
    compressorNode,
    clipperNode,
    masterGainNode,
    gain,
    profile,
    antiClipping,
  } = session;

  const now = audioContext.currentTime;
  const safeGain = Math.min(6, Math.max(0.5, Number(gain) || 1));
  gainNode.gain.setTargetAtTime(safeGain, now, 0.015);

  if (!antiClipping) {
    clipperNode.curve = null;
    highpassFilter.frequency.setTargetAtTime(10, now, 0.02);
    eqFilter.gain.setTargetAtTime(0, now, 0.02);
    highShelfFilter.gain.setTargetAtTime(0, now, 0.02);
    compressorNode.threshold.setTargetAtTime(0, now, 0.02);
    compressorNode.ratio.setTargetAtTime(1, now, 0.02);
    masterGainNode.gain.setTargetAtTime(1.0, now, 0.02);
    return;
  }

  clipperNode.curve = getSoftClipCurve();
  masterGainNode.gain.setTargetAtTime(0.96, now, 0.02);

  // Dynamic compressor limiter threshold & ratio based on gain level
  const factor = Math.min(1, Math.max(0, (safeGain - 1) / 5));
  const threshold = -4 - factor * 11; // -4 dB down to -15 dB
  const ratio = 3 + factor * 15;      // 3:1 up to 18:1

  compressorNode.threshold.setTargetAtTime(threshold, now, 0.02);
  compressorNode.ratio.setTargetAtTime(ratio, now, 0.02);
  compressorNode.knee.setTargetAtTime(18, now, 0.02);
  compressorNode.attack.setTargetAtTime(0.003, now, 0.02);

  switch (profile) {
    case "speaker": // Hoparlör (Anti-Cızırtı & Netlik)
      highpassFilter.frequency.setTargetAtTime(75, now, 0.02);
      highpassFilter.Q.setTargetAtTime(0.707, now, 0.02);
      eqFilter.type = "peaking";
      eqFilter.frequency.setTargetAtTime(2800, now, 0.02);
      eqFilter.Q.setTargetAtTime(1.0, now, 0.02);
      eqFilter.gain.setTargetAtTime(2.5, now, 0.02);
      highShelfFilter.frequency.setTargetAtTime(11000, now, 0.02);
      highShelfFilter.gain.setTargetAtTime(-2.0, now, 0.02);
      compressorNode.release.setTargetAtTime(0.18, now, 0.02);
      break;

    case "headphone": // Kulaklık (Geniş frekans & zengin bas)
      highpassFilter.frequency.setTargetAtTime(20, now, 0.02);
      highpassFilter.Q.setTargetAtTime(0.707, now, 0.02);
      eqFilter.type = "peaking";
      eqFilter.frequency.setTargetAtTime(1000, now, 0.02);
      eqFilter.gain.setTargetAtTime(0, now, 0.02);
      highShelfFilter.frequency.setTargetAtTime(12000, now, 0.02);
      highShelfFilter.gain.setTargetAtTime(0, now, 0.02);
      compressorNode.release.setTargetAtTime(0.15, now, 0.02);
      break;

    case "vocal": // Vokal & Konuşma (Dizi/Film/Toplantı)
      highpassFilter.frequency.setTargetAtTime(95, now, 0.02);
      highpassFilter.Q.setTargetAtTime(0.8, now, 0.02);
      eqFilter.type = "peaking";
      eqFilter.frequency.setTargetAtTime(2600, now, 0.02);
      eqFilter.Q.setTargetAtTime(1.2, now, 0.02);
      eqFilter.gain.setTargetAtTime(4.0, now, 0.02);
      highShelfFilter.frequency.setTargetAtTime(10000, now, 0.02);
      highShelfFilter.gain.setTargetAtTime(-1.0, now, 0.02);
      compressorNode.release.setTargetAtTime(0.12, now, 0.02);
      break;

    case "bass": // Bas Güçlendirme
      highpassFilter.frequency.setTargetAtTime(40, now, 0.02);
      highpassFilter.Q.setTargetAtTime(0.707, now, 0.02);
      eqFilter.type = "lowshelf";
      eqFilter.frequency.setTargetAtTime(120, now, 0.02);
      eqFilter.gain.setTargetAtTime(4.5, now, 0.02);
      highShelfFilter.frequency.setTargetAtTime(12000, now, 0.02);
      highShelfFilter.gain.setTargetAtTime(0, now, 0.02);
      compressorNode.release.setTargetAtTime(0.20, now, 0.02);
      break;

    default:
      highpassFilter.frequency.setTargetAtTime(75, now, 0.02);
      eqFilter.gain.setTargetAtTime(0, now, 0.02);
      highShelfFilter.gain.setTargetAtTime(0, now, 0.02);
      compressorNode.release.setTargetAtTime(0.18, now, 0.02);
      break;
  }
}

async function startCapture(tabId, streamId, gain = 1, profile = "speaker", antiClipping = true) {
  if (sessions.has(tabId)) {
    const session = sessions.get(tabId);
    session.gain = gain;
    session.profile = profile;
    session.antiClipping = antiClipping;
    updateAudioProcessing(session);
    return serializeSession(tabId);
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    },
    video: false,
  });

  const audioContext = new AudioContext({ latencyHint: "playback" });
  const source = audioContext.createMediaStreamSource(stream);

  const highpassFilter = audioContext.createBiquadFilter();
  highpassFilter.type = "highpass";

  const eqFilter = audioContext.createBiquadFilter();
  eqFilter.type = "peaking";

  const highShelfFilter = audioContext.createBiquadFilter();
  highShelfFilter.type = "highshelf";

  const gainNode = audioContext.createGain();

  const compressorNode = audioContext.createDynamicsCompressor();

  const clipperNode = audioContext.createWaveShaper();
  clipperNode.oversample = "4x";
  clipperNode.curve = getSoftClipCurve();

  const masterGainNode = audioContext.createGain();

  // Audio Graph Pipeline
  source.connect(highpassFilter);
  highpassFilter.connect(eqFilter);
  eqFilter.connect(highShelfFilter);
  highShelfFilter.connect(gainNode);
  gainNode.connect(compressorNode);
  compressorNode.connect(clipperNode);
  clipperNode.connect(masterGainNode);
  masterGainNode.connect(audioContext.destination);

  await audioContext.resume();

  const session = {
    audioContext,
    source,
    highpassFilter,
    eqFilter,
    highShelfFilter,
    gainNode,
    compressorNode,
    clipperNode,
    masterGainNode,
    stream,
    gain,
    profile,
    antiClipping,
  };

  sessions.set(tabId, session);
  updateAudioProcessing(session);

  stream.getAudioTracks()[0]?.addEventListener("ended", () => {
    stopCapture(tabId);
  }, { once: true });

  return serializeSession(tabId);
}

function setGain(tabId, gain) {
  const session = sessions.get(tabId);
  if (!session) return { ok: false, error: "Volume boost is not active for this tab." };

  session.gain = Math.min(6, Math.max(0.5, Number(gain) || 1));
  updateAudioProcessing(session);
  return serializeSession(tabId);
}

function setProfile(tabId, profile) {
  const session = sessions.get(tabId);
  if (!session) return { ok: false, error: "Volume boost is not active for this tab." };

  session.profile = profile || "speaker";
  updateAudioProcessing(session);
  return serializeSession(tabId);
}

function setAntiClipping(tabId, antiClipping) {
  const session = sessions.get(tabId);
  if (!session) return { ok: false, error: "Volume boost is not active for this tab." };

  session.antiClipping = Boolean(antiClipping);
  updateAudioProcessing(session);
  return serializeSession(tabId);
}

async function stopCapture(tabId) {
  const session = sessions.get(tabId);
  if (!session) return { ok: true, active: false, gain: 1 };

  sessions.delete(tabId);
  session.stream.getTracks().forEach((track) => track.stop());
  session.source.disconnect();
  session.highpassFilter.disconnect();
  session.eqFilter.disconnect();
  session.highShelfFilter.disconnect();
  session.gainNode.disconnect();
  session.compressorNode.disconnect();
  session.clipperNode.disconnect();
  session.masterGainNode.disconnect();
  await session.audioContext.close().catch(() => {});
  return { ok: true, active: false, gain: 1 };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== "offscreen") return false;

  const respond = async () => {
    switch (message.type) {
      case "GET_STATE":
        return serializeSession(message.tabId);
      case "START_CAPTURE":
        return startCapture(
          message.tabId,
          message.streamId,
          message.gain,
          message.profile,
          message.antiClipping
        );
      case "SET_GAIN":
        return setGain(message.tabId, message.gain);
      case "SET_PROFILE":
        return setProfile(message.tabId, message.profile);
      case "SET_ANTI_CLIPPING":
        return setAntiClipping(message.tabId, message.antiClipping);
      case "STOP_CAPTURE":
        return stopCapture(message.tabId);
      default:
        throw new Error("Unknown audio operation.");
    }
  };

  respond()
    .then((result) => sendResponse(result))
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});
