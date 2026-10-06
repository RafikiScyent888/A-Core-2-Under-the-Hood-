/* =====================================================================
   verify/contrast.mjs — WCAG AAA on PAINTED PIXELS.

     node verify/contrast.mjs           every screen, both themes
     node verify/contrast.mjs --plant   planted low-contrast colours must fail

   The standing rule: body text 7:1, large text (24px, or 18.66px bold)
   4.5:1. The students have eye damage from military service, and this is
   a medical accommodation, not a style preference.

   HOW: collect every text run's box, hide every glyph with an injected
   style, screenshot, remove the style (or the next sweep measures 1:1),
   then sample the real pixels 2px inside each box. Any colour covering 8%
   of a box counts as a ground, and the text colour is blended by its
   alpha and every ancestor's opacity. A cascade-walking checker reads
   white text on a white ancestor when the paint is a gradient; pixels do
   not lie that way. Disabled controls are NOT exempt.

   The states driven, on the laptop: the sign-in with a refused password;
   the desktop with Help Desk and chat; connecting; the remote PC's error
   box, Start search, and Event Viewer with Mason's ring; the remote
   console; Mason's rung 3 in chat; Settings and Start; the resolution with
   wrong picks red and rung 3 strikes; a refused note; the closed ticket;
   instructor mode; the L2 walk with How? open; the D1 crawl; the D2 walk;
   at a desk after the walk-over; the Malware incident (Devices, Task
   Manager's process details, Edge, Windows Security, System Properties,
   Windows Update, Network Connections), the cutscene's caption, the USB
   stick at the desk, a session ended by quarantine. Dark, light, and dark
   with dyslexia text.

   It does not measure text behind a modal's scrim, under the Start menu
   or Run box, scrolled out of its own box, inside a closed <details>, or
   covered (even partly) by another window or a notification.
   ===================================================================== */
import { serve, browser } from "./serve.mjs";
const ROOT = new URL("..", import.meta.url).pathname;

const lum = (c) => { const f = (v) => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

/* "Walk back" takes up to ~9 s to answer under this container's software
   renderer (resizing the 3D canvas); on a real graphics card it's
   immediate. Those clicks get 60 s, so a slow machine isn't a failure. */
export async function run(extraCss) {
  const S = serve(ROOT);
  const B = await browser();
  const page = await B.newPage({ viewport: { width: 1400, height: 1000 } });
  /* a script error on the page is reported, not left to look like a blank window */
  page.on("pageerror", (e) => console.log("PAGE ERROR: " + e.message + " | " + String(e.stack || "").split("\n").slice(1, 3).join(" | ")));
  page.setDefaultTimeout(20000);
  const found = new Map();
  if (extraCss) await page.addInitScript((css) => { document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); }); }, extraCss);

  let where = "start";
  async function sweep(state) {
    where = state;
    await page.waitForTimeout(250);
    /* elementFromPoint (the occlusion test below) looks straight through
       anything with pointer-events: none, such as the cutscene's caption
       layer, and would call its text covered. Every layer is made
       hit-testable while the runs are collected. */
    const pe = await page.addStyleTag({ content: "*{pointer-events:auto!important}" });
    const runs = await page.evaluate(() => {
      const out = []; window.__sweepEls = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
      const desc = (el) => { const p = []; for (let e = el; e && e !== document.body && p.length < 3; e = e.parentElement) p.unshift(e.tagName.toLowerCase() + (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\s+/).join(".") : "")); return p.join(" > "); };
      while ((n = w.nextNode())) {
        if (!n.textContent.trim()) continue;
        if (/^[\p{Extended_Pictographic}️‍\s]+$/u.test(n.textContent)) continue;
        const el = n.parentElement; if (el.closest("script,style,noscript,canvas")) continue;
        const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none") continue;
        let op = 1; for (let a = el; a; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity);
        /* Behind a modal's scrim is not on show: the scrim is there so it
           cannot be read past. Measured instead is the dialog on top. */
        /* A closed <details> keeps a layout box for its hidden content in
           Chromium, where nothing is painted. */
        const dt = el.closest("details"); if (dt && !dt.open && !el.closest("summary")) continue;
        const scr = el.closest(".screen");
        if (scr && scr.querySelector(".w-veil") && !el.closest(".w-veil")) continue;
        if (document.querySelector(".pin-ov") && !el.closest(".pin-ov")) continue;
        /* Under a pop-up (the Start menu, the Run box) is covered, not shown. */
        const occl = [...document.querySelectorAll(".startmenu, .w-dialog.run")].filter((o) => !o.contains(el)).map((o) => o.getBoundingClientRect());
        /* Scrolled out of its own box is not painted where it sits. Clip
           each rect by every scrolling ancestor; skip what is mostly hidden. */
        const clips = [];
        for (let a = el.parentElement; a; a = a.parentElement) { const o = getComputedStyle(a); if (/(auto|scroll|hidden)/.test(o.overflow + o.overflowY + o.overflowX)) clips.push(a.getBoundingClientRect()); }
        const rg = document.createRange(); rg.selectNodeContents(n);
        for (const r0 of rg.getClientRects()) {
          let x0 = r0.left, y0 = r0.top, x1 = r0.right, y1 = r0.bottom;
          clips.forEach((c) => { x0 = Math.max(x0, c.left); y0 = Math.max(y0, c.top); x1 = Math.min(x1, c.right); y1 = Math.min(y1, c.bottom); });
          if ((x1 - x0) * (y1 - y0) < 0.6 * r0.width * r0.height) continue;
          if (occl.some((o) => r0.left < o.right && r0.right > o.left && r0.top < o.bottom && r0.bottom > o.top)) continue;
          /* the topmost layer that is actually painted: a fully transparent
             layer (a fade at opacity 0) hides nothing */
          const seen = (e) => { for (let a = e; a; a = a.parentElement) { const o = getComputedStyle(a); if (parseFloat(o.opacity) === 0 || o.visibility === "hidden") return false; } return true; };
          const mine = (px, py) => { const top = document.elementsFromPoint(px, py).filter(seen)[0]; return top && (top === el || el.contains(top) || top.contains(el)); };
          /* the top and bottom edges too: a sticky header's rule across the top
             of a line it hides is covering it, not painted behind it */
          if (![[0.5, 0.5], [0.1, 0.2], [0.9, 0.2], [0.1, 0.85], [0.9, 0.85], [0.3, 0.03], [0.7, 0.03], [0.3, 0.97], [0.7, 0.97]].every(([fx, fy]) => mine(x0 + (x1 - x0) * fx, y0 + (y1 - y0) * fy))) continue;
          const r = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
          if (r.width > 4 && r.height > 6)
          { window.__sweepEls.push(el); out.push({ k: window.__sweepEls.length - 1, t: n.textContent.trim().slice(0, 40), c: cs.color, op, s: parseFloat(cs.fontSize), b: parseInt(cs.fontWeight) >= 700, x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height, el: desc(el) }); }
        }
      }
      /* inputs carry their text in a value, not a text node */
      document.querySelectorAll("input[type=text],input:not([type]),input[type=password]").forEach((i) => {
        if (!i.value || i.offsetParent === null) return; const r = i.getBoundingClientRect(); const cs = getComputedStyle(i);
        /* an input behind another window is covered, not shown: the same
           test as for text, at the input's middle */
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (!top || (top !== i && !i.contains(top))) return;
        out.push({ t: "[input] " + i.value.slice(0, 30), c: cs.color, op: 1, s: parseFloat(cs.fontSize), b: false, x: r.x + scrollX + 4, y: r.y + scrollY + 4, w: Math.min(r.width - 8, 60), h: r.height - 8, el: "input." + i.className });
      });
      return out;
    });
    await pe.evaluate((t) => t.remove());
    const tag = await page.addStyleTag({ content: "*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important}" });
    /* Screenshots at the window's own size, never fullPage: a full-page
       capture resizes the window to the page's height, the laptop is sized
       to the window, and the rows move between reading the text and taking
       the pixels (found 3 October 2026: the queue re-scrolled and every
       window sat 30px lower). What lies below the fold is reached by
       scrolling, which moves the page without re-laying it out. */
    const [vh, full, sy0] = await page.evaluate(() => [innerHeight, document.documentElement.scrollHeight, scrollY]);
    const shots = [];
    for (let off = 0; ; off += vh) { const o = Math.max(0, Math.min(off, full - vh)); await page.evaluate((y) => scrollTo(0, y), o); const got = await page.evaluate(() => scrollY); shots.push({ off: got, png: (await page.screenshot()).toString("base64") }); if (o + vh >= full) break; }
    await page.evaluate((y) => scrollTo(0, y), sy0);
    await tag.evaluate((t) => t.remove());
    /* Something that changed between reading the text and the screenshot
       (a notification timing out) wasn't painted where it was read: drop
       it rather than measure it against what replaced it. */
    const gone = await page.evaluate((list) => list.filter((r) => { const e = window.__sweepEls[r.k]; if (!e || !e.isConnected) return true; const b = e.getBoundingClientRect(); return b.width === 0 && b.height === 0; }).map((r) => r.k), runs.filter((r) => r.k != null).map((r) => ({ k: r.k })));
    for (let i = runs.length - 1; i >= 0; i--) if (gone.indexOf(runs[i].k) >= 0) runs.splice(i, 1);
    const bgs = await page.evaluate(async ({ shots, runs }) => {
      const cv = [];
      for (const sh of shots) { const img = new Image(); img.src = "data:image/png;base64," + sh.png; await img.decode();
        const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0); cv.push({ off: sh.off, x, w: img.width, h: img.height }); }
      return runs.map((r) => { const w = Math.max(1, Math.round(r.w - 4)), h = Math.max(1, Math.round(r.h - 4));
        /* the shot that holds the whole run; none means it can't be measured, which fails below rather than passing */
        const s = cv.find((q) => r.y >= q.off && r.y + r.h <= q.off + q.h && r.x + r.w <= q.w);
        if (!s) return null;
        const d = s.x.getImageData(Math.round(r.x + 2), Math.round(r.y - s.off + 2), w, h).data, cnt = {}; let tot = 0;
        for (let i = 0; i < d.length; i += 4) { const k = d[i] + "," + d[i + 1] + "," + d[i + 2]; cnt[k] = (cnt[k] || 0) + 1; tot++; }
        return Object.entries(cnt).filter(([, v]) => v / tot >= 0.08).map(([k]) => k.split(",").map(Number)); });
    }, { shots, runs });
    runs.forEach((r, i) => {
      const m = r.c.match(/[\d.]+/g).map(Number); const a = (m[3] ?? 1) * r.op;
      const need = (r.s >= 24 || (r.s >= 18.66 && r.b)) ? 4.5 : 7;
      if (!bgs[i]) { const key = "NOT SAMPLED | " + r.el.split(" > ").pop(); const e = found.get(key) || { key, worst: 0, need, states: new Set(), sample: r.t }; e.states.add(state); found.set(key, e); return; }
      let worst = 99, wbg = null;
      for (const bg of bgs[i]) { const fg = [0, 1, 2].map((k) => m[k] * a + bg[k] * (1 - a)); const q = ratio(fg, bg); if (q < worst) { worst = q; wbg = bg; } }
      if (worst < need) {
        const key = r.el.split(" > ").pop() + " | " + r.c + " on rgb(" + wbg + ")";
        const e = found.get(key) || { key, worst: 99, need, states: new Set(), sample: r.t };
        e.worst = Math.min(e.worst, worst); e.states.add(state); found.set(key, e);
      }
    });
  }

  let rdp;
  const run = async (c) => { const i = rdp.locator(".con-in"); await i.fill(c); await i.press("Enter"); await page.waitForTimeout(80); };
  async function pass(theme, reading) {
    const tag = theme + (reading ? "+dyslexia" : "");
    await page.goto(S.url + "/index.html");
    await page.evaluate(([t, r]) => { localStorage.clear(); localStorage.setItem("c2vm.theme", t); if (r) localStorage.setItem("c2vm.reading", "dyslexia"); }, [theme, reading]);
    await page.reload(); await page.waitForTimeout(300);
    await sweep(tag + ": lock screen");
    await page.getByRole("button", { name: "Press to sign in" }).click();
    await page.locator("#lock-pw").fill("x"); await page.getByRole("button", { name: "Sign in" }).click();
    await sweep(tag + ": sign-in, wrong password");
    await page.locator("#lock-pw").fill("TechStart-2026"); await page.locator("#lock-pw").press("Enter"); await page.waitForTimeout(300);
    await sweep(tag + ": desktop, Help Desk and chat");
    const hd = page.locator("[data-win=helpdesk]");
    await hd.getByRole("button", { name: "Assign to me and start" }).click();
    await hd.getByRole("button", { name: /Connect to WS4-FIN/ }).click();
    await sweep(tag + ": connecting");
    await page.waitForTimeout(1600); rdp = page.locator('[data-win="rdp:WS4"]');
    await rdp.getByRole("button", { name: /Open the Testing shortcut/ }).click();
    await sweep(tag + ": remote PC error box");
    await rdp.locator(".w-dialog").getByRole("button", { name: "OK" }).click();
    await rdp.getByRole("button", { name: "Start menu" }).click(); await rdp.locator(".sm-search").fill("event");
    await sweep(tag + ": remote Start menu, searching");
    await rdp.getByRole("button", { name: "Open Event Viewer" }).click(); await page.waitForTimeout(300);
    await sweep(tag + ": Event Viewer, Mason's highlight on the Error row");
    await rdp.getByRole("button", { name: "Start menu" }).click(); await rdp.getByRole("button", { name: "Open Command Prompt" }).click();
    for (const c of ["regsvr32 msvcp100.dll", "setx PATH C:\\T1", "setx PATH C:\\T2"]) await run(c);
    await sweep(tag + ": remote console, Mason's first hint as a notification");
    for (const c of ["setx PATH C:\\T3", "setx PATH C:\\T4"]) await run(c);
    await page.locator(".tb", { hasText: "Chat" }).click();
    await sweep(tag + ": chat with rung 3");
    await page.locator(".tb", { hasText: "Settings" }).click();
    await sweep(tag + ": settings tray");
    await page.locator(".tb", { hasText: "Settings" }).click();
    await page.locator(".tb", { hasText: "Start" }).click(); await sweep(tag + ": Start");
    await page.locator(".tb", { hasText: "Start" }).click();
    await page.locator(".tb", { hasText: "WS4-FIN" }).click();
    await rdp.getByRole("button", { name: "Start menu" }).click(); await rdp.getByRole("button", { name: "Open Software Center" }).click();
    await rdp.getByRole("button", { name: "Reinstall Testing 4.2" }).click(); await rdp.locator(".w-dialog").getByRole("button", { name: "OK" }).click();
    await page.locator(".tb", { hasText: "Help Desk" }).click();
    await hd.getByRole("button", { name: "Resolve" }).click();
    for (const w of ["licence", "network", "profile", "updates", "Windows Security"]) await hd.locator(".opt2", { hasText: w }).first().click();
    await sweep(tag + ": resolution, five red, rung 3 strikes");
    await hd.locator(".opt2", { hasText: "dependency is missing" }).click();
    await hd.locator("#res-note").fill("Fixed it."); await hd.getByRole("button", { name: "Close the ticket" }).click();
    await sweep(tag + ": right answer, notes refused");
    await hd.locator("#res-note").fill("Testing said MSVCP100.dll was missing. Reinstalled Testing from Software Center and tested it opens.");
    await hd.getByRole("button", { name: "Close the ticket" }).click();
    await sweep(tag + ": closed");
    await page.locator(".tb", { hasText: "Settings" }).click(); await page.locator("#instructorBtn").click(); await page.locator("#pin-in").fill("3693"); await page.locator("#pin-in").press("Enter");
    await page.locator(".tb", { hasText: "Settings" }).click();
    await sweep(tag + ": instructor mode");
    await page.keyboard.press("Escape"); await page.evaluate(() => window.__LAP.openWin("helpdesk"));
    /* Mason's rung 3 comes from the ladder, which runs on run tickets only
       (on a crawl Mason is already walking them through it) */
    await page.locator(".qi", { hasText: "INC20413" }).click(); await hd.locator("[data-coach=assign]").click();
    await hd.locator("[data-coach=connect]").click(); await page.waitForTimeout(1700);
    rdp = page.locator('[data-win="rdp:WS5"]');
    await rdp.getByRole("button", { name: "Start menu" }).click(); await rdp.locator(".sm-search").fill("cmd"); await rdp.getByRole("button", { name: "Open Command Prompt" }).click();
    for (const c of ["setx PATH C:\\R1", "setx PATH C:\\R2", "setx PATH C:\\R3", "setx PATH C:\\R4", "setx PATH C:\\R5"]) await run(c);
    await page.evaluate(() => window.__LAP.openWin("chat"));
    await sweep(tag + ": run ticket, Mason's rung 3 with struck moves in chat");
    await page.evaluate(() => window.__LAP.openWin("helpdesk"));
    await page.locator(".qi", { hasText: "INC20411" }).click(); await hd.locator("[data-coach=assign]").click();
    await page.locator(".coach details summary").first().click();
    await sweep(tag + ": walk checklist, How? open");
    await page.locator(".qi", { hasText: "INC20416" }).click(); await page.waitForTimeout(300);
    await sweep(tag + ": D1 crawl, step 1");
    await page.locator(".qi", { hasText: "INC20417" }).click(); await hd.locator("[data-coach=assign]").click(); await page.locator(".coach details summary").nth(2).click();
    await sweep(tag + ": D2 walk, How? open, Run chips in the queue");
    await page.evaluate(() => window.__LAP.walkOver("WS2"));
    await page.waitForSelector(".wo-desk", { timeout: 90000 }); await page.getByRole("button", { name: "Check the network cable" }).click();
    await sweep(tag + ": walked over to WS2, at the desk");
    await page.getByRole("button", { name: "Walk back to your desk" }).click({ timeout: 60000 }); await page.waitForSelector(".walkover", { state: "detached", timeout: 90000 });

    /* the Malware incident: Devices, the new Windows tools, the cutscene,
       the USB stick at the desk, a session ended by quarantine */
    await page.evaluate(() => window.__LAP.openWin("helpdesk"));
    await page.locator(".qi", { hasText: "INC20422" }).click(); await hd.locator("[data-coach=assign]").click(); await page.waitForTimeout(300);
    await sweep(tag + ": M1 incident ticket, Devices, crawl step 2");
    const win = (id, app) => page.locator('[data-win="rdp:' + id + '"] section.win[aria-label^="' + app + '"]');
    const open = async (id, q, name) => { const r = page.locator('[data-win="rdp:' + id + '"]'); await r.getByRole("button", { name: "Start menu" }).click(); await r.locator(".sm-search").fill(q); await r.getByRole("button", { name }).click(); await page.waitForTimeout(250); };
    await hd.locator("[data-coach=dev-connect-FS01]").click(); await page.waitForTimeout(1700);
    await open("FS01", "task", "Open Task Manager");
    await win("FS01", "Task Manager").getByRole("button", { name: /Sort by .*CPU/ }).click(); await win("FS01", "Task Manager").locator("tbody tr").first().click();
    await sweep(tag + ": FS01 Task Manager, What is this process?");
    await open("FS01", "event", "Open Event Viewer");
    await page.evaluate(() => window.__LAP.openWin("helpdesk"));
    await sweep(tag + ": Devices, FS01 checked");
    await hd.locator("[data-coach=dev-connect-WS2]").click(); await page.waitForTimeout(1700);
    await open("WS2", "browser", "Open Microsoft Edge"); await sweep(tag + ": WS2 Edge history");
    await open("WS2", "defender", "Open Windows Security"); await sweep(tag + ": WS2 Windows Security");
    await open("WS2", "restore", "Open System Properties"); await sweep(tag + ": WS2 System Properties");
    await open("WS2", "update", "Open Windows Update"); await sweep(tag + ": WS2 Windows Update");
    await open("WS2", "network", "Open Network Connections"); await sweep(tag + ": WS2 Network Connections");
    /* the cutscene, frozen mid-swoop */
    await page.evaluate(() => window.__LAP.walkOver("WS2"));
    await page.waitForFunction(() => window.__LAP.wo() && window.__LAP.wo().office(), null, { timeout: 90000 });
    await page.evaluate(() => window.__LAP.wo().office().peek(-0.5)); await page.waitForTimeout(700);
    await sweep(tag + ": walk-over cutscene, caption on the letterbox");
    await page.evaluate(() => { const s = document.querySelector(".wo-skip"); if (s) s.click(); });
    await page.waitForSelector(".wo-desk", { timeout: 90000 }); await page.waitForTimeout(700);
    await page.getByRole("button", { name: "Check the network cable" }).click();
    await page.getByRole("button", { name: /Plug in the USB stick/ }).click();
    const mon = page.locator(".wo-monitor");
    await mon.getByRole("button", { name: "Start menu" }).click(); await mon.locator(".sm-search").fill("files"); await mon.getByRole("button", { name: "Open File Explorer" }).click();
    await mon.getByRole("button", { name: /Go to the USB drive/ }).click(); await mon.getByRole("button", { name: "File mpam-fe.exe" }).click();
    await sweep(tag + ": at WS2's desk, USB stick in, File Explorer on E:");
    await page.getByRole("button", { name: "Unplug the network cable" }).click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Walk back to your desk" }).click({ timeout: 60000 }); await page.waitForSelector(".walkover", { state: "detached", timeout: 90000 });
    await page.evaluate(() => { const w = window.__LAP.W["rdp:WS2"]; if (w) { w.min = false; } window.__LAP.openWin("rdp:WS2"); });
    await page.waitForTimeout(300);
    await sweep(tag + ": WS2's remote session ended by quarantine");
    await page.evaluate(() => window.__LAP.openWin("helpdesk"));
    await page.locator(".qi", { hasText: "INC20423" }).click(); await hd.locator("[data-coach=assign]").click(); await page.locator(".coach details summary").nth(1).click();
    await sweep(tag + ": M2 malware walk, How? open");

    /* Email Threat: Mail, the triage card, Mail admin, a user's own Mail */
    await page.evaluate(() => window.__LAP.openWin("helpdesk"));
    await page.locator(".qi", { hasText: "INC20429" }).click(); await hd.locator("[data-coach=assign]").click();
    await hd.locator("[data-coach=open-mail]").click(); const mw = page.locator("[data-win=mail]");
    await mw.locator(".mx-it", { hasText: "PayPal" }).click(); await mw.locator(".mx-link").first().hover();
    await sweep(tag + ": Mail, a forward open, the link's real address showing");
    await mw.getByRole("button", { name: /Message details/ }).click();
    await sweep(tag + ": Mail, a forward's message details");
    await mw.locator(".mx-link").first().click(); await mw.locator(".mx-link").first().click();
    await page.evaluate(() => window.__LAP.openWin("helpdesk"));
    const card = hd.locator('.tri-card[data-mail="paypal"]');
    for (const c of ["Spam", "Malicious", "Legitimate"]) await card.getByRole("button", { name: c, exact: true }).click();
    await card.scrollIntoViewIfNeeded();
    await sweep(tag + ": triage card, wrong picks red, Mason's strikes");
    await page.evaluate(() => window.__LAP.openWin("mail"));
    await sweep(tag + ": Mail, the warning after opening a link");
    await page.evaluate(() => window.__LAP.openWin("mailadmin")); const ad = page.locator("[data-win=mailadmin]");
    await ad.locator("#mxa-block").fill("paypal-resolve-login.net"); await ad.getByRole("button", { name: "Block", exact: true }).click();
    await ad.locator("#mxa-q").fill("PayPal"); await ad.getByRole("button", { name: /^Purge/ }).first().click();
    await sweep(tag + ": Mail admin, a block and a purge");
    await page.evaluate(() => window.__LAP.openWin("helpdesk"));
    await page.locator(".qi", { hasText: "INC20431" }).click(); await hd.locator("[data-coach=assign]").click();
    await hd.locator("[data-coach=dev-connect-WS4]").click(); await page.waitForTimeout(1700);
    const r4 = page.locator('[data-win="rdp:WS4"]'); await r4.getByRole("button", { name: "Start menu" }).click(); await r4.locator(".sm-search").fill("mail"); await r4.getByRole("button", { name: "Open Mail" }).click();
    await r4.locator(".mx-it", { hasText: "Quick favour" }).click(); await r4.getByRole("button", { name: /Message details/ }).click();
    await sweep(tag + ": Farah's own Mail, flagged, with the headers");

    /* Exam Practice: each sim laid out as the exam shows it */
    await page.evaluate(() => window.__LAP.openWin("exam")); const ex = page.locator("[data-win=exam]");
    await ex.getByRole("button", { name: /^Port Forwarding Configuration: practice 2/ }).click();
    const wrongs = await page.evaluate(async () => { const m = await import("./assets/exams.js"); return m.EXAMS[0].variants[1].fields[0].options.filter((o) => !o.correct).map((o) => o.label); });
    for (const w of wrongs.slice(0, 4)) { await ex.locator('.ex-f[data-field="enc"] .ex-o', { hasText: w }).first().click(); await ex.getByRole("button", { name: "Submit" }).click(); }
    await ex.locator(".ex-slot").nth(1).click(); await ex.locator(".ex-f .ex-o").first().click(); await ex.getByRole("button", { name: "Submit" }).click(); await ex.locator(".ex-slot").first().click();
    await sweep(tag + ": Exam Practice, Port Forwarding diagram, red picks, Mason's rung 3");
    await ex.getByRole("button", { name: /^WiFi Access Point Configuration: the sim itself/ }).click(); await ex.getByRole("button", { name: /wireless access point: open/ }).click();
    await sweep(tag + ": Exam Practice, WiFi office map, access point settings");
    await ex.getByRole("button", { name: /^Neighboring Routers Configuration: the sim itself/ }).click(); await ex.getByRole("button", { name: "Router 3: show its settings" }).click();
    await sweep(tag + ": Exam Practice, three houses, Router 3 settings");
    await ex.getByRole("button", { name: "Checklist" }).click();
    await ex.getByRole("button", { name: /^Tier 1 Router Support Scenario: the sim itself/ }).click();
    await sweep(tag + ": Exam Practice, Tier 1 scenario and conversation, checklist");
    await ex.getByRole("button", { name: /^Wireless Reliability Decision Lab: the sim itself/ }).click();
    await sweep(tag + ": Exam Practice, Wireless Reliability signal log and checkpoints");
    await ex.getByRole("button", { name: /^Application Launch Troubleshooting: the sim itself/ }).click();
    await sweep(tag + ": Exam Practice, App Launch tasks, error message and Event Viewer");
    await ex.getByRole("button", { name: /^Application Deployment Troubleshooting: the sim itself/ }).click();
    await sweep(tag + ": Exam Practice, App Deployment, the BSOD tab");
    await ex.getByRole("button", { name: "Commands", exact: true }).click(); await ex.getByRole("button", { name: /^Run: ls "C:\\Windows\\System32/ }).click();
    await sweep(tag + ": Exam Practice, App Deployment, a command's output");
    await ex.getByRole("button", { name: "Event Viewer", exact: true }).click();
    await sweep(tag + ": Exam Practice, App Deployment, the event log");
    await ex.getByRole("button", { name: /^Email Threat Classification: practice 2/ }).click(); await ex.locator(".ex-mlist .ex-nb").nth(2).click();
    for (const c of ["Legitimate", "Spam", "Malicious"]) { await ex.locator(".ex-f .ex-o", { hasText: c }).first().click(); await ex.getByRole("button", { name: "Submit" }).click(); }
    await ex.locator(".ex-mlist .ex-nb").nth(2).click();
    await sweep(tag + ": Exam Practice, Email inbox, a red category and Mason's pointer");
    await ex.getByRole("button", { name: /^Malware Incident Response: the sim itself/ }).click(); await ex.locator(".ex-net .ex-nb").nth(3).click();
    await sweep(tag + ": Exam Practice, Malware network map, Task Manager details");
    await ex.getByRole("button", { name: "System Logs" }).click();
    await sweep(tag + ": Exam Practice, Malware network map, System Logs");
    await ex.getByRole("button", { name: "Guided" }).click();

    /* the 92 Series app and the customer on the phone */
    const toFront = (id) => page.evaluate((i) => window.__LAP.openWin(i), id);
    const rw = page.locator("[data-win=router]");
    await toFront("helpdesk"); await hd.getByRole("button", { name: /Globe light orange/ }).first().click(); await hd.getByRole("button", { name: "Assign to me and start" }).click();
    await hd.getByRole("button", { name: "Open the 92 Series app" }).click(); await page.waitForTimeout(200);
    await sweep(tag + ": 92 Series app, status with the internet down");
    await toFront("helpdesk"); await hd.getByRole("button", { name: /Ask Marcus: Which port/ }).click(); await hd.getByRole("button", { name: /Ask Marcus: What are the lights/ }).click(); await page.waitForTimeout(150);
    await hd.locator(".call").scrollIntoViewIfNeeded();
    await sweep(tag + ": a router ticket's call panel");
    await toFront("router"); await rw.getByRole("button", { name: "Wireless", exact: true }).click();
    await rw.locator("#rt-ssid").fill("LeesBakery-2"); await rw.locator("#rt-ssid").dispatchEvent("change"); await page.waitForTimeout(150);
    await sweep(tag + ": 92 Series app, wireless page, not saved");
    await rw.getByRole("button", { name: /^Restart the router/ }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": 92 Series app, a restart that lost a change");
    await rw.getByRole("button", { name: "Administration", exact: true }).click();
    await rw.locator("#rt-acur").fill("Sourdough#Oven42"); await rw.locator("#rt-acur").dispatchEvent("change"); await rw.locator("#rt-anew").fill("bread"); await rw.locator("#rt-anew").dispatchEvent("change"); await rw.locator("#rt-aagain").fill("bread"); await rw.locator("#rt-aagain").dispatchEvent("change");
    await rw.getByRole("button", { name: "Change admin password" }).click(); await rw.getByRole("button", { name: "Factory reset…" }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": 92 Series app, a refused password and the reset warning");
    await rw.getByRole("button", { name: "Cancel" }).click(); await rw.getByRole("button", { name: "Wireless", exact: true }).click();
    await rw.locator("#rt-sec").selectOption("WPA3"); await rw.getByRole("button", { name: /^Save: write/ }).click(); await rw.getByRole("button", { name: /^Restart the router/ }).click();
    await rw.getByRole("button", { name: "Status", exact: true }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": 92 Series app, a device that can't join");
    /* the browser at 192.168.1.1: the access point's sign-in, a refused one, a crowded room */
    const bw = page.locator("[data-win=browser]");
    await toFront("helpdesk"); await hd.getByRole("button", { name: /Conference room access point/ }).first().click(); await hd.getByRole("button", { name: "Assign to me and start" }).click();
    await hd.getByRole("button", { name: "Open 192.168.1.1 in the browser" }).click(); await bw.locator("#wb-pass").fill("nope"); await bw.getByRole("button", { name: "Sign in" }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": the access point's sign-in page, a refused password");
    await bw.locator("#wb-pass").fill("Clos3t-AP-2026"); await bw.getByRole("button", { name: "Sign in" }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": the access point's status, a crowded room");
    /* a port-forwarding job: the call's tests and the forward page with a rule */
    await toFront("helpdesk"); await hd.getByRole("button", { name: /SSH to the home server/ }).first().click(); await hd.getByRole("button", { name: "Assign to me and start" }).click();
    await hd.getByRole("button", { name: /Ask Jordan: Please plug the console/ }).click(); await hd.getByRole("button", { name: /Ask Jordan: Try connecting/ }).click(); await hd.getByRole("button", { name: /Ask Jordan: Start an online game/ }).click(); await page.waitForTimeout(150);
    await hd.locator(".call").scrollIntoViewIfNeeded();
    await sweep(tag + ": a port-forwarding call, both tests failing");
    await hd.getByRole("button", { name: "Open the 92 Series app" }).click(); await rw.getByRole("button", { name: "Port forwarding", exact: true }).click();
    for (const [k, v] of [["rt-fe", "22"], ["rt-fi", "192.168.1.20"], ["rt-fq", "22"]]) { await rw.locator("#" + k).fill(v); await rw.locator("#" + k).dispatchEvent("change"); }
    await rw.getByRole("button", { name: "Add the forward" }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": 92 Series app, port forwarding with a rule");
    await rw.getByRole("button", { name: "Status", exact: true }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": 92 Series app, status with addresses");
    /* the street: the Wi-Fi scan with the overlap, the allowed list */
    await toFront("helpdesk"); await hd.getByRole("button", { name: /blue house's Wi-Fi keeps dropping/ }).first().click(); await hd.getByRole("button", { name: "Assign to me and start" }).click();
    await hd.getByRole("button", { name: "Open the 92 Series app" }).click(); await page.waitForTimeout(150);
    await rw.locator(".rt-clash").scrollIntoViewIfNeeded();
    await sweep(tag + ": 92 Series app, the Wi-Fi scan and an overlap");
    await rw.getByRole("button", { name: "Wireless", exact: true }).click(); await rw.locator("#rt-mac").click(); await rw.getByRole("button", { name: "Allow Laptop" }).click(); await page.waitForTimeout(150);
    await rw.locator("#rt-mac").scrollIntoViewIfNeeded();
    await sweep(tag + ": 92 Series app, MAC filtering and the allowed list");
    /* the street in 3D, with Router 3 overlapping both neighbours: the labels over the houses, then the band chart and the list */
    await toFront("helpdesk"); await hd.getByRole("button", { name: "Look at the street in 3D" }).click(); await page.waitForTimeout(3600);
    const svw = page.locator("[data-win=street]");
    await sweep(tag + ": the street in 3D, with an overlap");
    await svw.locator(".sv-list").scrollIntoViewIfNeeded(); await page.waitForTimeout(150);
    await sweep(tag + ": the street, the band chart and the list");
    await svw.getByRole("button", { name: /^Close Street view/ }).click();
    /* the customer chat: a wrong reply and the customer's reaction, Mason's rung 3 in the replies, a hands-on wait; Mobile devices */
    await toFront("helpdesk"); await hd.getByRole("button", { name: /John's phone won't send email/ }).first().click(); await hd.getByRole("button", { name: "Assign to me and start" }).click();
    await hd.getByRole("button", { name: "Open the customer chat" }).click(); await page.waitForTimeout(200);
    const ccw = page.locator("[data-win=custchat]");
    const pickWrong = async (n) => { for (let k = 0; k < n; k++) { await page.evaluate(() => { const E = window.__LAP.engine, t = E.ticket(), c = E.fleet().TECH.chats[t.id], lab = t.chat[c.step].right.label; const b = Array.from(document.querySelectorAll("[data-win=custchat] .cc-opts .opt2")).filter((x) => !x.disabled && x.querySelector(".ol").textContent !== lab)[0]; if (b) b.click(); }); await page.waitForTimeout(100); } };
    const pickRight = async () => { await page.evaluate(() => { const E = window.__LAP.engine, t = E.ticket(), c = E.fleet().TECH.chats[t.id], lab = t.chat[c.step].right.label; const b = Array.from(document.querySelectorAll("[data-win=custchat] .cc-opts .opt2")).filter((x) => x.querySelector(".ol").textContent === lab)[0]; if (b) b.click(); }); await page.waitForTimeout(100); };
    await pickWrong(3); await sweep(tag + ": customer chat, wrong replies and the customer's reactions");
    await pickRight(); await pickWrong(2); await ccw.locator(".cc-opts").scrollIntoViewIfNeeded(); await sweep(tag + ": customer chat, Mason's rung 3 in the replies");
    await pickRight(); await ccw.locator(".cc-wait").scrollIntoViewIfNeeded(); await sweep(tag + ": customer chat, waiting for a hands-on check");
    await ccw.getByRole("button", { name: "Open Mobile devices" }).click(); await page.waitForTimeout(2500);
    const mdw = page.locator("[data-win=mobile]");
    await mdw.getByRole("button", { name: /^Sync now/ }).click(); await page.waitForTimeout(300);
    await sweep(tag + ": Mobile devices, the phone and a failed sync");
    await mdw.getByRole("button", { name: "Mail server", exact: true }).click(); await page.waitForTimeout(200);
    await sweep(tag + ": Mobile devices, the mail server and its ports");
    await mdw.getByRole("button", { name: /^Close Mobile devices/ }).click(); await ccw.getByRole("button", { name: /^Close Customer chat/ }).click();
    /* the lunchtime job: the break counter, and the floor plan */
    await toFront("helpdesk"); await hd.getByRole("button", { name: /Wi-Fi drops every lunchtime/ }).first().click(); await hd.getByRole("button", { name: "Assign to me and start" }).click();
    await toFront("helpdesk"); await hd.locator("[data-coach=walk-break]").click(); await page.waitForTimeout(800);
    if (await page.locator(".wo-skip").count()) await page.locator(".wo-skip").click().catch(() => {});
    await page.waitForSelector(".wo-desk", { timeout: 90000 }); await page.waitForTimeout(400);
    await sweep(tag + ": the break counter, with the floor plan");
    await page.locator(".wo-back").click({ timeout: 60000 }); await page.waitForTimeout(600); if (await page.locator(".wo-skip").count()) await page.locator(".wo-skip").click().catch(() => {});
    await page.waitForSelector(".walkover", { state: "detached", timeout: 90000 });
    await toFront("helpdesk"); await hd.locator("[data-coach=open-floor]").click(); await page.waitForTimeout(300);
    await sweep(tag + ": the floor plan from the desk");
    /* extra training: the queue's second section and X1 (backup and recovery): her spreadsheet, Previous Versions, System Restore, File History */
    await toFront("helpdesk"); await page.locator(".hd2-jb", { hasText: "Extra training" }).click(); await page.locator(".qi", { hasText: "INC20476" }).click(); await page.waitForTimeout(150);
    await page.locator(".hd2-jb", { hasText: "Extra training" }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": the queue's extra-training section, X1's ticket and badge");
    await hd.getByRole("button", { name: "Assign to me and start" }).click(); await hd.locator("[data-coach=connect]").click(); await page.waitForTimeout(1700);
    const w4 = page.locator('[data-win="rdp:WS4"]');
    await open("WS4", "files", "Open File Explorer"); await w4.getByRole("button", { name: "Folder Documents" }).click(); await w4.getByRole("button", { name: "File Q3-budget.xlsx" }).click();
    await w4.getByRole("button", { name: "Open Q3-budget.xlsx" }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": X1, her spreadsheet opened");
    await w4.locator(".w-dialog").getByRole("button", { name: "Close" }).click(); await w4.getByRole("button", { name: "Properties of Q3-budget.xlsx" }).click();
    await w4.getByRole("tab", { name: "Previous Versions tab" }).click(); await w4.locator(".ev-row").nth(1).click(); await page.waitForTimeout(150);
    await sweep(tag + ": X1, Previous Versions with a copy selected");
    await w4.getByRole("button", { name: /^Restore the version modified .*\d$/ }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": X1, Previous Versions asks before restoring");
    await w4.locator(".w-dialog").getByRole("button", { name: "Cancel" }).click();
    await open("WS4", "restore", "Open System Properties"); await w4.getByRole("button", { name: "System Restore…" }).click(); await w4.locator(".sr-list button").first().click(); await page.waitForTimeout(150);
    await sweep(tag + ": X1, System Restore's restore points");
    await w4.locator(".w-dialog").getByRole("button", { name: "Cancel" }).click();
    await open("WS4", "file history", "Open File History");
    const fhb = (n) => w4.locator(".filehist .ev-nav button", { hasText: n });
    await fhb("Select drive").click(); await w4.locator("#fh-loc-WS4").fill("\\\\FS01\\Software"); await w4.getByRole("button", { name: "Select folder" }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": X1, File History refusing a share");
    await w4.locator("#fh-loc-WS4").fill("\\\\FS01\\Backups"); await w4.getByRole("button", { name: "Select folder" }).click();
    await fhb("Advanced settings").click(); await page.waitForTimeout(150);
    await sweep(tag + ": X1, File History's advanced settings");
    await fhb("File History").click(); await w4.getByRole("button", { name: "Turn on" }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": X1, File History on, the first copy made");
    await fhb("Restore personal files").click(); await page.waitForTimeout(150);
    await sweep(tag + ": X1, File History's Restore personal files");
    /* X2: the backup browser, Restore to, Replace; X4: the missing drive; X5: the driver crash */
    await toFront("helpdesk"); await page.locator(".qi", { hasText: "INC20477" }).click(); await hd.getByRole("button", { name: "Assign to me and start" }).click(); await hd.locator("[data-coach=connect]").click(); await page.waitForTimeout(1700);
    const w3 = page.locator('[data-win="rdp:WS3"]');
    await open("WS3", "file history", "Open File History"); await w3.locator(".filehist .ev-nav button", { hasText: "Restore personal files" }).click();
    await w3.getByRole("button", { name: "Show the older backup" }).click(); await w3.locator(".filehist .ev-row", { hasText: "deploy.yml" }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": X2, File History's backups, an older one, a file selected");
    await w3.getByRole("button", { name: "Restore a copy of deploy.yml to another folder" }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": X2, Restore to, choosing a folder");
    await w3.locator(".w-dialog").getByRole("button", { name: "Cancel" }).click();
    await w3.getByRole("button", { name: "Restore deploy.yml to its original location" }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": X2, Replace or Skip Files");
    await w3.locator(".w-dialog").getByRole("button", { name: "Skip this file" }).click();
    await toFront("helpdesk"); await page.locator(".qi", { hasText: "INC20479" }).click(); await hd.getByRole("button", { name: "Assign to me and start" }).click(); await hd.locator("[data-coach=connect]").click(); await page.waitForTimeout(1700);
    await open("WS5", "file history", "Open File History"); await page.waitForTimeout(150);
    await sweep(tag + ": X4, File History asking to reconnect the drive");
    await toFront("helpdesk"); await page.locator(".qi", { hasText: "INC20480" }).click(); await hd.getByRole("button", { name: "Assign to me and start" }).click(); await hd.locator("[data-coach=connect]").click(); await page.waitForTimeout(1700);
    await page.locator('[data-win="rdp:WS2"]').getByRole("button", { name: "Open the ScanEasy shortcut on the desktop" }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": X5, ScanEasy stopped working");
    /* the phones: Remote help screens for MB1, MB3, MB4, MB5 and MB6 */
    const mob = page.locator("[data-win=mobile]");
    const phone = async (inc) => { await toFront("helpdesk"); await page.locator(".qi", { hasText: inc }).click(); await hd.getByRole("button", { name: "Assign to me and start" }).click(); await hd.locator("[data-coach=open-mobile]").click(); await page.waitForTimeout(2500); };
    const tap = (n) => mob.getByRole("button", { name: n, exact: true });
    const go = async (txt) => { await mob.locator(".ph-link", { hasText: txt }).first().click(); await page.waitForTimeout(150); };
    await phone("INC20486");
    await sweep(tag + ": MB5, the lock screen with ads, the fake warning and the data warning");
    await tap("Settings").click(); await go("Apps"); await mob.getByRole("button", { name: "PDF Scanner Free: app info" }).click(); await tap("Uninstall PDF Scanner Free").click(); await page.waitForTimeout(150);
    await sweep(tag + ": MB5, app info with the uninstall confirmation");
    await mob.locator(".ph-confirm").getByRole("button", { name: "Cancel" }).click();
    await tap("Back").click(); await tap("Back").click(); await go("Security & privacy");
    await sweep(tag + ": MB5, Security & privacy, unknown apps allowed");
    await mob.getByRole("button", { name: /^Close Mobile devices/ }).click();
    await phone("INC20484"); await tap("Settings").click(); await go("Network & internet");
    await sweep(tag + ": MB3, Network & internet, connected with no internet");
    await mob.getByRole("button", { name: /^Close Mobile devices/ }).click();
    await phone("INC20485"); await tap("Settings").click(); await go("Storage");
    await sweep(tag + ": MB4, Storage, files backed up and not");
    await tap("Back").click(); await go("System"); await tap("Download and install the system update").click(); await page.waitForTimeout(150);
    await sweep(tag + ": MB4, the update refused for space");
    await mob.getByRole("button", { name: /^Close Mobile devices/ }).click();
    await phone("INC20487"); await mob.getByRole("button", { name: /^Send a test email/ }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": MB6, a test email that waits");
    await mob.getByRole("button", { name: /^Close Mobile devices/ }).click();
    await phone("INC20482"); await tap("Settings").click(); await go("Battery");
    await sweep(tag + ": MB1, Battery, a few hours left and warm");
    await mob.locator('.ph-link[aria-label^="Weather Live:"]').click(); await page.waitForTimeout(150);
    await sweep(tag + ": MB1, Weather Live's app info");
    await mob.getByRole("button", { name: /^Close Mobile devices/ }).click();
    /* OS installation, OI1, at Dev's desk: the firmware, Windows Setup,
       the first-run setup, and joining the domain */
    await toFront("helpdesk"); await page.locator(".qi", { hasText: "INC20488" }).click(); await hd.getByRole("button", { name: "Assign to me and start" }).click();
    await page.evaluate(() => window.__LAP.walkOver("WS3")); if (await page.locator(".wo-skip").count()) await page.locator(".wo-skip").click().catch(() => {});
    await page.waitForSelector(".wo-desk", { timeout: 90000 }); await page.waitForTimeout(300);
    const im = page.locator(".wo-monitor"), mb = (n) => im.getByRole("button", { name: n, exact: true });
    await sweep(tag + ": OI1, at Dev's desk, the PC off");
    await page.locator('.wo-hands [data-coach="inst-usb-in"]').click(); await page.locator('.wo-hands [data-coach="power"]').click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, the firmware's start-up screen, the USB in");
    await mb("Press F2 to enter the firmware Setup").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, the firmware's Setup");
    await mb("Discard the firmware changes and exit").click(); await mb("Press F12 for the Boot Menu").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, the Boot Menu");
    await mb("Boot from Network boot (PXE)").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, PXE timing out");
    await mb("Press any key to restart the boot").click(); await mb("Press F12 for the Boot Menu").click(); await mb("Boot from UEFI: WIN11_24H2 (USB)").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, Windows Setup's language settings");
    await mb("Next").click(); await mb("Next").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, Setup's options, refused for the unticked box");
    await im.locator('[id^="ws-agree-"]').check(); await mb("Next").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, the product key");
    await mb("I don't have a product key").click(); await im.getByRole("radio", { name: "Windows 11 Pro", exact: true }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, the edition, Pro selected");
    await mb("Next").click(); await mb("Accept").click(); await im.locator(".ws-part").first().click(); await mb("Install Windows on the selected location").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, where to install, refused: an MBR disk");
    await mb("Delete the selected partition").click(); await im.locator(".ws-part").first().click(); await mb("Install Windows on the selected location").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, ready to install");
    await mb("Install").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, Setup's restart");
    await mb("Restart now").click(); await mb("Let the PC start from its boot order").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, first-run setup, region");
    await mb("Yes").click(); await im.locator('[id^="oobe-name-"]').fill("WS3-DEV"); await mb("Next").click(); await im.getByRole("radio", { name: "Set up for work or school" }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, first-run setup, work or school selected");
    await mb("Next").click(); await im.locator('[id^="oobe-entra-"]').fill("dev@rafiki.local"); await mb("Sign in with this work or school account").click(); await mb("Sign-in options").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, first-run setup, Entra ID refused, Sign-in options open");
    await mb("Domain join instead").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, first-run setup, the local account");
    await im.locator('[id^="oobe-local-"]').fill("benchtech"); await mb("Create the local account").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, first-run setup, privacy");
    await mb("Accept the privacy settings").click(); await im.getByRole("button", { name: "Start menu" }).click(); await im.locator(".sm-search").fill("domain"); await mb("Open System Properties").click(); await page.waitForTimeout(200);
    await sweep(tag + ": OI1, Windows on a local account, System Properties' Computer Name");
    await mb("Change this computer's name or domain").click(); await im.locator(".w-dialog").getByRole("button", { name: "Yes" }).click(); await im.locator('[id^="cn-domain-"]').check(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, Computer Name/Domain Changes, Domain chosen");
    await im.locator('[id^="cn-dom-"]').fill("RAFIKI"); await im.locator(".w-dialog").getByRole("button", { name: "OK" }).click(); await im.locator('[id^="cn-u-"]').fill("itadmin"); await im.locator('[id^="cn-p-"]').fill("wrong"); await mb("Join the domain with this account").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, the join refused for a wrong password");
    await im.locator('[id^="cn-p-"]').fill("Bench-Tech-2026"); await mb("Join the domain with this account").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, welcome to the domain, restart now");
    await mb("Restart now").click(); await mb("Let the PC start from its boot order").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI1, the sign-in screen on the domain");
    await page.locator(".wo-back").click({ timeout: 60000 }); await page.waitForSelector(".walkover", { state: "detached", timeout: 90000 });
    /* OI2: Health Check failing the TPM, Setup's keep screen; OI3: Setup refusing the processor */
    const desk = async (inc, id) => { await toFront("helpdesk"); await page.locator(".qi", { hasText: inc }).click(); await hd.getByRole("button", { name: "Assign to me and start" }).click(); await page.evaluate((i) => window.__LAP.walkOver(i), id); if (await page.locator(".wo-skip").count()) await page.locator(".wo-skip").click().catch(() => {}); await page.waitForSelector(".wo-desk", { timeout: 90000 }); await page.waitForTimeout(300); };
    const dm = page.locator(".wo-monitor"), db = (n) => dm.getByRole("button", { name: n, exact: true });
    const dapp = async (q, n) => { await db("Start menu").click(); await dm.locator(".sm-search").fill(q); await db("Open " + n).click(); await page.waitForTimeout(150); };
    await desk("INC20489", "WS2"); await dapp("health", "PC Health Check"); await db("Check now: does this PC meet Windows 11's requirements?").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI2, PC Health Check failing the TPM");
    await page.locator('.wo-hands [data-coach="inst-usb-in"]').click(); await dapp("setup.exe", "Windows 11 Setup (setup.exe)"); await db("Start Windows 11 Setup").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI2, Windows 11 Setup refusing, the TPM off");
    await page.evaluate(() => { window.__LAP.engine.fleet().WS2.inst.fw.tpmOn = true; }); await db("Close Setup").click(); await db("Start Windows 11 Setup").click(); await db("Accept the licence terms").click(); await dm.getByRole("radio", { name: "Keep personal files only" }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI2, Setup's Choose what to keep, files only selected");
    await page.locator(".wo-back").click({ timeout: 60000 }); await page.waitForSelector(".walkover", { state: "detached", timeout: 90000 });
    await desk("INC20490", "WS5"); await dapp("health", "PC Health Check"); await db("Check now: does this PC meet Windows 11's requirements?").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI3, PC Health Check failing the processor");
    await page.locator(".wo-back").click({ timeout: 60000 }); await page.waitForSelector(".walkover", { state: "detached", timeout: 90000 });
    /* OI4: Disk Management and its shrink, GRUB, Ubuntu's installer, its terminal */
    await desk("INC20491", "WS3"); await dapp("disk", "Disk Management"); await dm.locator('.dm-row[aria-label*="(C:)"]').click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI4, Disk Management with C: selected");
    await db("Shrink the selected volume").click();
    { const u = dm.locator(".w-dialog.uac-creds"); if (await u.count()) { await u.locator("input").nth(0).fill("RAFIKI\\itadmin"); await u.locator("input").nth(1).fill("Bench-Tech-2026"); await u.getByRole("button", { name: "Yes" }).click(); } }
    await dm.locator('[id^="shrink-mb-"]').fill("999999"); await db("Shrink C: by this amount").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI4, the shrink dialog refusing too much");
    await dm.locator('[id^="shrink-mb-"]').fill("102400"); await db("Shrink C: by this amount").click(); await dm.locator(".w-dialog").getByRole("button", { name: "OK" }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI4, Disk Management with the space unallocated");
    await page.locator('.wo-hands [data-coach="inst-usb-in"]').click(); await db("Start menu").click(); await dm.getByRole("button", { name: "Restart", exact: true }).click();
    await db("Press F12 for the Boot Menu").click(); await db("Boot from UEFI: UBUNTU_24_04 (USB)").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI4, the Ubuntu USB's boot menu");
    await db("Try or Install Ubuntu").click(); await db("Next").click(); await dm.getByRole("radio", { name: "Try Ubuntu" }).click(); await db("Next").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI4, Ubuntu's installer: Try Ubuntu explained");
    await dm.getByRole("radio", { name: "Install Ubuntu" }).click(); await db("Next").click(); await dm.getByRole("radio", { name: "Erase disk and install Ubuntu" }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI4, how to install, Erase disk's warning selected");
    await dm.getByRole("radio", { name: "Manual installation" }).click(); await db("Next: install this way").click(); await dm.locator(".ws-part").nth(2).click(); await dm.locator('[id^="ub-fs-"]').selectOption("fat32"); await dm.locator('[id^="ub-mnt-"]').selectOption("/"); await db("Next: use this partition").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI4, manual installation refusing FAT32 for /");
    await db("Back").click(); await dm.getByRole("radio", { name: "Install Ubuntu alongside Windows Boot Manager" }).click(); await db("Next: install this way").click();
    await dm.locator('[id^="ub-name-"]').fill("Dev Patel"); await dm.locator('[id^="ub-host-"]').fill("WS3_DEV"); await dm.locator('[id^="ub-user-"]').fill("dev"); await dm.locator('[id^="ub-pass-"]').fill("x"); await db("Next: create the account").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI4, the account screen refusing a computer name");
    await dm.locator('[id^="ub-name-"]').fill("Dev Patel"); await dm.locator('[id^="ub-host-"]').fill("ws3-dev-ubuntu"); await dm.locator('[id^="ub-user-"]').fill("dev"); await dm.locator('[id^="ub-pass-"]').fill("x"); await db("Next: create the account").click();
    await sweep(tag + ": OI4, review your choices");
    await db("Install Ubuntu").click(); await db("Restart now to finish installing Ubuntu").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI4, remove the installation medium");
    await db("Press Enter to restart").click(); await db("Let the PC start from its boot order").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI4, GRUB with Ubuntu and Windows");
    await db("Ubuntu").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI4, Ubuntu's sign-in");
    await db("Let Dev sign in to Ubuntu").click(); await dm.locator('[id^="ub-in-"]').fill("lsblk"); await dm.locator('[id^="ub-in-"]').press("Enter"); await dm.locator('[id^="ub-in-"]').fill("apt update"); await dm.locator('[id^="ub-in-"]').press("Enter"); await page.waitForTimeout(150);
    await sweep(tag + ": OI4, Ubuntu's terminal");
    await page.locator(".wo-back").click({ timeout: 60000 }); await page.waitForSelector(".walkover", { state: "detached", timeout: 90000 });
    /* OI5: the Mac on the bench: startup options, Recovery, Disk Utility, Activation Lock, the reinstall, Hello */
    await toFront("helpdesk"); await page.locator(".qi", { hasText: "INC20492" }).click(); await hd.getByRole("button", { name: "Assign to me and start" }).click();
    await hd.locator("[data-coach=open-mac]").click(); await page.waitForTimeout(1500);
    const macw = page.locator("[data-win=macbench]"), mbb = (n) => macw.getByRole("button", { name: n, exact: true });
    await sweep(tag + ": OI5, the Mac on the bench, switched off");
    await mbb("Press and hold the power button").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI5, startup options");
    await mbb("Options: open macOS Recovery").click(); await macw.getByRole("radio", { name: "Sam Reed (sam.reed)" }).click(); await macw.locator('[id^="mac-rpass-"]').fill("x"); await mbb("Next: unlock Recovery").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI5, Recovery refusing Sam's password");
    await macw.getByRole("radio", { name: "Rafiki IT (rafikiadmin)" }).click(); await macw.locator('[id^="mac-rpass-"]').fill("Bench-Tech-2026"); await mbb("Next: unlock Recovery").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI5, macOS Recovery's utilities");
    await mbb("Disk Utility").click(); await mbb("Select the Macintosh HD volume group").click(); await mbb("Erase the selected volume group").click(); await macw.locator('[id^="mac-fmt-"]').selectOption("APFS"); await page.waitForTimeout(150);
    await sweep(tag + ": OI5, Disk Utility's erase sheet");
    await mbb("Erase the volume group").click(); await mbb("Activate this Mac").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI5, Activation Lock");
    await mbb("Ask Mason to release Activation Lock in device management").click(); await mbb("Try activating again").click(); await mbb("Reinstall macOS Sequoia").click(); await mbb("Continue setting up the installation").click(); await mbb("Agree to the licence").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI5, Reinstall macOS choosing the disk");
    await mbb("Install on Macintosh HD").click(); await mbb("Install macOS Sequoia").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI5, Setup Assistant's Hello");
    await macw.getByRole("button", { name: /^Close Your bench/ }).click();
    /* OI6: the new phone on the bench: welcome, QR set-up, Wi-Fi, "belongs to your organization", the policy's lock, the update */
    await toFront("helpdesk"); await page.locator(".qi", { hasText: "INC20493" }).click(); await hd.getByRole("button", { name: "Assign to me and start" }).click();
    await hd.locator("[data-coach=open-phonebench]").click(); await page.waitForTimeout(1500);
    const npw = page.locator("[data-win=phonebench]"), npb = (n) => npw.getByRole("button", { name: n, exact: true });
    await npb("Press the power button briefly").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI6, the new phone on the bench, switched off");
    await npb("Press and hold the power button").click(); await npb("Show the enrolment QR code for this phone").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI6, the welcome screen and the enrolment QR code");
    for (let i = 0; i < 6; i++) await npb("Tap the blank part of the welcome screen").click();
    await page.waitForTimeout(150);
    await sweep(tag + ": OI6, the QR set-up");
    await npb("Point the phone's camera at the QR code and scan it").click(); await npw.getByRole("radio", { name: "Rafiki-Guest, open" }).click(); await npb("Connect to Rafiki-Guest").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI6, Wi-Fi refusing the guest network");
    await npw.getByRole("radio", { name: "Rafiki-Staff, secured" }).click(); await npw.locator('[id^="np-wpass-"]').fill("T3amR@fiki2026"); await npb("Connect to Rafiki-Staff").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI6, this device belongs to your organization");
    await npb("Accept and continue").click(); await npb("Screen lock: Pattern").click(); await npb("Screen lock: PIN").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI6, the policy's screen lock");
    await npw.locator('[id^="np-lock1-"]').fill("284719"); await npw.locator('[id^="np-lock2-"]').fill("284719"); await npb("Confirm the PIN").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI6, the home screen, not compliant");
    await npb("Settings").click(); await npb("System, Software update, reset options").click(); await npb("Software update, Update available").click(); await npb("Download and install the system update").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI6, the update refused on a low battery");
    await npb("Plug the USB-C charger into the phone").click(); await npb("Download and install the system update").click(); await page.waitForTimeout(150);
    await sweep(tag + ": OI6, updated, locked and compliant");
    await npw.getByRole("button", { name: /^Close Your bench/ }).click();
    /* FS1: Brenda's stick (Copy to, File Too Large, the drive bar, Properties, Format and its warning); FS4: convert at the prompt */
    await toFront("helpdesk"); await page.locator(".qi", { hasText: "INC20494" }).click(); await hd.getByRole("button", { name: "Assign to me and start" }).click(); await hd.locator("[data-coach=connect]").click(); await page.waitForTimeout(1700);
    const fw2 = page.locator('[data-win="rdp:WS2"]'), wb = (n) => fw2.getByRole("button", { name: n, exact: true });
    await open("WS2", "files", "Open File Explorer"); await wb("Folder Desktop").click(); await wb("File Showroom tour.mp4").click(); await wb("Copy Showroom tour.mp4 to another folder or drive").click(); await page.waitForTimeout(150);
    await sweep(tag + ": FS1, Copy to, choosing a folder or drive");
    await fw2.locator('[id^="fxcopy-to-"]').selectOption("E:\\"); await wb("Copy Showroom tour.mp4 to the chosen folder").click(); await page.waitForTimeout(150);
    await sweep(tag + ": FS1, File Too Large");
    await fw2.locator(".w-dialog").getByRole("button", { name: "OK" }).click(); await wb("Go to the USB drive SALES (E:)").click(); await page.waitForTimeout(150);
    await sweep(tag + ": FS1, the stick in File Explorer, with its drive bar");
    await wb("Properties of SALES (E:)").click(); await page.waitForTimeout(150);
    await sweep(tag + ": FS1, the stick's Properties");
    await fw2.locator(".w-dialog").getByRole("button", { name: "OK" }).click(); await wb("Format SALES (E:)").click(); await page.waitForTimeout(150);
    await sweep(tag + ": FS1, Format, the form");
    await wb("Start formatting SALES (E:)").click(); await page.waitForTimeout(150);
    await sweep(tag + ": FS1, Format, the warning");
    await fw2.locator(".w-dialog").getByRole("button", { name: "Cancel" }).click();
    await toFront("helpdesk"); await page.locator(".qi", { hasText: "INC20497" }).click(); await hd.getByRole("button", { name: "Assign to me and start" }).click(); await hd.locator("[data-coach=connect]").click(); await page.waitForTimeout(1700);
    const fw4 = page.locator('[data-win="rdp:WS4"]');
    await open("WS4", "cmd", "Run Command Prompt as administrator"); { const c = fw4.locator(".w-dialog.uac-creds"); await c.locator("input").nth(0).fill("RAFIKI\\itadmin"); await c.locator("input").nth(1).fill("Bench-Tech-2026"); await c.getByRole("button", { name: "Yes" }).click(); }
    for (const l of ["convert D: /FS:NTFS", "FINANCE", "convert D: /FS:NTFS", "DATA"]) { await fw4.locator(".con-in").fill(l); await fw4.locator(".con-in").press("Enter"); await page.waitForTimeout(120); }
    await sweep(tag + ": FS4, convert at an administrator's prompt");
    /* FS2 and FS3: Windows Update (paused with the warning, the lists, advanced options, pending restart; history, Uninstall updates, the confirmation) */
    await toFront("helpdesk"); await page.locator(".qi", { hasText: "INC20495" }).click(); await hd.getByRole("button", { name: "Assign to me and start" }).click(); await hd.locator("[data-coach=connect]").click(); await page.waitForTimeout(1700);
    const uw5 = page.locator('[data-win="rdp:WS5"]'), ub5 = (n) => uw5.getByRole("button", { name: n, exact: true }), un5 = (n) => uw5.locator(".wu .ev-nav").getByRole("button", { name: n, exact: true });
    await open("WS5", "update", "Open Windows Update");
    await sweep(tag + ": FS2, Windows Update paused, with the warning");
    await ub5("Resume updates").click(); await ub5("Check for updates").click(); await page.waitForTimeout(150);
    await sweep(tag + ": FS2, the updates, the feature update and the optional driver");
    await un5("Advanced options").click(); await page.waitForTimeout(150);
    await sweep(tag + ": FS2, active hours");
    await un5("Windows Update").click(); await ub5("Download and install Security Intelligence Update for Microsoft Defender Antivirus - KB2267602 (Version 1.421.1180.0)").click(); await ub5("Download and install 2026-10 Cumulative Update for .NET Framework 3.5 and 4.8.1 for Windows 11, version 23H2 (KB5069874)").click(); await page.waitForTimeout(150);
    await sweep(tag + ": FS2, pending restart");
    await toFront("helpdesk"); await page.locator(".qi", { hasText: "INC20496" }).click(); await hd.getByRole("button", { name: "Assign to me and start" }).click(); await hd.locator("[data-coach=connect]").click(); await page.waitForTimeout(1700);
    const uw1 = page.locator('[data-win="rdp:WS1"]'), ub1 = (n) => uw1.getByRole("button", { name: n, exact: true });
    await open("WS1", "update", "Open Windows Update"); await uw1.locator(".wu .ev-nav").getByRole("button", { name: "Update history", exact: true }).click(); await page.waitForTimeout(150);
    await sweep(tag + ": FS3, Update history");
    await ub1("Uninstall updates").click(); await page.waitForTimeout(150);
    await sweep(tag + ": FS3, Uninstall updates");
    await ub1("Uninstall KB5069213").click(); { const c = uw1.locator(".w-dialog.uac-creds"); await c.locator("input").nth(0).fill("RAFIKI\\itadmin"); await c.locator("input").nth(1).fill("Bench-Tech-2026"); await c.getByRole("button", { name: "Yes" }).click(); } await page.waitForTimeout(150);
    await sweep(tag + ": FS3, Uninstall an update, the confirmation");
    await ub1("Yes: uninstall KB5069213").click(); await page.waitForTimeout(150);
    await sweep(tag + ": FS3, the uninstall waiting for a restart");
    /* FS5: Activation on Home, the Store, Enter a product key refusing a key, Home refusing the join; FS6: Ubuntu's apt at Dev's desk */
    await toFront("helpdesk"); await page.locator(".qi", { hasText: "INC20498" }).click(); await hd.getByRole("button", { name: "Assign to me and start" }).click(); await hd.locator("[data-coach=connect]").click(); await page.waitForTimeout(1700);
    const ew = page.locator('[data-win="rdp:WS5"]'), eb = (n) => ew.getByRole("button", { name: n, exact: true });
    const ecreds = async () => { const c = ew.locator(".w-dialog.uac-creds"); await c.locator("input").nth(0).fill("rafikiadmin"); await c.locator("input").nth(1).fill("Bench-Tech-2026"); await c.getByRole("button", { name: "Yes" }).click(); };
    await open("WS5", "activation", "Open Activation");
    await sweep(tag + ": FS5, Activation on Windows 11 Home");
    await eb("Upgrade to Windows 11 Pro in the Microsoft Store app").click(); await page.waitForTimeout(150);
    await sweep(tag + ": FS5, the Microsoft Store's upgrade");
    await ew.locator(".w-dialog").getByRole("button", { name: "Cancel" }).click(); await eb("Change product key").click(); await ecreds(); await ew.locator('[id^="ed-key-"]').fill("AAAAA-BBBBB-CCCCC-DDDDD-EEEEE"); await eb("Next: use this product key").click(); await page.waitForTimeout(150);
    await sweep(tag + ": FS5, Enter a product key, refused");
    await ew.locator(".w-dialog").getByRole("button", { name: "Cancel" }).click();
    await open("WS5", "domain", "Open System Properties"); await eb("Change this computer's domain or workgroup").click(); await ecreds(); await ew.locator('[id^="ej-domain-"]').check(); await ew.locator('[id^="ej-dom-"]').fill("RAFIKI"); await eb("OK: apply the membership").click(); await page.waitForTimeout(150);
    await sweep(tag + ": FS5, Home refusing the domain join");
    await ew.locator(".w-dialog").getByRole("button", { name: "Cancel" }).click();
    await toFront("helpdesk"); await page.locator(".qi", { hasText: "INC20499" }).click(); await hd.getByRole("button", { name: "Assign to me and start" }).click(); await page.waitForTimeout(200);
    await page.getByRole("button", { name: /^Walk to Dev's desk/ }).first().click(); await page.waitForSelector(".wo-desk", { timeout: 90000 });
    { const mo = page.locator(".wo-monitor"); await mo.getByRole("button", { name: "Let Dev sign in to Ubuntu", exact: true }).click();
      for (const l of ["sudo apt update", "apt list --upgradable", "sudo do-release-upgrade"]) { await mo.locator('[id^="ub-in-"]').fill(l); await mo.locator('[id^="ub-in-"]').press("Enter"); await page.waitForTimeout(100); } }
    await sweep(tag + ": FS6, apt update, the upgradable list, and the release upgrade's question");
    await page.locator(".wo-back").click({ timeout: 60000 }); await page.waitForSelector(".walkover", { state: "detached", timeout: 90000 });
  }

  try {
    /* PASSES=dark runs one theme, for chasing a failure quickly */
    /* PASSES=dys runs only dark with dyslexia text */
    if (process.env.PASSES !== "dys") await pass("dark", false);
    if (process.env.PASSES !== "dark" && process.env.PASSES !== "dys") await pass("light", false);
    if (process.env.PASSES !== "dark") await pass("dark", true);
  } catch (e) { await page.screenshot({ path: (process.env.SHOT || "/tmp") + "/contrast-drive-error.png" }).catch(() => {}); found.set("DRIVE ERROR", { key: "DRIVE ERROR after '" + where + "': " + String(e.message).split("\n")[0], worst: 0, need: 7, states: new Set(["-"]), sample: "" }); }
  await B.close(); S.close();
  return [...found.values()].sort((a, b) => a.worst - b.worst);
}

const PLANTS = {
  "sky-blue primary buttons (the old sims' dashboard)": ".b.pri, .w-btn.primary { background: #38bdf8 !important; color: #ffffff !important; border-color: #38bdf8 !important; }",
  "a ruled-out cause's reason dimmed to show it is ruled out": ".opt2.out .ow { color: #9ca3af !important; }",
  "Mason's struck moves faded": ".narrow2 .struck { opacity: 0.45 !important; }",
  "grey text at the desk after the walk-over": ".wo-state { color: #6b7280 !important; }",
  "the cutscene's place line in a dim yellow": ".cine-s { color: #8a7a1c !important; }",
  "a checked PC's tick in a pale green": ".dev-t td.dev-ok { color: #4ade80 !important; }",
  "Mail's link line in a faint grey": ".mx-linkbar { color: #9ca3af !important; }",
  "a flagged-message banner in a pale amber": ".mx-flag { color: #c79a1a !important; }",
  "text typed into a field in a faint grey": ".field, .w-input { color: #9ca3af !important; }",
  "a ruled-out exam option's reason dimmed": ".ex-o.out .ow { color: #9a6b6b !important; }",
  "the blue screen's text in a muted blue": ".ex-bsod { color: #7d8db8 !important; }",
  "the router app's not-saved bar in a dim amber": ".rt-state.warn { color: #8a7a1c !important; }",
  "a device's not-connected reason in a pale red": ".rt-t td.rt-bad { color: #e08a8a !important; }",
  "a device's label on the floor plan in a faint grey": ".fp-dev, .fp-room { color: #8b93a1 !important; }",
  "the forward form's labels in a faint grey": ".rt-add label, .rt-f label { color: #8b93a1 !important; }",
  "the browser's address and sign-in labels in a faint grey": ".wb-url, .wb-login label { color: #8b93a1 !important; }",
  "a process's file path in a faint grey": ".ex-tmp { color: #8b93a1 !important; }",
  "the diagram's numbered slots in a pale blue": ".ex-slot { background: #7fb2ff !important; }",
  "the Wi-Fi scan's overlap line in a pale red": ".rt-clash.bad { color: #e08a8a !important; }",
  "the footer, below the fold, in a faint grey": "footer.under p { color: #5b6270 !important; }",
  "the street's band chart in pale bars": ".sv-bar { background: #8da2d6 !important; }",
  "the customer chat's mood words in a faint grey": ".cc-mood-n, .cc-mood-l { color: #8b93a1 !important; }",
  "Mobile devices' failed sync in a pale red": ".mdm-res.bad { color: #e08a8a !important; }",
  "the extra-training badge in a faint purple": ".badge.b-extra { color: #9b87c9 !important; }",
  "Previous Versions' rows in a faint grey": ".props .ev-table td { color: #9ca3af !important; }",
  "File History's message in a faint grey": ".fh-msg, .dlg-error { color: #8b93a1 !important; }",
  "the reconnect-your-drive warning in a dim amber": ".fh-warn { color: #a08a30 !important; }",
  "the backup's date in a faint grey": ".fh-nav .fh-state { color: #9ca3af !important; }",
  "a phone's problem rows in a pale red": ".ph-row.ph-bad .ph-v, .ph-row.ph-alert { color: #d08080 !important; }",
  "the phone's On/Off switches in a faint grey": ".ph-switch:not(.on) { color: #9ca3af !important; }",
  "the phone's status bar in a faint grey": ".ph-status { color: #9ca3af !important; }",
  "the firmware's text in a dim blue": ".fw p:not(.fw-brand):not(.fw-keys) { color: #5a6f9e !important; }",
  "Setup's partition rows in a faint grey": ".ws-table td { color: #9ca3af !important; }",
  "Setup's refusal in a pale red": ".ins-err { color: #e08a8a !important; }",
  "the first-run setup's Sign-in options link in a pale blue": ".oobe-link { color: #7fa6e0 !important; }",
  "Health Check's failing rows in a pale red": ".hc-row.hc-bad { color: #e08a8a !important; }",
  "GRUB's menu in a dim grey": ".grub-btn:not(.first), .grub-foot { color: #6b7280 !important; }",
  "the terminal's prompt in a dark green": ".ub-prompt { color: #166534 !important; }",
  "the Mac's Recovery list in a faint grey": ".mac-item, .mac-sub { color: #9ca3af !important; }",
  "the new phone's compliance line in a faint grey": ".np-comp, .np-comp strong { color: #9ca3af !important; }",
  "File Explorer's drive bar in a faint grey": ".fx-drive, .fx-drive span { color: #b4bcc8 !important; }",
  "the feature update's card in a faint grey": ".wu .wu-card, .wu .wu-card p, .wu .wu-card h5 { color: #a3abb8 !important; }",
  "Activation's edition and state in a faint grey": ".activation dd, .activation dt { color: #a3abb8 !important; }"
};
const plant = process.argv.includes("--plant");
if (!plant) {
  const list = await run();
  for (const e of list) console.log(e.worst.toFixed(2) + ":1 < " + e.need + "  " + e.key + '  "' + e.sample + '"  [' + [...e.states].join("; ") + "]");
  if (list.length) { console.log(list.length + " colour pair(s) under the floor"); process.exit(1); }
  console.log("PASS — every text run meets AAA on painted pixels, in dark, light, and dark with dyslexia text");
} else {
  let bad = 0;
  /* SHARD=i/n runs every n-th plant, so the list can be split across processes */
  const sh = (process.env.SHARD || "0/1").split("/").map(Number);
  for (const [name, css] of Object.entries(PLANTS).filter(([n], i) => (!process.env.ONLY || n.indexOf(process.env.ONLY) >= 0) && i % sh[1] === sh[0])) {
    const list = await run(css);
    if (list.length && !list.some((e) => /DRIVE ERROR/.test(e.key))) console.log("caught   " + name + "  →  " + list[0].worst.toFixed(2) + ":1 " + list[0].key);
    else { console.log("MISSED   " + name + (list.length ? " (" + list[0].key + ")" : "")); bad++; }
  }
  if (bad) { console.log(bad + " plant(s) not caught"); process.exit(1); }
  console.log("every plant caught (" + Object.keys(PLANTS).length + ")");
}
