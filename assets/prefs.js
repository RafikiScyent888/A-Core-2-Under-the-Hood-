/* =====================================================================
   The three settings every Cyber Warrior site carries, written for this
   build: dyslexia-friendly text (it persists — on stays on, across pages
   and sessions), a light background (dark is the default), and
   instructor mode behind PIN 3693.

   The PIN keeps answers out of a student's WAY, not out of their reach:
   it is four digits in a static file. It does not persist, because these
   are shared classroom machines.
   ===================================================================== */
const READ = "c2vm.reading", THEME = "c2vm.theme";
function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

export function boot() {
  document.documentElement.setAttribute("data-reading", get(READ) === "dyslexia" ? "dyslexia" : "default");
  document.documentElement.setAttribute("data-theme", get(THEME) === "light" ? "light" : "dark");
}

function toggle(host, id, label, note, on, set) {
  const w = el("div", "setting"); const box = el("input"); box.type = "checkbox"; box.id = id; box.checked = on;
  const l = el("label", null, label); l.setAttribute("for", id); const n = el("span", "setting-note", note);
  box.addEventListener("change", function () { n.textContent = set(box.checked); });
  w.appendChild(box); w.appendChild(l); w.appendChild(n); host.appendChild(w);
}
export function mountReading(host) {
  toggle(host, "set-dyslexia", "Dyslexia-friendly text", "Wider spacing, shorter lines, no italics. Stays on.", get(READ) === "dyslexia", function (on) {
    put(READ, on ? "dyslexia" : "default"); document.documentElement.setAttribute("data-reading", on ? "dyslexia" : "default");
    return on ? "Dyslexia-friendly text is on, and will stay on next time." : "Dyslexia-friendly text is off.";
  });
}
export function mountTheme(host, onChange) {
  toggle(host, "set-light", "Light background", "Dark by default. Both are checked for contrast. Stays on.", get(THEME) === "light", function (on) {
    put(THEME, on ? "light" : "dark"); document.documentElement.setAttribute("data-theme", on ? "light" : "dark"); if (onChange) onChange();
    return on ? "Light background is on, and will stay on next time." : "Dark background is on, and will stay on next time.";
  });
}

let instructor = false; const subs = [];
export function isInstructor() { return instructor; }
export function onInstructor(f) { subs.push(f); }
export function mountInstructor(host) {
  const w = el("div", "setting"); const b = el("button", "btn", "Instructor mode"); b.type = "button"; b.id = "instructorBtn";
  const n = el("span", "setting-note", "For instructors: shows each ticket's answers. Students do not need it.");
  function say() { b.textContent = instructor ? "Instructor mode: on" : "Instructor mode"; b.setAttribute("aria-pressed", String(instructor)); n.textContent = instructor ? "Answers are shown on each ticket. Off when this page reloads." : "For instructors: shows each ticket's answers. Students do not need it."; }
  b.addEventListener("click", function () {
    if (instructor) { instructor = false; say(); subs.forEach(function (f) { f(); }); return; }
    askPIN(function () { instructor = true; say(); subs.forEach(function (f) { f(); }); });
  });
  w.appendChild(b); w.appendChild(n); host.appendChild(w); say();
}
function askPIN(ok) {
  const back = document.activeElement;
  const ov = el("div", "pin-ov"); const box = el("div", "pin-box"); box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-labelledby", "pin-h");
  const h = el("h2", null, "Instructor PIN"); h.id = "pin-h";
  const p = el("p", "setting-note", "This keeps the answers out of a student's way rather than out of their reach. Nothing private is behind it.");
  const lab = el("label", null, "PIN"); const inp = el("input"); inp.type = "password"; inp.id = "pin-in"; inp.inputMode = "numeric"; lab.setAttribute("for", "pin-in");
  const err = el("p", "pin-err"); err.hidden = true;
  const row = el("div", "pin-acts"); const go = el("button", "btn primary", "Unlock"); go.type = "button"; const no = el("button", "btn", "Cancel"); no.type = "button";
  function close() { ov.remove(); if (back && back.focus) back.focus(); }
  function tryIt() { if (inp.value.trim() === "3693") { close(); ok(); } else { err.hidden = false; err.textContent = "That is not the PIN. Nothing has changed."; inp.select(); } }
  go.addEventListener("click", tryIt); no.addEventListener("click", close);
  /* preventDefault: focus goes back to the Instructor button during this
     keydown, and the rest of the Enter press would click it again —
     turning instructor mode straight back off. */
  inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); tryIt(); } if (e.key === "Escape") { e.preventDefault(); close(); } });
  row.appendChild(go); row.appendChild(no);
  [h, p, lab, inp, err, row].forEach(function (x) { box.appendChild(x); });
  ov.appendChild(box); document.body.appendChild(ov); inp.focus();
}
