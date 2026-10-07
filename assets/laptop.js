/* =====================================================================
   A+ Core2 Under the Hood labs — the work laptop.

   The whole browser window is the student's laptop at Rafiki's IT
   Services. They sign in; everything after that happens in programs on
   it: the Help Desk (one ticket, one page), a remote session to the
   user's PC, and chat with Mason, the team lead, who is where the hints
   come from. The settings live in a tray on the taskbar.

   Underneath it is the same machine model, commands and tickets as
   before (machine.js, cmd.js, tickets.js, engine.js). The PCs reached by
   remote session are drawn by desktop.js.
   ===================================================================== */
import { ROSTER, rosterOf, makeFleet } from "./fleet.js";
import * as M from "./machine.js";
import { createEngine, rungFor } from "./engine.js";
import { createDesktop } from "./desktop.js";
import { TICKETS } from "./tickets.js";
import { ordered } from "./order.js";
import * as MW from "./malware.js";
import { inspected, nextStep } from "./tickets-malware.js";
import * as MX from "./mail.js";
import { drawMail, drawAdmin } from "./mailui.js";
import { drawExam } from "./examui.js";
import { EXAMS } from "./exams.js";
import { drawRouter } from "./routerui.js";
import { drawFloorPlan } from "./floorplan.js";
import { drawStreetView } from "./streetview.js";
import { drawCustomerChat, drawMobile, disposePhone } from "./chatui.js";
import * as PH from "./phone.js";
import * as INS from "./install.js";
import * as MAC from "./mac.js";
import { drawMacScreen, paintMac } from "./macui.js";
import * as NP from "./newphone.js";
import * as FX from "./fsys.js";
import { drawNewPhoneScreen, paintNewPhone } from "./newphoneui.js";
import { drawHandset } from "./phoneui.js";
import * as SF from "./safety.js";
import { drawSafety } from "./safetyui.js";
import * as CH from "./chat.js";
import * as MB from "./mobile.js";
import * as RT from "./router.js";
import { staffOf, emailById, part as mailPart, emailDone, CATS } from "./tickets-mail.js";

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(label, cls, fn, aria) { const b = el("button", cls || "b", label); b.type = "button"; if (aria) b.setAttribute("aria-label", aria); b.addEventListener("click", fn); return b; }
function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

const E = createEngine();
const LKEY = "c2vm.laptop.v1";
let L = (function () { try { return JSON.parse(get(LKEY)) || null; } catch (e) { return null; } })() || { chat: [], said: {}, log: {}, unread: 0, sel: null, notes: {}, met: false };
L.coach = L.coach || {}; L.lines = L.lines || {}; L.calls = L.calls || {}; L.onSite = L.onSite || {};
function saveL() { put(LKEY, JSON.stringify(L)); }
let instructor = false;

const root = document.getElementById("laptop");
const desk = el("div", "desk"); const task = el("div", "task"); const toasts = el("div", "toasts"); toasts.setAttribute("aria-live", "polite");
root.appendChild(desk); root.appendChild(toasts); root.appendChild(task);

/* ---------------------------------------------------------- the clock */
function now() { const d = new Date(); return { time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), date: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }), short: d.toLocaleDateString("en-US") }; }
function stamp() { return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }); }

/* ------------------------------------------------------------ sign-in */
const PASSWORD = "TechStart-2026";
function lockScreen() {
  const lk = el("div", "lock"); lk.setAttribute("role", "dialog"); lk.setAttribute("aria-label", "Sign in to Windows");
  const box = el("div", "lock-box");
  const n = now();
  const c = el("p", "lock-clock", n.time); const d = el("p", "lock-date", n.date);
  const press = btn("Press to sign in", "lock-press", function () { press.remove(); c.remove(); d.remove(); signIn(); });
  box.appendChild(c); box.appendChild(d); box.appendChild(press);
  function signIn() {
    box.appendChild(el("div", "lock-face", "T"));
    box.appendChild(el("p", "lock-name", "Tech")); box.appendChild(el("p", "lock-org", "RAFIKI\\tech · Rafiki's IT Services"));
    const lab = el("label", null, "Password"); const inp = el("input"); inp.type = "password"; inp.id = "lock-pw"; lab.setAttribute("for", "lock-pw"); lab.className = "lock-org";
    const err = el("p", "lock-err"); err.hidden = true; err.setAttribute("role", "alert");
    const go = btn("Sign in", "lk-btn", tryIt);
    function tryIt() { if (inp.value === PASSWORD) { lk.remove(); onSignedIn(); } else { err.hidden = false; err.textContent = "The password is incorrect. Try again."; inp.select(); } }
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); tryIt(); } });
    const note = el("p", "lock-note"); note.appendChild(document.createTextNode("First day? Mason's welcome email gave you your password: ")); note.appendChild(el("strong", null, PASSWORD));
    [lab, inp, err, go, note].forEach(function (x) { box.appendChild(x); });
    setTimeout(function () { inp.focus(); }, 0);
  }
  lk.appendChild(box);
  const foot = el("p", "lock-foot", "Cyber Warrior Program — built by an instructor, for students, to make certification study more interactive. For educational purposes only. Not affiliated with, endorsed by, or sponsored by CompTIA®. All trademarks belong to their respective owners.");
  lk.appendChild(foot);
  root.appendChild(lk);
  setTimeout(function () { press.focus(); }, 0);
}
function onSignedIn() {
  drawDesk(); drawTask();
  if (!L.met) {
    L.met = true;
    mason("Morning, and welcome to Rafiki's! Your queue is in Help Desk. Farah's ticket about Testing is a good first one.", null, true);
    mason("To work on someone's PC, open their ticket and press Connect. If a PC can't be reached remotely, you'll have to walk over to it.", null, true);
    mason("When Windows asks for an admin on a user's PC, use RAFIKI\\itadmin, password Bench-Tech-2026. Don't stick it on your monitor.", null, true);
    mason("I'll check in if you get stuck. Ask me any time.", null, true);
    L.unread = 0; saveL();
    coachTick(); openWin("helpdesk"); return;
  }
  openWin("helpdesk");
}

/* ------------------------------------------------- the window manager */
const W = {}; let Z = 10, front = null;
const APPS = {
  helpdesk: { title: "Help Desk — Rafiki's IT Services", mini: "HD", cls: "g-hd", geo: [0.085, 0.03, 0.60, 0.92], draw: drawHelpdesk },
  chat: { title: "Chat — Mason (Team Lead)", mini: "C", cls: "g-chat", geo: [0.695, 0.03, 0.295, 0.92], draw: drawChat },
  mstsc: { title: "Remote Desktop Connection", mini: "RD", cls: "g-rdp", geo: [0.30, 0.20, 0.36, 0.46], draw: drawMstsc },
  mail: { title: "Mail — helpdesk@rafiki.local", mini: "@", cls: "g-mail", geo: [0.06, 0.04, 0.80, 0.90], draw: drawMailWin },
  mailadmin: { title: "Mail admin — Rafiki's IT Services", mini: "MA", cls: "g-mail", geo: [0.20, 0.05, 0.62, 0.88], draw: drawAdminWin },
  exam: { title: "Exam Practice — the sims, laid out as the exam shows them", mini: "EX", cls: "g-exam", geo: [0.04, 0.02, 0.92, 0.95], draw: drawExamWin },
  router: { title: "92 Series — routers you manage", mini: "92", cls: "g-rt", geo: [0.10, 0.03, 0.72, 0.92], draw: drawRouterWin },
  browser: { title: "Browser — 192.168.1.1", mini: "WB", cls: "g-web", geo: [0.14, 0.04, 0.70, 0.90], draw: drawBrowserWin },
  floor: { title: "Floor plan — Rafiki's office", mini: "FP", cls: "g-fp", geo: [0.05, 0.03, 0.62, 0.93], draw: drawFloorWin },
  street: { title: "Street view — Router 3 and its neighbours", mini: "SV", cls: "g-sv", geo: [0.06, 0.03, 0.66, 0.93], draw: drawStreetWin },
  custchat: { title: "Customer chat — Rafiki's IT Services help desk", mini: "CC", cls: "g-cc", geo: [0.30, 0.03, 0.62, 0.93], draw: drawChatWin },
  mobile: { title: "Mobile devices — company phones", mini: "MD", cls: "g-md", geo: [0.04, 0.03, 0.72, 0.93], draw: drawMobileWin },
  macbench: { title: "Your bench — the Mac", mini: "MC", cls: "g-mac", geo: [0.03, 0.02, 0.80, 0.95], draw: drawMacWin },
  phonebench: { title: "Your bench — the new phone", mini: "NP", cls: "g-np", geo: [0.03, 0.02, 0.80, 0.95], draw: drawPhoneBenchWin },
  safety: { title: "On the spot — a safety job", mini: "OS", cls: "g-sf", geo: [0.03, 0.02, 0.84, 0.95], draw: drawSafetyWin }
};
function appOf(id) { return id.indexOf("rdp:") === 0 ? { title: rosterOf(id.slice(4)).host + " — Remote support", mini: "RS", cls: "g-rdp", geo: [0.08, 0.03, 0.86, 0.92], draw: drawRdp } : APPS[id]; }
function openWin(id) {
  if (W[id]) { W[id].min = false; focusWin(id); return W[id]; }
  const a = appOf(id); const w = { id: id, a: a, min: false, max: desk.clientWidth < 900 };
  const box = el("section", "lw"); box.setAttribute("aria-label", a.title); box.dataset.win = id;
  const bar = el("div", "lw-bar"); const h = el("h2", "lw-title", a.title); bar.appendChild(h);
  bar.appendChild(btn("–", "lw-ctl", function () { w.min = true; place(w); drawTask(); }, "Minimize " + a.title));
  bar.appendChild(btn("□", "lw-ctl", function () { w.max = !w.max; place(w); }, "Maximize " + a.title));
  bar.appendChild(btn("✕", "lw-ctl x", function () { closeWin(id); }, "Close " + a.title));
  const body = el("div", "lw-body");
  box.appendChild(bar); box.appendChild(body); desk.appendChild(box);
  w.el = box; w.body = body; w.bar = bar; w.titleEl = h;
  const r = desk.getBoundingClientRect();
  w.x = Math.round(a.geo[0] * r.width); w.y = Math.round(a.geo[1] * r.height); w.w = Math.round(a.geo[2] * r.width); w.h = Math.round(a.geo[3] * r.height);
  box.addEventListener("pointerdown", function () { if (front !== id) focusWin(id); }, true);
  drag(w);
  W[id] = w; place(w); focusWin(id); a.draw(w);
  drawTask();
  return w;
}
function place(w) {
  w.el.classList.toggle("max", !!w.max); w.el.classList.toggle("min", !!w.min);
  Object.assign(w.el.style, { left: w.x + "px", top: w.y + "px", width: w.w + "px", height: w.h + "px" });
}
/* keep every window on the desk when the desk narrows (Mason's panel
   docking beside it, or the browser window shrinking): a window opened
   before the panel would otherwise sit under it, covering his steps */
function fitWins() {
  const dw = desk.clientWidth; if (!dw) return;
  Object.values(W).forEach(function (w) { if (w.w > dw) w.w = dw; if (w.x + w.w > dw) w.x = Math.max(0, dw - w.w); place(w); });
}
window.addEventListener("resize", fitWins);
function focusWin(id) { const w = W[id]; if (!w) return; w.el.style.zIndex = ++Z; front = id; Object.values(W).forEach(function (x) { x.el.classList.toggle("front", x.id === id); }); drawTask(); }
function closeWin(id) { const w = W[id]; if (!w) return; if (w.onClose) w.onClose(); w.el.remove(); delete W[id]; if (front === id) front = null; drawTask(); }
function drag(w) {
  let start = null;
  w.bar.addEventListener("pointerdown", function (e) { if (e.target.closest("button") || w.max) return; start = [e.clientX, e.clientY, w.x, w.y]; w.bar.setPointerCapture(e.pointerId); });
  w.bar.addEventListener("pointermove", function (e) {
    if (!start) return; const r = desk.getBoundingClientRect();
    w.x = Math.max(-w.w + 120, Math.min(r.width - 120, start[2] + e.clientX - start[0])); w.y = Math.max(0, Math.min(r.height - 38, start[3] + e.clientY - start[1])); place(w);
  });
  w.bar.addEventListener("pointerup", function () { start = null; });
  w.bar.addEventListener("dblclick", function (e) { if (!e.target.closest("button")) { w.max = !w.max; place(w); } });
}
function redraw(id) { const w = W[id]; if (w) w.a.draw(w); }
function refresh() { redraw("helpdesk"); redraw("chat"); redraw("mail"); redraw("mailadmin"); redraw("router"); redraw("browser"); redraw("floor"); redraw("street"); redraw("custchat"); redraw("mobile"); redraw("macbench"); redraw("phonebench"); redraw("safety"); drawTask(); coachTick(); }

/* ------------------------------------------------ desktop and taskbar */
function drawDesk() {
  desk.innerHTML = "";
  const mark = el("div", "wall-mark", "Rafiki's IT Services"); mark.appendChild(el("small", null, "IT Support · Tier 1")); desk.appendChild(mark);
  const ic = el("div", "icons"); ic.setAttribute("aria-label", "Desktop");
  [["helpdesk", "Help Desk", "HD", "g-hd"], ["exam", "Exam Practice", "EX", "g-exam"], ["chat", "Chat", "C", "g-chat"], ["router", "92 Series", "92", "g-rt"], ["browser", "Browser", "WB", "g-web"], ["mstsc", "Remote Desktop", "RD", "g-rdp"]].forEach(function (x) {
    const b = btn("", "dicon", function () { openWin(x[0]); }, "Open " + x[1]);
    b.appendChild(el("span", "glyph " + x[3], x[2])); b.appendChild(el("span", null, x[1])); ic.appendChild(b);
  });
  desk.appendChild(ic);
}
let pop = null;
function drawTask() {
  task.innerHTML = "";
  const mid = el("div", "task-mid");
  /* Windows 11: a cluster of icons in the middle of the taskbar, Start
     first; each name is there for screen readers and as a tooltip */
  const st = btn("", "tb", function () { togglePop("start"); }, "Start"); st.appendChild(el("span", "mini g-hd", "⊞")); st.appendChild(el("span", "tb-name", "Start")); st.title = "Start"; st.setAttribute("aria-expanded", String(pop === "start"));
  mid.appendChild(st);
  const pinned = ["helpdesk", "exam", "chat", "mail", "mailadmin", "router", "browser", "mstsc"];
  const ids = pinned.concat(Object.keys(W).filter(function (k) { return pinned.indexOf(k) < 0; }));
  ids.forEach(function (id) {
    const a = appOf(id); const w = W[id];
    const label = id === "helpdesk" ? "Help Desk" : id === "chat" ? "Chat" : id === "mstsc" ? "Remote Desktop" : id === "mail" ? "Mail" : id === "mailadmin" ? "Mail admin" : id === "exam" ? "Exam Practice" : id === "router" ? "92 Series" : id === "browser" ? "Browser" : id === "floor" ? "Floor plan" : id === "street" ? "Street view" : id === "custchat" ? "Customer chat" : id === "mobile" ? "Mobile devices" : id === "macbench" ? "Your bench: the Mac" : id === "phonebench" ? "Your bench: the new phone" : id === "safety" ? "On the spot" : rosterOf(id.slice(4)).host;
    const b = btn("", "tb" + (w ? " open" : "") + (front === id && w && !w.min ? " front" : ""), function () {
      if (!w) return openWin(id);
      if (front === id && !w.min) { w.min = true; place(w); front = null; drawTask(); } else { w.min = false; place(w); focusWin(id); }
    }, label + (w ? (w.min ? ", minimized" : ", open") : ""));
    b.appendChild(el("span", "mini " + a.cls, a.mini)); b.appendChild(el("span", "tb-name", label)); b.title = label;
    if (id === "chat" && L.unread) { const g = el("span", "badge", String(L.unread)); g.setAttribute("aria-label", L.unread + " unread"); b.appendChild(g); }
    mid.appendChild(b);
  });
  task.appendChild(mid);
  const tray = el("div", "task-tray");
  const set = btn("", "tb", function () { togglePop("tray"); }, "Settings: reading, light or dark, instructor mode"); set.appendChild(el("span", null, "⚙ Settings")); set.setAttribute("aria-expanded", String(pop === "tray"));
  tray.appendChild(set);
  const n = now(); const ck = el("div", "tray-clock"); ck.appendChild(el("div", null, n.time)); ck.appendChild(el("div", null, n.short)); tray.appendChild(ck);
  task.appendChild(tray);
}
function togglePop(kind) {
  const old = root.querySelector(".pop"); if (old) old.remove();
  if (pop === kind) { pop = null; drawTask(); return; }
  pop = kind; const p = el("div", "pop" + (kind === "start" ? " start" : "")); p.setAttribute("role", "dialog");
  if (kind === "start") {
    p.setAttribute("aria-label", "Start"); p.appendChild(el("h2", null, "Pinned"));
    const ul = el("ul", "start-list");
    [["helpdesk", "Help Desk", "HD", "g-hd"], ["chat", "Chat", "C", "g-chat"], ["mstsc", "Remote Desktop Connection", "RD", "g-rdp"]].forEach(function (x) {
      const li = el("li"); const b = btn("", null, function () { togglePop("start"); openWin(x[0]); }, "Open " + x[1]);
      b.appendChild(el("span", "mini " + x[3], x[2])); b.lastChild.style.cssText = "width:30px;height:30px;border-radius:7px;display:grid;place-items:center;color:#fff;font-weight:800";
      b.appendChild(el("span", null, x[1])); li.appendChild(b); ul.appendChild(li);
    });
    p.appendChild(ul);
    const f = el("div", "start-foot"); f.appendChild(el("span", null, "RAFIKI\\tech"));
    f.appendChild(btn("Sign out", "b small", function () { togglePop("start"); Object.keys(W).forEach(closeWin); desk.innerHTML = ""; task.innerHTML = ""; lockScreen(); }));
    p.appendChild(f);
    /* Two presses, because this wipes every ticket and machine back to the
       start (the page cannot use a browser confirm box). */
    const again = btn("Start the lab over", "b small", function () {
      if (again.dataset.armed) { try { localStorage.removeItem("c2vm.session.v1"); localStorage.removeItem(LKEY); } catch (e) {} location.reload(); return; }
      again.dataset.armed = "1"; again.textContent = "Press again: every ticket and PC goes back to the start";
    });
    const f2 = el("div", "start-foot"); f2.appendChild(again); p.appendChild(f2);
  } else {
    p.setAttribute("aria-label", "Settings"); p.appendChild(el("h2", null, "Settings"));
    row(p, "set-dys", "Dyslexia-friendly text", "Wider spacing, shorter lines, no italics. Stays on, on every Cyber Warrior site.", get("c2vm.reading") === "dyslexia", function (on) { put("c2vm.reading", on ? "dyslexia" : "default"); document.documentElement.setAttribute("data-reading", on ? "dyslexia" : "default"); });
    row(p, "set-light", "Light mode", "Dark is the default. Both are checked for contrast. Stays on.", get("c2vm.theme") === "light", function (on) { put("c2vm.theme", on ? "light" : "dark"); document.documentElement.setAttribute("data-theme", on ? "light" : "dark"); });
    const r = el("div", "row"); const ib = btn(instructor ? "Instructor mode: on" : "Instructor mode", "b small", function () { if (instructor) { instructor = false; togglePop("tray"); refresh(); } else askPIN(); });
    ib.setAttribute("aria-pressed", String(instructor)); ib.id = "instructorBtn"; r.appendChild(el("span")); r.appendChild(ib);
    r.appendChild(el("span", "note", "For instructors: shows each ticket's fix and cause. Off again when the page reloads."));
    p.appendChild(r);
  }
  root.appendChild(p); drawTask();
  const first = p.querySelector("button, input"); if (first) first.focus();
}
function row(p, id, label, note, on, set) {
  const r = el("div", "row"); const box = el("input"); box.type = "checkbox"; box.id = id; box.checked = on;
  const l = el("label", null, label); l.setAttribute("for", id); box.addEventListener("change", function () { set(box.checked); });
  r.appendChild(box); r.appendChild(l); r.appendChild(el("span", "note", note)); p.appendChild(r);
}
function askPIN() {
  const p = root.querySelector(".pop"); p.innerHTML = ""; p.appendChild(el("h2", null, "Instructor PIN"));
  p.appendChild(el("p", "note", "This keeps the answers out of a student's way rather than out of their reach."));
  const lab = el("label", null, "PIN"); const inp = el("input", "field"); inp.type = "password"; inp.id = "pin-in"; inp.inputMode = "numeric"; lab.setAttribute("for", "pin-in");
  const err = el("p", "err"); err.hidden = true; err.setAttribute("role", "alert");
  function tryIt() { if (inp.value.trim() === "3693") { instructor = true; pop = "tray"; togglePop("tray"); refresh(); } else { err.hidden = false; err.textContent = "That is not the PIN. Nothing has changed."; inp.select(); } }
  inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); tryIt(); } });
  const r = el("div", "start-foot"); r.appendChild(btn("Unlock", "b pri small", tryIt)); r.appendChild(btn("Cancel", "b small", function () { pop = "tray"; togglePop("tray"); }));
  [lab, inp, err, r].forEach(function (x) { p.appendChild(x); }); inp.focus();
}
document.addEventListener("keydown", function (e) { if (e.key === "Escape" && pop) { pop = pop; togglePop(pop); } });
desk.addEventListener("pointerdown", function () { if (pop) togglePop(pop); });

/* ----------------------------------------------------- notifications */
function toast(who, text, open) {
  toasts.innerHTML = "";
  const t = btn("", "toast", function () { t.remove(); if (open) open(); }); t.appendChild(el("strong", null, who)); t.appendChild(el("span", null, text.length > 140 ? text.slice(0, 137) + "…" : text));
  toasts.appendChild(t); setTimeout(function () { t.remove(); }, 9000);
}

/* ---------------------------------------------------------- Mason */
function mason(text, extra, quiet) {
  L.chat.push(Object.assign({ from: "mason", at: stamp(), text: text }, extra || {}));
  if (quiet) { saveL(); return; }
  /* Seen if the chat window is open and nothing is lying on top of it;
     otherwise Mason's message pops up as a notification too. */
  const open = W.chat && !W.chat.min && Object.values(W).every(function (x) {
    if (x.id === "chat" || x.min || +x.el.style.zIndex < +W.chat.el.style.zIndex) return true;
    const a = x.el.getBoundingClientRect(), c = W.chat.el.getBoundingClientRect();
    return a.right <= c.left || a.left >= c.right || a.bottom <= c.top || a.top >= c.bottom;
  });
  if (!open) { L.unread++; toast("Mason (Team Lead)", text, function () { openWin("chat"); }); }
  saveL(); refresh();
}
function hintFor(g, stage, t) {
  if (stage === "close") {
    if (g.rung === 1) return { text: "Before you pick a cause: " + g.where };
    if (g.rung === 2) return { text: "Think about the principle. " + g.principle };
    return { text: "I've struck four off the cause list on the ticket, each with why. Two are still alive. Which one fits everything you saw?" };
  }
  if (g.rung === 1) return { text: "Quick pointer, from me: " + g.where };
  if (g.rung === 2) return { text: g.where, principle: g.principle };
  return { text: "Let's narrow it down. Here are six things you could do next. Four are out, each with why; two are still alive. You pick one, and you do it yourself.", principle: g.principle, moves: ordered(g.moves, t.id + "m").map(function (x) { return { label: x.label, struck: !!x.struck, why: x.why || "" }; }) };
}
/* After every move: if the student has reached a new rung, or is on rung
   3 and has made another wrong move, Mason checks in. Rung 3 repeats for
   as long as it is needed. Guesses 1 and 2 get nothing. */
function masonCheck() {
  const t = E.ticket(), st = E.T(); if (!t || !st || st.stage === "done") return;
  const g = E.guidance(); if (!g || !g.rung) return;
  const n = st.stage === "work" ? st.guesses : (st.closeGuesses || 0);
  const said = L.said[t.id] = L.said[t.id] || {}; const last = said[st.stage] || { rung: 0, n: 0 };
  if (g.rung > last.rung || (g.rung === 3 && n > last.n)) {
    said[st.stage] = { rung: g.rung, n: n };
    const h = hintFor(g, st.stage, t);
    mason(h.text, { rung: g.rung, ticket: t.id, principle: h.principle || null, moves: h.moves || null });
  }
}
function askMason(q) {
  L.chat.push({ from: "me", at: stamp(), text: q }); saveL();
  const t = E.ticket(), st = E.T();
  setTimeout(function () {
    if (/admin|credential|password/i.test(q)) return mason("On users' PCs: RAFIKI\\itadmin, password Bench-Tech-2026. Type it into the UAC box when Windows asks.");
    if (/reach|connect|remote|pc/i.test(q) && !/stuck/i.test(q)) return mason("Open the ticket in Help Desk and press Connect. The user accepts and you get their screen. If the PC can't be reached, you'll have to walk over.");
    if (!t || !st || st.stage === "done") return mason("Nothing open right now. Pick the next ticket from your queue.");
    const g = E.guidance();
    if (!g || !g.rung) return mason(nextStepAdvice(t, st));
    const h = hintFor(g, st.stage, t); mason(h.text, { rung: g.rung, ticket: t.id, principle: h.principle || null, moves: h.moves || null });
  }, 600);
  refresh();
}
/* Asked for help before any wrong moves: Mason says where the student is
   in the job and which tool comes next. That is how to work, not what the
   answer is; the answer hints still wait for the ladder. */
function nextStepAdvice(t, st) {
  const r = rosterOf(t.machine), who = t.from.split(" ")[0];
  const ev = evs(t.machine);
  if (st.stage === "close" && t.kind !== "backup" && t.kind !== "files" && t.kind !== "install" && t.kind !== "safety") return t.kind === "malware" ? "Every PC is done. Last of CompTIA's steps: what do you tell the user, so it doesn't happen again? Pick it on the ticket." : "You've fixed it. Now pick the cause on the ticket that fits everything you saw: the message, what Windows recorded, and what fixed it.";
  if (t.kind === "email") { const e = t.current(E.fleet()); if (!e) return "Every email is dealt with. Resolve the ticket."; const p = mailPart(E.fleet(), e), who = staffOf(e.to).first;
    return p === "cat" ? (e.noForward ? who + "'s email can't be forwarded, so go and look at it: connect to " + who + "'s PC from Devices, open Mail there, and read the message and its details. Then say what it is on the ticket." : "Open Mail from the taskbar and read " + who + "'s forward: who it's really from, where its links really go (point at them, don't click), and what it wants. Then say what it is on the ticket.")
      : p === "tell" ? "Now the giveaway: which one detail proves it? The address, a link's real destination, an attachment's full name, or (for one that can't be forwarded) the headers."
      : "You know what it is. Now deal with it the way that kind of email is dealt with, in Mail and Mail admin. The card ticks itself off when it's done properly."; }
  if (t.kind === "wifi" && planRouter()) return "Two places to look: the access point at 192.168.1.1 (Status shows who's dropping, and how badly), and the office itself. Mason's message has four clues: the time of day, what's on the other side of the closet wall, the walls, and the neighbours. Walk round to the break room and open the floor plan: it shows the Wi-Fi as it really is right now.";
  if (t.kind === "wifi") { if (!W.browser) return "The access point is on our own network: open 192.168.1.1 in the browser from the ticket, and sign in with the admin password Mason gave you.";
    return "Read Mason's message again: some settings he gives you exactly, some he leaves to you with a reason (the devices, the building, the room, the neighbours). The Status page shows each device and whether it connects, and why not. Remember: type, Save, then restart."; }
  if (t.kind === "chat") { const it = CH.current(E.fleet(), t);
    if (!W.custchat) return "Open the customer chat from " + t.who + "'s ticket and read what they've written, every word: what they say, and what they don't.";
    if (!it) return t.who + " is happy. Resolve the ticket, record why it worked, and write the note.";
    return it.type === "do" ? t.who + " is waiting for you to check something real: " + it.doing : "Read " + t.who + "'s last message again. Where is this conversation up to: opening, finding out, looking, fixing, or confirming? Pick the reply a professional would send at that point."; }
  if (t.kind === "router") { const rr = RT.get(E.fleet(), t.id), who = t.who;
    if (!W.router) return "Open the 92 Series app from " + who + "'s ticket: they've shared their router with us. Read the Status page first: is the internet up, and which devices are on?";
    return "Read the router's Status page word for word, then the page that matches what " + who + " asked about. Remember a router has three versions of its settings: what's typed on the page, what's saved, and what it's running. Anything only someone standing at the router can see, ask " + who + " with the Call panel on the ticket."; }
  if (t.kind === "mobile") {
    if (st.stage === "close") return "The phone's fixed and you've checked it. Now answer " + who + "'s question on the ticket.";
    return W.mobile ? t.adviceWork : t.adviceStart;
  }
  if (t.kind === "install" || t.kind === "mac" || t.kind === "newphone") return st.stage === "close" ? t.closeAdvice : t.advice(E.fleet());
  if (t.kind === "safety") return st.stage === "close" ? t.closeAdvice : t.advice(E.fleet(), onSiteFor(t));
  if (t.kind === "backup" || t.kind === "files") {
    if (st.stage === "close") return t.id === "X1" ? "Farah's file is back and her backup is tested. Now answer her question on the ticket: why wasn't today's rescue a backup?" : "The job's done. Now answer " + who + "'s question on the ticket.";
    if (!W["rdp:" + t.machine] && !ev.length) return t.adviceStart || "Connect to " + r.host + " from the ticket, and look at the file first: open Q3-budget.xlsx in her Documents and see what's in it now.";
    return t.adviceWork || "Two jobs on this ticket, in this order: get her spreadsheet back, then make sure she can never lose more than she said she can afford. Read her message again for the times she gives you, and Mason's note for where backups go.";
  }
  if (t.kind === "malware") return "Work through CompTIA's malware-removal steps, in order, on every PC that needs them: investigate and verify, quarantine, disable System Restore, remediate (update the definitions, then scan and remove), schedule scans and run updates, enable System Restore and create a restore point, educate the user. Where are you in that list? The Devices list on the ticket shows which PCs you've checked.";
  if (!W["rdp:" + t.machine] && !ev.length) return "Start by seeing it for yourself. On the ticket in Help Desk, press Connect to " + r.host + ". When " + who + "'s screen opens, run the program they're having trouble with and read exactly what it says.";
  if (!ev.some(function (e) { return e.kind === "launch"; })) return "You're on " + who + "'s PC. Run the program they're having trouble with, from their desktop or Start (or type its name at a prompt), and read the message word for word. If Windows can't find it at all, that's evidence too.";
  if (!ev.some(function (e) { return e.kind === "view-log"; })) return "You've seen the problem. Now check what Windows recorded: on " + who + "'s PC press Start, type event, and open Event Viewer. Read the Errors and Warnings in both the Application and System logs.";
  if (!st.guesses) return "You've seen the problem and what Windows recorded. Read " + who + "'s ticket again for anything they already tried or noticed. Then try the fix you think fits, the safest one first. If it doesn't work, I'll start narrowing it down with you.";
  return "Keep going: look at what changed after your last move, then try the next most likely fix. Three moves that don't help and I'll start narrowing it down with you.";
}
function drawChat(w) {
  L.unread = 0; saveL();
  const b = w.body; b.innerHTML = "";
  const c = el("div", "chat");
  const people = el("div", "chat-people"); people.setAttribute("aria-label", "Conversations");
  const p = el("div", "person"); p.appendChild(el("span", "av", "M")); p.appendChild(el("strong", null, "Mason")); p.appendChild(el("small", null, "Team Lead · available"));
  people.appendChild(p); c.appendChild(people);
  const main = el("div", "chat-main");
  const log = el("div", "chat-log"); log.setAttribute("role", "log"); log.setAttribute("aria-label", "Chat with Mason");
  L.chat.forEach(function (m) {
    const bub = el("div", "bub" + (m.from === "me" ? " me" : ""));
    bub.appendChild(el("div", "bh", (m.from === "me" ? "You" : "Mason") + " · " + m.at));
    bub.appendChild(el("p", null, m.text));
    if (m.principle) bub.appendChild(el("p", "principle", m.principle));
    if (m.moves) {
      const ul = el("ul", "narrow2");
      m.moves.forEach(function (x) { const li = el("li", x.struck ? "struck" : "alive"); li.appendChild(el("span", "om", x.struck ? "✕ Ruled out" : "● Still alive")); li.appendChild(el("span", "nl", x.label)); if (x.struck) li.appendChild(el("span", null, x.why)); ul.appendChild(li); });
      bub.appendChild(ul);
    }
    log.appendChild(bub);
  });
  main.appendChild(log);
  const quick = el("div", "chat-quick");
  ["I'm stuck", "Where are the admin credentials?", "How do I reach a user's PC?"].forEach(function (q) { quick.appendChild(btn(q, "b small", function () { askMason(q); })); });
  main.appendChild(quick);
  const ty = el("div", "chat-type"); const lab = el("label", null, "Message Mason"); lab.setAttribute("for", "chat-in"); lab.className = "sr";
  const inp = el("input", "field"); inp.id = "chat-in"; inp.placeholder = "Message Mason"; inp.setAttribute("aria-label", "Message Mason");
  inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && inp.value.trim()) { e.preventDefault(); const v = inp.value.trim(); inp.value = ""; askMason(v); } });
  ty.appendChild(inp); ty.appendChild(btn("Send", "b pri", function () { if (inp.value.trim()) { const v = inp.value.trim(); inp.value = ""; askMason(v); } }));
  main.appendChild(ty); c.appendChild(main); b.appendChild(c);
  setTimeout(function () { log.scrollTop = log.scrollHeight; }, 0);
}

/* ----------------------------------------------------- the Help Desk */
const INC = {}; TICKETS.forEach(function (t, i) { INC[t.id] = "INC" + (20410 + i); });
function logT(id, text) { (L.log[id] = L.log[id] || []).push({ at: stamp(), text: text }); saveL(); }
function statusOf(t, st) {
  if (!st) return ["New", ""];
  if (st.status === "closed") return [t.outcome === "escalate" ? "Escalated" : "Resolved", "st-closed"];
  return ["In progress", "st-work"];
}
/* The badge that says which section a ticket belongs to, in words, with
   an icon: never colour alone. */
function badgeText(t) { return t.extra ? "Extra training · " + t.topic : "Exam sim · " + t.sim; }
function icon(kind) {
  const NS = "http://www.w3.org/2000/svg", s = document.createElementNS(NS, "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", "18"); s.setAttribute("height", "18"); s.setAttribute("aria-hidden", "true"); s.setAttribute("focusable", "false"); s.setAttribute("class", "ico");
  /* a clipboard with a tick (the sims); a wrench (real-world jobs) */
  const D = { sim: ["M9 4h6v3H9z", "M7 5H5v16h14V5h-2", "M8.5 13.5l2.5 2.5 4.5-5"], extra: ["M14.7 6.3a4 4 0 0 0-5.4 5.1L4 16.7 7.3 20l5.3-5.3a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.4-.6-.6-2.4z"] };
  D[kind].forEach(function (d) { const p = document.createElementNS(NS, "path"); p.setAttribute("d", d); p.setAttribute("fill", "none"); p.setAttribute("stroke", "currentColor"); p.setAttribute("stroke-width", "2"); p.setAttribute("stroke-linejoin", "round"); p.setAttribute("stroke-linecap", "round"); s.appendChild(p); });
  return s;
}
function badge(t) { const b = el("span", "badge " + (t.extra ? "b-extra" : "b-sim")); b.appendChild(icon(t.extra ? "extra" : "sim")); b.appendChild(el("span", null, badgeText(t))); return b; }
function drawHelpdesk(w) {
  const b = w.body; const keepT = b.querySelector(".hd2-t") ? b.querySelector(".hd2-t").scrollTop : 0; const keepQ = b.querySelector(".hd2-q") ? b.querySelector(".hd2-q").scrollTop : 0;
  b.innerHTML = "";
  const cur = E.ticket(); if (!L.sel) L.sel = cur ? cur.id : TICKETS[0].id;
  const g = el("div", "hd2");
  const q = el("nav", "hd2-q"); q.setAttribute("aria-label", "My queue");
  const qh = el("div", "hd2-qh"); qh.appendChild(el("h2", null, "My queue")); const open = E.tickets().filter(function (x) { return !x.st || x.st.status !== "closed"; }).length; qh.appendChild(el("span", "chip", open + " open")); q.appendChild(qh);
  /* Two headed sections (owner's ruling, 1 October 2026): the exam sims,
     then extra training. Each ticket wears a worded badge with an icon,
     never colour alone. */
  const all = E.tickets(), SEC = [
    { id: "sims", icon: "sim", head: "Exam sims", sub: "from your Core 2 practice sims", list: all.filter(function (x) { return !x.t.extra; }) },
    { id: "extra", icon: "extra", head: "Extra training", sub: "real-world tickets beyond the sims", list: all.filter(function (x) { return x.t.extra; }) }];
  const jump = el("div", "hd2-jump"); jump.setAttribute("aria-label", "Jump to a section");
  SEC.forEach(function (sc) { const jb = btn("", "b small hd2-jb", function () { const h = q.querySelector("#qsec-" + sc.id); if (h) { q.scrollTop = h.offsetTop - qh.offsetHeight - 4; h.focus({ preventScroll: true }); } }, "Jump to " + sc.head + ", " + sc.list.length + " tickets"); jb.appendChild(icon(sc.icon)); jb.appendChild(el("span", null, sc.head + " (" + sc.list.length + ")")); jump.appendChild(jb); });
  q.appendChild(jump);
  SEC.forEach(function (sc) {
    const sh = el("h3", "qsec qsec-" + sc.id); sh.id = "qsec-" + sc.id; sh.tabIndex = -1; sh.appendChild(icon(sc.icon)); const sw = el("span"); sw.appendChild(el("strong", null, sc.head + ": ")); sw.appendChild(el("span", null, sc.sub)); sh.appendChild(sw); q.appendChild(sh);
    sc.list.forEach(function (x) {
      const s = statusOf(x.t, x.st);
      const it = btn("", "qi" + (L.sel === x.t.id ? " sel" : ""), function () { L.sel = x.t.id; saveL(); redraw("helpdesk"); }, INC[x.t.id] + ": " + x.t.title + ", " + badgeText(x.t) + ", " + s[0]);
      it.setAttribute("aria-current", String(L.sel === x.t.id));
      const top = el("span", "qi-top"); top.appendChild(el("span", null, INC[x.t.id])); top.appendChild(el("span", "chip " + s[1], s[0])); top.appendChild(el("span", "chip", "Tier " + x.t.tier)); top.appendChild(el("span", "chip" + (LEVEL[x.t.id] ? " st-work" : ""), LEVEL[x.t.id] === "crawl" ? "Crawl: guided" : LEVEL[x.t.id] === "walk" ? "Walk: checklist" : "Run: on your own"));
      it.appendChild(top); it.appendChild(badge(x.t)); it.appendChild(el("span", "qi-sum", x.t.title)); it.appendChild(el("span", "qi-from", x.t.from));
      q.appendChild(it);
    });
  });
  g.appendChild(q);
  g.appendChild(drawTicket(TICKETS.filter(function (t) { return t.id === L.sel; })[0]));
  b.appendChild(g);
  b.querySelector(".hd2-t").scrollTop = keepT; b.querySelector(".hd2-q").scrollTop = keepQ;
}
function drawTicket(t) {
  const p = el("article", "hd2-t"); p.setAttribute("aria-label", "Ticket " + INC[t.id]);
  const st = E.state().tickets[t.id] || null; const isCur = E.ticket() && E.ticket().id === t.id; const s = statusOf(t, st);
  const r = rosterOf(t.machine); const name = t.from.split(",")[0], first = name.split(" ")[0];
  p.appendChild(el("p", "t-id", INC[t.id] + " · " + (t.extra ? t.domain + ": " + t.objective + ". Not from a sim: a real-world job" : t.base ? "the " + t.sim + " sim" : "based on the " + t.sim + " sim")));
  p.appendChild(badge(t));
  p.appendChild(el("h2", null, t.title));
  const exl = examFor(t); if (exl) { const xb = btn("See this sim the way the exam shows it", "b small", function () { L.examSel = { ex: exl.ex.id, v: exl.v.id }; saveL(); if (W.exam) { redraw("exam"); W.exam.min = false; place(W.exam); focusWin("exam"); } else openWin("exam"); }, "Open Exam Practice at " + exl.ex.sim + (exl.v.base ? ", the sim itself" : ", " + exl.v.title)); xb.classList.add("t-exam"); p.appendChild(xb); }
  const dl = el("dl", "t-grid");
  const mal = t.kind === "malware", em = t.kind === "email", rt = t.kind === "router", wf = t.kind === "wifi", ch = t.kind === "chat", mo = t.kind === "mobile", mc = t.kind === "mac", np = t.kind === "newphone", sf = t.kind === "safety";
  if (sf) { [["Status", s[0]], ["Requester", name], ["Where", t.place.where.charAt(0).toUpperCase() + t.place.where.slice(1)], ["On the spot", t.person + " (" + t.role + ")"], ["Category", t.category], ["Tier", "Tier " + t.tier], ["Assigned to", st ? "You (RAFIKI\\tech)" : "Unassigned"]].forEach(function (kv) { const d = el("div"); d.appendChild(el("dt", null, kv[0])); d.appendChild(el("dd", null, kv[1])); dl.appendChild(d); }); }
  else if (np) { [["Status", s[0]], ["Requester", name], ["Device", "TechCom T7 company phone, new, on your bench"], ["For", "Priya Nair (starts Monday)"], ["Category", t.category], ["Tier", "Tier " + t.tier], ["Assigned to", st ? "You (RAFIKI\\tech)" : "Unassigned"]].forEach(function (kv) { const d = el("div"); d.appendChild(el("dt", null, kv[0])); d.appendChild(el("dd", null, kv[1])); dl.appendChild(d); }); }
  else if (mc) { [["Status", s[0]], ["Requester", name], ["Device", "MacBook, on your bench (13-inch, Apple silicon)"], ["Category", t.category], ["Tier", "Tier " + t.tier], ["Assigned to", st ? "You (RAFIKI\\tech)" : "Unassigned"]].forEach(function (kv) { const d = el("div"); d.appendChild(el("dt", null, kv[0])); d.appendChild(el("dd", null, kv[1])); dl.appendChild(d); }); }
  else if (mo) { [["Status", s[0]], ["Requester", name], ["Department", t.from.split(",")[1] ? t.from.split(",")[1].trim() : ""], ["Device", "Company phone (in Mobile devices, with Remote help)"], ["Category", t.category], ["Tier", "Tier " + t.tier], ["Assigned to", st ? "You (RAFIKI\\tech)" : "Unassigned"]].forEach(function (kv) { const d = el("div"); d.appendChild(el("dt", null, kv[0])); d.appendChild(el("dd", null, kv[1])); dl.appendChild(d); }); }
  else if (ch) { [["Status", s[0]], ["Requester", name], ["Customer", t.site], ["Channel", "Help desk chat"], ["Device", t.channel === "email" ? "Company phone (in Mobile devices)" : "92 Series AX1800 router (shared in the 92 Series app)"], ["Category", t.channel === "email" ? "Communication › Mobile email" : "Communication › Router setup"], ["Tier", "Tier " + t.tier], ["Assigned to", st ? "You (RAFIKI\\tech)" : "Unassigned"]].forEach(function (kv) { const d = el("div"); d.appendChild(el("dt", null, kv[0])); d.appendChild(el("dd", null, kv[1])); dl.appendChild(d); }); }
  else if (wf) { [["Status", s[0]], ["Requester", "Mason (Team Lead)"], ["Device", "92 Series AP600 access point · 192.168.1.1"], ["Location", t.site.replace("Rafiki's IT Services · ", "")], ["Category", "Network › Wireless"], ["Tier", "Tier " + t.tier], ["Assigned to", st ? "You (RAFIKI\\tech)" : "Unassigned"]].forEach(function (kv) { const d = el("div"); d.appendChild(el("dt", null, kv[0])); d.appendChild(el("dd", null, kv[1])); dl.appendChild(d); }); }
  else if (rt) { [["Status", s[0]], ["Requester", name], ["Customer", t.site], ["Device", "92 Series AX1800 router (shared in the 92 Series app)"], ["Location", "Customer site: remote"], ["Category", "Network › Router"], ["Tier", "Tier " + t.tier], ["Assigned to", st ? "You (RAFIKI\\tech)" : "Unassigned"]].forEach(function (kv) { const d = el("div"); d.appendChild(el("dt", null, kv[0])); d.appendChild(el("dd", null, kv[1])); dl.appendChild(d); }); }
  else [["Status", s[0]], ["Requester", name], ["Department", t.from.split(",")[1] ? t.from.split(",")[1].trim() : ""], ["Device", mal ? "Every PC on the network (see Devices)" : em ? "Mail: " + t.mails.length + " emails" + (t.devices.length ? ", one on " + rosterOf(t.devices[0]).host : "") : r.host + " · " + r.ip], ["Location", mal ? "The whole office" : em ? "Help desk mailbox" : r.where], ["Category", t.category || (mal ? "Security › Malware" : em ? "Security › Email threats" : "Software › Application")], ["Tier", "Tier " + t.tier], ["Assigned to", st ? "You (RAFIKI\\tech)" : "Unassigned"]].forEach(function (kv) { const d = el("div"); d.appendChild(el("dt", null, kv[0])); d.appendChild(el("dd", null, kv[1])); dl.appendChild(d); });
  p.appendChild(dl);

  const m = el("section", "t-sec"); m.appendChild(el("h3", null, "Request"));
  const msg = el("div", "msg"); const mh = el("div", "msg-h"); mh.appendChild(el("strong", null, mal || em || rt || wf || ch || mo || sf ? name : name + " (" + r.host + ")")); mh.appendChild(el("span", null, mal || wf || (sf && /^Mason/.test(t.from)) ? "assigned by your team lead" : sf ? "by phone" : ch ? "by chat" : mo ? "by email" : rt ? "by phone" : em ? (t.devices.length ? "by phone" : "help desk mailbox") : "via email")); msg.appendChild(mh);
  t.brief.forEach(function (x) { msg.appendChild(el("p", null, x)); }); m.appendChild(msg); p.appendChild(m);

  const acts = el("div", "t-acts");
  if (!st || st.status === "closed") {
    acts.appendChild(coachTag("assign", btn(st ? "Work it again" : "Assign to me and start", "b pri", function () {
      if (st) E.state().tickets[t.id] = null;
      Object.keys(W).filter(function (k) { return k.indexOf("rdp:") === 0; }).forEach(closeWin);
      E.openTicket(t.id); L.said[t.id] = {}; L.log[t.id] = []; L.coach[t.id] = {}; L.lines[t.id] = []; L.calls[t.id] = []; L.onSite[t.id] = false; logT(t.id, "Assigned to you"); refresh();
    })));
  } else if (!isCur) {
    acts.appendChild(btn("Switch to this ticket", "b pri", function () { Object.keys(W).filter(function (k) { return k.indexOf("rdp:") === 0; }).forEach(closeWin); E.openTicket(t.id); logT(t.id, "Picked back up"); refresh(); }));
  } else if (st.stage === "work" && wf) {
    acts.appendChild(coachTag("open-web", btn("Open 192.168.1.1 in the browser", "b pri", function () { openWin("browser"); })));
    if (planRouter()) { acts.appendChild(coachTag("walk-break", btn("Walk to the break room", "b", function () { walkOver("BREAK"); }))); acts.appendChild(coachTag("open-floor", btn("Open the floor plan", "b", function () { openWin("floor"); }))); }
    acts.appendChild(coachTag("resolve", btn("Resolve", "b", function () { const x = E.submit("resolve"); logT(t.id, x.ok ? "Marked resolved: every device connects as it should" : "Tried to resolve: " + (x.say || "not finished yet")); after(); })));
    acts.appendChild(coachTag("escalate", btn("Escalate to Tier 2", "b", function () { const x = E.submit("escalate"); logT(t.id, x.ok ? "Escalated to Tier 2" : "Tried to escalate: " + (x.say || "")); after(); })));
  } else if (st.stage === "work" && sf) {
    const here = onSiteFor(t);
    if (!here) acts.appendChild(coachTag("sf-go", btn(t.place.go, "b pri", function () { walkOver(t.place.walk, { safety: true }); })));
    acts.appendChild(coachTag("open-safety", btn(t.place.walk ? "Open On the spot" : t.place.go, "b" + (here ? " pri" : ""), function () { openWin("safety"); })));
    acts.appendChild(coachTag("resolve", btn("Resolve", "b", function () { const x = E.submit("resolve"); logT(t.id, x.ok ? "Marked resolved: it's safe, and " + t.who + " is sorted" : "Tried to resolve: " + (x.say || "not finished yet")); after(); })));
    acts.appendChild(coachTag("escalate", btn("Escalate to Tier 2", "b", function () { const x = E.submit("escalate"); logT(t.id, x.ok ? "Escalated to Tier 2" : "Tried to escalate: " + (x.say || "")); after(); })));
  } else if (st.stage === "work" && np) {
    acts.appendChild(coachTag("open-phonebench", btn("Open the phone on your bench", "b pri", function () { openWin("phonebench"); })));
    acts.appendChild(coachTag("resolve", btn("Resolve", "b", function () { const x = E.submit("resolve"); logT(t.id, x.ok ? "Marked resolved: the phone is enrolled, compliant and ready for Priya" : "Tried to resolve: " + (x.say || "not finished yet")); after(); })));
    acts.appendChild(btn("Escalate to Tier 2", "b", function () { const x = E.submit("escalate"); logT(t.id, x.ok ? "Escalated to Tier 2" : "Tried to escalate: " + (x.say || "")); after(); }));
  } else if (st.stage === "work" && mc) {
    acts.appendChild(coachTag("open-mac", btn("Open the Mac on your bench", "b pri", function () { openWin("macbench"); })));
    acts.appendChild(coachTag("resolve", btn("Resolve", "b", function () { const x = E.submit("resolve"); logT(t.id, x.ok ? "Marked resolved: the Mac is ready for its new user" : "Tried to resolve: " + (x.say || "not finished yet")); after(); })));
    acts.appendChild(btn("Escalate to Tier 2", "b", function () { const x = E.submit("escalate"); logT(t.id, x.ok ? "Escalated to Tier 2" : "Tried to escalate: " + (x.say || "")); after(); }));
  } else if (st.stage === "work" && mo) {
    acts.appendChild(coachTag("open-mobile", btn("Open Mobile devices", "b pri", function () { openWin("mobile"); })));
    acts.appendChild(coachTag("resolve", btn("Resolve", "b", function () { const x = E.submit("resolve"); logT(t.id, x.ok ? "Marked resolved: " + first + " confirms it works" : "Tried to resolve: " + (x.say || "not fixed yet")); after(); })));
    acts.appendChild(btn("Escalate to Tier 2", "b", function () { const x = E.submit("escalate"); logT(t.id, x.ok ? "Escalated to Tier 2" : "Tried to escalate: " + (x.say || "")); after(); }));
  } else if (st.stage === "work" && ch) {
    acts.appendChild(coachTag("open-chat", btn("Open the customer chat", "b pri", function () { openWin("custchat"); })));
    acts.appendChild(coachTag(t.channel === "email" ? "open-mobile" : "open-router", btn(t.channel === "email" ? "Open Mobile devices" : "Open the 92 Series app", "b", function () { openWin(t.channel === "email" ? "mobile" : "router"); })));
    acts.appendChild(coachTag("resolve", btn("Resolve", "b", function () { const x = E.submit("resolve"); logT(t.id, x.ok ? "Marked resolved: " + t.who + " confirms it works" : "Tried to resolve: " + (x.say || "the chat isn't finished")); after(); })));
    acts.appendChild(coachTag("escalate", btn("Escalate to Tier 2", "b", function () { const x = E.submit("escalate"); logT(t.id, x.ok ? "Escalated to Tier 2" : "Tried to escalate: " + (x.say || "")); after(); })));
  } else if (st.stage === "work" && rt) {
    acts.appendChild(coachTag("open-router", btn("Open the 92 Series app", "b pri", function () { openWin("router"); })));
    if (streetRouter()) acts.appendChild(coachTag("open-street", btn("Look at the street in 3D", "b", lookAtStreet)));
    acts.appendChild(coachTag("resolve", btn("Resolve", "b", function () { const x = E.submit("resolve"); logT(t.id, x.ok ? "Marked resolved: " + t.who + " confirms it works" : "Tried to resolve: " + (x.say || "not fixed yet")); after(); })));
    acts.appendChild(coachTag("escalate", btn("Escalate to Tier 2", "b", function () { const x = E.submit("escalate"); logT(t.id, x.ok ? "Escalated to Tier 2" : "Tried to escalate: " + (x.say || "")); after(); })));
  } else if (st.stage === "work" && em) {
    acts.appendChild(coachTag("open-mail", btn("Open Mail", "b pri", function () { openWin("mail"); })));
    acts.appendChild(coachTag("open-admin", btn("Open Mail admin", "b", function () { openWin("mailadmin"); })));
    acts.appendChild(coachTag("resolve", btn("Resolve", "b", function () { const x = E.submit("resolve"); logT(t.id, x.ok ? "Marked resolved: every email triaged and dealt with" : "Tried to resolve: " + (x.say || "not finished yet")); after(); })));
    acts.appendChild(btn("Escalate to Tier 2", "b", function () { const x = E.submit("escalate"); logT(t.id, x.ok ? "Escalated to Tier 2" : "Tried to escalate: " + (x.say || "")); after(); }));
  } else if (st.stage === "work" && mal) {
    acts.appendChild(coachTag("resolve", btn("Resolve", "b", function () { const x = E.submit("resolve"); logT(t.id, x.ok ? "Marked resolved: every PC checked, the infected ones cleaned" : "Tried to resolve: " + (x.say || "not finished yet")); after(); })));
    acts.appendChild(btn("Escalate to Tier 2", "b", function () { const x = E.submit("escalate"); logT(t.id, x.ok ? "Escalated to Tier 2" : "Tried to escalate: " + (x.say || "")); after(); }));
  } else if (st.stage === "work") {
    acts.appendChild(coachTag("connect", btn("Connect to " + r.host, "b pri", function () { connect(t.machine); }, "Connect to " + r.host + " by remote support")));
    acts.appendChild(coachTag("walk", btn("Walk to " + r.fullName.split(" ")[0] + "'s desk", "b", function () { walkOver(t.machine); })));
    acts.appendChild(coachTag("resolve", btn("Resolve", "b", function () { const x = E.submit("resolve"); logT(t.id, x.ok ? "Marked resolved — " + first + " confirmed it works" : "Tried to resolve: " + (x.say || "not fixed yet")); after(); })));
    acts.appendChild(btn("Escalate to Tier 2", "b", function () { const x = E.submit("escalate"); logT(t.id, x.ok ? "Escalated to Tier 2" : "Tried to escalate: " + (x.say || "")); after(); }));
  }
  p.appendChild(acts);
  if (mal && isCur && st && st.stage !== "done") p.appendChild(drawDevices(t));
  if (rt && isCur && st && st.stage === "work") p.appendChild(drawCall(t));
  if (em && isCur && st && st.stage === "work") { p.appendChild(drawTriage(t)); if (t.devices.length) p.appendChild(drawDevices(t)); }
  if (isCur && st && st.stage === "work") {
    const c = el("p", "t-id", LEVEL[t.id] === "crawl" ? "Mason is walking you through this one. Follow his steps on the right." : st.guesses ? "Moves that did not help so far: " + st.guesses + ". Looking around never counts." : "Looking around, reading logs, running the program to test it and typos never count against you.");
    p.appendChild(c);
    if (st.lastSay) { const sy = el("p", "say", st.lastSay); sy.setAttribute("role", "status"); p.appendChild(sy); }
  }
  if (isCur && st && (st.stage === "close")) p.appendChild(drawResolution(t, st));
  if (st && st.stage === "done") { const d = el("div", "done"); d.setAttribute("role", "status"); d.appendChild(el("strong", null, "✓ " + s[0] + ". " + INC[t.id] + " is closed.")); d.appendChild(el("p", null, "Resolution notes: " + st.note)); p.appendChild(d); }

  const wn = el("section", "t-sec"); wn.appendChild(el("h3", null, "Work notes (only you and the team see these)"));
  const ta = el("textarea", "field"); ta.id = "wn-" + t.id; ta.setAttribute("aria-label", "Work notes"); ta.value = L.notes[t.id] || ""; ta.placeholder = "What you found, what you tried…";
  ta.addEventListener("input", function () { L.notes[t.id] = ta.value; saveL(); }); wn.appendChild(ta); p.appendChild(wn);

  const lg = el("section", "t-sec"); lg.appendChild(el("h3", null, "Activity (kept by Help Desk)"));
  const ul = el("ul", "log"); (L.log[t.id] || []).slice(-40).forEach(function (x) { const li = el("li"); li.appendChild(el("time", null, x.at)); li.appendChild(el("span", null, x.text)); ul.appendChild(li); });
  if (!(L.log[t.id] || []).length) ul.appendChild(el("li", null, "Nothing yet."));
  lg.appendChild(ul); p.appendChild(lg);

  if (instructor) {
    /* the ticket's own starting point when it isn't the one being worked:
       its machines (or phone) aren't set up in the current office */
    const f = isCur ? E.fleet() : (function () { const g = makeFleet(); t.setup(g); return g; })();
    const mv = (t.moves(f) || []).filter(function (x) { return x.correct; })[0];
    const a = el("div", "ins"); a.appendChild(el("strong", null, "Instructor: ")); a.appendChild(document.createTextNode("Fix: " + (mv ? mv.label : "") + ". Outcome: " + t.outcome + ". Cause: " + t.close.options.filter(function (x) { return x.correct; })[0].label + ".")); p.appendChild(a);
  }
  return p;
}
/* Each ticket's exam view: the same sim in Exam Practice, at the matching
   practice (the sim itself for the ticket that is the sim). */
function examFor(t) {
  const ex = EXAMS.filter(function (e) { return e.sim === t.sim; })[0]; if (!ex) return null;
  const i = TICKETS.filter(function (x) { return x.sim === t.sim; }).indexOf(t);
  return { ex: ex, v: ex.variants[Math.max(0, i)] || ex.variants[0] };
}
/* A router ticket's phone line to the customer: they do what only
   someone standing at the router can (owner, 1 October 2026). */
const ASKS = [["ports", "Which port is the modem's cable plugged into?"], ["move", "Please move the modem's cable to the blue INTERNET port."], ["lights", "What are the lights on the router doing?"], ["sticker", "What does the sticker underneath it say?"], ["adapter", "Is it on the power adapter that came in its box?"], ["socket", "Could you plug it into a different wall socket?"], ["letter", "Do you have the welcome letter from your internet provider?"], ["power", "Please unplug the router for ten seconds, then plug it back in."],
  ["console-port", "Please plug the console into the orange SCREENED SUBNET port."], ["pc-port", "Please plug the computer into the orange SCREENED SUBNET port."], ["pc-back", "Please plug the computer back into a yellow LAN port."],
  ["test-remote", "Try connecting to the computer from outside, from work."], ["test-game", "Start an online game and read me the NAT type."]];
function drawCall(t) {
  const sec = el("section", "t-sec call"); sec.appendChild(el("h3", null, "Call " + t.who + " (on the line)"));
  sec.appendChild(el("p", "t-id", t.who + " is at the router and can check what you can't see from here. Looking and asking never count against you."));
  const log = el("div", "call-log"); log.setAttribute("role", "log"); log.setAttribute("aria-label", "Call with " + t.who);
  (L.calls[t.id] || []).forEach(function (c) { log.appendChild(el("p", "call-q", "You: " + c.q)); log.appendChild(el("p", "call-a", t.who + ": " + c.a)); });
  if (!(L.calls[t.id] || []).length) log.appendChild(el("p", "call-a", t.who + ": \"Hello? I'm right here by the router.\""));
  sec.appendChild(log);
  const g = el("div", "call-asks"); g.setAttribute("role", "group"); g.setAttribute("aria-label", "Ask " + t.who);
  ASKS.filter(function (q) { return t.asks ? t.asks.indexOf(q[0]) >= 0 : ["console-port", "pc-port", "pc-back", "test-remote", "test-game"].indexOf(q[0]) < 0; }).forEach(function (q) { g.appendChild(coachTag("ask-" + q[0], btn(q[1], "b small", function () {
    const rr = RT.get(E.fleet(), t.id); const b = E.before(); const lost = q[0] === "power" && RT.dirty(rr);
    const a = RT.ask(E.fleet(), rr, q[0]); (L.calls[t.id] = L.calls[t.id] || []).push({ q: q[1], a: a.replace(/^"|"$/g, "") }); saveL();
    E.onAct({ type: "router-ask", what: q[0], lost: lost, machine: "TECH", before: b }); actLog({ type: "router-ask", what: q[0], q: q[1], lost: lost }, t.site); after();
  }, "Ask " + t.who + ": " + q[1]))); });
  sec.appendChild(g);
  return sec;
}
/* An incident covers the whole network: every PC is one click from a
   remote session or a walk. The list shows only what the student has
   done or can see from here (checked, reachable), never which PCs are
   infected: that is for them to find. */
function drawDevices(t) {
  const sec = el("section", "t-sec devs"); sec.appendChild(el("h3", null, "Devices on the network"));
  const mal = t.kind === "malware";
  const tb = el("table", "dev-t"); const hr = el("tr"); (mal ? ["Device", "Who and where", "Checked", "Network", ""] : ["Device", "Who and where", "Network", ""]).forEach(function (c) { const th = el("th", null, c); th.setAttribute("scope", "col"); hr.appendChild(th); });
  const th0 = el("thead"); th0.appendChild(hr); tb.appendChild(th0); const body = el("tbody");
  t.devices.forEach(function (id) {
    const r = rosterOf(id), m = E.machine(id); const tr = el("tr");
    const h = el("th", null, r.host); h.setAttribute("scope", "row"); tr.appendChild(h);
    tr.appendChild(el("td", null, (r.id === "FS01" || r.id === "MAIL01" ? r.fullName : r.fullName + ", " + r.dept) + " · " + r.where));
    if (mal) { const ok = inspected(m); tr.appendChild(el("td", ok ? "dev-ok" : null, ok ? "✓ Checked" : "Not yet")); }
    const net = MW.online(m) ? "Reachable" : m.power !== "on" ? "Switched off" : "Off the network";
    tr.appendChild(el("td", null, net));
    const a = el("td", "dev-acts");
    a.appendChild(coachTag("dev-connect-" + id, btn("Connect", "b small", function () { connect(id); }, "Connect to " + r.host + " by remote support")));
    a.appendChild(coachTag("dev-walk-" + id, btn(r.id === "FS01" || r.id === "MAIL01" ? "Walk to the closet" : "Walk to the desk", "b small", function () { walkOver(id); }, "Walk to " + r.host)));
    tr.appendChild(a); body.appendChild(tr);
  });
  tb.appendChild(body); const wrap = el("div", "dev-wrap"); wrap.appendChild(tb); sec.appendChild(wrap);
  if (mal) sec.appendChild(el("p", "t-id", "\"Checked\" means you have looked at what is running (Task Manager) and at what Windows recorded (Event Viewer) on that PC."));
  return sec;
}
/* The email ticket's own questions, one card per email: what it is, then
   what gives it away, then acting on it in Mail and Mail admin. A wrong
   pick stays red, marked three ways, as everywhere. */
function drawTriage(t) {
  const sec = el("section", "t-sec tri"); sec.appendChild(el("h3", null, "Emails to triage"));
  const f = E.fleet(), g = E.guidance(), qs = g && g.qstrike;
  t.mails.forEach(function (e) {
    const x = MX.tri(f, e.id), who = staffOf(e.to), done = emailDone(f, e), p = mailPart(f, e);
    const card = el("div", "tri-card" + (done ? " done" : "")); card.dataset.mail = e.id;
    const h = el("div", "tri-h"); h.appendChild(el("strong", null, e.noForward ? e.subject + " (in " + who.first + "'s mailbox: can't be forwarded)" : "FW: " + e.subject)); h.appendChild(el("span", "chip" + (done ? " st-closed" : ""), done ? "✓ Done" : "From " + who.first)); card.appendChild(h);
    [["cat", "1. What is it?"], ["tell", "2. " + e.tell.prompt]].forEach(function (Q, qi) {
      if (Q[0] === "tell" && x.cat !== e.cat) return;
      const q = t.question(e.id, Q[0]), out = Q[0] === "cat" ? x.catOut : x.tellOut, solved = Q[0] === "cat" ? x.cat === e.cat : x.tell;
      const strike = qs && qs.id === e.id && qs.which === Q[0] ? qs.strike : {};
      const grp = el("div", "opts tri-q" + (Q[0] === "cat" ? " four" : "")); grp.setAttribute("role", "group"); grp.setAttribute("aria-label", Q[1]);
      card.appendChild(el("p", "tri-ask", Q[1]));
      (Q[0] === "cat" ? q.options : ordered(q.options, t.id + e.id)).forEach(function (o) {
        const wrong = out.indexOf(o.label) >= 0, struck = !wrong && !solved && strike[o.label];
        const b = el("button", "opt2" + (wrong || struck ? " out" : "") + (solved && o.correct ? " right" : "")); b.type = "button";
        if (wrong || struck) { b.appendChild(el("span", "om", wrong ? "✕ Ruled out" : "✕ Ruled out by Mason")); b.appendChild(el("span", "ol", o.label)); b.appendChild(el("span", "ow", o.why)); b.setAttribute("aria-disabled", "true"); }
        else if (solved && o.correct) { b.appendChild(el("span", "om", "✓ Right")); b.appendChild(el("span", "ol", o.label)); }
        else b.appendChild(el("span", "ol", o.label));
        b.disabled = solved || wrong || !!struck;
        b.addEventListener("click", function () {
          const r = t.answer(E.fleet(), e.id, Q[0], o.label); if (!r) return;
          E.onAct({ type: "mail-answer", id: e.id, which: Q[0], correct: r.correct, why: r.why, machine: "TECH", before: E.before() });
          logT(t.id, "\"" + e.subject + "\": " + (r.correct ? (Q[0] === "cat" ? "classified as " : "giveaway: ") : "ruled out: ") + o.label); after();
        });
        grp.appendChild(b);
      });
      card.appendChild(grp);
    });
    if (x.cat === e.cat && x.tell) card.appendChild(el("p", "tri-act", done ? "3. Dealt with ✓" : "3. Now deal with it, in Mail" + (e.noForward ? " on " + who.first + "'s PC" : "") + " and Mail admin. This ticks itself off when it's done properly."));
    sec.appendChild(card);
  });
  return sec;
}
function drawResolution(t, st) {
  const box = el("section", "t-sec res");
  box.appendChild(el("h3", null, t.outcome === "escalate" ? "Escalation — record it for Tier 2" : "Resolution — " + t.from.split(" ")[0] + " confirms it works"));
  box.appendChild(el("p", null, t.close.prompt));
  const opts = el("div", "opts"); opts.setAttribute("role", "group"); opts.setAttribute("aria-label", t.close.prompt);
  const g = E.guidance(); const strike = (g && g.strike) || {};
  ordered(t.close.options, t.id + "close").forEach(function (o) {
    const out = !!st.picked[o.label] && !o.correct, struck = !out && strike[o.label];
    const b = el("button", "opt2" + (out || struck ? " out" : "") + (st.closeOK && o.correct ? " right" : "")); b.type = "button";
    if (out || struck) { b.appendChild(el("span", "om", out ? "✕ Ruled out" : "✕ Ruled out by Mason")); b.appendChild(el("span", "ol", o.label)); b.appendChild(el("span", "ow", o.why)); b.setAttribute("aria-disabled", "true"); }
    else if (st.closeOK && o.correct) { b.appendChild(el("span", "om", "✓ Right")); b.appendChild(el("span", "ol", o.label)); }
    else b.appendChild(el("span", "ol", o.label));
    b.disabled = st.closeOK || out || !!struck;
    b.addEventListener("click", function () { E.pick(o.label); logT(t.id, (o.correct ? "Cause recorded: " : "Cause ruled out: ") + o.label); after(); });
    opts.appendChild(b);
  });
  box.appendChild(opts);
  if (st.closeOK) {
    const lab = el("label", null, "Resolution notes — " + t.note.tip); const ta = el("textarea", "field"); ta.id = "res-note"; lab.setAttribute("for", "res-note"); ta.value = st.note || L.notes[t.id] || "";
    box.appendChild(lab); box.appendChild(ta);
    if (st.noteMissing && st.noteMissing.length) { const e = el("p", "err", "Not closed yet. The notes need " + st.noteMissing.join("; and ") + "."); e.setAttribute("role", "alert"); box.appendChild(e); }
    box.appendChild(btn("Close the ticket", "b pri", function () { const r = E.writeNote(ta.value); if (r.ok) logT(t.id, "Closed"); after(); }));
  }
  return box;
}
function after() { if (!crawling()) masonCheck(); refresh(); }

/* ----------------------------------------------------------- Mail */
function mailAct(a, host) {
  const t = E.ticket(); a.machine = a.machine || "TECH";
  E.onAct(a); actLog(a, host || "TECH-01"); if (!crawling()) masonCheck(); refresh();
}
function mailCtx(mid, helpdesk, w) {
  return { fleet: E.fleet, mid: mid, helpdesk: helpdesk, act: function (a) { a.before = a.before || E.before(); mailAct(a, mid === "TECH" ? "Mail" : rosterOf(mid).host); },
    draw: function () { redraw(w.id); }, peek: function (id) { if (!(L.peek = L.peek || {})[id]) { L.peek[id] = true; saveL(); coachTick(); } }, noForward: function (id) { const e = emailById(id); return !!(e && e.noForward); } };
}
function drawExamWin(w) {
  w.ui = w.ui || {}; const keep = w.body.querySelector(".ex-main") ? w.body.querySelector(".ex-main").scrollTop : 0; const keepN = w.body.querySelector(".ex-nav") ? w.body.querySelector(".ex-nav").scrollTop : 0;
  const foc = document.activeElement && w.body.contains(document.activeElement) && document.activeElement.id ? document.activeElement.id : null;
  w.body.innerHTML = ""; w.body.classList.add("ex-host");
  drawExam(w.body, { L: L, save: saveL, draw: function () { redraw("exam"); }, onDone: function (ex, v) { toast("Exam Practice", "✓ " + v.title + ": every setting right.", function () { openWin("exam"); }); } }, w.ui);
  const m = w.body.querySelector(".ex-main"); if (m) m.scrollTop = keep; const n = w.body.querySelector(".ex-nav"); if (n) n.scrollTop = keepN;
  if (foc) { const f = document.getElementById(foc); if (f) f.focus(); }
}
function drawRouterWin(w) {
  w.ui = w.ui || {}; const pg = w.body.querySelector(".rt"); const keep = pg ? pg.scrollTop : 0;
  const foc = document.activeElement && w.body.contains(document.activeElement) && document.activeElement.id ? document.activeElement.id : null;
  w.body.innerHTML = ""; w.body.classList.add("rt-host");
  drawRouter(w.body, { routers: function () { const t = E.ticket(), st = E.T(); return t && (t.kind === "router" || (t.kind === "chat" && t.channel === "router")) && st && st.stage !== "done" ? [RT.get(E.fleet(), t.id)].filter(Boolean) : []; }, act: routerAct, draw: function () { redraw("router"); } }, w.ui);
  const pg2 = w.body.querySelector(".rt"); if (pg2) pg2.scrollTop = keep;
  if (foc) { const f = document.getElementById(foc); if (f) f.focus(); }
}
/* The laptop's browser, at 192.168.1.1: Rafiki's own access point, on
   our own network. Its sign-in page first; a restart signs you out, as a
   real one does. */
function drawBrowserWin(w) {
  w.ui = w.ui || {}; const pg = w.body.querySelector(".rt"); const keep = pg ? pg.scrollTop : 0;
  const foc = document.activeElement && w.body.contains(document.activeElement) && document.activeElement.id ? document.activeElement.id : null;
  w.body.innerHTML = ""; w.body.classList.add("rt-host");
  const bar = el("div", "wb-bar"); const lab = el("label", "sr", "Address"); lab.setAttribute("for", "wb-url"); const url = el("input", "field wb-url"); url.id = "wb-url"; url.value = "http://192.168.1.1/"; url.readOnly = true; bar.appendChild(lab); bar.appendChild(url); w.body.appendChild(bar);
  const t = E.ticket(), st = E.T(), r = t && t.kind === "wifi" && st && st.stage !== "done" ? RT.get(E.fleet(), t.id) : null;
  if (!r) { const p = el("div", "rt wb-page"); p.appendChild(el("h2", null, "92 Series access point")); p.appendChild(el("p", null, "This is the office access point's sign-in page. Its settings are worked on during a Wi-Fi ticket: open one in Help Desk.")); w.body.appendChild(p); return; }
  if (!r.signedIn) {
    const p = el("form", "rt wb-page wb-login"); p.setAttribute("aria-label", "Sign in to the access point");
    p.appendChild(el("h2", null, "92 Series AP600 — sign in"));
    if (w.ui.msg) { const m = el("p", "rt-msg" + (w.ui.bad ? " bad" : ""), w.ui.msg); m.setAttribute("role", "status"); p.appendChild(m); }
    [["wb-user", "Username", "admin"], ["wb-pass", "Password", ""]].forEach(function (x) { const row = el("div", "rt-f"); const l = el("label", null, x[1]); l.setAttribute("for", x[0]); const i = el("input", "field"); i.id = x[0]; i.value = x[2]; i.setAttribute("autocomplete", "off"); row.appendChild(l); row.appendChild(i); p.appendChild(row); });
    const go = btn("Sign in", "b pri", function (e) { if (e) e.preventDefault(); const u = p.querySelector("#wb-user").value, pw = p.querySelector("#wb-pass").value; const x = routerAct("router-sign-in", function (f, rr) { return RT.signIn(f, rr, u, pw); }); w.ui.msg = x.ok ? null : "Wrong username or password."; w.ui.bad = !x.ok; redraw("browser"); });
    go.type = "submit"; p.addEventListener("submit", function (e) { e.preventDefault(); go.click(); }); p.appendChild(go);
    w.body.appendChild(p); if (foc) { const f = document.getElementById(foc); if (f) f.focus(); } return;
  }
  w.ui.msg = null;
  drawRouter(w.body, { web: true, routers: function () { return [r]; }, act: routerAct, draw: function () { redraw("browser"); } }, w.ui);
  const pg2 = w.body.querySelector(".rt"); if (pg2) pg2.scrollTop = keep;
  if (foc) { const f = document.getElementById(foc); if (f) f.focus(); }
}
/* The floor plan: the office from above, with the Wi-Fi the access point
   is running and the microwave, which moves only with the student there. */
function planRouter() { const t = E.ticket(), st = E.T(); const r = t && st && st.stage !== "done" ? RT.get(E.fleet(), t.id) : null; return r && r.plan ? r : null; }
function drawFloorWin(w) {
  w.ui = w.ui || {}; w.body.innerHTML = ""; w.body.classList.add("fp-host");
  drawFloorPlan(w.body, { router: planRouter, onSite: function () { const t = E.ticket(); return !!(t && L.onSite[t.id]); },
    move: function (x, z) { routerAct("router-microwave", function (f, rr) { return RT.moveMicrowave(f, rr, x, z); }); } }, w.ui);
}
/* The street (Neighboring Routers): the three houses in 3D with each
   router's reach and channel, from what the routers are running. Looking
   is recorded on the router (a view, never a wrong move). */
function streetRouter() { const t = E.ticket(), st = E.T(); return t && st && st.stage !== "done" && t.sim === "Neighboring Routers Configuration" ? RT.get(E.fleet(), t.id) : null; }
function lookAtStreet() { routerAct("router-view", function (f, rr) { RT.note(f, rr, "view", { tab: "street" }); }, { tab: "street", quiet: true }); openWin("street"); }
function drawStreetWin(w) {
  w.ui = w.ui || {}; const keep = w.body.scrollTop; w.body.classList.add("sv-host");
  drawStreetView(w.body, { router: streetRouter, street: function () { const t = E.ticket(); return t && t.site ? (t.site.split(", ")[1] || t.site) : "The street"; } }, w.ui);
  w.body.scrollTop = keep;
  w.onClose = function () { if (w.ui.office) w.ui.office.dispose(); };
}
/* The customer chat (the Help Desk Chat sims): the conversation, the mood
   and the six replies; and Mobile devices, with the customer's phone. */
function chatTicketNow() { const t = E.ticket(), st = E.T(); return t && t.kind === "chat" && st ? t : null; }
function drawChatWin(w) {
  w.ui = w.ui || {}; w.body.classList.add("cc-host");
  drawCustomerChat(w.body, { ticket: chatTicketNow, fleet: E.fleet,
    strike: function () { const g = E.guidance(); return g && g.qstrike && g.qstrike.id === "chat" ? g.qstrike.strike : {}; },
    reply: function (label) { const t = chatTicketNow(); if (!t) return; const b = E.before(); const o = CH.reply(E.fleet(), t, label); if (!o) return;
      E.onAct({ type: "chat-reply", correct: o.correct, why: o.why, machine: "TECH", before: b }); logT(t.id, (o.correct ? "Replied: " : "Reply didn't help: ") + label); after(); },
    restart: function () { const t = chatTicketNow(); if (!t) return; CH.restart(E.fleet(), t); E.onAct({ type: "chat-restart", machine: "TECH", before: E.before() }); logT(t.id, "Started the chat again, with a new set of replies"); after(); },
    open: function (id) { openWin(id); } }, w.ui);
}
function drawMobileWin(w) {
  w.ui = w.ui || {}; w.body.classList.add("mdm-host");
  const mt = E.ticket(), mst = E.T();
  if (mt && mt.kind === "mobile" && mst && mst.stage !== "done") {
    if (w.ui.forTicket !== mt.id) { disposePhone(w.ui); w.ui = { forTicket: mt.id }; }
    drawHandset(w.body, { ticket: E.ticket, phone: function () { return MB.get(E.fleet(), mt.id); }, before: E.before, redraw: function () { redraw("mobile"); },
      dispose: function () { disposePhone(w.ui); },
      act: function (a) { E.onAct(Object.assign({ machine: "TECH" }, a)); if (a.op !== "view") logT(mt.id, "On " + mt.from.split(" ")[0] + "'s phone: " + a.op.replace(/-/g, " ") + (a.app ? " (" + a.app + ")" : "") + (a.res && a.res.text ? ": " + a.res.text : "")); after(); } }, w.ui);
    w.onClose = function () { disposePhone(w.ui); };
    return;
  }
  const t = chatTicketNow(), p = t && t.channel === "email" ? MB.get(E.fleet(), t.id) : null;
  /* opening it shows the phone: that's a look at the phone */
  if (p && w.ui.seen !== t.id && (w.ui.tab || "phone") === "phone") { w.ui.seen = t.id; MB.note(p, "view-phone"); setTimeout(function () { E.onAct({ type: "mdm-view", machine: "TECH", before: E.before() }); after(); }, 0); }
  drawMobile(w.body, { ticket: chatTicketNow, fleet: E.fleet,
    mdm: function (kind) { const p2 = MB.get(E.fleet(), t.id); if (p2) MB.note(p2, kind); E.onAct({ type: "mdm-view", machine: "TECH", before: E.before() }); after(); },
    sync: function () { const p2 = MB.get(E.fleet(), t.id); if (!p2) return; const b = E.before(); const r = MB.sync(p2); MB.note(p2, "student-sync"); E.onAct({ type: "mdm-sync", machine: "TECH", before: b }); logT(t.id, "Synced " + p2.owner.split(" ")[0] + "'s phone: " + (r.in.ok && r.out.ok ? "mail works" : (r.in.ok ? r.out.text : r.in.text))); after(); } }, w.ui);
  w.onClose = function () { disposePhone(w.ui); };
}
/* The Mac on the bench: the approved 3D Mac, its screen as real HTML
   beside it, your hands (the power button) and Rafiki's device
   management. Everything done goes through the engine as type "mac". */
function drawMacWin(w) {
  w.ui = w.ui || {}; const t = E.ticket(), st = E.T();
  const m = t && t.kind === "mac" ? MAC.get(E.fleet(), t.id) : null;
  if (!m) { if (w.ui.mac) { w.ui.mac.dispose(); w.ui.mac = null; w.ui.stage = null; } w.body.innerHTML = ""; w.body.appendChild(el("p", "cc-note", "Nothing on your bench. A Mac appears here when its ticket is open.")); return; }
  if (w.ui.forTicket !== t.id) { if (w.ui.mac) w.ui.mac.dispose(); w.ui = { forTicket: t.id }; }
  const ui = w.ui, act = function (a) { E.onAct(Object.assign({ machine: "TECH" }, a)); actLog(a, "the Mac on your bench"); after(); };
  const keep = w.body.querySelector(".mac-3d");
  w.body.innerHTML = ""; w.body.classList.add("macb-host");
  const grid = el("div", "macb"); w.body.appendChild(grid);
  const left = el("div", "macb-left"); grid.appendChild(left);
  const stage = keep || el("div", "mac-3d"); left.appendChild(stage);
  const sides = el("div", "macb-row"); sides.setAttribute("role", "group"); sides.setAttribute("aria-label", "Turn the Mac");
  [["front", "Front"], ["left", "Left side (ports)"], ["right", "Right side"]].forEach(function (x) { sides.appendChild(btn(x[1], "b small", function () { if (ui.mac) ui.mac.show(x[0]); }, "Turn the Mac: " + x[1])); });
  left.appendChild(sides);
  const hands = el("section", "macb-sec"); hands.appendChild(el("h3", null, "With your own hands"));
  hands.appendChild(el("p", "wo-state", m.power === "on" ? "It's on." : "It's switched off, with its charger plugged in."));
  const hr = el("div", "macb-row");
  hr.appendChild(coachTag("mac-press", btn("Press the power button", "b", function () { const b = E.before(); const r = MAC.power(m, "press"); act({ type: "mac", op: "power", how: "press", res: r, before: b }); }, "Press the power button briefly")));
  hr.appendChild(coachTag("mac-hold", btn("Press and hold the power button", "b", function () { const b = E.before(); if (m.power === "on") MAC.shutDown(m); const r = MAC.power(m, "hold"); act({ type: "mac", op: "power", how: "hold", res: r, before: b }); }, "Press and hold the power button")));
  if (m.power === "on") hr.appendChild(btn("Shut it down", "b", function () { const b = E.before(); const r = MAC.shutDown(m); act({ type: "mac", op: "shutdown", res: r, before: b }); }, "Shut the Mac down"));
  hands.appendChild(hr); left.appendChild(hands);
  const mdm = el("section", "macb-sec"); mdm.appendChild(el("h3", null, "Device management · Rafiki's IT Services"));
  const dl = el("dl", "doc-dl"); [["Device", m.model + " · serial " + m.serial], ["Assigned to", m.leaver + " (left)"], ["Enrolled", "Yes: Rafiki's IT Services"]].forEach(function (kv) { dl.appendChild(el("dt", null, kv[0])); dl.appendChild(el("dd", null, kv[1])); }); mdm.appendChild(dl);
  mdm.appendChild(coachTag("mac-release", btn("Ask Mason to release Activation Lock", "b", function () { const b = E.before(); const r = MAC.release(m); act({ type: "mac", op: "release", res: r, before: b }); }, "Ask Mason to release Activation Lock in device management")));
  if (m.lock.released) mdm.appendChild(el("p", "wo-state", "Mason: \"Done: Activation Lock is released for that serial number.\""));
  left.appendChild(mdm);
  const right = el("div", "macb-right"); grid.appendChild(right);
  drawMacScreen(right, m, { act: act, before: E.before, draw: function () { redraw("macbench"); }, ui: ui });
  /* the 3D Mac, mounted once; its screen redrawn every time */
  ui.paint = paintMac(m);
  if (ui.mac) ui.mac.redraw();
  else if (!ui.mounting) { ui.mounting = true; import("./macview.js").then(function (mod) { if (!mod.webglOK()) throw new Error("no webgl"); ui.mac = mod.mountMac(stage, { height: 300, draw: function (c, w2, h2) { ui.paint(c, w2, h2); } }); }).catch(function () { stage.appendChild(el("p", "cc-note", "3D isn't available on this computer: the Mac's screen beside it is the same.")); }); }
  w.onClose = function () { if (ui.mac) { ui.mac.dispose(); ui.mac = null; } };
}
/* The new phone on the bench: the approved 3D phone, its screen as real
   HTML beside it, your hands (the power button, the charger) and Rafiki's
   device management (the enrolment QR code, the policy, compliance).
   Everything done goes through the engine as type "newphone". */
function drawPhoneBenchWin(w) {
  w.ui = w.ui || {}; const t = E.ticket();
  const m = t && t.kind === "newphone" ? NP.get(E.fleet(), t.id) : null;
  if (!m) { if (w.ui.phone) { w.ui.phone.dispose(); w.ui.phone = null; } w.body.innerHTML = ""; w.body.appendChild(el("p", "cc-note", "Nothing on your bench. A phone appears here when its ticket is open.")); return; }
  if (w.ui.forTicket !== t.id) { if (w.ui.phone) w.ui.phone.dispose(); w.ui = { forTicket: t.id }; }
  const ui = w.ui, act = function (a) { E.onAct(Object.assign({ machine: "TECH" }, a)); if (!(a.op === "tap" && a.res && a.res.taps)) actLog(a, "the phone on your bench"); after(); };
  const keep = w.body.querySelector(".np-3d");
  w.body.innerHTML = ""; w.body.classList.add("macb-host");
  const grid = el("div", "macb"); w.body.appendChild(grid);
  const left = el("div", "macb-left"); grid.appendChild(left);
  const stage = keep || el("div", "mac-3d np-3d"); left.appendChild(stage);
  const sides = el("div", "macb-row"); sides.setAttribute("role", "group"); sides.setAttribute("aria-label", "Turn the phone");
  [["front", "Front"], ["back", "Back"], ["bottom", "Bottom edge (USB-C)"]].forEach(function (x) { sides.appendChild(btn(x[1], "b small", function () { if (ui.phone) ui.phone.show(x[0]); }, "Turn the phone: " + x[1])); });
  left.appendChild(sides);
  const hands = el("section", "macb-sec"); hands.appendChild(el("h3", null, "With your own hands"));
  hands.appendChild(el("p", "wo-state", (m.power === "on" ? "It's on." : "It's switched off.") + " " + (m.battery.charging ? "The USB-C charger is plugged in." : "The charger is in the box, not plugged in.")));
  const hr = el("div", "macb-row");
  const pw = function (how) { return function () { const b = E.before(); const r = NP.power(m, how); ui.scr = ui.scr || {}; ui.scr.msg = r.text ? { text: r.text, bad: r.ok === false } : null; act({ type: "newphone", op: "power", how: how, res: r, before: b }); }; };
  hr.appendChild(coachTag("np-press", btn("Press the power button", "b", pw("press"), "Press the power button briefly")));
  hr.appendChild(coachTag("np-hold", btn("Press and hold the power button", "b", pw("hold"), "Press and hold the power button")));
  hr.appendChild(coachTag("np-charger", btn(m.battery.charging ? "Unplug the charger" : "Plug in the USB-C charger", "b", function () { const b = E.before(); const r = NP.charger(m, !m.battery.charging); act({ type: "newphone", op: "charger", on: m.battery.charging, res: r, before: b }); if (ui.phone && m.battery.charging) ui.phone.show("bottom"); }, m.battery.charging ? "Unplug the charger" : "Plug the USB-C charger into the phone")));
  hands.appendChild(hr); left.appendChild(hands);
  const mdm = el("section", "macb-sec"); mdm.appendChild(el("h3", null, "Device management · Rafiki's IT Services"));
  const cp = NP.compliance(m);
  const dl = el("dl", "doc-dl"); [["Device", m.model + " · serial " + m.serial + " · IMEI " + m.imei], ["Assigned to", m.owner + " (starts Monday)"], ["Ownership", "Company-owned"], ["Enrolment", m.enrol === "managed" ? "Enrolled: fully managed" : m.enrol === "profile" ? "Enrolled: personal phone with a work profile" : "Not enrolled"], ["Android", m.enrol === "none" ? "Not reported (not enrolled)" : m.os.version + " · security update " + m.os.patch]].forEach(function (kv) { dl.appendChild(el("dt", null, kv[0])); dl.appendChild(el("dd", null, kv[1])); }); mdm.appendChild(dl);
  const cl = el("p", "np-comp " + (cp.ok ? "ok" : "bad")); cl.appendChild(el("strong", null, (cp.ok ? "✓ " : "✕ ") + "Compliance: ")); cl.appendChild(document.createTextNode(cp.text)); mdm.appendChild(cl);
  const pol = el("details", "np-pol"); pol.appendChild(el("summary", null, "Company phone policy"));
  const pl = el("ul"); ["Enrolment: fully managed (company-owned), by QR code from this page", "Screen lock: a PIN of at least " + NP.POLICY.pinLen + " digits with no runs or repeats, or a password; no pattern", "Security update: " + NP.POLICY.minPatch + " or later", "Apps installed by the organisation: Outlook, Teams"].forEach(function (x) { pl.appendChild(el("li", null, x)); }); pol.appendChild(pl); mdm.appendChild(pol);
  mdm.appendChild(coachTag("np-qr", btn(m.mdm.qr ? "The enrolment QR code is showing" : "Show the enrolment QR code", "b", function () { if (m.mdm.qr) return; const b = E.before(); m.mdm.qr = true; NP.note(m, "qr"); act({ type: "newphone", op: "qr", res: { ok: true }, before: b }); }, "Show the enrolment QR code for this phone")));
  if (m.mdm.qr) { const q = el("figure", "np-qr"); q.appendChild(qrCanvas(m.serial)); q.appendChild(el("figcaption", null, "Enrolment code for " + m.model + " " + m.serial + ": fully managed, Rafiki's IT Services. It doesn't carry a Wi-Fi network.")); mdm.appendChild(q); }
  left.appendChild(mdm);
  const right = el("div", "macb-right"); grid.appendChild(right);
  ui.scr = ui.scr || {};
  drawNewPhoneScreen(right, m, { act: act, before: E.before, draw: function () { redraw("phonebench"); }, ui: ui.scr });
  ui.paint = paintNewPhone(m, ui.scr);
  if (ui.phone) ui.phone.redraw();
  else if (!ui.mounting) { ui.mounting = true; import("./phoneview.js").then(function (mod) { if (!mod.webglOK()) throw new Error("no webgl"); ui.phone = mod.mountPhone(stage, { height: 300, dist: 380, draw: function (c, w2, h2) { ui.paint(c, w2, h2); } }); }).catch(function () { stage.appendChild(el("p", "cc-note", "3D isn't available on this computer: the phone's screen beside it is the same.")); }); }
  w.onClose = function () { if (ui.phone) { ui.phone.dispose(); ui.phone = null; } };
}
/* On the spot: a safety job, where the hazard is. The approved 3D models,
   what you can see in words, your hands, and the person on the spot.
   Everything done goes through the engine: type "safety" for the hands,
   "chat-reply" for what you say. */
function safetyNow() { const t = E.ticket(), st = E.T(); return t && t.kind === "safety" && st && st.stage !== "done" ? t : null; }
function onSiteFor(t) { return !(t.place && t.place.walk) || !!L.onSite[t.id]; }
function drawSafetyWin(w) {
  w.ui = w.ui || {}; const t = safetyNow(), x = t ? SF.get(E.fleet(), t.id) : null;
  if (!x) { if (w.ui.v3) { w.ui.v3.dispose(); } w.ui = {}; w.body.innerHTML = ""; w.body.appendChild(el("p", "cc-note", "Nothing to deal with here. A safety job appears when its ticket is open in Help Desk.")); return; }
  if (w.ui.forTicket !== t.id) { if (w.ui.v3) w.ui.v3.dispose(); w.ui = { forTicket: t.id }; }
  const ui = w.ui; if (!ui.stage) ui.stage = el("div", "mac-3d sf-3d");
  const keep = w.body.scrollTop; w.body.classList.add("macb-host");
  const here = onSiteFor(t), s3 = t.state3d ? t.state3d(x.s) : x.s, key = JSON.stringify(s3);
  drawSafety(w.body, { ticket: t, fleet: E.fleet(), sc: x, onSite: here, stage: ui.stage,
    walk: function () { walkOver(t.place.walk, { safety: true }); },
    act: function (id, value) { const b = E.before(); const r = SF.run(E.fleet(), t, id, value); if (!r) return; const a = { type: "safety", op: id, value: value == null ? null : value, res: r, machine: "TECH", before: b }; E.onAct(a); actLog(a, "On the spot"); after(); },
    reply: function (label) { const b = E.before(); const o = CH.reply(E.fleet(), t, label); if (!o) return; E.onAct({ type: "chat-reply", correct: o.correct, why: o.why, machine: "TECH", before: b }); logT(t.id, (o.correct ? "Said to " + t.who + ": " : "Said to " + t.who + ", and it didn't help: ") + label); after(); },
    strike: function () { const g = E.guidance(); return g && g.qstrike && g.qstrike.id === "safety" ? g.qstrike.strike : {}; },
    revert: function () { E.revert(); logT(t.id, "Reverted to the last snapshot"); refresh(); },
    view: function (name) { if (ui.v3) ui.v3.show(name); } });
  w.body.scrollTop = keep;
  /* the 3D, mounted once and rebuilt only when what it shows has changed */
  if (here) {
    if (ui.v3) { if (ui.key !== key) { ui.key = key; ui.v3.update(s3); } }
    else if (!ui.mounting) { ui.mounting = true; ui.key = key; import("./safetyview.js").then(function (mod) { if (!mod.webglOK()) throw new Error("no webgl"); ui.v3 = mod.mountSafety(ui.stage, { height: 300, scene: t.scene3d, state: s3, view: t.views[0][0] }); }).catch(function () { ui.stage.appendChild(el("p", "cc-note", "3D isn't available on this computer: What you can see, beside it, says the same in words.")); }); }
  }
  w.onClose = function () { if (ui.v3) { ui.v3.dispose(); ui.v3 = null; } };
}
/* a QR-style code, drawn the same every time for one serial: scenery, the
   words beside it say what it is */
function qrCanvas(seed) {
  const n = 25, px = 6, c = document.createElement("canvas"); c.width = c.height = (n + 4) * px; c.setAttribute("aria-hidden", "true");
  const g = c.getContext("2d"); g.fillStyle = "#ffffff"; g.fillRect(0, 0, c.width, c.height); g.fillStyle = "#000000";
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rnd = function () { h = (h * 1103515245 + 12345) >>> 0; return (h >>> 16) & 1; };
  const finder = function (x, y) { for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) { const edge = i === 0 || j === 0 || i === 6 || j === 6, core = i >= 2 && i <= 4 && j >= 2 && j <= 4; if (edge || core) g.fillRect((x + i + 2) * px, (y + j + 2) * px, px, px); } };
  const inFinder = function (i, j) { return (i < 8 && j < 8) || (i > n - 9 && j < 8) || (i < 8 && j > n - 9); };
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!inFinder(i, j) && rnd()) g.fillRect((i + 2) * px, (j + 2) * px, px, px);
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
  return c;
}
/* Everything done in the 92 Series app goes through here: the change to
   the router, then the engine (which judges it), the ticket's activity,
   and Mason. A view that only redraws (a confirm box) is quiet. */
function routerAct(type, fn, extra) {
  const t = E.ticket(); extra = extra || {}; if (!t || (t.kind !== "router" && t.kind !== "wifi" && !(t.kind === "chat" && t.channel === "router"))) return {};
  const rr = RT.get(E.fleet(), t.id); const b = E.before();
  const lost = type === "router-reboot" ? RT.dirty(rr) : undefined;
  const res = fn(E.fleet(), rr) || {};
  if (extra.quiet) { E.save(); redraw("router"); redraw("browser"); return res; }
  const a = Object.assign({ type: type, machine: "TECH", before: b, lost: lost }, extra, { ok: res.ok, text: res.text });
  E.onAct(a); actLog(a, t.site); after();
  return res;
}
function drawMailWin(w) { w.ui = w.ui || {}; w.body.innerHTML = ""; w.body.classList.add("mx-host"); drawMail(w.body, mailCtx("TECH", true, w), w.ui); }
function drawAdminWin(w) {
  w.ui = w.ui || {}; const keep = w.body.scrollTop; w.body.innerHTML = "";
  const ctx = mailCtx("TECH", true, w);
  ctx.staff = ["WS1", "WS4", "WS2", "WS3", "WS5"].map(function (id) { const s0 = staffOf(id); return { id: id, name: s0.name, addr: s0.addr }; });
  ctx.emailFor = function (who) { const t = E.ticket(); if (!t || !t.mails) return null; const hit = t.mails.filter(function (e) { return e.to === who && MX.tri(E.fleet(), e.id).compromised; })[0] || t.mails.filter(function (e) { return e.to === who; })[0]; return hit ? hit.id : null; };
  drawAdmin(w.body, ctx, w.ui); w.body.scrollTop = keep;
}

/* --------------------------------------------- the remote session */
function connect(id) {
  const t = E.ticket();
  /* Already connected, or connecting: just bring the session forward. */
  if (W["rdp:" + id] && W["rdp:" + id].phase === "dropped") closeWin("rdp:" + id);
  if (W["rdp:" + id] && W["rdp:" + id].phase !== "fail") { W["rdp:" + id].min = false; place(W["rdp:" + id]); focusWin("rdp:" + id); return; }
  if (t) logT(t.id, "Remote support request sent to " + rosterOf(id).host);
  const w = openWin("rdp:" + id); w.phase = "wait"; redraw("rdp:" + id);
  setTimeout(function () {
    if (!W["rdp:" + id]) return;
    const m = E.machine(id);
    w.phase = MW.online(m) ? "on" : "fail";
    const srv = MW.server(m);
    if (t) logT(t.id, w.phase === "on" ? (srv ? "Signed in to " + rosterOf(id).host + " with Remote Desktop, as RAFIKI\\itadmin" : rosterOf(id).fullName + " accepted. Connected to " + rosterOf(id).host) : rosterOf(id).host + " could not be reached");
    redraw("rdp:" + id); refresh();
  }, 1400);
}
function drawRdp(w) {
  const id = w.id.slice(4); const r = rosterOf(id); const b = w.body;
  w.phase = w.phase || "wait";
  if (w.phase === "on" && w.desk && b.contains(w.desk.element)) { w.desk.draw(); return; }
  w.desk = null;
  b.innerHTML = ""; const box = el("div", "rdp");
  const bar = el("div", "rdp-bar");
  bar.appendChild(el("span", "who", w.phase === "on" ? (r.id === "FS01" || r.id === "MAIL01" ? "Connected to " + r.host + " · Remote Desktop · RAFIKI\\itadmin" : "Connected to " + r.host + " · " + r.fullName + "'s session · you have control") : "Rafiki Remote Support · " + r.host));
  if (w.phase === "on") bar.appendChild(btn("Revert to snapshot", "b small", function () {
    E.revert(); Object.keys(W).forEach(function (k) { if (W[k].desk) W[k].desk.reset(); }); const t = E.ticket(); if (t) logT(t.id, "Reverted the PCs to the last snapshot"); refresh();
  }, "Revert to snapshot: puts the PC back to the last point you got right. Your hints carry on."));
  bar.appendChild(btn("Disconnect", "b small", function () { const t = E.ticket(); if (t) logT(t.id, "Disconnected from " + r.host); closeWin(w.id); }));
  box.appendChild(bar);
  const host = el("div", "rdp-host"); box.appendChild(host); b.appendChild(box);
  if (w.phase === "wait") { const x = el("div", "rdp-wait"); x.setAttribute("role", "status"); x.appendChild(el("div", "spin")); const srv = r.id === "FS01" || r.id === "MAIL01"; x.appendChild(el("p", null, (srv ? "Connecting to " : "Requesting control of ") + r.host + "…")); x.appendChild(el("p", null, srv ? "Signing in as RAFIKI\\itadmin." : "Waiting for " + r.fullName + " to accept.")); host.appendChild(x); return; }
  if (w.phase === "dropped") { const x = el("div", "rdp-wait"); x.setAttribute("role", "alert"); x.appendChild(el("p", null, w.dropWhy)); if (w.dropOp !== "restart") { x.appendChild(btn(r.id === "FS01" || r.id === "MAIL01" ? "Walk to the closet" : "Walk to " + r.fullName.split(" ")[0] + "'s desk", "b pri", function () { closeWin(w.id); walkOver(id); })); host.appendChild(x); return; } x.appendChild(btn("Reconnect to " + r.host, "b pri", function () { w.phase = "wait"; w.desk = null; redraw(w.id); const t = E.ticket(); if (t) logT(t.id, "Reconnecting to " + r.host); setTimeout(function () { if (!W[w.id]) return; const m = E.machine(id); w.phase = MW.online(m) ? "on" : "fail"; if (t) logT(t.id, w.phase === "on" ? "Reconnected to " + r.host : r.host + " could not be reached"); redraw(w.id); refresh(); }, 1400); })); host.appendChild(x); return; }
  if (w.phase === "fail") { const x = el("div", "rdp-wait"); x.setAttribute("role", "alert"); x.appendChild(el("p", null, r.host + " can't be reached. It may be turned off, not connected to the network, or not working.")); x.appendChild(el("p", null, "If you can't connect, you'll have to go to the desk.")); x.appendChild(btn("Walk to " + (r.id === "FS01" || r.id === "MAIL01" ? "the closet" : r.fullName.split(" ")[0] + "'s desk"), "b pri", function () { closeWin(w.id); walkOver(id); })); host.appendChild(x); return; }
  w.desk = createDesktop(host, {
    machine: function () { return E.machine(id); }, fleetLookup: E.lookup, fleet: E.fleet, noForward: function (x) { const e = emailById(x); return !!(e && e.noForward); }, isTech: false, before: E.before, clock: function () { const n = now(); return n.time + "  " + n.short; },
    onAct: function (a) { if (a.type === "power" && (a.op === "restart" || a.op === "off")) setTimeout(function () { dropped(w, a.op); }, 0); if ((a.type === "net" && a.op === "off") || (a.type === "cmd" && a.res && a.res.netChange)) setTimeout(function () { if (!MW.online(E.machine(id))) dropped(w, "net"); }, 0); if (a.type === "tm-end") setTimeout(function () { if (E.machine(id).crashed) dropped(w, "crash"); }, 0); if (a.type === "cmd" && E.ticket()) (L.lines[E.ticket().id] = L.lines[E.ticket().id] || []).push(String(a.line || "").toLowerCase()); E.onAct(a); actLog(a, r.host); if (!crawling()) masonCheck(); refresh(); }, helpdesk: function () {}
  });
}
/* A restart or shutdown ends the remote session, as it does for real:
   the student reconnects once the PC is back up. A PC that was shut
   down can't be reconnected to from here. */
function dropped(w, op) {
  const id = w.id.slice(4), r = rosterOf(id), t = E.ticket();
  w.phase = "dropped"; w.desk = null; w.dropOp = op;
  w.dropWhy = op === "net" ? "The remote session ended: " + r.host + " is off the network now, so nothing can reach it remotely, you included. From here on, work on it at the desk." : op === "crash" ? "Connection lost: " + r.host + " stopped responding. A remote session can't show you why. Go and look at the screen." : op === "restart" ? "The remote session ended because " + r.host + " restarted. It's back up now: reconnect to carry on." : "The remote session ended because " + r.host + " was shut down. Nobody can reach it remotely until it's switched back on.";
  if (t) logT(t.id, "Remote session to " + r.host + " ended: " + (op === "net" ? "the PC was taken off the network" : op === "crash" ? "the PC stopped responding" : "the PC " + (op === "restart" ? "restarted" : "shut down")));
  redraw(w.id); refresh();
}
/* What Help Desk's activity list records: what a real remote-support
   tool would — programs opened, commands run, repairs, restarts. */
function actLog(a, host) {
  const t = E.ticket(); if (!t) return;
  const say = {
    open: function () { return "Opened " + ({ cmd: "Command Prompt", ps: "PowerShell", taskmgr: "Task Manager", eventvwr: "Event Viewer", settings: "Settings", softcenter: "Software Center", explorer: "File Explorer" }[a.app] || a.app) + (a.elevated ? " as administrator" : ""); },
    launch: function () { return "Ran " + a.app + ": " + (a.res && a.res.ok ? "it opened" : (a.res && a.res.title ? a.res.title + " error" : "it failed")); },
    cmd: function () { return "> " + a.line; },
    repair: function () { return "Repaired " + a.app; }, reinstall: function () { return "Reinstalled " + a.app + " from Software Center"; }, install: function () { return "Installed " + a.app; },
    "catalogue-admin": function () { return "Installed or repaired " + a.key + " as administrator"; },
    power: function () { return a.op === "restart" ? "Restarted " + host + (a.reason === "offline scan" ? " for the Microsoft Defender Offline scan" : "") : a.op === "off" ? "Shut down " + host : "Powered on " + host; },
    "tm-end": function () { return "Ended " + a.name + " in Task Manager" + (a.res && a.res.respawned ? ": it started again" : ""); },
    "view-history": function () { return "Read the browser history"; },
    net: function () { return (a.op === "off" ? "Disabled" : "Enabled") + " the network adapter"; },
    restore: function () { return a.op === "point" ? (a.res && a.res.ok ? "Created a restore point" : "Tried to create a restore point: " + (a.res ? a.res.text : "")) : "Turned System Restore " + a.op; },
    av: function () { return a.op === "defs" ? (a.res && a.res.ok ? "Updated the Defender definitions" + (a.how === "usb" ? " from the USB stick" : "") : "Couldn't update the definitions: " + (a.res ? a.res.text : "")) : a.op === "schedule" ? "Turned scheduled scans " + (a.on ? "on" : "off") : "Ran a " + ({ quick: "quick", full: "full", offline: "Microsoft Defender Offline" }[a.kind] || a.kind) + " scan: " + (a.res ? a.res.text : ""); },
    updates: function () { return "Ran Windows Update: " + (a.res ? a.res.text : ""); },
    "mail-report": function () { return "Reported \"" + subj(a.id) + "\" as " + a.kind; },
    "mail-safe": function () { return "Told " + staffOf(emailById(a.id).to).first + " that \"" + subj(a.id) + "\" is genuine"; },
    "mail-delete": function () { return "Deleted \"" + subj(a.id) + "\""; },
    "mail-restore": function () { return "Moved \"" + subj(a.id) + "\" back to the Inbox"; },
    "mail-headers": function () { return "Read the message details (headers) of \"" + subj(a.id) + "\""; },
    "mail-click": function () { return "Opened " + a.href + " from \"" + subj(a.id) + "\""; },
    "mail-block": function () { return "Blocked " + a.entry; }, "mail-unblock": function () { return "Unblocked " + a.entry; },
    "mail-purge": function () { return "Purged \"" + subj(a.id) + "\" from every mailbox"; }, "mail-unpurge": function () { return "Put \"" + subj(a.id) + "\" back"; },
    "mail-policy": function () { return "Turned " + (a.on ? "on" : "off") + ": " + MX.POLICIES[a.key].label; },
    "mail-reset": function () { return "Reset " + staffOf(a.who).name + "'s password and signed them out everywhere"; },
    "router-sign-in": function () { return a.ok ? "Signed in to the access point at 192.168.1.1" : "Sign-in to 192.168.1.1 refused: wrong username or password"; },
    "router-microwave": function () { const pr = planRouter(); return "Moved the microwave on the floor plan: now " + (pr ? Math.round(RT.microwaveFromAP(pr)) : "?") + " feet from the access point"; },
    "router-view": function () { return "Opened the router's " + ({ status: "Status", wireless: "Wireless", internet: "Internet", forward: "Port forwarding", admin: "Administration" }[a.tab] || a.tab) + " page"; },
    "router-edit": function () { return "Changed the " + ({ "wifi.ssid": "network name", "wifi.pass": "Wi-Fi password", "wifi.security": "security", "wifi.band": "band", "wifi.channel": "channel", "wifi.width": "channel width", "wifi.mac": "MAC filtering", "wifi.allowed": "allowed list", "wan.mode": "connection type", "wan.user": "PPPoE username", "wan.pass": "PPPoE password", forwards: "port forwards", screened: "screened-subnet host" }[a.path] || a.path) + " on the page (not saved yet)"; },
    "router-admin-pass": function () { return a.ok ? "Set a new admin password on the page (not saved yet)" : "Tried a new admin password: " + a.text; },
    "router-save": function () { return "Saved the router's settings"; },
    "router-reboot": function () { return "Restarted the router" + (a.lost ? ": unsaved changes on the page were lost" : ""); },
    "router-factory": function () { return "Factory reset the router"; },
    "router-firmware": function () { return "Checked for firmware updates: " + a.text; },
    "router-ask": function () { return "Asked " + t.who + ": " + a.q + (a.lost ? " (unsaved changes on the page were lost)" : ""); },
    osinst: function () { return osLog(a); },
    mac: function () { return macLog(a); },
    newphone: function () { return npLog(a); },
    safety: function () { const r = a.res || {}; return a.value != null ? r.text : r.label + (r.text ? ": " + r.text : ""); }
  }[a.type];
  if (say) logT(t.id, host + ": " + say());
}

/* what installing an operating system looks like on the ticket's log */
function osLog(a) {
  const r = a.res || {}, ok = r.ok !== false;
  const L2 = {
    key: function () { return a.key === "F2" ? "Pressed F2 for the firmware Setup" : a.key === "F12" ? "Pressed F12 for the Boot Menu" : a.key === "retry" ? "Pressed a key to try starting again" : "Let it start from its boot order"; },
    bootfrom: function () { return "Started it from " + ({ disk: "the drive", usb: "the installer USB", pxe: "the network (PXE): no server answered" })[a.entry]; },
    "fw-set": function () { return "Firmware: changed " + ({ uefi: "the boot mode", secureBoot: "Secure Boot", tpmOn: "the TPM setting" })[a.key] + " (not saved yet)"; },
    "fw-order": function () { return "Firmware: moved a device in the boot order (not saved yet)"; },
    "fw-save": function () { return r.changed ? "Firmware: saved the changes" : "Firmware: left it, with no changes"; },
    "fw-discard": function () { return "Firmware: left it, discarding any changes"; },
    "ws-lang": function () { return "Windows Setup: language settings"; },
    "ws-option": function () { return a.choice === "repair" ? "Windows Setup: opened Repair my PC" : r.unsupported ? "Windows Setup: this PC can't run Windows 11" : ok ? "Windows Setup: Install Windows 11, everything on the drive to be deleted" : "Windows Setup: the box confirming the drive will be wiped wasn't ticked"; },
    "ws-key": function () { return a.none ? "Windows Setup: no product key" : ok ? "Windows Setup: typed a product key" : "Windows Setup: that product key didn't work"; },
    "ws-edition": function () { return "Windows Setup: chose " + a.edition; },
    "ws-terms": function () { return "Windows Setup: accepted the licence terms"; },
    "ws-back": function () { return "Windows Setup: went back a screen"; },
    "ws-delete": function () { return "Windows Setup: deleted a partition"; },
    "ws-format": function () { return "Windows Setup: formatted a partition"; },
    "ws-next": function () { return ok ? "Windows Setup: chose where to install" : r.mbr ? "Windows Setup refused: the disk is MBR, and this PC starts in UEFI mode" : "Windows Setup refused that location"; },
    "ws-install": function () { return "Windows Setup: copied Windows to the drive"; },
    restart: function () { return "Restarted it"; },
    "oobe-region": function () { return "First-run setup: region"; },
    "oobe-name": function () { return ok ? "First-run setup: named it " + r.name : "First-run setup: that name isn't allowed"; },
    "oobe-how": function () { return "First-run setup: " + (a.how === "work" ? "set up for work or school" : "set up for personal use"); },
    "oobe-entra": function () { return "First-run setup: tried a Microsoft Entra ID sign-in: no such account"; },
    "oobe-domain-instead": function () { return "First-run setup: Sign-in options › Domain join instead"; },
    "oobe-local": function () { return ok ? "First-run setup: created a local account" : "First-run setup: that user name isn't allowed"; },
    "oobe-privacy": function () { return "First-run setup: accepted the privacy settings. Windows is ready"; },
    "oobe-msa": function () { return "First-run setup: signed in with a personal Microsoft account"; },
    "oobe-back": function () { return "First-run setup: went back a screen"; },
    "oobe-opts": function () { return "First-run setup: " + (r.ok ? "opened or closed Sign-in options" : "Sign-in options"); },
    rename: function () { return ok ? "System Properties: " + (a.member === "domain" ? "joined the RAFIKI domain, named " : "named it ") + String(a.name || "").trim().toUpperCase() + " (takes effect at a restart)" : "System Properties: " + (r.text || "not changed"); },
    signin: function () { return ok ? "The user signed in with their own domain account" : "The sign-in was refused"; },
    "media-in": function () { return "Plugged in the installer USB"; },
    shrink: function () { return ok ? "Disk Management: shrank C: by " + a.mb + " MB" : "Disk Management: " + (r.text || "the shrink was refused"); },
    newvol: function () { return "Disk Management: made a new NTFS volume in the free space"; },
    delvol: function () { return ok ? "Disk Management: deleted a volume" : "Disk Management: " + (r.text || "refused"); },
    grub: function () { return "GRUB: chose " + ({ ubuntu: "Ubuntu", advanced: "Advanced options for Ubuntu", windows: "Windows Boot Manager", firmware: "UEFI Firmware Settings" })[a.pick]; },
    "ub-try": function () { return "Ubuntu USB: Try or Install Ubuntu"; },
    "ub-lang": function () { return "Ubuntu installer: language and keyboard"; },
    "ub-what": function () { return ok ? "Ubuntu installer: Install Ubuntu" : "Ubuntu installer: Try Ubuntu (nothing installed)"; },
    "ub-how": function () { return ok ? "Ubuntu installer: " + ({ alongside: "install alongside Windows Boot Manager", erase: "erase disk and install Ubuntu", manual: "manual installation" })[a.how] : "Ubuntu installer: " + (r.text || "not enough free space to install alongside"); },
    "ub-manual": function () { return ok ? "Ubuntu installer: chose a partition for /" : "Ubuntu installer: that partition setup was refused"; },
    "ub-account": function () { return ok ? "Ubuntu installer: account, computer name " + a.host : "Ubuntu installer: the account details weren't accepted"; },
    "ub-back": function () { return "Ubuntu installer: went back a screen"; },
    "ub-install": function () { return "Ubuntu installer: installed Ubuntu 24.04.1 LTS"; },
    "ub-restart": function () { return "Ubuntu installer: restarted"; },
    "ub-signin": function () { return "Ubuntu: the user signed in"; },
    "ub-cmd": function () { return "Ubuntu Terminal: $ " + a.line; },
    "media-out": function () { return "Took the Windows 11 installer USB out"; }
  }[a.op];
  return L2 ? L2() : "Setup: " + a.op;
}
function npLog(a) {
  const r = a.res || {}, ok = r.ok !== false;
  const L2 = {
    power: function () { return a.how === "hold" ? "Pressed and held the power button" : "Pressed the power button" + (r.text ? ": " + r.text : ""); },
    charger: function () { return a.on ? "Plugged in the USB-C charger" : "Unplugged the charger"; },
    menu: function () { return { off: "Power menu: powered off", restart: "Power menu: restarted", cancel: "Closed the power menu" }[a.pick]; },
    qr: function () { return "Device management: showed the enrolment QR code"; },
    tap: function () { return "Tapped the welcome screen six times: the QR set-up opened"; },
    start: function () { return "Welcome screen: Start"; },
    scan: function () { return ok ? "Scanned the enrolment QR code" : "Tried to scan: nothing to scan"; },
    cancel: function () { return "Stopped the set-up: back to the welcome screen"; },
    wifi: function () { return ok ? "Joined " + a.ssid : "Couldn't join " + a.ssid; },
    offline: function () { return "Chose Set up offline"; },
    "dont-copy": function () { return "Copy apps & data: Don't copy"; },
    "sign-in": function () { return a.email === "afw#setup" ? "Typed afw#setup at the sign-in: the device policy app installed" : "Sign-in refused"; },
    "skip-account": function () { return "Skipped the Google Account"; },
    accept: function () { return "Accepted: the organisation owns this phone (fully managed)"; },
    lock: function () { return ok ? (r.done ? "Set-up finished" + (a.kind === "skip" ? " with no screen lock" : " with a " + (a.kind === "pin" ? "PIN" : "password")) + (r.enrol === "managed" ? "" : ", not enrolled") : "Screen lock set") : "Screen lock refused: " + (m0(a) || "see the phone"); },
    unlock: function () { return ok ? "Unlocked the phone" : "Wrong PIN at the lock screen"; },
    "work-profile": function () { return "Added a work account: a work profile"; },
    update: function () { return ok ? "Installed the security update " + "(the phone restarted)" : "The update didn't install: " + (r.text || "refused"); },
    erase: function () { return "Erased all data (factory reset)"; }
  }[a.op];
  const out = L2 ? L2() : "Phone: " + a.op;
  return out;
}
function m0(a) { return a.res && a.res.text; }
function macLog(a) {
  const r = a.res || {}, ok = r.ok !== false;
  const L2 = {
    power: function () { return a.how === "hold" ? "Pressed and held the power button: startup options" : ok ? "Pressed the power button" : "Pressed the power button: " + (r.text || "nothing new"); },
    shutdown: function () { return "Shut the Mac down"; },
    startup: function () { return a.pick === "options" ? "Startup options: Options (macOS Recovery)" : "Startup options: started up from Macintosh HD"; },
    "recovery-user": function () { return ok ? "macOS Recovery: unlocked as " + a.user : "macOS Recovery: that user name or password was refused"; },
    utility: function () { return "macOS Recovery: opened " + ({ du: "Disk Utility", tm: "Restore from Time Machine", reinstall: "Reinstall macOS Sequoia", safari: "Safari" })[a.which]; },
    back: function () { return "Back to macOS Recovery"; },
    erase: function () { return "Disk Utility: erased Macintosh HD as " + a.fmt; },
    activate: function () { return ok ? "Activated the Mac" : r.locked ? "Activate Mac: stopped by Activation Lock" : "Activate Mac: that Apple Account was refused"; },
    release: function () { return "Mason released Activation Lock in device management"; },
    "tm-restore": function () { return "Restored the Mac from the Time Machine backup"; },
    "ri-continue": function () { return "Reinstall macOS: continue"; }, "ri-agree": function () { return "Reinstall macOS: agreed to the licence"; },
    "ri-disk": function () { return ok ? "Reinstall macOS: chose Macintosh HD" : "Reinstall macOS: the disk was refused (not APFS)"; },
    "ri-install": function () { return r.kept ? "Reinstalled macOS over the old account and files" : "Reinstalled macOS Sequoia"; },
    login: function () { return "Login window: the password was refused"; }
  }[a.op];
  return L2 ? L2() : "Mac: " + a.op;
}
function subj(id) { const e = emailById(id); return e ? e.subject : id; }

/* Remote Desktop Connection: type the computer's name, as technicians do. */
function drawMstsc(w) {
  const b = w.body; b.innerHTML = ""; const box = el("div"); box.style.padding = "1rem 1.1rem";
  box.appendChild(el("p", null, "Type the name of the computer to connect to."));
  const lab = el("label", null, "Computer:"); const inp = el("input", "field"); inp.id = "mstsc-in"; lab.setAttribute("for", "mstsc-in"); inp.placeholder = "e.g. WS4-FIN";
  const err = el("p", "err"); err.hidden = true; err.setAttribute("role", "alert");
  function go() {
    const v = inp.value.trim(); const r = ROSTER.filter(function (x) { return x.id !== "TECH" && (x.host.toLowerCase() === v.toLowerCase() || x.ip === v); })[0];
    if (!r) { err.hidden = false; err.textContent = "Remote Desktop can't find the computer \"" + v + "\". Check the name and try again."; return; }
    closeWin("mstsc"); connect(r.id);
  }
  inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); go(); } });
  const row = el("div", "t-acts"); row.appendChild(btn("Connect", "b pri", go));
  [lab, inp, err, row].forEach(function (x) { box.appendChild(x); }); b.appendChild(box); setTimeout(function () { inp.focus(); }, 0);
}

/* =====================================================================
   CRAWL, WALK, RUN — the owner's method (1 October 2026).

   CRAWL: the first ticket of a sim. Mason walks the student through it
   one step at a time, from a panel docked beside the windows: what to
   do, why, and exactly where to click. Each step waits until the
   student has really done it on the machine. Nothing is done for them.
   WALK and RUN come after (walk: the checklist; run: on your own).
   ===================================================================== */
const LEVEL = { SF1: "crawl", SF2: "walk", FS1: "crawl", FS2: "walk", OI1: "crawl", OI2: "walk", L1: "crawl", L2: "walk", D1: "crawl", D2: "walk", M1: "crawl", M2: "walk", E1: "crawl", E2: "walk", R1: "crawl", R2: "walk", W1: "crawl", W2: "walk", P1: "crawl", P2: "walk", N1: "crawl", N2: "walk", WR1: "crawl", WR2: "walk", CE1: "crawl", CE2: "walk", CR1: "crawl", CR2: "walk", X1: "crawl", X2: "walk", MB1: "crawl", MB2: "walk" };
function coachTag(name, b) { b.dataset.coach = name; return b; }
function rd(id) { return document.querySelector('[data-win="rdp:' + id + '"]'); }
function evs(id) { const m = E.machine(id); return (m && m.events) || []; }
function lastAt(id, test) { const e = evs(id).filter(test); return e.length ? e[e.length - 1].at : -1; }

const WALKS = {
  L1: { machine: "WS4", steps: [
    { tag: "See it for yourself", win: "helpdesk",
      say: "Read Farah's request on the ticket. She says Testing shows an error box as soon as she opens it, and that Brenda and John can still use it. Then press Assign to me and start.",
      why: "The user's own words are your first evidence. \"Others can use it\" already tells you the problem is on her PC, not the server.",
      target: function () { return document.querySelector('[data-coach="assign"]'); },
      done: function () { const t = E.ticket(); return !!(t && t.id === "L1" && E.T()); } },
    { tag: "See it for yourself", win: "helpdesk",
      say: "Connect to her PC. Press Connect to WS4-FIN on the ticket. Farah accepts, and her screen opens in a window on your laptop.",
      why: "Remote support lets you work on her PC from your desk, with her watching.",
      target: function () { return W["rdp:WS4"] ? null : document.querySelector('[data-coach="connect"]'); },
      waiting: function () { return W["rdp:WS4"] && W["rdp:WS4"].phase === "wait" ? "Connecting… waiting for Farah to accept." : null; },
      done: function () { return !!(W["rdp:WS4"] && W["rdp:WS4"].phase === "on"); } },
    { tag: "See it for yourself", win: "rdp:WS4",
      say: "Reproduce the problem. On Farah's desktop, click the Testing icon and read the message that comes up.",
      why: "Never fix what you haven't seen. The message usually names the problem.",
      target: function () { const r = rd("WS4"); return r && r.querySelector('[aria-label="Open the Testing shortcut on the desktop"]'); },
      done: function () { return lastAt("WS4", function (e) { return e.kind === "launch" && e.app === "Testing"; }) >= 0; } },
    { tag: "See it for yourself", win: "rdp:WS4",
      say: "Read it: \"MSVCP100.dll is missing from your computer. Try reinstalling the program.\" Press OK.",
      why: "A DLL is a file of code a program loads as it starts. MSVCP100.dll comes with the program's Visual C++ runtime. Windows' own message suggests the fix.",
      target: function () { const r = rd("WS4"); return r && r.querySelector(".w-dialog button"); },
      weak: true, done: function () { const r = rd("WS4"); return !!r && !r.querySelector(".w-dialog"); } },
    { tag: "Find the evidence", win: "rdp:WS4",
      say: "Check what Windows recorded. On Farah's PC, press Start, type event, and open Event Viewer.",
      why: "Event Viewer is Windows' own record of what went wrong, and when. A ticket note that cites it is worth far more than \"it was broken\".",
      target: function () { const r = rd("WS4"); if (!r) return null; return r.querySelector('[aria-label="Open Event Viewer"]') || r.querySelector(".tb-start"); },
      done: function () { return lastAt("WS4", function (e) { return e.kind === "view-log"; }) >= 0; } },
    { tag: "Find the evidence", win: "rdp:WS4",
      say: "In the Application log, click the row marked Error and read it underneath.",
      why: "It names the program (Testing.exe) and the faulting module (MSVCP100.dll): the same file as the message. Two pieces of evidence that agree.",
      target: function () { const r = rd("WS4"); return r && r.querySelector(".ev-row.lvl-err"); },
      done: function () { const r = rd("WS4"); return !!(r && r.querySelector(".ev-row.sel.lvl-err")); } },
    { tag: "Work out the cause, and the safe fix", win: "rdp:WS4",
      say: "The cause: a file Testing needs is missing. The safe Tier 1 fix is to reinstall Testing, which puts its files back. Press Start, type software, and open Software Center.",
      why: "At Tier 1 you never copy DLLs into Windows or register them. Those are system changes, and copying the wrong one makes things worse. Reinstalling the program is safe and approved.",
      target: function () { const r = rd("WS4"); if (!r) return null; return r.querySelector('[aria-label="Open Software Center"]') || r.querySelector(".tb-start"); },
      done: function () { const r = rd("WS4"); return !!(r && r.querySelector('section.win[aria-label="Software Center"]')); } },
    { tag: "Fix it", win: "rdp:WS4",
      say: "Find Testing 4.2 in the list and press Reinstall.",
      why: "Software Center is Rafiki's list of approved programs. Anyone can reinstall from it, so no admin password is needed.",
      target: function () { const r = rd("WS4"); return r && r.querySelector('[aria-label="Reinstall Testing 4.2"]'); },
      done: function () { return lastAt("WS4", function (e) { return e.kind === "repair-app" && e.app === "Testing"; }) >= 0; } },
    { tag: "Test it", win: "rdp:WS4",
      say: "Test it. Press OK, then Desktop on Farah's taskbar, and open Testing again.",
      why: "A fix isn't finished until you've seen it work.",
      target: function () { const r = rd("WS4"); if (!r) return null; return r.querySelector(".w-dialog button") || r.querySelector('[aria-label="Open the Testing shortcut on the desktop"]') || r.querySelector('[aria-label="Show the desktop"]'); },
      done: function () { const fix = lastAt("WS4", function (e) { return e.kind === "repair-app"; }); return fix >= 0 && lastAt("WS4", function (e) { return e.kind === "launch" && e.app === "Testing" && e.result === "ok"; }) > fix; } },
    { tag: "Close it out", win: "helpdesk",
      say: "Testing opens. Go back to Help Desk (it's on your taskbar) and press Resolve.",
      why: "Resolving tells Farah it's fixed. She checks it, and the ticket moves on to the write-up.",
      target: function () { return document.querySelector('[data-coach="resolve"]'); },
      done: function () { const st = E.T(); return !!(st && st.stage !== "work"); } },
    { tag: "Document it", win: "helpdesk",
      say: "Record the cause. Pick the one that fits everything you saw: the message, the Event Viewer entry, and what fixed it.",
      why: "The cause on a ticket is how the next technician, or a report, finds out what really happens on this network.",
      target: function () { return document.querySelector("[data-win=helpdesk] .opts"); },
      done: function () { const st = E.T(); return !!(st && (st.closeOK || st.stage === "done")); } },
    { tag: "Document it", win: "helpdesk",
      say: "Write the resolution notes: what the error said, what you did, and that you tested it. Then press Close the ticket.",
      why: "For example: \"Testing said MSVCP100.dll was missing. Reinstalled Testing from Software Center. Tested: it opens.\" Use your own words.",
      target: function () { return document.querySelector("#res-note"); },
      done: function () { const st = E.state().tickets.L1; return !!(st && st.stage === "done"); } }
  ], end: "That's the crawl: you saw it, found the evidence, worked out the cause, fixed it the safe way, tested it, and wrote it up. Next is Brenda's PayWise ticket, where you drive and I give you the checklist. After that you're on your own, and I'll check in if you get stuck." }  ,
  /* ------------------------------------------------ L2: the walk */
  L2: { mode: "walk", machine: "WS2", steps: [
    { goal: "Take the ticket", win: "helpdesk", how: "In Help Desk, open Brenda's ticket and press Assign to me and start.",
      done: function () { const t = E.ticket(); return !!(t && t.id === "L2" && E.T()); } },
    { goal: "Get on Brenda's PC", win: "helpdesk", how: "Use the button on her ticket that starts a remote support session.",
      done: function () { return !!(W["rdp:WS2"] && W["rdp:WS2"].phase === "on"); } },
    { goal: "See the error for yourself", win: "rdp:WS2", how: "Run the program she says is broken, and read the message word for word.",
      done: function () { return lastAt("WS2", function (e) { return e.kind === "launch" && e.app === "PayWise"; }) >= 0; } },
    { goal: "Find what Windows recorded", win: "rdp:WS2", how: "The same tool you used on Farah's PC. On Brenda's PC, search for it from Start.",
      done: function () { return lastAt("WS2", function (e) { return e.kind === "view-log"; }) >= 0; } },
    { goal: "Fix it the Tier 1 way", win: "rdp:WS2", how: "Think back to Farah's ticket: what is Tier 1 allowed to do when one program won't start? Tier 1 never copies system files.",
      done: function () { return lastAt("WS2", function (e) { return e.kind === "repair-app" && e.app === "PayWise"; }) >= 0; } },
    { goal: "Test it", win: "rdp:WS2", how: "Run PayWise again on her PC. A fix isn't finished until you've seen it work.",
      done: function () { const fix = lastAt("WS2", function (e) { return e.kind === "repair-app"; }); return fix >= 0 && lastAt("WS2", function (e) { return e.kind === "launch" && e.app === "PayWise" && e.result === "ok"; }) > fix; } },
    { goal: "Resolve the ticket", win: "helpdesk", how: "Back in Help Desk, on Brenda's ticket.",
      done: function () { const st = E.state().tickets.L2; return !!(st && st.stage !== "work"); } },
    { goal: "Record the cause", win: "helpdesk", how: "Pick the cause that fits the message, what Windows recorded, and what fixed it.",
      done: function () { const st = E.state().tickets.L2; return !!(st && (st.closeOK || st.stage === "done")); } },
    { goal: "Write the resolution notes", win: "helpdesk", how: "Name the file the error named, say what you did, and that you tested it. Your own words.",
      done: function () { const st = E.state().tickets.L2; return !!(st && st.stage === "done"); } }
  ], end: "You walked it: you drove, and the checklist only told you what came next. From here on you run them yourself. I'll check in if you get stuck, and \"I'm stuck\" in chat always gets you a pointer." },

  /* ------------------------------------------------ D1: the crawl */
  D1: { machine: "WS1", steps: [
    { tag: "See it for yourself", win: "helpdesk",
      say: "Read John's request. Since last night's software deployment, Testing won't work on his PC, though it works for others. He also mentions a blue screen last week. Press Assign to me and start.",
      why: "There are two clues here. Part of this job is working out which one matters.",
      target: function () { return document.querySelector('[data-coach="assign"]'); },
      done: function () { const t = E.ticket(); return !!(t && t.id === "D1" && E.T()); } },
    { tag: "See it for yourself", win: "helpdesk",
      say: "Connect to John's PC. Press Connect to WS1-HR on the ticket.",
      why: "John accepts, and his screen opens on your laptop.",
      target: function () { return W["rdp:WS1"] ? null : document.querySelector('[data-coach="connect"]'); },
      waiting: function () { return W["rdp:WS1"] && W["rdp:WS1"].phase === "wait" ? "Connecting… waiting for John to accept." : null; },
      done: function () { return !!(W["rdp:WS1"] && W["rdp:WS1"].phase === "on"); } },
    { tag: "See it for yourself", win: "rdp:WS1",
      say: "Reproduce it. Click Testing on John's desktop and read the message.",
      why: "It's the same message Farah had, but this time a deployment is involved, and the sim's answer to that is not what it seems.",
      target: function () { const r = rd("WS1"); return r && r.querySelector('[aria-label="Open the Testing shortcut on the desktop"]'); },
      done: function () { return lastAt("WS1", function (e) { return e.kind === "launch" && e.app === "Testing"; }) >= 0; } },
    { tag: "See it for yourself", win: "rdp:WS1",
      say: "\"MSVCP100.dll is missing from your computer.\" Press OK.",
      why: "MSVCP100.dll belongs to the Visual C++ 2010 runtime, a set of files many programs share.",
      target: function () { const r = rd("WS1"); return r && r.querySelector(".w-dialog button"); },
      weak: true, done: function () { const r = rd("WS1"); return !!r && !r.querySelector(".w-dialog"); } },
    { tag: "Find the evidence", win: "rdp:WS1",
      say: "Open Event Viewer on John's PC: press Start, type event, and open it.",
      why: "The sim's first question is which Event Viewer entry records the problem, so you'll be answering it from the real log.",
      target: function () { const r = rd("WS1"); if (!r) return null; return r.querySelector('[aria-label="Open Event Viewer"]') || r.querySelector(".tb-start"); },
      done: function () { return lastAt("WS1", function (e) { return e.kind === "view-log"; }) >= 0; } },
    { tag: "Find the evidence", win: "rdp:WS1",
      say: "The Application log holds last night's entries. Click the Error at 10:35, index 2190, and read it.",
      why: "Index 2187, just before it, is the deployment installing successfully. 2190 is Testing failing on MSVCP100.dll. The newest Error is the one you just caused by reproducing the problem.",
      target: function () { const r = rd("WS1"); return r && [].slice.call(r.querySelectorAll(".ev-row")).filter(function (x) { return x.lastChild && x.lastChild.textContent === "2190"; })[0]; },
      done: function () { const r = rd("WS1"); return !!(r && [].slice.call(r.querySelectorAll(".ev-row.sel")).some(function (x) { return x.lastChild && x.lastChild.textContent === "2190"; })); } },
    { tag: "Rule out the other clue", win: "rdp:WS1",
      say: "John mentioned a blue screen. Press System in Event Viewer and read the BugCheck entry.",
      why: "It's dated 24 February, a week before the deployment, and it blames a driver (strt1.sys). The timing rules it out. A clue that doesn't fit the timeline isn't the cause.",
      target: function () { const r = rd("WS1"); return r && [].slice.call(r.querySelectorAll(".ev-nav button")).filter(function (x) { return x.textContent === "System"; })[0]; },
      done: function () { return lastAt("WS1", function (e) { return e.kind === "view-log" && e.log === "System"; }) >= 0; } },
    { tag: "Find where the file is", win: "rdp:WS1",
      say: "Now find out where msvcp100.dll actually is. Press Start, type cmd, and choose Run as administrator.",
      why: "John is a standard user, so Windows will ask for an admin. Copying into Program Files needs an administrator, and so do runtime installers.",
      target: function () { const r = rd("WS1"); if (!r) return null; return r.querySelector('[aria-label="Run Command Prompt as administrator"]') || r.querySelector(".tb-start"); },
      done: function () { const r = rd("WS1"); return !!(r && (r.querySelector(".w-dialog.uac-creds") || r.querySelector('section.win[aria-label^="Administrator"]'))); } },
    { tag: "Find where the file is", win: "rdp:WS1",
      say: "Windows asks for an admin. Type RAFIKI\\itadmin as the user name and Bench-Tech-2026 as the password, then press Yes.",
      why: "This is the User Account Control prompt. A standard user can't approve system changes; an admin's name and password can.",
      target: function () { const r = rd("WS1"); return r && r.querySelector(".w-dialog.uac-creds input"); },
      done: function () { const r = rd("WS1"); return !!(r && r.querySelector('section.win[aria-label^="Administrator"]')); } },
    { tag: "Find where the file is", win: "rdp:WS1", cmd: "dir C:\\Windows\\SysWOW64\\msvcp100.dll",
      say: "Look for the 32-bit copy. Type this and press Enter:",
      why: "Testing is a 32-bit program: it lives in Program Files (x86). On 64-bit Windows, 32-bit programs load their DLLs from SysWOW64. \"File Not Found\" means the 32-bit copy is gone.",
      target: function () { const r = rd("WS1"); return r && r.querySelector(".con-in"); },
      done: function () { return typed(/^dir\s+"?c:\\windows\\syswow64\\msvcp100\.dll"?$/); } },
    { tag: "Find where the file is", win: "rdp:WS1", cmd: "dir C:\\Windows\\System32\\msvcp100.dll",
      say: "Now look in System32:",
      why: "It's there, but this is the 64-bit copy. The names are the opposite of what you'd guess: System32 holds 64-bit files, and SysWOW64 holds 32-bit ones.",
      target: function () { const r = rd("WS1"); return r && r.querySelector(".con-in"); },
      done: function () { return typed(/^dir\s+"?c:\\windows\\system32\\msvcp100\.dll"?$/); } },
    { tag: "Try the sim's answer", win: "rdp:WS1", cmd: "robocopy \\\\WS4-FIN\\C$\\Windows\\System32 \"C:\\Program Files (x86)\\Testing\" msvcp100.dll",
      say: "The Application Deployment sim's answer is to copy msvcp100.dll from another PC's System32 into Testing's folder. Try it, to see what happens. Type:",
      why: "This is a deliberate wrong turn, so you see why it fails. It copies the file from Farah's PC (WS4-FIN) over the network.",
      target: function () { const r = rd("WS1"); return r && r.querySelector(".con-in"); },
      done: function () { return lastAt("WS1", function (e) { return e.kind === "copy" && /testing/i.test(e.to || ""); }) >= 0; } },
    { tag: "Try the sim's answer", win: "rdp:WS1", cmd: "Testing",
      say: "Run Testing from the prompt:",
      why: "Watch the error change.",
      target: function () { const r = rd("WS1"); return r && r.querySelector(".con-in"); },
      done: function () { return lastAt("WS1", function (e) { return e.kind === "launch" && e.app === "Testing" && e.result === "bitness"; }) >= 0; } },
    { tag: "Try the sim's answer", win: "rdp:WS1", cmd: "regsvr32 msvcp100.dll",
      say: "0xc000007b means wrong bitness: a 32-bit program found a 64-bit DLL. Press OK. Then try the sim's second step:",
      why: "Windows looks in the program's own folder first, so the wrong copy is found before anything else. Now watch regsvr32.",
      target: function () { const r = rd("WS1"); return r && (r.querySelector(".w-dialog button") || r.querySelector(".con-in")); },
      done: function () { return typed(/^regsvr32\s+msvcp100\.dll$/); } },
    { tag: "Undo the wrong turn", win: "rdp:WS1", cmd: "del \"C:\\Program Files (x86)\\Testing\\msvcp100.dll\"",
      say: "regsvr32 fails as well: a runtime DLL isn't a COM component, so there's nothing to register. Now remove the wrong copy you put in Testing's folder:",
      why: "Leave a stray DLL in a program's folder and the next technician inherits a mystery. Clean up your own wrong turns.",
      target: function () { const r = rd("WS1"); return r && r.querySelector(".con-in"); },
      done: function () { const copied = lastAt("WS1", function (e) { return e.kind === "copy"; }); return copied >= 0 && !M.findFile(E.machine("WS1"), "C:\\Program Files (x86)\\Testing", "msvcp100.dll"); } },
    { tag: "Fix it", win: "rdp:WS1", cmd: "\\\\FS01\\Software\\vcredist_x86_2010.exe",
      say: "The real cause: last night's deployment removed the 32-bit Visual C++ 2010 runtime. Its installer is on the file server's Software share. Run it:",
      why: "Putting the runtime back restores the 32-bit msvcp100.dll in SysWOW64, the right copy in the right place. Installers need an admin, which is why you're in an administrator prompt.",
      target: function () { const r = rd("WS1"); return r && r.querySelector(".con-in"); },
      done: function () { return lastAt("WS1", function (e) { return e.kind === "install-runtime" && e.key === "vc2010x86"; }) >= 0; } },
    { tag: "Test it", win: "rdp:WS1", cmd: "Testing",
      say: "Test it:",
      why: "Testing should open now.",
      target: function () { const r = rd("WS1"); return r && r.querySelector(".con-in"); },
      done: function () { const fix = lastAt("WS1", function (e) { return e.kind === "install-runtime"; }); return fix >= 0 && lastAt("WS1", function (e) { return e.kind === "launch" && e.app === "Testing" && e.result === "ok"; }) > fix; } },
    { tag: "Close it out", win: "helpdesk",
      say: "Testing opens. Go back to Help Desk on your taskbar and press Resolve.",
      why: "John checks it, and the ticket moves on to the write-up.",
      target: function () { return document.querySelector('[data-coach="resolve"]'); },
      done: function () { const st = E.state().tickets.D1; return !!(st && st.stage !== "work"); } },
    { tag: "Document it", win: "helpdesk",
      say: "Answer the sim's own question: which Event Viewer entry records the problem?",
      why: "You read it yourself in step 6.",
      target: function () { return document.querySelector("[data-win=helpdesk] .opts"); },
      done: function () { const st = E.state().tickets.D1; return !!(st && (st.closeOK || st.stage === "done")); } },
    { tag: "Document it", win: "helpdesk",
      say: "Write the resolution notes: the Event Viewer entry, the missing file, what you tried that failed, and the fix that worked. Then press Close the ticket.",
      why: "For example: \"Event 2190: Testing failed on MSVCP100.dll. The System32 copy is 64-bit and gave 0xc000007b, so I removed it. Installed the x86 Visual C++ 2010 runtime from FS01. Tested: it opens.\"",
      target: function () { return document.querySelector("#res-note"); },
      done: function () { const st = E.state().tickets.D1; return !!(st && st.stage === "done"); } }
  ], end: "That's the deployment crawl. You read the real log, ruled out the blue screen on timing, saw the sim's old answer fail with 0xc000007b, cleaned up after it, and put back the right runtime. The other deployment tickets are yours to run, and I'll check in if you get stuck." }  ,
  /* ------------------------------------------------ D2: the walk */
  D2: { mode: "walk", machine: "WS4", steps: [
    { goal: "Take the ticket", how: "In Help Desk, open Farah's PayWise ticket and press Assign to me and start.",
      done: function () { const t = E.ticket(); return !!(t && t.id === "D2" && E.T()); } },
    { goal: "Get on Farah's PC", how: "Use the button on her ticket that starts a remote support session.",
      done: function () { return !!(W["rdp:WS4"] && W["rdp:WS4"].phase === "on"); } },
    { goal: "See the error for yourself", how: "Run PayWise on her PC and read the message word for word. Which file does it name?",
      done: function () { return lastAt("WS4", function (e) { return e.kind === "launch" && e.app === "PayWise"; }) >= 0; } },
    { goal: "Find what Windows recorded", how: "The same tool as on John's PC. On Farah's PC, search for it from Start.",
      done: function () { return lastAt("WS4", function (e) { return e.kind === "view-log"; }) >= 0; } },
    { goal: "Open a prompt that can make system changes", how: "Farah already reinstalled PayWise and it didn't help, so this is beyond a program repair. Installing a runtime needs an administrator. Mason has the admin details.",
      done: function () { const r = rd("WS4"); return !!(r && r.querySelector('section.win[aria-label^="Administrator"]')) || lastAt("WS4", function (e) { return e.kind === "install-runtime"; }) >= 0; } },
    { goal: "Work out which copy of the file is missing", how: "PayWise lives in Program Files (x86). Which folder do programs from there load their DLLs from? Look in that folder for the file the error named, and in the other one too.",
      done: function () { return typed(/^(dir|ls|get-childitem)\s.*(syswow64|system32)/) || (L.lines.D2 || []).some(function (x) { return /powershell\s.*(syswow64|system32)/.test(x); }); } },
    { goal: "Put the right runtime back", how: "The installers are on the file server's Software share. Pick the one that matches PayWise's bitness: the other one installs fine and changes nothing.",
      done: function () { return lastAt("WS4", function (e) { return e.kind === "install-runtime" && e.key === "vc2015x86"; }) >= 0; } },
    { goal: "Test it", how: "Run PayWise again on her PC.",
      done: function () { const fix = lastAt("WS4", function (e) { return e.kind === "install-runtime" && e.key === "vc2015x86"; }); return fix >= 0 && lastAt("WS4", function (e) { return e.kind === "launch" && e.app === "PayWise" && e.result === "ok"; }) > fix; } },
    { goal: "Resolve the ticket", how: "Back in Help Desk, on Farah's ticket.",
      done: function () { const st = E.state().tickets.D2; return !!(st && st.stage !== "work"); } },
    { goal: "Record the cause", how: "Pick the cause that fits the message, the folder the file was missing from, and what fixed it.",
      done: function () { const st = E.state().tickets.D2; return !!(st && (st.closeOK || st.stage === "done")); } },
    { goal: "Write the resolution notes", how: "Name the missing file, which bitness, and how you put it back. Say you tested it.",
      done: function () { const st = E.state().tickets.D2; return !!(st && st.stage === "done"); } }
  ], end: "You walked a deployment ticket: the program's own reinstall couldn't help, so you found which copy was missing and put back the right runtime as an admin. The rest of the deployment tickets are yours to run." },

  /* ---------------- Malware: the sim itself, CompTIA's seven steps ---------------- */
  M1: { machine: "WS2", steps: [
    { tag: "1. Investigate and verify", win: "helpdesk",
      say: "Read Mason's incident report on the ticket: Brenda in Sales installed a PDF editor that wasn't approved, her PC is crawling, and the file server is slow. Then press Assign to me and start.",
      why: "Every clue in that report matters: the unapproved download, her PC, and the file server. Malware that reaches a server can reach everyone.",
      target: function () { return document.querySelector('[data-coach="assign"]'); },
      done: function () { const t = E.ticket(); return !!(t && t.id === "M1" && E.T()); } },
    { tag: "1. Investigate and verify", win: "helpdesk",
      say: "Start with Brenda's PC. In Devices on the ticket, press Connect on WS2-SALES.",
      why: "You can look at a PC remotely without touching anything. Looking never costs you anything.",
      target: function () { return goRemote("WS2"); },
      waiting: function () { return W["rdp:WS2"] && W["rdp:WS2"].phase === "wait" ? "Connecting… waiting for Brenda to accept." : null; },
      done: function () { return !!(W["rdp:WS2"] && W["rdp:WS2"].phase === "on") || opened("WS2", "taskmgr"); } },
    { tag: "1. Investigate and verify", win: "rdp:WS2",
      say: "See what's making it crawl. On Brenda's PC press Start, type task, and open Task Manager.",
      why: "\"Slow\" is a symptom. Task Manager shows what is actually using the processor.",
      target: function () { return dlg("WS2") || tool("WS2", "Task Manager"); },
      done: function () { return opened("WS2", "taskmgr"); } },
    { tag: "1. Investigate and verify", win: "rdp:WS2",
      say: "Click the CPU column to sort by it, then click the process at the top. Read \"What is this process?\" underneath: where it runs from, and who published it.",
      why: "It calls itself Service Host, but Windows' real one is svchost.exe, in System32, signed by Microsoft. This is SCVHOST.exe, letters swapped, in Brenda's AppData folder, with no publisher.",
      target: function () { return dlg("WS2") || tool("WS2", "Task Manager") || inWin("WS2", "Task Manager", function (w) { const th = w.querySelector('th[aria-sort="descending"] .th-btn'); return th && /CPU/.test(th.textContent) ? w.querySelector("tbody tr") : byText(w, /CPU/); }); },
      done: function () { return !!inWin("WS2", "Task Manager", function (w) { const i = w.querySelector(".tm-info"); return i && /SCVHOST\.exe/.test(i.textContent) ? w : null; }); } },
    { tag: "1. Investigate and verify", win: "rdp:WS2",
      say: "Check what Windows recorded. Press Start, type event, open Event Viewer, and switch to the System log. Read the newest entry.",
      why: "Event 7045: a new service, PDF Pro Updater, installed from that same AppData folder. That's why it runs at every start-up. The Application log also shows the User Account Control prompt Brenda allowed for setup.exe.",
      target: function () { return dlg("WS2") || tool("WS2", "Event Viewer") || inWin("WS2", "Event Viewer", function (w) { return byText(w, /^System$/); }); },
      done: function () { return viewed("WS2", "System"); } },
    { tag: "1. Investigate and verify", win: "rdp:WS2",
      say: "Find where it came from. Press Start, type browser, and open Microsoft Edge: it opens on the history.",
      why: "totally-legit-soft.net/download/setup.exe, two minutes before the service appeared. The history, the UAC prompt and the new service tell one story.",
      target: function () { return dlg("WS2") || tool("WS2", "Microsoft Edge"); },
      done: function () { return lastAt("WS2", function (e) { return e.kind === "view-history"; }) >= 0; } },
    { tag: "1. Investigate and verify", win: "helpdesk",
      say: "Now the file server. In Devices, press Connect on FS01.",
      why: "The report says the server slowed down at the same time. Never assume one infected PC is the only one.",
      target: function () { return goRemote("FS01"); },
      waiting: function () { return W["rdp:FS01"] && W["rdp:FS01"].phase === "wait" ? "Connecting to FS01…" : null; },
      done: function () { return !!(W["rdp:FS01"] && W["rdp:FS01"].phase === "on") || opened("FS01", "taskmgr"); } },
    { tag: "1. Investigate and verify", win: "rdp:FS01",
      say: "On FS01, open Task Manager, then Event Viewer's System log.",
      why: "The same SCVHOST.exe, running as SYSTEM. The log shows a flood of file-share traffic from 192.168.1.22 (that's WS2), then \"Unknown executable written\" into the Contracts share. It spread from Brenda's PC.",
      target: function () { return dlg("FS01") || (opened("FS01", "taskmgr") ? (tool("FS01", "Event Viewer") || inWin("FS01", "Event Viewer", function (w) { return byText(w, /^System$/); })) : tool("FS01", "Task Manager")); },
      done: function () { return inspected(mw("FS01")) && viewed("FS01", "System"); } },
    { tag: "1. Investigate and verify", win: function () { const id = nextUnchecked(); return id && W["rdp:" + id] && W["rdp:" + id].phase === "on" ? "rdp:" + id : "helpdesk"; },
      say: "Check the other five the same way: Connect, then Task Manager and Event Viewer on each. The Devices list ticks each one off.",
      why: "Things will look odd at a glance: Docker on Dev's PC, a blocked macro on Farah's, Spotify eating memory at reception, a failed admin login on the mail server. Read each one. Every one has an innocent explanation, and a PC is only clean once you've looked.",
      target: function () { const id = nextUnchecked(); if (!id) return null; if (!scr(id)) return goRemote(id); return dlg(id) || (opened(id, "taskmgr") ? tool(id, "Event Viewer") : tool(id, "Task Manager")); },
      waiting: function () { const n = OTHER5.filter(function (id) { return inspected(E.machine(id)); }).length; return n < 5 ? "Checked " + n + " of 5." : null; },
      done: function () { return OTHER5.every(function (id) { return inspected(E.machine(id)); }); } },
    { tag: "2. Quarantine", win: "helpdesk",
      list: "Quarantine the infected PCs, Brenda's first",
      say: "Two PCs are infected: WS2 and FS01. Take Brenda's PC off the network first. Walk to her desk (Walk to the desk, in Devices), check the network cable, and unplug it.",
      why: "While it's on the network it can keep spreading, and every step after this is safer with it isolated. Pulling the cable is certain, and you can see it's done.",
      target: function () { return goDesk("WS2") || hand("unplug") || hand("check-cable"); },
      done: function () { return prog("WS2").quarantined; } },
    { tag: "2. Quarantine", win: "helpdesk",
      say: "Now the file server. Walk back, then walk to the closet, and unplug FS01's cable from the switch.",
      why: "Disabling its network adapter (Network Connections, or netsh) would also isolate it, but it ends any remote session at once. At the rack you can see it's done.",
      target: function () { return goDesk("FS01") || hand("unplug") || hand("check-cable"); },
      done: function () { return prog("FS01").quarantined; } },
    { tag: "3. Disable System Restore", win: "helpdesk",
      say: "Back to Brenda's desk: it's off the network, so you work at the PC now. Press Start, type restore, open System Properties, and choose Configure: Disable system protection. Mason has the admin details for the UAC box.",
      why: "Restore points are copies of the system, and they can hold the infection; one restore could bring it all back. Turning protection off deletes them. FS01 is a server: Windows Server has no System Restore (it's backed up with Windows Server Backup), so this step is for WS2 only.",
      target: function () { return goDesk("WS2") || dlg("WS2") || tool("WS2", "System Properties") || inWin("WS2", "System Properties", function (w) { return byText(w, /Disable system protection/); }); },
      done: function () { return !mw("WS2").restore.enabled || prog("WS2").removed; } },
    { tag: "4. Remediate", win: "helpdesk",
      say: "Plug the USB stick from your bench into Brenda's PC.",
      why: "Her definitions are a month old, and new malware isn't in them. She's off the network, so the update comes on a stick: Microsoft's offline definitions package, mpam-fe.exe.",
      target: function () { return goDesk("WS2") || hand("usb-in"); },
      done: function () { const m = mw("WS2"); return !!m.usb || m.av.current; } },
    { tag: "4. Remediate", win: "helpdesk",
      say: "Update the definitions. Open File Explorer, go to the USB drive (DEFS (E:)), select mpam-fe.exe and press Open.",
      why: "A scan is only as good as its definitions. Scanning first would have come back \"No current threats\", and you'd have believed it.",
      target: function () { return goDesk("WS2") || dlg("WS2") || tool("WS2", "File Explorer") || inWin("WS2", "File Explorer", function (w) { return w.querySelector('[aria-label="Open mpam-fe.exe"]') || w.querySelector('[aria-label="File mpam-fe.exe"]') || w.querySelector('[aria-label^="Go to the USB drive"]'); }); },
      done: function () { return mw("WS2").av.current; } },
    { tag: "4. Remediate", win: "helpdesk",
      say: "Scan and remove. Open Windows Security and run the Microsoft Defender Offline scan.",
      why: "SCVHOST.exe is running, and its service restarts it, so Windows can't delete it from inside Windows. The offline scan restarts the PC and scans before Windows loads, when nothing is running to protect it.",
      target: function () { return goDesk("WS2") || dlg("WS2") || tool("WS2", "Windows Security") || inWin("WS2", "Windows Security", function (w) { return byText(w, /Microsoft Defender Offline scan/); }); },
      done: function () { return prog("WS2").removed; } },
    { tag: "4. Remediate", win: "helpdesk",
      say: "Do the same on FS01: walk to the closet, plug in the USB stick, update the definitions from it, then run the Offline scan.",
      why: "The same threat, the same order. On a server, schedule the restart with the business if you can: here it's down already.",
      target: function () { const m = mw("FS01"); return goDesk("FS01") || dlg("FS01") || (!m.usb && !m.av.current ? hand("usb-in") : !m.av.current ? (tool("FS01", "File Explorer") || inWin("FS01", "File Explorer", function (w) { return w.querySelector('[aria-label="Open mpam-fe.exe"]') || w.querySelector('[aria-label="File mpam-fe.exe"]') || w.querySelector('[aria-label^="Go to the USB drive"]'); })) : (tool("FS01", "Windows Security") || inWin("FS01", "Windows Security", function (w) { return byText(w, /Microsoft Defender Offline scan/); }))); },
      done: function () { return prog("FS01").removed; } },
    { tag: "5. Schedule scans and run updates", win: "helpdesk",
      say: "Schedule scans on both. In Windows Security, under Scheduled scan, turn it on. Start with the PC you're at.",
      why: "Remediation isn't finished until protection keeps running on its own.",
      target: function () { const id = pickHere(["WS2", "FS01"], function (x) { return !prog(x).scheduled; }); if (!id) return null; return goDesk(id) || dlg(id) || tool(id, "Windows Security") || inWin(id, "Windows Security", function (w) { return byText(w, /^Turn on \(every day/); }); },
      done: function () { return prog("WS2").scheduled && prog("FS01").scheduled; } },
    { tag: "5. Schedule scans and run updates", win: "helpdesk",
      say: "They're clean: put both back on the network. Check the cable and plug it back in, at Brenda's desk and at the rack.",
      why: "Back on the network, they can get their updates, and Brenda and the whole office can work again.",
      target: function () { const id = pickHere(["WS2", "FS01"], function (x) { return !MW.online(E.machine(x)); }); if (!id) return null; return goDesk(id) || hand("plug-in") || hand("check-cable"); },
      done: function () { return ["WS2", "FS01"].every(function (x) { return prog(x).removed && MW.online(E.machine(x)); }); } },
    { tag: "5. Schedule scans and run updates", win: "helpdesk",
      say: "Run Windows Update on both: Start, type update, Check for updates. They're on the network now, so you can do it from your desk by remote, or where you stand.",
      why: "Updates close the holes malware gets in through, and bring the definitions up to date the normal way.",
      target: function () { const id = pickHere(["WS2", "FS01"], function (x) { return !prog(x).updated; }); if (!id) return null; if (!scr(id)) return goRemote(id); return dlg(id) || tool(id, "Windows Update") || inWin(id, "Windows Update", function (w) { return byText(w, /Check for updates/); }); },
      done: function () { return prog("WS2").updated && prog("FS01").updated; } },
    { tag: "6. Enable System Restore, create a restore point", win: "helpdesk",
      say: "On Brenda's PC, open System Properties again, turn system protection back on, then Create a restore point.",
      why: "Now the PC is clean, a restore point is a known-good copy to come back to. Made earlier, it would have saved the infection with it.",
      target: function () { if (!scr("WS2")) return goRemote("WS2"); const m = mw("WS2"); return dlg("WS2") || tool("WS2", "System Properties") || inWin("WS2", "System Properties", function (w) { return m.restore.enabled ? byText(w, /Create a restore point/) : byText(w, /Turn on system protection/); }); },
      done: function () { return prog("WS2").restoreBack; } },
    { tag: "7. Educate the end user", win: "helpdesk",
      say: "Every PC is checked and both infected ones are clean. Walk back if you're out, then press Resolve on the ticket.",
      why: "The ticket only resolves when every machine really is done, in order.",
      target: function () { if (walkUI) return document.querySelector(".wo-back"); return document.querySelector('[data-coach="resolve"]'); },
      done: function () { const st = E.state().tickets.M1; return !!(st && st.stage !== "work"); } },
    { tag: "7. Educate the end user", win: "helpdesk",
      say: "The last of CompTIA's steps: what do you tell Brenda? Pick the advice on the ticket.",
      why: "Clean-up fixes today. What the user does next time stops it happening again.",
      target: function () { return document.querySelector("[data-win=helpdesk] .opts"); },
      done: function () { const st = E.state().tickets.M1; return !!(st && (st.closeOK || st.stage === "done")); } },
    { tag: "Document it", win: "helpdesk",
      say: "Write the resolution notes: what you found and where, the order you did the steps in on each PC, and what you told Brenda. Then close the ticket.",
      why: "The next technician, or an auditor, reads this. It's your record that it was done properly.",
      target: function () { return document.getElementById("res-note"); },
      done: function () { const st = E.state().tickets.M1; return !!(st && st.stage === "done"); } }
  ], end: "That was CompTIA's malware-removal process, end to end, across a whole network: investigate, quarantine, disable System Restore, remediate, schedule scans and update, a fresh restore point, and the user. The next malware ticket is a walk." }

};

/* Helpers for the Malware crawl, where the work moves between PCs, remote
   sessions and the walk-over. Each returns the one thing to press next,
   or null when nothing needs pressing there. */
const OTHER5 = ["WS1", "WS3", "WS4", "WS5", "MAIL01"];
function scr(id) { const w = W["rdp:" + id]; if (w && w.phase === "on") return rd(id); if (walkUI && walkUI.id === id) return document.querySelector(".wo-monitor"); return null; }
function goRemote(id) { if (walkUI) return document.querySelector(".wo-back"); return W["rdp:" + id] && W["rdp:" + id].phase === "on" ? null : document.querySelector('[data-coach="dev-connect-' + id + '"]'); }
function goDesk(id) { if (walkUI) return walkUI.id === id ? null : document.querySelector(".wo-back"); return document.querySelector('[data-coach="dev-walk-' + id + '"]'); }
function dlg(id) { const s = scr(id); const d = s && s.querySelector(".w-dialog:not(.run)"); if (!d) return null; const inp = Array.from(d.querySelectorAll("input")).filter(function (i) { return !i.value; })[0]; return inp || d.querySelector(".primary") || d.querySelector("button"); }
function tool(id, name) { const s = scr(id); if (!s || s.querySelector('section.win[aria-label^="' + name + '"]')) return null; return s.querySelector('[aria-label="Open ' + name + '"]') || s.querySelector(".tb-start"); }
function inWin(id, name, pick) { const s = scr(id); const w = s && s.querySelector('section.win[aria-label^="' + name + '"]'); return w ? pick(w) : null; }
function byText(r, re) { return r ? Array.from(r.querySelectorAll("button")).filter(function (b) { return re.test(b.textContent.trim()); })[0] || null : null; }
function hand(name) { return document.querySelector('.wo-hands [data-coach="' + name + '"]'); }
function opened(id, app) { return lastAt(id, function (e) { return e.kind === "opened" && e.app === app; }) >= 0; }
function viewed(id, log) { return lastAt(id, function (e) { return e.kind === "view-log" && (!log || e.log === log); }) >= 0; }
function prog(id) { return MW.progress(E.machine(id)); }
function mw(id) { return MW.ready(E.machine(id)); }
function nextUnchecked() { return OTHER5.filter(function (id) { return !inspected(E.machine(id)); })[0] || null; }
/* of the PCs still needing something, the one the student is at first */
function pickHere(ids, need) { const left = ids.filter(need); if (walkUI && left.indexOf(walkUI.id) >= 0) return walkUI.id; return left.filter(function (id) { return scr(id); })[0] || left[0] || null; }
/* A crawl's steps only count on its own ticket: on the clean office every
   PC is online, which would look like the last steps were done. */
/* WALK for a malware ticket: CompTIA's steps as a checklist the student
   drives, across however many PCs the ticket infected. The "How?"
   pointers say where to look and why, never which PC or which button. */
function malWalk(id, who) {
  const t = TICKETS.filter(function (x) { return x.id === id; })[0], hit = t.infects;
  const on = function () { const c = E.ticket(); return !!(c && c.id === id); };
  const all = function (f) { return on() && hit.every(function (x) { return f(prog(x), x); }); };
  const st = function () { return E.state().tickets[id]; };
  return { mode: "walk", machine: t.machine, steps: [
    { goal: "Check every PC on the network", how: "Connect to each one from Devices on the ticket and look at Task Manager and Event Viewer. The list ticks each PC off when you've looked at both.",
      done: function () { return on() && t.devices.every(function (x) { return inspected(E.machine(x)); }); } },
    { goal: "Find what's slowing " + who + "'s PC, and where it came from", how: "What is using the processor, where does it run from, and who published it? Then what Windows recorded when it was installed, and what " + who + " was doing in the browser just before.",
      done: function () { return on() && opened(t.machine, "taskmgr") && viewed(t.machine, "System") && lastAt(t.machine, function (e) { return e.kind === "view-history"; }) >= 0; } },
    { goal: "Quarantine every infected PC", how: "Before you change anything on it. You have to be at the PC to be certain it's off the network.",
      done: function () { return all(function (p) { return p.quarantined; }); } },
    { goal: "Disable System Restore where it applies", how: "Before you remediate: old restore points can hold the infection. Servers don't have it.",
      done: function () { return all(function (p) { return p.restoreOff; }); } },
    { goal: "Remediate: update the definitions, then scan and remove", how: "The PC is offline, so the update can't come from the internet: there's something on your bench for that. Then a scan that runs when Windows isn't.",
      done: function () { return all(function (p) { return p.removed; }); } },
    { goal: "Schedule scans, put it back on the network, run updates", how: "Protection that keeps running on its own, then the PC back where its user can work, then everything up to date.",
      done: function () { return all(function (p) { return p.scheduled && p.online && p.updated; }); } },
    { goal: "System Restore back on, with a fresh restore point", how: "Only once the PC is clean, so the new point is a clean one. Servers don't have it.",
      done: function () { return all(function (p) { return p.restoreBack; }); } },
    { goal: "Resolve the ticket", how: "In Help Desk, on the ticket. It only resolves when every PC is done.",
      done: function () { return on() && !!(st() && st().stage !== "work"); } },
    { goal: "Educate " + who, how: "What would stop this happening again? Pick it on the ticket.",
      done: function () { return on() && !!(st() && (st().closeOK || st().stage === "done")); } },
    { goal: "Write the resolution notes", how: "What you found and where, the order of the steps on each PC, and what you told " + who + ".",
      done: function () { return on() && !!(st() && st().stage === "done"); } }
  ], end: "You walked a malware incident: every PC checked, the infected one cleaned in CompTIA's order, and the user told how to avoid it. The rest of the malware tickets are yours to run." };
}
WALKS.M2 = malWalk("M2", "John");

/* ----- Email: E1 is the sim itself, crawled; E2 is walked ----- */
function mailWin() { return document.querySelector("[data-win=mail]"); }
function mailSel(id) { const w = W.mail; return !!(w && w.ui && w.ui.sel === id); }
/* the message in Mail: open Mail, show the Inbox, select it */
function toMsg(id) {
  const mw = mailWin(); if (!mw) return document.querySelector('[data-coach="open-mail"]');
  if (W.mail.ui && W.mail.ui.folder !== "inbox") return byText(mw, /^Inbox/);
  if (!mailSel(id)) { const e = emailById(id); return Array.from(mw.querySelectorAll(".mx-it")).filter(function (b) { return b.textContent.indexOf(e.subject) >= 0; })[0] || null; }
  return null;
}
function triBtn(id, which, label) { const c = document.querySelector('[data-win=helpdesk] .tri-card[data-mail="' + id + '"]'); if (!c) return document.querySelector('[data-coach="open-mail"]') ? null : null;
  const g = c.querySelector('.tri-q[aria-label^="' + (which === "cat" ? "1." : "2.") + '"]'); return g ? Array.from(g.querySelectorAll("button")).filter(function (b) { return b.textContent.indexOf(label) >= 0; })[0] || null : null; }
function rightTell(id) { return emailById(id).tell.options.filter(function (o) { return o.correct; })[0].label; }
function triOf(id) { return MX.tri(E.fleet(), id); }
function admin() { return document.querySelector("[data-win=mailadmin]"); }
function toAdmin() { return admin() ? null : document.querySelector('[data-coach="open-admin"]'); }
function mailSteps(id, who, cat, catName) {
  const e = emailById(id), st = [];
  st.push({ tag: "Read it", win: "mail", say: "In Mail, open " + who + "'s forward: \"" + e.subject + "\".", why: "Read it the way an attacker hopes nobody will: slowly.",
    target: function () { return toMsg(id); }, done: function () { return mailSel(id) || triOf(id).cat === e.cat; } });
  if (/http/.test(e.body) || (e.links || []).length) st.push({ tag: "Read it", win: "mail", say: "Point at the link (or tab to it). Don't click it. Read where it really goes, in the line at the bottom of Mail.", why: "A link's words can say anything. Where it really goes is the truth, and you can read it without opening it.",
    target: function () { return toMsg(id) || (mailWin() && mailWin().querySelector(".mx-link")); }, weak: true, done: function () { return !!(L.peek && L.peek[id]) || triOf(id).cat === e.cat; } });
  if ((e.attach || []).length) st.push({ tag: "Read it", win: "mail", say: "Read the attachment's full name. Don't open it.", why: "The end of a file's name says what it really is.",
    target: function () { return toMsg(id) || (mailWin() && mailWin().querySelector(".mx-attn")); }, weak: true, done: function () { return mailSel(id) || triOf(id).cat === e.cat; } });
  st.push({ tag: "What is it?", win: "helpdesk", say: "On the ticket, say what it is: " + catName + ".", why: CATS_WHY[cat],
    target: function () { return triBtn(id, "cat", catName); }, done: function () { return triOf(id).cat === e.cat; } });
  st.push({ tag: "What gives it away?", win: "helpdesk", say: "Pick the giveaway: \"" + rightTell(id) + "\".", why: "The other five are the things people notice first. They're either fakeable or don't decide it.",
    target: function () { return triBtn(id, "tell", rightTell(id)); }, done: function () { return triOf(id).tell; } });
  return st;
}
const CATS_WHY = { legit: "It comes from where it says, and asks for nothing risky.", spam: "Unwanted marketing: it wants a sale, not a password or a download.", phishing: "It pretends to be someone trusted to get a password typed in.", malicious: "It wants something downloaded and run on the PC." };
WALKS.E1 = { machine: "TECH", steps: [
  { tag: "Start", win: "helpdesk", say: "Read the ticket: four staff forwarded emails asking \"is this safe?\". Press Assign to me and start.", why: "Every one of these is somebody about to click. Your answer decides what they do next.",
    target: function () { return document.querySelector('[data-coach="assign"]'); }, done: function () { const t = E.ticket(); return !!(t && t.id === "E1" && E.T()); } },
  { tag: "Start", win: "helpdesk", say: "Open Mail, from the ticket or the taskbar. That's the help desk mailbox, where staff forward suspicious email.", why: "The forwards are your evidence. Nothing in them gets opened, only read.",
    target: function () { return document.querySelector('[data-coach="open-mail"]'); }, done: function () { return !!W.mail; } }
].concat(mailSteps("msreset", "John", "phishing", "Phishing"), [
  { tag: "Deal with it", win: "mail", say: "In Mail, with John's forward open, press Report: phishing.", why: "Reporting sends it to the security team, who block what it links to.",
    target: function () { return toMsg("msreset") || byText(mailWin(), /^Report: phishing$/); }, done: function () { return triOf("msreset").report === "phishing"; } },
  { tag: "Deal with it", win: "mailadmin", say: "Others may have it too. Open Mail admin, and in Search and purge type the subject's first word:", cmd: "Microsoft", why: "Purging pulls it out of every mailbox it reached, before anyone else clicks.",
    target: function () { const a = admin(); if (!a) return toAdmin(); const q = a.querySelector("#mxa-q"); return q && !q.value ? q : byText(a, /^Purge from every mailbox$/); }, done: function () { return MX.state(E.fleet()).purged.indexOf("msreset") >= 0; } }
], mailSteps("faster", "Dev", "malicious", "Malicious"), [
  { tag: "Deal with it", win: "mail", say: "Report Dev's forward as phishing too: Report: phishing is how anything malicious reaches the security team.", why: "Junk would only hide it from Dev.",
    target: function () { return toMsg("faster") || byText(mailWin(), /^Report: phishing$/); }, done: function () { return triOf("faster").report === "phishing"; } },
  { tag: "Deal with it", win: "mailadmin", say: "Purge it from every mailbox: search for", cmd: "Faster", why: "Someone else may be about to download it.",
    target: function () { const a = admin(); if (!a) return toAdmin(); const q = a.querySelector("#mxa-q"); return q && !/faster/i.test(q.value) ? q : byText(a, /^Purge from every mailbox$/); }, done: function () { return MX.state(E.fleet()).purged.indexOf("faster") >= 0; } },
  { tag: "Deal with it", win: "mailadmin", say: "Block the domain that sent it, in Blocked senders and domains:", cmd: "maxspeed-pcfixer.com", why: "Malicious senders try again. Blocking the domain stops the next one arriving at all.",
    target: function () { const a = admin(); if (!a) return toAdmin(); const q = a.querySelector("#mxa-block"); return q; }, done: function () { return MX.state(E.fleet()).blocked.indexOf("maxspeed-pcfixer.com") >= 0; } }
], mailSteps("slim", "Rosa", "spam", "Spam"), [
  { tag: "Deal with it", win: "mail", say: "Rosa's is just marketing. Press Report: junk.", why: "Junk moves it out of the way and teaches the filter. It isn't a security incident, so the security team doesn't need it.",
    target: function () { return toMsg("slim") || byText(mailWin(), /^Report: junk$/); }, done: function () { return triOf("slim").report === "junk"; } }
], mailSteps("statement", "Farah", "legit", "Legitimate"), [
  { tag: "Deal with it", win: "mail", say: "Farah's is genuine. Reply to her: it's genuine, go ahead.", why: "Telling people when something is safe matters as much as warning them. Otherwise they stop asking.",
    target: function () { return toMsg("statement") || byText(mailWin(), /^Reply to Farah/); }, done: function () { return triOf("statement").safe; } },
  { tag: "Close it out", win: "helpdesk", say: "All four are dealt with. Press Resolve on the ticket.", why: "It only resolves when every email has been handled properly.",
    target: function () { return document.querySelector('[data-coach="resolve"]'); }, done: function () { const st = E.state().tickets.E1; return !!(st && st.stage !== "work"); } },
  { tag: "Close it out", win: "helpdesk", say: "Pick what you'd send all staff after this morning.", why: "One clear habit, for everyone, stops the next one.",
    target: function () { return document.querySelector("[data-win=helpdesk] .res .opts"); }, done: function () { const st = E.state().tickets.E1; return !!(st && (st.closeOK || st.stage === "done")); } },
  { tag: "Close it out", win: "helpdesk", say: "Write the resolution notes: each email, what it was, what gave it away, and what you did.", why: "The record of what reached the office and what was done about it.",
    target: function () { return document.getElementById("res-note"); }, done: function () { const st = E.state().tickets.E1; return !!(st && st.stage === "done"); } }
]), end: "That's the sim, all four kinds: phishing reported and purged, malware purged and blocked, spam junked, and the genuine one confirmed. The next mail ticket is a walk." };
function mailWalk(id) {
  const t = TICKETS.filter(function (x) { return x.id === id; })[0];
  const on = function () { const c = E.ticket(); return !!(c && c.id === id); };
  const st = function () { return E.state().tickets[id]; };
  const how = { legit: "Who really sent it, where its link goes, and does it match something they did? Then let them know.", spam: "Who's it from and what does it want? Then make sure it stops reaching them.", phishing: "Where does its link really go? Then make sure nobody else falls for it either.", malicious: "What does it want opened or run? Then make sure it never arrives again, for anyone." };
  return { mode: "walk", machine: "TECH", steps: t.mails.map(function (e) {
    return { goal: "Triage " + staffOf(e.to).first + "'s \"" + e.subject + "\"", how: how[e.cat], done: function () { return on() && emailDone(E.fleet(), e); } };
  }).concat([
    { goal: "Resolve the ticket", how: "In Help Desk, on the ticket.", done: function () { return on() && !!(st() && st().stage !== "work"); } },
    { goal: "Tell the staff what to watch for", how: "Pick it on the ticket.", done: function () { return on() && !!(st() && (st().closeOK || st().stage === "done")); } },
    { goal: "Write the resolution notes", how: "Each email: what it was, the giveaway, and what you did.", done: function () { return on() && !!(st() && st().stage === "done"); } }
  ]), end: "You walked the help desk mailbox. The rest of the mail tickets, including three that can't be forwarded, are yours to run." };
}
WALKS.E2 = mailWalk("E2");
/* ---------------------------------------- the router crawl and walk */
function rwin() { return document.querySelector("[data-win=router]"); }
function rr(id) { return RT.get(E.fleet(), id); }
function rAt(id, test) { const r = rr(id); if (!r) return -1; const e = r.events.filter(test); return e.length ? e[e.length - 1].at : -1; }
function rTab(name) { const w = rwin(); return w ? byText(w.querySelector(".rt-tabs"), new RegExp("^" + name + "$")) : null; }
function rBtn(re) { const w = rwin(); return w ? byText(w, re) : null; }
function adminFormTarget() { const w = rwin(); if (!w) return null; const empty = ["rt-acur", "rt-anew", "rt-aagain"].map(function (i) { return w.querySelector("#" + i); }).filter(function (x) { return x && !x.value; })[0]; return empty || rBtn(/^Change admin password$/); }
function strongOnPage(id) { const r = rr(id); return !!(r && RT.strong(r.form.admin.pass, r.sticker.pass)); }
function strongSaved(id) { const r = rr(id); return !!(r && RT.strong(r.saved.admin.pass, r.sticker.pass)); }
function strongRunning(id) { const r = rr(id); return !!(r && RT.strong(r.running.admin.pass, r.sticker.pass)); }
function lookedAfterRestart(id) { const boot = rAt(id, function (e) { return e.kind === "reboot"; }); return boot >= 0 && rAt(id, function (e) { return e.kind === "view" && e.tab === "status"; }) > boot; }
WALKS.R1 = { machine: "TECH", steps: [
  { tag: "See it for yourself", win: "helpdesk",
    say: "Read Leah's request. A replacement router, the internet already works, she's signed in with the sticker's details and wants it set up securely. Press Assign to me and start.",
    why: "\"Securely\" is the word to hold on to. Nothing is broken: this job is about who could get into the router.",
    target: function () { return document.querySelector('[data-coach="assign"]'); },
    done: function () { const t = E.ticket(); return !!(t && t.id === "R1" && E.T()); } },
  { tag: "See it for yourself", win: "helpdesk",
    say: "Leah has shared the router with us. Press Open the 92 Series app on the ticket.",
    why: "Customer routers are managed remotely: the customer shares access from their own app, and we work on it from here.",
    target: function () { return W.router ? null : document.querySelector('[data-coach="open-router"]'); },
    done: function () { return !!W.router; } },
  { tag: "Find the evidence", win: "router",
    say: "You're on the Status page. Read it: the internet is connected, and Leah's laptop and the printer are both on. Now press the Administration tab.",
    why: "Status first, always: it tells you what's working before you change anything, so you'll know if you break something.",
    target: function () { return rTab("Administration"); },
    done: function () { return rAt("R1", function (e) { return e.kind === "view" && e.tab === "admin"; }) >= 0; } },
  { tag: "Fix it", win: "router",
    say: "Change the admin password. The current one is the sticker's: admin. Make up a new one with 12 or more characters, upper and lower case, a number and a symbol. Type it twice, then press Change admin password.",
    why: "A model's default admin password is printed on every unit and published online. Until it's replaced with a strong one, anyone on Leah's network could sign in and take the router over.",
    target: adminFormTarget,
    done: function () { return strongOnPage("R1"); } },
  { tag: "Fix it", win: "router",
    say: "Look at the bar under the router's name: \"Not saved\". The router isn't using your new password yet. Press Save.",
    why: "What you type on a router's page is only on the page. Save writes it to the router.",
    target: function () { return rBtn(/^Save$/); },
    done: function () { return strongSaved("R1"); } },
  { tag: "Fix it", win: "router",
    say: "Now it says \"Saved, not running\". Press Restart router so it starts using it.",
    why: "A router runs the settings it loaded when it started. The Tier 1 sim's step two, \"save the changes and reboot\", is exactly this.",
    target: function () { return rBtn(/^Restart router$/); },
    done: function () { return strongRunning("R1"); } },
  { tag: "Test it", win: "router",
    say: "The bar says \"Running\". Open the Status tab and check nothing broke: the internet, Leah's laptop, the printer.",
    why: "A fix isn't finished until you've checked it worked and didn't break anything else.",
    target: function () { return rTab("Status"); },
    done: function () { return lookedAfterRestart("R1"); } },
  { tag: "Close it out", win: "helpdesk",
    say: "Back on Leah's ticket, press Resolve.",
    target: function () { return document.querySelector('[data-coach="resolve"]'); },
    done: function () { const st = E.state().tickets.R1; return !!(st && st.stage !== "work"); } },
  { tag: "Close it out", win: "helpdesk",
    say: "Record why the admin password came first. Pick the reason on the ticket that fits.",
    target: function () { return document.querySelector(".res .opts"); },
    done: function () { const st = E.state().tickets.R1; return !!(st && (st.closeOK || st.stage === "done")); } },
  { tag: "Document it", win: "helpdesk",
    say: "Write the resolution notes in your own words: what you changed, and how you made the router use it. Then press Close the ticket.",
    target: function () { return document.querySelector("#res-note"); },
    done: function () { const st = E.state().tickets.R1; return !!(st && st.stage === "done"); } }
], end: "That's the router crawl: status first, the one change that mattered, Save, restart, check, and the write-up. Priya's dental office is next: you drive, I give you the checklist." };
WALKS.R2 = { mode: "walk", machine: "TECH", steps: [
  { goal: "Take the ticket", how: "In Help Desk, on Priya's ticket.", done: function () { const t = E.ticket(); return !!(t && t.id === "R2" && E.T()); } },
  { goal: "Get into the router", how: "Priya shared it with us. The button is on her ticket.", done: function () { return !!W.router; } },
  { goal: "Find who could sign in today", how: "Which page holds the router's own password?", done: function () { return rAt("R2", function (e) { return e.kind === "view" && e.tab === "admin"; }) >= 0; } },
  { goal: "Replace the default with a strong password", how: "Twelve or more characters, mixed case, a number and a symbol. Not anything like the sticker.", done: function () { return strongOnPage("R2") || strongSaved("R2"); } },
  { goal: "Make the router actually use it", how: "Read the bar under the router's name. It tells you what's left.", done: function () { return strongRunning("R2"); } },
  { goal: "Check the card reader and front desk PC are still online", how: "The page that shows the internet and the devices.", done: function () { return lookedAfterRestart("R2"); } },
  { goal: "Resolve the ticket", how: "In Help Desk, on Priya's ticket.", done: function () { const st = E.state().tickets.R2; return !!(st && st.stage !== "work"); } },
  { goal: "Record why it had to be strong", how: "Pick it on the ticket.", done: function () { const st = E.state().tickets.R2; return !!(st && (st.closeOK || st.stage === "done")); } },
  { goal: "Write the resolution notes", how: "What you changed, why it's strong, how it took effect.", done: function () { const st = E.state().tickets.R2; return !!(st && st.stage === "done"); } }
], end: "You walked it. The rest of the router tickets are yours: a cable in the wrong port, a change nobody saved, and two that Tier 1 can't fix but must check first." };
/* ---------------------------------------- the wireless-reliability crawl and walk */
function wrSet(id, cfg, band, chan) { const r = rr(id); if (!r) return false; const w = r[cfg].wifi; return w.band === band && String(w.channel) === String(chan) && (w.security === "WPA3" || w.security === "WPA2" || w.security === "WPA2/WPA3"); }
function wrField() { const w = bwin(); if (!w) return null; const want = { "rt-band": "2.4", "rt-chan": "11", "rt-sec": "WPA3" }; return Object.keys(want).map(function (k) { return w.querySelector("#" + k); }).filter(function (x) { return x && x.value !== want[x.id]; })[0] || null; }
function wrMoved() { const r = rr("WR1"); return !!(r && RT.microwaveFromAP(r) >= 15); }
function signTarget(then) { const w = bwin(); if (!w) return null; const p = w.querySelector("#wb-pass"); if (p) return !p.value ? p : w.querySelector(".wb-login .b.pri"); return then(); }
WALKS.WR1 = { machine: "TECH", steps: [
  { tag: "See it for yourself", win: "helpdesk",
    say: "Read Mason's message. Four clues: it's worst at lunchtime; the break counter with the microwave is right against the closet wall; the walls are dense; only a couple of networks nearby. And someone's already tried 5 GHz. Press Assign to me and start.",
    why: "This is the Wireless Reliability lab's first variant, for real. Each clue points somewhere; your job is to make them all fit.",
    target: function () { return document.querySelector('[data-coach="assign"]'); },
    done: function () { const t = E.ticket(); return !!(t && t.id === "WR1" && E.T()); } },
  { tag: "Find the evidence", win: function () { return W.browser ? "browser" : "helpdesk"; },
    say: "Open 192.168.1.1 in the browser and sign in (admin, Clos3t-AP-2026). Status will show who's dropping, and why.",
    target: function () { return W.browser ? signTarget(function () { return null; }) : document.querySelector('[data-coach="open-web"]'); },
    done: function () { const r = rr("WR1"); return !!(r && r.events.some(function (e) { return e.kind === "sign-in"; })); } },
  { tag: "Find the evidence", win: "helpdesk",
    say: "Status says the Office 3 tablet keeps dropping on 5 GHz: the dense walls stop it. Now see the lunchtime clue for yourself: on the ticket, press Walk to the break room.",
    why: "Some causes are in the room, not in the settings. Go and look.",
    target: function () { return document.querySelector('[data-coach="walk-break"]'); },
    done: function () { return !!L.onSite.WR1 || wrMoved(); } },
  { tag: "Fix it", win: function () { return ""; },
    say: "There it is: the microwave on the counter, a few feet from the access point through the wall, running. On the floor plan below, move it across the room, well away from the access point (drag it, or select it and use the arrow keys; Shift moves four feet at a time).",
    why: "A microwave cooks at 2.45 GHz. Running beside an access point it drowns 2.4 GHz for the whole office; across the room, the damage shrinks to a patch around it.",
    target: function () { return document.querySelector(".wo-desk .fp-mw"); },
    done: function () { return wrMoved(); } },
  { tag: "Fix it", win: function () { return ""; },
    say: "Walk back to your desk.",
    target: function () { return document.querySelector(".wo-back"); },
    done: function () { return wrMoved() && !walkUI; } },
  { tag: "Fix it", win: "browser",
    say: "Now the access point. Open Wireless.",
    target: function () { return signTarget(function () { return bTab("Wireless"); }); },
    done: function () { const boot = rAt("WR1", function (e) { return e.kind === "microwave"; }); return rAt("WR1", function (e) { return e.kind === "view" && e.tab === "wireless"; }) > boot; } },
  { tag: "Fix it", win: "browser",
    say: "Set the band to 2.4 GHz (the dense walls), the channel to 11 (next door is on 1 and 6), and security to WPA3-Personal (it's on old WPA).",
    why: "With the microwave moved, 2.4 GHz gets through the walls cleanly. A fixed channel clear of the neighbours, and modern security, finish the plan.",
    target: wrField,
    done: function () { return wrSet("WR1", "form", "2.4", 11) || wrSet("WR1", "saved", "2.4", 11); } },
  { tag: "Fix it", win: "browser",
    say: "Press Save.",
    target: function () { return bBtn(/^Save$/); },
    done: function () { return wrSet("WR1", "saved", "2.4", 11); } },
  { tag: "Fix it", win: "browser",
    say: "Press Restart access point. Sign back in afterwards.",
    target: function () { return bBtn(/^Restart access point$/); },
    done: function () { return wrSet("WR1", "running", "2.4", 11); } },
  { tag: "Test it", win: "browser",
    say: "Sign back in and read Status: every device, including the Office 3 tablet, connected, and none crawling.",
    target: function () { return signTarget(function () { return bTab("Status"); }); },
    done: function () { return lookedAfterRestart("WR1"); } },
  { tag: "Close it out", win: "helpdesk",
    say: "Press Resolve on the ticket.",
    target: function () { return document.querySelector('[data-coach="resolve"]'); },
    done: function () { const st = E.state().tickets.WR1; return !!(st && st.stage !== "work"); } },
  { tag: "Close it out", win: "helpdesk",
    say: "Record why moving the microwave beat switching to 5 GHz.",
    target: function () { return document.querySelector(".res .opts"); },
    done: function () { const st = E.state().tickets.WR1; return !!(st && (st.closeOK || st.stage === "done")); } },
  { tag: "Document it", win: "helpdesk",
    say: "Write the notes: what was interfering, what you moved, and the band, channel and security you set. Then Close the ticket.",
    target: function () { return document.querySelector("#res-note"); },
    done: function () { const st = E.state().tickets.WR1; return !!(st && st.stage === "done"); } }
], end: "That's the lab's lunchtime variant done for real: the clue in the room, the band the walls allow, a clear channel, modern security, and proof on Status. Bright Path Design is next: you drive." };
WALKS.WR2 = { mode: "walk", machine: "TECH", steps: [
  { goal: "Take the ticket", how: "In Help Desk.", done: function () { const t = E.ticket(); return !!(t && t.id === "WR2" && E.T()); } },
  { goal: "Read the router's Wi-Fi scan", how: "On Status, in the 92 Series app.", done: function () { return rAt("WR2", function (e) { return e.kind === "view" && e.tab === "status"; }) >= 0; } },
  { goal: "Choose the band for a crowded neighbourhood", how: "How many clear channels does each band have? Is reach a problem in one open room?", done: function () { const r = rr("WR2"); return !!(r && ["form", "saved", "running"].some(function (c) { return r[c].wifi.band === "5"; })); } },
  { goal: "Fix the channel and keep security modern", how: "A fixed channel; nothing old or open.", done: function () { const r = rr("WR2"); return !!(r && ["form", "saved", "running"].some(function (c) { return r[c].wifi.channel !== "auto" && r[c].wifi.band === "5"; })); } },
  { goal: "Make the router use it", how: "The bar tells you what's left.", done: function () { const r = rr("WR2"); return !!(r && r.running.wifi.band === "5" && r.running.wifi.channel !== "auto"); } },
  { goal: "Prove it on Status", how: "Nobody crawling.", done: function () { return lookedAfterRestart("WR2"); } },
  { goal: "Resolve, record why, and write the notes", how: "In Help Desk.", done: function () { const st = E.state().tickets.WR2; return !!(st && st.stage === "done"); } }
], end: "You walked it. The rest are yours: a long hallway, fourteen networks, a concrete warehouse, and a clinic corridor." };
/* ---------------------------------------- the neighbouring-routers crawl and walk */
function nrSet(id, cfg, T) { const r = rr(id); if (!r) return false; const w = r[cfg].wifi; return w.ssid === T.ssid && w.pass === T.pass && w.security === "WPA3" && Number(w.width) === 20 && String(w.channel) === String(T.chan); }
function nrAllowed(id, cfg) { const r = rr(id); return !!(r && r[cfg].wifi.mac && r.devices.every(function (d) { return (r[cfg].wifi.allowed.indexOf(d.mac) >= 0) === !!d.approved; })); }
function nrField(id, T) { const w = rwin(); if (!w) return null; const want = { "rt-ssid": T.ssid, "rt-wpass": T.pass, "rt-sec": "WPA3", "rt-chan": String(T.chan), "rt-width": "20" }; return Object.keys(want).map(function (k) { return w.querySelector("#" + k); }).filter(function (x) { return x && x.value !== want[x.id]; })[0] || null; }
function nrAllowTarget(id) { const w = rwin(), r = rr(id); if (!w || !r) return null; const d = r.devices.filter(function (x) { return x.approved && r.form.wifi.allowed.indexOf(x.mac) < 0; })[0]; return d ? w.querySelector('[aria-label="Allow ' + d.name + '"]') : null; }
const N1T = { ssid: "HomeWiFi", pass: "MyCCR0ck2!", chan: 11 };
WALKS.N1 = { machine: "TECH", steps: [
  { tag: "See it for yourself", win: "helpdesk",
    say: "Read Jamie's request. Some settings are given exactly (the name, the password). The rest are decided by clues: \"most secure\", \"keep interference down\", \"only our own devices\", \"doesn't overlap the neighbours\". Press Assign to me and start.",
    why: "This is the exam's Neighboring Routers question, on a real router in a real street.",
    target: function () { return document.querySelector('[data-coach="assign"]'); },
    done: function () { const t = E.ticket(); return !!(t && t.id === "N1" && E.T()); } },
  { tag: "See it for yourself", win: "helpdesk",
    say: "Press Open the 92 Series app.",
    target: function () { return W.router ? null : document.querySelector('[data-coach="open-router"]'); },
    done: function () { return !!W.router; } },
  { tag: "See it for yourself", win: "helpdesk",
    say: "Press Look at the street in 3D. Router 3 is Jamie's, the blue house at the end. Each disc is a router's reach, in its channel's colour; where Jamie's reach meets a neighbour on an overlapping channel, the ground is striped red. The labels and the list underneath say the same in words.",
    why: "Wi-Fi goes through walls into the houses next door, so routers on overlapping channels share the air and take turns: that's the evening drop-outs.",
    target: function () { return document.querySelector('[data-coach="open-street"]'); },
    done: function () { return rAt("N1", function (e) { return e.kind === "view" && e.tab === "street"; }) >= 0; } },
  { tag: "Find the evidence", win: "router",
    say: "Read Status. The Wi-Fi scan shows Router 1 on channel 1 and Router 2 on channel 6, and the line under it says this router overlaps them. There's also an unknown tablet on Jamie's Wi-Fi. Now open Wireless.",
    why: "On 2.4 GHz only channels 1, 6 and 11 don't overlap. With the neighbours on 1 and 6, only one is left.",
    target: function () { return rTab("Wireless"); },
    done: function () { return rAt("N1", function (e) { return e.kind === "view" && e.tab === "wireless"; }) >= 0; } },
  { tag: "Fix it", win: "router",
    say: "Set each one: name HomeWiFi, password MyCCR0ck2!, security WPA3-Personal (the most secure), channel 11 (the one left), and channel width 20 MHz (narrower takes less room, so less interference). The ring moves as you go.",
    why: "A 40 MHz channel on 2.4 GHz takes twice the room and overlaps a neighbour whatever channel it's on.",
    target: function () { return nrField("N1", N1T); },
    done: function () { return nrSet("N1", "form", N1T) || nrSet("N1", "saved", N1T); } },
  { tag: "Fix it", win: "router",
    say: "\"Only our own devices\": tick MAC filtering.",
    why: "MAC filtering lets only devices on the allowed list join. Every device has its own MAC address.",
    target: function () { const w = rwin(); return w && w.querySelector("#rt-mac"); },
    done: function () { const r = rr("N1"); return !!(r && (r.form.wifi.mac || r.saved.wifi.mac)); } },
  { tag: "Fix it", win: "router",
    say: "Now allow Jamie's four: the laptop, both phones and the TV. Press Allow beside each. Leave the unknown tablet off the list.",
    why: "Turned on with an empty list, filtering would lock the family out too.",
    target: function () { return nrAllowTarget("N1"); },
    done: function () { return nrAllowed("N1", "form") || nrAllowed("N1", "saved"); } },
  { tag: "Fix it", win: "router",
    say: "Press Save.",
    target: function () { return rBtn(/^Save$/); },
    done: function () { return nrSet("N1", "saved", N1T) && nrAllowed("N1", "saved"); } },
  { tag: "Fix it", win: "router",
    say: "Press Restart router.",
    target: function () { return rBtn(/^Restart router$/); },
    done: function () { return nrSet("N1", "running", N1T) && nrAllowed("N1", "running"); } },
  { tag: "Test it", win: "router",
    say: "Read Status again: no overlap with the neighbours, the family's four connected, the unknown tablet blocked.",
    target: function () { return rTab("Status"); },
    done: function () { return lookedAfterRestart("N1"); } },
  { tag: "Test it", win: "helpdesk",
    say: "Look at the street again (Look at the street in 3D): Jamie's reach is green now, channel 11, and the red stripes are gone.",
    target: function () { return document.querySelector('[data-coach="open-street"]'); },
    done: function () { const boot = rAt("N1", function (e) { return e.kind === "reboot"; }); return boot >= 0 && rAt("N1", function (e) { return e.kind === "view" && e.tab === "street"; }) > boot; } },
  { tag: "Close it out", win: "helpdesk",
    say: "Press Resolve on Jamie's ticket.",
    target: function () { return document.querySelector('[data-coach="resolve"]'); },
    done: function () { const st = E.state().tickets.N1; return !!(st && st.stage !== "work"); } },
  { tag: "Close it out", win: "helpdesk",
    say: "Record why channel 11 at 20 MHz.",
    target: function () { return document.querySelector(".res .opts"); },
    done: function () { const st = E.state().tickets.N1; return !!(st && (st.closeOK || st.stage === "done")); } },
  { tag: "Document it", win: "helpdesk",
    say: "Write the notes: what you set, and why that channel, width and filtering. Then Close the ticket.",
    target: function () { return document.querySelector("#res-note"); },
    done: function () { const st = E.state().tickets.N1; return !!(st && st.stage === "done"); } }
], end: "That's the neighbours question done for real: read the scan, take the clear channel at 20 MHz, lock it to the family's devices, and prove it on Status. The Garcias are next: you drive." };
const N2T = { ssid: "Garcia-Home", pass: "Casa#2026Net", chan: 1 };
/* ---------------------------------------------- the Help Desk chats' crawl and walk */
function chatT(id) { return TICKETS.filter(function (x) { return x.id === id; })[0]; }
function chatAt(id) { const c = CH.get(E.fleet(), id); return c ? c.step : -1; }
function chatPast(id, i) { const t = E.ticket(); return !!(t && t.id === id && chatAt(id) > i); }
function ccOpts() { const w = document.querySelector("[data-win=custchat]"); return w ? w.querySelector(".cc-opts") : null; }
function mdmBtn(re) { return byText(document.querySelector("[data-win=mobile]"), re); }
function chatSteps(id, who, say) {
  /* the ticket, the chat window, then one step per item of the chat, then close-out */
  const t = chatT(id), out = [
    { tag: "See it for yourself", win: "helpdesk", say: say.open, why: "This is the exam's Help Desk chat, with a real customer and the real thing behind it.",
      target: function () { return document.querySelector('[data-coach="assign"]'); }, done: function () { const tt = E.ticket(); return !!(tt && tt.id === id && E.T()); } },
    { tag: "See it for yourself", win: "helpdesk", say: "Press Open the customer chat.", target: function () { return W.custchat ? null : document.querySelector('[data-coach="open-chat"]'); }, done: function () { return !!W.custchat; } }];
  t.chat.forEach(function (it, i) {
    const s = say.items[i];
    if (it.type === "reply") out.push({ tag: s.tag, win: "custchat", say: s.say, why: s.why, target: ccOpts, done: function () { return chatPast(id, i); } });
    else if (it.act === "compare") out.push({ tag: s.tag, win: function () { return W.mobile ? "mobile" : "custchat"; }, say: s.say, why: s.why,
      target: function () { if (!W.mobile) return document.querySelector("[data-win=custchat] .cc-tool"); return mdmBtn(/^Mail server$/); }, done: function () { return chatPast(id, i); } });
    else if (it.act === "sync") out.push({ tag: s.tag, win: function () { return W.mobile ? "mobile" : "custchat"; }, say: s.say, why: s.why,
      target: function () { if (!W.mobile) return document.querySelector("[data-win=custchat] .cc-tool"); return mdmBtn(/phone$/) && !document.querySelector("[data-win=mobile] .mdm-sync") ? mdmBtn(/phone$/) : mdmBtn(/^Sync now$/); }, done: function () { return chatPast(id, i); } });
    else out.push({ tag: s.tag, win: "custchat", say: s.say, why: s.why,
      target: function () { if (!W.router) return document.querySelector("[data-win=custchat] .cc-tool"); return rTab(it.label); }, done: function () { return chatPast(id, i); } });
  });
  out.push({ tag: "Close it out", win: "helpdesk", say: "Press Resolve on " + who + "'s ticket.", target: function () { return document.querySelector('[data-coach="resolve"]'); }, done: function () { const st = E.state().tickets[id]; return !!(st && st.stage !== "work"); } });
  out.push({ tag: "Close it out", win: "helpdesk", say: say.cause, target: function () { return document.querySelector(".res .opts"); }, done: function () { const st = E.state().tickets[id]; return !!(st && (st.closeOK || st.stage === "done")); } });
  out.push({ tag: "Document it", win: "helpdesk", say: say.note, target: function () { return document.querySelector("#res-note"); }, done: function () { const st = E.state().tickets[id]; return !!(st && st.stage === "done"); } });
  return out;
}
WALKS.CE1 = { machine: "TECH", steps: chatSteps("CE1", "Brenda", {
  open: "Read Brenda's ticket: she's started a chat about her email. Press Assign to me and start.",
  items: [
    { tag: "Open well", say: "Brenda's first message: 'Email is currently down!' Every support chat opens the same way: greet her and offer help. Choose the reply that does that, and nothing else.", why: "A professional opening calms the customer. A guess, a brush-off or asking for a password does the opposite, and her mood shows it." },
    { tag: "Find out", say: "She says it's urgent, and only on her phone. Before you can help, you need one fact about it: what kind of device it is. Choose the reply that asks.", why: "Gather the facts before you fix anything." },
    { tag: "Find out", say: "A new phone from TechCom. Choose the reply that moves to looking at how that phone is set up.", why: "When one device fails and the rest work, look at how that device is set up." },
    { tag: "Look", say: "Brenda has sent a screenshot of her settings. Now check the real thing: press Open Mobile devices, read her phone, then press Mail server to see what the server accepts.", why: "Never advise from a screenshot alone when you can see the phone and the server yourself." },
    { tag: "Fix it", say: "Line her settings up against the server: protocol IMAP (matches), security SSL (matches), server 10.0.8.1 (matches), port 100 (the server takes encrypted IMAP on 993). Choose the reply that fixes the one setting that's wrong.", why: "Port 100 has no mail service on it. IMAP over SSL/TLS is 993." },
    { tag: "Test it", say: "Brenda's changed it. Confirm it yourself: in Mobile devices press Sync now on her phone and read the result.", why: "Test after every change, before you tell the customer it's fixed." }],
  cause: "Record why port 993 fixed it.", note: "Write the notes: what was wrong, what she changed, and how you confirmed it. Then Close the ticket." }),
  end: "That's the email chat done for real: open well, find out, look at the real settings, fix the one thing, and test it yourself. John's next: you drive." };
WALKS.CR1 = { machine: "TECH", steps: chatSteps("CR1", "Priya", {
  open: "Read Priya's ticket: a replacement router for her office. Press Assign to me and start.",
  items: [
    { tag: "Open well", say: "Priya's first message: she needs help setting up a new router. Open the way every support chat opens: offer help. Choose that reply.", why: "A professional opening, not a brush-off." },
    { tag: "Find out", say: "She wants the basic security set up. Before you advise, find out the situation: is this router new to the office, or replacing one? Choose the reply that asks.", why: "Ask before you advise." },
    { tag: "Fix it", say: "It's a replacement, and she's signed in. You've told her to change the default password first. Now choose how she should make the new one: what makes an admin password worth having?", why: "Not the sticker's, not shared, not blank: long and mixed." },
    { tag: "Test it", say: "She says it's done. Check it yourself: press Open the 92 Series app (her router is shared with us) and open its Administration page.", why: "Confirm on the device itself, not just from what you're told." },
    { tag: "Fix it", say: "The router asks to reboot. It runs its old settings until it restarts. Choose the clear answer.", why: "Save writes it; the restart puts it into use." },
    { tag: "Test it", say: "It's back up. In the 92 Series app open Status: is it running what's saved, with the new password?", why: "Test after every change." }],
  cause: "Record why the admin password comes first.", note: "Write the notes: what she changed, why, and how you confirmed it on the router. Then Close the ticket." }),
  end: "That's the router chat done for real: open well, ask before you advise, guide the change, confirm it on the router itself. Tom's next: you drive." };
/* ------------------------------------------------ X1: extra training,
   backup and recovery. A crawl: Mason rings the one thing to press. */
function fhBtn(r, label) { return r && Array.prototype.filter.call(r.querySelectorAll(".filehist .ev-nav button"), function (b) { return b.textContent === label; })[0]; }
function fhView(r) { const b = r && r.querySelector('.filehist .ev-nav button[aria-pressed="true"]'); return b ? b.textContent : null; }
function bk() { const m = E.machine("WS4"); return (m && m.bk && m.bk.fh) || {}; }
function q3() { const m = E.machine("WS4"), d = m && m.fs && m.fs["c:\\users\\finance\\documents"]; const f = d && d.files.filter(function (x) { return x.name === "Q3-budget.xlsx"; })[0]; return f && f.doc ? f.doc.id : null; }
WALKS.X1 = { machine: "WS4", steps: [
  { tag: "See it for yourself", win: "helpdesk",
    say: "This one is extra training: a real-world job no sim covers, backup and recovery. Read Farah's request and Mason's note, then press Assign to me and start.",
    why: "Two jobs hide in her message: get the file back, and stop it happening again. Note the times she gives you.",
    target: function () { return document.querySelector('[data-coach="assign"]'); },
    done: function () { const t = E.ticket(); return !!(t && t.id === "X1" && E.T()); } },
  { tag: "See it for yourself", win: "helpdesk",
    say: "Connect to her PC: press Connect to WS4-FIN on the ticket.",
    why: "You'll work on her files with her watching.",
    target: function () { return W["rdp:WS4"] ? null : document.querySelector('[data-coach="connect"]'); },
    waiting: function () { return W["rdp:WS4"] && W["rdp:WS4"].phase === "wait" ? "Connecting… waiting for Farah to accept." : null; },
    done: function () { return !!(W["rdp:WS4"] && W["rdp:WS4"].phase === "on"); } },
  { tag: "See it for yourself", win: "rdp:WS4",
    say: "Open File Explorer on her PC: press Start, type files, and open File Explorer.",
    why: "Look at the file before you change anything.",
    target: function () { const r = rd("WS4"); if (!r) return null; return r.querySelector('[aria-label="Open File Explorer"]') || r.querySelector(".tb-start"); },
    done: function () { const r = rd("WS4"); return !!(r && r.querySelector('section.win[aria-label="File Explorer"]')); } },
  { tag: "See it for yourself", win: "rdp:WS4",
    say: "Explorer opens in her user folder. Open Documents, then click Q3-budget.xlsx to select it.",
    why: "Her message says it's in Documents.",
    target: function () { const r = rd("WS4"); if (!r) return null; return r.querySelector('[aria-label="Folder Documents"]') || r.querySelector('[aria-label="File Q3-budget.xlsx"]'); },
    done: function () { const r = rd("WS4"); return !!(r && r.querySelector('[aria-label="Open Q3-budget.xlsx"]')); } },
  { tag: "See it for yourself", win: "rdp:WS4",
    say: "Press Open, read what's in it now, then Close.",
    why: "Last year's figures, saved at 09:12, then some of this year's typed back in and saved at 10:05. Two saves this morning: both of them overwrote the file.",
    target: function () { const r = rd("WS4"); if (!r) return null; return r.querySelector(".w-dialog button") || r.querySelector('[aria-label="Open Q3-budget.xlsx"]'); },
    done: function () { const r = rd("WS4"); return lastAt("WS4", function (e) { return e.kind === "doc-open"; }) >= 0 && !!r && !r.querySelector(".w-dialog"); } },
  { tag: "Find the copies Windows kept", win: "rdp:WS4",
    say: "With the file still selected, press Properties, then the Previous Versions tab.",
    why: "Previous Versions lists older copies of this one file: from the restore points System Protection takes (each holds a snapshot of the whole drive, documents included) and from File History, if it's on.",
    target: function () { const r = rd("WS4"); if (!r) return null; return r.querySelector('[aria-label="Previous Versions tab"]') || r.querySelector('[aria-label="Properties of Q3-budget.xlsx"]'); },
    done: function () { return lastAt("WS4", function (e) { return e.kind === "pv-view"; }) >= 0; } },
  { tag: "Work out which copy", win: "rdp:WS4",
    say: "Four copies. The newest, modified 4 October at 09:12, is from this morning: after the mistake. Click the one modified 3 October 2026 11:58.",
    why: "Farah worked on it right up to lunch yesterday. The newest copy saved after her last real edit and before this morning's mistake is the one with all her work.",
    target: function () { const r = rd("WS4"); return r && r.querySelector('.ev-row[aria-label^="Q3-budget.xlsx, modified 3 October 2026 11:58"]'); },
    done: function () { const r = rd("WS4"); return !!(r && r.querySelector('.ev-row.sel[aria-label^="Q3-budget.xlsx, modified 3 October 2026 11:58"]')) || q3() === "q3rev"; } },
  { tag: "Work out which copy", win: "rdp:WS4",
    say: "Press Open to read that copy before you restore it, then Close.",
    why: "Check it's the right one first: Restore replaces the current file, and can't be undone.",
    target: function () { const r = rd("WS4"); if (!r) return null; return r.querySelector(".w-dialog button") || r.querySelector('[aria-label="Open the version modified 3 October 2026 11:58"]'); },
    done: function () { const r = rd("WS4"); return (lastAt("WS4", function (e) { return e.kind === "pv-open" && e.doc === "q3rev"; }) >= 0 && !!r && !r.querySelector(".w-dialog")) || q3() === "q3rev"; } },
  { tag: "Get it back", win: "rdp:WS4",
    say: "That's her Q3 2026 sheet with her revisions. Press Restore, and confirm.",
    why: "Previous Versions puts back one file. System Restore would be the wrong tool: it rolls back Windows' system files and programs, and never touches documents.",
    target: function () { const r = rd("WS4"); if (!r) return null; return r.querySelector(".w-dialog.pv-confirm button") || r.querySelector('[aria-label="Restore the version modified 3 October 2026 11:58"]'); },
    done: function () { return q3() === "q3rev"; } },
  { tag: "Set up a real backup", win: "rdp:WS4",
    say: "Her file is back. Now the second job. Press OK, then Start, type file history, and open File History.",
    why: "Today she was lucky: Windows Update happened to make a restore point at lunchtime. A restore point lives on the same drive as her file, and Windows deletes old ones to make room. File History is a real backup, on another device.",
    target: function () { const r = rd("WS4"); if (!r) return null; return r.querySelector(".w-dialog button") || r.querySelector('[aria-label="Open File History"]') || r.querySelector(".tb-start"); },
    done: function () { const r = rd("WS4"); return !!(r && r.querySelector('section.win[aria-label="File History"]')); } },
  { tag: "Set up a real backup", win: "rdp:WS4",
    say: "Press Select drive. No drives are plugged in, so add a network location: type \\\\FS01\\Backups (from Mason's note) and press Select folder.",
    why: "The backup belongs on another device: if her drive fails, a backup on it fails too. The file server's backup share is itself backed up off site.",
    target: function () { const r = rd("WS4"); if (!r) return null; if (fhView(r) !== "Select drive") return fhBtn(r, "Select drive"); const i = r.querySelector("#fh-loc-WS4"); return i && i.value.trim() ? Array.prototype.filter.call(r.querySelectorAll(".filehist .dlg-row button"), function (b) { return b.textContent === "Select folder"; })[0] : i; },
    done: function () { return !!bk().target; } },
  { tag: "Set up a real backup", win: "rdp:WS4",
    say: "Press Advanced settings. Save copies of files says Daily. Change it to Every hour.",
    why: "She said she could live with losing an hour, not a day. How often the backup runs is the most work she can lose.",
    target: function () { const r = rd("WS4"); if (!r) return null; return fhView(r) === "Advanced settings" ? r.querySelector("#fh-every-WS4") : fhBtn(r, "Advanced settings"); },
    done: function () { return bk().every <= 60; } },
  { tag: "Set up a real backup", win: "rdp:WS4",
    say: "Go back to the File History page and press Turn on.",
    why: "Settings do nothing while it's off. Turning it on starts the first copy straight away, so her restored file is protected now.",
    target: function () { const r = rd("WS4"); if (!r) return null; return fhView(r) === "File History" ? Array.prototype.filter.call(r.querySelectorAll(".filehist .dlg-row button"), function (b) { return b.textContent === "Turn on"; })[0] : fhBtn(r, "File History"); },
    done: function () { return !!bk().on; } },
  { tag: "Test it", win: "rdp:WS4",
    say: "Test the backup: press Restore personal files and find Q3-budget.xlsx, modified 3 October 11:58.",
    why: "A backup you haven't looked inside is a hope, not a backup.",
    target: function () { const r = rd("WS4"); return r && fhBtn(r, "Restore personal files"); },
    done: function () { const m = E.machine("WS4"); return !!(m && E.ticket() && E.ticket().goal(E.fleet())); } },
  { tag: "Close it out", win: "helpdesk",
    say: "Go back to Help Desk and press Resolve.",
    why: "Farah checks her file, Mason checks the backup.",
    target: function () { return document.querySelector('[data-coach="resolve"]'); },
    done: function () { const st = E.T(); return !!(st && st.stage !== "work"); } },
  { tag: "Document it", win: "helpdesk",
    say: "Farah asks whether restore points would have been enough. Pick the answer that's true.",
    why: "Where today's copy came from, and what could have happened to it.",
    target: function () { return document.querySelector("[data-win=helpdesk] .opts"); },
    done: function () { const st = E.T(); return !!(st && (st.closeOK || st.stage === "done")); } },
  { tag: "Document it", win: "helpdesk",
    say: "Write the resolution notes: which copy you restored and where it came from, the backup you set up (where to, how often), and how you tested it. Then press Close the ticket.",
    why: "For example: \"Restored Q3-budget.xlsx from the 3 Oct 11:58 previous version (restore point). Set up File History to \\\\FS01\\Backups every hour; tested in Restore personal files.\" Your own words.",
    target: function () { return document.querySelector("#res-note"); },
    done: function () { const st = E.state().tickets.X1; return !!(st && st.stage === "done"); } }
], end: "That's backup and recovery: one file back from Previous Versions (not System Restore, which leaves documents alone), then a real backup on another device, as often as the user can afford to lose, tested. More extra-training tickets follow once this one's shape is right." };
/* ------------------------------------------------ FS1: extra training,
   file systems. A crawl through Brenda's USB stick. */
function fs1m() { return E.machine("WS2"); }
function fs1On(L, name) { const m = fs1m(); return !!m && m.fx && FX.filesOn(m, L).some(function (f) { return f.name === name; }); }
function fs1Ex() { const m = fs1m(); return !!m && !!m.fx && FX.drive(m, "E").fs === "exFAT"; }
function fs1Desk(name) { const m = fs1m(), d = m && m.fs["c:\\users\\bsmith\\desktop"]; return !!d && d.files.some(function (f) { return f.name === name; }); }
function fxQ(r, label) { if (!r) return null; return r.querySelector('[aria-label="' + label + '"]') || Array.prototype.filter.call(r.querySelectorAll("button:not([aria-label])"), function (b) { return b.textContent === label; })[0] || null; }
function fxPath(r) { const a = r && r.querySelector('section.win[aria-label="File Explorer"] .fx-addr'); return a ? a.value : null; }
/* the next thing to press to get File Explorer to a folder */
function fxGo(r, dir) {
  if (!r) return null;
  if (!r.querySelector('section.win[aria-label="File Explorer"]')) return fxQ(r, "Open File Explorer") || r.querySelector(".tb-start");
  const at = (fxPath(r) || "").toLowerCase(), want = dir.toLowerCase();
  if (at === want) return null;
  if (/^e:/.test(want)) return fxQ(r, "Go to the USB drive SALES (E:)");
  if (/^e:/.test(at)) return fxQ(r, "Up");
  const parts = dir.split("\\"), have = at.split("\\").filter(Boolean);
  for (let i = 1; i < parts.length; i++) if (have[i] !== parts[i].toLowerCase()) return fxQ(r, "Folder " + parts[i]) || fxQ(r, "Up");
  return fxQ(r, "Up");
}
/* copy one file somewhere: walk Explorer there, select it, Copy to…, choose, Copy */
function fxCopyTarget(r, dir, name, dest) {
  if (!r) return null;
  const msg = r.querySelector(".w-dialog.message button"); if (msg) return msg;
  const dlg = r.querySelector(".w-dialog.fx-copy");
  if (dlg) { const s2 = dlg.querySelector("select"); return s2 && s2.value !== dest ? s2 : fxQ(r, "Copy " + name + " to the chosen folder"); }
  return fxGo(r, dir) || fxQ(r, "Copy " + name + " to another folder or drive") || fxQ(r, "File " + name);
}
const DESK = "C:\\Users\\bsmith\\Desktop";
WALKS.FS1 = { machine: "WS2", steps: [
  { tag: "See it for yourself", win: "helpdesk",
    say: "Extra training: file systems. Read Brenda's request and Mason's note, then press Assign to me and start.",
    why: "Count what she needs: the video on the stick, the stick working on a Mac and on Windows, and two files on it she can't lose.",
    target: function () { return document.querySelector('[data-coach="assign"]'); },
    done: function () { const t = E.ticket(); return !!(t && t.id === "FS1" && E.T()); } },
  { tag: "See it for yourself", win: "helpdesk",
    say: "Connect to her PC: press Connect to WS2-SALES on the ticket.",
    why: "The stick is plugged into her PC.",
    target: function () { return W["rdp:WS2"] ? null : document.querySelector('[data-coach="connect"]'); },
    waiting: function () { return W["rdp:WS2"] && W["rdp:WS2"].phase === "wait" ? "Connecting… waiting for Brenda to accept." : null; },
    done: function () { return !!(W["rdp:WS2"] && W["rdp:WS2"].phase === "on"); } },
  { tag: "See it for yourself", win: "rdp:WS2",
    say: "Try what Brenda tried. Open File Explorer (press Start, type files), open her Desktop, select Showroom tour.mp4, press Copy to…, choose SALES (E:) and press Copy.",
    why: "See the error with your own eyes before you change anything.",
    target: function () { return fxCopyTarget(rd("WS2"), DESK, "Showroom tour.mp4", "E:\\"); },
    done: function () { const m = fs1m(); return !!m && m.events.some(function (e) { return e.kind === "fx-copy-failed"; }); } },
  { tag: "Find the cause", win: "rdp:WS2",
    say: "\"The file is too large for the destination file system.\" Press OK. Now go to the stick, SALES (E:), and press Properties.",
    why: "The message blames the file system, not the space. The stick's properties say which one it is.",
    target: function () { const r = rd("WS2"); return r && (r.querySelector(".w-dialog.message button") || fxGo(r, "E:\\") || fxQ(r, "Properties of SALES (E:)")); },
    done: function () { const m = fs1m(); return !!m && m.events.some(function (e) { return e.kind === "fx-props" && e.letter === "E"; }); } },
  { tag: "Find the cause", win: "rdp:WS2",
    say: "File system: FAT32. FAT32 can't hold any single file of 4 GB or more, however much space is free. Press OK.",
    why: "The video is 6.2 GB. Changing the file system means formatting, and a format empties the stick.",
    target: function () { const r = rd("WS2"); return r && r.querySelector(".w-dialog.fx-props button"); },
    done: function () { const r = rd("WS2"), m = fs1m(); return !!r && !!m && m.events.some(function (e) { return e.kind === "fx-props" && e.letter === "E"; }) && !r.querySelector(".w-dialog.fx-props"); } },
  { tag: "Keep her files safe", win: "rdp:WS2",
    say: "Before anything changes the stick, save her files. On SALES (E:), select Client pitch.pptx, press Copy to…, choose C:\\Users\\bsmith\\Desktop and press Copy.",
    why: "She said they're on the stick and nowhere else. A format would erase them.",
    target: function () { return fxCopyTarget(rd("WS2"), "E:\\", "Client pitch.pptx", DESK); },
    done: function () { return fs1Desk("Client pitch.pptx"); } },
  { tag: "Keep her files safe", win: "rdp:WS2",
    say: "Press OK, then the same for Price list 2026.xlsx: Copy to…, choose C:\\Users\\bsmith\\Desktop, Copy.",
    why: "Both her files, before the format.",
    target: function () { return fxCopyTarget(rd("WS2"), "E:\\", "Price list 2026.xlsx", DESK); },
    done: function () { return fs1Desk("Price list 2026.xlsx"); } },
  { tag: "Choose the file system", win: "rdp:WS2",
    say: "Press OK. Her files are safe. On SALES (E:), press Format…, choose exFAT as the File system, press Start, then OK.",
    why: "exFAT has no 4 GB limit, and a Mac can read and write it. NTFS would take the video too, but a Mac can only read NTFS: the client's team couldn't save their edit back to it.",
    target: function () { const r = rd("WS2"); if (!r) return null; const msg = r.querySelector(".w-dialog.message button"); if (msg) return msg; const w = r.querySelector(".w-dialog.fx-format"); if (w) { const s2 = w.querySelector("select"); if (s2 && s2.value !== "exFAT") return s2; return fxQ(r, "Start formatting SALES (E:)") || fxQ(r, "OK: format SALES (E:) as exFAT"); } return fxGo(r, "E:\\") || fxQ(r, "Format SALES (E:)"); },
    done: function () { const m = fs1m(); return !!m && FX.drive(m, "E").fs === "exFAT"; } },
  { tag: "Put it all back", win: "rdp:WS2",
    say: "Format Complete: the stick is exFAT and empty. Press OK. Copy her files back: on her Desktop, select Client pitch.pptx, Copy to…, choose SALES (E:), Copy.",
    why: "A format leaves the drive empty. What you saved goes back.",
    target: function () { return fxCopyTarget(rd("WS2"), DESK, "Client pitch.pptx", "E:\\"); },
    done: function () { return fs1Ex() && fs1On("E", "Client pitch.pptx"); } },
  { tag: "Put it all back", win: "rdp:WS2",
    say: "Press OK, then Price list 2026.xlsx the same way, to SALES (E:).",
    why: "Both her files go back.",
    target: function () { return fxCopyTarget(rd("WS2"), DESK, "Price list 2026.xlsx", "E:\\"); },
    done: function () { return fs1Ex() && fs1On("E", "Price list 2026.xlsx"); } },
  { tag: "Test it", win: "rdp:WS2",
    say: "Press OK. Now the job she asked for: Showroom tour.mp4, Copy to…, SALES (E:), Copy.",
    why: "The copy that failed at the start is the test: same file, same stick, new file system.",
    target: function () { return fxCopyTarget(rd("WS2"), DESK, "Showroom tour.mp4", "E:\\"); },
    done: function () { const t = E.ticket(); return !!(t && t.id === "FS1" && t.goal(E.fleet())); } },
  { tag: "Close it out", win: "helpdesk",
    say: "The video copied. Go back to Help Desk and press Resolve.",
    why: "Brenda checks the stick: her pitch, her price list and the video.",
    target: function () { return document.querySelector('[data-coach="resolve"]'); },
    done: function () { const st = E.T(); return !!(st && st.stage !== "work"); } },
  { tag: "Document it", win: "helpdesk",
    say: "Brenda asks why exFAT, when her PC uses NTFS. Pick the answer that's true.",
    why: "Think about the Mac.",
    target: function () { return document.querySelector("[data-win=helpdesk] .opts"); },
    done: function () { const st = E.T(); return !!(st && (st.closeOK || st.stage === "done")); } },
  { tag: "Document it", win: "helpdesk",
    say: "Write the resolution notes: why the copy failed, how you kept her files safe, the file system you chose and why, and what's on the stick now. Then press Close the ticket.",
    why: "For example: \"Stick was FAT32 (no file of 4 GB or more). Copied her two files to the Desktop, formatted it exFAT so the client's Mac can write to it (a Mac only reads NTFS), copied them back with the video.\" Your own words.",
    target: function () { return document.querySelector("#res-note"); },
    done: function () { const st = E.state().tickets.FS1; return !!(st && st.stage === "done"); } }
], end: "That's file systems for real: the error read for what it says (the file system's limit, not space), the user's files saved before the format, and the file system chosen for every computer it has to work on. The rest of the file-system tickets are yours to run." };
/* ------------------------------------------------ FS2: the walk */
function fs2m() { return E.machine("WS5"); }
function fs2ev(test) { const m = fs2m(); return !!m && (m.events || []).some(test); }
function fs2st() { const t = E.ticket(); return t && t.id === "FS2" ? t.stage(E.fleet()) : null; }
WALKS.FS2 = { mode: "walk", machine: "WS5", steps: [
  { goal: "Take the ticket and connect to Rosa's PC", win: "helpdesk", how: "Assign it to yourself, then start a remote session from the ticket.", done: function () { return !!(W["rdp:WS5"] && W["rdp:WS5"].phase === "on" && E.ticket() && E.ticket().id === "FS2"); } },
  { goal: "Read what Windows Update says", how: "Start search finds Windows Update. Read every line before pressing anything.", done: function () { return fs2ev(function (e) { return e.kind === "opened" && e.app === "winupdate"; }); } },
  { goal: "Get updates coming in again", how: "Something Rosa did is holding them back.", done: function () { const m = fs2m(); return !!(m && m.wu && !m.wu.paused); } },
  { goal: "Find out what's waiting", how: "Windows only lists what it found the last time it looked.", done: function () { const m = fs2m(); return !!(m && m.wu && m.wu.found); } },
  { goal: "Install what policy allows, and nothing it doesn't", how: "Mason's note lists what goes on now and what waits for Tier 2.", done: function () { return ["active", "restart", "verify", "done"].indexOf(fs2st()) >= 0; } },
  { goal: "Stop restarts while the desk is staffed", how: "Windows Update's Advanced options. Compare the hours set with Rosa's message and Mason's note.", done: function () { const m = fs2m(); return !!(m && m.wu && m.wu.active.from < m.wu.active.to && m.wu.active.from <= 8 && m.wu.active.to >= 18); } },
  { goal: "Finish the install", how: "Rosa is away from the desk now. The session will drop: reconnect afterwards.", done: function () { return ["verify", "done"].indexOf(fs2st()) >= 0; } },
  { goal: "Check it really finished", how: "The OS build number, or the list of what's installed.", done: function () { return fs2st() === "done"; } },
  { goal: "Resolve the ticket", win: "helpdesk", how: "Back in Help Desk.", done: function () { const st = E.T(); return !!(st && st.stage !== "work"); } },
  { goal: "Answer Rosa's question, and write the notes", win: "helpdesk", how: "What was paused, what went on and what didn't, the active hours, the restart, the build.", done: function () { const st = E.state().tickets.FS2; return !!(st && st.stage === "done"); } }
], end: "That's the walk: updates flowing again, only what policy allows, restarts kept out of the staffed day, and the result checked. FS3 and FS4 are yours to run." };
/* ------------------------------------------------ SF1: extra training,
   safety. A crawl through John's smoking PC. */
function sfx(id) { return SF.get(E.fleet(), id); }
function sfs(id) { const x = sfx(id); return x ? x.s : null; }
function sfDid(id, act) { const x = sfx(id); return !!x && SF.did(x, act) > 0; }
function sfBtn(name) { return document.querySelector('[data-win=safety] [data-coach="' + name + '"]'); }
function sfOpts() { return document.querySelector("[data-win=safety] .sf-opts"); }
WALKS.SF1 = { machine: "TECH", steps: [
  { tag: "See it for yourself", win: "helpdesk",
    say: "Extra training: safety. Read John's message and Mason's note, then press Assign to me and start.",
    why: "Smoke from a PC is a job you go to straight away. Notice what John is worried about, too: his unsaved file.",
    target: function () { return document.querySelector('[data-coach="assign"]'); },
    done: function () { const t = E.ticket(); return !!(t && t.id === "SF1" && E.T()); } },
  { tag: "Go there", win: function () { return W.safety ? "safety" : "helpdesk"; },
    say: "A safety job is done where the hazard is. Press Walk to John's desk.",
    why: "You can't make a smoking PC safe from your desk.",
    /* no ring under the cutscene; On the spot's own walk button if it's open */
    target: function () { return walkUI ? null : sfBtn("sf-walk") || document.querySelector('[data-coach="sf-go"]'); },
    waiting: function () { return walkUI ? "Walking to John's desk…" : null; },
    done: function () { return !!L.onSite.SF1; } },
  { tag: "People first", win: "safety",
    say: "You're there, and On the spot is open. Read What you can see, and what John says. Before the PC comes John: choose the reply that gets him clear of it, calmly.",
    why: "People before property, and before files. A calm, clear instruction works better than alarm.",
    target: sfOpts, done: function () { return chatPast("SF1", 0); } },
  { tag: "Have the right extinguisher", win: "safety",
    say: "Before you go near the PC, look: press Read the labels on the corridor's extinguishers.",
    why: "Looking never counts against you. Two extinguishers, two very different jobs.",
    target: function () { return sfBtn("sf-look-ext"); }, done: function () { return sfDid("SF1", "look-ext"); } },
  { tag: "Have the right extinguisher", win: "safety",
    say: "CO₂ is for electrical fires. Water conducts electricity, so it's never used on electrical equipment. Press Fetch the CO₂ extinguisher.",
    why: "You don't spray it: there's smoke, not flame. You have it at hand in case that changes.",
    target: function () { return sfBtn("sf-fetch-co2"); }, done: function () { const s = sfs("SF1"); return !!s && s.ext === "co2"; } },
  { tag: "Cut the power", win: "safety",
    say: "Now look before you touch: press Look at the back of the PC, without touching it.",
    why: "Find where the smoke comes from, and where its power comes from.",
    target: function () { return sfBtn("sf-look-back"); }, done: function () { return sfDid("SF1", "look-back"); } },
  { tag: "Cut the power", win: "safety",
    say: "The smoke comes from the power supply, and its cord runs to a switched wall socket. Cut it there: press Switch off at the wall socket and pull the plug.",
    why: "The PC's power button only tells the PC to stop: the power supply would stay on the mains. The wall cuts it completely, from a safe distance.",
    target: function () { return sfBtn("sf-unplug-wall"); }, done: function () { const s = sfs("SF1"); return !!s && !s.plugged; } },
  { tag: "Talk it through", win: "safety",
    say: "The smoke has stopped. John asks two things: is it safe, and what about his payroll? Choose the reply that tells him plainly, and gets him working.",
    why: "Never guess at bad news, and never power up something that has just smoked.",
    target: sfOpts, done: function () { return chatPast("SF1", 3); } },
  { tag: "Make sure nobody else gets hurt", win: "safety",
    say: "John's leaving his desk, and the next person could plug the PC back in. Press Tag the PC: DO NOT USE.",
    why: "A tag says what's wrong, that it mustn't be plugged in, who and when. A sticky note does none of that.",
    target: function () { return sfBtn("sf-tag"); }, done: function () { const s = sfs("SF1"); return !!s && s.tagged; } },
  { tag: "Talk it through", win: "safety",
    say: "John asks what happens to his PC now. Choose the reply that says who has it, and that he'll hear back.",
    why: "Own the handover: the person shouldn't have to chase you.",
    target: sfOpts, done: function () { const t = TICKETS.filter(function (x) { return x.id === "SF1"; })[0]; return CH.finished(E.fleet(), t); } },
  { tag: "Hand it on", win: "helpdesk",
    say: "It's safe and tagged. A new power supply is a repair, not Tier 1's job: back in Help Desk, press Escalate to Tier 2.",
    why: "Tier 2 gets a PC that's safe, tagged, and a ticket that says what happened.",
    target: function () { return document.querySelector('[data-coach="escalate"]'); },
    done: function () { const st = E.T(); return !!(st && st.stage !== "work"); } },
  { tag: "Document it", win: "helpdesk",
    say: "Mason asks why you cut it at the wall, not at the power button. Pick the answer that's true.",
    why: "Think about what was still connected after the PC itself was off.",
    target: function () { return document.querySelector("[data-win=helpdesk] .opts"); },
    done: function () { const st = E.T(); return !!(st && (st.closeOK || st.stage === "done")); } },
  { tag: "Document it", win: "helpdesk",
    say: "Write the notes: what you found, how you cut the power, the extinguisher you had ready and why, the tag, and who has it now. Then press Close the ticket.",
    why: "For example: \"Smoke from WS1's power supply. Got John clear, CO2 extinguisher at hand (not water), switched off and unplugged at the wall, tagged DO NOT USE, escalated to Tier 2 for a new PSU.\" Your own words.",
    target: function () { return document.querySelector("#res-note"); },
    done: function () { const st = E.state().tickets.SF1; return !!(st && st.stage === "done"); } }
], end: "That's safety on the spot: people clear first, the right extinguisher at hand, the power cut where it's safe to cut it, the hazard tagged so nobody else meets it, and the person told what happens next. SF2 is a walk; the rest are yours to run." };
/* ------------------------------------------------ SF2: the walk */
WALKS.SF2 = { mode: "walk", machine: "TECH", steps: [
  { goal: "Take the ticket, and go to Brenda", win: "helpdesk", how: "Assign it to yourself, then walk over from the ticket.", done: function () { return !!L.onSite.SF2 && E.ticket() && E.ticket().id === "SF2"; } },
  { goal: "Tell Brenda what it is, calmly", how: "What in a laptop sits under the touchpad? Name it, and stop the risky use.", done: function () { return chatPast("SF2", 0); } },
  { goal: "Take it out of use completely", how: "What's still feeding the battery, and what's still drawing on it?", done: function () { const s = sfs("SF2"); return !!s && !s.charging && s.power === "off"; } },
  { goal: "Put it where it can't start a fire", how: "Think about what's around it now, and the kit in the closet.", done: function () { const s = sfs("SF2"); return !!s && s.where === "bin"; } },
  { goal: "Make sure it's handled properly from here", how: "The next person to open that lid, and where batteries go.", done: function () { const s = sfs("SF2"); return !!s && s.labelled && s.logged; } },
  { goal: "Get Brenda working again, and check it", how: "The closet shelf, and the thing she actually needs at two.", done: function () { const s = sfs("SF2"); return !!s && s.spare && s.deck; } },
  { goal: "Answer Brenda before you leave", how: "What happens to her laptop now, and who's handling it?", done: function () { const t = TICKETS.filter(function (x) { return x.id === "SF2"; })[0]; return CH.finished(E.fleet(), t); } },
  { goal: "Resolve the ticket", win: "helpdesk", how: "Back in Help Desk.", done: function () { const st = E.T(); return !!(st && st.stage !== "work"); } },
  { goal: "Answer Brenda's question, and write the notes", win: "helpdesk", how: "What you found, how you took it out of use, where it went, its disposal, and how she's working now.", done: function () { const st = E.state().tickets.SF2; return !!(st && st.stage === "done"); } }
], end: "That's the walk: the hazard named calmly, the battery out of use, contained where it can't burn, labelled and logged for recycling, and Brenda working again with her demo. SF3 to SF6 are yours to run." };
/* ------------------------------------------------ X2: the walk */
function x2m() { return E.machine("WS3"); }
function x2ev(kind, test) { const m = x2m(); return !!m && (m.events || []).some(function (e) { return e.kind === kind && (!test || test(e)); }); }
WALKS.X2 = { mode: "walk", machine: "WS3", steps: [
  { goal: "Take the ticket and connect to Dev's PC", win: "helpdesk", how: "Assign it to yourself, then start a remote session from the ticket.", done: function () { return !!(W["rdp:WS3"] && W["rdp:WS3"].phase === "on" && E.ticket() && E.ticket().id === "X2"); } },
  { goal: "Look at today's deploy.yml first", how: "File Explorer, his Documents: open it and read its version.", done: function () { return x2ev("doc-open", function (e) { return e.doc === "y240"; }); } },
  { goal: "Find his backups", how: "Windows' own backup for a user's files is in Control Panel. Start search finds it.", done: function () { return x2ev("opened", function (e) { return e.app === "filehist"; }); } },
  { goal: "Look through the backups for the hotfix version", how: "Step between older and newer backups, and open each copy of deploy.yml to read its notes.", done: function () { return x2ev("pv-open", function (e) { return e.doc === "y231"; }); } },
  { goal: "Put a copy of it where Dev can compare, keeping today's", how: "Think about where the copy goes. He told you what not to overwrite.", done: function () { const t = E.ticket(); return !!t && t.id === "X2" && ["test", "done"].indexOf(t.stage(E.fleet())) >= 0; } },
  { goal: "Check the copy you put back", how: "Open it from where you put it, and read its version.", done: function () { const t = E.ticket(); return !!t && t.id === "X2" && t.stage(E.fleet()) === "done"; } },
  { goal: "Resolve the ticket", win: "helpdesk", how: "Back in Help Desk.", done: function () { const st = E.T(); return !!(st && st.stage !== "work"); } },
  { goal: "Answer Dev's question, and write the notes", win: "helpdesk", how: "Which copy, where it went, and that today's was kept.", done: function () { const st = E.state().tickets.X2; return !!(st && st.stage === "done"); } }
], end: "That's the walk: the right copy, put where it couldn't overwrite today's work, and checked. The rest of the backup tickets are yours to run." };
/* ------------------------------------------------ MB1: the crawl, MB2: the walk */
function mdw() { return document.querySelector('[data-win="mobile"]'); }
function ph(id) { return MB.get(E.fleet(), id); }
function phView(id, page) { const p = ph(id); return p ? PH.lastAt(p, "view", function (e) { return e.page === page; }) : -1; }
function phBtn(label) { const w = mdw(); return w && w.querySelector('[aria-label="' + label + '"]'); }
function phPage() { const w = mdw(), h = w && w.querySelector(".ph-title"); return h ? h.textContent : null; }
WALKS.MB1 = { machine: "TECH", steps: [
  { tag: "See it for yourself", win: "helpdesk",
    say: "Extra training again: mobile troubleshooting. Read Rosa's request, then press Assign to me and start.",
    why: "Note what she says she'd like to keep, and what changed last week.",
    target: function () { return document.querySelector('[data-coach="assign"]'); },
    done: function () { const t = E.ticket(); return !!(t && t.id === "MB1" && E.T()); } },
  { tag: "See it for yourself", win: "helpdesk",
    say: "Press Open Mobile devices. Rosa accepts Remote help, and her phone's screen appears.",
    why: "Company phones are enrolled, so you can see and use the screen with the owner's OK.",
    target: function () { return W.mobile ? null : document.querySelector('[data-coach="open-mobile"]'); },
    done: function () { return !!W.mobile; } },
  { tag: "Find the evidence", win: "mobile",
    say: "Read her notifications: what does the phone say about its battery? Then press Settings, at the bottom of her home screen.",
    why: "The phone's own words are your first evidence.",
    target: function () { return phBtn("Settings"); },
    done: function () { return phView("MB1", "settings") >= 0; } },
  { tag: "Find the evidence", win: "mobile",
    say: "Press Battery.",
    why: "The Battery page lists what has used the battery since it was last charged.",
    target: function () { const w = mdw(); return w && Array.prototype.filter.call(w.querySelectorAll(".ph-link"), function (b) { return /^Battery,/.test(b.getAttribute("aria-label") || ""); })[0]; },
    done: function () { return phView("MB1", "battery") >= 0; } },
  { tag: "Work out the cause", win: "mobile",
    say: "One app is using over half the battery: Weather Live, running Unrestricted. Press it to open its app info.",
    why: "An app Rosa opens once a morning shouldn't be the biggest user of her battery.",
    target: function () { const w = mdw(); return w && w.querySelector('.ph-link[aria-label^="Weather Live:"]'); },
    done: function () { return phView("MB1", "app:weather") >= 0; } },
  { tag: "Fix it", win: "mobile",
    say: "Under Permissions, its Location is Allow all the time. Change it to Allow only while using the app.",
    why: "Tracking her location all day keeps waking the phone. The forecast only needs her location while she's looking at it.",
    target: function () { const w = mdw(); return w && w.querySelector("#ph-loc"); },
    done: function () { const a = ph("MB1") && PH.app(ph("MB1"), "weather"); return !!a && a.location !== "Allow all the time" && a.location !== "Don't allow"; } },
  { tag: "Fix it", win: "mobile",
    say: "Under Battery, change Background battery use from Unrestricted to Restricted.",
    why: "Restricted stops it running when she isn't using it. It still works the moment she opens it.",
    target: function () { const w = mdw(); return w && w.querySelector("#ph-bat"); },
    done: function () { const a = ph("MB1") && PH.app(ph("MB1"), "weather"); return !!a && a.battery !== "Unrestricted"; } },
  { tag: "Test it", win: "mobile",
    say: "Check the result: press Back until you reach Settings, then Battery, and read the estimate.",
    why: "A fix isn't finished until you've seen it work.",
    target: function () { const pg = phPage(); if (pg === "Settings") { const w = mdw(); return w && Array.prototype.filter.call(w.querySelectorAll(".ph-link"), function (b) { return /^Battery,/.test(b.getAttribute("aria-label") || ""); })[0]; } return phBtn("Back"); },
    done: function () { const p = ph("MB1"); return !!p && PH.lastAt(p, "app-set") >= 0 && PH.lastAt(p, "view", function (e) { return e.page === "battery"; }) > PH.lastAt(p, "app-set"); } },
  { tag: "Close it out", win: "helpdesk",
    say: "About a full day again. Go back to Help Desk and press Resolve.",
    why: "Rosa checks it at lunchtime tomorrow; the ticket moves on to the write-up.",
    target: function () { return document.querySelector('[data-coach="resolve"]'); },
    done: function () { const st = E.T(); return !!(st && st.stage !== "work"); } },
  { tag: "Document it", win: "helpdesk",
    say: "Rosa asks whether her battery was wearing out. Pick the true answer.",
    why: "What the app was doing while she wasn't using it.",
    target: function () { return document.querySelector("[data-win=helpdesk] .opts"); },
    done: function () { const st = E.T(); return !!(st && (st.closeOK || st.stage === "done")); } },
  { tag: "Document it", win: "helpdesk",
    say: "Write the notes: what was draining it, the two settings you changed, and what the Battery page said afterwards. Then press Close the ticket.",
    why: "For example: \"Weather Live used 52% in the background with location Allow all the time. Set location to while using and battery to Restricted. Battery page now shows about 23 hours.\"",
    target: function () { return document.querySelector("#res-note"); },
    done: function () { const st = E.state().tickets.MB1; return !!(st && st.stage === "done"); } }
], end: "That's mobile troubleshooting, crawled: the phone's own evidence first, the one app behind it, the two settings that stopped it, and the result checked. Brenda's SalesPad is next, with a checklist." };
WALKS.MB2 = { mode: "walk", machine: "TECH", steps: [
  { goal: "Take the ticket and open Brenda's phone", win: "helpdesk", how: "Assign it, then Open Mobile devices.", done: function () { const t = E.ticket(); return !!(t && t.id === "MB2" && W.mobile); } },
  { goal: "See it for yourself", how: "Open SalesPad on her home screen and read what happens.", done: function () { const p = ph("MB2"); return !!p && PH.lastAt(p, "open", function (e) { return e.app === "salespad"; }) >= 0; } },
  { goal: "Look at the app's info", how: "Settings, Apps, SalesPad: what does it keep on the phone?", done: function () { return phView("MB2", "app:salespad") >= 0; } },
  { goal: "Fix it without losing the orders", how: "Of the two kinds of clearing, only one leaves app data alone.", done: function () { const t = E.ticket(); return !!t && t.id === "MB2" && ["test", "done"].indexOf(t.stage(E.fleet())) >= 0; } },
  { goal: "Test it, orders and all", how: "Open SalesPad again.", done: function () { const t = E.ticket(); return !!t && t.id === "MB2" && t.stage(E.fleet()) === "done"; } },
  { goal: "Resolve the ticket", win: "helpdesk", how: "Back in Help Desk.", done: function () { const st = E.T(); return !!(st && st.stage !== "work"); } },
  { goal: "Answer Brenda, and write the notes", win: "helpdesk", how: "What you cleared, why not storage, and how you checked.", done: function () { const st = E.state().tickets.MB2; return !!(st && st.stage === "done"); } }
], end: "That's the walk. The other phone tickets are yours to run." };
/* ------------------------------------------------ OI1: the crawl */
function oiEv(kind, test) { return lastAt("WS3", function (e) { return e.kind === kind && (!test || test(e)); }); }
function oiOn() { const t = E.ticket(); return !!(t && t.id === "OI1"); }
function oiScr() { return walkUI && walkUI.id === "WS3" ? document.querySelector(".wo-monitor") : null; }
function oiAt() { if (!walkUI) return document.querySelector('[data-coach="walk"]'); return walkUI.id === "WS3" ? null : document.querySelector(".wo-back"); }
function oiBtn(label) { const s = oiScr(); return s ? s.querySelector('[aria-label="' + label + '"]') : null; }
function oiText(re) { const s = oiScr(); return s ? byText(s, re) : null; }
function oiInput(sel) { const s = oiScr(); const i = s && s.querySelector(sel); return i && !i.value ? i : null; }
function oiRow(re) { const s = oiScr(); return s ? Array.from(s.querySelectorAll(".ws-part")).filter(function (r) { return re.test(r.getAttribute("aria-label")); })[0] || null : null; }
function oiRadio(name) { const s = oiScr(); const b = s && s.querySelector('[role="radio"][aria-label="' + name + '"]'); return b && b.getAttribute("aria-checked") !== "true" ? b : null; }
function oiDlg() { const s = oiScr(); return s ? s.querySelector(".w-dialog") : null; }
WALKS.OI1 = { machine: "WS3", steps: [
  { tag: "Get ready", win: "helpdesk",
    say: "Extra training: OS installation. Read Dev's request and every line of Mason's note, then press Assign to me and start.",
    why: "Mason's note holds the four facts this job turns on: the edition WS3 is licensed for, that there's no key, its name, and the domain.",
    target: function () { return document.querySelector('[data-coach="assign"]'); },
    done: function () { return oiOn() && !!E.T(); } },
  { tag: "Get ready", win: "helpdesk",
    say: "Dev's PC is switched off and its drive is empty, so remote support has nothing to connect to. Press Walk to Dev's desk.",
    why: "Installing an operating system is hands-on: you need the PC's own screen and keyboard from the moment it powers on.",
    target: oiAt,
    done: function () { return oiOn() && !!oiScr(); } },
  { tag: "Start the installer", win: null,
    say: "Under With your own hands, press Plug in the Windows 11 installer USB.",
    why: "With nothing on the drive, the PC can only start from something else. The USB holds Windows Setup.",
    target: function () { return oiAt() || hand("inst-usb-in"); },
    done: function () { return oiEv("inst-media-in") >= 0; } },
  { tag: "Start the installer", win: null,
    say: "Press the power button to switch it on, and read the start-up screen.",
    why: "This is the firmware's start-up screen (POST). It shows which keys open its Setup and its Boot Menu, for a second or two on a real PC.",
    target: function () { return oiAt() || hand("power"); },
    done: function () { return oiEv("inst-post") >= 0; } },
  { tag: "Start the installer", win: null,
    say: "Press F12 for the Boot Menu.",
    why: "The Boot Menu starts the PC from a device just this once, without changing the firmware's boot order.",
    target: function () { return oiAt() || oiBtn("Press F12 for the Boot Menu"); },
    done: function () { return oiEv("inst-bootmenu") >= 0; } },
  { tag: "Start the installer", win: null,
    say: "Choose UEFI: WIN11_24H2 (USB).",
    why: "UEFI in the name means it starts in UEFI mode, which Windows 11 needs. Windows Boot Manager is the drive, and there's nothing on it; PXE is the network, and Rafiki has no deployment server.",
    target: function () { return oiAt() || oiBtn("Boot from UEFI: WIN11_24H2 (USB)"); },
    done: function () { return oiEv("inst-boot", function (e) { return e.from === "usb"; }) >= 0; } },
  { tag: "Windows Setup", win: null,
    say: "Windows Setup has started. The language settings are right: press Next.",
    why: "These set the language Windows installs in, and the keyboard layout.",
    target: function () { return oiAt() || oiText(/^Next$/); },
    done: function () { return oiEv("inst-ws-lang") >= 0; } },
  { tag: "Windows Setup", win: null,
    say: "Leave Install Windows 11 selected. Read the box underneath, tick it, then press Next.",
    why: "A clean install deletes everything on the drive. Setup makes you say so. Repair my PC is for a PC that already has Windows.",
    target: function () { const s = oiScr(); const cb = s && s.querySelector('[id^="ws-agree-"]'); return oiAt() || (cb && !cb.checked ? cb : oiText(/^Next$/)); },
    done: function () { return oiEv("inst-ws-option") >= 0; } },
  { tag: "Windows Setup", win: null,
    say: "Press I don't have a product key.",
    why: "Mason's note: WS3's licence is a digital licence held for its motherboard. Windows activates itself once it's online, so no key is typed.",
    target: function () { return oiAt() || oiBtn("I don't have a product key"); },
    done: function () { return oiEv("inst-ws-key", function (e) { return e.none; }) >= 0; } },
  { tag: "Windows Setup", win: null,
    say: "Choose Windows 11 Pro, then press Next.",
    why: "With no key typed, you choose the edition, and it has to be the one the licence covers. Home wouldn't activate, and Home can't join a domain.",
    target: function () { return oiAt() || oiRadio("Windows 11 Pro") || oiText(/^Next$/); },
    done: function () { return oiEv("inst-ws-edition", function (e) { return e.edition === "Windows 11 Pro"; }) >= 0; } },
  { tag: "Windows Setup", win: null,
    say: "Press Accept for the licence terms.",
    why: "Setup won't go on without it.",
    target: function () { return oiAt() || oiText(/^Accept$/); },
    done: function () { return oiEv("inst-ws-terms") >= 0; } },
  { tag: "Where to install", win: null,
    say: "Here's the vendor's drive. Select Drive 0 Partition 1: VENDOR TEST, press Next, and read exactly what Setup says.",
    why: "Never guess at a disk screen: read it. Setup's message names the problem.",
    target: function () { const s = oiScr(); const row = oiRow(/^Drive 0 Partition 1/); return oiAt() || (row && !row.classList.contains("sel") ? row : s && s.querySelector('[aria-label="Install Windows on the selected location"]')); },
    done: function () { return oiEv("inst-ws-mbr") >= 0; } },
  { tag: "Where to install", win: null,
    say: "\"The selected disk is of the MBR partition style. On EFI systems, Windows can only be installed to GPT disks.\" With the partition still selected, press Delete partition.",
    why: "The PC starts in UEFI mode, and UEFI needs Windows on a GPT disk. Formatting would empty the partition but leave the disk MBR. Deleting it leaves unallocated space, and Setup lays that out as GPT itself. Only do this on a drive you're meant to wipe.",
    target: function () { const row = oiRow(/^Drive 0 Partition 1/); return oiAt() || (row && !row.classList.contains("sel") ? row : oiBtn("Delete the selected partition")); },
    done: function () { return oiEv("inst-ws-delete") >= 0; } },
  { tag: "Where to install", win: null,
    say: "Select Drive 0 Unallocated Space, then press Next.",
    why: "Installing to unallocated space lets Setup make every partition Windows needs: the EFI system partition, the reserved one, Windows itself, and recovery.",
    target: function () { const s = oiScr(); const row = oiRow(/^Drive 0 Unallocated/); return oiAt() || (row && !row.classList.contains("sel") ? row : s && s.querySelector('[aria-label="Install Windows on the selected location"]')); },
    done: function () { return oiEv("inst-ws-target") >= 0; } },
  { tag: "Where to install", win: null,
    say: "Check the summary (Windows 11 Pro, on the unallocated space), then press Install.",
    why: "The last look before Setup writes to the drive.",
    target: function () { return oiAt() || oiText(/^Install$/); },
    done: function () { return oiEv("inst-ws-install") >= 0; } },
  { tag: "Where to install", win: null,
    say: "Windows is copied. Press Restart now.",
    why: "Setup finishes from the drive it just installed to.",
    target: function () { return oiAt() || oiText(/^Restart now$/); },
    done: function () { const c = oiEv("inst-ws-install"); return c >= 0 && oiEv("inst-restart") > c; } },
  { tag: "Where to install", win: null,
    say: "Back at the start-up screen: this time press Let it start. Don't use the Boot Menu.",
    why: "The drive is first in the boot order and now has Windows on it. Choosing the USB again would start Setup over from the beginning.",
    target: function () { return oiAt() || oiBtn("Let the PC start from its boot order"); },
    done: function () { return oiEv("inst-boot", function (e) { return e.from === "disk"; }) >= 0; } },
  { tag: "First-run setup", win: null,
    say: "Windows' first-run setup. United Kingdom is right: press Yes.",
    why: "One question per screen from here.",
    target: function () { return oiAt() || oiText(/^Yes$/); },
    done: function () { return oiEv("inst-oobe-region") >= 0; } },
  { tag: "First-run setup", win: null,
    say: "Name the device WS3-DEV, as Mason's note says, then press Next.",
    why: "A new drive doesn't make it a new PC. DNS, the asset register and the domain all know it as WS3-DEV.",
    target: function () { return oiAt() || oiInput('[id^="oobe-name-"]') || oiText(/^Next$/); },
    done: function () { return oiEv("inst-oobe-name", function (e) { return e.name === "WS3-DEV"; }) >= 0; } },
  { tag: "First-run setup", win: null,
    say: "Choose Set up for work or school, then press Next.",
    why: "It's Rafiki's PC, not someone's own. Personal use would tie it to a personal Microsoft account.",
    target: function () { return oiAt() || oiRadio("Set up for work or school") || oiText(/^Next$/); },
    done: function () { return oiEv("inst-oobe-how", function (e) { return e.how === "work"; }) >= 0; } },
  { tag: "First-run setup", win: null,
    say: "This screen wants a Microsoft Entra ID account, and Rafiki doesn't use Entra ID. Open Sign-in options, then press Domain join instead.",
    why: "Rafiki's accounts are in its own Active Directory domain, on its own server. Windows 11 doesn't join an Active Directory domain during setup: it makes a local account, and you join the domain from Windows.",
    target: function () { const o = oiBtn("Sign-in options"); return oiAt() || (o && o.getAttribute("aria-expanded") !== "true" ? o : oiBtn("Domain join instead")); },
    done: function () { return oiEv("inst-oobe-domain-instead") >= 0; } },
  { tag: "First-run setup", win: null,
    say: "Make the local account: a user name such as benchtech and a password of your own, then press Next.",
    why: "It's the PC's first account, so it's an administrator. You'll use it to join the domain; Dev never needs it.",
    target: function () { return oiAt() || oiInput('[id^="oobe-local-"]') || oiInput('[id^="oobe-lpass-"]') || oiText(/^Next$/); },
    done: function () { return oiEv("inst-oobe-local") >= 0; } },
  { tag: "First-run setup", win: null,
    say: "Press Accept on the privacy settings.",
    why: "Rafiki's policy sets these once the PC is on the domain.",
    target: function () { return oiAt() || oiText(/^Accept$/); },
    done: function () { return oiEv("inst-oobe-privacy") >= 0; } },
  { tag: "Join the domain", win: null,
    say: "Windows is up, signed in with the local account, on WORKGROUP. Press Start, type domain, and open System Properties.",
    why: "System Properties (sysdm.cpl) › Computer Name is where a PC's name and its domain are set. Settings › Accounts › Access work or school does the same job.",
    target: function () { return oiAt() || tool("WS3", "System Properties"); },
    done: function () { return oiEv("opened", function (e) { return e.app === "sysprot"; }) >= 0; } },
  { tag: "Join the domain", win: null,
    say: "Press Change…, say Yes to User Account Control, choose Domain, type RAFIKI, and press OK. When Windows asks, use RAFIKI\\itadmin and Bench-Tech-2026.",
    why: "Joining needs an account allowed to join PCs to the domain: itadmin, from Mason's note. Dev's own account can't. Check the name says WS3-DEV while you're there.",
    target: function () {
      if (oiAt()) return oiAt(); const s = oiScr(); if (!s) return null; const d = oiDlg();
      if (d && d.classList.contains("uac")) return byText(d, /^Yes$/);
      if (d && d.classList.contains("sysname")) { const r = d.querySelector('[id^="cn-domain-"][type="radio"]'); if (r && !r.checked) return r; const di = d.querySelector('[id^="cn-dom-"]'); if (di && !di.value) return di; const u = d.querySelector('[id^="cn-u-"]'); if (u && !u.value) return u; const p = d.querySelector('[id^="cn-p-"]'); if (p && !p.value) return p; return d.querySelector(".primary"); }
      return inWin("WS3", "System Properties", function (w) { return w.querySelector('[aria-label="Change this computer\'s name or domain"]'); });
    },
    done: function () { return oiEv("inst-rename", function (e) { return e.domain; }) >= 0; } },
  { tag: "Join the domain", win: null,
    say: "\"Welcome to the RAFIKI domain.\" Press Restart now.",
    why: "A domain join takes effect at the next restart.",
    target: function () { return oiAt() || oiText(/^Restart now$/); },
    done: function () { const j = oiEv("inst-rename", function (e) { return e.domain; }); return j >= 0 && oiEv("inst-post") > j; } },
  { tag: "Join the domain", win: null,
    say: "Press Let it start.",
    why: "It starts from the drive, now as a member of RAFIKI.",
    target: function () { return oiAt() || oiBtn("Let the PC start from its boot order"); },
    done: function () { const j = oiEv("inst-rename", function (e) { return e.domain; }); return j >= 0 && oiEv("inst-boot", function (e) { return e.from === "disk"; }) > j; } },
  { tag: "Hand it over", win: null,
    say: "Dev has come back to the desk. Press Let Dev sign in: Dev types the password.",
    why: "The user signs in with their own domain account, and Windows makes their profile the first time. You never ask for a user's password.",
    target: function () { return oiAt() || oiText(/^Let Dev sign in$/); },
    done: function () { return oiEv("inst-signin") >= 0; } },
  { tag: "Close it out", win: "helpdesk",
    say: "Dev is in. Walk back to your desk, and press Resolve on the ticket.",
    why: "Dev checks it, and the ticket moves on to the write-up.",
    target: function () { return walkUI ? document.querySelector(".wo-back") : document.querySelector('[data-coach="resolve"]'); },
    done: function () { const st = E.T(); return oiOn() && !!(st && st.stage !== "work"); } },
  { tag: "Document it", win: "helpdesk",
    say: "Answer Mason's question: why wouldn't Setup install to the vendor's partition?",
    why: "Think about the message Setup gave, and how the PC was starting.",
    target: function () { return document.querySelector("[data-win=helpdesk] .opts"); },
    done: function () { const st = E.T(); return oiOn() && !!(st && (st.closeOK || st.stage === "done")); } },
  { tag: "Document it", win: "helpdesk",
    say: "Write the notes: the disk problem and what you did, the edition, the name, the domain join, and that Dev signed in. Then press Close the ticket.",
    why: "For example: \"Vendor drive was MBR; UEFI needs GPT. Deleted the vendor partition, installed Windows 11 Pro (digital licence) to unallocated space. Named WS3-DEV, joined RAFIKI, Dev signed in.\" Use your own words.",
    target: function () { return document.querySelector("#res-note"); },
    done: function () { const st = E.state().tickets.OI1; return !!(st && st.stage === "done"); } }
], end: "That's a clean install, start to finish: the installer from the Boot Menu in UEFI mode, the edition the licence covers, an MBR disk turned GPT by deleting its partition, the PC's own name, and the domain joined from Windows. More OS-installation tickets follow." };
/* ------------------------------------------------ OI2: the walk */
function o2(test) { const t = E.ticket(); return !!(t && t.id === "OI2") && lastAt("WS2", test) >= 0; }
function o2at(test) { return lastAt("WS2", test); }
WALKS.OI2 = { mode: "walk", machine: "WS2", steps: [
  { goal: "Take the ticket", win: "helpdesk", how: "In Help Desk, open Brenda's ticket and press Assign to me and start.", done: function () { const t = E.ticket(); return !!(t && t.id === "OI2" && E.T()); } },
  { goal: "Find out exactly which requirement fails", how: "On Brenda's PC, there's an app for exactly this: Start search finds it. Some of this job happens before Windows starts, so you'll want to be at her desk.", done: function () { return o2(function (e) { return e.kind === "inst-health"; }); } },
  { goal: "Put right what's switched off", how: "It's set before Windows starts: restart, and read the start-up screen for the key.", done: function () { const t = E.ticket(); return !!(t && t.id === "OI2") && E.machine("WS2").inst.fw.tpmOn; } },
  { goal: "Check again", how: "The same app, now.", done: function () { const f = o2at(function (e) { return e.kind === "inst-fw-save"; }); return f >= 0 && o2at(function (e) { return e.kind === "inst-health" && e.ok; }) > f; } },
  { goal: "Start the upgrade from inside Windows", how: "The installer on your bench has a program you run from Windows. Starting the PC from it would be a clean install.", done: function () { return o2(function (e) { return e.kind === "inst-up-start"; }); } },
  { goal: "Keep what Brenda asked to keep", how: "Read her message again before you choose.", done: function () { return o2(function (e) { return e.kind === "inst-up-install" && e.keep === "all"; }); } },
  { goal: "Let the upgrade finish", how: "It finishes as the PC starts from its drive.", done: function () { return o2(function (e) { return e.kind === "inst-up-applied"; }); } },
  { goal: "Brenda signs in, and PayWise works", how: "Her own account, then the program she cares about most.", done: function () { const a = o2at(function (e) { return e.kind === "inst-up-applied"; }); return a >= 0 && o2at(function (e) { return e.kind === "launch" && e.app === "PayWise" && e.result === "ok"; }) > a; } },
  { goal: "Resolve the ticket", win: "helpdesk", how: "Back in Help Desk.", done: function () { const st = E.T(); const t = E.ticket(); return !!(t && t.id === "OI2" && st && st.stage !== "work"); } },
  { goal: "Answer Brenda's question, and write the notes", win: "helpdesk", how: "Why Windows said no, what you changed, how you upgraded, and that PayWise works.", done: function () { const st = E.state().tickets.OI2; return !!(st && st.stage === "done"); } }
], end: "That's an upgrade done properly: the real reason found, put right where it lives, and Windows 11 in place with everything Brenda asked to keep. OI3 is yours to run." };
WALKS.CE2 = { mode: "walk", machine: "TECH", steps: [
  { goal: "Take the ticket and open the chat", how: "In Help Desk.", done: function () { const t = E.ticket(); return !!(t && t.id === "CE2" && W.custchat); } },
  { goal: "Open the chat professionally", how: "Acknowledge John and offer help.", done: function () { return chatAt("CE2") > 0; } },
  { goal: "Narrow it down", how: "Reading works and sending doesn't: which side of the settings is that?", done: function () { return chatAt("CE2") > 1; } },
  { goal: "Compare his phone with the mail server", how: "Mobile devices: his phone, then Mail server.", done: function () { return chatAt("CE2") > 2; } },
  { goal: "Tell him exactly what to change", how: "Everything that differs from what the server accepts for sending.", done: function () { return chatAt("CE2") > 3; } },
  { goal: "Confirm it yourself", how: "Sync now, and read both lines.", done: function () { return chatAt("CE2") > 4; } },
  { goal: "Close the chat well", how: "Politely, checking there's nothing else.", done: function () { return chatAt("CE2") > 5; } },
  { goal: "Resolve, record why, and write the notes", how: "In Help Desk.", done: function () { const st = E.state().tickets.CE2; return !!(st && st.stage === "done"); } }
], end: "You walked it. The rest are yours: vanishing emails, a server that can't be found, an old password, and a friend's 'fix'." };
WALKS.CR2 = { mode: "walk", machine: "TECH", steps: [
  { goal: "Take the ticket and open the chat", how: "In Help Desk.", done: function () { const t = E.ticket(); return !!(t && t.id === "CR2" && W.custchat); } },
  { goal: "Open the chat professionally", how: "Thank Tom for asking, and offer help.", done: function () { return chatAt("CR2") > 0; } },
  { goal: "Explain the risk", how: "Who else knows what's printed on that sticker?", done: function () { return chatAt("CR2") > 1; } },
  { goal: "See what it's set to now", how: "The 92 Series app: Wireless.", done: function () { return chatAt("CR2") > 2; } },
  { goal: "Guide the change", how: "Name, passphrase, the strongest security every device supports, and what makes the router use them.", done: function () { return chatAt("CR2") > 3; } },
  { goal: "Confirm it on the router", how: "Status: running, and every device back on.", done: function () { return chatAt("CR2") > 4; } },
  { goal: "Close the chat well", how: "Politely, checking there's nothing else.", done: function () { return chatAt("CR2") > 5; } },
  { goal: "Resolve, record why, and write the notes", how: "In Help Desk.", done: function () { const st = E.state().tickets.CR2; return !!(st && st.stage === "done"); } }
], end: "You walked it. The rest are yours: a lost change, a firmware update, an old laptop, and noisy neighbours." };
WALKS.N2 = { mode: "walk", machine: "TECH", steps: [
  { goal: "Take the ticket", how: "In Help Desk.", done: function () { const t = E.ticket(); return !!(t && t.id === "N2" && E.T()); } },
  { goal: "Read the neighbours' channels", how: "The Wi-Fi scan, on Status.", done: function () { return rAt("N2", function (e) { return e.kind === "view" && e.tab === "status"; }) >= 0; } },
  { goal: "Set what Maria gave you, and decide the rest", how: "Name and password are given. Security, width and channel come from her clues and the scan.", done: function () { return ["form", "saved", "running"].some(function (c) { return nrSet("N2", c, N2T); }); } },
  { goal: "Only the family's devices", how: "Which setting, and which devices go on its list?", done: function () { return ["form", "saved", "running"].some(function (c) { return nrAllowed("N2", c); }); } },
  { goal: "Make the router use it all", how: "The bar tells you what's left.", done: function () { return nrSet("N2", "running", N2T) && nrAllowed("N2", "running"); } },
  { goal: "Prove it on Status", how: "Overlap, the family, the stranger.", done: function () { return lookedAfterRestart("N2"); } },
  { goal: "Resolve, record why, and write the notes", how: "In Help Desk.", done: function () { const st = E.state().tickets.N2; return !!(st && st.stage === "done"); } }
], end: "You walked it. The rest of the street is yours, including a family who want the filtering off again." };
/* ---------------------------------------- the port-forwarding crawl and walk */
function pfDev(id, role) { const r = rr(id); return r ? RT.role(r, role) : null; }
function pfFwd(id, cfg) { const r = rr(id), pc = pfDev(id, "remote"); return !!(r && pc && r[cfg].forwards.some(function (f) { return f.ext === "3389" && f.proto === "TCP" && f.ip === pc.ip && f.port === "3389"; })); }
function pfHost(id, cfg) { const r = rr(id), gc = pfDev(id, "game"); return !!(r && gc && gc.port === "screened" && r[cfg].screened === gc.ip); }
function pfSec(id, cfg) { const r = rr(id); return !!(r && (r[cfg].wifi.security === "WPA2" || r[cfg].wifi.security === "WPA2/WPA3")); }
function pfAll(id, cfg) { return pfFwd(id, cfg) && pfHost(id, cfg) && pfSec(id, cfg); }
function pfAddTarget() { const w = rwin(); if (!w) return null; const want = { "rt-fe": "3389", "rt-fi": "192.168.10.20", "rt-fq": "3389" }; return Object.keys(want).map(function (k) { return w.querySelector("#" + k); }).filter(function (x) { return x && x.value !== want[x.id]; })[0] || rBtn(/^Add the forward$/); }
function bootAt(id) { return rAt(id, function (e) { return e.kind === "reboot"; }); }
WALKS.P1 = { machine: "TECH", steps: [
  { tag: "See it for yourself", win: "helpdesk",
    say: "Read Alex's request. Two things are wanted from outside: Remote Desktop to the Windows PC, and the console's online features. And the Wi-Fi security is old. Press Assign to me and start.",
    why: "This is the exam's port-forwarding question as a real job: one device reached through one port, one device that needs everything open.",
    target: function () { return document.querySelector('[data-coach="assign"]'); },
    done: function () { const t = E.ticket(); return !!(t && t.id === "P1" && E.T()); } },
  { tag: "See it for yourself", win: "helpdesk",
    say: "Alex has shared the router. Press Open the 92 Series app.",
    target: function () { return W.router ? null : document.querySelector('[data-coach="open-router"]'); },
    done: function () { return !!W.router; } },
  { tag: "Find the evidence", win: "helpdesk",
    say: "Status shows the Windows PC at 192.168.10.20 and the console, both in yellow LAN ports. The console needs everything open, so it belongs outside the LAN. That's physical: on Alex's ticket, ask them to plug the console into the orange SCREENED SUBNET port.",
    why: "A screened subnet is a separate network for a device that has to accept connections from the internet, kept apart from the LAN.",
    target: function () { return document.querySelector('[data-coach="ask-console-port"]'); },
    done: function () { const gc = pfDev("P1", "game"); return !!(gc && gc.port === "screened"); } },
  { tag: "Find the evidence", win: "router",
    say: "Alex says the console now shows a new address. Check it on the router: press Status and read the console's Address.",
    why: "The address comes from the side it's plugged into: the screened subnet is 10.100.0.x.",
    target: function () { return rTab("Status"); },
    done: function () { const moved = rAt("P1", function (e) { return e.kind === "moved-game"; }); return moved >= 0 && rAt("P1", function (e) { return e.kind === "view" && e.tab === "status"; }) > moved; } },
  { tag: "Fix it", win: "router",
    say: "Now the PC. Open Port forwarding and add one forward: outside port 3389, TCP, to the PC's address 192.168.10.20, inside port 3389. Then press Add the forward.",
    why: "Remote Desktop listens on TCP 3389. Forwarding just that one port to the PC reaches it from outside while it stays protected on the LAN.",
    target: function () { return rTab("Port forwarding") && !rwin().querySelector("#rt-fe") ? rTab("Port forwarding") : pfAddTarget(); },
    done: function () { return pfFwd("P1", "form") || pfFwd("P1", "saved"); } },
  { tag: "Fix it", win: "router",
    say: "Below it, set the screened-subnet (DMZ) host to the console's new address: 10.100.0.50.",
    why: "The screened-subnet host gets every connection that isn't forwarded somewhere else: exactly what the console's chat and online play need.",
    target: function () { const w = rwin(); return w && w.querySelector("#rt-dmz"); },
    done: function () { return pfHost("P1", "form") || pfHost("P1", "saved"); } },
  { tag: "Fix it", win: "router",
    say: "Last setting: the Wi-Fi is on WEP. Open Wireless and set Security to WPA2-Personal: a shared passphrase, the right kind for a home.",
    why: "WEP is cracked in minutes. Homes use a passphrase (WPA2 PSK); Enterprise needs a RADIUS server a home doesn't have.",
    target: function () { const w = rwin(); if (!w) return null; const sel = w.querySelector("#rt-sec"); return sel || rTab("Wireless"); },
    done: function () { return pfSec("P1", "form") || pfSec("P1", "saved"); } },
  { tag: "Fix it", win: "router",
    say: "The bar says Not saved. Press Save.",
    target: function () { return rBtn(/^Save$/); },
    done: function () { return pfAll("P1", "saved"); } },
  { tag: "Fix it", win: "router",
    say: "Saved, not running. Press Restart router.",
    target: function () { return rBtn(/^Restart router$/); },
    done: function () { return pfAll("P1", "running"); } },
  { tag: "Test it", win: "helpdesk",
    say: "Prove it from outside. On the ticket, ask Alex to try connecting to the PC from work.",
    target: function () { return document.querySelector('[data-coach="ask-test-remote"]'); },
    done: function () { return rAt("P1", function (e) { return e.kind === "tested-remote" && e.ok; }) > bootAt("P1"); } },
  { tag: "Test it", win: "helpdesk",
    say: "And the console: ask Alex to start an online game and read the NAT type.",
    target: function () { return document.querySelector('[data-coach="ask-test-game"]'); },
    done: function () { return rAt("P1", function (e) { return e.kind === "tested-game" && e.open; }) > bootAt("P1"); } },
  { tag: "Close it out", win: "helpdesk",
    say: "Both work. Press Resolve.",
    target: function () { return document.querySelector('[data-coach="resolve"]'); },
    done: function () { const st = E.state().tickets.P1; return !!(st && st.stage !== "work"); } },
  { tag: "Close it out", win: "helpdesk",
    say: "Record why the PC stays on the LAN and the console goes in the screened subnet.",
    target: function () { return document.querySelector(".res .opts"); },
    done: function () { const st = E.state().tickets.P1; return !!(st && (st.closeOK || st.stage === "done")); } },
  { tag: "Document it", win: "helpdesk",
    say: "Write the notes: what you forwarded, where the console went, and the Wi-Fi security. Then Close the ticket.",
    target: function () { return document.querySelector("#res-note"); },
    done: function () { const st = E.state().tickets.P1; return !!(st && st.stage === "done"); } }
], end: "That's port forwarding for real: one port to the device on the LAN, the console outside it, the Wi-Fi secured, and both proven from outside. Sam's strict NAT is next: you drive." };
WALKS.P2 = { mode: "walk", machine: "TECH", steps: [
  { goal: "Take the ticket", how: "In Help Desk.", done: function () { const t = E.ticket(); return !!(t && t.id === "P2" && E.T()); } },
  { goal: "Read where each device is plugged in", how: "Status, in the 92 Series app: the port and the address.", done: function () { return rAt("P2", function (e) { return e.kind === "view" && e.tab === "status"; }) >= 0; } },
  { goal: "Get the console outside the LAN", how: "That's physical. Who can plug it in for you?", done: function () { const gc = pfDev("P2", "game"); return !!(gc && gc.port === "screened"); } },
  { goal: "Reach the PC from outside, one port only", how: "Which port does Remote Desktop use, and which address is the PC on?", done: function () { const r = rr("P2"), pc = pfDev("P2", "remote"); return !!(r && pc && ["form", "saved", "running"].some(function (c) { return r[c].forwards.some(function (f) { return f.ext === "3389" && f.ip === pc.ip; }); })); } },
  { goal: "Open everything else to the console", how: "Its new address, in the right box on Port forwarding.", done: function () { return pfHost("P2", "form") || pfHost("P2", "saved") || pfHost("P2", "running"); } },
  { goal: "Secure the Wi-Fi for a home", how: "Not WEP. What does a home use?", done: function () { return pfSec("P2", "form") || pfSec("P2", "saved") || pfSec("P2", "running"); } },
  { goal: "Make the router use it all", how: "The bar tells you what's left.", done: function () { return pfAll("P2", "running"); } },
  { goal: "Have Sam test both from outside", how: "On the ticket's call panel.", done: function () { const b = bootAt("P2"); return rAt("P2", function (e) { return e.kind === "tested-remote" && e.ok; }) > b && rAt("P2", function (e) { return e.kind === "tested-game" && e.open; }) > b; } },
  { goal: "Resolve, record why, and write the notes", how: "In Help Desk.", done: function () { const st = E.state().tickets.P2; return !!(st && st.stage === "done"); } }
], end: "You walked it. The rest are yours: SSH to a Linux server, VNC to a Mac, a streaming console, and a house that can use WPA3." };
/* ---------------------------------------- the Wi-Fi crawl and walk */
function bwin() { return document.querySelector("[data-win=browser]"); }
function bTab(name) { const w = bwin(); return w ? byText(w.querySelector(".rt-tabs"), new RegExp("^" + name + "$")) : null; }
function bBtn(re) { const w = bwin(); return w ? byText(w, re) : null; }
function wfOn(id, cfg, k, v) { const r = rr(id); return !!(r && String(r[cfg].wifi[k]) === String(v)); }
function wfAll(id, cfg) { return wfOn(id, cfg, "ssid", "MainOffice1") && wfOn(id, cfg, "pass", "Ma50n1SB35t!") && wfOn(id, cfg, "security", "WPA3") && wfOn(id, cfg, "band", "2.4") && wfOn(id, cfg, "channel", 6); }
function wfField(id) { const w = bwin(); if (!w) return null; const want = { "rt-ssid": "MainOffice1", "rt-wpass": "Ma50n1SB35t!", "rt-sec": "WPA3", "rt-band": "2.4", "rt-chan": "6" }; return Object.keys(want).map(function (k) { return w.querySelector("#" + k); }).filter(function (x) { return x && x.value !== want[x.id]; })[0] || null; }
WALKS.W1 = { machine: "TECH", steps: [
  { tag: "See it for yourself", win: "helpdesk",
    say: "Read Mason's message. He gives you the name, the password and the channel exactly. Two choices are yours: the security (\"every device supports the latest\") and the band (\"thick walls\"). Press Assign to me and start.",
    why: "The exam's Wi-Fi question works the same way: some answers are given, the rest are decided by a clue in the text.",
    target: function () { return document.querySelector('[data-coach="assign"]'); },
    done: function () { const t = E.ticket(); return !!(t && t.id === "W1" && E.T()); } },
  { tag: "See it for yourself", win: "helpdesk",
    say: "The access point is on our own network. Press Open 192.168.1.1 in the browser.",
    why: "Our own equipment is reached directly at its address. Customers' routers come through the 92 Series app instead.",
    target: function () { return W.browser ? null : document.querySelector('[data-coach="open-web"]'); },
    done: function () { return !!W.browser; } },
  { tag: "See it for yourself", win: "browser",
    say: "Sign in. The username is admin; the password is the one from the closet binder in Mason's message: Clos3t-AP-2026. Then press Sign in.",
    why: "An access point's settings are behind its own admin password, separate from the Wi-Fi password.",
    target: function () { const w = bwin(); if (!w) return null; const p = w.querySelector("#wb-pass"); return p && !p.value ? p : w.querySelector(".wb-login .b.pri"); },
    done: function () { const r = rr("W1"); return !!(r && r.events.some(function (e) { return e.kind === "sign-in"; })); } },
  { tag: "Find the evidence", win: "browser",
    say: "You're on Status. Read the Devices: the Office 3 tablet and John's laptop can't find MainOffice1 yet, because it doesn't exist. Look at the band it's running now. Then open the Wireless tab.",
    why: "Status first, always: you'll know what changed when you check again.",
    target: function () { return bTab("Wireless"); },
    done: function () { return rAt("W1", function (e) { return e.kind === "view" && e.tab === "wireless"; }) >= 0; } },
  { tag: "Fix it", win: "browser",
    say: "Set each one: SSID MainOffice1, password Ma50n1SB35t!, security WPA3-Personal (every device supports it), band 2.4 GHz (thick walls), channel 6. The ring moves to the next box as you go.",
    why: "2.4 GHz reaches further and gets through walls; 5 GHz is faster but stopped by them. The strongest security every device supports is the right one.",
    target: function () { return wfField("W1"); },
    done: function () { return wfAll("W1", "form") || wfAll("W1", "saved"); } },
  { tag: "Fix it", win: "browser",
    say: "The bar says \"Not saved\". Press Save.",
    target: function () { return bBtn(/^Save$/); },
    done: function () { return wfAll("W1", "saved"); } },
  { tag: "Fix it", win: "browser",
    say: "\"Saved, not running.\" Press Restart access point. It will sign you out when it restarts, as a real one does: sign back in afterwards.",
    target: function () { return bBtn(/^Restart access point$/); },
    done: function () { return wfAll("W1", "running"); } },
  { tag: "Test it", win: "browser",
    say: "Sign back in (admin, Clos3t-AP-2026) and read Status: the tablet in Office 3, two thick walls away, should be connected now.",
    why: "The tablet is the device the band choice was for. If it connects, the choice was right.",
    target: function () { const w = bwin(); if (!w) return null; const p = w.querySelector("#wb-pass"); if (p) return !p.value ? p : w.querySelector(".wb-login .b.pri"); return bTab("Status"); },
    done: function () { return lookedAfterRestart("W1"); } },
  { tag: "Close it out", win: "helpdesk",
    say: "Back in Help Desk, press Resolve on the ticket.",
    target: function () { return document.querySelector('[data-coach="resolve"]'); },
    done: function () { const st = E.state().tickets.W1; return !!(st && st.stage !== "work"); } },
  { tag: "Close it out", win: "helpdesk",
    say: "Record why 2.4 GHz was right for this building. Pick it on the ticket.",
    target: function () { return document.querySelector(".res .opts"); },
    done: function () { const st = E.state().tickets.W1; return !!(st && (st.closeOK || st.stage === "done")); } },
  { tag: "Document it", win: "helpdesk",
    say: "Write the resolution notes: what you set, and why that band and that security. Then press Close the ticket.",
    target: function () { return document.querySelector("#res-note"); },
    done: function () { const st = E.state().tickets.W1; return !!(st && st.stage === "done"); } }
], end: "That's the Wi-Fi crawl, and it's the exam's Wi-Fi question done for real: the given settings, the two decided by clues, Save, restart, and proof on the tablet. The staff network is next: you drive." };
WALKS.W2 = { mode: "walk", machine: "TECH", steps: [
  { goal: "Take the ticket", how: "In Help Desk.", done: function () { const t = E.ticket(); return !!(t && t.id === "W2" && E.T()); } },
  { goal: "Sign in to the access point", how: "It's on our own network, at its address. The password's in Mason's message.", done: function () { const r = rr("W2"); return !!(r && r.events.some(function (e) { return e.kind === "sign-in"; })); } },
  { goal: "Read the Wi-Fi scan", how: "Status shows the networks nearby and their channels.", done: function () { return rAt("W2", function (e) { return e.kind === "view" && e.tab === "status"; }) >= 0; } },
  { goal: "Set what Mason gave you, and decide the rest", how: "Name, password and channel are given. Security: what do the devices support? Band: what's between the tablet and the closet?", done: function () { const r = rr("W2"); return !!(r && ["form", "saved", "running"].some(function (c) { return r[c].wifi.ssid === "Rafiki-Staff" && r[c].wifi.pass === "T3amR@fiki2026" && r[c].wifi.security === "WPA3" && r[c].wifi.band === "2.4" && String(r[c].wifi.channel) === "11"; })); } },
  { goal: "Make the access point actually use it", how: "The bar under its name tells you what's left.", done: function () { const r = rr("W2"); return !!(r && r.running.wifi.ssid === "Rafiki-Staff" && String(r.running.wifi.channel) === "11" && r.running.wifi.band === "2.4"); } },
  { goal: "Check the tablet connects", how: "Sign back in after the restart and read Status.", done: function () { return lookedAfterRestart("W2"); } },
  { goal: "Resolve the ticket", how: "In Help Desk.", done: function () { const st = E.state().tickets.W2; return !!(st && st.stage !== "work"); } },
  { goal: "Record why channel 11", how: "Pick it on the ticket.", done: function () { const st = E.state().tickets.W2; return !!(st && (st.closeOK || st.stage === "done")); } },
  { goal: "Write the resolution notes", how: "What you set, and why that channel and band.", done: function () { const st = E.state().tickets.W2; return !!(st && st.stage === "done"); } }
], end: "You walked it. The rest of the Wi-Fi tickets are yours: the conference room, an old printer, the guests, and a reset access point." };
Object.keys(WALKS).forEach(function (k) { WALKS[k].steps.forEach(function (st, i) { if (!i) return; const d = st.done; st.done = function () { const t = E.ticket(); return !!(t && t.id === k) && d(); }; }); });
function crawling() { const t = E.ticket(); return !!(t && LEVEL[t.id] === "crawl" && WALKS[t.id] && !(E.T() && E.T().stage === "done")); }
/* Has the student typed this command on the ticket's PC? */
function typed(re) { const t = E.ticket(); return !!(t && (L.lines[t.id] || []).some(function (x) { return re.test(x.replace(/\s+/g, " ").trim()); })); }
function walkFor() {
  const t = E.ticket(); if (t && LEVEL[t.id] && WALKS[t.id]) return t.id;
  if (L.sel && LEVEL[L.sel] && WALKS[L.sel] && !(E.state().tickets[L.sel] && E.state().tickets[L.sel].status === "closed") && (!t || t.id === L.sel)) return L.sel;
  return null;
}
let coachBox = null, lastStep = -1, marking = false, coachQueued = false;
/* Deferred to the next frame, so a step is judged on the screen as drawn,
   not half-way through a redraw. */
function coachTick() { if (coachQueued) return; coachQueued = true; requestAnimationFrame(function () { coachQueued = false; coachNow(); }); }
function coachNow() {
  if (!desk.isConnected || !task.firstChild) return;
  const id = walkFor();
  const c = id ? (L.coach[id] = L.coach[id] || {}) : null;
  if (!id && !(coachBox && coachBox.dataset.finished)) { if (coachBox) { coachBox.remove(); coachBox = null; desk.style.right = ""; } return; }
  const walk = WALKS[id || coachBox.dataset.walk];
  /* crawl: strictly in order. walk: anything done counts, in any order. */
  if (id) walk.steps.forEach(function (s, i) { if (!c[i] && (walk.mode === "walk" || i <= firstOpen(walk, c)) && s.done()) c[i] = true; });
  /* A student who skips ahead isn't left stuck: once a later step is
     really done, the steps before it count as done too. Steps whose test
     proves nothing on its own ("the box is closed") don't carry back. */
  if (id && walk.mode !== "walk") { let top = -1; walk.steps.forEach(function (s, i) { if (!s.weak && (c[i] || s.done())) top = i; }); for (let i = 0; i <= top; i++) c[i] = true; }
  const n = id ? firstOpen(walk, c) : walk.steps.length;
  if (!coachBox) { coachBox = el("aside", "coach"); coachBox.setAttribute("aria-label", "Mason is walking you through this ticket"); root.appendChild(coachBox); desk.style.right = "var(--coach-w)"; fitWins(); }
  coachBox.dataset.walk = id || coachBox.dataset.walk;
  const waitNow = id && n < walk.steps.length && walk.steps[n].waiting ? String(walk.steps[n].waiting()) : "";
  const key = (id || coachBox.dataset.walk) + ":" + n + ":" + walk.steps.filter(function (x, i) { return c && c[i]; }).length;
  if (key !== coachBox.dataset.key || waitNow !== coachBox.dataset.wait) {
    const moved = key.split(":").slice(0, 2).join(":") !== String(coachBox.dataset.key || "").split(":").slice(0, 2).join(":"); coachBox.dataset.key = key; coachBox.dataset.wait = waitNow; lastStep = n; if (moved) delete coachBox.dataset.ringWin; drawCoach(walk, n); saveL(); if (moved && walk.mode !== "walk" && n < walk.steps.length) { const w = winOf(walk.steps[n]); if (W[w] && front !== w) { W[w].min = false; place(W[w]); focusWin(w); } } }
  /* within a step the work can move between windows (the next PC's
     Connect is back in Help Desk): bring forward the one with the ring */
  if (id && walk.mode !== "walk" && n < walk.steps.length) { const wNow = winOf(walk.steps[n]) || ""; if (wNow !== coachBox.dataset.winNow) { coachBox.dataset.winNow = wNow; if (W[wNow] && front !== wNow) { W[wNow].min = false; place(W[wNow]); focusWin(wNow); } } }
  mark(walk, n);
}
function winOf(s) { return typeof s.win === "function" ? s.win() : s.win; }
function firstOpen(walk, c) { for (let i = 0; i < walk.steps.length; i++) if (!c[i]) return i; return walk.steps.length; }
function drawCoach(walk, n) {
  coachBox.innerHTML = "";
  if (walk.mode === "walk") return drawWalk(walk, n);
  const h = el("div", "coach-h"); h.appendChild(el("span", "av", "M"));
  const hh = el("div"); hh.appendChild(el("strong", null, "Mason is walking you through it")); hh.appendChild(el("small", null, "Crawl · then walk · then run")); h.appendChild(hh);
  coachBox.appendChild(h);
  if (n >= walk.steps.length) {
    coachBox.dataset.finished = "1";
    const d = el("div", "coach-now"); d.setAttribute("role", "status"); d.appendChild(el("p", "coach-step", "Done ✓")); d.appendChild(el("p", "coach-say", walk.end));
    d.appendChild(btn("Close the walkthrough", "b pri", function () { coachBox.remove(); coachBox = null; desk.style.right = ""; }));
    coachBox.appendChild(d); return;
  }
  delete coachBox.dataset.finished;
  const s = walk.steps[n];
  const now = el("div", "coach-now"); now.setAttribute("role", "status"); now.setAttribute("aria-live", "polite");
  now.appendChild(el("p", "coach-step", "Step " + (n + 1) + " of " + walk.steps.length + " · " + s.tag));
  now.appendChild(el("p", "coach-say", s.say));
  if (s.cmd) { const k = el("code", "coach-cmd", s.cmd); k.setAttribute("aria-label", "Type: " + s.cmd); now.appendChild(k); }
  now.appendChild(el("p", "coach-why", s.why));
  if (s.waiting && s.waiting()) now.appendChild(el("p", "coach-wait", s.waiting()));
  now.appendChild(btn("Show me where", "b small", function () {
    const w = winOf(s); if (W[w]) { W[w].min = false; place(W[w]); focusWin(w); }
    const t = s.target(); if (t) { t.scrollIntoView({ block: "nearest", behavior: "smooth" }); t.classList.remove("coach-flash"); void t.offsetWidth; t.classList.add("coach-flash"); }
  }));
  coachBox.appendChild(now);
  const ol = el("ol", "coach-list");
  walk.steps.forEach(function (x, i) { const li = el("li", i < n ? "did" : i === n ? "on" : ""); li.appendChild(el("span", "mk", i < n ? "✓" : String(i + 1))); li.appendChild(el("span", null, x.list || x.say.split(". ")[0].replace(/[.:]$/, ""))); ol.appendChild(li); });
  coachBox.appendChild(ol);
}
/* WALK: the student drives. The checklist says what comes next and ticks
   itself off; "How?" opens a pointer for one item. Nothing is ringed. */
function drawWalk(walk, n) {
  const c = L.coach[coachBox.dataset.walk] || {};
  const h = el("div", "coach-h"); h.appendChild(el("span", "av", "M"));
  const hh = el("div"); hh.appendChild(el("strong", null, "Walk: you drive")); hh.appendChild(el("small", null, "Mason's checklist ticks itself off as you work")); h.appendChild(hh);
  coachBox.appendChild(h);
  if (n >= walk.steps.length) {
    coachBox.dataset.finished = "1";
    const d = el("div", "coach-now"); d.setAttribute("role", "status"); d.appendChild(el("p", "coach-step", "Done ✓")); d.appendChild(el("p", "coach-say", walk.end));
    d.appendChild(btn("Close the checklist", "b pri", function () { coachBox.remove(); coachBox = null; desk.style.right = ""; }));
    coachBox.appendChild(d); return;
  }
  delete coachBox.dataset.finished;
  const now = el("div", "coach-now"); now.setAttribute("role", "status"); now.setAttribute("aria-live", "polite");
  now.appendChild(el("p", "coach-step", "Next · " + (walk.steps.filter(function (x, i) { return c[i]; }).length) + " of " + walk.steps.length + " done"));
  now.appendChild(el("p", "coach-say", walk.steps[n].goal));
  now.appendChild(el("p", "coach-why", "Work it out on the PC. Stuck? Open How? on any item, or ask Mason in chat."));
  coachBox.appendChild(now);
  const ol = el("ol", "coach-list walk");
  walk.steps.forEach(function (x, i) {
    const li = el("li", c[i] ? "did" : i === n ? "on" : "");
    li.appendChild(el("span", "mk", c[i] ? "✓" : String(i + 1)));
    const body = el("div");
    const g = el("span", "wg", x.goal + (c[i] ? " · done" : ""));
    body.appendChild(g);
    if (!c[i]) { const d = el("details", "how"); const sm = el("summary", null, "How?"); d.appendChild(sm); d.appendChild(el("p", null, x.how)); body.appendChild(d); }
    li.appendChild(body); ol.appendChild(li);
  });
  coachBox.appendChild(ol);
}
/* The yellow ring on the one thing to press next. Screens redraw all the
   time, so the ring is put back after every redraw. */
function mark(walk, n) {
  if (marking) return; marking = true;
  root.querySelectorAll(".coach-target").forEach(function (x) { if (!walk || walk.mode === "walk" || n >= walk.steps.length || x !== walk.steps[n].target()) x.classList.remove("coach-target"); });
  if (walk && walk.mode !== "walk" && n < walk.steps.length) {
    const t = walk.steps[n].target(); if (t) t.classList.add("coach-target");
    /* the ring is never left hidden behind another window: when it moves
       into a different window, that window comes forward */
    const host = t && t.closest("[data-win]"), wid = host ? host.dataset.win : "";
    if (coachBox && wid !== coachBox.dataset.ringWin) { coachBox.dataset.ringWin = wid; if (W[wid] && front !== wid) { W[wid].min = false; place(W[wid]); focusWin(wid); } }
  }
  marking = false;
}
new MutationObserver(function () { if (!marking) coachTick(); }).observe(root, { childList: true, subtree: true });
/* typing changes nothing in the page's structure, but a ring on a box the
   student has just filled must move on to the next one */
root.addEventListener("input", function () { coachTick(); }); root.addEventListener("change", function () { coachTick(); });

/* =====================================================================
   THE WALK-OVER (owner, 1 October 2026: "if they have to physically go
   look at the machine … have the student walk to the office and 3D").

   From the IT bench in the network closet, the camera walks the route a
   person would: out of the closet door, along the corridor, through the
   office door, to the user's chair, and turns to their monitor. There the
   student sees the PC's real screen and can do what only someone at the
   desk can: press the power button, check the network cable. "Walk back"
   retraces the route to the laptop.
   ===================================================================== */
const BENCH = [14.6, 23.2], CLOSET_DOOR = [14.5, 16.6], HALL = [14.5, 14.5];
const ROUTES = {
  WS1: { path: [BENCH, CLOSET_DOOR, HALL, [10, 14.5], [10, 11.6], [9.4, 9], [9, 8.2]], look: [9, 3.0, 1.6] },
  WS4: { path: [BENCH, CLOSET_DOOR, HALL, [10, 14.5], [10, 11.6], [8.6, 9.6], [7.6, 8.2]], look: [1.6, 3.0, 8.2] },
  WS2: { path: [BENCH, CLOSET_DOOR, HALL, [16, 14.5], [16, 11.6], [20, 9], [23, 8.2]], look: [23, 3.0, 1.6] },
  WS3: { path: [BENCH, CLOSET_DOOR, HALL, [29.5, 14.5], [29.5, 11.6], [33, 9], [36, 8.2]], look: [36, 3.0, 1.6] },
  WS5: { path: [BENCH, CLOSET_DOOR, HALL, [4.0, 14.8], [3.9, 19.5], [3.9, 26.8], [6.0, 26.9]], look: [2, 3.0, 23.5] },
  FS01: { path: [BENCH, [13.8, 26.4], [11.8, 28.6]], look: [15.4, 3.6, 29.2] },
  MAIL01: { path: [BENCH, [13.8, 26.4], [11.8, 28.2]], look: [15.4, 5.2, 28.6] },
  BREAK: { path: [BENCH, CLOSET_DOOR, HALL, [21, 14.5], [21, 18.4], [24.5, 22.2], [27.5, 23.6]], look: [19.0, 3.4, 21.5] }
};
let walkUI = null;
function reduceMotion() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
function walkOver(id, opts) {
  if (walkUI) return; opts = opts || {};
  const place = id === "BREAK";
  const r = place ? { id: "BREAK", fullName: "Break counter", host: "the break counter", where: "the conference and break room", dept: "" } : rosterOf(id), first = r.fullName.split(" ")[0], whose = place ? "the break counter" : r.id === "FS01" || r.id === "MAIL01" ? "the " + r.fullName.toLowerCase() : first + "'s desk";
  const t = E.ticket(); if (t) logT(t.id, "Walked to " + r.host + " (" + r.where + ")");
  const ov = el("div", "walkover"); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Walking to " + whose);
  /* a cutscene has the whole screen; at the desk, Mason's panel is back */
  function besideCoach(on) { ov.style.right = on && coachBox ? "var(--coach-w)" : ""; window.dispatchEvent(new Event("resize")); }
  const stage = el("div", "wo-3d"); ov.appendChild(stage);
  /* the cutscene's frame: letterbox bars, a caption in the lower bar, and
     a black layer for the fades */
  const cine = el("div", "cine"); cine.setAttribute("aria-hidden", "true");
  const capT = el("p", "cine-t"), capS = el("p", "cine-s"); const bot = el("div", "cine-bot"); bot.appendChild(capT); bot.appendChild(capS);
  cine.appendChild(el("div", "cine-top")); cine.appendChild(bot); const fade = el("div", "cine-fade"); cine.appendChild(fade); ov.appendChild(cine);
  function caption(a, b) { capT.textContent = a; capS.textContent = b || ""; }
  function fadeTo(on, then) { fade.classList.toggle("on", !!on); setTimeout(function () { if (then) then(); }, reduceMotion() ? 0 : 450); }
  const bar = el("div", "wo-bar"); const say = el("p", "wo-say", "Getting up from your desk…"); say.setAttribute("role", "status");
  bar.appendChild(say); ov.appendChild(bar);
  root.appendChild(ov); walkUI = { ov: ov, id: id, office: function () { return office; } };
  if (!reduceMotion()) fade.classList.add("on");
  let office = null, walking = null;
  const route = ROUTES[id];
  function arrive() {
    if (!ov.isConnected) return;
    fadeTo(true, function () { arrived(); ov.classList.remove("cine-on"); fadeTo(false); });
  }
  function arrived() {
    besideCoach(true);
    if (place) { arrivedBreak(); return; }
    if (opts.safety) { arrivedSafety(); return; }
    if (office && window.innerWidth > 760) office.shift(0.3);
    say.textContent = "You're at " + whose + ": " + r.host + ", " + r.where + ".";
    const skip = bar.querySelector(".wo-skip"); if (skip) skip.remove();
    const panel = el("section", "wo-desk"); panel.setAttribute("aria-label", "At " + r.host);
    panel.appendChild(el("h2", null, "At " + r.host + " · " + r.fullName));
    const mon = el("div", "wo-monitor"); mon.setAttribute("aria-label", r.host + "'s monitor"); panel.appendChild(mon);
    const local = createDesktop(mon, { machine: function () { return E.machine(id); }, fleetLookup: E.lookup, fleet: E.fleet, noForward: function (x) { const e = emailById(x); return !!(e && e.noForward); }, isTech: false, before: E.before,
      clock: function () { const n = now(); return n.time + "  " + n.short; },
      onAct: function (a) {
        /* what is done at the desk ends a remote session to the same PC */
        const rw = W["rdp:" + id]; if (rw && rw.phase === "on") setTimeout(function () { if (a.type === "power" && a.op !== "on") dropped(rw, a.op); else if (!MW.online(E.machine(id))) dropped(rw, "net"); }, 0);
        if (a.type === "cmd" && E.ticket()) (L.lines[E.ticket().id] = L.lines[E.ticket().id] || []).push(String(a.line || "").toLowerCase()); E.onAct(a); actLog(a, r.host + " (at the desk)"); if (!crawling()) masonCheck(); refresh(); drawHands(); },
      helpdesk: function () {} });
    const hands = el("div", "wo-hands"); panel.appendChild(hands);
    function drawHands() {
      const m = E.machine(id); hands.innerHTML = "";
      hands.appendChild(el("h3", null, "With your own hands"));
      const state = el("p", "wo-state"); state.setAttribute("role", "status");
      const srvH = r.id === "FS01" || r.id === "MAIL01";
      const light = m.power !== "on" ? "The tower's power light is off." : m.crashed ? "The tower's power light is on, and the fans are running." : "The tower's power light is on.";
      const cable = m.net && m.net.cable === false ? (srvH ? "Its network cable hangs loose, unplugged from the switch in the rack." : "The network cable is lying on the floor, unplugged from the back of the tower.") : null;
      state.textContent = light + (hands.dataset.cable ? " " + (cable || (m.net.adapter === false ? "The network cable is plugged in, but the light on the port is off: the adapter is disabled in Windows." : "The network cable is plugged in firmly, and the light on the port is blinking.")) : "");
      hands.appendChild(state);
      const row = el("div", "wo-acts");
      row.appendChild(coachTag("power", btn(m.power === "on" ? "Press the power button" : "Press the power button to switch it on", "b", function () {
        if (m.power !== "on") { M.boot(m); E.onAct({ type: "power", op: "on", host: m.host, machine: id }); actLog({ type: "power", op: "on" }, r.host + " (at the desk)"); local.draw(); refresh(); drawHands(); return; }
        state.textContent = "It's already on. A quick press would ask Windows to shut down; holding it in forces the power off and can lose " + first + "'s work. Leave it unless Windows is completely frozen.";
      })));
      row.appendChild(coachTag("check-cable", btn("Check the network cable", "b", function () { hands.dataset.cable = "1"; drawHands(); })));
      const srv = r.id === "FS01" || r.id === "MAIL01";
      if (hands.dataset.cable && m.net && m.net.cable === false) row.appendChild(coachTag("plug-in", btn(srv ? "Plug its cable back into the switch" : "Plug the cable back in", "b pri", function () { const b = E.before(); MW.setCable(m, true); E.onAct({ type: "cable", op: "on", host: m.host, machine: id, before: b }); const t2 = E.ticket(); if (t2) logT(t2.id, r.host + ": plugged the network cable back in"); local.draw(); refresh(); drawHands(); })));
      /* quarantine by hand: the owner's ruling for the Malware build */
      const t3 = E.ticket();
      if (t3 && t3.kind === "malware") {
        if (hands.dataset.cable && m.net.cable !== false) row.appendChild(coachTag("unplug", btn(srv ? "Unplug its cable from the switch" : "Unplug the network cable", "b", function () {
          const b = E.before(); MW.setCable(m, false); E.onAct({ type: "cable", op: "off", host: m.host, machine: id, before: b }); logT(t3.id, r.host + ": unplugged the network cable");
          const rw = W["rdp:" + id]; if (rw && rw.phase === "on") dropped(rw, "net");
          local.draw(); after(); drawHands();
        })));
        row.appendChild(MW.ready(m).usb
          ? coachTag("usb-out", btn("Take the USB stick out", "b", function () { MW.removeUSB(m); logT(t3.id, r.host + ": took the USB stick out"); local.draw(); refresh(); drawHands(); }))
          : coachTag("usb-in", btn("Plug in the USB stick (Defender definitions, from your bench)", "b", function () { MW.insertUSB(m); logT(t3.id, r.host + ": plugged in the USB stick with the Defender definitions package (mpam-fe.exe)"); local.draw(); refresh(); drawHands(); })));
      }
      /* installing an OS: the installer USB from the bench */
      if (t3 && t3.kind === "install" && INS.managed(m)) {
        const mid = t3.media || "win11";
        const media = function (on) { const b = E.before(); if (on) INS.insertMedia(m, mid); else INS.removeMedia(m); const a = { type: "osinst", op: on ? "media-in" : "media-out", machine: id, before: b }; E.onAct(a); actLog(a, r.host + " (at the desk)"); local.draw(); refresh(); drawHands(); };
        row.appendChild(m.inst.media ? coachTag("inst-usb-out", btn("Take the installer USB out", "b", function () { media(false); }))
          : coachTag("inst-usb-in", btn("Plug in the " + INS.MEDIA[mid].name + " USB (from your bench)", "b", function () { media(true); })));
      }
      hands.appendChild(row);
      if (INS.managed(m) && m.inst.media) hands.appendChild(el("p", "wo-state", "The " + INS.MEDIA[m.inst.media].name + " USB (" + INS.MEDIA[m.inst.media].label + ") is in the front of the tower."));
      if (MW.ready(m).usb) hands.appendChild(el("p", "wo-state", "The USB stick is in: it shows in File Explorer as " + m.usb.label + "."));
    }
    drawHands();
    const back = btn("Walk back to your desk", "b pri wo-back", function () { panel.remove(); goBack(); });
    panel.appendChild(back);
    ov.appendChild(panel);
    setTimeout(function () { back.focus({ preventScroll: true }); }, 0);
  }
  /* a safety job: you're there. The cutscene ends, and On the spot opens
     on the laptop's screen with the job in front of you */
  function arrivedSafety() {
    const t0 = E.ticket(); if (t0) { L.onSite[t0.id] = true; saveL(); logT(t0.id, "Arrived: " + t0.place.where); }
    ov.remove(); walkUI = null; if (office) office.dispose(); besideCoach(false);
    openWin("safety"); refresh();
  }
  /* at the break counter: what's there, and the floor plan to move it on */
  function arrivedBreak() {
    if (office && window.innerWidth > 760) office.shift(0.3);
    const t0 = E.ticket(); if (t0) { L.onSite[t0.id] = true; saveL(); }
    say.textContent = "You're at the break counter in the conference room.";
    const skip = bar.querySelector(".wo-skip"); if (skip) skip.remove();
    const panel = el("section", "wo-desk"); panel.setAttribute("aria-label", "At the break counter");
    panel.appendChild(el("h2", null, "At the break counter · conference and break room"));
    const rr = planRouter(), d = rr ? Math.round(RT.microwaveFromAP(rr)) : 0;
    panel.appendChild(el("p", "wo-state", "The microwave is running: someone's heating lunch. It sits on the counter against the closet wall, about " + d + " feet from the access point on the other side of it."));
    panel.appendChild(el("p", "wo-state", "Below is the whole office from above, with the Wi-Fi as the access point is running it. While you're standing here, you can move the microwave on it."));
    const fpBox = el("div", "wo-fp"); panel.appendChild(fpBox); const fpUI = {};
    function drawHere() { fpBox.innerHTML = ""; drawFloorPlan(fpBox, { router: planRouter, onSite: function () { return true; }, move: function (x, z) { routerAct("router-microwave", function (f, rr) { return RT.moveMicrowave(f, rr, x, z); }); drawHere(); } }, fpUI); }
    drawHere();
    const back = btn("Walk back to your desk", "b wo-back", function () { panel.remove(); goBack(); });
    panel.appendChild(back); ov.appendChild(panel);
    setTimeout(function () { const m = fpBox.querySelector(".fp-mw"); if (m) m.focus({ preventScroll: true }); }, 0);
  }
  function goBack() {
    if (place) { const t0 = E.ticket(); if (t0) { L.onSite[t0.id] = false; saveL(); } if (W.floor) redraw("floor"); }
    say.textContent = "Walking back to your desk…";
    const done = function () { fadeTo(true, function () { ov.remove(); walkUI = null; if (office) office.dispose(); const t2 = E.ticket(); if (t2) logT(t2.id, "Back at your desk"); refresh(); }); };
    if (office) office.shift(0);
    besideCoach(false);
    caption("Back to your bench", "Network closet · TECH-01");
    if (office && route) { ov.classList.add("cine-on"); fadeTo(false); const sk = btn("Skip the walk", "b small wo-skip", function () { if (walking) walking.skip(); }); bar.appendChild(sk); walking = office.walk(route.path.slice().reverse(), [12.4, 3.4, 23.2], done); } else done();
  }
  (async function () {
    try {
      const mod = await import("./office3d.js");
      if (!mod.webglOK()) throw new Error("no webgl");
      const pr = planRouter();
      office = await mod.mountOffice(stage, { walk: true, machines: ROSTER, height: stage.clientHeight || window.innerHeight, ao: false, microwave: pr ? pr.microwave : null });
      office.standAt(BENCH, [12.4, 3.4, 23.2]);
      say.textContent = "Walking to " + whose + "…";
      const skip = btn("Skip the walk", "b small wo-skip", function () { if (walking) walking.skip(); }); bar.appendChild(skip);
      ov.classList.add("cine-on"); caption("Rafiki's IT Services", "Your bench is in the network closet");
      walking = office.walk(route.path, route.look, arrive, { aerial: true, onPhase: function (ph) {
        if (ph === "aerial") fadeTo(false);
        if (ph === "walk") caption(place ? "To the break room" : r.id === "FS01" || r.id === "MAIL01" ? "To the server rack" : "To " + r.where, place ? "The counter by the closet wall · lunchtime" : r.fullName + (r.id === "FS01" || r.id === "MAIL01" ? "" : ", " + r.dept) + " · " + r.host);
      } });
    } catch (e) {
      stage.appendChild(el("p", "wo-no3d", "The 3D office isn't available on this computer, so picture it: out of the closet, down the corridor, to " + whose + "."));
      fade.classList.remove("on"); arrived();
    }
  })();
}

/* ------------------------------------------------------------ start */
lockScreen();
window.__LAP = { engine: E, W: W, openWin: openWin, connect: connect, walkOver: walkOver, wo: function () { return walkUI; }, L: function () { return L; }, rung: rungFor };
