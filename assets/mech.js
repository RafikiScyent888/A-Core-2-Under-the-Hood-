/* =====================================================================
   "What just happened" — one line under the prompt after each command.

   The mechanism view for typed work. A student who has just been refused
   by sfc needs to know WHY in terms of how Windows works, at the moment
   it happened, not in a panel they may never open. It explains what the
   machine did; it never says what to type next — that is the hint
   ladder's job, and it has rules about when.
   ===================================================================== */
export function explain(line, res, sh, m) {
  const l = String(line || "").trim().toLowerCase().replace(/\s+/g, " ");
  const out = res.out || "";
  if (!l) return null;
  if (res.kind === "help") return "Help text. Nothing on the PC changed, and reading it never counts against you.";
  if (/is not recognized as an internal or external command/.test(out)) {
    if (/^bootrec/.test(l)) return "bootrec is a Windows Recovery Environment tool. A running Windows does not have it at all.";
    return "cmd looked for a built-in command, then a program with that name in every folder on the PATH, and found neither. Usually a typo.";
  }
  if (/^sfc/.test(l)) {
    if (/must be an administrator/.test(out)) return "This prompt carries a standard user's token. sfc checks that before it starts, and stops.";
    if (/repair pending/.test(out)) return "Windows is part-way through replacing system files and finishes at the next start-up. Until then there is nothing stable to check.";
    if (/could not perform/.test(out)) return "sfc stopped part-way through the scan. When it cannot even read what it is checking, the fault is usually underneath it, in the file system.";
    if (/unable to fix some/.test(out)) return "sfc found damaged files, went to the component store for good copies, and the store's copies were damaged too.";
    if (/successfully repaired/.test(out)) return "Each damaged file was replaced with the known-good copy from the component store (C:\\Windows\\WinSxS). CBS.log lists which.";
    if (/did not find any integrity violations/.test(out)) return "Every protected file matched its known-good copy. That rules Windows' own files out.";
    if (/found integrity violations/.test(out)) return "/verifyonly checks without repairing. It has told you there is damage, and changed nothing.";
  }
  if (/^dism/.test(l)) {
    if (/Error: 740/.test(out)) return "DISM services the Windows image itself. Without an administrator's token it refuses outright.";
    if (/1392/.test(out)) return "DISM reads the component store off the disk, and the disk's file system is damaged underneath it.";
    if (/0x800f082f/.test(out)) return "A servicing operation is waiting for a restart. DISM will not start another one on top of it.";
    if (/restore operation completed/.test(out)) return "DISM checked the component store and replaced its damaged pieces with good ones from Windows Update. The files Windows RUNS are not touched by this.";
    if (/repairable/.test(out)) return "The component store is damaged, and DISM can repair it. Checking repaired nothing.";
    if (/No component store corruption/.test(out)) return "The component store is healthy, so sfc has good copies to repair from.";
  }
  if (/^chkdsk/.test(l) || (l === "y" && /checked the next time/.test(out))) {
    if (/Access Denied/.test(out)) return "chkdsk needs the administrator's token to lock and read a volume directly.";
    if (/Cannot lock current drive/.test(out)) return "Windows is running from C:, so C: cannot be locked for repair while it runs. The check has to happen before Windows starts.";
    if (/checked the next time/.test(out)) return "The check is booked for the next start-up, before Windows opens the drive. Nothing has been checked yet.";
    if (/found problems/.test(out)) return "Without /f, chkdsk only reads. It has found file-system damage and repaired none of it.";
    if (/found no problems/.test(out)) return "The file system's structures are consistent.";
  }
  if (/^taskkill/.test(l)) {
    if (/Access is denied/.test(out)) return "Windows protects its own critical and security processes, and a standard prompt cannot end a process another account owns.";
    if (/SUCCESS/.test(out)) return "The process has ended, and anything it had not saved has gone with it.";
  }
  if (/^tasklist/.test(l)) return "A snapshot of every running process right now. It changes nothing.";
  if (/^whoami/.test(l)) return sh.elevated ? "This prompt runs with an administrator's token (High Mandatory Level)." : "This prompt runs with a standard token, even if the account is an administrator: User Account Control splits the two.";
  if (/^diskpart$/.test(l)) return "DiskPart has its own prompt, and it acts on whichever disk is SELECTED. Always check which one that is before a command that changes anything.";
  if (/^select disk/.test(l) && /now the selected disk/.test(out)) return "Every change from now on happens to this disk. list disk puts an asterisk beside it.";
  if (/^clean/.test(l) && /succeeded/.test(out)) return "clean wipes the partition table off the selected disk. Every volume on it is gone, and the disk is uninitialized again.";
  if (/^convert/.test(l) && /successfully converted/.test(out)) return "The partition table was rewritten in the new style. That is only allowed on an empty disk.";
  if (/^create partition/.test(l) && /succeeded/.test(out)) return "The space is now a partition, with no file system yet. On a disk that was never initialized, DiskPart quietly makes it MBR first.";
  if (/^format/.test(l) && /successfully formatted/.test(out)) return "A file system was written onto the partition. It still needs a letter before File Explorer shows it.";
  if (/^assign/.test(l) && /successfully assigned/.test(out)) return "The volume has a drive letter, so File Explorer and every program can now see it.";
  if (/^runas/.test(l)) return "runas starts a program as another account. Windows 11 keeps the built-in Administrator disabled, so this one cannot sign in.";
  if (/^shutdown/.test(l)) return "shutdown /r restarts, /s shuts down, /t sets the delay in seconds.";
  if (/^ipconfig/.test(l)) return "ipconfig reads the network adapter's settings. Only /release, /renew and /flushdns change anything.";
  if (/^(dir|cd|chdir)\b/.test(l)) return "Looking around changes nothing, and never counts against you.";
  return null;
}
