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
import * as THREE from "three";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

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
  const W = 40, D = 32, H = 9, EXT = 0.8, INT = 0.5;
  /* walls as [x0,z0,x1,z1, kind, gaps[[a,b]]] along one axis */
  const WALLS = [
    [0, 0, W, 0, "ext", []], [0, D, W, D, "ext", [[27, 31]]], [0, 0, 0, D, "ext", [[13, 16.5]]], [W, 0, W, D, "ext", []],
    [0, 12, W, 12, "int", [[8.5, 11.5], [14.5, 17.5], [28, 31]]],
    [13, 0, 13, 12, "int", []], [27, 0, 27, 12, "int", []],
    [11, 17, W, 17, "int", [[13, 16], [19.5, 22.5]]],
    [11, 17, 11, D, "int", []], [18, 17, 18, D, "int", []]
  ];
  const AP = { x: 14.5, z: 18.2, y: 8.2 };
  const TABLET = { x: 30.2, z: 5.2 };
  
  function segs(w) {
    const [x0, z0, x1, z1, , gaps] = w; const horiz = z0 === z1; const a0 = horiz ? x0 : z0, a1 = horiz ? x1 : z1;
    const out = []; let s = a0; gaps.slice().sort((p, q) => p[0] - q[0]).forEach(([g0, g1]) => { if (g0 > s) out.push([s, g0]); s = g1; }); if (s < a1) out.push([s, a1]);
    return out.map(([a, b]) => horiz ? [a, z0, b, z0] : [x0, a, x0, b]);
  }
  
  function buildOffice(roof) {
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
    const cut = roof ? H : 4.2;                                     /* cutaway: every wall cut to 4 ft, dollhouse style */
    WALLS.forEach((w) => {
      const kind = w[4], t = kind === "ext" ? EXT : INT;
      segs(w).forEach(([x0, z0, x1, z1]) => {
        const horiz = z0 === z1;
        const near = !roof;
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
        if (horiz) box(g0, w[1] + 0.3, g0 + 0.15, w[1] + 0.3 + (g1 - g0), 0.35, 7.3, dm); else box(w[0] + 0.3, g0, w[0] + 0.3 + (g1 - g0), g0 + 0.15, 0.35, 7.3, dm);
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
    function chair(x, z) { cyl(x, z, 0.9, 1.3, 1.6, chairM, 16); box(x - 0.9, z + 0.6, x + 0.9, z + 0.8, 1.6, 3.4, chairM); cyl(x, z, 0.12, 0.4, 1.3, M("leg"), 8); cyl(x, z, 0.9, 0.4, 0.5, M("leg"), 5); }
    /* Office 1 (HR, and Finance: the sim has seven machines and the plan has three offices) */
    desk(6.5, 0.9, 12, 3.4); pc(9, 1.6, 1); chair(9, 5);
    desk(0.9, 5.5, 3.4, 11); pc(1.6, 8.2, 1); chair(5, 8.2);
    /* Office 2 (Sales) */ desk(20.5, 0.9, 26, 3.4); pc(23, 1.6, 1); chair(23, 5);
    /* Office 3 (Dev) */ desk(33.5, 0.9, 39, 3.4); pc(36, 1.6, 1); chair(36, 5);
    box(28.8, 4.3, 31.6, 6.1, 2.2, 2.35, deskM); cyl(29.2, 5.2, 0.1, 0.4, 2.2, M("leg"), 8); cyl(31.2, 5.2, 0.1, 0.4, 2.2, M("leg"), 8);
    box(29.7, 4.9, 30.7, 5.6, 2.35, 2.42, dark);                    /* the tablet */
    box(29.78, 4.97, 30.62, 5.53, 2.42, 2.43, M("tabscreen", { color: 0x3a6fbf, emissive: 0x3a6fbf, emissiveIntensity: 0.5 }), false);
    /* reception: the L counter from the plan, the round table */
    box(0.8, 19, 3.3, 30.8, 0.35, 3.8, deskM); box(0.8, 28.3, 8.5, 30.8, 0.35, 3.8, deskM);
    pc(2.0, 23.5, 1); chair(4.8, 23.5);
    cyl(6.5, 22.2, 2.2, 2.4, 2.55, deskM, 28); cyl(6.5, 22.2, 0.25, 0.4, 2.4, M("leg"), 10);
    [[6.5, 19.4], [9.2, 22.2], [6.5, 25.0]].forEach(([x, z]) => chair(x, z));
    /* the breakroom counter and the microwave, against the closet wall */
    box(8.8, 17.6, 10.7, 21.2, 0.35, 3.3, M("cab", { color: 0xd8d4cb, roughness: 0.6 }));
    box(9.0, 18.2, 10.6, 20.4, 3.3, 4.5, M("micro", { color: 0xd9d9d9, roughness: 0.4, metalness: 0.3 }));
    /* the closet: rack with the file and mail servers and the switch; the WAP on the wall */
    box(15.5, 27, 17.6, 31.2, 0.35, 7.2, M("rack", { color: 0x1c1f24, roughness: 0.5, metalness: 0.4 }));
    [2.0, 3.6, 5.2].forEach((y, i) => box(15.4, 27.3, 15.5, 30.9, y, y + 1.1, M("srv" + i, { color: i === 2 ? 0x2b2f35 : 0x3a3f46, metalness: 0.5, roughness: 0.4 }), false));
    const ap = cyl(AP.x, AP.z, 0.55, AP.y - 0.15, AP.y + 0.1, M("ap", { color: 0xf1f1ef, roughness: 0.4 }), 24);
    box(AP.x - 0.08, AP.z - 0.6, AP.x + 0.08, AP.z - 0.25, AP.y - 0.05, AP.y + 0.05, M("aplight", { color: 0x2fd45e, emissive: 0x2fd45e, emissiveIntensity: 1 }), false);
    /* conference: table for ten, a screen on the east wall */
    box(23, 22.5, 35, 26.5, 2.35, 2.55, wood); cyl(26, 24.5, 0.4, 0.4, 2.35, M("leg"), 10); cyl(32, 24.5, 0.4, 0.4, 2.35, M("leg"), 10);
    [24, 27, 30, 33].forEach((x) => { chair(x + 0.5, 21); chair(x + 0.5, 28); }); chair(21.3, 24.5); chair(36.7, 24.5);
    box(39.3, 21.5, 39.6, 27.5, 4, 7.4, dark);
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
  buildOffice(false);
  const cam = new THREE.PerspectiveCamera(40, WIDTH() / HEIGHT, 1, 2000);
  cam.position.set(-14, 62, 70);
  const controls = new OrbitControls(cam, canvas);
  controls.target.set(20, 0, 15); controls.enableDamping = false;
  controls.minDistance = 25; controls.maxDistance = 180; controls.maxPolarAngle = Math.PI * 0.46;
  controls.update();

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
  if (opts.ao !== false) { ao = new GTAOPass(scene, cam, WIDTH(), HEIGHT); ao.blendIntensity = 0.9; ao.updateGtaoMaterial({ radius: 3.5, distanceExponent: 1.5, thickness: 2, scale: 1.2 }); composer.addPass(ao); }
  composer.addPass(new OutputPass());
  let pending = false;
  function render() { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; composer.render(); }); }
  controls.addEventListener("change", render);

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

  return {
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
    dispose: function () { window.removeEventListener("resize", resize); renderer.dispose(); }
  };
}
