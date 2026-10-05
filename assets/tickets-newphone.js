/* =====================================================================
   OI6 (run): a new company phone for Priya Nair, set up on the bench as a
   fully managed company phone. Power it on; enrol it from the welcome
   screen by QR code (tap the welcome screen six times, scan the code that
   device management shows; or afw#setup at the sign-in); join
   Rafiki-Staff; accept that the organisation owns it; set the screen
   lock the policy asks for; install the waiting security update (the
   battery is low: the charger goes in first). Device management then
   shows it compliant.
   ===================================================================== */
import * as NP from "./newphone.js";

function opt(label, correct, why) { return { label: label, correct: !!correct, why: why || "" }; }
export const ORDER6 = ["power", "enrol", "scan", "wifi", "accept", "lock", "update", "done"];
function P(fleet) { return NP.get(fleet, "OI6"); }
function core(m) {
  if (NP.ready(m)) return "done";
  if (m.setup.done && m.enrol !== "managed") return "personal";
  if (m.enrol === "managed") return m.lock ? "update" : "lock";
  if (m.power === "off") return "power";
  if (m.setup.scanned) return m.setup.wifi ? "accept" : "wifi";
  if (m.screen === "qr" || m.screen === "dpc") return "scan";
  return "enrol";
}
export function oi6State(m) {
  const c = core(m);
  if (c === "personal") return { stage: "personal", score: 0 };
  return { stage: c, score: ORDER6.indexOf(c) };
}
function stage(fleet) { const m = P(fleet); return m ? oi6State(m).stage : "none"; }

export const OI6 = {
  id: "OI6", kind: "newphone", extra: true, topic: "OS installation", domain: "Operating systems", objective: "working with Windows, macOS, Linux, and mobile operating systems",
  tier: 1, outcome: "resolve", machine: "TECH", category: "Operating systems › OS installation",
  title: "Priya's new company phone: set it up and enrol it",
  from: "Mason, Team Lead",
  brief: ["Mason here. Priya Nair starts on Monday, and their company phone has arrived: a TechCom T7, new in the box, on your bench. Set it up so it's a company phone from the first minute, and hand it over ready to use.",
    "Our company phones are enrolled by QR code: device management shows the code for this phone, and it's already assigned to Priya. The staff Wi-Fi is Rafiki-Staff, password T3amR@fiki2026.",
    "Our policy for company phones is in device management. Priya changes the screen lock to their own at handover, so set whatever the policy accepts and write it on the handover slip."],
  setup: function (fleet) { NP.add(fleet, { id: "OI6", owner: "Priya Nair" }); },
  stage: stage,
  goal: function (fleet) { return stage(fleet) === "done"; },
  scoreFn: function (fleet) { const m = P(fleet); return m ? oi6State(m).score : 0; },
  notReady: function (fleet) {
    const s = stage(fleet);
    if (s === "personal") return "Mason: \"Device management can't manage that phone the way it manages a company one.\"";
    if (s === "update") return "Device management says the phone isn't compliant yet.";
    if (s === "lock") return "The phone is still in its set-up.";
    return "Mason: \"It isn't enrolled yet: device management doesn't know it.\"";
  },
  judge: function (act) {
    if (act.type !== "newphone") return { guess: false };
    const r = act.res || {};
    if (act.op === "lock" && r.ok && r.done && r.enrol !== "managed") return { guess: true, say: "That finished the set-up without enrolling it: an unmanaged phone gets none of the company's policies, and a phone that's finished set-up can't become fully managed. Only a new or erased phone can." };
    if (act.op === "work-profile" && r.ok) return { guess: true, say: "A work profile is for a personal phone: it manages only the work apps. A company-owned phone is enrolled as fully managed, from set-up." };
    if (act.op === "erase" && r.ok && act.was === "managed") return { guess: true, say: "That erased the enrolment too: the phone has to be set up and enrolled all over again." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      power: ["The phone is new in the box and switched off. How does a phone that's off start?", "A short press wakes a phone that's already on; starting one that's off takes longer on the same button."],
      enrol: ["Mason's note says how company phones are enrolled. Where does that kind of set-up start?", "Enrolling a company-owned phone happens at the very start of set-up, from the welcome screen, before any account is added."],
      scan: ["The phone is waiting to scan. What is it waiting to see?", "The code the phone needs comes from the company's side, not from the phone."],
      wifi: ["Read what the phone needs before it can go on.", "Set-up downloads the company's settings, so it needs a network that reaches the internet without a web sign-in page."],
      accept: ["Read the screen word for word: whose phone does it say this is?", "A company-owned phone is one the organisation manages. That's what this screen asks you to confirm."],
      lock: ["Read what the organisation requires before set-up can finish.", "Company policy decides which kinds of screen lock are allowed, and how strong a PIN must be."],
      update: ["Compare what device management requires with what the phone is running.", "A phone won't install a system update on a low battery unless it's charging."],
      personal: ["Look at device management: how does it see this phone?", "A phone that's finished set-up can't become fully managed afterwards."],
      done: ["Device management says compliant. Close it out on Help Desk.", "The close question is about where enrolment has to happen."]
    };
    return H[stage(fleet)] || H.enrol;
  },
  moves: function (fleet) {
    const X = {
      power: [opt("Press and hold the power button", true),
        opt("Press the power button briefly", false, "A short press does nothing to a phone that's off."),
        opt("Plug in the charger and wait for it to start", false, "Charging doesn't start it: it stays off."),
        opt("Hold power and volume down for recovery mode", false, "Recovery is for repair, not a first set-up."),
        opt("Send it back: it's dead", false, "It's only switched off."),
        opt("Escalate to Tier 2", false, "You can start a phone.")],
      enrol: [opt("Tap the blank part of the welcome screen six times", true),
        opt("Press Start, sign in later, then enrol it", false, "Once set-up finishes, a phone can't become fully managed."),
        opt("Press Start and skip the Google Account", false, "That finishes it as a personal phone, unmanaged."),
        opt("Press Start and add a work account in Settings", false, "That makes a work profile: for personal phones."),
        opt("Sign in with Priya's personal Google Account", false, "A company phone isn't tied to a personal account."),
        opt("Escalate: only the carrier can enrol it", false, "Device management enrols it, from set-up.")],
      scan: [opt("Show the code in device management, then scan it", true),
        opt("Scan the barcode on the phone's box", false, "That's the serial number, not the company's set-up."),
        opt("Scan the sticker on the back of the access point", false, "Wi-Fi, not enrolment."),
        opt("Cancel and press Start instead", false, "That's the personal set-up."),
        opt("Type the serial number into the phone", false, "The phone asks for a code to scan."),
        opt("Escalate to Tier 2", false, "Device management is yours to use.")],
      wifi: [opt("Join Rafiki-Staff with the password in the note", true),
        opt("Join Rafiki-Guest: it has no password", false, "It needs a web sign-in page, which set-up can't open."),
        opt("Join VM-4F2A9C, the strongest signal", false, "A neighbour's network: no password, and not ours."),
        opt("Set up offline", false, "The company's set-up has to download."),
        opt("Use mobile data", false, "There's no SIM in it yet."),
        opt("Cancel the set-up", false, "Starts again from the welcome screen.")],
      accept: [opt("Accept & continue", true),
        opt("Cancel: it says the company can see the phone", false, "That's what a company phone is."),
        opt("Restart it to skip this screen", false, "It comes back, or set-up starts again."),
        opt("Erase it and set it up as personal", false, "Then it's unmanaged."),
        opt("Turn off Wi-Fi so it can't report", false, "It needs Wi-Fi to finish."),
        opt("Escalate to Tier 2", false, "Accepting is the job.")],
      lock: [opt("Set a PIN of six or more digits, no runs", true),
        opt("Skip the screen lock: Priya sets one", false, "The policy refuses Skip."),
        opt("Set a pattern", false, "The policy doesn't allow a pattern."),
        opt("Set the PIN 123456", false, "A run of digits is refused."),
        opt("Set the PIN 1111", false, "Too short, and a repeat."),
        opt("Turn off the policy in device management", false, "Not yours to turn off.")],
      update: [opt("Plug in the charger, then install the update", true),
        opt("Hand it over: it updates itself overnight", false, "Priya starts on a non-compliant phone."),
        opt("Erase it and set it up again", false, "An erase doesn't download anything."),
        opt("Turn on Battery Saver, then install", false, "Battery Saver doesn't charge it."),
        opt("Install it over mobile data", false, "There's no SIM yet, and Wi-Fi is fine."),
        opt("Escalate: the update is broken", false, "Read why it refused.")],
      personal: [opt("Erase all data, then enrol from the welcome screen", true),
        opt("Add a work account in Settings", false, "A work profile: for personal phones."),
        opt("Hand it over as it is", false, "Unmanaged: no policies, no remote wipe."),
        opt("Show the QR code and scan it from Settings", false, "There's no scanner after set-up."),
        opt("Restart it to get set-up back", false, "A finished set-up stays finished."),
        opt("Escalate to Tier 2", false, "Erase it: there's nothing on it.")],
      done: [opt("Resolve the ticket", true),
        opt("Add your own Google Account to it", false, "It's Priya's phone."),
        opt("Erase it to be sure it's clean", false, "That removes the enrolment."),
        opt("Turn off the screen lock for Priya", false, "The policy needs it."),
        opt("Escalate", false, "It's done."),
        opt("Take the Wi-Fi off it", false, "Priya needs it.")]
    };
    return X[stage(fleet)] || X.enrol;
  },
  closeWhere: "Think about the order of things: when did you enrol it, and could you have done it later?",
  close: { prompt: "Mason asks: \"Why did you enrol it from the welcome screen, and not set it up first and enrol it afterwards?\"", options: [
    opt("Only a new or erased phone can be set up as fully managed", true),
    opt("The QR code from device management expires an hour after it's shown", false, "The code doesn't expire like that. Set-up is what matters."),
    opt("Apps installed during a normal set-up would block the device policy app", false, "Nothing blocks it. A phone that's finished set-up can only get a work profile."),
    opt("A Google Account added first locks the phone to that account for good", false, "That's Factory Reset Protection, and an erase from Settings clears it. Not the reason."),
    opt("Enrolment needs the phone's original Android version, before any update", false, "Updates don't stop enrolment, and an erase keeps them."),
    opt("The Wi-Fi password can only be entered during the very first set-up", false, "Wi-Fi can be joined any time from Settings.")] },
  note: { must: [["qr", "afw#setup"], ["fully managed", "company-owned", "company owned"], ["rafiki-staff", "wi-fi", "wifi"], ["pin", "screen lock", "password"], ["update", "security update", "1 september"], ["charger", "charging", "battery"], ["compliant", "device management"]],
    tip: "How it was enrolled (QR from the welcome screen), the Wi-Fi it joined, the screen lock the policy asked for, the update and why it needed the charger, and that device management shows it compliant." },
  closeAdvice: "Device management shows the phone compliant. Now answer Mason's question on the ticket.",
  advice: function (fleet) {
    const s = stage(fleet);
    if (s === "personal") return "Look at how device management sees the phone now, and compare it with what Mason asked for: a company phone from the first minute.";
    if (s === "update") return "Device management lists the company's policy and whether the phone meets it. Read both, then read what the phone says when you act on it.";
    return "The phone is on your bench, new in the box. Read Mason's note again: how are company phones enrolled, and where does that start?";
  }
};
export const NEWPHONE_TICKETS = [OI6];
