/* =====================================================================
   Extra training: real-world tickets beyond the sims.

   The owner, 1 October 2026: "It is very important to me to build an all
   inclusive tool that will help them prep for the exam and cover
   everything in Core 2 that they will do in real life." These cover the
   objectives no sim touches. They sit in their own section of the queue,
   and each names the objective it covers (owner's ruling 11).

   X1, the first preview: Backup and recovery (Operational procedures),
   "setting up workstation backups and recovery processes".
   Farah saved last year's budget over this year's. Get yesterday's copy
   back from Previous Versions (System Restore is the near miss: it never
   touches documents), then set up a real backup so it can't cost her a
   day again: File History to the file server, every hour, tested.
   ===================================================================== */
import * as M from "./machine.js";
import * as BK from "./backup.js";

function opt(label, correct, why) { return { label: label, correct: !!correct, why: why || "" }; }
const DOCS = "C:\\Users\\finance\\Documents", FILE = DOCS + "\\Q3-budget.xlsx";

/* The spreadsheet as it was at each point. Its contents are what the
   student reads to tell the copies apart. */
const DOC = {
  q3d1: { id: "q3d1", sheet: "Q3 2026", what: "July and August 2026 only; September not entered yet", total: "$296,410", saved: "26 September 2026 16:40", by: "Farah Nkemelu" },
  q3d2: { id: "q3d2", sheet: "Q3 2026", what: "July to September 2026, before Farah's revisions", total: "$451,900", saved: "29 September 2026 17:05", by: "Farah Nkemelu" },
  q3rev: { id: "q3rev", sheet: "Q3 2026", what: "July to September 2026, with Farah's revisions to travel and software", total: "$447,215", saved: "3 October 2026 11:58", by: "Farah Nkemelu" },
  fy25: { id: "fy25", sheet: "Q3 2025", what: "Last year's figures: July to September 2025", total: "$412,880", saved: "4 October 2026 09:12", by: "Farah Nkemelu" },
  retyped: { id: "retyped", sheet: "Q3 2025", what: "Last year's figures, with some of this year's typed back in from memory", total: "$431,060", saved: "4 October 2026 10:05", by: "Farah Nkemelu" }
};
function snap(id) { const o = {}; o[FILE.toLowerCase()] = { name: "Q3-budget.xlsx", size: 48128, doc: Object.assign({}, DOC[id]) }; return o; }
function cur(m) { const f = BK.fileAt(m, FILE); return f && f.doc ? f.doc.id : null; }
function has(m, kind) { return (m.events || []).some(function (e) { return e.kind === kind; }); }
function lastAt(m, kind) { const e = (m.events || []).filter(function (x) { return x.kind === kind; }); return e.length ? e[e.length - 1].at : -1; }

/* Where the job is, in the order a technician does it. */
export function stage(m) {
  BK.ready(m); const fh = m.bk.fh;
  if (cur(m) !== "q3rev") return "restore";
  if (!fh.target) return "target";
  if (fh.every > 60) return "every";
  if (!fh.on) return "on";
  if (!BK.inBackup(m, FILE)) return "run";
  if (!(fh.checked && lastAt(m, "fh-view") > lastAt(m, "fh-run"))) return "test";
  return "done";
}
const ORDER = ["restore", "target", "every", "on", "run", "test", "done"];

export const EXTRA = [{
  id: "X1", extra: true, topic: "Backup and recovery", domain: "Operational procedures", kind: "backup",
  objective: "setting up workstation backups and recovery processes",
  tier: 1, outcome: "resolve", machine: "WS4",
  category: "Operational procedures › Backup and recovery",
  title: "Saved last year's budget over this year's — need it back today",
  from: "Farah Nkemelu, Finance",
  brief: ["Hi, it's Farah in Finance. Something awful. At about nine this morning I opened last year's Q3 budget to copy the layout, and saved it over this year's Q3-budget.xlsx in my Documents. All my figures are gone. I'd been working on it right up to lunch yesterday, then I was at the bank all afternoon, so everything I did is from before then.",
    "I tried typing some of it back in from memory at ten and saved again, which probably made it worse. The board needs it on Monday.",
    "And please make sure this can't happen to me again. Losing an hour's work I could live with. Losing a day, I couldn't.",
    "Mason's note on the ticket: workstation backups go to the file server's backup share, \\\\FS01\\Backups (Windows makes a folder for each user and PC). Not USB sticks: they walk."],
  setup: function (fleet) {
    const m = BK.ready(fleet.WS4);
    BK.putDoc(m, DOCS, "Q3-budget.xlsx", DOC.retyped);
    BK.putDoc(m, DOCS, "Supplier-list.docx", { id: "sup", sheet: "", what: "Approved suppliers and their contacts", total: "", saved: "12 September 2026 10:20", by: "Farah Nkemelu" }, 22016);
    BK.putDoc(m, DOCS, "Q3-budget-2025.xlsx", { id: "fy25src", sheet: "Q3 2025", what: "Last year's figures: July to September 2025", total: "$412,880", saved: "6 October 2025 15:31", by: "Farah Nkemelu" });
    m.restore.points = [];
    BK.addPoint(m, { name: "Automatic Restore Point", date: "28 September 2026", stamp: "2026-09-28 03:00", snap: snap("q3d1") });
    BK.addPoint(m, { name: "Windows Update", date: "30 September 2026", stamp: "2026-09-30 03:10", snap: snap("q3d2") });
    BK.addPoint(m, { name: "Windows Update", date: "3 October 2026", stamp: "2026-10-03 12:30", snap: snap("q3rev") });
    BK.addPoint(m, { name: "Installed Adobe Acrobat Reader update", date: "4 October 2026", stamp: "2026-10-04 09:40", snap: snap("fy25") });
    m.clock = "Oct 4 11:20";
  },
  goal: function (fleet) { return stage(fleet.WS4) === "done"; },
  scoreFn: function (fleet) { return ORDER.indexOf(stage(fleet.WS4)); },
  /* Resolve's refusal says what Farah or Mason would notice, never the
     setting to change. */
  notReady: function (fleet) {
    const s = stage(fleet.WS4);
    if (s === "restore") return "Farah opens Q3-budget.xlsx: it still isn't the spreadsheet she was working on yesterday.";
    if (s === "test") return "Mason: \"How do you know the backup works? Show me her files in it before you close this.\"";
    return "Farah has her spreadsheet back. Mason reads the ticket again: the second half of her request isn't done yet.";
  },
  judge: function (act, fleet, before) {
    const m = fleet.WS4; if (act.machine && act.machine !== "WS4") return { guess: false };
    if (act.type === "pv-restore") {
      const d = act.res && act.res.doc;
      if (d === "q3rev") return { guess: false };
      if (d === "fy25") return { guess: true, say: "That copy was taken at 09:40 this morning, after she'd saved last year's figures over it. Open a version before you restore it: read what's in it." };
      return { guess: true, say: "That's an older copy (saved " + (DOC[d] ? DOC[d].saved : "earlier") + "). Farah worked on it after that, right up to lunch yesterday: restoring this loses her work." };
    }
    if (act.type === "sys-restore") return { guess: true, say: "System Restore rolled Windows back, and left her documents exactly as they were: it only restores system files, settings and programs. Q3-budget.xlsx is still the wrong one, and the PC restarted in the middle of her day." };
    if (act.type === "fh" && act.op === "target") return act.res && act.res.refused ? { guess: true, say: act.res.text } : { guess: false };
    if (act.type === "fh" && act.op === "off") return { guess: true, say: "File History is off again: nothing is being backed up." };
    if (act.type === "fh" && act.op === "every") {
      if (m.bk.fh.every > 60) return { guess: true, say: BK.EVERY.filter(function (x) { return x[1] === m.bk.fh.every; })[0][0] + ": Farah could still lose more than an hour's work between copies." };
      return { guess: false };
    }
    if (act.type === "fh" && act.op === "keep") {
      if (act.keep === "Until space is needed" || act.keep === "1 month") return { guess: true, say: "That's how long copies are kept, not how often they're made, and it's shorter: an older version she needs could be gone by the time she notices." };
      return { guess: false };
    }
    if (act.type === "restore" && act.op === "off") return { guess: true, say: "Turning off System Protection deletes every restore point on C:, the very copies her file can come back from. Turning it back on won't bring them back: revert to your last snapshot." };
    return { guess: false };
  },
  hints: function (fleet) {
    const s = stage(fleet.WS4);
    const H = {
      restore: cur(fleet.WS4) === "retyped" && !has(fleet.WS4, "pv-view")
        ? ["Look at the file itself, not the whole PC: what Windows keeps of older copies of a document. Its properties are a good place to start.", "Windows can bring back an earlier copy of a single file from the snapshots System Protection takes. Rolling the whole of Windows back is a different tool, and it leaves documents alone."]
        : ["Compare each copy's date and contents with what Farah said about when she last worked on it, and when things went wrong.", "The copy you want is the newest one made after her last real edit and before this morning's mistake. Open a copy to read it before you restore it."],
      target: ["Mason's note on the ticket says where workstation backups go. Windows' own backup for a user's files is in Control Panel.", "A backup on the same drive as the files dies with the drive. It belongs on another device, and here that's a share on the file server."],
      every: ["Read the last thing Farah asked for, and compare it with how often the backup is set to run.", "How often a backup runs decides the most work that can be lost between copies. Set it to what the user can afford to lose."],
      on: ["Everything is set. Read the top of the backup's own page: what does it say about itself?", "Settings describe a backup. They don't make one happen."],
      run: ["Is the spreadsheet you just restored in the backup yet? Compare the time it was last copied with the time you restored it.", "A backup only protects what it has already copied."],
      test: ["Have you seen her files come back out of the backup?", "A backup you haven't restored from is a hope, not a backup. Check what it really holds before you close the ticket."],
      done: ["The file's back and the backup works. Close the ticket.", "The close question is about why today's rescue wasn't a backup."]
    };
    return H[s];
  },
  /* Rung 3's six: the right move for where the student is, and five
     near misses with the reason each is wrong now. */
  moves: function (fleet) {
    const s = stage(fleet.WS4);
    const X = {
      restore: [opt("Restore the 3 October copy from the file's Previous Versions tab", true),
        opt("Restore this morning's 09:40 copy from the Previous Versions tab", false, "Taken after she saved last year's figures over it: it's the wrong spreadsheet."),
        opt("Run System Restore to the 3 October restore point", false, "System Restore rolls back Windows' system files and programs. It never changes documents."),
        opt("Restore it from File History", false, "File History has never been turned on here, so there's no backup to restore from."),
        opt("Look for the old copy in the Recycle Bin", false, "She saved over it. Nothing was deleted, so nothing went to the Recycle Bin."),
        opt("Open Excel's AutoRecover folder for an unsaved copy", false, "AutoRecover keeps unsaved work after a crash. She saved, so the file itself was replaced.")],
      target: [opt("Point File History at \\\\FS01\\Backups", true),
        opt("Point File History at a new folder on C:", false, "Same drive as her files: if it fails, the backup goes with it. Windows won't allow it."),
        opt("Point File History at \\\\FS01\\Software", false, "That's the install share: staff can read it, not write to it."),
        opt("Copy her Documents to a USB stick every Friday", false, "A week's work at risk, someone has to remember, and Mason's note rules out sticks."),
        opt("Create a restore point every evening instead", false, "Restore points live on the same drive, and Windows deletes old ones to make room."),
        opt("Raise System Protection's disk space to 20%", false, "More restore points, still on the same drive. It's not a backup.")],
      every: [opt("Set File History to save copies every hour", true),
        opt("Leave it saving copies daily", false, "She'd lose up to a day's work, and she said she can't."),
        opt("Set it to keep saved versions for 1 month", false, "That's how long copies are kept, not how often they're made."),
        opt("Set it to save copies every 12 hours", false, "Still half a day's work at risk."),
        opt("Set it to keep versions until space is needed", false, "Retention again, not frequency, and shorter than now."),
        opt("Press Run now by hand at the end of each day", false, "Someone has to remember, and it's still daily.")],
      on: [opt("Turn File History on", true),
        opt("Restart the PC so the settings take effect", false, "Nothing waits for a restart. It's simply off."),
        opt("Create a restore point to start the backup", false, "Restore points are System Protection, not File History."),
        opt("Turn on System Protection for C:", false, "It's already on, and it isn't the backup."),
        opt("Wait for the first scheduled copy", false, "It never comes while File History is off."),
        opt("Resolve the ticket: the settings are saved", false, "Saved settings with the backup off protect nothing.")],
      run: [opt("Press Run now, so the restored spreadsheet is copied straight away", true),
        opt("Wait for the next scheduled copy", false, "Up to an hour with her rescued file unprotected, and you haven't seen it work."),
        opt("Create a restore point instead", false, "Same drive as the file: not a backup."),
        opt("Restart the PC to start the first copy", false, "File History doesn't need a restart."),
        opt("Turn File History off and on again", false, "That doesn't copy anything you couldn't copy with one button."),
        opt("Resolve the ticket now", false, "The file you rescued isn't in the backup yet.")],
      test: [opt("Open Restore personal files and find her spreadsheet in the backup", true),
        opt("Resolve: File History says it's on", false, "On isn't proof that her files can come back."),
        opt("Restore the whole backup over her Documents to test it", false, "That overwrites today's files to prove a point. Look first."),
        opt("Check how big the FS01 share is from her PC", false, "Size proves nothing about her files."),
        opt("Run System Restore to prove the restore points work", false, "Not the backup, and it rolls Windows back and restarts the PC."),
        opt("Ask Farah to delete a file so you can test it", false, "Never test a backup by destroying live work.")],
      done: [opt("Resolve the ticket", true),
        opt("Restore the 3 October copy again to be safe", false, "It's already back, and in the backup."),
        opt("Turn File History off now it has made a copy", false, "Then nothing after today is protected."),
        opt("Set it to copy every 10 minutes as well", false, "Every hour is what she asked for, and it's set."),
        opt("Escalate to Tier 2 to check the backup", false, "You've tested it yourself. It's done at Tier 1."),
        opt("Delete the old restore points to free space", false, "They cost nothing here, and they're a second safety net.")]
    };
    return X[s];
  },
  closeWhere: "Think about where today's copy came from, and what could have happened to it.",
  close: { prompt: "Farah asks: \"Couldn't we just rely on restore points, like today?\" What do you tell her?", options: [
    opt("No: a restore point sits on her own drive, and Windows deletes old ones for space", true),
    opt("No: restore points never hold documents, only Windows' own system files and settings", false, "Today's copy came from a restore point. System Restore only puts back system files, but the snapshot behind it holds the whole drive."),
    opt("No: restore points are only made when someone creates one by hand, never by Windows", false, "Windows makes them itself, before updates and installs. Yesterday's came from Windows Update."),
    opt("No: only an administrator can get a file back out of a restore point", false, "Previous Versions works for the user too. Restoring her file didn't need the admin password."),
    opt("Yes: restore points are kept for good unless she deletes them herself", false, "Windows deletes old ones when their space fills, and they all go if the drive fails."),
    opt("Yes: one is made every hour, so she can never lose more than an hour", false, "They're made around updates and installs, often days apart. Her newest useful copy today was from yesterday lunchtime.")] },
  note: { must: [["previous version", "restore point", "shadow"], ["file history"], ["fs01", "backups"], ["hour"], ["test", "checked", "restore personal", "verified", "confirmed", "saw"]],
    tip: "Which copy you restored and where it came from, the backup you set up (where to, how often), and how you tested it." }
}];
