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

   The states driven: the job picker; a running stage with wrong picks,
   rungs 1 to 3 and a finished step; Task Manager sorted, a row selected
   and a row ruled out; a console with a refusal and its "what just
   happened" line; the UAC prompt and the credential prompt; the Start
   menu; the desk controls in every state; Disk Management with MBR's
   unreachable block, and the wizard and Initialize dialogs; the blue
   screen; the screen switched off; no Explorer; the mechanism panel;
   instructor mode; the finished job. Dark, light, and dark with the
   dyslexia setting on.
   ===================================================================== */
import { serve, browser } from "./serve.mjs";
const ROOT = new URL("..", import.meta.url).pathname;

const lum = (c) => { const f = (v) => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

export async function run(extraCss) {
  const S = serve(ROOT);
  const B = await browser();
  const page = await B.newPage({ viewport: { width: 1400, height: 1000 } });
  page.setDefaultTimeout(5000);
  const found = new Map();
  if (extraCss) await page.addInitScript((css) => { document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); }); }, extraCss);

  async function sweep(state) {
    await page.waitForTimeout(250);
    const runs = await page.evaluate(() => {
      const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
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
          const r = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
          if (r.width > 4 && r.height > 6)
          out.push({ t: n.textContent.trim().slice(0, 40), c: cs.color, op, s: parseFloat(cs.fontSize), b: parseInt(cs.fontWeight) >= 700, x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height, el: desc(el) });
        }
      }
      /* inputs carry their text in a value, not a text node */
      document.querySelectorAll("input[type=text],input:not([type]),input[type=password]").forEach((i) => {
        if (!i.value || i.offsetParent === null) return; const r = i.getBoundingClientRect(); const cs = getComputedStyle(i);
        out.push({ t: "[input] " + i.value.slice(0, 30), c: cs.color, op: 1, s: parseFloat(cs.fontSize), b: false, x: r.x + scrollX + 4, y: r.y + scrollY + 4, w: Math.min(r.width - 8, 60), h: r.height - 8, el: "input." + i.className });
      });
      return out;
    });
    const tag = await page.addStyleTag({ content: "*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important}" });
    const png = await page.screenshot({ fullPage: true });
    await tag.evaluate((t) => t.remove());
    const bgs = await page.evaluate(async ({ b64, runs }) => {
      const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0);
      return runs.map((r) => { const w = Math.max(1, Math.round(r.w - 4)), h = Math.max(1, Math.round(r.h - 4));
        if (r.x + 2 >= img.width || r.y + 2 >= img.height) return [];
        const d = x.getImageData(Math.round(r.x + 2), Math.round(r.y + 2), w, h).data, cnt = {}; let tot = 0;
        for (let i = 0; i < d.length; i += 4) { const k = d[i] + "," + d[i + 1] + "," + d[i + 2]; cnt[k] = (cnt[k] || 0) + 1; tot++; }
        return Object.entries(cnt).filter(([, v]) => v / tot >= 0.08).map(([k]) => k.split(",").map(Number)); });
    }, { b64: png.toString("base64"), runs });
    runs.forEach((r, i) => {
      const m = r.c.match(/[\d.]+/g).map(Number); const a = (m[3] ?? 1) * r.op;
      const need = (r.s >= 24 || (r.s >= 18.66 && r.b)) ? 4.5 : 7;
      let worst = 99, wbg = null;
      for (const bg of bgs[i]) { const fg = [0, 1, 2].map((k) => m[k] * a + bg[k] * (1 - a)); const q = ratio(fg, bg); if (q < worst) { worst = q; wbg = bg; } }
      if (worst < need) {
        const key = r.el.split(" > ").pop() + " | " + r.c + " on rgb(" + wbg + ")";
        const e = found.get(key) || { key, worst: 99, need, states: new Set(), sample: r.t };
        e.worst = Math.min(e.worst, worst); e.states.add(state); found.set(key, e);
      }
    });
  }

  const cur = () => page.evaluate(() => { const r = window.__C2UTH.runner(); return r ? r._state().current : null; });
  async function choose(label) { await page.locator(".step.now .opt", { hasText: label }).first().click(); await page.waitForTimeout(100); }
  async function type(cmd) { const i = page.locator(".con-in").last(); await i.fill(cmd); await i.press("Enter"); await page.waitForTimeout(100); }
  async function hw(label) { await page.locator(".bench-act", { hasText: label }).first().click(); await page.waitForTimeout(120); }
  async function next() { await page.click(".stage-nav >> text=/Next stage|Finish the job/"); await page.waitForTimeout(500); }
  const J = async (k) => page.evaluate(async (k) => { const L = await import("./assets/lab-tools.js"); return JSON.parse(JSON.stringify(L.jobByKey(k))); }, k);

  async function pass(theme, reading) {
    const tag = theme + (reading ? "+dyslexia" : "");
    await page.goto(S.url + "/index.html");
    await page.evaluate(([t, r]) => { localStorage.clear(); localStorage.setItem("uthl.theme.v1", t); if (r) localStorage.setItem("uthl.reading.v1", "dyslexia"); }, [theme, reading]);
    await page.reload(); await page.waitForTimeout(300);
    await sweep(tag + ": job picker");
    /* the parish job: standard user, so the credential prompt appears */
    await page.check("input[name=job][value=staldric]"); await page.click("text=Start this job"); await page.waitForTimeout(400);
    const j = await J("staldric");
    for (let i = 0; i < 4; i++) await choose(j.desk.wrong[i][0]);
    await page.locator(".mech summary").click();
    await sweep(tag + ": desk stage, four wrong picks, rung 2, mechanism open");
    await choose(j.desk.correct); await sweep(tag + ": desk stage finished");
    await next();
    await page.click("text=Ctrl + Shift + Esc");
    await page.locator(".th-btn", { hasText: "CPU" }).click();
    await page.locator(".tm-row", { hasText: "Microsoft Outlook" }).first().click(); await page.click("text=This is the cause");
    await page.locator(".tm-row", { hasText: "Microsoft Edge" }).first().click(); await page.click("text=This is the cause");
    await page.locator(".tm-row", { hasText: "Microsoft OneDrive" }).first().click(); await page.click("text=This is the cause");
    await page.locator(".tm-row", { hasText: "Excel" }).first().click();
    await sweep(tag + ": Task Manager sorted, rows ruled out, one selected, rung 1");
    await page.click("text=This is the cause");
    await choose(j.slow.remedies.correct[1]);
    await page.locator(".tm-row", { hasText: "Excel" }).first().click(); await page.locator(".tm-tools button", { hasText: "End task" }).click();
    await sweep(tag + ": Task Manager after End task");
    await page.click(".tb-start"); await sweep(tag + ": Start menu");
    await page.click(".tb-start");
    await next();
    await page.click(".tb-start"); await page.locator(".sm-app", { hasText: "Command Prompt" }).locator("text=Open").click();
    for (let i = 0; i < 5; i++) await type("sfc /scannow");
    await page.locator(".mech summary").click();
    for (let k = 0; k < 4; k++) await page.click(".mech-bar >> text=Next");
    await sweep(tag + ": console with refusals, what-just-happened, rung 3");
    await page.click(".tb-start"); await page.locator(".sm-app", { hasText: "Command Prompt" }).locator("text=Run as administrator").click();
    await page.fill("#uac-u", "wrong"); await page.fill("#uac-p", "nope"); await page.click(".w-dialog.uac-creds >> text=Yes");
    await sweep(tag + ": UAC credential prompt with its error");
    await page.fill("#uac-u", "itadmin"); await page.fill("#uac-p", "Bench-Tech-2026"); await page.click(".w-dialog.uac-creds >> text=Yes");
    await type("sfc /scannow");
    await choose((await page.evaluate(async () => { const L = await import("./assets/lab-tools.js"); return L.buildStage("admin", L.jobByKey("staldric")).steps[1].answer; })));
    await next();
    await page.fill(".num-in", "12000"); await page.click(".numbox >> text=Check");
    await sweep(tag + ": calculation tried and wrong");
    await page.fill(".num-in", (j.disk.bytes / 1073741824).toFixed(2)); await page.click(".numbox >> text=Check");
    await hw("Remove the side panel"); /* refused: running */
    await page.click(".tb-start"); await page.click(".sm-power >> text=Shut down");
    await sweep(tag + ": screen off, a refused desk action");
    for (const a of ["Unplug the mains lead", "Remove the side panel", "Fit the drive in the drive cage", "Connect the SATA data cable", "Connect the SATA power lead"]) await hw(a);
    await sweep(tag + ": case open, drive cabled");
    for (const a of ["Refit the side panel", "Plug the mains lead back in", "Press the power button"]) await hw(a);
    await page.click(".tb-start"); await page.locator(".sm-app", { hasText: "Disk Management" }).locator("text=Open").click();
    await page.fill("#uac-u", "itadmin"); await page.fill("#uac-p", "Bench-Tech-2026"); await page.click(".w-dialog.uac-creds >> text=Yes");
    await sweep(tag + ": Initialize Disk dialog");
    await page.check("#ps-MBR"); await page.click(".w-dialog.init >> text=OK");
    await page.locator(".dm-row").nth(1).locator(".dm-part.k-unalloc").first().click(); await page.click(".dm-acts >> text=New Simple Volume");
    await sweep(tag + ": Disk Management, MBR unreachable block, wizard");
    await page.click(".w-dialog.wizard >> text=Cancel");
    await page.click("text=Put the PC back to the last point you got right");
    /* instructor mode, then the blue screen and no Explorer, on a fresh job */
    await page.click("#instructorBtn"); await page.fill("#pin-in", "3693"); await page.press("#pin-in", "Enter"); await page.waitForTimeout(300);
    await sweep(tag + ": instructor mode, answers and job sheet");
    await page.click("#instructorBtn");
    await page.click("text=Back to the jobs"); await page.check("input[name=job][value=harbourside]"); await page.click("text=Start this job"); await page.waitForTimeout(300);
    await choose((await J("harbourside")).desk.correct); await next();
    await page.click("text=Ctrl + Shift + Esc");
    await page.locator(".tm-row", { hasText: "Windows Explorer" }).first().click(); await page.locator(".tm-tools button", { hasText: "End task" }).click();
    await sweep(tag + ": no Explorer");
    await page.locator(".tm-row", { hasText: "Client Server Runtime" }).first().click(); await page.locator(".tm-tools button", { hasText: "End task" }).click();
    await sweep(tag + ": critical-process warning");
    await page.locator(".w-dialog.confirm-critical button", { hasText: "Shut down" }).click();
    await sweep(tag + ": blue screen");
  }

  try {
    await pass("dark", false);
    await pass("light", false);
    await pass("dark", true);
  } catch (e) { found.set("DRIVE ERROR", { key: "DRIVE ERROR: " + String(e.message).split("\n")[0], worst: 0, need: 7, states: new Set(["-"]), sample: "" }); }
  await B.close(); S.close();
  return [...found.values()].sort((a, b) => a.worst - b.worst);
}

const PLANTS = {
  "sky-blue buttons": ".btn.primary { background: #38bdf8 !important; color: #ffffff !important; }",
  "faded disabled buttons": ".btn:disabled, .w-btn:disabled { opacity: 0.4 !important; }",
  "grey Task Manager text": ".tm-table td { color: #9ca3af !important; }"
};
const plant = process.argv.includes("--plant");
if (!plant) {
  const list = await run();
  for (const e of list) console.log(e.worst.toFixed(2) + ":1 < " + e.need + "  " + e.key + '  "' + e.sample + '"  [' + [...e.states].join("; ") + "]");
  if (list.length) { console.log(list.length + " colour pair(s) under the floor"); process.exit(1); }
  console.log("PASS — every text run meets AAA on painted pixels, in dark, light, and dark with dyslexia text");
} else {
  let bad = 0;
  for (const [name, css] of Object.entries(PLANTS)) {
    const list = await run(css);
    if (list.length && !list.some((e) => /DRIVE ERROR/.test(e.key))) console.log("caught   " + name + "  →  " + list[0].worst.toFixed(2) + ":1 " + list[0].key);
    else { console.log("MISSED   " + name + (list.length ? " (" + list[0].key + ")" : "")); bad++; }
  }
  if (bad) { console.log(bad + " plant(s) not caught"); process.exit(1); }
  console.log("every plant caught (" + Object.keys(PLANTS).length + ")");
}
