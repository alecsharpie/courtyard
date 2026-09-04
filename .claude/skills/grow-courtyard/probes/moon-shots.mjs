/* b196 — the look, held as a CONTROL rather than as two nights a fortnight apart.
 *
 * A fortnight apart the SEASON has moved too, so a pair of those frames is a look and not
 * a control. This holds ONE instant — one day, one sun, one weather, one seeded world —
 * and moves only MOON_START, which is a `let` for this reason. It writes the pair, the
 * same instant at HEAD, and the difference MASS between them, with a same-code floor.
 *
 *   node .../probes/moon-shots.mjs [cand] [base]
 */
import { homedir } from 'node:os'; import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url'; import { mkdirSync, writeFileSync } from 'node:fs';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const CAND = process.argv[2] || 'courtyard.html';
const BASE = process.argv[3] || '/tmp/head196.html';
const OUT = 'shots'; mkdirSync(OUT, { recursive: true });
const VP = { width: 1600, height: 950 };
// day 8 is high summer here, day 22 is deep winter: snow lying, a skin on the river
const WHEN = [{ tag: 'summer', day: 8 }, { tag: 'winter', day: 22 }];
const PHASES = [{ tag: 'full', ph: 0.5 }, { tag: 'new', ph: 0.0 }];

const b = await chromium.launch();
async function run(file, hasMoonStart){
  const p = await b.newPage({ viewport: VP, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(pathToFileURL(resolve(file)).href + '?seed=42&pause&t=0');
  await p.waitForFunction('typeof __warp === "function"');
  const shots = [];
  for (const w of WHEN){
    const st = await p.evaluate(({ day, first }) => {
      if (first) __reseed();          // once, at the entry: reseed THEN step, or the two builds are two worlds
      const step = DAY_LEN / 96;
      while (simT < day * DAY_LEN) __warp(step);
      let g = 0;
      const alt = () => { const ma = moonArc(); return (ma > 0 && ma < 1) ? Math.sin(Math.PI * ma) : 0; };
      while (!(daylight <= 0.02 && nightF > 0.6 && alt() > 0.55) && g++ < 4000) __warp(step);
      return { ok: g < 4000, at: simT, d: +(simT/DAY_LEN).toFixed(2), h: +hour.toFixed(2),
               cc: +cloudCover().toFixed(3), snow: +snowCover.toFixed(3), ice: iceOn, alt: +alt().toFixed(3) };
    }, { ...w, first: w === WHEN[0] });
    if (!st.ok){ console.log(w.tag + ': no moon-up night found'); continue; }
    console.log(file.split('/').pop() + ' ' + w.tag + ': day ' + st.d + ' hour ' + st.h +
                '  cloud ' + st.cc + '  snowCover ' + st.snow + '  frozen ' + st.ice + '  alt ' + st.alt);
    for (const f of PHASES){
      const lum = await p.evaluate(({ at, ph, hasMS }) => {
        if (hasMS) MOON_START = (ph - (at / DAY_LEN) / MOON_DAYS % 1 + 2) % 1;
        drawScene(at, 0);
        const c = document.getElementById('cv'), g = c.getContext('2d');
        const d = g.getImageData(0, 0, c.width, c.height).data;
        let s = 0, n = 0;
        for (let i = 0; i < d.length; i += 16){ s += 0.2126*d[i] + 0.7152*d[i+1] + 0.0722*d[i+2]; n++; }
        return { luma: +(s/n).toFixed(3), phase: +moonPhase().toFixed(3), lit: +moonLit().toFixed(3) };
      }, { at: st.at, ph: f.ph, hasMS: hasMoonStart });
      const name = OUT + '/moon-' + (hasMoonStart ? '' : 'head-') + w.tag + '-' + f.tag + '.png';
      writeFileSync(name, await p.locator('#cv').screenshot());
      console.log('   -> ' + name + '   phase ' + lum.phase + ' lit ' + lum.lit + '  luma ' + lum.luma);
      shots.push({ w: w.tag, f: f.tag, ...lum });
    }
  }
  if (errs.length) console.log('  PAGE ERRORS:', errs.slice(0, 3));
  await p.close();
  return shots;
}
const C = await run(CAND, true);
const H = await run(BASE, false);     // HEAD has no MOON_START to move: both its frames are the same frame
await b.close();
console.log('\n--- the pair, held at one instant');
for (const w of WHEN){
  const cf = C.find(r => r.w === w.tag && r.f === 'full'), cn = C.find(r => r.w === w.tag && r.f === 'new');
  const hf = H.find(r => r.w === w.tag && r.f === 'full');
  if (!cf || !cn || !hf) continue;
  console.log('  ' + w.tag.padEnd(7) + 'HEAD ' + hf.luma.toFixed(2) +
              '   cand new ' + cn.luma.toFixed(2) + '   cand full ' + cf.luma.toFixed(2) +
              '   full/new x' + (cf.luma / cn.luma).toFixed(2));
}
