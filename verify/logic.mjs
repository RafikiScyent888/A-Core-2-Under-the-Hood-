/* =====================================================================
   verify/logic.mjs — the checks that need no browser.

     node verify/logic.mjs           the checks
     node verify/logic.mjs --plant   every planted defect must be CAUGHT

   What it holds, for all twelve tickets:

     SHAPE      six per sim, one of each is the sim itself, ids unique
     EXHIBITED  after setup the fault is really on the machine: the
                program really fails, the way the ticket says it does,
                and the ticket's goal is not already met
     SOLVABLE   the known fix, done headless through the real shell and
                the real repair code, really meets the goal
     SIX        the close question: six options, one right, a reason on
                every wrong one; the rung-3 moves the same
     SPREAD     the right answer does not sit in one slot, and is not
                usually the longest option
     NO LEAK    no rung-1 or rung-2 hint names the answer
     LADDER     rung for guesses 0..9 is 0,0,0,1,2,3,3,3,3,3; rung 3
                strikes four and leaves two alive, the right one among them
     JUDGE      looking, help and typos never count; a refused change and
                the sim's old answer do; undoing your own change does not
     SNAPSHOT   revert puts the machine back and keeps the hint count;
                a session survives a reload
     NOTE       a ticket note needs the words that matter, in any wording
     MALWARE    for each malware ticket: the infection is really on the
                PCs it names and nowhere else; CompTIA's steps, done in
                order through the engine, close it with no wrong moves;
                out of order costs (spread, a clean PC unplugged, an old-
                definitions scan, a restore point while infected); six
                moves at every step, no hint naming the move
     MAIL       for each email ticket: every email reaches its user, and its
                forward reaches the help desk unless it can't be forwarded;
                the right handling closes it with no wrong moves; skipping
                a safeguard leaves it open; the consequences count (a phish
                called safe compromises the user, a genuine email junked or
                its sender blocked, a link opened); every giveaway question
                is six with one right, spread across the slots and not
                usually the longest; no hint names the giveaway

   A plant run that passes is reported as a failure: a check that cannot
   fail is not a check.
   ===================================================================== */
import * as M from "../assets/machine.js";
import { createShell } from "../assets/cmd.js";
import { makeFleet, byHost } from "../assets/fleet.js";
import * as TK from "../assets/tickets.js";
import { createEngine, rungFor } from "../assets/engine.js";
import { ordered } from "../assets/order.js";
import * as MW from "../assets/malware.js";
import { nextStep } from "../assets/tickets-malware.js";
import * as MX from "../assets/mail.js";

const clone = (x) => JSON.parse(JSON.stringify(x));
function memStore() { const d = {}; return { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); }, removeItem: (k) => { delete d[k]; } }; }

/* The known fix for each ticket, done the way a student would. */
export const FIX = {
  L1: (m) => M.repairApp(m, "Testing", "repair"), L2: (m) => M.repairApp(m, "PayWise", "repair"),
  L3: (m) => { M.launchApp(m, "Scan2Doc"); M.note(m, "view-log", { log: "Application" }); M.repairApp(m, "Scan2Doc", "repair"); },
  L4: (m) => M.repairApp(m, "Testing", "repair"), L5: (m) => M.repairApp(m, "LabelPro", "repair"),
  L6: (m) => { M.launchApp(m, "ChartView"); M.note(m, "view-log", { log: "Application" }); M.repairApp(m, "ChartView", "repair"); },
  D1: (m, sh) => sh.run("\\\\FS01\\Software\\vcredist_x86_2010.exe"), D2: (m, sh) => sh.run("\\\\FS01\\Software\\VC_redist.x86.exe"),
  D3: (m, sh) => sh.run('setx /m path "%PATH%;C:\\Program Files (x86)\\Common Files\\Rafiki"'),
  D4: (m, sh) => { sh.run("gpupdate /force"); const r = sh.run("Y"); if (r.power === "restart") { M.shutdown(m); M.boot(m); } },
  D5: (m, sh) => sh.run('del "C:\\Program Files (x86)\\Testing\\msvcp100.dll"'),
  D6: (m, sh) => sh.run("\\\\FS01\\Software\\VC_redist.x64.exe")
};
/* How each ticket's fault shows itself before it is fixed. */
export const SHOWS = { L1: "missing", L2: "missing", L3: "missing", L4: "config", L5: "shortcut", L6: "crash", D1: "missing", D2: "missing", D3: "missing", D4: "notfound", D5: "bitness", D6: "missing" };
/* Words that would hand over the fix if a rung-1 or rung-2 hint used them. */
const ANSWER_WORDS = [/vcredist_x86_2010/i, /vc_redist\.x(86|64)\.exe/i, /vcredist_x86_2013/i, /gpupdate \/force/i, /setx \/m/i, /modify\s*→\s*repair/i];
/* The model note for each ticket: the note check must accept it. */
const NOTES = {
  L1: "Testing said MSVCP100.dll was missing. Repaired Testing from Settings and tested that it opens.",
  L2: "PayWise said VCRUNTIME140.dll was missing. Reinstalled PayWise from Software Center; it opens now.",
  L3: "Scan2Doc says MSVCR120.dll is missing. Repair changed nothing; Event Viewer shows the same. Escalated to Tier 2 for the runtime.",
  L4: "Testing gave a configuration error: config.ini was damaged. Repaired Testing, which rewrote the file, and tested it.",
  L5: "The LabelPro shortcut pointed at the old version's folder. Repaired LabelPro, which recreated the shortcut; tested.",
  L6: "ChartView crashes with 0xc0000005 in ChartView.exe (Event Viewer, Application Error). Repair did not help. Escalated.",
  D1: "Event 2190: Testing faulting module MSVCP100.dll. The System32 copy is 64-bit. Installed the x86 redistributable and tested.",
  D2: "PayWise needed vcruntime140.dll, the 32-bit (x86) runtime. Installed VC_redist.x86 elevated and tested it.",
  D3: "The deployment wiped the PATH. Added Common Files\\Rafiki back to the system PATH with setx /m and tested Testing.",
  D4: "Software installation policy was pending a restart. Ran gpupdate /force and restarted; Testing installed.",
  D5: "A 64-bit msvcp100.dll was in Testing's folder, giving 0xc000007b. Deleted it (elevated) and tested Testing.",
  D6: "LabelPro is 64-bit and vcruntime140.dll was missing from System32. Installed the x64 runtime and tested.",
  M1: "Checked all seven PCs. SCVHOST.exe (PDF Pro Updater service) on WS2 and FS01. Quarantined both by unplugging them, turned System Restore off on WS2, updated definitions from USB, ran a Defender Offline scan, scheduled scans, updated, made a restore point. Told Brenda to use Software Center.",
  M2: "Checked all seven PCs. SpeedBoostPro.exe on WS1 came from the 3x faster email. Unplugged it to quarantine, disabled System Restore, updated definitions from USB, Defender Offline scan, scheduled scans, updates, restore point. Told John not to install from email links.",
  M3: "Checked all seven PCs. SearchMate hijacker (smhelper.exe) on WS5 came with the coupon add-on. Unplugged to quarantine, System Restore off, definitions from USB, Defender Offline scan, scheduled scans, updates, restore point. Advised Rosa about add-ons.",
  M4: "Checked all seven PCs. A miner posing as WmiPrvSvc.exe on WS3, from the DarkPro VS Code theme extension. Unplugged to quarantine, System Restore off, USB definitions, Defender Offline scan, schedule, updates, restore point. Told Dev to use verified extensions.",
  M5: "Checked all seven PCs. PC Defender Pro, fake antivirus scareware, on WS4. Unplugged to quarantine, System Restore off, USB definitions, Defender Offline scan, scheduled scans, updates, restore point. Told Farah never to pay a pop-up.",
  M6: "Checked all seven PCs. The Invoice xlsm macro Farah enabled dropped OfficeUpdate.exe on WS4 and on FS01, the file server. Quarantined both, System Restore off on WS4, USB definitions, Defender Offline scan, schedule, updates, restore point. Told Farah never to enable macros from email.",
  E1: "John's Microsoft password email was phishing (link to msaccount-updatecenter.com): reported and purged. Dev's 3x Faster was a malicious download: reported, purged, domain blocked. Rosa's diet email was spam: junk. Farah's bank statement was legit: told her it's genuine.",
  E2: "Dev's CloudHost receipt was genuine. Brenda's iPhone prize was spam, junked. Farah's PayPal email was phishing (paypal-resolve-login.net), reported and purged. The Hartwell invoice was an xlsm macro: malicious, reported, purged, blocked.",
  E3: "Brenda's TravelSafe hotel booking was genuine. Dev's streaming offer was spam, junked. Rosa's bank suspended email and John's Jakarta login alert were both phishing: reported and purged.",
  E4: "Farah's gift card request from Mason came from rafiki-lt.com with a Gmail reply-to, failing SPF and DMARC in the headers: phishing, reported, purged, blocked, and turned on the external tag policy. Dev's course was genuine, John's chairs spam, Brenda's bonus .exe malicious.",
  E5: "Rosa's mailbox validate email claimed to be our help desk but the headers show SPF and DMARC failed from an outside server: phishing, reported, purged, anti-spoof quarantine policy on. Dev's PayWise notice was genuine (Software Center). Brenda's webinar spam. Rosa's parcel zip label malicious.",
  E6: "Brady Tag's new bank details came from bradytag-co.com, a lookalike domain with a reply-to on another domain: phishing, reported, purged, blocked, lookalike policy on. Farah's order shipped notice was genuine. John's DocuSign was phishing. Brenda's timesheet xlsm macro was malicious."
};

export function check(D) {
  const fails = []; const F = (s) => fails.push(s);
  const T = D.TICKETS;

  /* ---- SHAPE ---- */
  const bySim = {}; const ids = new Set();
  T.forEach((t) => { if (ids.has(t.id)) F("SHAPE: duplicate id " + t.id); ids.add(t.id); (bySim[t.sim] = bySim[t.sim] || []).push(t); });
  const APP = T.filter((t) => !t.kind), MAL = T.filter((t) => t.kind === "malware"), EM = T.filter((t) => t.kind === "email");
  Object.entries(bySim).forEach(([sim, list]) => {
    if (list.length !== 6) F("SHAPE: " + sim + " has " + list.length + " tickets, not 1 + 5");
    if (list.filter((t) => t.base).length !== 1) F("SHAPE: " + sim + " does not have exactly one ticket that is the sim itself");
  });
  if (Object.keys(bySim).length !== 4) F("SHAPE: expected the two App sims, Malware and Email Threat, found " + Object.keys(bySim).length);

  const pos = [0, 0, 0, 0, 0, 0]; let longest = 0, lenQs = 0, movePos = [0, 0, 0, 0, 0, 0];
  APP.forEach((t) => {
    /* ---- EXHIBITED ---- */
    const f = D.makeFleet(); t.setup(f); const m = f[t.machine];
    if (t.goal(f)) F("EXHIBITED " + t.id + ": the goal is already met before the student starts");
    const via = t.id === "L5" ? "shortcut" : "start";
    const r = M.launchApp(clone(m), t.app, via);
    if (r.kind !== D.SHOWS[t.id]) F("EXHIBITED " + t.id + ": " + t.app + " shows '" + r.kind + "', the ticket needs '" + D.SHOWS[t.id] + "'");
    if (D.score(t, f) >= 10) F("EXHIBITED " + t.id + ": scored as fixed before any work");

    /* ---- SOLVABLE ---- */
    const g = clone(f); const gm = g[t.machine];
    D.FIX[t.id](gm, createShell(gm, { elevated: true, fleet: (h) => byHost(g, h) }));
    if (!t.goal(g)) F("SOLVABLE " + t.id + ": the known fix does not meet the goal");

    /* ---- SIX: close question and moves ---- */
    const six = (list, what) => {
      if (list.length !== 6) F("SIX " + t.id + " " + what + ": " + list.length + " options, not 6");
      if (list.filter((x) => x.correct).length !== 1) F("SIX " + t.id + " " + what + ": not exactly one right answer");
      list.filter((x) => !x.correct).forEach((x) => { if (!String(x.why || "").trim()) F("SIX " + t.id + " " + what + ": wrong option has no reason: " + x.label); });
      if (new Set(list.map((x) => x.label)).size !== list.length) F("SIX " + t.id + " " + what + ": two options share a label");
    };
    six(t.close.options, "close");
    const mv = t.moves(f); six(mv, "moves");

    /* ---- SPREAD ---- */
    const shown = D.ordered(t.close.options, t.id + "close"); pos[shown.findIndex((x) => x.correct)]++;
    movePos[D.ordered(mv, t.id + "m").findIndex((x) => x.correct)]++;
    const L = t.close.options.map((x) => x.label.length); const cl = t.close.options.find((x) => x.correct).label.length;
    if (new Set(L).size > 1) { lenQs++; if (cl === Math.max(...L) && L.filter((x) => x === cl).length === 1) longest++; }

    /* ---- NO LEAK ---- */
    const right = t.close.options.find((x) => x.correct).label.toLowerCase();
    const rightMove = mv.find((x) => x.correct).label.toLowerCase();
    [f, g].forEach((state) => {
      const h = t.hints(state);
      if (!h || h.length < 2) { F("NO LEAK " + t.id + ": hints must give rung 1 and rung 2"); return; }
      h.forEach((line, i) => {
        const s = String(line).toLowerCase();
        if (right.length > 6 && s.indexOf(right) >= 0) F("NO LEAK " + t.id + ": rung " + (i + 1) + " contains the close answer");
        if (s.indexOf(rightMove) >= 0) F("NO LEAK " + t.id + ": rung " + (i + 1) + " contains the right move");
        D.ANSWER_WORDS.forEach((re) => { if (re.test(line)) F("NO LEAK " + t.id + ": rung " + (i + 1) + " names the fix (" + re + ")"); });
      });
    });

    /* ---- NOTE ---- */
    if (!D.noteOK(t, D.NOTES[t.id]).ok) F("NOTE " + t.id + ": the model note is refused: " + D.noteOK(t, D.NOTES[t.id]).missing.join("; "));
    if (D.noteOK(t, "Fixed it.").ok) F("NOTE " + t.id + ": a two-word note is accepted");
    if (D.noteOK(t, "I looked at the computer for a while and then it was working again, so I closed it.").ok) F("NOTE " + t.id + ": a note that says nothing specific is accepted");
  });
  MAL.forEach((t) => {
    const shown = D.ordered(t.close.options, t.id + "close"); pos[shown.findIndex((x) => x.correct)]++;
    const L = t.close.options.map((x) => x.label.length); const cl = t.close.options.find((x) => x.correct).label.length;
    if (new Set(L).size > 1) { lenQs++; if (cl === Math.max(...L) && L.filter((x) => x === cl).length === 1) longest++; }
    malware(D, t, F);
  });
  const tellPos = [0, 0, 0, 0, 0, 0]; let tellLong = 0, tells = 0;
  EM.forEach((t) => {
    const shown = D.ordered(t.close.options, t.id + "close"); pos[shown.findIndex((x) => x.correct)]++;
    const L = t.close.options.map((x) => x.label.length); const cl = t.close.options.find((x) => x.correct).label.length;
    if (new Set(L).size > 1) { lenQs++; if (cl === Math.max(...L) && L.filter((x) => x === cl).length === 1) longest++; }
    t.mails.forEach((e) => { tells++; tellPos[D.ordered(e.tell.options, t.id + e.id).findIndex((x) => x.correct)]++; const ll = e.tell.options.map((x) => x.label.length), rl = e.tell.options[0].label.length; if (rl === Math.max(...ll)) tellLong++; });
    mailChecks(D, t, F);
  });
  if (tells && Math.max(...tellPos) > Math.ceil(tells / 3)) F("MAIL: SPREAD: the right giveaway sits in one slot " + Math.max(...tellPos) + " times of " + tells + " (" + tellPos.join(" ") + ")");
  if (tells && tellLong > Math.ceil(tells / 3)) F("MAIL: SPREAD: the right giveaway is the longest option in " + tellLong + " of " + tells + " emails");
  if (Math.max(...pos) > Math.ceil(T.length / 3)) F("SPREAD: the right close answer sits in one slot " + Math.max(...pos) + " times of " + T.length + " (" + pos.join(" ") + ")");
  if (Math.max(...movePos) > 4) F("SPREAD: the right move sits in one slot " + Math.max(...movePos) + " times of 12 (" + movePos.join(" ") + ")");
  if (longest > Math.ceil(lenQs / 3)) F("SPREAD: the right close answer is the longest option in " + longest + " of " + lenQs + " questions");

  /* ---- LADDER ---- */
  const want = [0, 0, 0, 1, 2, 3, 3, 3, 3, 3];
  want.forEach((w, n) => { if (D.rungFor(n) !== w) F("LADDER: guess " + n + " gives rung " + D.rungFor(n) + ", should be " + w); });
  APP.forEach((t) => {
    const E = D.createEngine(memStore()); E.openTicket(t.id);
    E.T().guesses = 7; const g = E.guidance();
    if (g.rung !== 3 || !g.moves) { F("LADDER " + t.id + ": seven guesses did not give rung 3 moves"); return; }
    const alive = g.moves.filter((x) => !x.struck);
    if (alive.length !== 2) F("LADDER " + t.id + ": rung 3 leaves " + alive.length + " moves alive, not 2");
    if (!alive.some((x) => x.correct)) F("LADDER " + t.id + ": rung 3 strikes the right move");
    g.moves.filter((x) => x.struck).forEach((x) => { if (!x.why) F("LADDER " + t.id + ": a struck move has no reason"); });
    if (JSON.stringify(g).toLowerCase().indexOf("the answer is") >= 0) F("LADDER " + t.id + ": a rung says 'the answer is'");
    /* the close form's rung 3, after the student has ruled four out themselves */
    const g2 = D.createEngine(memStore()); g2.openTicket(t.id); const st = g2.T();
    const sol = g2.fleet(); D.FIX[t.id](sol[t.machine], createShell(sol[t.machine], { elevated: true, fleet: (h) => byHost(sol, h) }));
    if (!g2.submit(t.outcome).ok) { F("LADDER " + t.id + ": submit refused after the known fix"); return; }
    t.close.options.filter((x) => !x.correct).slice(0, 4).forEach((x) => g2.pick(x.label));
    const gc = g2.guidance();
    if (gc.rung !== 2) F("LADDER " + t.id + ": four wrong picks give rung " + gc.rung + ", should be 2");
    t.close.options.filter((x) => !x.correct).slice(4).forEach((x) => g2.pick(x.label));
    const g5 = g2.guidance(); const struck = Object.keys(g5.strike || {});
    if (g5.rung !== 3 || struck.length !== 4) F("LADDER " + t.id + ": five wrong picks did not strike four");
    if (struck.some((l) => t.close.options.find((x) => x.label === l).correct)) F("LADDER " + t.id + ": the close hint strikes the right answer");
    if (Object.keys(st.picked).length !== 5) F("LADDER " + t.id + ": wrong picks did not all stay marked (red stays red)");
  });

  /* ---- JUDGE ---- */
  const E = D.createEngine(memStore()); E.openTicket("D1");
  const f = E.fleet(), m = f.WS1; const sh = createShell(m, { elevated: true, fleet: E.lookup });
  const run = (line) => { const b = E.before(); const res = sh.run(line); E.onAct({ type: "cmd", line, res, elevated: true, before: b }); return E.T().guesses; };
  let n = E.T().guesses;
  ["dir", "tasklist", "help", "copy /?", "xyzzy", "echo %PATH%", "ipconfig", "hostname"].forEach((c) => { if (run(c) !== n) F("JUDGE: '" + c + "' counted as a guess"); });
  E.onAct({ type: "launch", app: "Testing", res: M.launchApp(m, "Testing") }); if (E.T().guesses !== n) F("JUDGE: running the program to test it counted as a guess");
  E.onAct({ type: "view-log", log: "Application" }); if (E.T().guesses !== n) F("JUDGE: reading Event Viewer counted as a guess");
  n = run('robocopy \\\\WS4-FIN\\C$\\Windows\\System32 "C:\\Program Files (x86)\\Testing" msvcp100.dll');
  if (n !== 1) F("JUDGE: the sim's old answer (robocopy from System32) did not count");
  if (M.launchApp(clone(m), "Testing").kind !== "bitness") F("JUDGE: the old answer did not give 0xc000007b");
  n = run("regsvr32 msvcp100.dll"); if (n !== 2) F("JUDGE: regsvr32 did not count");
  { const keep = E.T().guesses; E.T().guesses = 7; const gt = E.guidance();
    (gt.moves || []).filter((x) => /^(robocopy|regsvr32)/i.test(x.label)).forEach((x) => { if (!x.struck) F("LADDER: rung 3 leaves alive a move the student already tried and saw fail: " + x.label); });
    E.T().guesses = keep; }
  n = run('del "C:\\Program Files (x86)\\Testing\\msvcp100.dll"'); if (n !== 2) F("JUDGE: deleting the file you just put there counted as a guess");
  n = run('copy \\\\WS4-FIN\\C$\\Windows\\SysWOW64\\msvcp100.dll "C:\\Program Files (x86)\\Testing"');
  if (n !== 2) F("JUDGE: copying the right (32-bit) file counted as a guess — it is progress");
  const E2 = D.createEngine(memStore()); E2.openTicket("L1");
  const sh2 = createShell(E2.fleet().WS4, { elevated: false, fleet: E2.lookup }); const b2 = E2.before();
  const res2 = sh2.run('copy \\\\WS1-HR\\C$\\Windows\\SysWOW64\\msvcp100.dll "C:\\Program Files (x86)\\Testing"');
  E2.onAct({ type: "cmd", line: "copy", res: res2, before: b2 });
  if (res2.kind !== "refused" || E2.T().guesses !== 1) F("JUDGE: a refused copy (Access is denied) did not count");
  E2.onAct({ type: "catalogue-admin", key: "vc2010x86", before: E2.before() }); if (E2.T().guesses !== 2) F("JUDGE: a Tier 2 action on a Tier 1 ticket did not count");
  const r2 = E2.submit("resolve"); if (r2.ok || E2.T().guesses !== 3) F("JUDGE: resolving while still broken did not count, or was accepted");

  /* ---- SNAPSHOT ---- */
  const store = memStore(); const E3 = D.createEngine(store); E3.openTicket("D5");
  const k0 = JSON.stringify(E3.fleet().WS2.fs);
  const sh3 = createShell(E3.fleet().WS2, { elevated: true, fleet: E3.lookup }); const b3 = E3.before();
  E3.onAct({ type: "cmd", line: "del", res: sh3.run('del "C:\\Windows\\SysWOW64\\msvcp100.dll"'), before: b3 });
  const g3 = E3.T().guesses; if (g3 !== 1) F("SNAPSHOT: deleting a system runtime on D5 did not count");
  E3.revert();
  if (JSON.stringify(E3.fleet().WS2.fs) !== k0) F("SNAPSHOT: revert did not put the machine back");
  if (E3.T().guesses !== g3) F("SNAPSHOT: revert reset the hint count (it must carry on)");
  const E4 = D.createEngine(store);
  if (!E4.ticket() || E4.ticket().id !== "D5" || E4.T().guesses !== g3) F("SNAPSHOT: the session did not survive a reload");

  return fails;
}

/* ------------------------------------------------------------------ */
/* Malware tickets                                                     */
/* ------------------------------------------------------------------ */
const ALL7 = ["WS1", "WS2", "WS3", "WS4", "WS5", "FS01", "MAIL01"];
/* CompTIA's steps, done the way a student would, each through the engine
   so it is judged. Returns the guesses it cost (should be none). */
export function cleanUp(E, how) {
  how = how || {};
  const act = (a, fn) => { const b = E.before(); const r = fn(); E.onAct(Object.assign({ before: b, res: r }, a)); return r; };
  const f = () => E.fleet();
  ALL7.forEach((id) => { const m = f()[id]; M.note(m, "opened", { app: "taskmgr" }); E.onAct({ type: "open", app: "taskmgr", machine: id }); M.note(m, "view-log", { log: "System" }); E.onAct({ type: "view-log", machine: id }); });
  const hit = ALL7.filter((id) => MW.infected(f()[id]));
  hit.forEach((id) => { if (!how.noQuarantine) act({ type: "cable", op: "off", machine: id }, () => MW.setCable(f()[id], false)); });
  hit.forEach((id) => {
    const m = () => f()[id];
    if (!MW.server(m()) && !how.keepRestore) act({ type: "restore", op: "off", machine: id }, () => MW.setRestore(m(), false));
    MW.insertUSB(m()); act({ type: "av", op: "defs", how: "usb", machine: id }, () => MW.updateDefs(m(), "usb"));
    act({ type: "av", op: "scan", kind: "offline", machine: id }, () => MW.offlineScan(m()));
    act({ type: "av", op: "schedule", machine: id }, () => MW.setSchedule(m(), true));
    act({ type: "cable", op: "on", machine: id }, () => MW.setCable(m(), true));
    act({ type: "updates", machine: id }, () => MW.runUpdates(m()));
    if (!MW.server(m())) { act({ type: "restore", op: "on", machine: id }, () => MW.setRestore(m(), true)); act({ type: "restore", op: "point", machine: id }, () => MW.createPoint(m(), "After malware removal")); }
  });
  return E.T().guesses;
}
function malware(D, t, F) {
  const id = t.id;
  /* EXHIBITED: the infection is where the ticket says, and nowhere else */
  const f = D.makeFleet(); t.setup(f);
  const hit = ALL7.filter((x) => MW.infected(f[x]));
  if (!hit.length) { F("MALWARE " + id + ": EXHIBITED: no PC is infected after setup"); return; }
  if (hit.indexOf(t.machine) < 0) F("MALWARE " + id + ": EXHIBITED: the ticket's own PC " + t.machine + " is not infected");
  if (hit.slice().sort().join() !== (t.infects || []).slice().sort().join()) F("MALWARE " + id + ": EXHIBITED: infected after setup: " + hit.join(", ") + "; the ticket says " + (t.infects || []).join(", "));
  hit.forEach((x) => {
    const m = f[x], w = m.malware;
    const top = m.procs.slice().sort((a, b) => b.cpu - a.cpu)[0];
    if (!top || top.tag !== "malware") F("MALWARE " + id + ": EXHIBITED: on " + x + " the malware does not top the CPU column");
    if (!M.findFile(m, w.dir, w.file)) F("MALWARE " + id + ": EXHIBITED: the file " + w.file + " is not on " + x + "'s disk");
    const logs = [].concat(m.logs.System || [], m.logs.Application || []);
    if (!logs.some((e) => e.id === 7045 || /New Service|service was installed/i.test(e.text))) F("MALWARE " + id + ": EXHIBITED: no service-installed clue in " + x + "'s logs");
  });
  if (t.goal(f)) F("MALWARE " + id + ": EXHIBITED: the goal is met before the student starts");
  /* SOLVABLE: CompTIA's order, no wrong moves */
  { const E = D.createEngine(memStore()); E.openTicket(id); const g = cleanUp(E);
    if (g) F("MALWARE " + id + ": SOLVABLE: CompTIA's steps in order cost " + g + " guess(es): " + E.T().says.filter(Boolean).join(" | "));
    if (!t.goal(E.fleet())) F("MALWARE " + id + ": SOLVABLE: CompTIA's steps in order do not meet the goal (" + JSON.stringify(nextStep(t, E.fleet())) + ")");
    if (!E.submit("resolve").ok) F("MALWARE " + id + ": SOLVABLE: Resolve refused after the clean-up");
  }
  /* ORDER: skipping a step is not allowed to pass for free */
  { const E = D.createEngine(memStore()); E.openTicket(id); cleanUp(E, { noQuarantine: true });
    if (!E.T().guesses) F("MALWARE " + id + ": ORDER: removing it without quarantine cost nothing");
    if (t.goal(E.fleet())) F("MALWARE " + id + ": ORDER: the goal is met without quarantine"); }
  if (hit.some((x) => !MW.server(f[x]))) { const E = D.createEngine(memStore()); E.openTicket(id); cleanUp(E, { keepRestore: true });
    if (!E.T().guesses) F("MALWARE " + id + ": ORDER: removing it with System Restore still on cost nothing"); }
  /* JUDGE: the consequences */
  { const E = D.createEngine(memStore()); E.openTicket(id); const fl = () => E.fleet(); const g0 = E.T().guesses;
    ["taskmgr", "eventvwr", "edge"].forEach((a) => E.onAct({ type: "open", app: a, machine: t.machine })); E.onAct({ type: "view-log", machine: t.machine }); E.onAct({ type: "view-history", machine: t.machine });
    if (E.T().guesses !== g0) F("MALWARE " + id + ": JUDGE: looking (Task Manager, Event Viewer, history) counted");
    const m = fl()[t.machine], p = m.procs.find((x) => x.tag === "malware"); const b = E.before(); const r = M.endProcess(m, p.pid); r.respawned = !!MW.afterEnd(m, p);
    E.onAct({ type: "tm-end", machine: t.machine, pid: p.pid, name: p.name, res: r, before: b });
    if (E.T().guesses !== g0 + 1) F("MALWARE " + id + ": JUDGE: ending the malware while online did not count");
    if (!r.respawned || !fl()[t.machine].procs.some((x) => x.tag === "malware")) F("MALWARE " + id + ": JUDGE: the malware did not restart after being ended");
    if (t.spreadTo && !MW.infected(fl()[t.spreadTo])) F("MALWARE " + id + ": JUDGE: ending it online did not spread it to " + t.spreadTo);
    E.revert();
    const clean = ALL7.find((x) => !MW.infected(fl()[x])); const b2 = E.before(); MW.setCable(fl()[clean], false); E.onAct({ type: "cable", op: "off", machine: clean, before: b2 });
    if (E.T().guesses !== g0 + 2) F("MALWARE " + id + ": JUDGE: unplugging a clean PC (" + clean + ") did not count");
    MW.setCable(fl()[clean], true);
    const b3 = E.before(); const r3 = MW.scan(fl()[t.machine], "quick"); E.onAct({ type: "av", op: "scan", kind: "quick", res: r3, machine: t.machine, before: b3 });
    if (!r3.missed || E.T().guesses !== g0 + 3) F("MALWARE " + id + ": JUDGE: a scan with month-old definitions did not miss, or did not count");
    if (!MW.server(fl()[t.machine])) { const b4 = E.before(); const r4 = MW.createPoint(fl()[t.machine], "x"); E.onAct({ type: "restore", op: "point", res: r4, machine: t.machine, before: b4 });
      if (E.T().guesses !== g0 + 4) F("MALWARE " + id + ": JUDGE: a restore point while infected did not count"); }
    /* typed quarantine is quarantine */
    const sh = createShell(fl()[t.machine], { elevated: true }); const b5 = E.before(); const n5 = E.T().guesses;
    const r5 = sh.run('netsh interface set interface "Ethernet" disable'); E.onAct({ type: "cmd", line: "netsh", res: r5, machine: t.machine, before: b5 });
    if (E.T().guesses !== n5 || MW.online(fl()[t.machine])) F("MALWARE " + id + ": JUDGE: netsh disabling the infected PC's adapter counted, or did not take it offline");
  }
  /* SIX and NO LEAK at every step of the clean-up */
  { const E = D.createEngine(memStore()); E.openTicket(id);
    const seen = {};
    const look = () => { const n = nextStep(t, E.fleet()); const k = n.step + ":" + (n.id || ""); if (seen[k]) return; seen[k] = 1;
      const mv = t.moves(E.fleet());
      if (mv.length !== 6) F("MALWARE " + id + ": SIX: step " + k + " has " + mv.length + " moves");
      if (mv.filter((x) => x.correct).length !== 1) F("MALWARE " + id + ": SIX: step " + k + " has not exactly one right move");
      if (new Set(mv.map((x) => x.label)).size !== mv.length) F("MALWARE " + id + ": SIX: step " + k + " repeats a move");
      mv.filter((x) => !x.correct).forEach((x) => { if (!x.why) F("MALWARE " + id + ": SIX: step " + k + " wrong move has no reason: " + x.label); });
      const right = mv.find((x) => x.correct); const h = t.hints(E.fleet());
      h.forEach((line, i) => { if (right && String(line).toLowerCase().indexOf(right.label.toLowerCase()) >= 0) F("MALWARE " + id + ": NO LEAK: step " + k + " rung " + (i + 1) + " contains the right move"); });
      E.T().guesses = 7; const g = E.guidance(); E.T().guesses = 0;
      const alive = (g.moves || []).filter((x) => !x.struck);
      if (alive.length !== 2 || !alive.some((x) => x.correct)) F("MALWARE " + id + ": LADDER: step " + k + " rung 3 does not leave two alive with the right one");
    };
    const o = E.onAct; E.onAct = (a) => { o(a); look(); };
    look(); cleanUp(E);
    if (Object.keys(seen).length < 6) F("MALWARE " + id + ": SIX: the clean-up passed through only " + Object.keys(seen).length + " steps");
  }
  /* SIX on the close question, NOTE */
  const six = t.close.options;
  if (six.length !== 6 || six.filter((x) => x.correct).length !== 1 || six.some((x) => !x.correct && !x.why)) F("MALWARE " + id + ": SIX: the close question is not six with one right and a reason on each wrong one");
  if (!D.noteOK(t, D.NOTES[id] || "").ok) F("MALWARE " + id + ": NOTE: the model note is refused: " + D.noteOK(t, D.NOTES[id] || "").missing.join("; "));
  if (D.noteOK(t, "I removed the virus from the computer and it is working fine now, all good.").ok) F("MALWARE " + id + ": NOTE: a note that says nothing specific is accepted");
}

/* ------------------------------------------------------------------ */
/* Email tickets                                                       */
/* ------------------------------------------------------------------ */
/* The right handling of every email, each step through the engine. */
export function mailSolve(E, t, how) {
  how = how || {};
  const f = () => E.fleet(); const act = (a, fn) => { const b = E.before(); const r = fn ? fn() : null; E.onAct(Object.assign({ before: b, machine: "TECH" }, a)); return r; };
  for (const e of t.mails) {
    for (const which of ["cat", "tell"]) { const o = t.question(e.id, which).options.find((x) => x.correct); act({ type: "mail-answer", id: e.id, which, correct: true }, () => t.answer(f(), e.id, which, o.label)); }
    const mid = e.noForward ? e.to : "TECH";
    if (e.noForward) act({ type: "mail-headers", id: e.id }, () => MX.viewHeaders(f(), e.to, e.id));
    if (e.cat === "legit") act({ type: "mail-safe", id: e.id }, () => MX.safeReply(f(), e.id));
    else if (e.cat === "spam") act({ type: "mail-report", kind: "junk", id: e.id }, () => MX.report(f(), mid, e.id, "junk"));
    else {
      act({ type: "mail-report", kind: "phishing", id: e.id }, () => MX.report(f(), mid, e.id, "phishing"));
      act({ type: "mail-purge", id: e.id }, () => MX.purge(f(), e.id));
      if (e.cat === "malicious") { const d = MX.domainOf(e.from[1]); act({ type: "mail-block", entry: d }, () => MX.block(f(), d)); }
      if (e.noForward && !how.noGuard) act({ type: "mail-policy", key: e.guard, on: true }, () => MX.setPolicy(f(), e.guard, true));
      if (e.noForward && e.blockDom) act({ type: "mail-block", entry: e.blockDom }, () => MX.block(f(), e.blockDom));
    }
  }
}
function mailChecks(D, t, F) {
  const id = t.id, P = "MAIL " + id + ": ";
  /* EXHIBITED */
  const f = D.makeFleet(); t.setup(f);
  t.mails.forEach((e) => {
    if (!(f[e.to].mail || []).some((x) => x.id === e.id && !x.fwd)) F(P + "EXHIBITED: \"" + e.subject + "\" is not in " + e.to + "'s mailbox");
    const fw = (f.TECH.mail || []).some((x) => x.id === e.id && x.fwd);
    if (e.noForward && fw) F(P + "EXHIBITED: \"" + e.subject + "\" can't be forwarded, but its forward is in the help desk mailbox");
    if (!e.noForward && !fw) F(P + "EXHIBITED: \"" + e.subject + "\" was not forwarded to the help desk");
  });
  if (t.goal(f)) F(P + "EXHIBITED: the goal is met before the student starts");
  /* SOLVABLE */
  { const E = D.createEngine(memStore()); E.openTicket(id); mailSolve(E, t);
    if (!t.goal(E.fleet())) F(P + "SOLVABLE: the right handling does not meet the goal (" + (t.current(E.fleet()) || {}).id + ")");
    if (E.T().guesses) F(P + "SOLVABLE: the right handling cost " + E.T().guesses + " wrong move(s): " + E.T().says.filter(Boolean).join(" | "));
    if (!E.submit("resolve").ok) F(P + "SOLVABLE: Resolve refused after the right handling"); }
  /* SAFEGUARD: an email that can't be forwarded isn't done without its policy */
  if (t.mails.some((e) => e.noForward)) { const E = D.createEngine(memStore()); E.openTicket(id); mailSolve(E, t, { noGuard: true });
    if (t.goal(E.fleet())) F(P + "SAFEGUARD: the ticket closes without the safeguard policy"); }
  /* JUDGE: consequences */
  { const E = D.createEngine(memStore()); E.openTicket(id); const fl = () => E.fleet(); let n = 0;
    const act = (a, fn) => { const b = E.before(); if (fn) fn(); E.onAct(Object.assign({ before: b, machine: "TECH" }, a)); return E.T().guesses; };
    if (act({ type: "mail-headers", id: t.mails[0].id }, () => MX.viewHeaders(fl(), t.mails[0].to, t.mails[0].id)) !== 0) F(P + "JUDGE: reading message details counted");
    const ph = t.mails.find((e) => e.cat === "phishing"), lg = t.mails.find((e) => e.cat === "legit");
    if (ph) { n = act({ type: "mail-safe", id: ph.id }, () => MX.safeReply(fl(), ph.id)); if (n !== 1 || !MX.tri(fl(), ph.id).compromised) F(P + "JUDGE: calling a phish safe did not count, or did not compromise the user");
      E.revert(); }
    if (lg) { const g0 = E.T().guesses; if (act({ type: "mail-report", kind: "junk", id: lg.id }, () => MX.report(fl(), "TECH", lg.id, "junk")) !== g0 + 1) F(P + "JUDGE: junking a genuine email did not count");
      const d = MX.domainOf(lg.from[1]); if (act({ type: "mail-block", entry: d }, () => MX.block(fl(), d)) !== g0 + 2) F(P + "JUDGE: blocking a genuine sender did not count"); }
    const g1 = E.T().guesses; if (act({ type: "mail-click", id: t.mails[0].id }, () => MX.click(fl(), "TECH", t.mails[0].id, "x")) !== g1 + 1) F(P + "JUDGE: opening a link from a suspicious email did not count");
    const wrongCat = t.question(t.mails[0].id, "cat").options.find((o) => !o.correct);
    const g2 = E.T().guesses; t.answer(fl(), t.mails[0].id, "cat", wrongCat.label); if (act({ type: "mail-answer", id: t.mails[0].id, which: "cat", correct: false, why: wrongCat.why }) !== g2 + 1) F(P + "JUDGE: a wrong category did not count");
    if (MX.tri(fl(), t.mails[0].id).catOut.indexOf(wrongCat.label) < 0) F(P + "JUDGE: a wrong category was not kept red");
    E.T().guesses = 7; const g = E.guidance(); const alive = (g.moves || []).filter((x) => !x.struck);
    if (alive.length !== 2 || !alive.some((x) => x.correct)) F(P + "LADDER: rung 3 does not leave two moves alive with the right one");
    if (!g.qstrike || Object.values(g.qstrike.strike).some((w) => !w)) F(P + "LADDER: rung 3 does not strike the open question with a reason each"); }
  /* SIX and NO LEAK */
  t.mails.forEach((e) => {
    const o = e.tell.options;
    if (o.length !== 6 || o.filter((x) => x.correct).length !== 1 || o.some((x) => !x.correct && !x.why) || new Set(o.map((x) => x.label)).size !== 6) F(P + "SIX: \"" + e.subject + "\": the giveaway is not six, one right, a reason on each wrong one");
    const c = t.question(e.id, "cat").options; if (c.length !== 4 || c.filter((x) => x.correct).length !== 1 || c.some((x) => !x.correct && !x.why)) F(P + "SIX: \"" + e.subject + "\": the category question is not the four, with reasons");
  });
  { const E = D.createEngine(memStore()); E.openTicket(id); const seen = {};
    const look = () => { const e = t.current(E.fleet()); if (!e) return; const right = e.tell.options[0].label.toLowerCase(); t.hints(E.fleet()).forEach((h, i) => { if (String(h).toLowerCase().indexOf(right) >= 0) F(P + "NO LEAK: rung " + (i + 1) + " names the giveaway of \"" + e.subject + "\""); }); seen[e.id] = 1; };
    const o = E.onAct; E.onAct = (a) => { o(a); look(); }; look(); mailSolve(E, t); }
  const six = t.close.options;
  if (six.length !== 6 || six.filter((x) => x.correct).length !== 1 || six.some((x) => !x.correct && !x.why)) F(P + "SIX: the close question is not six with one right");
  if (!D.noteOK(t, D.NOTES[id] || "").ok) F(P + "NOTE: the model note is refused: " + D.noteOK(t, D.NOTES[id] || "").missing.join("; "));
  if (D.noteOK(t, "I looked at all of the emails and handled them the right way, so it's all done now.").ok) F(P + "NOTE: a note that says nothing specific is accepted");
}

const BASE = { TICKETS: TK.TICKETS, score: TK.score, noteOK: TK.noteOK, makeFleet, createEngine, rungFor, ordered, FIX, SHOWS, ANSWER_WORDS, NOTES };
function withTicket(id, over) { return BASE.TICKETS.map((t) => (t.id === id ? Object.assign({}, t, over(t)) : t)); }

/* Each plant is one defect a check exists to catch, and the check it must
   be caught BY (a prefix of the failure). */
const PLANTS = [
  ["SHAPE", "a sixth App Launch variant dropped", () => ({ TICKETS: BASE.TICKETS.filter((t) => t.id !== "L6") })],
  ["EXHIBITED", "D1's setup forgets to remove the runtime", () => ({ TICKETS: withTicket("D1", (t) => ({ setup: (f) => { t.setup(f); f.WS1.runtimes.vc2010x86 = true; M.syncRuntimes(f.WS1); } })) })],
  ["EXHIBITED", "D5 plants a 32-bit copy, so there is no 0xc000007b", () => ({ TICKETS: withTicket("D5", (t) => ({ setup: (f) => { t.setup(f); const d = M.dirOf(f.WS2, "C:\\Program Files (x86)\\Testing"); d.files.forEach((x) => { if (/msvcp100/i.test(x.name)) x.bits = 32; }); } })) })],
  ["SOLVABLE", "D6's fix installs the x86 runtime instead", () => ({ FIX: Object.assign({}, FIX, { D6: (m, sh) => sh.run("\\\\FS01\\Software\\VC_redist.x86.exe") }) })],
  ["SOLVABLE", "D4 answers N to the restart", () => ({ FIX: Object.assign({}, FIX, { D4: (m, sh) => { sh.run("gpupdate /force"); sh.run("N"); } }) })],
  ["SIX", "L2's close question loses an option", () => ({ TICKETS: withTicket("L2", (t) => ({ close: Object.assign({}, t.close, { options: t.close.options.slice(0, 5) }) })) })],
  ["SIX", "a wrong option on D3 has no reason", () => ({ TICKETS: withTicket("D3", (t) => ({ close: Object.assign({}, t.close, { options: t.close.options.map((x, i) => (i === 2 ? Object.assign({}, x, { why: "" }) : x)) }) })) })],
  ["SPREAD", "the options shown in authored order (right answer first)", () => ({ ordered: (o) => o.slice() })],
  ["SPREAD", "every right answer padded to be the longest", () => ({ TICKETS: BASE.TICKETS.map((t) => Object.assign({}, t, { close: Object.assign({}, t.close, { options: t.close.options.map((x) => (x.correct ? Object.assign({}, x, { label: x.label + " — which is what the evidence on this PC shows, taken all together" }) : x)) }) })) })],
  ["NO LEAK", "D1's rung 1 names the installer", () => ({ TICKETS: withTicket("D1", (t) => ({ hints: (f) => ["Run \\\\FS01\\Software\\vcredist_x86_2010.exe from an elevated prompt.", t.hints(f)[1]] })) })],
  ["NO LEAK", "L4's rung 2 states the close answer", () => ({ TICKETS: withTicket("L4", (t) => ({ hints: (f) => [t.hints(f)[0], "The cause: " + t.close.options.find((x) => x.correct).label + "."] })) })],
  ["LADDER", "rung 1 arrives on the second guess", () => ({ rungFor: (n) => (n < 2 ? 0 : Math.min(3, n - 1)) })],
  ["LADDER", "rung 3 strikes the right move", () => ({ createEngine: (s) => { const E = createEngine(s); const g = E.guidance; E.guidance = () => { const x = g(); if (x && x.moves) x.moves = x.moves.map((y) => Object.assign({}, y, { struck: y.correct || y.struck })); return x; }; return E; } })],
  ["LADDER", "rung 3 keeps alive a move already tried", () => ({ createEngine: (s) => { const E = createEngine(s); const g = E.guidance; E.guidance = () => { const x = g(); if (x && x.moves) x.moves = x.moves.map((y) => (/^robocopy/i.test(y.label) ? Object.assign({}, y, { struck: false }) : y)); return x; }; return E; } })],
  ["JUDGE", "typos counted as guesses", () => ({ createEngine: (s) => { const E = createEngine(s); const o = E.onAct; E.onAct = (a) => { o(a); if (a.res && a.res.kind === "error" && E.T()) E.T().guesses++; }; return E; } })],
  ["SNAPSHOT", "revert keeps the broken machine", () => ({ createEngine: (s) => { const E = createEngine(s); E.revert = () => {}; return E; } })],
  ["MALWARE M1: EXHIBITED", "M1's setup forgets the file server", () => ({ TICKETS: withTicket("M1", (t) => ({ setup: (f) => { t.setup(f); f.FS01.malware = null; f.FS01.procs = f.FS01.procs.filter((p) => p.tag !== "malware"); } })) })],
  ["MALWARE M1: SOLVABLE", "M1's goal forgets that a PC must go back online", () => ({ TICKETS: withTicket("M1", (t) => ({ goal: (f) => false })) })],
  ["MALWARE M1: ORDER", "removal before quarantine is not judged", () => ({ createEngine: (s) => { const E = createEngine(s); const o = E.onAct; E.onAct = (a) => { const n = E.T() ? E.T().guesses : 0; o(a); if (a.type === "av" && E.T() && E.T().guesses > n) E.T().guesses = n; }; return E; } })],
  ["MALWARE M1: JUDGE", "the malware stays dead when ended", () => ({ createEngine: (s) => { const E = createEngine(s); const o = E.onAct; E.onAct = (a) => { if (a.type === "tm-end" && a.res) { a.res.respawned = false; const m = E.fleet()[a.machine]; m.procs = m.procs.filter((p) => p.tag !== "malware"); } o(a); }; return E; } })],
  ["MALWARE M1: SIX", "rung 3 at one step offers five moves", () => ({ TICKETS: withTicket("M1", (t) => ({ moves: (f) => t.moves(f).slice(0, nextStep(t, f).step === 3 ? 5 : 6) })) })],
  ["MALWARE M1: NO LEAK", "rung 2 names the move", () => ({ TICKETS: withTicket("M1", (t) => ({ hints: (f) => [t.hints(f)[0], "Do this: " + t.moves(f).find((x) => x.correct).label] })) })],
  ["MAIL E1: EXHIBITED", "E1's emails are never forwarded to the help desk", () => ({ TICKETS: withTicket("E1", (t) => ({ setup: (f) => { t.setup(f); f.TECH.mail = []; } })) })],
  ["MAIL E4: SAFEGUARD", "E4 closes on the categories alone", () => ({ TICKETS: withTicket("E4", (t) => ({ goal: (f) => t.mails.every((e) => MX.tri(f, e.id).cat === e.cat && MX.tri(f, e.id).tell && (e.noForward || t.goal(f) || true)) })) })],
  ["MAIL E2: JUDGE", "calling a phish safe is not judged", () => ({ createEngine: (s) => { const E = createEngine(s); const o = E.onAct; E.onAct = (a) => { const n = E.T() ? E.T().guesses : 0; o(a); if (a.type === "mail-safe" && E.T()) E.T().guesses = n; }; return E; } })],
  ["MAIL E3: SIX", "a giveaway question loses an option", () => ({ TICKETS: withTicket("E3", (t) => ({ mails: t.mails.map((e, i) => (i ? e : Object.assign({}, e, { tell: Object.assign({}, e.tell, { options: e.tell.options.slice(0, 5) }) }))) })) })],
  ["MAIL E5: NO LEAK", "rung 1 names the giveaway", () => ({ TICKETS: withTicket("E5", (t) => ({ hints: (f) => { const e = t.current(f); return [e ? "Look: " + e.tell.options[0].label : "", "x"]; } })) })],
  ["MAIL: SPREAD", "every right giveaway padded to be the longest", () => ({ TICKETS: BASE.TICKETS.map((t) => (t.kind === "email" ? Object.assign({}, t, { mails: t.mails.map((e) => Object.assign({}, e, { tell: Object.assign({}, e.tell, { options: e.tell.options.map((o) => (o.correct ? Object.assign({}, o, { label: o.label + ", and that settles it beyond any doubt at all" }) : o)) }) })) }) : t)) })],
  ["NOTE", "the note check accepts anything forty letters long", () => ({ noteOK: (t, s) => ({ ok: String(s).length >= 40, missing: [] }) })]
];

const plant = process.argv.includes("--plant");
if (!plant) {
  const f = check(BASE);
  f.forEach((x) => console.log("FAIL " + x));
  console.log(f.length ? f.length + " failure(s)" : "PASS — logic: " + BASE.TICKETS.length + " tickets, shape, fault exhibited, solvable, six options, spread, no leak, ladder, judge, snapshot, note");
  process.exit(f.length ? 1 : 0);
} else {
  let bad = 0;
  for (const [by, what, make] of PLANTS) {
    const f = check(Object.assign({}, BASE, make()));
    const caught = f.filter((x) => x.startsWith(by));
    if (caught.length) console.log("caught  [" + by + "] " + what + "  ← " + caught[0]);
    else { bad++; console.log("MISSED  [" + by + "] " + what + (f.length ? "  (only tripped: " + f[0] + ")" : "")); }
  }
  console.log(bad ? bad + " plant(s) missed" : "PASS — all " + PLANTS.length + " plants caught by the check written for them");
  process.exit(bad ? 1 : 0);
}
