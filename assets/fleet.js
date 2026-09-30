/* =====================================================================
   The machines at Rafiki's IT Services.

   The seven from the Malware Incident Response sim, at the desks the
   owner agreed on 30 September (HR and Finance share Office 1), plus the
   technician's own workstation. Each one is a whole PC with its own
   state; a ticket changes the machines it is about and nothing else.
   ===================================================================== */
import * as M from "./machine.js";

/* Where each machine sits in the 3D office, in feet on the floor plan
   (see office3d.js). `desk` is the monitor's position. */
export const ROSTER = [
  { id: "TECH", host: "TECH-01", user: "tech", fullName: "You (Tier 1 technician)", dept: "IT", where: "Your workstation", ip: "192.168.1.20" },
  { id: "WS1", host: "WS1-HR", user: "jdoe", fullName: "John Doe", dept: "HR", where: "Office 1", desk: [9, 1.6], ip: "192.168.1.21" },
  { id: "WS4", host: "WS4-FIN", user: "finance", fullName: "Farah Nkemelu", dept: "Finance", where: "Office 1", desk: [1.6, 8.2], ip: "192.168.1.24" },
  { id: "WS2", host: "WS2-SALES", user: "bsmith", fullName: "Brenda Smith", dept: "Sales", where: "Office 2", desk: [23, 1.6], ip: "192.168.1.22" },
  { id: "WS3", host: "WS3-DEV", user: "dev", fullName: "Dev Patel", dept: "Dev", where: "Office 3", desk: [36, 1.6], ip: "192.168.1.23" },
  { id: "WS5", host: "WS5-RECEPT", user: "recept", fullName: "Rosa Ortiz", dept: "Reception", where: "Reception", desk: [2.0, 23.5], ip: "192.168.1.25" },
  { id: "FS01", host: "FS01", user: "admin", fullName: "File Server", dept: "Server", where: "Network closet", desk: [16.5, 29], ip: "192.168.1.10", edition: "Windows Server 2022 Standard" },
  { id: "MAIL01", host: "MAIL01", user: "admin", fullName: "Mail Server", dept: "Server", where: "Network closet", desk: [16.5, 28], ip: "192.168.1.11", edition: "Windows Server 2022 Standard" }
];

/* The office's line-of-business programs. `bundles` is which runtimes
   each installer carries — whether Repair also brings back a missing
   runtime depends on it, which is the whole of one App Launch ticket. */
export const APPS = {
  Testing: { name: "Testing", exe: "Testing.exe", ver: "4.2.0", publisher: "Rafiki's IT Services", dir: "C:\\Program Files (x86)\\Testing", bits: 32, needs: ["msvcp100.dll", "msvcr100.dll"], files: [{ name: "config.ini", size: 1024 }], bundles: ["vc2010x86"] },
  PayWise: { name: "PayWise", exe: "PayWise.exe", ver: "3.1.4", publisher: "PayWise Software Ltd", dir: "C:\\Program Files (x86)\\PayWise", bits: 32, needs: ["vcruntime140.dll", "msvcp140.dll"], files: [{ name: "paywise.cfg", size: 2048 }], bundles: ["vc2015x86"] },
  Scan2Doc: { name: "Scan2Doc", exe: "Scan2Doc.exe", ver: "7.0.2", publisher: "DocuLine Inc.", dir: "C:\\Program Files (x86)\\Scan2Doc", bits: 32, needs: ["msvcr120.dll"], files: [{ name: "profiles.xml", size: 4096 }], bundles: [] },
  LabelPro: { name: "LabelPro", exe: "LabelPro.exe", ver: "11.3", publisher: "Brady Tag Co.", dir: "C:\\Program Files\\LabelPro 11", bits: 64, needs: ["vcruntime140.dll"], files: [{ name: "templates.dat", size: 65536 }], bundles: ["vc2015x64"] },
  ChartView: { name: "ChartView", exe: "ChartView.exe", ver: "2.8", publisher: "Graphwise Ltd", dir: "C:\\Program Files\\ChartView", bits: 64, needs: ["msvcp140.dll", "vcruntime140.dll"], files: [{ name: "chartview.ini", size: 900 }], bundles: [] }
};

/* Software Center: what a user or a Tier 1 technician can install or
   reinstall without an administrator's password. */
export const CATALOGUE = [
  { kind: "app", key: "Testing", label: "Testing 4.2" },
  { kind: "app", key: "PayWise", label: "PayWise 3.1" },
  { kind: "app", key: "Scan2Doc", label: "Scan2Doc 7.0" },
  { kind: "app", key: "LabelPro", label: "LabelPro 11" },
  { kind: "app", key: "ChartView", label: "ChartView 2.8" },
  { kind: "runtime", key: "vc2010x86", label: "Microsoft Visual C++ 2010 Redistributable (x86)" },
  { kind: "runtime", key: "vc2013x86", label: "Microsoft Visual C++ 2013 Redistributable (x86)" },
  { kind: "runtime", key: "vc2015x86", label: "Microsoft Visual C++ 2015-2022 Redistributable (x86)" },
  { kind: "runtime", key: "vc2015x64", label: "Microsoft Visual C++ 2015-2022 Redistributable (x64)" }
];

export function makeFleet() {
  const fleet = {};
  ROSTER.forEach(function (r) {
    fleet[r.id] = M.makeMachine({ id: r.id, host: r.host, user: r.user, fullName: r.fullName, dept: r.dept, ip: r.ip, edition: r.edition,
      apps: r.id === "TECH" || r.id === "FS01" || r.id === "MAIL01" ? [] : [APPS.Testing, APPS.PayWise] });
  });
  /* the file server's Software share: \\FS01\Software */
  ["vcredist_x86_2010.exe", "vcredist_x86_2013.exe", "VC_redist.x86.exe", "VC_redist.x64.exe"].forEach(function (n) {
    M.putFile(fleet.FS01.fs, "C:\\Software", { name: n, size: 14000000 });
  });
  return fleet;
}
export function byHost(fleet, host) {
  const h = String(host).toLowerCase();
  return Object.values(fleet).filter(function (m) { return m.host.toLowerCase() === h || m.id.toLowerCase() === h; })[0] || null;
}
export function rosterOf(id) { return ROSTER.filter(function (r) { return r.id === id; })[0] || null; }
