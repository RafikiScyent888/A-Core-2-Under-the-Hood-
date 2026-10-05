/* =====================================================================
   Extra training: OS installation (Operating systems, "working with
   Windows, macOS, Linux, and mobile operating systems"). The owner,
   5 October 2026: "OS installation next, build it out".

   OI1 (crawl): Dev's PC came back from the vendor with a new, blank SSD.
   A clean install of Windows 11 Pro from the installer USB, at the desk,
   the way it's really done:
     the USB in, power on, the boot menu (F12), the UEFI USB entry
     Windows Setup: language, install (everything on the drive goes),
       no product key (the PC's digital licence), the Pro edition the
       licence is for, the licence terms
     where to install: the vendor left an MBR partition, and a UEFI PC
       can only install Windows to a GPT disk. Delete it (formatting
       keeps the MBR style); Setup makes the GPT layout itself
     the first-run setup: region, the PC's name (WS3-DEV, as DNS and the
       asset register know it), work or school › Sign-in options ›
       Domain join instead, a local account, privacy
     in Windows: System Properties › Computer Name › join RAFIKI, restart,
       and Dev signs in with their own account
   Detours that never count: PXE, Repair my PC, a mistyped key or
   password, trying a work email in the Microsoft Entra ID box.
   ===================================================================== */
import * as INS from "./install.js";

function opt(label, correct, why) { return { label: label, correct: !!correct, why: why || "" }; }
const PRO = "Windows 11 Pro", NAME = "WS3-DEV";
const INSTALL = { topic: "OS installation", domain: "Operating systems", objective: "working with Windows, macOS, Linux, and mobile operating systems", kind: "install", extra: true, tier: 1, outcome: "resolve", category: "Operating systems › OS installation" };
const GB = 1073741824;
/* the drive the vendor fitted: tested, left with their own partition on
   an MBR disk */
function vendorDisk() {
  return { n: 0, model: "NVMe KIOXIA XG8 512GB", bytes: 512110190592, style: "MBR", online: true, system: false,
    parts: [{ kind: "data", bytes: 512110190592, fs: "NTFS", label: "VENDOR TEST", letter: "", health: "Healthy (Primary Partition)" }] };
}

/* ------------------------------------------------- where the job is */
export const ORDER = ["media", "power", "boot", "setup", "edition", "terms", "delete", "where", "install", "restart", "region", "name", "how", "work", "local", "privacy", "join", "restart2", "signin", "done"];
const OOBE = { region: "region", name: "name", how: "how", msa: "how", work: "work", local: "local", privacy: "privacy" };
/* the step a technician is on, ignoring mistakes */
function core(m) {
  const I = m.inst, S = I.setup || {}, O = I.oobe || {}, dk = m.disks[0];
  if (!I.os && !S.copied && !I.media && !I.setup) return "media";
  if (m.power !== "on") return "power";
  if (!I.os) {
    if (S.copied) return "restart";
    if (!I.setup) return "boot";
    const st = S.step;
    if (st === "edition" || (S.edition && S.edition !== PRO && ["terms", "disk", "ready"].indexOf(st) >= 0)) return "edition";
    if (["lang", "option", "key", "unsupported", "repair"].indexOf(st) >= 0) return "setup";
    if (st === "terms") return "terms";
    if (st === "disk") return dk.style === "MBR" && dk.parts.some(function (p) { return p.kind !== "unalloc"; }) ? "delete" : "where";
    return "install";
  }
  if (O.step && O.step !== "done") return OOBE[O.step];
  if (I.joinPending || I.pendingName) return "restart2";
  if (!I.joined) return "join";
  if (!I.signedIn) return "signin";
  return "done";
}
function fwBad(m) { const f = m.inst.fw; return !f.uefi || !f.secureBoot || !f.tpmOn; }
function edition(m) { const I = m.inst, S = I.setup || {}; return I.os ? I.os.name : S.copied ? S.edition : null; }
function nameNow(m) { const I = m.inst, O = I.oobe || {}; if (!O.name) return null; return I.pendingName || (O.step === "done" ? m.host : O.name); }
/* the stage, with the mistakes that need putting right first; and the
   score, which never rises past a mistake (so no snapshot holds one) */
export function judgeState(m) {
  const c = core(m), i = ORDER.indexOf(c); let cap = ORDER.length, st = c;
  const ed = edition(m), O = m.inst.oobe || {};
  if (ed && ed !== PRO) { st = "wrong-edition"; cap = Math.min(cap, ORDER.indexOf("edition")); }
  else if (m.inst.account && m.inst.account.type === "msa") { st = "personal"; cap = Math.min(cap, ORDER.indexOf("how")); }
  else if (fwBad(m)) { st = "firmware"; cap = Math.min(cap, ORDER.indexOf("boot")); }
  else if (nameNow(m) && nameNow(m) !== NAME) { cap = Math.min(cap, ORDER.indexOf("name")); if (O.step === "done" && (c === "signin" || c === "done")) st = "wrong-name"; }
  return { stage: st, score: Math.min(i, cap) };
}
export function stage(m) { return judgeState(m).stage; }

const OI1 = Object.assign({}, INSTALL, {
  id: "OI1", machine: "WS3",
  title: "New SSD fitted by the vendor: PC needs Windows",
  from: "Dev Patel, Dev",
  brief: ["Hi, it's Dev. The vendor swapped the SSD in my PC yesterday after the old one failed its health check. They said the new drive is blank apart from their own test partition, and that IT has to put Windows on it.",
    "It's switched off at my desk. I'm on the meeting room laptop until it's back, so come and find me when it's ready for me to sign in.",
    "Mason's note on the ticket: clean install of Windows 11 from the installer USB on your bench (WIN11_24H2). WS3 is licensed for Windows 11 Pro with a digital licence on its motherboard: it activates itself once it's online, so you won't need a key. Keep its name, WS3-DEV: DNS and the asset register both use it. It goes on the RAFIKI domain; RAFIKI\\itadmin (Bench-Tech-2026) is allowed to join PCs. Leave the firmware's security settings as they are."],
  setup: function (fleet) {
    INS.prepare(fleet.WS3, { disk: vendorDisk(), os: null, off: true, licence: PRO });
    fleet.WS3.clock = "Oct 5 09:10";
  },
  stage: function (fleet) { return stage(fleet.WS3); },
  goal: function (fleet) { return stage(fleet.WS3) === "done"; },
  scoreFn: function (fleet) { return judgeState(fleet.WS3).score; },
  notReady: function (fleet) {
    const m = fleet.WS3, s = stage(m);
    if (s === "wrong-edition") return "Mason: \"WS3 is licensed for Pro. That edition won't activate, and it can't join the domain.\"";
    if (s === "personal") return "Mason: \"Whose account is that PC set up with? Company PCs belong to the domain.\"";
    if (s === "wrong-name") return "Mason checks the asset register: there's no " + m.host + " in it, and WS3-DEV doesn't answer.";
    if (s === "firmware") return "Mason: \"I said leave the firmware's security settings as they are. Look at them again.\"";
    if (s === "signin") return "Dev comes back to the desk to sign in, and hasn't been able to yet.";
    if (ORDER.indexOf(s) <= ORDER.indexOf("restart")) return "Dev's PC still has no Windows on it.";
    return "Dev comes back to the desk: it isn't ready for Dev's own account yet.";
  },
  judge: function (act, fleet, before) {
    const m = fleet.WS3, I = m.inst;
    if (act.machine && act.machine !== "WS3") return { guess: false };
    if (act.type !== "osinst") return { guess: false };
    const r = act.res || {};
    if (act.op === "fw-save" && r.changed) {
      const f = I.fw;
      if (!f.uefi) return { guess: true, say: "Legacy (CSM) boot turns off UEFI, and Secure Boot with it. Windows 11 needs UEFI with Secure Boot: Setup will say this PC can't run it." };
      if (!f.secureBoot) return { guess: true, say: "Secure Boot is off. It stops untrusted code starting before Windows, and Mason asked you to leave the firmware's security settings alone." };
      if (!f.tpmOn) return { guess: true, say: "The TPM is switched off. Windows 11 needs TPM 2.0, and BitLocker keeps its keys in it." };
      return { guess: false };
    }
    if (act.op === "bootfrom" && act.entry === "usb" && before && before.score >= ORDER.indexOf("restart")) return { guess: true, say: "That started Windows Setup again from the beginning. Windows was already copied to the drive: after Setup's restart, the PC should start from the drive, not the USB." };
    if (act.op === "ws-edition" && act.edition !== PRO) return { guess: true, say: act.edition + " isn't what WS3 is licensed for. Read Mason's note again: the digital licence decides which edition activates." + (/Home/.test(act.edition) ? " Home can't join a domain, either." : "") };
    if (act.op === "ws-key" && I.setup && I.setup.key && I.setup.edition && I.setup.edition !== PRO) return { guess: true, say: "That key is for " + I.setup.edition + ", not the Pro licence WS3 has." };
    if (act.op === "ws-format") return { guess: true, say: "Formatting empties the partition and leaves the disk exactly as it was: still MBR. Setup will still refuse it." };
    if (act.op === "oobe-name" && r.ok && r.name !== NAME) return { guess: true, say: r.name + " isn't the name Mason asked you to keep. DNS and the asset register know this PC as WS3-DEV." };
    if (act.op === "oobe-how" && act.how === "personal") return { guess: true, say: "Personal use sets it up with someone's own Microsoft account. This is Rafiki's PC, for the RAFIKI domain: it's set up for work." };
    if (act.op === "oobe-msa" && !/Home/.test(edition(m) || "")) return { guess: true, say: "It's set up with a personal Microsoft account now. A company PC belongs to the company's domain: revert to your last snapshot." };
    if (act.op === "rename" && r.ok && String(act.name || "").trim().toUpperCase() !== NAME) return { guess: true, say: "That isn't the name Mason asked you to keep: WS3-DEV." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      media: ["You're at Dev's desk with a PC that has nothing on its drive. What do you have on your bench that can start a PC?", "A PC with an empty drive can only start from something else: the installer has to be plugged in."],
      power: ["Look at the tower's power light.", "Nothing happens on a switched-off PC."],
      boot: ["Read the start-up screen: it tells you which keys do what.", "The boot menu lets you start from a device once, without changing the firmware's settings."],
      firmware: ["Read Mason's note about the firmware, then look at its security settings.", "Windows 11 needs UEFI with Secure Boot and TPM 2.0. Turning security off is never how to install it."],
      setup: ["Read each Setup screen word for word, including the box you have to tick.", "Mason's note says whether you need a key: a digital licence activates by itself once the PC is online."],
      edition: ["Read Mason's note: what is WS3 licensed for?", "The edition you install has to be the one the licence covers, or Windows won't activate."],
      terms: ["Setup is waiting on the licence terms.", "Setup won't go on until the terms are accepted."],
      delete: ["Read Setup's message about the drive word for word: what does it say about the disk's partition style?", "A UEFI PC can only install Windows to a GPT disk. What's in a partition and the disk's partition style are different things: changing one doesn't change the other."],
      where: ["Which line in the list has no partition on it?", "Setup lays out a blank drive itself, with every partition Windows needs."],
      install: ["Setup shows what it's about to do. Check it, then let it go.", "The edition and the place are right: it's ready."],
      restart: ["Windows is copied to the drive. Where should the PC start from now?", "Setup finishes from the drive it installed to. The installer only starts Setup over."],
      region: ["Windows' own first-run setup has started. Read the question.", "The first-run setup asks a few questions, one screen at a time."],
      name: ["Read Mason's note: what's this PC called?", "A replaced drive doesn't change who the PC is: DNS and the asset register already know its name."],
      how: ["Whose PC is this: a person's, or the company's?", "A company PC belongs to the company's directory, not to someone's own account."],
      work: ["Rafiki's accounts are in its own Active Directory domain. Look for the other ways to set this up.", "An on-premises Active Directory domain isn't Microsoft Entra ID. Setup has another way in for a PC that will join one."],
      local: ["You chose to join a domain later, so Setup needs an account to start with.", "The local account gets you into Windows; joining the domain happens from inside Windows."],
      privacy: ["Read the screen: Setup is asking about privacy.", "Rafiki's policy sets these once the PC is on the domain."],
      join: ["It's on WORKGROUP, signed in with a local account. Where does Windows keep a PC's name and what it belongs to?", "A PC joins a domain from Windows' own system settings, with an account that's allowed to join PCs to it. The change waits for a restart."],
      restart2: ["Read what Windows said after you pressed OK.", "A new name or a domain join takes effect at the next restart."],
      signin: ["The PC is on the domain. Who should sign in first?", "The user signs in with their own domain account: their profile is made the first time they do."],
      "wrong-edition": ["Compare the edition on the PC with what Mason said it's licensed for.", "The edition can't simply be swapped down to fix it here: go back to the last point you had right."],
      personal: ["Which account is the PC set up with?", "A company PC belongs to the company's directory. Go back to the last point you had right."],
      "wrong-name": ["Compare the PC's name with Mason's note.", "A PC's name is changed in Windows' own system settings, and the change takes effect at a restart."],
      done: ["Dev is signed in on the domain. The job's done: close it out on Help Desk.", "The close question is about why Setup refused the vendor's partition."]
    };
    return H[stage(fleet.WS3)];
  },
  moves: function (fleet) {
    const X = {
      media: [opt("Plug the Windows 11 installer USB into the PC", true),
        opt("Connect to WS3-DEV with remote support", false, "It's switched off with no Windows on it: there's nothing to connect to."),
        opt("Press the power button and let it start", false, "With nothing to start from, it stops at \"No bootable device\"."),
        opt("Boot it from the network (PXE)", false, "Rafiki has no PXE deployment server: the request times out."),
        opt("Copy Windows' files onto the drive from another PC", false, "Windows is installed by Setup, not by copying files."),
        opt("Send it back to the vendor", false, "The vendor's job was the drive. Installing Windows is ours.")],
      power: [opt("Press the power button", true),
        opt("Wait for it to start by itself", false, "It's switched off."),
        opt("Take the USB out and put it back", false, "The USB is fine: the PC is off."),
        opt("Check the network cable", false, "Nothing needs the network yet."),
        opt("Hold the power button for ten seconds", false, "That forces a running PC off."),
        opt("Connect to it remotely", false, "It's off.")],
      boot: [opt("Press F12 and choose the UEFI USB entry", true),
        opt("Choose Network boot (PXE)", false, "No deployment server: it times out."),
        opt("Choose Windows Boot Manager", false, "There's no Windows on the drive to start."),
        opt("Switch the firmware to Legacy (CSM) boot", false, "Windows 11 needs UEFI with Secure Boot."),
        opt("Turn off Secure Boot so the USB will start", false, "The Windows installer is signed: Secure Boot lets it start."),
        opt("Clear the TPM in the firmware", false, "Nothing to do with starting from the USB, and it's needed later.")],
      firmware: [opt("Set the firmware back to UEFI, Secure Boot on, TPM on, and save", true),
        opt("Leave it: Windows 11 installs without them", false, "Setup checks for UEFI and TPM 2.0, and Mason asked for the security settings to stay as they were."),
        opt("Use a registry trick in Setup to skip the checks", false, "Unsupported, and the hardware supports them: they're just switched off."),
        opt("Install Windows 10 instead", false, "WS3 is licensed for Windows 11 Pro."),
        opt("Clear the TPM", false, "It's switched off, not faulty."),
        opt("Escalate to Tier 2", false, "Putting the settings back is a Tier 1 job.")],
      setup: [opt("Choose Install Windows 11, tick the box, then I don't have a product key", true),
        opt("Choose Repair my PC", false, "There's no Windows on the drive to repair."),
        opt("Type the key from the old PC's sticker", false, "Mason's note says it activates from its digital licence: no key."),
        opt("Turn off Secure Boot so Setup goes on", false, "Setup isn't blocked: it's waiting for you."),
        opt("Restart and boot from the drive", false, "The drive has nothing to start."),
        opt("Use a Windows 10 USB instead", false, "WS3 is licensed for Windows 11 Pro.")],
      edition: [opt("Choose Windows 11 Pro", true),
        opt("Choose Windows 11 Home", false, "Not what WS3 is licensed for, and Home can't join a domain."),
        opt("Choose Windows 11 Pro for Workstations", false, "A different, higher licence: it won't activate."),
        opt("Choose Windows 11 Education", false, "Licensed for schools through volume licensing, not WS3."),
        opt("Choose Windows 11 Pro N", false, "Pro without the media apps: a different edition from the licence."),
        opt("Choose Windows 11 Home N", false, "Home, without media apps: wrong on both counts.")],
      terms: [opt("Accept the licence terms", true),
        opt("Go back and enter a product key", false, "Not needed: the digital licence activates it."),
        opt("Go back and choose Home", false, "Pro is the licence."),
        opt("Restart Setup", false, "Nothing is wrong."),
        opt("Repair my PC", false, "Nothing to repair."),
        opt("Turn the PC off", false, "Setup is going fine.")],
      delete: [opt("Delete the VENDOR TEST partition, then pick the unallocated space", true),
        opt("Format the VENDOR TEST partition and press Next", false, "Formatting keeps the disk MBR: still refused."),
        opt("Switch the firmware to Legacy (CSM) boot", false, "Then Windows 11's requirements fail: it needs UEFI and Secure Boot."),
        opt("Turn off Secure Boot", false, "The partition style is the problem, not Secure Boot."),
        opt("Send the drive back to the vendor", false, "The drive is fine: it's just laid out as MBR."),
        opt("Install to the partition anyway with Legacy boot, then switch back", false, "Windows installed in Legacy mode won't start in UEFI mode.")],
      where: [opt("Select Drive 0 Unallocated Space and press Next", true),
        opt("Make a new partition first, then format it", false, "Setup makes every partition it needs on unallocated space."),
        opt("Load a storage driver", false, "Setup can see the drive."),
        opt("Restart Setup", false, "Nothing is wrong."),
        opt("Go back and format", false, "There's nothing to format."),
        opt("Turn off the TPM so Setup can write", false, "The TPM has nothing to do with the disk.")],
      install: [opt("Press Install", true),
        opt("Go back and pick Home to be safe", false, "Pro is the licence."),
        opt("Go back and format first", false, "Setup prepares the disk itself."),
        opt("Take the USB out to speed it up", false, "Setup copies from the USB."),
        opt("Turn off Secure Boot first", false, "Not needed, and Mason asked for it to stay on."),
        opt("Restart and start again", false, "Everything is ready.")],
      restart: [opt("Restart and let the PC start from the drive", true),
        opt("Press F12 and choose the USB again", false, "Setup would start again from the beginning."),
        opt("Turn off Secure Boot so Windows starts", false, "Windows 11 starts with Secure Boot on."),
        opt("Choose Network boot (PXE)", false, "Nothing on the network to start."),
        opt("Switch the firmware to Legacy (CSM)", false, "Windows was installed for UEFI: it wouldn't start."),
        opt("Copy Setup's files again", false, "They're copied.")],
      region: [opt("Confirm the region and go on", true),
        opt("Restart", false, "The first-run setup would just come back."),
        opt("Boot from the USB again", false, "Windows is installed."),
        opt("Turn the PC off and back on", false, "Same screen."),
        opt("Skip the first-run setup", false, "It can't be skipped."),
        opt("Escalate to Tier 2", false, "It's going fine.")],
      name: [opt("Name it WS3-DEV", true),
        opt("Leave the name Windows suggests", false, "A random name that DNS and the asset register don't know."),
        opt("Name it DEV-PATEL", false, "Mason asked you to keep WS3-DEV."),
        opt("Name it WS3", false, "Not the name DNS knows."),
        opt("Name it WS3-DEV-NEW", false, "A new name that DNS and the asset register don't know."),
        opt("Name it after the new drive", false, "The drive doesn't change who the PC is.")],
      how: [opt("Set up for work or school", true),
        opt("Set up for personal use", false, "Someone's own Microsoft account on a company PC."),
        opt("Restart and pick Home", false, "Pro is the licence."),
        opt("Go back and rename it", false, "The name is right."),
        opt("Turn off the network to skip accounts", false, "Not how a domain PC is set up."),
        opt("Escalate to Tier 2", false, "This is a Tier 1 job.")],
      work: [opt("Sign-in options › Domain join instead", true),
        opt("Sign in with Dev's email address", false, "Rafiki has no Microsoft Entra ID: its accounts are in Active Directory."),
        opt("Sign in with itadmin's email", false, "Same: there's no Entra ID tenant."),
        opt("Go back and set up for personal use", false, "Company PC: work."),
        opt("Restart Setup", false, "Nothing is wrong."),
        opt("Escalate to Tier 2", false, "Domain join is the option you need.")],
      local: [opt("Create a local account and go on", true),
        opt("Name the local account Administrator", false, "Reserved by Windows."),
        opt("Type RAFIKI\\dev as the local account", false, "Dev's account is a domain account: it signs in once the PC is joined."),
        opt("Go back to Microsoft Entra ID", false, "Rafiki uses Active Directory."),
        opt("Restart Setup", false, "Nothing is wrong."),
        opt("Turn the PC off", false, "Setup is going fine.")],
      privacy: [opt("Accept the privacy settings", true),
        opt("Restart", false, "The screen would come back."),
        opt("Go back to personal use", false, "Company PC."),
        opt("Turn the PC off", false, "Setup is nearly done."),
        opt("Boot from the USB again", false, "Setup would start again."),
        opt("Escalate", false, "Nothing to escalate.")],
      join: [opt("In System Properties › Computer Name, check it's WS3-DEV and join the RAFIKI domain", true),
        opt("Resolve: Windows is installed", false, "Dev can't sign in with a domain account on a WORKGROUP PC."),
        opt("Add Dev as a local user", false, "Dev's account, files and policies are on the domain."),
        opt("Sign in to Microsoft Entra ID from Settings", false, "Rafiki uses Active Directory, not Entra ID."),
        opt("Reinstall Windows and pick work or school again", false, "Joining happens from inside Windows: no reinstall."),
        opt("Join it with Dev's own account", false, "Joining needs an account allowed to join PCs: itadmin.")],
      restart2: [opt("Restart the PC", true),
        opt("Resolve now", false, "The join takes effect at the restart."),
        opt("Join the domain again", false, "It's done: it waits for the restart."),
        opt("Sign out and back in", false, "A restart, not a sign-out."),
        opt("Unplug the network cable", false, "It needs the network to reach the domain."),
        opt("Shut it down for Dev to start", false, "Then nobody checks it worked.")],
      signin: [opt("Let Dev sign in with RAFIKI\\dev", true),
        opt("Sign in as itadmin to test it", false, "That makes itadmin's profile, not Dev's, and leaves admin credentials in use on a user's PC."),
        opt("Sign in with the local account", false, "Dev's work is on the domain account."),
        opt("Resolve without signing in", false, "Nobody has seen the domain sign-in work."),
        opt("Reset Dev's password first", false, "Nothing is wrong with Dev's account."),
        opt("Restart again", false, "It's already joined.")],
      "wrong-edition": [opt("Revert to your last snapshot", true),
        opt("Leave it: Windows activates anyway", false, "The digital licence is for Pro: this edition won't activate."),
        opt("Type the Pro key into Settings later", false, "There's no key, and Home can't join the domain."),
        opt("Resolve the ticket", false, "Wrong edition."),
        opt("Escalate to Tier 2", false, "The snapshot puts it right."),
        opt("Buy a licence for this edition", false, "WS3 already has a Pro licence.")],
      personal: [opt("Revert to your last snapshot", true),
        opt("Leave it: Dev can use the personal account", false, "A company PC belongs to the company's directory."),
        opt("Resolve the ticket", false, "It's not on the domain."),
        opt("Add Dev's work email to the account", false, "Still a personal account on a company PC."),
        opt("Escalate", false, "The snapshot puts it right."),
        opt("Reinstall from the USB", false, "The snapshot is quicker and exact.")],
      "wrong-name": [opt("Rename it WS3-DEV in System Properties › Computer Name, and restart", true),
        opt("Leave it: the name doesn't matter", false, "DNS and the asset register know it as WS3-DEV."),
        opt("Reinstall Windows", false, "A rename is all it needs."),
        opt("Ask Mason to rename it in DNS", false, "The PC's name is what's wrong."),
        opt("Resolve the ticket", false, "Mason can't find it."),
        opt("Escalate", false, "A rename is Tier 1.")],
      done: [opt("Resolve the ticket", true),
        opt("Reinstall to be sure", false, "It's done."),
        opt("Turn off Secure Boot for speed", false, "Never."),
        opt("Rename it", false, "It's WS3-DEV."),
        opt("Escalate", false, "It's done at Tier 1."),
        opt("Sign Dev out again", false, "Dev is working.")]
    };
    return X[stage(fleet.WS3)];
  },
  closeWhere: "Think about the message Setup gave about the vendor's drive, and how the PC was starting.",
  close: { prompt: "Mason asks: \"Why wouldn't Setup install to the vendor's partition?\" What do you tell Mason?", options: [
    opt("The PC starts in UEFI mode, and UEFI needs Windows on a GPT disk", true),
    opt("The partition was NTFS, and Windows Setup needs the drive formatted FAT32", false, "Only the small EFI system partition is FAT32. Windows itself goes on NTFS."),
    opt("At 512 GB the partition was too big: Setup takes up to 2 TB on MBR only", false, "MBR's limit is 2 TB, and 512 GB is under it. The style was the problem, not the size."),
    opt("Secure Boot blocks Setup from using a partition another company made", false, "Secure Boot checks what starts the PC. It doesn't look at who made a partition."),
    opt("The TPM had locked the drive to the vendor's test PC", false, "A TPM keeps keys for its own PC. It doesn't lock a blank drive, and you never touched it."),
    opt("Setup won't install to a partition that has a volume label", false, "Labels don't matter. Setup's message named the partition style.")] },
  note: { must: [["mbr", "gpt"], ["delete"], ["pro"], ["ws3-dev"], ["rafiki", "domain"], ["sign"]],
    tip: "The disk problem and what you did about it, the edition and why, the name, the domain join, and that Dev signed in." }
});
OI1.closeAdvice = "Dev is signed in on the domain. Now answer Mason's question on the ticket: why wouldn't Setup install to the vendor's partition?";
OI1.advice = function (fleet) {
  const s = stage(fleet.WS3);
  if (ORDER.indexOf(s) <= ORDER.indexOf("restart")) return "Everything on this job happens at Dev's desk: the PC is off and its drive is empty. The installer is on your bench. Read every screen word for word.";
  if (ORDER.indexOf(s) <= ORDER.indexOf("privacy")) return "Windows' first-run setup asks one question per screen. Mason's note has the answers that matter: the name, and that it goes on the RAFIKI domain.";
  return "Windows is in. Mason's note has what's left: the domain, and who joins PCs to it. Then Dev signs in.";
};

/* ---------------------------------------------------------------------
   OI2 (walk): Brenda's PC, the last on Windows 10. Supported hardware,
   but its TPM is switched off in the firmware, so Windows says it can't
   run Windows 11. Switch it on, then upgrade IN PLACE from the USB,
   keeping files and apps; Brenda signs in and PayWise works.
   --------------------------------------------------------------------- */
function lastEv(m, test) { const e = (m.events || []).filter(test); return e.length ? e[e.length - 1].at : -1; }
const BYPASS = /allowupgradeswithunsupportedtpmorcpu|bypasstpmcheck|bypasscpucheck|bypasssecurebootcheck|labconfig|\/product server/i;
export const ORDER2 = ["power", "tpm", "media", "upgrade", "restart", "signin", "test", "done"];
function oi2core(m) {
  const I = m.inst, U = I.up || {};
  if (m.power !== "on") return "power";
  if (!U.applied) {
    if (!I.fw.tpmOn) return "tpm";
    if (U.copied) return "restart";
    if (!I.media) return "media";
    return "upgrade";
  }
  if (!I.signedIn) return "signin";
  const ap = lastEv(m, function (e) { return e.kind === "inst-up-applied"; });
  if (!(lastEv(m, function (e) { return e.kind === "launch" && e.app === "PayWise" && e.result === "ok"; }) > ap)) return "test";
  return "done";
}
export function oi2State(m) {
  const I = m.inst, U = I.up || {}, c = oi2core(m); let st = c, cap = ORDER2.length;
  const S = I.setup || {};
  if ((U.applied && U.keep !== "all") || S.deleted || S.copied || (S.step && ["lang", "option", "unsupported", "repair"].indexOf(S.step) < 0)) { st = "lost"; cap = ORDER2.indexOf("upgrade"); }
  else if (!I.fw.uefi || !I.fw.secureBoot) { st = "firmware"; cap = ORDER2.indexOf("tpm"); }
  else if (U.keep && U.keep !== "all" && !U.applied) { st = "keep"; cap = ORDER2.indexOf("upgrade"); }
  return { stage: st, score: Math.min(ORDER2.indexOf(c), cap) };
}
function oi2(m) { return oi2State(m).stage; }
const OI2 = Object.assign({}, INSTALL, {
  id: "OI2", machine: "WS2",
  title: "\"This PC can't run Windows 11\": Brenda's PC needs upgrading",
  from: "Brenda Smith, Sales",
  brief: ["Hi, Brenda here. Windows keeps telling me this PC can't run Windows 11, and Mason says mine is the last one still on Windows 10. Can you sort it this week?",
    "Please don't lose anything. My files, and PayWise exactly as it is, with all my settings in it. It took me a month to get the reports right.",
    "Mason's note on the ticket: WS2 is an OptiTower 7020 with a 12th-gen Core i5, the same as the PCs we've already moved to Windows 11, so its hardware is supported. Upgrade it in place from the installer USB on your bench, not a clean install. Leave Secure Boot as it is."],
  setup: function (fleet) {
    INS.prepare(fleet.WS2, { os: { name: "Windows 10 Pro", version: "22H2" }, fw: { tpmOn: false }, licence: "Windows 11 Pro" });
    fleet.WS2.clock = "Oct 6 10:05";
  },
  stage: function (fleet) { return oi2(fleet.WS2); },
  goal: function (fleet) { return oi2(fleet.WS2) === "done"; },
  scoreFn: function (fleet) { return oi2State(fleet.WS2).score; },
  notReady: function (fleet) {
    const s = oi2(fleet.WS2);
    if (s === "lost") return "Brenda: \"Where's PayWise? Where are my files?\"";
    if (s === "test") return "Mason: \"Did you open PayWise after the upgrade? That's the one thing she asked for.\"";
    if (s === "signin") return "Brenda comes back to her desk: it's waiting for someone to sign in.";
    return "Brenda's PC is still on Windows 10.";
  },
  judge: function (act, fleet, before) {
    const m = fleet.WS2, I = m.inst;
    if (act.machine && act.machine !== "WS2") return { guess: false };
    if (act.type === "cmd" && BYPASS.test(String(act.line || ""))) return { guess: true, say: "That forces Windows 11 past its own checks. WS2's hardware is supported: something on it is only switched off. Find what, and put it right." };
    if (act.type !== "osinst") return { guess: false };
    const r = act.res || {};
    if (act.op === "fw-save" && r.changed) {
      if (!I.fw.uefi) return { guess: true, say: "Legacy (CSM) boot: Windows was installed for UEFI, and it won't start this way. Windows 11 needs UEFI, too." };
      if (!I.fw.secureBoot) return { guess: true, say: "Secure Boot is off, and Mason asked you to leave it alone." };
      return { guess: false };
    }
    if (act.op === "up-keep" && act.keep !== "all") return { guess: true, say: INS.KEEP[act.keep] + ": " + (act.keep === "files" ? "PayWise and Brenda's settings would be removed." : "everything on the PC would be deleted.") + " She asked for everything to stay." };
    if (act.op === "ws-option" && r.ok) return { guess: true, say: "Starting the PC from the USB is a clean install: Setup has just said everything on the drive will be deleted. An upgrade that keeps her files and apps runs from inside Windows." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      power: ["Look at the tower's power light.", "Nothing happens on a switched-off PC."],
      tpm: ["Mason says the hardware is supported, and Windows says it isn't. Ask Windows exactly which requirement fails.", "A requirement can fail because the hardware lacks it, or because it's there and switched off before Windows starts."],
      media: ["The upgrade comes from the installer on your bench.", "Setup has to be on the PC before it can run."],
      upgrade: ["Run the installer from inside Windows, and read every screen before you press Next.", "An in-place upgrade keeps what the user asked to keep. A PC started from the installer does a clean install."],
      keep: ["Read Brenda's message again: what did she ask you to keep?", "What Setup keeps is chosen once, before it copies a thing."],
      restart: ["Setup has copied Windows 11. It finishes as the PC starts.", "An upgrade finishes from the drive, as Windows starts."],
      signin: ["The PC is waiting at its sign-in screen.", "The user signs in with their own account after an upgrade."],
      test: ["What did Brenda say mattered most?", "Check the user's own program works before you close the ticket."],
      firmware: ["Read Mason's note about the firmware, then look at its boot settings.", "Change only what Windows said it needs. Leave the rest as it was."],
      lost: ["What's on Brenda's PC now, compared with what she asked to keep?", "Go back to the last point you had right."],
      done: ["Windows 11 is on, and PayWise works. Close it out on Help Desk.", "The close question is about why Windows said this PC couldn't run Windows 11."]
    };
    return H[oi2(fleet.WS2)];
  },
  moves: function (fleet) {
    const X = {
      power: [opt("Press the power button", true), opt("Connect to it remotely", false, "It's off."), opt("Plug in the USB and wait", false, "It's off."), opt("Check the network cable", false, "It's off."), opt("Hold the power button for ten seconds", false, "That forces a running PC off."), opt("Escalate", false, "Switch it on.")],
      tpm: [opt("Restart into the firmware and switch the TPM on, then save", true),
        opt("Add the registry key that lets Setup skip the TPM check", false, "The TPM is there and switched off. A bypass leaves the PC unsupported."),
        opt("Clean install Windows 11 from the USB", false, "Deletes her files and PayWise, and the TPM is still off."),
        opt("Turn off Secure Boot so Setup goes on", false, "The TPM is what fails, and Mason asked you to leave Secure Boot."),
        opt("Clear the TPM from Windows Security", false, "It's switched off in the firmware: Windows can't see it to clear."),
        opt("Escalate: the PC can't run Windows 11", false, "Its hardware is supported, as Mason said.")],
      media: [opt("Plug the installer USB into Brenda's PC", true), opt("Start the PC from the USB with F12", false, "That's a clean install."), opt("Download Windows 11 from Edge", false, "The installer is on your bench."), opt("Run Windows Update again", false, "Setup from the USB is the job."), opt("Escalate", false, "You have everything you need."), opt("Copy the USB to Brenda's Documents", false, "Run it from the USB.")],
      upgrade: [opt("Run setup.exe from the USB inside Windows, keeping files and apps", true),
        opt("Restart and boot from the USB with F12", false, "That's a clean install."),
        opt("Run setup.exe and keep personal files only", false, "PayWise and her settings would go."),
        opt("Run setup.exe and keep nothing", false, "Everything would be deleted."),
        opt("Add the registry key that skips the checks", false, "The PC meets the requirements now."),
        opt("Turn off Secure Boot first", false, "Not needed, and Mason asked you to leave it.")],
      keep: [opt("Go back and choose Keep personal files and apps", true), opt("Install with personal files only", false, "PayWise would go."), opt("Install, then reinstall PayWise afterwards", false, "Her settings and reports would still be lost."), opt("Choose Nothing", false, "Everything would be deleted."), opt("Close Setup and clean install", false, "Worse."), opt("Escalate", false, "Choose again.")],
      restart: [opt("Restart and let the PC start from the drive", true), opt("Press F12 and choose the USB", false, "That starts a clean install."), opt("Switch the firmware to Legacy (CSM)", false, "Windows wouldn't start."), opt("Take the USB out and shut down", false, "The upgrade finishes as it starts."), opt("Run Setup again", false, "It's ready."), opt("Escalate", false, "It's nearly done.")],
      signin: [opt("Let Brenda sign in", true), opt("Sign in as itadmin to check it", false, "Brenda's own account is the test."), opt("Restart again", false, "It's ready."), opt("Reset Brenda's password", false, "Nothing is wrong with it."), opt("Resolve without signing in", false, "Nobody has seen it work."), opt("Run Setup again", false, "It's done.")],
      test: [opt("Open PayWise and check it works", true), opt("Resolve: Windows 11 is on", false, "She asked for PayWise most."), opt("Reinstall PayWise to be safe", false, "Her settings would go."), opt("Run PC Health Check again", false, "Windows 11 is on: test what she uses."), opt("Ask Brenda to test it next week", false, "Test it now."), opt("Restart again", false, "Not needed.")],
      firmware: [opt("Put the boot settings back as they were, and save", true), opt("Leave them: Windows 11 doesn't need them", false, "Windows needs UEFI to start, and Mason asked for Secure Boot."), opt("Clean install", false, "Her files would go."), opt("Escalate", false, "Put the settings back."), opt("Clear the TPM", false, "Not the problem."), opt("Resolve", false, "It's still Windows 10.")],
      lost: [opt("Revert to your last snapshot", true), opt("Reinstall PayWise from Software Center", false, "Her settings and reports would be gone."), opt("Restore her files from OneDrive", false, "The snapshot puts everything back exactly."), opt("Resolve the ticket", false, "Her things are gone."), opt("Escalate", false, "The snapshot fixes it."), opt("Tell Brenda to set PayWise up again", false, "She asked you not to lose it.")],
      done: [opt("Resolve the ticket", true), opt("Turn the TPM off again", false, "Windows 11 needs it."), opt("Reinstall PayWise", false, "It works."), opt("Escalate", false, "It's done at Tier 1."), opt("Run the upgrade again", false, "It's done."), opt("Restart to be sure", false, "Not needed.")]
    };
    return X[oi2(fleet.WS2)];
  },
  closeWhere: "Think about what Health Check said before and after you changed the firmware.",
  close: { prompt: "Brenda asks: \"Why did it say my PC couldn't run Windows 11, if it could?\" What do you tell her?", options: [
    opt("Its TPM was switched off in the firmware, so Windows couldn't see it", true),
    opt("Its processor was too old until Windows Update fixed the processor's list", false, "Health Check passed the processor from the start. Only the TPM failed."),
    opt("Secure Boot was off, so Windows 11 refused to install over Windows 10", false, "Secure Boot was on throughout, and you didn't change it."),
    opt("Windows 10 had used up the disk, and Windows 11 needs 64 GB free", false, "The storage check passed. The TPM was the only failure."),
    opt("The PC needed a newer TPM chip fitted before it could run Windows 11", false, "Nothing was fitted. The TPM was there, switched off; switching it on fixed it."),
    opt("Windows 10 blocks Windows 11 until its own support has fully ended", false, "Nothing blocked it but the switched-off TPM.")] },
  note: { must: [["tpm"], ["firmware", "bios", "uefi", "f2"], ["keep personal files and apps", "files and apps", "in place", "in-place"], ["paywise"], ["windows 11"]],
    tip: "Why Windows said no, what you changed in the firmware, how you upgraded (and what it kept), and that PayWise works." },
  closeAdvice: "Brenda's on Windows 11 with PayWise working. Now answer her question on the ticket.",
  advice: function (fleet) { const s = oi2(fleet.WS2); return s === "tpm" ? "Mason says the hardware is supported. Find out exactly which requirement Windows says fails, on Brenda's PC, then think about where that's switched on." : "Brenda's own words are the checklist: her files, PayWise, her settings. Upgrade from inside Windows, and read every screen."; }
});

/* ---------------------------------------------------------------------
   OI3 (run): Rosa's reception PC has a 7th-gen Core i5, which isn't on
   Windows 11's supported list. TPM 2.0 and Secure Boot are on. It can't
   be upgraded properly at Tier 1: find out exactly why, change nothing,
   and escalate. Forcing it past the checks is the near miss.
   --------------------------------------------------------------------- */
export const ORDER3 = ["power", "check", "escalate"];
export function oi3State(m) {
  const I = m.inst;
  const looked = lastEv(m, function (e) { return e.kind === "inst-health" || e.kind === "inst-up-blocked"; }) >= 0;
  const c = m.power !== "on" ? "power" : !looked ? "check" : "escalate";
  if (!I.fw.uefi || !I.fw.secureBoot || !I.fw.tpmOn) return { stage: "firmware", score: Math.min(ORDER3.indexOf(c), 1) };
  if ((I.setup && (I.setup.deleted || I.setup.copied)) || (I.up && I.up.copied)) return { stage: "lost", score: 0 };
  return { stage: c, score: ORDER3.indexOf(c) };
}
function oi3(m) { return oi3State(m).stage; }
const OI3 = Object.assign({}, INSTALL, {
  id: "OI3", machine: "WS5", outcome: "escalate",
  title: "Reception PC still on Windows 10: upgrade it",
  from: "Mason, Team Lead",
  brief: ["Mason here. Rosa's reception PC, WS5, is still on Windows 10. Upgrade it in place the way you did Brenda's: her files and the visitor booking app kept.",
    "Rosa's fine with it as long as the booking app still works afterwards. She's at the front desk all day, so you can work at her PC.",
    "WS5 is older than the rest: it came with the reception desk when we moved in."],
  setup: function (fleet) {
    INS.prepare(fleet.WS5, { os: { name: "Windows 10 Pro", version: "22H2" }, hw: { model: "OptiTower 5050", cpu: "Intel Core i5-7500 (7th gen)", cpuOK: false, ramGB: 8 }, licence: "Windows 10 Pro" });
    fleet.WS5.clock = "Oct 6 14:20";
  },
  stage: function (fleet) { return oi3(fleet.WS5); },
  goal: function (fleet) { return oi3(fleet.WS5) === "escalate"; },
  scoreFn: function (fleet) { return oi3State(fleet.WS5).score; },
  notReady: function (fleet) { const s = oi3(fleet.WS5); return s === "check" || s === "power" ? "Tier 2 asks: \"What exactly stops it? Did you check the PC against Windows 11's requirements?\"" : s === "firmware" ? "Tier 2 asks why WS5's firmware security settings were changed." : "Tier 2 asks what happened to Rosa's PC."; },
  judge: function (act, fleet, before) {
    const m = fleet.WS5, I = m.inst;
    if (act.machine && act.machine !== "WS5") return { guess: false };
    if (act.type === "cmd" && BYPASS.test(String(act.line || ""))) return { guess: true, say: "That forces Windows 11 onto a processor Microsoft doesn't support. Such a PC isn't entitled to updates, and may stop getting them. That's not a Tier 1 decision to make by yourself." };
    if (act.type !== "osinst") return { guess: false };
    const r = act.res || {};
    if (act.op === "fw-save" && r.changed && (!I.fw.uefi || !I.fw.secureBoot || !I.fw.tpmOn)) return { guess: true, say: "Turning firmware security off doesn't make the processor supported, and Windows 11 needs UEFI and TPM 2.0 on." };
    if (act.op === "ws-option" && r.ok) return { guess: true, say: "A clean install would delete Rosa's files and the booking app." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      power: ["Look at the tower's power light.", "Nothing happens on a switched-off PC."],
      check: ["Before you change anything, find out whether this PC can run Windows 11 at all, and why.", "Windows 11 has hardware requirements. Check every one against this PC."],
      escalate: ["Read what failed. Is it something switched off, or the hardware itself?", "A requirement the hardware itself doesn't meet can't be fixed with a setting. Changing hardware, or staying on an old version, is a decision above Tier 1."],
      firmware: ["Look at what you changed in the firmware.", "Put back what you changed: security settings aren't the problem here."],
      lost: ["What's on Rosa's PC now?", "Go back to the last point you had right."]
    };
    return H[oi3(fleet.WS5)];
  },
  moves: function (fleet) {
    const X = {
      power: [opt("Press the power button", true), opt("Connect to it remotely", false, "It's off."), opt("Plug in the USB", false, "It's off."), opt("Check the network cable", false, "It's off."), opt("Escalate now", false, "Check it first."), opt("Resolve", false, "Nothing is done.")],
      check: [opt("Run PC Health Check on WS5 and read every line", true),
        opt("Add the registry key that skips the CPU check, then run Setup", false, "Forcing it past the checks, before you even know why it fails."),
        opt("Clean install Windows 11 from the USB", false, "Deletes Rosa's files and the booking app."),
        opt("Turn the TPM off and on in the firmware", false, "Guessing at a setting before you know what fails."),
        opt("Escalate without checking", false, "Tier 2 will ask what exactly fails."),
        opt("Resolve: tell Mason it's done", false, "It's still on Windows 10.")],
      escalate: [opt("Escalate with what Health Check found: the processor isn't supported", true),
        opt("Add the registry key that skips the CPU check", false, "Unsupported, and the PC may stop getting updates."),
        opt("Use a modified installer that skips the checks", false, "Same: unsupported, and not your decision."),
        opt("Turn off Secure Boot so Setup goes on", false, "The processor fails, not Secure Boot."),
        opt("Clean install Windows 11 from the USB", false, "Setup refuses the same processor, and Rosa's files go."),
        opt("Resolve: Windows 10 is fine as it is", false, "Windows 10 is out of support: someone has to decide what happens.")],
      firmware: [opt("Put the firmware settings back and save", true), opt("Leave them", false, "They weren't the problem."), opt("Escalate as it is", false, "Put back what you changed first."), opt("Clean install", false, "Rosa's files would go."), opt("Clear the TPM", false, "Not the problem."), opt("Resolve", false, "Nothing is done.")],
      lost: [opt("Revert to your last snapshot", true), opt("Reinstall the booking app", false, "The snapshot is exact."), opt("Resolve", false, "Her things are gone."), opt("Escalate as it is", false, "Put it back first."), opt("Restore from OneDrive", false, "The snapshot is exact."), opt("Set it up again", false, "The snapshot is exact.")]
    };
    return X[oi3(fleet.WS5)];
  },
  closeWhere: "Think about exactly which requirement failed, and whether a setting could change it.",
  close: { prompt: "Write it up for Tier 2: what stops WS5 moving to Windows 11?", options: [
    opt("Its Core i5-7500 isn't on Windows 11's supported processor list", true),
    opt("Its TPM is switched off in the firmware, which Tier 1 isn't allowed to change", false, "Health Check passed the TPM: it's on. That was Brenda's PC, not Rosa's."),
    opt("Secure Boot is off, and it needs a firmware update before it can be turned on", false, "Health Check passed Secure Boot."),
    opt("It has 8 GB of memory, and Windows 11 needs at least 16 GB to install", false, "Windows 11 needs 4 GB. Memory passed."),
    opt("Its disk is MBR, and needs converting to GPT before the upgrade", false, "Nothing said that: it starts in UEFI mode, and the disk check passed."),
    opt("Its Windows 10 licence doesn't cover an upgrade to Windows 11 Pro", false, "Licensing wasn't the problem. The processor check failed.")] },
  note: { must: [["i5-7500", "7th", "processor", "cpu"], ["supported", "list"], ["health check", "requirements"], ["tpm", "secure boot"]],
    tip: "Exactly which requirement failed and how you know, that the rest (TPM, Secure Boot) passed, and that nothing was forced or changed." },
  closeAdvice: "Now write it up for Tier 2: exactly what stops WS5 moving to Windows 11.",
  advice: function () { return "Before you change anything on Rosa's PC, find out whether it can run Windows 11 at all, and exactly why not. Then decide whether that's something Tier 1 can fix."; }
});

/* ---------------------------------------------------------------------
   OI4 (run): Ubuntu 24.04 LTS alongside Windows on Dev's PC. Make room
   from Windows (Disk Management: shrink C:, leave the space unallocated),
   start the Ubuntu USB, Install Ubuntu alongside Windows Boot Manager
   (never Erase disk), the computer name from Mason's note, then check
   both systems start from GRUB's menu.
   --------------------------------------------------------------------- */
const WANT = 95;   /* GB: Dev asked for "about 100 GB" */
export const ORDER4 = ["power", "space", "media", "boot", "installer", "type", "account", "install", "ubuntu", "windows", "done"];
function freeOK(m) { return INS.freeGB(m) >= WANT; }
function oi4core(m) {
  const I = m.inst, U = I.ub || {}, L = I.lx;
  if (m.power !== "on") return "power";
  if (L && L.installed) {
    const at = lastEv(m, function (e) { return e.kind === "inst-ub-install"; });
    if (!(lastEv(m, function (e) { return e.kind === "inst-ub-signin"; }) > at)) return "ubuntu";
    if (!(lastEv(m, function (e) { return e.kind === "inst-grub" && e.pick === "windows"; }) > at)) return "windows";
    return "done";
  }
  if (!I.ub) { if (!freeOK(m)) return "space"; if (I.media !== "ubuntu") return "media"; return "boot"; }
  if (["try", "lang", "what", "how", "manual"].indexOf(U.step) >= 0 && !freeOK(m)) return "space";
  if (["try", "lang", "what"].indexOf(U.step) >= 0) return "installer";
  if (U.step === "how" || U.step === "manual") return "type";
  if (U.step === "account") return "account";
  return "install";
}
function overWindows(m) { const U = m.inst.ub || {}, p = U.how === "manual" && U.target != null ? m.disks[0].parts[U.target] : null; return U.how === "erase" || !!(p && p.kind === "os"); }
export function oi4State(m) {
  const I = m.inst, U = I.ub || {}, L = I.lx, c = oi4core(m); let st = c, cap = ORDER4.length;
  const ix = function (s) { return ORDER4.indexOf(s); };
  if (L && L.installed && !I.os) { st = "wiped"; cap = ix("type"); }
  else if (!L && overWindows(m)) { st = "type"; cap = ix("type"); }
  else if (m.disks[0].parts.some(function (p) { return p.kind === "data" && p.label === "New Volume"; })) { st = "volume"; cap = ix("space"); }
  else if (!I.fw.uefi || !I.fw.secureBoot) { st = "firmware"; cap = ix("boot"); }
  else if (L && L.installed && L.host !== INS.LX.host) { st = "hostname"; cap = ix("account"); }
  else if (!L && U.host && U.host !== INS.LX.host) { st = "account"; cap = ix("account"); }
  return { stage: st, score: Math.min(ix(c), cap) };
}
function oi4(m) { return oi4State(m).stage; }
const OI4 = Object.assign({}, INSTALL, {
  id: "OI4", machine: "WS3", media: "ubuntu",
  title: "Ubuntu alongside Windows on my PC, please",
  from: "Dev Patel, Dev",
  brief: ["Hi, Dev again. The new build pipeline needs Ubuntu, and I'd rather not have two PCs on my desk. Can you put Ubuntu 24.04 LTS on my PC alongside Windows? I still need Windows every day, with everything on it exactly as it is. About 100 GB for Ubuntu is plenty.",
    "I'm in the design review all morning, so work at my desk. Leave both ready for me to sign in.",
    "Mason's note on the ticket: the Ubuntu 24.04 LTS USB is on your bench. Ubuntu should only get space that Windows has given up. Its computer name is ws3-dev-ubuntu, username dev. Ubuntu starts fine with Secure Boot on, so leave the firmware's security settings alone."],
  setup: function (fleet) {
    INS.prepare(fleet.WS3, { os: { name: "Windows 11 Pro", version: "24H2" }, licence: "Windows 11 Pro" });
    fleet.WS3.inst.usedGB = 180; fleet.WS3.clock = "Oct 7 09:05";
  },
  stage: function (fleet) { return oi4(fleet.WS3); },
  goal: function (fleet) { return oi4(fleet.WS3) === "done"; },
  scoreFn: function (fleet) { return oi4State(fleet.WS3).score; },
  notReady: function (fleet) {
    const s = oi4(fleet.WS3);
    if (s === "wiped") return "Dev: \"Where's Windows? Where's everything I had?\"";
    if (s === "ubuntu") return "Mason: \"Have you seen Ubuntu start and sign in yet?\"";
    if (s === "windows") return "Mason: \"And Windows? Dev needs it every day. Have you seen it start since?\"";
    if (s === "hostname") return "Mason checks the network: there's no ws3-dev-ubuntu on it.";
    return "Dev's PC still only has Windows on it.";
  },
  judge: function (act, fleet, before) {
    const m = fleet.WS3, I = m.inst;
    if (act.machine && act.machine !== "WS3") return { guess: false };
    if (act.type !== "osinst") return { guess: false };
    const r = act.res || {};
    if (act.op === "newvol" && r.ok) return { guess: true, say: "That gave the space back to Windows as an NTFS volume. Ubuntu's installer needs it left unallocated." };
    if (act.op === "shrink" && r.ok && INS.freeGB(m) < WANT) return { guess: true, say: "That leaves " + Math.round(INS.freeGB(m)) + " GB unallocated. Dev asked for about 100 GB." };
    if (act.op === "fw-save" && r.changed && (!I.fw.uefi || !I.fw.secureBoot)) return { guess: true, say: !I.fw.uefi ? "Legacy (CSM) boot: Windows was installed for UEFI and won't start this way." : "Ubuntu's boot loader is signed: it starts with Secure Boot on. Mason asked you to leave it alone." };
    if (act.op === "ub-how" && act.how === "erase") return { guess: true, say: "Erase disk deletes everything on the drive, Windows and Dev's files included. Dev still needs Windows every day." };
    if (act.op === "ub-manual" && r.ok && r.overWindows) return { guess: true, say: "That partition is Windows. Using it for Ubuntu would format it: Windows and everything on it would be gone." };
    if (act.op === "ub-account" && r.ok && r.host !== INS.LX.host) return { guess: true, say: r.host + " isn't the computer name in Mason's note." };
    return { guess: false };
  },
  hints: function (fleet) {
    const H = {
      power: ["Look at the tower's power light.", "Nothing happens on a switched-off PC."],
      space: ["Ubuntu needs somewhere to go. Where is there free space on Dev's drive right now?", "Space for a second system comes from the first one giving some up, from inside that system, before the installer starts."],
      volume: ["Look at what's in the space you made.", "The installer installs into space no system is using. A new volume is Windows using it again."],
      media: ["The installer is on your bench.", "A PC can only start an installer that's plugged into it."],
      boot: ["Read the start-up screen: one key lets you choose what to start from, just this once.", "Starting from a USB doesn't need the firmware's settings changed."],
      firmware: ["Read Mason's note about the firmware, then look at it.", "Put back what you changed. A signed boot loader starts with the security settings on."],
      installer: ["Read each screen of the installer.", "The first screens are about language and what you want to do: trying it changes nothing."],
      type: ["Read each choice on this screen, and its warning, word for word.", "Only one choice here keeps what's already on the drive."],
      account: ["Mason's note has the names.", "A computer's name is how the network finds it, so it has to be the one everybody uses."],
      install: ["Check the summary against Dev's request, then go on.", "The summary is the last look before the installer writes to the drive."],
      ubuntu: ["Is Ubuntu really working? Start it and see.", "An install isn't finished until you've seen the new system start and sign in."],
      hostname: ["Compare Ubuntu's computer name with Mason's note.", "Linux sets its computer name from its own terminal, with administrator rights."],
      windows: ["Dev needs Windows every day. Has it started since Ubuntu went on?", "After adding a second system, check the first one still starts too."],
      wiped: ["What's left of Windows on the drive?", "Go back to the last point you had right."],
      done: ["Both systems start. Close it out on Help Desk.", "The close question is about choosing between the two systems at start-up."]
    };
    return H[oi4(fleet.WS3)];
  },
  moves: function (fleet) {
    const X = {
      power: [opt("Press the power button", true), opt("Connect to it remotely", false, "It's off."), opt("Plug in the USB and wait", false, "It's off."), opt("Check the network cable", false, "It's off."), opt("Hold the power button for ten seconds", false, "That forces a running PC off."), opt("Escalate", false, "Switch it on.")],
      space: [opt("Shrink C: by about 100 GB in Disk Management, leaving it unallocated", true),
        opt("Make a 100 GB NTFS volume for Ubuntu", false, "Ubuntu can't install into a Windows volume; it needs the space unallocated."),
        opt("Delete the Recovery partition to make room", false, "Windows needs it to repair itself, and it's under 1 GB."),
        opt("Let Ubuntu's installer erase the disk", false, "That deletes Windows and everything on it."),
        opt("Format C: to free up space", false, "That deletes Windows."),
        opt("Turn off Secure Boot first", false, "Not needed: Ubuntu starts with it on, and it doesn't make space.")],
      volume: [opt("Delete the new volume, so the space is unallocated again", true), opt("Install Ubuntu onto the new volume as NTFS", false, "Ubuntu's root needs a Linux file system."), opt("Let the installer erase the disk", false, "Windows would go."), opt("Shrink C: again", false, "There's enough space: it just isn't free."), opt("Format the new volume as FAT32", false, "Still a Windows volume, still in the way."), opt("Leave it: the installer will use it", false, "It won't offer it alongside Windows.")],
      media: [opt("Plug in the Ubuntu 24.04 LTS USB", true), opt("Download Ubuntu in Edge", false, "The installer is on your bench."), opt("Install Ubuntu from the Microsoft Store", false, "That's WSL, inside Windows, not a second system."), opt("Restart and press F12 first", false, "There's nothing to start from yet."), opt("Use the Windows 11 USB", false, "Wrong installer."), opt("Escalate", false, "You have what you need.")],
      boot: [opt("Restart, press F12 and choose the UEFI USB entry", true), opt("Turn off Secure Boot so the USB starts", false, "Ubuntu's boot loader is signed: it starts with Secure Boot on."), opt("Switch to Legacy (CSM) boot", false, "Windows was installed for UEFI and won't start that way."), opt("Move the USB to the top of the boot order for good", false, "The boot menu does it once, without changing the firmware."), opt("Run the installer from inside Windows", false, "Ubuntu's installer runs from the USB as the PC starts."), opt("Choose Network boot (PXE)", false, "No deployment server.")],
      firmware: [opt("Set the firmware back as it was, and save", true), opt("Leave it: Ubuntu needs it off", false, "Ubuntu's boot loader is signed."), opt("Clear the TPM", false, "Not the problem."), opt("Reinstall Windows", false, "Put the setting back."), opt("Escalate", false, "Put the setting back."), opt("Resolve", false, "Nothing is installed yet.")],
      installer: [opt("Work through the installer's first screens and choose Install Ubuntu", true), opt("Choose Try Ubuntu and copy it to the disk", false, "Trying runs it from the USB; it installs nothing."), opt("Choose Ubuntu (safe graphics)", false, "Only for a screen that won't display."), opt("Restart and boot Windows", false, "Ubuntu isn't installed yet."), opt("Turn off Secure Boot", false, "Not needed."), opt("Escalate", false, "It's going fine.")],
      type: [opt("Choose Install Ubuntu alongside Windows Boot Manager", true),
        opt("Choose Erase disk and install Ubuntu", false, "Deletes Windows and everything on it."),
        opt("Manual: format the Windows partition as ext4 for /", false, "That's Windows: it would be wiped."),
        opt("Manual: use the free space as FAT32 for /", false, "The root must be a Linux file system."),
        opt("Manual: use the free space as swap", false, "Swap is memory overflow, not where Ubuntu lives."),
        opt("Go back and Try Ubuntu", false, "Trying installs nothing.")],
      account: [opt("Use the computer name and username in Mason's note", true), opt("Call it WS3-DEV, the same as Windows", false, "Two computers, one name: the network can't tell them apart. And Ubuntu names are lower case."), opt("Leave the name Ubuntu suggests", false, "The network won't know it."), opt("Use Dev's Windows password as the username", false, "Never. And it isn't a username."), opt("Make the username Administrator", false, "Not how Linux works: Dev's account gets sudo."), opt("Skip the account", false, "It can't be skipped.")],
      install: [opt("Check the summary, then Install", true), opt("Go back and erase the disk instead", false, "Windows would go."), opt("Take the USB out first", false, "The installer copies from it."), opt("Restart without installing", false, "Nothing would be installed."), opt("Turn off Secure Boot first", false, "Not needed."), opt("Escalate", false, "It's ready.")],
      ubuntu: [opt("Restart, choose Ubuntu in the boot menu, and let Dev sign in", true), opt("Resolve: the installer said it worked", false, "You haven't seen it start."), opt("Choose Windows first", false, "Check the new system first."), opt("Boot the USB again", false, "Ubuntu is on the drive now."), opt("Reinstall to be sure", false, "It's installed."), opt("Turn off Secure Boot to start it", false, "It starts with Secure Boot on.")],
      hostname: [opt("Set the name with sudo hostnamectl set-hostname in the Terminal", true), opt("Reinstall Ubuntu with the right name", false, "One command renames it."), opt("Rename it in Windows' System Properties", false, "That renames Windows, not Ubuntu."), opt("Run hostnamectl set-hostname without sudo", false, "Access denied: it needs administrator rights."), opt("Ask Mason to change DNS instead", false, "The PC's name is what's wrong."), opt("Leave it", false, "The network can't find it.")],
      windows: [opt("Restart, choose Windows Boot Manager in GRUB, and check Windows starts", true), opt("Resolve: Windows was there before", false, "Check it still starts now."), opt("Press F12 and boot the drive's Windows entry", false, "GRUB's menu is how Dev will choose."), opt("Reinstall Windows' boot loader", false, "Nothing is broken."), opt("Boot the Windows USB", false, "Not needed."), opt("Remove Ubuntu to be safe", false, "Dev asked for both.")],
      wiped: [opt("Revert to your last snapshot", true), opt("Reinstall Windows from the USB", false, "Dev's files and apps would still be gone."), opt("Restore Dev's files from OneDrive", false, "The snapshot puts everything back."), opt("Resolve: Ubuntu works", false, "Windows is gone."), opt("Escalate", false, "The snapshot fixes it."), opt("Tell Dev to use the meeting room PC", false, "Put it back.")],
      done: [opt("Resolve the ticket", true), opt("Reinstall Ubuntu to be sure", false, "It works."), opt("Turn off Secure Boot for speed", false, "Never."), opt("Delete the Recovery partition", false, "Windows needs it."), opt("Escalate", false, "It's done at Tier 1."), opt("Remove GRUB", false, "Then Ubuntu won't start.")]
    };
    return X[oi4(fleet.WS3)];
  },
  closeWhere: "Think about the first thing the PC shows now, each time it starts.",
  close: { prompt: "Dev asks: \"When I switch it on, how do I choose Windows or Ubuntu?\" What do you tell Dev?", options: [
    opt("GRUB, Ubuntu's boot loader, shows a menu of both every time it starts", true),
    opt("Press F12 at start-up and pick the drive with the system you want", false, "Both are on the same drive. F12 picks a device; GRUB's menu picks the system."),
    opt("Windows Boot Manager lists both now, because Ubuntu was added to it", false, "Ubuntu's GRUB starts first now, and it lists Windows, not the other way round."),
    opt("Change the boot order in the firmware each time you want the other one", false, "Not needed: GRUB offers both every time."),
    opt("Hold Shift while Windows starts to switch over to Ubuntu", false, "Shift with Restart opens Windows' recovery options, not Ubuntu."),
    opt("Ubuntu runs inside Windows now, as an app in the Start menu", false, "That's WSL, which is different. This is a second system on its own partition.")] },
  note: { must: [["shrink", "disk management"], ["alongside", "unallocated"], ["grub", "boot menu"], ["ws3-dev-ubuntu"], ["windows"]],
    tip: "How you made room, how you installed (and why not Erase disk), the names, and that both systems start." },
  closeAdvice: "Both systems start. Now answer Dev's question on the ticket.",
  advice: function (fleet) { const s = oi4(fleet.WS3); return s === "space" || s === "volume" ? "Ubuntu needs a place of its own on Dev's drive, and right now Windows has all of it. Mason's note says where that space has to come from." : "Read every installer screen, and every warning on it, word for word. Dev needs Windows every day."; }
});
export const INSTALL_TICKETS = [OI1, OI2, OI3, OI4];
