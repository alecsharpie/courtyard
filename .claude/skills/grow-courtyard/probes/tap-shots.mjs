/* tap-shots — the lit door on the lane, across one evening and across the year.
 *
 *   node .claude/skills/grow-courtyard/probes/tap-shots.mjs [path-to-courtyard.html]
 *
 * shoot.mjs's `lane` framing is clipped to our OWN frontage at the bottom of the view
 * and cannot see the north footway at all. This crops to the door itself — and takes
 * the clip from project() rather than from a measured pixel, so it stays pointed at the
 * door if the framing ever moves.
 *
 * The set is the ramp: shut in the afternoon, the lamp coming up, the evening at full,
 * and after last orders with the light still on. Then the same hour in midwinter, when
 * the door has been open four hours longer.
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILE = pathToFileURL(resolve(process.argv[2] || 'courtyard.html')).href;
const OUT = resolve('shots');
mkdirSync(OUT, { recursive: true });

/* simT lands on an exact hour AND a chosen season phase only at 55n + <hour offset>:
 * phase advances 1/26 per day, so n picks the season and the offset picks the hour.
 * n=6 -> phase 0.506 (midsummer), n=19 -> phase 0.006 (midwinter). */
const H = h => ((h < 6 ? h + 24 : h) - 6) / 24 * 55;
const MARKS = [
  ['a-shut',    6 * 55 + H(14.0), 42],   // midsummer, mid-afternoon: a green door, nothing on
  ['b-up',      6 * 55 + H(19.5), 42],   // an hour after opening, the lamp coming up
  ['c-full',    6 * 55 + H(22.0), 42],   // the evening at full dark
  ['d-after',   6 * 55 + H(2.0),  42],   // after last orders, before the shut
  // midwinter's sky is greyer BY DESIGN (greyF), so seed 42 rains through both of its
  // 22.00s and rain empties the pavement on purpose. Two other seeds, same instant.
  ['e-winter',  19 * 55 + H(22.0), 7],
  ['f-winter',  19 * 55 + H(22.0), 11],
];

const b = await chromium.launch();
for (const [name, t, seed] of MARKS){
  const p = await b.newPage({ viewport:{width:1600, height:950}, deviceScaleFactor:4 });
  p.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await p.goto(FILE + `?pause&seed=${seed}&t=0`);
  await p.waitForFunction(() => window.__warp);
  const info = await p.evaluate(tt => {
    window.__reseed();
    window.__warp(tt);
    /* The box the door and its footway occupy, in the renderer's own terms: from the
     * lamp bracket down past the walking line, so no pixel here is a guessed constant.
     * project() is relative to the canvas PARENT, not to the page — the first cut of
     * this probe clipped at the raw projected numbers and photographed 190 px of the
     * frame's left border instead (laws: a screen coordinate observes the frame). */
    const r = document.querySelector('canvas').parentElement.getBoundingClientRect();
    const [x0, y0] = project(TAP_DOOR + 0.5, TAP_FACE, 3.6);
    const [, y1] = project(TAP_DOOR + 0.5, TAP_FACE + 2.6, 0);
    const x = x0 + r.left, y = y0 + r.top, yb = y1 + r.top;
    const standing = agents.filter(a => a.tap && a.stopped && a.state === 'stand').length;
    return {x, y, yb, hour, day, warmth:+warmth.toFixed(3), tapOpen:tapOpen(), tapF:+tapF().toFixed(3),
            serving:tapServing(), raining, tap:agents.filter(a => a.tap).length, standing};
  }, t);
  const clip = { x: Math.round(info.x - 46), y: Math.round(info.y),
                 width: 92, height: Math.round(info.yb - info.y) };
  await p.screenshot({ path: join(OUT, 'tap-' + name + '.png'), clip });
  console.log(`${name.padEnd(10)} t=${t.toFixed(1)} day ${String(info.day).padStart(2)} hour ${info.hour.toFixed(2)} ` +
    `warmth ${info.warmth}  open=${info.tapOpen?'y':'n'} f=${String(info.tapF).padEnd(5)} serving=${info.serving?'y':'n'} ` +
    `${info.raining?'RAIN ':'     '}at the door: ${info.tap} (${info.standing} standing)`);
  await p.close();
}
await b.close();
console.log('-> shots/tap-*.png');
