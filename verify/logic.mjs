/* =====================================================================
   verify/logic.mjs — the checks that need no browser.

     node verify/logic.mjs           the checks
     node verify/logic.mjs --plant   every planted defect must be CAUGHT

   What it holds, for every job and every built stage:

     COVERAGE   every stage names real doc topics; every doc topic is
                covered by a built stage or named in PLANNED, with the lab
                that will cover it
     SIX        every choice question: one right, at least five wrong, a
                reason on every wrong one; six shown, one of them right
     SPREAD     the right answer does not sit in the same slot, and is not
                usually the longest option
     EXHIBITED  the generated fault is really there in the machine before
                the student starts (the culprit really tops its column;
                the files really are damaged; the drive really is past
                MBR's reach) — the three bugs that would have marked right
                answers wrong in the Core 1 build were caught exactly so
     SOLVABLE   the fix, typed and done headless, really leaves the machine
                fixed; and the tempting wrong fix really does not
     NO LEAK    no rung-1 or rung-2 hint contains the answer
     LADDER     every rung-3 list is six moves, one right, a reason on each
                wrong one
     JUDGE      looking, help and typos never count as a guess; a refused
                repair does

   A plant run that passes is reported as a failure: a check that cannot
   fail is not a check.
   ===================================================================== */
import * as M from "../assets/machine.js";
import { createShell } from "../assets/cmd.js";
import * as LT from "../assets/lab-tools.js";
import * as LABS from "../assets/labs.js";
import { deskAction } from "../assets/bench-desk.js";
import { sixOptions } from "../assets/options.js";
import { shownSix } from "../assets/order.js";

const clone = (x) => JSON.parse(JSON.stringify(x));

export function check(D) {
  const fails = [];
  const F = (s) => fails.push(s);
  const lab = D.LABS[0];

  /* ---- coverage ---- */
  const ids = D.TOPICS.map((t) => t.id);
  const covered = new Set();
  lab.stages.forEach((s) => {
    if (!s.topics || !s.topics.length) F("stage " + s.key + " has no topics");
    (s.topics || []).forEach((t) => { if (ids.indexOf(t) < 0) F("stage " + s.key + " names a topic that does not exist: " + t); });
    if (s.built) { (s.topics || []).forEach((t) => covered.add(t)); if (!D.buildStage(s.key, D.JOBS[0])) F("stage " + s.key + " is marked built and has no builder"); }
  });
  const planned = new Set(); D.PLANNED.forEach((p) => p.topics.forEach((t) => { planned.add(t); if (ids.indexOf(t) < 0) F("PLANNED names a topic that does not exist: " + t); }));
  ids.forEach((t) => { if (!covered.has(t) && !planned.has(t)) F("topic " + t + " is neither covered by a built stage nor planned in any lab"); });

  /* ---- per job, per stage ---- */
  const slots = {}; let longest = 0, nq = 0;
  D.JOBS.forEach((job) => {
    lab.stages.filter((s) => s.built).forEach((meta) => {
      const st = D.buildStage(meta.key, job);
      if (!st) { F(job.key + "/" + meta.key + ": builder returned nothing"); return; }
      st.steps.forEach((step) => {
        const where = job.key + "/" + step.key;
        if (step.kind === "choice") {
          const right = step.options.filter((o) => o.correct);
          const wrong = step.options.filter((o) => !o.correct);
          if (right.length !== 1) F(where + ": " + right.length + " options marked right");
          if (wrong.length < 5) F(where + ": only " + wrong.length + " wrong options");
          wrong.forEach((o) => { if (!o.why || o.why.length < 12) F(where + ": wrong option without a reason: " + o.label); });
          const six = sixOptions(step.options, 1);
          if (six.length !== 6 || six.filter((o) => o.correct).length !== 1) F(where + ": sixOptions did not give six with one right");
          nq++;
          const shown = D.shownSix(step.options, job.key, step.key);
          const slot = shown.findIndex((o) => o.correct);
          slots[slot] = (slots[slot] || 0) + 1;
          const lens = step.options.map((o) => o.label.length);
          if (right[0] && right[0].label.length === Math.max.apply(null, lens)) longest++;
          noLeak(where, step.hints, [right[0] && right[0].label]);
        }
        if (step.kind === "number") {
          if (meta.key === "disk" && Math.abs(step.answer - job.disk.bytes / M.GiB) > 0.006) F(where + ": the calculation's answer is not bytes / 1,073,741,824");
          ladder(where, step.moves());
          noLeak(where, step.hints, [step.answer.toFixed(2)]);
        }
      });
      stageSolvable(job, meta.key, st, F, D);
    });
  });
  const ms = D.__moveSlots || {}; const mtot = Object.values(ms).reduce((a, b) => a + b, 0);
  const mmost = Math.max.apply(null, Object.values(ms).concat([0]));
  if (mtot && mmost / mtot > 0.4) F("the right move sits in the same slot of rung 3 in " + mmost + " of " + mtot + " lists");
  const most = Math.max.apply(null, Object.values(slots).concat([0]));
  if (nq && most / nq > 0.4) F("the right answer sits in the same slot in " + most + " of " + nq + " questions");
  if (nq && Object.keys(slots).length < 4) F("the right answer only ever appears in " + Object.keys(slots).length + " of the six slots");
  D.__stats = { nq: nq, longest: longest, slots: slots };
  /* The opposite bias is a pattern too: a student who learns that the
     right answer is NEVER the longest has learned something that is not
     the content. Near chance is one in six. */
  if (nq >= 12 && longest < 1) F("the right answer is never the longest option, in " + nq + " questions");
  if (nq && longest / nq > 0.5) F("the right answer is the longest option in " + longest + " of " + nq + " questions");

  function ladder(where, moves) {
    if (moves && moves.length === 6) {
      const shown = D.shownSix(moves.map((x, i) => Object.assign({ key: "m" + i }, x)), where.split("/")[0], where.split("/")[1] || "x");
      const slot = shown.findIndex((x) => x.correct);
      D.__moveSlots = D.__moveSlots || {}; D.__moveSlots[slot] = (D.__moveSlots[slot] || 0) + 1;
    }
    if (!moves || moves.length !== 6) F(where + ": rung 3 has " + (moves ? moves.length : 0) + " moves, not 6");
    if (moves && moves.filter((x) => x.correct).length !== 1) F(where + ": rung 3 does not have exactly one right move");
    (moves || []).forEach((x) => { if (!x.correct && (!x.why || x.why.length < 10)) F(where + ": rung-3 move without a reason: " + x.label); });
  }
  function noLeak(where, hints, answers) {
    (hints || []).forEach((h) => {
      answers.filter(Boolean).forEach((a) => {
        if (String(h).toLowerCase().indexOf(String(a).toLowerCase()) >= 0) F(where + ": a hint contains the answer (“" + a + "”)");
      });
    });
  }

  return fails;

  /* ------------------------------------------------------------------ */
  function stageSolvable(job, key, st, F, D) {
    const ctxOf = (m) => ({ blamed: null, elevatedSeen: false, ruled: {}, get events() { return m.events; } });
    const step = (k) => st.steps.filter((x) => x.key === k)[0];
    if (key === "slow") {
      const m = D.machineFor(job, "slow"); const ctx = ctxOf(m);
      const find = step("slow-find");
      if (find.goal(m, ctx)) F(job.key + "/slow-find: done before the student starts");
      /* EXHIBITED: the culprit is the top row of the column that matches the symptom */
      const col = job.slow.column;
      const top = m.procs.slice().sort((a, b) => (b[col] || 0) - (a[col] || 0))[0];
      if (!top || top.tag !== job.slow.culprit) F(job.key + "/slow: sorted by " + col + ", the top row is " + (top && top.name) + ", not the culprit");
      ladder(job.key + "/slow-find", find.moves(m, ctx));
      noLeak(job.key + "/slow-find", find.hints(m, ctx), [job.slow.procs.filter((p) => p.tag === job.slow.culprit)[0].desc]);
      ctx.blamed = job.slow.culprit;
      if (!find.goal(m, ctx)) F(job.key + "/slow-find: blaming the culprit does not finish it");
      const act = step("slow-act");
      if (act) {
        ladder(job.key + "/slow-act", act.moves(m, ctx));
        if (act.goal(m, ctx)) F(job.key + "/slow-act: done before the student acts");
        if (job.slow.act.kind === "end") { const p = m.procs.filter((x) => x.tag === job.slow.act.tag)[0]; M.endProcess(m, p.pid); }
        else deskAction(m, "net-unplug");
        if (!act.goal(m, ctx)) F(job.key + "/slow-act: doing it does not finish it");
      }
      return;
    }
    if (key === "admin") {
      const fix = step("admin-fix");
      const v = job.admin.variant;
      const m = D.machineFor(job, "admin"); const ctx = ctxOf(m);
      if (fix.goal(m, ctx)) F(job.key + "/admin-fix: done before the student starts");
      if (v !== "clean" && M.sysHealthy(m)) F(job.key + "/admin: the system files are not actually damaged");
      /* JUDGE: looking, help and typos never count; a refused repair does */
      const std = createShell(m, {});
      const before = clone(m.sys);
      ["dir", "help", "sfc /?", "sfcc /scannow", "whoami", "tasklist"].forEach((c) => {
        const res = std.run(c);
        if (fix.judge({ type: "cmd", line: c, res: res }, m, ctx, before)) F(job.key + "/admin: “" + c + "” was counted as a guess");
      });
      const r = std.run("sfc /scannow");
      if (!fix.judge({ type: "cmd", line: "sfc /scannow", res: r }, m, ctx, before)) F(job.key + "/admin: a refused sfc in a standard prompt was not counted");
      ladder(job.key + "/admin-fix", fix.moves(m, ctx));
      /* SOLVABLE: the known path, typed */
      const sh = createShell(m, { elevated: true }); ctx.elevatedSeen = true;
      const seq = { sfc: ["sfc /scannow"], dism: ["sfc /scannow", "DISM /Online /Cleanup-Image /RestoreHealth", "sfc /scannow"],
        chkdsk: ["sfc /scannow", "chkdsk C: /f", "Y", "#boot", "sfc /scannow"], pending: ["sfc /scannow", "#boot", "sfc /scannow"],
        clean: ["sfc /scannow"], creds: ["sfc /scannow"] }[v];
      let sh2 = sh;
      seq.forEach((c) => {
        if (c === "#boot") { M.shutdown(m); M.boot(m); sh2 = createShell(m, { elevated: true }); return; }
        const b = clone(m.sys); const res = sh2.run(c);
        if (fix.judge({ type: "cmd", line: c, res: res }, m, ctx, b)) F(job.key + "/admin: the right move “" + c + "” was counted as a guess");
      });
      if (!fix.goal(m, ctx)) F(job.key + "/admin-fix: the known fix does not leave the machine fixed");
      /* the tempting wrong path must NOT fix it */
      const m2 = D.machineFor(job, "admin"); const c2 = ctxOf(m2); const s2 = createShell(m2, { elevated: true });
      if (v === "dism") { s2.run("sfc /scannow"); s2.run("sfc /scannow"); if (fix.goal(m2, c2)) F(job.key + "/admin: sfc alone fixed a damaged component store"); }
      if (v === "chkdsk") { s2.run("DISM /Online /Cleanup-Image /RestoreHealth"); s2.run("sfc /scannow"); if (fix.goal(m2, c2)) F(job.key + "/admin: the files were fixed without repairing the file system"); }
      if (v === "pending") { s2.run("sfc /scannow"); s2.run("sfc /scannow"); if (fix.goal(m2, c2)) F(job.key + "/admin: the files were fixed without the pending restart"); }
      return;
    }
    if (key === "disk") {
      const fit = step("disk-fit"), setup = step("disk-setup");
      const m = D.machineFor(job, "disk"); const ctx = ctxOf(m);
      if (job.disk.bytes <= M.MBR_LIMIT) F(job.key + "/disk: the drive is not past MBR's limit, so the trap is not there");
      if (fit.goal(m, ctx)) F(job.key + "/disk-fit: done before the student starts");
      const r0 = deskAction(m, "panel-off");
      if (!r0.refused) F(job.key + "/disk-fit: the case opened with the PC running");
      if (!fit.judge({ type: "hw", id: "panel-off", res: r0 }, m, ctx)) F(job.key + "/disk-fit: opening a running PC was not counted");
      ladder(job.key + "/disk-fit", fit.moves(m, ctx));
      M.shutdown(m);
      const r1 = deskAction(m, "panel-off");
      if (!r1.refused) F(job.key + "/disk-fit: the case opened with the mains lead still in");
      ["mains-out", "panel-off", "drive-in", "data-in", "power-in", "panel-on", "mains-in", "power-on"].forEach((id) => {
        const res = deskAction(m, id);
        if (fit.judge({ type: "hw", id: id, res: res }, m, ctx)) F(job.key + "/disk-fit: the right move " + id + " was counted as a guess");
      });
      if (!fit.goal(m, ctx)) F(job.key + "/disk-fit: the known steps do not leave the drive fitted");
      if (!LT.spareDisk(m)) F(job.key + "/disk: the fitted, cabled drive is not detected");
      if (setup.goal(m, ctx)) F(job.key + "/disk-setup: done before the student starts");
      ladder(job.key + "/disk-setup", setup.moves(m, ctx));
      /* the MBR path must not satisfy it */
      const mb = clone(m);
      doSetup(mb, job, "MBR");
      if (setup.goal(mb, ctx)) F(job.key + "/disk-setup: an MBR disk was accepted");
      doSetup(m, job, "GPT");
      if (!setup.goal(m, ctx)) F(job.key + "/disk-setup: the known steps do not leave the drive usable");
      /* a drive with a lead missing is not detected */
      const m3 = D.machineFor(job, "disk"); M.shutdown(m3);
      ["mains-out", "panel-off", "drive-in", "data-in", "panel-on", "mains-in", "power-on"].forEach((id) => deskAction(m3, id));
      if (LT.spareDisk(m3)) F(job.key + "/disk: the drive was detected with no SATA power");
    }
  }
}

function doSetup(m, job, style) {
  const d = LT.spareDisk(m);
  if (m.hw.spare.offline) m.hw.spare.offline = false;
  if (d.parts.some((p) => p.kind === "data")) {
    const i = d.parts.findIndex((p) => p.kind === "data"); M.deleteVolume(m, d.n, i);
    if (style === "GPT") M.convertDisk(m, d.n, "GPT");
  } else M.initDisk(m, d.n, style);
  const n = job.disk.need;
  if (n.volumes > 1) { M.newVolume(m, d.n, { size: 1048576 * 1048576, fs: "NTFS", letter: "E", label: "Scan" }); M.newVolume(m, d.n, { fs: "NTFS", letter: "F", label: job.disk.label }); }
  else M.newVolume(m, d.n, { fs: "NTFS", letter: n.letter || "E", label: job.disk.label });
}

/* ------------------------------------------------------------ run */
const BASE = { shownSix: shownSix, JOBS: LT.JOBS, LABS: LABS.LABS, PLANNED: LABS.PLANNED, TOPICS: LABS.TOPICS, buildStage: LT.buildStage, machineFor: LT.machineFor };

const PLANTS = {
  "a topic nobody covers": (D) => { D.PLANNED = D.PLANNED.map((p) => Object.assign({}, p, { topics: p.topics.filter((t) => t !== "op-backup") })); return D; },
  "a stage naming a topic that does not exist": (D) => { D.LABS = clone(D.LABS); D.LABS[0].stages[0].topics = ["os-tools", "made-up"]; return D; },
  "two right answers": (D) => { D.JOBS = clone(D.JOBS); D.JOBS[0].desk.wrong[0] = [D.JOBS[0].desk.wrong[0][0], D.JOBS[0].desk.wrong[0][1]]; const bs = D.buildStage; D.buildStage = (k, j) => { const s = bs(k, j); if (s && k === "desk" && j.key === D.JOBS[0].key) s.steps[0].options[1].correct = true; return s; }; return D; },
  "a wrong option with no reason": (D) => { D.JOBS = clone(D.JOBS); D.JOBS[1].desk.wrong[2][1] = ""; return D; },
  "files not actually damaged": (D) => { D.JOBS = clone(D.JOBS); D.JOBS[1].admin.sys = {}; return D; },
  "the culprit is not the top row": (D) => { D.JOBS = clone(D.JOBS); D.JOBS[2].slow.procs[0].cpu = 0.2; return D; },
  "a hint that gives the answer": (D) => { D.JOBS = clone(D.JOBS); D.JOBS[0].desk.where = "It is this one: " + D.JOBS[0].desk.correct; return D; },
  "a wrong calculation answer": (D) => { const bs = D.buildStage; D.buildStage = (k, j) => { const s = bs(k, j); if (s && k === "disk") s.steps[0].answer = j.disk.bytes / 1e9; return s; }; return D; },
  "a drive under the MBR limit": (D) => { D.JOBS = clone(D.JOBS); D.JOBS[3].disk.bytes = 2000398934016; return D; },
  "a rung-3 list of five": (D) => { const bs = D.buildStage; D.buildStage = (k, j) => { const s = bs(k, j); if (s && k === "disk") { const f = s.steps[1].moves; s.steps[1].moves = (m) => f(m).slice(0, 5); } return s; }; return D; },
  "a judge that counts typos": (D) => { const bs = D.buildStage; D.buildStage = (k, j) => { const s = bs(k, j); if (s && k === "admin") { const f = s.steps[0].judge; s.steps[0].judge = (a, m, c, b) => (a.res && a.res.kind === "error") || f(a, m, c, b); } return s; }; return D; },
  "sfc repairing from a damaged store": (D) => { const mf = D.machineFor; D.machineFor = (j, k) => { const m = mf(j, k); if (k === "admin" && j.admin.variant === "dism") { m.sys.storeCorrupt = false; } return m; }; return D; },
  "the right answer always first": (D) => { D.shownSix = (opts) => sixOptions(opts, 1).slice().sort((a, b) => (b.correct ? 1 : 0) - (a.correct ? 1 : 0)); return D; },
  "the right answer never the longest": (D) => { const bs = D.buildStage; D.buildStage = (k, j) => { const s = bs(k, j); if (s) s.steps.forEach((st) => (st.options || []).forEach((o) => { if (o.correct) o.label = o.label.slice(0, 8); })); return s; }; return D; },
  "rung 3 lists the right move first": (D) => { D.shownSix = (opts, a, b) => (opts[0] && /^m\d$/.test(opts[0].key)) ? opts.slice() : shownSix(opts, a, b); return D; },
  "an MBR disk accepted": (D) => { const bs = D.buildStage; D.buildStage = (k, j) => { const s = bs(k, j); if (s && k === "disk") { const g = s.steps[2].goal; s.steps[2].goal = (m, c) => { const d = LT.spareDisk(m); if (d && d.style === "MBR" && d.parts.some((p) => p.kind === "data")) return true; return g(m, c); }; } return s; }; return D; }
};

const plant = process.argv.includes("--plant");
if (!plant) {
  const D0 = Object.assign({}, BASE);
  const fails = check(D0);
  console.log("right answer is the longest option in " + D0.__stats.longest + " of " + D0.__stats.nq + "; slots used: " + JSON.stringify(D0.__stats.slots));
  if (fails.length) { console.log("FAIL\n  " + fails.join("\n  ")); process.exit(1); }
  console.log("PASS — coverage, six options, spread, exhibited faults, solvable fixes, no leaks, ladders, judge: " + LT.JOBS.length + " jobs × " + LABS.LABS[0].stages.filter((s) => s.built).length + " stages");
} else {
  let bad = 0;
  /* Each plant names words its OWN check says. Being caught by some other
     check on the way past is not the same thing: that is how a plant can
     pass while the check it was written for is dead. */
  const EXPECT = {
    "a topic nobody covers": "neither covered", "a stage naming a topic that does not exist": "does not exist",
    "two right answers": "options marked right", "a wrong option with no reason": "without a reason",
    "files not actually damaged": "not actually damaged", "the culprit is not the top row": "not the culprit",
    "a hint that gives the answer": "contains the answer", "a wrong calculation answer": "not bytes",
    "a drive under the MBR limit": "not past MBR", "a rung-3 list of five": "not 6",
    "a judge that counts typos": "was counted as a guess", "sfc repairing from a damaged store": "counted as a guess",
    "the right answer always first": "same slot", "the right answer never the longest": "never the longest",
    "an MBR disk accepted": "MBR disk was accepted", "rung 3 lists the right move first": "right move sits in the same slot"
  };
  Object.keys(PLANTS).forEach((name) => {
    const fails = check(PLANTS[name](Object.assign({}, BASE)));
    const hit = fails.filter((f) => f.indexOf(EXPECT[name]) >= 0)[0];
    if (hit) console.log("caught   " + name + "  →  " + hit);
    else { console.log("MISSED   " + name + (fails.length ? "  (only other checks fired: " + fails[0] + ")" : "")); bad++; }
  });
  if (bad) { console.log(bad + " plant(s) not caught"); process.exit(1); }
  console.log("every plant caught (" + Object.keys(PLANTS).length + ")");
}
