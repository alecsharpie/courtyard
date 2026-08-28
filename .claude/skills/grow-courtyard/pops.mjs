/* pops.mjs — which samples of a frame-to-frame Δ series are POPs?
 *
 * A pop is a STEP: one sample far above the samples on either side of it. It is
 * not "far above the median of the run" — a winter dusk fades the whole sky at
 * ~5 RGB per 0.35 s for three samples and then plateaus, and against the plateau's
 * median every one of those ramp samples read as a pop (#48 lost an iteration to
 * that). Judged against its neighbours, a ramp is flat; a cached layer rebuilding
 * on one frame is not.
 *
 *   pops(diffs, { ratio = 3.5, floor = 0.02 })  -> Set of indices into diffs
 *
 * ratio: how far above the larger neighbour a sample must be.  floor: an absolute
 * Δ below which nothing is a pop, so 0.003 over 0.000 does not fire on a still night.
 */
export function pops(diffs, { ratio = 3.5, floor = 0.02 } = {}) {
  const out = new Set();
  for (let i = 0; i < diffs.length; i++) {
    const d = diffs[i];
    if (!(d > floor)) continue;
    const nb = [];
    if (i > 0) nb.push(diffs[i - 1]);
    if (i + 1 < diffs.length) nb.push(diffs[i + 1]);
    if (!nb.length) continue;
    const ref = Math.max(...nb, floor / ratio);
    if (d > ref * ratio) out.add(i);
  }
  return out;
}
