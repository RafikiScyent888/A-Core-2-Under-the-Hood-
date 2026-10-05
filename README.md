# A+ Core2 Under the Hood labs

Hands-on labs for CompTIA A+ Core 2 (220-1202), part of the Cyber Warrior
Program, built from the Core 2 sims only.

**The whole screen is your work laptop at Rafiki's IT Services.** You sign
in as a Tier 1 technician, and from then on everything happens in programs
on the laptop:
- **Help Desk** holds your queue, in two sections: **Exam sims** (from
  your Core 2 practice sims) and **Extra training** (real-world tickets
  for the objectives no sim covers). Every ticket has a badge, in words
  with an icon, saying which it is. One page per ticket has everything:
  the user's request, their PC, your work notes, the activity log,
  Resolve or Escalate, the cause and the resolution notes.
- **Remote support** takes you onto the user's PC, in a window. You fix it
  with Windows' own tools: the program itself, Start search, Event Viewer,
  Command Prompt and PowerShell, Task Manager, Settings and Software
  Center.
- **Mail** holds the help desk mailbox, where staff forward suspicious
  email. Point at a link to see where it really goes, without opening it.
  **Mail admin** has the block list, search and purge, protection
  policies, and password resets.
- **92 Series:** customers' routers, shared with you remotely. Status,
  Wireless, Internet, Port forwarding and Administration, with Save and
  Restart that behave like a real router's: a change isn't made until it's
  saved and the router restarts. The customer is on the phone for anything
  physical.
- **Browser:** the office access point at 192.168.1.1. Sign in, set its
  Wi-Fi, Save and restart; the Status page shows each device in the office,
  where it is, and whether it really connects.
- **Floor plan:** Rafiki's office from above, with the Wi-Fi coverage the
  access point is really giving, room by room and device by device, in
  words as well as colour. On the lunchtime job you walk to the break room
  and drag the microwave across it, and the coverage changes.
- **Street view:** the three houses of the Neighboring Routers sim in 3D,
  each router's reach in its channel's colour, red stripes where yours
  overlaps a neighbour, and the 2.4 GHz band drawn as a Wi-Fi analyzer
  shows it, with every part also said in words.
- **Customer chat:** the Help Desk chat sims, as real conversations. Six
  replies to choose from on each step; a wrong one stays in the chat with
  how the customer took it, and their mood shows in words. The customer
  waits while you check the real thing.
- **Mobile devices:** the company's phones. The customer's phone in 3D,
  its mail settings as real text, Sync now, and the mail server's
  settings to match against. On the mobile tickets, **Remote help**: the
  phone's own screen beside it, to use as the owner would (notifications,
  Network & internet, Battery, Storage, Apps, Security, System).
- **Exam Practice** shows each sim laid out the way the exam shows it: the
  Port Forwarding diagram, the Wi-Fi office map, the three houses of
  Neighboring Routers, the Tier 1 Router scenario, the Wireless
  Reliability checkpoints, App Launch's tasks and evidence, App
  Deployment's tabs, the Email Threat inbox and the Malware network map.
  Each one is the sim's own task plus five more.
  Work it Guided, with a Checklist, or On my own.
- **Chat with Mason,** your team lead. He guides you, and never gives you
  the answer.
- **When remote can't reach a PC,** you walk over in 3D, played as a
  cutscene from your IT bench. That covers a PC that is switched off,
  blue-screened or unplugged, or one you have to take off the network. At
  the desk you see the PC's screen, press its power button, check, unplug
  or plug in its network cable, and plug in a USB stick.

The PCs are simulated but behave like running machines:
- their faults are really there
- what you do has real consequences
- a restart ends your remote session
- **Revert to snapshot** puts a PC back to the last point you got right

Live: https://rafikiscyent888.github.io/A-Core-2-Under-the-Hood-/

## Crawl, walk, run

| | Tickets | How much help |
|---|---|---|
| **Crawl** | L1, D1, M1, E1, R1, W1, P1, N1, WR1, CE1, CR1: the sims themselves; X1, MB1 and OI1, the first extra-training tickets | Mason walks you through every step and rings what to press |
| **Walk** | L2, D2, M2, E2, R2, W2, P2, N2, WR2, CE2, CR2, X2, MB2, OI2 | A checklist that ticks itself off as you work, with "How?" pointers |
| **Run** | the rest, 3 to 6 of each | On your own, as in the exam. Mason checks in after your third wrong move |

The L tickets come from the Application Launch sim (Tier 1), the D
tickets from the Application Deployment sim (Tier 2), and the M tickets
from the Malware Incident Response sim. The Malware tickets follow
CompTIA's malware-removal steps across all seven of the office's PCs:
investigate, quarantine, disable System Restore, remediate, schedule
scans and update, a fresh restore point, and educate the user. Doing
them out of order has real consequences: malware ended on a networked PC
restarts and spreads.

The E tickets come from the Email Threat Classification sim: its twelve
emails and twelve more. Each email is legitimate, spam, phishing or
malicious. You say which, pick the detail that gives it away (six
options), and deal with it. Three can't be forwarded: you look at the
original's headers on the user's PC and add the safeguard that stops the
next one. The Deployment sim
is rebuilt so its old answer is tried and fails: the robocopy from System32
gives 0xc000007b, and `regsvr32` gives its real error.

The router tickets come from five sims:
- **R, Tier 1 Router Support:** customers' 92 Series routers. Default
  admin passwords, a cable in the wrong port, a change never saved, and
  the faults Tier 1 hands on.
- **W, WiFi Access Point Configuration:** the office's own access point,
  in the browser. Security, band and channel decided by the building and
  the devices in it.
- **P, Port Forwarding Configuration:** a home network. The computer stays
  on the LAN behind one forwarded port; the game console goes in the
  screened subnet. The customer tests both from outside.
- **N, Neighboring Routers Configuration:** Router 3 in a street of three
  houses. A clear channel at 20 MHz, WPA3, and MAC filtering where it's
  asked for; the Wi-Fi scan shows any overlap in words.
- **WR, Wireless Reliability Decision Lab:** offices whose Wi-Fi drops or
  crawls. Band and channel plan from the sim's keys, made real: walls,
  distance, busy airwaves, and a microwave in Rafiki's own break room.

The CE and CR tickets come from the two Help Desk chat sims: email on a
company phone, and a customer's router. Each is a conversation with real
consequences, and hands-on checks on the phone or the router itself.

**Extra training** covers what the Core 2 objectives ask for and no sim
does. Each ticket names the objective it covers.
- **X, Backup and recovery** (Operational procedures), six tickets:
  - X1: a spreadsheet saved over by mistake. One file back from Previous
    Versions (System Restore never touches documents), then File History
    to the file server, as often as the user can afford to lose, tested.
  - X2: an old copy wanted beside today's: Restore to another folder, not
    over the original.
  - X3: a file deleted six weeks ago, backups kept for a month. It can't
    come back at Tier 1: set the retention policy needs, and escalate.
  - X4: the backup drive walked off with a temp. Move the backup to the
    file server, run it, test it.
  - X5: a driver update broke the scanner software. Here System Restore is
    the right tool: the newest point before the change, documents
    untouched.
  - X6: the auditors' two numbers: how often (every 15 minutes) and how
    long (two years, and no longer).
- **MB, Mobile troubleshooting** (Software troubleshooting), six tickets on
  company phones, by Remote help:
  - MB1: battery dead by lunch: a weather app tracking location all day,
    unrestricted in the background.
  - MB2: an app crashing after its update: clear the cache, not the
    storage, which holds three unsynced orders.
  - MB3: "Connected, no internet" on every network: a Private DNS server
    from an article.
  - MB4: an update that won't install: free space from what's backed up,
    never the only copies.
  - MB5: ads and fake virus warnings: a scanner app from a website; remove
    it, close unknown sources, scan.
  - MB6: mail only arriving when Outlook opens: let the mail app run and
    use data in the background.
- **OI, OS installation** (Operating systems), at the PC's own screen:
  - OI1: a new, blank SSD from the vendor. A clean install of Windows 11
    Pro from the installer USB: the Boot Menu, the edition the licence
    covers, an MBR disk that a UEFI PC refuses (delete, don't format), the
    PC's own name, Domain join instead, then joining RAFIKI from System
    Properties.
  - OI2: "This PC can't run Windows 11", on supported hardware: the TPM
    is switched off in the firmware. Switch it on, then upgrade in place,
    keeping files and apps; PayWise must still work.
  - OI3: a 7th-gen processor that isn't on Windows 11's supported list.
    Check it, force nothing, escalate.
  - OI4: Ubuntu alongside Windows on Dev's PC: shrink C: in Disk
    Management, install alongside Windows (never Erase disk), and check
    both start from GRUB's menu.

The program's rules apply throughout:
- unlimited tries
- hints from the third wrong move, and no hint ever gives the answer
- six options: one right, five near misses
- a wrong pick stays red, marked three ways
- WCAG AAA contrast
- a dyslexia-friendly setting that stays on

Instructor mode (PIN 3693) is in the Settings tray.

## Running the checks

The site itself needs nothing. The page and contrast checks need
Playwright:

```
node verify/logic.mjs
node verify/page.mjs
node verify/contrast.mjs
```

Add `--plant` to any of them to prove it catches the defect it exists to
catch.

3D: three.js (MIT licence). Daylight: a CC0 HDRI from Poly Haven.

Cyber Warrior Program — built by an instructor, for students, to make
certification study more interactive. For educational purposes only. Not
affiliated with, endorsed by, or sponsored by CompTIA®. All trademarks
belong to their respective owners.
