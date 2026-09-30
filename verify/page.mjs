/* =====================================================================
   verify/page.mjs — drives the real page in Chromium, the way a student
   would: clicks, typing at the prompt, the UAC box, the Help Desk.

     node verify/page.mjs           the checks
     node verify/page.mjs --plant   every planted defect must be CAUGHT

   Written and reachable are different claims: the logic checks prove the
   tickets exist and solve; only driving the page proves a student can.

     LOAD      no page errors; eight machines; the queue shows twelve
     L1        the sim itself, through the UI: the error names the file,
               Event Viewer holds the entry, three wrong moves bring rung 1,
               the Tier 1 repair fixes it, Resolve opens the close form
     RED       a wrong pick is marked three ways (colour, inset rule,
               words) and stays marked after the screen redraws
     CLOSE     a thin note is refused with the reason; a real one closes
     D1        the sim's old answer gives 0xc000007b; the x86 runtime from
               FS01, in an elevated prompt, fixes it
     REVERT    Revert to snapshot puts the machine back and keeps hints
     PERSIST   a reload keeps the ticket, the guess count and the machine;
               the dyslexia setting stays on across a reload
     OFFICE    the 3D office draws, and clicking a desk sits you at it
   ===================================================================== */
import { serve, browser } from "./serve.mjs";
import path from "node:path"; import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function run(rewrites) {
  const fails = []; const F = (s) => fails.push(s);
  const s = serve(ROOT, rewrites); const b = await browser();
  const p = await b.newPage({ viewport: { width: 1400, height: 1100 } });
  p.setDefaultTimeout(5000);
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("dialog", (d) => d.accept());
  const scr = () => p.locator(".screen-host:not([hidden])");
  const clip = async () => (await p.locator("#clipboard").innerText()).replace(/\s+/g, " ");
  const machine = (host) => p.locator("#machines .mc", { hasText: host }).click();
  const startApp = async (label) => { await scr().getByRole("button", { name: "Start menu" }).click(); await scr().getByRole("button", { name: label }).click(); };
  const typed = async (line) => { const c = scr().locator(".con-in"); await c.fill(line); await c.press("Enter"); await p.waitForTimeout(80); };
  const okDialog = async () => { if (await scr().locator(".w-dialog").count()) await scr().locator(".w-dialog").getByRole("button", { name: "OK" }).click(); };
  const guesses = () => p.evaluate(() => window.__C2.engine.T() ? window.__C2.engine.T().guesses : -1);
  const step = async (name, fn) => { try { await fn(); } catch (e) { F(name + ": the page could not be driven — " + String(e.message).split("\n")[0]); } };

  try {
    await p.goto(s.url + "/index.html"); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800);

    await step("LOAD", async () => {
      if ((await p.locator("#machines .mc").count()) !== 8) F("LOAD: the machine list does not show eight machines");
      const rows = await scr().locator(".hd-q tbody tr").count(); if (rows !== 12) F("LOAD: the Help Desk queue shows " + rows + " tickets, not 12");
    });

    /* ---------------------------------------------------------- L1 */
    await step("L1", async () => {
      await scr().getByRole("button", { name: "Open ticket L1" }).click();
      if (!(await scr().locator(".hd-cur").count())) F("L1: the Help Desk closed when the ticket was opened");
      await machine("WS4-FIN");
      await scr().getByRole("button", { name: /Open the Testing shortcut/ }).click();
      const err = await scr().locator(".w-dialog").innerText();
      if (!/MSVCP100\.dll is missing/i.test(err)) F("L1: Testing's error does not name MSVCP100.dll: " + err.slice(0, 80));
      await okDialog();
      await startApp("Open Event Viewer");
      await scr().locator(".ev-row.lvl-err").first().click();
      if (!/Faulting module name: MSVCP100\.dll/i.test(await scr().locator(".ev-detail").innerText())) F("L1: Event Viewer has no Application Error naming MSVCP100.dll");
      if ((await guesses()) !== 0) F("L1: looking (the program, Event Viewer) counted as a guess");
      await startApp("Open Command Prompt");
      for (const c of ["dir", 'copy \\\\WS1-HR\\C$\\Windows\\SysWOW64\\msvcp100.dll "C:\\Program Files (x86)\\Testing"', "regsvr32 msvcp100.dll", "setx PATH C:\\Temp"]) await typed(c);
      if ((await guesses()) !== 3) F("L1: three wrong moves gave " + (await guesses()) + " guesses");
      const c1 = await clip();
      if (!/Hint 1 of 3: where to look/.test(c1)) F("L1: rung 1 did not appear on the third guess");
      if (/Hint 2 of 3/.test(c1)) F("L1: rung 2 appeared too early");
      await startApp("Open Software Center");
      await scr().getByRole("button", { name: "Reinstall Testing 4.2" }).click(); await okDialog();
      await scr().getByRole("button", { name: "Show the desktop" }).click();
      await scr().getByRole("button", { name: /Open the Testing shortcut/ }).click();
      if (!/Testing is open and working/.test(await scr().locator(".win").innerText())) F("L1: Testing did not open after the Tier 1 repair");
      await machine("TECH-01");
      await scr().getByRole("button", { name: "Resolve" }).click();
      const n = await scr().locator(".hd-close .opt").count(); if (n !== 6) F("L1: the close form shows " + n + " options, not 6");
    });

    /* ---------------------------------------------------------- RED */
    await step("RED", async () => {
      const wrong = scr().locator(".hd-close .opt", { hasText: "licence" }); await wrong.click();
      const look = async () => wrong.evaluate((e) => { const cs = getComputedStyle(e); return { cls: e.className, text: e.innerText, rule: cs.boxShadow, color: cs.color }; });
      let w = await look();
      if (!/\bout\b/.test(w.cls)) F("RED: a wrong pick is not marked out");
      if (!/Ruled out/.test(w.text)) F("RED: a wrong pick does not say it is ruled out in words");
      if (!/inset/.test(w.rule)) F("RED: a wrong pick has no inset rule");
      if (!/rgb\(127, 29, 29\)/.test(w.color)) F("RED: a wrong pick is not red (" + w.color + ")");
      await machine("WS2-SALES"); await machine("TECH-01");
      w = await look(); if (!/\bout\b/.test(w.cls) || !/Ruled out/.test(w.text)) F("RED: the wrong pick did not stay red after the screen redrew");
    });

    /* -------------------------------------------------------- CLOSE */
    await step("CLOSE", async () => {
      await scr().locator(".hd-close .opt", { hasText: "dependency is missing" }).click();
      await scr().locator("#hd-note").fill("Fixed Testing for Farah today.");
      await scr().getByRole("button", { name: "Close the ticket" }).click();
      const after = await scr().locator(".hd").innerText();
      if (/Ticket L1 is closed/.test(after) || !/Not closed yet/.test(after)) { F("CLOSE: a thin note was accepted"); return; }
      await scr().locator("#hd-note").fill("Testing said MSVCP100.dll was missing. Reinstalled Testing from Software Center and tested that it opens.");
      await scr().getByRole("button", { name: "Close the ticket" }).click();
      if (!/Ticket L1 is closed/.test(await scr().locator(".hd").innerText())) F("CLOSE: a good note did not close the ticket");
      if (!/Closed/.test(await scr().locator(".hd-q tbody tr", { hasText: "L1" }).innerText())) F("CLOSE: the queue does not show L1 closed");
    });

    /* ----------------------------------------------------------- D1 */
    await step("D1", async () => {
      await scr().getByRole("button", { name: "Open ticket D1" }).click();
      await machine("WS1-HR");
      await startApp("Run Command Prompt as administrator");
      await scr().getByLabel("User name").fill("RAFIKI\\itadmin"); await scr().getByLabel("Password").fill("Bench-Tech-2026");
      await scr().locator(".w-dialog").getByRole("button", { name: "Yes" }).click();
      if (!/Administrator/.test(await scr().locator(".win-title").innerText())) F("D1: the elevated prompt is not titled Administrator");
      await typed('robocopy \\\\WS4-FIN\\C$\\Windows\\System32 "C:\\Program Files (x86)\\Testing" msvcp100.dll');
      await typed("Testing");
      const d = await scr().locator(".w-dialog").innerText().catch(() => "");
      if (!/0xc000007b/.test(d)) F("D1: the sim's old answer did not give 0xc000007b");
      await okDialog();
      if ((await guesses()) !== 1) F("D1: the old answer did not count as a guess");
      await scr().locator(".tb-app", { hasText: "Administrator: Command Prompt" }).click();
      await typed('del "C:\\Program Files (x86)\\Testing\\msvcp100.dll"');
      await typed("\\\\FS01\\Software\\vcredist_x86_2010.exe");
      if (!/installed successfully/.test(await scr().locator(".con-out").innerText())) F("D1: the x86 runtime installer did not run");
      await typed("Testing");
      if (!/Testing is open and working/.test(await scr().locator(".win").innerText().catch(() => ""))) F("D1: Testing does not run after the x86 runtime");
      if ((await guesses()) !== 1) F("D1: cleaning up or the real fix counted as a guess");
    });

    /* ------------------------------------------------------- REVERT */
    await step("REVERT", async () => {
      await machine("TECH-01"); await scr().getByRole("button", { name: "Open ticket D5" }).click();
      await machine("WS2-SALES");
      await startApp("Run Command Prompt as administrator");
      await scr().getByLabel("User name").fill("itadmin"); await scr().getByLabel("Password").fill("Bench-Tech-2026");
      await scr().locator(".w-dialog").getByRole("button", { name: "Yes" }).click();
      await typed('del "C:\\Windows\\SysWOW64\\msvcp100.dll"');
      const gone = await p.evaluate(() => !(window.__C2.engine.fleet().WS2.fs["c:\\windows\\syswow64"].files.some((f) => /msvcp100/i.test(f.name))));
      if (!gone) F("REVERT: the harmful delete did not happen, so revert cannot be tested");
      const g = await guesses();
      await p.getByRole("button", { name: "Revert to snapshot" }).click();
      const back = await p.evaluate(() => window.__C2.engine.fleet().WS2.fs["c:\\windows\\syswow64"].files.some((f) => /msvcp100/i.test(f.name)));
      if (!back) F("REVERT: Revert to snapshot did not put msvcp100.dll back");
      if ((await guesses()) !== g) F("REVERT: revert changed the guess count");
      if (!/Reverted to the last snapshot/.test(await clip())) F("REVERT: the clipboard does not say what revert did");
    });

    /* ------------------------------------------------------ PERSIST */
    await step("PERSIST", async () => {
      const g = await guesses();
      await p.locator("#set-dyslexia").check();
      await p.reload(); await p.waitForTimeout(800);
      if (!/Ticket D5/.test(await clip())) F("PERSIST: the open ticket was lost on reload");
      if ((await guesses()) !== g) F("PERSIST: the guess count was lost on reload");
      if ((await p.getAttribute("html", "data-reading")) !== "dyslexia") F("PERSIST: dyslexia-friendly text did not stay on after a reload");
      if (!(await p.locator("#set-dyslexia").isChecked())) F("PERSIST: the dyslexia box is unticked after a reload");
      await p.locator("#set-dyslexia").uncheck();
    });

    /* ------------------------------------------------------- OFFICE */
    await step("OFFICE", async () => {
      await p.waitForFunction(() => window.__C2.office(), null, { timeout: 15000 });
      if (!(await p.locator("#office canvas").count())) F("OFFICE: no 3D canvas");
      await p.locator("#office").scrollIntoViewIfNeeded();
      const at = await p.evaluate(() => window.__C2.office().screenOf("WS3"));
      if (!at) { F("OFFICE: WS3 has no desk in the model"); return; }
      await p.mouse.click(at.x, at.y); await p.waitForTimeout(200);
      if ((await p.evaluate(() => window.__C2.selected())) !== "WS3") F("OFFICE: clicking Dev's desk in 3D did not sit you at WS3-DEV");
      if (!/WS3-DEV/.test(await p.locator("#screen-h").innerText())) F("OFFICE: the screen heading does not say WS3-DEV after the 3D click");
    });
  } finally {
    errs.forEach((e) => F("LOAD: page error — " + e));
    await b.close(); s.close();
  }
  return fails;
}

/* [check it must be caught by, what, rewrites of the SERVED files] */
const PLANTS = [
  ["LOAD", "a ticket missing from the queue", { "assets/app.js": [["E.tickets().forEach(function (x) {", "E.tickets().slice(1).forEach(function (x) {"]] }],
  ["L1", "the Help Desk closes when a ticket is opened", { "assets/app.js": [['drawList(); desktopFor("TECH").open("helpdesk");', "drawList(); api.refresh();"]] }],
  ["L1", "the hint ladder never shows", { "assets/app.js": [["if (g && g.rung && st.stage === \"work\")", "if (false)"]] }],
  ["RED", "a wrong pick loses its mark on redraw", { "assets/app.js": [["const out = !!st.picked[o.label] && !o.correct", "const out = false"]] }],
  ["CLOSE", "any note closes the ticket", { "assets/engine.js": [["const r = noteOK(t, text);", "const r = { ok: true, missing: [] };"]] }],
  ["D1", "the old answer is not counted", { "assets/tickets.js": [["if (act.res.kind !== \"change\") return { guess: false };", "return { guess: false };"]] }],
  ["REVERT", "revert keeps the broken machine", { "assets/engine.js": [["S.fleet = M.clone(S.snap);", ""]] }],
  ["PERSIST", "the session is not saved", { "assets/engine.js": [["try { storage.setItem(KEY, JSON.stringify(S)); }", "try { }"]] }],
  ["PERSIST", "the dyslexia setting does not persist", { "assets/prefs.js": [['put(READ, on ? "dyslexia" : "default");', ""]] }],
  ["OFFICE", "a click in 3D does not reach the machine", { "assets/office3d.js": [["if (h && opts.onPick) opts.onPick(h.object.userData.machine);", ""]] }]
];

if (!process.argv.includes("--plant")) {
  const f = await run({}); f.forEach((x) => console.log("FAIL " + x));
  console.log(f.length ? f.length + " failure(s)" : "PASS — page: load, L1 through the UI, red stays red, close, D1, revert, persist, 3D office");
  process.exit(f.length ? 1 : 0);
} else {
  let bad = 0;
  const list = PLANTS.filter((x) => !process.env.ONLY || x[0] === process.env.ONLY);
  for (const [by, what, rw] of list) {
    const f = await run(rw); const caught = f.filter((x) => x.startsWith(by));
    if (caught.length) console.log("caught  [" + by + "] " + what + "  ← " + caught[0]);
    else { bad++; console.log("MISSED  [" + by + "] " + what + (f.length ? "  (only tripped: " + f[0] + ")" : "")); }
  }
  console.log(bad ? bad + " plant(s) missed" : "PASS — all " + list.length + " plants caught by the check written for them");
  process.exit(bad ? 1 : 0);
}
