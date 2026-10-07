/* =====================================================================
   Safety on the spot (Core 2, Operational procedures, "Safety and
   communication: following safety protocols and communicating
   effectively"). Plain JSON on TECH-01's record (fleet.TECH.safety), so
   snapshots and revert cover it like everything else. No DOM:
   safetyui.js draws it, beside the approved 3D models.

   A scene is the job's physical state (s), what the student has done
   (events), and, when a move has made things lastingly worse, what it did
   (poison). The ticket lists the hands-on actions (its acts); each one is
   judged on the state BEFORE it happens:
     look     reading a label, the data sheet, a sensor: never counts
     right    moves the job on
     wrong    counts, with the reason. Some change nothing ("you stop with
              your hand on the thumbscrew"); some leave a lasting hazard
              (water over a PC, a punctured battery, toner melted into the
              carpet), which only a revert to the last snapshot undoes.
   A wrong move in front of the person on the spot worries them too: their
   mood (the conversation in chat.js) drops a step.
   ===================================================================== */
import * as CH from "./chat.js";

function copy(x) { return JSON.parse(JSON.stringify(x)); }
export function all(fleet) { const t = fleet.TECH; if (!t.safety) t.safety = {}; return t.safety; }
export function get(fleet, id) { return all(fleet)[id]; }
export function add(fleet, id, init) { const sc = { id: id, s: copy(init), events: [], poison: null, msg: null }; all(fleet)[id] = sc; return sc; }
export function note(sc, kind, d) { sc.events.push(Object.assign({ kind: kind, at: sc.events.length }, d || {})); }
export function did(sc, id) { return sc.events.filter(function (e) { return e.kind === "act" && e.id === id; }).length; }

/* the actions on offer right now, in the ticket's own order */
export function available(t, sc) { return t.acts.filter(function (a) { return !a.when || a.when(sc.s, sc); }); }
export function find(t, id) { return t.acts.filter(function (a) { return a.id === id; })[0] || null; }

/* do one. A choice (where a plug goes) carries its value. Returns what
   happened, for the engine to judge and the screen to show:
   { id, label, text, wrong, say, poison } */
export function run(fleet, t, id, value) {
  const sc = get(fleet, t.id), a = find(t, id); if (!sc || !a || (a.when && !a.when(sc.s, sc))) return null;
  const s = sc.s;
  /* judged on the state before the action */
  const say = a.wrong ? a.wrong(s, value, sc) : null;
  const harm = a.poison ? a.poison(s, value, sc) : null;
  const text = a.run ? a.run(s, value, sc) : (a.text || "");
  const r = { id: id, label: a.label, value: value == null ? null : value, text: text || "", wrong: !!say, say: say || null, poison: harm || null, look: !!a.look };
  if (harm && !sc.poison) sc.poison = { by: id, text: harm };
  note(sc, "act", { id: id, value: r.value, wrong: r.wrong });
  sc.msg = { text: r.text, bad: r.wrong };
  /* a wrong move in front of the person worries them */
  if (r.wrong) { const c = CH.get(fleet, t.id); if (c) c.mood = Math.min(CH.MOODS.length - 1, c.mood + 1); }
  return r;
}
