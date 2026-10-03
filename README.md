# A+ Core2 Under the Hood labs

Hands-on labs for CompTIA A+ Core 2 (220-1202), part of the Cyber Warrior
Program, built from the Core 2 sims only.

**The whole screen is your work laptop at Rafiki's IT Services.** You sign
in as a Tier 1 technician, and from then on everything happens in programs
on the laptop:
- **Help Desk** holds your queue. One page per ticket has everything: the
  user's request, their PC, your work notes, the activity log, Resolve or
  Escalate, the cause and the resolution notes.
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
| **Crawl** | L1, D1, M1, E1: the four sims themselves | Mason walks you through every step and rings what to press |
| **Walk** | L2, D2, M2, E2 | A checklist that ticks itself off as you work, with "How?" pointers |
| **Run** | L3–L6, D3–D6, M3–M6, E3–E6 | On your own, as in the exam. Mason checks in after your third wrong move |

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
