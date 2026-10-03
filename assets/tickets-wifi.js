/* =====================================================================
   The WiFi Access Point tickets: Rafiki's own access point in the
   network closet, reached in the laptop's browser at 192.168.1.1 (the
   web admin), from the WiFi Access Point Configuration sim: the sim's
   own job plus five, matching its exam view's six practices.

   The settings are the sim's keys. Whether each device in the office
   really connects is worked out from the RUNNING settings and where the
   device is (router.js): 5 GHz doesn't get through two thick walls, a
   WPA2-only printer can't join WPA3 alone, a meeting's 25 laptops crawl
   on 2.4 GHz.
   ===================================================================== */
import * as R from "./router.js";
import { routerTicket, intact } from "./tickets-router.js";

function opt(label, correct, why) { return { label: label, correct: !!correct, why: why || "" }; }
export const AP_ADMIN = "Clos3t-AP-2026";
const BAND_NAME = { "2.4": "2.4 GHz", "5": "5 GHz", "dual": "dual-band" };
const SEC_NAME = { "WPA3": "WPA3", "WPA2/WPA3": "WPA2/WPA3 transition", "WPA2": "WPA2" };
function matches(c, T) { return c.wifi.ssid === T.ssid && c.wifi.pass === T.pass && c.wifi.security === T.sec && c.wifi.band === T.band && String(c.wifi.channel) === String(T.chan); }
function fieldsRight(c, T) { return [c.wifi.ssid === T.ssid, c.wifi.pass === T.pass, c.wifi.security === T.sec, c.wifi.band === T.band, String(c.wifi.channel) === String(T.chan)].filter(Boolean).length; }

function wifiTicket(o) {
  const T = o.target;
  const devs = o.devices.map(function (d) { return Object.assign({ ssid: T.ssid, knows: T.pass, wpa3: true, bands: ["2.4", "5"] }, d); });
  return routerTicket({ id: o.id, base: o.base, title: o.title, sim: "WiFi Access Point Configuration", kind: "wifi",
    from: o.from || "Mason (Team Lead), Rafiki's IT Services", site: "Rafiki's IT Services · " + (o.ap || "access point, network closet"),
    brief: o.brief,
    router: { web: true, site: o.ap ? "Rafiki's IT Services · " + o.ap : "Rafiki's IT Services · network closet", customer: "Rafiki's IT Services", model: "92 Series AP600",
      cfg: Object.assign({ admin: { pass: o.reset ? "admin" : AP_ADMIN } }, { wifi: o.start }), devices: devs, neighbours: o.neighbours || [], crowd: o.crowd || 0 },
    done: function (r) { return matches(r.running, T) && intact(r) && !R.crowded(r); },
    score: function (r) { return fieldsRight(r.saved, T) + fieldsRight(r.running, T) + r.devices.filter(function (d) { return R.joins(r, d).ok; }).length; },
    /* What Mason would see, never which setting is wrong: that's the
       hint ladder's job. */
    notReady: function (r) {
      if (R.pending(r)) return "It's saved, but the access point is still running its old settings: it hasn't restarted.";
      if (R.crowded(r)) return "The meeting's laptops all connect, but it crawls: " + r.crowd + " of them sharing one band.";
      const off = r.devices.filter(function (d) { return !R.joins(r, d).ok; });
      if (off.length) return off.map(function (d) { return R.joins(r, d).why; }).join(" ");
      return matches(r.running, T) ? null : "Everything connects, but it isn't set up the way Mason asked. Read his message again.";
    },
    hints: function () { return o.hints; }, moves: function () { return o.moves; },
    close: o.close, note: o.note, target: T });
}

const OFFICE = [
  { name: "Office 3 tablet", mac: "5C:CF:7F:21:8B:03", walls: 2, where: "Office 3, two thick walls from the closet" },
  { name: "John's laptop", mac: "28:16:AD:4E:19:C0", walls: 1, where: "Office 1, one wall from the closet" }
];
const START = { ssid: "92Series-AP", pass: "92series1234", security: "WPA2", band: "5", channel: 36, width: 20 };
function setMoves(T, wrongs) { return [opt("Set " + T.ssid + ", its password, " + SEC_NAME[T.sec] + ", " + BAND_NAME[T.band] + " and channel " + T.chan + " on Wireless, Save, then restart", true)].concat(wrongs); }
const UNSAVED = opt("Type the settings on the Wireless page and close the browser", false, "Typed but not saved: the access point keeps running its old settings, and the next restart throws them away.");
const RESET = opt("Factory reset the access point first, then set it up", false, "A reset changes nothing here except wiping its admin password back to the sticker's. You still have to set the same things.");

export const WIFI = [
  wifiTicket({ id: "W1", base: true, title: "Configure the office access point",
    brief: ["Mason: I need you to configure our access point with the right settings. It's in the closet; open it in your browser at 192.168.1.1. Its admin password is in the closet binder: Clos3t-AP-2026.",
      "The SSID should be MainOffice1, the password should be changed to Ma50n1SB35t!, and it should operate on channel 6. Select the best security type: every device we have supports the latest. This building has thick walls and does not receive signal well, so select the best frequency for that. The Office 3 tablet is the one that always struggles."],
    target: { ssid: "MainOffice1", pass: "Ma50n1SB35t!", sec: "WPA3", band: "2.4", chan: 6 }, start: START, devices: OFFICE,
    hints: ["Mason's message gives you the name, password and channel exactly. For the other two, read what he says about the devices and about the building.", "Use the strongest security every device supports. The lower band reaches further and gets through walls; the higher band is faster but stopped by them."],
    moves: setMoves({ ssid: "MainOffice1", sec: "WPA3", band: "2.4", chan: 6 }, [
      opt("Set them all as Mason asked, but on 5 GHz for speed", false, "5 GHz is stopped by thick walls: the Office 3 tablet would lose the network."),
      opt("Set them all as Mason asked, but with WPA2 for compatibility", false, "Every device supports WPA3, and Mason asked for the best security."),
      opt("Set them all, with dual-band so the access point chooses", false, "Mason asked you to pick the best band for thick walls. That's a decision, not a default."),
      UNSAVED, RESET]),
    close: { prompt: "Why 2.4 GHz for this building?", options: [
      opt("It reaches further and gets through thick walls better than 5 GHz does", true),
      opt("It's faster than 5 GHz, so the tablet gets a quicker connection", false, "5 GHz is the faster one. 2.4 GHz was chosen for reach through the walls."),
      opt("It has more channels that don't overlap than 5 GHz has", false, "It has fewer: only 1, 6 and 11. 5 GHz has many more."),
      opt("WPA3 only works on the 2.4 GHz band, so it had to match the security", false, "WPA3 works on every band."),
      opt("5 GHz is meant for outdoor access points, not offices", false, "5 GHz is used indoors all the time. It just doesn't get through thick walls."),
      opt("The tablet is too old to use 5 GHz at all", false, "Nothing said the tablet lacks 5 GHz. It lost signal through the walls.")] },
    note: { must: [["mainoffice1"], ["wpa3"], ["2.4"], ["channel 6", "ch 6", "channel six"]], tip: "say what you set, and why that band and that security." } }),

  wifiTicket({ id: "W2", title: "Staff network for the Office 3 tablet",
    brief: ["Mason: set up the access point for staff. SSID Rafiki-Staff, password T3amR@fiki2026. Every device is new and supports the latest security. The admin password is Clos3t-AP-2026, at 192.168.1.1 as usual.",
      "Office 3's tablet keeps losing signal through two thick brick walls. Use channel 11: the office next door is on 1 and 6."],
    target: { ssid: "Rafiki-Staff", pass: "T3amR@fiki2026", sec: "WPA3", band: "2.4", chan: 11 }, start: START, devices: OFFICE,
    neighbours: [{ name: "Next door", ssid: "Harbour-Law-Guest", channel: 1 }, { name: "Next door", ssid: "Harbour-Law", channel: 6 }],
    hints: ["The name, password and channel are in Mason's message. The tablet's problem is in there too.", "Pick the strongest security every device supports, and the band that gets through walls."],
    moves: setMoves({ ssid: "Rafiki-Staff", sec: "WPA3", band: "2.4", chan: 11 }, [
      opt("Set them as asked, but on channel 6", false, "The office next door is on 6: you'd share its airtime."),
      opt("Set them as asked, but on 5 GHz", false, "Two thick brick walls: 5 GHz won't reach the tablet."),
      opt("Set them as asked, but on channel 10 to sit between the neighbours", false, "10 overlaps 6 and 11. Only 1, 6 and 11 don't overlap."),
      UNSAVED, RESET]),
    close: { prompt: "Why channel 11?", options: [
      opt("Of the three that don't overlap, it's the one the neighbours aren't on", true),
      opt("Higher channel numbers carry a stronger signal through walls", false, "Channel numbers don't change strength. 2.4 GHz is what gets through the walls."),
      opt("Channel 11 is the only channel WPA3 is allowed to use", false, "WPA3 works on any channel."),
      opt("Channel 10 would avoid the neighbours just as well, so either would do", false, "10 overlaps both 6 and 11. Only 1, 6 and 11 are clear of each other."),
      opt("Sharing a neighbour's channel would split the airtime evenly and fairly", false, "Sharing a channel means taking turns with every device on it: it slows both networks."),
      opt("Channel 11 is set aside for business networks", false, "No channel is set aside for businesses.")] },
    note: { must: [["rafiki-staff"], ["wpa3"], ["2.4"], ["channel 11", "ch 11", "channel eleven"]], tip: "say what you set, and why that channel and that band." } }),

  wifiTicket({ id: "W3", title: "Conference room access point for 25 laptops", ap: "conference room access point",
    brief: ["Mason: a second access point goes in the conference room: one open room, no walls, up to 25 laptops in a meeting. It's at 192.168.1.1 when you're on its cable; admin password Clos3t-AP-2026.",
      "SSID Conference-5G, password M33t1ng$Room!. Every device supports the latest security. Pick the band that handles many devices close by. Channel 36."],
    target: { ssid: "Conference-5G", pass: "M33t1ng$Room!", sec: "WPA3", band: "5", chan: 36 }, start: Object.assign({}, START, { band: "2.4", channel: 1 }), crowd: 25,
    devices: [{ name: "Meeting laptops (25)", mac: "Many", walls: 0, where: "the conference room itself" }],
    hints: ["Mason tells you about the room and how many devices. Which matters here: reach, or room for many devices?", "The higher band has many more channels that don't overlap and more speed, and an open room has no walls to stop it."],
    moves: setMoves({ ssid: "Conference-5G", sec: "WPA3", band: "5", chan: 36 }, [
      opt("Set them as asked, but on 2.4 GHz for range", false, "Range isn't the problem in one open room. 25 laptops would crawl on 2.4 GHz's three channels."),
      opt("Set them as asked, but with WPA2", false, "Every device supports WPA3, and it's the strongest."),
      opt("Set them as asked, but at 80 MHz on channel 1", false, "Channel 1 is a 2.4 GHz channel; 80 MHz doesn't exist there."),
      UNSAVED, RESET]),
    close: { prompt: "Why 5 GHz for the conference room?", options: [
      opt("It has many more clear channels and more speed, and one open room has no walls to block it", true),
      opt("It reaches further than 2.4 GHz does", false, "It reaches less far. Here, reach doesn't matter: it's one open room."),
      opt("Laptops can only use WPA3 on 5 GHz", false, "WPA3 works on both bands."),
      opt("2.4 GHz can't be used by more than ten devices at once", false, "There's no fixed limit. It just has only three clear channels, so many devices slow it down."),
      opt("Channel 36 is the strongest channel there is", false, "It's one of 5 GHz's channels. The band was chosen for capacity."),
      opt("5 GHz gets through walls better than 2.4 GHz", false, "The opposite. There are no walls in the room, so it doesn't matter.")] },
    note: { must: [["conference-5g"], ["5 ghz", "5ghz"], ["channel 36", "ch 36"], ["laptops", "devices", "capacity"]], tip: "say what you set, and why that band for this room." } }),

  wifiTicket({ id: "W4", title: "The Office 2 label printer can't join",
    brief: ["Mason: same access point as before: SSID MainOffice1, password Ma50n1SB35t!, channel 6, thick walls. Admin password Clos3t-AP-2026 at 192.168.1.1.",
      "This time the label printer in Office 2 is old and only supports WPA2. Everything else supports WPA3. Pick the security that lets every device connect as securely as it can."],
    target: { ssid: "MainOffice1", pass: "Ma50n1SB35t!", sec: "WPA2/WPA3", band: "2.4", chan: 6 }, start: Object.assign({}, START, { ssid: "MainOffice1", pass: "Ma50n1SB35t!", security: "WPA3", band: "2.4", channel: 6 }),
    devices: OFFICE.concat([{ name: "Label printer", mac: "00:80:92:4B:7A:11", walls: 1, wpa3: false, bands: ["2.4"], where: "Office 2" }]),
    hints: ["Read the Status page: which device can't get on, and what does it say about why?", "When one old device can't use the newest security, there's a mode that lets old and new devices on together, each as securely as it can."],
    moves: setMoves({ ssid: "MainOffice1", sec: "WPA2/WPA3", band: "2.4", chan: 6 }, [
      opt("Switch the security to WPA2 for everyone", false, "The printer joins, but every newer device loses WPA3 for no reason."),
      opt("Leave WPA3 and tell Office 2 the printer can't be used", false, "It can, safely, with transition mode. Don't leave it broken."),
      opt("Switch to Open so the printer can join", false, "Anyone nearby could join and read the traffic."),
      UNSAVED, RESET]),
    close: { prompt: "Why WPA2/WPA3 transition mode?", options: [
      opt("The printer only supports WPA2; transition lets it join while newer devices use WPA3", true),
      opt("Transition mode is stronger than WPA3 on its own", false, "It's only as strong as WPA2 for WPA2 devices. It's for compatibility, used only when needed."),
      opt("WPA3 doesn't work on 2.4 GHz, so transition was the only choice", false, "WPA3 works on 2.4 GHz. The printer is what can't use it."),
      opt("The printer's password was too long for WPA3", false, "Password length isn't the issue. The printer doesn't support WPA3 at all."),
      opt("Transition mode makes the signal reach Office 2 better", false, "Security mode doesn't change reach."),
      opt("Every device has to be set to the same security as the oldest one", false, "That's what WPA2 alone would do. Transition lets each use the best it can.")] },
    note: { must: [["printer"], ["wpa2"], ["wpa3"], ["transition", "mixed", "wpa2/wpa3"]], tip: "say which device couldn't join, why, and what you set." } }),

  wifiTicket({ id: "W5", title: "Guest Wi-Fi for visitors in reception", ap: "guest access point, reception side",
    brief: ["Mason: add a guest network for visitors in reception. SSID Rafiki-Guest, password W3lc0me-Guest!. Visitors' phones and laptops are recent, so use the best security. Admin password Clos3t-AP-2026 at 192.168.1.1.",
      "Reception is two thick walls from the network closet. Put it on channel 1."],
    target: { ssid: "Rafiki-Guest", pass: "W3lc0me-Guest!", sec: "WPA3", band: "2.4", chan: 1 }, start: START,
    devices: [{ name: "A visitor's phone", mac: "9C:B6:D0:3E:72:5A", walls: 2, where: "reception, two thick walls from the closet" }],
    hints: ["Where are the guests, and what's between them and the closet?", "The band that gets through walls is the one for a room that far away; the security is the strongest the visitors' devices support."],
    moves: setMoves({ ssid: "Rafiki-Guest", sec: "WPA3", band: "2.4", chan: 1 }, [
      opt("Set them as asked, but on 5 GHz", false, "Two thick walls: 5 GHz won't reach reception."),
      opt("Set them as asked, but Open, so guests needn't type a password", false, "Anyone in range could join and read the traffic. Mason gave a password."),
      opt("Set them as asked, but on channel 3", false, "3 overlaps 1 and 6. Mason asked for 1."),
      UNSAVED, RESET]),
    close: { prompt: "What decided the band for the guest network?", options: [
      opt("Reception is two thick walls away, and 2.4 GHz gets through walls", true),
      opt("Guests' phones only have 2.4 GHz", false, "Mason said they're recent: they have both bands."),
      opt("Guest networks are only allowed on 2.4 GHz", false, "No rule says so."),
      opt("2.4 GHz keeps guests separate from staff", false, "Separation comes from the separate network, not the band."),
      opt("Channel 1 only exists on 5 GHz", false, "Channel 1 is a 2.4 GHz channel."),
      opt("2.4 GHz is faster for video calls", false, "5 GHz is faster. 2.4 GHz is the one that reaches reception.")] },
    note: { must: [["rafiki-guest", "guest"], ["wpa3"], ["2.4"], ["channel 1", "ch 1", "channel one"]], tip: "say what you set, and why that band." } }),

  wifiTicket({ id: "W6", title: "Access point lost its settings after a reset", reset: true,
    brief: ["Mason: the access point needs its settings back after someone factory reset it. It's back to the sticker: admin password admin, at 192.168.1.1. SSID MainOffice1, password Ma50n1SB35t!, best security (everything supports it), and the walls are thick.",
      "The office next door is on two channels. Read the access point's own Wi-Fi scan and choose the one that doesn't overlap either of them."],
    target: { ssid: "MainOffice1", pass: "Ma50n1SB35t!", sec: "WPA3", band: "2.4", chan: 11 }, start: START, devices: OFFICE,
    neighbours: [{ name: "Next door", ssid: "Harbour-Law", channel: 1 }, { name: "Next door", ssid: "Harbour-Law-Staff", channel: 6 }],
    hints: ["The access point's Status page has a Wi-Fi scan. Which channels are already taken?", "On 2.4 GHz only channels 1, 6 and 11 don't overlap. Pick the one nobody nearby is using."],
    moves: setMoves({ ssid: "MainOffice1", sec: "WPA3", band: "2.4", chan: 11 }, [
      opt("Set them as asked, on channel 6 like before", false, "The scan shows next door on 6 now."),
      opt("Set them as asked, on channel 9, away from both", false, "9 overlaps both 6 and 11's neighbours' range. Only 1, 6 and 11 don't overlap."),
      opt("Set them as asked, on automatic channel selection", false, "Mason asked you to read the scan and choose the clear one."),
      UNSAVED, RESET]),
    close: { prompt: "How did you choose the channel?", options: [
      opt("The scan showed next door on 1 and 6, so 11 is the only clear one left", true),
      opt("11 is the highest channel, so it's always the quietest", false, "It's clear here because the scan shows nobody on it, not because it's highest."),
      opt("It was the channel the access point used before the reset", false, "It used 6 before, and next door is on 6 now."),
      opt("Channel 11 is the only one that works with WPA3", false, "WPA3 works on any channel."),
      opt("The factory reset set it to 11 automatically", false, "The reset put it back on the sticker settings."),
      opt("Any channel at least two away from a neighbour avoids overlap", false, "On 2.4 GHz channels need five apart: only 1, 6 and 11 clear each other.")] },
    note: { must: [["mainoffice1"], ["wpa3"], ["scan", "neighbour", "next door"], ["channel 11", "ch 11", "channel eleven"]], tip: "say what you set, and how the scan decided the channel." } })
];
