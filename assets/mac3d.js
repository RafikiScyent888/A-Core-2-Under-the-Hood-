/* =====================================================================
   The Mac, for the macOS tickets (Core 2: "OS installation: working with
   Windows, macOS, Linux, and mobile operating systems"). A generic
   13-inch aluminium notebook in the style of a MacBook Air (M-series),
   built from its published dimensions (about 304 x 215 mm, 11.3 mm
   thick; one unit is a millimetre). No maker's logo or branding.

   - the base: brushed silver aluminium, a black keyboard in a shallow
     well with a Touch ID key at its top right, a large glass trackpad
   - the left side: the MagSafe charging port and two USB-C ports; the
     right side: the headphone jack
   - the lid: open on its hinge, a thin black bezel, the camera notch,
     and the screen (a picture here; in the laptop the screen is real
     HTML beside it, as the PCs' and the phone's are)
   - rubber feet underneath

   buildMac(THREE, { screen: canvas|null, open: degrees, RoundedBoxGeometry })
   returns a Group sitting on y = 0, its front edge facing +z.
   ===================================================================== */
export function buildMac(THREE, opts) {
  opts = opts || {};
  const RB = opts.RoundedBoxGeometry;
  const W = 304.1, D = 215, BT = 6.2, LT = 4.6, R = 12;
  const g = new THREE.Group();
  const add = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (parent || g).add(m); return m; };
  const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

  /* materials: brushed silver, a darker anodised edge, black glass */
  const brushed = tex(1024, 128, (c, w, h) => { c.fillStyle = "#c9cdd2"; c.fillRect(0, 0, w, h); for (let i = 0; i < 1800; i++) { c.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.07)" : "rgba(40,44,50,0.06)"; c.fillRect(Math.random() * w, Math.random() * h, 40 + Math.random() * 200, 0.7); } });
  const alu = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: brushed, metalness: 1, roughness: 0.32 });
  const aluDark = new THREE.MeshPhysicalMaterial({ color: 0xa3a8ae, metalness: 1, roughness: 0.38 });
  const blackGlass = new THREE.MeshPhysicalMaterial({ color: 0x060708, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03 });
  const hole = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.95 });

  /* the base: a rounded slab, lying flat */
  const slab = (w, d, t) => { const s = roundRect(w, d, R); const geo = new THREE.ExtrudeGeometry(s, { depth: t - 1.2, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.6, bevelSegments: 5, curveSegments: 20 }); geo.rotateX(-Math.PI / 2); return geo; };
  add(slab(W, D, BT), alu, 0, 0.6, 0);
  /* the keyboard: a drawn black keyboard in a shallow well */
  const kbW = 266, kbD = 100;
  const kb = tex(2048, 860, drawKeyboard);
  const kbPlane = new THREE.PlaneGeometry(kbW, kbD); kbPlane.rotateX(-Math.PI / 2);
  add(kbPlane, new THREE.MeshStandardMaterial({ map: kb, roughness: 0.55 }), 0, BT + 0.02, -D / 2 + 12 + kbD / 2).castShadow = false;
  /* the trackpad: glass, a shade darker than the case */
  const tpGeo = new THREE.ShapeGeometry(roundRect(130, 76, 6), 16); tpGeo.rotateX(-Math.PI / 2);
  add(tpGeo, new THREE.MeshPhysicalMaterial({ color: 0xbfc4ca, metalness: 0.6, roughness: 0.22, clearcoat: 0.6 }), 0, BT + 0.03, D / 2 - 12 - 38).castShadow = false;
  /* the finger notch at the front edge, for opening the lid */
  add(new RB(30, 1.4, 4, 2, 0.6), aluDark, 0, BT - 0.2, D / 2 - 1.2);

  /* the left side: MagSafe, then two USB-C; the right side: the headphone jack */
  const xl = -W / 2 - 0.62, xr = W / 2 + 0.62;
  add(new RB(1.6, 2.6, 11, 4, 1.25), hole, xl, BT / 2 + 0.6, -60);            /* MagSafe: a long slot */
  add(new RB(1.6, 3.0, 8.6, 4, 1.45), hole, xl, BT / 2 + 0.6, -40);           /* USB-C */
  add(new RB(1.6, 3.0, 8.6, 4, 1.45), hole, xl, BT / 2 + 0.6, -27);           /* USB-C */
  add(new THREE.CylinderGeometry(1.75, 1.75, 1.6, 20), hole, xr, BT / 2 + 0.6, -48).rotation.z = Math.PI / 2;   /* 3.5 mm jack */
  /* feet */
  [[-W / 2 + 22, -D / 2 + 20], [W / 2 - 22, -D / 2 + 20], [-W / 2 + 22, D / 2 - 20], [W / 2 - 22, D / 2 - 20]].forEach(([x, z]) => add(new THREE.CylinderGeometry(5, 5, 0.7, 24), rubber, x, 0.25, z));

  /* the lid, hinged at the back edge; opened to `open` degrees */
  const lid = new THREE.Group(); lid.position.set(0, BT + 0.4, -D / 2 + 2); g.add(lid);
  const open = (opts.open == null ? 108 : opts.open) * Math.PI / 180;
  lid.rotation.x = -(open - Math.PI / 2) ;
  /* lid slab: stands up from the hinge, its outer face toward -z */
  const lidShape = roundRect(W, D - 3, R);
  const lidGeo = new THREE.ExtrudeGeometry(lidShape, { depth: LT - 1.0, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 5, curveSegments: 20 });
  add(lidGeo, alu, 0, (D - 3) / 2, -LT + 0.5, lid);
  /* the inner face: black glass with the screen set in it */
  const faceGeo = new THREE.ShapeGeometry(roundRect(W - 1.2, D - 4.2, R - 0.6), 20);
  add(faceGeo, blackGlass, 0, (D - 3) / 2, 0.06, lid);
  const sw = W - 14, sh = D - 3 - 17;
  const scr = opts.screen ? new THREE.CanvasTexture(opts.screen) : tex(1560, 1012, drawRecovery);
  scr.colorSpace = THREE.SRGBColorSpace; scr.anisotropy = 8;
  g.userData.screen = scr;   /* redraw the canvas and set needsUpdate to change what's on screen */
  const screenGeo = new THREE.ShapeGeometry(roundRect(sw, sh, 6), 16); fitUV(screenGeo, sw, sh);
  /* a display shows its own pixels: unlit, outside tone mapping, so its
     words stay crisp; a faint glass layer carries the reflections */
  add(screenGeo, new THREE.MeshBasicMaterial({ map: scr, toneMapped: false }), 0, 7 + sh / 2, 0.12, lid).castShadow = false;
  add(screenGeo, new THREE.MeshPhysicalMaterial({ color: 0x000000, transparent: true, opacity: 0.06, roughness: 0.05, clearcoat: 1, envMapIntensity: 0.5, depthWrite: false }), 0, 7 + sh / 2, 0.18, lid).castShadow = false;
  /* the camera notch, at the top centre of the screen */
  add(new THREE.ShapeGeometry(roundRect(30, 9, 3), 10), blackGlass, 0, 7 + sh - 3.2, 0.2, lid);
  add(new THREE.CircleGeometry(1.1, 20), new THREE.MeshPhysicalMaterial({ color: 0x1b2a5a, roughness: 0.05, clearcoat: 1 }), 0, 7 + sh - 3, 0.24, lid);
  /* a soft rubber gasket along the bottom of the bezel */
  add(new RB(W - 40, 2.2, 0.6, 2, 0.3), rubber, 0, 2.2, 0.1, lid);
  return g;

  function roundRect(w, h, r) { const s = new THREE.Shape(), a = -w / 2, b = -h / 2; s.moveTo(a + r, b); s.lineTo(-a - r, b); s.quadraticCurveTo(-a, b, -a, b + r); s.lineTo(-a, -b - r); s.quadraticCurveTo(-a, -b, -a - r, -b); s.lineTo(a + r, -b); s.quadraticCurveTo(a, -b, a, -b - r); s.lineTo(a, b + r); s.quadraticCurveTo(a, b, a + r, b); return s; }
  function fitUV(geo, w, h) { const p = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5); uv.needsUpdate = true; }
}

/* the keyboard: a UK layout in black caps, function row, arrow keys in an
   inverted T, the Touch ID key at the top right */
export function drawKeyboard(c, w, h) {
  c.fillStyle = "#b9bec4"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#16181b"; c.fillRect(0, 0, w, h);
  const u = w / 15.2, gap = u * 0.08, rowH = (h - 12) / 6.0;
  const cap = (x, y, ww, hh, label, small) => {
    c.fillStyle = "#1f2226"; c.beginPath(); c.roundRect(x + gap / 2, y + gap / 2, ww - gap, hh - gap, 10); c.fill();
    c.fillStyle = "#2a2e33"; c.beginPath(); c.roundRect(x + gap / 2 + 2, y + gap / 2 + 2, ww - gap - 4, hh - gap - 8, 8); c.fill();
    if (label) { c.fillStyle = "#e9ecef"; c.font = (small ? "500 " + Math.round(u * 0.2) : "500 " + Math.round(u * 0.3)) + "px Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(label, x + ww / 2, y + hh / 2 - 2); }
  };
  let y = 6;
  /* function row: half height, Touch ID last */
  const fn = ["esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"]; let x = 6;
  const fw = (w - 12 - u) / 13;
  fn.forEach((k) => { cap(x, y, fw, rowH * 0.62, k, true); x += fw; });
  c.fillStyle = "#2a2e33"; c.beginPath(); c.roundRect(x + gap / 2, y + gap / 2, u - gap, rowH * 0.62 - gap, 10); c.fill();
  c.strokeStyle = "#5b6067"; c.lineWidth = 3; c.beginPath(); c.roundRect(x + gap / 2 + 6, y + gap / 2 + 6, u - gap - 12, rowH * 0.62 - gap - 12, 8); c.stroke();
  y += rowH * 0.62;
  const rows = [
    [["§", 1], ["1", 1], ["2", 1], ["3", 1], ["4", 1], ["5", 1], ["6", 1], ["7", 1], ["8", 1], ["9", 1], ["0", 1], ["-", 1], ["=", 1], ["delete", 1.85]],
    [["tab", 1.5], ["Q", 1], ["W", 1], ["E", 1], ["R", 1], ["T", 1], ["Y", 1], ["U", 1], ["I", 1], ["O", 1], ["P", 1], ["[", 1], ["]", 1], ["return", 1.35]],
    [["caps lock", 1.8], ["A", 1], ["S", 1], ["D", 1], ["F", 1], ["G", 1], ["H", 1], ["J", 1], ["K", 1], ["L", 1], [";", 1], ["'", 1], ["\\", 1], ["", 1.05]],
    [["shift", 1.35], ["`", 1], ["Z", 1], ["X", 1], ["C", 1], ["V", 1], ["B", 1], ["N", 1], ["M", 1], [",", 1], [".", 1], ["/", 1], ["shift", 2.5]],
    [["fn", 1], ["control", 1], ["option", 1], ["command", 1.3], ["", 5.1], ["command", 1.3], ["option", 1], ["", 3.15]]
  ];
  const scale = (w - 12) / rows[0].reduce((a, k) => a + k[1] * u, 0);
  rows.forEach((row, ri) => { x = 6; row.forEach(([k, n], ki) => {
    const ww = n * u * scale;
    if (ri === 4 && ki === row.length - 1) {
      /* the arrow keys: an inverted T */
      const aw = ww / 3, hh = rowH / 2;
      cap(x + aw, y, aw, hh, "▲", true); cap(x, y + hh, aw, hh, "◀", true); cap(x + aw, y + hh, aw, hh, "▼", true); cap(x + 2 * aw, y + hh, aw, hh, "▶", true);
    } else cap(x, y, ww, rowH, k, k.length > 1);
    x += ww; }); y += rowH; });
}

/* macOS Recovery's utilities, for the model's own picture */
export function drawRecovery(c, w, h) {
  const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#1e3a8a"); gr.addColorStop(0.6, "#3b1d72"); gr.addColorStop(1, "#14532d"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
  c.fillStyle = "rgba(255,255,255,0.92)"; c.fillRect(0, 0, w, 34);
  c.fillStyle = "#111827"; c.font = "600 20px Arial"; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText("Recovery     File     Edit     Utilities     Window", 24, 18);
  const bx = w / 2 - 330, by = h / 2 - 210;
  c.fillStyle = "#f3f4f6"; c.beginPath(); c.roundRect(bx, by, 660, 420, 16); c.fill();
  c.fillStyle = "#111827"; c.font = "700 30px Arial"; c.textAlign = "center"; c.fillText("macOS Recovery", w / 2, by + 50);
  const items = [["Restore from Time Machine", "#15803d"], ["Reinstall macOS", "#1d4ed8"], ["Safari", "#1e40af"], ["Disk Utility", "#6b7280"]];
  items.forEach(([n, col], i) => { const y = by + 105 + i * 72;
    c.fillStyle = i === 3 ? "#dbe6ff" : "#ffffff"; c.beginPath(); c.roundRect(bx + 30, y - 28, 600, 58, 10); c.fill();
    c.fillStyle = col; c.beginPath(); c.roundRect(bx + 44, y - 20, 42, 42, 9); c.fill();
    c.fillStyle = "#111827"; c.font = "500 24px Arial"; c.textAlign = "left"; c.fillText(n, bx + 104, y + 1); });
}
