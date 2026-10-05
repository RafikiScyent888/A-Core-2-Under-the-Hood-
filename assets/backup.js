/* =====================================================================
   Backup and recovery on a simulated PC: the copies Windows keeps of a
   file, and the backup a technician sets up. Plain JSON on the machine
   object, no DOM, so verify/ runs it under Node.

   Three different things, which students mix up and the exam tests:
     Previous Versions   one file, brought back from the snapshots System
                         Protection takes (shadow copies) or from File
                         History. Documents included.
     System Restore      Windows rolled back to a restore point: system
                         files, settings and programs. It never touches
                         personal files, so it can't bring a document back.
     File History        a real backup: copies of the user's folders, on
                         a schedule, kept on ANOTHER device. A restore
                         point lives on the drive it protects, and Windows
                         deletes old ones to make room.

   Extra training (owner, 1 October 2026): "cover everything in Core 2
   that they will do in real life". Backup and recovery is in the
   objectives and in no sim.
   ===================================================================== */
import * as M from "./machine.js";
import * as MW from "./malware.js";

/* How often File History can save copies, as Windows lists them, in
   minutes; and how long it can keep them. */
export const EVERY = [["Every 10 minutes", 10], ["Every 15 minutes", 15], ["Every 20 minutes", 20], ["Every 30 minutes", 30], ["Every hour (default)", 60], ["Every 3 hours", 180], ["Every 6 hours", 360], ["Every 12 hours", 720], ["Daily", 1440]];
export const KEEP = ["Until space is needed", "1 month", "3 months", "6 months", "9 months", "1 year", "2 years", "Forever (default)"];
/* The shares on the office network File History could be pointed at. */
const SHARES = {
  "\\\\fs01\\backups": { ok: true, label: "\\\\FS01\\Backups" },
  "\\\\fs01\\software": { ok: false, text: "File History can't use this network location. You don't have permission to save files there. (\\\\FS01\\Software is the install share: staff can read it, not write to it.)" },
  "\\\\fs01\\contracts": { ok: false, text: "File History can't use this network location. You don't have permission to save files there." }
};

export function ready(m) {
  MW.ready(m);
  if (!m.bk) m.bk = { fh: { on: false, target: null, every: 1440, keep: "Forever (default)", runs: [], checked: false }, clock: "4 October 2026 11:20", seq: 0 };
  return m;
}
function full(dir, name) { return (dir + "\\" + name).toLowerCase(); }
function split(path) { const i = path.lastIndexOf("\\"); return [path.slice(0, i), path.slice(i + 1)]; }
export function fileAt(m, path) { const p = split(path); return M.findFile(m, p[0], p[1]); }
function same(a, b) { return !!a && !!b && a.doc && b.doc && a.doc.id === b.doc.id; }

/* A document with something in it the student can read: what's in it,
   and when it was last saved. `id` is what makes two copies the same. */
export function putDoc(m, dir, name, doc, size) { M.putFile(m.fs, dir, { name: name, size: size || 48128, doc: Object.assign({}, doc) }); }

/* A restore point carries a shadow copy of the drive as it was then. */
export function addPoint(m, p) {
  ready(m);
  m.restore.points.push({ name: p.name, date: p.date, stamp: p.stamp, snap: p.snap || {} });
  m.restore.points.sort(function (a, b) { return String(a.stamp || "").localeCompare(String(b.stamp || "")); });
}

/* Previous Versions of one file: every copy that differs from the one
   that follows it, newest first, from restore points and File History. */
export function versions(m, path) {
  ready(m);
  const k = path.toLowerCase(), out = [];
  m.restore.points.forEach(function (p, i) { const f = p.snap && p.snap[k]; if (f) out.push({ id: "rp" + i, from: "Restore point", when: f.saved, stamp: p.stamp, file: f }); });
  m.bk.fh.runs.forEach(function (r, i) { const f = r.files[k]; if (f) out.push({ id: "fh" + i, from: "File History", when: r.when, stamp: r.stamp, file: f }); });
  out.sort(function (a, b) { return String(b.stamp).localeCompare(String(a.stamp)); });
  const cur = fileAt(m, path), keep = [];
  out.forEach(function (v) { const prev = keep.length ? keep[keep.length - 1] : { file: cur }; if (!same(prev.file, v.file)) keep.push(v); });
  return keep;
}
export function version(m, path, id) { return versions(m, path).filter(function (v) { return v.id === id; })[0] || null; }

/* Restore: the copy replaces the current file (Windows asks first). */
export function restoreVersion(m, path, id) {
  const v = version(m, path, id); if (!v) return { ok: false, text: "That version is no longer available." };
  return put(m, path, v.file, null, id, v.from);
}

/* ---------------------------------------------------- File History */
export function setTarget(m, typed) {
  ready(m); const v = String(typed || "").trim().replace(/\\+$/, ""), k = v.toLowerCase();
  if (!v) return { ok: false, typo: true, text: "Type the network location, for example \\\\server\\share." };
  if (/^[a-z]:/i.test(v)) return { ok: false, refused: true, text: "This location can't be used. It's on the drive File History is backing up: if that drive fails, the backup goes with it." };
  if (!/^\\\\/.test(v)) return { ok: false, typo: true, text: "That isn't a network location. A network location starts with two backslashes: \\\\server\\share." };
  const s = SHARES[k] || SHARES[k.split("\\").slice(0, 4).join("\\")];
  if (!s) return { ok: false, typo: true, text: "We couldn't find " + v + ". Check the spelling and that the server is on the network." };
  if (!s.ok) return { ok: false, refused: true, text: s.text };
  m.bk.fh.target = v.length > s.label.length ? v : s.label; m.bk.fh.missing = false;
  M.note(m, "fh-target", { target: m.bk.fh.target });
  return { ok: true, text: "File History will save copies of your files to " + m.bk.fh.target + "\\FileHistory\\" + m.user + "\\" + m.host + "." };
}
export function setEvery(m, mins) { ready(m); m.bk.fh.every = Number(mins); M.note(m, "fh-every", { every: m.bk.fh.every }); return { ok: true }; }
export function setKeep(m, keep) { ready(m); m.bk.fh.keep = keep; M.note(m, "fh-keep", { keep: keep }); return { ok: true }; }
export function turnOn(m) {
  ready(m); if (m.bk.fh.missing) return { ok: false, text: "File History can't find " + m.bk.fh.target + ". Reconnect it, or select a different drive." };
  if (!m.bk.fh.target) return { ok: false, text: "Select a drive first. File History needs somewhere to save copies of your files." };
  m.bk.fh.on = true; M.note(m, "fh-on");
  const r = runNow(m); return { ok: true, text: "File History is on. " + r.text };
}
export function turnOff(m) { ready(m); m.bk.fh.on = false; M.note(m, "fh-off"); return { ok: true, text: "File History is off." }; }
/* A run copies the user's folders as they are now. */
export function runNow(m) {
  ready(m); const fh = m.bk.fh; if (!fh.on) return { ok: false, text: "File History is off." };
  if (fh.missing) { M.note(m, "fh-run-failed", { target: fh.target }); return { ok: false, text: "Reconnect your drive. File History can't find " + fh.target + ", so your files are being copied to this PC's own drive until you reconnect it or select a different one." }; }
  const files = {}, base = "C:\\Users\\" + m.user;
  ["Documents", "Desktop"].forEach(function (sub) { const d = M.dirOf(m, base + "\\" + sub); if (d) d.files.forEach(function (f) { files[full(base + "\\" + sub, f.name)] = M.clone(f); }); });
  m.bk.seq++; const when = "4 October 2026 " + (11 + Math.floor((20 + m.bk.seq) / 60)) + ":" + String((20 + m.bk.seq) % 60).padStart(2, "0");
  fh.runs.push({ when: when, stamp: "2026-10-04 " + when.split(" ").pop().padStart(5, "0"), files: files });
  M.note(m, "fh-run", { files: Object.keys(files).length });
  return { ok: true, text: "Copying your files to " + fh.target + "… Files last copied: " + when + "." };
}
/* "Restore personal files": what the backup really holds. Looking is a
   view, and it is how a backup is tested. */
export function backupView(m, i) {
  ready(m); const fh = m.bk.fh; if (!fh.runs.length) { M.note(m, "fh-view", { runs: 0 }); return null; }
  const at = i == null ? fh.runs.length - 1 : Math.max(0, Math.min(fh.runs.length - 1, i)), run = fh.runs[at];
  M.note(m, "fh-view", { runs: fh.runs.length, idx: at });
  if (!fh.missing) fh.checked = true;
  return { at: at, of: fh.runs.length, when: run.when, files: Object.keys(run.files).map(function (k) { return { path: k, file: run.files[k] }; }) };
}
/* Put a copy back: over the original (Windows asks first if it's still
   there), or into another folder, leaving the original as it is. */
export function restoreFromRun(m, at, path, folder) {
  ready(m); const run = m.bk.fh.runs[at]; const f = run && run.files[path.toLowerCase()];
  if (!f) return { ok: false, text: "That file isn't in this backup." };
  return put(m, path, f, folder, "fh" + at, "File History, " + run.when);
}
export function restoreVersionTo(m, path, id, folder) {
  const v = version(m, path, id); if (!v) return { ok: false, text: "That version is no longer available." };
  return put(m, path, v.file, folder, id, v.from);
}
function put(m, path, f, folder, id, from) {
  const p = split(path), dir = folder || p[0];
  M.putFile(m.fs, dir, Object.assign({}, M.clone(f), { name: p[1] }));
  M.note(m, "pv-restore", { path: path, id: id, doc: f.doc && f.doc.id, from: from, to: dir, inPlace: !folder || folder.toLowerCase() === p[0].toLowerCase() });
  return { ok: true, doc: f.doc && f.doc.id, inPlace: !folder || folder.toLowerCase() === p[0].toLowerCase(), text: (!folder || folder.toLowerCase() === p[0].toLowerCase() ? "Restored " + p[1] + " to its original location" : "Restored a copy of " + p[1] + " to " + dir) + " (the version saved " + (f.doc ? f.doc.saved : "earlier") + ")." };
}
/* A backup history that already exists when the ticket starts: each run
   is { when, stamp, files: { path: file } }. */
export function seedRuns(m, runs) { ready(m); m.bk.fh.runs = runs.map(function (r) { return { when: r.when, stamp: r.stamp, files: M.clone(r.files) }; }); }
/* Is a retention setting at least as long as `want` (Windows' own list)? */
export function keepsAtLeast(keep, want) { const i = KEEP.indexOf(keep); return keep === "Forever (default)" || (i >= 0 && i >= KEEP.indexOf(want) && keep !== "Until space is needed"); }
/* Is this file, as it is now, in the latest backup? */
export function inBackup(m, path) { const fh = ready(m).bk.fh; const last = fh.runs[fh.runs.length - 1]; return !!last && same(last.files[path.toLowerCase()], fileAt(m, path)); }

/* ------------------------------------------------- System Restore */
/* Rolls Windows back. Personal files are untouched, as on real Windows:
   that's the point the exam makes, and the near miss here. */
export function systemRestore(m, i) {
  ready(m); const p = m.restore.points[i]; if (!p) return { ok: false, text: "Choose a restore point." };
  M.note(m, "sys-restore", { point: p.name, date: p.date, stamp: p.stamp });
  /* a driver or program change made after the point is rolled back; one
     made before it stays (and a restore point after it changes nothing) */
  (m.apps || []).forEach(function (a) { if (a.driverBad && p.stamp && a.driverBad.since > p.stamp) { M.note(m, "driver-rolled-back", { app: a.name, driver: a.driverBad.driver }); a.driverBad = null; } });
  /* other system changes since the point go too: a security update, say */
  const lost = (m.bk.changes || []).filter(function (c) { return p.stamp && c.stamp > p.stamp && !c.undone; });
  lost.forEach(function (c) { c.undone = true; });
  M.note(m, "sys-restore-undid", { what: lost.map(function (c) { return c.what; }) });
  return { ok: true, undid: lost.map(function (c) { return c.what; }), stamp: p.stamp, text: "System Restore completed successfully. The system has been restored to " + p.date + " (" + p.name + "). Your documents have not been affected." + (lost.length ? " Removed since then: " + lost.map(function (c) { return c.what; }).join("; ") + "." : "") };
}
