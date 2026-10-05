/* =====================================================================
   Extra training: Mobile troubleshooting (Software troubleshooting,
   "addressing connectivity, app, and performance issues"). The owner,
   5 October 2026: "Mobile next, build it out".

   Six tickets on company phones, worked by remote help from the Mobile
   devices program, on the approved phone (phone3d.js):
     MB1  crawl  battery dead by lunch, phone warm     an app's background
                                                       battery and location
     MB2  walk   app crashes since its update           clear cache, not
                                                       storage (offline orders)
     MB3  run    "Connected, no internet" everywhere    Private DNS
     MB4  run    system update won't install            free space safely
     MB5  run    ads, fake warnings, data warning       a sideloaded app;
                                                       unknown sources
     MB6  run    mail only arrives when Outlook opens   background battery
                                                       and data for the app
   Restart and Force stop are safe first steps: they never count against
   the student, even when they don't help.
   ===================================================================== */
import * as MB from "./mobile.js";
import * as PH from "./phone.js";

function opt(label, correct, why) { return { label: label, correct: !!correct, why: why || "" }; }
const MOBILE = { topic: "Mobile troubleshooting", domain: "Software troubleshooting", objective: "addressing connectivity, app, and performance issues", kind: "mobile", extra: true, tier: 1, outcome: "resolve", machine: "TECH", category: "Software troubleshooting › Mobile", channel: "phone" };
const ACCOUNT = { email: "", proto: "IMAP", sec: "SSL/TLS", server: "mail.rafiki.local", port: 993, out: { server: "mail.rafiki.local", port: 587, sec: "STARTTLS", auth: true }, pass: "current" };

/* every company phone: the same managed apps */
function phone(fleet, id, owner, email, model) {
  const p = MB.add(fleet, { id: id, owner: owner, model: model || "TechCom T7", account: Object.assign({}, ACCOUNT, { email: email }) });
  PH.ready(p);
  PH.addApp(p, "outlook", { name: "Outlook", ver: "4.24", drain: 3, cacheGB: 0.3, dataGB: 0.6, mail: true });
  PH.addApp(p, "teams", { name: "Teams", ver: "1416.1", drain: 4, cacheGB: 0.4, dataGB: 0.5 });
  PH.addApp(p, "chrome", { name: "Chrome", ver: "129.0", drain: 2, cacheGB: 0.5, dataGB: 0.3, system: true, needsNet: true });
  PH.addApp(p, "maps", { name: "Maps", ver: "11.142", drain: 1.5, locDrain: true, location: "Allow only while using the app", cacheGB: 0.2, dataGB: 0.4, system: true });
  PH.addApp(p, "camera", { name: "Camera", ver: "15.0", drain: 0, cacheGB: 0.05, dataGB: 0.05, system: true });
  return p;
}
function P(fleet, t) { return MB.get(fleet, t.id); }
function did(p, kind, test) { return PH.lastAt(p, kind, test); }
/* what every phone ticket shares */
function common(act, p) {
  if (act.type !== "phone") return { guess: false };
  if (act.op === "factory-reset") return { guess: true, say: "Everything on the phone was erased: apps, accounts and anything not backed up. A factory reset is the last resort, never the first fix. Revert to your last snapshot." };
  if (act.op === "install-cleaner") return { guess: true, say: act.res && act.res.text };
  if (act.op === "restart" || act.op === "force-stop") return { guess: false, say: act.op === "restart" ? "The phone restarted. A restart is a safe first step: it doesn't count, but it didn't change anything this time." : "Stopped. Force stop is a safe first step: it doesn't count, but it isn't a fix on its own." };
  return null;
}
function mobileTicket(o, order) {
  const t = Object.assign({}, MOBILE, o);
  t.goal = function (fleet) { return t.stage(fleet) === "done"; };
  t.scoreFn = function (fleet) { const i = order.indexOf(t.stage(fleet)); return i < 0 ? 0 : i; };
  const judge = o.judge;
  t.judge = function (act, fleet, before) {
    const p = P(fleet, t); if (!p) return { guess: false };
    const c = common(act, p); if (c && (c.guess || act.op === "restart" || act.op === "force-stop")) return c;
    if (act.type !== "phone" || act.op === "view" || act.op === "open" || act.op === "test-mail" || act.op === "scan") return { guess: false };
    return judge(act, p, fleet, before) || { guess: false };
  };
  return t;
}
const WIPED = ["Look at the phone: what's on its screen now?", "Get back to the last point you had right before you go on."];
const WIPEMOVES = [opt("Revert to your last snapshot", true), opt("Set the phone up again from scratch", false, "The snapshot puts everything back exactly; setting it up again loses what wasn't backed up."), opt("Ask the owner to restore it from a backup", false, "The snapshot is exact and quicker."), opt("Escalate to Tier 2", false, "The snapshot fixes it at Tier 1."), opt("Order a replacement phone", false, "Nothing is wrong with the hardware."), opt("Resolve the ticket", false, "The phone is erased.")];

/* ---------------- MB1 (crawl): Rosa's battery, and a weather app ---------------- */
function mb1(fleet) {
  const p = MB.get(fleet, "MB1"); if (!p) return "none"; const a = PH.app(p, "weather");
  if (p.dev.wiped) return "wiped";
  if (!a) return "gone";
  if (a.location === "Allow all the time" || a.location === "Don't allow") return "location";
  if (a.battery === "Unrestricted") return "battery";
  if (did(p, "view", function (e) { return e.page === "battery"; }) < did(p, "app-set")) return "test";
  return "done";
}
const MB1 = mobileTicket({
  id: "MB1", title: "Phone battery dead by lunch, and it gets warm", from: "Rosa Ortiz, Reception",
  brief: ["Rosa at reception. My work phone used to last all day. For the last week it's dead by lunchtime, and it feels warm in my pocket even when I'm not using it.",
    "I haven't installed anything new, apart from a weather app last week. I check the weather for my commute every morning, so I'd like to keep it.",
    "Mason's note on the ticket: company phones are enrolled, so you can use Remote help from Mobile devices. Rosa will accept it."],
  setup: function (fleet) {
    const p = phone(fleet, "MB1", "Rosa Ortiz", "rosa.ortiz@rafiki.local");
    PH.addApp(p, "weather", { name: "Weather Live", ver: "8.4", drain: 52, locDrain: true, location: "Allow all the time", battery: "Unrestricted", cacheGB: 0.3, dataGB: 0.1 });
    p.dev.battery.level = 38;
  },
  stage: mb1,
  notReady: function (fleet) { const s = mb1(fleet); return s === "test" ? "Mason: \"What does the phone say about its battery now? Check before you close it.\"" : s === "gone" ? "Rosa: \"Where's my weather app gone?\"" : s === "wiped" ? "Rosa's phone is at its welcome screen." : "Rosa looks at her phone: still about " + PH.battery(MB.get(fleet, "MB1")).hours + " hours left, and it's warm."; },
  judge: function (act, p) {
    if (act.op === "saver" && act.on) return { guess: true, say: "Battery Saver slows everything down to hide one app's drain. Find what's using the battery instead." };
    if (act.op === "uninstall" && act.app === "weather") return { guess: true, say: "Rosa uses that app every morning: she asked to keep it. Revert to your last snapshot, and change how it behaves instead." };
    if (act.op === "uninstall") return { guess: true, say: "That app wasn't draining the battery, and now it's gone." };
    if (act.op === "app-set" && act.app === "weather" && act.key === "location" && act.value === "Don't allow") return { guess: true, say: "Now the weather app can't give her local forecast at all. She only needs it while she's looking at it." };
    if (act.op === "app-set" && act.app !== "weather") return { guess: true, say: "That app barely uses the battery. Look at what the Battery page shows at the top." };
    if (act.op === "app-set" && act.app === "weather" && act.key === "battery" && act.value === "Unrestricted") return { guess: true, say: "Unrestricted lets it run in the background as much as it likes: the opposite of what's needed." };
    if (act.op === "clear-cache" || act.op === "clear-storage") return { guess: true, say: "Its files aren't the problem: what it does in the background is." };
    if (["airplane", "data", "data-saver", "private-dns", "forget", "reset-network"].indexOf(act.op) >= 0) return { guess: true, say: "Nothing on the network is draining the battery. The Battery page shows what is." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      wiped: WIPED, gone: ["Is the weather app still on the phone?", "Rosa asked to keep it. Get back to the last point you had right."],
      location: ["The phone keeps a list of what's been using its battery. Look at what tops it, then at that app's permissions.", "An app allowed to track location all the time keeps waking the phone. Give it location only when it really needs it."],
      battery: ["Look at how much that app is allowed to run in the background.", "Background activity is controlled per app. An app you only open now and then doesn't need to run unrestricted."],
      test: ["Has the battery estimate changed since your fix?", "Check the result on the phone itself before you close the ticket."],
      done: ["The battery should last the day now. Close the ticket.", "The close question is about why the app drained it."]
    };
    return H[mb1(fleet)];
  },
  moves: function (fleet) {
    const X = {
      wiped: WIPEMOVES, gone: [opt("Revert to your last snapshot", true), opt("Reinstall Weather Live from the Play Store", false, "Her settings and saved places would be gone. The snapshot is exact."), opt("Tell Rosa to use the browser instead", false, "She asked to keep the app."), opt("Resolve the ticket", false, "She wanted the app kept."), opt("Turn on Battery Saver", false, "That hides the problem, and the app is still gone."), opt("Escalate", false, "The snapshot fixes it.")],
      location: [opt("Set Weather Live's location to Allow only while using the app", true),
        opt("Turn on Battery Saver", false, "Slows the whole phone to hide one app's drain."),
        opt("Uninstall Weather Live", false, "Rosa uses it every morning and asked to keep it."),
        opt("Set Weather Live's location to Don't allow", false, "Then it can't give her the local forecast she opens it for."),
        opt("Clear Weather Live's cache", false, "Its files aren't the problem; its background activity is."),
        opt("Factory reset the phone", false, "A last resort for one app's setting.")],
      battery: [opt("Set Weather Live's background battery use to Restricted", true),
        opt("Set Outlook's background battery use to Restricted", false, "Outlook barely uses any, and her mail would be late."),
        opt("Force stop Weather Live", false, "It starts again at its next refresh."),
        opt("Turn on Battery Saver", false, "Hides the drain instead of stopping it."),
        opt("Turn off Mobile data", false, "Breaks everything else; the app still wakes the phone."),
        opt("Restart the phone", false, "The app starts again with the same settings.")],
      test: [opt("Open the Battery page and read the estimate", true), opt("Resolve: the settings are changed", false, "Check the result first."), opt("Ask Rosa to tell you tomorrow", false, "The phone shows it now."), opt("Restart the phone to apply it", false, "The settings already apply."), opt("Turn on Battery Saver to be sure", false, "Not needed, and it slows the phone."), opt("Uninstall the app anyway", false, "She asked to keep it.")],
      done: [opt("Resolve the ticket", true), opt("Turn on Battery Saver too", false, "Not needed now."), opt("Uninstall Weather Live to be safe", false, "She asked to keep it."), opt("Order a new battery", false, "The battery was fine; an app was draining it."), opt("Escalate to Tier 2", false, "It's fixed at Tier 1."), opt("Factory reset the phone", false, "Nothing to reset.")]
    };
    return X[mb1(fleet)];
  },
  closeWhere: "Think about what the weather app was doing when Rosa wasn't using it.",
  close: { prompt: "Rosa asks: \"So was my battery wearing out?\" What do you tell her?", options: [
    opt("No: the weather app tracked her all day in the background, keeping it awake", true),
    opt("Yes: batteries wear out after a year, so the phone needs a new one fitted soon", false, "The estimate went back to a full day as soon as the app was restricted. The battery is fine."),
    opt("No: the phone overheated in her pocket, and heat is what drained the battery", false, "The heat came from the app working constantly. The app was the cause."),
    opt("No: a system update last week changed how the battery is reported", false, "The Battery page showed one app using over half of it."),
    opt("Yes: leaving it on charge overnight wears the battery out faster", false, "Charging habits weren't it. Restricting one app fixed it."),
    opt("No: the 5G signal at reception is weak, and searching for it drains the battery", false, "The Battery page pointed at the weather app, and restricting it fixed it.")] },
  note: { must: [["weather"], ["location", "all the time", "while using"], ["background", "restricted", "battery use"], ["hours", "battery page", "checked", "estimate"]],
    tip: "What was draining it (and how you knew), the two settings you changed, and what the Battery page said afterwards." },
  adviceStart: "Open Mobile devices from the ticket: Rosa's phone is there, with Remote help. Start with what the phone itself says about its battery.",
  adviceWork: "The phone keeps a list of what has used its battery. Whatever tops it, look at what that app is allowed to do when Rosa isn't using it."
}, ["wiped", "gone", "location", "battery", "test", "done"]);

/* ---------------- MB2 (walk): Brenda's sales app crashes after its update ---------------- */
function mb2(fleet) {
  const p = MB.get(fleet, "MB2"); if (!p) return "none"; const a = PH.app(p, "salespad");
  if (p.dev.wiped) return "wiped";
  if (!a || a.drafts < 3) return "lost";
  if (a.broken) return "fix";
  if (did(p, "open", function (e) { return e.app === "salespad" && e.ok; }) < did(p, "clear-cache")) return "test";
  return "done";
}
const MB2 = mobileTicket({
  id: "MB2", title: "SalesPad keeps closing since this morning's update", from: "Brenda Smith, Sales",
  brief: ["Brenda in Sales. SalesPad updated itself this morning and now it won't open: the logo flashes and it closes. I'm out at clients all afternoon.",
    "Please be careful: I took three orders yesterday at a client with no signal, and they're saved in the app waiting to sync. Those can't go missing.",
    "Mason's note on the ticket: Remote help from Mobile devices. The store has no newer version of SalesPad yet."],
  setup: function (fleet) {
    const p = phone(fleet, "MB2", "Brenda Smith", "brenda.smith@rafiki.local");
    PH.addApp(p, "salespad", { name: "SalesPad", ver: "5.2.0", drain: 2, cacheGB: 0.6, dataGB: 0.4, drafts: 3, broken: "cache" });
  },
  stage: mb2,
  notReady: function (fleet) { const s = mb2(fleet); return s === "lost" ? "Brenda: \"Where are yesterday's three orders?\"" : s === "test" ? "Brenda: \"Does it open now? Have you tried it?\"" : s === "wiped" ? "Brenda's phone is at its welcome screen." : "Brenda opens SalesPad: the logo flashes and it closes."; },
  judge: function (act) {
    if (act.op === "clear-storage") return { guess: true, say: "That deleted everything SalesPad kept on the phone, including Brenda's three unsynced orders. Revert to your last snapshot: there's a gentler step that keeps app data." };
    if (act.op === "uninstall") return { guess: true, say: "Uninstalling deleted SalesPad's data with it, including the three unsynced orders. Revert to your last snapshot." };
    if (act.op === "saver" || act.op === "data-saver" || act.op === "airplane" || act.op === "private-dns" || act.op === "forget" || act.op === "reset-network") return { guess: true, say: "SalesPad doesn't even get as far as the network: it closes as it starts." };
    if (act.op === "app-set") return { guess: true, say: "Its permissions and battery settings don't stop it opening." };
    if (act.op === "clear-cache" && act.app !== "salespad") return { guess: true, say: "That's a different app's temporary files." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      wiped: WIPED, lost: ["Are Brenda's three orders still in SalesPad?", "Some fixes delete an app's data along with the problem. Get back to the last point you had right."],
      fix: ["Look at SalesPad's app info: what does it keep on the phone, and which of those parts can go safely?", "An app that crashes after an update often trips over temporary files left by the old version. Remove those, and keep its data."],
      test: ["Has anyone tried SalesPad since your fix?", "A fix isn't finished until you've seen it work, with the data still there."],
      done: ["SalesPad opens with the orders still there. Close the ticket.", "The close question is about the two kinds of clearing."]
    };
    return H[mb2(fleet)];
  },
  moves: function (fleet) {
    const X = {
      wiped: WIPEMOVES, lost: [opt("Revert to your last snapshot", true), opt("Ask Brenda to take the orders again", false, "The snapshot has them."), opt("Reinstall SalesPad", false, "The orders were in its data; reinstalling doesn't bring them back."), opt("Resolve: the app opens now", false, "Three orders are gone."), opt("Escalate to the SalesPad vendor", false, "The snapshot has them."), opt("Clear storage again", false, "Nothing left to clear.")],
      fix: [opt("Clear SalesPad's cache", true),
        opt("Clear SalesPad's storage", false, "Deletes all its data, including the three unsynced orders."),
        opt("Uninstall and reinstall SalesPad", false, "Uninstalling deletes its data, orders included."),
        opt("Update SalesPad", false, "Mason's note: there's no newer version yet."),
        opt("Turn off SalesPad's background data", false, "It closes as it starts; data doesn't come into it."),
        opt("Factory reset the phone", false, "Everything goes, orders included.")],
      test: [opt("Open SalesPad and check the orders are there", true), opt("Resolve: the cache is cleared", false, "Check it opens first."), opt("Clear the cache again", false, "Once is enough; test it."), opt("Restart the phone", false, "Test the app."), opt("Ask Brenda to try it at the client", false, "Try it now, with her."), opt("Update SalesPad", false, "There's no update; test the fix.")],
      done: [opt("Resolve the ticket", true), opt("Clear storage to be safe", false, "That would delete the orders now."), opt("Reinstall SalesPad anyway", false, "It works, and reinstalling loses the orders."), opt("Escalate to the vendor", false, "It's fixed."), opt("Turn off automatic updates for every app", false, "Updates bring security fixes."), opt("Factory reset", false, "Nothing to reset.")]
    };
    return X[mb2(fleet)];
  },
  closeWhere: "Think about what each kind of clearing deletes.",
  close: { prompt: "Brenda asks: \"Why didn't clearing the cache lose my orders?\" What do you tell her?", options: [
    opt("The cache is only temporary files; her orders are app data, which clearing cache keeps", true),
    opt("The orders had already synced to the server, so nothing on the phone could lose them", false, "They hadn't: she took them with no signal. They were in the app's data, which cache clearing keeps."),
    opt("Clearing the cache backs the app's data up to the cloud first, then puts it back", false, "Nothing is backed up. Cache clearing simply doesn't touch app data."),
    opt("The orders are stored on the SIM card, not in the app, so nothing in the app can touch them", false, "They're in SalesPad's data on the phone. Cache clearing leaves that alone."),
    opt("Clearing the cache only works on apps from the Play Store, which keeps their data safe", false, "Where the app came from has nothing to do with it."),
    opt("Android always keeps three copies of an app's data while it's being repaired", false, "There are no extra copies. The cache just isn't where data lives.")] },
  note: { must: [["salespad"], ["cache"], ["orders", "data", "offline"], ["opened", "opens", "tested", "works", "checked"]],
    tip: "What it did, what you cleared and why that and not storage, and how you checked the orders were still there." },
  adviceStart: "Open Mobile devices and see it for yourself: open SalesPad on Brenda's phone. Then look at the app's info.",
  adviceWork: "An app keeps two kinds of things on the phone. One can go safely; the other holds Brenda's orders."
}, ["wiped", "lost", "fix", "test", "done"]);

/* ---------------- MB3 (run): John's phone, connected but no internet ---------------- */
function mb3(fleet) {
  const p = MB.get(fleet, "MB3"); if (!p) return "none"; const n = p.dev.net;
  if (p.dev.wiped) return "wiped";
  if (n.saved.indexOf("Rafiki-Staff") < 0 || n.airplane || !n.data) return "broken";
  if (!PH.internet(p).ok) return "dns";
  if (did(p, "open", function (e) { return e.app === "chrome" && e.ok; }) < did(p, "net")) return "test";
  return "done";
}
const MB3 = mobileTicket({
  id: "MB3", title: "Phone says connected, but nothing loads, anywhere", from: "John Doe, HR",
  brief: ["John in HR. Since yesterday evening nothing on my work phone loads: websites, Teams, nothing. It says connected on the office Wi-Fi, and at home, and on 5G, but it just doesn't work.",
    "The only thing I did was follow an article that said changing one setting would make browsing faster and block adverts. Everyone else in the office is fine.",
    "Mason's note on the ticket: Remote help from Mobile devices."],
  setup: function (fleet) { const p = phone(fleet, "MB3", "John Doe", "john.doe@rafiki.local"); p.dev.net.privateDns = "dns.fastsurf-free.net"; },
  stage: mb3,
  notReady: function (fleet) { const s = mb3(fleet); return s === "test" ? "John: \"Does it work? Can you open a website?\"" : s === "broken" ? "John: \"Now it won't connect to the office Wi-Fi at all.\"" : s === "wiped" ? "John's phone is at its welcome screen." : "John tries a website: \"This site can't be reached.\""; },
  judge: function (act, p) {
    if (act.op === "forget") return { guess: true, say: "The phone has forgotten the network, and John doesn't know the Wi-Fi password. And it wasn't the Wi-Fi: 5G fails too. Revert to your last snapshot." };
    if (act.op === "reset-network") return { guess: true, say: "That fixed it the hard way: every saved Wi-Fi network is gone too, and John can't rejoin the office Wi-Fi without its password. Revert, and change just the one setting." };
    if (act.op === "airplane" && act.on) return { guess: true, say: "Now nothing connects at all." };
    if (act.op === "data" && !act.on) return { guess: true, say: "Now there's no mobile data either." };
    if (act.op === "private-dns" && act.res && !PH.internet(p).ok) return { guess: true, say: "Still no internet: that server can't be reached either." };
    if (act.op === "clear-cache" || act.op === "clear-storage" || act.op === "uninstall" || act.op === "app-set") return { guess: true, say: "Every app fails the same way, on every network. The cause is in a setting they all share." };
    if (act.op === "saver" || act.op === "data-saver") return { guess: true, say: "That limits data; it doesn't stop the connection failing." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      wiped: WIPED, broken: ["Can the phone still join the office Wi-Fi?", "Get back to the last point you had right: undo what you changed."],
      dns: ["Read exactly what the phone says about its internet connection, and what John said he changed.", "When every network fails the same way, the cause is something every connection shares, not the Wi-Fi or the carrier. Put that setting back to the phone's default."],
      test: ["Have you tried loading something since the change?", "Prove it on the phone: open something that needs the internet."],
      done: ["John's phone loads things again. Close the ticket.", "The close question is about what that setting does."]
    };
    return H[mb3(fleet)];
  },
  moves: function (fleet) {
    const X = {
      wiped: WIPEMOVES, broken: [opt("Revert to your last snapshot", true), opt("Ask John for the Wi-Fi password", false, "He doesn't know it, and the snapshot is exact."), opt("Use mobile data only from now on", false, "That isn't a fix."), opt("Reset network settings", false, "That forgets every network."), opt("Escalate to Tier 2", false, "The snapshot fixes it."), opt("Resolve", false, "It still doesn't work.")],
      dns: [opt("Set Private DNS back to Automatic", true),
        opt("Forget the office Wi-Fi and rejoin it", false, "5G fails too, so it isn't the Wi-Fi, and John doesn't know the password."),
        opt("Reset network settings", false, "It would work, but every saved network goes with it."),
        opt("Turn airplane mode on and off", false, "The same setting comes straight back."),
        opt("Clear Chrome's cache", false, "Every app fails, not just Chrome."),
        opt("Factory reset the phone", false, "A last resort for one setting.")],
      test: [opt("Open Chrome on the phone and load a page", true), opt("Resolve: the setting is changed", false, "Prove it works first."), opt("Restart the phone to apply it", false, "It applies at once."), opt("Ask John to try later", false, "Try it now."), opt("Reset network settings to be sure", false, "That forgets every network."), opt("Turn off Wi-Fi", false, "Test on the network he uses.")],
      done: [opt("Resolve the ticket", true), opt("Turn off Private DNS entirely", false, "Automatic is the safe default; it's fine."), opt("Reset network settings anyway", false, "It works; that would forget his networks."), opt("Escalate", false, "Fixed at Tier 1."), opt("Factory reset", false, "Nothing to reset."), opt("Block John from changing settings", false, "Out of scope at Tier 1.")]
    };
    return X[mb3(fleet)];
  },
  closeWhere: "Think about what John's \"faster browsing\" setting actually controls.",
  close: { prompt: "John asks why one setting broke everything. What do you tell him?", options: [
    opt("Private DNS sent every name lookup to a server that doesn't answer, on every network", true),
    opt("The setting turned off his Wi-Fi card, so the phone was only pretending to be connected", false, "The Wi-Fi was connected; the names it looked up got no answer."),
    opt("The ad-blocking setting blocked every website, because most websites contain adverts", false, "It wasn't blocking ads: the lookup server didn't answer at all."),
    opt("The setting used up his monthly data, so the carrier cut his internet off", false, "His data was fine, and Wi-Fi failed too."),
    opt("It changed his phone's IP address to one the office router doesn't allow", false, "His address was fine; name lookups failed."),
    opt("It installed a VPN that routed everything through a country that blocks the sites", false, "There was no VPN. Private DNS pointed at a dead server.")] },
  note: { must: [["private dns", "dns"], ["automatic", "default"], ["fastsurf", "article", "ad", "faster"], ["chrome", "loaded", "tested", "works", "opened"]],
    tip: "What the phone said, the setting that caused it and what you set it to, and how you proved it works." },
  adviceStart: "Open Mobile devices: John's phone is there. Read what it says about its internet connection, word for word.",
  adviceWork: "Every app fails, on every network, and John changed one setting from an article. What do all connections share?"
}, ["wiped", "broken", "dns", "test", "done"]);

/* ---------------- MB4 (run): Dev's update needs space ---------------- */
function mb4(fleet) {
  const p = MB.get(fleet, "MB4"); if (!p) return "none";
  if (p.dev.wiped) return "wiped";
  if (!p.dev.storage.items.some(function (x) { return x.id === "week"; }) || !PH.app(p, "teams") || !PH.app(p, "teams").signedIn) return "lost";
  if (p.dev.update.installed) return "done";
  if (PH.free(p) < p.dev.update.gb) return "space";
  return "install";
}
const MB4 = mobileTicket({
  id: "MB4", title: "Phone update keeps failing: not enough storage", from: "Dev Patel, Dev",
  brief: ["Dev here. My work phone keeps nagging me about a security update, and every time I tap install it says there isn't enough space. Mason says it has to be on by Friday.",
    "Please don't touch this week's site-survey videos: they haven't uploaded to OneDrive yet, and they're the only copies. Last month's uploaded fine.",
    "Mason's note on the ticket: Remote help from Mobile devices. Don't sign anyone out of Teams: it's how site crews reach them."],
  setup: function (fleet) {
    const p = phone(fleet, "MB4", "Dev Patel", "dev.patel@rafiki.local", "TechCom T5");
    p.dev.storage.totalGB = 32;
    PH.app(p, "teams").cacheGB = 0.9; PH.app(p, "teams").dataGB = 0.8; PH.app(p, "chrome").cacheGB = 1.1;
    p.dev.storage.items = [{ id: "sept", label: "Site-survey videos, September", gb: 2.4, backedUp: true }, { id: "week", label: "Site-survey videos, this week", gb: 1.9, backedUp: false }, { id: "docs", label: "Downloaded PDFs", gb: 0.15, backedUp: true }];
    p.dev.update = { patch: "1 October 2026", gb: 3.1, installed: false };
  },
  stage: mb4,
  notReady: function (fleet) { const s = mb4(fleet); return s === "lost" ? "Dev: \"Where have this week's videos gone?\" or Teams has signed him out." : s === "wiped" ? "Dev's phone is at its welcome screen." : "Mason checks Dev's phone: still on the August security update."; },
  judge: function (act, p) {
    if (act.op === "delete" && act.res && act.res.backedUp === false) return { guess: true, say: "Those were the only copies: Dev said they hadn't uploaded. Revert to your last snapshot." };
    if (act.op === "clear-storage" && act.app === "teams") return { guess: true, say: "Teams is signed out now, which Mason said not to do. Revert to your last snapshot." };
    if (act.op === "clear-storage") return { guess: true, say: "That deleted the app's data and signed it out; its cache alone would have been enough." };
    if (act.op === "uninstall") return { guess: true, say: "Removing a work app to make room isn't the fix: there's space to be had without losing anything." };
    if (["saver", "airplane", "data", "data-saver", "private-dns", "forget", "reset-network", "app-set"].indexOf(act.op) >= 0) return { guess: true, say: "That doesn't free any space." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      wiped: WIPED, lost: ["Are this week's videos still there, and is Teams still signed in?", "Get back to the last point you had right before freeing space another way."],
      space: ["Look at what's using the space, and which of it has another copy somewhere or is only temporary.", "Free space with what costs nothing to lose: temporary files, and things already backed up elsewhere. Never the only copy."],
      install: ["Is there enough space for the update now?", "Once the space is there, the update can go on."],
      done: ["The update is on. Close the ticket.", "The close question is about what was safe to delete."]
    };
    return H[mb4(fleet)];
  },
  moves: function (fleet) {
    const X = {
      wiped: WIPEMOVES, lost: [opt("Revert to your last snapshot", true), opt("Ask Dev to film the surveys again", false, "The snapshot has them."), opt("Sign Dev back into Teams later", false, "The snapshot is exact."), opt("Install the update and carry on", false, "Something was lost."), opt("Escalate to Tier 2", false, "The snapshot fixes it."), opt("Resolve", false, "Something was lost.")],
      space: [opt("Delete September's videos, which are already in OneDrive", true),
        opt("Delete this week's videos", false, "The only copies: Dev said they haven't uploaded."),
        opt("Clear Teams' storage", false, "Signs Dev out of Teams, which Mason said not to do."),
        opt("Clear Chrome's and Teams' caches only", false, "Safe, but only about 2 GB: still short of the 3.1 GB the update needs."),
        opt("Uninstall Outlook to make room", false, "A work app, and there's safer space to free."),
        opt("Factory reset the phone", false, "Everything goes, this week's videos included.")],
      install: [opt("Download and install the system update", true), opt("Delete more files first", false, "There's enough space now."), opt("Restart before installing", false, "Not needed; the update restarts the phone."), opt("Resolve: there's space now", false, "The update isn't installed yet."), opt("Clear every app's storage", false, "Not needed, and it signs everything out."), opt("Wait for it to install overnight", false, "Install it now, while you can see it work.")],
      done: [opt("Resolve the ticket", true), opt("Delete this week's videos to keep space free", false, "Still the only copies."), opt("Turn off system updates", false, "Security updates must stay on."), opt("Escalate", false, "Fixed at Tier 1."), opt("Factory reset", false, "Nothing to reset."), opt("Clear Teams' storage", false, "Signs him out.")]
    };
    return X[mb4(fleet)];
  },
  closeWhere: "Think about which files had a second copy, and which didn't.",
  close: { prompt: "Dev asks how you decided what to delete. What do you tell him?", options: [
    opt("Only what had another copy: September's videos were already in OneDrive", true),
    opt("The biggest files first, because they free the most space in the fewest steps", false, "Size wasn't the test: this week's videos were big and had no other copy."),
    opt("The oldest files first, because anything over a month old is safe to delete", false, "Age wasn't it. Whether there's another copy was."),
    opt("Anything the phone flagged as safe to delete, because it checks the cloud first", false, "The phone doesn't know what's backed up for you. You checked."),
    opt("Whatever was in the Downloads folder, because downloads can always be fetched again", false, "The PDFs barely helped; the backed-up videos made the room."),
    opt("App caches only, because personal files must never be deleted at work", false, "Caches alone weren't enough; backed-up videos are safe to remove from the phone.")] },
  note: { must: [["update", "security update"], ["september", "backed up", "onedrive"], ["this week", "only cop", "not backed"], ["space", "storage", "gb"]],
    tip: "Why it failed, what you freed and why it was safe, what you left alone, and that the update installed." },
  adviceStart: "Open Mobile devices: Dev's phone is there. Try the update yourself, then look at what's using the space.",
  adviceWork: "For each thing using space, ask: is it temporary, or is there another copy of it somewhere? Dev and Mason both told you what mustn't go."
}, ["wiped", "lost", "space", "install", "done"]);

/* ---------------- MB5 (run): Farah's phone, ads and fake warnings ---------------- */
function mb5(fleet) {
  const p = MB.get(fleet, "MB5"); if (!p) return "none";
  if (p.dev.wiped) return "wiped";
  if (!PH.app(p, "outlook") || !PH.app(p, "teams")) return "broken";
  if (PH.app(p, "pdfscan")) return "remove";
  if (p.dev.unknown.Chrome) return "source";
  if (did(p, "scan") < did(p, "uninstall", function (e) { return e.app === "pdfscan"; })) return "scan";
  return "done";
}
const MB5 = mobileTicket({
  id: "MB5", title: "Adverts everywhere, and a warning says my phone is infected", from: "Farah Nkemelu, Finance",
  brief: ["Farah again. Since the weekend my work phone is full of adverts, even on the home screen, and a big warning keeps saying my phone has three viruses and I should install a cleaner. I haven't tapped it.",
    "I also got a text saying I've nearly used my whole month's data, which never happens.",
    "On Saturday I needed to scan a receipt, and the Play Store app wanted money, so I found a free PDF scanner on a website and installed that instead.",
    "Mason's note on the ticket: Remote help from Mobile devices."],
  setup: function (fleet) {
    const p = phone(fleet, "MB5", "Farah Nkemelu", "farah.nkemelu@rafiki.local");
    PH.addApp(p, "pdfscan", { name: "PDF Scanner Free", ver: "2.1", source: "Chrome (unknown sources)", drain: 9, cacheGB: 0.2, dataGB: 0.3, adware: true, hidden: true });
    p.dev.unknown.Chrome = true;
  },
  stage: mb5,
  notReady: function (fleet) { const s = mb5(fleet); return s === "scan" ? "Mason: \"Have you checked nothing else is hiding on it?\"" : s === "source" ? "Mason: \"What stops the next one getting on the same way?\"" : s === "broken" ? "Farah: \"Where have my work apps gone?\"" : s === "wiped" ? "Farah's phone is at its welcome screen." : "Farah's phone shows another full-screen advert."; },
  judge: function (act, p) {
    if (act.op === "uninstall" && act.app !== "pdfscan") return { guess: true, say: "That was a work app, not the cause. Revert to your last snapshot." };
    if (act.op === "clear-cache" || act.op === "clear-storage") return { guess: true, say: "Clearing an app's files doesn't remove the app showing the ads." };
    if (act.op === "saver" || act.op === "data-saver") return { guess: true, say: "That hides the data use; the app causing it is still there." };
    if (act.op === "unknown" && act.on) return { guess: true, say: "That allows installs from outside the store: how the problem got on in the first place." };
    if (["airplane", "data", "private-dns", "forget", "reset-network", "app-set"].indexOf(act.op) >= 0) return { guess: true, say: "The ads come from an app on the phone, not the connection." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      wiped: WIPED, broken: ["Are Farah's work apps still there?", "Get back to the last point you had right."],
      remove: ["Read Farah's message for what she installed, and where from. Then look at where each app on the phone came from.", "Adverts outside any app, fake infection warnings and a sudden jump in data use point to an app installed from outside the store. Remove it."],
      source: ["How did that app get onto the phone? Is that way still open?", "Close the route it came in by: the phone should only install apps from the store."],
      scan: ["Have you checked the phone for anything else harmful?", "After removing a bad app, scan with the phone's own protection to confirm it's clean."],
      done: ["The phone is clean and closed to outside installs. Close the ticket.", "The close question is about how it got on."]
    };
    return H[mb5(fleet)];
  },
  moves: function (fleet) {
    const X = {
      wiped: WIPEMOVES, broken: [opt("Revert to your last snapshot", true), opt("Reinstall the work apps", false, "Their data and sign-ins would be gone."), opt("Resolve", false, "Work apps are missing."), opt("Escalate", false, "The snapshot fixes it."), opt("Factory reset", false, "Everything goes."), opt("Run a scan", false, "The apps are still gone.")],
      remove: [opt("Uninstall PDF Scanner Free", true),
        opt("Tap Clean now and install CleanMaster Pro", false, "The warning is fake: that's the scam."),
        opt("Clear Chrome's cache", false, "The ads come from an app, not Chrome's files."),
        opt("Turn on Data Saver", false, "Hides the data use; the app stays."),
        opt("Factory reset the phone", false, "A last resort: one app is the cause."),
        opt("Uninstall Teams", false, "A work app, from the store.")],
      source: [opt("Turn off Install unknown apps for Chrome", true), opt("Leave it on in case she needs another app", false, "Apps come from the store. That's how this one got on."), opt("Turn off Chrome's background data", false, "Doesn't stop installs."), opt("Uninstall Chrome", false, "Part of the system, and not the fix."), opt("Turn on Battery Saver", false, "Nothing to do with installs."), opt("Clear Chrome's storage", false, "The switch stays on.")],
      scan: [opt("Scan with Play Protect", true), opt("Resolve: the app is gone", false, "Check nothing else is there."), opt("Install a free antivirus app from a website", false, "The same mistake again."), opt("Restart the phone", false, "Doesn't check anything."), opt("Factory reset to be sure", false, "A scan shows whether it's needed."), opt("Ask Farah to watch for ads", false, "Check it yourself now.")],
      done: [opt("Resolve the ticket", true), opt("Factory reset anyway", false, "The scan found nothing."), opt("Turn unknown apps back on for her receipt scans", false, "That's how it got on."), opt("Escalate", false, "Fixed at Tier 1."), opt("Install CleanMaster Pro", false, "That's the scam."), opt("Turn off Play Protect", false, "It's the phone's own defence.")]
    };
    return X[mb5(fleet)];
  },
  closeWhere: "Think about where the scanner came from.",
  close: { prompt: "What do you tell Farah, so it doesn't happen again?", options: [
    opt("Only install apps from the Play Store; ask IT if one costs money", true),
    opt("Tap the warnings only when they mention a number of viruses she can check", false, "The warning was the scam itself. The lesson is where apps come from."),
    opt("Run a cleaner app every week to remove adverts before they build up", false, "Cleaner apps are exactly what the scam pushes. Use the store, and Play Protect."),
    opt("Only download apps from websites that have a padlock in the address bar", false, "A padlock says nothing about the app. Use the store."),
    opt("Turn on Data Saver so adware can never use up her whole monthly data allowance", false, "That hides the symptom. The lesson is not installing from outside the store."),
    opt("Restart her phone every morning to clear any adverts from memory", false, "The app comes back after a restart. Don't install from outside the store.")] },
  note: { must: [["pdf scanner", "scanner"], ["uninstall", "removed"], ["unknown", "sources", "outside the store"], ["play protect", "scan"]],
    tip: "What caused it and how it got on, what you removed, what you turned off, the scan's result, and what you told Farah." },
  adviceStart: "Open Mobile devices: Farah's phone is there. Look at what's on its screen, then at the list of apps.",
  adviceWork: "Farah told you what she installed and where from. Every app's info says where it came from too."
}, ["wiped", "broken", "remove", "source", "scan", "done"]);

/* ---------------- MB6 (run): Mason's mail only arrives when Outlook is open ---------------- */
function mb6(fleet) {
  const p = MB.get(fleet, "MB6"); if (!p) return "none"; const a = PH.app(p, "outlook");
  if (p.dev.wiped) return "wiped";
  if (!a || !a.signedIn) return "broken";
  if (a.battery === "Restricted") return "battery";
  if (!a.bgData || p.dev.net.dataSaver) return "data";
  if (did(p, "test-mail", function (e) { return e.ok; }) < Math.max(did(p, "app-set"), did(p, "net"))) return "test";
  return "done";
}
const MB6 = mobileTicket({
  id: "MB6", title: "Email only turns up when I open Outlook", from: "Mason, Team Lead",
  brief: ["Mason here, with my own phone for once. New email doesn't arrive until I open Outlook, then it all lands at once. I missed a customer's escalation for an hour yesterday.",
    "A week ago I went through the battery settings and told every app I don't use much to save battery. Maybe I overdid it.",
    "Remote help from Mobile devices. And no, I don't want Battery Saver on all day."],
  setup: function (fleet) { const p = phone(fleet, "MB6", "Mason", "mason@rafiki.local"); const a = PH.app(p, "outlook"); a.battery = "Restricted"; a.bgData = false; PH.app(p, "teams").battery = "Restricted"; },
  stage: mb6,
  notReady: function (fleet) { const s = mb6(fleet); return s === "test" ? "Mason: \"Send me a test email and let's see if it arrives.\"" : s === "broken" ? "Mason: \"Outlook wants me to sign in again.\"" : s === "wiped" ? "Mason's phone is at its welcome screen." : "Mason: \"Still nothing until I open Outlook.\""; },
  judge: function (act, p) {
    if (act.op === "saver" && act.on) return { guess: true, say: "Mason said no Battery Saver, and it holds background apps back even more." };
    if (act.op === "data-saver" && act.on) return { guess: true, say: "Data Saver stops apps using data in the background: the opposite of what Outlook needs." };
    if (act.op === "clear-storage" || act.op === "uninstall") return { guess: true, say: "Outlook needs signing in again now, and it wasn't broken: it wasn't allowed to run. Revert to your last snapshot." };
    if (act.op === "app-set" && act.app === "outlook" && ((act.key === "battery" && act.value === "Restricted") || (act.key === "bgData" && !act.value))) return { guess: true, say: "That holds Outlook back even more." };
    if (act.op === "app-set" && act.app !== "outlook") return { guess: true, say: "That isn't the mail app." };
    if (act.op === "clear-cache") return { guess: true, say: "Its files are fine: it isn't allowed to run in the background." };
    if (["airplane", "data", "private-dns", "forget", "reset-network"].indexOf(act.op) >= 0) return { guess: true, say: "The connection works: mail arrives the moment he opens the app." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      wiped: WIPED, broken: ["Is Outlook still signed in?", "Get back to the last point you had right."],
      battery: ["Look at what Outlook is allowed to do when Mason isn't using it, starting with the battery.", "An app that must notice things while you're not looking needs to be allowed to run in the background."],
      data: ["Battery is one half. What else does Outlook need to check for mail in the background?", "Background apps need both: permission to run, and permission to use data."],
      test: ["Has a test email arrived since your change?", "Prove it the way Mason will notice it: mail arriving on its own."],
      done: ["Mail arrives on its own now. Close the ticket.", "The close question is about telling the two kinds of app apart."]
    };
    return H[mb6(fleet)];
  },
  moves: function (fleet) {
    const X = {
      wiped: WIPEMOVES, broken: [opt("Revert to your last snapshot", true), opt("Ask Mason to sign in again", false, "The snapshot is exact."), opt("Reinstall Outlook", false, "The snapshot is exact."), opt("Resolve", false, "Outlook is signed out."), opt("Escalate", false, "The snapshot fixes it."), opt("Send a test email", false, "Fix it first.")],
      battery: [opt("Set Outlook's background battery use to Optimized", true),
        opt("Turn on Battery Saver", false, "He said no, and it holds background apps back more."),
        opt("Clear Outlook's storage and sign in again", false, "Outlook isn't broken: it isn't allowed to run."),
        opt("Change the mail server's port to 993", false, "Mail arrives fine when he opens the app: the server settings are right."),
        opt("Set Teams' background battery use to Unrestricted", false, "Teams isn't the mail app."),
        opt("Turn on Data Saver", false, "That stops background data: worse.")],
      data: [opt("Turn on Outlook's background data", true), opt("Turn on Data Saver", false, "Stops background data altogether."), opt("Set Outlook's battery to Restricted again", false, "Undoes the first half."), opt("Turn on mobile data", false, "It's on; Outlook just isn't allowed to use it in the background."), opt("Clear Outlook's cache", false, "Its files are fine."), opt("Reset network settings", false, "The network is fine.")],
      test: [opt("Send a test email to the phone", true), opt("Resolve: the settings are changed", false, "Prove it first."), opt("Ask Mason to watch for mail", false, "Test it now."), opt("Open Outlook to check", false, "Mail always arrived once it was opened; that proves nothing."), opt("Restart the phone", false, "Not needed."), opt("Change the battery setting to Unrestricted too", false, "Optimized is enough; test it.")],
      done: [opt("Resolve the ticket", true), opt("Set every app to Unrestricted", false, "Only the apps that must work in the background need it."), opt("Turn on Battery Saver", false, "He said no."), opt("Escalate", false, "Fixed at Tier 1."), opt("Clear Outlook's storage", false, "Signs him out."), opt("Factory reset", false, "Nothing to reset.")]
    };
    return X[mb6(fleet)];
  },
  closeWhere: "Think about which of Mason's apps need to work while he isn't looking at them.",
  close: { prompt: "Mason asks which apps he should have left alone. What do you tell him?", options: [
    opt("Apps that must notice things while he isn't using them, like mail and Teams", true),
    opt("Every app from Microsoft, because Microsoft apps share one background service between them", false, "It's about what each app has to do in the background, not who made it."),
    opt("The ones he uses most often, because the phone learns which apps matter from how he uses them", false, "Mail is the point: it must check while he isn't using it, however often he opens it."),
    opt("None of them: battery settings should never be changed on company phones, in any situation", false, "Restricting an app that doesn't need the background is a good fix (Rosa's weather app)."),
    opt("Only apps that came with the phone, because store apps can't run in the background at all", false, "Store apps run in the background when allowed. Outlook is one."),
    opt("The ones using the most battery, because they're the ones doing the most important work", false, "Heavy battery use can be the problem, not importance. Mail and messages need the background.")] },
  note: { must: [["outlook"], ["battery", "restricted", "optimized"], ["background data"], ["test email", "test mail", "arrived"]],
    tip: "Why mail waited, the two settings you changed on Outlook, and how the test email proved it." },
  adviceStart: "Open Mobile devices: Mason's phone is there. His mail arrives when he opens Outlook, so the account works. What happens when he doesn't?",
  adviceWork: "Mail arrives the moment Outlook is opened. So what is Outlook not allowed to do while it's closed?"
}, ["wiped", "broken", "battery", "data", "test", "done"]);

export const MOBILE_TICKETS = [MB1, MB2, MB3, MB4, MB5, MB6];
