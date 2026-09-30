/* =====================================================================
   The hint ladder.

   STANDING RULE ACROSS THIS PROGRAM: start guiding after three wrong
   attempts, and never give the answer. Guide them to it until they get
   it right.

   These students work alone, as homework. Nobody is standing behind them
   to unstick them, so a question that can only be brute-forced is a
   question that teaches nothing — but a hint that names the answer is
   worse, because it looks like teaching and is not.

   The ladder:

     attempts 1-2   nothing. Let them think.
     attempt  3     rung 1 — point at the evidence. "Read the third line
                    of the brief again." Where to look, not what is there.
     attempt  4     rung 2 — the principle. The rule that decides it,
                    stated generally, with the specific case left to them.
     attempt  5     rung 3 — narrow the field. Wrong options are struck
                    through with the reason each one fails. Never down to
                    one: at least two always survive, so the last step is
                    still theirs.

   Rung 3 is deliberately the last. There is no rung that says the
   answer. A student who cannot get there from two live options and a
   stated principle needs the mechanism view above the question, not a
   bigger hint — and that is a content problem to fix, not a ladder to
   extend.
   ===================================================================== */

export const FIRST_RUNG = 3;   /* attempts before any guidance appears */
export const LAST_RUNG = 3;    /* rungs on the ladder */

/* Which rung an attempt count has earned. 0 means none yet. */
export function rungFor(attempts) {
  if (attempts < FIRST_RUNG) return 0;
  return Math.min(LAST_RUNG, attempts - FIRST_RUNG + 1);
}

/* The guidance to show, given a question and how many times they have
   been wrong. Returns null when they have not earned any yet.

   A question supplies `hints: [where, principle]` — two strings. The
   third rung is not authored per question: it is COMPUTED from the
   question's own wrong-answer reasons, so it can never drift out of
   step with the options actually on screen. That drift is the failure
   mode of every hand-written hint table in this program. */
export function guidanceFor(q, attempts) {
  const rung = rungFor(attempts);
  if (!rung) return null;
  const hints = q.hints || [];
  const opts = (q.options || []).length;

  /* SMALL OPTION SETS CHANGE THE MATHS. A question with four options
     gives a student only three wrong answers, so by the time the ladder
     starts, elimination has already left one option standing — and
     "read the brief again" is useless advice to somebody who has run
     out of things to try.

     The printer lab surfaced this: there are exactly four printing
     technologies, so its central question cannot have more. Rather than
     water down the rule the owner set (silence until three wrong), the
     ladder DELIVERS MORE PER RUNG when the field is small: rung 1
     carries the principle as well as the pointer, because the pointer
     alone has nowhere left to point. */
  if (rung === 1) {
    const where = hints[0] || defaultWhere(q);
    if (opts && opts <= 4) {
      return { rung: 1, kind: "where", text: where + " " + (hints[1] || defaultPrinciple(q)) };
    }
    return { rung: 1, kind: "where", text: where };
  }
  if (rung === 2) {
    return { rung: 2, kind: "principle", text: hints[1] || defaultPrinciple(q) };
  }
  return { rung: 3, kind: "narrow", text: narrowText(q), strike: strikeList(q) };
}

function defaultWhere(q) {
  return "Everything you need is already on this page. Read the brief again — " +
    "the number that decides this is in there.";
}

function defaultPrinciple(q) {
  return "Work out what the answer has to be TRUE of, then check each option " +
    "against that rather than looking for the one that feels right.";
}

/* Strike the clearly-wrong options, keeping at least two alive so the
   final choice is still the student's. Options carry their own `why`
   text — the reason that option fails — so the strike list explains
   itself instead of just dimming things. */
function strikeList(q) {
  const opts = q.options || [];
  const wrong = opts.filter(function (o) { return !o.correct && o.why; });
  const keepAlive = 2;
  const canStrike = Math.max(0, opts.length - keepAlive);
  return wrong.slice(0, canStrike).map(function (o) {
    return { key: o.key, why: o.why };
  });
}

function narrowText(q) {
  const n = strikeList(q).length;
  if (!n) {
    return "No more narrowing to do — work from the principle above and commit to one.";
  }
  return "Ruling out the ones that cannot be right, with the reason each fails. " +
    "What is left is yours to decide.";
}

/* ------------------------------------------------------------------
   Attempt bookkeeping. Kept here rather than in the runner so every
   lab counts the same way, and so the verifier can drive a question to
   rung 3 without knowing anything about the lab it came from.
   ------------------------------------------------------------------ */
export function makeTracker() {
  const attempts = {};
  return {
    wrong: function (key) { attempts[key] = (attempts[key] || 0) + 1; return attempts[key]; },
    count: function (key) { return attempts[key] || 0; },
    rung: function (key) { return rungFor(attempts[key] || 0); },
    reset: function (key) { delete attempts[key]; },
    all: function () { return Object.assign({}, attempts); }
  };
}
