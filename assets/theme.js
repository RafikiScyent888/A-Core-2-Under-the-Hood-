/* =====================================================================
   Light and dark — one switch, remembered, applied before the page paints.

   DARK IS THE DEFAULT, and the owner chose it. A student who has never
   touched the switch gets the dark ground this build was designed on.

   ---------------------------------------------------------------------
   BOTH THEMES ARE AAA, AND THAT IS THE WHOLE COST OF THIS FEATURE.

   Adding a second theme is five minutes of tokens and a day of proving
   them. These students have eye damage from military service: 7:1 for
   body text and 4.5:1 for large text is a medical accommodation, not a
   target. A light theme that is merely "not obviously broken" would hand
   half of them a page they cannot read, and it would do it quietly.

   So the contrast sweep in verify/verify.mjs drives EVERY view in BOTH
   themes, sampling painted pixels rather than reading the cascade. The
   theme is not shipped on the strength of the palette being sensible; it
   is shipped because every run of text in it was measured.

   ---------------------------------------------------------------------
   WHY THIS IS NOT `prefers-color-scheme`, AT ALL

   Two reasons, and the second is the one that settled it.

   The student has to be able to OVERRIDE the machine. A lab machine set
   to light by an administrator, or a phone that flips at sunset, would
   otherwise change the page under somebody who had found a setting that
   works for them.

   And DARK IS THE DEFAULT because the owner said so. An earlier cut used
   the OS as a first guess when nothing was stored, which sounds
   reasonable and meant the site came up LIGHT on any machine set to
   light — most lab machines, and most phones in daylight. "Default"
   means default.

   ---------------------------------------------------------------------
   APPLIED BEFORE FIRST PAINT

   `boot()` is called from an inline script in the head, not from this
   module, because a module is deferred: the page would paint dark and
   then flash white. Watching the page change under you is not a neutral
   cost for somebody whose sight is damaged — it is the thing a light
   theme exists to avoid.
   ===================================================================== */

const KEY = "uthl.theme.v1";

/* Storage throws outright in a private window, a browser set to block
   site data, or a thumbnailer. A remembered preference is worth having;
   losing it must never take the page down. */
function read() {
  try { return localStorage.getItem(KEY); } catch (e) { return null; }
}
function write(v) {
  try { localStorage.setItem(KEY, v); } catch (e) { /* fine */ }
}

/* DARK IS THE DEFAULT, FULL STOP, AND THE OS DOES NOT GET A VOTE.

   The first cut consulted `prefers-color-scheme` when there was no
   stored choice, on the reasoning that the machine's setting is a
   sensible first guess. It is not, here. The owner asked for dark as the
   default in those words, and the site came up LIGHT on any machine set
   to light — which is most lab machines and most phones in daylight.

   It was caught by looking at a screenshot of the front page, not by
   reading this file: the logic is correct for a site that wants to
   follow the system, and this one does not. The student's own choice is
   the only thing that changes it, and it persists. */
export function current() {
  const v = read();
  return v === "light" ? "light" : "dark";
}

export function apply(mode) {
  const m = mode === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", m);
  return m;
}

/* Called from the head, before anything paints. */
export function boot() { return apply(current()); }

export function set(mode) {
  const m = apply(mode);
  write(m);
  /* THE BENCHES HAVE TO HEAR ABOUT IT. A mounted scene reads its accent
     and edge colours off CSS custom properties ONCE, at mount, and the
     engine exposes `retheme()` for exactly this. Without the call, every
     bench on the page keeps the old theme's accent until the next stage
     change — the picture and the page disagreeing, which is the bug the
     whole one-source-of-truth arrangement exists to prevent. */
  try { if (window.__SCENE && window.__SCENE.retheme) window.__SCENE.retheme(); } catch (e) {}
  return m;
}

/* ---------------------------------------------------------------------
   The control.

   A real checkbox with a real label, in the tab order, beside the
   reading toggle — not an icon, and not buried in a settings menu. The
   students who need these settings should meet them before they meet
   anything else.

   It is phrased as "Light background" rather than as a sun-and-moon
   icon, because an icon pair is a picture of a metaphor and a phrase is
   a statement. It also reads correctly to a screen reader without any
   aria-label doing the work the visible text should be doing.
   --------------------------------------------------------------------- */
export function mountToggle(host) {
  const wrap = document.createElement("div");
  wrap.className = "reading-toggle";

  const id = "theme-light";
  const box = document.createElement("input");
  box.type = "checkbox";
  box.id = id;
  box.checked = current() === "light";

  const label = document.createElement("label");
  label.setAttribute("for", id);
  label.textContent = "Light background";

  const note = document.createElement("span");
  note.className = "reading-note";
  note.textContent = "Dark by default. Both are checked for contrast. Stays on.";

  box.addEventListener("change", () => {
    set(box.checked ? "light" : "dark");
    /* Say what happened. A student using a screen reader gets nothing at
       all from a visual repaint. */
    note.textContent = box.checked
      ? "Light background is on, and will stay on next time."
      : "Dark background is on, and will stay on next time.";
  });

  wrap.appendChild(box);
  wrap.appendChild(label);
  wrap.appendChild(note);
  host.appendChild(wrap);
  return wrap;
}
