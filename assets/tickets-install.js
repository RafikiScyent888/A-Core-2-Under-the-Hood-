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
      if (!f.secureBoot) return { guess: true, say: "Secure Boot is off. Windows 11 needs it, and Mason asked you to leave the firmware's security settings alone." };
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
      firmware: ["Read Mason's note about the firmware, then look at its security settings.", "Windows 11 needs UEFI boot, Secure Boot and TPM 2.0. Turning any of them off is never how to install it."],
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
        opt("Leave it: Windows 11 installs without them", false, "Setup checks for UEFI, Secure Boot and TPM 2.0 before it installs."),
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
        opt("Turn off Secure Boot first", false, "Not needed, and Windows 11 needs it."),
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
OI1.advice = function (fleet) {
  const s = stage(fleet.WS3);
  if (ORDER.indexOf(s) <= ORDER.indexOf("restart")) return "Everything on this job happens at Dev's desk: the PC is off and its drive is empty. The installer is on your bench. Read every screen word for word.";
  if (ORDER.indexOf(s) <= ORDER.indexOf("privacy")) return "Windows' first-run setup asks one question per screen. Mason's note has the answers that matter: the name, and that it goes on the RAFIKI domain.";
  return "Windows is in. Mason's note has what's left: the domain, and who joins PCs to it. Then Dev signs in.";
};
export const INSTALL_TICKETS = [OI1];
