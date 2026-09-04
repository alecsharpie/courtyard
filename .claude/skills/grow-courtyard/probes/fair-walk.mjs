#!/usr/bin/env node
/* b204 — how long is a fair-goer's walk, from the alley gate to the slot? The far end of
 * any re-offered gathering is bounded by this: a set-out that lands after fairEnd() is
 * not an arrival. Tagged by identity each step; hours, not seconds. */
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const PW = homedir() + '/.claude/skills/screenshot-verify/node_modules/playwright/index.js';
const { chromium } = (await import(pathToFileURL(PW).href)).default;
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SRC = resolve(arg('--file', 'courtyard.html'));
const SEEDS = arg('--seeds', '7,42,1234,555,90210,31337').split(',').map(Number);
const DAYS = +arg('--days', 26);
const b = await chromium.launch();
const walks = [];
for (const seed of SEEDS){
  const page = await b.newPage({ viewport: { width: 1280, height: 700 } });
  await page.goto(pathToFileURL(SRC).href + `?seed=${seed}&pause&t=2`);
  await page.waitForFunction('typeof __warp === "function"');
  const r = await page.evaluate(`(() => {
    __reseed();
    while (day < 2) __warp(1);
    const d0 = day, out = [];
    while (day < d0 + ${DAYS}){
      __warp(0.25);
      for (const a of agents){
        if (!a.fair) continue;
        if (a.__t0 === undefined){ a.__t0 = hour; a.__d = day; }
        if (a.stopped && a.__t1 === undefined){ a.__t1 = hour;
          out.push({ day:a.__d, set:+a.__t0.toFixed(2), got:+hour.toFixed(2),
                     walk:+(hour - a.__t0).toFixed(2), end:+fairEnd().toFixed(2),
                     left:+(fairEnd() + 1.5 - hour).toFixed(2), sp:+a.speed.toFixed(2) }); }
      }
    }
    return out;
  })()`);
  for (const w of r) walks.push({ seed, ...w });
  await page.close();
}
await b.close();
const ws = walks.map(w => w.walk).sort((a,b)=>a-b);
const q = p => ws[Math.min(ws.length-1, Math.floor(p*ws.length))];
console.log(`\nfair arrivals ${ws.length}   walk hours  min ${q(0).toFixed(2)}  p25 ${q(.25).toFixed(2)}  med ${q(.5).toFixed(2)}  p75 ${q(.75).toFixed(2)}  p90 ${q(.9).toFixed(2)}  max ${q(.999).toFixed(2)}`);
const ls = walks.map(w => w.left).sort((a,b)=>a-b);
const ql = p => ls[Math.min(ls.length-1, Math.floor(p*ls.length))];
console.log(`hours of FAIR LEFT at arrival (fairEnd+1.5 - arrival)  min ${ql(0).toFixed(2)}  p05 ${ql(.05).toFixed(2)}  p10 ${ql(.10).toFixed(2)}  p25 ${ql(.25).toFixed(2)}  med ${ql(.5).toFixed(2)}`);
console.log('the 10 tightest:', ls.slice(0,10).map(x=>x.toFixed(2)).join(' '));
console.log('arrivals landing AFTER fairEnd:', walks.filter(w=>w.left<1.5).length, 'of', walks.length);
const sp = walks.map(w=>w.sp); console.log('speeds', Math.min(...sp).toFixed(2), Math.max(...sp).toFixed(2));
