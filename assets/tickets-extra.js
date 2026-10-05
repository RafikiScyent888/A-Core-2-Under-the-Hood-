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

/* ---------------------------------------------------------------------
   Backup and recovery: five more (the owner's five-more rule). Each one
   turns on a different real decision:
     X2  walk  restore to another folder, so today's file is kept
     X3  run   retention: what's gone can't come back at Tier 1; escalate
     X4  run   the backup drive walked off; move the backup to the server
     X5  run   System Restore IS the tool here: a driver, not a document
     X6  run   how often against how long, read from the auditors' words
   --------------------------------------------------------------------- */
EXTRA[0].stage = function (fleet) { return stage(fleet.WS4); };
const BACKUP = { topic: "Backup and recovery", domain: "Operational procedures", objective: "setting up workstation backups and recovery processes", kind: "backup", extra: true, tier: 1, outcome: "resolve", category: "Operational procedures › Backup and recovery" };
function docAt(m, path) { const f = BK.fileAt(m, path); return f && f.doc ? f.doc.id : null; }
function file(name, doc, size) { return { name: name, size: size || 32768, doc: Object.assign({}, doc) }; }
function runOf(when, stamp, files) { const o = {}; files.forEach(function (x) { o[(x[0] + "\\" + x[1].name).toLowerCase()] = x[1]; }); return { when: when, stamp: stamp, files: o }; }
function lastEv(m, kind, test) { const e = (m.events || []).filter(function (x) { return x.kind === kind && (!test || test(x)); }); return e.length ? e[e.length - 1].at : -1; }
function everyName(n) { return BK.EVERY.filter(function (x) { return x[1] === n; })[0][0]; }
/* the parts of judging every backup ticket shares */
function common(act, m) {
  if (act.type === "fh" && act.op === "target") return act.res && act.res.refused ? { guess: true, say: act.res.text } : { guess: false };
  if (act.type === "fh" && act.op === "off") return { guess: true, say: "File History is off now: nothing is being backed up." };
  if (act.type === "restore" && act.op === "off") return { guess: true, say: "Turning off System Protection deletes every restore point on C:. Turning it back on won't bring them back: revert to your last snapshot." };
  return null;
}
function stageTicket(o, mid, order) {
  const t = Object.assign({}, BACKUP, o, { machine: mid });
  t.goal = function (fleet) { return t.stage(fleet) === "done"; };
  t.scoreFn = function (fleet) { const i = order.indexOf(t.stage(fleet)); return i < 0 ? 0 : i; };
  return t;
}

/* ---- X2 (walk): Dev wants 1 October's deploy.yml beside today's ---- */
const DEVD = "C:\\Users\\dev\\Documents", YML = DEVD + "\\deploy.yml";
const Y = {
  y230: { id: "y230", rows: [["Version", "2.3.0"], ["Cache", "off"], ["Notes", "before the hotfix"]], saved: "30 September 2026 16:55", by: "Dev Patel" },
  y231: { id: "y231", rows: [["Version", "2.3.1"], ["Cache", "off"], ["Notes", "the hotfix: went live on 1 October"]], saved: "1 October 2026 15:20", by: "Dev Patel" },
  y232: { id: "y232", rows: [["Version", "2.3.2 (draft)"], ["Cache", "on, half set up"], ["Notes", "abandoned draft, never deployed"]], saved: "2 October 2026 11:05", by: "Dev Patel" },
  y240: { id: "y240", rows: [["Version", "2.4.0"], ["Cache", "on (the new cache settings)"], ["Notes", "this morning's work, not tested yet"]], saved: "4 October 2026 10:40", by: "Dev Patel" }
};
const STANDUP = { id: "standup", rows: [["What's in it", "Stand-up notes for the week"]], saved: "28 September 2026 09:15", by: "Dev Patel" };
function x2copy(m) { return ["Desktop", "Downloads"].map(function (f) { return docAt(m, "C:\\Users\\dev\\" + f + "\\deploy.yml"); }).filter(Boolean); }
function x2stage(fleet) {
  const m = BK.ready(fleet.WS3);
  if (docAt(m, YML) !== "y240") return "overwritten";
  if (x2copy(m).indexOf("y231") < 0) return "restore";
  const put = lastEv(m, "pv-restore", function (e) { return e.doc === "y231" && !e.inPlace; });
  if (lastEv(m, "doc-open", function (e) { return e.doc === "y231"; }) < put) return "test";
  return "done";
}
EXTRA.push(stageTicket({
  id: "X2", title: "Need 1 October's deploy.yml back, without losing today's",
  from: "Dev Patel, Dev",
  brief: ["Dev here. Something in this morning's deploy.yml broke the test build, and I want to see what changed. Can you get me the version that went live with the hotfix on the 1st, so I can compare the two side by side?",
    "Do NOT overwrite the one in my Documents. There's a whole morning of work in it that I still need.",
    "Mason's note on the ticket: Dev's PC has had File History on since last month, copying to \\\\FS01\\Backups every hour."],
  setup: function (fleet) {
    const m = BK.ready(fleet.WS3);
    BK.putDoc(m, DEVD, "deploy.yml", Y.y240, 4096); BK.putDoc(m, DEVD, "standup-notes.docx", STANDUP, 18432);
    m.bk.fh.on = true; m.bk.fh.target = "\\\\FS01\\Backups"; m.bk.fh.every = 60;
    BK.seedRuns(m, [
      runOf("30 September 2026 17:00", "2026-09-30 17:00", [[DEVD, file("deploy.yml", Y.y230, 4096)], [DEVD, file("standup-notes.docx", STANDUP, 18432)]]),
      runOf("1 October 2026 17:00", "2026-10-01 17:00", [[DEVD, file("deploy.yml", Y.y231, 4096)], [DEVD, file("standup-notes.docx", STANDUP, 18432)]]),
      runOf("2 October 2026 12:00", "2026-10-02 12:00", [[DEVD, file("deploy.yml", Y.y232, 4096)], [DEVD, file("standup-notes.docx", STANDUP, 18432)]]),
      runOf("4 October 2026 11:00", "2026-10-04 11:00", [[DEVD, file("deploy.yml", Y.y240, 4096)], [DEVD, file("standup-notes.docx", STANDUP, 18432)]])]);
    m.clock = "Oct 4 11:20";
  },
  stage: x2stage,
  notReady: function (fleet) { const s = x2stage(fleet); return s === "overwritten" ? "Dev opens deploy.yml in his Documents: this morning's work is gone." : s === "test" ? "Dev: \"Is that really the hotfix version? Did you open it?\"" : "Dev looks: there's no copy of the hotfix version anywhere he can compare."; },
  judge: function (act, fleet) {
    const m = fleet.WS3; if (act.machine && act.machine !== "WS3") return { guess: false };
    const c = common(act, m); if (c) return c;
    if (act.type === "pv-restore" && act.res && act.res.ok) {
      if (act.res.inPlace) return { guess: true, say: "That put the old copy over the one in his Documents: this morning's work is gone. Revert to your last snapshot, then restore the old copy somewhere else." };
      if (act.res.doc !== "y231") return { guess: true, say: "That's not the version that went live: read its notes. " + (act.res.doc === "y232" ? "The 2 October copy is a draft that was never deployed." : "The 30 September copy is from before the hotfix.") };
      return { guess: false };
    }
    if (act.type === "sys-restore") return { guess: true, say: "System Restore rolled Windows back and restarted Dev's PC. It never touches documents, so it can't bring back an old deploy.yml." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      overwritten: ["Look at what's in deploy.yml in his Documents now, and compare it with what he asked you to keep.", "Putting a copy back over the original replaces it. Get back to the last point you had right, then keep the two apart."],
      restore: ["His backups are on the file server, a copy every hour. Read each copy's notes against what he said about the 1st.", "When a user needs an old copy AND the current one, put the old copy somewhere else. Restoring over the original destroys the version they still need."],
      test: ["Is the copy you put back really the one he described?", "Check a restored file by opening it before you tell the user it's there."],
      done: ["Both copies are where Dev can compare them. Close the ticket.", "The close question is about where a restored file should go."]
    };
    return H[x2stage(fleet)];
  },
  moves: function (fleet) {
    const X = {
      overwritten: [opt("Revert to the snapshot, then restore the old copy to another folder", true),
        opt("Restore the 4 October 11:00 copy over it", false, "That copy is from 11:00; anything he saved after it would be lost too. The snapshot puts it back exactly."),
        opt("Run System Restore", false, "System Restore never touches documents."),
        opt("Tell Dev to redo this morning's work", false, "It can be put back: the snapshot has it."),
        opt("Escalate to Tier 2 for the server backup", false, "The snapshot puts his PC back to before the overwrite. No need."),
        opt("Turn File History off so it doesn't copy the old file", false, "Turning backups off protects nothing.")],
      restore: [opt("Restore the 1 October copy to his Desktop with Restore to…", true),
        opt("Restore the 1 October copy to its original location", false, "That overwrites today's deploy.yml, which he told you not to lose."),
        opt("Restore the 2 October copy to his Desktop", false, "The 2 October copy is a draft that was never deployed."),
        opt("Restore the 30 September copy to his Desktop", false, "That's from before the hotfix went live."),
        opt("Run System Restore to 1 October", false, "System Restore rolls back Windows, not documents."),
        opt("Copy today's file to the Desktop, then restore over it", false, "It would work, but it's the long way round. Restore to… does it in one step, with nothing overwritten.")],
      test: [opt("Open the restored copy on his Desktop and read its version", true),
        opt("Resolve: the restore said it worked", false, "A restore message isn't proof that it's the right copy."),
        opt("Restore it again to be sure", false, "Doing it twice proves nothing more than doing it once."),
        opt("Open the one in his Documents", false, "That's today's. Check the one you put back."),
        opt("Run File History's Run now", false, "That backs up; it doesn't check what you restored."),
        opt("Ask Dev to check it later", false, "You can check it now, with him watching.")],
      done: [opt("Resolve the ticket", true),
        opt("Delete the Desktop copy now it's restored", false, "That's the copy he needs to compare."),
        opt("Restore the 2 October draft as well", false, "He didn't ask for it, and it was never deployed."),
        opt("Turn File History off", false, "Then nothing after today is protected."),
        opt("Escalate to Tier 2", false, "It's done at Tier 1."),
        opt("Run System Restore to tidy up", false, "Nothing about Windows needs rolling back.")]
    };
    return X[x2stage(fleet)];
  },
  closeWhere: "Think about what Dev asked you NOT to do.",
  close: { prompt: "Dev asks why you didn't just use Restore. What do you tell him?", options: [
    opt("Restore puts the old copy over the original; Restore to… kept today's file safe", true),
    opt("Restore only works for files deleted from the Recycle Bin, not ones still there", false, "Restore works on any copy in the backup. It would have replaced the file he still has."),
    opt("Restore to… is the only way to get a file back from a network backup like FS01's", false, "Restore to original location works from FS01 too. It would just have overwritten today's."),
    opt("Restore puts back his whole Documents folder, not just the one file you pick", false, "It restores what you select. The problem is where it puts it: over the original."),
    opt("Restore to… makes the copy read-only, so he can't change the old file by mistake", false, "The restored copy is an ordinary file. The point was not overwriting today's."),
    opt("Restore needs an administrator's password, and he's only a standard user here", false, "File History is per user: he could restore his own files. The issue is overwriting.")] },
  note: { must: [["file history", "backup", "fs01"], ["1 october", "hotfix", "2.3.1"], ["desktop", "restore to", "another folder", "alternate"], ["today", "kept", "original", "not overwrit", "documents"]],
    tip: "Which copy you restored (and how you knew), where you put it, and that today's file was kept." },
  adviceStart: "Connect to Dev's PC. His backups are in File History: open it and look through the backups before you restore anything.",
  adviceWork: "Two things matter: which copy is the hotfix version (read the notes in each), and where you put it, because he needs today's file kept."
}, "WS3", ["overwritten", "restore", "test", "done"]));

/* ---- X3 (run): John's six-week-old file, and a one-month retention ---- */
const JD = "C:\\Users\\jdoe\\Documents";
const HAND = { id: "hand", rows: [["What's in it", "Staff handbook, 2026 edition"]], saved: "14 August 2026 10:00", by: "John Doe" };
const SCHED = { id: "sched", rows: [["What's in it", "October interview schedule"]], saved: "2 October 2026 16:30", by: "John Doe" };
function x3stage(fleet) {
  const m = BK.ready(fleet.WS1), fh = m.bk.fh;
  if (!fh.on || fh.target !== "\\\\FS01\\Backups") return "broken";
  if (lastEv(m, "fh-view", function (e) { return e.idx === 0; }) < 0) return "look";
  if (!BK.keepsAtLeast(fh.keep, "1 year")) return "keep";
  return "done";
}
EXTRA.push(stageTicket({
  id: "X3", outcome: "escalate", title: "Deleted interview notes in August — HR needs them now",
  from: "John Doe, HR",
  brief: ["John in HR. Back on 24 August I was tidying my Documents and deleted Interview-notes-Aug.docx, then emptied the Recycle Bin. Now a candidate has complained and HR needs those notes. Can you get them back?",
    "For what it's worth, HR policy says interview records are kept for a year.",
    "Mason's note on the ticket: John's PC backs up with File History to \\\\FS01\\Backups. FS01 itself is backed up every night and kept off site for a year; a restore from that is Tier 2, so escalate with what you found."],
  setup: function (fleet) {
    const m = BK.ready(fleet.WS1);
    BK.putDoc(m, JD, "Staff-handbook.docx", HAND); BK.putDoc(m, JD, "Interview-schedule-Oct.xlsx", SCHED);
    m.bk.fh.on = true; m.bk.fh.target = "\\\\FS01\\Backups"; m.bk.fh.every = 60; m.bk.fh.keep = "1 month";
    const both = [[JD, file("Staff-handbook.docx", HAND)], [JD, file("Interview-schedule-Oct.xlsx", SCHED)]];
    BK.seedRuns(m, [runOf("4 September 2026 09:00", "2026-09-04 09:00", both.slice(0, 1)), runOf("18 September 2026 09:00", "2026-09-18 09:00", both.slice(0, 1)), runOf("2 October 2026 17:00", "2026-10-02 17:00", both), runOf("4 October 2026 11:00", "2026-10-04 11:00", both)]);
    m.clock = "Oct 4 11:20";
  },
  stage: x3stage,
  notReady: function (fleet) { const s = x3stage(fleet); return s === "look" ? "Tier 2 asks: \"How far back do John's own backups go? Did you look?\"" : s === "keep" ? "Mason: \"And what stops this happening to the next file John deletes?\"" : "Tier 2 asks what's wrong with John's backup: it isn't running."; },
  judge: function (act, fleet) {
    const m = fleet.WS1; if (act.machine && act.machine !== "WS1") return { guess: false };
    const c = common(act, m); if (c) return c;
    if (act.type === "fh" && act.op === "keep" && !BK.keepsAtLeast(act.keep, "1 year")) return { guess: true, say: act.keep + " is shorter than HR's year: versions would still be deleted before the policy says they can go." };
    if (act.type === "fh" && act.op === "every" && act.every > 60) return { guess: true, say: "That makes copies less often. It doesn't change how long they're kept." };
    if (act.type === "pv-restore") return { guess: true, say: "That isn't the file John needs, and nothing else was lost." };
    if (act.type === "sys-restore") return { guess: true, say: "System Restore never brings documents back, and his restore points are only days old: the file went six weeks ago." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      broken: ["Look at File History's own page: is it still doing its job?", "A backup that's off or pointed somewhere else protects nothing. Put back what you changed."],
      look: ["Before you promise John anything, find out how far back his own backups go.", "Look at the oldest backup there is, and compare its date with when the file was deleted."],
      keep: ["Compare how long John's backups keep old copies with what HR's policy says.", "How long a backup keeps versions decides how far back you can ever go. It has to be at least as long as the business needs."],
      done: ["His backups can't reach August. Who can?", "When a file is older than every backup you can reach, hand it to the people who hold the older ones, with what you checked."]
    };
    return H[x3stage(fleet)];
  },
  moves: function (fleet) {
    const X = {
      broken: [opt("Put File History back on, saving to \\\\FS01\\Backups", true),
        opt("Leave it off until the ticket is done", false, "Nothing is backed up meanwhile."),
        opt("Point it at a folder on C:", false, "Same drive as the files: Windows won't allow it."),
        opt("Escalate as it is", false, "Tier 2 will ask why his backup isn't running."),
        opt("Run System Restore", false, "That doesn't touch File History."),
        opt("Create a restore point", false, "Restore points aren't backups.")],
      look: [opt("Open Restore personal files and go back to the oldest backup", true),
        opt("Restore the newest backup over his Documents", false, "The file isn't in it, and you'd overwrite what's there."),
        opt("Run System Restore to the oldest point", false, "It never brings documents back, and the oldest point is only days old."),
        opt("Search the Recycle Bin", false, "He emptied it in August."),
        opt("Escalate straight away", false, "Tier 2 needs to know what you checked first."),
        opt("Tell John it's gone for good", false, "FS01's own backups go back a year. It may not be gone.")],
      keep: [opt("Set Keep saved versions to 1 year", true),
        opt("Set Keep saved versions to Until space is needed", false, "Versions go whenever space runs low: shorter than now, not longer."),
        opt("Set Save copies of files to Daily", false, "That's how often, not how long. And it's worse."),
        opt("Leave it at 1 month", false, "That's why the August file was already gone."),
        opt("Set it to 3 months", false, "Shorter than HR's year."),
        opt("Point File History at a USB stick as well", false, "More copies, same one-month limit.")],
      done: [opt("Escalate to Tier 2 to restore it from FS01's nightly backup", true),
        opt("Resolve: tell John the notes are gone", false, "FS01's own backups go back a year: Tier 2 can try."),
        opt("Restore the oldest backup to his Desktop", false, "The file isn't in it."),
        opt("Run System Restore to September", false, "It never brings documents back."),
        opt("Set retention to Forever and wait", false, "Retention only affects versions kept from now on."),
        opt("Ask John to rewrite the notes from memory", false, "Not before the backup has been tried.")]
    };
    return X[x3stage(fleet)];
  },
  closeWhere: "Think about why the August file was already gone from John's backups.",
  close: { prompt: "John asks: \"Why couldn't you get it back? I thought we had backups.\" What's the honest answer?", options: [
    opt("His backups kept a month of versions, so August's copies were already deleted", true),
    opt("File History only backs up files that are still there, never ones that were deleted", false, "It keeps copies of deleted files for as long as retention allows. One month was the problem."),
    opt("Emptying the Recycle Bin also wipes every copy of that file from the backup", false, "The backup is separate. The copies went because retention was one month."),
    opt("File History was only set up last week, so August was never backed up", false, "It's been running: the oldest backup is 4 September, a month back, exactly the retention."),
    opt("Backups to a network share can't keep versions older than four weeks", false, "A network location keeps whatever retention is set. It was set to one month."),
    opt("The file was too large for File History to copy to the server at all", false, "Size wasn't it. Retention was one month, and the file went six weeks ago.")] },
  note: { must: [["oldest", "4 september", "month"], ["retention", "keep saved versions", "1 year", "one year"], ["tier 2", "escalat", "fs01"], ["24 august", "interview"]],
    tip: "How far back his backups went and why, the retention you set, and what you've asked Tier 2 to do." },
  adviceStart: "Connect to John's PC and look at his backups before you promise anything: how far back do they go?",
  adviceWork: "Compare three dates: when the file was deleted, the oldest backup on his PC, and how long HR says records are kept. Not every file can come back at Tier 1."
}, "WS1", ["broken", "look", "keep", "done"]));

/* ---- X4 (run): Rosa's backup drive went home with the temp ---- */
const RD = "C:\\Users\\recept\\Documents", VLOG = RD + "\\Visitor-log-Oct.xlsx";
const VL = { id: "vlog", rows: [["What's in it", "Visitor sign-in log, October"], ["Last entry", "4 October, 09:30"]], saved: "4 October 2026 09:30", by: "Rosa Ortiz" };
const VLOLD = { id: "vlogsep", rows: [["What's in it", "Visitor sign-in log, September (to the 11th)"]], saved: "11 September 2026 16:00", by: "Rosa Ortiz" };
const ROOMS = { id: "rooms", rows: [["What's in it", "Meeting room bookings"]], saved: "2 October 2026 12:10", by: "Rosa Ortiz" };
function x4stage(fleet) {
  const m = BK.ready(fleet.WS5), fh = m.bk.fh;
  if (fh.missing || fh.target !== "\\\\FS01\\Backups") return "target";
  if (!fh.on) return "on";
  if (!BK.inBackup(m, VLOG)) return "run";
  if (lastEv(m, "fh-view") < lastEv(m, "fh-run")) return "test";
  return "done";
}
EXTRA.push(stageTicket({
  id: "X4", title: "\"Reconnect your drive\" keeps popping up at reception",
  from: "Rosa Ortiz, Reception",
  brief: ["Rosa at reception. A box keeps popping up saying \"Reconnect your drive\". I think it's about the little USB stick the temp plugged in for backups back in September. She took her bag home on her last day and I haven't seen the stick since.",
    "Is my stuff backed up? The visitor log can't go missing: we need it for fire drills.",
    "Mason's note on the ticket: backups go to the Backups share on FS01, never to USB sticks."],
  setup: function (fleet) {
    const m = BK.ready(fleet.WS5);
    BK.putDoc(m, RD, "Visitor-log-Oct.xlsx", VL); BK.putDoc(m, RD, "Room-bookings.docx", ROOMS);
    m.bk.fh.on = true; m.bk.fh.target = "KINGSTON (E:)"; m.bk.fh.missing = true; m.bk.fh.every = 60;
    BK.seedRuns(m, [runOf("11 September 2026 16:00", "2026-09-11 16:00", [[RD, file("Visitor-log-Oct.xlsx", VLOLD)]])]);
    m.clock = "Oct 4 11:20";
  },
  stage: x4stage,
  notReady: function (fleet) { const s = x4stage(fleet); return s === "test" ? "Mason: \"Show me the visitor log in her backup before you close it.\"" : s === "target" ? "Rosa: \"The box popped up again.\"" : "Mason checks her backup: today's visitor log isn't in it."; },
  judge: function (act, fleet) {
    const m = fleet.WS5; if (act.machine && act.machine !== "WS5") return { guess: false };
    const c = common(act, m); if (c) return c;
    if (act.type === "pv-restore") return { guess: true, say: "Nothing is lost: her files are all there. The problem is the backup, not the files." };
    if (act.type === "sys-restore") return { guess: true, say: "System Restore doesn't fix a backup drive that's gone, and it restarted her PC at the front desk." };
    if (act.type === "fh" && act.op === "every" && act.every > 60) return { guess: true, say: "Less often than before, and the backup still has nowhere to go." };
    if (act.type === "fh" && act.op === "keep" && act.keep === "Until space is needed") return { guess: true, say: "Shorter retention doesn't fix a missing drive." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      target: ["Read File History's own page: where is it trying to save, and is that there?", "A backup is only as good as where it's going. Point it at a destination that stays put: another device, not something that can walk out of the door."],
      on: ["Is File History switched on?", "Settings describe a backup. They don't make one happen."],
      run: ["When was the visitor log last copied?", "Changing where a backup goes doesn't copy anything by itself until it runs."],
      test: ["Have you seen today's visitor log in the backup?", "Check what the backup really holds before telling the user she's safe."],
      done: ["Her backup is going somewhere that stays put, and it's tested. Close the ticket.", "The close question is about where backups belong."]
    };
    return H[x4stage(fleet)];
  },
  moves: function (fleet) {
    const X = {
      target: [opt("Select drive: add \\\\FS01\\Backups as a network location", true),
        opt("Turn File History off so the box stops", false, "The box stops and nothing is backed up."),
        opt("Buy a new USB stick for her", false, "Mason's note: never USB sticks. They walk, as this one did."),
        opt("Press Run now until it works", false, "It can't: the drive isn't there."),
        opt("Point it at a folder on C:", false, "Same drive as her files: Windows won't allow it."),
        opt("Run System Restore", false, "That doesn't touch the backup.")],
      on: [opt("Turn File History on", true),
        opt("Restart the PC", false, "It's off; a restart won't turn it on."),
        opt("Create a restore point", false, "Not a backup."),
        opt("Wait for the next copy", false, "None will come while it's off."),
        opt("Resolve", false, "Nothing is being backed up."),
        opt("Change how often it copies", false, "It's off.")],
      run: [opt("Press Run now", true),
        opt("Wait an hour for the next copy", false, "An hour unprotected, and you haven't seen it work."),
        opt("Copy the visitor log to FS01 by hand", false, "One file, once. The backup should do it every hour."),
        opt("Restore the September backup", false, "That's old, and it would overwrite today's log."),
        opt("Restart File History by turning it off and on", false, "Run now does it in one step."),
        opt("Resolve", false, "Today's log isn't backed up yet.")],
      test: [opt("Open Restore personal files and find today's visitor log", true),
        opt("Resolve: File History says it's on", false, "On isn't proof."),
        opt("Restore the visitor log over the original to test", false, "Never test by overwriting live work."),
        opt("Ask Rosa to check tomorrow", false, "Check it now."),
        opt("Run now again", false, "That copies; it doesn't check."),
        opt("Look at the share's free space", false, "Space isn't proof of her files.")],
      done: [opt("Resolve the ticket", true),
        opt("Turn File History off now it has copied", false, "Then nothing after today is protected."),
        opt("Put the USB stick back as well, if it turns up", false, "Mason's note: never USB sticks."),
        opt("Escalate to Tier 2", false, "It's done at Tier 1."),
        opt("Delete the September backup", false, "It costs nothing and might be needed."),
        opt("Change it to copy daily", false, "Less protection for no reason.")]
    };
    return X[x4stage(fleet)];
  },
  closeWhere: "Think about what happened to the old backup, and why.",
  close: { prompt: "Rosa asks why a USB stick wasn't good enough. What do you tell her?", options: [
    opt("A stick can be unplugged, lost or taken; the file server's share stays put", true),
    opt("USB sticks can't hold Excel files, so the visitor log was never backed up to it", false, "It held her files fine, until it left the building on 11 September."),
    opt("File History only works with network locations; it can't use USB drives at all", false, "It can use USB drives. The problem is that they leave."),
    opt("A USB stick is slower, so File History skipped the files it couldn't copy in time", false, "Speed wasn't it. The stick went home with the temp."),
    opt("USB sticks wipe themselves after a month unless they're plugged in to a PC", false, "They don't. This one simply wasn't there."),
    opt("Windows deletes a USB backup every time the PC restarts, unlike a server one", false, "It doesn't. The stick was gone, so there was nowhere to copy to.")] },
  note: { must: [["usb", "stick", "kingston"], ["fs01", "backups"], ["run now", "backed up", "copied"], ["test", "checked", "restore personal", "visitor log", "saw"]],
    tip: "What was wrong with the old backup, where it goes now, and how you checked today's visitor log is in it." },
  adviceStart: "Connect to Rosa's PC and open File History: read what it says about itself before you change anything.",
  adviceWork: "Where is her backup trying to go, and is that there? Mason's note says where backups belong. Then make sure today's visitor log is really in it."
}, "WS5", ["target", "on", "run", "test", "done"]));

/* ---- X5 (run): a driver update broke Brenda's scanner software ---- */
const BD = "C:\\Users\\bsmith\\Documents", PROP = BD + "\\Client-proposal.docx";
const PR = { id: "prop", rows: [["What's in it", "Proposal for Hartwell Logistics, 14 pages"], ["Status", "finished this morning"]], saved: "4 October 2026 08:50", by: "Brenda Smith" };
const SCANEASY = { name: "ScanEasy", exe: "ScanEasy.exe", ver: "5.2", publisher: "EasyDoc Imaging", dir: "C:\\Program Files\\ScanEasy", bits: 64, needs: [], files: [{ name: "profiles.ini", size: 4096 }], installed: true,
  driverBad: { driver: "ScanEasy Driver 3.0", module: "sedrv30.dll", when: "3 October 2026 14:10", since: "2026-10-03 14:10" } };
const KB = "Security update for Windows (KB5044284)";
function x5stage(fleet) {
  const m = BK.ready(fleet.WS2), a = M.appByName(m, "ScanEasy");
  if (!a || a.installed === false) return "gone";
  if ((m.bk.changes || []).some(function (c) { return c.undone; })) return "toofar";
  if (docAt(m, PROP) !== "prop") return "lost";
  if (a.driverBad) return "fix";
  if (lastEv(m, "launch", function (e) { return e.app === "ScanEasy" && e.result === "ok"; }) < lastEv(m, "driver-rolled-back")) return "test";
  return "done";
}
EXTRA.push(stageTicket({
  id: "X5", title: "Receipt scanner software crashes since yesterday's update",
  from: "Brenda Smith, Sales",
  brief: ["Brenda in Sales. The receipt scanner hasn't worked since an update popped up yesterday afternoon. ScanEasy opens and then says it has stopped working. I clicked Repair on it in Settings this morning: no change.",
    "Whatever you do, please don't lose the client proposal I finished this morning. It took me hours.",
    "Mason's note on the ticket: ScanEasy isn't in Software Center, and its uninstaller isn't to be trusted. We don't remove scanner software at Tier 1."],
  setup: function (fleet) {
    const m = BK.ready(fleet.WS2);
    m.apps = (m.apps || []).concat([M.clone(SCANEASY)]); M.placeApp(m.fs, SCANEASY, m);
    BK.putDoc(m, BD, "Client-proposal.docx", PR, 96256);
    m.restore.points = [];
    BK.addPoint(m, { name: "Automatic Restore Point", date: "28 September 2026", stamp: "2026-09-28 03:00" });
    BK.addPoint(m, { name: "Windows Update", date: "1 October 2026", stamp: "2026-10-01 03:05" });
    BK.addPoint(m, { name: "Installed ScanEasy Driver 3.0", date: "3 October 2026", stamp: "2026-10-03 14:09" });
    BK.addPoint(m, { name: "Automatic Restore Point", date: "4 October 2026", stamp: "2026-10-04 03:00" });
    m.bk.changes = [{ what: KB, stamp: "2026-10-01 03:06" }];
    M.addLog(m, "Application", { time: "14:10", level: "Information", source: "MsiInstaller", id: 1033, text: "Windows Installer installed the product. Product Name: ScanEasy Driver 3.0. Product Version: 3.0.1. Installation success or error status: 0." });
    M.addLog(m, "System", { time: "03:06", level: "Information", source: "WindowsUpdateClient", id: 19, text: "Installation Successful: Windows successfully installed the following update: " + KB + " (1 October 2026)." });
    m.clock = "Oct 4 11:20";
  },
  stage: x5stage,
  notReady: function (fleet) { const s = x5stage(fleet); return s === "test" ? "Brenda: \"Does it work now? Can you try it?\"" : s === "fix" ? "Brenda opens ScanEasy: it stops working again." : "Mason looks at the PC: it isn't the way it should be. Revert to your last snapshot."; },
  judge: function (act, fleet) {
    const m = fleet.WS2; if (act.machine && act.machine !== "WS2") return { guess: false };
    const c = common(act, m); if (c) return c;
    if (act.type === "sys-restore" && act.res && act.res.ok) {
      if (act.res.undid && act.res.undid.length) return { guess: true, say: "That point is from before the security update on 1 October, so the update was rolled back too, and her PC is unprotected. Revert to your last snapshot and choose the newest point from before the driver." };
      const a = M.appByName(m, "ScanEasy");
      if (a && a.driverBad) return { guess: true, say: "That point was made after the driver went in, so the driver is still there. The point you want was made just before it was installed." };
      return { guess: false };
    }
    if (act.type === "repair" && /scaneasy/i.test(String(act.app))) return { guess: true, say: "Repair rewrote ScanEasy's own files, the same as Brenda's try. The fault is in the driver installed yesterday, not in the program." };
    if (act.type === "cmd" && /^uninstall scaneasy/i.test(String(act.line))) return { guess: true, say: "ScanEasy is gone, and the driver that broke it is still there. Mason's note: we don't remove scanner software at Tier 1. Revert to your last snapshot." };
    if (act.type === "pv-restore") return { guess: true, say: "Her documents are fine. The fault is in a driver, and documents don't come into it." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      gone: ["Is ScanEasy still installed?", "Removing the program doesn't remove the driver that broke it. Get back to the last point you had right."],
      toofar: ["Look at what else that restore removed.", "Roll back as little as possible: the newest point made before the change that broke things."],
      lost: ["Is her proposal still there?", "Get back to the last point you had right."],
      fix: ["Find out exactly what changed yesterday afternoon. Windows records installs, and makes a restore point before them.", "When a driver or program change breaks Windows or a program, roll back the system to just before the change. Personal files aren't affected."],
      test: ["Has anyone tried ScanEasy since the rollback?", "A fix isn't finished until you've seen it work."],
      done: ["ScanEasy works and her proposal is safe. Close the ticket.", "The close question is about what that rollback did and didn't touch."]
    };
    return H[x5stage(fleet)];
  },
  moves: function (fleet) {
    const X = {
      gone: [opt("Revert to your last snapshot", true), opt("Reinstall ScanEasy from Software Center", false, "It isn't in Software Center."), opt("Run System Restore to 4 October", false, "That point is after the driver: it stays."), opt("Escalate to Tier 2", false, "The snapshot puts it back. Then fix the real cause."), opt("Download ScanEasy from the internet", false, "Unapproved software."), opt("Resolve: it can't crash now", false, "It can't scan either.")],
      toofar: [opt("Revert to your last snapshot", true), opt("Run Windows Update and carry on", false, "The snapshot is cleaner and checks nothing was missed."), opt("Leave it: the scanner works now", false, "Her PC is missing a security update."), opt("Run System Restore again to 4 October", false, "That brings the driver back."), opt("Escalate to Tier 2", false, "The snapshot fixes it."), opt("Turn off System Protection", false, "That deletes every restore point.")],
      lost: [opt("Revert to your last snapshot", true), opt("Ask Brenda to rewrite it", false, "The snapshot has it."), opt("Run System Restore", false, "It never brings documents back."), opt("Escalate", false, "The snapshot has it."), opt("Resolve", false, "Her proposal is gone."), opt("Open Previous Versions on her Desktop", false, "The snapshot is exact.")],
      fix: [opt("System Restore to the point made before ScanEasy Driver 3.0", true),
        opt("System Restore to the 1 October Windows Update point", false, "That also removes the security update installed on 1 October."),
        opt("System Restore to this morning's automatic point", false, "Made after the driver, so the driver stays."),
        opt("Repair ScanEasy in Settings again", false, "Brenda did. The program's files are fine; the driver isn't."),
        opt("Uninstall ScanEasy in Settings", false, "Mason's note: not at Tier 1. And the driver stays."),
        opt("Restore her Documents from a backup first", false, "Her documents aren't affected by System Restore, or by the fault.")],
      test: [opt("Open ScanEasy and check it starts", true), opt("Resolve: System Restore said it worked", false, "The message isn't proof the scanner works."), opt("Open her proposal", false, "Worth a look, but the ticket is the scanner."), opt("Run System Restore again", false, "It's done."), opt("Create a restore point", false, "That doesn't test anything."), opt("Ask Brenda to try tomorrow", false, "Try it now.")],
      done: [opt("Resolve the ticket", true), opt("Reinstall the new driver", false, "That's what broke it."), opt("Turn off System Protection", false, "That deletes the restore points that just saved you."), opt("Escalate to Tier 2", false, "It's fixed at Tier 1."), opt("Run System Restore to 28 September too", false, "That removes the security update."), opt("Restore her documents from the backup", false, "They weren't touched.")]
    };
    return X[x5stage(fleet)];
  },
  closeWhere: "Think about what System Restore puts back, and what it never touches.",
  close: { prompt: "Brenda asks: \"Did that put my proposal back to yesterday too?\" What do you tell her?", options: [
    opt("No: System Restore rolls back drivers, programs and settings, never documents", true),
    opt("Yes, but only files saved after the restore point; open it and check it's all there", false, "System Restore doesn't touch documents at all. Her proposal is exactly as she left it."),
    opt("No, because the proposal is in OneDrive, and System Restore skips cloud folders", false, "It's in her Documents on the PC. System Restore skips documents wherever they are."),
    opt("Yes: everything on C: went back to 3 October, so she'll need to redo this morning", false, "Documents aren't rolled back. Only system files, drivers, programs and settings."),
    opt("No, because you restored her Documents from File History after System Restore", false, "There was nothing to restore. System Restore never changes documents."),
    opt("Only if it was open in Word when the PC restarted for System Restore", false, "Unsaved work is lost in any restart; saved documents are never changed by System Restore.")] },
  note: { must: [["system restore"], ["driver", "scaneasy driver", "3.0"], ["restore point", "before"], ["document", "proposal"], ["test", "opened", "starts", "works", "checked"]],
    tip: "What broke it, the point you restored to and why that one, what happened to her documents, and how you tested it." },
  adviceStart: "Connect to Brenda's PC and see it for yourself: open ScanEasy, then look at what Windows recorded yesterday afternoon.",
  adviceWork: "Something changed yesterday afternoon. Windows keeps a record of it, and a way back to just before it. Her proposal matters too: what would your fix do to it?"
}, "WS2", ["gone", "toofar", "lost", "fix", "test", "done"]));

/* ---- X6 (run): the auditors' two numbers ---- */
const FD = "C:\\Users\\finance\\Documents";
const MEC = { id: "mec", rows: [["What's in it", "September month-end close"], ["Status", "in progress"]], saved: "4 October 2026 10:55", by: "Farah Nkemelu" };
function x6stage(fleet) {
  const m = BK.ready(fleet.WS4), fh = m.bk.fh;
  if (!fh.on || fh.target !== "\\\\FS01\\Backups") return "broken";
  if (fh.every > 15) return "every";
  if (fh.keep !== "2 years") return "keep";
  if (lastEv(m, "fh-view") < Math.max(lastEv(m, "fh-every"), lastEv(m, "fh-keep"))) return "test";
  return "done";
}
EXTRA.push(stageTicket({
  id: "X6", title: "Auditors' report: two changes to my backups",
  from: "Farah Nkemelu, Finance",
  brief: ["Farah again. The auditors have been in, and their report asks for two things on my PC.",
    "During month-end I must never have more than 15 minutes of work between copies. And backup copies of finance files are to be kept for two years, and not a day longer: data protection says we mustn't hoard personal data in old versions forever.",
    "My backup's already going to the file server. Can you set the rest?"],
  setup: function (fleet) {
    const m = BK.ready(fleet.WS4);
    BK.putDoc(m, FD, "Month-end-close.xlsx", MEC, 65536); BK.putDoc(m, FD, "Q3-budget.xlsx", DOC.q3rev);
    m.bk.fh.on = true; m.bk.fh.target = "\\\\FS01\\Backups"; m.bk.fh.every = 60; m.bk.fh.keep = "Forever (default)";
    BK.seedRuns(m, [runOf("4 October 2026 10:00", "2026-10-04 10:00", [[FD, file("Month-end-close.xlsx", MEC, 65536)], [FD, file("Q3-budget.xlsx", DOC.q3rev, 48128)]]), runOf("4 October 2026 11:00", "2026-10-04 11:00", [[FD, file("Month-end-close.xlsx", MEC, 65536)], [FD, file("Q3-budget.xlsx", DOC.q3rev, 48128)]])]);
    m.clock = "Oct 4 11:20";
  },
  stage: x6stage,
  notReady: function (fleet) { const s = x6stage(fleet); return s === "test" ? "Mason: \"Have you checked the backup still works after your changes?\"" : s === "broken" ? "Mason: her backup isn't running any more." : "Farah reads the auditors' report against her File History settings: it doesn't match yet."; },
  judge: function (act, fleet) {
    const m = fleet.WS4; if (act.machine && act.machine !== "WS4") return { guess: false };
    const c = common(act, m); if (c) return c;
    if (act.type === "fh" && act.op === "every" && act.every > 15) return { guess: true, say: everyName(act.every) + ": more than 15 minutes of work could be lost between copies." };
    if (act.type === "fh" && act.op === "keep" && act.keep !== "2 years") return { guess: true, say: act.keep === "Forever (default)" ? "Forever keeps copies past two years, which the auditors said must not happen." : act.keep + " deletes copies before the two years the auditors need." };
    if (act.type === "pv-restore") return { guess: true, say: "Nothing was lost. The job is the backup's settings." };
    if (act.type === "sys-restore") return { guess: true, say: "System Restore has nothing to do with File History's settings, and it restarted her PC at month-end." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      broken: ["Read File History's own page: is it still running, to the server?", "Put back what you changed: her backup was already right on that."],
      every: ["Read the auditors' first number, and compare it with how often her backup runs.", "How often a backup runs is the most work that can be lost between copies."],
      keep: ["Read the auditors' second number, including the words after it.", "How long copies are kept has a minimum the business needs, and sometimes a maximum the law sets. Meet both."],
      test: ["Have you checked the backup since you changed it?", "Check a backup after changing its settings, not just before."],
      done: ["Both numbers match the report, and it's checked. Close the ticket.", "The close question is about the two settings."]
    };
    return H[x6stage(fleet)];
  },
  moves: function (fleet) {
    const X = {
      broken: [opt("Turn File History back on, saving to \\\\FS01\\Backups", true), opt("Leave it off for month-end", false, "Month-end is when it matters most."), opt("Point it at a folder on C:", false, "Same drive: not allowed."), opt("Create restore points instead", false, "Not backups."), opt("Escalate", false, "Put back what you changed."), opt("Resolve", false, "Nothing is being backed up.")],
      every: [opt("Set Save copies of files to Every 15 minutes", true), opt("Set it to Every 30 minutes", false, "Up to 30 minutes of work lost: twice the limit."), opt("Leave it at Every hour", false, "Four times the limit."), opt("Set Keep saved versions to 15 minutes", false, "That's how long, not how often, and it isn't an option."), opt("Press Run now every 15 minutes", false, "Someone would have to remember, all month-end."), opt("Set it to Daily", false, "A whole day at risk.")],
      keep: [opt("Set Keep saved versions to 2 years", true), opt("Leave it at Forever", false, "Copies would be kept past two years, which data protection forbids."), opt("Set it to 1 year", false, "Copies deleted a year before the auditors allow."), opt("Set it to Until space is needed", false, "Copies could go in weeks."), opt("Set it to 9 months", false, "Too short for the auditors."), opt("Set Save copies of files to 2 years", false, "That's how often; this is how long.")],
      test: [opt("Open Restore personal files and check her files are there", true), opt("Resolve: the settings are saved", false, "Check it still works."), opt("Turn it off and on", false, "That doesn't check anything."), opt("Ask the auditors to check", false, "That's your job."), opt("Restore Month-end-close over the original", false, "Never test by overwriting live work."), opt("Look at the share's size", false, "Size isn't proof.")],
      done: [opt("Resolve the ticket", true), opt("Set it to Every 10 minutes as well", false, "15 minutes meets the report."), opt("Set retention to Forever to be safe", false, "Data protection says not past two years."), opt("Escalate", false, "Done at Tier 1."), opt("Turn off System Protection", false, "Nothing to do with it."), opt("Delete older backups by hand", false, "Retention does it.")]
    };
    return X[x6stage(fleet)];
  },
  closeWhere: "Think about which setting each of the auditors' numbers belongs to.",
  close: { prompt: "Farah asks why there are two settings, not one. What do you tell her?", options: [
    opt("How often limits the work she can lose; how long limits how far back she can go", true),
    opt("How often decides how much space the backup uses; how long decides how fast it runs", false, "Frequency is the work at risk between copies; retention is how far back versions go."),
    opt("One setting is for Excel files and the other is for everything else in her Documents", false, "Both apply to everything File History copies."),
    opt("Every 15 minutes is for month-end only; Windows switches back to hourly on its own", false, "It stays at 15 minutes until someone changes it."),
    opt("Keeping two years makes copies every 15 minutes possible without filling the share", false, "They're independent: one is how often, the other is how long."),
    opt("The first protects against a failed drive; the second protects against ransomware", false, "Both are about versions: how often they're made, and how long they're kept.")] },
  note: { must: [["15 minutes", "fifteen"], ["2 years", "two years"], ["not longer", "data protection", "forever", "no longer"], ["test", "checked", "restore personal", "saw", "verified"]],
    tip: "The two settings you changed and why each value, and how you checked the backup afterwards." },
  adviceStart: "Connect to Farah's PC and open File History. Read the auditors' two numbers in her message, word for word.",
  adviceWork: "One of the auditors' numbers is about how often, the other is about how long, and the second has a limit both ways."
}, "WS4", ["broken", "every", "keep", "test", "done"]));
