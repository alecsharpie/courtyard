// Run from the repo root: node .claude/skills/grow-courtyard/probes/mist-year.mjs [file]  (#88)
// Price the mist rule: histogram the morning's (warmth, wetF, windF, cloud, raining) at sunUp+0.5 across a year × seeds.
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch();
const file = process.argv.slice(2).find(a => !a.startsWith('--')) || 'courtyard.html';
const seeds = [1,2,3,4,5,6,7,8];
const rows = [];
for (const s of seeds){
  const p = await b.newPage({ viewport:{width:1200, height:700} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=' + s + '&t=0&pause'); await p.waitForFunction(() => window.__warp);
  const r = await p.evaluate(() => {
    window.__reseed();
    const out = []; const H = DAY_LEN / 24;
    // walk day by day: land at sunUp+0.5 of each morning (solved on arrival)
    for (let d = 0; d < SEASON_LEN; d++){
      // advance to next sunUp+0.5 (hour runs 6..30)
      let ahead = 12;                                   // hours ahead, fixed-pointed on the sun at arrival
      for (let k = 0; k < 3; k++){ const s2 = sunAt(simT + ahead * H); ahead = ((s2.up + 0.5) - hour + 48) % 24; if (ahead < 1) ahead += 24; }
      window.__warp(ahead * H, 1/15);
      out.push({ d: day, hour: +hour.toFixed(2), warmth: +warmth.toFixed(2), wet: +wetF().toFixed(2), wind: +windF().toFixed(2), cloud: +cloudCover().toFixed(2), rain: raining ? 1 : 0, mist: typeof mistF === 'function' ? +mistF().toFixed(2) : -1 });
    }
    return out;
  });
  for (const x of r) rows.push({ seed: s, ...x });
  await p.close();
  process.stdout.write('seed ' + s + ' done\n');
}
await b.close();
// season bands by warmth: winter < 0.3, shoulder 0.3..0.7, summer > 0.7
const band = w => w < 0.3 ? 'winter' : w > 0.7 ? 'summer' : 'shoulder';
const agg = {};
for (const r of rows){
  const k = band(r.warmth); agg[k] ||= { n:0, wet3:0, calm:0, clear:0, rain:0, coldOrWet:0, briefRule:0, mist:0 };
  const a = agg[k]; a.n++;
  if (r.wet > 0.3) a.wet3++; if (r.wind < 0.3) a.calm++; if (r.cloud < 0.4) a.clear++; if (r.rain) a.rain++;
  const cw = r.wet > 0.3 || r.warmth < 0.4; if (cw) a.coldOrWet++;
  if (r.warmth < 0.65 && r.wind < 0.3 && r.cloud < 0.4 && !r.rain && cw) a.briefRule++;
  if (r.mist > 0.5) a.mist++;
}
console.log(JSON.stringify(agg, null, 1));
console.log('wet histogram (all mornings):', JSON.stringify(rows.reduce((h, r) => { const k = Math.min(9, Math.floor(r.wet * 10)); h[k] = (h[k]||0) + 1; return h; }, {})));
console.log('cloud histogram:', JSON.stringify(rows.reduce((h, r) => { const k = Math.min(9, Math.floor(r.cloud * 10)); h[k] = (h[k]||0) + 1; return h; }, {})));
console.log('wind histogram:', JSON.stringify(rows.reduce((h, r) => { const k = Math.min(9, Math.floor(r.wind * 10)); h[k] = (h[k]||0) + 1; return h; }, {})));
import('node:fs').then(fs => fs.writeFileSync('/tmp/mist-rows.json', JSON.stringify(rows)));
