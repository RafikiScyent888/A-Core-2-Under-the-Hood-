/* =====================================================================
   A PC's screen while it's being installed: the firmware's start-up
   screen, its boot menu and setup, Windows Setup, and Windows' first-run
   setup. Real HTML (readable, zoomable, measured for contrast). Every
   choice goes through ctx.act, so the ticket judges it.
   ===================================================================== */
import * as INS from "./install.js";

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(label, cls, fn, aria) { const b = el("button", cls || "w-btn", label); b.type = "button"; if (aria) b.setAttribute("aria-label", aria); b.addEventListener("click", fn); return b; }

export function drawInstall(screen, m, ctx) {
  const I = m.inst, sc = I.screen;
  const doIt = function (op, fn, extra) { const b = ctx.before(); const r = fn() || {}; ctx.act(Object.assign({ type: "osinst", op: op, res: r, before: b }, extra || {})); ctx.draw(); };
  const err = function (box) { if (I.error) { const e = el("p", "ins-err", "✕ " + I.error); e.setAttribute("role", "alert"); box.appendChild(e); } };
  /* ---------------------------------------------------- the firmware */
  if (sc === "post" || sc === "nodevice" || sc === "pxe" || sc === "bootmenu" || sc === "fw") {
    const fw = el("div", "fw"); screen.appendChild(fw);
    fw.appendChild(el("p", "fw-brand", I.hw.maker + " " + I.hw.model + " · UEFI firmware 2.14.0"));
    if (sc === "post") {
      fw.appendChild(el("p", null, I.hw.cpu + " · " + I.hw.ramGB + " GB memory"));
      fw.appendChild(el("p", "fw-keys", "Press F2 to enter Setup · Press F12 for the Boot Menu"));
      const r = el("div", "fw-row");
      r.appendChild(btn("F2: Setup", "fw-btn", function () { doIt("key", function () { return INS.key(m, "F2"); }, { key: "F2" }); }, "Press F2 to enter the firmware Setup"));
      r.appendChild(btn("F12: Boot Menu", "fw-btn", function () { doIt("key", function () { return INS.key(m, "F12"); }, { key: "F12" }); }, "Press F12 for the Boot Menu"));
      r.appendChild(btn("Let it start", "fw-btn", function () { doIt("key", function () { return INS.key(m, "continue"); }, { key: "continue" }); }, "Let the PC start from its boot order"));
      fw.appendChild(r);
    } else if (sc === "nodevice" || sc === "pxe") {
      if (sc === "pxe") { fw.appendChild(el("p", null, ">> Start PXE over IPv4.")); fw.appendChild(el("p", null, "PXE-E18: Server response timeout.")); }
      fw.appendChild(el("p", "fw-keys", "No bootable device found. Insert boot media and press any key."));
      fw.appendChild(btn("Press any key", "fw-btn", function () { doIt("key", function () { return INS.restartPC(m); }, { key: "retry" }); }, "Press any key to restart the boot"));
    } else if (sc === "bootmenu") {
      fw.appendChild(el("h3", "fw-h", "Boot Menu: choose a boot device"));
      const ul = el("ul", "fw-list");
      ["disk", "usb", "pxe"].forEach(function (e) { const li = el("li"); li.appendChild(btn(INS.entryName(m, e), "fw-btn wide", function () { doIt("bootfrom", function () { return INS.bootFrom(m, e); }, { entry: e }); }, "Boot from " + INS.entryName(m, e))); ul.appendChild(li); });
      fw.appendChild(ul);
      fw.appendChild(btn("Enter Setup", "fw-btn", function () { doIt("key", function () { return INS.key(m, "F2"); }, { key: "F2" }); }, "Enter the firmware Setup"));
    } else {
      const p = I.pending;
      fw.appendChild(el("h3", "fw-h", "Setup"));
      const info = el("dl", "fw-dl"); [["Processor", I.hw.cpu], ["Memory", I.hw.ramGB + " GB"], ["TPM", I.hw.tpm === "none" ? "Not present" : "TPM " + I.hw.tpm + " (firmware TPM)"]].forEach(function (kv) { info.appendChild(el("dt", null, kv[0])); info.appendChild(el("dd", null, kv[1])); }); fw.appendChild(info);
      const sel = function (label, id, opts, val, key) { const r = el("div", "fw-row"); const l = el("label", null, label); const s = el("select", "fw-sel"); s.id = id + "-" + m.id; l.setAttribute("for", s.id); opts.forEach(function (o) { const op = el("option", null, o[0]); op.value = o[1]; if (String(o[1]) === String(val)) op.selected = true; s.appendChild(op); }); s.addEventListener("change", function () { const v = s.value === "true" ? true : s.value === "false" ? false : s.value; doIt("fw-set", function () { return INS.setFw(m, key, v); }, { key: key, value: v }); }); r.appendChild(l); r.appendChild(s); fw.appendChild(r); };
      sel("Boot mode", "fw-mode", [["UEFI", true], ["Legacy (CSM)", false]], p.uefi, "uefi");
      sel("Secure Boot", "fw-sb", [["Enabled", true], ["Disabled", false]], p.secureBoot, "secureBoot");
      if (I.hw.tpm !== "none") sel("TPM (Security Device Support)", "fw-tpm", [["Enabled", true], ["Disabled", false]], p.tpmOn, "tpmOn");
      fw.appendChild(el("h4", "fw-h", "Boot order"));
      const ol = el("ol", "fw-list");
      p.order.forEach(function (e, i) { const li = el("li"); li.appendChild(el("span", null, INS.entryName(m, e))); const up = btn("Up", "fw-btn small", function () { doIt("fw-order", function () { return INS.moveBoot(m, e, -1); }, { entry: e, dir: -1 }); }, "Move " + INS.entryName(m, e) + " up the boot order"); up.disabled = i === 0; const dn = btn("Down", "fw-btn small", function () { doIt("fw-order", function () { return INS.moveBoot(m, e, 1); }, { entry: e, dir: 1 }); }, "Move " + INS.entryName(m, e) + " down the boot order"); dn.disabled = i === p.order.length - 1; li.appendChild(up); li.appendChild(dn); ol.appendChild(li); });
      fw.appendChild(ol);
      const r = el("div", "fw-row");
      r.appendChild(btn("F10: Save changes and exit", "fw-btn", function () { doIt("fw-save", function () { return INS.saveFw(m); }); }, "Save the firmware changes and exit"));
      r.appendChild(btn("Esc: Discard changes and exit", "fw-btn", function () { doIt("fw-discard", function () { return INS.discardFw(m); }); }, "Discard the firmware changes and exit"));
      fw.appendChild(r);
    }
    return;
  }
  /* --------------------------------------------------- Windows Setup */
  if (sc.indexOf("ws-") === 0) {
    const wrap = el("div", "wsetup"); screen.appendChild(wrap);
    const box = el("section", "ws-box"); box.setAttribute("aria-label", "Windows 11 Setup"); wrap.appendChild(box);
    box.appendChild(el("p", "ws-brand", "Windows 11 Setup"));
    const S = I.setup || {};
    const next = function (label, fn, aria) { const r = el("div", "ws-row"); if (["ws-key", "ws-edition", "ws-terms", "ws-disk", "ws-ready"].indexOf(sc) >= 0) r.appendChild(btn("Back", "w-btn", function () { doIt("ws-back", function () { return INS.ws(m, "back"); }); })); r.appendChild(btn(label, "w-btn primary", fn, aria)); box.appendChild(r); };
    if (sc === "ws-lang") {
      box.appendChild(el("h3", "ws-h", "Select language settings"));
      [["Language to install", "English (United Kingdom)"], ["Time and currency format", "English (United Kingdom)"], ["Keyboard", "United Kingdom"]].forEach(function (kv) { const r = el("div", "ws-kv"); r.appendChild(el("span", null, kv[0])); r.appendChild(el("strong", null, kv[1])); box.appendChild(r); });
      next("Next", function () { doIt("ws-lang", function () { return INS.ws(m, "lang"); }); });
    } else if (sc === "ws-option") {
      box.appendChild(el("h3", "ws-h", "Select setup option"));
      const g = el("div", "ws-radios"); g.setAttribute("role", "radiogroup"); g.setAttribute("aria-label", "Setup option");
      const pick = S.pick || "install";
      [["install", "Install Windows 11"], ["repair", "Repair my PC"]].forEach(function (o) { const b = btn(o[1] + (pick === o[0] ? " (selected)" : ""), "ws-radio" + (pick === o[0] ? " on" : ""), function () { S.pick = o[0]; ctx.draw(); }, o[1]); b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(pick === o[0])); g.appendChild(b); }); box.appendChild(g);
      const cl = el("label", "ws-check"); const cb = el("input"); cb.type = "checkbox"; cb.id = "ws-agree-" + m.id; cb.checked = !!S.agree; cb.addEventListener("change", function () { S.agree = cb.checked; }); cl.setAttribute("for", cb.id); cl.appendChild(cb); cl.appendChild(document.createTextNode(" I agree everything will be deleted, including files, apps and settings")); box.appendChild(cl);
      err(box);
      next("Next", function () { doIt("ws-option", function () { return INS.ws(m, "option", { choice: S.pick || "install", agree: S.agree }); }, { choice: S.pick || "install" }); });
    } else if (sc === "ws-unsupported") {
      box.appendChild(el("h3", "ws-h", "This PC can't run Windows 11"));
      box.appendChild(el("p", null, "This PC doesn't meet the minimum system requirements to install this version of Windows."));
      const r = el("div", "ws-row"); r.appendChild(btn("Back", "w-btn primary", function () { S.step = "option"; I.screen = "ws-option"; ctx.draw(); })); box.appendChild(r);
    } else if (sc === "ws-repair") {
      box.appendChild(el("h3", "ws-h", "Repair my PC"));
      box.appendChild(el("p", null, "Troubleshoot: Reset this PC, Startup Repair, System Restore, Command Prompt. There's no Windows on this PC's drive to repair."));
      const r = el("div", "ws-row"); r.appendChild(btn("Back", "w-btn primary", function () { S.step = "option"; I.screen = "ws-option"; ctx.draw(); })); box.appendChild(r);
    } else if (sc === "ws-key") {
      box.appendChild(el("h3", "ws-h", "Product key"));
      box.appendChild(el("p", null, "Enter a product key to activate Windows. It's on the box, in an email, or on a sticker. If this PC was activated before, Windows activates itself from its digital licence once it's online."));
      const l = el("label", null, "Product key"); const inp = el("input", "w-input"); inp.id = "ws-key-" + m.id; l.setAttribute("for", inp.id); inp.setAttribute("autocomplete", "off"); inp.setAttribute("spellcheck", "false"); box.appendChild(l); box.appendChild(inp);
      box.appendChild(btn("I don't have a product key", "w-btn", function () { doIt("ws-key", function () { return INS.ws(m, "key", { none: true }); }, { none: true }); }, "I don't have a product key"));
      err(box);
      next("Next", function () { const v = inp.value; doIt("ws-key", function () { return INS.ws(m, "key", { key: v }); }, { key: v }); });
    } else if (sc === "ws-edition") {
      box.appendChild(el("h3", "ws-h", "Select image"));
      box.appendChild(el("p", null, "Select the edition of Windows 11 to install."));
      const g = el("div", "ws-radios"); g.setAttribute("role", "radiogroup"); g.setAttribute("aria-label", "Edition");
      INS.EDITIONS.forEach(function (e) { const on = S.pickEd === e; const b = btn(e + (on ? " (selected)" : ""), "ws-radio" + (on ? " on" : ""), function () { S.pickEd = e; ctx.draw(); }, e); b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(on)); g.appendChild(b); }); box.appendChild(g);
      if (!S.pickEd) { const p = el("p", "ws-note", "Choose an edition to go on."); box.appendChild(p); }
      next("Next", function () { if (!S.pickEd) return; doIt("ws-edition", function () { return INS.ws(m, "edition", { edition: S.pickEd }); }, { edition: S.pickEd }); });
    } else if (sc === "ws-terms") {
      box.appendChild(el("h3", "ws-h", "Applicable notices and licence terms"));
      box.appendChild(el("p", null, "Microsoft Software License Terms: " + (S.edition || "Windows 11") + ". By accepting, you agree to these terms."));
      next("Accept", function () { doIt("ws-terms", function () { return INS.ws(m, "terms"); }); });
    } else if (sc === "ws-disk") {
      box.appendChild(el("h3", "ws-h", "Select location to install Windows 11"));
      const rows = INS.partRows(m);
      const t = el("table", "ws-table"); const th = el("thead"); const hr = el("tr"); ["Name", "Total size", "Type"].forEach(function (c) { const h = el("th", null, c); h.setAttribute("scope", "col"); hr.appendChild(h); }); th.appendChild(hr); t.appendChild(th);
      const tb = el("tbody");
      rows.forEach(function (r) { const on = S.pickPart === r.i; const tr = el("tr", "ws-part" + (on ? " sel" : "")); tr.tabIndex = 0; tr.setAttribute("aria-label", r.label + ", " + r.size + (r.type ? ", " + r.type : "") + (on ? ", selected" : ""));
        [r.label, r.size, r.type].forEach(function (v) { tr.appendChild(el("td", null, v)); });
        const pick = function () { S.pickPart = r.i; I.error = null; ctx.draw(); };
        tr.addEventListener("click", pick); tr.addEventListener("keydown", function (k) { if (k.key === "Enter" || k.key === " ") { k.preventDefault(); pick(); } }); tb.appendChild(tr); });
      t.appendChild(tb); box.appendChild(t);
      const sel = rows.filter(function (r) { return r.i === S.pickPart; })[0];
      const tools = el("div", "ws-row left");
      const del = btn("Delete partition", "w-btn", function () { doIt("ws-delete", function () { return INS.ws(m, "delete", { i: S.pickPart }); }, { i: S.pickPart }); S.pickPart = null; }, "Delete the selected partition");
      const fmt = btn("Format", "w-btn", function () { doIt("ws-format", function () { return INS.ws(m, "format", { i: S.pickPart }); }, { i: S.pickPart }); }, "Format the selected partition");
      del.disabled = fmt.disabled = !sel || sel.kind === "unalloc"; tools.appendChild(del); tools.appendChild(fmt); box.appendChild(tools);
      err(box);
      next("Next", function () { doIt("ws-next", function () { return INS.ws(m, "next", { i: S.pickPart }); }, { i: S.pickPart }); }, "Install Windows on the selected location");
    } else if (sc === "ws-ready") {
      box.appendChild(el("h3", "ws-h", "Ready to install"));
      const r0 = el("div", "ws-kv"); r0.appendChild(el("span", null, "Edition")); r0.appendChild(el("strong", null, S.edition)); box.appendChild(r0);
      const r1 = el("div", "ws-kv"); r1.appendChild(el("span", null, "Where")); r1.appendChild(el("strong", null, (INS.partRows(m)[S.target] || {}).label || "")); box.appendChild(r1);
      next("Install", function () { doIt("ws-install", function () { return INS.ws(m, "install"); }); });
    } else if (sc === "ws-restart") {
      box.appendChild(el("h3", "ws-h", "Installing Windows 11: 100% complete"));
      box.appendChild(el("p", null, "Windows needs to restart to continue."));
      const r = el("div", "ws-row"); r.appendChild(btn("Restart now", "w-btn primary", function () { doIt("restart", function () { return INS.restartPC(m); }); })); box.appendChild(r);
    }
    return;
  }
  /* ----------------------------------------- the first-run setup, sign-in */
  const wrap = el("div", "oobe"); screen.appendChild(wrap);
  const box = el("section", "oobe-box"); box.setAttribute("aria-label", sc === "signin" ? "Sign in" : "Windows setup"); wrap.appendChild(box);
  const O = I.oobe || {};
  const row = function (label, fn, aria) { const r = el("div", "ws-row"); r.appendChild(btn(label, "w-btn primary", fn, aria)); box.appendChild(r); };
  if (sc === "oobe-region") {
    box.appendChild(el("h3", "ws-h", "Is this the right country or region?")); box.appendChild(el("p", "oobe-big", "United Kingdom"));
    row("Yes", function () { doIt("oobe-region", function () { return INS.oobe(m, "region"); }); });
  } else if (sc === "oobe-name") {
    box.appendChild(el("h3", "ws-h", "Let's name your device")); box.appendChild(el("p", null, "Up to 15 characters: letters, numbers and hyphens."));
    const l = el("label", null, "Device name"); const inp = el("input", "w-input"); inp.id = "oobe-name-" + m.id; l.setAttribute("for", inp.id); inp.setAttribute("autocomplete", "off"); inp.setAttribute("spellcheck", "false"); box.appendChild(l); box.appendChild(inp);
    err(box);
    row("Next", function () { const v = inp.value; doIt("oobe-name", function () { return INS.oobe(m, "name", { name: v }); }, { name: v }); });
  } else if (sc === "oobe-how") {
    box.appendChild(el("h3", "ws-h", "How would you like to set up this device?"));
    const g = el("div", "ws-radios"); g.setAttribute("role", "radiogroup"); g.setAttribute("aria-label", "How to set up this device");
    [["personal", "Set up for personal use"], ["work", "Set up for work or school"]].forEach(function (o) { const on = O.pickHow === o[0]; const b = btn(o[1] + (on ? " (selected)" : ""), "ws-radio" + (on ? " on" : ""), function () { O.pickHow = o[0]; ctx.draw(); }, o[1]); b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(on)); g.appendChild(b); }); box.appendChild(g);
    row("Next", function () { if (!O.pickHow) return; doIt("oobe-how", function () { return INS.oobe(m, "how", { how: O.pickHow }); }, { how: O.pickHow }); });
  } else if (sc === "oobe-msa") {
    box.appendChild(el("h3", "ws-h", "Let's add your Microsoft account")); box.appendChild(el("p", null, "Sign in with a personal Microsoft account (Outlook.com, Hotmail, Xbox) to use this device. You'll use it to sign in to this PC."));
    const r = el("div", "ws-row"); if (O.how) r.appendChild(btn("Back", "w-btn", function () { doIt("oobe-back", function () { return INS.oobe(m, "back"); }); }));
    r.appendChild(btn("Next", "w-btn primary", function () { doIt("oobe-msa", function () { return INS.oobe(m, "msa"); }); }, "Sign in with a personal Microsoft account")); box.appendChild(r);
  } else if (sc === "oobe-work") {
    box.appendChild(el("h3", "ws-h", "Let's set things up for your work or school")); box.appendChild(el("p", null, "You'll use this info to sign in to your devices. Your organisation's Microsoft Entra ID account."));
    const l = el("label", null, "Email, phone or Skype"); const inp = el("input", "w-input"); inp.id = "oobe-entra-" + m.id; l.setAttribute("for", inp.id); inp.setAttribute("autocomplete", "off"); box.appendChild(l); box.appendChild(inp);
    err(box);
    const opts = el("div", "oobe-opts");
    const tg = btn("Sign-in options", "oobe-link", function () { doIt("oobe-opts", function () { O.showOpts = !O.showOpts; return { ok: true }; }); }, "Sign-in options"); tg.setAttribute("aria-expanded", String(!!O.showOpts)); opts.appendChild(tg);
    if (O.showOpts) opts.appendChild(btn("Domain join instead", "w-btn", function () { doIt("oobe-domain-instead", function () { return INS.oobe(m, "domain-instead"); }); }, "Domain join instead"));
    box.appendChild(opts);
    const r = el("div", "ws-row"); r.appendChild(btn("Back", "w-btn", function () { doIt("oobe-back", function () { return INS.oobe(m, "back"); }); }));
    r.appendChild(btn("Next", "w-btn primary", function () { const v = inp.value; doIt("oobe-entra", function () { return INS.oobe(m, "entra", { email: v }); }, { email: v }); }, "Sign in with this work or school account")); box.appendChild(r);
  } else if (sc === "oobe-local") {
    box.appendChild(el("h3", "ws-h", "Who's going to use this device?")); box.appendChild(el("p", null, "Create a local account for this PC. You'll join the domain from Windows once setup is finished."));
    const lu = el("label", null, "User name"); const u = el("input", "w-input"); u.id = "oobe-local-" + m.id; lu.setAttribute("for", u.id); u.setAttribute("autocomplete", "off"); u.setAttribute("spellcheck", "false");
    const lp = el("label", null, "Password"); const pw = el("input", "w-input"); pw.type = "password"; pw.id = "oobe-lpass-" + m.id; lp.setAttribute("for", pw.id);
    [lu, u, lp, pw].forEach(function (x) { box.appendChild(x); });
    err(box);
    const r = el("div", "ws-row"); r.appendChild(btn("Back", "w-btn", function () { doIt("oobe-back", function () { return INS.oobe(m, "back"); }); }));
    r.appendChild(btn("Next", "w-btn primary", function () { const a = u.value; doIt("oobe-local", function () { return INS.oobe(m, "local", { name: a }); }, { name: a }); }, "Create the local account")); box.appendChild(r);
  } else if (sc === "oobe-privacy") {
    box.appendChild(el("h3", "ws-h", "Choose privacy settings for your device")); box.appendChild(el("p", null, "Location, Find my device, diagnostic data, inking and typing, tailored experiences, advertising ID. Rafiki's policy sets these once the PC is on the domain."));
    row("Accept", function () { doIt("oobe-privacy", function () { return INS.oobe(m, "privacy"); }); }, "Accept the privacy settings");
  } else if (sc === "signin") {
    const first = m.fullName.split(" ")[0];
    box.appendChild(el("p", "oobe-big", m.host)); box.appendChild(el("p", null, I.joined ? "Other user · Sign in to: " + INS.DOMAIN.name : "This PC isn't on a domain."));
    box.appendChild(el("p", null, first + " is here to sign in with their own account, RAFIKI\\" + m.user + ". Only " + first + " types the password."));
    err(box);
    row("Let " + first + " sign in", function () { doIt("signin", function () { return INS.signIn(m); }); }, "Let " + first + " sign in as RAFIKI\\" + m.user);
  }
}
