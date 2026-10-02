/* =====================================================================
   Exam views for the sims built first as tickets: App Launch, Email
   Threat and Malware Incident Response, each laid out as its sim is.
   App Deployment as the owner ruled (option A, below).
   ===================================================================== */
import { makeFleet } from "./fleet.js";
import { MALWARE } from "./tickets-malware.js";
import { MAIL, emailById } from "./tickets-mail.js";
import { CATS } from "./tickets-mail.js";

function ok(label) { return { label: label, correct: true, why: "" }; }
function no(label, why) { return { label: label, correct: false, why: why }; }
function q(id, label, right, opts, hint) { return { id: id, label: label, kind: "choice", options: opts.map(function (o) { return o[0] === right ? ok(o[0]) : no(o[0], o[1]); }), hint: hint }; }

/* ------------------------------------------- App Launch: tasks + evidence */
const AL_T1 = [["A required application file or dependency is missing or corrupted", "That's not what this evidence shows."], ["The application cannot reach a required network resource", "Others run it fine, and the message names a file on this PC, not a server."], ["The user's profile is damaged and preventing execution", "A damaged profile breaks many things at sign-in. Here one program fails."], ["The operating system is missing critical updates", "It started after an update, not for lack of one, and the message names one file."], ["The program's shortcut points to a location that no longer exists", "The program itself starts far enough to report its error. The shortcut works."], ["The application's licence has expired", "A licence message comes from the program once it's running, and names no file."]];
const AL_T2 = [["Attempt a repair or reinstall of the affected application", "Not the safest Tier 1 step for this evidence."], ["Replace the missing file using a known working system", "Copying system or runtime files between PCs is outside Tier 1, and the wrong copy makes it worse."], ["Manually restore the missing file from a backup location", "File-level restores of program files aren't a Tier 1 action."], ["Perform system-level troubleshooting to correct the error", "System-level work is beyond Tier 1 scope."], ["Run the program as an administrator", "Rights don't make a missing or damaged file appear."], ["Reimage the workstation", "Far too drastic for one program."]];
const AL_T3 = [["Event Viewer", "Not the best fit for this evidence."], ["Task Manager", "Shows what is running now. The program never got that far."], ["Services console", "Lists background services. This is a desktop program."], ["Device Manager", "Shows hardware and drivers."], ["Reliability Monitor", "Shows that it failed, but the full details (faulting module, exception code) are in Event Viewer."], ["The shortcut's Properties", "Only relevant if the shortcut were the problem."]];
const AL_T4 = [["Document findings and escalate to the next support tier", "Not the right next step here."], ["Restore system files from a previous restore point", "A system-level change, beyond Tier 1, for one program."], ["Reimage the user's workstation", "Far too drastic, and not a Tier 1 decision."], ["Disable recent security protections to test functionality", "Never weaken security to test."], ["Reinstall Windows", "Beyond Tier 1 and far too drastic."], ["Tell the user to use another PC from now on", "Leaves the problem unsolved and unrecorded."]];
const AL_H = [["Read the error message and the Event Viewer entry: what do they both name?", "When one program fails on one PC and others are fine, the cause is on that PC, in that program's own files."], ["You're Tier 1. What fixes a program's own files without touching the system?", "The safest fix for a program's own missing or damaged files is the program's own repair or reinstall."], ["Which tool records the faulting module and exception code?", "Windows' record of what failed, and in which file, is a log."], ["The Tier 1 fix didn't work. What now?", "When safe Tier 1 steps don't fix it, record what you found and did, and hand it on."]];
function al(o) {
  return { id: o.id, base: !!o.base, title: o.title, brief: o.brief, evidence: o.evidence, layout: "evidence",
    fields: [q("t1", "Task 1: What is the MOST LIKELY cause of this issue?", o.k[0], AL_T1, AL_H[0]), q("t2", "Task 2: What is the BEST next action for a Tier 1 technician?", o.k[1], AL_T2, AL_H[1]), q("t3", "Task 3: Which tool would BEST display details related to this type of error?", o.k[2], AL_T3, AL_H[2]), q("t4", "Task 4: If the issue continues after the recommended action, what should the technician do NEXT?", o.k[3], AL_T4, AL_H[3])] };
}
function ev(app, mod, code, time, more) { return "Log Name: Application\nSource: Application Error\nDate: " + time + "\nEvent ID: 1000\nLevel: Error\nComputer: USER-PC\nDescription:\nFaulting application name: " + app + "\nFaulting module name: " + mod + "\nException code: " + code + "\n" + (more || "Additional Information:\nThe application failed to start because a required component was not found."); }
const K = ["A required application file or dependency is missing or corrupted", "Attempt a repair or reinstall of the affected application", "Event Viewer", "Document findings and escalate to the next support tier"];
const AL = [
  al({ id: "al1", base: true, title: "Application Launch Troubleshooting Simulation", k: K,
    brief: ["A user reports that after a recent application update, a single program will no longer start on their workstation. Other users can still run the same program successfully.", "When the user launches the program, an error appears indicating a required file is missing. You are acting in a Tier 1 help desk role: choose the safest action before escalation."],
    evidence: { title: "Testing", msg: "The program can't start because MSVCP100.dll is missing from your computer. Try reinstalling the program to fix the problem.", log: ev("Testing.exe", "MSVCP100.dll", "0xc0000135", "Mar 03 10:29") } }),
  al({ id: "al2", title: "Application Launch · 2", k: K,
    brief: ["After the weekend's updates, PayWise won't open on one PC in Sales. Farah's PayWise is fine.", "The user hasn't changed anything themselves."],
    evidence: { title: "PayWise", msg: "The code execution cannot proceed because VCRUNTIME140.dll was not found. Reinstalling the program may fix this problem.", log: ev("PayWise.exe", "VCRUNTIME140.dll", "0xc0000135", "Mar 10 08:41") } }),
  al({ id: "al3", title: "Application Launch · 3", k: K,
    brief: ["Scan2Doc won't start on Dev's PC since last night's update. Everyone else's works.", "Dev says it's urgent: there's a stack of contracts to scan."],
    evidence: { title: "Scan2Doc", msg: "The program can't start because MSVCR120.dll is missing from your computer. Try reinstalling the program to fix this problem.", log: ev("Scan2Doc.exe", "MSVCR120.dll", "0xc0000135", "Mar 12 09:02") } }),
  al({ id: "al4", title: "Application Launch · 4", k: K,
    brief: ["Testing shows an error the moment it opens on Rosa's PC, after the update. Others are fine.", "Rosa thinks she may have closed it while it was updating."],
    evidence: { title: "Testing", msg: "Testing could not read its configuration file (config.ini). The file is damaged. Reinstall Testing to restore it.", log: ev("Testing.exe", "Testing.exe", "0xe0434352", "Mar 14 11:20", "Additional Information:\nThe configuration file C:\\Program Files (x86)\\Testing\\config.ini could not be read: unexpected end of file.") } }),
  al({ id: "al5", title: "Application Launch · 5", k: ["The program's shortcut points to a location that no longer exists", "Attempt a repair or reinstall of the affected application", "The shortcut's Properties", "Document findings and escalate to the next support tier"],
    brief: ["Since the LabelPro update, John's desktop icon gives an error. Starting LabelPro from Start works fine.", "The update moved LabelPro from version 10 to version 11."],
    evidence: { title: "LabelPro", msg: "Windows cannot find 'C:\\Program Files\\LabelPro 10\\LabelPro.exe'. Make sure you typed the name correctly, and then try again.", log: "No Application Error was recorded: the program was never started." } }),
  al({ id: "al6", title: "Application Launch · 6", k: K,
    brief: ["ChartView closes as soon as Farah opens a chart, since the update. A reinstall from Software Center this morning changed nothing. Others are fine.", "The crash happens inside ChartView itself."],
    evidence: { title: "ChartView", msg: "ChartView has stopped working. A problem caused the program to stop working correctly.", log: ev("ChartView.exe", "ChartView.exe", "0xc0000005", "Mar 18 14:07", "Additional Information:\nAccess violation in ChartView.exe. A reinstall was completed at 09:15.") } })
];

/* -------------------- App Deployment: the sim's tabs, keyed as ruled ----
   The owner, 2 October 2026, option A: keep the sim's layout and its
   commands, but the right answer is the real fix (install the runtime the
   program needs, from the Visual C++ Redistributable). The sim's own key,
   robocopy from System32 then regsvr32, stays as near misses, each with
   the reason it fails. Each practice is one of the App Deployment tickets
   (src), so the exam view and the ticket teach the same fix. */
function ix(o) { return o.map(function (x) { return { label: x[0], correct: !!x[2], why: x[1] || "" }; }); }
function evq(right, rows, hint) {
  return { id: "ev", label: "Index number of the Event Viewer entry that records the failure", kind: "choice", setting: true,
    options: rows.map(function (r) { return { label: String(r[0]), correct: String(r[0]) === right, why: String(r[0]) === right ? "" : r[6] || "Read its EntryType and Message again: it doesn't record this failure." }; }), hint: hint };
}
function cq(id, label, opts, hint) { return { id: id, label: label, kind: "choice", options: ix(opts), hint: hint }; }
const EVF = {
  mei: function (i, t) { return [i, t, "Information", "MEIx64", 1074200578, "Intel(R) Management Engine Interface driver has started successfully.", "A driver starting normally. Information, and nothing to do with the program."]; },
  scm: function (i, t, svc) { return [i, t, "Information", "Service Control Manager", 1073748860, "The " + svc + " service entered the running state.", "A service starting normally, near the time of the failure. Timing isn't cause."]; },
  dcom: function (i, t) { return [i, t, "Warning", "DistributedCOM", 10016, "The application-specific permission settings do not grant Local Activation permission for the COM Server application to the user RAFIKI\\jdoe.", "A DCOM permission warning that shows on countless healthy PCs. It names no program."]; },
  msi: function (i, t, what) { return [i, t, "Information", "MsiInstaller", 1033, "Windows Installer installed the product. Product Name: " + what + ". Installation success or error status: 0.", "The deployment installing, successfully (status 0). It explains the timing, but it doesn't record the failure."]; }
};
function err(i, t, app, mod, code) { return [i, t, "Error", "Application Error", 1000, "Faulting application name: " + app + ", Faulting module name: " + mod + ", Exception code: " + code + "."]; }
const PS = {
  cs: ["Get-WmiObject win32_computersystem", "Manufacturer           : Dell Inc.\nModel                  : OptiPlex 7090\nName                   : USER-PC\nPrimaryOwnerName       : John Doe\nDomain                 : WORKGROUP\nTotalPhysicalMemory    : 17179869184\nSystemType             : x64-based PC"],
  disk: ["Get-WmiObject win32_logicaldisk", "DeviceID     VolumeName    FileSystem    FreeSpace      Size\nC:                        NTFS          53427814400    256000000000\nD:          Data          NTFS          102346956800   512000000000"],
  ls: function (dir, rows) { return ["ls \"" + dir + "\"", "    Directory: " + dir + "\n\nMode                LastWriteTime         Length Name\n----                -------------         ------ ----\n" + (rows.length ? rows.map(function (r) { return "-a----        " + r[0] + "     " + r[1] + " " + r[2]; }).join("\n") : "(no files match)")]; }
};
const RUN_T = "& \"C:\\Program Files (x86)\\Testing\\Testing.exe\"";
const C2_COMMON = {
  reg: ["regsvr32 msvcp100.dll", "The sim's own second step, and it fails: msvcp100.dll is the Visual C++ runtime, not a COM server, so Windows answers \"DllRegisterServer entry point was not found\". The installer already set the runtime up."],
  gp: ["gpupdate /force", "Group Policy has nothing to do with a missing runtime. Refreshing it doesn't confirm anything."],
  off: ["shutdown -s -f -t 0", "-s shuts the PC down and leaves it off, and -f closes the user's work without warning. Nothing gets tested."],
  regs: ["reg /s \"msvcp100.reg\"", "There's no such command (it's regedit /s that imports a .reg file), and no registry fix puts a missing runtime back."],
  log: ["Get-EventLog -LogName System -Newest 8", "Reading the System log again proves nothing: the failure was in the Application log, and only starting the program shows it's fixed."]
};
const ADH = {
  ev: ["Read the EntryType column, then the Message of anything that isn't Information.", "The entry that records a failure is the one marked Error that names the program that failed."],
  c2: ["You've put the fix in. What tells you it worked?", "A fix isn't done until it's tested: run the thing that was broken, the way the user does."]
};
function ad(o) { return { id: o.id, src: o.src, base: !!o.base, title: o.title, layout: "deploy", brief: o.brief, evidence: o.evidence,
  fields: [evq(o.ev, o.evidence.events, ADH.ev), cq("c1", "1st CLI Resolution", o.c1, o.h1), cq("c2", "2nd CLI Resolution", o.c2, o.h2 || ADH.c2)] }; }
const AD = [
  ad({ id: "ad1", src: "D1", base: true, title: "Application Deployment Troubleshooting Simulation", ev: "2190",
    brief: ["A user reports that after a recent software deployment to upgrade applications, the user can no longer use the Testing program.", "However, other employees can successfully use the Testing program.", "Review the information in each tab to verify the results of the deployment and resolve any issues discovered by selecting: the index number of the Event Viewer issue, the first command to resolve the issue, and the second command to resolve the issue."],
    evidence: { bsod: true, error: "The program can't start because MSVCP100.dll is missing from your computer. Try reinstalling the program to fix this problem.",
      events: [EVF.scm(2191, "Mar 03 10:35", "Multimedia Class Scheduler"), err(2190, "Mar 03 10:35", "Testing.exe", "MSVCP100.dll", "0xc0000135"), EVF.scm(2189, "Mar 03 10:29", "TCP/IP NetBIOS Helper"), EVF.scm(2188, "Mar 03 10:29", "Multimedia Class Scheduler"), EVF.msi(2187, "Mar 03 10:29", "Rafiki Application Upgrade Pack"), EVF.dcom(2186, "Mar 03 10:29"), EVF.mei(2185, "Mar 03 10:29"), EVF.mei(2184, "Mar 03 10:29")],
      cmds: [PS.cs, PS.disk, PS.ls("C:\\Windows\\System32\\msvc*", [["03/03/2025     10:20", "  829,440", "msvcp100.dll"], ["03/03/2025     10:20", "  773,120", "msvcr100.dll"]]), PS.ls("C:\\Windows\\SysWOW64\\msvc*", [["01/14/2025     08:02", "  575,056", "msvcp140.dll"]]), PS.ls("C:\\Program Files (x86)\\Testing", [["03/03/2025     09:45", "  829,440", "Testing.exe"], ["03/03/2025     09:45", "    1,024", "config.ini"]])] },
    c1: [["\\\\FS01\\Software\\vcredist_x86_2010.exe", "", true],
      ["robocopy \"\\\\User-PC02\\C$\\Windows\\System32\" \"C:\\Program Files (x86)\\Testing\" \"msvcp100.dll\"", "The sim's own answer, and it fails: System32 holds the 64-bit DLLs. Testing is a 32-bit program (it's in Program Files (x86)), so a 64-bit copy in its folder stops it with 0xc000007b."],
      ["copy \"C:\\Program Files\\Testing\\msvcp100.dll\" \"\\\\User-PC02\\C$\\Windows\\System32\" /v /y", "The wrong way round: it pushes a file from this PC onto the working one, and there's no such folder here anyway."],
      ["regsvr32 msvcp100.dll", "regsvr32 registers COM servers. msvcp100.dll is a runtime library, so it fails with \"DllRegisterServer entry point was not found\"."],
      ["\\\\FS01\\Software\\vcredist_x64_2010.exe", "Right idea, wrong bitness: the 64-bit runtime is already there in System32. Testing is 32-bit and looks in SysWOW64."],
      ["setx path \"C:\\Windows\\System32\"", "That replaces the whole PATH with one folder, breaking other programs, and the file isn't missing from System32 anyway."]],
    h1: ["Compare the two ls outputs: where is msvcp100.dll, and where does a 32-bit program look for it?", "On 64-bit Windows, System32 holds the 64-bit DLLs and SysWOW64 the 32-bit ones. A missing runtime goes back in with its own installer, matching the program's bitness."],
    c2: [[RUN_T, "", true], C2_COMMON.reg, C2_COMMON.gp, C2_COMMON.off, C2_COMMON.regs, C2_COMMON.log] }),
  ad({ id: "ad2", src: "D2", title: "Application Deployment · 2", ev: "3306",
    brief: ["Farah in Finance: since the overnight deployment, PayWise says VCRUNTIME140.dll is missing. She already ran the repair in Software Center, as the Tier 1 guide says. It did nothing.", "Payroll runs tomorrow. Other PCs run PayWise fine."],
    evidence: { error: "The code execution cannot proceed because VCRUNTIME140.dll was not found. Reinstalling the program may fix this problem.",
      events: [EVF.scm(3308, "Mar 07 09:01", "Windows Update"), EVF.msi(3307, "Mar 07 08:58", "PayWise 3.2 (repair)"), err(3306, "Mar 07 08:55", "PayWise.exe", "VCRUNTIME140.dll", "0xc0000135"), EVF.scm(3305, "Mar 07 08:50", "Print Spooler"), EVF.msi(3304, "Mar 07 01:12", "Rafiki Application Upgrade Pack"), EVF.dcom(3303, "Mar 07 01:10"), EVF.mei(3302, "Mar 07 01:09"), EVF.mei(3301, "Mar 07 01:09")],
      cmds: [PS.cs, PS.ls("C:\\Windows\\System32\\vcruntime*", [["01/14/2025     08:02", "  119,888", "vcruntime140.dll"], ["01/14/2025     08:02", "   49,744", "vcruntime140_1.dll"]]), PS.ls("C:\\Windows\\SysWOW64\\vcruntime*", []), PS.ls("C:\\Program Files (x86)\\PayWise", [["03/07/2025     08:58", "2,114,560", "PayWise.exe"], ["03/07/2025     08:58", "    4,096", "paywise.cfg"]])] },
    c1: [["\\\\FS01\\Software\\VC_redist.x86.exe", "", true],
      ["\\\\FS01\\Software\\VC_redist.x64.exe", "Wrong bitness: the 64-bit runtime is there in System32. PayWise is in Program Files (x86), so it's 32-bit and looks in SysWOW64."],
      ["robocopy \"\\\\User-PC02\\C$\\Windows\\System32\" \"C:\\Program Files (x86)\\PayWise\" \"vcruntime140.dll\"", "A 64-bit copy into a 32-bit program's folder gives 0xc000007b, and nothing will ever update a hand-copied file."],
      ["regsvr32 vcruntime140.dll", "A runtime library isn't a COM server: \"DllRegisterServer entry point was not found\"."],
      ["msiexec /fa PayWise.msi", "That's the repair Farah already ran. PayWise's installer doesn't carry the runtime, so repairing it again changes nothing."],
      ["sfc /scannow", "System File Checker repairs Windows' own files. The Visual C++ runtime isn't one of them."]],
    h1: ["Farah already repaired PayWise. Which runtime is the missing file from, and which folder is it missing from?", "When a program's installer doesn't carry its runtime, reinstalling the program changes nothing. Install the runtime itself, matching the program's bitness."],
    c2: [["& \"C:\\Program Files (x86)\\PayWise\\PayWise.exe\"", "", true], ["regsvr32 vcruntime140.dll", "A runtime library isn't a COM server, and the installer has already set it up."], C2_COMMON.gp, C2_COMMON.off, ["tasklist | sort", "PayWise isn't running, so the list can't show it working. Start it."], C2_COMMON.log] }),
  ad({ id: "ad3", src: "D3", title: "Application Deployment · 3", ev: "4417",
    brief: ["Rosa at reception: after last night's deployment, Testing 4.3 says RAFIKICORE.dll is missing. IT's deployment email said the new version keeps its shared files in a Common Files folder and \"the deployment script will sort the paths\".", "Nothing else seems broken."],
    evidence: { error: "The program can't start because RAFIKICORE.dll is missing from your computer. Try reinstalling the program to fix this problem.",
      events: [err(4417, "Mar 08 08:21", "Testing.exe", "RAFIKICORE.dll", "0xc0000135"), EVF.scm(4416, "Mar 08 08:15", "Windows Search"), [4415, "Mar 08 01:14", "Information", "Rafiki Deployment", 1, "Deployment script completed: setx /m PATH \"C:\\Windows\\System32\"  (exit 0).", "The cause, recorded as a success. It's not the entry that records the failure itself."], EVF.msi(4414, "Mar 08 01:12", "Testing 4.3"), EVF.dcom(4413, "Mar 08 01:10"), EVF.scm(4412, "Mar 08 01:09", "Multimedia Class Scheduler"), EVF.mei(4411, "Mar 08 01:09"), EVF.mei(4410, "Mar 08 01:09")],
      cmds: [["echo $env:Path", "C:\\Windows\\System32"], PS.ls("C:\\Program Files (x86)\\Common Files\\Rafiki", [["03/08/2025     01:12", "  412,000", "rafikicore.dll"]]), PS.ls("C:\\Program Files (x86)\\Testing", [["03/08/2025     01:12", "  861,184", "Testing.exe"], ["03/08/2025     01:12", "    1,024", "config.ini"]]), PS.cs] },
    c1: [["setx /m PATH \"%PATH%;C:\\Program Files (x86)\\Common Files\\Rafiki\"", "", true],
      ["setx path \"C:\\Windows\\System32\"", "That's exactly what the deployment script ran: it's what broke it."],
      ["copy \"C:\\Program Files (x86)\\Common Files\\Rafiki\\rafikicore.dll\" C:\\Windows\\System32", "A 32-bit DLL in System32, the 64-bit folder: wrong place, and the PATH stays broken for anything else that uses it."],
      ["regsvr32 rafikicore.dll", "Registering doesn't tell Windows where to look. The file is fine; Windows isn't searching its folder."],
      ["robocopy \"\\\\User-PC02\\C$\\Program Files (x86)\\Testing\" \"C:\\Program Files (x86)\\Testing\" \"rafikicore.dll\"", "It hides the problem for Testing alone: the PATH stays broken, and the next deployment won't know about the hand-copied file."],
      ["reg /s \"rafikicore.reg\"", "No such command (it's regedit /s), and the PATH isn't fixed by importing an unknown .reg file."]],
    h1: ["The file is on the disk. Look at where Windows searches: the PATH, and the deployment's own entry in the log.", "Windows finds a DLL in the program's folder, the system folder, or a folder on the PATH. Put the missing folder back on the PATH, keeping what's there."],
    c2: [["reg query \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment\" /v Path", "", true], ["echo $env:Path", "This window still has the old PATH: setx changes the saved PATH for new windows, not this one. It would look unchanged."], C2_COMMON.gp, C2_COMMON.off, ["regsvr32 rafikicore.dll", "Registering doesn't change or confirm where Windows looks."], C2_COMMON.log],
    h2: ["setx saves the new PATH. Where is it saved, and does this window see it?", "setx writes the PATH to the registry for new processes; the window you ran it in keeps its old copy. Confirm the change where it was saved."] }),
  ad({ id: "ad4", src: "D4", title: "Application Deployment · 4", ev: "5523",
    brief: ["Dev: everyone got the new Testing last night except him. There's no icon and nothing in Start. His PC was switched off overnight because he was working from home.", "It's a Group Policy deployment."],
    evidence: { error: "Windows cannot find 'Testing'. Make sure you typed the name correctly, and then try again.",
      events: [EVF.scm(5524, "Mar 09 08:56", "Windows Search"), [5523, "Mar 09 08:55", "Warning", "Application Management Group Policy", 108, "Failed to apply changes to software installation settings. Software installation policy application has been delayed until the next system startup."], EVF.scm(5522, "Mar 09 08:54", "Group Policy Client"), [5521, "Mar 09 08:54", "Information", "Kernel-General", 12, "The operating system started at system time Mar 09 08:54.", "The PC starting this morning. That's when the policy should have applied, and the next entry says why it didn't."], EVF.dcom(5520, "Mar 08 17:30"), EVF.scm(5519, "Mar 08 17:29", "Print Spooler"), EVF.mei(5518, "Mar 08 08:02"), EVF.mei(5517, "Mar 08 08:02")],
      cmds: [["gpresult /r", "COMPUTER SETTINGS\n    Applied Group Policy Objects\n        Default Domain Policy\n\n    The following GPOs were not applied because they were filtered out\n        Rafiki Apps - Testing\n            Filtering:  Not Applied (Pending restart: Software Installation applies at startup)"], PS.ls("C:\\Program Files (x86)\\Testing", []), PS.cs] },
    c1: [["gpupdate /force", "", true],
      ["gpresult /r", "It shows the policy is waiting for a restart (you've read that). It doesn't apply anything."],
      ["\\\\FS01\\Software\\Testing-4.2.msi", "Installed by hand, outside the policy: Group Policy won't manage or update it, and the policy still tries to install over it."],
      ["regsvr32 msvcp100.dll", "Nothing's missing from an installed program: Testing isn't installed at all."],
      ["setx path \"C:\\Windows\\System32\"", "Overwrites the PATH and breaks other programs. Testing isn't on the PC to find."],
      ["Get-EventLog -LogName System -Newest 8", "You've read the log. It says what's needed; this reads it again."]],
    h1: ["gpresult shows the policy waiting. What applies policy now, and what does a software install also need?", "Software Installation policy only applies while the computer starts up. Refresh policy, then restart."],
    c2: [["shutdown /r /t 0", "", true], ["shutdown -s -f -t 0", "-s turns it off and leaves it off until someone presses the power button, and -f closes Dev's work without warning. Restart instead."], ["gpupdate /force", "You've just run it. It answers that Software Installation needs a restart."], [RUN_T, "Testing isn't installed until the PC restarts: there's nothing to run."], C2_COMMON.regs, ["tasklist | sort", "It lists what's running. The install hasn't happened yet."]],
    h2: ["What did gpupdate say the Software Installation policy needs?", "Some policies only run during startup. Nothing installs until the computer restarts."] }),
  ad({ id: "ad5", src: "D5", title: "Application Deployment · 5", ev: "6610",
    brief: ["Brenda in Sales: Testing now says it's unable to start correctly (0xc000007b). When it broke after the deployment, someone from the other office \"fixed\" it by copying a DLL over from another PC. It was fine for a day, then this.", "Other PCs are fine."],
    evidence: { error: "The application was unable to start correctly (0xc000007b). Click OK to close the application.",
      events: [EVF.scm(6611, "Mar 11 13:28", "Multimedia Class Scheduler"), err(6610, "Mar 11 13:28", "Testing.exe", "MSVCP100.dll", "0xc000007b"), EVF.scm(6609, "Mar 11 09:10", "Windows Update"), EVF.msi(6608, "Mar 10 01:12", "Rafiki Application Upgrade Pack"), EVF.dcom(6607, "Mar 10 01:10"), EVF.scm(6606, "Mar 10 01:09", "TCP/IP NetBIOS Helper"), EVF.mei(6605, "Mar 10 01:09"), EVF.mei(6604, "Mar 10 01:09")],
      cmds: [PS.ls("C:\\Program Files (x86)\\Testing", [["03/03/2025     09:45", "  829,440", "Testing.exe"], ["03/10/2025     16:02", "  829,440", "msvcp100.dll"], ["03/03/2025     09:45", "    1,024", "config.ini"]]), PS.ls("C:\\Windows\\System32\\msvc*", [["03/03/2025     10:20", "  829,440", "msvcp100.dll"], ["03/03/2025     10:20", "  773,120", "msvcr100.dll"]]), PS.ls("C:\\Windows\\SysWOW64\\msvc*", [["03/03/2025     10:20", "  421,200", "msvcp100.dll"], ["03/03/2025     10:20", "  612,192", "msvcr100.dll"]]), PS.cs] },
    c1: [["del \"C:\\Program Files (x86)\\Testing\\msvcp100.dll\"", "", true],
      ["\\\\FS01\\Software\\vcredist_x86_2010.exe", "The 32-bit runtime is already installed in SysWOW64. Windows looks in Testing's own folder first, finds the wrong copy, and stops there, so reinstalling changes nothing."],
      ["robocopy \"\\\\User-PC02\\C$\\Windows\\System32\" \"C:\\Program Files (x86)\\Testing\" \"msvcp100.dll\"", "That's how this started: System32's copy is the 64-bit one."],
      ["\\\\FS01\\Software\\vcredist_x64_2010.exe", "Testing is 32-bit, and the 64-bit runtime is already there. The stray copy in its folder is still found first."],
      ["regsvr32 msvcp100.dll", "A runtime library isn't a COM server, and registering it wouldn't change which copy is found first."],
      ["sfc /scannow", "Windows' own files are fine. The problem is an extra file in the program's folder."]],
    h1: ["Look at Testing's own folder. What's there that it didn't ship with? Compare its size with the two system copies.", "Windows looks in the program's own folder before anywhere else. A DLL of the wrong bitness there is found first and stops the program, even when the right copy is installed."],
    c2: [[RUN_T, "", true], C2_COMMON.reg, C2_COMMON.gp, C2_COMMON.off, C2_COMMON.regs, C2_COMMON.log] }),
  ad({ id: "ad6", src: "D6", title: "Application Deployment · 6", ev: "7702",
    brief: ["Dev again: LabelPro 11 says VCRUNTIME140.dll is missing since the deployment. He had a look himself, and the file is definitely on the PC, in C:\\Windows\\SysWOW64.", "He wants to know if he should just copy it into the LabelPro folder."],
    evidence: { error: "The code execution cannot proceed because VCRUNTIME140.dll was not found. Reinstalling the program may fix this problem.",
      events: [EVF.scm(7703, "Mar 13 15:44", "Windows Search"), err(7702, "Mar 13 15:44", "LabelPro.exe", "VCRUNTIME140.dll", "0xc0000135"), EVF.msi(7701, "Mar 13 01:12", "LabelPro 11"), EVF.msi(7700, "Mar 13 01:11", "Rafiki Application Upgrade Pack"), EVF.dcom(7699, "Mar 13 01:10"), EVF.scm(7698, "Mar 13 01:09", "Multimedia Class Scheduler"), EVF.mei(7697, "Mar 13 01:09"), EVF.mei(7696, "Mar 13 01:09")],
      cmds: [PS.ls("C:\\Windows\\SysWOW64\\vcruntime*", [["01/14/2025     08:02", "   99,488", "vcruntime140.dll"]]), PS.ls("C:\\Windows\\System32\\vcruntime*", []), PS.ls("C:\\Program Files\\LabelPro 11", [["03/13/2025     01:12", "3,402,752", "LabelPro.exe"], ["03/13/2025     01:12", "    2,048", "labels.db"]]), PS.cs] },
    c1: [["\\\\FS01\\Software\\VC_redist.x64.exe", "", true],
      ["\\\\FS01\\Software\\VC_redist.x86.exe", "That one's already installed: it's the copy Dev found in SysWOW64. LabelPro is in Program Files, so it's 64-bit."],
      ["copy C:\\Windows\\SysWOW64\\vcruntime140.dll \"C:\\Program Files\\LabelPro 11\"", "Dev's idea: a 32-bit DLL in a 64-bit program's folder stops it with 0xc000007b."],
      ["regsvr32 vcruntime140.dll", "A runtime library isn't a COM server: \"DllRegisterServer entry point was not found\"."],
      ["robocopy \"\\\\User-PC02\\C$\\Windows\\System32\" \"C:\\Program Files\\LabelPro 11\" \"vcruntime140.dll\"", "It may well start LabelPro, since it's the 64-bit copy, but it's a hand-copied runtime: Windows Update never patches it, and the next program that needs the runtime is still broken. Install the runtime properly."],
      ["setx path \"%PATH%;C:\\Windows\\SysWOW64\"", "Puts the 32-bit folder in a 64-bit program's way: it would find the wrong copy and fail with 0xc000007b."]],
    h1: ["Dev found it in SysWOW64. Which kind of program looks there, and which kind is LabelPro 11? Look where it's installed.", "64-bit programs live in Program Files and use System32; 32-bit programs live in Program Files (x86) and use SysWOW64. Install the runtime that matches the program."],
    c2: [["& \"C:\\Program Files\\LabelPro 11\\LabelPro.exe\"", "", true], ["regsvr32 vcruntime140.dll", "A runtime library isn't a COM server, and the installer has already set it up."], C2_COMMON.gp, C2_COMMON.off, ["tasklist | sort", "LabelPro isn't running, so the list can't show it working. Start it."], C2_COMMON.log] })
];

/* --------------------------------------------- Email Threat: the inbox */
function em(t, i) {
  return { id: "em" + (i + 1), base: i === 0, title: i === 0 ? "Email Threat Classification Exercise" : "Email Threat Classification · " + (i + 1), layout: "inbox",
    brief: ["Click each email in the inbox, read the message, and classify it as Legitimate, Spam, Phishing or Malicious. Then submit your choices."],
    emails: t.mails.map(function (e) { return e.id; }),
    fields: t.mails.map(function (e) { return { id: e.id, label: "\"" + e.subject + "\"", kind: "choice", setting: true, options: CATS.map(function (c) { return c.key === e.cat ? ok(c.label) : no(c.label, ({ legit: "Something here doesn't check out: who really sent it, where it links, what it wants.", spam: "Look at what it wants: a sale, or a password, money or a download?", phishing: "Is it pretending to be someone to get a password, money or details? Look again.", malicious: "Does it want something opened or run? Look again." })[c.key]); }), hint: ["Read who it's really from, where its links go, and what it wants.", "Ask what the email wants from the reader: nothing risky, a purchase, a password or money or details while pretending to be someone, or something opened or run. What it wants decides its category."] }; }) };
}
const EM = MAIL.map(em);

/* ------------------------------- Malware IR: the seven-device network map */
const DEV = ["FS01", "MAIL01", "WS1", "WS2", "WS3", "WS4", "WS5"];
const ACT = [["Quarantine it, then remove the malware", "That's for an infected device. Read its evidence again."], ["Leave it on the network: it's clean", "Read its evidence again: something there doesn't belong."], ["Stop the malicious service, then quarantine it", "Out of order: while it's on the network, stopping it gives it time to spread. Contain first."], ["Quarantine it, and leave the malware running", "Contained, but not eradicated: the malware is still there."], ["Stop the malicious service only", "Its service starts it again, and the device stays on the network."], ["Shut it down", "Disrupts the business without dealing with anything. Investigate, then act on what you find."]];
function mw(t, i) {
  const f = makeFleet(); t.setup(f);
  const hit = t.infects;
  const devices = DEV.map(function (id) { const m = f[id]; return { id: id, host: m.host, procs: m.procs.map(function (p) { return { name: p.name, desc: p.desc, cpu: p.cpu, image: p.image, publisher: p.publisher }; }), logs: [].concat(m.logs.System || [], m.logs.Application || []).slice(-6), browser: (m.browser || []).slice(-4) }; });
  return { id: "mw" + (i + 1), src: t.id, base: i === 0, title: i === 0 ? "Incident Response: Incident Report #4921" : "Incident Response · " + (i + 1), layout: "network",
    brief: t.brief.slice(), devices: devices, visit: true,
    fields: DEV.map(function (id) { const inf = hit.indexOf(id) >= 0; return { id: id, label: "What do you do with " + f[id].host + "?", kind: "choice", options: ACT.map(function (a, j) { const right = inf ? 0 : 1; return j === right ? ok(a[0]) : no(a[0], inf && j === 1 ? "Read its Task Manager and logs again: something there doesn't belong." : !inf && j === 0 ? "Quarantining a clean device stops someone working for nothing. Read its evidence again." : a[1]); }), hint: ["Check this device's Task Manager, System Logs and Browser History.", "Infected devices are contained first, then the malware removed. Clean devices stay on the network."] }; }) };
}
const MW = MALWARE.map(mw);

export const MORE = [
  { id: "al", sim: "Application Launch Troubleshooting", layout: "evidence", objective: "OS issues", variants: AL },
  { id: "ad", sim: "Application Deployment Troubleshooting", layout: "deploy", objective: "OS issues", variants: AD },
  { id: "em", sim: "Email Threat Classification", layout: "inbox", objective: "Malware prevention", variants: EM },
  { id: "mw", sim: "Malware Incident Response", layout: "network", objective: "Malware prevention", variants: MW }
];
export { emailById };
