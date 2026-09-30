/* =====================================================================
   The order six options are shown in.

   sixOptions (options.js, from the Core 1 build) trims a longer list to
   six and places the right answer; a list of EXACTLY six it returns as
   authored — which put the right answer first on every question here
   the first time the page was driven. So every question is then ordered
   by a stable hash of its own labels: the same order on every machine
   (a question can be talked through with a class), and a different slot
   for the right answer from one question to the next.

   Its own file so the page and verify/logic.mjs use ONE ordering; the
   check that the right answer moves around is only worth anything if it
   measures the order the student actually sees.
   ===================================================================== */
import { sixOptions } from "./options.js";

export function shownSix(options, jobKey, stepKey) {
  const salt = jobKey.length * 131 + stepKey.length * 17;
  const six = sixOptions(options, salt);
  const h = function (x) {
    let v = salt + 7;
    const k = jobKey + stepKey + x.label;
    for (let i = 0; i < k.length; i++) v = (v * 31 + k.charCodeAt(i)) % 100003;
    return v;
  };
  return six.slice().sort(function (a, b) { return h(a) - h(b); });
}
