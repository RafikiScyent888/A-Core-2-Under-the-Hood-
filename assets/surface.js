/* =====================================================================
   WHAT A SURFACE IS MADE OF

   The bench draws parts out of boxes and cylinders, each one painted a
   single flat colour. That is enough to say where a part sits and what
   shape it is, and it is nowhere near enough to say what it IS. A green
   rectangle is not a circuit board. A grey rectangle is not brushed
   aluminium. A student who has only ever seen the grey rectangle walks
   into a real machine and recognises nothing.

   The thing that closes that gap is not more polygons. It is TEXTURE: an
   image wrapped onto the surface, plus a second image saying which way the
   surface tilts at every point so the light breaks over it. A board with a
   copper layer, a solder mask, silkscreen and pads reads as a board from
   across a room, even when the geometry under it is one flat slab.

   WHY THESE ARE PAINTED IN CODE RATHER THAN LOADED.

   This site fetches nothing — it has to run from a memory stick in a room
   with no network — so every texture would otherwise be base64 inside the
   page. A single 1024-square colour-and-relief pair is around 400KB
   encoded. Fourteen parts across thirteen tracks is not a website any more.

   Painted procedurally they cost bytes of code and a few milliseconds at
   load, they scale to any resolution, and — this is the part that matters
   for a teaching build — they can be DERIVED FROM THE MODEL. A board's
   silkscreen can name the components that board actually has. A drive label
   can carry the capacity the ticket generated. Nothing has to be kept in
   step by hand, which is the failure this project keeps having.

   WHERE PHOTOGRAPHS STILL WIN. Fine material grain — the weave under a
   board's solder mask, the drawn lines in brushed aluminium, the bloom on
   moulded ABS. Those are cheap as small repeating tiles, a few kilobytes
   each, shared by every part made of that material. That is a short shopping
   list of flat surfaces, not a photograph of every component.
   ===================================================================== */

/* Textures are built once and shared. Unlike the environment probe, a
   CanvasTexture is not tied to the renderer that first used it — it is
   uploaded per context on demand — so caching this one is safe where
   caching that one was not. */
import { tileFor } from "./tiles.js";

const CACHE = {};

function canvas(size) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return c;
}

/* A repeatable pseudo-random, so a board looks the same every time it is
   drawn. A texture that reshuffles on every render is a texture a student
   cannot use as a landmark. */
function rng(seed) {
  let s = seed >>> 0 || 1;
  return function () {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/* ---------------------------------------------------------------------
   PRINTED CIRCUIT BOARD

   Solder mask over a fibreglass weave, a ground pour, signal traces that
   turn at forty-five degrees the way real routing does, via holes, pads,
   and silkscreen outlines. Drawn twice over: once in colour, and once as
   height, so the copper stands proud of the mask and catches the light.
   --------------------------------------------------------------------- */
function pcb(size, seed) {
  const col = canvas(size), hi = canvas(size);
  const x = col.getContext("2d"), h = hi.getContext("2d");
  const r = rng(seed || 7);

  x.fillStyle = "#0d3b2a"; x.fillRect(0, 0, size, size);
  h.fillStyle = "#808080"; h.fillRect(0, 0, size, size);

  /* The glass weave under the mask. Barely visible, and the reason a real
     board never looks like flat paint. */
  x.globalAlpha = 0.06;
  for (let i = 0; i < size; i += 6) {
    x.fillStyle = i % 12 ? "#ffffff" : "#000000";
    x.fillRect(i, 0, 3, size);
    x.fillRect(0, i, size, 3);
  }
  x.globalAlpha = 1;

  /* Ground pour: a lighter field with a hatched edge, which is what most of
     a board's area actually is. */
  x.fillStyle = "#12523a";
  x.fillRect(size * 0.04, size * 0.04, size * 0.92, size * 0.92);

  /* Signal traces. Forty-five degree turns, tracked in the height map too so
     the copper sits above the mask. */
  const trace = (w, colr, hcol) => {
    x.strokeStyle = colr; x.lineWidth = w; x.lineCap = "round"; x.lineJoin = "round";
    h.strokeStyle = hcol; h.lineWidth = w; h.lineCap = "round"; h.lineJoin = "round";
    for (let n = 0; n < 46; n++) {
      let px = r() * size, py = r() * size;
      x.beginPath(); h.beginPath();
      x.moveTo(px, py); h.moveTo(px, py);
      const segs = 2 + Math.floor(r() * 4);
      for (let s = 0; s < segs; s++) {
        const len = size * (0.05 + r() * 0.18);
        const dir = Math.floor(r() * 8) * (Math.PI / 4);
        px += Math.cos(dir) * len; py += Math.sin(dir) * len;
        x.lineTo(px, py); h.lineTo(px, py);
      }
      x.stroke(); h.stroke();
    }
  };
  trace(Math.max(1, size / 256), "#2f7a58", "#8d8d8d");
  trace(Math.max(2, size / 150), "#b8873f", "#a8a8a8");

  /* Pads and vias. */
  for (let n = 0; n < 150; n++) {
    const px = r() * size, py = r() * size, rad = size * (0.004 + r() * 0.008);
    x.fillStyle = "#c79a4a";
    x.beginPath(); x.arc(px, py, rad, 0, 6.284); x.fill();
    h.fillStyle = "#b4b4b4";
    h.beginPath(); h.arc(px, py, rad, 0, 6.284); h.fill();
    if (r() > 0.45) {                       // a via has a hole through it
      x.fillStyle = "#08251b";
      x.beginPath(); x.arc(px, py, rad * 0.45, 0, 6.284); x.fill();
      h.fillStyle = "#4a4a4a";
      h.beginPath(); h.arc(px, py, rad * 0.45, 0, 6.284); h.fill();
    }
  }

  /* Silkscreen: component outlines and a designator beside each. White,
     slightly raised, and the thing that most makes a board look printed. */
  x.strokeStyle = "#dfe6e2"; x.fillStyle = "#dfe6e2";
  x.lineWidth = Math.max(1, size / 340);
  h.strokeStyle = "#8f8f8f"; h.lineWidth = x.lineWidth;
  x.font = "600 " + Math.round(size / 42) + "px ui-monospace, monospace";
  const tag = ["R", "C", "U", "L", "Q", "D"];
  for (let n = 0; n < 26; n++) {
    const px = r() * size * 0.9, py = r() * size * 0.9;
    const w = size * (0.03 + r() * 0.10), hh = size * (0.02 + r() * 0.06);
    x.strokeRect(px, py, w, hh);
    h.strokeRect(px, py, w, hh);
    x.fillText(tag[Math.floor(r() * tag.length)] + (1 + Math.floor(r() * 99)),
      px, Math.max(size / 40, py - size / 120));
  }

  return { color: col, height: hi };
}

/* ---------------------------------------------------------------------
   BRUSHED METAL — drawn lines running one way, which is the whole reason
   an aluminium cover looks different from a painted one under a light.
   --------------------------------------------------------------------- */
function brushed(size, seed) {
  const col = canvas(size), hi = canvas(size);
  const x = col.getContext("2d"), h = hi.getContext("2d");
  const r = rng(seed || 11);
  x.fillStyle = "#f2f2f2"; x.fillRect(0, 0, size, size);
  h.fillStyle = "#808080"; h.fillRect(0, 0, size, size);
  for (let n = 0; n < size * 9; n++) {
    const py = r() * size, len = size * (0.05 + r() * 0.55), px = r() * size;
    const v = 0.5 + r() * 0.5;
    x.strokeStyle = "rgba(255,255,255," + (0.05 * v) + ")";
    h.strokeStyle = "rgba(255,255,255," + (0.10 * v) + ")";
    x.lineWidth = h.lineWidth = Math.max(1, size / 512);
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + len, py + (r() - 0.5)); x.stroke();
    h.beginPath(); h.moveTo(px, py); h.lineTo(px + len, py + (r() - 0.5)); h.stroke();
    if (r() > 0.7) {
      x.strokeStyle = "rgba(0,0,0,0.05)";
      x.beginPath(); x.moveTo(px, py + 1); x.lineTo(px + len, py + 1); x.stroke();
    }
  }
  return { color: col, height: hi };
}

/* ---------------------------------------------------------------------
   MOULDED PLASTIC — the fine pebble finish on a printer shell or a laptop
   base, which is what stops a moulding reading as a painted block.
   --------------------------------------------------------------------- */
function moulded(size, seed) {
  const col = canvas(size), hi = canvas(size);
  const x = col.getContext("2d"), h = hi.getContext("2d");
  const r = rng(seed || 23);
  x.fillStyle = "#efefef"; x.fillRect(0, 0, size, size);
  h.fillStyle = "#808080"; h.fillRect(0, 0, size, size);
  /* Few enough, and big enough, to survive being minified on screen. The
     first pass used specks smaller than a pixel at four times the repeat,
     which aliased into television static and made a keyboard look like
     sandpaper. A moulding is a soft pebble, not noise. */
  /* Small and faint. A pebble finish on ABS is nearly invisible at the
     distance this bench is viewed from, and that is not a shortcoming to
     compensate for — it is what the material looks like. Two passes at
     making it VISIBLE produced television static and then camouflage. What
     it should do is stop a moulding reading as flat paint, and nothing
     more; the parts that carry information are printed, not grained. */
  for (let n = 0; n < size * 16; n++) {
    const px = r() * size, py = r() * size, rad = size * (0.0015 + r() * 0.0035);
    const up = r() > 0.5;
    /* RELIEF ONLY. Point noise in a colour map cannot survive being
       minified: at bench distance each speck falls below a pixel and the
       filter turns it into crawling static. Four attempts at tuning the
       colour speckle produced static, then camouflage, then static again.
       The same noise in the HEIGHT map costs nothing — it perturbs the
       specular a little and disappears cleanly when it gets small, which is
       exactly what a real pebble finish does. */
    h.fillStyle = up ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)";
    h.beginPath(); h.arc(px, py, rad, 0, 6.284); h.fill();
  }
  return { color: col, height: hi };
}

/* ---------------------------------------------------------------------
   RUBBER — a roller or a platen. Matte, faintly grained, and where it has
   been worn it goes shiny rather than changing colour, which is the tell a
   technician is looking for on a pickup tyre.
   --------------------------------------------------------------------- */
function rubber(size, seed) {
  const col = canvas(size), hi = canvas(size);
  const x = col.getContext("2d"), h = hi.getContext("2d");
  const r = rng(seed || 31);
  x.fillStyle = "#efefef"; x.fillRect(0, 0, size, size);
  h.fillStyle = "#808080"; h.fillRect(0, 0, size, size);
  for (let n = 0; n < size * 18; n++) {
    const px = r() * size, py = r() * size, rad = size * (0.0012 + r() * 0.003);
    const up = r() > 0.5;
    h.fillStyle = up ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
    h.beginPath(); h.arc(px, py, rad, 0, 6.284); h.fill();
  }
  /* Fine circumferential lines, the moulding marks on a roller. */
  for (let n = 0; n < 90; n++) {
    const py = r() * size;
    x.strokeStyle = "rgba(0,0,0,0.05)"; x.lineWidth = Math.max(1, size / 512);
    x.beginPath(); x.moveTo(0, py); x.lineTo(size, py); x.stroke();
  }
  return { color: col, height: hi };
}

/* ---------------------------------------------------------------------
   ANODISED — black that still has a surface. Flat black paint in a render
   reads as a hole; anodised aluminium has a fine sheen and a grain, and
   that is the difference between a hinge and a black rectangle.
   --------------------------------------------------------------------- */
/* CNC-MACHINED ALUMINIUM, for the handset midframe.

   `anodised` was standing in for this and it is the wrong material: it
   draws long parallel drawing lines, which is what an extruded or brushed
   panel looks like. A midframe is not extruded. It is a billet that has
   been MILLED, and a milled face carries three things a drawn one does
   not —

     the cutter's arc marks, short overlapping curves left by a round end
       mill stepping across the face, which is the tell everybody
       recognises even if they cannot name it;
     a bead-blast speckle over the top, because the part is blasted after
       machining to take the tool shine off;
     and the fact that the marks change direction between faces, because
       the cutter approached each one differently.

   The speckle uses a squared radius term rather than a linear one. A
   linear scatter lays its flecks on visible diagonals and reads as a
   printed pattern rather than as a blasted finish — the same mistake the
   paper-dust scatter made on the printer bench. */
/* MATTE BLACK SHELL, for the handset's back cover.

   It was wearing `moulded`, which is a pebbled texture pitched at a
   printer's case, and on a phone it read as tarmac. A matte back is
   nearly smooth: what you actually see on one is a very fine bead
   texture, a BROAD soft sheen rather than a highlight, and the faint
   flow lines the moulding leaves radiating from where the tool gated.

   Loudness has to track importance here more than anywhere, because
   nothing on this surface is a fault. It is the quietest painter in the
   file on purpose. */
function shellMatte(size, seed) {
  const col = canvas(size), hi = canvas(size);
  const x = col.getContext("2d"), h = hi.getContext("2d");
  const r = rng(seed || 83);
  x.fillStyle = "#f4f4f4"; x.fillRect(0, 0, size, size);
  h.fillStyle = "#808080"; h.fillRect(0, 0, size, size);
  /* the fine bead, squared so it does not lay itself out on diagonals */
  for (let n = 0; n < size * 30; n++) {
    const px = r() * size, py = r() * size, t = r();
    const pr = size * 0.0010 * (1 + t * t * 2.4);
    h.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    h.beginPath(); h.arc(px, py, pr, 0, 6.284); h.fill();
  }
  /* mould flow, very faint, sweeping across rather than repeating */
  for (let n = 0; n < 14; n++) {
    const y0 = r() * size, amp = size * (0.02 + r() * 0.05);
    h.strokeStyle = "rgba(255,255,255,0.035)";
    h.lineWidth = Math.max(1, size / 220);
    h.beginPath();
    for (let i = 0; i <= 16; i++) {
      const px = (i / 16) * size, py = y0 + Math.sin(i / 16 * 3.1 + n) * amp;
      i ? h.lineTo(px, py) : h.moveTo(px, py);
    }
    h.stroke();
  }
  return { color: col, height: hi };
}

/* THE ITO TOUCH GRID, for the digitizer.

   A capacitive sensor is not a crosshatch of wires. It is two sets of
   DIAMONDS in indium tin oxide: drive electrodes joined corner to corner
   in rows, sense electrodes joined corner to corner in columns, and at
   every crossing a tiny insulated BRIDGE carries one over the other.
   Those bridges are the whole trick, and they are why a digitizer is a
   laminated stack rather than a printed sheet.

   It is drawn FAINT on purpose. ITO is a transparent conductor \u2014 you can
   only see this pattern at a raking angle or against a bright reflection,
   which is exactly how a technician finds it. Loudness tracks importance,
   and the grid is something a student should go looking for rather than
   something that shouts over the picture underneath it. */
function ito(size, seed) {
  const col = canvas(size), hi = canvas(size);
  const x = col.getContext("2d"), h = hi.getContext("2d");
  const r = rng(seed || 97);
  x.fillStyle = "#f6f7f8"; x.fillRect(0, 0, size, size);
  h.fillStyle = "#808080"; h.fillRect(0, 0, size, size);

  const n = 7, pitch = size / n, half = pitch / 2;
  function diamond(c, cx, cy, rad) {
    c.beginPath();
    c.moveTo(cx, cy - rad); c.lineTo(cx + rad, cy);
    c.lineTo(cx, cy + rad); c.lineTo(cx - rad, cy);
    c.closePath();
  }
  /* THE PATTERN HAS TO BE IN THE COLOUR, not only in the height.

     Its first cut drew everything into the height map and left the colour
     near-white on near-white \u2014 and this layer's finish is `glass`, which
     is smooth enough that a normal map barely registers. The grid came out
     completely invisible: a check nobody had written, caught by looking.

     ITO is not literally invisible either. Against a bright reflection the
     electrodes read a shade darker than the gaps between them, which is
     exactly how a technician finds the pattern on a real digitizer. */
  for (let i = -1; i <= n; i++) {
    for (let j = -1; j <= n; j++) {
      const cx = i * pitch + half, cy = j * pitch + half;
      [[0, 0, 0], [half, half, 1]].forEach(function (o, k) {
        diamond(x, cx + o[0], cy + o[1], half * 0.92);
        x.fillStyle = k ? "rgba(0,0,0,0.055)" : "rgba(255,255,255,0.055)";
        x.fill();
        x.strokeStyle = "rgba(0,0,0,0.13)";
        x.lineWidth = Math.max(1, size / 320); x.stroke();
        diamond(h, cx + o[0], cy + o[1], half * 0.92);
        h.strokeStyle = k ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.22)";
        h.lineWidth = Math.max(1, size / 300); h.stroke();
      });
      /* the bridge at each crossing, a short bar over the junction */
      x.fillStyle = "rgba(0,0,0,0.10)";
      x.fillRect(cx + half - size / 300, cy + half - size / 150, size / 150, size / 75);
      h.fillStyle = "rgba(255,255,255,0.26)";
      h.fillRect(cx + half - size / 260, cy + half - size / 130, size / 130, size / 65);
    }
  }
  /* a very few pinholes in the coating, which is what a dead patch is */
  for (let k = 0; k < 5; k++) {
    const px = r() * size, py = r() * size;
    h.fillStyle = "rgba(0,0,0,0.05)";
    h.beginPath(); h.arc(px, py, size * 0.004, 0, 6.284); h.fill();
  }
  return { color: col, height: hi };
}

/* THE COLOUR FILTER MATRIX — the thing an LCD panel's front glass actually
   is, and the reason a "dead pixel" is a different fault from a "stuck" one.

   Every pixel is THREE stripes, red green and blue, each with its own
   transistor on the glass behind. Between and around them runs the BLACK
   MATRIX: an opaque grid that stops light leaking past the edge of a
   stripe and washing the colour out. That grid is why a switched-off LCD
   is dark grey rather than the colour of its backlight.

   Drawn at three tiles across the panel it reads as fine even texture from
   the bench and resolves into stripes when a student brings the camera in,
   which is the right way round: nobody sees subpixels from arm's length,
   and everybody can see them through a loupe.

   The colour is deliberately UNSATURATED. Real filters are dyes over white
   light and a phone panel off is a dark neutral, not a rainbow — painting
   full-strength primaries here would turn the panel into a novelty and
   make the black matrix, which is the teachable half, invisible. */
function subpixel(size, seed) {
  const col = canvas(size), hi = canvas(size);
  const x = col.getContext("2d"), h = hi.getContext("2d");
  const r = rng(seed || 613);

  /* the ground is the black matrix; the stripes are painted onto it */
  x.fillStyle = "#20242a"; x.fillRect(0, 0, size, size);
  h.fillStyle = "#6a6a6a"; h.fillRect(0, 0, size, size);

  const TRIADS = 12;                      /* pixels across one tile */
  const pw = size / TRIADS;               /* one whole pixel */
  const sw = pw / 3;                      /* one subpixel stripe */
  const rows = TRIADS;                    /* square pixels, so rows match */
  const ph = size / rows;
  const GAPX = Math.max(1, sw * 0.16);    /* the matrix between stripes */
  const GAPY = Math.max(1, ph * 0.14);    /* and between rows */
  /* MUCH CLOSER TOGETHER THAN THE FIRST CUT, which used ["#6e3a3f",
     "#3a6e46", "#3a4b6e"] and turned the panel into RGB confetti — the
     loudest object on the layer, over a lit screen that is the subject.
     Real subpixels ADD at any distance you cannot resolve them, so a
     panel reads neutral dark grey from arm's length and separates into
     colour under a loupe. These are dark and barely apart; the stripes
     still read close up because the black matrix between them does most
     of the work, and at bench distance they average to grey the way the
     real thing does. Loudness tracks importance. */
  const INK = ["#5d383e", "#385d43", "#38455d"];

  for (let ry = 0; ry < rows; ry++) {
    for (let px = 0; px < TRIADS; px++) {
      for (let s = 0; s < 3; s++) {
        const sx = px * pw + s * sw + GAPX / 2;
        const sy = ry * ph + GAPY / 2;
        const w = sw - GAPX, d = ph - GAPY;
        x.fillStyle = INK[s];
        x.fillRect(sx, sy, w, d);
        /* the stripe stands very slightly proud of the matrix around it */
        h.fillStyle = "rgba(255,255,255,0.22)";
        h.fillRect(sx, sy, w, d);
      }
      /* THE THIN-FILM TRANSISTOR, one per subpixel, in the corner where the
         gate line and the source line cross. It is the smallest thing drawn
         on this bench and it is the whole reason the panel is called TFT —
         and the reason a single dead pixel is a dead TRANSISTOR rather than
         anything a technician can reach. */
      for (let s = 0; s < 3; s++) {
        const tx = px * pw + s * sw + GAPX / 2;
        const ty = ry * ph + ph - GAPY - Math.max(1, ph * 0.10);
        x.fillStyle = "rgba(0,0,0,0.42)";
        x.fillRect(tx, ty, Math.max(1, sw * 0.34), Math.max(1, ph * 0.11));
      }
    }
  }
  /* the gate and source lines, run over the matrix so the grid reads as
     wiring rather than as a printed chequer */
  x.strokeStyle = "rgba(0,0,0,0.55)";
  x.lineWidth = Math.max(1, size / 900);
  for (let ry = 0; ry <= rows; ry++) {
    x.beginPath(); x.moveTo(0, ry * ph); x.lineTo(size, ry * ph); x.stroke();
  }
  for (let px = 0; px <= TRIADS * 3; px++) {
    x.beginPath(); x.moveTo(px * sw, 0); x.lineTo(px * sw, size); x.stroke();
  }
  /* a handful of stripes that never switch — the stuck subpixels a student
     is asked to find. Faint, because a stuck subpixel IS faint until you
     go looking for it on a white field. */
  for (let k = 0; k < 3; k++) {
    const px = Math.floor(r() * TRIADS), ry = Math.floor(r() * rows), s = Math.floor(r() * 3);
    x.fillStyle = "rgba(0,0,0,0.55)";
    x.fillRect(px * pw + s * sw + GAPX / 2, ry * ph + GAPY / 2, sw - GAPX, ph - GAPY);
  }
  return { color: col, height: hi };
}

function alloy(size, seed) {
  const col = canvas(size), hi = canvas(size);
  const x = col.getContext("2d"), h = hi.getContext("2d");
  const r = rng(seed || 61);
  x.fillStyle = "#f2f2f2"; x.fillRect(0, 0, size, size);
  h.fillStyle = "#808080"; h.fillRect(0, 0, size, size);

  /* the cutter's arc marks, in overlapping rows the way a mill steps over */
  const rows = 11, step = size / rows, rad = step * 0.92;
  for (let row = -1; row <= rows; row++) {
    const cy = row * step + step * 0.5;
    for (let i = -1; i < rows + 1; i++) {
      const cx = i * step + (row % 2 ? step * 0.5 : 0);
      const a0 = -0.55 + (r() - 0.5) * 0.10;
      x.strokeStyle = "rgba(255,255,255," + (0.030 + r() * 0.028) + ")";
      h.strokeStyle = "rgba(255,255,255," + (0.10 + r() * 0.09) + ")";
      x.lineWidth = h.lineWidth = Math.max(1, size / 300);
      x.beginPath(); x.arc(cx, cy, rad, a0, a0 + 1.5); x.stroke();
      h.beginPath(); h.arc(cx, cy, rad, a0, a0 + 1.5); h.stroke();
      /* the darker side of each arc, so it reads as a groove not a line */
      h.strokeStyle = "rgba(0,0,0," + (0.08 + r() * 0.07) + ")";
      h.beginPath(); h.arc(cx, cy + Math.max(1, size / 300), rad, a0, a0 + 1.5); h.stroke();
    }
  }
  /* bead blast over the top of the machining */
  for (let n = 0; n < size * 26; n++) {
    const px = r() * size, py = r() * size;
    const t = r();
    const pr = size * 0.0016 * (1 + t * t * 3.2);   /* squared, not linear */
    h.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
    h.beginPath(); h.arc(px, py, pr, 0, 6.284); h.fill();
  }
  return { color: col, height: hi };
}

function anodised(size, seed) {
  const col = canvas(size), hi = canvas(size);
  const x = col.getContext("2d"), h = hi.getContext("2d");
  const r = rng(seed || 41);
  x.fillStyle = "#f0f0f0"; x.fillRect(0, 0, size, size);
  h.fillStyle = "#808080"; h.fillRect(0, 0, size, size);
  for (let n = 0; n < size * 12; n++) {
    const py = r() * size, len = size * (0.02 + r() * 0.30), px = r() * size;
    x.strokeStyle = "rgba(255,255,255," + (0.02 + r() * 0.03) + ")";
    h.strokeStyle = "rgba(255,255,255," + (0.05 + r() * 0.06) + ")";
    x.lineWidth = h.lineWidth = Math.max(1, size / 512);
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + len, py); x.stroke();
    h.beginPath(); h.moveTo(px, py); h.lineTo(px + len, py); h.stroke();
  }
  return { color: col, height: hi };
}

/* ---------------------------------------------------------------------
   PAINTED STEEL — a case panel, a rack rail, a supply shell. Industrial
   paint over metal: slightly orange-peeled, never glossy, and carrying the
   handling marks that every machine in service has.
   --------------------------------------------------------------------- */
function steel(size, seed) {
  const col = canvas(size), hi = canvas(size);
  const x = col.getContext("2d"), h = hi.getContext("2d");
  const r = rng(seed || 53);
  x.fillStyle = "#f2f2f2"; x.fillRect(0, 0, size, size);
  h.fillStyle = "#808080"; h.fillRect(0, 0, size, size);
  for (let n = 0; n < size * 12; n++) {
    const px = r() * size, py = r() * size, rad = size * (0.002 + r() * 0.005);
    const up = r() > 0.5;
    h.fillStyle = up ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.14)";
    h.beginPath(); h.arc(px, py, rad, 0, 6.284); h.fill();
  }
  for (let n = 0; n < 34; n++) {              // scuffs from handling
    const px = r() * size, py = r() * size, len = size * (0.02 + r() * 0.12);
    const a = r() * 6.284;
    x.strokeStyle = "rgba(255,255,255,0.06)";
    x.lineWidth = Math.max(1, size / 400);
    x.beginPath(); x.moveTo(px, py);
    x.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len); x.stroke();
  }
  return { color: col, height: hi };
}

/* ---------------------------------------------------------------------
   LABEL — the printed sticker on a drive, a supply, a UPS.

   This is the one that pays for the whole procedural approach. The lines
   come from the ticket, so the capacity on the drive is the capacity that
   ticket generated and the wattage on the supply is the one the paperwork
   claims. A student reads a spec off the part the way they would on a
   bench, and there is no second copy of that number to drift out of step.
   --------------------------------------------------------------------- */
/* ---------------------------------------------------------------------
   A LITHIUM CELL'S OWN LABEL, printed the way a real one is.

   `label` above is a generic sticker: a few lines and a barcode, right for
   a drive caddy. A battery label is a specific document and every line on
   it is there for a reason a technician uses:

     THE PART NUMBER      is what you order by, and it is the only thing on
                          the cell that identifies it. It is set in the
                          largest type on the label for exactly that reason.
     THE CHEMISTRY        Li-ion POLYMER. A pouch cell is a polymer cell —
                          the distinction students are asked for, and the
                          reason it domes rather than splitting.
     mAh AND Wh, BOTH     because both are printed on the real thing, and
                          Wh is the one you calculate with. Wh = V x Ah, so
                          4500 mAh at 3.87 V is 17.4 Wh, and the two
                          figures on the label are a worked example of the
                          sum sitting on the part.
     NOMINAL AND CHARGE   3.87 V nominal, 4.40 V limit. This is the line
       VOLTAGE            that stops a student reading 4.35 V on a full
                          cell and calling it overcharged. Nominal is an
                          average over the discharge, not a maximum.
     THE WARNINGS         do not disassemble, crush, heat or incinerate.
     THE MARKS            the crossed-out wheelie bin is WEEE — this does
                          not go in a bin, which is a disposal objective in
                          its own right — plus CE and the Li-ion recycling
                          triangle.

   ONE-OFF, NOT TILED. `once: true` in PAINTERS, because this is a picture
   of a specific object and not a material. Tiled it comes out as the same
   six lines repeated across a battery and cut at the seam.

   THE FIGURES COME FROM THE SCENARIO. The lab generates a design capacity
   and a health percentage and then asks the student to divide one by the
   other; a label printing its own invented numbers would put the evidence
   and the answer on opposite sides of the same bench. checkTheLabelAgrees
   in bench-mobile.js holds them together. */
function cellFace(size, seed, spec) {
  const col = canvas(size), hi = canvas(size);
  const x = col.getContext("2d"), h = hi.getContext("2d");
  const r = rng(seed || 907);
  const L = (spec && spec.lines) || [];
  const S = function (n) { return Math.round(size * n); };

  x.fillStyle = "#dedbd2"; x.fillRect(0, 0, size, size);
  h.fillStyle = "#808080"; h.fillRect(0, 0, size, size);
  /* paper tooth */
  for (let n = 0; n < size * 9; n++) {
    x.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.035)";
    x.fillRect(r() * size, r() * size, 1, 1);
  }
  /* the printed border every one of these has */
  x.strokeStyle = "#3a3d40"; x.lineWidth = Math.max(1, S(0.006));
  x.strokeRect(S(0.05), S(0.05), S(0.90), S(0.90));

  const pad = S(0.085);
  const room = size - pad * 2;
  /* MEASURE, DO NOT ASSUME IT FITS.

     The first cut picked font sizes by eye and every long line ran off the
     right-hand edge of the printed border — "17.4 Wh" came out "17.4 W",
     which on a label whose whole job is to be READ is worse than drawing
     nothing. A square texture is also stretched onto a portrait part, so
     what fits in the canvas is not what fits on the cell. So each line is
     measured and shrunk until it does. */
  function line(text, px, weight, colour) {
    let f = S(px);
    x.fillStyle = colour || "#16181a";
    do {
      x.font = (weight || "400") + " " + f + "px ui-monospace, Menlo, Consolas, monospace";
      if (x.measureText(text).width <= room || f <= 8) break;
      f -= 1;
    } while (true);
    return f;
  }
  let y = S(0.150);
  x.textBaseline = "alphabetic";

  /* THE PART NUMBER, in the largest type on the label. */
  line(String(L[0] || "PACK"), 0.070, "700");
  x.fillText(String(L[0] || "PACK"), pad, y);
  y += S(0.056);
  line(String(L[1] || "Li-ion Polymer"), 0.038);
  x.fillText(String(L[1] || "Li-ion Polymer"), pad, y);

  /* rule */
  y += S(0.030);
  x.fillStyle = "#3a3d40"; x.fillRect(pad, y, size - pad * 2, Math.max(1, S(0.004)));
  y += S(0.055);

  /* THE RATINGS, which are the numbers a student calculates with. */
  line(String(L[2] || ""), 0.050, "700");
  x.fillText(String(L[2] || ""), pad, y);
  y += S(0.050);
  [L[3], L[4]].forEach(function (ln) {
    if (!ln) return;
    line(String(ln), 0.038);
    x.fillText(String(ln), pad, y);
    y += S(0.044);
  });

  /* THE WARNINGS. Small, as they are on the real thing — and legible,
     because the whole point of drawing them is that a student can read
     what a battery says about itself. */
  y += S(0.026);
  ["Do not disassemble, crush, heat or",
   "incinerate. Charge only with an",
   "approved charger. Dispose of at a",
   "licensed collection point."].forEach(function (ln) {
    line(ln, 0.030, "400", "#2a2d30");
    x.fillText(ln, pad, y); y += S(0.036);
  });

  /* THE BAND THE FIRST CUT LEFT EMPTY. The label is portrait and the
     layout was written for a square, so a third of it came out blank —
     which on a part whose whole job is to be read looks like a label
     somebody forgot to finish. Real cells fill it, and every line here is
     one a real cell carries. */
  y += S(0.024);
  x.fillStyle = "#3a3d40"; x.fillRect(pad, y - S(0.020), room, Math.max(1, S(0.003)));
  y += S(0.020);
  ["Rechargeable lithium-polymer cell",
   "Protection circuit fitted",
   "Made in Malaysia"].forEach(function (ln) {
    line(ln, 0.030, "400", "#2a2d30");
    x.fillText(ln, pad, y); y += S(0.036);
  });

  /* THE MARKS. The crossed-out wheelie bin first, because it is the one
     that is a rule rather than a decoration: a lithium cell does not go in
     a bin, and that is a disposal objective on its own. */
  const my = S(0.775), ms = S(0.072);
  x.strokeStyle = "#16181a"; x.lineWidth = Math.max(1, S(0.005));
  (function bin(bx) {
    x.strokeRect(bx + ms * 0.16, my + ms * 0.28, ms * 0.68, ms * 0.60);   /* body */
    x.beginPath();                                                        /* lid */
    x.moveTo(bx + ms * 0.08, my + ms * 0.24); x.lineTo(bx + ms * 0.92, my + ms * 0.24);
    x.stroke();
    x.beginPath();                                                        /* handle */
    x.moveTo(bx + ms * 0.38, my + ms * 0.24); x.lineTo(bx + ms * 0.44, my + ms * 0.12);
    x.lineTo(bx + ms * 0.58, my + ms * 0.12); x.lineTo(bx + ms * 0.64, my + ms * 0.24);
    x.stroke();
    x.beginPath();                                                        /* the cross */
    x.moveTo(bx - ms * 0.02, my + ms * 0.92); x.lineTo(bx + ms * 1.02, my + ms * 0.10);
    x.stroke();
    x.beginPath();
    x.moveTo(bx + ms * 0.10, my + ms * 0.06); x.lineTo(bx + ms * 0.10, my + ms * 0.96);
    x.stroke();
  })(pad);
  /* CE */
  x.fillStyle = "#16181a";
  x.font = "700 " + S(0.062) + "px system-ui, sans-serif";
  x.fillText("CE", pad + ms * 1.5, my + ms * 0.80);
  /* the Li-ion recycling triangle */
  (function tri(tx) {
    x.beginPath();
    x.moveTo(tx + ms * 0.5, my + ms * 0.08);
    x.lineTo(tx + ms * 1.0, my + ms * 0.88);
    x.lineTo(tx, my + ms * 0.88);
    x.closePath(); x.stroke();
    x.font = "700 " + S(0.026) + "px system-ui, sans-serif";
    x.fillText("Li-ion", tx + ms * 0.12, my + ms * 0.74);
  })(pad + ms * 3.1);

  /* the barcode and its human-readable lot code */
  const by = S(0.850);
  let bx = pad;
  while (bx < size - pad) {
    const w = size * (0.0035 + r() * 0.010);
    if (r() > 0.35) { x.fillStyle = "#16181a"; x.fillRect(bx, by, w, S(0.055)); }
    bx += w + size * 0.005;
  }
  x.fillStyle = "#16181a";
  x.font = "400 " + S(0.028) + "px ui-monospace, monospace";
  line(String(L[5] || ""), 0.027);
  x.fillText(String(L[5] || ""), pad, S(0.935));

  /* the sticker stands proud of the foil it is stuck to */
  h.fillStyle = "#9a9a9a";
  h.fillRect(S(0.03), S(0.03), S(0.94), S(0.94));
  return { color: col, height: hi };
}

function label(size, seed, spec) {
  const col = canvas(size), hi = canvas(size);
  const x = col.getContext("2d"), h = hi.getContext("2d");
  const r = rng(seed || 61);
  const lines = (spec && spec.lines) || [];

  x.fillStyle = "#d8d5cc"; x.fillRect(0, 0, size, size);
  h.fillStyle = "#808080"; h.fillRect(0, 0, size, size);
  /* Paper tooth. */
  for (let n = 0; n < size * 10; n++) {
    const px = r() * size, py = r() * size;
    x.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.04)";
    x.fillRect(px, py, 1, 1);
  }
  /* The printed block. Deliberately dark on pale: this is text on a part a
     student is being asked to read, so it holds the same contrast the rest
     of the build does rather than whatever looks photogenic. */
  x.fillStyle = "#1a1c1e";
  const pad = size * 0.09;
  let y = pad + size * 0.10;
  lines.forEach(function (ln, i) {
    const big = i === 0;
    x.font = (big ? "700 " : "400 ") + Math.round(size * (big ? 0.115 : 0.075)) +
      "px ui-monospace, Menlo, Consolas, monospace";
    x.fillText(String(ln).slice(0, 22), pad, y);
    y += size * (big ? 0.155 : 0.105);
  });
  /* A barcode block, because every one of these has one and its absence is
     more noticeable than its presence. */
  const by = size * 0.74;
  let bx = pad;
  while (bx < size - pad) {
    const w = size * (0.004 + r() * 0.012);
    if (r() > 0.35) { x.fillStyle = "#1a1c1e"; x.fillRect(bx, by, w, size * 0.14); }
    bx += w + size * 0.006;
  }
  /* The sticker sits proud of what it is stuck to. */
  h.fillStyle = "#9a9a9a";
  h.fillRect(size * 0.02, size * 0.02, size * 0.96, size * 0.96);
  return { color: col, height: hi };
}

/* THE ROCKER FACE: I AND O.

   The owner, looking at a blank black rocker: "it needs to say off or on,
   correct?" Yes — and not with the words. The markings are IEC symbols
   and they are drawn rather than spelled:

     I   a bare vertical line   the circuit is CLOSED, so ON
     O   a circle               the circuit is OPEN, so OFF

   That is worth a student knowing as a symbol rather than a label,
   because the same pair turns up on extension leads, wall isolators,
   bench supplies and the back of every appliance, and half of them are
   moulded in black-on-black where the only thing you can read is the
   SHAPE.

   Drawn on the rocker itself, because that is where they live: one at
   each end, so whichever end is pressed in names the state.
   ===================================================================== */
function rockerFace(size, seed, spec) {
  const col = canvas(size), hi = canvas(size);
  const x = col.getContext("2d"), h = hi.getContext("2d");
  const S = function (f) { return Math.round(size * f); };
  /* the same vertical flip the panel needs — measured, not guessed */
  x.translate(0, size); x.scale(1, -1);
  h.translate(0, size); h.scale(1, -1);

  x.fillStyle = "#23282d"; x.fillRect(0, 0, size, size);
  h.fillStyle = "#808080"; h.fillRect(0, 0, size, size);

  /* I at the top end — a bare line, meaning a closed circuit */
  x.strokeStyle = "#e9edf1"; x.lineCap = "round";
  x.lineWidth = Math.max(3, S(0.055));
  x.beginPath(); x.moveTo(S(0.5), S(0.14)); x.lineTo(S(0.5), S(0.34)); x.stroke();
  /* O at the bottom end — a circle, meaning an open one */
  x.lineWidth = Math.max(3, S(0.048));
  x.beginPath(); x.arc(S(0.5), S(0.76), S(0.10), 0, Math.PI * 2); x.stroke();
  return { color: col, height: hi };
}

/* =====================================================================
   THE BACK OF A POWER SUPPLY, WITH EVERYTHING THAT IS PRINTED ON IT.

   The owner's question, on seeing a bare grey panel with a red switch on
   it: "where is the detailed writing to help students see the real
   thing?" It was nowhere, and that was the whole problem with the model.
   A real supply's back panel is COVERED in text, and the text is not
   decoration — it is the entire reason a technician looks at that face:

     the voltage the switch is currently set to
     the range the supply accepts at all
     the wattage, which is how you size a replacement
     and the warning, which is the only one a student ever gets

   A panel drawn without it is a picture of a switch. A panel drawn with
   it is the thing students have to read in a dark case with a torch, and
   reading it IS the skill.

   ONCE, NOT TILED. Same as the punchdown chart: this is a picture of one
   specific face, so it is clamped and mapped once across the part rather
   than repeated per world unit.

   The layout is keyed to the panel's own coordinates in bench-psu.js — a
   84 x 44 panel centred on zero — so the printed 115 and 230 land beside
   the switch they belong to rather than floating somewhere near it. */
function psuPlate(size, seed, spec) {
  const col = canvas(size), hi = canvas(size);
  const x = col.getContext("2d"), h = hi.getContext("2d");
  const S = function (f) { return Math.round(size * f); };
  const set230 = !!(spec && spec.set230);

  /* THE DECAL PROJECTS FROM THE PART'S THINNEST AXIS, AND FOR THIS PANEL
     THAT PROJECTION ARRIVES FROM BEHIND. Drawn straight, every line came
     out mirrored and in reverse order — legible only in a mirror, which
     is worse than no text at all because it looks like a rendering fault
     rather than a layout one.

     Flipping the CANVAS once here is the fix, rather than reversing the
     line order and mirroring each string at the call sites: one
     transform, applied before anything is drawn, and the drawing code
     below stays written the way the panel actually reads. */
  /* THE DECAL'S V AXIS IS FLIPPED, AND ONLY ITS V AXIS.

     Three guesses at this transform contradicted each other, because I
     was reading the answer off glyph shapes in a 3D render: upside-down
     letters in correct left-to-right order look "mirrored" at a glance,
     and that misreading sent me to a horizontal flip, then to both axes,
     then back. Settled in one render by painting a large green F at the
     texture's top-left with no transform and seeing where it came out —
     BOTTOM left. U preserved, V inverted.

     So: one vertical flip, applied to both canvases before anything is
     drawn, and the drawing code below stays written the way the panel
     reads. The lesson is the one the net bench's T568 label already
     taught and I had to learn twice — when two fixes fail in different
     directions, stop inferring the transform and measure it. */
  x.translate(0, size); x.scale(1, -1);
  h.translate(0, size); h.scale(1, -1);

  /* brushed steel ground */
  x.fillStyle = "#9aa1a8"; x.fillRect(0, 0, size, size);
  h.fillStyle = "#7f7f7f"; h.fillRect(0, 0, size, size);
  const r = rng(seed || 7);
  for (let n = 0; n < size * 6; n++) {
    const py = r() * size;
    x.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.08)";
    x.fillRect(0, py, size, 1);
  }

  /* THE 115 / 230 MARKINGS, beside the switch well. The panel runs
     x -42..42 and y -22..22; the selector sits at x -28, y -2, which is
     u 0.167. v is measured DOWN from the top, so a part at y +6 is above
     one at y -6. */
  x.fillStyle = "#a8342c";
  x.font = "700 " + S(0.050) + "px ui-monospace, Menlo, Consolas, monospace";
  x.textAlign = "center";
  /* CLEAR OF THE INLET. Its surround covers x -50..-26 and everything
     above y 3.5, so numbers at y +2 had their tops hidden behind it —
     and the hidden one was 115, the setting that does the damage. */
  x.fillText("115", S(0.090), S(0.500));
  x.fillText("230", S(0.090), S(0.674));
  /* a box round the one it is set to, so the STATE is readable and not
     only inferable from which way a moulded slider is thrown */
  x.strokeStyle = "#a8342c"; x.lineWidth = Math.max(2, S(0.006));
  x.strokeRect(S(0.090) - S(0.042), (set230 ? S(0.628) : S(0.454)), S(0.084), S(0.056));
  x.textAlign = "left";

  /* THE RATING PLATE, along the bottom where nothing is mounted. */
  const lx = S(0.040), ly = S(0.717), lw = S(0.400), lh = S(0.255);
  x.fillStyle = "#dcd9d0"; x.fillRect(lx, ly, lw, lh);
  x.strokeStyle = "#7d8288"; x.lineWidth = 1; x.strokeRect(lx, ly, lw, lh);
  x.fillStyle = "#16181a";
  let ty = ly + S(0.040);
  const put = function (t, f, w) {
    x.font = (w || "400") + " " + S(f) + "px ui-monospace, Menlo, Consolas, monospace";
    x.fillText(t, lx + S(0.014), ty);
    ty += S(f * 1.40);
  };
  put("POWER SUPPLY", 0.034, "700");
  put("MAX OUTPUT 350W", 0.026);
  put("INPUT 115/230V~", 0.026);
  put("50-60Hz  8A/4A", 0.026);
  x.fillStyle = "#a8342c";
  put("WARNING", 0.026, "700");
  x.fillStyle = "#16181a";
  put("SELECT VOLTAGE BEFORE USE", 0.023);

  /* the certification marks every one of these carries */
  x.fillStyle = "#16181a";
  x.font = "700 " + S(0.034) + "px system-ui, sans-serif";
  x.fillText("CE", S(0.520), S(0.913));
  x.fillText("UL", S(0.578), S(0.913));
  x.fillText("FCC", S(0.634), S(0.913));

  /* the sticker stands slightly proud of the steel */
  h.fillStyle = "#9c9c9c"; h.fillRect(lx, ly, lw, lh);
  return { color: col, height: hi };
}

/* TWO KINDS OF SURFACE, and confusing them is what turned a black keyboard
   into grey gravel on the first render.

   A PRINTED surface carries its own colour — a board is green with copper
   on it, a label is off-white with black text — so it replaces the part's
   colour entirely.

   A MATERIAL GRAIN carries no colour at all. Brushing, pebble, rubber
   tooth: these are near-white patterns that MULTIPLY over whatever colour
   the part already is, so a black keyboard stays black and gains a
   moulding texture, instead of becoming a grey speckled slab.

   `repeat` is how many times the tile lands per WORLD UNIT, and the parts
   here are ten to twenty units across. Numbers above one therefore put the
   tile down sixteen times over a keyboard, which drove the speckle below a
   pixel and turned a moulding into television static — twice, because the
   first correction made the specks bigger without fixing the repeat. Two
   to four tiles across a part is the range that reads. */
/* WHAT IS ACTUALLY IN USE, AND WHY THE REST IS NOT.

   pcb, label, brushed and anodised are applied to parts today. What they
   have in common is that their detail is STRUCTURED and mostly LINEAR —
   traces, silkscreen, printed text, drawn brushing lines. Structure of that
   kind minifies cleanly: as it gets smaller it blurs toward the average and
   still reads as what it is.

   moulded, rubber and steel are painted here and applied to nothing. Their
   detail is point noise — a pebble finish, rubber tooth, orange peel — and
   point noise does not minify. At the distance this bench is viewed from
   each speck falls below a pixel and the filter turns it into crawling
   static. I tuned it five times: static, then camouflage, then static
   again, then static from the relief map alone once the colour noise was
   removed. It is not a tuning problem.

   This is exactly the line drawn in the header: code generates structure,
   photographs carry material grain. These three are left painted and unused
   so they can be swapped for photographic tiles the moment those exist —
   the shot list is in tools/PHOTO-SHOT-LIST.md — rather than deleted and
   rebuilt from nothing. */
/* ---------------------------------------------------------------------
   WOODGRAIN — a desk, rather than a component.

   Every other surface in this file is a material a part is MADE of. This
   one is the thing a part is standing on, and it is here because the
   owner asked for it directly: a monitor on a dark anti-static mat and a
   monitor on a wooden desk are two different pictures, and the second is
   the one a student's own monitor is sitting on.

   Neutral greys, not browns. The part's own colour supplies the hue and
   this modulates it, which is how every other unprinted painter here
   works — put the brown in the texture as well and the result is brown
   twice over, with no way to lighten it without repainting.

   NOTE FOR THE OWNER: wood is outside the royal six, so it is shown as a
   preview before it goes anywhere else in the build.
   --------------------------------------------------------------------- */
function woodgrain(size, seed) {
  const col = canvas(size), hi = canvas(size);
  const x = col.getContext("2d"), h = hi.getContext("2d");
  const r = rng(seed || 23);
  x.fillStyle = "#dcdcdc"; x.fillRect(0, 0, size, size);
  h.fillStyle = "#808080"; h.fillRect(0, 0, size, size);

  /* Growth rings: broad bands running the length of the board, each one
     wandering slightly, because a grain of perfectly straight lines is a
     barcode. */
  let y = -size * 0.12;
  while (y < size * 1.12) {
    const w = size * (0.010 + r() * 0.055);
    const dark = 0.035 + r() * 0.085;
    const amp = size * (0.006 + r() * 0.028);
    const ph = r() * Math.PI * 2;
    const waves = 1 + Math.floor(r() * 2);
    x.strokeStyle = "rgba(0,0,0," + dark.toFixed(3) + ")";
    h.strokeStyle = "rgba(0,0,0," + (dark * 0.9).toFixed(3) + ")";
    x.lineWidth = h.lineWidth = w;
    x.beginPath(); h.beginPath();
    for (let px = 0; px <= size; px += size / 40) {
      const py = y + Math.sin(ph + (px / size) * Math.PI * 2 * waves) * amp;
      if (px === 0) { x.moveTo(px, py); h.moveTo(px, py); }
      else { x.lineTo(px, py); h.lineTo(px, py); }
    }
    x.stroke(); h.stroke();
    y += w + size * (0.004 + r() * 0.022);
  }
  /* Pores: short fine lines along the grain, which is what stops the
     bands reading as painted stripes. */
  /* Drawn TWICE, the second time shifted a whole tile to the left, so a
     stroke that runs off the right edge comes back on at the left and the
     tile is seamless. Without it the pore ends line up along the tile
     boundary and the desk shows a grid of vertical seams — which is
     exactly what the first render did. */
  x.lineWidth = Math.max(1, size / 700);
  for (let n = 0; n < size * 5; n++) {
    const py = r() * size, len = size * (0.06 + r() * 0.4), px = r() * size;
    const dy = (r() - 0.5) * 2;
    x.strokeStyle = "rgba(0,0,0," + (0.025 + r() * 0.05).toFixed(3) + ")";
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + len, py + dy); x.stroke();
    x.beginPath(); x.moveTo(px - size, py); x.lineTo(px - size + len, py + dy); x.stroke();
  }
  /* Plank seams. A desk is boards, not one continuous sheet, and the
     seams are what say "furniture" rather than "wood-coloured surface". */
  for (let k = 1; k < 4; k++) {
    const sy = (k / 4) * size;
    x.strokeStyle = "rgba(0,0,0,0.22)";
    x.lineWidth = Math.max(1.5, size / 300);
    x.beginPath(); x.moveTo(0, sy); x.lineTo(size, sy); x.stroke();
    x.strokeStyle = "rgba(255,255,255,0.16)";
    x.lineWidth = Math.max(1, size / 400);
    x.beginPath(); x.moveTo(0, sy + size / 220); x.lineTo(size, sy + size / 220); x.stroke();
    h.strokeStyle = "rgba(0,0,0,0.55)";
    h.lineWidth = Math.max(1.5, size / 300);
    h.beginPath(); h.moveTo(0, sy); h.lineTo(size, sy); h.stroke();
  }
  /* A few lighter figures, so it is not uniformly dark-on-light. */
  for (let n = 0; n < size / 12; n++) {
    const py = r() * size, len = size * (0.2 + r() * 0.6), px = r() * size;
    const dy = (r() - 0.5) * 3;
    x.strokeStyle = "rgba(255,255,255," + (0.04 + r() * 0.06).toFixed(3) + ")";
    x.lineWidth = Math.max(1, size / 260);
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + len, py + dy); x.stroke();
    x.beginPath(); x.moveTo(px - size, py); x.lineTo(px - size + len, py + dy); x.stroke();
  }
  return { color: col, height: hi };
}

/* =====================================================================
   THE T568A / T568B COLOUR CODE, PRINTED ON THE BACK OF A PATCH PANEL.

   This is the strip a technician reads while punching down, and it is
   the reason a patch panel is a teaching object rather than a box with
   holes in it. It is PRINT, so it is generated here rather than modelled
   as geometry or photographed: the build's division is geometry for
   form, procedural for material and print, and photographs only where
   the surface genuinely IS a picture.

   Both standards, because the single most common cabling fault in a
   small office is one end done to A and the other to B. That gives a
   cable that passes a continuity test and fails a wiremap — it is not
   an open or a short, so the cheap tester says it is fine. The two rows
   side by side are what makes that visible: pairs 2 and 3 swap, and
   nothing else moves.

   Drawn with the WHITE-STRIPED conductor beside its solid partner,
   because that pairing is the thing students get wrong — white/orange
   and orange are one pair and go next to each other, and a student who
   reads the code as eight separate colours will split them.
   ===================================================================== */
function punchdown(size, seed, spec) {
  const col = canvas(size), hi = canvas(size);
  const x = col.getContext("2d"), h = hi.getContext("2d");

  x.fillStyle = "#e7e3d8"; x.fillRect(0, 0, size, size);
  h.fillStyle = "#808080"; h.fillRect(0, 0, size, size);

  /* NOT MIRRORED, AND THAT WAS THE THIRD ANSWER TO THIS.

     A decal's u projects straight off world x, so a label lying flat
     reads correctly from one side of the bench and reversed from the
     other. Seen from BEHIND the panel it reads backwards, and two
     attempts went into fixing that — rotating the plate 180 degrees,
     which does nothing because the projection is taken after the
     rotation and turns with it, and mirroring this canvas, which just
     moves the problem to the other side.

     The assumption underneath both was wrong. The net bench is viewed
     from the FRONT: that is where its camera sits, where the hops run
     left to right, and where a student reads it. The rear close-up that
     showed the label backwards is a preview angle written for this one
     part. Drawn straight, it reads correctly from the view the lab
     actually uses.

     Worth remembering as a shape: two fixes in a row failing the same
     way is usually the premise being wrong rather than the fix. */

  /* T568B, then T568A. Each entry is [solid colour, striped?] in pin
     order 1..8. The only difference between the standards is that the
     orange and green pairs trade places. */
  const O = "#d4691f", G = "#2f8f4a", B = "#2f5fb0", N = "#6b4a2f";
  const B568 = [[O,1],[O,0],[G,1],[B,0],[B,1],[G,0],[N,1],[N,0]];
  const A568 = [[G,1],[G,0],[O,1],[B,0],[B,1],[O,0],[N,1],[N,0]];

  const pad = Math.round(size * 0.06);
  const rowH = Math.round((size - pad * 3) / 2);
  const cellW = (size - pad * 2) / 8;

  function row(list, top, name) {
    x.fillStyle = "#1a1d21";
    x.font = "bold " + Math.round(size * 0.075) + "px system-ui, sans-serif";
    x.textBaseline = "top";
    x.fillText(name, pad, top);
    const barTop = top + Math.round(size * 0.085);
    const barH = rowH - Math.round(size * 0.085);
    list.forEach(function (c, i) {
      const cx = pad + i * cellW;
      x.fillStyle = c[1] ? "#f4f2ec" : c[0];
      x.fillRect(cx, barTop, cellW - 2, barH);
      if (c[1]) {
        /* the stripe, so a white/colour conductor is not a blank cell */
        x.fillStyle = c[0];
        for (let k = 0; k < 4; k++) {
          x.fillRect(cx, barTop + (barH / 4) * k + barH / 8, cellW - 2, barH / 9);
        }
      }
      x.strokeStyle = "#3a3d42"; x.lineWidth = Math.max(1, size / 320);
      x.strokeRect(cx, barTop, cellW - 2, barH);
      /* the pin number, because the code is useless without it */
      x.fillStyle = c[1] ? "#1a1d21" : "#f4f2ec";
      x.font = "bold " + Math.round(size * 0.055) + "px system-ui, sans-serif";
      x.fillText(String(i + 1), cx + cellW * 0.36, barTop + barH * 0.62);
      /* relief: the print sits just proud of the label stock */
      h.fillStyle = "#8c8c8c"; h.fillRect(cx, barTop, cellW - 2, barH);
    });
  }
  row(B568, pad, "T568B");
  row(A568, pad * 2 + rowH, "T568A");

  /* `color`, NOT `colour`. Every painter in this file returns
     { color, height } and the caller reads `.color`. This one was written
     with the British spelling used in every comment and label in this
     build, so surface() handed back a map of undefined, the material came
     out with no texture at all, and the part rendered as a BLACK
     RECTANGLE. Nothing threw. The check at the foot of this file now
     refuses a painter that returns the wrong key. */
  return { color: col, height: hi };
}

/* =====================================================================
   A PHONE HOME SCREEN, GENERATED.

   The lit screen was a photograph, and the photograph was a teardown
   shot: a handset on a wooden bench with annotation text printed across
   it — "PANEL … TO DISPLAY" over the top, "MAIN… BATTE… CONNEC…" down
   the side. Cropped tight enough to lose the desk, those labels are cut
   in half; cropped loose enough to keep them whole, there is a desk
   inside the phone. There is no crop that fixes it, because the defect
   is IN the picture.

   The owner offered a screenshot of their own phone and then chose to
   have it generated instead, which is the right call twice over: it
   keeps their city, their bank folder, their health apps and a personal
   message out of courseware that ships to students, and it follows the
   rule this repo already learned on the midframe — DETAIL FINER THAN THE
   GEOMETRY HAS TO BE GENERATED, or it is a smear as soon as the camera
   comes close.

   WHAT MAKES A SCREEN READ AS A PHONE is structure, not which apps are
   on it: a dark ground lighter toward the foot, a status bar, a search
   pill beside a weather chip, a grid of labelled folders each showing a
   3 x 3 of tiny icons, page dots, and a dock. All of that is drawn here
   and none of it is anybody's.

   THE CANVAS IS TALL, NOT SQUARE. Every other painter here takes the
   square from canvas(), which is right for a material that tiles. This
   one is a picture laid once on a phone screen, and a square texture
   stretched onto a 0.46 sheet gives square texels barely 200 pixels to
   the virtual unit vertically against 1024 horizontally — folder labels
   come out six pixels tall. Built at size x size/ASPECT the texels are
   square on the part and the type is legible.

   COLOURS ARE THE ROYAL SIX plus neutrals — green, purple, blue, red,
   silver, yellow. A real phone's icons are every colour there is; those
   are outside the palette and would need previewing first, so the icon
   set here is drawn from the six. Say the word and I will preview a
   wider set.
   ===================================================================== */

/* The sheet's width over its depth. ONE NUMBER, exported, because three
   things have to agree about it: this painter, the sheet bench-mobile
   sizes for it, and the load-time check that refuses a stretched decal.
   1080 x 2340 is the commonest phone panel there is. */
export const PHONE_SCREEN_ASPECT = 1080 / 2340;

function phoneHome(size, seed) {
  const A = PHONE_SCREEN_ASPECT;
  const HP = Math.round(size / A);              /* texture is TALL */
  /* DRAWN TOP-DOWN IN PIXELS, FLIPPED ONCE AT THE END.

     The first cut flipped the canvas up front, the way psuPlate does, and
     then scaled the context to virtual units so the layout could be
     written in fractions. Both were mistakes here and the render said so:
     every folder label came out horizontally squashed — "Media" as
     "Meda", "Tools" as "Tods" — because the font was being set to a
     FRACTIONAL pixel size (0.034px) inside a scaled context. Browsers
     round that to nothing and then blow the result up, so the glyph
     metrics are wrong before the scale ever touches them.

     So: real pixel coordinates, real font sizes, ordinary top-down
     drawing, and one flip of the finished image at the end. Same result,
     none of the transform traps. */
  const work = document.createElement("canvas");
  work.width = size; work.height = HP;
  const x = work.getContext("2d");
  const U = size;                               /* 1 virtual unit = the screen's width */
  const P = function (v) { return v * U; };     /* virtual -> pixels, both axes */

  const rr = function (vx, vy, vw, vh, vr, fill) {
    const cx = P(vx), cy = P(vy), w = P(vw), hh = P(vh), r = P(vr);
    x.beginPath();
    x.moveTo(cx + r, cy);
    x.arcTo(cx + w, cy, cx + w, cy + hh, r);
    x.arcTo(cx + w, cy + hh, cx, cy + hh, r);
    x.arcTo(cx, cy + hh, cx, cy, r);
    x.arcTo(cx, cy, cx + w, cy, r);
    x.closePath();
    x.fillStyle = fill; x.fill();
  };
  const dot = function (vx, vy, vr, fill) {
    x.beginPath(); x.arc(P(vx), P(vy), P(vr), 0, 6.283); x.fillStyle = fill; x.fill();
  };
  const txt = function (s, vx, vy, vpx, fill, align, weight) {
    x.fillStyle = fill;
    x.textAlign = align || "left";
    x.textBaseline = "middle";
    x.font = (weight || 500) + " " + Math.round(P(vpx)) +
      "px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    x.fillText(s, P(vx), P(vy));
  };

  const H = 1 / A;                              /* virtual height of the screen */

  /* ---- the wallpaper: near black, lifting toward the foot ---- */
  const g = x.createLinearGradient(0, 0, 0, P(H));
  g.addColorStop(0.00, "#04060a");
  g.addColorStop(0.46, "#080d13");
  g.addColorStop(0.72, "#1b242d");
  g.addColorStop(0.86, "#243039");
  g.addColorStop(1.00, "#0b1016");
  x.fillStyle = g; x.fillRect(0, 0, size, HP);

  let n = (seed >>> 0) || 7;
  const rnd = function () { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; };

  /* stars, sparse and dim, over the dark upper half only. A squared term
     in the hash, because a linear one lays them on visible diagonals and
     reads as a printed pattern rather than as sky. */
  for (let i = 0; i < 120; i++) {
    const sx = rnd(), sy = rnd() * H * 0.62;
    dot(sx, sy, 0.0011 + rnd() * rnd() * 0.0024,
        "rgba(226,233,240," + (0.14 + rnd() * 0.36).toFixed(3) + ")");
  }

  /* two ridge lines low down, the nearer one darker, so the ground reads
     as a photograph of somewhere rather than as a flat panel */
  const ridge = function (base, amp, fill) {
    x.beginPath();
    x.moveTo(0, P(base));
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      x.lineTo(P(t), P(base + Math.sin(t * 5.4 + 0.7) * amp - Math.sin(t * 2.1 + 2.2) * amp * 1.5));
    }
    x.lineTo(size, HP); x.lineTo(0, HP); x.closePath();
    x.fillStyle = fill; x.fill();
  };
  ridge(H * 0.60, 0.030, "#141d25");
  ridge(H * 0.72, 0.022, "#080d12");

  /* ---- status bar ---- */
  txt("09:41", 0.048, 0.052, 0.042, "#eef2f6", "left", 600);
  for (let i = 0; i < 4; i++) {
    const bh = 0.011 + i * 0.009;
    x.fillStyle = "#dfe6ec";
    x.fillRect(P(0.770 + i * 0.021), P(0.070 - bh), P(0.013), P(bh));
  }
  /* wifi, as two arcs and a dot */
  x.strokeStyle = "#dfe6ec"; x.lineCap = "round";
  [0.034, 0.020].forEach(function (r) {
    x.beginPath();
    x.arc(P(0.882), P(0.074), P(r), Math.PI * 1.25, Math.PI * 1.75);
    x.lineWidth = P(0.008); x.stroke();
  });
  dot(0.882, 0.070, 0.006, "#dfe6ec");
  /* battery, as an outline with a fill inside it — a solid blob reads as
     nothing, and the level is the only part anybody looks at */
  rr(0.920, 0.040, 0.062, 0.030, 0.009, "#dfe6ec");
  rr(0.9235, 0.0435, 0.048, 0.023, 0.006, "#0a0f15");
  rr(0.9235, 0.0435, 0.040, 0.023, 0.006, "#dfe6ec");
  rr(0.984, 0.049, 0.008, 0.012, 0.003, "#dfe6ec");

  /* ---- search pill and weather chip ---- */
  rr(0.048, 0.118, 0.520, 0.094, 0.047, "#2f8f4a");           /* royal green */
  dot(0.104, 0.165, 0.027, "#f4f7f9");
  txt("Search", 0.156, 0.167, 0.040, "rgba(244,247,249,0.94)", "left", 500);
  /* THE MICROPHONE, AND WHICH WAY A CANVAS ARC SWEEPS.
     This was drawn upside down — a capsule with its cradle arcing over
     the TOP of it, which reads as a pair of headphones, and the owner
     spotted it immediately. The cause is that canvas y points DOWN, so
     arc(cx, cy, r, Math.PI, 0) sweeps clockwise through 3*PI/2, which is
     UPWARD on screen. A cradle that hangs BELOW the capsule runs from 0
     to PI, through PI/2. A mic is four pieces and all four have to agree
     about which way is down: capsule, cradle under it, stem, foot. */
  rr(0.4675, 0.134, 0.017, 0.030, 0.0085, "#f4f7f9");         /* the capsule */
  x.beginPath();
  x.arc(P(0.476), P(0.163), P(0.0155), 0, Math.PI);           /* cradle, BELOW it */
  x.lineWidth = P(0.007); x.strokeStyle = "#f4f7f9"; x.stroke();
  rr(0.4735, 0.1785, 0.005, 0.011, 0.002, "#f4f7f9");         /* the stem */
  rr(0.4655, 0.1885, 0.021, 0.005, 0.0025, "#f4f7f9");        /* the foot */
  x.beginPath(); x.arc(P(0.528), P(0.165), P(0.021), 0, 6.283);
  x.lineWidth = P(0.008); x.stroke();                          /* lens */

  rr(0.606, 0.118, 0.346, 0.094, 0.047, "#3a6ea8");           /* royal blue */
  dot(0.700, 0.146, 0.020, "#d8b23a");                        /* royal yellow sun */
  x.beginPath();
  x.arc(P(0.664), P(0.178), P(0.028), 0, 6.283);
  x.arc(P(0.696), P(0.166), P(0.021), 0, 6.283);
  x.fillStyle = "#eef3f8"; x.fill();
  txt("72\u00b0", 0.772, 0.152, 0.046, "#f2f6fa", "left", 600);
  txt("Ridgeway", 0.772, 0.190, 0.028, "rgba(242,246,250,0.88)", "left", 400);

  /* ---- two rows of folders ----
     Generic labels on purpose: a student should recognise this as a phone
     at a glance and then look at the HARDWARE, not stop to read the apps.
     Pulled up from 0.95 and 1.35 — the first cut left a dead band of
     wallpaper the height of the search bar between the chip and the first
     row, which reads as a screen with something missing off it. */
  const ICON = ["#2f8f4a", "#3a6ea8", "#7a4f9e", "#a8433a", "#d8b23a", "#9aa4ad"];
  const FOLDERS = [
    ["Apps", 9], ["Media", 8], ["Tools", 9], ["Mail", 6], ["Photos", 7],
    ["Maps", 5], ["Notes", 9], ["Store", 6], ["Phone", 8], ["Settings", 4]
  ];
  const COLS = 5, FW = 0.150, GAPX = (1 - COLS * FW) / (COLS + 1);
  FOLDERS.forEach(function (f, i) {
    const c = i % COLS, r = (i / COLS) | 0;
    const fx = GAPX + c * (FW + GAPX);
    const fy = 0.760 + r * 0.360;
    rr(fx, fy, FW, FW, 0.044, "rgba(10,15,21,0.80)");
    const pad = FW * 0.135, cell = (FW - pad * 2) / 3, ic = cell * 0.74;
    for (let k = 0; k < f[1]; k++) {
      const kc = k % 3, kr = (k / 3) | 0;
      rr(fx + pad + kc * cell + (cell - ic) / 2,
         fy + pad + kr * cell + (cell - ic) / 2,
         ic, ic, ic * 0.30, ICON[(k + i * 3) % ICON.length]);
    }
    txt(f[0], fx + FW / 2, fy + FW + 0.054, 0.036, "#e9eff5", "center", 500);
  });

  /* ---- page dots ---- */
  for (let i = 0; i < 3; i++) {
    dot(0.452 + i * 0.048, 1.640, i === 1 ? 0.011 : 0.008,
        i === 1 ? "#f2f6fa" : "rgba(242,246,250,0.40)");
  }

  /* ---- the dock ---- */
  rr(0.042, 1.716, 0.916, 0.196, 0.062, "rgba(8,12,18,0.74)");
  const DOCK = ["#2f8f4a", "#3a6ea8", "#7a4f9e", "#a8433a", "#9aa4ad"];
  DOCK.forEach(function (c, i) {
    const dx = 0.088 + i * 0.182;
    rr(dx, 1.756, 0.116, 0.116, 0.034, c);
    /* a pale mark inside each, so the dock is not five blank tiles */
    x.globalAlpha = 0.88;
    if (i === 0) dot(dx + 0.058, 1.814, 0.026, "#f4f7f9");
    else if (i === 1) rr(dx + 0.028, 1.792, 0.060, 0.044, 0.008, "#f4f7f9");
    else if (i === 2) {
      x.beginPath();
      x.moveTo(P(dx + 0.034), P(1.786)); x.lineTo(P(dx + 0.086), P(1.814));
      x.lineTo(P(dx + 0.034), P(1.842)); x.closePath();
      x.fillStyle = "#f4f7f9"; x.fill();
    } else if (i === 3) {
      rr(dx + 0.026, 1.788, 0.064, 0.012, 0.005, "#f4f7f9");
      rr(dx + 0.026, 1.808, 0.064, 0.012, 0.005, "#f4f7f9");
      rr(dx + 0.026, 1.828, 0.042, 0.012, 0.005, "#f4f7f9");
    } else {
      x.beginPath(); x.arc(P(dx + 0.058), P(1.814), P(0.026), 0, 6.283);
      x.lineWidth = P(0.010); x.strokeStyle = "#f4f7f9"; x.stroke();
    }
    x.globalAlpha = 1;
  });
  /* the home indicator */
  rr(0.330, 1.960, 0.340, 0.013, 0.0065, "rgba(236,241,246,0.80)");

  /* ---- THE ONE FLIP, at the end ----
     The decal's V axis is flipped, and only its V axis — settled on the
     PSU plate by painting a green F at the texture's top-left with no
     transform and watching it come out bottom-left. Flipping the finished
     image rather than the drawing context keeps every coordinate above
     written the way the screen actually reads. */
  const col = document.createElement("canvas");
  col.width = size; col.height = HP;
  const c2 = col.getContext("2d");
  c2.translate(0, HP); c2.scale(1, -1);
  c2.drawImage(work, 0, 0);

  /* Glass is flat. No relief anywhere on a lit screen. */
  const hi = document.createElement("canvas");
  hi.width = size; hi.height = HP;
  const h = hi.getContext("2d");
  h.fillStyle = "#808080"; h.fillRect(0, 0, size, HP);

  return { color: col, height: hi };
}

const PAINTERS = {
  /* 0.11 means roughly three tiles across a twenty-six unit desk, which
     is the two-to-four range the note above says reads. The first value
     here was 0.9 — twenty-three tiles — and the desk came out looking
     like woven fabric. That note was written after the same mistake was
     made on a keyboard moulding, twice. Reading it would have saved a
     third round of it. */
  woodgrain: { paint: woodgrain, printed: false, repeat: 0.11, relief: 0.18 },
  /* ONCE, NOT TILED. The colour code is a single printed strip on the
     back of one panel, not a material that repeats — `once` is what the
     cell label taught this file, and it is the same situation. */
  punchdown: { paint: punchdown, printed: true, repeat: 1.0, once: true },
  /* A DECAL, not a material: the owner's own reference of a cracked screen,
     mapped once onto the cover glass rather than repeated. Declared here
     with photo:true so it takes the tiles.js path, and the `decal` flag on
     the tile itself is what clamps it instead of tiling it. */
  /* THE OWNER'S OWN REFERENCE IMAGES, as decals rather than materials.
     photo:true sends them down the tiles.js path; the `decal` flag on each
     tile is what clamps them instead of tiling them, and printed:true is
     what stops the part's own colour being multiplied through a picture
     that already carries its own. */
  topGlassBlack: { photo: true, printed: true, repeat: 1 },
  phoneHome:     { paint: phoneHome, printed: true, repeat: 1, once: true },
  backCover:     { photo: true, printed: true, repeat: 1 },
  polariserFlat: { photo: true, printed: true, repeat: 1 },
  oledPanelFlat: { photo: true, printed: true, repeat: 1 },
  flexFlat:      { photo: true, printed: true, repeat: 1 },
  midframeFlat:  { photo: true, printed: true, repeat: 1 },
  boardFlat:     { photo: true, printed: true, repeat: 1 },
  cellGoodFace:    { photo: true, printed: true, repeat: 1 },
  cellSwollenFace: { photo: true, printed: true, repeat: 1 },
  goldFlex:        { photo: true, printed: true, repeat: 1 },
  pcb:      { paint: pcb,      printed: true,  repeat: 0.42 },
  label:    { paint: label,    printed: true,  repeat: 0.30 },
  psuPlate: { paint: psuPlate, printed: true,  repeat: 1.0, once: true },
  rockerFace: { paint: rockerFace, printed: true, repeat: 1.0, once: true },
  /* `once` — laid ONCE across the part and clamped, not tiled. A battery
     label is a picture of a specific object, and tiled it is the same six
     lines repeated across a cell and cut at the seam. */
  cellFace: { paint: cellFace, printed: true,  repeat: 1.0, once: true },
  brushed:  { paint: brushed,  printed: false, repeat: 0.22 },
  moulded:  { paint: moulded,  printed: false, repeat: 0.35 },
  rubber:   { paint: rubber,   printed: false, repeat: 0.60 },
  anodised: { paint: anodised, printed: false, repeat: 0.20 },
  alloy:    { paint: alloy,    printed: false, repeat: 0.16 },
  shell:    { paint: shellMatte, printed: false, repeat: 0.09 },
  ito:      { paint: ito,      printed: false, repeat: 0.55 },
  /* THE "TWO TO FOUR TILES ACROSS A PART" RANGE DOES NOT APPLY HERE, and
     that is worth saying because this file has been wrong about the
     number three times in the other direction.

     That range is for MATERIAL GRAIN — brushing, moulding, weave — where
     more tiles means the grain stops reading as grain. A pixel grid is
     not grain: it is a structure with a real count, and the honest thing
     is to draw enough of them. At 0.58 the filter had thirty-six triads
     across a phone screen, each stripe about two pixels on the canvas,
     and it aliased into confetti. 1.60 puts about a hundred across, which
     averages to a neutral field at bench distance and resolves into
     stripes when the camera comes in — which is how subpixels behave. */
  subpixel: { paint: subpixel, printed: true,  repeat: 1.60 },
  steel:    { paint: steel,    printed: false, repeat: 0.30 },
  /* PHOTOGRAPHED, not painted — there is no `paint` here on purpose, and
     asking for it without a tile behind it throws. Dust is the one surface
     in the set that is a FAULT rather than a material, and it is also the
     one that defeated every attempt to generate it: felted lint is exactly
     the irregular grain that reads as fake the moment code makes it. */
  dust:     { photo: true,     printed: false, repeat: 0.55 },
  /* PHOTOGRAPHED RUBBER, from the owner's feeder rollers. It replaces
     nothing — `rubber` above is still there and still right for a platen,
     which is smooth. This is the pickup tyre, and the difference that
     matters to a student is that a tyre has GRAIN and a glazed band does
     not, so the grain has to be real enough to be missed when it goes.
     Repeat is tighter than the generated surfaces because the tile is cut
     from a 32-pixel patch of a real barrel: stretched wide it turns to
     soup, landed small it reads as rubber. */
  tyre:     { photo: true,     printed: false, repeat: 1.0, relief: 0.30 }
};

/* A texture built from a photograph decodes asynchronously, and this scene
   renders on demand rather than every frame — so a tile that arrives after
   the first draw would sit there invisible until something else asked for a
   frame. The renderer hands us a way to ask for one. */
var askForFrame = function () {};
export function onTileReady(fn) { askForFrame = fn || function () {}; }

/* Build (or fetch) a surface. Returns { map, normalMap } ready to hang on a
   material, or null for a name nobody has painted — which throws, rather
   than silently drawing a part flat and leaving somebody to wonder why one
   board out of fourteen looks wrong. */
/* ---------------------------------------------------------------------
   HOW BIG TO PAINT

   The machines this runs on are a mixture: some are current, some are
   school-issue laptops several years old on integrated graphics. Guessing
   from the user agent is guessing; core count is a proxy for the wrong
   thing. So MEASURE, once, on the actual machine, with the actual work —
   paint one small tile and time it. A laptop that takes a long time over a
   128-pixel square is going to struggle with a 1024-pixel one, and this
   costs a couple of milliseconds to find out.

   The floor is deliberately not tiny. Dropping to 128 would make the
   silkscreen on a board unreadable, and an unreadable label is worse than
   no label — so a slow machine gets 256 and a plainer surface rather than
   a blurred one. */
let BUDGET = 0;
function textureSize() {
  if (BUDGET) return BUDGET;
  let ms = 0;
  try {
    const t0 = (window.performance && performance.now) ? performance.now() : Date.now();
    moulded(128, 3);
    const t1 = (window.performance && performance.now) ? performance.now() : Date.now();
    ms = t1 - t0;
  } catch (e) { ms = 99; }
  BUDGET = ms > 24 ? 256 : (ms > 7 ? 512 : 1024);
  return BUDGET;
}

/* What the machine settled on, so the verifier can report it rather than
   nobody ever knowing which tier a class is actually getting. */
export function textureTier() {
  return { size: textureSize() };
}

/* Turn a painter's grey HEIGHT canvas into a usable tangent-space normal
   map by forcing the blue channel to 255. Red and green keep whatever the
   painter drew, so the perturbation is theirs; blue stops claiming every
   normal is lying flat in the surface.

   Done here rather than in each painter because every painter writes grey
   height and every one of them was wrong in the same way. */
function asNormalMap(height) {
  const w = height.width, h = height.height;
  const out = canvas(w);
  const c = out.getContext("2d");
  c.drawImage(height, 0, 0);
  const img = c.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) d[i + 2] = 255;
  c.putImageData(img, 0, 0);
  return out;
}

/* Reading a painter's declared tiling rate before the painter itself has
   been looked up, so the cache key can include the override. Throws the
   same message the lookup below would, so a typo is caught in one place. */
function def0(name) {
  const d = PAINTERS[name];
  if (!d) {
    throw new Error('surface: "' + name + '" is not a surface anybody has painted. ' +
      "Add it to PAINTERS in assets/surface.js, or take it off the part.");
  }
  return d;
}

export function surface(name, THREE, size, seed, spec) {
  if (!name) return null;
  const px = size || textureSize();
  /* A PART MAY OVERRIDE THE TILING RATE, AND SOMETIMES IT HAS TO.

     The comment below says the repeat "belongs to the material" — that
     brushing is fine and silkscreen is coarse whatever they are wrapped
     around — and that is true of the PATTERN. It is not true of how many
     pixels of it survive on screen, and that is decided by the size of the
     part it lands on, not by the material.

     `moulded` proved it. It is a careful painter: point noise in the
     HEIGHT map only, with three recorded attempts at making it visible in
     colour that produced television static and then camouflage. Its
     default repeat is tuned for the small wear-bench parts it was written
     for. Put the same painter on a handset's back cover — the largest flat
     slab on that bench — and each speck falls below a pixel again, and it
     came back as exactly the static its own comment warns about.

     So a part may pass `skin: { kind: "moulded", repeat: 0.12 }`. The
     default stays the material's, which is right for almost everything;
     the override exists for the case where the same material has to
     cover something an order of magnitude larger. */
  const rep = (spec && typeof spec.repeat === "number") ? spec.repeat : def0(name).repeat;
  const key = name + ":" + px + ":" + (seed || 0) + ":" + rep + ":d:" +
    (spec && spec.lines ? spec.lines.join("|") : "");
  if (CACHE[key]) return CACHE[key];
  const def = PAINTERS[name];
  if (!def) {
    throw new Error('surface: "' + name + '" is not a surface anybody has painted. ' +
      "Add it to PAINTERS in assets/surface.js, or take it off the part.");
  }

  /* ---- photographed surfaces ---- */
  if (def.photo) {
    const t = tileFor(name);
    if (!t) {
      throw new Error('surface: "' + name + '" is a photographed surface with no tile ' +
        "behind it. Add it to TILES in assets/tiles.js, or take it off the part.");
    }
    /* A TILE REPEATS; A DECAL DOES NOT.

       Every photographed surface here until now was a MATERIAL — rubber
       grain, paper dust — cut square and made seamless so it can wrap a
       cylinder any number of times. A picture of a specific thing is the
       opposite: a screen showing a map, a printed battery label, a board
       with its own components in their own places. Repeating one of those
       is a kaleidoscope, and tiling it four times across a phone screen
       says the phone is showing four maps.

       So a tile may declare `decal: true`, and then it is stretched ONCE
       across the part and clamped at the edges. It is the mode you want
       whenever the image is a picture of the object rather than a sample
       of what the object is made of. */
    const decal = !!t.decal;
    const img = new Image();
    const tex = new THREE.Texture(img);
    tex.wrapS = tex.wrapT = decal ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    /* A TILE MAY DECLARE WHICH RECTANGLE OF ITSELF IS THE PICTURE.

       The handset's lit screen WAS a photograph — a phone lying on a
       wooden bench — and the part that wants it is the PANEL, which
       should show a screen rather than a picture of a phone on a desk.
       Laid whole it came out as a phone inside a phone with the desk
       showing round the edges, so it grew a `crop`.

       That screen is GENERATED now (see phoneHome above) and the
       photograph is gone from the build, because the shot was a teardown
       reference with annotation text printed across it: no crop keeps
       the labels whole AND loses the desk. `crop` stays because the
       other photographed tiles still use it.

       It had been getting away with it because the decal UV rescale was
       broken and happened to show a middle slice of the image that was
       mostly screen. Fixing the mapping revealed the real framing, which
       is the honest outcome: the crop is now declared rather than
       arrived at by accident. `crop` is [u0, v0, u1, v1] in image space,
       origin top-left, which is how anybody reading the picture would
       describe it. */
    const cr = t.crop;
    tex.repeat.set(decal ? (cr ? cr[2] - cr[0] : 1) : rep,
                   decal ? (cr ? cr[3] - cr[1] : 1) : rep);
    if (decal && cr) tex.offset.set(cr[0], cr[1]);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    img.onload = function () { tex.needsUpdate = true; askForFrame(); };
    img.src = t.src;
    /* Relief, only when the tile ships its own normal map.

       Driving relief from the COLOUR image is what the dust tile must never
       do: a photograph carries its own baked shading, and reading that as
       height doubles the lighting — on felted lint it comes out as gravel.
       So the rule is not "photographs get no relief", it is "relief has to
       be a normal map somebody actually made". The tyre tile is high-passed
       and has one baked from the grain alone; dust has none and gets none. */
    var nrm = null;
    if (t.normalSrc) {
      var nimg = new Image();
      nrm = new THREE.Texture(nimg);
      nrm.wrapS = nrm.wrapT = decal ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
      nrm.repeat.set(decal ? 1 : rep, decal ? 1 : rep);
      nrm.anisotropy = 8;
      /* NOT sRGB. A normal map is a vector per texel, not a colour, and
         decoding it through the sRGB curve bends every one of them. */
      nimg.onload = function () { nrm.needsUpdate = true; askForFrame(); };
      nimg.src = t.normalSrc;
    }
    /* A decal carries its own colour completely — it is a photograph of
       the thing, not a grain to multiply over a part's colour — so it is
       marked `printed`, which is what stops the part's own colour being
       multiplied through it and washing it out. */
    CACHE[key] = { map: tex, normalMap: nrm, printed: decal,
      repeat: decal ? 1 : rep, relief: def.relief };
    return CACHE[key];
  }

  const built = def.paint(px, seed, spec);
  const map = new THREE.CanvasTexture(built.color);
  /* A PAINTED SURFACE CAN BE A ONE-OFF TOO, and until now only a
     PHOTOGRAPHED one could.

     `decal: true` on a tile has meant "this is a picture of a specific
     thing, so lay it once across the part and clamp the edges" since the
     handset's screens went on. Everything painted was assumed to be a
     MATERIAL — grain that tiles — and for brushing and silkscreen that is
     right.

     A printed LABEL is not a material. It is a picture of a specific
     thing that happens to be generated rather than photographed, and
     tiled it comes out as the same six lines of text repeated across a
     battery, cut at the seam. So a painter may declare `once: true` and
     it takes the same path a photographed decal takes. */
  const once = !!def.once;
  map.wrapS = map.wrapT = once ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  /* How many times the tile lands per world unit. Set here rather than on
     the part, because it belongs to the material: brushing is fine and
     silkscreen is coarse whatever they are wrapped around. */
  map.repeat.set(once ? 1 : rep, once ? 1 : rep);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  /* THE HEIGHT IMAGE IS NOT A NORMAL MAP, AND HANDING IT OVER AS ONE WAS
     WRONG FOR THE WHOLE LIFE OF THIS FILE.

     The note that used to sit here said the greys are "already centred on
     128 so a flat area reads as pointing straight out". They are centred
     on 128 in all THREE channels, and that is the problem. A tangent-space
     normal map encodes a direction: x and y in red and green centred on
     128, and z in BLUE, where flat is 255. At blue 128 the z component
     decodes to zero, so every normal lies flat in the surface — the
     maximum possible perturbation, everywhere, on every texel.

     That is why a painter as careful as `moulded` — which writes nothing
     but faint alpha-9% specks, and whose own comment records three
     attempts at taming it — came back as television static the moment it
     went on a large part. It was never the painter. Its faint specks were
     being amplified into full-strength sideways normals.

     It also explains something odd about this build: eleven of the
     thirteen benches declare no skin at all. The one surface layer the
     engine has was unusable and nobody wrote down why.

     The fix is to raise the blue channel to 255, which turns the painters'
     grey height fields into proper flat-facing normals carrying exactly
     the red/green perturbation they intended and no more. */
  const normalMap = new THREE.CanvasTexture(asNormalMap(built.height));
  normalMap.wrapS = normalMap.wrapT = once ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  normalMap.repeat.set(once ? 1 : rep, once ? 1 : rep);
  normalMap.anisotropy = 8;
  CACHE[key] = { map: map, normalMap: normalMap,
    printed: !!def.printed, repeat: rep, relief: def.relief };
  return CACHE[key];
}

/* Is this surface a DECAL — a picture of a specific thing, mapped once
   across a part — rather than a MATERIAL that repeats?

   Two places need the answer and they are in different files: surface.js
   clamps the texture instead of tiling it, and scene.js has to normalise
   the part's UVs to its own extent instead of using world coordinates.
   When only surface.js knew, the clamped decal showed the corner of the
   picture that happened to fall in the first world unit and smeared the
   edge pixel across everything else. */
export function isDecal(name) {
  const n = name && name.kind ? name.kind : name;
  /* A PAINTED one-off counts, and scene.js rescaling the UVs to the part
     is the whole point of the answer being yes. Without this the clamp
     above just pins the edge pixel and smears it across everything past
     the first world unit — which is the failure the photographed decals
     hit before the rescale existed. */
  if (n && PAINTERS[n] && PAINTERS[n].once) return true;
  const t = n ? tileFor(n) : null;
  return !!(t && t.decal);
}

/* Does this surface carry its own colour, or does it multiply over the
   part's? Two places need the answer — the material and the selection
   colour it resets to — and when only one of them knew, every textured part
   came back white the moment the scene restyled itself. */
export function isPrinted(name) {
  var n = name && name.kind ? name.kind : name;
  return !!(n && PAINTERS[n] && PAINTERS[n].printed);
}

export const SURFACES = Object.keys(PAINTERS);

/* =====================================================================
   EVERY PAINTER RETURNS THE SHAPE THE CALLER READS.

   `surface()` reads `.color` and `.height` off whatever a painter hands
   back. A painter that returns anything else does not fail — it returns
   undefined for the map, the material is built with no texture, and the
   part renders as a flat black rectangle. That is indistinguishable from
   a part that is simply dark, which is why it survived a render, a close
   render and a pixel sample before the return statement was read.

   It happened on `punchdown`, which returned `colour` — the spelling
   used in every comment, label and note in this build. The one place the
   American spelling is load-bearing is the one place it was not used.

   Calibrated: renaming any painter's `color` key to `colour` fires,
   naming the painter.
   ===================================================================== */
(function checkEveryPainterReturnsAMap() {
  const C = typeof document !== "undefined" ? null : undefined;
  /* Painters need a canvas, so this only runs in a browser. In Node the
     module still loads and the check is skipped rather than throwing on
     an environment it was never meant to police. */
  if (typeof document === "undefined") return;
  Object.keys(PAINTERS).forEach(function (name) {
    const def = PAINTERS[name];
    if (def.photo || typeof def.paint !== "function") return;
    let out;
    try { out = def.paint(32, 1, { lines: ["x"] }); }
    catch (e) {
      throw new Error('surface: painter "' + name + '" threw when asked to paint: ' + e.message);
    }
    if (!out || !out.color || !out.height) {
      throw new Error('surface: painter "' + name + '" returned { ' +
        Object.keys(out || {}).join(", ") + ' }. surface() reads .color and .height — ' +
        "anything else gives the material no map at all, and the part renders as a flat " +
        "black rectangle without throwing. Note the spelling: color, not colour.");
    }
  });
})();
