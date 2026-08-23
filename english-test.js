"use strict";

const LIMIT_MS = 20 * 60 * 1000;
const ANSWERS = { q1:"F",q2:"E",q3:"G",q4:"C",q5:"B",q6:"A",q7:"D",q8:"A",q9:"B",q10:"C",q11:"C",q12:"B",q13:"A",q14:"B",q15:"A",q16:"B",q17:"C",q21:"A",q22:"C",q23:"B" };
let startedAt = null;
let finished = false;

const definitions = {A:"Commands from a keyboard, controller or touch screen.",B:"A version of the game that can be tested or delivered.",C:"The actions, rules and experience of playing.",D:"An unexpected problem in the game.",E:"A reusable resource such as an image, sound or animation.",F:"A 2D image used for a character or object.",G:"A component used to detect contact between objects."};
const terms = ["sprite","asset","collider","gameplay","build","player input","bug"];
const grammar = [
  [8,"The player ___ three coins before the exit opens.",["must collect","must collected","collecting","has collect"]],
  [9,"Yesterday, our team ___ the mobile version on two phones.",["tests","tested","has test","will testing"]],
  [10,"If the character touches the enemy, they ___ one life.",["lose","lost","will lose","would lost"]],
  [11,"This is the scene ___ contains the main menu.",["who","where","that","whose"]],
  [12,"The camera moves ___ than in the first prototype.",["smoothlier","more smoothly","most smoothly","smooth"]],
  [13,"You should ___ the collision bug before the demo.",["fix","fixed","to fixing","fixes"]],
  [14,"The new assets ___ into Unity this morning.",["imported","were imported","are importing yesterday","has imported"]]
];
const reading = [[15,"What type of game did the team create?",["A 2D mobile game","A virtual reality simulator","A desktop spreadsheet","A 3D racing game"]],[16,"Why was the game slow on the older phone?",["The screen was too small.","There were too many particle effects.","The player had no lives.","The team forgot the sound."]],[17,"Which change improved accessibility?",["A more expensive phone","A second main character","Larger text and stronger contrast","More particle effects"]]];
const standup = [[21,"What did you finish yesterday?"],[22,"What will you do today?"],[23,"We still have a crash on level 2."]];

function choices(question, options) {
  const letters = "ABCD";
  return `<div class="question"><b>${question[0]}. ${question[1]}</b><div class="choices">${options.map((text,i)=>`<label><input type="radio" name="q${question[0]}" value="${letters[i]}">${letters[i]}. ${text}</label>`).join("")}</div></div>`;
}

document.querySelector("#vocabulary").innerHTML = terms.map((term,i)=>`<div class="question"><b>${i+1}. ${term}</b><div class="choices">${Object.entries(definitions).map(([letter,text])=>`<label><input type="radio" name="q${i+1}" value="${letter}">${letter}. ${text}</label>`).join("")}</div></div>`).join("");
document.querySelector("#grammar").innerHTML = grammar.map(q=>choices(q,q[2])).join("");
document.querySelector("#readingQcm").innerHTML = reading.map(q=>choices(q,q[2])).join("");
document.querySelector("#standup").innerHTML = standup.map(q=>choices(q,["I fixed the collision bug.","Could you show me how to reproduce it?","I'll work on the touch controls next.","The build is in the shared folder."])).join("");

const params = new URLSearchParams(location.search);
document.querySelector("#firstName").value = params.get("firstName") || "";
document.querySelector("#lastName").value = params.get("lastName") || "";

document.querySelector("#start").addEventListener("click", () => {
  const firstName = document.querySelector("#firstName").value.trim();
  const lastName = document.querySelector("#lastName").value.trim();
  if (!firstName || !lastName) return alert("Le prénom et le nom sont obligatoires.");
  document.querySelectorAll("#intro input").forEach(input=>input.disabled=true);
  document.querySelector("#start").hidden = true;
  document.querySelector("#testForm").hidden = false;
  startedAt = Date.now();
  window.scrollTo({top:0,behavior:"smooth"});
});

function getPayload(timedOut=false) {
  const data = new FormData(document.querySelector("#testForm"));
  const objective = {};
  let correct = 0;
  for (const [name,expected] of Object.entries(ANSWERS)) {
    const value = data.get(name) || "";
    objective[name] = value;
    if (value === expected) correct++;
  }
  return {
    candidate:{firstName:document.querySelector("#firstName").value.trim(),lastName:document.querySelector("#lastName").value.trim()},
    startedAt:new Date(startedAt).toISOString(), finishedAt:new Date().toISOString(), timedOut,
    score:{correct,total:20,percentage:Math.round(correct/20*100),answered:Object.values(objective).filter(Boolean).length},
    objective,
    openAnswers:{q18:data.get("q18")||"",q19:data.get("q19")||"",q20:data.get("q20")||"",writingTask:data.get("writingTask")||"A",writing:data.get("writing")||"",selfAssessment:data.get("selfAssessment")||"Non renseigné"}
  };
}

async function submitTest(timedOut=false) {
  if (finished || !startedAt) return;
  if (!timedOut && !confirm("Terminer le test et envoyer le bilan ?")) return;
  finished = true;
  const button = document.querySelector('[type="submit"]');
  button.disabled = true; button.textContent = "Envoi en cours…";
  const payload = getPayload(timedOut);
  document.querySelector("#testForm").hidden = true;
  const result = document.querySelector("#result");
  result.hidden = false;
  result.classList.remove("is-error");
  result.innerHTML = `<h2>${timedOut?"Temps écoulé - ":""}Test d’anglais terminé</h2><strong>${payload.score.correct} / 20</strong><p>${payload.score.percentage} % de bonnes réponses sur la partie automatique.</p><p>Envoi du bilan en cours…</p>`;
  window.scrollTo({top:0,behavior:"instant"});
  chrome.runtime.sendMessage({type:"submit-english-test",payload}, response => {
    const ok = !chrome.runtime.lastError && response?.ok;
    result.classList.toggle("is-error",!ok);
    result.innerHTML = `<h2>${timedOut?"Temps écoulé - ":""}Test d’anglais terminé</h2><strong>${payload.score.correct} / 20</strong><p>${payload.score.percentage} % de bonnes réponses sur la partie automatique.</p><p>${ok?"Le bilan synthétique et les réponses ouvertes ont été envoyés par e-mail.":"L’envoi a échoué : "+(response?.error||"service indisponible")}</p>`;
    window.scrollTo({top:0,behavior:"smooth"});
  });
}

document.querySelector("#testForm").addEventListener("submit", event=>{event.preventDefault();submitTest(false);});
setInterval(()=>{
  if (!startedAt || finished) return;
  const remaining = Math.max(0,LIMIT_MS-(Date.now()-startedAt));
  const seconds = Math.ceil(remaining/1000);
  document.querySelector("#timer").textContent = `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
  if (!remaining) submitTest(true);
},250);
