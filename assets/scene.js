/* =====================================================================
   Field Service Center — the scene engine

   This file draws things. It does not decide anything, it does not grade
   anything, and nothing in the build depends on it running. That is
   deliberate and it is the whole design rule for this layer.

   Some of the students using this have damaged eyesight. A WebGL canvas is
   an opaque rectangle to a screen reader, it does not reflow when the
   browser is zoomed, and the contrast of a lit surface is a function of the
   lighting rather than a token you can guarantee. So the model is never the
   control. Every part in every model exists first as a real, labelled,
   focusable button in ordinary HTML, and the canvas is a second view of the
   same state that happens to be nicer to look at. Turn WebGL off, zoom to
   400%, or drive the whole thing from the keyboard and nothing is lost
   except the picture.

   ---------------------------------------------------------------------
   Version two: parts are built, not boxed.

   The first cut drew one primitive per part, which is why a computer looked
   like a pile of blocks. A part is now a LIST of primitives — a cooler is a
   fin stack and a shroud and a hub and seven blades and four mounting posts
   — merged into a single geometry so that detail costs vertices rather than
   draw calls. Fourteen parts stay fourteen draw calls however much is in
   them.

   Two things make that authorable. `repeat` and `ring` expand one
   description into forty fins or seven fan blades, so nobody hand-writes
   forty boxes. And `shade` varies tone WITHIN a part through vertex colours,
   while the part's actual colour lives on the material — so selection can
   still tint the whole thing at once without flattening its internal
   shading.

   Materials WERE deliberately matte, on the argument that glossy highlights
   look better in a screenshot and take legibility away from exactly the
   people this was built for. That has been reversed on purpose: a student
   asked to find a bulged cell, a scorched trace or a glazed roller needs
   the part to look like the material it is made of, and a uniformly matte
   world hides the very cues that say "this one is wrong". Two things keep
   the trade honest — the environment is a soft room rather than a bare
   bulb, so highlights are broad instead of pinpoint, and tone mapping rolls
   the top end off instead of clipping it, because a blown white speck is
   the thing that actually hurts to look at.
   ===================================================================== */

import * as THREE from "./three.module.min.js";
import { expand } from "./shape.js";
import { surface, isPrinted, isDecal, onTileReady } from "./surface.js";

/* Can this browser actually do it? Called before anything is built, so a
   machine with WebGL disabled never sees a dead grey box.

   ASKED ONCE, AND THAT MATTERS MORE THAN IT LOOKS. The probe creates a
   real WebGL context to answer the question, and `drawScene` called it on
   every single redraw — so after the bench stopped leaking a context per
   action, the CAPABILITY CHECK was still making one, and the count barely
   moved. Twenty actions, twenty probe contexts.

   It was found by capturing a stack at `getContext` rather than by
   reasoning about which of three candidates it was; two rounds had
   already gone on the wrong suspect. Whether this browser supports WebGL
   does not change while the page is open, so the answer is kept. */
var _supported = null;
export function sceneSupported() {
  if (_supported !== null) return _supported;
  try {
    var c = document.createElement("canvas");
    var g = window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl"));
    /* Hand the probe's own context straight back. Without this the check
       leaves one behind for the life of the page, which on a browser
       capped at sixteen is one fewer bench. */
    if (g && g.getExtension) {
      var lose = g.getExtension("WEBGL_lose_context");
      if (lose) try { lose.loseContext(); } catch (e2) {}
    }
    _supported = !!g;
  } catch (e) { _supported = false; }
  return _supported;
}

function reducedMotion() {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  catch (e) { return false; }
}

/* Read a theme token off the element the canvas actually sits in, not off
   the document root. Each of the six steps carries its own hue, which
   redefines --paper and --text locally and deliberately stays a light ground
   in both themes. Reading from :root gave a navy canvas in a cream panel. */
function token(node, name, fallback) {
  try {
    var v = getComputedStyle(node || document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch (e) { return fallback; }
}

/* =====================================================================
   Primitives

   Everything below returns a BufferGeometry centred on its own origin, so
   the caller can place it without thinking about where the shape's zero is.
   ===================================================================== */

/* A box with real chamfers. Straight BoxGeometry reads as a toy because
   nothing manufactured has a perfectly sharp edge; a 0.02–0.06 bevel is the
   single cheapest thing that makes plastic look moulded. */
/* ---------------------------------------------------------------------
   HOW SMOOTH THINGS ARE DRAWN.

   These two numbers are the difference between a model that reads as a
   diagram and one that reads as a part, and both were set far too low.

   SEG_FLOOR is the fewest sides anything ROUND is allowed. The most common
   count across the seventeen benches was 14, then 12, then 10, then 8 — and
   a cylinder at 8 sides is a visible octagon, not a curve. Screw bosses,
   lens barrels, heat pipes and rollers were all being drawn as polygons.
   The floor only applies from 8 upward, because 3, 4 and 6 are deliberate:
   the warning triangles on the battery label, a diamond on the display
   bench, and hex heads on the printer are meant to have flat sides.

   CORNER_SEGS and BEVEL_SEGS are the same problem on `rbox`, which is what
   almost every part in the build is made of. At curveSegments 3 a rounded
   corner is a chamfer with two facets in it. Real moulded and machined
   edges carry a fillet, and the highlight running along that fillet is
   most of what makes a render look like an object.

   The cost is vertices, and this is not a scene that is short of them: a
   whole bench is a few hundred primitives, where the hardware this runs on
   handles hundreds of thousands. Nothing here was ever slow.
   --------------------------------------------------------------------- */
export const QUALITY = { segFloor: 28, cornerSegs: 8, bevelSegs: 4 };

/* Round parts get lifted to the floor; deliberate polygons are left alone. */
function segs(n, dflt) {
  const v = n || dflt;
  return v >= 8 ? Math.max(QUALITY.segFloor, v) : v;
}

function roundedBox(w, h, d, r) {
  r = Math.min(r === undefined ? 0.05 : r, w / 2.5, h / 2.5, d / 2.5);
  if (r <= 0.005) return new THREE.BoxGeometry(w, h, d);
  var s = new THREE.Shape();
  var x = w / 2 - r, y = h / 2 - r;
  s.moveTo(-x, -h / 2);
  s.lineTo(x, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -y);
  s.lineTo(w / 2, y);
  s.quadraticCurveTo(w / 2, h / 2, x, h / 2);
  s.lineTo(-x, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, y);
  s.lineTo(-w / 2, -y);
  s.quadraticCurveTo(-w / 2, -h / 2, -x, -h / 2);
  var g = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.001, d - r * 2), bevelEnabled: true,
    bevelThickness: r, bevelSize: r,
    bevelSegments: QUALITY.bevelSegs, curveSegments: QUALITY.cornerSegs
  });
  g.translate(0, 0, -(d - r * 2) / 2);
  return g;
}

function makeGeo(p) {
  var s = p.size || [1, 1, 1];
  switch (p.shape) {
    case "cyl":
      return new THREE.CylinderGeometry(s[0] / 2, s[0] / 2, s[1], segs(p.seg, 20),
        1, !!p.open);
    case "cone":
      return new THREE.CylinderGeometry(s[0] / 2, s[2] / 2, s[1], segs(p.seg, 18));
    case "tube":
      /* An open cylinder with a wall — vent throats, roller sleeves, the
         inside of a fan shroud. */
      return new THREE.CylinderGeometry(s[0] / 2, s[0] / 2, s[1], segs(p.seg, 20), 1, true);
    case "torus":
      return new THREE.TorusGeometry(s[0] / 2, s[1] / 2, Math.max(12, p.seg2 || 8), segs(p.seg, 20),
        p.arc === undefined ? Math.PI * 2 : p.arc);
    case "sphere": {
      /* size is [diameter] for a ball, or [dx, dy, dz] for an ellipsoid.
         A swollen pouch cell is a dome, and a dome built out of stacked
         courses reads as a ziggurat however many courses you use — the
         steps are the shape the eye finds. dy and dz default to dx, so
         every one-element sphere already in the build is unchanged. */
      const g = new THREE.SphereGeometry(s[0] / 2, segs(p.seg, 16), segs(p.seg, 16) / 2);
      if (s.length > 1) g.scale(1, (s[1] === undefined ? s[0] : s[1]) / s[0],
                                   (s[2] === undefined ? s[0] : s[2]) / s[0]);
      return g;
    }
    case "plate":
      return new THREE.BoxGeometry(s[0], s[1], s[2]);
    case "rbox":
      return roundedBox(s[0], s[1], s[2], p.r);
    default:
      return roundedBox(s[0], s[1], s[2], p.r === undefined ? 0.03 : p.r);
  }
}

/* Merge a part's primitives into one geometry. Detail then costs vertices,
   which a GPU does not care about, instead of draw calls, which it does. */
function mergeGeos(geos) {
  var total = 0;
  if (!geos.length) {
    var empty = new THREE.BufferGeometry();
    empty.setAttribute("position", new THREE.BufferAttribute(new Float32Array(0), 3));
    empty.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(0), 3));
    empty.setAttribute("color", new THREE.BufferAttribute(new Float32Array(0), 3));
    return empty;
  }
  geos.forEach(function (g) { total += g.attributes.position.count; });
  var pos = new Float32Array(total * 3);
  var nor = new Float32Array(total * 3);
  var col = new Float32Array(total * 3);
  var anyUV = geos.some(function (g) { return !!g.attributes.uv; });
  var uvs = anyUV ? new Float32Array(total * 2) : null;
  var o = 0;
  geos.forEach(function (g) {
    var n = g.attributes.position.count;
    pos.set(g.attributes.position.array.subarray(0, n * 3), o * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array.subarray(0, n * 3), o * 3);
    col.set(g.attributes.color.array.subarray(0, n * 3), o * 3);
    if (uvs && g.attributes.uv) uvs.set(g.attributes.uv.array.subarray(0, n * 2), o * 2);
    o += n;
    g.dispose();
  });
  var out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  out.setAttribute("color", new THREE.BufferAttribute(col, 3));
  if (uvs) out.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  return out;
}

function primGeometry(p, wantUV) {
  var g = makeGeo(p);
  if (g.index) g = g.toNonIndexed();
  var m = new THREE.Matrix4();
  var e = new THREE.Euler(
    (p.rot && p.rot[0]) || 0, (p.rot && p.rot[1]) || 0, (p.rot && p.rot[2]) || 0);
  m.makeRotationFromEuler(e);
  m.setPosition((p.pos && p.pos[0]) || 0, (p.pos && p.pos[1]) || 0, (p.pos && p.pos[2]) || 0);
  g.applyMatrix4(m);
  g.computeVertexNormals();
  /* Tone varies within a part through vertex colour; the part's real colour
     stays on the material, so selecting it can retint the whole thing at
     once without losing the shading that makes it read as an object. */
  var n = g.attributes.position.count;
  var s = p.shade === undefined ? 1 : p.shade;
  var c = new Float32Array(n * 3);
  for (var i = 0; i < n * 3; i++) c[i] = s;
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));

  /* TEXTURE COORDINATES ACROSS THE WHOLE PART, not per primitive.

     Only for parts that actually carry a surface. Computing them for every
     primitive of every part cost the drill sweep 46% of its running time —
     three hundred and twenty-nine benches paying, per vertex, for a map
     that all but one of them does not have.

     A part is forty boxes merged into one mesh, and each box arrives with
     its own 0-to-1 map. Leave those alone and a surface texture restarts at
     every box — a board's copper would tile forty times over, once per
     component, which reads as wallpaper rather than as a board.

     So the coordinates are recomputed from where the piece ended up in the
     part, projected flat. The projection follows the face: a flat board is
     mapped from above, a wall from the front, so the grain runs across the
     surface a student is actually looking at instead of smearing down it. */
  if (!wantUV) return g;
  var pos = g.attributes.position.array;
  var nor = g.attributes.normal.array;
  var uv = new Float32Array(n * 2);
  var k = p.uv === undefined ? 1 : p.uv;
  for (var v = 0; v < n; v++) {
    var ax = Math.abs(nor[v * 3]), ay = Math.abs(nor[v * 3 + 1]), az = Math.abs(nor[v * 3 + 2]);
    var X, Y;
    if (ay >= ax && ay >= az) { X = pos[v * 3]; Y = pos[v * 3 + 2]; }
    else if (ax >= az) { X = pos[v * 3 + 2]; Y = pos[v * 3 + 1]; }
    else { X = pos[v * 3]; Y = pos[v * 3 + 1]; }
    uv[v * 2] = X * k;
    uv[v * 2 + 1] = Y * k;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

/* =====================================================================
   MATERIALS WITHIN ONE PART

   A cooler is a copper heatpipe, an aluminium fin stack, a black plastic
   shroud and four steel posts. All four were already drawn — the geometry
   has been there since the parts were built — but a part is one mesh with
   one colour, and the only thing a piece could vary was `shade`, a
   brightness multiplier. So every one of those four came out the same grey
   at slightly different brightness, and under soft lighting they merged
   into a ribbed block.

   That is what makes these models read as plain, and it was never a lack of
   detail. I said it was, four times over in one message, before checking:
   the capacitors already have vent scores and polarity stripes, the memory
   already has end latches and gold fingers, the cooler already has four
   heatpipes and mounting posts, the supply already has an inlet, a switch,
   vents and a cable bundle. None of it could be SEEN.

   A piece may now name a material. Pieces are grouped by it and each group
   gets its own mesh, so one part can be copper and aluminium and black
   plastic at once. Named rather than free hex, because "the heatpipes are
   copper" survives somebody moving them and "#b0703a" does not.
   ===================================================================== */
var PIECE_MATERIAL = {
  copper: { color: "#b3703c", finish: "metal" },
  alu:    { color: "#c3cad0", finish: "metal" },
  steel:  { color: "#9aa3ab", finish: "steel" },
  /* GROUND AND POLISHED SHAFT, not painted steel. `steel` above is a case
     panel; this is the bar a roller turns on, and in the owner's bench
     photograph it is the brightest thing in the frame by a wide margin —
     a hard white streak down its length with the rubber almost black
     beside it. Drawing it in `steel` made the shaft darker than the tyre,
     which is the wrong way round and is most of why the roller read as one
     moulded plastic object rather than rubber on metal. */
  polished: { color: "#c6ccd2", finish: "chrome" },
  gold:   { color: "#c9a44e", finish: "metal" },
  black:  { color: "#2c3034", finish: "plastic" },
  dark:   { color: "#4a5058", finish: "matte" },
  pale:   { color: "#d8dde1", finish: "plastic" },
  green:  { color: "#1e5340", finish: "board" }
};

/* Group a build's pieces by the material each names. Pieces that name none
   fall in the "" group and are drawn in the part's own colour, which is
   every piece in the build today — nothing changes until a piece opts in. */
function byMaterial(build) {
  var groups = {};
  (build || []).forEach(function (q) {
    var k = q.mat || "";
    if (!groups[k]) groups[k] = [];
    groups[k].push(q);
  });
  return groups;
}

/* Split a skinned part into the slab that carries the surface and the
   components fitted to it. See the note at the call site for why. */
function splitSkin(part) {
  var list = expand(part.build || []);
  if (!list.length) return { slab: list, fitted: [] };
  /* The slab is the piece covering the most ground. On a board that is the
     substrate; on a cover, the panel. */
  var area = function (q) {
    var z = q.size || [1, 1, 1];
    return (z[0] || 0) * (z[2] || z[0] || 0);
  };
  var base = list[0];
  list.forEach(function (q) { if (area(q) > area(base)) base = q; });
  var baseTop = ((base.pos && base.pos[1]) || 0) + ((base.size && base.size[1]) || 0) / 2;
  var slab = [], fit = [];
  list.forEach(function (q) {
    var bottom = ((q.pos && q.pos[1]) || 0) - ((q.size && q.size[1]) || 0) / 2;
    if (q === base || bottom < baseTop - 1e-6) slab.push(q); else fit.push(q);
  });
  return { slab: slab, fitted: fit };
}

export function buildPartGeometry(part) {
  /* AN EMPTY BUILD IS NOT A MISSING BUILD.
     This used to treat both as "no build" and fall back to drawing the
     part's overall box. That was harmless while every part either had
     pieces or had none — and became a real fault the moment pieces could be
     split out by material, because a part whose every piece named a
     material handed this an empty list and got a featureless slab the size
     of the whole part drawn over the top of its own detail. The cooler's
     fins, shroud and fan were all still there, inside a box. */
  if (part.build && !part.build.length) return mergeGeos([]);
  var compound = !!part.build;
  var list = compound
    ? part.build
    : [{ shape: part.shape, size: part.size, rot: part.rot, r: part.r }];
  var wantUV = !!part.skin;
  var g = mergeGeos(expand(list).map(function (q) { return primGeometry(q, wantUV); }));
  /* A DECAL IS MAPPED ACROSS THE PART, NOT PER WORLD UNIT.

     primGeometry lays UVs out in world coordinates, which is exactly right
     for a material: brushing is the same size whatever it is wrapped
     round, and a part twice as big gets twice as much grain. It is exactly
     wrong for a picture. A phone screen spanning five world units came out
     showing the one square unit of the image that happened to land in the
     0..1 corner, with the edge pixel smeared over the other twenty-four —
     and nothing anywhere said why.

     So when the surface is a decal, the UVs are rescaled to the part's own
     extent afterwards: the whole picture, once, across the whole part. */
  if (wantUV && isDecal(part.skin) && g.attributes.uv) {
    /* A DECAL IS PROJECTED FLAT ACROSS THE PART, ONCE, FROM ITS OWN
       THINNEST AXIS — and it is recomputed here rather than rescaled.

       primGeometry lays UVs out per FACE, projecting each one from
       whichever axis it points along: an up-facing face from world x and
       z, an x-facing face from z and y. Those are three different
       coordinate systems in one array, and the first version of this took
       a single min/max across all of them and rescaled by that.

       The battery label is what proved it wrong. Its nine strips have
       real side area, the x-facing faces contributed a U range taken from
       world Z — 5.4 units against the part's actual 3.5 of width — so the
       span came out half as big again as it should be and the part
       rendered the LEFT 65% of the texture stretched across the whole
       label. Every long line of print ran off the right-hand edge of a
       border that was comfortably inside the image, and it read as a
       layout bug for three rounds. A ruler painted into the texture is
       what finally said so.

       So: find the part's thinnest axis, which for anything a decal
       belongs on is its thickness, and map the other two straight from
       world position. One projection, no mixing, and the side faces get
       the edge of the picture, which is what clamping is for. */
    var pos2 = g.attributes.position.array;
    var n2 = pos2.length / 3;
    var lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (var v2 = 0; v2 < n2; v2++) {
      for (var a2 = 0; a2 < 3; a2++) {
        var c2 = pos2[v2 * 3 + a2];
        if (c2 < lo[a2]) lo[a2] = c2;
        if (c2 > hi[a2]) hi[a2] = c2;
      }
    }
    var ext = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
    var thin = (ext[0] <= ext[1] && ext[0] <= ext[2]) ? 0 : (ext[1] <= ext[2] ? 1 : 2);
    var au = thin === 0 ? 2 : 0;                 /* across  */
    var av = thin === 2 ? 1 : 2;                 /* along   */
    if (ext[au] > 1e-6 && ext[av] > 1e-6) {
      var uvA = g.attributes.uv.array;
      for (var w2 = 0; w2 < n2; w2++) {
        uvA[w2 * 2] = (pos2[w2 * 3 + au] - lo[au]) / ext[au];
        /* V runs the other way: an image's first row is its TOP, and the
           projected axis here increases away from the viewer. Without the
           flip the picture comes out upside down, which is the sort of
           thing that is obvious in a render and invisible in the source. */
        uvA[w2 * 2 + 1] = 1 - (pos2[w2 * 3 + av] - lo[av]) / ext[av];
      }
      g.attributes.uv.needsUpdate = true;
    }
  }
  /* A compound part is authored in whatever orientation is natural to draw
     it in — a fan as a disc in the XZ plane, say — and then turned as a
     whole into the pose the model wants. Single-primitive parts already
     carry their rotation, so they are left alone. */
  /* A part built from fixed-size primitives cannot follow a model that
     scales its layout — a small-form-factor machine moved everything closer
     together while the components stayed full size, and they jammed into one
     another. Scaling the built geometry keeps the two in step. */
  if (part.scale && part.scale !== 1) {
    g.scale(part.scale, part.scale, part.scale);
  }
  if (compound && part.rot) {
    var m = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(part.rot[0] || 0, part.rot[1] || 0, part.rot[2] || 0));
    g.applyMatrix4(m);
    g.computeVertexNormals();
  }
  return g;
}

/* FINISHES.

   These used to be flat matte on purpose, to keep specular highlights off
   the screen for students with damaged sight. The owner has since asked for
   full material realism: a technician looking for a bulged capacitor or a
   scorched trace needs the part to look like the material it is made of,
   and a uniformly matte world hides the very cues that say "this one is
   wrong". The trade is deliberate and was made with the accessibility cost
   stated.

   Two things keep it from becoming glare. Highlights are broad rather than
   pinpoint — the environment is a soft room, not a bare bulb — and tone
   mapping rolls the top end off instead of clipping it to white. A blown
   white speck is what actually hurts; a wide sheen across a plastic shell
   does not.

   `gloss` is the sheen strength, used as clearcoat on the physical
   materials so plastics and painted metal read wet-ish without the base
   colour washing out. */
const FINISH = {
  matte:   { roughness: 0.72, metalness: 0.0,  gloss: 0.10 },
  plastic: { roughness: 0.34, metalness: 0.0,  gloss: 0.55 },
  /* RUBBER IS NOT CHALK. At 0.88 there is effectively no specular left, and
     with no specular a normal map has nothing to shade — the photographed
     tyre grain measured 151,000 changed pixels and a peak delta of 60 out
     of 765, i.e. present, correct, and invisible. Real pickup rubber has a
     broad soft sheen along the crown; that sheen is the only thing that
     lets grain read at all, and it is also the thing that goes MIRROR-like
     when the tyre glazes, which is the fault students are hunting. */
  rubber:  { roughness: 0.74, metalness: 0.0,  gloss: 0.16 },
  /* METALS ARE NOT MIRRORS. At metalness 0.9 a surface has almost no colour
     of its own — it shows whatever it reflects — so against a small painted
     environment the laptop's aluminium cover and display assembly rendered
     as flat black slabs. A grey-blue part came out black and a student was
     asked to look for damage on it. Anodised aluminium and painted steel
     sit nearer 0.6, which keeps the base colour and still reads as metal. */
  metal:   { roughness: 0.38, metalness: 0.62, gloss: 0.20 },
  steel:   { roughness: 0.30, metalness: 0.75, gloss: 0.25 },
  /* Ground bar. Rough enough to keep a highlight that MOVES as the part
     turns rather than a mirror that freezes — a true mirror in a small
     painted room reflects almost nothing and comes back dark, which is the
     trap the comment on `metal` above records. */
  chrome:  { roughness: 0.13, metalness: 0.85, gloss: 0.30 },
  board:   { roughness: 0.42, metalness: 0.05, gloss: 0.45 },
  glass:   { roughness: 0.05, metalness: 0.0,  gloss: 1.00 },
  /* THE PHOTOCONDUCTOR COATING, and it needs its own finish because it is
     glossier than any plastic in this table and not glass either.

     From the owner's photographs of three new drums — one teal, one bottle
     green, one periwinkle blue: the defining thing about a fresh OPC is a
     single unbroken specular streak running the whole length of the tube.
     It looks wet. At `plastic` roughness 0.34 that streak spreads into a
     soft band and the drum reads as painted pipe, which loses the one cue
     that says at a glance whether a coating is still intact — because the
     streak is exactly what breaks up when the surface starts to go. */
  coating: { roughness: 0.14, metalness: 0.0,  gloss: 0.90 },
  /* Damage finishes. A fault has to look like a fault at a glance, so the
     surface changes as well as the shape: scorching goes dead matte and
     dark, corrosion goes chalky, leaked electrolyte goes wet and dark. */
  scorched: { roughness: 0.95, metalness: 0.0, gloss: 0.0 },
  corroded: { roughness: 0.90, metalness: 0.25, gloss: 0.0 },
  weeping:  { roughness: 0.22, metalness: 0.0, gloss: 0.80 }
};

/* A SOFT ROOM, BUILT IN CODE.

   Metal with no environment to reflect renders nearly black — turning
   metalness up without this would have made every steel part darker, not
   shinier. This paints a small gradient sky with two broad light panels
   into a canvas and lets PMREM turn it into a reflection probe. Broad
   sources on purpose: they give metals something to catch without putting a
   hard white pinpoint anywhere.

   Built in code rather than loaded, because this build fetches nothing. */
/* NOT CACHED, AND THAT IS THE POINT. It used to be held in a module-level
   variable and reused, which is the obvious optimisation and was wrong: a
   PMREM texture belongs to the renderer that made it, and every ticket
   builds a fresh bench and disposes the old renderer. From the second
   ticket onward the probe was dead, the metals had nothing to reflect, and
   the whole machine rendered darker. Measured: the first bench of a session
   came out 32 levels brighter than every one after it.

   Nobody would report that as a bug — it just looks like the second ticket
   is a different machine, which is exactly what a student is being asked to
   believe. Building it per scene costs a 256x128 canvas. */
/* The PAINTED SKY is safe to keep — it is an ordinary 2D canvas and belongs
   to no renderer. Only the probe made from it has to be per-scene. */
let SKY = null;
function roomEnvironment(renderer, THREE) {
  if (SKY) return probeFrom(SKY, renderer, THREE);
  const c = document.createElement("canvas");
  c.width = 256; c.height = 128;
  const x = c.getContext("2d");
  /* The lower half of this is what a metal part reflects when it faces down
     or away, and the first version ran it to #5d666c — near enough to black
     once tone mapping had it. A workshop has a pale bench and pale walls
     bouncing light back up; so does this. */
  const sky = x.createLinearGradient(0, 0, 0, 128);
  sky.addColorStop(0, "#ffffff");
  sky.addColorStop(0.45, "#e8eef1");
  sky.addColorStop(0.55, "#c2cace");
  sky.addColorStop(1, "#98a1a7");
  x.fillStyle = sky; x.fillRect(0, 0, 256, 128);
  /* two soft ceiling panels, the sort of light a workshop actually has */
  x.globalAlpha = 0.9;
  [[52, 16, 64, 26], [156, 12, 72, 22]].forEach(function (r) {
    const g = x.createRadialGradient(r[0] + r[2] / 2, r[1] + r[3] / 2, 2,
                                     r[0] + r[2] / 2, r[1] + r[3] / 2, r[2] / 1.4);
    g.addColorStop(0, "#ffffff"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(r[0] - 20, r[1] - 12, r[2] + 40, r[3] + 30);
  });
  SKY = c;
  return probeFrom(c, renderer, THREE);
}
function probeFrom(canvasSky, renderer, THREE) {
  const tex = new THREE.CanvasTexture(canvasSky);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose(); tex.dispose();
  return env;
}

/* ---------------------------------------------------------------------
   mountScene(host, spec, opts)
   --------------------------------------------------------------------- */
export function mountScene(host, spec, opts) {
  opts = opts || {};
  var W = host.clientWidth || 640;
  var H = opts.height || 340;

  var renderer, scene, camera, raf = 0, dead = false;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  /* Roll the top end off rather than clipping it. A clipped highlight is a
     blown white speck, which is the thing that actually hurts to look at;
     tone mapping keeps the sheen and takes the sting out of it. */
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  /* Soft-edged shadows. The hard default draws a stair-stepped outline that
     a student with damaged sight reads as a feature ON the part rather than
     a shadow under it — the opposite of the point. */
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(W, H, false);
  var canvas = renderer.domElement;
  canvas.style.width = "100%";
  canvas.style.height = H + "px";
  canvas.style.display = "block";
  canvas.style.touchAction = "none";
  /* The canvas is scenery. The buttons beside it are the interface. */
  canvas.setAttribute("aria-hidden", "true");
  canvas.tabIndex = -1;
  host.appendChild(canvas);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(token(host, "--paper", "#eceff0"));
  /* What the metals reflect. Without this, metalness renders black. */
  try { scene.environment = roomEnvironment(renderer, THREE); } catch (e) { /* no PMREM */ }

  camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 300);

  /* Lighting flat enough that every face stays legible, with just enough
     direction that edges read. A dramatic key light photographs well and
     hides half the model from someone on a laptop in a bright room. */
  /* REBALANCED FOR THE ENVIRONMENT. These four were tuned when there was no
     environment map and they were the only light in the scene. Adding a
     reflection probe on top lit everything twice: the first render after the
     materials change came out pale and chalky, with the colour washed out of
     the board and the sockets — brighter, but carrying LESS information than
     the matte version it replaced. The probe now carries the ambient and
     these just shape it. */
  /* Then rebalanced again, because the first rebalance overcorrected: dark
     parts went to black and the exploded laptop read as four silhouettes.
     Legibility of every face is the requirement that outranks the look. */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa8b2b8, 0.26));
  var key = new THREE.DirectionalLight(0xffffff, 0.95);
  key.position.set(7, 12, 9);
  /* The one light that casts. The frustum is sized for the widest bench
     here rather than fitted per scene: a shadow camera too small crops the
     shadow with a hard straight edge across the board, which reads as a
     seam in the bench and is a far worse artefact than a slightly soft
     shadow. Bias is negative and small — the classic acne-versus-peter-
     panning trade, tuned on the roller, whose thin shaft is the hardest
     case in the set because it is barely wider than one shadow texel. */
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 90;
  key.shadow.camera.left = -34;
  key.shadow.camera.right = 34;
  key.shadow.camera.top = 34;
  key.shadow.camera.bottom = -34;
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.03;
  scene.add(key);
  var fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(-8, 5, -7);
  scene.add(fill);
  var rim = new THREE.DirectionalLight(0xffffff, 0.34);
  rim.position.set(0, -6, 4);
  scene.add(rim);

  var root = new THREE.Group();
  scene.add(root);

  var meshes = {}, pickable = [], baseColor = {}, edges = {}, harm = {}, fitted = {}, sub = {};
  var baseGlow = {};

  /* `glow` is how much of its own colour a part EMITS, 0 to about 1.6.

     Added for the storage bench, where the whole interface is eight status
     lamps about four millimetres across. Painted plastic lit by the scene
     lights is the wrong model for an LED: tone mapping rolls the top end
     off, the lamp ends up the same brightness as the caddy around it, and
     the one thing on the chassis a student with damaged sight has to find
     from across a room is the thing that does not stand out.

     Backwards compatible on purpose — a part with no `glow` gets exactly
     the material it got before, so this can be reconciled with the Field
     Service Center's copy of the engine with nothing to compare. */
  function partMaterial(color, finish, skin, seed, glow) {
    var f = FINISH[finish || "plastic"] || FINISH.plastic;
    var opts = {
      clearcoat: f.gloss || 0,
      clearcoatRoughness: Math.max(0.04, (f.roughness || 0.5) * 0.5),
      envMapIntensity: 0.42,
      color: new THREE.Color(color || "#7a8a95"),
      vertexColors: true, roughness: f.roughness, metalness: f.metalness
    };
    /* A painted surface, when the part asks for one: a copper layer and
       silkscreen on a board, drawn grain on aluminium, pebble on a moulding.
       The map carries the colour, so the material's own colour goes white
       and lets it through — and selection, which retints the material, still
       works because it multiplies rather than replaces. */
    /* A part may name a surface as a plain string, or as an object when the
       surface needs data from the ticket — a drive label carrying the
       capacity this ticket generated, rather than a capacity typed twice. */
    var name = skin && skin.kind ? skin.kind : skin;
    var sk = name ? surface(name, THREE, 0, seed, skin && skin.kind ? skin : null) : null;
    if (sk) {
      opts.map = sk.map;
      opts.normalMap = sk.normalMap;
      /* Relief is stronger on printed detail, where it is copper standing
         off a mask, than on material grain, where too much of it turns a
         moulding into gravel. */
      /* A tile may set its own, because "printed or not" is too coarse a
         question. Generated grain is drawn at whatever strength suits it
         and 0.28 keeps a moulding from turning to gravel; a PHOTOGRAPHED
         normal map is already the true relief of the real material and
         wants close to full strength, or the thing that was measured off
         the part gets flattened back out on the way in. */
      var rel = sk.relief !== undefined ? sk.relief : (sk.printed ? 0.6 : 0.28);
      opts.normalScale = new THREE.Vector2(rel, rel);
      /* A PRINTED surface has its own colour and replaces the part's. A
         MATERIAL GRAIN is near-white and multiplies over it, so a black
         keyboard keeps its black and gains a moulding texture. Treating
         both the same turned every moulded part into grey gravel. */
      if (sk.printed) opts.color = new THREE.Color("#ffffff");
    }
    if (glow) {
      opts.emissive = new THREE.Color(color || "#ffffff");
      opts.emissiveIntensity = glow;
      /* A lamp is a lens, not a painted surface: smooth, and it must not
         take a metallic tint from the room or the colour goes muddy. */
      opts.roughness = Math.min(opts.roughness, 0.18);
      opts.metalness = 0;
    }
    return new THREE.MeshPhysicalMaterial(opts);
  }

  function rebuild() {
    while (root.children.length) {
      var c = root.children.pop();
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    }
    meshes = {}; pickable = []; baseColor = {}; edges = {}; harm = {}; fitted = {}; sub = {};
    baseGlow = {};

    if (spec.board) {
      var b = spec.board;
      /* The board can carry a SKIN now. It could not before, and the
         reason it needs to is that the surface a thing stands on is part
         of what the thing is: a monitor on a wooden desk and a monitor on
         an anti-static mat are two different pictures, and only one of
         them is what a student has at home. Skinned boards need UVs, so
         the skin is passed into the geometry builder rather than only
         into the material. */
      var bg = buildPartGeometry({ shape: b.shape || "box", size: b.size, r: 0.06, skin: b.skin });
      var bm = new THREE.Mesh(bg, b.skin
        ? partMaterial(b.color || "#7c868e", b.finish || "matte", b.skin, spec.seed, 0)
        : new THREE.MeshStandardMaterial({
        color: new THREE.Color(b.color || "#7c868e"),
        vertexColors: true, roughness: 0.9, metalness: 0.05
      }));
      bm.position.set(b.pos[0], b.pos[1], b.pos[2]);
      root.add(bm);
    }

    (spec.decor || []).forEach(function (d) {
      var dg = buildPartGeometry(d);
      var dm = new THREE.Mesh(dg, new THREE.MeshStandardMaterial({
        color: new THREE.Color(d.color || "#5c6873"),
        vertexColors: true, roughness: 0.8, metalness: 0.05
      }));
      dm.position.set(d.pos[0], d.pos[1], d.pos[2]);
      root.add(dm);
    });

    function addMaterialMesh(p, mk, pieces) {
      var def = PIECE_MATERIAL[mk];
      if (!def) {
        throw new Error('scene: a piece of "' + p.key + '" is made of "' + mk +
          '", which is not a material. Add it to PIECE_MATERIAL in scene.js.');
      }
      var gg = buildPartGeometry(Object.assign({}, p, { build: pieces, skin: null }));
      var gm = new THREE.Mesh(gg, partMaterial(def.color, def.finish));
      gm.position.set(p.pos[0], p.pos[1], p.pos[2]);
      gm.userData.key = p.key;
      root.add(gm);
      pickable.push(gm);
      if (!sub[p.key]) sub[p.key] = [];
      /* Its own colour is remembered so deselecting puts it back, rather
         than leaving every copper heatpipe teal for the rest of the run. */
      sub[p.key].push({ mesh: gm, base: new THREE.Color(def.color) });
    }

    (spec.parts || []).forEach(function (p) {
      /* A SURFACE BELONGS TO THE SUBSTRATE, NOT TO WHAT IS BOLTED TO IT.
         The first render of the textured board put copper traces and
         silkscreen across the capacitors, the heatsink and the connectors
         too, because a part is one merged mesh and the map covers all of it.
         So a skinned part is split: the slab the components sit on gets the
         surface, and everything standing proud of it is drawn plain.
         The split is DERIVED — the slab is the piece with the largest
         footprint, and a component is anything whose underside is above the
         top of it — rather than hand-tagged, because a list of which pieces
         are components is a list that stops matching the model. */
      var split = p.skin ? splitSkin(p) : null;
      var main = split ? split.slab : (p.build || null);

      /* One mesh per material named inside the part. The unnamed group is
         the part itself and carries its skin, its colour and its identity;
         the named ones are the copper, the aluminium, the steel. */
      var groups = byMaterial(main);
      var plain = groups[""] || [];
      delete groups[""];

      var geo = buildPartGeometry(main ? Object.assign({}, p, { build: plain }) : p);
      var mat = partMaterial(p.color, p.finish, p.skin, spec.seed, p.glow);
      var m = new THREE.Mesh(geo, mat);
      m.position.set(p.pos[0], p.pos[1], p.pos[2]);
      m.userData.key = p.key;
      root.add(m);
      meshes[p.key] = m;
      baseColor[p.key] = new THREE.Color(isPrinted(p.skin) ? "#ffffff" : (p.color || "#7a8a95"));
      /* A lamp keeps glowing while it is selected. The flash below used to
         copy over emissive every frame, which would switch an LED off the
         moment the student touched it. */
      baseGlow[p.key] = p.glow
        ? new THREE.Color(p.color || "#ffffff").multiplyScalar(Math.min(1, p.glow))
        : null;
      pickable.push(m);

      Object.keys(groups).forEach(function (mk) { addMaterialMesh(p, mk, groups[mk]); });

      if (split && split.fitted.length) {
        var fgroups = byMaterial(split.fitted);
        var fplain = fgroups[""] || [];
        delete fgroups[""];
        if (fplain.length) {
          var fg = buildPartGeometry(Object.assign({}, p, { build: fplain, skin: null }));
          var fm = new THREE.Mesh(fg, partMaterial(p.color, p.finish));
          fm.position.set(p.pos[0], p.pos[1], p.pos[2]);
          fm.userData.key = p.key;
          root.add(fm);
          fitted[p.key] = fm;
          pickable.push(fm);
        }
        Object.keys(fgroups).forEach(function (mk) { addMaterialMesh(p, mk, fgroups[mk]); });
      }

      /* DAMAGE IS LOCAL. It used to be a repaint: a fault recoloured the
         whole part, so a scorched mainboard came out brown from edge to
         edge. That is not what burnt looks like and it destroyed the very
         cue it was meant to add — a healthy green board with a black patch
         on it is the picture a technician is trained to read.
         A part is one merged mesh with one colour, so the damage cannot
         live inside it. It gets its own mesh in the same place, with its
         own material, answering to the same part key when clicked. */
      if (p.harm && p.harm.length) {
        /* The skin goes in on BOTH sides. `buildPartGeometry` only computes
           UVs when it is told the part is skinned, so passing the surface to
           the material and not to the geometry hangs a photograph on a mesh
           with nowhere to put it. */
        var hg = buildPartGeometry({ build: p.harm, scale: p.scale, rot: p.rot,
                                     skin: p.harmSkin || null });
        var hm = new THREE.Mesh(hg, partMaterial(p.harmColor || "#2a1d14",
                                                 p.harmFinish || "matte",
                                                 p.harmSkin || null, 0));
        hm.position.set(p.pos[0], p.pos[1], p.pos[2]);
        hm.userData.key = p.key;
        root.add(hm);
        harm[p.key] = hm;
        pickable.push(hm);
      }

      /* A wire cage over each part. Edges survive being small, being zoomed,
         and being looked at by someone whose colour discrimination is not
         what it was. Built from the part's own silhouette so it follows the
         detail rather than boxing it. */
      var eg = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo, 32),
        new THREE.LineBasicMaterial({
          color: new THREE.Color(token(host, "--text", "#10161f")),
          transparent: true, opacity: 0.28
        })
      );
      eg.position.copy(m.position);
      eg.userData.edgeFor = p.key;
      root.add(eg);
      edges[p.key] = eg;
    });

    /* WHAT MAKES A PART SIT ON THE BENCH RATHER THAN FLOAT OVER IT.

       Every material in here was already physically based — roughness,
       metalness, a room probe, filmic tone mapping — and the models still
       read as toys. The missing thing was not detail. It was that nothing
       cast a shadow, so no part was anywhere: a roller and its board were
       two pictures at the same depth, and the eye reads that as plastic
       toys on a screen however good the rubber is.

       One caster, the key. A second shadowing light doubles the cost and
       gives every part two shadows, which is worse than none — real bench
       light comes from a window and a ceiling, and only one of them wins.

       Set here rather than at mesh creation because there are five places
       that make meshes (main, fitted, sub-parts, harm, the board) and when
       this was done per-site it was missed in two of them — the failure
       mode of every rule that has to be remembered five times. */
    root.traverse(function (o) {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
    });
  }
  rebuild();

  /* ---- camera ---- */
  var cam = spec.camera || {};
  var yaw = cam.yaw === undefined ? 0.62 : cam.yaw;
  var pitch = cam.pitch === undefined ? 0.5 : cam.pitch;
  var dist = cam.dist === undefined ? 14 : cam.dist;
  var home = { yaw: yaw, pitch: pitch, dist: dist };
  var target = new THREE.Vector3().fromArray(cam.target || [0, 0, 0]);

  /* WIDE BENCHES MUST NOT LOSE THEIR ENDS ON A NARROW CANVAS.

     `dist` alone frames a scene for one aspect ratio. The field of view is
     vertical, so a narrower canvas shows LESS width at the same distance —
     and the network bench, which is a row of seven hops, lost the provider
     cloud off the left edge at a 649px canvas while looking correctly
     framed at 889px. Nothing warns you: the model is right, the numbers
     are right, and the student on a small screen simply cannot see the
     first hop.

     A bench can therefore declare `camera.fitWidth`, the world-space width
     it must always show. The camera then backs off far enough to fit that
     width at whatever aspect the canvas currently has, and `dist` becomes
     the CLOSEST it will ever come rather than the only distance it knows.
     Wide canvases are unaffected. */
  function fitDist() {
    if (!cam.fitWidth) return dist;
    var w = host.clientWidth || W;
    var aspect = w / H;
    var halfV = Math.tan((38 * Math.PI / 180) / 2);
    var need = (cam.fitWidth / 2) / (aspect * halfV);
    return Math.max(dist, need);
  }

  /* `max` IS AN ORBIT LIMIT, NOT A FRAMING LIMIT, AND CONFLATING THEM MADE
     fitWidth INERT.

     This line used to be `Math.min(cam.max || 40, fitDist())`. `dist` on
     the line above is ALREADY clamped into [min, max], so the only thing
     that second clamp could ever do was throw away the fit — and it did,
     silently, on every bench whose max was smaller than the distance its
     own fitWidth needed.

     The network bench is the case that proves it: it declares fitWidth 44
     with max 76, its comment says the value was measured, and at a 319px
     canvas it still lost a part off the frame. 44 needs about 93 to reach
     at that aspect, so the promise was capped at 76 and quietly broken.
     The handset bench had the same trap and needed max raised from 58 to
     74 by hand to get round it.

     The two numbers mean different things. `max` is how far a STUDENT may
     zoom out by orbiting. `fitWidth` is a promise about what must always
     be on screen. A promise clamped by an interaction limit is not a
     promise, so the fit wins. It can only ever move the camera further
     back than the clamp allowed, which shows MORE of the bench — a bench
     that is small is legible, and a bench with its edge cut off is not. */
  function place() {
    pitch = Math.max(-1.35, Math.min(1.35, pitch));
    dist = Math.max(cam.min || 5, Math.min(cam.max || 40, dist));
    var d = fitDist();
    camera.position.set(
      target.x + d * Math.cos(pitch) * Math.sin(yaw),
      target.y + d * Math.sin(pitch),
      target.z + d * Math.cos(pitch) * Math.cos(yaw)
    );
    camera.lookAt(target);
  }
  place();

  /* ---- selection ---- */
  var selected = null, hi = null;
  var accent = new THREE.Color(token(host, "--accent", "#12b3af"));
  var warn = new THREE.Color("#e0912f");

  /* ---------------------------------------------------------------------
     THE OUTLINE THAT SAYS "HERE"

     Shown on the fourth wrong guess, when the written hints have not landed
     and a student is about to give up. It is deliberately not the selection
     colour and not the reveal colour: those two already mean "you picked
     this" and "this is the answer", and a third meaning on either of them
     would teach the student to distrust both. A muted violet sits apart
     from the teal and the amber, and reads against a green board, bare
     metal, black plastic and the cream ground alike.

     It pulses three times and then STAYS, at about half strength. Flashing
     and vanishing punishes the student who happened to be reading the hint
     text at that moment, which is most of them — that is the whole reason
     the outline exists. A student who has prefers-reduced-motion set skips
     the pulsing and goes straight to the steady mark; nobody has to take a
     flashing screen to get the help.
     --------------------------------------------------------------------- */
  var flashColor = new THREE.Color("#a86fd0");
  var edgeColor = new THREE.Color(token(host, "--text", "#10161f"));
  var flashKey = null, flashAt = 0, flashSettled = false;
  var FLASHES = 3, FLASH_MS = 560;
  var noMotion = reducedMotion();
  var now = function () {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  };
  function flashLevel(k) {
    if (k !== flashKey || !flashKey) return 0;
    if (noMotion) return 0.55;
    var t = now() - flashAt;
    if (t >= FLASHES * FLASH_MS) return 0.55;      // settled, still marked
    return 0.22 + 0.78 * Math.sin(((t % FLASH_MS) / FLASH_MS) * Math.PI);
  }

  function applyStyle() {
    Object.keys(meshes).forEach(function (k) {
      var m = meshes[k];
      var p = (spec.parts || []).filter(function (x) { return x.key === k; })[0];
      var lift = 0, col = baseColor[k];
      if (k === selected) { col = accent; lift = 0.42; }
      else if (k === hi) { col = warn; lift = 0.22; }
      m.material.color.copy(col);
      m.position.y = p.pos[1] + lift;
      /* The damage rises with the part but keeps its own colour. Selecting a
         part turns it accent, and if the damage went with it the student
         would lose sight of the thing they were selecting it to look at. */
      if (harm[k]) harm[k].position.y = p.pos[1] + lift;
      if (fitted[k]) fitted[k].position.y = p.pos[1] + lift;
      /* Selecting a cooler has to turn the whole cooler, not just its
         shroud, or the accent says "part of this part". */
      (sub[k] || []).forEach(function (g) {
        g.mesh.position.y = p.pos[1] + lift;
        g.mesh.material.color.copy(k === selected ? accent : (k === hi ? warn : g.base));
      });
      /* A one-pixel line is all WebGL will reliably draw, and on a small
         part that is not enough to find. So the outline comes with a faint
         glow on the part itself — the ring says where the edge is, the glow
         says which object, and together they survive being looked at by
         someone whose sight is not what it was. */
      var fl = flashLevel(k);
      if (m.material.emissive) {
        m.material.emissive.copy(flashColor).multiplyScalar(fl * 0.30);
        if (baseGlow[k]) m.material.emissive.add(baseGlow[k]);
      }
      if (harm[k] && harm[k].material.emissive) {
        harm[k].material.emissive.copy(flashColor).multiplyScalar(fl * 0.30);
      }
      if (edges[k]) {
        edges[k].position.y = p.pos[1] + lift;
        edges[k].material.color.copy(fl ? flashColor : edgeColor);
        edges[k].material.opacity = fl
          ? Math.max(0.45, fl)
          : ((k === selected || k === hi) ? 0.9 : 0.28);
      }
    });
  }

  /* ---- picking ---- */
  var ray = new THREE.Raycaster();
  var ndc = new THREE.Vector2();
  /* A FORGIVING HIT TEST.

     A single ray through the pointer is right for a motherboard and useless
     for a cable run: measured across a grid of thirty clicks spread over the
     canvas, the network model — two plugs, a wall port and a thin run —
     answered one of them. Told to click the faulty part, a student on that
     ticket would click and click and have nothing happen, and conclude the
     picture was decoration.

     So a miss retries on a small ring around the pointer before giving up.
     It is still a real raycast, so what is in front still wins and nothing
     hidden behind another part can be picked by accident; it just means a
     thin thing does not demand pixel-exact aim. That matters beyond thin
     geometry — this is used by people working a trackpad one-handed on a
     bench, and by people whose hands are not steady. */
  var NEAR = [[0, 0], [7, 0], [-7, 0], [0, 7], [0, -7], [5, 5], [-5, 5], [5, -5], [-5, -5],
              [14, 0], [-14, 0], [0, 14], [0, -14], [10, 10], [-10, 10], [10, -10], [-10, -10]];
  function pickAt(clientX, clientY) {
    var r = canvas.getBoundingClientRect();
    for (var i = 0; i < NEAR.length; i++) {
      ndc.x = ((clientX + NEAR[i][0] - r.left) / r.width) * 2 - 1;
      ndc.y = -((clientY + NEAR[i][1] - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(ndc, camera);
      var hits = ray.intersectObjects(pickable, false);
      if (hits.length) return hits[0].object.userData.key;
    }
    return null;
  }

  var dragging = false, moved = 0, lastX = 0, lastY = 0;
  canvas.addEventListener("pointerdown", function (e) {
    dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    yaw -= dx * 0.008; pitch += dy * 0.006;
    lastX = e.clientX; lastY = e.clientY;
    place();
  });
  canvas.addEventListener("pointerup", function (e) {
    dragging = false;
    /* A drag that ends over a part is a drag, not a click. Six pixels of
       slop, because a hand that shakes should still be able to click. */
    if (moved > 6) return;
    var k = pickAt(e.clientX, e.clientY);
    if (k && opts.onPick) opts.onPick(k);
  });
  canvas.addEventListener("pointercancel", function () { dragging = false; });
  canvas.addEventListener("wheel", function (e) {
    e.preventDefault();
    dist += (e.deltaY > 0 ? 1 : -1) * 1.1;
    place();
  }, { passive: false });

  /* ---- render on demand ---- */
  var needs = true;
  function tick() {
    if (dead) return;
    raf = requestAnimationFrame(tick);
    /* The scene renders on demand, so a pulse has to ask for its own frames
       — and stop asking the moment it settles, or one outline would keep a
       laptop redrawing sixty times a second for the rest of the session. */
    if (flashKey && !noMotion && !flashSettled) {
      if (now() - flashAt >= FLASHES * FLASH_MS) flashSettled = true;
      applyStyle();
    }
    if (!needs) return;
    needs = false;
    renderer.render(scene, camera);
  }
  /* A photographed tile decodes a frame or two after the scene is built.
     Without this it lands in the texture and never reaches the screen,
     because nothing asks for another frame once the first one is drawn. */
  onTileReady(function () { needs = true; });

  var _place = place;
  place = function () { _place(); needs = true; };
  var _applyStyle = applyStyle;
  applyStyle = function () { _applyStyle(); needs = true; };
  applyStyle();
  tick();

  function resize() {
    var w = host.clientWidth || W;
    renderer.setSize(w, H, false);
    camera.aspect = w / H;
    camera.updateProjectionMatrix();
    /* The fit distance depends on the aspect, so it has to be recomputed
       here — not just at mount — or a resized panel re-clips the ends. */
    place();
    needs = true;
  }
  var ro = null;
  try { ro = new ResizeObserver(resize); ro.observe(host); } catch (e) {}

  function retheme() {
    scene.background = new THREE.Color(token(host, "--paper", "#eceff0"));
    accent = new THREE.Color(token(host, "--accent", "#12b3af"));
    edgeColor = new THREE.Color(token(host, "--text", "#10161f"));
    Object.keys(edges).forEach(function (k) { edges[k].material.color.copy(edgeColor); });
    applyStyle();
  }

  /* ---------------------------------------------------------------------
     REPLACE WHAT IS ON THE BENCH WITHOUT THROWING THE BENCH AWAY.

     THE BUG THIS EXISTS TO FIX WAS SHIPPING AND WAS INVISIBLE. `drawScene`
     in bench.js emptied its host and called `mountScene` again after every
     single action a student took — never calling `dispose()`, so every
     click abandoned a live WebGL context, its renderer, its geometry and
     its environment probe.

     Measured on the RAID bench: twenty actions created FORTY new contexts
     and the browser destroyed THIRTEEN of them. Browsers cap contexts
     around sixteen and silently drop the oldest, so the failure mode is
     not an error in a console — it is the bench going blank part-way
     through a long stage, which reads to a student as the lab breaking.

     Re-specifying is also what makes a PERSISTENT model possible at all:
     a model that must stay in front of the student on every step cannot
     be torn down and rebuilt at every step.

     `rebuild()` already does exactly the right thing — it empties `root`,
     disposes the geometry and materials it held, and builds the new spec
     inside the SAME scene, renderer, canvas and context. All this adds is
     re-reading the camera, because a new spec may be framed differently,
     and keeping the student's own orbit when it is the same bench in a new
     state rather than a different bench.

     `keepView` is the difference between those two cases:
       false  a DIFFERENT machine — take the new spec's camera as home
       true   the SAME machine changed state — the student turned it to
              look at something, and yanking it back is rude. */
  function setSpec(next, keepView) {
    spec = next || spec;
    rebuild();
    var prev = { yaw: yaw, pitch: pitch, dist: dist };
    cam = spec.camera || {};
    home = { yaw: cam.yaw === undefined ? 0.62 : cam.yaw,
             pitch: cam.pitch === undefined ? 0.5 : cam.pitch,
             dist: cam.dist === undefined ? 14 : cam.dist };
    if (keepView) { yaw = prev.yaw; pitch = prev.pitch; dist = prev.dist; }
    else { yaw = home.yaw; pitch = home.pitch; dist = home.dist; }
    target.fromArray(cam.target || [0, 0, 0]);
    /* A SELECTION BELONGING TO THE OLD SPEC names a part that may not
       exist in the new one, and `applyStyle` reads `spec.parts` by key to
       find where to lift it — so a stale key is not a harmless dangling
       highlight, it is a crash waiting for the next redraw. Both the
       selection and the flash highlight are dropped if the new spec has
       nothing by that name. */
    if (selected && !meshes[selected]) selected = null;
    if (hi && !meshes[hi]) hi = null;
    place();
    applyStyle();
  }

  var handle = {
    canvas: canvas,
    select: function (k) { selected = k; applyStyle(); },
    highlight: function (k) { hi = k; applyStyle(); },
    /* Outline a part and pulse it three times. Pass null to take it off. */
    flash: function (k) {
      flashKey = k || null;
      flashAt = now();
      flashSettled = false;
      applyStyle();
    },
    flashing: function () { return flashKey; },
    /* IS EVERY PART ACTUALLY INSIDE THE FRAME?

       A bench framed for one canvas width silently loses its ends on a
       narrower one — the model is right, the numbers are right, and the
       student on a small screen just cannot see the first hop. Eyes are a
       poor detector for this because a clipped edge looks like a
       deliberate crop. So ask the renderer: project each part's bounding
       sphere into normalised device coordinates and report anything whose
       extent crosses the left or right edge.

       Nothing in the page calls this. It exists so the verifier can hold
       the framing to account across widths. */
    frustumOK: function () {
      camera.updateMatrixWorld();
      camera.updateProjectionMatrix();
      var out = [], outY = [];
      Object.keys(meshes).forEach(function (k) {
        var group = meshes[k];
        var list = Array.isArray(group) ? group : [group];
        var lo = Infinity, hi2 = -Infinity, vlo = Infinity, vhi = -Infinity;
        list.forEach(function (m) {
          if (!m || !m.geometry) return;
          if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
          var bs = m.geometry.boundingSphere;
          if (!bs) return;
          var c = bs.center.clone().applyMatrix4(m.matrixWorld);
          /* Radius in world units, then in NDC at that depth. Project the
             centre and two points offset along the camera's right vector,
             which is what actually decides left/right clipping. */
          var right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
          var a = c.clone().addScaledVector(right, -bs.radius).project(camera);
          var bpt = c.clone().addScaledVector(right, bs.radius).project(camera);
          lo = Math.min(lo, a.x, bpt.x);
          hi2 = Math.max(hi2, a.x, bpt.x);
          /* AND THE SAME ALONG UP, reported separately.

             For most of this build's life this function looked at x and
             nothing else, and `fitWidth` fits width by definition — so a
             bench could pass the framing sweep at every canvas width and
             still be cut off top and bottom. The closed handset hit it
             (12.8 long on the screen's short axis) and the workshop room
             hit it again (four printers on a shelf at head height, sliced
             by the top edge while the sweep reported clean).

             It is `outY` rather than folded into `out` on purpose: the
             existing sweeps and their calibration counts are about
             horizontal clipping and stay exactly what they were. A caller
             that wants the vertical asks for it. */
          var up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
          var d = c.clone().addScaledVector(up, -bs.radius).project(camera);
          var e = c.clone().addScaledVector(up, bs.radius).project(camera);
          vlo = Math.min(vlo, d.y, e.y);
          vhi = Math.max(vhi, d.y, e.y);
        });
        if (lo === Infinity) return;
        if (lo < -1.001 || hi2 > 1.001) out.push(k);
        if (vlo < -1.001 || vhi > 1.001) outY.push(k);
      });
      return { out: out, outY: outY, parts: Object.keys(meshes).length };
    },
    /* WHERE EACH PART IS ON THE CANVAS, in pixels.

       For labelling a render and for any check that wants to assert a
       part is where the words say it is. A hand-placed callout is a
       measurement taken by eye, and this build has a long history of eyes
       being wrong about renders — so the labels are projected from the
       same camera that drew the frame.

       Returns, per part key, the bounding box of its projected geometry
       plus its centre. Bounding SPHERES are deliberately not used here:
       they are what makes frustumOK over-report a wide flat part, and a
       label wants the extent of the thing you can actually see. */
    partScreen: function () {
      camera.updateMatrixWorld();
      camera.updateProjectionMatrix();
      var W = renderer.domElement.clientWidth, H = renderer.domElement.clientHeight;
      var res = {};
      Object.keys(meshes).forEach(function (k) {
        var group = meshes[k];
        var list = Array.isArray(group) ? group : [group];
        var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        list.forEach(function (m) {
          if (!m || !m.geometry) return;
          var g = m.geometry;
          if (!g.boundingBox) g.computeBoundingBox();
          var bb = g.boundingBox;
          if (!bb) return;
          for (var i = 0; i < 8; i++) {
            var v = new THREE.Vector3(
              i & 1 ? bb.max.x : bb.min.x,
              i & 2 ? bb.max.y : bb.min.y,
              i & 4 ? bb.max.z : bb.min.z).applyMatrix4(m.matrixWorld).project(camera);
            var px = (v.x * 0.5 + 0.5) * W, py = (-v.y * 0.5 + 0.5) * H;
            x0 = Math.min(x0, px); x1 = Math.max(x1, px);
            y0 = Math.min(y0, py); y1 = Math.max(y1, py);
          }
        });
        if (x0 === Infinity) return;
        res[k] = { x0: x0, y0: y0, x1: x1, y1: y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
      });
      return { w: W, h: H, parts: res };
    },
    orbit: function (dy, dp) { yaw += dy; pitch += dp; place(); },
    zoom: function (d) { dist += d; place(); },
    reset: function () { yaw = home.yaw; pitch = home.pitch; dist = home.dist; place(); },
    retheme: retheme,
    /* Swap what is on the bench, keeping the context. See setSpec above. */
    setSpec: setSpec,
    /* Draw a frame right now and hand back the pixels.
       The scene renders on demand, and a WebGL drawing buffer is only
       readable in the frame it was drawn in — after that the compositor has
       taken it and both drawImage and readPixels come back blank or black.
       So a screenshot taken a second after the last render photographs
       nothing, which reads exactly like a model that failed to draw. It
       cost me one wrong conclusion about the lighting before I noticed.
       Nothing in the page calls this; it exists so a picture of the bench
       can be trusted to be a picture of the bench. */
    snapshot: function () {
      renderer.render(scene, camera);
      try { return canvas.toDataURL("image/png"); } catch (e) { return null; }
    },
    reducedMotion: reducedMotion(),
    dispose: function () {
      dead = true;
      cancelAnimationFrame(raf);
      if (ro) try { ro.disconnect(); } catch (e) {}
      root.children.forEach(function (c) {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
      /* The probe belongs to this renderer and goes with it. */
      if (scene.environment) try { scene.environment.dispose(); } catch (e) {}
      try { renderer.dispose(); } catch (e) {}
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      if (typeof window !== "undefined" && window.__SCENE === handle) window.__SCENE = null;
    }
  };
  /* A seam for the verifier, matching __UTHL on the shell: the most
     recently mounted scene, so a check can ask the live renderer what it
     actually framed rather than re-deriving it from the spec and agreeing
     with itself. Nothing in the page reads it. */
  try { window.__SCENE = handle; } catch (e) {}
  return handle;
}
