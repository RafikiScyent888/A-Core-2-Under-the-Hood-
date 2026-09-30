/* Seeded random. Every scenario in this build is reproducible from its
   seed, which is what makes a generated lab debuggable: a student can
   report "seed 4821 marked me wrong" and the exact scenario comes back.

   mulberry32 — small, fast, good enough spread for picking parts and
   sizes. Not for anything cryptographic, and nothing here is. */
export function rng(seed) {
  let a = (seed >>> 0) || 1;
  const next = function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next: next,
    int: function (lo, hi) { return lo + Math.floor(next() * (hi - lo + 1)); },
    pick: function (arr) {
      if (!arr || !arr.length) throw new Error("rng.pick: nothing to pick from");
      return arr[Math.floor(next() * arr.length)];
    },
    /* Fisher-Yates on a copy. Shuffling in place has bitten this project
       before — the caller's array is usually a shared constant table. */
    shuffle: function (arr) {
      const a2 = arr.slice();
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const t = a2[i]; a2[i] = a2[j]; a2[j] = t;
      }
      return a2;
    },
    /* n distinct picks. Throws rather than looping forever when asked
       for more than exist — the failure mode that hangs a page. */
    some: function (arr, n) {
      if (n > arr.length) {
        throw new Error("rng.some: asked for " + n + " of " + arr.length);
      }
      return this.shuffle(arr).slice(0, n);
    }
  };
}

/* A seed a student can read out loud. Six digits, no ambiguity. */
export function newSeed() {
  return 100000 + Math.floor(Math.random() * 899999);
}
