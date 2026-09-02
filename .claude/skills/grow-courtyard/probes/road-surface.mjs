/* The roadway's SURFACE, measured the way the b135 brief measured it: per-ground-class
 * luma mean / sd / sd-over-mean over the frame at a pinned instant, plus the same read
 * off the ground CACHE (gcv) where no agent, stall or shadow can contaminate a class.
 *   node .claude/skills/grow-courtyard/probes/road-surface.mjs [A] [B]     (default /tmp/head.html courtyard.html)
 * Classification is by INVERTING project() at z=0 and reading grid[] — so a pixel is
 * attributed to the ground under it. Agents/stalls standing on the road are counted in
 * BOTH builds identically (nothing here moves an R() draw), so the contamination is
 * common-mode; the cache read is the clean control on that.
 * sd/mean, never sd: nearShadow scales contrast with luma toward the viewer. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const A = process.argv[2] || '/tmp/head.html', B = process.argv[3] || 'courtyard.html';
const T = +(process.env.T || 55 * 3 + (10.4 - 6) * (55 / 24));   // day 3, 10.4 h
const W = +(process.env.VW || 1600), H = +(process.env.VH || 950);
const browser = await chromium.launch();

async function grab(file){
  const ctx = await browser.newContext({ viewport:{ width:W, height:H }, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  await p.goto(pathToFileURL(resolve(process.cwd(), file)).href + `?seed=42&t=${T}&pause`, { waitUntil:'load' });
  await p.waitForFunction(() => typeof window.__warp === 'function');
  const r = await p.evaluate(() => {
    __reseed(); drawScene(simT, 1/30);
    const NAMES = { 0:'WALL', 1:'PATH', 2:'GRASS', 3:'BED', 4:'CBED', 6:'SIDE', 7:'ROAD', 9:'WATER' };
    function cls(wx, wy){
      const gx = Math.floor(wx), gy = Math.floor(wy);
      if (gx < 0 || gx >= GW || gy < 0 || gy >= WH) return null;
      const t = grid[gy * GW + gx];
      const n = NAMES[t]; if (!n) return null;
      if (n === 'ROAD') return gy >= LN_ROAD0 ? 'ROAD.lane' : 'ROAD.cross';
      if (n === 'SIDE') return gx >= QUAY_X0 ? 'SIDE.quay' : 'SIDE.cross';
      if (n === 'PATH') return gx < XS_W0 ? 'PATH.court' : 'PATH.other';
      return n;
    }
    /* One sampler, run over the composited FRAME and over the ground CACHE. The cache is
     * the clean read — no agent, stall or live overlay can contaminate a class there —
     * and the frame is the one the brief's numbers were taken from, so report both. */
    function sample(g, w, h, inv){
      const px = g.getImageData(0, 0, w, h).data;
      const acc = {};
      for (let py = 0; py < h; py += 1){
        const wy = inv.wyOf(py);
        if (wy < 0 || wy >= WH) continue;
        for (let pxx = 0; pxx < w; pxx += 1){
          const wx = inv.wxOf(pxx, wy);
          const c = cls(wx, wy); if (!c) continue;
          const i = (py * w + pxx) * 4;
          const L = 0.299 * px[i] + 0.587 * px[i+1] + 0.114 * px[i+2];
          const a = acc[c] || (acc[c] = { n:0, s:0, s2:0 });
          a.n++; a.s += L; a.s2 += L * L;
        }
      }
      const out = {};
      for (const k of Object.keys(acc)){
        const a = acc[k], m = a.s / a.n, sd = Math.sqrt(Math.max(0, a.s2 / a.n - m * m));
        out[k] = { n:a.n, share:+(100 * a.n / (w * h)).toFixed(2), mean:+m.toFixed(2),
                   sd:+sd.toFixed(2), r:+(sd / m).toFixed(4) };
      }
      return out;
    }
    // the live frame: project()'s own camera
    const frameInv = {
      wyOf: py => (py - topPad) / cellH,
      wxOf: (px_, wy) => FOCUS + (px_ - originX) / (cellW * (1 - PINCH * (1 - wy / WH))),
    };
    const frame = sample(cv.getContext('2d'), cv.width, cv.height, frameInv);
    // the ground cache: gview holds the camera it was BUILT with, and its own x offset
    // gview holds the camera the cache was BUILT with, and its own x offset: map through
    // k = gview.s / viewS or the read goes stale through the camera ease
    const gs = gview.s, gpad = gview.pad, gox = gview.ox, gtp = gview.tp;
    const cw = cellW * (gs / viewS), ch = cellH * (gs / viewS);
    const cacheInv = {
      wyOf: py => (py - gtp) / ch,
      wxOf: (px_, wy) => FOCUS + (px_ - gpad - gox) / (cw * (1 - PINCH * (1 - wy / WH))),
    };
    const cache = sample(gcv.getContext('2d'), gcv.width, gcv.height, cacheInv);
    // the class map and the raw pixels, so the caller can say exactly WHICH off-road
    // pixels moved and by how much — a changed hash is a question, not an answer
    const fp = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    const map = new Int8Array(cv.width * cv.height);          // 1 = road, 0 = not, -1 = off-world
    const L = new Float32Array(cv.width * cv.height);
    for (let py = 0; py < cv.height; py++){
      const wy = frameInv.wyOf(py);
      for (let px2 = 0; px2 < cv.width; px2 += 1){
        const wx = frameInv.wxOf(px2, wy);
        const c = (wy >= 0 && wy < WH) ? cls(wx, wy) : null;
        const j = py * cv.width + px2, i = j * 4;
        // the DRAWN extent, not the world one: the lane runs on past both edges of the
        // grid and is laid out there too, so a pixel over the clamped column counts
        const cgx = clamp(Math.floor(wx), 0, GW - 1), cgy = Math.floor(wy);
        map[j] = (cgy >= 0 && cgy < WH && grid[cgy * GW + cgx] === ROAD) ? 1 : 0;
        L[j] = 0.299 * fp[i] + 0.587 * fp[i+1] + 0.114 * fp[i+2];
      }
    }
    /* Not a row profile — at 6.2 px a row a single screen line lands on a joint or on a
     * sett face and the alternation swamps everything. Instead: every carriageway pixel
     * in the lane west of the junction, bucketed by what the build SAYS is there — how
     * worn (rutF) and how cambered (camberF) — and averaged. A term that cannot be seen
     * in its own bucket is not drawn. Both buckets are computed from the CANDIDATE's own
     * geometry and applied identically to HEAD's pixels, so HEAD is the flat control. */
    const bk = {};
    for (let py = 0; py < cv.height; py++){
      const wy = frameInv.wyOf(py);
      if (wy < LN_ROAD0 || wy >= LN_ROAD1) continue;
      const d = cv.getContext('2d').getImageData(0, py, cv.width, 1).data;
      for (let px2 = 0; px2 < cv.width; px2++){
        const wx = frameInv.wxOf(px2, wy);
        if (wx < 2 || wx > XS_W0 - 5) continue;
        if (grid[Math.floor(wy) * GW + Math.floor(wx)] !== ROAD) continue;
        const i = px2 * 4, L = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
        /* the predicates are the PROBE's, off constants both builds share (CART_LANE_Y,
         * LN_ROAD0/1) — never the candidate's own rutF/camberF, which HEAD does not have
         * and which would hand back its own definition. */
        const dr = Math.min(Math.abs(wy - (CART_LANE_Y - 0.575)), Math.abs(wy - (CART_LANE_Y + 0.575)));
        const dk = Math.min(wy - LN_ROAD0, LN_ROAD1 - wy);
        const mid = Math.abs(wy - (LN_ROAD0 + LN_ROAD1) / 2);
        const keys = [];
        if (dr < 0.30) keys.push('rut:in'); else if (dr > 0.9 && dk > 1.0) keys.push('rut:out');
        /* the clean control for the rut: the band MIRRORED about the crown, which sits at
         * the same camber, the same distance from a kerb and the same screen depth, and
         * differs only in that no wheel has ever run down it. */
        const mir = 2 * (LN_ROAD0 + LN_ROAD1) / 2 - CART_LANE_Y;
        const dm = Math.min(Math.abs(wy - (mir - 0.575)), Math.abs(wy - (mir + 0.575)));
        if (dm < 0.30) keys.push('rut:mirror');
        keys.push('camber:' + (mid < 0.9 ? 'crown' : dk < 0.9 ? 'gutter' : 'mid'));
        for (const key of keys){
          const a2 = bk[key] || (bk[key] = { n:0, s:0, s2:0 });
          a2.n++; a2.s += L; a2.s2 += L * L;
        }
      }
    }
    const prof = {};
    for (const k of Object.keys(bk)){ const q = bk[k], m = q.s / q.n;
      prof[k] = { n:q.n, mean:+m.toFixed(2), sd:+Math.sqrt(Math.max(0, q.s2/q.n - m*m)).toFixed(2) }; }
    return { frame, cache, prof, w:cv.width, h:cv.height, map:[...map], L:[...L],
             fingerprint: { hour:+hour.toFixed(3), day, snow:+snowCover.toFixed(3), raining,
                            wet:+wetF().toFixed(3), warmth:+warmth.toFixed(3),
                            wind:+windF().toFixed(3), agents:agents.length } };
  });
  await ctx.close();
  return r;
}
const a = await grab(A), b = await grab(B);
await browser.close();
const fpDiff = Object.keys(a.fingerprint).filter(k => String(a.fingerprint[k]) !== String(b.fingerprint[k]));
console.log(`instant t=${T.toFixed(2)}  ${W}x${H}  seed 42`);
console.log('fingerprint', JSON.stringify(a.fingerprint), 'diff:', fpDiff.length ? fpDiff.join(',') : 'NONE');
function pool(k, parts){                      // ROAD.lane + ROAD.cross as one class, the way the brief measured it
  let n = 0, s = 0, s2 = 0;
  for (const p of parts){ if (!k[p]) continue; n += k[p].n; s += k[p].n * k[p].mean;
    s2 += k[p].n * (k[p].sd * k[p].sd + k[p].mean * k[p].mean); }
  if (!n) return null;
  const m = s / n, sd = Math.sqrt(Math.max(0, s2 / n - m * m));
  return { n, share:+(100 * n / TOT).toFixed(2), mean:+m.toFixed(2), sd:+sd.toFixed(2), r:+(sd / m).toFixed(4) };
}
const TOT = W * H;
for (const k of [a.frame, b.frame, a.cache, b.cache]){ const p = pool(k, ['ROAD.lane', 'ROAD.cross']); if (p) k['ROAD.all'] = p; }
for (const [tag, ka, kb] of [['FRAME', a.frame, b.frame], ['CACHE', a.cache, b.cache]]){
  console.log(`\n${tag}  class            share%   meanA   meanB    sdA    sdB   r=sd/mean A -> B`);
  for (const k of Object.keys(ka).sort()){
    const x = ka[k], y = kb[k] || x;
    console.log(`  ${k.padEnd(18)} ${String(x.share).padStart(6)} ${String(x.mean).padStart(7)} ${String(y.mean).padStart(7)}` +
                ` ${String(x.sd).padStart(6)} ${String(y.sd).padStart(6)}   ${x.r.toFixed(4)} -> ${y.r.toFixed(4)}` +
                `  (${(100*(y.r-x.r)/x.r).toFixed(1)}%  mean ${(y.mean-x.mean>=0?'+':'')}${(y.mean-x.mean).toFixed(2)})`);
  }
}
/* Where the change is. A hash says CHANGED and nothing else; what the claim needs is
 * whether the pixels that moved outside the ROAD class are anywhere but the kerb line
 * the old hatch's 0.7 px stroke used to bleed across. So: count them, and report how far
 * the furthest one is from a road pixel. */
let nR = 0, nO = 0, chR = 0, chO = 0, far = 0, maxO = 0;
const rows = {}, FAR = [];
for (let py = 0; py < a.h; py++) for (let px = 0; px < a.w; px++){
  const j = py * a.w + px;
  const d = Math.abs(a.L[j] - b.L[j]);
  if (a.map[j]){ nR++; if (d > 0.5) chR++; continue; }
  nO++;
  if (d <= 0.5) continue;
  chO++; if (d > maxO) maxO = d;
  // distance in pixels to the nearest road pixel, searched out to 6
  let dist = 99;
  for (let r = 1; r <= 6 && dist === 99; r++)
    for (let dy = -r; dy <= r && dist === 99; dy++) for (let dx = -r; dx <= r; dx++){
      const q = (py + dy) * a.w + (px + dx);
      if (py + dy >= 0 && py + dy < a.h && px + dx >= 0 && px + dx < a.w && a.map[q]){ dist = r; break; }
    }
  if (dist > far) far = dist;
  rows[dist] = (rows[dist] || 0) + 1;
  if (dist === 99){ FAR.push([px, py, +d.toFixed(1)]); }
}
console.log('\nthe lane carriageway, bucketed by what the build says is under the pixel');
console.log('  bucket             n     HEAD mean  sd     cand mean  sd');
for (const k of Object.keys(b.prof)){
  const x = a.prof[k], y = b.prof[k];
  console.log(`  ${k.padEnd(14)} ${String(y.n).padStart(7)}   ${String(x.mean).padStart(7)} ${String(x.sd).padStart(6)}   ${String(y.mean).padStart(7)} ${String(y.sd).padStart(6)}`);
}
const gap = (o, i, j) => +(o.prof[i].mean - o.prof[j].mean).toFixed(2);
console.log(`  rut IN minus rut OUT:      HEAD ${gap(a,'rut:in','rut:out')}   cand ${gap(b,'rut:in','rut:out')}`);
console.log(`  rut IN minus its MIRROR:   HEAD ${gap(a,'rut:in','rut:mirror')}   cand ${gap(b,'rut:in','rut:mirror')}   (same camber, same depth, no wheels)`);
console.log(`  crown minus gutter:        HEAD ${gap(a,'camber:crown','camber:gutter')}   cand ${gap(b,'camber:crown','camber:gutter')}`);
console.log(`\nchanged pixels (|dL| > 0.5)`);
console.log(`  inside  ROAD: ${chR} of ${nR}  (${(100*chR/nR).toFixed(1)}%)`);
console.log(`  outside ROAD: ${chO} of ${nO}  (${(100*chO/nO).toFixed(3)}%)  max |dL| ${maxO.toFixed(1)}`);
console.log(`  outside, by pixels from the nearest ROAD pixel: ${JSON.stringify(rows)}  furthest ${far}`);
if (FAR.length){
  const bx = [Math.min(...FAR.map(f=>f[0])), Math.min(...FAR.map(f=>f[1])), Math.max(...FAR.map(f=>f[0])), Math.max(...FAR.map(f=>f[1]))];
  console.log(`  the ${FAR.length} far ones: screen bbox x ${bx[0]}..${bx[2]}  y ${bx[1]}..${bx[3]}`);
  console.log('  sample:', JSON.stringify(FAR.slice(0, 8)));
}
