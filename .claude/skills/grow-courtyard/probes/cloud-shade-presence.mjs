/* How often does the town actually SEE it? Over sim days at natural cover (nothing pinned),
 * sample daylit frames and measure the share of the frame the pass darkens and by how much —
 * off the frame itself, drawn twice per sample (pass, no-op), never re-derived from the bands.
 *   node probe-shade-presence.mjs [days=8]
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const DAYS = +(process.argv[2] || 8);
const b = await chromium.launch();
const rows = [];
for (const seed of [1, 42, 7]){
  const p = await b.newPage({ viewport: { width: 900, height: 560 } });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(join(REPO, 'courtyard.html')).href + `?seed=${seed}&t=0&pause`);
  await p.waitForFunction(() => window.__warp);
  rows.push(...await p.evaluate(({ DAYS, seed }) => {
    window.__reseed();
    const real = drawCloudShade, out = [];
    const lum = () => { const d = ctx.getImageData(0, 0, cv.width, cv.height).data, g = new Float32Array((d.length / 4) | 0);
      for (let i = 0, j = 0; i < d.length; i += 4, j++) g[j] = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2]; return g; };
    for (let i = 0; i < DAYS * 55 / 2; i++){
      window.__warp(2);
      if (daylight <= 0.35) continue;
      drawCloudShade = real; drawScene(simT, 1/30); const A = lum();
      drawCloudShade = () => {}; drawScene(simT, 1/30); const B = lum();
      drawCloudShade = real;
      let n = 0, deep = 0, worst = 0, tot = 0;
      for (let j = 0; j < A.length; j += 3){ const d2 = B[j] - A[j]; tot++;
        if (d2 > 4) n++; if (d2 > 20) deep++; if (d2 > worst) worst = d2; }
      out.push({ seed, day, hour: +hour.toFixed(1), cover: +cloudCover().toFixed(3),
                 shaded: +(100 * n / tot).toFixed(1), deep: +(100 * deep / tot).toFixed(1), worst: +worst.toFixed(0) });
    }
    return out;
  }, { DAYS, seed }));
  await p.close();
}
await b.close();
const n = rows.length;
const any = rows.filter(r => r.shaded >= 3).length, strong = rows.filter(r => r.deep >= 3).length;
console.log(`${n} daylit samples (daylight > 0.35) over ${DAYS} days x 3 seeds, cover NOT pinned`);
console.log(`  some shade in frame (>=3% of pixels darkened >4 luma): ${any} = ${(100*any/n).toFixed(0)}%`);
console.log(`  deep shade         (>=3% darkened >20 luma):           ${strong} = ${(100*strong/n).toFixed(0)}%`);
const q = a => { const s = a.slice().sort((x, y) => x - y); return [s[0], s[(s.length*0.5)|0], s[(s.length*0.9)|0], s[s.length-1]]; };
console.log(`  shaded share of frame  min/med/p90/max: ${q(rows.map(r => r.shaded)).join(' / ')} %`);
console.log(`  worst darkening (luma) min/med/p90/max: ${q(rows.map(r => r.worst)).join(' / ')}`);
const byCover = {};
for (const r of rows){ const k = (Math.floor(r.cover * 5) / 5).toFixed(1); (byCover[k] ||= []).push(r.shaded); }
for (const k of Object.keys(byCover).sort()) console.log(`  cover ${k}-${(+k + 0.2).toFixed(1)}: ${byCover[k].length} samples, mean shaded ${(byCover[k].reduce((a, b2) => a + b2, 0) / byCover[k].length).toFixed(1)}%`);
