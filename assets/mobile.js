/* =====================================================================
   Company phones and the mail server they sync with (the Help Desk
   Chat: Email Issue sim, and later the mobile troubleshooting tickets).

   Plain JSON on TECH-01's record (fleet.TECH.phones), so the engine's
   snapshots and revert cover phones as they cover PCs and routers. No
   DOM: the Mobile devices program draws it.

   Whether a phone's mail works is worked out from its settings against
   the server's, the way a real phone fails, each with the error the
   phone would show:
     - the server's address must be the real one
     - incoming: IMAP on 993 with SSL/TLS, or POP3 on 995 with SSL/TLS
       (the server only accepts encrypted connections)
     - outgoing: SMTP on 587 with STARTTLS and sign-in (port 25 is
       blocked by the mobile carriers)
     - the saved password must be the current one
   ===================================================================== */
export const SERVER = {
  name: "mail.rafiki.local", ip: "10.0.8.1",
  incoming: [{ proto: "IMAP", port: 993, sec: "SSL/TLS" }, { proto: "POP3", port: 995, sec: "SSL/TLS" }],
  outgoing: { proto: "SMTP", port: 587, sec: "STARTTLS", auth: true }
};
/* the ports a technician might meet, and what they really are */
export const PORTS = { 25: "SMTP (server to server; blocked by mobile carriers)", 80: "HTTP (web pages)", 100: "nothing: no mail service listens there", 110: "POP3 without encryption", 143: "IMAP without encryption", 443: "HTTPS (web pages)", 465: "SMTP over SSL (older)", 587: "SMTP submission with STARTTLS", 993: "IMAP over SSL/TLS", 995: "POP3 over SSL/TLS" };

function copy(x) { return JSON.parse(JSON.stringify(x)); }
export function all(fleet) { const t = fleet.TECH; if (!t.phones) t.phones = {}; return t.phones; }
export function get(fleet, id) { return all(fleet)[id]; }

/* o: { id, owner, model, os, account: { email, proto, sec, server, port,
   out: { server, port, sec, auth }, pass }, password (the current one) } */
export function add(fleet, o) {
  const p = { id: o.id, owner: o.owner, model: o.model || "TechCom T7", os: o.os || "Android 15", number: o.number || "",
    account: copy(o.account), password: o.password || "current", events: [], lastSync: null };
  all(fleet)[o.id] = p; return p;
}
export function note(p, kind, d) { p.events.push(Object.assign({ kind: kind, at: p.events.length }, d || {})); }
export function seen(p, kind) { return p.events.filter(function (e) { return e.kind === kind; }).length; }
export function lastAt(p, kind) { const e = p.events.filter(function (x) { return x.kind === kind; }); return e.length ? e[e.length - 1].at : -1; }

/* receiving: { ok, text } in the phone's own words */
export function incoming(p) {
  const a = p.account;
  if (a.server !== SERVER.name && a.server !== SERVER.ip) return { ok: false, text: "Can't find the server \"" + a.server + "\". Check the server name." };
  const svc = SERVER.incoming.filter(function (s) { return s.port === Number(a.port); })[0];
  if (!svc) return { ok: false, text: "Can't connect to " + a.server + " on port " + a.port + ": the connection was refused." };
  if (svc.proto !== a.proto) return { ok: false, text: "The server on port " + a.port + " didn't answer as " + a.proto + "." };
  if (a.sec !== svc.sec) return { ok: false, text: "The server closed the connection: it only accepts encrypted (SSL/TLS) connections." };
  if (a.pass !== p.password) return { ok: false, text: "Authentication failed: the password for " + a.email + " was rejected." };
  return { ok: true, text: "Synced just now over " + a.proto + " on " + a.port + " (" + a.sec + ")" + (a.proto === "POP3" ? ": mail is downloaded to the phone and removed from the server" : ": mail stays on the server, in step with every device") + "." };
}
/* sending */
export function outgoing(p) {
  const o = p.account.out;
  if (o.server !== SERVER.name && o.server !== SERVER.ip) return { ok: false, text: "Can't find the outgoing server \"" + o.server + "\"." };
  if (Number(o.port) === 25) return { ok: false, text: "Can't send: the connection to port 25 timed out. Mobile carriers block port 25." };
  if (Number(o.port) !== SERVER.outgoing.port) return { ok: false, text: "Can't send: nothing accepts mail on port " + o.port + "." };
  if (o.sec !== SERVER.outgoing.sec) return { ok: false, text: "Can't send: the server requires STARTTLS on port 587." };
  if (!o.auth) return { ok: false, text: "Can't send: the server requires you to sign in to send mail." };
  if (p.account.pass !== p.password) return { ok: false, text: "Can't send: the password was rejected." };
  return { ok: true, text: "Sent: SMTP on 587 with STARTTLS, signed in." };
}
export function works(p) { return incoming(p).ok && outgoing(p).ok; }
/* the customer changes settings on the phone, then checks for mail */
export function set(p, path, value) {
  const parts = path.split("."); let o = p.account; for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]]; o[parts[parts.length - 1]] = value;
  note(p, "set", { path: path, value: value });
}
export function sync(p) { const i = incoming(p), o = outgoing(p); p.lastSync = { in: i, out: o }; note(p, "sync", { ok: i.ok && o.ok }); return p.lastSync; }
