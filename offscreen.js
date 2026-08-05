const sessions = new Map();

function serializeSession(tabId) {
  const session = sessions.get(tabId);
  return {
    ok: true,
    active: Boolean(session),
    gain: session?.gainNode.gain.value ?? 1,
  };
}

async function startCapture(tabId, streamId, gain) {
  if (sessions.has(tabId)) {
    setGain(tabId, gain);
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

  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const gainNode = audioContext.createGain();
  gainNode.gain.value = gain;
  source.connect(gainNode).connect(audioContext.destination);
  await audioContext.resume();

  sessions.set(tabId, { audioContext, gainNode, source, stream });

  stream.getAudioTracks()[0]?.addEventListener("ended", () => {
    stopCapture(tabId);
  }, { once: true });

  return serializeSession(tabId);
}

function setGain(tabId, gain) {
  const session = sessions.get(tabId);
  if (!session) return { ok: false, error: "Volume boost is not active for this tab." };

  const safeGain = Math.min(6, Math.max(0, Number(gain) || 1));
  session.gainNode.gain.setTargetAtTime(safeGain, session.audioContext.currentTime, 0.015);
  return { ok: true, active: true, gain: safeGain };
}

async function stopCapture(tabId) {
  const session = sessions.get(tabId);
  if (!session) return { ok: true, active: false, gain: 1 };

  sessions.delete(tabId);
  session.stream.getTracks().forEach((track) => track.stop());
  session.source.disconnect();
  session.gainNode.disconnect();
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
        return startCapture(message.tabId, message.streamId, message.gain);
      case "SET_GAIN":
        return setGain(message.tabId, message.gain);
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
