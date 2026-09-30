/* =====================================================================
   The Windows 11 desktop on the customer's monitor.

   REAL HTML, NOT A PICTURE IN THE 3D SCENE. These students have damaged
   sight: text painted onto a WebGL surface cannot be measured for
   contrast, does not reach the dyslexia toggle, and blurs when zoomed.
   Every window here is ordinary markup, keyboard-reachable, in Windows'
   own neutral colours with royal blue for selection.

   The desktop owns no state of its own that matters. Everything it
   shows is read from the machine (machine.js) each time it draws, and
   everything the student does is reported to the runner through
   `ctx.onAct`, which decides what it means for the job.
   ===================================================================== */
import * as M from "./machine.js";
import { createShell, LAUNCH } from "./cmd.js";
import { explain } from "./mech.js";

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function btn(label, cls, fn, aria) {
  const b = el("button", cls || "w-btn", label);
  b.type = "button";
  if (aria) b.setAttribute("aria-label", aria);
  b.addEventListener("click", fn);
  return b;
}

const APP_NAME = {
  cmd: "Command Prompt", ps: "Windows PowerShell", taskmgr: "Task Manager", diskmgmt: "Disk Management",
  eventvwr: "Event Viewer", winver: "About Windows", taskschd: "Task Scheduler", devmgmt: "Device Manager",
  certmgr: "Certificates", lusrmgr: "Local Users and Groups", perfmon: "Performance Monitor", gpedit: "Local Group Policy Editor",
  msinfo32: "System Information", resmon: "Resource Monitor", msconfig: "System Configuration", cleanmgr: "Disk Cleanup",
  dfrgui: "Optimize Drives", regedit: "Registry Editor", services: "Services", compmgmt: "Computer Management", notepad: "Notepad"
};
/* Tools that always run elevated, and so always meet User Account
   Control on the way in. */
const ALWAYS_ELEVATED = { taskmgr: false, diskmgmt: true };

export function createDesktop(host, ctx) {
  let wins = [];              /* { id, app, elevated, shell?, lines?, sel?, sort?, dmSel? } */
  let active = null;
  let start = false;
  let run = null;             /* the Run dialog */
  let dialog = null;          /* a modal on the screen: uac, confirm, message, wizard */
  let wid = 1;
  let bootLines = null;

  const root = el("div", "screen-wrap");
  const screen = el("div", "screen");
  screen.setAttribute("role", "region");
  screen.setAttribute("aria-label", "The customer's screen");
  const keys = el("div", "screen-keys");
  root.appendChild(screen);
  root.appendChild(keys);
  host.appendChild(root);

  function m() { return ctx.m(); }
  function has(app) { return (ctx.apps || []).indexOf(app) >= 0; }

  /* ------------------------------------------------------------ open */
  function openApp(app, wantElevated, from) {
    start = false; run = null;
    if (!has(app) && app !== "winver") {
      dialog = { kind: "message", title: APP_NAME[app] || app,
        text: (APP_NAME[app] || app) + " is not part of this job. This PC opens " +
          (ctx.apps || []).map(function (a) { return APP_NAME[a]; }).join(", ") + "." };
      draw(); return;
    }
    if (app === "winver") { dialog = { kind: "winver" }; draw(); return; }
    const needsUAC = wantElevated || ALWAYS_ELEVATED[app];
    if (app === "taskmgr") {
      /* Task Manager elevates itself for an administrator without asking;
         for a standard user it simply runs at their level. */
      return spawn(app, m().userIsAdmin);
    }
    if (needsUAC && !(from && from.elevated)) {
      askUAC(app, function (ok, asWho) { if (ok) spawn(app, true, asWho); else draw(); });
      return;
    }
    spawn(app, !!needsUAC || !!(from && from.elevated), from && from.elevatedAs);
  }

  function spawn(app, elevated, asWho) {
    const w = { id: wid++, app: app, elevated: !!elevated };
    if (app === "cmd" || app === "ps") {
      w.shell = createShell(m(), { elevated: elevated });
      if (asWho) w.shell.elevatedAs = asWho;
      if (app === "ps") { w.shell.mode = "ps"; w.lines = [{ t: "Windows PowerShell\nCopyright (C) Microsoft Corporation. All rights reserved.\n" }]; }
      else w.lines = [{ t: w.shell.banner() + "\n" }];
    }
    if (app === "taskmgr") { w.sort = { col: "name", dir: 1 }; w.sel = null; }
    if (app === "diskmgmt") {
      w.dmSel = null;
      const spare = m().disks.filter(function (d) { return d.spare && !d.style && !d.offline && !m().hw.spare.offline; })[0];
      if (spare) dialog = { kind: "init", disk: spare.n, style: null };
    }
    wins.push(w); active = w.id;
    if (elevated && (app === "cmd" || app === "ps")) ctx.onAct({ type: "elevated", app: app });
    ctx.onAct({ type: "open", app: app, elevated: !!elevated });
    draw();
    if (w.shell) focusConsole(w.id);
  }

  function askUAC(app, cb) {
    const mm = m();
    if (mm.userIsAdmin) dialog = { kind: "uac", app: app, cb: cb };
    else dialog = { kind: "uac-creds", app: app, cb: cb, err: "" };
    draw();
  }

  function closeWin(id) {
    wins = wins.filter(function (w) { return w.id !== id; });
    if (active === id) active = wins.length ? wins[wins.length - 1].id : null;
    draw();
  }

  /* --------------------------------------------------------- power */
  function restart(reason) {
    const mm = m();
    M.shutdown(mm);
    wins = []; active = null; dialog = null; start = false; run = null;
    const r = M.boot(mm);
    bootLines = r.say;
    ctx.onAct({ type: "power", op: "restart", res: r, reason: reason });
    draw();
  }
  function powerOff() {
    const mm = m();
    M.shutdown(mm);
    wins = []; active = null; dialog = null; start = false; run = null; bootLines = null;
    ctx.onAct({ type: "power", op: "off" });
    draw();
  }

  /* ---------------------------------------------------------- draw */
  function draw() {
    const mm = m();
    const keepFocus = document.activeElement && document.activeElement.classList.contains("con-in")
      ? document.activeElement.dataset.win : null;
    screen.innerHTML = "";
    keys.innerHTML = "";
    screen.className = "screen";

    if (mm.power !== "on") {
      screen.classList.add("off");
      screen.appendChild(el("p", "screen-off", mm.hw && !mm.hw.mains
        ? "The screen is dark. The PC is unplugged."
        : "The screen is dark. The PC is switched off — its power button is on the front of the tower, on the desk."));
      return;
    }
    if (mm.crashed) {
      screen.classList.add("bsod");
      const b = el("div", "bsod-body");
      b.appendChild(el("p", "bsod-face", ":("));
      b.appendChild(el("p", null, "Your device ran into a problem and needs to restart. We’re just collecting some error info, and then we’ll restart for you."));
      b.appendChild(el("p", null, "100% complete"));
      b.appendChild(el("p", "bsod-code", "Stop code: " + mm.crashed));
      b.appendChild(btn("Let it restart", "w-btn bsod-btn", function () { restart("crash"); }));
      screen.appendChild(b);
      return;
    }

    const desk = el("div", "desk-area" + (mm.shellGone ? " no-shell" : ""));
    if (bootLines) {
      const bl = el("div", "boot-note");
      bl.setAttribute("role", "status");
      bl.appendChild(el("span", null, "Restarted. " + bootLines));
      bl.appendChild(btn("Dismiss", "w-btn small", function () { bootLines = null; draw(); }));
      desk.appendChild(bl);
    }
    if (mm.shellGone) desk.appendChild(el("p", "noshell-note", "No taskbar, no Start menu, no desktop: Windows Explorer is not running. Windows itself still is."));

    wins.forEach(function (w) { desk.appendChild(drawWin(w)); });
    screen.appendChild(desk);
    if (start && !mm.shellGone) screen.appendChild(drawStart());
    if (run) screen.appendChild(drawRun());
    if (!mm.shellGone) screen.appendChild(drawTaskbar());
    if (dialog) screen.appendChild(drawDialog());

    /* The keyboard, as buttons. Shortcuts are how a technician gets back
       from a PC with no taskbar, so they are always here. */
    keys.appendChild(el("span", "keys-label", "Keyboard:"));
    keys.appendChild(btn("Ctrl + Shift + Esc", "key-btn", function () { openApp("taskmgr"); }, "Press Ctrl, Shift and Escape: opens Task Manager"));
    keys.appendChild(btn("Windows + R", "key-btn", function () { if (m().shellGone) { run = null; dialog = { kind: "message", title: "Nothing happens", text: "Windows + R is handled by Explorer. With Explorer not running, nothing answers it. Task Manager can still start programs: File → Run new task." }; draw(); return; } start = false; run = { text: "", admin: false }; draw(); }, "Press Windows and R: opens the Run box"));

    if (keepFocus) focusConsole(+keepFocus);
  }

  function drawTaskbar() {
    const tb = el("div", "taskbar");
    const s = btn("Start", "tb-start", function () { start = !start; run = null; draw(); }, "Start menu");
    s.setAttribute("aria-expanded", String(start));
    tb.appendChild(s);
    wins.forEach(function (w) {
      const b = btn(winTitle(w), "tb-app" + (w.id === active ? " on" : ""), function () { active = w.id; draw(); if (w.shell) focusConsole(w.id); });
      b.setAttribute("aria-pressed", String(w.id === active));
      tb.appendChild(b);
    });
    tb.appendChild(el("span", "tb-clock", "09:42"));
    return tb;
  }

  function drawStart() {
    const sm = el("div", "startmenu");
    sm.setAttribute("role", "dialog");
    sm.setAttribute("aria-label", "Start menu");
    sm.appendChild(el("h3", "sm-h", "Start"));
    const list = el("ul", "sm-list");
    (ctx.apps || []).forEach(function (a) {
      const li = el("li", "sm-app");
      li.appendChild(el("span", "sm-name", APP_NAME[a]));
      const acts = el("span", "sm-acts");
      acts.appendChild(btn("Open", "w-btn", function () { openApp(a, false); }, "Open " + APP_NAME[a]));
      if (a === "cmd" || a === "ps") acts.appendChild(btn("Run as administrator", "w-btn", function () { openApp(a, true); }, "Run " + APP_NAME[a] + " as administrator"));
      li.appendChild(acts);
      list.appendChild(li);
    });
    sm.appendChild(list);
    const foot = el("div", "sm-foot");
    foot.appendChild(el("span", "sm-user", "Signed in as " + m().user + (m().userIsAdmin ? "" : " (standard user)")));
    const pw = el("span", "sm-power");
    pw.appendChild(btn("Restart", "w-btn", function () { restart("start"); }));
    pw.appendChild(btn("Shut down", "w-btn", function () { powerOff(); }));
    foot.appendChild(pw);
    sm.appendChild(foot);
    return sm;
  }

  function drawRun() {
    const d = el("div", "w-dialog run");
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-label", "Run");
    d.appendChild(el("h3", "dlg-h", "Run"));
    d.appendChild(el("p", null, "Type the name of a program, folder, document or Internet resource, and Windows will open it for you."));
    const lab = el("label", null, "Open:");
    const inp = el("input", "w-input");
    inp.id = "run-in";
    lab.setAttribute("for", "run-in");
    inp.value = run.text;
    inp.addEventListener("input", function () { run.text = inp.value; });
    function go(asAdmin) {
      const v = inp.value.trim().toLowerCase();
      run = null;
      if (v === "cmd" || v === "cmd.exe") return openApp("cmd", asAdmin);
      if (v === "powershell" || v === "powershell.exe") return openApp("ps", asAdmin);
      if (LAUNCH[v]) return openApp(LAUNCH[v], asAdmin);
      if (v === "winver") return openApp("winver");
      dialog = { kind: "message", title: v, text: "Windows cannot find '" + v + "'. Make sure you typed the name correctly, and then try again." };
      draw();
    }
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); go(e.ctrlKey && e.shiftKey); } });
    d.appendChild(lab); d.appendChild(inp);
    const row = el("div", "dlg-row");
    row.appendChild(btn("OK", "w-btn primary", function () { go(false); }));
    row.appendChild(btn("OK as administrator (Ctrl+Shift+Enter)", "w-btn", function () { go(true); }));
    row.appendChild(btn("Cancel", "w-btn", function () { run = null; draw(); }));
    d.appendChild(row);
    setTimeout(function () { inp.focus(); }, 0);
    return d;
  }

  function winTitle(w) {
    if (w.shell) return w.shell.title();
    return (w.elevated && w.app === "diskmgmt" ? "" : "") + APP_NAME[w.app];
  }

  function drawWin(w) {
    const box = el("section", "win" + (w.id === active ? " active" : ""));
    box.setAttribute("aria-label", winTitle(w));
    const bar = el("div", "win-bar");
    bar.appendChild(el("h3", "win-title", winTitle(w)));
    bar.appendChild(btn("Close", "w-btn small", function () { closeWin(w.id); }, "Close " + winTitle(w)));
    box.appendChild(bar);
    box.addEventListener("mousedown", function () { if (active !== w.id) { active = w.id; } });
    if (w.shell) box.appendChild(drawConsole(w));
    if (w.app === "taskmgr") box.appendChild(drawTaskMgr(w));
    if (w.app === "diskmgmt") box.appendChild(drawDiskMgmt(w));
    return box;
  }

  /* ------------------------------------------------------- console */
  function drawConsole(w) {
    const wrap = el("div", "con");
    const out = el("pre", "con-out");
    out.setAttribute("aria-label", "Output");
    w.lines.forEach(function (l) {
      const s = el("span", l.cmd ? "con-cmd" : null, l.t);
      out.appendChild(s);
    });
    wrap.appendChild(out);
    const row = el("div", "con-row");
    const p = el("label", "con-prompt", w.shell.prompt());
    const inp = el("input", "con-in");
    inp.id = "con-in-" + w.id;
    inp.dataset.win = String(w.id);
    inp.setAttribute("autocomplete", "off");
    inp.setAttribute("spellcheck", "false");
    inp.setAttribute("autocapitalize", "off");
    p.setAttribute("for", inp.id);
    inp.setAttribute("aria-label", "Type a command. The prompt is " + (w.shell.prompt() || "a Y or N question"));
    let hi = w.shell.history.length;
    inp.addEventListener("keydown", function (e) {
      if (e.key === "ArrowUp") { if (hi > 0) { hi--; inp.value = w.shell.history[hi] || ""; } e.preventDefault(); }
      if (e.key === "ArrowDown") { if (hi < w.shell.history.length) { hi++; inp.value = w.shell.history[hi] || ""; } e.preventDefault(); }
      if (e.key === "Enter") { e.preventDefault(); submit(w, inp.value); }
    });
    row.appendChild(p); row.appendChild(inp);
    wrap.appendChild(row);
    if (w.why) {
      const why = el("p", "con-why");
      why.setAttribute("role", "status");
      why.appendChild(el("strong", null, "What just happened: "));
      why.appendChild(document.createTextNode(w.why));
      wrap.appendChild(why);
    }
    setTimeout(function () { out.scrollTop = out.scrollHeight; }, 0);
    return wrap;
  }

  function submit(w, line) {
    const sh = w.shell;
    const shown = sh.prompt();
    const before = M.clone(m().sys);
    const res = sh.run(line);
    w.lines.push({ t: shown + line + "\n", cmd: true });
    if (res.clear) w.lines = [];
    else if (res.out) w.lines.push({ t: res.out + "\n\n" });
    if (w.lines.length > 400) w.lines = w.lines.slice(-400);
    w.why = explain(line, res, sh, m());
    ctx.onAct({ type: "cmd", line: line, res: res, sh: sh, before: before });
    if (res.close) { closeWin(w.id); return; }
    if (res.power === "restart") { restart("cmd"); return; }
    if (res.power === "off") { powerOff(); return; }
    if (res.open) { openApp(res.open === "winver" ? "winver" : res.open, false, sh); return; }
    draw();
    focusConsole(w.id);
  }

  function focusConsole(id) {
    setTimeout(function () {
      const i = screen.querySelector('.con-in[data-win="' + id + '"]');
      if (i) i.focus({ preventScroll: true });
    }, 0);
  }

  /* --------------------------------------------------- Task Manager */
  function drawTaskMgr(w) {
    const mm = m();
    const wrap = el("div", "tm");
    const t = M.totals(mm);
    const tools = el("div", "tm-tools");
    tools.appendChild(el("h4", "tm-h", "Processes"));
    tools.appendChild(btn("Run new task", "w-btn", function () { dialog = { kind: "newtask", text: "", admin: false }; draw(); }));
    const sel = mm.procs.filter(function (p) { return p.pid === w.sel; })[0];
    const endB = btn("End task", "w-btn", function () { endTask(w, sel); });
    endB.disabled = !sel;
    tools.appendChild(endB);
    wrap.appendChild(tools);
    if (w.flash) {
      const f = el("p", "tm-flash", w.flash);
      f.setAttribute("role", "status");
      wrap.appendChild(f);
    }

    const list = mm.procs.slice();
    const col = w.sort.col, dir = w.sort.dir;
    list.sort(function (a, b) {
      if (col === "name") return dir * (a.desc || a.name).localeCompare(b.desc || b.name);
      return dir * ((a[col] || 0) - (b[col] || 0));
    });
    const scroll = el("div", "tm-scroll");
    const tbl = el("table", "tm-table");
    const thead = el("thead"); const hr = el("tr");
    [["name", "Name"], ["status", "Status"], ["cpu", t.cpu + "% CPU"], ["mem", t.memPct + "% Memory"], ["disk", t.diskPct + "% Disk"]].forEach(function (c) {
      const th = el("th");
      th.setAttribute("scope", "col");
      if (c[0] !== "status") {
        const sorted = col === c[0];
        th.setAttribute("aria-sort", sorted ? (dir < 0 ? "descending" : "ascending") : "none");
        th.appendChild(btn(c[1] + (sorted ? (dir < 0 ? " ▼" : " ▲") : ""), "th-btn", function () {
          if (w.sort.col === c[0]) w.sort.dir = -w.sort.dir;
          else { w.sort.col = c[0]; w.sort.dir = c[0] === "name" ? 1 : -1; }
          ctx.onAct({ type: "tm-sort", col: w.sort.col, dir: w.sort.dir });
          draw();
        }, "Sort by " + c[1]));
      } else th.textContent = c[1];
      hr.appendChild(th);
    });
    thead.appendChild(hr); tbl.appendChild(thead);
    const tb = el("tbody");
    const ruled = ctx.ruledOut ? ctx.ruledOut() : {};
    list.forEach(function (p) {
      const tr = el("tr", "tm-row" + (p.pid === w.sel ? " sel" : "") + (ruled[p.pid] ? " ruled" : ""));
      tr.tabIndex = 0;
      tr.setAttribute("aria-selected", String(p.pid === w.sel));
      const nameTd = el("td", "tm-name");
      nameTd.appendChild(el("span", null, (p.desc || p.name) + (p.desc && p.desc !== p.name ? "" : "")));
      if (ruled[p.pid]) {
        const r = el("span", "ruled-tag", "✕ Ruled out: " + ruled[p.pid]);
        nameTd.appendChild(r);
      }
      tr.appendChild(nameTd);
      tr.appendChild(el("td", "tm-status", p.responding === false ? "Not responding" : ""));
      [["cpu", p.cpu.toFixed(1) + "%"], ["mem", p.mem.toLocaleString("en-GB") + " MB"], ["disk", (p.disk || 0).toFixed(1) + " MB/s"]].forEach(function (c) {
        const v = p[c[0]] || 0;
        const heat = c[0] === "cpu" ? v / 40 : c[0] === "mem" ? v / 2400 : v / 40;
        tr.appendChild(el("td", "tm-num heat-" + Math.min(3, Math.floor(heat * 4)), c[1]));
      });
      function pick() { w.sel = p.pid; ctx.onAct({ type: "tm-select", pid: p.pid, tag: p.tag }); draw(); }
      tr.addEventListener("click", pick);
      tr.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    scroll.appendChild(tbl);
    wrap.appendChild(scroll);

    const info = el("div", "tm-info");
    if (sel) {
      info.appendChild(el("h4", null, "What is this process?"));
      const dl = el("dl");
      [["Name", sel.name], ["Description", sel.desc], ["Runs from", sel.image || "(the kernel)"],
       ["Publisher", sel.publisher || "(none — not signed)"], ["Started by", sel.parent || "(none)"],
       ["Running as", sel.user], ["Services inside it", sel.hosts || "—"]].forEach(function (kv) {
        dl.appendChild(el("dt", null, kv[0])); dl.appendChild(el("dd", null, kv[1]));
      });
      info.appendChild(dl);
    } else info.appendChild(el("p", null, "Select a row to see where it runs from, who published it, and what started it."));
    wrap.appendChild(info);

    /* The lab's own control, kept visibly apart from Windows. */
    if (ctx.canBlame && ctx.canBlame()) {
      const lab = el("div", "lab-strip");
      lab.appendChild(el("span", "lab-strip-tag", "Lab action"));
      const b = btn("This is the cause", "btn", function () { if (sel) ctx.onAct({ type: "tm-blame", pid: sel.pid, tag: sel.tag || null, proc: sel }); draw(); });
      b.disabled = !sel;
      lab.appendChild(b);
      lab.appendChild(el("span", "lab-strip-note", sel ? "Selected: " + (sel.desc || sel.name) : "Select a row first."));
      wrap.appendChild(lab);
    }
    return wrap;
  }

  function endTask(w, p) {
    if (!p) return;
    const mm = m();
    const r = M.endProcess(mm, p.pid);
    if (r.effect === "confirm-critical") {
      dialog = { kind: "confirm-critical", proc: p, text: r.say };
      draw(); return;
    }
    if (r.effect === "denied") { dialog = { kind: "message", title: "Unable to end task", text: r.say }; }
    else w.flash = r.say || null;
    ctx.onAct({ type: "tm-end", pid: p.pid, tag: p.tag || null, name: p.name, res: r });
    w.sel = null;
    draw();
  }

  /* ------------------------------------------------ Disk Management */
  function drawDiskMgmt(w) {
    const mm = m();
    const wrap = el("div", "dm");
    /* the volume list */
    const vt = el("table", "dm-vols");
    const h = el("tr");
    ["Volume", "Layout", "Type", "File System", "Status", "Capacity"].forEach(function (c) { const th = el("th", null, c); th.setAttribute("scope", "col"); h.appendChild(th); });
    const th0 = el("thead"); th0.appendChild(h); vt.appendChild(th0);
    const tb = el("tbody");
    mm.disks.forEach(function (d) {
      d.parts.forEach(function (p) {
        if (p.kind === "unalloc" || p.kind === "unreach") return;
        const tr = el("tr");
        [(p.letter ? "(" + p.letter + ":)" : "") + (p.label ? " " + p.label : "") || "(Disk " + d.n + " partition)", "Simple", "Basic", p.fs, p.health || "Healthy", M.fmtSize(p.bytes)].forEach(function (c) { tr.appendChild(el("td", null, c)); });
        tb.appendChild(tr);
      });
    });
    vt.appendChild(tb);
    const vwrap = el("div", "dm-volwrap"); vwrap.appendChild(vt); wrap.appendChild(vwrap);

    /* the graphical view */
    const g = el("div", "dm-graph");
    mm.disks.forEach(function (d) {
      const row = el("div", "dm-row");
      const offline = d.spare && mm.hw.spare && mm.hw.spare.offline;
      const lab = btn("", "dm-label" + (w.dmSel && w.dmSel.disk === d.n && w.dmSel.part == null ? " sel" : ""), function () { w.dmSel = { disk: d.n, part: null }; draw(); });
      [["Disk " + d.n, true], [d.style ? "Basic" : "Unknown"], [M.fmtSize(d.bytes)], [offline ? "Offline" : (d.style ? "Online" : "Not Initialized")]].forEach(function (x) {
        const s = el(x[1] ? "strong" : "span", null, x[0]); lab.appendChild(s);
      });
      if (offline) lab.appendChild(el("span", "dm-offnote", "The disk is offline because of policy set by an administrator."));
      lab.setAttribute("aria-label", "Disk " + d.n + ", " + (d.style || "not initialized") + ", " + M.fmtSize(d.bytes) + (offline ? ", offline" : ""));
      row.appendChild(lab);
      const parts = el("div", "dm-parts");
      d.parts.forEach(function (p, i) {
        const share = Math.max(0.08, p.bytes / d.bytes);
        const isSel = w.dmSel && w.dmSel.disk === d.n && w.dmSel.part === i;
        const b = btn("", "dm-part k-" + p.kind + (isSel ? " sel" : ""), function () { w.dmSel = { disk: d.n, part: i }; draw(); });
        b.style.flexGrow = String(share * 100);
        const top = el("span", "dm-part-top"); b.appendChild(top);
        if (p.kind === "unalloc") { b.appendChild(el("strong", null, M.fmtSize(p.bytes))); b.appendChild(el("span", null, "Unallocated")); }
        else if (p.kind === "unreach") { b.appendChild(el("strong", null, M.fmtSize(p.bytes))); b.appendChild(el("span", null, "Unallocated — beyond MBR’s reach")); }
        else {
          b.appendChild(el("strong", null, (p.letter ? "(" + p.letter + ":) " : "") + (p.label || { efi: "EFI System", recovery: "Recovery" }[p.kind] || "")));
          b.appendChild(el("span", null, M.fmtSize(p.bytes) + " " + p.fs));
          b.appendChild(el("span", null, p.health));
        }
        b.setAttribute("aria-pressed", String(!!isSel));
        parts.appendChild(b);
      });
      row.appendChild(parts);
      g.appendChild(row);
    });
    wrap.appendChild(g);

    /* actions for what is selected — the right-click menu, as buttons */
    const acts = el("div", "dm-acts");
    acts.appendChild(el("span", "dm-acts-h", "Actions:"));
    const S = w.dmSel;
    const d = S ? M.disk(mm, S.disk) : null;
    function act(label, fn, on) { const b = btn(label, "w-btn", fn); b.disabled = !on; acts.appendChild(b); }
    if (!d) acts.appendChild(el("span", null, "Select a disk or a block of space to see what can be done to it."));
    else if (S.part == null) {
      const offline = d.spare && mm.hw.spare && mm.hw.spare.offline;
      const empty = !d.parts.some(function (p) { return p.kind !== "unalloc" && p.kind !== "unreach"; });
      act("Online", function () { mm.hw.spare.offline = false; M.note(mm, "online", { n: d.n }); ctx.onAct({ type: "dm", op: "online", res: { ok: true } }); if (!d.style) dialog = { kind: "init", disk: d.n, style: null }; draw(); }, !!offline);
      act("Initialize Disk", function () { dialog = { kind: "init", disk: d.n, style: null }; draw(); }, !offline && !d.style);
      act("Convert to GPT Disk", function () { dmOp("convert", M.convertDisk(mm, d.n, "GPT"), { style: "GPT" }); }, !offline && d.style === "MBR" && empty && !d.system);
      act("Convert to MBR Disk", function () { dmOp("convert", M.convertDisk(mm, d.n, "MBR"), { style: "MBR" }); }, !offline && d.style === "GPT" && empty && !d.system);
    } else {
      const p = d.parts[S.part];
      if (!p) { w.dmSel = null; }
      else if (p.kind === "unalloc") act("New Simple Volume…", function () { dialog = { kind: "wizard", disk: d.n, part: S.part, max: p.bytes }; draw(); }, !!d.style);
      else if (p.kind === "unreach") acts.appendChild(el("span", null, "Nothing can be created here. An MBR disk cannot address space past 2048 GB."));
      else if (p.kind === "data") {
        act("Delete Volume…", function () { dialog = { kind: "delete", disk: d.n, part: S.part }; draw(); }, true);
        act("Change Drive Letter and Paths…", function () { dialog = { kind: "letter", disk: d.n, part: S.part }; draw(); }, true);
      } else acts.appendChild(el("span", null, "Windows needs this partition. There is nothing to do to it here."));
    }
    wrap.appendChild(acts);
    return wrap;
  }

  function dmOp(op, res, extra) {
    const mm = m();
    if (!res.ok) dialog = { kind: "message", title: "Virtual Disk Manager", text: res.say };
    ctx.onAct(Object.assign({ type: "dm", op: op, res: res }, extra || {}));
    draw();
  }

  function freeLetters() {
    const used = M.usedLetters(m());
    return "EFGHIJKLMNOPQRSTUVWXYZ".split("").filter(function (L) { return used.indexOf(L) < 0; });
  }

  /* -------------------------------------------------------- dialogs */
  function drawDialog() {
    const d = dialog;
    const mm = m();
    const box = el("div", "w-dialog " + d.kind);
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    const row = el("div", "dlg-row");
    function close() { dialog = null; draw(); }

    if (d.kind === "message") {
      box.appendChild(el("h3", "dlg-h", d.title));
      box.appendChild(el("p", null, d.text));
      row.appendChild(btn("OK", "w-btn primary", close));
    }
    if (d.kind === "winver") {
      box.appendChild(el("h3", "dlg-h", "About Windows"));
      box.appendChild(el("p", null, "Microsoft Windows"));
      box.appendChild(el("p", null, "Version " + mm.version + " (OS Build " + mm.build.split(".").slice(2).join(".") + ")"));
      box.appendChild(el("p", null, mm.edition));
      row.appendChild(btn("OK", "w-btn primary", close));
    }
    if (d.kind === "uac") {
      box.appendChild(el("h3", "dlg-h", "User Account Control"));
      box.appendChild(el("p", "uac-q", "Do you want to allow this app to make changes to your device?"));
      box.appendChild(el("p", null, (d.app === "diskmgmt" ? "Microsoft Management Console" : d.app === "ps" ? "Windows PowerShell" : "Windows Command Processor") + " — Verified publisher: Microsoft Windows"));
      row.appendChild(btn("Yes", "w-btn primary", function () { dialog = null; ctx.onAct({ type: "uac", ok: true }); d.cb(true); }));
      row.appendChild(btn("No", "w-btn", function () { dialog = null; ctx.onAct({ type: "uac", ok: false }); d.cb(false); }));
    }
    if (d.kind === "uac-creds") {
      box.appendChild(el("h3", "dlg-h", "User Account Control"));
      box.appendChild(el("p", "uac-q", "Do you want to allow this app to make changes to your device?"));
      box.appendChild(el("p", null, "To continue, enter an admin user name and password."));
      const u = el("input", "w-input"); u.id = "uac-u"; const lu = el("label", null, "User name"); lu.setAttribute("for", "uac-u");
      const p = el("input", "w-input"); p.id = "uac-p"; p.type = "password"; const lp = el("label", null, "Password"); lp.setAttribute("for", "uac-p");
      box.appendChild(lu); box.appendChild(u); box.appendChild(lp); box.appendChild(p);
      if (d.err) { const e = el("p", "dlg-err", d.err); e.setAttribute("role", "alert"); box.appendChild(e); }
      function tryIt() {
        const name = u.value.trim().replace(/^\.\\/, "").replace(/^[^\\]+\\/, "").toLowerCase();
        if (name === mm.techAccount.name.toLowerCase() && p.value === mm.techAccount.password) {
          dialog = null; ctx.onAct({ type: "uac", ok: true, creds: true }); d.cb(true, mm.techAccount.name);
        } else {
          d.err = "The user name or password is incorrect.";
          ctx.onAct({ type: "uac", ok: false, creds: true });
          draw();
        }
      }
      p.addEventListener("keydown", function (e) { if (e.key === "Enter") tryIt(); });
      row.appendChild(btn("Yes", "w-btn primary", tryIt));
      row.appendChild(btn("No", "w-btn", function () { dialog = null; d.cb(false); }));
      setTimeout(function () { u.focus(); }, 0);
    }
    if (d.kind === "confirm-critical") {
      box.appendChild(el("h3", "dlg-h", "Task Manager"));
      box.appendChild(el("p", null, d.text));
      row.appendChild(btn("Shut down", "w-btn", function () {
        dialog = null;
        const r = M.endProcess(mm, d.proc.pid, "confirmed");
        ctx.onAct({ type: "tm-end", pid: d.proc.pid, tag: d.proc.tag || null, name: d.proc.name, res: r });
        draw();
      }));
      row.appendChild(btn("Cancel", "w-btn primary", close));
    }
    if (d.kind === "newtask") {
      box.appendChild(el("h3", "dlg-h", "Create new task"));
      box.appendChild(el("p", null, "Type the name of a program, folder, document, or Internet resource, and Windows will open it for you."));
      const lab = el("label", null, "Open:"); const inp = el("input", "w-input"); inp.id = "nt-in"; lab.setAttribute("for", "nt-in");
      const cb = el("input"); cb.type = "checkbox"; cb.id = "nt-admin";
      const cl = el("label", null, "Create this task with administrative privileges."); cl.setAttribute("for", "nt-admin");
      box.appendChild(lab); box.appendChild(inp);
      const cr = el("div", "chk-row"); cr.appendChild(cb); cr.appendChild(cl); box.appendChild(cr);
      function go() {
        const v = inp.value.trim().toLowerCase();
        dialog = null;
        if (v === "explorer" || v === "explorer.exe") { M.startShell(mm); ctx.onAct({ type: "shell-back" }); draw(); return; }
        if (v === "cmd" || v === "cmd.exe") return cb.checked && mm.userIsAdmin ? spawn("cmd", true) : openApp("cmd", cb.checked);
        if (v === "powershell" || v === "powershell.exe") return cb.checked && mm.userIsAdmin ? spawn("ps", true) : openApp("ps", cb.checked);
        if (LAUNCH[v]) return openApp(LAUNCH[v], cb.checked);
        dialog = { kind: "message", title: "Create new task", text: "Windows cannot find '" + v + "'. Make sure you typed the name correctly, and then try again." };
        draw();
      }
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
      row.appendChild(btn("OK", "w-btn primary", go));
      row.appendChild(btn("Cancel", "w-btn", close));
      setTimeout(function () { inp.focus(); }, 0);
    }
    if (d.kind === "init") {
      box.appendChild(el("h3", "dlg-h", "Initialize Disk"));
      box.appendChild(el("p", null, "You must initialize a disk before Logical Disk Manager can access it."));
      box.appendChild(el("p", null, "Select disks: Disk " + d.disk));
      box.appendChild(el("p", null, "Use the following partition style for the selected disks:"));
      const fs = el("fieldset", "radio-set");
      fs.appendChild(el("legend", null, "Partition style"));
      ["MBR", "GPT"].forEach(function (s) {
        const r = el("input"); r.type = "radio"; r.name = "ps"; r.id = "ps-" + s; r.checked = d.style === s;
        r.addEventListener("change", function () { d.style = s; ok.disabled = false; });
        const l = el("label", null, s === "MBR" ? "MBR (Master Boot Record)" : "GPT (GUID Partition Table)"); l.setAttribute("for", r.id);
        const w2 = el("div", "radio-row"); w2.appendChild(r); w2.appendChild(l); fs.appendChild(w2);
      });
      box.appendChild(fs);
      box.appendChild(el("p", "dlg-note", "Windows pre-selects GPT. This lab clears it, so the choice is yours."));
      const ok = btn("OK", "w-btn primary", function () {
        const r = M.initDisk(mm, d.disk, d.style);
        dialog = null; dmOp("init", r, { style: d.style });
      });
      ok.disabled = !d.style;
      row.appendChild(ok);
      row.appendChild(btn("Cancel", "w-btn", close));
    }
    if (d.kind === "wizard") {
      box.appendChild(el("h3", "dlg-h", "New Simple Volume Wizard"));
      const maxMB = Math.floor(d.max / 1048576);
      const f = el("div", "wiz");
      const sz = el("input", "w-input"); sz.id = "wz-size"; sz.type = "text"; sz.inputMode = "numeric"; sz.value = String(maxMB);
      const lsz = el("label", null, "Simple volume size in MB (maximum " + maxMB.toLocaleString("en-GB") + "):"); lsz.setAttribute("for", "wz-size");
      const let_ = el("select", "w-input"); let_.id = "wz-letter";
      freeLetters().forEach(function (L) { const o = el("option", null, L); o.value = L; let_.appendChild(o); });
      const llt = el("label", null, "Assign the following drive letter:"); llt.setAttribute("for", "wz-letter");
      const fsSel = el("select", "w-input"); fsSel.id = "wz-fs";
      function fsOptions() {
        const mb = parseInt(sz.value.replace(/[^\d]/g, ""), 10) || 0;
        const cur = fsSel.value;
        fsSel.innerHTML = "";
        ["NTFS", "exFAT"].concat(mb * 1048576 <= M.FAT32_FORMAT_LIMIT ? ["FAT32"] : []).forEach(function (x) { const o = el("option", null, x); o.value = x; fsSel.appendChild(o); });
        if (cur && Array.from(fsSel.options).some(function (o) { return o.value === cur; })) fsSel.value = cur;
      }
      fsOptions();
      sz.addEventListener("input", fsOptions);
      const lfs = el("label", null, "File system:"); lfs.setAttribute("for", "wz-fs");
      const lb = el("input", "w-input"); lb.id = "wz-label"; lb.value = "New Volume";
      const llb = el("label", null, "Volume label:"); llb.setAttribute("for", "wz-label");
      const q = el("input"); q.type = "checkbox"; q.id = "wz-quick"; q.checked = true;
      const lq = el("label", null, "Perform a quick format"); lq.setAttribute("for", "wz-quick");
      [lsz, sz, llt, let_, lfs, fsSel, llb, lb].forEach(function (x) { f.appendChild(x); });
      const qr = el("div", "chk-row"); qr.appendChild(q); qr.appendChild(lq); f.appendChild(qr);
      f.appendChild(el("p", "dlg-note", "FAT32 is only offered for volumes of 32 GB or less, as in Windows."));
      box.appendChild(f);
      const err = el("p", "dlg-err"); err.setAttribute("role", "alert"); box.appendChild(err);
      row.appendChild(btn("Finish", "w-btn primary", function () {
        const mb = parseInt(sz.value.replace(/[^\d]/g, ""), 10);
        if (!mb || mb < 8 || mb > maxMB) { err.textContent = "Enter a size between 8 and " + maxMB.toLocaleString("en-GB") + " MB."; return; }
        const bytes = mb === maxMB ? d.max : mb * 1048576;
        const r = M.newVolume(mm, d.disk, { size: bytes, fs: fsSel.value, letter: let_.value, label: lb.value });
        dialog = null; dmOp("volume", r, { fs: fsSel.value, letter: let_.value, bytes: bytes });
      }));
      row.appendChild(btn("Cancel", "w-btn", close));
    }
    if (d.kind === "delete") {
      box.appendChild(el("h3", "dlg-h", "Delete simple volume"));
      box.appendChild(el("p", null, "Deleting this volume will erase all data on it. Back up any data that you want to keep before deleting. Do you want to continue?"));
      row.appendChild(btn("Yes", "w-btn", function () { const r = M.deleteVolume(mm, d.disk, d.part); dialog = null; const w = wins.filter(function (x) { return x.app === "diskmgmt"; })[0]; if (w) w.dmSel = null; dmOp("delete", r); }));
      row.appendChild(btn("No", "w-btn primary", close));
    }
    if (d.kind === "letter") {
      const p = M.disk(mm, d.disk).parts[d.part];
      box.appendChild(el("h3", "dlg-h", "Change Drive Letter and Paths for " + (p.letter ? p.letter + ": " : "") + (p.label || "")));
      const s = el("select", "w-input"); s.id = "cl-sel";
      freeLetters().forEach(function (L) { const o = el("option", null, L); o.value = L; s.appendChild(o); });
      const l = el("label", null, "Assign the following drive letter:"); l.setAttribute("for", "cl-sel");
      box.appendChild(l); box.appendChild(s);
      row.appendChild(btn("OK", "w-btn primary", function () { p.letter = s.value; M.note(mm, "letter", { n: d.disk, letter: s.value }); dialog = null; dmOp("letter", { ok: true }, { letter: s.value }); }));
      row.appendChild(btn("Cancel", "w-btn", close));
    }
    box.appendChild(row);
    const veil = el("div", "w-veil");
    veil.appendChild(box);
    return veil;
  }

  draw();
  return {
    draw: draw,
    reset: function () { wins = []; active = null; start = false; run = null; dialog = null; bootLines = null; draw(); },
    open: openApp,
    windows: function () { return wins; }
  };
}
