#!/usr/bin/env node
/* winter-window.mjs — WHERE in the year can the census see a winter? (#187)
 *
 *   node .claude/skills/grow-courtyard/probes/winter-window.mjs 7,42,1234 1000 1340 20
 *                                              ^seeds        ^from ^to ^step
 *
 * This is the instrument that PICKED census.mjs's `WINTER` row, and the one to re-run
 * if it ever prints WEAK. Midwinter is phase 0 = simT 1072.5, but the channel's skin is
 * a CA integrating a growth rate against `iceTop`, so the FREEZE lags the COLD by about
 * nine sim days and the coldest instant is one of the emptiest. What a gate wants is not
 * the extreme but the PLATEAU: the band where all three seeds have saturated and the
 * reading is the state the winter reaches rather than a sample of the path it took.
 *
 * Measured 2026-09-04: frozen is 0/0/0 at warp 1040, climbing at 1100-1160, flat over
 * 1190..1250 (7: 318..333 · 42: 326..338 · 1234: 340..340), and back to 0/31/65 by 1340.
 * warp 1220 sits on the plateau in all three — which is why census.mjs pins it there.
 */
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const PAGE = pathToFileURL(join(REPO, 'courtyard.html')).href;
const seeds = (process.argv[2] || '7,42,1234').split(',').map(Number);
const from = +(process.argv[3] || 950), to = +(process.argv[4] || 1300), step = +(process.argv[5] || 25);
const b = await chromium.launch();
for (const seed of seeds){
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${PAGE}?seed=${seed}&t=0&pause`);
  await p.waitForTimeout(250);
  const rows = await p.evaluate(([from, to, step]) => {
    window.__reseed(); window.__setTime(0);
    const out = []; let at = 0;
    for (let t = from; t <= to + 1e-9; t += step){
      window.__warp(t - at, 1/30); at = t;
      const c = window.__census();
      out.push({ t: +t.toFixed(1), day: c.clock.day, season: c.clock.season, warmth: window.warmth,
        frozen: c.ice.frozen, skin: c.ice.skin, ICE: c.tiles.ICE || 0, kinds: c.scalars.tileKinds,
        snow: c.clock.snow, windy: c.clock.windy, rain: c.clock.raining,
        people: c.scalars.people, planted: c.scalars.planted, green: c.scalars.green });
    }
    return out;
  }, [from, to, step]);
  console.log(`\n== seed ${seed} ==  ${errs.length ? 'ERRORS ' + errs[0] : ''}`);
  console.log('    t    day  season warmth frozen  skin   ICE kinds  snow w r  people planted');
  for (const r of rows) console.log(
    `${String(r.t).padStart(6)} ${String(r.day).padStart(4)} ${r.season.toFixed(4)} ${String(r.warmth===undefined?'-':r.warmth.toFixed(3)).padStart(6)} ${String(r.frozen).padStart(6)} ${r.skin.toFixed(3)} ${String(r.ICE).padStart(5)} ${String(r.kinds).padStart(5)} ${r.snow.toFixed(2)} ${r.windy?'W':'.'} ${r.rain?'R':'.'} ${String(r.people).padStart(7)} ${String(r.planted).padStart(7)}`);
  await p.close();
}
await b.close();
