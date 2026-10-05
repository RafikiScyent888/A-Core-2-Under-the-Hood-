/* =====================================================================
   Remote help on a company phone: the mobile troubleshooting tickets.

   With the owner's OK (they accept the remote help request), the
   technician sees and uses the phone's screen from the Mobile devices
   program. The screen is real HTML, so it can be read, zoomed and
   measured for contrast; the approved 3D phone beside it shows the same
   page on its own glass. Every change goes through ctx.act, so the
   ticket judges it; every page looked at is recorded as a view, which
   never counts against the student.
   ===================================================================== */
import * as PH from "./phone.js";

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(label, cls, fn, aria) { const b = el("button", cls || "b", label); b.type = "button"; if (aria) b.setAttribute("aria-label", aria); b.addEventListener("click", fn); return b; }

const PAGES = { home: "Home screen", settings: "Settings", network: "Network & internet", battery: "Battery", storage: "Storage", apps: "Apps", security: "Security & privacy", system: "System" };

export function drawHandset(host, ctx, ui) {
  const t = ctx.ticket(), p = ctx.phone();
  host.innerHTML = "";
  const wrap = el("div", "mdm"); host.appendChild(wrap);
  wrap.appendChild(el("h2", null, "Mobile devices · Rafiki's IT Services"));
  if (!p) { wrap.appendChild(el("p", "cc-note", "No phone to look at for this ticket.")); ctx.dispose(); return; }
  PH.ready(p); ui.page = ui.page || "home";
  const first = p.owner.split(" ")[0];
  const head = el("p", "ph-help"); head.appendChild(el("strong", null, "Remote help: " + first + "'s phone. ")); head.appendChild(document.createTextNode(first + " accepted your request, so you can see and use the phone's screen. " + p.model + " · " + p.dev.version + " · security update " + p.dev.patch + "."));
  wrap.appendChild(head);
  const grid = el("div", "mdm-grid");
  const stage = ui.stage || (ui.stage = el("div", "mdm-3d")); grid.appendChild(stage);
  const right = el("div", "ph-side");
  right.appendChild(drawScreen(p, ui, ctx, first));
  /* the help desk's own tool, outside the phone */
  const tools = el("section", "ph-tools"); tools.appendChild(el("h3", null, "Help desk tools"));
  tools.appendChild(btn("Send a test email to this phone", "b small", function () { const b = ctx.before(); const r = PH.testMail(p); ui.toolMsg = r; ctx.act({ type: "phone", op: "test-mail", res: r, before: b }); }, "Send a test email to " + first + "'s phone"));
  if (ui.toolMsg) { const m = el("p", "mdm-res " + (ui.toolMsg.ok ? "ok" : "bad")); m.setAttribute("role", "status"); m.appendChild(el("strong", null, (ui.toolMsg.ok ? "✓ " : "✕ ") + "Test email: ")); m.appendChild(document.createTextNode(ui.toolMsg.text)); tools.appendChild(m); }
  right.appendChild(tools);
  grid.appendChild(right); wrap.appendChild(grid);
  mount(stage, ui, p, ctx);
}

/* --------------------------------------------- the phone's own screen */
function drawScreen(p, ui, ctx, first) {
  const box = el("section", "ph-screen"); box.setAttribute("aria-label", first + "'s phone screen");
  const go = function (page) { ui.page = page; ui.msg = null; ui.confirm = null; PH.note(p, "view", { page: page }); ctx.act({ type: "phone", op: "view", page: page, before: ctx.before() }); };
  const doIt = function (op, fn, extra) { const b = ctx.before(); const r = fn(); ui.msg = r && r.text ? { text: r.text, bad: r.ok === false } : null; ui.confirm = null; ctx.act(Object.assign({ type: "phone", op: op, res: r, before: b }, extra || {})); };
  const ask = function (text, yes, fn) { ui.confirm = { text: text, yes: yes, fn: fn }; ctx.redraw(); };
  /* the status bar, always */
  const net = PH.internet(p), bat = PH.battery(p);
  const sb = el("div", "ph-status"); sb.appendChild(el("span", null, "11:20")); sb.appendChild(el("span", null, (net.how === "none" ? (p.dev.net.airplane ? "Airplane mode" : "No connection") : net.how) + " · Battery " + p.dev.battery.level + "%")); box.appendChild(sb);
  const nav = el("div", "ph-nav");
  if (ui.page !== "home") nav.appendChild(btn("◀ Back", "ph-back", function () { go(ui.page.indexOf("app:") === 0 ? "apps" : ui.page === "settings" ? "home" : "settings"); }, "Back"));
  nav.appendChild(el("h3", "ph-title", ui.page.indexOf("app:") === 0 ? "App info" : PAGES[ui.page]));
  if (ui.page !== "home") nav.appendChild(btn("Home", "ph-back", function () { go("home"); }, "Home screen"));
  box.appendChild(nav);
  const body = el("div", "ph-body"); box.appendChild(body);
  const row = function (label, value, cls) { const r = el("div", "ph-row" + (cls ? " " + cls : "")); r.appendChild(el("span", "ph-k", label)); if (value != null) r.appendChild(el("span", "ph-v", value)); body.appendChild(r); return r; };
  const link = function (label, page, sub) { const b = btn("", "ph-link", function () { go(page); }, label + (sub ? ", " + sub : "")); b.appendChild(el("span", "ph-k", label)); if (sub) b.appendChild(el("span", "ph-v", sub)); body.appendChild(b); return b; };
  const sw = function (label, on, fn, aria) { const r = row(label, null); const b = btn(on ? "On" : "Off", "ph-switch" + (on ? " on" : ""), fn, (aria || label) + ": " + (on ? "on" : "off") + ". Turn " + (on ? "off" : "on")); b.setAttribute("aria-pressed", String(on)); r.appendChild(b); return b; };
  const pick = function (label, id, opts, val, fn) { const r = el("div", "ph-row"); const l = el("label", "ph-k", label); const s = el("select", "w-input ph-sel"); s.id = id; l.setAttribute("for", id); opts.forEach(function (o) { const op = el("option", null, o); op.value = o; if (o === val) op.selected = true; s.appendChild(op); }); s.addEventListener("change", function () { fn(s.value); }); r.appendChild(l); r.appendChild(s); body.appendChild(r); };
  const pg = ui.page;
  if (p.dev.wiped && pg !== "home") { row("The phone was erased.", "Revert to your last snapshot."); }
  else if (pg === "home") {
    const nt = PH.notices(p);
    body.appendChild(el("h4", "ph-h", "Notifications"));
    if (!nt.length) row("No notifications", null);
    nt.forEach(function (n) { const r = row(n, null, /INFECTED|Data warning/.test(n) ? "ph-alert" : "ph-note"); r.setAttribute("role", "note"); if (/CleanMaster/.test(n)) r.appendChild(btn("Clean now", "b small", function () { doIt("install-cleaner", function () { PH.note(p, "install-cleaner"); return { ok: false, text: "The \"cleaner\" asks to install CleanMaster Pro from a website, with permission to read everything on the screen. That's the same scam as the ads." }; }); }, "Tap the infected warning: clean now")); });
    body.appendChild(el("h4", "ph-h", "Apps"));
    PH.apps(p).filter(function (a) { return !a.hidden; }).forEach(function (a) { const b = btn("Open " + a.name, "ph-link", function () { doIt("open", function () { return PH.openApp(p, a.id); }, { app: a.id }); }, "Open " + a.name + " on the phone"); body.appendChild(b); });
    link("Settings", "settings");
  } else if (pg === "settings") {
    link("Network & internet", "network", net.ok ? net.how : "Problem: " + net.text.split(".")[0]);
    link("Battery", "battery", "About " + bat.hours + " hours left");
    link("Storage", "storage", PH.fmt(PH.free(p)) + " free of " + p.dev.storage.totalGB + " GB");
    link("Apps", "apps", PH.apps(p).length + " apps");
    link("Security & privacy", "security", "Play Protect, unknown apps");
    link("System", "system", "Updates, restart, reset options");
  } else if (pg === "network") {
    const n = p.dev.net;
    row("Internet", net.text, net.ok ? "ph-good" : "ph-bad");
    sw("Airplane mode", n.airplane, function () { doIt("airplane", function () { return PH.setNet(p, "airplane", !n.airplane); }, { on: !n.airplane }); });
    row("Wi-Fi", n.wifi && n.ssid ? "Connected to " + n.ssid : "Not connected");
    n.saved.forEach(function (s) { const r = row("Saved network: " + s, null); r.appendChild(btn("Forget", "b small", function () { ask("Forget " + s + "? To join it again, " + first + " will need its password.", "Forget", function () { doIt("forget", function () { return PH.forgetNetwork(p, s); }, { ssid: s }); }); }, "Forget the saved network " + s)); });
    sw("Mobile data", n.data, function () { doIt("data", function () { return PH.setNet(p, "data", !n.data); }, { on: !n.data }); });
    sw("Data Saver", n.dataSaver, function () { doIt("data-saver", function () { return PH.setNet(p, "dataSaver", !n.dataSaver); }, { on: !n.dataSaver }); });
    body.appendChild(el("h4", "ph-h", "Private DNS"));
    const cur = n.privateDns;
    ["Off", "Automatic"].forEach(function (o) { const b = btn(o + (cur === o ? " (selected)" : ""), "ph-opt" + (cur === o ? " on" : ""), function () { doIt("private-dns", function () { return PH.setNet(p, "privateDns", o); }, { value: o }); }, "Private DNS: " + o); b.setAttribute("aria-pressed", String(cur === o)); body.appendChild(b); });
    const hr = el("div", "ph-row"); const hl = el("label", "ph-k", "Private DNS provider hostname"); const hi = el("input", "w-input"); hi.id = "ph-dns"; hl.setAttribute("for", "ph-dns"); hi.value = cur === "Off" || cur === "Automatic" ? "" : cur; hi.setAttribute("spellcheck", "false"); hr.appendChild(hl); hr.appendChild(hi);
    hr.appendChild(btn("Save hostname", "b small", function () { const v = hi.value.trim(); if (!v) return; doIt("private-dns", function () { return PH.setNet(p, "privateDns", v); }, { value: v }); }, "Save the Private DNS hostname")); body.appendChild(hr);
  } else if (pg === "battery") {
    row("Battery", p.dev.battery.level + "% · about " + bat.hours + " hours left at this rate", bat.hours < 10 ? "ph-bad" : "ph-good");
    if (bat.hot) row("Temperature", "Phone is warm", "ph-bad");
    sw("Battery Saver", p.dev.battery.saver, function () { doIt("saver", function () { p.dev.battery.saver = !p.dev.battery.saver; PH.note(p, "saver", { on: p.dev.battery.saver }); return { ok: true }; }, { on: !p.dev.battery.saver }); });
    body.appendChild(el("h4", "ph-h", "Battery use since last full charge"));
    bat.list.forEach(function (x) { const b = btn("", "ph-link", function () { go("app:" + x.id); }, x.name + ": " + x.pct + "% of battery, background use " + x.battery + ". Open app info"); b.appendChild(el("span", "ph-k", x.name)); b.appendChild(el("span", "ph-v", x.pct + "% · " + x.battery)); body.appendChild(b); });
    row("Screen and system", "6%");
  } else if (pg === "storage") {
    row("Used", PH.fmt(PH.used(p)) + " of " + p.dev.storage.totalGB + " GB"); row("Free", PH.fmt(PH.free(p)), PH.free(p) < 2 ? "ph-bad" : null);
    if (p.dev.update && !p.dev.update.installed) row("System update waiting", "needs " + PH.fmt(p.dev.update.gb) + " free");
    body.appendChild(el("h4", "ph-h", "Files"));
    p.dev.storage.items.forEach(function (it) { const r = row(it.label, PH.fmt(it.gb) + (it.backedUp ? " · backed up to OneDrive" : " · on this phone only")); r.appendChild(btn("Delete", "b small", function () { ask("Delete " + it.label + " (" + PH.fmt(it.gb) + ") from the phone? " + (it.backedUp ? "The copies in OneDrive are kept." : "There's no other copy."), "Delete", function () { doIt("delete", function () { return PH.deleteItem(p, it.id); }, { item: it.id }); }); }, "Delete " + it.label)); });
    body.appendChild(el("h4", "ph-h", "Apps, by size"));
    PH.apps(p).slice().sort(function (a, b) { return (b.cacheGB + b.dataGB) - (a.cacheGB + a.dataGB); }).forEach(function (a) { const b = btn("", "ph-link", function () { go("app:" + a.id); }, a.name + ": " + PH.fmt(a.cacheGB + a.dataGB) + ". Open app info"); b.appendChild(el("span", "ph-k", a.name)); b.appendChild(el("span", "ph-v", PH.fmt(a.cacheGB + a.dataGB) + " (cache " + PH.fmt(a.cacheGB) + ")")); body.appendChild(b); });
  } else if (pg === "apps") {
    PH.apps(p).forEach(function (a) { const b = btn("", "ph-link", function () { go("app:" + a.id); }, a.name + ": app info"); b.appendChild(el("span", "ph-k", a.name)); b.appendChild(el("span", "ph-v", "version " + a.ver)); body.appendChild(b); });
  } else if (pg.indexOf("app:") === 0) {
    const id = pg.slice(4), a = PH.app(p, id);
    if (!a) row("That app isn't installed any more.", null);
    else {
      body.appendChild(el("h4", "ph-h", a.name + " " + a.ver));
      row("Installed from", a.source, /unknown/i.test(a.source) ? "ph-bad" : null);
      const acts = el("div", "ph-acts");
      acts.appendChild(btn("Open", "b small", function () { doIt("open", function () { return PH.openApp(p, id); }, { app: id }); }, "Open " + a.name));
      acts.appendChild(btn("Force stop", "b small", function () { doIt("force-stop", function () { return PH.forceStop(p, id); }, { app: id }); }, "Force stop " + a.name));
      if (!a.system) acts.appendChild(btn("Uninstall", "b small", function () { ask("Uninstall " + a.name + "? Its data on this phone is deleted" + (a.drafts ? ", including " + a.drafts + " orders that haven't synced" : "") + ".", "Uninstall", function () { doIt("uninstall", function () { return PH.uninstall(p, id); }, { app: id }); }); }, "Uninstall " + a.name));
      if (a.latest) acts.appendChild(btn("Update to " + a.latest, "b small", function () { doIt("update-app", function () { return PH.updateApp(p, id); }, { app: id }); }, "Update " + a.name + " to " + a.latest));
      body.appendChild(acts);
      body.appendChild(el("h4", "ph-h", "Storage & cache"));
      row("Cache (temporary files)", PH.fmt(a.cacheGB)); row("App data", PH.fmt(a.dataGB) + (a.drafts ? " · " + a.drafts + " orders saved offline, not yet synced" : ""));
      const sa = el("div", "ph-acts");
      sa.appendChild(btn("Clear cache", "b small", function () { doIt("clear-cache", function () { return PH.clearCache(p, id); }, { app: id }); }, "Clear cache for " + a.name));
      sa.appendChild(btn("Clear storage", "b small", function () { ask("Clear " + a.name + "'s storage? All its data is deleted permanently: files, settings, accounts" + (a.drafts ? ", and " + a.drafts + " orders that haven't synced" : "") + ".", "Delete", function () { doIt("clear-storage", function () { return PH.clearStorage(p, id); }, { app: id }); }); }, "Clear storage for " + a.name));
      body.appendChild(sa);
      body.appendChild(el("h4", "ph-h", "Battery"));
      pick("Background battery use", "ph-bat", PH.BATTERY, a.battery, function (v) { doIt("app-set", function () { return PH.setApp(p, id, "battery", v); }, { app: id, key: "battery", value: v }); });
      body.appendChild(el("h4", "ph-h", "Mobile data & Wi-Fi"));
      sw("Background data", a.bgData, function () { doIt("app-set", function () { return PH.setApp(p, id, "bgData", !a.bgData); }, { app: id, key: "bgData", value: !a.bgData }); }, "Background data for " + a.name);
      if (a.location) { body.appendChild(el("h4", "ph-h", "Permissions")); pick("Location", "ph-loc", PH.LOCATION, a.location, function (v) { doIt("app-set", function () { return PH.setApp(p, id, "location", v); }, { app: id, key: "location", value: v }); }); }
    }
  } else if (pg === "security") {
    body.appendChild(el("h4", "ph-h", "Google Play Protect"));
    row("Last scan", p.dev.protect.last == null ? "Not scanned recently" : (p.dev.protect.found.length ? "Found: " + p.dev.protect.found.join(", ") : "No harmful apps found"), p.dev.protect.found.length ? "ph-bad" : null);
    body.appendChild(btn("Scan", "b small", function () { doIt("scan", function () { return PH.scan(p); }); }, "Scan with Play Protect"));
    body.appendChild(el("h4", "ph-h", "Install unknown apps"));
    Object.keys(p.dev.unknown).forEach(function (src) { sw(src + ": allow from this source", p.dev.unknown[src], function () { doIt("unknown", function () { return PH.setUnknown(p, src, !p.dev.unknown[src]); }, { src: src, on: !p.dev.unknown[src] }); }, "Install unknown apps from " + src); });
  } else if (pg === "system") {
    body.appendChild(el("h4", "ph-h", "Software update"));
    const u = p.dev.update;
    row("Security update", p.dev.patch);
    if (u && !u.installed) { row("Update available", u.patch + " · " + PH.fmt(u.gb)); body.appendChild(btn("Download and install", "b small", function () { doIt("install-update", function () { return PH.installUpdate(p); }); }, "Download and install the system update")); }
    else row("Your system is up to date", null, "ph-good");
    body.appendChild(el("h4", "ph-h", "Power"));
    body.appendChild(btn("Restart", "b small", function () { doIt("restart", function () { return PH.restart(p); }); }, "Restart the phone"));
    body.appendChild(el("h4", "ph-h", "Reset options"));
    body.appendChild(btn("Reset network settings", "b small", function () { ask("Reset network settings? Every saved Wi-Fi network and Bluetooth pairing is forgotten.", "Reset settings", function () { doIt("reset-network", function () { return PH.resetNetwork(p); }); }); }, "Reset network settings"));
    body.appendChild(btn("Erase all data (factory reset)", "b small", function () { ask("Erase all data? Everything on the phone is deleted: apps, accounts, photos and files that aren't backed up.", "Erase all data", function () { doIt("factory-reset", function () { return PH.factoryReset(p); }); }); }, "Erase all data (factory reset)"));
  }
  if (ui.confirm) { const c = el("div", "ph-confirm"); c.setAttribute("role", "alertdialog"); c.setAttribute("aria-label", "Confirm"); c.appendChild(el("p", null, ui.confirm.text)); const r = el("div", "ph-acts"); r.appendChild(btn(ui.confirm.yes, "b small pri", ui.confirm.fn)); r.appendChild(btn("Cancel", "b small", function () { ui.confirm = null; ctx.redraw(); })); c.appendChild(r); box.appendChild(c); }
  if (ui.msg) { const m = el("p", "ph-msg" + (ui.msg.bad ? " bad" : "")); m.setAttribute("role", "status"); m.textContent = (ui.msg.bad ? "✕ " : "✓ ") + ui.msg.text; box.appendChild(m); }
  return box;
}

/* ------------------------------------- the same page on the 3D phone */
function lines(p, page) {
  const out = [], net = PH.internet(p), bat = PH.battery(p);
  if (p.dev.wiped) return ["Welcome!", "Let's set up your phone."];
  if (page === "home") { PH.notices(p).slice(0, 5).forEach(function (n) { out.push(n); }); PH.apps(p).filter(function (a) { return !a.hidden; }).slice(0, 6).forEach(function (a) { out.push("▢ " + a.name); }); }
  else if (page === "network") { out.push(net.text); out.push("Airplane mode: " + (p.dev.net.airplane ? "On" : "Off")); out.push("Private DNS: " + p.dev.net.privateDns); }
  else if (page === "battery") { out.push("About " + bat.hours + " hours left"); bat.list.slice(0, 6).forEach(function (x) { out.push(x.name + " " + x.pct + "%"); }); }
  else if (page === "storage") { out.push(PH.fmt(PH.free(p)) + " free"); p.dev.storage.items.slice(0, 5).forEach(function (it) { out.push(it.label + " " + PH.fmt(it.gb)); }); }
  else if (page.indexOf("app:") === 0) { const a = PH.app(p, page.slice(4)); if (a) { out.push(a.name + " " + a.ver); out.push("Battery: " + a.battery); if (a.location) out.push("Location: " + a.location); out.push("Cache " + PH.fmt(a.cacheGB)); } }
  else if (page === "system") { out.push("Security update " + p.dev.patch); if (p.dev.update && !p.dev.update.installed) out.push("Update available"); }
  else if (page === "security") { out.push("Play Protect"); Object.keys(p.dev.unknown).forEach(function (s) { out.push(s + ": " + (p.dev.unknown[s] ? "allowed" : "not allowed")); }); }
  else PH.apps(p).slice(0, 8).forEach(function (a) { out.push(a.name); });
  return out;
}
function paint(p, ui) { return function (c, w, h) {
  c.fillStyle = "#f4f5f7"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#111827"; c.font = "600 30px Arial"; c.textAlign = "left"; c.fillText("11:20", 40, 58);
  c.textAlign = "right"; c.fillText(p.dev.battery.level + "%", w - 40, 58); c.textAlign = "left";
  const page = ui.page || "home";
  c.font = "700 44px Arial"; c.fillText(page.indexOf("app:") === 0 ? "App info" : PAGES[page] || "", 40, 150);
  let y = 230; c.font = "500 28px Arial";
  lines(p, page).forEach(function (t) { c.fillStyle = "#ffffff"; c.fillRect(24, y - 40, w - 48, 74); c.fillStyle = /INFECTED|no internet|warm|hours left/.test(t) && /INFECTED|no internet|warm/.test(t) ? "#7f1d1d" : "#111827"; wrap(c, t, 44, y, w - 88, 32); y += 92; });
}; }
function wrap(c, text, x, y, mw, lh) { const words = String(text).split(" "); let line = "", n = 0; words.forEach(function (wd) { const t = line ? line + " " + wd : wd; if (c.measureText(t).width > mw && line && n < 1) { c.fillText(line, x, y); line = wd; y += lh; n++; } else line = t; }); if (line) c.fillText(c.measureText(line).width > mw ? line.slice(0, 34) + "…" : line, x, y); }
function mount(stage, ui, p, ctx) {
  if (ui.phone) { ui.draw = paint(p, ui); ui.phone.redraw(); return; }
  if (ui.mounting) return; ui.mounting = true; ui.draw = paint(p, ui);
  import("./phoneview.js").then(function (mod) {
    if (!mod.webglOK()) throw new Error("no webgl");
    ui.phone = mod.mountPhone(stage, { height: 420, draw: function (c, w, h) { ui.draw(c, w, h); } });
  }).catch(function () { stage.classList.add("off"); stage.appendChild(el("p", "cc-note", "3D isn't available on this computer: the phone's screen beside it is the same.")); });
}
