/* =====================================================================
   A+ Core2 Under the Hood labs — the page.

   Pick a lab, pick a job, pick how long you have, and work through the
   stages. Progress is kept in this browser so a closed tab comes back to
   the stage it was on; the machine inside a stage starts fresh when you
   come back to it, and the page says so.
   ===================================================================== */
import * as READING from "./reading.js";
import * as THEME from "./theme.js";
import * as INSTRUCTOR from "./instructor.js";
import { LABS, LENGTHS, PLANNED, stagesFor, optionalFor, lengthsFor, topicById } from "./labs.js";
import { JOBS, jobByKey, buildStage, machineFor } from "./lab-tools.js";
import { createRunner } from "./runner.js";

const KEY = "c2uth.job.v1";
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } }
function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private window: fine */ } }
function clear() { try { localStorage.removeItem(KEY); } catch (e) {} }

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(label, cls, fn) { const b = el("button", cls || "btn", label); b.type = "button"; b.addEventListener("click", fn); return b; }

READING.mountToggle(document.getElementById("reading"));
THEME.mountToggle(document.getElementById("theme"));
INSTRUCTOR.mountToggle(document.getElementById("instructor"));

const lab = LABS[0];
const planHost = document.getElementById("plan");
const pickHost = document.getElementById("pick");
const sheetHost = document.getElementById("insSheet");
let state = load();
let runner = null;
let choice = { job: (state && state.job) || JOBS[0].key, length: (state && state.length) || "layered" };

function stageList(st) {
  const base = stagesFor(lab, st.length).map(function (s) { return s.key; });
  return base.concat((st.extra || []).filter(function (k) { return base.indexOf(k) < 0; }));
}

/* ------------------------------------------------------ the picker */
function drawPick() {
  pickHost.innerHTML = "";
  const card = el("section", "panel labcard");
  card.setAttribute("aria-labelledby", "lab-h");
  const h = el("h3", null, lab.name); h.id = "lab-h";
  card.appendChild(h);
  card.appendChild(el("p", null, lab.blurb));
  card.appendChild(el("p", "note", "Seven more labs are planned, one for each part of the objectives this one does not cover:"));
  const ul = el("ul", "coming");
  PLANNED.forEach(function (p) { ul.appendChild(el("li", null, p.name + " — " + p.topics.map(function (t) { return topicById(t).title; }).join(", "))); });
  card.appendChild(ul);
  pickHost.appendChild(card);

  if (state && state.at != null) {
    const r = el("div", "panel resume");
    r.setAttribute("role", "region");
    r.setAttribute("aria-label", "Job in progress");
    const j = jobByKey(state.job);
    const keys = stageList(state);
    r.appendChild(el("h3", null, "You have a job in progress"));
    r.appendChild(el("p", null, (j ? j.name : state.job) + " — stage " + Math.min(keys.length, state.at + 1) + " of " + keys.length + ". Stages you finished stay finished; the stage you were on starts again from the beginning, with your hints where they were."));
    r.appendChild(btn("Carry on", "btn primary", function () { go(state.at); }));
    r.appendChild(document.createTextNode(" "));
    r.appendChild(btn("Put it down and start a different job", "btn secondary", function () { clear(); state = null; drawPick(); }));
    pickHost.appendChild(r);
  }

  const fs = el("fieldset", "jobs");
  fs.appendChild(el("legend", null, "Choose the job"));
  JOBS.forEach(function (j) {
    const lb = el("label", "job");
    const r = el("input"); r.type = "radio"; r.name = "job"; r.value = j.key; r.checked = choice.job === j.key;
    r.addEventListener("change", function () { choice.job = j.key; });
    const t = el("span");
    t.appendChild(el("strong", null, j.name));
    t.appendChild(el("span", null, j.who + ", " + j.role));
    lb.appendChild(r); lb.appendChild(t);
    fs.appendChild(lb);
  });
  pickHost.appendChild(fs);

  const pk = el("div", "picker");
  const d1 = el("div");
  const lab_ = el("label", null, "How long have you got?"); lab_.setAttribute("for", "length");
  const sel = el("select"); sel.id = "length";
  lengthsFor(lab).forEach(function (k) { const o = el("option", null, LENGTHS[k].label); o.value = k; sel.appendChild(o); });
  sel.value = lengthsFor(lab).indexOf(choice.length) >= 0 ? choice.length : "layered";
  d1.appendChild(lab_); d1.appendChild(sel);
  const note = el("p", "note");
  const list = el("ol", "plan-list");
  function upd() {
    choice.length = sel.value;
    note.textContent = LENGTHS[sel.value].note;
    list.innerHTML = "";
    stagesFor(lab, sel.value).forEach(function (s) { const li = el("li", null, s.title); li.appendChild(el("span", "tier", s.tier)); list.appendChild(li); });
  }
  sel.addEventListener("change", upd);
  pk.appendChild(d1);
  pk.appendChild(btn("Start this job", "btn primary", function () {
    state = { job: choice.job, length: choice.length, at: 0, done: {}, attempts: {}, extra: [] };
    save(state); go(0);
  }));
  pickHost.appendChild(pk);
  pickHost.appendChild(note);
  const ph = el("p", null, "The stages:");
  pickHost.appendChild(ph);
  pickHost.appendChild(list);
  const later = lab.stages.filter(function (s) { return !s.built; });
  if (later.length) {
    pickHost.appendChild(el("p", "note", "Being built for this lab, and added to the longer lengths as each one is finished:"));
    const ul2 = el("ul", "plan-list");
    later.forEach(function (s) { const li = el("li", null, s.title); li.appendChild(el("span", "tier", s.tier)); ul2.appendChild(li); });
    pickHost.appendChild(ul2);
  }
  upd();
  pickHost.hidden = false;
  planHost.innerHTML = "";
  drawSheet();
}

/* ------------------------------------------------------ a stage */
function go(i) {
  if (runner) { runner.dispose(); runner = null; }
  const keys = stageList(state);
  if (i >= keys.length) return finished();
  state.at = i; save(state);
  pickHost.hidden = true;
  const key = keys[i];
  const meta = lab.stages.filter(function (s) { return s.key === key; })[0];
  const job = jobByKey(state.job);
  const stage = buildStage(key, job);
  planHost.innerHTML = "";
  const bar = el("div", "stage-bar");
  bar.appendChild(btn("‹ Back to the jobs", "btn secondary", function () { if (runner) { runner.dispose(); runner = null; } drawPick(); window.scrollTo(0, 0); }));
  bar.appendChild(el("span", "note", " " + job.name + " — " + LENGTHS[state.length].label));
  planHost.appendChild(bar);
  const host = el("div");
  planHost.appendChild(host);
  runner = createRunner(host, {
    stage: stage, meta: meta, job: job, index: i, total: keys.length,
    machine: function () { return machineFor(job, key); },
    resume: { attempts: state.attempts || {} },
    onProgress: function (p) { state.attempts = Object.assign(state.attempts || {}, p.attempts || {}); save(state); },
    onStageDone: function () { state.done = state.done || {}; state.done[key] = true; save(state); },
    onGo: function (n) { go(n); window.scrollTo(0, 0); }
  });
  drawSheet();
}

function finished() {
  pickHost.hidden = true;
  planHost.innerHTML = "";
  const job = jobByKey(state.job);
  const box = el("section", "panel jobdone");
  box.appendChild(el("h2", null, "Job finished: " + job.name));
  box.appendChild(el("p", null, "Every stage of this job is done on the machine. " + job.who.split(" ")[0] + "’s PC is fixed, and you know why each fix worked."));
  const more = optionalFor(lab, state.length).filter(function (s) { return (state.extra || []).indexOf(s.key) < 0; });
  if (LENGTHS[state.length].offersRest) {
    if (more.length) {
      box.appendChild(el("p", null, "Want to go deeper? These stages go with this job:"));
      more.forEach(function (s) { box.appendChild(btn(s.title, "btn", function () { state.extra = (state.extra || []).concat([s.key]); save(state); go(stageList(state).indexOf(s.key)); })); });
    } else box.appendChild(el("p", "note", "The deeper stages for this lab are being built. When they are finished they will be offered here."));
  }
  box.appendChild(btn("Choose another job", "btn primary", function () { clear(); state = null; drawPick(); window.scrollTo(0, 0); }));
  planHost.appendChild(box);
}

/* ------------------------------------------------ instructor sheet */
function drawSheet() {
  sheetHost.innerHTML = "";
  if (!INSTRUCTOR.isOn()) return;
  const box = el("section", "panel ins-sheet");
  box.appendChild(el("h2", null, "Job sheet — instructor mode"));
  box.appendChild(el("p", "note", "Every job and every stage's declared answer. The same job gives the same questions on every machine, so a class can be set one by name."));
  const ol = el("ol", "ins-jobs");
  JOBS.forEach(function (j) {
    const li = el("li");
    li.appendChild(el("p", "ins-job-name", j.name + " — " + j.who));
    const ul = el("ul");
    stagesFor(lab, "project").forEach(function (s) {
      const st = buildStage(s.key, j);
      if (!st) return;
      st.steps.forEach(function (x) { ul.appendChild(el("li", null, s.key + ": " + (x.answer_text || x.answer))); });
    });
    li.appendChild(ul);
    ol.appendChild(li);
  });
  box.appendChild(ol);
  sheetHost.appendChild(box);
}
INSTRUCTOR.onChange(function () { drawSheet(); if (runner && state) go(state.at); });

/* A seam for verify/: which job and stage is open. Nothing in the page reads it. */
window.__C2UTH = { state: function () { return state; }, runner: function () { return runner; } };

if (state && state.at != null && location.hash === "#resume") go(state.at); else drawPick();
