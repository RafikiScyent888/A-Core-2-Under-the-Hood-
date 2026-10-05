/* =====================================================================
   Installing an operating system on a PC (Core 2, Operating systems:
   "OS installation: working with Windows, macOS, Linux, and mobile
   operating systems"). Plain JSON on the machine (m.inst), so snapshots
   and revert cover it; no DOM: installui.js draws it on the PC's own
   screen, at the desk.

   What happens is worked out from the PC, as on a real one:
     power on   the firmware's start-up screen (POST): F2 for setup, F12
                for the boot menu, or let it boot from the first device in
                the boot order that can boot
     firmware   boot mode (UEFI or Legacy/CSM), Secure Boot, the TPM, the
                boot order; changes only take effect when saved
     Setup      Windows Setup from the installer USB: language, install or
                repair, product key, edition, the licence, where to
                install (an MBR disk can't take Windows in UEFI mode; delete
                its partitions and Setup makes the GPT layout itself), then
                the install and its restart
     OOBE       the first-run setup: region, the PC's name, work or
                personal; for an on-premises domain, Domain join instead
                and a local account
   Windows    then joining the domain (System Properties › Computer
                Name), a restart, and the user's first sign-in
   A machine only behaves like this when a ticket says so (m.inst.managed);
   every other PC boots straight to Windows, as before.
   ===================================================================== */
import * as M from "./machine.js";

const GB = 1073741824;
export const EDITIONS = ["Windows 11 Home", "Windows 11 Home N", "Windows 11 Pro", "Windows 11 Pro N", "Windows 11 Education", "Windows 11 Pro for Workstations"];
export const DOMAIN = { name: "RAFIKI", user: "itadmin", pass: "Bench-Tech-2026" };
export const MEDIA = { win11: { id: "win11", label: "WIN11_24H2 (USB)", entry: "UEFI: WIN11_24H2 (USB)", os: "Windows 11, version 24H2" } };

export function managed(m) { return !!(m && m.inst && m.inst.managed); }
/* a ticket puts a PC under this model: its hardware, firmware, disk and
   what's installed on it */
export function prepare(m, o) {
  o = o || {};
  m.inst = { managed: true,
    hw: Object.assign({ maker: "TechCom", model: "OptiTower 7020", cpu: "Intel Core i5-12500 (12th gen)", cpuOK: true, ramGB: 16, tpm: "2.0" }, o.hw || {}),
    fw: Object.assign({ uefi: true, secureBoot: true, tpmOn: true, order: ["disk", "usb", "pxe"] }, o.fw || {}),
    pending: null, screen: null, media: null, setup: null, oobe: null, error: null, account: o.os === null ? null : { type: "domain", name: m.user }, pendingName: null, joinPending: false,
    os: o.os === undefined ? { name: "Windows 11 Pro", version: "23H2" } : o.os,
    licence: o.licence || "Windows 11 Pro", joined: o.joined !== false && !!o.os, signedIn: !!o.os, history: [] };
  if (o.disk) m.disks[0] = o.disk;
  if (o.off) { m.power = "off"; }
  return m.inst;
}
function hist(m, kind, d) { M.note(m, "inst-" + kind, d || {}); }
/* what the PC's screen shows: null means Windows itself (or nothing) */
export function screen(m) { return managed(m) && m.power === "on" ? m.inst.screen : null; }

/* --------------------------------------------------------- power on */
export function powerOn(m) { m.power = "on"; m.crashed = null; m.inst.screen = "post"; m.inst.error = null; hist(m, "post"); }
const NAMES = { disk: "Windows Boot Manager", usb: "UEFI: USB", pxe: "Network boot (PXE)" };
export function entryName(m, e) { return e === "disk" ? (m.disks[0] ? "Windows Boot Manager (" + m.disks[0].model + ")" : "Windows Boot Manager") : e === "usb" ? (m.inst.media ? MEDIA[m.inst.media].entry : "UEFI: USB (nothing inserted)") : NAMES.pxe; }
function canBoot(m, e) { return e === "disk" ? !!m.inst.os || !!(m.inst.setup && m.inst.setup.copied) : e === "usb" ? !!m.inst.media : false; }
/* let it boot: the first device in the order that can */
export function autoBoot(m) {
  const first = m.inst.fw.order.filter(function (e) { return canBoot(m, e); })[0];
  if (!first) { m.inst.screen = "nodevice"; hist(m, "nodevice"); return { ok: false }; }
  return bootFrom(m, first);
}
export function bootFrom(m, e) {
  const I = m.inst; I.error = null;
  if (e === "pxe") { I.screen = "pxe"; hist(m, "pxe"); return { ok: false }; }
  if (e === "usb") {
    if (!I.media) { I.screen = "nodevice"; return { ok: false }; }
    I.setup = I.setup && !I.setup.copied ? I.setup : { step: "lang" }; I.screen = "ws-" + I.setup.step; hist(m, "boot", { from: "usb" }); return { ok: true };
  }
  /* the disk: Setup finishing, the first-run setup, or Windows */
  if (I.setup && I.setup.copied && !I.os) { I.os = { name: I.setup.edition, version: "24H2" }; I.oobe = { step: "region" }; I.screen = "oobe-region"; hist(m, "boot", { from: "disk", setup: true }); return { ok: true }; }
  if (!I.os) { I.screen = "nodevice"; return { ok: false }; }
  if (I.oobe && I.oobe.step !== "done") { I.screen = "oobe-" + I.oobe.step; return { ok: true }; }
  /* a rename or a domain join waits for this restart */
  if (I.pendingName) { m.host = I.pendingName; I.pendingName = null; }
  if (I.joinPending) { I.joinPending = false; I.joined = true; I.signedIn = false; m.domain = DOMAIN.name; }
  I.screen = I.signedIn ? null : "signin"; hist(m, "boot", { from: "disk" }); return { ok: true };
}
export function key(m, k) {
  const I = m.inst;
  if (k === "F2") { I.pending = JSON.parse(JSON.stringify(I.fw)); I.screen = "fw"; hist(m, "fw-open"); }
  else if (k === "F12") { I.screen = "bootmenu"; hist(m, "bootmenu"); }
  else if (k === "continue" || k === "retry") autoBoot(m);
  return { ok: true };
}

/* --------------------------------------------------------- firmware */
export function setFw(m, k, v) { const p = m.inst.pending; if (!p) return { ok: false }; p[k] = v; hist(m, "fw-set", { key: k, value: v }); return { ok: true }; }
export function moveBoot(m, e, dir) { const o = m.inst.pending.order, i = o.indexOf(e), j = i + dir; if (i < 0 || j < 0 || j >= o.length) return { ok: false }; o.splice(i, 1); o.splice(j, 0, e); hist(m, "fw-order", { order: o.slice() }); return { ok: true }; }
export function saveFw(m) { const I = m.inst; const before = JSON.stringify(I.fw); I.fw = I.pending; I.pending = null; const changed = before !== JSON.stringify(I.fw); hist(m, "fw-save", { changed: changed, fw: JSON.parse(JSON.stringify(I.fw)) }); I.screen = "post"; return { ok: true, changed: changed, text: changed ? "Settings saved. The PC restarts." : "No changes. The PC restarts." }; }
export function discardFw(m) { m.inst.pending = null; m.inst.screen = "post"; hist(m, "fw-discard"); return { ok: true }; }

/* ------------------------------------------------- the requirements */
/* Windows 11's minimum: a supported 64-bit CPU, 4 GB RAM, 64 GB storage,
   UEFI firmware with Secure Boot capability, and TPM 2.0 switched on */
export function requirements(m) {
  const I = m.inst, h = I.hw, d = m.disks[0];
  return [
    { k: "cpu", name: "Processor", ok: !!h.cpuOK, detail: h.cpu + (h.cpuOK ? ": supported" : ": not on Windows 11's supported list") },
    { k: "ram", name: "Memory", ok: h.ramGB >= 4, detail: h.ramGB + " GB (4 GB needed)" },
    { k: "disk", name: "Storage", ok: !!d && d.bytes >= 64 * GB, detail: d ? Math.round(d.bytes / GB) + " GB (64 GB needed)" : "no drive" },
    { k: "uefi", name: "Firmware", ok: !!I.fw.uefi, detail: I.fw.uefi ? "UEFI, Secure Boot capable" : "Legacy (CSM) boot: Secure Boot isn't possible" },
    { k: "tpm", name: "TPM", ok: h.tpm === "2.0" && I.fw.tpmOn, detail: h.tpm === "none" ? "no TPM" : h.tpm !== "2.0" ? "TPM " + h.tpm + " (2.0 needed)" : I.fw.tpmOn ? "TPM 2.0, on" : "TPM 2.0, switched off in the firmware" }
  ];
}
export function meets(m) { return requirements(m).every(function (r) { return r.ok; }); }

/* --------------------------------------------------- Windows Setup */
export function partRows(m) {
  const d = m.disks[0]; if (!d) return [];
  return d.parts.map(function (p, i) { return { i: i, label: p.kind === "unalloc" ? "Drive 0 Unallocated Space" : "Drive 0 Partition " + (i + 1) + (p.label ? ": " + p.label : ""), size: Math.round(p.bytes / GB * 10) / 10 + " GB", type: p.kind === "unalloc" ? "" : p.kind === "efi" ? "System" : p.kind === "recovery" ? "Recovery" : p.kind === "msr" ? "MSR (Reserved)" : "Primary", kind: p.kind }; });
}
export function ws(m, op, d) {
  const I = m.inst, S = I.setup; d = d || {}; I.error = null;
  const go = function (step) { S.step = step; I.screen = "ws-" + step; };
  if (op === "lang") { S.lang = d.lang || "English (United Kingdom)"; go("option"); hist(m, "ws-lang"); return { ok: true }; }
  if (op === "option") {
    if (d.choice === "repair") { I.screen = "ws-repair"; hist(m, "ws-repair"); return { ok: true }; }
    if (!d.agree) { I.error = "Select the box to confirm that everything on this PC's drive will be deleted, including files, apps and settings."; return { ok: false, typo: true }; }
    if (!meets(m)) { go("unsupported"); hist(m, "ws-unsupported"); return { ok: false, unsupported: true }; }
    go("key"); hist(m, "ws-option"); return { ok: true };
  }
  if (op === "key") {
    const v = String(d.key || "").trim();
    if (d.none) { S.key = null; go("edition"); hist(m, "ws-key", { none: true }); return { ok: true }; }
    if (!/^[A-Z0-9]{5}(-[A-Z0-9]{5}){4}$/i.test(v)) { I.error = "This product key didn't work. Check it and try again, or try a different key."; return { ok: false, typo: true }; }
    S.key = v.toUpperCase(); S.edition = /^VK7JG/i.test(v) ? "Windows 11 Pro" : /^YTMG3/i.test(v) ? "Windows 11 Home" : null; go(S.edition ? "terms" : "edition"); hist(m, "ws-key", { key: true }); return { ok: true };
  }
  if (op === "edition") { if (EDITIONS.indexOf(d.edition) < 0) return { ok: false }; S.edition = d.edition; go("terms"); hist(m, "ws-edition", { edition: d.edition }); return { ok: true, edition: d.edition }; }
  if (op === "terms") { go("disk"); hist(m, "ws-terms"); return { ok: true }; }
  if (op === "back") { const order = ["lang", "option", "key", "edition", "terms", "disk", "ready"]; const i = order.indexOf(S.step); if (i > 0) go(order[i - 1]); return { ok: true }; }
  if (op === "delete") {
    const dk = m.disks[0], p = dk.parts[d.i]; if (!p || p.kind === "unalloc") return { ok: false };
    p.kind = "unalloc"; p.fs = ""; p.label = ""; p.letter = "";
    /* neighbouring unallocated space merges, as Setup shows it */
    for (let i = dk.parts.length - 1; i > 0; i--) if (dk.parts[i].kind === "unalloc" && dk.parts[i - 1].kind === "unalloc") { dk.parts[i - 1].bytes += dk.parts[i].bytes; dk.parts.splice(i, 1); }
    S.deleted = (S.deleted || 0) + 1; hist(m, "ws-delete", { i: d.i }); return { ok: true, text: "The partition was deleted. Anything on it is gone." };
  }
  if (op === "format") { const p = m.disks[0].parts[d.i]; if (!p || p.kind === "unalloc") return { ok: false }; p.fs = "NTFS"; p.label = ""; hist(m, "ws-format", { i: d.i }); return { ok: true, formatted: true, text: "The partition was formatted. It's empty, and still on an " + m.disks[0].style + " disk." }; }
  if (op === "next") {
    const dk = m.disks[0], p = dk.parts[d.i];
    if (!p) { I.error = "Select where you want to install Windows."; return { ok: false, typo: true }; }
    if (I.fw.uefi && dk.style === "MBR" && p.kind !== "unalloc") { I.error = "Windows can't be installed on this drive. The selected disk is of the MBR partition style. On EFI systems, Windows can only be installed to GPT disks."; hist(m, "ws-mbr"); return { ok: false, refused: true, mbr: true }; }
    if (p.kind !== "unalloc" && p.kind !== "os" && p.kind !== "data") { I.error = "Windows can't be installed on this partition: it's a " + partRows(m)[d.i].type + " partition."; return { ok: false, refused: true }; }
    S.target = d.i; go("ready"); hist(m, "ws-target", { i: d.i, unalloc: p.kind === "unalloc" }); return { ok: true };
  }
  if (op === "install") {
    const dk = m.disks[0], all = dk.bytes;
    if (dk.parts.every(function (p) { return p.kind === "unalloc"; }) && I.fw.uefi) {
      /* on UEFI, Setup turns a blank disk into GPT and makes its own partitions */
      dk.style = "GPT"; dk.system = true;
      dk.parts = [{ kind: "efi", bytes: 104857600, fs: "FAT32", label: "", letter: "", health: "Healthy (EFI System Partition)" },
        { kind: "msr", bytes: 16777216, fs: "", label: "", letter: "", health: "Microsoft Reserved" },
        { kind: "os", bytes: all - 104857600 - 16777216 - 943718400, fs: "NTFS", label: "", letter: "C", health: "Healthy (Boot, Page File, Crash Dump, Basic Data Partition)" },
        { kind: "recovery", bytes: 943718400, fs: "NTFS", label: "", letter: "", health: "Healthy (Recovery Partition)" }];
    } else { const p = dk.parts[S.target]; p.kind = "os"; p.fs = "NTFS"; p.letter = "C"; dk.system = true; }
    S.copied = true; I.screen = "ws-restart"; hist(m, "ws-install", { edition: S.edition, style: dk.style });
    return { ok: true, text: "Windows copied its files and is ready to restart." };
  }
  return { ok: false };
}
/* Setup's own restart: the PC goes back through its firmware */
export function restartPC(m) { m.inst.screen = "post"; hist(m, "restart"); return { ok: true }; }

/* ---------------------------------------------- the first-run setup */
/* Windows 11's own order: region, the PC's name, then (Pro) personal or
   work or school. Work or school offers a Microsoft Entra ID sign-in; a
   PC for an on-premises Active Directory domain takes Sign-in options ›
   Domain join instead, gets a local account, and joins the domain from
   Windows afterwards (System Properties). Home has no domain join: it
   asks for a Microsoft account. */
export function oobe(m, op, d) {
  const I = m.inst, O = I.oobe; d = d || {}; I.error = null;
  const go = function (step) { O.step = step; I.screen = "oobe-" + step; };
  const home = /Home/.test(I.os.name);
  if (op === "region") { go("name"); hist(m, "oobe-region"); return { ok: true }; }
  if (op === "name") {
    const v = String(d.name || "").trim().toUpperCase();
    if (!/^[A-Z0-9-]{1,15}$/.test(v) || /^[0-9]+$/.test(v)) { I.error = "A PC name can be up to 15 characters, with letters, numbers and hyphens, and it can't be only numbers."; return { ok: false, typo: true }; }
    O.name = v; go(home ? "msa" : "how"); hist(m, "oobe-name", { name: v }); return { ok: true, name: v };
  }
  if (op === "how") { O.how = d.how; go(d.how === "work" ? "work" : "msa"); hist(m, "oobe-how", { how: d.how }); return { ok: true, how: d.how }; }
  if (op === "back") { if (O.step === "msa" && !home) go("how"); else if (O.step === "work") go("how"); else if (O.step === "local") go("work"); return { ok: true }; }
  if (op === "entra") { I.error = "We couldn't find an account with that username. (Rafiki has no Microsoft Entra ID tenant: its accounts are in its own Active Directory domain, " + DOMAIN.name + ".)"; hist(m, "oobe-entra"); return { ok: false, typo: true }; }
  if (op === "domain-instead") { go("local"); hist(m, "oobe-domain-instead"); return { ok: true }; }
  if (op === "local") {
    const v = String(d.name || "").trim();
    if (!/^[A-Za-z0-9._-]{1,20}$/.test(v)) { I.error = "Enter a user name of up to 20 letters, numbers, dots, hyphens or underscores."; return { ok: false, typo: true }; }
    if (/^(administrator|guest|defaultaccount|wdagutilityaccount)$/i.test(v)) { I.error = "The user name " + v + " is reserved. Use a different name."; return { ok: false, typo: true }; }
    O.local = v; go("privacy"); hist(m, "oobe-local", { name: v }); return { ok: true };
  }
  if (op === "privacy") { finish(m, { type: "local", name: O.local }); hist(m, "oobe-privacy"); return { ok: true, text: "Windows is ready, signed in with the local account " + O.local + "." }; }
  if (op === "msa") { finish(m, { type: "msa" }); hist(m, "oobe-personal"); return { ok: true, personal: true, text: "Set up with a personal Microsoft account. A company PC belongs to the company's domain, not to someone's personal account." }; }
  return { ok: false };
}
function finish(m, account) {
  const I = m.inst, O = I.oobe;
  O.step = "done"; I.account = account; I.joined = false; I.signedIn = true; I.screen = null;
  if (I.devAdmin === undefined) I.devAdmin = !!m.userIsAdmin;
  m.userIsAdmin = true; /* the first account on a new PC is its administrator */
  m.host = O.name || m.host; m.edition = I.os.name; m.version = "24H2"; m.build = "10.0.26100.1742"; m.domain = "WORKGROUP";
  /* a clean install: Windows and nothing else */
  m.apps = []; m.fs = M.makeFS(m); m.procs = M.baseProcesses(m.user); m.logs = { Application: [], System: [] };
}
/* who is signed in, as the sign-in bar shows it */
export function signedInAs(m) {
  const I = m.inst; if (!managed(m) || !I.account || I.account.type === "domain") return null;
  return I.account.type === "local" ? m.host + "\\" + I.account.name + " (local account, administrator)" : "a personal Microsoft account (administrator)";
}
/* System Properties › Computer Name › Change: rename, join a domain. Both
   take effect at the next restart. */
export function canJoin(m) { return managed(m) && !/Home/.test(m.inst.os ? m.inst.os.name : ""); }
export function changeName(m, d) {
  const I = m.inst; d = d || {}; I.error = null;
  const name = String(d.name || "").trim().toUpperCase();
  if (!/^[A-Z0-9-]{1,15}$/.test(name) || /^[0-9]+$/.test(name)) return { ok: false, typo: true, text: "The new computer name is not valid: up to 15 letters, numbers and hyphens, and not only numbers." };
  const wantDomain = d.member === "domain";
  if (wantDomain && !canJoin(m)) return { ok: false, text: "Windows 11 Home can't join a domain." };
  if (wantDomain) {
    const dom = String(d.domain || "").trim().toUpperCase().replace(/\.LOCAL$/, "");
    if (dom !== DOMAIN.name) return { ok: false, typo: true, text: "An Active Directory Domain Controller (AD DC) for the domain \"" + (d.domain || "") + "\" could not be contacted. Check the domain name is typed correctly." };
    const u = String(d.user || "").trim().replace(/^rafiki(\.local)?\\/i, "").replace(/@rafiki\.local$/i, "").toLowerCase();
    if (u !== DOMAIN.user || d.pass !== DOMAIN.pass) return { ok: false, typo: true, needCreds: true, text: "The user name or password is incorrect, or that account can't join computers to the domain." };
  }
  const was = { name: I.pendingName || m.host, domain: I.joinPending || I.joined };
  I.pendingName = name !== m.host ? name : null; I.joinPending = wantDomain && !I.joined;
  hist(m, "rename", { name: name, domain: wantDomain });
  const text = (wantDomain && !I.joined ? "Welcome to the " + DOMAIN.name + " domain. " : "") + "You must restart your computer to apply these changes.";
  return { ok: true, joined: wantDomain, renamed: name !== was.name, text: text };
}
/* the first sign-in on the domain: Dev at the PC with their own account */
export function signIn(m) {
  const I = m.inst;
  if (!I.joined) { I.error = "The user name or password is incorrect. (RAFIKI\\" + m.user + " is a domain account, and this PC isn't on the domain.)"; hist(m, "signin-failed"); return { ok: false, refused: true }; }
  I.signedIn = true; I.account = { type: "domain", name: m.user }; I.screen = null; m.userIsAdmin = !!I.devAdmin; hist(m, "signin"); return { ok: true };
}
export function activated(m) { const I = m.inst; return !!I.os && I.os.name === I.licence; }
export function insertMedia(m, id) { m.inst.media = id; hist(m, "media-in", { id: id }); }
export function removeMedia(m) { m.inst.media = null; hist(m, "media-out"); }
