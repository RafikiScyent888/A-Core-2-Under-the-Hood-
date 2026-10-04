/* =====================================================================
   The street (Neighboring Routers): the three houses from the sim's
   Router_houses.png, in 3D, with each router's reach and channel
   (owner, 30 September 2026: "The three houses ... get a 3D street. It
   shows each router's reach and channel").

   Router 1 is the orange house, Router 2 the tan one, Router 3 the blue
   one at the end: the customer's, the one the student sets (as the exam
   view labels them).

   Everything is drawn from what the routers are RUNNING, so it shows what
   the settings do, never what they should be. The words carry it all:
   the label over each house, the 2.4 GHz band chart and the list say the
   same as the colours, so it reads without colour, without WebGL, with
   the dyslexia setting, and is measured for contrast. A neighbour is
   judged on its main channel, as router.js and the sim's key judge it.

   ctx: { router() → r or null, street() → "3 Willow Street", look() }
   ===================================================================== */
import * as R from "./router.js";

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
/* royal colours, one per channel family: 1 blue, 6 purple, 11 green, and
   yellow for any channel in between */
function chanCol(ch, band) { if (band === "5") return { fill: "#475569", cls: "c5" }; ch = Number(ch); return ch === 1 ? { fill: "#1d4ed8", cls: "c1" } : ch === 6 ? { fill: "#6d28d9", cls: "c6" } : ch === 11 ? { fill: "#15803d", cls: "c11" } : { fill: "#ca8a04", cls: "cx" }; }
const HOUSE = ["the orange house", "the tan house", "the blue house, at the end"];

/* the routers on the street, from the running settings */
export function streetState(r) {
  const run = r.running.wifi, clash = R.interference(r);
  const list = r.neighbours.slice(0, 2).map(function (n, i) { return { house: i, name: n.name, ssid: n.ssid, channel: n.channel, width: 20, band: n.band || "2.4", ours: false, clash: clash.indexOf(n) >= 0 }; });
  list.push({ house: 2, name: "Router 3", ssid: run.ssid, channel: run.channel, width: Number(run.width), band: run.band, ours: true, clash: false });
  list.forEach(function (x) { x.col = chanCol(x.channel, x.band); });
  return { list: list, clash: clash, run: run };
}

export function drawStreetView(host, ctx, ui) {
  const r = ctx.router();
  host.innerHTML = "";
  const wrap = el("div", "sv"); host.appendChild(wrap);
  if (!r) { wrap.appendChild(el("p", "sv-note", "The street opens during a Neighboring Routers ticket, from the ticket's Look at the street in 3D.")); return null; }
  const S = streetState(r);
  const head = el("div", "sv-head");
  head.appendChild(el("h2", null, ctx.street() + " · Router 3 and its neighbours"));
  head.appendChild(el("p", "sv-note", "Drawn from what each router is running now. Each disc is a router's reach, in its channel's colour; red stripes mark ground where Router 3 overlaps a neighbour. Drag to look around."));
  wrap.appendChild(head);

  /* the 3D street, with a label over each house */
  const stage = ui.stage || (ui.stage = el("div", "sv-stage"));
  stage.setAttribute("aria-hidden", "true");
  wrap.appendChild(stage);
  let tags = stage.querySelector(".sv-tags"); if (tags) tags.remove();
  tags = el("div", "sv-tags"); stage.appendChild(tags);
  S.list.forEach(function (x) {
    const t = el("span", "sv-tag " + x.col.cls); t.dataset.house = x.house;
    t.appendChild(el("strong", null, x.name + (x.ours ? " (yours to set)" : "")));
    t.appendChild(el("span", null, chanText(x)));
    if (x.ours) t.appendChild(el("span", "sv-tag-say " + (S.clash.length ? "bad" : "ok"), S.clash.length ? "✕ Overlaps " + S.clash.map(function (n) { return n.name; }).join(" and ") : "✓ No overlap"));
    tags.appendChild(t);
  });
  function place() {
    if (!ui.office) return;
    /* over each house's roof; a label that would cover another is lifted
       above it (or dropped below, at the top edge), so all three read */
    const done = [], W = stage.clientWidth;
    tags.querySelectorAll(".sv-tag").forEach(function (t) {
      const p = ui.office.houseAt(Number(t.dataset.house)); if (!p || p.behind) { t.style.visibility = "hidden"; return; }
      t.style.visibility = ""; const w = t.offsetWidth, h = t.offsetHeight;
      let x = Math.max(w / 2 + 4, Math.min(W - w / 2 - 4, p.x)), y = Math.max(h + 4, p.y);
      const hit = function () { return done.some(function (b) { return x - w / 2 < b.r + 6 && x + w / 2 > b.l - 6 && y - h < b.b + 6 && y > b.t - 6; }); };
      for (let k = 0; k < 4 && hit(); k++) y -= h + 8;
      if (y - h < 4) { y = Math.max(h + 4, p.y); for (let k = 0; k < 4 && hit(); k++) y += h + 8; }
      t.style.left = x + "px"; t.style.top = y + "px"; done.push({ l: x - w / 2, r: x + w / 2, t: y - h, b: y });
    });
  }
  ui.place = place;
  if (ui.office) { ui.office.street(S.list.map(function (x) { return { house: x.house, fill: x.col.fill, ours: x.ours, clash: x.clash }; })); place(); }
  else if (!ui.mounting) {
    ui.mounting = true;
    import("./office3d.js").then(function (mod) {
      if (!mod.webglOK()) throw new Error("no webgl");
      return mod.mountOffice(stage, { street: true, height: 380, onView: function () { if (ui.place) ui.place(); } });
    }).then(function (o) {
      ui.office = o; stage.querySelector("canvas").classList.add("sv-canvas");
      const S2 = streetState(ctx.router() || r);
      o.street(S2.list.map(function (x) { return { house: x.house, fill: x.col.fill, ours: x.ours, clash: x.clash }; }));
      o.flyIn(function () { if (ui.place) ui.place(); }); if (ui.place) ui.place();
    }).catch(function () { stage.classList.add("sv-off"); stage.insertBefore(el("p", "sv-note", "3D isn't available on this computer. The band chart and the list below say the same thing."), stage.firstChild); });
  }

  /* the 2.4 GHz band, as a Wi-Fi analyzer draws it */
  const band = el("figure", "sv-band"); band.appendChild(el("figcaption", null, "The 2.4 GHz band: where each router's channel sits, and how much room it takes"));
  const grid = el("div", "sv-grid");
  const lo = 2399, hi = 2475, pct = function (f) { return ((f - lo) / (hi - lo) * 100) + "%"; };
  const axis = el("div", "sv-row sv-axis"); axis.appendChild(el("span", "sv-who", "Channel"));
  const ticks = el("div", "sv-track"); for (let c = 1; c <= 11; c++) { const k = el("span", "sv-tick" + ([1, 6, 11].indexOf(c) >= 0 ? " main" : ""), String(c)); k.style.left = pct(2407 + 5 * c); ticks.appendChild(k); } axis.appendChild(ticks); grid.appendChild(axis);
  S.list.forEach(function (x) {
    const row = el("div", "sv-row"); row.appendChild(el("span", "sv-who", x.name));
    const tr = el("div", "sv-track");
    if (x.band === "5") tr.appendChild(el("span", "sv-off5", "On 5 GHz: not in this band"));
    else if (x.channel === "auto") tr.appendChild(el("span", "sv-off5", "Automatic: the router picks"));
    else { const f = 2407 + 5 * Number(x.channel), w = x.ours && x.width >= 40 ? 40 : 22; const b = el("span", "sv-bar " + x.col.cls, "ch " + x.channel + (x.ours ? " · " + x.width + " MHz" : "")); b.style.left = pct(f - w / 2); b.style.width = ((w / (hi - lo)) * 100) + "%"; tr.appendChild(b); }
    row.appendChild(tr); grid.appendChild(row);
  });
  band.appendChild(grid);
  band.appendChild(el("p", "sv-note", "A 20 MHz signal is about 22 MHz wide and channels are 5 MHz apart, so only 1, 6 and 11 stay clear of each other. A neighbour is judged on its main channel."));
  wrap.appendChild(band);

  /* and in words */
  const ul = el("ul", "sv-list"); ul.setAttribute("aria-label", "Routers on the street");
  S.list.forEach(function (x) {
    const li = el("li"); li.appendChild(el("strong", null, x.name + ", " + HOUSE[x.house] + ": "));
    li.appendChild(document.createTextNode((x.ours ? "running " : "") + chanText(x) + (x.ssid ? " (" + x.ssid + ")" : "") + ". "));
    if (x.ours) li.appendChild(el("span", "sv-say " + (S.clash.length ? "bad" : "ok"), S.clash.length ? "✕ Overlaps " + S.clash.map(function (n) { return n.name + " (channel " + n.channel + ")"; }).join(" and ") + ": they take turns on the air, so it slows and drops." : "✓ Clear of both neighbours."));
    ul.appendChild(li);
  });
  wrap.appendChild(ul);
  return S;
}
function chanText(x) {
  if (x.band === "5") return "5 GHz, channel " + x.channel;
  if (x.channel === "auto") return "2.4 GHz, channel chosen automatically";
  return "channel " + x.channel + (x.ours ? " at " + x.width + " MHz" : "");
}
