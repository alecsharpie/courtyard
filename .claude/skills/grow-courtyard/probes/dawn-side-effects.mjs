// #112 pulled the dawn edge back to first light, which SHORTENS every window written as
// `nightF > 0.3` / `nightF < 0.2` by 1.4 h in winter and 2.2 h in summer. Two of those
// windows carry population, so they are the ones to count rather than assume:
//   homers   — spawnHomeAgent fires while nightF > 0.3 (the lane's only night source),
//              and its door must also fit inside w.last, which moved with the edge
//   the cat  — catA spawns at nightF > 0.5 and is dropped at nightF < 0.2
// Counts arrivals and cat-nights over a real run, 10 seeds x 6 days, both builds.
//   usage: dawn-side-effects.mjs [file.html]
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const file = resolve(process.argv[2] || 'courtyard.html');
const SEEDS = [1, 2, 3, 5, 7, 11, 13, 17, 23, 42], DAYS = 6;
const b = await chromium.launch();
let homers = 0, catSamples = 0, catRoof = 0, samples = 0, nights = 0, catNights = 0;
for (const seed of SEEDS){
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + '?pause&seed=' + seed);
  await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(DAYS => {
    let seen = new Set(), hom = 0, cs = 0, cr = 0, n = 0;
    const nids = new Set(), catNids = new Set();   // count the nights we actually OBSERVED, not the days we asked for
    const step = DAY_LEN / 24 / 12;                 // ~5 sim minutes
    window.__warp(DAY_LEN * 2);                     // let the town settle
    for (let i = 0; i < DAYS * 24 * 12; i++){
      window.__warp(step);
      for (const a of agents) if (a.homer && !seen.has(a)){ seen.add(a); hom++; }
      const nid = nightAt().nid;
      if (nightF > 0.3) nids.add(nid);
      if (catA){ cs++; if (catA.leg === 'ridge' || catA.leg === 'climb') cr++; catNids.add(nid); }
      n++;
    }
    return { hom, cs, cr, n, nights: nids.size, catNights: catNids.size };
  }, DAYS);
  homers += r.hom; catSamples += r.cs; catRoof += r.cr; samples += r.n; catNights += r.catNights; nights += r.nights;
  await p.close();
}
await b.close();
console.log(file.split('/').pop(), `· ${SEEDS.length} seeds x ${DAYS} days`);
console.log('  nights observed                          : ' + nights);
console.log('  homers (spawnHomeAgent arrivals) per night: ' + (homers / nights).toFixed(2) + `   (${homers} total)`);
console.log('  nights with a cat                        : ' + (100 * catNights / nights).toFixed(1) + '%');
console.log('  cat on screen, share of all samples      : ' + (100 * catSamples / samples).toFixed(2) + '%');
console.log('  cat UP ON THE ROOF, share of all samples : ' + (100 * catRoof / samples).toFixed(2) + '%');
