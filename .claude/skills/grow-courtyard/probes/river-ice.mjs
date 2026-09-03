/* probe-river-ice: the channel's frozen cell count, day by day, across a seeded YEAR at
 * several seeds. Reseed, pin the clock, step inside ONE evaluate. */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const { chromium } = (await import(pathToFileURL(join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js')).href)).default;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const PAGE = pathToFileURL(join(REPO, 'courtyard.html')).href;

const SEEDS = [42, 7, 13, 99];
const br = await chromium.launch();
const rows = [];
for (const seed of SEEDS){
  const pg = await br.newPage({ viewport: { width: 1600, height: 950 } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(PAGE + `?pause&seed=${seed}&t=0`);
  await pg.waitForFunction('window.__census');
  const r = await pg.evaluate(() => {
    __reseed(); __setTime(0);
    const out = [];
    // 26 days x 55 s = 1430 s of sim = one year. Sample four times a day.
    for (let i = 0; i < 105; i++){
      __warp(13.75);
      const c = __census();
      out.push({ t: +c.clock.simT.toFixed(1), day: c.clock.day, hour: +c.clock.hour.toFixed(1),
                 season: +c.clock.season.toFixed(3), warmth: +c.clock.maturity.toFixed(3),
                 frozen: c.ice.frozen, skin: c.ice.skin, margin: c.ice.margin,
                 water: c.scalars.water, kinds: c.scalars.tileKinds,
                 WATER: c.tiles.WATER, ICE: c.tiles.ICE || 0, REED: c.tiles.REED,
                 snow: c.clock.snow, mill: 0 });
    }
    return out;
  });
  if (errs.length) console.log('PAGE ERROR', seed, errs[0]);
  rows.push(...r.map(x => ({ ...x, seed })));
  await pg.close();
}
await br.close();

// per DAY, per seed: max frozen that day
const byDay = {};
for (const r of rows){
  const k = r.seed + '/' + r.day;
  if (!byDay[k] || byDay[k].frozen < r.frozen) byDay[k] = r;
}
const days = [...new Set(rows.map(r => r.day))].sort((a, b) => a - b);
console.log('margin cells (freezable):', rows[0].margin, ' water total:', rows[0].water);
console.log('day  season ' + SEEDS.map(s => ('s' + s).padStart(7)).join(''));
for (const d of days){
  const any = rows.find(r => r.day === d);
  console.log(String(d).padStart(3), String(any.season).padStart(6), '  ' +
    SEEDS.map(s => String(byDay[s + '/' + d]?.frozen ?? '-').padStart(7)).join(''));
}
const peak = Math.max(...rows.map(r => r.frozen));
const p = rows.find(r => r.frozen === peak);
console.log('\npeak frozen', peak, 'of', rows[0].margin, 'margin cells at day', p.day, 'seed', p.seed, 'skin', p.skin);
console.log('water conserved:', [...new Set(rows.map(r => r.water))].join(','));
console.log('tileKinds seen:', [...new Set(rows.map(r => r.kinds))].sort().join(','));
const frozenDays = new Set(rows.filter(r => r.frozen > 0).map(r => r.seed + '/' + r.day));
console.log('seed-days with any ice:', frozenDays.size, 'of', SEEDS.length * days.length);
