/* bandstand-shots — the far bank at five levels of one concert, and in February.
 *
 *   node .claude/skills/grow-courtyard/probes/bandstand-shots.mjs
 *
 * shoot.mjs cannot see this: it lands wherever ?fast puts it, and a concert is one
 * afternoon of a summer day. This pins ?pause, warps to a known concert day, and takes
 * the far bank at the levels of bandF() the staging is built out of — nobody yet, the
 * first player up, the full set with the audience in, mid-strike, and away again. Plus
 * a midwinter afternoon at the same hour, which must be an empty green.
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = pathToFileURL(resolve(process.argv[2] || 'courtyard.html')).href;
const CLIP = { green: {x:1245, y:330, width:300, height:340}, wide: null };

const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1600, height:950}, deviceScaleFactor:2 });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto(FILE + '?pause&seed=42&t=0');
await p.waitForFunction(() => window.__warp);

// the concert day, and how far into the raise each shot sits (real seconds from the
// first trestle). Warped forward from ONE start so the audience is the audience that
// actually walked there, not one teleported into place by a clock jump.
// Warped against simT itself and never against a step COUNT: a first cut counted
// __warp(0.05) calls and landed 33% late by the fifth shot, because the frames the
// host delivers around a screenshot are not free. The clock is the only ruler here.
const MARKS = [['a-empty', 1], ['b-players', 4], ['c-gather', 14],
               ['d-full', 22], ['e-strike', 24.5], ['f-away', 28.5]];
const setup = await p.evaluate(() => {
  window.__reseed();
  let target = -1;
  for (let d = 2; d < 80; d++){ __setTime(d * DAY_LEN + 0.5 * DAY_LEN);
    if (isBandDay() && warmth > 0.8){ target = d; break; } }
  __reseed(); __setTime(0);
  __setTime(target * DAY_LEN + 0.5 * DAY_LEN);
  const rise = bandStart() - BAND_UP;
  __setTime(target * DAY_LEN + (rise - 6) / 24 * DAY_LEN);
  return {target, rise:+rise.toFixed(2), t0:simT};
});
console.log(`concert on sim day ${setup.target}, first trestle at hour ${setup.rise}`);
for (const [tag, secs] of MARKS){
  const info = await p.evaluate(tgt => {
    let g = 0; while (simT < tgt && g++ < 8000) window.__warp(0.05);
    const ents = window.__entities().filter(e => e.band);
    return {hour:+hour.toFixed(2), f:+bandF().toFixed(2),
            standing:ents.filter(e => e.act === 'stand').length, walking:ents.length};
  }, setup.t0 + secs);
  await p.waitForTimeout(350);                    // a few rAF frames on the warped state
  for (const [name, clip] of Object.entries(CLIP))
    await p.screenshot({path:`shots/band-${tag}-${name}.png`, ...(clip ? {clip} : {})});
  console.log(`  ${tag.padEnd(9)} +${String(secs).padStart(4)}s  hour ${info.hour}  bandF ${info.f}` +
              `  audience ${info.walking} (${info.standing} standing)`);
}

// and the same hour in February
const win = await p.evaluate(() => {
  window.__reseed();
  let target = -1;
  for (let d = 2; d < 80; d++){ __setTime(d * DAY_LEN + 0.5 * DAY_LEN); if (warmth < 0.05){ target = d; break; } }
  __setTime(target * DAY_LEN + (14.5 - 6) / 24 * DAY_LEN);
  let g = 0; while (g++ < 900) window.__warp(0.05);
  return {target, hour:+hour.toFixed(2), warm:+warmth.toFixed(2), on:isBandDay(), f:+bandF().toFixed(2),
          band:window.__entities().filter(e => e.band).length};
});
await p.waitForTimeout(350);
for (const [name, clip] of Object.entries(CLIP))
  await p.screenshot({path:`shots/band-z-winter-${name}.png`, ...(clip ? {clip} : {})});
console.log(`  ${'z-winter'.padEnd(9)}        hour ${win.hour}  warmth ${win.warm}  bandDay ${win.on}` +
            `  bandF ${win.f}  audience ${win.band}   ${!win.on && win.band === 0 ? 'PASS' : 'FAIL'}`);
await b.close();
