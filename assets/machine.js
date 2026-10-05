/* =====================================================================
   A simulated Windows PC, one of the machines at Rafiki's IT Services.

   This is the "VM" the owner asked for, as close as a web page can get:
   a machine that stays on, keeps what is done to it, and answers every
   tool from its own state. Event Viewer shows an error because the error
   happened. A program fails to start because a file it needs is really
   not where Windows looks. Copying the wrong file makes it fail a
   different way. Nothing on screen is canned text that could disagree
   with something else on screen.

   PLAIN DATA ONLY. A machine is JSON: it is saved to the browser after
   every action and comes back exactly as it was, and the checks in
   verify/ run it under node with no page at all.
   ===================================================================== */

export const GiB = 1073741824;
export const FAT32_FORMAT_LIMIT = 32 * GiB;
export function clone(x) { return JSON.parse(JSON.stringify(x)); }

/* ------------------------------------------------------------------ */
/* Processes                                                           */
/* ------------------------------------------------------------------ */
export function baseProcesses(user) {
  const U = user;
  return [
    { pid: 4, name: "System", image: "", user: "SYSTEM", cpu: 0.3, mem: 1, disk: 0.1, desc: "NT Kernel & System", publisher: "Microsoft Windows", parent: "", critical: true },
    { pid: 380, name: "smss.exe", image: "C:\\Windows\\System32\\smss.exe", user: "SYSTEM", cpu: 0, mem: 1, disk: 0, desc: "Windows Session Manager", publisher: "Microsoft Windows", parent: "System", critical: true },
    { pid: 512, name: "csrss.exe", image: "C:\\Windows\\System32\\csrss.exe", user: "SYSTEM", cpu: 0.1, mem: 5, disk: 0, desc: "Client Server Runtime Process", publisher: "Microsoft Windows", parent: "smss.exe", critical: true },
    { pid: 596, name: "wininit.exe", image: "C:\\Windows\\System32\\wininit.exe", user: "SYSTEM", cpu: 0, mem: 6, disk: 0, desc: "Windows Start-Up Application", publisher: "Microsoft Windows", parent: "smss.exe", critical: true },
    { pid: 680, name: "services.exe", image: "C:\\Windows\\System32\\services.exe", user: "SYSTEM", cpu: 0.1, mem: 9, disk: 0, desc: "Services and Controller app", publisher: "Microsoft Windows", parent: "wininit.exe", critical: true },
    { pid: 704, name: "lsass.exe", image: "C:\\Windows\\System32\\lsass.exe", user: "SYSTEM", cpu: 0, mem: 18, disk: 0, desc: "Local Security Authority Process", publisher: "Microsoft Windows", parent: "wininit.exe", critical: true },
    { pid: 812, name: "winlogon.exe", image: "C:\\Windows\\System32\\winlogon.exe", user: "SYSTEM", cpu: 0, mem: 8, disk: 0, desc: "Windows Logon Application", publisher: "Microsoft Windows", parent: "smss.exe", critical: true },
    { pid: 904, name: "svchost.exe", image: "C:\\Windows\\System32\\svchost.exe", user: "SYSTEM", cpu: 0.2, mem: 22, disk: 0, desc: "Service Host: DCOM Server Process Launcher", publisher: "Microsoft Windows", parent: "services.exe", hosts: "DcomLaunch, PlugPlay, Power" },
    { pid: 1012, name: "svchost.exe", image: "C:\\Windows\\System32\\svchost.exe", user: "NETWORK SERVICE", cpu: 0.1, mem: 14, disk: 0, desc: "Service Host: Network Service", publisher: "Microsoft Windows", parent: "services.exe", hosts: "Dnscache, NlaSvc" },
    { pid: 1168, name: "svchost.exe", image: "C:\\Windows\\System32\\svchost.exe", user: "LOCAL SERVICE", cpu: 0.1, mem: 11, disk: 0, desc: "Service Host: Local Service", publisher: "Microsoft Windows", parent: "services.exe", hosts: "EventLog" },
    { pid: 1336, name: "dwm.exe", image: "C:\\Windows\\System32\\dwm.exe", user: "DWM-1", cpu: 0.8, mem: 64, disk: 0, desc: "Desktop Window Manager", publisher: "Microsoft Windows", parent: "winlogon.exe" },
    { pid: 1500, name: "spoolsv.exe", image: "C:\\Windows\\System32\\spoolsv.exe", user: "SYSTEM", cpu: 0, mem: 9, disk: 0, desc: "Spooler SubSystem App", publisher: "Microsoft Windows", parent: "services.exe" },
    { pid: 2280, name: "MsMpEng.exe", image: "C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\4.18.24090.11-0\\MsMpEng.exe", user: "SYSTEM", cpu: 0.2, mem: 150, disk: 0, desc: "Antimalware Service Executable", publisher: "Microsoft Windows", parent: "services.exe", protected: true },
    { pid: 3120, name: "explorer.exe", image: "C:\\Windows\\explorer.exe", user: U, cpu: 0.5, mem: 118, disk: 0, desc: "Windows Explorer", publisher: "Microsoft Windows", parent: "userinit.exe", special: "explorer" },
    { pid: 3460, name: "SecurityHealthSystray.exe", image: "C:\\Windows\\System32\\SecurityHealthSystray.exe", user: U, cpu: 0, mem: 4, disk: 0, desc: "Windows Security notification icon", publisher: "Microsoft Windows", parent: "explorer.exe" },
    { pid: 3610, name: "ctfmon.exe", image: "C:\\Windows\\System32\\ctfmon.exe", user: U, cpu: 0, mem: 12, disk: 0, desc: "CTF Loader", publisher: "Microsoft Windows", parent: "svchost.exe" }
  ];
}

/* ------------------------------------------------------------------ */
/* The runtimes the office's line-of-business programs depend on.      */
/* Each puts its DLLs in System32 (64-bit) or SysWOW64 (32-bit) — the  */
/* distinction the App Deployment sim's answer key got backwards.      */
/* ------------------------------------------------------------------ */
export const RUNTIMES = {
  "vc2010x86": { name: "Microsoft Visual C++ 2010 x86 Redistributable - 10.0.40219", bits: 32, dlls: ["msvcp100.dll", "msvcr100.dll"] },
  "vc2010x64": { name: "Microsoft Visual C++ 2010 x64 Redistributable - 10.0.40219", bits: 64, dlls: ["msvcp100.dll", "msvcr100.dll"] },
  "vc2013x86": { name: "Microsoft Visual C++ 2013 Redistributable (x86) - 12.0.40664", bits: 32, dlls: ["msvcp120.dll", "msvcr120.dll"] },
  "vc2015x86": { name: "Microsoft Visual C++ 2015-2022 Redistributable (x86) - 14.40.33810", bits: 32, dlls: ["vcruntime140.dll", "msvcp140.dll"] },
  "vc2015x64": { name: "Microsoft Visual C++ 2015-2022 Redistributable (x64) - 14.40.33810", bits: 64, dlls: ["vcruntime140.dll", "msvcp140.dll"] }
};

/* ------------------------------------------------------------------ */
/* A new machine                                                       */
/* ------------------------------------------------------------------ */
export function makeMachine(o) {
  const user = o.user;
  const m = {
    id: o.id, host: o.host, user: user, fullName: o.fullName || user, dept: o.dept || "",
    domain: "RAFIKI",
    userIsAdmin: !!o.userIsAdmin,
    techAccount: { name: "itadmin", password: "Bench-Tech-2026" },
    build: "10.0.22631.4317", edition: o.edition || "Windows 11 Pro", version: "23H2",
    ramMB: o.ramMB || 16384,
    power: "on", crashed: null, shellGone: false,
    procs: baseProcesses(user),
    disks: [systemDisk()],
    sys: { corrupt: 0, storeCorrupt: false, fsErrors: false, pendingRepair: false, chkdskScheduled: false },
    runtimes: Object.assign({ vc2010x64: true, vc2015x64: true, vc2015x86: true, vc2010x86: true, vc2013x86: true }, o.runtimes || {}),
    apps: (o.apps || []).map(clone),
    env: { PATH: "C:\\Windows\\System32;C:\\Windows;C:\\Windows\\System32\\Wbem;C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\" },
    logs: { Application: [], System: [] },
    net: { ip: o.ip || "192.168.1.50", mask: "255.255.255.0", gw: "192.168.1.1", dns: "192.168.1.10", mac: o.mac || "3C-52-82-4A-19-E7", dhcp: "192.168.1.1", cable: true },
    fs: {},
    events: [],
    clock: o.clock || "Mar 03 10:40"
  };
  m.fs = makeFS(m);
  (o.logs || []).forEach(function (e) { addLog(m, e.log || "Application", e); });
  return m;
}

export function systemDisk() {
  return {
    n: 0, model: "NVMe SAMSUNG MZVL2512", bytes: 512110190592, style: "GPT", online: true, system: true,
    parts: [
      { kind: "efi", bytes: 104857600, fs: "FAT32", label: "", letter: "", health: "Healthy (EFI System Partition)" },
      { kind: "os", bytes: 510000000000 - 104857600 - 943718400, fs: "NTFS", label: "", letter: "C", health: "Healthy (Boot, Page File, Crash Dump, Basic Data Partition)" },
      { kind: "recovery", bytes: 943718400, fs: "NTFS", label: "", letter: "", health: "Healthy (Recovery Partition)" }
    ]
  };
}

export function note(m, kind, detail) {
  m.events.push(Object.assign({ kind: kind, at: m.events.length }, detail || {}));
}

/* ------------------------------------------------------------------ */
/* Event logs                                                          */
/* ------------------------------------------------------------------ */
export function addLog(m, log, e) {
  const L = m.logs[log] || (m.logs[log] = []);
  const last = L.length ? L[L.length - 1].index : (log === "System" ? 5120 : 2180);
  L.push({ index: e.index || last + 1, time: e.time || m.clock, level: e.level || "Information", source: e.source || "Application", id: e.id || 0, text: e.text || "" });
}

/* ------------------------------------------------------------------ */
/* Files                                                               */
/* A file is { name, size, bits?, ver? }. `bits` matters for DLLs: a   */
/* 32-bit program loading a 64-bit DLL fails with 0xc000007b.          */
/* ------------------------------------------------------------------ */
function dirEntry(f, path, dirs, files) { f[path.toLowerCase()] = { path: path, dirs: dirs || [], files: files || [] }; }
export function makeFS(m) {
  const f = {}; const u = m.user;
  dirEntry(f, "C:\\", ["Program Files", "Program Files (x86)", "ProgramData", "Users", "Windows"], []);
  dirEntry(f, "C:\\Users", [u, "Public"], []);
  dirEntry(f, "C:\\Users\\" + u, ["Desktop", "Documents", "Downloads"], [{ name: "NTUSER.DAT", size: 3145728 }]);
  dirEntry(f, "C:\\Users\\" + u + "\\Desktop", [], []);
  dirEntry(f, "C:\\Users\\" + u + "\\Documents", [], []);
  dirEntry(f, "C:\\Users\\" + u + "\\Downloads", [], []);
  dirEntry(f, "C:\\Users\\Public", [], []);
  dirEntry(f, "C:\\Program Files", ["Common Files", "Microsoft Office", "Windows Defender"], []);
  dirEntry(f, "C:\\Program Files (x86)", ["Common Files", "Microsoft"], []);
  dirEntry(f, "C:\\ProgramData", ["Microsoft"], []);
  dirEntry(f, "C:\\Windows", ["Logs", "System32", "SysWOW64", "WinSxS"], [{ name: "explorer.exe", size: 5611432 }, { name: "notepad.exe", size: 360448 }]);
  dirEntry(f, "C:\\Windows\\Logs", ["CBS"], []);
  dirEntry(f, "C:\\Windows\\Logs\\CBS", [], [{ name: "CBS.log", size: 6291456 }]);
  dirEntry(f, "C:\\Windows\\System32", ["drivers"], [{ name: "cmd.exe", size: 323584, bits: 64 }, { name: "sfc.exe", size: 45056, bits: 64 }, { name: "taskmgr.exe", size: 1630208, bits: 64 }, { name: "svchost.exe", size: 57528, bits: 64 }, { name: "regsvr32.exe", size: 25600, bits: 64 }]);
  dirEntry(f, "C:\\Windows\\System32\\drivers", [], [{ name: "strt1.sys", size: 88064, bits: 64 }]);
  dirEntry(f, "C:\\Windows\\SysWOW64", [], [{ name: "cmd.exe", size: 263168, bits: 32 }, { name: "regsvr32.exe", size: 21504, bits: 32 }]);
  dirEntry(f, "C:\\Windows\\WinSxS", [], []);
  syncRuntimes(m, f);
  (m.apps || []).forEach(function (a) { if (a.installed !== false) placeApp(f, a, m); });
  return f;
}
export function dirOf(m, path) { return m.fs[String(path).replace(/\\$/, "").toLowerCase()] || (path.length === 3 ? m.fs[path.toLowerCase()] : null); }
export function findFile(m, dir, name) {
  const d = dirOf(m, dir); if (!d) return null;
  return d.files.filter(function (x) { return x.name.toLowerCase() === String(name).toLowerCase(); })[0] || null;
}
function ensureDir(f, path) {
  const k = path.toLowerCase(); if (f[k]) return f[k];
  const parent = path.slice(0, path.lastIndexOf("\\")); const name = path.slice(path.lastIndexOf("\\") + 1);
  const p = ensureDir(f, parent.length === 2 ? parent + "\\" : parent);
  if (p.dirs.map(function (x) { return x.toLowerCase(); }).indexOf(name.toLowerCase()) < 0) p.dirs.push(name);
  dirEntry(f, path, [], []); return f[k];
}
export function putFile(f, dir, file) {
  const d = ensureDir(f, dir);
  d.files = d.files.filter(function (x) { return x.name.toLowerCase() !== file.name.toLowerCase(); }).concat([Object.assign({}, file)]);
}
function removeFile(f, dir, name) { const d = f[dir.toLowerCase()]; if (d) d.files = d.files.filter(function (x) { return x.name.toLowerCase() !== name.toLowerCase(); }); }

/* Put every installed runtime's DLLs where Windows keeps them, and take
   an uninstalled one's away. 64-bit DLLs go in System32; 32-bit ones in
   SysWOW64 — the folder names are the wrong way round for historical
   reasons, and that is exactly the trap. */
export function syncRuntimes(m, f) {
  f = f || m.fs;
  Object.keys(RUNTIMES).forEach(function (k) {
    const R = RUNTIMES[k]; const dir = R.bits === 64 ? "C:\\Windows\\System32" : "C:\\Windows\\SysWOW64";
    R.dlls.forEach(function (d) {
      if (m.runtimes[k]) putFile(f, dir, { name: d, size: d.indexOf("msvcp") === 0 ? 829440 : 773120, bits: R.bits, ver: R.name.split(" - ")[1] });
      else removeFile(f, dir, d);
    });
  });
}

export function placeApp(f, a, m) {
  const dir = a.dir;
  putFile(f, dir, { name: a.exe, size: 829440, bits: a.bits });
  (a.files || []).forEach(function (x) { putFile(f, dir, x); });
  if (a.shortcut !== false) putFile(f, "C:\\Users\\Public\\Desktop", { name: a.name + ".lnk", size: 2048, target: dir + "\\" + a.exe });
}

/* ------------------------------------------------------------------ */
/* Starting a program — the loader's rules, in the order Windows       */
/* searches: the program's own folder, then the system folder for its  */
/* bitness, then every folder on the PATH.                             */
/* ------------------------------------------------------------------ */
export function appByName(m, name) {
  const n = String(name).toLowerCase().replace(/\.exe$/, "");
  return (m.apps || []).filter(function (a) { return a.name.toLowerCase() === n || a.exe.toLowerCase().replace(/\.exe$/, "") === n; })[0] || null;
}
export function launchApp(m, name, via) {
  const a = appByName(m, name);
  if (!a || a.installed === false) return { ok: false, title: "Windows", text: "Windows cannot find '" + name + "'. Make sure you typed the name correctly, and then try again.", kind: "notfound" };
  if (via === "shortcut" && a.shortcutBroken) {
    note(m, "launch", { app: a.name, result: "shortcut" });
    return { ok: false, title: "Problem with Shortcut", text: "The item '" + a.exe + "' that this shortcut refers to has been changed or moved, so this shortcut will no longer work properly.", kind: "shortcut" };
  }
  const sysdir = a.bits === 32 ? "C:\\Windows\\SysWOW64" : "C:\\Windows\\System32";
  const pathDirs = (m.env.PATH || "").split(";").filter(Boolean);
  for (const dll of (a.needs || [])) {
    const local = findFile(m, a.dir, dll);
    if (local) {
      if (local.bits && local.bits !== a.bits) {
        const t = a.exe + " - Application Error: The application was unable to start correctly (0xc000007b). Click OK to close the application.";
        addLog(m, "Application", { level: "Error", source: "Application Error", id: 1000, text: "Faulting application name: " + a.exe + ", Faulting module name: " + dll + " (image is " + local.bits + "-bit; the program is " + a.bits + "-bit), Exception code: 0xc000007b" });
        note(m, "launch", { app: a.name, result: "bitness", dll: dll });
        return { ok: false, title: a.exe + " - Application Error", text: "The application was unable to start correctly (0xc000007b). Click OK to close the application.", kind: "bitness", dll: dll, log: t };
      }
      continue;
    }
    const inSys = findFile(m, sysdir, dll);
    const inPath = pathDirs.some(function (p) { const f = findFile(m, p, dll); return f && (!f.bits || f.bits === a.bits); });
    if (inSys || inPath) continue;
    addLog(m, "System", { level: "Information", source: "Application Popup", id: 26, text: "Application popup: " + a.exe + " - System Error : The code execution cannot proceed because " + dll.toUpperCase().replace(".DLL", ".dll") + " was not found. Reinstalling the program may fix this problem." });
    addLog(m, "Application", { level: "Error", source: "Application Error", id: 1000, text: "Faulting application name: " + a.exe + ", version: " + a.ver + ", Faulting module name: " + dll.toUpperCase().replace(".DLL", ".dll") + ", Exception code: 0xc0000135" });
    note(m, "launch", { app: a.name, result: "missing", dll: dll });
    return { ok: false, title: a.name, text: "The program can't start because " + dll.toUpperCase().replace(".DLL", ".dll") + " is missing from your computer. Try reinstalling the program to fix this problem.", kind: "missing", dll: dll };
  }
  if (a.configBad) {
    addLog(m, "Application", { level: "Error", source: a.name, id: 3, text: a.name + " could not read its configuration: " + a.dir + "\\config.ini is not valid (line 12: unexpected end of file)." });
    note(m, "launch", { app: a.name, result: "config" });
    return { ok: false, title: a.name, text: "Configuration error: the settings file config.ini could not be read. " + a.name + " will now close.", kind: "config" };
  }
  /* a driver the program uses, broken by an update: the program's own
     files are fine, so repairing or reinstalling it changes nothing */
  if (a.driverBad) {
    addLog(m, "Application", { level: "Error", source: "Application Error", id: 1000, text: "Faulting application name: " + a.exe + ", version: " + a.ver + ", Faulting module name: " + a.driverBad.module + " (" + a.driverBad.driver + ", installed " + a.driverBad.when + "), Exception code: 0xc0000005" });
    note(m, "launch", { app: a.name, result: "driver" });
    return { ok: false, title: a.name, text: a.name + " has stopped working. A problem caused the program to stop working correctly. Faulting module: " + a.driverBad.module + ".", kind: "crash" };
  }
  if (a.brokenBeyondRepair) {
    addLog(m, "Application", { level: "Error", source: "Application Error", id: 1000, text: "Faulting application name: " + a.exe + ", version: " + a.ver + ", Faulting module name: " + a.exe + ", Exception code: 0xc0000005, Fault offset: 0x0004f2a1" });
    note(m, "launch", { app: a.name, result: "crash" });
    return { ok: false, title: a.name, text: a.name + " has stopped working. A problem caused the program to stop working correctly. Windows will close the program and notify you if a solution is available.", kind: "crash" };
  }
  note(m, "launch", { app: a.name, result: "ok" });
  if (!m.procs.some(function (p) { return p.app === a.name; })) {
    m.procs.push({ pid: 6000 + m.procs.length * 4, name: a.exe, image: a.dir + "\\" + a.exe, user: m.user, cpu: 1.2, mem: 140, disk: 0.1, desc: a.name, publisher: a.publisher, parent: "explorer.exe", app: a.name, window: true });
  }
  return { ok: true, title: a.name, text: a.name + " " + a.ver + " is running.", kind: "ok" };
}

/* Repair from Settings > Apps > Modify, or reinstall from Software Center.
   Both rewrite the program's own files and shortcut. Whether they also
   bring back a runtime depends on the installer, which is per program:
   `a.bundles` lists the runtimes its installer carries. */
export function repairApp(m, name, how) {
  const a = appByName(m, name);
  if (!a) return { ok: false, text: "That program is not installed." };
  a.configBad = false; a.shortcutBroken = false; a.installed = true;
  if (a.pathEntry && (m.env.PATH || "").toLowerCase().split(";").indexOf(a.pathEntry.toLowerCase()) < 0) m.env.PATH = (m.env.PATH ? m.env.PATH + ";" : "") + a.pathEntry;
  (a.bundles || []).forEach(function (k) { m.runtimes[k] = true; });
  syncRuntimes(m);
  (a.files || []).forEach(function (x) { putFile(m.fs, a.dir, x); });
  /* files the program did not ship with, dropped into its folder by hand,
     are removed by a repair: the installer puts its folder back exactly */
  const d = dirOf(m, a.dir); if (d) d.files = d.files.filter(function (x) { return x.name.toLowerCase() === a.exe.toLowerCase() || (a.files || []).some(function (y) { return y.name.toLowerCase() === x.name.toLowerCase(); }); });
  putFile(m.fs, a.dir, { name: a.exe, size: 829440, bits: a.bits });
  putFile(m.fs, "C:\\Users\\Public\\Desktop", { name: a.name + ".lnk", size: 2048, target: a.dir + "\\" + a.exe });
  addLog(m, "Application", { level: "Information", source: "MsiInstaller", id: how === "reinstall" ? 1033 : 1035, text: "Windows Installer " + (how === "reinstall" ? "reinstalled" : "reconfigured") + " the product. Product Name: " + a.name + ". Product Version: " + a.ver + ". Reconfiguration success or error status: 0." });
  note(m, "repair-app", { app: a.name, how: how || "repair" });
  return { ok: true, text: a.name + " was " + (how === "reinstall" ? "reinstalled" : "repaired") + " successfully." };
}
export function installRuntime(m, key, how) {
  if (!RUNTIMES[key]) return { ok: false, text: "No such package." };
  m.runtimes[key] = true; syncRuntimes(m);
  addLog(m, "Application", { level: "Information", source: "MsiInstaller", id: 1033, text: "Windows Installer installed the product. Product Name: " + RUNTIMES[key].name + ". Installation success or error status: 0." });
  note(m, "install-runtime", { key: key, how: how || "install" });
  return { ok: true, text: RUNTIMES[key].name + " was " + (how === "repair" ? "repaired" : "installed") + " successfully." };
}

/* ------------------------------------------------------------------ */
/* Processes, power                                                    */
/* ------------------------------------------------------------------ */
export function running(m) { if (m.power !== "on" || m.crashed) return []; return m.procs.slice(); }
export function totals(m) {
  const ps = running(m);
  const cpu = Math.min(100, ps.reduce(function (a, p) { return a + (p.cpu || 0); }, 0));
  const mem = ps.reduce(function (a, p) { return a + (p.mem || 0); }, 0) + 1400;
  const disk = ps.reduce(function (a, p) { return a + (p.disk || 0); }, 0);
  return { cpu: Math.round(cpu), memPct: Math.min(99, Math.round(mem / m.ramMB * 100)), memMB: mem, disk: +disk.toFixed(1), diskPct: Math.min(100, Math.round(disk / 1.2)) };
}
export function endProcess(m, pid, how) {
  const p = m.procs.filter(function (x) { return x.pid === pid; })[0];
  if (!p) return { ok: false, say: "That process has already exited." };
  if (p.protected) { note(m, "end-denied", { name: p.name }); return { ok: false, effect: "denied", say: "Access is denied. " + p.desc + " is a protected process, and Windows will not let anybody end it — not even an administrator." }; }
  if (p.critical) {
    if (how !== "confirmed") return { ok: false, effect: "confirm-critical", say: "Do you want to end the system process '" + p.desc + "'? Ending this process will shut down the operating system immediately. You will lose all unsaved data." };
    m.crashed = "CRITICAL_PROCESS_DIED"; note(m, "bsod", { code: m.crashed, name: p.name });
    return { ok: true, effect: "bsod", say: "Your device ran into a problem and needs to restart. Stop code: CRITICAL_PROCESS_DIED." };
  }
  m.procs = m.procs.filter(function (x) { return x !== p && !(p.group && x.group === p.group); });
  note(m, "ended", { name: p.name, pid: p.pid, tag: p.tag || null });
  if (p.special === "explorer") { m.shellGone = true; return { ok: true, effect: "explorer", say: "The taskbar and the desktop have gone. Explorer IS the taskbar, the Start menu and the desktop — Windows itself is still running." }; }
  return { ok: true, say: p.desc + " has been ended." };
}
export function startShell(m) {
  if (!m.shellGone) return false; m.shellGone = false;
  if (!m.procs.some(function (p) { return p.special === "explorer"; })) m.procs.push({ pid: 3120, name: "explorer.exe", image: "C:\\Windows\\explorer.exe", user: m.user, cpu: 0.5, mem: 110, disk: 0, desc: "Windows Explorer", publisher: "Microsoft Windows", parent: "Taskmgr.exe", special: "explorer" });
  note(m, "shell-back"); return true;
}
export function shutdown(m) { m.power = "off"; m.crashed = null; m.shellGone = false; note(m, "shutdown"); }
export function boot(m) {
  m.power = "on"; m.crashed = null; m.shellGone = false;
  const lines = [];
  if (m.sys.chkdskScheduled) { m.sys.chkdskScheduled = false; if (m.sys.fsErrors) { m.sys.fsErrors = false; lines.push("Scanning and repairing drive (C:): 100% complete. Windows made corrections to the file system."); } }
  if (m.sys.pendingRepair) { m.sys.pendingRepair = false; lines.push("Windows finished the servicing operation that was waiting for a restart."); }
  m.procs = baseProcesses(m.user).concat(m.procs.filter(function (p) { return p.startsWithWindows; }));
  /* Software Installation group policy only ever applies at startup, and
     any startup applies it once it is waiting (event 108 says so): the
     restart gpupdate offers, or one done with shutdown /r */
  if (m.gpoPending && m.gpoApp) {
    const a = m.gpoApp; m.apps = m.apps.filter(function (x) { return x.name !== a.name; }).concat([Object.assign({}, a, { installed: true })]);
    placeApp(m.fs, a, m); (a.bundles || []).forEach(function (k) { m.runtimes[k] = true; }); syncRuntimes(m);
    addLog(m, "Application", { level: "Information", source: "Application Management Group Policy", id: 302, text: "The assignment of application " + a.name + " from policy Rafiki Apps - " + a.name + " succeeded." });
    lines.push("Group Policy installed " + a.name + " during startup.");
    m.gpoPending = null; m.gpoRestart = false; m.gpoApp = null;
    note(m, "gpo-installed", { app: a.name });
  }
  addLog(m, "System", { level: "Information", source: "Kernel-General", id: 12, text: "The operating system started at system time " + m.clock + "." });
  note(m, "boot", { lines: lines });
  return { ok: true, say: lines.join(" ") || "Windows started." };
}

/* ------------------------------------------------------------------ */
/* Disks (Disk Management and DiskPart, both Core 2 Windows tools)     */
/* ------------------------------------------------------------------ */
export function disk(m, n) { return m.disks.filter(function (d) { return d.n === n; })[0] || null; }
export function usedLetters(m) { const out = []; m.disks.forEach(function (d) { d.parts.forEach(function (p) { if (p.letter) out.push(p.letter); }); }); out.push("D"); return out; }
export function initDisk(m, n, style) { const d = disk(m, n); if (!d) return { ok: false, say: "There is no Disk " + n + "." }; if (d.style) return { ok: false, say: "Disk " + n + " is already initialized (" + d.style + ")." }; d.style = style; d.parts = [{ kind: "unalloc", bytes: d.bytes }]; return { ok: true, say: "Disk " + n + " is now " + style + "." }; }
export function convertDisk(m, n, style) { const d = disk(m, n); if (!d) return { ok: false, say: "There is no Disk " + n + "." }; if (d.system) return { ok: false, say: "This is the disk Windows is running from. It cannot be converted from inside Windows." }; d.style = null; return initDisk(m, n, style); }
export function newVolume(m, n, o) { const d = disk(m, n); if (!d || !d.style) return { ok: false, say: "The disk is not initialized." }; const i = d.parts.findIndex(function (p) { return p.kind === "unalloc"; }); if (i < 0) return { ok: false, say: "There is no unallocated space." }; const free = d.parts[i].bytes, size = Math.min(free, o.size || free); d.parts.splice(i, 1, { kind: "data", bytes: size, fs: o.fs || "NTFS", label: o.label || "New Volume", letter: o.letter || "", health: "Healthy (Basic Data Partition)" }); if (free - size > 0) d.parts.splice(i + 1, 0, { kind: "unalloc", bytes: free - size }); return { ok: true, say: "The volume is ready." }; }
export function cleanDisk(m, n) { const d = disk(m, n); if (!d) return { ok: false, say: "There is no disk selected." }; if (d.system) return { ok: false, say: "DiskPart has encountered an error: Access is denied. The disk Windows is running from cannot be cleaned." }; d.style = null; d.parts = [{ kind: "unalloc", bytes: d.bytes }]; return { ok: true, say: "DiskPart succeeded in cleaning the disk." }; }
export function fmtSize(bytes) { const gb = bytes / GiB; if (gb >= 1) return gb.toFixed(2) + " GB"; return Math.round(bytes / 1048576) + " MB"; }
export function sysHealthy(m) { const s = m.sys; return !s.corrupt && !s.storeCorrupt && !s.fsErrors && !s.pendingRepair; }
