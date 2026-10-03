/* =====================================================================
   The Wireless Reliability tickets, from the Wireless Reliability
   Decision Lab: the sim's own job (variant A) plus five (B to F),
   matching its exam view's six practices.

   The sim's keys stand (owner, 30 September 2026: "keep the exam prep"):
   each ticket's band, channel plan and security are its variant's
   answers. What the ticket adds is the real job: devices that drop or
   crawl until the settings fit the building.

   WR1 is Rafiki's own office (owner, 1 October 2026): the breakroom
   microwave sits on the far side of the closet wall from the access
   point. The student walks there (a cutscene), drags it across the room
   on the floor plan, and watches the damage shrink.
   ===================================================================== */
import * as R from "./router.js";
import * as PLAN from "./officeplan.js";
import { routerTicket, healthy } from "./tickets-router.js";

function opt(label, correct, why) { return { label: label, correct: !!correct, why: why || "" }; }
const MODERN = ["WPA3", "WPA2/WPA3", "WPA2"];
/* the sim's channel answers: a fixed channel clear of the neighbours, or
   automatic selection */
function chanOK(r, plan) { const c = r.running.wifi.channel; return plan === "auto" ? c === "auto" : c !== "auto" && !R.interference(r).length && R.channelValid(r.running.wifi.band, c); }
function setRight(c, T, r) { return [c.wifi.band === T.band, T.chan === "auto" ? c.wifi.channel === "auto" : c.wifi.channel !== "auto", MODERN.indexOf(c.wifi.security) >= 0].filter(Boolean).length; }

function wrTicket(o) {
  const T = o.target;
  const t = routerTicket({ id: o.id, base: o.base, title: o.title, sim: "Wireless Reliability Decision Lab", kind: o.web ? "wifi" : "router", home: false,
    from: o.from, site: o.site, brief: o.brief, asks: o.asks,
    router: Object.assign({ site: o.site.split(",")[0], customer: o.from.split(",")[0], neighbours: o.neighbours || [],
      cfg: { admin: { pass: o.web ? "Clos3t-AP-2026" : "Site#Admin-" + o.id + "q" }, wifi: Object.assign({ ssid: o.ssid, pass: "Reliable#Net-2026", width: 20 }, o.start) },
      devices: o.devices.map(function (d) { return Object.assign({ wpa3: true, ssid: o.ssid, knows: "Reliable#Net-2026" }, d); }) }, o.router || {}),
    done: function (r) { return r.running.wifi.band === T.band && chanOK(r, T.chan) && MODERN.indexOf(r.running.wifi.security) >= 0 && healthy(r) && (!o.microwave || R.microwaveFromAP(r) >= 15); },
    score: function (r) { return setRight(r.saved, T, r) + setRight(r.running, T, r) + (chanOK(r, T.chan) ? 1 : 0) + r.devices.filter(function (d) { return R.joins(r, d).ok && !R.slowWhy(r, d); }).length + (o.microwave ? Math.min(3, Math.floor(R.microwaveFromAP(r) / 5)) : 0); },
    notReady: function (r) {
      if (R.pending(r)) return "It's saved, but it's still running its old settings: it hasn't restarted.";
      const bad = r.devices.filter(function (d) { return !R.joins(r, d).ok || R.slowWhy(r, d); });
      if (bad.length) return bad.map(function (d) { return R.joins(r, d).ok ? d.name + " is connected but crawling: " + R.slowWhy(r, d) + "." : R.joins(r, d).why; }).join(" ");
      if (o.microwave && R.microwaveFromAP(r) < 15) return "It's quiet now, but come lunchtime the microwave will be running right next to the access point again.";
      return MODERN.indexOf(r.running.wifi.security) < 0 ? "Everything connects, but the Wi-Fi's security isn't fit for an office. Read the request again." : "Everything connects, but it isn't set up the way the lab's plan for this building calls for. Look again at the band and how the channel is chosen.";
    },
    hints: function () { return o.hints; }, moves: function () { return o.moves; },
    close: o.close, note: o.note, target: T });
  return t;
}
const UNSAVED = opt("Make the changes on the page and close it", false, "Typed but not saved: nothing changes until it's saved and restarted.");
const OPEN = opt("Turn security off to cut the overhead", false, "Security costs almost nothing on modern hardware, and an open network lets anyone in.");

export const WR = [
  wrTicket({ id: "WR1", base: true, web: true, microwave: true, title: "Wi-Fi drops every lunchtime",
    from: "Mason (Team Lead), Rafiki's IT Services", site: "Rafiki's IT Services · access point, network closet", ssid: "MainOffice1",
    brief: ["Mason: the office Wi-Fi drops every day around lunch. Office 3's tablet and the conference room laptop go first. Someone switched the access point to 5 GHz last week to dodge it, and now Office 3 can't hold a signal at any time.",
      "What we know: it's worst at lunchtime; the break counter with the microwave is in the conference room, right against the closet wall; our interior walls are dense; there are only a couple of other networks nearby. Fix it properly. The access point's at 192.168.1.1, admin password Clos3t-AP-2026, and walk round to the break room if you need to see it."],
    target: { band: "2.4", chan: "fixed" },
    start: { band: "5", channel: 36, security: "WPA" },
    neighbours: [{ name: "Next door", ssid: "Harbour-Law", channel: 1 }, { name: "Next door", ssid: "Harbour-Law-Staff", channel: 6 }],
    router: { web: true, plan: true, microwave: Object.assign({}, PLAN.MICROWAVE_START), model: "92 Series AP600" },
    devices: [{ name: "Office 3 tablet", mac: "5C:CF:7F:21:8B:03", pos: { x: 30.2, z: 5.2 }, where: "Office 3" }, { name: "Conference laptop", mac: "3C:22:FB:55:10:7E", pos: { x: 30, z: 25 }, where: "conference and break room" },
      { name: "John's laptop", mac: "28:16:AD:4E:19:C0", pos: { x: 5, z: 5 }, where: "Office 1" }, { name: "Reception PC", mac: "B4:2E:99:0C:61:5F", pos: { x: 6, z: 25 }, where: "reception" }],
    hints: ["Mason's message has four clues: the time of day, what's on the other side of the closet wall, the walls, and the neighbours. Which band does each one point to, and what in the office changes at lunchtime?", "A microwave cooks at 2.45 GHz: running near an access point it drowns 2.4 GHz. Dense walls stop 5 GHz. Keep the band that gets through walls, take away the noise at its source, and give the access point a clear fixed channel and modern security."],
    moves: [opt("Move the microwave across the break room, then set 2.4 GHz, a clear fixed channel and WPA3, Save and restart", true),
      opt("Leave it on 5 GHz: microwaves don't affect 5 GHz", false, "True, but 5 GHz can't get through these dense walls: Office 3 drops all day."),
      opt("Move the microwave, and leave the channel on automatic", false, "The lab's plan for this building is a fixed channel clear of the neighbours: 1 and 6 are taken."),
      opt("Switch to dual-band and let the access point steer", false, "Near the closet it would still hand devices 2.4 GHz with the microwave beside it, and the far rooms still can't hold 5 GHz."),
      OPEN, UNSAVED],
    close: { prompt: "Why move the microwave rather than switch the access point to 5 GHz?", options: [
      opt("5 GHz can't get through these dense walls; moving the microwave removes the 2.4 GHz noise at its source", true),
      opt("Microwaves block 5 GHz as well as 2.4 GHz, so switching wouldn't help", false, "They don't: a microwave cooks at 2.45 GHz. 5 GHz was ruled out by the walls."),
      opt("5 GHz is only for outdoor access points", false, "5 GHz is used indoors all the time. Here the dense walls stop it."),
      opt("Moving it a few inches along the same counter is enough to stop the interference, so it never needs to leave the corner", false, "It has to go well away from the access point: across the room shrinks the damage to a patch around it."),
      opt("The microwave was using the same channel as the access point", false, "Microwaves don't use channels: they flood the whole 2.4 GHz band when running."),
      opt("WPA3 doesn't work while a microwave is running nearby", false, "Security isn't affected by the microwave; the signal is.")] },
    note: { must: [["microwave"], ["2.4"], ["channel", "ch "], ["wpa3", "wpa2", "security"]], tip: "say what was interfering, what you moved, and the band, channel and security you set." } }),

  wrTicket({ id: "WR2", title: "Slow Wi-Fi all day in an open-plan studio",
    from: "Imani Clarke, Bright Path Design", site: "Bright Path Design, 12 Foundry Yard", ssid: "BrightPath",
    brief: ["Imani at Bright Path Design. Our Wi-Fi is slow all day, every day, not just at busy times. We're one big open room, about twenty of us, and everyone's within thirty feet of the router. Shared with you in the 92 Series app.",
      "My laptop shows a long list of other networks around us. Can you make it reliable? We don't need maximum speed, just reliability."],
    target: { band: "5", chan: "fixed" }, start: { band: "2.4", channel: 6, security: "WPA2" },
    neighbours: [1, 1, 3, 6, 6, 6, 8, 11, 11, 11].map(function (c, i) { return { name: "Nearby", ssid: ["Foundry-" + (i + 1), "Studio42", "Atelier", "CoWork-A", "CoWork-B", "Yard-Guest", "Printshop", "Loft-5", "BakeryWiFi", "Gallery"][i], channel: c }; }),
    devices: [{ name: "Imani's laptop", mac: "A0:CE:C8:20:11:01" }, { name: "Design desk 4", mac: "A0:CE:C8:20:11:02" }, { name: "Meeting screen", mac: "A0:CE:C8:20:11:03" }],
    hints: ["Read the router's Wi-Fi scan on Status. What's the room like, and what's around it?", "When many networks share 2.4 GHz's three clear channels, every one of them takes turns. The higher band has many more channels; in one open room its shorter reach doesn't matter."],
    moves: [opt("Switch to 5 GHz on a fixed channel, keep modern security, Save and restart", true), opt("Stay on 2.4 GHz and pick channel 1", false, "Three networks nearby are already on 1, and the rest overlap it."), opt("Widen the channel to 40 MHz for more speed", false, "Wider takes more room and overlaps even more neighbours."), opt("Switch to dual-band and let it steer", false, "In one open room near the router there's nothing for 2.4 GHz to do but add to the crowd. The lab's plan is 5 GHz."), OPEN, UNSAVED],
    close: { prompt: "What decided 5 GHz here?", options: [opt("Many networks crowd 2.4 GHz's three clear channels; 5 GHz has many more, and the room needs no reach", true), opt("5 GHz reaches further than 2.4 GHz does, so it covers a big open studio from corner to corner more easily", false, "It reaches less far. Everyone's within thirty feet, so reach doesn't matter."), opt("2.4 GHz can't carry more than ten devices", false, "There's no fixed limit; it's the neighbours crowding its three channels."), opt("5 GHz is more secure than 2.4 GHz", false, "Security is the same on both bands."), opt("The studio's laptops only have 5 GHz radios", false, "They have both. The neighbours decided it."), opt("5 GHz isn't affected by walls at all", false, "It's affected more. Here there are no walls to matter.")] },
    note: { must: [["5 ghz", "5ghz"], ["congest", "networks", "neighbour", "neighbor"], ["channel"]], tip: "say what the scan showed, and the band and channel you set." } }),

  wrTicket({ id: "WR3", title: "Coverage down a long hallway",
    from: "Owen Park, Long Hall Studios", site: "Long Hall Studios, 7 Station Approach", ssid: "LongHall",
    brief: ["Owen at Long Hall Studios. We're one long building down a single hallway. The edit suite at the far end keeps losing Wi-Fi, but the screening room by the router needs fast Wi-Fi for its projector. It's in the app.",
      "There aren't many devices, nothing else electronic near the work areas, and no other networks around us. It happens at any time of day."],
    target: { band: "dual", chan: "auto" }, start: { band: "5", channel: 36, security: "WPA" },
    devices: [{ name: "Edit suite PC", mac: "D4:5D:64:33:01:AA", far: true, where: "far end of the hallway" }, { name: "Screening room projector", mac: "D4:5D:64:33:01:AB", needs5: true, where: "next to the router" }, { name: "Owen's laptop", mac: "D4:5D:64:33:01:AC", where: "middle of the hallway" }],
    hints: ["Two devices tell you two different things: one is far away, one is close and needs speed. What else does Owen say about the building?", "The lower band reaches furthest; the higher band is fastest close by. When a building needs both, one network can offer both and steer each device to the better one. With nothing nearby to plan around, the access point can choose its own channel."],
    moves: [opt("Switch to dual-band with steering, leave the channel on automatic, use modern security, Save and restart", true), opt("Switch to 2.4 GHz for range", false, "The edit suite would connect, but the projector would crawl."), opt("Stay on 5 GHz and move the router to the middle", false, "Moving the router isn't the lab's plan, and 5 GHz still won't reach both ends."), opt("Use dual-band with a fixed channel 1", false, "With nothing nearby to avoid, the lab's plan leaves the channel automatic."), OPEN, UNSAVED],
    close: { prompt: "Why dual-band with client steering here?", options: [opt("The far end needs 2.4 GHz's reach and the projector needs 5 GHz's speed: steering gives each the band it needs", true), opt("Dual-band doubles the speed for every device", false, "Each device still uses one band at a time; steering just picks the better one."), opt("2.4 GHz can't reach the screening room", false, "It can; it just can't give the projector the speed it needs."), opt("Dual-band hides the network from neighbours", false, "There are no neighbours, and it doesn't hide anything."), opt("5 GHz alone would cover the whole hallway if the channel were fixed rather than left to the access point to choose", false, "Fixing the channel doesn't change how far 5 GHz reaches."), opt("Steering stops devices from roaming between rooms", false, "Steering chooses a band; it doesn't stop roaming.")] },
    note: { must: [["dual"], ["steer"], ["auto"], ["far", "hallway", "edit"]], tip: "say what each end needed and what you set." } }),

  wrTicket({ id: "WR4", title: "Fourteen networks and a slow office",
    from: "Grace Wu, Wu & Partners", site: "Wu & Partners, 30 Market Square", ssid: "WuPartners",
    brief: ["Grace at Wu & Partners. The Wi-Fi is bad all day. A Wi-Fi analyzer app showed fourteen networks on channels 1 to 11. We're one large open room and everyone sits within thirty feet of the access point. It's in the app."],
    target: { band: "5", chan: "fixed" }, start: { band: "2.4", channel: 3, security: "WPA2" },
    neighbours: [1, 1, 2, 3, 4, 6, 6, 7, 8, 9, 11, 11, 11, 10].map(function (c, i) { return { name: "Nearby", ssid: "Market-" + (i + 1), channel: c }; }),
    devices: [{ name: "Grace's laptop", mac: "B8:27:EB:70:10:01" }, { name: "Partner desk 2", mac: "B8:27:EB:70:10:02" }, { name: "Scanner", mac: "B8:27:EB:70:10:03" }],
    hints: ["The Wi-Fi scan on Status shows what Grace's app showed. Is there any clear channel left on 2.4 GHz?", "When every 2.4 GHz channel is taken, no channel choice fixes it. Move to the band with room, and in one open room its shorter reach doesn't matter."],
    moves: [opt("Switch to 5 GHz on a fixed channel, keep modern security, Save and restart", true), opt("Stay on 2.4 GHz and switch to channel 6", false, "Three networks are on 6 and more overlap it. No channel on 2.4 GHz is clear here."), opt("Leave 2.4 GHz on automatic channel selection", false, "Automatic still has to pick one of the same crowded channels."), opt("Turn up to 40 MHz to push through", false, "Wider overlaps even more of them."), OPEN, UNSAVED],
    close: { prompt: "Why not stay on 2.4 GHz and pick the clearest channel?", options: [opt("With fourteen networks across channels 1 to 11, there's no clear channel left on 2.4 GHz", true), opt("2.4 GHz is too slow for an office of any size", false, "It's fine in many offices. Here it's crowded."), opt("Channels on 2.4 GHz can't be chosen by hand", false, "They can. None is clear here."), opt("5 GHz has a stronger signal through walls", false, "It's weaker through walls. There are none in this room."), opt("The neighbours' networks will move off 2.4 GHz soon", false, "Nothing suggests that, and you can't rely on it."), opt("2.4 GHz doesn't support WPA3", false, "It does.")] },
    note: { must: [["5 ghz", "5ghz"], ["14", "fourteen", "networks"], ["channel"]], tip: "say what the scan showed and what you set." } }),

  wrTicket({ id: "WR5", title: "The warehouse office's far end keeps dropping",
    from: "Ray Doyle, Doyle Logistics", site: "Doyle Logistics warehouse office, Unit 4 Dock Road", ssid: "DoyleWH",
    brief: ["Ray at Doyle Logistics. Our warehouse office has concrete block walls. The goods-in scanner at the far end keeps dropping, any time of day. Only two other networks show up nearby. It's shared in the app.",
      "Someone set the router to 5 GHz because it's \"faster\"."],
    target: { band: "2.4", chan: "fixed" }, start: { band: "5", channel: 36, security: "Open" },
    neighbours: [{ name: "Nearby", ssid: "Unit3-Office", channel: 1 }, { name: "Nearby", ssid: "Unit5-Guest", channel: 11 }],
    devices: [{ name: "Goods-in scanner", mac: "00:17:A4:3F:21:09", walls: 3, where: "far end, through three concrete walls" }, { name: "Ray's laptop", mac: "00:17:A4:3F:21:0A", where: "the office" }],
    hints: ["What's between the router and the scanner, and how many other networks are there?", "Dense walls stop the higher band; the lower band gets through. With only a couple of neighbours, a fixed channel clear of them is the plan. And an office network is never left open."],
    moves: [opt("Switch to 2.4 GHz on a channel clear of the two neighbours, turn on modern security, Save and restart", true), opt("Stay on 5 GHz and raise the width for more power", false, "Width doesn't change how far it reaches; the concrete still stops it."), opt("Switch to 2.4 GHz on channel 1", false, "Unit 3 is already on 1."), opt("Switch to 2.4 GHz and leave it open so the scanner joins easily", false, "An open office network lets anyone in."), opt("Use dual-band with steering", false, "The lab's plan for concrete and few neighbours is 2.4 GHz on a fixed clear channel."), UNSAVED],
    close: { prompt: "Why 2.4 GHz for the warehouse office?", options: [opt("Concrete walls stop 5 GHz; 2.4 GHz gets through to the far end", true), opt("2.4 GHz is faster than 5 GHz", false, "It's slower. It was chosen for reach through concrete."), opt("Scanners only work on 2.4 GHz", false, "This one has both. The walls decided it."), opt("There are too many networks for 5 GHz", false, "There are only two, both on 2.4 GHz."), opt("2.4 GHz is more secure", false, "Security is the same on both bands."), opt("5 GHz isn't allowed in warehouses", false, "There's no such rule.")] },
    note: { must: [["2.4"], ["concrete", "wall"], ["channel"], ["wpa"]], tip: "say why the band, which channel, and the security." } }),

  wrTicket({ id: "WR6", title: "Clinic corridor: the far rooms lose signal",
    from: "Dr. Amara Nwosu, Riverside Clinic", site: "Riverside Clinic, 2 River Walk", ssid: "RiversideClinic",
    brief: ["Dr. Nwosu at Riverside Clinic. We're a long, narrow corridor with rooms on both sides. The far treatment rooms lose Wi-Fi, but the imaging tablet by the front desk needs fast Wi-Fi to load scans. It's in the app.",
      "There are only a few devices, and no other networks nearby."],
    target: { band: "dual", chan: "auto" }, start: { band: "2.4", channel: 1, security: "WPA" },
    devices: [{ name: "Treatment room 6 tablet", mac: "E8:6F:38:12:40:01", far: true, where: "the far end of the corridor" }, { name: "Imaging tablet", mac: "E8:6F:38:12:40:02", needs5: true, where: "the front desk" }, { name: "Reception PC", mac: "E8:6F:38:12:40:03", where: "the front desk" }],
    hints: ["One device is far away, one is close and needs speed, and there's nothing nearby. What does each need?", "When a building needs both reach and speed, one network can offer both bands and steer each device to the better one. With nothing nearby to avoid, the access point can choose its own channel."],
    moves: [opt("Switch to dual-band with steering, set the channel to automatic, use modern security, Save and restart", true), opt("Stay on 2.4 GHz, it reaches the far rooms", false, "It does, but the imaging tablet crawls on it."), opt("Switch to 5 GHz for the imaging tablet", false, "The far treatment rooms would lose it."), opt("Dual-band, but keep the channel fixed on 1", false, "With no networks nearby, the lab's plan leaves the channel automatic."), OPEN, UNSAVED],
    close: { prompt: "Why automatic channel selection here?", options: [opt("With no other networks nearby there's nothing to plan around, so the access point can choose and adapt", true), opt("Automatic channels have a stronger signal", false, "Channel choice doesn't change signal strength."), opt("Fixed channels don't work with dual-band", false, "They do; there's just no need here."), opt("Automatic selection reaches the far treatment rooms better, because the access point boosts power on the channel it picks", false, "Reach comes from the band, not the channel."), opt("Medical devices require automatic channels", false, "There's no such rule."), opt("Channel 1 is reserved for clinics", false, "No channel is reserved.")] },
    note: { must: [["dual"], ["auto"], ["far", "corridor"], ["imaging", "tablet", "speed"]], tip: "say what each end needed and what you set." } })
];
