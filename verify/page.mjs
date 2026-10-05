/* =====================================================================
   verify/page.mjs — drives the real laptop in Chromium, the way a
   student would: sign in, Help Desk, remote sessions, typing, Mason,
   the walk-over.

     node verify/page.mjs           every check
     node verify/page.mjs --plant   every planted defect must be CAUGHT
     ONLY=WALK node verify/page.mjs --plant      one plant

   Written and reachable are different claims: the logic checks prove the
   tickets exist and solve; only driving the page proves a student can.

     LOAD      sign-in refuses a wrong password; twenty-four tickets,
               labelled crawl (4), walk (4) and run (16); no page errors
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
     MALWARE   M1 (the Malware sim) finishes by doing ONLY what Mason rings,
               across seven PCs, remote sessions and walk-overs, with no
               wrong moves; before it is assigned its crawl starts at step 1
     MALRUN    M2 (the walk) and M6 (run, a PC and the file server) close
               through the UI alone, doing CompTIA's steps the way a student
               would, with no wrong moves; M3-M5's malware tops Task Manager
               on the right PC
     MAIL      E1 (the Email Threat sim) finishes by doing ONLY what Mason
               rings, pointing at links without opening them; E4 (an email
               that can't be forwarded) closes through the UI alone: the
               headers on Farah's PC, reports, purges, blocks, the policy
     EXAM      Exam Practice: each sim's own exam view, laid out as the
               sim is (the malware map refuses Submit until every device
               is inspected, and Reset keeps the inspections; the inbox
               shows a disguised link's real destination and a Reply-To);
               sim, completes with the right answers through the UI; a wrong
               pick is marked three ways and stays after a redraw; Reset
               clears the marks; the way of working (Guided, Checklist, On
               my own) is kept
     CINE      the walk-over plays as a cutscene (letterbox bars, a caption)
               and drops it at the desk; reduced motion cuts straight there
   ===================================================================== */
import { serve, browser } from "./serve.mjs";
import path from "node:path"; import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INC = { L1: "INC20410", L2: "INC20411", L4: "INC20413", D1: "INC20416", D4: "INC20419", D5: "INC20420", M1: "INC20422", M2: "INC20423", M3: "INC20424", M4: "INC20425", M5: "INC20426", M6: "INC20427", E1: "INC20428", E2: "INC20429", E4: "INC20431", R1: "INC20434", R3: "INC20436", R4: "INC20437", W1: "INC20440", W3: "INC20442", P1: "INC20446", P3: "INC20448", N1: "INC20452", N4: "INC20455", WR1: "INC20458", WR4: "INC20461", CE1: "INC20464", CE3: "INC20466", CR3: "INC20472", X1: "INC20476", X2: "INC20477", X5: "INC20480", MB1: "INC20482", MB5: "INC20486", OI1: "INC20488" };
const NOTES = {
  OI1: "Vendor's drive was MBR and the PC boots UEFI, which needs GPT: Setup refused it. Deleted the vendor partition and installed Windows 11 Pro (digital licence, no key) to the unallocated space. Named it WS3-DEV, local account, joined the RAFIKI domain from System Properties, restarted. Dev signed in.",
  MB1: "Weather Live topped the Battery page at 52% in the background, with location Allow all the time and Unrestricted battery. Set location to Allow only while using the app and background battery to Restricted. The Battery page now shows about 23 hours.",
  X1: "Restored Q3-budget.xlsx from the 3 October 11:58 previous version, from a restore point. Set up File History to \\\\FS01\\Backups, every hour, turned it on, and tested it: her file is in Restore personal files.",
  R1: "Replaced the default admin password from the sticker with a strong one on Administration, saved it, and restarted the router. Leah's laptop and printer still connect.",
  W1: "Set MainOffice1 with the new password, WPA3 because every device supports it, 2.4 GHz for the thick walls, channel 6. Saved and restarted; the Office 3 tablet connects.",
  WR1: "The microwave on the break counter sat beside the access point and drowned 2.4 GHz at lunch. Moved it across the room, then set 2.4 GHz for the dense walls, channel 11 and WPA3. Saved, restarted, all connected.",
  CE1: "Her phone was on IMAP with SSL but port 100, where nothing listens. She changed the port to 993, IMAP over SSL/TLS; I synced her phone in Mobile devices and it works.",
  CR3: "Ana's new Wi-Fi password was typed but never saved, so the power cut restart loaded the old one. She typed it, pressed Save, then restarted; checked Status.",
  WR4: "Fourteen networks covered channels 1 to 11, so no clear 2.4 GHz channel was left. Set 5 GHz on fixed channel 149 with WPA3. Saved and restarted; everyone is fine.",
  N1: "Router 3: HomeWiFi with the password, WPA3, 20 MHz to keep interference down, MAC filtering with the family's four devices allowed, and channel 11 because Router 1 and 2 use 1 and 6. Saved and restarted.",
  N4: "Turned MAC filtering off so the grandchildren's devices can join with the password; kept HomeWiFi, WPA3, 20 MHz and channel 11. Saved and restarted; the visitors connect.",
  P1: "Forwarded TCP 3389 (Remote Desktop) to the Windows PC on the LAN at 192.168.10.20. Alex moved the console to the screened subnet port and I set it as the screened host. Wi-Fi from WEP to WPA2. Saved, restarted, both tested.",
  P3: "Forwarded TCP 22 for SSH to the Linux server on the LAN at 192.168.1.20. The console is in the screened subnet as the screened host. Wi-Fi from WEP to WPA2. Saved, restarted, both tested.",
  W3: "Conference AP: Conference-5G with its password, WPA3, 5 GHz for its many clear channels with 25 laptops in one open room, channel 36. Saved and restarted; meetings are quick.",
  R3: "Status said no cable in the INTERNET port. Marcus found the modem cable in yellow LAN port 1 and moved it to the blue INTERNET port; the globe went green and the card machine is back.",
  R4: "Daniel typed the new Wi-Fi password but never saved it, so the router kept the old one. Entered Blue-Harbor#88, saved and restarted; his laptop and TV rejoined with it.",
  L1: "Testing said MSVCP100.dll was missing. Reinstalled Testing from Software Center. Tested: it opens.",
  L2: "PayWise said VCRUNTIME140.dll was missing. Reinstalled PayWise from Software Center. Tested: it opens.",
  L4: "Testing gave a configuration error: config.ini was damaged. Reinstalled Testing, which rewrote the file, and tested it.",
  D1: "Event 2190: Testing failed on MSVCP100.dll. The System32 copy is 64-bit and gave 0xc000007b, so I removed it. Installed the x86 Visual C++ 2010 runtime from FS01. Tested: it opens.",
  E1: "John's Microsoft email was phishing: reported and purged. Dev's 3x Faster was a malicious download: reported, purged, blocked. Rosa's diet email was spam: junk. Farah's statement was legit: told her it is genuine.",
  E4: "Farah's gift card email from Mason came from rafiki-lt.com with a Gmail reply-to; the headers show SPF and DMARC failed. Phishing: reported, purged, blocked, external tag policy on. Dev's course genuine, John's chairs spam, Brenda's bonus .exe malicious.",
  M1: "Checked all seven PCs. SCVHOST.exe (PDF Pro Updater) on WS2 had spread to FS01, the file server. Quarantined both by unplugging them, disabled System Restore on WS2, updated definitions from USB, ran a Defender Offline scan, scheduled scans, updates, a new restore point. Advised Brenda to use Software Center."
};
const GROUPS = ["LOAD", "CRAWL", "WALK", "RUN", "RED", "NOTE", "REVERT", "DROP", "WALKOVER", "PERSIST", "MALWARE", "CINE", "MALRUN", "MAIL", "EXAM", "ROUTER", "WIFI", "PF", "NR", "WR", "CHAT", "EXTRA", "BACKUP", "MOBILE", "INSTALL", "INSTRUCTOR"];

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
    try { p = await page(); await fn(p); } catch (e) { if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT }).catch(() => {}); F(name + ": the page could not be driven — " + String(e.message).split("\n").filter((l, i) => !i || /waiting for/.test(l)).slice(0, 2).join(" · ")); }
    if (p) { p.errs.forEach((e) => F(name + ": page error — " + e)); await p.close(); }
  }
  /* follow Mason's rings and nothing else, to the end of a crawl */
  const VALS = { W1: { "rt-ssid": "MainOffice1", "rt-wpass": "Ma50n1SB35t!", "rt-sec": "WPA3", "rt-band": "2.4", "rt-chan": "6", "wb-pass": "Clos3t-AP-2026" },
    WR1: { "rt-band": "2.4", "rt-chan": "11", "rt-sec": "WPA3", "wb-pass": "Clos3t-AP-2026" },
    N1: { "rt-ssid": "HomeWiFi", "rt-wpass": "MyCCR0ck2!", "rt-sec": "WPA3", "rt-chan": "11", "rt-width": "20" },
    X1: { "fh-loc-WS4": "\\\\FS01\\Backups", "fh-every-WS4": "60" },
    OI1: { "oobe-name-WS3": "WS3-DEV", "oobe-local-WS3": "benchtech", "oobe-lpass-WS3": "Bench-Local-26", "cn-dom-WS3": "RAFIKI", "cn-u-WS3": "RAFIKI\\itadmin", "cn-p-WS3": "Bench-Tech-2026" },
    MB1: { "ph-loc": "Allow only while using the app", "ph-bat": "Restricted" },
    P1: { "rt-fe": "3389", "rt-fi": "192.168.10.20", "rt-fq": "3389", "rt-dmz": "10.100.0.50", "rt-sec": "WPA2" } };
  async function crawl(p, id, max) {
    await take(p, id).catch(() => {});
    for (let i = 0; i < (max || 70); i++) {
      await p.waitForTimeout(300);
      const head = (await p.locator(".coach-now").innerText().catch(() => "")).split("\n")[0];
      if (/done/i.test(head)) return true;
      const t = p.locator(".coach-target");
      /* mid-walk there is nothing to press: wait for the desk, or the laptop */
      if (!(await t.count()) && (await p.locator(".walkover").count())) await p.waitForFunction(() => document.querySelector(".coach-target") || document.querySelector(".wo-desk") || !document.querySelector(".walkover"), null, { timeout: 90000 }).catch(() => {});
      if (!(await t.count())) { await p.waitForTimeout(2600); if (!(await t.count())) return false; }
      const tag = await t.first().evaluate((e) => e.tagName + "." + e.className + " " + (e.getAttribute("aria-label") || ""));
      /* a chat step: send the reply Mason is walking them to */
      if (/cc-opts/.test(tag)) { await p.evaluate(() => { const E = window.__LAP.engine, t = E.ticket(), c = E.fleet().TECH.chats[t.id], lab = t.chat[c.step].right.label; const b = Array.from(document.querySelectorAll("[data-win=custchat] .cc-opts .opt2")).filter((x) => x.querySelector(".ol").textContent === lab)[0]; if (b) b.click(); }); continue; }
      if (/^A\.mx-link/.test(tag)) { await t.first().hover(); await p.waitForTimeout(150); continue; }
      if (/^INPUT/.test(tag) && /mxa-/.test(await t.first().getAttribute("id") || "")) { await t.first().fill(await p.locator(".coach-cmd").innerText()); await t.first().press("Enter"); continue; }
      if (/TEXTAREA/.test(tag)) { await t.first().fill(NOTES[id]); await p.getByRole("button", { name: "Close the ticket" }).click(); continue; }
      if (/DIV/.test(tag) && /opts/.test(tag)) { const right = await p.evaluate(() => window.__LAP.engine.ticket().close.options.find((o) => o.correct).label); await p.locator(".opt2", { hasText: right }).first().click(); continue; }
      if (/con-in/.test(tag)) { const cmd = await p.locator(".coach-cmd").innerText(); await t.first().fill(cmd); await t.first().press("Enter"); continue; }
      if (/^(checkbox|radio)$/.test(await t.first().evaluate((e) => e.type || ""))) { await t.first().click(); continue; }
      if (/fp-mw/.test(tag)) { await t.first().focus(); for (let k = 0; k < 5; k++) await p.keyboard.press("Shift+ArrowRight"); for (let k = 0; k < 2; k++) await p.keyboard.press("Shift+ArrowDown"); continue; }
      { const wid = await t.first().getAttribute("id") || "", V = VALS[id] || {}; if (V[wid] != null) { if (/^SELECT/.test(tag)) await t.first().selectOption(V[wid]); else { await t.first().fill(V[wid]); await t.first().dispatchEvent("change"); } continue; } }
      if (/^INPUT/.test(tag) && /^rt-a/.test(await t.first().getAttribute("id") || "")) { const i = await t.first().getAttribute("id"); await t.first().fill(i === "rt-acur" ? "admin" : "Brooks#Ledger-2026"); await t.first().dispatchEvent("change"); continue; }
      if (/INPUT/.test(tag)) { const c = p.locator(".w-dialog.uac-creds:visible").first(); await c.locator("input").nth(0).fill("RAFIKI\\itadmin"); await c.locator("input").nth(1).fill("Bench-Tech-2026"); await c.getByRole("button", { name: "Yes" }).click(); continue; }
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
      if (items.length !== 79) F("LOAD: the queue shows " + items.length + " tickets, not 79");
      const count = (re) => items.filter((x) => re.test(x)).length;
      if (count(/Crawl: guided/) !== 14 || count(/Walk: checklist/) !== 13 || count(/Run: on your own/) !== 52) F("LOAD: the queue's labels are not 14 crawl, 13 walk, 52 run");
      if (!/Cyber Warrior Program — built by an instructor/.test(await p.locator("footer").innerText())) F("LOAD: the full footer is missing");
    });

    /* Extra training (owner's ruling 11): two headed sections, a worded
       badge with an icon on every ticket, and X1 played end to end. */
    await step("EXTRA", async (p) => {
      await signIn(p);
      const heads = await p.locator(".hd2-q h3.qsec").allInnerTexts();
      if (heads.length !== 2 || !/^Exam sims: from your Core 2 practice sims$/.test(heads[0].trim()) || !/^Extra training: real-world tickets beyond the sims$/.test(heads[1].trim())) F("EXTRA: the queue's two section headings are not as ruled: " + JSON.stringify(heads));
      const order = await p.evaluate(() => Array.from(document.querySelectorAll(".hd2-q h3.qsec, .hd2-q .qi")).map((e) => e.tagName === "H3" ? "H" : (e.querySelector(".badge") ? e.querySelector(".badge").textContent : "NONE")));
      const hx = order.indexOf("H", 1); const sims = order.slice(1, hx), extra = order.slice(hx + 1);
      if (sims.length !== 66 || sims.some((x) => !/^Exam sim · /.test(x))) F("EXTRA: the sims section does not hold 66 tickets each badged Exam sim");
      if (extra.length !== 13 || extra.slice(0, 6).some((x) => x !== "Extra training · Backup and recovery") || extra.slice(6, 12).some((x) => x !== "Extra training · Mobile troubleshooting") || extra[12] !== "Extra training · OS installation") F("EXTRA: the extra-training section is not X1–X6, MB1–MB6 and OI1 badged with their objectives: " + JSON.stringify(extra));
      if (await p.locator(".qi .badge").evaluateAll((bs) => bs.some((b) => !b.querySelector("svg.ico")))) F("EXTRA: a badge has no icon");
      await p.locator(".hd2-jb", { hasText: "Extra training" }).click();
      if (!(await p.locator(".qi", { hasText: INC.X1 }).isVisible())) F("EXTRA: Jump to Extra training does not bring X1 into view");
      if (!(await crawl(p, "X1"))) F("EXTRA: X1 could not be finished by following Mason's rings");
      else {
        const st = await p.evaluate(() => window.__LAP.engine.state().tickets.X1);
        if (st.stage !== "done") F("EXTRA: X1's crawl said done but the ticket is not closed");
        if (st.guesses) F("EXTRA: following Mason's rings cost " + st.guesses + " wrong moves");
        if (!/Extra training · Backup and recovery/.test(await hd(p).locator(".hd2-t").innerText())) F("EXTRA: the ticket page does not name its objective");
      }
    });

    /* X2 (the walk) through the screens, with a wrong move and a revert;
       X5 through System Restore's restart and a reconnect */
    await step("BACKUP", async (p) => {
      await signIn(p); await take(p, "X2"); const r3 = await connect(p, "WS3");
      const fhb = (n) => r3.locator(".filehist .ev-nav button", { hasText: n });
      await tool(r3, "files", "Open File Explorer"); await r3.getByRole("button", { name: "Folder Documents" }).click(); await r3.getByRole("button", { name: "File deploy.yml" }).click();
      await r3.getByRole("button", { name: "Open deploy.yml" }).click(); await r3.locator(".w-dialog").getByRole("button", { name: "Close" }).click();
      await tool(r3, "file history", "Open File History"); await fhb("Restore personal files").click();
      await r3.getByRole("button", { name: "Show the older backup" }).click(); await r3.getByRole("button", { name: "Show the older backup" }).click();
      if (!/Backup from 1 October 2026 17:00/.test(await r3.locator(".fh-nav").innerText())) F("BACKUP: Older backup did not step back to 1 October");
      await r3.locator(".filehist .ev-row", { hasText: "deploy.yml" }).click();
      await r3.getByRole("button", { name: "Open the backed-up copy of deploy.yml" }).click(); await r3.locator(".w-dialog").getByRole("button", { name: "Close" }).click();
      await r3.getByRole("button", { name: "Restore deploy.yml to its original location" }).click();
      await r3.locator(".w-dialog.replace").getByRole("button", { name: "Replace the file in the destination" }).click(); await p.waitForTimeout(150);
      if ((await guesses(p)) !== 1) F("BACKUP: restoring over today's deploy.yml was not counted");
      if (!/this morning's work is gone/.test(await hd(p).locator(".say").innerText().catch(() => ""))) F("BACKUP: the overwrite was not explained");
      await p.locator('[data-win="rdp:WS3"]').getByRole("button", { name: "Revert to snapshot" }).click(); await p.waitForTimeout(300);
      if ((await p.evaluate(() => window.__LAP.engine.machine("WS3").fs["c:\\users\\dev\\documents"].files.find((f) => f.name === "deploy.yml").doc.id)) !== "y240") F("BACKUP: revert did not put today's deploy.yml back");
      await tool(r3, "file history", "Open File History"); await fhb("Restore personal files").click();
      await r3.getByRole("button", { name: "Show the older backup" }).click(); await r3.getByRole("button", { name: "Show the older backup" }).click();
      await r3.locator(".filehist .ev-row", { hasText: "deploy.yml" }).click();
      await r3.getByRole("button", { name: "Restore a copy of deploy.yml to another folder" }).click();
      await r3.getByRole("button", { name: "Restore a copy to Desktop" }).click(); await p.waitForTimeout(150);
      await tool(r3, "files", "Open File Explorer"); await r3.getByRole("button", { name: "Folder Desktop" }).click(); await r3.getByRole("button", { name: "File deploy.yml" }).click();
      await r3.getByRole("button", { name: "Open deploy.yml" }).click(); await p.waitForTimeout(150);
      if (!/2\.3\.1/.test(await r3.locator(".w-dialog").innerText())) F("BACKUP: the Desktop copy is not the hotfix version");
      await r3.locator(".w-dialog").getByRole("button", { name: "Close" }).click();
      const st2 = await p.evaluate(() => { const E = window.__LAP.engine; return { stage: E.ticket().stage(E.fleet()), g: E.T().guesses }; });
      if (st2.stage !== "done" || st2.g !== 1) F("BACKUP: X2 is not done with exactly one wrong move: " + JSON.stringify(st2));
      const did = await p.locator(".coach-list li.did").count(); if (did < 6) F("BACKUP: X2's checklist ticked only " + did + " of its first six items");
      /* X5 */
      await p.evaluate(() => window.__LAP.openWin("helpdesk")); await take(p, "X5"); const r2 = await connect(p, "WS2");
      await r2.getByRole("button", { name: "Open the ScanEasy shortcut on the desktop" }).click(); await p.waitForTimeout(150);
      if (!/sedrv30\.dll/.test(await r2.locator(".w-dialog").innerText())) F("BACKUP: ScanEasy's crash doesn't name the driver's module");
      await ok(r2);
      await tool(r2, "restore", "Open System Properties"); await r2.getByRole("button", { name: "System Restore…" }).click();
      await r2.getByRole("button", { name: "Restore point: 3 October 2026, Installed ScanEasy Driver 3.0" }).click(); await r2.getByRole("button", { name: "Finish" }).click();
      const c = r2.locator(".w-dialog.uac-creds"); await c.locator("input").nth(0).fill("RAFIKI\\itadmin"); await c.locator("input").nth(1).fill("Bench-Tech-2026"); await c.getByRole("button", { name: "Yes" }).click(); await p.waitForTimeout(300);
      await p.getByRole("button", { name: "Reconnect to WS2-SALES" }).click(); await p.waitForTimeout(1800);
      await r2.getByRole("button", { name: "Open the ScanEasy shortcut on the desktop" }).click(); await p.waitForTimeout(150);
      const st5 = await p.evaluate(() => { const E = window.__LAP.engine; return { stage: E.ticket().stage(E.fleet()), g: E.T().guesses }; });
      if (st5.stage !== "done" || st5.g) F("BACKUP: X5 is not done with no wrong moves after System Restore and a test: " + JSON.stringify(st5));
      await p.evaluate(() => window.__LAP.openWin("helpdesk")); await hd(p).locator("[data-coach=resolve]").click();
      if ((await p.evaluate(() => window.__LAP.engine.T().stage)) !== "close") F("BACKUP: X5's Resolve was refused");
    });

    /* Mobile: MB1 by Mason's rings only; MB5 through the phone's screen,
       with the fake warning tapped (counted) on the way */
    await step("MOBILE", async (p) => {
      await signIn(p);
      if (!(await crawl(p, "MB1"))) F("MOBILE: MB1 could not be finished by following Mason's rings");
      else { const st = await p.evaluate(() => window.__LAP.engine.state().tickets.MB1); if (st.stage !== "done") F("MOBILE: MB1's crawl said done but the ticket is not closed"); if (st.guesses) F("MOBILE: following Mason's rings on MB1 cost " + st.guesses + " wrong moves"); }
      await p.getByRole("button", { name: "Close the walkthrough" }).click().catch(() => {});
      await p.evaluate(() => window.__LAP.openWin("helpdesk")); await take(p, "MB5"); await hd(p).locator("[data-coach=open-mobile]").click(); await p.waitForTimeout(400);
      const m = p.locator("[data-win=mobile]");
      if (!/YOUR PHONE IS INFECTED/.test(await m.locator(".ph-screen").innerText())) F("MOBILE: MB5's fake warning isn't on the lock screen");
      await m.getByRole("button", { name: "Tap the infected warning: clean now" }).click(); await p.waitForTimeout(150);
      if ((await guesses(p)) !== 1) F("MOBILE: tapping the fake cleaner was not counted");
      const ph = (n) => m.getByRole("button", { name: n, exact: true });
      await ph("Settings").click(); await m.locator(".ph-link", { hasText: "Apps" }).first().click();
      await m.getByRole("button", { name: "PDF Scanner Free: app info" }).click();
      if (!/Chrome \(unknown sources\)/.test(await m.locator(".ph-screen").innerText())) F("MOBILE: the app's info doesn't say where it came from");
      await ph("Uninstall PDF Scanner Free").click(); await m.locator(".ph-confirm").getByRole("button", { name: "Uninstall" }).click(); await p.waitForTimeout(150);
      await ph("Back").click(); await ph("Back").click(); await m.locator(".ph-link", { hasText: "Security & privacy" }).click();
      await m.getByRole("button", { name: /^Install unknown apps from Chrome: on/ }).click();
      await ph("Scan with Play Protect").click(); await p.waitForTimeout(150);
      if (!/No harmful apps found/.test(await m.locator(".ph-screen").innerText())) F("MOBILE: Play Protect's clean result isn't shown");
      const st5 = await p.evaluate(() => { const E = window.__LAP.engine; return { stage: E.ticket().stage(E.fleet()), g: E.T().guesses }; });
      if (st5.stage !== "done" || st5.g !== 1) F("MOBILE: MB5 is not done with exactly one wrong move: " + JSON.stringify(st5));
      await p.evaluate(() => window.__LAP.openWin("helpdesk")); await hd(p).locator("[data-coach=resolve]").click();
      if ((await p.evaluate(() => window.__LAP.engine.T().stage)) !== "close") F("MOBILE: MB5's Resolve was refused");
    });

    /* OS installation: OI1 by Mason's rings only, at Dev's desk, from a
       switched-off PC to Dev signed in on the domain. On the way: Setup's
       refusal of the MBR disk is on the screen in words, the finished PC
       is WS3-DEV, Windows 11 Pro, on RAFIKI; then, through the screens, a
       wrong edition is counted and a typo isn't */
    await step("INSTALL", async (p) => {
      await signIn(p);
      if (!(await crawl(p, "OI1", 160))) { if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT }); F("INSTALL: OI1 could not be finished by following Mason's rings (stuck at: " + (await p.locator(".coach-now").innerText().catch(() => "")).split("\n")[0] + ")"); return; }
      const st = await p.evaluate(() => { const E = window.__LAP.engine, m = E.fleet().WS3; return { stage: E.state().tickets.OI1.stage, g: E.state().tickets.OI1.guesses, host: m.host, dom: m.domain, ed: m.edition, mbr: m.events.some((e) => e.kind === "inst-ws-mbr") }; });
      if (st.stage !== "done") F("INSTALL: OI1's crawl said done but the ticket is not closed");
      if (st.g) F("INSTALL: following Mason's rings on OI1 cost " + st.g + " wrong moves");
      if (!st.mbr) F("INSTALL: the crawl never showed Setup refusing the MBR disk");
      if (st.host !== "WS3-DEV" || st.dom !== "RAFIKI" || st.ed !== "Windows 11 Pro") F("INSTALL: the finished PC is " + [st.host, st.dom, st.ed].join(", "));
      /* through the screens, from the start: Setup's words, a typo, a wrong edition */
      await take(p, "OI1"); await p.waitForTimeout(200);
      await p.getByRole("button", { name: /^Walk to Dev's desk/ }).click();
      await p.waitForSelector(".wo-desk", { timeout: 90000 });
      const mon = p.locator(".wo-monitor");
      await p.locator('.wo-hands [data-coach="inst-usb-in"]').click(); await p.locator('.wo-hands [data-coach="power"]').click();
      if (!/Press F2 to enter Setup/.test(await mon.innerText())) F("INSTALL: the firmware's start-up screen doesn't show its keys");
      await mon.getByRole("button", { name: "Press F12 for the Boot Menu" }).click();
      await mon.getByRole("button", { name: "Boot from UEFI: WIN11_24H2 (USB)" }).click();
      await mon.getByRole("button", { name: "Next" }).click();
      await mon.getByRole("button", { name: "Next" }).click();
      if (!/Select the box to confirm/.test(await mon.innerText())) F("INSTALL: Next without ticking the box isn't refused in words");
      await mon.locator('[id^="ws-agree-"]').check(); await mon.getByRole("button", { name: "Next" }).click();
      await mon.locator('[id^="ws-key-"]').fill("ABCDE"); await mon.getByRole("button", { name: "Next" }).click();
      if (!/didn't work/.test(await mon.innerText())) F("INSTALL: a mistyped product key isn't refused in words");
      if ((await guesses(p)) !== 0) F("INSTALL: a typo or an unticked box was counted as a wrong move");
      await mon.getByRole("button", { name: "I don't have a product key" }).click();
      await mon.getByRole("radio", { name: "Windows 11 Home", exact: true }).click(); await mon.getByRole("button", { name: "Next" }).click();
      if ((await guesses(p)) !== 1) F("INSTALL: choosing Home on a Pro-licensed PC was not counted");
      await mon.getByRole("button", { name: "Accept" }).click();
      await mon.locator(".ws-part").first().click(); await mon.getByRole("button", { name: "Install Windows on the selected location" }).click();
      if (!/MBR partition style/.test(await mon.locator(".ins-err").innerText())) F("INSTALL: Setup's refusal of the MBR disk isn't on the screen in words");
    });

    /* Instructor mode shows the answer on every ticket page; every ticket
       must draw, whether or not it has been started, with no script error
       (a not-yet-started phone ticket once blanked the whole Help Desk) */
    await step("INSTRUCTOR", async (p) => {
      await signIn(p);
      await p.locator(".tb", { hasText: "Settings" }).click(); await p.locator("#instructorBtn").click(); await p.locator("#pin-in").fill("3693"); await p.locator("#pin-in").press("Enter"); await p.waitForTimeout(200);
      await take(p, "X5"); await p.waitForTimeout(200);
      const n = await p.locator(".qi").count(); let bad = [];
      for (let i = 0; i < n; i++) {
        await p.locator(".qi").nth(i).click();
        const ok = await p.evaluate(() => { const t = document.querySelector("[data-win=helpdesk] .hd2-t"), ins = t && t.querySelector(".ins"); return !!(ins && /Fix: \S/.test(ins.textContent)); });
        if (!ok) bad.push(i);
      }
      if (bad.length) F("INSTRUCTOR: " + bad.length + " ticket pages did not draw with the instructor's fix (queue positions " + bad.slice(0, 8).join(", ") + ")");
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

    await step("MALWARE", async (p) => {
      p.setDefaultTimeout(30000); await p.emulateMedia({ reducedMotion: "reduce" });
      await signIn(p); await p.locator(".qi", { hasText: INC.M1 }).click(); await p.waitForTimeout(500);
      const head = (await p.locator(".coach-now").innerText().catch(() => "")).split("\n")[0];
      if (!/Step 1 of/i.test(head)) F("MALWARE: before it is assigned, M1's crawl is not at step 1 (" + head + ")");
      if (!(await crawl(p, "M1", 260))) { F("MALWARE: M1 could not be finished by following Mason's rings (stuck at: " + (await p.locator(".coach-now").innerText().catch(() => "")).split("\n")[0] + ")"); return; }
      const st = await p.evaluate(() => window.__LAP.engine.state().tickets.M1);
      if (st.stage !== "done") F("MALWARE: M1's crawl said done but the ticket is not closed");
      if (st.guesses) F("MALWARE: following Mason's rings cost " + st.guesses + " wrong move(s)");
    });

    await step("CINE", async (p) => {
      p.setDefaultTimeout(120000);
      await signIn(p); await take(p, "L4");
      await p.evaluate(() => window.__LAP.walkOver("WS5"));
      await p.waitForFunction(() => window.__LAP.wo() && window.__LAP.wo().office(), null, { timeout: 120000 }).catch(() => {});
      await p.waitForTimeout(400);
      const during = await p.evaluate(() => { const o = document.querySelector(".walkover"); const bar = o && o.querySelector(".cine-top"); return { on: !!(o && o.classList.contains("cine-on")), cap: (document.querySelector(".cine-t") || {}).textContent || "", bar: bar ? bar.getBoundingClientRect().height : 0, desk: !!document.querySelector(".wo-desk") }; });
      if (!during.desk && (!during.on || !during.cap)) F("CINE: the walk is not framed as a cutscene (no letterbox bars or caption)");
      await p.waitForSelector(".wo-desk", { timeout: 180000 });
      await p.waitForTimeout(700);
      const after = await p.evaluate(() => ({ on: document.querySelector(".walkover").classList.contains("cine-on"), fade: !!document.querySelector(".cine-fade.on") }));
      if (after.on || after.fade) F("CINE: at the desk the cutscene's bars or fade are still over the screen");
      await p.getByRole("button", { name: "Walk back to your desk" }).click(); await p.waitForSelector(".walkover", { state: "detached", timeout: 180000 });
      /* reduced motion: a plain cut, no bars, no fade */
      await p.emulateMedia({ reducedMotion: "reduce" });
      await p.evaluate(() => window.__LAP.walkOver("WS5")); await p.waitForSelector(".wo-desk", { timeout: 120000 }); await p.waitForTimeout(300);
      const cut = await p.evaluate(() => ({ on: document.querySelector(".walkover").classList.contains("cine-on"), fade: !!document.querySelector(".cine-fade.on") }));
      if (cut.on || cut.fade) F("CINE: with reduced motion the cutscene's bars or fade still show");
    });

    /* CompTIA's steps through the laptop, as a student does them */
    async function uacOK(scope) { const c = scope.locator(".w-dialog.uac-creds"); await c.locator("input").nth(0).fill("RAFIKI\\itadmin"); await c.locator("input").nth(1).fill("Bench-Tech-2026"); await c.getByRole("button", { name: "Yes" }).click(); await scope.page().waitForTimeout(150); }
    async function okAll(scope) { for (let i = 0; i < 3; i++) { const d = scope.locator(".w-dialog button", { hasText: /^OK$/ }); if (!(await d.count())) return; await d.first().click(); } }
    async function startApp(scope, q, name) { await okAll(scope); await scope.getByRole("button", { name: "Start menu" }).click(); await scope.locator(".sm-search").fill(q); await scope.getByRole("button", { name }).click(); await scope.page().waitForTimeout(150); }
    async function checkAll(p, id) {
      for (const d of ["WS1", "WS2", "WS3", "WS4", "WS5", "FS01", "MAIL01"]) {
        await p.evaluate(() => window.__LAP.openWin("helpdesk")); await hd(p).locator("[data-coach=dev-connect-" + d + "]").click(); await p.waitForTimeout(1700);
        const r = p.locator(`[data-win="rdp:${d}"]`);
        await startApp(r, "task", "Open Task Manager"); await startApp(r, "event", "Open Event Viewer"); await r.getByRole("button", { name: /^System$/ }).click();
        if (d === id) await startApp(r, "browser", "Open Microsoft Edge");
        await r.getByRole("button", { name: "Disconnect" }).click();
      }
    }
    async function cleanAtDesk(p, d) {
      await p.evaluate(() => window.__LAP.openWin("helpdesk")); await hd(p).locator("[data-coach=dev-walk-" + d + "]").click();
      await p.locator(".wo-skip").click().catch(() => {}); await p.waitForSelector(".wo-desk");
      const mon = p.locator(".wo-monitor"), server = /FS01|MAIL01/.test(d);
      await p.getByRole("button", { name: "Check the network cable" }).click(); await p.getByRole("button", { name: /^Unplug/ }).click();
      if (!server) { await startApp(mon, "restore", "Open System Properties"); await mon.getByRole("button", { name: /Disable system protection/ }).click(); await uacOK(mon); }
      await p.getByRole("button", { name: /Plug in the USB stick/ }).click();
      await startApp(mon, "files", "Open File Explorer"); await mon.getByRole("button", { name: /Go to the USB drive/ }).click(); await mon.getByRole("button", { name: "File mpam-fe.exe" }).click(); await mon.getByRole("button", { name: "Open mpam-fe.exe" }).click(); await uacOK(mon);
      await startApp(mon, "defender", "Open Windows Security"); await mon.getByRole("button", { name: /Offline scan now/ }).click(); await uacOK(mon);
      await startApp(mon, "defender", "Open Windows Security"); await mon.getByRole("button", { name: /Turn on \(every day/ }).click(); await uacOK(mon);
      await p.getByRole("button", { name: "Check the network cable" }).click(); await p.getByRole("button", { name: /Plug .*back in/ }).click();
      await startApp(mon, "update", "Open Windows Update"); await mon.getByRole("button", { name: "Check for updates" }).click();
      if (!server) { await startApp(mon, "restore", "Open System Properties"); await mon.getByRole("button", { name: /Turn on system protection/ }).click(); await uacOK(mon); await okAll(mon); await mon.getByRole("button", { name: /Create a restore point/ }).click(); await mon.getByRole("button", { name: "Create", exact: true }).click(); await uacOK(mon); }
      await p.getByRole("button", { name: "Walk back to your desk" }).click(); await p.waitForSelector(".walkover", { state: "detached" });
    }
    async function playMalware(p, id, note) {
      await take(p, id);
      const t = await p.evaluate(() => { const t = window.__LAP.engine.ticket(); return { machine: t.machine, infects: t.infects, right: t.close.options.find((o) => o.correct).label }; });
      await checkAll(p, t.machine);
      for (const d of t.infects) await cleanAtDesk(p, d);
      await p.evaluate(() => window.__LAP.openWin("helpdesk")); await hd(p).locator("[data-coach=resolve]").click();
      if (!(await hd(p).locator(".opt2").count())) { F("MALRUN: " + id + " would not resolve after CompTIA's steps (" + (await p.evaluate(() => window.__LAP.engine.T().lastSay)) + ")"); return; }
      await hd(p).locator(".opt2", { hasText: t.right }).click(); await hd(p).locator("#res-note").fill(note); await hd(p).getByRole("button", { name: "Close the ticket" }).click();
      const st = await p.evaluate((id) => window.__LAP.engine.state().tickets[id], id);
      if (st.stage !== "done") F("MALRUN: " + id + " did not close");
      if (st.guesses) F("MALRUN: CompTIA's steps in order cost " + st.guesses + " wrong move(s) on " + id + ": " + st.says.filter(Boolean).join(" | "));
    }
    await step("MALRUN", async (p) => {
      p.setDefaultTimeout(30000); await p.emulateMedia({ reducedMotion: "reduce" });
      await signIn(p);
      await playMalware(p, "M2", "Checked all seven PCs. SpeedBoostPro.exe on WS1 from the 3x faster email. Unplugged to quarantine, System Restore off, USB definitions, Defender Offline scan, schedule, updates, restore point. Told John not to install from email links.");
      const done = await p.locator(".coach-now").innerText().catch(() => "");
      if (!/done/i.test(done)) F("MALRUN: M2's walk checklist did not reach Done when the ticket closed");
      await p.getByRole("button", { name: "Close the checklist" }).click().catch(() => {});
      await playMalware(p, "M6", "Checked all seven PCs. The invoice xlsm macro Farah enabled dropped OfficeUpdate.exe on WS4 and FS01, the file server. Quarantined both, restore off on WS4, USB definitions, Defender Offline scan, schedule, updates, restore point. Told Farah about macros.");
      for (const [id, mach, desc] of [["M3", "WS5", "Search Helper"], ["M4", "WS3", "WMI Provider Host"], ["M5", "WS4", "PC Defender Pro"]]) {
        await p.evaluate(() => window.__LAP.openWin("helpdesk")); await take(p, id);
        await hd(p).locator("[data-coach=dev-connect-" + mach + "]").click(); await p.waitForTimeout(1700);
        const r = p.locator(`[data-win="rdp:${mach}"]`); await startApp(r, "task", "Open Task Manager");
        await r.getByRole("button", { name: /Sort by .*CPU/ }).click();
        const top = await r.locator("tbody tr").first().innerText();
        if (top.indexOf(desc) < 0) F("MALRUN: on " + id + ", the top of " + mach + "'s CPU column is not the malware (" + top.split("\t")[0] + ")");
        await r.getByRole("button", { name: "Disconnect" }).click();
      }
    });

    /* the email tickets through the UI, the way a student does them */
    async function playMail(p, id) {
      await take(p, id);
      const t = await p.evaluate(() => { const t = window.__LAP.engine.ticket(); return { mails: t.mails.map((e) => ({ id: e.id, to: e.to, cat: e.cat, subject: e.subject, from: e.from[1], noForward: !!e.noForward, guard: e.guard, blockDom: e.blockDom, tell: e.tell.options.find((o) => o.correct).label })), right: t.close.options.find((o) => o.correct).label }; });
      const CAT = { legit: "Legitimate", spam: "Spam", phishing: "Phishing", malicious: "Malicious" };
      for (const e of t.mails) {
        let box;
        if (e.noForward) {
          await p.evaluate(() => window.__LAP.openWin("helpdesk")); await hd(p).locator("[data-coach=dev-connect-" + e.to + "]").click(); await p.waitForTimeout(1700);
          box = p.locator(`[data-win="rdp:${e.to}"]`); await box.getByRole("button", { name: "Start menu" }).click(); await box.locator(".sm-search").fill("mail"); await box.getByRole("button", { name: "Open Mail" }).click();
        } else { await p.evaluate(() => window.__LAP.openWin("mail")); box = p.locator("[data-win=mail]"); }
        await box.locator(".mx-it", { hasText: e.subject }).first().click();
        if (e.noForward) await box.getByRole("button", { name: /Message details/ }).click();
        await p.evaluate(() => window.__LAP.openWin("helpdesk"));
        const card = hd(p).locator(`.tri-card[data-mail="${e.id}"]`);
        await card.locator(".tri-q").first().getByRole("button", { name: CAT[e.cat], exact: true }).click();
        await card.locator(".tri-q").nth(1).locator(".opt2", { hasText: e.tell }).click();
        if (e.noForward) { await p.evaluate((m) => window.__LAP.openWin("rdp:" + m), e.to); } else await p.evaluate(() => window.__LAP.openWin("mail"));
        await box.locator(".mx-it", { hasText: e.subject }).first().click();
        if (e.cat === "legit") await box.getByRole("button", { name: /it's genuine, go ahead/ }).click();
        else await box.getByRole("button", { name: e.cat === "spam" ? "Report: junk" : "Report: phishing" }).click();
        if (e.noForward) await box.getByRole("button", { name: "Disconnect" }).click();
        if (e.cat === "phishing" || e.cat === "malicious") {
          await p.evaluate(() => window.__LAP.openWin("mailadmin")); const a = p.locator("[data-win=mailadmin]");
          await a.locator("#mxa-q").fill(e.subject.split(" ")[0]); await a.getByRole("button", { name: "Purge \"" + e.subject + "\" from every mailbox" }).click();
          const blocks = [];
          if (e.cat === "malicious") blocks.push(e.from.split("@")[1]);
          if (e.blockDom) blocks.push(e.blockDom);
          for (const d of blocks) { await a.locator("#mxa-block").fill(d); await a.getByRole("button", { name: "Block", exact: true }).click(); }
          if (e.noForward) await a.getByRole("button", { name: new RegExp("^Turn on: ") }).nth(["antispoof", "external", "impersonation"].indexOf(e.guard)).click().catch(async () => { await a.locator(".mxa-pol").nth(["antispoof", "external", "impersonation"].indexOf(e.guard)).getByRole("button").click(); });
        }
      }
      await p.evaluate(() => window.__LAP.openWin("helpdesk")); await hd(p).locator("[data-coach=resolve]").click();
      if (!(await hd(p).locator(".res .opt2").count())) { F("MAIL: " + id + " would not resolve after the right handling (" + (await p.evaluate(() => window.__LAP.engine.T().lastSay)) + ")"); return; }
      await hd(p).locator(".opt2", { hasText: t.right }).click(); await hd(p).locator("#res-note").fill(NOTES[id]); await hd(p).getByRole("button", { name: "Close the ticket" }).click();
      const st = await p.evaluate((id) => window.__LAP.engine.state().tickets[id], id);
      if (st.stage !== "done") F("MAIL: " + id + " did not close");
      if (st.guesses) F("MAIL: the right handling cost " + st.guesses + " wrong move(s) on " + id + ": " + st.says.filter(Boolean).join(" | "));
    }
    await step("MAIL", async (p) => {
      p.setDefaultTimeout(30000); await p.emulateMedia({ reducedMotion: "reduce" });
      await signIn(p); await p.locator(".qi", { hasText: INC.E1 }).click(); await p.waitForTimeout(500);
      const head = (await p.locator(".coach-now").innerText().catch(() => "")).split("\n")[0];
      if (!/Step 1 of/i.test(head)) F("MAIL: before it is assigned, E1's crawl is not at step 1 (" + head + ")");
      if (!(await crawl(p, "E1", 80))) { F("MAIL: E1 could not be finished by following Mason's rings (stuck at: " + (await p.locator(".coach-now").innerText().catch(() => "")).split("\n")[0] + ")"); return; }
      const st = await p.evaluate(() => window.__LAP.engine.state().tickets.E1);
      if (st.stage !== "done" || st.guesses) F("MAIL: E1's crawl ended with the ticket " + st.stage + " and " + st.guesses + " wrong move(s)");
      await p.getByRole("button", { name: "Close the walkthrough" }).click().catch(() => {});
      await playMail(p, "E4");
    });

    await step("ROUTER", async (p) => {
      p.setDefaultTimeout(20000); await signIn(p);
      if (!(await crawl(p, "R1"))) F("ROUTER: R1 could not be finished by following Mason's rings");
      const g1 = await p.evaluate(() => JSON.parse(localStorage.getItem("c2vm.session.v1")).tickets.R1); if (!g1 || g1.stage !== "done" || g1.guesses) F("ROUTER: R1's crawl cost wrong moves, or didn't close");
      const hd = p.locator("[data-win=helpdesk]"), rw = p.locator("[data-win=router]");
      const takeIt = async (re) => { await p.evaluate(() => window.__LAP.openWin("helpdesk")); await hd.getByRole("button", { name: re }).first().click(); await hd.getByRole("button", { name: /^(Assign to me and start|Work it again)$/ }).click(); await p.waitForTimeout(200); await hd.getByRole("button", { name: "Open the 92 Series app" }).click(); await p.waitForTimeout(200); };
      const closeIt = async (id) => { const right = await p.evaluate((i) => window.__LAP.engine.ticket().close.options.find((o) => o.correct).label, id); await hd.locator(".res .opt2", { hasText: right }).first().click(); await hd.locator("#res-note").fill(NOTES[id]); await hd.getByRole("button", { name: "Close the ticket" }).click(); };
      /* R3: the cable, through the customer on the phone */
      await takeIt(/Globe light orange/);
      if (!/No cable detected in the INTERNET port/.test(await rw.innerText())) F("ROUTER: R3's status page doesn't say where the problem is");
      const front = async (id) => p.evaluate((i) => window.__LAP.openWin(i), id);
      await front("helpdesk"); await hd.getByRole("button", { name: /Ask Marcus: Which port/ }).click(); await hd.getByRole("button", { name: /Ask Marcus: Please move/ }).click(); await p.waitForTimeout(200);
      if (!/yellow ones[\s\S]*INTERNET port now/.test(await hd.locator(".call-log").innerText())) F("ROUTER: R3's call doesn't show Marcus's answers");
      if (!/✓ Connected/.test(await rw.innerText())) F("ROUTER: R3's status doesn't show the internet back after the cable moved");
      await front("helpdesk"); await hd.getByRole("button", { name: "Resolve", exact: true }).click(); await closeIt("R3");
      const g3 = await p.evaluate(() => JSON.parse(localStorage.getItem("c2vm.session.v1")).tickets.R3); if (!g3 || g3.stage !== "done" || g3.guesses) F("ROUTER: R3 through the UI cost wrong moves, or didn't close");
      /* R4: a typed change is lost on a restart, and counts; then done right */
      await takeIt(/Changed the Wi-Fi password/); await front("router");
      await rw.getByRole("button", { name: "Wireless", exact: true }).click();
      await rw.locator("#rt-wpass").fill("Blue-Harbor#88"); await rw.locator("#rt-wpass").dispatchEvent("change"); await p.waitForTimeout(150);
      if (!/Not saved/.test(await rw.locator(".rt-state").innerText())) F("ROUTER: a typed change doesn't show as not saved");
      await rw.getByRole("button", { name: /^Restart the router/ }).click(); await p.waitForTimeout(150);
      { const v = await rw.locator("#rt-wpass").inputValue(), tx = await rw.innerText(); if (v !== "Harbor2019!" || !/weren't saved were lost/.test(tx)) F("ROUTER: a restart kept a change that was never saved (" + v + " | " + (tx.match(/The router restarted[^\n]*/) || ["no restart message"])[0] + ")"); }
      if ((await p.evaluate(() => window.__LAP.engine.T().guesses)) !== 1) F("ROUTER: a restart that lost a typed change didn't count");
      await rw.locator("#rt-wpass").fill("Blue-Harbor#88"); await rw.locator("#rt-wpass").dispatchEvent("change");
      await rw.getByRole("button", { name: /^Save: write/ }).click(); await p.waitForTimeout(150);
      if (!/Saved, not running/.test(await rw.locator(".rt-state").innerText())) F("ROUTER: a saved change doesn't show as waiting for a restart");
      await rw.getByRole("button", { name: /^Restart the router/ }).click(); await p.waitForTimeout(150);
      if (!/Running/.test(await rw.locator(".rt-state").innerText())) F("ROUTER: after the restart the bar doesn't say it's running");
      /* the ticket's exam view */
      await front("helpdesk"); await hd.getByRole("button", { name: /^Open Exam Practice at Tier 1 Router Support Scenario/ }).click(); await p.waitForTimeout(300);
      if (!/Tier 1 Router Support · 4/.test(await p.locator("[data-win=exam] .ex-title").innerText())) F("ROUTER: R4's exam link doesn't open its exam view (practice 4)");
      await front("helpdesk"); await hd.getByRole("button", { name: "Resolve", exact: true }).click(); await closeIt("R4");
      const g4 = await p.evaluate(() => JSON.parse(localStorage.getItem("c2vm.session.v1")).tickets.R4); if (!g4 || g4.stage !== "done" || g4.guesses !== 1) F("ROUTER: R4 didn't close, or its count is wrong (" + (g4 && g4.guesses) + ")");
    });

    await step("WIFI", async (p) => {
      p.setDefaultTimeout(20000); await signIn(p);
      if (!(await crawl(p, "W1"))) F("WIFI: W1 could not be finished by following Mason's rings");
      const g1 = await p.evaluate(() => JSON.parse(localStorage.getItem("c2vm.session.v1")).tickets.W1); if (!g1 || g1.stage !== "done" || g1.guesses) F("WIFI: W1's crawl cost wrong moves, or didn't close");
      const hd = p.locator("[data-win=helpdesk]"), bw = p.locator("[data-win=browser]"), front = (id) => p.evaluate((i) => window.__LAP.openWin(i), id);
      await front("helpdesk"); await hd.getByRole("button", { name: /Conference room access point/ }).first().click(); await hd.getByRole("button", { name: "Assign to me and start" }).click();
      await hd.getByRole("button", { name: "Open 192.168.1.1 in the browser" }).click(); await p.waitForTimeout(200);
      const signin = async (pw) => { await bw.locator("#wb-pass").fill(pw); await bw.getByRole("button", { name: "Sign in" }).click(); await p.waitForTimeout(150); };
      await signin("wrong"); if (!/Wrong username or password/.test(await bw.innerText())) F("WIFI: a wrong admin password isn't refused at 192.168.1.1");
      if ((await p.evaluate(() => window.__LAP.engine.T().guesses)) !== 0) F("WIFI: a mistyped sign-in counted as a wrong move");
      await signin("Clos3t-AP-2026");
      const set = async (v) => { await bw.getByRole("button", { name: "Wireless", exact: true }).click(); for (const [k, x] of Object.entries(v)) { const e = bw.locator("#" + k); if ((await e.evaluate((n) => n.tagName)) === "SELECT") await e.selectOption(x); else { await e.fill(x); await e.dispatchEvent("change"); } } await bw.getByRole("button", { name: /^Save: write/ }).click(); await bw.getByRole("button", { name: /^Restart the access point/ }).click(); await p.waitForTimeout(150); await signin("Clos3t-AP-2026"); await bw.getByRole("button", { name: "Status", exact: true }).click(); };
      await set({ "rt-ssid": "Conference-5G", "rt-wpass": "M33t1ng$Room!", "rt-sec": "WPA3", "rt-band": "2.4", "rt-chan": "1" });
      if (!/Connected but crawling/.test(await bw.innerText())) F("WIFI: 25 laptops on 2.4 GHz don't show as crawling");
      await front("helpdesk"); await hd.getByRole("button", { name: "Resolve", exact: true }).click();
      if (!/crawls/.test(await hd.locator(".say").innerText().catch(() => ""))) F("WIFI: Resolve with the meeting crawling didn't say why it isn't done");
      await front("browser"); await set({ "rt-band": "5", "rt-chan": "36" });
      if (/crawling|Not connected/.test(await bw.locator(".rt-page").innerText())) F("WIFI: on 5 GHz the meeting laptops still don't connect cleanly");
      await front("helpdesk"); await hd.getByRole("button", { name: "Resolve", exact: true }).click();
      const right = await p.evaluate(() => window.__LAP.engine.ticket().close.options.find((o) => o.correct).label); await hd.locator(".res .opt2", { hasText: right }).first().click(); await hd.locator("#res-note").fill(NOTES.W3); await hd.getByRole("button", { name: "Close the ticket" }).click();
      const g3 = await p.evaluate(() => JSON.parse(localStorage.getItem("c2vm.session.v1")).tickets.W3); if (!g3 || g3.stage !== "done" || g3.guesses < 1) F("WIFI: W3 didn't close, or its wrong band didn't count (" + (g3 && g3.guesses) + ")");
    });

    await step("PF", async (p) => {
      p.setDefaultTimeout(20000); await signIn(p);
      if (!(await crawl(p, "P1"))) F("PF: P1 could not be finished by following Mason's rings");
      const g1 = await p.evaluate(() => JSON.parse(localStorage.getItem("c2vm.session.v1")).tickets.P1); if (!g1 || g1.stage !== "done" || g1.guesses) F("PF: P1's crawl cost wrong moves, or didn't close");
      const hd = p.locator("[data-win=helpdesk]"), rw = p.locator("[data-win=router]"), front = (id) => p.evaluate((i) => window.__LAP.openWin(i), id);
      const ask = async (re) => { await front("helpdesk"); await hd.getByRole("button", { name: re }).click(); await p.waitForTimeout(120); };
      await front("helpdesk"); await hd.getByRole("button", { name: /SSH to the home server/ }).first().click(); await hd.getByRole("button", { name: "Assign to me and start" }).click();
      await hd.getByRole("button", { name: "Open the 92 Series app" }).click(); await p.waitForTimeout(150);
      /* the wrong way round: the server into the screened subnet counts, and is undone */
      await ask(/Ask Jordan: Please plug the computer into the orange/);
      if ((await p.evaluate(() => window.__LAP.engine.T().guesses)) !== 1 || !/screened subnet: outside the LAN's protection/.test(await hd.locator(".say").innerText())) F("PF: moving the server into the screened subnet didn't count, or didn't say why");
      await ask(/Ask Jordan: Please plug the computer back/); await ask(/Ask Jordan: Please plug the console/);
      await front("router"); await rw.getByRole("button", { name: "Status", exact: true }).click();
      if (!/172\.16\.5\.50[\s\S]*Connected \(cable\)/.test(await rw.locator(".rt-page").innerText())) F("PF: Status doesn't show the console's screened-subnet address");
      await rw.getByRole("button", { name: "Port forwarding", exact: true }).click();
      for (const [k, v] of [["rt-fe", "22"], ["rt-fi", "192.168.1.20"], ["rt-fq", "22"]]) { await rw.locator("#" + k).fill(v); await rw.locator("#" + k).dispatchEvent("change"); }
      await rw.getByRole("button", { name: "Add the forward" }).click(); await rw.locator("#rt-dmz").fill("172.16.5.50"); await rw.locator("#rt-dmz").dispatchEvent("change");
      await rw.getByRole("button", { name: "Wireless", exact: true }).click(); await rw.locator("#rt-sec").selectOption("WPA2");
      await rw.getByRole("button", { name: /^Save: write/ }).click(); await rw.getByRole("button", { name: /^Restart the router/ }).click(); await p.waitForTimeout(150);
      await front("helpdesk"); await hd.getByRole("button", { name: "Resolve", exact: true }).click();
      if (!/hasn't tried it from outside/.test(await hd.locator(".say").innerText())) F("PF: Resolve before the customer tested didn't ask for a test");
      await ask(/Ask Jordan: Try connecting/); await ask(/Ask Jordan: Start an online game/);
      if (!/Connected: I can see the Linux server's desktop[\s\S]*NAT type: Open/.test(await hd.locator(".call-log").innerText())) F("PF: the customer's tests from outside don't show it working");
      await hd.getByRole("button", { name: "Resolve", exact: true }).click();
      const right = await p.evaluate(() => window.__LAP.engine.ticket().close.options.find((o) => o.correct).label); await hd.locator(".res .opt2", { hasText: right }).first().click(); await hd.locator("#res-note").fill(NOTES.P3); await hd.getByRole("button", { name: "Close the ticket" }).click();
      const g3 = await p.evaluate(() => JSON.parse(localStorage.getItem("c2vm.session.v1")).tickets.P3); if (!g3 || g3.stage !== "done" || g3.guesses !== 2) F("PF: P3 didn't close, or its count is wrong (" + (g3 && g3.guesses) + "; want the wrong move and the early Resolve)");
    });

    await step("NR", async (p) => {
      p.setDefaultTimeout(20000); await signIn(p);
      if (!(await crawl(p, "N1"))) F("NR: N1 could not be finished by following Mason's rings");
      const g1 = await p.evaluate(() => JSON.parse(localStorage.getItem("c2vm.session.v1")).tickets.N1); if (!g1 || g1.stage !== "done" || g1.guesses) F("NR: N1's crawl cost wrong moves, or didn't close");
      const hd = p.locator("[data-win=helpdesk]"), rw = p.locator("[data-win=router]"), front = (id) => p.evaluate((i) => window.__LAP.openWin(i), id);
      await front("helpdesk"); await hd.getByRole("button", { name: /grandchildren can't get on/ }).first().click(); await hd.getByRole("button", { name: "Assign to me and start" }).click();
      await hd.getByRole("button", { name: "Open the 92 Series app" }).click(); await p.waitForTimeout(150);
      if (!/✕ Overlapping/.test(await rw.locator(".rt-page").innerText())) F("NR: N4's status doesn't show the overlap with the neighbours");
      /* the street: Router 3's overlap, from what it's running */
      const sv = p.locator("[data-win=street]"), svText = async () => (await sv.locator(".sv-list").innerText()).replace(/\s+/g, " ");
      await front("helpdesk"); await hd.getByRole("button", { name: "Look at the street in 3D" }).click(); await p.waitForTimeout(300);
      if (!/Router 3[^.]*running channel 6 at 40 MHz[^✕✓]*✕ Overlaps Router 1 \(channel 1\) and Router 2 \(channel 6\)/.test(await svText())) F("NR: N4's street doesn't show Router 3 overlapping both neighbours: " + (await svText()).slice(0, 300));
      if ((await sv.locator(".sv-tag").count()) !== 3) F("NR: the street doesn't label all three houses");
      await front("router"); await rw.getByRole("button", { name: "Wireless", exact: true }).click();
      for (const [k, v] of [["rt-ssid", "HomeWiFi"], ["rt-wpass", "MyCCR0ck2!"]]) { await rw.locator("#" + k).fill(v); await rw.locator("#" + k).dispatchEvent("change"); }
      for (const [k, v] of [["rt-sec", "WPA3"], ["rt-chan", "11"], ["rt-width", "20"]]) await rw.locator("#" + k).selectOption(v);
      if (!/✕ Overlaps/.test(await svText())) F("NR: the street shows settings typed but not saved, not what the router is running");
      await rw.getByRole("button", { name: /^Save: write/ }).click(); await rw.getByRole("button", { name: /^Restart the router/ }).click(); await p.waitForTimeout(150);
      if (!/Router 3[^.]*running channel 11 at 20 MHz[^✕✓]*✓ Clear of both neighbours/.test(await svText())) F("NR: after the restart the street doesn't show Router 3 clear on channel 11: " + (await svText()).slice(0, 300));
      await front("router"); await rw.getByRole("button", { name: "Status", exact: true }).click(); await p.waitForTimeout(150);
      const st = await rw.locator(".rt-page").innerText();
      if (!/✓ No overlap/.test(st) || !/Grandchild's tablet[^\n]*✓ Connected/.test(st)) F("NR: after the fix the status doesn't show no overlap and the visitors connected: " + st.replace(/\s+/g, " ").slice(0, 600));
      await front("helpdesk"); await hd.getByRole("button", { name: "Resolve", exact: true }).click();
      const right = await p.evaluate(() => window.__LAP.engine.ticket().close.options.find((o) => o.correct).label); await hd.locator(".res .opt2", { hasText: right }).first().click(); await hd.locator("#res-note").fill(NOTES.N4); await hd.getByRole("button", { name: "Close the ticket" }).click();
      const g4 = await p.evaluate(() => JSON.parse(localStorage.getItem("c2vm.session.v1")).tickets.N4); if (!g4 || g4.stage !== "done" || g4.guesses) F("NR: N4 through the UI cost wrong moves, or didn't close (" + (g4 && g4.guesses) + ")");
    });

    await step("CHAT", async (p) => {
      p.setDefaultTimeout(20000); await signIn(p);
      if (!(await crawl(p, "CE1", 60))) F("CHAT: CE1 could not be finished by following Mason's rings");
      const g1 = await p.evaluate(() => JSON.parse(localStorage.getItem("c2vm.session.v1")).tickets.CE1); if (!g1 || g1.stage !== "done" || g1.guesses) F("CHAT: CE1's crawl cost wrong moves, or didn't close");
      const hd = p.locator("[data-win=helpdesk]"), cc = p.locator("[data-win=custchat]"), rw = p.locator("[data-win=router]"), front = (id) => p.evaluate((i) => window.__LAP.openWin(i), id);
      const right = () => p.evaluate(() => { const E = window.__LAP.engine, t = E.ticket(), c = E.fleet().TECH.chats[t.id]; return t.chat[c.step].right.label; });
      const send = async (lab) => { await p.evaluate((l) => { const b = Array.from(document.querySelectorAll("[data-win=custchat] .cc-opts .opt2")).filter((x) => x.querySelector(".ol").textContent === l)[0]; b.click(); }, lab); await p.waitForTimeout(120); };
      /* CE3: starting again draws a different six */
      await front("helpdesk"); await p.locator(".qi", { hasText: INC.CE3 }).click(); await hd.getByRole("button", { name: "Assign to me and start" }).click();
      await hd.getByRole("button", { name: "Open the customer chat" }).click(); await p.waitForTimeout(200);
      const six = async () => (await cc.locator(".cc-opts .opt2 .ol").allInnerTexts()).join("|");
      const s1 = await six(); await cc.getByRole("button", { name: /^Start the chat again/ }).click(); await p.waitForTimeout(150);
      if ((await cc.locator(".cc-opts .opt2").count()) !== 6) F("CHAT: the chat doesn't show six replies");
      if ((await six()) === s1) F("CHAT: starting the chat again shows the same six replies");
      /* CR3 through the screen: a wrong reply, the hands-on checks, the router */
      await front("helpdesk"); await p.locator(".qi", { hasText: INC.CR3 }).click(); await hd.getByRole("button", { name: "Assign to me and start" }).click();
      await hd.getByRole("button", { name: "Open the customer chat" }).click(); await p.waitForTimeout(200);
      const r0 = await right(), wrongLab = (await cc.locator(".cc-opts .opt2 .ol").allInnerTexts()).filter((x) => x !== r0)[0];
      const reaction = await p.evaluate((l) => window.__LAP.engine.ticket().chat[0].wrong.filter((w) => w.label === l)[0].reaction, wrongLab);
      await send(wrongLab);
      const logTxt = await cc.locator(".cc-log").innerText();
      if (logTxt.indexOf(reaction) < 0) F("CHAT: the customer's reaction to a wrong reply isn't shown");
      if (!/Mood: Frustrated/.test(await cc.locator(".cc-mood").innerText())) F("CHAT: a wrong reply doesn't move Ana's mood on, in words");
      if (!/✕ Ruled out/.test(await cc.locator(".cc-opts").innerText())) F("CHAT: the wrong reply isn't marked ruled out");
      await send(await right()); await send(await right());
      /* the hands-on check: her router's Wireless page */
      if (!(await cc.locator(".cc-wait").count())) F("CHAT: the chat doesn't say Ana is waiting for a check");
      await cc.getByRole("button", { name: "Open the 92 Series app" }).click(); await p.waitForTimeout(200);
      await rw.getByRole("button", { name: "Wireless", exact: true }).click(); await p.waitForTimeout(150);
      await front("custchat"); await send(await right());
      await front("router"); await rw.getByRole("button", { name: "Status", exact: true }).click(); await p.waitForTimeout(150);
      if (!(await p.evaluate(() => { const r = window.__LAP.engine.fleet().TECH.routers.CR3; return r.running.wifi.pass === "Sunflower-Lane-77!" && JSON.stringify(r.saved) === JSON.stringify(r.running); }))) F("CHAT: Ana's router isn't running her new, saved password");
      await front("custchat"); await send(await right());
      if (!/has what they needed/.test(await cc.innerText())) F("CHAT: CR3's chat doesn't finish: " + (await cc.locator(".cc-next").innerText()).slice(0, 200));
      await front("helpdesk"); await hd.getByRole("button", { name: "Resolve", exact: true }).click();
      const rc = await p.evaluate(() => window.__LAP.engine.ticket().close.options.find((o) => o.correct).label); await hd.locator(".res .opt2", { hasText: rc }).first().click(); await hd.locator("#res-note").fill(NOTES.CR3); await hd.getByRole("button", { name: "Close the ticket" }).click();
      const g3 = await p.evaluate(() => JSON.parse(localStorage.getItem("c2vm.session.v1")).tickets.CR3); if (!g3 || g3.stage !== "done" || g3.guesses !== 1) F("CHAT: CR3 through the UI didn't close with exactly its one wrong reply counted (" + (g3 && g3.guesses) + ")");
    });

    await step("WR", async (p) => {
      p.setDefaultTimeout(20000); await signIn(p);
      /* from the desk, the floor plan only shows: the microwave moves with you there */
      /* a window opened before Mason's panel docks (the browser, left open from a Wi-Fi ticket) moves clear of it */
      { const hd0 = p.locator("[data-win=helpdesk]"); await p.evaluate(() => window.__LAP.openWin("helpdesk")); await p.locator(".qi", { hasText: INC.WR4 }).click(); await p.waitForTimeout(150);
        if (await p.locator(".coach").count()) F("WR: (setup) Mason's panel still docked on a run ticket, so the browser can't open full width");
        await p.evaluate(() => { window.__LAP.openWin("browser"); window.__LAP.openWin("helpdesk"); }); await p.locator(".qi", { hasText: INC.WR1 }).click(); await hd0.locator("[data-coach=assign]").click();
        await p.waitForTimeout(150);
        const under = await p.evaluate(() => { const c = document.querySelector(".coach"); if (!c) return ["no panel"]; const cl = c.getBoundingClientRect().left; return [...document.querySelectorAll("[data-win]")].filter((w) => w.offsetParent && !w.classList.contains("min") && w.getBoundingClientRect().right > cl + 1).map((w) => w.dataset.win); });
        if (under.length) F("WR: window(s) left under Mason's panel when it docked: " + under.join(", "));
        await p.locator("[data-win=browser]").getByRole("button", { name: /^Close Browser/ }).click(); await p.evaluate(() => window.__LAP.openWin("helpdesk")); await p.waitForTimeout(100);
        await hd0.locator("[data-coach=open-floor]").click(); await p.waitForTimeout(200); const fw = p.locator("[data-win=floor]");
        const before = await p.evaluate(() => JSON.stringify(window.__LAP.engine.fleet().TECH.routers.WR1.microwave));
        await fw.locator(".fp-mw").focus(); await p.keyboard.press("Shift+ArrowRight"); await p.waitForTimeout(100);
        const after = await p.evaluate(() => JSON.stringify(window.__LAP.engine.fleet().TECH.routers.WR1.microwave));
        if (!(await fw.locator(".fp-mw.locked").count()) || before !== after) F("WR: the microwave can be moved from the desk, without walking to the break room");
        await fw.getByRole("button", { name: /^Close Floor plan/ }).click(); }
      if (!(await crawl(p, "WR1", 90))) F("WR: WR1 could not be finished by following Mason's rings");
      const g1 = await p.evaluate(() => JSON.parse(localStorage.getItem("c2vm.session.v1")).tickets.WR1); if (!g1 || g1.stage !== "done" || g1.guesses) F("WR: WR1's crawl cost wrong moves, or didn't close (" + JSON.stringify(g1 && g1.says) + ")");
      const hd = p.locator("[data-win=helpdesk]"), rw = p.locator("[data-win=router]"), front = (id) => p.evaluate((i) => window.__LAP.openWin(i), id);
      await front("helpdesk"); await hd.getByRole("button", { name: /Fourteen networks and a slow office/ }).first().click(); await hd.getByRole("button", { name: "Assign to me and start" }).click();
      await hd.getByRole("button", { name: "Open the 92 Series app" }).click(); await p.waitForTimeout(150);
      if (!/Connected but crawling: 14 networks nearby/.test(await rw.locator(".rt-page").innerText())) F("WR: WR4's status doesn't show the crawl from the crowded 2.4 GHz band");
      await rw.getByRole("button", { name: "Wireless", exact: true }).click(); await rw.locator("#rt-band").selectOption("5"); await p.waitForTimeout(100); await rw.locator("#rt-chan").selectOption("149"); await rw.locator("#rt-sec").selectOption("WPA3");
      await rw.getByRole("button", { name: /^Save: write/ }).click(); await rw.getByRole("button", { name: /^Restart the router/ }).click(); await rw.getByRole("button", { name: "Status", exact: true }).click(); await p.waitForTimeout(150);
      if (/crawling|Not connected/.test(await rw.locator(".rt-page").innerText())) F("WR: on 5 GHz WR4's devices still crawl or drop");
      await front("helpdesk"); await hd.getByRole("button", { name: "Resolve", exact: true }).click();
      const right = await p.evaluate(() => window.__LAP.engine.ticket().close.options.find((o) => o.correct).label); await hd.locator(".res .opt2", { hasText: right }).first().click(); await hd.locator("#res-note").fill(NOTES.WR4); await hd.getByRole("button", { name: "Close the ticket" }).click();
      const g4 = await p.evaluate(() => JSON.parse(localStorage.getItem("c2vm.session.v1")).tickets.WR4); if (!g4 || g4.stage !== "done" || g4.guesses) F("WR: WR4 through the UI cost wrong moves, or didn't close");
    });

    await step("EXAM", async (p) => {
      p.setDefaultTimeout(20000); await signIn(p);
      await p.evaluate(() => window.__LAP.openWin("exam")); const x = p.locator("[data-win=exam]");
      const views = await p.evaluate(async () => { const m = await import("./assets/exams.js"); const P = await import("./assets/pbq.js"); return m.EXAMS.map((e) => ({ ex: e.id, sim: e.sim, layout: e.layout, v: e.variants[0].id, fields: e.variants[0].fields.map((f) => ({ id: f.id, kind: f.kind, right: P.rightValue(f), wrong: f.kind === "choice" ? f.options.find((o) => !o.correct).label : null })) })); });
      for (const V of views) {
        await x.getByRole("button", { name: new RegExp("^" + V.sim + ": the sim itself") }).click();
        if (V.layout === "map") await x.getByRole("button", { name: /wireless access point: open/ }).click();
        if (V.layout === "houses") { await x.getByRole("button", { name: "Router 2: show its settings" }).click(); if (!/40 MHz/.test(await x.locator(".ex-modal").innerText())) F("EXAM: Router 2 does not show 40 MHz"); await x.getByRole("button", { name: "Router 3: show its settings" }).click(); }
        if (V.layout === "network") {
          /* the network can't be called clean until every device is looked at */
          await x.locator(".ex-net .ex-nb").first().click();
          await x.getByRole("button", { name: /^(Submit|Save settings)$/ }).click();
          if (await x.locator(".ex-done").count() || !/Inspect every device on the network first: 1 of 7/.test(await x.innerText())) F("EXAM: Malware: Submit was allowed before every device was inspected");
          await x.getByRole("button", { name: "Task Manager" }).click();
          if (!/SCVHOST\.exe/.test(await x.locator(".ex-tm").innerText().catch(() => "")) && V.fields[0].id === "FS01") F("EXAM: Malware: the file server's Task Manager does not show the malware");
        }
        for (const f of V.fields) {
          if (V.layout === "diagram") await x.locator(".ex-slot").nth(V.fields.indexOf(f)).click();
          if (V.layout === "inbox") await x.locator(".ex-mlist .ex-nb").nth(V.fields.indexOf(f)).click();
          if (V.layout === "network") await x.locator(".ex-net .ex-nb").nth(V.fields.indexOf(f)).click();
          const box = x.locator('.ex-f[data-field="' + f.id + '"]');
          if (f.kind === "text") await box.locator("input").fill(f.right);
          else await box.locator(".ex-o", { hasText: f.right }).filter({ hasText: new RegExp("^(● )?" + f.right.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$") }).first().click();
        }
        await x.getByRole("button", { name: /^(Submit|Save settings)$/ }).click();
        if (!(await x.locator(".ex-done").count())) F("EXAM: " + V.sim + ": the right answers did not complete it");
        if (V.layout === "network") { await x.getByRole("button", { name: /^Reset this exam view/ }).click(); if (!/Inspected 7 of 7/.test(await x.innerText())) F("EXAM: Malware: Reset threw away the inspections"); }
      }
      /* App Deployment's tabs show their evidence: a command's output, the event log */
      await x.getByRole("button", { name: /^Application Deployment Troubleshooting: the sim itself/ }).click();
      await x.getByRole("button", { name: "Commands", exact: true }).click(); await x.getByRole("button", { name: /^Run: ls "C:\\Windows\\SysWOW64/ }).click();
      if (!/msvcp140\.dll/.test(await x.locator(".ex-log").innerText())) F("EXAM: App Deployment: a command's output is not shown");
      await x.getByRole("button", { name: "Event Viewer", exact: true }).click();
      if (!/2190[\s\S]*Faulting module name: MSVCP100\.dll/.test(await x.locator(".ex-tm").innerText())) F("EXAM: App Deployment: the Event Viewer tab does not show the error entry");
      /* an email's giveaway is on show: where its link really goes, and a Reply-To */
      await x.getByRole("button", { name: /^Email Threat Classification: practice 5/ }).click();
      await x.locator(".ex-mlist .ex-nb").first().click();
      if (!/goes to: https:\/\/rafiki-mail-validate\.example\/login/.test(await x.innerText())) F("EXAM: Email: a disguised link's real destination is not shown");
      await x.getByRole("button", { name: /^Email Threat Classification: practice 4/ }).click();
      await x.locator(".ex-mlist .ex-nb").nth(1).click();
      if (!/Reply-To: mason\.lead\.office@gmail\.com/.test(await x.innerText())) F("EXAM: Email: the Reply-To is not shown");
      /* a wrong pick stays red; Reset clears it; the mode is kept */
      const V = views[3]; await x.getByRole("button", { name: new RegExp("^" + V.sim + ": practice 2") }).click();
      const f0 = await p.evaluate(async () => { const m = await import("./assets/exams.js"); const f = m.EXAMS[3].variants[1].fields[0]; return { id: f.id, wrong: f.options.find((o) => !o.correct).label }; });
      await x.locator('.ex-f[data-field="' + f0.id + '"] .ex-o', { hasText: f0.wrong }).first().click();
      await x.getByRole("button", { name: "Submit" }).click();
      const look = () => x.locator('.ex-f[data-field="' + f0.id + '"] .ex-o.out').first().evaluate((e) => ({ t: e.innerText, sh: getComputedStyle(e).boxShadow })).catch(() => null);
      let w = await look(); if (!w || !/Ruled out/.test(w.t) || !/inset/.test(w.sh)) F("EXAM: a wrong pick is not marked three ways (colour, inset rule, words)");
      await x.getByRole("button", { name: "Checklist" }).click(); w = await look(); if (!w) F("EXAM: the wrong pick did not stay red after a redraw");
      await x.getByRole("button", { name: /^Reset this exam view/ }).click(); if (await look()) F("EXAM: Reset did not clear the red marks");
      await p.reload(); await p.waitForTimeout(300); await signIn(p); await p.evaluate(() => window.__LAP.openWin("exam"));
      if ((await p.locator('[data-win=exam] .ex-modes [aria-pressed="true"]').innerText()) !== "Checklist") F("EXAM: the way of working was not kept");
    });
  } finally { await b.close(); s.close(); }
  return fails;
}

/* [check it must be caught by, what, rewrites of the SERVED files] */
const PLANTS = [
  ["LOAD", "a ticket missing from the queue", { "assets/laptop.js": [["    sc.list.forEach(function (x) {", "    sc.list.slice(1).forEach(function (x) {"]] }],
  ["EXTRA", "badges in colour alone, no words", { "assets/laptop.js": [["b.appendChild(el(\"span\", null, badgeText(t)));", "b.appendChild(el(\"span\", null, \"\"));"]] }],
  ["EXTRA", "extra training mixed into the sims section", { "assets/laptop.js": [["list: all.filter(function (x) { return !x.t.extra; }) }", "list: all.filter(function (x) { return true; }) }"]] }],
  ["EXTRA", "Previous Versions' Restore does nothing", { "assets/backup.js": [["M.putFile(m.fs, dir, Object.assign({}, M.clone(f), { name: p[1] }));", ""]] }],
  ["EXTRA", "turning File History on makes no copy", { "assets/backup.js": [["const r = runNow(m); return", "const r = { text: \"\" }; return"]] }],
  ["BACKUP", "Restore to… ignores the folder chosen", { "assets/backup.js": [["const p = split(path), dir = folder || p[0];", "const p = split(path), dir = p[0];"]] }],
  ["BACKUP", "System Restore doesn't roll the driver back", { "assets/backup.js": [["M.note(m, \"driver-rolled-back\", { app: a.name, driver: a.driverBad.driver }); a.driverBad = null;", ""]] }],
  ["MOBILE", "uninstalling an app leaves it on the phone", { "assets/phone.js": [["a.installed = false; const lost = a.drafts; a.drafts = 0;", "const lost = a.drafts;"]] }],
  ["MOBILE", "MB1's check step ticks before any change is made", { "assets/laptop.js": [["return !!p && PH.lastAt(p, \"app-set\") >= 0 && PH.lastAt(p, \"view\"", "return !!p && PH.lastAt(p, \"view\""]] }],
  ["INSTRUCTOR", "the instructor's fix read from the office as it is", { "assets/laptop.js": [["const f = isCur ? E.fleet() : (function () { const g = makeFleet(); t.setup(g); return g; })();", "const f = E.fleet();"], ["const mv = (t.moves(f) || []).filter(", "const mv = t.moves(f).filter("]] }],
  ["INSTALL", "the boot menu's USB entry starts nothing", { "assets/install.js": [["  if (e === \"usb\") {\n    if (!I.media)", "  if (e === \"usb\" && false) {\n    if (!I.media)"]] }],
  ["INSTALL", "Sign-in options never offers Domain join instead", { "assets/installui.js": [["if (O.showOpts) opts.appendChild(", "if (false) opts.appendChild("]] }],
  ["INSTALL", "the domain join never takes effect at the restart", { "assets/install.js": [["if (I.joinPending) { I.joinPending = false;", "if (false) { I.joinPending = false;"]] }],
  ["INSTALL", "Setup's refusal shown without its words", { "assets/installui.js": [["const e = el(\"p\", \"ins-err\", \"✕ \" + I.error);", "const e = el(\"p\", \"ins-err\", \"✕ Error\");"]] }],
  ["CRAWL", "Mason's rings never drawn", { "assets/laptop.js": [["if (t) t.classList.add(\"coach-target\");", ""]] }],
  ["WALK", "the walk ticks only in strict order", { "assets/laptop.js": [["(walk.mode === \"walk\" || i <= firstOpen(walk, c))", "(i <= firstOpen(walk, c))"]] }],
  ["RUN", "Mason never checks in after wrong moves", { "assets/laptop.js": [["if (g.rung > last.rung || (g.rung === 3 && n > last.n)) {", "if (false) {"]] }],
  ["RED", "a wrong cause loses its mark", { "assets/laptop.js": [["const out = !!st.picked[o.label] && !o.correct, struck", "const out = false, struck"]] }],
  ["NOTE", "any note closes the ticket", { "assets/engine.js": [["const r = noteOK(t, text);", "const r = { ok: true, missing: [] };"]] }],
  ["REVERT", "revert keeps the broken machine", { "assets/engine.js": [["S.fleet = M.clone(S.snap);", ""]] }],
  ["DROP", "a restart leaves the session running", { "assets/laptop.js": [["if (a.type === \"power\" && (a.op === \"restart\" || a.op === \"off\")) setTimeout(function () { dropped(w, a.op); }, 0);", ""]] }],
  ["WALKOVER", "the power button does nothing", { "assets/laptop.js": [["if (m.power !== \"on\") { M.boot(m);", "if (m.power !== \"on\") {"]] }],
  ["MALWARE", "a crawl step already true on the clean office, judged before the ticket is assigned", { "assets/laptop.js": [["return !!(t && t.id === k) && d();", "return d();"], ["return [\"WS2\", \"FS01\"].every(function (x) { return prog(x).removed && MW.online(E.machine(x)); });", "return MW.online(E.machine(\"WS2\")) && MW.online(E.machine(\"FS01\"));"]] }],
  ["CINE", "the walk is never framed as a cutscene", { "assets/laptop.js": [["ov.classList.add(\"cine-on\"); caption(\"Rafiki's IT Services\"", "caption(\"Rafiki's IT Services\""]] }],
  ["MALRUN", "the offline scan reports success but leaves the malware", { "assets/malware.js": [["w.removed = true; m.av.found = [];", "m.av.found = [];"]] }],
  ["MAIL", "reading the message details is never recorded", { "assets/mailui.js": [["if (ui.details && !x.fwd) { MX.viewHeaders(fleet, ctx.mid, x.id); ctx.act(", "if (ui.details && !x.fwd) { ctx.act("]] }],
  ["EXAM", "the malware map lets Submit through before every device is inspected", { "assets/examui.js": [["if (seen < all) {", "if (false) {"]] }],
  ["EXAM", "the exam inbox hides where a disguised link goes", { "assets/examui.js": [["(e.links || []).forEach(", "([]).forEach("]] }],
  ["EXAM", "Reset throws away the devices already inspected", { "assets/examui.js": [["if (st.visited) n.visited = st.visited.slice();", ""]] }],
  ["EXAM", "App Deployment's Commands tab shows no output", { "assets/examui.js": [["E.cmds[ui.cmd] ? \"PS C:\\\\> \" + E.cmds[ui.cmd][0] + \"\\n\\n\" + E.cmds[ui.cmd][1] :", "false ? 0 :"]] }],
  ["ROUTER", "Save in the 92 Series app doesn't save", { "assets/routerui.js": [["return R.save(f, rr); }); ui.msg", "return { ok: true, text: \"Settings saved.\" }; }); ui.msg"]] }],
  ["ROUTER", "the call panel's answers aren't shown", { "assets/laptop.js": [["log.appendChild(el(\"p\", \"call-a\", t.who + \": \" + c.a));", ""]] }],
  ["WIFI", "the access point never asks you to sign in again after a restart", { "assets/router.js": [["r.running = copy(r.saved); r.form = copy(r.saved); r.signedIn = false;\n  note(fleet, r, \"reboot\"", "r.running = copy(r.saved); r.form = copy(r.saved);\n  note(fleet, r, \"reboot\""]] }],
  ["WIFI", "a crowded room shows as connected", { "assets/routerui.js": [["j.ok ? (R.crowded(r) ? \"rt-bad\" : \"rt-ok\")", "j.ok ? (false ? \"rt-bad\" : \"rt-ok\")"], ["j.ok ? (R.crowded(r) ? \"✕ Connected but crawling", "j.ok ? (false ? \"✕ Connected but crawling"]] }],
  ["PF", "the customer's test from outside always fails", { "assets/router.js": [["if (!x || x.to !== pc.ip) return { ok: false", "if (true) return { ok: false"]] }],
  ["NR", "the street drawn from the settings typed, not the ones running", { "assets/streetview.js": [["const run = r.running.wifi, clash = R.interference(r);", "const run = r.form.wifi, clash = R.interference({ running: r.form, neighbours: r.neighbours });"]] }],
  ["NR", "the street never shows an overlap", { "assets/streetview.js": [["const run = r.running.wifi, clash = R.interference(r);", "const run = r.running.wifi, clash = [];"]] }],
  ["NR", "the status never shows an overlap", { "assets/routerui.js": [["const clash = R.interference(r), ln", "const clash = [], ln"]] }],
  ["CHAT", "the customer's reaction to a wrong reply is never shown", { "assets/chatui.js": [["b.appendChild(el(\"p\", null, x.text));", "if (!x.mood && x.mood !== 0) b.appendChild(el(\"p\", null, x.text));"]] }],
  ["CHAT", "a hands-on check never ticks off", { "assets/tickets-chat.js": [["t.react = function (act, fleet) { CH.advance(fleet, t); };", "t.react = function () {};"]] }],
  ["CHAT", "starting again shows the same six", { "assets/chat.js": [["c.step = 0; c.out = {}; c.said = {}; c.seed++; c.mood = c.startMood;", "c.step = 0; c.out = {}; c.said = {}; c.mood = c.startMood;"]] }],
  ["WR", "windows open before Mason's panel stay under it", { "assets/laptop.js": [["desk.style.right = \"var(--coach-w)\"; fitWins(); }", "desk.style.right = \"var(--coach-w)\"; }"]] }],
  ["WR", "the microwave can be moved without walking there", { "assets/laptop.js": [["onSite: function () { const t = E.ticket(); return !!(t && L.onSite[t.id]); }", "onSite: function () { return true; }"]] }],
  ["EXAM", "Submit never grades", { "assets/examui.js": [["const r = P.check(v, st);", "const r = { done: false, wrong: 0, missing: 0 };"]] }],
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
