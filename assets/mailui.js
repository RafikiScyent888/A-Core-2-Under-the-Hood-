/* =====================================================================
   Mail: one mailbox, drawn the same way on your laptop (the help desk
   mailbox) and on a user's PC (their own inbox, in a remote session or at
   the desk). Links show where they really go when you point at them or
   tab to them, without opening; "Message details" shows the headers.
   ===================================================================== */
import * as MX from "./mail.js";

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(label, cls, fn, aria) { const b = el("button", cls || "mx-b", label); b.type = "button"; if (aria) b.setAttribute("aria-label", aria); b.addEventListener("click", fn); return b; }

/* ctx: { fleet(), mid, helpdesk: bool, act(a), draw() }  ui: per-window state */
export function drawMail(host, ctx, ui) {
  const fleet = ctx.fleet(), m = fleet[ctx.mid], box = MX.box(m);
  ui.folder = ui.folder || "inbox";
  const wrap = el("div", "mx"); host.appendChild(wrap);
  /* the status line, as in a mail program: where the link under the
     pointer (or the keyboard focus) really goes */
  const sb = el("p", "mx-linkbar", "Point at a link, or tab to it, to see where it really goes."); sb.setAttribute("aria-live", "polite");
  ctx.status = function (t) { sb.textContent = t || "Point at a link, or tab to it, to see where it really goes."; };
  const nav = el("nav", "mx-nav"); nav.setAttribute("aria-label", "Folders");
  nav.appendChild(el("p", "mx-who", ctx.helpdesk ? "helpdesk@rafiki.local" : (m.fullName || m.user) + "'s mail"));
  [["inbox", "Inbox"], ["junk", "Junk Email"], ["deleted", "Deleted Items"]].forEach(function (f) {
    const n = box.filter(function (x) { return x.folder === f[0]; }).length;
    const b = btn(f[1] + (n ? " (" + n + ")" : ""), "mx-f" + (ui.folder === f[0] ? " on" : ""), function () { ui.folder = f[0]; ui.sel = null; ctx.draw(); });
    b.setAttribute("aria-pressed", String(ui.folder === f[0])); nav.appendChild(b);
  });
  wrap.appendChild(nav);
  const list = el("div", "mx-list"); list.setAttribute("role", "list"); list.setAttribute("aria-label", "Messages");
  const items = box.filter(function (x) { return x.folder === ui.folder; });
  if (!items.length) list.appendChild(el("p", "mx-empty", "Nothing in this folder."));
  items.forEach(function (x) {
    const it = btn("", "mx-it" + (ui.sel === x.id ? " sel" : ""), function () { ui.sel = x.id; ui.details = false; ui.status = ""; ctx.draw(); }, "From " + x.from[0] + ": " + x.subject);
    it.setAttribute("role", "listitem"); it.appendChild(el("strong", null, x.from[0])); it.appendChild(el("span", "mx-subj", x.subject)); it.appendChild(el("span", "mx-date", x.date));
    list.appendChild(it);
  });
  wrap.appendChild(list);
  const pane = el("section", "mx-read"); pane.setAttribute("aria-label", "Reading pane"); wrap.appendChild(pane);
  const msg = items.filter(function (x) { return x.id === ui.sel; })[0];
  if (!msg) pane.appendChild(el("p", "mx-empty", items.length ? "Select a message to read it." : ""));
  else drawMessage(pane, msg, ctx, ui);
  host.appendChild(sb);
}

function drawMessage(pane, x, ctx, ui) {
  const fleet = ctx.fleet(), t = MX.tri(fleet, x.id);
  const bar = el("div", "mx-bar"); bar.setAttribute("role", "toolbar"); bar.setAttribute("aria-label", "Message actions");
  const say = function (text) { ui.status = text; ctx.draw(); };
  if (x.folder === "inbox") {
    bar.appendChild(btn("Report: phishing", "mx-b", function () { MX.report(fleet, ctx.mid, x.id, "phishing"); ctx.act({ type: "mail-report", kind: "phishing", id: x.id }); ui.sel = null; }));
    bar.appendChild(btn("Report: junk", "mx-b", function () { MX.report(fleet, ctx.mid, x.id, "junk"); ctx.act({ type: "mail-report", kind: "junk", id: x.id }); ui.sel = null; }));
    if (ctx.helpdesk && x.fwd) bar.appendChild(btn(t.safe ? "Told " + x.from[0].split(" ")[0] + ": it's genuine ✓" : "Reply to " + x.from[0].split(" ")[0] + ": it's genuine, go ahead", "mx-b", function () { if (t.safe) return; MX.safeReply(fleet, x.id); ctx.act({ type: "mail-safe", id: x.id }); }));
    bar.appendChild(btn("Delete", "mx-b", function () { MX.del(fleet, ctx.mid, x.id); ctx.act({ type: "mail-delete", id: x.id }); ui.sel = null; }));
  } else bar.appendChild(btn("Move back to Inbox", "mx-b", function () { MX.restore(fleet, ctx.mid, x.id); ctx.act({ type: "mail-restore", id: x.id }); ui.folder = "inbox"; }));
  bar.appendChild(btn(ui.details ? "Hide message details" : "Message details", "mx-b", function () {
    ui.details = !ui.details; if (ui.details && !x.fwd) { MX.viewHeaders(fleet, ctx.mid, x.id); ctx.act({ type: "mail-headers", id: x.id }); } ctx.draw();
  }, "Message details: the full headers"));
  pane.appendChild(bar);
  if (ui.status) { const s = el("p", "mx-status", ui.status); s.setAttribute("role", "status"); pane.appendChild(s); }
  if (!x.fwd && isNoForward(x, ctx)) pane.appendChild(el("p", "mx-flag", "Mail protection flagged this message. It can't be forwarded."));
  const head = el("div", "mx-head");
  head.appendChild(el("h3", "mx-h", x.subject));
  head.appendChild(line("From", x.from[0] + " <" + x.from[1] + ">"));
  head.appendChild(line("To", x.to)); head.appendChild(line("Sent", x.date));
  pane.appendChild(head);
  if (ui.details) {
    const d = el("div", "mx-hdrs"); d.setAttribute("aria-label", "Message headers");
    if (x.fwd) d.appendChild(el("p", "mx-note", "These are the headers of " + x.from[0].split(" ")[0] + "'s forward, sent from inside the company. Forwarding replaces the original's headers with the forwarder's own."));
    x.headers.forEach(function (h) { const r = el("p", "mx-hl"); r.appendChild(el("strong", null, h[0] + ": ")); r.appendChild(document.createTextNode(h[1])); d.appendChild(r); });
    pane.appendChild(d);
  }
  const body = el("div", "mx-body");
  if (x.fwd) {
    body.appendChild(el("p", "mx-p", x.note || ""));
    body.appendChild(el("p", "mx-sep", "———— Forwarded message ————"));
    const o = x.orig; [["From", o.from[0] + " <" + o.from[1] + ">"], ["Date", o.date], ["Subject", o.subject], ["To", o.to]].forEach(function (kv) { body.appendChild(line(kv[0], kv[1])); });
    renderBody(body, o, ctx, say);
  } else renderBody(body, x, ctx, say);
  pane.appendChild(body);
}
function isNoForward(x, ctx) { return !!(ctx.noForward && ctx.noForward(x.id)); }
function line(k, v) { const p = el("p", "mx-kv"); p.appendChild(el("strong", null, k + ": ")); p.appendChild(document.createTextNode(v)); return p; }

/* The body, with every link a link that shows where it goes before it is
   opened, and every attachment a file you could open (you shouldn't). */
function renderBody(host, o, ctx, say) {
  const links = (o.links || []).slice();
  const re = /(https?:\/\/[^\s]+)/g;
  o.body.split("\n").forEach(function (ln) {
    const p = el("p", "mx-p");
    let parts = [ln];
    links.forEach(function (L) { parts = [].concat.apply([], parts.map(function (s) { if (typeof s !== "string") return [s]; const i = s.indexOf(L.shown); return i < 0 ? [s] : [s.slice(0, i), { link: L }, s.slice(i + L.shown.length)]; })); });
    parts = [].concat.apply([], parts.map(function (s) { if (typeof s !== "string") return [s]; const out = []; let last = 0, mm; re.lastIndex = 0; while ((mm = re.exec(s))) { out.push(s.slice(last, mm.index)); out.push({ link: { shown: mm[1], href: mm[1] } }); last = mm.index + mm[1].length; } out.push(s.slice(last)); return out; }));
    parts.forEach(function (s) {
      if (typeof s === "string") { if (s) p.appendChild(document.createTextNode(s)); return; }
      const a = el("a", "mx-link", s.link.shown); a.href = "#"; a.setAttribute("aria-label", s.link.shown + " (link to " + s.link.href + ")");
      const show = function () { ctx.status("Link goes to: " + s.link.href); if (ctx.peek) ctx.peek(o.id); };
      a.addEventListener("mouseenter", show); a.addEventListener("focus", show);
      a.addEventListener("mouseleave", function () { ctx.status(""); });
      a.addEventListener("click", function (ev) { ev.preventDefault(); MX.click(ctx.fleet(), ctx.mid, o.id, s.link.href); ctx.act({ type: "mail-click", id: o.id, href: s.link.href }); say("You opened " + s.link.href + ". Never open links from a suspicious email, even to check: point at it and read the address instead."); });
      p.appendChild(a);
    });
    host.appendChild(p);
  });
  (o.attach || []).forEach(function (n) {
    const r = el("div", "mx-att"); r.appendChild(el("span", "mx-attn", "📎 " + n));
    r.appendChild(btn("Open", "mx-b", function () { MX.click(ctx.fleet(), ctx.mid, o.id, n); ctx.act({ type: "mail-click", id: o.id, href: n }); say("You opened " + n + ". Never open an attachment from a suspicious email, even to check it: read its full name instead."); }, "Open the attachment " + n));
    host.appendChild(r);
  });
}

/* --------------------------------------------------------- Mail admin */
export function drawAdmin(host, ctx, ui) {
  const fleet = ctx.fleet(), s = MX.state(fleet);
  const wrap = el("div", "mxa"); host.appendChild(wrap);
  const sec = function (title) { const x = el("section", "mxa-sec"); x.appendChild(el("h3", null, title)); wrap.appendChild(x); return x; };
  /* block list */
  const b = sec("Blocked senders and domains");
  const row = el("div", "mxa-row"); const lab = el("label", null, "Address or domain"); const inp = el("input", "field"); inp.id = "mxa-block"; lab.setAttribute("for", inp.id); inp.placeholder = "e.g. example.com";
  const add = function () { const v = inp.value.trim().toLowerCase().replace(/^@/, ""); if (!v) return; const r = MX.block(fleet, v); ui.msg = r.text; ctx.act({ type: "mail-block", entry: v }); };
  inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); add(); } });
  row.appendChild(lab); row.appendChild(inp); row.appendChild(btn("Block", "b pri", add)); b.appendChild(row);
  const ul = el("ul", "mxa-list"); if (!s.blocked.length) ul.appendChild(el("li", null, "Nothing blocked."));
  s.blocked.forEach(function (x) { const li = el("li"); li.appendChild(el("span", null, x)); li.appendChild(btn("Unblock", "b small", function () { MX.unblock(fleet, x); ctx.act({ type: "mail-unblock", entry: x }); }, "Unblock " + x)); ul.appendChild(li); });
  b.appendChild(ul);
  if (ui.msg) { const p = el("p", "mxa-msg", ui.msg); p.setAttribute("role", "status"); b.appendChild(p); }
  /* policies */
  const p = sec("Protection policies (everyone's mail)");
  Object.keys(MX.POLICIES).forEach(function (k) {
    const P = MX.POLICIES[k], r = el("div", "mxa-pol");
    const t = el("div"); t.appendChild(el("strong", null, P.label)); t.appendChild(el("p", null, P.what)); r.appendChild(t);
    r.appendChild(el("span", "chip" + (s[k] ? " st-closed" : ""), s[k] ? "On" : "Off"));
    r.appendChild(btn(s[k] ? "Turn off" : "Turn on", "b small", function () { MX.setPolicy(fleet, k, !s[k]); ctx.act({ type: "mail-policy", key: k, on: !!s[k] }); }, (s[k] ? "Turn off: " : "Turn on: ") + P.label));
    p.appendChild(r);
  });
  /* search and purge */
  const sp = sec("Search and purge");
  sp.appendChild(el("p", null, "Find a message by its subject, then pull it from every mailbox it reached."));
  const r2 = el("div", "mxa-row"); const l2 = el("label", null, "Subject contains"); const q = el("input", "field"); q.id = "mxa-q"; l2.setAttribute("for", q.id); q.value = ui.q || "";
  q.addEventListener("input", function () { ui.q = q.value; ui.keep = true; ctx.draw(); });
  r2.appendChild(l2); r2.appendChild(q); sp.appendChild(r2);
  const found = {}; Object.keys(fleet).forEach(function (k) { (fleet[k].mail || []).forEach(function (x) { if (x.fwd) return; if (ui.q && x.subject.toLowerCase().indexOf(ui.q.toLowerCase()) >= 0) (found[x.id] = found[x.id] || { x: x, where: [] }).where.push(fleet[k].host); }); });
  const fl = el("ul", "mxa-list");
  Object.keys(found).forEach(function (id) { const f = found[id]; const li = el("li"); li.appendChild(el("span", null, "\"" + f.x.subject + "\" from " + f.x.from[1] + " · in " + f.where.join(", ")));
    li.appendChild(btn("Purge from every mailbox", "b small", function () { MX.purge(fleet, id); ctx.act({ type: "mail-purge", id: id }); }, "Purge \"" + f.x.subject + "\" from every mailbox")); fl.appendChild(li); });
  if (ui.q && !Object.keys(found).length) fl.appendChild(el("li", null, "No messages match."));
  sp.appendChild(fl);
  if (s.purged.length) {
    sp.appendChild(el("h4", null, "Purged (recoverable)"));
    const pl = el("ul", "mxa-list");
    s.purged.forEach(function (id) { const bin = (s.bin[id] || [])[0]; const li = el("li"); li.appendChild(el("span", null, bin ? "\"" + bin.msg.subject + "\"" : id));
      li.appendChild(btn("Put it back", "b small", function () { MX.unpurge(fleet, id); ctx.act({ type: "mail-unpurge", id: id }); }, "Put back " + (bin ? bin.msg.subject : id))); pl.appendChild(li); });
    sp.appendChild(pl);
  }
  if (ui.keep) { ui.keep = false; setTimeout(function () { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }, 0); }
  /* accounts */
  const ac = sec("Accounts");
  const al = el("ul", "mxa-list");
  ctx.staff.forEach(function (st) { const li = el("li"); li.appendChild(el("span", null, st.name + " · " + st.addr + (s.resets.indexOf(st.id) >= 0 ? " · password reset, signed out everywhere" : "")));
    li.appendChild(btn("Reset password and sign out everywhere", "b small", function () { MX.reset(fleet, st.id); ctx.act({ type: "mail-reset", who: st.id, id: ctx.emailFor(st.id) }); }, "Reset " + st.name + "'s password and sign out everywhere")); al.appendChild(li); });
  ac.appendChild(al);
}
