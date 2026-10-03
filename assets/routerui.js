/* =====================================================================
   The 92 Series app, on the technician's laptop: customers share their
   router with Rafiki's IT Services from their own app, and it shows up
   here. Five pages, as a real router's admin has: Status, Wireless,
   Internet, Port forwarding, Administration.

   What the student types goes on the page (the router's form). Save
   writes it to the router; a restart makes the router run it. A bar
   says, in words, which of those is true right now, because that is
   exactly what the Tier 1 Router sim teaches.

   ctx: { routers() → [router], act(type, fn(fleet, r), extra), draw() }
   ui:  per-window state { sel, tab, msg, confirm }
   ===================================================================== */
import * as R from "./router.js";

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(label, cls, fn, aria) { const b = el("button", cls || "b", label); b.type = "button"; if (aria) b.setAttribute("aria-label", aria); b.addEventListener("click", fn); return b; }

const SEC_LABEL = { "WPA3": "WPA3-Personal", "WPA2/WPA3": "WPA2/WPA3 (transition)", "WPA2": "WPA2-Personal", "WPA": "WPA (TKIP)", "WEP": "WEP", "Open": "Open (no security)" };
const BAND_LABEL = { "2.4": "2.4 GHz", "5": "5 GHz", "dual": "Dual-band: 2.4 and 5 GHz, one name, band steering" };
const TABS = [["status", "Status"], ["wireless", "Wireless"], ["internet", "Internet"], ["forward", "Port forwarding"], ["admin", "Administration"]];

export function drawRouter(host, ctx, ui) {
  const wrap = el("div", "rt"); host.appendChild(wrap);
  const top = el("div", "rt-top"); top.appendChild(el("span", "rt-logo", "92")); top.appendChild(el("strong", null, "92 Series")); top.appendChild(el("span", "rt-sub", ctx.web ? "Access point · web admin · signed in as admin" : "Routers you manage"));
  wrap.appendChild(top);
  const list = ctx.routers();
  if (!list.length) { const p = el("div", "rt-empty"); p.appendChild(el("h2", null, "Nothing shared with you yet")); p.appendChild(el("p", null, "When a customer shares their 92 Series router with Rafiki's IT Services from their own app, it appears here.")); wrap.appendChild(p); return; }
  if (!list.some(function (r) { return r.id === ui.sel; })) { ui.sel = list[0].id; ui.tab = "status"; ctx.act("router-view", function (f, r) { R.note(f, r, "view", { tab: "status" }); }, { tab: "status", quiet: true }); }
  const r = list.filter(function (x) { return x.id === ui.sel; })[0];

  const head = el("div", "rt-head");
  const ht = el("div"); ht.appendChild(el("h2", null, r.site || r.label)); ht.appendChild(el("p", "rt-sub", r.model + " · firmware " + r.fw + (ctx.web ? " · 192.168.1.1, on our own network" : " · shared by " + (r.customer || "the customer") + " · remote management")));
  head.appendChild(ht);
  if (list.length > 1) { const pick = el("div", "rt-pick"); list.forEach(function (x) { const b = btn(x.site || x.label, "b small" + (x.id === r.id ? " pri" : ""), function () { ui.sel = x.id; ui.tab = "status"; ui.msg = null; ctx.act("router-view", function (f, rr) { R.note(f, rr, "view", { tab: "status" }); }, { tab: "status" }); }); b.setAttribute("aria-pressed", String(x.id === r.id)); pick.appendChild(b); }); head.appendChild(pick); }
  wrap.appendChild(head);

  const noun = ctx.web ? "access point" : "router";
  /* where the settings are: typed, saved, or running */
  const bar = el("div", "rt-state"); bar.setAttribute("role", "status");
  if (R.dirty(r)) { bar.classList.add("warn"); bar.appendChild(el("span", "rt-badge", "● Not saved")); bar.appendChild(el("span", null, "You have changes on this page that aren't saved. The " + noun + " isn't using them.")); }
  else if (R.pending(r)) { bar.classList.add("warn"); bar.appendChild(el("span", "rt-badge", "● Saved, not running")); bar.appendChild(el("span", null, "Saved to the " + noun + ". It keeps running its old settings until it restarts.")); }
  else { bar.appendChild(el("span", "rt-badge ok", "✓ Running")); bar.appendChild(el("span", null, "The " + noun + " is running exactly what's saved.")); }
  wrap.appendChild(bar);

  const tabs = el("div", "rt-tabs"); tabs.setAttribute("role", "group"); tabs.setAttribute("aria-label", "Router pages");
  TABS.forEach(function (t) { const b = btn(t[1], "b small" + (ui.tab === t[0] ? " pri" : ""), function () { ui.tab = t[0]; ui.msg = null; ui.confirm = null; ctx.act("router-view", function (f, rr) { R.note(f, rr, "view", { tab: t[0] }); }, { tab: t[0] }); }); b.setAttribute("aria-pressed", String(ui.tab === t[0])); tabs.appendChild(b); });
  wrap.appendChild(tabs);

  const page = el("section", "rt-page"); page.setAttribute("aria-label", (TABS.filter(function (t) { return t[0] === ui.tab; })[0] || TABS[0])[1]);
  ({ status: pageStatus, wireless: pageWireless, internet: pageInternet, forward: pageForward, admin: pageAdmin })[ui.tab || "status"](page, r, ctx, ui);
  wrap.appendChild(page);

  if (ui.msg) { const m = el("p", "rt-msg" + (ui.msgBad ? " bad" : ""), ui.msg); m.setAttribute("role", "status"); wrap.appendChild(m); }
  const foot = el("div", "rt-foot");
  foot.appendChild(btn("Save", "b" + (R.dirty(r) ? " pri" : ""), function () { const x = ctx.act("router-save", function (f, rr) { return R.save(f, rr); }); ui.msg = x && x.text; ui.msgBad = false; ctx.draw(); }, "Save: write the changes on this page to the " + noun));
  foot.appendChild(btn("Restart " + noun, "b" + (!R.dirty(r) && R.pending(r) ? " pri" : ""), function () { const x = ctx.act("router-reboot", function (f, rr) { return R.reboot(f, rr); }); ui.msg = x && x.text; ui.msgBad = !!(x && x.lost); ctx.draw(); }, "Restart the " + noun + ": it loads its saved settings"));
  wrap.appendChild(foot);
}

function kv(dl, k, v) { const d = el("div"); d.appendChild(el("dt", null, k)); d.appendChild(el("dd", null, v)); dl.appendChild(d); }
function pageStatus(p, r) {
  const w = R.wanStatus(r), run = r.running.wifi;
  p.appendChild(el("h3", null, "Internet"));
  const net = el("p", "rt-line " + (w.up ? "ok" : "bad")); net.appendChild(el("strong", null, w.up ? "✓ Connected" : "✕ Not connected")); net.appendChild(document.createTextNode(" · " + w.text)); p.appendChild(net);
  p.appendChild(el("h3", null, "Wi-Fi, as the router is running it now"));
  const dl = el("dl", "rt-kv");
  kv(dl, "Network name", run.ssid); kv(dl, "Security", SEC_LABEL[run.security]); kv(dl, "Band", BAND_LABEL[run.band]); kv(dl, "Channel", run.channel === "auto" ? "Automatic" : String(run.channel)); kv(dl, "Channel width", run.width + " MHz"); kv(dl, "MAC filtering", run.mac ? "On: allowed list only" : "Off");
  p.appendChild(dl);
  p.appendChild(el("h3", null, "Devices"));
  if (!r.devices.length) p.appendChild(el("p", null, "No devices are known to this router."));
  else { const where = r.devices.some(function (d) { return d.where; }), ips = r.devices.some(function (d) { return d.ip; }); const t = el("table", "rt-t"); const hr = el("tr"); (where ? ["Device", "Where"] : ["Device", "MAC address"]).concat(ips ? ["Address"] : []).concat(["Connection"]).forEach(function (h) { const th = el("th", null, h); th.setAttribute("scope", "col"); hr.appendChild(th); }); t.appendChild(hr);
    r.devices.forEach(function (d) { const j = R.joins(r, d); const tr = el("tr"); const th = el("th", null, d.name); th.setAttribute("scope", "row"); tr.appendChild(th); tr.appendChild(where ? el("td", null, d.port === "screened" ? "wired, orange SCREENED SUBNET port" : (d.where || "")) : el("td", "rt-mono", d.mac)); if (ips) tr.appendChild(el("td", "rt-mono", d.ip || "—")); tr.appendChild(el("td", j.ok ? (R.crowded(r) ? "rt-bad" : "rt-ok") : "rt-bad", j.ok ? (R.crowded(r) ? "✕ Connected but crawling: " + r.crowd + " devices share 2.4 GHz's three clear channels" : d.wired ? "✓ Connected (cable)" : "✓ Connected") : "✕ Not connected: " + j.why)); t.appendChild(tr); });
    const wr = el("div", "rt-tw"); wr.appendChild(t); p.appendChild(wr); }
  if (r.neighbours.length) {
    p.appendChild(el("h3", null, "Nearby networks (Wi-Fi scan)"));
    const t = el("table", "rt-t"); const hr = el("tr"); ["Network", "Channel", "Width", "Security"].forEach(function (h) { const th = el("th", null, h); th.setAttribute("scope", "col"); hr.appendChild(th); }); t.appendChild(hr);
    r.neighbours.forEach(function (n) { const tr = el("tr"); const th = el("th", null, n.ssid || n.name); th.setAttribute("scope", "row"); tr.appendChild(th); tr.appendChild(el("td", null, String(n.channel))); tr.appendChild(el("td", null, (n.width || 20) + " MHz")); tr.appendChild(el("td", null, n.security || "WPA2")); t.appendChild(tr); });
    const wr = el("div", "rt-tw"); wr.appendChild(t); p.appendChild(wr);
  }
}
function field(p, id, label, value, onChange, opts) {
  const row = el("div", "rt-f"); const lab = el("label", null, label); lab.setAttribute("for", id); row.appendChild(lab);
  let input;
  if (opts) { input = el("select", "field"); opts.forEach(function (o) { const op = el("option", null, o[1]); op.value = String(o[0]); if (String(o[0]) === String(value)) op.selected = true; input.appendChild(op); }); input.addEventListener("change", function () { onChange(input.value); }); }
  else { input = el("input", "field"); input.value = value; input.setAttribute("autocomplete", "off"); input.addEventListener("change", function () { onChange(input.value); }); }
  input.id = id; row.appendChild(input); p.appendChild(row); return input;
}
function edit(ctx, path, v) { ctx.act("router-edit", function (f, r) { R.edit(f, r, path, v); }, { path: path }); }
function pageWireless(p, r, ctx) {
  const w = r.form.wifi;
  p.appendChild(el("p", "rt-help", "Changes here go on the page first. Save writes them to the router; they take effect when it restarts."));
  field(p, "rt-ssid", "Network name (SSID)", w.ssid, function (v) { edit(ctx, "wifi.ssid", v); });
  field(p, "rt-wpass", "Wi-Fi password", w.pass, function (v) { edit(ctx, "wifi.pass", v); });
  field(p, "rt-sec", "Security", w.security, function (v) { edit(ctx, "wifi.security", v); }, R.SECURITY.map(function (s) { return [s, SEC_LABEL[s]]; }));
  field(p, "rt-band", "Band", w.band, function (v) { edit(ctx, "wifi.band", v); if (!R.channelValid(v, r.form.wifi.channel)) edit(ctx, "wifi.channel", "auto"); if (!R.widthValid(v, r.form.wifi.width)) edit(ctx, "wifi.width", 20); }, R.BANDS.map(function (b) { return [b, BAND_LABEL[b]]; }));
  const chans = [["auto", "Automatic"]].concat((w.band === "5" ? [36, 40, 44, 48, 149, 153, 157, 161] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).map(function (c) { return [c, String(c)]; }));
  field(p, "rt-chan", "Channel", w.channel, function (v) { edit(ctx, "wifi.channel", v === "auto" ? "auto" : Number(v)); }, chans);
  field(p, "rt-width", "Channel width", w.width, function (v) { edit(ctx, "wifi.width", Number(v)); }, (w.band === "2.4" ? [20, 40] : [20, 40, 80]).map(function (x) { return [x, x + " MHz"]; }));
  const mf = el("div", "rt-f"); const cb = el("input"); cb.type = "checkbox"; cb.id = "rt-mac"; cb.checked = !!w.mac; cb.addEventListener("change", function () { edit(ctx, "wifi.mac", cb.checked); });
  const cl = el("label", null, "MAC filtering: only devices on the allowed list can join"); cl.setAttribute("for", "rt-mac"); mf.classList.add("rt-check"); mf.appendChild(cb); mf.appendChild(cl); p.appendChild(mf);
  if (r.devices.length) {
    const t = el("table", "rt-t"); const hr = el("tr"); ["Device", "MAC address", "Allowed list", ""].forEach(function (h) { const th = el("th", null, h); th.setAttribute("scope", "col"); hr.appendChild(th); }); t.appendChild(hr);
    r.devices.forEach(function (d) { const on = w.allowed.indexOf(d.mac) >= 0; const tr = el("tr"); const th = el("th", null, d.name); th.setAttribute("scope", "row"); tr.appendChild(th); tr.appendChild(el("td", "rt-mono", d.mac)); tr.appendChild(el("td", null, on ? "✓ On the list" : "Not on the list"));
      const td = el("td"); td.appendChild(btn(on ? "Remove" : "Allow", "b small", function () { ctx.act("router-edit", function (f, rr) { if (on) R.disallow(f, rr, d.mac); else R.allow(f, rr, d.mac); }, { path: "wifi.allowed" }); }, (on ? "Remove " : "Allow ") + d.name)); tr.appendChild(td); t.appendChild(tr); });
    const wr = el("div", "rt-tw"); wr.appendChild(t); p.appendChild(wr);
  }
}
function pageInternet(p, r, ctx) {
  const w = r.form.wan;
  p.appendChild(el("p", "rt-help", "How the router signs in to the internet provider. Most providers hand out an address automatically; some need a PPPoE username and password from the customer's account."));
  field(p, "rt-wan", "Connection type", w.mode, function (v) { edit(ctx, "wan.mode", v); }, [["DHCP", "Automatic (DHCP)"], ["PPPoE", "PPPoE (username and password)"]]);
  if (w.mode === "PPPoE") { field(p, "rt-puser", "PPPoE username", w.user, function (v) { edit(ctx, "wan.user", v); }); field(p, "rt-ppass", "PPPoE password", w.pass, function (v) { edit(ctx, "wan.pass", v); }); }
}
function pageForward(p, r, ctx, ui) {
  const f0 = r.form;
  p.appendChild(el("p", "rt-help", "A port forward sends one kind of traffic from the internet to one device inside. The screened-subnet (DMZ) host gets everything that isn't forwarded, so it sits outside the LAN's protection."));
  if (f0.forwards.length) {
    const t = el("table", "rt-t"); const hr = el("tr"); ["Name", "Protocol", "Outside port", "Inside device", "Inside port", ""].forEach(function (h) { const th = el("th", null, h); th.setAttribute("scope", "col"); hr.appendChild(th); }); t.appendChild(hr);
    f0.forwards.forEach(function (x) { const tr = el("tr"); [x.name || "(no name)", x.proto, x.ext, x.ip, x.port].forEach(function (c) { tr.appendChild(el("td", null, c)); }); const td = el("td"); td.appendChild(btn("Remove", "b small", function () { ctx.act("router-edit", function (f, rr) { R.removeForward(f, rr, x.ext, x.proto); }, { path: "forwards" }); }, "Remove the forward for " + x.proto + " " + x.ext)); tr.appendChild(td); t.appendChild(tr); });
    const wr = el("div", "rt-tw"); wr.appendChild(t); p.appendChild(wr);
  } else p.appendChild(el("p", null, "No port forwards."));
  ui.fw = ui.fw || { name: "", proto: "TCP", ext: "", ip: "", port: "" };
  const box = el("fieldset", "rt-add"); box.appendChild(el("legend", null, "Add a port forward"));
  field(box, "rt-fn", "Name", ui.fw.name, function (v) { ui.fw.name = v; });
  field(box, "rt-fp", "Protocol", ui.fw.proto, function (v) { ui.fw.proto = v; }, [["TCP", "TCP"], ["UDP", "UDP"]]);
  field(box, "rt-fe", "Outside port", ui.fw.ext, function (v) { ui.fw.ext = v.trim(); });
  field(box, "rt-fi", "Inside device's IP address", ui.fw.ip, function (v) { ui.fw.ip = v.trim(); });
  field(box, "rt-fq", "Inside port", ui.fw.port, function (v) { ui.fw.port = v.trim(); });
  box.appendChild(btn("Add the forward", "b", function () {
    if (!/^\d{1,5}$/.test(ui.fw.ext) || !/^\d{1,3}(\.\d{1,3}){3}$/.test(ui.fw.ip)) { ui.msg = "A forward needs an outside port (a number) and the inside device's IP address."; ui.msgBad = true; ctx.act("router-view", function () {}, { quiet: true }); return; }
    const fw = Object.assign({}, ui.fw, { port: ui.fw.port || ui.fw.ext }); ui.fw = null; ui.msg = null;
    ctx.act("router-edit", function (f, rr) { R.addForward(f, rr, fw); }, { path: "forwards" });
  }));
  p.appendChild(box);
  field(p, "rt-dmz", "Screened-subnet (DMZ) host: IP address, blank for none", f0.screened || "", function (v) { edit(ctx, "screened", v.trim() || null); });
}
function pageAdmin(p, r, ctx, ui) {
  p.appendChild(el("h3", null, "Admin password"));
  p.appendChild(el("p", "rt-help", "The password that signs in to this router's settings. It's separate from the Wi-Fi password."));
  ui.ap = ui.ap || { cur: "", next: "", again: "" };
  field(p, "rt-acur", "Current admin password", ui.ap.cur, function (v) { ui.ap.cur = v; });
  field(p, "rt-anew", "New admin password", ui.ap.next, function (v) { ui.ap.next = v; });
  field(p, "rt-aagain", "New admin password, again", ui.ap.again, function (v) { ui.ap.again = v; });
  p.appendChild(btn("Change admin password", "b", function () {
    const a = ui.ap; const x = ctx.act("router-admin-pass", function (f, rr) { return R.setAdminPass(f, rr, a.cur, a.next, a.again); });
    ui.msg = x.text; ui.msgBad = !x.ok; if (x.ok) ui.ap = null; ctx.draw();
  }));
  p.appendChild(el("h3", null, "Firmware"));
  p.appendChild(btn("Check for updates", "b", function () { const x = ctx.act("router-firmware", function (f, rr) { return R.firmware(f, rr); }); ui.msg = x.text; ui.msgBad = false; ctx.draw(); }));
  p.appendChild(el("h3", null, "Factory reset"));
  p.appendChild(el("p", "rt-help", "Erases everything configured on this router and puts back what's printed on its sticker."));
  if (ui.confirm === "reset") {
    const c = el("div", "rt-confirm"); c.setAttribute("role", "alertdialog"); c.setAttribute("aria-label", "Confirm factory reset");
    c.appendChild(el("p", null, "Erase every setting on " + (r.site || "this router") + "? Every device will lose its Wi-Fi."));
    c.appendChild(btn("Yes, erase everything", "b", function () { ui.confirm = null; const x = ctx.act("router-factory", function (f, rr) { return R.factoryReset(f, rr); }); ui.msg = x.text; ui.msgBad = true; ctx.draw(); }));
    c.appendChild(btn("Cancel", "b", function () { ui.confirm = null; ctx.act("router-view", function () {}, { quiet: true }); }));
    p.appendChild(c);
  } else p.appendChild(btn("Factory reset…", "b", function () { ui.confirm = "reset"; ctx.act("router-view", function () {}, { quiet: true }); }));
}
