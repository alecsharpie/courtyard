/* Does the shade travel WITH the wind, and reverse with windSign?
 *
 * Measured off the FRAME: the column profile of the darkening (drawn frame minus the same
 * frame with the pass swapped for a no-op), cross-correlated with the next frame's profile.
 * The best-fitting x shift IS the travel — no copy of the band arithmetic here, and no
 * centroid, which jumps whenever a bank wraps or fades.
 *
 * A fresh page per case: __reseed() rewinds the PRNG and the world, NOT the clock, so three
 * cases in one page are three different hours.
 *   node probe-shade-wind.mjs
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path'; import { pathToFileURL, fileURLToPath } from 'node:url';
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const CASES = [['east wind  (windSign -1)', -1, 1], ['west wind  (windSign +1)', 1, 1], ['calm       (windF 0)', 1, 0]];
const b = await chromium.launch();
for (const [name, sign, wf] of CASES){
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(join(REPO, 'courtyard.html')).href + '?seed=42&t=0&pause');
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(({ sign, wf }) => {
    window.__reseed(); window.__warp(175);
    const real = drawCloudShade;
    const profile = () => {                       // per-column darkening this frame
      const lum = () => { const d = ctx.getImageData(0, 0, cv.width, cv.height).data, g = new Float32Array(cv.width * cv.height);
        for (let i = 0, j = 0; i < d.length; i += 4, j++) g[j] = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2]; return g; };
      drawCloudShade = real; drawScene(simT, 1/30); const A = lum();
      drawCloudShade = () => {}; drawScene(simT, 1/30); const B = lum();
      drawCloudShade = real;
      const col = new Float32Array(cv.width);
      let tot = 0;
      for (let y = 0; y < cv.height; y += 2) for (let x = 0; x < cv.width; x++){
        const w = B[y * cv.width + x] - A[y * cv.width + x];
        if (w > 0){ col[x] += w; tot += w; }
      }
      let am = 0; for (let x = 0; x < col.length; x++) if (col[x] > col[am]) am = x;
      return { col: Array.from(col), tot, argmax: am };
    };
    const shiftOf = (a0, b0) => {                 // px shift maximising correlation
      // Two traps, both of which report "it did not move": an unnormalised SUM has more terms
      // at s = 0, and a profile of non-negative darkening is dominated by its own DC term, so
      // every shift correlates about equally well. Mean-subtract, then take the per-term mean.
      const mean = v => v.reduce((x, y) => x + y, 0) / v.length;
      const ma = mean(a0), mb = mean(b0);
      const a = a0.map(v => v - ma), b2 = b0.map(v => v - mb);
      let best = -Infinity, bestS = 0;
      for (let s = -160; s <= 160; s++){
        let acc = 0, n = 0;
        for (let x = Math.max(0, -s); x < Math.min(a.length, a.length - s); x += 2){ acc += a[x] * b2[x + s]; n++; }
        if (n > a.length / 4 && acc / n > best){ best = acc / n; bestS = s; }
      }
      return bestS;
    };
    const out = [];
    let prev = null;
    for (let i = 0; i < 6; i++){
      cloud = cloudTgt = 0.5; wind = wf; windSign = sign;
      const pr = profile();
      if (prev) out.push({ peak: +(pr.argmax / cellW).toFixed(1), cells: +(shiftOf(prev, pr.col) / cellW).toFixed(2), tot: +pr.tot.toFixed(0), sign: windSign, dir: +windDir().toFixed(2), drift: +cloudDrift().toFixed(1), wx: +windX.toFixed(1), st: +simT.toFixed(1) });
      prev = pr.col;
      if (i === 0) out.unshift({ dir: +windDir().toFixed(2), windF: +windF().toFixed(2), drift: +cloudDrift().toFixed(1), hour: +hour.toFixed(2), darkening: +pr.tot.toFixed(0) });
      window.__warp(1);
    }
    return out;
  }, { sign, wf });
  await p.close();
  const head = r[0], steps = r.slice(1);
  console.log(`${name}  windDir ${head.dir}  windF ${head.windF}  h${head.hour}`);
  console.log(`   travel per 1 s of sim: ${steps.map(s => (s.cells >= 0 ? '+' : '') + s.cells).join('  ')} cells   (+ = east)`);
  console.log(`   darkening in frame:    ${steps.map(s => s.tot).join('  ')}   windDir at draw: ${steps.map(s => s.dir).join(' ')}`);
  console.log(`   darkest column (cells): ${steps.map(s => s.peak).join('  ')}`);
  console.log(`   cloudDrift():          ${steps.map(s => s.drift).join('  ')}    windX ${steps.map(s => s.wx).join(' ')}   simT ${steps.map(s => s.st).join(' ')}`);
}
await b.close();
