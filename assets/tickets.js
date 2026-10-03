/* =====================================================================
   The tickets — what arrives in the Help Desk queue.

   Built from two Core-2-Sims files and nothing else:
     Application Launch Troubleshooting Simulation.html   (Tier 1)
     Application Deployment Troubleshooting.html          (Tier 2)
   One ticket each is the sim itself; five each are the owner's standing
   "five more". Where a sim's answer key is exam prep it is kept as
   supplied (the owner, 30 Sept). App Deployment is the exception the
   owner ruled on: rebuilt so its old answer is tried and fails.

   A ticket is done when the MACHINE is really fixed — or, for the two
   that cannot be fixed at Tier 1, when the Tier 1 fix has been tried and
   the ticket is escalated — and the student has then picked the cause
   and written the ticket note. (Owner: "Yes", 30 Sept.)

   WHAT COUNTS AS A GUESS (the settled rule): looking never counts —
   opening a tool, reading a log, running a program to see what happens,
   `dir`, `help`, a typo. A change counts when it does not move the
   machine closer to fixed, and so does anything refused, anything out of
   scope for the ticket's tier, and trying to close it while it is still
   broken.
   ===================================================================== */
import * as M from "./machine.js";
import { APPS } from "./fleet.js";
import { MALWARE } from "./tickets-malware.js";
import { MAIL } from "./tickets-mail.js";
import { ROUTER } from "./tickets-router.js";
import { WIFI } from "./tickets-wifi.js";
import { PF } from "./tickets-pf.js";

function works(m, app) { return M.launchApp(M.clone(m), app).ok; }
function has(m, kind, test) { return m.events.some(function (e) { return e.kind === kind && (!test || test(e)); }); }
function opt(label, correct, why) { return { label: label, correct: !!correct, why: why || "" }; }
function app(name, over) { return Object.assign(M.clone(APPS[name]), over || {}); }
function setApp(m, a) { m.apps = m.apps.filter(function (x) { return x.name !== a.name; }).concat([a]); if (a.installed !== false) M.placeApp(m.fs, a, m); }
function dropRuntime(m, key) { m.runtimes[key] = false; M.syncRuntimes(m); }
function viewedLog(m) { return has(m, "view-log"); }
const TIER1_SYSTEM = /(\\windows\\|\\system32|\\syswow64|regsvr32|reg add|reg delete|setx|\\software\\|vcredist|vc_redist)/i;

/* ---------------------------------------------------------------------
   The shared shape of the six App Launch tickets (Tier 1).
   --------------------------------------------------------------------- */
function launchTicket(o) {
  return Object.assign({
    sim: "Application Launch Troubleshooting", tier: 1,
    judge: function (act, fleet, before) {
      if (act.type === "cmd") {
        if (act.res.kind === "refused") return { guess: true };
        if (act.res.kind === "change" && TIER1_SYSTEM.test(act.line)) return { guess: true, say: "That is a system-level change. At Tier 1 you do not copy system files, register DLLs or change the registry: the sim's own advice is to be cautious of exactly those." };
        if (act.res.kind === "change") return { guess: !o.progress(fleet, before) };
        return { guess: false };
      }
      if (act.type === "catalogue-admin") return { guess: true, say: "Installing runtimes needs an administrator, which is Tier 2. At Tier 1, repair or reinstall the program itself." };
      if (act.type === "repair" || act.type === "reinstall") return { guess: act.app !== o.app };
      return { guess: false };
    },
    hints: function (fleet) {
      const m = fleet[o.machine];
      if (!viewedLog(m) && !has(m, "launch", function (e) { return e.app === o.app; })) return ["Start where the user does: open the program on their PC and read exactly what it says.", "Reproduce the problem before you try to fix it. The message on screen names what is wrong more often than not."];
      if (!has(m, "repair-app", function (e) { return e.app === o.app; })) return ["Read the message again, then look at what Windows recorded about it: Event Viewer, Windows Logs.", "At Tier 1 the safe fix for one program that will not start is to repair or reinstall that program — Settings, Apps, or Software Center — not to touch system files."];
      return o.escalate
        ? ["You tried the Tier 1 fix. Run the program again and read whether anything changed.", "When the safe fix has been tried and the fault is still there, the next step is to document what you found and escalate — not to try riskier fixes yourself."]
        : ["Test it: run the program again on their PC.", "A fix is not finished until you have seen it work."];
    },
    moves: function (fleet) {
      const m = fleet[o.machine]; const repaired = has(m, "repair-app", function (e) { return e.app === o.app; });
      if (o.escalate && repaired) return [
        { label: "Escalate the ticket to Tier 2 with the error, the Event Viewer entry and what you tried", correct: true },
        { label: "Copy the missing file from another PC into System32", why: "A system-level change, out of Tier 1 scope, and the wrong folder for a 32-bit program anyway." },
        { label: "Repair the program a second time", why: "You have tried it. The same fix gives the same result." },
        { label: "Reimage the workstation", why: "The sim's own distractor: far more than one program's fault calls for, and not Tier 1's decision." },
        { label: "Turn off Windows Security to test", why: "The sim's other distractor. Security software is not in the evidence, and disabling it is never a test." },
        { label: "Resolve the ticket, telling the user to use another PC", why: "The fault is still there. A ticket is resolved when the problem is." }];
      return [
        { label: "Repair or reinstall " + o.app + " (Settings → Apps, or Software Center)", correct: true },
        { label: "Copy the missing DLL from another PC into C:\\Windows\\System32", why: "System files are out of Tier 1 scope — and System32 is where Windows keeps 64-bit DLLs." },
        { label: "regsvr32 the missing DLL", why: "It is not a COM component; there is nothing to register — and it is a system change." },
        { label: "Restore system files from a restore point taken before the update", why: "The sim's distractor: a system-wide change for one program's fault." },
        { label: "Reimage the user's workstation", why: "Out of all proportion, and not a Tier 1 decision." },
        { label: "Escalate straight away", why: "There is a Tier 1 fix you have not tried yet." }];
    },
    goal: function (fleet) {
      const m = fleet[o.machine];
      if (o.escalate) return has(m, "repair-app", function (e) { return e.app === o.app; }) && !works(m, o.app) && viewedLog(m);
      return works(m, o.app) && has(m, "repair-app", function (e) { return e.app === o.app; });
    },
    outcome: o.escalate ? "escalate" : "resolve",
    notReady: function (fleet) {
      const m = fleet[o.machine];
      if (o.escalate && !viewedLog(m)) return "Before escalating, record the details Tier 2 will need. The sim asks which tool would BEST show them.";
      if (!o.escalate && works(m, o.app) && !has(m, "repair-app", function (e) { return e.app === o.app; })) return o.app + " runs now, but not by a Tier 1 route. Put it right the way Tier 1 is allowed to: repair or reinstall the program.";
      return null;
    }
  }, o);
}

/* The sim's own Task 1 question, with its four options, topped up to six
   with near misses. */
function causeQ(correct, wrongs) {
  return { prompt: "What was the MOST LIKELY cause?", options: [opt(correct, true)].concat(wrongs.map(function (w) { return opt(w[0], false, w[1]); })) };
}
const SIM_WRONG = {
  net: ["The application cannot reach a required network resource", "The error names a file on this PC. Nothing in it mentions a server, a share or the network."],
  profile: ["The user's profile is damaged and preventing execution", "A damaged profile breaks many things at sign-in. Here one program fails and everything else works."],
  updates: ["The operating system is missing critical updates", "Missing updates would not remove one program's file. The problem began AFTER an update, not for lack of one."],
  av: ["Windows Security is blocking the program", "A blocked program shows a Windows Security notice, and the protection history would record it. The message names a missing file."],
  licence: ["The program's licence expired overnight and it now refuses to open", "An expired licence gives a licence message from the program itself, once it has started. This one never starts."]
};

export const TICKETS = [
  /* ---------------- App Launch: the sim itself ---------------- */
  launchTicket({
    id: "L1", title: "Testing won't open since the update", machine: "WS4", app: "Testing", base: true,
    from: "Farah Nkemelu, Finance",
    brief: ["Hi, it's Farah in Finance. Since the update went out last night, Testing won't open on my PC — I click it and get an error box straight away.",
      "Brenda and John can still use it fine, so I don't think it's the server. Can you have a look? I need it for month-end."],
    setup: function (fleet) { const m = fleet.WS4; setApp(m, app("Testing")); dropRuntime(m, "vc2010x86"); m.clock = "Mar 03 09:12"; },
    progress: function (fleet, before) { return works(fleet.WS4, "Testing"); },
    close: causeQ("A required application file or dependency is missing or corrupted", [SIM_WRONG.net, SIM_WRONG.profile, SIM_WRONG.updates, SIM_WRONG.av, SIM_WRONG.licence]),
    note: { must: [["msvcp100", "dll", "missing"], ["repair", "reinstall"]], tip: "Say what the error said, what you did about it, and that you tested it." }
  }),
  /* ---------------- App Launch: five more ---------------- */
  launchTicket({
    id: "L2", title: "PayWise error after the weekend", machine: "WS2", app: "PayWise",
    from: "Brenda Smith, Sales",
    brief: ["Brenda in Sales. PayWise was working Friday. This morning it just throws an error about a missing file and closes. I haven't changed anything — the PC did its updates over the weekend though.",
      "Farah's PayWise is fine, she says."],
    setup: function (fleet) { const m = fleet.WS2; setApp(m, app("PayWise")); dropRuntime(m, "vc2015x86"); m.clock = "Mar 10 08:47"; },
    progress: function (fleet) { return works(fleet.WS2, "PayWise"); },
    close: causeQ("A runtime PayWise depends on is missing from this PC", [SIM_WRONG.net, ["PayWise's own program file is corrupted", "The message names a runtime DLL, not PayWise.exe — PayWise.exe loaded far enough to ask for it."], SIM_WRONG.profile, SIM_WRONG.updates, SIM_WRONG.av]),
    note: { must: [["vcruntime140", "dll", "missing", "runtime"], ["repair", "reinstall"]], tip: "Name the file the error named, the fix, and the test." }
  }),
  launchTicket({
    id: "L3", title: "Scan2Doc won't start — urgent", machine: "WS3", app: "Scan2Doc", escalate: true,
    from: "Dev Patel, Dev",
    brief: ["Dev here. Scan2Doc stopped working after IT pushed something out yesterday — missing file error. I've got a client's contracts to scan by two.",
      "I tried restarting, no joy. Everyone else on the floor is fine."],
    setup: function (fleet) { const m = fleet.WS3; setApp(m, app("Scan2Doc")); dropRuntime(m, "vc2013x86"); m.clock = "Mar 12 11:05"; },
    progress: function () { return false; },
    close: { prompt: "Why is escalating the right call here?", options: [
      opt("The Tier 1 fix changed nothing, and the missing file is a system runtime: Tier 2's job", true),
      opt("Scan2Doc is not on the approved software list", false, "It is: it is in Software Center, and reinstalling it worked without any approval step."),
      opt("The user is a developer and should fix it himself", false, "Supporting him is the job. What stopped you was scope, not who he is."),
      opt("Escalating is always the first step for an urgent ticket", false, "Urgency changes how fast, not who. You tried the Tier 1 fix first, rightly."),
      opt("Tier 2 can reimage the PC faster", false, "Nothing calls for a reimage. The evidence points at one missing runtime."),
      opt("The error shows the hard drive is failing, so the PC needs Tier 2 to replace the drive", false, "A missing-DLL message says a file is not where Windows looks. A failing drive shows disk errors in the System log and trouble across many programs.")] },
    note: { must: [["msvcr120", "dll", "missing"], ["repair", "reinstall"], ["event", "viewer", "log"]], tip: "Escalation notes are for the next tier: the exact error, the Event Viewer entry, what you tried and what happened." }
  }),
  launchTicket({
    id: "L4", title: "Testing says configuration error", machine: "WS5", app: "Testing",
    from: "Rosa Ortiz, Reception",
    brief: ["Rosa on reception. Testing flashes up an error about settings or configuration and shuts. It did it after the update yesterday. The PC turned itself off during the update — there was a power flicker, the lights went too.",
      "I only use it to check visitors in."],
    setup: function (fleet) { const m = fleet.WS5; const a = app("Testing", { configBad: true }); setApp(m, a); m.clock = "Mar 04 08:30"; },
    progress: function (fleet) { return works(fleet.WS5, "Testing"); },
    close: causeQ("The program's own settings file was damaged", [["A required runtime DLL is missing", "The message is about config.ini, Testing's own settings file — and a missing DLL gives a different message."], SIM_WRONG.net, SIM_WRONG.profile, ["The power cut damaged Windows' system files", "Windows started and everything else works. The damaged file is Testing's own."], SIM_WRONG.av]),
    note: { must: [["config", "ini", "settings", "configuration"], ["repair", "reinstall"]], tip: "Say what the message said, what you think caused it, and the fix." }
  }),
  launchTicket({
    id: "L5", title: "LabelPro icon does nothing useful", machine: "WS1", app: "LabelPro", shortcut: true,
    from: "John Doe, HR",
    brief: ["John in HR. The LabelPro icon on my desktop gives me a box about the item being changed or moved. It's been like that since the new version went on.",
      "Weirdly if I search for it in Start it opens. But I always use the desktop icon, and so does the temp."],
    setup: function (fleet) { const m = fleet.WS1; const a = app("LabelPro", { shortcutBroken: true }); setApp(m, a); m.clock = "Mar 05 14:10"; },
    progress: function (fleet) { return !M.appByName(fleet.WS1, "LabelPro").shortcutBroken; },
    goal: function (fleet) { const m = fleet.WS1; return !M.appByName(m, "LabelPro").shortcutBroken && has(m, "repair-app", function (e) { return e.app === "LabelPro"; }); },
    close: causeQ("The desktop shortcut still points at the old version's location", [["A required runtime DLL is missing", "LabelPro opens from Start. A missing DLL would stop it opening at all."], ["LabelPro's program file was corrupted when the new version was copied over it", "It runs from Start, so its program file is fine."], SIM_WRONG.profile, SIM_WRONG.net, SIM_WRONG.licence]),
    note: { must: [["shortcut", "icon", "moved"], ["repair", "reinstall"]], tip: "Say what the icon did, why, and what you did." }
  }),
  launchTicket({
    id: "L6", title: "ChartView crashes every time", machine: "WS4", app: "ChartView", escalate: true,
    from: "Farah Nkemelu, Finance",
    brief: ["Farah again, sorry! ChartView opens for a second then says it has stopped working. It started after the update, same as last time.",
      "No rush on this one, I can use Excel for now, but I'd like it back by Friday."],
    setup: function (fleet) { const m = fleet.WS4; setApp(m, app("ChartView", { brokenBeyondRepair: true })); m.clock = "Mar 06 10:20"; },
    progress: function () { return false; },
    close: { prompt: "Why is escalating the right call here?", options: [
      opt("Repair changed nothing, and the fault is inside ChartView itself — beyond Tier 1", true),
      opt("A missing runtime needs Tier 2 to install it", false, "Nothing is missing: the crash is an access violation (0xc0000005) in ChartView.exe, not a missing-file error."),
      opt("ChartView is not supported on Windows 11", false, "It ran on this PC until the update. Nothing in the evidence is about support."),
      opt("The user said there was no rush", false, "Urgency does not decide who fixes it. The failed Tier 1 fix does."),
      opt("Tier 1 is not allowed to open Event Viewer", false, "It is — and you did, which is what makes the escalation useful."),
      opt("The PC needs a new graphics driver", false, "Nothing points at a driver. The faulting module is ChartView.exe.")] },
    note: { must: [["0xc0000005", "crash", "stopped working", "access violation"], ["repair", "reinstall"], ["event", "viewer", "log"]], tip: "Give Tier 2 the exact error, the Event Viewer entry, what you tried and the result." }
  }),

  /* ---------------- App Deployment: the sim itself, rebuilt ---------------- */
  {
    id: "D1", title: "Testing broken after last night's deployment", machine: "WS1", app: "Testing", base: true, tier: 2,
    sim: "Application Deployment Troubleshooting",
    from: "John Doe, HR",
    brief: ["John Doe, HR. After the software deployment last night to upgrade applications, I can no longer use the Testing program.",
      "However, other employees can successfully use it — Farah's works. My PC did blue-screen last week too, if that's anything."],
    setup: function (fleet) {
      const m = fleet.WS1; setApp(m, app("Testing")); dropRuntime(m, "vc2010x86"); m.clock = "Mar 03 10:40";
      /* the sim's Event Viewer tab, entry for entry */
      m.logs.Application = [];
      [[2184, "Mar 03 10:29", "Information", "MEIx64", 1074200578, "Intel(R) Management Engine Interface driver has started successfully."],
       [2185, "Mar 03 10:29", "Information", "MEIx64", 1074200578, "Intel(R) Management Engine Interface driver has started successfully."],
       [2186, "Mar 03 10:29", "Warning", "DistributedCOM", 10016, "The application-specific permission settings do not grant Local Activation permission for the COM Server application to the user RAFIKI\\jdoe."],
       [2187, "Mar 03 10:29", "Information", "MsiInstaller", 1033, "Windows Installer installed the product. Product Name: Rafiki Application Upgrade Pack. Installation success or error status: 0."],
       [2188, "Mar 03 10:29", "Information", "Service Control Manager", 1073748860, "The Multimedia Class Scheduler service entered the running state."],
       [2189, "Mar 03 10:29", "Information", "Service Control Manager", 1073748860, "The TCP/IP NetBIOS Helper service entered the running state."],
       [2190, "Mar 03 10:35", "Error", "Application Error", 100, "Application has encountered an internal error and closed. Faulting application name: Testing.exe, version: 4.2.0, Faulting module name: MSVCP100.dll."],
       [2191, "Mar 03 10:35", "Information", "Service Control Manager", 1073748860, "The Multimedia Class Scheduler service entered the running state."]]
        .forEach(function (e) { m.logs.Application.push({ index: e[0], time: e[1], level: e[2], source: e[3], id: e[4], text: e[5] }); });
      /* the sim's BSOD tab: a real bugcheck, a week before, and nothing to do with this */
      M.addLog(m, "System", { time: "Feb 24 15:02", level: "Error", source: "BugCheck", id: 1001, text: "The computer has rebooted from a bugcheck. The bugcheck was: 0x000000d1 (DRIVER_IRQL_NOT_LESS_OR_EQUAL). Faulting driver: strt1.sys. A dump was saved in: C:\\Windows\\MEMORY.DMP." });
    },
    close: { prompt: "Which Event Viewer entry records the problem? (the sim's own question)", options: [
      opt("2190", true),
      opt("2187", false, "That is the deployment itself installing, successfully — status 0. It is the cause of the timing, not the record of the failure."),
      opt("2186", false, "A DistributedCOM permission warning. It appears on countless healthy PCs and names no program."),
      opt("2191", false, "A service starting, at the same minute as the error. Timing is not the same as cause."),
      opt("2189", false, "A service entering the running state — routine start-up noise."),
      opt("2185", false, "A driver starting successfully during start-up.")] },
    note: { must: [["2190", "msvcp100"], ["x86", "32-bit", "32 bit", "syswow64", "redistributable", "runtime", "repair", "reinstall"]], tip: "Name the Event Viewer entry, the missing file, and how you put it back." }
  },
  /* ---------------- App Deployment: five more ---------------- */
  {
    id: "D2", title: "PayWise missing file after deployment", machine: "WS4", app: "PayWise", tier: 2,
    sim: "Application Deployment Troubleshooting",
    from: "Farah Nkemelu, Finance",
    brief: ["Farah. Since the overnight deployment, PayWise says VCRUNTIME140.dll is missing. I've already tried the repair in Software Center myself — the Tier 1 guide says to — and it did nothing.",
      "Payroll runs tomorrow."],
    setup: function (fleet) { const m = fleet.WS4; setApp(m, app("PayWise", { bundles: [] })); dropRuntime(m, "vc2015x86"); m.clock = "Mar 07 09:02"; M.note(m, "repair-app", { app: "PayWise", how: "reinstall", byUser: true }); },
    close: causeQ("The deployment removed the 32-bit runtime PayWise needs", [["PayWise's installer is corrupted", "Reinstalling ran cleanly. The installer simply does not carry the runtime."], ["The deployment removed the 64-bit Visual C++ runtime PayWise needs", "The 64-bit runtime is present — look in System32. PayWise is 32-bit and looks in SysWOW64."], SIM_WRONG.net, SIM_WRONG.profile, SIM_WRONG.updates]),
    note: { must: [["vcruntime140", "runtime", "redistributable"], ["x86", "32-bit", "32 bit", "syswow64"]], tip: "Name what was missing, which bitness, and how you put it back." }
  },
  {
    id: "D3", title: "Testing can't find its own file", machine: "WS5", app: "Testing", tier: 2,
    sim: "Application Deployment Troubleshooting",
    from: "Rosa Ortiz, Reception",
    brief: ["Rosa. After last night's deployment, Testing says RAFIKICORE.dll is missing. Funny thing is, IT's deployment email said the new version keeps its shared bits in a Common Files folder and 'the deployment script will sort the paths'.",
      "Nothing else seems broken."],
    setup: function (fleet) {
      const m = fleet.WS5; const dir = "C:\\Program Files (x86)\\Common Files\\Rafiki";
      const a = app("Testing", { ver: "4.3.0", needs: ["msvcp100.dll", "rafikicore.dll"], pathEntry: dir }); setApp(m, a);
      M.putFile(m.fs, dir, { name: "rafikicore.dll", size: 412000, bits: 32 });
      m.env.PATH = "C:\\Windows\\System32"; m.clock = "Mar 08 08:20";
      M.addLog(m, "Application", { time: "Mar 08 01:14", level: "Information", source: "Rafiki Deployment", id: 1, text: "Deployment script completed: setx /m PATH \"C:\\Windows\\System32\"  (exit 0)." });
    },
    close: causeQ("The deployment script overwrote the PATH, so Windows no longer searches that folder", [["RAFIKICORE.dll was not installed", "It is there, in Common Files\\Rafiki. Windows is not looking in that folder."], ["RAFIKICORE.dll is a 64-bit build, and the 32-bit Testing 4.3 cannot load it from that folder", "A wrong-bitness file gives 0xc000007b. This error says the file cannot be found at all."], ["Testing 4.3 is not compatible with this PC", "It runs on the others. The difference is this PC's PATH."], SIM_WRONG.profile, ["The Visual C++ runtime is missing", "msvcp100.dll is present in SysWOW64. The file named is RAFIKICORE.dll."]]),
    note: { must: [["path"], ["setx", "repair", "reinstall", "restore"]], tip: "Say what the PATH was, what it needed, and how you put it right." }
  },
  {
    id: "D4", title: "No Testing icon at all on the new PC", machine: "WS3", app: "Testing", tier: 2,
    sim: "Application Deployment Troubleshooting",
    from: "Dev Patel, Dev",
    brief: ["Dev. Everyone got the new Testing last night except me — there's no icon, nothing in Start. My PC was switched off overnight because I was working from home.",
      "It's a Group Policy deployment, I think. Can you push it to me?"],
    setup: function (fleet) {
      const m = fleet.WS3; m.apps = m.apps.filter(function (x) { return x.name !== "Testing"; });
      m.gpoPending = "Testing"; m.gpoApp = app("Testing"); m.clock = "Mar 09 09:00";
      M.addLog(m, "System", { time: "Mar 09 08:55", level: "Warning", source: "Application Management Group Policy", id: 108, text: "Failed to apply changes to software installation settings. Software installation policy application has been delayed until the next system startup." });
    },
    close: causeQ("Software installation policy only applies at startup, and the PC was off", [["The PC's computer account is not in the security group the policy is filtered to", "gpresult lists the policy: it is filtered only because it is pending a restart."], ["The user does not have permission to install software", "Group Policy installs as the computer, not as the user."], SIM_WRONG.net, ["Testing is not compatible with this PC", "It has never been installed here; compatibility never came into it."], ["The deployment failed on every PC", "Everyone else got it, the brief says."]]),
    note: { must: [["policy", "gpupdate", "gpo"], ["restart", "reboot", "startup"]], tip: "Say why it had not arrived and what you did to apply it." }
  },
  {
    id: "D5", title: "0xc000007b on Brenda's PC", machine: "WS2", app: "Testing", tier: 2,
    sim: "Application Deployment Troubleshooting",
    from: "Brenda Smith, Sales",
    brief: ["Brenda. Testing now says 'unable to start correctly (0xc000007b)'. When it broke after the deployment, the lad from the other office 'fixed' it by copying a DLL over from another PC — it was fine for a day, then this.",
      "Other PCs are fine."],
    setup: function (fleet) {
      const m = fleet.WS2; setApp(m, app("Testing")); m.clock = "Mar 11 13:30";
      M.putFile(m.fs, "C:\\Program Files (x86)\\Testing", { name: "msvcp100.dll", size: 829440, bits: 64, ver: "10.0.40219" });
    },
    close: causeQ("A 64-bit copy of the DLL was put in the 32-bit program's folder", [["The runtime is missing from SysWOW64", "It is there. Windows never gets that far: it finds the wrong copy in Testing's own folder first."], ["Testing.exe is corrupted", "The error is the loader refusing a DLL of the wrong bitness: 0xc000007b."], SIM_WRONG.updates, SIM_WRONG.profile, ["The DLL copied into Testing's folder is an older version than the one Testing needs", "It is the same version. It is the other bitness."]]),
    note: { must: [["64", "bitness", "0xc000007b"], ["delete", "del", "remove", "repair", "reinstall"]], tip: "Say what was in Testing's folder, why it failed, and what you did." }
  },
  {
    id: "D6", title: "LabelPro missing file after deployment", machine: "WS3", app: "LabelPro", tier: 2,
    sim: "Application Deployment Troubleshooting",
    from: "Dev Patel, Dev",
    brief: ["Dev again. LabelPro 11 says VCRUNTIME140.dll is missing since the deployment. I had a look myself and the file's definitely on the PC — it's in C:\\Windows\\SysWOW64. So I don't get it.",
      "Should I just copy it into the LabelPro folder?"],
    setup: function (fleet) { const m = fleet.WS3; setApp(m, app("LabelPro")); dropRuntime(m, "vc2015x64"); m.clock = "Mar 13 15:45"; },
    close: causeQ("LabelPro is 64-bit, and the deployment removed the 64-bit runtime it needs", [["The file is corrupted in SysWOW64", "It is fine — for 32-bit programs. LabelPro is 64-bit and looks in System32."], ["LabelPro's folder is the wrong place for it", "Its folder is not where it should come from at all. The runtime installs to System32."], SIM_WRONG.net, SIM_WRONG.profile, ["LabelPro 11 needs the older Visual C++ 2013 runtime, not the 2015-2022 one", "It names vcruntime140.dll: the 2015-2022 runtime. Only its bitness is missing."]]),
    note: { must: [["vcruntime140", "runtime", "redistributable"], ["x64", "64-bit", "64 bit", "system32"]], tip: "Name what was missing, which bitness, and how you put it back." }
  }
];

/* Tier 2 tickets share this judge, hint and move logic. */
TICKETS.filter(function (t) { return t.tier === 2; }).forEach(function (t) {
  t.outcome = "resolve";
  t.progress = function (fleet, before) { return score(t, fleet) > (before ? before.score : 0); };
  t.goal = function (fleet) { return works(fleet[t.machine], t.app); };
  t.judge = function (act, fleet, before) {
    if (act.type === "cmd") {
      if (act.res.kind === "refused") return { guess: true };
      if (act.res.kind !== "change") return { guess: false };
      return { guess: !(score(t, fleet) > before.score || t.goal(fleet)) };
    }
    if (act.type === "repair" || act.type === "reinstall" || act.type === "catalogue-admin") return { guess: !(score(t, fleet) > before.score || t.goal(fleet)) };
    return { guess: false };
  };
  t.hints = function (fleet) { return deployHints(t, fleet); };
  t.moves = function (fleet) { return deployMoves(t, fleet); };
});

/* The Malware tickets come after the Tier 2 ones: they bring their own
   judge, hints and moves (tickets-malware.js). */
MALWARE.forEach(function (t) { TICKETS.push(t); });
MAIL.forEach(function (t) { TICKETS.push(t); });
ROUTER.forEach(function (t) { TICKETS.push(t); });
WIFI.forEach(function (t) { TICKETS.push(t); });
PF.forEach(function (t) { TICKETS.push(t); });

/* How far along a Tier 2 fix is: used so a step that helps is never
   counted as a guess, even when the program does not run yet. */
export function score(t, fleet) {
  if (t.scoreFn) return t.goal(fleet) ? 1000 : t.scoreFn(fleet);
  const m = fleet[t.machine]; let s = 0;
  if (t.goal && t.goal(fleet)) return 10;
  if (t.id === "D1") { if (M.findFile(m, "C:\\Windows\\SysWOW64", "msvcp100.dll") || (M.findFile(m, "C:\\Program Files (x86)\\Testing", "msvcp100.dll") || {}).bits === 32) s++; if (M.findFile(m, "C:\\Windows\\SysWOW64", "msvcr100.dll") || (M.findFile(m, "C:\\Program Files (x86)\\Testing", "msvcr100.dll") || {}).bits === 32) s++; }
  if (t.id === "D4" && m.gpoRestart) s++;
  if (t.id === "D5" && !M.findFile(m, "C:\\Program Files (x86)\\Testing", "msvcp100.dll")) s++;
  return s;
}

function deployHints(t, fleet) {
  const m = fleet[t.machine];
  if (!viewedLog(m) && !has(m, "launch")) return ["Reproduce it on " + t.from.split(",")[0] + "'s PC, then read what Windows recorded — the sim's first question is which Event Viewer entry records the problem.", "The error names the file. The folder Windows looks in for it depends on whether the program is 32-bit or 64-bit."];
  const H = {
    D1: ["Compare where msvcp100.dll IS on this PC with where a 32-bit program looks for it. PowerShell's ls C:\\Windows\\System32\\msvc* and ls C:\\Windows\\SysWOW64\\msvc* show both.", "On 64-bit Windows, System32 holds the 64-bit DLLs and SysWOW64 the 32-bit ones. A 32-bit program needs the 32-bit runtime; copying a 64-bit DLL into its folder gives 0xc000007b, and regsvr32 cannot register a runtime DLL at all."],
    D2: ["Farah already reinstalled PayWise. Look at which runtime the missing file belongs to, and which bitness PayWise is.", "When a program's installer does not carry its runtime, reinstalling the program changes nothing. Put the runtime back — the installers are on \\\\FS01\\Software, and they need an elevated prompt."],
    D3: ["The file exists. Look at where Windows searches for it: echo %PATH%, and the deployment's own entry in the Application log.", "Windows finds a DLL in the program's folder, the system folder, or a folder on the PATH. If the file is in none of those, it is 'missing' even though it is on the disk."],
    D4: ["Ask the PC what policy it has applied: gpresult /r.", "Software Installation policy applies only while the computer starts up. Refreshing policy does not install software without a restart."],
    D5: ["Look inside Testing's own folder. What is there that the program did not ship with?", "Windows looks in the program's own folder before anywhere else. A DLL of the wrong bitness there is found first, and stops the program even when the right copy is installed."],
    D6: ["Dev found the file in SysWOW64. Which kind of program looks there — and which kind is LabelPro 11? Look at where it is installed.", "64-bit programs live in Program Files and use System32; 32-bit programs live in Program Files (x86) and use SysWOW64. The runtime has to match the program."]
  };
  return H[t.id];
}
function deployMoves(t, fleet) {
  const X = {
    D1: [{ label: "Install the x86 Visual C++ 2010 runtime (elevated), or repair Testing", correct: true },
      { label: "robocopy msvcp100.dll from another PC's System32 into Testing's folder", why: "The sim's old answer. System32 holds the 64-bit copy; a 32-bit program loading it fails with 0xc000007b." },
      { label: "regsvr32 msvcp100.dll", why: "The sim's old second step. A runtime DLL has no DllRegisterServer; there is nothing to register." },
      { label: "setx path \"C:\\Windows\\System32\"", why: "The sim's distractor. Pointing PATH at the 64-bit folder does not help a 32-bit program, and wipes the rest of the PATH." },
      { label: "Troubleshoot the blue screen from last week", why: "A bugcheck in strt1.sys, a week BEFORE the deployment. Timing rules it out." },
      { label: "gpupdate /force", why: "Testing is installed and policy has applied. The fault is one missing runtime." }],
    D2: [{ label: "Install the x86 Visual C++ 2015-2022 runtime, elevated", correct: true },
      { label: "Reinstall PayWise from Software Center again", why: "Farah did. Its installer does not carry the runtime." },
      { label: "Install the x64 runtime", why: "It is already there, in System32. PayWise is 32-bit." },
      { label: "Copy vcruntime140.dll from System32 into PayWise's folder", why: "That is the 64-bit copy: 0xc000007b." },
      { label: "regsvr32 vcruntime140.dll", why: "Not a COM server; nothing to register." },
      { label: "Restart the PC", why: "The runtime is not installed. A restart does not install it." }],
    D3: [{ label: "Put Common Files\\Rafiki back on the PATH, or repair Testing", correct: true },
      { label: "Copy rafikicore.dll into System32", why: "A 32-bit DLL in the 64-bit folder, and it does not fix the PATH every other Rafiki program needs." },
      { label: "Reinstall the Visual C++ 2010 runtime from \\\\FS01\\Software, elevated", why: "msvcp100.dll is present in SysWOW64. The missing file is rafikicore.dll." },
      { label: "regsvr32 rafikicore.dll", why: "Registering it does not make Windows search the folder." },
      { label: "setx path \"C:\\Windows\\System32\" again", why: "That is what broke it." },
      { label: "Run sfc /scannow", why: "sfc checks Windows' own files. PATH and rafikicore.dll are not among them." }],
    D4: [{ label: "gpupdate /force, then answer Y to the restart", correct: true },
      { label: "gpupdate /force and answer N", why: "The policy says it needs a restart to install software." },
      { label: "Copy Testing's program folder over from another PC's Program Files (x86)", why: "Nothing would register it, and the next policy refresh would not know about it." },
      { label: "Add Dev to the Domain Admins group", why: "Group Policy installs as the computer. Rights have nothing to do with it." },
      { label: "Reinstall the Visual C++ runtime", why: "Testing is not installed at all; there is nothing yet to need a runtime." },
      { label: "Run sfc /scannow", why: "Windows' own files are not the problem." }],
    D5: [{ label: "Delete the stray msvcp100.dll in Testing's folder, or repair Testing", correct: true },
      { label: "Install the x86 Visual C++ 2010 runtime from \\\\FS01\\Software, elevated", why: "It is already installed. The wrong copy in Testing's folder is found first." },
      { label: "Copy msvcp100.dll from System32 into Testing's folder again", why: "That is what caused it: the 64-bit copy." },
      { label: "regsvr32 msvcp100.dll", why: "Nothing to register, and the wrong copy stays." },
      { label: "Run Testing as administrator", why: "Rights do not change which DLL the loader finds." },
      { label: "Reimage the PC", why: "One stray file does not call for it." }],
    D6: [{ label: "Install the x64 Visual C++ 2015-2022 runtime, or repair LabelPro", correct: true },
      { label: "Copy vcruntime140.dll from SysWOW64 into LabelPro's folder", why: "Dev's suggestion: the 32-bit copy, into a 64-bit program — 0xc000007b." },
      { label: "Install the x86 Visual C++ 2015-2022 runtime from \\\\FS01\\Software", why: "Already there. LabelPro is 64-bit." },
      { label: "regsvr32 vcruntime140.dll", why: "Nothing to register." },
      { label: "Move LabelPro to Program Files (x86)", why: "Moving a 64-bit program does not make it 32-bit." },
      { label: "Restart the PC", why: "The 64-bit runtime is not installed." }]
  };
  return X[t.id];
}

export function ticketById(id) { return TICKETS.filter(function (t) { return t.id === id; })[0] || null; }

/* The note check: a word from each group, and long enough to be a note.
   It never demands exact phrasing — a note is the student's own words. */
export function noteOK(t, text) {
  const s = String(text || "").toLowerCase();
  if (s.trim().length < 40) return { ok: false, missing: ["more detail: a ticket note is a few sentences, not a few words"] };
  const missing = t.note.must.filter(function (g) { return !g.some(function (w) { return s.indexOf(w) >= 0; }); });
  return { ok: !missing.length, missing: missing.map(function (g) { return "something about " + g.slice(0, 3).join(" / "); }) };
}
