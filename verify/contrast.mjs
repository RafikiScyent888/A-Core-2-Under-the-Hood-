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
   at a desk after the walk-over. Dark, light, and dark with dyslexia text.

   It does not measure text behind a modal's scrim, under the Start menu
   or Run box, scrolled out of its own box, inside a closed <details>, or
   covered (even partly) by another window or a notification.
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
          const mine = (px, py) => { const top = document.elementFromPoint(px, py); return top && (top === el || el.contains(top) || top.contains(el)); };
          if (![[0.5, 0.5], [0.1, 0.2], [0.9, 0.2], [0.1, 0.85], [0.9, 0.85]].every(([fx, fy]) => mine(x0 + (x1 - x0) * fx, y0 + (y1 - y0) * fy))) continue;
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
    await page.getByRole("button", { name: "Walk back to your desk" }).click(); await page.waitForSelector(".walkover", { state: "detached", timeout: 90000 });
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
  "sky-blue primary buttons (the old sims' dashboard)": ".b.pri, .w-btn.primary { background: #38bdf8 !important; color: #ffffff !important; border-color: #38bdf8 !important; }",
  "a ruled-out cause's reason dimmed to show it is ruled out": ".opt2.out .ow { color: #9ca3af !important; }",
  "Mason's struck moves faded": ".narrow2 .struck { opacity: 0.45 !important; }",
  "grey text at the desk after the walk-over": ".wo-state { color: #6b7280 !important; }"
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
