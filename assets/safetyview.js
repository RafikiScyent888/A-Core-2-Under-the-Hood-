/* =====================================================================
   The safety kit in 3D, in the On the spot window: the models the owner
   approved from their preview renders (safety3d.js), lit by a neutral
   room, turnable with the mouse. Each ticket names a scene; the scene is
   rebuilt from the job's state whenever it changes (the strap clipped,
   the spill cleaned up, the UPS's display, a chained strip removed).
   The canvas is scenery (aria-hidden): every word on the models is also
   beside them as real text.
   ===================================================================== */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { makeKit } from "./safety3d.js";

export function webglOK() { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }

/* each scene: what's in it (from the job's state), what it stands on, and
   its views as [camera position, the point looked at] */
export const SCENES = {
  ext2: { floor: true, views: { all: [[0, 470, 1450], [0, 320, 0]], co2: [[-150, 470, 760], [-130, 330, 0]], water: [[160, 470, 760], [140, 330, 0]] },
    build: function (K) { const g = new THREE.Group(); const a = K.buildExtinguisher("co2"); a.position.x = -130; const b = K.buildExtinguisher("water"); b.position.x = 140; b.rotation.y = -0.3; g.add(a); g.add(b); return g; } },
  laptop: { floor: false, views: { front: [[260, 330, 520], [0, 60, 0]], side: [[520, 45, 120], [0, 22, 0]] },
    build: function (K) { return K.buildSwollenLaptop(); } },
  toner: { floor: true, views: { all: [[120, 700, 900], [80, 40, 40]], label: [[-40, 260, 420], [-40, 50, 20]], vacuum: [[520, 360, 420], [330, 120, -120]] },
    build: function (K, s) { return K.buildToner({ spill: s.spill !== false }); } },
  ups: { floor: true, views: { all: [[280, 420, 900], [0, 140, 40]], display: [[-110, 270, 560], [-120, 225, 200]], strip: [[330, 330, 560], [140, 30, 130]] },
    build: function (K, s) { return K.buildUPS({ lcd: s.lcd }); } },
  strap: { floor: false, views: { all: [[-60, 640, 760], [10, 0, -50]], earth: [[470, 170, -60], [350, 10, -250]], strap: [[-200, 230, 330], [-60, 20, 60]] },
    build: function (K, s) { return K.buildStrapMat({ grounded: !!s.grounded, clipped: !!s.clipped }); } },
  closet: { floor: true, views: { all: [[-160, 760, 1700], [-120, 200, 120]], strips: [[360, 430, 760], [170, 30, 230]], ext: [[-440, 470, 760], [-450, 330, 0]] },
    build: function (K, s) { const g = new THREE.Group(); g.add(K.buildUPS({ lcd: s.lcd, chained: !!s.chained })); const e = K.buildExtinguisher(s.ext === "co2" ? "co2" : "water"); e.position.set(-450, 0, 40); e.rotation.y = 0.25; g.add(e); return g; } }
};

export function mountSafety(host, opts) {
  const H = opts.height || 320, Wd = function () { return host.clientWidth || 380; }, S = SCENES[opts.scene];
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); r.setSize(Wd(), H);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  const cv = r.domElement; cv.setAttribute("aria-hidden", "true"); cv.tabIndex = -1; cv.style.width = "100%"; cv.style.height = H + "px"; cv.style.display = "block"; host.appendChild(cv);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x2a3142);
  const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(new RoomEnvironment(r), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(-300, 700, 450); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -800, right: 800, top: 800, bottom: -800, near: 10, far: 3000 }); key.shadow.bias = -0.0005; scene.add(key);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ color: S.floor ? 0xbfc3c4 : 0x5b4a3a, roughness: 0.85 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const K = makeKit(THREE, RoundedBoxGeometry);
  let cur = null;
  function free(o) { o.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) [].concat(x.material).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); }); }
  function build(state) { if (cur) { scene.remove(cur); free(cur); } cur = S.build(K, state || {}); scene.add(cur); }
  build(opts.state);
  const cam = new THREE.PerspectiveCamera(32, Wd() / H, 1, 8000);
  const ctl = new OrbitControls(cam, cv); ctl.enablePan = false; ctl.minDistance = 200; ctl.maxDistance = 2600; ctl.maxPolarAngle = Math.PI * 0.49;
  function view(name) { const v = S.views[name] || S.views[Object.keys(S.views)[0]]; cam.position.set(v[0][0], v[0][1], v[0][2]); ctl.target.set(v[1][0], v[1][1], v[1][2]); ctl.update(); render(); }
  let pending = false; function render() { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; r.render(scene, cam); }); }
  ctl.addEventListener("change", render);
  function resize() { r.setSize(Wd(), H); cv.style.width = "100%"; cam.aspect = Wd() / H; cam.updateProjectionMatrix(); render(); }
  window.addEventListener("resize", resize);
  view(opts.view);
  return {
    show: view,
    update: function (state) { build(state); render(); },
    dispose: function () { window.removeEventListener("resize", resize); ctl.dispose(); if (cur) free(cur); pm.dispose(); r.dispose(); }
  };
}
