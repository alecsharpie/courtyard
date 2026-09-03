#!/usr/bin/env node
/* probe: the census fired COLLAPSE on `people` across its 9 (seed x warp) cells.
 * Is that the season, or is it the PRNG reshuffle that follows ANY change to what
 * gates an R() draw? Dump the same cells from both files side by side, with the two
 * things that dominate population at an instant — rain and the hour. Then widen to
 * extra seeds to establish what this statistic's noise floor actually is. */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

/* HEAD is a plain `git show HEAD:courtyard.html > /tmp/courtyard-head.html` away —
   the point of the probe is comparing two builds at identical (seed, warp). */
const ART = fileURLToPath(new URL('../../../../courtyard.html', import.meta.url));
const FILES = { HEAD: process.argv[2] || '/tmp/courtyard-head.html', HERE: process.argv[3] || ART };
const CENSUS_SEEDS = [7, 42, 1234];
const WIDE_SEEDS = [7, 42, 1234, 3, 11, 19, 77, 101];
/* the ladder travels with the census: it moved to 90/625/1520 at #14 so all three
 * cells sit at one season. --ages lets a later gate point this at its own cells. */
const agesArg = process.argv.find(a => a.startsWith('--ages='));
const AGES = agesArg ? agesArg.slice(7).split(',').map(Number) : [90, 625, 1520];

const browser = await chromium.launch();
const got = {};
for (const [label, file] of Object.entries(FILES)) {
  const url = pathToFileURL(file).href;
  got[label] = {};
  for (const seed of WIDE_SEEDS) {
    for (const w of AGES) {
      const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
      await page.goto(`${url}?pause&seed=${seed}&t=0`, { waitUntil: 'load' });
      await page.waitForFunction(() => typeof window.__warp === 'function');
      got[label][`${seed}@${w}`] = await page.evaluate(warp => {
        window.__reseed(); window.__warp(warp);
        const c = window.__census();
        return { people: c.life.people, rain: !!c.clock.raining, hour: +c.clock.hour.toFixed(1),
                 season: c.clock.season ?? -1, cloud: c.clock.cloud };
      }, w);
      await page.close();
    }
  }
}
await browser.close();

console.log('cell        HEAD  (hr rain cloud)   HERE  (hr rain cloud season)   d');
let cSumH = 0, cSumN = 0;
for (const seed of WIDE_SEEDS) for (const w of AGES) {
  const k = `${seed}@${w}`, a = got.HEAD[k], b = got.HERE[k];
  const inCensus = CENSUS_SEEDS.includes(seed);
  if (inCensus) { cSumH += a.people; cSumN += b.people; }
  console.log(`${inCensus ? '*' : ' '}${k.padEnd(11)} ${String(a.people).padStart(3)}  ` +
              `(${String(a.hour).padStart(4)} ${a.rain ? 'RAIN' : '  . '} ${a.cloud.toFixed(2)})   ` +
              `${String(b.people).padStart(3)}  (${String(b.hour).padStart(4)} ${b.rain ? 'RAIN' : '  . '} ` +
              `${b.cloud.toFixed(2)} ${b.season.toFixed(2)})  ${String(b.people - a.people).padStart(4)}`);
}
const wideH = WIDE_SEEDS.flatMap(s => AGES.map(w => got.HEAD[`${s}@${w}`].people));
const wideN = WIDE_SEEDS.flatMap(s => AGES.map(w => got.HERE[`${s}@${w}`].people));
const sum = a => a.reduce((x, y) => x + y, 0);
console.log(`\n* = a cell the census gate actually samples.`);
console.log(`census 9 cells : HEAD ${cSumH}  HERE ${cSumN}  (${((cSumN / cSumH - 1) * 100).toFixed(1)}%)`);
console.log(`all ${WIDE_SEEDS.length} seeds  : HEAD ${sum(wideH)}  HERE ${sum(wideN)}  (${((sum(wideN) / sum(wideH) - 1) * 100).toFixed(1)}%)`);

/* the noise floor: how much does this same 9-cell statistic move on HEAD alone,
   just by choosing three different seeds? If that spread brackets the diff above,
   the gate measured the reshuffle, not the change. */
const trip = [];
for (let i = 0; i + 2 < WIDE_SEEDS.length; i++) {
  const s3 = WIDE_SEEDS.slice(i, i + 3);
  trip.push(sum(s3.flatMap(s => AGES.map(w => got.HEAD[`${s}@${w}`].people))));
}
console.log(`HEAD's own 9-cell total over sliding seed triples: ${trip.join(', ')}`);
console.log(`  -> spread ${Math.min(...trip)}..${Math.max(...trip)} = ` +
            `${((Math.max(...trip) / Math.min(...trip) - 1) * 100).toFixed(0)}% on IDENTICAL code`);
