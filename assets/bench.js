/* =====================================================================
   A+ Core1 Under the Hood Labs — the bench host

   A bench is a canvas with a list of real controls beside it. This file
   owns the controls; the canvas is scenery.

   THAT ORDERING IS THE WHOLE POINT AND IT IS NOT A PREFERENCE.

   The scene engine marks its canvas `aria-hidden` and gives it tabIndex
   -1, deliberately, because a WebGL canvas is an opaque rectangle to a
   screen reader and does not reflow when a browser is zoomed to 400%.
   Students on this program have eye damage from military service. If the
   only way to pull a drive were to click a picture of one, the lab would
   be unusable by exactly the people it was built for.

   So every action lives in an ordinary HTML button with a real name. The
   3D view is a second rendering of the same state, and turning WebGL off
   costs the picture and nothing else. There is a test for that.

   ---------------------------------------------------------------------
   WHAT A CONTROL LOOKS LIKE

     { key, label, state, stateWords, detail, actions: [ {id, label, hint} ] }

   `key` matches a part key in the model spec, which is how selecting a
   control lights the right thing on the canvas. `stateWords` is the state
   in plain language and it is never optional — colour is a second channel
   here, never the only one.
   ===================================================================== */

import * as S from "./scene.js";

/* WHY A BENCH FELL BACK TO A FRESH CONTEXT.

   Re-specifying a live scene is the fast path and remounting is the
   safety net, and the net is silent by design — a spec the scene cannot
   take must not leave a dead canvas in front of a student. But a silent
   fallback also hides the bug that caused it, which is how this build
   ended up with a cracked-screen model that was drawn, verified,
   documented and unreachable.

   So every fallback records WHY, on a seam the verifier reads. Nothing in
   the page looks at this. */
function noteFallback(where, e) {
  try {
    window.__BENCH_FALLBACK = window.__BENCH_FALLBACK || [];
    window.__BENCH_FALLBACK.push(where + ": " + String((e && e.message) || e).slice(0, 200));
  } catch (e2) {}
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

/* ---------------------------------------------------------------------
   mountBench(host, opts)

     opts.spec()        returns the model spec for the CURRENT state
     opts.controls()    returns the control list for the CURRENT state
     opts.status()      returns { words, tone } for the headline banner
     opts.onAction(key, actionId)   → { say, settled }
     opts.height        canvas height, default 420

   Everything is a function rather than a value because the bench redraws
   itself from the lab's state after every action. The bench never holds a
   copy of that state — one source of truth, and no chance of the buttons
   and the picture disagreeing, which is the bug this shape exists to make
   impossible.
   --------------------------------------------------------------------- */
export function mountBench(host, opts) {
  /* `let` rather than `const`: the model dock re-targets one bench at a
     different machine between stages instead of building a new one. */
  let height = opts.height || 420;
  let handle = null;
  let selected = null;

  host.innerHTML = "";
  host.classList.add("bench");

  /* The canvas keeps a light ground in both themes, the way the Field
     Service Center's models do — a lit surface's contrast is a function of
     the lighting rather than of a token, so it is held still. */
  const stage = el("div", "bench-stage");
  stage.style.setProperty("--paper", "#e9edee");

  const banner = el("div", "bench-status");
  banner.setAttribute("role", "status");

  /* Consequences are announced, not just printed. `polite` rather than
     `assertive`: losing an array is bad news, but interrupting somebody
     mid-sentence to say so is worse, and the text stays on screen. */
  const say = el("div", "bench-say");
  say.setAttribute("role", "status");
  say.setAttribute("aria-live", "polite");

  const list = el("ul", "bench-parts");
  list.setAttribute("aria-label", "The hardware on this bench");

  const noGL = el("p", "bench-nogl");
  noGL.textContent = "The 3D view is off, so this bench is showing its controls only. " +
    "Everything still works — the picture was never the interface.";
  noGL.hidden = true;

  host.appendChild(banner);
  host.appendChild(stage);
  host.appendChild(noGL);
  host.appendChild(list);
  host.appendChild(say);

  /* ONE CONTEXT PER BENCH, FOR THE LIFE OF THE BENCH.

     This function used to empty `stage` and call `mountScene` again on
     every redraw — which is after every action a student takes. It never
     called the old handle's `dispose()`, so each click abandoned a live
     WebGL renderer, its geometry, its materials and its environment probe.

     Measured on the RAID bench before the fix: twenty actions created
     FORTY contexts and the browser destroyed THIRTEEN of them. Browsers
     cap contexts around sixteen and drop the oldest silently, so the
     symptom was never an error — it was the bench going blank part-way
     through a long stage, which reads as the lab breaking.

     The scene can now be re-specified in place, so the context is created
     once and the model swapped inside it. `keepView` is true here because
     this is always the SAME bench in a NEW STATE: the student may have
     turned it to look at something, and an action should not yank the
     camera back to where it started. */
  function drawScene() {
    if (!S.sceneSupported()) { noGL.hidden = false; handle = null; return; }
    if (handle) {
      try { handle.setSpec(opts.spec(), true); if (selected) handle.select(selected); return; }
      catch (e) {
        /* A spec the live scene cannot take is not a reason to leave a
           dead canvas on the page. Fall through and mount a fresh one —
           and dispose the old first, which is the whole point of this. */
        noteFallback("drawScene", e);
        try { handle.dispose(); } catch (e2) {}
        handle = null;
      }
    }
    stage.innerHTML = "";
    handle = S.mountScene(stage, opts.spec(), { height: height });
    /* mountScene returns null when the context cannot be created — a
       machine with WebGL blocked rather than absent. Same outcome, and it
       must not be reported as a working canvas. */
    if (!handle) noGL.hidden = false;
    else if (selected) handle.select(selected);
  }

  function drawStatus() {
    const st = opts.status ? opts.status() : null;
    banner.innerHTML = "";
    if (!st) { banner.hidden = true; return; }
    banner.hidden = false;
    banner.className = "bench-status tone-" + (st.tone || "calm");
    banner.appendChild(el("strong", "bench-status-word", st.words));
    if (st.detail) banner.appendChild(el("span", "bench-status-detail", st.detail));
  }

  function pick(key, quiet) {
    selected = (selected === key) ? null : key;
    if (handle) handle.select(selected);
    /* aria-pressed rather than a class, so the state is in the
       accessibility tree and not only in the paint. */
    Array.from(list.querySelectorAll(".bench-part-name")).forEach(b => {
      b.setAttribute("aria-pressed", String(b.dataset.key === selected));
    });
    /* THE BENCH CAN NOW BE THE ANSWER SURFACE.

       A question of kind "pick" is answered by choosing a part rather
       than by choosing from a list of sentences underneath. The bench
       still owns no state and decides nothing — it reports the choice
       and the question marks it. `quiet` is for a programmatic select
       (a reset, a reveal) that should not count as the student
       answering. */
    if (!quiet && selected && typeof opts.onPick === "function") opts.onPick(selected);
  }

  function act(key, id) {
    const r = opts.onAction(key, id) || {};
    if (r.say) say.textContent = r.say;
    /* Redraw everything from the lab's state. The bench holds none of it. */
    drawStatus();
    drawControls();
    drawScene();
    if (r.flash && handle) handle.flash(r.flash);
  }

  function drawControls() {
    list.innerHTML = "";
    opts.controls().forEach(c => {
      const li = el("li", "bench-part");

      const name = el("button", "bench-part-name");
      name.type = "button";
      name.dataset.key = c.key;
      name.setAttribute("aria-pressed", String(selected === c.key));
      name.appendChild(el("span", "bench-part-label", c.label));
      /* The state in words, always. A student who cannot tell amber from
         red — or who is reading this with the canvas switched off — gets
         exactly the same information as somebody looking at the lamp. */
      name.appendChild(el("span", "bench-part-state s-" + (c.state || "none"), c.stateWords));
      if (c.detail) name.appendChild(el("span", "bench-part-detail", c.detail));
      name.addEventListener("click", () => pick(c.key));
      li.appendChild(name);

      if (c.actions && c.actions.length) {
        const acts = el("div", "bench-acts");
        c.actions.forEach(a => {
          const b = el("button", "bench-act");
          b.type = "button";
          b.textContent = a.label;
          /* An action's name has to say what it does to WHICH thing, or a
             screen reader reads "Pull, Pull, Pull, Pull" down the column
             and the student has to count rows to know where they are. */
          b.setAttribute("aria-label", a.label + " — " + c.label);
          if (a.hint) b.title = a.hint;
          b.addEventListener("click", () => act(c.key, a.id));
          acts.appendChild(b);
        });
        li.appendChild(acts);
      }
      list.appendChild(li);
    });
  }

  /* ------------------------------------------------------------------
     MOUSE OR KEYBOARD, ON EVERY BENCH.

     A part is already a real focusable button, so Tab and Enter have
     always worked. What did not exist was a way to DO the thing to the
     part you are looking at without hunting for its action button —
     which matters most on the benches where a part has exactly one
     obvious action, like a phone you are about to open.

     E is the key, and it is bound here rather than in any one lab so
     every bench in the build gets it at once. It fires the FIRST action
     of the selected part, which is the primary one by construction:
     controls list their actions in the order the lab wants them offered.

     Two things it deliberately does not do. It does not fire when the
     student is typing into a field, because E is a letter before it is
     a shortcut. And it does not invent an action where a part has none
     — a bench that answers a keypress with silence is better than one
     that does something the student did not ask for. */
  function keyAct(e) {
    if (e.key !== "e" && e.key !== "E") return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (!selected) return;
    const c = opts.controls().filter(x => x.key === selected)[0];
    if (!c || !c.actions || !c.actions.length) return;
    e.preventDefault();
    act(c.key, c.actions[0].id);
  }
  /* Bound on the bench container, not on each button: the part buttons
     live inside it, so a keypress while one has focus bubbles up here.
     One listener, and it keeps working when drawControls() replaces every
     button in the list. */
  host.addEventListener("keydown", keyAct);

  drawStatus();
  drawControls();
  drawScene();

  return {
    refresh: function () { drawStatus(); drawControls(); drawScene(); },
    announce: function (t) { say.textContent = t; },
    select: pick,
    /* Select without reporting it as an answer. */
    show: function (k) { pick(k, true); },
    /* Mark a part as wrong on the control list, so a wrong pick is
       visible where the student is looking rather than only in the
       feedback box below. */
    markWrong: function (k) {
      const b = list.querySelector('.bench-part-name[data-key="' + k + '"]');
      if (b) b.classList.add("bench-part-wrong");
    },
    lock: function () {
      Array.from(list.querySelectorAll(".bench-part-name")).forEach(b => { b.disabled = true; });
    },
    handle: function () { return handle; },
    /* POINT THIS BENCH AT A DIFFERENT MACHINE, keeping the context.

       The model dock is one bench for a whole run, so moving between
       stages swaps what it is showing rather than building a new one.
       Everything a bench knows about the lab lives in `opts` — spec,
       controls, status, onAction — so re-targeting is replacing that
       object and redrawing from it.

       `keepView` is passed through to the scene: the same machine in a
       new state keeps the student's orbit, a different machine takes its
       own framing. A rack arriving at a phone's camera distance is the
       failure this argument exists to prevent.

       The selection is dropped, always. A part key means something only
       within one machine, and carrying "bay6" onto a printer would
       highlight nothing while the control list said something was
       selected. */
    retarget: function (next, keepView) {
      opts = next;
      height = opts.height || height;
      selected = null;
      drawStatus();
      drawControls();
      if (handle) {
        try { handle.setSpec(opts.spec(), !!keepView); }
        catch (e) {
          noteFallback("retarget", e);
          try { handle.dispose(); } catch (e2) {} handle = null; drawScene();
        }
      } else drawScene();
    },
    /* RELEASE THE CONTEXT. The runner used to drop its array of bench
       handles on every stage change and let the garbage collector deal
       with it — which it cannot, because a WebGL context is not reclaimed
       by dropping a JavaScript reference to the object that made it. A
       bench that leaves the page has to say so. */
    dispose: function () {
      host.removeEventListener("keydown", keyAct);
      if (handle) { try { handle.dispose(); } catch (e) {} }
      handle = null;
    }
  };
}
