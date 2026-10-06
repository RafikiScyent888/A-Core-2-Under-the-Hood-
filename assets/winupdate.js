/* =====================================================================
   Windows Update on a PC (Core 2, Operating systems, "File systems:
   handling file systems, updates, and OS upgrades"). Plain JSON on the
   machine (m.wu), so snapshots and revert cover it. No DOM.

   As Windows 11 behaves:
     pause      updates can be paused for 1 to 5 weeks; while paused,
                Check for updates finds nothing, and Windows says so
     kinds      a cumulative update (quality and security, needs a
                restart, raises the OS build), a .NET update (restart),
                security intelligence for Defender (no restart), optional
                updates (drivers, listed apart, never installed unless
                chosen), and a feature update (a new version of Windows,
                offered apart, installed only when chosen)
     restart    updates that need one wait as "Pending restart"; they
                finish as the PC starts again
     active hours  the hours Windows won't restart the PC by itself
     history    what was installed and when; Uninstall updates lists the
                quality updates that can be taken off; taking one off also
                needs a restart, and lowers the build again
   ===================================================================== */
export function ready(m) { if (!m.wu) m.wu = { paused: null, lastCheck: "2 September 2026", found: false, offer: [], pending: [], removing: [], history: [], active: { from: 8, to: 17 } }; return m; }
export function note(m, kind, d) { m.events.push(Object.assign({ kind: kind, at: m.events.length }, d || {})); }
export function find(list, kb) { return list.filter(function (u) { return u.kb === kb; })[0] || null; }
export function installed(m, kb) { return !!find(ready(m).wu.history.filter(function (h) { return !h.removed; }), kb); }

/* o: { paused, offer: [...updates], history: [...] }; an update is
   { kb, title, kind: "cumulative"|"dotnet"|"defender"|"driver"|"feature", size, build?, version?, restart, uninstall? } */
export function setup(m, o) {
  ready(m); const w = m.wu;
  w.paused = o.paused || null; w.offer = JSON.parse(JSON.stringify(o.offer || [])); w.history = JSON.parse(JSON.stringify(o.history || []));
  if (o.lastCheck) w.lastCheck = o.lastCheck; if (o.active) w.active = Object.assign({}, o.active);
  return m;
}
export function pause(m, weeks) { ready(m).wu.paused = { until: ["13 October 2026", "20 October 2026", "27 October 2026", "3 November 2026", "10 November 2026"][Math.max(1, Math.min(5, weeks)) - 1], weeks: weeks }; note(m, "wu-pause", { weeks: weeks }); return { ok: true, text: "Updates are paused until " + m.wu.paused.until + "." }; }
export function resume(m) { const was = ready(m).wu.paused; m.wu.paused = null; note(m, "wu-resume"); return { ok: true, text: was ? "Updates resumed." : "Updates weren't paused." }; }
export function check(m) {
  const w = ready(m).wu; note(m, "wu-check", { paused: !!w.paused });
  if (w.paused) return { ok: false, paused: true, text: "Updates are paused until " + w.paused.until + ". Resume updates to check for new ones." };
  w.found = true; w.lastCheck = "Today, 11:20";
  const n = w.offer.filter(function (u) { return u.kind !== "driver" && u.kind !== "feature"; }).length;
  return { ok: true, text: n ? n + " updates are available." : "You're up to date." };
}
/* the lists Settings shows once Windows has checked */
export function listed(m, which) {
  const w = ready(m).wu; if (!w.found) return [];
  return w.offer.filter(function (u) { return which === "optional" ? u.kind === "driver" : which === "feature" ? u.kind === "feature" : u.kind !== "driver" && u.kind !== "feature"; });
}
export function install(m, kb) {
  const w = ready(m).wu, u = find(w.offer, kb); if (!u || !w.found) return { ok: false };
  w.offer = w.offer.filter(function (x) { return x.kb !== kb; });
  note(m, "wu-install", { kb: kb, kind: u.kind });
  if (!u.restart) { w.history.push(Object.assign({}, u, { date: "6 October 2026" })); return { ok: true, kb: kb, kind: u.kind, text: u.title + ": installed." }; }
  w.pending.push(u);
  return { ok: true, kb: kb, kind: u.kind, restart: true, text: u.title + ": pending restart." };
}
export function setActive(m, from, to) {
  const f = Number(from), t = Number(to);
  if (!(f >= 0 && f <= 23 && t >= 0 && t <= 23) || f === t) return { ok: false, text: "Active hours need a start and an end." };
  const span = (t - f + 24) % 24; if (span > 18) return { ok: false, text: "Active hours can be up to 18 hours long." };
  ready(m).wu.active = { from: f, to: t }; note(m, "wu-active", { from: f, to: t });
  return { ok: true, text: "Active hours: " + hh(f) + " to " + hh(t) + ". Windows won't restart this PC by itself in those hours." };
}
export function hh(h) { return (h < 10 ? "0" : "") + h + ":00"; }
/* Uninstall updates: the quality updates that can come off */
export function removable(m) { return ready(m).wu.history.filter(function (h) { return !h.removed && h.uninstall; }); }
export function uninstall(m, kb) {
  const w = ready(m).wu, h = find(removable(m), kb); if (!h) return { ok: false };
  w.removing.push(kb); note(m, "wu-uninstall", { kb: kb, kind: h.kind });
  return { ok: true, kb: kb, restart: true, text: "Uninstalling " + h.title + ". Restart the PC to finish." };
}
/* the PC starts again: pending installs finish, pending removals finish */
export function onBoot(m) {
  if (!m.wu) return; const w = m.wu, done = [];
  w.pending.forEach(function (u) { w.history = w.history.filter(function (h) { return h.kb !== u.kb; }); w.history.push(Object.assign({}, u, { date: "6 October 2026", was: u.build ? m.build : undefined })); if (u.build) m.build = u.build; if (u.version) m.version = u.version; done.push(u.kb); });
  w.pending = [];
  /* a removed update comes off, and Windows offers it again at the next check */
  w.removing.forEach(function (kb) { const h = find(w.history, kb); if (h) { h.removed = true; if (h.was) m.build = h.was; const again = Object.assign({}, h); delete again.removed; delete again.date; delete again.was; w.offer.push(again); w.found = false; } done.push(kb); });
  w.removing = [];
  if (done.length) note(m, "wu-boot", { kbs: done });
}
/* the red line Settings shows when this month's security update is missing */
export function missing(m) { return !!m.wu && (m.wu.offer.some(function (u) { return u.kind === "cumulative"; }) || m.wu.pending.some(function (u) { return u.kind === "cumulative"; })); }
export function pendingRestart(m) { return !!(m.wu && (m.wu.pending.length || m.wu.removing.length)); }
