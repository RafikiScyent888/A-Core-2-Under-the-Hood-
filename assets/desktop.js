/* =====================================================================
   One PC's screen: Windows 11, as real HTML.

   Real markup rather than a picture painted into the 3D scene, because
   these students have damaged sight: HTML can be measured for contrast,
   the dyslexia setting reaches it, and it zooms cleanly.

   Every program reads the machine (machine.js) each time it draws, and
   everything the student does is reported through ctx.onAct, so the
   ticket can decide what it meant. The desktop decides nothing itself.
   ===================================================================== */
import * as M from "./machine.js";
import { createShell, LAUNCH } from "./cmd.js";
import { explain } from "./mech.js";
import { APPS, CATALOGUE } from "./fleet.js";

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(label, cls, fn, aria) { const b = el("button", cls || "w-btn", label); b.type = "button"; if (aria) b.setAttribute("aria-label", aria); b.addEventListener("click", fn); return b; }

const NAME = { cmd: "Command Prompt", ps: "Windows PowerShell", taskmgr: "Task Manager", eventvwr: "Event Viewer", settings: "Settings", softcenter: "Software Center", explorer: "File Explorer", helpdesk: "Help Desk", winver: "About Windows" };
const TOOLS = ["cmd", "ps", "taskmgr", "eventvwr", "settings", "softcenter", "explorer"];
const FIND = { cmd: "cmd terminal prompt", ps: "powershell terminal", taskmgr: "taskmgr processes", eventvwr: "eventvwr logs events", settings: "apps installed programs control panel appwiz", softcenter: "install reinstall apps company portal", explorer: "files folders this pc" };

export function createDesktop(host, ctx) {
  let wins = [], active = null, wid = 1, start = false, run = null, dialog = null, bootNote = null;
  const root = el("div", "screen-wrap");
  const screen = el("div", "screen");
  screen.setAttribute("role", "region");
  const keys = el("div", "screen-keys");
  root.appendChild(screen); root.appendChild(keys); host.appendChild(root);
  const m = function () { return ctx.machine(); };

  function act(a) { ctx.onAct(Object.assign({ host: m().host, machine: m().id }, a)); }

  /* ------------------------------------------------ opening things */
  function open(app, elevated) {
    start = false; run = null;
    if (app === "winver") { dialog = { kind: "winver" }; return draw(); }
    if (app === "helpdesk" && !ctx.isTech) { dialog = { kind: "message", title: "Help Desk", text: "The Help Desk queue is on your own workstation, TECH-01." }; return draw(); }
    if ((app === "cmd" || app === "ps") && elevated) return askUAC(NAME[app], function (who) { spawn(app, true, who); });
    spawn(app, false);
  }
  function spawn(app, elevated, asWho) {
    const w = { id: wid++, app: app, elevated: !!elevated };
    if (app === "cmd" || app === "ps") {
      w.shell = createShell(m(), { elevated: !!elevated, fleet: ctx.fleetLookup });
      if (asWho) w.shell.elevatedAs = asWho;
      if (app === "ps") { w.shell.mode = "ps"; w.lines = [{ t: "Windows PowerShell\nCopyright (C) Microsoft Corporation. All rights reserved.\n" }]; }
      else w.lines = [{ t: w.shell.banner() + "\n" }];
      if (elevated) act({ type: "elevated", app: app });
    }
    if (app === "taskmgr") { w.sort = { col: "name", dir: 1 }; w.sel = null; }
    if (app === "eventvwr") { w.log = "Application"; w.sel = null; }
    if (app === "explorer") { w.path = "C:\\Users\\" + m().user; w.sel = null; }
    if (app === "settings") { w.sel = null; }
    wins.push(w); active = w.id;
    act({ type: "open", app: app, elevated: !!elevated });
    draw();
    if (w.shell) focusConsole(w.id);
  }
  function launchApp(name, via) {
    start = false; run = null;
    const r = M.launchApp(m(), name, via);
    act({ type: "launch", app: name, res: r });
    if (r.ok) { const w = { id: wid++, app: "prog", prog: name }; wins.push(w); active = w.id; }
    else dialog = { kind: "message", title: r.title, text: r.text, error: true };
    draw();
  }
  /* User Account Control. Everyone here signs in as a standard user —
     you included, the way a help desk should run — so Windows asks for an
     administrator's name and password. An administrator would get Yes or
     No instead. */
  function askUAC(what, ok) {
    if (m().userIsAdmin) dialog = { kind: "uac", what: what, ok: ok };
    else dialog = { kind: "uac-creds", what: what, ok: ok, err: "" };
    draw();
  }
  function closeWin(id) { wins = wins.filter(function (w) { return w.id !== id; }); if (active === id) active = wins.length ? wins[wins.length - 1].id : null; draw(); }
  function restart(reason) { M.shutdown(m()); wins = []; active = null; dialog = null; const r = M.boot(m()); bootNote = r.say; act({ type: "power", op: "restart", res: r, reason: reason }); draw(); }

  /* ------------------------------------------------------- drawing */
  function draw() {
    const mm = m();
    const focused = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.win : null;
    screen.innerHTML = ""; keys.innerHTML = ""; screen.className = "screen";
    screen.setAttribute("aria-label", mm.host + " — " + mm.fullName + "'s screen");
    if (mm.power !== "on") { screen.classList.add("off"); screen.appendChild(el("p", "screen-off", "The screen is dark. " + mm.host + " is switched off.")); screen.appendChild(btn("Press the power button", "w-btn", function () { M.boot(mm); act({ type: "power", op: "on" }); draw(); })); return; }
    if (mm.crashed) {
      screen.classList.add("bsod"); const b = el("div", "bsod-body");
      b.appendChild(el("p", "bsod-face", ":(")); b.appendChild(el("p", null, "Your device ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you."));
      b.appendChild(el("p", "bsod-code", "Stop code: " + mm.crashed)); b.appendChild(btn("Let it restart", "w-btn bsod-btn", function () { restart("crash"); }));
      screen.appendChild(b); return;
    }
    const top = el("div", "sign-bar");
    top.appendChild(el("span", null, mm.host + " · signed in as RAFIKI\\" + mm.user + (mm.userIsAdmin ? " (administrator)" : " (standard user)")));
    screen.appendChild(top);
    const area = el("div", "desk-area" + (mm.shellGone ? " no-shell" : ""));
    if (bootNote) { const n = el("div", "boot-note"); n.setAttribute("role", "status"); n.appendChild(el("span", null, "Restarted. " + bootNote)); n.appendChild(btn("Dismiss", "w-btn small", function () { bootNote = null; draw(); })); area.appendChild(n); }
    if (mm.shellGone) area.appendChild(el("p", "noshell-note", "No taskbar, no Start menu, no desktop: Windows Explorer is not running. Windows itself still is."));
    const w = wins.filter(function (x) { return x.id === active; })[0];
    if (w) area.appendChild(drawWin(w));
    else if (!mm.shellGone) area.appendChild(drawIcons());
    screen.appendChild(area);
    if (start && !mm.shellGone) screen.appendChild(drawStart());
    if (run) screen.appendChild(drawRun());
    if (!mm.shellGone) screen.appendChild(drawTaskbar());
    if (dialog) screen.appendChild(drawDialog());
    keys.appendChild(el("span", "keys-label", "Keyboard:"));
    keys.appendChild(btn("Ctrl + Shift + Esc", "key-btn", function () { open("taskmgr"); }, "Press Ctrl, Shift and Escape: opens Task Manager"));
    keys.appendChild(btn("Windows + R", "key-btn", function () { if (m().shellGone) { dialog = { kind: "message", title: "Nothing happens", text: "Windows + R is handled by Explorer, which is not running. Task Manager can still start programs: Run new task." }; return draw(); } start = false; run = { text: "" }; draw(); }, "Press Windows and R: opens the Run box"));
    if (focused) focusConsole(+focused);
  }

  function drawIcons() {
    const d = el("div", "icons");
    d.setAttribute("aria-label", "Desktop");
    const pub = M.dirOf(m(), "C:\\Users\\Public\\Desktop");
    ((pub && pub.files) || []).forEach(function (f) {
      const name = f.name.replace(/\.lnk$/i, "");
      const ib = btn("", "icon-btn", function () { launchApp(name, "shortcut"); }, "Open the " + name + " shortcut on the desktop");
      ib.appendChild(el("span", "icon-glyph", name.slice(0, 2))); ib.appendChild(el("span", "icon-name", name)); d.appendChild(ib);
    });
    if (ctx.isTech) d.appendChild(btn("Help Desk", "icon-btn", function () { open("helpdesk"); }, "Open Help Desk"));
    return d;
  }

  function drawTaskbar() {
    const tb = el("div", "taskbar");
    const s = btn("Start", "tb-start", function () { start = !start; run = null; draw(); }, "Start menu"); s.setAttribute("aria-expanded", String(start)); tb.appendChild(s);
    tb.appendChild(btn("Desktop", "tb-app" + (active === null ? " on" : ""), function () { active = null; draw(); }, "Show the desktop"));
    wins.forEach(function (w) { const b = btn(winTitle(w), "tb-app" + (w.id === active ? " on" : ""), function () { active = w.id; draw(); if (w.shell) focusConsole(w.id); }); b.setAttribute("aria-pressed", String(w.id === active)); tb.appendChild(b); });
    tb.appendChild(el("span", "tb-clock", ctx.clock ? ctx.clock() : m().clock));
    return tb;
  }

  function drawStart() {
    const sm = el("div", "startmenu"); sm.setAttribute("role", "dialog"); sm.setAttribute("aria-label", "Start menu");
    sm.appendChild(el("h3", "sm-h", "Start"));
    /* Search, as Windows has it: type part of a name and the list narrows. */
    const q = el("input", "w-input sm-search"); q.id = "sm-q-" + m().id; q.placeholder = "Type here to search"; q.setAttribute("aria-label", "Search for apps, settings and documents");
    sm.appendChild(q);
    const list = el("ul", "sm-list");
    q.addEventListener("input", function () { const v = q.value.trim().toLowerCase(); list.querySelectorAll(".sm-app").forEach(function (li) { li.hidden = !!v && li.dataset.find.indexOf(v) < 0; }); });
    setTimeout(function () { q.focus(); }, 0);
    const items = TOOLS.slice(); if (ctx.isTech) items.unshift("helpdesk");
    items.forEach(function (a) {
      const li = el("li", "sm-app"); li.dataset.find = (NAME[a] + " " + a + " " + (FIND[a] || "")).toLowerCase(); li.appendChild(el("span", "sm-name", NAME[a]));
      const acts = el("span", "sm-acts");
      acts.appendChild(btn("Open", "w-btn", function () { open(a, false); }, "Open " + NAME[a]));
      if (a === "cmd" || a === "ps") acts.appendChild(btn("Run as administrator", "w-btn", function () { open(a, true); }, "Run " + NAME[a] + " as administrator"));
      li.appendChild(acts); list.appendChild(li);
    });
    (m().apps || []).filter(function (a) { return a.installed !== false; }).forEach(function (a) {
      const li = el("li", "sm-app"); li.dataset.find = (a.name + " app program").toLowerCase(); li.appendChild(el("span", "sm-name", a.name));
      li.appendChild(btn("Open", "w-btn", function () { launchApp(a.name, "start"); }, "Open " + a.name)); list.appendChild(li);
    });
    sm.appendChild(list);
    const foot = el("div", "sm-foot");
    foot.appendChild(el("span", "sm-user", "RAFIKI\\" + m().user));
    const pw = el("span", "sm-power");
    pw.appendChild(btn("Restart", "w-btn", function () { restart("start"); }));
    pw.appendChild(btn("Shut down", "w-btn", function () { M.shutdown(m()); wins = []; active = null; dialog = null; act({ type: "power", op: "off" }); draw(); }));
    foot.appendChild(pw); sm.appendChild(foot);
    return sm;
  }

  function drawRun() {
    const d = el("div", "w-dialog run"); d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Run");
    d.appendChild(el("h3", "dlg-h", "Run"));
    const lab = el("label", null, "Open:"); const inp = el("input", "w-input"); inp.id = "run-in-" + m().id; lab.setAttribute("for", inp.id);
    function go(admin) {
      const v = inp.value.trim().toLowerCase(); run = null;
      if (v === "cmd" || v === "cmd.exe") return open("cmd", admin);
      if (v === "powershell" || v === "powershell.exe") return open("ps", admin);
      if (v === "taskmgr" || v === "taskmgr.exe") return open("taskmgr");
      if (v === "eventvwr" || v === "eventvwr.msc") return open("eventvwr");
      if (v === "explorer" || v === "explorer.exe") return open("explorer");
      if (v === "winver") return open("winver");
      if (v === "ms-settings:appsfeatures" || v === "appwiz.cpl") return open("settings");
      if (M.appByName(m(), v)) return launchApp(v, "run");
      dialog = { kind: "message", title: v, text: "Windows cannot find '" + v + "'. Make sure you typed the name correctly, and then try again." }; draw();
    }
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); go(e.ctrlKey && e.shiftKey); } });
    d.appendChild(lab); d.appendChild(inp);
    const row = el("div", "dlg-row");
    row.appendChild(btn("OK", "w-btn primary", function () { go(false); }));
    row.appendChild(btn("OK as administrator", "w-btn", function () { go(true); }));
    row.appendChild(btn("Cancel", "w-btn", function () { run = null; draw(); }));
    d.appendChild(row); setTimeout(function () { inp.focus(); }, 0);
    return d;
  }

  function winTitle(w) {
    if (w.shell) return w.shell.title();
    if (w.app === "prog") return w.prog;
    return NAME[w.app];
  }
  function drawWin(w) {
    const box = el("section", "win active"); box.setAttribute("aria-label", winTitle(w));
    const bar = el("div", "win-bar"); bar.appendChild(el("h3", "win-title", winTitle(w)));
    bar.appendChild(btn("Close", "w-btn small", function () { closeWin(w.id); }, "Close " + winTitle(w)));
    box.appendChild(bar);
    const body = el("div", "win-body");
    if (w.shell) body.appendChild(drawConsole(w));
    if (w.app === "taskmgr") body.appendChild(drawTaskMgr(w));
    if (w.app === "eventvwr") body.appendChild(drawEventViewer(w));
    if (w.app === "settings") body.appendChild(drawSettings(w));
    if (w.app === "softcenter") body.appendChild(drawSoftCenter(w));
    if (w.app === "explorer") body.appendChild(drawExplorer(w));
    if (w.app === "helpdesk") ctx.helpdesk(body, { refresh: draw });
    if (w.app === "prog") { const p = el("div", "prog"); p.appendChild(el("h4", null, w.prog + " " + (M.appByName(m(), w.prog) || {}).ver)); p.appendChild(el("p", null, w.prog + " is open and working on " + m().host + ".")); body.appendChild(p); }
    box.appendChild(body);
    return box;
  }

  /* --------------------------------------------------------- console */
  function drawConsole(w) {
    const wrap = el("div", "con");
    const out = el("pre", "con-out"); out.setAttribute("aria-label", "Output");
    w.lines.forEach(function (l) { out.appendChild(el("span", l.cmd ? "con-cmd" : null, l.t)); });
    wrap.appendChild(out);
    const row = el("div", "con-row");
    const p = el("label", "con-prompt", w.shell.prompt());
    const inp = el("input", "con-in"); inp.id = "con-" + m().id + "-" + w.id; inp.dataset.win = String(w.id);
    ["autocomplete", "spellcheck", "autocapitalize"].forEach(function (a) { inp.setAttribute(a, "off"); });
    p.setAttribute("for", inp.id);
    let hi = w.shell.history.length;
    inp.addEventListener("keydown", function (e) {
      if (e.key === "ArrowUp") { if (hi > 0) { hi--; inp.value = w.shell.history[hi] || ""; } e.preventDefault(); }
      if (e.key === "ArrowDown") { if (hi < w.shell.history.length) { hi++; inp.value = w.shell.history[hi] || ""; } e.preventDefault(); }
      if (e.key === "Enter") { e.preventDefault(); submit(w, inp.value); }
    });
    row.appendChild(p); row.appendChild(inp); wrap.appendChild(row);
    if (w.why) { const y = el("p", "con-why"); y.setAttribute("role", "status"); y.appendChild(el("strong", null, "What just happened: ")); y.appendChild(document.createTextNode(w.why)); wrap.appendChild(y); }
    setTimeout(function () { out.scrollTop = out.scrollHeight; }, 0);
    return wrap;
  }
  function submit(w, line) {
    const shown = w.shell.prompt();
    const before = ctx.before();
    const res = w.shell.run(line);
    w.lines.push({ t: shown + line + "\n", cmd: true });
    if (res.clear) w.lines = []; else if (res.out) w.lines.push({ t: res.out + "\n\n" });
    if (w.lines.length > 400) w.lines = w.lines.slice(-400);
    w.why = explain(line, res, w.shell, m());
    act({ type: "cmd", line: line, res: res, elevated: w.shell.elevated, before: before });
    if (res.close) return closeWin(w.id);
    if (res.power === "restart") return restart("cmd");
    if (res.power === "off") { M.shutdown(m()); wins = []; act({ type: "power", op: "off" }); return draw(); }
    if (res.launch) return launchApp(res.launch, "cmd");
    if (res.open) { const o = { taskmgr: "taskmgr", eventvwr: "eventvwr", winver: "winver" }[res.open]; if (o) return open(o); }
    draw(); focusConsole(w.id);
  }
  function focusConsole(id) { setTimeout(function () { const i = screen.querySelector('.con-in[data-win="' + id + '"]'); if (i) i.focus({ preventScroll: true }); }, 0); }

  /* ----------------------------------------------------- Task Manager */
  function drawTaskMgr(w) {
    const mm = m(); const wrap = el("div", "tm"); const t = M.totals(mm);
    const tools = el("div", "tm-tools"); tools.appendChild(el("h4", "tm-h", "Processes"));
    tools.appendChild(btn("Run new task", "w-btn", function () { dialog = { kind: "newtask" }; draw(); }));
    const sel = mm.procs.filter(function (p) { return p.pid === w.sel; })[0];
    const endB = btn("End task", "w-btn", function () { endTask(w, sel); }); endB.disabled = !sel; tools.appendChild(endB);
    wrap.appendChild(tools);
    if (w.flash) { const f = el("p", "tm-flash", w.flash); f.setAttribute("role", "status"); wrap.appendChild(f); }
    const list = mm.procs.slice(); const col = w.sort.col, dir = w.sort.dir;
    list.sort(function (a, b) { return col === "name" ? dir * (a.desc || a.name).localeCompare(b.desc || b.name) : dir * ((a[col] || 0) - (b[col] || 0)); });
    const sc = el("div", "tm-scroll"); const tbl = el("table", "tm-table"); const hr = el("tr");
    [["name", "Name"], ["cpu", t.cpu + "% CPU"], ["mem", t.memPct + "% Memory"], ["disk", t.diskPct + "% Disk"]].forEach(function (c) {
      const th = el("th"); th.setAttribute("scope", "col"); const sorted = col === c[0];
      th.setAttribute("aria-sort", sorted ? (dir < 0 ? "descending" : "ascending") : "none");
      th.appendChild(btn(c[1] + (sorted ? (dir < 0 ? " \u25BC" : " \u25B2") : ""), "th-btn", function () { if (w.sort.col === c[0]) w.sort.dir = -w.sort.dir; else { w.sort.col = c[0]; w.sort.dir = c[0] === "name" ? 1 : -1; } draw(); }, "Sort by " + c[1]));
      hr.appendChild(th);
    });
    const th0 = el("thead"); th0.appendChild(hr); tbl.appendChild(th0);
    const tb = el("tbody");
    list.forEach(function (p) {
      const tr = el("tr", "tm-row" + (p.pid === w.sel ? " sel" : "")); tr.tabIndex = 0; tr.setAttribute("aria-selected", String(p.pid === w.sel));
      tr.appendChild(el("td", null, p.desc || p.name));
      tr.appendChild(el("td", "tm-num", (p.cpu || 0).toFixed(1) + "%")); tr.appendChild(el("td", "tm-num", (p.mem || 0).toLocaleString("en-GB") + " MB")); tr.appendChild(el("td", "tm-num", (p.disk || 0).toFixed(1) + " MB/s"));
      function pick() { w.sel = p.pid; draw(); }
      tr.addEventListener("click", pick); tr.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
      tb.appendChild(tr);
    });
    tbl.appendChild(tb); sc.appendChild(tbl); wrap.appendChild(sc);
    const info = el("div", "tm-info");
    if (sel) { info.appendChild(el("h4", null, "What is this process?")); const dl = el("dl"); [["Name", sel.name], ["Runs from", sel.image || "(the kernel)"], ["Publisher", sel.publisher || "(none — not signed)"], ["Started by", sel.parent || "(none)"], ["Running as", sel.user]].forEach(function (kv) { dl.appendChild(el("dt", null, kv[0])); dl.appendChild(el("dd", null, kv[1])); }); info.appendChild(dl); }
    else info.appendChild(el("p", null, "Select a row to see where it runs from, who published it, and what started it."));
    wrap.appendChild(info);
    return wrap;
  }
  function endTask(w, p) {
    if (!p) return; const r = M.endProcess(m(), p.pid);
    if (r.effect === "confirm-critical") { dialog = { kind: "confirm-critical", proc: p, text: r.say }; return draw(); }
    if (r.effect === "denied") dialog = { kind: "message", title: "Unable to end task", text: r.say }; else w.flash = r.say;
    act({ type: "tm-end", pid: p.pid, name: p.name, res: r }); w.sel = null; draw();
  }

  /* ----------------------------------------------------- Event Viewer */
  function drawEventViewer(w) {
    const mm = m(); const wrap = el("div", "ev");
    const nav = el("div", "ev-nav"); nav.appendChild(el("span", "ev-h", "Windows Logs"));
    ["Application", "System"].forEach(function (L) { const b = btn(L, "w-btn" + (w.log === L ? " primary" : ""), function () { w.log = L; w.sel = null; M.note(mm, "view-log", { log: L }); act({ type: "view-log", log: L }); draw(); }); b.setAttribute("aria-pressed", String(w.log === L)); nav.appendChild(b); });
    wrap.appendChild(nav);
    if (!w.noted) { w.noted = true; M.note(mm, "view-log", { log: w.log }); act({ type: "view-log", log: w.log }); }
    const entries = (mm.logs[w.log] || []).slice().reverse();
    wrap.appendChild(el("p", "ev-count", w.log + " — number of events: " + entries.length));
    const sc = el("div", "ev-scroll"); const t = el("table", "ev-table"); const hr = el("tr");
    ["Level", "Date and Time", "Source", "Event ID", "Index"].forEach(function (c) { const th = el("th", null, c); th.setAttribute("scope", "col"); hr.appendChild(th); });
    const hd = el("thead"); hd.appendChild(hr); t.appendChild(hd); const tb = el("tbody");
    entries.forEach(function (e) {
      const tr = el("tr", "ev-row" + (w.sel === e.index ? " sel" : "") + (e.level === "Error" ? " lvl-err" : e.level === "Warning" ? " lvl-warn" : "")); tr.tabIndex = 0;
      [e.level, e.time, e.source, String(e.id), String(e.index)].forEach(function (v) { tr.appendChild(el("td", null, v)); });
      function pick() { w.sel = e.index; draw(); }
      tr.addEventListener("click", pick); tr.addEventListener("keydown", function (k) { if (k.key === "Enter" || k.key === " ") { k.preventDefault(); pick(); } });
      tb.appendChild(tr);
    });
    t.appendChild(tb); sc.appendChild(t); wrap.appendChild(sc);
    const s = entries.filter(function (e) { return e.index === w.sel; })[0];
    const det = el("div", "ev-detail");
    if (s) { det.appendChild(el("h4", null, "Event " + s.id + ", " + s.source + " (index " + s.index + ")")); det.appendChild(el("p", null, s.text)); }
    else det.appendChild(el("p", null, "Select an event to read it."));
    wrap.appendChild(det);
    return wrap;
  }

  /* ---------------------------------------------- Settings > Apps */
  function installedList() {
    const mm = m(); const out = [];
    (mm.apps || []).filter(function (a) { return a.installed !== false; }).forEach(function (a) { out.push({ kind: "app", key: a.name, label: a.name, ver: a.ver, pub: a.publisher }); });
    Object.keys(M.RUNTIMES).forEach(function (k) { if (mm.runtimes[k]) out.push({ kind: "runtime", key: k, label: M.RUNTIMES[k].name, ver: M.RUNTIMES[k].name.split(" - ")[1], pub: "Microsoft Corporation" }); });
    return out;
  }
  function drawSettings(w) {
    const wrap = el("div", "set"); wrap.appendChild(el("h4", "set-h", "Apps › Installed apps"));
    const ul = el("ul", "set-list");
    installedList().forEach(function (it) {
      const li = el("li", "set-item"); const t = el("span", "set-name"); t.appendChild(el("strong", null, it.label)); t.appendChild(el("span", null, it.pub + " · " + (it.ver || ""))); li.appendChild(t);
      li.appendChild(btn("Modify", "w-btn", function () { askUAC(it.label + " setup", function () { dialog = { kind: "installer", item: it }; draw(); }); }, "Modify " + it.label));
      ul.appendChild(li);
    });
    wrap.appendChild(ul); return wrap;
  }

  /* --------------------------------------------------- Software Center */
  function drawSoftCenter(w) {
    const mm = m(); const wrap = el("div", "sc"); wrap.appendChild(el("h4", "set-h", "Software Center — Applications"));
    wrap.appendChild(el("p", "sc-note", "Rafiki's approved software. Anyone can install or reinstall these; no administrator password is needed."));
    const ul = el("ul", "set-list");
    CATALOGUE.filter(function (c) { return c.kind === "app"; }).forEach(function (c) {
      const inst = M.appByName(mm, c.key); const installed = inst && inst.installed !== false;
      const li = el("li", "set-item"); const t = el("span", "set-name"); t.appendChild(el("strong", null, c.label)); t.appendChild(el("span", null, installed ? "Installed" : "Available")); li.appendChild(t);
      li.appendChild(btn(installed ? "Reinstall" : "Install", "w-btn", function () {
        const before = ctx.before(); let r;
        if (installed) r = M.repairApp(mm, c.key, "reinstall");
        else { const a = Object.assign(M.clone(APPS[c.key]), { installed: true }); mm.apps = mm.apps.filter(function (x) { return x.name !== c.key; }).concat([a]); M.placeApp(mm.fs, a, mm); (a.bundles || []).forEach(function (k) { mm.runtimes[k] = true; }); M.syncRuntimes(mm); M.note(mm, "repair-app", { app: c.key, how: "install" }); r = { ok: true, text: c.label + " was installed successfully." }; }
        dialog = { kind: "message", title: "Software Center", text: r.text }; act({ type: installed ? "reinstall" : "install", app: c.key, before: before }); draw();
      }, (installed ? "Reinstall " : "Install ") + c.label));
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
    wrap.appendChild(el("h4", "set-h", "Administrator tools"));
    wrap.appendChild(el("p", "sc-note", "System components. These need an administrator to install."));
    const ul2 = el("ul", "set-list");
    CATALOGUE.filter(function (c) { return c.kind === "runtime"; }).forEach(function (c) {
      const li = el("li", "set-item"); const t = el("span", "set-name"); t.appendChild(el("strong", null, c.label)); t.appendChild(el("span", null, mm.runtimes[c.key] ? "Installed" : "Not installed")); li.appendChild(t);
      li.appendChild(btn(mm.runtimes[c.key] ? "Repair" : "Install", "w-btn", function () {
        askUAC(c.label, function () { const before = ctx.before(); const r = M.installRuntime(mm, c.key, mm.runtimes[c.key] ? "repair" : "install"); dialog = { kind: "message", title: "Software Center", text: r.text }; act({ type: "catalogue-admin", key: c.key, before: before }); draw(); });
      }, (mm.runtimes[c.key] ? "Repair " : "Install ") + c.label));
      ul2.appendChild(li);
    });
    wrap.appendChild(ul2);
    return wrap;
  }

  /* ---------------------------------------------------- File Explorer */
  function drawExplorer(w) {
    const mm = m(); const wrap = el("div", "fx");
    const bar = el("div", "fx-bar");
    const lab = el("label", "fx-lab", "Address"); const inp = el("input", "w-input fx-addr"); inp.id = "fx-" + mm.id + "-" + w.id; lab.setAttribute("for", inp.id); inp.value = w.path;
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { const d = M.dirOf(mm, inp.value.trim()); if (d) { w.path = d.path; w.sel = null; } else dialog = { kind: "message", title: "File Explorer", text: "Windows can't find '" + inp.value + "'. Check the spelling and try again." }; draw(); } });
    bar.appendChild(lab); bar.appendChild(inp);
    bar.appendChild(btn("Up", "w-btn", function () { const i = w.path.lastIndexOf("\\"); if (i > 2) { w.path = w.path.slice(0, i); } else w.path = "C:\\"; w.sel = null; draw(); }));
    wrap.appendChild(bar);
    const d = M.dirOf(mm, w.path);
    const ul = el("ul", "fx-list");
    if (d) {
      d.dirs.forEach(function (n) { const li = el("li"); li.appendChild(btn("\uD83D\uDCC1 " + n, "fx-dir", function () { w.path = (w.path.length === 3 ? w.path : w.path + "\\") + n; w.sel = null; draw(); }, "Folder " + n)); ul.appendChild(li); });
      d.files.forEach(function (f) { const li = el("li", "fx-file" + (w.sel === f.name ? " sel" : "")); li.appendChild(btn(f.name + "   " + Math.ceil(f.size / 1024).toLocaleString("en-GB") + " KB", "fx-f", function () { w.sel = f.name; draw(); }, "File " + f.name)); ul.appendChild(li); });
    }
    wrap.appendChild(ul);
    if (w.sel) {
      const acts = el("div", "fx-acts"); acts.appendChild(el("span", null, "Selected: " + w.sel));
      acts.appendChild(btn("Delete", "w-btn", function () {
        const full = w.path + "\\" + w.sel;
        const doIt = function () { const before = ctx.before(); const sh = createShell(mm, { elevated: true, fleet: ctx.fleetLookup }); const res = sh.run('del "' + full + '"'); act({ type: "cmd", line: "del " + full, res: res, elevated: true, before: before, via: "explorer" }); w.sel = null; draw(); };
        if (/^c:\\(windows|program files)/i.test(full)) askUAC("File Explorer (delete)", doIt); else doIt();
      }, "Delete " + w.sel));
      wrap.appendChild(acts);
    }
    return wrap;
  }

  /* --------------------------------------------------------- dialogs */
  function drawDialog() {
    const d = dialog; const mm = m();
    const box = el("div", "w-dialog " + d.kind); box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true");
    const row = el("div", "dlg-row"); const close = function () { dialog = null; draw(); };
    if (d.kind === "message") { box.appendChild(el("h3", "dlg-h", d.title)); const p = el("p", d.error ? "dlg-error" : null, d.text); box.appendChild(p); row.appendChild(btn("OK", "w-btn primary", close)); }
    if (d.kind === "winver") { box.appendChild(el("h3", "dlg-h", "About Windows")); box.appendChild(el("p", null, mm.edition + ", version " + mm.version + " (OS Build " + mm.build.split(".").slice(2).join(".") + ")")); row.appendChild(btn("OK", "w-btn primary", close)); }
    if (d.kind === "uac") {
      box.appendChild(el("h3", "dlg-h", "User Account Control")); box.appendChild(el("p", "uac-q", "Do you want to allow this app to make changes to your device?")); box.appendChild(el("p", null, d.what + " — Verified publisher: Microsoft Windows"));
      row.appendChild(btn("Yes", "w-btn primary", function () { dialog = null; act({ type: "uac", ok: true }); d.ok(null); }));
      row.appendChild(btn("No", "w-btn", function () { dialog = null; act({ type: "uac", ok: false }); draw(); }));
    }
    if (d.kind === "uac-creds") {
      box.appendChild(el("h3", "dlg-h", "User Account Control")); box.appendChild(el("p", "uac-q", "Do you want to allow this app to make changes to your device?"));
      box.appendChild(el("p", null, d.what + ". To continue, enter an admin user name and password."));
      const u = el("input", "w-input"); u.id = "uac-u-" + mm.id; const lu = el("label", null, "User name"); lu.setAttribute("for", u.id);
      const p = el("input", "w-input"); p.id = "uac-p-" + mm.id; p.type = "password"; const lp = el("label", null, "Password"); lp.setAttribute("for", p.id);
      [lu, u, lp, p].forEach(function (x) { box.appendChild(x); });
      if (d.err) { const e = el("p", "dlg-err", d.err); e.setAttribute("role", "alert"); box.appendChild(e); }
      function tryIt() {
        const name = u.value.trim().replace(/^rafiki\\/i, "").replace(/^\.\\/, "").toLowerCase();
        if (name === mm.techAccount.name && p.value === mm.techAccount.password) { dialog = null; act({ type: "uac", ok: true, creds: true }); d.ok(mm.techAccount.name); }
        else { d.err = "The user name or password is incorrect."; act({ type: "uac", ok: false, creds: true }); draw(); }
      }
      p.addEventListener("keydown", function (e) { if (e.key === "Enter") tryIt(); });
      row.appendChild(btn("Yes", "w-btn primary", tryIt)); row.appendChild(btn("No", "w-btn", close));
      setTimeout(function () { u.focus(); }, 0);
    }
    if (d.kind === "installer") {
      const it = d.item; box.appendChild(el("h3", "dlg-h", it.label + " Setup")); box.appendChild(el("p", null, "Change, repair, or remove installation."));
      row.appendChild(btn("Repair", "w-btn primary", function () { const before = ctx.before(); const r = it.kind === "app" ? M.repairApp(mm, it.key, "repair") : M.installRuntime(mm, it.key, "repair"); dialog = { kind: "message", title: it.label + " Setup", text: r.text }; act({ type: it.kind === "app" ? "repair" : "catalogue-admin", app: it.key, key: it.key, before: before }); draw(); }));
      row.appendChild(btn("Uninstall", "w-btn", function () {
        const before = ctx.before();
        if (it.kind === "app") { const a = M.appByName(mm, it.key); a.installed = false; M.note(mm, "uninstall", { app: it.key }); }
        else { mm.runtimes[it.key] = false; M.syncRuntimes(mm); M.note(mm, "uninstall", { runtime: it.key }); }
        dialog = { kind: "message", title: it.label + " Setup", text: it.label + " was removed." }; act({ type: "cmd", line: "uninstall " + it.key, res: { kind: "change" }, before: before }); draw();
      }));
      row.appendChild(btn("Cancel", "w-btn", close));
    }
    if (d.kind === "confirm-critical") {
      box.appendChild(el("h3", "dlg-h", "Task Manager")); box.appendChild(el("p", null, d.text));
      row.appendChild(btn("Shut down", "w-btn", function () { dialog = null; const r = M.endProcess(mm, d.proc.pid, "confirmed"); act({ type: "tm-end", pid: d.proc.pid, name: d.proc.name, res: r }); draw(); }));
      row.appendChild(btn("Cancel", "w-btn primary", close));
    }
    if (d.kind === "newtask") {
      box.appendChild(el("h3", "dlg-h", "Create new task")); const lab = el("label", null, "Open:"); const inp = el("input", "w-input"); inp.id = "nt-" + mm.id; lab.setAttribute("for", inp.id);
      box.appendChild(lab); box.appendChild(inp);
      function go() { const v = inp.value.trim().toLowerCase(); dialog = null; if (v === "explorer" || v === "explorer.exe") { M.startShell(mm); act({ type: "shell-back" }); return draw(); } if (v === "cmd" || v === "cmd.exe") return open("cmd"); if (M.appByName(mm, v)) return launchApp(v, "run"); dialog = { kind: "message", title: "Create new task", text: "Windows cannot find '" + v + "'." }; draw(); }
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
      row.appendChild(btn("OK", "w-btn primary", go)); row.appendChild(btn("Cancel", "w-btn", close)); setTimeout(function () { inp.focus(); }, 0);
    }
    box.appendChild(row);
    const veil = el("div", "w-veil"); veil.appendChild(box); return veil;
  }

  draw();
  return { draw: draw, reset: function () { wins = []; active = null; start = false; run = null; dialog = null; bootNote = null; draw(); }, open: open, element: root };
}
