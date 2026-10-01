/* =====================================================================
   The Command Prompt.

   Typed, not picked — the owner's decision, 30 September 2026. The
   student types a real command and the machine in machine.js answers it
   in Windows' own words: the refusals, the progress bars and the error
   numbers are the ones a technician actually meets, because learning to
   READ what a tool says back is half of using it.

   THE COMMAND SET is the owner's 82-command list from the
   Windows-Linux-Commands site (the Windows half), plus DISM, which the
   owner added by name on 30 September. A real Windows command that is not
   modelled here says so plainly rather than pretending to run.

   EVERY RESULT CARRIES A KIND, and the kind is what the hint ladder counts.
   The rule is SETTLED in CLAUDE.md:

     look     read-only: dir, tasklist, plain ipconfig, ping, whoami…
              Never a guess. Looking before you act is the behaviour
              being taught.
     help     `help`, `/?`. Never a guess.
     error    not recognized, bad syntax. Never a guess — Windows' own
              error is feedback enough.
     change   it did something, or tried to. Counts as a guess when it
              does not move the job on.
     refused  it tried and Windows refused (not elevated, access denied).
              Counts, because the attempt was a real attempt.

   No DOM here either; the checks drive this under node.
   ===================================================================== */
import * as M from "./machine.js";
import * as MW from "./malware.js";

const NOT_RECOGNIZED = function (w) {
  return "'" + w + "' is not recognized as an internal or external command,\noperable program or batch file.";
};

/* What `help` prints, trimmed to the commands this PC answers. The real
   list is longer; a student typing one of the others is told so. */
const HELP_LIST = [
  ["CD", "Displays the name of or changes the current directory."],
  ["CHKDSK", "Checks a disk and displays a status report."],
  ["CLS", "Clears the screen."],
  ["COPY", "Copies one or more files to another location."],
  ["DEL", "Deletes one or more files."],
  ["DIR", "Displays a list of files and subdirectories in a directory."],
  ["DISKPART", "Displays or configures Disk Partition properties."],
  ["DISM", "Deployment Image Servicing and Management tool."],
  ["EXIT", "Quits the CMD.EXE program (command interpreter)."],
  ["FORMAT", "Formats a disk for use with Windows."],
  ["GPRESULT", "Displays Group Policy information for machine or user."],
  ["GPUPDATE", "Updates Group Policy settings."],
  ["HELP", "Provides Help information for Windows commands."],
  ["HOSTNAME", "Prints the name of the current host."],
  ["IPCONFIG", "Displays all current TCP/IP network configuration values."],
  ["MD", "Creates a directory."],
  ["NET", "Manages users, shares and network connections (net user, net use)."],
  ["PING", "Checks whether another computer answers over the network."],
  ["RD", "Removes a directory."],
  ["ROBOCOPY", "Advanced utility to copy files and directory trees."],
  ["SFC", "Scans and verifies the integrity of all protected system files."],
  ["SHUTDOWN", "Allows proper local or remote shutdown of machine."],
  ["TASKKILL", "Kill or stop a running process or application."],
  ["TASKLIST", "Displays all currently running tasks including services."],
  ["VER", "Displays the Windows version."],
  ["WHOAMI", "Displays the user this prompt is running as."],
  ["WINVER", "Shows the About Windows box."],
  ["XCOPY", "Copies files and directory trees."]
];

/* Usage text, as `/?` prints it. Shortened from Windows' own, keeping the
   switches the exam and the job need, in Windows' wording. */
const USAGE = {
  cd: "Displays the name of or changes the current directory.\n\nCHDIR [/D] [drive:][path]\nCHDIR [..]\nCD [/D] [drive:][path]\nCD [..]\n\n  ..   Specifies that you want to change to the parent directory.\n\nType CD drive: to display the current directory in the specified drive.\nType CD without parameters to display the current drive and directory.",
  dir: "Displays a list of files and subdirectories in a directory.\n\nDIR [drive:][path][filename] [/A[[:]attributes]] [/S] [/W]\n\n  /A    Displays files with specified attributes.\n  /S    Displays files in specified directory and all subdirectories.\n  /W    Uses wide list format.",
  cls: "Clears the screen.\n\nCLS",
  exit: "Quits the CMD.EXE program (command interpreter) or the current batch\nscript.\n\nEXIT",
  hostname: "Prints the name of the current host.\n\nhostname",
  whoami: "WhoAmI has three ways of working, of which this PC answers the simplest:\n\nWHOAMI            Displays the user name of the current prompt.\nWHOAMI /GROUPS    Displays group membership, including whether the prompt\n                  is running with an administrator's token.",
  ver: "Displays the Windows version.\n\nVER",
  winver: "Shows the About Windows box: edition, version and build.",
  tasklist: "TASKLIST [/S system [/U username [/P [password]]]]\n         [/M [module] | /SVC | /V] [/FI filter] [/FO format] [/NH]\n\nDescription:\n    This tool displays a list of currently running processes on\n    either a local or remote machine.\n\n    /SVC    Displays services hosted in each process.\n    /V      Displays verbose task information.",
  taskkill: "TASKKILL [/S system [/U username [/P [password]]]]\n         { [/FI filter] [/PID processid | /IM imagename] } [/T] [/F]\n\nDescription:\n    This tool is used to terminate tasks by process id (PID) or image name.\n\n    /PID  processid        Specifies the PID of the process to be terminated.\n    /IM   imagename        Specifies the image name of the process to be terminated.\n    /T                     Terminates the specified process and any child\n                           processes which were started by it.\n    /F                     Specifies to forcefully terminate the process(es).",
  sfc: "Microsoft (R) Windows (R) Resource Checker Version 6.0\nCopyright (C) Microsoft Corporation. All rights reserved.\n\nScans the integrity of all protected system files and replaces incorrect versions with\ncorrect Microsoft versions.\n\nSFC [/SCANNOW] [/VERIFYONLY] [/SCANFILE=<file>] [/VERIFYFILE=<file>]\n    [/OFFWINDIR=<offline windows directory> /OFFBOOTDIR=<offline boot directory>]\n\n/SCANNOW        Scans integrity of all protected system files and repairs files with\n                problems when possible.\n/VERIFYONLY     Scans integrity of all protected system files. No repair operation is\n                performed.",
  dism: "Deployment Image Servicing and Management tool\nVersion: 10.0.22621.2792\n\nDISM.exe [dism_options] {Imaging_command} [<Imaging_arguments>]\nDISM.exe {/Image:<path_to_offline_image> | /Online} [dism_options]\n         {servicing_command} [<servicing_arguments>]\n\n  /Online /Cleanup-Image /CheckHealth    Reports whether the component store\n                                         has been flagged as corrupted.\n  /Online /Cleanup-Image /ScanHealth     Scans the component store for\n                                         corruption. Takes several minutes.\n  /Online /Cleanup-Image /RestoreHealth  Scans the component store and repairs\n                                         it, using Windows Update as the source.",
  chkdsk: "Checks a disk and displays a status report.\n\nCHKDSK [volume[[path]filename]]] [/F] [/V] [/R] [/X] [/SCAN]\n\n  volume          Specifies the drive letter (followed by a colon).\n  /F              Fixes errors on the disk.\n  /R              Locates bad sectors and recovers readable information\n                  (implies /F).\n  /X              Forces the volume to dismount first if necessary.\n  /SCAN           Runs an online scan on the volume.",
  shutdown: "Usage: shutdown [/i | /l | /s | /sg | /r | /g | /a | /p | /h | /e | /o] [/hybrid] [/soft] [/fw] [/f]\n    [/m \\\\computer][/t xxx][/d [p|u:]xx:yy [/c \"comment\"]]\n\n    /s         Shutdown the computer.\n    /r         Full shutdown and restart the computer.\n    /a         Abort a system shutdown.\n    /t xxx     Set the time-out period before shutdown to xxx seconds.\n    /f         Force running applications to close without forewarning users.",
  diskpart: "Microsoft DiskPart version 10.0.22621.1\n\nDISKPART opens its own prompt. Inside it:\n\n  LIST DISK        Display a list of disks.\n  SELECT DISK n    Shift the focus to disk n.\n  DETAIL DISK      Display the properties of the selected disk.\n  LIST VOLUME      Display a list of volumes.\n  LIST PARTITION   Display the partitions on the selected disk.\n  CLEAN            Clear the configuration information, or all information,\n                   off the disk.\n  CONVERT GPT      Convert the selected, empty disk to GPT.\n  CONVERT MBR      Convert the selected, empty disk to MBR.\n  CREATE PARTITION PRIMARY [SIZE=n]\n  FORMAT FS=<NTFS|EXFAT|FAT32> [LABEL=\"x\"] [QUICK]\n  ASSIGN [LETTER=x]\n  EXIT             Exit DiskPart.",
  format: "Formats a disk for use with Windows.\n\nFORMAT volume [/FS:file-system] [/V:label] [/Q]\n\n  volume          Specifies the drive letter (followed by a colon).\n  /FS:filesystem  Specifies the type of the file system (FAT32, exFAT, NTFS).\n  /V:label        Specifies the volume label.\n  /Q              Performs a quick format.",
  ipconfig: "USAGE:\n    ipconfig [/allcompartments] [/? | /all |\n                                 /renew [adapter] | /release [adapter] |\n                                 /flushdns | /displaydns ]\n\n    /all         Display full configuration information.\n    /release     Release the IPv4 address for the specified adapter.\n    /renew       Renew the IPv4 address for the specified adapter.\n    /flushdns    Purges the DNS Resolver cache.",
  ping: "Usage: ping [-t] [-n count] target_name\n\nOptions:\n    -t             Ping the specified host until stopped.\n    -n count       Number of echo requests to send.",
  net: "The syntax of this command is:\n\nNET\n    [ ACCOUNTS | COMPUTER | CONFIG | CONTINUE | FILE | GROUP | HELP |\n      HELPMSG | LOCALGROUP | PAUSE | SESSION | SHARE | START |\n      STATISTICS | STOP | TIME | USE | USER | VIEW ]",
  gpupdate: "Updates Group Policy settings.\n\nGPUPDATE [/Target:{Computer | User}] [/Force] [/Wait:<value>]\n\n    /Force    Reapplies all policy settings. By default, only policy\n              settings that have changed are applied.",
  gpresult: "GPRESULT [/S system [/U username [/P [password]]]] [/SCOPE scope]\n         [/USER targetusername] [/R | /V | /Z] [(/X | /H) <filename> [/F]]\n\n    /R    Displays RSoP summary data.",
  md: "Creates a directory.\n\nMKDIR [drive:]path\nMD [drive:]path",
  rd: "Removes (deletes) a directory.\n\nRMDIR [/S] [/Q] [drive:]path\nRD [/S] [/Q] [drive:]path\n\n    /S      Removes all directories and files in the specified directory\n            in addition to the directory itself.",
  del: "Deletes one or more files.\n\nDEL [/P] [/F] [/S] [/Q] names\n\n  /F            Force deleting of read-only files.\n  /Q            Quiet mode, do not ask if ok to delete on global wildcard",
  copy: "Copies one or more files to another location.\n\nCOPY [/V] [/Y | /-Y] source [destination]\n\n  /V           Verifies that new files are written correctly.\n  /Y           Suppresses prompting to confirm you want to overwrite an\n               existing destination file.",
  xcopy: "Copies files and directory trees.\n\nXCOPY source [destination] [/S] [/E] [/Y]",
  robocopy: "-------------------------------------------------------------------------------\n   ROBOCOPY     ::     Robust File Copy for Windows\n-------------------------------------------------------------------------------\n\n              Usage :: ROBOCOPY source destination [file [file]...] [options]\n\n             source :: Source Directory (drive:\\path or \\\\server\\share\\path).\n        destination :: Destination Dir  (drive:\\path or \\\\server\\share\\path)."
};
USAGE.chdir = USAGE.cd; USAGE.mkdir = USAGE.md; USAGE.rmdir = USAGE.rd; USAGE.erase = USAGE.del;

/* The GUI tools that can be launched from a prompt. The runner decides
   whether this job has that window; the shell only reports the request. */
export const LAUNCH = {
  "taskmgr": "taskmgr", "taskmgr.exe": "taskmgr",
  "diskmgmt.msc": "diskmgmt", "diskmgmt": "diskmgmt",
  "eventvwr.msc": "eventvwr", "eventvwr": "eventvwr", "eventvwr.exe": "eventvwr",
  "taskschd.msc": "taskschd", "devmgmt.msc": "devmgmt", "certmgr.msc": "certmgr",
  "lusrmgr.msc": "lusrmgr", "perfmon.msc": "perfmon", "perfmon": "perfmon", "gpedit.msc": "gpedit",
  "msinfo32": "msinfo32", "msinfo32.exe": "msinfo32", "resmon": "resmon", "resmon.exe": "resmon",
  "msconfig": "msconfig", "msconfig.exe": "msconfig", "cleanmgr": "cleanmgr", "cleanmgr.exe": "cleanmgr",
  "dfrgui": "dfrgui", "dfrgui.exe": "dfrgui", "regedit": "regedit", "regedit.exe": "regedit",
  "services.msc": "services", "compmgmt.msc": "compmgmt", "notepad": "notepad", "notepad.exe": "notepad"
};

/* Programs PowerShell runs exactly as cmd would, because they are .exe
   files rather than cmdlets. */
const NATIVE = ["dir", "cd", "chdir", "md", "mkdir", "hostname", "whoami", "winver", "tasklist", "taskkill", "sfc", "dism", "dism.exe", "chkdsk",
  "shutdown", "diskpart", "format", "ipconfig", "ping", "pathping", "tracert", "nslookup", "netstat", "net", "gpupdate", "gpresult", "robocopy", "xcopy", "regsvr32", "copy", "del", "rd", "rmdir", "runas"];

function pad(s, n) { s = String(s); return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length); }
function lpad(s, n) { s = String(s); return s.length >= n ? s : " ".repeat(n - s.length) + s; }
function commas(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

/* Split a command line the way cmd.exe does for our purposes: words,
   with "double quoted" runs kept together. */
export function tokens(line) {
  const out = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { q = !q; continue; }
    if (!q && /\s/.test(c)) { if (cur) { out.push(cur); cur = ""; } continue; }
    cur += c;
  }
  if (cur) out.push(cur);
  return out;
}

/* ---------------------------------------------------------------------
   createShell(machine, { elevated })

   One console window. Elevation is fixed for the life of the window, as
   it is in Windows: a standard prompt cannot be promoted, you open
   another one with "Run as administrator".
   --------------------------------------------------------------------- */
export function createShell(m, opts) {
  opts = opts || {};
  const sh = {
    elevated: !!opts.elevated,
    cwd: opts.elevated ? "C:\\Windows\\System32" : "C:\\Users\\" + m.user,
    mode: "cmd",          /* cmd | diskpart | ps | yn */
    dp: { disk: null },
    pendingYN: null,      /* the question chkdsk asked */
    history: []
  };

  sh.title = function () {
    const base = sh.mode === "ps" ? "Windows PowerShell" : "Command Prompt";
    return (sh.elevated ? "Administrator: " : "") + (sh.mode === "diskpart" ? "DiskPart" : base);
  };

  sh.prompt = function () {
    if (sh.mode === "diskpart") return "DISKPART>";
    if (sh.mode === "yn") return "";
    if (sh.mode === "ps") return "PS " + sh.cwd + ">";
    return sh.cwd + ">";
  };

  sh.banner = function () {
    return "Microsoft Windows [Version " + m.build + "]\n(c) Microsoft Corporation. All rights reserved.";
  };

  /* Returns { out, kind, open?, power?, effect? }. */
  sh.run = function (raw) {
    const line = String(raw || "").trim();
    if (line) sh.history.push(line);
    if (m.power !== "on" || m.crashed) return { out: "", kind: "error" };
    if (sh.mode === "yn") return answerYN(line);
    if (sh.mode === "diskpart") return diskpart(line);
    if (!line) return { out: "", kind: "look" };
    /* pipes: the two the sims use, sort and findstr */
    if (/\|/.test(line) && sh.mode === "cmd") {
      const parts = line.split("|").map(function (x) { return x.trim(); });
      let r = sh.run.call(null, parts[0]);
      sh.history.pop();
      for (let k = 1; k < parts.length; k++) {
        const q = tokens(parts[k]); const v = (q[0] || "").toLowerCase();
        const rows = String(r.out || "").split("\n");
        if (v === "sort") { const body = rows.filter(function (x) { return x.trim() && !/^=+|^Image Name/.test(x); }).sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); }); const head = rows.filter(function (x) { return /^=+|^Image Name/.test(x); }); r = { out: head.concat(body).join("\n"), kind: r.kind }; }
        else if (v === "findstr" || v === "find") { const pat = (q.slice(1).filter(function (x) { return x[0] !== "/"; })[0] || "").toLowerCase(); r = { out: rows.filter(function (x) { return x.toLowerCase().indexOf(pat) >= 0; }).join("\n"), kind: r.kind }; }
        else r = { out: NOT_RECOGNIZED(q[0] || ""), kind: "error" };
      }
      return r;
    }
    const t = tokens(line);
    const w0 = t[0].toLowerCase();
    const rest = t.slice(1);
    const low = rest.map(function (x) { return x.toLowerCase(); });

    if (sh.mode === "ps") return powershell(t, line);

    /* `x /?` and `help x` — never a guess */
    if (low[0] === "/?" || (w0 === "help" && rest.length)) {
      const k = w0 === "help" ? low[0] : w0;
      if (USAGE[k]) return { out: USAGE[k], kind: "help" };
      if (w0 === "help") return { out: "This command is not supported by the help utility.  Try \"" + k + " /?\".", kind: "help" };
    }
    if (w0 === "help") {
      return { kind: "help", out: "For more information on a specific command, type HELP command-name\n" +
        HELP_LIST.map(function (h) { return pad(h[0], 15) + h[1]; }).join("\n") +
        "\n\nThis PC also opens: taskmgr, diskmgmt.msc, eventvwr.msc — and PowerShell, with 'powershell'." };
    }
    /* drive change: C: */
    if (/^[a-z]:$/.test(w0)) {
      const L = w0[0].toUpperCase();
      if (!M.usedLetters(m).concat(["C"]).includes(L) || L === "D") return { out: "The device is not ready.", kind: "error" };
      sh.cwd = L + ":\\"; return { out: "", kind: "look" };
    }
    if (LAUNCH[w0]) return { out: "", kind: "look", open: LAUNCH[w0] };

    switch (w0) {
      case "cls": return { out: "", kind: "look", clear: true };
      case "exit": return { out: "", kind: "look", close: true };
      case "hostname": return { out: m.host, kind: "look" };
      case "ver": return { out: "\nMicrosoft Windows [Version " + m.build + "]", kind: "look" };
      case "winver": return { out: "", kind: "look", open: "winver" };
      case "whoami": return whoami(low);
      case "cd": case "chdir": return cd(rest);
      case "dir": return dir(rest);
      case "md": case "mkdir": return mkdir(rest);
      case "rd": case "rmdir": return rmdir(rest);
      case "del": case "erase": return del(rest);
      case "copy": case "xcopy": case "robocopy": return copyish(w0, rest);
      case "tasklist": return tasklist(low);
      case "taskkill": return taskkill(rest, low);
      case "sfc": return sfc(low);
      case "dism": case "dism.exe": return dism(low);
      case "chkdsk": return chkdsk(low);
      case "shutdown": return shutdown(low.map(function (x) { return x.replace(/^-/, "/"); }));
      case "echo": return echo(rest);
      case "set": return setVar(rest);
      case "setx": return setx(rest, low);
      case "start": return launch(rest.filter(function (x) { return x !== '""'; })[0] || "");
      case "diskpart": return enterDiskpart();
      case "format": return format(rest, low);
      case "ipconfig": return ipconfig(low);
      case "ping": return ping(rest);
      case "pathping": case "tracert": return trace(w0, rest);
      case "nslookup": return nslookup(rest);
      case "netstat": return { kind: "look", out: "\nActive Connections\n\n  Proto  Local Address          Foreign Address        State\n  TCP    192.168.1.24:50412     20.190.160.20:443      ESTABLISHED\n  TCP    192.168.1.24:50418     13.107.42.14:443       ESTABLISHED" };
      case "net": return net(low);
      case "gpupdate": return gpupdate(low);
      case "gpresult": return gpresult(low);
      case "bootrec":
        /* It really is not there. bootrec lives in the Windows Recovery
           Environment, not in a running Windows, and a student who meets
           that here will not be surprised by it on a dead machine. */
        return { out: NOT_RECOGNIZED(t[0]) + "\n\n(bootrec only exists inside the Windows Recovery Environment, which you reach when Windows cannot start. It is not part of a running Windows.)", kind: "error" };
      case "powershell": case "powershell.exe":
        /* `powershell <command>` runs that one command and comes back to
           cmd; plain `powershell` stays in PowerShell. */
        if (rest.length) {
          const inner = line.replace(/^\S+\s+/, "").replace(/^-command\s+/i, "").replace(/^"(.*)"$/, "$1");
          sh.mode = "ps"; let r;
          try { r = powershell(tokens(inner), inner); } finally { sh.mode = "cmd"; }
          return r;
        }
        sh.mode = "ps";
        return { out: "Windows PowerShell\nCopyright (C) Microsoft Corporation. All rights reserved.", kind: "look" };
      case "regsvr32": return regsvr32(rest);
      case "runas": return runas(rest);
      case "netsh": return netsh(rest, low);
      default:
        if (/mpam-fe\.exe$/i.test(w0)) {
          if (!sh.elevated) return { out: "Access is denied. The definitions package must be run as an administrator.", kind: "refused" };
          const r = MW.updateDefs(m, /^e:/i.test(w0) || /^e:/i.test(sh.cwd) ? "usb" : "none");
          return { out: r.ok ? "Microsoft Defender Antivirus: " + r.text : r.text, kind: r.ok ? "change" : "error", mw: { type: "av", op: "defs", how: "usb", res: r } };
        }
        if (/^\\\\/.test(w0) && /(vcredist|vc_redist)/i.test(w0)) return runInstaller(t[0], low);
        if (M.appByName(m, w0.replace(/^.*\\/, "")) || /\.exe$/i.test(w0) && M.appByName(m, w0.replace(/^.*\\/, ""))) return launch(t[0]);
        if (/^(get|set|stop|start|restart|test|new|remove)-/.test(w0)) {
          return { out: NOT_RECOGNIZED(t[0]) + "\n\n(That is a PowerShell command. Type powershell first, or open Windows PowerShell.)", kind: "error" };
        }
        return { out: NOT_RECOGNIZED(t[0]), kind: "error" };
    }
  };

  /* -------------------- helpers per command -------------------- */

  /* Running a runtime installer from the file server's Software share —
     the Tier 2 way to put back a Visual C++ runtime. */
  const INSTALLERS = { "vcredist_x86_2010.exe": "vc2010x86", "vcredist_x86_2013.exe": "vc2013x86", "vc_redist.x86.exe": "vc2015x86", "vc_redist.x64.exe": "vc2015x64" };
  function runInstaller(path, low) {
    const loc = locate(path.slice(0, path.lastIndexOf("\\")));
    const name = path.slice(path.lastIndexOf("\\") + 1).toLowerCase();
    if (loc.err || !M.findFile(loc.m, loc.path, name)) return { out: "The system cannot find the path specified.", kind: "error" };
    if (!sh.elevated) { M.note(m, "install-refused", { name: name }); return { out: "Setup needs an administrator. The installation was cancelled.\n\n(Run this from an elevated prompt.)", kind: "refused" }; }
    const r = M.installRuntime(m, INSTALLERS[name], "installer");
    return { out: r.text + (low.indexOf("/q") >= 0 || low.indexOf("/quiet") >= 0 ? "" : "\n\nSetup completed. Exit code 0."), kind: "change" };
  }
  function launch(name) {
    const a = M.appByName(m, String(name).replace(/^.*\\/, ""));
    if (!a) return { out: "The system cannot find the file " + name + ".", kind: "error" };
    return { out: "", kind: "look", launch: a.name };
  }
  function echo(rest) {
    const s0 = rest.join(" ");
    return { out: s0.replace(/%path%/ig, m.env.PATH).replace(/%username%/ig, m.user).replace(/%computername%/ig, m.host), kind: "look" };
  }
  function setVar(rest) {
    if (!rest.length) return { out: "COMPUTERNAME=" + m.host + "\nPath=" + m.env.PATH + "\nUSERNAME=" + m.user + "\nwindir=C:\\Windows", kind: "look" };
    if (/^path$/i.test(rest[0])) return { out: "Path=" + m.env.PATH, kind: "look" };
    return { out: "Environment variable " + rest[0] + " not defined", kind: "look" };
  }
  function setx(rest, low) {
    const args = rest.filter(function (x) { return x[0] !== "/"; });
    if (args.length < 2) return { out: "ERROR: Invalid syntax.\nType \"SETX /?\" for usage.", kind: "error" };
    const machineWide = low.indexOf("/m") >= 0;
    if (machineWide && !sh.elevated) return { out: "ERROR: Access to the registry path is denied.", kind: "refused" };
    if (/^path$/i.test(args[0])) {
      const val = args.slice(1).join(" ").replace(/%path%/ig, m.env.PATH);
      m.env.PATH = val;
      M.note(m, "setx", { name: "PATH", value: val, machine: machineWide });
    } else M.note(m, "setx", { name: args[0] });
    return { out: "\nSUCCESS: Specified value was saved.", kind: "change" };
  }
  function whoami(low) {
    const who = (m.host + "\\" + m.user).toLowerCase();
    if (low[0] === "/groups") {
      return { kind: "look", out: "\nGROUP INFORMATION\n-----------------\n\nGroup Name                             Type             Attributes\n====================================== ================ ==========================\nEveryone                               Well-known group Mandatory group, Enabled\n" +
        (m.userIsAdmin ? "BUILTIN\\Administrators                 Alias            " + (sh.elevated ? "Enabled group, Group owner" : "Group used for deny only") + "\n" : "") +
        "BUILTIN\\Users                          Alias            Mandatory group, Enabled\n" +
        "Mandatory Label\\" + (sh.elevated ? "High" : "Medium") + " Mandatory Level     Label" };
    }
    return { out: sh.elevatedAs ? (m.host + "\\" + sh.elevatedAs).toLowerCase() : who, kind: "look" };
  }

  /* \\HOST\C$\path reaches another PC on the office network, through the
     fleet the shell was given. Returns [machine, path on that machine]. */
  function locate(p) {
    const sharePath = String(p || "").replace(/\//g, "\\");
    const sm = sharePath.match(/^\\\\([^\\]+)\\software(\\.*)?$/i);
    if (sm) {
      const srv = opts.fleet ? opts.fleet(sm[1]) : null;
      if (!srv || !srv.fs["c:\\software"]) return { err: "The network name cannot be found." };
      return { m: srv, path: "C:\\Software" + (sm[2] || ""), shown: "\\\\" + srv.host + "\\Software" + (sm[2] || "") };
    }
    const u = sharePath.match(/^\\\\([^\\]+)\\([a-z])\$(\\.*)?$/i);
    if (u) {
      const other = opts.fleet ? opts.fleet(u[1]) : null;
      if (!other) return { err: "The network path was not found." };
      if (other.power !== "on" || (other.net && other.net.cable === false)) return { err: "The network path was not found." };
      return { m: other, path: (u[2].toUpperCase() + ":" + (u[3] || "\\")), shown: "\\\\" + other.host + "\\" + u[2].toUpperCase() + "$" + (u[3] || "") };
    }
    return { m: m, path: resolve(p) };
  }
  function resolve(p) {
    if (!p) return sh.cwd;
    p = p.replace(/\//g, "\\");
    let base = /^[a-z]:\\/i.test(p) ? p : (sh.cwd.replace(/\\$/, "") + "\\" + p);
    if (/^[a-z]:$/i.test(p)) base = p + "\\";
    const parts = base.split("\\").filter(function (x, i) { return x !== "" || i === 0; });
    const out = [];
    parts.forEach(function (seg) {
      if (seg === ".") return;
      if (seg === "..") { if (out.length > 1) out.pop(); return; }
      out.push(seg);
    });
    let r = out.join("\\");
    if (/^[a-z]:$/i.test(r)) r += "\\";
    return r[0].toUpperCase() + r.slice(1);
  }
  function node(p) { return m.fs[p.toLowerCase()] || null; }
  sh.resolve = resolve;

  function cd(rest) {
    if (!rest.length) return { out: sh.cwd, kind: "look" };
    const target = rest.filter(function (x) { return x.toLowerCase() !== "/d"; }).join(" ");
    const r = resolve(target);
    const n = node(r);
    if (!n) return { out: "The system cannot find the path specified.", kind: "error" };
    sh.cwd = n.path;
    return { out: "", kind: "look" };
  }

  function locateDir(t) { const l = locate(t.replace(/"/g, "")); if (l.err) return false; return !!(l.m.fs[String(l.path).replace(/\\$/, "").toLowerCase()] || l.m.fs[String(l.path).toLowerCase()]); }
  function dir(rest) {
    const args = rest.filter(function (x) { return x[0] !== "/"; });
    let target = args.join(" "), pat = null;
    if (/[*?]/.test(target)) { const cut = target.lastIndexOf("\\"); pat = target.slice(cut + 1); target = cut >= 0 ? target.slice(0, cut) : ""; }
    else if (target && !locateDir(target)) {
      /* dir C:\some\folder\file.dll lists that one file, as Windows does */
      const cut = target.replace(/"/g, "").lastIndexOf("\\");
      if (cut >= 0) { pat = target.replace(/"/g, "").slice(cut + 1); target = target.replace(/"/g, "").slice(0, cut); }
    }
    const loc = locate(target || sh.cwd); if (loc.err) return { out: loc.err, kind: "look" };
    const r = loc.path;
    const n = loc.m.fs[String(r).replace(/\\$/, "").toLowerCase()] || loc.m.fs[String(r).toLowerCase()];
    if (n && pat) {
      const re = new RegExp("^" + pat.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i");
      const files = n.files.filter(function (f) { return re.test(f.name); });
      if (!files.length) return { out: " Directory of " + n.path + "\n\nFile Not Found", kind: "look" };
      return { kind: "look", out: " Volume in drive " + n.path[0] + " has no label.\n\n Directory of " + n.path + "\n\n" + files.map(function (f) { return "03/03/2025  10:20 AM " + lpad(commas(f.size), 17) + " " + f.name; }).join("\n") + "\n" + lpad(files.length, 16) + " File(s)" };
    }
    if (!n) return { out: "File Not Found", kind: "look" };
    const L = n.path[0];
    const lines = [" Volume in drive " + L + " has no label.", " Volume Serial Number is 6E2A-91C4", "", " Directory of " + n.path, ""];
    const stamp = "09/30/2026  08:14 AM";
    if (n.path.length > 3) { lines.push(stamp + "    <DIR>          ."); lines.push(stamp + "    <DIR>          .."); }
    n.dirs.forEach(function (d) { lines.push(stamp + "    <DIR>          " + d); });
    let total = 0;
    n.files.forEach(function (f) { total += f.size; lines.push(stamp + " " + lpad(commas(f.size), 17) + " " + f.name); });
    lines.push(lpad(n.files.length, 16) + " File(s) " + lpad(commas(total), 14) + " bytes");
    lines.push(lpad(n.dirs.length + (n.path.length > 3 ? 2 : 0), 16) + " Dir(s)  " + lpad(commas(freeOn(L)), 14) + " bytes free");
    return { out: lines.join("\n"), kind: "look" };
  }
  function freeOn(L) {
    let free = 0;
    m.disks.forEach(function (d) { d.parts.forEach(function (p) { if (p.letter === L) free = p.bytes * (p.kind === "os" ? 0.38 : 0.99); }); });
    return free;
  }

  function mkdir(rest) {
    if (!rest.length) return { out: "The syntax of the command is incorrect.", kind: "error" };
    const r = resolve(rest.join(" "));
    if (node(r)) return { out: "A subdirectory or file " + rest.join(" ") + " already exists.", kind: "error" };
    const parent = node(r.slice(0, r.lastIndexOf("\\")) || r.slice(0, 3));
    if (!parent) return { out: "The system cannot find the path specified.", kind: "error" };
    if (!sh.elevated && /^c:\\(windows|program files)/i.test(r)) return { out: "Access is denied.", kind: "refused" };
    const name = r.slice(r.lastIndexOf("\\") + 1);
    parent.dirs.push(name); m.fs[r.toLowerCase()] = { path: r, dirs: [], files: [] };
    M.note(m, "mkdir", { path: r });
    return { out: "", kind: "change" };
  }
  function rmdir(rest) {
    const args = rest.filter(function (x) { return x[0] !== "/"; });
    const r = resolve(args.join(" "));
    const n = node(r);
    if (!n) return { out: "The system cannot find the file specified.", kind: "error" };
    if (/^c:\\(windows|program files|users)$/i.test(r) || /^c:\\windows\\/i.test(r)) return { out: "Access is denied.", kind: "refused" };
    if ((n.dirs.length || n.files.length) && !rest.some(function (x) { return x.toLowerCase() === "/s"; })) return { out: "The directory is not empty.", kind: "error" };
    const pp = r.slice(0, r.lastIndexOf("\\")); const parent = node(pp.length === 2 ? pp + "\\" : pp);
    if (parent) parent.dirs = parent.dirs.filter(function (d) { return d.toLowerCase() !== r.slice(r.lastIndexOf("\\") + 1).toLowerCase(); });
    delete m.fs[r.toLowerCase()];
    M.note(m, "rmdir", { path: r });
    return { out: "", kind: "change" };
  }
  function del(rest) {
    const args = rest.filter(function (x) { return x[0] !== "/"; });
    if (!args.length) return { out: "The syntax of the command is incorrect.", kind: "error" };
    const r = resolve(args.join(" "));
    const dirp = r.slice(0, r.lastIndexOf("\\")); const n = node(dirp.length === 2 ? dirp + "\\" : dirp);
    const name = r.slice(r.lastIndexOf("\\") + 1).toLowerCase();
    if (!n || !n.files.some(function (f) { return f.name.toLowerCase() === name; })) return { out: "Could Not Find " + r, kind: "error" };
    if (/^c:\\(windows|program files)/i.test(r) && !sh.elevated) return { out: r + "\nAccess is denied.", kind: "refused" };
    /* a program that is running can't be deleted from under itself */
    if (m.procs.some(function (p) { return (p.image || "").toLowerCase() === r.toLowerCase(); })) return { out: r + "\nThe process cannot access the file because it is being used by another process.", kind: "refused", inUse: name };
    n.files = n.files.filter(function (f) { return f.name.toLowerCase() !== name; });
    M.note(m, "del", { path: r });
    return { out: "", kind: "change" };
  }
  function copyish(w0, rest) {
    const args = rest.filter(function (x) { return x[0] !== "/"; });
    if (w0 === "robocopy") {
      /* robocopy SOURCE_DIR DEST_DIR FILE */
      if (args.length < 3) return { out: USAGE.robocopy, kind: args.length ? "error" : "help" };
      return copyOne(locate(args[0]), args[2], locate(args[1]), w0);
    }
    if (args.length < 2) return { out: "The syntax of the command is incorrect.", kind: "error" };
    const src = locate(args[0]); if (src.err) return { out: src.err, kind: "error" };
    const cut = src.path.lastIndexOf("\\");
    return copyOne({ m: src.m, path: src.path.slice(0, cut) || src.path, shown: src.shown ? src.shown.slice(0, src.shown.lastIndexOf("\\")) : null }, src.path.slice(cut + 1), locate(args[1]), w0);
  }
  function copyOne(from, name, to, w0) {
    const fail = function (msg) { return { out: w0 === "robocopy" ? "\n-------------------------------------------------------------------------------\n   ROBOCOPY     ::     Robust File Copy for Windows\n-------------------------------------------------------------------------------\n\nERROR 2 (0x00000002) Accessing Source File " + (from.path || "") + "\\" + name + "\nThe system cannot find the file specified." : msg + "\n        0 file(s) copied.", kind: "error" }; };
    if (from.err) return fail(from.err);
    if (to.err) return fail(to.err);
    const sdir = from.m.fs[String(from.path).replace(/\\$/, "").toLowerCase()] || from.m.fs[String(from.path).toLowerCase()];
    const f = sdir && sdir.files.filter(function (x) { return x.name.toLowerCase() === String(name).toLowerCase(); })[0];
    if (!f) return fail("The system cannot find the file specified.");
    const dkey = String(to.path).replace(/\\$/, "").toLowerCase();
    const dn = to.m.fs[dkey] || to.m.fs[String(to.path).toLowerCase()];
    if (!dn) return fail("The system cannot find the path specified.");
    if (/^c:\\(windows|program files)/i.test(to.path) && !sh.elevated && to.m === m) return { out: "Access is denied.\n        0 file(s) copied.", kind: "refused" };
    dn.files = dn.files.filter(function (x) { return x.name.toLowerCase() !== f.name.toLowerCase(); }).concat([Object.assign({}, f)]);
    M.note(to.m, "copy", { from: from.path + "\\" + f.name, to: dn.path, name: f.name, bits: f.bits || null, fromHost: from.m.host });
    if (w0 === "robocopy") return { kind: "change", out: "\n-------------------------------------------------------------------------------\n   ROBOCOPY     ::     Robust File Copy for Windows\n-------------------------------------------------------------------------------\n\n  Source : " + (from.shown || from.path).replace(/\\$/, "") + "\\\n    Dest : " + (to.shown || dn.path).replace(/\\$/, "") + "\\\n\n   Files : " + f.name + "\n\n------------------------------------------------------------------------------\n\n               Total    Copied   Skipped  Mismatch    FAILED    Extras\n    Files :         1         1         0         0         0         0\n\n   Ended : " + m.clock };
    return { out: "        1 file(s) copied.", kind: "change" };
  }

  function tasklist(low) {
    const ps = M.running(m);
    const head = "\nImage Name                     PID Session Name        Session#    Mem Usage\n========================= ======== ================ =========== ============";
    const rows = ps.map(function (p) {
      const sess = /SYSTEM|SERVICE/.test(p.user) || p.pid < 900 ? "Services" : "Console";
      return pad(p.name, 25) + " " + lpad(p.pid, 8) + " " + pad(sess, 16) + " " + lpad(sess === "Services" ? 0 : 1, 11) + " " + lpad(commas(p.mem * 1024) + " K", 12);
    });
    if (low.indexOf("/svc") >= 0) {
      return { kind: "look", out: "\nImage Name                     PID Services\n========================= ======== ============================================\n" +
        ps.map(function (p) { return pad(p.name, 25) + " " + lpad(p.pid, 8) + " " + (p.hosts || "N/A"); }).join("\n") };
    }
    return { out: head + "\n" + rows.join("\n"), kind: "look" };
  }

  function taskkill(rest, low) {
    const force = low.indexOf("/f") >= 0;
    let targets = [];
    const pi = low.indexOf("/pid"), ii = low.indexOf("/im");
    if (pi >= 0 && rest[pi + 1]) targets = m.procs.filter(function (p) { return String(p.pid) === rest[pi + 1]; });
    else if (ii >= 0 && rest[ii + 1]) targets = m.procs.filter(function (p) { return p.name.toLowerCase() === rest[ii + 1].toLowerCase(); });
    else return { out: "ERROR: Invalid syntax. Neither /FI nor /PID nor /IM were specified.\nType \"TASKKILL /?\" for usage.", kind: "error" };
    if (!targets.length) {
      return { out: pi >= 0 ? "ERROR: The process \"" + rest[pi + 1] + "\" not found." : "ERROR: The process \"" + rest[ii + 1] + "\" not found.", kind: "error" };
    }
    const lines = []; let kind = "change", mw = null;
    targets.forEach(function (p) {
      const owned = p.user === m.user;
      if (p.critical || p.protected || (!owned && !sh.elevated)) {
        lines.push("ERROR: The process \"" + p.name + "\" with PID " + p.pid + " could not be terminated.\nReason: Access is denied.");
        M.note(m, "end-denied", { name: p.name, via: "taskkill" });
        kind = "refused"; return;
      }
      const r = M.endProcess(m, p.pid, "taskkill");
      const back = r.ok ? MW.afterEnd(m, p) : null; if (back) lines.push(back);
      if (r.ok) mw = { type: "tm-end", name: p.name, tag: p.tag || null, res: { ok: true, respawned: !!back } };
      if (back) return;
      else if (r.ok) lines.push(force || !p.window
        ? "SUCCESS: The process \"" + p.name + "\" with PID " + p.pid + " has been terminated."
        : "SUCCESS: Sent termination signal to the process \"" + p.name + "\" with PID " + p.pid + ".");
    });
    return { out: lines.join("\n"), kind: kind, mw: mw };
  }

  /* netsh interface set interface "Ethernet" disable|enable */
  function netsh(rest, low) {
    const joined = low.join(" ");
    if (!/interface\s+set\s+interface/.test(joined)) return { out: "The following command was not found: " + rest.join(" ") + ".", kind: "error" };
    if (!sh.elevated) return { out: "The requested operation requires elevation (Run as administrator).", kind: "refused" };
    const on = /\benable(d)?\b/.test(joined), off = /\bdisable(d)?\b/.test(joined);
    if (!on && !off) return { out: "The syntax supplied for this command is not valid. Check help for the correct syntax.", kind: "error" };
    MW.setAdapter(m, on); return { out: "", kind: "change", netChange: true, mw: { type: "net", op: on ? "on" : "off", how: "adapter" } };
  }
  function needAdmin(tool) {
    if (tool === "sfc") return "You must be an administrator running a console session in order to\nuse the sfc utility.";
    if (tool === "dism") return "\nDeployment Image Servicing and Management tool\nVersion: 10.0.22621.2792\n\n\nError: 740\n\nElevated permissions are required to run DISM.\nUse an elevated command prompt to complete these tasks.";
    return "Access Denied as you do not have sufficient privileges or\nthe disk may be locked by another process.\nYou have to invoke this utility running in elevated mode\nand make sure the disk is unlocked.";
  }

  const VERIFY = "\nBeginning system scan.  This process will take some time.\n\nBeginning verification phase of system scan.\nVerification 100% complete.\n\n";
  const CBS = "For online repairs, details are included in the CBS log file located at\nwindir\\Logs\\CBS\\CBS.log. For example C:\\Windows\\Logs\\CBS\\CBS.log. For offline\nrepairs, details are included in the log file provided by the /OFFLOGFILE flag.";

  function sfc(low) {
    const verb = low[0];
    if (verb !== "/scannow" && verb !== "/verifyonly") return { out: USAGE.sfc, kind: verb ? "error" : "help" };
    if (!sh.elevated) { M.note(m, "sfc", { refused: true }); return { out: needAdmin("sfc"), kind: "refused" }; }
    const s = m.sys;
    if (s.pendingRepair) { M.note(m, "sfc", { result: "pending" }); return { out: "\nThere is a system repair pending which requires reboot to complete.\nRestart Windows and run sfc again.", kind: "change" }; }
    if (s.fsErrors) { M.note(m, "sfc", { result: "fs" }); return { out: VERIFY.replace("Verification 100% complete.", "Verification 38% complete.") + "Windows Resource Protection could not perform the requested operation.", kind: "change" }; }
    if (!s.corrupt) { M.note(m, "sfc", { result: "clean" }); return { out: VERIFY + "Windows Resource Protection did not find any integrity violations.", kind: "change" }; }
    if (verb === "/verifyonly") { M.note(m, "sfc", { result: "found" }); return { out: VERIFY + "Windows Resource Protection found integrity violations.\n" + CBS, kind: "change" }; }
    if (s.storeCorrupt) { M.note(m, "sfc", { result: "unfixable" }); return { out: VERIFY + "Windows Resource Protection found corrupt files but was unable to fix some\nof them.\n" + CBS, kind: "change" }; }
    const n = s.corrupt; s.corrupt = 0; s.symptoms = [];
    M.note(m, "sfc", { result: "repaired", files: n });
    return { out: VERIFY + "Windows Resource Protection found corrupt files and successfully repaired\nthem.\n" + CBS, kind: "change" };
  }

  function dism(low) {
    const has = function (x) { return low.indexOf(x) >= 0; };
    if (!low.length) return { out: USAGE.dism, kind: "help" };
    if (!sh.elevated) { M.note(m, "dism", { refused: true }); return { out: needAdmin("dism"), kind: "refused" }; }
    const head = "\nDeployment Image Servicing and Management tool\nVersion: 10.0.22621.2792\n\nImage Version: " + m.build + "\n\n";
    if (!has("/online") || !has("/cleanup-image")) {
      return { out: head + "Error: 87\n\nThe option is unknown or incomplete. For more information, refer to the help by running DISM.exe /?.", kind: "error" };
    }
    const s = m.sys;
    const bar = "[==========================100.0%==========================] ";
    if (has("/checkhealth")) {
      M.note(m, "dism", { op: "check" });
      return { out: head + (s.storeCorrupt ? "The component store is repairable." : "No component store corruption detected.") + "\nThe operation completed successfully.", kind: "look" };
    }
    if (has("/scanhealth")) {
      M.note(m, "dism", { op: "scan" });
      return { out: head + bar + (s.storeCorrupt ? "The component store is repairable." : "No component store corruption detected.") + "\nThe operation completed successfully.", kind: "look" };
    }
    if (has("/restorehealth")) {
      if (s.fsErrors) { M.note(m, "dism", { op: "restore", result: "fs" }); return { out: head + "[=====                      10.0%                          ]\n\nError: 1392\n\nThe file or directory is corrupted and unreadable.\n\nThe DISM log file can be found at C:\\Windows\\Logs\\DISM\\dism.log", kind: "change" }; }
      if (s.pendingRepair) { M.note(m, "dism", { op: "restore", result: "pending" }); return { out: head + "\nError: 0x800f082f\n\nDISM failed. No operation was performed.\nA servicing operation is waiting for a restart. Restart Windows and try again.\n\nThe DISM log file can be found at C:\\Windows\\Logs\\DISM\\dism.log", kind: "change" }; }
      const was = s.storeCorrupt; s.storeCorrupt = false;
      M.note(m, "dism", { op: "restore", result: was ? "repaired" : "clean" });
      return { out: head + bar + "\nThe restore operation completed successfully.\nThe operation completed successfully.", kind: "change" };
    }
    return { out: head + "Error: 87\n\nThe cleanup-image option is unknown.\nFor more information, refer to the help by running DISM.exe /?.", kind: "error" };
  }

  function chkdsk(low) {
    const vol = (low.filter(function (x) { return /^[a-z]:$/.test(x); })[0] || sh.cwd.slice(0, 2).toLowerCase()).toUpperCase();
    const fix = low.indexOf("/f") >= 0 || low.indexOf("/r") >= 0;
    if (!sh.elevated) { M.note(m, "chkdsk", { refused: true }); return { out: needAdmin("chkdsk"), kind: "refused" }; }
    const head = "The type of the file system is NTFS.\n";
    if (!fix) {
      M.note(m, "chkdsk", { vol: vol, fix: false });
      const body = "\nWARNING!  /F parameter not specified.\nRunning CHKDSK in read-only mode.\n\nStage 1: Examining basic file system structure ...\n  482816 file records processed.\nStage 2: Examining file name linkage ...\n  610944 index entries processed.\nStage 3: Examining security descriptors ...\n\n";
      if (vol === "C:" && m.sys.fsErrors) return { out: head + body + "Windows has scanned the file system and found problems.\nRun CHKDSK with the /F (fix) option to correct these.", kind: "look" };
      return { out: head + body + "Windows has scanned the file system and found no problems.\nNo further action is required.", kind: "look" };
    }
    if (vol === "C:") {
      sh.mode = "yn";
      sh.pendingYN = "chkdsk";
      return { out: head + "Cannot lock current drive.\n\nChkdsk cannot run because the volume is in use by another\nprocess.  Would you like to schedule this volume to be\nchecked the next time the system restarts? (Y/N) ", kind: "look", ask: true };
    }
    M.note(m, "chkdsk", { vol: vol, fix: true });
    return { out: head + "Volume label is New Volume.\n\nStage 1: Examining basic file system structure ...\nStage 2: Examining file name linkage ...\nStage 3: Examining security descriptors ...\n\nWindows has scanned the file system and found no problems.\nNo further action is required.", kind: "change" };
  }

  function answerYN(line) {
    const a = line.trim().toLowerCase();
    if (sh.pendingYN === "chkdsk") {
      if (a === "y" || a === "yes") {
        sh.mode = "cmd"; sh.pendingYN = null;
        m.sys.chkdskScheduled = true;
        M.note(m, "chkdsk", { vol: "C:", fix: true, scheduled: true });
        return { out: "This volume will be checked the next time the system restarts.", kind: "change" };
      }
      if (a === "n" || a === "no") { sh.mode = "cmd"; sh.pendingYN = null; return { out: "", kind: "look" }; }
      return { out: "(Y/N) ", kind: "error", ask: true };
    }
    if (sh.pendingYN === "gpo") {
      sh.mode = "cmd"; sh.pendingYN = null;
      if (a === "y" || a === "yes") { m.gpoRestart = true; M.note(m, "gpo-restart", {}); return { out: "", kind: "change", power: "restart" }; }
      return { out: "", kind: "look" };
    }
    sh.mode = "cmd"; return { out: "", kind: "look" };
  }

  function shutdown(low) {
    if (!low.length) return { out: USAGE.shutdown, kind: "help" };
    if (low.indexOf("/a") >= 0) return { out: "Unable to abort the system shutdown because no shutdown was in progress.(1116)", kind: "look" };
    if (low.indexOf("/r") >= 0) return { out: "", kind: "change", power: "restart" };
    if (low.indexOf("/s") >= 0 || low.indexOf("/p") >= 0) return { out: "", kind: "change", power: "off" };
    return { out: USAGE.shutdown, kind: "error" };
  }

  function regsvr32(rest) {
    const arg = rest.filter(function (x) { return x[0] !== "/"; })[0] || "";
    if (!arg) return { out: "(RegSvr32) No DLL name specified.\n\nUsage: regsvr32 [/u] [/s] [/n] [/i[:cmdline]] dllname", kind: "error" };
    const p = resolve(arg.indexOf("\\") >= 0 ? arg : arg);
    const dir = p.slice(0, p.lastIndexOf("\\")); const name = p.slice(p.lastIndexOf("\\") + 1);
    const here = M.findFile(m, dir, name) || M.findFile(m, "C:\\Windows\\System32", name);
    M.note(m, "regsvr32", { name: name, found: !!here });
    if (!here) return { out: "(RegSvr32) The module \"" + arg + "\" failed to load.\n\nMake sure the binary is stored at the specified path or debug it to check for problems with the binary or dependent .DLL files.\n\nThe specified module could not be found.", kind: "change" };
    /* The C++ runtime DLLs are not COM servers. They have nothing to
       register, and regsvr32 says so — it is not a repair tool. */
    return { out: "(RegSvr32) The module \"" + arg + "\" was loaded but the entry-point DllRegisterServer was not found.\n\nMake sure that \"" + arg + "\" is a valid DLL or OCX file and then try again.", kind: "change" };
  }


  function runas(rest) {
    return { out: "Enter the password for " + m.host + "\\" + ((rest.filter(function (x) { return /^\/user:/i.test(x); })[0] || "/user:?").slice(6)) + ":\nAttempting to start cmd as user \"" + m.host + "\\Administrator\" ...\nRUNAS ERROR: Unable to run - cmd\n1327: Account restrictions are preventing this user from signing in. For example: blank passwords aren't allowed, sign-in times are limited, or a policy restriction has been enforced.\n\n(The built-in Administrator account is disabled on Windows 11 unless someone turns it on. Use \"Run as administrator\" on Command Prompt instead.)", kind: "refused" };
  }

  function net(low) {
    if (low[0] === "user" && low.length === 1) {
      return { kind: "look", out: "\nUser accounts for \\\\" + m.host + "\n\n-------------------------------------------------------------------------------\nAdministrator            DefaultAccount           Guest\n" + pad(m.techAccount.name, 25) + pad(m.user, 25) + "WDAGUtilityAccount\nThe command completed successfully." };
    }
    if (low[0] === "user" && low[1]) {
      if (low.indexOf("/add") >= 0) {
        if (!sh.elevated) return { out: "System error 5 has occurred.\n\nAccess is denied.", kind: "refused" };
        M.note(m, "net-user-add", { name: low[1] });
        return { out: "The command completed successfully.", kind: "change" };
      }
      const known = [m.user, m.techAccount.name, "administrator", "guest"].map(function (x) { return x.toLowerCase(); });
      if (known.indexOf(low[1]) < 0) return { out: "The user name could not be found.\n\nMore help is available by typing NET HELPMSG 2221.", kind: "error" };
      const isAdmin = low[1] === m.techAccount.name.toLowerCase() || low[1] === "administrator" || (low[1] === m.user.toLowerCase() && m.userIsAdmin);
      return { kind: "look", out: "User name                    " + low[1] + "\nAccount active               " + (low[1] === "administrator" || low[1] === "guest" ? "No" : "Yes") + "\n\nLocal Group Memberships      " + (isAdmin ? "*Administrators       *Users" : "*Users") + "\nThe command completed successfully." };
    }
    if (low[0] === "use") return { kind: "look", out: "New connections will be remembered.\n\nThere are no entries in the list." };
    return { out: USAGE.net, kind: low.length ? "error" : "help" };
  }

  function gpupdate(low) {
    M.note(m, "gpupdate", { force: low.indexOf("/force") >= 0 });
    if (m.gpoPending && low.indexOf("/force") >= 0) {
      sh.mode = "yn"; sh.pendingYN = "gpo";
      return { out: "Updating policy...\n\nUser Policy update has completed successfully.\n\nThe following warnings were encountered during computer policy processing:\n\nThe Software Installation computer policy requires a system restart to apply. Certain Computer policies are enabled that can only run during startup.\n\nOK to restart? (Y/N)", kind: "look", ask: true };
    }
    return { out: "Updating policy...\n\nComputer Policy update has completed successfully.\nUser Policy update has completed successfully.", kind: "change" };
  }
  function gpresult(low) {
    if (low.indexOf("/r") < 0) return { out: USAGE.gpresult, kind: "help" };
    if (m.gpoPending) return { kind: "look", out: "\nRSOP data for RAFIKI\\" + m.user + " on " + m.host + " : Logging Mode\n------------------------------------------------------------------\n\nCOMPUTER SETTINGS\n------------------\n    Last time Group Policy was applied: " + m.clock + "\n\n    Applied Group Policy Objects\n    -----------------------------\n        Default Domain Policy\n\n    The following GPOs were not applied because they were filtered out\n    -------------------------------------------------------------------\n        Rafiki Apps - " + m.gpoPending + "\n            Filtering:  Not Applied (Pending restart: Software Installation applies at startup)\n" };
    return { kind: "look", out: "\nMicrosoft (R) Windows (R) Operating System Group Policy Result tool v2.0\n\nRSOP data for " + m.host + "\\" + m.user + " on " + m.host + " : Logging Mode\n------------------------------------------------------------------\n\nOS Configuration:            Standalone Workstation\nOS Version:                  " + m.build + "\n\nUSER SETTINGS\n--------------\n    Applied Group Policy Objects\n    -----------------------------\n        N/A\n\n    The user is a part of the following security groups\n    ---------------------------------------------------\n        Users\n" + (m.userIsAdmin ? "        Administrators\n" : "") };
  }

  function ipconfig(low) {
    const n = m.net || { ip: "192.168.1.24", mask: "255.255.255.0", gw: "192.168.1.1", dns: "192.168.1.1", mac: "3C-52-82-4A-19-E7", dhcp: "192.168.1.1" };
    const basic = "\nWindows IP Configuration\n\n\nEthernet adapter Ethernet:\n\n   Connection-specific DNS Suffix  . : home\n   Link-local IPv6 Address . . . . . : fe80::8d4c:2a1e:77b0:1c3%12\n   IPv4 Address. . . . . . . . . . . : " + n.ip + "\n   Subnet Mask . . . . . . . . . . . : " + n.mask + "\n   Default Gateway . . . . . . . . . : " + n.gw;
    if (!low.length) return { out: basic, kind: "look" };
    if (low[0] === "/all") return { out: "\nWindows IP Configuration\n\n   Host Name . . . . . . . . . . . . : " + m.host + "\n   Primary Dns Suffix  . . . . . . . :\n   Node Type . . . . . . . . . . . . : Hybrid\n\nEthernet adapter Ethernet:\n\n   Description . . . . . . . . . . . : Intel(R) Ethernet Connection (17) I219-LM\n   Physical Address. . . . . . . . . : " + n.mac + "\n   DHCP Enabled. . . . . . . . . . . : Yes\n   IPv4 Address. . . . . . . . . . . : " + n.ip + "(Preferred)\n   Subnet Mask . . . . . . . . . . . : " + n.mask + "\n   Default Gateway . . . . . . . . . : " + n.gw + "\n   DHCP Server . . . . . . . . . . . : " + n.dhcp + "\n   DNS Servers . . . . . . . . . . . : " + n.dns, kind: "look" };
    if (low[0] === "/flushdns") { M.note(m, "flushdns", {}); return { out: "\nWindows IP Configuration\n\nSuccessfully flushed the DNS Resolver Cache.", kind: "change" }; }
    if (low[0] === "/release") { M.note(m, "release", {}); return { out: "\nWindows IP Configuration\n\nEthernet adapter Ethernet:\n\n   Connection-specific DNS Suffix  . :\n   IPv4 Address. . . . . . . . . . . : 0.0.0.0", kind: "change" }; }
    if (low[0] === "/renew") { M.note(m, "renew", {}); return { out: basic, kind: "change" }; }
    return { out: "Error: unrecognized or incomplete command line.\n\n" + USAGE.ipconfig, kind: "error" };
  }
  function ping(rest) {
    const host = rest.filter(function (x) { return x[0] !== "-" && !/^\d+$/.test(x) || /^\d+\.\d+\.\d+\.\d+$/.test(x); })[0];
    if (!host) return { out: USAGE.ping, kind: "help" };
    const ip = /^\d+\.\d+\.\d+\.\d+$/.test(host) ? host : "142.250.187.206";
    const r = "Reply from " + ip + ": bytes=32 time=14ms TTL=117";
    return { kind: "look", out: "\nPinging " + host + (ip !== host ? " [" + ip + "]" : "") + " with 32 bytes of data:\n" + [r, r, r, r].join("\n") + "\n\nPing statistics for " + ip + ":\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),\nApproximate round trip times in milli-seconds:\n    Minimum = 14ms, Maximum = 14ms, Average = 14ms" };
  }
  function trace(w0, rest) {
    if (!rest.length) return { out: "Usage: " + w0 + " target_name", kind: "help" };
    return { kind: "look", out: "\nTracing route to " + rest[0] + " over a maximum of 30 hops\n\n  1    <1 ms    <1 ms    <1 ms  192.168.1.1\n  2     9 ms     8 ms     9 ms  10.64.0.1\n  3    14 ms    14 ms    13 ms  " + rest[0] + "\n\nTrace complete." };
  }
  function nslookup(rest) {
    if (!rest.length) return { out: "Default Server:  router.home\nAddress:  192.168.1.1\n\n> (type a name to look up; this PC answers one lookup per line — type nslookup name)", kind: "look" };
    return { kind: "look", out: "Server:  router.home\nAddress:  192.168.1.1\n\nNon-authoritative answer:\nName:    " + rest[0] + "\nAddress:  142.250.187.206" };
  }

  function format(rest, low) {
    const vol = low.filter(function (x) { return /^[a-z]:$/.test(x); })[0];
    if (!vol) return { out: "Required parameter missing -\n" + USAGE.format, kind: "error" };
    if (!sh.elevated) return { out: "Access denied as you do not have sufficient privileges.\nYou have to invoke this utility running in elevated mode.", kind: "refused" };
    if (vol === "c:") return { out: "The type of the file system is NTFS.\nFormat cannot run because the volume is in use by another\nprocess.  Format may run if this volume is dismounted first.\nALL OPENED HANDLES TO THIS VOLUME WOULD THEN BE INVALID.", kind: "refused" };
    if (m.formatHook) { const r = m.formatHook(vol.toUpperCase()[0], low, sh); if (r) return r; }
    return { out: "The system cannot find the drive specified.", kind: "error" };
  }

  /* -------------------- DiskPart -------------------- */
  function enterDiskpart() {
    if (!sh.elevated && !m.userIsAdmin) return { out: "The requested operation requires elevation.", kind: "refused" };
    sh.mode = "diskpart"; sh.dp.disk = null;
    const note = sh.elevated ? "" : "(User Account Control asked \"Do you want to allow this app to make changes to your device?\" and you allowed it. DiskPart always runs as administrator.)\n\n";
    return { out: note + "Microsoft DiskPart version 10.0.22621.1\n\nCopyright (C) Microsoft Corporation.\nOn computer: " + m.host, kind: "look" };
  }
  function dpSize(b) {
    const gb = b / M.GiB;
    if (gb >= 10240) return Math.round(gb / 1024) + " TB";
    if (gb >= 1) return Math.round(gb) + " GB";
    return Math.round(b / 1048576) + " MB";
  }
  function dpFree(d) {
    return d.parts.filter(function (p) { return p.kind === "unalloc"; }).reduce(function (a, p) { return a + p.bytes; }, 0);
  }
  function diskpart(line) {
    const t = tokens(line.toLowerCase());
    const v = t[0] || "";
    const sel = sh.dp.disk == null ? null : M.disk(m, sh.dp.disk);
    const noSel = { out: "\nThere is no disk selected.\nPlease select a disk and try again.", kind: "error" };
    if (!v) return { out: "", kind: "look" };
    if (v === "exit") { sh.mode = "cmd"; return { out: "\nLeaving DiskPart...", kind: "look" }; }
    if (v === "help" || v === "/?") return { out: USAGE.diskpart, kind: "help" };
    if (v === "list" && t[1] === "disk") {
      const rows = m.disks.map(function (d) {
        return (sh.dp.disk === d.n ? "* " : "  ") + pad("Disk " + d.n, 10) + pad(d.style ? "Online" : "Online", 15) + lpad(dpSize(d.bytes), 7) + "  " + lpad(dpSize(dpFree(d)).replace(/^0 MB$/, "0 B"), 7) + "        " + (d.style === "GPT" ? "*" : " ");
      });
      return { out: "\n  Disk ###  Status         Size     Free     Dyn  Gpt\n  --------  -------------  -------  -------  ---  ---\n" + rows.join("\n"), kind: "look" };
    }
    if (v === "select" && t[1] === "disk") {
      const n = parseInt(t[2], 10);
      if (!M.disk(m, n)) return { out: "\nThe disk you specified is not valid.\nThere is no disk selected.", kind: "error" };
      sh.dp.disk = n; M.note(m, "dp-select", { n: n });
      return { out: "\nDisk " + n + " is now the selected disk.", kind: "look" };
    }
    if (v === "detail" && t[1] === "disk") {
      if (!sel) return noSel;
      return { out: "\n" + sel.model + "\nDisk ID: {" + (sel.system ? "1C0E4F7A-90D2-4B63-A2B1-6E2A91C4D3F0" : "00000000") + "}\nType   : " + (sel.system ? "NVMe" : "SATA") + "\nStatus : Online\nBoot Disk  : " + (sel.system ? "Yes" : "No") + "\nPartition style : " + (sel.style || "RAW (not initialized)") + "\n\n" + volTable(sel), kind: "look" };
    }
    if (v === "list" && t[1] === "volume") return { out: volTable(null), kind: "look" };
    if (v === "list" && t[1] === "partition") {
      if (!sel) return noSel;
      const ps = sel.parts.filter(function (p) { return p.kind !== "unalloc" && p.kind !== "unreach"; });
      if (!ps.length) return { out: "\nThere are no partitions on this disk to show.", kind: "look" };
      return { out: "\n  Partition ###  Type              Size     Offset\n  -------------  ----------------  -------  -------\n" + ps.map(function (p, i) { return "  Partition " + (i + 1) + "    " + pad({ efi: "System", os: "Primary", recovery: "Recovery", data: "Primary" }[p.kind] || "Primary", 18) + lpad(dpSize(p.bytes), 7) + "  1024 KB"; }).join("\n"), kind: "look" };
    }
    if (v === "clean") {
      if (!sel) return noSel;
      const r = M.cleanDisk(m, sel.n);
      return { out: "\n" + r.say, kind: r.ok ? "change" : "refused" };
    }
    if (v === "convert") {
      if (!sel) return noSel;
      const style = (t[1] || "").toUpperCase();
      if (style !== "GPT" && style !== "MBR") return { out: USAGE.diskpart, kind: "error" };
      const r = sel.style ? M.convertDisk(m, sel.n, style) : M.initDisk(m, sel.n, style);
      return { out: "\n" + (r.ok ? "DiskPart successfully converted the selected disk to " + style + " format." : "Virtual Disk Service error:\n" + r.say), kind: r.ok ? "change" : "error" };
    }
    if (v === "create" && t[1] === "partition") {
      if (!sel) return noSel;
      if (!sel.style) M.initDisk(m, sel.n, "MBR");   /* diskpart initializes a RAW disk as MBR by default — a trap worth meeting */
      const sz = (t.filter(function (x) { return /^size=/.test(x); })[0] || "").slice(5);
      const r = M.newVolume(m, sel.n, { size: sz ? parseInt(sz, 10) * 1048576 : null, fs: "RAW", label: "" });
      if (r.ok) { const p = lastCreated(sel); p.fs = "RAW"; p.label = ""; }
      return { out: "\n" + (r.ok ? "DiskPart succeeded in creating the specified partition." : "Virtual Disk Service error:\n" + r.say), kind: r.ok ? "change" : "error" };
    }
    if (v === "format") {
      if (!sel) return noSel;
      const p = lastCreated(sel);
      if (!p) return { out: "\nThere is no volume selected.\nPlease select a volume and try again.", kind: "error" };
      const fs = ((t.filter(function (x) { return /^fs=/.test(x); })[0] || "fs=ntfs").slice(3)).toUpperCase();
      const want = fs === "EXFAT" ? "exFAT" : fs;
      if (["NTFS", "exFAT", "FAT32"].indexOf(want) < 0) return { out: "\nThe arguments specified for this command are not valid.", kind: "error" };
      if (want === "FAT32" && p.bytes > M.FAT32_FORMAT_LIMIT) return { out: "\n  0 percent completed\n\nVirtual Disk Service error:\nThe volume size is too big.", kind: "change" };
      const lab = line.match(/label\s*=\s*"?([^"]+?)"?(\s|$)/i);
      p.fs = want; p.label = lab ? lab[1] : ""; M.note(m, "format", { n: sel.n, fs: want });
      return { out: "\n  100 percent completed\n\nDiskPart successfully formatted the volume.", kind: "change" };
    }
    if (v === "assign") {
      if (!sel) return noSel;
      const p = lastCreated(sel);
      if (!p) return { out: "\nThere is no volume selected.", kind: "error" };
      const L = ((t.filter(function (x) { return /^letter=/.test(x); })[0] || "").slice(7) || freeLetter()).toUpperCase();
      if (M.usedLetters(m).indexOf(L) >= 0) return { out: "\nThe specified drive letter is not free to be assigned.", kind: "error" };
      p.letter = L; M.note(m, "assign", { n: sel.n, letter: L });
      return { out: "\nDiskPart successfully assigned the drive letter or mount point.", kind: "change" };
    }
    return { out: "\nThe arguments specified for this command are not valid.\nFor more information on the command type: HELP", kind: "error" };
  }
  function lastCreated(d) {
    const ps = d.parts.filter(function (p) { return p.kind === "data"; });
    return ps[ps.length - 1] || null;
  }
  function freeLetter() {
    const used = M.usedLetters(m);
    for (const L of "EFGHIJKLMNOPQRSTUVWXYZ") if (used.indexOf(L) < 0) return L;
    return "Z";
  }
  function volTable(only) {
    const rows = [];
    let i = 0;
    rows.push("  Volume 0     D                       DVD-ROM         0 B  No Media");
    m.disks.forEach(function (d) {
      if (only && d !== only) return;
      d.parts.forEach(function (p) {
        if (p.kind === "unalloc" || p.kind === "unreach") return;
        i++;
        rows.push("  Volume " + i + "     " + pad(p.letter || " ", 3) + " " + pad(p.label || "", 11) + "  " + pad(p.fs, 5) + "  " + pad({ efi: "Partition", os: "Partition", recovery: "Partition", data: "Partition" }[p.kind], 10) + " " + lpad(dpSize(p.bytes), 7) + "  Healthy    " + ({ efi: "System", os: "Boot", recovery: "Hidden" }[p.kind] || ""));
      });
    });
    return "  Volume ###  Ltr  Label        Fs     Type        Size     Status     Info\n  ----------  ---  -----------  -----  ----------  -------  ---------  --------\n" + rows.join("\n");
  }

  /* -------------------- PowerShell, the listed cmdlets -------------------- */
  function powershell(t, line) {
    const w = t[0].toLowerCase();
    if (w === "exit") { sh.mode = "cmd"; return { out: "", kind: "look" }; }
    if (w === "cls" || w === "clear" || w === "clear-host") return { out: "", kind: "look", clear: true };
    if (w === "get-help") return { kind: "help", out: "NAME\n    " + (t[1] || "Get-Help") + "\n\nSYNOPSIS\n    Displays information about PowerShell commands.\n\n(This PC answers Get-Process, Stop-Process -Id, Get-Service, Restart-Service, Test-Connection, Get-NetIPAddress and Get-Content.)" };
    if (w === "get-process") {
      const ps = M.running(m);
      return { kind: "look", out: "\nHandles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName\n-------  ------    -----      -----     ------     --  -- -----------\n" +
        ps.map(function (p) { return lpad(300, 7) + lpad(20, 8) + lpad(commas(p.mem * 800), 9) + lpad(commas(p.mem * 1024), 11) + lpad((p.cpu * 3).toFixed(2), 11) + lpad(p.pid, 7) + lpad(1, 4) + " " + p.name.replace(/\.exe$/i, ""); }).join("\n") };
    }
    if (w === "stop-process") {
      const low = t.map(function (x) { return x.toLowerCase(); });
      const i = low.indexOf("-id");
      const p = i >= 0 ? m.procs.filter(function (x) { return String(x.pid) === t[i + 1]; })[0] : null;
      if (!p) return { out: "Stop-Process : Cannot find a process with the process identifier " + (t[i + 1] || "") + ".", kind: "error" };
      if (p.critical || p.protected || (p.user !== m.user && !sh.elevated)) return { out: "Stop-Process : Cannot stop process \"" + p.name.replace(/\.exe$/i, "") + " (" + p.pid + ")\" because of the following error: Access is denied", kind: "refused" };
      M.endProcess(m, p.pid, "ps");
      const back = MW.afterEnd(m, p);
      return { out: back || "", kind: "change", mw: { type: "tm-end", name: p.name, tag: p.tag || null, res: { ok: true, respawned: !!back } } };
    }
    if (w === "get-service") return { kind: "look", out: "\nStatus   Name               DisplayName\n------   ----               -----------\nRunning  Dnscache           DNS Client\nRunning  EventLog           Windows Event Log\nRunning  Spooler            Print Spooler\nRunning  WinDefend          Microsoft Defender Antivirus Service\nRunning  wuauserv           Windows Update" };
    if (w === "restart-service") { if (!sh.elevated) return { out: "Restart-Service : Service '" + (t[1] || "") + "' cannot be stopped due to the following error: Cannot open " + (t[1] || "") + " service on computer '.'.", kind: "refused" }; M.note(m, "restart-service", { name: t[1] }); return { out: "", kind: "change" }; }
    if (w === "test-connection") return ping(t.slice(1));
    /* the network adapter, System Restore and Microsoft Defender */
    const admin = function (name) { return { out: name + " : Access is denied. Run Windows PowerShell as administrator.", kind: "refused" }; };
    if (w === "disable-netadapter" || w === "enable-netadapter") { if (!sh.elevated) return admin(t[0]); MW.setAdapter(m, w === "enable-netadapter"); return { out: "", kind: "change", netChange: true, mw: { type: "net", op: w === "enable-netadapter" ? "on" : "off", how: "adapter" } }; }
    if (w === "get-netadapter") { MW.ready(m); return { kind: "look", out: "\nName      InterfaceDescription                Status\n----      --------------------                ------\nEthernet  Intel(R) Ethernet Connection I219   " + (m.net.adapter === false ? "Disabled" : m.net.cable === false ? "Disconnected" : "Up") }; }
    if (w === "disable-computerrestore" || w === "enable-computerrestore") { if (!sh.elevated) return admin(t[0]); const r = MW.setRestore(m, w === "enable-computerrestore"); return { out: r.ok ? "" : t[0] + " : " + r.text, kind: r.ok ? "change" : "error", mw: r.ok ? { type: "restore", op: w === "enable-computerrestore" ? "on" : "off", res: r } : null }; }
    if (w === "checkpoint-computer") { if (!sh.elevated) return admin(t[0]); const di = t.map(function (x) { return x.toLowerCase(); }).indexOf("-description"); const r = MW.createPoint(m, di >= 0 ? (t[di + 1] || "").replace(/"/g, "") : "Restore point"); return { out: r.ok ? "" : "Checkpoint-Computer : " + r.text, kind: r.ok ? "change" : "error", mw: { type: "restore", op: "point", res: r } }; }
    if (w === "get-computerrestorepoint") { MW.ready(m); return { kind: "look", out: m.restore.points.length ? "\nCreationTime   Description\n------------   -----------\n" + m.restore.points.map(function (p) { return p.date + "   " + p.name; }).join("\n") : "" }; }
    if (w === "get-mpcomputerstatus") { MW.ready(m); return { kind: "look", out: "\nAntivirusEnabled            : True\nRealTimeProtectionEnabled   : True\nAntivirusSignatureVersion   : " + m.av.defs + "\nAntivirusSignatureLastUpdated : " + m.av.defsDate }; }
    if (w === "update-mpsignature") { if (!sh.elevated) return admin(t[0]); const r = MW.updateDefs(m, "internet"); return { out: r.ok ? "" : "Update-MpSignature : " + r.text, kind: r.ok ? "change" : "error", mw: { type: "av", op: "defs", how: "internet", res: r } }; }
    if (w === "start-mpscan") { if (!sh.elevated) return admin(t[0]); const ti = t.map(function (x) { return x.toLowerCase(); }).indexOf("-scantype"); const kind = ti >= 0 && /full/i.test(t[ti + 1] || "") ? "full" : "quick"; const r = MW.scan(m, kind); return { out: r.text, kind: "change", av: r, mw: { type: "av", op: "scan", kind: kind, res: r } }; }
    if (w === "start-mpwdoscan") { if (!sh.elevated) return admin(t[0]); const r = MW.offlineScan(m); return { out: r.text, kind: "change", av: r, power: r.removed ? "restart" : undefined, mw: { type: "av", op: "scan", kind: "offline", res: r } }; }
    if (w === "get-netipaddress") return { kind: "look", out: "\nIPAddress         : 192.168.1.24\nInterfaceAlias    : Ethernet\nAddressFamily     : IPv4\nPrefixLength      : 24\nPrefixOrigin      : Dhcp" };
    if (w === "get-content") return { kind: "look", out: "(Get-Content reads a text file. Nothing on this PC needs reading this way in this job.)" };
    if (NATIVE.indexOf(w) >= 0 || LAUNCH[w]) { sh.mode = "cmd"; try { return sh.run(line); } finally { if (sh.mode === "cmd") sh.mode = "ps"; } }
    if (w === "ls" || w === "dir" || w === "get-childitem") {
      /* PowerShell's own listing format, as the App Deployment sim shows it */
      let target = t.slice(1).join(" "), pat = null;
      if (/[*?]/.test(target)) { const cut = target.lastIndexOf("\\"); pat = target.slice(cut + 1); target = cut >= 0 ? target.slice(0, cut) : ""; }
    else if (target && !locateDir(target)) {
      /* dir C:\some\folder\file.dll lists that one file, as Windows does */
      const cut = target.replace(/"/g, "").lastIndexOf("\\");
      if (cut >= 0) { pat = target.replace(/"/g, "").slice(cut + 1); target = target.replace(/"/g, "").slice(0, cut); }
    }
      const loc = locate(target || sh.cwd); if (loc.err) return { out: "ls : Cannot find path because it does not exist.", kind: "look" };
      const n = loc.m.fs[String(loc.path).replace(/\\$/, "").toLowerCase()] || loc.m.fs[String(loc.path).toLowerCase()];
      if (!n) return { out: "ls : Cannot find path '" + loc.path + "' because it does not exist.", kind: "look" };
      const re = pat ? new RegExp("^" + pat.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i") : /./;
      const files = n.files.filter(function (f) { return re.test(f.name); });
      const dirs = pat ? [] : n.dirs;
      return { kind: "look", out: "\n    Directory: " + n.path + "\n\nMode                LastWriteTime         Length Name\n----                -------------         ------ ----\n" +
        dirs.map(function (d) { return pad("d-----", 20) + pad("03/03/2025     09:45", 22) + lpad("", 8) + " " + d; }).concat(files.map(function (f) { return pad("-a----", 20) + pad("03/03/2025     10:20", 22) + lpad(commas(f.size), 8) + " " + f.name; })).join("\n") };
    }
    if (w === "get-wmiobject" || w === "get-ciminstance") {
      const cls = (t[1] || "").toLowerCase();
      if (cls === "win32_computersystem") return { kind: "look", out: "\nManufacturer        : Dell Inc.\nModel               : OptiPlex 7090\nName                : " + m.host + "\nPrimaryOwnerName    : " + m.fullName + "\nDomain              : rafiki.local\nTotalPhysicalMemory : " + (m.ramMB * 1048576) };
      if (cls === "win32_logicaldisk") return { kind: "look", out: "\nDeviceID     : C:\nDriveType    : 3\nFileSystem   : NTFS\nFreeSpace    : 193800000000\nSize         : 509000000000\n\nDeviceID     : D:\nDriveType    : 5" };
      if (cls === "win32_product") return { kind: "look", out: (m.apps || []).filter(function (a) { return a.installed !== false; }).map(function (a) { return "\nName    : " + a.name + "\nVendor  : " + a.publisher + "\nVersion : " + a.ver; }).join("\n") };
      return { out: "Get-WmiObject : Invalid class \"" + (t[1] || "") + "\"", kind: "error" };
    }
    if (w === "get-eventlog") {
      const low = t.map(function (x) { return x.toLowerCase(); });
      const li = low.indexOf("-logname"); const log = li >= 0 ? t[li + 1] : t[1];
      const ni = low.indexOf("-newest"); const n = ni >= 0 ? parseInt(t[ni + 1], 10) || 8 : 20;
      const L = m.logs[log ? log[0].toUpperCase() + log.slice(1).toLowerCase() : ""] ;
      if (!L) return { out: "Get-EventLog : The event log '" + (log || "") + "' on computer '.' does not exist.", kind: "error" };
      return { kind: "look", out: "\n   Index Time          EntryType   Source                 InstanceID Message\n   ----- ----          ---------   ------                 ---------- -------\n" +
        L.slice(-n).reverse().map(function (e) { return lpad(e.index, 8) + " " + pad(e.time, 13) + " " + pad(e.level, 11) + " " + pad(e.source, 22) + " " + lpad(e.id, 10) + " " + e.text.slice(0, 48) + "..."; }).join("\n") };
    }
    return { out: t[0] + " : The term '" + t[0] + "' is not recognized as the name of a cmdlet, function, script file, or operable\nprogram. Check the spelling of the name, or if a path was included, verify that the path is correct and try again.", kind: "error" };
  }

  return sh;
}
