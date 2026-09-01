/* murmur.mjs — the b96 gates, in four sections.
 *   node probes/murmur.mjs year      8 seeds x 26 days: forms on dry season evenings, never in rain/summer
 *   node probes/murmur.mjs identity  summer canvas hash, HEAD vs tree, several instants (expects /tmp/head.html)
 *   node probes/murmur.mjs cost      drawScene ms through the display window, HEAD vs tree interleaved
 *   node probes/murmur.mjs pixels    the cloud's own dark-pixel series through the window (form -> roost)
 * Everything reads the page's own functions via evaluate(); no copied constants. */
import { homedir } from 'node:os';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');   // the repo, wherever this runs from
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = f => pathToFileURL(resolve(ROOT, f)).href;
const mode = process.argv[2] || 'year';
const b = await chromium.launch();

async function page(file, seed){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(PAGE(file) + `?seed=${seed}&t=0&pause`);
  await p.waitForFunction(() => window.__warp);
  await p.evaluate(() => window.__reseed());
  return p;
}

if (mode === 'year'){
  const SEEDS = [7, 42, 1234, 5, 9, 21, 77, 99];
  let dryFormed = 0, dryTotal = 0, wetActive = 0, offSeasonActive = 0, seasonDays = 0;
  for (const seed of SEEDS){
    const p = await page('courtyard.html', seed);
    const rows = await p.evaluate(() => {
      const out = [];
      for (let d = 0; d < 26; d++){
        while (day < d) __warp(2);
        while (hour < sunDown - 1.35) __warp(0.5);
        let peak = 0, rainOverlap = 0, mid = null;
        while (hour < sunDown + 0.1){
          __warp(0.05);
          const e = murmEnv();
          peak = Math.max(peak, e);
          if (raining && e > 0.05) rainOverlap++;
          if (mid === null && hour >= sunDown - 0.7)
            mid = { season: murmSeason(), raining, wind: +windF().toFixed(2), e: +e.toFixed(2) };
        }
        out.push({ d, peak: +peak.toFixed(2), rainOverlap, ...mid });
      }
      return out;
    });
    for (const r of rows){
      if (!r.season){ if (r.peak > 0) offSeasonActive++; continue; }
      seasonDays++;
      wetActive += r.rainOverlap;
      const dry = !r.raining && r.wind < 0.7;
      if (dry){ dryTotal++; if (r.peak > 0.5) dryFormed++; }
    }
    const f = rows.filter(r => r.season);
    console.log(`seed ${seed}: season days ${f.length}, formed ${f.filter(r => r.peak > 0.5).map(r => r.d).join(',') || 'none'}`);
    await p.close();
  }
  console.log(`\nseason evenings ${seasonDays} (8 seeds), dry at sunDown-0.7: ${dryTotal}`);
  console.log(`formed on dry season evenings: ${dryFormed}/${dryTotal} = ${(100 * dryFormed / Math.max(1, dryTotal)).toFixed(0)}%  (gate: >= 60%)`);
  console.log(`env>0.05 while raining, samples: ${wetActive}  (gate: 0)`);
  console.log(`active outside the season: ${offSeasonActive}  (gate: 0)`);
}

if (mode === 'identity'){
  // summer over the run: warp day 5 -> 6 sampling the canvas at instants incl. the sunset window
  const shot = async (file) => {
    const p = await page(file, 7);
    const r = await p.evaluate(() => {
      const hs = [];
      const grab = () => { drawScene(simT, 1/30);
        const d = ctx.getImageData(0, 0, W * DPR, H * DPR).data;
        let h = 0; for (let i = 0; i < d.length; i += 4){ h = (h * 31 + d[i] + d[i + 1] * 7 + d[i + 2] * 13) | 0; }
        hs.push([+hour.toFixed(2), day, h]); };
      while (day < 5) __warp(2);
      for (const tgt of [9, 12, 15]){ while (hour < tgt) __warp(0.05); grab(); }
      while (hour < sunDown - 0.7) __warp(0.05); grab();     // where the flock WOULD boil
      while (hour < sunDown - 0.15) __warp(0.05); grab();    // where it would funnel
      while (day < 6) __warp(1); while (hour < 8) __warp(0.05); grab();
      return { phase: +seasonPhase.toFixed(2), murm: typeof murmSeason === 'function' ? murmSeason() : null, hs };
    });
    await p.close(); return r;
  };
  for (const f of ['/tmp/head.html', 'courtyard.html'])
    console.log(f.padEnd(24), JSON.stringify(await shot(f)));
}

if (mode === 'cost'){
  // day 17 (147 birds), through the display window: sim+draw per frame, 3 reps interleaved
  const run = async (file) => {
    const p = await page(file, 7);
    const r = await p.evaluate(() => {
      // the LARGEST day-hashed flock in the season, weather forced fine: the worst case, not a sample
      let best = 12, bestN = 0;
      for (let d = 12; d <= 21; d++){ const N = 80 + Math.floor(hash(d, 601) * 81); if (N > bestN){ bestN = N; best = d; } }
      while (day < best) __warp(2);
      if (typeof murmWx === "function") window.murmWx = () => 1;
      while (hour < sunDown - 0.9) __warp(0.05);
      let draw = 0; const n = 45;                       // ~1.5 s real of the boil
      for (let i = 0; i < n; i++){ simStep(1/30, 1/30);
        const a = performance.now(); drawScene(simT, 1/30); draw += performance.now() - a; }
      return { day, N: bestN, env: typeof murmEnv === "function" ? +murmEnv().toFixed(2) : null, drawMs: +(draw / n).toFixed(2) };
    });
    await p.close(); return r;
  };
  for (let rep = 0; rep < 3; rep++)
    console.log('rep', rep, 'HEAD', JSON.stringify(await run('/tmp/head.html')), 'TREE', JSON.stringify(await run('courtyard.html')));
}

if (mode === 'pixels'){
  /* seed 42 day 13, every 0.15 h form -> past the roost. The sky itself darkens through
   * this window, so the flock's pixels are the DIFF against HEAD's identical crop at the
   * same instants — the series must rise, hold, and fall to ~0 with no step. */
  const scan = async (file) => {
    const p = await page(file, 42);
    const rows = await p.evaluate(() => {
      const out = [];
      while (day < 13) __warp(2);
      while (hour < sunDown - 1.45) __warp(0.05);
      while (hour < sunDown + 0.15){
        __warp(0.05 * 3);
        drawScene(simT, 1/30);
        // a FIXED crop over the day-13 cloud (murBox only exists on the tree build)
        const c = project(121, -7.6, 0);
        const x0 = Math.max(0, (c[0] - 90) * DPR | 0), y0 = Math.max(0, (c[1] - 40) * DPR | 0);
        const d = ctx.getImageData(x0, y0, 180 * DPR, 80 * DPR).data;
        const nm = typeof murBox !== 'undefined' && murBox.on ? lookAt([murBox.x, murBox.y]) : '';
        out.push([+hour.toFixed(2), typeof murmEnv === 'function' ? +murmEnv().toFixed(2) : 0, Array.from(d), nm]);
      }
      return out;
    });
    await p.close(); return rows;
  };
  const head = await scan('/tmp/head.html'), tree = await scan('courtyard.html');
  let prev = 0;
  for (let i = 0; i < tree.length; i++){
    const [h, e, dT, nm] = tree[i], dH = head[i][2];
    let n = 0;
    for (let j = 0; j < dT.length; j += 4)
      if (Math.abs(dT[j] - dH[j]) + Math.abs(dT[j + 1] - dH[j + 1]) + Math.abs(dT[j + 2] - dH[j + 2]) > 12) n++;
    console.log(h.toFixed(2), 'env', e.toFixed(2), 'flockPx', String(n).padStart(6), 'step', String(n - prev).padStart(6), nm);
    prev = n;
  }
}

await b.close();
