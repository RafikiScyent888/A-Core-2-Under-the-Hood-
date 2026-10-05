# A+ Core2 Under the Hood labs — build document

**Official name, settled 30 September 2026: "A+ Core2 Under the Hood labs"**,
matching Core 1's "A+ Core1 Under the Hood labs". Use it verbatim in the
page title, the heading and anywhere the site is linked from.

Read with `/root/.claude/CLAUDE.md`, which sets the rules and wins over this
file. The coaching role is in `/root/.claude/exam-prep-coach.md`.

**DIRECTION CHANGED AGAIN on 1 October 2026. Section 9 overrides
everything above it, including section 8's layout; read it first.**

**Status, 1 October 2026: THE MAIL BUILD IS LIVE** (Email Threat, E1–E6;
section 11). Before it: **THE MALWARE BUILD IS LIVE** (preview 7, M1–M6
and the walk-over cutscenes). The owner: "Doing it live works best for
me because it is solving two issues at once." From now on each build
goes live once its checks pass; the owner tries it there. Section 11 has
the rulings for the remaining builds.

**Earlier status: THE LAPTOP IS LIVE (1 October 2026).** The owner said "Build it
out so I can see it live". Section 7 describes what is built: the whole
screen is the student's work laptop at Rafiki's IT Services, with
- the Help Desk
- remote sessions to the office's PCs
- Mason in chat
- crawl, walk and run tickets
- the walk-over in 3D

The twelve App tickets are playable. VM build 1 is gone from the site.
The mail, malware, router and chat builds are not built yet.
Last updated 1 October 2026.

| | |
|---|---|
| Repository | `RafikiScyent888/A-Core-2-Under-the-Hood-` |
| Site | https://rafikiscyent888.github.io/A-Core-2-Under-the-Hood-/ (GitHub Pages serves `main`) |
| Exam | CompTIA A+ Core 2, 220-1202 (the owner's doc calls it V15) |
| Knowledge base | `RafikiScyent888/Core-2-Sims`, 11 sims, `main` @ `fba4f2b` |
| Model build | `RafikiScyent888/A-Core-1-under-the-hood-labs` |

## Confidence markers

| Marker | Means |
|---|---|
| **SETTLED** | The owner decided it. Build to this |
| **RECOMMENDED** | Claude's proposal, with reasoning. Not decided |
| **OPEN** | Genuinely undecided. Do not invent an answer |
| **REJECTED** | Proposed and turned down. Do not propose again |

---

## 1. Decided by the owner — SETTLED 30 September 2026

The request, verbatim:

> "I want to take all of the core two sims and use it as a knowledge base to
> build something similar to what we did with core one. I want to meet all the
> new objectives. I want to give them actual hands-on learning um, whether it's
> within the 3D model or whatnot. … We're going to talk this all the way out
> first and then build it."

And the answers to the first round of questions:

> "Yes new repo, typed commands, start with the Windows Tools Console"

- **A new repo, alongside Core-2-Sims.** Core-2-Sims stays live and untouched,
  just as Core-1-Sims did beside the Core 1 build. Every sim gets an equivalent
  here. Coverage is not the test: two routes to one objective is the
  deliverable (the owner's Core 1 rule: "Everyone learns differently").
- **Typed commands.** The student types real commands at a real-looking
  prompt and the machine answers. It is not picked from a list.
- **Second round, 30 September 2026:** "Yes to all five, add DISM, rebuild
  App Deployment". That settles five things:
  - **DISM is in.** `DISM /Online /Cleanup-Image /RestoreHealth` (and
    `/CheckHealth` and `/ScanHealth`) answer at the prompt, although DISM is
    not in the owner's 82-command list.
  - **App Deployment is rebuilt so the old answer is tried and fails.**
    - The copy from System32 fails with 0xc000007b.
    - `regsvr32` gives its real DllRegisterServer error.
    - The mechanism view explains System32 against SysWOW64.
    - Core-2-Sims itself is not touched.
  - **What counts as a guess:** the section 5.5 rule.
    - A command that changes something (or tries to) but doesn't move the
      job on counts.
    - So does an action that makes things worse.
    - Typos, "not recognized" errors, `help` and `/?` do not count.
    - **Read-only commands never count either**: `dir`, `tasklist`, plain
      `ipconfig`, `ping`, `winver`, `hostname`, `gpresult`, `cd`, `cls`.
      Looking before you act is the behaviour being taught, and counting it
      would punish exactly that.
  - **The 3D desk reuses the Core 1 tower** (`pcTower` in Core 1's
    `bench-room.js`), extended with a removable side panel, a drive cage,
    SATA ports, a monitor, a keyboard and a USB stick.
  - **The name is "A+ Core2 Under the Hood labs".**
- **The first lab is the Windows Tools Console.** It builds the simulated
  Windows desktop that four later labs reuse: Install, OS Troubleshooting,
  Malware and Lock It Down.

## 2. The objectives — A+ Core 2 (V15)

Quoted from the owner's "All updated Objectives" doc (ID
`1C9MhVjNyXHJ_i3mPthaBNRmB3A0_sG8UJmzv_H3Lddo`), read 30 September 2026.
The doc gives domains and topics with no numbered sub-objectives, and **none
are to be invented**. Re-read it at the start of each lab's build.

- **Operating systems (28%)**
  - OS installation: Windows, macOS, Linux, mobile
  - Windows tools: Task Manager, Command Prompt, Disk Management
  - File systems: file systems, updates, OS upgrades
- **Security (28%)**
  - Security measures: encryption, access controls, wireless security protocols
  - Malware prevention: detecting, removing, preventing
- **Software troubleshooting (23%)**
  - OS issues
  - Mobile troubleshooting: connectivity, app, performance
  - Security concerns: unauthorized access, malware
- **Operational procedures (21%)**
  - Documentation: best practices for system changes and documentation
  - Safety and communication
  - Backup and recovery

Every stage carries tags naming these topics by wording, not by number. A
check holds this in both directions: no stage may name a topic that does not
exist, and no topic may go uncovered. The Core 1 build worked this way.

## 3. The Core-2-Sims knowledge base — what is there (30 Sept 2026)

| Sim | Teaches | Doc topic | Goes to lab |
|---|---|---|---|
| Application Deployment Troubleshooting | BSOD / Event Viewer / commands, 3 dropdowns | Windows tools; OS issues | Windows Tools Console |
| Application Launch Troubleshooting | Missing MSVCP100.dll, Tier 1 scope | OS issues; Windows tools | Windows Tools Console |
| Email Threat Classification | Legit / spam / phishing | Malware; security concerns | Malware Bench |
| Help Desk Chat: Email | Professional reply | Safety and communication | Change and Communication |
| Help Desk Chat: Router | Professional reply | Safety and communication | Change and Communication |
| Malware Incident Response | 7 devices, Task Manager / logs / browser, quarantine | Malware; security concerns | Malware Bench |
| Tier 1 Router Support | Default password, save / reboot, escalate | Security measures; documentation | Lock It Down |
| Wireless Reliability Decision Lab | Interference, placement | (mostly Core 1 / Network+) | OPEN, see section 6 |
| WiFi AP Configuration | SSID, WPA mode, channel, band | Security measures | Lock It Down |
| Port Forwarding Configuration | WPA2, LAN/WAN IPs, 3389, screened subnet | Security measures | Lock It Down |
| Neighboring Routers | Channel, width, MAC filter | Security measures | Lock It Down |

**Topics with nothing in the sims at all:** OS installation; file systems,
updates and upgrades; mobile troubleshooting; backup and recovery; safety.
Disk Management, encryption, access controls and change management also have
nothing.

**How the sims fall short of the program rules:**

- They use 4 options, not 6.
- Submit reveals the answers; Port Forwarding prints "Correct answer is…".
- There is no hint ladder.
- The dashboard puts white on sky blue, which fails AAA.
- There is no dyslexia toggle, and the footer is not the standard one.
- Two copies are on disk but not linked from the dashboard: `Email Analysis 1.html` and
  `Help Desk - Email Same.html`.

## 4. The eight labs — RECOMMENDED

| Lab | Doc topics | Sims brought in |
|---|---|---|
| **Windows Tools Console** (first) | Windows tools; OS issues | App Deployment, App Launch |
| Install Bench | OS installation; file systems, updates, upgrades | none |
| Lock It Down | Security measures | WiFi AP, Neighboring Routers, Port Forwarding, Tier 1 Router |
| Malware Bench | Malware prevention; security concerns | Malware IR, Email Classification |
| OS Troubleshooting | OS issues | none |
| Mobile Bench | Mobile troubleshooting; security concerns | none |
| Change and Communication | Documentation; safety and communication | both Help Desk chats |
| Backup and Safety | Backup and recovery; safety and communication | none |

**Shell, carried over from the Core 1 build:**

- **Four lengths:** Quick, Lab, Project and Layered, with Layered as the
  default the dropdown opens on. The `core` path must be complete on its own.
- **Themes and reading:** dark by default, with a light toggle. The dyslexia
  toggle persists.
- **Instructor mode**, PIN 3693.
- **Progress** survives a closed tab.
- **Grading:** mechanism-led and consequence-graded, at project scale.
  Requirements are buried in the customer's waffle on purpose.
- **The engine is copied into this repo, not linked across repos:** runner,
  hints, options, reading, theme, instructor, storage, rng and the three.js
  renderer. A shared runtime between two sites breaks both the day one
  changes.

## 5. Windows Tools Console — the first lab (RECOMMENDED, in detail)

### 5.1 What the student sees

- **In 3D:** a technician's desk. On it are a tower with its side panel
  removable, a monitor, a keyboard, a job ticket, a USB stick and a spare
  4 TB drive in its anti-static bag.
- **Physical actions happen on the model:**
  - fit the drive into the bay
  - plug in the SATA data and power cables
  - insert the USB stick
- **The machine shows its state physically:**
  - the disk-activity LED blinks with disk load
  - the fan speeds up with CPU load
  - the power-to-login time is visible on the tower after a reboot
- **Windows itself is real HTML, not a picture painted inside the 3D scene.**
  When the student sits down, the camera moves into the monitor and the
  desktop fills the lab frame. Real HTML has three benefits:
  - it can be measured for AAA contrast
  - the dyslexia toggle reaches it
  - it zooms cleanly for students with damaged sight

  A picture painted in 3D can do none of these.
- **The Windows look:** Windows 11, with a note wherever Windows 10 differs.
  Windows' own neutral chrome (white, greys, black console) is used, with
  royal blue for accents. Any other hue gets a preview first.

### 5.2 The typed console

- **Opening it:** the student types `cmd` from Start or Run, or right-clicks
  Command Prompt and picks **Run as administrator**. Which one they opened
  matters (see the `admin` stage).
- **Parsing works like Windows:** case-insensitive, extra spaces are ignored,
  switches use `/`. Up-arrow history, `cls` and `exit` work.
- **Unknown commands get the real Windows error:** `'xyz' is not recognized as
  an internal or external command, operable program or batch file.`
- **`help` and `/?` work for every supported command** and print the real
  help. This is how the lab teaches itself: the owner's command list starts
  with them.
- **Launching tools:** `taskmgr`, `diskmgmt.msc` and `eventvwr.msc` typed at
  the prompt open that tool's window.
- **The command set is the owner's 82-command list** from
  `Windows-Linux-Commands`. The Windows commands answer:
  - help: `/?`, `help`
  - navigation: `cd`, `dir`, `md`, `rmdir`, `del`, drive letters
  - network: `hostname`, `ipconfig` and its switches, `ping`, `pathping`,
    `tracert`, `netstat`, `nslookup`
  - disk and system: `chkdsk`, `diskpart`, `format`, `copy`, `xcopy`,
    `robocopy`, `sfc`, `bootrec`
  - users and policy: `net user`, `net use`, `gpupdate`, `gpresult`
  - system: `winver`, `shutdown`, `exit`
  - processes: `tasklist`, `taskkill`
  - the listed MMC snap-ins
  - the listed PowerShell cmdlets

  Anything outside that list is OPEN (see DISM, section 6).
- **Output comes from machine state, not from canned text.** `dir` lists what
  is really on the simulated disk. `tasklist` lists what is really running.
  Ending a process in Task Manager removes it from `tasklist`.

### 5.3 Stages

**Core (Quick, 10–20 minutes, complete on its own)**

| Stage | The job | Tool | What it proves |
|---|---|---|---|
| `desk` | Read the ticket; which of six things did the customer actually say | 3D desk | Reading the scenario |
| `slow` | "It crawls since this morning." Find the culprit and deal with it | Task Manager | Sorting by the right column; not every busy process should be killed |
| `admin` | System files are corrupt. Repair them | Command Prompt | `sfc` refuses without elevation; open an administrator prompt; read what `sfc` reports |
| `disk` | Fit the new 4 TB drive and make it usable | 3D + Disk Management | Initialize GPT, not MBR; New Simple Volume; NTFS; drive letter. **Calculation:** why a 4 TB label shows 3.63 TB |

**Lab (adds 30–45 minutes)**

| Stage | The job | Tool | From |
|---|---|---|---|
| `deploy` | App broken after a deployment; others fine | Event Viewer, then Command Prompt | App Deployment sim (see the accuracy problem in section 6) |
| `launch` | "MSVCP100.dll is missing." Safest fix within Tier 1 scope | Apps, Event Viewer | App Launch sim |
| `startup` | Slow to log in. Cut the startup load without disabling the antivirus | Task Manager, Startup tab | new; boot time is measured on the 3D tower |
| `net` | One PC can't reach anything / can reach IPs but not names | `ipconfig`, `ping`, `nslookup` | new; APIPA 169.254, `/release` `/renew`, `/flushdns` |

**Project (adds 60+ minutes)**

| Stage | The job | Tool |
|---|---|---|
| `usb` | Customer needs a stick that works on a Mac and a Windows PC, carrying a 6 GB video | `diskpart`, `format`. FAT32 refuses the 6 GB file, and NTFS is read-only on the Mac, so the answer is exFAT. **`select disk` on the wrong disk and `clean` wipes the customer's data**; the reset takes the student back to the last good point |
| `extend` | C: is full and Extend Volume is greyed out | Disk Management. The recovery partition sits between C: and the free space, and the mechanism view draws the disk as a strip to show why extend needs space immediately to the right |
| `handover` | The job sheet: what you ran, what it showed, what you changed | Documentation. It is written from the student's own command history |

**Five more per stage, the standing rule.** Each stage has a pool of one base
scenario plus five. For example, the `slow` culprits:

- a browser with 60 tabs eating memory
- OneDrive's first full sync hammering the disk
- the search indexer after a large file copy
- **Windows Update installing:** the right move is to wait, not kill it
- **a scheduled antivirus full scan:** the right move is to reschedule it, not
  end it
- **a fake `svchost.exe` running from the user's AppData folder:** that is
  malware, so it is handed to the Malware Bench rather than just ended

Several of those are near misses on purpose: the busiest process is not always
the one to end.

### 5.4 Consequences — what a wrong action does

- **End `explorer.exe`:** the taskbar and desktop vanish. The student gets
  them back from Task Manager → Run new task → `explorer`.
- **End `csrss.exe` or another critical process:** Task Manager warns that
  ending it "will shut down the operating system immediately". If the student
  goes ahead, the machine blue-screens with `CRITICAL_PROCESS_DIED` and
  reboots.
- **Initialize the 4 TB drive as MBR:** 1.64 TB shows as unallocated space
  that can never be used, with the mechanism view showing the MBR 2 TiB line.
- **Format the stick as FAT32:** "The file is too large for the destination
  file system."
- **`clean` the wrong disk:** the customer's files are gone. **Reset to the
  last part they got right** puts the machine back, and hints continue from
  there. A wrong answer never carries forward and poisons the steps after it.

### 5.5 Hints for typed commands

Owner's standing ladder: nothing for guesses 1–2; rung 1 on guess 3; rung 2 on
guess 4; rung 3 on guess 5 and every guess after, forever. **No rung ever
gives the command.**

- **What counts as a guess — RECOMMENDED:**
  - A command that runs but doesn't move the job on counts.
  - So does an action that makes things worse.
  - A typo, or a "not recognized" error, does **not** count; Windows' own
    error is feedback enough.
  - `help` and `/?` never count. Using them is the behaviour being taught.
- **Rung 1, where to look.** For example: "The prompt's title bar says
  something about who you are running as."
- **Rung 2, the principle.** For example: "Tools that repair Windows' own
  files need an administrator's token."
- **Rung 3, the field narrowed.** Six candidate commands, four struck through,
  each with its reason and marked three ways (colour, an inset rule and the
  words), and two left alive. **The student still types the command.**
- **Diagnosis questions** ("which process is the culprit, and why") are the
  standard six options: one right and five near misses. A wrong pick goes red
  and stays red, marked three ways.

### 5.6 Mechanism views

- **Task Manager:** "What is this process?", covering:
  - who started it and where it runs from
  - what each `svchost.exe` is hosting
  - why a critical process can't be ended safely
- **Command Prompt:** a "what just happened" strip under each command. For
  example, `sfc` compares protected files with the copies Windows keeps in its
  component store; an elevated prompt carries an administrator token and a
  standard one doesn't.
- **Disk Management:** the disk drawn as a physical strip with the partitions
  in order. It shows why extend needs space immediately to the right, and
  where MBR's 2 TiB limit falls.

### 5.7 Checks this lab will carry

Every check is shown to fail before its pass is trusted.

- **Tags:** every stage is tagged, and every doc topic this lab claims is
  covered.
- **Every scenario is solvable:** a script types the fix and asserts the
  machine state really is fixed.
- **Every generated fault is actually exhibited:** the culprit really tops
  the column it is meant to top, and the file really is missing.
- **No hint rung contains the answer command.** The plant: a hint containing
  `sfc /scannow` must fail.
- **Destructive actions reset:** after `clean` on the wrong disk, a reset
  must restore the files.
- **Six options** on every diagnosis question, one correct.
- **No screen shows the answer before the student finds it.** The first
  preview broke this three times, which is why it is a check:
  - Task Manager was drawn already sorted, with the culprit highlighted.
  - The "what is this process" panel stated the conclusion instead of the
    facts.
  - The Initialize Disk dialog had GPT pre-ticked. That is Windows' real
    default, but here it answers the question, so the lab clears it.
- **AAA on painted pixels,** in both themes and with the dyslexia toggle on.
  The toggle must persist.

## 6. Open questions

- **SETTLED 30 Sept (rebuild it) — the App Deployment sim's answer key
  contradicts itself, and part of it fails on real Windows.**
  - The evidence contradicts the explanation. The sim's `ls msvc*` output
    shows `msvcp100.dll` **present** in `C:\Windows\System32`, but the
    explanation says that same output shows the file **missing** from
    System32.
  - The key's first fix is wrong for a 32-bit app. It copies the DLL from
    another PC's `System32` into `C:\Program Files (x86)\Testing`. On 64-bit
    Windows, System32 holds the 64-bit DLLs; a 32-bit app in
    `Program Files (x86)` needs the 32-bit copy from `SysWOW64`. Copying from
    System32 gives the wrong bitness, and the app then fails with 0xc000007b.
  - The key's second fix fails. `regsvr32 msvcp100.dll` doesn't work: it is
    the Visual C++ 2010 runtime, not a COM server, so Windows reports the
    DllRegisterServer entry point was not found.
  - The BSOD tab (DRIVER_IRQL_NOT_LESS_OR_EQUAL) has nothing to do with a
    missing application DLL.
  - The sister sim, App Launch, gives the right Tier 1 answer: repair or
    reinstall the application. Reinstalling the Visual C++ 2010
    redistributable is what actually fixes it.

  **RECOMMENDED:** rebuild `deploy` so the old answer is *tried and fails*:
  the copy from System32 gives 0xc000007b, `regsvr32` gives its real error,
  and the mechanism view explains System32 vs SysWOW64. That makes the two
  sims disagree somewhere real, which is a Core 1 rule. Core-2-Sims itself is
  not touched. **The owner decides.**
- **SETTLED 30 Sept (include it) — DISM.** `DISM /Online /Cleanup-Image /RestoreHealth` is the
  standard repair when `sfc` can't fix what it finds. It is in neither the
  doc nor the owner's 82-command list. Include it, or keep to the list?
- **SETTLED 30 Sept — what counts as a guess** at a typed prompt (section 5.5 has the
  recommendation).
- **SETTLED 30 Sept (reuse the Core 1 tower) — the 3D desk and tower.** RECOMMENDED: reuse the Core 1 tower model
  (built from the owner's photographs), and add a desk, monitor, drive bay
  and USB stick. Photos of a real technician's desk, or of a tower's drive
  bay with the side panel off, would make it better.
- **SETTLED 30 Sept — the site's name.** RECOMMENDED: "A+ Core2 Under the Hood labs", to
  match Core 1's official "A+ Core1 Under the Hood labs".
- **OPEN, from the first round:**
  - how deep macOS and Linux go
  - whether Wireless Reliability is folded into Lock It Down
  - whether Core-2-Sims gets its contrast and footer fixed
  - photos for the later labs

## 7. What is built — the laptop, live from 1 October 2026

It replaced VM build 1, which replaced the first build. Section 9 has how
each part came about.

### Runtime (what GitHub Pages serves)

`index.html` and `assets/`. Static HTML, CSS and vanilla ES modules. There
is no build step, and nothing is fetched from another site.

| File | What it is |
|---|---|
| `index.html` | The page: the laptop fills the window; the full footer sits under it |
| `laptop.js` | The laptop. It holds:<br>• sign-in (password `TechStart-2026`, shown on screen)<br>• the desktop, windows you can move, the taskbar, Start, and the Settings tray (dyslexia, light mode, instructor PIN 3693)<br>• Help Desk: the queue, and one page per ticket<br>• remote support sessions, which drop on restart, shutdown or a crash<br>• Mason's chat and the hint ladder<br>• crawl, walk and run (`LEVEL`, `WALKS`)<br>• the walk-over (`ROUTES`, `walkOver`)<br>A test seam: `window.__LAP` |
| `laptop.css` | The laptop's own look. It follows light/dark as Windows does |
| `desktop.js` | One PC's Windows 11 screen, drawn inside a remote session or on the monitor at the desk |
| `style.css` | The styles `desktop.js` uses |
| `machine.js` | One simulated PC as plain JSON. The DLL loader, repair and reinstall, runtimes, boot. No DOM |
| `cmd.js` | The typed Command Prompt and PowerShell: `dir`, `copy`, `robocopy`, `del`, `regsvr32` (its real error), `setx`, `echo %PATH%`, `gpupdate /force`, `gpresult /r`, installers from `\\FS01\Software`, `\\HOST\C$` paths, and Windows' own wording for every refusal |
| `mech.js` | The "What just happened" line under each command |
| `fleet.js` | The eight machines, the five programs, Software Center's catalogue |
| `tickets.js` | The twelve tickets |
| `engine.js` | The session: snapshots, guesses, the ladder, saved to `localStorage` (`c2vm.session.v1`; the laptop's own state is `c2vm.laptop.v1`) |
| `order.js` | The order six options are shown in |
| `office3d.js` | The 3D office on three.js. It has your IT bench in the closet, and `walk`, `standAt` and `shift` for the walk-over |
| `three/`, `daylight-hdri.txt` | three.js 0.160 (MIT) and a CC0 Poly Haven HDRI |

**Crawl, walk, run:**

| Level | Tickets | What the student gets |
|---|---|---|
| Crawl | L1 (12 steps), D1 (20 steps) | Mason's panel rings the one thing to press, with what and why |
| Walk | L2 (9 items), D2 (11 items) | A checklist that ticks itself off; "How?" pointers |
| Run | L3–L6, D3–D6 | Exam conditions: Mason's ladder only |

**The machines** (the Malware sim's seven, plus yours):

| Host | Who | Where |
|---|---|---|
| your laptop | you | the IT bench in the network closet |
| WS1-HR | John Doe | Office 1 |
| WS4-FIN | Farah Nkemelu | Office 1 |
| WS2-SALES | Brenda Smith | Office 2 |
| WS3-DEV | Dev Patel | Office 3 |
| WS5-RECEPT | Rosa Ortiz | Reception |
| FS01 | file server | network closet |
| MAIL01 | mail server | network closet |

Everyone signs in as a standard user, you included. Mason gives the admin
credentials for UAC (RAFIKI\itadmin / Bench-Tech-2026).

### The tickets

| Ticket | PC | Fault | Right outcome |
|---|---|---|---|
| **L1** (sim) | WS4 | Testing: VC++ 2010 x86 missing | repair/reinstall Testing |
| L2 | WS2 | PayWise: VC++ 2015 x86 missing | repair/reinstall PayWise |
| L3 | WS3 | Scan2Doc: VC++ 2013 x86 missing, installer does not carry it | repair, then escalate |
| L4 | WS5 | Testing: config file damaged | repair |
| L5 | WS1 | LabelPro shortcut points at the old folder | repair |
| L6 | WS4 | ChartView crashes inside itself | repair, then escalate |
| **D1** (sim) | WS1 | Testing: VC++ 2010 x86 missing; the sim's Event Viewer entries 2184–2191 and the BugCheck distractor | x86 runtime, or repair; cause = 2190 |
| D2 | WS4 | PayWise: installer does not carry the runtime | x86 VC++ 2015 runtime, elevated |
| D3 | WS5 | the deployment wiped the PATH | put Common Files\Rafiki back, or repair |
| D4 | WS3 | Group Policy install pending a restart | `gpupdate /force`, Y |
| D5 | WS2 | a 64-bit msvcp100.dll in Testing's folder | delete it, or repair |
| D6 | WS3 | LabelPro 64-bit, x64 runtime missing | x64 runtime, or repair |

**What counts as a guess.** Looking never counts:
- opening a tool, reading a log, running the program to test it
- `dir`, `help`, a typo

These do count:
- a change that does not move the machine closer to fixed
- anything refused
- anything out of the ticket's tier
- trying to Resolve or Escalate while the machine is still broken

**Putting back your own change does not count.** If the machine had moved
away from the snapshot and the action returns it there, it is not a guess.

**Rung 3** strikes four options, each with its reason, and leaves two
alive. The wrong one left alive is one the student has not already ruled
out, and of those the one nearest the right answer in length, so "pick the
longer one" never works.

### Checks: `verify/`

```
node verify/logic.mjs      # no browser · 17 plants
node verify/page.mjs       # drives the laptop · 10 plants
node verify/contrast.mjs   # AAA on painted pixels, dark / light / dyslexia · 4 plants
```

`--plant` runs the calibration. Each plant must be caught by the check it
was written for. `ONLY=WALK node verify/page.mjs --plant` runs one.

The page checks:
- **LOAD:** sign-in, and the 12 tickets with their labels.
- **CRAWL:** L1 and D1 finished by following only Mason's rings.
- **WALK:** L2 driven out of order.
- **RUN:** L4, and Mason's ladder.
- **RED, NOTE, REVERT:** the cause marks, the note check, and revert.
- **DROP:** a restart ends the session.
- **WALKOVER:** shut down, walk over, power on, walk back.
- **PERSIST:** a reload keeps the work and the settings.

**What the contrast sweep does not measure:**
- text behind a modal's scrim, or under the Start menu or Run box
- text scrolled out of its own box
- the hidden inside of a closed `<details>`
- text covered, even partly, by another window or a notification

### Found while building, and fixed

- **The right close answer was the longest option in 10 of 12 tickets.**
  The wording was rebalanced, and the check allows at most a third.
- **Right answers clustered in slot 5** (5 of 12). A new salt spreads them
  1-2-2-2-2-3.
- **Opening a ticket, or reverting, closed the Help Desk.** It now reopens
  on TECH-01.
- **A primary button went pale grey on hover, under white text:** 1.24:1.
  Found by the sweep.
- **Enter in the instructor PIN box** unlocked instructor mode and then
  clicked the button again, turning it straight back off.
- **Robocopy printed the local path** for a `\\HOST\C$` source. It now
  prints the real one.
- **Rung 3 left alive a move the student had already tried** (D1's
  robocopy, which they had watched fail). Moves the machine recorded them
  making are now always struck.
- **`powershell <command>` at cmd left the console in PowerShell.** It now
  runs the one command and returns, as Windows does.
- **Deleting a DLL you had just put there counted as a guess.** It no
  longer does (see above).
- **On the laptop** (previews 1–5, all in section 9):
  - a lost student got no help
  - Mason's ring covered a label
  - a skipped crawl step left the panel stuck
  - `dir` of one file said "File Not Found"
  - restarts left a remote session running
  - the office doors swung into the corridor
  - two monitors faced the wall
- **The contrast sweep never measured Mason's rung-3 message** after L1
  became a crawl (Mason sends no ladder hints during a crawl). Its plant
  ("struck moves faded") was missed, which exposed the gap. The sweep now
  brings up rung 3 on a run ticket, and the plant is caught.

### Known, not yet done

- **The other nine sims are not built yet:**
  - mail and Email Threat
  - Malware IR (the walk-over's first real use: an infected PC to unplug)
  - the router's web admin and app
  - the router sims, with the Wi-Fi floor plan, the movable microwave and
    the three-house street
  - the two chats
- **No ticket starts with an unreachable PC yet,** so the walk-over is
  reached only when a student shuts down, crashes or unplugs a PC
  themselves.
- **The 3D walk needs a reasonable graphics card.** "Skip the walk" covers
  slow machines.
- **On a narrow screen**, the user's own taskbar can scroll out of sight
  inside the remote session window.
- **Photo textures** are blocked by this environment's network policy, so
  the office is clean 3D, not photographic.

## 8. The direction from 30 September 2026 — SETTLED

The owner, after seeing the first build:

> "Are you constructing this as a VM to mimic a live computer? Because that
> is what I am looking to do. You are only using the Core 2 sims to build
> this correct? Because it looks like you are mixing Core 1 with Core2. These
> are separate!"

> "What is the closest we can do to create a virtual machine like experience
> for students to be able to get hands-on experience based off the Sims that
> are for Core 2 and Core 2 only? … The routing is a different one. But we
> can do it from the computer. They would either have to use an app or sign
> in through the web to change the router."

> "One company, web and app, five per sim" · "Name of company is Rafiki's IT
> Services"

- **A VM-style live computer.** A real Windows VM cannot run in a web page:
  Microsoft's licence and the browser both rule it out. It is a simulated PC
  that behaves like a running one:
  - one machine that stays on, and whose state persists
  - the faults are really present on the machine, and every tool reads the
    machine
  - consequences are real
  - students can explore freely, with nothing laid out as numbered steps
  - "revert to snapshot" takes it back to the last point they got right
- **Core-2-Sims ONLY, and nothing from Core 1.** This rules out Core 1's
  content, models, design and hardware stages (fitting a drive, SATA cables,
  the TB-to-GB calculation). Whether the plumbing code copied from Core 1
  stays is OPEN.
- **One company: Rafiki's IT Services.**
- **The router is its own device, reached from the PC** by signing in at
  192.168.1.1 in the browser, or through a router app. Both are used.
- **Five extra scenarios per sim**, so 11 sims + 55.
- **Marking** (settled 30 Sept, owner: "Yes"): a ticket closes only when the
  machine or router is really fixed, and the student then writes the ticket
  note.
- **Order of work:** finish Core 2, then Networking, then go back and
  improve Core 1.

The preview the owner saw of this direction:
`scratchpad c2sims/vmprev/index.html`. It is a desktop with a ticket arriving,
Event Viewer and a prompt, the mail client, the router page, the seven-PC
office and the help desk chat. It was not pushed.

### The answer-key audit of Core-2-Sims (30 Sept) — for the owner to rule on

| Sim | Finding |
|---|---|
| App Deployment | **Wrong** (see section 6). The owner ruled: rebuild so the old answer is tried and fails. |
| App Launch | The key is sound, but **all four right answers are option (a)**, the first one. |
| Wireless Reliability, variant A | The clues are lunch hours and equipment in the breakroom, which is microwave interference. The key says the main cause is range and wall penetration, and the band to pick is 2.4 GHz, the band microwaves interfere with. The four right answers are also all option 1. |
| Wireless Reliability, variant C | A long hallway calls for range, but the key picks "dual-band with client steering". Debatable. |
| Port Forwarding | **Likely backwards.** The key puts the Windows PC in the screened subnet and the game console on the LAN. The customer asked for "remote access to a Windows PC" (a port-forward rule, 3389) and "all chat and optional functions in their game console" (what a screened subnet gives it). Exposing RDP to the internet from a screened subnet is also risky. Its explanation says "TLS is not used for Wi-Fi", but EAP-TLS is. |
| Email Threat Classification | "Make Your Computer 3x Faster (Free Download)" is keyed spam. It pushes an unverified download, which is arguably the malicious kind. Owner's call. |
| Help Desk chats | The keys are sound (IMAP over SSL is port 993). Each step has only three replies, and one is joke-level ("Blow on the SIM card"). |
| Malware IR | The key is sound. It grades against PICERL (incident response). A+ Core 2 teaches CompTIA's malware removal best-practice steps. Which to follow is OPEN. |
| Tier 1 Router, WiFi AP, Neighboring Routers | Sound. Router 3 on channel 11 clears the neighbours on 1 and 6. |

### Settled on 30 Sept, after the audit and the 3D discussion

The owner: "Use the floor plan, swap port forwarding, follow CompTIA malware
steps". They also said yes to each 3D point and to the company shape.

- **Port Forwarding is swapped.** The Windows PC stays on the LAN and is
  reached by a port-forward rule (TCP 3389). The game console goes in the
  screened subnet.
- **Malware follows CompTIA's malware-removal steps**, not PICERL.
- **The 3D model is the WiFi sim's office_map.PNG, built as an office the
  student can walk around.**
  - It is sized to standard office dimensions:
    - private offices of 100-150 sq ft
    - corridors at least 44 in wide
    - conference rooms at 20-25 sq ft a person
  - Each desk's PC is a machine the student opens. The seven Malware-sim
    machines live in it: HR and Finance in Office 1 (the plan has three
    offices for five workstations), Sales in Office 2, Dev in Office 3,
    Reception at the counter, and the file and mail servers in the
    network closet with the access point.
- **Wi-Fi coverage is drawn in the model from the student's own router
  settings and the walls.**
  - 2.4 GHz gets through the thick walls; 5 GHz does not.
  - The Office 3 tablet connects or drops, and says so in words.
  - The model shows what the settings do, never what they should be.
- **The three houses from Router_houses.png get a 3D street.** It shows each
  router's reach and channel.
- **The company's shape:**
  - The student is a Tier 1 technician at Rafiki's IT Services.
  - Mason is their team lead.
  - The seven-PC office is Rafiki's own.
  - The callers, the port-forwarding home, the three houses and the
    replacement-router office are customers.
- **The 3D preview** (scratchpad `c2sims/geo/`, not pushed) is drawn fresh
  for Core 2. It uses only the three.js library and a CC0 Poly Haven
  daylight HDRI from the @pmndrs/assets npm package. The owner asked for
  views "realistic … like you see on Google Maps". The preview has a
  tilted aerial, a top-down, a cutaway, the Wi-Fi heatmap at 2.4 and
  5 GHz, a street-level view, and the street with each router's channel.
  It is clean 3D, not photographic. Photo textures (Poly Haven, ambientCG)
  are blocked by this environment's network policy.

### Settled on 30 Sept, the last rulings before building

- **The microwave has to be movable.** The owner: "We need them to move it
  away from AP and it needs to show a decent amount of movement. Like across
  the room." It starts beside the access point, where it spoils 2.4 GHz for
  the whole office. The student moves it across the room, and the damage
  shrinks to a patch around its new spot. The change must be large and
  obvious.
- **HR and Finance share Office 1.** The owner: "As long as when the students
  have no problem switching computers if needed." So every machine is also
  one click away in a machine list, not only in the 3D office.
- **The sims' answer keys are exam prep and stay as supplied.** The owner:
  "What I have supplied you is part of the exam prep. We need to keep the
  exam prep. Do what matches the exam prep." Wireless Reliability keeps its
  keys: variant A is range and wall penetration at 2.4 GHz, and variant C is
  dual-band with client steering. The audit notes in the table above are
  observations, not changes. The rulings that DO change a key are Port
  Forwarding (swapped), malware (CompTIA's steps) and App Deployment
  (rebuilt).
- **"Make Your Computer 3x Faster" is a malicious download**, not spam.
- **The realism is good enough for now.** The owner: "Lets keep building.
  Once it is finished and I interact with it. I will give you a final answer."
- **The objectives were re-read on 30 September 2026**, at the start of the
  build. The Core 2 wording is as quoted in section 2, with two small updates:
  - Backup and recovery: "setting up workstation backups and recovery
    processes"
  - OS issues: "diagnosing and resolving problems with operating systems
    and applications"

### OPEN, as of this entry


- **The code:** VM build 1 uses Core 2's own code only; every file copied
  from Core 1 was removed (section 7). The owner has not ruled on this
  explicitly.
- **Wireless Reliability:** keep it in Core 2, or move it to Networking.
- **The doc's topics that have no sim** (OS installation, file systems,
  mobile, backup and recovery, safety): new tickets on the same PC, or sims
  from the owner.

## 9. The laptop — SETTLED 1 October 2026

The owner, after trying VM build 1:

> "This is not user friendly at all. I want it to mimic a real help desk
> that is like you are operating a computer. … There's too much jumping
> around. … I want it more real world feeling … so you sit down and you
> feel like you're actually at a virtual machine or you're actually at
> working on your laptop, solving tickets, clearing them up, but it's real
> world. You're using different programs to solve it."

> "I have five students who are just doing the program to earn the grade
> and the hours and they're not gonna be able to earn the certificates
> because they don't have the hands-on aspect they need … some of the
> things we teach they need to actually physically do them as best they
> can from the computer."

**Reference points, not templates:** the Security Start-up Firewall and the
VOO SOC. The owner: "I'm trying to create something new. I'm just trying to
give you reference points so that way you can tweak it."

**What was wrong with VM build 1** (Claude's diagnosis, accepted):
- It was a web page *about* a computer. One ticket was spread over three
  places: the clipboard, the Help Desk inside TECH-01, and the machine list.
- Switching PCs was a teleport from a list outside the computer.
- The screen was small, under a big header.
- The 3D office sat on every page doing nothing.

**What is settled:**
- **The whole browser window is the student's work laptop**, after a
  Windows sign-in screen ("Yes, I like the signing in").
- **The Help Desk is a program on the laptop.** One ticket page holds
  everything for that ticket: the user's message, the PC's details, notes,
  the activity log, Resolve and Escalate, the cause question and the note.
- **The user's PC is reached by remote session** from the laptop, which
  opens as a window. Switching PCs means switching windows.
- **When remote cannot work, the student walks over.** That covers a PC
  that is off, blue-screened, off the network, or a physical job. The owner:
  "if they have to physically go look at the machine … have the student
  walk to the office and 3D."
  - Claude's proposal, to be shown in a preview: Connect fails the way it
    really would. The ticket then offers "Walk to the desk", the 3D office
    walks the student there, and the PC's own monitor and physical actions
    are in front of them. "Walk back" returns to the laptop.
- **Hints come from Mason, the team lead, in a chat program.** The owner:
  "That way it's guiding them still, not giving them the answer." The
  standing ladder is unchanged.
- **The other sims arrive as more programs on the same laptop.** That means
  mail, a browser for the router's 192.168.1.1, the router app, and
  customer chats. The owner: "as long as it's also more interactive … feels
  more real and more hands-on."
- **The Wi-Fi and microwave job opens a floor-plan program**, 2D from
  above, where the microwave is dragged across the room ("that's something
  we'll have to work on").
- **The three-house 3D street stays.** The owner: "I do like what you did
  with the three houses, but I haven't seen it in working view yet. So keep
  that."
- **Dyslexia text, light/dark and instructor mode** move into a small tray
  menu on the taskbar.
- **VM build 1 stays live until the new version is ready.**
- **Previews along the way**, not pushed until the owner has tried them.

**Kept from VM build 1:** the machine model, the typed commands, the twelve
tickets, the hint ladder's rules and the checks. Only what the student
sees and touches is rebuilt.

### Crawl, walk, run — SETTLED 1 October 2026

After preview 1 the owner said: "I can't even fix the first ticket. I am
clicking everywhere and Mason is no help." Then: "We need to apply the
crawl, walk, run method here."

**What went wrong in preview 1** (Claude's diagnosis):
- Farah's desktop gave nothing to go on: two blank boxes, and no search in
  Start.
- Mason only helped after three wrong *moves*, and clicking around is not
  a move, so a lost student never got help. "I'm stuck" said "give it a go
  first".

**The method, as built in preview 2 (scratchpad, not pushed):**
- **Crawl:** the first ticket of each sim (L1 now; D1 next). Mason walks
  the student through it from a panel docked beside the windows. Each step
  says what to do and why, and puts a yellow ring on the one thing to
  press. It waits until the student has really done it on the machine;
  nothing is done for them. The steps are: see it for yourself, find the
  evidence, work out the cause and the safe fix, fix it, test it, close it
  out, document it.
- **Walk** (proposed, not built): the next ticket. A checklist the student
  drives, ticking itself off as they go.
- **Run:** the rest, under exam conditions.
- **"I'm stuck" always helps now.** Before any wrong moves, Mason says
  where the student is in the job and which tool comes next. That is how
  to work, not the answer; the answer hints still follow the ladder.
- **Farah's PCs gained Start search** ("type event", "type software"), as
  Windows has.

The steps are named in plain words, not as CompTIA's troubleshooting
methodology, because that methodology is a Core 1 objective and the builds
are kept separate.

**Preview 3 (1 October 2026, scratchpad and the private preview page, not
pushed):** the owner said "Build the walk for L2 and crawl for D1".
- **L2 walk:** a nine-item checklist that ticks itself off, in any order.
  Each item has a "How?" pointer, which never names the fix. No rings.
- **D1 crawl:** 20 steps. They include reading entry 2190, ruling out the
  BugCheck on timing, the UAC prompt, `dir` in SysWOW64 and System32, the
  sim's old robocopy giving 0xc000007b, `regsvr32` failing, deleting the
  stray copy, and installing the x86 runtime from `\\FS01\Software`.
- **A crawl catches up when a student skips ahead.**
- **`dir` of a single file** (`dir C:\Windows\System32\msvcp100.dll`) now
  lists it, as Windows does. The fix is in the preview's `cmd.js` and must
  be carried into the repo when the laptop build is adopted.

**Preview 4 (1 October 2026, not pushed):** the owner said "Build the walks
for D2 and the run tickets".
- **D2 walk:** an 11-item checklist. The "How?" pointers name the share
  and the idea of bitness, never the installer.
- **Run tickets** (L3–L6, D3–D6) are labelled "Run: on your own" in the
  queue and show no panel. Mason gives a pointer on request before any
  wrong moves (now covering the System log, and a program Windows can't
  find), then the standard ladder.
- **A restart or shutdown ends the remote session**, as it does for real.
  After a restart, a Reconnect button appears; a PC that was shut down
  can't be reached (that is where the walk-over will come in).
- **All twelve tickets play through the laptop UI**, each fault showing
  itself as its ticket describes. The crawls were tested by following
  only Mason's rings, the walks by driving them out of order, and the run
  tickets with the fix a student would use.

**Preview 5 (1 October 2026, not pushed): the walk-over in 3D.** The owner
said "Build the walk-over in 3D next."
- **Your desk is now in the model:** an IT bench in the network closet,
  beside the rack. Every walk starts and ends there.
- **The routes** go out of the closet door, along the corridor and through
  the office door to the user's chair, at standing eye height and about
  5.5 ft a second, then turn to the monitor. "Skip the walk" is offered,
  and reduced motion cuts straight there.
- **The walk-over is offered** on every ticket ("Walk to Dev's desk"), and
  whenever remote support can't reach the PC:
  - it is switched off
  - it blue-screened (the remote session now drops with "Connection lost")
  - its network cable is unplugged
- **At the desk:** the PC's real screen, plus what only someone standing
  there can do: press the power button (with a warning against forcing it
  off when it is already on), and check the network cable and plug it back
  in. "Walk back" retraces the route.
- **Model fixes found by rendering each arrival view:**
  - office doors swung out into the corridor (the walk went through one);
    they now open into the rooms
  - Farah's and Rosa's monitors faced the wall; they now face their chairs
  - Rosa's PC was buried in the tall counter; her work surface is now at
    desk height
  - the servers gained status lights
- **Not yet used by a ticket:** no current ticket starts with an unreachable
  PC. The Malware build (an infected PC to unplug from the network) is the
  natural first user.

## 10. The Malware build — SETTLED 1 October 2026

**The objectives were re-read on 1 October 2026,** from the owner's doc. The
Core 2 wording is unchanged. This build covers:
- **Security, Malware prevention:** "detecting, removing, and preventing
  malware threats"
- **Software troubleshooting, Security concerns:** "fixing unauthorized
  access and malware issues"
- **Operating systems, Windows tools:** "managing systems with Task
  Manager, Command Prompt, and Disk Management"
- **Operational procedures, Documentation:** "using best practices for
  system changes and documentation"
- **Operational procedures, Safety and communication:** "following safety
  protocols and communicating effectively"

**The sim** (`Malware Incident Response.html` and its answer key):
- Brenda (WS2, Sales) downloaded "unapproved software to edit a PDF
  contract".
- `SCVHOST.exe` runs at about 90% CPU on WS2 and on the file server.
- The clues:
  - WS2: "UAC Prompt Allowed", "New Service Installed", and
    `totally-legit-soft.net/download/setup.exe` in the browser history
  - the server: "High Traffic", "Unknown executable written"
- The key: inspect all 7 systems; quarantine WS2 and the server first,
  then stop the malware; never quarantine a clean PC or stop a legitimate
  process.

**The owner's answers** ("Yes to all"):
- **Cutscenes, built into the walk-overs in this build.** The owner asked
  for them "like a cut screen from a video game", for the walk-overs, the
  microwave job, "and everything else that needs to be 3D for the
  students to learn". A cutscene has:
  - letterbox bars
  - an aerial establishing shot swooping into the building
  - eased camera moves with a slight walking sway
  - game-style captions
  - fades to black
  - a Skip button
  - a plain cut for reduced motion
- **Quarantine** is unplugging the network cable at the desk (or, for the
  file server, at the rack). Disabling the network adapter remotely is
  also accepted, and it drops the remote session at once.
- **Out of order means real consequences, not an instant fail.** Each
  counts as a wrong move, and Mason explains it:
  - stop the malware before quarantine, and it spreads to another PC and
    its service restarts it
  - quarantine a clean PC, and that user complains
- **Every PC on the network must be checked**, as in the sim.
- **Every walk starts at the student's IT bench in the network closet.**
  SETTLED 1 October 2026. The owner, asked whether students should have
  an office of their own elsewhere: "Nope the IT bench is perfect".

**The cutscenes as built (scratch preview, 1 October 2026, not pushed).**
The owner saw rendered videos of four walks: to Brenda's office, back to
the bench, to the server rack, and to reception.
- Each walk fades in over an aerial shot of the office, then swoops down
  into the closet already facing the door, and walks the route with a
  slight step sway.
- Letterbox bars carry a game-style caption, such as "TO OFFICE 2 ·
  Brenda Smith, Sales · WS2-SALES".
- It fades to black at the desk. Skip is always there.
- The cutscene fills the screen; Mason's crawl panel returns at the desk.
- Reduced motion cuts straight to the desk.
- The rack is a few steps from the bench, so that walk has no aerial
  shot.
- So far only the walk-overs are cutscenes. The microwave job and the
  three-house street come with the router build.

**Preview 7 (1 October 2026, the private preview page, not pushed): the
whole Malware build.** It is waiting for the owner to try it before it
goes live.
- **The tickets:** M1 is a 23-step crawl, M2 a 10-item walk, and M3–M6
  are run tickets. The six scenarios are in the table above.
- **New files:** `malware.js` (the model) and `tickets-malware.js` (the
  tickets).
- **Windows gained these tools:**
  - Edge's history
  - Windows Security: scans, the Offline scan, protection updates and a
    scheduled scan
  - System Properties › System Protection
  - Network Connections
  - Windows Update
  - File Explorer's drive buttons, a USB stick at the desk, and
    mpam-fe.exe
- **And these commands:** `netsh`, the Defender, restore-point and
  network-adapter cmdlets, and `taskkill`, all judged exactly as their
  buttons are.
- **Consequences:**
  - A malware process ended while the PC is online restarts, and spreads
    to the ticket's next PC.
  - A running file can't be deleted.
  - Old definitions miss it; a quick scan finds it but can't remove it.
  - A restore point made while infected counts as a wrong move.
  - A clean PC that is unplugged brings a complaint from its user.
- **Checks:**
  - logic: 18 tickets, 23 plants
  - page: 13 groups, including MALWARE (M1 by Mason's rings only), CINE
    and MALRUN (M2 and M6 through the UI alone)
  - contrast: the Malware screens and the cutscene caption
- **Found and fixed:**
  - Mason's step list named the infected PCs from step 1.
  - A crawl step that was already true on a clean office made the crawl
    jump to step 19.
  - The ring was hidden behind another window.
  - Connect did nothing on a session that had dropped.
  - Skip did nothing after the walk was frozen.
  - The right "educate the user" reply was about twice the length of the
    wrong ones in all six tickets.
  - Desktop icons overlapped the desk monitor's top bar.
  - The contrast sweep could not see text in layers that ignore the mouse
    (the cutscene caption), and it took an invisible fade layer for one
    that covers the text.

**CompTIA's malware-removal steps** (the owner's earlier ruling, instead of
PICERL), as hands-on work:

| Step | What the student does |
|---|---|
| 1. Investigate and verify symptoms | On each PC: Task Manager (the fake process runs from AppData and is unsigned), Event Viewer (a new service installed, UAC allowed), the browser's history |
| 2. Quarantine | Unplug the cable at the desk, or disable the adapter |
| 3. Disable System Restore | System Protection, at the desk |
| 4. Remediate | Update the definitions offline from a USB stick, then run a Microsoft Defender Offline scan. Scanning first misses it; ending the process alone lets its service restart it |
| 5. Schedule scans and run updates | Windows Security and Windows Update |
| 6. Enable System Restore and create a restore point | System Protection |
| 7. Educate the end user | The close question: what to tell the user, from six replies |

**Six scenarios:**

| | Level | Scenario |
|---|---|---|
| M1 | Crawl | The sim: the fake PDF editor on WS2, spread to the file server |
| M2 | Walk | "Make Your Computer 3x Faster", the malicious download (the owner's ruling), on WS1 |
| M3 | Run | A browser hijacker at reception (WS5) |
| M4 | Run | A cryptominer disguised as a Windows process on WS3, from a bad VS Code extension |
| M5 | Run | Fake antivirus scareware on WS4 |
| M6 | Run | An allowed Excel macro on WS4 (in the sim it was blocked, a clean clue) |


## 11. The remaining builds — SETTLED 1 October 2026

The owner said "Finish building them out" and chose **all remaining
sims**: mail and Email Threat, then the router, then the Help Desk chats,
each with a crawl, a walk and run tickets, plus five extra scenarios per
sim. The objectives were re-read on 1 October 2026; the Core 2 wording is
unchanged (section 2).

The owner's answers, verbatim where it matters:
1. **Go live, not preview-first.** "Doing it live works best for me
   because it is solving two issues at once. I can debug it and see how it
   looks for the students." Checks still pass before every push.
2. **Four email categories: legitimate, spam, phishing, malicious.**
   "The sims need to stay current with the time because IT is a fast
   paced changing world."
3. **Two steps per email:** first the category, then a six-option
   question on the giveaway. "This way the students have to think through
   it and treat it like it is real."
4. **Students act on each email, with consequences.** "Just remember to
   pull in what they are suppose to learn from the sims with the
   objectives."
5. **Users forward suspicious email to the help desk, except three.**
   "There are some emails that can't be forward due to the suspicious
   headers and that the IT professional has to go look at to add the safe
   guards. So, we need to have three of those kinds of emails in their as
   well."
6. **The router brand is "92 Series Routers".**
7. **Customer jobs are remote.** "Most things are being done remote until
   it is figured out to be physical, however, you can ask the homeowner to
   check the physical aspects for you."
8. **The microwave job:** a cutscene walk to the access point, then the
   2D floor plan, where the microwave is dragged across the room and the
   Wi-Fi coverage changes.
9. **Wireless Reliability stays in Core 2.** "We need to build their base
   here and now. It is part of the actual exam and I am building this as a
   double training platform for them."
10. **The chats: six replies shown, from a pool of nine.** SETTLED.
    The owner asked "how about 6 to 9?". Showing nine would break rung 3
    (seven strikes, each with a reason). So each chat step has nine
    written replies, one right and eight near misses, and six are shown;
    a retry or replay draws a different mix.
11. **Extra training for the topics no sim covers: yes, to all.** "It is
    very important to me to build an all inclusive tool that will help
    them prep for the exam and cover everything in Core 2 that they will
    do in real life." These must be clearly separate from the sim tickets.
    **How they are told apart: two queue sections.** SETTLED.
    - Help Desk's queue gets two headed sections: "Exam sims: from your
      Core 2 practice sims", and "Extra training: real-world tickets
      beyond the sims".
    - Each ticket carries a worded badge with an icon, never colour alone.
    - Each extra-training ticket names the objective it covers, for
      example "Extra training · Backup and recovery".
    - A preview is shown to the owner before it is built.

### The mail build as built (1 October 2026, live)

- **New files:** `mail.js` (the model), `mailui.js` (Mail and Mail admin),
  `tickets-mail.js` (24 emails, six tickets).
- **Mail on the laptop** holds the help desk mailbox. Staff's forwards
  arrive there.
- **Mail on each user's PC** holds their own inbox. That's where the three
  emails that can't be forwarded are read, with their headers.
- **Links show where they really go** in a line at the bottom of Mail,
  when you point at them or tab to them. Opening one counts as a wrong
  move.
- **Mail admin** has:
  - a block list
  - search and purge, which can be undone
  - three policies: quarantine SPF/DMARC failures, tag external mail,
    flag lookalike domains
  - password reset and sign-out everywhere
- **The tickets:**
  - E1 is the crawl and E2 the walk; E3–E6 run.
  - E4, E5 and E6 each carry one email that can't be forwarded:
    - E4: the gift cards. Its safeguard is the external tag.
    - E5: the "mailbox full" email. Its safeguard is SPF/DMARC
      quarantine.
    - E6: the bank switch. Its safeguard is the lookalike-domain flag.
- **What "dealt with" means:**

  | Email | Done when |
  |---|---|
  | Legitimate | The user is told it's genuine |
  | Spam | It's reported as junk, or its sender is blocked |
  | Phishing | It's reported as phishing and purged, and the user's password is reset if they were told it was safe |
  | Malicious | As phishing, plus its domain blocked |
  | Can't be forwarded | Its headers are read on the user's PC, plus its policy (and a block) |

- **Checks:**
  - logic: 24 tickets, 29 plants
  - page: 14 groups, including MAIL (E1 by Mason's rings, E4 through the
    UI)
  - contrast: the mail screens in dark, light and dyslexia
- **Found and fixed:**
  - The right giveaway was the longest option in 23 of 24 emails.
  - The reading pane didn't scroll, so in dyslexia mode a link could be
    unreachable.
  - Mail's link line changed height as addresses wrapped, so links
    flickered under the pointer.
  - A user's own Mail took on the laptop's dark theme.
  - The contrast sweep measured input boxes hidden behind other windows.

## 12. Exam views — SETTLED 1 October 2026

**The owner:** "Now you did match some of the sims in the 2d modeling,
correct? I just do not want another ticketing training. They need to see
things like the way the sims are laid as well." And then: "I want to make
this as dynamic as possible because everyone learns differently."

**The honest answer, given that day:** the builds matched the sims'
content (clues, emails, keys) but not their layouts. Only the 3D office
came from a sim's 2D picture, the Wi-Fi sim's office map.

**Settled:**
- **A new laptop program, "Exam Practice".** It has one exam view per sim,
  laid out like the sim and its exam question, using the sim's own
  pictures:
  - Port Forwarding's network diagram
  - the Wi-Fi office map
  - the three houses
- **It is separate from Help Desk**, so it never feels like more ticket
  training. Each ticket links to its sim's exam view.
- **The program's rules apply in the exam views too:** six options on
  choice questions, red stays red, Mason's ladder, unlimited tries, AAA,
  dyslexia. Config fields (an SSID, a channel) are typed or set as on the
  real screen. A wrong value is kept, marked red with its reason.
- **Every way of learning gets a route.** The student chooses Guided,
  Checklist or On my own in each exam view. The same objective is reached
  by the exam view, by the real job as a ticket, and by the 2D/3D views.
- **Order:** the router build comes first, with its exam views. Then exam
  views are added for App Launch, App Deployment, Malware and Email.
- **Neighboring Routers' Router 2 is shown at 40 MHz, not the sim's 80
  MHz.** 80 MHz doesn't exist on 2.4 GHz channel 6. A teaching note
  explains the widths per band. The key (Router 3: channel 11, 20 MHz) is
  unchanged. The owner: "Build so the students will learn."

### Exam Practice as built (2 October 2026, live)

- **New files:** `pbq.js` (the engine), `exams.js` (the content),
  `examui.js` (the program), and `assets/sims/` (the sims' own pictures,
  copied from Core-2-Sims).
- **Five exam views, the router sims first,** each the sim's own task plus
  five more:
  - Port Forwarding, on the sim's diagram with numbered slots
  - WiFi AP, on the office map: click the WAP
  - Neighboring Routers, on the three houses: Router 1 and Router 2 are
    read-only, Router 3 is configured
  - Tier 1 Router, the scenario beside the conversation
  - Wireless Reliability, the signal log beside the four checkpoints
- **Keys:** the sims' own, checked by `verify/logic.mjs` KEYS, with Port
  Forwarding swapped as ruled. Questions have six options (the sims' four,
  plus near misses). Settings copy the real control.
- **Still to come:**
  - exam views for App Launch, App Deployment, Malware and Email
  - the router tickets (the 92 Series web admin and app; `router.js` is
    started)

### Exam views for the ticket sims (2 October 2026, live)

- **Four more exam views,** each laid out as its sim is, each the sim's own
  task plus five more (`assets/exams-more.js`):
  - **App Launch:** the four tasks beside the error message and the Event
    Viewer entry. Practice 5 is the broken-shortcut case.
  - **App Deployment:** the sim's tabs (BSOD, Commands, Event Viewer,
    System Error) with its three answers below: the event index, the 1st
    command and the 2nd command. Practices 2 to 6 are tickets D2 to D6.
  - **Email Threat:** the inbox, the reading pane and "Classify this
    email". A disguised link's real destination and any Reply-To are shown,
    as the mail program shows them. Built from the mail tickets' emails.
  - **Malware Incident Response:** the seven-device network map, with Task
    Manager (the full process list, as a details table), System Logs and
    Browser History for each. Submit is refused until every device has been
    inspected; Reset keeps the inspections; Guided points at the next
    device not yet inspected.
- **App Deployment keyed as the owner ruled, 2 October 2026 (option A):**
  keep the sim's layout and commands, but the right answer is the real fix
  (install the Visual C++ runtime that matches the program's bitness, then
  test it). The sim's own key, robocopy from System32 then regsvr32, stays
  as near misses, each with the reason it fails. `verify/logic.mjs` runs
  the keyed commands on the matching ticket's own PC and requires them to
  fix it, and requires the sim's old key to copy a file and still fail.
  - Practice 6 (LabelPro, 64-bit): copying the 64-bit runtime into its
    folder would actually start it. Its reason says so honestly (it works,
    but a hand-copied runtime is never patched), and the "old key fails"
    check applies only to 32-bit programs, where it really does fail.
- **Model fix, ticket D4:** a waiting Software Installation policy now
  installs on any restart (`shutdown /r` as well as answering Y to
  gpupdate), as on real Windows. Before, only the Y answer worked, so a
  student who restarted another way was wrongly told it hadn't worked.
- **Still to come:** the router tickets (the 92 Series web admin and app;
  `router.js` is started), the Help Desk chats, and extra training.

## 13. The router build — started 3 October 2026

The owner: "Finish this and then router tickets" (the router model first,
so it is safe on GitHub, then the tickets).

### The 92 Series model (`assets/router.js`, live but not yet used)

- **Plain JSON on TECH-01's record** (`fleet.TECH.routers`), so the
  engine's snapshots and revert cover routers as they cover PCs. No DOM:
  the web admin and the app will both drive it.
- **Three copies of the settings,** as a real router keeps:
  - `form`: typed on the page; lost on a reboot
  - `saved`: what Save wrote
  - `running`: what the router is doing; a reboot (or the customer
    unplugging it) loads it from `saved`
  This is the Tier 1 sim's "save the changes and reboot", made real.
- **Everything a ticket judges is computed from the running settings and
  the house:**
  - the admin password (strong: 12+ characters, mixed case, a digit and a
    symbol, and not the sticker's)
  - the internet side: the modem cable's port, a PPPoE sign-in, a router
    the provider hasn't registered, and a faulty power supply
  - channels: only 1, 6 and 11 clear each other at 20 MHz; our 40 MHz
    takes twice the room; a neighbour is judged on its main channel, as a
    Wi-Fi analyzer lists it and as the Neighboring Routers sim keys it
  - who can join: WPA3-only against a WPA2-only device, the band, the MAC
    allowed list, the saved Wi-Fi password, each with its reason in words
  - what reaches in from the internet: a port forward, or everything for
    the screened-subnet host
- **The customer does the physical checks on the phone** (`ask`): which
  port the cable is in, moving it, the lights, the sticker, the adapter,
  another socket, the provider's welcome letter, unplugging it.
- **Checks:** `verify/logic.mjs` ROUTER, with six plants (49 in all).

### The Tier 1 Router tickets as built (3 October 2026, live)

- **New files:** `tickets-router.js` (R1–R6) and `routerui.js` (the 92 Series
  app). `router.js` is now in use.
- **How the technician reaches routers:** customers share their router with
  Rafiki's IT Services from their own 92 Series app, and it appears in the
  **92 Series** app on the laptop (desktop icon, taskbar pin). The web
  admin at 192.168.1.1, for Rafiki's own access point, comes with the WiFi
  AP tickets.
- **The app has five pages:** Status, Wireless, Internet, Port forwarding,
  Administration. Save and Restart router sit at the bottom. A bar says, in
  words, whether the router is running what's saved, has a saved change
  waiting for a restart, or has changes on the page that aren't saved.
- **The customer is on the phone:** a "Call" panel on the ticket offers
  eight questions (which port, move the cable, the lights, the sticker, the
  adapter, another socket, the provider's letter, unplug it). Asking never
  counts; having them move or unplug something is judged like any change.
- **The tickets** (the Tier 1 Router Support sim, matching its exam view's
  six practices):

  | | Level | Customer | Fault | Outcome |
  |---|---|---|---|---|
  | R1 | Crawl (10 steps) | Brooks & Co. Accounting | sticker admin password | strong password, saved, restarted |
  | R2 | Walk (9 items) | Smile Dental | "admin" on the sticker | the same, card reader still online |
  | R3 | Run | Lee's Bakery | modem cable in a LAN port | the customer moves it |
  | R4 | Run | Daniel Price, home | new Wi-Fi password typed, never saved | save, restart |
  | R5 | Run | Haddad Print Shop | PPPoE refused, no account details | Tier 1 checks, escalate |
  | R6 | Run | Quinn Yoga Studio | faulty power | adapter, socket, escalate |

- **What counts as a wrong move:** a save or restart that doesn't help or
  knocks a device off, a restart that throws away unsaved changes, a
  factory reset, a refused admin password, having the customer move a
  cable that was already right or unplug it for nothing.
- **Every ticket links to its exam view** ("See this sim the way the exam
  shows it"), at the matching practice. All 30 tickets have the link.
- **Checks:**
  - logic: 30 tickets; each router ticket's fault is exhibited, the known
    fix works with no wrong moves, the fix without its last step doesn't
    close it, wrong moves count, six options, no leaks; 53 plants
  - page: ROUTER (R1 by Mason's rings, R3 by phone, R4's lost change and
    proper fix, the exam link)
  - contrast: the app's status, wireless, admin and reset screens, a
    device that can't join, and the call panel
- **Found and fixed while building:**
  - Mason's ring didn't move on as the student typed into a box (only
    page redraws moved it). Typing now moves it.
  - The app's message after Save or Restart was drawn before it was set,
    so "changes that weren't saved were lost" never showed.

### The WiFi Access Point tickets as built (3 October 2026, live)

- **New file:** `tickets-wifi.js` (W1–W6). `routerTicket` in
  `tickets-router.js` is shared, so Wi-Fi tickets are judged exactly as
  the router tickets are.
- **Rafiki's own access point, in the browser at 192.168.1.1.** The laptop
  has a **Browser** (desktop icon, taskbar pin). It opens the access
  point's sign-in page (admin, and the password from the closet binder in
  Mason's message: Clos3t-AP-2026; after a factory reset, the sticker's
  admin). Restarting the access point signs you out, as a real one does.
  Once signed in, the same five pages as the 92 Series app, worded for an
  access point.
- **The model now knows where each device is** (`router.js`):
  - the network name it looks for
  - thick walls: 5 GHz doesn't get through two or more; 2.4 GHz does;
    dual-band steers a far device onto 2.4 GHz
  - a crowded room: 15 or more devices on 2.4 GHz connect but crawl
  The Status page gains a "Where" column and says "Connected but
  crawling" in words.
- **The tickets** (the WiFi AP sim, matching its exam view's six practices;
  the settings are the sim's keys, and `verify/logic.mjs` checks each
  ticket against the exam practice it matches):

  | | Level | Job | Decided by |
  |---|---|---|---|
  | W1 | Crawl (11 steps) | MainOffice1, the sim itself | WPA3 (all devices), 2.4 GHz (thick walls), channel 6 (given) |
  | W2 | Walk (9 items) | Rafiki-Staff for the Office 3 tablet | channel 11 (next door on 1 and 6) |
  | W3 | Run | Conference-5G, 25 laptops in one open room | 5 GHz: capacity, no walls |
  | W4 | Run | the WPA2-only label printer | WPA2/WPA3 transition |
  | W5 | Run | Rafiki-Guest for reception | 2.4 GHz: two thick walls |
  | W6 | Run | after a factory reset | channel 11, read from the Wi-Fi scan |

- **Resolve's refusal names what Mason would see, never the setting that's
  wrong** (the hint ladder's job). Found while building: the first draft
  listed "the band, the channel"; a logic check now forbids it.
- **Checks:**
  - logic: 36 tickets, 58 plants; the model's walls, network name and
    crowding; each Wi-Fi ticket keyed to its exam practice; no leak in the
    refusal
  - page: WIFI (W1 by Mason's rings, including signing back in after the
    restart; W3 with 2.4 GHz crawling and counted, then 5 GHz)
  - contrast: the sign-in page with a refused password, a crowded room

### The Port Forwarding tickets as built (3 October 2026, live)

- **New file:** `tickets-pf.js` (P1–P6), in the 92 Series app, as the owner
  ruled (swapped): the device reached from outside stays on the LAN behind
  one forwarded port; the console goes in the screened subnet.
- **The model knows each wired device's port and address** (`router.js`):
  plugged into a yellow LAN port it has a LAN address; in the orange
  SCREENED SUBNET port it takes the screened subnet's. Wired devices don't
  need the Wi-Fi. Status gains an Address column.
- **The customer does the physical part and tests from outside** (the call
  panel; these questions appear only on Port Forwarding tickets):
  - plug the console into the screened-subnet port (and, the wrong move,
    the computer; then back into a LAN port)
  - try connecting from work (Remote Desktop, SSH or VNC): worked out from
    what really reaches in
  - start an online game and read the NAT type: Open only when the console
    is in the screened subnet and set as its host
- **Done means proven:** the forward to the LAN device, the console in the
  screened subnet as its host, home Wi-Fi security (WPA2, or transition;
  WPA3 in P6 where every device supports it), saved and running, and both
  tests passed since the last restart.
- **The tickets** (the sim's six practices):

  | | Level | Reached from outside | Service | Wi-Fi |
  |---|---|---|---|---|
  | P1 | Crawl (14 steps) | Windows PC | TCP 3389 | WEP to WPA2 |
  | P2 | Walk (9 items) | Windows PC (strict NAT) | TCP 3389 | WEP to WPA2 |
  | P3 | Run | Linux server | TCP 22 | WEP to WPA2 |
  | P4 | Run | Mac | TCP 5900 (VNC) | WEP to WPA2 |
  | P5 | Run | Windows PC, streaming console | TCP 3389 | WEP to WPA2 |
  | P6 | Run | Windows PC | TCP 3389 | WPA3 (all devices) |

- **Wrong moves:** the computer into the screened subnet (it says why: every
  port open to the internet), a forward to the wrong device or port, a
  save that doesn't help, Resolve before the customer has tested.
- **Checks:** logic (42 tickets, 60 plants; each ticket keyed to its exam
  practice: the service's rule, the Wi-Fi security, the device placement;
  the fix minus the customer's last test doesn't close it); page PF (P1 by
  Mason's rings; P3 through the UI with the wrong move, the early Resolve
  and both tests); contrast (the call with both tests failing, the forward
  page with a rule, Status with addresses).


### The Neighboring Routers tickets as built (3 October 2026, live)

- **New file:** `tickets-nr.js` (N1–N6): Router 3 in a street of three
  houses, in the 92 Series app. The neighbours are in the router's Wi-Fi
  scan on Status, at the widths the exam view shows.
- **Status now says whether the running channel overlaps a neighbour,** in
  words ("✕ Overlapping · channel 6 at 40 MHz overlaps Router 1 (channel 1)
  and Router 2 (channel 6)"), as a Wi-Fi analyzer would. It shows what the
  settings do, never what they should be.
- **Done means:** the sim's six settings running (the name and password
  given; WPA3; 20 MHz; MAC filtering as asked; the clear channel), no
  overlap with either neighbour, every approved device connected, and,
  with filtering on, the unknown device shut out.
- **The tickets** (the sim's six practices; checked against them, including
  the neighbours' channels in the scan):

  | | Level | Customer | Neighbours | Channel | MAC filtering |
  |---|---|---|---|---|---|
  | N1 | Crawl (14 steps, with the street) | the Carters, the sim itself | 1, 6 | 11 | on: family's four |
  | N2 | Walk (7 items) | the Garcias | 6, 11 | 1 | on |
  | N3 | Run | the blue house | 1, 11 | 6 | on |
  | N4 | Run | the Carters again: grandchildren visit | 1, 6 | 11 | off: the password is enough |
  | N5 | Run | Rosa, at home | 11, 6 | 1 | on |
  | N6 | Run | Dev, at home | 1, 11 | 6 | on |

- **Checks:** logic (48 tickets, 62 plants; a ticket keyed off its exam
  practice, a ticket already clear of the neighbours); page NR (N1 by
  Mason's rings; N4 through the UI, with the overlap shown and then gone
  and the visitors connected); contrast (the scan with an overlap, MAC
  filtering and the allowed list; 19 plants).
- **Found and fixed: the contrast sweep was sampling a different layout
  from the one it read.**
  - What happened: it took its screenshot with `fullPage`, which resizes
    the window to the page's height. The laptop is sized to the window, so
    every window moved 30px down and the queue re-scrolled between reading
    the text and taking the pixels.
  - How it showed: with 48 tickets, the sweep reported a customer's name
    "at 3.89:1" against a row divider that, on screen, was nowhere near it.
  - The fix: the sweep now screenshots at the window's own size and
    scrolls the page for anything below the fold (the footer). Text it
    can't sample fails as NOT SAMPLED instead of passing.
  - What it means for earlier runs: earlier passes were measured against
    shifted pixels. Most text sits on large single-colour panels, so they
    were very likely right. Every screen has now been re-measured
    properly.
  - Two new plants: the overlap line, which the sweep now scrolls into
    view (its first "catch" had been that stray row), and the footer below
    the fold.
- **The 3D street** came after the Wireless Reliability build (below).

### The Wireless Reliability tickets as built (3 October 2026, live)

- **New files:** `tickets-wr.js` (WR1–WR6), `officeplan.js` (the office as
  plain geometry, and its Wi-Fi), `floorplan.js` (the 2D floor plan).
  `office3d.js` now draws its walls from `officeplan.js`, so the 3D office
  and the floor plan are one plan.
- **The sim's keys stand** (the owner's 30 September ruling): each ticket's
  band, channel plan and security are its variant's checkpoint answers,
  and `verify/logic.mjs` checks each ticket against its exam practice.
  What the ticket adds is the real job: devices that drop or crawl until
  the settings fit the building.
- **WR1, the sim itself (variant A), in Rafiki's own office:**
  - A break counter with a microwave is in the conference room, against
    the closet wall, about 6 ft from the access point on the other side.
    It's new in the 3D office.
  - **The walk:** "Walk to the break room" is a cutscene from the IT bench
    to the counter (the owner's ruling 8).
  - **The floor plan**, drawn at the counter: the office from above, the
    coverage from the access point's running band, the walls and the
    microwave, every room, device and reading as real text with a legend
    in words. The microwave moves by dragging or the arrow keys (Shift for
    four feet), only while the student is standing there; from the desk
    the floor plan is look-only.
  - **The numbers (large and obvious, as asked):** on 2.4 GHz with the
    microwave beside the access point, 72% of the office drops and 85% is
    less than good; moved across the room, only a 9% patch around it. On
    5 GHz the Office 3 tablet drops through the walls whatever the
    microwave does.
  - **Done:** the microwave at least 15 ft from the access point, 2.4 GHz,
    a fixed channel clear of the neighbours (11), modern security, every
    device connected and none crawling. The cause question asks why moving
    the microwave beat switching to 5 GHz, which keeps the sim's key (2.4
    GHz for the walls) and teaches the microwave.
- **The model learned** (`router.js`): busy airwaves (six or more
  networks on 2.4 GHz), a device too far down a building for 5 GHz, a
  device that needs 5 GHz speed, and the floor plan's signal for devices
  in Rafiki's office. Status says "Connected but crawling", with why.
- **The tickets:**

  | | Level | Site | Symptom | The lab's plan |
  |---|---|---|---|---|
  | WR1 | Crawl (13 steps) | Rafiki's office | drops at lunchtime; 5 GHz tried | move the microwave; 2.4 GHz; fixed channel; WPA3 |
  | WR2 | Walk (7 items) | Bright Path Design | slow all day, ten networks | 5 GHz, fixed channel |
  | WR3 | Run | Long Hall Studios | far end drops, projector needs speed | dual-band, automatic |
  | WR4 | Run | Wu & Partners | fourteen networks | 5 GHz, fixed channel |
  | WR5 | Run | Doyle Logistics | concrete, far scanner | 2.4 GHz, fixed channel, secured |
  | WR6 | Run | Riverside Clinic | far rooms drop, imaging tablet needs speed | dual-band, automatic |

- **Moving the microwave is exploring:** only a move that makes things
  worse counts as a wrong move.
- **Checks:** logic (54 tickets, 64 plants; each ticket keyed to its exam
  practice; WR1's settings alone don't close it without the microwave
  moved); page WR (the floor plan locked from the desk; WR1 by Mason's
  rings, walk and microwave included; WR4 through the UI); contrast (the
  break counter with the floor plan, the floor plan from the desk; 20
  plants).
- **Found and fixed while building:**
  - **Windows covered Mason's panel.**
    - Windows are sized to the desktop when they open. When Mason's panel
      docked later, the desktop narrowed but open windows kept their size.
    - So a Browser left open from a Wi-Fi ticket covered his steps at the
      start of WR1, and its shadow pulled a step number to 6.69:1 in light
      mode (the sweep found it).
    - Open windows now refit whenever the desktop narrows.
    - The desktop is now its own stacking layer, so no window, and no
      window's shadow, can rise above Mason's panel, the taskbar, toasts
      or pop-ups, however often it's focused.
    - A page check (with its plant) opens the Browser first, starts WR1,
      and requires every window to clear the panel.
  - **Mason's "Show me where" scrolled the whole page,** pushing window
    title bars off the top of the screen (`scrollIntoView` with
    `block: "center"` scrolls every container, the page included). It now
    uses `nearest`, which scrolls only what's needed to show the target.
- **The counter and microwave:** the spot is SETTLED (owner, 4 October
  2026: "The spot is fine"). The microwave is now built from the owner's
  photograph of their own (see below).

### The microwave from the owner's photograph (4 October 2026, live)

The owner sent a photograph of their own microwave. On the first attempt
they said: "Come on, you can do so much better with the microwave. You
have built me better renderings before." So it was rebuilt properly:

- **Light:** walk-overs now take their reflections from a neutral indoor
  room (three.js's `RoomEnvironment`, MIT, copied into
  `assets/three/addons/environments/`), not the outdoor sky. The sky had
  tinted steel, tiles and walls blue-lavender.
- **The case:** brushed stainless (a fine-streak texture) on a rounded
  profile run front to back, with the oven's opening cut through it, so
  it really is hollow behind the door. It also has vent slots on the
  side, a black back, rubber feet, and a soft shadow on the worktop.
- **The door:** smoked black glass, opaque round the edge, with the
  window's perforated metal screen. A chrome bar handle sits on two
  standoffs.
- **Inside:** warm enamel lit by its own small lamp, a glass turntable on
  its roller ring, and a lathe-turned glass bowl.
  - The warm glow is amber, like the photo's: the one colour outside the
    royal six, shown to the owner in the preview renders.
- **The panel:** glossy black glass with a glowing red 2:30, the keypad
  (Popcorn, Potato, Pizza, Reheat, Defrost, Power, the digits, Clock,
  Timer), Stop and Start, and a knurled dial with a chrome ring.
- **The counter, from the photo:** wood cabinets with handles, a speckled
  stone worktop, and white tiles behind.
- **Moved off the counter** on the floor plan, it sits on a small trolley
  at desk height.
- **Found while building:**
  - Cutting the opening through the case also lined it with steel walls,
    flush with the enamel, so the steel showed instead of the glow. The
    enamel now sits well inside them.
  - The door's clear coat mirrored the bright room, so the smoked glass
    looked pale grey. Its reflections are turned down.

### The street (4 October 2026, live)

The owner, 30 September: "The three houses from Router_houses.png get a
3D street. It shows each router's reach and channel." On 4 October:
"keep going with the 3D street".

- **New file:** `streetview.js`. `office3d.js` gains a street mode
  (`mountOffice({ street: true })`), drawing the three houses already
  built for the preview, plus each router on a shelf.
- **Which house is which** (as the exam view labels them):
  - Router 1: the orange house
  - Router 2: the tan house
  - Router 3: the blue house at the end. This is the customer's, the one
    the student sets.
  - Two briefs had it wrong: N1 said "between two neighbours" and N2 "in
    the middle of the street". Both now say the blue house at the end.
- **"Street view", a window on the laptop,** opened from the Neighboring
  Routers tickets ("Look at the street in 3D"). Looking is recorded as a
  view, which never counts as a wrong move.
- **What it shows, all from the routers' RUNNING settings:**
  - Each router's reach as a disc in its channel's colour: channel 1
    blue, 6 purple, 11 green, any other channel yellow.
  - Red stripes over the ground where Router 3 overlaps a neighbour.
  - A label over each house: its channel, and for Router 3 its width and
    "✕ Overlaps …" or "✓ No overlap".
  - A 2.4 GHz band chart, as a Wi-Fi analyzer draws it.
  - A list in words.
  - Neighbours are drawn on their main channel, as the model and the
    sim's key judge them.
- **It opens with a fly-in** from high over the street, and a plain cut
  for reduced motion.
- **Without WebGL,** the band chart and the list say the same thing.
- **N1's crawl has two new steps (14 in all):** look at the street before
  the fix (the stripes), and again after the restart (green, no stripes).
- **Checks:**
  - page NR: N4's street shows the overlap, still shows it once settings
    are typed but not saved, and shows clear after save and restart. Two
    plants: the street drawn from the typed settings, and a street that
    never shows an overlap.
  - contrast: the street with an overlap (the labels over the 3D) and the
    band chart and list, with a plant (pale bars).
- **Found while checking: "Walk back" freezes the page for several
  seconds in this container.**
  - Under the software renderer the checks use, about 9 s of native work
    (resizing the 3D canvas) passes before anything moves.
  - It isn't new: the last pushed commit does exactly the same. On the
    previous container it finished inside the sweep's 20 s limit.
  - The contrast sweep now gives those clicks 60 s.
  - On a real graphics card a canvas resize is near-instant. OPEN: worth
    watching on the students' slowest school machines.
- **Two first tries that were dropped,** because they slowed every frame
  on a weak graphics card: warm point lights in every room (cheap whole
  room light instead), and a "transmission" glass turntable (plain
  see-through glass instead).

## 14. The Help Desk chats and extra training — SETTLED 4 October 2026

The objectives were re-read on 4 October 2026; the Core 2 wording is
unchanged (section 2). The owner's answers to the questions asked after
the street went live:

- **The chats are chat plus hands-on.** While chatting, the student also
  checks and fixes the real thing (the phone's mail settings, the mail
  server, the router), not only picks replies.
- **Customer mood: yes.** A wrong reply gets a realistic reaction (the
  customer gets confused or frustrated), shown in words on a mood line.
  Nothing ever locks the student out.
- **Keep the sims' joke replies, and add realistic mistakes.** Each step
  has a pool of nine (one right, eight wrong): the sims' own wrong
  replies, jokes included ("Blow on the SIM card"), plus near misses a
  technician really makes. Six are shown (section 11, ruling 10).
- **Extra training's first preview: yes.** The Help Desk queue in its two
  headed sections, plus one sample extra-training ticket built end to end
  (backup and recovery suggested).
- **Mobile troubleshooting needs a phone:** the owner asked to see the
  phone model first ("Show me this phone you have").
- **Weekly usage:** "Do NOT worry about the 90%. I will keep a watch on
  it."
- **The phone: SETTLED.** The owner, on seeing the preview renders
  ("Use the phone that you showed me"): the generic smartphone built in
  `assets/phone3d.js` (aluminium frame, frosted navy back, two-lens camera,
  power and volume keys, SIM tray with a nano-SIM, USB-C, speaker grille).
  It is the customer's phone in the Mobile devices program: the 3D model
  shows the settings screen, and the same settings are beside it as real
  text (readable, zoomable, measured for contrast).

### The Help Desk chats as built (4 October 2026)

- **New files:**
  - `chat.js`: the conversation model
  - `tickets-chat.js`: CE1–CE6 and CR1–CR6
  - `chatui.js`: the Customer chat and Mobile devices programs
  - `mobile.js`: company phones and the mail server
  - `phone3d.js` and `phoneview.js`: the approved phone, in a window
- **Customer chat** (a program on the laptop, opened from the ticket):
  - The conversation, with the customer's mood in words and a four-step
    meter: Calm, Impatient, Frustrated, Upset.
  - Six replies shown on each step, from its pool of nine: one right,
    and eight wrong ones made up of the sim's own (jokes included) and
    the realistic mistakes.
  - A wrong reply stays in the conversation with the customer's reaction
    under it, and stays red in the choices, marked three ways.
  - A wrong instruction is tried by the customer, fails, and is put back,
    so it never poisons the steps after it.
  - **Start the chat again** gives a new six on every step, puts the
    customer's phone or router back, and keeps the hint count.
- **Hands-on, in the middle of the chat.** The customer waits while the
  student checks the real thing, and the step ticks off when it's done:
  - **Email chats:** compare the phone with the mail server in Mobile
    devices; after the customer's change, press Sync now and read the
    result.
  - **Router chats:** read the customer's router in the 92 Series app
    (it's shared): before advising, and after their change and restart.
- **Mobile devices** (a program on the laptop):
  - The customer's phone in 3D (the approved model), its screen showing
    its mail settings.
  - The same settings as real text, with Sync now and its result in
    words.
  - The company mail server's published settings, and a "ports you'll
    meet" table.
- **The phone and mail model** (`mobile.js`): mail works only when the
  phone matches the server.
  - Receiving: IMAP on 993 or POP3 on 995, SSL/TLS.
  - Sending: SMTP on 587, STARTTLS, with sign-in. Carriers block port 25.
  - The right server name and the current password.
  - Each failure gives the error a real phone would.
- **The router model** gained a newer firmware version to install (CR4).
  The 92 Series app's Check for updates installs it and restarts.
- **The tickets:**

  | | Level | Customer | Fault |
  |---|---|---|---|
  | CE1 | Crawl (11 steps) | Brenda, the sim word for word | IMAP SSL on port 100 → 993 |
  | CE2 | Walk (8 items) | John | can't send: port 25, no security, no sign-in → 587, STARTTLS, sign-in |
  | CE3 | Run | Farah | POP3 removes mail from the server → IMAP on 993 |
  | CE4 | Run | Rosa | server name typo, incoming and outgoing |
  | CE5 | Run | Dev | password changed, phone still has the old one |
  | CE6 | Run | Brenda | a friend set security to None on 143 → SSL/TLS on 993 |
  | CR1 | Crawl (11 steps) | Priya Shah, the sim word for word | default admin password, save, reboot |
  | CR2 | Walk (8 items) | Tom Rivera | Wi-Fi on the sticker's name and password → new name, passphrase, WPA3 |
  | CR3 | Run | Ana Lopez | new Wi-Fi password typed, never saved, lost in a power cut |
  | CR4 | Run | Grace Kim | firmware update, done safely |
  | CR5 | Run | Mia Torres | WPA3-only locks out an old laptop → WPA2/WPA3 transition |
  | CR6 | Run | Ben Carter | evening drop-outs: channel 6 at 40 MHz → 11 at 20 MHz |

- **The five-more chats end with a professional close** (its own nine).
  The sims end on the customer's thanks, so CE1 and CR1 do too.
- **Checks:**
  - logic: 66 tickets, 71 plants. Seven chat plants: a pool short a
    reply, the sim's joke dropped, the fault missing, a wrong reply moving
    the chat on, a hint giving the reply away, a restart that keeps the
    customer's changes, a restart that shows the same six.
  - page CHAT: CE1 by Mason's rings; CE3's restart drawing a new six; CR3
    through the screen with one wrong reply (reaction, mood and red
    checked), the Wireless check, the router really running the new
    password, closed with exactly one wrong move counted. Three plants.
  - contrast: the chat with wrong replies, Mason's rung 3 in the replies,
    the hands-on wait, Mobile devices (phone, failed sync, mail server).
    Two plants.
- **Still to come:** exam views for the two chat sims (laid out as the sims
  are).

### Extra training, X1: backup and recovery (5 October 2026, live)

The owner saw the preview (private artifact, 4 October) and said: "Yes to
all, push it and build X2–X6." That settles the queue's two sections, the
badge wording, and X1 as the pattern for extra training.

- **The queue, as ruled (section 11, ruling 11):**
  - Two headed sections: "Exam sims: from your Core 2 practice sims" and
    "Extra training: real-world tickets beyond the sims". Two buttons at
    the top jump to either.
  - Every ticket has a badge with an icon and words: "Exam sim · <sim>"
    (a clipboard, blue tint) or "Extra training · <objective>" (a wrench,
    purple tint, dashed edge). The tint is never the only signal.
  - The ticket page names the objective in the doc's words, and says
    "Not from a sim: a real-world job".
- **New files:** `backup.js` (the model) and `tickets-extra.js` (the
  tickets, `EXTRA`). A ticket with `extra: true` carries `topic`, `domain`
  and `objective`; `verify/logic.mjs` EXTRA holds the objective to the
  doc's words.
- **The model** (`backup.js`), three things students mix up:
  - **Previous Versions:** one file, back from the snapshots System
    Protection takes (restore points hold the whole drive, documents
    included) or from File History. Only copies that differ are listed.
  - **System Restore:** rolls Windows back. It never touches personal
    files.
  - **File History:** a real backup, on another device, on a schedule.
    Network location typed (`\\FS01\Backups`; `\\FS01\Software` is
    refused as read-only, a folder on C: as the drive being backed up),
    how often (Windows' own list), how long, Turn on (makes the first
    copy), Run now, and Restore personal files (what the backup really
    holds).
- **Windows gained:** File Explorer's Open and Properties on a file; the
  Properties window with General and Previous Versions (Open a copy to
  read it, Restore with confirmation); Control Panel › File History; and
  System Restore in System Properties (choose a point, UAC, restart).
- **X1, a crawl (17 steps):** Farah saved last year's Q3 budget over this
  year's at 09:12, then retyped some at 10:00. Her clues: she worked on it
  "right up to lunch yesterday", and can lose "an hour, not a day";
  Mason's note gives `\\FS01\Backups`. Four copies in Previous Versions,
  the newest from this morning (wrong). Restore 3 October 11:58; File
  History to FS01, every hour, on; test it in Restore personal files.
  Close: "Couldn't we just rely on restore points?" (six).
- **Wrong moves:** restoring this morning's or an older copy, System
  Restore, a refused location, a schedule longer than an hour, shorter
  retention, File History off, System Protection off (deletes the restore
  points). Looking, and a mistyped location, never count.
- **Checks:**
  - logic: 67 tickets, 78 plants. EXTRA: the objective in the doc's words;
    the fault exhibited (wrong file, the right copy findable but not the
    newest, File History off and daily); the right path closes with no
    wrong moves; it doesn't close untested; each near miss counts;
    System Restore leaves the document alone; six moves, rung 3 and no
    leak at every stage; the close question not longest; the note.
    Seven plants.
  - page: LOAD (67 in the queue, 12 crawls); EXTRA (the two headings as
    ruled, 66 badged Exam sim then X1 badged with its objective, icons,
    the jump, X1 by Mason's rings with no wrong moves). Four plants.
  - contrast: the extra-training section, X1's file, Previous Versions
    and its confirmation, System Restore, File History (refused, advanced,
    on, Restore personal files). Three plants.
- **Found while building:**
  - The right close answer was the longest option; reworded (the new
    check caught it).
  - The contrast sweep measured queue text half-hidden under the queue's
    sticky header, against the header's rule. The cover test now checks
    each line's top and bottom edges too. Every contrast plant (26) was
    rerun after the change, and all were caught.
  - Running contrast plants three at a time killed the browsers in this
    container. Run them one at a time (about 15 minutes each).
- **Next:** X2–X6 (built the same day, below).

### Extra training, X2–X6: backup and recovery, five more (5 October 2026, live)

The owner: "Yes to all, push it and build X2–X6." Each one turns on a
different real decision:

| | Level | Who | The job | What it teaches |
|---|---|---|---|---|
| X2 | Walk (8 items) | Dev, WS3 | 1 October's deploy.yml beside today's | Restore to another folder, not over the original |
| X3 | Run, escalate | John, WS1 | a file deleted 24 August; File History keeps 1 month | retention: look at the oldest backup, set a year (HR policy), escalate to Tier 2 for FS01's nightly backup |
| X4 | Run | Rosa, WS5 | "Reconnect your drive": the USB stick left with a temp | move the backup to \\FS01\Backups, Run now, test |
| X5 | Run | Brenda, WS2 | ScanEasy crashes since a driver update | System Restore IS the tool: the point made just before the driver; older points also remove a security update, a later one keeps the driver; documents untouched |
| X6 | Run | Farah, WS4 | the auditors: 15 minutes, two years and no longer | how often against how long; Forever is the near miss |

- **The model gained** (`backup.js`): browsing every backup (older and
  newer), Restore to original location (Windows asks before replacing)
  and Restore to… another folder, from File History and from Previous
  Versions; a backup drive that's missing ("Reconnect your drive"; runs
  fail until a new location is chosen); a backup history that exists
  before the ticket; retention compared by Windows' own list; System
  Restore rolling back a driver installed after the point, and any other
  system change since (a security update), named in its message.
- **machine.js gained** a program whose driver is broken (`driverBad`): it
  crashes naming the driver's module; Repair doesn't help, because the
  program's own files are fine.
- **Every ticket now has `stage(fleet)`**, and Mason's advice before and
  during the job comes from the ticket (`adviceStart`, `adviceWork`).
- **Found while building:** a backup view's index was stored on the event
  as `at`, which is the event's own order: it would have broken every
  "looked after the last copy" check, X1's included. Renamed `idx`.
- **Checks:**
  - logic: 72 tickets, 84 plants. X2–X6 table-driven: the fault exhibited,
    the right path closes with the right outcome and no wrong moves, not
    without its last step, each near miss costs one, looking costs nothing,
    six moves and rung 3 and no leak at every stage, the close question,
    the note. Six new plants.
  - page: LOAD (72; 12 crawl, 12 walk, 48 run); EXTRA (six badged with the
    objective); BACKUP (X2 through the screens, with a restore over the
    original counted, explained and reverted, then Restore to the Desktop
    and the checklist ticking; X5 through System Restore, the restart, a
    reconnect and ScanEasy working). Two new plants.
  - contrast: the backup browser, Restore to, Replace, the reconnect
    warning, ScanEasy's crash. Two new plants.
- **Next:** the owner chose mobile (below).

### Extra training, MB1–MB6: Mobile troubleshooting (5 October 2026, live)

The owner: "Mobile next, build it out". The objectives were re-read on
5 October 2026; the Core 2 wording is unchanged. This build covers
**Software troubleshooting, Mobile troubleshooting: "addressing
connectivity, app, and performance issues"**. (Phone hardware and
accessories are Core 1, and kept out.)

- **Remote help on company phones, in Mobile devices.** The owner accepts
  the request; the technician sees and uses the phone's own screen, as
  real HTML beside the approved 3D phone (`phone3d.js`), whose glass shows
  the same page. Pages: the lock screen (notifications and apps), Network
  & internet, Battery, Storage, Apps and each app's info, Security &
  privacy, System. A help desk tool sends a test email to the phone.
- **New files:** `phone.js` (the phone's operating system, plain JSON on
  the phone record as `dev`: the record's `os` was already a string),
  `phoneui.js` (the screens), `tickets-mobile.js` (MB1–MB6).
- **The model** works everything out from the settings: each app's battery
  drain from its background battery setting and location permission (hours
  left, warmth); the internet from airplane mode, Wi-Fi, mobile data and
  Private DNS; open, force stop, clear cache (keeps data), clear storage
  (loses anything unsynced), update, uninstall; storage and what's backed
  up; a system update needing its size free; apps from outside the store,
  the per-app unknown-apps switch, Play Protect; whether mail arrives by
  itself.
- **Restart and Force stop are safe first steps:** they never count, even
  when they don't help (the phone says so). A factory reset always counts
  and erases the phone (revert puts it back).
- **The tickets:**

  | | Level | Who | Symptom | Cause, and the fix |
  |---|---|---|---|---|
  | MB1 | Crawl (11 steps) | Rosa | battery dead by lunch, warm | Weather Live: location all the time, Unrestricted. While using, Restricted, then check Battery |
  | MB2 | Walk (7 items) | Brenda | SalesPad closes since its update | clear cache, not storage (3 unsynced orders), then test |
  | MB3 | Run | John | "Connected, no internet" everywhere | Private DNS to a dead server from an article: back to Automatic, then load a page |
  | MB4 | Run | Dev | update fails: not enough space | delete September's videos (in OneDrive); caches alone fall short; never this week's (only copies) |
  | MB5 | Run | Farah | ads, fake "infected!", data warning | sideloaded PDF Scanner Free: uninstall, unknown apps off for Chrome, Play Protect scan |
  | MB6 | Run | Mason | mail only when Outlook opens | Outlook Restricted with background data off: Optimized, data on, test email |

- **Also changed:** the 3D phone's screen is now drawn unlit and outside
  tone mapping, as a display shows its pixels, with a faint glass layer on
  top; its words had washed out to pale grey. The phone itself is
  unchanged.
- **Found while building:**
  - MB1's crawl jumped from step 4 to Resolve: "check the Battery page
    after your change" counted as done the first time the page was opened,
    when no change had been made, and the crawl's catch-up skipped ahead.
    It now needs a change first; a page plant guards it.
  - The right close answer was the longest option in four tickets;
    reworded (the check caught it).
  - **Instructor mode blanked the whole Help Desk** when a not-yet-started
    phone ticket was selected: the instructor's "Fix:" line asked for the
    ticket's moves in the current office, where its phone didn't exist.
    The line now reads the ticket's own starting point whenever it isn't
    the one being worked, which also corrects the fix it showed for other
    unstarted tickets (it was reading another ticket's machines). Found
    by the contrast sweep, which runs in instructor mode; a new page group
    (INSTRUCTOR) opens every ticket with instructor mode on.
  - A page plant (location not changing the battery) was missed: no check
    read the estimate itself. That's the model's job, so logic now checks
    that each of MB1's two changes lengthens it and both reach a day.
- **Checks:**
  - logic: 78 tickets, 93 plants. MB1–MB6 table-driven as X2–X6, plus a
    factory reset counted and erasing the phone, safe first steps costing
    nothing, and MB1's battery model. Nine new plants.
  - page: LOAD (78; 13 crawl, 13 walk, 52 run); EXTRA (MB1–MB6 badged
    "Extra training · Mobile troubleshooting"); MOBILE (MB1 by Mason's
    rings with no wrong moves; MB5 through the screens, the fake cleaner
    tapped and counted, then uninstall, unknown apps off, the scan, and
    Resolve); INSTRUCTOR (every ticket's page draws with the instructor's
    fix). Three new plants.
  - contrast: MB5's lock screen, app info with a confirmation, Security;
    MB3's network page; MB4's storage and refused update; MB6's test
    email; MB1's battery page and app info. Three new plants.
- **Next:** the owner picks the next objective: OS installation; file
  systems, updates and upgrades; or safety.

### Extra training, OI1: OS installation, a clean install (5 October 2026)

The owner: "OS installation next, build it out, push to Git after each
build". The objectives were re-read on 5 October 2026; the Core 2 wording
is unchanged. This covers **Operating systems, OS installation: "working
with Windows, macOS, Linux, and mobile operating systems"**. Four builds,
each pushed when verified:
1. OI1 (crawl): a Windows 11 clean install (this one).
2. OI2 (walk): an in-place upgrade; OI3 (run): hardware that can't run
   Windows 11.
3. OI4, OI5: Linux and macOS.
4. OI6: a mobile OS.

- **The PC's own screen, at the desk.** A ticket can put a PC under the
  install model (`m.inst.managed`). It then starts at its firmware screen
  (POST: F2 Setup, F12 Boot Menu, or let it start from the boot order),
  and the desk monitor shows the firmware, Windows Setup and the first-run
  setup as real HTML. Every other PC boots straight to Windows, as before.
- **New files:** `install.js` (the model, plain JSON on `m.inst`, so
  snapshots and revert cover it), `installui.js` (the screens),
  `tickets-install.js` (OI1). Hooks: `machine.boot` (a managed PC starts
  at POST), `malware.online` (a PC in Setup isn't on the network),
  `desktop.draw` (the install screens), the desk's hands panel (plug in or
  take out the installer USB), and System Properties, which now shows
  **Computer Name** (Change…: rename, join a domain; both wait for a
  restart).
- **The model, from Microsoft's own behaviour:**
  - The firmware: boot mode (UEFI or Legacy/CSM), Secure Boot, the TPM,
    the boot order. Changes only apply when saved.
  - Windows 11's requirements: a supported CPU, 4 GB RAM, 64 GB storage,
    UEFI with Secure Boot, TPM 2.0 on. Setup says "This PC can't run
    Windows 11" when they're not met.
  - On a UEFI PC, Setup refuses an MBR disk in Microsoft's own words.
    Formatting the partition keeps the disk MBR. Deleting it leaves
    unallocated space, and installing there makes the GPT layout itself
    (EFI, MSR, Windows, Recovery).
  - A product key or none: with none, the edition is chosen, and it has to
    be the edition the licence covers.
  - **Windows 11 doesn't join an on-premises domain during setup.** Work
    or school asks for Microsoft Entra ID (Rafiki has none). Sign-in
    options › Domain join instead makes a local account; the PC joins
    RAFIKI from System Properties › Computer Name with an account allowed
    to join PCs (itadmin), and restarts. Then the user signs in with their
    own domain account. Home can't join a domain at all.
- **OI1, the crawl (31 steps):** Dev's PC came back from the vendor with a
  new SSD, blank but for the vendor's MBR test partition, switched off.
  Walk over, plug in the USB, power on, F12, the UEFI USB, language,
  install (tick the box), no product key (a digital licence), Windows 11
  Pro, the licence; Next on the vendor partition is refused (MBR on UEFI);
  delete it, install to the unallocated space, restart, let it start from
  the drive; region, the name WS3-DEV, work or school, Domain join
  instead, a local account, privacy; System Properties, join RAFIKI as
  itadmin, restart, Dev signs in. Close question: why Setup refused the
  vendor's partition.
- **Counted (one each):** another edition (Home, Pro N, Education, Pro for
  Workstations); a key for Home; formatting instead of deleting; saving
  the firmware with Legacy boot, Secure Boot off or the TPM off; choosing
  the USB again after Setup's restart (Setup starts over); a name that
  isn't WS3-DEV; personal use; a personal Microsoft account; renaming it
  something else. **Never counted:** PXE, Repair my PC, an unticked box, a
  mistyped key or password or domain, trying an email in the Entra ID box,
  Back.
- **Snapshots never hold a mistake:** the score stops rising at the step
  where a mistake was made (wrong edition, personal account, firmware
  security off, wrong name) until it's put right. A wrong name can be put
  right as a technician would, by renaming it with the join; a wrong
  edition or a personal account needs a revert.
- **Found while building:**
  - The domain-join dialog copied "WORKGROUP" into the domain name when
    Domain was chosen, so joining went round in a loop between the two
    dialogs. Found by the page check following Mason's rings; fixed.
  - After a wrong password, the join dialog emptied the user name as well
    (Windows keeps it). Found by the contrast sweep's drive; it now keeps
    what was typed.
  - Plants that changed OI1's judging were missed: the engine reads
    `tickets.js`'s own list, not the planted one. The OI1 check now puts
    the ticket under test in that list while it runs.
  - Several rung-2 hints gave the move away (unallocated space, "set up
    for work", "accept it", the domain-join path); rewritten as the
    principle, and a leak list guards them.
- **Checks:** logic (OI1: exhibited, the model's rules, solvable, six,
  ladder, no leak at every stage of the right path, each near miss counts
  one, looking and typos count none, snapshots, a wrong name renamed, the
  close question, the note; 11 plants); page (INSTALL: OI1 by Mason's
  rings, then through the screens: the unticked box and a mistyped key not
  counted, Home counted, Setup's MBR refusal in words; 4 plants); contrast
  (every install screen, the domain-join dialogs; 4 plants).

### Extra training, OI2 and OI3: upgrading in place, and hardware that can't (5 October 2026)

Build 2 of OS installation.
- **New on the PC (install model only):**
  - **PC Health Check**, in Start: Windows 11's requirements, in its own
    words ("TPM 2.0 must be supported and enabled on this PC", "The
    processor isn't currently supported for Windows 11"), ticked or
    struck, marked three ways.
  - **setup.exe from the installer USB**, run inside Windows (it's in
    Start while the USB is in a Windows 10 PC). It checks the
    requirements first and refuses in words. Otherwise: the licence,
    then Choose what to keep (Keep personal files and apps / Keep
    personal files only / Nothing), Ready, Install, Restart now.
  - The upgrade finishes as the PC next starts from its drive. Files
    and apps are kept, or the apps go, or (Nothing) everything goes and
    the first-run setup starts.
- **The requirements, as Microsoft has them:** Secure Boot *capable*
  (UEFI), not switched on; TPM 2.0 present and on. OI1's wording about
  Secure Boot was corrected to match.
- **OI2 (walk, 10 items), Brenda's WS2, the last on Windows 10.** Its
  hardware is supported (Mason says so), but Windows says it can't run
  Windows 11. The steps:
  1. PC Health Check: the TPM fails.
  2. Restart, F2, and switch the TPM on in the firmware.
  3. Health Check passes.
  4. setup.exe from inside Windows, keeping personal files and apps.
  5. The upgrade finishes; Brenda signs in.
  6. PayWise opens.

  **Counted:** keeping files only or nothing; a clean install from the
  USB (Setup's option screen); Secure Boot off or Legacy boot; a
  registry bypass typed at a prompt. **Never counted:** Health Check,
  Setup refusing before the TPM is on, opening the firmware and
  leaving, Back. Close question: why it said this PC couldn't run
  Windows 11.
- **OI3 (run, escalate), Rosa's WS5.** A Core i5-7500 (7th gen), not on
  the supported list; TPM 2.0 and Secure Boot are on. Health Check (or
  Setup's own refusal) shows it. Nothing at Tier 1 fixes a processor,
  so: change nothing, force nothing, escalate.

  **Counted:** a registry bypass, firmware security off, a clean
  install that gets past Setup. **Never counted:** Setup's refusal,
  opening the firmware. The close question is the escalation:
  exactly what stops it.
- **Found while building:**
  - The Start menu stayed open across a restart, so the next press on
    Start closed it.
  - The ticket's walk button named the requester, not the PC's owner:
    OI3, raised by Mason for Rosa's PC, said "Walk to Mason's desk". It
    now names whose desk the PC is on.
  - The page check walked over again while the last walk back was still
    fading; it now waits.
- **Checks:**
  - logic: 81 tickets, 111 plants. OI2 and OI3 are table-driven: fault
    on the PC, the right path free and finished, the wrong outcome
    counted, six moves with rung 3 and no leak at every stage, near
    misses one each, looking none, close question, note. Seven new
    plants.
  - page: LOAD (81; 14 crawl, 14 walk, 53 run); EXTRA (OI1–OI3); INSTALL
    (OI2 through the screens to PayWise with no wrong moves; OI3's
    Health Check names the processor and passes the TPM, and escalation
    is accepted). Two new plants.
  - contrast: Health Check failing the TPM and the processor, Setup's
    refusal, Choose what to keep. One new plant.

### Extra training, OI4: Ubuntu alongside Windows (5 October 2026)

Build 3 of OS installation, part one. The objectives were re-read on
5 October 2026; the Core 2 wording is unchanged. The owner chose, from
the questions asked before building: OI4 is a dual boot on Dev's PC; OI5
is wiping a leaver's Mac for a new starter; the Mac is a 3D model built
like the phone and previewed first; both tickets run.

- **New on the PC (install model only):**
  - **Disk Management** in Start: the volumes, the disk as a strip in
    partition order, and Shrink Volume (Windows' own dialog: total size,
    the space available to shrink, the amount in MB). Windows can only
    shrink past its last unmovable file, so about half the free space.
    New Simple Volume and Delete Volume; Windows won't delete the volume
    it's running from.
  - **The Ubuntu 24.04 LTS USB.** Its own boot menu ("Try or Install
    Ubuntu"), then the installer: welcome, Install or Try, "How do you
    want to install Ubuntu?" (alongside Windows Boot Manager, only offered
    when there's 25 GB or more unallocated; Erase disk with its warning;
    Manual), the account (name, computer name, username, password),
    review, install, restart, "Please remove the installation medium".
    Manual refuses a root (/) that isn't a Linux file system.
  - **GRUB**, Ubuntu's boot loader, first in the boot order once Ubuntu is
    in: Ubuntu, Advanced options, Windows Boot Manager (only while Windows
    is still on the disk), UEFI Firmware Settings.
  - **Ubuntu itself:** the sign-in, and a Terminal with the commands a
    technician checks an install with (`lsb_release -a`, `uname -r`,
    `hostnamectl`, `sudo hostnamectl set-hostname`, `lsblk`, `df -h`,
    `whoami`, `sudo apt update`); `apt` without sudo is refused, as it is.
- **OI4 (run), Dev's WS3.** About 100 GB for Ubuntu, Windows kept exactly
  as it is. The job: shrink C: in Disk Management (as administrator),
  leave it unallocated; the Ubuntu USB; F12; Install Ubuntu alongside
  Windows Boot Manager; the computer name in Mason's note
  (ws3-dev-ubuntu); then see Ubuntu start and sign in, and Windows start
  from GRUB.
  - **Counted:** a shrink that leaves less than Dev asked for; a new NTFS
    volume in the free space (delete it again: no revert needed); Erase
    disk; Manual over the Windows partition; the wrong computer name (put
    right with `sudo hostnamectl set-hostname`); Secure Boot off or
    Legacy boot.
  - **Never counted:** Try Ubuntu, Manual refusing FAT32 for /, Disk
    Management refusing to delete C:, `hostnamectl` without sudo, opening
    the firmware and leaving.
  - Erase disk, once installed, takes Windows: only a revert brings it
    back. The close question: how Dev chooses between the two at
    start-up (GRUB's menu).
- **Also:** the desk's USB hand uses each ticket's own installer; the
  boot menu lists what's in the firmware's boot order (so Ubuntu once
  it's installed); the ticket log's sign-in lines no longer assume Dev.
- **The taskbars now match Windows 11** (the owner, 5 October 2026: "You
  do realize the launch menu is the bottom of the screen and in the
  middle, correct?"). Both had Start at the bottom left, the Windows 10
  way.
  - The laptop: a cluster of icons in the middle of the screen, Start
    first, with the names kept for screen readers and as tooltips. Its
    Start menu was already in the middle.
  - Each PC's taskbar: Start and its windows in the middle, the clock at
    the right, and the Start menu in the middle above it.
  - A PC still on Windows 10 (OI2, OI3) keeps Start and its menu at the
    left, as Windows 10 does.
  - Page checks measure both (LOAD for the laptop; INSTALL for a Windows 10
    PC and a Windows 11 PC), each with a plant.
- **Found while building:** in dyslexia mode, GRUB's rows overlapped: the
  bigger line spacing pushed each row's text onto its neighbour, so two
  rows read white on white and black on black (1:1). Each row now keeps
  its own line height and room, and only the selected row is inverted
  (hover outlines a row instead), as GRUB does. Found by the contrast
  sweep's dyslexia pass; `PASSES=dys` now runs that pass alone.
- **Found while building:** the INSTALL page check failed now and then
  at "Walk back": under the software renderer the walk back freezes the
  page for several seconds (section 13's note), longer than the check's
  8 s. Its walk-back clicks now get 60 s, as the contrast sweep's do.


### Extra training, OI5: a leaver's Mac, wiped for a new starter (5 October 2026)

Build 3 of OS installation, part two. The owner approved the 3D Mac from
its preview ("Use the Mac you showed me, build OI5").

- **The Mac, SETTLED:** `mac3d.js`, a generic 13-inch aluminium notebook
  in the style of a MacBook Air (Apple silicon), built from its published
  dimensions, with no maker's logo or branding:
  - the base: a black keyboard with a Touch ID key, and a glass trackpad
  - ports: MagSafe and two USB-C on the left, the headphone jack on the
    right
  - the lid: the notch, and a screen drawn unlit, as the phone's is
- **New files:**
  - `mac.js`: the model, on TECH-01's record as `fleet.TECH.macs`, so
    snapshots cover it
  - `macui.js`: the Mac's screen as real HTML, and the picture for its 3D
    display
  - `macview.js`: the 3D Mac, turnable, with Front, Left and Right views
  - `tickets-mac.js`: OI5
- **"Your bench: the Mac"**, a window on the laptop opened from the
  ticket. It holds:
  - the 3D Mac
  - the Mac's own screen beside it
  - "With your own hands": a short press or a press and hold of the power
    button, and Shut it down
  - Rafiki's device management: the device, who it's assigned to, and
    "Ask Mason to release Activation Lock"
- **The model, as Apple has it on Apple silicon:**
  - A short press starts macOS. Press and hold shows the startup options,
    and Options leads to Recovery.
  - Recovery asks for "a user you know the password for"; the leaver's
    password is unknown.
  - Recovery's utilities: Restore from Time Machine, Reinstall macOS
    Sequoia, Safari and Disk Utility.
  - Disk Utility erases the volume group as APFS, APFS (Case-sensitive),
    Mac OS Extended (Journaled), ExFAT or MS-DOS (FAT).
  - After an erase the Mac must be activated online. Activation Lock (Find
    My, the leaver's Apple Account) stops it there until the company's
    device management releases it.
  - Reinstall macOS refuses a disk that isn't APFS. Reinstalling without
    erasing keeps the old account and files.
- **OI5 (run):** Sam Reed has left; the MacBook goes to Priya Nair. Hold
  the power button, Options, Recovery as rafikiadmin, Disk Utility: erase
  as APFS. Activation Lock appears; Mason releases it from device
  management. Then Reinstall macOS, and leave it at Setup Assistant's
  Hello.
  - **Counted:** erasing as anything but APFS (erase again as APFS: no
    revert needed); Restore from Time Machine (Sam's own backup);
    reinstalling without erasing.
  - **Never counted:** a short press, a password guessed at the login
    window or in Recovery, an Apple Account guessed at Activation Lock,
    Safari.
  - The close question: why the Mac asked for Sam's Apple Account after
    the erase.
- **Found while building:**
  - The taskbar named every window it didn't recognise after a PC, so
    opening the bench window crashed the taskbar (a page error, found by
    the page check). It now has its own name.
  - The right close answer was the longest option (the check caught it);
    reworded.
- **Checks:**
  - logic: 83 tickets, 122 plants. OI5 is table-driven, plus: Activation
    Lock really stops activation, the installer refuses ExFAT, and a
    reinstall without an erase keeps the data and doesn't close. Five new
    plants.
  - page: INSTALL drives OI5 through the bench window. A Mac OS Extended
    erase is counted, Activation Lock is shown in words, it's released and
    the Mac activated, the erase is redone as APFS, the reinstall runs,
    Hello shows, and Resolve is accepted. One new plant.
  - contrast: the Mac switched off, the startup options, Recovery
    refusing a password, the utilities, the erase sheet, Activation Lock,
    the reinstall and Hello. One new plant.