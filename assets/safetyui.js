/* =====================================================================
   On the spot: the window where a safety job is worked (Core 2,
   Operational procedures, "Safety and communication").

   Left: the approved 3D models (mounted by the laptop into the stage it
   passes in), what you can see in words, and your hands, the ticket's
   actions grouped as the job is (Look never counts). Right: the person on
   the spot, their mood in words and a four-step meter, the conversation,
   and the six replies to choose from; a wrong reply stays in the
   conversation with how they took it, and stays red in the choices,
   marked three ways (colour, an inset rule, the words).

   A job that has to be done where the hazard is starts with a walk there.

   ctx: { ticket, fleet, sc, onSite, walk(), act(id, value), reply(label),
          strike(), revert(), view(name), stage (the 3D's element) }
   ===================================================================== */
import * as CH from "./chat.js";
import * as SF from "./safety.js";

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btn(text, cls, fn, label) { const b = el("button", cls, text); b.type = "button"; if (label) b.setAttribute("aria-label", label); b.addEventListener("click", fn); return b; }
function tag(name, b) { b.dataset.coach = name; return b; }
const MOOD_NOTE = ["happy to be helped", "wants this sorted quickly", "losing patience", "upset: put it right, calmly"];

export function drawSafety(host, ctx) {
  const t = ctx.ticket, f = ctx.fleet, x = ctx.sc;
  host.innerHTML = "";
  const head = el("div", "sf-head");
  head.appendChild(el("p", "t-id", "On the spot · " + t.place.where));
  head.appendChild(el("h3", "sf-title", t.title));
  host.appendChild(head);

  /* a job done where the hazard is: you have to go there first */
  if (!ctx.onSite) {
    const away = el("section", "macb-sec sf-away"); away.setAttribute("role", "status");
    away.appendChild(el("p", null, "You're at your bench in the network closet. " + t.who + " is at " + t.place.where + ": a safety job is done where the hazard is, not from your desk."));
    away.appendChild(tag("sf-walk", btn(t.place.go, "b pri", function () { ctx.walk(); })));
    host.appendChild(away);
    return;
  }
  const grid = el("div", "macb sfb"); host.appendChild(grid);
  const left = el("div", "macb-left"); grid.appendChild(left);
  left.appendChild(ctx.stage);
  const views = el("div", "macb-row"); views.setAttribute("role", "group"); views.setAttribute("aria-label", "Look at the models");
  t.views.forEach(function (v) { views.appendChild(btn(v[1], "b small", function () { ctx.view(v[0]); }, "Look at: " + v[1])); });
  left.appendChild(views);

  /* what you can see, in words */
  const see = el("section", "macb-sec sf-see"); see.appendChild(el("h3", null, "What you can see"));
  const ul = el("ul", "sf-list"); t.see(x.s, x).forEach(function (line) { ul.appendChild(el("li", null, line)); }); see.appendChild(ul);
  if (x.poison) { const p = el("p", "np-comp bad sf-poison"); p.setAttribute("role", "alert"); p.appendChild(el("strong", null, "⚠ Made worse: ")); p.appendChild(document.createTextNode(x.poison.text + " Revert to snapshot (at the foot of this window) goes back to before it.")); see.appendChild(p); }
  left.appendChild(see);

  /* your hands */
  const hands = el("section", "macb-sec sf-hands"); hands.appendChild(el("h3", null, "With your own hands"));
  if (x.msg && x.msg.text) { const m = el("p", "sf-msg" + (x.msg.bad ? " bad" : "")); m.setAttribute("role", "status"); m.appendChild(el("strong", null, x.msg.bad ? "✕ " : "→ ")); m.appendChild(document.createTextNode(x.msg.text)); hands.appendChild(m); }
  const groups = []; SF.available(t, x).forEach(function (a) { let g = groups.filter(function (q) { return q.name === a.group; })[0]; if (!g) { g = { name: a.group, acts: [] }; groups.push(g); } g.acts.push(a); });
  groups.forEach(function (g) {
    const box = el("div", "sf-group"); box.appendChild(el("h4", null, g.name));
    const row = el("div", "macb-row");
    g.acts.forEach(function (a) {
      if (a.choices) {
        const id = "sf-" + t.id + "-" + a.id, lab = el("label", "sf-choice"); lab.setAttribute("for", id);
        lab.appendChild(el("span", null, a.label + " goes on"));
        const s = el("select", "field"); s.id = id; s.dataset.coach = "sf-" + a.id;
        a.choices.forEach(function (c) { const o = el("option", null, c[1]); o.value = c[0]; s.appendChild(o); });
        s.value = a.value(x.s); s.addEventListener("change", function () { ctx.act(a.id, s.value); });
        const wrap = el("div", "sf-plug"); wrap.appendChild(lab); wrap.appendChild(s); box.appendChild(wrap);
        return;
      }
      row.appendChild(tag("sf-" + a.id, btn(a.label, "b" + (a.look ? " sf-look" : ""), function () { ctx.act(a.id); })));
    });
    if (row.childNodes.length) box.appendChild(row);
    hands.appendChild(box);
  });
  left.appendChild(hands);

  /* the person on the spot */
  const right = el("div", "macb-right"); grid.appendChild(right);
  const talk = el("section", "macb-sec sf-talk"); talk.appendChild(el("h3", null, "Talking with " + t.person + " (" + t.role + ")"));
  const c = CH.get(f, t.id);
  const mood = el("div", "cc-mood m" + c.mood); mood.setAttribute("role", "status");
  mood.appendChild(el("span", "cc-mood-l", "Mood: " + CH.MOODS[c.mood]));
  const bar = el("span", "cc-meter"); bar.setAttribute("aria-hidden", "true"); for (let i = 0; i < CH.MOODS.length; i++) bar.appendChild(el("span", i <= c.mood ? "on" : "")); mood.appendChild(bar);
  mood.appendChild(el("span", "cc-mood-n", MOOD_NOTE[c.mood]));
  talk.appendChild(mood);
  const log = el("div", "cc-log"); log.setAttribute("aria-label", "Conversation with " + t.who); log.setAttribute("role", "log");
  CH.transcript(f, t).forEach(function (ln) {
    if (ln.who === "note") { log.appendChild(el("p", "cc-line note", "✓ " + ln.text)); return; }
    const b = el("div", "cc-line " + ln.who + (ln.wrong ? " wrong" : ""));
    b.appendChild(el("span", "cc-who", ln.who === "you" ? "You" + (ln.wrong ? " · ✕ didn't help" : "") : t.who + (ln.mood != null ? " · " + CH.MOODS[ln.mood].toLowerCase() : "")));
    b.appendChild(el("p", null, ln.text)); log.appendChild(b);
  });
  talk.appendChild(log);
  const it = CH.current(f, t), next = el("div", "cc-next");
  if (x.poison) next.appendChild(el("p", "cc-ask", t.who + " is watching what you just did. Put it right first."));
  else if (!it) next.appendChild(el("p", "cc-done", "✓ It's safe, and " + t.who + " has what they needed. " + (t.outcome === "escalate" ? "Escalate the ticket in Help Desk." : "Resolve the ticket in Help Desk.")));
  else if (it.type === "do") {
    const w = el("div", "cc-wait"); w.setAttribute("role", "status");
    w.appendChild(el("strong", null, t.who + " is waiting while you work:")); w.appendChild(el("p", null, it.doing));
    w.appendChild(el("p", "cc-note", "Use your hands, on the left. The conversation carries on when it's really done."));
    next.appendChild(w);
  } else {
    next.appendChild(el("p", "cc-ask", "Choose what you say"));
    const strike = ctx.strike ? ctx.strike() : {}, out = c.out[c.step] || [];
    const grp = el("div", "opts cc-opts sf-opts"); grp.setAttribute("role", "group"); grp.setAttribute("aria-label", "What you say to " + t.who);
    CH.shown(t, c, c.step).forEach(function (o) {
      const wrong = out.indexOf(o.label) >= 0, struck = !wrong && strike[o.label];
      const b = el("button", "opt2" + (wrong || struck ? " out" : "")); b.type = "button";
      if (wrong || struck) { b.appendChild(el("span", "om", wrong ? "✕ Ruled out" : "✕ Ruled out by Mason")); b.appendChild(el("span", "ol", o.label)); b.appendChild(el("span", "ow", o.why)); b.setAttribute("aria-disabled", "true"); b.disabled = true; }
      else { b.appendChild(el("span", "ol", o.label)); b.addEventListener("click", function () { ctx.reply(o.label); }); }
      grp.appendChild(b);
    });
    next.appendChild(grp);
  }
  talk.appendChild(next);
  right.appendChild(talk);
  const foot = el("div", "cc-foot sf-foot");
  foot.appendChild(tag("sf-revert", btn("Revert to snapshot", "b small", function () { ctx.revert(); }, "Revert to snapshot: puts everything back to the last point you got right. Your hints carry on.")));
  foot.appendChild(el("span", "cc-note", "Back to the last point you got right: what you did after it is undone, and the red marks with it. Your hints carry on."));
  right.appendChild(foot);
  setTimeout(function () { log.scrollTop = log.scrollHeight; }, 0);
}
