/* =====================================================================
   Extra training: File systems (Operating systems), "handling file
   systems, updates, and OS upgrades". Six tickets, each turning on a
   different real decision:
     FS1  crawl  a 6 GB video won't go on a FAT32 stick that a Mac must
                 also write to: save what's on it, format it exFAT
     FS4  run    a FAT32 data drive with years of files and nowhere to
                 park them: CONVERT it to NTFS in place, never format
   (FS2, FS3, FS5 and FS6 follow: updates, rolling one back, an edition
   upgrade, and updating Linux.)
   ===================================================================== */
import * as FX from "./fsys.js";

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

export const FILES_TICKETS = [FS1, FS4];
