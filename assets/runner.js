/* =====================================================================
   The stage runner.

   A stage (from lab-tools.js) is a list of STEPS, each unlocked when the
   one before it is done:

     choice   six options, one right, five near misses. A wrong pick goes
              red and STAYS red, marked three ways (colour, an inset rule,
              and the words), with the clue that rules it out.
     number   a typed figure, graded to a tolerance.
     task     something DONE on the machine — typed at a prompt, clicked
              in Task Manager or Disk Management, or done with the hands
              on the 3D desk. Graded by the machine's state, never by
              which buttons were pressed.

   THE HINT LADDER is the program's standing rule, from hints.js: nothing
   for guesses 1-2; rung 1 on guess 3; rung 2 on guess 4; rung 3 on guess
   5 and every guess after, forever. Rung 3 strikes four of six with a
   reason each and leaves two alive. No rung ever gives the answer.

   WHAT COUNTS AS A GUESS on a task is the step's own `judge`, following
   the SETTLED rule: looking never counts, help never counts, a typo
   never counts; a change that does not move the job on does, and so does
   anything that makes it worse.

   RESET goes back to the last point the student got right — the machine
   as it was when the last step was finished — and the hints carry on
   from where they were. A wrong answer never carries forward and poisons
   the steps after it.
   ===================================================================== */
import { rungFor } from "./hints.js";
import { shownSix } from "./order.js";
import * as M from "./machine.js";
import { createDesktop } from "./desktop.js";
import { mountBench } from "./bench.js";
import { deskSpec, deskControls, deskAction } from "./bench-desk.js";
import * as INSTRUCTOR from "./instructor.js";
import { topicById, GAPS } from "./labs.js";

const ALL_HW = ["power-on", "force-off", "mains-out", "mains-in", "net-unplug", "net-plug", "panel-off", "panel-on", "drive-in", "drive-out", "data-in", "data-out", "power-in", "power-out"];

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function btn(label, cls, fn) {
  const b = el("button", cls || "btn", label);
  b.type = "button";
  b.addEventListener("click", fn);
  return b;
}

export function createRunner(host, o) {
  const S = o.stage;          /* the built stage descriptor */
  const meta = o.meta;        /* the registry entry: title, tier, topics, gaps */
  const job = o.job;
  let m = o.machine();
  let ctx = freshCtx();
  const attempts = Object.assign({}, (o.resume && o.resume.attempts) || {});
  const done = {};            /* step key -> true */
  const picked = {};          /* choice step key -> { optKey: true } */
  const numTried = {};        /* number step key -> [values] */
  let snap = snapshot();
  let lastSys = M.clone(m.sys);
  let desktop = null, bench = null;
  let flash = {};             /* step key -> feedback text */

  function freshCtx() { return { blamed: null, elevatedSeen: false, ruled: {}, get events() { return m.events; } }; }
  function snapshot() { return { m: M.clone(m), blamed: ctx.blamed, elevatedSeen: ctx.elevatedSeen }; }

  function current() {
    for (let i = 0; i < S.steps.length; i++) if (!done[S.steps[i].key]) return S.steps[i];
    return null;
  }
  function wrong(key) { attempts[key] = (attempts[key] || 0) + 1; o.onProgress && o.onProgress({ attempts: attempts }); }
  function rung(key) { return rungFor(attempts[key] || 0); }

  /* ------------------------------------------------------ layout */
  host.innerHTML = "";
  const sec = el("section", "stage");
  sec.setAttribute("aria-labelledby", "stage-h");
  const head = el("header", "stage-head");
  head.appendChild(el("p", "stage-count", "Stage " + (o.index + 1) + " of " + o.total + " \u00b7 " + meta.tier));
  const h2 = el("h2", null, meta.title); h2.id = "stage-h";
  head.appendChild(h2);
  const chips = el("ul", "chips");
  chips.setAttribute("aria-label", "What this stage covers");
  meta.topics.forEach(function (t) { const tp = topicById(t); chips.appendChild(el("li", "chip topic", tp.domain + ": " + tp.title)); });
  meta.gaps.forEach(function (g) { chips.appendChild(el("li", "chip gap gap-" + g, GAPS[g])); });
  head.appendChild(chips);
  sec.appendChild(head);

  /* the brief */
  const brief = el("div", "panel brief");
  brief.appendChild(el("h3", null, S.brief.from));
  S.brief.paragraphs.forEach(function (p) { if (p) brief.appendChild(el("p", null, p)); });
  sec.appendChild(brief);

  /* the desk and the screen */
  const work = el("div", "work" + (S.screen ? " with-screen" : ""));
  const benchHost = el("div", "desk-bench");
  const benchH = el("h3", "sub-h", "On the desk");
  const benchWrap = el("div"); benchWrap.appendChild(benchH); benchWrap.appendChild(benchHost);
  work.appendChild(benchWrap);
  let screenHost = null;
  if (S.screen) {
    const sw = el("div", "screen-col");
    sw.appendChild(el("h3", "sub-h", "On the screen"));
    screenHost = el("div");
    sw.appendChild(screenHost);
    work.appendChild(sw);
  }
  sec.appendChild(work);

  const stepsBox = el("ol", "steps");
  sec.appendChild(stepsBox);

  const resetRow = el("div", "reset-row");
  resetRow.hidden = !S.steps.some(function (x) { return x.kind === "task"; });
  const resetBtn = btn("Put the PC back to the last point you got right", "btn secondary", doReset);
  resetRow.appendChild(resetBtn);
  resetRow.appendChild(el("span", "note", "Your hints carry on from where they were. Nothing you got right is undone."));
  sec.appendChild(resetRow);

  if (S.mech) sec.appendChild(drawMech(S.mech));

  const nav = el("div", "stage-nav");
  sec.appendChild(nav);
  host.appendChild(sec);

  /* ------------------------------------------------------ the desk */
  bench = mountBench(benchHost, {
    height: S.screen ? 300 : 380,
    spec: function () { return deskSpec(m, S.key); },
    controls: function () { return deskControls(m, S.bench === "desk" && S.key === "desk" ? [] : ALL_HW); },
    status: function () {
      if (m.power !== "on") return { words: "The PC is off", tone: "calm" };
      if (m.crashed) return { words: "Blue screen", detail: m.crashed, tone: "urgent" };
      return null;
    },
    onAction: function (key, id) {
      const wasOn = m.power === "on";
      const res = deskAction(m, id);
      act({ type: "hw", id: id, res: res });
      if (wasOn !== (m.power === "on") && desktop) desktop.reset();
      return { say: res.say };
    }
  });

  if (S.screen) {
    desktop = createDesktop(screenHost, {
      m: function () { return m; },
      apps: S.apps,
      onAct: act,
      ruledOut: function () { return ctx.ruled; },
      canBlame: function () { const c = current(); return !!(c && c.key === "slow-find"); }
    });
  }

  /* ------------------------------------------------ acting on it */
  function act(a) {
    if (a.type === "elevated") ctx.elevatedSeen = true;
    if (a.type === "uac" && a.ok) ctx.elevatedSeen = true;
    const c = current();
    const before = a.before || lastSys;
    if (c && c.kind === "task") {
      if (a.type === "tm-blame") {
        const target = S.key === "slow" ? job.slow.culprit : null;
        if (a.tag && a.tag === target) { ctx.blamed = a.tag; }
        else {
          ctx.ruled[a.pid] = c.blameWhy ? c.blameWhy(a.proc, m) : "Not this one.";
          wrong(c.key);
          flash[c.key] = "Not that one \u2014 it is struck out in the list with the reason, and it stays struck.";
        }
      } else if (c.judge && c.judge(a, m, ctx, before)) {
        wrong(c.key);
        flash[c.key] = consequenceWords(a) || "That did not move the job on.";
      } else if (a.type === "cmd" || a.type === "hw" || a.type === "dm" || a.type === "tm-end") {
        const cw = consequenceWords(a);
        flash[c.key] = cw || null;
      }
      if (c.goal(m, ctx)) finish(c);
    }
    lastSys = M.clone(m.sys);
    redraw();
  }

  /* When something the student did has an effect on the machine worth
     saying in words beside the step, beyond what the screen shows. */
  function consequenceWords(a) {
    if (a.type === "tm-end" && a.res) {
      if (a.res.effect === "bsod") return "Ending a critical Windows process took the operating system down with it.";
      if (a.res.effect === "explorer") return "The taskbar and desktop have gone. Task Manager can bring Explorer back: Run new task, then explorer.";
      if (a.res.effect === "update-failed") return "The update that was installing has failed, and it will come back.";
      if (a.res.effect === "denied") return "Windows refused. Look at what kind of process that is.";
    }
    if (a.type === "hw" && a.res && (a.res.refused || a.res.harm)) return a.res.say;
    if (a.type === "dm" && a.res && !a.res.ok) return a.res.say;
    if (a.type === "power" && a.op === "restart") return null;
    return null;
  }

  function finish(step) {
    done[step.key] = true;
    flash[step.key] = null;
    snap = snapshot();
    o.onProgress && o.onProgress({ attempts: attempts, stepDone: step.key });
    if (!current()) o.onStageDone && o.onStageDone();
  }

  function doReset() {
    m = M.clone(snap.m);
    ctx = freshCtx();
    ctx.blamed = snap.blamed; ctx.elevatedSeen = snap.elevatedSeen;
    const c = current();
    if (c) { delete picked[c.key]; delete numTried[c.key]; flash[c.key] = "Back to where you last got it right. The hints carry on."; }
    lastSys = M.clone(m.sys);
    if (desktop) desktop.reset();
    redraw();
  }

  /* ------------------------------------------------------ drawing */
  function redraw() {
    if (bench) bench.refresh();
    if (desktop) desktop.draw();
    drawSteps();
    drawNav();
  }

  function drawSteps() {
    const focusKey = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.focus : null;
    stepsBox.innerHTML = "";
    const cur = current();
    S.steps.forEach(function (st, i) {
      const li = el("li", "step" + (done[st.key] ? " done" : st === cur ? " now" : " later"));
      const hd = el("div", "step-head");
      hd.appendChild(el("span", "step-state", done[st.key] ? "\u2713 Done" : st === cur ? "Now" : "Locked"));
      hd.appendChild(el("h3", "step-prompt", st.prompt));
      li.appendChild(hd);
      if (st === cur || done[st.key]) {
        if (st.kind === "choice") li.appendChild(drawChoice(st));
        if (st.kind === "number") li.appendChild(drawNumber(st));
        if (st.kind === "task") li.appendChild(drawTask(st));
      }
      if (done[st.key] && st.right) li.appendChild(el("p", "right-note", st.right));
      if (st === cur && flash[st.key]) { const f = el("p", "flash", flash[st.key]); f.setAttribute("role", "status"); li.appendChild(f); }
      if (st === cur) { const g = drawGuidance(st); if (g) li.appendChild(g); }
      if (INSTRUCTOR.isOn()) li.appendChild(el("p", "ins-answer", "Answer: " + (st.answer_text || st.answer)));
      stepsBox.appendChild(li);
    });
    if (focusKey) { const f = stepsBox.querySelector('[data-focus="' + focusKey + '"]'); if (f) f.focus(); }
  }

  function shownOptions(st) {
    if (!st._six) st._six = shownSix(st.options, job.key, st.key);
    return st._six;
  }

  function drawChoice(st) {
    const box = el("div", "options");
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", st.prompt);
    const P = picked[st.key] || (picked[st.key] = {});
    const isDone = !!done[st.key];
    shownOptions(st).forEach(function (op) {
      const out = !!P[op.key] && !op.correct;
      const b = el("button", "opt" + (out ? " out" : "") + (isDone && op.correct ? " right" : ""));
      b.type = "button";
      b.dataset.focus = st.key + ":" + op.key;
      const lab = el("span", "opt-label", op.label);
      if (out) {
        b.appendChild(el("span", "opt-mark", "\u2715 Ruled out"));
        b.appendChild(lab);
        b.appendChild(el("span", "opt-why", op.why));
        b.setAttribute("aria-label", "Ruled out: " + op.label + ". " + op.why);
      } else if (isDone && op.correct) {
        b.appendChild(el("span", "opt-mark", "\u2713 Right"));
        b.appendChild(lab);
      } else b.appendChild(lab);
      b.disabled = isDone || out;
      if (out) b.setAttribute("aria-disabled", "true");
      b.addEventListener("click", function () {
        if (op.correct) { finish(st); }
        else { P[op.key] = true; wrong(st.key); flash[st.key] = null; }
        redraw();
      });
      box.appendChild(b);
    });
    return box;
  }

  function drawNumber(st) {
    const box = el("div", "numbox");
    if (done[st.key]) { box.appendChild(el("p", "num-done", "\u2713 " + st.answer.toFixed(2) + " " + st.unit)); return box; }
    const id = "num-" + st.key;
    const lab = el("label", null, "Your answer, in " + st.unit + ":"); lab.setAttribute("for", id);
    const inp = el("input", "num-in"); inp.id = id; inp.type = "text"; inp.inputMode = "decimal"; inp.dataset.focus = st.key + ":in";
    const go = btn("Check", "btn", check);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); check(); } });
    function check() {
      const v = parseFloat(String(inp.value).replace(/,/g, "").replace(/[^\d.]/g, ""));
      if (!isFinite(v)) { flash[st.key] = "Type a number \u2014 digits and a decimal point."; redraw(); return; }
      if (Math.abs(v - st.answer) <= st.tol) { finish(st); }
      else {
        (numTried[st.key] = numTried[st.key] || []).push(v);
        wrong(st.key);
        flash[st.key] = v.toFixed(2) + " " + st.unit + " is not it.";
      }
      redraw();
    }
    box.appendChild(lab); box.appendChild(inp); box.appendChild(go);
    const tried = numTried[st.key] || [];
    if (tried.length) {
      const t = el("p", "tried");
      t.appendChild(el("span", "opt-mark", "\u2715 Tried and wrong: "));
      t.appendChild(document.createTextNode(tried.map(function (x) { return x.toFixed(2); }).join(", ")));
      box.appendChild(t);
    }
    return box;
  }

  function drawTask(st) {
    const box = el("div", "taskbox");
    if (done[st.key]) { box.appendChild(el("p", "task-done", "\u2713 Done on the machine.")); return box; }
    const where = { cmd: "on the screen, at a Command Prompt", taskmgr: "on the screen, in Task Manager", diskmgmt: "on the screen, in Disk Management", bench: "on the desk, with the controls beside the model" }[st.surface];
    box.appendChild(el("p", "task-where", "Do this " + where + ". It is checked against the PC itself, not against which buttons you pressed."));
    const n = attempts[st.key] || 0;
    box.appendChild(el("p", "task-tries", n ? "Moves that did not help so far: " + n + (n < 3 ? ". Hints start after 3." : ".") : "Looking around, reading help and typos never count against you."));
    return box;
  }

  /* The ladder. Rung 3's strike list is built so that a live wrong option
     is never one the student has already ruled out themselves — otherwise
     four struck by the rung plus one struck by the student would leave
     the answer standing alone, which is a rung that says the answer. */
  function drawGuidance(st) {
    const r = rung(st.key);
    if (!r) return null;
    const box = el("div", "guide rung-" + r);
    box.setAttribute("role", "note");
    const hints = typeof st.hints === "function" ? st.hints(m, ctx) : st.hints;
    const title = ["", "Hint 1 of 3: where to look", "Hint 2 of 3: the principle", "Hint 3 of 3: the field narrowed (this one repeats for as long as you need it)"][r];
    box.appendChild(el("h4", null, title));
    if (r === 1) box.appendChild(el("p", null, hints[0]));
    if (r >= 2) { box.appendChild(el("p", null, hints[0])); box.appendChild(el("p", "principle", hints[1])); }
    if (r === 3) {
      let opts;
      if (st.kind === "choice") opts = shownOptions(st).map(function (x) { return { label: x.label, correct: x.correct, why: x.why, key: x.key }; });
      /* Moves are authored right-answer-first; shown that way, the top
         line of every rung 3 would BE the answer. Same ordering as the
         questions: a stable hash of the labels. */
      else opts = shownSix((typeof st.moves === "function" ? st.moves(m, ctx) : st.moves || []).map(function (x, i) { return Object.assign({ key: "m" + i }, x); }), job.key, st.key);
      const P = picked[st.key] || {};
      const wrongs = opts.filter(function (x) { return !x.correct; });
      wrongs.sort(function (a, b) { return (P[b.key] ? 1 : 0) - (P[a.key] ? 1 : 0); });
      const strike = {};
      wrongs.slice(0, Math.max(0, opts.length - 2)).forEach(function (x) { strike[x.key] = true; });
      box.appendChild(el("p", null, st.kind === "choice"
        ? "Four of the six are ruled out below, each with its reason. Two are still alive. The choice is still yours."
        : "Six possible next moves. Four are ruled out, each with its reason; two are still alive. You still do it yourself."));
      const ul = el("ul", "narrow");
      opts.forEach(function (x) {
        const li = el("li", strike[x.key] ? "struck" : "alive");
        li.appendChild(el("span", "opt-mark", strike[x.key] ? "\u2715 Ruled out" : "\u25CF Still alive"));
        li.appendChild(el("span", "narrow-label", x.label));
        if (strike[x.key]) li.appendChild(el("span", "opt-why", x.why));
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }
    return box;
  }

  function drawNav() {
    nav.innerHTML = "";
    if (o.index > 0) nav.appendChild(btn("\u2039 Previous stage", "btn secondary", function () { o.onGo(o.index - 1); }));
    const complete = !current();
    if (complete) {
      const p = el("p", "stage-done", "Stage complete.");
      p.setAttribute("role", "status");
      nav.appendChild(p);
    }
    const next = btn(o.index + 1 < o.total ? "Next stage \u203a" : "Finish the job \u203a", "btn", function () { o.onGo(o.index + 1); });
    next.disabled = !complete;
    nav.appendChild(next);
  }

  function drawMech(mech) {
    const box = el("details", "panel mech");
    const sum = el("summary", null, "Under the hood: " + mech.title);
    box.appendChild(sum);
    let i = 0;
    const fig = el("div", "mech-frame");
    const cap = el("div", "mech-cap");
    const bar = el("div", "mech-bar");
    const prev = btn("\u2039 Back", "btn secondary", function () { if (i > 0) { i--; show(); } });
    const nxt = btn("Next \u203a", "btn secondary", function () { if (i < mech.frames.length - 1) { i++; show(); } });
    const count = el("span", "mech-count");
    bar.appendChild(prev); bar.appendChild(count); bar.appendChild(nxt);
    function show() {
      fig.innerHTML = "";
      if (mech.diagram) fig.appendChild(diagram(mech.diagram, i));
      cap.innerHTML = "";
      cap.appendChild(el("h4", null, mech.frames[i].title));
      cap.appendChild(el("p", null, mech.frames[i].text));
      count.textContent = (i + 1) + " of " + mech.frames.length;
      prev.disabled = i === 0; nxt.disabled = i === mech.frames.length - 1;
    }
    box.appendChild(fig); box.appendChild(cap); box.appendChild(bar);
    show();
    return box;
  }

  function diagram(kind, i) {
    const d = el("div", "diagram diagram-" + kind);
    if (kind === "layers") {
      const rows = [
        ["Protected system files", "C:\\Windows\\System32 and around it", "sfc /scannow", 2],
        ["Component store", "C:\\Windows\\WinSxS \u2014 the known-good copies", "DISM /Online /Cleanup-Image /RestoreHealth", 1],
        ["File system", "NTFS on C:", "chkdsk C: /f", 0]
      ];
      rows.forEach(function (r) {
        const on = (i === r[3]) || (i >= 3);
        const b = el("div", "layer" + (on ? " lit" : ""));
        b.appendChild(el("strong", null, r[0]));
        b.appendChild(el("span", null, r[1]));
        b.appendChild(el("code", null, r[2]));
        d.appendChild(b);
        if (r[3] > 0) d.appendChild(el("div", "layer-arrow", "\u25B2 repairs from the layer below"));
      });
      return d;
    }
    if (kind === "disk") {
      const bytes = job.disk.bytes;
      const g = bytes / M.GiB;
      const strip = el("div", "strip");
      const mbr = el("div", "strip-mbr"); mbr.style.width = Math.min(100, 2048 / g * 100) + "%";
      mbr.appendChild(el("span", null, "MBR can reach: 2048 GB"));
      const rest = el("div", "strip-rest");
      rest.appendChild(el("span", null, i >= 2 ? "Unreachable on MBR: " + (g - 2048).toFixed(2) + " GB" : "The rest of the drive"));
      strip.appendChild(mbr); strip.appendChild(rest);
      d.appendChild(el("p", "strip-cap", "This job's drive: " + bytes.toLocaleString("en-GB") + " bytes = " + g.toFixed(2) + " GB in Windows' units (\u00f7 1,073,741,824), " + (bytes / 1e9).toFixed(2) + " GB in the maker's."));
      d.appendChild(strip);
      return d;
    }
    return d;
  }

  redraw();
  return {
    dispose: function () { if (bench) bench.dispose(); },
    machine: function () { return m; },
    /* seams for verify/: never used by the page */
    _state: function () { return { done: done, attempts: attempts, ctx: ctx, current: current() && current().key }; }
  };
}
