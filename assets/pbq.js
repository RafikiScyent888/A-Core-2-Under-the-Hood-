/* =====================================================================
   The exam views' engine: a sim's own screen, as a set of fields, graded
   the program's way. No DOM, so verify/ runs it under Node.

   A field is either
     choice   one of its options (a question is six: one right, five near
              misses; a setting copies the real control, so a channel list
              has every channel)
     text     typed, compared exactly (an SSID or a password is exact)
   Check marks every field. A wrong value is kept, red, with its reason,
   until the field is right or the student resets (the standing rule).
   Every wrong value checked is one guess on the ladder: nothing on 1-2,
   rung 1 on 3, rung 2 on 4, rung 3 on 5 and every guess after. Rung 3
   strikes all but two of a choice field's options, a reason each.
   ===================================================================== */
export function rungFor(n) { return n < 3 ? 0 : Math.min(3, n - 2); }
export function fresh() { return { vals: {}, out: {}, ok: {}, guesses: 0, checks: 0, done: false }; }

function norm(f, v) { return f.kind === "text" ? String(v == null ? "" : v).trim() : v; }
export function rightValue(f) { return f.kind === "text" ? f.answer : f.options.filter(function (o) { return o.correct; })[0].label; }
export function isRight(f, v) { v = norm(f, v); return f.kind === "text" ? (f.loose ? String(v).toLowerCase() === String(f.answer).toLowerCase() : v === f.answer) : v === rightValue(f); }
export function whyWrong(f, v) {
  if (f.kind === "text") return (f.why && f.why(v)) || "That isn't what the scenario asks for. Read it again, word for word.";
  const o = f.options.filter(function (x) { return x.label === v; })[0]; return o ? o.why : "";
}
/* Check: grade every field the student has filled. */
export function check(v, st) {
  let wrong = 0, filled = 0;
  v.fields.forEach(function (f) {
    const val = st.vals[f.id]; if (val == null || val === "") return; filled++;
    if (isRight(f, val)) { st.ok[f.id] = true; return; }
    st.ok[f.id] = false; const o = st.out[f.id] = st.out[f.id] || [];
    const key = norm(f, val); if (o.indexOf(key) < 0) { o.push(key); wrong++; }
  });
  st.guesses += wrong; st.checks++;
  st.done = v.fields.every(function (f) { return st.ok[f.id]; });
  const missing = v.fields.filter(function (f) { const x = st.vals[f.id]; return x == null || x === ""; }).length;
  return { wrong: wrong, missing: missing, done: st.done };
}
export function set(st, f, value) { st.vals[f.id] = value; if (st.ok[f.id] && !isRight(f, value)) st.ok[f.id] = false; }
export function resetAll(st) { const g = st.guesses; const x = fresh(); x.guesses = g; return x; }
/* The field Mason is helping with: the first one not yet right. */
export function stuck(v, st) { return v.fields.filter(function (f) { return !st.ok[f.id]; })[0] || null; }
export function guidance(v, st) {
  const r = rungFor(st.guesses), f = stuck(v, st); if (!r || !f) return { rung: 0, field: f };
  const g = { rung: r, field: f, where: f.hint[0], principle: r >= 2 ? f.hint[1] : null };
  if (r === 3) {
    if (f.kind === "choice") {
      const right = rightValue(f), tried = st.out[f.id] || [];
      const pool = f.options.filter(function (o) { return !o.correct && tried.indexOf(o.label) < 0; });
      const from = (pool.length ? pool : f.options.filter(function (o) { return !o.correct; })).slice().sort(function (a, b) { return Math.abs(a.label.length - right.length) - Math.abs(b.label.length - right.length); });
      const keep = from.length ? from[0].label : null;
      g.strike = {}; f.options.forEach(function (o) { if (!o.correct && o.label !== keep) g.strike[o.label] = o.why || "Doesn't fit what the scenario says."; });
    } else g.narrow = f.hint[2] || f.hint[0];
  }
  return g;
}
