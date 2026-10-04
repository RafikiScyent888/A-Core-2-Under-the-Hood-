/* =====================================================================
   The Neighboring Routers tickets: Router 3, in a street of three
   houses, from the Neighboring Routers Configuration sim: the sim's own
   job plus five, matching its exam view's six practices.

   The customer's router is shared in the 92 Series app. Its Status page
   has the Wi-Fi scan, which shows Router 1 and Router 2 next door with
   their channels. Whether the router still clashes with a neighbour is
   worked out from its RUNNING channel and width (router.js: only 1, 6
   and 11 clear each other at 20 MHz; our 40 MHz takes twice the room),
   and whether each device can join from the MAC allowed list.

   Neighbours are listed at the widths the exam view shows (Router 2 at
   40 MHz, the owner's ruling of 1 October 2026).
   ===================================================================== */
import * as R from "./router.js";
import { routerTicket } from "./tickets-router.js";

function opt(label, correct, why) { return { label: label, correct: !!correct, why: why || "" }; }
function neighbours(a, b) { return [{ name: "Router 1", ssid: "HomeNetwork", channel: a[0], width: a[1], security: "WPA2" }, { name: "Router 2", ssid: "WorkNetwork", channel: b[0], width: b[1], security: "WPA3" }]; }
function cfgRight(c, T) { return [c.wifi.ssid === T.ssid, c.wifi.pass === T.pass, c.wifi.security === "WPA3", Number(c.wifi.width) === 20, !!c.wifi.mac === T.mac, String(c.wifi.channel) === String(T.chan)].filter(Boolean).length; }

function nrTicket(o) {
  const T = o.target, fam = o.family.map(function (d, i) { return { name: d, mac: ["3C:22:FB:", "F0:99:B6:", "7C:1C:68:", "A4:83:E7:"][i % 4] + (10 + i) + ":4A:0" + i, wpa3: true, ssid: T.ssid, knows: T.pass, approved: true }; });
  const others = (o.others || []).map(function (d, i) { return Object.assign({ mac: "9E:4F:1B:" + (60 + i) + ":2C:7" + i, wpa3: true, ssid: T.ssid, knows: T.pass }, d); });
  const devs = fam.concat(others);
  const t = routerTicket({ id: o.id, base: o.base, title: o.title, sim: "Neighboring Routers Configuration", home: true,
    from: o.from, site: o.site, brief: o.brief,
    router: { site: o.site.split(",")[0] + " (Router 3)", customer: o.from.split(",")[0], neighbours: neighbours(o.n1, o.n2),
      cfg: { admin: { pass: "House#Three-" + o.id + "z" }, wifi: { ssid: "92Series-3C7A", pass: "92series1234", security: "WPA2", band: "2.4", channel: 6, width: 40, mac: false } }, devices: devs },
    /* done: the sim's settings, no clash with either neighbour, and the
       right devices on: every approved one, and (with filtering) nobody
       else */
    done: function (r) { return cfgRight(r.running, T) === 6 && !R.interference(r).length && r.devices.every(function (d) { return R.joins(r, d).ok === (d.approved || !T.mac); }); },
    score: function (r) { return cfgRight(r.saved, T) + cfgRight(r.running, T) + r.devices.filter(function (d) { return R.joins(r, d).ok === (d.approved || !T.mac); }).length; },
    notReady: function (r) {
      if (R.pending(r)) return "It's saved, but the router is still running its old settings: it hasn't restarted.";
      const clash = R.interference(r); if (clash.length) return o.from.split(" ")[0] + "'s Wi-Fi still keeps dropping out in the evenings. The scan still shows it overlapping " + clash.map(function (n) { return n.name; }).join(" and ") + ".";
      const wrong = r.devices.filter(function (d) { return R.joins(r, d).ok !== (d.approved || !T.mac); });
      if (wrong.length) return wrong.map(function (d) { return R.joins(r, d).ok ? d.name + " is still on the network, and shouldn't be." : R.joins(r, d).why; }).join(" ");
      return cfgRight(r.running, T) === 6 ? null : "It works, but it isn't set up the way " + o.from.split(" ")[0] + " asked. Read the request again.";
    },
    hints: function () { return o.hints || ["Read the router's Wi-Fi scan on Status: which channels are Router 1 and Router 2 on? Then reread what the customer wants about devices and security.", "On 2.4 GHz only channels 1, 6 and 11 don't overlap, and a narrower channel takes less room. The newest Wi-Fi security is the strongest. MAC filtering lets only the devices on the allowed list join."]; },
    moves: function () { return [
      opt("Set " + T.ssid + ", WPA3, the password, 20 MHz, " + (T.mac ? "MAC filtering with the family's devices allowed" : "MAC filtering off") + " and channel " + T.chan + ", then Save and restart", true),
      opt("Set it all, but leave the width at 40 MHz for speed", false, "At 40 MHz on 2.4 GHz it overlaps the neighbours whatever the channel."),
      opt("Set it all on channel " + o.n1[0] + " to match Router 1", false, "Router 1 is already on " + o.n1[0] + ": the same channel means taking turns with it."),
      opt("Set it all with WPA2 so older devices can join", false, "Every device here supports WPA3, and the customer asked for the most secure."),
      opt(T.mac ? "Turn MAC filtering on but leave the allowed list empty" : "Leave MAC filtering on and add each visitor's device to the list", false, T.mac ? "An empty list blocks every device, the family's too." : "They visit with different devices every weekend. The customer asked for the password to be enough."),
      opt("Set it all and close the app", false, "Typed but not saved: the router keeps running its old settings.")]; },
    close: o.close, note: o.note, target: T });
  return t;
}
const CHAN_Q = function (n1, n2, mine) { return { prompt: "Why channel " + mine + " at 20 MHz?", options: [
  opt("Router 1 and Router 2 use " + n1 + " and " + n2 + "; " + mine + " is the clear one of 1, 6 and 11, and 20 MHz keeps to it", true),
  opt("Higher channel numbers always reach further through the walls of a terraced street like this one", false, "The channel number doesn't change reach. It's about not overlapping the neighbours."),
  opt("40 MHz on " + mine + " would be faster and still miss both neighbours entirely", false, "On 2.4 GHz a 40 MHz channel takes twice the room and overlaps them."),
  opt("WPA3 only runs on channel " + mine, false, "WPA3 works on any channel."),
  opt("Any channel two or more numbers away from a neighbour's is clear of it, so several would have worked", false, "On 2.4 GHz they need to be five apart: only 1, 6 and 11 clear each other."),
  opt("Channel " + mine + " is set aside for home networks", false, "No channel is set aside for homes.")] }; };

export const NR = [
  nrTicket({ id: "N1", base: true, title: "Router 3: set it up so it plays nicely with the neighbours",
    from: "Jamie Carter, home customer", site: "The Carter house, 3 Willow Street",
    brief: ["Jamie Carter. We're number 3 Willow Street, the blue house at the end. Both neighbours have their own routers, and our Wi-Fi drops out every evening. It's shared with you in the app.",
      "Please set the network name to \"HomeWiFi\", use the most secure wireless protection available, and set the password to \"MyCCR0ck2!\". Keep interference down with the channel width. We only want our own devices on it: our laptop, our two phones and the TV. And pick a channel that doesn't overlap the neighbours'."],
    target: { ssid: "HomeWiFi", pass: "MyCCR0ck2!", mac: true, chan: 11 }, n1: [1, 40], n2: [6, 40],
    family: ["Family laptop", "Jamie's phone", "Sam's phone", "Living room TV"], others: [{ name: "Unknown tablet (Galaxy-Tab)" }],
    close: CHAN_Q(1, 6, 11),
    note: { must: [["homewifi"], ["wpa3"], ["20 mhz", "20mhz"], ["mac"], ["channel 11", "ch 11"]], tip: "say what you set, and why that channel, width and filtering." } }),
  nrTicket({ id: "N2", title: "The Garcias' router, between two busy neighbours",
    from: "Maria Garcia, home customer", site: "The Garcia house, 3 Ash Grove",
    brief: ["Maria Garcia. Router 3 is ours, the blue house at the end of the street. Please set it up: name \"Garcia-Home\", the most secure protection there is, password \"Casa#2026Net\". It's in the app.",
      "Keep interference low with the channel width. Only the family's own devices may join: the laptop, the two tablets and the printer. And choose a channel clear of both neighbours."],
    target: { ssid: "Garcia-Home", pass: "Casa#2026Net", mac: true, chan: 1 }, n1: [6, 40], n2: [11, 40],
    family: ["Family laptop", "Maria's tablet", "Luis's tablet", "Printer"], others: [{ name: "Unknown phone (Pixel-7)" }],
    close: CHAN_Q(6, 11, 1),
    note: { must: [["garcia-home"], ["wpa3"], ["20 mhz", "20mhz"], ["mac"], ["channel 1", "ch 1"]], tip: "say what you set, and why that channel, width and filtering." } }),
  nrTicket({ id: "N3", title: "The blue house's Wi-Fi keeps dropping",
    from: "Pat Ellis, home customer", site: "The blue house, 3 Harbour View",
    brief: ["Pat Ellis. We're Router 3, the blue house. Please set the name to \"BlueHouse\", the strongest security, and the password \"Bl#eDoor55\". It's in the app.",
      "Narrow the channel width to cut interference, allow only our approved devices (the laptop, my phone and the doorbell camera), and choose the channel the neighbours leave free."],
    target: { ssid: "BlueHouse", pass: "Bl#eDoor55", mac: true, chan: 6 }, n1: [1, 40], n2: [11, 40],
    family: ["Laptop", "Pat's phone", "Doorbell camera"], others: [{ name: "Unknown laptop (DESKTOP-7Q2)" }],
    close: CHAN_Q(1, 11, 6),
    note: { must: [["bluehouse"], ["wpa3"], ["20 mhz", "20mhz"], ["mac"], ["channel 6", "ch 6"]], tip: "say what you set, and why that channel, width and filtering." } }),
  nrTicket({ id: "N4", title: "The grandchildren can't get on the Wi-Fi",
    from: "Jamie Carter, home customer", site: "The Carter house, 3 Willow Street",
    brief: ["Jamie Carter again. Our grandchildren visit every weekend and can't join the Wi-Fi: it's because of the approved-devices thing you set up. We don't want to approve each of their devices; we'll rely on the Wi-Fi password.",
      "Keep everything else: \"HomeWiFi\", the most secure protection, password \"MyCCR0ck2!\", low interference and a clear channel. It's in the app."],
    target: { ssid: "HomeWiFi", pass: "MyCCR0ck2!", mac: false, chan: 11 }, n1: [1, 40], n2: [6, 40],
    family: ["Family laptop", "Jamie's phone", "Sam's phone", "Living room TV"], others: [{ name: "Grandchild's tablet", approved: true }, { name: "Grandchild's phone", approved: true }],
    close: { prompt: "Why turn MAC filtering off here?", options: [
      opt("The customer wants visitors' changing devices to join with just the password, which still keeps strangers out", true),
      opt("MAC filtering slows the Wi-Fi down for everyone", false, "It doesn't affect speed. It was turned off because the customer stopped wanting it."),
      opt("WPA3 doesn't work with MAC filtering turned on", false, "They work together fine."),
      opt("MAC filtering is what caused the evening drop-outs", false, "The drop-outs were the channel overlap, fixed before."),
      opt("Visitors' devices can't be added to an allowed list at all", false, "They can, but the customer doesn't want to do it every weekend."),
      opt("Turning it off makes the network invisible to neighbours", false, "Filtering has nothing to do with whether the network is seen.")] },
    note: { must: [["mac"], ["off", "disabled", "turned off"], ["password"], ["grandchild", "visitor"]], tip: "say what you changed and why the password is now what keeps it closed." } }),
  nrTicket({ id: "N5", title: "Rosa's home router",
    from: "Rosa Ortiz, reception (at home)", site: "The Ortiz house, 3 Brook Lane",
    brief: ["Rosa from reception here, asking for help at home. Ours is Router 3. Name it \"Ortiz_Net\", the strongest security, password \"Recept10n!Home\". I've shared it in the app.",
      "Keep the interference down, approved devices only (my laptop, my phone and my son's console), and a channel neither neighbour uses."],
    target: { ssid: "Ortiz_Net", pass: "Recept10n!Home", mac: true, chan: 1 }, n1: [11, 20], n2: [6, 40],
    family: ["Rosa's laptop", "Rosa's phone", "Game console"], others: [{ name: "Unknown phone (iPhone-Jake)" }],
    close: CHAN_Q(11, 6, 1),
    note: { must: [["ortiz_net"], ["wpa3"], ["20 mhz", "20mhz"], ["mac"], ["channel 1", "ch 1"]], tip: "say what you set, and why that channel, width and filtering." } }),
  nrTicket({ id: "N6", title: "Dev's home router",
    from: "Dev Patel, Dev (at home)", site: "The Patel house, 3 Rowan Court",
    brief: ["Dev here, it's my home router this time: Router 3. Name \"Patel5\", the most secure protection available, password \"D3v@Home!!\". Shared in the app.",
      "Pick the width that keeps interference down, allow only my devices (the laptop, the desktop and my phone), and avoid both neighbours' channels."],
    target: { ssid: "Patel5", pass: "D3v@Home!!", mac: true, chan: 6 }, n1: [1, 40], n2: [11, 20],
    family: ["Dev's laptop", "Dev's desktop", "Dev's phone"], others: [{ name: "Unknown device (ESP_3F21)" }],
    close: CHAN_Q(1, 11, 6),
    note: { must: [["patel5"], ["wpa3"], ["20 mhz", "20mhz"], ["mac"], ["channel 6", "ch 6"]], tip: "say what you set, and why that channel, width and filtering." } })
];
