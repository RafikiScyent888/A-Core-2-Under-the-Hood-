/* =====================================================================
   verify/page.mjs — drive the real page.

     node verify/page.mjs           the checks
     node verify/page.mjs --plant   every planted defect must be caught

   Written and reachable are different claims: logic.mjs proves a fix
   exists; this proves a student can reach it by clicking and typing.

     PLAY      all six jobs, every core stage, start to "Job finished",
               through the real Start menu, UAC (and the credential
               prompt for the standard user), Task Manager, typed
               commands, the desk controls and Disk Management
     RED       a wrong pick goes red and STAYS red, marked three ways
     LADDER    nothing on guesses 1-2, rungs 1, 2, 3 on guesses 3, 4, 5,
               rung 3 still there on guess 8, four struck and two alive
     JUDGE     dir, help and a typo never count; a refused sfc does
     RESET     back to the last point got right: the machine goes back,
               finished steps stay finished, hints are kept
     SHELL     ending explorer.exe takes the taskbar; Run new task brings
               it back
     BSOD      ending csrss.exe blue-screens; it restarts to a desktop
     READING   the dyslexia toggle survives a reload
     NO GL     with WebGL off, every desk control is still there
   ===================================================================== */
import { serve, browser } from "./serve.mjs";
const ROOT = new URL("..", import.meta.url).pathname;

export async function run(rewrites, only) {
  const fails = [];
  const F = (s) => { fails.push(s); };
  const S = serve(ROOT, rewrites);
  const B = await browser();
  const page = await B.newPage({ viewport: { width: 1400, height: 1000 } });
  page.setDefaultTimeout(5000);
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));

  const cur = () => page.evaluate(() => { const r = window.__C2UTH.runner(); return r ? r._state().current : "no-runner"; });
  const tries = (k) => page.evaluate((k) => window.__C2UTH.runner()._state().attempts[k] || 0, k);
  async function choose(label) { await page.locator(".step.now .opt", { hasText: label }).first().click(); await page.waitForTimeout(120); }
  async function type(cmd) { const i = page.locator(".con-in").last(); await i.fill(cmd); await i.press("Enter"); await page.waitForTimeout(120); }
  async function hw(label) { await page.locator(".bench-act", { hasText: label }).first().click(); await page.waitForTimeout(150); }
  async function start(job, length) {
    await page.goto(S.url + "/index.html"); await page.evaluate(() => localStorage.clear()); await page.reload();
    await page.check("input[name=job][value=" + job + "]"); await page.selectOption("#length", length || "quick");
    await page.click("text=Start this job"); await page.waitForTimeout(500);
    return page.evaluate(async (k) => { const L = await import("./assets/lab-tools.js"); return JSON.parse(JSON.stringify(L.jobByKey(k))); }, job);
  }
  async function next() { await page.click(".stage-nav >> text=/Next stage|Finish the job/"); await page.waitForTimeout(600); }
  async function adminPrompt(J) {
    await page.click(".tb-start"); await page.locator(".sm-app", { hasText: "Command Prompt" }).locator("text=Run as administrator").click();
    if (J.userIsAdmin) await page.click(".w-dialog.uac >> text=Yes");
    else { await page.fill("#uac-u", "itadmin"); await page.fill("#uac-p", "Bench-Tech-2026"); await page.click(".w-dialog.uac-creds >> text=Yes"); }
    await page.waitForTimeout(150);
  }
  const want = (k) => !only || only.indexOf(k) >= 0;

  try {
    /* ---------------- PLAY ---------------- */
    if (want("play")) for (const job of ["harbourside", "keel", "ridgeline", "northgate", "brightwater", "staldric"]) {
      const J = await start(job);
      const at = (w) => job + " " + w;
      await choose(J.desk.correct); if (await cur() !== null) F(at("desk not finished by the right answer"));
      await next();
      await page.click("text=Ctrl + Shift + Esc");
      await page.locator(".th-btn", { hasText: { cpu: "CPU", mem: "Memory", disk: "Disk" }[J.slow.column] }).click();
      const culprit = J.slow.procs.find((p) => p.tag === J.slow.culprit);
      const topRow = await page.locator(".tm-row").first().textContent();
      if (topRow.indexOf(culprit.desc) < 0) F(at("after sorting, the top row is not the culprit: " + topRow.slice(0, 50)));
      await page.locator(".tm-row", { hasText: culprit.desc }).first().click();
      await page.click("text=This is the cause");
      await choose(J.slow.remedies.correct[1]);
      if (J.slow.act && J.slow.act.kind === "end") { await page.locator(".tm-row", { hasText: culprit.desc }).first().click(); await page.locator(".tm-tools button", { hasText: "End task" }).click(); }
      if (J.slow.act && J.slow.act.kind === "unplug") await hw("Unplug the network cable");
      if (await cur() !== null) F(at("slow stage not finished: stuck on " + await cur()));
      await next();
      await adminPrompt(J);
      const v = J.admin.variant;
      const seq = { sfc: ["sfc /scannow"], dism: ["sfc /scannow", "DISM /Online /Cleanup-Image /RestoreHealth", "sfc /scannow"], chkdsk: ["sfc /scannow", "chkdsk C: /f", "Y", "shutdown /r /t 0"], pending: ["sfc /scannow", "shutdown /r /t 0"], clean: ["sfc /scannow"], creds: ["sfc /scannow"] }[v];
      for (const c of seq) await type(c);
      if (v === "chkdsk" || v === "pending") { await adminPrompt(J); await type("sfc /scannow"); }
      if (await cur() !== "admin-why") F(at("admin fix not accepted: on " + await cur()));
      const aq = await page.evaluate(async (k) => { const L = await import("./assets/lab-tools.js"); return L.buildStage("admin", L.jobByKey(k)).steps[1].answer; }, job);
      await choose(aq);
      if (await tries("admin-fix") !== 0) F(at("the known admin fix was counted as " + await tries("admin-fix") + " wrong move(s)"));
      await next();
      await page.fill(".num-in", (J.disk.bytes / 1073741824).toFixed(2)); await page.click(".numbox >> text=Check");
      await page.click(".tb-start"); await page.click(".sm-power >> text=Shut down"); await page.waitForTimeout(150);
      for (const a of ["Unplug the mains lead", "Remove the side panel", "Fit the drive in the drive cage", "Connect the SATA data cable", "Connect the SATA power lead", "Refit the side panel", "Plug the mains lead back in", "Press the power button"]) await hw(a);
      if (await cur() !== "disk-setup") F(at("drive fitting not accepted: on " + await cur()));
      if (await tries("disk-fit") !== 0) F(at("the known fitting was counted as wrong"));
      await page.click(".tb-start"); await page.locator(".sm-app", { hasText: "Disk Management" }).locator("text=Open").click();
      if (J.userIsAdmin) await page.click(".w-dialog.uac >> text=Yes");
      else { await page.fill("#uac-u", "itadmin"); await page.fill("#uac-p", "Bench-Tech-2026"); await page.click(".w-dialog.uac-creds >> text=Yes"); }
      const d1 = () => page.locator(".dm-row").nth(1);
      if (J.disk.offline) { await d1().locator(".dm-label").click(); await page.click(".dm-acts >> text=Online"); }
      if (J.disk.oldVolume) {
        await d1().locator(".dm-part.k-data").click(); await page.click(".dm-acts >> text=Delete Volume"); await page.click(".w-dialog.delete >> text=Yes");
        await d1().locator(".dm-label").click(); await page.click(".dm-acts >> text=Convert to GPT Disk");
      } else { await page.check("#ps-GPT"); await page.click(".w-dialog.init >> text=OK"); }
      const vol = async (mb, letter) => {
        await d1().locator(".dm-part.k-unalloc").first().click(); await page.click(".dm-acts >> text=New Simple Volume");
        if (mb) await page.fill("#wz-size", String(mb)); if (letter) await page.selectOption("#wz-letter", letter);
        await page.click(".w-dialog.wizard >> text=Finish"); await page.waitForTimeout(100);
      };
      if (J.disk.need.volumes > 1) { await vol(1048576); await vol(null); } else await vol(null, J.disk.need.letter);
      if (await cur() !== null) F(at("disk setup not accepted: on " + await cur()));
      await next();
      if (!(await page.locator("text=Job finished").count())) F(at("never reached Job finished"));
    }

    /* ---------------- RED + LADDER on a choice ---------------- */
    if (want("red")) {
      const J = await start("keel");
      const wrongs = J.desk.wrong.map((w) => w[0]);
      await choose(wrongs[0]); await choose(wrongs[1]);
      if (await page.locator(".guide").count()) F("a hint appeared after only two wrong picks");
      const o0 = page.locator(".opt", { hasText: wrongs[0] }).first();
      const cls = await o0.getAttribute("class");
      const txt = await o0.textContent();
      const sh = await o0.evaluate((e) => getComputedStyle(e).boxShadow);
      if (!/\bout\b/.test(cls || "")) F("a wrong pick is not marked out");
      if (txt.indexOf("Ruled out") < 0) F("a wrong pick does not SAY it is ruled out");
      if (!/inset/.test(sh)) F("a wrong pick has no inset rule (colour would be the only other cue)");
      await choose(wrongs[2]);
      if (!(await page.locator(".guide.rung-1").count())) F("no rung 1 on the third wrong pick");
      if (!/\bout\b/.test(await page.locator(".opt", { hasText: wrongs[0] }).first().getAttribute("class") || "")) F("the first wrong pick stopped being red");
      await choose(wrongs[3]);
      if (!(await page.locator(".guide.rung-2").count())) F("no rung 2 on the fourth wrong pick");
    }

    /* ---------------- JUDGE + LADDER on typed work ---------------- */
    if (want("judge")) {
      const J = await start("harbourside");
      await choose(J.desk.correct); await next();
      /* skip to admin: finish slow the quick way */
      await page.click("text=Ctrl + Shift + Esc");
      const culprit = J.slow.procs.find((p) => p.tag === J.slow.culprit);
      await page.locator(".tm-row", { hasText: culprit.desc }).first().click(); await page.click("text=This is the cause");
      await choose(J.slow.remedies.correct[1]);
      await page.locator(".tm-row", { hasText: culprit.desc }).first().click(); await page.locator(".tm-tools button", { hasText: "End task" }).click();
      await next();
      await page.click(".tb-start"); await page.locator(".sm-app", { hasText: "Command Prompt" }).locator("text=Open").click();
      for (const c of ["dir", "help", "sfc /?", "sfcc /scannow", "whoami", "cd .."]) await type(c);
      if (await tries("admin-fix") !== 0) F("looking, help or a typo counted as a guess (" + await tries("admin-fix") + ")");
      await type("sfc /scannow");
      if (await tries("admin-fix") !== 1) F("a refused sfc in a standard prompt was not counted");
      await type("sfc /scannow"); if (await page.locator(".guide").count()) F("a hint after two guesses");
      await type("sfc /scannow"); if (!(await page.locator(".guide.rung-1").count())) F("no rung 1 on guess 3 at the prompt");
      await type("sfc /scannow"); if (!(await page.locator(".guide.rung-2").count())) F("no rung 2 on guess 4 at the prompt");
      await type("sfc /scannow");
      if (!(await page.locator(".guide.rung-3").count())) F("no rung 3 on guess 5 at the prompt");
      const struck = await page.locator(".narrow .struck").count(), alive = await page.locator(".narrow .alive").count();
      if (struck !== 4 || alive !== 2) F("rung 3 shows " + struck + " struck and " + alive + " alive, not 4 and 2");
      for (let i = 0; i < 3; i++) await type("sfc /scannow");
      if (!(await page.locator(".guide.rung-3").count())) F("rung 3 did not repeat on guess 8");
      const guide = (await page.locator(".guide").textContent()) || "";
      const hintOnly = guide.split("Six possible next moves")[0];
      if (/run as administrator/i.test(hintOnly)) F("a rung-1/2 hint names the answer (Run as administrator)");
    }

    /* ---------------- RESET ---------------- */
    if (want("reset")) {
      const J = await start("harbourside");
      /* jump straight to the disk stage */
      for (let i = 0; i < 3; i++) {
        const c = await cur();
        if (c === "desk-told") { await choose(J.desk.correct); await next(); continue; }
        if (c === "slow-find") {
          await page.click("text=Ctrl + Shift + Esc");
          const culprit = J.slow.procs.find((p) => p.tag === J.slow.culprit);
          await page.locator(".tm-row", { hasText: culprit.desc }).first().click(); await page.click("text=This is the cause");
          await choose(J.slow.remedies.correct[1]);
          await page.locator(".tm-row", { hasText: culprit.desc }).first().click(); await page.locator(".tm-tools button", { hasText: "End task" }).click();
          await next(); continue;
        }
        if (c === "admin-fix") { await adminPrompt(J); await type("sfc /scannow"); const aq = await page.evaluate(async () => { const L = await import("./assets/lab-tools.js"); return L.buildStage("admin", L.jobByKey("harbourside")).steps[1].answer; }); await choose(aq); await next(); }
      }
      await page.fill(".num-in", (J.disk.bytes / 1073741824).toFixed(2)); await page.click(".numbox >> text=Check");
      await page.click(".tb-start"); await page.click(".sm-power >> text=Shut down");
      for (const a of ["Unplug the mains lead", "Remove the side panel", "Fit the drive in the drive cage", "Connect the SATA data cable", "Connect the SATA power lead", "Refit the side panel", "Plug the mains lead back in", "Press the power button"]) await hw(a);
      await page.click(".tb-start"); await page.locator(".sm-app", { hasText: "Disk Management" }).locator("text=Open").click(); await page.click(".w-dialog.uac >> text=Yes");
      await page.check("#ps-MBR"); await page.click(".w-dialog.init >> text=OK");
      if (await tries("disk-setup") !== 1) F("initializing a 4 TB drive as MBR was not counted");
      if (!(await page.locator(".dm-part.k-unreach").count())) F("MBR on a 4 TB drive did not show the unreachable space");
      await page.click("text=Put the PC back to the last point you got right"); await page.waitForTimeout(200);
      const style = await page.evaluate(() => { const m = window.__C2UTH.runner().machine(); const d = m.disks.filter((x) => x.spare)[0]; return d ? String(d.style) : "no disk"; });
      if (style !== "null") F("reset did not put the drive back to uninitialized (it is " + style + ")");
      const doneN = await page.locator(".step.done").count();
      if (doneN !== 2) F("reset undid finished steps: " + doneN + " still done, expected 2");
      if (await tries("disk-setup") !== 1) F("reset threw away the hint count");
    }

    /* ---------------- SHELL + BSOD ---------------- */
    if (want("shell")) {
      const J = await start("harbourside");
      await choose(J.desk.correct); await next();
      await page.click("text=Ctrl + Shift + Esc");
      await page.locator(".tm-row", { hasText: "Windows Explorer" }).first().click(); await page.locator(".tm-tools button", { hasText: "End task" }).click();
      if (await page.locator(".taskbar").count()) F("ending explorer.exe left the taskbar");
      if (!(await page.locator(".noshell-note").count())) F("no word that Explorer is not running");
      await page.click("text=Run new task"); await page.fill("#nt-in", "explorer"); await page.click(".w-dialog.newtask >> text=OK");
      if (!(await page.locator(".taskbar").count())) F("Run new task → explorer did not bring the taskbar back");
      await page.locator(".tm-row", { hasText: "Client Server Runtime" }).first().click(); await page.locator(".tm-tools button", { hasText: "End task" }).click();
      await page.locator(".w-dialog.confirm-critical button", { hasText: "Shut down" }).click();
      if (!(await page.locator(".screen.bsod").count())) F("ending csrss.exe did not blue-screen");
      if ((await page.locator(".bsod-code").textContent()).indexOf("CRITICAL_PROCESS_DIED") < 0) F("wrong stop code");
      await page.click("text=Let it restart");
      if (!(await page.locator(".taskbar").count())) F("after the blue screen, it did not restart to a desktop");
    }

    /* ---------------- READING ---------------- */
    if (want("reading")) {
      await page.goto(S.url + "/index.html"); await page.evaluate(() => localStorage.clear()); await page.reload();
      await page.check("#reading-dyslexia"); await page.reload();
      if (await page.evaluate(() => document.documentElement.getAttribute("data-reading")) !== "dyslexia") F("the dyslexia toggle did not survive a reload");
      if (!(await page.isChecked("#reading-dyslexia"))) F("the toggle shows off after a reload");
      await page.uncheck("#reading-dyslexia");
    }
  } catch (e) { F("DRIVE ERROR: " + String(e.message).split("\n")[0]); }
  if (errs.length) F("page errors: " + errs.slice(0, 3).join(" | "));
  await B.close();

  /* ---------------- NO GL ---------------- */
  if (want("nogl")) {
    const B2 = await browser(["--disable-webgl", "--disable-3d-apis"]);
    const p2 = await B2.newPage({ viewport: { width: 1400, height: 1000 } });
    try {
      await p2.goto(S.url + "/index.html"); await p2.evaluate(() => localStorage.clear()); await p2.reload();
      await p2.check("input[name=job][value=harbourside]"); await p2.click("text=Start this job"); await p2.waitForTimeout(400);
      const dc = await p2.evaluate(async () => { const L = await import("./assets/lab-tools.js"); return L.jobByKey("harbourside").desk.correct; });
      await p2.locator(".step.now .opt", { hasText: dc }).click();
      await p2.click(".stage-nav >> text=Next stage"); await p2.waitForTimeout(400);
      if (!(await p2.locator(".bench-nogl:visible").count())) F("with WebGL off, the page does not say the 3D view is off");
      if (await p2.locator(".bench-act").count() < 4) F("with WebGL off, the desk controls are missing (" + await p2.locator(".bench-act").count() + ")");
    } catch (e) { F("NO-GL DRIVE ERROR: " + String(e.message).split("\n")[0]); }
    await B2.close();
  }
  S.close();
  return fails;
}

/* ------------------------------------------------------------ plants */
const PLANTS = {
  "wrong picks fade instead of staying red": [{ "assets/runner.js": [["const out = !!P[op.key] && !op.correct;", "const out = false;"]] }, ["red"], "not marked out"],
  "the ladder starts a guess early": [{ "assets/hints.js": [["export const FIRST_RUNG = 3;", "export const FIRST_RUNG = 2;"]] }, ["red"], "only two wrong"],
  "typos count as guesses": [{ "assets/lab-tools.js": [['if (k === "look" || k === "help" || k === "error") return false;', 'if (k === "look" || k === "help") return false;']] }, ["judge"], "typo counted"],
  "reset does nothing": [{ "assets/runner.js": [["m = M.clone(snap.m);", "m = m;"]] }, ["reset"], "reset did not"],
  "the reading setting is forgotten": [{ "assets/reading.js": [["try { localStorage.setItem(KEY, v); }", "try { }"]] }, ["reading"], "did not survive"],
  "desk controls need WebGL": [{ "assets/bench.js": [["opts.controls().forEach(c => {", "(handle ? opts.controls() : []).forEach(c => {"]] }, ["nogl"], "controls are missing"],
  "Explorer cannot be brought back": [{ "assets/desktop.js": [["M.startShell(mm);", "/* planted */"]] }, ["shell"], "did not bring the taskbar back"],
  "rung 3 strikes too few": [{ "assets/runner.js": [["wrongs.slice(0, Math.max(0, opts.length - 2))", "wrongs.slice(0, 2)"]] }, ["judge"], "not 4 and 2"]
};

const plant = process.argv.includes("--plant");
if (!plant) {
  const f = await run();
  if (f.length) { console.log("FAIL\n  " + f.join("\n  ")); process.exit(1); }
  console.log("PASS — six jobs played end to end; red stays red; ladder 3/4/5/8; judge; reset; shell; blue screen; reading; no-GL");
} else {
  let bad = 0;
  for (const [name, [rw, only, expect]] of Object.entries(PLANTS)) {
    const f = await run(rw, only);
    const hit = f.filter((x) => x.indexOf(expect) >= 0)[0];
    if (hit) console.log("caught   " + name + "  →  " + hit);
    else { console.log("MISSED   " + name + (f.length ? "  (other: " + f[0] + ")" : "")); bad++; }
  }
  if (bad) { console.log(bad + " plant(s) not caught"); process.exit(1); }
  console.log("every plant caught (" + Object.keys(PLANTS).length + ")");
}
