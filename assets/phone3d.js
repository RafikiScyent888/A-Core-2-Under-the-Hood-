/* =====================================================================
   The phone, for the mobile troubleshooting tickets (Core 2: "Mobile
   troubleshooting: addressing connectivity, app, and performance
   issues"). A generic modern smartphone, built from standard dimensions
   (about 71.5 x 147 x 7.9 mm; one unit is a millimetre):

   - an aluminium frame with the power key on the right, volume up and
     down on the left, and the SIM tray (with its eject pinhole) below them
   - a royal-blue glass back with a raised camera module: two lenses, a
     flash and a microphone
   - the front glass: a thin bezel, a punch-hole camera, the earpiece slit,
     and the screen (a picture here; in the laptop the screen will be real
     HTML, as the PCs' screens are, so it can be read, zoomed and measured)
   - the bottom edge: the USB-C port, the speaker grille and a microphone
   - the SIM tray can slide out with a nano-SIM in it

   buildPhone(THREE, { screen: canvas|null, tray: 0..1, RoundedBoxGeometry })
   returns a Group, standing with its screen facing +z.
   ===================================================================== */
export function buildPhone(THREE, opts) {
  opts = opts || {};
  const RB = opts.RoundedBoxGeometry;
  const W = 71.5, H = 147, T = 7.9, R = 9.5;
  const g = new THREE.Group();
  const add = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (parent || g).add(m); return m; };
  const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

  /* materials */
  const brushed = tex(512, 64, (c, w, h) => { c.fillStyle = "#c3c7cc"; c.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { c.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.08)" : "rgba(40,44,50,0.07)"; c.fillRect(Math.random() * w, Math.random() * h, 30 + Math.random() * 120, 0.7); } });
  const alu = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: brushed, metalness: 1, roughness: 0.28 });
  const aluDark = new THREE.MeshPhysicalMaterial({ color: 0x9aa0a6, metalness: 1, roughness: 0.35 });
  const backGlass = new THREE.MeshPhysicalMaterial({ color: 0x14254f, metalness: 0.2, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.35, envMapIntensity: 0.8 });   /* frosted navy glass */
  const blackGlass = new THREE.MeshPhysicalMaterial({ color: 0x050607, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02 });
  const hole = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });

  /* the frame: a rounded slab with softened edges */
  const shape = new THREE.Shape(); const x0 = -W / 2, y0 = -H / 2;
  shape.moveTo(x0 + R, y0); shape.lineTo(-x0 - R, y0); shape.quadraticCurveTo(-x0, y0, -x0, y0 + R); shape.lineTo(-x0, -y0 - R); shape.quadraticCurveTo(-x0, -y0, -x0 - R, -y0); shape.lineTo(x0 + R, -y0); shape.quadraticCurveTo(x0, -y0, x0, -y0 - R); shape.lineTo(x0, y0 + R); shape.quadraticCurveTo(x0, y0, x0 + R, y0);
  const frameGeo = new THREE.ExtrudeGeometry(shape, { depth: T - 1.6, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8, bevelSegments: 6, curveSegments: 24 });
  add(frameGeo, alu, 0, 0, -T / 2 + 0.8);
  /* the glass faces, a hair inside the frame */
  const faceGeo = new THREE.ShapeGeometry(shape, 24); faceGeo.scale(0.985, 0.992, 1);
  const back = add(faceGeo, backGlass, 0, 0, -T / 2 - 0.05); back.rotation.y = Math.PI;
  add(faceGeo, blackGlass, 0, 0, T / 2 + 0.05);

  /* the screen */
  const sw = W - 4.4, sh = H - 4.6;
  const scr = opts.screen ? new THREE.CanvasTexture(opts.screen) : tex(540, 1110, drawHome);
  scr.colorSpace = THREE.SRGBColorSpace; scr.anisotropy = 8;
  g.userData.screen = scr;   /* redraw the canvas and set needsUpdate to change what's on screen */
  const screenGeo = new THREE.ShapeGeometry(roundRect(sw, sh, R - 2.2), 20); fitUV(screenGeo, sw, sh);
  add(screenGeo, new THREE.MeshPhysicalMaterial({ map: scr, emissive: 0xffffff, emissiveMap: scr, emissiveIntensity: 0.9, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 0.35 }), 0, 0, T / 2 + 0.07).castShadow = false;
  add(new THREE.CircleGeometry(1.6, 24), hole, 0, H / 2 - 6.2, T / 2 + 0.09);                 /* punch-hole camera */
  add(new RB(10, 0.7, 0.4, 1, 0.3), new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.6 }), 0, H / 2 - 1.4, T / 2 - 0.05); /* earpiece */

  /* buttons: power on the right, volume on the left, the SIM tray below them */
  add(new RB(1.4, 16, 2.6, 2, 0.6), alu, W / 2 + 0.5, 22, 0);
  add(new RB(1.4, 11, 2.6, 2, 0.6), alu, -W / 2 - 0.5, 34, 0);
  add(new RB(1.4, 11, 2.6, 2, 0.6), alu, -W / 2 - 0.5, 20, 0);
  /* the tray: an outline in the frame, a pinhole, and the tray itself */
  const out = Math.max(0, Math.min(1, opts.tray || 0)) * 20;
  const tray = new THREE.Group(); tray.position.set(-W / 2 - out, -8, 0); g.add(tray);
  add(new RB(0.9, 15, 3.1, 2, 0.4), aluDark, -0.1, 0, 0, tray);
  add(new THREE.CylinderGeometry(0.45, 0.45, 1.2, 12), hole, -0.3, -5.2, 0, tray).rotation.z = Math.PI / 2;
  if (out > 0) {
    /* the tray's slide, and a nano-SIM in it (12.3 x 8.8 mm, gold contacts) */
    add(new THREE.BoxGeometry(18, 13, 0.8), new THREE.MeshPhysicalMaterial({ color: 0x8b9096, metalness: 1, roughness: 0.4 }), 9.5, 0, 0, tray);
    const sim = tex(256, 180, (c, w, h) => { c.fillStyle = "#f1f2f4"; c.fillRect(0, 0, w, h); c.fillStyle = "#c9a227"; c.beginPath(); c.roundRect(60, 30, 136, 120, 12); c.fill(); c.strokeStyle = "#8a6d12"; c.lineWidth = 3; [[60, 90, 196, 90], [128, 30, 128, 150], [60, 60, 128, 60], [128, 120, 196, 120]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); }); });
    const simM = add(new THREE.BoxGeometry(12.3, 8.8, 0.67), [hole, hole, hole, hole, new THREE.MeshStandardMaterial({ map: sim, roughness: 0.35, metalness: 0.3 }), hole], 9.5, 0, 0.12, tray);
    simM.rotation.z = Math.PI / 2;
  }

  /* the bottom edge: speaker grille, USB-C, a microphone */
  const yb = -H / 2 - 0.82;
  const usb = add(new RB(8.9, 4, 3.2, 6, 1.55), hole, 0, yb + 1.6, 0); usb.castShadow = false;   /* USB-C: a pill-shaped slot */
  add(new RB(6.6, 3, 0.7, 2, 0.3), new THREE.MeshPhysicalMaterial({ color: 0x4a4f56, metalness: 1, roughness: 0.3 }), 0, yb + 1.7, 0);   /* the tongue inside */
  for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(0.55, 0.55, 1.2, 12), hole, 12 + i * 2.2, yb + 0.3, 0);
  add(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 12), hole, -12, yb + 0.3, 0);

  /* the camera module on the back, top left as you look at the back */
  const cam = new THREE.Group(); cam.position.set(W / 2 - 17, H / 2 - 18, -T / 2 - 0.05); g.add(cam);
  add(new RB(27, 27, 2.2, 4, 5), new THREE.MeshPhysicalMaterial({ color: 0x0d1838, roughness: 0.12, clearcoat: 1, envMapIntensity: 0.55 }), 0, 0, -1.0, cam);   /* the module: polished, against the frosted back */
  [[-5.8, 5.8], [-5.8, -5.8]].forEach(([x, y]) => {
    add(new THREE.CylinderGeometry(5.1, 5.1, 1.6, 40), new THREE.MeshPhysicalMaterial({ color: 0xc8ccd0, metalness: 1, roughness: 0.18 }), x, y, -2.6, cam).rotation.x = Math.PI / 2;
    add(new THREE.CylinderGeometry(4.2, 4.2, 1.7, 40), blackGlass, x, y, -2.65, cam).rotation.x = Math.PI / 2;
    add(new THREE.CylinderGeometry(1.8, 1.8, 1.75, 32), new THREE.MeshPhysicalMaterial({ color: 0x1b2a5a, roughness: 0.02, clearcoat: 1, iridescence: 0.8 }), x, y, -2.7, cam).rotation.x = Math.PI / 2;
  });
  add(new THREE.CylinderGeometry(2.2, 2.2, 0.6, 24), new THREE.MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xfff1c8, emissiveIntensity: 0.15, roughness: 0.3 }), 6, 5.8, -2.2, cam).rotation.x = Math.PI / 2;
  add(new THREE.CylinderGeometry(0.6, 0.6, 0.6, 12), hole, 6, -2, -2.2, cam).rotation.x = Math.PI / 2;
  return g;

  function roundRect(w, h, r) { const s = new THREE.Shape(), a = -w / 2, b = -h / 2; s.moveTo(a + r, b); s.lineTo(-a - r, b); s.quadraticCurveTo(-a, b, -a, b + r); s.lineTo(-a, -b - r); s.quadraticCurveTo(-a, -b, -a - r, -b); s.lineTo(a + r, -b); s.quadraticCurveTo(a, -b, a, -b - r); s.lineTo(a, b + r); s.quadraticCurveTo(a, b, a + r, b); return s; }
  function fitUV(geo, w, h) { const p = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5); uv.needsUpdate = true; }
}

/* the home screen, for the model's own picture */
export function drawHome(c, w, h) {
  const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#0b1f4a"); gr.addColorStop(0.55, "#2a1258"); gr.addColorStop(1, "#0e3b2a"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
  c.fillStyle = "#ffffff"; c.font = "600 30px Arial"; c.textAlign = "left"; c.fillText("9:41", 40, 58);
  c.textAlign = "right"; c.fillText("5G", w - 120, 58);
  [0, 1, 2, 3].forEach((i) => c.fillRect(w - 112 + i * 9, 50 - i * 6, 6, 8 + i * 6));
  c.strokeStyle = "#ffffff"; c.lineWidth = 2.5; c.strokeRect(w - 70, 38, 40, 22); c.fillRect(w - 67, 41, 28, 16); c.fillRect(w - 29, 44, 4, 10);
  c.textAlign = "center"; c.font = "300 120px Arial"; c.fillText("9:41", w / 2, 250); c.font = "500 30px Arial"; c.fillText("Saturday 4 October", w / 2, 300);
  const apps = [["Phone", "#15803d"], ["Messages", "#15803d"], ["Mail", "#1d4ed8"], ["Browser", "#1d4ed8"], ["Settings", "#6b7280"], ["Camera", "#374151"], ["Photos", "#ca8a04"], ["Maps", "#15803d"], ["Calendar", "#b91c1c"], ["Clock", "#111827"], ["Teams", "#5b21b6"], ["Store", "#1e40af"], ["Files", "#1e3a8a"], ["Authenticator", "#6d28d9"], ["Notes", "#ca8a04"], ["Wallet", "#111827"]];
  apps.forEach(([n, col], i) => { const cx = 92 + (i % 4) * 119, cy = 420 + Math.floor(i / 4) * 150;
    const gg = c.createLinearGradient(0, cy - 42, 0, cy + 42); gg.addColorStop(0, col); gg.addColorStop(1, shade(col)); c.fillStyle = gg; c.beginPath(); c.roundRect(cx - 42, cy - 42, 84, 84, 22); c.fill();
    glyph(c, n, cx, cy);
    c.fillStyle = "#ffffff"; c.font = "500 19px Arial"; c.fillText(n, cx, cy + 70); });
  c.fillStyle = "rgba(255,255,255,0.16)"; c.beginPath(); c.roundRect(28, h - 170, w - 56, 120, 40); c.fill();
  [["Phone", "#15803d"], ["Messages", "#15803d"], ["Browser", "#1d4ed8"], ["Camera", "#374151"]].forEach(([n, col], i) => { const cx = 92 + i * 119, cy = h - 110; const gg = c.createLinearGradient(0, cy - 40, 0, cy + 40); gg.addColorStop(0, col); gg.addColorStop(1, shade(col)); c.fillStyle = gg; c.beginPath(); c.roundRect(cx - 40, cy - 40, 80, 80, 22); c.fill(); glyph(c, n, cx, cy); });
  c.fillStyle = "#ffffff"; c.beginPath(); c.roundRect(w / 2 - 70, h - 26, 140, 8, 4); c.fill();
}

function shade(hex) { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.round(v * 0.7); return "rgb(" + f(n >> 16) + "," + f((n >> 8) & 255) + "," + f(n & 255) + ")"; }
/* a simple white symbol for each app */
function glyph(c, n, x, y) {
  c.save(); c.translate(x, y); c.fillStyle = "#ffffff"; c.strokeStyle = "#ffffff"; c.lineWidth = 5; c.lineCap = "round"; c.lineJoin = "round";
  const P = () => c.beginPath();
  if (n === "Phone") { P(); c.moveTo(-16, -20); c.quadraticCurveTo(-24, -6, -10, 10); c.quadraticCurveTo(6, 26, 20, 18); c.lineTo(14, 8); c.lineTo(6, 12); c.quadraticCurveTo(-6, 4, -10, -6); c.lineTo(-6, -14); c.closePath(); c.fill(); }
  else if (n === "Messages") { P(); c.ellipse(0, -3, 24, 18, 0, 0, Math.PI * 2); c.fill(); P(); c.moveTo(-12, 10); c.lineTo(-18, 22); c.lineTo(-2, 13); c.fill(); }
  else if (n === "Mail") { c.strokeRect(-22, -15, 44, 30); P(); c.moveTo(-22, -15); c.lineTo(0, 4); c.lineTo(22, -15); c.stroke(); }
  else if (n === "Browser") { P(); c.arc(0, 0, 21, 0, Math.PI * 2); c.stroke(); P(); c.ellipse(0, 0, 9, 21, 0, 0, Math.PI * 2); c.stroke(); P(); c.moveTo(-21, 0); c.lineTo(21, 0); c.stroke(); }
  else if (n === "Settings") { for (let k = 0; k < 8; k++) { c.save(); c.rotate(k * Math.PI / 4); c.fillRect(-4, -24, 8, 10); c.restore(); } P(); c.arc(0, 0, 15, 0, Math.PI * 2); c.stroke(); P(); c.arc(0, 0, 5, 0, Math.PI * 2); c.fill(); }
  else if (n === "Camera") { P(); c.roundRect(-24, -12, 48, 32, 6); c.fill(); c.fillRect(-9, -18, 18, 8); c.fillStyle = "#374151"; P(); c.arc(0, 4, 10, 0, Math.PI * 2); c.fill(); c.fillStyle = "#ffffff"; P(); c.arc(0, 4, 5, 0, Math.PI * 2); c.fill(); }
  else if (n === "Photos") { for (let k = 0; k < 6; k++) { c.save(); c.rotate(k * Math.PI / 3); P(); c.ellipse(0, -12, 7, 12, 0, 0, Math.PI * 2); c.globalAlpha = 0.85; c.fill(); c.restore(); } }
  else if (n === "Maps") { P(); c.arc(0, -6, 13, Math.PI, 0); c.lineTo(0, 22); c.closePath(); c.fill(); c.fillStyle = "#15803d"; P(); c.arc(0, -6, 5, 0, Math.PI * 2); c.fill(); }
  else if (n === "Calendar") { P(); c.roundRect(-20, -18, 40, 38, 5); c.fill(); c.fillStyle = "#b91c1c"; c.fillRect(-20, -18, 40, 10); c.font = "700 22px Arial"; c.textAlign = "center"; c.fillText("4", 0, 15); }
  else if (n === "Clock") { P(); c.arc(0, 0, 21, 0, Math.PI * 2); c.stroke(); P(); c.moveTo(0, 0); c.lineTo(0, -13); c.moveTo(0, 0); c.lineTo(10, 5); c.stroke(); }
  else if (n === "Teams") { c.font = "800 38px Arial"; c.textAlign = "center"; c.fillText("T", 0, 14); }
  else if (n === "Store") { P(); c.roundRect(-18, -8, 36, 28, 4); c.fill(); P(); c.arc(0, -8, 9, Math.PI, 0); c.stroke(); }
  else if (n === "Files") { P(); c.moveTo(-22, -14); c.lineTo(-6, -14); c.lineTo(-2, -8); c.lineTo(22, -8); c.lineTo(22, 16); c.lineTo(-22, 16); c.closePath(); c.fill(); }
  else if (n === "Authenticator") { P(); c.moveTo(0, -22); c.lineTo(18, -14); c.lineTo(16, 6); c.quadraticCurveTo(10, 18, 0, 22); c.quadraticCurveTo(-10, 18, -16, 6); c.lineTo(-18, -14); c.closePath(); c.fill(); c.strokeStyle = "#6d28d9"; P(); c.moveTo(-7, 0); c.lineTo(-1, 7); c.lineTo(9, -6); c.stroke(); }
  else if (n === "Notes") { P(); c.roundRect(-17, -21, 34, 42, 4); c.fill(); c.strokeStyle = "#ca8a04"; c.lineWidth = 3; [-9, -1, 7].forEach((yy) => { P(); c.moveTo(-10, yy); c.lineTo(10, yy); c.stroke(); }); }
  else if (n === "Wallet") { P(); c.roundRect(-22, -14, 44, 30, 6); c.fill(); c.fillStyle = "#1d4ed8"; c.fillRect(-22, -6, 44, 7); }
  c.restore();
}
