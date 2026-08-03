/* east-shots — the brief's own success test, at a clock hour I actually control.
 *
 *   node .claude/skills/grow-courtyard/probes/east-shots.mjs
 *
 * shoot.mjs loads with `?fast` and waits 2600 ms, which advances the sim ~20 s —
 * about nine sim-hours. That is fine for a regression shot and useless for "midday
 * vs night". This pins ?pause, warps ~4 settled days, and shoots at the hour asked for.
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;

const WARM = 220;                                   // ~4 settled days before the shot, so night is a steady-state night
const WHEN = [['midday', 1225], ['night', 1251]];   // hour 12.5 and hour 23.9 on day 23
const CLIP = { wide: null, east: {x:1000, y:175, width:440, height:500}, alley: {x:940, y:300, width:300, height:230} };

const b = await chromium.launch();
for (const [tag, t] of WHEN){
  const p = await b.newPage({ viewport:{width:1600, height:950}, deviceScaleFactor:2 });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(pathToFileURL(resolve(process.argv[2] || 'courtyard.html')).href + `?pause&seed=42&t=${t - WARM}`);
  await p.waitForFunction(() => window.__warp);
  const info = await p.evaluate((tgt) => {
    window.__reseed();
    // warp against simT itself, not a step count: the frames between load and the
    // first warp advance the clock by a machine-dependent amount
    let guard = 0;
    while (simT < tgt && guard++ < 40000) window.__warp(0.05);
    const c = window.__census();
    return {hour:+hour.toFixed(2), people:c.life.people, east:c.life.inEast,
            quay:agents.filter(a => a.x >= 112 && a.x < 114).length,
            green:agents.filter(a => a.x >= 130).length};
  }, t);
  await p.waitForTimeout(400);                      // let a few rAF frames draw the warped state
  for (const [name, clip] of Object.entries(CLIP))
    await p.screenshot({path:`shots/${process.argv[3]||''}${tag}-${name}.png`, ...(clip ? {clip} : {})});
  console.log(`${tag.padEnd(7)} hour ${String(info.hour).padStart(5)}  people ${info.people}  ` +
              `inEast ${info.east}  (on the quay ${info.quay}, on the far bank ${info.green})`);
  await p.close();
}
await b.close();
