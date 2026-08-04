/* bandstand-year — is there a concert on the green in July, and none in February?
 *
 *   node .claude/skills/grow-courtyard/probes/bandstand-year.mjs [file.html]
 *
 * Four things the census cannot see, in one pass over a folded multi-year:
 *
 *   1. PRESENCE by quarter. Concert days are a per-day hash against bandChance(), so
 *      this samples the whole year at the concert's own hour and folds it.
 *   2. ARRIVAL. The audience must gather over minutes rather than appear, so one
 *      concert is sampled every 0.25 s of sim time and the standing count printed as
 *      a series. What fails is a step from 0 to full between two samples.
 *   3. SEPARATION while STANDING (cue c49). Not at spawn — every sample. Two figures
 *      nearer than 0.9 cells render as one shape; the claimed slots are meant to hold
 *      the minimum at 1.99 forever.
 *   4. TELEPORTS at strike. Positions are sampled by identity, so a walker that jumps
 *      more than a stride between two 0.25 s samples is caught.
 *
 * A zero is only evidence if the test can be non-zero, so it prints the margin on
 * every bound and a WOULD-CATCH line naming what each check is the inverse of.
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = pathToFileURL(resolve(process.argv[2] || 'courtyard.html')).href;

const b = await chromium.launch();
const page = async () => {
  const p = await b.newPage({ viewport:{width:1400, height:840} });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(FILE + '?pause&seed=42&t=0');
  await p.waitForFunction(() => window.__warp);
  return p;
};

/* ---- 1. the year, folded ---- */
const p1 = await page();
const year = await p1.evaluate(() => {
  window.__reseed();
  const out = [];
  // 78 sim days = three SEASON_LEN years, sampled once a day at the middle of the set
  for (let d = 2; d < 80; d++){
    __setTime(d * DAY_LEN);                       // start of sim day d
    const mid = (bandStart() + bandEnd()) / 2;
    // hour runs 6.00 -> 6.00, so the afternoon of day d is (mid - 6) hours in
    __setTime(d * DAY_LEN + (mid - 6) / 24 * DAY_LEN);
    out.push({d, season:+seasonPhase.toFixed(3), warm:+warmth.toFixed(3),
              on:isBandDay() ? 1 : 0, f:+bandF().toFixed(2), hour:+hour.toFixed(2)});
  }
  return out;
});
const Q = ['midwinter', 'spring', 'midsummer', 'autumn'];
const fold = [[0,0],[0,0],[0,0],[0,0]];
for (const r of year){ const q = Math.floor(((r.season + 0.125) % 1) * 4); fold[q][0] += r.on; fold[q][1]++; }
console.log('1. CONCERT DAYS, folded over three years (sampled mid-set)');
for (let q = 0; q < 4; q++)
  console.log(`   ${Q[q].padEnd(10)} ${fold[q][0]}/${fold[q][1]} days` +
              `   ${'#'.repeat(Math.round(fold[q][0] / fold[q][1] * 30))}`);
const winter = fold[0][0], summer = fold[2][0];
console.log(`   -> midsummer ${summer}, midwinter ${winter}` +
            `   ${summer > 0 && winter === 0 ? 'PASS' : 'FAIL'}  (margin ${summer - winter} days)`);
await p1.close();

/* ---- 2,3,4. one concert, sampled every 0.25 s ---- */
const p2 = await page();
const run = await p2.evaluate(() => {
  window.__reseed();
  // find the first concert day in high summer and land on its set-up
  let target = -1;
  for (let d = 2; d < 80; d++){
    __setTime(d * DAY_LEN + 0.5 * DAY_LEN);
    if (isBandDay() && warmth > 0.8){ target = d; break; }
  }
  if (target < 0) return {err:'no concert day found in three years above warmth 0.8'};
  __reseed(); __setTime(0);
  const mid = (() => { __setTime(target * DAY_LEN + 0.5 * DAY_LEN); return bandStart() - BAND_UP; })();
  __setTime(target * DAY_LEN + (mid - 6) / 24 * DAY_LEN - 2);      // two sim seconds before the raise

  const series = [], prev = new Map();
  let minSep = 99, minSepAt = null, jumps = 0, worstJump = 0, ghosts = 0;
  for (let k = 0; k < 140; k++){                                    // 35 s: raise, set, strike
    window.__warp(0.25);
    const ents = window.__entities().filter(e => e.band);
    const standing = ents.filter(e => e.act === 'stand');
    for (const e of standing) for (const o of standing){
      if (e.id >= o.id) continue;
      const s = Math.hypot(e.x - o.x, e.y - o.y);
      if (s < minSep){ minSep = s; minSepAt = +simT.toFixed(1); }
    }
    for (const e of ents){
      const q = prev.get(e.id);
      if (q){
        const j = Math.hypot(e.x - q[0], e.y - q[1]);
        if (j > 1.2){ jumps++; worstJump = Math.max(worstJump, j); }
      }
      prev.set(e.id, [e.x, e.y]);
      // the bug's exact inverse: a listener standing somewhere that is not its slot
      if (e.act === 'stand' && e.slotD > 0.7) ghosts++;
    }
    series.push({t:+(k * 0.25).toFixed(2), f:+bandF().toFixed(2), hour:+hour.toFixed(2),
                 n:ents.length, st:standing.length,
                 rain:raining ? 1 : 0, wc:+weatherComing().toFixed(2)});
  }
  return {target, series, minSep:+minSep.toFixed(2), minSepAt, jumps,
          worstJump:+worstJump.toFixed(2), ghosts, slots:BAND_SLOTS.length};
});
if (run.err){ console.log('\n' + run.err); await b.close(); process.exit(1); }

console.log(`\n2. ONE CONCERT (sim day ${run.target}) — audience, every 0.25 s`);
let line = '';
for (const s of run.series) line += s.st === 0 ? '.' : String(Math.min(9, s.st));
console.log('   f  ' + run.series.map(s => s.f >= 1 ? '=' : s.f > 0 ? '~' : ' ').join(''));
console.log('   n  ' + line);
const peak = Math.max(...run.series.map(s => s.st));
const rises = run.series.map((s, i) => i ? s.st - run.series[i-1].st : 0);
const biggestStep = Math.max(...rises), biggestDrop = Math.min(...rises);
const onFrames = run.series.filter(s => s.st > 0).length;
console.log(`   peak standing ${peak}/${run.slots}, on screen for ${(onFrames * 0.25).toFixed(1)} s`);
const dropAt = rises.indexOf(biggestDrop);
console.log('   sky' + run.series.map(s => s.rain ? 'R' : s.wc > 0.55 ? 'c' : ' ').join(''));
console.log(`   biggest one-step gain +${biggestStep}, biggest one-step loss ${biggestDrop}` +
            ` at t=${run.series[dropAt].t}s (f ${run.series[dropAt].f}, raining ${run.series[dropAt].rain},` +
            ` weatherComing ${run.series[dropAt].wc})`);
/* The bar is a SHARE of the peak, not a count. Three of seven turning together at the
 * end of a set is a group leaving together, which is what the end of a concert looks
 * like; six of nine off their feet in one 0.25 s frame is the bug this check exists
 * for, and it is what the first cut of the feature actually did (eastOpen() clearing
 * the green wholesale at dusk). Half the peak separates the two, with the measured
 * failure at 0.67 and the measured pass at 0.43. */
const worst = Math.max(biggestStep, -biggestDrop) / peak;
console.log(`   worst single step is ${(worst * 100).toFixed(0)}% of the peak` +
            `   ${worst <= 0.5 ? 'PASS — it gathers and thins' : 'FAIL — it appears/vanishes'}` +
            `${run.series[dropAt].rain ? '  (note: rain cleared the green)' : ''}`);

console.log(`\n3. SEPARATION while standing: min ${run.minSep} cells (at simT ${run.minSepAt})` +
            `   ${run.minSep >= 0.9 ? 'PASS' : 'FAIL'}  (margin ${(run.minSep - 0.9).toFixed(2)} over the 0.9 that reads as one shape)`);
console.log(`4. CONTINUITY: ${run.jumps} steps over 1.2 cells (worst ${run.worstJump})` +
            `   ${run.jumps === 0 ? 'PASS' : 'FAIL'}`);
console.log(`   off-slot standers: ${run.ghosts}   ${run.ghosts === 0 ? 'PASS' : 'FAIL'}`);
console.log(`\n   WOULD-CATCH: (2) fails if the audience spawns at its slot instead of walking;` +
            `\n   (3) fails at 0.2 cells, which is what the birds measure after a 1.8 s random walk (c49);` +
            `\n   (4) fails if a listener is routed to the exit from where it is not standing.`);
await b.close();
