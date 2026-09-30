# A+ Core2 Under the Hood labs

Hands-on labs for CompTIA A+ Core 2 (220-1202), part of the Cyber Warrior
Program, built from the Core 2 sims only.

The student is a Tier 1 technician at **Rafiki's IT Services**. Tickets
arrive in the Help Desk on their own workstation, TECH-01. The office's PCs
are running. The student sits at one, from the 3D office or the machine
list, and uses Windows' own tools: the program itself, Event Viewer, Command
Prompt and PowerShell, Task Manager, Settings, Software Center and File
Explorer. Their job is to fix what is really wrong.

It is as close to a virtual machine as a web page can get. Each PC is
simulated, and it behaves like a running one:
- its state persists
- its faults are really there
- every tool reads the machine
- what the student does has real consequences
- **Revert to snapshot** takes it back to the last point the student got
  right

Live: https://rafikiscyent888.github.io/A-Core-2-Under-the-Hood-/

## What is built: the application tickets

| Sim | Tickets | Tier |
|---|---|---|
| Application Launch Troubleshooting | L1 (the sim itself) + L2–L6 | Tier 1: repair or reinstall the program; escalate when that is not enough |
| Application Deployment Troubleshooting | D1 (the sim itself) + D2–D6 | Tier 2: runtimes, bitness, PATH, Group Policy |

D1 is rebuilt so the sim's old answer is tried and fails:
- the robocopy from System32 gives 0xc000007b
- `regsvr32` gives its real error

A ticket closes only when the machine really is fixed. The student then
picks the cause from six options and writes the ticket note.

The program's rules apply throughout:
- unlimited tries, with hints from the third wrong move
- no hint ever gives the answer
- six options: one right, five near misses
- a wrong pick stays red, marked three ways
- WCAG AAA contrast
- a dyslexia-friendly setting that stays on

Instructor mode (PIN 3693) shows each ticket's fix and cause.

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
