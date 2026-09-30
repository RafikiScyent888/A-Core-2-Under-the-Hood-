/* =====================================================================
   INSTRUCTOR MODE — PIN 3693.

   The standing rule across the whole Cyber Warrior Program names this
   PIN, and every other site in the family has a mode behind it. This
   repo had the number written down in a comment and no implementation
   at all: `grep -rn "3693" assets/` returned prose and nothing else.

   ---------------------------------------------------------------------
   Copied from the Core 1 Under the Hood build, where it was written, with
   the job sheet and answers moved out: here the runner prints each step's
   declared answer under the step while the mode is on, and app.js draws
   the job sheet. Everything below about the PIN is unchanged.

   ---------------------------------------------------------------------
   THE PIN IS NOT SECURITY AND THIS FILE SAYS SO OUT LOUD

   It is four digits in a static JavaScript file served from GitHub
   Pages. Anybody who opens the developer tools has it, and a student who
   wants the answer key badly enough will find it in ninety seconds.

   That is FINE, and the reason it is fine decides what may go behind it.
   The PIN keeps the answers out of a student's WAY, not out of their
   reach — it stops a stage being accidentally spoiled by a panel they
   did not ask for. So nothing goes behind it that would hurt anybody who
   looked: no personal data, no marks, nothing about any other student.
   An answer key to an exercise with unlimited tries and unlimited hints
   is not a secret worth pretending to protect.

   It also DOES NOT PERSIST. A `let`, not localStorage, so it is gone on
   reload — because these are shared classroom machines, and a mode that
   survived the instructor walking away would hand the next student the
   answers with no PIN at all. The one place persistence would be
   convenient is the one place it would do harm.
   ===================================================================== */

const PIN = "3693";

let on = false;
const listeners = [];

export function isOn() { return on; }
export function onChange(fn) { listeners.push(fn); }
function fire() { listeners.forEach(function (fn) { try { fn(on); } catch (e) {} }); }

export function set(v) {
  const next = !!v;
  if (next === on) return on;
  on = next;
  document.documentElement.toggleAttribute("data-instructor", on);
  fire();
  return on;
}

/* ---------------------------------------------------------------------
   THE CONTROL. A real button beside the reading and theme toggles, in
   the tab order, saying what it is in words — the same contract those
   two keep. The overlay is a plain dialog built here rather than written
   into index.html, so the markup and the behaviour cannot drift apart.
   --------------------------------------------------------------------- */
export function mountToggle(host) {
  const wrap = document.createElement("div");
  wrap.className = "reading-toggle";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn ins-btn";
  btn.id = "instructorBtn";

  const note = document.createElement("span");
  note.className = "reading-note";

  function say() {
    btn.textContent = on ? "Instructor mode: on" : "Instructor mode";
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    note.textContent = on
      ? "Answers are shown on every stage, and the job sheet is below. Off when this page reloads."
      : "For instructors. Shows the answers and the job sheet. Students do not need it.";
  }

  btn.addEventListener("click", function () {
    if (on) { set(false); say(); return; }
    ask(function () { set(true); say(); });
  });

  wrap.appendChild(btn);
  wrap.appendChild(note);
  host.appendChild(wrap);
  say();
  onChange(say);
  return wrap;
}

/* The PIN prompt. Built and destroyed per use; focus goes into the field
   and comes back to the button, because a dialog that strands the
   keyboard is a dialog nobody can close. */
function ask(ok) {
  const back = document.activeElement;
  const ov = document.createElement("div");
  ov.className = "pin-ov";
  const box = document.createElement("div");
  box.className = "pin-box";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-labelledby", "pin-h");

  const h = document.createElement("h2");
  h.id = "pin-h";
  h.textContent = "Instructor PIN";
  const p = document.createElement("p");
  p.className = "note";
  /* SAY WHAT IT IS, ON THE SCREEN, not only in the source. An instructor
     deciding what to show on a projector deserves to know that this gate
     is a convenience rather than a lock. */
  p.textContent = "This keeps the answers out of a student's way rather than out of their "
    + "reach — it is four digits in a file anybody can read. Nothing private is behind it.";

  const lab = document.createElement("label");
  lab.setAttribute("for", "pin-in");
  lab.textContent = "PIN";
  const inp = document.createElement("input");
  inp.type = "password";
  inp.id = "pin-in";
  inp.inputMode = "numeric";
  inp.autocomplete = "off";

  const err = document.createElement("p");
  err.className = "pin-err";
  err.hidden = true;

  const acts = document.createElement("div");
  acts.className = "pin-acts";
  const go = document.createElement("button");
  go.type = "button";
  go.className = "btn primary";
  go.textContent = "Unlock";
  const no = document.createElement("button");
  no.type = "button";
  no.className = "btn";
  no.textContent = "Cancel";

  function close() {
    ov.remove();
    document.removeEventListener("keydown", esc, true);
    if (back && back.focus) back.focus();
  }
  function esc(e) {
    if (e.key === "Escape") { e.preventDefault(); close(); }
  }
  function tryIt() {
    if (inp.value.trim() === PIN) { close(); ok(); return; }
    err.hidden = false;
    /* The words change as well as anything else. Nothing in this build
       says "wrong" with colour alone. */
    err.textContent = "That is not the PIN. Nothing has changed.";
    inp.select();
  }
  go.addEventListener("click", tryIt);
  no.addEventListener("click", close);
  inp.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); tryIt(); }
  });
  ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
  document.addEventListener("keydown", esc, true);

  acts.appendChild(go);
  acts.appendChild(no);
  box.appendChild(h);
  box.appendChild(p);
  box.appendChild(lab);
  box.appendChild(inp);
  box.appendChild(err);
  box.appendChild(acts);
  ov.appendChild(box);
  document.body.appendChild(ov);
  inp.focus();
}

