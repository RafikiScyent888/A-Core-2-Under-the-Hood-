/* =====================================================================
   A new company phone on the technician's bench (Core 2, "OS
   installation: working with Windows, macOS, Linux, and mobile operating
   systems"). Plain JSON on TECH-01's record (fleet.TECH.newPhones), so
   snapshots and revert cover it; no DOM: newphoneui.js draws its screen,
   beside the approved 3D phone.

   Android's first-run setup, as a company sets up a phone it owns:
     power      off, a short press does nothing (with the charger in, it
                shows the battery); press and hold starts it; held while
                on, the power menu (Power off, Restart)
     welcome    language and Start; tapping the blank part of the welcome
                screen six times in the same spot opens the QR set-up
     QR set-up  scans the enrolment code device management shows; then
                Wi-Fi; then "This device belongs to your organization";
                accepting makes it a fully managed company phone
     afw#setup  typed at the Google sign-in instead of an email address
                (the consumer path: Wi-Fi, copy apps, sign in) installs the
                device policy app, which then scans the same code
     Skip       finishes the phone as a personal, unmanaged one. A phone
                that has finished setup can't become fully managed: only
                a new or erased phone can. Adding a work account after
                setup makes a work profile (for personal phones) instead
     screen lock  required by the company's policy: a PIN of 6 or more
                digits with no repeats or runs (or a password); no pattern
     update     System › Software update: needs Wi-Fi, and a battery of at
                least 30% or the charger in; installs and restarts
     erase      Reset options › Erase all data: back to the welcome
                screen. The installed Android version and update stay
   ===================================================================== */
export function all(fleet) { const t = fleet.TECH; if (!t.newPhones) t.newPhones = {}; return t.newPhones; }
export function get(fleet, id) { return all(fleet)[id]; }
export const WIFI = [
  { ssid: "Rafiki-Staff", secured: true, pass: "T3amR@fiki2026" },
  { ssid: "Rafiki-Guest", secured: false, portal: true },
  { ssid: "VM-4F2A9C", secured: true, pass: null }
];
export const POLICY = { minPatch: "1 September 2026", pinLen: 6 };
const PATCHES = ["1 June 2026", "1 July 2026", "1 August 2026", "1 September 2026"];
export function patchOK(m) { return PATCHES.indexOf(m.os.patch) >= PATCHES.indexOf(POLICY.minPatch); }

function freshSetup() { return { taps: 0, flow: null, wifi: null, copied: false, scanned: false, accepted: false, done: false }; }
export function add(fleet, o) {
  const m = { id: o.id, model: o.model || "TechCom T7", serial: o.serial || "R5CT31KX8PA", imei: o.imei || "356938 10 442197 3", owner: o.owner,
    power: "off", screen: "off", battery: { level: o.battery == null ? 18 : o.battery, charging: false },
    os: { version: "Android 15", patch: "1 June 2026" }, update: { patch: "1 September 2026", gb: 1.9 },
    setup: freshSetup(), enrol: "none", lock: null, mdm: { qr: false }, error: null, events: [] };
  all(fleet)[o.id] = m; return m;
}
export function note(m, kind, d) { m.events.push(Object.assign({ kind: kind, at: m.events.length }, d || {})); }
export function lastAt(m, test) { const e = m.events.filter(test); return e.length ? e[e.length - 1].at : -1; }

/* ----------------------------------------------------------- hands */
export function power(m, how) {
  m.error = null;
  if (how === "hold") {
    if (m.power === "on") { if (m.screen !== "powermenu") m.prev = m.screen; m.screen = "powermenu"; return { ok: true }; }
    m.power = "on"; note(m, "power-on"); m.screen = startScreen(m); return { ok: true };
  }
  if (m.power === "off") return { ok: false, text: m.battery.charging ? "The screen shows the battery charging, " + m.battery.level + "%, then goes dark: the phone is still off." : "Nothing happens: the phone is switched off." };
  return { ok: true, text: "The screen turned off and on again." };
}
/* where the phone is when it starts */
function startScreen(m) {
  if (!m.setup.done) {
    if (m.enrol === "managed") return "lock";            /* enrolled, still owes the policy a screen lock */
    m.setup = freshSetup(); return "welcome";
  }
  return m.lock ? "locked" : "home";
}
export function charger(m, on) { m.battery.charging = !!on; note(m, "charger", { on: !!on }); return { ok: true, text: on ? "The USB-C charger is plugged in: charging." : "The charger is unplugged." }; }
export function powerMenu(m, pick) {
  m.error = null;
  if (pick === "off") { m.power = "off"; m.screen = "off"; note(m, "power-off"); return { ok: true }; }
  if (pick === "restart") { note(m, "restart"); m.screen = startScreen(m); return { ok: true, text: "The phone restarted." }; }
  m.screen = m.prev || "home"; return { ok: true };
}

/* ---------------------------------------------------- the welcome screen */
/* six taps in the same spot open the QR set-up; anything else resets the count */
export function tapWelcome(m) {
  m.error = null; if (m.screen !== "welcome") return { ok: false };
  m.setup.taps++; note(m, "tap", { n: m.setup.taps });
  if (m.setup.taps >= 6) { m.setup.taps = 0; m.setup.flow = "work"; m.screen = "qr"; return { ok: true, text: "QR set-up: the camera opens to scan a code from your IT admin." }; }
  return { ok: true, taps: m.setup.taps };
}
export function start(m) { m.error = null; m.setup.taps = 0; m.setup.flow = "personal"; m.screen = "wifi"; note(m, "start"); return { ok: true }; }
/* point the camera at device management's code */
export function scan(m) {
  m.error = null;
  if (m.setup.done || (m.screen !== "qr" && m.screen !== "dpc")) return { ok: false };   /* the scanner is only part of set-up */
  if (!m.mdm.qr) { m.error = "Nothing to scan: point the camera at the enrolment QR code from your IT admin."; return { ok: false, typo: true }; }
  m.setup.scanned = true; note(m, "scan");
  m.screen = m.setup.wifi ? "owned" : "wifi";
  return { ok: true, text: "Code read: Rafiki's IT Services · fully managed enrolment." };
}
export function cancel(m) {
  m.error = null;
  /* stopping a work set-up erases the phone and starts again; there's nothing on it yet */
  if (m.enrol === "managed") return { ok: false };
  m.setup = freshSetup(); m.screen = "welcome"; note(m, "setup-cancel"); return { ok: true, text: "Set-up stopped. The phone is back at its welcome screen." };
}

/* ------------------------------------------------------------- Wi-Fi */
export function joinWifi(m, ssid, pass) {
  m.error = null; const w = WIFI.filter(function (x) { return x.ssid === ssid; })[0];
  if (!w) return { ok: false };
  if (w.portal) { m.error = ssid + " needs you to sign in on a web page, and set-up can't open one. Choose another network."; return { ok: false, typo: true }; }
  if (!w.pass || pass !== w.pass) { m.error = "Couldn't connect to " + ssid + ": check the password."; return { ok: false, typo: true }; }
  m.setup.wifi = ssid; note(m, "wifi", { ssid: ssid });
  if (m.setup.flow === "work") m.screen = m.setup.scanned ? "owned" : "qr";
  else m.screen = "copy";
  return { ok: true, text: "Connected to " + ssid + "." };
}
export function offline(m) { m.error = null; if (m.setup.flow !== "personal") return { ok: false }; m.setup.wifi = null; m.screen = "lock-own"; note(m, "offline"); return { ok: true }; }
export function dontCopy(m) { m.error = null; m.setup.copied = true; m.screen = "google"; return { ok: true }; }

/* ----------------------------------------------------- Google sign-in */
export function signIn(m, email) {
  m.error = null; const e = String(email || "").trim().toLowerCase();
  if (e === "afw#setup") { m.setup.flow = "work"; m.screen = "dpc"; note(m, "afw"); return { ok: true, text: "Rafiki Device Policy is installing. Scan the QR code from your IT admin to go on." }; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { m.error = "Enter a valid email or phone number."; return { ok: false, typo: true }; }
  m.error = "Couldn't sign you in: you'd need the password for " + e + ", and nobody gave you one."; return { ok: false, typo: true };
}
export function skipAccount(m) { m.error = null; m.screen = "lock-own"; note(m, "skip-account"); return { ok: true }; }

/* -------------------------------------------- "belongs to your organization" */
export function accept(m) {
  m.error = null; if (m.setup.done || !m.setup.scanned || !m.setup.wifi) return { ok: false };
  m.setup.accepted = true; m.enrol = "managed"; m.screen = "lock"; note(m, "enrolled");
  return { ok: true, text: "Rafiki Device Policy set up the phone as a fully managed company phone, and applied the company's policies." };
}

/* -------------------------------------------------------- screen lock */
function weakPin(p) {
  if (/^(\d)\1+$/.test(p)) return true;
  const up = "01234567890123456789", down = "98765432109876543210";
  return up.indexOf(p) >= 0 || down.indexOf(p) >= 0;
}
export function setLock(m, kind, value, again) {
  m.error = null; const managed = m.enrol === "managed";
  if (kind === "skip") {
    if (managed) { m.error = "Your organization requires a screen lock. Choose a PIN or a password."; return { ok: false, refused: true }; }
    return finish(m, null);
  }
  if (kind === "pattern" && managed) { m.error = "Your organization doesn't allow a pattern. Choose a PIN or a password."; return { ok: false, refused: true }; }
  const v = String(value || "");
  if (kind === "pin") {
    if (!/^\d+$/.test(v) || v.length < (managed ? POLICY.pinLen : 4)) { m.error = "PIN must be at least " + (managed ? POLICY.pinLen : 4) + " digits."; return { ok: false, typo: true }; }
    if (managed && weakPin(v)) { m.error = "Your organization doesn't allow a sequence of digits or a repeated digit. Choose another PIN."; return { ok: false, typo: true }; }
  }
  if (kind === "password" && v.length < 6) { m.error = "Password must be at least 6 characters."; return { ok: false, typo: true }; }
  if (again !== v) { m.error = (kind === "pin" ? "PINs" : "Passwords") + " don't match."; return { ok: false, typo: true }; }
  return finish(m, { kind: kind, value: v });
}
/* set-up ends at the home screen */
function finish(m, lock) {
  m.lock = lock; m.setup.done = true; m.screen = "home";
  note(m, "setup-done", { enrol: m.enrol });
  return { ok: true, done: true, enrol: m.enrol, text: m.enrol === "managed" ? "Set-up is complete. The phone is managed by Rafiki's IT Services." : "Set-up is complete." };
}
export function unlock(m, value) {
  m.error = null; if (!m.lock) { m.screen = "home"; return { ok: true }; }
  if (String(value || "") !== m.lock.value) { m.error = "Wrong " + (m.lock.kind === "pin" ? "PIN" : "password") + ". Try again."; return { ok: false, typo: true }; }
  m.screen = "home"; return { ok: true };
}

/* ---------------------------------------------- after set-up: Settings */
/* a work account added to a phone that's already set up: a work profile */
export function addWorkProfile(m) {
  m.error = null; if (!m.setup.done || m.enrol !== "none") return { ok: false };
  m.enrol = "profile"; note(m, "work-profile");
  return { ok: true, text: "A work profile was set up: Rafiki's work apps are kept in their own section, and device management can only manage that section. The rest of the phone stays personal." };
}
export function installUpdate(m) {
  m.error = null;
  if (m.os.patch === m.update.patch) return { ok: false, text: "Your system is up to date." };
  if (!m.setup.wifi) { m.error = "Can't download the update: the phone isn't connected to Wi-Fi."; return { ok: false, refused: true }; }
  if (m.battery.level < 30 && !m.battery.charging) { m.error = "Battery too low to install the update (" + m.battery.level + "%). Charge it to at least 30%, or plug in the charger."; note(m, "update-refused"); return { ok: false, refused: true }; }
  m.os.patch = m.update.patch; note(m, "updated", { patch: m.os.patch });
  m.screen = m.lock ? "locked" : "home";
  return { ok: true, text: "Update installed: Android security update " + m.os.patch + ". The phone restarted." };
}
export function erase(m) {
  m.error = null; const was = m.enrol;
  m.setup = freshSetup(); m.enrol = "none"; m.lock = null; m.screen = "welcome"; m.power = "on";
  note(m, "erase", { was: was });
  return { ok: true, was: was, text: "All data was erased. The phone restarted at its welcome screen. (The Android version and its updates stay installed.)" };
}

/* what device management sees */
export function compliance(m) {
  if (m.enrol === "none") return { ok: false, text: "Not enrolled: device management can't see or manage this phone." };
  if (m.enrol === "profile") return { ok: false, text: "Enrolled as a personal phone with a work profile: only the work apps are managed. It's assigned as a company-owned phone." };
  const out = [];
  if (!m.lock) out.push("no screen lock");
  if (!patchOK(m)) out.push("security update " + m.os.patch + " is older than the policy's " + POLICY.minPatch);
  return out.length ? { ok: false, text: "Not compliant: " + out.join("; ") + "." } : { ok: true, text: "Compliant: every policy is met." };
}
/* ready for its new user: fully managed, a screen lock, up to date, set up */
export function ready(m) { return m.enrol === "managed" && !!m.lock && patchOK(m) && m.setup.done; }
