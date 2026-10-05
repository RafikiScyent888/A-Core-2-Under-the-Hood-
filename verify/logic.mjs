/* =====================================================================
   verify/logic.mjs — the checks that need no browser.

     node verify/logic.mjs           the checks
     node verify/logic.mjs --plant   every planted defect must be CAUGHT

   What it holds, for all twelve tickets:

     SHAPE      six per sim, one of each is the sim itself, ids unique
     EXHIBITED  after setup the fault is really on the machine: the
                program really fails, the way the ticket says it does,
                and the ticket's goal is not already met
     SOLVABLE   the known fix, done headless through the real shell and
                the real repair code, really meets the goal
     SIX        the close question: six options, one right, a reason on
                every wrong one; the rung-3 moves the same
     SPREAD     the right answer does not sit in one slot, and is not
                usually the longest option
     NO LEAK    no rung-1 or rung-2 hint names the answer
     LADDER     rung for guesses 0..9 is 0,0,0,1,2,3,3,3,3,3; rung 3
                strikes four and leaves two alive, the right one among them
     JUDGE      looking, help and typos never count; a refused change and
                the sim's old answer do; undoing your own change does not
     SNAPSHOT   revert puts the machine back and keeps the hint count;
                a session survives a reload
     NOTE       a ticket note needs the words that matter, in any wording
     MALWARE    for each malware ticket: the infection is really on the
                PCs it names and nowhere else; CompTIA's steps, done in
                order through the engine, close it with no wrong moves;
                out of order costs (spread, a clean PC unplugged, an old-
                definitions scan, a restore point while infected); six
                moves at every step, no hint naming the move
     MAIL       for each email ticket: every email reaches its user, and its
                forward reaches the help desk unless it can't be forwarded;
                the right handling closes it with no wrong moves; skipping
                a safeguard leaves it open; the consequences count (a phish
                called safe compromises the user, a genuine email junked or
                its sender blocked, a link opened); every giveaway question
                is six with one right, spread across the slots and not
                usually the longest; no hint names the giveaway
     ROUTER     the 92 Series model: typed-but-unsaved changes die on a
                reboot, saved ones wait for it; strong admin passwords
                only; the WAN side (cable port, PPPoE, unregistered, a
                faulty power supply); only 1, 6 and 11 clear each other;
                who can join (WPA3-only, band, MAC list, password, thick
                walls on 5 GHz, the network name), a crowded room; what
                reaches in (a forward, the screened-subnet host)
     CHAT       for each Help Desk chat: every step's pool is one right and
                eight wrong, all different, each wrong one with the
                customer's reaction and a reason; CE1 and CR1 carry the sims'
                own replies, jokes included, and their keys word for word;
                the customer's fault is really there at the start; the right
                replies and the hands-on checks finish it with no wrong
                moves; a wrong reply counts, stays red, upsets the customer
                and doesn't move the chat on; six shown, the right one among
                them; starting again gives a new mix and puts the customer's
                phone or router back; rung 3 strikes four of the six and
                leaves the right one alive; no hint names the reply
     EXAM       each exam view: six per sim, one the sim itself; the sims'
                own keys (as ruled); every question six, one right, reasons;
                every typed answer is in the brief word for word; App
                Deployment's keyed commands, run on its ticket's own PC, fix
                it, the sim's old key does not, and the keyed event is the
                Error or Warning; each email
                keyed with its own category; each infected PC keyed to be
                contained and showing its malware, no clean PC showing any; right
                values check done, a wrong one stays red and counts; rung 3
                leaves two alive; no hint names the answer; spread

   A plant run that passes is reported as a failure: a check that cannot
   fail is not a check.
   ===================================================================== */
import * as M from "../assets/machine.js";
import { createShell } from "../assets/cmd.js";
import { makeFleet, byHost } from "../assets/fleet.js";
import * as TK from "../assets/tickets.js";
import { createEngine, rungFor } from "../assets/engine.js";
import { ordered } from "../assets/order.js";
import * as MW from "../assets/malware.js";
import { nextStep } from "../assets/tickets-malware.js";
import * as MX from "../assets/mail.js";
import * as PQ from "../assets/pbq.js";
import * as RT from "../assets/router.js";
import { EXAMS } from "../assets/exams.js";
import { MALWARE } from "../assets/tickets-malware.js";
import { CATS, emailById } from "../assets/tickets-mail.js";
import * as CHM from "../assets/chat.js";
import * as MBM from "../assets/mobile.js";
import * as BKM from "../assets/backup.js";
import * as XTM from "../assets/tickets-extra.js";

const clone = (x) => JSON.parse(JSON.stringify(x));
function memStore() { const d = {}; return { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); }, removeItem: (k) => { delete d[k]; } }; }

/* The known fix for each ticket, done the way a student would. */
export const FIX = {
  L1: (m) => M.repairApp(m, "Testing", "repair"), L2: (m) => M.repairApp(m, "PayWise", "repair"),
  L3: (m) => { M.launchApp(m, "Scan2Doc"); M.note(m, "view-log", { log: "Application" }); M.repairApp(m, "Scan2Doc", "repair"); },
  L4: (m) => M.repairApp(m, "Testing", "repair"), L5: (m) => M.repairApp(m, "LabelPro", "repair"),
  L6: (m) => { M.launchApp(m, "ChartView"); M.note(m, "view-log", { log: "Application" }); M.repairApp(m, "ChartView", "repair"); },
  D1: (m, sh) => sh.run("\\\\FS01\\Software\\vcredist_x86_2010.exe"), D2: (m, sh) => sh.run("\\\\FS01\\Software\\VC_redist.x86.exe"),
  D3: (m, sh) => sh.run('setx /m path "%PATH%;C:\\Program Files (x86)\\Common Files\\Rafiki"'),
  D4: (m, sh) => { sh.run("gpupdate /force"); const r = sh.run("Y"); if (r.power === "restart") { M.shutdown(m); M.boot(m); } },
  D5: (m, sh) => sh.run('del "C:\\Program Files (x86)\\Testing\\msvcp100.dll"'),
  D6: (m, sh) => sh.run("\\\\FS01\\Software\\VC_redist.x64.exe")
};
/* How each ticket's fault shows itself before it is fixed. */
export const SHOWS = { L1: "missing", L2: "missing", L3: "missing", L4: "config", L5: "shortcut", L6: "crash", D1: "missing", D2: "missing", D3: "missing", D4: "notfound", D5: "bitness", D6: "missing" };
/* Words that would hand over the fix if a rung-1 or rung-2 hint used them. */
const ANSWER_WORDS = [/vcredist_x86_2010/i, /vc_redist\.x(86|64)\.exe/i, /vcredist_x86_2013/i, /gpupdate \/force/i, /setx \/m/i, /modify\s*→\s*repair/i];
/* The model note for each ticket: the note check must accept it. */
const NOTES = {
  L1: "Testing said MSVCP100.dll was missing. Repaired Testing from Settings and tested that it opens.",
  L2: "PayWise said VCRUNTIME140.dll was missing. Reinstalled PayWise from Software Center; it opens now.",
  L3: "Scan2Doc says MSVCR120.dll is missing. Repair changed nothing; Event Viewer shows the same. Escalated to Tier 2 for the runtime.",
  L4: "Testing gave a configuration error: config.ini was damaged. Repaired Testing, which rewrote the file, and tested it.",
  L5: "The LabelPro shortcut pointed at the old version's folder. Repaired LabelPro, which recreated the shortcut; tested.",
  L6: "ChartView crashes with 0xc0000005 in ChartView.exe (Event Viewer, Application Error). Repair did not help. Escalated.",
  D1: "Event 2190: Testing faulting module MSVCP100.dll. The System32 copy is 64-bit. Installed the x86 redistributable and tested.",
  D2: "PayWise needed vcruntime140.dll, the 32-bit (x86) runtime. Installed VC_redist.x86 elevated and tested it.",
  D3: "The deployment wiped the PATH. Added Common Files\\Rafiki back to the system PATH with setx /m and tested Testing.",
  D4: "Software installation policy was pending a restart. Ran gpupdate /force and restarted; Testing installed.",
  D5: "A 64-bit msvcp100.dll was in Testing's folder, giving 0xc000007b. Deleted it (elevated) and tested Testing.",
  D6: "LabelPro is 64-bit and vcruntime140.dll was missing from System32. Installed the x64 runtime and tested.",
  M1: "Checked all seven PCs. SCVHOST.exe (PDF Pro Updater service) on WS2 and FS01. Quarantined both by unplugging them, turned System Restore off on WS2, updated definitions from USB, ran a Defender Offline scan, scheduled scans, updated, made a restore point. Told Brenda to use Software Center.",
  M2: "Checked all seven PCs. SpeedBoostPro.exe on WS1 came from the 3x faster email. Unplugged it to quarantine, disabled System Restore, updated definitions from USB, Defender Offline scan, scheduled scans, updates, restore point. Told John not to install from email links.",
  M3: "Checked all seven PCs. SearchMate hijacker (smhelper.exe) on WS5 came with the coupon add-on. Unplugged to quarantine, System Restore off, definitions from USB, Defender Offline scan, scheduled scans, updates, restore point. Advised Rosa about add-ons.",
  M4: "Checked all seven PCs. A miner posing as WmiPrvSvc.exe on WS3, from the DarkPro VS Code theme extension. Unplugged to quarantine, System Restore off, USB definitions, Defender Offline scan, schedule, updates, restore point. Told Dev to use verified extensions.",
  M5: "Checked all seven PCs. PC Defender Pro, fake antivirus scareware, on WS4. Unplugged to quarantine, System Restore off, USB definitions, Defender Offline scan, scheduled scans, updates, restore point. Told Farah never to pay a pop-up.",
  M6: "Checked all seven PCs. The Invoice xlsm macro Farah enabled dropped OfficeUpdate.exe on WS4 and on FS01, the file server. Quarantined both, System Restore off on WS4, USB definitions, Defender Offline scan, schedule, updates, restore point. Told Farah never to enable macros from email.",
  E1: "John's Microsoft password email was phishing (link to msaccount-updatecenter.com): reported and purged. Dev's 3x Faster was a malicious download: reported, purged, domain blocked. Rosa's diet email was spam: junk. Farah's bank statement was legit: told her it's genuine.",
  E2: "Dev's CloudHost receipt was genuine. Brenda's iPhone prize was spam, junked. Farah's PayPal email was phishing (paypal-resolve-login.net), reported and purged. The Hartwell invoice was an xlsm macro: malicious, reported, purged, blocked.",
  E3: "Brenda's TravelSafe hotel booking was genuine. Dev's streaming offer was spam, junked. Rosa's bank suspended email and John's Jakarta login alert were both phishing: reported and purged.",
  E4: "Farah's gift card request from Mason came from rafiki-lt.com with a Gmail reply-to, failing SPF and DMARC in the headers: phishing, reported, purged, blocked, and turned on the external tag policy. Dev's course was genuine, John's chairs spam, Brenda's bonus .exe malicious.",
  E5: "Rosa's mailbox validate email claimed to be our help desk but the headers show SPF and DMARC failed from an outside server: phishing, reported, purged, anti-spoof quarantine policy on. Dev's PayWise notice was genuine (Software Center). Brenda's webinar spam. Rosa's parcel zip label malicious.",
  WR1: "The microwave on the break counter sat beside the access point and drowned 2.4 GHz at lunch. Moved it across the room, then set 2.4 GHz for the dense walls, channel 11 and WPA3. Saved, restarted, all connected.",
  WR2: "Ten networks nearby crowded 2.4 GHz all day. Moved the router to 5 GHz on fixed channel 36, kept WPA3. Saved and restarted; nobody is crawling now.",
  WR3: "The edit suite at the far end needs 2.4 GHz reach and the projector needs 5 GHz speed, so dual-band with steering and automatic channel, WPA3. Saved and restarted; both work.",
  WR4: "Fourteen networks covered channels 1 to 11, so no clear 2.4 GHz channel was left. Set 5 GHz on fixed channel 149 with WPA3. Saved and restarted; everyone is fine.",
  WR5: "Concrete walls stopped 5 GHz from reaching the scanner. Set 2.4 GHz on channel 6, clear of the two networks on 1 and 11, and WPA3 instead of open. Saved and restarted.",
  WR6: "The far treatment rooms need 2.4 GHz reach and the imaging tablet needs 5 GHz speed: dual-band with steering, automatic channel since no networks are nearby, WPA3. Saved and restarted.",
  N1: "Router 3: HomeWiFi with the password, WPA3, 20 MHz to keep interference down, MAC filtering with the family's four devices allowed, and channel 11 because Router 1 and 2 use 1 and 6. Saved and restarted.",
  N2: "Garcia-Home with its password, WPA3, 20 MHz, MAC filtering allowing only the family's devices, and channel 1, since the neighbours use 6 and 11. Saved and restarted; no more overlap.",
  N3: "BlueHouse with its password, WPA3, 20 MHz width, MAC filtering for the laptop, phone and doorbell camera, and channel 6 because the neighbours are on 1 and 11. Saved and restarted.",
  N4: "Turned MAC filtering off so the grandchildren's devices can join with the password; kept HomeWiFi, WPA3, 20 MHz and channel 11. Saved and restarted; the visitors connect.",
  N5: "Ortiz_Net with the password, WPA3, 20 MHz, MAC filtering for Rosa's laptop, phone and the console, and channel 1 because the neighbours are on 11 and 6. Saved and restarted.",
  N6: "Patel5 with the password, WPA3, 20 MHz, MAC filtering allowing Dev's laptop, desktop and phone, channel 6 because the neighbours use 1 and 11. Saved and restarted.",
  P1: "Forwarded TCP 3389 (Remote Desktop) to the Windows PC on the LAN at 192.168.10.20. Alex moved the console to the screened subnet port and I set it as the screened host. Wi-Fi from WEP to WPA2. Saved, restarted, both tested.",
  P2: "Forwarded TCP 3389 to Sam's Windows PC at 192.168.50.20. The console went into the screened subnet port as the screened host; NAT is open now. WEP replaced with WPA2. Saved and restarted.",
  P3: "Forwarded TCP 22 for SSH to the Linux server on the LAN at 192.168.1.20. The console is in the screened subnet as the screened host. Wi-Fi from WEP to WPA2. Saved, restarted, both tested.",
  P4: "Forwarded TCP 5900 for VNC screen sharing to the Mac at 192.168.20.20. Console moved to the screened subnet port and set as screened host. WEP replaced with WPA2. Saved, restarted, tested.",
  P5: "Forwarded TCP 3389 Remote Desktop to the Windows PC at 192.168.88.20. The streaming console is in the screened subnet as the screened host. Wi-Fi from WEP to WPA2. Saved, restarted, tested.",
  P6: "Forwarded TCP 3389 Remote Desktop to the Windows PC at 192.168.30.20. Console moved to the screened subnet as the screened host. Every device supports WPA3, so WPA3. Saved, restarted, tested.",
  W1: "Set MainOffice1 with the new password, WPA3 because every device supports it, 2.4 GHz for the thick walls, channel 6. Saved and restarted; the Office 3 tablet connects.",
  W2: "Set Rafiki-Staff with its password, WPA3, 2.4 GHz to get through the brick walls, and channel 11 because next door uses 1 and 6. Saved, restarted, the tablet holds signal.",
  W3: "Conference AP: Conference-5G with its password, WPA3, 5 GHz for its many clear channels with 25 laptops in one open room, channel 36. Saved and restarted; meetings are quick.",
  W4: "The Office 2 label printer only supports WPA2. Set WPA2/WPA3 transition so it joins while the rest keep WPA3. MainOffice1, 2.4 GHz, channel 6. Saved, restarted, printer connects.",
  W5: "Guest network Rafiki-Guest with its password, WPA3, 2.4 GHz because reception is two thick walls away, channel 1. Saved and restarted; a visitor's phone connects.",
  W6: "After the reset: MainOffice1 with its password, WPA3, 2.4 GHz for the thick walls. The scan showed next door on 1 and 6, so channel 11. Saved and restarted; the tablet connects.",
  R1: "Replaced the default admin password from the sticker with a strong one on Administration, saved it, and restarted the router. Leah's laptop and printer still connect.",
  R2: "The admin password was the default \"admin\". Set a strong 16-character one, saved and restarted. Card reader and front desk PC both still online.",
  R3: "Status said no cable in the INTERNET port. Marcus found the modem cable in yellow LAN port 1 and moved it to the blue INTERNET port; the globe went green and the card machine is back.",
  R4: "Daniel typed the new Wi-Fi password but never saved it, so the router kept the old one. Entered Blue-Harbor#88, saved and restarted; his laptop and TV rejoined with it.",
  R5: "Status shows PPPoE authentication failed. Omar has no welcome letter or account details from the provider. Escalated to Tier 2 to get the provider to reissue the PPPoE credentials.",
  R6: "It restarts every few minutes with every light going out. Nora confirmed it's on its own power adapter and it did the same on a second socket. Escalated to Tier 2 for a replacement router.",
  CE1: "Her phone was on IMAP with SSL but port 100, where nothing listens. She changed the port to 993, IMAP over SSL/TLS; I synced her phone in Mobile devices and it works.",
  CE2: "John's outgoing server was on port 25 with no security or sign-in; carriers block 25. He set SMTP to 587 with STARTTLS and sign-in; synced, sending works.",
  CE3: "Farah's phone used POP3 on 995, which removed mail from the server after download. Switched it to IMAP on 993 with SSL/TLS so mail stays on the server; synced and checked.",
  CE4: "Rosa's server name was a typo, mail.rafki.local. She corrected it to mail.rafiki.local on both incoming and outgoing servers; synced, mail flows.",
  CE5: "Dev's password had expired and he changed it, but the phone still had the old one saved. He entered the new password on the phone himself; synced and it signs in.",
  CE6: "A friend set security to None on port 143, unencrypted IMAP the server refuses. She set SSL/TLS on 993 again; I synced her phone and it connects.",
  CR1: "Replacement router still on the sticker's default admin password. Priya set a strong new one, saved it, and restarted; checked Administration and Status in the app.",
  CR2: "Tom's Wi-Fi used the sticker's name and password. He set a new SSID, a long passphrase and WPA3, saved and restarted; all devices rejoined, checked on Status.",
  CR3: "Ana's new Wi-Fi password was typed but never saved, so the power cut restart loaded the old one. She typed it, pressed Save, then restarted; checked Status.",
  CR4: "Firmware 1.0.4 had an update. Grace saved settings and installed 1.1.2 from Administration without unplugging it; it restarted with her settings. A security update.",
  CR5: "WPA3 only locked out Mia's old WPA2-only laptop. Set WPA2/WPA3 transition so the laptop uses WPA2 and newer devices WPA3; saved, restarted, all connected.",
  CR6: "The router was on channel 6 at 40 MHz, overlapping the café on 1 and the flat on 6. Ben set channel 11 at 20 MHz; saved, restarted, no overlap on the scan.",
  X1: "Restored Q3-budget.xlsx from the 3 October 11:58 previous version, from a restore point. Set up File History to \\\\FS01\\Backups, every hour, turned it on and tested it: her file is in Restore personal files.",
  E6: "Brady Tag's new bank details came from bradytag-co.com, a lookalike domain with a reply-to on another domain: phishing, reported, purged, blocked, lookalike policy on. Farah's order shipped notice was genuine. John's DocuSign was phishing. Brenda's timesheet xlsm macro was malicious."
};

export function check(D) {
  const fails = []; const F = (s) => fails.push(s);
  const T = D.TICKETS;

  /* ---- SHAPE ---- */
  const bySim = {}; const ids = new Set();
  T.forEach((t) => { if (ids.has(t.id)) F("SHAPE: duplicate id " + t.id); ids.add(t.id); if (!t.extra) (bySim[t.sim] = bySim[t.sim] || []).push(t); });
  const APP = T.filter((t) => !t.kind), MAL = T.filter((t) => t.kind === "malware"), EM = T.filter((t) => t.kind === "email"), RTR = T.filter((t) => t.kind === "router" || t.kind === "wifi");
  Object.entries(bySim).forEach(([sim, list]) => {
    if (list.length !== 6) F("SHAPE: " + sim + " has " + list.length + " tickets, not 1 + 5");
    if (list.filter((t) => t.base).length !== 1) F("SHAPE: " + sim + " does not have exactly one ticket that is the sim itself");
  });
  if (Object.keys(bySim).length !== 11) F("SHAPE: expected the two App sims, Malware, Email Threat, Tier 1 Router, WiFi AP, Port Forwarding, Neighboring Routers, Wireless Reliability and the two Help Desk chats, found " + Object.keys(bySim).length);

  const pos = [0, 0, 0, 0, 0, 0]; let longest = 0, lenQs = 0, movePos = [0, 0, 0, 0, 0, 0];
  APP.forEach((t) => {
    /* ---- EXHIBITED ---- */
    const f = D.makeFleet(); t.setup(f); const m = f[t.machine];
    if (t.goal(f)) F("EXHIBITED " + t.id + ": the goal is already met before the student starts");
    const via = t.id === "L5" ? "shortcut" : "start";
    const r = M.launchApp(clone(m), t.app, via);
    if (r.kind !== D.SHOWS[t.id]) F("EXHIBITED " + t.id + ": " + t.app + " shows '" + r.kind + "', the ticket needs '" + D.SHOWS[t.id] + "'");
    if (D.score(t, f) >= 10) F("EXHIBITED " + t.id + ": scored as fixed before any work");

    /* ---- SOLVABLE ---- */
    const g = clone(f); const gm = g[t.machine];
    D.FIX[t.id](gm, createShell(gm, { elevated: true, fleet: (h) => byHost(g, h) }));
    if (!t.goal(g)) F("SOLVABLE " + t.id + ": the known fix does not meet the goal");

    /* ---- SIX: close question and moves ---- */
    const six = (list, what) => {
      if (list.length !== 6) F("SIX " + t.id + " " + what + ": " + list.length + " options, not 6");
      if (list.filter((x) => x.correct).length !== 1) F("SIX " + t.id + " " + what + ": not exactly one right answer");
      list.filter((x) => !x.correct).forEach((x) => { if (!String(x.why || "").trim()) F("SIX " + t.id + " " + what + ": wrong option has no reason: " + x.label); });
      if (new Set(list.map((x) => x.label)).size !== list.length) F("SIX " + t.id + " " + what + ": two options share a label");
    };
    six(t.close.options, "close");
    const mv = t.moves(f); six(mv, "moves");

    /* ---- SPREAD ---- */
    const shown = D.ordered(t.close.options, t.id + "close"); pos[shown.findIndex((x) => x.correct)]++;
    movePos[D.ordered(mv, t.id + "m").findIndex((x) => x.correct)]++;
    const L = t.close.options.map((x) => x.label.length); const cl = t.close.options.find((x) => x.correct).label.length;
    if (new Set(L).size > 1) { lenQs++; if (cl === Math.max(...L) && L.filter((x) => x === cl).length === 1) longest++; }

    /* ---- NO LEAK ---- */
    const right = t.close.options.find((x) => x.correct).label.toLowerCase();
    const rightMove = mv.find((x) => x.correct).label.toLowerCase();
    [f, g].forEach((state) => {
      const h = t.hints(state);
      if (!h || h.length < 2) { F("NO LEAK " + t.id + ": hints must give rung 1 and rung 2"); return; }
      h.forEach((line, i) => {
        const s = String(line).toLowerCase();
        if (right.length > 6 && s.indexOf(right) >= 0) F("NO LEAK " + t.id + ": rung " + (i + 1) + " contains the close answer");
        if (s.indexOf(rightMove) >= 0) F("NO LEAK " + t.id + ": rung " + (i + 1) + " contains the right move");
        D.ANSWER_WORDS.forEach((re) => { if (re.test(line)) F("NO LEAK " + t.id + ": rung " + (i + 1) + " names the fix (" + re + ")"); });
      });
    });

    /* ---- NOTE ---- */
    if (!D.noteOK(t, D.NOTES[t.id]).ok) F("NOTE " + t.id + ": the model note is refused: " + D.noteOK(t, D.NOTES[t.id]).missing.join("; "));
    if (D.noteOK(t, "Fixed it.").ok) F("NOTE " + t.id + ": a two-word note is accepted");
    if (D.noteOK(t, "I looked at the computer for a while and then it was working again, so I closed it.").ok) F("NOTE " + t.id + ": a note that says nothing specific is accepted");
  });
  MAL.forEach((t) => {
    const shown = D.ordered(t.close.options, t.id + "close"); pos[shown.findIndex((x) => x.correct)]++;
    const L = t.close.options.map((x) => x.label.length); const cl = t.close.options.find((x) => x.correct).label.length;
    if (new Set(L).size > 1) { lenQs++; if (cl === Math.max(...L) && L.filter((x) => x === cl).length === 1) longest++; }
    malware(D, t, F);
  });
  const tellPos = [0, 0, 0, 0, 0, 0]; let tellLong = 0, tells = 0;
  EM.forEach((t) => {
    const shown = D.ordered(t.close.options, t.id + "close"); pos[shown.findIndex((x) => x.correct)]++;
    const L = t.close.options.map((x) => x.label.length); const cl = t.close.options.find((x) => x.correct).label.length;
    if (new Set(L).size > 1) { lenQs++; if (cl === Math.max(...L) && L.filter((x) => x === cl).length === 1) longest++; }
    t.mails.forEach((e) => { tells++; tellPos[D.ordered(e.tell.options, t.id + e.id).findIndex((x) => x.correct)]++; const ll = e.tell.options.map((x) => x.label.length), rl = e.tell.options[0].label.length; if (rl === Math.max(...ll)) tellLong++; });
    mailChecks(D, t, F);
  });
  RTR.forEach((t) => {
    const shown = D.ordered(t.close.options, t.id + "close"); pos[shown.findIndex((x) => x.correct)]++;
    const L = t.close.options.map((x) => x.label.length); const cl = t.close.options.find((x) => x.correct).label.length;
    if (new Set(L).size > 1) { lenQs++; if (cl === Math.max(...L) && L.filter((x) => x === cl).length === 1) longest++; }
    routerTicketChecks(D, t, F);
  });
  if (tells && Math.max(...tellPos) > Math.ceil(tells / 3)) F("MAIL: SPREAD: the right giveaway sits in one slot " + Math.max(...tellPos) + " times of " + tells + " (" + tellPos.join(" ") + ")");
  if (tells && tellLong > Math.ceil(tells / 3)) F("MAIL: SPREAD: the right giveaway is the longest option in " + tellLong + " of " + tells + " emails");
  if (Math.max(...pos) > Math.ceil(T.length / 3)) F("SPREAD: the right close answer sits in one slot " + Math.max(...pos) + " times of " + T.length + " (" + pos.join(" ") + ")");
  if (Math.max(...movePos) > 4) F("SPREAD: the right move sits in one slot " + Math.max(...movePos) + " times of 12 (" + movePos.join(" ") + ")");
  if (longest > Math.ceil(lenQs / 3)) F("SPREAD: the right close answer is the longest option in " + longest + " of " + lenQs + " questions");

  /* ---- LADDER ---- */
  const want = [0, 0, 0, 1, 2, 3, 3, 3, 3, 3];
  want.forEach((w, n) => { if (D.rungFor(n) !== w) F("LADDER: guess " + n + " gives rung " + D.rungFor(n) + ", should be " + w); });
  APP.forEach((t) => {
    const E = D.createEngine(memStore()); E.openTicket(t.id);
    E.T().guesses = 7; const g = E.guidance();
    if (g.rung !== 3 || !g.moves) { F("LADDER " + t.id + ": seven guesses did not give rung 3 moves"); return; }
    const alive = g.moves.filter((x) => !x.struck);
    if (alive.length !== 2) F("LADDER " + t.id + ": rung 3 leaves " + alive.length + " moves alive, not 2");
    if (!alive.some((x) => x.correct)) F("LADDER " + t.id + ": rung 3 strikes the right move");
    g.moves.filter((x) => x.struck).forEach((x) => { if (!x.why) F("LADDER " + t.id + ": a struck move has no reason"); });
    if (JSON.stringify(g).toLowerCase().indexOf("the answer is") >= 0) F("LADDER " + t.id + ": a rung says 'the answer is'");
    /* the close form's rung 3, after the student has ruled four out themselves */
    const g2 = D.createEngine(memStore()); g2.openTicket(t.id); const st = g2.T();
    const sol = g2.fleet(); D.FIX[t.id](sol[t.machine], createShell(sol[t.machine], { elevated: true, fleet: (h) => byHost(sol, h) }));
    if (!g2.submit(t.outcome).ok) { F("LADDER " + t.id + ": submit refused after the known fix"); return; }
    t.close.options.filter((x) => !x.correct).slice(0, 4).forEach((x) => g2.pick(x.label));
    const gc = g2.guidance();
    if (gc.rung !== 2) F("LADDER " + t.id + ": four wrong picks give rung " + gc.rung + ", should be 2");
    t.close.options.filter((x) => !x.correct).slice(4).forEach((x) => g2.pick(x.label));
    const g5 = g2.guidance(); const struck = Object.keys(g5.strike || {});
    if (g5.rung !== 3 || struck.length !== 4) F("LADDER " + t.id + ": five wrong picks did not strike four");
    if (struck.some((l) => t.close.options.find((x) => x.label === l).correct)) F("LADDER " + t.id + ": the close hint strikes the right answer");
    if (Object.keys(st.picked).length !== 5) F("LADDER " + t.id + ": wrong picks did not all stay marked (red stays red)");
  });

  /* ---- JUDGE ---- */
  const E = D.createEngine(memStore()); E.openTicket("D1");
  const f = E.fleet(), m = f.WS1; const sh = createShell(m, { elevated: true, fleet: E.lookup });
  const run = (line) => { const b = E.before(); const res = sh.run(line); E.onAct({ type: "cmd", line, res, elevated: true, before: b }); return E.T().guesses; };
  let n = E.T().guesses;
  ["dir", "tasklist", "help", "copy /?", "xyzzy", "echo %PATH%", "ipconfig", "hostname"].forEach((c) => { if (run(c) !== n) F("JUDGE: '" + c + "' counted as a guess"); });
  E.onAct({ type: "launch", app: "Testing", res: M.launchApp(m, "Testing") }); if (E.T().guesses !== n) F("JUDGE: running the program to test it counted as a guess");
  E.onAct({ type: "view-log", log: "Application" }); if (E.T().guesses !== n) F("JUDGE: reading Event Viewer counted as a guess");
  n = run('robocopy \\\\WS4-FIN\\C$\\Windows\\System32 "C:\\Program Files (x86)\\Testing" msvcp100.dll');
  if (n !== 1) F("JUDGE: the sim's old answer (robocopy from System32) did not count");
  if (M.launchApp(clone(m), "Testing").kind !== "bitness") F("JUDGE: the old answer did not give 0xc000007b");
  n = run("regsvr32 msvcp100.dll"); if (n !== 2) F("JUDGE: regsvr32 did not count");
  { const keep = E.T().guesses; E.T().guesses = 7; const gt = E.guidance();
    (gt.moves || []).filter((x) => /^(robocopy|regsvr32)/i.test(x.label)).forEach((x) => { if (!x.struck) F("LADDER: rung 3 leaves alive a move the student already tried and saw fail: " + x.label); });
    E.T().guesses = keep; }
  n = run('del "C:\\Program Files (x86)\\Testing\\msvcp100.dll"'); if (n !== 2) F("JUDGE: deleting the file you just put there counted as a guess");
  n = run('copy \\\\WS4-FIN\\C$\\Windows\\SysWOW64\\msvcp100.dll "C:\\Program Files (x86)\\Testing"');
  if (n !== 2) F("JUDGE: copying the right (32-bit) file counted as a guess — it is progress");
  const E2 = D.createEngine(memStore()); E2.openTicket("L1");
  const sh2 = createShell(E2.fleet().WS4, { elevated: false, fleet: E2.lookup }); const b2 = E2.before();
  const res2 = sh2.run('copy \\\\WS1-HR\\C$\\Windows\\SysWOW64\\msvcp100.dll "C:\\Program Files (x86)\\Testing"');
  E2.onAct({ type: "cmd", line: "copy", res: res2, before: b2 });
  if (res2.kind !== "refused" || E2.T().guesses !== 1) F("JUDGE: a refused copy (Access is denied) did not count");
  E2.onAct({ type: "catalogue-admin", key: "vc2010x86", before: E2.before() }); if (E2.T().guesses !== 2) F("JUDGE: a Tier 2 action on a Tier 1 ticket did not count");
  const r2 = E2.submit("resolve"); if (r2.ok || E2.T().guesses !== 3) F("JUDGE: resolving while still broken did not count, or was accepted");

  /* ---- SNAPSHOT ---- */
  const store = memStore(); const E3 = D.createEngine(store); E3.openTicket("D5");
  const k0 = JSON.stringify(E3.fleet().WS2.fs);
  const sh3 = createShell(E3.fleet().WS2, { elevated: true, fleet: E3.lookup }); const b3 = E3.before();
  E3.onAct({ type: "cmd", line: "del", res: sh3.run('del "C:\\Windows\\SysWOW64\\msvcp100.dll"'), before: b3 });
  const g3 = E3.T().guesses; if (g3 !== 1) F("SNAPSHOT: deleting a system runtime on D5 did not count");
  E3.revert();
  if (JSON.stringify(E3.fleet().WS2.fs) !== k0) F("SNAPSHOT: revert did not put the machine back");
  if (E3.T().guesses !== g3) F("SNAPSHOT: revert reset the hint count (it must carry on)");
  const E4 = D.createEngine(store);
  if (!E4.ticket() || E4.ticket().id !== "D5" || E4.T().guesses !== g3) F("SNAPSHOT: the session did not survive a reload");

  examChecks(D, F);
  routerChecks(D, F);
  chatChecks(D, F);
  extraChecks(D, F);
  return fails;
}

/* ---- CHAT: the Help Desk chats ---- */
const SIM_REPLIES = {
  CE1: { keys: ["Good afternoon, I will be happy to assist you with your email.", "I will be glad to help, but first I need to know what type of device you are using.", "Let's take a look at your phone settings.", "Please change the port number on your mail settings to 993."],
    wrong: ["Try restarting your phone.", "Are you sure it's not your internet?", "Check if your inbox is full.", "Did you charge your phone?", "Try toggling airplane mode.", "Blow on the SIM card.", "Switch to POP3 protocol.", "Use port 80 instead."] },
  CR1: { keys: ["I am happy to assist you today.", "Is this the first router in your office?", "Create a new password with an uppercase, a lowercase, and special character.", "Yes, reboot please."],
    wrong: ["Have you tried using the FAQ?", "You should know how to do that!", "This is wasting my time!", "Type the password printed on the label on the bottom of the router.", "Use Summer21 as the administrative password so we can assist you in the future.", "Leave the password field blank for easy access in the future.", "If you think you should, you can.", "No, it is not necessary."] }
};
/* the fault each chat starts with */
const CHAT_FAULT = {
  CE1: (f, t) => !MBM.works(D_.MB.get(f, t.id)), CE2: (f, t) => !MBM.outgoing(D_.MB.get(f, t.id)).ok, CE3: (f, t) => D_.MB.get(f, t.id).account.proto === "POP3",
  CE4: (f, t) => !MBM.incoming(D_.MB.get(f, t.id)).ok, CE5: (f, t) => !MBM.incoming(D_.MB.get(f, t.id)).ok, CE6: (f, t) => !MBM.incoming(D_.MB.get(f, t.id)).ok,
  CR1: (f, t) => RT.defaultPass(RT.get(f, t.id)), CR2: (f, t) => { const r = RT.get(f, t.id); return r.running.wifi.pass === r.sticker.wifiPass; },
  CR3: (f, t) => RT.get(f, t.id).running.wifi.pass === "92series1234", CR4: (f, t) => { const r = RT.get(f, t.id); return r.fw !== r.fwLatest; },
  CR5: (f, t) => { const r = RT.get(f, t.id); return r.devices.some((d) => !RT.joins(r, d).ok); }, CR6: (f, t) => RT.interference(RT.get(f, t.id)).length > 0
};
let D_ = null;
function chatDrive(D, t, f) {
  /* the right replies, and each hands-on check done the way a student would */
  let guard = 0;
  while (!t.goal(f) && guard++ < 40) {
    const it = D.CH.current(f, t); if (!it) break;
    if (it.type === "reply") { D.CH.reply(f, t, it.right.label); continue; }
    const p = D.MB.get(f, t.id), r = RT.get(f, t.id);
    if (it.act === "compare") { MBM.note(p, "view-phone"); MBM.note(p, "view-server"); }
    else if (it.act === "sync") { MBM.sync(p); MBM.note(p, "student-sync"); }
    else if (it.act === "view") RT.note(f, r, "view", { tab: it.tab });
    if (t.react) t.react({ type: "look" }, f);
  }
}
/* ---- EXTRA: extra training, beyond the sims (owner's ruling 11) ----
   Each names its objective in the doc's own words; X1, backup and
   recovery: the fault is on the machine, the right path closes it with
   no wrong moves, the near misses count, rung 3 leaves the right move
   alive at every stage, no hint names the move, the note check holds. */
const OBJECTIVES = { "Backup and recovery": ["Operational procedures", "setting up workstation backups and recovery processes"] };
function extraChecks(D, F) {
  const X = D.TICKETS.filter((t) => t.extra);
  if (!X.length) { F("EXTRA: no extra-training ticket"); return; }
  X.forEach((t) => {
    const o = OBJECTIVES[t.topic];
    if (!o || o[0] !== t.domain || o[1] !== t.objective) F("EXTRA " + t.id + ": does not name an objective in the doc's words (" + t.topic + ")");
    if (t.sim) F("EXTRA " + t.id + ": claims to come from a sim");
  });
  const t = X.find((x) => x.id === "X1"); if (!t) { F("EXTRA: X1 is missing"); return; }
  const BKP = D.BK, XT = D.XT, P = "C:\\Users\\finance\\Documents\\Q3-budget.xlsx";
  /* EXHIBITED: the file really is the wrong one, and the right copy really is there to find */
  const f = D.makeFleet(); t.setup(f); const m = f.WS4;
  const doc = () => (BKP.fileAt(f.WS4, P) || {}).doc || {};
  if (t.goal(f)) F("EXTRA X1: EXHIBITED: the goal is met before the student starts");
  if (doc().id === "q3rev") F("EXTRA X1: EXHIBITED: her spreadsheet is already the right one");
  const vs = BKP.versions(m, P);
  if (!vs.some((v) => v.file.doc.id === "q3rev")) F("EXTRA X1: EXHIBITED: Previous Versions has no copy with her work in it");
  if (!vs.length || vs[0].file.doc.id === "q3rev") F("EXTRA X1: EXHIBITED: the newest copy is the right one, so there is nothing to read");
  if (m.bk.fh.on || m.bk.fh.every <= 60) F("EXTRA X1: EXHIBITED: File History is already on, or already hourly");
  /* the engine, step by step */
  const run = (E, a, fn) => { const b = E.before(); const res = fn(E.fleet().WS4); E.onAct(Object.assign({ machine: "WS4", before: b, res }, a)); return res; };
  const right = (E) => BKP.versions(E.fleet().WS4, P).find((v) => v.file.doc.id === "q3rev").id;
  const solve = (E) => {
    run(E, { type: "doc-open" }, () => null); run(E, { type: "pv-view" }, () => null); run(E, { type: "pv-open" }, () => null);
    run(E, { type: "pv-restore" }, (w) => BKP.restoreVersion(w, P, right(E)));
    run(E, { type: "fh", op: "target" }, (w) => BKP.setTarget(w, "\\\\FS01\\Backups"));
    run(E, { type: "fh", op: "every", every: 60 }, (w) => BKP.setEvery(w, 60));
    run(E, { type: "fh", op: "on" }, (w) => BKP.turnOn(w));
    run(E, { type: "fh", op: "view" }, (w) => BKP.backupView(w));
  };
  { const E = D.createEngine(memStore()); E.openTicket("X1"); solve(E);
    if (!t.goal(E.fleet())) F("EXTRA X1: SOLVABLE: the right path does not meet the goal");
    if (E.T().guesses) F("EXTRA X1: SOLVABLE: the right path cost " + E.T().guesses + " wrong moves");
    if (!E.submit("resolve").ok) F("EXTRA X1: SOLVABLE: Resolve refused after the right path"); }
  { /* the fix without its test doesn't close it */
    const E = D.createEngine(memStore()); E.openTicket("X1"); const w = E.fleet().WS4;
    BKP.restoreVersion(w, P, right(E)); BKP.setTarget(w, "\\\\FS01\\Backups"); BKP.setEvery(w, 60); BKP.turnOn(w);
    if (t.goal(E.fleet())) F("EXTRA X1: SOLVABLE: closes without the backup ever being tested"); }
  /* JUDGE: looking never counts; the near misses do */
  const J = (label, steps, want) => { const E = D.createEngine(memStore()); E.openTicket("X1"); steps(E); const g = E.T().guesses; if (g !== want) F("EXTRA X1: JUDGE: " + label + " gave " + g + " wrong moves, should be " + want); return E; };
  J("looking (open the file, Previous Versions, open a copy, the backup view, a typo in the location)", (E) => { run(E, { type: "doc-open" }, () => null); run(E, { type: "pv-view" }, () => null); run(E, { type: "pv-open" }, () => null); run(E, { type: "fh", op: "view" }, (w) => BKP.backupView(w)); run(E, { type: "fh", op: "target" }, (w) => BKP.setTarget(w, "\\\\FS01\\Bakups")); }, 0);
  J("restoring this morning's copy", (E) => run(E, { type: "pv-restore" }, (w) => BKP.restoreVersion(w, P, BKP.versions(w, P)[0].id)), 1);
  J("restoring an older copy", (E) => run(E, { type: "pv-restore" }, (w) => BKP.restoreVersion(w, P, BKP.versions(w, P).find((v) => v.file.doc.id === "q3d1").id)), 1);
  J("System Restore", (E) => run(E, { type: "sys-restore" }, (w) => BKP.systemRestore(w, 2)), 1);
  J("the read-only Software share", (E) => run(E, { type: "fh", op: "target" }, (w) => BKP.setTarget(w, "\\\\FS01\\Software")), 1);
  J("a folder on C:", (E) => run(E, { type: "fh", op: "target" }, (w) => BKP.setTarget(w, "C:\\Backup")), 1);
  J("every 12 hours", (E) => run(E, { type: "fh", op: "every", every: 720 }, (w) => BKP.setEvery(w, 720)), 1);
  { const E = J("System Restore", (E) => run(E, { type: "sys-restore" }, (w) => BKP.systemRestore(w, 2)), 1);
    if (doc().id === "q3rev" || (BKP.fileAt(E.fleet().WS4, P).doc.id === "q3rev")) F("EXTRA X1: System Restore brought her document back: it never touches personal files"); }
  /* SIX, LADDER and NO LEAK at every stage */
  const stages = [(E) => {}, (E) => run(E, { type: "pv-restore" }, (w) => BKP.restoreVersion(w, P, right(E))), (E) => run(E, { type: "fh", op: "target" }, (w) => BKP.setTarget(w, "\\\\FS01\\Backups")), (E) => run(E, { type: "fh", op: "every", every: 60 }, (w) => BKP.setEvery(w, 60)), (E) => run(E, { type: "fh", op: "on" }, (w) => BKP.turnOn(w)), (E) => run(E, { type: "fh", op: "view" }, (w) => BKP.backupView(w))];
  const E = D.createEngine(memStore()); E.openTicket("X1"); const seen = new Set();
  stages.forEach((go) => {
    go(E); const s = XT.stage(E.fleet().WS4); seen.add(s);
    const mv = t.moves(E.fleet());
    if (mv.length !== 6 || mv.filter((x) => x.correct).length !== 1 || mv.some((x) => !x.correct && !String(x.why || "").trim()) || new Set(mv.map((x) => x.label)).size !== 6) F("EXTRA X1: SIX: the moves at stage " + s + " are not six, one right, a reason on each wrong one");
    const rm = mv.find((x) => x.correct).label.toLowerCase();
    t.hints(E.fleet()).forEach((h, i) => { if (String(h).toLowerCase().indexOf(rm) >= 0) F("EXTRA X1: NO LEAK: rung " + (i + 1) + " at stage " + s + " contains the right move"); [/previous versions/i, /file history/i, /\\\\fs01\\backups/i, /every hour/i, /3 october/i, /11:58/].forEach((re) => { if (re.test(h)) F("EXTRA X1: NO LEAK: rung " + (i + 1) + " at stage " + s + " names the answer (" + re + ")"); }); });
    const saved = E.T().guesses; E.T().guesses = 7; const g = E.guidance(); E.T().guesses = saved;
    const alive = (g.moves || []).filter((x) => !x.struck);
    if (g.rung !== 3 || alive.length !== 2 || !alive.some((x) => x.correct)) F("EXTRA X1: LADDER: rung 3 at stage " + s + " does not leave two alive with the right one among them");
  });
  if (seen.size !== 6) F("EXTRA X1: the stages were not all reached: " + Array.from(seen).join(", "));
  /* the close question */
  const co = t.close.options;
  if (co.length !== 6 || co.filter((x) => x.correct).length !== 1 || co.some((x) => !x.correct && !x.why)) F("EXTRA X1: SIX: the close question is not six, one right, a reason on each wrong one");
  const L = co.map((x) => x.label.length), cl = co.find((x) => x.correct).label.length;
  if (cl === Math.max(...L)) F("EXTRA X1: SPREAD: the right close answer is the longest option");
  /* NOTE */
  if (!D.noteOK(t, D.NOTES.X1).ok) F("EXTRA X1: NOTE: the model note is refused: " + D.noteOK(t, D.NOTES.X1).missing.join("; "));
  if (D.noteOK(t, "I looked at the computer for a while and then it was working again, so I closed it.").ok) F("EXTRA X1: NOTE: a note that says nothing specific is accepted");
}
function chatChecks(D, F) {
  D_ = D;
  const CHATS = D.TICKETS.filter((t) => t.kind === "chat");
  if (CHATS.length !== 12) F("CHAT SHAPE: " + CHATS.length + " chats, not 12");
  CHATS.forEach((t) => {
    /* ---- the pools ---- */
    t.chat.forEach((it, i) => {
      if (it.type !== "reply") return;
      const labels = [it.right.label].concat(it.wrong.map((w) => w.label));
      if (!it.right.correct || it.wrong.length !== 8 || new Set(labels).size !== 9) F("CHAT POOL " + t.id + " step " + i + ": not one right and eight different wrong replies");
      it.wrong.forEach((w) => { if (w.correct || !w.reaction || !w.why) F("CHAT POOL " + t.id + " step " + i + ": \"" + w.label + "\" has no reaction or no reason"); });
      /* no hint names the reply */
      (it.h || []).forEach((h) => { if (h.indexOf(it.right.label) >= 0) F("CHAT LEAK " + t.id + " step " + i + ": a hint gives the reply away"); });
      if (!it.h || it.h.length < 2) F("CHAT LEAK " + t.id + " step " + i + ": the step has no two rungs of hints");
    });
    /* ---- the sims' own replies and keys ---- */
    const sim = SIM_REPLIES[t.id];
    if (sim) {
      const replies = t.chat.filter((it) => it.type === "reply");
      sim.keys.forEach((k, i) => { if (!replies[i] || replies[i].right.label !== k) F("CHAT SIM " + t.id + ": step " + (i + 1) + "'s key isn't the sim's: \"" + k + "\""); });
      const all = [].concat.apply([], replies.map((it) => it.wrong.map((w) => w.label)));
      sim.wrong.forEach((w) => { if (all.indexOf(w) < 0) F("CHAT SIM " + t.id + ": the sim's own reply \"" + w + "\" is missing"); });
    }
    /* ---- the fault is there, and the right way finishes it cleanly ---- */
    let f = D.makeFleet(); t.setup(f);
    if (t.goal(f)) F("CHAT EXHIBITED " + t.id + ": finished before the student starts");
    if (CHAT_FAULT[t.id] && !CHAT_FAULT[t.id](f, t)) F("CHAT EXHIBITED " + t.id + ": the customer's fault isn't there at the start");
    chatDrive(D, t, f);
    if (!t.goal(f)) F("CHAT SOLVABLE " + t.id + ": the right replies and checks don't finish it (stuck at item " + D.CH.get(f, t.id).step + ")");
    if (CHAT_FAULT[t.id] && CHAT_FAULT[t.id](f, t)) F("CHAT SOLVABLE " + t.id + ": finished, but the customer's fault is still there");
    /* ---- a wrong reply ---- */
    f = D.makeFleet(); t.setup(f);
    const c = D.CH.get(f, t.id), first = t.chat[0], m0 = c.mood;
    /* the six on every step, fresh, before anything is ruled out */
    const before = JSON.stringify(t.chat.map((it, i) => D.CH.shown(t, c, i).map((x) => x.label)));
    const shown = D.CH.shown(t, c, 0);
    if (shown.length !== 6 || shown.filter((x) => x.correct).length !== 1) F("CHAT SHOWN " + t.id + ": not six replies with the right one among them");
    const w = shown.filter((x) => !x.correct)[0];
    const o = D.CH.reply(f, t, w.label); const j = t.judge({ type: "chat-reply", correct: o.correct, why: o.why }, f) || {};
    if (!j.guess) F("CHAT WRONG " + t.id + ": a wrong reply doesn't count");
    if (c.step !== 0) F("CHAT WRONG " + t.id + ": a wrong reply moves the chat on");
    if ((c.out[0] || []).indexOf(w.label) < 0 || D.CH.shown(t, c, 0).map((x) => x.label).indexOf(w.label) < 0) F("CHAT WRONG " + t.id + ": a wrong reply doesn't stay red on screen");
    if (c.mood <= m0 && m0 < D.CH.MOODS.length - 1) F("CHAT WRONG " + t.id + ": a wrong reply doesn't upset the customer");
    if (!D.CH.transcript(f, t).some((l) => l.wrong && l.text === w.label)) F("CHAT WRONG " + t.id + ": the wrong reply isn't kept in the conversation");
    /* ---- rung 3 ---- */
    const g = t.strikeNow(f, (opts, picked) => { const right = opts.filter((x) => x.correct)[0]; const pool = opts.filter((x) => !x.correct && !picked[x.label]); return (pool.length ? pool : opts.filter((x) => !x.correct))[0].label; });
    const alive = D.CH.shown(t, c, 0).filter((x) => !g.strike[x.label]);
    if (Object.keys(g.strike).length !== 4 || alive.length !== 2 || !alive.some((x) => x.correct)) F("CHAT LADDER " + t.id + ": rung 3 doesn't strike four and leave the right reply among two");
    /* ---- starting again ---- */
    chatDrive(D, t, f);
    D.CH.restart(f, t);
    if (c.step !== 0 || Object.keys(c.out).length) F("CHAT RESTART " + t.id + ": starting again doesn't go back to the start");
    if (JSON.stringify(t.chat.map((it, i) => D.CH.shown(t, c, i).map((x) => x.label))) === before) F("CHAT RESTART " + t.id + ": starting again shows the same replies");
    const f0 = D.makeFleet(); t.setup(f0);
    const thing = (ff) => JSON.stringify(t.channel === "email" ? D.MB.get(ff, t.id).account : (({ running, saved, fw }) => ({ running, saved, fw }))(RT.get(ff, t.id)));
    if (thing(f) !== thing(f0)) F("CHAT RESTART " + t.id + ": starting again doesn't put the customer's " + (t.channel === "email" ? "phone" : "router") + " back");
    /* ---- the note ---- */
    if (!D.noteOK(t, D.NOTES[t.id] || "").ok) F("CHAT NOTE " + t.id + ": a good note is refused");
    if (D.noteOK(t, "Helped the customer in the chat and the problem is fixed now, all good.").ok) F("CHAT NOTE " + t.id + ": a note that says nothing specific is accepted");
  });
}

/* ------------------------------------------------------------------ */
/* Malware tickets                                                     */
/* ------------------------------------------------------------------ */
const ALL7 = ["WS1", "WS2", "WS3", "WS4", "WS5", "FS01", "MAIL01"];
/* CompTIA's steps, done the way a student would, each through the engine
   so it is judged. Returns the guesses it cost (should be none). */
export function cleanUp(E, how) {
  how = how || {};
  const act = (a, fn) => { const b = E.before(); const r = fn(); E.onAct(Object.assign({ before: b, res: r }, a)); return r; };
  const f = () => E.fleet();
  ALL7.forEach((id) => { const m = f()[id]; M.note(m, "opened", { app: "taskmgr" }); E.onAct({ type: "open", app: "taskmgr", machine: id }); M.note(m, "view-log", { log: "System" }); E.onAct({ type: "view-log", machine: id }); });
  const hit = ALL7.filter((id) => MW.infected(f()[id]));
  hit.forEach((id) => { if (!how.noQuarantine) act({ type: "cable", op: "off", machine: id }, () => MW.setCable(f()[id], false)); });
  hit.forEach((id) => {
    const m = () => f()[id];
    if (!MW.server(m()) && !how.keepRestore) act({ type: "restore", op: "off", machine: id }, () => MW.setRestore(m(), false));
    MW.insertUSB(m()); act({ type: "av", op: "defs", how: "usb", machine: id }, () => MW.updateDefs(m(), "usb"));
    act({ type: "av", op: "scan", kind: "offline", machine: id }, () => MW.offlineScan(m()));
    act({ type: "av", op: "schedule", machine: id }, () => MW.setSchedule(m(), true));
    act({ type: "cable", op: "on", machine: id }, () => MW.setCable(m(), true));
    act({ type: "updates", machine: id }, () => MW.runUpdates(m()));
    if (!MW.server(m())) { act({ type: "restore", op: "on", machine: id }, () => MW.setRestore(m(), true)); act({ type: "restore", op: "point", machine: id }, () => MW.createPoint(m(), "After malware removal")); }
  });
  return E.T().guesses;
}
/* The known fix for each router ticket, done as a student would through
   the 92 Series app and the phone, every step sent through the engine. */
export const RFIX = {
  R1: (a) => { a.view("admin"); a.pass("admin", "Brooks#Ledger-2026"); a.save(); a.reboot(); },
  R2: (a) => { a.view("admin"); a.pass("admin", "Smile&Molar-Desk9"); a.save(); a.reboot(); },
  R3: (a) => { a.view("status"); a.ask("ports"); a.ask("move"); },
  R4: (a) => { a.view("wireless"); a.edit("wifi.pass", "Blue-Harbor#88"); a.save(); a.reboot(); },
  R5: (a) => { a.view("status"); a.ask("letter"); },
  R6: (a) => { a.view("status"); a.ask("lights"); a.ask("adapter"); a.ask("socket"); }
};
/* the WiFi tickets: sign in at 192.168.1.1, set the sim's five settings */
const WSET = { W1: ["MainOffice1", "Ma50n1SB35t!", "WPA3", "2.4", 6], W2: ["Rafiki-Staff", "T3amR@fiki2026", "WPA3", "2.4", 11], W3: ["Conference-5G", "M33t1ng$Room!", "WPA3", "5", 36], W4: ["MainOffice1", "Ma50n1SB35t!", "WPA2/WPA3", "2.4", 6], W5: ["Rafiki-Guest", "W3lc0me-Guest!", "WPA3", "2.4", 1], W6: ["MainOffice1", "Ma50n1SB35t!", "WPA3", "2.4", 11] };
/* Port Forwarding: forward the service to the LAN device, the console to the
   screened-subnet port and set as its host, the Wi-Fi secured, save, restart,
   then the customer tests both from outside */
const PSET = { P1: ["3389", "192.168.10.20", "10.100.0.50", "WPA2"], P2: ["3389", "192.168.50.20", "10.20.0.50", "WPA2"], P3: ["22", "192.168.1.20", "172.16.5.50", "WPA2"], P4: ["5900", "192.168.20.20", "10.0.9.50", "WPA2"], P5: ["3389", "192.168.88.20", "10.88.0.50", "WPA2"], P6: ["3389", "192.168.30.20", "10.30.0.50", "WPA3"] };
Object.keys(PSET).forEach((id) => { const v = PSET[id]; RFIX[id] = (a) => { a.view("status"); a.ask("console-port"); a.view("forward"); a.fwd({ name: "Remote", proto: "TCP", ext: v[0], ip: v[1], port: v[0] }); a.edit("screened", v[2]); a.view("wireless"); a.edit("wifi.security", v[3]); a.save(); a.reboot(); a.ask("test-remote"); a.ask("test-game"); }; });
/* Neighboring Routers: read the scan, set the sim's six, the allowed list */
const NSET = { N1: ["HomeWiFi", "MyCCR0ck2!", true, 11], N2: ["Garcia-Home", "Casa#2026Net", true, 1], N3: ["BlueHouse", "Bl#eDoor55", true, 6], N4: ["HomeWiFi", "MyCCR0ck2!", false, 11], N5: ["Ortiz_Net", "Recept10n!Home", true, 1], N6: ["Patel5", "D3v@Home!!", true, 6] };
Object.keys(NSET).forEach((id) => { const v = NSET[id]; RFIX[id] = (a) => { a.view("status"); a.view("wireless"); a.edit("wifi.ssid", v[0]); a.edit("wifi.pass", v[1]); a.edit("wifi.security", "WPA3"); a.edit("wifi.width", 20); a.edit("wifi.channel", v[3]); if (v[2]) { a.edit("wifi.mac", true); a.allowApproved(); } a.save(); a.reboot(); }; });
/* Wireless Reliability: the lab's keyed band, channel plan and security (and
   in WR1, the microwave moved across the room first) */
const RSET = { WR1: ["2.4", 11], WR2: ["5", 36], WR3: ["dual", "auto"], WR4: ["5", 149], WR5: ["2.4", 6], WR6: ["dual", "auto"] };
Object.keys(RSET).forEach((id) => { const v = RSET[id]; RFIX[id] = (a) => { if (id === "WR1") { a.sign("admin", "Clos3t-AP-2026"); a.mw(38.5, 30.5); } a.view("status"); a.view("wireless"); a.edit("wifi.band", v[0]); a.edit("wifi.channel", v[1]); a.edit("wifi.security", "WPA3"); a.save(); a.reboot(); }; });
Object.keys(WSET).forEach((id) => { const v = WSET[id]; RFIX[id] = (a) => { a.sign("admin", id === "W6" ? "admin" : "Clos3t-AP-2026"); a.view("wireless"); a.edit("wifi.ssid", v[0]); a.edit("wifi.pass", v[1]); a.edit("wifi.security", v[2]); a.edit("wifi.band", v[3]); a.edit("wifi.channel", v[4]); a.save(); a.reboot(); }; });
function routerActs(E, t) {
  const R = RT, r = () => R.get(E.fleet(), t.id), f = () => E.fleet();
  const go = (type, fn, extra) => { const b = E.before(); const res = fn ? fn() : null; E.onAct(Object.assign({ type: type, machine: "TECH", before: b }, extra || {}, res && typeof res === "object" ? { ok: res.ok, lost: res.lost, text: res.text } : {})); return E.T().guesses; };
  return {
    allowApproved: () => go("router-edit", () => { r().devices.filter((d) => d.approved).forEach((d) => R.allow(f(), r(), d.mac)); }, { path: "wifi.allowed" }),
    fwd: (x) => go("router-edit", () => { R.addForward(f(), r(), x); }, { path: "forwards" }),
    mw: (x, z) => go("router-microwave", () => R.moveMicrowave(f(), r(), x, z)),
    sign: (u, pw) => go("router-sign-in", () => R.signIn(f(), r(), u, pw)),
    view: (tab) => go("router-view", () => { R.note(f(), r(), "view", { tab: tab }); }, { tab: tab }),
    edit: (k, v) => go("router-edit", () => { R.edit(f(), r(), k, v); }),
    pass: (cur, nw) => go("router-admin-pass", () => R.setAdminPass(f(), r(), cur, nw, nw)),
    save: () => go("router-save", () => R.save(f(), r())),
    reboot: () => go("router-reboot", () => R.reboot(f(), r())),
    factory: () => go("router-factory", () => R.factoryReset(f(), r())),
    ask: (what) => { const lost = what === "power" && RT.dirty(r()); return go("router-ask", () => { R.ask(f(), r(), what); }, { what: what, lost: lost }); }
  };
}
function routerTicketChecks(D, t, F) {
  const P = "ROUTER " + t.id + ": ";
  /* EXHIBITED */
  const f = D.makeFleet(); t.setup(f); const r = RT.get(f, t.id);
  if (!r) { F(P + "EXHIBITED: no router is set up"); return; }
  if (t.goal(f)) F(P + "EXHIBITED: the goal is met before the student starts");
  const fault = { R1: () => RT.defaultPass(r), R2: () => RT.defaultPass(r), R3: () => RT.wanStatus(r).code === "cable", R4: () => r.running.wifi.pass !== "Blue-Harbor#88", R5: () => RT.wanStatus(r).code === "pppoe", R6: () => RT.wanStatus(r).code === "power" }[t.id] || (/^P\d$/.test(t.id) ? () => !RT.remoteTest(r).ok && !RT.natTest(r).open : null) || (/^N\d$/.test(t.id) ? () => RT.interference(r).length > 0 : null) || (/^WR\d$/.test(t.id) ? () => r.devices.some((d) => !RT.joins(r, d).ok || RT.slowWhy(r, d)) : null) || (t.kind === "wifi" ? () => r.devices.some((d) => !RT.joins(r, d).ok) || RT.crowded(r) : null);
  if (!fault || !fault()) F(P + "EXHIBITED: the router doesn't show the fault the ticket describes");
  /* KEY: a WiFi ticket asks for exactly what the sim's exam view keys */
  if (t.sim === "WiFi Access Point Configuration") { const ex = (D.EXAMS || EXAMS).find((e) => e.id === "wifi"), i = D.TICKETS.filter((x) => x.sim === t.sim).indexOf(t), v = ex.variants[i], T = t.target;
    const want = { ssid: T.ssid, pass: T.pass, sec: { "WPA2/WPA3": "WPA2/WPA3 (transition)" }[T.sec] || T.sec, band: T.band + " GHz", chan: String(T.chan) };
    Object.keys(want).forEach((k) => { const fld = v.fields.find((x) => x.id === k); if (!fld || PQ.rightValue(fld) !== want[k]) F(P + "KEY: " + k + " is " + want[k] + " on the ticket but " + (fld ? PQ.rightValue(fld) : "missing") + " in exam practice " + v.id); }); }
  /* KEY: a Port Forwarding ticket matches its exam practice: the service's
     port, the Wi-Fi security, and which device goes where (as ruled) */
  if (t.sim === "Port Forwarding Configuration") { const ex = (D.EXAMS || EXAMS).find((e) => e.id === "pf"), i = D.TICKETS.filter((x) => x.sim === t.sim).indexOf(t), v = ex.variants[i], T = t.target;
    const want = { rule: "Allow TCP Any " + T.svc, enc: T.sec === "WPA3" ? "WPA3 Personal (SAE)" : "WPA2 PSK", place: "LAN: " + T.pc + " · Screened subnet: " + T.gc };
    Object.keys(want).forEach((k) => { const fld = v.fields.find((x) => x.id === k); if (!fld || PQ.rightValue(fld) !== want[k]) F(P + "KEY: " + k + " is " + want[k] + " on the ticket but " + (fld ? PQ.rightValue(fld) : "missing") + " in exam practice " + v.id); }); }
  /* KEY: a Neighboring Routers ticket matches its exam practice */
  if (t.sim === "Neighboring Routers Configuration") { const ex = (D.EXAMS || EXAMS).find((e) => e.id === "nr"), i = D.TICKETS.filter((x) => x.sim === t.sim).indexOf(t), v = ex.variants[i], T = t.target;
    const want = { ssid: T.ssid, pass: T.pass, sec: "WPA3", width: "20 MHz", mac: T.mac ? "Enabled" : "Disabled", chan: String(T.chan) };
    Object.keys(want).forEach((k) => { const fld = v.fields.find((x) => x.id === k); if (!fld || PQ.rightValue(fld) !== want[k]) F(P + "KEY: " + k + " is " + want[k] + " on the ticket but " + (fld ? PQ.rightValue(fld) : "missing") + " in exam practice " + v.id); });
    const rn = RT.get((() => { const f2 = D.makeFleet(); t.setup(f2); return f2; })(), t.id); v.neighbours.forEach((n, j) => { if (!rn.neighbours[j]) F(P + "KEY: " + n.name + " is missing from the scan"); else if (String(rn.neighbours[j].channel) !== String(n.channel)) F(P + "KEY: " + n.name + " is on channel " + rn.neighbours[j].channel + " in the scan but " + n.channel + " in exam practice " + v.id); }); }
  /* KEY: a Wireless Reliability ticket matches its exam practice: band,
     channel plan and security are the lab's checkpoints 2 to 4 */
  if (t.sim === "Wireless Reliability Decision Lab") { const ex = (D.EXAMS || EXAMS).find((e) => e.id === "wr"), i = D.TICKETS.filter((x) => x.sim === t.sim).indexOf(t), v = ex.variants[i], T = t.target;
    const want = { band: { "2.4": "2.4 GHz", "5": "5 GHz", dual: "Dual-band with client steering" }[T.band], channel: T.chan === "auto" ? "Allow automatic channel selection only" : "Use a non-overlapping channel", security: "Modern encrypted security with strong authentication" };
    Object.keys(want).forEach((k) => { const fld = v.fields.find((x) => x.id === k); if (!fld || PQ.rightValue(fld) !== want[k]) F(P + "KEY: " + k + " is " + want[k] + " on the ticket but " + (fld ? PQ.rightValue(fld) : "missing") + " in exam practice " + v.id); }); }
  /* NO LEAK in the refusal: Resolve before it's done says what Mason sees,
     never the setting that's wrong */
  if (t.sim === "WiFi Access Point Configuration") { const T = t.target, E = D.createEngine(memStore()); E.openTicket(t.id); const a = routerActs(E, t), rr = () => RT.get(E.fleet(), t.id);
    const bad = [T.band + " GHz", T.sec, "channel " + T.chan, "the band", "the channel", "the security"];
    const look = () => { const m = String(t.notReady(E.fleet()) || ""); bad.forEach((w) => { if (m.indexOf(w) >= 0) F(P + "NO LEAK: Resolve's refusal names \"" + w + "\": " + m); }); };
    look(); a.view("wireless"); a.edit("wifi.ssid", T.ssid); a.edit("wifi.pass", T.pass); a.save(); a.reboot(); look(); }
  /* SOLVABLE, with no wrong moves */
  { const E = D.createEngine(memStore()); E.openTicket(t.id); RFIX[t.id](routerActs(E, t));
    if (!t.goal(E.fleet())) F(P + "SOLVABLE: the known fix does not meet the goal (" + (t.notReady(E.fleet()) || "") + ")");
    if (E.T().guesses) F(P + "SOLVABLE: the known fix cost " + E.T().guesses + " wrong move(s): " + E.T().says.filter(Boolean).join(" | "));
    if (!E.submit(t.outcome).ok) F(P + "SOLVABLE: " + t.outcome + " refused after the known fix");
    const other = t.outcome === "resolve" ? "escalate" : "resolve"; const E2 = D.createEngine(memStore()); E2.openTicket(t.id); RFIX[t.id](routerActs(E2, t));
    if (E2.submit(other).ok) F(P + "SOLVABLE: " + other + " was accepted too"); }
  /* PARTIAL: the fix without its last step doesn't close it (a goal that's too easy) */
  { const E = D.createEngine(memStore()); E.openTicket(t.id); const a = routerActs(E, t), steps = [];
    const rec = {}; Object.keys(a).forEach((k) => { rec[k] = (...x) => steps.push([k, x]); }); RFIX[t.id](rec);
    steps.slice(0, -1).forEach(([k, x]) => a[k](...x));
    if (t.goal(E.fleet())) F(P + "PARTIAL: the fix without its last step (" + steps[steps.length - 1][0] + ") already meets the goal"); }
  /* PARTIAL: with a microwave in the office, the settings alone don't close it */
  if (r.microwave) { const E = D.createEngine(memStore()); E.openTicket(t.id); const a = routerActs(E, t), steps = [];
    const rec = {}; Object.keys(a).forEach((k) => { rec[k] = (...x) => steps.push([k, x]); }); RFIX[t.id](rec);
    steps.filter(([k]) => k !== "mw").forEach(([k, x]) => a[k](...x));
    if (t.goal(E.fleet())) F(P + "PARTIAL: the right settings close it with the microwave still beside the access point"); }
  /* JUDGE: looking never counts; a factory reset, a lost change and a harmful save do */
  { const E = D.createEngine(memStore()); E.openTicket(t.id); const a = routerActs(E, t);
    a.view("status"); a.view("wireless"); a.edit("wifi.channel", 6); if (E.T().guesses) F(P + "JUDGE: looking, or typing without saving, counted");
    if (a.reboot() !== 1) F(P + "JUDGE: a restart that threw away typed changes did not count");
    if (a.factory() !== 2) F(P + "JUDGE: a factory reset did not count");
    if (!RT.defaultPass(RT.get(E.fleet(), t.id))) F(P + "JUDGE: a factory reset didn't put the sticker password back");
    E.revert(); if (RT.defaultPass(RT.get(E.fleet(), t.id)) !== RT.defaultPass(r)) F(P + "JUDGE: revert didn't put the router back");
    const r0 = RT.get(E.fleet(), t.id), on = r0.devices.filter((d) => RT.joins(r0, d).ok).map((d) => d.name);
    a.view("wireless"); a.edit("wifi.security", "WPA3"); const g = E.T().guesses; a.save(); a.reboot();
    const rr = RT.get(E.fleet(), t.id); if (rr.devices.some((d) => on.indexOf(d.name) >= 0 && !RT.joins(rr, d).ok) && E.T().guesses <= g) F(P + "JUDGE: a saved change that knocked a connected device off did not count"); }
  /* SIX, NO LEAK, NOTE */
  const six = (list, what) => {
    if (list.length !== 6 || list.filter((x) => x.correct).length !== 1) F(P + "SIX: " + what + " is not six with one right");
    list.filter((x) => !x.correct).forEach((x) => { if (!String(x.why || "").trim()) F(P + "SIX: " + what + ": a wrong option has no reason: " + x.label); });
    if (new Set(list.map((x) => x.label)).size !== list.length) F(P + "SIX: " + what + " repeats an option");
  };
  six(t.close.options, "close"); six(t.moves(f), "moves");
  const right = t.close.options.find((x) => x.correct).label.toLowerCase(), rightMove = t.moves(f).find((x) => x.correct).label.toLowerCase();
  t.hints(f).forEach((h, i) => { const s = String(h).toLowerCase(); if (s.indexOf(right) >= 0 || s.indexOf(rightMove) >= 0) F(P + "NO LEAK: rung " + (i + 1) + " names the answer"); });
  if (!D.noteOK(t, D.NOTES[t.id] || "").ok) F(P + "NOTE: the model note is refused: " + D.noteOK(t, D.NOTES[t.id] || "").missing.join("; "));
  if (D.noteOK(t, "I looked at the router for a while and then it was working again, so I closed it.").ok) F(P + "NOTE: a note that says nothing specific is accepted");
  /* LADDER: rung 3 leaves two alive, the right one among them */
  { const E = D.createEngine(memStore()); E.openTicket(t.id); E.T().guesses = 7; const g = E.guidance();
    const alive = (g.moves || []).filter((x) => !x.struck); if (g.rung !== 3 || alive.length !== 2 || !alive.some((x) => x.correct)) F(P + "LADDER: rung 3 doesn't leave two alive with the right one"); }
}
function malware(D, t, F) {
  const id = t.id;
  /* EXHIBITED: the infection is where the ticket says, and nowhere else */
  const f = D.makeFleet(); t.setup(f);
  const hit = ALL7.filter((x) => MW.infected(f[x]));
  if (!hit.length) { F("MALWARE " + id + ": EXHIBITED: no PC is infected after setup"); return; }
  if (hit.indexOf(t.machine) < 0) F("MALWARE " + id + ": EXHIBITED: the ticket's own PC " + t.machine + " is not infected");
  if (hit.slice().sort().join() !== (t.infects || []).slice().sort().join()) F("MALWARE " + id + ": EXHIBITED: infected after setup: " + hit.join(", ") + "; the ticket says " + (t.infects || []).join(", "));
  hit.forEach((x) => {
    const m = f[x], w = m.malware;
    const top = m.procs.slice().sort((a, b) => b.cpu - a.cpu)[0];
    if (!top || top.tag !== "malware") F("MALWARE " + id + ": EXHIBITED: on " + x + " the malware does not top the CPU column");
    if (!M.findFile(m, w.dir, w.file)) F("MALWARE " + id + ": EXHIBITED: the file " + w.file + " is not on " + x + "'s disk");
    const logs = [].concat(m.logs.System || [], m.logs.Application || []);
    if (!logs.some((e) => e.id === 7045 || /New Service|service was installed/i.test(e.text))) F("MALWARE " + id + ": EXHIBITED: no service-installed clue in " + x + "'s logs");
  });
  if (t.goal(f)) F("MALWARE " + id + ": EXHIBITED: the goal is met before the student starts");
  /* SOLVABLE: CompTIA's order, no wrong moves */
  { const E = D.createEngine(memStore()); E.openTicket(id); const g = cleanUp(E);
    if (g) F("MALWARE " + id + ": SOLVABLE: CompTIA's steps in order cost " + g + " guess(es): " + E.T().says.filter(Boolean).join(" | "));
    if (!t.goal(E.fleet())) F("MALWARE " + id + ": SOLVABLE: CompTIA's steps in order do not meet the goal (" + JSON.stringify(nextStep(t, E.fleet())) + ")");
    if (!E.submit("resolve").ok) F("MALWARE " + id + ": SOLVABLE: Resolve refused after the clean-up");
  }
  /* ORDER: skipping a step is not allowed to pass for free */
  { const E = D.createEngine(memStore()); E.openTicket(id); cleanUp(E, { noQuarantine: true });
    if (!E.T().guesses) F("MALWARE " + id + ": ORDER: removing it without quarantine cost nothing");
    if (t.goal(E.fleet())) F("MALWARE " + id + ": ORDER: the goal is met without quarantine"); }
  if (hit.some((x) => !MW.server(f[x]))) { const E = D.createEngine(memStore()); E.openTicket(id); cleanUp(E, { keepRestore: true });
    if (!E.T().guesses) F("MALWARE " + id + ": ORDER: removing it with System Restore still on cost nothing"); }
  /* JUDGE: the consequences */
  { const E = D.createEngine(memStore()); E.openTicket(id); const fl = () => E.fleet(); const g0 = E.T().guesses;
    ["taskmgr", "eventvwr", "edge"].forEach((a) => E.onAct({ type: "open", app: a, machine: t.machine })); E.onAct({ type: "view-log", machine: t.machine }); E.onAct({ type: "view-history", machine: t.machine });
    if (E.T().guesses !== g0) F("MALWARE " + id + ": JUDGE: looking (Task Manager, Event Viewer, history) counted");
    const m = fl()[t.machine], p = m.procs.find((x) => x.tag === "malware"); const b = E.before(); const r = M.endProcess(m, p.pid); r.respawned = !!MW.afterEnd(m, p);
    E.onAct({ type: "tm-end", machine: t.machine, pid: p.pid, name: p.name, res: r, before: b });
    if (E.T().guesses !== g0 + 1) F("MALWARE " + id + ": JUDGE: ending the malware while online did not count");
    if (!r.respawned || !fl()[t.machine].procs.some((x) => x.tag === "malware")) F("MALWARE " + id + ": JUDGE: the malware did not restart after being ended");
    if (t.spreadTo && !MW.infected(fl()[t.spreadTo])) F("MALWARE " + id + ": JUDGE: ending it online did not spread it to " + t.spreadTo);
    E.revert();
    const clean = ALL7.find((x) => !MW.infected(fl()[x])); const b2 = E.before(); MW.setCable(fl()[clean], false); E.onAct({ type: "cable", op: "off", machine: clean, before: b2 });
    if (E.T().guesses !== g0 + 2) F("MALWARE " + id + ": JUDGE: unplugging a clean PC (" + clean + ") did not count");
    MW.setCable(fl()[clean], true);
    const b3 = E.before(); const r3 = MW.scan(fl()[t.machine], "quick"); E.onAct({ type: "av", op: "scan", kind: "quick", res: r3, machine: t.machine, before: b3 });
    if (!r3.missed || E.T().guesses !== g0 + 3) F("MALWARE " + id + ": JUDGE: a scan with month-old definitions did not miss, or did not count");
    if (!MW.server(fl()[t.machine])) { const b4 = E.before(); const r4 = MW.createPoint(fl()[t.machine], "x"); E.onAct({ type: "restore", op: "point", res: r4, machine: t.machine, before: b4 });
      if (E.T().guesses !== g0 + 4) F("MALWARE " + id + ": JUDGE: a restore point while infected did not count"); }
    /* typed quarantine is quarantine */
    const sh = createShell(fl()[t.machine], { elevated: true }); const b5 = E.before(); const n5 = E.T().guesses;
    const r5 = sh.run('netsh interface set interface "Ethernet" disable'); E.onAct({ type: "cmd", line: "netsh", res: r5, machine: t.machine, before: b5 });
    if (E.T().guesses !== n5 || MW.online(fl()[t.machine])) F("MALWARE " + id + ": JUDGE: netsh disabling the infected PC's adapter counted, or did not take it offline");
  }
  /* SIX and NO LEAK at every step of the clean-up */
  { const E = D.createEngine(memStore()); E.openTicket(id);
    const seen = {};
    const look = () => { const n = nextStep(t, E.fleet()); const k = n.step + ":" + (n.id || ""); if (seen[k]) return; seen[k] = 1;
      const mv = t.moves(E.fleet());
      if (mv.length !== 6) F("MALWARE " + id + ": SIX: step " + k + " has " + mv.length + " moves");
      if (mv.filter((x) => x.correct).length !== 1) F("MALWARE " + id + ": SIX: step " + k + " has not exactly one right move");
      if (new Set(mv.map((x) => x.label)).size !== mv.length) F("MALWARE " + id + ": SIX: step " + k + " repeats a move");
      mv.filter((x) => !x.correct).forEach((x) => { if (!x.why) F("MALWARE " + id + ": SIX: step " + k + " wrong move has no reason: " + x.label); });
      const right = mv.find((x) => x.correct); const h = t.hints(E.fleet());
      h.forEach((line, i) => { if (right && String(line).toLowerCase().indexOf(right.label.toLowerCase()) >= 0) F("MALWARE " + id + ": NO LEAK: step " + k + " rung " + (i + 1) + " contains the right move"); });
      E.T().guesses = 7; const g = E.guidance(); E.T().guesses = 0;
      const alive = (g.moves || []).filter((x) => !x.struck);
      if (alive.length !== 2 || !alive.some((x) => x.correct)) F("MALWARE " + id + ": LADDER: step " + k + " rung 3 does not leave two alive with the right one");
    };
    const o = E.onAct; E.onAct = (a) => { o(a); look(); };
    look(); cleanUp(E);
    if (Object.keys(seen).length < 6) F("MALWARE " + id + ": SIX: the clean-up passed through only " + Object.keys(seen).length + " steps");
  }
  /* SIX on the close question, NOTE */
  const six = t.close.options;
  if (six.length !== 6 || six.filter((x) => x.correct).length !== 1 || six.some((x) => !x.correct && !x.why)) F("MALWARE " + id + ": SIX: the close question is not six with one right and a reason on each wrong one");
  if (!D.noteOK(t, D.NOTES[id] || "").ok) F("MALWARE " + id + ": NOTE: the model note is refused: " + D.noteOK(t, D.NOTES[id] || "").missing.join("; "));
  if (D.noteOK(t, "I removed the virus from the computer and it is working fine now, all good.").ok) F("MALWARE " + id + ": NOTE: a note that says nothing specific is accepted");
}

/* ------------------------------------------------------------------ */
/* Email tickets                                                       */
/* ------------------------------------------------------------------ */
/* The right handling of every email, each step through the engine. */
export function mailSolve(E, t, how) {
  how = how || {};
  const f = () => E.fleet(); const act = (a, fn) => { const b = E.before(); const r = fn ? fn() : null; E.onAct(Object.assign({ before: b, machine: "TECH" }, a)); return r; };
  for (const e of t.mails) {
    for (const which of ["cat", "tell"]) { const o = t.question(e.id, which).options.find((x) => x.correct); act({ type: "mail-answer", id: e.id, which, correct: true }, () => t.answer(f(), e.id, which, o.label)); }
    const mid = e.noForward ? e.to : "TECH";
    if (e.noForward) act({ type: "mail-headers", id: e.id }, () => MX.viewHeaders(f(), e.to, e.id));
    if (e.cat === "legit") act({ type: "mail-safe", id: e.id }, () => MX.safeReply(f(), e.id));
    else if (e.cat === "spam") act({ type: "mail-report", kind: "junk", id: e.id }, () => MX.report(f(), mid, e.id, "junk"));
    else {
      act({ type: "mail-report", kind: "phishing", id: e.id }, () => MX.report(f(), mid, e.id, "phishing"));
      act({ type: "mail-purge", id: e.id }, () => MX.purge(f(), e.id));
      if (e.cat === "malicious") { const d = MX.domainOf(e.from[1]); act({ type: "mail-block", entry: d }, () => MX.block(f(), d)); }
      if (e.noForward && !how.noGuard) act({ type: "mail-policy", key: e.guard, on: true }, () => MX.setPolicy(f(), e.guard, true));
      if (e.noForward && e.blockDom) act({ type: "mail-block", entry: e.blockDom }, () => MX.block(f(), e.blockDom));
    }
  }
}
function mailChecks(D, t, F) {
  const id = t.id, P = "MAIL " + id + ": ";
  /* EXHIBITED */
  const f = D.makeFleet(); t.setup(f);
  t.mails.forEach((e) => {
    if (!(f[e.to].mail || []).some((x) => x.id === e.id && !x.fwd)) F(P + "EXHIBITED: \"" + e.subject + "\" is not in " + e.to + "'s mailbox");
    const fw = (f.TECH.mail || []).some((x) => x.id === e.id && x.fwd);
    if (e.noForward && fw) F(P + "EXHIBITED: \"" + e.subject + "\" can't be forwarded, but its forward is in the help desk mailbox");
    if (!e.noForward && !fw) F(P + "EXHIBITED: \"" + e.subject + "\" was not forwarded to the help desk");
  });
  if (t.goal(f)) F(P + "EXHIBITED: the goal is met before the student starts");
  /* SOLVABLE */
  { const E = D.createEngine(memStore()); E.openTicket(id); mailSolve(E, t);
    if (!t.goal(E.fleet())) F(P + "SOLVABLE: the right handling does not meet the goal (" + (t.current(E.fleet()) || {}).id + ")");
    if (E.T().guesses) F(P + "SOLVABLE: the right handling cost " + E.T().guesses + " wrong move(s): " + E.T().says.filter(Boolean).join(" | "));
    if (!E.submit("resolve").ok) F(P + "SOLVABLE: Resolve refused after the right handling"); }
  /* SAFEGUARD: an email that can't be forwarded isn't done without its policy */
  if (t.mails.some((e) => e.noForward)) { const E = D.createEngine(memStore()); E.openTicket(id); mailSolve(E, t, { noGuard: true });
    if (t.goal(E.fleet())) F(P + "SAFEGUARD: the ticket closes without the safeguard policy"); }
  /* JUDGE: consequences */
  { const E = D.createEngine(memStore()); E.openTicket(id); const fl = () => E.fleet(); let n = 0;
    const act = (a, fn) => { const b = E.before(); if (fn) fn(); E.onAct(Object.assign({ before: b, machine: "TECH" }, a)); return E.T().guesses; };
    if (act({ type: "mail-headers", id: t.mails[0].id }, () => MX.viewHeaders(fl(), t.mails[0].to, t.mails[0].id)) !== 0) F(P + "JUDGE: reading message details counted");
    const ph = t.mails.find((e) => e.cat === "phishing"), lg = t.mails.find((e) => e.cat === "legit");
    if (ph) { n = act({ type: "mail-safe", id: ph.id }, () => MX.safeReply(fl(), ph.id)); if (n !== 1 || !MX.tri(fl(), ph.id).compromised) F(P + "JUDGE: calling a phish safe did not count, or did not compromise the user");
      E.revert(); }
    if (lg) { const g0 = E.T().guesses; if (act({ type: "mail-report", kind: "junk", id: lg.id }, () => MX.report(fl(), "TECH", lg.id, "junk")) !== g0 + 1) F(P + "JUDGE: junking a genuine email did not count");
      const d = MX.domainOf(lg.from[1]); if (act({ type: "mail-block", entry: d }, () => MX.block(fl(), d)) !== g0 + 2) F(P + "JUDGE: blocking a genuine sender did not count"); }
    const g1 = E.T().guesses; if (act({ type: "mail-click", id: t.mails[0].id }, () => MX.click(fl(), "TECH", t.mails[0].id, "x")) !== g1 + 1) F(P + "JUDGE: opening a link from a suspicious email did not count");
    const wrongCat = t.question(t.mails[0].id, "cat").options.find((o) => !o.correct);
    const g2 = E.T().guesses; t.answer(fl(), t.mails[0].id, "cat", wrongCat.label); if (act({ type: "mail-answer", id: t.mails[0].id, which: "cat", correct: false, why: wrongCat.why }) !== g2 + 1) F(P + "JUDGE: a wrong category did not count");
    if (MX.tri(fl(), t.mails[0].id).catOut.indexOf(wrongCat.label) < 0) F(P + "JUDGE: a wrong category was not kept red");
    E.T().guesses = 7; const g = E.guidance(); const alive = (g.moves || []).filter((x) => !x.struck);
    if (alive.length !== 2 || !alive.some((x) => x.correct)) F(P + "LADDER: rung 3 does not leave two moves alive with the right one");
    if (!g.qstrike || Object.values(g.qstrike.strike).some((w) => !w)) F(P + "LADDER: rung 3 does not strike the open question with a reason each"); }
  /* SIX and NO LEAK */
  t.mails.forEach((e) => {
    const o = e.tell.options;
    if (o.length !== 6 || o.filter((x) => x.correct).length !== 1 || o.some((x) => !x.correct && !x.why) || new Set(o.map((x) => x.label)).size !== 6) F(P + "SIX: \"" + e.subject + "\": the giveaway is not six, one right, a reason on each wrong one");
    const c = t.question(e.id, "cat").options; if (c.length !== 4 || c.filter((x) => x.correct).length !== 1 || c.some((x) => !x.correct && !x.why)) F(P + "SIX: \"" + e.subject + "\": the category question is not the four, with reasons");
  });
  { const E = D.createEngine(memStore()); E.openTicket(id); const seen = {};
    const look = () => { const e = t.current(E.fleet()); if (!e) return; const right = e.tell.options[0].label.toLowerCase(); t.hints(E.fleet()).forEach((h, i) => { if (String(h).toLowerCase().indexOf(right) >= 0) F(P + "NO LEAK: rung " + (i + 1) + " names the giveaway of \"" + e.subject + "\""); }); seen[e.id] = 1; };
    const o = E.onAct; E.onAct = (a) => { o(a); look(); }; look(); mailSolve(E, t); }
  const six = t.close.options;
  if (six.length !== 6 || six.filter((x) => x.correct).length !== 1 || six.some((x) => !x.correct && !x.why)) F(P + "SIX: the close question is not six with one right");
  if (!D.noteOK(t, D.NOTES[id] || "").ok) F(P + "NOTE: the model note is refused: " + D.noteOK(t, D.NOTES[id] || "").missing.join("; "));
  if (D.noteOK(t, "I looked at all of the emails and handled them the right way, so it's all done now.").ok) F(P + "NOTE: a note that says nothing specific is accepted");
}

/* The sims' own keys, as the owner ruled them (Port Forwarding swapped). */
export const KEYS = {
  "pf:pf1": { enc: "WPA2 PSK", lanWap: "192.168.10.1", wan: "50.90.234.1", lanFw: "10.100.0.1", rule: "Allow TCP Any 3389", place: "LAN: Windows PC · Screened subnet: Game Console" },
  "wifi:w1": { ssid: "MainOffice1", pass: "Ma50n1SB35t!", sec: "WPA3", band: "2.4 GHz", chan: "6" },
  "nr:n1": { ssid: "HomeWiFi", pass: "MyCCR0ck2!", sec: "WPA3", width: "20 MHz", mac: "Enabled", chan: "11" },
  "ad:ad1": { ev: "2190", c1: "\\\\FS01\\Software\\vcredist_x86_2010.exe", c2: "& \"C:\\Program Files (x86)\\Testing\\Testing.exe\"" },
  "al:al1": { t1: "A required application file or dependency is missing or corrupted", t2: "Attempt a repair or reinstall of the affected application", t3: "Event Viewer", t4: "Document findings and escalate to the next support tier" },
  "t1:t1": { q1: "Change the default administrative password to a strong, complex password", q2: "Save the changes and reboot the router", q3: "Document findings and escalate to Tier 2 support" },
  "wr:wrA": { constraint: "Signal range and wall penetration", band: "2.4 GHz", channel: "Use a non-overlapping channel", security: "Modern encrypted security with strong authentication" },
  "wr:wrB": { constraint: "Wireless congestion from nearby networks", band: "5 GHz", channel: "Use a non-overlapping channel", security: "Modern encrypted security with strong authentication" },
  "wr:wrC": { constraint: "Signal range and wall penetration", band: "Dual-band with client steering", channel: "Allow automatic channel selection only", security: "Modern encrypted security with strong authentication" }
};
function examChecks(D, F) {
  const X = D.EXAMS || EXAMS; const pos = [0, 0, 0, 0, 0, 0]; let qs = 0, longest = 0;
  X.forEach((ex) => {
    if (ex.variants.length !== 6 || ex.variants.filter((v) => v.base).length !== 1) F("EXAM " + ex.id + ": SHAPE: not six variants with one the sim itself");
    ex.variants.forEach((v) => {
      const P = "EXAM " + ex.id + ":" + v.id + ": ", brief = v.brief.join(" ");
      const key = (D.KEYS || KEYS)[ex.id + ":" + v.id];
      if (key) Object.keys(key).forEach((fid) => { const f = v.fields.find((x) => x.id === fid); if (!f || PQ.rightValue(f) !== key[fid]) F(P + "KEY: " + fid + " is " + (f ? PQ.rightValue(f) : "missing") + ", the sim's key is " + key[fid]); });
      /* App Deployment, as ruled: on the matching ticket's own PC, the
         keyed commands really fix it (the 2nd too, where it is part of the
         fix), and the sim's old key (robocopy from System32, regsvr32) does not */
      if (ex.id === "ad") { const t = D.TICKETS.find((x) => x.id === v.src);
        if (!t) F(P + "RUNS: no ticket " + v.src); else {
          /* "User-PC02" is the sim's working PC: here it is Farah's (WS4), so
             the old key really copies a file rather than failing to connect */
          const run = (labels, out) => { const fl = D.makeFleet(); t.setup(fl); const m = fl[t.machine]; const sh = createShell(m, { elevated: true, fleet: (h) => byHost(fl, h) });
            labels.forEach((c) => { if (/^& /.test(c) || /^reg query/.test(c)) return; let r = sh.run(c.replace("User-PC02", fl.WS4.host)); if (out) out.push(r.kind); if (r && r.ask) r = sh.run("N"); if (r && r.power === "restart") { M.shutdown(m); M.boot(m); } }); return t.goal(fl); };
          const c1 = v.fields.find((f) => f.id === "c1"), c2 = v.fields.find((f) => f.id === "c2");
          if (!run([PQ.rightValue(c1), PQ.rightValue(c2)])) F(P + "RUNS: the keyed commands do not fix " + v.src + "'s PC");
          /* the sim's case: a 64-bit copy into a 32-bit program's folder */
          const simKey = c1.options.find((o) => /^robocopy .*System32" "C:\\Program Files \(x86\)/.test(o.label));
          const kinds = []; if (simKey && run([simKey.label, "regsvr32 msvcp100.dll"], kinds)) F(P + "RUNS: the sim's old key fixes it too, so the ruling has nothing to teach");
          if (simKey && kinds[0] !== "change") F(P + "RUNS: the sim's old robocopy never copied anything (" + kinds[0] + "), so its failing proves nothing");
          const ev = v.fields.find((f) => f.id === "ev"), row = v.evidence.events.find((e) => String(e[0]) === PQ.rightValue(ev));
          if (!row || !(row[2] === "Error" || row[2] === "Warning")) F(P + "EVENT: the keyed entry is not the one marked Error or Warning"); } }
      /* Email: each email keyed with its own category from the mail tickets */
      if (ex.id === "em") v.fields.forEach((f) => { const e = emailById(f.id), c = e && CATS.find((x) => x.key === e.cat); if (!c || PQ.rightValue(f) !== c.label) F(P + "CAT: " + f.id + " is keyed " + PQ.rightValue(f) + ", its email is " + (c ? c.label : "missing")); });
      /* Malware: the infected PCs are keyed to be contained, and each one's
         evidence shows its malware's process; no clean PC shows one */
      if (ex.id === "mw") { const t = MALWARE.find((x) => x.id === v.src); const fl = makeFleet(); t.setup(fl);
        v.fields.forEach((f) => { const inf = MW.infected(fl[f.id]), d = v.devices.find((x) => x.id === f.id), shows = !!d && d.procs.some((p) => inf ? p.name === fl[f.id].malware.file : p.publisher === "" && /AppData|\\Shares\\|\\Temp\\/i.test(p.image || ""));
          if ((PQ.rightValue(f) === ex.variants[0].fields[0].options.find((o) => /^Quarantine it, then remove/.test(o.label)).label) !== inf) F(P + "INFECTED: " + f.id + " is keyed " + PQ.rightValue(f) + " but is " + (inf ? "infected" : "clean"));
          if (inf && !shows) F(P + "EXHIBITED: " + f.id + " is infected but its Task Manager does not show the malware");
          if (!inf && shows) F(P + "EXHIBITED: clean " + f.id + " shows a malware-like process"); }); }
      v.fields.forEach((f) => {
        if (f.kind === "text") { if (!f.deduce && brief.indexOf(f.answer) < 0) F(P + "TEXT: the answer for " + f.id + " (" + f.answer + ") is not in the brief word for word"); }
        else {
          const r = f.options.filter((o) => o.correct).length; if (r !== 1) F(P + "SIX: " + f.id + " has " + r + " right answers");
          if (f.options.some((o) => !o.correct && !o.why)) F(P + "SIX: a wrong option on " + f.id + " has no reason");
          if (new Set(f.options.map((o) => o.label)).size !== f.options.length) F(P + "SIX: " + f.id + " repeats an option");
          if (!f.setting) { if (f.options.length !== 6) F(P + "SIX: question " + f.id + " has " + f.options.length + " options, not 6");
            qs++; pos[D.ordered(f.options, v.id + f.id).findIndex((o) => o.correct)]++; const L = f.options.map((o) => o.label.length), rl = PQ.rightValue(f).length; if (rl === Math.max(...L) && L.filter((x) => x === rl).length === 1) longest++; }
        }
        f.hint.slice(0, 2).forEach((h, i) => { const rv = PQ.rightValue(f); if (rv.length > 3 && String(h).indexOf(rv) >= 0) F(P + "NO LEAK: rung " + (i + 1) + " of " + f.id + " names the answer"); });
      });
      const st = PQ.fresh(); v.fields.forEach((f) => PQ.set(st, f, PQ.rightValue(f)));
      if (!PQ.check(v, st).done) F(P + "SOLVE: the right values do not complete it");
      const s2 = PQ.fresh(); v.fields.forEach((f) => PQ.set(s2, f, PQ.rightValue(f)));
      const ch = v.fields.find((f) => f.kind === "choice"); const wrong = ch.options.find((o) => !o.correct);
      PQ.set(s2, ch, wrong.label); PQ.check(v, s2);
      if (s2.done || (s2.out[ch.id] || []).indexOf(wrong.label) < 0 || s2.guesses !== 1) F(P + "SOLVE: a wrong value is not kept red and counted once");
      s2.guesses = 7; const g = PQ.guidance(v, s2);
      const alive = ch.options.filter((o) => !(g.strike || {})[o.label]);
      if (g.rung !== 3 || alive.length !== 2 || !alive.some((o) => o.correct)) F(P + "LADDER: rung 3 does not leave two alive with the right one");
    });
  });
  if (PQ.rungFor(2) !== 0 || PQ.rungFor(3) !== 1 || PQ.rungFor(4) !== 2 || PQ.rungFor(9) !== 3) F("EXAM: LADDER: the rungs are off");
  if (qs && Math.max(...pos) > Math.ceil(qs / 3)) F("EXAM: SPREAD: the right answer sits in one slot " + Math.max(...pos) + " times of " + qs + " (" + pos.join(" ") + ")");
  if (qs && longest > Math.ceil(qs / 3)) F("EXAM: SPREAD: the right answer is the longest option in " + longest + " of " + qs + " questions");
}

/* The 92 Series router model: what a router does is decided from its
   RUNNING settings, so typed-but-unsaved and saved-but-not-rebooted
   changes do nothing, as on a real router. */
function routerChecks(D, F) {
  const R = D.R;
  const mk = (o) => { const f = makeFleet(); return { f, r: R.add(f, Object.assign({ id: "R1" }, o || {})) }; };
  /* save and reboot */
  let { f, r } = mk(); R.edit(f, r, "wifi.ssid", "Typed");
  R.reboot(f, r); if (r.running.wifi.ssid === "Typed") F("ROUTER SAVE: a change typed but never saved survives a reboot");
  ({ f, r } = mk()); R.edit(f, r, "wifi.ssid", "Saved"); R.save(f, r);
  if (r.running.wifi.ssid === "Saved") F("ROUTER SAVE: a saved change is running before the reboot");
  if (!R.pending(r)) F("ROUTER SAVE: a saved change isn't waiting for the reboot");
  R.reboot(f, r); if (r.running.wifi.ssid !== "Saved") F("ROUTER SAVE: save then reboot doesn't apply the change");
  ({ f, r } = mk()); R.edit(f, r, "wifi.ssid", "Power"); R.save(f, r); R.ask(f, r, "power"); if (r.running.wifi.ssid !== "Power") F("ROUTER SAVE: unplugging it doesn't load the saved settings");
  /* the admin password */
  ({ f, r } = mk());
  if (!R.defaultPass(r)) F("ROUTER PASS: a new router doesn't have its sticker password");
  if (R.setAdminPass(f, r, "admin", "admin", "admin").ok || R.setAdminPass(f, r, "admin", "Password1", "Password1").ok || R.setAdminPass(f, r, "admin", "MyAdmin#2026x", "MyAdmin#2026x").ok) F("ROUTER PASS: a weak or default-based admin password is accepted");
  if (!R.setAdminPass(f, r, "admin", "Ma50n1SB35t!", "Ma50n1SB35t!").ok) F("ROUTER PASS: a strong password (Ma50n1SB35t!) is refused");
  R.save(f, r); R.reboot(f, r); if (R.defaultPass(r) || !R.signIn(f, r, "admin", "Ma50n1SB35t!").ok || R.signIn(f, r, "admin", "admin").ok) F("ROUTER PASS: the new admin password isn't the one that signs in");
  R.factoryReset(f, r); if (!R.defaultPass(r)) F("ROUTER PASS: a factory reset doesn't bring back the sticker password");
  /* the internet side */
  ({ f, r } = mk({ phys: { wanPort: "lan1" } }));
  if (R.wanStatus(r).up) F("ROUTER WAN: up with the modem cable in a LAN port");
  R.ask(f, r, "move"); if (!R.wanStatus(r).up) F("ROUTER WAN: still down after the customer moves the cable to INTERNET");
  ({ f, r } = mk({ isp: { mode: "PPPoE", user: "jdoe@isp", pass: "K7v9-pq" } }));
  if (R.wanStatus(r).up) F("ROUTER WAN: up with no PPPoE sign-in");
  R.edit(f, r, "wan.mode", "PPPoE"); R.edit(f, r, "wan.user", "jdoe@isp"); R.edit(f, r, "wan.pass", "wrong"); R.save(f, r); R.reboot(f, r);
  if (R.wanStatus(r).code !== "pppoe") F("ROUTER WAN: a wrong PPPoE password isn't reported as rejected");
  R.edit(f, r, "wan.pass", "K7v9-pq"); R.save(f, r); R.reboot(f, r); if (!R.wanStatus(r).up) F("ROUTER WAN: the right PPPoE details, saved and rebooted, don't connect");
  ({ f, r } = mk({ isp: { mode: "unprovisioned" } })); R.reboot(f, r); if (R.wanStatus(r).up) F("ROUTER WAN: an unregistered router connects anyway");
  ({ f, r } = mk({ phys: { power: "faulty" } })); R.ask(f, r, "socket"); if (R.wanStatus(r).code !== "power") F("ROUTER WAN: a faulty power supply is cured by a new socket");
  /* channels: only 1, 6 and 11 clear each other at 20 MHz; our 40 MHz doesn't */
  const ov = (a, w, b) => R.overlaps({ band: "2.4", channel: a, width: w }, { band: "2.4", channel: b });
  if (ov(1, 20, 6) || ov(6, 20, 11) || ov(11, 20, 1) || ov(11, 20, 6)) F("ROUTER CHAN: 1, 6 and 11 at 20 MHz are said to overlap");
  if (!ov(1, 20, 4) || !ov(9, 20, 11) || !ov(6, 20, 6)) F("ROUTER CHAN: channels under five apart are said to be clear");
  if (!ov(11, 40, 6)) F("ROUTER CHAN: our 40 MHz on 11 is said to clear a neighbour on 6");
  ({ f, r } = mk({ neighbours: [{ name: "Router 1", channel: 1, width: 40 }, { name: "Router 2", channel: 6, width: 40 }] }));
  R.edit(f, r, "wifi.channel", 11); R.save(f, r); R.reboot(f, r); if (R.interference(r).length) F("ROUTER CHAN: the sim's key (channel 11, 20 MHz) is said to interfere");
  R.edit(f, r, "wifi.width", 40); R.save(f, r); R.reboot(f, r); if (!R.interference(r).length) F("ROUTER CHAN: 40 MHz on channel 11 is said to clear the neighbours");
  if (R.widthValid("2.4", 80) || !R.widthValid("5", 80)) F("ROUTER CHAN: 80 MHz is allowed on 2.4 GHz, or refused on 5 GHz");
  /* who can join */
  const devs = [{ name: "Laptop", mac: "AA:01", wpa3: true, bands: ["2.4", "5"], knows: "Home#Wifi2026" }, { name: "Printer", mac: "AA:02", wpa3: false, bands: ["2.4"], knows: "Home#Wifi2026" }];
  ({ f, r } = mk({ devices: devs, cfg: { wifi: { pass: "Home#Wifi2026" } } }));
  const set = (k, v) => { R.edit(f, r, k, v); R.save(f, r); R.reboot(f, r); };
  set("wifi.security", "WPA3"); if (R.joins(r, devs[1]).ok || !R.joins(r, devs[0]).ok) F("ROUTER JOIN: WPA3-only lets a WPA2-only device in, or keeps a WPA3 one out");
  set("wifi.security", "WPA2/WPA3"); if (!R.joins(r, devs[1]).ok) F("ROUTER JOIN: transition mode keeps a WPA2-only device out");
  if (R.strongestFor(r) !== "WPA2/WPA3") F("ROUTER JOIN: with a WPA2-only device, transition mode isn't the strongest that works");
  set("wifi.band", "5"); if (R.joins(r, devs[1]).ok) F("ROUTER JOIN: a 2.4 GHz-only device joins a 5 GHz network");
  set("wifi.band", "2.4"); set("wifi.mac", true); R.allow(f, r, "AA:01"); R.save(f, r); R.reboot(f, r);
  if (!R.joins(r, devs[0]).ok || R.joins(r, devs[1]).ok) F("ROUTER JOIN: MAC filtering doesn't follow the allowed list");
  set("wifi.pass", "Changed#Pass99"); if (R.joins(r, devs[0]).ok) F("ROUTER JOIN: a device with the old Wi-Fi password still joins");
  /* where a device is: thick walls, the network it looks for, a crowded room */
  { const tab = { name: "Tablet", mac: "AA:09", wpa3: true, walls: 2, ssid: "Office", knows: "Office#Pass-2026" };
    ({ f, r } = mk({ devices: [tab], cfg: { wifi: { ssid: "Office", pass: "Office#Pass-2026", band: "5", channel: 36 } } }));
    if (R.joins(r, tab).ok) F("ROUTER WALLS: 5 GHz reaches a device through two thick walls");
    R.edit(f, r, "wifi.band", "2.4"); R.edit(f, r, "wifi.channel", 6); R.save(f, r); R.reboot(f, r); if (!R.joins(r, tab).ok) F("ROUTER WALLS: 2.4 GHz doesn't reach a device two walls away");
    R.edit(f, r, "wifi.band", "dual"); R.save(f, r); R.reboot(f, r); if (!R.joins(r, tab).ok) F("ROUTER WALLS: dual-band doesn't steer a far device onto 2.4 GHz");
    R.edit(f, r, "wifi.ssid", "Office-2"); R.save(f, r); R.reboot(f, r); if (R.joins(r, tab).ok) F("ROUTER WALLS: a device finds a network under a name it isn't looking for");
    ({ f, r } = mk({ crowd: 25, cfg: { wifi: { band: "2.4" } } })); if (!R.crowded(r)) F("ROUTER WALLS: 25 laptops on 2.4 GHz aren't crowded");
    R.edit(f, r, "wifi.band", "5"); R.edit(f, r, "wifi.channel", 36); R.save(f, r); R.reboot(f, r); if (R.crowded(r)) F("ROUTER WALLS: 25 laptops are crowded on 5 GHz too"); }
  /* what comes in from the internet */
  ({ f, r } = mk());
  R.addForward(f, r, { ext: 3389, ip: "192.168.10.20" }); R.edit(f, r, "screened", "10.100.0.50"); R.save(f, r); R.reboot(f, r);
  const rdp = R.inbound(r, 3389), game = R.inbound(r, 3074, "UDP");
  if (!rdp || rdp.to !== "192.168.10.20" || rdp.via !== "forward") F("ROUTER IN: TCP 3389 doesn't reach the PC by its forward");
  if (!game || game.to !== "10.100.0.50" || game.via !== "screened") F("ROUTER IN: the screened-subnet host doesn't get everything else");
  /* snapshots: a router is plain data the engine can copy */
  ({ f, r } = mk()); if (JSON.stringify(JSON.parse(JSON.stringify(f.TECH.routers))) !== JSON.stringify(f.TECH.routers)) F("ROUTER SNAP: a router doesn't survive the engine's copy");
}

const BASE = { BK: Object.assign({}, BKM), XT: Object.assign({}, XTM), CH: Object.assign({}, CHM), MB: Object.assign({}, MBM), R: Object.assign({}, RT), TICKETS: TK.TICKETS, score: TK.score, noteOK: TK.noteOK, makeFleet, createEngine, rungFor, ordered, FIX, SHOWS, ANSWER_WORDS, NOTES };
function withTicket(id, over) { return BASE.TICKETS.map((t) => (t.id === id ? Object.assign({}, t, over(t)) : t)); }

/* Each plant is one defect a check exists to catch, and the check it must
   be caught BY (a prefix of the failure). */
const PLANTS = [
  ["SHAPE", "a sixth App Launch variant dropped", () => ({ TICKETS: BASE.TICKETS.filter((t) => t.id !== "L6") })],
  ["EXHIBITED", "D1's setup forgets to remove the runtime", () => ({ TICKETS: withTicket("D1", (t) => ({ setup: (f) => { t.setup(f); f.WS1.runtimes.vc2010x86 = true; M.syncRuntimes(f.WS1); } })) })],
  ["EXHIBITED", "D5 plants a 32-bit copy, so there is no 0xc000007b", () => ({ TICKETS: withTicket("D5", (t) => ({ setup: (f) => { t.setup(f); const d = M.dirOf(f.WS2, "C:\\Program Files (x86)\\Testing"); d.files.forEach((x) => { if (/msvcp100/i.test(x.name)) x.bits = 32; }); } })) })],
  ["SOLVABLE", "D6's fix installs the x86 runtime instead", () => ({ FIX: Object.assign({}, FIX, { D6: (m, sh) => sh.run("\\\\FS01\\Software\\VC_redist.x86.exe") }) })],
  ["SOLVABLE", "D4 answers N to the restart", () => ({ FIX: Object.assign({}, FIX, { D4: (m, sh) => { sh.run("gpupdate /force"); sh.run("N"); } }) })],
  ["SIX", "L2's close question loses an option", () => ({ TICKETS: withTicket("L2", (t) => ({ close: Object.assign({}, t.close, { options: t.close.options.slice(0, 5) }) })) })],
  ["SIX", "a wrong option on D3 has no reason", () => ({ TICKETS: withTicket("D3", (t) => ({ close: Object.assign({}, t.close, { options: t.close.options.map((x, i) => (i === 2 ? Object.assign({}, x, { why: "" }) : x)) }) })) })],
  ["SPREAD", "the options shown in authored order (right answer first)", () => ({ ordered: (o) => o.slice() })],
  ["SPREAD", "every right answer padded to be the longest", () => ({ TICKETS: BASE.TICKETS.map((t) => Object.assign({}, t, { close: Object.assign({}, t.close, { options: t.close.options.map((x) => (x.correct ? Object.assign({}, x, { label: x.label + " — which is what the evidence on this PC shows, taken all together" }) : x)) }) })) })],
  ["NO LEAK", "D1's rung 1 names the installer", () => ({ TICKETS: withTicket("D1", (t) => ({ hints: (f) => ["Run \\\\FS01\\Software\\vcredist_x86_2010.exe from an elevated prompt.", t.hints(f)[1]] })) })],
  ["NO LEAK", "L4's rung 2 states the close answer", () => ({ TICKETS: withTicket("L4", (t) => ({ hints: (f) => [t.hints(f)[0], "The cause: " + t.close.options.find((x) => x.correct).label + "."] })) })],
  ["LADDER", "rung 1 arrives on the second guess", () => ({ rungFor: (n) => (n < 2 ? 0 : Math.min(3, n - 1)) })],
  ["LADDER", "rung 3 strikes the right move", () => ({ createEngine: (s) => { const E = createEngine(s); const g = E.guidance; E.guidance = () => { const x = g(); if (x && x.moves) x.moves = x.moves.map((y) => Object.assign({}, y, { struck: y.correct || y.struck })); return x; }; return E; } })],
  ["LADDER", "rung 3 keeps alive a move already tried", () => ({ createEngine: (s) => { const E = createEngine(s); const g = E.guidance; E.guidance = () => { const x = g(); if (x && x.moves) x.moves = x.moves.map((y) => (/^robocopy/i.test(y.label) ? Object.assign({}, y, { struck: false }) : y)); return x; }; return E; } })],
  ["JUDGE", "typos counted as guesses", () => ({ createEngine: (s) => { const E = createEngine(s); const o = E.onAct; E.onAct = (a) => { o(a); if (a.res && a.res.kind === "error" && E.T()) E.T().guesses++; }; return E; } })],
  ["SNAPSHOT", "revert keeps the broken machine", () => ({ createEngine: (s) => { const E = createEngine(s); E.revert = () => {}; return E; } })],
  ["MALWARE M1: EXHIBITED", "M1's setup forgets the file server", () => ({ TICKETS: withTicket("M1", (t) => ({ setup: (f) => { t.setup(f); f.FS01.malware = null; f.FS01.procs = f.FS01.procs.filter((p) => p.tag !== "malware"); } })) })],
  ["MALWARE M1: SOLVABLE", "M1's goal forgets that a PC must go back online", () => ({ TICKETS: withTicket("M1", (t) => ({ goal: (f) => false })) })],
  ["MALWARE M1: ORDER", "removal before quarantine is not judged", () => ({ createEngine: (s) => { const E = createEngine(s); const o = E.onAct; E.onAct = (a) => { const n = E.T() ? E.T().guesses : 0; o(a); if (a.type === "av" && E.T() && E.T().guesses > n) E.T().guesses = n; }; return E; } })],
  ["MALWARE M1: JUDGE", "the malware stays dead when ended", () => ({ createEngine: (s) => { const E = createEngine(s); const o = E.onAct; E.onAct = (a) => { if (a.type === "tm-end" && a.res) { a.res.respawned = false; const m = E.fleet()[a.machine]; m.procs = m.procs.filter((p) => p.tag !== "malware"); } o(a); }; return E; } })],
  ["MALWARE M1: SIX", "rung 3 at one step offers five moves", () => ({ TICKETS: withTicket("M1", (t) => ({ moves: (f) => t.moves(f).slice(0, nextStep(t, f).step === 3 ? 5 : 6) })) })],
  ["MALWARE M1: NO LEAK", "rung 2 names the move", () => ({ TICKETS: withTicket("M1", (t) => ({ hints: (f) => [t.hints(f)[0], "Do this: " + t.moves(f).find((x) => x.correct).label] })) })],
  ["MAIL E1: EXHIBITED", "E1's emails are never forwarded to the help desk", () => ({ TICKETS: withTicket("E1", (t) => ({ setup: (f) => { t.setup(f); f.TECH.mail = []; } })) })],
  ["MAIL E4: SAFEGUARD", "E4 closes on the categories alone", () => ({ TICKETS: withTicket("E4", (t) => ({ goal: (f) => t.mails.every((e) => MX.tri(f, e.id).cat === e.cat && MX.tri(f, e.id).tell && (e.noForward || t.goal(f) || true)) })) })],
  ["MAIL E2: JUDGE", "calling a phish safe is not judged", () => ({ createEngine: (s) => { const E = createEngine(s); const o = E.onAct; E.onAct = (a) => { const n = E.T() ? E.T().guesses : 0; o(a); if (a.type === "mail-safe" && E.T()) E.T().guesses = n; }; return E; } })],
  ["MAIL E3: SIX", "a giveaway question loses an option", () => ({ TICKETS: withTicket("E3", (t) => ({ mails: t.mails.map((e, i) => (i ? e : Object.assign({}, e, { tell: Object.assign({}, e.tell, { options: e.tell.options.slice(0, 5) }) }))) })) })],
  ["MAIL E5: NO LEAK", "rung 1 names the giveaway", () => ({ TICKETS: withTicket("E5", (t) => ({ hints: (f) => { const e = t.current(f); return [e ? "Look: " + e.tell.options[0].label : "", "x"]; } })) })],
  ["MAIL: SPREAD", "every right giveaway padded to be the longest", () => ({ TICKETS: BASE.TICKETS.map((t) => (t.kind === "email" ? Object.assign({}, t, { mails: t.mails.map((e) => Object.assign({}, e, { tell: Object.assign({}, e.tell, { options: e.tell.options.map((o) => (o.correct ? Object.assign({}, o, { label: o.label + ", and that settles it beyond any doubt at all" }) : o)) }) })) }) : t)) })],
  ["EXAM pf:pf1: KEY", "Port Forwarding keyed the sim's original way (PC in the screened subnet)", () => ({ KEYS: Object.assign({}, KEYS, { "pf:pf1": Object.assign({}, KEYS["pf:pf1"], { place: "LAN: Game Console · Screened subnet: Windows PC" }) }) })],
  ["EXAM wifi:w1: TEXT", "the WiFi password mistyped in the answer", () => ({ EXAMS: EXAMS.map((e) => (e.id !== "wifi" ? e : Object.assign({}, e, { variants: e.variants.map((v) => (v.id !== "w1" ? v : Object.assign({}, v, { fields: v.fields.map((f) => (f.id === "pass" ? Object.assign({}, f, { answer: "Ma5on1SB35t!" }) : f)) }))) }))) })],
  ["EXAM t1:t1: SIX", "a Tier 1 task with five options", () => ({ EXAMS: EXAMS.map((e) => (e.id !== "t1" ? e : Object.assign({}, e, { variants: e.variants.map((v) => (v.id !== "t1" ? v : Object.assign({}, v, { fields: v.fields.map((f, i) => (i ? f : Object.assign({}, f, { options: f.options.slice(0, 5) }))) }))) }))) })],
  ["EXAM al:al1: KEY", "App Launch keyed to copy the file from another PC", () => ({ KEYS: Object.assign({}, KEYS, { "al:al1": Object.assign({}, KEYS["al:al1"], { t2: "Replace the missing file using a known working system" }) }) })],
  ["ROUTER WR1: PARTIAL", "WR1 closes with the microwave still beside the access point", () => ({ TICKETS: withTicket("WR1", (t) => ({ goal: (f) => { const r = RT.get(f, "WR1"); return r.running.wifi.band === "2.4" && r.running.wifi.channel !== "auto"; } })) })],
  ["ROUTER WR3: KEY", "WR3 keyed to a fixed channel", () => ({ TICKETS: withTicket("WR3", (t) => ({ target: Object.assign({}, t.target, { chan: "fixed" }) })) })],
  ["ROUTER N1: KEY", "N1 keyed to channel 6, where Router 2 already is", () => ({ TICKETS: withTicket("N1", (t) => ({ target: Object.assign({}, t.target, { chan: 6 }) })) })],
  ["ROUTER N2: EXHIBITED", "N2 already clear of the neighbours before the student starts", () => ({ TICKETS: withTicket("N2", (t) => ({ setup: (f) => { t.setup(f); const r = RT.get(f, "N2"); r.neighbours = []; } })) })],
  ["ROUTER P1: KEY", "P1 keyed the sim's original way round", () => ({ TICKETS: withTicket("P1", (t) => ({ target: Object.assign({}, t.target, { pc: "Game Console", gc: "Windows PC" }) })) })],
  ["ROUTER P2: PARTIAL", "P2 done without the console moved to the screened-subnet port", () => ({ TICKETS: withTicket("P2", (t) => ({ goal: (f) => { const r = RT.get(f, "P2"); return r.running.forwards.length > 0 && !!r.running.screened; } })) })],
  ["ROUTER W2: NO LEAK", "Resolve's refusal lists the settings that are wrong", () => ({ TICKETS: withTicket("W2", (t) => ({ notReady: (f) => { const r = RT.get(f, "W2"); return r.running.wifi.band !== "2.4" ? "Not matching yet: the band." : t.notReady(f); } })) })],
  ["ROUTER W1: KEY", "W1 keyed to 5 GHz", () => ({ TICKETS: withTicket("W1", (t) => ({ target: Object.assign({}, t.target, { band: "5" }) })) })],
  ["ROUTER W4: KEY", "W4 keyed WPA3 only, so the printer is locked out", () => ({ TICKETS: withTicket("W4", (t) => ({ target: Object.assign({}, t.target, { sec: "WPA3" }) })) })],
  ["ROUTER R1: JUDGE", "a save that knocks a connected device off is not a wrong move", () => ({ createEngine: (s) => { const E = createEngine(s); const o = E.onAct; E.onAct = (a) => { const n = E.T() ? E.T().guesses : 0; o(a); if ((a.type === "router-save" || a.type === "router-reboot") && !a.lost && E.T() && E.ticket().id === "R1") E.T().guesses = n; }; return E; } })],
  ["ROUTER R1: EXHIBITED", "R1 closes on the sticker password", () => ({ TICKETS: withTicket("R1", (t) => ({ goal: (f) => RT.wanStatus(RT.get(f, "R1")).up })) })],
  ["ROUTER R5: PARTIAL", "R5 escalates without asking Omar for the provider's details", () => ({ TICKETS: withTicket("R5", (t) => ({ goal: (f) => RT.get(f, "R5").events.some((e) => e.kind === "view") })) })],
  ["ROUTER R3: JUDGE", "a factory reset is not a wrong move", () => ({ createEngine: (s) => { const E = createEngine(s); const o = E.onAct; E.onAct = (a) => { const n = E.T() ? E.T().guesses : 0; o(a); if (a.type === "router-factory" && E.T()) E.T().guesses = n; }; return E; } })],
  ["ROUTER R4: SOLVABLE", "R4 wants a password the brief never gives", () => ({ TICKETS: withTicket("R4", (t) => ({ goal: (f) => RT.get(f, "R4").running.wifi.pass === "Blue-Harbour#88" })) })],
  ["ROUTER SAVE", "a reboot keeps what was only typed", () => ({ R: Object.assign({}, RT, { reboot: (f, r) => { r.saved = JSON.parse(JSON.stringify(r.form)); return RT.reboot(f, r); } }) })],
  ["ROUTER PASS", "any admin password of 8 characters is strong", () => ({ R: Object.assign({}, RT, { setAdminPass: (f, r, c, n, a) => { if (n !== a || n.length < 8) return { ok: false }; r.form.admin.pass = n; return { ok: true }; } }) })],
  ["ROUTER WAN", "PPPoE is up whatever the password", () => ({ R: Object.assign({}, RT, { wanStatus: (r) => (r.isp.mode === "PPPoE" && r.running.wan.mode === "PPPoE" ? { up: true, code: "up" } : RT.wanStatus(r)) }) })],
  ["ROUTER CHAN", "channels only clash on the same number", () => ({ R: Object.assign({}, RT, { overlaps: (a, b) => Number(a.channel) === Number(b.channel) }) })],
  ["ROUTER JOIN", "MAC filtering ignored", () => ({ R: Object.assign({}, RT, { joins: (r, d) => { const w = r.running.wifi; const save = w.mac; w.mac = false; const out = RT.joins(r, d); w.mac = save; return out; } }) })],
  ["ROUTER WALLS", "5 GHz goes through any wall", () => ({ R: Object.assign({}, RT, { joins: (r, d) => RT.joins(r, Object.assign({}, d, { walls: 0 })) }) })],
  ["ROUTER IN", "a forward reaches the router itself", () => ({ R: Object.assign({}, RT, { inbound: (r, p, pr) => { const x = RT.inbound(r, p, pr); return x && x.via === "forward" ? Object.assign({}, x, { to: r.running.lan.ip }) : x; } }) })],
  ["EXAM ad:ad1: KEY", "App Deployment keyed the sim's way (robocopy from System32)", () => ({ KEYS: Object.assign({}, KEYS, { "ad:ad1": Object.assign({}, KEYS["ad:ad1"], { c1: "robocopy \"\\\\User-PC02\\C$\\Windows\\System32\" \"C:\\Program Files (x86)\\Testing\" \"msvcp100.dll\"" }) }) })],
  ["EXAM ad:ad6: RUNS", "LabelPro keyed with the 32-bit runtime", () => ({ EXAMS: EXAMS.map((e) => (e.id !== "ad" ? e : Object.assign({}, e, { variants: e.variants.map((v) => (v.id !== "ad6" ? v : Object.assign({}, v, { fields: v.fields.map((f) => (f.id !== "c1" ? f : Object.assign({}, f, { options: f.options.map((o) => Object.assign({}, o, { correct: /VC_redist\.x86/.test(o.label) })) }))) }))) }))) })],
  ["EXAM ad:ad4: RUNS", "the policy install keyed without the restart", () => ({ EXAMS: EXAMS.map((e) => (e.id !== "ad" ? e : Object.assign({}, e, { variants: e.variants.map((v) => (v.id !== "ad4" ? v : Object.assign({}, v, { fields: v.fields.map((f) => (f.id !== "c2" ? f : Object.assign({}, f, { options: f.options.map((o) => Object.assign({}, o, { correct: /^tasklist/.test(o.label) })) }))) }))) }))) })],
  ["EXAM ad:ad2: EVENT", "PayWise keyed to the repair's own installer entry", () => ({ EXAMS: EXAMS.map((e) => (e.id !== "ad" ? e : Object.assign({}, e, { variants: e.variants.map((v) => (v.id !== "ad2" ? v : Object.assign({}, v, { fields: v.fields.map((f) => (f.id !== "ev" ? f : Object.assign({}, f, { options: f.options.map((o) => Object.assign({}, o, { correct: o.label === "3307" })) }))) }))) }))) })],
  ["EXAM ad:ad1: RUNS", "Testing's ticket fixed by any file landing in its folder", () => ({ TICKETS: withTicket("D1", (t) => ({ goal: (f) => t.goal(f) || !!M.findFile(f[t.machine], "C:\\Program Files (x86)\\Testing", "msvcp100.dll") })) })],
  ["EXAM em:em1: CAT", "the first email of the inbox keyed as Spam", () => ({ EXAMS: EXAMS.map((e) => (e.id !== "em" ? e : Object.assign({}, e, { variants: e.variants.map((v) => (v.id !== "em1" ? v : Object.assign({}, v, { fields: v.fields.map((f, i) => (i ? f : Object.assign({}, f, { options: f.options.map((o) => Object.assign({}, o, { correct: o.label === "Spam" })) }))) }))) }))) })],
  ["EXAM mw:mw1: EXHIBITED", "an infected PC's Task Manager shown without its malware", () => ({ EXAMS: EXAMS.map((e) => (e.id !== "mw" ? e : Object.assign({}, e, { variants: e.variants.map((v) => (v.id !== "mw1" ? v : Object.assign({}, v, { devices: v.devices.map((d) => (d.id !== "WS2" ? d : Object.assign({}, d, { procs: [] }))) }))) }))) })],
  ["EXAM mw:mw1: EXHIBITED", "a clean PC shown running an unsigned program from AppData", () => ({ EXAMS: EXAMS.map((e) => (e.id !== "mw" ? e : Object.assign({}, e, { variants: e.variants.map((v) => (v.id !== "mw1" ? v : Object.assign({}, v, { devices: v.devices.map((d) => (d.id !== "WS3" ? d : Object.assign({}, d, { procs: d.procs.concat([{ name: "upd.exe", desc: "upd", cpu: 40, image: "C:\\Users\\dpatel\\AppData\\Roaming\\upd.exe", publisher: "" }]) }))) }))) }))) })],
  ["EXAM mw:mw3: INFECTED", "an infected PC keyed to stay on the network", () => ({ EXAMS: EXAMS.map((e) => (e.id !== "mw" ? e : Object.assign({}, e, { variants: e.variants.map((v) => (v.id !== "mw3" ? v : Object.assign({}, v, { fields: v.fields.map((f) => (f.id !== "WS5" ? f : Object.assign({}, f, { options: f.options.map((o) => Object.assign({}, o, { correct: /^Leave it/.test(o.label) })) }))) }))) }))) })],
  ["EXAM: SPREAD", "the exam questions shown in authored order", () => ({ ordered: (o) => o.slice() })],
  ["NOTE", "the note check accepts anything forty letters long", () => ({ noteOK: (t, s) => ({ ok: String(s).length >= 40, missing: [] }) })],
  ["CHAT POOL", "a chat step's pool loses a wrong reply", () => ({ TICKETS: withTicket("CE2", (t) => ({ chat: t.chat.map((it, i) => (i === 0 ? Object.assign({}, it, { wrong: it.wrong.slice(1) }) : it)) })) })],
  ["CHAT SIM", "CE1 drops the sim's joke reply", () => ({ TICKETS: withTicket("CE1", (t) => ({ chat: t.chat.map((it) => (it.type === "reply" ? Object.assign({}, it, { wrong: it.wrong.map((w) => (w.label === "Blow on the SIM card." ? Object.assign({}, w, { label: "Check the SIM card." }) : w)) }) : it)) })) })],
  ["CHAT EXHIBITED", "CE1's phone starts already on port 993", () => ({ TICKETS: withTicket("CE1", (t) => ({ setup: (f) => { t.setup(f); MBM.get(f, "CE1").account.port = 993; } })) })],
  ["CHAT WRONG", "a wrong reply moves the chat on", () => ({ CH: Object.assign({}, CHM, { reply: (f, t, label) => { const o = CHM.reply(f, t, label); if (o && !o.correct) CHM.get(f, t.id).step++; return o; } }) })],
  ["CHAT LEAK", "a hint gives the reply away", () => ({ TICKETS: withTicket("CR3", (t) => ({ chat: t.chat.map((it) => (it.type === "reply" && it.then ? Object.assign({}, it, { h: [it.h[0], "Say this: " + it.right.label] }) : it)) })) })],
  ["CHAT RESTART", "starting again keeps the customer's changed router", () => ({ CH: Object.assign({}, CHM, { restart: (f, t) => { const c = CHM.get(f, t.id); c.step = 0; c.out = {}; c.said = {}; c.seed++; } }) })],
  ["CHAT RESTART", "starting again shows the same six", () => ({ CH: Object.assign({}, CHM, { restart: (f, t) => { const c = CHM.get(f, t.id); c.step = 0; c.out = {}; c.said = {}; if (t.restore) t.restore(f); } }) })],
  ["EXTRA X1: EXHIBITED", "her spreadsheet starts already restored", () => ({ TICKETS: withTicket("X1", (t) => ({ setup: (f) => { t.setup(f); const P = "C:\\Users\\finance\\Documents\\Q3-budget.xlsx"; BKM.restoreVersion(f.WS4, P, BKM.versions(f.WS4, P).find((v) => v.file.doc.id === "q3rev").id); } })) })],
  ["EXTRA X1: JUDGE", "the read-only Software share passes as a typo", () => ({ BK: Object.assign({}, BKM, { setTarget: (w, v) => (/software/i.test(v) ? { ok: false, typo: true, text: "not found" } : BKM.setTarget(w, v)) }) })],
  ["EXTRA X1: System Restore brought", "System Restore puts her document back", () => ({ BK: Object.assign({}, BKM, { systemRestore: (w, i) => { const P = "C:\\Users\\finance\\Documents\\Q3-budget.xlsx"; BKM.restoreVersion(w, P, BKM.versions(w, P).find((v) => v.file.doc.id === "q3rev").id); return BKM.systemRestore(w, i); } }) })],
  ["EXTRA X1: NO LEAK", "a hint names the copy to restore", () => ({ TICKETS: withTicket("X1", (t) => ({ hints: (f) => { const h = t.hints(f); return [h[0] + " Try the 3 October copy.", h[1]]; } })) })],
  ["EXTRA X1: SOLVABLE", "the backup never has to be tested", () => ({ TICKETS: withTicket("X1", () => ({ goal: (f) => ["test", "done"].indexOf(XTM.stage(f.WS4)) >= 0 })) })],
  ["EXTRA X1: SPREAD", "the right close answer padded to be the longest", () => ({ TICKETS: withTicket("X1", (t) => ({ close: Object.assign({}, t.close, { options: t.close.options.map((x) => (x.correct ? Object.assign({}, x, { label: x.label + ", and a fire takes the lot" }) : x)) }) })) })],
  ["EXTRA X1: does not name", "the objective reworded", () => ({ TICKETS: withTicket("X1", () => ({ objective: "making backups" })) })],
];

const plant = process.argv.includes("--plant");
if (!plant) {
  const f = check(BASE);
  f.forEach((x) => console.log("FAIL " + x));
  console.log(f.length ? f.length + " failure(s)" : "PASS — logic: " + BASE.TICKETS.length + " tickets, shape, fault exhibited, solvable, six options, spread, no leak, ladder, judge, snapshot, note");
  process.exit(f.length ? 1 : 0);
} else {
  let bad = 0;
  for (const [by, what, make] of PLANTS) {
    const f = check(Object.assign({}, BASE, make()));
    const caught = f.filter((x) => x.startsWith(by));
    if (caught.length) console.log("caught  [" + by + "] " + what + "  ← " + caught[0]);
    else { bad++; console.log("MISSED  [" + by + "] " + what + (f.length ? "  (only tripped: " + f[0] + ")" : "")); }
  }
  console.log(bad ? bad + " plant(s) missed" : "PASS — all " + PLANTS.length + " plants caught by the check written for them");
  process.exit(bad ? 1 : 0);
}
