/* =====================================================================
   A company Mac on the technician's bench (Core 2, "OS installation:
   working with Windows, macOS, Linux, and mobile operating systems").
   Plain JSON on TECH-01's record (fleet.TECH.macs), so snapshots and
   revert cover it; no DOM: macui.js draws its screen, beside the 3D Mac.

   An Apple silicon Mac, as Apple has it:
     power      a short press starts macOS; press and hold until "Loading
                startup options" shows the startup disk and Options
     Recovery   Options › Continue, a user you know the password for, then
                Restore from Time Machine, Reinstall macOS, Safari and
                Disk Utility
     Disk Utility  erase the Macintosh HD volume group: APFS (what macOS
                needs), APFS (Case-sensitive), Mac OS Extended (Journaled),
                ExFAT, MS-DOS (FAT)
     Activate   after an erase, the Mac must be activated online; if
                Activation Lock is on (Find My, the previous user's Apple
                Account), it stops here until that account's password is
                entered or the company's device management releases it
     Reinstall  only onto an APFS Macintosh HD; then Setup Assistant's
                "Hello", where a new starter takes over
   ===================================================================== */
export function all(fleet) { const t = fleet.TECH; if (!t.macs) t.macs = {}; return t.macs; }
export function get(fleet, id) { return all(fleet)[id]; }
export const ADMIN = { user: "rafikiadmin", pass: "Bench-Tech-2026" };
export const FORMATS = ["APFS", "APFS (Case-sensitive)", "Mac OS Extended (Journaled)", "ExFAT", "MS-DOS (FAT)"];
export function add(fleet, o) {
  const m = { id: o.id, model: o.model || "13-inch notebook (Apple silicon)", serial: o.serial || "C02XK1QZJ1WK", leaver: o.leaver, starter: o.starter,
    power: "off", screen: "off", os: { name: "macOS Sequoia", version: "15.0" },
    users: [{ name: o.leaverUser, full: o.leaver, admin: true }, { name: ADMIN.user, full: "Rafiki IT", admin: true }],
    disk: { name: "Macintosh HD", fmt: "APFS", hasData: true, hasOS: true, erased: false },
    lock: { on: true, account: o.lockAccount || "s•••@icloud.com", released: false },
    mdm: { enrolled: true, org: "Rafiki's IT Services" },
    activated: true, recoveryUser: null, du: null, ri: null, error: null, events: [] };
  all(fleet)[o.id] = m; return m;
}
export function note(m, kind, d) { m.events.push(Object.assign({ kind: kind, at: m.events.length }, d || {})); }
export function lastAt(m, test) { const e = m.events.filter(test); return e.length ? e[e.length - 1].at : -1; }

/* ---------------------------------------------------------- power */
export function power(m, how) {
  m.error = null;
  if (m.power === "on" && how !== "hold") { return { ok: false, text: "It's already on. A short press here would put it to sleep." }; }
  m.power = "on"; note(m, "power", { how: how });
  if (how === "hold") { m.screen = "startup"; return { ok: true }; }
  /* a short press: whatever's on the disk starts */
  if (!m.disk.hasOS) { m.screen = "nodisk"; return { ok: true }; }
  if (!m.activated) { m.screen = "activate"; return { ok: true }; }
  m.screen = m.disk.erased ? "hello" : "login"; return { ok: true };
}
export function shutDown(m) { m.power = "off"; m.screen = "off"; m.recoveryUser = null; m.du = null; note(m, "shutdown"); return { ok: true }; }

/* --------------------------------------------- startup options, Recovery */
export function startup(m, pick) {
  m.error = null;
  if (pick === "disk") { note(m, "startup", { pick: pick }); m.power = "off"; return power(m, "press"); }
  if (pick === "options") { m.screen = "recovery-user"; note(m, "startup", { pick: pick }); return { ok: true }; }
  return { ok: false };
}
export function recoveryUser(m, user, pass) {
  m.error = null;
  const u = String(user || "").trim().toLowerCase();
  if (!m.disk.hasData) { m.screen = "recovery"; note(m, "recovery"); return { ok: true }; }   /* nothing to unlock on an erased disk */
  if (u !== ADMIN.user || pass !== ADMIN.pass) { m.error = u === m.users[0].name ? "The password for " + u + " is incorrect. (" + m.leaver + " has left: nobody has that password.)" : "The user name or password is incorrect."; return { ok: false, typo: true }; }
  m.recoveryUser = u; m.screen = "recovery"; note(m, "recovery"); return { ok: true };
}
/* the four Recovery utilities */
export function utility(m, which) {
  m.error = null; note(m, "utility", { which: which });
  if (which === "du") { m.screen = "du"; m.du = { sel: null }; return { ok: true }; }
  if (which === "tm") { m.screen = "tm"; return { ok: true }; }
  if (which === "reinstall") {
    m.ri = { step: "intro" }; m.screen = "ri";
    return { ok: true, keepsData: m.disk.hasData };
  }
  if (which === "safari") { m.screen = "safari"; return { ok: true }; }
  return { ok: false };
}
/* Time Machine: the only backup there is, the leaver's own */
export function tmRestore(m) { m.error = null; m.disk = { name: "Macintosh HD", fmt: "APFS", hasData: true, hasOS: true, erased: false }; m.activated = true; note(m, "tm-restore"); m.screen = "login"; return { ok: true, text: "Restored " + m.leaver + "'s Mac from the backup of 2 October 2026: their account and files are back." }; }
export function back(m) { m.error = null; m.screen = "recovery"; m.du = null; m.ri = null; return { ok: true }; }

/* ------------------------------------------------------- Disk Utility */
export function erase(m, fmt, name) {
  m.error = null;
  if (FORMATS.indexOf(fmt) < 0) return { ok: false };
  m.disk = { name: String(name || "Macintosh HD").trim() || "Macintosh HD", fmt: fmt, hasData: false, hasOS: false, erased: true };
  note(m, "erase", { fmt: fmt });
  /* on Apple silicon, erasing the volume group means the Mac must be activated again */
  m.activated = false; m.screen = "activate";
  return { ok: true, fmt: fmt, text: "Erase process is complete. The Mac needs to be activated before you can go on." };
}
/* activation: online, against Activation Lock */
export function activate(m, account, pass) {
  m.error = null;
  if (m.lock.on && !m.lock.released) {
    if (account != null) { note(m, "activate-try"); m.error = "Incorrect Apple Account or password. This Mac is locked to " + m.lock.account + "."; return { ok: false, typo: true }; }
    m.error = "Activation Lock: this Mac is linked to an Apple Account (" + m.lock.account + "). Enter that Apple Account and password, or have the organisation that manages this Mac release it."; return { ok: false, locked: true };
  }
  m.activated = true; m.screen = "recovery"; note(m, "activated"); return { ok: true, text: "Mac activated." };
}
/* the company's device management releases the lock (the bench's panel) */
export function release(m) { if (!m.mdm.enrolled) return { ok: false }; m.lock.released = true; note(m, "released"); return { ok: true, text: "Mason released Activation Lock from Rafiki's device management. The Mac can be activated now." }; }

/* -------------------------------------------------- Reinstall macOS */
export function reinstall(m, op, d) {
  m.error = null; d = d || {}; const R = m.ri; if (!R) return { ok: false };
  if (op === "continue") { R.step = "terms"; return { ok: true }; }
  if (op === "agree") { R.step = "disk"; note(m, "ri-agree"); return { ok: true }; }
  if (op === "disk") {
    if (m.disk.fmt !== "APFS" && m.disk.fmt !== "APFS (Case-sensitive)") { m.error = "This disk can't be used to start up your computer: macOS needs it formatted as APFS."; note(m, "ri-refused", { fmt: m.disk.fmt }); return { ok: false, refused: true }; }
    R.step = "ready"; return { ok: true };
  }
  if (op === "install") {
    if (R.step !== "ready") return { ok: false };
    const kept = m.disk.hasData;
    m.disk.hasOS = true; m.disk.hasData = kept; m.os = { name: "macOS Sequoia", version: "15.1" };
    note(m, "reinstalled", { kept: kept, fmt: m.disk.fmt });
    m.ri = null; m.screen = kept ? "login" : "hello";
    return { ok: true, kept: kept, text: kept ? "macOS Sequoia was reinstalled. " + m.leaver + "'s account and files are all still there." : "macOS Sequoia is installed. The Mac shows Setup Assistant's Hello, ready for its new user." };
  }
  return { ok: false };
}
export function signIn(m, user, pass) {
  m.error = null; note(m, "login-try");
  m.error = "The password for " + (user || m.users[0].name) + " is incorrect."; return { ok: false, typo: true };
}
/* where the Mac is: its next job, in a technician's order */
export function ready(m) { return m.disk.erased && (m.disk.fmt === "APFS") && m.disk.hasOS && !m.disk.hasData && m.activated && m.screen === "hello"; }
