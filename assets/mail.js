/* =====================================================================
   Mail at Rafiki's IT Services, as plain JSON on the machines, so verify/
   runs it under Node.

   Staff forward suspicious email to the help desk mailbox (on your
   laptop, TECH-01). Three kinds of message can't be forwarded: their
   headers are what gives them away, and forwarding replaces the headers
   with the forwarder's own, so the technician has to look at the original
   on the user's PC (owner, 1 October 2026).

   What the technician does is recorded per email (state(fleet).tri[id])
   and in Mail admin (block list, policies, purges, password resets), all
   on TECH-01, so snapshots and revert cover it.
   ===================================================================== */
import * as M from "./machine.js";

export function box(m) { if (!m.mail) m.mail = []; return m.mail; }
export function state(fleet) {
  const t = fleet.TECH;
  if (!t.mx) t.mx = { blocked: [], antispoof: false, external: false, impersonation: false, purged: [], bin: {}, resets: [], tri: {} };
  return t.mx;
}
export function tri(fleet, id) {
  const s = state(fleet);
  return s.tri[id] || (s.tri[id] = { cat: null, catOut: [], tell: false, tellOut: [], report: null, safe: false, deleted: false, compromised: false, headers: [], clicked: [] });
}
export function domainOf(addr) { const a = String(addr || "").toLowerCase(); return a.indexOf("@") >= 0 ? a.split("@")[1] : a; }
function now(fleet) { return fleet.TECH.clock || ""; }

/* The headers a mail server adds. Forwarding replaces them with the
   forwarder's own, which is why a forward can't show them. */
export function headersOf(e) {
  const h = e.hdr || {};
  return [
    ["Return-Path", "<" + (e.returnPath || e.from[1]) + ">"],
    ["Received", "from " + (h.server || ("mail." + domainOf(e.from[1]))) + " (" + (h.ip || "203.0.113.24") + ") by mx.rafiki.local; " + e.date],
    ["Authentication-Results", "spf=" + (h.spf || "pass") + " smtp.mailfrom=" + domainOf(e.returnPath || e.from[1]) + "; dkim=" + (h.dkim || "pass") + " header.d=" + domainOf(e.from[1]) + "; dmarc=" + (h.dmarc || "pass") + " header.from=" + domainOf(e.from[1])],
    ["From", e.from[0] + " <" + e.from[1] + ">"],
    ["Reply-To", e.replyTo || e.from[1]],
    ["To", e.toAddr],
    ["Subject", e.subject],
    ["Date", e.date]
  ];
}

/* Deliver one email: the original to the user's mailbox, and (unless it
   can't be forwarded) the user's forward to the help desk. */
export function deliver(fleet, e, who) {
  const msg = { id: e.id, from: e.from, to: e.toAddr, subject: e.subject, date: e.date, body: e.body, links: e.links || [], attach: e.attach || [], headers: headersOf(e), folder: "inbox" };
  box(fleet[e.to]).push(msg);
  if (!e.noForward) box(fleet.TECH).push({ id: e.id, fwd: true, from: [who.name, who.addr], to: "helpdesk@rafiki.local", subject: "FW: " + e.subject, date: e.fwdDate || e.date, note: e.note, orig: msg,
    headers: [["Return-Path", "<" + who.addr + ">"], ["Received", "from WS-" + who.name.split(" ")[0].toUpperCase() + " (192.168.1.2x) by mx.rafiki.local"], ["Authentication-Results", "spf=pass smtp.mailfrom=rafiki.local; dkim=pass header.d=rafiki.local; dmarc=pass header.from=rafiki.local"], ["From", who.name + " <" + who.addr + ">"], ["To", "helpdesk@rafiki.local"], ["Subject", "FW: " + e.subject]], folder: "inbox" });
}

/* ------------------------------------------------- what the tech does */
export function report(fleet, mid, id, kind) {
  const t = tri(fleet, id); t.report = kind;
  box(fleet[mid]).forEach(function (x) { if (x.id === id) x.folder = kind === "junk" ? "junk" : "deleted"; });
  M.note(fleet[mid], "mail-report", { id: id, kind: kind });
}
export function safeReply(fleet, id) { tri(fleet, id).safe = true; M.note(fleet.TECH, "mail-safe", { id: id }); }
export function del(fleet, mid, id) { box(fleet[mid]).forEach(function (x) { if (x.id === id) x.folder = "deleted"; }); tri(fleet, id).deleted = true; M.note(fleet[mid], "mail-delete", { id: id }); }
export function restore(fleet, mid, id) { box(fleet[mid]).forEach(function (x) { if (x.id === id) x.folder = "inbox"; }); const t = tri(fleet, id); t.report = null; t.deleted = false; M.note(fleet[mid], "mail-restore", { id: id }); }
export function block(fleet, entry) {
  const e = String(entry || "").trim().toLowerCase().replace(/^@/, ""); if (!e) return { ok: false, text: "Type an address or a domain to block." };
  const s = state(fleet); if (s.blocked.indexOf(e) < 0) s.blocked.push(e); M.note(fleet.TECH, "mail-block", { entry: e });
  return { ok: true, text: (e.indexOf("@") >= 0 ? "Address" : "Domain") + " " + e + " is blocked. Mail from it is now rejected for everyone." };
}
export function unblock(fleet, entry) { const s = state(fleet); s.blocked = s.blocked.filter(function (x) { return x !== entry; }); M.note(fleet.TECH, "mail-unblock", { entry: entry }); }
export function blocked(fleet, addr) { const s = state(fleet), a = String(addr).toLowerCase(); return s.blocked.indexOf(a) >= 0 || s.blocked.indexOf(domainOf(a)) >= 0; }
/* Search and purge: the message is pulled from every mailbox it reached. */
export function purge(fleet, id) {
  const s = state(fleet), bin = s.bin[id] || (s.bin[id] = []);
  Object.keys(fleet).forEach(function (k) { const m = fleet[k]; if (!m.mail) return; m.mail = m.mail.filter(function (x) { if (x.id === id && !x.fwd) { bin.push({ mid: k, msg: x }); return false; } return true; }); });
  if (s.purged.indexOf(id) < 0) s.purged.push(id); M.note(fleet.TECH, "mail-purge", { id: id });
}
/* Purged mail sits in recoverable items, so a wrong purge can be undone. */
export function unpurge(fleet, id) {
  const s = state(fleet); (s.bin[id] || []).forEach(function (b) { box(fleet[b.mid]).push(b.msg); }); delete s.bin[id];
  s.purged = s.purged.filter(function (x) { return x !== id; }); M.note(fleet.TECH, "mail-unpurge", { id: id });
}
export function setPolicy(fleet, key, on) { state(fleet)[key] = !!on; M.note(fleet.TECH, "mail-policy", { key: key, on: !!on }); }
export const POLICIES = {
  antispoof: { label: "Quarantine mail that fails SPF and DMARC checks", what: "Mail that claims a domain it wasn't sent from is held, not delivered." },
  external: { label: "Tag mail from outside the company [EXTERNAL]", what: "Every message from outside gets [EXTERNAL] in its subject, so a fake colleague stands out." },
  impersonation: { label: "Flag lookalike domains of ours and our suppliers'", what: "Mail from domains one or two characters off ours or a known supplier's is flagged and held." }
};
export function reset(fleet, mid) { const s = state(fleet); if (s.resets.indexOf(mid) < 0) s.resets.push(mid); M.note(fleet.TECH, "mail-reset", { who: mid }); }
export function viewHeaders(fleet, mid, id) { const t = tri(fleet, id); if (t.headers.indexOf(mid) < 0) t.headers.push(mid); M.note(fleet[mid], "mail-headers", { id: id }); }
export function click(fleet, mid, id, href) { tri(fleet, id).clicked.push(mid); M.note(fleet[mid], "mail-click", { id: id, href: href }); }
