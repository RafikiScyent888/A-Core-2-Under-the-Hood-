/* =====================================================================
   The Mac in 3D, on the bench: the model the owner approved (mac3d.js),
   lit by a neutral room, turnable with the mouse. Its screen is a picture
   drawn by the caller (draw(ctx, w, h)) and redrawn whenever the Mac
   changes. The canvas is scenery (aria-hidden): every word on that screen
   is also beside it as real text.
   ===================================================================== */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildMac } from "./mac3d.js";

export function webglOK() { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }

export function mountMac(host, opts) {
  const H = opts.height || 320, Wd = function () { return host.clientWidth || 360; };
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); r.setSize(Wd(), H);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
  const cv = r.domElement; cv.setAttribute("aria-hidden", "true"); cv.tabIndex = -1; cv.style.width = "100%"; cv.style.height = H + "px"; cv.style.display = "block"; host.appendChild(cv);
  const scene = new THREE.Scene(); const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(new RoomEnvironment(r), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.3); key.position.set(-200, 400, 300); scene.add(key);
  const screen = document.createElement("canvas"); screen.width = 1560; screen.height = 1012;
  opts.draw(screen.getContext("2d"), screen.width, screen.height);
  const mac = buildMac(THREE, { RoundedBoxGeometry: RoundedBoxGeometry, screen: screen }); scene.add(mac);
  const cam = new THREE.PerspectiveCamera(32, Wd() / H, 1, 5000); cam.position.set(40, 300, 560);
  const ctl = new OrbitControls(cam, cv); ctl.target.set(0, 90, 0); ctl.enablePan = false; ctl.minDistance = 300; ctl.maxDistance = 1000; ctl.update();
  let pending = false; function render() { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; r.render(scene, cam); }); }
  ctl.addEventListener("change", render);
  function resize() { r.setSize(Wd(), H); cv.style.width = "100%"; cam.aspect = Wd() / H; cam.updateProjectionMatrix(); render(); }
  window.addEventListener("resize", resize); render();
  return {
    redraw: function () { opts.draw(screen.getContext("2d"), screen.width, screen.height); mac.userData.screen.needsUpdate = true; render(); },
    /* turn it to show a side: "left" the charging and USB-C ports, "right" the headphone jack */
    show: function (side) { const p = { front: [40, 300, 560], left: [-560, 160, 260], right: [560, 160, 260] }[side] || [40, 300, 560]; cam.position.set(p[0], p[1], p[2]); ctl.update(); render(); },
    dispose: function () { window.removeEventListener("resize", resize); ctl.dispose(); r.dispose(); }
  };
}
