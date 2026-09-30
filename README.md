# A+ Core2 Under the Hood Labs

Hands-on labs for CompTIA A+ Core 2 (220-1202), part of the Cyber Warrior
Program. Students sit down at a customer's PC, which is a 3D desk with a
simulated Windows 11 screen, and do the job with the tools Windows gives
them. They type real commands and get Windows' own answers, and they live
with the consequences of what they do.

Live: https://rafikiscyent888.github.io/A-Core-2-Under-the-Hood-/

## The first lab: Windows Tools Console

There are six customer jobs, each with four core stages:

1. **Read the ticket:** find what the customer actually said.
2. **It crawls:** find the cause in Task Manager, decide what to do, and do
   it. The busiest process is not always the one to end.
3. **Repair Windows' own files:** at the Command Prompt, with sfc, DISM and
   chkdsk, in the right order and with an administrator's token.
4. **Fit the new drive:** power down safely, fit and cable it on the 3D
   desk, then set it up in Disk Management. It is always too big for MBR.

The program's rules apply throughout:
- unlimited tries, with hints from the third wrong move
- a hint never gives the answer
- six options: one right, five near misses
- a wrong pick stays red, marked three ways
- reset takes the PC back to the last point the student got right
- WCAG AAA contrast
- a dyslexia-friendly setting that stays on

Instructor mode (PIN 3693) shows the answers and the job sheet.

## Running the checks

The site itself needs nothing. The checks need Playwright:

```
node verify/logic.mjs
node verify/page.mjs
node verify/contrast.mjs
```

Add `--plant` to any of them to prove it catches the defect it exists to
catch.

For educational purposes only. Not affiliated with, endorsed by, or
sponsored by CompTIA®. All trademarks belong to their respective owners.
