/* =====================================================================
   Windows Tools Console — the jobs and the stages.

   SIX JOBS, one base and the owner's standing five more. Each job is one
   office, one customer, one PC, and it runs through every core stage, so
   the four stages are one visit rather than four unrelated exercises.
   The jobs differ where it matters, and the differences are near misses
   on purpose:

     slow    the busiest process is the one to end in two jobs, must NOT
             be ended in three, and is malware in one
     admin   sfc alone; sfc after DISM; chkdsk and a restart first; a
             restart first; sfc finds NOTHING; a standard user who needs
             the technician's credentials to elevate at all
     disk    a plain drive; a split into two volumes; a drive that comes
             up Offline; a drive carrying an old volume; a drive letter
             the scanner insists on — and every one of them is over 2 TiB,
             so MBR is always the trap

   The requirement that decides each stage is buried in the customer's
   own words in the brief. That is the "reading the scenario" gap, and it
   is deliberate.

   Declarative: a stage says what to show and what counts as done. It
   never touches the page. runner.js draws it; verify/ drives it headless.
   ===================================================================== */
import * as M from "./machine.js";

const G = M.GiB;
const gb = function (bytes) { return Math.round(bytes / G * 100) / 100; };

/* ------------------------------------------------------------------ */
/*  THE JOBS                                                           */
/* ------------------------------------------------------------------ */
export const JOBS = [
  {
    key: "harbourside", name: "Harbourside Vets", who: "Dana Morales", role: "front desk", user: "dmorales", host: "RECEPTION-01",
    ram: 4096, userIsAdmin: true,
    brief: [
      "Hi \u2014 it\u2019s Dana at Harbourside Vets, on the front desk. Sorry, this is a long one.",
      "The reception PC has been like wading through treacle since about half eight this morning. It was fine last night when I shut it down. Everything takes an age \u2014 I\u2019ve got the booking system, email and about a hundred browser tabs open, I know, I know.",
      "Also, and this might be separate: ever since the power cut last Tuesday, the Settings app and the Snipping Tool close themselves the moment they open. My nephew said \u2018a scan\u2019 might fix it, but I didn\u2019t want to break anything so I left it for you.",
      "And while you\u2019re here, we bought a 4 TB drive for the X-ray images, because the practice software is filling C: up. It\u2019s still in its box on the desk. He says whatever you do, don\u2019t set it up so it only shows 2 TB, like the one at his work."
    ],
    desk: {
      correct: "The Settings problem started after a power cut",
      wrong: [
        ["The PC has been slow since the power cut", "She puts the slowness at half eight THIS morning. The power cut was last Tuesday, and she says herself the two might be separate."],
        ["The new drive is already fitted and just needs setting up", "It is still in its box on the desk."],
        ["She has already run a scan and it did not help", "Her nephew suggested a scan. She says she did NOT run one, because she did not want to break anything."],
        ["Only the practice software is slow", "She says everything takes an age."],
        ["The new drive is to replace C:", "It is for the X-ray images because C: is filling up \u2014 extra space, not a replacement."]
      ],
      where: "Read what she says about Tuesday and what she says about this morning as two separate things.",
      principle: "Keep what the customer SAID apart from what you would have guessed. A time, a place or a cause they actually state is evidence; anything you filled in yourself is not."
    },
    slow: {
      column: "mem", culprit: "edge",
      procs: [
        { name: "msedge.exe", desc: "Microsoft Edge (38)", image: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", cpu: 5.8, mem: 2410, disk: 0.3, group: "edge", window: true, tag: "edge", publisher: "Microsoft Corporation", parent: "explorer.exe" },
        { name: "VetBook.exe", desc: "VetBook Practice Manager", image: "C:\\Program Files\\VetBook\\VetBook.exe", cpu: 3.1, mem: 380, disk: 0.2, window: true, tag: "biz", publisher: "VetBook Systems Ltd", parent: "explorer.exe" },
        { name: "OUTLOOK.EXE", desc: "Microsoft Outlook", image: "C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE", cpu: 1.2, mem: 290, disk: 0.1, window: true, tag: "mail", publisher: "Microsoft Corporation", parent: "explorer.exe" },
        { name: "OneDrive.exe", desc: "Microsoft OneDrive", image: "C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe", cpu: 0.4, mem: 88, disk: 0.1, tag: "onedrive", publisher: "Microsoft Corporation", parent: "explorer.exe" }
      ],
      remedies: {
        correct: ["end-app", "End task on Edge; reopen only the tabs she uses", "Close Edge and reopen only the tabs she actually uses. 2.4 GB of tabs on a 4 GB PC is the whole problem."],
        wrong: [
          ["cpu", "End whatever is using the most CPU", "Sort by CPU and look: nothing is busy. This PC is short of MEMORY \u2014 the Memory column is what is in the nineties."],
          ["restart", "Restart the PC", "It clears memory for an hour, and then she opens the same 38 tabs. That treats the symptom, not the cause."],
          ["cleanup", "Run Disk Cleanup to free space on C:", "Disk space is not memory. Free space on C: changes nothing about what is in RAM."],
          ["biz", "End VetBook, the practice software", "It is using a few hundred MB, and it is the thing she is at work to use."],
          ["startup", "Stop Edge from opening itself every time Windows starts", "Edge did not start itself; she opened those tabs. Startup settings change nothing about what she opens during the day."],
          ["malware", "Disconnect it from the network \u2014 this looks like malware", "Every process here runs from where it should and is signed by who you would expect. Busy is not malicious."]
        ]
      },
      act: { kind: "end", tag: "edge", prompt: "Now do it: end Edge from Task Manager." },
      facts: "Edge's 38 tabs are 2,410 MB on a PC with 4 GB of RAM. When RAM is full, Windows pages to disk, and every app waits on the disk."
    },
    admin: { variant: "sfc", sys: { corrupt: 4 } },
    disk: { model: "WDC WD40EFPX", bytes: 4000787030016, label: "X-rays", need: { volumes: 1 } }
  },
  {
    key: "keel", name: "Keel & Rudder Accountants", who: "Priya Natarajan", role: "partner", user: "pnatarajan", host: "KR-OFFICE-02",
    ram: 16384, userIsAdmin: true,
    brief: [
      "Priya here, at Keel & Rudder. The office manager\u2019s PC is crawling, and we have deadlines this week.",
      "The little disk light on the front hasn\u2019t stopped flickering since Frank set up OneDrive for her yesterday afternoon and pointed it at the whole client archive \u2014 forty-odd gigabytes of it.",
      "There\u2019s also something wrong with Settings \u2014 it just closes. The same thing happened on the partners\u2019 laptop last month and Frank fixed that one with \u2018some command\u2019, but he\u2019s off today and I don\u2019t know which.",
      "The new 6 TB drive is for the scanned returns. It\u2019s still in the anti-static bag under the monitor stand. Frank said to split it: 1 TB for the scanner\u2019s working folder, and everything else for the returns themselves."
    ],
    desk: {
      correct: "OneDrive began syncing the whole archive yesterday afternoon",
      wrong: [
        ["The PC has been slow since this morning", "She ties it to yesterday afternoon, when OneDrive was set up."],
        ["Frank has already fixed this PC\u2019s Settings problem", "Frank fixed the partners\u2019 LAPTOP, last month. This PC is still broken."],
        ["The new drive is already fitted", "It is still in its anti-static bag under the monitor stand."],
        ["The archive is going onto the new drive", "The drive is for the scanned returns. The archive is what OneDrive is syncing."],
        ["The new drive should be one big volume", "Frank asked for it split: 1 TB for the scanner\u2019s working folder, the rest for the returns."]
      ],
      where: "Read what she says about when the disk light started, and who fixed which machine.",
      principle: "Separate what happened to THIS PC from what happened to other machines in the story. Customers mention the laptop, the other office, last month \u2014 and those are not this job."
    },
    slow: {
      column: "disk", culprit: "onedrive",
      procs: [
        { name: "OneDrive.exe", desc: "Microsoft OneDrive", image: "C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe", cpu: 4.2, mem: 210, disk: 38.4, tag: "onedrive", publisher: "Microsoft Corporation", parent: "explorer.exe" },
        { name: "EXCEL.EXE", desc: "Microsoft Excel", image: "C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE", cpu: 2.0, mem: 540, disk: 0.2, window: true, tag: "excel", publisher: "Microsoft Corporation", parent: "explorer.exe" },
        { name: "TaxCalc.exe", desc: "TaxCalc Practice", image: "C:\\Program Files (x86)\\TaxCalc\\TaxCalc.exe", cpu: 6.5, mem: 420, disk: 0.4, window: true, tag: "biz", publisher: "TaxCalc Ltd", parent: "explorer.exe" },
        { name: "msedge.exe", desc: "Microsoft Edge (6)", image: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", cpu: 1.5, mem: 610, disk: 0.1, group: "edge", window: true, tag: "edge", publisher: "Microsoft Corporation", parent: "explorer.exe" }
      ],
      remedies: {
        correct: ["pause", "Pause OneDrive until tonight; let it sync overnight", "Pause OneDrive syncing during the day and let the first sync finish overnight."],
        wrong: [
          ["end-app", "End OneDrive in Task Manager", "It starts again at the next sign-in and carries on with the same 40 GB. Pausing does the same job and leaves her in control of when it runs."],
          ["cpu", "End whatever is using the most CPU", "That is the tax software, at a few percent. The column that is pegged is DISK."],
          ["chkdsk", "Run chkdsk \u2014 the disk light means the disk is failing", "A flickering light is activity, not errors. The drive is busy, not broken."],
          ["restart", "Restart the PC", "OneDrive resumes the sync the moment she signs back in. Nothing changes."],
          ["delete", "Delete the archive from OneDrive to stop the sync", "That deletes the firm\u2019s client archive to fix a slowdown. The sync is wanted; only its timing is the problem."],
          ["malware", "Disconnect it from the network \u2014 this is malware", "OneDrive is signed by Microsoft, runs from Program Files, and is doing exactly what Frank set it up to do."]
        ]
      },
      act: null,
      facts: "A first sync reads and uploads every file once. Forty gigabytes through one disk keeps it at 100% for hours, and every other program queues behind it."
    },
    admin: { variant: "dism", sys: { corrupt: 6, storeCorrupt: true } },
    disk: { model: "WDC WD60EFPX", bytes: 6001175126016, label: "Returns", need: { volumes: 2, firstGB: 1024 } }
  },
  {
    key: "ridgeline", name: "Ridgeline Physiotherapy", who: "Tom Okafor", role: "clinic owner", user: "tokafor", host: "TREATMENT-3",
    ram: 8192, userIsAdmin: true,
    brief: [
      "Tom, Ridgeline Physio. Morning! Our treatment-room PC has been sluggish since I switched it on at eight.",
      "It asked about updates last night and I clicked \u2018later\u2019 like I always do \u2014 but this morning it seemed to be getting on with something by itself anyway.",
      "Since the thunderstorm knocked the power out on Friday, a couple of programs throw errors when they open, and Windows put up something about errors on the drive.",
      "There\u2019s a 3 TB drive in a box for backing up the patient notes. And please don\u2019t restart it while I\u2019ve a patient in \u2014 well, do what you have to, just tell me first."
    ],
    desk: {
      correct: "The PC lost power during a storm on Friday",
      wrong: [
        ["The slowness started with the storm on Friday", "He says it has been sluggish since he switched it on at EIGHT this morning."],
        ["The updates were installed last night", "He clicked \u2018later\u2019 last night. Whatever is happening started this morning."],
        ["He has forbidden restarting the PC", "He asks to be TOLD first, and says to do what you have to."],
        ["The new drive is for X-ray images", "He says it is for backing up the patient notes."],
        ["Windows has said nothing about the drive", "He remembers Windows saying something about errors on the drive after the storm."]
      ],
      where: "He mentions three different times. Match each thing that went wrong to its own time.",
      principle: "When a brief has several problems, date each one. Problems that started at different times usually have different causes, however close together they are told."
    },
    slow: {
      column: "cpu", culprit: "update",
      procs: [
        { name: "TiWorker.exe", desc: "Windows Modules Installer Worker", image: "C:\\Windows\\WinSxS\\amd64_microsoft-windows-servicingstack_31bf3856ad364e35_10.0.22621.4313_none_7f8a0e3c9c1d5e21\\TiWorker.exe", cpu: 31.5, mem: 180, disk: 6.4, tag: "update", publisher: "Microsoft Windows", parent: "svchost.exe",
          onEnd: { effect: "update-failed", say: "Windows Modules Installer Worker has been ended. The update it was installing has failed (0x800f0922). Windows Update will try again later \u2014 and the slowdown will come back with it." } },
        { name: "svchost.exe", desc: "Service Host: Windows Update", image: "C:\\Windows\\System32\\svchost.exe", cpu: 6.2, mem: 96, disk: 2.1, hosts: "wuauserv", tag: "wu", publisher: "Microsoft Windows", parent: "services.exe", user: "SYSTEM" },
        { name: "PhysioNotes.exe", desc: "PhysioNotes Clinic", image: "C:\\Program Files\\PhysioNotes\\PhysioNotes.exe", cpu: 2.4, mem: 350, disk: 0.2, window: true, tag: "biz", publisher: "PhysioNotes Ltd", parent: "explorer.exe" },
        { name: "msedge.exe", desc: "Microsoft Edge (4)", image: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", cpu: 1.1, mem: 430, disk: 0.1, group: "edge", window: true, tag: "edge", publisher: "Microsoft Corporation", parent: "explorer.exe" }
      ],
      remedies: {
        correct: ["leave", "Leave it: an update is installing. Warn Tom not to switch off", "Leave it running: Windows is installing an update. Tell Tom not to switch off until it finishes."],
        wrong: [
          ["end-app", "End Windows Modules Installer Worker \u2014 it is the busiest", "Ending it fails the update half-way. Windows tries again later, so the slowdown comes back, and a half-applied update is a risk of its own."],
          ["wu", "Stop the Windows Update service so it can never do this to him again", "That trades today\u2019s slowdown for a PC that never gets security fixes. The fix is WHEN updates run, not whether."],
          ["restart", "Restart the PC to clear it", "A restart part-way through an install can leave the update to undo itself on the way back up \u2014 slower, not faster."],
          ["cleanup", "Run Disk Cleanup to clear old updates", "Cleanup removes superseded files later. It does nothing for an install that is running now."],
          ["biz", "End PhysioNotes, which is using the most memory", "Sort by CPU: the load is the installer, not the clinic software, and memory is not what is short here."],
          ["malware", "Disconnect it from the network \u2014 this is malware", "TiWorker runs from WinSxS, is signed by Microsoft Windows, and was started by the servicing stack. It is exactly what it says it is."]
        ]
      },
      act: null,
      facts: "Windows Modules Installer Worker (TiWorker.exe) unpacks and applies updates. It is heavy for a while and then it stops; ending it only postpones it."
    },
    admin: { variant: "chkdsk", sys: { corrupt: 3, fsErrors: true } },
    disk: { model: "ST3000VN006", bytes: 3000592982016, label: "PatientBackup", need: { volumes: 1 } }
  },
  {
    key: "northgate", name: "Northgate Print", who: "Lena Kowalski", role: "shop manager", user: "lkowalski", host: "COUNTER-PC",
    ram: 16384, userIsAdmin: true,
    brief: [
      "Lena, Northgate Print. The counter PC goes horrible every morning at nine on the dot \u2014 fans roaring \u2014 and then it\u2019s fine again by about eleven.",
      "It has done that every day this week, since the IT lad came in to \u2018tighten up security\u2019. Today it\u2019s worse because I\u2019m trying to get artwork out to a customer.",
      "Since the power flickered on Monday, Windows keeps saying it needs to restart to finish something, and a couple of apps crash when they open.",
      "There\u2019s an 8 TB drive in the drawer under the counter for the artwork archive. Oh \u2014 the IT lad said something about disks \u2018coming up offline\u2019 on these new PCs, if that means anything to you."
    ],
    desk: {
      correct: "It slows down at the same time every morning, then recovers",
      wrong: [
        ["It has been slow all day, every day this week", "She says it is fine again by about eleven. It is a morning problem, not an all-day one."],
        ["The slowdown started after the power flickered", "It started when the IT lad changed the security settings, earlier in the week. The flicker was Monday and is tied to a different problem."],
        ["Windows has already finished what it needed to restart for", "She says Windows KEEPS asking to restart to finish something \u2014 it has not been allowed to."],
        ["The IT lad fitted the new drive", "It is in the drawer under the counter."],
        ["Only the artwork software is slow", "The whole PC goes horrible, fans and all."]
      ],
      where: "Look at the clock times she gives, and at what changed the day the slowdowns began.",
      principle: "A problem that arrives on a timetable is usually something scheduled. Find what was scheduled, and when it was set up."
    },
    slow: {
      column: "cpu", culprit: "av",
      procs: [
        { name: "MsMpEng.exe", desc: "Antimalware Service Executable", image: "C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\4.18.24090.11-0\\MsMpEng.exe", cpu: 38.0, mem: 420, disk: 9.1, tag: "av", publisher: "Microsoft Windows", parent: "services.exe", user: "SYSTEM", protected: true, replaceBase: "MsMpEng.exe" },
        { name: "Illustrator.exe", desc: "Adobe Illustrator", image: "C:\\Program Files\\Adobe\\Adobe Illustrator 2026\\Support Files\\Contents\\Windows\\Illustrator.exe", cpu: 4.5, mem: 1850, disk: 0.6, window: true, tag: "biz", publisher: "Adobe Inc.", parent: "explorer.exe" },
        { name: "OUTLOOK.EXE", desc: "Microsoft Outlook", image: "C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE", cpu: 0.8, mem: 260, disk: 0.1, window: true, tag: "mail", publisher: "Microsoft Corporation", parent: "explorer.exe" },
        { name: "msedge.exe", desc: "Microsoft Edge (9)", image: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", cpu: 1.4, mem: 720, disk: 0.1, group: "edge", window: true, tag: "edge", publisher: "Microsoft Corporation", parent: "explorer.exe" }
      ],
      remedies: {
        correct: ["reschedule", "Let it finish; move the full scan to after closing", "Let this scan finish, then move the scheduled full scan to after the shop closes."],
        wrong: [
          ["end-app", "End Antimalware Service Executable", "Windows will not let anyone end it \u2014 it is a protected process \u2014 and ending the antivirus to get speed back is the wrong trade anyway."],
          ["disable", "Turn real-time protection off so it stops scanning during the day", "That buys speed with no protection at all, on a PC that takes files from customers every day."],
          ["biz", "End Illustrator, which is using the most memory", "Memory is not what is short; the CPU is. And Illustrator is the work she is trying to get out."],
          ["restart", "Restart the PC", "The scan is scheduled for nine every day. A restart stops today\u2019s, and tomorrow\u2019s arrives on time."],
          ["uninstall", "Uninstall the IT lad\u2019s changes", "The security change is sound. Only the time it was scheduled for is wrong."],
          ["malware", "Disconnect it from the network \u2014 this is malware", "MsMpEng is Microsoft Defender itself, signed and running from where it lives. It is the protection, not the threat."]
        ]
      },
      act: null,
      facts: "A full scan reads every file on the disk. Scheduled for 9:00, it runs at exactly the time the shop is busiest."
    },
    admin: { variant: "pending", sys: { corrupt: 2, pendingRepair: true } },
    disk: { model: "ST8000VN004", bytes: 8001563222016, label: "Artwork", offline: true, need: { volumes: 1 } }
  },
  {
    key: "brightwater", name: "Brightwater Estate Agents", who: "Marcus Bell", role: "branch manager", user: "mbell", host: "LETTINGS-01",
    ram: 16384, userIsAdmin: true,
    brief: [
      "Marcus, Brightwater. Morning. So \u2014 yesterday one of the team downloaded a free PDF editor to sign a contract. I know. Since then the lettings PC\u2019s fan has been going like a jet engine and it\u2019s slow as anything.",
      "The antivirus says everything is fine, for what that\u2019s worth.",
      "Separately, the Settings window just vanishes when you open it. That\u2019s been going on for a week or so, long before the PDF thing.",
      "The 10 TB drive in the box is for the property photos. It came out of our old NAS \u2014 everything on it was copied to the cloud last month and checked, so you can wipe it."
    ],
    desk: {
      correct: "It slowed down after a PDF editor was downloaded",
      wrong: [
        ["The antivirus has already found and flagged the problem", "He says the antivirus says everything is FINE."],
        ["Settings started vanishing after the PDF editor", "He says Settings has been going on for a week or so, long BEFORE the PDF thing."],
        ["The new drive is empty and brand new", "It came out of the old NAS. It has old data on it, which he says was copied and checked, so it can be wiped."],
        ["He wants the old NAS data kept on the new drive", "He says it was copied to the cloud last month and checked, and you can wipe it."],
        ["The fan has always been loud", "He says the fan has been going like a jet engine SINCE the download."]
      ],
      where: "Two problems, two starting points. Read what he says came first.",
      principle: "When two problems are told together, check whether they started together. If one began before the other, they are probably not one fault."
    },
    slow: {
      column: "cpu", culprit: "fake",
      procs: [
        { name: "svchost.exe", desc: "Service Host", image: "C:\\Users\\mbell\\AppData\\Roaming\\svchost.exe", cpu: 41.0, mem: 96, disk: 0.1, tag: "fake", publisher: "", parent: "explorer.exe", user: "mbell" },
        { name: "Reapit.exe", desc: "Reapit Foundations", image: "C:\\Program Files\\Reapit\\Reapit.exe", cpu: 2.2, mem: 480, disk: 0.2, window: true, tag: "biz", publisher: "Reapit Ltd", parent: "explorer.exe" },
        { name: "msedge.exe", desc: "Microsoft Edge (12)", image: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", cpu: 3.0, mem: 900, disk: 0.2, group: "edge", window: true, tag: "edge", publisher: "Microsoft Corporation", parent: "explorer.exe" },
        { name: "OUTLOOK.EXE", desc: "Microsoft Outlook", image: "C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE", cpu: 0.9, mem: 280, disk: 0.1, window: true, tag: "mail", publisher: "Microsoft Corporation", parent: "explorer.exe" }
      ],
      remedies: {
        correct: ["malware", "It is malware: take it off the network, then escalate", "Treat it as malware: take the PC off the network first, then hand it on for malware removal."],
        wrong: [
          ["end-app", "End the svchost.exe at the top of the CPU column and carry on", "Ending it stops the noise until the next sign-in, when whatever launched it launches it again \u2014 and whatever it has been doing on the network has already been done."],
          ["leave", "Leave it running \u2014 svchost.exe is a normal Windows process", "Windows\u2019 own svchost runs from System32, is signed by Microsoft Windows and is started by services.exe. This one is none of the three."],
          ["sfc", "Run sfc /scannow to repair it", "sfc checks Windows\u2019 protected files. This file sits in a user\u2019s AppData folder, where sfc never looks."],
          ["delete-real", "Delete svchost.exe from System32", "That is the REAL one. Deleting it breaks dozens of Windows services and leaves the impostor running."],
          ["restart", "Restart the PC", "It comes straight back at sign-in, and a restart destroys what was in memory before anyone has looked at it."],
          ["cpu", "Lower its priority so the PC feels faster", "A quieter unknown program is still an unknown program on the office network."]
        ]
      },
      act: { kind: "unplug", prompt: "Now do it: take this PC off the network. It is on a cable \u2014 look at the back of the tower on the desk." },
      facts: "The name is borrowed. Windows' svchost.exe lives in C:\\Windows\\System32, is signed by Microsoft Windows and is started by services.exe. This copy is in a user's AppData folder, has no publisher and was started by explorer.exe."
    },
    admin: { variant: "clean", sys: { corrupt: 0 } },
    disk: { model: "WDC WD101EFBX", bytes: 10000831348736, label: "Photos", oldVolume: { label: "OLD-NAS", fs: "NTFS", bytes: 2000398934016 }, need: { volumes: 1 } }
  },
  {
    key: "staldric", name: "St Aldric\u2019s Parish Office", who: "Ruth Adeyemi", role: "parish administrator", user: "radeyemi", host: "PARISH-OFFICE",
    ram: 8192, userIsAdmin: false,
    brief: [
      "Hello, it\u2019s Ruth at St Aldric\u2019s parish office. The computer\u2019s gone funny.",
      "The big spreadsheet of hall bookings has frozen \u2014 the top of the window says \u2018Not Responding\u2019 \u2014 and everything has been sluggish since. I\u2019ve been waiting twenty minutes for it.",
      "I don\u2019t know if it matters, but since the electrician turned the power off on Wednesday, the Photos app and the Calculator won\u2019t open.",
      "I\u2019m not allowed to install things \u2014 the diocese IT set it up that way, I just have my own login. They left your login on the sheet for you. The 12 TB drive is for the register scans; the scanner software will only save to a drive called R:, it\u2019s very fussy."
    ],
    desk: {
      correct: "Her own login is not allowed to install software on this PC",
      wrong: [
        ["The spreadsheet froze after the power cut", "The power was turned off on Wednesday. The spreadsheet froze twenty minutes ago."],
        ["She is an administrator on this PC", "She says she is not allowed to install things and just has her own login."],
        ["The scanner can save to any drive letter", "She says it will only save to a drive called R:."],
        ["Photos and Calculator stopped working when the spreadsheet froze", "They stopped after the electrician turned the power off on Wednesday."],
        ["The diocese IT will do the drive themselves", "They left YOUR login on the sheet, so the job is yours."]
      ],
      where: "Read what she says about installing things, and whose login is on the sheet.",
      principle: "Before you plan a repair, find out what the account in front of you is allowed to do. A standard user\u2019s login cannot make system changes, however it is asked."
    },
    slow: {
      column: "cpu", culprit: "hung",
      procs: [
        { name: "EXCEL.EXE", desc: "Microsoft Excel (Not responding)", image: "C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE", cpu: 25.0, mem: 1320, disk: 0.4, window: true, tag: "hung", publisher: "Microsoft Corporation", parent: "explorer.exe", responding: false,
          onEnd: { effect: "hung-ended", say: "Excel has been ended. When Ruth reopens it, Document Recovery will offer the hall bookings as they were at the last AutoRecover save." } },
        { name: "msedge.exe", desc: "Microsoft Edge (5)", image: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", cpu: 1.5, mem: 480, disk: 0.1, group: "edge", window: true, tag: "edge", publisher: "Microsoft Corporation", parent: "explorer.exe" },
        { name: "OUTLOOK.EXE", desc: "Microsoft Outlook", image: "C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE", cpu: 0.7, mem: 250, disk: 0.1, window: true, tag: "mail", publisher: "Microsoft Corporation", parent: "explorer.exe" },
        { name: "OneDrive.exe", desc: "Microsoft OneDrive", image: "C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe", cpu: 0.3, mem: 80, disk: 0.1, tag: "onedrive", publisher: "Microsoft Corporation", parent: "explorer.exe" }
      ],
      remedies: {
        correct: ["end-app", "End task on the frozen Excel; reopen the recovered copy", "End task on the frozen Excel, then reopen it and take the recovered copy from Document Recovery."],
        wrong: [
          ["wait", "Leave it another twenty minutes \u2014 it will come back on its own", "It has been Not Responding for twenty minutes already, holding a whole processor core. It is hung, not busy."],
          ["restart", "Restart the PC", "That ends Excel too, and everything else she has open with it. End the one thing that is stuck."],
          ["mem", "End whatever is using the most memory", "That is also Excel \u2014 but ending by memory would have been luck. The column that tells you it is stuck is the Status, and the CPU pegged at one core."],
          ["edge", "End Edge to free some resources", "Edge is quiet. Taking it away changes nothing about a window that is hung."],
          ["sfc", "Run sfc /scannow, because apps are failing", "One hung spreadsheet is not a damaged system file. That is a different problem from the Photos app, and a different stage."],
          ["malware", "Disconnect it from the network \u2014 this is malware", "Excel is signed by Microsoft and running from Program Files. It is stuck, not hostile."]
        ]
      },
      act: { kind: "end", tag: "hung", prompt: "Now do it: end the frozen Excel from Task Manager." },
      facts: "25% on a four-core PC is one core flat out. A program stuck in a loop does exactly that, and 'Not responding' is Windows saying the window has stopped answering messages."
    },
    admin: { variant: "creds", sys: { corrupt: 3 } },
    disk: { model: "ST12000VN0008", bytes: 12000138625024, label: "Registers", need: { volumes: 1, letter: "R" } }
  }
];

export function jobByKey(k) { return JOBS.filter(function (j) { return j.key === k; })[0] || null; }

/* ------------------------------------------------------------------ */
/*  A MACHINE FOR A STAGE                                              */
/* ------------------------------------------------------------------ */
export function machineFor(job, stage) {
  const o = { user: job.user, host: job.host, ramMB: job.ram, userIsAdmin: job.userIsAdmin,
    techAccount: { name: "itadmin", password: "Bench-Tech-2026" } };
  if (stage === "slow") {
    o.extraProcs = job.slow.procs.map(function (p, i) {
      return Object.assign({ pid: 5200 + i * 136 + job.key.length * 4 }, p, { user: p.user || job.user });
    });
  }
  if (stage === "admin" || stage === "desk") {
    o.sys = Object.assign({ symptoms: ["settings"] }, job.admin.sys);
  }
  if (stage === "disk") {
    const d = job.disk;
    const spare = { model: d.model, bytes: d.bytes };
    if (d.oldVolume) {
      spare.style = "MBR";
      spare.parts = [{ kind: "data", bytes: d.oldVolume.bytes, fs: d.oldVolume.fs, label: d.oldVolume.label, letter: "", health: "Healthy (Primary Partition)", files: true },
        { kind: "unalloc", bytes: M.MBR_LIMIT - d.oldVolume.bytes }, { kind: "unreach", bytes: d.bytes - M.MBR_LIMIT }];
    }
    o.hw = { mains: true, panelOff: false, driveFitted: false, sataData: false, sataPower: false, spare: spare };
  }
  const m = M.makeMachine(o);
  /* A process the job adds with the same name as a base one REPLACES it:
     Defender is already in every machine, and a second copy would be two
     antiviruses. */
  if (stage === "slow") {
    job.slow.procs.forEach(function (p) {
      if (p.replaceBase) {
        const extra = m.procs.filter(function (x) { return x.name === p.replaceBase && x.tag; })[0];
        m.procs = m.procs.filter(function (x) { return !(x.name === p.replaceBase && !x.tag); });
        if (extra) extra.pid = 2280;
      }
    });
  }
  if (stage === "disk" && job.disk.offline) m.hw.spare.offline = true;
  m.net = { ip: "192.168.1." + (20 + job.key.length), mask: "255.255.255.0", gw: "192.168.1.1", dns: "192.168.1.1", mac: "3C-52-82-4A-19-E7", dhcp: "192.168.1.1", cable: true };
  return m;
}

/* ------------------------------------------------------------------ */
/*  STAGES                                                             */
/* ------------------------------------------------------------------ */
function opt(key, label, correct, why) { return { key: key, label: label, correct: !!correct, why: why || "" }; }

export function buildStage(key, job) {
  if (key === "desk") return deskStage(job);
  if (key === "slow") return slowStage(job);
  if (key === "admin") return adminStage(job);
  if (key === "disk") return diskStage(job);
  return null;
}

function briefPanel(job, extra) {
  return { from: job.who + ", " + job.role + " \u2014 " + job.name, paragraphs: job.brief.concat(extra || []) };
}

/* ---------------- desk ---------------- */
function deskStage(job) {
  const d = job.desk;
  return {
    key: "desk",
    brief: briefPanel(job),
    screen: false,
    bench: "desk",
    steps: [{
      key: "desk-told", kind: "choice",
      prompt: "Before you touch anything: which of these did " + job.who.split(" ")[0] + " actually tell you?",
      options: [opt("told", d.correct, true, "")].concat(d.wrong.map(function (w, i) { return opt("w" + i, w[0], false, w[1]); })),
      hints: [d.where, d.principle],
      answer: d.correct,
      right: "That is what was said. Everything else on that list is something a technician fills in without noticing \u2014 and every one of them would send you after the wrong fault."
    }],
    mech: {
      title: "Why the ticket comes first",
      frames: [
        { title: "A customer tells you three things at once", text: "Every brief here mixes two or three problems with the timeline of each. They are told as one story because that is how people talk, not because they are one fault." },
        { title: "Times are evidence", text: "\u201cSince this morning\u201d, \u201csince the power cut\u201d, \u201cever since the IT lad came in\u201d \u2014 each start time points at a different cause. A slowdown that began this morning is not a power cut from last week." },
        { title: "What they did NOT do matters too", text: "\u201cI didn\u2019t want to break anything\u201d means nobody has tried a fix yet. \u201cFrank fixed the laptop\u201d means this PC is still broken. Both change your first move." }
      ]
    }
  };
}

/* ---------------- slow ---------------- */
const COLUMN_WORDS = { cpu: "CPU", mem: "Memory", disk: "Disk" };

function slowStage(job) {
  const s = job.slow;
  const culpritTag = s.culprit;
  const first = job.who.split(" ")[0];
  const steps = [];

  /* 1. Find it, in Task Manager, and say which one. A wrong accusation is
     a guess, and the row it was made on is struck out and STAYS struck,
     with the reason, so the list becomes the student's working memory. */
  steps.push({
    key: "slow-find", kind: "task", surface: "taskmgr",
    prompt: "Open Task Manager, find what is slowing this PC down, select it and press \u201cThis is the cause\u201d.",
    goal: function (m, ctx) { return ctx.blamed === culpritTag; },
    judge: function (act) { return act.type === "tm-blame"; },
    blameWhy: function (p, m) { return blameReason(job, p, m); },
    hints: function () {
      return ["Task Manager opens sorted by name, which hides everything. Click the heading of the column that matches what " + first + " describes.",
        "Match the resource to the symptom: a busy processor shows in CPU, a full memory in Memory, a disk light that never stops in Disk. Sort by that one, highest first, and read the top row \u2014 then check where it runs from and who published it."];
    },
    moves: function (m) { return procMoves(job, m); },
    answer: "Sort by " + COLUMN_WORDS[s.column] + " and blame " + procLabel(s.procs.filter(function (p) { return p.tag === culpritTag; })[0]) + ".",
    right: s.facts
  });

  /* 2. What to do about it — six options, one right. */
  const R = s.remedies;
  steps.push({
    key: "slow-remedy", kind: "choice",
    prompt: "You have found it. What is the right thing to do about it?",
    options: [opt(R.correct[0], R.correct[1], true, "")].concat(R.wrong.map(function (w) { return opt(w[0], w[1], false, w[2]); })),
    hints: [
      "Look again at the row you found: the image path, the publisher, and whether this is something that finishes by itself.",
      "Ending a process only helps if it is stuck or unwanted. Something doing wanted work that finishes on its own is left alone or moved to a better time; something that should not be there at all is taken off the network before anything else."
    ],
    answer: R.correct[1],
    right: R.correct[2] || null
  });

  /* 3. Then do it, when there is something to do. */
  if (s.act && s.act.kind === "end") {
    steps.push({
      key: "slow-act", kind: "task", surface: "taskmgr",
      prompt: s.act.prompt,
      goal: function (m) { return !m.procs.some(function (p) { return p.tag === s.act.tag; }); },
      judge: function (act) { return act.type === "tm-end" && act.tag !== s.act.tag; },
      hints: function () { return ["Select the same row you blamed, then use End task at the top of the window.", "End task stops the one program selected, and whatever belongs to it. Nothing else needs to go."]; },
      moves: function (m) { return procMoves(job, m, true); },
      answer: "Select the " + procLabel(s.procs.filter(function (p) { return p.tag === s.act.tag; })[0]) + " row and press End task."
    });
  }
  if (s.act && s.act.kind === "unplug") {
    steps.push({
      key: "slow-act", kind: "task", surface: "bench",
      prompt: s.act.prompt,
      goal: function (m) { return m.net && m.net.cable === false; },
      judge: function (act) { return (act.type === "tm-end") || (act.type === "hw" && act.id !== "net-unplug"); },
      hints: function () { return ["The network cable is plugged into the back of the tower. It is one of the controls beside the desk.", "Isolate first, investigate second: an infected PC left on the network can reach every other PC and share in the office while you work on it."]; },
      moves: function () {
        return [
          { label: "Unplug the network cable from the back of the tower", correct: true },
          { label: "End the svchost.exe from AppData in Task Manager", why: "It comes back at the next sign-in, and the PC is still on the network while it does." },
          { label: "Shut the PC down", why: "It loses what is in memory, which whoever removes the malware will want to see \u2014 and it goes straight back on the network when it is switched on." },
          { label: "Unplug the mains lead", why: "A hard power cut, with the same problem as shutting down, and nothing isolated." },
          { label: "Run a quick scan from Windows Security", why: "The antivirus already said everything was fine. Scanning is part of removal, which comes after it is isolated." },
          { label: "Change Marcus\u2019s password", why: "Worth doing later, from a clean machine. Typed on this one, the new password may be captured too." }
        ];
      },
      answer: "Use the bench control on the tower: Unplug the network cable."
    });
  }

  return {
    key: "slow",
    brief: briefPanel(job),
    screen: true, bench: "desk",
    apps: ["taskmgr", "cmd", "ps"],
    open: null,
    steps: steps,
    mech: {
      title: "What Task Manager is measuring",
      frames: [
        { title: "Three resources, three columns", text: "CPU is how much of the processor time each program used in the last second. Memory is how much RAM it is holding. Disk is how many megabytes a second it is reading and writing. A PC can be slow because ANY one of them is full, and the other two can look perfectly calm." },
        { title: "The default sort hides the answer", text: "Task Manager opens sorted by name. The culprit is somewhere in the list, looking like everything else, until you click the column that matches the symptom." },
        { title: "A name proves nothing", text: "Anything can call itself svchost.exe. What identifies a process is where it runs from, who signed it, and what started it \u2014 the three facts on the right of the window when you select a row." },
        { title: "Busy is not the same as broken", text: "Windows Update, a first OneDrive sync and an antivirus scan all look like a runaway program and all finish by themselves. Ending them postpones the work; the fix is WHEN they run. A program that is stuck \u2014 Not responding, one core pegged \u2014 is the one End task is for." }
      ]
    }
  };
}

function procLabel(p) { return p ? p.desc + " (" + p.name + ")" : ""; }

/* Why a wrongly blamed row is wrong, in terms of THIS job. */
function blameReason(job, p, m) {
  const col = job.slow.column;
  if (p.tag && job.slow.procs.some(function (x) { return x.tag === p.tag; })) {
    const byCol = { cpu: p.cpu + "% CPU", mem: p.mem.toLocaleString("en-GB") + " MB of memory", disk: p.disk + " MB/s of disk" };
    return procLabel(p) + " is using " + byCol[col] + ". Sort by " + COLUMN_WORDS[col] + " and compare it with the top row.";
  }
  if (/Windows/.test(p.publisher) && /^C:\\Windows\\/i.test(p.image || "")) return procLabel(p) + " is part of Windows, running from where it should, and it is quiet.";
  return procLabel(p) + " is not what is loading this PC. Sort by the column that matches the symptom.";
}

/* Rung 3 for the find/act tasks: six processes from THIS machine, the
   right one among them. */
function procMoves(job, m, acting) {
  const tag = acting && job.slow.act ? job.slow.act.tag : job.slow.culprit;
  const culprit = m.procs.filter(function (p) { return p.tag === tag; })[0] || job.slow.procs.filter(function (p) { return p.tag === tag; })[0];
  const others = job.slow.procs.filter(function (p) { return p.tag !== tag; }).map(function (p) {
    return { label: procLabel(p), why: blameReason(job, p, m) };
  });
  const base = [
    { label: "Desktop Window Manager (dwm.exe)", why: "It draws every window on screen. It is part of Windows and it is quiet." },
    { label: "Client Server Runtime Process (csrss.exe)", why: "A critical Windows process, and quiet. Ending it blue-screens the PC." },
    { label: "Windows Explorer (explorer.exe)", why: "It is the taskbar and the desktop, and it is barely using anything." }
  ];
  const list = [{ label: procLabel(culprit), correct: true }].concat(others).concat(base);
  return list.slice(0, 6);
}

/* ---------------- admin ---------------- */
const ADMIN_Q = {
  sfc: {
    prompt: "sfc repaired the files. Where did it get the good copies from?",
    correct: "The component store, in C:\\Windows\\WinSxS",
    wrong: [
      ["Windows Update, downloaded during the scan", "That is where DISM /RestoreHealth goes. sfc works offline, from what is already on the disk."],
      ["The recovery partition", "The recovery partition holds the Recovery Environment, not spare copies of system files."],
      ["The CBS log", "CBS.log is where sfc WRITES what it did. It is a record, not a source."],
      ["Other copies inside System32", "The damaged files are in System32. A folder cannot repair itself from itself."],
      ["The Windows installation USB", "sfc only reads installation media when you point it there with the offline switches. Nobody did."]
    ],
    hints: ["Read the last lines sfc printed, and the file it points you to.", "sfc compares each protected file with a known-good copy that Windows keeps on the same disk, and copies the good one back over the bad."]
  },
  dism: {
    prompt: "The first sfc could not fix everything, and the one after DISM did. Why?",
    correct: "DISM repaired the store sfc copies from; then sfc could work",
    explain: "sfc repairs from the component store, and the store itself was damaged until DISM repaired it.",
    wrong: [
      ["The first sfc was run without administrator rights, so it did nothing", "It was: it scanned the whole system and reported what it found. A standard prompt is refused before scanning starts."],
      ["sfc always has to be run twice", "Not on a healthy store. The second run worked because something underneath it had changed."],
      ["DISM replaced the damaged system files itself, so sfc just confirmed it", "DISM repairs the component store, not the files in System32. That is exactly why sfc had to run again afterwards."],
      ["A restart in between cleared a lock", "There was no restart between them."],
      ["The disk had bad sectors that DISM remapped", "DISM does not touch sectors. That is chkdsk /r, and nothing here pointed at the disk."]
    ],
    hints: ["Compare what the first sfc said with what the second said, and what DISM said in between.", "A repair tool is only as good as the thing it copies from. If the source is damaged, repair the source first, then run the repair again."]
  },
  chkdsk: {
    prompt: "Why did chkdsk C: /f have to wait for a restart?",
    correct: "Windows runs from C:, so C: cannot be locked while it runs",
    explain: "C: is the drive Windows is running from, so it cannot be locked for repair while Windows is using it. The check runs at the next start-up, before Windows opens the drive.",
    wrong: [
      ["chkdsk needs administrator rights, which only apply after a restart", "The prompt was already elevated. chkdsk said it could not LOCK the drive, not that it lacked rights."],
      ["It needed the recovery partition", "chkdsk ran on C: itself, early in the next start-up, before Windows had the drive open."],
      ["Every Windows repair runs at restart", "sfc and DISM ran while Windows was running. Only the one that needed the drive to itself had to wait."],
      ["Because you answered Y", "Y accepted the offer to schedule it. The reason it had to be scheduled was already on the screen above the question."],
      ["The drive had to cool down after the power cut", "Drives do not need to cool down. The message said the volume was in use by another process."]
    ],
    hints: ["Read the two lines chkdsk printed straight after the file system type.", "A tool that rewrites a file system needs that volume to itself. Windows cannot hand over the drive it is running from, so the check runs before Windows starts."]
  },
  pending: {
    prompt: "Why did sfc tell you to restart before it would repair anything?",
    correct: "An update was half-way through and needs a restart to finish",
    explain: "An update was part-way through replacing system files and needed a restart to finish; sfc cannot check files that are waiting to be replaced.",
    wrong: [
      ["sfc needs a fresh boot before it gets its administrator rights back", "The prompt was elevated. sfc said a repair was PENDING, not that it lacked rights."],
      ["The files were locked by an app that was open at the time of the scan", "sfc repairs files in use all the time. The message was about a pending repair."],
      ["The disk had errors that the restart fixed", "Nothing reported disk errors. chkdsk was not involved."],
      ["Restarting clears the component store", "A restart finishes the servicing operation. The store is not cleared by it."],
      ["sfc only runs once per boot", "sfc runs as often as you like. It refused because Windows was mid-way through changing the very files it checks."]
    ],
    hints: ["Read sfc's exact words, and remember what Lena said Windows keeps asking.", "Windows sometimes replaces system files in two halves: one half now, the other at the next start-up. Until the second half runs, the files are neither old nor new, and nothing can check them."]
  },
  clean: {
    prompt: "sfc found no integrity violations. What does that tell you about the Settings problem?",
    correct: "Windows' files are fine; look at his profile or the app",
    explain: "Windows' protected files are fine, so the cause is somewhere sfc does not check \u2014 Marcus's user profile, or the Settings app itself.",
    wrong: [
      ["sfc did not really scan", "It scanned: it said it finished verification. \u201cDid not find any integrity violations\u201d is a real result, and a useful one."],
      ["Run DISM /RestoreHealth anyway, to be sure the files are fine", "DISM repairs the store sfc copies from. sfc found nothing to repair, so there was nothing for the store to supply."],
      ["The files were repaired", "It says it did NOT find any integrity violations. Nothing was repaired because nothing was wrong."],
      ["Windows is too damaged for sfc and must be reinstalled", "Nothing that has been found justifies that. Settings failing with healthy system files points at the user or the app, not the OS."],
      ["The PDF editor has damaged Windows' files", "Settings began failing a week before the download, and sfc says the protected files are intact."]
    ],
    hints: ["Read sfc's result exactly. What did it NOT find?", "A clean result from a tool rules something OUT. It tells you where the fault is not, which is how you narrow it down."]
  },
  creds: {
    prompt: "Why did Windows ask for a user name and password, instead of just Yes or No?",
    correct: "She is a standard user, so an admin must type their login",
    explain: "Ruth's account is a standard user, so elevating needs an administrator's user name and password, not just a Yes.",
    wrong: [
      ["Ruth's own password has expired and needs changing", "An expired password stops her signing in. She is signed in; the prompt was asking for SOMEBODY ELSE's details."],
      ["sfc needs a network login", "sfc is entirely local. Nothing about it touches the network."],
      ["User Account Control always asks everyone for a password first", "For a member of Administrators it asks only Yes or No. It asks for credentials when the person signed in is not one."],
      ["Run as administrator is disabled on this PC", "It worked \u2014 it just needed an administrator's user name and password to work."],
      ["Her account is locked", "A locked account cannot be used at all. Hers is in use, right now, at the desk."]
    ],
    hints: ["Look at what the prompt asked you to type, and whose login is on the sheet.", "Elevation needs an administrator's token. If the person signed in is an administrator, they are asked to confirm; if not, somebody who is has to type their credentials."]
  }
};

function adminStage(job) {
  const v = job.admin.variant;
  const Q = ADMIN_Q[v];
  const first = job.who.split(" ")[0];
  const steps = [
    {
      key: "admin-fix", kind: "task", surface: "cmd",
      prompt: v === "clean"
        ? "Find out whether Windows' own protected files are the cause of the Settings problem."
        : "Repair Windows' protected system files, so Settings opens again.",
      goal: function (m, ctx) {
        if (v === "clean") return ctx.events.some(function (e) { return e.kind === "sfc" && e.result === "clean"; });
        return M.sysHealthy(m) && m.power === "on" && !m.crashed;
      },
      judge: function (act, m, ctx, before) { return adminJudge(v, act, m, before); },
      hints: function (m, ctx) { return adminHints(v, m, ctx, first); },
      moves: function (m, ctx) { return adminMoves(v, m, ctx); },
      answer: adminAnswer(v),
      right: v === "clean" ? "The protected files are intact. That rules Windows itself out." : "Settings opens again. The protected files are back to Microsoft's versions."
    },
    {
      key: "admin-why", kind: "choice",
      prompt: Q.prompt,
      options: [opt("c", Q.correct, true, "")].concat(Q.wrong.map(function (w, i) { return opt("w" + i, w[0], false, w[1]); })),
      hints: Q.hints,
      answer: Q.correct,
      right: Q.explain || null
    }
  ];
  const creds = !job.userIsAdmin
    ? ["", "Your technician login for this PC, from the diocese\u2019s sheet: user name itadmin, password Bench-Tech-2026."] : [];
  return {
    key: "admin",
    brief: briefPanel(job, creds),
    screen: true, bench: "desk",
    apps: ["cmd", "ps", "taskmgr"],
    steps: steps,
    mech: {
      title: "Three layers, repaired from the bottom up",
      diagram: "layers",
      frames: [
        { title: "The disk's file system", text: "Underneath everything: the NTFS structures that say which blocks belong to which file. After a power cut they can be left half-written. chkdsk checks and repairs this layer, and it needs the volume to itself \u2014 so on C: it runs at the next start-up." },
        { title: "The component store", text: "C:\\Windows\\WinSxS holds a known-good copy of every protected system file. DISM /Online /Cleanup-Image checks and repairs this store, fetching good copies from Windows Update." },
        { title: "The protected files", text: "The files Windows actually runs, in System32 and around it. sfc /scannow compares each one with the store and copies the good version back over any that are wrong." },
        { title: "Why the order matters", text: "Each layer repairs from the one below. sfc cannot repair from a damaged store; DISM cannot read a damaged file system. Work from the bottom up: chkdsk, then DISM, then sfc." },
        { title: "And all three need the administrator's token", text: "A standard prompt is refused before any of them starts. Right-click Command Prompt and choose Run as administrator; the title bar then says Administrator: Command Prompt." }
      ]
    }
  };
}

/* What counts as a guess at the admin prompt, per the SETTLED rule:
   look, help and error never count. A refusal counts. A change counts
   unless it is a sensible move for the state the machine was in BEFORE
   it was typed. */
function adminJudge(v, act, m, before) {
  if (act.type === "power") {
    /* restarting is the fix when something is waiting for one */
    if (act.op === "restart" && before && (before.chkdskScheduled || before.pendingRepair)) return false;
    return true;
  }
  if (act.type === "tm-end") return true;
  if (act.type !== "cmd") return false;
  const k = act.res.kind;
  if (k === "look" || k === "help" || k === "error") return false;
  if (k === "refused") return true;
  const line = act.line.toLowerCase().replace(/\s+/g, " ");
  const b = before || {};
  if (/^sfc \/(scannow|verifyonly)/.test(line)) return false;          /* always a reasonable look at the files */
  if (/^dism/.test(line) && /restorehealth/.test(line)) return !b.storeCorrupt;   /* the right move only when the store is damaged */
  if (/^chkdsk/.test(line) || /^y(es)?$/.test(line)) return !b.fsErrors;
  if (/^shutdown \/r/.test(line)) return !(b.chkdskScheduled || b.pendingRepair);
  return true;
}

function adminHints(v, m, ctx, first) {
  const s = m.sys;
  const ev = ctx.events;
  const refused = ev.some(function (e) { return (e.kind === "sfc" || e.kind === "dism" || e.kind === "chkdsk") && e.refused; });
  const elevatedOnce = ctx.elevatedSeen;
  if (!elevatedOnce) {
    if (v === "creds") return ["Look at what Windows asked when you chose Run as administrator \u2014 and at the sheet in the brief.",
      "A standard user cannot elevate on their own. Windows asks for an administrator's user name and password instead, and the one for this job is written in the brief."];
    return [refused ? "Read the title bar of the prompt you typed into, and the exact words the tool refused with." : "Start with the tool that checks Windows' protected files, and read what it says back.",
      "Repair tools that change Windows itself need an administrator's token. A prompt opened the ordinary way does not have one, however senior the person typing is."];
  }
  if (s.fsErrors && !s.chkdskScheduled) return ["sfc said it could not perform the operation. Something underneath the files is damaged \u2014 check the drive itself.",
    "Repair from the bottom up: the disk's file system first, then the files that sit on it."];
  if (s.chkdskScheduled || s.pendingRepair) return ["Read the last thing the tool told you it needed.",
    "Some repairs can only happen while Windows is not running. They are scheduled, and then they need the thing that schedules them to happen."];
  if (s.storeCorrupt) return ["Read sfc's result again: it found problems, but could it fix them all?",
    "sfc copies good files from the component store. If it cannot fix what it finds, the store itself needs repairing first \u2014 by the tool that services the Windows image."];
  if (v === "clean") return ["You need a result, not a repair. Which tool tells you whether the protected files are intact?", "Rule a cause out before you chase it: a scan that finds nothing is a result."];
  return ["You have fixed what was underneath. Run the file check again.", "After repairing a lower layer, go back and run the repair that failed before."];
}

function adminMoves(v, m, ctx) {
  const s = m.sys;
  const M6 = function (right, list) { return [{ label: right, correct: true }].concat(list); };
  if (!ctx.elevatedSeen) {
    return M6(v === "creds" ? "Start \u2192 Command Prompt \u2192 Run as administrator, then type the technician login from the sheet" : "Start \u2192 Command Prompt \u2192 Run as administrator",
      [
        { label: "runas /user:Administrator cmd", why: "The built-in Administrator account is disabled on Windows 11 unless someone turns it on." },
        { label: "Type sfc /scannow again in the same prompt", why: "The same prompt has the same token. It will be refused the same way." },
        { label: "net user " + m.user + " /add", why: "That creates an account; it does not elevate this prompt \u2014 and it is refused without elevation anyway." },
        { label: "chkdsk /f", why: "Also needs elevation, and checks the file system, not the protected files." },
        { label: "shutdown /r /t 0", why: "A restart does not change who the prompt runs as." }
      ]);
  }
  if (s.fsErrors && !s.chkdskScheduled) {
    return M6("chkdsk C: /f, answer Y, then restart", [
      { label: "DISM /Online /Cleanup-Image /RestoreHealth", why: "DISM reads the component store off the same damaged file system. It fails with error 1392 until the disk is repaired." },
      { label: "sfc /scannow again", why: "It will stop part-way again for the same reason." },
      { label: "chkdsk C:", why: "Without /f it only reports. It will tell you there are problems and fix none of them." },
      { label: "format C:", why: "Windows is running from C:. Format refuses, and it would erase everything if it did not." },
      { label: "sfc /verifyonly", why: "Checks without repairing, and stops at the same point for the same reason." }
    ]);
  }
  if (s.chkdskScheduled || s.pendingRepair) {
    return M6("Restart the PC (shutdown /r /t 0, or Start \u2192 Power \u2192 Restart)", [
      { label: "sfc /scannow again", why: "Nothing has changed until the restart has happened." },
      { label: "DISM /Online /Cleanup-Image /RestoreHealth", why: "It refuses while an operation is waiting for a restart, or reads a disk that is still damaged." },
      { label: "shutdown /a", why: "Aborts a shutdown. There is none in progress \u2014 and you want the restart." },
      { label: "Shut down and leave it off", why: "The waiting work runs at START-up. It does nothing while the PC is off." },
      { label: "chkdsk C: /f again", why: "It is already scheduled. Asking again schedules the same check." }
    ]);
  }
  if (s.storeCorrupt) {
    return M6("DISM /Online /Cleanup-Image /RestoreHealth, then sfc /scannow again", [
      { label: "sfc /scannow again straight away", why: "The store it copies from is still damaged. It will fail the same way." },
      { label: "DISM /Online /Cleanup-Image /CheckHealth", why: "It only reports whether the store has been flagged. It repairs nothing." },
      { label: "chkdsk C: /f", why: "Nothing points at the disk; sfc scanned the whole system without stopping." },
      { label: "shutdown /r /t 0", why: "Nothing is waiting for a restart. The store is damaged and stays damaged." },
      { label: "sfc /verifyonly", why: "Checks without repairing. You already know what it will find." }
    ]);
  }
  return M6("sfc /scannow", [
    { label: "DISM /Online /Cleanup-Image /RestoreHealth", why: "It repairs the store sfc copies from. It does not replace the files Windows runs." },
    { label: "chkdsk C: /f", why: "Checks the file system, not Windows' protected files." },
    { label: "gpupdate /force", why: "Re-applies Group Policy. Nothing in the ticket is about policy." },
    { label: "shutdown /r /t 0", why: "Nothing is waiting for a restart." },
    { label: "sfc /verifyonly", why: "It finds the problems and fixes none of them." }
  ]);
}

function adminAnswer(v) {
  return {
    sfc: "Command Prompt \u2192 Run as administrator, then sfc /scannow.",
    dism: "Elevated prompt: sfc /scannow (cannot fix some), DISM /Online /Cleanup-Image /RestoreHealth, then sfc /scannow again.",
    chkdsk: "Elevated prompt: sfc /scannow (could not perform), chkdsk C: /f, Y, restart, then sfc /scannow.",
    pending: "Elevated prompt: sfc /scannow (repair pending), restart, then sfc /scannow.",
    clean: "Elevated prompt: sfc /scannow \u2014 no integrity violations. The files are not the cause.",
    creds: "Run as administrator, enter itadmin / Bench-Tech-2026 at the prompt, then sfc /scannow."
  }[v];
}

/* ---------------- disk ---------------- */
function diskStage(job) {
  const d = job.disk;
  const first = job.who.split(" ")[0];
  const shown = gb(d.bytes);
  const need = d.need;
  const steps = [];

  steps.push({
    key: "disk-calc", kind: "number",
    prompt: "Before you fit it: the label on the " + d.model + " says " + (d.bytes / 1e12).toFixed(0) + " TB \u2014 " + d.bytes.toLocaleString("en-GB") + " bytes. " + first + " will ask why Windows shows less. What size will Disk Management show for it, in GB?",
    answer: shown, tol: 0.6, unit: "GB",
    hints: ["The box counts in one kind of gigabyte and Windows counts in another. The bytes are the same either way.",
      "Drive makers count a gigabyte as 1,000,000,000 bytes. Windows counts one as 1,073,741,824 bytes \u2014 1024 \u00d7 1024 \u00d7 1024. Divide the bytes by Windows\u2019 gigabyte."],
    moves: function () {
      const dec = (d.bytes / 1e9).toFixed(2);
      return [
        { label: shown.toFixed(2) + " GB", correct: true },
        { label: dec + " GB", why: "That is the maker's gigabyte \u2014 a thousand million bytes. Windows' is bigger, so it shows fewer of them." },
        { label: (d.bytes / 1e12).toFixed(0) + "000 GB", why: "That is the number on the box, rounded. It is the same figure in the maker's units." },
        { label: (d.bytes / Math.pow(1024, 4)).toFixed(2) + " GB", why: "Right division, wrong unit: that is the size in Windows' TERABYTES. Disk Management shows gigabytes." },
        { label: "2048.00 GB", why: "That is the MBR limit \u2014 what the drive would be cut down to, not what it is." },
        { label: (shown * 0.9).toFixed(2) + " GB", why: "Formatting takes a sliver, not ten percent. Disk Management shows the whole disk before anything is formatted." }
      ];
    },
    answer_text: shown.toFixed(2) + " GB (" + d.bytes.toLocaleString("en-GB") + " \u00f7 1,073,741,824)",
    right: "Nothing is missing. The same bytes, counted in a bigger gigabyte, make a smaller number."
  });

  steps.push({
    key: "disk-fit", kind: "task", surface: "bench",
    prompt: "Fit the drive: power down safely, open the case, put the drive in a bay, connect it, close up and switch back on.",
    goal: function (m) { const h = m.hw; return h.driveFitted && h.sataData && h.sataPower && !h.panelOff && h.mains && m.power === "on"; },
    judge: function (act) { return act.type === "hw" && act.res && act.res.refused; },
    hints: function (m) { return fitHints(m); },
    moves: function (m) { return fitMoves(m); },
    answer: "Start \u2192 Power \u2192 Shut down; unplug the mains; remove the side panel; fit the drive in a 3.5\u2033 bay; connect SATA data (board to drive) and SATA power (supply to drive); refit the panel; plug in; press the power button.",
    right: "It is in, cabled for data and for power, and the case is closed. Whether Windows can see it is the next question."
  });

  steps.push({
    key: "disk-setup", kind: "task", surface: "diskmgmt",
    prompt: diskPrompt(job),
    goal: function (m) { return diskGoal(job, m); },
    judge: function (act, m, ctx, before) { return diskJudge(job, act, m); },
    hints: function (m) { return diskHints(job, m); },
    moves: function (m) { return diskMoves(job, m); },
    answer: diskAnswer(job),
    right: "The drive is usable, at its full size, as " + (need.letter || "a lettered") + (need.letter ? ":" : "") + " NTFS volume" + (need.volumes > 1 ? "s" : "") + "."
  });

  return {
    key: "disk",
    brief: briefPanel(job),
    screen: true, bench: "desk",
    apps: ["diskmgmt", "cmd", "ps", "taskmgr"],
    steps: steps,
    mech: {
      title: "What initializing and formatting actually decide",
      diagram: "disk",
      frames: [
        { title: "Same bytes, two gigabytes", text: "The label counts 1 GB as 1,000,000,000 bytes. Windows counts 1 GB as 1,073,741,824. The drive is not smaller than it says; Windows is counting in bigger units." },
        { title: "Initializing writes the partition table", text: "A new disk has no table saying where anything is. MBR is the old one: it counts in 32-bit sector numbers, so with 512-byte sectors it can reach 2,199,023,255,552 bytes \u2014 2 TiB, 2048 GB \u2014 and not one byte further. GPT counts in 64-bit numbers and reaches further than any drive made." },
        { title: "What MBR does to a big drive", text: "Initialize a bigger drive as MBR and Disk Management shows TWO blocks of unallocated space: the first 2048 GB, and the rest, which no volume can ever be created in. Convert to GPT only works on an empty disk, so the fix is to delete what you made and start again." },
        { title: "Formatting chooses the file system", text: "NTFS is the one for a Windows data drive: permissions, journaling so a power cut does not wreck it, and no practical size limit. exFAT has no permissions and no journal. FAT32 is not even offered at this size \u2014 Windows' tools stop formatting it at 32 GB, and it cannot hold a file bigger than 4 GB." }
      ]
    }
  };
}

function diskPrompt(job) {
  const n = job.disk.need;
  let s = "Open Disk Management and make the new drive usable";
  if (n.volumes > 1) s += " \u2014 split the way the customer asked";
  if (n.letter) s += ", with the drive letter the customer needs";
  return s + ".";
}

export function spareDisk(m) { return m.disks.filter(function (d) { return d.spare; })[0] || null; }

function diskGoal(job, m) {
  const d = spareDisk(m);
  if (!d || d.style !== "GPT" || d.offline) return false;
  const vols = d.parts.filter(function (p) { return p.kind === "data"; });
  const n = job.disk.need;
  if (vols.length !== n.volumes) return false;
  if (!vols.every(function (v) { return v.fs === "NTFS" && v.letter; })) return false;
  const free = d.parts.filter(function (p) { return p.kind !== "data"; }).reduce(function (a, p) { return a + p.bytes; }, 0);
  if (free > 0.01 * d.bytes) return false;       /* the whole drive used */
  if (n.firstGB) { const g = vols[0].bytes / G; if (g < n.firstGB * 0.93 || g > n.firstGB * 1.03) return false; }
  if (n.letter && !vols.some(function (v) { return v.letter === n.letter; })) return false;
  return true;
}

/* A Disk Management action counts as a guess when it moves the drive
   AWAY from what was asked. Initializing GPT, bringing it online,
   deleting a volume that was wrong, converting an empty disk: all fine.
   Undoing your own mistake is never punished. */
function diskJudge(job, act, m) {
  if (act.type === "cmd") {
    const k = act.res.kind;
    if (k === "refused") return true;
    if (k !== "change") return false;
    const line = act.line.toLowerCase();
    if (/^clean/.test(line)) {
      const e = m.events[m.events.length - 1];
      return !(e && e.kind === "clean" && M.disk(m, e.n) && M.disk(m, e.n).spare);
    }
    return false;
  }
  if (act.type !== "dm" || !act.res || !act.res.ok) return !!(act.type === "dm" && act.res && act.res.refused);
  const n = job.disk.need;
  if (act.op === "init") return act.style === "MBR";
  if (act.op === "volume") {
    if (act.fs !== "NTFS") return true;
    if (n.letter && act.letter !== n.letter && !(n.volumes > 1)) return true;
    const d = spareDisk(m);
    if (d && d.style === "MBR") return true;
    if (n.volumes === 1 && act.bytes < d.bytes * 0.98) return true;
    if (n.firstGB && d && d.parts.filter(function (p) { return p.kind === "data"; }).length === 1) {
      const g = act.bytes / G; if (g < n.firstGB * 0.93 || g > n.firstGB * 1.03) return true;
    }
    return false;
  }
  return false;
}

function diskHints(job, m) {
  const d = spareDisk(m);
  const n = job.disk.need;
  if (!d) return ["Disk Management lists the disks Windows can see. If the new one is not there, look at what you did on the desk.",
    "A drive needs data AND power, and the PC has to have been switched on after it was connected, to be detected."];
  if (d.offline) return ["Read the status under Disk 1's name, on the left of its row.",
    "A disk that Windows has left Offline cannot be initialized or used until somebody brings it Online. Some PCs are set to do that to every new disk, deliberately."];
  if (d.parts.some(function (p) { return p.kind === "data" && p.files; })) return ["Read what is already on Disk 1, and what " + job.who.split(" ")[0] + " said about it.",
    "A disk that already carries a volume must be emptied before its partition style can change. Only delete what the customer has told you is safe to lose."];
  if (!d.style) return ["Disk 1 says Not Initialized. The first choice you make on it decides how much of it can ever be used.",
    "MBR can only address the first 2 TiB of a disk. GPT has no limit that matters. Anything bigger than 2048 GB must be GPT."];
  if (d.style === "MBR") return ["Look at the unallocated space on Disk 1. How many separate blocks are there, and how big is the first?",
    "MBR reaches 2048 GB and no further. Convert to GPT Disk works only on an EMPTY disk \u2014 delete anything on it first."];
  const vols = d.parts.filter(function (p) { return p.kind === "data"; });
  if (vols.some(function (v) { return v.fs !== "NTFS"; })) return ["Look at the file system each volume on Disk 1 was formatted with.",
    "A shared Windows data drive needs permissions and a journal. exFAT has neither; delete the volume and create it again with the file system that does."];
  if (n.firstGB && vols.length >= 1) return ["Compare the size of the first volume with what Frank asked for, and remember the wizard asks in MB.",
    "1 TB in Windows' units is 1024 GB, which is 1,048,576 MB. Make the first volume that size, and the second from everything left."];
  if (n.letter) return ["Read what Ruth said the scanner software insists on.",
    "The drive letter is chosen in the New Simple Volume step, or changed afterwards with Change Drive Letter and Paths."];
  return ["Is every byte of Disk 1 inside a volume yet?", "A new simple volume defaults to the whole of the free space. Accept that unless the customer asked for something else."];
}

function diskMoves(job, m) {
  const d = spareDisk(m);
  const n = job.disk.need;
  const M6 = function (right, list) { return [{ label: right, correct: true }].concat(list).slice(0, 6); };
  if (!d) return M6("Go back to the desk: check both SATA leads, then switch on", [
    { label: "Rescan Disks in Disk Management", why: "It rescans what is connected. A drive without data or power is not connected." },
    { label: "Initialize Disk 0", why: "Disk 0 is the drive Windows runs from. It is already initialized." },
    { label: "diskpart, then list disk", why: "DiskPart sees the same disks Disk Management does. It will not see this one either." },
    { label: "Format the drive from File Explorer", why: "It has no volume and no letter, so File Explorer does not list it at all." },
    { label: "Restart without changing anything", why: "A restart does not connect a lead that is not connected." }
  ]);
  if (d.offline) return M6("Right-click Disk 1 and choose Online", [
    { label: "Initialize Disk 1 first", why: "Initialize is not offered on an Offline disk." },
    { label: "Delete the volume on Disk 1", why: "There is no volume; the disk is offline." },
    { label: "Restart the PC", why: "It comes back up Offline again. The policy that did it is still set." },
    { label: "Reseat the SATA leads", why: "It is detected \u2014 it is in the list. Offline is a Windows decision, not a cabling fault." },
    { label: "Convert Disk 1 to GPT", why: "Not offered on an Offline disk." }
  ]);
  if (d.parts.some(function (p) { return p.kind === "data" && p.files; })) return M6("Delete the old OLD-NAS volume, which Marcus said can go", [
    { label: "Convert to GPT Disk straight away", why: "Convert only works on an empty disk. Greyed out while the old volume is there." },
    { label: "Extend the old volume over the rest", why: "On MBR it cannot reach past 2048 GB, and the old volume is not what was asked for." },
    { label: "Format the old volume as NTFS and use it", why: "It stays on an MBR disk capped at 2048 GB, leaving most of the drive unusable." },
    { label: "Initialize Disk 1 as GPT", why: "It is already initialized, as MBR. Initialize is not offered." },
    { label: "Create a second volume in the free space", why: "Still MBR, still capped. The space past 2048 GB stays out of reach." }
  ]);
  if (!d.style) return M6("Initialize Disk 1 as GPT", [
    { label: "Initialize Disk 1 as MBR", why: "MBR reaches only the first 2048 GB of this drive." },
    { label: "Create a volume without initializing", why: "Not offered: a disk with no partition table has nowhere to record one." },
    { label: "Format Disk 1 as exFAT", why: "There is nothing to format until the disk is initialized and a volume exists." },
    { label: "Initialize Disk 0", why: "That is the system disk, already initialized." },
    { label: "Mark Disk 1 as active", why: "Active is an MBR boot flag. This is a data drive, and it is not initialized." }
  ]);
  if (d.style === "MBR") return M6("Delete any volume on it, then Convert to GPT Disk", [
    { label: "Extend the volume into the rest of the space", why: "The second block is past MBR's limit. Nothing can be created or extended into it." },
    { label: "Create a second volume in the other block", why: "That block is unreachable on MBR. It is shown, and it cannot be used." },
    { label: "Convert to GPT with the volume still there", why: "Greyed out: convert only works on an empty disk." },
    { label: "Restart the PC", why: "The partition table is written on the disk. It is still MBR afterwards." },
    { label: "Leave it at 2048 GB", why: "The customer asked for the whole drive \u2014 and was told about exactly this." }
  ]);
  const vols = d.parts.filter(function (p) { return p.kind === "data"; });
  if (vols.some(function (v) { return v.fs !== "NTFS"; })) return M6("Delete that volume and create it again as NTFS", [
    { label: "Keep exFAT \u2014 it holds big files", why: "It does, and it has no permissions and no journal. A shared office drive needs both." },
    { label: "Format it FAT32", why: "Not offered at this size, and it cannot hold a file over 4 GB." },
    { label: "Convert the disk to MBR", why: "That changes the partition table, not the file system, and MBR is the wrong way anyway." },
    { label: "chkdsk the volume", why: "It checks a file system; it does not change which one it is." },
    { label: "Change its drive letter", why: "The letter is not the problem. The file system is." }
  ]);
  if (n.firstGB) return M6("New Simple Volume of 1,048,576 MB, then another from the rest", [
    { label: "New Simple Volume of 1,000,000 MB", why: "That is a million MB \u2014 about 976 GB in Windows' units. Frank asked for 1 TB." },
    { label: "One volume using all the space", why: "Frank asked for it split." },
    { label: "New Simple Volume of 1,024 MB", why: "That is 1 GB, not 1 TB. The wizard asks in megabytes." },
    { label: "Two volumes of half each", why: "He asked for 1 TB and then everything else." },
    { label: "Shrink Disk 0 by 1 TB", why: "Disk 0 is the system disk and is far smaller than that." }
  ]);
  if (n.letter) return M6("New Simple Volume, all the space, NTFS, drive letter R", [
    { label: "Accept the letter Windows suggests", why: "Ruth said the scanner will only save to R:." },
    { label: "Label the volume \u201cR\u201d", why: "A label is a name. The scanner needs the drive LETTER." },
    { label: "Map a network drive as R:", why: "The drive is in this PC. It needs a local letter." },
    { label: "Format as exFAT with letter R", why: "Right letter, wrong file system for a shared office drive." },
    { label: "Initialize as MBR to get letter R", why: "The partition style has nothing to do with letters, and MBR caps this drive at 2048 GB." }
  ]);
  return M6("New Simple Volume, all of the space, NTFS", [
    { label: "New Simple Volume as exFAT", why: "No permissions and no journal, on a drive the whole office will save to." },
    { label: "New Simple Volume of 2048 GB", why: "That leaves the rest of the drive unused. Nothing asked for that." },
    { label: "New Spanned Volume", why: "Spanning joins space across two disks. There is only one new disk." },
    { label: "Mark the partition as active", why: "Active is an MBR boot flag. This is a GPT data drive." },
    { label: "Assign a drive letter first", why: "A letter belongs to a volume. There is no volume yet." }
  ]);
}

function diskAnswer(job) {
  const d = job.disk, n = d.need;
  const parts = [];
  if (d.offline) parts.push("right-click Disk 1 \u2192 Online");
  if (d.oldVolume) parts.push("delete the OLD-NAS volume, then Convert to GPT Disk");
  else parts.push("Initialize Disk 1 as GPT");
  if (n.volumes > 1) parts.push("New Simple Volume 1,048,576 MB NTFS, then New Simple Volume on the rest, NTFS");
  else parts.push("New Simple Volume, all the space, NTFS" + (n.letter ? ", letter " + n.letter : ""));
  return parts.join("; ") + ".";
}

/* ---------------- the bench on the desk ---------------- */
function fitHints(m) {
  const h = m.hw;
  if (m.power === "on" && !h.driveFitted) return ["Look at the front of the tower before you reach for the side panel.",
    "Shut Windows down properly and unplug the mains before opening a case. An ATX supply keeps standby power on the board even when the PC is off."];
  if (h.mains && !h.driveFitted) return ["Look at the back of the tower: is it still plugged in?",
    "Off is not the same as disconnected. Standby power reaches the board while the lead is in."];
  if (!h.panelOff && !h.driveFitted) return ["The drive goes inside the case.", "The side panel comes off first. It is one of the controls on the tower."];
  if (!h.driveFitted) return ["Where do 3.5-inch drives live in a tower?", "Fit the drive in the drive cage at the front, and secure it."];
  if (!h.sataData || !h.sataPower) return ["A drive needs two leads. Count the ones connected to it.",
    "SATA DATA runs from the motherboard to the drive; SATA POWER runs from the power supply to the drive. Either one missing and Windows never sees it."];
  if (h.panelOff) return ["What did you take off to get in?", "Close the case before handing a PC back."];
  if (!h.mains) return ["Look at the back of the tower.", "Nothing starts without mains power."];
  return ["Look at the front of the tower.", "The last step is switching it on."];
}
function fitMoves(m) {
  const h = m.hw;
  const M6 = function (right, list) { return [{ label: right, correct: true }].concat(list).slice(0, 6); };
  if (m.power === "on" && !h.driveFitted) return M6("Shut down from the Start menu", [
    { label: "Remove the side panel", why: "The PC is running. Open it later." },
    { label: "Unplug the mains now", why: "Pulling the plug on a running PC is a power cut; shut Windows down first." },
    { label: "Hold the power button for ten seconds", why: "A forced power-off. Windows can shut itself down properly." },
    { label: "Fit the drive through the front bay", why: "It fits inside the case, behind the panel." },
    { label: "Plug the drive into a USB port", why: "It is an internal SATA drive. It has no USB connector." }
  ]);
  if (h.mains && !h.driveFitted) return M6("Unplug the mains lead", [
    { label: "Remove the side panel now", why: "Standby power is still on the board while the lead is in." },
    { label: "Press the power button to be sure it is off", why: "That switches it back ON." },
    { label: "Fit the drive with the lead in", why: "The panel has to come off first, and not while it is plugged in." },
    { label: "Switch it off at the monitor", why: "The monitor is not the PC." },
    { label: "Wait a minute for it to cool", why: "Heat is not the hazard here; mains is." }
  ]);
  if (!h.panelOff && !h.driveFitted) return M6("Remove the side panel", [
    { label: "Fit the drive", why: "It goes inside. The panel is still on." },
    { label: "Connect the SATA data cable", why: "The ports are inside the case." },
    { label: "Plug the mains back in", why: "Not yet. You have not opened it." },
    { label: "Press the power button", why: "The drive is not fitted." },
    { label: "Remove the front bezel", why: "The drive cage is reached from the side." }
  ]);
  if (!h.driveFitted) return M6("Fit the drive in the drive cage", [
    { label: "Connect SATA data first", why: "Fit the drive first; the leads then reach it where it sits." },
    { label: "Lay the drive on the floor of the case", why: "Loose drives vibrate and short against the case. It goes in the cage." },
    { label: "Refit the side panel", why: "The drive is not in yet." },
    { label: "Plug the mains back in", why: "Keep it unplugged while your hands are inside." },
    { label: "Press the power button", why: "The drive is not in yet, and the case is open." }
  ]);
  if (!h.sataData || !h.sataPower) return M6(!h.sataData ? "Connect the SATA data cable, board to drive" : "Connect the SATA power lead, supply to drive", [
    { label: "Refit the panel and switch on", why: "Without both leads the drive is not detected." },
    { label: "Plug the drive into the Molex lead", why: "This drive takes a SATA power connector, not Molex." },
    { label: "Connect the data cable to the power supply", why: "Data comes from the motherboard. Power comes from the supply." },
    { label: "Connect the front-panel USB header to the drive", why: "That header is for the case's USB ports." },
    { label: "Take the drive out and try another bay", why: "The bay is fine. The leads are what is missing." }
  ]);
  if (h.panelOff) return M6("Refit the side panel", [
    { label: "Switch on with the case open", why: "Close it up first; this is being handed back to a customer." },
    { label: "Remove the drive again", why: "It is fitted and cabled." },
    { label: "Disconnect the SATA power", why: "It is needed." },
    { label: "Plug in and press power", why: "The panel is still off." },
    { label: "Tape the panel on", why: "It has thumbscrews." }
  ]);
  return M6(!h.mains ? "Plug the mains lead back in" : "Press the power button", [
    { label: "Open the case again", why: "Everything inside is done." },
    { label: "Unplug the SATA data", why: "It is needed." },
    { label: "Wait for Windows to find it", why: "Windows is not running." },
    { label: "Hold the power button for ten seconds", why: "That forces power OFF." },
    { label: "Switch the monitor on and off", why: "The monitor is not the PC." }
  ]);
}
