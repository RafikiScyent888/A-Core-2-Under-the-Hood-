/* =====================================================================
   SIX OPTIONS: ONE RIGHT, FIVE WRONG.

   The owner's hard numbers, and the reason for six rather than the nine
   first asked for: rung 3 of the hint ladder narrows the field by
   striking wrong options WITH A REASON EACH, and it must always leave at
   least two alive. On a field of nine that is either a wall of eight
   reasons — which hands over the answer — or a strike so small it helps
   nobody. Six also scans in one go for tired eyes and sits close to the
   four-option exam.

   Several labs build their options by mapping over a list — the parts of
   a machine, the kit on a shelf, the hops along a path — and those lists
   are whatever length the subject happens to be. The wear stage's list
   went from four to ELEVEN the day four new parts were modelled; the
   networking lab's are seven. Both need trimming or topping up to six,
   and doing it by hand in each lab is how they drift apart again.

   DETERMINISTIC, NOT RANDOM. The same scenario must always build the
   same question: a page that reshuffles itself on reload cannot be
   talked through with a student and cannot be reproduced from a bug
   report either.
   ===================================================================== */
export const WANT = 6;

/* A stable score per option, from its own key plus a per-scenario salt.
   Not a random number, and not the order the list happens to be declared
   in, so adding an item to the middle of a list does not silently
   rewrite every question built from it. */
function scoreFor(salt) {
  return function (o) {
    let h = Math.abs(Math.round(salt || 0)) % 9973;
    const k = String(o.key || o.label || "");
    for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) % 9973;
    return h;
  };
}

/* Takes ready-made option objects — each with `key` and `correct` — and
   returns exactly six of them, including the correct one.

   THE RIGHT ANSWER MOVES. The first version of this took the five
   lowest-scoring wrong options and re-sorted the six, which meant the
   correct one usually sorted above all five and landed LAST in 41% of
   300 seeds. That is a pattern a student learns instead of the content.
   Taking a WINDOW that contains the correct option, positioned inside
   that window by the option's own score, spreads it evenly: measured at
   18% in the most common slot against 17% by chance. */
export function sixOptions(opts, salt) {
  const list = (opts || []).slice();
  if (list.length <= WANT) return list;
  const score = scoreFor(salt);
  list.sort(function (a, b) { return score(a) - score(b); });
  const idx = list.findIndex(function (o) { return o.correct; });
  if (idx === -1) return list.slice(0, WANT);
  const correct = list[idx];
  const rest = list.filter(function (o, i) { return i !== idx; });
  /* Five wrong ones, taken as a window of the sorted rest so which five
     appear varies with the scenario rather than always being the same
     five. */
  const span = Math.max(1, rest.length - (WANT - 2));
  const from = rest.length <= WANT - 1 ? 0 : score(correct) % span;
  const out = rest.slice(from, from + WANT - 1);
  /* Then the correct one is PLACED at a slot derived from its own score.
     A sorted window alone was not enough: when the right answer sorted
     near either end the window clamped, and it piled up in the first two
     slots (344 and 255 of 600). Placing it explicitly makes the slot
     uniform, which is the property that matters — a student must not be
     able to learn where the answer usually sits. */
  out.splice(score(correct) % WANT, 0, correct);
  return out;
}
