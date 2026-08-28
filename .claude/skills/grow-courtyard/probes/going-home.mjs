/* share at the CHOICE: over ten seed-nights, how many walkers were asked home (goHome called
 * after dark), how many went, why the rest did not; and every register arrival checked
 * against windowHours (home tonight, before the dawn edge). */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = resolve(process.argv[2] || 'courtyard.html');
const b = await chromium.launch();
const tot = { asked: 0, went: 0, share: 0, noDoor: 0, arrived: 0, bad: 0, late: 0, kinds: {} };
for (let seed = 1; seed <= 10; seed++){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + '?pause&seed=' + seed);
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(() => {
    const DAY = 55, dayN = 3; window.__reseed();
    window.__setTime(dayN * DAY + DAY * (16 - 6) / 24); window.__warp(0.001);
    const duskAt = sunDown - NIGHT_K * dayHours;
    window.__setTime(dayN * DAY + DAY * (duskAt - 1 - 6) / 24); window.__warp(0.001);
    const o = { asked: 0, went: 0, share: 0, noDoor: 0, arrived: 0, bad: 0, kinds: {} };
    const orig = goHome;
    goHome = a => { if (nightF <= 0.3) return orig(a); o.asked++; const r = orig(a);
      if (r){ o.went++; o.kinds[a.kind] = (o.kinds[a.kind] || 0) + 1; }
      else if (hash(Math.round(a.speed * 1e4), 53) >= HOME_SHARE) o.share++; else o.noDoor++; return r; };
    const seen = new Set();
    for (let i = 0; i < (14 * DAY / 24) / 0.05; i++){
      window.__warp(0.05);
      for (const [key, v] of HOMES){ if (v.t === null || seen.has(key)) continue; seen.add(key); o.arrived++;
        const w = windowHours(Math.floor(key / 1000), key % 1000);
        if (!w || w.nid !== v.nid) o.bad++; else if (v.t + HOME_MIN >= w.last) o.late = (o.late || 0) + 1; }
    }
    return o;
  });
  console.log('seed', seed, JSON.stringify(r));
  for (const k of ['asked','went','share','noDoor','arrived','bad','late']) tot[k] += r[k] || 0;
  for (const k in r.kinds) tot.kinds[k] = (tot.kinds[k] || 0) + r.kinds[k];
  await p.close();
}
console.log('TOTAL', JSON.stringify(tot), 'share at the choice', (tot.went / tot.asked).toFixed(2));
await b.close();
