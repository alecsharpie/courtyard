#!/usr/bin/env node
/* probe-balloon.mjs — the balloon's DAY (#188, c265).
 *
 *   node balloon-day.mjs <page> [seeds] [days] [step]
 *
 * The census cannot see the balloon (it is one draw-path object with no census field)
 * and the motion gate almost never meets one, so the only way to price c265 is to watch
 * the world for a year and write down every flight: when it set out, how long it was up,
 * how far it got, and — the whole question — whether it was ever up in the DARK.
 * Run it against a HEAD copy and against the working tree; the numbers only mean
 * something as a pair.
 */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const PAGE = pathToFileURL(resolve(process.argv[2] || 'courtyard.html')).href;
const seeds = (process.argv[3] || '7,42,99,1234,2026,31337').split(',').map(Number);
const days = +(process.argv[4] || 104), step = +(process.argv[5] || 0.5);
const DAY_LEN = 55;
const b = await chromium.launch();
const all = [];
let nightSamp = 0, nightUp = 0, samp = 0, up = 0;
for (const seed of seeds){
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`${PAGE}?seed=${seed}&t=0&pause`);
  await p.waitForTimeout(250);
  const r = await p.evaluate(([days, step, DAY_LEN]) => {
    __reseed(); __setTime(0);
    const flights = []; let cur = null, s = 0, u = 0, ns = 0, nu = 0;
    const end = days * DAY_LEN;
    for (let t = 0; t < end; t += step){
      __warp(step, 1 / 30);
      const dark = nightF > 0.5;
      s++; if (dark) ns++;
      if (balloon){
        u++; if (dark) nu++;
        if (!cur) cur = { t0: simT, x0: balloon.x, y: +balloon.y.toFixed(1), sa0: +sunArc.toFixed(3),
                          day: day, dark: 0, xMax: balloon.x, fell: 0 };
        cur.xMax = balloon.x; cur.t1 = simT; cur.sa1 = +sunArc.toFixed(3);
        if (dark) cur.dark++;
        if (balloon.fall) cur.fell = 1;
      } else if (cur){ flights.push(cur); cur = null; }
    }
    if (cur) flights.push(cur);
    return { flights, s, u, ns, nu };
  }, [days, step, DAY_LEN]);
  if (errs.length) console.log('  PAGE ERROR', errs[0]);
  samp += r.s; up += r.u; nightSamp += r.ns; nightUp += r.nu;
  for (const f of r.flights) all.push({ seed, ...f, dur: +(f.t1 - f.t0 + step).toFixed(2) });
  console.log(`seed ${String(seed).padStart(5)}: ${String(r.flights.length).padStart(3)} flights` +
              `  aloft ${(100 * r.u / r.s).toFixed(1)}% of all samples, ${(100 * r.nu / r.ns).toFixed(1)}% of DARK ones`);
  await p.close();
}
await b.close();
const d = all.map(f => f.dur).sort((a, b) => a - b);
const q = k => d.length ? d[Math.min(d.length - 1, Math.floor(k * d.length))] : 0;
console.log(`\n${all.length} flights over ${seeds.length} seeds x ${days} days` +
            `  (${(all.length / (seeds.length * days / 26)).toFixed(2)} per season, one every ${(seeds.length * days / (all.length || 1)).toFixed(1)} days)`);
console.log(`aloft: median ${q(0.5)} s (${(q(0.5) / DAY_LEN).toFixed(2)} days) · max ${d[d.length - 1]} s (${(d[d.length - 1] / DAY_LEN).toFixed(2)} days)` +
            ` · mean ${(d.reduce((a, b) => a + b, 0) / (d.length || 1)).toFixed(1)} s`);
console.log(`in the DARK: ${(100 * nightUp / nightSamp).toFixed(2)}% of night samples carried one` +
            ` · ${all.filter(f => f.dark).length} of ${all.length} flights saw any dark at all`);
console.log(`came DOWN (vs left east): ${all.filter(f => f.fell).length} of ${all.length}` +
            ` · furthest east reached x=${Math.max(0, ...all.map(f => f.xMax)).toFixed(1)}` +
            ` · median xMax ${all.length ? all.map(f => f.xMax).sort((a, b) => a - b)[all.length >> 1].toFixed(1) : '-'}`);
console.log('set-out sunArc: ' + (all.length ? `${Math.min(...all.map(f => f.sa0)).toFixed(2)}..${Math.max(...all.map(f => f.sa0)).toFixed(2)}` : '-'));
