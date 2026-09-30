/* =====================================================================
   The technician's desk — the 3D model for the Windows Tools Console.

   The tower is the Core 1 build's PC tower (`pcTower` in Core 1's
   bench-room.js: front bezel, mesh intake, power button, side-panel seam),
   reused on the owner's say-so on 30 September 2026 and extended here with
   what this lab needs a student to put their hands on: a side panel that
   comes off, a drive cage, SATA ports on the board, a power supply with
   its leads, a network port and a mains inlet at the back.

   Same two rules as every bench in the Core 1 build:

     1. THE CANVAS IS SCENERY. Every action here is a labelled HTML button
        in the list beside the canvas. Turn WebGL off and the lab still
        works; the picture was never the interface.
     2. ONE COLOUR PER PART. Anything that changes colour on its own — the
        power light, the disk light, the screen — is its own part, and its
        state is ALSO given in words, because colour is never the only
        channel for these students.

   One unit is about 3.3 cm, which is the scale pcTower was drawn at: a
   mid tower 6 x 14 x 12 units is 20 x 46 x 40 cm.
   ===================================================================== */
import * as M from "./machine.js";

const P2 = Math.PI / 2;
const TX = 15, TZ = -2;           /* where the tower stands on the desk */
const TW = 6.0, TH = 14.0, TD = 12.0;
const FRONT = TZ + TD / 2;        /* z of the front face */
const BACK = TZ - TD / 2;
const SIDE = TX + TW / 2;         /* x of the side panel */

/* THE CASE IS FIVE WALLS, NOT A BLOCK. The first cut drew it as one solid
   box, the way the Core 1 room draws it on a shelf, and the side panel
   came off to show... the side of a solid box: everything inside was
   drawn and buried. This renderer has no boolean subtraction, so an open
   case has to be built open. The side panel is the sixth wall and is its
   own part. */
const WALL = 0.3;
function towerCase() {
  return [
    { shape: "rbox", size: [WALL, TH, TD], pos: [-TW / 2 + WALL / 2, TH / 2, 0], r: 0.12, shade: 1.0 },
    { shape: "rbox", size: [TW, WALL, TD], pos: [0, TH - WALL / 2, 0], r: 0.12, shade: 1.05 },
    { shape: "rbox", size: [TW, WALL, TD], pos: [0, 0.6 + WALL / 2, 0], r: 0.12, shade: 0.9 },
    { shape: "rbox", size: [TW, TH, WALL], pos: [0, TH / 2, -TD / 2 + WALL / 2], r: 0.12, shade: 0.95 },
    { shape: "rbox", size: [TW, TH, WALL], pos: [0, TH / 2, TD / 2 - WALL / 2], r: 0.12, shade: 1.0 },
    { shape: "rbox", size: [TW - 0.3, TH - 0.6, 0.7], pos: [0, TH / 2, TD / 2 + 0.2], r: 0.3, shade: 1.14 },
    { shape: "cyl", size: [0.8, 0.3], pos: [0, TH - 1.6, TD / 2 + 0.6], rot: [P2, 0, 0], seg: 14, shade: 1.6 },
    { shape: "rbox", size: [TW - 2.0, 0.5, 0.4], pos: [0, TH - 3.2, TD / 2 + 0.55], r: 0.12, shade: 0.66 },
    { shape: "rbox", size: [TW - 1.0, 0.6, 1.6], pos: [0, 0.3, TD * 0.3], r: 0.15, shade: 0.7 },
    { shape: "rbox", size: [TW - 1.0, 0.6, 1.6], pos: [0, 0.3, -TD * 0.3], r: 0.15, shade: 0.7 },
    /* the rear I/O plate and the exhaust fan grille */
    { shape: "box", size: [TW - 2.4, 1.6, 0.2], pos: [-0.6, TH - 3.0, -TD / 2 - 0.05], r: 0.02, shade: 0.55 },
    { shape: "torus", size: [2.6, 0.2], pos: [-0.2, TH - 6.0, -TD / 2 - 0.08], seg: 24, shade: 0.5 }
  ].concat(intake());
}
function intake() {
  const out = [];
  for (let i = 0; i < 7; i++) out.push({ shape: "box", size: [TW - 2.2, 0.30, 0.30], pos: [0, 2.4 + i * 1.0, TD / 2 + 0.6], r: 0.06, shade: 0.62 });
  return out;
}

function interior() {
  return [
    /* the motherboard on the far wall */
    { shape: "box", size: [0.2, 9.5, 8.5], pos: [-TW / 2 + 0.45, 8.2, -1.0], r: 0.02, shade: 1.0 },
    /* the power supply at the bottom rear */
    { shape: "rbox", size: [TW - 1.0, 3.0, 4.8], pos: [0, 1.9, -TD / 2 + 3.0], r: 0.15, shade: 0.8 },
    /* the drive cage at the front bottom: two rails and a floor */
    { shape: "box", size: [TW - 1.2, 0.15, 3.4], pos: [0, 1.3, TD / 2 - 2.4], r: 0.02, shade: 0.9 },
    { shape: "box", size: [TW - 1.2, 0.15, 3.4], pos: [0, 3.1, TD / 2 - 2.4], r: 0.02, shade: 0.9 },
    { shape: "box", size: [TW - 1.2, 0.15, 3.4], pos: [0, 4.9, TD / 2 - 2.4], r: 0.02, shade: 0.9 },
    { shape: "box", size: [0.15, 3.8, 3.4], pos: [-TW / 2 + 0.7, 3.1, TD / 2 - 2.4], r: 0.02, shade: 0.8 }
  ];
}
/* SATA ports on the board's front edge: the four little L-shaped sockets. */
function sataPorts() {
  return [{ shape: "box", size: [0.5, 0.35, 0.55], pos: [-TW / 2 + 0.75, 4.2, 2.6], r: 0.02, shade: 0.5, repeat: { count: 4, step: [0, 0.5, 0] } }];
}
function drive() {
  /* a 3.5-inch drive: 146 x 101 x 26 mm, lying in the cage, connectors to the side panel */
  return [
    { shape: "rbox", size: [4.4, 0.8, 3.0], pos: [0.2, 2.15, TD / 2 - 2.4], r: 0.08, shade: 1.0 },
    { shape: "box", size: [3.6, 0.05, 2.4], pos: [0.2, 2.57, TD / 2 - 2.4], r: 0.01, shade: 1.3 },
    { shape: "box", size: [0.2, 0.35, 1.4], pos: [2.45, 2.15, TD / 2 - 2.0], r: 0.02, shade: 0.45 }
  ];
}
function sataData() {
  /* board port, out towards the side, down, and into the drive */
  return [
    { shape: "box", size: [3.0, 0.12, 0.35], pos: [-0.9, 4.2, 2.6], r: 0.03, shade: 1.0 },
    { shape: "box", size: [0.35, 2.0, 0.12], pos: [0.6, 3.2, 2.6], r: 0.03, shade: 1.0 },
    { shape: "box", size: [2.0, 0.12, 0.35], pos: [1.6, 2.2, 2.6], r: 0.03, shade: 1.0 }
  ];
}
function sataPowerIn() {
  return [
    { shape: "box", size: [0.3, 0.3, 4.0], pos: [1.8, 3.6, 0.9], r: 0.08, shade: 1.0 },
    { shape: "box", size: [0.3, 1.5, 0.3], pos: [1.8, 2.8, 3.0], r: 0.08, shade: 1.0 },
    { shape: "box", size: [0.5, 0.4, 1.1], pos: [2.4, 2.1, TD / 2 - 1.8], r: 0.04, shade: 0.7 }
  ];
}
function sataPowerLoose() {
  return [
    { shape: "box", size: [0.3, 0.3, 3.5], pos: [1.8, 3.6, 0.6], r: 0.08, shade: 1.0 },
    { shape: "box", size: [0.3, 2.4, 0.3], pos: [1.8, 2.3, 2.4], r: 0.08, shade: 1.0 },
    { shape: "box", size: [0.9, 0.5, 0.4], pos: [1.8, 1.1, 2.4], r: 0.05, shade: 0.7 }
  ];
}

function desk() {
  return [
    { shape: "rbox", size: [46, 1.2, 22], pos: [0, -0.6, 0], r: 0.25, shade: 1.0 },
    { shape: "box", size: [1.6, 18, 1.6], pos: [-21.5, -9.6, -9], r: 0.1, shade: 0.7 },
    { shape: "box", size: [1.6, 18, 1.6], pos: [21.5, -9.6, -9], r: 0.1, shade: 0.7 },
    { shape: "box", size: [1.6, 18, 1.6], pos: [-21.5, -9.6, 9], r: 0.1, shade: 0.7 },
    { shape: "box", size: [1.6, 18, 1.6], pos: [21.5, -9.6, 9], r: 0.1, shade: 0.7 }
  ];
}
function monitorBody() {
  return [
    { shape: "rbox", size: [7, 0.35, 4.5], pos: [-4, 0.18, -5.5], r: 0.15, shade: 0.9 },
    { shape: "rbox", size: [1.2, 5.2, 0.8], pos: [-4, 2.8, -6.3], r: 0.1, shade: 0.8 },
    { shape: "rbox", size: [19, 11.5, 0.9], pos: [-4, 9.8, -5.9], r: 0.25, shade: 1.0 }
  ];
}
const SCREEN_Z = -5.9 + 0.45 + 0.04;
function screenPanel() { return [{ shape: "box", size: [18.0, 10.4, 0.06], pos: [-4, 9.9, SCREEN_Z], r: 0.01, shade: 1.0 }]; }
function screenContent(state) {
  const z = SCREEN_Z + 0.06;
  if (state === "bsod") return [
    { shape: "box", size: [1.6, 1.6, 0.03], pos: [-10.5, 12.6, z], r: 0.01, shade: 1.0 },
    { shape: "box", size: [11, 0.4, 0.03], pos: [-6, 10.4, z], r: 0.01, shade: 1.0 },
    { shape: "box", size: [8, 0.4, 0.03], pos: [-7.5, 9.5, z], r: 0.01, shade: 1.0 }
  ];
  const out = [
    { shape: "box", size: [18.0, 0.8, 0.03], pos: [-4, 5.1, z], r: 0.01, shade: 1.25 }
  ];
  if (state === "noshell") return [{ shape: "box", size: [9, 5.5, 0.03], pos: [-6.5, 10.5, z], r: 0.01, shade: 1.3 }];
  out.push({ shape: "box", size: [9, 5.5, 0.03], pos: [-6.5, 10.5, z], r: 0.01, shade: 1.3 });
  out.push({ shape: "box", size: [6.5, 4.0, 0.03], pos: [0.5, 9.0, z + 0.01], r: 0.01, shade: 1.15 });
  return out;
}
function keyboard() {
  const out = [{ shape: "rbox", size: [14, 0.45, 4.4], pos: [-4, 0.23, 4.2], r: 0.12, shade: 0.9 }];
  for (let r = 0; r < 4; r++) out.push({ shape: "rbox", size: [0.8, 0.25, 0.8], pos: [-10, 0.55, 2.8 + r * 0.95], r: 0.06, shade: 1.2, repeat: { count: 13, step: [0.98, 0, 0] } });
  out.push({ shape: "rbox", size: [6.0, 0.25, 0.8], pos: [-4, 0.55, 6.6], r: 0.06, shade: 1.2 });
  out.push({ shape: "sphere", size: [1.6, 0.9, 2.6], pos: [6.0, 0.4, 4.4], seg: 18, shade: 1.0 });
  return out;
}
function bag() {
  return [{ shape: "rbox", size: [6.4, 1.1, 5.0], pos: [-17, 0.55, 4.5], r: 0.4, shade: 1.0 }];
}
function looseCable() {
  return [{ shape: "torus", size: [2.4, 0.22], pos: [-11.5, 0.12, 8.2], rot: [P2, 0, 0], seg: 24, shade: 1.0 }];
}
function netCable(plugged) {
  if (plugged) return [
    { shape: "box", size: [0.7, 0.6, 0.9], pos: [TX - 1.4, 8.0, BACK - 0.45], r: 0.08, shade: 1.0 },
    { shape: "box", size: [0.3, 8.0, 0.3], pos: [TX - 1.4, 4.0, BACK - 1.0], r: 0.1, shade: 1.0 }
  ];
  return [
    { shape: "box", size: [0.7, 0.6, 0.9], pos: [TX - 3.8, 0.35, BACK - 0.2], r: 0.08, shade: 1.0 },
    { shape: "box", size: [4.0, 0.3, 0.3], pos: [TX - 6.2, 0.2, BACK - 0.2], r: 0.1, shade: 1.0 }
  ];
}
function mainsLead(plugged) {
  if (plugged) return [
    { shape: "rbox", size: [1.4, 1.0, 1.2], pos: [TX, 2.0, BACK - 0.6], r: 0.15, shade: 1.0 },
    { shape: "box", size: [0.4, 2.4, 0.4], pos: [TX, 0.8, BACK - 1.3], r: 0.12, shade: 1.0 }
  ];
  return [
    { shape: "rbox", size: [1.4, 1.0, 1.2], pos: [TX + 4.4, 0.5, BACK - 0.6], r: 0.15, shade: 1.0 },
    { shape: "box", size: [3.0, 0.4, 0.4], pos: [TX + 2.4, 0.2, BACK - 0.6], r: 0.12, shade: 1.0 }
  ];
}

/* ---------------------------------------------------------------------
   The spec, drawn from the machine's state every time.
   --------------------------------------------------------------------- */
export function deskSpec(m, stage) {
  const h = m.hw || {};
  const on = m.power === "on";
  const t = M.totals(m);
  const busyDisk = on && !m.crashed && t.diskPct >= 15;
  const hot = on && !m.crashed && t.cpu >= 30;
  const screenState = !on ? "off" : m.crashed ? "bsod" : m.shellGone ? "noshell" : "on";
  const parts = [
    { key: "tower", label: "The PC tower", build: towerCase(), finish: "plastic", scale: 1, pos: [TX, 0, TZ], color: "#2b3038",
      spec: "Mid tower", note: "The customer's PC." },
    { key: "powerled", label: "Power light", build: [{ shape: "cyl", size: [0.35, 0.2], pos: [1.6, TH - 1.6, TD / 2 + 0.62], rot: [P2, 0, 0], seg: 12 }],
      finish: "plastic", scale: 1, pos: [TX, 0, TZ], color: on ? "#2fd45e" : "#2a2f36", glow: on ? 1.2 : 0, spec: on ? "Lit" : "Off", note: "" },
    { key: "diskled", label: "Disk activity light", build: [{ shape: "cyl", size: [0.35, 0.2], pos: [-1.6, TH - 1.6, TD / 2 + 0.62], rot: [P2, 0, 0], seg: 12 }],
      finish: "plastic", scale: 1, pos: [TX, 0, TZ], color: busyDisk ? "#ffd426" : "#2a2f36", glow: busyDisk ? 1.4 : 0, spec: busyDisk ? "Flickering" : "Dark", note: "" },
    { key: "monitor", label: "The monitor", build: monitorBody(), finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#23272e", spec: "", note: "" },
    { key: "screen", label: "The screen", build: screenPanel(), finish: "plastic", scale: 1, pos: [0, 0, 0],
      color: screenState === "off" ? "#15181d" : screenState === "bsod" ? "#1f5fbf" : screenState === "noshell" ? "#0b0d10" : "#2c5aa0",
      glow: screenState === "off" ? 0 : 0.55, spec: "", note: "" },
    { key: "keyboard", label: "Keyboard and mouse", build: keyboard(), finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#30353d", spec: "", note: "" },
    { key: "mains", label: "Mains lead", build: mainsLead(h.mains !== false), finish: "rubber", scale: 1, pos: [0, 0, 0], color: "#1b1e22", spec: "", note: "" },
    { key: "net", label: "Network cable", build: netCable(!m.net || m.net.cable !== false), finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#2f6fd0", spec: "", note: "" }
  ];
  if (screenState !== "off") parts.push({ key: "screen-content", label: "What is on the screen", build: screenContent(screenState), finish: "plastic", scale: 1, pos: [0, 0, 0],
    color: screenState === "bsod" ? "#eef4ff" : "#dfe7f3", glow: 0.35, spec: "", note: "" });
  if (!h.panelOff) {
    parts.push({ key: "panel", label: "Side panel", build: [{ shape: "rbox", size: [0.22, TH - 1.0, TD - 1.2], pos: [TW / 2 + 0.05, TH / 2, 0], r: 0.08 }],
      finish: "metal", scale: 1, pos: [TX, 0, TZ], color: "#5d6570", spec: "Fitted", note: "" });
  } else {
    parts.push({ key: "inside", label: "Inside the case", build: interior(), finish: "metal", scale: 1, pos: [TX, 0, TZ], color: "#7d8791", spec: "", note: "" });
    parts.push({ key: "board", label: "Motherboard SATA ports", build: sataPorts(), finish: "plastic", scale: 1, pos: [TX, 0, TZ], color: "#1f3a2a", spec: "", note: "" });
  }
  if (h.spare) {
    if (h.driveFitted) {
      if (h.panelOff) parts.push({ key: "drive", label: "The new drive", build: drive(), finish: "metal", scale: 1, pos: [TX, 0, TZ], color: "#9aa3ad", spec: "Fitted", note: "" });
    } else {
      parts.push({ key: "bag", label: "The new drive, in its anti-static bag", build: bag(), finish: "metal", scale: 1, pos: [0, 0, 0], color: "#b8c0c8", spec: "", note: "" });
    }
    if (h.panelOff) {
      if (h.sataData) parts.push({ key: "sata-data", label: "SATA data cable", build: sataData(), finish: "plastic", scale: 1, pos: [TX, 0, TZ], color: "#c2272d", spec: "", note: "" });
      parts.push({ key: "sata-power", label: "SATA power lead", build: h.sataPower ? sataPowerIn() : sataPowerLoose(), finish: "plastic", scale: 1, pos: [TX, 0, TZ], color: "#e0b400", spec: "", note: "" });
    }
    if (!h.sataData) parts.push({ key: "sata-data-loose", label: "SATA data cable, coiled", build: looseCable(), finish: "plastic", scale: 1, pos: [0, 0, 0], color: "#c2272d", spec: "", note: "" });
  }
  return {
    kind: "bench",
    title: "The desk",
    board: { size: [46, 1.2, 22], pos: [0, -0.6, 0], color: "#9aa2aa", build: desk() },
    decor: [],
    parts: parts,
    camera: { dist: 46, fitWidth: 48, yaw: 0.95, pitch: 0.38, target: [4, 5.5, -1], min: 18, max: 80 },
    hot: hot
  };
}

/* ---------------------------------------------------------------------
   The controls: the real interface. `allow` is which of them this stage
   offers; everything else is shown with its state and no actions, so the
   student can always read the machine even when a stage is about the
   screen.
   --------------------------------------------------------------------- */
export function deskControls(m, allow) {
  const h = m.hw || {};
  const on = m.power === "on";
  const t = M.totals(m);
  const A = function (id, label, hint) { return allow.indexOf(id) >= 0 ? [{ id: id, label: label, hint: hint }] : []; };
  const list = [];
  list.push({ key: "tower", label: "The PC",
    state: on ? (m.crashed ? "bad" : "ok") : "idle",
    stateWords: !on ? "Off" : m.crashed ? "On — blue screen" : "On",
    detail: !on ? "Power light dark." : "Power light green. Fan " + (t.cpu >= 30 ? "loud, running fast" : "quiet") + ". Disk light " + (t.diskPct >= 15 ? "flickering constantly" : "mostly dark") + ".",
    actions: [].concat(on ? A("force-off", "Hold the power button (force off)") : A("power-on", "Press the power button")) });
  list.push({ key: "mains", label: "Mains lead (back of the tower)", state: h.mains !== false ? "ok" : "idle", stateWords: h.mains !== false ? "Plugged in" : "Unplugged",
    actions: h.mains !== false ? A("mains-out", "Unplug the mains lead") : A("mains-in", "Plug the mains lead back in") });
  list.push({ key: "net", label: "Network cable (back of the tower)", state: !m.net || m.net.cable !== false ? "ok" : "idle",
    stateWords: !m.net || m.net.cable !== false ? "Plugged in" : "Unplugged — this PC is off the network",
    actions: !m.net || m.net.cable !== false ? A("net-unplug", "Unplug the network cable") : A("net-plug", "Plug the network cable back in") });
  list.push({ key: "panel", label: "Side panel", state: h.panelOff ? "warn" : "ok", stateWords: h.panelOff ? "Off — the case is open" : "On",
    actions: h.panelOff ? A("panel-on", "Refit the side panel") : A("panel-off", "Remove the side panel") });
  if (h.spare) {
    list.push({ key: h.driveFitted ? "drive" : "bag", label: "The new drive (" + h.spare.model + ")", state: h.driveFitted ? "ok" : "idle",
      stateWords: h.driveFitted ? "Fitted in the drive cage" : "In its anti-static bag on the desk",
      actions: h.driveFitted ? A("drive-out", "Take the drive out") : A("drive-in", "Fit the drive in the drive cage") });
    list.push({ key: "sata-data", label: "SATA data cable", state: h.sataData ? "ok" : "idle",
      stateWords: h.sataData ? "Connected, motherboard to drive" : "Not connected — coiled on the desk",
      actions: h.sataData ? A("data-out", "Disconnect the SATA data cable") : A("data-in", "Connect the SATA data cable, motherboard to drive") });
    list.push({ key: "sata-power", label: "SATA power lead", state: h.sataPower ? "ok" : "idle",
      stateWords: h.sataPower ? "Connected, power supply to drive" : "Not connected — hanging from the power supply",
      actions: h.sataPower ? A("power-out", "Disconnect the SATA power lead") : A("power-in", "Connect the SATA power lead to the drive") });
  }
  return list;
}

/* Carry out a hardware action. Returns { say, refused, harm }. A refusal
   is something the world will not let you do; harm is something it lets
   you do that you should not have. */
export function deskAction(m, id) {
  const h = m.hw;
  const on = m.power === "on";
  function no(say) { M.note(m, "hw-refused", { id: id }); return { say: say, refused: true }; }
  switch (id) {
    case "power-on": {
      if (h.mains === false) return no("Nothing happens. The mains lead is unplugged.");
      const r = M.boot(m);
      return { say: "The fans spin up and Windows starts. " + (m.hw.spare && m.disks.some(function (d) { return d.spare; }) ? "" : ""), boot: r };
    }
    case "force-off":
      M.shutdown(m); M.note(m, "hard-off", {});
      return { say: "Held for ten seconds, the PC cuts out. Windows did not shut down — anything unsaved is lost, and it may check the disk next time.", harm: true };
    case "mains-out":
      if (on) { M.shutdown(m); h.mains = false; M.note(m, "hard-off", { via: "mains" });
        return { say: "The PC dies instantly. That was a power cut: Windows did not shut down.", harm: true }; }
      h.mains = false; return { say: "Unplugged. No standby power reaches the board now." };
    case "mains-in": h.mains = true; return { say: "Plugged back in. The board has standby power again." };
    case "net-unplug":
      if (m.net) m.net.cable = false;
      M.note(m, "net-unplug", {});
      return { say: "Unplugged. This PC can no longer reach anything else on the network, and nothing can reach it." };
    case "net-plug": if (m.net) m.net.cable = true; return { say: "The network cable is plugged back in." };
    case "panel-off":
      if (on) return no("Not with it running. Shut Windows down first.");
      if (h.mains !== false) return no("The mains lead is still in. An ATX supply keeps standby power on the motherboard even with the PC off — unplug it before you open the case.");
      h.panelOff = true; return { say: "Two thumbscrews at the back, and the panel slides off. The drive cage is at the front, bottom." };
    case "panel-on":
      if (h.driveFitted && (!h.sataData || !h.sataPower)) { h.panelOff = false; return { say: "The panel is back on. (The drive does not have both leads connected yet.)" }; }
      h.panelOff = false; return { say: "The panel is back on and the thumbscrews are done up." };
    case "drive-in":
      if (!h.panelOff) return no("The drive cage is inside the case, and the side panel is still on.");
      h.driveFitted = true; return { say: "The drive slides into the cage, connectors facing you, and the screws go in." };
    case "drive-out":
      if (!h.panelOff) return no("The side panel is on.");
      h.driveFitted = false; h.sataData = false; h.sataPower = false; M.detectSpare(m);
      return { say: "The drive is out, and both leads are off it." };
    case "data-in":
      if (!h.panelOff) return no("The SATA ports are inside the case.");
      if (!h.driveFitted) return no("Fit the drive first, then run the cable to where it sits.");
      h.sataData = true; return { say: "The L-shaped connector clicks in at both ends: a SATA port on the motherboard, and the data socket on the drive." };
    case "data-out": if (!h.panelOff) return no("The side panel is on."); h.sataData = false; M.detectSpare(m); return { say: "The data cable is off." };
    case "power-in":
      if (!h.panelOff) return no("The power supply's leads are inside the case.");
      if (!h.driveFitted) return no("Fit the drive first.");
      h.sataPower = true; return { say: "The wider L-shaped SATA power connector, from the power supply, goes into the drive beside the data cable." };
    case "power-out": if (!h.panelOff) return no("The side panel is on."); h.sataPower = false; M.detectSpare(m); return { say: "The power lead is off." };
  }
  return { say: "" };
}
