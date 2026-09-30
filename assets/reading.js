/* =====================================================================
   Reading settings — the dyslexia-friendly toggle

   One switch, remembered, applied before the page paints.

   WHY THERE IS NO DOWNLOADED FONT

   The obvious move is to pull OpenDyslexic or Atkinson Hyperlegible off a
   CDN. This build must work from a memory stick in a room with no network,
   which is a hard rule, so a webfont would either fail silently or hold the
   page up waiting for a request that is never going to be answered.

   The font stack below therefore NAMES those faces first, so a student or a
   lab machine that already has one installed gets it, and falls back to
   Verdana and Tahoma — wide, generously spaced, unambiguous letterforms
   that are on effectively every machine.

   The typography does most of the work anyway. What actually helps is
   spacing, weight and line length rather than the glyphs themselves:

     - more space between letters, words and lines
     - a shorter measure, so the eye finds the start of the next line
     - no italics — they smear at the exact sizes this matters at
     - no justified text, because rivers of white space are a reading trap
     - numbers that line up in columns

   ---------------------------------------------------------------------
   APPLIED BEFORE FIRST PAINT

   `boot()` is called from an inline script in the document head rather
   than from the module, because a module is deferred: the page would paint
   in the default face and then visibly reflow into the reading face a
   moment later. For somebody who needs this setting, being made to watch
   the page change under them is not a neutral cost.
   ===================================================================== */

const KEY = "uthl.reading.v1";

/* Storage throws outright in a private window, a browser set to block site
   data, or a thumbnailer. A remembered preference is worth having; losing
   it must never take the page down. */
function read() {
  try { return localStorage.getItem(KEY) || "default"; } catch (e) { return "default"; }
}
function write(v) {
  try { localStorage.setItem(KEY, v); } catch (e) { /* fine */ }
}

export function current() { return read(); }

export function apply(mode) {
  const m = mode === "dyslexia" ? "dyslexia" : "default";
  document.documentElement.setAttribute("data-reading", m);
  return m;
}

/* Called from the head, before anything paints. */
export function boot() { return apply(read()); }

export function set(mode) {
  const m = apply(mode);
  write(m);
  return m;
}

/* ---------------------------------------------------------------------
   The control.

   A real checkbox, labelled, in the tab order. Not an icon, and not a
   thing you have to find in a settings menu — the students who need it
   should meet it before they meet anything else.
   --------------------------------------------------------------------- */
export function mountToggle(host) {
  const wrap = document.createElement("div");
  wrap.className = "reading-toggle";

  const id = "reading-dyslexia";
  const box = document.createElement("input");
  box.type = "checkbox";
  box.id = id;
  box.checked = read() === "dyslexia";

  const label = document.createElement("label");
  label.setAttribute("for", id);
  label.textContent = "Dyslexia-friendly text";

  const note = document.createElement("span");
  note.className = "reading-note";
  note.textContent = "Wider spacing, shorter lines, no italics. Stays on.";

  box.addEventListener("change", () => {
    set(box.checked ? "dyslexia" : "default");
    /* Say what happened. A student using a screen reader gets no feedback
       at all from a visual reflow. */
    note.textContent = box.checked
      ? "Dyslexia-friendly text is on, and will stay on next time."
      : "Dyslexia-friendly text is off.";
  });

  wrap.appendChild(box);
  wrap.appendChild(label);
  wrap.appendChild(note);
  host.appendChild(wrap);
  return wrap;
}
