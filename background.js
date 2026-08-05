const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";

async function hasOffscreenDocument() {
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)],
    });
    return contexts.length > 0;
  }

  const clients = await self.clients.matchAll();
  return clients.some((client) => client.url === chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH));
}

let creatingOffscreenDocument;

async function ensureOffscreenDocument() {
  if (await hasOffscreenDocument()) return;

  if (!creatingOffscreenDocument) {
    creatingOffscreenDocument = chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: ["USER_MEDIA"],
      justification: "Play tab audio through Web Audio at the volume level selected by the user",
    }).finally(() => {
      creatingOffscreenDocument = null;
    });
  }

  await creatingOffscreenDocument;
}

async function getTabState(tabId) {
  await ensureOffscreenDocument();
  return chrome.runtime.sendMessage({
    target: "offscreen",
    type: "GET_STATE",
    tabId,
  });
}

async function startBoost(tabId, gain) {
  await ensureOffscreenDocument();

  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
  return chrome.runtime.sendMessage({
    target: "offscreen",
    type: "START_CAPTURE",
    tabId,
    streamId,
    gain,
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== "background") return false;

  const respond = async () => {
    switch (message.type) {
      case "GET_STATE":
        return getTabState(message.tabId);
      case "START_CAPTURE":
        return startBoost(message.tabId, message.gain);
      case "SET_GAIN":
      case "STOP_CAPTURE":
        await ensureOffscreenDocument();
        return chrome.runtime.sendMessage({ ...message, target: "offscreen" });
      default:
        throw new Error("Unknown operation.");
    }
  };

  respond()
    .then((result) => sendResponse(result))
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (!(await hasOffscreenDocument())) return;
  chrome.runtime.sendMessage({
    target: "offscreen",
    type: "STOP_CAPTURE",
    tabId,
  }).catch(() => {});
});
