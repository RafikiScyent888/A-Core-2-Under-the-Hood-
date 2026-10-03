/* =====================================================================
   The floor plan: Rafiki's office from above, 2D (owner, 1 October 2026:
   the microwave job opens "the 2D floor plan, where the microwave is
   dragged across the room and the Wi-Fi coverage changes").

   The coverage is drawn from the access point's RUNNING band, the walls
   and the microwave (officeplan.js), so it shows what the settings do,
   never what they should be. Everything a student reads is real text
   (rooms, the access point, each device and how it's doing, the legend),
   so it scales, takes the dyslexia setting and is measured for contrast;
   only the coverage colours are painted. The microwave moves by dragging
   or with the arrow keys, and only when the student is in the room.

   ctx: { router() → r, onSite() → bool, move(x, z), band() }
   ===================================================================== */
import * as PLAN from "./officeplan.js";
import * as R from "./router.js";

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
const COL = { good: [21, 128, 61], weak: [234, 179, 8], drops: [185, 28, 28] };
const WORD = { good: "good", weak: "weak", drops: "drops" };

export function drawFloorPlan(host, ctx, ui) {
  const r = ctx.router();
  const wrap = el("div", "fp"); host.appendChild(wrap);
  if (!r) { wrap.appendChild(el("p", "fp-note", "The floor plan opens during the lunchtime Wi-Fi ticket, from the break room.")); return; }
  const band = r.running.wifi.band, mw = r.microwave, here = ctx.onSite();
  const head = el("div", "fp-head");
  head.appendChild(el("h2", null, "Rafiki's office · Wi-Fi coverage"));
  head.appendChild(el("p", "fp-note", "Showing what the access point is running now: " + (band === "dual" ? "dual-band (each spot gets the better band)" : band + " GHz") + ". The microwave is running (it's lunchtime). " + (here ? "You're in the break room: drag the microwave, or select it and use the arrow keys." : "Walk to the break room from the ticket to move anything.")));
  wrap.appendChild(head);

  const stage = el("div", "fp-stage"); stage.setAttribute("aria-label", "Floor plan of the office, 40 by 32 feet");
  const cv = el("canvas", "fp-heat"); cv.width = PLAN.W * 6; cv.height = PLAN.D * 6; cv.setAttribute("aria-hidden", "true");
  const g = cv.getContext("2d"), img = g.createImageData(cv.width, cv.height);
  const cache = {};
  for (let j = 0; j < cv.height; j++) for (let i = 0; i < cv.width; i++) {
    const x = i / 6, z = j / 6, k = (Math.floor(x * 2)) + ":" + Math.floor(z * 2);
    let gr = cache[k]; if (!gr) { const q = band === "dual" ? Math.max(PLAN.quality(x, z, "2.4", mw), PLAN.quality(x, z, "5", mw)) : PLAN.quality(x, z, band, mw); gr = cache[k] = PLAN.grade(q); }
    const c = COL[gr], o = (j * cv.width + i) * 4; img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 120;
  }
  g.putImageData(img, 0, 0);
  /* walls on top */
  g.strokeStyle = "#111827"; g.lineCap = "round";
  PLAN.WALLS.forEach(function (w) { g.lineWidth = w[4] === "ext" ? 5 : 3; PLAN.segs(w).forEach(function (s) { g.beginPath(); g.moveTo(s[0] * 6, s[1] * 6); g.lineTo(s[2] * 6, s[3] * 6); g.stroke(); }); });
  stage.appendChild(cv);
  /* a label near an edge hangs inward, so it's never cut off */
  const at = function (x, z, node) { node.style.left = (x / PLAN.W * 100) + "%"; node.style.top = (z / PLAN.D * 100) + "%";
    node.style.transform = "translate(" + (x > PLAN.W - 7 ? "-100%" : x < 7 ? "0" : "-50%") + "," + (z > PLAN.D - 2.5 ? "-100%" : z < 2.5 ? "0" : "-50%") + ")"; stage.appendChild(node); return node; };
  PLAN.ROOMS.forEach(function (rm) { if (rm.name === "Network closet") return; at((rm.x0 + rm.x1) / 2, rm.z0 + 1.6, el("span", "fp-room", rm.name)); });
  at(PLAN.AP.x, PLAN.AP.z + 1.4, el("span", "fp-ap", "Access point (network closet)"));
  r.devices.filter(function (d) { return d.pos; }).forEach(function (d) {
    const q = R.planQuality(r, d), gr = PLAN.grade(q);
    at(d.pos.x, d.pos.z, el("span", "fp-dev " + gr, d.name + ": " + WORD[gr] + " (" + Math.round(q) + " dBm)"));
  });
  if (mw) {
    const b = el("button", "fp-mw" + (here ? "" : " locked"), "Microwave"); b.type = "button";
    b.setAttribute("aria-label", "Microwave, " + Math.round(Math.hypot(mw.x - PLAN.AP.x, mw.z - PLAN.AP.z)) + " feet from the access point" + (here ? ". Use the arrow keys to move it a foot at a time, or drag it" : ". Walk to the break room to move it"));
    if (here) {
      b.addEventListener("keydown", function (e) { const step = e.shiftKey ? 4 : 1, d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]; if (!d) return; e.preventDefault(); ui.keepFocus = true; ctx.move(mw.x + d[0], mw.z + d[1]); });
      b.addEventListener("pointerdown", function (e) {
        e.preventDefault(); b.setPointerCapture(e.pointerId); const box = stage.getBoundingClientRect(); let x = mw.x, z = mw.z;
        function mv(ev) { x = (ev.clientX - box.left) / box.width * PLAN.W; z = (ev.clientY - box.top) / box.height * PLAN.D; b.style.left = (x / PLAN.W * 100) + "%"; b.style.top = (z / PLAN.D * 100) + "%"; }
        function up() { b.removeEventListener("pointermove", mv); b.removeEventListener("pointerup", up); ui.keepFocus = true; ctx.move(x, z); }
        b.addEventListener("pointermove", mv); b.addEventListener("pointerup", up);
      });
    }
    at(mw.x, mw.z, b);
    if (ui.keepFocus) { ui.keepFocus = false; setTimeout(function () { b.focus(); }, 0); }
  }
  wrap.appendChild(stage);

  const leg = el("ul", "fp-legend"); leg.setAttribute("aria-label", "Key");
  [["good", "Good: -67 dBm or better"], ["weak", "Weak: -67 to -75 dBm, slow"], ["drops", "Drops: weaker than -75 dBm"]].forEach(function (x) { const li = el("li"); li.appendChild(el("span", "fp-sw " + x[0], "")); li.appendChild(document.createTextNode(x[1])); leg.appendChild(li); });
  wrap.appendChild(leg);
  const list = el("ul", "fp-list"); list.setAttribute("aria-label", "Devices");
  r.devices.filter(function (d) { return d.pos; }).forEach(function (d) { const q = R.planQuality(r, d); list.appendChild(el("li", null, d.name + " (" + (d.where || "") + "): " + WORD[PLAN.grade(q)] + ", " + Math.round(q) + " dBm")); });
  if (mw) list.appendChild(el("li", null, "Microwave: " + Math.round(Math.hypot(mw.x - PLAN.AP.x, mw.z - PLAN.AP.z)) + " feet from the access point"));
  wrap.appendChild(list);
}
