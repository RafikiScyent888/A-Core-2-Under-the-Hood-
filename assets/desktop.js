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
import * as MW from "./malware.js";
import { drawMail } from "./mailui.js";
import * as BK from "./backup.js";
import * as FX from "./fsys.js";
import * as INS from "./install.js";
import { drawInstall } from "./installui.js";

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(label, cls, fn, aria) { const b = el("button", cls || "w-btn", label); b.type = "button"; if (aria) b.setAttribute("aria-label", aria); b.addEventListener("click", fn); return b; }

const NAME = { cmd: "Command Prompt", ps: "Windows PowerShell", taskmgr: "Task Manager", eventvwr: "Event Viewer", settings: "Settings", softcenter: "Software Center", explorer: "File Explorer", helpdesk: "Help Desk", winver: "About Windows", edge: "Microsoft Edge", security: "Windows Security", sysprot: "System Properties", netconn: "Network Connections", winupdate: "Windows Update", mail: "Mail", filehist: "File History", props: "Properties", health: "PC Health Check", diskmgmt: "Disk Management", w11setup: "Windows 11 Setup (setup.exe)" };
const TOOLS = ["mail", "cmd", "ps", "taskmgr", "eventvwr", "settings", "softcenter", "explorer", "edge", "security", "sysprot", "netconn", "winupdate", "filehist"];
const FIND = { cmd: "cmd terminal prompt", ps: "powershell terminal", taskmgr: "taskmgr processes", eventvwr: "eventvwr logs events", settings: "apps installed programs control panel appwiz", softcenter: "install reinstall apps company portal", explorer: "files folders this pc usb drive", edge: "browser internet history web", security: "defender antivirus virus threat protection scan malware", sysprot: "restore point system protection sysdm.cpl create a restore point system restore rstrui computer name rename domain join workgroup", netconn: "network adapter ethernet ncpa.cpl connections", winupdate: "updates update check", mail: "email outlook inbox messages", filehist: "file history backup back up control panel restore personal files", health: "pc health check windows 11 requirements upgrade tpm secure boot processor", diskmgmt: "disk management diskmgmt.msc partitions volumes shrink extend format drive", w11setup: "setup.exe usb upgrade install windows 11 win11_24h2" };

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
    if (app === "filehist") { w.view = "main"; }
    wins.push(w); active = w.id;
    M.note(m(), "opened", { app: app });
    act({ type: "open", app: app, elevated: !!elevated });
    draw();
    if (w.shell) focusConsole(w.id);
  }
  /* a file's Properties, opened from File Explorer */
  function openProps(path) {
    start = false; run = null;
    const w = { id: wid++, app: "props", path: path, tab: "general", sel: null };
    wins.push(w); active = w.id; M.note(m(), "opened", { app: "props" }); act({ type: "open", app: "props", path: path }); draw();
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
  function restart(reason) { M.shutdown(m()); wins = []; active = null; dialog = null; start = false; run = null; const r = M.boot(m()); bootNote = r.say; act({ type: "power", op: "restart", res: r, reason: reason }); draw(); }

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
    /* a PC being installed: its firmware, Windows Setup, or first run */
    if (INS.screen(mm)) { screen.classList.add("inst"); drawInstall(screen, mm, { act: function (x) { act(x); }, before: ctx.before, draw: draw }); return; }
    const top = el("div", "sign-bar");
    const as = INS.signedInAs(mm);
    top.appendChild(el("span", null, mm.host + " · signed in as " + (as || "RAFIKI\\" + mm.user + (mm.userIsAdmin ? " (administrator)" : " (standard user)"))));
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

  function w10() { return /Windows 10/.test(m().edition || ""); }
  function drawTaskbar() {
    /* Windows 11 centres Start and the taskbar's buttons; Windows 10 has
       them at the left */
    const tb = el("div", "taskbar" + (w10() ? " w10" : "")), mid = el("div", "tb-mid"); tb.appendChild(mid);
    const s = btn("Start", "tb-start", function () { start = !start; run = null; draw(); }, "Start menu"); s.setAttribute("aria-expanded", String(start)); mid.appendChild(s);
    mid.appendChild(btn("Desktop", "tb-app" + (active === null ? " on" : ""), function () { active = null; draw(); }, "Show the desktop"));
    wins.forEach(function (w) { const b = btn(winTitle(w), "tb-app" + (w.id === active ? " on" : ""), function () { active = w.id; draw(); if (w.shell) focusConsole(w.id); }); b.setAttribute("aria-pressed", String(w.id === active)); mid.appendChild(b); });
    tb.appendChild(el("span", "tb-clock", ctx.clock ? ctx.clock() : m().clock));
    return tb;
  }

  function drawStart() {
    const sm = el("div", "startmenu" + (w10() ? " w10" : "")); sm.setAttribute("role", "dialog"); sm.setAttribute("aria-label", "Start menu");
    sm.appendChild(el("h3", "sm-h", "Start"));
    /* Search, as Windows has it: type part of a name and the list narrows. */
    const q = el("input", "w-input sm-search"); q.id = "sm-q-" + m().id; q.placeholder = "Type here to search"; q.setAttribute("aria-label", "Search for apps, settings and documents");
    sm.appendChild(q);
    const list = el("ul", "sm-list");
    q.addEventListener("input", function () { const v = q.value.trim().toLowerCase(); list.querySelectorAll(".sm-app").forEach(function (li) { li.hidden = !!v && li.dataset.find.indexOf(v) < 0; }); });
    setTimeout(function () { q.focus(); }, 0);
    const items = TOOLS.slice(); if (ctx.isTech) items.unshift("helpdesk");
    /* a PC under the install model: PC Health Check, and setup.exe while the installer USB is in it */
    if (INS.managed(m()) && m().inst.os) { items.push("diskmgmt"); items.push("health"); if (m().inst.media && /Windows 10/.test(m().inst.os.name)) items.push("w11setup"); }
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
    const mi = m(); foot.appendChild(el("span", "sm-user", INS.managed(mi) && mi.inst.account && mi.inst.account.type === "local" ? mi.host + "\\" + mi.inst.account.name : "RAFIKI\\" + mi.user));
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
    if (w.app === "props") return w.path.slice(w.path.lastIndexOf("\\") + 1) + " Properties";
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
    if (w.app === "edge") body.appendChild(drawEdge(w));
    if (w.app === "security") body.appendChild(drawSecurity(w));
    if (w.app === "sysprot") body.appendChild(drawSysProt(w));
    if (w.app === "netconn") body.appendChild(drawNetConn(w));
    if (w.app === "winupdate") body.appendChild(drawWinUpdate(w));
    if (w.app === "props") body.appendChild(drawProps(w));
    if (w.app === "filehist") body.appendChild(drawFileHistory(w));
    if (w.app === "health") body.appendChild(drawHealth(w));
    if (w.app === "diskmgmt") body.appendChild(drawDiskMgmt(w));
    if (w.app === "w11setup") body.appendChild(drawW11Setup(w));
    if (w.app === "mail") { w.ui = w.ui || {}; drawMail(body, { fleet: ctx.fleet, mid: m().id, helpdesk: false, act: function (a) { a.before = a.before || ctx.before(); act(a); draw(); }, draw: draw, noForward: ctx.noForward || function () { return false; } }, w.ui); }
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
    const back = r.ok ? MW.afterEnd(m(), p) : null; if (back) { w.flash = back; r.respawned = true; }
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
    /* This PC: the drives, as Windows lists them, a USB stick included */
    bar.appendChild(btn("Local Disk (C:)", "w-btn", function () { w.path = "C:\\"; w.sel = null; draw(); }, "Go to Local Disk (C:)"));
    if (MW.ready(mm).usb) bar.appendChild(btn(mm.usb.label, "w-btn", function () { w.path = "E:\\"; w.sel = null; draw(); }, "Go to the USB drive " + mm.usb.label));
    FX.drives(mm).forEach(function (dv) { const nm = dv.label + " (" + dv.letter + ":)"; bar.appendChild(btn(nm, "w-btn", function () { w.path = FX.rootOf(dv.letter); w.sel = null; draw(); }, "Go to " + (dv.removable ? "the USB drive " : "the drive ") + nm)); });
    bar.appendChild(btn("Up", "w-btn", function () { const i = w.path.lastIndexOf("\\"); if (i > 2) { w.path = w.path.slice(0, i); } else w.path = "C:\\"; w.sel = null; draw(); }));
    wrap.appendChild(bar);
    /* at the top of a drive: its Properties, and Format, as This PC offers them */
    const atDrive = w.path.length === 3 && FX.drive(mm, w.path[0]);
    if (atDrive) {
      const dv = atDrive, nm = dv.label + " (" + dv.letter + ":)", db = el("div", "fx-drive");
      db.appendChild(el("span", null, nm + " · " + (dv.removable ? "USB Drive" : "Local Disk")));
      db.appendChild(btn("Properties", "w-btn", function () { M.note(mm, "fx-props", { letter: dv.letter }); act({ type: "fx-view", what: "props", letter: dv.letter }); dialog = { kind: "fx-props", L: dv.letter }; draw(); }, "Properties of " + nm));
      db.appendChild(btn("Format…", "w-btn", function () { const go = function () { dialog = { kind: "fx-format", L: dv.letter, step: "form" }; draw(); }; if (dv.removable) go(); else askUAC("Format " + nm, go); }, "Format " + nm));
      wrap.appendChild(db);
    }
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
        const doIt = function () { const before = ctx.before(); const sh = createShell(mm, { elevated: true, fleet: ctx.fleetLookup }); const res = sh.run('del "' + full + '"'); if (res.inUse) dialog = { kind: "message", title: "File In Use", text: "The action can't be completed because the file is open in " + w.sel + ". Close the file and try again." }; act({ type: "cmd", line: "del " + full, res: res, elevated: true, before: before, via: "explorer" }); w.sel = null; draw(); };
        if (/^c:\\(windows|program files)/i.test(full)) askUAC("File Explorer (delete)", doIt); else doIt();
      }, "Delete " + w.sel));
      const selF = d && d.files.filter(function (f) { return f.name === w.sel; })[0];
      if (selF && selF.doc) acts.appendChild(btn("Open", "w-btn", function () { const full = w.path + "\\" + w.sel; M.note(mm, "doc-open", { path: full, doc: selF.doc.id }); act({ type: "doc-open", path: full, doc: selF.doc.id }); dialog = { kind: "doc", name: w.sel, doc: selF.doc, note: "Opened in Excel. Last saved " + selF.doc.saved + "." }; draw(); }, "Open " + w.sel));
      if (/^c:\\users\\/i.test(w.path)) acts.appendChild(btn("Properties", "w-btn", function () { openProps(w.path + "\\" + w.sel); }, "Properties of " + w.sel));
      if (FX.drives(mm).length) acts.appendChild(btn("Copy to…", "w-btn", function () { dialog = { kind: "fx-copy", from: (w.path.length === 3 ? w.path : w.path + "\\") + w.sel, name: w.sel }; draw(); }, "Copy " + w.sel + " to another folder or drive"));
      if (/^mpam-fe\.exe$/i.test(w.sel)) acts.appendChild(btn("Open", "w-btn primary", function () {
        askUAC("Microsoft Defender Antivirus definitions update", function () { const before = ctx.before(); const r = MW.updateDefs(m(), "usb"); dialog = { kind: "message", title: "mpam-fe.exe", text: r.text }; act({ type: "av", op: "defs", how: "usb", res: r, before: before }); draw(); });
      }, "Open " + w.sel));
      wrap.appendChild(acts);
    }
    return wrap;
  }

  /* ------------------------------------------------- Microsoft Edge */
  /* Only the History page: what the user downloaded is evidence. */
  function drawEdge(w) {
    const mm = MW.ready(m()); const wrap = el("div", "edge");
    wrap.appendChild(el("h4", "set-h", "History"));
    if (!mm.browser.length) wrap.appendChild(el("p", "sc-note", "Nothing in the history."));
    const ul = el("ul", "set-list");
    mm.browser.slice().reverse().forEach(function (b) { const li = el("li", "set-item edge-h"); const t = el("span", "set-name"); t.appendChild(el("strong", null, b.title || b.url)); t.appendChild(el("span", null, (b.time ? b.time + " · " : "") + b.url)); li.appendChild(t); ul.appendChild(li); });
    if (!w.noted) { w.noted = true; M.note(mm, "view-history"); act({ type: "view-history" }); }
    wrap.appendChild(ul); return wrap;
  }

  /* ----------------------------------------------- Windows Security */
  function drawSecurity(w) {
    const mm = MW.ready(m()); const wrap = el("div", "set wsec");
    wrap.appendChild(el("h4", "set-h", "Virus & threat protection"));
    const cur = el("section", "wsec-sec"); cur.appendChild(el("h5", null, "Current threats"));
    cur.appendChild(el("p", null, mm.av.found.length ? "Threats found: " + mm.av.found.join(", ") + ". Action needed." : mm.av.lastScan ? "No current threats." : "No scan has been run recently."));
    wrap.appendChild(cur);
    const sc = el("section", "wsec-sec"); sc.appendChild(el("h5", null, "Scan options"));
    const opts = el("div", "dlg-row wsec-opts");
    [["quick", "Quick scan"], ["full", "Full scan"], ["offline", "Microsoft Defender Offline scan"]].forEach(function (k) {
      opts.appendChild(btn(k[1], "w-btn" + (k[0] === "offline" ? " primary" : ""), function () {
        askUAC("Microsoft Defender Antivirus (" + k[1] + ")", function () {
          const before = ctx.before(); let r;
          if (k[0] === "offline") { r = MW.scan(mm, "offline"); if (r.offline) r = MW.offlineScan(mm); }
          else r = MW.scan(mm, k[0]);
          dialog = { kind: "message", title: "Windows Security", text: r.text };
          act({ type: "av", op: "scan", kind: k[0], res: r, before: before });
          if (r.removed) { wins = []; active = null; bootNote = r.text; act({ type: "power", op: "restart", reason: "offline scan" }); }
          draw();
        });
      }, k[1] + " now"));
    });
    sc.appendChild(opts); wrap.appendChild(sc);
    const up = el("section", "wsec-sec"); up.appendChild(el("h5", null, "Protection updates"));
    up.appendChild(el("p", null, "Security intelligence version " + mm.av.defs + ", last updated " + mm.av.defsDate + "."));
    up.appendChild(btn("Check for updates", "w-btn", function () { const before = ctx.before(); const r = MW.updateDefs(mm, "internet"); dialog = { kind: "message", title: "Protection updates", text: r.text }; act({ type: "av", op: "defs", how: "internet", res: r, before: before }); draw(); }));
    wrap.appendChild(up);
    const sch = el("section", "wsec-sec"); sch.appendChild(el("h5", null, "Scheduled scan"));
    sch.appendChild(el("p", null, mm.av.schedule ? "On: " + mm.av.schedule + "." : "Off. No scan is scheduled."));
    sch.appendChild(btn(mm.av.schedule ? "Turn off" : "Turn on (every day at 2:00 AM)", "w-btn", function () { askUAC("Microsoft Defender Antivirus (scheduled scan)", function () { const before = ctx.before(); const r = MW.setSchedule(mm, !mm.av.schedule); act({ type: "av", op: "schedule", on: !!mm.av.schedule, res: r, before: before }); draw(); }); }));
    wrap.appendChild(sch);
    return wrap;
  }

  /* ------------------------------------------------- PC Health Check */
  const HC = { cpu: ["The processor is supported for Windows 11.", "The processor isn't currently supported for Windows 11."], ram: ["There is at least 4 GB of system memory (RAM).", "This PC needs at least 4 GB of system memory (RAM)."], disk: ["System disk is 64 GB or larger.", "The system disk needs to be 64 GB or larger."], uefi: ["This PC supports Secure Boot.", "This PC must support Secure Boot."], tpm: ["TPM 2.0 is enabled on this PC.", "TPM 2.0 must be supported and enabled on this PC."] };
  function reqList(mm, rows) {
    const ul = el("ul", "hc-list");
    rows.forEach(function (r) { const li = el("li", "hc-row " + (r.ok ? "hc-ok" : "hc-bad")); li.appendChild(el("span", "hc-mark", r.ok ? "✓ Meets" : "✕ Doesn't meet")); li.appendChild(el("span", null, HC[r.k][r.ok ? 0 : 1] + (r.k === "cpu" ? " Processor: " + mm.inst.hw.cpu + "." : ""))); ul.appendChild(li); });
    return ul;
  }
  function drawHealth(w) {
    const mm = m(); const wrap = el("div", "set hc");
    wrap.appendChild(el("h4", "set-h", "PC Health Check › Introducing Windows 11"));
    wrap.appendChild(el("p", null, "Let's check if this PC meets the system requirements."));
    wrap.appendChild(btn("Check now", "w-btn primary", function () { const before = ctx.before(); const r = INS.health(mm); w.res = r; act({ type: "osinst", op: "health", res: r, before: before }); draw(); }, "Check now: does this PC meet Windows 11's requirements?"));
    if (w.res) {
      const r = w.res;
      const h = el("p", "hc-sum " + (r.ok ? "hc-ok" : "hc-bad"), r.ok ? "✓ This PC meets Windows 11 system requirements." : "✕ This PC doesn't currently meet Windows 11 system requirements."); h.setAttribute("role", "status"); wrap.appendChild(h);
      wrap.appendChild(reqList(mm, r.rows));
    }
    return wrap;
  }
  /* ------------------------------------------------- Disk Management */
  function drawDiskMgmt(w) {
    const mm = m(), dk = mm.disks[0], rows = INS.volumes(mm); const wrap = el("div", "set dm");
    wrap.appendChild(el("h4", "set-h", "Disk Management"));
    const t = el("table", "ev-table dm-t"); const hr = el("tr"); ["Volume", "File system", "Status", "Capacity"].forEach(function (c) { const th = el("th", null, c); th.setAttribute("scope", "col"); hr.appendChild(th); });
    const th0 = el("thead"); th0.appendChild(hr); t.appendChild(th0); const tb = el("tbody");
    rows.forEach(function (r) { const on = w.sel === r.i; const tr = el("tr", "ev-row dm-row" + (on ? " sel" : "")); tr.tabIndex = 0; tr.setAttribute("aria-label", r.name + ", " + (r.fs || "no file system") + ", " + r.gb + " GB" + (on ? ", selected" : ""));
      [r.name, r.fs, r.status, r.gb + " GB"].forEach(function (v) { tr.appendChild(el("td", null, v)); });
      const pick = function () { w.sel = r.i; w.msg = null; draw(); }; tr.addEventListener("click", pick); tr.addEventListener("keydown", function (k) { if (k.key === "Enter" || k.key === " ") { k.preventDefault(); pick(); } }); tb.appendChild(tr); });
    t.appendChild(tb); wrap.appendChild(t);
    /* the disk as a strip, partitions in order */
    const strip = el("div", "dm-strip"); strip.setAttribute("aria-hidden", "true");
    rows.forEach(function (r) { const b = el("div", "dm-seg dm-" + r.kind); b.style.flex = String(Math.max(2, r.gb)); b.appendChild(el("span", null, r.kind === "unalloc" ? "Unallocated " + r.gb + " GB" : r.name)); strip.appendChild(b); });
    wrap.appendChild(el("p", "dm-disk", "Disk 0 · Basic · " + Math.round(dk.bytes / 1073741824) + " GB · " + dk.style)); wrap.appendChild(strip);
    const sel = rows.filter(function (r) { return r.i === w.sel; })[0];
    const row = el("div", "dlg-row");
    const sh = btn("Shrink Volume…", "w-btn", function () { askUAC("Disk Management", function () { dialog = { kind: "shrink", i: sel.i, err: "" }; draw(); }); }, "Shrink the selected volume"); sh.disabled = !sel || sel.kind !== "os";
    const nv = btn("New Simple Volume…", "w-btn", function () { askUAC("Disk Management", function () { const before = ctx.before(); const r = INS.newVolume(mm, sel.i); w.msg = r.text; act({ type: "osinst", op: "newvol", res: r, before: before }); draw(); }); }, "Make a new simple volume in the selected space"); nv.disabled = !sel || sel.kind !== "unalloc";
    const dv = btn("Delete Volume…", "w-btn", function () { askUAC("Disk Management", function () { const before = ctx.before(); const r = INS.deleteVolume(mm, sel.i); w.msg = r.text; act({ type: "osinst", op: "delvol", res: r, before: before }); draw(); }); }, "Delete the selected volume"); dv.disabled = !sel || sel.kind === "unalloc";
    [sh, nv, dv].forEach(function (b) { row.appendChild(b); }); wrap.appendChild(row);
    if (w.msg) { const p = el("p", "dlg-error", w.msg); p.setAttribute("role", "status"); wrap.appendChild(p); }
    return wrap;
  }

  /* ---------------------------- Windows 11 Setup, run inside Windows */
  function drawW11Setup(w) {
    const mm = m(), I = mm.inst, U = I.up; const wrap = el("div", "set w11s");
    wrap.appendChild(el("h4", "set-h", "Windows 11 Setup"));
    const go = function (op, d) { const before = ctx.before(); const r = INS.upgrade(mm, op, d); act(Object.assign({ type: "osinst", op: "up-" + op, res: r, before: before }, d || {})); draw(); };
    const row = el("div", "dlg-row");
    if (!U) {
      wrap.appendChild(el("p", null, "Install Windows 11 from " + INS.MEDIA[I.media || "win11"].label + ". Setup checks this PC first."));
      row.appendChild(btn("Next", "w-btn primary", function () { go("start"); }, "Start Windows 11 Setup"));
    } else if (U.step === "blocked") {
      const h = el("p", "hc-sum hc-bad", "✕ This PC doesn't currently meet Windows 11 system requirements."); h.setAttribute("role", "alert"); wrap.appendChild(h);
      wrap.appendChild(reqList(mm, INS.requirements(mm).filter(function (r) { return !r.ok; })));
      row.appendChild(btn("Close Setup", "w-btn primary", function () { go("close"); }));
    } else if (U.step === "terms") {
      wrap.appendChild(el("p", null, "Applicable notices and licence terms: Microsoft Software License Terms, Windows 11."));
      row.appendChild(btn("Accept", "w-btn primary", function () { go("terms"); }, "Accept the licence terms"));
    } else if (U.step === "keep") {
      wrap.appendChild(el("p", null, "Choose what to keep"));
      const g = el("div", "ws-radios"); g.setAttribute("role", "radiogroup"); g.setAttribute("aria-label", "Choose what to keep");
      Object.keys(INS.KEEP).forEach(function (k) { const on = w.pick === k; const b = btn(INS.KEEP[k] + (on ? " (selected)" : ""), "ws-radio" + (on ? " on" : ""), function () { w.pick = k; draw(); }, INS.KEEP[k]); b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(on)); g.appendChild(b); });
      wrap.appendChild(g);
      wrap.appendChild(el("p", "ws-note", w.pick === "all" ? "Your personal files, apps and Windows settings will be kept." : w.pick === "files" ? "Your personal files will be kept. Apps and settings will be removed." : w.pick === "nothing" ? "Everything will be deleted, including files, apps and settings." : "Choose one to go on."));
      row.appendChild(btn("Back", "w-btn", function () { go("back"); }));
      row.appendChild(btn("Next", "w-btn primary", function () { if (w.pick) go("keep", { keep: w.pick }); }, "Next: keep what's selected"));
    } else if (U.step === "ready") {
      wrap.appendChild(el("p", null, "Ready to install: Windows 11 Pro. " + INS.KEEP[U.keep] + "."));
      row.appendChild(btn("Back", "w-btn", function () { go("back"); }));
      row.appendChild(btn("Install", "w-btn primary", function () { go("install"); }, "Install Windows 11"));
    } else {
      wrap.appendChild(el("p", null, "Windows 11 is ready to finish installing. Your PC will restart several times."));
      row.appendChild(btn("Restart now", "w-btn primary", function () { restart("upgrade"); }, "Restart now to finish the upgrade"));
    }
    wrap.appendChild(row); return wrap;
  }

  /* ------------------------------- System Properties, System Protection */
  function drawSysProt(w) {
    const mm = MW.ready(m()); const wrap = el("div", "set sysprot");
    /* Computer Name: what the PC is called and what it's a member of */
    wrap.appendChild(el("h4", "set-h", "System Properties › Computer Name"));
    const dom = mm.domain || "RAFIKI", wg = dom === "WORKGROUP";
    const cdl = el("dl", "doc-dl"); [["Full computer name", mm.host + (wg ? "" : "." + dom.toLowerCase() + ".local")], [wg ? "Workgroup" : "Domain", wg ? "WORKGROUP" : dom.toLowerCase() + ".local"]].forEach(function (kv) { cdl.appendChild(el("dt", null, kv[0])); cdl.appendChild(el("dd", null, kv[1])); }); wrap.appendChild(cdl);
    if (INS.managed(mm) && (mm.inst.pendingName || mm.inst.joinPending)) wrap.appendChild(el("p", "dlg-error", "Changes will take effect after you restart this computer."));
    if (INS.managed(mm)) { const cr = el("div", "dlg-row"); cr.appendChild(btn("Change…", "w-btn", function () { askUAC("System Properties", function () { dialog = { kind: "sysname", step: "form", name: mm.inst.pendingName || mm.host, member: wg && !mm.inst.joinPending ? "workgroup" : "domain", domain: wg ? "" : "RAFIKI" }; draw(); }); }, "Change this computer's name or domain")); wrap.appendChild(cr); }
    wrap.appendChild(el("h4", "set-h", "System Properties › System Protection"));
    if (!mm.restore.available) { wrap.appendChild(el("p", null, "System Restore is not available on Windows Server. Servers are protected with Windows Server Backup instead.")); return wrap; }
    const t = el("table", "ev-table"); const hr = el("tr"); ["Available drives", "Protection"].forEach(function (c) { const th = el("th", null, c); th.setAttribute("scope", "col"); hr.appendChild(th); });
    const th0 = el("thead"); th0.appendChild(hr); t.appendChild(th0); const tb = el("tbody"); const r1 = el("tr"); r1.appendChild(el("td", null, "Local Disk (C:) (System)")); r1.appendChild(el("td", null, mm.restore.enabled ? "On" : "Off")); tb.appendChild(r1); t.appendChild(tb); wrap.appendChild(t);
    wrap.appendChild(el("p", null, "Restore points: " + (mm.restore.points.length ? mm.restore.points.map(function (p) { return p.name + " (" + p.date + ")"; }).join("; ") : "none")));
    const row = el("div", "dlg-row");
    row.appendChild(btn(mm.restore.enabled ? "Configure: Disable system protection" : "Configure: Turn on system protection", "w-btn", function () {
      askUAC("System Properties", function () { const before = ctx.before(); const r = MW.setRestore(mm, !mm.restore.enabled); dialog = { kind: "message", title: "System Protection", text: r.text }; act({ type: "restore", op: mm.restore.enabled ? "on" : "off", res: r, before: before }); draw(); });
    }));
    row.appendChild(btn("Create a restore point…", "w-btn", function () { dialog = { kind: "restorepoint" }; draw(); }));
    if (mm.restore.enabled && mm.restore.points.length) row.appendChild(btn("System Restore…", "w-btn", function () { dialog = { kind: "sysrestore", sel: null }; draw(); }));
    wrap.appendChild(row); return wrap;
  }

  /* ------------------------------------------- a file's Properties */
  /* General, and Previous Versions: the copies of this file Windows kept
     in restore points (shadow copies) and in File History. */
  function drawProps(w) {
    const mm = BK.ready(m()); const wrap = el("div", "set props"); const f = BK.fileAt(mm, w.path); const name = w.path.slice(w.path.lastIndexOf("\\") + 1);
    const tabs = el("div", "ev-nav"); tabs.setAttribute("role", "tablist");
    [["general", "General"], ["versions", "Previous Versions"]].forEach(function (t) { const b = btn(t[1], "w-btn" + (w.tab === t[0] ? " primary" : ""), function () { w.tab = t[0]; w.sel = null; if (t[0] === "versions") { M.note(mm, "pv-view", { path: w.path }); act({ type: "pv-view", path: w.path }); } draw(); }, t[1] + " tab"); b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(w.tab === t[0])); tabs.appendChild(b); });
    wrap.appendChild(tabs);
    if (!f) { wrap.appendChild(el("p", null, "This file is no longer there.")); return wrap; }
    if (w.tab === "general") {
      const dl = el("dl", "doc-dl"); [["Name", name], ["Location", w.path.slice(0, w.path.lastIndexOf("\\"))], ["Size", Math.ceil(f.size / 1024).toLocaleString("en-GB") + " KB"], ["Modified", f.doc ? f.doc.saved : "—"]].forEach(function (kv) { dl.appendChild(el("dt", null, kv[0])); dl.appendChild(el("dd", null, kv[1])); });
      wrap.appendChild(dl); return wrap;
    }
    const vs = BK.versions(mm, w.path);
    wrap.appendChild(el("p", null, "Previous versions come from File History or from restore points."));
    if (!vs.length) { wrap.appendChild(el("p", null, "There are no previous versions available.")); return wrap; }
    const t = el("table", "ev-table"); const th0 = el("thead"); const hr = el("tr"); ["Name", "Date modified", "Location"].forEach(function (c) { const th = el("th", null, c); th.setAttribute("scope", "col"); hr.appendChild(th); }); th0.appendChild(hr); t.appendChild(th0);
    const tb = el("tbody");
    vs.forEach(function (v) {
      const tr = el("tr", "ev-row" + (w.sel === v.id ? " sel" : "")); tr.tabIndex = 0; tr.setAttribute("aria-label", name + ", modified " + v.file.doc.saved + ", from " + v.from + (w.sel === v.id ? ", selected" : ""));
      [name, v.file.doc.saved, v.from].forEach(function (x) { tr.appendChild(el("td", null, x)); });
      function pick() { w.sel = v.id; draw(); }
      tr.addEventListener("click", pick); tr.addEventListener("keydown", function (k) { if (k.key === "Enter" || k.key === " ") { k.preventDefault(); pick(); } });
      tb.appendChild(tr);
    });
    t.appendChild(tb); wrap.appendChild(t);
    const v = vs.filter(function (x) { return x.id === w.sel; })[0];
    const row = el("div", "dlg-row");
    const ob = btn("Open", "w-btn", function () { M.note(mm, "pv-open", { path: w.path, doc: v.file.doc.id }); act({ type: "pv-open", path: w.path, doc: v.file.doc.id }); dialog = { kind: "doc", name: name, ver: v.file.doc.saved, doc: v.file.doc, note: "A read-only copy, from a " + v.from.toLowerCase() + "." }; draw(); }, v ? "Open the version modified " + v.file.doc.saved : "Open the selected version");
    const rb = btn("Restore", "w-btn primary", function () { dialog = { kind: "pv-confirm", path: w.path, name: name, v: v }; draw(); }, v ? "Restore the version modified " + v.file.doc.saved : "Restore the selected version");
    const tb2 = btn("Restore to…", "w-btn", function () { dialog = { kind: "restore-to", name: name, go: function (folder) { const before = ctx.before(); const r = BK.restoreVersionTo(mm, w.path, v.id, folder); dialog = { kind: "message", title: "Previous Versions", text: r.text }; act({ type: "pv-restore", path: w.path, id: v.id, res: r, before: before }); draw(); } }; draw(); }, v ? "Restore the version modified " + v.file.doc.saved + " to another folder" : "Restore the selected version to another folder");
    ob.disabled = rb.disabled = tb2.disabled = !v; row.appendChild(ob); row.appendChild(rb); row.appendChild(tb2); wrap.appendChild(row);
    return wrap;
  }

  /* ---------------------------------- Control Panel › File History */
  function drawFileHistory(w) {
    const mm = BK.ready(m()), fh = mm.bk.fh; const wrap = el("div", "set filehist");
    wrap.appendChild(el("h4", "set-h", "Control Panel › System and Security › File History"));
    const nav = el("div", "ev-nav");
    [["main", "File History"], ["drive", "Select drive"], ["advanced", "Advanced settings"], ["restore", "Restore personal files"]].forEach(function (t) { const b = btn(t[1], "w-btn" + (w.view === t[0] ? " primary" : ""), function () { w.view = t[0]; w.msg = null; if (t[0] === "restore") { w.got = BK.backupView(mm); w.fsel = null; act({ type: "fh", op: "view" }); } draw(); }); b.setAttribute("aria-pressed", String(w.view === t[0])); nav.appendChild(b); });
    wrap.appendChild(nav);
    const say = function (txt, bad) { if (!txt) return; const p = el("p", bad ? "dlg-error" : "fh-msg", txt); p.setAttribute("role", "status"); wrap.appendChild(p); };
    function fhAct(op, fn, extra) { const before = ctx.before(); const r = fn(); w.msg = r && r.text ? { text: r.text, bad: r.ok === false } : null; act(Object.assign({ type: "fh", op: op, res: r, before: before }, extra || {})); draw(); }
    if (w.view === "main") {
      wrap.appendChild(el("p", "fh-state", fh.on ? "File History is on" : "File History is off"));
      if (fh.missing) { const wn = el("p", "fh-warn", "⚠ Reconnect your drive. Your files will be temporarily copied to your hard drive until you reconnect your File History drive (" + fh.target + ") and run a backup."); wn.setAttribute("role", "alert"); wrap.appendChild(wn); }
      const dl = el("dl", "doc-dl"); [["Copy files from", "Libraries, Desktop, Contacts and Favorites"], ["Copy files to", fh.target ? fh.target : "No drive selected"], ["Save copies of files", BK.EVERY.filter(function (x) { return x[1] === fh.every; })[0][0]], ["Keep saved versions", fh.keep], ["Files last copied", fh.runs.length ? fh.runs[fh.runs.length - 1].when : "Never"]].forEach(function (kv) { dl.appendChild(el("dt", null, kv[0])); dl.appendChild(el("dd", null, kv[1])); });
      wrap.appendChild(dl);
      const row = el("div", "dlg-row");
      if (fh.on) { row.appendChild(btn("Run now", "w-btn primary", function () { fhAct("run", function () { return BK.runNow(mm); }); })); row.appendChild(btn("Turn off", "w-btn", function () { fhAct("off", function () { return BK.turnOff(mm); }); })); }
      else row.appendChild(btn("Turn on", "w-btn primary", function () { fhAct("on", function () { return BK.turnOn(mm); }); }));
      wrap.appendChild(row);
    }
    if (w.view === "drive") {
      wrap.appendChild(el("p", null, "Select a File History drive. Choose an external drive or a network location."));
      wrap.appendChild(el("p", null, "Available drives: none found. Plug in an external drive, or add a network location."));
      const lab = el("label", null, "Add network location (folder)"); const inp = el("input", "w-input"); inp.id = "fh-loc-" + mm.id; lab.setAttribute("for", inp.id); inp.placeholder = "\\\\server\\share"; inp.setAttribute("spellcheck", "false"); inp.setAttribute("autocomplete", "off");
      wrap.appendChild(lab); wrap.appendChild(inp);
      const go = function () { const v = inp.value; fhAct("target", function () { return BK.setTarget(mm, v); }, { typed: v }); };
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); go(); } });
      const row = el("div", "dlg-row"); row.appendChild(btn("Select folder", "w-btn primary", go)); wrap.appendChild(row);
      if (fh.target) wrap.appendChild(el("p", null, "Selected: " + fh.target));
    }
    if (w.view === "advanced") {
      wrap.appendChild(el("p", null, "Choose how often to save copies of your files, and how long to keep saved versions."));
      const mk = function (label, id, opts, val, fn) { const l = el("label", null, label); const s = el("select", "w-input"); s.id = id + "-" + mm.id; l.setAttribute("for", s.id); opts.forEach(function (o) { const op = el("option", null, o[0]); op.value = String(o[1]); if (String(o[1]) === String(val)) op.selected = true; s.appendChild(op); }); s.addEventListener("change", function () { fn(s.value); }); wrap.appendChild(l); wrap.appendChild(s); };
      mk("Save copies of files", "fh-every", BK.EVERY, fh.every, function (v) { fhAct("every", function () { return BK.setEvery(mm, Number(v)); }, { every: Number(v) }); });
      mk("Keep saved versions", "fh-keep", BK.KEEP.map(function (k) { return [k, k]; }), fh.keep, function (v) { fhAct("keep", function () { return BK.setKeep(mm, v); }, { keep: v }); });
      wrap.appendChild(el("p", null, "Changes are saved as soon as you choose them."));
    }
    if (w.view === "restore") {
      const g = w.got;
      if (!g) wrap.appendChild(el("p", null, "There are no backups yet. File History hasn't copied any files."));
      else {
        /* one backup at a time, as Windows shows them: older and newer */
        const nav2 = el("div", "dlg-row fh-nav");
        const goTo = function (i) { w.got = BK.backupView(mm, i); w.fsel = null; act({ type: "fh", op: "view" }); draw(); };
        const older = btn("◀ Older backup", "w-btn", function () { goTo(g.at - 1); }, "Show the older backup"); older.disabled = g.at <= 0;
        const newer = btn("Newer backup ▶", "w-btn", function () { goTo(g.at + 1); }, "Show the newer backup"); newer.disabled = g.at >= g.of - 1;
        nav2.appendChild(older); nav2.appendChild(el("p", "fh-state", "Backup from " + g.when + " · " + (g.at + 1) + " of " + g.of)); nav2.appendChild(newer); wrap.appendChild(nav2);
        const t = el("table", "ev-table"); const th0 = el("thead"); const hr = el("tr"); ["Name", "Folder", "Date modified"].forEach(function (c) { const th = el("th", null, c); th.setAttribute("scope", "col"); hr.appendChild(th); }); th0.appendChild(hr); t.appendChild(th0);
        const tb = el("tbody");
        g.files.forEach(function (x) {
          const parts = x.path.split("\\"), folder = parts[parts.length - 2].replace(/^./, function (c) { return c.toUpperCase(); });
          const tr = el("tr", "ev-row" + (w.fsel === x.path ? " sel" : "")); tr.tabIndex = 0; tr.setAttribute("aria-label", x.file.name + " in " + folder + ", modified " + (x.file.doc ? x.file.doc.saved : "unknown") + (w.fsel === x.path ? ", selected" : ""));
          [x.file.name, folder, x.file.doc ? x.file.doc.saved : "—"].forEach(function (v) { tr.appendChild(el("td", null, v)); });
          const pick = function () { w.fsel = x.path; draw(); };
          tr.addEventListener("click", pick); tr.addEventListener("keydown", function (k) { if (k.key === "Enter" || k.key === " ") { k.preventDefault(); pick(); } });
          tb.appendChild(tr);
        });
        t.appendChild(tb); wrap.appendChild(t);
        const sel = g.files.filter(function (x) { return x.path === w.fsel; })[0];
        const real = function (p) { const parts = p.split("\\"); return "C:\\Users\\" + mm.user + "\\" + parts.slice(3).map(function (s2, i) { return i < parts.length - 4 ? s2.replace(/^./, function (c) { return c.toUpperCase(); }) : sel.file.name; }).join("\\"); };
        const doRestore = function (folder) { const before = ctx.before(); const r = BK.restoreFromRun(mm, g.at, real(sel.path), folder); w.msg = { text: r.text, bad: !r.ok }; act({ type: "pv-restore", path: real(sel.path), id: "fh" + g.at, res: r, before: before }); draw(); };
        const row = el("div", "dlg-row");
        const ob = btn("Open", "w-btn", function () { M.note(mm, "pv-open", { path: sel.path, doc: sel.file.doc && sel.file.doc.id }); act({ type: "pv-open", path: sel.path, doc: sel.file.doc && sel.file.doc.id }); dialog = { kind: "doc", name: sel.file.name, ver: sel.file.doc.saved, doc: sel.file.doc, note: "A read-only copy, from the backup made " + g.when + "." }; draw(); }, sel ? "Open the backed-up copy of " + sel.file.name : "Open the selected file");
        const rb = btn("Restore to original location", "w-btn primary", function () { const p = real(sel.path); if (BK.fileAt(mm, p)) { dialog = { kind: "replace", name: sel.file.name, saved: sel.file.doc ? sel.file.doc.saved : g.when, go: function () { doRestore(null); } }; draw(); } else doRestore(null); }, sel ? "Restore " + sel.file.name + " to its original location" : "Restore the selected file to its original location");
        const tb2 = btn("Restore to…", "w-btn", function () { dialog = { kind: "restore-to", name: sel.file.name, go: function (folder) { doRestore(folder); } }; draw(); }, sel ? "Restore a copy of " + sel.file.name + " to another folder" : "Restore the selected file to another folder");
        ob.disabled = rb.disabled = tb2.disabled = !sel || !(sel.file && sel.file.doc); row.appendChild(ob); row.appendChild(rb); row.appendChild(tb2); wrap.appendChild(row);
      }
    }
    if (w.msg) say(w.msg.text, w.msg.bad);
    return wrap;
  }

  /* -------------------------------------------- Network Connections */
  function drawNetConn(w) {
    const mm = MW.ready(m()); const wrap = el("div", "set netconn");
    wrap.appendChild(el("h4", "set-h", "Network Connections"));
    const li = el("div", "set-item"); const t = el("span", "set-name"); t.appendChild(el("strong", null, "Ethernet"));
    t.appendChild(el("span", null, mm.net.adapter === false ? "Disabled" : mm.net.cable === false ? "Network cable unplugged" : "Rafiki.local · Intel(R) Ethernet Connection")); li.appendChild(t);
    li.appendChild(btn(mm.net.adapter === false ? "Enable" : "Disable", "w-btn", function () {
      askUAC("Network Connections", function () { const before = ctx.before(); const on = mm.net.adapter === false; MW.setAdapter(mm, on); act({ type: "net", op: on ? "on" : "off", how: "adapter", before: before }); draw(); });
    }, (mm.net.adapter === false ? "Enable" : "Disable") + " Ethernet"));
    wrap.appendChild(li); return wrap;
  }

  /* -------------------------------------------------- Windows Update */
  function drawWinUpdate(w) {
    const mm = MW.ready(m()); const wrap = el("div", "set winupdate");
    wrap.appendChild(el("h4", "set-h", "Settings › Windows Update"));
    wrap.appendChild(el("p", null, mm.updates.pending ? mm.updates.pending + " updates are waiting. Last checked: " + mm.updates.last + "." : "You're up to date. Last checked: " + mm.updates.last + "."));
    wrap.appendChild(btn("Check for updates", "w-btn primary", function () { const before = ctx.before(); const r = MW.runUpdates(mm); dialog = { kind: "message", title: "Windows Update", text: r.text }; act({ type: "updates", res: r, before: before }); draw(); }));
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
    if (d.kind === "sysname" && d.step === "form") {
      box.appendChild(el("h3", "dlg-h", "Computer Name/Domain Changes")); box.appendChild(el("p", null, "You can change the name and the membership of this computer. Changes might affect access to network resources."));
      const ln = el("label", null, "Computer name"); const nm = el("input", "w-input"); nm.id = "cn-name-" + mm.id; ln.setAttribute("for", nm.id); nm.value = d.name; nm.setAttribute("autocomplete", "off"); nm.setAttribute("spellcheck", "false"); box.appendChild(ln); box.appendChild(nm);
      const g = el("fieldset", "cn-member"); g.appendChild(el("legend", null, "Member of"));
      const can = INS.canJoin(mm);
      [["domain", "Domain"], ["workgroup", "Workgroup"]].forEach(function (o) { const id = "cn-" + o[0] + "-" + mm.id; const r = el("input"); r.type = "radio"; r.name = "cn-member-" + mm.id; r.id = id; r.checked = d.member === o[0]; r.disabled = o[0] === "domain" && !can; r.addEventListener("change", function () { d.name = nm.value; if (d.member === "domain") d.domain = di.value; d.member = o[0]; draw(); }); const l = el("label", null, " " + o[1]); l.setAttribute("for", id); const w = el("div", "cn-opt"); w.appendChild(r); w.appendChild(l); g.appendChild(w); });
      const di = el("input", "w-input"); di.id = "cn-dom-" + mm.id; di.value = d.member === "domain" ? d.domain : "WORKGROUP"; di.disabled = d.member !== "domain"; di.setAttribute("aria-label", d.member === "domain" ? "Domain" : "Workgroup"); di.setAttribute("autocomplete", "off"); g.appendChild(di);
      if (!can) g.appendChild(el("p", null, "Windows 11 Home can't join a domain."));
      box.appendChild(g);
      if (d.err) { const e = el("p", "dlg-err", d.err); e.setAttribute("role", "alert"); box.appendChild(e); }
      row.appendChild(btn("OK", "w-btn primary", function () {
        d.name = nm.value; if (d.member === "domain") d.domain = di.value; d.err = "";
        if (d.member === "domain" && !mm.inst.joined) { d.step = "creds"; draw(); return; }
        const before = ctx.before(); const r = INS.changeName(mm, { name: d.name, member: d.member });
        if (!r.ok) { d.err = r.text; act({ type: "osinst", op: "rename", res: r, before: before, name: d.name, member: d.member }); draw(); return; }
        dialog = { kind: "restart-now", text: r.text }; act({ type: "osinst", op: "rename", res: r, before: before, name: d.name, member: d.member }); draw();
      }));
      row.appendChild(btn("Cancel", "w-btn", close));
    }
    if (d.kind === "sysname" && d.step === "creds") {
      box.appendChild(el("h3", "dlg-h", "Windows Security")); box.appendChild(el("p", null, "Computer Name/Domain Changes: enter the name and password of an account with permission to join the domain."));
      const u = el("input", "w-input"); u.id = "cn-u-" + mm.id; u.value = d.user || ""; const lu = el("label", null, "User name"); lu.setAttribute("for", u.id); u.setAttribute("autocomplete", "off");
      const p = el("input", "w-input"); p.id = "cn-p-" + mm.id; p.type = "password"; const lp = el("label", null, "Password"); lp.setAttribute("for", p.id);
      [lu, u, lp, p].forEach(function (x) { box.appendChild(x); });
      if (d.err) { const e = el("p", "dlg-err", d.err); e.setAttribute("role", "alert"); box.appendChild(e); }
      row.appendChild(btn("OK", "w-btn primary", function () {
        d.user = u.value; const before = ctx.before(); const r = INS.changeName(mm, { name: d.name, member: "domain", domain: d.domain, user: u.value, pass: p.value });
        act({ type: "osinst", op: "rename", res: r, before: before, name: d.name, member: "domain", domain: d.domain });
        if (!r.ok) { d.err = r.text; if (!r.needCreds) d.step = "form"; draw(); return; }
        dialog = { kind: "restart-now", text: r.text }; draw();
      }, "Join the domain with this account"));
      row.appendChild(btn("Cancel", "w-btn", function () { d.step = "form"; d.err = ""; draw(); }));
    }
    if (d.kind === "fx-props") {
      const dv = FX.drive(mm, d.L), u = FX.used(mm, d.L);
      box.appendChild(el("h3", "dlg-h", dv.label + " (" + dv.letter + ":) Properties"));
      const dl = el("dl", "doc-dl"); [["Type", dv.removable ? "USB Drive" : "Local Disk"], ["File system", dv.fs], ["Used space", FX.size(u)], ["Free space", FX.size(FX.free(mm, d.L))], ["Capacity", dv.gb + " GB"], ["Security tab", FX.permissions(dv.fs) ? "Yes: folders on this drive can have permissions" : "None: " + dv.fs + " can't hold permissions"]].forEach(function (kv) { dl.appendChild(el("dt", null, kv[0])); dl.appendChild(el("dd", null, kv[1])); }); box.appendChild(dl);
      row.appendChild(btn("OK", "w-btn primary", close));
    }
    if (d.kind === "fx-format" && d.step === "form") {
      const dv = FX.drive(mm, d.L), nm = dv.label + " (" + dv.letter + ":)";
      box.appendChild(el("h3", "dlg-h", "Format " + nm));
      const dl = el("dl", "doc-dl"); dl.appendChild(el("dt", null, "Capacity")); dl.appendChild(el("dd", null, dv.gb + " GB")); box.appendChild(dl);
      const lf = el("label", null, "File system"); const f = el("select", "fw-sel"); f.id = "fxfmt-fs-" + mm.id; lf.setAttribute("for", f.id);
      FX.formatChoices(dv).forEach(function (x) { const o = el("option", null, x); o.value = x; if (x === (d.fs || dv.fs)) o.selected = true; f.appendChild(o); });
      f.addEventListener("change", function () { d.fs = f.value; });
      const la = el("label", null, "Allocation unit size"); const a = el("select", "fw-sel"); a.id = "fxfmt-au-" + mm.id; la.setAttribute("for", a.id); a.appendChild(el("option", null, "Default allocation size"));
      const ll = el("label", null, "Volume label"); const lb = el("input", "w-input"); lb.id = "fxfmt-label-" + mm.id; ll.setAttribute("for", lb.id); lb.value = d.label != null ? d.label : dv.label; lb.setAttribute("autocomplete", "off"); lb.addEventListener("input", function () { d.label = lb.value; });
      const qw = el("div", "cn-opt"); const q = el("input"); q.type = "checkbox"; q.id = "fxfmt-quick-" + mm.id; q.checked = true; const ql = el("label", null, " Quick Format"); ql.setAttribute("for", q.id); qw.appendChild(q); qw.appendChild(ql);
      [lf, f, la, a, ll, lb, qw].forEach(function (x) { box.appendChild(x); });
      row.appendChild(btn("Start", "w-btn primary", function () { d.fs = f.value; d.label = lb.value; d.step = "warn"; draw(); }, "Start formatting " + nm));
      row.appendChild(btn("Close", "w-btn", close));
    }
    if (d.kind === "fx-format" && d.step === "warn") {
      const dv = FX.drive(mm, d.L), nm = dv.label + " (" + dv.letter + ":)";
      box.appendChild(el("h3", "dlg-h", "Format " + nm));
      const p = el("p", "dlg-error", "WARNING: Formatting will erase ALL data on this disk. To format the disk, click OK. To quit, click CANCEL."); p.setAttribute("role", "alert"); box.appendChild(p);
      row.appendChild(btn("OK", "w-btn primary", function () { const before = ctx.before(); const r = FX.format(mm, d.L, d.fs, d.label); act({ type: "fx-format", letter: d.L, fs: d.fs, res: r, before: before }); dialog = { kind: "message", title: "Format " + nm, text: r.ok ? "Format Complete." : r.text }; draw(); }, "OK: format " + nm + " as " + d.fs));
      row.appendChild(btn("Cancel", "w-btn", close));
    }
    if (d.kind === "fx-copy") {
      box.appendChild(el("h3", "dlg-h", "Copy " + d.name));
      const u = "C:\\Users\\" + mm.user, dests = [u + "\\Desktop", u + "\\Documents", u + "\\Downloads"];
      FX.drives(mm).forEach(function (dv) { const root = FX.rootOf(dv.letter); dests.push(root); const n = mm.fs[root.toLowerCase()]; (n ? n.dirs : []).forEach(function (x) { dests.push(root + x); }); });
      const l = el("label", null, "Copy it to"); const s2 = el("select", "fw-sel"); s2.id = "fxcopy-to-" + mm.id; l.setAttribute("for", s2.id);
      const pick = el("option", null, "Choose a folder…"); pick.value = ""; s2.appendChild(pick);
      dests.forEach(function (x) { const dv = x.length === 3 ? FX.drive(mm, x[0]) : null; const o = el("option", null, dv ? dv.label + " (" + dv.letter + ":)" : x); o.value = x; s2.appendChild(o); });
      box.appendChild(l); box.appendChild(s2);
      if (d.err) { const e = el("p", "dlg-err", d.err); e.setAttribute("role", "alert"); box.appendChild(e); }
      row.appendChild(btn("Copy", "w-btn primary", function () {
        if (!s2.value) return; const before = ctx.before(); const r = FX.copy(mm, d.from, s2.value);
        act({ type: "fx-copy", name: d.name, to: s2.value, res: r, before: before });
        dialog = r.ok ? { kind: "message", title: "Copy", text: r.text } : { kind: "message", title: r.tooLarge ? "File Too Large" : "Copy", text: r.text, error: true }; draw();
      }, "Copy " + d.name + " to the chosen folder"));
      row.appendChild(btn("Cancel", "w-btn", close));
    }
    if (d.kind === "shrink") {
      const max = INS.shrinkMax(mm, d.i), p = mm.disks[0].parts[d.i], tot = Math.floor(p.bytes / 1048576);
      box.appendChild(el("h3", "dlg-h", "Shrink C:"));
      const dl = el("dl", "doc-dl"); [["Total size before shrink in MB", String(tot)], ["Size of available shrink space in MB", String(max)]].forEach(function (kv) { dl.appendChild(el("dt", null, kv[0])); dl.appendChild(el("dd", null, kv[1])); }); box.appendChild(dl);
      const l = el("label", null, "Enter the amount of space to shrink in MB"); const inp = el("input", "w-input"); inp.id = "shrink-mb-" + mm.id; l.setAttribute("for", inp.id); inp.setAttribute("inputmode", "numeric"); inp.setAttribute("autocomplete", "off"); box.appendChild(l); box.appendChild(inp);
      if (d.err) { const e = el("p", "dlg-err", d.err); e.setAttribute("role", "alert"); box.appendChild(e); }
      row.appendChild(btn("Shrink", "w-btn primary", function () { const before = ctx.before(); const r = INS.shrink(mm, d.i, inp.value.replace(/[, ]/g, "")); act({ type: "osinst", op: "shrink", mb: Number(inp.value.replace(/[, ]/g, "")), res: r, before: before }); if (!r.ok) { d.err = r.text; draw(); return; } dialog = { kind: "message", title: "Disk Management", text: r.text }; draw(); }, "Shrink C: by this amount"));
      row.appendChild(btn("Cancel", "w-btn", close));
    }
    if (d.kind === "restart-now") {
      box.appendChild(el("h3", "dlg-h", "Computer Name/Domain Changes")); box.appendChild(el("p", null, d.text));
      row.appendChild(btn("Restart now", "w-btn primary", function () { dialog = null; restart("rename"); }));
      row.appendChild(btn("Restart later", "w-btn", close));
    }
    if (d.kind === "restorepoint") {
      box.appendChild(el("h3", "dlg-h", "Create a restore point")); const lab = el("label", null, "Type a description to help you identify the restore point:"); const inp = el("input", "w-input"); inp.id = "rp-" + mm.id; lab.setAttribute("for", inp.id); inp.value = "After malware removal";
      box.appendChild(lab); box.appendChild(inp);
      row.appendChild(btn("Create", "w-btn primary", function () { const v = inp.value.trim(); askUAC("System Properties", function () { const before = ctx.before(); const r = MW.createPoint(MW.ready(mm), v); dialog = { kind: "message", title: "System Protection", text: r.text }; act({ type: "restore", op: "point", res: r, before: before }); draw(); }); }));
      row.appendChild(btn("Cancel", "w-btn", close));
    }
    if (d.kind === "doc") {
      box.appendChild(el("h3", "dlg-h", d.name + (d.ver ? " (" + d.ver + ")" : ""))); if (d.note) box.appendChild(el("p", null, d.note));
      const dl = el("dl", "doc-dl"); (d.doc.rows || [["Sheet", d.doc.sheet], ["What's in it", d.doc.what], ["Total spend", d.doc.total]]).concat([["Last saved", d.doc.saved + " by " + d.doc.by]]).filter(function (kv) { return kv[1]; }).forEach(function (kv) { dl.appendChild(el("dt", null, kv[0])); dl.appendChild(el("dd", null, kv[1])); });
      box.appendChild(dl); row.appendChild(btn("Close", "w-btn primary", close));
    }
    if (d.kind === "pv-confirm") {
      box.appendChild(el("h3", "dlg-h", "Previous Versions")); box.appendChild(el("p", null, "Are you sure you want to restore this previous version of " + d.name + "?"));
      box.appendChild(el("p", null, "The version saved " + d.v.file.doc.saved + " will replace the current file. This can't be undone."));
      row.appendChild(btn("Restore", "w-btn primary", function () { const before = ctx.before(); const r = BK.restoreVersion(mm, d.path, d.v.id); dialog = { kind: "message", title: "Previous Versions", text: r.text }; act({ type: "pv-restore", path: d.path, id: d.v.id, res: r, before: before }); draw(); }));
      row.appendChild(btn("Cancel", "w-btn", close));
    }
    if (d.kind === "restore-to") {
      box.appendChild(el("h3", "dlg-h", "Restore to")); box.appendChild(el("p", null, "Choose a folder to put the copy of " + d.name + " in. The file where it is now is left as it is."));
      const ul = el("ul", "sr-list"); ["Desktop", "Documents", "Downloads"].forEach(function (f) { const full = "C:\\Users\\" + mm.user + "\\" + f; const li = el("li"); li.appendChild(btn(f + " (" + full + ")", "w-btn", function () { dialog = null; d.go(full); }, "Restore a copy to " + f)); ul.appendChild(li); }); box.appendChild(ul);
      row.appendChild(btn("Cancel", "w-btn", close));
    }
    if (d.kind === "replace") {
      box.appendChild(el("h3", "dlg-h", "Replace or Skip Files")); box.appendChild(el("p", null, "The destination already has a file named " + d.name + "."));
      box.appendChild(el("p", null, "Replace it with the copy saved " + d.saved + "? The file there now will be overwritten."));
      row.appendChild(btn("Replace the file in the destination", "w-btn primary", function () { dialog = null; d.go(); }));
      row.appendChild(btn("Skip this file", "w-btn", close));
    }
    if (d.kind === "sysrestore") {
      box.appendChild(el("h3", "dlg-h", "System Restore")); box.appendChild(el("p", null, "Restore your computer to the state it was in before the selected event. System Restore changes Windows' system files, settings and programs."));
      const ul = el("ul", "sr-list"); mm.restore.points.slice().reverse().forEach(function (p) { const i = mm.restore.points.indexOf(p); const li = el("li"); const b = btn(p.date + " · " + p.name, "w-btn" + (d.sel === i ? " primary" : ""), function () { d.sel = i; draw(); }, "Restore point: " + p.date + ", " + p.name); b.setAttribute("aria-pressed", String(d.sel === i)); li.appendChild(b); ul.appendChild(li); }); box.appendChild(ul);
      const fin = btn("Finish", "w-btn primary", function () { askUAC("System Restore", function () { const before = ctx.before(); const r = BK.systemRestore(mm, d.sel); act({ type: "sys-restore", res: r, before: before }); restart("system-restore"); bootNote = r.text; draw(); }); }); fin.disabled = d.sel == null; row.appendChild(fin);
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
