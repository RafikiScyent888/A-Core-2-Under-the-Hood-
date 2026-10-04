/* =====================================================================
   Customer chats (the Help Desk Chat sims): the conversation, as plain
   JSON on TECH-01's record (fleet.TECH.chats), so snapshots and revert
   cover it like everything else. No DOM: chatui.js draws it.

   A chat is a list of items, worked in order:
     reply  the customer writes; the student answers. Each step has a pool
            of nine replies (one right, eight wrong: the sim's own, jokes
            included, and the mistakes technicians really make). Six are
            shown. A wrong pick stays red, the customer reacts in
            character, and their mood drops; the right one lifts it.
     do     the customer waits while the student checks or confirms the
            real thing (the phone, the mail server, the router). It ticks
            off when it's really done.
   (Owner, 1 and 4 October 2026: six shown from nine; chat plus hands-on;
   a mood line; keep the jokes and add realistic mistakes.)

   "Start the chat again" goes back to the first item with a different six
   on each step, and the customer's phone or router as it was at the start.
   The hint count carries on (the standing reset rule).
   ===================================================================== */
export const MOODS = ["Calm", "Impatient", "Frustrated", "Upset"];

function copy(x) { return JSON.parse(JSON.stringify(x)); }
/* a small repeatable shuffle, so the same chat shows the same six until
   it's started again */
function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function shuffle(list, r) { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

export function all(fleet) { const t = fleet.TECH; if (!t.chats) t.chats = {}; return t.chats; }
export function get(fleet, id) { return all(fleet)[id]; }
export function start(fleet, id, mood, keep) { const c = { id: id, step: 0, mood: mood || 0, startMood: mood || 0, out: {}, said: {}, seed: 1, picks: 0, keep: keep ? copy(keep) : null }; all(fleet)[id] = c; return c; }

/* the replies shown on a step: the right one, every one already ruled
   out (red stays red), and wrong ones up to six in all, in a shuffled order */
export function shown(t, c, i) {
  const it = t.chat[i]; if (!it || it.type !== "reply") return [];
  const r = rng(hash(t.id + ":" + i + ":" + c.seed));
  const out = (c.out[i] || []).slice();
  const rest = shuffle(it.wrong.filter(function (w) { return out.indexOf(w.label) < 0; }), r).slice(0, Math.max(0, 5 - out.length));
  const pick = [it.right].concat(it.wrong.filter(function (w) { return out.indexOf(w.label) >= 0; })).concat(rest);
  return shuffle(pick, r);
}
/* the student sends a reply on the current step */
export function reply(fleet, t, label) {
  const c = get(fleet, t.id), it = t.chat[c.step]; if (!it || it.type !== "reply") return null;
  const o = [it.right].concat(it.wrong).filter(function (x) { return x.label === label; })[0]; if (!o) return null;
  c.picks++;
  if (o.correct) { c.mood = Math.max(0, c.mood - 1); if (it.then) it.then(fleet, t); c.step++; advance(fleet, t); }
  else { if (!c.out[c.step]) c.out[c.step] = []; if (c.out[c.step].indexOf(label) < 0) c.out[c.step].push(label); c.mood = Math.min(MOODS.length - 1, c.mood + 1);
    /* it was sent: it stays in the conversation, with how the customer took it */
    (c.said[c.step] = c.said[c.step] || []).push({ label: label, reaction: o.reaction, mood: c.mood }); }
  return o;
}
/* move past every hands-on item that is now done */
export function advance(fleet, t) {
  const c = get(fleet, t.id); if (!c) return;
  while (t.chat[c.step] && t.chat[c.step].type === "do" && t.chat[c.step].done(fleet, t)) c.step++;
}
export function finished(fleet, t) { const c = get(fleet, t.id); return !!c && c.step >= t.chat.length; }
export function current(fleet, t) { const c = get(fleet, t.id); return c ? t.chat[c.step] || null : null; }
/* start again: a new mix, the customer's things put back, mood as it was */
export function restart(fleet, t) {
  const c = get(fleet, t.id); if (!c) return;
  c.step = 0; c.out = {}; c.said = {}; c.seed++; c.mood = c.startMood;
  if (t.restore) t.restore(fleet);
}
/* what's been said so far, for the chat window: every item before the
   current one, then the current one's customer lines */
export function transcript(fleet, t) {
  const c = get(fleet, t.id), lines = [];
  t.chat.forEach(function (it, i) {
    if (i > c.step) return;
    (it.cust || []).forEach(function (x) { lines.push(typeof x === "string" ? { who: "cust", text: x } : Object.assign({ who: "cust" }, x)); });
    if (it.type === "reply") (c.said[i] || []).forEach(function (w) { lines.push({ who: "you", text: w.label, wrong: true }); lines.push({ who: "cust", text: w.reaction, mood: w.mood }); });
    if (it.type === "reply" && i < c.step) { lines.push({ who: "you", text: it.right.label }); if (it.you) lines.push({ who: "you", text: it.you }); }
    if (it.type === "do" && i < c.step && it.after) lines.push({ who: "note", text: it.after });
  });
  if (c.step >= t.chat.length && t.end) t.end.forEach(function (x) { lines.push({ who: "cust", text: x }); });
  return lines;
}
