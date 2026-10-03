/* =====================================================================
   The Port Forwarding tickets: customers' homes, in the 92 Series app,
   from the Port Forwarding Configuration sim as the owner ruled it
   (30 September 2026, "swap port forwarding"): the device reached from
   outside stays on the LAN behind one forwarded port; the game console,
   which needs everything open, goes in the screened subnet.

   The customer does the physical part on the phone (plugging the
   console into the orange SCREENED SUBNET port) and tests it from
   outside: Remote Desktop from work, and a game's NAT type. Both
   results are worked out from what really reaches in (router.js).
   ===================================================================== */
import * as R from "./router.js";
import { routerTicket, intact } from "./tickets-router.js";

function opt(label, correct, why) { return { label: label, correct: !!correct, why: why || "" }; }
const SVC = { "3389": "Remote Desktop", "22": "SSH", "5900": "VNC screen sharing" };
function fwOK(c, pc, svc) { return c.forwards.some(function (f) { return f.ext === svc && f.proto === "TCP" && f.ip === pc.ip && f.port === svc; }); }
/* Proven, not assumed: the customer has tested both from outside since
   the router last restarted. */
function tested(r) { const boot = r.events.filter(function (e) { return e.kind === "reboot" || e.kind === "power-cycle"; }).map(function (e) { return e.at; }).pop();
  const after = function (k, ok) { return r.events.some(function (e) { return e.kind === k && e[ok] && (boot == null || e.at > boot); }); };
  return after("tested-remote", "ok") && after("tested-game", "open"); }
function exposed(c, r) { const pc = R.role(r, "remote"); return !!pc && (pc.port === "screened" || c.screened === pc.ip); }

function pfTicket(o) {
  const T = o.target, lan = o.lan.split(".").slice(0, 3).join("."), scr = o.scr.split(".").slice(0, 3).join(".");
  const devs = [
    { name: o.pc, role: "remote", svc: T.svc, port: "lan", host: 20, ip: lan + ".20", wired: true, mac: "D8:BB:C1:0A:22:01", bands: ["2.4", "5"], wpa3: true, knows: T.wifiPass, where: "wired, yellow port 1" },
    { name: o.gc, role: "game", port: "lan", host: 50, ip: lan + ".30", wired: true, mac: "7C:BB:8A:40:9E:13", bands: ["2.4", "5"], wpa3: true, knows: T.wifiPass, where: "wired, yellow port 2" },
    { name: "Family laptop", mac: "A0:CE:C8:11:5D:7E", wpa3: true, knows: T.wifiPass, where: "Wi-Fi, living room" },
    { name: o.old || "Smart TV", mac: "CC:6E:A4:3B:08:91", wpa3: !!o.allWpa3, bands: ["2.4"], knows: T.wifiPass, where: "Wi-Fi, lounge" }];
  const secOK = T.sec === "WPA3" ? ["WPA3"] : ["WPA2", "WPA2/WPA3"];
  const t = routerTicket({ id: o.id, base: o.base, title: o.title, sim: "Port Forwarding Configuration", home: true,
    from: o.from, site: o.site, brief: o.brief,
    asks: ["lights", "sticker", "console-port", "pc-port", "pc-back", "test-remote", "test-game", "power"],
    router: { site: o.site.split(",")[0], customer: o.from.split(",")[0], publicIp: o.wan, screenedNet: scr,
      cfg: { admin: { pass: "Home#Router-" + o.id + "x" }, lan: { ip: o.lan }, wifi: { ssid: o.ssid, pass: T.wifiPass, security: "WEP", band: "2.4", channel: 6 } }, devices: devs },
    done: function (r) { const pc = R.role(r, "remote"), gc = R.role(r, "game"); return pc.port === "lan" && fwOK(r.running, pc, T.svc) && gc.port === "screened" && r.running.screened === gc.ip && !exposed(r.running, r) && secOK.indexOf(r.running.wifi.security) >= 0 && intact(r) && tested(r); },
    score: function (r) { const pc = R.role(r, "remote"), gc = R.role(r, "game"); let n = 0;
      if (fwOK(r.saved, pc, T.svc)) n++; if (fwOK(r.running, pc, T.svc)) n++; if (gc.port === "screened") n++; if (r.saved.screened === gc.ip && gc.port === "screened") n++; if (r.running.screened === gc.ip && gc.port === "screened") n++;
      if (secOK.indexOf(r.saved.wifi.security) >= 0) n++; if (secOK.indexOf(r.running.wifi.security) >= 0) n++; if (exposed(r.running, r) || pc.port === "screened") n -= 3; return n; },
    notReady: function (r) {
      if (R.pending(r)) return "It's saved, but the router is still running its old settings: it hasn't restarted.";
      if (exposed(r.running, r)) return "The " + o.pc + " is wide open to the internet. That's not what the customer asked for.";
      const rt = R.remoteTest(r), nt = R.natTest(r);
      if (!rt.ok) return o.from.split(" ")[0] + " tries " + SVC[T.svc] + " from outside: " + rt.text;
      if (!nt.open) return "The " + o.gc + " still says: " + nt.text;
      if (!intact(r)) return r.devices.filter(function (d) { return !R.joins(r, d).ok; }).map(function (d) { return R.joins(r, d).why; }).join(" ");
      if (secOK.indexOf(r.running.wifi.security) < 0) return "Everything works, but the Wi-Fi isn't secured the way it should be for this home. Read the request again.";
      if (!tested(r)) return "It looks right on the router, but " + o.from.split(" ")[0] + " hasn't tried it from outside yet. Ask them to test both.";
      return null;
    },
    hints: function () { return o.hints; },
    moves: function () { return [
      opt("Forward TCP " + T.svc + " to the " + o.pc + ", have the " + o.gc + " moved to the screened-subnet port and set as its host, secure the Wi-Fi, then Save and restart", true),
      opt("Put the " + o.pc + " in the screened subnet and forward " + T.svc + " to the " + o.gc, false, "Backwards: that opens every port on the " + o.pc + " to the internet, and the " + o.gc + " needs far more than one port."),
      opt("Forward TCP " + T.svc + " to the router's own address", false, "The router isn't the " + o.pc + ". The forward has to point at the device that answers."),
      opt("Make the " + o.gc + " the screened-subnet host while it's still in a yellow LAN port", false, "The host address has to be on the screened subnet. In a LAN port it has a LAN address."),
      opt("Forward every port, 1 to 65535, to the " + o.pc, false, "That exposes everything on it. One service needs one forwarded port."),
      opt("Set it all up and close the app", false, "Typed but not saved: the router keeps running its old settings.")]; },
    close: o.close, note: o.note, target: Object.assign({ pc: o.pc, gc: o.gc }, T) });
  return t;
}
const PLACE_Q = function (pc, gc, svc) { return { prompt: "Why does the " + pc + " stay on the LAN while the " + gc + " goes in the screened subnet?", options: [
  opt("One forwarded port reaches the " + pc + " safely; the " + gc + " needs everything open, so it sits outside the LAN", true),
  opt("The screened subnet is a faster connection, so the " + gc + " gets lower lag and smoother online play than it would on the LAN", false, "It isn't faster. It's open: the " + gc + "'s online features need connections in from the internet."),
  opt("The " + pc + " can't reach the internet from the screened subnet", false, "It could. Putting it there would expose all its ports, when " + SVC[svc] + " needs only one."),
  opt("Consoles aren't allowed on a LAN with a computer on it", false, "They are. It's about which connections each needs from outside."),
  opt("Port forwarding only works for devices in the screened subnet, so the " + pc + " has to be reached a different way from the " + gc, false, "The opposite: a forward sends one port to a device on the LAN."),
  opt("The " + gc + " has its own firewall, so it doesn't need the LAN", false, "It's in the screened subnet because it needs everything open, not because it's safer there.")] }; };
const PF_HINTS = function (svc, gc) { return ["Read what the customer wants each device to do, and from where. Then look at Status: which port is each one in, and what address does it have?", "One service reached from outside needs one forwarded port, to the device on the LAN. A device that needs everything open goes outside the LAN, in the screened subnet. And home Wi-Fi is secured with a shared passphrase."]; };

export const PF = [
  pfTicket({ id: "P1", base: true, title: "Remote access to the home PC, and the console's chat",
    from: "Alex Morgan, home customer", site: "The Morgan house, 21 Elm Row", pc: "Windows PC", gc: "Game Console", ssid: "MorganHome",
    lan: "192.168.10.1", scr: "10.100.0.1", wan: "50.90.234.1",
    target: { svc: "3389", sec: "WPA2", wifiPass: "Elm-Row-2026!" },
    brief: ["Alex Morgan. I need to get to my Windows PC from work with Remote Desktop, and the kids say the game console's chat and online features don't work. I've shared the router with you in the app; I'm at home if you need me to plug anything in.",
      "Also, a friend said our Wi-Fi security is ancient and we should fix it. The home network uses 192.168.10.0/24, and the router has a screened subnet on 10.100.0.0/24: it's the orange port on the back."],
    hints: PF_HINTS("3389"), close: PLACE_Q("Windows PC", "Game Console", "3389"),
    note: { must: [["3389", "remote desktop", "rdp"], ["screened", "dmz"], ["console"], ["wpa2"]], tip: "say what you forwarded, where the console went, and the Wi-Fi security." } }),
  pfTicket({ id: "P2", title: "Strict NAT on the console, and RDP from work",
    from: "Sam Okafor, home customer", site: "The Okafor house, 6 Larch Close", pc: "Windows PC", gc: "Game Console", ssid: "OkaforNet",
    lan: "192.168.50.1", scr: "10.20.0.1", wan: "73.12.88.4",
    target: { svc: "3389", sec: "WPA2", wifiPass: "Larch#Close-88" },
    brief: ["Sam Okafor. I want to reach my Windows PC from work, and my kids' game console has \"strict NAT\" errors in every online game. It's shared with you in the app.",
      "The LAN is 192.168.50.0/24 and the screened subnet 10.20.0.0/24 (the orange port). Our provider gave us 73.12.88.4. Oh, and the Wi-Fi's on whatever the last guy set, which I think is WEP."],
    hints: PF_HINTS("3389"), close: PLACE_Q("Windows PC", "Game Console", "3389"),
    note: { must: [["3389", "remote desktop", "rdp"], ["screened", "dmz"], ["nat"], ["wpa2"]], tip: "say what you forwarded, where the console went, and what the NAT type became." } }),
  pfTicket({ id: "P3", title: "SSH to the home server, and open NAT for the console",
    from: "Jordan Reyes, home customer", site: "The Reyes house, 88 Quarry Lane", pc: "Linux server", gc: "Game Console", ssid: "ReyesLab",
    lan: "192.168.1.1", scr: "172.16.5.1", wan: "98.42.17.200",
    target: { svc: "22", sec: "WPA2", wifiPass: "Quarry-Lane#7" },
    brief: ["Jordan Reyes. I run a Linux home server that I manage over SSH from outside, and I want the game console fully open for online play. Shared in the app.",
      "LAN 192.168.1.0/24, screened subnet 172.16.5.0/24 on the orange port, public address 98.42.17.200. The Wi-Fi's still on old WEP: sort that too, please."],
    hints: PF_HINTS("22"), close: PLACE_Q("Linux server", "Game Console", "22"),
    note: { must: [["ssh", "22"], ["screened", "dmz"], ["console"], ["wpa2"]], tip: "say what you forwarded, where the console went, and the Wi-Fi security." } }),
  pfTicket({ id: "P4", title: "Screen sharing to the Mac, voice chat on the console",
    from: "Robin Hale, home office", site: "The Hale house, 3 Ferry Road", pc: "Mac", gc: "Game Console", ssid: "HaleOffice",
    lan: "192.168.20.1", scr: "10.0.9.1", wan: "64.18.200.9",
    target: { svc: "5900", sec: "WPA2", wifiPass: "Ferry-Road-4u!" },
    brief: ["Robin Hale. I want to reach my Mac from outside with screen sharing (it's VNC), and the console needs open NAT for voice chat. It's in the app.",
      "LAN 192.168.20.0/24, screened subnet 10.0.9.0/24 (orange port), public address 64.18.200.9. Please fix the Wi-Fi security too: it's WEP."],
    hints: PF_HINTS("5900"), close: PLACE_Q("Mac", "Game Console", "5900"),
    note: { must: [["vnc", "5900", "screen sharing"], ["screened", "dmz"], ["console"], ["wpa2"]], tip: "say what you forwarded, where the console went, and the Wi-Fi security." } }),
  pfTicket({ id: "P5", title: "Remote Desktop and a streaming console",
    from: "Casey Lin, home customer", site: "The Lin house, 52 Mill Street", pc: "Windows PC", gc: "Streaming console", ssid: "LinFamily",
    lan: "192.168.88.1", scr: "10.88.0.1", wan: "203.0.113.45",
    target: { svc: "3389", sec: "WPA2", wifiPass: "Mill#Street-52" },
    brief: ["Casey Lin. I want Remote Desktop into the family Windows PC, and our streaming console with all its online features working. Shared with you in the app.",
      "LAN 192.168.88.0/24, screened subnet 10.88.0.0/24 (the orange port), public address 203.0.113.45. The Wi-Fi uses WEP, which I'm told is bad."],
    hints: PF_HINTS("3389"), close: PLACE_Q("Windows PC", "Streaming console", "3389"),
    note: { must: [["3389", "remote desktop", "rdp"], ["screened", "dmz"], ["console"], ["wpa2"]], tip: "say what you forwarded, where the console went, and the Wi-Fi security." } }),
  pfTicket({ id: "P6", title: "Same setup, strongest Wi-Fi this time",
    from: "Taylor Brooks, home customer", site: "The Brooks house, 9 Kiln Way", pc: "Windows PC", gc: "Game Console", ssid: "BrooksHome", allWpa3: true, old: "Tablet",
    lan: "192.168.30.1", scr: "10.30.0.1", wan: "52.14.77.3",
    target: { svc: "3389", sec: "WPA3", wifiPass: "Kiln-Way-2026!" },
    brief: ["Taylor Brooks. Same as my neighbour had done: remote access to my Windows PC, and full game console features. It's in the app.",
      "This time every device in the house supports WPA3, and I want the strongest Wi-Fi security there is. LAN 192.168.30.0/24, screened subnet 10.30.0.0/24 (orange port), public address 52.14.77.3."],
    hints: PF_HINTS("3389"), close: PLACE_Q("Windows PC", "Game Console", "3389"),
    note: { must: [["3389", "remote desktop", "rdp"], ["screened", "dmz"], ["console"], ["wpa3"]], tip: "say what you forwarded, where the console went, and the Wi-Fi security." } })
];
