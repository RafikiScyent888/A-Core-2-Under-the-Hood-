/* The order six options are shown in: the same on every machine (so a
   class can talk one through), and with the right answer in a different
   place from one question to the next. The options are authored
   right-answer-first; shown in that order, the first one would always
   be the answer. */
export function ordered(options, salt) {
  const h = function (s) { let v = 7; const k = salt + s; for (let i = 0; i < k.length; i++) v = (v * 31 + k.charCodeAt(i)) % 100003; return v; };
  return options.slice().sort(function (a, b) { return h(a.label) - h(b.label); });
}
