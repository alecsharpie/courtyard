/* #174 (b) — is the town's shade on the RIVER legible, and is the SHEEN what hides it?
 *
 * The cue raised at #159 claims two things about #163's `drawWaterShade`: that its mass
 * is large but its CHANGE is tiny, and that what would make it read is cutting the sheen
 * (`drawRiverFlow`'s streaks) rather than deepening the multiply. Neither had been run.
 *
 * Four builds off ONE source, patched in /tmp, so every number is same-code except the
 * one term named:
 *   FULL      the file as it stands
 *   NOSHADE   drawWaterShade returns at once  -> the shade's own SURVIVING mass
 *   NOFLOW    drawRiverFlow returns at once   -> how much sheen there is to cut at all
 *   NOSHEEN   the candidate: a streak inside shMask is dropped
 * and CONTROL, which is FULL against FULL: the instrument's floor (a ?paused page still
 * runs rAF). Every mass below is a ratio to that floor.
 *
 * Legibility is not the diff. It is measured per build as the luma gap between the wet
 * shade and the OPEN channel in the same rows, with sd/mean on both sides — a diff
 * answers "is it drawn", not "can it be seen". NOSHADE is the floor for THAT too: the
 * gap it reports is the depth gradient the rows have anyway.
 *
 *   node probes/water-sheen.mjs [t] [w] [h]
 * t=995 is hour 8.18, the largest wet mask in the calendar (616 sub-cells at f 0.134);
 * t=295 is hour 14.73, a bright afternoon, where the same mask is 31 sub-cells at f 0.375.
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url'; import { readFileSync, writeFileSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const T = +(process.argv[2] || 995), VW = +(process.argv[3] || 1600), VH = +(process.argv[4] || 950);
const SRC = readFileSync('courtyard.html', 'utf8');
function patch(name, from, to){
  if (!SRC.includes(from)) throw new Error('patch anchor missing: ' + name);
  const f = `/tmp/ws-${name}.html`; writeFileSync(f, SRC.replace(from, to)); return f;
}
const BUILDS = {
  FULL: 'courtyard.html',
  NOSHADE: patch('noshade', 'function drawWaterShade(t){', 'function drawWaterShade(t){ if (1) return;'),
  NOFLOW:  patch('noflow',  'function drawRiverFlow(t){',  'function drawRiverFlow(t){ if (1) return;'),
  NOSHEEN: patch('nosheen', '    const [sx, sy] = project(fx, fy, 0);\n    ctx.moveTo(sx, sy); ctx.lineTo(sx - 1.2 + lean, sy + len);',
    '    if (inSunShade(fx, fy)) continue;\n    const [sx, sy] = project(fx, fy, 0);\n    ctx.moveTo(sx, sy); ctx.lineTo(sx - 1.2 + lean, sy + len);'),
};
// NOSHEEN needs the predicate too, and the shade is not built unless drawWaterShade ran
{
  const f = '/tmp/ws-nosheen.html'; let s = readFileSync(f, 'utf8');
  s = s.replace('function sunShadeRuns(g, wet, bb){',
    `function inSunShade(x, y){
       if (sunShadeF() <= 0.004) return false;
       const gy = y | 0; if (gy < 0 || gy >= WH) return false;
       const mx = (x * BSH_SUB) | 0; if (mx < 0 || mx >= BSH_W) return false;
       return !!shMask[gy * BSH_W + mx];
     }
     function sunShadeRuns(g, wet, bb){`);
  writeFileSync(f, s);
}
const b = await chromium.launch();
async function shoot(file){
  const p = await b.newPage({ viewport: { width: VW, height: VH } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(pathToFileURL(resolve(file)).href + `?seed=42&t=${T}&pause`);
  await p.waitForFunction('typeof __warp === "function"');
  const r = await p.evaluate(() => {
    __reseed(); drawScene(simT, 1/30);
    const f = sunShadeF(); if (f > 0.004) buildSunShade();
    const w = cv.width, h = cv.height, sx = w / W, sy = h / H;
    const D = cv.getContext('2d').getImageData(0, 0, w, h).data;
    const cls = new Uint8Array(w * h);            // 1 wet shade, 2 open channel
    const rows = {};                              // rows that hold wet shade
    for (let py = 0; py < h; py++){
      if (py / sy >= sillTop()) continue;
      for (let px = 0; px < w; px++){
        const wy = (py / sy - topPad) / cellH;
        if (wy < 0 || wy >= WH) continue;
        const wx = FOCUS + (px / sx - originX) / (cellW * (1 - PINCH * (1 - wy / WH)));
        const gx = wx | 0, gy = wy | 0;
        if (gx < 0 || gx >= GW) continue;
        if (!onChannel(gx, gy, grid[gy * GW + gx])) continue;
        const mx = (wx * BSH_SUB) | 0;
        const sh = f > 0.004 && mx >= 0 && mx < BSH_W && shMask[gy * BSH_W + mx];
        cls[py * w + px] = sh ? 1 : 2;
        if (sh) rows[gy] = 1;
      }
    }
    // the open channel is only a fair comparison in the ROWS the shade actually reaches
    let A = [0, 0, 0], B = [0, 0, 0];             // n, sum, sumsq
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++){
      const c = cls[py * w + px]; if (!c) continue;
      const wy = ((py / sy - topPad) / cellH) | 0;
      if (c === 2 && !rows[wy]) continue;
      const i = (py * w + px) * 4;
      const L = 0.299 * D[i] + 0.587 * D[i + 1] + 0.114 * D[i + 2];
      const t = c === 1 ? A : B; t[0]++; t[1] += L; t[2] += L * L;
    }
    const stat = t => { const m = t[1] / (t[0] || 1); return { n: t[0], mean: +m.toFixed(2),
      sd: +Math.sqrt(Math.max(0, t[2] / (t[0] || 1) - m * m)).toFixed(2) }; };
    return { url: cv.toDataURL(), f: +f.toFixed(4), hour: +hour.toFixed(2), day,
             daylight: +daylight.toFixed(2), wind: +windF().toFixed(3),
             shade: stat(A), open: stat(B) };
  });
  if (errs.length) console.log('  PAGE ERRORS', file, errs.slice(0, 2));
  await p.close(); return r;
}
async function diff(aUrl, bUrl){    // changed pixels over the CHANNEL only
  const p = await b.newPage({ viewport: { width: VW, height: VH } });
  await p.goto(pathToFileURL(resolve('courtyard.html')).href + `?seed=42&t=${T}&pause`);
  await p.waitForFunction('typeof __warp === "function"');
  const r = await p.evaluate(async ([ua, ub]) => {
    __reseed(); drawScene(simT, 1 / 30);
    const load = async u => { const im = new Image(); await new Promise(r => { im.onload = r; im.src = u; });
      const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
      c.getContext('2d').drawImage(im, 0, 0); return c.getContext('2d').getImageData(0,0,cv.width,cv.height).data; };
    const A = await load(ua), B = await load(ub);
    const w = cv.width, h = cv.height, sx = w / W, sy = h / H;
    let n = 0, sum = 0, peak = 0, all = 0;
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++){
      const i = (py * w + px) * 4;
      const d = (Math.abs(A[i]-B[i]) + Math.abs(A[i+1]-B[i+1]) + Math.abs(A[i+2]-B[i+2])) / 3;
      if (d <= 0.5) continue;
      all++;
      const wy = (py / sy - topPad) / cellH; if (wy < 0 || wy >= WH) continue;
      const wx = FOCUS + (px / sx - originX) / (cellW * (1 - PINCH * (1 - wy / WH)));
      const gx = wx | 0, gy = wy | 0;
      if (gx < 0 || gx >= GW || !onChannel(gx, gy, grid[gy * GW + gx])) continue;
      n++; sum += d; if (d > peak) peak = d;
    }
    return { channelPx: n, allPx: all, meanD: +(sum / (n || 1)).toFixed(2), peakD: +peak.toFixed(1) };
  }, [aUrl, bUrl]);
  await p.close(); return r;
}
const out = {};
for (const [k, f] of Object.entries(BUILDS)) out[k] = await shoot(f);
const CONTROL = await shoot('courtyard.html');
console.log(`t=${T}  hour ${out.FULL.hour}  day ${out.FULL.day}  daylight ${out.FULL.daylight}  ` +
            `sunShadeF ${out.FULL.f}  windF ${out.FULL.wind}  ${VW}x${VH}`);
console.log('\nLEGIBILITY — luma of the wet shade vs the OPEN channel in the same rows');
console.log('build      shadePx  shadeMean   sd  sd/mean | openMean   sd | GAP  gap/openSd');
for (const k of ['FULL', 'NOSHADE', 'NOFLOW', 'NOSHEEN']){
  const r = out[k], gap = +(r.open.mean - r.shade.mean).toFixed(2);
  console.log(k.padEnd(9), String(r.shade.n).padStart(8), String(r.shade.mean).padStart(10),
    String(r.shade.sd).padStart(6), (r.shade.sd / r.shade.mean).toFixed(3).padStart(8), '|',
    String(r.open.mean).padStart(8), String(r.open.sd).padStart(6), '|',
    String(gap).padStart(6), (gap / r.open.sd).toFixed(3).padStart(8));
}
console.log('\nMASS — changed pixels over the channel, against FULL');
const fl = await diff(out.FULL.url, CONTROL.url);
console.log('CONTROL (same code)'.padEnd(20), JSON.stringify(fl));
for (const k of ['NOSHADE', 'NOFLOW', 'NOSHEEN']){
  const d = await diff(out.FULL.url, out[k].url);
  console.log(k.padEnd(20), JSON.stringify(d), ' x floor:',
    (d.channelPx / Math.max(1, fl.channelPx)).toFixed(1));
}
await b.close();
