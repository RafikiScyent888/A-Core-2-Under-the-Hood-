/* =====================================================================
   Two programs on the laptop for the Help Desk chats:

   Customer chat: the conversation with the customer, their mood in words,
   and the six replies to choose from. A wrong reply stays in the chat with
   how the customer took it, and stays red in the choices, marked three
   ways (colour, an inset rule, the words). When the customer is waiting
   for you to check something, the chat says what, and offers the tool.

   Mobile devices: the company's enrolled phones. The customer's phone in
   3D (the model the owner approved, phone3d.js), its mail settings as
   real text, Sync now, and the company mail server's published settings.

   ctx: { ticket(), fleet(), reply(label), restart(), open(win),
          mdm(kind), sync(), order(options, salt) }
   ===================================================================== */
import * as CH from "./chat.js";
import * as MB from "./mobile.js";

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(text, cls, fn, label) { const b = el("button", cls, text); b.type = "button"; if (label) b.setAttribute("aria-label", label); b.addEventListener("click", fn); return b; }
const MOOD_NOTE = ["happy to be helped", "wants this sorted quickly", "losing patience", "upset: put it right, calmly"];

export function drawCustomerChat(host, ctx, ui) {
  const t = ctx.ticket(); host.innerHTML = "";
  const wrap = el("div", "cc"); host.appendChild(wrap);
  if (!t || t.kind !== "chat") { wrap.appendChild(el("p", "cc-note", "No customer chat is open. Chats arrive as Help Desk tickets: take one and the customer appears here.")); return; }
  const f = ctx.fleet(), c = CH.get(f, t.id); if (!c) return;
  const head = el("div", "cc-head");
  const who = el("div"); who.appendChild(el("strong", null, t.from)); who.appendChild(el("span", "cc-site", t.sim + " · " + (t.channel === "email" ? "company phone in Mobile devices" : "router shared in the 92 Series app"))); head.appendChild(who);
  /* the mood, in words and a four-step meter (never colour alone) */
  const mood = el("div", "cc-mood m" + c.mood); mood.setAttribute("role", "status");
  mood.appendChild(el("span", "cc-mood-l", "Mood: " + CH.MOODS[c.mood]));
  const bar = el("span", "cc-meter"); bar.setAttribute("aria-hidden", "true"); for (let i = 0; i < CH.MOODS.length; i++) bar.appendChild(el("span", i <= c.mood ? "on" : "")); mood.appendChild(bar);
  mood.appendChild(el("span", "cc-mood-n", MOOD_NOTE[c.mood]));
  head.appendChild(mood); wrap.appendChild(head);

  /* the conversation */
  const log = el("div", "cc-log"); log.setAttribute("aria-label", "Conversation with " + t.who); log.setAttribute("role", "log");
  CH.transcript(f, t).forEach(function (x) {
    if (x.who === "note") { log.appendChild(el("p", "cc-line note", "✓ " + x.text)); return; }
    const b = el("div", "cc-line " + x.who + (x.wrong ? " wrong" : ""));
    b.appendChild(el("span", "cc-who", x.who === "you" ? "You" + (x.wrong ? " · ✕ didn't help" : "") : t.who + (x.mood != null ? " · " + CH.MOODS[x.mood].toLowerCase() : "")));
    if (x.attach) {
      const card = el("figure", "cc-shot"); card.appendChild(el("figcaption", null, "Screenshot · " + x.attach.title));
      const tb = el("table"); x.attach.rows.forEach(function (r) { const tr = el("tr"); const th = el("th", null, r[0]); th.setAttribute("scope", "row"); tr.appendChild(th); tr.appendChild(el("td", null, r[1])); tb.appendChild(tr); }); card.appendChild(tb); b.appendChild(card);
    } else b.appendChild(el("p", null, x.text));
    log.appendChild(b);
  });
  wrap.appendChild(log);

  /* what's next: a reply to choose, something to check, or done */
  const it = CH.current(f, t), next = el("div", "cc-next");
  if (!it) {
    next.appendChild(el("p", "cc-done", "✓ " + t.who + " has what they needed. Resolve the ticket in Help Desk."));
  } else if (it.type === "do") {
    const w = el("div", "cc-wait"); w.setAttribute("role", "status");
    w.appendChild(el("strong", null, t.who + " is waiting while you check:")); w.appendChild(el("p", null, it.doing));
    w.appendChild(btn(t.channel === "email" ? "Open Mobile devices" : "Open the 92 Series app", "b pri cc-tool", function () { ctx.open(t.channel === "email" ? "mobile" : "router"); }));
    next.appendChild(w);
  } else {
    next.appendChild(el("p", "cc-ask", "Choose your reply"));
    const strike = ctx.strike ? ctx.strike() : {}, out = c.out[c.step] || [];
    const grp = el("div", "opts cc-opts"); grp.setAttribute("role", "group"); grp.setAttribute("aria-label", "Your reply to " + t.who);
    CH.shown(t, c, c.step).forEach(function (o) {
      const wrong = out.indexOf(o.label) >= 0, struck = !wrong && strike[o.label];
      const b = el("button", "opt2" + (wrong || struck ? " out" : "")); b.type = "button";
      if (wrong || struck) { b.appendChild(el("span", "om", wrong ? "✕ Ruled out" : "✕ Ruled out by Mason")); b.appendChild(el("span", "ol", o.label)); b.appendChild(el("span", "ow", o.why)); b.setAttribute("aria-disabled", "true"); b.disabled = true; }
      else { b.appendChild(el("span", "ol", o.label)); b.addEventListener("click", function () { ctx.reply(o.label); }); }
      grp.appendChild(b);
    });
    next.appendChild(grp);
  }
  wrap.appendChild(next);
  const foot = el("div", "cc-foot");
  foot.appendChild(btn("Start the chat again", "b small", function () { ctx.restart(); }, "Start the chat again, with a different set of replies"));
  foot.appendChild(el("span", "cc-note", "Starting again puts " + t.who + "'s " + (t.channel === "email" ? "phone" : "router") + " back as it was, with a different six replies on each step."));
  wrap.appendChild(foot);
  /* keep the newest lines in view */
  setTimeout(function () { log.scrollTop = log.scrollHeight; }, 0);
}

/* -------------------------------------------------- Mobile devices */
export function drawMobile(host, ctx, ui) {
  const t = ctx.ticket(), f = ctx.fleet(), p = t && t.kind === "chat" && t.channel === "email" ? MB.get(f, t.id) : null;
  host.innerHTML = "";
  const wrap = el("div", "mdm"); host.appendChild(wrap);
  wrap.appendChild(el("h2", null, "Mobile devices · Rafiki's IT Services"));
  if (!p) { wrap.appendChild(el("p", "cc-note", "No phone to look at for this ticket. Company phones appear here when their owner's ticket is open.")); disposePhone(ui); return; }
  ui.tab = ui.tab || "phone";
  const tabs = el("div", "mdm-tabs"); tabs.setAttribute("role", "group"); tabs.setAttribute("aria-label", "Show");
  [["phone", p.owner.split(" ")[0] + "'s phone"], ["server", "Mail server"]].forEach(function (x) { const b = btn(x[1], "b small" + (ui.tab === x[0] ? " pri" : ""), function () { ui.tab = x[0]; ctx.mdm(x[0] === "phone" ? "view-phone" : "view-server"); }); b.setAttribute("aria-pressed", String(ui.tab === x[0])); tabs.appendChild(b); });
  wrap.appendChild(tabs);
  const body = el("div", "mdm-body"); wrap.appendChild(body);
  if (ui.tab === "phone") {
    const grid = el("div", "mdm-grid");
    const stage = ui.stage || (ui.stage = el("div", "mdm-3d")); grid.appendChild(stage);
    const info = el("div", "mdm-info");
    info.appendChild(el("h3", null, p.owner + " · " + p.model + " · " + p.os));
    const a = p.account;
    info.appendChild(table("Email account", [["Account", a.email], ["Password", a.pass === p.password ? "Saved (accepted when last used)" : "Saved: an earlier password"]]));
    info.appendChild(table("Incoming server", [["Protocol", a.proto], ["Security", a.sec], ["Server", a.server], ["Port", String(a.port)]]));
    info.appendChild(table("Outgoing server (SMTP)", [["Server", a.out.server], ["Port", String(a.out.port)], ["Security", a.out.sec], ["Requires sign-in", a.out.auth ? "On" : "Off"]]));
    const syncBox = el("div", "mdm-sync"); syncBox.setAttribute("role", "status");
    if (p.lastSync && MB.lastAt(p, "student-sync") > MB.lastAt(p, "set")) {
      [["Receiving", p.lastSync.in], ["Sending", p.lastSync.out]].forEach(function (x) { const l = el("p", "mdm-res " + (x[1].ok ? "ok" : "bad")); l.appendChild(el("strong", null, (x[1].ok ? "✓ " : "✕ ") + x[0] + ": ")); l.appendChild(document.createTextNode(x[1].text)); syncBox.appendChild(l); });
    } else syncBox.appendChild(el("p", "cc-note", "Not checked since the last change. Press Sync now to make the phone check its mail and report back."));
    info.appendChild(syncBox);
    info.appendChild(btn("Sync now", "b pri", function () { ctx.sync(); }, "Sync now: make " + p.owner.split(" ")[0] + "'s phone check its mail"));
    grid.appendChild(info); body.appendChild(grid);
    mountPhoneView(stage, ui, p);
  } else {
    body.appendChild(el("p", null, "What every company phone must match. The server only accepts encrypted connections."));
    body.appendChild(table("mail.rafiki.local (10.0.8.1)", [["Incoming: IMAP", "port 993, SSL/TLS: mail stays on the server"], ["Incoming: POP3", "port 995, SSL/TLS: mail is downloaded and removed from the server"], ["Outgoing: SMTP", "port 587, STARTTLS, requires sign-in"]]));
    const rows = Object.keys(MB.PORTS).map(function (k) { return ["Port " + k, MB.PORTS[k]]; });
    body.appendChild(table("Ports you'll meet, and what they are", rows));
  }
}
function table(title, rows) {
  const box = el("section", "mdm-t"); box.appendChild(el("h4", null, title));
  const tb = el("table"); rows.forEach(function (r) { const tr = el("tr"); const th = el("th", null, r[0]); th.setAttribute("scope", "row"); tr.appendChild(th); tr.appendChild(el("td", null, r[1])); tb.appendChild(tr); }); box.appendChild(tb); return box;
}
/* the phone's own screen: the Email settings, as the phone shows them */
function drawSettings(p) { return function (c, w, h) {
  c.fillStyle = "#f4f5f7"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#111827"; c.font = "600 30px Arial"; c.textAlign = "left"; c.fillText("10:30", 40, 58);
  c.font = "700 44px Arial"; c.fillText("Email account", 40, 160);
  const a = p.account, rows = [["Incoming server", ""], ["Protocol", a.proto], ["Security", a.sec], ["Server", a.server], ["Port", String(a.port)], ["Outgoing server", ""], ["Port", String(a.out.port)], ["Security", a.out.sec], ["Sign-in", a.out.auth ? "On" : "Off"]];
  let y = 240; rows.forEach(function (r) { if (!r[1]) { c.fillStyle = "#374151"; c.font = "700 26px Arial"; c.fillText(r[0].toUpperCase(), 40, y); y += 46; return; }
    c.fillStyle = "#ffffff"; c.fillRect(24, y - 40, w - 48, 64); c.fillStyle = "#111827"; c.font = "500 30px Arial"; c.fillText(r[0], 44, y); c.textAlign = "right"; c.fillStyle = "#1e3a8a"; c.fillText(r[1], w - 44, y); c.textAlign = "left"; y += 76; });
  const s = p.lastSync; c.fillStyle = s ? (s.in.ok && s.out.ok ? "#14532d" : "#7f1d1d") : "#374151"; c.font = "600 26px Arial";
  const msg = s ? (s.in.ok && s.out.ok ? "Mail is up to date" : (s.in.ok ? s.out.text : s.in.text)) : "Not checked yet";
  wrapText(c, msg, 40, h - 160, w - 80, 34);
}; }
function wrapText(c, text, x, y, mw, lh) { const words = text.split(" "); let line = ""; words.forEach(function (wd) { const t = line ? line + " " + wd : wd; if (c.measureText(t).width > mw && line) { c.fillText(line, x, y); line = wd; y += lh; } else line = t; }); if (line) c.fillText(line, x, y); }
function mountPhoneView(stage, ui, p) {
  if (ui.phone) { ui.draw = drawSettings(p); ui.phone.redraw(); return; }
  if (ui.mounting) return; ui.mounting = true; ui.draw = drawSettings(p);
  import("./phoneview.js").then(function (mod) {
    if (!mod.webglOK()) throw new Error("no webgl");
    ui.phone = mod.mountPhone(stage, { height: 380, draw: function (c, w, h) { ui.draw(c, w, h); } });
  }).catch(function () { stage.classList.add("off"); stage.appendChild(el("p", "cc-note", "3D isn't available on this computer: the settings beside it are the same.")); });
}
export function disposePhone(ui) { if (ui && ui.phone) { ui.phone.dispose(); ui.phone = null; ui.mounting = false; ui.stage = null; } }
