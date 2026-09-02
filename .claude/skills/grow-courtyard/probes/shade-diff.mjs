/* #140 — the town's own shadow, graded as a DIFFERENCE IMAGE against a control that is
 * run, not assumed. Three things `road-surface.mjs` cannot answer:
 *
 *  1. WHERE the changed pixels are. Every one is attributed by inverting project() at
 *     z=0 and reading the build's OWN shOpen[] / solidM[] — so a pixel that changed over
 *     a cell shOpen calls covered is a pixel painted on a ROOF, and there must be none
 *     beyond the antialiased seam where the shadow meets the wall casting it.
 *  2. THE STACK. nearShadow, drawCloudShade and applyLight already multiply this frame,
 *     so the question is not "how dark is my pass" but "how dark is the darkest ground
 *     pixel now". Reported as percentiles of open-ground luma in both builds: if p0.1
 *     moves, something is being crushed to black by two passes agreeing.
 *  3. THE FLOOR. Run it with the same file on both sides (`… courtyard.html courtyard.html`)
 *     and it prints the instrument's own noise — a ?paused page still runs rAF, so a
 *     handful of swayed pixels differ between two loads of one build. Quote the signal
 *     as a ratio to THAT, never as an absolute.
 *
 * Plus the creep check: the mask is cached on a quantised sun, so the shadow's edge
 * advances in steps. Any step of more than ONE sub-cell is a visible stutter.
 *
 *   node .../probes/shade-diff.mjs [t] [w] [h] [cand] [base]
 *   t=190 is a clear 16.9 h (?t= pins cover at 0.16, below SH_KNEE); 1068 midwinter,
 *   346 a summer noon, 367 after dark.
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url'; import { writeFileSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const T = +(process.argv[2] || 190), VW = +(process.argv[3] || 1600), VH = +(process.argv[4] || 950);
const CAND = process.argv[5] || 'courtyard.html';
const BASE = process.argv[6] || '/tmp/head.html';
const b = await chromium.launch();
async function frame(file){
  const p = await b.newPage({ viewport: { width: VW, height: VH } });
  await p.goto(pathToFileURL(resolve(file)).href + `?seed=42&t=${T}&pause`);
  await p.waitForFunction('typeof __warp === "function"');
  const r = await p.evaluate(() => { __reseed(); drawScene(simT, 1/30);
    return { url: cv.toDataURL(), fp: [+hour.toFixed(3), day, +cloudCover().toFixed(3), +daylight.toFixed(3), agents.length] }; });
  await p.close(); return r;
}
const A = await frame(BASE);
const p = await b.newPage({ viewport: { width: VW, height: VH } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(pathToFileURL(resolve(CAND)).href + `?seed=42&t=${T}&pause`);
await p.waitForFunction('typeof __warp === "function"');
const r = await p.evaluate(async (headUrl) => {
  __reseed(); drawScene(simT, 1/30);
  const im = new Image(); await new Promise(res => { im.onload = res; im.src = headUrl; });
  const oc = document.createElement('canvas'); oc.width = cv.width; oc.height = cv.height;
  oc.getContext('2d').drawImage(im, 0, 0);
  const A = oc.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
  const B = cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
  const sx = cv.width / W, sy = cv.height / H;
  const out = new Uint8ClampedArray(cv.width * cv.height * 4);
  const bucket = {}; let changed = 0, tot = cv.width * cv.height, peak = 0;
  const hA = new Float64Array(256), hB = new Float64Array(256);   // open-ground luma, both builds
  for (let py = 0; py < cv.height; py++) for (let px = 0; px < cv.width; px++){
    const i = (py * cv.width + px) * 4;
    const d = (Math.abs(A[i]-B[i]) + Math.abs(A[i+1]-B[i+1]) + Math.abs(A[i+2]-B[i+2])) / 3;
    const v = Math.min(255, d * 8); out[i]=v; out[i+1]=v; out[i+2]=v; out[i+3]=255;
    {
      const wy0 = (py/sy - topPad) / cellH;
      const wx0 = FOCUS + (px/sx - originX) / (cellW * (1 - PINCH * (1 - wy0 / WH)));
      const cx0 = Math.floor(wx0), cy0 = Math.floor(wy0);
      if (py/sy < sillTop() && cx0>=0 && cx0<GW && cy0>=0 && cy0<WH && shOpen[cy0*GW+cx0]){
        hA[(0.299*A[i]+0.587*A[i+1]+0.114*A[i+2])|0]++;
        hB[(0.299*B[i]+0.587*B[i+1]+0.114*B[i+2])|0]++;
      }
    }
    if (d <= 0.5) continue;
    changed++; if (d > peak) peak = d;
    const wy = (py/sy - topPad) / cellH;
    const wx = FOCUS + (px/sx - originX) / (cellW * (1 - PINCH * (1 - wy / WH)));
    const cx = Math.floor(wx), cy = Math.floor(wy);
    let k;
    if (py/sy >= sillTop()) k = 'ourSill';
    else if (wy < 0) k = 'SKY';
    else if (cx < 0 || cx >= GW || cy < 0 || cy >= WH) k = 'offWorld';
    else if (cy >= LN_WALK_S) k = 'ourRoof';
    else if (solidM[cy*GW+cx]) k = 'ROOF/WALL';
    else if (!shOpen[cy*GW+cx]) k = 'behindAVolume';
    else k = 'openGround';
    const bk = bucket[k] || (bucket[k] = {n:0, s:0, mx:0}); bk.n++; bk.s += d; if (d > bk.mx) bk.mx = d;
  }
  const o2 = document.createElement('canvas'); o2.width=cv.width; o2.height=cv.height;
  const g2 = o2.getContext('2d'), id = g2.createImageData(cv.width, cv.height);
  id.data.set(out); g2.putImageData(id,0,0);
  let shaded = 0, open = 0;
  for (let i=0;i<GW*WH;i++) if (shOpen[i]) open++;
  for (let y=0;y<WH;y++) for (let x=0;x<GW;x++){ let on=0; for(let s=0;s<BSH_SUB;s++) if (shMask[y*BSH_W+x*BSH_SUB+s]) on++; if (on) shaded += on/BSH_SUB; }
  const pct = (h, q) => { let n=0; for(let i=0;i<256;i++) n+=h[i]; let c=0; for(let i=0;i<256;i++){ c+=h[i]; if (c >= n*q) return i; } return 255; };
  const stack = { n: hA.reduce((a,b)=>a+b,0), p001:[pct(hA,0.001),pct(hB,0.001)], p01:[pct(hA,0.01),pct(hB,0.01)],
                  p05:[pct(hA,0.05),pct(hB,0.05)], p50:[pct(hA,0.5),pct(hB,0.5)] };
  return { bucket, stack, changed, tot, peak:+peak.toFixed(1), diff: o2.toDataURL(),
           F:+sunShadeF().toFixed(3), shaded:+shaded.toFixed(0), open,
           fp: [+hour.toFixed(3), day, +cloudCover().toFixed(3), +daylight.toFixed(3), agents.length] };
}, A.url);
if (errs.length){ console.error('PAGE ERROR', errs[0]); process.exit(2); }
writeFileSync(`shots/shade-diff-t${T}-${VW}x${VH}.png`, Buffer.from(r.diff.split(',')[1],'base64'));
console.log('t', T, VW+'x'+VH, ' fingerprint HEAD', JSON.stringify(A.fp), 'cand', JSON.stringify(r.fp),
            JSON.stringify(A.fp)===JSON.stringify(r.fp) ? 'IDENTICAL' : 'DRIFT');
console.log('sunShadeF', r.F, '· shadowed ground cells', r.shaded, 'of', r.open, 'open  =',
            (100*r.shaded/r.open).toFixed(1) + '%');
console.log('open-ground luma percentiles HEAD -> cand over', r.stack.n, 'px:',
  ' p0.1', r.stack.p001.join('->'), ' p1', r.stack.p01.join('->'), ' p5', r.stack.p05.join('->'), ' p50', r.stack.p50.join('->'));
console.log('changed', r.changed, 'of', r.tot, '=', (100*r.changed/r.tot).toFixed(2)+'%  peak |dL|', r.peak);
for (const k of Object.keys(r.bucket).sort((a,c)=>r.bucket[c].n-r.bucket[a].n)){ const v=r.bucket[k];
  console.log('  ', k.padEnd(15), String(v.n).padStart(8), (100*v.n/r.changed).toFixed(2)+'%', ' mean|dL|', (v.s/v.n).toFixed(2), ' max', v.mx.toFixed(1)); }

/* CREEP — the mask is cached on a quantised sun, so the edge advances in jumps. Warp in
 * 1/30 steps and watch one row's east-most shadowed sub-cell: every step must be 0 or 1. */
const cp = await b.newPage({ viewport: { width: VW, height: VH } });
await cp.goto(pathToFileURL(resolve(CAND)).href + '?seed=42&t=0&pause');
await cp.waitForFunction('typeof __warp === "function"');
const c = await cp.evaluate((T) => {
  /* ONE pass over the clock, every row sampled inside it. __warp ADVANCES, it does not
   * seek, so a per-row loop that re-warps is reading a different day each time and its
   * jumps are band-switches, not stutters. */
  __reseed(); __warp(T);
  const ROWS = [12, 20, 28, 36, 44], seq = ROWS.map(() => []);
  for (let i = 0; i < 300; i++){
    __warp(1/30); buildSunShade();
    for (let r = 0; r < ROWS.length; r++){
      let e = -1; for (let mx = BSH_W - 1; mx >= 0; mx--) if (shMask[ROWS[r]*BSH_W+mx]){ e = mx; break; }
      seq[r].push(e);
    }
  }
  const out = [];
  for (let r = 0; r < ROWS.length; r++){
    const q = seq[r]; if (q[0] < 0) continue;
    const st = {}; for (let i=1;i<q.length;i++){ const d = q[i]-q[i-1]; st[d]=(st[d]||0)+1; }
    out.push({ row: ROWS[r], from: q[0], to: q[q.length-1], steps: st });
  }
  return { rows: out, subCellPx: +(cellW / BSH_SUB).toFixed(2) };
}, T);
console.log('creep over 10 s of sim, one sub-cell =', c.subCellPx, 'px:');
for (const q of c.rows) console.log('   row', String(q.row).padStart(2), q.from, '->', q.to, ' step histogram', JSON.stringify(q.steps));
await cp.close();
await b.close();
