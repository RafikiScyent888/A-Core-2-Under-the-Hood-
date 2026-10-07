/* =====================================================================
   Extra training: Safety (Core 2, Operational procedures, "Safety and
   communication: following safety protocols and communicating
   effectively"). Six tickets, SF1 to SF6.

   The owner's rulings (6 October 2026):
     - safety only, no repairs: nothing is fitted or fixed, which keeps
       Core 1's hardware out
     - the 3D models from the preview, generic and unbranded
       (safety3d.js): the antistatic strap and mat, the swollen laptop,
       the toner spill and its vacuum, the CO2 and water extinguishers,
       the UPS and surge protector
     - communication woven in: every job has the person on the spot, six
       replies to choose from (one right, five wrong, from a pool of nine,
       as the Help Desk chats are), and their mood in words

   Each job is worked in the On the spot window: what you can see, in
   words; your hands (the ticket's acts, safety.js); and the person, whose
   conversation runs in order (chat.js). A hands-on step in the
   conversation ticks off when the scene really is that way.
   ===================================================================== */
import * as SF from "./safety.js";
import * as CH from "./chat.js";

function opt(label, correct, why) { return { label: label, correct: !!correct, why: why || "" }; }
function ok(label) { return { label: label, correct: true, why: "" }; }
function no(label, reaction, why) { return { label: label, correct: false, reaction: reaction, why: why }; }
function sc(fleet, t) { return SF.get(fleet, t.id); }

/* the moves when a wrong move has left a lasting hazard: go back */
const POISON_H = ["Read what your last move did: it's still there, in What you can see.", "When a move has made a hazard worse, go back to the last safe point before you carry on, and then do it the safe way."];
const POISON_MOVES = [opt("Revert to the last snapshot, then carry on the safe way", true), opt("Carry on as if it hadn't happened", false, "The hazard you made is still there."), opt("Tidy it up quickly and say nothing", false, "Hiding a safety incident helps nobody, and it isn't safe yet."), opt("Escalate it to Tier 2 to sort out", false, "Revert puts it back: you can carry on."), opt("Close the ticket anyway", false, "It isn't safe."), opt("Walk away and come back later", false, "The hazard stays while you're gone.")];

/* ------------------------------------------------------------ the factory */
function safetyTicket(o) {
  const t = Object.assign({ kind: "safety", extra: true, topic: "Safety and communication", domain: "Operational procedures", objective: "following safety protocols and communicating effectively", tier: 1, machine: "TECH", category: "Operational procedures › Safety" }, o);
  t.who = o.person.split(" ")[0];
  t.setup = function (fleet) { SF.add(fleet, t.id, o.scene); CH.start(fleet, t.id, o.mood || 0); };
  t.goal = function (fleet) { const x = sc(fleet, t); return !!x && !x.poison && CH.finished(fleet, t) && (!t.safe || t.safe(x.s)); };
  t.stage = function (fleet) { const x = sc(fleet, t); if (!x) return "none"; if (x.poison) return "poison"; const it = CH.current(fleet, t); return it ? it.stage : "done"; };
  /* a hands-on step ticks off the moment it's really done */
  t.react = function (act, fleet) { const x = sc(fleet, t); if (x && !x.poison) CH.advance(fleet, t); };
  t.scoreFn = function (fleet) { const c = CH.get(fleet, t.id); return c ? c.step : 0; };
  t.judge = function (act, fleet) {
    if (act.type === "chat-reply") return act.correct ? { guess: false } : { guess: true, say: act.why };
    if (act.type === "safety") { const r = act.res || {}; return r.wrong ? { guess: true, say: r.say } : { guess: false }; }
    return { guess: false };
  };
  t.hints = function (fleet) {
    const x = sc(fleet, t); if (x && x.poison) return POISON_H;
    const it = CH.current(fleet, t);
    return it ? it.h : o.doneHints;
  };
  t.moves = function (fleet) {
    const x = sc(fleet, t); if (x && x.poison) return POISON_MOVES;
    const it = CH.current(fleet, t), c = CH.get(fleet, t.id);
    if (!it) return o.doneMoves;
    if (it.type === "reply") return CH.shown(t, c, c.step).map(function (r) { return opt(r.label, r.correct, r.why); });
    return it.moves;
  };
  /* rung 3 strikes four of the six replies on screen, a reason each */
  t.strikeNow = function (fleet, survivor) {
    const it = CH.current(fleet, t), c = CH.get(fleet, t.id), x = sc(fleet, t); if (!it || it.type !== "reply" || (x && x.poison)) return null;
    const opts = CH.shown(t, c, c.step), picked = {}; (c.out[c.step] || []).forEach(function (l) { picked[l] = true; });
    const keep = survivor(opts, picked), out = {};
    opts.forEach(function (r) { if (!r.correct && r.label !== keep) out[r.label] = r.why; });
    return { id: "safety", which: c.step, strike: out };
  };
  t.notReady = function (fleet) {
    const x = sc(fleet, t); if (x && x.poison) return x.poison.text + " Revert to the last snapshot to go back to before it.";
    const it = CH.current(fleet, t); if (!it) return null;
    return it.type === "do" ? "It isn't safe to leave yet. " + it.doing : t.who + " is still waiting for your answer, on the spot.";
  };
  t.wrongOutcome = function (kind, fleet) { return o.wrongOutcome ? o.wrongOutcome(kind, fleet) : null; };
  /* Mason, asked for help before any wrong moves: where you are in the job */
  t.advice = function (fleet, onSite) {
    if (t.place && t.place.walk && !onSite) return "Go there first: press " + t.place.go + " on the ticket. A safety job is done where the hazard is, not from your desk.";
    const it = CH.current(fleet, t);
    if (!it) return "It's safe and " + t.who + " is happy. " + (t.outcome === "escalate" ? "Escalate the ticket in Help Desk." : "Resolve the ticket in Help Desk.");
    if (it.type === "reply") return "Read what " + t.who + " has just said in On the spot, every word. Then choose the reply a professional gives, face to face: calm, honest, and about what happens next.";
    return "Look first: the Look buttons never count against you, and they tell you what you're dealing with. Then think about what could hurt someone here, and what makes it safe. " + t.who + " is waiting.";
  };
  return t;
}

/* ===================================================================
   SF1 (crawl): a burning smell and smoke from John's PC
   =================================================================== */
const SF1 = safetyTicket({
  id: "SF1", outcome: "escalate", person: "John Doe", role: "HR", mood: 1,
  title: "John's PC is smoking",
  from: "John Doe, HR",
  place: { walk: "WS1", where: "John's desk, Office 1", go: "Walk to John's desk" },
  brief: ["There's a burning smell coming from my PC, like hot plastic, and I can see a thin wisp of smoke from the back of it. The screen's still on. I've got the payroll file open and I haven't saved since nine. What do I do?",
    "Mason (Team Lead): Go straight there. The office's extinguishers hang in the corridor outside Office 1. Your bench kit has the red DO NOT USE tags, and hardware faults go to Tier 2."],
  scene: { pc: "on", plugged: true, smoke: true, ext: null, sprayed: null, tagged: false, monitor: true, window: false },
  scene3d: "ext2", views: [["all", "Both extinguishers"], ["co2", "The CO₂ extinguisher's label"], ["water", "The water extinguisher's label"]],
  safe: function (s) { return !s.plugged && s.tagged; },
  see: function (s) {
    const out = [];
    out.push(s.plugged ? (s.pc === "on" ? "John's PC is running, its fans loud. A thin wisp of grey smoke rises from the back of it, and there's a smell of hot plastic." : "The PC is off, but it's still plugged in at the wall, and the smoke from the back of it hasn't stopped.")
      : "The PC is unplugged at the wall. The smoke has stopped; the back of the case is hot, and the smell is fading.");
    if (!s.monitor) out.push("The monitor is switched off.");
    out.push(s.ext ? "You've brought the " + (s.ext === "co2" ? "CO₂" : "water") + " extinguisher from the corridor" + (s.sprayed ? ", and it's been discharged." : ": it stands by the desk, pin still in.") : "Two extinguishers hang on the wall in the corridor outside Office 1.");
    if (s.tagged) out.push("A red DO NOT USE tag hangs on the PC's power cord: \"Smoked from the power supply. Do not plug in. Tech, 7 October.\"");
    if (s.window) out.push("The office window is open.");
    return out;
  },
  acts: [
    { id: "look-back", group: "Look (never counts)", look: true, label: "Look at the back of the PC, without touching it", run: function () { return "The smoke comes from the power supply's fan vent, at the top of the back panel. Its power cord runs down to a wall socket under the desk, which has its own switch."; } },
    { id: "look-ext", group: "Look (never counts)", look: true, label: "Read the labels on the corridor's extinguishers", run: function () { return "One is CO₂, with a black label: \"Electrical fires and flammable liquids\". The other is water, with a cream label: \"Class A: wood, paper, cloth. NEVER on electrical equipment\"."; } },
    { id: "window", group: "Look (never counts)", look: true, label: "Open the office window", when: function (s) { return !s.window; }, run: function (s) { s.window = true; return "You open the window: fresh air comes in."; } },
    { id: "fetch-co2", group: "The extinguishers", label: "Fetch the CO₂ extinguisher", when: function (s) { return !s.ext; }, run: function (s) { s.ext = "co2"; return "You lift the CO₂ extinguisher off its bracket and stand it by John's desk, pin in, ready."; } },
    { id: "fetch-water", group: "The extinguishers", label: "Fetch the water extinguisher", when: function (s) { return !s.ext; },
      wrong: function () { return "Water conducts electricity: it's never used on electrical equipment, switched off or not. John: \"Isn't that the water one?\""; }, run: function (s) { s.ext = "water"; return "You bring the water extinguisher to the desk. John: \"Isn't that the water one?\""; } },
    { id: "put-back", group: "The extinguishers", look: true, label: "Hang the extinguisher back on its bracket", when: function (s) { return !!s.ext && !s.sprayed; }, run: function (s) { const k = s.ext; s.ext = null; return "You hang the " + (k === "co2" ? "CO₂" : "water") + " extinguisher back on its bracket in the corridor."; } },
    { id: "spray", group: "The extinguishers", label: "Spray the extinguisher at the PC", when: function (s) { return !!s.ext && !s.sprayed; },
      wrong: function (s) { return s.ext === "water" ? "Water conducts electricity: you've sprayed it over electrical equipment and the socket under the desk." : "There's smoke but no flame. Spraying an extinguisher at it doesn't stop what's causing it, and now it's empty."; },
      poison: function (s) { return s.ext === "water" ? "Water is all over John's PC and the wall socket under the desk: anyone who touches them could get a shock." : "The office's only CO₂ extinguisher is empty: if anything electrical flares up now, there's nothing to fight it with."; },
      run: function (s) { s.sprayed = s.ext; return s.ext === "water" ? "Water sprays over the PC, the desk and the wall socket under it." : "A cold white cloud of CO₂ blasts over the back of the PC, and the extinguisher is empty."; } },
    { id: "unplug-wall", group: "The PC", label: "Switch off at the wall socket and pull the plug", when: function (s) { return s.plugged; }, run: function (s) { s.plugged = false; s.pc = "off"; s.smoke = false; return "You switch the wall socket off and pull the plug out of it. The fans stop, and a few seconds later so does the smoke."; } },
    { id: "hold-power", group: "The PC", label: "Hold the PC's power button until it switches off", when: function (s) { return s.plugged && s.pc === "on"; },
      wrong: function () { return "The PC switched off, but its power supply is still connected to the mains: the smoke is still coming from it."; }, run: function (s) { s.pc = "off"; return "The PC switches off. The smoke from the back of it doesn't stop."; } },
    { id: "cord-back", group: "The PC", label: "Reach behind and pull the cord out of the back of the PC", when: function (s) { return s.plugged; },
      wrong: function () { return "The cord goes into the power supply right beside the hot vent the smoke is coming from: that's your hand in the smoke."; }, run: function () { return "You reach behind the PC and stop: the cord goes in right beside the hot vent, in the smoke."; } },
    { id: "monitor", group: "The PC", label: "Switch off the monitor", when: function (s) { return s.monitor; },
      wrong: function (s) { return s.plugged ? "The screen went dark, but the monitor isn't what's smoking: the PC behind it still is." : "The monitor was never the problem: switching it off changes nothing."; }, run: function (s) { s.monitor = false; return "The screen goes dark."; } },
    { id: "panel", group: "The PC", label: "Open the side panel to see what's burning",
      wrong: function () { return "Inside is a power supply that can hold a dangerous charge even unplugged, and opening it to repair isn't Tier 1's job."; }, run: function () { return "You stop with your hand on the thumbscrew."; } },
    { id: "tag", group: "The PC", label: "Tag the PC: DO NOT USE", when: function (s) { return !s.tagged; },
      wrong: function (s) { return s.plugged ? "A tag on a PC that's still powered and smoking doesn't make anything safe." : null; }, run: function (s) { if (s.plugged) return "You hold the tag and stop: it's still powered and smoking."; s.tagged = true; return "You tie a red DO NOT USE tag to the power cord: \"Smoked from the power supply. Do not plug in. Tech, 7 October.\""; } },
    { id: "replug", group: "The PC", label: "Plug it back in to see if it still smokes", when: function (s) { return !s.plugged; },
      wrong: function () { return "Never power up something that has just smoked: a power supply that's failed once can fail worse."; },
      poison: function () { return "It crackled and smoked again as the power came back: a power supply that has failed once can fail worse, and now it's live again."; },
      run: function (s) { s.plugged = true; s.smoke = true; return "You plug it in and switch the socket on: the power supply crackles, and the smoke starts again."; } },
    { id: "postit", group: "The PC", label: "Stick a note on the screen: \"Broken\"",
      wrong: function () { return "A sticky note falls off, and doesn't say what's wrong or that it mustn't be plugged in."; }, run: function () { return "You write \"Broken\" on a sticky note, and it curls off the screen."; } },
    { id: "carry", group: "The PC", label: "Carry the PC to your bench to look inside",
      wrong: function () { return "It's hot, it has just smoked, and opening its power supply isn't Tier 1's job: it goes to Tier 2."; }, run: function () { return "You stop: it's hot, and it isn't yours to open."; } },
    { id: "bins", group: "The PC", label: "Put the PC out by the bins for disposal",
      wrong: function () { return "Its drive holds John's HR files, and e-waste has its own disposal rules: it doesn't go out with the bins."; }, run: function () { return "You stop at the door: John's HR files are on it."; } }
  ],
  chat: [
    { type: "reply", stage: "calm", cust: ["\"Smell that? It's getting worse. Should I save the payroll file first? I haven't saved since nine!\""],
      h: ["Before the PC, think about the person sitting next to it.", "When something is giving off smoke, the first job is getting people clear of it, calmly."],
      right: ok("Step back from it for me, John. Leave the file: I'll deal with the PC now."), wrong: [
        no("Save it quickly first, John, then step back and leave the PC to me.", "OK, saving... it's going really slowly...", "Every second beside a smoking PC is a risk. Work can be recovered; people can't."),
        no("Calm down, it's probably nothing.", "Probably nothing? It's smoking!", "Brushing off a real hazard loses trust, and keeps him beside it."),
        no("Everybody out! It's going to blow!", "What?! Should I call the fire brigade?", "Shouting spreads panic. A calm, clear instruction works faster."),
        no("Have you tried turning it off and on again?", "Turning it ON again? It's smoking!", "A joke while something smokes tells John you're not taking it seriously."),
        no("That sounds like a hardware fault, John. I'll raise a ticket for Tier 2 straight away.", "A ticket? It's smoking now!", "A hazard is dealt with on the spot first; the paperwork comes after."),
        no("Could you reach behind it and pull the plug for me while I fetch an extinguisher?", "Behind it? That's where the smoke is...", "Never ask someone to put their hand by the hazard. Get them clear and do it yourself."),
        no("That'll just be dust burning off the fan, John. It's fine to carry on working.", "Carry on? With that smell?", "False reassurance keeps him next to a real hazard."),
        no("Why didn't you call us when you first smelled it?", "I... I only just noticed it.", "Blame doesn't make anyone safer, and it makes people slower to report things.")] },
    { type: "do", stage: "extinguisher", cust: ["John steps back into the doorway. \"OK. It's still smoking, though.\""],
      doing: "John is standing back in the doorway, watching you. Nothing has changed at the PC yet.",
      done: function (fleet, t) { const s = sc(fleet, t).s; return s.ext === "co2" && !s.sprayed; },
      after: "You have the CO₂ extinguisher at hand, pin in.",
      h: ["Before you go near it, think about what could happen next, and what hangs in the corridor.", "If a device might flare up, have the right kind of extinguisher at hand before you go near it."],
      moves: [opt("Fetch the CO₂ extinguisher and stand it by the desk", true), opt("Fetch the water extinguisher", false, "Water conducts electricity: never on electrical equipment."), opt("Spray the PC with an extinguisher straight away", false, "There's smoke, not flame, and an empty extinguisher is no use if it does flare up."), opt("Pour John's coffee over the vent", false, "Liquid on live electrics is a shock hazard."), opt("Open the side panel to see what's burning", false, "The power supply holds a dangerous charge, and it isn't Tier 1's to open."), opt("Wait and see if the smoke stops by itself", false, "It won't while the power's on, and you'd have nothing at hand if it got worse.")] },
    { type: "do", stage: "power", doing: "John is watching from the doorway. The smoke is still coming from the back of the PC.",
      done: function (fleet, t) { const s = sc(fleet, t).s; return !s.plugged && !s.smoke; },
      after: "The PC is unplugged at the wall, and the smoke has stopped.",
      h: ["Where is the power reaching the part that's smoking from? Follow its cord.", "To make a faulty device safe, cut its power at the source, from somewhere you can reach without going near the fault."],
      moves: [opt("Switch it off at the wall socket and pull the plug", true), opt("Hold the power button until the PC switches off", false, "The PC stops, but its power supply stays on the mains: the smoking part is still live."), opt("Reach behind and pull the cord out of the back of the PC", false, "That puts your hand right by the hot vent the smoke comes from."), opt("Switch off the monitor", false, "The monitor isn't what's smoking."), opt("Open the side panel to find the fault", false, "A dangerous charge, and not Tier 1's to open."), opt("Spray the CO₂ into the vents", false, "There's no flame: it's the power that needs cutting, and then the extinguisher is empty.")] },
    { type: "reply", stage: "reassure", cust: ["\"Is it going to catch fire? And my payroll! Paul needs it by three.\""],
      h: ["John's asking two things: is it safe, and how does he get his work done today?", "After a scare, tell the person plainly where things stand, then get them working again. Never guess at bad news."],
      right: ok("It's safe now, the power's off. Let's get you on the spare PC and see what Excel kept."), wrong: [
        no("It's safe now. Let's switch it back on for a minute so you can save your payroll file.", "Is that safe? It was smoking a minute ago.", "Never power up something that has just smoked: it can fail worse."),
        no("It's safe, but I'm afraid your file's gone with it. You'll have to start the payroll again.", "Three hours of work? Gone?", "Don't guess at bad news: Excel keeps recovery copies, so check before you say anything."),
        no("Not my problem: tell Paul it'll be late.", "Thanks a lot.", "Leaving the user stuck isn't support: get him working again."),
        no("Don't worry: I'll take it apart this afternoon and swap the power supply myself.", "Oh, OK... is that allowed?", "Opening a power supply isn't Tier 1's job: it's a repair for Tier 2."),
        no("You should have saved more often.", "I know that now.", "Blame helps nobody, least of all someone who's just had a scare."),
        no("Probably. Stand well back.", "Probably?! Should we evacuate?", "Alarming someone when the danger has passed spreads panic. Tell him where things stand."),
        no("Give it a kick and it'll come back on.", "A kick?", "A joke now undoes the calm you've just built."),
        no("Ask Mason, he'll know.", "Aren't you IT?", "You're the one on the spot: tell John where things stand.")] },
    { type: "do", stage: "tag", cust: ["\"OK. Thanks. I'll grab my things.\" John starts packing his bag at the desk."],
      doing: "John is packing up to move to the spare PC. His PC sits unplugged at his desk, where anyone could sit down at it.",
      done: function (fleet, t) { return sc(fleet, t).s.tagged; },
      after: "A DO NOT USE tag hangs on the PC's power cord.",
      h: ["John's leaving his desk. Who else might sit down at it today, and what would they do?", "A device that isn't safe is marked so nobody uses it by mistake, saying what's wrong with it."],
      moves: [opt("Tag it DO NOT USE, and leave it unplugged", true), opt("Plug it back in to see if it smokes again", false, "A power supply that's failed once can fail worse."), opt("Stick a note on it saying \"Broken\"", false, "It falls off, and doesn't say it mustn't be plugged in."), opt("Carry it to your bench to look inside", false, "It's hot, and the power supply isn't Tier 1's to open."), opt("Put it out by the bins", false, "It has John's HR files on its drive, and e-waste has disposal rules."), opt("Leave it: John knows not to use it", false, "The next person at that desk doesn't.")] },
    { type: "reply", stage: "close", cust: ["\"So what happens to my PC now?\""],
      h: ["John wants to know what happens next, and when he'll hear.", "End by saying who has the problem now, and when the person will hear back."],
      right: ok("I'll send it to Tier 2 for a new power supply, and let you know when it's back."), wrong: [
        no("It's dead. You'll get a new one, eventually.", "Eventually? How long is that?", "Vague answers leave people anxious: say what happens next, and when he'll hear."),
        no("Leave it with me: I'll fix it at lunch, it's probably only the fuse in the plug.", "Oh. That's quick, then.", "Promising a repair you can't (and shouldn't) do sets John up to be let down."),
        no("Nothing much. Give it till tomorrow to cool down, then plug it back in and try it.", "Tomorrow? Is that safe?", "It must never be plugged in again until it's repaired."),
        no("That's up to Tier 2 now, not my department. They'll probably be in touch at some point.", "So who do I ask?", "Own the handover: tell John who has it, and that you'll update him."),
        no("Don't touch it, or you'll get a shock.", "I won't go near it!", "A scare isn't an update: say what happens next."),
        no("Who knows? These old PCs just die.", "Great.", "Shrugging it off sounds like nobody's in charge."),
        no("You'll have to buy a new one.", "Me? It's the company's PC!", "Wrong, and alarming."),
        no("It's going in the bin. Start fresh.", "My files were on it!", "It isn't going in the bin, and its drive holds HR data: it goes to Tier 2.")] }
  ],
  doneHints: ["The PC is safe and tagged, and John knows what happens next. Close it out in Help Desk.", "A hardware fault that Tier 1 can't repair goes to the next tier, with what you found and did."],
  doneMoves: [opt("Escalate it to Tier 2 with what you found", true), opt("Resolve it: the smoke has stopped", false, "John's PC still needs a new power supply."), opt("Plug it back in to check", false, "Never power up something that has smoked."), opt("Leave the ticket open for John", false, "Hand it on: Tier 2 has the repair."), opt("Order John a new PC yourself", false, "That's Tier 2's call."), opt("Open the PC to confirm the fault", false, "Not Tier 1's to open.")],
  wrongOutcome: function (kind) { return kind === "resolve" ? "John's PC still needs a new power supply: that's a repair for Tier 2, not something Tier 1 can close." : null; },
  closeWhere: "Think about what was still connected after the PC itself had switched off.",
  close: { prompt: "Mason asks: \"Why did you cut it at the wall, and not just hold the power button?\"", options: [
    opt("The power button stops the PC, but its power supply stays on the mains", true),
    opt("Holding the power button can damage the PC's hard drive when it's hot", false, "Maybe, but that isn't why: the smoke came from the power supply, which stays live."),
    opt("Cutting it at the wall resets the fault, so the PC can be used again", false, "Nothing resets a failed power supply: it mustn't be used until it's repaired."),
    opt("The CO₂ extinguisher only works on equipment that has been unplugged", false, "CO₂ doesn't conduct electricity and works on live equipment: that's why it's the electrical one."),
    opt("Holding the button would have lost John's payroll file, and the wall wouldn't", false, "Both cut the PC off without saving."),
    opt("A PC's power button stops working once the PC has started to smoke", false, "The button still works: it just doesn't disconnect the power supply.")] },
  note: { must: [["wall", "unplug", "socket"], ["co2", "co₂", "carbon dioxide"], ["tag", "do not use"], ["tier 2", "escalat"], ["power supply", "psu"]],
    tip: "What you found, how you cut the power, the extinguisher you had ready (and why that one), the tag, and who has it now." },
  closeAdvice: "It's safe and tagged. Now answer Mason's question on the ticket."
});

/* ===================================================================
   SF2 (walk): Brenda's laptop battery has swollen
   =================================================================== */
const SF2 = safetyTicket({
  id: "SF2", outcome: "resolve", person: "Brenda Smith", role: "Sales", mood: 1,
  title: "Brenda's laptop rocks on the desk",
  from: "Brenda Smith, Sales",
  place: { walk: "WS2", where: "Brenda's office, Office 2", go: "Walk to Brenda's office" },
  brief: ["My sales laptop's acting weird. The touchpad's sticking up and clicks by itself, and the laptop rocks on the desk like the bottom's bulging. The battery keeps dying, so it's on the charger now. Can you take a look? I've got a client demo at two and I need it.",
    "Mason (Team Lead): Spare laptops are on the closet shelf, already set up. The closet also has the metal battery bin with its sand, and the e-waste cage. Brenda's files sync to OneDrive."],
  scene: { charging: true, power: "on", where: "desk", labelled: false, logged: false, spare: false, deck: false },
  scene3d: "laptop", views: [["front", "From the front"], ["side", "From the side, at desk level"]],
  safe: function (s) { return s.where === "bin" && s.labelled && !s.charging; },
  see: function (s) {
    const out = [];
    if (s.where === "desk") out.push("Brenda's sales laptop sits on her desk among her papers, " + (s.charging ? "plugged into its charger" : "unplugged") + ". " + (s.power === "on" ? "It's on: the screen shows her demo slides." : "It's shut down.") + " It rocks when it's touched: the base bulges underneath, the touchpad is pushed up out of its frame, and there's a gap along the front seam.");
    else out.push("Brenda's laptop lies flat in the closet's metal battery bin, on its bed of sand, lid shut." + (s.labelled ? " The bin's label: \"Swollen laptop battery. Do not charge, do not use. 7 October.\"" : ""));
    if (s.logged) out.push("It's logged for the battery recycling collection.");
    if (s.spare) out.push("Brenda has a spare laptop from the closet shelf, signed in." + (s.deck ? " Her demo deck opens on it, from OneDrive." : ""));
    return out;
  },
  acts: [
    { id: "look-side", group: "Look (never counts)", look: true, label: "Look at the laptop from the side, at desk level", run: function () { return "From the side the base is bowed down in the middle: it rocks on its middle, with its rubber feet off the desk. The swelling is under the touchpad, where the battery sits."; } },
    { id: "look-onedrive", group: "Look (never counts)", look: true, label: "Look at the OneDrive icon on its screen", run: function (s) { return s.power === "on" && s.where === "desk" ? "OneDrive says \"Your files are up to date\". Her demo deck is in OneDrive › Sales." : "It's shut down: there's nothing on the screen to read."; } },
    { id: "unplug", group: "The laptop", label: "Unplug the charger", when: function (s) { return s.charging; }, run: function (s) { s.charging = false; return "You unplug the charger from the laptop, and its charging light goes out."; } },
    { id: "replug", group: "The laptop", label: "Plug the charger back in", when: function (s) { return !s.charging && s.where === "desk"; },
      wrong: function () { return "Charging a swollen battery feeds the fault that's swelling it."; }, run: function (s) { s.charging = true; return "The charging light comes back on."; } },
    { id: "shutdown", group: "The laptop", label: "Shut it down from Start", when: function (s) { return s.power === "on" && s.where === "desk"; }, run: function (s) { s.power = "off"; return "You shut it down from Start, and the screen goes dark."; } },
    { id: "press", group: "The laptop", label: "Press the bulge back down to see if it clicks in", when: function (s) { return s.where === "desk"; },
      wrong: function () { return "Pressing on a swollen battery can puncture it: that's how they catch fire."; },
      poison: function () { return "The case creaked under your hand, and a sweet chemical smell is coming from it: the swollen cell is under strain and could vent or catch fire."; },
      run: function () { return "The case creaks under your hand, and a sweet chemical smell comes from it."; } },
    { id: "screwdriver", group: "The laptop", label: "Take the battery out with a screwdriver", when: function (s) { return s.where === "desk"; },
      wrong: function () { return "Prying at a swollen battery is how cells get punctured, and taking a laptop apart isn't Tier 1's job."; }, run: function () { return "You stop with the screwdriver at the seam."; } },
    { id: "freezer", group: "The laptop", label: "Put it in the kitchen freezer to shrink the battery", when: function (s) { return s.where === "desk"; },
      wrong: function () { return "A myth: cold doesn't undo swelling, and condensation as it warms up adds damage. Brenda: \"In the freezer? With the food?\""; }, run: function () { return "Brenda: \"In the freezer? With the food?\""; } },
    { id: "carry-bin", group: "Where it goes", label: "Carry it flat to the closet's metal battery bin", when: function (s) { return s.where === "desk"; },
      wrong: function (s) { return s.charging ? "It's still plugged into the charger at the wall." : s.power === "on" ? "It's still running: a swollen battery under load works harder and warms up. It goes nowhere until it's off." : null; },
      run: function (s) { if (s.charging || s.power === "on") return s.charging ? "It's still plugged into the charger." : "It's still on."; s.where = "bin"; return "You carry it flat, lid shut, to the closet, and lay it on the sand in the metal battery bin."; } },
    { id: "drawer", group: "Where it goes", label: "Put it in her desk drawer until it's collected", when: function (s) { return s.where === "desk"; },
      wrong: function () { return "A drawer full of paper is the worst place for something that might catch fire."; }, run: function () { return "You open the drawer: it's full of paper."; } },
    { id: "office-bin", group: "Where it goes", label: "Throw it in the office bin", when: function (s) { return s.where === "desk"; },
      wrong: function () { return "Batteries never go in the general waste: they start fires in bin lorries, and the rules say they're recycled."; }, run: function () { return "You stop at the bin."; } },
    { id: "ewaste", group: "Where it goes", label: "Put it in the e-waste cage with the old monitors", when: function (s) { return s.where === "desk"; },
      wrong: function () { return "The e-waste cage isn't fireproof, and a damaged battery is kept apart from everything else."; }, run: function () { return "You stop at the cage: it's full of old plastic and cardboard."; } },
    { id: "post", group: "Where it goes", label: "Post it back to the manufacturer", when: function (s) { return s.where === "desk"; },
      wrong: function () { return "A damaged lithium battery can't go in the ordinary post: shipping one has its own rules."; }, run: function () { return "You stop: it can't go in the post."; } },
    { id: "label-log", group: "Where it goes", label: "Label the bin and log it for battery recycling", when: function (s) { return s.where === "bin" && !s.labelled; }, run: function (s) { s.labelled = true; s.logged = true; return "You label the bin, \"Swollen laptop battery. Do not charge, do not use. 7 October.\", and log it for the battery recycling collection."; } },
    { id: "spare", group: "Brenda", label: "Give Brenda a spare laptop from the closet shelf", when: function (s) { return !s.spare; }, run: function (s) { s.spare = true; return "You bring a spare laptop from the closet shelf, already set up, and Brenda signs in."; } },
    { id: "deck", group: "Brenda", label: "Open her demo deck on the spare", when: function (s) { return s.spare && !s.deck; }, run: function (s) { s.deck = true; return "Her deck opens from OneDrive, slides and all."; } }
  ],
  chat: [
    { type: "reply", stage: "talk", cust: ["\"See? It wobbles, and the touchpad keeps clicking by itself. I've had it on charge because the battery dies so fast. I just need it working for my demo at two.\""],
      h: ["Look at what Brenda's describing: what in a laptop could push the touchpad up from underneath?", "Name the hazard calmly, stop the risky use, and offer a way to get the job done."],
      right: ok("That's a swollen battery, Brenda. Let's stop using it, and I'll find you a spare for two."), wrong: [
        no("That's just the touchpad lifting. Press it down firmly and it should click back into place.", "Like this? It's... creaking.", "Pressing on a swollen battery can puncture it."),
        no("It's the battery wearing out, Brenda. Keep it on charge so it doesn't die during your demo.", "OK, I'll leave it plugged in.", "Charging a swollen battery feeds the fault that's swelling it."),
        no("Laptops all do that as they get older, Brenda. It's nothing to worry about before your demo.", "Oh good, I was worried.", "False reassurance: a swollen battery can catch fire."),
        no("Have you been sitting on it?", "Excuse me?", "Blaming the user, even as a joke, isn't professional."),
        no("Pop it in the fridge for an hour to cool it down.", "The fridge? With the milk?", "A myth: cold doesn't undo swelling, and condensation adds damage."),
        no("That sounds like a manufacturing fault, Brenda. Best to call the manufacturer's helpline today.", "I don't have time before two!", "It's a hazard on our premises: deal with it, and get her working."),
        no("Give it a shake and see if the bulge moves.", "Shake it? Is that safe?", "Never jolt a damaged battery."),
        no("Whoa, that thing's a bomb! Everybody back!", "A bomb?!", "Panic spreads fear. Say what it is calmly, and what happens next.")] },
    { type: "do", stage: "stop", cust: ["\"OK... what do you need me to do?\""],
      doing: "Brenda's waiting while you make her laptop safe. It's still plugged in and running.",
      done: function (fleet, t) { const s = sc(fleet, t).s; return !s.charging && s.power === "off"; },
      after: "The laptop is unplugged and shut down.",
      h: ["What is still feeding power into the battery, and what's still drawing on it?", "A damaged battery should be neither charging nor working: take it out of use completely."],
      moves: [opt("Unplug the charger and shut it down", true), opt("Leave it charging so the battery doesn't go flat", false, "Charging feeds the fault that's swelling it."), opt("Press the bulge back down", false, "That can puncture the cell."), opt("Take the battery out with a screwdriver", false, "Prying a swollen battery can puncture it, and it isn't Tier 1's job."), opt("Put it in the freezer to shrink the battery", false, "Cold doesn't undo swelling, and condensation adds damage."), opt("Close the lid and let her use it on battery", false, "It's damaged whether it's charging or not.")] },
    { type: "do", stage: "contain", cust: ["\"So where does it go now? Not back in my bag, I hope.\""],
      doing: "The laptop is unplugged and off, on Brenda's desk among her papers.",
      done: function (fleet, t) { return sc(fleet, t).s.where === "bin"; },
      after: "The laptop is in the metal battery bin, on its sand.",
      h: ["If it did catch fire, what would be around it? Think about the kit in the closet.", "A damaged lithium battery waits somewhere that can't burn, away from anything that can."],
      moves: [opt("Carry it flat to the closet's metal battery bin", true), opt("Put it in her desk drawer until it's collected", false, "A drawer full of paper is the worst place for something that might burn."), opt("Throw it in the office bin", false, "Never: batteries start bin-lorry fires, and must be recycled."), opt("Put it in the e-waste cage with the old monitors", false, "Not fireproof, and a damaged battery is kept apart."), opt("Post it back to the manufacturer", false, "Damaged lithium batteries have shipping rules: not the ordinary post."), opt("Leave it on her desk for Tier 2 to collect", false, "Among her papers, where she might pick it up or charge it.")] },
    { type: "do", stage: "recycle", doing: "Brenda's laptop is in the bin. What happens to it from here?",
      done: function (fleet, t) { const s = sc(fleet, t).s; return s.labelled && s.logged; },
      after: "The bin is labelled, and the laptop is logged for battery recycling.",
      h: ["Somebody else will open that bin. What will they need to know, and where does the battery go after that?", "Anyone who comes across a damaged battery later needs to know what it is, and it leaves the building by the route the rules set for batteries, never with the rubbish."],
      moves: [opt("Label the bin and log it for battery recycling", true), opt("Throw it out with the general waste on Friday", false, "Batteries never go in the general waste."), opt("Give it back to Brenda once it's cooled down", false, "It's still damaged: it doesn't go back into use."), opt("Leave it in the bin with no label", false, "The next person may take it out and charge it."), opt("Take it home and recycle it yourself", false, "Company e-waste goes through the company's collection."), opt("Ask Brenda to take it to a phone shop", false, "It's the company's hazard to dispose of properly.")] },
    { type: "reply", stage: "demo", cust: ["\"And my demo? The deck's on that laptop!\""],
      h: ["Where does Brenda's work actually live: on that laptop, or somewhere it syncs to?", "Get the person working again, and check it yourself before you promise."],
      right: ok("Your files sync to OneDrive, so they'll be on the spare. Let's sign you in and check."), wrong: [
        no("I'll take the swollen battery out, and you can run the laptop on its charger for the demo.", "Oh, OK. Can you do that now?", "Opening a swollen battery is dangerous, and not Tier 1's job."),
        no("I'm afraid the deck's gone with the laptop, Brenda. Can you rebuild it from your emails?", "Gone?! The demo's at two!", "Check before you give bad news: her files sync to OneDrive."),
        no("You can borrow mine, but don't read my emails.", "Er... thanks?", "Your own laptop isn't a spare: a company spare keeps everyone's data apart."),
        no("Do the demo without slides. Just talk.", "To a client? Without the deck?", "Find a way to get the job done; don't make it her problem."),
        no("Why didn't you back it up?", "I thought it was backed up!", "Blame, and it's wrong: OneDrive has it."),
        no("Use it unplugged for the demo, and bring it straight to me afterwards so I can bin it.", "Is that safe?", "A swollen battery doesn't go back into use, not even for an hour."),
        no("Ask the client to reschedule.", "They're flying in for it!", "There's a spare: rescheduling isn't needed."),
        no("Print the slides and hold them up.", "...Seriously?", "A joke, when she's worried about a client.")] },
    { type: "do", stage: "spare", doing: "Brenda needs a working laptop with her demo on it before two.",
      done: function (fleet, t) { const s = sc(fleet, t).s; return s.spare && s.deck; },
      after: "Brenda has a spare laptop, and her deck opens on it.",
      h: ["What's on the closet shelf for days like this?", "Before you say it's sorted, test it: open the thing they actually need."],
      moves: [opt("Give her a spare laptop and open her deck on it", true), opt("Lend her your own laptop", false, "Your laptop isn't a company spare."), opt("Tell her to use her phone for the demo", false, "There's a proper spare on the shelf."), opt("Give her the spare without checking her deck", false, "Test before you say it's sorted."), opt("Order her a new laptop for next week", false, "The demo's at two."), opt("Let her use the swollen one until the demo", false, "It doesn't go back into use.")] },
    { type: "reply", stage: "close", cust: ["\"Thanks! Will I get my own laptop back?\""],
      h: ["Brenda wants to know what happens next.", "Close by saying what happens to her old laptop, and who's handling the replacement."],
      right: ok("It can't be made safe, so I'll ask Tier 2 about a replacement. Keep the spare till then."), wrong: [
        no("Yes: once it's cooled down overnight, it'll be fine to use again. I'll bring it back tomorrow.", "Great, I'll pick it up tomorrow.", "It's damaged: cooling down doesn't make it safe to use."),
        no("No, it's in the bin. Buy a new one.", "Buy one? It's the company's!", "Wrong, and blunt: the company replaces it."),
        no("No idea. Ask Mason.", "OK...", "You're on the spot: tell her what happens next."),
        no("Maybe. These things tend to happen when people leave laptops charging overnight, you know.", "Is this my fault?", "A dig at the user: it isn't her fault."),
        no("Yes, I'll open it up and swap the battery myself this afternoon, so you'll have it back by four.", "Brilliant!", "Swapping a battery is a repair: not Tier 1's to promise."),
        no("Don't worry about it.", "But will I?", "A non-answer: say what happens next."),
        no("If you're lucky.", "Lucky?", "Unprofessional: give her a clear next step."),
        no("Only if you fill in a damage form.", "A damage form? I didn't damage it!", "Implies she's at fault, when she isn't.")] }
  ],
  doneHints: ["It's contained, labelled and logged, and Brenda's working on the spare. Resolve it in Help Desk.", "Close a job once the hazard is contained and the person can work again."],
  doneMoves: [opt("Resolve the ticket", true), opt("Escalate it to Tier 2", false, "Nothing is left for Tier 2 to do on the spot."), opt("Take the laptop back out to check it", false, "It stays in the bin."), opt("Leave the ticket open until recycling day", false, "The job's done: it's logged."), opt("Charge the old laptop to see if it still works", false, "Never charge a swollen battery."), opt("Ask Brenda to sign for the spare", false, "Not needed to close it.")],
  closeWhere: "Think about what's wrong inside the laptop, and whether unplugging it changes that.",
  close: { prompt: "Brenda asks: \"Why couldn't I just keep using it unplugged until two?\"", options: [
    opt("It's damaged inside, and can overheat or catch fire, charging or not", true),
    opt("Unplugged, the battery would have died halfway through your demo", false, "Maybe, but that isn't why: the danger is the swollen battery itself."),
    opt("Company policy replaces any laptop once it's three years old", false, "Nothing to do with age policy."),
    opt("The touchpad would have stopped working within the hour anyway", false, "The touchpad isn't the danger."),
    opt("Using a laptop with a swollen battery voids its warranty", false, "That isn't why: it's a fire risk."),
    opt("Swollen batteries only overheat while they charge, so it was the charger", false, "They can overheat at any time; charging just makes it worse.")] },
  note: { must: [["swollen", "swelling"], ["charg"], ["bin", "fireproof", "metal"], ["recycl"], ["spare", "loan"]],
    tip: "What you found, how you took it out of use, where it went and why, how it'll be disposed of, and how Brenda's working now." },
  closeAdvice: "It's contained, and Brenda's working. Now answer her question on the ticket."
});

/* ===================================================================
   SF3 (run): a toner spill at reception
   =================================================================== */
const SF3 = safetyTicket({
  id: "SF3", outcome: "resolve", person: "Rosa Ortiz", role: "Reception", mood: 1,
  title: "Toner all over the carpet at reception",
  from: "Rosa Ortiz, Reception",
  place: { walk: "WS5", where: "the printer at reception", go: "Walk to reception" },
  brief: ["I was changing the printer's toner and the cartridge slipped. There's black powder all over the carpet by the printer, and on my hands. Should I get the vacuum from the cleaning cupboard? Visitors are due at eleven.",
    "Mason (Team Lead): Everything for the printer is in the binder on the shelf above it. The closet has the toner vacuum, dust masks and gloves; the cleaning cupboard has the office vacuum and a wet-floor sign. The new cartridge's box has a return bag."],
  scene: { spill: true, sign: false, sds: false, ppe: false, vac: false, wiped: false, cart: "floor" },
  scene3d: "toner", views: [["all", "The spill and the vacuum"], ["label", "The cartridge's label"], ["vacuum", "The toner vacuum"]],
  safe: function (s) { return s.vac && s.wiped && s.cart === "bagged"; },
  see: function (s) {
    const out = [];
    if (s.spill) out.push(s.vac ? "You've vacuumed up the loose powder: a faint grey shadow is left in the carpet." : "A fan of fine black toner, about a metre across, covers the carpet in front of the printer" + (s.sign ? "." : ", and people are walking past it to the kitchen."));
    else out.push("The carpet is clean: vacuumed, and dabbed with a cold, damp cloth.");
    if (s.sign) out.push("A yellow wet-floor sign stands across the spill.");
    if (s.ppe) out.push("You're wearing a dust mask and nitrile gloves.");
    if (s.sds) out.push("You've read the toner's Safety Data Sheet.");
    out.push(s.cart === "floor" ? "The cracked cartridge lies on its side by the spill, leaking." : "The cracked cartridge is sealed in its return bag, for the manufacturer's recycling programme.");
    return out;
  },
  acts: [
    { id: "read-sds", group: "Look (never counts)", look: true, label: "Read the toner's Safety Data Sheet, in the binder above the printer", run: function (s) { s.sds = true; return "Safety Data Sheet, black toner. Hazards: a fine powder that may irritate the eyes and lungs if breathed in. Skin: wash with soap and cold water; get medical advice if irritation continues. Spills: avoid making dust. Pick it up with a vacuum made for toner: an ordinary vacuum lets it through its filter, and toner dust can ignite. Then wipe with a cold, damp cloth. Disposal: the manufacturer's return programme, or local regulations."; } },
    { id: "look-cart", group: "Look (never counts)", look: true, label: "Read the label on the cartridge", run: function () { return "\"TONER CARTRIDGE · BLACK. See the Safety Data Sheet.\""; } },
    { id: "sign", group: "Around you", label: "Stand the wet-floor sign across the spill", when: function (s) { return !s.sign; }, run: function (s) { s.sign = true; return "You stand the yellow wet-floor sign from the cleaning cupboard across the spill, so nobody walks it through the office."; } },
    { id: "ppe", group: "Around you", label: "Put on a dust mask and gloves", when: function (s) { return !s.ppe; }, run: function (s) { s.ppe = true; return "You put on a dust mask and nitrile gloves from the closet kit."; } },
    { id: "office-vac", group: "The spill", label: "Vacuum it up with the office vacuum", when: function (s) { return s.spill && !s.vac; },
      wrong: function () { return "Toner is finer than an ordinary vacuum's filter: it blows straight out of the exhaust, and the dust can ignite in the motor."; },
      poison: function () { return "The office vacuum blew fine toner out of its exhaust: a grey haze hangs over reception, and the vacuum's motor smells hot."; },
      run: function () { return "A grey haze puffs out of the vacuum's exhaust, and its motor starts to smell hot."; } },
    { id: "toner-vac", group: "The spill", label: "Vacuum it up with the toner vacuum", when: function (s) { return s.spill && !s.vac; },
      wrong: function (s) { return s.ppe ? null : "The fine dust puffs up around your face as you start, and you've no mask on."; },
      run: function (s) { if (!s.ppe) return "The dust puffs up around your face: you stop."; s.vac = true; return "The toner vacuum's fine filter pulls the powder up. A faint grey shadow is left in the carpet."; } },
    { id: "sweep", group: "The spill", label: "Sweep it up with a dustpan and brush", when: function (s) { return s.spill && !s.vac; },
      wrong: function () { return "Sweeping throws the fine powder into the air you and Rosa are breathing."; }, run: function () { return "The first sweep throws up a puff of black dust."; } },
    { id: "hot-wipe", group: "The spill", label: "Scrub it with a hot, wet cloth", when: function (s) { return s.spill; },
      wrong: function () { return "Heat melts toner: it's made to fuse onto paper."; },
      poison: function () { return "Hot water melted the toner into the carpet: a black stain that won't come out."; },
      run: function () { return "The toner smears and sets into a black stain."; } },
    { id: "cold-wipe", group: "The spill", label: "Dab it with a cold, damp cloth", when: function (s) { return s.spill; },
      wrong: function (s) { return s.vac ? null : "Wet toner turns to a black paste that smears into the carpet."; },
      run: function (s) { if (!s.vac) return "It turns to a black paste under the cloth: you stop."; s.wiped = true; s.spill = false; return "You dab the last grey shadow with a cold, damp cloth until the carpet is clean."; } },
    { id: "cart-bag", group: "The cartridge", label: "Seal the cartridge in the return bag", when: function (s) { return s.cart === "floor"; }, run: function (s) { s.cart = "bagged"; return "You slide the cracked cartridge into the return bag from the new cartridge's box and seal it, for the manufacturer's recycling programme."; } },
    { id: "cart-bin", group: "The cartridge", label: "Throw the cartridge in the office bin", when: function (s) { return s.cart === "floor"; },
      wrong: function () { return "Toner cartridges are recycled, not put in the general waste, and a cracked one leaks all over the bin."; }, run: function () { return "You stop at the bin."; } },
    { id: "cart-back", group: "The cartridge", label: "Put the cartridge back in the printer to use up the toner", when: function (s) { return s.cart === "floor"; },
      wrong: function () { return "A cracked cartridge leaks toner inside the printer, onto the pages and into the fuser."; }, run: function () { return "You stop: it's cracked."; } },
    { id: "cart-shake", group: "The cartridge", label: "Shake the cartridge to see how much is left", when: function (s) { return s.cart === "floor"; },
      wrong: function () { return "More toner puffs out of the crack."; }, run: function () { return "A puff of black dust comes out of the crack."; } }
  ],
  chat: [
    { type: "reply", stage: "talk", cust: ["\"I'm so sorry, it just slipped out of my hands. Shall I grab the vacuum from the cleaning cupboard? Visitors are due at eleven.\""],
      h: ["What is toner, and what would an ordinary vacuum do with powder that fine?", "Reassure the person, stop them making it worse, and look after them first."],
      right: ok("Don't worry, Rosa. Leave the vacuum: toner needs a special one. Wash your hands in cold water."), wrong: [
        no("Don't worry about it, Rosa. Grab the vacuum from the cupboard, and we'll have it all up before eleven.", "OK, I'll get it...", "An ordinary vacuum blows fine toner through its filter into the air, and the dust can ignite."),
        no("Don't worry about the carpet, Rosa. Wash your hands in hot water: it comes off much faster.", "Hot? OK.", "Hot water melts toner into the skin. Soap and cold water."),
        no("That's going to cost a fortune to clean.", "I said I was sorry...", "Making her feel worse doesn't clean anything."),
        no("Why were you changing it? That's IT's job.", "The printer said it was empty...", "Blame makes people hide accidents next time."),
        no("Just rub it into the carpet, it's dark anyway.", "Rub it in? Really?", "A joke, and it would make it worse."),
        no("Don't touch anything, Rosa! That stuff's toxic. Go and wash your hands right now, quickly!", "Toxic?! Is my skin OK?", "Alarm without facts: the data sheet says what it really is."),
        no("Blow it under the printer, nobody will see.", "Blow it?", "Blowing raises a dust cloud you both breathe."),
        no("It's only ink, Rosa, it'll come off. Wipe your hands on a paper towel and get the vacuum.", "My sleeve? It's white!", "Toner isn't ink: it's a fine powder that smears and stains.")] },
    { type: "do", stage: "area", cust: ["Rosa heads off to wash her hands. People are walking past the printer to the kitchen."],
      doing: "The spill is beside the corridor to the kitchen, and people are walking past it.",
      done: function (fleet, t) { return sc(fleet, t).s.sign; },
      after: "A sign keeps people off the spill.",
      h: ["Who else is going to walk through this, and where will it go on their shoes?", "Before you clean up a spill, stop it spreading: keep people away from it."],
      moves: [opt("Stand the wet-floor sign across the spill", true), opt("Start cleaning straight away and hope nobody walks through", false, "Feet carry toner right through the office while you work."), opt("Throw paper towels over it", false, "That hides it, and people still step in it."), opt("Ask Rosa to stand guard over it", false, "She needs to wash her hands, and it's your job."), opt("Close reception for the day", false, "Overkill: a sign keeps people off."), opt("Leave it until the cleaners come tonight", false, "It's walked all over the office by then.")] },
    { type: "do", stage: "sds", doing: "Rosa's still washing her hands. The spill is marked off.",
      done: function (fleet, t) { return sc(fleet, t).s.sds; },
      after: "You've read the Safety Data Sheet.",
      h: ["Before you clean up a chemical, where would you find how its maker says to handle it?", "Every chemical product comes with a document giving its hazards, first aid, spill clean-up and disposal: read it first."],
      moves: [opt("Read the toner's Safety Data Sheet", true), opt("Search the internet for \"toner spill\"", false, "The maker's own data sheet is the source for this product."), opt("Guess: it's only powder", false, "Guessing is how people end up breathing it in."), opt("Ask Rosa what she thinks", false, "She doesn't know either: the data sheet does."), opt("Read the printer's user manual", false, "The manual covers the printer, not the chemical."), opt("Phone the toner maker's sales line", false, "The data sheet is right above the printer.")] },
    { type: "do", stage: "ppe", doing: "Rosa's back from washing her hands. The spill is waiting.",
      done: function (fleet, t) { return sc(fleet, t).s.ppe; },
      after: "You're wearing a dust mask and gloves.",
      h: ["What does the data sheet say about breathing it in?", "Protect yourself before you work on a hazard, with the kit the data sheet calls for."],
      moves: [opt("Put on a dust mask and gloves", true), opt("Hold your breath while you work", false, "Not for the minutes a clean-up takes."), opt("Open a window and get on with it", false, "Air moving over fine powder spreads it."), opt("Wear safety goggles only", false, "Goggles protect your eyes, not your lungs or hands."), opt("Wrap your scarf over your face", false, "A scarf doesn't stop fine powder."), opt("Skip it: it's only a small spill", false, "A small spill is still fine dust you'd breathe.")] },
    { type: "reply", stage: "worry", cust: ["\"My hands are still a bit grey. Is it poisonous? Should I see a doctor?\""],
      h: ["You've already read something that answers Rosa's question.", "Answer health worries with the facts from the data sheet, calmly, and offer it to read."],
      right: ok("The data sheet says soap and cold water, and a doctor if it irritates. Here, have a look."), wrong: [
        no("You'll be absolutely fine, Rosa. Honestly, stop worrying about it and get back to work.", "Easy for you to say.", "Dismissing a worry doesn't answer it: the data sheet does."),
        no("Toner's a chemical, so I'd go to the hospital now, just to be on the safe side, Rosa.", "Now?! Is it that bad?", "Alarm without facts. The data sheet says what to do."),
        no("The data sheet says scrub them with hot water and a little bleach until the grey comes off.", "Bleach?!", "Dangerous advice: soap and cold water, as the data sheet says."),
        no("No idea. Look it up online.", "Right...", "You have the data sheet: share what it says."),
        no("I think toner can cause cancer, so yes, I'd see a doctor today if I were you.", "Cancer?!", "Don't make up facts: tell her what the sheet says."),
        no("Grey suits you.", "Not funny.", "A joke while she's worried."),
        no("That's not IT's department.", "Whose is it, then?", "You're the one who read the sheet: help her."),
        no("Rub some butter on them.", "Butter?", "An old wives' tale: soap and cold water.")] },
    { type: "do", stage: "clean", cust: ["\"OK. Thank you.\" Rosa watches from her desk."],
      doing: "The spill is still there, marked off by the sign.",
      done: function (fleet, t) { const s = sc(fleet, t).s; return s.vac && s.wiped; },
      after: "The carpet's clean: vacuumed with the toner vacuum and dabbed with a cold, damp cloth.",
      h: ["The data sheet said how to pick it up, and what to finish with.", "Pick up fine powder without making dust, then finish without making it set."],
      moves: [opt("Toner vacuum first, then dab it with a cold, damp cloth", true), opt("Vacuum it with the office vacuum", false, "Fine toner goes straight through its filter, and the dust can ignite."), opt("Sweep it up with a dustpan and brush", false, "Sweeping throws the powder into the air."), opt("Scrub it with a hot, wet cloth", false, "Heat melts toner into the carpet: a permanent stain."), opt("Wet it first so it doesn't fly about", false, "Wet toner turns to a paste that smears in."), opt("Blow it under the printer with a fan", false, "A dust cloud across reception.")] },
    { type: "do", stage: "cart", doing: "The cracked cartridge is still lying by the printer.",
      done: function (fleet, t) { return sc(fleet, t).s.cart === "bagged"; },
      after: "The old cartridge is sealed in its return bag for recycling.",
      h: ["What does the data sheet say about disposal, and what came in the new cartridge's box?", "A used cartridge leaves by the route its maker and the rules set for it, never in the general waste."],
      moves: [opt("Seal it in the return bag for recycling", true), opt("Throw it in the office bin", false, "Cartridges are recycled, and a cracked one leaks in the bin."), opt("Put it back in the printer to use up the toner", false, "It's cracked: toner leaks into the printer and the fuser."), opt("Leave it on the side for someone else", false, "It keeps leaking where people walk."), opt("Tape up the crack and keep it as a spare", false, "A damaged cartridge isn't a spare."), opt("Shake it to see how much is left", false, "More toner out of the crack.")] },
    { type: "reply", stage: "close", cust: ["\"Will it be clean before the visitors?\""],
      h: ["Rosa wants to know if it's done.", "Close by telling the person plainly what's been done, so they're not left wondering."],
      right: ok("It's done: the powder's up, the carpet's clean, and the cartridge is bagged for recycling."), wrong: [
        no("Nearly. There's a grey patch left, so just keep the visitors away from that bit of the floor.", "Oh no...", "It is done: tell her plainly."),
        no("It's all clean now. Just be a bit more careful next time you change the cartridge, Rosa.", "I said sorry...", "A lecture spoils a good fix."),
        no("Ask the visitors to use the back door.", "Really?", "No need: it's clean."),
        no("That's up to the cleaners now.", "But you cleaned it!", "Take ownership, and reassure her."),
        no("Clean? I just pushed it under the printer.", "What?!", "A joke that worries her."),
        no("Probably, but toner never really comes out of carpet, so it may always look a bit grey.", "So it's not clean?", "It is clean: say so."),
        no("It's done: the powder's up, the carpet's clean, and the old cartridge has gone in the bin.", "OK, great.", "It hasn't, and the bin would be wrong: it's bagged for recycling."),
        no("I'll bill reception for the clean-up.", "Bill us?!", "Unprofessional, and not how it works.")] }
  ],
  doneHints: ["It's clean, the cartridge is bagged and Rosa's reassured. Resolve it in Help Desk.", "Close a job once the hazard is gone and the person knows it."],
  doneMoves: [opt("Resolve the ticket", true), opt("Escalate it to Tier 2", false, "Nothing is left for Tier 2."), opt("Vacuum it again with the office vacuum to be sure", false, "That blows toner into the air."), opt("Leave the sign up all day", false, "It's clean: take it down."), opt("Put the cracked cartridge back in the printer", false, "It's cracked."), opt("Ask the cleaners to check it tonight", false, "It's done.")],
  closeWhere: "Think about what's special about toner, compared with ordinary dust.",
  close: { prompt: "Mason asks: \"Why the toner vacuum, and not the cleaners' vacuum?\"", options: [
    opt("Toner passes through an ordinary filter, and its dust can ignite", true),
    opt("The cleaners' vacuum isn't strong enough to lift toner out of carpet", false, "It's plenty strong: the trouble is what comes out of the other end."),
    opt("Toner is slightly wet, so it would clog an ordinary vacuum's bag", false, "Toner is a dry powder."),
    opt("Only a toner vacuum is allowed near IT equipment like a printer", false, "It was the carpet being cleaned, not the printer."),
    opt("The cleaners' vacuum belongs to the building, not to the IT team", false, "Ownership isn't the reason: the filter is."),
    opt("Using an ordinary vacuum near a printer voids the printer's warranty", false, "The warranty doesn't come into it.")] },
  note: { must: [["safety data sheet", "sds"], ["toner vacuum"], ["cold"], ["mask", "glove"], ["recycl", "return"]],
    tip: "What happened, the data sheet, keeping people off it, your mask and gloves, how you cleaned it and with what, and where the cartridge went." },
  closeAdvice: "It's clean. Now answer Mason's question on the ticket."
});

/* ===================================================================
   SF4 (run): fitting the new UPS under the rack
   =================================================================== */
const DEVICES = [["fs01", "FS01 (file server)"], ["mail01", "MAIL01 (mail server)"], ["switch", "The network switch"], ["printer", "The laser printer by the closet door"]];
const OUTLETS = [["old", "the old surge strip"], ["batt", "the UPS: a Battery backup + surge outlet"], ["surge", "the UPS: a Surge only outlet"]];
const LOAD = { fs01: 20, mail01: 14, switch: 4, printer: 90 };
export function upsLoad(s) { return DEVICES.reduce(function (n, d) { return n + (s.plugs[d[0]] === "batt" ? LOAD[d[0]] : 0); }, 0); }
export function upsLcd(s) {
  if (!s.upsOn) return ["OFF", "", ""];
  const n = upsLoad(s);
  if (n > 100) return ["OVERLOAD", "Load " + n + "%", "Remove load"];
  return [s.test ? "SELF-TEST OK" : "ONLINE", "Battery 100%", "Load " + n + "%  · " + (n ? Math.max(1, Math.round(14 * 38 / n)) : 60) + " min"];
}
function plugAct(dev, label) {
  return { id: "plug-" + dev, group: "Where each plug goes", label: label, choices: OUTLETS, value: function (s) { return s.plugs[dev]; }, when: function (s) { return s.placed; },
    wrong: function (s, v) {
      if (v === s.plugs[dev]) return null;
      if ((dev === "fs01" || dev === "mail01") && s.srv === "on") return "Moving a running server's plug is pulling its power: a file being saved to it is corrupted.";
      if (dev === "printer" && v === "batt") return "A laser printer's heater draws a big surge as it warms up: on the battery side it can overload the UPS, and take everything on it down.";
      if (dev !== "printer" && v === "surge") return "Surge only outlets have no battery behind them: in a power cut, it goes off just as before.";
      return null;
    },
    poison: function (s, v) { return v !== s.plugs[dev] && (dev === "fs01" || dev === "mail01") && s.srv === "on" ? "You pulled " + (dev === "fs01" ? "FS01" : "MAIL01") + "'s power while it was running: a file being saved to it is corrupted, and it will spend an hour checking its disk when it starts." : null; },
    run: function (s, v) { const was = s.plugs[dev]; s.plugs[dev] = v; if ((dev === "fs01" || dev === "mail01") && s.srv === "on" && v !== was) s.srv = "down"; return label + " is now on " + OUTLETS.filter(function (o) { return o[0] === v; })[0][1] + "."; } };
}
const SF4 = safetyTicket({
  id: "SF4", outcome: "resolve", person: "Dev Patel", role: "Development", mood: 0,
  title: "Fit the new UPS under the rack",
  from: "Mason, Team Lead",
  place: { walk: null, where: "the rack, beside your bench", go: "Turn to the rack" },
  brief: ["Mason here. The new UPS for the rack has arrived: it's in its box by the closet door. It goes under the rack, and FS01, MAIL01 and the network switch go on it, so they ride through a power cut. The laser printer by the closet door is on the old surge strip at the moment; the old strip comes out when you're done.",
    "Do it at 12:30, over lunch: FS01 and MAIL01 will be off for about ten minutes while you move their plugs. Dev's in the closet sorting cables, if you need a hand."],
  scene: { placed: false, notified: false, srv: "on", plugs: { fs01: "old", mail01: "old", switch: "old", printer: "old" }, upsOn: false, test: false, back: false },
  scene3d: "ups", views: [["all", "The UPS and the old strip"], ["display", "The UPS's display"], ["strip", "The old surge strip"]],
  state3d: function (s) { return { lcd: upsLcd(s) }; },
  safe: function (s) { return s.placed && s.upsOn && s.srv === "on" && s.plugs.fs01 === "batt" && s.plugs.mail01 === "batt" && s.plugs.switch === "batt" && s.plugs.printer === "surge" && s.test && s.back; },
  see: function (s) {
    const out = [];
    out.push(s.placed ? "The UPS stands under the rack, out of its box." : "The UPS is in its box by the closet door. The box says: \"1500 VA UPS · 28 kg (62 lb) · TEAM LIFT\".");
    out.push("FS01 and MAIL01 are " + (s.srv === "on" ? "running." : "shut down."));
    out.push(DEVICES.map(function (d) { return d[1] + ": " + OUTLETS.filter(function (o) { return o[0] === s.plugs[d[0]]; })[0][1]; }).join(". ") + ".");
    const L = upsLcd(s); out.push("The UPS's display: " + L.filter(Boolean).join(" · ") + ".");
    if (s.notified) out.push("Everyone has your email about the 12:30 shutdown." + (s.back ? " And the all-clear." : ""));
    return out;
  },
  acts: [
    { id: "read-box", group: "Look (never counts)", look: true, label: "Read the label on the box", run: function () { return "\"1500 VA uninterruptible power supply. 28 kg (62 lb). TEAM LIFT.\" On the back panel: six outlets marked \"Battery backup + surge\", and two marked \"Surge only\"."; } },
    { id: "read-card", group: "Look (never counts)", look: true, label: "Read the UPS's quick-start card", run: function () { return "\"Battery backup outlets: equipment that must keep running in a power cut, such as computers and network equipment. Surge only outlets: laser printers, heaters and other high-draw devices; on battery they can overload the UPS. Never plug a power strip into the UPS. After setup, run a self-test.\""; } },
    { id: "lift-bend", group: "Moving the UPS", label: "Lift it on your own, bending at the waist", when: function (s) { return !s.placed; },
      wrong: function () { return "28 kg lifted bent at the waist is how backs get injured: you felt a twinge halfway up and put it down."; }, run: function () { return "Halfway up, a sharp twinge in your lower back: you put it down."; } },
    { id: "lift-alone", group: "Moving the UPS", label: "Lift it on your own, knees bent, back straight", when: function (s) { return !s.placed; },
      wrong: function () { return "Good technique, but 28 kg is more than one person should lift: the box says team lift."; }, run: function () { return "You get it off the floor, then set it back down: it's too heavy to carry alone."; } },
    { id: "lift-team", group: "Moving the UPS", label: "Lift it with Dev, both with knees bent and backs straight", when: function (s) { return !s.placed; }, run: function (s) { s.placed = true; return "On three, you and Dev lift it together, knees bent and backs straight, and set it under the rack."; } },
    { id: "cart", group: "Moving the UPS", label: "Wheel it over on the closet's cart", when: function (s) { return !s.placed; }, run: function (s) { s.placed = true; return "You slide the box onto the closet's cart, wheel it to the rack, and unbox the UPS in place."; } },
    { id: "drag", group: "Moving the UPS", label: "Drag the box to the rack by its strap", when: function (s) { return !s.placed; },
      wrong: function () { return "A packing strap isn't a handle: it snaps, and the UPS drops."; }, run: function () { return "The strap creaks: you let go."; } },
    { id: "notify", group: "Telling people", label: "Email everyone: the servers go off at 12:30 for about ten minutes", when: function (s) { return !s.notified; },
      wrong: function (s) { return s.srv !== "on" ? "The mail server is already off: and it's too late to warn anyone now." : null; },
      run: function (s) { if (s.srv !== "on") return "Your email sits in the outbox: MAIL01 is off."; s.notified = true; return "You email everyone: \"FS01 and MAIL01 will be off from 12:30 for about ten minutes while we fit a new UPS. Please save and close anything on the S: drive by 12:25.\""; } },
    { id: "shutdown-srv", group: "The servers", label: "Shut down FS01 and MAIL01 properly", when: function (s) { return s.srv === "on"; },
      wrong: function (s) { return s.notified ? null : "Nobody was warned: Dev was saving to the S: drive."; },
      poison: function (s) { return s.notified ? null : "Nobody was warned before the servers went off: Dev lost the file he was saving to the S: drive."; },
      run: function (s) { s.srv = "down"; return s.notified ? "You shut down FS01 and MAIL01 from their consoles, and their lights go out." : "Their lights go out. Dev: \"Hey! My file on S: just vanished!\""; } },
    { id: "pull-srv", group: "The servers", label: "Pull the servers' plugs while they're running", when: function (s) { return s.srv === "on"; },
      wrong: function () { return "Pulling a running server's plug corrupts files that are being saved."; },
      poison: function () { return "You pulled the servers' power while they were running: a file being saved to FS01 is corrupted, and FS01 will spend an hour checking its disk."; },
      run: function (s) { s.srv = "down"; return "The servers' fans stop dead."; } },
    plugAct("fs01", "FS01 (file server)"), plugAct("mail01", "MAIL01 (mail server)"), plugAct("switch", "The network switch"), plugAct("printer", "The laser printer by the closet door"),
    { id: "strip-in-ups", group: "Where each plug goes", label: "Plug the old surge strip into the UPS for more outlets", when: function (s) { return s.placed; },
      wrong: function () { return "Never a power strip into a UPS: it overloads it, and the quick-start card says so."; }, run: function () { return "You stop with the strip's plug in your hand."; } },
    { id: "ups-on", group: "Power", label: "Switch the UPS on", when: function (s) { return s.placed && !s.upsOn; }, run: function (s) { s.upsOn = true; return "The UPS beeps once, and its display lights up."; } },
    { id: "start-srv", group: "Power", label: "Start FS01 and MAIL01", when: function (s) { return s.srv === "down"; },
      run: function (s) { const on = function (d) { return s.plugs[d] === "old" || s.plugs[d] === "surge" || (s.plugs[d] === "batt" && s.upsOn); }; if (!on("fs01") || !on("mail01")) return "Nothing happens: they're plugged into the UPS, and it's off."; s.srv = "on"; return "FS01 and MAIL01 start up. A few minutes later, both are back."; } },
    { id: "self-test", group: "Power", label: "Run the UPS's self-test", when: function (s) { return s.upsOn && !s.test; },
      run: function (s) { if (upsLoad(s) > 100) return "The self-test fails: OVERLOAD. In a power cut, the UPS would drop everything on it."; if (s.srv !== "on" || (s.plugs.fs01 !== "batt" && s.plugs.mail01 !== "batt")) return "The self-test passes, but nothing that matters is running on the UPS yet, so it proves nothing."; s.test = true; return "The UPS runs on its battery for ten seconds and switches back: SELF-TEST OK. The servers didn't notice."; } },
    { id: "breaker", group: "Power", label: "Test it by switching off the closet's circuit breaker", when: function (s) { return s.upsOn; },
      wrong: function () { return "The breaker feeds more than the closet, and it isn't yours to switch: the self-test is how a UPS is tested."; }, run: function () { return "You stop at the fuse board."; } },
    { id: "all-clear", group: "Telling people", label: "Email everyone: the servers are back", when: function (s) { return s.notified && !s.back; },
      wrong: function (s) { return s.srv !== "on" ? "They aren't back yet." : null; }, run: function (s) { if (s.srv !== "on") return "You stop: they aren't back yet."; s.back = true; return "You email everyone: \"All done: the file and mail servers are back. Thanks for your patience.\""; } }
  ],
  chat: [
    { type: "reply", stage: "help", cust: ["Dev looks up from a tangle of patch cables. \"That the new UPS? I'll grab it for you, it's only a box.\""],
      h: ["Dev's offering to help. What does the box say about lifting it?", "Accept help, but plan the lift: share the load, and keep your back straight."],
      right: ok("Thanks, Dev, but it's 28 kg: let's lift it together."), wrong: [
        no("Go on then, you're stronger than me.", "Oof... it's heavier than it looks.", "Letting someone lift 28 kg alone is how backs get hurt."),
        no("Don't touch it! It's IT's job.", "Sorry I offered.", "Rude, and he was offering to help."),
        no("No need, I'll carry it myself.", "Suit yourself.", "28 kg is a team lift: don't do it alone either."),
        no("Sure, just lift with your back, it's quicker.", "With my back?", "Lifting with your back, not your legs, is how injuries happen."),
        no("Drag it over by the strap.", "The strap?", "A packing strap snaps, and the UPS drops."),
        no("Kick it over to the rack.", "Kick it?", "A joke, and it would damage it."),
        no("Leave it, the delivery driver can come back for it.", "Will he?", "The driver's gone: it's ours to place safely."),
        no("Only if you sign something saying it's your fault if you get hurt.", "...What?", "Nonsense: plan the lift so nobody gets hurt.")] },
    { type: "do", stage: "lift", doing: "Dev's ready to help. The UPS is still in its box by the door.",
      done: function (fleet, t) { return sc(fleet, t).s.placed; },
      after: "The UPS is under the rack.",
      h: ["Read the label on the box.", "Above what one person can safely lift, you share the load or don't carry it at all: legs bent, back straight."],
      moves: [opt("Lift it with Dev, knees bent, or use the cart", true), opt("Lift it alone, bending at the waist", false, "That's how backs get injured."), opt("Lift it alone, bending your knees", false, "28 kg is more than one person should lift: the box says team lift."), opt("Drag it by its strap", false, "Straps snap."), opt("Leave it in the doorway and plug it in there", false, "A trip hazard in the doorway, and nowhere near the rack."), opt("Ask the delivery driver to come back", false, "It's ours to place.")] },
    { type: "reply", stage: "warn", cust: ["\"Hang on: if the servers go off, I'll lose what I'm saving to the S: drive.\""],
      h: ["Dev's worried about losing work. Who else uses those servers?", "Before a planned outage, tell everyone it affects: when, and for how long."],
      right: ok("It's at 12:30 for about ten minutes. I'll email everyone now, so nobody's mid-save."), wrong: [
        no("It's only at 12:30, over lunch, so nobody will be saving anything then. You'll be fine.", "I'm working.", "Assume someone is: tell everyone before a planned outage."),
        no("Then save faster.", "Thanks.", "Rude, and it doesn't stop anyone losing work."),
        no("It's only ten minutes, you'll survive.", "Not if my file corrupts.", "Ten minutes matters when nobody knew it was coming."),
        no("Good point. I'll let Mason know when I start, and he can tell people if he wants to.", "And the rest of us?", "Everyone who uses the servers needs to know."),
        no("I'll pull the plugs quickly, you won't notice.", "I'll notice!", "Pulling a running server's plug is exactly what corrupts files."),
        no("Then I'll move it to three o'clock instead, while you're in your meeting. Nobody will notice.", "My meeting's on Teams...", "Moving it doesn't fix not telling people."),
        no("Just don't save anything today.", "Very funny.", "A joke, not a plan."),
        no("Not my problem, it's Mason's change.", "Right...", "You're the one doing it: you warn people.")] },
    { type: "do", stage: "notify", doing: "It's 12:20. FS01 and MAIL01 are running, and people are using them.",
      done: function (fleet, t) { return sc(fleet, t).s.notified; },
      after: "Everyone knows the servers go off at 12:30.",
      h: ["Who uses FS01 and MAIL01, and how would they know?", "A planned outage is announced before it happens, to everyone it affects."],
      moves: [opt("Email everyone when, and for how long, the servers will be off", true), opt("Just shut them down: it's lunchtime", false, "Someone's always mid-save."), opt("Tell Dev only", false, "Everyone uses the servers."), opt("Put a note on the closet door", false, "Nobody reads the closet door."), opt("Email everyone after you've shut them down", false, "The mail server's off by then, and it's too late."), opt("Wait until everyone's gone home", false, "Mason's change is at 12:30.")] },
    { type: "do", stage: "down", doing: "It's 12:30. Everyone's been told. FS01 and MAIL01 are still running.",
      done: function (fleet, t) { return sc(fleet, t).s.srv === "down"; },
      after: "FS01 and MAIL01 are shut down.",
      h: ["How would you take a server off without losing anything?", "A computer is stopped by its own operating system before anyone touches its power."],
      moves: [opt("Shut down FS01 and MAIL01 properly", true), opt("Pull their power plugs", false, "That corrupts files being saved."), opt("Hold their power buttons in", false, "A forced power-off is as bad as pulling the plug."), opt("Move their plugs while they're running", false, "That's pulling the plug."), opt("Swap their plugs very fast", false, "There's no fast enough for a running server."), opt("Restart them instead", false, "They'd come back on the old strip.")] },
    { type: "do", stage: "plugs", doing: "The servers are off. The UPS is in place, and everything still runs from the old surge strip.",
      done: function (fleet, t) { const p = sc(fleet, t).s.plugs; return p.fs01 === "batt" && p.mail01 === "batt" && p.switch === "batt" && p.printer === "surge"; },
      after: "The servers and the switch are on battery outlets, and the printer on a surge-only outlet.",
      h: ["Read the back of the UPS, and its quick-start card: there are two kinds of outlet.", "What must keep running through a power cut goes on the battery; anything that draws a big surge doesn't."],
      moves: [opt("Servers and switch on battery outlets; printer on surge only", true), opt("Everything on the battery outlets", false, "The laser printer would overload it."), opt("Everything on the surge-only outlets", false, "No battery behind them: nothing rides through a power cut."), opt("The printer on battery, the servers on surge only", false, "Backwards: the printer overloads it, and the servers get no battery."), opt("Plug the old surge strip into the UPS", false, "A strip in a UPS can overload it."), opt("Leave the printer on the old surge strip", false, "The old strip is coming out.")] },
    { type: "do", stage: "up", doing: "Everything's plugged in where it belongs. The servers are still off.",
      done: function (fleet, t) { const s = sc(fleet, t).s; return s.upsOn && s.srv === "on" && s.test; },
      after: "The UPS is on, the servers are back, and its self-test passed.",
      h: ["Everything's in place. What has to come on first, and how do you know the UPS will really work?", "Power up from the source outwards, then prove the protection works before you rely on it."],
      moves: [opt("Switch the UPS on, start the servers, then run its self-test", true), opt("Start the servers before the UPS", false, "They're plugged into it: nothing happens."), opt("Test it by switching off the closet's breaker", false, "The breaker isn't yours to switch: use the self-test."), opt("Skip the test: it's brand new", false, "New kit gets tested before you rely on it."), opt("Start FS01 only", false, "MAIL01 is off for everyone."), opt("Leave the UPS off until there's a power cut", false, "Then it's no use at all.")] },
    { type: "do", stage: "back", doing: "The servers are back up. Everyone was told they'd be off.",
      done: function (fleet, t) { return sc(fleet, t).s.back; },
      after: "Everyone knows the servers are back.",
      h: ["Everyone was told the servers were going off. What do they still not know?", "Close the loop: tell people when an outage is over."],
      moves: [opt("Email everyone that the servers are back", true), opt("Say nothing: they'll notice", false, "People wait, or keep retrying."), opt("Tell Dev only", false, "Everyone was told it was going off."), opt("Wait until someone asks", false, "Close the loop yourself."), opt("Restart them again to be sure", false, "Another outage nobody was warned about."), opt("Put a note on the closet door", false, "Nobody reads it.")] },
    { type: "reply", stage: "close", cust: ["\"Nice. So if the power goes now, everything keeps running?\""],
      h: ["The UPS's display tells you its runtime.", "A UPS buys minutes to shut down safely, not hours to keep working. Say what's protected, and what isn't."],
      right: ok("The servers and switch run about 14 minutes, enough to shut down safely. The printer goes off."), wrong: [
        no("Yes: as long as the UPS's battery is charged, everything in the closet keeps running for good.", "Forever? Wow.", "A UPS battery lasts minutes: give the real runtime."),
        no("Yes: the servers, the switch and the printer all keep running for about 14 minutes now.", "Great, I can still print.", "The printer's on surge only: it goes off."),
        no("Not sure yet. It's brand new, so I'll know once we've actually had a power cut with it.", "Shouldn't you know?", "The display tells you: read it out."),
        no("Only if you don't touch it.", "Er... OK.", "Vague: give the real runtime."),
        no("Doesn't matter, power cuts never happen.", "There was one last month.", "That's why the UPS is there."),
        no("The servers and switch will run for hours on the battery, so everyone can just carry on working.", "Hours? Great.", "It's minutes: enough to shut down safely, not to keep working."),
        no("Ask the electrician.", "Didn't you just fit it?", "You fitted it: tell him what it does."),
        no("Unplug the fridge and it'll last longer.", "The fridge?", "The fridge isn't on it.")] }
  ],
  doneHints: ["It's fitted, tested and everyone knows. Resolve it in Help Desk.", "Close a change once it's done, tested, and the people it affected have been told."],
  doneMoves: [opt("Resolve the ticket", true), opt("Escalate it to Tier 2", false, "It's done."), opt("Switch the breaker off to test it again", false, "Not yours to switch."), opt("Move the printer to the battery side", false, "It would overload the UPS."), opt("Leave the ticket open until the next power cut", false, "The self-test proved it."), opt("Plug the old strip into the UPS", false, "Never.")],
  closeWhere: "Think about the two kinds of outlet, and what a laser printer does when it warms up.",
  close: { prompt: "Mason asks: \"Why did the servers go on battery outlets, but the printer only on surge?\"", options: [
    opt("A laser printer pulls a big surge warming up, and overloads the battery", true),
    opt("The printer doesn't need protecting from power surges at all, ever", false, "It does: that's why it's on a surge-only outlet."),
    opt("There weren't enough battery outlets left for everything on the list", false, "There were six: the printer was kept off them on purpose."),
    opt("Surge-only outlets give a printer more power than the battery ones do", false, "They give the same power, just without a battery behind them."),
    opt("The servers matter more to the office, so they get the newer outlets", false, "It isn't about age: battery for what must stay up, and no big surges on the battery."),
    opt("By law, printers have to be on a different circuit from the office's servers", false, "It's the same UPS: the outlets differ in what's behind them.")] },
  note: { must: [["team lift", "lift", "cart"], ["email", "told", "warn", "notif"], ["shut down", "shutdown", "shut them down"], ["battery"], ["surge"], ["self-test", "self test", "tested"]],
    tip: "How you moved it, who you told and when, how the servers went off, where each plug went and why, the test, and the all-clear." },
  closeAdvice: "It's fitted and tested. Now answer Mason's question on the ticket."
});

/* ===================================================================
   SF5 (run): spare parts arrive at the bench
   =================================================================== */
function grounded(s) { return s.grounded && s.strap && s.clipped; }
const SF5 = safetyTicket({
  id: "SF5", outcome: "resolve", person: "Farah Nkemelu", role: "Finance", mood: 0,
  title: "Check in and store the new spare parts",
  from: "Mason, Team Lead",
  place: { walk: null, where: "your bench", go: "Turn to your bench" },
  brief: ["Mason here. A parcel of spares is on its way up for Tier 2's work next week: two 16 GB memory modules and a 1 TB SSD. Check what came against the delivery note, then put them away in the parts cabinet.",
    "The closet's humidity sensor has been reading low all week. Your strap and mat are on the bench, where you left them on Friday."],
  scene: { grounded: false, strap: false, clipped: false, parcel: "farah", modB: "bag", ssd: "bubble", ticked: false, stored: false },
  scene3d: "strap", views: [["all", "Your mat and strap"], ["earth", "The mat's ground cord"], ["strap", "The wrist strap"]],
  state3d: function (s) { return { grounded: s.grounded, clipped: s.strap && s.clipped }; },
  safe: function (s) { return s.modB === "bagged" && s.ssd === "esd" && s.stored; },
  see: function (s) {
    const out = [];
    out.push(s.parcel === "farah" ? "Farah is at the closet door with the opened parcel, crouching to set the parts on the carpet." : "The parcel is on your mat: two memory modules in antistatic bags (one bag's label is torn off), and the SSD wrapped in plain bubble wrap.");
    out.push(s.grounded ? "The mat's green ground cord is plugged into the EARTH point on the bench." : "The mat's green ground cord lies loose beside the EARTH point: it isn't plugged in.");
    out.push(s.strap ? (s.clipped ? "The wrist strap is on your wrist, its coiled cord clipped to the mat's snap." : "The wrist strap is on your wrist, but its coiled cord hangs loose, clipped to nothing.") : "The wrist strap lies on the mat.");
    if (s.parcel !== "farah") {
      out.push(s.modB === "bag" ? "Module B's bag has lost its label: its part number is on the module's own sticker, inside." : s.modB === "out" ? "Module B is in your hand, held by its edges: its sticker reads \"16GB DDR5-5600 SODIMM · RM16-5600S\"." : "Module B is back in an antistatic bag, labelled RM16-5600S.");
      out.push(s.ssd === "bubble" ? "The SSD is in plain bubble wrap, not an antistatic bag." : "The SSD is sealed in an antistatic bag.");
    }
    if (s.ticked) out.push("The delivery note is checked and signed: all three parts.");
    if (s.stored) out.push("All three parts are in the parts cabinet, in their antistatic bags.");
    return out;
  },
  acts: [
    { id: "humidity", group: "Look (never counts)", look: true, label: "Read the closet's humidity sensor", run: function () { return "22% relative humidity. In dry air like this, static builds up on people very easily: walking across the floor can charge you to thousands of volts."; } },
    { id: "read-note", group: "Look (never counts)", look: true, label: "Read the delivery note", run: function () { return "\"Rafiki's IT Services. 2 × 16GB DDR5-5600 SODIMM, part RM16-5600S. 1 × 1TB NVMe SSD, part NV1T-4. Check and sign.\""; } },
    { id: "through-bag", group: "Look (never counts)", look: true, label: "Read module B's sticker through its bag", when: function (s) { return s.parcel !== "farah" && s.modB === "bag"; }, run: function () { return "The bag is opaque silver: you can't see the sticker through it."; } },
    { id: "ground-mat", group: "Your bench", label: "Plug the mat's ground cord into the EARTH point", when: function (s) { return !s.grounded; }, run: function (s) { s.grounded = true; return "You plug the mat's green ground cord into the EARTH point on the bench."; } },
    { id: "strap-on", group: "Your bench", label: "Put the wrist strap on", when: function (s) { return !s.strap; }, run: function (s) { s.strap = true; return "You put the strap on your wrist, the metal plate against your skin."; } },
    { id: "clip", group: "Your bench", label: "Clip the strap's cord to the mat's snap", when: function (s) { return s.strap && !s.clipped; }, run: function (s) { s.clipped = true; return "You clip the strap's coiled cord to the mat's snap."; } },
    { id: "touch-leg", group: "Your bench", label: "Touch the bench's metal leg to discharge yourself", run: function () { return "You touch the bench's metal leg."; },
      wrong: function () { return "That discharges you once. Move, or shift on your chair, and you build up charge again: a strap clipped to a grounded mat keeps you at ground the whole time."; } },
    { id: "gloves", group: "Your bench", label: "Put on rubber gloves instead of the strap",
      wrong: function () { return "Rubber insulates: it keeps your charge on you, with nowhere to go."; }, run: function () { return "You pull on rubber gloves."; } },
    { id: "read-b", group: "The parts", label: "Take module B out by its edges, and read its sticker", when: function (s) { return s.parcel !== "farah" && s.modB === "bag"; },
      wrong: function (s) { return grounded(s) ? null : "You and the mat aren't both grounded, and the air's dry: static you'd never feel can damage a memory chip."; },
      poison: function (s) { return grounded(s) ? null : "You handled module B without being grounded, on a dry day. Static too small to feel may have damaged it, and there's no way to tell by looking."; },
      run: function (s) { s.modB = "out"; return "You slide module B out, holding it by its edges. Its sticker: \"16GB DDR5-5600 SODIMM · RM16-5600S\"."; } },
    { id: "pass-b", group: "The parts", label: "Hand module B to Farah to read", when: function (s) { return s.parcel !== "farah" && s.modB !== "bagged"; },
      wrong: function () { return "Farah isn't grounded: passing it to her undoes your strap and mat."; }, run: function () { return "You stop: Farah isn't grounded."; } },
    { id: "bag-b", group: "The parts", label: "Seal module B in a new antistatic bag and label it", when: function (s) { return s.modB === "out"; }, run: function (s) { s.modB = "bagged"; return "You slide module B into a new antistatic bag, seal it, and write RM16-5600S on it."; } },
    { id: "ssd-esd", group: "The parts", label: "Move the SSD from its bubble wrap into an antistatic bag", when: function (s) { return s.parcel !== "farah" && s.ssd === "bubble"; },
      wrong: function (s) { return grounded(s) ? null : "You aren't grounded: unwrapping it means handling its bare board."; },
      poison: function (s) { return grounded(s) ? null : "You handled the SSD's bare board without being grounded, on a dry day: it may have been damaged by static you'd never feel."; },
      run: function (s) { s.ssd = "esd"; return "You unwrap the SSD, holding it by its edges, and seal it in an antistatic bag."; } },
    { id: "ssd-plastic", group: "The parts", label: "Put the SSD in a plastic sandwich bag", when: function (s) { return s.parcel !== "farah" && s.ssd === "bubble"; },
      wrong: function () { return "Ordinary plastic builds up static: the opposite of what it needs."; }, run: function () { return "You stop with the sandwich bag."; } },
    { id: "tick", group: "The parts", label: "Check and sign the delivery note", when: function (s) { return s.parcel !== "farah" && !s.ticked; },
      wrong: function (s) { return s.modB === "bag" ? "Module B's part number hasn't been checked: that's signing for something you haven't seen." : null; },
      run: function (s) { if (s.modB === "bag") return "You stop with the pen over module B's line."; s.ticked = true; return "Two RM16-5600S and one NV1T-4: you tick all three and sign the note."; } },
    { id: "store", group: "Putting them away", label: "Put all three in the parts cabinet", when: function (s) { return s.parcel !== "farah" && !s.stored; },
      wrong: function (s) { return s.ssd === "bubble" ? "The SSD is still in plain bubble wrap: that's no protection from static." : s.modB !== "bagged" ? "Module B is still out of its bag." : !s.ticked ? "They haven't been checked against the note yet." : null; },
      run: function (s) { if (s.ssd === "bubble" || s.modB !== "bagged" || !s.ticked) return "You stop: they aren't ready to put away."; s.stored = true; return "You put all three, in their antistatic bags, in the parts cabinet, and lock it."; } },
    { id: "sill", group: "Putting them away", label: "Leave them on the windowsill for now", when: function (s) { return s.parcel !== "farah" && !s.stored; },
      wrong: function () { return "Sun through the window heats them, and a windowsill isn't secure."; }, run: function () { return "You stop at the window."; } },
    { id: "on-ups", group: "Putting them away", label: "Put them on top of the UPS, out of the way", when: function (s) { return s.parcel !== "farah" && !s.stored; },
      wrong: function () { return "The top of a UPS is warm, and it's no place for parts."; }, run: function () { return "You stop: the top of the UPS is warm."; } }
  ],
  chat: [
    { type: "reply", stage: "farah", cust: ["\"Delivery for you! I opened it to check it wasn't mine. Shall I just put them down here?\""],
      h: ["Where's Farah about to put them, and what's the floor made of?", "Thank the helper, then guide them: sensitive parts go straight onto a grounded work surface."],
      right: ok("Thanks, Farah! Could you put the box on my mat instead? Those parts don't like static."),
      then: function (fleet, t) { sc(fleet, t).s.parcel = "mat"; },
      wrong: [
        no("Thanks, Farah! Just pop them down on the carpet there, and I'll sort them out in a minute.", "OK, on the carpet then.", "Carpet builds static: the parts belong on the mat."),
        no("Don't touch those!", "Sorry! I was only helping.", "Snapping at a helper: thank her, then ask."),
        no("Why did you open my parcel?", "It had no name on it...", "Blame doesn't protect the parts: ask her to put them on the mat."),
        no("Rub them on your jumper to clean them first.", "On my jumper? OK...", "Wool and electronics make static: the worst thing she could do."),
        no("Chuck it over, I'll catch it.", "Throw it?", "Throwing parts risks dropping them."),
        no("Thanks, Farah. Could you leave them on the windowsill for now? I'll get to them after lunch.", "The windowsill?", "Heat and sun, and no static protection."),
        no("Stop! Static! Everyone freeze!", "Er... freeze?", "Alarm over a parcel: ask calmly."),
        no("Thanks! Could you pop them on top of the UPS? It's out of the way up there.", "That warm box?", "The top of a warm UPS is no place for parts.")] },
    { type: "do", stage: "bench", cust: ["Farah sets the box on your mat. \"There you go.\""],
      doing: "The parts are on your mat, still in their packaging.",
      done: function (fleet, t) { return grounded(sc(fleet, t).s); },
      after: "You and the mat are grounded.",
      h: ["Look at the mat's ground cord, and at the strap.", "To handle static-sensitive parts, you and the work surface have to be at the same ground, the whole time."],
      moves: [opt("Ground the mat, put the strap on and clip it to the mat", true), opt("Touch the bench's leg to discharge yourself", false, "Once only: you build up charge again as you move."), opt("Put the strap on, but leave it unclipped", false, "A strap connected to nothing does nothing."), opt("Clip the strap to the mat, but leave the mat unplugged", false, "A mat that isn't grounded drains nothing away."), opt("Work quickly so static has no time to build up", false, "Static builds up in a step or two."), opt("Wear rubber gloves instead", false, "Rubber insulates: you keep your charge.")] },
    { type: "reply", stage: "why", cust: ["\"What's the bracelet for? So you don't get a shock?\""],
      h: ["Who is the strap protecting: you, or the parts?", "Explain a safety step simply and truthfully: what it protects, and from what."],
      right: ok("The other way round: it stops me zapping the parts. Static too small to feel can damage them."), wrong: [
        no("Yes: these parts store a charge, and they can give you a nasty shock if you're not grounded.", "Really? I touched them!", "Wrong, and alarming: the parts aren't dangerous to her."),
        no("It's a fitness tracker.", "Oh... really?", "A joke that teaches her nothing."),
        no("Company policy. Don't ask.", "OK, sorry.", "Brushes off an honest question."),
        no("It's complicated, you wouldn't get it.", "Try me.", "Condescending: explain it simply."),
        no("It keeps the parts cool: it draws the heat out of them while I'm handling them on the bench.", "Oh, OK.", "Wrong: it's about static."),
        no("No idea, Mason told me to wear it.", "Right.", "You should know why you take a safety step."),
        no("It earths me, so if anything in the rack shorts out, the current goes through the strap, not me.", "Lightning? Indoors?", "Nonsense."),
        no("It's magnetic: it pulls the dust off.", "Neat.", "Made up.")] },
    { type: "do", stage: "check", doing: "The delivery note needs checking against what came. One module's bag has lost its label.",
      done: function (fleet, t) { const s = sc(fleet, t).s; return s.modB !== "bag" && s.ticked; },
      after: "Module B is RM16-5600S, and all three are checked off.",
      h: ["One part's number isn't on its bag. Where else would it be written?", "Check deliveries against the note before you sign, handling the parts safely to do it."],
      moves: [opt("Read module B's own sticker, grounded, then sign the note", true), opt("Sign the note: it's probably right", false, "That's signing for something you haven't checked."), opt("Read the sticker through the bag", false, "The bag is opaque."), opt("Take it out and read it before you're grounded", false, "Static could damage it."), opt("Hand it to Farah to read", false, "She isn't grounded."), opt("Send it back unchecked", false, "It may be exactly right.")] },
    { type: "do", stage: "store", doing: "Everything's checked. The parts are still out on your mat.",
      done: function (fleet, t) { const s = sc(fleet, t).s; return s.modB === "bagged" && s.ssd === "esd" && s.stored; },
      after: "The parts are bagged and in the cabinet.",
      h: ["How is each part wrapped now, and where do spare parts live?", "Store static-sensitive parts sealed in packaging that protects them from static, somewhere cool, dry and secure."],
      moves: [opt("Bag every part in antistatic bags, then store them in the parts cabinet", true), opt("Leave the SSD in its bubble wrap", false, "Ordinary bubble wrap builds up static."), opt("Put the SSD in a plastic sandwich bag", false, "Ordinary plastic builds up static."), opt("Leave them on the windowsill", false, "Sun and heat."), opt("Put them on top of the UPS", false, "Warm, and not secure."), opt("Leave them out on the mat for Tier 2", false, "In the open, where anyone could pick one up.")] },
    { type: "reply", stage: "close", cust: ["\"All sorted? I'll tell Mason it came.\""],
      h: ["Farah helped. How do you end on a good note, and save the parts from the carpet next time?", "Thank people for helping, and give one friendly pointer for next time."],
      right: ok("All checked and stored, thanks for bringing it up. Next time, pop parcels on my mat."), wrong: [
        no("All sorted, thanks. Next time, though, please don't open parcels that are addressed to IT.", "Sorry I bothered.", "Ends on blame: thank her."),
        no("Mostly. One of the modules might have been damaged on the carpet earlier, but we'll see.", "Fried? By me?", "Don't alarm her with guesses."),
        no("I'll tell Mason, you don't need to.", "OK...", "She's helping: be gracious."),
        no("Yep. Bye.", "Oh. Bye.", "Abrupt."),
        no("Sorted, no thanks to you.", "Excuse me?", "Rude."),
        no("Yes, they're on the windowsill.", "OK...", "They're in the cabinet, and the sill would be wrong."),
        no("Don't tell Mason, he'll ask why it took so long.", "Why would I hide it?", "Never hide work from your lead."),
        no("All sorted, thanks. Honestly, the static thing is mostly a myth these days, but it's habit.", "Then why the bracelet?", "Undoes everything you just explained.")] }
  ],
  doneHints: ["The parts are checked and stored. Resolve it in Help Desk.", "Close a job once the work is done, checked and put away properly."],
  doneMoves: [opt("Resolve the ticket", true), opt("Escalate it to Tier 2", false, "Nothing is left for Tier 2 here."), opt("Take module B out again to double-check it", false, "It's checked and stored."), opt("Leave the strap clipped on all day", false, "Not needed to close the job."), opt("Move the parts to the windowsill", false, "Heat and sun."), opt("Ask Farah to sign the note too", false, "You've signed it.")],
  closeWhere: "Think about the size of a charge that harms a chip, compared with one you can feel.",
  close: { prompt: "Mason asks: \"Module B looked fine after you handled it. Why the strap, then?\"", options: [
    opt("Static too small to feel can damage a chip, and the damage may not show", true),
    opt("The strap stops you getting an electric shock from the memory module", false, "The module can't shock you: the strap protects the part from you."),
    opt("Memory only works if it has been grounded before it goes into a PC", false, "Grounding isn't a step a part needs: it's protection while it's handled."),
    opt("The strap keeps your fingers off the module's gold contacts", false, "It doesn't: holding it by its edges does that."),
    opt("Without a strap the module would have felt hot to the touch afterwards", false, "Static doesn't heat parts: it damages them invisibly."),
    opt("Strap use is only habit: static rarely harms modern memory modules at all", false, "Modern chips are more sensitive, not less.")] },
  note: { must: [["strap", "wrist"], ["ground", "earth"], ["antistatic", "anti-static", "esd"], ["edge", "sticker", "part number"], ["cabinet", "stored"]],
    tip: "How you set up the bench, how you checked module B, what each part is stored in, and where." },
  closeAdvice: "The parts are checked and stored. Now answer Mason's question on the ticket."
});

/* ===================================================================
   SF6 (run): the quarterly safety walk-round of the closet
   =================================================================== */
const SF6 = safetyTicket({
  id: "SF6", outcome: "resolve", person: "Pat Morgan", role: "Facilities", mood: 0,
  title: "The closet's quarterly safety walk-round",
  from: "Mason, Team Lead",
  place: { walk: null, where: "the network closet", go: "Look round the closet" },
  brief: ["Mason here. Pat Morgan, the building's facilities manager, is doing the quarterly safety walk-round of our closet at 3. Go round with Pat: fix what's ours to fix as you go, and hand Pat anything that belongs to the building.",
    "IT looks after everything plugged in, the cabling and what's stored in here. The building looks after the walls, the air conditioning and the fire equipment."],
  scene: { chained: true, vent: "blocked", temp: 31, cable: "door", ext: "water", lookedExt: false },
  scene3d: "closet", views: [["all", "The rack's corner"], ["strips", "The power strips"], ["ext", "The extinguisher by the rack"]],
  state3d: function (s) { return { chained: s.chained, ext: s.ext, lcd: ["ONLINE", "Battery 100%", "Load 41%  · 13 min"] }; },
  safe: function (s) { return !s.chained && s.vent === "clear" && s.cable === "routed" && s.lookedExt; },
  see: function (s) {
    const out = [];
    out.push(s.chained ? "Behind the rack, the label printer and the spare monitor run from a second surge strip, which is plugged into an outlet on the first strip, which is plugged into the wall." : "The second strip is gone: the label printer and the spare monitor are plugged straight into the first strip's free outlets.");
    out.push(s.vent === "blocked" ? "Boxes of printer paper are stacked against the air-conditioning vent, low on the wall." : "The air-conditioning vent is clear: the paper boxes are on the shelf across the room.");
    out.push("The closet thermometer reads " + s.temp + " °C (" + Math.round(s.temp * 9 / 5 + 32) + " °F)" + (s.vent === "clear" ? ", and falling." : "."));
    out.push(s.cable === "door" ? "A network cable runs across the doorway, held down with tape that's curling up at the edges." : "The network cable runs along the wall inside a cable cover, clear of the doorway.");
    out.push("A red extinguisher hangs on the wall by the rack." + (s.lookedExt ? " Its label says WATER: \"Class A: wood, paper, cloth. NEVER on electrical equipment\"." : ""));
    return out;
  },
  acts: [
    { id: "look-power", group: "Look (never counts)", look: true, label: "Follow the power cords behind the rack", run: function (s) { return s.chained ? "The UPS feeds the rack. Beside it, a surge strip in the wall socket has a second surge strip plugged into it, and that one runs the label printer and the spare monitor." : "Each device goes to the UPS or to the one surge strip in the wall."; } },
    { id: "look-temp", group: "Look (never counts)", look: true, label: "Read the closet thermometer", run: function (s) { return s.temp + " °C (" + Math.round(s.temp * 9 / 5 + 32) + " °F). The equipment in the rack wants the room below about 27 °C (80 °F)."; } },
    { id: "look-ext", group: "Look (never counts)", look: true, label: "Read the label on the extinguisher by the rack", run: function (s) { s.lookedExt = true; return "WATER. \"Class A: wood, paper, cloth. NEVER on electrical equipment.\""; } },
    { id: "unchain", group: "Power", label: "Unplug the second strip and move its devices onto the first", when: function (s) { return s.chained; }, run: function (s) { s.chained = false; return "You unplug the second strip, move the label printer and the spare monitor to the first strip's two free outlets, and take the second strip away."; } },
    { id: "third-strip", group: "Power", label: "Add another strip to the chain for spare outlets", when: function (s) { return s.chained; },
      wrong: function () { return "A third strip on the chain puts even more load through the first strip and the wall socket."; }, run: function () { return "You stop with a third strip in your hand."; } },
    { id: "strip-ups", group: "Power", label: "Plug the second strip into the UPS instead", when: function (s) { return s.chained; },
      wrong: function () { return "A power strip never goes into a UPS either: it overloads it."; }, run: function () { return "You stop at the UPS."; } },
    { id: "vent", group: "The room", label: "Move the paper boxes off the air-conditioning vent", when: function (s) { return s.vent === "blocked"; }, run: function (s) { s.vent = "clear"; s.temp = 29; return "You move the paper boxes to the shelf across the room. Cool air blows from the vent, and the thermometer starts to fall."; } },
    { id: "prop", group: "The room", label: "Prop the closet door open with the extinguisher to cool it down",
      wrong: function () { return "An extinguisher is for fires, not a doorstop, and a propped-open door lets fire and smoke through."; }, run: function () { return "You stop with the extinguisher in your hands."; } },
    { id: "fan", group: "The room", label: "Bring in a desk fan", when: function (s) { return s.vent === "blocked"; },
      wrong: function () { return "A fan treats the symptom: the vent is still blocked, and the cool air can't get in."; }, run: function () { return "The fan just pushes the warm air around."; } },
    { id: "cover", group: "The doorway", label: "Re-route the cable along the wall under a cable cover", when: function (s) { return s.cable === "door"; }, run: function (s) { s.cable = "routed"; return "You re-route the cable along the wall and fit a cable cover over it, clear of the doorway."; } },
    { id: "more-tape", group: "The doorway", label: "Tape the cable down with more tape", when: function (s) { return s.cable === "door"; },
      wrong: function () { return "Tape lifts at the edges again within days: it's still a trip edge across a doorway."; }, run: function () { return "Fresh tape, and the same cable across the door."; } },
    { id: "sign", group: "The doorway", label: "Put a \"Mind the cable\" sign on the door", when: function (s) { return s.cable === "door"; },
      wrong: function () { return "A sign warns about a hazard, but leaves it there."; }, run: function () { return "The sign goes up; the cable stays."; } },
    { id: "take-ext", group: "Fire safety", label: "Take the water extinguisher away",
      wrong: function () { return "Then the closet has no extinguisher at all until a new one comes."; }, run: function () { return "You stop: the closet would have none."; } },
    { id: "swap-ext", group: "Fire safety", label: "Fetch the CO₂ extinguisher from the corridor and hang it here",
      wrong: function () { return "That leaves the corridor by Office 1 without one. Extinguishers are the building's, placed by its fire plan."; }, run: function () { return "You stop at the corridor: that would leave it without one."; } }
  ],
  chat: [
    { type: "reply", stage: "open", cust: ["Pat arrives with a clipboard. \"Afternoon! Quarterly walk-round. Show me anything that's the building's, and I'll get it on my list.\""],
      h: ["Pat looks after the building. What's yours to fix, and what's theirs?", "A safety walk-round goes best as a team: fix what's yours, and report what isn't."],
      right: ok("Thanks, Pat. I'll fix what's IT's as we go, and show you anything that's the building's."), wrong: [
        no("Thanks, Pat, but it's all fine in here this quarter. You can skip us and tick it off.", "I'll have a look anyway.", "Waving off a safety check hides hazards."),
        no("Can you come back later? I'm busy.", "It's booked for three...", "A booked safety check is part of the job."),
        no("Thanks, Pat, but everything in this closet is IT's, so there won't be anything for your list.", "Some of it's the building's...", "Territorial: work with facilities, not against them."),
        no("Write up whatever you like, Pat. I'll look at your list when I've got a spare afternoon.", "That's not how this works.", "Hostile: the walk-round is there to get things fixed."),
        no("The building's stuff in here is a disgrace.", "Let's see, then.", "Blame before you've even started."),
        no("Mind the cable in the doorway, it's been there for months.", "Months?", "Pointing out a hazard you've been leaving isn't a fix: fix it."),
        no("Facilities never fixes anything anyway.", "Charming.", "Rude, and it won't get anything fixed."),
        no("Hi Pat! Fancy a coffee first?", "After, maybe.", "Friendly, but it's a safety check: get on with it.")] },
    { type: "do", stage: "power", doing: "Pat's following you round with the checklist.",
      done: function (fleet, t) { return !sc(fleet, t).s.chained; },
      after: "No more chained strips.",
      h: ["Follow the power cords from the wall to the equipment.", "Every device's power should reach the wall through one strip at most: a chain of strips overloads the first."],
      moves: [opt("Unplug the second strip and move its devices to the first", true), opt("Leave it: the strips protect each other", false, "Chained strips overload the first one and the wall socket."), opt("Add a third strip for spare outlets", false, "More load through the chain."), opt("Plug the second strip into the UPS instead", false, "Strips don't go into a UPS either."), opt("Tape the two plugs together so they can't come apart", false, "That hides the hazard; it doesn't remove it."), opt("Report it to Pat for facilities to fix", false, "It's IT's cabling: yours to fix now.")] },
    { type: "do", stage: "heat", doing: "Pat's fanning the clipboard: \"Warm in here, isn't it?\"",
      done: function (fleet, t) { return sc(fleet, t).s.vent === "clear"; },
      after: "The vent is clear, and the closet is cooling.",
      h: ["How warm is it in here, and where is the cool air meant to come from?", "Equipment needs its cooling airflow clear: nothing stacked in front of a vent."],
      moves: [opt("Move the paper boxes off the air-conditioning vent", true), opt("Prop the door open with the extinguisher", false, "An extinguisher isn't a doorstop, and a propped door lets fire and smoke through."), opt("Switch the network switch off to cool the room", false, "That cuts the office off."), opt("Report the heat to Pat and leave the boxes", false, "The boxes are IT's: move them."), opt("Bring in a desk fan", false, "That treats the symptom: the vent is blocked."), opt("Ignore it: it's always warm in here", false, "Heat shortens equipment's life.")] },
    { type: "do", stage: "trip", doing: "Pat steps carefully over something in the doorway.",
      done: function (fleet, t) { return sc(fleet, t).s.cable === "routed"; },
      after: "The doorway is clear.",
      h: ["Watch where Pat had to step.", "A trip hazard is removed, not just marked: keep cables out of walkways."],
      moves: [opt("Re-route the cable along the wall under a cable cover", true), opt("Tape it down with more tape", false, "Tape lifts again: still a trip edge."), opt("Put a \"Mind the cable\" sign on the door", false, "It warns, but leaves the hazard."), opt("Leave it: everyone knows it's there", false, "Visitors don't."), opt("Unplug it and leave it on the floor", false, "Still a trip hazard, and something's off the network."), opt("Report it to Pat", false, "It's IT's cable: yours to fix.")] },
    { type: "do", stage: "fire", doing: "Pat's working down the checklist.",
      done: function (fleet, t) { return sc(fleet, t).s.lookedExt; },
      after: "You've read the extinguisher's label.",
      h: ["What on the checklist haven't you looked at yet? Something red, by the rack.", "Check that fire equipment is the right type for what it would be used on."],
      moves: [opt("Read the extinguisher's label", true), opt("Assume it's fine: it's red", false, "They're all red: the label says what it's for."), opt("Test it with a quick squirt", false, "That empties it, and it's water beside live equipment."), opt("Check its expiry date only", false, "Its type matters most here."), opt("Skip it: extinguishers are facilities' job", false, "Spotting a wrong one is everyone's job."), opt("Weigh it to check it's full", false, "Full of the wrong thing is still wrong.")] },
    { type: "reply", stage: "report", cust: ["\"Anything for my list?\""],
      h: ["You read something on that extinguisher's label.", "Report a hazard clearly: what it is, where it is, and what's needed instead."],
      right: ok("Yes: the extinguisher by the rack is water. It needs to be CO₂, for electrical equipment."), wrong: [
        no("No, all good in here.", "Great, I'll tick it off.", "The water extinguisher is a real hazard: report it."),
        no("Your extinguisher's useless. Sort it out.", "There's no need to be rude.", "Report it; don't attack."),
        no("Just one: I'll move the CO₂ extinguisher from the corridor in here, so you needn't bother.", "Then the corridor has none!", "Extinguishers are placed by the building's fire plan."),
        no("The extinguisher's empty.", "Is it? Let me see.", "It isn't empty: it's the wrong type."),
        no("Get rid of the extinguisher, we don't need one.", "Every room needs one.", "Removing it leaves no protection at all."),
        no("Maybe have a look at the extinguisher by the rack sometime? I'm not too sure about it.", "Not sure about what?", "Vague: say exactly what's wrong and what's needed."),
        no("The water one's fine: water puts out anything.", "Does it?", "Water conducts electricity: never on electrical equipment."),
        no("Yes: could you add a fire blanket by the rack, alongside the water extinguisher that's there?", "A blanket? For a rack?", "A fire blanket is for a pan or clothing: a rack needs a CO₂ extinguisher.")] },
    { type: "reply", stage: "push", cust: ["\"We've had the water one there for years and never had a problem.\""],
      h: ["Pat needs a reason, not a rule.", "When someone pushes back on safety, stay polite and give the reason in plain words."],
      right: ok("I understand. But water conducts electricity: on a rack fire, it could shock whoever uses it."), wrong: [
        no("Fair enough, Pat. If it's been fine for years, let's leave it where it is and move on.", "Good, saves me a job.", "Giving in on a real hazard."),
        no("That's ridiculous, everyone knows that.", "Well, I didn't.", "Condescending: explain it."),
        no("Then I'll have to report it to health and safety myself, Pat, and they can make you swap it.", "Report me?", "Threats close the conversation: explain the risk."),
        no("You've been lucky, then.", "Lucky?", "True but snide: explain why."),
        no("Not my problem if it burns down.", "It's your equipment!", "It is your problem: explain the risk."),
        no("I understand, and to be fair, water's fine on electrics as long as you stand far enough back.", "Is it?", "Wrong: water conducts."),
        no("Ask Mason, he'll tell you.", "I'm asking you.", "You know why: explain it."),
        no("Years? This place is a museum.", "Charming.", "Rude.")] },
    { type: "reply", stage: "close", cust: ["\"Fair enough. I'll get a CO₂ one swapped in this week. Anything else?\""],
      h: ["Pat's filling in the checklist.", "Close a walk-round by summing up what was fixed and what's handed over, and thank them."],
      right: ok("That's everything. I've fixed the power strip, the vent and the cable. Thanks, Pat."), wrong: [
        no("No. Bye.", "Oh. OK.", "Abrupt."),
        no("This week? Do it today.", "I'll do my best.", "Demanding: thank Pat."),
        no("That's it, and don't let it happen again.", "Me?", "Blame."),
        no("Just one more: could you get someone to move the paper boxes off the vent as well, please?", "I thought you did that?", "You did: say so."),
        no("That's everything, Pat: just the extinguisher. Everything else in here was already fine.", "OK.", "Tell Pat what you fixed, so the checklist is right."),
        no("Thanks, but the water one would have been fine really.", "So should I swap it or not?", "Undoes what you just agreed."),
        no("Let's not write any of this down.", "It's a safety check: it gets written down.", "Safety checks are documented."),
        no("Whatever. I'm off to lunch.", "Right...", "Rude: close it properly.")] }
  ],
  doneHints: ["The walk-round's done and Pat has the extinguisher on the list. Resolve it in Help Desk.", "Close a safety check once what's yours is fixed and what isn't has been handed over."],
  doneMoves: [opt("Resolve the ticket", true), opt("Escalate it to Tier 2", false, "Nothing is left for Tier 2."), opt("Swap the extinguisher yourself after all", false, "Pat's handling it, under the fire plan."), opt("Put the paper boxes back by the vent", false, "That blocks it again."), opt("Leave the ticket open until the swap", false, "It's on Pat's list."), opt("Add the spare strip back for later", false, "That's the chain again.")],
  closeWhere: "Think about who decides where each extinguisher hangs, and what moving one would leave behind.",
  close: { prompt: "Mason asks: \"Why did you report the extinguisher to Pat instead of swapping it yourself?\"", options: [
    opt("Extinguishers are placed by the building's fire plan: moving one leaves a gap", true),
    opt("IT staff are never allowed to touch a fire extinguisher, even in a real fire", false, "You may use one in a fire: placing them is the building's job."),
    opt("A CO₂ extinguisher is too heavy for one person to carry down a corridor", false, "It isn't too heavy: it belongs where the fire plan puts it."),
    opt("A water extinguisher is fine in a network closet, so it didn't need swapping at all", false, "Water conducts electricity: that's why it needed swapping."),
    opt("Pat would have been upset to find IT had fixed it without asking first", false, "Feelings aren't the reason: the fire plan is."),
    opt("The corridor's CO₂ extinguisher was already empty, so there wasn't one", false, "It wasn't, and moving it would leave the corridor without one.")] },
  note: { must: [["chain", "daisy", "strip"], ["vent", "airflow", "boxes"], ["cable"], ["extinguisher"], ["co2", "co₂", "carbon dioxide"], ["pat", "facilities"]],
    tip: "Each hazard you found, what you fixed and how, what you handed to Pat, and why." },
  closeAdvice: "The walk-round's done. Now answer Mason's question on the ticket."
});

export { SF1, SF2, SF3, SF4, SF5, SF6 };
export const SAFETY_TICKETS = [SF1, SF2, SF3, SF4, SF5, SF6];
