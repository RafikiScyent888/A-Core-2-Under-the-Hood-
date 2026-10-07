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
import { emailById } from "./tickets-mail.js";

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

  /* a chat is worked a step at a time, so Mason's "next" is the reply not
     yet sent; his hints stay on the first reply not yet right */
  const g = P.guidance(v, st), next = ex.layout === "chat" ? chatNext(v, st) : P.stuck(v, st);
  if (st.done) { const d = el("div", "ex-done"); d.setAttribute("role", "status"); d.appendChild(el("strong", null, ex.layout === "chat" ? "✓ Every reply is right: " + v.fields.length + " / " + v.fields.length + "." : "✓ Every setting is right.")); d.appendChild(el("p", null, "That's how it looks on the exam. Try the next practice, or do it for real as a ticket in Help Desk.")); main.appendChild(d); }
  else if (mode === "guided" && v.visit && (st.visited || []).length < v.devices.length) { const d = v.devices.filter(function (x) { return (st.visited || []).indexOf(x.id) < 0; })[0]; const c = el("div", "ex-coach"); c.setAttribute("role", "status"); c.appendChild(el("strong", null, "Mason: next, inspect " + d.host)); c.appendChild(el("p", null, "Open it on the map, then read its Task Manager, System Logs and Browser History before you decide anything.")); main.appendChild(c); }
  else if (mode === "guided" && next) { const c = el("div", "ex-coach"); c.setAttribute("role", "status"); c.appendChild(el("strong", null, "Mason: next, " + next.label.replace(/^Task \d+: |^Checkpoint \d+ · /, ""))); c.appendChild(el("p", null, next.hint[0])); main.appendChild(c); }
  if (!st.done && g.rung) { const h = el("div", "ex-hint"); h.setAttribute("role", "status"); h.appendChild(el("strong", null, "Mason · " + (g.rung === 3 ? "narrowing it down" : "a pointer"))); h.appendChild(el("p", null, g.where)); if (g.principle) h.appendChild(el("p", "ex-princ", g.principle)); if (g.narrow) h.appendChild(el("p", "ex-princ", g.narrow)); main.appendChild(h); }
  if (mode === "check") {
    const ol = el("ol", "ex-check"); v.fields.forEach(function (f) { const li = el("li", st.ok[f.id] ? "did" : ""); li.appendChild(el("span", "mk", st.ok[f.id] ? "✓" : "•")); li.appendChild(el("span", null, f.label + (st.ok[f.id] ? " · right" : ""))); ol.appendChild(li); }); main.appendChild(ol);
  }
  const ring = mode === "guided" && next ? next.id : null;
  const area = el("div", "ex-area ex-" + ex.layout); main.appendChild(area);
  const F = { v: v, st: st, g: g, ring: ring, ui: ui, ctx: ctx, ex: ex };
  ({ diagram: drawDiagram, map: drawMap, houses: drawHouses, tasks: drawTasks, checkpoints: drawCheckpoints, evidence: drawEvidence, inbox: drawInbox, network: drawNetwork, deploy: drawDeploy, chat: drawChat })[ex.layout](area, F);
  /* check and reset */
  const row = el("div", "ex-row");
  row.appendChild(btn(ex.layout === "map" || ex.layout === "houses" ? "Save settings" : "Submit", "b pri", function () {
    /* as in the sim: every device on the network is inspected first */
    if (v.visit) { const seen = (st.visited || []).length, all = v.devices.length; if (seen < all) { ui.msg = "Inspect every device on the network first: " + seen + " of " + all + " so far. You can't call a network clean until you've looked at all of it."; ctx.draw(); return; } }
    /* as in the chat sim: every reply is sent first, then it is scored */
    if (ex.layout === "chat") { const sent = v.fields.filter(function (f) { return (st.sent || {})[f.id]; }).length; if (sent < v.fields.length) { ui.msg = "Send a reply at every step first: " + sent + " of " + v.fields.length + " sent."; ctx.draw(); return; } }
    const r = P.check(v, st); ui.msg = r.done ? "" : (r.wrong ? r.wrong + " not right yet. Each one stays marked, with why, until you change it." : r.missing ? "Fill in every part first: " + r.missing + " still empty." : "Not right yet.");
    /* a wrong reply goes back to its step, red with why, to be chosen again;
       the replies that were right stay sent */
    if (ex.layout === "chat") { const right = v.fields.filter(function (f) { return st.ok[f.id]; }).length;
      v.fields.forEach(function (f) { if (!st.ok[f.id]) { delete st.sent[f.id]; delete st.vals[f.id]; } });
      ui.msg = "Score: " + right + " / " + v.fields.length + (r.done ? "" : ". " + (v.fields.length - right) + " " + (v.fields.length - right === 1 ? "reply is" : "replies are") + " back on " + (v.fields.length - right === 1 ? "its step" : "their steps") + ", the wrong one red with why. Choose again from there."); }
    ctx.save(); if (r.done && ctx.onDone) ctx.onDone(ex, v); ctx.draw();
  }));
  row.appendChild(btn("Reset", "b", function () { const n = P.resetAll(st); if (st.visited) n.visited = st.visited.slice(); L.exam[ex.id + ":" + v.id] = n; ui.msg = "Reset: everything's back to the start. Mason's help carries on from where it was."; ctx.save(); ctx.draw(); }, "Reset this exam view: clears your answers and the red marks; Mason's help carries on"));
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
/* ------------------------------------ App Launch: tasks + evidence */
function drawEvidence(area, F) {
  const left = el("section", "ex-card"); left.setAttribute("aria-label", "Tasks"); left.appendChild(el("h3", null, "Tasks"));
  left.appendChild(el("p", "ex-guide", "You are acting in a Tier 1 help desk role. Focus on recognising the problem and choosing a safe next step. Be cautious of options that involve system files, registry changes, or command-line tools."));
  F.v.fields.forEach(function (f) { left.appendChild(fieldBox(f, F)); });
  const right = el("section", "ex-card"); right.setAttribute("aria-label", "Evidence"); right.appendChild(el("h3", null, "Evidence (read-only)"));
  right.appendChild(el("p", "ex-fl", "System Message"));
  const box = el("div", "ex-err"); box.appendChild(el("p", "ex-errt", "✖ " + F.v.evidence.title)); box.appendChild(el("p", null, F.v.evidence.msg)); right.appendChild(box);
  right.appendChild(el("p", "ex-fl", "Event Viewer"));
  right.appendChild(el("pre", "ex-log", F.v.evidence.log));
  right.appendChild(el("p", "ex-hint2", "Use the information above to answer the tasks. Assume you have standard Tier 1 permissions."));
  area.appendChild(left); area.appendChild(right);
}
/* ------------------- App Deployment: the sim's four tabs + resolution */
function drawDeploy(area, F) {
  const ui = F.ui, v = F.v, E = v.evidence;
  const tabsList = (E.bsod ? [["bsod", "BSOD"]] : []).concat([["cmds", "Commands"], ["ev", "Event Viewer"], ["err", "System Error"]]);
  if (!tabsList.some(function (t) { return t[0] === ui.dtab; })) ui.dtab = tabsList[0][0];
  const card = el("section", "ex-card"); card.setAttribute("aria-label", "Evidence tabs");
  const tabs = el("div", "ex-modes"); tabs.setAttribute("role", "group"); tabs.setAttribute("aria-label", "Evidence tabs");
  tabsList.forEach(function (t) { const b = btn(t[1], "b small" + (ui.dtab === t[0] ? " pri" : ""), function () { ui.dtab = t[0]; F.ctx.draw(); }); b.setAttribute("aria-pressed", String(ui.dtab === t[0])); tabs.appendChild(b); });
  card.appendChild(tabs);
  if (ui.dtab === "bsod") {
    const b = el("div", "ex-bsod");
    ["A problem has been detected and system has been shutdown to prevent damage to your computer.", "DRIVER_IRQL_NOT_LESS_OR_EQUAL", "If this is the first time you've seen this stop error screen, restart your computer. If this screen appears again, check to make sure any new hardware or software is properly installed.", "Technical information:", "*** STOP: 0x000000D1 (0x0000000R, 0x00000007, 0x00000000, 0xG74H2574)", "*** strt1.sys - Address G74H2574 base at G74H0000", "Physical memory dump complete. Contact your system administrator or technical support group for further assistance."].forEach(function (l) { b.appendChild(el("p", null, l)); });
    card.appendChild(b);
  }
  if (ui.dtab === "cmds") {
    const list = el("div", "ex-cmds"); list.setAttribute("role", "group"); list.setAttribute("aria-label", "Commands to run");
    E.cmds.forEach(function (c, i) { const b = btn("PS C:\\> " + c[0], "ex-nb ex-mono" + (ui.cmd === i ? " on" : ""), function () { ui.cmd = i; F.ctx.draw(); }, "Run: " + c[0]); list.appendChild(b); });
    card.appendChild(list);
    card.appendChild(el("pre", "ex-log", ui.cmd != null && E.cmds[ui.cmd] ? "PS C:\\> " + E.cmds[ui.cmd][0] + "\n\n" + E.cmds[ui.cmd][1] : "Select a command to view its output."));
  }
  if (ui.dtab === "ev") {
    const w = el("div", "ex-tmw"), t = el("table", "ex-tm"); t.setAttribute("aria-label", "Event Viewer, newest first");
    const hr = el("tr"); ["Index", "Time", "EntryType", "Source", "InstanceID"].forEach(function (h) { hr.appendChild(el("th", null, h)); }); t.appendChild(hr);
    E.events.forEach(function (e) { const k = e[2] === "Error" ? "ex-everr" : e[2] === "Warning" ? "ex-evwarn" : null;
      const r = el("tr", (k ? k + " " : "") + "ex-evhead"); e.slice(0, 5).forEach(function (c, i) { r.appendChild(el("td", null, i === 2 ? (c === "Error" ? "✖ Error" : c === "Warning" ? "⚠ Warning" : c) : String(c))); }); t.appendChild(r);
      const mr = el("tr", k), md = el("td", "ex-evmsg", "Message: " + e[5]); md.colSpan = 5; mr.appendChild(md); t.appendChild(mr); });
    w.appendChild(t); card.appendChild(w);
  }
  if (ui.dtab === "err") { const box = el("div", "ex-err"); box.appendChild(el("p", "ex-errt", "✖ System Error")); box.appendChild(el("p", null, E.error)); card.appendChild(box); }
  area.appendChild(card);
  const res = el("section", "ex-card"); res.setAttribute("aria-label", "Resolution"); res.appendChild(el("h3", null, "Resolution"));
  v.fields.forEach(function (f) { res.appendChild(fieldBox(f, F)); });
  area.appendChild(res);
}
/* ---------------------------------------- Email Threat: the inbox */
function drawInbox(area, F) {
  const ui = F.ui, v = F.v; ui.mail = ui.mail && v.emails.indexOf(ui.mail) >= 0 ? ui.mail : v.emails[0];
  const list = el("nav", "ex-card ex-mlist"); list.setAttribute("aria-label", "MyCC-Inbox"); list.appendChild(el("h3", null, "MyCC-Inbox"));
  v.emails.forEach(function (id) { const e = emailById(id), f = v.fields.filter(function (x) { return x.id === id; })[0], set = F.st.vals[id];
    const b = btn((set ? "✓ " : "") + e.subject, "ex-nb" + (ui.mail === id ? " on" : ""), function () { ui.mail = id; F.ctx.draw(); }, e.subject + (set ? ", classified as " + set : ", not classified yet")); list.appendChild(b); });
  const e = emailById(ui.mail), f = v.fields.filter(function (x) { return x.id === ui.mail; })[0];
  const read = el("section", "ex-card"); read.setAttribute("aria-label", "The email");
  read.appendChild(el("h3", null, e.subject));
  read.appendChild(el("p", "ex-kv", "From: " + e.from[0] + " <" + e.from[1] + ">"));
  if (e.replyTo) read.appendChild(el("p", "ex-kv", "Reply-To: " + e.replyTo));
  e.body.split("\n").forEach(function (l) { read.appendChild(el("p", "ex-mailp", l)); });
  (e.links || []).forEach(function (L) { read.appendChild(el("p", "ex-kv", "Link \u201c" + L.shown + "\u201d goes to: " + L.href)); });
  (e.attach || []).forEach(function (a) { read.appendChild(el("p", "ex-att", "📎 " + a)); });
  read.appendChild(fieldBox(Object.assign({}, f, { label: "Classify this email" }), F));
  area.appendChild(list); area.appendChild(read);
}
/* ------------------------------- Malware IR: the network map */
function drawNetwork(area, F) {
  const ui = F.ui, v = F.v, st = F.st; st.visited = st.visited || [];
  ui.dev = ui.dev || null; ui.tab = ui.tab || "procs";
  const map = el("nav", "ex-card ex-net"); map.setAttribute("aria-label", "Network map (192.168.1.0/24)"); map.appendChild(el("h3", null, "Network Map (192.168.1.0/24)"));
  v.devices.forEach(function (d) { const seen = st.visited.indexOf(d.id) >= 0;
    const b = btn((d.id === "FS01" ? "🖥️ File Server" : d.id === "MAIL01" ? "📨 Mail Server" : "💻 " + d.host) + (seen ? " · inspected" : ""), "ex-nb" + (ui.dev === d.id ? " on" : ""), function () { ui.dev = d.id; if (st.visited.indexOf(d.id) < 0) st.visited.push(d.id); F.ctx.save(); F.ctx.draw(); }, d.host + (seen ? ", inspected" : ", not inspected yet")); map.appendChild(b); });
  map.appendChild(el("p", "ex-hint2", "Inspected " + st.visited.length + " of " + v.devices.length + "."));
  area.appendChild(map);
  const pane = el("section", "ex-card"); pane.setAttribute("aria-label", "Investigation");
  if (!ui.dev) { pane.appendChild(el("p", "ex-hint2", "Select a device from the map to begin investigation.")); area.appendChild(pane); return; }
  const d = v.devices.filter(function (x) { return x.id === ui.dev; })[0];
  pane.appendChild(el("h3", null, d.host));
  const tabs = el("div", "ex-modes"); tabs.setAttribute("role", "group"); tabs.setAttribute("aria-label", "Investigation tools");
  [["procs", "Task Manager"], ["logs", "System Logs"], ["web", "Browser History"]].forEach(function (t) { const b = btn(t[1], "b small" + (ui.tab === t[0] ? " pri" : ""), function () { ui.tab = t[0]; F.ctx.draw(); }); b.setAttribute("aria-pressed", String(ui.tab === t[0])); tabs.appendChild(b); });
  pane.appendChild(tabs);
  const ul = el("ul", "ex-evl");
  if (ui.tab === "procs") { const wrapT = el("div", "ex-tmw"), t = el("table", "ex-tm"); t.setAttribute("aria-label", d.host + " Task Manager, Details, sorted by CPU");
    const hr = el("tr"); ["Name and location", "CPU", "Description", "Publisher"].forEach(function (h) { hr.appendChild(el("th", null, h)); }); t.appendChild(hr);
    d.procs.slice().sort(function (a, b) { return (b.cpu || 0) - (a.cpu || 0); }).forEach(function (p) { const r = el("tr"), n = el("td"); n.appendChild(el("strong", null, p.name)); n.appendChild(el("span", "ex-tmp", p.image || "(no file path)")); r.appendChild(n); [(p.cpu || 0) + "%", p.desc || "", p.publisher || "(none)"].forEach(function (c) { r.appendChild(el("td", null, c)); }); t.appendChild(r); });
    wrapT.appendChild(t); pane.appendChild(wrapT); }
  if (ui.tab === "logs") d.logs.forEach(function (l) { ul.appendChild(el("li", null, (l.time || "") + " · " + l.level + " · " + l.source + " · " + l.id + " · " + l.text)); });
  if (ui.tab === "web") { if (!d.browser.length) ul.appendChild(el("li", null, "No browsing history on this device.")); d.browser.forEach(function (b) { ul.appendChild(el("li", null, (b.time || "") + " · " + (b.title || "") + " · " + b.url)); }); }
  if (ui.tab !== "procs") pane.appendChild(ul);
  pane.appendChild(fieldBox(v.fields.filter(function (f) { return f.id === d.id; })[0], F));
  area.appendChild(pane);
}
/* --------------------------- Wireless Reliability: log + checkpoints */
function drawCheckpoints(area, F) {
  const left = el("section", "ex-card"); left.setAttribute("aria-label", "Environmental signal log"); left.appendChild(el("h3", null, "Environmental Signal Log"));
  const ul = el("ul", "ex-sig"); F.v.signals.forEach(function (s) { ul.appendChild(el("li", null, s)); }); left.appendChild(ul);
  const right = el("section", "ex-card"); right.setAttribute("aria-label", "Decision checkpoints"); right.appendChild(el("h3", null, "Decision Checkpoints"));
  F.v.fields.forEach(function (f) { right.appendChild(fieldBox(f, F)); });
  area.appendChild(left); area.appendChild(right);
}

/* ------------------------------ Help Desk Chat: the conversation, as
   the sim has it. HELP DESK and the task; the customer's messages; under
   the newest, the reply to choose and Send; what you sent; the next
   message after it. Submit scores the lot, as the sim does. */
function chatNext(v, st) { return v.fields.filter(function (f) { return !st.ok[f.id] && !(st.sent || {})[f.id]; })[0] || null; }
function drawChat(area, F) {
  const v = F.v, st = F.st; st.sent = st.sent || {}; st.reach = st.reach || 1;
  const box = el("div", "ex-hd"); area.appendChild(box);
  box.appendChild(el("h3", "ex-hdh", "HELP DESK"));
  box.appendChild(el("p", "ex-hdt", F.ex.task));
  const log = el("div", "cc-log ex-hdlog"); log.setAttribute("role", "log"); log.setAttribute("aria-label", "Conversation with " + v.who); box.appendChild(log);
  function line(x) {
    /* what the technician sees when they check the phone or router */
    if (x.who === "check") {
      const card = el("figure", "cc-shot ex-hdcheck"); card.appendChild(el("figcaption", null, "You check · " + x.title));
      const tb = el("table"); x.rows.forEach(function (r) { const tr = el("tr"); const th = el("th", null, r[0]); th.setAttribute("scope", "row"); tr.appendChild(th); tr.appendChild(el("td", null, r[1])); tb.appendChild(tr); }); card.appendChild(tb); log.appendChild(card); return;
    }
    const b = el("div", "cc-line " + (x.who === "you" ? "you" : "cust"));
    const w = el("span", "cc-who"); if (x.who !== "you") w.appendChild(el("span", "ex-av", v.who.charAt(0))); w.appendChild(document.createTextNode(x.who === "you" ? "You" : v.who)); b.appendChild(w);
    if (x.attach) {
      const card = el("figure", "cc-shot"); card.appendChild(el("figcaption", null, "Screenshot · " + x.attach.title));
      const tb = el("table"); x.attach.rows.forEach(function (r) { const tr = el("tr"); const th = el("th", null, r[0]); th.setAttribute("scope", "row"); tr.appendChild(th); tr.appendChild(el("td", null, r[1])); tb.appendChild(tr); }); card.appendChild(tb); b.appendChild(card);
    } else b.appendChild(el("p", null, x.text));
    log.appendChild(b);
  }
  v.steps.forEach(function (s, i) {
    const k = i + 1; if (k > st.reach) return;
    const f = v.fields.filter(function (x) { return x.id === s.field; })[0];
    s.lines.forEach(line);
    if (st.sent[f.id]) {
      const b = el("div", "cc-line you" + (st.ok[f.id] ? " ex-hdok" : ""));
      b.appendChild(el("span", "cc-who", "You · " + f.label + (st.ok[f.id] ? " · ✓ right" : "")));
      b.appendChild(el("p", null, st.vals[f.id]));
      if (!st.ok[f.id]) b.appendChild(btn("Change reply " + k, "b small", function () { delete st.sent[f.id]; F.ctx.save(); F.ctx.draw(); }, "Change reply " + k));
      log.appendChild(b);
      return;
    }
    /* the reply to choose, under the message it answers */
    const pick = el("div", "ex-hdpick"); pick.appendChild(fieldBox(f, F));
    const send = btn("Send", "b pri", function () { if (!st.vals[f.id]) return; st.sent[f.id] = true; st.reach = Math.max(st.reach, k + 1); F.ctx.save(); F.ctx.draw(); }, "Send reply " + k);
    if (!st.vals[f.id]) { send.disabled = true; send.setAttribute("aria-disabled", "true"); }
    const row = el("div", "ex-hdsend"); row.appendChild(send); row.appendChild(el("span", "ex-hdn", st.vals[f.id] ? "Send it, and " + v.who + " answers." : "Select a reply, then Send.")); pick.appendChild(row);
    log.appendChild(pick);
  });
  if (st.done) v.closing.forEach(line);
  else if (st.reach > v.steps.length && !chatNext(v, st)) { const c = el("p", "ex-hdend", "Every reply is sent. Submit to score the chat, as the sim does."); c.setAttribute("role", "status"); box.appendChild(c); }
}
