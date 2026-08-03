/* two moments the brief names, HEAD beside HERE, same seed, same instant.
 *   node shot-workday.mjs                       (needs /tmp/courtyard-head.html)
 * winter pre-dawn: does anyone work in the dark?  summer evening: is the long
 * evening used?  Pinned with ?pause + __setTime, never by sleeping (LAWS). */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const DAY_LEN = 55, hourToT = (d, h) => d * DAY_LEN + ((h - 6 + 24) % 24) / 24 * DAY_LEN;
// day 18 = midwinter market day (sunUp 6.90); day 6 = midsummer market day (sunDown 21.49)
const MOMENTS = [
  { name: 'winter-predawn', t: hourToT(18, 5.6), clip: { x: 200, y: 430, width: 850, height: 330 } },
  { name: 'summer-evening', t: hourToT(6, 19.6), clip: { x: 200, y: 430, width: 850, height: 330 } },
];
const FILES = { head: '/tmp/courtyard-head.html', here: 'courtyard.html' };
const b = await chromium.launch();
for (const [label, file] of Object.entries(FILES)){
  for (const m of MOMENTS){
    const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
    await p.goto(pathToFileURL(resolve(file)).href + '?seed=42&t=0&pause');
    await p.waitForFunction(() => window.__warp);
    // __warp, not __setTime: a sweeper is a spawned agent, so the sim has to have RUN
    // through the dawn for him to exist. One evaluate — the page keeps running between
    // host round-trips (LAWS).
    const info = await p.evaluate(t => {
      window.__reseed(); window.__setTime(0); window.__warp(t);
      return { hour: +hour.toFixed(2), sunUp: +sunUp.toFixed(2), sunDown: +sunDown.toFixed(2),
               daylight: +daylight.toFixed(2), kiosk: kioskOpen(), mkt: marketActive(),
               raise: [0,1,2].map(i => +marketRaise(i).toFixed(2)),
               sweeperOut: window.__entities().some(e => e.kind === 'sweeper') };
    }, m.t);
    await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await p.screenshot({ path: `shots/wd-${m.name}-${label}.png`, clip: m.clip });
    console.log(`${m.name.padEnd(16)} ${label.padEnd(5)} hour ${info.hour}  sun ${info.sunUp}–${info.sunDown}  ` +
                `light ${info.daylight}  kiosk=${info.kiosk}  market=${info.mkt}  raise=${info.raise.join("/")}  sweeperOut=${info.sweeperOut}`);
    await p.close();
  }
}
await b.close();
