/* =====================================================================
   Exam views for the two Help Desk chat sims, laid out as the sims are
   (Core-2-Sims: Help Desk - Email.html, Help Desk - Router.html):

     HELP DESK, and the task line ("Assist the customer with their email
     issue!"); a chat box; the customer's message; under it "Select reply"
     and Send; your reply appears, and the customer's next message after
     it; at the end, Submit, Reset and the score.

   The sim itself is CE1 or CR1 word for word: the sim's own replies are
   the keys, and the sim's own wrong replies (jokes kept) are among the
   six. The five practices are CE2-CE6 and CR2-CR6, the same
   conversations as the tickets, so the exam view and the ticket teach the
   same thing. Each reply is the program's six: the right one and five
   from the ticket's eight wrong ones (the sim's own first, then the ones
   nearest the right one in length, so length never gives it away).

   In a ticket the student also checks the real thing before the key
   reply: the customer's phone against the mail server, or their router
   in the 92 Series app. Here that check is a card in the chat, "You
   check", read from the same model after the ticket's own setup, so it
   shows exactly what the ticket would (Ben's neighbours' channels, Mia's
   laptop that can't join). Only the first check is carried: the later
   one confirms a fix, and the customer says how that went.
   ===================================================================== */
import { CHATS } from "./tickets-chat.js";
import { makeFleet } from "./fleet.js";
import * as MB from "./mobile.js";
import * as R from "./router.js";

function ok(label) { return { label: label, correct: true, why: "" }; }
function no(label, why) { return { label: label, correct: false, why: why }; }

/* the sims' own wrong replies, quoted from the sims, step by step */
export const SIM_OWN = {
  CE1: [["Try restarting your phone.", "Are you sure it's not your internet?"], ["Check if your inbox is full.", "Did you charge your phone?"], ["Try toggling airplane mode.", "Blow on the SIM card."], ["Switch to POP3 protocol.", "Use port 80 instead."]],
  CR1: [["Have you tried using the FAQ?"], ["You should know how to do that!", "This is wasting my time!"], ["Type the password printed on the label on the bottom of the router.", "Use Summer21 as the administrative password so we can assist you in the future.", "Leave the password field blank for easy access in the future."], ["If you think you should, you can.", "No, it is not necessary."]]
};

function six(it, own) {
  const right = it.right.label, must = it.wrong.filter(function (w) { return own.indexOf(w.label) >= 0; });
  const rest = it.wrong.filter(function (w) { return own.indexOf(w.label) < 0; }).sort(function (a, b) { return Math.abs(a.label.length - right.length) - Math.abs(b.label.length - right.length); });
  return [ok(right)].concat(must.concat(rest).slice(0, 5).map(function (w) { return no(w.label, w.why); }));
}
/* what the student would see on the first check, as rows of a card */
function check(t, it) {
  const f = makeFleet(); t.setup(f);
  if (t.channel === "email") {
    const S = MB.SERVER;
    if (it.act === "sync") { const ph = MB.get(f, t.id), r = MB.sync(ph); return { who: "check", title: "Mobile devices · " + t.who + "'s phone · Sync now", rows: [["Receiving", r.in.text], ["Sending", r.out.text]] }; }
    return { who: "check", title: "Mobile devices · the company mail server's published settings", rows: [["Server", S.name]].concat(S.incoming.map(function (x) { return ["Incoming", x.proto + " · port " + x.port + " · " + x.sec]; }), [["Outgoing", S.outgoing.proto + " · port " + S.outgoing.port + " · " + S.outgoing.sec + (S.outgoing.auth ? " · sign-in required" : "")]]) };
  }
  const r = R.get(f, t.id), w = r.running.wifi, page = (/Open its (\w+) page/.exec(it.doing) || [])[1] || "Status";
  if (page === "Wireless") return { who: "check", title: "92 Series app · " + r.site + " · Wireless", rows: [["Network name (SSID)", w.ssid], ["Security", w.security], ["Wi-Fi password", w.pass], ["Band", w.band + " GHz"], ["Channel", String(w.channel)], ["Channel width", w.width + " MHz"], ["Printed on the sticker", "network " + r.sticker.ssid + ", password " + r.sticker.wifiPass]] };
  if (page === "Administration") return { who: "check", title: "92 Series app · " + r.site + " · Administration", rows: [["Firmware installed", r.fw], ["Firmware available", r.fwLatest], ["Admin password", R.defaultPass(r) ? "still the sticker's default" : "changed from the default"]] };
  return { who: "check", title: "92 Series app · " + r.site + " · Status", rows: [["Internet", R.wanStatus(r).text], ["This router's Wi-Fi", w.ssid + " · " + w.security + " · channel " + w.channel + " · " + w.width + " MHz"]]
    .concat(r.devices.map(function (d) { const j = R.joins(r, d); return [d.name, j.ok ? "connected" : "can't connect: " + j.why]; }))
    .concat(r.neighbours.map(function (n) { return ["Nearby: " + n.name, n.ssid + " · channel " + n.channel + " · " + (n.width || 20) + " MHz"]; })) };
}
/* one exam variant from one chat ticket: a step per reply, with every
   customer line (and a screenshot, or a line of yours) that comes before it */
function variant(t, n, o) {
  const steps = [], fields = []; let lines = [], checked = false;
  t.chat.forEach(function (it) {
    (it.cust || []).forEach(function (x) { lines.push(typeof x === "string" ? { who: "cust", text: x } : x.attach ? { who: "cust", attach: x.attach } : { who: x.who || "cust", text: x.text }); });
    /* the sims have no check of their own, so the sim itself stays as it is */
    if (it.type === "do" && !checked && !t.base) { lines.push(check(t, it)); checked = true; }
    if (it.type !== "reply") return;
    const k = fields.length + 1, own = (SIM_OWN[t.id] || [])[k - 1] || [];
    fields.push({ id: "r" + k, label: "Reply " + k, kind: "choice", options: six(it, own), hint: it.h });
    steps.push({ field: "r" + k, lines: lines }); lines = [];
  });
  return { id: o.prefix + n, base: !!t.base, src: t.id, title: t.base ? o.sim : o.short + " · " + n,
    brief: t.base ? [o.task] : [t.from + " has started a help desk chat: " + t.title.charAt(0).toLowerCase() + t.title.slice(1) + ".", o.task],
    who: t.who, steps: steps, closing: t.base ? o.simEnd : lines.concat((t.end || []).map(function (x) { return { who: "cust", text: x }; })), fields: fields };
}
function build(channel, o) { return CHATS.filter(function (t) { return t.channel === channel; }).map(function (t, i) { return variant(t, i + 1, o); }); }

export const CHAT_EXAMS = [
  { id: "hc", sim: "Help Desk Chat: Email Issue", layout: "chat", objective: "Safety and communication", task: "Assist the customer with their email issue!",
    variants: build("email", { prefix: "hc", sim: "Help Desk Chat: Email Issue", short: "Help Desk Chat: Email", task: "Assist the customer with their email issue!", simEnd: [{ who: "cust", text: "Great, it works now! Thanks for helping!" }] }) },
  { id: "hr", sim: "Help Desk Chat: Router Setup", layout: "chat", objective: "Safety and communication", task: "Assist the customer with their issue!",
    variants: build("router", { prefix: "hr", sim: "Help Desk Chat: Router Setup", short: "Help Desk Chat: Router", task: "Assist the customer with their issue!", simEnd: [] }) }
];
