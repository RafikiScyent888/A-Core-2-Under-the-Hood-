/* =====================================================================
   verify/page.mjs — drives the real laptop in Chromium, the way a
   student would: sign in, Help Desk, remote sessions, typing, Mason,
   the walk-over.

     node verify/page.mjs           every check
     node verify/page.mjs --plant   every planted defect must be CAUGHT
     ONLY=WALK node verify/page.mjs --plant      one plant

   Written and reachable are different claims: the logic checks prove the
   tickets exist and solve; only driving the page proves a student can.

     LOAD      sign-in refuses a wrong password; twelve tickets, labelled
               crawl (2), walk (2) and run (8); no page errors
     CRAWL     L1 and D1 finish by doing ONLY what Mason rings (and typing
               only the commands he shows)
     WALK      L2's checklist ticks itself off out of order, with no rings
     RUN       L4 closes through the UI; Mason gives a pointer before any
               wrong move, rung 1 on the third, six moves with four struck
               on the fifth
     RED       a wrong cause is marked three ways and stays marked
     NOTE      a thin note is refused
     REVERT    Revert to snapshot puts the PC back and keeps the hints
     DROP      a restart ends the remote session; Reconnect works
     WALKOVER  a PC that was shut down: walk over, power it on, walk back,
               reconnect
     PERSIST   a reload keeps the ticket and the guesses; dyslexia text
               stays on
   ===================================================================== */
import { serve, browser } from "./serve.mjs";
import path from "node:path"; import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INC = { L1: "INC20410", L2: "INC20411", L4: "INC20413", D1: "INC20416", D4: "INC20419", D5: "INC20420" };
const NOTES = {
  L1: "Testing said MSVCP100.dll was missing. Reinstalled Testing from Software Center. Tested: it opens.",
  L2: "PayWise said VCRUNTIME140.dll was missing. Reinstalled PayWise from Software Center. Tested: it opens.",
  L4: "Testing gave a configuration error: config.ini was damaged. Reinstalled Testing, which rewrote the file, and tested it.",
  D1: "Event 2190: Testing failed on MSVCP100.dll. The System32 copy is 64-bit and gave 0xc000007b, so I removed it. Installed the x86 Visual C++ 2010 runtime from FS01. Tested: it opens."
};
const GROUPS = ["LOAD", "CRAWL", "WALK", "RUN", "RED", "NOTE", "REVERT", "DROP", "WALKOVER", "PERSIST"];

async function run(rewrites, groups) {
  const fails = []; const F = (s) => fails.push(s);
  const s = serve(ROOT, rewrites); const b = await browser();
  async function page() {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); p.setDefaultTimeout(8000);
    p.errs = []; p.on("pageerror", (e) => p.errs.push(e.message));
    await p.goto(s.url + "/index.html"); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(250);
    return p;
  }
  async function signIn(p) { await p.getByRole("button", { name: "Press to sign in" }).click(); await p.locator("#lock-pw").fill("TechStart-2026"); await p.locator("#lock-pw").press("Enter"); await p.waitForTimeout(300); }
  const hd = (p) => p.locator("[data-win=helpdesk]");
  async function take(p, id) { await p.locator(".qi", { hasText: INC[id] }).click(); await hd(p).locator("[data-coach=assign]").click(); }
  async function connect(p, mach) { await hd(p).locator("[data-coach=connect]").click(); await p.waitForTimeout(1700); return p.locator(`[data-win="rdp:${mach}"]`); }
  async function tool(rdp, q, name) { await rdp.getByRole("button", { name: "Start menu" }).click(); await rdp.locator(".sm-search").fill(q); await rdp.getByRole("button", { name }).click(); }
  async function ok(rdp) { if (await rdp.locator(".w-dialog").count()) await rdp.locator(".w-dialog").getByRole("button", { name: "OK" }).click(); }
  async function typed(rdp, line) { const i = rdp.locator(".con-in"); await i.fill(line); await i.press("Enter"); await rdp.page().waitForTimeout(120); }
  async function admin(rdp) { await tool(rdp, "cmd", "Run Command Prompt as administrator"); const c = rdp.locator(".w-dialog.uac-creds"); await c.locator("input").nth(0).fill("RAFIKI\\itadmin"); await c.locator("input").nth(1).fill("Bench-Tech-2026"); await c.getByRole("button", { name: "Yes" }).click(); }
  const guesses = (p) => p.evaluate(() => window.__LAP.engine.T() ? window.__LAP.engine.T().guesses : -1);
  const lastMason = (p) => p.evaluate(() => { const c = window.__LAP.L().chat; return c.length ? c[c.length - 1] : null; });
  const want = (g) => !groups || groups.indexOf(g) >= 0;
  async function step(name, fn) {
    if (!want(name)) return; let p = null;
    try { p = await page(); await fn(p); } catch (e) { F(name + ": the page could not be driven — " + String(e.message).split("\n")[0]); }
    if (p) { p.errs.forEach((e) => F(name + ": page error — " + e)); await p.close(); }
  }
  /* follow Mason's rings and nothing else, to the end of a crawl */
  async function crawl(p, id) {
    await take(p, id).catch(() => {});
    for (let i = 0; i < 70; i++) {
      await p.waitForTimeout(300);
      const head = (await p.locator(".coach-now").innerText().catch(() => "")).split("\n")[0];
      if (/done/i.test(head)) return true;
      const t = p.locator(".coach-target");
      if (!(await t.count())) { await p.waitForTimeout(1600); if (!(await t.count())) return false; }
      const tag = await t.first().evaluate((e) => e.tagName + "." + e.className + " " + (e.getAttribute("aria-label") || ""));
      if (/TEXTAREA/.test(tag)) { await t.first().fill(NOTES[id]); await p.getByRole("button", { name: "Close the ticket" }).click(); continue; }
      if (/DIV/.test(tag) && /opts/.test(tag)) { const right = await p.evaluate(() => window.__LAP.engine.ticket().close.options.find((o) => o.correct).label); await p.locator(".opt2", { hasText: right }).first().click(); continue; }
      if (/con-in/.test(tag)) { const cmd = await p.locator(".coach-cmd").innerText(); await t.first().fill(cmd); await t.first().press("Enter"); continue; }
      if (/INPUT/.test(tag)) { const c = p.locator(".w-dialog.uac-creds"); await c.locator("input").nth(0).fill("RAFIKI\\itadmin"); await c.locator("input").nth(1).fill("Bench-Tech-2026"); await c.getByRole("button", { name: "Yes" }).click(); continue; }
      const h = await t.first().elementHandle(); await h.click({ timeout: 4000 }).catch(() => {});
      if (/tb-start/.test(tag)) { await p.waitForTimeout(120); const w = ((await p.locator(".coach-say").innerText()).match(/type (\w+)/) || [])[1]; if (w) await p.locator(".sm-search").last().fill(w); }
    }
    return false;
  }

  try {
    await step("LOAD", async (p) => {
      await p.getByRole("button", { name: "Press to sign in" }).click();
      await p.locator("#lock-pw").fill("wrong"); await p.getByRole("button", { name: "Sign in" }).click();
      if (!/incorrect/.test(await p.locator(".lock-err").innerText())) F("LOAD: a wrong password was not refused");
      await p.locator("#lock-pw").fill("TechStart-2026"); await p.locator("#lock-pw").press("Enter"); await p.waitForTimeout(300);
      const items = await p.locator(".qi").allInnerTexts();
      if (items.length !== 12) F("LOAD: the queue shows " + items.length + " tickets, not 12");
      const count = (re) => items.filter((x) => re.test(x)).length;
      if (count(/Crawl: guided/) !== 2 || count(/Walk: checklist/) !== 2 || count(/Run: on your own/) !== 8) F("LOAD: the queue's labels are not 2 crawl, 2 walk, 8 run");
      if (!/Cyber Warrior Program — built by an instructor/.test(await p.locator("footer").innerText())) F("LOAD: the full footer is missing");
    });

    await step("CRAWL", async (p) => {
      await signIn(p);
      if (!(await crawl(p, "L1"))) F("CRAWL: L1 could not be finished by following Mason's rings");
      else if ((await p.evaluate(() => window.__LAP.engine.state().tickets.L1.stage)) !== "done") F("CRAWL: L1's crawl said done but the ticket is not closed");
      await p.getByRole("button", { name: "Close the walkthrough" }).click().catch(() => {});
      if (!(await crawl(p, "D1"))) F("CRAWL: D1 could not be finished by following Mason's rings");
      else if ((await p.evaluate(() => window.__LAP.engine.state().tickets.D1.stage)) !== "done") F("CRAWL: D1's crawl said done but the ticket is not closed");
    });

    await step("WALK", async (p) => {
      await signIn(p); await take(p, "L2");
      const rdp = await connect(p, "WS2");
      await tool(rdp, "event", "Open Event Viewer");                       /* out of order: the log first */
      await p.waitForTimeout(400);
      const ticked = await p.locator(".coach-list li.did").count();
      if (ticked !== 3) F("WALK: doing the steps out of order ticked " + ticked + " items, not 3");
      if (await p.locator(".coach-target").count()) F("WALK: the walk rings things to press (that is the crawl)");
      if (!(await p.locator(".coach details.how").count())) F("WALK: no How? pointers on the checklist");
      await rdp.getByRole("button", { name: "Show the desktop" }).click(); await rdp.getByRole("button", { name: /Open the PayWise shortcut/ }).click(); await ok(rdp);
      await tool(rdp, "software", "Open Software Center"); await rdp.getByRole("button", { name: "Reinstall PayWise 3.1" }).click(); await ok(rdp);
      await rdp.getByRole("button", { name: "Show the desktop" }).click(); await rdp.getByRole("button", { name: /Open the PayWise shortcut/ }).click();
      await p.evaluate(() => window.__LAP.openWin("helpdesk")); await hd(p).locator("[data-coach=resolve]").click();
      const right = await p.evaluate(() => window.__LAP.engine.ticket().close.options.find((o) => o.correct).label);
      await hd(p).locator(".opt2", { hasText: right }).click(); await hd(p).locator("#res-note").fill(NOTES.L2); await hd(p).getByRole("button", { name: "Close the ticket" }).click();
      await p.waitForTimeout(400);
      if (!/done/i.test(await p.locator(".coach-now").innerText())) F("WALK: the checklist did not reach Done when the ticket closed");
    });

    await step("RUN", async (p) => {
      await signIn(p); await take(p, "L4");
      if (await p.locator(".coach").count()) F("RUN: a run ticket shows Mason's panel");
      await p.evaluate(() => window.__LAP.openWin("chat")); await p.getByRole("button", { name: "I'm stuck" }).click(); await p.waitForTimeout(900);
      const m0 = await lastMason(p);
      if (!m0 || m0.from !== "mason" || m0.text.length < 40) F("RUN: \"I'm stuck\" before any wrong move got no real pointer");
      if (m0 && /reinstall|software center|repair/i.test(m0.text)) F("RUN: Mason's first pointer names the fix");
      const rdp = await connect(p, "WS5");
      await tool(rdp, "cmd", "Open Command Prompt");
      for (const c of ["setx PATH C:\\A", "setx PATH C:\\B", "setx PATH C:\\C"]) await typed(rdp, c);
      const m3 = await lastMason(p);
      if ((await guesses(p)) !== 3 || !m3 || m3.rung !== 1) F("RUN: three wrong moves did not bring Mason's rung 1");
      for (const c of ["setx PATH C:\\D", "setx PATH C:\\E"]) await typed(rdp, c);
      const m5 = await lastMason(p);
      if (!m5 || !m5.moves || m5.moves.filter((x) => x.struck).length !== 4 || m5.moves.length !== 6) F("RUN: the fifth wrong move did not bring six moves with four struck");
      await tool(rdp, "software", "Open Software Center"); await rdp.getByRole("button", { name: "Reinstall Testing 4.2" }).click(); await ok(rdp);
      await rdp.getByRole("button", { name: "Show the desktop" }).click(); await rdp.getByRole("button", { name: /Open the Testing shortcut/ }).click();
      await p.evaluate(() => window.__LAP.openWin("helpdesk")); await hd(p).locator("[data-coach=resolve]").click();
      if (!(await hd(p).locator(".opt2").count())) F("RUN: L4 would not resolve after the fix");
    });

    await step("RED", async (p) => {
      await signIn(p); await take(p, "L4"); const rdp = await connect(p, "WS5");
      await tool(rdp, "software", "Open Software Center"); await rdp.getByRole("button", { name: "Reinstall Testing 4.2" }).click(); await ok(rdp);
      await rdp.getByRole("button", { name: "Show the desktop" }).click(); await rdp.getByRole("button", { name: /Open the Testing shortcut/ }).click();
      await p.evaluate(() => window.__LAP.openWin("helpdesk")); await hd(p).locator("[data-coach=resolve]").click();
      const wrong = await p.evaluate(() => window.__LAP.engine.ticket().close.options.find((o) => !o.correct).label);
      await hd(p).locator(".opt2", { hasText: wrong }).click();
      const look = () => hd(p).locator(".opt2", { hasText: wrong }).evaluate((e) => ({ cls: e.className, text: e.innerText, rule: getComputedStyle(e).boxShadow }));
      let w = await look();
      if (!/\bout\b/.test(w.cls) || !/Ruled out/.test(w.text) || !/inset/.test(w.rule)) F("RED: a wrong cause is not marked three ways (colour, inset rule, words)");
      await p.evaluate(() => window.__LAP.openWin("chat")); await p.evaluate(() => window.__LAP.openWin("helpdesk"));
      w = await look(); if (!/\bout\b/.test(w.cls) || !/Ruled out/.test(w.text)) F("RED: the wrong cause did not stay red after a redraw");
    });

    await step("NOTE", async (p) => {
      await signIn(p); await take(p, "L4"); const rdp = await connect(p, "WS5");
      await tool(rdp, "software", "Open Software Center"); await rdp.getByRole("button", { name: "Reinstall Testing 4.2" }).click(); await ok(rdp);
      await rdp.getByRole("button", { name: "Show the desktop" }).click(); await rdp.getByRole("button", { name: /Open the Testing shortcut/ }).click();
      await p.evaluate(() => window.__LAP.openWin("helpdesk")); await hd(p).locator("[data-coach=resolve]").click();
      const right = await p.evaluate(() => window.__LAP.engine.ticket().close.options.find((o) => o.correct).label);
      await hd(p).locator(".opt2", { hasText: right }).click();
      await hd(p).locator("#res-note").fill("Fixed it for Rosa."); await hd(p).getByRole("button", { name: "Close the ticket" }).click();
      if ((await p.evaluate(() => window.__LAP.engine.state().tickets.L4.stage)) === "done") F("NOTE: a thin note closed the ticket");
      await hd(p).locator("#res-note").fill(NOTES.L4); await hd(p).getByRole("button", { name: "Close the ticket" }).click();
      if ((await p.evaluate(() => window.__LAP.engine.state().tickets.L4.stage)) !== "done") F("NOTE: a good note did not close the ticket");
    });

    await step("REVERT", async (p) => {
      await signIn(p); await take(p, "D5"); const rdp = await connect(p, "WS2");
      await admin(rdp); await typed(rdp, 'del "C:\\Windows\\SysWOW64\\msvcp100.dll"');
      const has = () => p.evaluate(() => window.__LAP.engine.fleet().WS2.fs["c:\\windows\\syswow64"].files.some((f) => /msvcp100/i.test(f.name)));
      if (await has()) F("REVERT: the harmful delete did not happen, so revert cannot be tested");
      const g = await guesses(p);
      await rdp.getByRole("button", { name: /Revert to snapshot/ }).click(); await p.waitForTimeout(200);
      if (!(await has())) F("REVERT: Revert to snapshot did not put msvcp100.dll back");
      if ((await guesses(p)) !== g) F("REVERT: revert changed the guess count");
    });

    await step("DROP", async (p) => {
      await signIn(p); await take(p, "D4"); const rdp = await connect(p, "WS3");
      await admin(rdp); for (const c of ["gpupdate /force", "Y"]) await typed(rdp, c);
      await p.waitForTimeout(300);
      if (!/ended because WS3-DEV restarted/.test(await rdp.locator(".rdp-wait").innerText().catch(() => ""))) { F("DROP: a restart did not end the remote session"); return; }
      await rdp.getByRole("button", { name: /Reconnect to/ }).click(); await p.waitForTimeout(1700);
      if (!/Connected to WS3-DEV/.test(await rdp.locator(".rdp-bar .who").innerText())) F("DROP: Reconnect did not reconnect");
    });

    await step("WALKOVER", async (p) => {
      p.setDefaultTimeout(90000);
      await signIn(p); await take(p, "L4"); const rdp = await connect(p, "WS5");
      await rdp.getByRole("button", { name: "Start menu" }).click(); await rdp.locator(".sm-power").getByRole("button", { name: "Shut down" }).click(); await p.waitForTimeout(300);
      await rdp.getByRole("button", { name: /Walk to Rosa's desk/ }).click();
      await p.locator(".wo-skip").click().catch(() => {});
      await p.waitForSelector(".wo-desk");
      if (!/switched off/.test(await p.locator(".wo-monitor").innerText())) F("WALKOVER: at the desk, the monitor does not show the PC switched off");
      await p.getByRole("button", { name: /Press the power button to switch it on/ }).click(); await p.waitForTimeout(300);
      if ((await p.evaluate(() => window.__LAP.engine.machine("WS5").power)) !== "on") F("WALKOVER: pressing the power button did not switch the PC on");
      await p.getByRole("button", { name: "Walk back to your desk" }).click(); await p.waitForSelector(".walkover", { state: "detached" });
      await hd(p).locator("[data-coach=connect]").click(); await p.waitForTimeout(1700);
      if (!/Connected to WS5-RECEPT/.test(await p.locator('[data-win="rdp:WS5"] .rdp-bar .who').innerText().catch(() => ""))) F("WALKOVER: could not reconnect after walking back");
    });

    await step("PERSIST", async (p) => {
      await signIn(p); await take(p, "L4"); const rdp = await connect(p, "WS5");
      await tool(rdp, "cmd", "Open Command Prompt"); await typed(rdp, "setx PATH C:\\A");
      const g = await guesses(p);
      await p.locator(".tb", { hasText: "Settings" }).click(); await p.locator("#set-dys").check();
      await p.reload(); await p.waitForTimeout(300); await signIn(p);
      if ((await p.evaluate(() => window.__LAP.engine.ticket() && window.__LAP.engine.ticket().id)) !== "L4") F("PERSIST: the open ticket was lost on reload");
      if ((await guesses(p)) !== g) F("PERSIST: the guess count was lost on reload");
      if ((await p.getAttribute("html", "data-reading")) !== "dyslexia") F("PERSIST: dyslexia-friendly text did not stay on after a reload");
    });
  } finally { await b.close(); s.close(); }
  return fails;
}

/* [check it must be caught by, what, rewrites of the SERVED files] */
const PLANTS = [
  ["LOAD", "a ticket missing from the queue", { "assets/laptop.js": [["  E.tickets().forEach(function (x) {\n    const s = statusOf(x.t, x.st);", "  E.tickets().slice(1).forEach(function (x) {\n    const s = statusOf(x.t, x.st);"]] }],
  ["CRAWL", "Mason's rings never drawn", { "assets/laptop.js": [["if (t) t.classList.add(\"coach-target\");", ""]] }],
  ["WALK", "the walk ticks only in strict order", { "assets/laptop.js": [["(walk.mode === \"walk\" || i <= firstOpen(walk, c))", "(i <= firstOpen(walk, c))"]] }],
  ["RUN", "Mason never checks in after wrong moves", { "assets/laptop.js": [["if (g.rung > last.rung || (g.rung === 3 && n > last.n)) {", "if (false) {"]] }],
  ["RED", "a wrong cause loses its mark", { "assets/laptop.js": [["const out = !!st.picked[o.label] && !o.correct, struck", "const out = false, struck"]] }],
  ["NOTE", "any note closes the ticket", { "assets/engine.js": [["const r = noteOK(t, text);", "const r = { ok: true, missing: [] };"]] }],
  ["REVERT", "revert keeps the broken machine", { "assets/engine.js": [["S.fleet = M.clone(S.snap);", ""]] }],
  ["DROP", "a restart leaves the session running", { "assets/laptop.js": [["if (a.type === \"power\" && (a.op === \"restart\" || a.op === \"off\")) setTimeout(function () { dropped(w, a.op); }, 0);", ""]] }],
  ["WALKOVER", "the power button does nothing", { "assets/laptop.js": [["if (m.power !== \"on\") { M.boot(m);", "if (m.power !== \"on\") {"]] }],
  ["PERSIST", "the dyslexia setting is not saved", { "assets/laptop.js": [["put(\"c2vm.reading\", on ? \"dyslexia\" : \"default\");", ""]] }]
];

if (!process.argv.includes("--plant")) {
  const groups = process.env.ONLY ? process.env.ONLY.split(",") : null;
  const f = await run({}, groups); f.forEach((x) => console.log("FAIL " + x));
  console.log(f.length ? f.length + " failure(s)" : "PASS — page: " + (groups || GROUPS).join(", "));
  process.exit(f.length ? 1 : 0);
} else {
  let bad = 0; const list = PLANTS.filter((x) => !process.env.ONLY || x[0] === process.env.ONLY);
  for (const [by, what, rw] of list) {
    const f = await run(rw, [by]); const caught = f.filter((x) => x.startsWith(by));
    if (caught.length) console.log("caught  [" + by + "] " + what + "  ← " + caught[0]);
    else { bad++; console.log("MISSED  [" + by + "] " + what + (f.length ? "  (only tripped: " + f[0] + ")" : "")); }
  }
  console.log(bad ? bad + " plant(s) missed" : "PASS — all " + list.length + " plants caught by the check written for them");
  process.exit(bad ? 1 : 0);
}
