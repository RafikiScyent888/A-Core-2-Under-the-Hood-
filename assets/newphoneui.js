/* =====================================================================
   The new company phone's screen, as real HTML beside the approved 3D
   phone (readable, zoomable, measured for contrast): Android's first-run
   setup (welcome, QR set-up, Wi-Fi, sign-in, "This device belongs to your
   organization", screen lock), then the home screen and the Settings a
   technician checks a new phone in. Every change goes through ctx.act;
   moving between Settings pages is only looking, and stays on the screen.
   ===================================================================== */
import * as NP from "./newphone.js";

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(label, cls, fn, aria) { const b = el("button", cls || "b small", label); b.type = "button"; if (aria) b.setAttribute("aria-label", aria); b.addEventListener("click", fn); return b; }

const TITLES = { settings: "Settings", network: "Network & internet", security: "Security & privacy", accounts: "Passwords & accounts", system: "System", update: "Software update", about: "About phone" };

export function drawNewPhoneScreen(host, m, ctx) {
  host.innerHTML = "";
  const ui = ctx.ui; const s = m.screen;
  if (s !== "home") ui.page = null;
  const box = el("section", "ph-screen" + (s === "off" ? " off" : "")); box.setAttribute("aria-label", "The new phone's screen"); host.appendChild(box);
  const doIt = function (op, fn, extra) { const b = ctx.before(); const r = fn() || {}; ui.msg = r.text ? { text: r.text, bad: r.ok === false } : null; ui.confirm = null; ctx.act(Object.assign({ type: "newphone", op: op, res: r, before: b }, extra || {})); ctx.draw(); };
  const err = function () { if (m.error) { const e = el("p", "ph-msg bad", "✕ " + m.error); e.setAttribute("role", "alert"); box.appendChild(e); } };
  if (s === "off") { box.appendChild(el("p", "ph-dark", "The screen is dark: the phone is switched off" + (m.battery.charging ? ", charging." : "."))); if (ui.msg) { const q = el("p", "ph-dark", ui.msg.text); q.setAttribute("role", "status"); box.appendChild(q); } return; }
  /* the status bar, always */
  const sb = el("div", "ph-status"); sb.appendChild(el("span", null, "09:05"));
  sb.appendChild(el("span", null, (m.setup.wifi ? "Wi-Fi " + m.setup.wifi : "No Wi-Fi") + " · No SIM · Battery " + m.battery.level + "%" + (m.battery.charging ? ", charging" : ""))); box.appendChild(sb);
  const title = function (t, sub) { const n = el("div", "ph-nav"); n.appendChild(el("h3", "ph-title", t)); box.appendChild(n); if (sub) box.appendChild(el("p", "ph-p", sub)); };
  const body = el("div", "ph-body");
  const row = function (k, v, cls) { const r = el("div", "ph-row" + (cls ? " " + cls : "")); r.appendChild(el("span", "ph-k", k)); if (v != null) r.appendChild(el("span", "ph-v", v)); body.appendChild(r); return r; };
  const acts = function () { const a = el("div", "ph-acts"); body.appendChild(a); return a; };
  const field = function (label, id, type) { const l = el("label", "ph-k", label); const i = el("input", "w-input"); i.id = id; i.type = type || "text"; i.setAttribute("spellcheck", "false"); i.setAttribute("autocomplete", "off"); l.setAttribute("for", id); const r = el("div", "ph-field"); r.appendChild(l); r.appendChild(i); body.appendChild(r); return i; };

  if (s === "powermenu") {
    title("Power menu");
    const a = acts();
    a.appendChild(btn("Power off", "b small", function () { doIt("menu", function () { return NP.powerMenu(m, "off"); }, { pick: "off" }); }, "Power off the phone"));
    a.appendChild(btn("Restart", "b small", function () { doIt("menu", function () { return NP.powerMenu(m, "restart"); }, { pick: "restart" }); }, "Restart the phone"));
    a.appendChild(btn("Cancel", "b small", function () { doIt("menu", function () { return NP.powerMenu(m, "cancel"); }, { pick: "cancel" }); }, "Close the power menu"));
  } else if (s === "welcome") {
    title("Hi there", "Welcome to your " + m.model + ".");
    const lr = el("div", "ph-field"); const ll = el("label", "ph-k", "Language"); const sel = el("select", "w-input ph-sel"); sel.id = "np-lang-" + m.id; ll.setAttribute("for", sel.id);
    ["English (United Kingdom)", "English (United States)", "Español (Estados Unidos)", "Français (Canada)"].forEach(function (x, i) { const o = el("option", null, x); if (i === 1) o.selected = true; sel.appendChild(o); });
    lr.appendChild(ll); lr.appendChild(sel); body.appendChild(lr);
    /* the blank part of the screen: a real phone shows nothing here */
    const blank = btn("", "ph-blank", function () { doIt("tap", function () { return NP.tapWelcome(m); }); }, "Tap the blank part of the welcome screen");
    blank.appendChild(el("span", "ph-blank-txt", "(the blank part of the screen)"));
    body.appendChild(blank);
    const a = acts();
    a.appendChild(btn("Start", "b small pri", function () { doIt("start", function () { return NP.start(m); }); }, "Start"));
  } else if (s === "qr" || s === "dpc") {
    title(s === "qr" ? "Set up your work phone" : "Rafiki Device Policy", s === "qr" ? "Scan the QR code from your IT admin." : "The device policy app is installed. Scan the QR code from your IT admin to set up this phone.");
    const vf = el("div", "ph-viewfinder"); vf.appendChild(el("span", null, "Camera: point it at the code")); body.appendChild(vf);
    const a = acts();
    a.appendChild(btn("Scan the code", "b small pri", function () { doIt("scan", function () { return NP.scan(m); }); }, "Point the phone's camera at the QR code and scan it"));
    a.appendChild(btn("Cancel", "b small", function () { doIt("cancel", function () { return NP.cancel(m); }); }, "Cancel the set-up"));
  } else if (s === "wifi") {
    title("Connect to Wi-Fi", m.setup.flow === "work" ? "The phone needs Wi-Fi to download your organization's set-up." : null);
    ui.ssid = ui.ssid || null;
    const g = el("div", "ph-body"); g.setAttribute("role", "radiogroup"); g.setAttribute("aria-label", "Wi-Fi networks");
    NP.WIFI.forEach(function (w) { const on = ui.ssid === w.ssid; const b = btn((w.secured ? "🔒 " : "") + w.ssid + (w.secured ? " · secured" : " · open") + (on ? " (selected)" : ""), "ph-opt" + (on ? " on" : ""), function () { ui.ssid = w.ssid; m.error = null; ctx.draw(); }, w.ssid + (w.secured ? ", secured" : ", open")); b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(on)); g.appendChild(b); });
    body.appendChild(g);
    const sel = NP.WIFI.filter(function (w) { return w.ssid === ui.ssid; })[0];
    let pass = null; if (sel && sel.secured) pass = field("Password for " + sel.ssid, "np-wpass-" + m.id, "password");
    const a = acts();
    if (sel) a.appendChild(btn("Connect", "b small pri", function () { const v = pass ? pass.value : ""; doIt("wifi", function () { return NP.joinWifi(m, sel.ssid, v); }, { ssid: sel.ssid }); }, "Connect to " + sel.ssid));
    if (m.setup.flow === "personal") a.appendChild(btn("Set up offline", "b small", function () { doIt("offline", function () { return NP.offline(m); }); }, "Set up offline, without Wi-Fi"));
    a.appendChild(btn(m.setup.flow === "work" ? "Cancel" : "Back", "b small", function () { doIt("cancel", function () { return NP.cancel(m); }); }, m.setup.flow === "work" ? "Cancel the set-up" : "Back to the welcome screen"));
  } else if (s === "copy") {
    title("Copy apps & data", "Use the apps and data from your old phone, or set this one up from scratch.");
    const a = acts();
    a.appendChild(btn("Don't copy", "b small pri", function () { doIt("dont-copy", function () { return NP.dontCopy(m); }); }, "Don't copy apps and data"));
  } else if (s === "google") {
    title("Sign in", "with your Google Account.");
    const i = field("Email or phone", "np-email-" + m.id);
    const a = acts();
    a.appendChild(btn("Next", "b small pri", function () { const v = i.value; doIt("sign-in", function () { return NP.signIn(m, v); }, { email: v.trim().toLowerCase() === "afw#setup" ? "afw#setup" : "an address" }); }, "Next: sign in"));
    a.appendChild(btn("Skip", "b small", function () { ui.confirm = { text: "Skip account set-up? You can add a Google Account later in Settings.", yes: "Skip", fn: function () { doIt("skip-account", function () { return NP.skipAccount(m); }); } }; ctx.draw(); }, "Skip signing in"));
  } else if (s === "owned") {
    title("This device belongs to your organization");
    body.appendChild(el("p", "ph-p", "Rafiki's IT Services can see and manage this phone: its apps, its data, its settings and its network activity, including where it is if it's lost."));
    body.appendChild(el("p", "ph-p", "Rafiki Device Policy will set it up with your organization's policies."));
    const a = acts();
    a.appendChild(btn("Accept & continue", "b small pri", function () { doIt("accept", function () { return NP.accept(m); }); }, "Accept and continue"));
    a.appendChild(btn("Cancel", "b small", function () { ui.confirm = { text: "Stop setting up? The phone will be erased and start again from the welcome screen.", yes: "Stop", fn: function () { doIt("cancel", function () { return NP.cancel(m); }); } }; ctx.draw(); }, "Cancel the set-up"));
  } else if (s === "lock" || s === "lock-own") {
    const managed = s === "lock";
    title(managed ? "Set a screen lock" : "Protect your phone", managed ? "Your organization requires a screen lock." : "Set a screen lock to keep the phone safe.");
    const kinds = managed ? [["pin", "PIN"], ["password", "Password"], ["pattern", "Pattern"], ["skip", "Skip"]] : [["pin", "PIN"], ["password", "Password"], ["skip", "Skip"]];
    const g = el("div", "ph-acts"); g.setAttribute("role", "group"); g.setAttribute("aria-label", "Screen lock");
    kinds.forEach(function (k) { const on = ui.lk === k[0]; const b = btn(k[1] + (on ? " (selected)" : ""), "ph-opt" + (on ? " on" : ""), function () { if (k[0] === "pin" || k[0] === "password") { ui.lk = k[0]; m.error = null; ctx.draw(); } else doIt("lock", function () { return NP.setLock(m, k[0]); }, { kind: k[0] }); }, k[0] === "skip" ? "Skip the screen lock" : "Screen lock: " + k[1]); b.setAttribute("aria-pressed", String(on)); g.appendChild(b); });
    body.appendChild(g);
    if (ui.lk === "pin" || ui.lk === "password") {
      const nm = ui.lk === "pin" ? "PIN" : "password";
      const p1 = field("Choose a " + nm, "np-lock1-" + m.id, "password"); const p2 = field("Re-enter the " + nm, "np-lock2-" + m.id, "password");
      if (ui.lk === "pin") { p1.setAttribute("inputmode", "numeric"); p2.setAttribute("inputmode", "numeric"); }
      acts().appendChild(btn("Confirm", "b small pri", function () { const a1 = p1.value, a2 = p2.value; const k = ui.lk; doIt("lock", function () { return NP.setLock(m, k, a1, a2); }, { kind: k }); }, "Confirm the " + nm));
    }
  } else if (s === "locked") {
    title("Locked", "Enter the " + (m.lock && m.lock.kind === "password" ? "password" : "PIN") + " to unlock the phone.");
    const i = field(m.lock && m.lock.kind === "password" ? "Password" : "PIN", "np-unlock-" + m.id, "password");
    acts().appendChild(btn("Unlock", "b small pri", function () { const v = i.value; doIt("unlock", function () { return NP.unlock(m, v); }); }, "Unlock the phone"));
  } else if (s === "home") {
    drawHome(m, ui, ctx, box, body, row, acts, doIt);
  }
  box.appendChild(body);
  if (ui.confirm) { const c = el("div", "ph-confirm"); c.setAttribute("role", "alertdialog"); c.setAttribute("aria-label", "Confirm"); c.appendChild(el("p", null, ui.confirm.text)); const r = el("div", "ph-acts"); r.appendChild(btn(ui.confirm.yes, "b small pri", ui.confirm.fn)); r.appendChild(btn("Cancel", "b small", function () { ui.confirm = null; ctx.draw(); })); c.appendChild(r); box.appendChild(c); }
  err();
  if (ui.msg && !m.error) { const q = el("p", "ph-msg" + (ui.msg.bad ? " bad" : "")); q.setAttribute("role", "status"); q.textContent = (ui.msg.bad ? "✕ " : "✓ ") + ui.msg.text; box.appendChild(q); }
}

/* the home screen and Settings, once set-up is finished */
function drawHome(m, ui, ctx, box, body, row, acts, doIt) {
  const pg = ui.page || "home";
  const go = function (p) { ui.page = p; ui.msg = null; ui.confirm = null; m.error = null; ctx.draw(); };
  const nav = el("div", "ph-nav");
  if (pg !== "home") nav.appendChild(btn("◀ Back", "ph-back", function () { go(pg === "settings" ? "home" : pg === "update" ? "system" : "settings"); }, "Back"));
  nav.appendChild(el("h3", "ph-title", pg === "home" ? "Home screen" : TITLES[pg]));
  if (pg !== "home") nav.appendChild(btn("Home", "ph-back", function () { go("home"); }, "Home screen"));
  box.appendChild(nav);
  const link = function (label, page, sub) { const b = btn("", "ph-link", function () { go(page); }, label + (sub ? ", " + sub : "")); b.appendChild(el("span", "ph-k", label)); if (sub) b.appendChild(el("span", "ph-v", sub)); body.appendChild(b); return b; };
  const pending = m.os.patch !== m.update.patch;
  if (pg === "home") {
    body.appendChild(el("h4", "ph-h", "Notifications"));
    const n = [];
    if (m.enrol === "managed") n.push("This phone is managed by Rafiki's IT Services.");
    if (m.enrol === "profile") n.push("Work profile: Rafiki's IT Services manages your work apps.");
    if (pending) n.push("System update available: Android security update " + m.update.patch + " (" + m.update.gb + " GB).");
    if (!n.length) row("No notifications", null);
    n.forEach(function (x) { row(x, null, "ph-note").setAttribute("role", "note"); });
    body.appendChild(el("h4", "ph-h", "Apps"));
    const A = ["Phone", "Messages", "Chrome", "Camera"].concat(m.enrol === "managed" ? ["Outlook (installed by your organization)", "Teams (installed by your organization)"] : []);
    const g = el("ul", "ph-apps"); A.forEach(function (x) { g.appendChild(el("li", null, x)); }); body.appendChild(g);
    link("Settings", "settings");
  } else if (pg === "settings") {
    link("Network & internet", "network", m.setup.wifi ? "Wi-Fi: " + m.setup.wifi : "Not connected");
    link("Security & privacy", "security", "Screen lock: " + (m.lock ? (m.lock.kind === "pin" ? "PIN" : "Password") : "None"));
    link("Passwords & accounts", "accounts", m.enrol === "profile" ? "Work profile" : m.enrol === "managed" ? "Managed by Rafiki's IT Services" : "No accounts");
    link("System", "system", "Software update, reset options");
    link("About phone", "about", m.model);
  } else if (pg === "network") {
    row("Wi-Fi", m.setup.wifi ? "Connected to " + m.setup.wifi : "Not connected", m.setup.wifi ? "ph-good" : "ph-bad");
    row("Mobile network", "No SIM card");
  } else if (pg === "security") {
    row("Screen lock", m.lock ? (m.lock.kind === "pin" ? "PIN (" + m.lock.value.length + " digits)" : "Password") : "None", m.lock ? "ph-good" : "ph-bad");
    row("Device admin apps", m.enrol === "managed" ? "Rafiki Device Policy" : m.enrol === "profile" ? "Rafiki Device Policy (work profile only)" : "None");
    row("Security update", m.os.patch);
  } else if (pg === "accounts") {
    if (m.enrol === "managed") row("Work", "This phone is managed by Rafiki's IT Services.");
    else if (m.enrol === "profile") row("Work profile", "Rafiki's IT Services manages the work apps only.");
    else { row("No accounts", null); acts().appendChild(btn("Add a work account", "b small", function () { ui.confirm = { text: "Add your work account? Your organization's app will set up a work profile on this phone.", yes: "Add", fn: function () { doIt("work-profile", function () { return NP.addWorkProfile(m); }); } }; ctx.draw(); }, "Add a work account")); }
  } else if (pg === "system") {
    link("Software update", "update", pending ? "Update available" : "Up to date");
    body.appendChild(el("h4", "ph-h", "Reset options"));
    acts().appendChild(btn("Erase all data (factory reset)", "b small", function () { ui.confirm = { text: "Erase all data? Everything on the phone is deleted: apps, accounts, settings and the screen lock.", yes: "Erase all data", fn: function () { doIt("erase", function () { return NP.erase(m); }, { was: m.enrol }); } }; ctx.draw(); }, "Erase all data (factory reset)"));
  } else if (pg === "update") {
    row("Android version", m.os.version); row("Security update", m.os.patch, NP.patchOK(m) ? "ph-good" : null);
    if (pending) { row("Update available", "Android security update " + m.update.patch + " · " + m.update.gb + " GB"); acts().appendChild(btn("Download and install", "b small pri", function () { doIt("update", function () { return NP.installUpdate(m); }); }, "Download and install the system update")); }
    else row("Your system is up to date", null, "ph-good");
  } else if (pg === "about") {
    [["Model", m.model], ["Serial number", m.serial], ["IMEI", m.imei], ["Android version", m.os.version], ["Security update", m.os.patch]].forEach(function (kv) { row(kv[0], kv[1]); });
  }
}

/* --------------------------------------- the same screen on the 3D phone */
function lines(m, ui) {
  const s = m.screen;
  if (s === "welcome") return ["Hi there", "Welcome to your " + m.model, "English (United States)", "", "Start ›"];
  if (s === "qr" || s === "dpc") return [s === "qr" ? "Set up your work phone" : "Rafiki Device Policy", "Scan the QR code", "from your IT admin", "[ camera ]"];
  if (s === "wifi") return ["Connect to Wi-Fi"].concat(NP.WIFI.map(function (w) { return w.ssid; }));
  if (s === "copy") return ["Copy apps & data", "Don't copy"];
  if (s === "google") return ["Sign in", "Google Account", "Email or phone"];
  if (s === "owned") return ["This device belongs", "to your organization", "Rafiki's IT Services", "Accept & continue"];
  if (s === "lock" || s === "lock-own") return [s === "lock" ? "Set a screen lock" : "Protect your phone", "PIN", "Password"];
  if (s === "locked") return ["09:05", "Enter PIN"];
  if (s === "powermenu") return ["Power off", "Restart"];
  const pg = ui.page || "home";
  if (pg === "update") return ["Software update", "Security update", m.os.patch, m.os.patch !== m.update.patch ? "Update available" : "Up to date"];
  if (pg !== "home") return [TITLES[pg] || "Settings"];
  return ["Home"].concat(m.enrol === "managed" ? ["Managed by Rafiki"] : []).concat(m.os.patch !== m.update.patch ? ["System update available"] : []).concat(["Phone · Messages", "Chrome · Camera", "Settings"]);
}
export function paintNewPhone(m, ui) { return function (c, w, h) {
  if (m.screen === "off") { c.fillStyle = "#050607"; c.fillRect(0, 0, w, h); return; }
  c.fillStyle = "#f4f5f7"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#111827"; c.font = "600 30px Arial"; c.textAlign = "left"; c.fillText("09:05", 40, 58);
  c.textAlign = "right"; c.fillText(m.battery.level + "%" + (m.battery.charging ? " ⚡" : ""), w - 40, 58); c.textAlign = "left";
  let y = 170;
  lines(m, ui).forEach(function (t, i) { if (!t) { y += 40; return; } c.font = i === 0 ? "700 42px Arial" : "500 30px Arial"; c.fillStyle = "#111827"; c.fillText(t.length > 28 ? t.slice(0, 27) + "…" : t, 40, y); y += i === 0 ? 84 : 62; });
}; }
