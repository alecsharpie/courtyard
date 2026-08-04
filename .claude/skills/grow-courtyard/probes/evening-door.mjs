/* evening-door — does anybody STOP in this town after dark?
 *
 *   node .claude/skills/grow-courtyard/probes/evening-door.mjs [path-to-courtyard.html]
 *
 * Brief b35's premise, made a number. Every itinerary branch in spawnLaneAgent() that
 * sets a `stop` opens with `sun && …`, so the claim is that the dark hours contain
 * walkers who only ever cross. This folds many seeded days at 0.25 s of sim time and,
 * two sim-hours per row, reports how many STREET people are present and how many of
 * them are standing still at something.
 *
 * The daytime rows are the control: they must be strongly non-zero, or a clean zero at
 * 22.00 is the instrument failing rather than the town being shut (laws: a zero is
 * evidence only if you show the test can be non-zero). Courtyard walkers are counted
 * apart — the garden has always had night sitters and they are not what b35 is about.
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const file = resolve(process.argv[2] || 'courtyard.html');
const SEEDS = [3, 7, 11, 19];
const b = await chromium.launch();
const acc = {};
let born = 0, bornDark = 0, bornDarkStop = 0, maxLife = 0, lateOut = 0;
let maxTapLife = 0, shutLift = 0, lastStand = 0;

for (const seed of SEEDS){
  const p = await b.newPage();
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}`);
  await p.waitForFunction(() => window.__warp);
  const out = await p.evaluate(() => {
    window.__reseed();                       // a paused frame still burns PRNG draws
    const bands = {};
    const seen = new WeakMap();
    let born = 0, bornDark = 0, bornDarkStop = 0, maxLife = 0; const lateOut = [];
    let maxTapLife = 0, shutLift = 0, lastStand = 0;
    const still = a => a.stopped && (a.state === 'sit' || a.state === 'stand' || a.state === 'lie');
    for (let i = 0; i < 22000; i++){         // 22000 * 0.05 = 1100 s = 20 days
      window.__warp(0.05);
      for (const a of agents) if (a.street && !seen.has(a)){
        seen.set(a, simT); born++;
        if (daylight <= 0.3){ bornDark++; if (a.stop) bornDarkStop++; }
      }
      if (i % 5) continue;                   // sample every 0.25 s
      const b0 = Math.floor(hour / 2) * 2;
      const band = String(b0).padStart(2, '0') + 'h';
      const r = bands[band] || (bands[band] = {samples:0, street:0, still:0, tap:0, court:0, dark:0});
      r.samples++;
      if (daylight <= 0.3) r.dark++;
      for (const a of agents){
        if (!a.street){ r.court++; continue; }
        r.street++;
        if (still(a)) r.still++;
        if (a.tap) r.tap++;
        const life = simT - seen.get(a);
        if (life > maxLife) maxLife = life;
        if (!a.tap) continue;
        if (life > maxTapLife) maxTapLife = life;
        /* The claim the code makes is that the pavement empties on its own timers and
         * the !tapOpen() lift is only a backstop. That is only evidence if it is
         * counted: a sample with somebody still STANDING at the door after the shut is
         * the exact state the bug would leave, and lastStand is the margin — the latest
         * hour anyone was still standing, against the 27.0 the door shuts at. */
        if (a.stopped && a.state === 'stand'){
          const he = hour < 6 ? hour + 24 : hour;
          if (he > lastStand && he > 12) lastStand = he;
          if (!tapOpen()) shutLift++;
        }
        if (hour >= 2 && hour < 5) lateOut.push('life=' + life.toFixed(0));
      }
    }
    return {bands, born, bornDark, bornDarkStop, maxLife:+maxLife.toFixed(1),
            maxTapLife:+maxTapLife.toFixed(1), shutLift, lastStand:+lastStand.toFixed(2),
            lateOut:lateOut.length};
  });
  for (const [band, r] of Object.entries(out.bands)){
    const t = acc[band] || (acc[band] = {samples:0, street:0, still:0, tap:0, court:0, dark:0});
    for (const k of Object.keys(t)) t[k] += r[k];
  }
  born += out.born; bornDark += out.bornDark; bornDarkStop += out.bornDarkStop;
  maxLife = Math.max(maxLife, out.maxLife); lateOut += out.lateOut;
  maxTapLife = Math.max(maxTapLife, out.maxTapLife);
  shutLift += out.shutLift; lastStand = Math.max(lastStand, out.lastStand);
  await p.close();
}
await b.close();

console.log(`file: ${file}   seeds: ${SEEDS.join(',')}   20 sim days each`);
console.log('mean simultaneous people, by two-hour band (street = lane+east+far side):');
console.log('  band     dark%  street   STILL    at the door | courtyard');
let nightStill = 0, nightSamples = 0, dayStill = 0, daySamples = 0;
for (const [band, r] of Object.entries(acc).sort((a, b) => a[0] < b[0] ? -1 : 1)){
  const m = k => (r[k] / r.samples).toFixed(2).padStart(7);
  const dk = (100 * r.dark / r.samples);
  console.log(`  ${band.padEnd(7)}${dk.toFixed(0).padStart(5)}%${m('street')}${m('still')}${m('tap')} |${m('court')}`);
  const h = +band.slice(0, 2);
  if (h >= 22 || h < 4){ nightStill += r.still; nightSamples += r.samples; }
  if (h >= 10 && h < 16){ dayStill += r.still; daySamples += r.samples; }
}
const nightMean = nightStill / nightSamples, dayMean = dayStill / daySamples;
console.log('');
console.log(`street people STANDING STILL, 22.00-04.00 : ${nightMean.toFixed(3)}  (${nightStill} sightings / ${nightSamples} samples)`);
console.log(`the same figure at midday, 10.00-16.00    : ${dayMean.toFixed(3)}  (${dayStill} sightings / ${daySamples} samples)  <- the control`);
console.log(`margin night over an empty night          : ${nightMean.toFixed(3)}   night as a share of midday: ${(100 * nightMean / dayMean).toFixed(1)}%`);
console.log(`street agents born: ${born}   born in the dark: ${bornDark}   of those carrying a stop: ${bornDarkStop}`);
console.log(`longest street lifetime: ${maxLife}s (any kind)   longest at the door: ${maxTapLife}s  (the 40 s standing-population limit)`);
console.log(`still standing after the shut: ${shutLift} samples   latest anyone stood: hour ${lastStand.toFixed(2)} of a 27.00 shut ` +
            `(margin ${(27 - lastStand).toFixed(2)} h)   sampled at 02.00-05.00: ${lateOut}`);
