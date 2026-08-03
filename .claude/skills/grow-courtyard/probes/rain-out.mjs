/* rain-out — how big is the single frame in which the shower stops?
 *
 *   node probe-rain-out.mjs [path-to-courtyard.html]
 *
 * The filmstrip's Δ is a whole-frame mean at a one-day gap, which is far too coarse
 * to see an ending: it reports "weather changed" and nothing finer. This finds the
 * first rain END in a seeded world, then replays the ~4 s around it at a 0.1 s gap
 * and reports the same whole-frame Δ series. The question the brief asks is whether
 * the largest Δ through the ending is a spike or is inside the window's own noise.
 *
 * Each build finds its OWN rain end — any change to the rain code reshuffles the
 * PRNG, so the shower does not land at the same instant twice. Comparing "the Δ at
 * t=175" between two builds would compare two different worlds.
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const file = resolve(process.argv[2] || 'courtyard.html');
const SEEDS = (process.argv[3] || '42,7,19').split(',').map(Number);
const PRE = 3.0, POST = 3.0, GAP = 0.1;

const b = await chromium.launch();

async function page(seed){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + `?seed=${seed}&t=0&pause`);
  await p.waitForFunction(() => window.__warp);
  await p.waitForTimeout(300);
  return p;
}

for (const seed of SEEDS){
  /* pass 1 — where does the first shower stop? */
  const p1 = await page(seed);
  const end = await p1.evaluate(() => {
    window.__reseed();
    let was = false, t = 0;
    for (let i = 0; i < 6000; i++){                 // 600 s = ~11 sim days
      window.__warp(0.1); t += 0.1;
      const r = window.__census().clock.raining;
      if (was && !r) return +t.toFixed(2);
      was = r;
    }
    return null;
  });
  await p1.close();
  if (end == null){ console.log(`seed ${seed}: no shower ended in 600 s`); continue; }

  /* pass 2 — fresh page, replay the window around it and diff frame to frame */
  const p2 = await page(seed);
  const out = await p2.evaluate(async ({ end, PRE, POST, GAP }) => {
    const cv = document.getElementById('cv');
    const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const small = document.createElement('canvas');
    small.width = 320; small.height = 190;
    const sctx = small.getContext('2d', { willReadFrequently: true });

    window.__reseed();
    window.__warp(Math.max(0, end - PRE));
    await raf();

    const rows = []; let prev = null;
    const n = Math.round((PRE + POST) / GAP);
    for (let i = 0; i <= n; i++){
      if (i) window.__warp(GAP);
      await raf();
      sctx.drawImage(cv, 0, 0, cv.width, cv.height, 0, 0, small.width, small.height);
      const d = sctx.getImageData(0, 0, small.width, small.height).data;
      let delta = null;
      if (prev){
        let sum = 0;
        for (let k = 0; k < d.length; k += 4)
          sum += Math.abs(d[k]-prev[k]) + Math.abs(d[k+1]-prev[k+1]) + Math.abs(d[k+2]-prev[k+2]);
        delta = +(sum / (d.length/4) / 3).toFixed(3);
      }
      prev = d.slice();
      const c = window.__census();
      rows.push({ t: +c.clock.simT.toFixed(2), delta, drops: c.life.raindrops, raining: c.clock.raining });
    }
    return rows;
  }, { end, PRE, POST, GAP });
  await p2.close();

  const ds = out.map(r => r.delta).filter(v => v != null);
  const sorted = [...ds].sort((a,b) => a-b);
  const med = sorted[Math.floor(sorted.length/2)];
  const max = Math.max(...ds);
  const at = out.find(r => r.delta === max);
  console.log(`\n=== seed ${seed} · shower ends at simT ≈ ${end} ===`);
  for (const r of out){
    const bar = r.delta == null ? '' : '#'.repeat(Math.min(60, Math.round(r.delta * 4)));
    console.log(`  t=${String(r.t).padStart(7)}  Δ=${String(r.delta ?? '-').padStart(7)}  drops=${String(r.drops).padStart(3)}  ${r.raining ? 'RAIN' : '   .'}  ${bar}`);
  }
  console.log(`  median Δ ${med.toFixed(3)} · max Δ ${max.toFixed(3)} (×${(max/med).toFixed(1)} median) at t=${at.t}`);
}

await b.close();
