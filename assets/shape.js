/* =====================================================================
   Shorthand in a part description, expanded into real primitives

   `repeat` stamps a primitive along a step vector; `ring` arranges copies
   around an axis. Between them, a forty-fin heatsink and a seven-blade fan
   are three lines of description each instead of forty-seven.

   This lives on its own, apart from the renderer, because two things need
   it and they must not each have their own copy. The scene expands a part
   before drawing it; the damage transforms expand a part before tilting it,
   and when only the scene could, tilting a memory module rotated the base
   chip while its four repeated copies carried on marching along the old
   axis — the module came apart into a splayed fan of sticks. Nothing here
   touches the renderer, so importing it does not drag three.js in.
   ===================================================================== */
export function expand(list) {
  var out = [];
  (list || []).forEach(function (p) {
    if (p.ring) {
      var n = p.ring.count, rad = p.ring.radius, ax = p.ring.axis || "y";
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2 + (p.ring.phase || 0);
        var q = Object.assign({}, p); delete q.ring;
        var px = p.pos ? p.pos[0] : 0, py = p.pos ? p.pos[1] : 0, pz = p.pos ? p.pos[2] : 0;
        var r0 = p.rot ? p.rot.slice() : [0, 0, 0];
        /* THE SIGN IS NOT THE SAME ON ALL THREE AXES, AND FOR A LONG TIME
           IT WAS WRITTEN AS IF IT WERE.

           A copy is placed at angle `a` and then turned so that it faces
           outward. Which way "outward" is depends on the handedness of the
           plane the ring is drawn in, and only the Y axis wants a negative
           turn:

             ring about Y — copies live in XZ. A turn of th about Y sends
               local +X to (cos th, 0, -sin th), and the copy sits at
               (cos a, 0, sin a). Equal when th = -a.
             ring about X — copies live in YZ. A turn of th about X sends
               local +Y to (0, cos th, sin th), and the copy sits at
               (0, cos a, sin a). Equal when th = +a.
             ring about Z — copies live in XY. A turn of th about Z sends
               local +X to (cos th, sin th, 0), and the copy sits at
               (cos a, sin a, 0). Equal when th = +a.

           All three carried -a. On X and Z that turns every copy by 2a away
           from radial, so a copy a quarter of the way round lies FLAT — a
           nine-blade fan with four blades sideways on, a spoked wheel with
           half its spokes tangential. It went unseen for as long as it did
           because most ringed things here are square in the ring plane
           (sprocket pins, collar splines, gear teeth), and a square is
           unchanged by the error. The three that were not square were the
           PSU fan on the power bench, the spoked wheel on the impact bench,
           and the sprocket rim on the wear bench.

           So the convention, now that it holds: sizes are given as
             about X — [axial, radial, tangential]
             about Y — [radial, axial, tangential]
             about Z — [radial, tangential, axial]
           and verify/ring-radial.mjs holds every ringed part to it. */
        if (ax === "y") {
          q.pos = [px + Math.cos(a) * rad, py, pz + Math.sin(a) * rad];
          q.rot = [r0[0], r0[1] - a, r0[2]];
        } else if (ax === "x") {
          q.pos = [px, py + Math.cos(a) * rad, pz + Math.sin(a) * rad];
          q.rot = [r0[0] + a, r0[1], r0[2]];
        } else {
          q.pos = [px + Math.cos(a) * rad, py + Math.sin(a) * rad, pz];
          q.rot = [r0[0], r0[1], r0[2] + a];
        }
        out.push(q);
      }
      return;
    }
    if (p.repeat) {
      var c = p.repeat.count, st = p.repeat.step || [0, 0, 0];
      for (var j = 0; j < c; j++) {
        var w = Object.assign({}, p); delete w.repeat;
        var b = p.pos || [0, 0, 0];
        w.pos = [b[0] + st[0] * j, b[1] + st[1] * j, b[2] + st[2] * j];
        out.push(w);
      }
      return;
    }
    out.push(p);
  });
  return out;
}

