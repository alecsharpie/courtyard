// Run from the repo root: node .claude/skills/grow-courtyard/probes/mist-landing.mjs  (#88)
// The morning lapse lands INSIDE the mist on a mist morning: seed 1, from 20:00 on day 13, eveningTarget() twice (evening, then morning).
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:1600, height:950} });
p.on('pageerror', e => console.log('PAGE ERROR', e.message));
await p.goto(pathToFileURL(resolve('courtyard.html')).href + '?seed=1&t=0&pause'); await p.waitForFunction(() => window.__warp);
console.log(JSON.stringify(await p.evaluate(() => {
  window.__reseed(); window.__warp(13 * DAY_LEN + 14 / 24 * DAY_LEN);   // 20:00 day 13
  const out = { start: { day, hour: +hour.toFixed(2), mist: +mistF().toFixed(2) } };
  let tg = eveningTarget(); window.__warp(tg.hours / 24 * DAY_LEN); out.evening = { day, hour: +hour.toFixed(2), evening: tg.evening, mist: +mistF().toFixed(2) };
  tg = eveningTarget(); window.__warp(tg.hours / 24 * DAY_LEN);
  out.morning = { day, hour: +hour.toFixed(2), sunUp: +sunUp.toFixed(2), evening: tg.evening, mist: +mistF().toFixed(2), name: nameAt(120, 25), eyot: nameAt(124, 46), wind: +windF().toFixed(2), cloud: +cloudCover().toFixed(2), warmth: +warmth.toFixed(2), wet: +wetF().toFixed(2) };
  // and the burn-off: sample mist every 15 min to 10:00
  const curve = []; for (let i = 0; i < 16; i++){ window.__warp(DAY_LEN / 96); curve.push(hour.toFixed(2) + ':' + mistF().toFixed(2)); } out.curve = curve.join(' ');
  return out;
}), null, 1));
await b.close();
