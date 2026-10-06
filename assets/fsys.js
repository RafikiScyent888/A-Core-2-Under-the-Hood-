/* =====================================================================
   File systems on a PC's drives (Core 2, Operating systems, "File
   systems: handling file systems, updates, and OS upgrades"). Plain JSON
   on the machine (m.fx, with the files themselves in m.fs as every other
   folder is), so snapshots and revert cover it. No DOM.

   Each drive records its file system, and everything the student sees is
   worked out from it, as Windows and macOS really behave:
     FAT32   no file of 4 GB or more (4,294,967,295 bytes is the most);
             no permissions; Windows' own Format offers it only on
             volumes of 32 GB or less; a Mac reads and writes it
     exFAT   no 4 GB limit; no permissions; a Mac reads and writes it
     NTFS    no 4 GB limit; permissions (a Security tab); a Mac can only
             read it
     format  makes a new, empty file system: everything on the drive goes
     convert CONVERT D: /FS:NTFS turns FAT32 into NTFS in place, keeping
             the files; it asks for the volume's current label; one way
             only, and only to NTFS
   ===================================================================== */
export const FAT32_MAX = 4294967295;
export const SYSTEMS = ["NTFS", "exFAT", "FAT32"];
const GB = 1073741824;

export function ready(m) { if (!m.fx) m.fx = { drives: {} }; return m; }
export function drive(m, L) { return ready(m).fx.drives[String(L || "").toUpperCase()[0]] || null; }
export function drives(m) { const D = ready(m).fx.drives; return Object.keys(D).sort().map(function (k) { return D[k]; }); }
export function letterOf(path) { return String(path || "").toUpperCase()[0]; }
export function rootOf(L) { return L.toUpperCase() + ":\\"; }
export function note(m, kind, d) { m.events.push(Object.assign({ kind: kind, at: m.events.length }, d || {})); }

/* o: { letter, label, fs, gb (capacity), removable, files: [{ dir (under the root, "" for the root), name, size, doc? }] } */
export function addDrive(m, o) {
  ready(m);
  const d = { letter: o.letter, label: o.label, fs: o.fs, gb: o.gb, removable: !!o.removable, model: o.model || (o.removable ? "USB Flash Drive" : "Hard disk") };
  m.fx.drives[o.letter] = d;
  const root = rootOf(o.letter);
  m.fs[root.toLowerCase()] = { path: root, dirs: [], files: [] };
  (o.files || []).forEach(function (f) { putOn(m, f.dir ? root + f.dir : root, { name: f.name, size: f.size, doc: f.doc }); });
  return d;
}
function ensureDir(m, path) {
  const k = path.replace(/\\$/, "").toLowerCase(); if (m.fs[k] || m.fs[path.toLowerCase()]) return m.fs[k] || m.fs[path.toLowerCase()];
  const i = path.lastIndexOf("\\"); const parent = path.slice(0, i), name = path.slice(i + 1);
  const p = ensureDir(m, parent.length === 2 ? parent + "\\" : parent);
  if (p.dirs.map(function (x) { return x.toLowerCase(); }).indexOf(name.toLowerCase()) < 0) p.dirs.push(name);
  m.fs[k] = { path: path, dirs: [], files: [] }; return m.fs[k];
}
function putOn(m, dir, f) { const d = ensureDir(m, dir); d.files = d.files.filter(function (x) { return x.name.toLowerCase() !== f.name.toLowerCase(); }).concat([JSON.parse(JSON.stringify(f))]); }
/* every file on a drive, with its folder */
export function filesOn(m, L) {
  const pre = rootOf(L).toLowerCase(), out = [];
  Object.keys(m.fs).forEach(function (k) { if (k === pre || k === pre.slice(0, 2) || k.indexOf(pre) === 0) m.fs[k].files.forEach(function (f) { out.push({ dir: m.fs[k].path, name: f.name, size: f.size }); }); });
  return out;
}
export function used(m, L) { return filesOn(m, L).reduce(function (s, f) { return s + f.size; }, 0); }
export function free(m, L) { const d = drive(m, L); return d ? d.gb * GB - used(m, L) : 0; }
export function size(b) { return b >= GB ? (Math.round(b / GB * 10) / 10) + " GB" : Math.round(b / 1048576) + " MB"; }
/* what a Mac can do with it */
export function onMac(fs) { return fs === "NTFS" ? "read only" : fs === "exFAT" || fs === "FAT32" ? "read and write" : "can't read it"; }
export function permissions(fs) { return fs === "NTFS"; }
/* the file systems Windows' own Format dialog offers for this drive */
export function formatChoices(d) { return d.gb <= 32 ? ["FAT32", "NTFS", "exFAT"] : ["NTFS", "exFAT"]; }

/* ---------------------------------------------------- copying a file */
export function findAt(m, path) {
  const i = path.lastIndexOf("\\"); const dir = m.fs[path.slice(0, i).toLowerCase()] || m.fs[(path.slice(0, i) + "\\").toLowerCase()];
  const name = path.slice(i + 1).toLowerCase();
  return dir ? dir.files.filter(function (f) { return f.name.toLowerCase() === name; })[0] || null : null;
}
/* the check Windows makes before a copy lands on a drive */
export function canCopy(m, f, toDir) {
  const d = drive(m, letterOf(toDir));
  if (!d) return { ok: true };
  if (d.fs === "FAT32" && f.size > FAT32_MAX) return { ok: false, tooLarge: true, text: "The file '" + f.name + "' is too large for the destination file system." };
  if (f.size > free(m, d.letter)) return { ok: false, full: true, text: "There is not enough space on " + d.label + " (" + d.letter + ":). " + size(f.size) + " is needed." };
  return { ok: true };
}
export function copy(m, fromPath, toDir) {
  const f = findAt(m, fromPath); if (!f) return { ok: false, text: "The system cannot find the file specified." };
  const dir = m.fs[toDir.replace(/\\$/, "").toLowerCase()] || m.fs[toDir.toLowerCase()]; if (!dir) return { ok: false, text: "The system cannot find the path specified." };
  const c = canCopy(m, f, toDir); if (!c.ok) { note(m, "fx-copy-failed", { name: f.name, to: dir.path, tooLarge: !!c.tooLarge }); return c; }
  putOn(m, dir.path, f); note(m, "fx-copy", { name: f.name, from: fromPath, to: dir.path });
  return { ok: true, text: "Copied " + f.name + " to " + dir.path + "." };
}

/* ------------------------------------------------------------ format */
export function format(m, L, fs, label) {
  const d = drive(m, L); if (!d) return { ok: false, text: "The system cannot find the drive specified." };
  if (SYSTEMS.indexOf(fs) < 0) return { ok: false, text: "The file system isn't supported." };
  if (fs === "FAT32" && d.gb > 32) return { ok: false, text: "The volume is too big for FAT32." };
  const lost = filesOn(m, L).map(function (f) { return f.name; });
  Object.keys(m.fs).forEach(function (k) { if (k.indexOf(rootOf(L).toLowerCase()) === 0 && k !== rootOf(L).toLowerCase()) delete m.fs[k]; });
  m.fs[rootOf(L).toLowerCase()] = { path: rootOf(L), dirs: [], files: [] };
  const was = d.fs; d.fs = fs; if (label != null && String(label).trim()) d.label = String(label).trim().toUpperCase().slice(0, 11);
  note(m, "fx-format", { letter: d.letter, fs: fs, was: was, lost: lost });
  return { ok: true, lost: lost, text: "Format Complete. " + d.label + " (" + d.letter + ":) is now " + fs + " and empty." };
}

/* ----------------------------------------------------------- convert */
export function convert(m, L, target, labelTyped) {
  const d = drive(m, L); if (!d) return { ok: false, text: "The system cannot find the drive specified." };
  if (String(target).toUpperCase() !== "NTFS") return { ok: false, text: "Invalid parameter - /FS:" + target + "\nCONVERT only converts to NTFS." };
  if (d.fs === "NTFS") return { ok: false, text: "Drive " + d.letter + ": is already NTFS." };
  if (d.fs === "exFAT") return { ok: false, text: "CONVERT is not available for EXFAT drives." };
  if (String(labelTyped || "").trim().toUpperCase() !== d.label.toUpperCase()) { note(m, "fx-convert-label"); return { ok: false, label: true, text: "An incorrect volume label was entered for this drive." }; }
  const was = d.fs; d.fs = "NTFS"; note(m, "fx-convert", { letter: d.letter, was: was, kept: filesOn(m, L).length });
  return { ok: true, text: "Conversion complete. Drive " + d.letter + ": is NTFS, and every file on it was kept." };
}
