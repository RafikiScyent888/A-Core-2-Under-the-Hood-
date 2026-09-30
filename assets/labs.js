/* =====================================================================
   The lab registry.

   Every lab is a TIERED STAGE LIST, as in the Core 1 build. The student
   picks a length and that choice selects tiers:

     quick    core
     lab      core + lab
     project  core + lab + project
     layered  core, with the rest offered as they finish — the default

   THE RULE: the `core` path is a complete job on its own. A longer
   choice adds work in the middle; it never unlocks an ending the short
   path was missing.
   ===================================================================== */

/* THE OBJECTIVES — the owner's "All updated Objectives" doc, A+ Core 2
   (V15), read 30 September 2026. The doc gives domains and topics and NO
   numbers, so there are none here: a stage names its topics by `id`,
   which is a short key made up for this file, never shown as if it were
   CompTIA's. Re-read the doc at the start of each lab's build. */
export const TOPICS = [
  { id: "os-install", domain: "Operating systems", title: "OS installation", detail: "Windows, macOS, Linux, mobile" },
  { id: "os-tools",   domain: "Operating systems", title: "Windows tools", detail: "Task Manager, Command Prompt, Disk Management" },
  { id: "os-fs",      domain: "Operating systems", title: "File systems", detail: "File systems, updates, OS upgrades" },
  { id: "sec-measures", domain: "Security", title: "Security measures", detail: "Encryption, access controls, wireless security protocols" },
  { id: "sec-malware",  domain: "Security", title: "Malware prevention", detail: "Detecting, removing, preventing" },
  { id: "sw-os",      domain: "Software troubleshooting", title: "OS issues", detail: "" },
  { id: "sw-mobile",  domain: "Software troubleshooting", title: "Mobile troubleshooting", detail: "Connectivity, app, performance" },
  { id: "sw-security", domain: "Software troubleshooting", title: "Security concerns", detail: "Unauthorized access, malware" },
  { id: "op-docs",    domain: "Operational procedures", title: "Documentation", detail: "Best practices for system changes and documentation" },
  { id: "op-safety",  domain: "Operational procedures", title: "Safety and communication", detail: "" },
  { id: "op-backup",  domain: "Operational procedures", title: "Backup and recovery", detail: "" }
];
export const DOMAIN_WEIGHT = { "Operating systems": 28, "Security": 28, "Software troubleshooting": 23, "Operational procedures": 21 };

export function topicById(id) { return TOPICS.filter(function (t) { return t.id === id; })[0] || null; }

export const TIERS = ["core", "lab", "project"];

export const LENGTHS = {
  layered: { label: "Layered — short, with optional depth", tiers: ["core"], offersRest: true,
    note: "The Quick path, and every deeper stage is offered when you finish it. Take the ones you want." },
  quick: { label: "Quick — 10 to 20 minutes", tiers: ["core"],
    note: "One sitting. The whole job, at its shortest. Good for repeating a job you got wrong." },
  lab: { label: "Lab — 30 to 45 minutes", tiers: ["core", "lab"],
    note: "A class period. The same job with the middle opened up." },
  project: { label: "Project — an hour or more", tiers: ["core", "lab", "project"],
    note: "The full job, every stage. Progress is saved, so you can close this and come back." }
};

/* The four gaps the owner named in the Core 1 build, which apply here
   unchanged: every lab's core path must attack all four. */
export const GAPS = {
  pbq: "Hands-on task",
  why: "Mechanism — the why",
  calc: "Calculation",
  read: "Reading the brief"
};

/* `built: false` stages are listed so the plan is visible, and are left
   out of every length until they exist. A length that would add nothing
   built is not offered at all — no length promises a stage it cannot
   run. */
export const LABS = [
  {
    key: "tools",
    name: "Windows Tools Console",
    blurb: "Sit down at the customer's PC and fix it with the tools Windows gives you: Task Manager, the Command Prompt and Disk Management. Typed commands, real answers, real consequences.",
    stages: [
      { key: "desk",  tier: "core", topics: ["op-docs", "os-tools"], gaps: ["read"], built: true,
        title: "Read the ticket, and find what the customer actually told you" },
      { key: "slow",  tier: "core", topics: ["os-tools", "sw-os"], gaps: ["pbq", "why"], built: true,
        title: "It crawls — find what is using the machine in Task Manager, and deal with it properly" },
      { key: "admin", tier: "core", topics: ["os-tools", "sw-os"], gaps: ["pbq", "why"], built: true,
        title: "Repair Windows' own files from the Command Prompt" },
      { key: "disk",  tier: "core", topics: ["os-tools", "os-fs", "op-safety"], gaps: ["calc", "pbq", "why"], built: true,
        title: "Fit the new drive and make it usable in Disk Management" },
      { key: "deploy", tier: "lab", topics: ["os-tools", "sw-os"], gaps: ["pbq", "why", "read"], built: false,
        title: "An app broke after a deployment — the old fix, tried, and why it fails" },
      { key: "launch", tier: "lab", topics: ["sw-os", "op-docs"], gaps: ["read", "why"], built: false,
        title: "“MSVCP100.dll is missing” — the safest fix inside Tier 1" },
      { key: "startup", tier: "lab", topics: ["os-tools", "sw-os"], gaps: ["pbq", "calc"], built: false,
        title: "Slow to log in — cut the startup load without switching off the antivirus" },
      { key: "net", tier: "lab", topics: ["os-tools", "sw-os"], gaps: ["pbq", "why"], built: false,
        title: "It can't reach anything — ipconfig, ping and nslookup" },
      { key: "usb", tier: "project", topics: ["os-fs", "os-tools"], gaps: ["pbq", "read", "why"], built: false,
        title: "A stick for a Mac and a PC, with a 6 GB file on it — and the wrong disk to avoid" },
      { key: "extend", tier: "project", topics: ["os-tools", "os-fs"], gaps: ["why", "pbq"], built: false,
        title: "C: is full and Extend Volume is greyed out" },
      { key: "handover", tier: "project", topics: ["op-docs"], gaps: ["read"], built: false,
        title: "The job sheet — what you ran, what it showed, what you changed" }
    ]
  }
];

/* The other seven labs, named so the front page can say what is coming
   and so the coverage check knows where each uncovered topic is going.
   Moving a lab from here into LABS is how it goes live. */
export const PLANNED = [
  { name: "Install Bench", topics: ["os-install", "os-fs"] },
  { name: "Lock It Down", topics: ["sec-measures"] },
  { name: "Malware Bench", topics: ["sec-malware", "sw-security"] },
  { name: "OS Troubleshooting", topics: ["sw-os"] },
  { name: "Mobile Bench", topics: ["sw-mobile", "sw-security"] },
  { name: "Change and Communication", topics: ["op-docs", "op-safety"] },
  { name: "Backup and Safety", topics: ["op-backup", "op-safety"] }
];

export function stagesFor(lab, lengthKey) {
  const L = LENGTHS[lengthKey] || LENGTHS.layered;
  return lab.stages.filter(function (s) { return s.built && L.tiers.indexOf(s.tier) >= 0; });
}
export function optionalFor(lab, lengthKey) {
  const L = LENGTHS[lengthKey] || LENGTHS.layered;
  if (!L.offersRest) return [];
  return lab.stages.filter(function (s) { return s.built && L.tiers.indexOf(s.tier) < 0; });
}
/* Lengths worth offering for this lab: Quick and Layered always; Lab and
   Project only once they would add a stage that exists. */
export function lengthsFor(lab) {
  return Object.keys(LENGTHS).filter(function (k) {
    if (k === "quick" || k === "layered") return true;
    const core = stagesFor(lab, "quick").length;
    return stagesFor(lab, k).length > core &&
      (k === "lab" || stagesFor(lab, "project").length > stagesFor(lab, "lab").length);
  });
}
