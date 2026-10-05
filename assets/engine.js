/* =====================================================================
   The session: the office's machines, the ticket being worked, and what
   the student has done — saved to this browser after every action, so a
   closed tab comes back to exactly the same machines.

   SNAPSHOTS, like a VM's. One is taken when a ticket is opened and
   another each time the ticket's machine moves a step closer to fixed.
   "Revert to snapshot" puts every machine back to the latest one — the
   last point the student got right — and keeps the hint count, so help
   carries on from where it was (the standing reset rule).

   THE HINT LADDER, the standing rule: nothing on guesses 1 and 2; rung 1
   on guess 3; rung 2 on guess 4; rung 3 on guess 5 and every guess after,
   forever. Rung 3 strikes four of six with a reason each and leaves two
   alive. There is no rung that gives the answer.
   ===================================================================== */
import * as M from "./machine.js";
import { makeFleet, byHost } from "./fleet.js";
import { TICKETS, ticketById, score, noteOK } from "./tickets.js";

const KEY = "c2vm.session.v1";
/* The parts of a machine a fix changes. Logs and events are left out:
   they record what happened, and undoing a change does not unwrite them. */
/* Rung 3: four struck with a reason each, two alive. The wrong option
   left alive is one the student has NOT already ruled out (so the rung
   never leaves the answer standing alone), and of those, the one nearest
   the right answer in length — so "pick the longer one" never works. */
function survivor(options, picked) {
  const right = options.filter(function (x) { return x.correct; })[0]; if (!right) return null;
  const pool = options.filter(function (x) { return !x.correct && !picked[x.label]; });
  const from = pool.length ? pool : options.filter(function (x) { return !x.correct; });
  from.sort(function (a, b) { return Math.abs(a.label.length - right.label.length) - Math.abs(b.label.length - right.label.length); });
  return from.length ? from[0].label : null;
}
/* The wrong moves the student has already made on this machine, read
   from what it recorded. Rung 3 never leaves one of those alive: they
   have seen it fail. */
const TRIED = { copy: /^(robocopy|copy)\b/i, regsvr32: /^regsvr32\b/i, setx: /^setx\b/i, sfc: /^run sfc\b/i, gpupdate: /^gpupdate\b/i, "malware-respawned": /^End the malicious process/i };
function tried(m, moves) {
  const out = {}; if (!m) return out;
  (m.events || []).forEach(function (e) { const re = TRIED[e.kind]; if (re) moves.forEach(function (x) { if (!x.correct && re.test(x.label)) out[x.label] = true; }); });
  return out;
}
function keyOf(m) { return m ? JSON.stringify([m.fs, m.runtimes, m.env, m.apps, m.gpoPending || null]) : null; }
export function rungFor(n) { return n < 3 ? 0 : Math.min(3, n - 2); }

export function createEngine(storage) {
  storage = storage || safeStorage();
  let S = load() || fresh();
  const listeners = [];

  function fresh() { return { fleet: makeFleet(), current: null, tickets: {}, snap: null }; }
  function load() { try { const s = JSON.parse(storage.getItem(KEY)); return s && s.fleet ? s : null; } catch (e) { return null; } }
  function save() { try { storage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private window: fine */ } }
  function emit(ev) { listeners.forEach(function (f) { try { f(ev); } catch (e) {} }); }

  function T() { return S.current ? S.tickets[S.current] : null; }
  function ticket() { return S.current ? ticketById(S.current) : null; }

  function openTicket(id) {
    const t = ticketById(id); if (!t) return;
    /* Each ticket starts from a clean office with only its own fault in
       it — the VM snapshot it was built from. */
    S.fleet = makeFleet(); t.setup(S.fleet);
    const prev = S.tickets[id];
    S.tickets[id] = prev && prev.status !== "closed" ? Object.assign(prev, { stage: "work" }) : { status: "open", stage: "work", guesses: 0, picked: {}, note: "", closeOK: false, says: [] };
    S.current = id; S.snap = M.clone(S.fleet);
    save(); emit({ type: "ticket-open", id: id });
  }

  function before() { const t = ticket(); return { score: t ? score(t, S.fleet) : 0, key: t ? keyOf(S.fleet[t.machine]) : null }; }

  function onAct(a) {
    const t = ticket(), st = T();
    if (t && st && st.stage === "work") {
      const b = a.before || { score: score(t, S.fleet) };
      /* Consequences first (malware ended on a networked PC spreads),
         then the judging, which can then explain what happened. */
      if (t.react) t.react(a, S.fleet);
      let j = t.judge(a, S.fleet, b) || {};
      /* Putting back what you changed yourself is not a guess: the
         machine is where your last snapshot had it. */
      const snapKey = S.snap ? keyOf(S.snap[t.machine]) : null;
      if (j.guess && a.type === "cmd" && b.key && b.key !== snapKey && keyOf(S.fleet[t.machine]) === snapKey)
        j = { guess: false, undo: true };
      /* The clipboard's last word stays until something new is worth
         saying: a guess, an undo, or a step forward. Looking around (or a
         screen reopening) leaves it be. */
      if (j.guess) { st.guesses++; st.says.push(j.say || null); st.lastSay = j.say || "That did not move the ticket on."; }
      else if (j.undo) st.lastSay = "That put back what you had changed: the machine is where your last snapshot had it. It does not count against you.";
      else if (score(t, S.fleet) > b.score || t.goal(S.fleet)) { S.snap = M.clone(S.fleet); st.lastSay = null; }
    }
    save(); emit({ type: "act", act: a });
  }

  /* Resolve or escalate. A ticket only closes when the machine really
     is fixed — or, for a ticket that cannot be fixed at Tier 1, when the
     Tier 1 fix has been tried and the details recorded. */
  function submit(kind) {
    const t = ticket(), st = T(); if (!t || !st || st.stage !== "work") return { ok: false };
    if (kind !== t.outcome) {
      st.guesses++;
      const say = kind === "escalate"
        ? "Tier 2 sends it back: this one can be fixed at Tier 1. Try the Tier 1 fix first."
        : (t.outcome === "escalate" ? t.from.split(",")[0] + " tries it: still broken. The Tier 1 fix has not worked — this needs the next tier." : "");
      st.lastSay = say; save(); emit({ type: "act" }); return { ok: false, say: say };
    }
    const ready = t.goal(S.fleet);
    if (!ready) {
      st.guesses++;
      const nr = t.notReady ? t.notReady(S.fleet) : null;
      st.lastSay = nr || (t.from.split(",")[0] + " tries it: still not working.");
      save(); emit({ type: "act" }); return { ok: false, say: st.lastSay };
    }
    st.stage = "close"; st.lastSay = null; S.snap = M.clone(S.fleet); save(); emit({ type: "stage" }); return { ok: true };
  }

  function pick(label) {
    const t = ticket(), st = T(); if (!t || !st || st.stage !== "close" || st.closeOK) return;
    const o = t.close.options.filter(function (x) { return x.label === label; })[0]; if (!o) return;
    if (o.correct) st.closeOK = true; else { st.picked[label] = true; st.closeGuesses = (st.closeGuesses || 0) + 1; }
    save(); emit({ type: "pick" });
  }
  function writeNote(text) {
    const t = ticket(), st = T(); if (!t || !st || st.stage !== "close" || !st.closeOK) return { ok: false };
    const r = noteOK(t, text); st.note = text;
    if (r.ok) { st.stage = "done"; st.status = "closed"; st.closedAt = Date.now(); }
    else { st.noteTries = (st.noteTries || 0) + 1; st.noteMissing = r.missing; }
    save(); emit({ type: "note" }); return r;
  }
  function revert() {
    if (!S.snap) return;
    S.fleet = M.clone(S.snap);
    const st = T(); if (st) st.lastSay = "Reverted to the last snapshot: the machines are back to the last point you got right. Your hints carry on.";
    save(); emit({ type: "revert" });
  }
  function resetAll() { S = fresh(); save(); emit({ type: "reset" }); }

  function guidance() {
    const t = ticket(), st = T(); if (!t || !st) return null;
    if (st.stage === "work") {
      const r = rungFor(st.guesses); if (!r) return { rung: 0 };
      const h = t.hints(S.fleet);
      const g = { rung: r, where: h[0], principle: r >= 2 ? h[1] : null };
      if (r === 3) g.moves = narrow(t.moves(S.fleet), tried(S.fleet[t.machine], t.moves(S.fleet)));
      /* an email ticket's own questions: rung 3 strikes on the one the
         student is stuck on, as on the close question */
      if (r === 3 && t.strikeNow) g.qstrike = t.strikeNow(S.fleet, survivor);
      return g;
    }
    if (st.stage === "close" && !st.closeOK) {
      const n = st.closeGuesses || 0, r = rungFor(n); if (!r) return { rung: 0 };
      const h = t.hints(S.fleet);
      return { rung: r, where: t.closeWhere || "Go back over what you found on the machine: the message, the Event Viewer entry, and what fixed it.", principle: r >= 2 ? h[1] : null,
        strike: r === 3 ? strikeFor(t.close.options, st.picked) : null };
    }
    return { rung: 0 };
  }
  function narrow(moves, done) {
    const keep = survivor(moves, done || {});
    return moves.map(function (x) { return Object.assign({}, x, { struck: !x.correct && x.label !== keep }); });
  }
  function strikeFor(options, picked) {
    const keep = survivor(options, picked || {}); const out = {};
    options.forEach(function (x) { if (!x.correct && x.label !== keep) out[x.label] = x.why; }); return out;
  }

  return {
    state: function () { return S; },
    fleet: function () { return S.fleet; },
    machine: function (id) { return S.fleet[id]; },
    lookup: function (h) { return byHost(S.fleet, h); },
    ticket: ticket, T: T, openTicket: openTicket, onAct: onAct, before: before,
    submit: submit, pick: pick, writeNote: writeNote, revert: revert, resetAll: resetAll, guidance: guidance,
    save: save, on: function (f) { listeners.push(f); },
    tickets: function () { return TICKETS.map(function (t) { return { t: t, st: S.tickets[t.id] || null }; }); }
  };
}

function safeStorage() {
  try { const k = "__c2probe"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return localStorage; }
  catch (e) { const mem = {}; return { getItem: function (k) { return mem[k] || null; }, setItem: function (k, v) { mem[k] = String(v); }, removeItem: function (k) { delete mem[k]; } }; }
}
