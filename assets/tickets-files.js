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
   (FS5 and FS6 follow: an edition upgrade, and updating Linux.)
   ===================================================================== */
import * as FX from "./fsys.js";
import * as WU from "./winupdate.js";
import * as M from "./machine.js";
import { APPS } from "./fleet.js";

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

export const FILES_TICKETS = [FS1, FS2, FS3, FS4];
