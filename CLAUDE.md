# A+ Core2 Under the Hood labs — build document

**Official name, settled 30 September 2026: "A+ Core2 Under the Hood labs"**,
matching Core 1's "A+ Core1 Under the Hood labs". Use it verbatim in the
page title, the heading and anywhere the site is linked from.

Read with `/root/.claude/CLAUDE.md`, which sets the rules and wins over this
file. The coaching role is in `/root/.claude/exam-prep-coach.md`.

**DIRECTION CHANGED on 30 September 2026. Section 8 overrides everything
above it; read it first.** Sections 1 and 4–6 record the first design,
which mixed Core 1 into Core 2 and was replaced. Section 7 is what is built
now: VM build 1, the live-office design of section 8.

**Status: VM build 1 is BUILT and verified** (30 September 2026). It covers:
- the office, the machines, the Help Desk and the 3D office
- the two App sims as twelve tickets (six each)

The mail client, malware, router and chat builds are not built yet.
Last updated 30 September 2026.

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

## 7. What is built — VM build 1, 30 September 2026

The first build (six jobs on a 3D desk, with Core 1's plumbing) was taken
down and replaced by this one. Every file copied from Core 1 was removed:
the renderer, the hints, options, rng, reading, theme and instructor
modules, and the desk model.

### Runtime (what GitHub Pages serves)

`index.html` and `assets/`. Static HTML, CSS and vanilla ES modules. There
is no build step, and nothing is fetched at runtime.

| File | What it is |
|---|---|
| `machine.js` | One simulated PC as plain JSON. It holds processes, files, runtimes, PATH, logs, apps, power and Group Policy. **The DLL loader:** the app folder, then SysWOW64 (32-bit) or System32 (64-bit), then PATH; wrong bitness gives 0xc000007b; missing gives Windows' popup and Event 1000. Also repair and reinstall, runtime install, boot. No DOM, so the checks run it under Node |
| `cmd.js` | The typed Command Prompt and PowerShell. It reaches other PCs by `\\HOST\C$\...`, and FS01's share by `\\FS01\Software`. It covers `copy`, `robocopy`, `regsvr32` (its real error), `setx` (`/m` needs elevation), `echo %PATH%`, `gpupdate /force` with its restart prompt, `gpresult /r`, running installers, and Windows' own wording for every refusal |
| `mech.js` | The "What just happened" line under each command |
| `fleet.js` | The eight machines, the office's five programs and Software Center's catalogue |
| `tickets.js` | The twelve tickets: setup, goal, judge, hints, rung-3 moves, close question and note check |
| `engine.js` | The session. Snapshots, guesses, the hint ladder (`rungFor`) and the rung-3 survivor rule. Saved to `localStorage` (`c2vm.session.v1`) after every action |
| `desktop.js` | One PC's Windows 11 screen, as real HTML: taskbar, Start (with Run as administrator), Run box, desktop shortcuts, UAC, the tools listed above, the blue screen |
| `app.js` | The page: machine list, clipboard (ticket, hints, revert, instructor answer), the Help Desk UI, the 3D office |
| `order.js` | The order six options are shown in |
| `office3d.js` | The walkable 3D office from the WiFi sim's floor plan, on three.js. Clicking a desk sits you at that PC |
| `prefs.js` | Dyslexia text (persists), light background (persists), instructor PIN 3693 (does not) |
| `three/`, `daylight-hdri.txt` | three.js 0.160 (MIT) and a CC0 Poly Haven HDRI |

**The machines** (the Malware sim's seven, plus yours):

| Host | Who | Where |
|---|---|---|
| TECH-01 | you | your workstation |
| WS1-HR | John Doe | Office 1 |
| WS4-FIN | Farah Nkemelu | Office 1 |
| WS2-SALES | Brenda Smith | Office 2 |
| WS3-DEV | Dev Patel | Office 3 |
| WS5-RECEPT | Rosa Ortiz | Reception |
| FS01 | file server | network closet |
| MAIL01 | mail server | network closet |

Everyone signs in as a standard user, you included. The admin credentials
for UAC are RAFIKI\itadmin / Bench-Tech-2026, and they are on the
clipboard.

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
node verify/page.mjs       # drives the page · 10 plants
node verify/contrast.mjs   # AAA on painted pixels, dark / light / dyslexia · 4 plants
```

`--plant` runs the calibration. Each plant must be caught by the check it
was written for. `ONLY=CLOSE node verify/page.mjs --plant` runs one.

**What the contrast sweep does not measure:**
- text behind a modal's scrim, or under the Start menu or Run box
- text scrolled out of its own box
- the hidden inside of a closed `<details>`

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

### Known, not yet done

- **The other nine sims are not built yet:** mail and Email Threat, Malware
  IR, the router's web admin and app, the router sims with the 3D coverage
  and the movable microwave, and the two chats.
- **The 3D office is a way in, not yet a tool.** The Wi-Fi coverage and
  the street come with the router build.
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
