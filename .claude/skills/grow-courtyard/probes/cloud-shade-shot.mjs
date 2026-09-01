/* One pinned instant, cover pinned, captured INSIDE the evaluate (a canvas read after a
 * rAF is unpinned — the loop redraws with cover slewed back off the target). Writes the
 * frame with the pass and with it swapped for a no-op, so the pair differs by nothing else.
 *   node probe-shade-shot.mjs [cover=0.45] [t=175] [tag=a] [seed=42]
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const COVER = +(process.argv[2] || 0.45), T0 = +(process.argv[3] || 175), TAG = process.argv[4] || 'a', SEED = +(process.argv[5] || 42);
const [VW, VH] = (process.argv[6] || '1600x950').split('x').map(Number);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: VW, height: VH } });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto(pathToFileURL(join(REPO, 'courtyard.html')).href + `?seed=${SEED}&t=0&pause`);
await p.waitForFunction(() => window.__warp);
const r = await p.evaluate(({ T0, COVER }) => {
  window.__reseed(); window.__warp(T0);
  // COVER < 0 leaves the day's own sky alone; -2 walks the world forward until it finds a
  // broken one in daylight, because the sky a given warp lands on is not the sky the same
  // total time reached in smaller steps (__warp advances whole fixed-dt steps).
  if (COVER === -2){ for (let i = 0; i < 400 && !(cloudCover() > 0.35 && cloudCover() < 0.75 && daylight > 0.65); i++) window.__warp(2); }
  else if (COVER >= 0) cloud = cloudTgt = COVER;
  const real = drawCloudShade;
  drawScene(simT, 1 / 30);
  const shade = cv.toDataURL('image/png');
  drawCloudShade = () => {};
  drawScene(simT, 1 / 30);
  const plain = cv.toDataURL('image/png');
  drawCloudShade = real;
  // where did it land? a coarse grid of mean luma difference, in PERCENT of the plain frame
  const grab = () => { const d = ctx.getImageData(0, 0, cv.width, cv.height).data, g = [];
    for (let i = 0; i < d.length; i += 4) g.push(0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2]); return g; };
  drawScene(simT, 1/30); const A = grab();
  drawCloudShade = () => {}; drawScene(simT, 1/30); const B = grab();
  drawCloudShade = real;
  const CW = cv.width, CH = cv.height, GX = 12, GY = 6, grid = [];
  for (let gy = 0; gy < GY; gy++){ const row = [];
    for (let gx = 0; gx < GX; gx++){ let s2 = 0, n = 0;
      for (let y = Math.floor(gy*CH/GY); y < (gy+1)*CH/GY; y += 3) for (let x = Math.floor(gx*CW/GX); x < (gx+1)*CW/GX; x += 3){
        const i = y*CW + x; if (B[i] > 0.5) { s2 += (A[i] - B[i]) / B[i]; n++; } }
      row.push(n ? +(100 * s2 / n).toFixed(1) : 0); }
    grid.push(row); }
  // an amplified difference image: what the pass, and nothing else, put on the frame
  const dif = ctx.createImageData(cv.width, cv.height);
  for (let i = 0; i < A.length; i++){ const v = Math.min(255, Math.max(0, (B[i] - A[i]) * 6));
    dif.data[i*4] = v; dif.data[i*4+1] = v; dif.data[i*4+2] = v; dif.data[i*4+3] = 255; }
  const dc = document.createElement('canvas'); dc.width = cv.width; dc.height = cv.height;
  dc.getContext('2d').putImageData(dif, 0, 0);
  const diff = dc.toDataURL('image/png');
  let worst = 0, moved = 0; for (let i = 0; i < A.length; i++){ const d2 = A[i] - B[i]; if (Math.abs(d2) > 1) moved++; if (d2 < worst) worst = d2; }
  return { shade, plain, diff, grid, simT: +simT.toFixed(1), movedPct: +(100*moved/A.length).toFixed(1), worstLuma: +worst.toFixed(1), hour: +hour.toFixed(2), daylight: +daylight.toFixed(2), cover: cloudCover(),
           f: +cloudShadeF().toFixed(3), windF: +windF().toFixed(2), windSign, drift: +cloudDrift().toFixed(1) };
}, { T0, COVER });
for (const k of ['shade', 'plain', 'diff']) writeFileSync(`${REPO}shots/b102-${TAG}-${k}.png`, Buffer.from(r[k].split(',')[1], 'base64'));
delete r.shade; delete r.plain; delete r.diff;
const grid = r.grid; delete r.grid;
console.log(JSON.stringify(r));
console.log('mean luma change, % of plain (rows = sky..foreground):');
for (const row of grid) console.log('  ' + row.map(v => String(v).padStart(6)).join(''));
console.log(`-> shots/b102-${TAG}-{shade,plain}.png`);
await b.close();
