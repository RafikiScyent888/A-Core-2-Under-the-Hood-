/* =====================================================================
   The router tickets: customers' 92 Series routers, reached through the
   92 Series app on the laptop (remote management the customer shares),
   with the customer doing the physical checks on the phone (owner, 1
   October 2026: "you can ask the homeowner to check the physical aspects
   for you").

   This file: the Tier 1 Router Support sim, the sim's own job plus five.
   Each ticket closes only when the router really works, judged from its
   RUNNING settings (router.js), or, for the two that can't be fixed at
   Tier 1, when the Tier 1 checks are done and it is escalated.
   ===================================================================== */
import * as R from "./router.js";

function opt(label, correct, why) { return { label: label, correct: !!correct, why: why || "" }; }
export function routerOf(fleet, t) { return R.get(fleet, t.id); }
/* every device in the house still gets on: a fix must not break anything */
export function intact(r) { return r.devices.every(function (d) { return R.joins(r, d).ok; }); }
/* every device connected, and none of them crawling */
export function healthy(r) { return r.devices.every(function (d) { return R.joins(r, d).ok && !R.slowWhy(r, d); }); }
function asked(r, what) { return r.events.some(function (e) { return e.kind === "ask" && e.what === what; }); }
function viewed(r, tab) { return r.events.some(function (e) { return e.kind === "view" && e.tab === tab; }); }
function savedStrong(r) { return R.strong(r.saved.admin.pass, r.sticker.pass); }
function runningStrong(r) { return R.strong(r.running.admin.pass, r.sticker.pass); }

/* The shared shape of a router ticket. */
export function routerTicket(o) {
  const t = Object.assign({ sim: "Tier 1 Router Support Scenario", tier: 1, kind: "router", outcome: "resolve", machine: "TECH" }, o);
  t.setup = function (fleet) {
    const r = R.add(fleet, Object.assign({ id: t.id }, o.router));
    if (o.prepare) o.prepare(r);
    fleet.TECH.clock = o.clock || "Oct 06 09:00";
  };
  t.goal = function (fleet) { const r = routerOf(fleet, t); return !!r && o.done(r); };
  t.scoreFn = function (fleet) { const r = routerOf(fleet, t); return r ? o.score(r) : 0; };
  /* The consequence the customer feels, before the judging. */
  t.react = function (act, fleet) { const r = routerOf(fleet, t); if (r && o.react) o.react(act, r); };
  t.judge = function (act, fleet, before) {
    const r = routerOf(fleet, t); if (!r || act.type.indexOf("router-") !== 0) return { guess: false };
    const better = t.scoreFn(fleet) > before.score || t.goal(fleet);
    if (act.type === "router-view" || act.type === "router-sign-in" || act.type === "router-edit" || act.type === "router-firmware") return { guess: false };
    if (act.type === "router-ask") {
      if (act.what === "pc-port") return { guess: true, say: "That takes the " + ((R.role(r, "remote") || {}).name || "PC") + " off the LAN into the screened subnet: outside the LAN's protection, with every port open to the internet. The forward already reaches it safely. Have " + t.who + " plug it back into a LAN port." };
      if (["move", "socket", "power", "console-port", "pc-back"].indexOf(act.what) < 0) return { guess: false };
      if (act.what === "power" && act.lost) return { guess: true, say: t.who + " unplugged it while there were changes on the page that weren't saved. They're gone: the router came back with its saved settings." };
      return better || act.what === "socket" ? { guess: false } : { guess: true, say: act.what === "move" ? "It was already in the INTERNET port. Ask before you have them move things." : t.who + " unplugged it and plugged it back in. Nothing changed." };
    }
    if (act.type === "router-admin-pass") return act.ok ? { guess: false } : { guess: true, say: "The router refused it: " + act.text };
    if (act.type === "router-factory") return { guess: true, say: "Everything on the router is gone: its Wi-Fi name and password, so every device in the " + (t.home ? "house" : "office") + " dropped off, and the admin password is back to the one printed on the sticker. Revert to your last snapshot to put it back." };
    if (act.type === "router-reboot" && act.lost) return { guess: true, say: "The router restarted and threw away what was on the page: it wasn't saved. Type it again, Save, then restart." };
    /* moving the microwave is exploring, a step at a time: only a move that
       makes things worse counts */
    if (act.type === "router-microwave") return t.scoreFn(fleet) < before.score ? { guess: true, say: "That made it worse: look at the floor plan. Where does the microwave do the least harm?" } : { guess: false };
    if (act.type === "router-save" || act.type === "router-reboot") {
      if (better) return { guess: false };
      if (!intact(r)) return { guess: true, say: "Now some of " + t.who + "'s devices can't get on: " + r.devices.filter(function (d) { return !R.joins(r, d).ok; }).map(function (d) { return R.joins(r, d).why; }).join(" ") };
      return { guess: true, say: act.type === "router-save" ? "Saved, but that doesn't move this job on." : "It restarted, but nothing changed for " + t.who + "." };
    }
    return { guess: false };
  };
  t.hints = function (fleet) { return o.hints(routerOf(fleet, t)); };
  t.moves = function (fleet) { return o.moves(routerOf(fleet, t)); };
  t.notReady = function (fleet) { const r = routerOf(fleet, t); return r && o.notReady ? o.notReady(r) : null; };
  t.who = o.from.split(" ")[0];
  return t;
}

/* ---------------------------------------------- shared pieces of advice */
const H_PASS = ["Read what " + "the customer" + " is worried about, and look at the router's Administration page: who could sign in to it today?",
  "A router's default admin password is printed on its sticker and published online for every unit of the model. Until it's replaced with a strong one, anyone on the network can take the router over."];
function passMoves(who) { return [
  opt("Set a strong admin password on Administration, Save, then restart the router", true),
  opt("Change the Wi-Fi password and leave the admin one as it is", false, "That's the password for joining. The admin password, the one that controls everything, is still the one on the sticker."),
  opt("Set the new admin password on the page and close the app", false, "Typed but not saved: the router keeps running the old one, and the next restart throws it away."),
  opt("Factory reset the router first so you start clean", false, "It's brand new and working. A reset wipes " + who + "'s Wi-Fi setup and puts the sticker password straight back."),
  opt("Update the firmware from the Administration page", false, "Worth checking, but it's already the latest, and it doesn't change who can sign in."),
  opt("Escalate it to Tier 2 to set up properly", false, "This is exactly what Tier 1 does. Nothing here needs Tier 2.")]; }
const PASS_DONE = function (r) { return runningStrong(r) && R.wanStatus(r).up && intact(r); };
const PASS_SCORE = function (r) { return (savedStrong(r) ? 1 : 0) + (runningStrong(r) ? 1 : 0); };
const PASS_NOT = function (r) { return !savedStrong(r) ? "Signs in fine with the sticker password, so nothing's changed yet." : !runningStrong(r) ? "It's saved, but the router is still running the old password: it hasn't restarted." : !intact(r) ? "Some devices can't get on any more." : null; };

/* ------------------------------------------------------------- the tickets */
export const ROUTER = [
  routerTicket({ id: "R1", base: true, title: "New replacement router: what do I do now?",
    from: "Leah Brooks, Brooks & Co. Accounting", site: "Brooks & Co. Accounting, 14 Mill Lane",
    brief: ["Leah Brooks. Hi, our replacement router came this morning because the old one stopped working. I plugged it in, the internet's working, and I'm logged in to the router's page with what was on the sticker, but I'm not sure what to do next.",
      "I want to make sure it's set up securely. I've shared it with you in the 92 Series app."],
    router: { site: "Brooks & Co. Accounting", customer: "Leah Brooks", cfg: { wifi: { ssid: "BrooksCo", pass: "Ledger-Lane-2020" } },
      devices: [{ name: "Leah's laptop", mac: "3C:22:FB:10:4A:01", wpa3: true, knows: "Ledger-Lane-2020" }, { name: "Office printer", mac: "00:1E:8F:22:6B:3D", wpa3: false, bands: ["2.4"], knows: "Ledger-Lane-2020" }] },
    done: PASS_DONE, score: PASS_SCORE, notReady: PASS_NOT,
    hints: function () { return H_PASS; }, moves: function () { return passMoves("Leah"); },
    close: { prompt: "Why was the admin password the first thing to change?", options: [
      opt("Its default is on the sticker and published online, so anyone could take it over", true),
      opt("The router won't connect to the internet until the default password is changed", false, "Leah's internet was already working with the default in place."),
      opt("A strong admin password makes the Wi-Fi faster and more reliable", false, "The admin password controls who can change the settings. It has nothing to do with speed."),
      opt("Changing it also changes the Wi-Fi password, which locks the laptop and printer out of the network", false, "They're separate passwords. Leah's laptop and printer still joined afterwards."),
      opt("The provider requires a new password before they activate the line", false, "The line was already active: the globe light was green."),
      opt("Leah had forgotten the password on the sticker", false, "She signed in with it this morning.")] },
    note: { must: [["admin password", "admin"], ["save", "saved"], ["restart", "reboot"]], tip: "say what you changed, and how you made it take effect." } }),

  routerTicket({ id: "R2", title: "Dental office: is \"admin\" really the password?",
    from: "Priya Shah, Smile Dental (reception)", site: "Smile Dental, 2 Station Road",
    brief: ["Priya at Smile Dental. Our new 92 Series router is on the front desk. I'm logged in, reading the sign-in off the sticker, and the admin password says \"admin\". Is that normal?",
      "Our old IT company used to do all this, but they've gone. We just need it working and safe, and the card reader and the front desk PC must stay online. It's shared with you in the app."],
    router: { site: "Smile Dental", customer: "Priya Shah", cfg: { wifi: { ssid: "SmileDental", pass: "Floss&Smile-77" } },
      devices: [{ name: "Card reader", mac: "B8:27:EB:41:9C:02", wpa3: false, bands: ["2.4"], knows: "Floss&Smile-77" }, { name: "Front desk PC", mac: "D4:5D:64:1A:7E:90", wpa3: true, knows: "Floss&Smile-77" }] },
    done: PASS_DONE, score: PASS_SCORE, notReady: PASS_NOT,
    hints: function () { return H_PASS; }, moves: function () { return passMoves("Priya"); },
    close: { prompt: "Why does the new admin password have to be strong, and not just different?", options: [
      opt("Weak passwords fall in seconds to tools that try thousands of guesses", true),
      opt("The router refuses to save an admin password that's shorter than the Wi-Fi password already on it", false, "The two passwords are checked separately. Strength is about guessing, not the Wi-Fi password."),
      opt("A strong password encrypts the card reader's payments", false, "Payments are encrypted by the card system. The admin password protects the router's settings."),
      opt("Different is enough: attackers only try the default", false, "They try common passwords and words next, in seconds."),
      opt("Strong passwords stop the router being seen by neighbours", false, "Neighbours can still see the Wi-Fi name. The admin password controls who can change settings."),
      opt("The provider checks the strength before allowing internet access", false, "The provider never sees the admin password.")] },
    note: { must: [["admin password", "admin"], ["strong", "complex", "12"], ["save", "saved"], ["restart", "reboot"]], tip: "say what you changed, why it had to be strong, and how you made it take effect." } }),

  routerTicket({ id: "R3", title: "Globe light orange after the router swap",
    from: "Marcus Lee, Lee's Bakery", site: "Lee's Bakery, 40 High Street",
    brief: ["Marcus at Lee's Bakery. I set up the replacement router yesterday and changed the admin password like the leaflet said. Today the light with the globe is orange, not green, and nothing can get on the internet. The card machine's offline.",
      "Everything worked on the old router. It's in the app for you."],
    router: { site: "Lee's Bakery", customer: "Marcus Lee", phys: { wanPort: "lan1" }, cfg: { admin: { pass: "Sourdough#Oven42" }, wifi: { ssid: "LeesBakery", pass: "Crusty-Loaf-19" } },
      devices: [{ name: "Card machine", mac: "70:B3:D5:9A:10:44", wpa3: false, bands: ["2.4"], knows: "Crusty-Loaf-19" }, { name: "Marcus's phone", mac: "F0:99:B6:2C:31:7A", wpa3: true, knows: "Crusty-Loaf-19" }] },
    done: function (r) { return R.wanStatus(r).up && intact(r); },
    score: function (r) { return (asked(r, "ports") ? 1 : 0) + (R.wanStatus(r).up ? 2 : 0); },
    notReady: function (r) { return R.wanStatus(r).up ? null : "The globe light is still orange: " + R.wanStatus(r).text; },
    hints: function () { return ["Read the router's Status page: what does it say about the internet side, word for word?", "Before changing any setting, check the physical connection the status points at. Only someone standing at the router can see it."]; },
    moves: function () { return [
      opt("Ask Marcus which port the modem's cable is in, then have him move it to INTERNET", true),
      opt("Restart the router", false, "A restart doesn't move a cable. The status says no cable is detected in the INTERNET port."),
      opt("Factory reset the router", false, "It wipes the admin password Marcus set, and the cable is still in the wrong port."),
      opt("Escalate to the provider: the line is down", false, "The router can't even see the modem's cable. Nothing has reached the provider yet."),
      opt("Change the Wi-Fi channel", false, "Wi-Fi is fine; it's the internet side that's down."),
      opt("Update the router's firmware", false, "It's already the latest, and firmware doesn't plug cables in.")]; },
    close: { prompt: "What was the cause?", options: [
      opt("The modem's cable was in a yellow LAN port, not the blue INTERNET port", true),
      opt("The provider's line was down overnight", false, "Once the cable moved, it came straight up: the line was fine."),
      opt("Changing the admin password yesterday broke the router's connection to the provider's line", false, "The admin password doesn't touch the internet side."),
      opt("The card machine's Wi-Fi password was out of date", false, "It joined the Wi-Fi fine; there was no internet behind it."),
      opt("The router was faulty and needs replacing", false, "It works perfectly with the cable in the right port."),
      opt("The Wi-Fi channel clashed with a neighbour's", false, "That slows Wi-Fi; it doesn't turn the globe light orange.")] },
    note: { must: [["internet port", "wan", "blue"], ["cable"], ["lan port", "yellow", "wrong port"]], tip: "say where the cable was, where it went, and how you knew." } }),

  routerTicket({ id: "R4", title: "Changed the Wi-Fi password, laptop still uses the old one", home: true,
    from: "Daniel Price, home office", site: "Daniel Price, 9 Orchard Close",
    brief: ["Daniel Price. Last night I changed my Wi-Fi password on the router's page to Blue-Harbor#88. I typed the new one in and it showed it on the screen.",
      "I didn't press anything else, I just closed the page. An hour later and this morning, my laptop still connects with the old password. Can you make the new one actually work? It's shared with you in the app."],
    router: { site: "Daniel's home", customer: "Daniel Price", cfg: { admin: { pass: "Harbour#Admin-2026" }, wifi: { ssid: "PriceHome", pass: "Harbor2019!", security: "WPA2/WPA3" } },
      devices: [{ name: "Daniel's laptop", mac: "A4:83:E7:5B:20:11", wpa3: true, knows: "Harbor2019!" }, { name: "Smart TV", mac: "7C:1C:68:0F:93:2E", wpa3: false, bands: ["2.4"], knows: "Harbor2019!" }] },
    want: "Blue-Harbor#88",
    react: function (act, r) { if (r.running.wifi.pass === "Blue-Harbor#88") r.devices.forEach(function (d) { d.knows = "Blue-Harbor#88"; }); },
    done: function (r) { return r.running.wifi.pass === "Blue-Harbor#88" && intact(r); },
    score: function (r) { return (r.saved.wifi.pass === "Blue-Harbor#88" ? 1 : 0) + (r.running.wifi.pass === "Blue-Harbor#88" ? 1 : 0); },
    notReady: function (r) { return r.running.wifi.pass === "Blue-Harbor#88" ? null : r.saved.wifi.pass === "Blue-Harbor#88" ? "It's saved, but the router's still using the old password until it restarts." : "The laptop still connects with the old password."; },
    hints: function () { return ["Daniel says what he did, and what he didn't. Compare what's on the router's Wireless page with what the router is actually running.", "A router has what's typed on its page, what's saved, and what it's running. A change does nothing until it's saved, and it takes effect when the router restarts."]; },
    moves: function () { return [
      opt("Enter the new Wi-Fi password on Wireless, Save, then restart the router", true),
      opt("Tell Daniel to forget the network on his laptop and rejoin", false, "The laptop rejoins with the old password, because the router is still running it."),
      opt("Restart the router so it picks up last night's change", false, "Last night's change was never saved. A restart loads the saved settings: the old password."),
      opt("Factory reset the router and set everything up again", false, "It wipes Daniel's admin password and Wi-Fi, and drops every device in the house."),
      opt("Escalate it: the router must be faulty", false, "It's doing exactly what it was told: nothing was saved."),
      opt("Switch the security to WPA3 so the old password stops working", false, "Daniel's smart TV only does WPA2: it would drop off, and the password is still the old one.")]; },
    close: { prompt: "Why did the old password keep working?", options: [
      opt("It was typed on the page but never saved, so the router kept running the old one", true),
      opt("The laptop had cached the old password and was ignoring the change", false, "A cached password fails the moment the router really changes. It kept working because the router hadn't."),
      opt("Wi-Fi password changes take a day to reach every device", false, "A saved change applies as soon as the router restarts."),
      opt("The provider controls the Wi-Fi password and blocked the change", false, "The router's own Wi-Fi is set on the router."),
      opt("Blue-Harbor#88 is too long for WPA2, so the router quietly rejected it and kept the old one", false, "WPA2 allows 8 to 63 characters. It was accepted once it was saved."),
      opt("The router was faulty and lost the change overnight", false, "Nothing was lost: it was never saved.")] },
    note: { must: [["save", "saved"], ["restart", "reboot"], ["password"]], tip: "say why the old password still worked and what you did so the new one took effect." } }),

  routerTicket({ id: "R5", title: "Router status: PPPoE authentication failed", outcome: "escalate",
    from: "Omar Haddad, Haddad Print Shop", site: "Haddad Print Shop, 77 Canal Street",
    brief: ["Omar at Haddad Print Shop. The replacement router's set up properly, I think: I changed the admin password, saved it and restarted it, like the checklist said.",
      "There's no internet though. The status page says something about PPPoE failing. The old router worked until it died last week. It's in the app."],
    router: { site: "Haddad Print Shop", customer: "Omar Haddad", isp: { mode: "PPPoE", user: "haddad.print@fastline", pass: "Fx7-29qL", letter: false },
      cfg: { admin: { pass: "Inkjet&Toner-2026" }, wan: { mode: "PPPoE", user: "haddad.print@fastline", pass: "" }, wifi: { ssid: "HaddadPrint", pass: "Press-Room-55" } },
      devices: [{ name: "Shop PC", mac: "18:C0:4D:7E:51:A2", wpa3: true, knows: "Press-Room-55" }] },
    done: function (r) { return viewed(r, "status") && asked(r, "letter") && !R.did(r, "factory-reset"); },
    score: function (r) { return (viewed(r, "status") ? 1 : 0) + (asked(r, "letter") ? 1 : 0); },
    notReady: function (r) { return !viewed(r, "status") ? "Tier 2 asks what the router's status says. Read it first." : !asked(r, "letter") ? "Tier 2 asks whether the customer has their provider's sign-in details. Did you ask?" : null; },
    hints: function () { return ["Read the status message word for word: who is refusing whom?", "PPPoE is how some providers sign a router in. A refusal is about the account details, and those come only from the provider: the customer's paperwork, or the provider themselves."]; },
    moves: function () { return [
      opt("Ask Omar for the provider's welcome letter with the PPPoE details", true),
      opt("Restart the router again", false, "It's been restarted. The provider will refuse the same details every time."),
      opt("Factory reset the router", false, "Wipes Omar's setup, and the provider still has no details to accept."),
      opt("Switch the internet connection from PPPoE to DHCP", false, "This provider signs routers in with PPPoE. DHCP gets no address at all."),
      opt("Have Omar move the modem cable to a different port", false, "The cable's fine: the router reached the provider, which refused the sign-in."),
      opt("Make the admin password stronger", false, "The admin password is already strong, and it isn't what the provider checks.")]; },
    close: { prompt: "What do you record for Tier 2?", options: [
      opt("The provider refuses the PPPoE sign-in, and Omar has no account details to give", true),
      opt("The router itself is faulty: it reaches the provider but can't complete the sign-in, so it needs replacing", false, "It reaches the provider and is refused: that's the account, not the router."),
      opt("The admin password is wrong", false, "The admin password signs you in to the router, not the router in to the provider."),
      opt("The cable is in the wrong port, so the router never reaches the provider to sign in", false, "With no cable, it would never get far enough to be refused."),
      opt("The Wi-Fi password needs changing", false, "Wi-Fi works; the internet side is refused."),
      opt("Omar needs to restart the router once more tonight", false, "Restarts don't change what the provider accepts.")] },
    note: { must: [["pppoe"], ["letter", "username", "details", "credentials", "account"], ["escalat", "tier 2", "provider"]], tip: "say what the status said, what you checked with Omar, and who has to fix it." } }),

  routerTicket({ id: "R6", title: "New router restarts itself every few minutes", outcome: "escalate",
    from: "Nora Quinn, Quinn Yoga Studio", site: "Quinn Yoga Studio, 3 Quay Road",
    brief: ["Nora at Quinn Yoga Studio. The new router keeps restarting by itself, every five minutes or so. All the lights go off and then come back.",
      "I've already changed the admin password and saved it. The booking tablet keeps dropping off. It's shared with you in the app."],
    router: { site: "Quinn Yoga Studio", customer: "Nora Quinn", phys: { power: "faulty" }, cfg: { admin: { pass: "Lotus#Flow-2026" }, wifi: { ssid: "QuinnYoga", pass: "Namaste-Mat-21" } },
      devices: [{ name: "Booking tablet", mac: "2C:F0:A2:6D:44:B9", wpa3: true, knows: "Namaste-Mat-21" }] },
    done: function (r) { return asked(r, "lights") && asked(r, "adapter") && asked(r, "socket") && !R.did(r, "factory-reset"); },
    score: function (r) { return (asked(r, "lights") ? 1 : 0) + (asked(r, "adapter") ? 1 : 0) + (asked(r, "socket") ? 1 : 0); },
    notReady: function (r) { return !asked(r, "lights") ? "Tier 2 asks what the lights do when it restarts." : !asked(r, "adapter") ? "Tier 2 asks whether it's on its own power adapter." : !asked(r, "socket") ? "Tier 2 asks whether another socket was tried." : null; },
    hints: function () { return ["Every light going out at once: what does that point to, before any setting?", "A device that loses power restarts with everything else. Rule out what feeds it power, from the adapter to the wall, before blaming the router itself."]; },
    moves: function () { return [
      opt("Ask Nora to check the adapter is the router's own, then try another wall socket", true),
      opt("Factory reset the router", false, "Settings don't cut the power to every light. And it wipes Nora's setup."),
      opt("Restart the router from the app", false, "It's restarting every five minutes on its own already."),
      opt("Update the firmware", false, "It's already the latest. Lights going out together is power."),
      opt("Change the Wi-Fi channel so the tablet stops dropping", false, "The tablet drops because the whole router goes off."),
      opt("Escalate straight away for a replacement", false, "Not before the Tier 1 checks: the adapter and the socket are the usual causes.")]; },
    close: { prompt: "What do you record for Tier 2?", options: [
      opt("It restarts on its own adapter and a second socket: the router's power supply is faulty", true),
      opt("The firmware is out of date", false, "It's the latest, and firmware doesn't cut every light."),
      opt("A neighbour's Wi-Fi is interfering so badly that the router keeps resetting itself to recover", false, "Interference slows Wi-Fi; it doesn't power the router off."),
      opt("The admin password change caused the restarts", false, "The restarts have nothing to do with who can sign in."),
      opt("The wall socket is faulty: it cuts out every few minutes and takes the router down with it", false, "It did the same on the second socket."),
      opt("The booking tablet is faulty", false, "The tablet drops because the router goes off.")] },
    note: { must: [["adapter", "power"], ["socket", "outlet"], ["escalat", "tier 2", "replace"]], tip: "say what it did, what you had Nora check, and what you're asking Tier 2 for." } })
];
