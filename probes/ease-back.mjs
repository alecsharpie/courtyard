/* ease-back.mjs — does the cached distance sit where a distance PAINTED IN
 * THIS FRAME'S OWN VIEW would sit, at every step of every camera ease?
 *
 * The gate is a GROUND TRUTH build, not an opinion: the same source, patched so the
 * backdrop cache is keyed on and painted in the LIVE view every frame (`bv` = the live
 * transform, pad 0). That build is correct by construction and far too expensive to
 * ship — it repaints a full canvas per frame — so it is exactly the control.
 *
 *   GT    the candidate, repainting in the live view every frame
 *   CAND  the candidate as shipped: ONE paint per camera move, scaled through the ease
 *   HEAD  the build before this iteration (no camera term in backKey at all)
 *   CTRL  the candidate run a SECOND time — the same-code floor every number is quoted
 *         against, because a scaled blit resamples and a diff of two builds is never 0
 *
 * Each of the five chevron moves (n -> n+1) is filmed at eight points of its 0.9 s ease
 * via __where(n)/__where(undefined, dt), and every frame is compared to GT's frame at
 * the same u. Two regions, split at the frame's OWN live horizon: SKY (what this change
 * is about) and TOWN (which no build here touches — a non-zero there is a bug in the
 * probe or a draw-order fault). `bestDy` is the vertical shift that best aligns the sky
 * with GT's: 0 is "in the right place", and HEAD's is the drift the brief describes.
 *
 *   node probe-ease-backdrop.mjs [seed] [simT] [W] [H]
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const seed = +(process.argv[2] || 7), T = +(process.argv[3] || 175);
const W = +(process.argv[4] || 1600), H = +(process.argv[5] || 950);
const US = [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1];      // fractions of VIEW_SECS
const NQ = 5, STEP = 3;                                  // sample every 3rd device px

const cand = readFileSync('courtyard.html', 'utf8');
const head = execFileSync('git', ['show', 'HEAD:courtyard.html'], { maxBuffer: 1 << 28 }).toString();
const LIVE_A = '  const easing = viewEasing();';
if (!cand.includes(LIVE_A)){ console.log('PATCH MISS: the easing line'); process.exit(1); }
// the ground truth: never take the ease's path — paint the cache in the LIVE view,
// unpadded, every frame of the move. Correct by construction, one full repaint a frame.
const gt = cand.replace(LIVE_A, '  const easing = false;');
const files = {};
for (const [k, src] of Object.entries({ gt, cand, head, ctrl: cand })){
  files[k] = `/tmp/probe-ease-${k}.html`; writeFileSync(files[k], src);
}

const b = await chromium.launch();
/* One page per (build, transition). Every u of a transition is drawn inside ONE
 * evaluate at ONE pinned instant, so nothing in the town moves between frames and the
 * only thing that changes down a column of this table is the camera. */
async function film(file, q){
  const pg = await b.newPage({ viewport: { width: W, height: H } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(pathToFileURL(file).href + `?pause&seed=${seed}&t=0`);
  await pg.waitForFunction('window.__census');
  const out = await pg.evaluate(({ T, q, US, STEP, NQ }) => {
    const cv = document.querySelector('canvas'), cx = cv.getContext('2d');
    window.__reseed(); window.__warp(T);
    const simT = window.__census().clock.simT;
    // park at quarter q, ease complete, THEN start the move under test
    window.__where(q); window.__where(undefined, 2);
    const frames = [];
    let at = 0;
    window.__where((q + 1) % NQ);
    for (const u of US){
      if (u > at){ window.__where(undefined, (u - at) * 0.9); at = u; }
      drawScene(simT, 1 / 30);
      const d = cx.getImageData(0, 0, cv.width, cv.height).data;
      const w = Math.ceil(cv.width / STEP), h = Math.ceil(cv.height / STEP);
      let s = '';
      for (let y = 0; y < cv.height; y += STEP)
        for (let x = 0; x < cv.width; x += STEP){
          const i = (y * cv.width + x) * 4;
          s += String.fromCharCode((d[i] * 77 + d[i + 1] * 151 + d[i + 2] * 28) >> 8);
        }
      frames.push({ u, w, h,
        px: btoa(s),
        // what the frame BELIEVES about itself: the live camera and the cache's own view
        view: { s: viewS, ox: originX, tp: topPad, hz: topPad - 3.4 * cellH, dpr: DPR },
        cache: typeof bview === 'undefined' ? null : { s: bview.s, ox: bview.ox, tp: bview.tp, pad: bview.pad } });
    }
    return frames;
  }, { T, q, US, STEP, NQ });
  await pg.close();
  if (errs.length) console.log('  PAGE ERRORS', errs.slice(0, 2));
  return out.map(f => ({ ...f, px: Buffer.from(f.px, 'base64') }));
}

// two luma planes, compared above and below the live horizon, plus the vertical shift
// that best aligns the sky halves — 0 px means the distance is where it belongs
function compare(a, gtF){
  const { w, h } = gtF, A = a.px, G = gtF.px;
  const hzRow = Math.max(2, Math.min(h - 2, Math.round(gtF.view.hz * gtF.view.dpr / STEP)));
  const band = (y0, y1) => {
    let n = 0, sum = 0, hits = 0;
    for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++){
      const d = Math.abs(A[y * w + x] - G[y * w + x]); sum += d; n++; if (d > 10) hits++;
    }
    return n ? { mad: sum / n, pct: 100 * hits / n } : { mad: 0, pct: 0 };
  };
  let best = 0, bestMad = Infinity;
  for (let dy = -60; dy <= 60; dy++){
    let s = 0, n = 0;
    for (let y = Math.max(0, -dy); y < Math.min(hzRow, hzRow - dy); y += 2)
      for (let x = 0; x < w; x += 2){ s += Math.abs(A[(y + dy) * w + x] - G[y * w + x]); n++; }
    if (n && s / n < bestMad){ bestMad = s / n; best = dy; }
  }
  return { sky: band(0, hzRow), town: band(hzRow, h), dy: best * STEP, dyMad: bestMad };
}

const QN = ['Wide', 'Courtyard', 'Street', 'Plaza', 'Far bank'];
const rows = [];
for (let q = 0; q < NQ; q++){
  const g = await film(files.gt, q);
  const c1 = await film(files.cand, q);
  const set = { CAND: [c1, g], HEAD: [await film(files.head, q), g], CTRL: [await film(files.ctrl, q), c1] };
  console.log(`\n${QN[q]} -> ${QN[(q + 1) % NQ]}   (s ${g[0].view.s.toFixed(2)} -> ${g[7].view.s.toFixed(2)})`);
  console.log('   u      build   sky mad   sky %>10   bestDy    town mad   town %>10');
  for (let i = 0; i < US.length; i++){
    for (const [k, [fs, ref]] of Object.entries(set)){
      const c = compare(fs[i], ref[i]);
      rows.push({ q, u: US[i], build: k, ...c });
      console.log(`  ${US[i].toFixed(2)}   ${k.padEnd(6)}  ${c.sky.mad.toFixed(2).padStart(7)}  ${c.sky.pct.toFixed(2).padStart(8)}%  ${String(c.dy).padStart(6)}   ${c.town.mad.toFixed(2).padStart(8)}  ${c.town.pct.toFixed(2).padStart(9)}%`);
    }
  }
}
await b.close();

const agg = (k) => {
  const r = rows.filter(x => x.build === k);
  const m = (f) => r.reduce((a, x) => Math.max(a, f(x)), 0);
  return { skyMad: (r.reduce((a, x) => a + x.sky.mad, 0) / r.length).toFixed(2),
           skyPctMax: m(x => x.sky.pct).toFixed(2), dyMax: m(x => Math.abs(x.dy)),
           townMadMax: m(x => x.town.mad).toFixed(2) };
};
console.log(`\n=== ${W}x${H}  seed ${seed}  t ${T}  — every frame of all five moves, against GT ===`);
for (const k of ['CTRL', 'CAND', 'HEAD']) console.log(' ', k.padEnd(5), JSON.stringify(agg(k)));
