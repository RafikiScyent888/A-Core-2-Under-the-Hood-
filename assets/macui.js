/* =====================================================================
   The Mac's screen, as real HTML beside the 3D Mac (readable, zoomable,
   measured for contrast): startup options, macOS Recovery, Disk Utility,
   Activation Lock, Reinstall macOS, Time Machine, the login window and
   Setup Assistant's Hello. Every choice goes through ctx.act.
   ===================================================================== */
import * as MAC from "./mac.js";

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(label, cls, fn, aria) { const b = el("button", cls || "w-btn", label); b.type = "button"; if (aria) b.setAttribute("aria-label", aria); b.addEventListener("click", fn); return b; }

export function drawMacScreen(host, m, ctx) {
  host.innerHTML = "";
  const scr = el("div", "macs" + (m.screen === "off" || m.screen === "nodisk" ? " off" : "")); scr.setAttribute("aria-label", "The Mac's screen"); host.appendChild(scr);
  const doIt = function (op, fn, extra) { const b = ctx.before(); const r = fn() || {}; ctx.act(Object.assign({ type: "mac", op: op, res: r, before: b }, extra || {})); ctx.draw(); };
  const err = function (box) { if (m.error) { const e = el("p", "ins-err", "✕ " + m.error); e.setAttribute("role", "alert"); box.appendChild(e); } };
  const win = function (title) { const w = el("section", "mac-win"); w.setAttribute("aria-label", title); w.appendChild(el("p", "mac-title", title)); scr.appendChild(w); return w; };
  const row = function (box) { const r = el("div", "ws-row"); box.appendChild(r); return r; };
  const s = m.screen;
  if (s === "off") { scr.appendChild(el("p", "mac-dark", "The screen is dark: the Mac is switched off.")); return; }
  if (s === "nodisk") { scr.appendChild(el("p", "mac-dark", "A folder with a question mark: there's no system on the startup disk.")); return; }
  if (s === "startup") {
    const w = win("Loading startup options");
    const r = el("div", "mac-icons");
    r.appendChild(btn("Macintosh HD", "mac-icon", function () { doIt("startup", function () { return MAC.startup(m, "disk"); }, { pick: "disk" }); }, "Start up from Macintosh HD"));
    r.appendChild(btn("Options", "mac-icon", function () { doIt("startup", function () { return MAC.startup(m, "options"); }, { pick: "options" }); }, "Options: open macOS Recovery"));
    w.appendChild(r); return;
  }
  if (s === "recovery-user") {
    const w = win("macOS Recovery");
    w.appendChild(el("p", null, "Select a user you know the password for:"));
    const ui = ctx.ui; ui.ru = ui.ru || null;
    const g = el("div", "ws-radios"); g.setAttribute("role", "radiogroup"); g.setAttribute("aria-label", "User");
    m.users.forEach(function (u) { const on = ui.ru === u.name; const b = btn(u.full + " (" + u.name + ")" + (on ? " (selected)" : ""), "ws-radio" + (on ? " on" : ""), function () { ui.ru = u.name; ctx.draw(); }, u.full + " (" + u.name + ")"); b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(on)); g.appendChild(b); });
    w.appendChild(g);
    const l = el("label", null, "Password"); const p = el("input", "w-input"); p.type = "password"; p.id = "mac-rpass-" + m.id; l.setAttribute("for", p.id); w.appendChild(l); w.appendChild(p);
    err(w);
    row(w).appendChild(btn("Next", "w-btn primary", function () { const v = p.value; doIt("recovery-user", function () { return MAC.recoveryUser(m, ui.ru, v); }, { user: ui.ru }); }, "Next: unlock Recovery"));
    return;
  }
  if (s === "recovery") {
    const w = win("macOS Recovery");
    const list = el("div", "mac-list");
    [["tm", "Restore from Time Machine"], ["reinstall", "Reinstall macOS Sequoia"], ["safari", "Safari"], ["du", "Disk Utility"]].forEach(function (x) { list.appendChild(btn(x[1], "mac-item", function () { doIt("utility", function () { return MAC.utility(m, x[0]); }, { which: x[0] }); }, x[1])); });
    w.appendChild(list); err(w); return;
  }
  if (s === "du") {
    const w = win("Disk Utility");
    const d = m.disk;
    const side = el("div", "mac-du");
    const vol = btn((d.name || "Macintosh HD") + " · " + d.fmt + (d.hasData ? " · " + m.leaver + "'s account and files" : d.hasOS ? " · macOS" : " · empty"), "mac-item" + (m.du && m.du.sel ? " on" : ""), function () { m.du.sel = true; ctx.draw(); }, "Select the Macintosh HD volume group");
    side.appendChild(el("p", "mac-sub", "Internal")); side.appendChild(vol); w.appendChild(side);
    if (m.du && m.du.sheet) {
      const sh = el("div", "mac-sheet"); sh.setAttribute("role", "dialog"); sh.setAttribute("aria-label", "Erase Macintosh HD");
      sh.appendChild(el("p", "mac-title", "Erase \"" + (d.name || "Macintosh HD") + "\" volume group?"));
      sh.appendChild(el("p", null, "Erasing will permanently erase all data stored on it. Enter a name, choose a format."));
      const ln = el("label", null, "Name"); const n = el("input", "w-input"); n.id = "mac-name-" + m.id; n.value = "Macintosh HD"; ln.setAttribute("for", n.id);
      const lf = el("label", null, "Format"); const f = el("select", "fw-sel"); f.id = "mac-fmt-" + m.id; lf.setAttribute("for", f.id);
      const pick = el("option", null, "Choose a format…"); pick.value = ""; f.appendChild(pick);
      MAC.FORMATS.forEach(function (x) { const o = el("option", null, x); o.value = x; if (m.du.fmt === x) o.selected = true; f.appendChild(o); });
      f.addEventListener("change", function () { m.du.fmt = f.value; });
      [ln, n, lf, f].forEach(function (x) { sh.appendChild(x); });
      const r = row(sh);
      r.appendChild(btn("Cancel", "w-btn", function () { m.du.sheet = false; ctx.draw(); }));
      r.appendChild(btn("Erase Volume Group", "w-btn primary", function () { if (!m.du.fmt) return; const fmt = m.du.fmt, nm = n.value; doIt("erase", function () { return MAC.erase(m, fmt, nm); }, { fmt: fmt }); }, "Erase the volume group"));
      w.appendChild(sh); return;
    }
    const r = row(w);
    r.appendChild(btn("Quit Disk Utility", "w-btn", function () { doIt("back", function () { return MAC.back(m); }); }));
    const e = btn("Erase…", "w-btn primary", function () { m.du.sheet = true; ctx.draw(); }, "Erase the selected volume group"); e.disabled = !(m.du && m.du.sel); r.appendChild(e);
    return;
  }
  if (s === "activate") {
    const w = win("Activate Mac");
    w.appendChild(el("p", null, "This Mac needs to be activated with Apple over the internet before it can be used. It's connected to the bench's wired network."));
    err(w);
    if (m.error && /Activation Lock|locked to/.test(m.error)) {
      const la = el("label", null, "Apple Account"); const a = el("input", "w-input"); a.id = "mac-aa-" + m.id; la.setAttribute("for", a.id); a.setAttribute("autocomplete", "off");
      const lp = el("label", null, "Password"); const p = el("input", "w-input"); p.type = "password"; p.id = "mac-ap-" + m.id; lp.setAttribute("for", p.id);
      [la, a, lp, p].forEach(function (x) { w.appendChild(x); });
      const r = row(w);
      r.appendChild(btn("Try again", "w-btn", function () { doIt("activate", function () { return MAC.activate(m); }); }, "Try activating again"));
      r.appendChild(btn("Next", "w-btn primary", function () { const v = a.value; doIt("activate", function () { return MAC.activate(m, v, p.value); }, { account: v }); }, "Activate with this Apple Account"));
      return;
    }
    row(w).appendChild(btn("Activate", "w-btn primary", function () { doIt("activate", function () { return MAC.activate(m); }); }, "Activate this Mac"));
    return;
  }
  if (s === "tm") {
    const w = win("Restore from Time Machine");
    w.appendChild(el("p", null, "Select a backup to restore from:"));
    w.appendChild(el("p", "mac-sub", "Rafiki Backups · " + m.leaver + "'s Mac · 2 October 2026, 17:40"));
    const r = row(w);
    r.appendChild(btn("Back", "w-btn", function () { doIt("back", function () { return MAC.back(m); }); }));
    r.appendChild(btn("Restore", "w-btn primary", function () { doIt("tm-restore", function () { return MAC.tmRestore(m); }); }, "Restore this backup"));
    return;
  }
  if (s === "safari") {
    const w = win("Safari");
    w.appendChild(el("p", null, "support.apple.com: macOS Recovery, Erase your Mac, Activation Lock, Reinstall macOS."));
    row(w).appendChild(btn("Quit Safari", "w-btn", function () { doIt("back", function () { return MAC.back(m); }); }));
    return;
  }
  if (s === "ri") {
    const R = m.ri || {}; const w = win("macOS Sequoia");
    const r = row(w);
    if (R.step === "intro") { w.insertBefore(el("p", null, "To set up the installation of macOS Sequoia, click Continue."), r); r.appendChild(btn("Continue", "w-btn primary", function () { doIt("ri-continue", function () { return MAC.reinstall(m, "continue"); }); }, "Continue setting up the installation")); }
    else if (R.step === "terms") { w.insertBefore(el("p", null, "To continue installing the software, you must agree to the terms of the software licence agreement."), r); r.appendChild(btn("Agree", "w-btn primary", function () { doIt("ri-agree", function () { return MAC.reinstall(m, "agree"); }); }, "Agree to the licence")); }
    else if (R.step === "disk") { w.insertBefore(el("p", null, "Select the disk where you want to install macOS Sequoia."), r); w.insertBefore(el("p", "mac-sub", (m.disk.name || "Macintosh HD") + " · " + m.disk.fmt + (m.disk.hasData ? " · " + m.leaver + "'s account and files are on it" : "")), r); err(w); w.appendChild(r); r.appendChild(btn("Continue", "w-btn primary", function () { doIt("ri-disk", function () { return MAC.reinstall(m, "disk"); }); }, "Install on Macintosh HD")); }
    else if (R.step === "ready") { w.insertBefore(el("p", null, "macOS Sequoia will be installed on \"" + (m.disk.name || "Macintosh HD") + "\"."), r); r.appendChild(btn("Install", "w-btn primary", function () { doIt("ri-install", function () { return MAC.reinstall(m, "install"); }); }, "Install macOS Sequoia")); }
    r.insertBefore(btn("Back to Recovery", "w-btn", function () { doIt("back", function () { return MAC.back(m); }); }), r.firstChild);
    return;
  }
  if (s === "login") {
    const w = win(m.leaver);
    w.appendChild(el("p", null, "The login window: " + m.leaver + "'s account (" + m.users[0].name + "). " + m.leaver + " has left Rafiki's IT Services."));
    const l = el("label", null, "Password"); const p = el("input", "w-input"); p.type = "password"; p.id = "mac-lp-" + m.id; l.setAttribute("for", p.id); w.appendChild(l); w.appendChild(p);
    err(w);
    row(w).appendChild(btn("Log in", "w-btn primary", function () { doIt("login", function () { return MAC.signIn(m, m.users[0].name, p.value); }); }, "Log in as " + m.leaver));
    return;
  }
  if (s === "hello") {
    const w = win("Setup Assistant");
    w.appendChild(el("p", "mac-hello", "Hello"));
    w.appendChild(el("p", null, "The first screen of Setup Assistant. " + m.starter + " sets it up from here: country, accessibility, Wi-Fi, then Rafiki's Remote Management."));
    return;
  }
}

/* the same screen, painted for the 3D Mac's display */
import { drawRecovery } from "./mac3d.js";
export function paintMac(m) {
  return function (c, w, h) {
    const s = m.screen;
    if (s === "off") { c.fillStyle = "#050505"; c.fillRect(0, 0, w, h); return; }
    if (s === "recovery") { drawRecovery(c, w, h); return; }
    if (s === "nodisk") { c.fillStyle = "#1f2937"; c.fillRect(0, 0, w, h); c.fillStyle = "#e5e7eb"; c.font = "700 220px Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("?", w / 2, h / 2); return; }
    const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#1e3a8a"); gr.addColorStop(0.6, "#3b1d72"); gr.addColorStop(1, "#14532d"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#ffffff";
    if (s === "hello") { c.font = "300 200px Arial"; c.fillText("Hello", w / 2, h / 2); return; }
    const T = { startup: ["Loading startup options", "Macintosh HD          Options"], "recovery-user": ["macOS Recovery", "Select a user you know the password for"], du: ["Disk Utility", (m.disk.name || "Macintosh HD") + " · " + m.disk.fmt],
      activate: ["Activate Mac", m.lock.on && !m.lock.released ? "Activation Lock: linked to an Apple Account" : "Connected to the internet"], tm: ["Restore from Time Machine", m.leaver + "'s Mac · 2 October 2026"],
      ri: ["macOS Sequoia", m.ri ? { intro: "Click Continue to set up the installation", terms: "Software licence agreement", disk: "Select the disk", ready: "Ready to install" }[m.ri.step] : ""], safari: ["Safari", "support.apple.com"], login: [m.leaver, "Enter Password"] }[s] || ["", ""];
    c.fillStyle = "rgba(243,244,246,0.96)"; c.beginPath(); c.roundRect(w / 2 - 420, h / 2 - 150, 840, 300, 22); c.fill();
    c.fillStyle = "#111827"; c.font = "700 46px Arial"; c.fillText(T[0], w / 2, h / 2 - 50); c.font = "400 32px Arial"; c.fillText(T[1], w / 2, h / 2 + 40);
  };
}
