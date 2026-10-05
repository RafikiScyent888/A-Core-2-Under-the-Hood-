/* =====================================================================
   The customer's phone in 3D, in a window: the model the owner approved
   (phone3d.js), lit by a neutral room, turnable with the mouse. Its screen
   is a picture drawn by the caller (draw(ctx, w, h)) and redrawn whenever
   the phone changes. The canvas is scenery (aria-hidden): every word on
   that screen is also beside it as real text.
   ===================================================================== */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildPhone } from "./phone3d.js";

export function webglOK() { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }

export function mountPhone(host, opts) {
  const H = opts.height || 360, Wd = function () { return host.clientWidth || 300; };
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); r.setSize(Wd(), H);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
  const cv = r.domElement; cv.setAttribute("aria-hidden", "true"); cv.tabIndex = -1; cv.style.width = "100%"; cv.style.height = H + "px"; cv.style.display = "block"; host.appendChild(cv);
  const scene = new THREE.Scene(); const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(new RoomEnvironment(r), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(-80, 160, 220); scene.add(key);
  const screen = document.createElement("canvas"); screen.width = 540; screen.height = 1110;
  opts.draw(screen.getContext("2d"), screen.width, screen.height);
  const phone = buildPhone(THREE, { RoundedBoxGeometry: RoundedBoxGeometry, screen: screen }); phone.rotation.y = -0.18; scene.add(phone);
  const cam = new THREE.PerspectiveCamera(30, Wd() / H, 1, 2000); cam.position.set(14, 8, opts.dist || 270);
  const ctl = new OrbitControls(cam, cv); ctl.target.set(0, 0, 0); ctl.enablePan = false; ctl.minDistance = 160; ctl.maxDistance = 520; ctl.update();
  let pending = false; function render() { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; r.render(scene, cam); }); }
  ctl.addEventListener("change", render);
  function resize() { r.setSize(Wd(), H); cv.style.width = "100%"; cam.aspect = Wd() / H; cam.updateProjectionMatrix(); render(); }
  window.addEventListener("resize", resize); render();
  return {
    redraw: function () { opts.draw(screen.getContext("2d"), screen.width, screen.height); phone.userData.screen.needsUpdate = true; render(); },
    /* turn it round: "back" shows the camera side, "front" the screen,
       "bottom" tips it to show the bottom edge (USB-C, speaker, microphone) */
    show: function (side) { phone.rotation.set(side === "bottom" ? -1.25 : 0, side === "back" ? Math.PI + 0.25 : side === "bottom" ? 0 : -0.18, 0); render(); },
    dispose: function () { window.removeEventListener("resize", resize); ctl.dispose(); r.dispose(); }
  };
}
