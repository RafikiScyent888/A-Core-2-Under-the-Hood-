/* =====================================================================
   Extra training: File systems (Operating systems), "handling file
   systems, updates, and OS upgrades". Six tickets, each turning on a
   different real decision:
     FS1  crawl  a 6 GB video won't go on a FAT32 stick that a Mac must
                 also write to: save what's on it, format it exFAT
     FS2  walk   updates paused for weeks: resume, install what policy
                 allows (not the optional driver, not the feature update),
                 active hours that cover the reception desk, restart, check
     FS3  run    last night's update broke LabelPro: take that one update
                 off, pause so it can't come straight back, test, escalate
                 so Tier 2 blocks it everywhere
     FS4  run    a FAT32 data drive with years of files and nowhere to
                 park them: CONVERT it to NTFS in place, never format
     FS5  run    a warranty replacement came with Windows 11 Home, which
                 can't join the domain: an edition upgrade with the
                 company's key (not the Store, not the generic key), then
                 the join, each finishing at a restart
     FS6  run    Dev's Ubuntu: apt update, then apt upgrade, reboot for the
                 new kernel and check it; never do-release-upgrade mid-project
   ===================================================================== */
import * as FX from "./fsys.js";
import * as WU from "./winupdate.js";
import * as M from "./machine.js";
import { APPS } from "./fleet.js";
import * as ED from "./edition.js";
import * as INS from "./install.js";

function opt(label, correct, why) { return { label: label, correct: !!correct, why: why || "" }; }
const FILES = { topic: "File systems", domain: "Operating systems", objective: "handling file systems, updates, and OS upgrades", kind: "files", extra: true, tier: 1, outcome: "resolve", category: "Operating systems › File systems" };
const GB = 1073741824;
function anywhere(m, under, name) { const n = name.toLowerCase(); return Object.keys(m.fs).some(function (k) { return k.indexOf(under.toLowerCase()) === 0 && m.fs[k].files.some(function (f) { return f.name.toLowerCase() === n; }); }); }
function onDrive(m, L, name) { return FX.filesOn(m, L).some(function (f) { return f.name.toLowerCase() === name.toLowerCase(); }); }
function formatOf(act) { return act.type === "fx-format" ? { fs: act.fs, ok: act.res && act.res.ok } : act.type === "cmd" && act.res && act.res.fx && act.res.fx.op === "format" ? { fs: act.res.fx.fs, ok: true } : null; }
function deleting(act) { return act.type === "cmd" && /^\s*(del|erase)\b/i.test(act.line || ""); }

/* ------------------------------------------------ FS1 (crawl): the stick */
const B = "C:\\Users\\bsmith", VIDEO = "Showroom tour.mp4", KEEP = ["Client pitch.pptx", "Price list 2026.xlsx"];
function safe1(m, name) { return anywhere(m, B, name) || onDrive(m, "E", name); }
export function fs1Stage(m) {
  FX.ready(m); const d = FX.drive(m, "E");
  if (!d || KEEP.some(function (n) { return !safe1(m, n); })) return "lost";
  if (d.fs === "FAT32") return KEEP.every(function (n) { return anywhere(m, B, n); }) ? "format" : "save";
  if (d.fs === "NTFS") return "ntfs";
  if (KEEP.some(function (n) { return !onDrive(m, "E", n); })) return "back";
  if (!onDrive(m, "E", VIDEO)) return "video";
  return "done";
}
const ORDER1 = ["save", "format", "back", "video", "done"];

export const FS1 = Object.assign({}, FILES, {
  id: "FS1", machine: "WS2",
  title: "The showroom video won't go on my USB stick",
  from: "Brenda Smith, Sales",
  brief: ["Hi, Brenda here. I need the showroom tour video (it's on my desktop) on my USB stick for tomorrow, and Windows says the file is too large. The stick is 32 GB and nearly empty! The video's only about 6 GB.",
    "Tomorrow I'm presenting from the client's laptop, which is a Mac. Their marketing team will then put their edited cut of the video back on my stick from that Mac, and I'll play it at the trade stand on our Windows laptop on Friday.",
    "Please don't lose my client pitch and the price list that are on the stick: I need those too, and I haven't got them anywhere else.",
    "Mason's note on the ticket: no new sticks this week; sort out the one she has. The stick is plugged into her PC."],
  setup: function (fleet) {
    const m = FX.ready(fleet.WS2);
    FX.addDrive(m, { letter: "E", label: "SALES", fs: "FAT32", gb: 28.8, removable: true, files: [{ dir: "", name: "Client pitch.pptx", size: 318767104 }, { dir: "", name: "Price list 2026.xlsx", size: 2097152 }] });
    m.fs[(B + "\\Desktop").toLowerCase()].files.push({ name: VIDEO, size: 6657199308 });
  },
  stage: function (fleet) { return fs1Stage(fleet.WS2); },
  goal: function (fleet) { return fs1Stage(fleet.WS2) === "done"; },
  scoreFn: function (fleet) { const s = fs1Stage(fleet.WS2); return s === "ntfs" ? ORDER1.indexOf("format") : Math.max(0, ORDER1.indexOf(s)); },
  notReady: function (fleet) {
    const s = fs1Stage(fleet.WS2);
    if (s === "lost") return "Brenda: \"Where are my pitch and my price list? They were on the stick!\"";
    if (s === "ntfs") return "Brenda tries the stick on a Mac in the office: it opens, but nothing can be saved to it.";
    if (s === "back") return "Brenda: \"The video's there, but where are my pitch and price list?\"";
    return "Brenda looks at the stick: the showroom video still isn't on it.";
  },
  judge: function (act, fleet) {
    if (act.machine && act.machine !== "WS2") return { guess: false };
    const m = fleet.WS2, f = formatOf(act);
    if (f && f.ok) {
      if (fs1Stage(m) === "lost") return { guess: true, say: "Formatting erased everything on the stick, and her pitch and price list were only there. Revert to your last snapshot: copy her files somewhere safe before you format." };
      if (f.fs === "FAT32") return { guess: true, say: "FAT32 again: an empty FAT32 stick still can't hold a file of 4 GB or more." };
      if (f.fs === "NTFS") return { guess: true, say: "NTFS takes the 6 GB video, but a Mac can only read NTFS. The client's team couldn't save their edit back to the stick from their Mac." };
      return { guess: false };
    }
    if (deleting(act) && fs1Stage(m) === "lost") return { guess: true, say: "That deleted one of her files from the stick, and it was the only copy. Revert to your last snapshot." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      save: ["Read the stick's properties: what kind of drive is it, under the hood?", "Changing a drive's file system starts it again, empty. Anything you need from it has to be somewhere else first."],
      format: ["Her files are safe. Now think about what the stick has to do on both of the computers Brenda named.", "One file system on a stick holds big files and can be written by both Windows and a Mac."],
      ntfs: ["Read Brenda's message again: what does the client's team need to do on their Mac?", "Some file systems a Mac can read but never write to."],
      back: ["The stick is ready. What was on it before?", "A format leaves a drive empty: whatever you saved elsewhere goes back afterwards."],
      video: ["Try the job she asked for in the first place.", "With the file-size limit gone, the copy that failed at the start should work."],
      lost: ["Where are her pitch and price list now?", "Nothing comes back from a formatted drive at Tier 1: go back to the last point where her files were safe."],
      done: ["The stick has everything on it. Close the ticket.", "The close question is about which file system you chose and why."]
    };
    return H[fs1Stage(fleet.WS2)];
  },
  moves: function (fleet) {
    const X = {
      save: [opt("Copy her pitch and price list off the stick to her Desktop", true),
        opt("Format the stick straight away: it's nearly empty", false, "Her pitch and price list are on it, and nowhere else."),
        opt("Delete the pitch to make room for the video", false, "There's 28 GB free: space isn't the problem, and it's her only copy."),
        opt("Copy the video in two halves", false, "Each half still won't play as one video, and the client needs one file."),
        opt("Compress the video into a zip file first", false, "Video barely compresses: it's still over 4 GB."),
        opt("Run chkdsk on the stick to fix the error", false, "Nothing's broken: it's the file system's limit.")],
      format: [opt("Format the stick as exFAT", true),
        opt("Format the stick as NTFS", false, "A Mac can only read NTFS: the client couldn't save their edit to it."),
        opt("Format it as FAT32 with a quick format", false, "Still FAT32: the 4 GB limit stays."),
        opt("Convert it to NTFS with the convert command", false, "Still NTFS: read-only on a Mac."),
        opt("Buy a bigger stick", false, "Size isn't the problem, and Mason said no new sticks."),
        opt("Escalate to Tier 2", false, "A Tier 1 job: choose the right file system.")],
      ntfs: [opt("Format the stick again, as exFAT", true),
        opt("Leave it: the Mac can play the video", false, "It can read it, but the client must save their edit back to it."),
        opt("Format it as FAT32", false, "The 4 GB limit is back."),
        opt("Convert it back to FAT32", false, "Convert only goes to NTFS, and FAT32 can't hold the video."),
        opt("Install an NTFS driver on the client's Mac", false, "Not our Mac, and not ours to change."),
        opt("Escalate to Tier 2", false, "Format it again: you saved her files.")],
      back: [opt("Copy her pitch and price list back onto the stick", true),
        opt("Leave them on her Desktop", false, "She needs them on the stick tomorrow."),
        opt("Format it again to be sure", false, "It's right now; it would only empty it."),
        opt("Copy the whole Desktop to the stick", false, "Only her two files go back."),
        opt("Email them to her instead", false, "She asked for them on the stick."),
        opt("Escalate to Tier 2", false, "Just copy them back.")],
      video: [opt("Copy the showroom video onto the stick", true),
        opt("Format the stick again", false, "It's ready, with her files on it."),
        opt("Shrink the video first", false, "exFAT holds it as it is."),
        opt("Copy it to her Documents instead", false, "It has to go on the stick."),
        opt("Resolve: the stick is ready", false, "The video isn't on it yet."),
        opt("Escalate to Tier 2", false, "Just copy it.")],
      lost: [opt("Revert to your last snapshot, then copy her files off first", true),
        opt("Run chkdsk /r to get the files back", false, "chkdsk repairs a file system; it doesn't undo a format."),
        opt("Ask Brenda to rewrite the pitch", false, "Don't make the user pay for it."),
        opt("Look in the Recycle Bin", false, "Formatting doesn't use the Recycle Bin."),
        opt("Format it again to recover them", false, "That erases it again."),
        opt("Resolve and tell her they were lost", false, "Revert puts them back.")],
      done: [opt("Resolve the ticket", true),
        opt("Format it again to be safe", false, "It would erase everything."),
        opt("Convert it to NTFS", false, "The Mac couldn't write to it."),
        opt("Delete her pitch to free space", false, "She needs it."),
        opt("Escalate", false, "It's done."),
        opt("Copy the video to C: as well", false, "Not asked for.")]
    };
    return X[fs1Stage(fleet.WS2)];
  },
  closeWhere: "Think about both computers the stick has to work on, and what each must do with it.",
  close: { prompt: "Brenda asks: \"Why exFAT? My PC uses NTFS.\"", options: [
    opt("A Mac can write to exFAT, but it can only read NTFS", true),
    opt("NTFS can't hold a single file bigger than 4 GB either", false, "That's FAT32's limit. NTFS holds files far bigger than her video."),
    opt("Windows won't format a USB stick as NTFS at all", false, "It will: NTFS was in the list. A Mac just can't write to it."),
    opt("exFAT encrypts the stick, so it's safer to carry about", false, "exFAT doesn't encrypt anything."),
    opt("exFAT is the only file system for sticks of 32 GB", false, "FAT32 and NTFS were both offered for her stick."),
    opt("NTFS would make the stick too slow to play a video from", false, "Speed isn't why: it's what the Mac can do with it.")] },
  note: { must: [["fat32"], ["4 gb", "4gb", "4 gigabyte"], ["exfat"], ["mac"], ["copied", "saved", "backed up", "moved"]],
    tip: "Why the copy failed (the stick's file system and its limit), how you kept her files safe, the file system you chose and why (the Mac), and that the video and her files are on it." },
  adviceStart: "Connect to Brenda's PC from the ticket, and look before you change anything: try the copy she tried, and look at the stick itself.",
  adviceWork: "Read Brenda's message again: there are two computers the stick must work on, and two files on it she can't lose."
});

/* ---------------------------------- FS4 (run): a FAT32 drive, converted */
const F = "C:\\Users\\finance", ARCH = "Audit-2026-archive.zip";
const AUDIT = [["Finance\\Audit 2023", "Ledger-2023.xlsx"], ["Finance\\Audit 2023", "Receipts-2023.zip"], ["Finance\\Audit 2024", "Ledger-2024.xlsx"], ["Finance\\Audit 2024", "Receipts-2024.zip"], ["Finance\\Audit 2025", "Ledger-2025.xlsx"], ["Finance\\Audit 2025", "Receipts-2025.zip"]];
export function fs4Stage(m) {
  FX.ready(m); const d = FX.drive(m, "D");
  if (!d || AUDIT.some(function (a) { return !onDrive(m, "D", a[1]); })) return "lost";
  if (d.fs !== "NTFS") return "convert";
  if (!onDrive(m, "D", ARCH)) return "copy";
  return "done";
}
const ORDER4 = ["convert", "copy", "done"];

export const FS4 = Object.assign({}, FILES, {
  id: "FS4", machine: "WS4",
  title: "The auditors' archive won't copy to my D: drive",
  from: "Farah Nkemelu, Finance",
  brief: ["Hi, Farah again. The auditors sent this year's archive, Audit-2026-archive.zip, about 5.4 GB, and it's in my Downloads. When I copy it to my D: drive, Windows says it's too large, but D: has over 300 GB free.",
    "Mason also says that next week the Finance folder on D: has to be locked down so only Finance can open it, and when he looked, there was no Security tab to do it with.",
    "Please be careful with D:. Every audit since 2023 is on it, and there's no other copy.",
    "Mason's note: D: is the old drive from Farah's last PC. There's nowhere to put 160 GB of audit files while you work: FS01 is full until the new disks come."],
  setup: function (fleet) {
    const m = FX.ready(fleet.WS4);
    FX.addDrive(m, { letter: "D", label: "DATA", fs: "FAT32", gb: 465, removable: false, files: AUDIT.map(function (a, i) { return { dir: a[0], name: a[1], size: (i % 2 ? 26 : 1.5) * GB }; }) });
    m.fs[(F + "\\Downloads").toLowerCase()].files.push({ name: ARCH, size: 5798205849 });
  },
  stage: function (fleet) { return fs4Stage(fleet.WS4); },
  goal: function (fleet) { return fs4Stage(fleet.WS4) === "done"; },
  scoreFn: function (fleet) { return Math.max(0, ORDER4.indexOf(fs4Stage(fleet.WS4))); },
  notReady: function (fleet) {
    const s = fs4Stage(fleet.WS4);
    if (s === "lost") return "Farah opens D: \"Where are my audit folders?\"";
    if (s === "copy") return "Farah looks on her D: drive: the auditors' archive isn't there yet.";
    return "Farah tries the copy again: \"It still says the file is too large.\"";
  },
  judge: function (act, fleet) {
    if (act.machine && act.machine !== "WS4") return { guess: false };
    const f = formatOf(act);
    if (f && f.ok) return { guess: true, say: "Formatting made D: a new, empty " + f.fs + " drive: every audit since 2023 is gone, and there was nowhere to save them first. Revert to your last snapshot." };
    if (deleting(act) && fs4Stage(fleet.WS4) === "lost") return { guess: true, say: "That deleted an audit file, the only copy. Revert to your last snapshot." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      convert: ["Look at the drive's properties, and at the size of the file that won't fit.", "Windows can change a FAT32 volume to NTFS in place, keeping its files, from an administrator's command prompt."],
      copy: ["D: has changed. Try the copy Farah tried.", "The limit that stopped the copy belonged to the old file system."],
      lost: ["Where are her audit folders now?", "A format starts a drive again, empty. Go back to the last point where her files were there."],
      done: ["The archive's on D:. Close the ticket.", "The close question is about why you didn't format."]
    };
    return H[fs4Stage(fleet.WS4)];
  },
  moves: function (fleet) {
    const X = {
      convert: [opt("Run convert D: /FS:NTFS in an administrator Command Prompt", true),
        opt("Format D: as NTFS in File Explorer", false, "Formatting erases every audit on it, and there's nowhere to save them."),
        opt("Format D: as exFAT", false, "Erases everything, and exFAT has no Security tab either."),
        opt("Split the archive into 4 GB pieces", false, "The files fit, but there's still no Security tab for Mason."),
        opt("Run chkdsk D: /f to fix the error", false, "Nothing's broken: FAT32 can't hold files of 4 GB or more."),
        opt("Copy the archive to C: and leave D: as it is", false, "It belongs on D:, and D: still can't be locked down.")],
      copy: [opt("Copy the archive to D:", true),
        opt("Run convert again to be sure", false, "It's NTFS already."),
        opt("Format D: now it's NTFS", false, "That would erase it all."),
        opt("Restart the PC first", false, "Not needed: try the copy."),
        opt("Resolve: D: is converted", false, "Farah's archive isn't on it yet."),
        opt("Escalate to Tier 2", false, "Just copy it.")],
      lost: [opt("Revert to your last snapshot", true),
        opt("Run chkdsk /r on D:", false, "It doesn't undo a format."),
        opt("Ask the auditors to resend everything", false, "Years of files: revert puts them back."),
        opt("Restore D: from File History", false, "D: was never in a backup."),
        opt("Format again with Quick Format off", false, "That erases it again, slower."),
        opt("Resolve: the archive will fit now", false, "Her audits are gone.")],
      done: [opt("Resolve the ticket", true),
        opt("Convert it back to FAT32", false, "There's no way back without a format."),
        opt("Format D: to tidy it", false, "It erases it all."),
        opt("Delete the old audits for space", false, "There's plenty of space."),
        opt("Escalate", false, "It's done."),
        opt("Copy the archive to C: too", false, "Not asked for.")]
    };
    return X[fs4Stage(fleet.WS4)];
  },
  closeWhere: "Think about what's on D:, and what each tool does to it.",
  close: { prompt: "Mason asks: \"Why convert, and not format it as NTFS?\"", options: [
    opt("Convert keeps every file on the drive; a format empties it", true),
    opt("Format can't make a drive NTFS: only convert can do that", false, "Format offered NTFS. It would have erased her audits."),
    opt("Convert is faster, and that's the only difference between them", false, "The difference is her files: a format erases them."),
    opt("A format would also have erased C:, as Windows runs from it", false, "A format only touches the drive it's run on."),
    opt("Convert makes a copy of D: before it changes anything", false, "It changes the file system in place. There's no copy."),
    opt("Formatting needs a USB stick to boot from", false, "D: could be formatted from Windows. It would erase it.")] },
  note: { must: [["fat32"], ["4 gb", "4gb", "too large"], ["convert"], ["ntfs"], ["kept", "keeps", "no data", "nothing lost", "intact", "still there", "preserved"], ["security", "permission"]],
    tip: "Why the copy failed, why you didn't format, the command you ran and that the files were kept, the archive copied, and that D: can now take permissions (the Security tab)." },
  adviceStart: "Connect to Farah's PC from the ticket. Try her copy, and look at D: itself before you change anything.",
  adviceWork: "Two things are wrong with D:, and they have the same cause. Read Mason's note again before you choose a tool: what can't you do with her audit files?"
});

/* ------------------------------------------- the updates FS2 and FS3 meet */
export const CU = { kb: "KB5069213", title: "2026-10 Cumulative Update for Windows 11 Version 23H2 for x64-based Systems (KB5069213)", kind: "cumulative", size: "812 MB", build: "10.0.22631.4460", restart: true, uninstall: true };
export const NET = { kb: "KB5069874", title: "2026-10 Cumulative Update for .NET Framework 3.5 and 4.8.1 for Windows 11, version 23H2 (KB5069874)", kind: "dotnet", size: "68 MB", restart: true, uninstall: true };
export const DEF = { kb: "KB2267602", title: "Security Intelligence Update for Microsoft Defender Antivirus - KB2267602 (Version 1.421.1180.0)", kind: "defender", size: "98 MB", restart: false };
export const DRV = { kb: "DRV-5592", title: "Intel Corporation - Display - 31.0.101.5592", kind: "driver", size: "512 MB", restart: true };
export const FEAT = { kb: "FU-24H2", title: "Windows 11, version 24H2", kind: "feature", size: "3.9 GB", restart: true, version: "24H2", build: "10.0.26100.6899" };
function pend(m, kb) { return !!m.wu && m.wu.pending.some(function (u) { return u.kb === kb; }); }
function had(m, kb) { return WU.installed(m, kb) || pend(m, kb); }
function lastEv(m, test) { const e = (m.events || []).filter(test); return e.length ? e[e.length - 1].at : -1; }
function wuOp(act, op) { return act.type === "wu" && act.op === op && act.res && act.res.ok !== false; }

/* -------------------------------------------- FS2 (walk): Rosa's updates */
const NEED = [CU.kb, NET.kb, DEF.kb];
function covers(a) { return a.from < a.to && a.from <= 8 && a.to >= 18; }
export function fs2Stage(m) {
  const w = WU.ready(m).wu;
  if (had(m, FEAT.kb)) return "feature";
  if (had(m, DRV.kb)) return "driver";
  if (w.paused) return "resume";
  if (NEED.some(function (kb) { return !had(m, kb); })) return w.found ? "install" : "check";
  if (!covers(w.active)) return "active";
  if (WU.pendingRestart(m)) return "restart";
  const boot = lastEv(m, function (e) { return e.kind === "wu-boot"; });
  if (lastEv(m, function (e) { return (e.kind === "opened" && e.app === "winver") || (e.kind === "wu-view" && e.view === "history"); }) < boot) return "verify";
  return "done";
}
const ORDER2 = ["resume", "check", "install", "active", "restart", "verify", "done"];

export const FS2 = Object.assign({}, FILES, {
  id: "FS2", machine: "WS5",
  title: "Windows says my PC is missing important security fixes",
  from: "Rosa Ortiz, Reception",
  brief: ["Hi, it's Rosa on reception. Windows Update has a warning that my PC is missing important security and quality fixes. That's probably my fault: I paused updates a couple of weeks ago, because it kept restarting itself in the middle of evening check-ins, always just after five.",
    "Can you get it up to date, and stop it restarting on me while I'm on the desk? I'm away from the desk until one o'clock, so if it needs a restart, now's the time.",
    "Mason's note: company policy for updates is to install the security and quality updates, .NET, and Defender's updates. Optional driver updates and feature updates (new versions of Windows) wait: Tier 2 tests those and rolls them out. Reception is staffed 8:00 to 18:00."],
  setup: function (fleet) {
    const m = fleet.WS5;
    WU.setup(m, { paused: { until: "20 October 2026", weeks: 5 }, lastCheck: "1 September 2026", active: { from: 8, to: 17 }, offer: [CU, NET, DEF, DRV, FEAT],
      history: [{ kb: "KB5063875", title: "2026-08 Cumulative Update for Windows 11 Version 23H2 for x64-based Systems (KB5063875)", kind: "cumulative", date: "12 August 2026" }, { kb: "KB2267602-1415", title: "Security Intelligence Update for Microsoft Defender Antivirus - KB2267602 (Version 1.415.204.0)", kind: "defender", date: "1 September 2026" }] });
    m.clock = "Oct 06 11:20";
  },
  stage: function (fleet) { return fs2Stage(fleet.WS5); },
  goal: function (fleet) { return fs2Stage(fleet.WS5) === "done"; },
  scoreFn: function (fleet) { return Math.max(0, ORDER2.indexOf(fs2Stage(fleet.WS5))); },
  notReady: function (fleet) {
    const s = fs2Stage(fleet.WS5);
    if (s === "feature" || s === "driver") return "Mason: \"That's not on the policy list. Tier 2 hadn't tested it.\"";
    if (s === "restart") return "Windows Update still says a restart is required.";
    if (s === "verify") return "Mason: \"How do you know the updates actually finished?\"";
    if (s === "active") return "Rosa: \"Will it still restart on me at five past five?\"";
    return "Rosa looks at Windows Update: the warning about missing security fixes is still there.";
  },
  judge: function (act, fleet) {
    if (act.machine && act.machine !== "WS5") return { guess: false };
    if (wuOp(act, "install") && act.kind === "driver") return { guess: true, say: "An optional driver update: not on the policy list. Tier 2 tests drivers before they go out, and a bad one can break the display. Revert to your last snapshot." };
    if (wuOp(act, "install") && act.kind === "feature") return { guess: true, say: "A feature update is a new version of Windows. Policy leaves those for Tier 2 to test and roll out. Revert to your last snapshot." };
    if (wuOp(act, "pause")) return { guess: true, say: "Paused again: no security fixes reach the PC while it's paused." };
    if (wuOp(act, "active") && !covers(fleet.WS5.wu.active)) return { guess: true, say: "Reception is staffed 8:00 to 18:00. Outside active hours Windows may restart by itself, so it could still restart during check-ins." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      resume: ["Read the top of Windows Update: why isn't it finding anything new?", "While updates are paused, Windows doesn't look for new ones."],
      check: ["When did Windows last look for updates?", "Settings only lists what Windows found the last time it looked."],
      install: ["Read Mason's note: which kinds of update does policy let you install?", "Routine security and quality fixes go in now; drivers and new versions of Windows wait for testing."],
      active: ["Read Rosa's message again: when did the restarts happen, and when is the desk staffed?", "Windows only restarts by itself outside the hours you mark as active, so those hours must cover the whole staffed day."],
      restart: ["Some of what you installed is still waiting.", "Security and .NET updates finish as the PC starts again."],
      verify: ["How do you know the updates really finished?", "A cumulative update changes the OS build number when it finishes, and the history lists what's really installed."],
      feature: ["Look at what's waiting or installed besides the routine fixes.", "A new version of Windows isn't routine patching here: go back to the last point before it went on."],
      driver: ["Look at what's waiting or installed besides the routine fixes.", "Optional driver updates aren't routine patching here: go back to the last point before it went on."],
      done: ["The updates are in and checked. Close the ticket.", "The close question is about the update you left."]
    };
    return H[fs2Stage(fleet.WS5)];
  },
  moves: function (fleet) {
    const X = {
      resume: [opt("Resume updates in Windows Update", true),
        opt("Download the updates from Microsoft's website", false, "Windows Update does it, once it isn't paused."),
        opt("Run sfc /scannow to fix the warning", false, "Nothing's corrupt: the PC is behind on updates."),
        opt("Wait until the pause ends on 20 October", false, "Two more weeks without security fixes."),
        opt("Install the feature update to catch up", false, "It's paused, and policy leaves feature updates to Tier 2."),
        opt("Escalate to Tier 2", false, "Resuming updates is Tier 1 work.")],
      check: [opt("Press Check for updates", true),
        opt("Restart the PC", false, "Nothing is installed yet to finish."),
        opt("Pause updates again", false, "Then nothing comes in at all."),
        opt("Open Update history", false, "That lists what's installed, not what's waiting."),
        opt("Run gpupdate /force", false, "Group Policy isn't what's holding the updates."),
        opt("Escalate to Tier 2", false, "Just check.")],
      install: [opt("Install the cumulative, .NET and Defender updates", true),
        opt("Install everything listed, the driver and 24H2 too", false, "Drivers and new versions of Windows wait for Tier 2."),
        opt("Install only the Defender update", false, "The security fixes are in the cumulative update."),
        opt("Install the optional Intel display driver", false, "Not on the policy list."),
        opt("Install Windows 11, version 24H2", false, "A new version of Windows: Tier 2 rolls those out."),
        opt("Pause updates for another week", false, "The PC stays behind.")],
      active: [opt("Set active hours from 8:00 to 18:00", true),
        opt("Leave active hours at 8:00 to 17:00", false, "That's why it restarted after five."),
        opt("Set active hours from 9:00 to 17:00", false, "The desk opens at eight and closes at six."),
        opt("Pause updates every afternoon", false, "Then nothing installs."),
        opt("Turn off automatic restarts by disabling Windows Update", false, "Then nothing installs at all."),
        opt("Set active hours from 0:00 to 23:00", false, "Active hours can't be more than 18 hours.")],
      restart: [opt("Restart the PC now, while Rosa's away", true),
        opt("Leave it to restart by itself tonight", false, "She's away now; tonight it may not, and the fixes wait."),
        opt("Check for updates again", false, "They're installed: they need the restart."),
        opt("Shut it down instead", false, "A restart finishes them; she needs the PC back."),
        opt("Pause updates", false, "The installs are waiting for a restart, not a pause."),
        opt("Resolve: they're installed", false, "Not until the restart finishes them.")],
      verify: [opt("Check the OS build in winver, or Update history", true),
        opt("Resolve without checking", false, "Check the update really finished."),
        opt("Check for updates and install everything", false, "The driver and 24H2 stay."),
        opt("Restart again to be sure", false, "Look instead: the build tells you."),
        opt("Run sfc /scannow", false, "That checks system files, not updates."),
        opt("Escalate to Tier 2", false, "You can check it yourself.")],
      feature: [opt("Revert to your last snapshot", true),
        opt("Leave it: newer is better", false, "Policy says Tier 2 tests it first."),
        opt("Uninstall it from Update history", false, "A new version isn't removed like a quality update."),
        opt("Pause updates to stop it", false, "It's already on."),
        opt("Install the driver too", false, "Also not on the list."),
        opt("Resolve and tell Mason", false, "Put it back first.")],
      driver: [opt("Revert to your last snapshot", true),
        opt("Leave it: drivers help", false, "Not tested: not on the policy list."),
        opt("Install 24H2 to fix it", false, "Also not on the list."),
        opt("Pause updates", false, "It's already installed."),
        opt("Restart the PC", false, "That finishes installing it."),
        opt("Resolve and mention it", false, "Put it back first.")],
      done: [opt("Resolve the ticket", true),
        opt("Install 24H2 while you're there", false, "Tier 2 rolls those out."),
        opt("Pause updates again for Rosa", false, "Then the PC falls behind again."),
        opt("Set active hours to 9:00 to 17:00", false, "The desk is staffed 8 to 18."),
        opt("Escalate", false, "It's done."),
        opt("Install the optional driver", false, "Not on the policy list.")]
    };
    return X[fs2Stage(fleet.WS5)];
  },
  closeWhere: "Think about Mason's note, and who decides when a new version of Windows goes out.",
  close: { prompt: "Rosa asks: \"Why didn't you install the Windows 11 24H2 update too? Newer is better, isn't it?\"", options: [
    opt("New versions of Windows wait until Tier 2 has tested them", true),
    opt("24H2 would have wiped her files and her apps as it installed", false, "A feature update keeps files and apps. It waits for testing."),
    opt("Her PC's hardware isn't able to run Windows 11 version 24H2 at all", false, "It was offered, so the PC meets the requirements."),
    opt("Feature updates need a new product key before they can install", false, "They're free on a licensed PC."),
    opt("24H2 would undo the security update installed today", false, "A new version includes the security fixes."),
    opt("Only Windows 11 Home gets feature updates", false, "Every edition gets them.")] },
  note: { must: [["paused", "resumed", "resume"], ["cumulative", "security", "kb5069213"], ["24h2", "feature", "driver", "optional"], ["active hours"], ["restart", "rebooted"], ["build", "4460", "history", "winver"]],
    tip: "That updates were paused and you resumed them, what you installed and what you left (and why), the active hours you set, the restart, and how you checked the build." },
  adviceStart: "Connect to Rosa's PC from the ticket and open Windows Update. Read every line before you press anything.",
  adviceWork: "Mason's note decides what goes on and what waits. Rosa's message holds the reason she paused it: fix that too, or she'll pause it again."
});

/* -------------------------------------- FS3 (run): an update broke LabelPro */
const BAD = CU.kb;
export function fs3Stage(m) {
  const w = WU.ready(m).wu;
  if (had(m, BAD) && w.removing.indexOf(BAD) < 0) return "remove";
  if (w.removing.indexOf(BAD) >= 0) return "restart";
  if (!w.paused) return "pause";
  const boot = lastEv(m, function (e) { return e.kind === "wu-boot"; });
  if (lastEv(m, function (e) { return e.kind === "launch" && e.app === "LabelPro" && e.result === "ok"; }) < boot) return "test";
  return "done";
}
const ORDER3 = ["remove", "restart", "pause", "test", "done"];

export const FS3 = Object.assign({}, FILES, {
  id: "FS3", machine: "WS1", outcome: "escalate",
  title: "LabelPro crashes since this morning",
  from: "John Doe, HR",
  brief: ["John in HR. LabelPro crashes the moment I open it. I print the visitor badges with it, and a group arrives at ten. It was fine yesterday afternoon.",
    "When I got in this morning there was a message that Windows had installed updates overnight and restarted.",
    "Mason's note: Tier 2 approves Windows updates for the whole office. If an update turns out to be the problem, it comes to us with its KB number so we can block it everywhere, once John can work."],
  setup: function (fleet) {
    const m = fleet.WS1;
    const a = Object.assign(M.clone(APPS.LabelPro), { brokenByKb: BAD, brokenModule: "gdiplus.dll" });
    m.apps = m.apps.filter(function (x) { return x.name !== a.name; }).concat([a]); M.placeApp(m.fs, a, m);
    m.build = CU.build;
    WU.setup(m, { lastCheck: "Today, 03:00", history: [
      { kb: "KB5065431", title: "2026-09 Cumulative Update for Windows 11 Version 23H2 for x64-based Systems (KB5065431)", kind: "cumulative", date: "9 September 2026" },
      { kb: "KB2267602-1421", title: DEF.title, kind: "defender", date: "6 October 2026, 03:05" },
      Object.assign({}, NET, { date: "6 October 2026, 03:12" }),
      Object.assign({}, CU, { date: "6 October 2026, 03:12", was: "10.0.22631.4317" })] });
    M.addLog(m, "System", { time: "Oct 06 03:12", source: "WindowsUpdateClient", id: 19, text: "Installation Successful: Windows successfully installed the following update: " + NET.title });
    M.addLog(m, "System", { time: "Oct 06 03:12", source: "WindowsUpdateClient", id: 19, text: "Installation Successful: Windows successfully installed the following update: " + CU.title });
    M.addLog(m, "System", { time: "Oct 06 03:20", source: "Kernel-General", id: 12, text: "The operating system started at system time Oct 06 03:20 (OS Build 22631.4460)." });
    m.clock = "Oct 06 09:15";
  },
  stage: function (fleet) { return fs3Stage(fleet.WS1); },
  goal: function (fleet) { return fs3Stage(fleet.WS1) === "done"; },
  scoreFn: function (fleet) { return Math.max(0, ORDER3.indexOf(fs3Stage(fleet.WS1))); },
  notReady: function (fleet) {
    const s = fs3Stage(fleet.WS1);
    if (s === "test") return "Mason: \"Has John seen LabelPro open since your change?\"";
    if (s === "pause") return "Mason: \"What stops that update going straight back on tonight?\"";
    if (s === "restart") return "John tries LabelPro: it still crashes. Windows Update says a restart is waiting.";
    return "John tries LabelPro: it still crashes.";
  },
  wrongOutcome: function (kind, fleet) {
    if (kind === "escalate") return "Tier 2 sends it back: John still can't print badges. Get him working first.";
    return fs3Stage(fleet.WS1) === "done" ? "Mason: \"John's working, but that update is still approved for every other PC. It comes to us.\"" : "John tries LabelPro: it still crashes.";
  },
  judge: function (act, fleet) {
    if (act.machine && act.machine !== "WS1") return { guess: false };
    if (wuOp(act, "uninstall") && act.kb !== BAD) return { guess: true, say: "That update came off, and LabelPro would still crash: the file it crashes in belongs to a different update." };
    if (wuOp(act, "install") && act.kb === BAD) return { guess: true, say: "That put the update that breaks LabelPro straight back on." };
    if (/^(repair|reinstall)$/.test(act.type) && act.app === "LabelPro") return { guess: true, say: "That rewrote LabelPro's own files, and they were never the problem: it crashes in a Windows file." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      remove: ["Read the crash in the Application log: which file does it name, and which version?", "When a program breaks overnight and an update went on overnight, the update that changed the file it crashes in is the one to take off."],
      restart: ["Read what Windows Update says now.", "Taking an update off finishes as the PC starts again, the same as putting one on."],
      pause: ["The update is off. What does Windows do the next time it checks?", "Windows offers a removed update again; something has to hold it back until Tier 2 has blocked it."],
      test: ["Has LabelPro opened since your change?", "Test the program the user can't work without, before you hand the ticket on."],
      done: ["John can work. Pass it on, as Mason's note says.", "The close question is about why this one doesn't end at Tier 1."]
    };
    return H[fs3Stage(fleet.WS1)];
  },
  moves: function (fleet) {
    const X = {
      remove: [opt("Uninstall KB5069213 from Update history", true),
        opt("Uninstall the .NET update, KB5069874", false, "LabelPro crashes in a Windows file from the cumulative update."),
        opt("Repair LabelPro from Settings", false, "Its own files are fine."),
        opt("Reinstall LabelPro from Software Center", false, "Same files: it still crashes in the Windows file."),
        opt("Run sfc /scannow", false, "The file isn't corrupt: it's the new version."),
        opt("Escalate now, before trying anything", false, "John needs badges at ten: get him working first.")],
      restart: [opt("Restart the PC to finish removing it", true),
        opt("Uninstall it again", false, "It's already waiting for the restart."),
        opt("Repair LabelPro", false, "The update is still in place until the restart."),
        opt("Pause updates and resolve", false, "It isn't off until the restart."),
        opt("Check for updates", false, "That would offer it again."),
        opt("Escalate", false, "Finish it first.")],
      pause: [opt("Pause updates for a week", true),
        opt("Check for updates to be sure", false, "It offers KB5069213 again."),
        opt("Install the updates Windows offers", false, "That puts KB5069213 back."),
        opt("Turn off Windows Update for good", false, "Then no security fixes at all."),
        opt("Delete gdiplus.dll", false, "Windows needs it."),
        opt("Resolve the ticket", false, "Tier 2 still has to block it.")],
      test: [opt("Open LabelPro and check it starts", true),
        opt("Escalate without testing", false, "Check John can work first."),
        opt("Restart again", false, "Test instead."),
        opt("Uninstall the .NET update too", false, "Not involved."),
        opt("Repair LabelPro", false, "Test first."),
        opt("Check for updates", false, "Paused: test LabelPro.")],
      done: [opt("Escalate to Tier 2 with KB5069213", true),
        opt("Resolve the ticket", false, "Every other PC still has it approved."),
        opt("Resume updates", false, "It would come back."),
        opt("Uninstall more updates", false, "Only one was involved."),
        opt("Reinstall LabelPro", false, "It works."),
        opt("Tell John to stop updating", false, "That's Tier 2's call.")]
    };
    return X[fs3Stage(fleet.WS1)];
  },
  closeWhere: "Think about the other PCs in the office.",
  close: { prompt: "Mason asks: \"LabelPro works again. Why escalate instead of resolving it?\"", options: [
    opt("The update is still approved for every PC: Tier 2 blocks it", true),
    opt("Tier 1 isn't allowed to uninstall Windows updates at all", false, "You did, with the administrator's account. Blocking it everywhere is Tier 2's."),
    opt("John needs Tier 2 to reinstall LabelPro for him properly", false, "LabelPro works: its files were never the problem."),
    opt("The .NET update must come off too, and only Tier 2 can do it", false, ".NET wasn't involved, and Tier 1 could remove it."),
    opt("Uninstalling an update voids the Windows licence until Tier 2 fixes it", false, "It doesn't touch the licence."),
    opt("Escalating removes the update from Microsoft's servers", false, "Tier 2 blocks it for our PCs, not for Microsoft.")] },
  note: { must: [["kb5069213"], ["uninstall", "removed"], ["restart", "rebooted"], ["pause"], ["labelpro"], ["works", "opens", "opened", "tested", "starts"], ["tier 2", "escalat", "block"]],
    tip: "What the crash named, the update you removed (its KB) and how you knew, the restart and the pause, that LabelPro opens, and why it goes to Tier 2." },
  adviceStart: "Connect to John's PC from the ticket. See the crash for yourself, then find what Windows recorded about it.",
  adviceWork: "Two things happened overnight: updates went on, and LabelPro broke. Line up the times, and the file the crash names, with what Update history says went on."
});

/* --------------------------------- FS5 (run): Home can't join the domain */
export function fs5Stage(m) {
  const e = ED.ready(m).ed;
  if (e.key === "store" || (e.pending && e.pending.key === "store")) return "store";
  if (ED.home(m) && !e.pending) return "upgrade";
  if (e.pending) return "restart";
  if (!e.activated) return "activate";
  if (!e.joined && !e.joinPending) return "join";
  if (e.joinPending) return "rejoin";
  const boot = lastEv(m, function (x) { return x.kind === "ed-boot" && x.done.indexOf("join") >= 0; });
  if (lastEv(m, function (x) { return x.kind === "opened" && x.app === "sysprot"; }) < boot) return "verify";
  return "done";
}
const ORDER5 = ["upgrade", "restart", "activate", "join", "rejoin", "verify", "done"];

export const FS5 = Object.assign({}, FILES, {
  id: "FS5", machine: "WS5",
  title: "My replacement PC won't let me sign in normally",
  from: "Rosa Ortiz, Reception",
  brief: ["Hi, Rosa again. The vendor swapped my reception PC under warranty yesterday. It works, but I can't sign in with my normal Rafiki password: I'm on a local account the vendor made, and I can't see the shared drives or the badge printer.",
    "Please don't wipe it: I've spent all morning getting it the way I like it.",
    "Mason's note: the licence sheet for that model lists a Windows 11 Pro upgrade key, RFK7P-2QX9M-8TYH4-W6BCD-3JKPV. The PC's local administrator is rafikiadmin (Bench-Tech-2026). PCs join RAFIKI with the itadmin account."],
  setup: function (fleet) {
    const m = fleet.WS5;
    m.edition = "Windows 11 Home"; m.domain = "WORKGROUP"; m.techAccount = { name: "rafikiadmin", password: "Bench-Tech-2026" };
    ED.ready(m); m.ed.edition = "Windows 11 Home"; m.ed.activated = true; m.ed.joined = false;
    m.clock = "Oct 06 10:05";
  },
  stage: function (fleet) { return fs5Stage(fleet.WS5); },
  goal: function (fleet) { return fs5Stage(fleet.WS5) === "done"; },
  scoreFn: function (fleet) { return Math.max(0, ORDER5.indexOf(fs5Stage(fleet.WS5))); },
  notReady: function (fleet) {
    const s = fs5Stage(fleet.WS5);
    if (s === "store") return "Mason: \"Who paid $99.99 in the Store? We already own that licence.\"";
    if (s === "activate") return "Rosa: \"There's a message in Settings saying Windows isn't activated.\"";
    if (s === "verify") return "Mason: \"How do you know it's on the domain?\"";
    return "Rosa tries her Rafiki password: it still isn't accepted on this PC.";
  },
  judge: function (act, fleet) {
    if (act.machine && act.machine !== "WS5") return { guess: false };
    if (act.type === "ed" && act.op === "store") return { guess: true, say: "That spent $99.99 in the Microsoft Store, when Rafiki already owns a Pro upgrade key for this PC (Mason's licence sheet). Revert to your last snapshot." };
    if (act.type === "ed" && act.op === "key" && act.res && act.res.ok && act.res.key === "generic") return { guess: true, say: "That's Microsoft's generic key for Pro: it installs the edition but can't activate it. The licensed key does both." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      upgrade: ["Look at which edition of Windows this PC runs, and what System Properties says when you try to join.", "Some editions of Windows can't join a domain at all, and changing edition doesn't need a reinstall."],
      restart: ["Read the Activation page now.", "An edition change finishes as the PC starts again."],
      activate: ["Read the activation state.", "A key that installs an edition isn't always one that activates it: a licensed key does both."],
      join: ["This edition can join a domain now. Where does a Windows PC join one?", "Joining a domain takes an account allowed to add computers to it, not the PC's own administrator."],
      rejoin: ["Read what Windows said after the join.", "A domain join takes effect as the PC starts again, like the edition change did."],
      verify: ["How do you know it's on the domain now?", "The PC's own system settings show what it's a member of."],
      store: ["Read what was just charged, and to whom.", "Rafiki already owns a licence for this: go back to the last point before the purchase."],
      done: ["It's on the domain. Close the ticket.", "The close question is about why it couldn't join as it came."]
    };
    return H[fs5Stage(fleet.WS5)];
  },
  moves: function (fleet) {
    const X = {
      upgrade: [opt("Change product key in Activation to the Pro key", true),
        opt("Join the domain from System Properties first", false, "Home can't join a domain: it refuses."),
        opt("Reinstall Windows 11 Pro from the USB", false, "Rosa asked you not to wipe it, and an edition upgrade keeps everything."),
        opt("Upgrade in the Microsoft Store app", false, "Rafiki already owns a key for it."),
        opt("Enter the key on the PC's own sticker", false, "That's the Home key it already has."),
        opt("Create Rosa a new local account", false, "She needs her domain account.")],
      restart: [opt("Restart the PC to finish the upgrade", true),
        opt("Join the domain now", false, "It's still Home until the restart."),
        opt("Enter the key again", false, "It's waiting for the restart."),
        opt("Buy Pro in the Store as well", false, "Already paid for."),
        opt("Reinstall Windows", false, "A restart finishes it."),
        opt("Escalate to Tier 2", false, "Just restart.")],
      activate: [opt("Change product key to the company's Pro key", true),
        opt("Leave it unactivated", false, "Settings nags, and it's not licensed."),
        opt("Buy Pro in the Store", false, "Rafiki owns a key."),
        opt("Reinstall Windows 11 Pro", false, "It's Pro already: it needs the right key."),
        opt("Enter the generic key again", false, "It never activates."),
        opt("Join the domain and ignore it", false, "Get it licensed first.")],
      join: [opt("Join RAFIKI in System Properties as itadmin", true),
        opt("Join it as rafikiadmin", false, "A local administrator can't add PCs to the domain."),
        opt("Type RAFIKI as a workgroup name", false, "A workgroup isn't the domain."),
        opt("Map the shared drives by hand", false, "Rosa still can't sign in as herself."),
        opt("Reinstall Windows 11 Pro first", false, "It's Pro and activated."),
        opt("Escalate to Tier 2", false, "Joining a PC is Tier 1 work.")],
      rejoin: [opt("Restart the PC to finish the join", true),
        opt("Join it again", false, "It's waiting for the restart."),
        opt("Resolve now", false, "Not a member until it restarts."),
        opt("Change product key again", false, "The edition's done."),
        opt("Map the drives by hand", false, "Restart instead."),
        opt("Escalate", false, "Just restart.")],
      verify: [opt("Check System Properties shows the RAFIKI domain", true),
        opt("Resolve without checking", false, "Check it's a member first."),
        opt("Join it again to be sure", false, "It's joined: look."),
        opt("Restart again", false, "Look instead."),
        opt("Reinstall to be safe", false, "It's done."),
        opt("Escalate", false, "You can check it.")],
      store: [opt("Revert to your last snapshot", true),
        opt("Keep it: Pro is Pro", false, "Charged to the wrong account, for a licence Rafiki owns."),
        opt("Enter the company key on top", false, "The purchase is already made."),
        opt("Ask Rosa to claim it on expenses", false, "Not how licensing works here."),
        opt("Reinstall Windows", false, "Revert puts it back."),
        opt("Escalate the refund to Tier 2", false, "Revert first.")],
      done: [opt("Resolve the ticket", true),
        opt("Reinstall Windows to tidy up", false, "Rosa asked you not to."),
        opt("Buy a Store licence too", false, "It's activated."),
        opt("Remove rafikiadmin", false, "Not part of this job."),
        opt("Escalate", false, "It's done."),
        opt("Join it to a workgroup", false, "It's on the domain.")]
    };
    return X[fs5Stage(fleet.WS5)];
  },
  closeWhere: "Think about what System Properties said before you changed anything.",
  close: { prompt: "Rosa asks: \"Why couldn't my new PC join the network like my old one did?\"", options: [
    opt("It came with Windows 11 Home, which can't join a domain", true),
    opt("It needed a clean install of Windows before it could ever join", false, "The edition upgrade kept everything. Home was the problem."),
    opt("The vendor's local account had locked it out of the domain", false, "A local account doesn't block a join. The edition did."),
    opt("Only Microsoft's generic Pro key lets a PC join a domain", false, "The generic key doesn't activate. Any Pro edition can join."),
    opt("A new PC must wait a full day before it can join a domain", false, "There's no wait: it joined once it was Pro."),
    opt("Its network cable was in the wrong port on the wall", false, "It was online: Home refused the join.")] },
  note: { must: [["home"], ["pro"], ["product key", "key"], ["activat"], ["rafiki", "domain"], ["restart", "rebooted"]],
    tip: "The edition it came with and why it couldn't join, the key you used (and why not the Store), the restarts, the join and how you checked it." },
  adviceStart: "Connect to Rosa's PC from the ticket. Before changing anything, find out what this PC is: its edition, and what it's a member of.",
  adviceWork: "Mason's note has three things in it, and each is for a different step. Rosa's message rules one tool out."
});

/* ------------------------------------ FS6 (run): Dev's Ubuntu, patched */
const NEWK = "6.8.0-51-generic";
export function fs6Stage(m) {
  const L = m.inst && m.inst.lx; if (!L || !L.apt) return "update";
  if (L.release !== INS.LX.release) return "release";
  if (L.apt.pkgs.length) return L.apt.fresh ? "upgrade" : "update";
  if (L.apt.reboot) return "reboot";
  const k = lastEv(m, function (e) { return e.kind === "inst-ub-kernel"; });
  if (L.kernel !== NEWK || lastEv(m, function (e) { return e.kind === "inst-ub-cmd" && /^uname -r$/.test(e.line); }) < k) return "verify";
  return "done";
}
const ORDER6 = ["update", "upgrade", "reboot", "verify", "done"];

export const FS6 = Object.assign({}, FILES, {
  id: "FS6", machine: "WS3",
  title: "Can you patch my Ubuntu? But not the big upgrade",
  from: "Dev Patel, Dev",
  brief: ["Dev here. The Ubuntu side of my PC hasn't had any updates since you put it on, and it keeps popping up that Ubuntu 26.04 LTS is available.",
    "Please get the security updates on. But don't move me to 26.04: my build tools only support 24.04 until the project ships in December.",
    "I'm at my desk all morning, so come over. Ubuntu doesn't take remote support from your laptop."],
  setup: function (fleet) {
    const m = fleet.WS3; INS.prepare(m, {});
    const d = m.disks[0], os = d.parts.filter(function (p) { return p.kind === "os"; })[0], L100 = 100 * 1073741824;
    os.bytes -= L100; d.parts.splice(d.parts.indexOf(os) + 1, 0, { kind: "linux", bytes: L100, fs: "ext4", label: "", letter: "", health: "Healthy" });
    m.inst.lx = { installed: true, host: "ws3-dev-ubuntu", user: "dev", signedIn: false };
    m.inst.fw.order = ["ubuntu", "disk", "usb", "pxe"];
    INS.aptSetup(m, { kernel: "6.8.0-45-generic", newKernel: NEWK, pkgs: [
      { name: "linux-image-generic", from: "6.8.0-45.45", to: "6.8.0-51.52" }, { name: "openssl", from: "3.0.13-0ubuntu3.4", to: "3.0.13-0ubuntu3.5" },
      { name: "libssl3t64", from: "3.0.13-0ubuntu3.4", to: "3.0.13-0ubuntu3.5" }, { name: "sudo", from: "1.9.15p5-3ubuntu5", to: "1.9.15p5-3ubuntu5.24.04.1" },
      { name: "curl", from: "8.5.0-2ubuntu10.4", to: "8.5.0-2ubuntu10.6" }, { name: "libcurl4t64", from: "8.5.0-2ubuntu10.4", to: "8.5.0-2ubuntu10.6" },
      { name: "python3.12", from: "3.12.3-1ubuntu0.1", to: "3.12.3-1ubuntu0.8" }, { name: "tzdata", from: "2024a-3ubuntu1.1", to: "2025b-0ubuntu0.24.04" },
      { name: "openssh-client", from: "1:9.6p1-3ubuntu13.4", to: "1:9.6p1-3ubuntu13.11" }] });
    m.power = "on"; m.inst.screen = "ub-login";
  },
  stage: function (fleet) { return fs6Stage(fleet.WS3); },
  goal: function (fleet) { return fs6Stage(fleet.WS3) === "done"; },
  scoreFn: function (fleet) { return Math.max(0, ORDER6.indexOf(fs6Stage(fleet.WS3))); },
  notReady: function (fleet) {
    const s = fs6Stage(fleet.WS3);
    if (s === "release") return "Dev: \"It says 26.04! My build tools won't run on this.\"";
    if (s === "reboot") return "Dev: \"There's a message about a pending kernel upgrade.\"";
    if (s === "verify") return "Mason: \"How do you know the new kernel is the one running?\"";
    return "Dev: \"Software Updater still says there are updates waiting.\"";
  },
  judge: function (act, fleet) {
    if (act.machine && act.machine !== "WS3") return { guess: false };
    const m = fleet.WS3, ev = m.events[m.events.length - 1];
    if (act.type === "osinst" && act.op === "ub-cmd" && ev && ev.kind === "inst-ub-release") return { guess: true, say: "That upgraded Ubuntu to a new release, 26.04: every package new. Dev asked for security updates only, and his build tools need 24.04. Revert to your last snapshot." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      update: ["Before installing anything, what does apt know about what's new?", "apt works from its own lists of packages; until they're refreshed, it can't see anything newer."],
      upgrade: ["apt knows what's new now. What actually installs it?", "Refreshing the lists only tells apt what's new; installing it is a separate step."],
      reboot: ["Read the last lines apt printed.", "A new kernel only runs once the PC starts again."],
      verify: ["How do you know the new kernel is the one running?", "The running kernel's version is one command away."],
      release: ["Read what that upgrade did, against what Dev asked for.", "A new release isn't patching: go back to the last point before it."],
      done: ["Patched and checked. Close the ticket.", "The close question is about the two apt steps."]
    };
    return H[fs6Stage(fleet.WS3)];
  },
  moves: function (fleet) {
    const X = {
      update: [opt("Run sudo apt update", true),
        opt("Run sudo apt upgrade straight away", false, "apt's lists are stale: it finds nothing to upgrade."),
        opt("Run sudo do-release-upgrade", false, "That's a new release, 26.04: Dev said not."),
        opt("Run apt update without sudo", false, "Refused: it needs root."),
        opt("Boot Windows and run Windows Update", false, "Windows Update doesn't patch Ubuntu."),
        opt("Reinstall Ubuntu from the USB", false, "It only needs patching.")],
      upgrade: [opt("Run sudo apt upgrade and answer Y", true),
        opt("Run sudo apt update again", false, "The lists are fresh: nothing's installed yet."),
        opt("Run sudo do-release-upgrade", false, "A new release: not what Dev asked for."),
        opt("Answer n when apt asks", false, "Nothing installs."),
        opt("Reboot first", false, "Nothing's installed to finish."),
        opt("Remove the old kernel", false, "Not needed, and it's the one running.")],
      reboot: [opt("Reboot the PC with sudo reboot", true),
        opt("Run sudo apt upgrade again", false, "It's done: the kernel needs a restart."),
        opt("Log out and back in", false, "A kernel only loads as the PC starts."),
        opt("Leave it: the update is installed", false, "The old kernel is still the one running."),
        opt("Run sudo do-release-upgrade", false, "Dev said not."),
        opt("Shut it down for the night", false, "Dev needs it now: a reboot.")],
      verify: [opt("Run uname -r and check it's 6.8.0-51", true),
        opt("Resolve without checking", false, "Check the new kernel is running."),
        opt("Run sudo apt upgrade again", false, "Nothing left to install."),
        opt("Reboot again", false, "Look instead."),
        opt("Run lsb_release -a", false, "That shows the release, not the kernel."),
        opt("Run sudo do-release-upgrade", false, "Never mid-project.")],
      release: [opt("Revert to your last snapshot", true),
        opt("Leave it on 26.04", false, "Dev's build tools need 24.04."),
        opt("Run apt upgrade to undo it", false, "That doesn't go back a release."),
        opt("Reinstall 24.04 from the USB", false, "Revert puts it back, with Dev's work."),
        opt("Reboot it", false, "Still 26.04."),
        opt("Escalate to Tier 2", false, "Revert first.")],
      done: [opt("Resolve the ticket", true),
        opt("Run do-release-upgrade while you're there", false, "Dev said not."),
        opt("Remove the old kernel", false, "Not needed."),
        opt("Reboot again", false, "It's done."),
        opt("Escalate", false, "It's done."),
        opt("Turn off automatic updates", false, "Not asked for.")]
    };
    return X[fs6Stage(fleet.WS3)];
  },
  closeWhere: "Think about what each apt command did to the PC, and what it didn't.",
  close: { prompt: "Dev asks: \"Why did you need both apt update and apt upgrade?\"", options: [
    opt("update refreshes the package lists; upgrade installs the new versions", true),
    opt("update installs the security fixes; upgrade moves to the next Ubuntu release", false, "Moving to a new release is do-release-upgrade. upgrade stays on 24.04."),
    opt("They do the same job; running both of them is just a habit to be safe", false, "upgrade before update found nothing: the lists were stale."),
    opt("update downloads the drivers for Windows; upgrade installs them for Ubuntu", false, "apt only handles Ubuntu's own packages."),
    opt("upgrade needs a restart first, and update does that restart for you", false, "Neither restarts. The kernel needed sudo reboot."),
    opt("update checks the ext4 file system before upgrade is allowed to run", false, "That's fsck's job, not apt's.")] },
  note: { must: [["apt update"], ["apt upgrade", "full-upgrade"], ["kernel"], ["reboot", "restart"], ["uname", "6.8.0-51"], ["26.04", "release"]],
    tip: "The two apt steps and what each did, the kernel and the reboot, how you checked the new kernel, and why you didn't move Dev to 26.04." },
  adviceStart: "Dev's Ubuntu can't be reached by remote support: walk over to his desk. Look at what Ubuntu says before you change anything.",
  adviceWork: "Dev asked for two things: one to do, and one never to do. Read the Terminal's output after every command: it tells you what's still waiting."
});

export const FILES_TICKETS = [FS1, FS2, FS3, FS4, FS5, FS6];
