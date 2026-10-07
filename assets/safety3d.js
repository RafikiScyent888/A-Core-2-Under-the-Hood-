/* =====================================================================
   Safety kit for the IT bench (Core 2, Operational procedures, "Safety
   and communication: following safety protocols and communicating
   effectively"). Generic, unbranded models; one unit is a millimetre.
   Every label is drawn as words, and the same words sit beside the 3D
   as real text in the laptop, so nothing is told by colour alone.

     buildStrapMat   an antistatic mat with its ground cord and snap, and
                     a wrist strap whose coiled cord clips to the mat
     buildSwollenLaptop  a generic laptop whose battery has swollen: the
                     base bowed, the touchpad lifted, a gap at the seam
     buildToner      a laser-printer toner cartridge on its side, a spill
                     of toner on the floor, and a toner vacuum
     buildExtinguisher(kind)  "co2" (horn, for electrical fires) or
                     "water" (hose, never on electrical equipment)
     buildUPS        a tower UPS with its display, and a surge protector
   Each returns a Group sitting on y = 0, facing +z.

   The owner approved these from their preview renders (6 October 2026:
   "Use those models"). In the labs they follow the job's state, so what
   the student does shows on the model too:
     strap   o.grounded: the mat's green cord in its EARTH point, or lying
             loose beside it; o.clipped: the strap's coiled cord on the
             mat's snap, or hanging loose from the cuff
     toner   o.spill: the powder on the floor, or gone once cleaned up
     ups     o.lcd: the display's three lines; o.chained: a second surge
             strip (the same approved strip) plugged into the first
   ===================================================================== */
export function makeKit(THREE, RB) {
  const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const mesh = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true; if (parent) parent.add(m); return m; };
  const std = (color, rough, metal) => new THREE.MeshStandardMaterial({ color: color, roughness: rough == null ? 0.6 : rough, metalness: metal || 0 });
  const label = (w, h, lines, opts) => tex(w, h, (c, W, H) => {
    opts = opts || {}; c.fillStyle = opts.bg || "#f5f5f0"; c.fillRect(0, 0, W, H);
    if (opts.band) { c.fillStyle = opts.band; c.fillRect(0, 0, W, H * 0.22); }
    c.textAlign = "center"; let y = opts.top || H * 0.16;
    lines.forEach(function (l) { c.fillStyle = l.color || "#111111"; c.font = (l.weight || 700) + " " + l.size + "px Arial"; c.fillText(l.text, W / 2, y + l.size * 0.35); y += l.size * 1.25; });
  });
  /* a coiled cord, as a helix along a path from a to b */
  const coil = (a, b, turns, radius, thick, mat) => {
    const A = new THREE.Vector3(a[0], a[1], a[2]), B = new THREE.Vector3(b[0], b[1], b[2]), dir = B.clone().sub(A), len = dir.length(); dir.normalize();
    const side = new THREE.Vector3(0, 1, 0).cross(dir).normalize(); if (side.length() < 0.1) side.set(1, 0, 0); const up = dir.clone().cross(side).normalize();
    const pts = []; const N = turns * 24;
    for (let i = 0; i <= N; i++) { const t = i / N, ang = t * turns * Math.PI * 2, sag = -Math.sin(t * Math.PI) * 6; pts.push(A.clone().add(dir.clone().multiplyScalar(t * len)).add(side.clone().multiplyScalar(Math.cos(ang) * radius)).add(up.clone().multiplyScalar(Math.sin(ang) * radius - sag))); }
    return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N * 2, thick, 8, false), mat);
  };
  const cable = (pts, thick, mat) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); })), 64, thick, 10, false), mat);

  /* ------------------------------------------- the antistatic mat and strap */
  function buildStrapMat(o) {
    o = Object.assign({ grounded: true, clipped: true }, o || {});
    const g = new THREE.Group();
    const matTex = tex(1024, 640, (c, w, h) => { c.fillStyle = "#3d5a7a"; c.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { c.fillStyle = "rgba(255,255,255," + (Math.random() * 0.05) + ")"; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } c.strokeStyle = "rgba(220,230,240,0.55)"; c.lineWidth = 3; for (let x = 40; x < w; x += 80) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } c.fillStyle = "#e8eef5"; c.font = "700 34px Arial"; c.fillText("ESD PROTECTIVE WORK SURFACE", 40, h - 34); });
    const mat = mesh(new RB(600, 3, 400, 2, 1.2), new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.85 }), 0, 1.5, 0, g);
    /* the mat's ground snap (a 10 mm stud) and its cord to the bench's ground point */
    const chrome = new THREE.MeshPhysicalMaterial({ color: 0xdfe3e8, metalness: 1, roughness: 0.18 });
    mesh(new THREE.CylinderGeometry(6, 6, 4, 24), chrome, 270, 5, -170, g);
    mesh(new THREE.CylinderGeometry(4, 4, 3, 24), chrome, 220, 4.5, -170, g);
    const green = std(0x1f7a3a, 0.5);
    /* plugged into the EARTH point, or lying loose on the bench beside it */
    g.add(cable(o.grounded ? [[270, 7, -170], [300, 10, -195], [330, 6, -230], [360, 3, -260]] : [[270, 7, -170], [300, 10, -200], [318, 4, -240], [330, 2.5, -262]], 2.4, green));
    if (!o.grounded) mesh(new THREE.CylinderGeometry(4, 4, 14, 16), std(0x1a1c20, 0.5), 334, 4, -268, g).rotation.x = Math.PI / 2;
    const gp = mesh(new RB(40, 30, 14, 2, 3), std(0xe8e4d8, 0.5), 375, 15, -268, g);
    const gpl = label(256, 192, [{ text: "⏚", size: 72 }, { text: "EARTH", size: 34 }], { bg: "#f2efe4" });
    mesh(new THREE.PlaneGeometry(36, 26), new THREE.MeshStandardMaterial({ map: gpl, roughness: 0.6 }), 375, 15, -260.8, g);
    /* the wrist strap: an elastic band with a stainless plate, lying open on the mat */
    const bandGeo = new THREE.CylinderGeometry(32, 32, 26, 48, 1, true); const band = new THREE.Mesh(bandGeo, new THREE.MeshStandardMaterial({ color: 0x24272d, roughness: 0.9, side: THREE.DoubleSide })); band.position.set(-170, 35, 60); band.rotation.z = Math.PI / 2; band.castShadow = true; g.add(band);
    const plate = mesh(new RB(10, 22, 30, 2, 3), chrome, -170, 35, 93, g); plate.rotation.x = Math.PI / 2;
    mesh(new THREE.SphereGeometry(6, 16, 12), chrome, -170, 35, 101, g);
    /* the coiled cord from the strap to the mat's second snap, with its 1 MΩ resistor moulding */
    const blackCord = std(0x15171a, 0.6);
    if (o.clipped) {
      const cc = coil([-170, 35, 104], [190, 14, -150], 30, 9, 2.4, blackCord); cc.castShadow = true; g.add(cc);
      mesh(new THREE.CylinderGeometry(4.5, 4.5, 26, 16), std(0x1d2026, 0.5), 205, 8, -162, g).rotation.z = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(5, 5, 6, 20), chrome, 219, 7, -170, g);
    } else {
      /* not clipped: the coiled cord ends loose on the mat, its clip in the air */
      const cc = coil([-170, 35, 104], [-20, 12, 150], 12, 9, 2.4, blackCord); cc.castShadow = true; g.add(cc);
      mesh(new THREE.CylinderGeometry(4.5, 4.5, 26, 16), std(0x1d2026, 0.5), -2, 8, 152, g).rotation.z = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(5, 5, 6, 20), chrome, 14, 7, 152, g);
    }
    return g;
  }

  /* -------------------------------------------- a laptop, battery swollen */
  function buildSwollenLaptop() {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const W = 340, D = 235, T = 18, UP = 13, DOWN = 11;
    const shell = std(0x4a4f57, 0.45, 0.4), glass = new THREE.MeshPhysicalMaterial({ color: 0x0b0d10, roughness: 0.08, clearcoat: 1 });
    /* how far the battery has pushed the case at a point: most in the
       middle, still plain to see at the sides */
    const bow = (x, z) => Math.max(0, 1 - 0.5 * Math.pow(x / (W / 2), 2)) * Math.max(0, 1 - Math.pow((z - 10) / (D * 0.52), 2));
    const bend = (geo, top, bottom, dy) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = bow(x, z); p.setY(i, y + (y > 0 ? f * top : -f * bottom) + (dy || 0)); } geo.computeVertexNormals(); return geo; };
    /* the base: top domed up, bottom bowed down, so it rocks on its middle */
    mesh(bend(new RB(W, T, D, 12, 5), UP, DOWN), shell, 0, T / 2 + DOWN, 0, body);
    /* the rubber feet, held off the bench by the bulge */
    [[-140, -85], [140, -85], [-140, 85], [140, 85]].forEach(function (p) { mesh(new THREE.CylinderGeometry(7, 7, 2.5, 16), std(0x111111, 0.95), p[0], DOWN - bow(p[0], p[1]) * DOWN - 1.2, p[1], body); });
    /* the keyboard deck and touchpad sit on the domed top, following it */
    const kb = tex(1024, 360, (c, w, h) => { c.fillStyle = "#16181c"; c.fillRect(0, 0, w, h); c.fillStyle = "#2a2e35"; for (let r = 0; r < 6; r++) for (let k = 0; k < 15; k++) c.fillRect(10 + k * 67, 10 + r * 58, 60, 50); });
    const deckGeo = new THREE.PlaneGeometry(290, 102, 40, 16); deckGeo.rotateX(-Math.PI / 2); deckGeo.translate(0, 0, -45);
    { const p = deckGeo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, bow(p.getX(i), p.getZ(i)) * UP + 0.4); deckGeo.computeVertexNormals(); }
    mesh(deckGeo, new THREE.MeshStandardMaterial({ map: kb, roughness: 0.7 }), 0, T + DOWN, 0, body);
    /* the touchpad, pushed up out of its frame and tilted by the battery under it */
    const tp = mesh(new RB(110, 2.4, 70, 1, 1.5), new THREE.MeshPhysicalMaterial({ color: 0x3a3f47, roughness: 0.25, clearcoat: 0.6 }), 0, T + DOWN + bow(0, 62) * UP + 5, 62, body); tp.rotation.x = -0.14; tp.rotation.z = 0.04;
    /* the seam at the front edge, split open into a dark gap */
    const gap = mesh(new THREE.BoxGeometry(250, 4, 3), new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 1 }), 0, T / 2 + DOWN + bow(0, D / 2) * 2, D / 2 + 0.5, body);
    /* the lid, open on the hinge at the back */
    const lid = new THREE.Group(); lid.position.set(0, T + DOWN + bow(0, -D / 2) * UP + 2, -D / 2 + 4); lid.rotation.x = -0.32; body.add(lid);
    mesh(new RB(W, 222, 6, 3, 5), shell, 0, 111, 0, lid);
    mesh(new THREE.PlaneGeometry(W - 22, 200), glass, 0, 113, 3.2, lid);
    /* rocking on its middle: tipped a little towards the front */
    body.rotation.x = 0.035;
    return g;
  }

  /* ------------------------------------------- a toner spill, and its vacuum */
  function buildToner(o) {
    o = Object.assign({ spill: true }, o || {});
    const g = new THREE.Group();
    const black = std(0x16181b, 0.55), grey = std(0x8b9097, 0.5);
    /* the cartridge, on its side: a long body, a handle, the drum shutter */
    const cart = new THREE.Group(); cart.position.set(-60, 0, 0); cart.rotation.y = 0.35; g.add(cart);
    mesh(new RB(330, 78, 96, 3, 10), black, 0, 39, 0, cart);
    mesh(new RB(300, 8, 30, 2, 3), grey, 0, 80, -18, cart);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(26, 5, 10, 24, Math.PI), black); handle.position.set(165, 40, 0); handle.rotation.y = Math.PI / 2; cart.add(handle);
    const ctl = label(768, 192, [{ text: "TONER CARTRIDGE · BLACK", size: 52 }, { text: "See the Safety Data Sheet", size: 40, weight: 500 }], { bg: "#e9e9e9", top: 40 });
    mesh(new THREE.PlaneGeometry(200, 50), new THREE.MeshStandardMaterial({ map: ctl, roughness: 0.7 }), 40, 46, 48.2, cart);
    /* the spill: fine black powder in a fan across the floor */
    const spill = tex(1024, 1024, (c, w, h) => { c.clearRect(0, 0, w, h); for (let i = 0; i < 26000; i++) { const a = Math.random() * Math.PI * 0.9 - 0.2, r = Math.pow(Math.random(), 1.7) * 470; const x = 240 + Math.cos(a) * r, y = 520 + Math.sin(a) * r * 0.75; c.fillStyle = "rgba(8,8,10," + (0.25 + Math.random() * 0.6) * (1 - r / 520) + ")"; c.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3); } });
    const sp = mesh(new THREE.PlaneGeometry(520, 520), new THREE.MeshStandardMaterial({ map: spill, transparent: true, roughness: 1, depthWrite: false }), 120, 0.6, 60, g); sp.rotation.x = -Math.PI / 2; sp.castShadow = false; sp.visible = !!o.spill;
    /* the toner vacuum: a small canister with a filter cap, a hose and a wand */
    const vac = new THREE.Group(); vac.position.set(330, 0, -120); g.add(vac);
    const body = std(0x2c4a6b, 0.4);
    mesh(new THREE.CylinderGeometry(70, 76, 190, 40), body, 0, 95, 0, vac);
    mesh(new THREE.CylinderGeometry(72, 72, 26, 40), std(0x20242a, 0.5), 0, 203, 0, vac);
    const vl = label(512, 256, [{ text: "TONER VACUUM", size: 52 }, { text: "fine-particle filter", size: 34, weight: 500 }, { text: "for toner spills only", size: 34, weight: 500 }], { bg: "#f2f2ee", top: 40 });
    const vlab = new THREE.Mesh(new THREE.CylinderGeometry(76.5, 76.5, 80, 40, 1, true, -0.75, 1.5), new THREE.MeshStandardMaterial({ map: vl, roughness: 0.6 })); vlab.position.set(0, 110, 0); vac.add(vlab);
    vac.add(cable([[-60, 60, 50], [-110, 40, 140], [-160, 25, 230], [-200, 22, 250]], 9, std(0x22262c, 0.6)));
    mesh(new THREE.CylinderGeometry(9, 9, 260, 16), grey, -320, 20, 240, vac).rotation.z = Math.PI / 2;
    return g;
  }

  /* ---------------------------------------------------- fire extinguishers */
  function buildExtinguisher(kind) {
    const g = new THREE.Group(); const co2 = kind === "co2";
    const red = new THREE.MeshPhysicalMaterial({ color: 0xb3121b, roughness: 0.28, clearcoat: 0.8 });
    const steel = new THREE.MeshPhysicalMaterial({ color: 0xd0d4d9, metalness: 1, roughness: 0.25 }), black = std(0x141518, 0.55);
    const H = co2 ? 560 : 600, R = co2 ? 70 : 80;
    const prof = [new THREE.Vector2(0, 0), new THREE.Vector2(R - 10, 0)];
    for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; prof.push(new THREE.Vector2(R - 10 + Math.sin(a) * 10, 10 - Math.cos(a) * 10)); }
    prof.push(new THREE.Vector2(R, H - R * 0.9));
    for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI / 2; prof.push(new THREE.Vector2(Math.max(22, Math.cos(a) * R), H - R * 0.9 + Math.sin(a) * R * 0.9)); }
    prof.push(new THREE.Vector2(0, H));
    mesh(new THREE.LatheGeometry(prof, 48), red, 0, 0, 0, g);
    /* the band and label, in words: what it's for, and what it's never for */
    const lab = label(512, 820, co2
      ? [{ text: "CO₂", size: 120 }]
      : [{ text: "WATER", size: 104 }, { text: "Class A:", size: 46, weight: 500 }, { text: "wood, paper,", size: 46, weight: 500 }, { text: "cloth", size: 46, weight: 500 }, { text: "", size: 30 }, { text: "NEVER on", size: 56 }, { text: "electrical", size: 56 }, { text: "equipment", size: 56 }],
      { bg: co2 ? "#111111" : "#f4f1e8", top: 90 });
    const wrap = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.8, R + 0.8, H * 0.5, 48, 1, true, -0.75, 1.5), new THREE.MeshStandardMaterial({ map: lab, roughness: 0.6 })); wrap.position.y = H * 0.48; g.add(wrap);
    if (co2) { const mt = wrap.material; mt.map = label(512, 820, [{ text: "CO₂", size: 120, color: "#ffffff" }, { text: "CARBON", size: 50, color: "#ffffff" }, { text: "DIOXIDE", size: 50, color: "#ffffff" }, { text: "", size: 30 }, { text: "Electrical", size: 50, weight: 500, color: "#ffffff" }, { text: "fires and", size: 50, weight: 500, color: "#ffffff" }, { text: "flammable", size: 50, weight: 500, color: "#ffffff" }, { text: "liquids", size: 50, weight: 500, color: "#ffffff" }], { bg: "#111111", top: 90 }); }
    /* the valve, handle, pin and gauge (water) or the horn (CO2) */
    mesh(new THREE.CylinderGeometry(20, 24, 40, 24), steel, 0, H + 28, 0, g);
    const lever = mesh(new RB(110, 8, 22, 2, 3), black, 30, H + 58, 0, g); lever.rotation.z = -0.25;
    mesh(new RB(100, 7, 20, 2, 3), black, 30, H + 40, 0, g).rotation.z = -0.05;
    const pin = new THREE.Mesh(new THREE.TorusGeometry(12, 2, 8, 24), steel); pin.position.set(-10, H + 46, 22); g.add(pin);
    if (co2) {
      g.add(cable([[18, H + 28, 0], [70, H - 20, 40], [95, H - 160, 60]], 7, black));
      const horn = mesh(new THREE.CylinderGeometry(42, 12, 170, 28, 1, true), black, 100, H - 250, 62, g); horn.material.side = THREE.DoubleSide;
    } else {
      mesh(new THREE.CylinderGeometry(18, 18, 8, 24), steel, -24, H + 28, 18, g).rotation.x = Math.PI / 2;
      g.add(cable([[18, H + 28, 0], [80, H - 40, 30], [95, H - 300, 60]], 6, black));
    }
    return g;
  }

  /* ------------------------------------------ a UPS, and a surge protector */
  function buildUPS(o) {
    o = Object.assign({ lcd: ["ONLINE", "Battery 100%", "Load 38%  · 14 min"], chained: false }, o || {});
    const g = new THREE.Group();
    const black = std(0x1b1d22, 0.5), grey = std(0x2c3038, 0.45);
    const ups = new THREE.Group(); ups.position.set(-120, 0, 0); g.add(ups);
    mesh(new RB(170, 300, 440, 4, 10), black, 0, 150, 0, ups);
    /* front panel: the display, the power button, the vents */
    const lcd = tex(512, 256, (c, w, h) => { c.fillStyle = "#0e2416"; c.fillRect(0, 0, w, h); c.fillStyle = "#b7f5c8"; c.font = "700 46px Arial"; c.fillText(o.lcd[0] || "", 26, 70); c.font = "600 34px Arial"; c.fillText(o.lcd[1] || "", 26, 130); c.fillText(o.lcd[2] || "", 26, 185); });
    mesh(new THREE.PlaneGeometry(110, 55), new THREE.MeshBasicMaterial({ map: lcd, toneMapped: false }), 0, 230, 220.8, ups);
    mesh(new THREE.CylinderGeometry(11, 11, 4, 24), grey, 0, 170, 221, ups).rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) mesh(new THREE.BoxGeometry(120, 3, 2), std(0x0c0d10, 0.9), 0, 25 + i * 11, 221, ups);
    const ul = label(512, 160, [{ text: "UPS · 1500 VA", size: 52 }, { text: "uninterruptible power supply", size: 30, weight: 500 }], { bg: "#e6e6e3", top: 40 });
    mesh(new THREE.PlaneGeometry(150, 47), new THREE.MeshStandardMaterial({ map: ul, roughness: 0.6 }), 0, 125, 221, ups);
    /* the surge protector strip beside it, its switch lit */
    const strip = new THREE.Group(); strip.position.set(130, 0, 120); strip.rotation.y = -0.5; g.add(strip);
    mesh(new RB(320, 42, 62, 3, 8), std(0xe9e9e6, 0.4), 0, 21, 0, strip);
    for (let i = 0; i < 6; i++) { const s = mesh(new RB(30, 3, 36, 1, 3), std(0x2a2c30, 0.6), -110 + i * 42, 42.5, 0, strip); }
    mesh(new RB(22, 8, 30, 2, 3), new THREE.MeshStandardMaterial({ color: 0xc81e1e, emissive: 0x7a0a0a, roughness: 0.4 }), 145, 44, 0, strip);
    const sl = label(1024, 112, [{ text: "SURGE PROTECTOR · no battery", size: 56 }], { bg: "#e9e9e6", top: 42 });
    mesh(new THREE.PlaneGeometry(260, 28), new THREE.MeshStandardMaterial({ map: sl, roughness: 0.6 }), -20, 21, 31.2, strip);
    strip.add(cable([[-160, 21, 0], [-230, 10, -40], [-300, 4, -10]], 4, std(0x22252b, 0.6)));
    /* a second strip plugged into the first: a daisy chain */
    if (o.chained) {
      const s2 = new THREE.Group(); s2.position.set(250, 0, 330); s2.rotation.y = -0.15; g.add(s2);
      mesh(new RB(320, 42, 62, 3, 8), std(0xe9e9e6, 0.4), 0, 21, 0, s2);
      for (let i = 0; i < 6; i++) mesh(new RB(30, 3, 36, 1, 3), std(0x2a2c30, 0.6), -110 + i * 42, 42.5, 0, s2);
      mesh(new RB(22, 8, 30, 2, 3), new THREE.MeshStandardMaterial({ color: 0xc81e1e, emissive: 0x7a0a0a, roughness: 0.4 }), 145, 44, 0, s2);
      mesh(new THREE.PlaneGeometry(260, 28), new THREE.MeshStandardMaterial({ map: sl, roughness: 0.6 }), -20, 21, 31.2, s2);
      /* its cord runs back and plugs into an outlet on the first strip */
      g.add(cable([[92, 21, 306], [60, 8, 262], [118, 10, 205], [172, 38, 160], [181, 49, 149]], 4, std(0x22252b, 0.6)));
      const plug = mesh(new RB(24, 16, 26, 2, 3), std(0x1d2026, 0.5), 181, 51, 148, g); plug.rotation.y = -0.5;
    }
    return g;
  }

  return { buildStrapMat: buildStrapMat, buildSwollenLaptop: buildSwollenLaptop, buildToner: buildToner, buildExtinguisher: buildExtinguisher, buildUPS: buildUPS };
}
