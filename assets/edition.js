/* =====================================================================
   A PC's Windows edition, its activation, and joining it to the domain
   (Core 2, Operating systems, "File systems: handling file systems,
   updates, and OS upgrades"). Plain JSON on the machine (m.ed), so
   snapshots and revert cover it. No DOM.

   As Windows 11 behaves:
     Home     can't join a domain: System Properties offers only a
              workgroup, and says so
     key      Settings › System › Activation › Change product key, as an
              administrator. A Pro key on Home is an edition upgrade:
              "Upgrade your edition of Windows", then a restart; files and
              apps stay. The generic Pro key upgrades the edition but
              doesn't activate it. The key on the PC's own sticker is for
              the edition it already has
     Store    Upgrade in the Microsoft Store app: buying Pro for the PC
     join     Pro joins a domain from System Properties › Computer Name ›
              Change… with an account allowed to join computers; it takes
              effect at the next restart
   ===================================================================== */
export const KEYS = {
  company: "RFK7P-2QX9M-8TYH4-W6BCD-3JKPV",   /* Rafiki's Pro upgrade key, from Mason's licence sheet */
  generic: "VK7JG-NPHTM-C97JM-9MPGT-3V66T",   /* Microsoft's published generic key for Pro: it installs, it doesn't activate */
  oem: "YTMG3-N6DKC-DKB77-7M9GH-8HVX7"        /* the PC's own sticker: Home */
};
export const DOMAIN = { name: "RAFIKI", user: "itadmin", pass: "Bench-Tech-2026" };
export function ready(m) { if (!m.ed) m.ed = { edition: m.edition, activated: true, key: null, pending: null, joined: m.domain === "RAFIKI", joinPending: false }; return m; }
export function note(m, kind, d) { m.events.push(Object.assign({ kind: kind, at: m.events.length }, d || {})); }
function norm(k) { return String(k || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/(.{5})(?=.)/g, "$1-"); }
export function home(m) { return /Home/.test(ready(m).ed.edition); }
export function status(m) {
  const e = ready(m).ed;
  if (e.pending) return "Restart required: " + e.pending.edition + " finishes installing as the PC restarts.";
  return e.activated ? "Windows is activated with a digital licence" + (e.key === "company" ? " (product key)" : "") + "." : "Windows isn't activated. The product key used installs " + e.edition + " but can't activate it.";
}
/* Change product key */
export function changeKey(m, raw) {
  const e = ready(m).ed, k = norm(raw);
  if (!/^([A-Z0-9]{5}-){4}[A-Z0-9]{5}$/.test(k)) return { ok: false, typo: true, text: "This product key didn't work. Check it and try again, or try a different key. (0x800f0805)" };
  if (k === KEYS.oem) return { ok: false, same: true, text: "That product key is for " + (home(m) ? "the edition already installed" : "Windows 11 Home") + ". Nothing to change." };
  if (k !== KEYS.company && k !== KEYS.generic) return { ok: false, typo: true, text: "This product key didn't work. Check it and try again, or try a different key. (0xC004F050)" };
  const which = k === KEYS.company ? "company" : "generic";
  if (home(m) || (e.pending && e.pending.edition)) { e.pending = { edition: "Windows 11 Pro", key: which }; note(m, "ed-key", { key: which, upgrade: true }); return { ok: true, upgrade: true, key: which, text: "Upgrade your edition of Windows: Windows 11 Pro. Your files and apps stay. Restart to finish." }; }
  /* already Pro: a key changes the activation only */
  e.key = which; e.activated = which === "company"; note(m, "ed-key", { key: which, upgrade: false });
  return { ok: true, key: which, text: e.activated ? "Windows is activated." : "Windows isn't activated: that key can't activate it." };
}
/* the Microsoft Store's Upgrade to Pro */
export function store(m) { note(m, "ed-store"); const e = ready(m).ed; e.pending = { edition: "Windows 11 Pro", key: "store" }; return { ok: true, upgrade: true, key: "store", text: "Purchased Windows 11 Pro for $99.99 on the signed-in account. Restart to finish." }; }
/* System Properties › Computer Name › Change… */
export function join(m, d) {
  const e = ready(m).ed; d = d || {};
  if (home(m)) return { ok: false, refused: true, text: "Windows 11 Home can't join a domain." };
  const dom = String(d.domain || "").trim().toUpperCase().replace(/\.LOCAL$/, "");
  if (dom !== DOMAIN.name) return { ok: false, typo: true, text: "An Active Directory Domain Controller (AD DC) for the domain \"" + (d.domain || "") + "\" could not be contacted." };
  const u = String(d.user || "").trim().replace(/^rafiki(\.local)?\\/i, "").replace(/@rafiki\.local$/i, "").toLowerCase();
  if (u !== DOMAIN.user || d.pass !== DOMAIN.pass) return { ok: false, typo: true, needCreds: true, text: "The user name or password is incorrect, or that account can't join computers to the domain." };
  if (e.joined) return { ok: false, text: "This computer is already a member of RAFIKI." };
  e.joinPending = true; note(m, "ed-join");
  return { ok: true, text: "Welcome to the RAFIKI domain. You must restart your computer to apply these changes." };
}
/* the PC starts again: the edition upgrade and the join finish */
export function onBoot(m) {
  if (!m.ed) return; const e = m.ed, done = [];
  if (e.pending) { e.edition = e.pending.edition; e.key = e.pending.key; e.activated = e.pending.key !== "generic"; m.edition = e.edition; e.pending = null; done.push("edition"); }
  if (e.joinPending) { e.joinPending = false; e.joined = true; m.domain = DOMAIN.name; done.push("join"); }
  if (done.length) note(m, "ed-boot", { done: done });
}
export function pendingRestart(m) { return !!(m.ed && (m.ed.pending || m.ed.joinPending)); }
