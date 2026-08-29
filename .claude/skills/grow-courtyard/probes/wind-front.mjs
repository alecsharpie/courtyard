#!/usr/bin/env node
/* probe: the wind's SECOND cause (#65). HEAD's wind target is the day hash alone; HERE
 * adds a front term rising with cloudCover(). Over N seeds x 30 days, sampled every
 * 0.25 s of warped time: windy-day mean and calm-day mean (by windyDay(), the hash),
 * the windy CLASS fraction of samples (isWindy()), the max slope per sim hour (the cap
 * must hold), how much wind sits inside rain, and the first calm day with a front
 * building through hours 10-14 with no rain (for the crop series).
 *   node .claude/skills/grow-courtyard/probes/wind-front.mjs [file ...]
 */
import { homedir } from 'node:os'; import { resolve, join } from 'node:path'; import { pathToFileURL } from 'node:url';
const PW = join(homedir(), '.claude/skills/screenshot-verify/node_modules/playwright/index.js');
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const FILES = process.argv.length > 2 ? process.argv.slice(2) : ['/tmp/courtyard-head.html', resolve('courtyard.html')];
const SEEDS = [1, 3, 7, 11, 19, 42, 101, 1234, 5, 13];
const STEP = 0.25, DAYS = 30;
const b = await chromium.launch();
for (const file of FILES){
  const tot = { windy:[0,0], calm:[0,0], cls:0, n:0, slope:0, inRain:[0,0], mid:0 }; const fronts = [];
  for (const seed of SEEDS){
    const p = await b.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
    await p.goto(pathToFileURL(file).href + `?pause&seed=${seed}&t=0`); await p.waitForFunction(() => window.__warp);
    const r = await p.evaluate(({STEP, DAYS}) => {
      window.__reseed(); window.__setTime(0);
      const o = { windy:[0,0], calm:[0,0], cls:0, n:0, slope:0, inRain:[0,0], mid:0, front:null };
      const hps = STEP * 24 / DAY_LEN; let prev = windF(); let dayLog = {};
      for (let i = 0; i < DAYS * DAY_LEN / STEP; i++){
        window.__warp(STEP); const w = windF(), wd = windyDay();
        o[wd?'windy':'calm'][0] += w; o[wd?'windy':'calm'][1]++; o.n++; if (isWindy()) o.cls++;
        if (w > 0 && w < 1) o.mid++;
        if (raining){ o.inRain[0] += w; o.inRain[1]++; }
        o.slope = Math.max(o.slope, Math.abs(w - prev) / hps); prev = w;
        if (!wd && hour >= 10 && hour <= 14){ const k = day; (dayLog[k] ||= {min:9, max:-9, rain:false, cmin:9, cmax:-9});
          const L = dayLog[k]; L.min = Math.min(L.min, w); L.max = Math.max(L.max, w); L.rain ||= raining; L.cmin = Math.min(L.cmin, cloudCover()); L.cmax = Math.max(L.cmax, cloudCover());
          if (!o.front && L.max - L.min > 0.5 && !L.rain && L.min < 0.1 && hour > 13.9) o.front = { day: k, t10: +((k * DAY_LEN) + (10 - 6) / 24 * DAY_LEN + (simT - day * DAY_LEN - (hour - 6) / 24 * DAY_LEN)).toFixed(1), simT: +simT.toFixed(1), hour: +hour.toFixed(2), ...L }; }
      }
      return o;
    }, {STEP, DAYS});
    await p.close(); if (errs.length) console.log(seed, 'ERR', errs);
    for (const k of ['windy','calm','inRain']){ tot[k][0] += r[k][0]; tot[k][1] += r[k][1]; }
    tot.cls += r.cls; tot.n += r.n; tot.mid += r.mid; tot.slope = Math.max(tot.slope, r.slope);
    if (r.front) fronts.push({ seed, ...r.front });
  }
  console.log(`${file}\n  windy-day mean ${(tot.windy[0]/tot.windy[1]).toFixed(3)}  calm-day mean ${(tot.calm[0]/tot.calm[1]).toFixed(3)}  windy CLASS ${(100*tot.cls/tot.n).toFixed(1)}% of samples  max slope ${tot.slope.toFixed(3)}/h (cap 0.400)  mid ${tot.mid}/${tot.n}  wind inside rain ${(tot.inRain[0]/Math.max(1,tot.inRain[1])).toFixed(3)} (${tot.inRain[1]} samples)`);
  console.log('  calm days with a dry front building 10-14h:', fronts.slice(0,6).map(f=>`seed ${f.seed} day ${f.day} simT@14h ${f.simT} wind ${f.min.toFixed(2)}->${f.max.toFixed(2)} cloud ${f.cmin.toFixed(2)}->${f.cmax.toFixed(2)}`).join(' | ') || 'none');
}
await b.close();
