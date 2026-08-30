// #76 (b72): (oob) leaves outside the motion gate's world box, HEAD vs HERE, 10 seeds x 30 d;
// (rows) lane ROAD litter by row, HEAD vs HERE, autumn days 14-17 at 04:00 summed;
// (rain) mean raindrop dx under forced windSign +1 / -1 with windF 1, plus a crop each way;
// (anchor) windDir() === 1 exactly at sign +1 over a spell, so the rain step is HEAD's algebra.
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const HEAD = '/tmp/courtyard-head.html', HERE = resolve('courtyard.html');
const modes = process.argv.length > 2 ? process.argv.slice(2) : ['oob', 'rows', 'rain', 'anchor'];
const b = await chromium.launch();
async function open(file, seed){ const p = await b.newPage({ viewport:{width:1600, height:950} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}&t=0`); await p.waitForFunction(() => window.__warp); return p; }
const SEEDS = [1, 3, 7, 11, 19, 42, 101, 1234, 5, 13];
if (modes.includes('oob')){
  for (const [file, tag] of [[HEAD, 'HEAD'], [HERE, 'HERE']]){
    let tot = 0, seedsHit = 0, minx = 1e9, maxx = -1e9, samples = 0;
    for (const seed of SEEDS){ const p = await open(file, seed);
      const r = await p.evaluate(() => { window.__reseed(); window.__setTime(0); let oob = 0, mn = 1e9, mx = -1e9, n = 0;
        for (let i = 0; i < 30 * DAY_LEN / 0.25; i++){ window.__warp(0.25); for (const l of leaves){ n++; if (l.x < mn) mn = l.x; if (l.x > mx) mx = l.x; if (l.x < -12 || l.x > 152 || l.y < -12 || l.y > 100) oob++; } }
        return { oob, mn, mx, n }; });
      tot += r.oob; if (r.oob) seedsHit++; minx = Math.min(minx, r.mn); maxx = Math.max(maxx, r.mx); samples += r.n; await p.close(); }
    console.log(`${tag} leaf oob samples ${tot} in ${seedsHit}/10 seeds · x range [${minx.toFixed(1)}, ${maxx.toFixed(1)}] · ${samples} leaf-samples`);
  }
}
if (modes.includes('rows')){
  for (const [file, tag] of [[HEAD, 'HEAD'], [HERE, 'HERE']]){
    const hist = {};
    for (const seed of [3, 7, 11, 19]){ const p = await open(file, seed);
      const r = await p.evaluate(() => { window.__reseed(); window.__setTime(0); const h = {}; let T = 0;
        for (const d of [14, 15, 16, 17]){ const T2 = d * DAY_LEN + (4 - 6 + 24) / 24 * DAY_LEN; window.__warp(T2 - T); T = T2;
          for (let y = LN_WALK_N; y < LN_WALK_S; y++){ let s = 0; for (let x = 0; x < XS_W0; x++) s += litter[y * GW + x]; h[y] = (h[y] || 0) + s; } }
        return h; });
      for (const k in r) hist[k] = (hist[k] || 0) + r[k]; await p.close(); }
    const rows = Object.entries(hist).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(' ');
    const road = Object.entries(hist).filter(([k]) => k >= 68 && k < 76 && hist[k] > 0);
    const heaviest = road.slice().sort((a, b) => b[1] - a[1])[0];
    console.log(`${tag} lane litter by row (4 seeds x d14-17 04:00): ${rows} · ROAD rows with litter ${road.length}/8 · heaviest ${heaviest ? heaviest.join('=') : '-'}`);
  }
}
if (modes.includes('rain')){
  for (const sg of [1, -1]){ const p = await open(HERE, 7);
    const r = await p.evaluate(sg => { window.__reseed(); window.__setTime(0); let T = 0;
      for (let d = 1; d < 60 && !raining; d++){ for (let k = 0; k < 8 && !raining; k++){ T += DAY_LEN / 8; window.__warp(DAY_LEN / 8); } }
      if (!raining) return { fail: 'no rain in 60 days' };
      wind = 1; windSign = sg; signFor = () => sg; window.__warp(0.5);
      const before = raindrops.filter(r => r.f >= snowF()).map(r => [r.x, r.y]); const n0 = raindrops.length;
      window.__warp(0.1); let dx = 0, n = 0;
      for (let i = 0; i < Math.min(before.length, raindrops.length); i++){ const r = raindrops[i]; if (r.y > before[i][1] && r.f >= snowF()){ dx += r.x - before[i][0]; n++; } }
      drawScene(simT, 0);
      return { T: +simT.toFixed(1), day, hour: +hour.toFixed(2), w: +windF().toFixed(2), sign: windSign, dir: windDir(), drops: n0, meanDx: +(dx / n).toFixed(2), n, snow: +snowF().toFixed(2) }; }, sg);
    console.log('rain sign', sg, JSON.stringify(r));
    await p.screenshot({ path: `shots/b72-rain-sign${sg > 0 ? '+1' : '-1'}.png`, clip: { x: 300, y: 250, width: 500, height: 320 } });
    await p.close(); }
}
if (modes.includes('anchor')){
  const p = await open(HERE, 7);
  const r = await p.evaluate(() => { window.__reseed(); window.__setTime(0); signFor = () => 1; let bad = 0, n = 0, wmax = 0;
    for (let i = 0; i < 20 * DAY_LEN / 0.25; i++){ window.__warp(0.25); n++; wmax = Math.max(wmax, windF()); if (windDir() !== 1) bad++; }
    return { samples: n, windDirNot1: bad, windFmax: +wmax.toFixed(2), sign: windSign }; });
  console.log('anchor (sign forced +1, 20 d):', JSON.stringify(r)); await p.close();
}
await b.close();
