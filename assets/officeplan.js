/* =====================================================================
   Rafiki's office, as plain geometry: the one plan the 3D office and the
   2D floor plan are both drawn from (office_map.PNG from the WiFi sim,
   sized to standard office dimensions; feet, x across, z down the page).

   And the Wi-Fi it carries: signal strength at any point, from the
   access point's band, the distance, and every wall the signal passes
   through ("this building has thick walls"). A running microwave adds
   noise on 2.4 GHz only (it cooks at 2.45 GHz): right beside the access
   point it swamps the whole office; anywhere else it spoils a patch
   around itself (owner, 30 September 2026: "move it away from AP and it
   needs to show a decent amount of movement. Like across the room").
   ===================================================================== */
export const W = 40, D = 32;
/* walls as [x0, z0, x1, z1, kind, gaps[[a, b]]] along one axis */
export const WALLS = [
  [0, 0, W, 0, "ext", []], [0, D, W, D, "ext", [[27, 31]]], [0, 0, 0, D, "ext", [[13, 16.5]]], [W, 0, W, D, "ext", []],
  [0, 12, W, 12, "int", [[8.5, 11.5], [14.5, 17.5], [28, 31]]],
  [13, 0, 13, 12, "int", []], [27, 0, 27, 12, "int", []],
  [11, 17, W, 17, "int", [[13, 16], [19.5, 22.5]]],
  [11, 17, 11, D, "int", []], [18, 17, 18, D, "int", []]
];
export const AP = { x: 14.5, z: 18.2, y: 8.2 };
/* the break counter in the conference room, along the far side of the
   closet wall from the access point (clear of the door) */
export const MICROWAVE_START = { x: 19.1, z: 21.5 };
export const ROOMS = [
  { name: "Office 1", x0: 0, z0: 0, x1: 13, z1: 12 }, { name: "Office 2", x0: 13, z0: 0, x1: 27, z1: 12 }, { name: "Office 3", x0: 27, z0: 0, x1: W, z1: 12 },
  { name: "Corridor", x0: 0, z0: 12, x1: W, z1: 17 }, { name: "Reception", x0: 0, z0: 17, x1: 11, z1: D },
  { name: "Network closet", x0: 11, z0: 17, x1: 18, z1: D }, { name: "Conference and break room", x0: 18, z0: 17, x1: W, z1: D }
];
export function roomAt(x, z) { return ROOMS.filter(function (r) { return x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1; }).pop() || null; }

export function segs(w) {
  const x0 = w[0], z0 = w[1], x1 = w[2], z1 = w[3], gaps = w[5]; const horiz = z0 === z1; const a0 = horiz ? x0 : z0, a1 = horiz ? x1 : z1;
  const out = []; let s = a0; gaps.slice().sort(function (p, q) { return p[0] - q[0]; }).forEach(function (g) { if (g[0] > s) out.push([s, g[0]]); s = g[1]; }); if (s < a1) out.push([s, a1]);
  return out.map(function (p) { return horiz ? [p[0], z0, p[1], z0] : [x0, p[0], x0, p[1]]; });
}
const SEGS = []; WALLS.forEach(function (w) { segs(w).forEach(function (s) { SEGS.push({ s: s, kind: w[4] }); }); });
function crosses(ax, az, bx, bz, s) {
  const rx = bx - ax, rz = bz - az, sx = s[2] - s[0], sz = s[3] - s[1];
  const den = rx * sz - rz * sx; if (Math.abs(den) < 1e-9) return false;
  const qx = s[0] - ax, qz = s[1] - az;
  const t = (qx * sz - qz * sx) / den, u = (qx * rz - qz * rx) / den;
  return t > 0 && t < 1 && u >= 0 && u <= 1;
}
export function wallsBetween(ax, az, bx, bz) { return SEGS.filter(function (w) { return crosses(ax, az, bx, bz, w.s); }).length; }
/* received signal, dBm, at a point, from the access point (free-space
   loss over the distance at ceiling height, plus each wall) */
export function rssi(x, z, band) {
  const f = band === "5" ? 5180 : 2437;
  const dm = Math.max(0.5, Math.hypot(x - AP.x, z - AP.z, 5) * 0.3048);
  let loss = 20 * Math.log10(dm) + 20 * Math.log10(f) - 27.55;
  const wl = { int: band === "5" ? 20 : 12, ext: band === "5" ? 26 : 18 };
  SEGS.forEach(function (w) { if (crosses(AP.x, AP.z, x, z, w.s)) loss += wl[w.kind]; });
  return 20 - loss;
}
/* how much a running microwave takes away, dB, on 2.4 GHz */
export function microwaveLoss(x, z, band, mw) {
  if (!mw || band === "5") return 0;
  const nearAP = Math.hypot(mw.x - AP.x, mw.z - AP.z);
  const whole = nearAP < 8 ? 34 : 0;                                   /* swamps the access point itself */
  const local = Math.max(0, 30 - 2.4 * Math.hypot(x - mw.x, z - mw.z));  /* a patch around the microwave */
  return Math.max(whole, local);
}
/* what a device there gets: dBm after the microwave. -67 and up is good,
   down to -75 usable, below that it drops. */
export function quality(x, z, band, mw) { return rssi(x, z, band) - microwaveLoss(x, z, band, mw); }
export function grade(q) { return q >= -67 ? "good" : q >= -75 ? "weak" : "drops"; }
/* share of the office's floor where a device would drop */
export function droppedShare(band, mw) {
  let n = 0, bad = 0; for (let x = 0.5; x < W; x += 1) for (let z = 0.5; z < D; z += 1) { n++; if (grade(quality(x, z, band, mw)) === "drops") bad++; }
  return bad / n;
}
