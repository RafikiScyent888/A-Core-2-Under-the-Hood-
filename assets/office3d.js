/* =====================================================================
   The 3D office — Rafiki's IT Services, from the WiFi Access Point
   Configuration sim's office_map.PNG (Core-2-Sims), and the three-house
   street from the Neighboring Routers sim's Router_houses.png.

   Written for Core 2; it uses the three.js library and nothing from the
   Core 1 build. One unit is one foot. Rooms are sized to standard office
   dimensions: private offices of 100-150 sq ft, a 5 ft corridor (44 in
   minimum), a conference room of 20-25 sq ft a person, 9 ft ceilings.

   THE CANVAS IS SCENERY. Every machine in it is also a real button in
   the machine list beside it (the owner: students must have "no problem
   switching computers"), so nothing here is the only way to do anything,
   and the page works with WebGL switched off.
   ===================================================================== */
import * as PLAN from "./officeplan.js";
import * as THREE from "three";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function webglOK() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
}

export async function mountOffice(host, opts) {
  opts = opts || {};
  const WIDTH = function () { return host.clientWidth || 640; };
  const HEIGHT = opts.height || 380;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(WIDTH(), HEIGHT);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true"); canvas.tabIndex = -1;
  canvas.style.width = "100%"; canvas.style.height = HEIGHT + "px"; canvas.style.display = "block";
  host.appendChild(canvas);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  /* Daylight: a CC0 HDRI photograph (Poly Haven "park", via the
     @pmndrs/assets package), kept in the repo so nothing is fetched from
     another site. */
  try {
    const hdrURL = await (await fetch(opts.hdri || "assets/daylight-hdri.txt")).text();
    const hdr = await new EXRLoader().loadAsync(hdrURL);
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = pmrem.fromEquirectangular(hdr).texture; scene.environmentIntensity = 0.9;
    scene.background = hdr; scene.backgroundBlurriness = 0.15;
  } catch (e) { scene.background = new THREE.Color(0xa9c8e6); }
  scene.fog = new THREE.Fog(0xcdd6d8, 380, 1300);
  scene.add(new THREE.HemisphereLight(0xdfeaf5, 0x6d6a5c, 0.55));
  const sun = new THREE.DirectionalLight(0xfff3e0, 2.4);
  sun.position.set(-120, 180, 90); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -140; sc.right = 140; sc.top = 140; sc.bottom = -140; sc.near = 10; sc.far = 500;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05; scene.add(sun);

  function rnd(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function canvasTex(w, h, draw, repeat) {
    const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (repeat) t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 8; return t;
  }
  function noise(g, w, h, base, amp, n, seed) {
    g.fillStyle = base; g.fillRect(0, 0, w, h); const r = rnd(seed || 7);
    for (let i = 0; i < n; i++) { const v = (r() - 0.5) * amp; g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  }
  function vnoise(w, h, cells, seed) {
    /* tileable value noise, so a repeated texture shows no seams */
    const r = rnd(seed), g = []; for (let i = 0; i < cells * cells; i++) g.push(r());
    const at = (x, y) => g[((y % cells + cells) % cells) * cells + ((x % cells + cells) % cells)];
    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const fx = x / w * cells, fy = y / h * cells, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx, b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
      out[y * w + x] = a + (b - a) * sy;
    }
    return out;
  }
  function noiseTex(size, base, octaves, amp, seed, extra) {
    return canvasTex(size, size, (g, w, h) => {
      const img = g.createImageData(w, h); const layers = octaves.map((c, i) => vnoise(w, h, c, seed + i));
      for (let i = 0; i < w * h; i++) {
        let v = 0; layers.forEach((L, k) => v += (L[i] - 0.5) * amp[k]);
        img.data[i * 4] = base[0] * (1 + v) + (extra ? extra(i, v)[0] : 0); img.data[i * 4 + 1] = base[1] * (1 + v) + (extra ? extra(i, v)[1] : 0); img.data[i * 4 + 2] = base[2] * (1 + v * 0.8); img.data[i * 4 + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    });
  }
  const TEX = {
    grass: () => noiseTex(512, [104, 128, 72], [4, 16, 64, 256], [0.35, 0.22, 0.18, 0.3], 3),
    grassOld: () => canvasTex(256, 256, (g, w, h) => { noise(g, w, h, "#5d8a3c", 0.22, 9000, 3); const r = rnd(5); for (let i = 0; i < 1600; i++) { g.strokeStyle = r() > 0.5 ? "rgba(40,70,20,0.35)" : "rgba(150,190,90,0.3)"; const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 2, y - 3 - r() * 3); g.stroke(); } }),
    asphalt: () => noiseTex(512, [70, 72, 74], [6, 32, 256], [0.25, 0.15, 0.45], 11),
    concrete: () => canvasTex(256, 256, (g, w, h) => { noise(g, w, h, "#c9c6bd", 0.12, 6000, 13); g.strokeStyle = "rgba(90,90,85,0.55)"; g.lineWidth = 2; g.strokeRect(0, 0, w, h); }),
    carpet: () => canvasTex(128, 128, (g, w, h) => noise(g, w, h, "#6f7d8c", 0.18, 7000, 17)),
    tile: () => canvasTex(128, 128, (g, w, h) => { noise(g, w, h, "#d9d4c7", 0.08, 1500, 19); g.strokeStyle = "rgba(120,110,95,0.6)"; g.lineWidth = 2; g.strokeRect(0, 0, w, h); }),
    wood: () => canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#9a6b43"; g.fillRect(0, 0, w, h); const r = rnd(23); for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(${r() > 0.5 ? "60,35,15" : "190,140,90"},${r() * 0.25})`; g.fillRect(0, y, w, 2); } for (let y = 0; y < h; y += 32) { g.fillStyle = "rgba(50,30,15,0.5)"; g.fillRect(0, y, w, 1); } }),
    gravel: () => noiseTex(512, [196, 196, 190], [5, 40, 256], [0.12, 0.08, 0.25], 29),
    brick: () => canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#b9b3a8"; g.fillRect(0, 0, w, h); const r = rnd(31); for (let row = 0; row < 16; row++) for (let col = -1; col < 8; col++) { const x = col * 32 + (row % 2 ? 16 : 0), y = row * 16; const t = 0.85 + r() * 0.25; g.fillStyle = `rgb(${Math.round(150 * t)},${Math.round(84 * t)},${Math.round(62 * t)})`; g.fillRect(x + 1, y + 1, 30, 14); } }),
    drywall: () => canvasTex(64, 64, (g, w, h) => noise(g, w, h, "#e9e6df", 0.05, 600, 37)),
    shingle: (col) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); const r = rnd(41); for (let row = 0; row < 16; row++) for (let c = -1; c < 9; c++) { const x = c * 32 + (row % 2 ? 16 : 0), y = row * 16; g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.2})`; g.fillRect(x, y, 31, 15); g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(x, y + 14, 32, 2); } }),
    siding: (col) => canvasTex(128, 128, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) { g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(0, y + 6, w, 2); g.fillStyle = "rgba(255,255,255,0.10)"; g.fillRect(0, y, w, 1); } })
  };
  const mats = {};
  function M(key, opts) {
    if (mats[key]) return mats[key];
    return (mats[key] = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0 }, opts)));
  }
  function texMat(key, texFn, rep, extra) {
    if (mats[key]) return mats[key];
    const t = texFn(); t.repeat.set(rep[0], rep[1]);
    return (mats[key] = new THREE.MeshStandardMaterial(Object.assign({ map: t, roughness: 0.9 }, extra || {})));
  }
  
  /* ---------------- geometry helpers ---------------- */
  function box(x0, z0, x1, z1, y0, y1, mat, cast = true) {
    const g = new THREE.BoxGeometry(Math.abs(x1 - x0), y1 - y0, Math.abs(z1 - z0));
    const m = new THREE.Mesh(g, mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    m.castShadow = cast; m.receiveShadow = true; scene.add(m); return m;
  }
  function uvBox(x0, z0, x1, z1, y0, y1, mat, ft) {
    /* scale UVs to world feet so textures stay the same size */
    const m = box(x0, z0, x1, z1, y0, y1, mat);
    const uv = m.geometry.attributes.uv, pos = m.geometry.attributes.position, nrm = m.geometry.attributes.normal;
    for (let i = 0; i < uv.count; i++) {
      const nx = Math.abs(nrm.getX(i)), ny = Math.abs(nrm.getY(i));
      const px = pos.getX(i) + m.position.x, py = pos.getY(i) + m.position.y, pz = pos.getZ(i) + m.position.z;
      if (ny > 0.5) uv.setXY(i, px / ft, pz / ft); else if (nx > 0.5) uv.setXY(i, pz / ft, py / ft); else uv.setXY(i, px / ft, py / ft);
    }
    uv.needsUpdate = true; return m;
  }
  function cyl(x, z, r, y0, y1, mat, seg = 20) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, y1 - y0, seg), mat); m.position.set(x, (y0 + y1) / 2, z); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m; }
  function tree(x, z, h, seed) {
    const r = rnd(seed);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.7, h * 0.55, 10), M("bark", { color: 0x4f3f2f, roughness: 1 }));
    trunk.position.set(x, h * 0.275, z); trunk.castShadow = true; scene.add(trunk);
    if (seed % 4 === 0) {                                   /* a conifer */
      for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(h * (0.3 - i * 0.05), h * 0.32, 14), M("conif", { color: 0x2f4a2a, roughness: 1 })); c.position.set(x, h * (0.35 + i * 0.17), z); c.castShadow = true; scene.add(c); }
      return;
    }
    const cols = [0x3e5a2c, 0x4a6834, 0x55733b, 0x344f27];
    for (let i = 0; i < 16; i++) {
      const rr = h * (0.1 + r() * 0.08); const s = new THREE.Mesh(new THREE.IcosahedronGeometry(rr, 2), M("leaf" + (i % 4), { color: cols[i % 4], roughness: 1 }));
      const a = r() * Math.PI * 2, d = r() * h * 0.26;
      s.position.set(x + Math.cos(a) * d, h * (0.55 + r() * 0.35), z + Math.sin(a) * d); s.scale.y = 0.8; s.castShadow = true; s.receiveShadow = true; scene.add(s);
    }
  }
  function shrub(x, z, s) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), M("shrub", { color: 0x44722f, roughness: 1 })); m.position.set(x, s * 0.7, z); m.scale.y = 0.75; m.castShadow = true; scene.add(m); return m; }
  const LABELS = [];
  function label(text, x, y, z, opts) { LABELS.push({ text, p: new THREE.Vector3(x, y, z), opts: opts || {} }); }
  function placeLabelsUnused() {
    LABELS.forEach((L) => {
      const v = L.p.clone().project(cam); const d = document.createElement("div");
      d.className = "lbl"; d.textContent = L.text;
      d.style.left = ((v.x + 1) / 2 * innerWidth) + "px"; d.style.top = ((1 - v.y) / 2 * innerHeight) + "px";
      if (L.opts.edge) d.style.borderColor = L.opts.edge;
      document.body.appendChild(d);
    });
  }
  function signTex(text) {
    return canvasTex(1024, 256, (g, w, h) => { g.fillStyle = "#0b3a82"; g.fillRect(0, 0, w, h); g.fillStyle = "#ffffff"; g.font = "700 120px Segoe UI, Arial"; g.textAlign = "center"; g.fillText(text, w / 2, 170); });
  }
  
  function car(cx, cz, col) {
    const paint = new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.3, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.08 });
    const body = new THREE.Mesh(new RoundedBoxGeometry(6.0, 2.2, 15, 4, 0.7), paint); body.position.set(cx, 2.1, cz); body.castShadow = true; scene.add(body);
    const cab = new THREE.Mesh(new RoundedBoxGeometry(5.2, 1.9, 7.2, 4, 0.8), new THREE.MeshPhysicalMaterial({ color: 0x1a2530, roughness: 0.05, metalness: 0.3, clearcoat: 1 })); cab.position.set(cx, 3.9, cz + 0.5); cab.castShadow = true; scene.add(cab);
    const roofm = new THREE.Mesh(new RoundedBoxGeometry(4.9, 0.3, 5.2, 3, 0.15), paint); roofm.position.set(cx, 4.85, cz + 0.6); scene.add(roofm);
    [[-3.0, -4.6], [3.0, -4.6], [-3.0, 4.6], [3.0, 4.6]].forEach(([dx, dz]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.8, 18), M("tyre", { color: 0x131313, roughness: 0.9 })); w.rotation.z = Math.PI / 2; w.position.set(cx + dx, 1.15, cz + dz); w.castShadow = true; scene.add(w); });
  }
  
  /* =====================================================================
     THE OFFICE — Rafiki's IT Services
     Plan from Core-2-Sims/Wifi Configuration/office_map.PNG, sized to
     standard office dimensions: private offices ~12x12-13x12 ft (100-150
     sq ft), a 5 ft corridor (44 in minimum), a 22x15 ft conference room
     for ten (20-25 sq ft a person), 9 ft ceilings.
     ===================================================================== */
  /* the plan itself is shared with the 2D floor plan (officeplan.js) */
  const W = PLAN.W, D = PLAN.D, H = 9, EXT = 0.8, INT = 0.5;
  const WALLS = PLAN.WALLS, AP = PLAN.AP, segs = PLAN.segs;
  const TABLET = { x: 30.2, z: 5.2 };
  
  /* The microwave, from the owner's photograph of their own: brushed
     stainless case with rounded edges and a black back, a smoked black
     glass door with the perforated window screen, the lit inside with a
     glass turntable on its roller ring and a glass bowl, a chrome bar
     handle on standoffs, and a black glass control panel: a red 2:30, the
     keypad, Start and Stop, and a knurled dial. About 20 x 12 x 15 in.
     Built in its own frame (x across its front, y up, z out of the door),
     then turned to face into the room (+x), the panel on the right. */
  function microwaveAt(mx, mz) {
    /* on the counter, or (once moved) on a small trolley at desk height */
    const onCounter = mx < 20.3 && mz > 19.5 && mz < 24.5;
    if (!onCounter) { box(mx - 0.75, mz - 1.0, mx + 0.75, mz + 1.0, 2.5, 2.6, M("cart", { color: 0x3a3f46, metalness: 0.5, roughness: 0.4 })); box(mx - 0.75, mz - 1.0, mx + 0.75, mz + 1.0, 1.0, 1.08, M("cart")); [[-0.7, -0.95], [-0.7, 0.95], [0.7, -0.95], [0.7, 0.95]].forEach(([dx, dz]) => { cyl(mx + dx, mz + dz, 0.04, 0.55, 2.5, M("leg"), 8); cyl(mx + dx, mz + dz, 0.12, 0.4, 0.55, M("tyre", { color: 0x131313 }), 10); }); }
    const Y = onCounter ? 3.25 : 2.6;
    const W = 1.7, H = 1.0, D = 1.3, F = 0.05;                      /* F: the feet */
    const g = new THREE.Group(); g.position.set(mx, Y, mz); g.rotation.y = Math.PI / 2; scene.add(g);
    const add = (geo, mat, x, y, z, cast) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast !== false; m.receiveShadow = true; g.add(m); return m; };
    const tex = (w, h, draw) => { const t = canvasTex(w, h, draw); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; };
    /* brushed stainless: fine streaks along the case */
    const brushed = tex(512, 512, (c, w, h) => { c.fillStyle = "#c9cdd1"; c.fillRect(0, 0, w, h); const r = rnd(61); for (let i = 0; i < 5200; i++) { const y = r() * h, l = 30 + r() * 200; c.fillStyle = r() > 0.5 ? `rgba(255,255,255,${0.02 + r() * 0.05})` : `rgba(70,74,80,${0.02 + r() * 0.05})`; c.fillRect(r() * w - 40, y, l, 0.6); } });
    const steel = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: brushed, metalness: 0.9, roughness: 0.34, clearcoat: 0.25, clearcoatRoughness: 0.4 });
    const black = new THREE.MeshPhysicalMaterial({ color: 0x141518, roughness: 0.55, metalness: 0.2 });
    const chrome = new THREE.MeshPhysicalMaterial({ color: 0xe6e8ea, metalness: 1, roughness: 0.12 });
    const glossBlack = new THREE.MeshPhysicalMaterial({ color: 0x0b0c0e, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03 });
    /* the case: a rounded profile with the oven's opening cut through it,
       run front to back, so the inside really is open behind the door */
    const x0 = -W / 2, oL = -W / 2 + 0.1, oR = W / 2 - 0.56, oB = 0.1, oT = H - 0.1, rr = 0.07;
    const prof = new THREE.Shape(); prof.moveTo(x0 + rr, 0); prof.lineTo(W / 2 - rr, 0); prof.quadraticCurveTo(W / 2, 0, W / 2, rr); prof.lineTo(W / 2, H - rr); prof.quadraticCurveTo(W / 2, H, W / 2 - rr, H); prof.lineTo(x0 + rr, H); prof.quadraticCurveTo(x0, H, x0, H - rr); prof.lineTo(x0, rr); prof.quadraticCurveTo(x0, 0, x0 + rr, 0);
    const hole = new THREE.Path(); hole.moveTo(oL, oB); hole.lineTo(oL, oT); hole.lineTo(oR, oT); hole.lineTo(oR, oB); hole.lineTo(oL, oB); prof.holes.push(hole);
    const shellGeo = new THREE.ExtrudeGeometry(prof, { depth: D - 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 3, curveSegments: 8 });
    add(shellGeo, steel, 0, F, -D / 2 + 0.02);
    add(new RoundedBoxGeometry(W - 0.02, H - 0.02, 0.05, 2, 0.02), black, 0, F + H / 2, -D / 2 - 0.005);   /* the black back */
    /* vent slots on the right side */
    const vents = tex(256, 128, (c, w, h) => { c.fillStyle = "#c9cdd1"; c.fillRect(0, 0, w, h); c.fillStyle = "#1a1b1e"; for (let i = 0; i < 14; i++) c.fillRect(10 + i * 17, 18, 8, h - 36); });
    const vp = add(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshStandardMaterial({ map: vents, metalness: 0.7, roughness: 0.4 }), W / 2 + 0.018, F + H * 0.62, -0.1, false); vp.rotation.y = Math.PI / 2;
    /* feet, and a soft shadow on the worktop */
    [[-0.7, -0.5], [0.7, -0.5], [-0.7, 0.5], [0.7, 0.5]].forEach(([x, z]) => add(new THREE.CylinderGeometry(0.05, 0.055, F, 14), black, x, F / 2, z));
    const blob = tex(128, 128, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 6, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(0,0,0,0.55)"); gr.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    const sh = add(new THREE.PlaneGeometry(W + 0.5, D + 0.45), new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false }), 0, 0.004, 0, false); sh.rotation.x = -Math.PI / 2; sh.castShadow = false;
    /* inside: warm enamel, lit by its own small lamp */
    const enamel = new THREE.MeshStandardMaterial({ color: 0xc9a86e, emissive: 0xffb23f, emissiveIntensity: 0.45, roughness: 0.6, envMapIntensity: 0.3, side: THREE.BackSide });
    add(new THREE.BoxGeometry(oR - oL - 0.05, oT - oB - 0.05, D - 0.2), enamel, (oL + oR) / 2, F + (oB + oT) / 2, 0.0, false);   /* well inside the case's own walls, so the enamel, not the steel, is what shows */
    const lamp = new THREE.PointLight(0xffb23f, 2.4, 1.6, 2); lamp.position.set((oL + oR) / 2 + 0.25, F + oT - 0.06, 0.1); g.add(lamp);
    const tc = (oL + oR) / 2, ty = F + oB + 0.055;
    add(new THREE.TorusGeometry(0.2, 0.012, 8, 40), black, tc, ty - 0.012, 0.02).rotation.x = Math.PI / 2;          /* the roller ring */
    const plateGlass = new THREE.MeshPhysicalMaterial({ color: 0xe9e2cf, roughness: 0.03, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.4 });
    add(new THREE.CylinderGeometry(0.4, 0.38, 0.018, 48), plateGlass, tc, ty, 0.02, false);
    add(new THREE.TorusGeometry(0.39, 0.012, 8, 48), plateGlass, tc, ty + 0.012, 0.02, false).rotation.x = Math.PI / 2;
    const bowlPts = [[0, 0], [0.11, 0], [0.13, 0.008], [0.16, 0.06], [0.18, 0.13], [0.182, 0.15], [0.172, 0.15], [0.17, 0.13], [0.15, 0.065], [0.122, 0.014], [0, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
    add(new THREE.LatheGeometry(bowlPts, 40), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.03, clearcoat: 1, transparent: true, opacity: 0.42, side: THREE.DoubleSide }), tc, ty + 0.012, 0.0, false);
    /* the door: smoked glass, opaque round the edge, with the window's perforated screen */
    const dW = oR - x0 + 0.02 - 0.06, dH = H - 0.06, dx = (x0 + 0.03 + oR + 0.02) / 2;
    const doorA = tex(512, 320, (c, w, h) => { c.fillStyle = "#ffffff"; c.fillRect(0, 0, w, h); const ix = 0.11 * w, iy = 0.13 * h; c.fillStyle = "#a0a0a0"; c.fillRect(ix, iy, w - 2 * ix, h - 2 * iy); c.fillStyle = "#6a6a6a"; for (let y = iy + 3; y < h - iy; y += 6) for (let x = ix + 3 + ((y / 6) % 2 ? 3 : 0); x < w - ix; x += 6) { c.beginPath(); c.arc(x, y, 1.6, 0, Math.PI * 2); c.fill(); } });
    const doorMat = new THREE.MeshPhysicalMaterial({ color: 0x050506, roughness: 0.06, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.05, envMapIntensity: 0.18, transparent: true, alphaMap: doorA, depthWrite: false });
    add(new RoundedBoxGeometry(dW, dH, 0.03, 2, 0.012), doorMat, dx, F + H / 2, D / 2 + 0.03, false);
    /* the handle: a chrome bar on two standoffs, beside the panel */
    const hx = oR - 0.035;
    add(new THREE.CapsuleGeometry(0.028, 0.6, 6, 16), chrome, hx, F + H / 2, D / 2 + 0.13);
    [F + 0.22, F + H - 0.22].forEach((y) => add(new THREE.CylinderGeometry(0.018, 0.018, 0.11, 12), chrome, hx, y, D / 2 + 0.08).rotation.x = Math.PI / 2);
    /* the control panel: black glass, a red clock, the keypad, Start and Stop */
    const pW = W / 2 - 0.03 - (oR + 0.04), pH = H - 0.08, px = (oR + 0.04 + W / 2 - 0.03) / 2;
    const face = (glow) => tex(400, 980, (c, w, h) => {
      c.fillStyle = glow ? "#000000" : "#0c0d10"; c.fillRect(0, 0, w, h);
      if (!glow) { c.fillStyle = "#050506"; c.fillRect(34, 40, w - 68, 110); }
      c.font = "700 84px 'Courier New', monospace"; c.textAlign = "center"; c.fillStyle = "#ff2626"; if (glow) { c.shadowColor = "#ff3b3b"; c.shadowBlur = 18; } c.fillText("2:30", w / 2, 124); c.shadowBlur = 0;
      if (glow) return;
      const lab = (t, x, y) => { c.fillStyle = "#c8cbd0"; c.font = "600 19px Arial"; c.fillText(t, x, y); };
      const key = (x, y, bw, bh, t, col) => { const gr = c.createLinearGradient(0, y, 0, y + bh); gr.addColorStop(0, col || "#3a3d43"); gr.addColorStop(1, col ? "#7f1219" : "#24262b"); c.fillStyle = gr; c.beginPath(); c.roundRect(x, y, bw, bh, 7); c.fill(); c.strokeStyle = "rgba(255,255,255,0.18)"; c.lineWidth = 1.5; c.stroke(); c.fillStyle = "#eef0f2"; c.font = "700 " + (t.length > 2 ? 17 : 26) + "px Arial"; c.fillText(t, x + bw / 2, y + bh / 2 + (t.length > 2 ? 6 : 9)); };
      const quick = [["POPCORN", "POTATO"], ["PIZZA", "REHEAT"], ["DEFROST", "POWER"]];
      quick.forEach((row, i) => row.forEach((t, j) => key(40 + j * 165, 190 + i * 64, 150, 48, t)));
      lab("— COOK —", w / 2, 395);
      for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) { const t = r < 3 ? String(r * 3 + k + 1) : ["CLOCK", "0", "TIMER"][k]; key(40 + k * 110, 415 + r * 66, 98, 52, t); }
      key(40, 690, 150, 60, "STOP"); key(205, 690, 155, 60, "START", "#b8202a");
    });
    const pf = add(new THREE.PlaneGeometry(pW, pH), new THREE.MeshPhysicalMaterial({ map: face(false), emissive: 0xffffff, emissiveMap: face(true), emissiveIntensity: 1.6, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03 }), px, F + H / 2, D / 2 + 0.03, false);
    /* the dial: knurled, with a chrome ring */
    const knurl = tex(256, 32, (c, w, h) => { c.fillStyle = "#2a2c30"; c.fillRect(0, 0, w, h); c.fillStyle = "#0f1012"; for (let x = 0; x < w; x += 8) c.fillRect(x, 0, 3, h); });
    const knob = add(new THREE.CylinderGeometry(0.07, 0.072, 0.06, 40), [new THREE.MeshStandardMaterial({ map: knurl, roughness: 0.5 }), new THREE.MeshPhysicalMaterial({ color: 0x1c1d20, roughness: 0.25, clearcoat: 0.6 }), black], px, F + 0.16, D / 2 + 0.06);
    knob.rotation.x = Math.PI / 2;
    add(new THREE.TorusGeometry(0.078, 0.008, 8, 40), chrome, px, F + 0.16, D / 2 + 0.035, false);
    add(new THREE.BoxGeometry(0.008, 0.045, 0.004), new THREE.MeshBasicMaterial({ color: 0xe6e8ea }), px, F + 0.19, D / 2 + 0.092, false);
  }
  function buildOffice(roof, full) {
    /* site */
    const grass = texMat("grassM", TEX.grass, [1, 1]);
    uvBox(-1400, -1400, 1400, 1400, -0.2, 0, grass, 70);
    const asph = texMat("asphM", TEX.asphalt, [1, 1], { roughness: 0.95 });
    uvBox(-70, 92, 110, 116, -0.19, 0.02, asph, 20);                    /* the road */
    for (let x = -66; x < 110; x += 14) box(x, 103.7, x + 7, 104.3, 0.02, 0.05, M("lane", { color: 0xe8e2c8 }), false);
    const conc = texMat("concM", TEX.concrete, [1, 1]);
    uvBox(-70, 84, 110, 89, 0, 0.3, conc, 5);                            /* sidewalk */
    box(-70, 89, 110, 92, 0, 0.45, M("curb", { color: 0xb9b6ae }));
    uvBox(-6, 38, 50, 80, -0.19, 0.03, asph, 20);                        /* parking: 9 x 18 ft stalls, 24 ft aisle */
    uvBox(14, 80, 28, 92, -0.19, 0.03, asph, 20);                         /* drive */
    for (let i = 0; i <= 6; i++) { const x = -5 + i * 9; box(x, 38.5, x + 0.4, 56, 0.03, 0.06, M("stall", { color: 0xf2f0e6 }), false); }
    uvBox(-8, 13, 0, 16.5, 0, 0.3, conc, 5);                              /* front walk */
    uvBox(-8, 16.5, -5, 38, 0, 0.3, conc, 5);
    uvBox(27, 32, 31, 38, 0, 0.3, conc, 5);                               /* rear door walk */
    const carCols = [0x2c3e57, 0xb8bcc2, 0x7a1f1f, 0x2e2e30];
    [0, 1, 3, 5].forEach((k, i) => car(-0.5 + k * 9, 47.5, carCols[i]));
    /* two light poles */
    [[-4, 68], [48, 68]].forEach(([x, z]) => { cyl(x, z, 0.3, 0, 22, M("pole", { color: 0x5a6068, metalness: 0.6, roughness: 0.4 }), 10); box(x - 0.6, z - 1.6, x + 0.6, z + 1.6, 21.4, 22.2, M("pole")); });
    [[-20, -10, 24], [-24, 20, 20], [-20, 56, 26], [62, -8, 28], [64, 24, 22], [64, 60, 24], [20, -22, 26], [-2, -26, 20], [44, -24, 27], [80, 30, 24], [-40, 70, 22]].forEach(([x, z, h], i) => tree(x, z, h, i + 1));
    for (let i = 0; i < 8; i++) shrub(-2.5, 1 + i * 1.6, 1.1);
    /* the sign */
    M("post", { color: 0x5a6068, metalness: 0.6, roughness: 0.4 });
    const face = new THREE.MeshStandardMaterial({ map: signTex("Rafiki's IT Services"), roughness: 0.5 });
    const sg = new THREE.Mesh(new THREE.BoxGeometry(12.8, 3.2, 0.4), [M("signside", { color: 0x0b3a82 }), M("signside"), M("signside"), M("signside"), face, face]);
    sg.position.set(-15.7, 5.2, 34); sg.castShadow = true; scene.add(sg);
    box(-21.8, 33.8, -21.2, 34.2, 0, 4, M("post")); box(-10.2, 33.8, -9.6, 34.2, 0, 4, M("post"));
  
    /* slab and floors */
    uvBox(-0.4, -0.4, W + 0.4, D + 0.4, 0, 0.35, conc, 6);
    const carpet = texMat("carpetM", TEX.carpet, [1, 1]), tile = texMat("tileM", TEX.tile, [1, 1]), wood = texMat("woodM", TEX.wood, [1, 1], { roughness: 0.55 });
    uvBox(0, 0, W, 12, 0.35, 0.4, carpet, 4);
    uvBox(0, 12, W, 17, 0.35, 0.4, tile, 2);
    uvBox(0, 17, 11, D, 0.35, 0.4, tile, 2);
    uvBox(11, 17, 18, D, 0.35, 0.4, M("closetfloor", { color: 0x9a9d9f }), 4);
    uvBox(18, 17, W, D, 0.35, 0.4, wood, 6);
  
    /* walls */
    const brick = texMat("brickM", TEX.brick, [1, 1]), dry = texMat("dryM", TEX.drywall, [1, 1]);
    const cut = roof || full ? H : 4.2;                                     /* cutaway: every wall cut to 4 ft, dollhouse style */
    WALLS.forEach((w) => {
      const kind = w[4], t = kind === "ext" ? EXT : INT;
      segs(w).forEach(([x0, z0, x1, z1]) => {
        const horiz = z0 === z1;
        const near = !roof && !full;
        const hh = near ? cut : H;
        const bx0 = horiz ? x0 : x0 - t / 2, bx1 = horiz ? x1 : x0 + t / 2, bz0 = horiz ? z0 - t / 2 : z0, bz1 = horiz ? z0 + t / 2 : z1;
        uvBox(bx0, bz0, bx1, bz1, 0.35, 0.35 + hh, kind === "ext" ? brick : dry, kind === "ext" ? 8 : 4);
        if (kind === "ext" && !near) {                              /* windows on the far exterior walls */
          const len = horiz ? x1 - x0 : z1 - z0;
          for (let a = 3; a < len - 3; a += 7) {
            const g = M("win", { color: 0x2d4658, roughness: 0.08, metalness: 0.6 });
            if (horiz) box(x0 + a, z0 - t / 2 - 0.05, x0 + a + 4, z0 + t / 2 + 0.05, 3.2, 7.2, g, false);
            else box(x0 - t / 2 - 0.05, z0 + a, x0 + t / 2 + 0.05, z0 + a + 4, 3.2, 7.2, g, false);
          }
        }
      });
      /* doors in the gaps, standing open against the wall */
      w[5].forEach(([g0, g1]) => {
        const horiz = w[1] === w[3]; const dm = M("door", { color: 0x8a6a4a, roughness: 0.6 });
        if (kind === "ext") { if (horiz) box(g0, w[1] - 0.2, g1, w[1] + 0.2, 0.35, 7.3, M("glassdoor", { color: 0x3b5a70, roughness: 0.1, metalness: 0.5 }), false); else box(w[0] - 0.2, g0, w[0] + 0.2, g1, 0.35, 7.3, M("glassdoor"), false); return; }
        /* doors open into the room, never out into the corridor (z 12-17) */
        const into = horiz && w[1] === 12 ? -1 : 1;
        if (horiz) box(g0, into > 0 ? w[1] + 0.3 : w[1] - 0.3 - (g1 - g0), g0 + 0.15, into > 0 ? w[1] + 0.3 + (g1 - g0) : w[1] - 0.3, 0.35, 7.3, dm); else box(w[0] + 0.3, g0, w[0] + 0.3 + (g1 - g0), g0 + 0.15, 0.35, 7.3, dm);
      });
    });
    if (roof) {
      uvBox(-0.6, -0.6, W + 0.6, D + 0.6, H + 0.35, H + 1.0, texMat("gravelM", TEX.gravel, [1, 1]), 6);
      [[-0.6, -0.6, W + 0.6, 0.2], [-0.6, D - 0.2, W + 0.6, D + 0.6], [-0.6, -0.6, 0.2, D + 0.6], [W - 0.2, -0.6, W + 0.6, D + 0.6]].forEach(([a, b, c, d]) => uvBox(a, b, c, d, H + 1.0, H + 2.6, brick, 8));
      box(8, 6, 14, 11, H + 1, H + 4.2, M("hvac", { color: 0xb5b8ba, metalness: 0.5, roughness: 0.4 }));
      box(26, 20, 31, 24, H + 1, H + 3.6, M("hvac"));
      cyl(34, 8, 1.2, H + 1, H + 2.6, M("hvac"));
    }
  
    /* ------------- furniture ------------- */
    const deskM = M("desk", { color: 0x8a6440, roughness: 0.55 }), dark = M("plastic", { color: 0x222428, roughness: 0.4 }), chairM = M("chair", { color: 0x2b3440, roughness: 0.7 });
    function desk(x0, z0, x1, z1) { box(x0, z0, x1, z1, 2.35, 2.5, deskM); [[x0 + 0.2, z0 + 0.2], [x1 - 0.2, z0 + 0.2], [x0 + 0.2, z1 - 0.2], [x1 - 0.2, z1 - 0.2]].forEach(([x, z]) => cyl(x, z, 0.1, 0.4, 2.35, M("leg", { color: 0x55585c, metalness: 0.7, roughness: 0.3 }), 8)); }
    function pc(x, z, faceZ) {                                      /* monitor on the desk, tower on the floor */
      box(x - 1.1, z - 0.08, x + 1.1, z + 0.08, 3.0, 4.35, dark); box(x - 0.15, z - 0.2, x + 0.15, z + 0.2, 2.5, 3.0, dark);
      box(x - 1.0, z + 0.09 * faceZ - 0.01, x + 1.0, z + 0.09 * faceZ + 0.01, 3.08, 4.27, M("screenOn", { color: 0x1d4f9a, emissive: 0x1d4f9a, emissiveIntensity: 0.6, roughness: 0.2 }), false);
      box(x - 0.8, z + faceZ * 0.9 - 0.25, x + 0.8, z + faceZ * 0.9 + 0.25, 2.5, 2.58, dark);
      box(x + 1.6, z - 0.9, x + 2.2, z + 0.9, 0.4, 1.9, dark);
    }
    /* the same PC turned to face +x, for desks along the west wall */
    function pcX(x, z) {
      box(x - 0.08, z - 1.1, x + 0.08, z + 1.1, 3.0, 4.35, dark); box(x - 0.2, z - 0.15, x + 0.2, z + 0.15, 2.5, 3.0, dark);
      box(x + 0.08, z - 1.0, x + 0.1, z + 1.0, 3.08, 4.27, M("screenOn"), false);
      box(x + 0.65, z - 0.8, x + 1.15, z + 0.8, 2.5, 2.58, dark);
      box(x - 0.9, z + 1.6, x + 0.9, z + 2.2, 0.4, 1.9, dark);
    }
    function chair(x, z) { cyl(x, z, 0.9, 1.3, 1.6, chairM, 16); box(x - 0.9, z + 0.6, x + 0.9, z + 0.8, 1.6, 3.4, chairM); cyl(x, z, 0.12, 0.4, 1.3, M("leg"), 8); cyl(x, z, 0.9, 0.4, 0.5, M("leg"), 5); }
    /* Office 1 (HR, and Finance: the sim has seven machines and the plan has three offices) */
    desk(6.5, 0.9, 12, 3.4); pc(9, 1.6, 1); chair(9, 5);
    desk(0.9, 5.5, 3.4, 11); pcX(1.6, 8.2); chair(5, 8.2);
    /* Office 2 (Sales) */ desk(20.5, 0.9, 26, 3.4); pc(23, 1.6, 1); chair(23, 5);
    /* Office 3 (Dev) */ desk(33.5, 0.9, 39, 3.4); pc(36, 1.6, 1); chair(36, 5);
    box(28.8, 4.3, 31.6, 6.1, 2.2, 2.35, deskM); cyl(29.2, 5.2, 0.1, 0.4, 2.2, M("leg"), 8); cyl(31.2, 5.2, 0.1, 0.4, 2.2, M("leg"), 8);
    box(29.7, 4.9, 30.7, 5.6, 2.35, 2.42, dark);                    /* the tablet */
    box(29.78, 4.97, 30.62, 5.53, 2.42, 2.43, M("tabscreen", { color: 0x3a6fbf, emissive: 0x3a6fbf, emissiveIntensity: 0.5 }), false);
    /* reception: the L counter from the plan, the round table */
    box(0.8, 19, 3.3, 28.3, 0.35, 2.5, deskM); box(0.8, 28.3, 8.5, 30.8, 0.35, 3.8, deskM);   /* work surface at desk height; the tall transaction counter in front */
    pcX(2.0, 23.5); chair(4.8, 23.5);
    cyl(6.5, 22.2, 2.2, 2.4, 2.55, deskM, 28); cyl(6.5, 22.2, 0.25, 0.4, 2.4, M("leg"), 10);
    [[6.5, 19.4], [9.2, 22.2], [6.5, 25.0]].forEach(([x, z]) => chair(x, z));
    /* the breakroom counter and the microwave, against the closet wall */
    box(8.8, 17.6, 10.7, 21.2, 0.35, 3.3, M("cab", { color: 0xd8d4cb, roughness: 0.6 }));
    box(9.0, 18.2, 10.6, 20.4, 3.3, 4.5, M("micro", { color: 0xd9d9d9, roughness: 0.4, metalness: 0.3 }));
    /* the IT bench in the closet: your desk, with your laptop on it */
    box(11.4, 20.5, 13.6, 25.8, 2.35, 2.5, deskM);
    box(11.75, 22.0, 11.9, 24.4, 3.0, 4.35, dark); box(11.91, 22.1, 11.93, 24.3, 3.08, 4.27, M("screenOn"), false);
    box(12.5, 22.6, 13.3, 23.8, 2.5, 2.55, dark); box(12.5, 22.6, 12.56, 23.8, 2.55, 3.1, M("screenOn"), false);
    chair(14.6, 23.2);
    /* the closet: rack with the file and mail servers and the switch; the WAP on the wall */
    box(15.5, 27, 17.6, 31.2, 0.35, 7.2, M("rack", { color: 0x1c1f24, roughness: 0.5, metalness: 0.4 }));
    [2.0, 3.6, 5.2].forEach((y, i) => {
      box(15.4, 27.3, 15.5, 30.9, y, y + 1.1, M("srv" + i, { color: i === 2 ? 0x2b2f35 : 0x3a3f46, metalness: 0.5, roughness: 0.4 }), false);
      [27.7, 28.0, 28.3].forEach((z, k) => box(15.36, z, 15.4, z + 0.12, y + 0.45, y + 0.6, M("led" + (k === 2 && i === 2 ? "a" : "g"), { color: k === 2 && i === 2 ? 0xffb020 : 0x2fd45e, emissive: k === 2 && i === 2 ? 0xffb020 : 0x2fd45e, emissiveIntensity: 1 }), false));
      box(15.36, 29.2, 15.4, 30.6, y + 0.3, y + 0.8, M("bays", { color: 0x15181c, roughness: 0.5 }), false);
    });
    const ap = cyl(AP.x, AP.z, 0.55, AP.y - 0.15, AP.y + 0.1, M("ap", { color: 0xf1f1ef, roughness: 0.4 }), 24);
    box(AP.x - 0.08, AP.z - 0.6, AP.x + 0.08, AP.z - 0.25, AP.y - 0.05, AP.y + 0.05, M("aplight", { color: 0x2fd45e, emissive: 0x2fd45e, emissiveIntensity: 1 }), false);
    /* conference: table for ten, a screen on the east wall */
    box(23, 22.5, 35, 26.5, 2.35, 2.55, wood); cyl(26, 24.5, 0.4, 0.4, 2.35, M("leg"), 10); cyl(32, 24.5, 0.4, 0.4, 2.35, M("leg"), 10);
    [24, 27, 30, 33].forEach((x) => { chair(x + 0.5, 21); chair(x + 0.5, 28); }); chair(21.3, 24.5); chair(36.7, 24.5);
    box(39.3, 21.5, 39.6, 27.5, 4, 7.4, dark);
    /* the break counter along the closet wall, and the microwave on it
       (the Wireless Reliability job) */
    if (opts.microwave) {
      /* the counter: wood cabinets, a speckled stone worktop and white
         tiles behind, as in the owner's photograph of their microwave */
      uvBox(18.25, 19.6, 20.2, 24.4, 0.4, 3.1, texMat("woodM", TEX.wood, [1, 1], { roughness: 0.55 }), 6);
      [20.0, 22.0].forEach((z) => box(20.2, z + 0.15, 20.24, z + 1.85, 0.7, 2.85, M("cabdoor", { color: 0x6e4a2f, roughness: 0.5 }), false));
      [21.85, 23.85].forEach((z) => box(20.24, z - 0.06, 20.3, z + 0.06, 2.3, 2.7, M("knob", { color: 0xb8bcc2, metalness: 0.8, roughness: 0.3 }), false));
      uvBox(18.2, 19.5, 20.3, 24.5, 3.1, 3.25, texMat("graniteM", () => canvasTex(256, 256, (g, w, h) => { noise(g, w, h, "#cfcac0", 0.10, 2500, 47); const r = rnd(59); for (let i = 0; i < 1400; i++) { const k = r(); g.fillStyle = k < 0.45 ? "rgba(70,66,60,0.55)" : k < 0.8 ? "rgba(150,140,128,0.5)" : "rgba(250,248,240,0.7)"; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5); } }), [1, 1], { roughness: 0.3, envMapIntensity: 0.4 }), 2);
      uvBox(18.26, 19.6, 18.32, 24.4, 3.25, 5.3, texMat("tilesM", () => canvasTex(128, 128, (g, w, h) => { noise(g, w, h, "#f1f0ec", 0.04, 400, 53); g.strokeStyle = "rgba(150,150,145,0.7)"; g.lineWidth = 3; for (let y = 0; y <= h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? 32 : 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } }), [1, 1], { roughness: 0.25 }), 1);
      microwaveAt(opts.microwave.x, opts.microwave.z);
    }
    /* plants */
    [[1.5, 15.5], [38.5, 15.5], [12, 1.2], [26, 11]].forEach(([x, z]) => { cyl(x, z, 0.55, 0.4, 1.6, M("pot", { color: 0xcfcac0 }), 14); shrub(x, z + 0, 0.9).position.y = 2.4; });
  }
  
  /* ---------------- Wi-Fi coverage, computed from the walls ---------------- */
  function rfWalls() { const out = []; WALLS.forEach((w) => segs(w).forEach((s) => out.push({ s, kind: w[4] }))); return out; }
  function crosses(ax, az, bx, bz, [x0, z0, x1, z1]) {
    /* A + t(B-A) meets C + u(D-C): t = (C-A)xs / (r x s), u = (C-A)xr / (r x s) */
    const rx = bx - ax, rz = bz - az, sx = x1 - x0, sz = z1 - z0;
    const den = rx * sz - rz * sx; if (Math.abs(den) < 1e-9) return false;
    const qx = x0 - ax, qz = z0 - az;
    const t = (qx * sz - qz * sx) / den, u = (qx * rz - qz * rx) / den;
    return t > 0 && t < 1 && u >= 0 && u <= 1;
  }
  function rssi(x, z, band) {
    const f = band === "5" ? 5180 : 2437;
    const dm = Math.max(0.5, Math.hypot(x - AP.x, z - AP.z, 5) * 0.3048);
    let loss = 20 * Math.log10(dm) + 20 * Math.log10(f) - 27.55;
    /* "This building has thick walls": interior walls are masonry here */
    const wl = { int: band === "5" ? 20 : 12, ext: band === "5" ? 26 : 18 };
    rfWalls().forEach((w) => { if (crosses(AP.x, AP.z, x, z, w.s)) loss += wl[w.kind]; });
    let r = 20 - loss;
    return r;
  }
  function heatmap(band) {
    const S = 6, c = document.createElement("canvas"); c.width = W * S; c.height = D * S; const g = c.getContext("2d");
    const img = g.createImageData(c.width, c.height);
    for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) {
      const v = rssi(i / S, j / S, band); let col;
      if (v >= -60) col = [20, 140, 60, 175]; else if (v >= -67) col = [130, 190, 50, 175]; else if (v >= -75) col = [250, 210, 30, 185]; else if (v >= -82) col = [215, 50, 40, 185]; else col = [125, 20, 25, 200];
      const k = (j * c.width + i) * 4; img.data.set(col, k);
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
    pl.rotation.x = -Math.PI / 2; pl.position.set(W / 2, 0.45, D / 2); pl.renderOrder = 2; scene.add(pl);
  }
  
  /* =====================================================================
     THE STREET — the three houses from Router_houses.png
     ===================================================================== */
  function gableHouse(x, z, w, d, wallH, roofH, sidingCol, roofCol, trim, opts) {
    const sid = texMat("sid" + sidingCol, () => TEX.siding(sidingCol), [1, 1]);
    uvBox(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 0.8, 0.8 + wallH, sid, 6);
    uvBox(x - w / 2 - 0.4, z - d / 2 - 0.4, x + w / 2 + 0.4, z + d / 2 + 0.4, 0, 0.8, M("found", { color: 0x9c9a94 }), 4);
    /* gable roof, ridge running front-to-back so the gable faces the street (as in the picture) */
    const shape = new THREE.Shape(); const hw = w / 2 + 1.2;
    shape.moveTo(-hw, 0); shape.lineTo(hw, 0); shape.lineTo(0, roofH); shape.lineTo(-hw, 0);
    const rg = new THREE.ExtrudeGeometry(shape, { depth: d + 2.4, bevelEnabled: false });
    const rm = new THREE.Mesh(rg, [texMat("sh" + roofCol, () => TEX.shingle(roofCol), [0.25, 0.25]), texMat("sh" + roofCol)]);
    rm.position.set(x, 0.8 + wallH, z - d / 2 - 1.2); rm.castShadow = true; rm.receiveShadow = true; scene.add(rm);
    /* gable wall triangle (front and back) */
    const gs = new THREE.Shape(); gs.moveTo(-w / 2, 0); gs.lineTo(w / 2, 0); gs.lineTo(0, roofH - 0.9); gs.lineTo(-w / 2, 0);
    [z + d / 2 - 0.02, z - d / 2 + 0.02].forEach((gz) => { const gm = new THREE.Mesh(new THREE.ShapeGeometry(gs), sid); gm.position.set(x, 0.8 + wallH, gz); if (gz < z) gm.rotation.y = Math.PI; scene.add(gm); });
    const fz = z + d / 2 + 0.06, win = M("hwin", { color: 0x284a5c, roughness: 0.1, metalness: 0.5 }), tr = M("trim" + trim, { color: trim, roughness: 0.6 });
    (opts.windows || []).forEach(([wx, wy, ww, wh]) => { box(x + wx - ww / 2 - 0.3, fz - 0.05, x + wx + ww / 2 + 0.3, fz + 0.12, wy - 0.3, wy + wh + 0.3, tr, false); box(x + wx - ww / 2, fz + 0.1, x + wx + ww / 2, fz + 0.16, wy, wy + wh, win, false); box(x + wx - 0.08, fz + 0.16, x + wx + 0.08, fz + 0.2, wy, wy + wh, tr, false); box(x + wx - ww / 2, fz + 0.16, x + wx + ww / 2, fz + 0.2, wy + wh / 2 - 0.08, wy + wh / 2 + 0.08, tr, false); });
    const [dx, dcol] = opts.door; box(x + dx - 2, fz - 0.05, x + dx + 2, fz + 0.12, 0.8, 8.3, tr, false); box(x + dx - 1.6, fz + 0.1, x + dx + 1.6, fz + 0.2, 0.8, 7.9, M("hdoor" + dcol, { color: dcol, roughness: 0.5 }), false);
    box(x + dx - 3, fz, x + dx + 3, fz + 3, 0, 0.8, M("step", { color: 0xb7b3aa }));
    if (opts.porch) { box(x - w / 2, fz, x + w / 2, fz + 5, 9.4, 10.0, M("porchroof" + opts.porch, { color: opts.porch, roughness: 0.8 })); [x - w / 2 + 0.6, x + w / 2 - 0.6].forEach((px) => box(px - 0.3, fz + 4.2, px + 0.3, fz + 4.8, 0.8, 9.4, tr)); }
    if (opts.chimney) box(x + w / 2 - 3, z - 4, x + w / 2 - 0.5, z - 1.5, wallH, wallH + roofH + 2, M("chim", { color: 0x3b3f45 }));
  }
  function buildStreet() {
    const grass = texMat("grassM", TEX.grass, [1, 1]); uvBox(-1400, -1400, 1400, 1400, -0.2, 0, grass, 70);
    const asph = texMat("asphM", TEX.asphalt, [1, 1], { roughness: 0.95 }); uvBox(-120, 40, 120, 64, -0.19, 0.02, asph, 20);
    for (let x = -116; x < 120; x += 14) box(x, 51.7, x + 7, 52.3, 0.02, 0.05, M("lane", { color: 0xe8e2c8 }), false);
    const conc = texMat("concM", TEX.concrete, [1, 1]); uvBox(-120, 32, 120, 37, 0, 0.3, conc, 5);
    box(-120, 37, 120, 40, 0, 0.45, M("curb", { color: 0xb9b6ae }));
    const houses = [
      { x: -52, siding: "#e07b2c", roof: "#b44a1e", trim: 0xf4ead8, w: 26, d: 30, wallH: 11, roofH: 11, windows: [[-7, 3.5, 6, 5], [0, 13.5, 3.2, 3.6]], door: [4, 0x7a3b25] },
      { x: 0, siding: "#e9c893", roof: "#b4521f", trim: 0xf6f0e2, w: 30, d: 32, wallH: 19, roofH: 9, windows: [[5, 3.5, 9, 5], [0, 12.5, 4, 4.4]], door: [-7, 0x2f5d7c], band: "#b4521f" },
      { x: 52, siding: "#4a7fb0", roof: "#3a3f47", trim: 0xf4f0e6, w: 28, d: 30, wallH: 18, roofH: 10, windows: [[7, 3.5, 4, 5], [0, 11.5, 4, 4.4]], door: [-3, 0x7a3b25], porch: 0x3a3f47, chimney: true }
    ];
    houses.forEach((h, i) => {
      gableHouse(h.x, 0, h.w, h.d, h.wallH, h.roofH, h.siding, h.roof, h.trim, h);
      if (h.band) box(h.x - h.w / 2 - 1, 15, h.x + h.w / 2 + 1, 20.5, 9.5, 10.3, M("band", { color: 0xb4521f, roughness: 0.8 }));
      uvBox(h.x + (i === 1 ? 10 : -9) - 5, 15, h.x + (i === 1 ? 10 : -9) + 5, 37, 0, 0.12, conc, 5);   /* driveway */
      for (let k = 0; k < 5; k++) shrub(h.x - h.w / 2 + 3 + k * (h.w - 6) / 4, 17.8, 1.6);
      box(h.x + h.w / 2 + 8, -18, h.x + h.w / 2 + 8.3, 30, 0, 4, M("fence", { color: 0xe8e2d4 }));
    });
    [[-80, -30, 26], [-26, -40, 30], [26, -44, 28], [84, -30, 26], [-90, 20, 22], [92, 18, 24]].forEach(([x, z, h], i) => tree(x, z, h, i + 11));
    return houses;
  }
  

  /* ------------------------------------------------ the live model */
  const HOUSES = opts.street ? buildStreet() : (buildOffice(false, !!opts.walk), null);
  /* Indoors, the open sky above the roofless rooms tinted everything blue.
     On the walk the office has its own lights: warm ceiling panels in each
     room, and less of the sky. */
  if (opts.walk && !opts.street) {
    /* cheap light only: no per-room point lights, which slow every frame
       on a weak graphics card (and stalled the software renderer) */
    /* reflections from a neutral indoor room (three.js's RoomEnvironment),
       not the sky: steel and glass then read as they do indoors */
    scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture; scene.environmentIntensity = 0.7;
    scene.add(new THREE.HemisphereLight(0xfff4e0, 0x8a7f6e, 0.6));
    scene.add(new THREE.AmbientLight(0xfff1dc, 0.25));
  }
  const cam = new THREE.PerspectiveCamera(opts.street ? 36 : 40, WIDTH() / HEIGHT, 1, 2000);
  cam.position.set(-14, 62, 70);
  const controls = new OrbitControls(cam, canvas);
  controls.target.set(20, 0, 15); controls.enableDamping = false;
  controls.minDistance = 25; controls.maxDistance = 180; controls.maxPolarAngle = Math.PI * 0.46;
  if (opts.street) { cam.position.set(6, 112, 168); controls.target.set(0, 0, 18); controls.minDistance = 60; controls.maxDistance = 420; }
  controls.update();

  /* THE STREET'S WI-FI (the Neighboring Routers tickets): each router's
     reach as a disc on the ground in its channel's colour, and where
     Router 3 clashes with a neighbour, red stripes over the shared ground.
     Drawn from what the routers are RUNNING; the words for it are in the
     window around the canvas (streetview.js). */
  const REACH = 115, GX = 380, GZ = 300, PX = 4;
  let ground = null;
  function drawStreetWifi(list) {
    if (!HOUSES) return;
    const c = document.createElement("canvas"); c.width = GX * PX; c.height = GZ * PX; const g = c.getContext("2d");
    const at = (i) => [(HOUSES[i].x + GX / 2) * PX, (0 + GZ / 2) * PX];
    const circle = (i, r) => { const [x, y] = at(i); g.beginPath(); g.arc(x, y, r * PX, 0, Math.PI * 2); };
    list.forEach((rt) => { circle(rt.house, REACH); g.fillStyle = rt.fill + (rt.ours ? "40" : "26"); g.fill(); });
    const ours = list.filter((x) => x.ours)[0];
    if (ours) list.filter((x) => x.clash).forEach((n) => {
      g.save(); circle(ours.house, REACH); g.clip(); circle(n.house, REACH); g.clip();
      g.strokeStyle = "rgba(185,28,28,0.75)"; g.lineWidth = 3 * PX;
      for (let k = -c.height; k < c.width; k += 9 * PX) { g.beginPath(); g.moveTo(k, c.height); g.lineTo(k + c.height, 0); g.stroke(); }
      g.restore();
    });
    list.forEach((rt) => { circle(rt.house, REACH - 0.6); g.strokeStyle = rt.fill; g.lineWidth = (rt.ours ? 2.2 : 1.4) * PX; if (!rt.ours) g.setLineDash([6 * PX, 4 * PX]); else g.setLineDash([]); g.stroke(); g.setLineDash([]); });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    if (ground) { ground.material.map.dispose(); ground.material.map = t; ground.material.needsUpdate = true; }
    else { ground = new THREE.Mesh(new THREE.PlaneGeometry(GX, GZ), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0.5, 0); ground.renderOrder = 2; scene.add(ground); }
    /* each router, a small box with its aerials on a shelf by the front window */
    if (!drawStreetWifi.boxes) { drawStreetWifi.boxes = true; HOUSES.forEach((h) => { box(h.x - 1, h.d / 2 - 3, h.x + 1, h.d / 2 - 1.8, 3.4, 3.8, M("rtr", { color: 0x1c1f24, roughness: 0.4 })); [-0.6, 0.6].forEach((dx) => box(h.x + dx - 0.05, h.d / 2 - 2.5, h.x + dx + 0.05, h.d / 2 - 2.3, 3.8, 4.8, M("rtr"))); }); }
  }

  /* A clickable block over each desk, and a ring that marks the machine
     being worked on. The ring is yellow (royal palette) and the machine
     list says the same thing in words. */
  const hits = [];
  (opts.machines || []).forEach(function (mc) {
    if (!mc.desk) return;
    const hb = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 5), new THREE.MeshBasicMaterial({ visible: false }));
    hb.position.set(mc.desk[0], 2.5, mc.desk[1] + 1.5); hb.userData.machine = mc.id; scene.add(hb); hits.push(hb);
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.3, 48), new THREE.MeshBasicMaterial({ color: 0xffd426, transparent: true, opacity: 0.95, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.5; ring.visible = false; scene.add(ring);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, cam));
  let ao = null;
  if (opts.ao !== false && !opts.walk) { ao = new GTAOPass(scene, cam, WIDTH(), HEIGHT); ao.blendIntensity = 0.9; ao.updateGtaoMaterial({ radius: 3.5, distanceExponent: 1.5, thickness: 2, scale: 1.2 }); composer.addPass(ao); }
  composer.addPass(new OutputPass());
  let pending = false;
  function render() { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; composer.render(); }); }
  controls.addEventListener("change", render);

  let lastWalk = null;
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let downAt = null;
  canvas.addEventListener("pointerdown", function (e) { downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener("pointerup", function (e) {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, cam);
    const h = ray.intersectObjects(hits)[0];
    if (h && opts.onPick) opts.onPick(h.object.userData.machine);
  });
  function resize() { renderer.setSize(WIDTH(), HEIGHT); canvas.style.width = "100%"; cam.aspect = WIDTH() / HEIGHT; cam.updateProjectionMatrix(); composer.setSize(WIDTH(), HEIGHT); render(); }
  window.addEventListener("resize", resize);
  render();

  /* the fly-in: from high over the street down to the view along it
     (a plain cut for reduced motion) */
  function flyIn(done) {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const P0 = new THREE.Vector3(0, 520, 40), P1 = cam.position.clone(), T0 = new THREE.Vector3(0, 0, 0), T1 = controls.target.clone();
    if (reduce) { render(); if (done) done(); return; }
    const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; let t0 = 0; controls.enabled = false;
    function frame(now) { if (!t0) t0 = now; const u = Math.min(1, (now - t0) / 2600), e = ease(u);
      cam.position.copy(P0).lerp(P1, e); cam.lookAt(T0.clone().lerp(T1, e)); composer.render(); if (opts.onView) opts.onView();
      if (u < 1) requestAnimationFrame(frame); else { controls.enabled = true; controls.update(); render(); if (done) done(); } }
    requestAnimationFrame(frame);
  }
  if (opts.onView) controls.addEventListener("change", opts.onView);

  return {
    /* the street: [{ house: 0-2, fill: "#hex", ours, clash }] */
    street: function (list) { drawStreetWifi(list); render(); },
    flyIn: flyIn,
    /* where a point over each house's roof is, in pixels inside the canvas */
    houseAt: function (i) {
      if (!HOUSES) return null; const h = HOUSES[i]; const v = new THREE.Vector3(h.x, h.wallH + h.roofH + 10, 0).project(cam);
      return { x: (v.x + 1) / 2 * canvas.clientWidth, y: (1 - v.y) / 2 * canvas.clientHeight, behind: v.z > 1 };
    },
    select: function (id) {
      const mc = (opts.machines || []).filter(function (x) { return x.id === id; })[0];
      if (mc && mc.desk) { ring.visible = true; ring.position.set(mc.desk[0], 0.5, mc.desk[1] + 2.4); } else ring.visible = false;
      render();
    },
    render: render,
    /* Where a desk's PC is on the screen, in page pixels — so verify/ can
       click it the way a student would. */
    screenOf: function (id) {
      const hb = hits.filter(function (x) { return x.userData.machine === id; })[0]; if (!hb) return null;
      const v = hb.position.clone().project(cam); const r = canvas.getBoundingClientRect();
      return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
    },
    /* THE WALK-OVER: the camera at standing eye height, walking a path of
       [x, z] points through the doors, then turning to look at a point.
       With reduced motion it cuts straight there. */
    peek: function (u) { if (lastWalk) lastWalk(u); },
    walk: function (path, look, done, cine) {
      cine = cine || {};
      controls.enabled = false;
      const EYE = 5.4, pts = path.map(function (p) { return new THREE.Vector3(p[0], EYE, p[1]); });
      const target = new THREE.Vector3(look[0], look[1], look[2]);
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let seg = [], total = 0; for (let i = 1; i < pts.length; i++) { const d = pts[i].distanceTo(pts[i - 1]); seg.push(d); total += d; }
      const SPEED = 5.5; /* feet a second: a brisk walk */
      const dur = reduce ? 0 : (total / SPEED) * 1000; let t0 = 0, stopped = false, finished = false;
      /* THE CUTSCENE (owner, 1 Oct: "like a cut screen from a video
         game"). An establishing shot high over the building swoops down
         into the room the walk starts from; then the walk itself, eased
         in and out, with a slight sway in step. Reduced motion: none of
         it, a plain cut. */
      /* no establishing shot for a few steps across the same room (the
         server rack is beside your bench) */
      const AERIAL = reduce || !cine.aerial || total < 12 ? 0 : 3400;
      const A0 = new THREE.Vector3(W / 2 - 34, 78, D + 62), AL = new THREE.Vector3(W / 2, 0, D / 2);
      const ease = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
      function at(u) {
        let d = u * total, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
        const a = pts[i], b = pts[i + 1] || pts[i]; const k = seg[i] ? Math.min(1, d / seg[i]) : 1;
        return a.clone().lerp(b, k);
      }
      function lookAt(u) { const ahead = u < 0.92 ? at(Math.min(1, u + 0.06)) : null; return ahead ? new THREE.Vector3(ahead.x, EYE - 0.2, ahead.z).lerp(target, Math.max(0, (u - 0.75) / 0.25)) : target; }
      function walkAt(u) {
        const e = dur ? ease(u) : 1, p = at(e);
        /* in step: a little bob and sway, fading out as you stop */
        const fade = Math.min(1, e * 8, (1 - e) * 8), dist = e * total;
        if (dur) { p.y += Math.sin(dist * 2.2) * 0.07 * fade; const ahead = at(Math.min(1, e + 0.01)); const side = new THREE.Vector3(ahead.z - p.z, 0, p.x - ahead.x).normalize(); p.addScaledVector(side, Math.sin(dist * 1.1) * 0.05 * fade); }
        cam.position.copy(p); cam.lookAt(lookAt(e)); composer.render();
      }
      /* The establishing shot: high over the building, a curve down over
         the roofless room the walk starts in, then straight down into it,
         already facing the way the walk goes, so the cut to walking is
         seamless. */
      function aerialAt(u) {
        const e = ease(u), p0 = pts[0];
        const fwd = at(0.3).sub(p0).setY(0).normalize();
        const P1 = new THREE.Vector3(p0.x - 4, 58, p0.z + 34), P2 = p0.clone().addScaledVector(fwd, -2.5).setY(17);
        const k = 1 - e, pos = A0.clone().multiplyScalar(k * k * k).add(P1.clone().multiplyScalar(3 * k * k * e)).add(P2.clone().multiplyScalar(3 * k * e * e)).add(p0.clone().multiplyScalar(e * e * e));
        cam.position.copy(pos);
        const ahead = at(0.3).setY(EYE - 0.4), endLook = lookAt(0);
        const look = e < 0.8 ? AL.clone().lerp(ahead, Math.pow(e / 0.8, 1.4)) : ahead.lerp(endLook, (e - 0.8) / 0.2);
        cam.lookAt(look); composer.render();
      }
      let phase = AERIAL ? "aerial" : "walk";
      if (cine.onPhase) cine.onPhase(phase);
      function frame(now) {
        if (stopped) return;
        if (!t0) t0 = now;
        if (phase === "aerial") {
          const u = Math.min(1, (now - t0) / AERIAL); aerialAt(u);
          if (u >= 1) { phase = "walk"; t0 = now; if (cine.onPhase) cine.onPhase("walk"); }
          return requestAnimationFrame(frame);
        }
        const u = dur ? Math.min(1, (now - t0) / dur) : 1; walkAt(u);
        if (u < 1) requestAnimationFrame(frame); else { stopped = finished = true; if (cine.onPhase) cine.onPhase("end"); if (done) done(); }
      }
      requestAnimationFrame(frame);
      /* for verify/: draw the walk at a given point along the route
         (u < 0 draws the establishing shot, -1 its start) */
      lastWalk = function (u) { stopped = true; if (cine.onPhase) cine.onPhase(u < 0 ? "aerial" : "walk"); if (u < 0) aerialAt(1 + u); else walkAt(u); };
      return { skip: function () { if (finished) return; stopped = finished = true; cam.position.copy(pts[pts.length - 1]); cam.lookAt(target); composer.render(); if (cine.onPhase) cine.onPhase("end"); if (done) done(); } };
    },
    /* Slide the picture sideways, so what the student is looking at sits
       beside the panel that opens over the right of the screen. */
    shift: function (fr) { const w = renderer.domElement.width, h = renderer.domElement.height; if (fr) cam.setViewOffset(w, h, w * fr, 0, w, h); else cam.clearViewOffset(); composer.render(); },
    standAt: function (p, look) { controls.enabled = false; cam.position.set(p[0], 5.4, p[1]); cam.lookAt(look[0], look[1], look[2]); composer.render(); },
    dispose: function () { window.removeEventListener("resize", resize); renderer.dispose(); }
  };
}
