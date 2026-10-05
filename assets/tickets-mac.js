/* =====================================================================
   OI5 (run): a leaver's Mac, wiped for a new starter. Into macOS
   Recovery (press and hold the power button), Disk Utility: erase the
   Macintosh HD volume group as APFS, activate the Mac (Activation Lock is
   still on from the leaver's Apple Account: Rafiki's device management
   releases it), Reinstall macOS, and leave it at Setup Assistant's Hello.
   ===================================================================== */
import * as MAC from "./mac.js";

function opt(label, correct, why) { return { label: label, correct: !!correct, why: why || "" }; }
export const ORDER5 = ["recovery", "erase", "activate", "reinstall", "done"];
function M(fleet) { return MAC.get(fleet, "OI5"); }
function core(m) {
  if (MAC.ready(m)) return "done";
  if (!m.disk.erased || m.disk.hasData) return ["recovery", "du", "ri", "tm", "safari"].indexOf(m.screen) >= 0 ? "erase" : "recovery";
  if (!m.activated) return "activate";
  return "reinstall";
}
export function oi5State(m) {
  const c = core(m); let st = c, cap = ORDER5.length;
  if (m.disk.erased && m.disk.fmt !== "APFS") { st = "format"; cap = ORDER5.indexOf("erase"); }
  else if (m.disk.hasData && MAC.lastAt(m, function (e) { return e.kind === "tm-restore" || (e.kind === "reinstalled" && e.kept); }) >= 0) st = "kept";
  return { stage: st, score: Math.min(ORDER5.indexOf(c), cap) };
}
function stage(fleet) { const m = M(fleet); return m ? oi5State(m).stage : "none"; }

export const OI5 = {
  id: "OI5", kind: "mac", extra: true, topic: "OS installation", domain: "Operating systems", objective: "working with Windows, macOS, Linux, and mobile operating systems",
  tier: 1, outcome: "resolve", machine: "TECH", category: "Operating systems › OS installation",
  title: "Sam's MacBook: wipe it for the new designer",
  from: "Mason, Team Lead",
  brief: ["Mason here. Sam Reed left on Friday, and their MacBook goes to Priya Nair, our new designer, on Monday. Wipe it and reinstall macOS, so Priya starts from Setup Assistant's Hello screen like any new Mac.",
    "Sam's work is already on the file server: nothing on the Mac needs keeping. It's on your bench, on the wired network.",
    "Recovery will ask for an administrator: use rafikiadmin (Bench-Tech-2026). The Mac is enrolled in our device management, if you need anything from it."],
  setup: function (fleet) { MAC.add(fleet, { id: "OI5", leaver: "Sam Reed", leaverUser: "sam.reed", starter: "Priya Nair", lockAccount: "s•••@icloud.com" }); },
  stage: stage,
  goal: function (fleet) { return stage(fleet) === "done"; },
  scoreFn: function (fleet) { const m = M(fleet); return m ? oi5State(m).score : 0; },
  notReady: function (fleet) {
    const s = stage(fleet);
    if (s === "kept") return "Mason: \"Priya would be looking at Sam's account and files. That's not wiped.\"";
    if (s === "activate") return "The Mac is stuck at Activate Mac: nobody can use it like this.";
    if (s === "format") return "Mason: \"Will macOS even install on that?\"";
    if (s === "reinstall") return "The disk is empty: there's nothing for Priya to start up.";
    return "Mason: \"It's still Sam's Mac, with Sam's account on it.\"";
  },
  judge: function (act, fleet) {
    if (act.type !== "mac") return { guess: false };
    const r = act.res || {};
    if (act.op === "erase" && r.ok && act.fmt !== "APFS") return { guess: true, say: act.fmt + (/APFS/.test(act.fmt) ? ": case-sensitive APFS breaks some apps, and a Mac's startup disk is plain APFS." : ": macOS can only be installed on an APFS disk.") };
    if (act.op === "tm-restore") return { guess: true, say: "That put Sam's account and files back. The backup is Sam's, and Priya needs a clean Mac." };
    if (act.op === "ri-install" && r.kept) return { guess: true, say: "Reinstalling without erasing keeps everything on the disk: Sam's account and files are still there." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      recovery: ["Wiping a Mac properly starts outside macOS. How do you reach its own recovery tools?", "On a Mac with Apple silicon, Recovery is reached from the startup options, before macOS loads."],
      erase: ["Which of Recovery's tools empties the disk?", "Reinstalling on its own keeps what's on the disk. Emptying it first is what makes it clean."],
      format: ["Look at the format you chose.", "A Mac's startup disk has one format macOS installs on."],
      activate: ["Read what the Mac says about whose Apple Account it's linked to.", "An organisation that manages its Macs can release that lock without the old owner's password."],
      reinstall: ["The disk is empty and the Mac activated. What's left in Recovery?", "An empty disk needs a system installed before anyone can start it."],
      kept: ["Whose account is on the Mac now?", "Putting a person's backup on is the opposite of wiping their Mac: empty it again."],
      done: ["The Mac shows Hello. Close it out on Help Desk.", "The close question is about why the Mac asked for Sam's Apple Account."]
    };
    return H[stage(fleet)] || H.recovery;
  },
  moves: function (fleet) {
    const X = {
      recovery: [opt("Shut it down, then press and hold the power button for the startup options", true),
        opt("Press the power button and log in as Sam", false, "Nobody has Sam's password, and it's macOS, not Recovery."),
        opt("Log in as Sam and drag Sam's files to the Trash", false, "That leaves Sam's account, settings and apps."),
        opt("Start it from a Windows installer USB", false, "It's a Mac: its own Recovery reinstalls macOS."),
        opt("Hold Command-R while it starts", false, "That's how an Intel Mac reaches Recovery. This one has Apple silicon."),
        opt("Escalate: only Apple can wipe a Mac", false, "Recovery is built for exactly this.")],
      erase: [opt("Open Disk Utility and erase the Macintosh HD volume group as APFS", true),
        opt("Choose Reinstall macOS straight away", false, "Reinstalling on its own keeps Sam's account and files."),
        opt("Restore from Time Machine", false, "The only backup is Sam's: it puts Sam's things back."),
        opt("Erase it as Mac OS Extended (Journaled)", false, "macOS can only be installed on APFS."),
        opt("Erase it as ExFAT", false, "A format for sharing with Windows, not for starting a Mac."),
        opt("Open Safari and download macOS", false, "Recovery installs it itself.")],
      format: [opt("Erase it again as APFS", true), opt("Reinstall macOS on it as it is", false, "macOS refuses a disk that isn't APFS."), opt("Restore from Time Machine to fix the format", false, "That brings Sam's things back."), opt("Choose APFS (Case-sensitive)", false, "Breaks some apps: plain APFS."), opt("Leave it: Setup Assistant formats it", false, "The installer needs APFS first."), opt("Escalate", false, "Erase it again.")],
      activate: [opt("Ask Mason to release Activation Lock in device management", true),
        opt("Enter Priya's Apple Account", false, "The lock is to Sam's account: any other is refused."),
        opt("Guess Sam's Apple Account password", false, "Refused, and not yours to guess."),
        opt("Erase the disk again", false, "The lock is held by Apple, not on the disk."),
        opt("Restore from Time Machine to skip activation", false, "Puts Sam's things back, and the lock stays."),
        opt("Escalate to Apple to break the lock", false, "Rafiki's own device management can release it.")],
      reinstall: [opt("Reinstall macOS Sequoia onto Macintosh HD", true), opt("Restore from Time Machine", false, "Sam's backup."), opt("Shut it down and hand it over", false, "The disk is empty."), opt("Erase it again", false, "It's empty already."), opt("Download macOS in Safari", false, "Reinstall macOS does it."), opt("Escalate", false, "You can finish it.")],
      kept: [opt("Erase the volume group as APFS, then reinstall", true), opt("Delete Sam's account in System Settings", false, "Settings, apps and leftovers stay."), opt("Hand it over: Priya can make a new account", false, "Sam's data is still on it."), opt("Restore from Time Machine again", false, "That's what put it there."), opt("Escalate", false, "Erase it."), opt("Reinstall macOS again", false, "It keeps the data again.")],
      done: [opt("Resolve the ticket", true), opt("Set it up as Priya", false, "Priya does that at Hello."), opt("Restore Sam's backup for Priya", false, "Priya needs a clean Mac."), opt("Erase it again to be sure", false, "It's clean."), opt("Escalate", false, "It's done."), opt("Turn on Find My with your account", false, "Never: that locks the company's Mac to you.")]
    };
    return X[stage(fleet)] || X.recovery;
  },
  closeWhere: "Think about what stopped you after the erase, and whose account it named.",
  close: { prompt: "Mason asks: \"Why did the Mac ask for Sam's Apple Account after you'd erased it?\"", options: [
    opt("Activation Lock: Find My tied it to Sam's account, and erasing keeps it", true),
    opt("The erase failed, so Sam's account was still left on the disk afterwards", false, "Disk Utility emptied it. The lock is held by Apple, not on the disk."),
    opt("Apple always needs the last user's password before macOS can be reinstalled", false, "Only when Activation Lock is on. Without Find My, a Mac activates with no account."),
    opt("Recovery was opened with the wrong administrator account, rafikiadmin", false, "Recovery let you in as rafikiadmin and the erase worked."),
    opt("The disk was formatted with the wrong file system for activation", false, "Activation doesn't look at the format."),
    opt("Every Mac asks for its previous owner's account after any erase at all", false, "Only one with Activation Lock on.")] },
  note: { must: [["erase", "disk utility"], ["apfs"], ["activation lock"], ["release", "device management", "mdm"], ["reinstall"], ["hello", "setup assistant"]],
    tip: "How you reached Recovery, the erase and its format, Activation Lock and how it was released, the reinstall, and that it shows Hello." },
  closeAdvice: "The Mac shows Hello. Now answer Mason's question on the ticket.",
  advice: function (fleet) { const s = stage(fleet); return s === "activate" ? "Read the Activate Mac screen word for word: whose account does it name? Then look at what Mason's note says about how the Mac is managed." : "The Mac is on your bench. Wiping a Mac properly happens in its own recovery tools, before macOS starts."; }
};
export const MAC_TICKETS = [OI5];
