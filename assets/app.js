/* =====================================================================
   A+ Core2 Under the Hood labs — the page.

   You are a Tier 1 technician at Rafiki's IT Services. Your own
   workstation holds the Help Desk queue; the office's other machines are
   one click away, in the 3D office or in the machine list. The ticket
   you are working stays on your clipboard beside the screen, with the
   hints and the snapshot.
   ===================================================================== */
import * as P from "./prefs.js";
import { ROSTER, rosterOf } from "./fleet.js";
import { createEngine, rungFor } from "./engine.js";
import { createDesktop } from "./desktop.js";
import { TICKETS } from "./tickets.js";
import { ordered } from "./order.js";

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(label, cls, fn, aria) { const b = el("button", cls || "btn", label); b.type = "button"; if (aria) b.setAttribute("aria-label", aria); b.addEventListener("click", fn); return b; }

P.mountReading(document.getElementById("set-reading"));
P.mountTheme(document.getElementById("set-theme"));
P.mountInstructor(document.getElementById("set-instructor"));

const E = createEngine();
let selected = "TECH";
const desktops = {};
const screenHost = document.getElementById("screen");
const listHost = document.getElementById("machines");
const clipHost = document.getElementById("clipboard");
let office = null;



/* ------------------------------------------------------ the screens */
function desktopFor(id) {
  if (desktops[id]) return desktops[id];
  const host = el("div", "screen-host"); host.dataset.machine = id; screenHost.appendChild(host);
  desktops[id] = createDesktop(host, {
    machine: function () { return E.machine(id); },
    fleetLookup: E.lookup,
    isTech: id === "TECH",
    before: E.before,
    onAct: function (a) { E.onAct(a); drawClip(); drawList(); },
    helpdesk: drawHelpdesk
  });
  return desktops[id];
}
function select(id) {
  selected = id;
  Object.keys(desktops).forEach(function (k) { desktops[k].element.parentNode.hidden = k !== id; });
  desktopFor(id).element.parentNode.hidden = false;
  desktopFor(id).draw();
  if (office) office.select(id);
  drawList();
  const r = rosterOf(id);
  document.getElementById("screen-h").textContent = "On the screen: " + r.host + " — " + r.fullName + (r.where ? ", " + r.where : "");
}

/* --------------------------------------------------- the machine list */
function drawList() {
  listHost.innerHTML = "";
  const t = E.ticket();
  ROSTER.forEach(function (r) {
    const b = btn("", "mc" + (r.id === selected ? " on" : ""), function () { select(r.id); });
    b.setAttribute("aria-pressed", String(r.id === selected));
    b.appendChild(el("strong", null, r.host)); b.appendChild(el("span", null, r.fullName + " · " + r.where));
    if (t && t.machine === r.id) b.appendChild(el("span", "mc-tag", "This ticket's PC"));
    listHost.appendChild(b);
  });
}

/* ----------------------------------------------------- the clipboard */
function drawClip() {
  clipHost.innerHTML = "";
  const t = E.ticket(), st = E.T();
  const cred = el("div", "panel creds");
  cred.appendChild(el("h3", null, "Your technician account"));
  cred.appendChild(el("p", null, "Office users are standard users. When Windows asks for an administrator, use RAFIKI\\itadmin, password Bench-Tech-2026."));
  if (!t) {
    const p = el("div", "panel"); p.appendChild(el("h3", null, "No ticket open"));
    p.appendChild(el("p", null, "Your Help Desk queue is on your own workstation, TECH-01. Open it from the desktop or the Start menu, and pick a ticket."));
    p.appendChild(btn("Go to your workstation", "btn primary", function () { select("TECH"); desktopFor("TECH").open("helpdesk"); }));
    clipHost.appendChild(p); clipHost.appendChild(cred); return;
  }
  const p = el("section", "panel ticket"); p.setAttribute("aria-labelledby", "clip-h");
  const h = el("h3", null, "Ticket " + t.id + ": " + t.title); h.id = "clip-h"; p.appendChild(h);
  p.appendChild(el("p", "tk-meta", "From " + t.from + " · " + rosterOf(t.machine).host + " · Tier " + t.tier + " · based on the " + t.sim + " sim" + (t.base ? " (the sim itself)" : "")));
  t.brief.forEach(function (x) { p.appendChild(el("p", "tk-brief", x)); });
  const stage = { work: "Working: fix it on the machine, then Resolve or Escalate in the Help Desk.", close: "Nearly done: pick the cause and write the ticket note in the Help Desk.", done: "Closed." }[st.stage];
  p.appendChild(el("p", "tk-stage", stage));
  p.appendChild(el("p", "tk-count", st.guesses ? "Moves that did not help so far: " + st.guesses + (st.guesses < 3 ? ". Hints start after 3." : ".") : "Looking around, reading logs, running a program to test it, and typos never count against you."));
  if (st.lastSay) { const s = el("p", "tk-say", st.lastSay); s.setAttribute("role", "status"); p.appendChild(s); }
  const g = E.guidance();
  if (g && g.rung && st.stage === "work") p.appendChild(drawGuide(g, t));
  if (st.stage !== "done") {
    const rv = el("div", "tk-revert");
    /* Every screen goes back to its desktop — an open console still holds
       the machine as it was — and the Help Desk reopens on TECH-01. */
    rv.appendChild(btn("Revert to snapshot", "btn secondary", function () { E.revert(); Object.values(desktops).forEach(function (d) { d.reset(); }); desktopFor("TECH").open("helpdesk"); drawClip(); drawList(); desktopFor(selected).draw(); }));
    rv.appendChild(el("span", "setting-note", "Puts the machines back to the last point you got right. Your hints carry on."));
    p.appendChild(rv);
  }
  if (P.isInstructor()) {
    const a = el("div", "ins-answer"); a.appendChild(el("strong", null, "Instructor: "));
    const mv = t.moves(E.fleet()).filter(function (x) { return x.correct; })[0];
    a.appendChild(document.createTextNode("Fix: " + (mv ? mv.label : "") + ". Outcome: " + t.outcome + ". Cause: " + t.close.options.filter(function (x) { return x.correct; })[0].label + "."));
    p.appendChild(a);
  }
  clipHost.appendChild(p); clipHost.appendChild(cred);
}
function drawGuide(g, t) {
  const box = el("div", "guide rung-" + g.rung); box.setAttribute("role", "note");
  box.appendChild(el("h4", null, ["", "Hint 1 of 3: where to look", "Hint 2 of 3: the principle", "Hint 3 of 3: the field narrowed (this one repeats for as long as you need it)"][g.rung]));
  box.appendChild(el("p", null, g.where));
  if (g.principle) box.appendChild(el("p", "principle", g.principle));
  if (g.moves) {
    box.appendChild(el("p", null, "Six possible next moves. Four are ruled out, each with its reason; two are still alive. You still do it yourself."));
    const ul = el("ul", "narrow");
    ordered(g.moves, t.id + "m").forEach(function (x) {
      const li = el("li", x.struck ? "struck" : "alive");
      li.appendChild(el("span", "opt-mark", x.struck ? "✕ Ruled out" : "● Still alive"));
      li.appendChild(el("span", "narrow-label", x.label));
      if (x.struck) li.appendChild(el("span", "opt-why", x.why));
      ul.appendChild(li);
    });
    box.appendChild(ul);
  }
  return box;
}

/* ------------------------------------------- the Help Desk (on TECH-01) */
function drawHelpdesk(body, api) {
  const wrap = el("div", "hd");
  const t = E.ticket(), st = E.T();
  if (t && st && st.stage !== "done") {
    const cur = el("section", "hd-cur"); cur.appendChild(el("h4", null, "Open ticket " + t.id + ": " + t.title));
    cur.appendChild(el("p", null, "Requester: " + t.from + " · Device: " + rosterOf(t.machine).host));
    if (st.stage === "work") {
      const row = el("div", "hd-acts");
      row.appendChild(btn("Resolve", "w-btn primary", function () { E.submit("resolve"); drawClip(); api.refresh(); }));
      row.appendChild(btn("Escalate to Tier 2", "w-btn", function () { E.submit("escalate"); drawClip(); api.refresh(); }));
      cur.appendChild(row);
      if (st.lastSay) { const s = el("p", "hd-say", st.lastSay); s.setAttribute("role", "status"); cur.appendChild(s); }
    }
    if (st.stage === "close") cur.appendChild(drawCloseForm(t, st, api));
    wrap.appendChild(cur);
  }
  if (t && st && st.stage === "done") {
    const d = el("section", "hd-done"); d.setAttribute("role", "status");
    d.appendChild(el("strong", null, "✓ Ticket " + t.id + " is closed."));
    d.appendChild(el("p", null, "Your note: " + st.note));
    d.appendChild(el("p", null, "Pick the next ticket from the queue."));
    wrap.appendChild(d);
  }
  wrap.appendChild(el("h4", "hd-qh", "Queue"));
  const tbl = el("table", "hd-q"); const hr = el("tr");
  ["Ticket", "Summary", "From", "Tier", "Status", ""].forEach(function (c) { const th = el("th", null, c); th.setAttribute("scope", "col"); hr.appendChild(th); });
  const hd = el("thead"); hd.appendChild(hr); tbl.appendChild(hd); const tb = el("tbody");
  E.tickets().forEach(function (x) {
    const tr = el("tr", x.t.id === (t && t.id) ? "cur" : "");
    [x.t.id, x.t.title, x.t.from, "Tier " + x.t.tier, x.st ? (x.st.status === "closed" ? "Closed" : "In progress") : "New"].forEach(function (v) { tr.appendChild(el("td", null, v)); });
    const td = el("td");
    td.appendChild(btn(x.st && x.st.status === "closed" ? "Work it again" : (x.t.id === (t && t.id) ? "Reopen" : "Open"), "w-btn small", function () {
      if (x.st && x.st.status === "closed") { E.state().tickets[x.t.id] = null; }
      /* A fresh snapshot of the office: every screen goes back to its
         desktop, except that the Help Desk stays open here. */
      E.openTicket(x.t.id); Object.values(desktops).forEach(function (d) { d.reset(); }); drawClip(); drawList(); desktopFor("TECH").open("helpdesk");
    }, "Open ticket " + x.t.id));
    tr.appendChild(td); tb.appendChild(tr);
  });
  tbl.appendChild(tb); const sc = el("div", "hd-scroll"); sc.appendChild(tbl); wrap.appendChild(sc);
  body.appendChild(wrap);
}
function drawCloseForm(t, st, api) {
  const box = el("div", "hd-close");
  box.appendChild(el("h4", null, t.outcome === "escalate" ? "Escalation accepted by Tier 2 — now record it" : "Fixed — " + t.from.split(",")[0] + " confirms it works. Now close it properly"));
  box.appendChild(el("p", "hd-q1", t.close.prompt));
  const opts = el("div", "options"); opts.setAttribute("role", "group"); opts.setAttribute("aria-label", t.close.prompt);
  const g = E.guidance(); const strike = g && g.strike || {};
  ordered(t.close.options, t.id + "close").forEach(function (o) {
    const out = !!st.picked[o.label] && !o.correct, struck = !out && strike[o.label];
    const b = el("button", "opt" + (out ? " out" : "") + (st.closeOK && o.correct ? " right" : "") + (struck ? " out struck-hint" : "")); b.type = "button";
    if (out || struck) { b.appendChild(el("span", "opt-mark", out ? "✕ Ruled out" : "✕ Ruled out by the hint")); b.appendChild(el("span", "opt-label", o.label)); b.appendChild(el("span", "opt-why", o.why)); b.setAttribute("aria-disabled", "true"); }
    else if (st.closeOK && o.correct) { b.appendChild(el("span", "opt-mark", "✓ Right")); b.appendChild(el("span", "opt-label", o.label)); }
    else b.appendChild(el("span", "opt-label", o.label));
    b.disabled = st.closeOK || out || !!struck;
    b.addEventListener("click", function () { E.pick(o.label); drawClip(); api.refresh(); });
    opts.appendChild(b);
  });
  box.appendChild(opts);
  if (g && g.rung && !st.closeOK) { box.appendChild(drawGuide({ rung: g.rung, where: g.where, principle: g.principle }, t)); }
  if (st.closeOK) {
    const lab = el("label", "hd-notel", "Ticket note — " + t.note.tip); const ta = el("textarea", "w-input hd-note"); ta.id = "hd-note"; lab.setAttribute("for", "hd-note"); ta.rows = 5; ta.value = st.note || "";
    box.appendChild(lab); box.appendChild(ta);
    if (st.noteMissing && st.noteMissing.length) { const m = el("p", "dlg-err", "Not closed yet. The note needs " + st.noteMissing.join("; and ") + "."); m.setAttribute("role", "alert"); box.appendChild(m); }
    box.appendChild(btn("Close the ticket", "w-btn primary", function () { E.writeNote(ta.value); drawClip(); api.refresh(); }));
  }
  return box;
}
P.onInstructor(function () { drawClip(); });

/* ------------------------------------------------------------ start */
drawList(); drawClip(); select("TECH");
if (!E.ticket()) desktopFor("TECH").open("helpdesk");
E.on(function (ev) { if (ev.type === "ticket-open" || ev.type === "revert" || ev.type === "reset") { drawList(); drawClip(); } });

document.getElementById("reset-all").addEventListener("click", function () {
  if (!confirm("Start again from the beginning? Every ticket goes back to New and every machine to how it started.")) return;
  E.resetAll(); Object.values(desktops).forEach(function (d) { d.reset(); }); drawList(); drawClip(); select("TECH"); desktopFor("TECH").open("helpdesk");
});

/* The 3D office, loaded after the page works, so a machine with no WebGL
   (or a slow one) never waits for it. */
(async function () {
  const host = document.getElementById("office");
  try {
    const mod = await import("./office3d.js");
    if (!mod.webglOK()) throw new Error("no webgl");
    office = await mod.mountOffice(host, { machines: ROSTER, onPick: select, height: 360 });
    office.select(selected);
    document.getElementById("office-note").textContent = "Drag to turn the office, scroll to zoom, and click a desk's PC to sit at it — or use the list below.";
  } catch (e) {
    document.getElementById("office-note").textContent = "The 3D office is off on this computer, so use the machine list below. Everything still works; the model was never the only way in.";
  }
})();

/* A seam for verify/. Nothing in the page reads it. */
window.__C2 = { engine: E, select: select, desktop: desktopFor, tickets: TICKETS, rung: rungFor, office: function () { return office; }, selected: function () { return selected; } };
