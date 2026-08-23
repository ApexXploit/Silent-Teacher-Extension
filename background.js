"use strict";

const DEFAULT_DRIVE_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw_KpbDbXNfriWtkf-z33XYE5EkXYk0kzlpGpoqmmWkfln1LuR_J5qHvE9Yayf8pIGT_Q/exec";
const DEFAULT_DRIVE_UPLOAD_SECRET = "ST_r7Gx4mQ9vK2pN8cL5wH3yF6tB1sD0zA7uE4jR9iM";

function safePart(value, fallback) {
  const cleaned = String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/\.+$/g, "");
  return cleaned || fallback;
}

function makeFilename(message) {
  const candidate = message.candidate || {};
  const timestamp = new Date(message.finishedOn || Date.now());
  const twoDigits = (value) => String(value).padStart(2, "0");
  const date = `${timestamp.getFullYear()}-${twoDigits(timestamp.getMonth() + 1)}-${twoDigits(timestamp.getDate())}`;
  const time = `${twoDigits(timestamp.getHours())}-${twoDigits(timestamp.getMinutes())}-${twoDigits(timestamp.getSeconds())}`;
  return [
    safePart(candidate.lastName, "NOM").toUpperCase(),
    safePart(candidate.firstName, "Prenom"),
    date,
    time
  ].join("_") + ".png";
}

async function sendCaptureByEmail(dataUrl, filename, candidate, finishedOn, report) {
  const base64 = dataUrl.split(",")[1];
  return postToRelay({
    filename,
    base64,
    candidate,
    finishedAt: new Date(finishedOn || Date.now()).toISOString(),
    report: report || {}
  });
}

async function postToRelay(payload) {
  const response = await fetch(DEFAULT_DRIVE_WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      secret: DEFAULT_DRIVE_UPLOAD_SECRET,
      ...payload
    })
  });
  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`Service e-mail indisponible (HTTP ${response.status})`);
  }

  let result;
  try {
    result = JSON.parse(responseText);
  } catch (_error) {
    throw new Error("Le service e-mail a renvoyé une page Google inattendue");
  }

  if (!result.ok) throw new Error(result.error || "Envoi de l'e-mail refusé");
  return { ok: true, configured: true, emailed: result.emailed, recipients: result.recipients };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "open-english-test") {
    const candidate = message.candidate || {};
    const params = new URLSearchParams({ firstName: candidate.firstName || "", lastName: candidate.lastName || "" });
    chrome.tabs.create({ url: chrome.runtime.getURL(`english-test.html?${params}`) });
    return false;
  }

  if (message?.type === "submit-english-test") {
    (async () => {
      try {
        let result;
        try {
          result = await postToRelay({ type: "english-test", ...message.payload });
        } catch (error) {
          const needsLegacyCapture = /nom de fichier|image manquante/i.test(error?.message || "");
          if (!needsLegacyCapture || !sender.tab?.windowId) throw error;

          const payload = message.payload || {};
          const score = payload.score || {};
          const dataUrl = await chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "png" });
          const filename = makeFilename({
            candidate: payload.candidate,
            finishedOn: payload.finishedAt
          });
          result = await sendCaptureByEmail(
            dataUrl,
            filename,
            payload.candidate,
            payload.finishedAt,
            {
              startedAt: payload.startedAt,
              right: Number(score.correct || 0),
              wrong: Math.max(0, Number(score.total || 20) - Number(score.correct || 0)),
              accuracy: Number(score.percentage || 0),
              completed: !payload.timedOut
            }
          );
          result.legacyFallback = true;
        }
        sendResponse({ ok: true, result });
      } catch (error) {
        sendResponse({ ok: false, error: error?.message || "Envoi du test d'anglais impossible" });
      }
    })();
    return true;
  }

  if (message?.type === "capture-visible-card") {
    (async () => {
      try {
        if (!sender.tab?.windowId) throw new Error("Onglet introuvable");
        const dataUrl = await chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "png" });
        sendResponse({ ok: true, dataUrl });
      } catch (error) {
        sendResponse({ ok: false, error: error?.message || "Capture impossible" });
      }
    })();
    return true;
  }

  if (message?.type === "save-card-capture") {
    (async () => {
      try {
        const filename = makeFilename(message);
        let driveResult;
        try {
          driveResult = await sendCaptureByEmail(message.dataUrl, filename, message.candidate, message.finishedOn, message.report);
        } catch (error) {
          driveResult = { ok: false, configured: true, error: error?.message || "Envoi e-mail impossible" };
        }
        let downloadId = null;
        if (!driveResult.ok) {
          downloadId = await chrome.downloads.download({
            url: message.dataUrl,
            filename: `Silent-Teacher/${filename}`,
            saveAs: false,
            conflictAction: "uniquify"
          });
        }
        sendResponse({ ok: true, filename, downloadId, drive: driveResult });
      } catch (error) {
        sendResponse({ ok: false, error: error?.message || "Enregistrement impossible" });
      }
    })();
    return true;
  }

  return false;
});
