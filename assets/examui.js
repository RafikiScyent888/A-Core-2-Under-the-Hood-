/* =====================================================================
   Exam Practice: a program on the laptop with each sim laid out as the
   sim (and its exam question) lays it out. Separate from Help Desk, so it
   never feels like more ticket training (owner, 1 October 2026).

   Everyone learns differently, so each view can be worked three ways:
     Guided      Mason says which part to do next and where to look, and
                 rings it
     Checklist   the parts, ticking off as each one is checked right
     On my own   as in the exam: Mason only after the third wrong value
   ===================================================================== */
import * as P from "./pbq.js";
import { EXAMS, examById } from "./exams.js";
import { ordered } from "./order.js";

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(label, cls, fn, aria) { const b = el("button", cls || "b", label); b.type = "button"; if (aria) b.setAttribute("aria-label", aria); b.addEventListener("click", fn); return b; }

const MODES = [["guided", "Guided"], ["check", "Checklist"], ["own", "On my own"]];
export function examState(L, ex, v) { L.exam = L.exam || {}; const k = ex.id + ":" + v.id; return L.exam[k] || (L.exam[k] = P.fresh()); }

/* ctx: { L, save(), draw(), onDone(ex, v) } ; ui: per-window state */
export function drawExam(host, ctx, ui) {
  const L = ctx.L; L.examSel = L.examSel || { ex: EXAMS[0].id, v: EXAMS[0].variants[0].id };
  const ex = examById(L.examSel.ex), v = ex.variants.filter(function (x) { return x.id === L.examSel.v; })[0] || ex.variants[0];
  const st = examState(L, ex, v), mode = L.examMode || "guided";
  const wrap = el("div", "ex"); host.appendChild(wrap);
  /* the list of sims */
  const nav = el("nav", "ex-nav"); nav.setAttribute("aria-label", "Exam views");
  nav.appendChild(el("h2", "ex-nh", "Exam Practice"));
  nav.appendChild(el("p", "ex-nsub", "Each sim, laid out the way the exam shows it."));
  EXAMS.forEach(function (e) {
    const g = el("div", "ex-ng"); g.appendChild(el("h3", null, e.sim));
    const ul = el("ul", "ex-nl");
    e.variants.forEach(function (x, i) {
      const s = (L.exam || {})[e.id + ":" + x.id], done = s && s.done;
      const b = btn((i === 0 ? "The sim itself" : "Practice " + (i + 1)) + (done ? " ✓" : ""), "ex-nb" + (e.id === ex.id && x.id === v.id ? " on" : "") + (done ? " done" : ""), function () { L.examSel = { ex: e.id, v: x.id }; ui.sel = null; ctx.save(); ctx.draw(); }, e.sim + ": " + (i === 0 ? "the sim itself" : "practice " + (i + 1)) + (done ? ", done" : ""));
      b.setAttribute("aria-current", String(e.id === ex.id && x.id === v.id));
      const li = el("li"); li.appendChild(b); ul.appendChild(li);
    });
    g.appendChild(ul); nav.appendChild(g);
  });
  wrap.appendChild(nav);
  /* the view */
  const main = el("section", "ex-main"); main.setAttribute("aria-label", v.title); wrap.appendChild(main);
  const top = el("div", "ex-top");
  const tt = el("div"); tt.appendChild(el("p", "ex-sim", ex.sim + (v.base ? " · the sim itself" : "") + " · " + ex.objective)); tt.appendChild(el("h2", "ex-title", v.title)); top.appendChild(tt);
  const ms = el("div", "ex-modes"); ms.setAttribute("role", "group"); ms.setAttribute("aria-label", "How do you want to work it?");
  MODES.forEach(function (m) { const b = btn(m[1], "b small" + (mode === m[0] ? " pri" : ""), function () { L.examMode = m[0]; ctx.save(); ctx.draw(); }); b.setAttribute("aria-pressed", String(mode === m[0])); ms.appendChild(b); });
  top.appendChild(ms); main.appendChild(top);
  const brief = el("div", "ex-brief"); v.brief.forEach(function (p) { brief.appendChild(el("p", null, p)); }); main.appendChild(brief);

  const g = P.guidance(v, st), next = P.stuck(v, st);
  if (st.done) { const d = el("div", "ex-done"); d.setAttribute("role", "status"); d.appendChild(el("strong", null, "✓ Every setting is right.")); d.appendChild(el("p", null, "That's how it looks on the exam. Try the next practice, or do it for real as a ticket in Help Desk.")); main.appendChild(d); }
  else if (mode === "guided" && next) { const c = el("div", "ex-coach"); c.setAttribute("role", "status"); c.appendChild(el("strong", null, "Mason: next, " + next.label.replace(/^Task \d+: |^Checkpoint \d+ · /, ""))); c.appendChild(el("p", null, next.hint[0])); main.appendChild(c); }
  if (!st.done && g.rung) { const h = el("div", "ex-hint"); h.setAttribute("role", "status"); h.appendChild(el("strong", null, "Mason · " + (g.rung === 3 ? "narrowing it down" : "a pointer"))); h.appendChild(el("p", null, g.where)); if (g.principle) h.appendChild(el("p", "ex-princ", g.principle)); if (g.narrow) h.appendChild(el("p", "ex-princ", g.narrow)); main.appendChild(h); }
  if (mode === "check") {
    const ol = el("ol", "ex-check"); v.fields.forEach(function (f) { const li = el("li", st.ok[f.id] ? "did" : ""); li.appendChild(el("span", "mk", st.ok[f.id] ? "✓" : "•")); li.appendChild(el("span", null, f.label + (st.ok[f.id] ? " · right" : ""))); ol.appendChild(li); }); main.appendChild(ol);
  }
  const ring = mode === "guided" && next ? next.id : null;
  const area = el("div", "ex-area ex-" + ex.layout); main.appendChild(area);
  const F = { v: v, st: st, g: g, ring: ring, ui: ui, ctx: ctx, ex: ex };
  ({ diagram: drawDiagram, map: drawMap, houses: drawHouses, tasks: drawTasks, checkpoints: drawCheckpoints })[ex.layout](area, F);
  /* check and reset */
  const row = el("div", "ex-row");
  row.appendChild(btn(ex.layout === "map" || ex.layout === "houses" ? "Save settings" : "Submit", "b pri", function () {
    const r = P.check(v, st); ui.msg = r.done ? "" : (r.wrong ? r.wrong + " not right yet. Each one stays marked, with why, until you change it." : r.missing ? "Fill in every part first: " + r.missing + " still empty." : "Not right yet.");
    ctx.save(); if (r.done && ctx.onDone) ctx.onDone(ex, v); ctx.draw();
  }));
  row.appendChild(btn("Reset", "b", function () { L.exam[ex.id + ":" + v.id] = P.resetAll(st); ui.msg = "Reset: everything's back to the start. Mason's help carries on from where it was."; ctx.save(); ctx.draw(); }, "Reset this exam view: clears your answers and the red marks; Mason's help carries on"));
  main.appendChild(row);
  if (ui.msg) { const m = el("p", "ex-msg", ui.msg); m.setAttribute("role", "status"); main.appendChild(m); }
}

/* --------------------------------------------------------- one field */
function fieldBox(f, F, compact) {
  const st = F.st, val = st.vals[f.id], out = st.out[f.id] || [], ok = st.ok[f.id];
  const box = el("div", "ex-f" + (ok ? " ok" : "") + (F.ring === f.id ? " coach-target" : "")); box.dataset.field = f.id;
  const lab = el(f.kind === "text" ? "label" : "p", "ex-fl", f.label); box.appendChild(lab);
  if (ok) box.appendChild(el("span", "ex-okm", "✓ Right"));
  if (f.kind === "text") {
    const inp = el("input", "field"); inp.id = "ex-" + F.v.id + "-" + f.id; lab.setAttribute("for", inp.id); inp.value = val || ""; inp.autocomplete = "off"; inp.spellcheck = false;
    inp.addEventListener("input", function () { P.set(st, f, inp.value); F.ctx.save(); });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") e.preventDefault(); });
    box.appendChild(inp);
  } else {
    const strike = F.g && F.g.rung === 3 && F.g.field === f && F.g.strike || {};
    const grp = el("div", "ex-opts" + (f.options.length > 6 ? " many" : "")); grp.setAttribute("role", "group"); grp.setAttribute("aria-label", f.label);
    /* a question's six are shuffled, as everywhere; a setting keeps the
       real control's order (channels 1 to 12) */
    (f.setting ? f.options : ordered(f.options, F.v.id + f.id)).forEach(function (o) {
      const wrong = out.indexOf(o.label) >= 0, struck = !wrong && !ok && strike[o.label], sel = val === o.label;
      const b = el("button", "ex-o" + (sel ? " sel" : "") + (wrong || struck ? " out" : "")); b.type = "button";
      if (wrong || struck) { b.appendChild(el("span", "om", wrong ? "✕ Ruled out" : "✕ Ruled out by Mason")); b.appendChild(el("span", "ol", o.label)); b.appendChild(el("span", "ow", o.why)); b.setAttribute("aria-disabled", "true"); b.disabled = true; }
      else { b.appendChild(el("span", "ol", (sel ? "● " : "") + o.label)); b.setAttribute("aria-pressed", String(sel)); }
      b.addEventListener("click", function () { if (b.disabled) return; P.set(st, f, o.label); F.ctx.save(); F.ctx.draw(); });
      grp.appendChild(b);
    });
    box.appendChild(grp);
  }
  if (f.kind === "text" && out.length) {
    const ul = el("ul", "ex-outs"); out.forEach(function (x) { const li = el("li", "out"); li.appendChild(el("span", "om", "✕ Ruled out")); li.appendChild(el("span", "ol", "\"" + x + "\"")); li.appendChild(el("span", "ow", P.whyWrong(f, x))); ul.appendChild(li); }); box.appendChild(ul);
  }
  return box;
}

/* ------------------------------------- Port Forwarding: the diagram */
function drawDiagram(area, F) {
  const v = F.v, ui = F.ui;
  const fig = el("figure", "ex-fig"); const img = el("img"); img.src = F.ex.image; img.alt = "The network: the Internet at the top, the router in the middle, the LAN on the left with the wireless access point, and the screened subnet on the right with the firewall."; fig.appendChild(img);
  v.fields.forEach(function (f, i) {
    if (!f.pos) return; const st = F.st;
    const b = btn(String(i + 1), "ex-slot" + (st.ok[f.id] ? " ok" : (st.out[f.id] || []).length && !st.ok[f.id] ? " bad" : "") + (ui.sel === f.id ? " on" : "") + (F.ring === f.id ? " coach-target" : ""), function () { ui.sel = f.id; F.ctx.draw(); }, (i + 1) + ": " + f.label + (st.vals[f.id] ? ", set to " + st.vals[f.id] : ", not set") + (st.ok[f.id] ? ", right" : ""));
    b.style.left = f.pos.x + "%"; b.style.top = f.pos.y + "%"; fig.appendChild(b);
  });
  area.appendChild(fig);
  const side = el("div", "ex-side");
  side.appendChild(el("p", "ex-hint2", "Press a number on the diagram, then choose for it here. Each option may only be used once, and not all options will be used."));
  const f = v.fields.filter(function (x) { return x.id === ui.sel; })[0] || v.fields.filter(function (x) { return x.id === F.ring; })[0] || v.fields[0];
  ui.sel = f.id;
  side.appendChild(fieldBox(f, F));
  const sum = el("ol", "ex-sum"); v.fields.forEach(function (x) { const li = el("li", F.st.ok[x.id] ? "did" : ""); li.appendChild(el("span", null, x.label + ": ")); li.appendChild(el("strong", null, F.st.vals[x.id] || "not set")); sum.appendChild(li); });
  side.appendChild(sum); area.appendChild(side);
}
/* --------------------------------------- WiFi: the office map + AP */
function drawMap(area, F) {
  const ui = F.ui;
  const fig = el("figure", "ex-fig ex-mapfig"); const img = el("img"); img.src = F.ex.image; img.alt = "Office layout: Offices 1 to 3 along the top, the tablet in Office 3, reception, the network closet with the WAP, and the conference room."; fig.appendChild(img);
  const hs = btn("WAP", "ex-hot" + (ui.open ? " on" : "") + (!ui.open && F.ring ? " coach-target" : ""), function () { ui.open = !ui.open; F.ctx.draw(); }, "The wireless access point: open its settings"); hs.style.left = "33.6%"; hs.style.top = "62%"; fig.appendChild(hs);
  area.appendChild(fig);
  if (!ui.open) { area.appendChild(el("p", "ex-hint2", "Click the access point (WAP) on the map to configure it.")); return; }
  const m = el("section", "ex-modal"); m.setAttribute("aria-label", "92 Series Wireless Access Point settings");
  m.appendChild(el("h3", null, "92 Series Wireless Access Point"));
  F.v.fields.forEach(function (f) { m.appendChild(fieldBox(f, F)); });
  area.appendChild(m);
}
/* ------------------------------ Neighboring Routers: the three houses */
function drawHouses(area, F) {
  const ui = F.ui, v = F.v;
  const fig = el("figure", "ex-fig ex-housefig"); const img = el("img"); img.src = F.ex.image; img.alt = "Three houses side by side on a street: orange (Router 1), tan (Router 2) and blue (Router 3)."; fig.appendChild(img);
  [["Router 1", 17], ["Router 2", 50], ["Router 3", 84]].forEach(function (r, i) {
    const b = btn(r[0], "ex-hot" + (ui.router === i ? " on" : "") + (i === 2 && ui.router !== 2 && F.ring ? " coach-target" : ""), function () { ui.router = i; F.ctx.draw(); }, r[0] + ": show its settings"); b.style.left = r[1] + "%"; b.style.top = "48%"; fig.appendChild(b);
  });
  area.appendChild(fig);
  const note = el("p", "ex-note", v.note);
  if (ui.router == null) { area.appendChild(el("p", "ex-hint2", "Click a router to see its settings. Router 3 is the customer's.")); area.appendChild(note); return; }
  const m = el("section", "ex-modal");
  if (ui.router < 2) {
    const n = v.neighbours[ui.router]; m.setAttribute("aria-label", n.name + " settings"); m.appendChild(el("h3", null, n.name + " Settings"));
    const dl = el("dl", "ex-dl"); [["Channel", n.channel], ["SSID", n.ssid], ["Security Mode", n.security], ["Password", "••••••••"], ["Channel Width", n.width], ["MAC Filtering", n.mac]].forEach(function (kv) { dl.appendChild(el("dt", null, kv[0])); dl.appendChild(el("dd", null, kv[1])); }); m.appendChild(dl);
  } else { m.setAttribute("aria-label", "Router 3 settings"); m.appendChild(el("h3", null, "Router 3 Settings")); v.fields.forEach(function (f) { m.appendChild(fieldBox(f, F)); }); }
  area.appendChild(m); area.appendChild(note);
}
/* ------------------------------------------ Tier 1: scenario + chat */
function drawTasks(area, F) {
  const left = el("section", "ex-card"); left.setAttribute("aria-label", "Tasks"); left.appendChild(el("h3", null, "Scenario"));
  left.appendChild(el("p", "ex-guide", "You are acting in a Tier 1 help desk role. Focus on safe, supported actions. Avoid advanced network configuration or design decisions. Think: what is appropriate before escalation?"));
  F.v.fields.forEach(function (f) { left.appendChild(fieldBox(f, F)); });
  const right = el("section", "ex-card"); right.setAttribute("aria-label", "Conversation"); right.appendChild(el("h3", null, "Conversation"));
  F.v.chat.forEach(function (c) { const p = el("p", "ex-chat"); p.appendChild(el("strong", null, "Customer: ")); p.appendChild(document.createTextNode(c)); right.appendChild(p); });
  area.appendChild(left); area.appendChild(right);
}
/* --------------------------- Wireless Reliability: log + checkpoints */
function drawCheckpoints(area, F) {
  const left = el("section", "ex-card"); left.setAttribute("aria-label", "Environmental signal log"); left.appendChild(el("h3", null, "Environmental Signal Log"));
  const ul = el("ul", "ex-sig"); F.v.signals.forEach(function (s) { ul.appendChild(el("li", null, s)); }); left.appendChild(ul);
  const right = el("section", "ex-card"); right.setAttribute("aria-label", "Decision checkpoints"); right.appendChild(el("h3", null, "Decision Checkpoints"));
  F.v.fields.forEach(function (f) { right.appendChild(fieldBox(f, F)); });
  area.appendChild(left); area.appendChild(right);
}
