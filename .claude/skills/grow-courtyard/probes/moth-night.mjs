/* probe-moth: the moth population across a seeded year, and where it gathers.
 * Reseed, then step inside ONE evaluate; pin the instant with drawScene. */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const { chromium } = (await import(pathToFileURL(join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js')).href)).default;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const PAGE = pathToFileURL(join(REPO, 'courtyard.html')).href;

const SEEDS = [42, 7, 13, 99, 5];
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
    // a whole seeded year at 55 s/day: sample every 1.1 s = ~28 sim minutes
    for (let i = 0; i < 1300; i++){
      __warp(1.1);
      const c = __census(), e = __entities().filter(x => x.kind === 'moth');
      const byLamp = {}; for (const m of e) if (m.act === 'orbit') byLamp[m.lamp] = (byLamp[m.lamp] || 0) + 1;
      const occ = Object.keys(byLamp).length, top = Math.max(0, ...Object.values(byLamp));
      out.push({ t: +c.clock.simT.toFixed(1), day: c.clock.day, hour: c.clock.hour,
                 night: window.nightF ?? null, moths: c.life.moths, occ, top,
                 rain: c.clock.raining ? 1 : 0, season: c.clock.season });
    }
    return out;
  });
  if (errs.length) console.log('PAGE ERROR', seed, errs[0]);
  rows.push(...r.map(x => ({ ...x, seed })));
  await pg.close();
}
await br.close();

const day = rows.filter(r => r.hour > 11 && r.hour < 14);       // full daylight, both sides of noon
const night = rows.filter(r => r.hour < 2.5 || r.hour > 22.5);  // deep night
const dawn = rows.filter(r => r.hour > 4.5 && r.hour < 6.5);    // BOTH shoulders, and across the day roll at 6
const dusk = rows.filter(r => r.hour > 19.5 && r.hour < 21.5);
const st = (a, k = 'moths') => a.length ? `n=${a.length} mean=${(a.reduce((s,r)=>s+r[k],0)/a.length).toFixed(2)} max=${Math.max(...a.map(r=>r[k]))} zero=${(100*a.filter(r=>r[k]===0).length/a.length).toFixed(1)}%` : 'n=0';
console.log('DAYLIGHT 11-14h   ', st(day));
console.log('DEEP NIGHT        ', st(night));
console.log('  lamps occupied  ', st(night, 'occ'), ' busiest lamp: ' + st(night, 'top'));
console.log('DAWN 4.5-6.5h     ', st(dawn), '   <- spans the hour `day` rolls at');
console.log('DUSK 19.5-21.5h   ', st(dusk));

// non-zero on EVERY night of the year? group by night index (a night belongs to the day it STARTED)
const nights = {};
for (const r of rows){ if (r.hour > 22.5 || r.hour < 4.5){ const n = r.seed + ':' + (r.hour < 12 ? r.day - 1 : r.day); (nights[n] ||= []).push(r); } }
const empty = Object.entries(nights).filter(([, v]) => v.every(r => r.moths === 0));
console.log(`NIGHTS: ${Object.keys(nights).length} sampled, ${empty.length} with no moth at any sample`);
if (empty.length) console.log('  ', empty.slice(0, 8).map(([k, v]) => `${k} (rain ${v.filter(r=>r.rain).length}/${v.length}, season ${v[0].season.toFixed(2)})`).join('  '));

// the ceiling must move with the season and the rain, or one of the two bounds is dead
const bySeason = [0, 1, 2, 3].map(q => night.filter(r => Math.floor(((r.season % 1) + 1) % 1 * 4) === q));
console.log('by season quarter ', bySeason.map((a, i) => `q${i}:${a.length ? (a.reduce((s,r)=>s+r.moths,0)/a.length).toFixed(1) : '-'}`).join('  '));
console.log('night dry vs wet  ', st(night.filter(r=>!r.rain)), ' | WET ', st(night.filter(r=>r.rain)));
