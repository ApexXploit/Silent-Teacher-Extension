const RECIPIENT_EMAILS = [
  "mgramino@simplon.co"
];

/**
 * Remplacez cette valeur par une longue phrase secrète personnelle, puis
 * saisissez exactement la même valeur dans les options de l'extension.
 */
const UPLOAD_SECRET = "ST_r7Gx4mQ9vK2pN8cL5wH3yF6tB1sD0zA7uE4jR9iM";

function doGet() {
  return jsonResponse_({
    ok: true,
    service: "Silent Teacher Capture Upload",
    configured: UPLOAD_SECRET !== "A_REMPLACER_PAR_UN_SECRET_LONG_ET_UNIQUE"
  });
}

function doPost(event) {
  try {
    if (!event || !event.postData || !event.postData.contents) {
      throw new Error("Requête vide");
    }

    const payload = JSON.parse(event.postData.contents);
    if (UPLOAD_SECRET === "A_REMPLACER_PAR_UN_SECRET_LONG_ET_UNIQUE") {
      throw new Error("Le secret du script n'a pas été configuré");
    }
    if (payload.secret !== UPLOAD_SECRET) {
      throw new Error("Autorisation refusée");
    }
    if (payload.type === "english-test") {
      return sendEnglishTestEmail_(payload);
    }
    if (!payload.filename || !payload.base64) {
      throw new Error("Nom de fichier ou image manquante");
    }

    const filename = safeFilename_(payload.filename);
    const bytes = Utilities.base64Decode(payload.base64);
    const blob = Utilities.newBlob(bytes, "image/png", filename);
    const candidate = payload.candidate || {};
    const report = payload.report || {};
    const identity = [candidate.firstName, candidate.lastName].filter(Boolean).join(" ") || "Candidat non renseigné";
    const completed = Boolean(report.completed);
    const statusLabel = completed ? "PARCOURS TERMINÉ" : "PARCOURS NON TERMINÉ";
    const statusText = completed ? "Parcours terminé" : "Parcours non terminé";
    const badgeBackground = completed ? "#e8f6ef" : "#fff1dd";
    const badgeColor = completed ? "#18744d" : "#9a5700";
    const resultText = Number(report.wrong || 0) + " faute(s) · " + Number(report.right || 0) + " bonne(s)";
    const accuracyText = Number(report.accuracy || 0) + " %";
    const subject = "Test technique Silent Teacher - " + identity + " - " + statusText;
    const body = [
      "Un test technique Silent Teacher vient de s'arrêter.",
      "",
      "Candidat : " + identity,
      "Début : " + formatDate_(report.startedAt),
      "Date de fin : " + (payload.finishedAt || "Non renseignée"),
      "Résultat : " + resultText,
      "Précision : " + accuracyText,
      "Parcours : " + statusText,
      "Fichier : " + filename,
      "",
      "La capture du bilan est jointe à cet e-mail."
    ].join("\n");
    const htmlBody = `
      <!doctype html>
      <html lang="fr">
        <body style="margin:0;padding:0;background:#f2f5f7;font-family:Arial,Helvetica,sans-serif;color:#17202a;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f5f7;padding:32px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 32px rgba(23,32,42,.12);">
                  <tr>
                    <td style="padding:25px 30px;background:#d14339;color:#ffffff;">
                      <div style="font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;opacity:.85;">Test technique</div>
                      <div style="margin-top:5px;font-size:27px;font-weight:800;">Silent Teacher</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:30px;">
                      <div style="display:inline-block;padding:7px 12px;background:${badgeBackground};color:${badgeColor};border-radius:999px;font-size:12px;font-weight:bold;">${escapeHtml_(statusLabel)}</div>
                      <h1 style="margin:18px 0 8px;font-size:25px;line-height:1.25;color:#17202a;">Le bilan de ${escapeHtml_(identity)} est disponible</h1>
                      <p style="margin:0 0 24px;color:#5b6670;font-size:15px;line-height:1.6;">La session Silent Teacher vient de s'arrêter. Les informations et la capture complète du bilan sont disponibles ci-dessous.</p>

                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;border-radius:12px;padding:8px 18px;">
                        <tr>
                          <td style="padding:12px 0;border-bottom:1px solid #dde3e7;color:#707b85;font-size:13px;">Candidat</td>
                          <td align="right" style="padding:12px 0;border-bottom:1px solid #dde3e7;color:#17202a;font-size:14px;font-weight:bold;">${escapeHtml_(identity)}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 0;border-bottom:1px solid #dde3e7;color:#707b85;font-size:13px;">Début du test</td>
                          <td align="right" style="padding:12px 0;border-bottom:1px solid #dde3e7;color:#17202a;font-size:14px;font-weight:bold;">${escapeHtml_(formatDate_(report.startedAt))}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 0;border-bottom:1px solid #dde3e7;color:#707b85;font-size:13px;">Fin du test</td>
                          <td align="right" style="padding:12px 0;border-bottom:1px solid #dde3e7;color:#17202a;font-size:14px;font-weight:bold;">${escapeHtml_(formatDate_(payload.finishedAt))}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 0;border-bottom:1px solid #dde3e7;color:#707b85;font-size:13px;">Résultat</td>
                          <td align="right" style="padding:12px 0;border-bottom:1px solid #dde3e7;color:#17202a;font-size:14px;font-weight:bold;">${escapeHtml_(resultText)}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 0;border-bottom:1px solid #dde3e7;color:#707b85;font-size:13px;">Précision</td>
                          <td align="right" style="padding:12px 0;border-bottom:1px solid #dde3e7;color:#17202a;font-size:14px;font-weight:bold;">${escapeHtml_(accuracyText)}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 0;border-bottom:1px solid #dde3e7;color:#707b85;font-size:13px;">Parcours</td>
                          <td align="right" style="padding:12px 0;border-bottom:1px solid #dde3e7;color:${badgeColor};font-size:14px;font-weight:bold;">${escapeHtml_(statusText)}</td>
                        </tr>
                        <tr>
                          <td style="padding:12px 0;color:#707b85;font-size:13px;">Capture jointe</td>
                          <td align="right" style="padding:12px 0;color:#17202a;font-size:13px;font-weight:bold;word-break:break-all;">${escapeHtml_(filename)}</td>
                        </tr>
                      </table>

                      <div style="margin-top:26px;">
                        <div style="margin-bottom:10px;color:#17202a;font-size:14px;font-weight:bold;">Capture du bilan</div>
                        <img src="cid:resultCapture" alt="Bilan Silent Teacher de ${escapeHtml_(identity)}" width="540" style="display:block;width:100%;max-width:540px;height:auto;border:1px solid #dfe4e8;border-radius:12px;" />
                      </div>

                      <p style="margin:24px 0 0;color:#86909a;font-size:12px;line-height:1.5;">Message envoyé automatiquement par l’extension de suivi Silent Teacher.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>`;

    MailApp.sendEmail({
      to: RECIPIENT_EMAILS.join(","),
      subject: subject,
      body: body,
      htmlBody: htmlBody,
      inlineImages: { resultCapture: blob },
      attachments: [blob],
      name: "Silent Teacher"
    });

    return jsonResponse_({
      ok: true,
      filename: filename,
      emailed: true,
      recipients: RECIPIENT_EMAILS
    });
  } catch (error) {
    return jsonResponse_({ ok: false, error: error.message });
  }
}

function sendEnglishTestEmail_(payload) {
  const candidate = payload.candidate || {};
  const score = payload.score || {};
  const open = payload.openAnswers || {};
  const identity = [candidate.firstName, candidate.lastName].filter(Boolean).join(" ") || "Candidat non renseigné";
  const scoreText = Number(score.correct || 0) + " / " + Number(score.total || 20);
  const statusText = payload.timedOut ? "Temps écoulé" : "Remis par le candidat";
  const rows = [
    ["Candidat", identity],
    ["Début", formatDate_(payload.startedAt)],
    ["Fin", formatDate_(payload.finishedAt)],
    ["Statut", statusText],
    ["Bonnes réponses", scoreText],
    ["Précision", Number(score.percentage || 0) + " %"],
    ["Réponses renseignées", Number(score.answered || 0) + " / 20"]
  ];
  const tableRows = rows.map(function(row, index) {
    const border = index === rows.length - 1 ? "" : "border-bottom:1px solid #dde3e7;";
    return '<tr><td style="padding:11px 0;color:#707b85;font-size:13px;' + border + '">' + escapeHtml_(row[0]) + '</td><td align="right" style="padding:11px 0;color:#17202a;font-size:14px;font-weight:bold;' + border + '">' + escapeHtml_(row[1]) + '</td></tr>';
  }).join("");
  const answerBlock = function(title, value) {
    return '<div style="margin-top:15px;padding:15px;background:#f4f6f8;border-radius:10px;"><div style="font-size:12px;font-weight:bold;color:#b7113b;">' + escapeHtml_(title) + '</div><div style="margin-top:7px;white-space:pre-wrap;color:#263746;font-size:14px;line-height:1.5;">' + escapeHtml_(value || "Non renseigné") + '</div></div>';
  };
  const htmlBody = '<!doctype html><html lang="fr"><body style="margin:0;background:#f2f5f7;font-family:Arial,sans-serif;color:#17202a;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;"><tr><td align="center"><table role="presentation" width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;background:#fff;border-radius:18px;overflow:hidden;"><tr><td style="padding:25px 30px;background:#0d3b4a;color:#fff;"><div style="font-size:12px;font-weight:bold;letter-spacing:2px;">TEST D\'ANGLAIS</div><div style="margin-top:6px;font-size:27px;font-weight:800;">English Skills Check</div></td></tr><tr><td style="padding:30px;"><div style="display:inline-block;padding:7px 12px;background:#fbe7ed;color:#b7113b;border-radius:999px;font-size:12px;font-weight:bold;">' + escapeHtml_(statusText.toUpperCase()) + '</div><h1 style="font-size:25px;">Bilan de ' + escapeHtml_(identity) + '</h1><p style="color:#5b6670;">Score automatique sur les 20 questions fermées. Les 10 points de réponses ouvertes restent à évaluer.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;border-radius:12px;padding:8px 18px;">' + tableRows + '</table><h2 style="margin-top:28px;font-size:18px;">Réponses ouvertes à évaluer (/ 10)</h2>' + answerBlock("18. Gameplay features programmed by Sam", open.q18) + answerBlock("19. Data persisted between scenes", open.q19) + answerBlock("20. Usefulness of documentation", open.q20) + answerBlock("Writing task " + (open.writingTask || "A"), open.writing) + answerBlock("Auto-évaluation", open.selfAssessment) + '<p style="margin-top:24px;color:#86909a;font-size:12px;">Message envoyé automatiquement par l\'extension Silent Teacher.</p></td></tr></table></td></tr></table></body></html>';
  const body = ["Test d'anglais - " + identity, "", "Bonnes réponses : " + scoreText, "Précision : " + Number(score.percentage || 0) + " %", "Statut : " + statusText, "", "Les réponses ouvertes sont disponibles dans la version HTML de cet e-mail."].join("\n");

  MailApp.sendEmail({
    to: RECIPIENT_EMAILS.join(","),
    subject: "Test d'anglais - " + identity + " - " + scoreText,
    body: body,
    htmlBody: htmlBody,
    name: "Silent Teacher"
  });
  return jsonResponse_({ ok: true, emailed: true, recipients: RECIPIENT_EMAILS, score: score });
}

function escapeHtml_(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate_(value) {
  if (!value) return "Non renseignée";
  try {
    return Utilities.formatDate(new Date(value), "Indian/Reunion", "dd/MM/yyyy à HH:mm:ss");
  } catch (error) {
    return String(value);
  }
}

function safeFilename_(value) {
  const cleaned = String(value).replace(/[\\/:*?"<>|]/g, "-").trim();
  if (!cleaned.toLowerCase().endsWith(".png")) return cleaned + ".png";
  return cleaned;
}

function jsonResponse_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
