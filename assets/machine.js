/* =====================================================================
   The simulated Windows PC.

   Everything the student sees on the screen is read from this, and
   everything they do changes it. `dir` lists what is really on the disk,
   `tasklist` lists what is really running, ending a process in Task
   Manager takes it out of `tasklist`. Nothing on screen is canned text
   that could disagree with something else on screen.

   NO DOM IN HERE. This file runs under node as well as in the page, so
   the checks in verify/ can build a scenario, type the fix into it, and
   assert that the machine really is fixed — the only proof that a
   generated job can actually be solved.
   ===================================================================== */

export const GiB = 1073741824;
export const MBR_LIMIT = 2199023255552;   /* 2^32 sectors x 512 bytes = 2 TiB */
export const FAT32_FORMAT_LIMIT = 32 * GiB;   /* what Windows' own tools will format */

/* A deep copy that is safe for this state: plain objects, arrays, numbers,
   strings and booleans only. structuredClone would do, but not on every
   node the checks might run under. */
export function clone(x) { return JSON.parse(JSON.stringify(x)); }

let pidSeed = 1;
function nextPid(m) { m._pid = (m._pid || 3000) + 4 + ((pidSeed = (pidSeed * 7) % 97) || 1); return m._pid; }

/* The processes every Windows 11 machine has. `critical` ones take the OS
   with them; `protected` ones refuse to be ended at all. */
export function baseProcesses() {
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
    { pid: 1336, name: "dwm.exe", image: "C:\\Windows\\System32\\dwm.exe", user: "DWM-1", cpu: 0.8, mem: 64, disk: 0, desc: "Desktop Window Manager", publisher: "Microsoft Windows", parent: "winlogon.exe", critical: false },
    { pid: 1500, name: "spoolsv.exe", image: "C:\\Windows\\System32\\spoolsv.exe", user: "SYSTEM", cpu: 0, mem: 9, disk: 0, desc: "Spooler SubSystem App", publisher: "Microsoft Windows", parent: "services.exe" },
    { pid: 2280, name: "MsMpEng.exe", image: "C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\4.18.24090.11-0\\MsMpEng.exe", user: "SYSTEM", cpu: 0.2, mem: 150, disk: 0, desc: "Antimalware Service Executable", publisher: "Microsoft Windows", parent: "services.exe", protected: true },
    { pid: 3120, name: "explorer.exe", image: "C:\\Windows\\explorer.exe", user: "USER", cpu: 0.5, mem: 118, disk: 0, desc: "Windows Explorer", publisher: "Microsoft Windows", parent: "userinit.exe", special: "explorer" },
    { pid: 3388, name: "SearchHost.exe", image: "C:\\Windows\\SystemApps\\MicrosoftWindows.Client.CBS_cw5n1h2txyewy\\SearchHost.exe", user: "USER", cpu: 0, mem: 60, disk: 0, desc: "Search", publisher: "Microsoft Windows", parent: "svchost.exe" },
    { pid: 3460, name: "SecurityHealthSystray.exe", image: "C:\\Windows\\System32\\SecurityHealthSystray.exe", user: "USER", cpu: 0, mem: 4, disk: 0, desc: "Windows Security notification icon", publisher: "Microsoft Windows", parent: "explorer.exe" },
    { pid: 3610, name: "ctfmon.exe", image: "C:\\Windows\\System32\\ctfmon.exe", user: "USER", cpu: 0, mem: 12, disk: 0, desc: "CTF Loader", publisher: "Microsoft Windows", parent: "svchost.exe" }
  ];
}

/* The 476.92 GB system disk every job starts with. */
export function systemDisk() {
  return {
    n: 0, model: "NVMe SAMSUNG MZVL2512", bytes: 512110190592, style: "GPT", online: true, system: true,
    parts: [
      { kind: "efi", bytes: 104857600, fs: "FAT32", label: "", letter: "", health: "Healthy (EFI System Partition)" },
      { kind: "os", bytes: 511004294144 - 104857600 - 943718400, fs: "NTFS", label: "", letter: "C", health: "Healthy (Boot, Page File, Crash Dump, Basic Data Partition)" },
      { kind: "recovery", bytes: 943718400, fs: "NTFS", label: "", letter: "", health: "Healthy (Recovery Partition)" }
    ]
  };
}

/* A new machine from a job's description. Everything a stage needs to be
   different is passed in `opts`; everything else is a normal PC. */
export function makeMachine(opts) {
  opts = opts || {};
  const user = opts.user || "dmorales";
  const procs = baseProcesses().map(function (p) {
    const q = Object.assign({}, p);
    if (q.user === "USER") q.user = user;
    return q;
  });
  (opts.extraProcs || []).forEach(function (p) { procs.push(Object.assign({ user: user, disk: 0 }, p)); });
  const m = {
    host: opts.host || "RECEPTION-01",
    user: user,
    userIsAdmin: opts.userIsAdmin !== false,       /* member of Administrators? */
    techAccount: opts.techAccount || { name: "itadmin", password: "Bench-Tech-2026" },
    build: "10.0.22631.4317", edition: opts.edition || "Windows 11 Pro", version: "23H2",
    ramMB: opts.ramMB || 8192,
    power: "on",
    crashed: null,          /* a stop code, when it has blue-screened */
    shellGone: false,       /* explorer.exe ended: no taskbar or desktop */
    procs: procs,
    disks: [systemDisk()],
    /* the hardware that is not yet a disk Windows can see */
    hw: Object.assign({ mains: true, panelOff: false, driveFitted: false, sataData: false, sataPower: false,
      spare: null }, opts.hw || {}),
    sys: Object.assign({
      corrupt: 0,            /* protected files that are wrong */
      storeCorrupt: false,   /* the component store sfc repairs FROM */
      fsErrors: false,       /* file-system errors on C: */
      pendingRepair: false,  /* a servicing operation waiting for a restart */
      chkdskScheduled: false,
      symptoms: []           /* what the user sees while it is broken */
    }, opts.sys || {}),
    fs: makeFS(user, opts.files),
    events: [],             /* everything that happened, for the runner to read */
    uptimeBoots: 0
  };
  return m;
}

export function note(m, kind, detail) {
  m.events.push(Object.assign({ kind: kind, at: m.events.length }, detail || {}));
}

/* ---------------------------------------------------------------------
   Processes
   --------------------------------------------------------------------- */
export function running(m) {
  if (m.power !== "on" || m.crashed) return [];
  return m.procs.slice();
}

export function totals(m) {
  const ps = running(m);
  const cpu = Math.min(100, ps.reduce(function (a, p) { return a + (p.cpu || 0); }, 0));
  const mem = ps.reduce(function (a, p) { return a + (p.mem || 0); }, 0) + 1400;   /* the kernel and caches */
  const disk = ps.reduce(function (a, p) { return a + (p.disk || 0); }, 0);
  return { cpu: Math.round(cpu), memPct: Math.min(99, Math.round(mem / m.ramMB * 100)), memMB: mem, disk: +disk.toFixed(1),
    diskPct: Math.min(100, Math.round(disk / 1.2)) };
}

/* End a process, as Task Manager's "End task" or taskkill does. Returns
   { ok, say, effect } — what happened, in words, for the screen. */
export function endProcess(m, pid, how) {
  const p = m.procs.filter(function (x) { return x.pid === pid; })[0];
  if (!p) return { ok: false, say: "That process has already exited." };
  if (p.protected) {
    note(m, "end-denied", { name: p.name });
    return { ok: false, effect: "denied", say: "Access is denied. " + p.desc + " is a protected process, and Windows will not let anybody end it — not even an administrator." };
  }
  if (p.critical) {
    if (!m.userIsAdmin) {
      note(m, "end-denied", { name: p.name });
      return { ok: false, effect: "denied", say: "Access is denied. Ending a system process needs an administrator, and this account is not one." };
    }
    if (how !== "confirmed") return { ok: false, effect: "confirm-critical", say: "Do you want to end the system process '" + p.desc + "'? Ending this process will shut down the operating system immediately. You will lose all unsaved data." };
    m.crashed = "CRITICAL_PROCESS_DIED";
    note(m, "bsod", { code: "CRITICAL_PROCESS_DIED", name: p.name });
    return { ok: true, effect: "bsod", say: "Your device ran into a problem and needs to restart. Stop code: CRITICAL_PROCESS_DIED." };
  }
  /* A browser or an Office app is one row in Task Manager and several
     processes underneath; ending the row ends the group. */
  m.procs = m.procs.filter(function (x) { return x !== p && !(p.group && x.group === p.group); });
  note(m, "ended", { name: p.name, pid: p.pid, tag: p.tag || null });
  if (p.special === "explorer") {
    m.shellGone = true;
    return { ok: true, effect: "explorer", say: "The taskbar and the desktop have gone. Explorer IS the taskbar, the Start menu and the desktop — Windows itself is still running." };
  }
  if (p.onEnd) return { ok: true, effect: p.onEnd.effect, say: p.onEnd.say };
  return { ok: true, say: p.desc + " has been ended." };
}

export function startShell(m) {
  if (!m.shellGone) return false;
  m.shellGone = false;
  if (!m.procs.some(function (p) { return p.special === "explorer"; })) {
    m.procs.push({ pid: nextPid(m), name: "explorer.exe", image: "C:\\Windows\\explorer.exe", user: m.user, cpu: 0.5, mem: 110, disk: 0, desc: "Windows Explorer", publisher: "Microsoft Windows", parent: "Taskmgr.exe", special: "explorer" });
  }
  note(m, "shell-back");
  return true;
}

/* ---------------------------------------------------------------------
   Power
   --------------------------------------------------------------------- */
export function shutdown(m) {
  m.power = "off"; m.crashed = null; m.shellGone = false;
  note(m, "shutdown");
}

/* Power on, or restart. What survives a reboot is the point: a scheduled
   chkdsk runs, a pending repair completes, a process that is not set to
   start again is gone, the new drive is detected if it is cabled. */
export function boot(m) {
  if (!m.hw.mains) { note(m, "no-power"); return { ok: false, say: "Nothing happens. The mains lead is unplugged." }; }
  m.power = "on"; m.crashed = null; m.shellGone = false; m.uptimeBoots++;
  const lines = [];
  if (m.sys.chkdskScheduled) {
    m.sys.chkdskScheduled = false;
    if (m.sys.fsErrors) { m.sys.fsErrors = false; lines.push("Scanning and repairing drive (C:): 100% complete. Windows made corrections to the file system."); note(m, "chkdsk-fixed"); }
    else lines.push("Scanning and repairing drive (C:): 100% complete. No problems found.");
  }
  if (m.sys.pendingRepair) { m.sys.pendingRepair = false; lines.push("Working on updates… Windows finished the servicing operation that was waiting for a restart."); note(m, "pending-cleared"); }
  /* processes that do not come back after a restart */
  m.procs = m.procs.filter(function (p) { return !p.gone_on_boot; });
  (m.procs).forEach(function (p) { if (p.after_boot) Object.assign(p, p.after_boot); });
  if (!m.procs.some(function (p) { return p.special === "explorer"; })) {
    m.procs.push({ pid: nextPid(m), name: "explorer.exe", image: "C:\\Windows\\explorer.exe", user: m.user, cpu: 0.5, mem: 110, disk: 0, desc: "Windows Explorer", publisher: "Microsoft Windows", parent: "userinit.exe", special: "explorer" });
  }
  detectSpare(m);
  note(m, "boot", { lines: lines });
  return { ok: true, say: lines.join(" ") || "Windows started." };
}

/* ---------------------------------------------------------------------
   The spare drive: physical, until it is fitted and cabled and the PC is
   on, at which point it becomes a disk Windows can see.
   --------------------------------------------------------------------- */
export function detectSpare(m) {
  const s = m.hw.spare;
  const visible = !!(s && m.power === "on" && m.hw.driveFitted && m.hw.sataData && m.hw.sataPower);
  const has = m.disks.some(function (d) { return d.spare; });
  if (visible && !has) {
    m.disks.push({ n: 1, model: s.model, bytes: s.bytes, style: s.style || null, online: true, spare: true,
      parts: s.parts ? clone(s.parts) : [{ kind: "unalloc", bytes: s.bytes }] });
  }
  if (!visible && has) {
    const d = m.disks.filter(function (x) { return x.spare; })[0];
    s.style = d.style; s.parts = clone(d.parts);
    m.disks = m.disks.filter(function (x) { return !x.spare; });
  }
}

export function disk(m, n) { return m.disks.filter(function (d) { return d.n === n; })[0] || null; }

export function usedLetters(m) {
  const out = [];
  m.disks.forEach(function (d) { d.parts.forEach(function (p) { if (p.letter) out.push(p.letter); }); });
  out.push("D");   /* the DVD writer every one of these office PCs has */
  return out;
}

/* Initialize a disk. MBR on a disk bigger than 2 TiB is allowed — Windows
   allows it — and the student lives with the result. */
export function initDisk(m, n, style) {
  const d = disk(m, n);
  if (!d) return { ok: false, say: "There is no Disk " + n + "." };
  if (d.style) return { ok: false, say: "Disk " + n + " is already initialized (" + d.style + ")." };
  d.style = style;
  if (style === "MBR" && d.bytes > MBR_LIMIT) {
    /* MBR addresses 2^32 sectors. Past that, the space exists and cannot
       be reached — Disk Management draws it as a second, separate block of
       unallocated space that nothing can ever be created in. */
    d.parts = [{ kind: "unalloc", bytes: MBR_LIMIT }, { kind: "unreach", bytes: d.bytes - MBR_LIMIT }];
  } else d.parts = [{ kind: "unalloc", bytes: d.bytes }];
  note(m, "init", { n: n, style: style });
  return { ok: true, say: "Disk " + n + " is now " + style + "." };
}

export function convertDisk(m, n, style) {
  const d = disk(m, n);
  if (!d) return { ok: false, say: "There is no Disk " + n + "." };
  if (d.system) return { ok: false, say: "This is the disk Windows is running from. It cannot be converted from inside Windows." };
  if (d.parts.some(function (p) { return p.kind !== "unalloc" && p.kind !== "unreach"; })) {
    return { ok: false, say: "Convert to " + style + " is only possible on an empty disk. Delete the volumes on Disk " + n + " first." };
  }
  if (d.style === style) return { ok: false, say: "Disk " + n + " is already " + style + "." };
  d.style = null; d.parts = [{ kind: "unalloc", bytes: d.bytes }];
  note(m, "convert", { n: n, style: style });
  return initDisk(m, n, style);
}

/* Create and format one volume in the first unallocated block. `size`
   in bytes, or null for all of it. */
export function newVolume(m, n, o) {
  const d = disk(m, n);
  if (!d) return { ok: false, say: "There is no Disk " + n + "." };
  if (!d.style) return { ok: false, say: "You must initialize a disk before Logical Disk Manager can access it." };
  const i = d.parts.findIndex(function (p) { return p.kind === "unalloc"; });
  if (i < 0) return { ok: false, say: "There is no unallocated space on Disk " + n + " that a volume can be created in." };
  const free = d.parts[i].bytes;
  const size = Math.min(free, o.size || free);
  if (o.fs === "FAT32" && size > FAT32_FORMAT_LIMIT) {
    return { ok: false, say: "FAT32 is not offered for a volume this size. Windows' own format tools stop at 32 GB for FAT32." };
  }
  if (o.letter && usedLetters(m).indexOf(o.letter) >= 0) return { ok: false, say: "Drive letter " + o.letter + ": is already in use." };
  const vol = { kind: "data", bytes: size, fs: o.fs || "NTFS", label: o.label || "New Volume", letter: o.letter || "", health: "Healthy (Basic Data Partition)" };
  const rest = free - size;
  d.parts.splice(i, 1, vol);
  if (rest > 0) d.parts.splice(i + 1, 0, { kind: "unalloc", bytes: rest });
  note(m, "volume", { n: n, fs: vol.fs, bytes: size, letter: vol.letter });
  return { ok: true, say: "Formatting… The volume " + (vol.letter ? vol.letter + ": " : "") + "is ready." };
}

export function deleteVolume(m, n, idx) {
  const d = disk(m, n);
  if (!d || !d.parts[idx]) return { ok: false, say: "No such volume." };
  const p = d.parts[idx];
  if (p.kind !== "data") return { ok: false, say: "Windows protects that partition; it cannot be deleted from here." };
  d.parts[idx] = { kind: "unalloc", bytes: p.bytes };
  /* merge neighbouring free space, as Disk Management does */
  for (let j = d.parts.length - 1; j > 0; j--) {
    if (d.parts[j].kind === "unalloc" && d.parts[j - 1].kind === "unalloc") { d.parts[j - 1].bytes += d.parts[j].bytes; d.parts.splice(j, 1); }
  }
  note(m, "delete-volume", { n: n });
  return { ok: true, say: "The volume has been deleted. Its space is unallocated again." };
}

/* diskpart's `clean`: every partition gone, and the disk uninitialized. */
export function cleanDisk(m, n) {
  const d = disk(m, n);
  if (!d) return { ok: false, say: "There is no disk selected." };
  if (d.system) return { ok: false, say: "DiskPart has encountered an error: Access is denied. The disk Windows is running from cannot be cleaned." };
  const hadData = d.parts.some(function (p) { return p.kind === "data" && p.files; });
  d.style = null; d.parts = [{ kind: "unalloc", bytes: d.bytes }];
  note(m, "clean", { n: n, destroyed: hadData });
  return { ok: true, say: "DiskPart succeeded in cleaning the disk." };
}

/* How Disk Management writes a size. Binary units, two decimals, the way
   Windows does it — which is the whole of the "where did my terabyte go"
   question. */
export function fmtSize(bytes) {
  const gb = bytes / GiB;
  if (gb >= 1) return gb.toFixed(2) + " GB";
  return Math.round(bytes / 1048576) + " MB";
}

/* ---------------------------------------------------------------------
   System file health: the state sfc, DISM and chkdsk read and repair.
   The order they have to run in is the mechanism: the file system under
   everything, then the component store, then the files repaired from it.
   --------------------------------------------------------------------- */
export function sysHealthy(m) {
  const s = m.sys;
  return !s.corrupt && !s.storeCorrupt && !s.fsErrors && !s.pendingRepair;
}

/* ---------------------------------------------------------------------
   A small file system: enough for `cd`, `dir`, `md`, `del` and `copy` to
   answer from what is really there. Paths are keyed in lower case, as
   Windows compares them; names keep the case they were created with.
   --------------------------------------------------------------------- */
export function makeFS(user, extra) {
  const f = {};
  function dir(path, dirs, files) { f[path.toLowerCase()] = { path: path, dirs: dirs || [], files: files || [] }; }
  dir("C:\\", ["Program Files", "Program Files (x86)", "ProgramData", "Users", "Windows"], []);
  dir("C:\\Users", [user, "Public"], []);
  dir("C:\\Users\\" + user, ["Desktop", "Documents", "Downloads", "Pictures"], [{ name: "NTUSER.DAT", size: 3145728 }]);
  dir("C:\\Users\\" + user + "\\Desktop", [], [{ name: "Appointments.xlsx", size: 48211 }, { name: "Microsoft Edge.lnk", size: 2348 }]);
  dir("C:\\Users\\" + user + "\\Documents", ["Invoices"], [{ name: "Price list 2026.docx", size: 21874 }]);
  dir("C:\\Users\\" + user + "\\Documents\\Invoices", [], [{ name: "INV-1041.pdf", size: 88213 }]);
  dir("C:\\Users\\" + user + "\\Downloads", [], [{ name: "PDFeditPro_setup.exe", size: 5242880 }]);
  dir("C:\\Users\\" + user + "\\Pictures", [], []);
  dir("C:\\Users\\Public", [], []);
  dir("C:\\Program Files", ["Common Files", "Microsoft Office", "Windows Defender"], []);
  dir("C:\\Program Files (x86)", ["Common Files", "Microsoft"], []);
  dir("C:\\ProgramData", ["Microsoft"], []);
  dir("C:\\Windows", ["Logs", "System32", "SysWOW64", "WinSxS"], [{ name: "explorer.exe", size: 5611432 }, { name: "notepad.exe", size: 360448 }]);
  dir("C:\\Windows\\Logs", ["CBS"], []);
  dir("C:\\Windows\\Logs\\CBS", [], [{ name: "CBS.log", size: 6291456 }]);
  dir("C:\\Windows\\System32", ["drivers"], [{ name: "cmd.exe", size: 323584 }, { name: "sfc.exe", size: 45056 }, { name: "chkdsk.exe", size: 29696 }, { name: "diskpart.exe", size: 208896 }, { name: "taskmgr.exe", size: 1630208 }, { name: "svchost.exe", size: 57528 }]);
  dir("C:\\Windows\\SysWOW64", [], [{ name: "cmd.exe", size: 263168 }]);
  dir("C:\\Windows\\WinSxS", [], []);
  (extra || []).forEach(function (e) {
    const k = e.dir.toLowerCase();
    if (!f[k]) dir(e.dir, [], []);
    if (e.file) f[k].files.push({ name: e.file, size: e.size || 1024 });
    if (e.sub) f[k].dirs.push(e.sub);
  });
  return f;
}
