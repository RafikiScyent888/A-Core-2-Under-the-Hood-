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
export const MEDIA = { win11: { id: "win11", label: "WIN11_24H2 (USB)", entry: "UEFI: WIN11_24H2 (USB)", os: "Windows 11, version 24H2", name: "Windows 11 installer" },
  ubuntu: { id: "ubuntu", label: "UBUNTU_24_04 (USB)", entry: "UEFI: UBUNTU_24_04 (USB)", os: "Ubuntu 24.04.1 LTS", name: "Ubuntu 24.04 LTS installer", linux: true } };
const MB = 1048576;

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
  m.inst.devAdmin = !!m.userIsAdmin; m.inst.up = null;
  /* a PC still on Windows 10 says so wherever Windows shows its version */
  if (o.os && /Windows 10/.test(o.os.name)) { m.edition = o.os.name; m.version = o.os.version; m.build = "10.0.19045.4894"; }
  return m.inst;
}
function hist(m, kind, d) { M.note(m, "inst-" + kind, d || {}); }
/* what the PC's screen shows: null means Windows itself (or nothing) */
export function screen(m) { return managed(m) && m.power === "on" ? m.inst.screen : null; }

/* --------------------------------------------------------- power on */
export function powerOn(m) { m.power = "on"; m.crashed = null; m.inst.screen = "post"; m.inst.error = null; hist(m, "post"); }
const NAMES = { disk: "Windows Boot Manager", usb: "UEFI: USB", pxe: "Network boot (PXE)" };
export function entryName(m, e) { if (e === "ubuntu") return "ubuntu (" + (m.disks[0] ? m.disks[0].model : "disk") + ")"; return e === "disk" ? (m.disks[0] ? "Windows Boot Manager (" + m.disks[0].model + ")" : "Windows Boot Manager") : e === "usb" ? (m.inst.media ? MEDIA[m.inst.media].entry : "UEFI: USB (nothing inserted)") : NAMES.pxe; }
function canBoot(m, e) { if (e === "ubuntu") return !!(m.inst.lx && m.inst.lx.installed); return e === "disk" ? !!m.inst.os || !!(m.inst.setup && m.inst.setup.copied) : e === "usb" ? !!m.inst.media : false; }
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
    if (MEDIA[I.media].linux) { I.ub = I.ub && !I.ub.copied ? I.ub : { step: "try" }; I.screen = "ub-" + I.ub.step; hist(m, "boot", { from: "usb", media: I.media }); return { ok: true }; }
    I.setup = I.setup && !I.setup.copied ? I.setup : { step: "lang" }; I.screen = "ws-" + I.setup.step; hist(m, "boot", { from: "usb" }); return { ok: true };
  }
  /* Ubuntu's boot loader, GRUB, on the drive: it offers both systems */
  if (e === "ubuntu") { if (!canBoot(m, "ubuntu")) { I.screen = "nodevice"; return { ok: false }; } I.screen = "grub"; hist(m, "grub-menu"); return { ok: true }; }
  /* the disk: Setup finishing, the first-run setup, or Windows */
  if (I.setup && I.setup.copied && !I.os) { I.os = { name: I.setup.edition, version: "24H2" }; I.oobe = { step: "region" }; I.screen = "oobe-region"; hist(m, "boot", { from: "disk", setup: true }); return { ok: true }; }
  if (!I.os) { I.screen = "nodevice"; return { ok: false }; }
  if (I.oobe && I.oobe.step !== "done") { I.screen = "oobe-" + I.oobe.step; return { ok: true }; }
  /* an in-place upgrade finishes at the restart after its files are copied */
  if (I.up && I.up.copied && !I.up.applied) { const r = applyUpgrade(m); if (r) return r; }
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
/* ---------------------------------------- upgrading Windows in place */
/* PC Health Check: Windows 11's requirements, read from the PC as it is */
export function health(m) { const rows = requirements(m), ok = rows.every(function (r) { return r.ok; }); hist(m, "health", { ok: ok }); return { ok: ok, rows: rows }; }
/* setup.exe from the installer USB, run inside Windows: it checks the
   requirements first, then asks what to keep */
export const KEEP = { all: "Keep personal files and apps", files: "Keep personal files only", nothing: "Nothing" };
export function upgrade(m, op, d) {
  const I = m.inst; d = d || {};
  if (op === "start") {
    if (!I.media) return { ok: false };
    if (!meets(m)) { I.up = { step: "blocked" }; hist(m, "up-blocked"); return { ok: false, blocked: true, rows: requirements(m).filter(function (r) { return !r.ok; }) }; }
    I.up = { step: "terms" }; hist(m, "up-start"); return { ok: true };
  }
  const U = I.up; if (!U) return { ok: false };
  if (op === "terms") { U.step = "keep"; hist(m, "up-terms"); return { ok: true }; }
  if (op === "keep") { if (!KEEP[d.keep]) return { ok: false }; U.keep = d.keep; U.step = "ready"; hist(m, "up-keep", { keep: d.keep }); return { ok: true, keep: d.keep }; }
  if (op === "back") { if (U.step === "ready") U.step = "keep"; else if (U.step === "keep") U.step = "terms"; return { ok: true }; }
  if (op === "install") { if (U.step !== "ready") return { ok: false }; U.copied = true; U.step = "restart"; hist(m, "up-install", { keep: U.keep }); return { ok: true }; }
  if (op === "close") { if (!U.copied) I.up = null; return { ok: true }; }
  return { ok: false };
}
function applyUpgrade(m) {
  const I = m.inst, U = I.up; U.applied = true;
  const name = I.os.name.replace("Windows 10", "Windows 11");
  I.os = { name: name, version: "24H2" }; m.edition = name; m.version = "24H2"; m.build = "10.0.26100.1742";
  hist(m, "up-applied", { keep: U.keep });
  if (U.keep === "nothing") {
    /* nothing kept: a clean install, back to the first-run setup */
    m.apps = []; m.fs = M.makeFS(m); I.joined = false; I.account = null; I.signedIn = false; m.domain = "WORKGROUP";
    I.oobe = { step: "region" }; I.screen = "oobe-region"; return { ok: true };
  }
  if (U.keep === "files") m.apps = [];
  I.signedIn = false; return null;
}
/* Setup's own restart: the PC goes back through its firmware */
export function restartPC(m) {
  m.inst.screen = "post"; const L = m.inst.lx;
  if (L) { L.signedIn = false; L.ask = null;
    /* a new kernel waiting for a reboot is the one that starts now */
    if (L.apt && L.apt.reboot) { L.kernel = L.apt.newKernel; L.apt.reboot = false; hist(m, "ub-kernel", { kernel: L.kernel }); } }
  hist(m, "restart"); return { ok: true };
}
/* Ubuntu's packages, for a ticket that needs them (FS6): the lists apt
   has (stale until apt update), what can be upgraded, the kernel waiting
   for a reboot, and the next release on offer */
export function aptSetup(m, o) {
  const L = m.inst.lx; L.kernel = o.kernel || LX.kernel; L.release = o.release || LX.release;
  L.apt = { fresh: false, pkgs: JSON.parse(JSON.stringify(o.pkgs || [])), newKernel: o.newKernel, reboot: false, next: o.next || "26.04 LTS", upgraded: 0 };
  return L.apt;
}

/* ----------------------------------------- Disk Management (Windows) */
/* the partitions as Disk Management lists them */
export function volumes(m) {
  const d = m.disks[0]; if (!d) return [];
  return d.parts.map(function (p, i) { return { i: i, kind: p.kind, name: p.kind === "unalloc" ? "Unallocated" : p.letter ? (p.label || (p.kind === "os" ? "" : "")) + " (" + p.letter + ":)" : p.kind === "efi" ? "EFI System Partition" : p.kind === "recovery" ? "Recovery Partition" : p.kind === "msr" ? "Reserved" : p.kind === "linux" ? "(Linux partition)" : p.label || "Partition", fs: p.fs || "", gb: Math.round(p.bytes / GB * 100) / 100, status: p.kind === "unalloc" ? "Unallocated" : p.health || "Healthy" }; });
}
function mergeFree(dk) { for (let i = dk.parts.length - 1; i > 0; i--) if (dk.parts[i].kind === "unalloc" && dk.parts[i - 1].kind === "unalloc") { dk.parts[i - 1].bytes += dk.parts[i].bytes; dk.parts.splice(i, 1); } }
/* Windows can shrink a volume only past its last unmovable file: about
   half of its free space here */
export function shrinkMax(m, i) { const p = m.disks[0].parts[i]; if (!p || p.kind !== "os") return 0; const used = (m.inst.usedGB || 180) * GB; return Math.max(0, Math.floor((p.bytes - used) * 0.6 / MB)); }
export function freeGB(m) { const d = m.disks[0]; return d ? Math.max.apply(null, [0].concat(d.parts.filter(function (p) { return p.kind === "unalloc"; }).map(function (p) { return p.bytes / GB; }))) : 0; }
export function shrink(m, i, mb) {
  const dk = m.disks[0], p = dk.parts[i], n = Math.floor(Number(mb));
  if (!p || p.kind !== "os") return { ok: false, text: "Shrink Volume is only available for the Windows volume here." };
  if (!(n > 0)) return { ok: false, typo: true, text: "Enter the amount of space to shrink in MB." };
  if (n > shrinkMax(m, i)) return { ok: false, typo: true, text: "The amount entered is more than the space available to shrink (" + shrinkMax(m, i) + " MB)." };
  p.bytes -= n * MB; dk.parts.splice(i + 1, 0, { kind: "unalloc", bytes: n * MB, fs: "", label: "", letter: "", health: "" }); mergeFree(dk);
  hist(m, "shrink", { mb: n }); return { ok: true, mb: n, text: "C: is " + Math.round(n / 1024) + " GB smaller. The space is now unallocated." };
}
export function newVolume(m, i) {
  const p = m.disks[0].parts[i]; if (!p || p.kind !== "unalloc") return { ok: false };
  p.kind = "data"; p.fs = "NTFS"; p.letter = "D"; p.label = "New Volume"; p.health = "Healthy (Basic Data Partition)"; hist(m, "newvol"); return { ok: true, text: "New Volume (D:) was created and formatted NTFS." };
}
export function deleteVolume(m, i) {
  const dk = m.disks[0], p = dk.parts[i]; if (!p) return { ok: false };
  if (p.kind !== "data") return { ok: false, refused: true, text: p.kind === "os" ? "Windows can't delete the volume it's running from." : "This partition is protected: Disk Management can't delete it." };
  p.kind = "unalloc"; p.fs = ""; p.letter = ""; p.label = ""; p.health = ""; mergeFree(dk); hist(m, "delvol"); return { ok: true, text: "The volume was deleted. The space is unallocated." };
}

/* -------------------------------------------- Ubuntu's installer */
export const LX = { host: "ws3-dev-ubuntu", release: "Ubuntu 24.04.1 LTS", kernel: "6.8.0-45-generic" };
const UB_ORDER = ["try", "lang", "what", "how", "manual", "account", "review", "done"];
export function ub(m, op, d) {
  const I = m.inst, U = I.ub; d = d || {}; I.error = null; if (!U) return { ok: false };
  const go = function (step) { U.step = step; I.screen = "ub-" + step; };
  if (op === "try") { go("lang"); hist(m, "ub-try"); return { ok: true }; }
  if (op === "lang") { go("what"); hist(m, "ub-lang"); return { ok: true }; }
  if (op === "what") { if (d.what !== "install") { I.error = "Try Ubuntu runs it from the USB without changing the PC. Nothing is installed."; return { ok: false, typo: true }; } go("how"); hist(m, "ub-what"); return { ok: true }; }
  if (op === "how") {
    if (d.how === "alongside" && freeGB(m) < 25) { I.error = "There isn't enough unallocated space on this disk to install Ubuntu alongside Windows (25 GB or more)."; return { ok: false, typo: true }; }
    U.how = d.how; U.target = null; if (d.how === "manual") { go("manual"); hist(m, "ub-how", { how: d.how }); return { ok: true }; }
    go("account"); hist(m, "ub-how", { how: d.how }); return { ok: true, how: d.how };
  }
  if (op === "manual") {
    const p = m.disks[0].parts[d.i];
    if (!p) { I.error = "Select a partition or free space."; return { ok: false, typo: true }; }
    if (d.mount !== "/") { I.error = "Ubuntu needs a root partition: set its mount point to /."; return { ok: false, typo: true }; }
    if (d.fs !== "ext4") { I.error = "The root file system (/) must be a Linux file system, such as ext4."; return { ok: false, typo: true }; }
    if (p.kind !== "unalloc" && p.kind !== "os" && p.kind !== "data") { I.error = "That partition is needed to start the PC: choose another."; return { ok: false, typo: true }; }
    U.target = d.i; go("account"); hist(m, "ub-manual", { i: d.i, kind: p.kind }); return { ok: true, overWindows: p.kind === "os" };
  }
  if (op === "account") {
    const host = String(d.host || "").trim(), user = String(d.user || "").trim();
    if (!String(d.name || "").trim()) { I.error = "Enter your name."; return { ok: false, typo: true }; }
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(host)) { I.error = "A computer name can use lower-case letters, numbers and hyphens, and can't start or end with a hyphen."; return { ok: false, typo: true }; }
    if (!/^[a-z][a-z0-9_-]{0,31}$/.test(user)) { I.error = "A username must start with a lower-case letter, and can use lower-case letters, numbers, hyphens and underscores."; return { ok: false, typo: true }; }
    if (!d.pass) { I.error = "Choose a password."; return { ok: false, typo: true }; }
    U.host = host; U.user = user; go("review"); hist(m, "ub-account", { host: host, user: user }); return { ok: true, host: host };
  }
  if (op === "back") { const i = UB_ORDER.indexOf(U.step); let to = UB_ORDER[i - 1]; if (to === "manual" && U.how !== "manual") to = "how"; if (i > 0) go(to); return { ok: true }; }
  if (op === "install") {
    const dk = m.disks[0];
    if (U.how === "erase") {
      /* the whole disk: a new EFI partition and Ubuntu; Windows is gone */
      dk.parts = [{ kind: "efi", bytes: 1073741824, fs: "FAT32", label: "", letter: "", health: "Healthy (EFI System Partition)" }, { kind: "linux", bytes: dk.bytes - 1073741824, fs: "ext4", label: "", letter: "", health: "Healthy" }];
      I.os = null; I.signedIn = false;
    } else {
      let i = U.how === "manual" ? U.target : dk.parts.reduce(function (b, p, k) { return p.kind === "unalloc" && (b < 0 || p.bytes > dk.parts[b].bytes) ? k : b; }, -1);
      const p = dk.parts[i]; if (!p) return { ok: false };
      if (p.kind === "os") { I.os = null; I.signedIn = false; }
      p.kind = "linux"; p.fs = "ext4"; p.letter = ""; p.label = ""; p.health = "Healthy";
    }
    I.lx = { installed: true, host: U.host, user: U.user, signedIn: false };
    if (I.fw.order.indexOf("ubuntu") < 0) I.fw.order.unshift("ubuntu");
    U.copied = true; go("done"); hist(m, "ub-install", { how: U.how, windows: !!I.os });
    return { ok: true, text: "Ubuntu 24.04 LTS is installed and ready to use." };
  }
  if (op === "restart") { I.screen = "ub-remove"; hist(m, "ub-restart"); return { ok: true }; }
  return { ok: false };
}
/* GRUB's menu: Ubuntu, and Windows if it's still on the disk */
export function grubEntries(m) { const e = [["ubuntu", "Ubuntu"], ["advanced", "Advanced options for Ubuntu"]]; if (m.inst.os) e.push(["windows", "Windows Boot Manager (on /dev/nvme0n1p1)"]); e.push(["firmware", "UEFI Firmware Settings"]); return e; }
export function grub(m, pick) {
  const I = m.inst; hist(m, "grub", { pick: pick });
  if (pick === "ubuntu" || pick === "advanced") { I.screen = I.lx.signedIn ? "ub-desktop" : "ub-login"; return { ok: true }; }
  if (pick === "windows") { I.screen = null; return bootFrom(m, "disk"); }
  if (pick === "firmware") return key(m, "F2");
  return { ok: false };
}
export function lxSignIn(m) { const I = m.inst; I.lx.signedIn = true; I.screen = "ub-desktop"; hist(m, "ub-signin"); return { ok: true }; }
/* Ubuntu's Terminal: the commands a technician checks an install with */
export function lxCmd(m, line) {
  const I = m.inst, L = I.lx, raw = String(line || "").trim(), c = raw.replace(/\s+/g, " ");
  hist(m, "ub-cmd", { line: c.toLowerCase() });
  const dk = m.disks[0], gb = function (b) { return Math.round(b / GB) + "G"; };
  if (!c && !L.ask) return "";
  const REL = L.release || LX.release, KER = L.kernel || LX.kernel;
  /* a question the last command asked: apt's Y/n, the release upgrade's y/N */
  if (L.ask) { const a = c.toLowerCase(), q = L.ask; L.ask = null;
    if (q === "upgrade") { if (a === "" || a === "y" || a === "yes") return aptApply(m); return "Abort."; }
    if (q === "release") { if (a === "y" || a === "yes") return releaseUp(m); return "Upgrade cancelled. Your system is unchanged."; } }
  if (c === "lsb_release -a") return "No LSB modules are available.\nDistributor ID:\tUbuntu\nDescription:\t" + REL + "\nRelease:\t" + REL.match(/\d+\.\d+/)[0] + "\nCodename:\t" + (/26\.04/.test(REL) ? "resolute" : "noble");
  if (c === "uname -r") return KER;
  if (c === "hostname" || c === "hostnamectl") return c === "hostname" ? L.host : " Static hostname: " + L.host + "\nOperating System: " + REL + "\n          Kernel: Linux " + KER;
  const hn = c.match(/^(sudo )?hostnamectl (set-hostname|hostname) (\S+)$/);
  if (hn) { if (!hn[1]) return "Could not set static hostname: Access denied"; if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(hn[3])) return "Invalid hostname '" + hn[3] + "'"; L.host = hn[3]; hist(m, "ub-hostname", { host: hn[3] }); return ""; }
  if (c === "whoami") return L.user;
  if (c === "pwd") return "/home/" + L.user;
  if (c === "ls") return "Desktop  Documents  Downloads  Music  Pictures  Public  Templates  Videos";
  if (c === "lsblk" || c === "lsblk -f") { let n = 0; return "NAME          SIZE TYPE MOUNTPOINTS\nnvme0n1     " + gb(dk.bytes) + " disk\n" + dk.parts.filter(function (p) { return p.kind !== "unalloc"; }).map(function (p) { n++; return "├─nvme0n1p" + n + "  " + gb(p.bytes).padStart(5) + " part " + (p.kind === "efi" ? "/boot/efi  (vfat)" : p.kind === "linux" ? "/  (ext4)" : p.kind === "os" ? "   (ntfs: Windows)" : p.kind === "recovery" ? "   (ntfs: Recovery)" : "   (" + (p.fs || "").toLowerCase() + ")"); }).join("\n"); }
  if (c === "df -h" || c === "df -h /") { const p = dk.parts.filter(function (x) { return x.kind === "linux"; })[0]; return "Filesystem      Size  Used Avail Use% Mounted on\n/dev/nvme0n1p" + (dk.parts.indexOf(p) + 1) + "   " + gb(p.bytes) + "  9.8G  " + gb(p.bytes - 10.5 * GB) + "  11% /"; }
  if (L.apt) { const r = aptCmd(m, c); if (r != null) return r; }
  if (/^sudo apt(-get)? update$/.test(c)) return "Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease\nReading package lists... Done\nAll packages are up to date.";
  if (/^sudo apt(-get)? (full-)?upgrade( -y)?$/.test(c)) return "Reading package lists... Done\nCalculating upgrade... Done\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.";
  if (/^apt(-get)? (update|upgrade)/.test(c)) return "E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock, are you root?";
  if (c === "clear") return "\f";
  if (c === "help") return "Try: lsb_release -a · uname -r · hostnamectl · lsblk · df -h · whoami · sudo apt update";
  if (c === "reboot" || c === "sudo reboot") { restartPC(m); return ""; }
  return c.split(" ")[0] + ": command not found";
}

/* apt, and the release upgrade, on a ticket's Ubuntu */
function aptCmd(m, c) {
  const L = m.inst.lx, A = L.apt;
  if (/^(apt|apt-get) (update|upgrade|full-upgrade|dist-upgrade)/.test(c)) return "E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?";
  if (/^sudo apt(-get)? update$/.test(c)) {
    A.fresh = true; hist(m, "ub-apt-update");
    return "Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease\nGet:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]\nGet:3 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]\nFetched 1,203 kB in 2s (601 kB/s)\nReading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\n" + (A.pkgs.length ? A.pkgs.length + " packages can be upgraded. Run 'apt list --upgradable' to see them." : "All packages are up to date.");
  }
  if (/^(sudo )?apt list --upgradable$/.test(c)) { hist(m, "ub-apt-list"); return "Listing... Done" + (A.fresh ? A.pkgs.map(function (p) { return "\n" + p.name + "/noble-updates,noble-security " + p.to + " amd64 [upgradable from: " + p.from + "]"; }).join("") : ""); }
  const up = c.match(/^sudo apt(-get)? (upgrade|full-upgrade|dist-upgrade)( -y)?$/);
  if (up) {
    hist(m, "ub-apt-upgrade", { fresh: A.fresh });
    const head = "Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\nCalculating upgrade... Done\n";
    if (!A.fresh || !A.pkgs.length) return head + "0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.";
    if (up[3]) return head + aptApply(m);
    L.ask = "upgrade";
    return head + "The following packages will be upgraded:\n  " + A.pkgs.map(function (p) { return p.name; }).join(" ") + "\n" + A.pkgs.length + " upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\nNeed to get 184 MB of archives.\nDo you want to continue? [Y/n]";
  }
  if (/^(sudo )?cat \/var\/run\/reboot-required$/.test(c)) return A.reboot ? "*** System restart required ***" : "cat: /var/run/reboot-required: No such file or directory";
  if (c === "do-release-upgrade") return "You need to be root to run this application";
  if (c === "sudo do-release-upgrade") { L.ask = "release"; hist(m, "ub-release-ask"); return "Checking for a new Ubuntu release\nNew release '" + A.next + "' available.\n\nDo you want to start the upgrade?\n\nThis upgrades the whole system to Ubuntu " + A.next + ": a new release, with new versions of every package.\n\nContinue [yN]"; }
  if (/^df -ht( \/)?$/i.test(c)) { const dk = m.disks[0], p = dk.parts.filter(function (x) { return x.kind === "linux"; })[0]; return "Filesystem     Type  Size  Used Avail Use% Mounted on\n/dev/nvme0n1p" + (dk.parts.indexOf(p) + 1) + " ext4  " + Math.round(p.bytes / GB) + "G  9.8G  " + Math.round(p.bytes / GB - 10.5) + "G  11% /\n/dev/nvme0n1p1 vfat  100M   34M   67M  34% /boot/efi"; }
  return null;
}
function aptApply(m) {
  const L = m.inst.lx, A = L.apt, n = A.pkgs.length, kern = A.pkgs.some(function (p) { return /^linux-image/.test(p.name); });
  A.pkgs = []; A.upgraded += n; if (kern) A.reboot = true; hist(m, "ub-apt-applied", { n: n, kernel: kern });
  return A.pkgs.length === 0 && n ? "Setting up openssl (3.0.13-0ubuntu3.5) ...\nSetting up " + (kern ? "linux-image-" + A.newKernel + " (" + A.newKernel.replace("-generic", "") + ") ...\n" : "") + "Processing triggers for man-db (2.12.0-4build2) ...\n" + n + " upgraded, 0 newly installed, 0 to remove and 0 not upgraded." + (kern ? "\n\nPending kernel upgrade!\n\nRunning kernel version:\n  " + L.kernel + "\n\nDiagnostics:\n  The currently running kernel version is not the expected kernel version " + A.newKernel + ".\n\nRestarting the system to load the new kernel will not be handled automatically, so you should consider rebooting." : "") : "0 upgraded.";
}
function releaseUp(m) {
  const L = m.inst.lx, A = L.apt; L.release = "Ubuntu " + A.next.replace(" LTS", "") + " LTS"; A.pkgs = []; A.reboot = true; A.newKernel = "6.17.0-5-generic"; hist(m, "ub-release", { to: A.next });
  return "Reading cache\nChecking package manager\nUpdating repository information\nCalculating the changes\nFetching and installing the upgrade (1,904 packages)\n\nSystem upgrade is complete.\n\nRestart required\nTo finish the upgrade, a restart is required.";
}

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
