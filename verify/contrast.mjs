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

   The states driven: the Help Desk queue; a ticket's error box; Event
   Viewer with an error selected; a console with a refusal and its "what
   just happened" line; the clipboard at rungs 1 and 3; the Start menu
   and the Run box; Task Manager sorted with a row selected; Software
   Center; the UAC credential prompt with its error; Settings and the
   installer; File Explorer with a file selected; revert; Resolve refused;
   the close form with wrong picks red, rung 3 struck, the right answer,
   and a refused note; the closed ticket; the instructor PIN and answers;
   the critical-process warning, the blue screen and the restart note;
   no Explorer; the screen switched off. Dark, light, and dark with the
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

  let where = "start";
  async function sweep(state) {
    where = state;
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

  const scr = () => page.locator(".screen-host:not([hidden])");
  const machine = (host) => page.locator("#machines .mc", { hasText: host }).click();
  const startApp = async (label) => { await scr().getByRole("button", { name: "Start menu" }).click(); await scr().getByRole("button", { name: label }).click(); };
  const typed = async (line) => { const c = scr().locator(".con-in"); await c.fill(line); await c.press("Enter"); await page.waitForTimeout(80); };
  const okDialog = async () => { if (await scr().locator(".w-dialog").count()) await scr().locator(".w-dialog").getByRole("button", { name: "OK" }).click(); };
  const creds = async (u, pw) => { await scr().getByLabel("User name").fill(u); await scr().getByLabel("Password").fill(pw); await scr().locator(".w-dialog").getByRole("button", { name: "Yes" }).click(); };

  async function pass(theme, reading) {
    const tag = theme + (reading ? "+dyslexia" : "");
    await page.goto(S.url + "/index.html");
    await page.evaluate(([t, r]) => { localStorage.clear(); localStorage.setItem("c2vm.theme", t); if (r) localStorage.setItem("c2vm.reading", "dyslexia"); }, [theme, reading]);
    await page.reload(); await page.waitForTimeout(600);
    await sweep(tag + ": Help Desk queue, no ticket");
    await scr().getByRole("button", { name: "Open ticket L1" }).click();
    await scr().getByRole("button", { name: "Resolve" }).click();
    await sweep(tag + ": ticket open, Resolve refused while broken");
    await machine("WS4-FIN");
    await scr().getByRole("button", { name: /Open the Testing shortcut/ }).click();
    await sweep(tag + ": the program's error box");
    await okDialog();
    await startApp("Open Event Viewer"); await scr().locator(".ev-row.lvl-err").first().click();
    await sweep(tag + ": Event Viewer, error selected");
    await startApp("Open Command Prompt");
    for (const c of ['copy \\\\WS1-HR\\C$\\Windows\\SysWOW64\\msvcp100.dll "C:\\Program Files (x86)\\Testing"', "regsvr32 msvcp100.dll"]) await typed(c);
    await sweep(tag + ": console, a refusal, what just happened, rung 1");
    for (const c of ["setx PATH C:\\Temp", "setx PATH C:\\Temp2", "setx PATH C:\\Temp3"]) await typed(c);
    await sweep(tag + ": clipboard at rung 3, four moves struck");
    await scr().getByRole("button", { name: "Start menu" }).click(); await sweep(tag + ": Start menu");
    await scr().getByRole("button", { name: "Start menu" }).click();
    await page.getByRole("button", { name: /Windows and R/ }).click(); await scr().locator(".w-dialog.run input").fill("taskmgr"); await sweep(tag + ": Run box");
    await scr().locator(".w-dialog.run").getByRole("button", { name: "OK", exact: true }).click();
    await scr().locator(".th-btn", { hasText: "CPU" }).click(); await scr().locator(".tm-row").nth(2).click();
    await sweep(tag + ": Task Manager sorted, a row selected");
    await startApp("Open Software Center");
    await scr().getByRole("button", { name: /(Install|Repair) Microsoft Visual C\+\+ 2013/ }).click();
    await creds("itadmin", "wrong");
    await sweep(tag + ": UAC credential prompt with its error");
    await scr().locator(".w-dialog").getByRole("button", { name: "No" }).click();
    await sweep(tag + ": Software Center");
    await startApp("Open Settings"); await scr().getByRole("button", { name: "Modify Testing" }).click(); await creds("RAFIKI\\itadmin", "Bench-Tech-2026");
    await sweep(tag + ": Settings, the installer dialog");
    await scr().locator(".w-dialog").getByRole("button", { name: "Cancel" }).click();
    await startApp("Open File Explorer"); await scr().locator(".fx-addr").fill("C:\\Program Files (x86)\\Testing"); await scr().locator(".fx-addr").press("Enter");
    await scr().locator(".fx-f").first().click();
    await sweep(tag + ": File Explorer, a file selected");
    await page.getByRole("button", { name: "Revert to snapshot" }).click();
    await sweep(tag + ": reverted");
    await startApp("Open Software Center"); await scr().getByRole("button", { name: "Reinstall Testing 4.2" }).click(); await okDialog();
    await machine("TECH-01"); await scr().getByRole("button", { name: "Resolve" }).click();
    const opts = scr().locator(".hd-close .opt");
    for (const w of ["licence", "network", "profile", "updates"]) await opts.filter({ hasText: w }).first().click();
    await sweep(tag + ": close form, four red, rung 2");
    await opts.filter({ hasText: "Windows Security" }).first().click();
    await sweep(tag + ": close form, five red, rung 3");
    await opts.filter({ hasText: "dependency is missing" }).first().click();
    await scr().locator("#hd-note").fill("Fixed it for her."); await scr().getByRole("button", { name: "Close the ticket" }).click();
    await sweep(tag + ": right answer marked, note refused");
    await scr().locator("#hd-note").fill("Testing said MSVCP100.dll was missing. Reinstalled Testing from Software Center and tested it opens.");
    await scr().getByRole("button", { name: "Close the ticket" }).click();
    await sweep(tag + ": ticket closed");
    await page.click("#instructorBtn"); await sweep(tag + ": instructor PIN dialog");
    await page.fill("#pin-in", "3693"); await page.press("#pin-in", "Enter");
    await scr().getByRole("button", { name: "Open ticket D1" }).click();
    await sweep(tag + ": instructor mode, answers on the clipboard");
    await page.click("#instructorBtn");
    await machine("WS1-HR");
    await page.getByRole("button", { name: /Ctrl, Shift and Escape/ }).click();
    await scr().locator(".tm-row", { hasText: "Windows Explorer" }).first().click(); await scr().locator(".tm-tools button", { hasText: "End task" }).click();
    await sweep(tag + ": no Explorer");
    await scr().locator(".tm-row", { hasText: "Client Server Runtime" }).first().click(); await scr().locator(".tm-tools button", { hasText: "End task" }).click();
    await sweep(tag + ": critical-process warning");
    await scr().locator(".w-dialog button", { hasText: "Shut down" }).click();
    await sweep(tag + ": blue screen");
    await scr().getByRole("button", { name: "Let it restart" }).click();
    await sweep(tag + ": restarted, boot note");
    await scr().getByRole("button", { name: "Start menu" }).click(); await scr().locator(".sm-power").getByRole("button", { name: "Shut down" }).click();
    await sweep(tag + ": screen off");
  }

  try {
    await pass("dark", false);
    await pass("light", false);
    await pass("dark", true);
  } catch (e) { await page.screenshot({ path: (process.env.SHOT || "/tmp") + "/contrast-drive-error.png" }).catch(() => {}); found.set("DRIVE ERROR", { key: "DRIVE ERROR after '" + where + "': " + String(e.message).split("\n")[0], worst: 0, need: 7, states: new Set(["-"]), sample: "" }); }
  await B.close(); S.close();
  return [...found.values()].sort((a, b) => a.worst - b.worst);
}

const PLANTS = {
  "sky-blue primary buttons (the old sims' dashboard)": ".w-btn.primary, .btn.primary { background: #38bdf8 !important; color: #ffffff !important; }",
  "a ruled-out reason dimmed to show it is ruled out": ".hd-close .opt.out .opt-why { color: #9ca3af !important; }",
  "grey text in Task Manager's scrolled table": ".tm-table td { color: #9ca3af !important; }",
  "the clipboard's struck moves faded": ".narrow .struck { opacity: 0.45 !important; }"
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
