(() => {
  "use strict";

  const PANEL_ID = "st-fault-counter";
  const HISTORY_KEY = "log";
  const TIMER_KEY = "st_fault_counter_timer";
  const CANDIDATE_KEY = "st_fault_counter_candidate";
  const TIME_LIMIT_MS = 20 * 60 * 1000;
  const TIME_UP_ID = "st-time-up-overlay";

  function readTimer() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(TIMER_KEY) || "null");
      return saved && typeof saved.elapsedMs === "number"
        ? {
            elapsedMs: saved.elapsedMs,
            startedAt: saved.startedAt || null,
            startedOn: saved.startedOn || null,
            finishedOn: saved.finishedOn || null,
            finished: Boolean(saved.finished),
            alertDismissed: Boolean(saved.alertDismissed)
          }
        : { elapsedMs: 0, startedAt: null, startedOn: null, finishedOn: null, finished: false, alertDismissed: false };
    } catch (_error) {
      return { elapsedMs: 0, startedAt: null, startedOn: null, finishedOn: null, finished: false, alertDismissed: false };
    }
  }

  function saveTimer(timer) {
    window.localStorage.setItem(TIMER_KEY, JSON.stringify(timer));
  }

  function readCandidate() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(CANDIDATE_KEY) || "null");
      return saved && typeof saved === "object"
        ? { firstName: saved.firstName || "", lastName: saved.lastName || "" }
        : { firstName: "", lastName: "" };
    } catch (_error) {
      return { firstName: "", lastName: "" };
    }
  }

  function saveCandidate(candidate) {
    window.localStorage.setItem(CANDIDATE_KEY, JSON.stringify(candidate));
  }

  function formatDateTime(timestamp) {
    if (!timestamp) return "Non renseigné";
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "medium"
    }).format(new Date(timestamp));
  }

  function buildResultText() {
    const stats = computeStats(readHistory());
    const timer = readTimer();
    const candidate = readCandidate();
    const duration = formatDuration(Math.min(getElapsedMs(timer), TIME_LIMIT_MS));
    const identity = `${candidate.firstName} ${candidate.lastName}`.trim() || "Candidat non renseigné";
    const completion = stats.finished ? "parcours terminé" : "parcours non terminé";
    return `Silent Teacher — ${identity} — début ${formatDateTime(timer.startedOn)}, fin ${formatDateTime(timer.finishedOn)}, durée ${duration}, ${stats.wrong} faute${stats.wrong === 1 ? "" : "s"}, ${stats.right} bonne${stats.right === 1 ? "" : "s"} réponse${stats.right === 1 ? "" : "s"}, précision ${stats.accuracy} %, ${stats.timedOut} temps dépassé${stats.timedOut === 1 ? "" : "s"}, ${completion}.`;
  }

  function getElapsedMs(timer) {
    return timer.elapsedMs + (timer.startedAt ? Date.now() - timer.startedAt : 0);
  }

  function formatDuration(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const twoDigits = (value) => String(value).padStart(2, "0");
    return hours
      ? `${twoDigits(hours)}:${twoDigits(minutes)}:${twoDigits(seconds)}`
      : `${twoDigits(minutes)}:${twoDigits(seconds)}`;
  }

  function showTimeUpOverlay() {
    if (document.getElementById(TIME_UP_ID)) return;
    const overlay = document.createElement("div");
    overlay.id = TIME_UP_ID;
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "st-time-up-title");
    const stats = computeStats(readHistory());
    const timer = readTimer();
    const candidate = readCandidate();
    const identity = `${candidate.firstName} ${candidate.lastName}`.trim() || "Candidat";
    const displayStartedOn = timer.startedOn;
    const displayFinishedOn = timer.finishedOn;
    overlay.innerHTML = `
      <div class="st-time-up__dialog">
        <div class="st-time-up__icon">STOP</div>
        <h2 id="st-time-up-title">Les 20 minutes sont écoulées</h2>
        <p>Le test est terminé. Merci de ne plus répondre aux questions.</p>
        <dl class="st-time-up__result">
          <div><dt>Candidat</dt><dd>${escapeHtml(identity)}</dd></div>
          <div><dt>Début</dt><dd>${escapeHtml(formatDateTime(displayStartedOn))}</dd></div>
          <div><dt>Fin</dt><dd>${escapeHtml(formatDateTime(displayFinishedOn))}</dd></div>
          <div><dt>Résultat</dt><dd>${stats.wrong} faute${stats.wrong === 1 ? "" : "s"} · ${stats.right} bonne${stats.right === 1 ? "" : "s"}</dd></div>
          <div><dt>Précision</dt><dd>${stats.accuracy} %</dd></div>
          <div><dt>Parcours</dt><dd>${stats.finished ? "Terminé" : "Non terminé"}</dd></div>
        </dl>
        <div class="st-time-up__screenshot" role="status">Capture d’écran en cours…</div>
        <button class="st-time-up__copy" type="button">Copier le bilan</button>
        <button class="st-time-up__close" type="button">Fermer</button>
      </div>`;
    overlay.querySelector(".st-time-up__copy").addEventListener("click", async () => {
      await copyText(buildResultText(), overlay.querySelector(".st-time-up__copy"), "Bilan copié !");
    });
    overlay.querySelector(".st-time-up__close").addEventListener("click", () => {
      const timer = readTimer();
      timer.alertDismissed = true;
      saveTimer(timer);
      overlay.remove();
    });
    document.documentElement.appendChild(overlay);
    overlay.querySelector(".st-time-up__copy").focus();

    // Deux images successives laissent au navigateur le temps d'afficher
    // complètement la fenêtre de fin avant la capture de l'onglet visible.
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      captureTimeUpCard(overlay, candidate, displayFinishedOn || Date.now(), {
        startedAt: displayStartedOn,
        wrong: stats.wrong,
        right: stats.right,
        accuracy: stats.accuracy,
        completed: stats.finished
      });
    }));
  }

  async function cropCard(dataUrl, card) {
    const image = new Image();
    image.src = dataUrl;
    await image.decode();

    const rect = card.getBoundingClientRect();
    const scaleX = image.naturalWidth / window.innerWidth;
    const scaleY = image.naturalHeight / window.innerHeight;
    const sourceX = Math.max(0, Math.round(rect.left * scaleX));
    const sourceY = Math.max(0, Math.round(rect.top * scaleY));
    const sourceWidth = Math.min(image.naturalWidth - sourceX, Math.round(rect.width * scaleX));
    const sourceHeight = Math.min(image.naturalHeight - sourceY, Math.round(rect.height * scaleY));
    const canvas = document.createElement("canvas");
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    canvas.getContext("2d").drawImage(
      image,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, sourceWidth, sourceHeight
    );
    return canvas.toDataURL("image/png");
  }

  function captureTimeUpCard(overlay, candidate, finishedOn, report) {
    const status = overlay.querySelector(".st-time-up__screenshot");
    if (!chrome?.runtime?.sendMessage) {
      status.textContent = "Capture impossible : extension non disponible.";
      status.classList.add("is-error");
      return;
    }

    chrome.runtime.sendMessage({ type: "capture-visible-card" }, async (captureResponse) => {
      if (chrome.runtime.lastError || !captureResponse?.ok) {
        status.textContent = "Capture non enregistrée. Faites une capture manuelle.";
        status.classList.add("is-error");
        return;
      }

      try {
        const croppedDataUrl = await cropCard(captureResponse.dataUrl, overlay.querySelector(".st-time-up__dialog"));
        chrome.runtime.sendMessage(
          { type: "save-card-capture", dataUrl: croppedDataUrl, candidate, finishedOn, report },
          (response) => {
        if (chrome.runtime.lastError || !response?.ok) {
          status.textContent = "Capture non enregistrée. Faites une capture manuelle.";
          status.classList.add("is-error");
          return;
        }
        if (response.drive?.ok) {
          status.textContent = "Capture envoyée par e-mail à mgramino@simplon.co.";
          status.classList.add("is-success");
        } else {
          status.textContent = `Copie locale enregistrée. E-mail : ${response.drive?.error || "service non disponible"}.`;
          status.classList.add("is-error");
        }
          }
        );
      } catch (_error) {
        status.textContent = "Impossible de recadrer la carte.";
        status.classList.add("is-error");
      }
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
  }

  async function copyText(text, button, successLabel) {
    try {
      await navigator.clipboard.writeText(text);
      const previousLabel = button.textContent;
      button.textContent = successLabel;
      setTimeout(() => { button.textContent = previousLabel; }, 1600);
    } catch (_error) {
      window.prompt("Copiez le résultat :", text);
    }
  }

  function removeTimeUpOverlay() {
    document.getElementById(TIME_UP_ID)?.remove();
  }

  function readHistory() {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.history) ? parsed.history : [];
    } catch (_error) {
      return [];
    }
  }

  function computeStats(history) {
    const wrong = history.filter((item) => item?.eventName === "wrong_answer");
    const right = history.filter((item) => item?.eventName === "right_answer");
    const timedOut = history.filter((item) => item?.eventName === "too_late");
    const answered = wrong.length + right.length;

    return {
      wrong: wrong.length,
      right: right.length,
      timedOut: timedOut.length,
      answered,
      accuracy: answered ? Math.round((right.length / answered) * 100) : 100,
      finished: history.some((item) => item?.eventName === "game end"),
      lastWrong: wrong.at(-1) || null
    };
  }

  function createPanel() {
    const panel = document.createElement("aside");
    panel.id = PANEL_ID;
    panel.setAttribute("aria-live", "polite");
    panel.innerHTML = `
      <div class="st-counter__header">
        <span class="st-counter__title">Suivi du test</span>
        <button class="st-counter__toggle" type="button" aria-label="Réduire le compteur" title="Réduire">−</button>
      </div>
      <div class="st-counter__body">
        <section class="st-counter__candidate" aria-label="Identité du candidat">
          <label>Prénom<input data-field="firstName" type="text" autocomplete="given-name" placeholder="Prénom"></label>
          <label>Nom<input data-field="lastName" type="text" autocomplete="family-name" placeholder="Nom"></label>
          <span class="st-counter__candidate-error" role="alert"></span>
        </section>
        <div class="st-counter__main">
          <span class="st-counter__number" data-field="wrong">0</span>
          <span class="st-counter__label">faute</span>
        </div>
        <section class="st-counter__timer" aria-label="Chronomètre">
          <span class="st-counter__timer-label">Chrono</span>
          <strong class="st-counter__time" data-field="timer">00:00</strong>
          <div class="st-counter__timer-actions">
            <button class="st-counter__timer-toggle" type="button">Démarrer</button>
            <button class="st-counter__timer-pause" type="button">Pause</button>
            <button class="st-counter__timer-reset" type="button">Nouveau candidat</button>
          </div>
        </section>
        <dl class="st-counter__details">
          <div><dt>Bonnes réponses</dt><dd data-field="right">0</dd></div>
          <div><dt>Précision</dt><dd data-field="accuracy">100 %</dd></div>
          <div><dt>Temps dépassé</dt><dd data-field="timedOut">0</dd></div>
        </dl>
        <div class="st-counter__status" data-field="status">Test en cours</div>
        <button class="st-counter__copy" type="button">Copier le résultat</button>
        <button class="st-counter__english-test" type="button">Ouvrir le test d’anglais</button>
      </div>`;

    panel.querySelector(".st-counter__toggle").addEventListener("click", () => {
      const collapsed = panel.classList.toggle("st-counter--collapsed");
      const button = panel.querySelector(".st-counter__toggle");
      button.textContent = collapsed ? "+" : "−";
      button.setAttribute("aria-label", collapsed ? "Développer le compteur" : "Réduire le compteur");
      button.title = collapsed ? "Développer" : "Réduire";
    });

    panel.querySelector(".st-counter__copy").addEventListener("click", async () => {
      await copyText(buildResultText(), panel.querySelector(".st-counter__copy"), "Résultat copié !");
    });

    panel.querySelector(".st-counter__english-test").addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "open-english-test", candidate: readCandidate() });
    });

    const candidate = readCandidate();
    panel.querySelector('[data-field="firstName"]').value = candidate.firstName;
    panel.querySelector('[data-field="lastName"]').value = candidate.lastName;
    panel.querySelectorAll(".st-counter__candidate input").forEach((input) => {
      input.addEventListener("input", () => {
        saveCandidate({
          firstName: panel.querySelector('[data-field="firstName"]').value.trim(),
          lastName: panel.querySelector('[data-field="lastName"]').value.trim()
        });
        panel.querySelector(".st-counter__candidate-error").textContent = "";
      });
    });

    panel.querySelector(".st-counter__timer-toggle").addEventListener("click", () => {
      const timer = readTimer();
      if (timer.startedAt || timer.finished) return;
      const candidate = readCandidate();
      if (!candidate.firstName || !candidate.lastName) {
        panel.querySelector(".st-counter__candidate-error").textContent = "Prénom et nom obligatoires";
        panel.querySelector(!candidate.firstName ? '[data-field="firstName"]' : '[data-field="lastName"]').focus();
        return;
      }
      timer.startedAt = Date.now();
      if (!timer.startedOn) timer.startedOn = timer.startedAt;
      saveTimer(timer);
      updateTimer();
    });

    panel.querySelector(".st-counter__timer-pause").addEventListener("click", () => {
      const timer = readTimer();
      if (!timer.startedAt || timer.finished) return;
      timer.elapsedMs = getElapsedMs(timer);
      timer.startedAt = null;
      saveTimer(timer);
      updateTimer();
    });

    panel.querySelector(".st-counter__timer-reset").addEventListener("click", () => {
      const confirmed = window.confirm(
        "Démarrer avec un nouveau candidat ?\n\nLe nom, le chrono, les réponses et toute la progression Silent Teacher seront supprimés."
      );
      if (!confirmed) return;

      // Silent Teacher conserve sa progression et son historique dans le
      // stockage du site. Tout effacer évite qu'un nouvel apprenant reprenne
      // la session ou les résultats du précédent.
      window.localStorage.clear();
      window.sessionStorage.clear();
      removeTimeUpOverlay();
      window.location.reload();
    });

    document.documentElement.appendChild(panel);
    return panel;
  }

  function updateTimer() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    const timer = readTimer();
    const elapsedMs = getElapsedMs(timer);
    if (!timer.finished && elapsedMs >= TIME_LIMIT_MS) {
      timer.elapsedMs = TIME_LIMIT_MS;
      timer.startedAt = null;
      timer.finished = true;
      timer.finishedOn = Date.now();
      timer.alertDismissed = false;
      saveTimer(timer);
      showTimeUpOverlay();
    }
    panel.querySelector('[data-field="timer"]').textContent = formatDuration(Math.min(getElapsedMs(timer), TIME_LIMIT_MS));
    const toggle = panel.querySelector(".st-counter__timer-toggle");
    toggle.textContent = timer.finished ? "Terminé" : (timer.startedAt ? "En cours" : (timer.elapsedMs ? "Reprendre" : "Démarrer"));
    toggle.disabled = timer.finished || Boolean(timer.startedAt);
    toggle.classList.toggle("is-running", Boolean(timer.startedAt));
    const pauseButton = panel.querySelector(".st-counter__timer-pause");
    pauseButton.disabled = timer.finished || !timer.startedAt;
    panel.querySelectorAll(".st-counter__candidate input").forEach((input) => { input.disabled = Boolean(timer.startedOn); });
    panel.classList.toggle("st-counter--time-up", timer.finished);
    if (timer.finished && !timer.alertDismissed && !document.getElementById(TIME_UP_ID)) showTimeUpOverlay();
  }

  function update() {
    const panel = document.getElementById(PANEL_ID) || createPanel();
    const stats = computeStats(readHistory());
    panel.querySelector('[data-field="wrong"]').textContent = String(stats.wrong);
    panel.querySelector('[data-field="right"]').textContent = String(stats.right);
    panel.querySelector('[data-field="accuracy"]').textContent = `${stats.accuracy} %`;
    panel.querySelector('[data-field="timedOut"]').textContent = String(stats.timedOut);
    const timer = readTimer();
    panel.querySelector('[data-field="status"]').textContent = stats.finished
      ? "Parcours terminé"
      : (timer.finished ? "Parcours non terminé" : "Parcours en cours");
    panel.querySelector(".st-counter__label").textContent = stats.wrong === 1 ? "faute" : "fautes";
    panel.classList.toggle("st-counter--has-errors", stats.wrong > 0);
    panel.classList.toggle("st-counter--finished", stats.finished);
    updateTimer();
  }

  update();

  // Le jeu sauvegarde l'historique après chaque réponse. Un court polling est
  // plus fiable qu'un MutationObserver : l'événement storage ne se déclenche
  // pas dans l'onglet qui effectue lui-même la modification.
  let previousLog = window.localStorage.getItem(HISTORY_KEY);
  window.setInterval(() => {
    const currentLog = window.localStorage.getItem(HISTORY_KEY);
    if (currentLog !== previousLog) {
      previousLog = currentLog;
      update();
    }
  }, 350);

  window.setInterval(updateTimer, 250);

  window.addEventListener("storage", (event) => {
    if (event.key === HISTORY_KEY || event.key === null) update();
  });
})();
