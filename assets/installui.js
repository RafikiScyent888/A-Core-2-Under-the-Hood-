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
      I.fw.order.concat(["disk", "usb", "pxe"].filter(function (x) { return I.fw.order.indexOf(x) < 0; })).forEach(function (e) { const li = el("li"); li.appendChild(btn(INS.entryName(m, e), "fw-btn wide", function () { doIt("bootfrom", function () { return INS.bootFrom(m, e); }, { entry: e }); }, "Boot from " + INS.entryName(m, e))); ul.appendChild(li); });
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
  /* ------------------------------------------- GRUB, Ubuntu's boot loader */
  if (sc === "grub" || sc === "ub-try") {
    const gb = el("div", "grubm"); screen.appendChild(gb);
    gb.appendChild(el("p", "grub-h", "GNU GRUB  version 2.12"));
    const ul = el("ul", "grub-list"); ul.setAttribute("aria-label", sc === "grub" ? "GRUB boot menu" : "The Ubuntu USB's boot menu");
    const items = sc === "grub" ? INS.grubEntries(m) : [["try", "Try or Install Ubuntu"], ["safe", "Ubuntu (safe graphics)"], ["firmware", "UEFI Firmware Settings"]];
    items.forEach(function (it, k) { const li = el("li"); li.appendChild(btn((k === 0 ? "▶ " : "") + it[1], "grub-btn" + (k === 0 ? " first" : ""), function () {
      if (sc === "ub-try") { if (it[0] === "firmware") doIt("key", function () { return INS.key(m, "F2"); }, { key: "F2" }); else doIt("ub-try", function () { return INS.ub(m, "try"); }); }
      else doIt("grub", function () { return INS.grub(m, it[0]); }, { pick: it[0] }); }, it[1])); ul.appendChild(li); });
    gb.appendChild(ul);
    gb.appendChild(el("p", "grub-foot", "Use the ▲ and ▼ keys to select which entry is highlighted. Press enter to boot the selected OS, 'e' to edit the commands before booting or 'c' for a command-line."));
    return;
  }
  if (sc === "ub-remove") {
    const fw = el("div", "fw"); screen.appendChild(fw);
    fw.appendChild(el("p", "fw-keys", "Please remove the installation medium, then press ENTER:"));
    fw.appendChild(btn("Press ENTER", "fw-btn", function () { doIt("restart", function () { return INS.restartPC(m); }); }, "Press Enter to restart"));
    return;
  }
  /* --------------------------------------------- Ubuntu's installer */
  if (sc.indexOf("ub-") === 0 && sc !== "ub-login" && sc !== "ub-desktop") {
    const U = I.ub || {};
    const wrap = el("div", "ubuntu"); screen.appendChild(wrap);
    const box = el("section", "ub-box"); box.setAttribute("aria-label", "Install Ubuntu 24.04 LTS"); wrap.appendChild(box);
    box.appendChild(el("p", "ub-brand", "Install Ubuntu 24.04.1 LTS"));
    const nav = function (label, fn, aria, noBack) { const r = el("div", "ws-row"); if (!noBack) r.appendChild(btn("Back", "w-btn", function () { doIt("ub-back", function () { return INS.ub(m, "back"); }); })); r.appendChild(btn(label, "w-btn primary", fn, aria)); box.appendChild(r); };
    const radios = function (label, opts, key, store) { const g = el("div", "ws-radios"); g.setAttribute("role", "radiogroup"); g.setAttribute("aria-label", label); opts.forEach(function (o) { const on = store[key] === o[0]; const b = btn(o[1] + (on ? " (selected)" : ""), "ws-radio" + (on ? " on" : ""), function () { store[key] = o[0]; ctx.draw(); }, o[1]); b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(on)); g.appendChild(b); if (o[2]) g.appendChild(el("p", "ws-note", o[2])); }); box.appendChild(g); };
    if (sc === "ub-lang") {
      box.appendChild(el("h3", "ws-h", "Welcome to Ubuntu"));
      [["Language", "English (United Kingdom)"], ["Keyboard layout", "English (UK)"], ["Internet", "Wired connection: connected"]].forEach(function (kv) { const r = el("div", "ws-kv"); r.appendChild(el("span", null, kv[0])); r.appendChild(el("strong", null, kv[1])); box.appendChild(r); });
      nav("Next", function () { doIt("ub-lang", function () { return INS.ub(m, "lang"); }); }, null, true);
    } else if (sc === "ub-what") {
      box.appendChild(el("h3", "ws-h", "What do you want to do with Ubuntu?"));
      radios("What to do", [["install", "Install Ubuntu"], ["try", "Try Ubuntu"]], "pickWhat", U);
      err(box);
      nav("Next", function () { doIt("ub-what", function () { return INS.ub(m, "what", { what: U.pickWhat }); }, { what: U.pickWhat }); });
    } else if (sc === "ub-how") {
      box.appendChild(el("h3", "ws-h", "How do you want to install Ubuntu?"));
      const free = INS.freeGB(m), opts = [];
      if (I.os && free >= 25) opts.push(["alongside", "Install Ubuntu alongside Windows Boot Manager", "Documents, music and other personal files will be kept. You can choose which operating system you want each time the computer starts up."]);
      opts.push(["erase", "Erase disk and install Ubuntu", "Warning: This will delete all your programs, documents, photos, music, and any other files in all operating systems."]);
      opts.push(["manual", "Manual installation", "You can create or resize partitions yourself, or choose multiple partitions for Ubuntu."]);
      radios("How to install", opts, "pickHow", U);
      err(box);
      nav("Next", function () { if (U.pickHow) doIt("ub-how", function () { return INS.ub(m, "how", { how: U.pickHow }); }, { how: U.pickHow }); }, "Next: install this way");
    } else if (sc === "ub-manual") {
      box.appendChild(el("h3", "ws-h", "Manual installation"));
      const rows = INS.volumes(m);
      const t = el("table", "ws-table"); const hr = el("tr"); ["Device", "Type", "Size"].forEach(function (c) { const h = el("th", null, c); h.setAttribute("scope", "col"); hr.appendChild(h); }); const th = el("thead"); th.appendChild(hr); t.appendChild(th);
      const tb = el("tbody"); rows.forEach(function (r) { const on = U.pickPart === r.i; const label = r.kind === "unalloc" ? "free space" : "/dev/nvme0n1p" + (r.i + 1); const tr = el("tr", "ws-part" + (on ? " sel" : "")); tr.tabIndex = 0; tr.setAttribute("aria-label", label + ", " + (r.fs || r.name) + ", " + r.gb + " GB" + (on ? ", selected" : ""));
        [label, r.kind === "unalloc" ? "" : (r.fs ? r.fs.toLowerCase() : "") + (r.kind === "os" ? " (Windows)" : r.kind === "efi" ? " (EFI)" : r.kind === "recovery" ? " (Recovery)" : ""), r.gb + " GB"].forEach(function (v) { tr.appendChild(el("td", null, v)); });
        const pick = function () { U.pickPart = r.i; I.error = null; ctx.draw(); }; tr.addEventListener("click", pick); tr.addEventListener("keydown", function (k) { if (k.key === "Enter" || k.key === " ") { k.preventDefault(); pick(); } }); tb.appendChild(tr); });
      t.appendChild(tb); box.appendChild(t);
      const r1 = el("div", "fw-row"); const l1 = el("label", null, "Use as"); const s1 = el("select", "fw-sel"); s1.id = "ub-fs-" + m.id; l1.setAttribute("for", s1.id); [["", "Choose…"], ["ext4", "Ext4"], ["btrfs", "Btrfs"], ["fat32", "FAT32"], ["ntfs", "NTFS"], ["swap", "Swap area"]].forEach(function (o) { const op = el("option", null, o[1]); op.value = o[0]; if (U.pickFs === o[0]) op.selected = true; s1.appendChild(op); }); s1.addEventListener("change", function () { U.pickFs = s1.value; }); r1.appendChild(l1); r1.appendChild(s1); box.appendChild(r1);
      const r2 = el("div", "fw-row"); const l2 = el("label", null, "Mount point"); const s2 = el("select", "fw-sel"); s2.id = "ub-mnt-" + m.id; l2.setAttribute("for", s2.id); [["", "Choose…"], ["/", "/"], ["/home", "/home"], ["/boot", "/boot"]].forEach(function (o) { const op = el("option", null, o[1]); op.value = o[0]; if (U.pickMnt === o[0]) op.selected = true; s2.appendChild(op); }); s2.addEventListener("change", function () { U.pickMnt = s2.value; }); r2.appendChild(l2); r2.appendChild(s2); box.appendChild(r2);
      err(box);
      nav("Next", function () { doIt("ub-manual", function () { return INS.ub(m, "manual", { i: U.pickPart, fs: U.pickFs, mount: U.pickMnt }); }, { i: U.pickPart, fs: U.pickFs }); }, "Next: use this partition");
    } else if (sc === "ub-account") {
      box.appendChild(el("h3", "ws-h", "Create your account"));
      const f = function (lab, id, type) { const l = el("label", null, lab); const i = el("input", "w-input"); i.id = id + "-" + m.id; if (type) i.type = type; l.setAttribute("for", i.id); i.setAttribute("autocomplete", "off"); i.setAttribute("spellcheck", "false"); box.appendChild(l); box.appendChild(i); return i; };
      const a = f("Your name", "ub-name"), b = f("Your computer's name", "ub-host"), c = f("Your username", "ub-user"), d = f("Choose a password", "ub-pass", "password");
      err(box);
      nav("Next", function () { const v = { name: a.value, host: b.value, user: c.value, pass: d.value }; doIt("ub-account", function () { return INS.ub(m, "account", v); }, { host: v.host }); }, "Next: create the account");
    } else if (sc === "ub-review") {
      box.appendChild(el("h3", "ws-h", "Review your choices"));
      const how = { alongside: "Install alongside Windows Boot Manager", erase: "Erase disk and install Ubuntu", manual: "Manual installation" }[U.how];
      [["Installation", how], ["Computer name", U.host], ["Username", U.user]].forEach(function (kv) { const r = el("div", "ws-kv"); r.appendChild(el("span", null, kv[0])); r.appendChild(el("strong", null, kv[1])); box.appendChild(r); });
      if (U.how === "erase") box.appendChild(el("p", "ins-err", "✕ Everything on the disk will be erased, including Windows."));
      nav("Install", function () { doIt("ub-install", function () { return INS.ub(m, "install"); }); }, "Install Ubuntu");
    } else if (sc === "ub-done") {
      box.appendChild(el("h3", "ws-h", "Ubuntu 24.04.1 LTS is installed and ready to use"));
      box.appendChild(el("p", null, "Restart to complete the installation and start using Ubuntu."));
      nav("Restart now", function () { doIt("ub-restart", function () { return INS.ub(m, "restart"); }); }, "Restart now to finish installing Ubuntu", true);
    }
    return;
  }
  /* ---------------------------------------- Ubuntu itself, once installed */
  if (sc === "ub-login" || sc === "ub-desktop") {
    const L = I.lx, first = m.fullName.split(" ")[0];
    const wrap = el("div", "ubd"); screen.appendChild(wrap);
    const bar = el("div", "ubd-bar"); bar.appendChild(el("span", null, "Activities")); bar.appendChild(el("span", null, L.host)); wrap.appendChild(bar);
    if (sc === "ub-login") {
      const box = el("section", "ub-box"); box.setAttribute("aria-label", "Ubuntu sign-in"); wrap.appendChild(box);
      box.appendChild(el("p", "oobe-big", m.fullName)); box.appendChild(el("p", null, "Ubuntu 24.04.1 LTS · " + L.host + " · user " + L.user + ". Only " + first + " types the password."));
      const r = el("div", "ws-row"); r.appendChild(btn("Let " + first + " sign in", "w-btn primary", function () { doIt("ub-signin", function () { return INS.lxSignIn(m); }); }, "Let " + first + " sign in to Ubuntu")); box.appendChild(r);
      return;
    }
    const term = el("section", "ub-term"); term.setAttribute("aria-label", "Terminal"); wrap.appendChild(term);
    term.appendChild(el("p", "ub-term-h", L.user + "@" + L.host + ": ~"));
    L.lines = L.lines || [];
    const out = el("pre", "ub-term-out"); out.textContent = L.lines.join("\n"); term.appendChild(out);
    const row = el("div", "con-row"); const pr = el("label", "ub-prompt", L.user + "@" + L.host + ":~$ "); const inp = el("input", "ub-in"); inp.id = "ub-in-" + m.id; pr.setAttribute("for", inp.id); inp.setAttribute("autocomplete", "off"); inp.setAttribute("spellcheck", "false"); inp.setAttribute("aria-label", "Terminal command");
    inp.addEventListener("keydown", function (k) { if (k.key !== "Enter") return; const line = inp.value; const b = ctx.before(); const res = INS.lxCmd(m, line); if (res === "\f") L.lines = []; else { L.lines.push(L.user + "@" + L.host + ":~$ " + line); if (res) L.lines.push(res); } ctx.act({ type: "osinst", op: "ub-cmd", line: line, res: { ok: true }, before: b }); ctx.draw(); setTimeout(function () { const n = screen.querySelector(".ub-in"); if (n) n.focus(); }, 0); });
    row.appendChild(pr); row.appendChild(inp); term.appendChild(row);
    const r2 = el("div", "ws-row left"); r2.appendChild(btn("Restart", "w-btn", function () { doIt("restart", function () { return INS.restartPC(m); }); }, "Restart Ubuntu")); wrap.appendChild(r2);
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
