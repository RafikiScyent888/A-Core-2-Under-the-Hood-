# A+ Core 2 Under the Hood — build document

Read with `/root/.claude/CLAUDE.md`, which sets the rules and wins over this
file. The coaching role is in `/root/.claude/exam-prep-coach.md`.

**Status: DESIGN ONLY. Nothing is built until the owner says so.**
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

- **OPEN — the App Deployment sim's answer key contradicts itself, and part
  of it fails on real Windows.**
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
- **OPEN — DISM.** `DISM /Online /Cleanup-Image /RestoreHealth` is the
  standard repair when `sfc` can't fix what it finds. It is in neither the
  doc nor the owner's 82-command list. Include it, or keep to the list?
- **OPEN — what counts as a guess** at a typed prompt (section 5.5 has the
  recommendation).
- **OPEN — the 3D desk and tower.** RECOMMENDED: reuse the Core 1 tower model
  (built from the owner's photographs), and add a desk, monitor, drive bay
  and USB stick. Photos of a real technician's desk, or of a tower's drive
  bay with the side panel off, would make it better.
- **OPEN — the site's name.** RECOMMENDED: "A+ Core2 Under the Hood labs", to
  match Core 1's official "A+ Core1 Under the Hood labs".
- **OPEN, from the first round:**
  - how deep macOS and Linux go
  - whether Wireless Reliability is folded into Lock It Down
  - whether Core-2-Sims gets its contrast and footer fixed
  - photos for the later labs
