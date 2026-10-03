/* =====================================================================
   Routers: the 92 Series (owner, 1 October 2026: "92 Series Routers"),
   as plain JSON on TECH-01's record, so the engine's snapshots and
   revert cover them. No DOM: the web admin and the app both drive this.

   Every router keeps three copies of its settings, as real ones do:
     form     what is typed on the page right now (lost on a reboot)
     saved    what Save wrote to the router's memory
     running  what the router is actually doing; a reboot loads it from
              saved
   That is why the Tier 1 Router sim's second step is "save the changes
   and reboot": skip either and the change isn't really made.

   Customer jobs are remote (owner, 1 October 2026). What only someone
   standing at the router can do, the customer does on the phone: ask().

   Everything a ticket judges is computed here from the RUNNING settings
   and the house around the router (its devices and neighbours), so a
   ticket closes only when the router really works.
   ===================================================================== */
import * as M from "./machine.js";

export function all(fleet) { const t = fleet.TECH; if (!t.routers) t.routers = {}; return t.routers; }
export function get(fleet, id) { return all(fleet)[id]; }
function copy(x) { return JSON.parse(JSON.stringify(x)); }

export const SECURITY = ["WPA3", "WPA2/WPA3", "WPA2", "WPA", "WEP", "Open"];
export const BANDS = ["2.4", "5", "dual"];
const BASE = {
  admin: { user: "admin", pass: "admin" },
  wifi: { ssid: "92Series-4F1A", pass: "92series1234", security: "WPA2", band: "2.4", channel: 1, width: 20, mac: false, allowed: [], steering: false },
  lan: { ip: "192.168.1.1", mask: "255.255.255.0", dhcp: true },
  wan: { mode: "DHCP", user: "", pass: "" },
  forwards: [],
  screened: null
};

/* A router, from a ticket's description of it.
     o.cfg      settings that differ from the factory ones (deep-merged)
     o.devices  the house's devices: { name, mac, wpa3, bands, knows,
                ssid, walls, where } — knows is the Wi-Fi password the
                device has saved, ssid the network it looks for, walls the
                thick walls between it and the router
     o.crowd    how many devices share one room (a meeting's laptops)
     o.web      reached at 192.168.1.1 in the browser (Rafiki's own access
                point), not shared in the 92 Series app
     o.neighbours  other routers in range: { name, ssid, channel, width }
     o.phys     { wanPort: "wan" | "lan1", power: "ok" | "faulty" }
     o.isp      { mode: "DHCP" } or { mode: "PPPoE", user, pass, letter },
                or { mode: "unprovisioned" } (the provider hasn't
                registered this router: only they can fix it) */
export function add(fleet, o) {
  const cfg = copy(BASE);
  Object.keys(o.cfg || {}).forEach(function (k) { cfg[k] = cfg[k] && typeof cfg[k] === "object" && !Array.isArray(cfg[k]) ? Object.assign(cfg[k], copy(o.cfg[k])) : copy(o.cfg[k]); });
  const r = { id: o.id, label: o.label || "92 Series AX1800", site: o.site || "", customer: o.customer || "", model: o.model || "92 Series AX1800", fw: "1.0.4",
    sticker: { pass: cfg.admin.pass, ssid: cfg.wifi.ssid, wifiPass: cfg.wifi.pass },
    phys: Object.assign({ wanPort: "wan", power: "ok" }, o.phys || {}), isp: Object.assign({ mode: "DHCP" }, o.isp || {}), publicIp: o.publicIp || "50.90.234.1",
    devices: copy(o.devices || []), neighbours: copy(o.neighbours || []), crowd: o.crowd || 0, web: !!o.web, where: o.where || "",
    saved: cfg, running: copy(cfg), form: copy(cfg), events: [], signedIn: false };
  all(fleet)[o.id] = r;
  return r;
}
export function note(fleet, r, kind, d) { r.events.push(Object.assign({ kind: kind, at: r.events.length }, d || {})); M.note(fleet.TECH, "router-" + kind, Object.assign({ router: r.id }, d || {})); }
export function did(r, kind) { return r.events.some(function (e) { return e.kind === kind; }); }

/* ------------------------------------------------------- signing in */
export function signIn(fleet, r, user, pass) {
  const ok = user === r.running.admin.user && pass === r.running.admin.pass;
  note(fleet, r, ok ? "sign-in" : "sign-in-failed");
  r.signedIn = ok;
  return ok ? { ok: true } : { ok: false, text: "Wrong username or password." };
}

/* --------------------------------------------------------- the edits */
export function edit(fleet, r, path, value) {
  const p = path.split("."); let x = r.form;
  for (let i = 0; i < p.length - 1; i++) x = x[p[i]];
  x[p[p.length - 1]] = value;
  note(fleet, r, "edit", { path: path });
}
export function dirty(r) { return JSON.stringify(r.form) !== JSON.stringify(r.saved); }
/* What a reboot would apply that the router isn't doing yet. */
export function pending(r) { return JSON.stringify(r.saved) !== JSON.stringify(r.running); }

/* A strong password: 12 or more characters, upper and lower case, a
   digit and a symbol, and not the one on the sticker. */
export function strong(p, sticker) { return typeof p === "string" && p.length >= 12 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p) && p !== sticker && p.toLowerCase().indexOf("admin") < 0; }
export function setAdminPass(fleet, r, cur, next, again) {
  if (cur !== r.form.admin.pass) return { ok: false, text: "The current password is wrong." };
  if (next !== again) return { ok: false, text: "The new passwords don't match." };
  if (!strong(next, r.sticker.pass)) return { ok: false, text: "Choose a stronger password: at least 12 characters, with upper and lower case letters, a number and a symbol, and not the default." };
  r.form.admin.pass = next; note(fleet, r, "admin-pass");
  return { ok: true, text: "Password changed on this page. Press Save to write it to the router." };
}
export function addForward(fleet, r, f) {
  const rule = { name: f.name || "", proto: f.proto || "TCP", ext: String(f.ext), ip: f.ip, port: String(f.port || f.ext) };
  r.form.forwards = r.form.forwards.filter(function (x) { return !(x.ext === rule.ext && x.proto === rule.proto); }).concat([rule]);
  note(fleet, r, "forward-add", { ext: rule.ext });
}
export function removeForward(fleet, r, ext, proto) { r.form.forwards = r.form.forwards.filter(function (x) { return !(x.ext === String(ext) && x.proto === (proto || x.proto)); }); note(fleet, r, "forward-remove", { ext: String(ext) }); }
export function allow(fleet, r, mac) { if (r.form.wifi.allowed.indexOf(mac) < 0) r.form.wifi.allowed.push(mac); note(fleet, r, "mac-allow", { mac: mac }); }
export function disallow(fleet, r, mac) { r.form.wifi.allowed = r.form.wifi.allowed.filter(function (x) { return x !== mac; }); note(fleet, r, "mac-remove", { mac: mac }); }

export function save(fleet, r) { r.saved = copy(r.form); note(fleet, r, "save"); return { ok: true, text: "Settings saved. They take effect after the router restarts." }; }
/* A reboot loads what was saved. Anything typed but not saved is lost. */
export function reboot(fleet, r) {
  const lost = dirty(r);
  r.running = copy(r.saved); r.form = copy(r.saved); r.signedIn = false;
  note(fleet, r, "reboot", { lost: lost });
  return { ok: true, lost: lost, text: lost ? "The router restarted. Changes that weren't saved were lost." : "The router restarted with the saved settings." };
}
export function factoryReset(fleet, r) {
  const fresh = copy(BASE); fresh.admin.pass = r.sticker.pass; fresh.wifi.ssid = r.sticker.ssid; fresh.wifi.pass = r.sticker.wifiPass;
  r.saved = fresh; r.running = copy(fresh); r.form = copy(fresh); r.signedIn = false;
  note(fleet, r, "factory-reset"); return { ok: true, text: "The router was reset to its factory settings. Everything configured on it is gone." };
}
export function firmware(fleet, r) { note(fleet, r, "firmware"); return { ok: true, text: "Firmware " + r.fw + " is the latest version for this model." }; }

/* ------------------------------------------------- what it's doing */
export function defaultPass(r) { return r.running.admin.pass === r.sticker.pass; }
export function wanStatus(r) {
  if (r.phys.power === "faulty") return { up: false, code: "power", text: "The router restarted unexpectedly (power loss). Uptime: 4 minutes." };
  if (r.phys.wanPort !== "wan") return { up: false, code: "cable", text: "No cable detected in the INTERNET port." };
  if (r.isp.mode === "unprovisioned") return { up: false, code: "provision", text: "Cable connected, but the provider gave no address. This router isn't registered with them yet." };
  if (r.isp.mode === "PPPoE") {
    if (r.running.wan.mode !== "PPPoE") return { up: false, code: "mode", text: "Cable connected, but no address was offered. The provider may need a PPPoE sign-in." };
    if (r.running.wan.user !== r.isp.user || r.running.wan.pass !== r.isp.pass) return { up: false, code: "pppoe", text: "PPPoE authentication failed: the provider rejected the username or password." };
  }
  return { up: true, code: "up", text: "Connected · public address " + r.publicIp };
}

/* 2.4 GHz channels are 5 MHz apart and a 20 MHz signal is about 22 MHz
   wide, so only 1, 6 and 11 clear each other. Our own 40 MHz channel
   takes twice the room. A neighbour is judged on its main channel, as a
   Wi-Fi analyzer lists it and as the Neighboring Routers sim keys it
   (Router 3 on 11 clears neighbours on 1 and 6). 5 GHz channels don't
   overlap at these widths. */
function centre(ch) { return 2407 + 5 * Number(ch); }
function span(w) { return Number(w) >= 40 ? 40 : 22; }
export function overlaps(mine, theirs) {
  if (mine.band === "5" || theirs.band === "5") return mine.band === theirs.band && Number(mine.channel) === Number(theirs.channel);
  return Math.abs(centre(mine.channel) - centre(theirs.channel)) < (span(mine.width) + 22) / 2;
}
/* Which neighbours the router's running 2.4 GHz signal collides with. */
export function interference(r) {
  const w = r.running.wifi; if (w.band === "5") return [];
  if (w.channel === "auto") return [];
  return r.neighbours.filter(function (n) { return overlaps({ band: "2.4", channel: w.channel, width: w.width }, { band: n.band || "2.4", channel: n.channel }); });
}
export function widthValid(band, width) { return band === "5" || band === "dual" ? [20, 40, 80].indexOf(Number(width)) >= 0 : [20, 40].indexOf(Number(width)) >= 0; }
export function channelValid(band, ch) { if (ch === "auto") return true; ch = Number(ch); return band === "5" ? [36, 40, 44, 48, 149, 153, 157, 161].indexOf(ch) >= 0 : ch >= 1 && ch <= 11; }

/* Can this device join the Wi-Fi as the router is RUNNING now? The
   reason is in plain words, for the status page and the customer. */
export function joins(r, d) {
  const w = r.running.wifi;
  if (wanStatus(r).code === "power") return { ok: false, why: "The router keeps restarting." };
  const bands = d.bands || ["2.4", "5"];
  if (d.ssid && d.ssid !== w.ssid) return { ok: false, why: d.name + " is looking for \"" + d.ssid + "\" and can't find it." };
  if (w.band !== "dual" && bands.indexOf(w.band) < 0) return { ok: false, why: d.name + " can't see the network: it only has " + bands.join(" and ") + " GHz." };
  /* 5 GHz is stopped by thick walls; 2.4 GHz gets through. Dual-band
     steers a far device onto 2.4 GHz. */
  if (w.band === "5" && (d.walls || 0) >= 2) return { ok: false, why: d.name + " can't hold a signal: 5 GHz doesn't get through " + d.walls + " thick walls." };
  if (w.security === "WPA3" && !d.wpa3) return { ok: false, why: d.name + " only supports WPA2, so it can't join a WPA3-only network." };
  if (w.mac && w.allowed.indexOf(d.mac) < 0) return { ok: false, why: d.name + " is blocked: its MAC address isn't on the allowed list." };
  if (w.security !== "Open" && d.knows !== w.pass) return { ok: false, why: d.name + " has a different Wi-Fi password saved." };
  return { ok: true, why: d.name + " is connected." };
}
/* Many devices in one room on 2.4 GHz, which has only three channels
   that don't overlap: they join, but it crawls. */
export function crowded(r) { return r.running.wifi.band === "2.4" && (r.crowd || 0) >= 15; }
/* Who can join who shouldn't: open or weak security, or no MAC list when
   the customer asked for approved devices only. */
export function weakSecurity(r) { const s = r.running.wifi.security; return s === "Open" || s === "WEP" || s === "WPA"; }
export function strongestFor(r) { return r.devices.every(function (d) { return d.wpa3; }) ? "WPA3" : "WPA2/WPA3"; }

/* What reaches in from the internet: each forward, and everything for
   the screened-subnet host. */
export function inbound(r, port, proto) {
  port = String(port); proto = proto || "TCP";
  const f = r.running.forwards.filter(function (x) { return x.ext === port && x.proto === proto; })[0];
  if (f) return { to: f.ip, port: f.port, via: "forward" };
  if (r.running.screened) return { to: r.running.screened, port: port, via: "screened" };
  return null;
}
export function deviceByName(r, name) { return r.devices.filter(function (d) { return d.name === name; })[0]; }

/* The things only someone standing at the router can do. The customer
   does them, on the phone. */
export function ask(fleet, r, what) {
  note(fleet, r, "ask", { what: what });
  if (what === "ports") return r.phys.wanPort === "wan" ? "\"The cable from the modem goes into the blue port marked INTERNET.\"" : "\"The cable from the modem is in one of the yellow ones, number 1. The blue INTERNET port is empty.\"";
  if (what === "move") { if (r.phys.wanPort === "wan") return "\"It's already in the blue one.\""; r.phys.wanPort = "wan"; note(fleet, r, "cable-moved"); return "\"OK, it's in the blue INTERNET port now. The globe light just came on.\""; }
  if (what === "lights") { const s = wanStatus(r); return s.code === "power" ? "\"Every light goes out every few minutes, then they all come back.\"" : "\"Power is green. The globe light is " + (s.up ? "green" : "orange") + ". The Wi-Fi light is blinking.\""; }
  if (what === "sticker") return "\"The sticker underneath says: admin password " + r.sticker.pass + ", Wi-Fi " + r.sticker.ssid + ".\"";
  if (what === "adapter") return r.phys.power === "faulty" ? "\"It's the one that came in the box, and it's plugged straight into the wall.\"" : "\"It's the one from the box.\"";
  if (what === "socket") { note(fleet, r, "socket-moved"); return r.phys.power === "faulty" ? "\"I've moved it to the socket by the door. … It's just gone off again.\"" : "\"Moved. It's running fine.\""; }
  if (what === "letter") return r.isp.mode === "PPPoE" && r.isp.letter ? "\"Found the welcome letter. Username " + r.isp.user + ", password " + r.isp.pass + ".\"" : "\"I've looked everywhere. There's nothing from the provider with a username on it.\"";
  if (what === "power") { note(fleet, r, "power-cycle"); r.running = copy(r.saved); r.form = copy(r.saved); r.signedIn = false; return "\"I've unplugged it, counted to ten, and plugged it back in. The lights are coming back.\""; }
  return "\"OK.\"";
}
