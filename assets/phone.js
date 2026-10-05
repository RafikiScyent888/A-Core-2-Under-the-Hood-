/* =====================================================================
   A company phone's operating system, for the mobile troubleshooting
   tickets (Core 2, Software troubleshooting: "Mobile troubleshooting:
   addressing connectivity, app, and performance issues"). Plain JSON on
   the phone record mobile.js keeps (fleet.TECH.phones[id].dev), so the
   engine's snapshots and revert cover it. No DOM: phoneui.js draws it.

   Everything the student sees is worked out from these settings, the way
   a real phone behaves:
     battery    each app's drain from its background battery setting and
                its location permission; hours left and heat follow
     internet   airplane mode, Wi-Fi, mobile data, and Private DNS (a
                server that can't be reached means "Connected, no
                internet" on every network)
     apps       open, force stop, clear cache, clear storage (which loses
                anything not yet synced), update, uninstall, permissions
     storage    what's using the space, and whether it's backed up
     updates    a system update needs its size free to install
     security   apps installed from outside the store, the per-app
                "Install unknown apps" switch, Play Protect
   ===================================================================== */
function copy(x) { return JSON.parse(JSON.stringify(x)); }
export function note(p, kind, d) { p.events.push(Object.assign({ kind: kind, at: p.events.length }, d || {})); }
export function lastAt(p, kind, test) { const e = p.events.filter(function (x) { return x.kind === kind && (!test || test(x)); }); return e.length ? e[e.length - 1].at : -1; }

export const BATTERY = ["Unrestricted", "Optimized", "Restricted"];
export const LOCATION = ["Allow all the time", "Allow only while using the app", "Ask every time", "Don't allow"];
const SYSTEM_GB = 22;

/* the parts of the OS every phone has; a ticket adds the rest */
export function ready(p) {
  if (!p.dev) p.dev = {
    version: "Android 15", patch: "1 August 2026", update: null,
    battery: { level: 64, saver: false },
    net: { airplane: false, wifi: true, ssid: "Rafiki-Staff", saved: ["Rafiki-Staff", "Home"], data: true, dataSaver: false, privateDns: "Automatic", dataLimitGB: 10 },
    storage: { totalGB: 128, items: [] },
    apps: {}, unknown: { Chrome: false, Files: false }, protect: { last: null, found: [] }, wiped: false
  };
  return p;
}
export function addApp(p, id, o) {
  ready(p).dev.apps[id] = Object.assign({ name: id, ver: "1.0", latest: null, source: "Google Play", battery: "Optimized", bgData: true, location: null, cacheGB: 0.1, dataGB: 0.2, drafts: 0, broken: null, drain: 0, locDrain: false, adware: false, system: false, installed: true, signedIn: true, mail: false }, o);
}
export function app(p, id) { const a = ready(p).dev.apps[id]; return a && a.installed ? a : null; }
export function apps(p) { const A = ready(p).dev.apps; return Object.keys(A).filter(function (k) { return A[k].installed; }).map(function (k) { return Object.assign({ id: k }, A[k]); }); }

/* --------------------------------------------------------- battery */
export function drainOf(a) {
  if (!a || !a.installed) return 0;
  const loc = a.locDrain && a.location !== "Allow all the time" ? 0.4 : 1;
  const bat = { Unrestricted: 1, Optimized: 0.5, Restricted: 0.12 }[a.battery] || 0.5;
  return Math.round(a.drain * loc * bat * 10) / 10;
}
export function battery(p) {
  ready(p); const list = apps(p).map(function (a) { return { id: a.id, name: a.name, pct: drainOf(a), battery: a.battery }; }).filter(function (x) { return x.pct > 0; });
  const total = list.reduce(function (s, x) { return s + x.pct; }, 0) + 6;                /* the screen and the system */
  const hours = Math.max(3, Math.round((27 - total * 0.33) * (p.dev.battery.saver ? 1.25 : 1)));
  list.sort(function (a, b) { return b.pct - a.pct; });
  return { hours: hours, hot: total > 40, list: list, total: total };
}

/* -------------------------------------------------------- internet */
const GOOD_DNS = ["dns.google", "one.one.one.one", "dns.quad9.net"];
export function internet(p) {
  const n = ready(p).dev.net;
  if (p.dev.wiped) return { ok: false, how: "none", text: "Not set up: the phone was erased and is at its welcome screen." };
  if (n.airplane) return { ok: false, how: "none", text: "Airplane mode is on: no Wi-Fi, no mobile data." };
  const how = n.wifi && n.ssid ? "Wi-Fi (" + n.ssid + ")" : n.data ? "Mobile data (5G)" : null;
  if (!how) return { ok: false, how: "none", text: "No connection: Wi-Fi isn't connected and mobile data is off." };
  if (n.privateDns !== "Automatic" && n.privateDns !== "Off" && GOOD_DNS.indexOf(n.privateDns) < 0) return { ok: false, how: how, text: "Connected, no internet. Private DNS server can't be accessed (" + n.privateDns + ")." };
  return { ok: true, how: how, text: "Connected to the internet over " + how + "." };
}
export function setNet(p, key, value) { ready(p).dev.net[key] = value; note(p, "net", { key: key, value: value }); return { ok: true }; }
export function forgetNetwork(p, ssid) {
  const n = ready(p).dev.net; n.saved = n.saved.filter(function (s) { return s !== ssid; }); if (n.ssid === ssid) { n.ssid = null; n.wifi = false; }
  note(p, "forget", { ssid: ssid }); return { ok: true, text: ssid + " was forgotten. To join it again, the Wi-Fi password is needed." };
}
/* reset network settings: Wi-Fi, mobile data and Bluetooth back to their
   defaults; every saved network and pairing is forgotten */
export function resetNetwork(p) {
  const n = ready(p).dev.net; n.privateDns = "Automatic"; n.saved = []; n.ssid = null; n.wifi = false; n.airplane = false; n.data = true; n.dataSaver = false;
  note(p, "reset-network"); return { ok: true, text: "Network settings were reset. Saved Wi-Fi networks and Bluetooth pairings were removed; the phone is on mobile data until it joins Wi-Fi again." };
}

/* ------------------------------------------------------------ apps */
export function openApp(p, id) {
  const a = app(p, id); ready(p);
  if (!a) return { ok: false, text: "That app isn't installed." };
  if (p.dev.wiped) return { ok: false, text: "The phone was erased." };
  if (a.broken === "cache") { note(p, "open", { app: id, ok: false }); return { ok: false, text: a.name + " keeps stopping. (It opens, shows its logo, and closes.)" }; }
  if (a.needsNet && !internet(p).ok) { note(p, "open", { app: id, ok: false }); return { ok: false, text: a.name + ": This site can't be reached. " + internet(p).text }; }
  if (!a.signedIn) { note(p, "open", { app: id, ok: true }); return { ok: true, text: a.name + " opens at its sign-in screen: everything on the phone was cleared." }; }
  note(p, "open", { app: id, ok: true });
  return { ok: true, text: a.name + " " + a.ver + " opens and works" + (a.drafts ? ", with " + a.drafts + " orders saved offline, waiting to sync" : "") + "." };
}
export function forceStop(p, id) { const a = app(p, id); if (!a) return { ok: false }; note(p, "force-stop", { app: id }); return { ok: true, text: a.name + " was stopped. It starts again the next time it's opened" + (a.drain ? ", or when it next refreshes in the background" : "") + "." }; }
export function clearCache(p, id) {
  const a = app(p, id); if (!a) return { ok: false };
  const gb = a.cacheGB; a.cacheGB = 0; if (a.broken === "cache") a.broken = null;
  note(p, "clear-cache", { app: id, gb: gb }); return { ok: true, text: "Cleared " + fmt(gb) + " of temporary files for " + a.name + ". Its data and sign-in are kept." };
}
export function clearStorage(p, id) {
  const a = app(p, id); if (!a) return { ok: false };
  const lost = a.drafts; a.cacheGB = 0; a.dataGB = 0.05; a.drafts = 0; a.signedIn = false; if (a.broken === "cache") a.broken = null;
  note(p, "clear-storage", { app: id, lost: lost }); return { ok: true, lost: lost, text: "All of " + a.name + "'s data was deleted: its files, settings, accounts and anything not yet synced" + (lost ? " (" + lost + " offline orders)" : "") + "." };
}
export function setApp(p, id, key, value) { const a = app(p, id); if (!a) return { ok: false }; a[key] = value; note(p, "app-set", { app: id, key: key, value: value }); return { ok: true }; }
export function updateApp(p, id) {
  const a = app(p, id); if (!a || !a.latest) return { ok: false, text: "No update available." };
  if (!internet(p).ok) return { ok: false, text: "Can't download: " + internet(p).text };
  a.ver = a.latest; a.latest = null; if (a.broken === "version") a.broken = null;
  note(p, "update-app", { app: id }); return { ok: true, text: a.name + " was updated to " + a.ver + "." };
}
export function uninstall(p, id) {
  const a = app(p, id); if (!a) return { ok: false }; if (a.system) return { ok: false, text: a.name + " is part of the system and can't be uninstalled." };
  a.installed = false; const lost = a.drafts; a.drafts = 0;
  p.dev.storage.items = p.dev.storage.items.filter(function (x) { return x.app !== id; });
  note(p, "uninstall", { app: id, lost: lost }); return { ok: true, lost: lost, text: a.name + " was uninstalled" + (lost ? ", with " + lost + " orders that hadn't synced" : "") + "." };
}

/* --------------------------------------------------------- storage */
export function used(p) { ready(p); return SYSTEM_GB + apps(p).reduce(function (s, a) { return s + a.cacheGB + a.dataGB; }, 0) + p.dev.storage.items.reduce(function (s, x) { return s + x.gb; }, 0); }
export function free(p) { return Math.round((p.dev.storage.totalGB - used(p)) * 10) / 10; }
export function fmt(gb) { return gb >= 1 ? (Math.round(gb * 10) / 10) + " GB" : Math.round(gb * 1024) + " MB"; }
export function deleteItem(p, id) {
  const it = ready(p).dev.storage.items.filter(function (x) { return x.id === id; })[0]; if (!it) return { ok: false };
  p.dev.storage.items = p.dev.storage.items.filter(function (x) { return x.id !== id; });
  note(p, "delete", { item: id, backedUp: it.backedUp, gb: it.gb });
  return { ok: true, backedUp: it.backedUp, text: "Deleted " + it.label + " (" + fmt(it.gb) + ")" + (it.backedUp ? ". The copies in the cloud are kept." : ". There was no other copy.") };
}

/* --------------------------------------------------------- updates */
export function installUpdate(p) {
  const u = ready(p).dev.update; if (!u || u.installed) return { ok: false, text: "Your system is up to date." };
  if (free(p) < u.gb) { note(p, "update-failed", { free: free(p) }); return { ok: false, text: "Couldn't install the update: it needs " + fmt(u.gb) + " of free space, and " + fmt(free(p)) + " is available. Free up space and try again." }; }
  u.installed = true; p.dev.patch = u.patch; note(p, "update-os");
  return { ok: true, text: "Update installed. The phone restarted and is on the " + u.patch + " security update." };
}
export function restart(p) { note(p, "restart"); return { ok: true, text: "The phone restarted." }; }
/* erase all data: everything goes, unless it was backed up elsewhere */
export function factoryReset(p) { ready(p).dev.wiped = true; Object.keys(p.dev.apps).forEach(function (k) { const a = p.dev.apps[k]; if (!a.system) a.installed = false; a.drafts = 0; }); p.dev.storage.items = []; note(p, "factory-reset"); return { ok: true, text: "All data was erased. The phone restarted at its welcome screen, as it came out of the box." }; }

/* -------------------------------------------------------- security */
export function setUnknown(p, src, on) { ready(p).dev.unknown[src] = !!on; note(p, "unknown", { src: src, on: !!on }); return { ok: true }; }
export function scan(p) {
  const f = apps(p).filter(function (a) { return a.adware; }).map(function (a) { return a.name; });
  ready(p).dev.protect = { last: p.events.length, found: f }; note(p, "scan", { found: f.length });
  return { ok: true, found: f, text: f.length ? "Harmful app found: " + f.join(", ") + ". It shows ads outside the app and pretends to be a security warning. Uninstall it." : "No harmful apps found. Play Protect checked " + apps(p).length + " apps." };
}
export function adware(p) { return apps(p).some(function (a) { return a.adware; }); }
export function dataUsed(p) { return Math.round((3.4 + (adware(p) ? 6 : 0)) * 10) / 10; }

/* ------------------------------------------------------------ mail */
/* does new mail arrive by itself, or only when the app is opened? */
export function mailPush(p) {
  const a = apps(p).filter(function (x) { return x.mail; })[0]; if (!a) return { ok: false, text: "No mail app." };
  if (a.battery === "Restricted") return { ok: false, text: "New mail waits until " + a.name + " is opened: its battery use is Restricted, so it can't run in the background." };
  if (!a.bgData || p.dev.net.dataSaver) return { ok: false, text: "New mail waits until " + a.name + " is opened: it isn't allowed to use data in the background." };
  return { ok: true, text: "New mail arrives as it's sent: " + a.name + " is allowed to run and use data in the background." };
}
export function testMail(p) { const r = mailPush(p); note(p, "test-mail", { ok: r.ok }); return r; }

/* what's on the lock screen right now */
export function notices(p) {
  const out = [], i = internet(p), b = battery(p); ready(p);
  if (p.dev.wiped) return ["Welcome! Let's set up your phone."];
  if (!i.ok && i.how !== "none") out.push(i.text);
  if (b.hot) out.push("Phone is warm: some features are limited until it cools down.");
  if (b.hours < 10) out.push("Battery: about " + b.hours + " hours left at this rate.");
  if (p.dev.update && !p.dev.update.installed && p.dev.update.failed !== false) out.push("System update ready: " + p.dev.update.patch + " (" + fmt(p.dev.update.gb) + ").");
  if (adware(p)) { out.push("⚠ YOUR PHONE IS INFECTED (3 viruses)! Tap to clean now with CleanMaster Pro."); out.push("Data warning: " + dataUsed(p) + " GB of your " + p.dev.net.dataLimitGB + " GB plan used."); }
  const m = apps(p).filter(function (x) { return x.mail; })[0]; if (m && !mailPush(p).ok) out.push(m.name + ": open the app to check for new mail.");
  return out;
}
export { copy };
